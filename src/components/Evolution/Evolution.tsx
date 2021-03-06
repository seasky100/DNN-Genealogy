import * as React from 'react'
import * as dagre from 'lib/dagre.js'
import { Edge } from 'lib/@types/dagre/'
import { Transition } from 'react-transition-group'
// import * as graphlib from "graphlib"
import './Evolution.css'
import axios from 'axios'
import * as d3 from 'd3'
import { NN, NodeTextInfo, Node, GraphEdge, Point } from 'types'
import { getColor } from 'helper/';
import { TreeSelect, Button, Dropdown, Menu, Tooltip, Switch, Modal } from 'antd'
import moment from 'moment';
import NNNode from './NNNode';
import Legend, { LegendProps } from './Legend';
import ExtendNode from './ExtendNode';
// import { showDetailedStructure } from './ImageModel'
import ArchitectureCompare from 'components/ArchitectureCompare/'
import { nonsequenceDatasets, nonsequenceBenchmarks } from 'constants/';
import { initNN } from 'constants/index'

let imgSize = require('assets/ratio.json')



// const {TreeNode} = TreeSelect

export interface Props {
    arc: string,
    app: string,
    train: string,
    textInfo: { [key: string]: NodeTextInfo },
    dnns: any,
    onSelectNN: (currentNetworks: NN[], selectedNN: NN) => void,
    onSelectNNMotion: (op: number) => void,
    onSelectDatabase: (db: string) => void
}

const appData = [
    // {
    //     label: "all",
    //     key: "all",
    //     value: "1."
    // }, 
    {
        label: 'classification',
        key: 'classification',
        value: '1.',
        selectable: false,
        children:[
            {
                label:"non-euclidean data",
                key: "non-euclidean data",
                value:'1.0.'
            },
            {
                label:'euclidean data',
                key: 'euclidean data',
                selectable: false,
                value:'1.',
                children: [{
                    label: 'Non-Sequential Data',
                    key: 'Non-Sequential Data',
                    value: '1.1.'
                },
                {
                    label: 'Sequential Data',
                    key: 'Sequential Data',
                    value: '1.2.'
                }],
            },
        ],
    },
    {
        label: 'Object Detection & Instance Segmentation',
        key: 'Object Detection',
        value: '2.'
    },
    {
        label: 'Semantic Segmentation',
        key: 'Semantic Segmentation',
        value: '3.'
    }
]

let CNN = ['streamlined', 'skip connections', 'multi-branch', 'depthwise separable conv']
let RNN = ['stacked', 'bidirectional', 'multiple time scale', 'gated', 'tree-structured']

let legend = (Names: string[]) => {
    let items = {}
    Names.forEach((name: string, i: number) => {
        // let key = String.fromCharCode(i + 97)
        let item = {
            name,
            click: false,
            hover: false
        }
        items[name] = item
    })
    return items
}
let legendCNN = legend(CNN)
let legendRNN = legend(RNN)

export interface State {
    datum: NN[],
    nodes: Node[],
    edges: GraphEdge[],
    selectedNode: Node | undefined,
    h: number | undefined,
    w: number | undefined,
    appValue: string,
    // appData: any,
    topDoi: Node[],
    topParent: Node | undefined,
    topChild: Node | undefined,
    pinNodes: string[],
    scale: number,
    transX: number,
    transY: number,
    hoverEdge: string,
    showLabel: boolean,
    legend: LegendProps['items'],
    modalVisible: boolean,
    detailed: string,
    glyphZoom: boolean,
    glyphZoomLabel: string
}

const nodeH = 100, nodeW = 400, margin = 30, labelL = 20, tabH = 20,
    // expandH = 180 + tabH, 
    expandW = 300,
    glyphXmargin = 5,
    r = nodeH / 3,
    boxH = 10,
    labelFont = 13,
    textMargin = 20,
    r_api = 1, r_dist = -1, r_diff = 0 // factors for DOI calculation

// for the lablel fade in/out animiation 
const duration = 1000;

const defaultStyle = {
    transition: `opacity ease-in-out`,
    opacity: 0
}

const transitionStyles = {
    entering: { opacity: 0, transition: `opacity 1000ms ease-in-out`, },
    entered: { opacity: 1 },
    exited: { opacity: 0 }
};

