import { Injectable } from '@angular/core';
import { ContivDataModel } from '../../models/contiv-data-model';
import { NodeData } from '../../../d3-topology/topology/topology-data/interfaces/node-data';
import { EdgeData } from '../../../d3-topology/topology/topology-data/interfaces/edge-data';
import { TopologyType } from '../../interfaces/topology-type';
import { K8sNodeModel } from '../../models/k8s/k8s-node-model';
import { TopoColors } from '../../constants/topo-colors';
import { K8sPodModel } from '../../models/k8s/k8s-pod-model';
import { LayoutService } from '../../services/layout.service';

@Injectable({
  providedIn: 'root'
})
export class ServicesTopologyService {

  constructor(
    private layoutService: LayoutService
  ) { }

  public getTopologyData(data: ContivDataModel): {nodes: NodeData[], links: EdgeData[], type: TopologyType} {
    this.layoutService.podCount = {};
    const nodesTopoData = this.createNodes(data);
    const linksTopoData = this.createLinks(data);

    return {nodes: nodesTopoData, links: linksTopoData, type: 'svc'};
  }

  private createNodes(data: ContivDataModel): NodeData[] {
    let nodesTopoData: NodeData[] = [];

    data.contivData.forEach(d => {
      const node = this.createTopologyNode(d.node);
      const pods = d.pods.map(p => this.createTopologyPod(p));
      const vswitch = this.createTopologyVswitch(d.vswitch);
      const vppPods = d.vppPods.map(p => this.createTopologyVppPod(p, vswitch));

      nodesTopoData = nodesTopoData.concat([node], pods, [vswitch], vppPods);
    });

    return nodesTopoData;
  }

  private createLinks(data: ContivDataModel): EdgeData[] {
    const nodesLinks = this.layoutService.connectNodes(data);
    const podsLinks = this.layoutService.connectPodsToHost(data);
    const vswitchLinks = this.layoutService.connectVswitchesToHost(data);
    const vppLinks = this.layoutService.connectVppPodsToVswitch(data);

    return [].concat(nodesLinks, podsLinks, vswitchLinks, vppLinks);
  }

  private createTopologyNode(node: K8sNodeModel): NodeData {
    const savedPosition = this.layoutService.getSavedPosition(node.name, 'svc');
    const position = savedPosition ? savedPosition : {x: 0, y: 0};

    return {
      id: node.name,
      label: node.name,
      x: position.x,
      y: position.y,
      fx: savedPosition ? savedPosition.x : null,
      fy: savedPosition ? savedPosition.y : null,
      stroke: TopoColors.NODE_STROKE,
      nodeType: 'node',
      IP: node.ip
    };
  }

  private createTopologyVswitch(vswitch: K8sPodModel): NodeData {
    const savedPosition = this.layoutService.getSavedPosition(vswitch.name, 'svc');
    const position = savedPosition ? savedPosition : {x: 0, y: 0};

    const node: NodeData = {
      id: vswitch.name,
      label: vswitch.name,
      x: position.x,
      y: position.y,
      fx: savedPosition ? savedPosition.x : null,
      fy: savedPosition ? savedPosition.y : null,
      nodeType: 'vswitch',
      IP: vswitch.podIp,
      namespace: vswitch.namespace,
      stroke: TopoColors.VSWITCH_STROKE
    };

    return node;
  }

  private createTopologyPod(pod: K8sPodModel): NodeData {
    const savedPosition = this.layoutService.getSavedPosition(pod.name, 'svc');
    const position = savedPosition ? savedPosition : {x: 0, y: 0};

    const node: NodeData = {
      id: pod.name,
      label: pod.name,
      x: position.x,
      y: position.y,
      fx: savedPosition ? savedPosition.x : null,
      fy: savedPosition ? savedPosition.y : null,
      nodeType: 'pod',
      IP: pod.podIp,
      namespace: pod.namespace
    };

    return node;
  }

  private createTopologyVppPod(pod: K8sPodModel, vswitch: NodeData): NodeData {
    const savedPosition = this.layoutService.getSavedPosition(pod.name, 'svc');
    const position = savedPosition ? savedPosition : {x: 0, y: 0};

    const node: NodeData = {
      id: pod.name,
      label: pod.name,
      x: position.x,
      y: position.y,
      fx: savedPosition ? savedPosition.x : null,
      fy: savedPosition ? savedPosition.y : null,
      nodeType: 'vppPod',
      IP: pod.podIp,
      namespace: pod.namespace
    };

    return node;
  }
}
