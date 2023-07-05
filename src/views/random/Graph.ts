import G6, { Graph, IG6GraphEvent, GraphData, Node } from '@antv/g6';
import { Message } from '@arco-design/web-vue';

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

const unlightColorMap = new Map();
export const gColors: string[] = [];

lightColors.forEach((lcolor, i) => {
  gColors.push('l(0) 0:' + lcolor + ' 1:' + darkColors[i]);
  unlightColorMap.set(gColors[i], 'l(0) 0:' + uLightColors[i] + ' 1:' + uDarkColors[i]);
});

export default class PlayerGraph {
  container?: HTMLElement;
  graph: Graph | null = null;
  constructor(container?: HTMLElement) {
    if (!container) {
      return
    }
    this.container = container;
    const width = container.scrollWidth;
    const height = container.scrollHeight || 500;
    const toolbar = new G6.ToolBar({
      position: { x: 10, y: 150 },
    });
    this.graph = new G6.Graph({
      container: container,
      fitView: true,
      fitViewPadding: 20,
      width,
      height,
      plugins: [toolbar],
      enabledStack: true,
      layout: {
        type: 'circular',
        nodeStrength: -10,
        edgeStrength: 0.1,
        preventOverlap: true,
      },
      modes: {
        default:[{
          type: 'create-edge',
          trigger: 'click',
          shouldBegin: (e: IG6GraphEvent) => {
            if(e.item && e.item instanceof Node) {
              const length = e.item.getEdges().length;
              if(length >= 2) {
                Message.error(`${e.item.getModel().label}已绑定两人`);
                return false;
              }
              return true
            }
            return false;
          },
          shouldEnd: (e: IG6GraphEvent) => {
            if(e.item && e.item instanceof Node) {
              const length = e.item.getEdges().length;
              if(length >= 2) {
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
