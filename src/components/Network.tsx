import * as React from "react";
import "./Network.css";
import { EvoNode } from "../types";
import * as dagre from 'dagre';
import { Node, GraphEdge } from 'dagre';
import { getColor } from "../helper";

// export interface Node {
//     class?:string
// }
const node_w: number = 110, node_h: number = 20, margin: number = 10;

export interface Props {
    nodes: EvoNode[],
    name: string
}
export interface State {
    x: number,
    y: number,
    scale: number,
    nodes: Node[],
    edges: GraphEdge[],
    h: number,
    w: number,
    selectedLayers: string[]
}
export default class Network extends React.Component<Props, State> {
    public graphWindow: any; shiftDown: boolean
    constructor(props: Props) {
        super(props)
        this.state = {
            x: 1,
            y: 1,
            scale: 1,
            nodes: [],
            edges: [],
            h: 0,
            w: 0,
            selectedLayers: []
        }
        this.shiftDown = false
        this.selectLayer = this.selectLayer.bind(this)
    }
    getDag(layers: EvoNode[], selectedLayers: string[]) {
        const nodeH = 20, nodeW = 150, expandW = 150, expandH = 200
        let g = new dagre.graphlib.Graph();
        g.setGraph({ 
            ranksep: node_h * 1.5,
            marginx: margin,
            marginy: margin,
            rankdir: 'TB',
            edgesep: node_w * 0.02 
        });
        g.setDefaultEdgeLabel(() => { return {}; });
        layers.forEach(layer => {
            // let label = `${layer.name}:${layer.class_name}`
            g.setNode(layer.name, { 
                label: layer.name,
                width: nodeW,
                height: nodeH,
                className: layer.class_name,
                config: layer.config,
                expand: false
            })
            //IR model or keras model
            if (layer.inbound_nodes.length > 0) {
                let inputs = layer.inbound_nodes[0]
                inputs.forEach((input:string[]|any[]) => {
                    g.setEdge(input[0], layer.name)
                })
            }
        })
        
        // Selected Layers
        selectedLayers.forEach(layer => {
            let node = g.node(layer)
            let details = JSON.stringify(node.config, null, 2).split('\n')
            g.setNode(layer, {
                ...node,
                width: expandW,
                height: details.length * 12 + 30,
                details: details,
                expand: true
            })
        })

        dagre.layout(g)
        let nodes:Node[] = [], edges:GraphEdge[] = []
        g.nodes().forEach((v) => {
            if (g.node(v)) {
                nodes.push(g.node(v))
            }
        })
        g.edges().forEach((e) => {    
            edges.push(g.edge(e))
        });
        let height = g.graph().height,
            width = g.graph().width
        return { nodes, edges, height, width }
    }
    drawNodes(nodes: Node[]) {
        return (<g className="nodes" >
            {nodes.map((node: Node) => {
                
                return <g key={node.label}
                          className="node"
                          transform={`translate (${node.x - node.width / 2}, ${node.y - node.height / 2})`}
                          onClick={() => this.selectLayer(node)}
                          style={{ cursor: "pointer"}}>
                    <rect width={node.width} height={node.height}
                        style={{ fill: getColor(node.op), strokeWidth: 3 }} 
                        className="node"/>
                    {node.expand ?
                        (<g><text textAnchor="middle"
                            fill="white"
                            fontSize={10}
                            x={node.width / 2}
                            y={12}>
                            {node.label}
                        </text>
                        <text textAnchor="middle"
                            fill="white"
                            fontSize={10}
                            x={node.width / 2}
                            y={22}>
                            -----------------------------
                        </text>
                        {JSON.stringify(node.config, null, 2).split('\n').map((str:string, idx: number) => {
                            return (<text textAnchor="left"
                                fill="white"
                                xmlSpace="preserve"
                                fontSize={10}
                                x={5}
                                y={12 * idx + 35}>
                                {str}
                            </text>)})}
                        </g>)
                    : <text textAnchor="middle"
                        fill="white"
                        fontSize={10}
                        x={node.width / 2}
                        y={node.height * 0.6}>
                        {node.label}
                    </text>}
                </g>
            })}
        </g>)
    }
    oneEdge(edge: GraphEdge, i: number) {
        let { points, from, to } = edge
        let len = points.length
        if (len === 0) { return }
        let start = `M ${points[0].x} ${points[0].y}`
        let vias = [];
        for (let i = 0; i < len - 2; i += 2) {
            let cPath = [0, 1, 2].map(k => `${points[i + k].x} ${points[i + k].y}`)
            vias.push(`M ${points[i].x} ${points[i].y} C ${cPath}`)

        }
        let pathData = `${start}  ${vias.join(' ')}`
        return <g className='link' key={`${i}_${from}->${to}`}>
            <path
                d={pathData}
                stroke="gray"
                fill='none'
                strokeWidth="2"
            // markerEnd="url(#arrow)" 
            />
            {/* <path
                key={`${edge.from}->${edge.to}_mask`}
                d={pathData}
                stroke="transparent"
                fill='transparent'
                strokeWidth="6" /> */}
        </g>

    }
    drawEdges(edges: GraphEdge[]) {
        return (<g className="edges">
            {edges.map((edge: GraphEdge, i: number) => {
                return this.oneEdge(edge, i)
            })}
        </g>)
    }
    // scroll(e: any) {
    //     if (this.shiftDown) {
    //         this.zoom(e.deltaY)
    //     } else {
    //         let { y } = this.state
    //         this.setState({ y: y + e.deltaY })
    //     }
    // }
    // zoom(delta: number) {
    //     let { scale } = this.state
    //     scale *= (delta > 0 ? 1.1 : 0.9)
    //     this.setState({ scale })
    // }

