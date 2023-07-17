import { EdgeConfig, GraphData } from "@antv/g6";

export interface NodeConfig {
  id: string;
  clusterId?: string;
  [key: string]: any;
}

export interface IAlgorithmCallbacks {
  enter?: (param: { current: string; previous: string }) => void;
  leave?: (param: { current: string; previous?: string }) => void;
  allowTraversal?: (param: { previous?: string; current?: string; next: string }) => boolean;
}

export const getNeighbors = (nodeId: string, edges: EdgeConfig[] = [], type?: 'target' | 'source' | undefined): string[] => {
  const currentEdges = edges.filter(edge => edge.source === nodeId || edge.target === nodeId)
  if (type === 'target') {
    // 当前节点为 source，它所指向的目标节点
    const neighborsConverter = (edge: EdgeConfig) => {
      return edge.source === nodeId;
    };
    return currentEdges.filter(neighborsConverter).map((edge) => edge.target || '');
  }
  if (type === 'source') {
    // 当前节点为 target，它所指向的源节点
    const neighborsConverter = (edge: EdgeConfig) => {
      return edge.target === nodeId;
    };
    return currentEdges.filter(neighborsConverter).map((edge) => edge.source || '');
  }

  // 若未指定 type ，则返回所有邻居
  const neighborsConverter = (edge: EdgeConfig) => {
    return (edge.source === nodeId ? edge.target : edge.source) || '';
  };
  return currentEdges.map(neighborsConverter);
}

function initCallbacks(callbacks: IAlgorithmCallbacks = {} as IAlgorithmCallbacks) {

  const initiatedCallback = callbacks;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const stubCallback = () => { };

  const allowTraversalCallback: (param: { previous?: string; current?: string; next: string }) => boolean = (() => {
    const seen: { [key: string]: boolean } = {};
    return ({ next }) => {
      if (!seen[next]) {
        seen[next] = true;
        return true;
      }
      return false;
    };
  })();

  initiatedCallback.allowTraversal = callbacks.allowTraversal || allowTraversalCallback;
  initiatedCallback.enter = callbacks.enter || stubCallback;
  initiatedCallback.leave = callbacks.leave || stubCallback;

  return initiatedCallback;
}

/**
 * @param {GraphData} graphData
 * @param {GraphNode} currentNode
 * @param {GraphNode} previousNode
 * @param {Callbacks} callbacks
 */
function depthFirstSearchRecursive(
  graphData: GraphData,
  currentNode: string,
  previousNode: string,
  callbacks: IAlgorithmCallbacks,
) {
  callbacks.enter?.({
    current: currentNode,
    previous: previousNode,
  });

  const { edges = [] } = graphData

  getNeighbors(currentNode, edges).forEach((nextNode) => {
    if (
      callbacks.allowTraversal?.({
        previous: previousNode,
        current: currentNode,
        next: nextNode,
      })
    ) {
      depthFirstSearchRecursive(graphData, nextNode, currentNode, callbacks);
    }
  });

  callbacks.leave?.({
    current: currentNode,
    previous: previousNode,
  });
}

/**
 * 深度优先遍历图
 * @param data GraphData 图数据
 * @param startNodeId 开始遍历的节点的 ID
 * @param originalCallbacks 回调
 */
export default function depthFirstSearch(
  graphData: GraphData,
  startNodeId: string,
  callbacks?: IAlgorithmCallbacks,
) {
  depthFirstSearchRecursive(graphData, startNodeId, '', initCallbacks(callbacks));
}
