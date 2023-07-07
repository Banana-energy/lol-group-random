import G6, { Graph, IG6GraphEvent, GraphData, Node, NodeConfig, Edge } from '@antv/g6';
import { MenuInstance, Message } from '@arco-design/web-vue';

const lightColors = [
  '#8FE9FF',
  '#87EAEF',
  '#FFC9E3',
  '#A7C2FF',
  '#FFA1E3',
  '#FFE269',
  '#BFCFEE',
  '#FFA0C5',
  '#D5FF86',
];
const darkColors = [
  '#7DA8FF',
  '#44E6C1',
  '#FF68A7',
  '#7F86FF',
  '#AE6CFF',
  '#FF5A34',
  '#5D7092',
  '#FF6565',
  '#6BFFDE',
];
const uLightColors = [
  '#CFF6FF',
  '#BCFCFF',
  '#FFECF5',
  '#ECFBFF',
  '#EAD9FF',
  '#FFF8DA',
  '#DCE2EE',
  '#FFE7F0',
  '#EEFFCE',
];
const uDarkColors = [
  '#CADBFF',
  '#A9FFEB',
  '#FFC4DD',
  '#CACDFF',
  '#FFD4F2',
  '#FFD3C9',
  '#EBF2FF',
  '#FFCBCB',
  '#CAFFF3',
];

const unlightColorMap: Map<string, string> = new Map();
export const gColors: string[] = [];

lightColors.forEach((lcolor, i) => {
  gColors.push('l(0) 0:' + lcolor + ' 1:' + darkColors[i]);
  unlightColorMap.set(gColors[i], 'l(0) 0:' + uLightColors[i] + ' 1:' + uDarkColors[i]);
});

export default class PlayerGraph {
  static bindGraph: NodeConfig[][]
  container?: HTMLElement;
  graph: Graph | null = null;
  toolbar;
  constructor(container?: HTMLElement, contextmenu?: MenuInstance) {
    if (!container) {
      return
    }
    this.container = container;
    const width = container.scrollWidth;
    const height = container.scrollHeight || 500;
    this.toolbar = new G6.ToolBar({
      position: { x: 10, y: 150 },
    });
    const menu = new G6.Menu({
      getContent() {
        return contextmenu?.$el
      },
      handleMenuClick: (target, item) => {
        const isNode = item instanceof Node;
        const isEdge = item instanceof Edge;
        if (target.innerText === '删除') {
          if (isNode) {
            const edges = item.getEdges();
            const length = edges.length;
            for (let i = 0; i < length; i++) {
              const edge = edges[i];
              this.graph?.removeItem(edge);
            }
          }
          Message.success('删除成功');
          this.graph?.removeItem(item)
        }
        if (target.innerText === '敌对') {
          if (isEdge) {
            this.graph?.updateItem(item, {
              label: '敌对',
              labelCfg: {
                style: {
                  fill: '#ff4d4f',
                }
              }
            })
          }
        }
        if (target.innerText === '绑定') {
          if (isEdge) {
            this.graph?.updateItem(item, {
              label: '绑定',
              labelCfg: {
                style: {
                  fill: '#873bf4',
                }
              }
            })
          }
        }
      },
      itemTypes: ['node', 'edge'],
    })
    let startNode: Node | null = null;
    this.graph = new G6.Graph({
      container: container,
      fitView: true,
      fitViewPadding: 20,
      width,
      height,
      plugins: [this.toolbar, menu],
      enabledStack: true,
      layout: {
        type: 'circular',
        nodeStrength: -10,
        edgeStrength: 0.1,
        preventOverlap: true,
      },
      modes: {
        default: [{
          type: 'create-edge',
          trigger: 'click',
          shouldBegin: (e: IG6GraphEvent) => {
            if (e.item && e.item instanceof Node) {
              startNode = e.item
              const bindNodes = this.getBindPlayer(e.item)
              if (bindNodes && bindNodes.length >= 3) {
                Message.error(`${e.item.getModel().label}已绑定两人`);
                return false;
              }
              const length = e.item.getEdges().length;
              if (length >= 2) {
                Message.error(`${e.item.getModel().label}已绑定两人`);
                return false;
              }
              return true
            }
            return false;
          },
          shouldEnd: (e: IG6GraphEvent) => {
            const hasBind = startNode?.getEdges()
            if (hasBind?.find((edge) => edge.getTarget()?.get?.('id') === e.item?.get('id') || edge.getSource()?.get?.('id') === e.item?.get('id'))) {
              Message.error(`${e.item?.getModel().label}已绑定该玩家`);
              return false
            }
            if (e.item && e.item instanceof Node) {
              const bindNodes = this.getBindPlayer(e.item)
              if (bindNodes && bindNodes.length >= 3) {
                Message.error(`${e.item.getModel().label}已被两人绑定`);
                return false;
              }
              const length = e.item.getEdges().length;
              if (length >= 2) {
                Message.error(`${e.item.getModel().label}已被两人绑定`);
                return false;
              }
              return true
            }
            return false;
          }
        }],
      },
      defaultEdge: {
        label: '绑定',
        labelCfg: {
          autoRotate: true,
          style: {
            fill: '#873bf4',
            fontSize: 16,
            fontWeight: 700,
          }
        },
        style: {
          stroke: '#bae7ff',
          lineWidth: 2,
        }
      }
    })

    const graph = this.graph;
    graph.on('node:dragstart', (e) => {
      graph?.layout();
      refreshDragedNodePosition(e);
    });
    graph.on('node:drag', function (e) {
      refreshDragedNodePosition(e);
    });
    graph.on('node:dragend', (e: IG6GraphEvent) => {
      if (e.item) {
        e.item.get('model').fx = null;
        e.item.get('model').fy = null;
      }
    });

    window.addEventListener('resize', this.resize)
  }

  getBindPlayer(node: Node) {
    if (PlayerGraph.bindGraph) {
      return PlayerGraph.bindGraph.find((nodes) => nodes.find((n) => n.id === node.get('id')))
    }
    return
  }

  resize() {
    if (!this.graph || this.graph.get('destroyed')) return;
    if (!this.container || !this.container.scrollWidth || !this.container.scrollHeight) return;
    this.graph.changeSize(this.container.scrollWidth, this.container.scrollHeight);
  }

  render(data?: GraphData) {
    this.graph?.data(data);
    this.graph?.render();
  }

  destroy() {
    this.graph?.destroy();
    this.graph = null;
    window.removeEventListener('resize', this.resize);
  }
}

function refreshDragedNodePosition(e: IG6GraphEvent) {
  if (e.item) {
    const model = e.item.get('model');
    model.fx = e.x;
    model.fy = e.y;
  }
}