    selectLayer(layer: Node) {
        console.log(layer)
        let { selectedLayers } = this.state,
            idx = selectedLayers.indexOf(layer.label)
        if (idx === -1) {
            selectedLayers.push(layer.label)
        } else {
            selectedLayers.splice(idx, 1)
        }
        console.log(selectedLayers)
        let { nodes: EvoNodes } = this.props
        let { nodes, edges } = this.getDag(EvoNodes, selectedLayers)
        this.setState({ nodes, edges, selectedLayers })
    }

    componentWillMount() {
        /*if (this.props.nodes.length !== nextProps.nodes.length) {
            let { nodes: EvoNodes } = nextProps
            let { nodes, edges } = this.getDag(EvoNodes)
            // let scale: number = Math.min((this.graphWindow.clientHeight - 2 * margin) / h, (this.graphWindow.clientWidth - 2 * margin) / w)
            // let x: number = margin + 0.5 * this.graphWindow.clientWidth - 0.5 * w
            // let y: number = margin
            this.setState({ nodes, edges })
        }*/
        let { nodes: EvoNodes } = this.props
        let { nodes, edges } = this.getDag(EvoNodes, [])
        this.setState({ nodes, edges })
    }
    componentWillReceiveProps(nextProps: Props) {
        if (nextProps.name !== this.props.name) {
            let { nodes: EvoNodes } = nextProps
            let { nodes, edges } = this.getDag(EvoNodes, [])
            this.setState({ nodes, edges })
        }
    }

    // componentWillUpdate() {
    //     if(this.first && this.props.nodes.length > 0){
    //         this.first = false
    //         let { h, w } = this.getDag(this.props.nodes)
    //         let svg_h = Math.max(h, this.graphWindow.clientHeight)
    //         let svg_w = Math.max(w, this.graphWindow.clientWidth)
    //         let scale: number = Math.min((this.graphWindow.clientHeight - 2 * margin) / svg_h, (this.graphWindow.clientWidth - 2 * margin) / svg_w)
    //         let x:number = margin + 0.5 * this.graphWindow.clientWidth - 0.5 * w
    //         let y:number = margin
    //         console.info(h, w)
    //         this.setState({x, y, scale})
    //     }
    // }
    render() {
        console.log('render = ', this.props.name)
        let { nodes, edges, x, y, scale } = this.state
        let svgWidth = Math.max.apply(null, nodes.map((node: Node) => node.x)) + 70,
            svgHeight = Math.max.apply(null, nodes.map((node: Node) => node.y)) + 20
        if (nodes.length > 0) {
            // let { nodes, edges} = this.getDag(EvoNodes)
            // let svg_h = Math.max(h, this.graphWindow.clientHeight)
            // let svg_w = Math.max(w, this.graphWindow.clientWidth)
            // let svg_h = this.graphWindow.clientHeight
            // let svg_w = this.graphWindow.clientWidth
            return (
            <div className="wrapped-graph">
                <svg
                    width={`${svgWidth}px`}
                    height={`${svgHeight}px`}
                >
                    <g
                        className="graph"
                        // transform={`translate(${x+40}, ${y}) scale(${scale})`}
                    >
                        {this.drawEdges(edges)}
                        {this.drawNodes(nodes)}
                    </g>
                </svg>
            </div>)
        } else {
            return <div className="graphWindow" ref={(ref) => { this.graphWindow = ref }} />
        }

    }
}
