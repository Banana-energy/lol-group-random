import G6, { Graph, GraphData, Node, Edge, Item } from '@antv/g6';
import { MenuInstance, Message } from '@arco-design/web-vue';
import debounce from 'lodash.debounce';

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
  container?: HTMLElement;
  graph: Graph | null = null;
  toolbar;
  resize = debounce(() => {
    if (!this.graph || this.graph.get('destroyed')) return;
    if (!this.container) return;
    const width = this.container.getBoundingClientRect().width;
    const height = this.container.getBoundingClientRect().height;
    this.graph.changeSize(width, height);
    this.graph.fitCenter(true);
  }, 500)
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
            item.update({
              state: 'enemy',
            })
            this.setItemState(item, 'bind', false)
            this.setItemState(item, 'enemy', true)
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
            item.update({
              state: 'bind',
            })
            this.setItemState(item, 'bind', true)
            this.setItemState(item, 'enemy', false)
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
          shouldBegin: (e) => {
            if (e.item instanceof Node) {
              startNode = e.item;
            }
            return true
          },
          shouldEnd: (e) => {
            // 不能绑定自己
            if (e.item instanceof Node && e.item === startNode) {
              Message.error('不能绑定自己')
              return false
            }
            return true
          }
        }],
      },
      defaultEdge: {
        type: 'arc',
        label: '绑定',
        state: 'bind',
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

    window.addEventListener('resize', () => {
      this.resize()
    })
  }

  render(data?: GraphData) {
    if (data) {
      this.graph?.read(data);
      data.edges?.forEach((edge) => {
        if (edge.state === 'enemy' && edge.id) {
          const item = this.graph?.findById(edge.id)
          if (item) {
            this.setItemState(item, 'bind', false)
            this.setItemState(item, 'enemy', true)
          }
        }
        if (edge.state === 'bind' && edge.id) {
          const item = this.graph?.findById(edge.id)
          if (item) {
            this.setItemState(item, 'bind', true)
            this.setItemState(item, 'enemy', false)
          }
        }
      })
    }
  }

  setItemState(item: Item, state: string, enabled: boolean) {
    this.graph?.setItemState(item, state, enabled)
  }

  destroy() {
    this.graph?.destroy();
    this.graph = null;
    window.removeEventListener('resize', this.resize);
  }
}