export default class Evolution extends React.Component<Props, State>{
    public updateEdge: boolean = true;
    ref: any; x0: number; y0: number; dragFlag = false
    constructor(props: Props) {
        super(props)
        this.getData = this.getData.bind(this)
        this.selectNode = this.selectNode.bind(this)
        this.onclickMenu = this.onclickMenu.bind(this)
        this.pinNode = this.pinNode.bind(this)
        this.handleMouseWheel = this.handleMouseWheel.bind(this)
        this.pan = this.pan.bind(this)
        this.mouseDown = this.mouseDown.bind(this)
        this.mouseUp = this.mouseUp.bind(this)
        this.selectItem = this.selectItem.bind(this)
        this.showModal = this.showModal.bind(this)
        this.changeGlyphZoom = this.changeGlyphZoom.bind(this)
        this.state = {
            datum: [],
            nodes: [],
            edges: [],
            selectedNode: undefined,
            w: 0,
            h: 0,
            appValue: '1.1.',
            // appData: [],
            topDoi: [],
            topChild: undefined,
            topParent: undefined,
            scale: 1,
            pinNodes: [],
            transX: 0,
            transY: 0,
            hoverEdge: '',
            showLabel: false,
            legend: legendCNN,
            modalVisible: false,
            detailed: '',
            glyphZoom: false,
            glyphZoomLabel: ''
        }
    }
    getData(appValue: string) {
        // textinfo data
        // let resText = await axios.get('../../data/textInfo.json')
        // this.textInfo = resText.data
        // evolution data
        // let res = await axios.get('../../data/dnns.json'),
        let datum: NN[] = this.props.dnns

        datum = datum.filter((d: NN) => {
            return d.application[0].startsWith(appValue)
        })
        datum.forEach((d: NN) => {

            let pubDate = moment(d.date, 'YYYY-MM-DD'),
                dif = moment().diff(pubDate, 'months')
            d.api = (d.citation / dif) || 0
        })
        // normalize the api value
        let maxApi = Math.max(...datum.map(d => d.api || 1))
        datum.forEach(d => {
            d.api = Math.log2((d.api || 1) / maxApi + 1)
            d.doi = d.api
        })
        let { nodes, edges, width: w, height: h, topDoi, scale, transX, transY } = this.getDag(datum, appValue)
        // let appRes = await axios.get('../../data/taxonomy.json')
        // let appData = appRes.data.children[0]

        // const label = (d:any)=>{
        //     d.label = d.name
        //     d.value = d.name
        //     if(d.children){
        //         d.children.forEach(label)
        //     }
        // }

        // label(appData)

        // Get benchmarks of datasets
        if (appValue === '1.1.' && nonsequenceBenchmarks && nonsequenceBenchmarks.length === 0) {
            let stat: any[] = []
            for (let d of datum) {
                for (let name of d.names) {
                    stat.push({ ...name, parent: d.ID })
                }
            }
            for (let dataset of nonsequenceDatasets) {
                let benchmarkData = stat.map((d: any) => d[dataset])
                let sortedData = benchmarkData.sort((x, y) => x - y).filter((x) => x)
                let length: number = sortedData.length
                let bpm = stat.filter((st: any) => st[dataset] === sortedData[0])[0]
                nonsequenceBenchmarks.push({
                    dataset: dataset,
                    minimum: sortedData[0],
                    lowerQuartile: sortedData[Math.floor(length / 4)],
                    median: sortedData[Math.floor(length / 2)],
                    higherQuartile: sortedData[Math.floor(length * 3 / 4)],
                    maximum: sortedData[length - 1],
                    range: sortedData[length - 1] - sortedData[0],
                    bestPerformanceModel: {
                        name: bpm.name,
                        parent: bpm.parent
                    }
                })
            }
            // console.log(nonsequenceBenchmarks)
        }
        this.setState({ nodes, edges, w, h, datum, topDoi, transX, transY, scale })
    }
    getDag(datum: NN[], appValue: string, selectedNode: Node | undefined = undefined) {
        let selectedID = selectedNode ? selectedNode.ID : undefined
        let { pinNodes } = this.state
        let dag = new dagre.graphlib.Graph();

        dag.setGraph({
            ranksep: appValue === '1.1' ? nodeW * 1.1 : nodeW * 1.5,
            marginx: margin * 6,
            marginy: margin * 2,
            rankdir: 'LR',
            edgesep: nodeH * 1,
            nodesep: nodeH * 0.3,
            // ranker: "tight-tree"
            ranker: appValue === '1.1.' ? 'longest-path' : 'tight-tree'
        });
        dag.setDefaultEdgeLabel(() => { return {}; });

        // control the min value after resizing the nodes, 
        const resizeNode = (w: number, ratio: number) => {
            // let newW = w * ratio
            // if (newW > w * 0.3) {
            //     return newW
            // } else {
            //     return w * 0.3
            // }
            return w * (.4 * ratio + .6)
        }

        // initialize the dag
        datum.forEach((node: NN) => {
            // let label = `${layer.name}:${layer.class_name}`

            dag.setNode(node.ID, {
                ...node,
                label: node.ID,
                api: node.api,
                doi: node.api,
                arc: node.architecture
                // width: nodeW,
                // height: nodeH,
            })
            // IR model or keras model
            if (node.parents.length > 0) {
                node.parents.forEach((parent: any) => {
                    dag.setEdge(
                        parent.ID,
                        node.ID,
                        {
                            label_s: parent.link_info_s,
                            label_l: parent.link_info_l,
                            from: parent.ID,
                            to: node.ID,
                            cate: parent.link_category.split('=>')[0].split('+'),
                        }
                    )
                })
            }
        })
        // const getEdgeWeight = (e: dagre.Edge) => dag.node(e.v).api + dag.node(e.w).api
        const getEI = (v: Edge) => 1
        let distanceDict: any
        if (selectedNode) {
            distanceDict = dagre.graphlib.alg
                .dijkstra(
                    dag, selectedNode.label,
                    (e: Edge) => (e.v === selectedNode.label ? 1 : 0.8),
                    (v: string) => dag.nodeEdges(v)
                )
        }
        // let tree = dagre.graphlib.alg.prim(dag, getEdgeWeight)
        // console.info(tree.edges)

        // calculate doi for each node
        let minDoi = Infinity, maxDoi = -Infinity
        dag.nodes().forEach((v: string) => {
            if (dag.node(v)) {
                let node = dag.node(v),
                    api = node.api || 1,
                    distance = selectedNode ? distanceDict[v].distance : 0

                // let api_diff = Math.max(
                //     api,
                //     Math.max(...(dag.neighbors(v) || []).map((neighbor: Node) => {
                //         return r_diff * (neighbor.api || 0) / getEI({ v, w: neighbor.label })
                //     }))
                // ),
                // doi = api_diff + r_dist * distance
                let doi = api + r_dist * distance 
                doi = isFinite(doi)?doi:0
                dag.setNode(v, {
                    ...node,
                    api: api,
                    doi: doi,
                    isZoomed: false
                })

                if (minDoi > doi) {
                    minDoi = doi
                }
                if (maxDoi < doi) {
                    maxDoi = doi
                }
            }
        })
        // set edge weight
        // dag.edges().forEach((e, i) => {
        //     let edge: GraphEdge = dag.edge(e)
        //     // edge.weight = getEdgeWeight(e)
        // });

        // //calculate the top N doi nodes, and update their size
        // let topParent: Node | undefined = undefined
        // let topChild: Node | undefined = undefined
        // if (selectedNode) {
        //     let parents = dag.predecessors(selectedNode.label),
        //         children = dag.successors(selectedNode.label)
        //     if (parents && parents.length != 0) {
        //         topParent = parents.map(v => dag.node(v)).sort((a, b) => b.doi - a.doi)[0]
        //         dag.setNode(topParent.label, {
        //             ...topParent,
        //             width: expandW,
        //             height: expandH
        //         })
        //     }
        //     if (children && children.length != 0) {
        //         topChild = children.map(v => dag.node(v)).sort((a, b) => b.doi - a.doi)[0]
        //         dag.setNode(topChild.label, {
        //             ...topChild,
        //             width: expandW,
        //             height: expandH
        //         })
        //     }

        // }
        // normalize doi to 0-1, resize the node
        dag.nodes().forEach((v: string) => {
            let node = dag.node(v),
                selected: boolean = (v === selectedID),
                pinned: boolean = (pinNodes.indexOf(v) !== -1)
            if (node) {
                node.doi = (node.doi - minDoi) / (maxDoi - minDoi)
                if (isNaN(node.doi)) {
                    node.doi = 1
                }
                dag.setNode(v, {
                    ...node,
                    isZoomed: pinned,
                    width: (pinned ? expandW : resizeNode(nodeW, node.doi)) + 2 * glyphXmargin,
                    height: (pinned) ? expandW * imgSize[v].h / imgSize[v].w + tabH : resizeNode(nodeH, node.doi),
                })
            }
        })

        let topNum = window.innerWidth / 350
        const topN = (nodes: string[], n: number = topNum) => {
            let topDoi: Node[] = []
            for (let i = 0; i < nodes.length; i++) {
                let v = nodes[i]
                let node = dag.node(v)
                // exclude topParent and topChild from topN
                // if ((topChild && v == topChild.label)
                //     || (topParent && v == topParent.label)
                //     || (selectedNode && v == selectedNode.label)) {
                // } else {
                //     topDoi.push(node)
                // }
                topDoi.push(node)
                if (topDoi.length > n) {
                    topDoi.sort((a, b) => (b.doi || 0) - (a.doi || 0))
                    topDoi.pop()
                }
            }
            return topDoi
        }
        let topDoi: Node[] = topN(dag.nodes())

        let ratio = 1 + 0.1 * topNum
        topDoi.forEach((node: Node) => {
            dag.setNode(node.label, {
                ...node,
                isZoomed: true,
                width: expandW * ratio + 2 * glyphXmargin,
                height: (expandW * imgSize[node.label].h / imgSize[node.label].w + tabH) * ratio,
            })
            ratio -= 0.1
        })

        // calculate layout
        dagre.layout(dag)

        // calculate the output
        let nodes: Node[] = [], edges: GraphEdge[] = [],
            height = (dag.graph().height || 0),
            width = dag.graph().width || 0
        dag.nodes().forEach((v: string) => {
            let node = dag.node(v)
            if (node) {
                nodes.push(node)
            }
        })
        // normalize doi to 0~1
        nodes.forEach((node: any) => {
            node.doi = (node.doi - minDoi) / (maxDoi - minDoi)
        })
        dag.edges().forEach((e: Edge) => {
            if (dag.node(e.v) && dag.node(e.w)) {
                var edge = dag.edge(e), 
                typesV = dag.node(e.v).architecture, 
                typesW = dag.node(e.w).architecture,
                VinW = typesV.filter((t:string)=>typesW.includes(t)).length
                edge.weight = VinW/(typesV.length + typesW.length - VinW)
                edges.push(edge)
            }
        })

        let scaleX = this.ref.clientWidth / (width),
            scaleY = this.ref.clientHeight / (height),
            scale = Math.min(
                scaleX,
                scaleY
            ),
            transX = scaleX > scaleY ? (this.ref.clientWidth - width * scale) / 2 : 0,
            transY = scaleY > scaleX ? (this.ref.clientHeight - height * scale) / 2 : 0

        return { nodes, edges, height, width, topDoi, scale, transX, transY }
    }
    drawNodes(nodes: Node[]) {
        let { selectedNode, topDoi, scale, transX, transY, hoverEdge, legend } = this.state,
            selectedID = selectedNode ? selectedNode.ID : undefined,
            apiArr = this.state.nodes.map(d => d.api || 0).sort(d3.ascending)

        return (<g className="nodes" >
            {nodes.map((node: Node) => {
                let selected: boolean = (node.ID === selectedID),
                    isTop: boolean = topDoi.map(d => d.ID).indexOf(node.ID) !== -1,
                    zoomed: boolean = node.isZoomed,
                    hoverNodes = hoverEdge.split('->'),
                    hovered = hoverNodes.indexOf(node.label) !== -1,
                    hoverLegend = false, clickLegend = false, everHover = false, everClick = false
                node.arc.forEach((key: string) => {
                    let item = legend[key]
                    if (item && item.hover) {
                        hoverLegend = true
                    }
                })
                Object.keys(legend).forEach(k => {
                    let item = legend[k]
                    if (item.click) { everClick = true }
                    if (item.hover) { everHover = true }
                })
                return <NNNode
                    key={node.ID}
                    node={node}
                    selected={selected}
                    isTop={isTop}
                    zoomed={zoomed}
                    hovered={hovered}
                    apiArr={apiArr}
                    transX={transX}
                    transY={transY}
                    scale={scale}
                    show={(hoverLegend || !everHover)}
                    selectNode={this.selectNode}
                />
            })}
        </g>)
    }
    drawExtendNodes(nodes: Node[]) {
        let { selectedNode, topDoi, scale, transX, transY, hoverEdge, legend } = this.state,
            selectedID = selectedNode ? selectedNode.ID : undefined,
            apiArr = this.state.nodes.map(d => d.api || 0).sort(d3.ascending)

        return nodes.map((node: Node) => {
            let selected: boolean = (node.ID === selectedID),
                zoomed: boolean = node.isZoomed,
                hoverNodes = hoverEdge.split('->'),
                hovered = hoverNodes.indexOf(node.label) !== -1,
                hoverLegend = false, clickLegend = false, everHover = false, everClick = false
            node.arc.forEach((key: string) => {
                let item = legend[key]
                if (item && item.hover) {
                    hoverLegend = true
                }
            })
            Object.keys(legend).forEach(k => {
                let item = legend[k]
                if (item.click) { everClick = true }
                if (item.hover) { everHover = true }
            })
            return (
                <ExtendNode
                    key={'extended_' + node.ID}
                    zoomed={zoomed}
                    hovered={hovered}
                    scale={scale}
                    transX={transX}
                    transY={transY}
                    tabH={tabH}
                    glyphXmargin={glyphXmargin}
                    node={node}
                    selected={selected}
                    show={hoverLegend || !everHover}
                    selectNode={this.selectNode}
                    onclickMenu={this.onclickMenu}
                    pinNode={this.pinNode}
                    duration={duration}
                    changeGlyphZoom={this.changeGlyphZoom}
                />)
        })
    }
    oneEdge(edge: GraphEdge, i: number) {
        let { points, from, to, label_s, label_l, cate, weight:edgeWeight } = edge,
            { selectedNode, hoverEdge, transX, transY, scale, showLabel, legend } = this.state,
            selectedID = selectedNode ? selectedNode.label : undefined,
            // clickLegend = this.state.legend[cate] ? this.state.legend[cate].click : false,
            // hoverLegend = this.state.legend[cate] ? this.state.legend[cate].hover : false
            clickLegend: boolean = false, hoverLegend: boolean = false,
            everHover = false, everClick = false
        let keyArc = ''
        cate.forEach((k: string) => {
            let item = legend[k]
            if (item && item.click) {
                clickLegend = true
            }
            if (item && item.hover) {
                hoverLegend = true
                keyArc = k
            }
        })
        Object.keys(legend).forEach(k => {
            let item = legend[k]
            if (item.click) { everClick = true }
            if (item.hover) { everHover = true }
        })
        hoverLegend = hoverLegend && everHover
        clickLegend = clickLegend || !everClick

        // a trick. if assign transX, transY, scale to a group, the transition animiation will be wired
        const movePoint = (p: Point, x: number, y: number, s: number) => {
            return { x: p.x * s + x, y: p.y * s + y }
        }
        points = points.map(p => movePoint(p, transX, transY, scale))

        let len = points.length
        if (len === 0) { return }
        let start = `M ${points[0].x} ${points[0].y}`,
            vias = [],
            circles = []
        // // curve
        // for (let i = 0; i < len - 2; i += 2) {
        //     let cPath = [0, 1, 2].map(k => `${points[i + k].x} ${points[i + k].y}`)
        //     vias.push(`C ${cPath}`)

        // }
        // // straight
        // for (let i = 0; i < len; i ++) {

        //     vias.push(`L ${points[i].x} ${points[i].y}`)

        // }
        // refined curve
        const getInter = (p1: Point, p2: Point, n: number) => {
            return `${p1.x * n + p2.x * (1 - n)} ${p1.y * n + p2.y * (1 - n)}`
        }

        const getCurve = (points: Point[]) => {
            let vias = [],
                len = points.length;
            const ratio = 0.5
            for (let i = 0; i < len - 2; i++) {
                let p1, p2, p3, p4, p5;
                if (i === 0) {
                    p1 = `${points[i].x} ${points[i].y}`
                } else {
                    p1 = getInter(points[i], points[i + 1], ratio)
                }
                p2 = getInter(points[i], points[i + 1], 1 - ratio)
                p3 = `${points[i + 1].x} ${points[i + 1].y}`
                p4 = getInter(points[i + 1], points[i + 2], ratio)
                if (i === len - 3) {
                    p5 = `${points[i + 2].x} ${points[i + 2].y}`
                } else {
                    p5 = getInter(points[i + 1], points[i + 2], 1 - ratio)
                }

                let cPath = `M ${p1} L${p2} Q${p3} ${p4} L${p5}`
                vias.push(cPath)

            }
            return vias
        }
        vias = getCurve(points)

        let pathData = `${start}  ${vias.join(' ')}`,
            // change curve path to straight line
            // let pathData = `M ${points[0].x} ${points[0].y} 
            //                 L ${points[points.length - 1].x} ${points[points.length - 1].y}`,
            highlight: boolean = ((from === selectedID) || (to === selectedID)),
            hovered: boolean = (hoverEdge === `${from}->${to}`),
            k = (points[points.length - 1].y - points[0].y) / (points[points.length - 1].x - points[0].x)
        let tooltipTxt = (
            <div>
                <p><b>{from}->{to}:</b></p>
                {label_l.split(';').map((line: string, lineIdx: number) => {
                    return <p key={lineIdx}>{lineIdx + 1}: {line}</p>
                })}
            </div>
        )
        let strokeWidth = 1.5+edgeWeight*0.5, strokeOpacity = 0.15 + edgeWeight*0.8
        return (
            <g className="Edge EdgeGroup" key={`${i}_${from}->${to}`}>
                {
                    <path
                        className="Edge"
                        id={`${from}->${to}`}
                        d={pathData}
                        // stroke={hoverLegend ? getColor(keyArc) : '#999'}
                        // stroke={hoverLegend|| hovered ? '#444' : strokeColor}
                        stroke={hoverLegend || hovered?getColor(keyArc):'#555'}
                        strokeWidth={hoverLegend || hovered?2:strokeWidth}
                        // stroke={(hoverLegend || hovered) && !clickLegend ? '#444' : '#999'}
                        // stroke={clickLegend ? "gray" : getColor(key)}
                        fill="none"
                        // strokeWidth={(hoverLegend || hovered) && !clickLegend ? 2 : 2}
                        // opacity={(hoverLegend|| hovered) ? 1 : (clickLegend ? 0.4 : .4)}
                        // opacity={(hoverLegend || hovered) ? 1 : strokeOpacity}
                        opacity={strokeOpacity}
                    />
                }

                <path
                    id={`mark_${from}->${to}`}
                    opacity={0}
                    d={pathData}
                    stroke="red"
                    strokeWidth={7}
                    fill="none"
                    cursor="pointer"
                    onMouseOver={(e: React.MouseEvent<any>) => this.setState({ hoverEdge: `${from}->${to}` })}
                    onMouseLeave={(e: React.MouseEvent<any>) => this.setState({ hoverEdge: `` })}
                />

                <Tooltip
                    title={tooltipTxt}
                    mouseEnterDelay={.3}
                    // placement="bottom" 
                    visible={hovered}
                >
                    <g
                        className="edgeLable"
                        cursor="pointer"
                        opacity={hoverLegend ? 1 : 0.8}
                        onMouseOver={(e: React.MouseEvent<any>) => this.setState({ hoverEdge: `${from}->${to}` })}
                        onMouseLeave={(e: React.MouseEvent<any>) => this.setState({ hoverEdge: `` })}
                    >

                        {showLabel ? (
                            <g className="labels">
                                <Transition
                                    in={this.updateEdge}
                                    timeout={{ enter: duration, exit: 10 }}
                                >
                                    {(status: 'entering' | 'entered' | 'exiting' | 'exited' | 'unmounted') => {
                                        // console.info(status)
                                        return <text
                                            className="link_info fadeIn"
                                            dy={-0.3 * labelFont}
                                            scale={1 / scale}
                                            textAnchor="middle"
                                            style={{
                                                fontSize: labelFont,
                                                ...defaultStyle,
                                                ...transitionStyles[status]
                                            }}
                                        >
                                            <textPath
                                                xlinkHref={`#mark_${from}->${to}`}
                                                startOffset="50%"
                                            >
                                                {label_s}
                                            </textPath>
                                        </text>
                                    }}
                                </Transition>

                                <Transition in={!this.updateEdge} timeout={{ enter: duration, exit: 10 }}>
                                    {(status: 'entering' | 'entered' | 'exiting' | 'exited' | 'unmounted') => {
                                        return <text
                                            className="link_info fadeIn"
                                            dy={-0.3 * labelFont}
                                            scale={1 / scale}
                                            textAnchor="middle"
                                            style={{
                                                fontSize: labelFont,
                                                ...defaultStyle,
                                                ...transitionStyles[status]
                                            }}
                                        >
                                            <textPath
                                                xlinkHref={`#mark_${from}->${to}`}
                                                startOffset="50%"
                                            >
                                                {label_s}
                                            </textPath>
                                        </text>
                                    }}
                                </Transition>
                            </g>
                        ) : (<g className="no labels">
                            <text
                                className="link_info fadeIn"
                                dy={-0.3 * labelFont}
                                scale={1 / scale}
                                textAnchor="middle"
                                style={{
                                    opacity: 0
                                }}
                            >
                                <textPath
                                    xlinkHref={`#mark_${from}->${to}`}
                                    startOffset="50%"
                                >
                                    {'fake'}
                                </textPath>
                            </text>
                        </g>
                            )
                        }

                        }
                    </g>
                </Tooltip>

            </g>
        )

    }
    drawEdges(edges: GraphEdge[]) {
        let { scale, transX, transY } = this.state
        return (
            <g className="edges" >
                {edges.map((edge: GraphEdge, i: number) => {
                    return this.oneEdge(edge, i)

                })}
            </g>)
    }
    handleMouseWheel(evt: React.WheelEvent<any>) {
        let { scale, transX, transY } = this.state
        evt.preventDefault()
        this.updateEdge = !this.updateEdge
        if (evt.deltaY < 0) {
            scale = scale * 1.1
            transX = transX * 1.1
            transY = transY * 1.1

        } else if (evt.deltaY > 0) {
            scale = scale * .9
            transX = transX * .9
            transY = transY * .9
        }
        this.setState({ scale, transX, transY });
    }
    changeGlyphZoom(name: string) {
        this.setState({
            glyphZoom: !this.state.glyphZoom,
            glyphZoomLabel: name
        })
    }
    componentDidMount() {
        this.getData(this.state.appValue)
    }
    // componentDidMount() {

    //     const zoomed = () => {
    //         svg.attr("transform", d3.event.transform);
    //     }
    //     let svg = d3.select('svg')
    //         .call(
    //             d3.zoom()
    //                 .on("zoom", zoomed))
    //                 .on("mousedown.zoom", null)
    //                 .on("touchstart.zoom", null)

    // }
    onChange = (appValue: string) => {
        if (appValue === undefined) {
            return
        }
        let legend = ( appValue === '1.2.' ? legendRNN : legendCNN )
        this.setState({ appValue, legend });
        this.getData(appValue)
        this.props.onSelectNN([initNN], initNN)

        let { onSelectDatabase } = this.props
        if (appValue === '1.1.') {
            onSelectDatabase('nonsequence')
        } else if (appValue === '1.2.') {
            onSelectDatabase('sequence')
        } else {
            onSelectDatabase('all')
        }
    }

    pinNode(pinNode: Node) {
        let { pinNodes } = this.state,
            index = pinNodes.indexOf(pinNode.label)
        if (index === -1) {
            pinNodes.push(pinNode.label)
        } else {
            pinNodes.splice(index, 1)
        }

        this.setState({ pinNodes })
    }
    selectNode(selectedNode: Node | undefined) {
        let { datum, appValue } = this.state
        let { onSelectNN } = this.props
        // this.updateEdge = !this.updateEdge
        // datum.forEach((d: NN) => {
        //     if (nodeID == d.ID) {
        //         if (!d._width) {
        //             d._width = d.width
        //             d.width = 4*d._width
        //             d._height = d.height
        //             d.height = 3*d._width
        //             selectedNode = d
        //         } else {
        //             d.width = d._width
        //             d.height = d._height
        //             d._width = null
        //             d._height = null
        //             selectedNode = undefined
        //         }
        //     }
        // })
        let {
            nodes, edges, width: w, height: h, topDoi, scale, transX, transY
        } = this.getDag(datum, appValue, selectedNode)

        this.setState({
            nodes, edges, w, h, datum, selectedNode,
            topDoi, scale,
            transX, transY
        })

        if (selectedNode) {
            for (let nn of datum) {
                if (nn.ID === selectedNode.label) {
                    let currentNNs = nodes.filter(n => n.isZoomed).map(n => n.ID)
                    onSelectNN(this.state.datum.filter(n => currentNNs.indexOf(n.ID) !== -1), nn)
                }
            }
        }

        /*if (selectedNode) {
            for (let nn of datum) {
                if (nn.ID === selectedNode.label) {
                    onSelectNN(nn)
                    console.log('selected a node')
                }
            }
        }
        else {
            console.log('select undefined')
        }*/
    }
    mouseDown(e: React.MouseEvent<any>) {
        e.stopPropagation()
        e.preventDefault()

        document.addEventListener('mousemove', this.pan)
        this.x0 = e.clientX
        this.y0 = e.clientY
        this.updateEdge = !this.updateEdge
    }
    pan(e: any) {
        let { transX, transY } = this.state
        transX += e.clientX - this.x0
        transY += e.clientY - this.y0
        this.x0 = e.clientX
        this.y0 = e.clientY
        this.dragFlag = true
        this.setState({ transX, transY })
    }
    mouseUp(e: React.MouseEvent<any>) {
        e.stopPropagation()
        e.preventDefault()
        // if (this.dragFlag) {

        //     this.dragFlag = false
        // }

        document.removeEventListener('mousemove', this.pan)
    }
    onclickMenu(selectedNode: Node, menu: string) {
        let { datum } = this.state
        let { onSelectNN } = this.props
        let { onSelectNNMotion } = this.props

        for (let nn of datum) {
            if (nn.ID === selectedNode.label) {
                let currentNNs = this.state.nodes.filter(n => n.isZoomed).map(n => n.ID)
                onSelectNN(this.state.datum.filter(n => currentNNs.indexOf(n.ID) !== -1), nn)
            }
        }

        switch (menu) {
            case 'text':
                console.log('text')
                onSelectNNMotion(2)
                break
            case 'compare':
                console.log('compare')
                onSelectNNMotion(1)
                break
            case 'detailed':
                console.log('detailed')
                // showDetailedStructure(selectedNode.label)
                this.showModal(selectedNode.label)
                break
            default:
                break
        }
    }
    selectItem(name: string, op: 'click' | 'hover') {
        let { legend } = this.state
        // console.info(legend, key, op, legend[key][op])
        legend[name][op] = !legend[name][op]
        // console.info(legend, key, op, legend[key][op])
        this.setState({ legend })
    }

    showModal(label: string) {
        this.setState({
            detailed: label,
            modalVisible: true
        })
    }

    render() {
        let { nodes, edges, w, h, appValue, legend, modalVisible, detailed, glyphZoom, glyphZoomLabel } = this.state
        // let screen_w = (window.innerWidth - 2 * margin) / 2
        // let screen_h = (window.innerHeight - HEADER_H - 2 * margin) / 2

        // let ratio = Math.min(screen_w/(w||1), screen_h/(h||1))
        let { train, arc, dnns } = this.props
        dnns = dnns.filter((d: NN) => {
            return d.application[0].startsWith(appValue)
        })
        // console.info(dnns)

        let NNInfo = this.props.textInfo[glyphZoomLabel]
        let info = '', links: JSX.Element[] = [], code: JSX.Element[] = []
        let paperTitle = ''
        if (NNInfo) {
            paperTitle = NNInfo.links[0][0]
            info = NNInfo.info
            links = NNInfo.links.map(
                (d, i) => <div className="TextInfo-Link" key={i}><a href={d[1]} target="_blank">{d[0]}</a></div>
            )
            if (NNInfo.code) {
                code = NNInfo.code.map(
                    (d, i) => <div className="TextInfo-Link" key={i}><a href={d[1]} target="_blank">{d[0]}</a></div>
                )
            }
        }

        return (
            <div
                className="Evolution View"
                onWheel={this.handleMouseWheel}
                onMouseDown={this.mouseDown}
                onMouseUp={this.mouseUp}
                onMouseLeave={this.mouseUp}
                ref={(ref) => this.ref = ref}>
                {/* <div style={{ position: "absolute", left: "20px", top: "20px" }}>
                Training methods:{train}
            </div>
            <div style={{ position: "absolute", left: "20px", top: "40px" }}>
                Architecture:{arc}
            </div> */}
                <div
                    className="controlPanel"
                    style={{
                        position: 'absolute',
                        left: '20px',
                        top: '10px',
                        zIndex: 100,
                        padding: '5px'
                    }}
                >
                    <TreeSelect
                        value={appValue}
                        // dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        // treeData = {this.state.appData}
                        style={{ width: 250 }}
                        treeData={appData}
                        placeholder="select your data type"
                        // multiple
                        onChange={this.onChange}
                        treeDefaultExpandAll={true}
                    />
                    <div>
                        <Button
                            size="small"
                            onClick={() => this.selectNode(undefined)}
                            style={{ position: 'relative', top: '2px', marginRight: '3px' }}
                        >
                            Reset
                        </Button>
                        <Switch
                            // className="evoSwitch"
                            checkedChildren="label"
                            unCheckedChildren="no label"
                            onChange={() => this.setState({ showLabel: !this.state.showLabel })}
                        />
                    </div>
                    <Legend items={legend} selectItem={this.selectItem} />
                </div>
                <div className="container">
                    <div
                        className="extendNodes"
                        style={{
                            // height:this.ref?this.ref.clientHeight:0, 
                            // width:this.ref?this.ref.clientWidth:0,
                            position: 'relative'
                        }}
                    >
                        {this.drawExtendNodes(nodes)}
                    </div>
                    <svg
                        // alway show the whole dag
                        width="100%"
                        height="100%"
                    // viewBox={`0 0 ${w} ${h}`}
                    // or show part and let the users pan and zoom
                    // width={w||1*scale} height={h||1*scale}

                    >

                        <defs>
                            <marker
                                id="red"
                                orient="auto"
                                markerWidth={4 * r}
                                markerHeight={4 * r}
                                refX={2 * r}
                                refY={2 * r}
                            >
                                <circle r={r} fill="red" />
                            </marker>
                            <marker
                                id="blue"
                                orient="auto"
                                markerWidth={4 * r}
                                markerHeight={4 * r}
                                refX={2 * r}
                                refY={2 * r}
                            >
                                <circle r={r} fill="blue" />
                            </marker>
                            <marker
                                id="black"
                                orient="auto"
                                markerWidth={4 * r}
                                markerHeight={4 * r}
                                refX={2 * r}
                                refY={2 * r}
                            >
                                <circle r={r} fill="black" />
                            </marker>
                        </defs>{this.drawEdges(edges)}
                        {this.drawNodes(nodes)}

                    </svg>

                </div>
                <Modal
                    className="CompareModal EvoModal"
                    style={{ top: '10%', transitionDuration: '0.3s', transitionTimingFunction: 'ease' }}
                    width="40%"
                    // bodyStyle={{ height: 'calc(100% - 48px)' }}
                    title={`Detailed Structure of ${detailed}`}
                    visible={modalVisible}
                    footer={false}
                    onCancel={() => this.setState({ modalVisible: false })}
                    maskClosable={true}
                    key={Math.random()}
                    align=''
                >
                    <ArchitectureCompare network={detailed} dnns={dnns} />
                </Modal>
                <Modal
                    className="GlyphModal EvoModal"
                    title={glyphZoomLabel}
                    visible={glyphZoom}
                    onCancel={() => { this.setState({ glyphZoom: false }) }}
                    footer={null}
                    align=''

                // onOk={this.handleOk}
                // onCancel={this.handleCancel}
                >
                    <div className="content" style={{ overflowY: 'scroll' }}>
                        <img
                            src={`../../images/${glyphZoomLabel}.png`}
                            style={{
                                height: '80%',
                                width: '80%',
                                padding: '10%'
                            }}
                        />
                        <div>
                            <h3>{paperTitle}</h3>
                            {info}
                            <h4>related papers: </h4>
                            {links}
                        </div>
                    </div>
                </Modal>
            </div>)
    }
}
