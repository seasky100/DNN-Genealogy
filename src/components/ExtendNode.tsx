import * as React from "react";
import { Button, Dropdown, Menu, Tooltip, Tabs, Icon } from "antd";
import { Transition } from "react-transition-group";
import { Node } from "../types";
import "./ExtendNode.css"
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
    margin: number,
    scale: number,
    duration: number,
    // isTop: boolean,
    zoomed: boolean,
    transX: number,
    transY: number,
    // apiArr: number[],
    selectNode: (node: Node) => void,
    onclickMenu: (node: Node, menu: string) => void,
    pinNode: (node: Node) => void
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
        let { node, margin, selected, scale, duration, zoomed, selectNode, onclickMenu, pinNode, transX, transY } = this.props
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
                <Menu.Item key="detailed">detailed structure</Menu.Item>
            </Menu>
        )


        // return <Transition in={zoomed} timeout={duration}>
        //     {(status: any) => {
        return <div className="ExtendNode Node"
            onMouseEnter={() => this.setState({ showpin: true })}
            onMouseLeave={() => this.setState({ showpin: false })}
            // onMouseOut={()=>this.setState({showpin:false})}
            style={{
                position: "absolute",
                left: transX + node.x * scale - node.width * scale / 2,
                top: transY + node.y * scale - node.height * scale / 2,
                backgroundColor: "white",
                height: node.height * scale - margin,
                width: node.width * scale,
                visibility: zoomed ? "visible" : "hidden",
                opacity: zoomed ? 1 : 0
                // ...defaultStyle,
                // ...transitionStyles[status]

            }}
        >
            <Tabs defaultActiveKey="0"
            >
                <TabPane tab={node.label} key="0">
                    <img
                        className="abstract Node"
                        src={`../../images/${node.label}.png`}
                        style={{
                            border: `1px solid ${selected ? "red" : "gray"}`,
                        }}
                        height={node.height * scale - margin}
                        width={node.width * scale}
                        onMouseDown={this.mouseDown}
                        onMouseUp={(e) => { this.mouseUp(e, node) }}


                    />
                </TabPane>
                {node.variants.map((d: any, i: number) => {
                    return <TabPane tab={d.ID} key={`${i + 1}`}>
                        <img
                            className="abstract Node"
                            src={`../../images/${node.label}.png`}
                            style={{ border: `1px solid ${selected ? "red" : "none"}`, }}
                            //   height={node.height}
                            width={node.width * scale}
                        />
                    </TabPane>
                })}
            </Tabs>
            <Icon className="pin" type="pushpin"
                style={{
                    opacity: pin || showpin ? 1 : 0,
                    color: pin ? "red" : "gray"
                }}
                onClick={(e: React.MouseEvent<any>) => {
                    let { pin } = this.state
                    e.stopPropagation()
                    e.preventDefault()
                    this.setState({ pin: !pin })
                    pinNode(node)

                }} />
            <Dropdown overlay={menu} className="infoButton">
                <a className="infoTrigger"> ...</a>
            </Dropdown>
        </div>
        // }}
        {/* </Transition> */ }
    }
}