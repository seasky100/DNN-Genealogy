import * as React from "react";
import { Button, Dropdown, Menu, Tooltip, Tabs, Icon, Modal } from "antd";
import { Transition } from "react-transition-group";
import { Node } from "../types";
import "./ExtendNode.css";
import { capFirstLetter, cutLabel, getColor } from "../helper";
import { mapNetworkToArcs } from "./ArchitectureCompare";
// import ImageModel from './ImageModel'

const TabPane = Tabs.TabPane
const defaultStyle = {
    transition: `opacity 500ms ease-in-out`,
    opacity: 0,
    visibility: "hidden"
}

const transitionStyles = {
    entering: { opacity: 0, visibility: "hidden" },
    entered: { opacity: 1, visibility: "visible" },
    exited: { opacity: 0, visibility: "hidden" }
}

export interface Props {
    node: Node,
    selected: boolean,
    hovered: boolean,
    tabH: number,
    scale: number,
    duration: number,
    // isTop: boolean,
    zoomed: boolean,
    transX: number,
    transY: number,
    // apiArr: number[],
    selectNode: (node: Node) => void,
    onclickMenu: (node: Node, menu: string) => void,
    pinNode: (node: Node) => void,
    changeGlyphZoom: (label: string) => void
}

export interface State {
    showpin: boolean;
    pin: boolean;
}

export default class ExtendNode extends React.Component<Props, State>{
    private dragFlag: boolean = false
    constructor(props: Props) {
        super(props)
        this.mouseDown = this.mouseDown.bind(this)
        this.mouseMove = this.mouseMove.bind(this)
        this.mouseUp = this.mouseUp.bind(this)
        this.state = {
            showpin: false,
            pin: false
        }
    }
    mouseDown(e: React.MouseEvent<any>) {
        this.dragFlag = false
        document.addEventListener("mousemove", this.mouseMove)
    }
    mouseMove(e: MouseEvent) {
        this.dragFlag = true
    }
    mouseUp(e: React.MouseEvent<any>, node: Node) {
        document.removeEventListener("mousemove", this.mouseMove)
        if (!this.dragFlag) {
            this.props.selectNode(node)
        } else {
            this.dragFlag = false
        }
    }
    render() {
        let { node, tabH, selected, scale, duration, zoomed, selectNode, onclickMenu, pinNode, transX, transY, changeGlyphZoom } = this.props
        {/* <div style={{ height: node.height }}>
            <img
                className="abstract Node"
                src={`../../images/${node.label}.png`}
                //    height={node.height}
                width={zoomed ? node.width : 0}
            />

        </div> */}
        let { showpin, pin } = this.state

        let onclick = function (item: { key: string }) {
            onclickMenu(node, item.key)
        }
        const menu = (
            <Menu onClick={onclick}>
                <Menu.Item key="text">text intro</Menu.Item>
                <Menu.Item key="compare">compare performance</Menu.Item>
                <Menu.Item
                    key="detailed"
                    disabled={mapNetworkToArcs.filter((d: any) => (d.label === node.ID)).length === 0}
                >
                    detailed structure
                </Menu.Item>
            </Menu>
        )


        // return <Transition in={zoomed} timeout={duration}>
        //     {(status: any) => {
        return <div id={`exnode_${node.ID}`}
            className={`ExtendNode Node ${zoomed ? "zoomed" : "collapsed"}`}
            onMouseOver={() => this.setState({ showpin: true })}
            onMouseOut={() => this.setState({ showpin: false })}
            // onMouseOut={()=>this.setState({showpin:false})}
            style={{
                position: "absolute",
                left: transX + node.x * scale - node.width * scale / 2,
                top: transY + node.y * scale - node.height * scale / 2,
                backgroundColor: "white",
                height: node.height * scale,
                width: node.width * scale,
                visibility: zoomed ? "visible" : "hidden",
                outline: `${selected ? 3 : 0.5}px ${selected ? "dashed" : "solid"} #aaa`,
                // borderRadius: "5px"
                // ...defaultStyle,
                // ...transitionStyles[status]

            }}
        >
            {/* <Tabs defaultActiveKey={`0`}>
                <TabPane
                    tab={
                        <div style={{ height: "100%", display: "inline-block" }}>
                            <div style={{

                                width: "32px",
                                height: "100%",
                                display: "inline-block"
                            }}>
                                {node.arc.map((d: string) => (
                                    <div style={{
                                        backgroundColor: getColor(d),
                                        width: "100%",
                                        height: `${100 / (node.arc.length + 1)}%`
                                    }} />
                                ))}
                            </div>
                            {capFirstLetter(cutLabel(node.label, node.width * scale / 9))}
                        </div>
                    }
                    key="0">
                    <img
                        className="abstract Node"
                        src={`../../images/${node.label}.png`}
                        // style={{
                        //     border: `1px solid ${selected ? "red" : "gray"}`,
                        // }}
                        height={node.height * scale - tabH - 6}
                            width={node.width * scale}
                        />
                    </TabPane>
                })} 
            </Tabs> */}
            <div
                className="Node tab"
                style={{
                    height: tabH + 'px',
                    width: node.width * scale,
                    borderBottom: "0.5px solid #aaa"
                }}
            >
                <div style={{
                    // width: node.width * scale * .2 + 'px',
                    width: "20px",
                    height: "100%",
                    display: "inline-block"
                }}>
                    {node.arc.map((d: string) => (
                        <div style={{
                            backgroundColor: getColor(d),
                            width: "100%",
                            height: `${100 / node.arc.length}%`
                        }} />
                    ))}
                </div>
                <span style={{
                        padding: '2px', 
                        fontSize: tabH*.7+'px',
                        webkitTextFillColor: "black",
                        transform: `translate(0, -10)`,
                        verticalAlign: 'top'
                        }}
                >
                   {capFirstLetter(cutLabel(node.label, node.width * scale / 9))}
                </span>
            </div>
            <img
                className="abstract Node"
                src={`../../images/${node.label}.png`}
                // style={{
                //     border: `1px solid ${selected ? "red" : "gray"}`,
                // }}
                height={node.height * scale - tabH}
                width={node.width * scale}
                onMouseDown={this.mouseDown}
                onMouseUp={(e) => { this.mouseUp(e, node) }} />
            <div className="floatIcon"
                style={{
                    position: "relative",
                    float: "right",
                    top: "-20px",
                    opacity: pin || showpin ? 1 : 0,
                    color: "gray"
                }

                }>
                <Icon className="pin" type="pushpin"
                    style={{
                        opacity: pin || showpin ? 1 : 0,
                        color: pin ? "red" : "gray",
                        cursor: "pointer"
                    }}

                    onClick={(e: React.MouseEvent<any>) => {
                        let { pin } = this.state
                        e.stopPropagation()
                        e.preventDefault()
                        this.setState({ pin: !pin })
                        pinNode(node)

                    }} />
                <Icon type="arrows-alt"
                    style={{ cursor: "pointer" }}
                    onClick={() => this.props.changeGlyphZoom(node.label)}
                />
                <Dropdown overlay={menu} className="infoButton">
                    <a className="infoTrigger"> ...</a>
                </Dropdown>
            </div>

        </div>
        // }}
        {/* </Transition> */ }
    }
}