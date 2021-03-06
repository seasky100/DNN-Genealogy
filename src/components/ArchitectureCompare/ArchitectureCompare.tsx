import * as React from 'react'
import Network from './Network'
import { EvoNode } from 'types'
import axios from 'axios'
import { TreeSelect, Cascader, Dropdown, Menu, message, Button, Col, Icon } from 'antd';
import * as d3 from 'd3'
import './ArchitectureCompare.css'
import {generateOptions} from 'helper';

export const mapNetworkToArcs = [
    {
        value: 'alexNet',
        label: 'alexNet'
    },
    {
        value: 'fractalNet',
        label: 'fractalNet',
        children: [{
            value: 'fractal_40',
            label: 'fractalNet-40'
        }]
    }, {
        value: 'inception',
        label: 'inception',
        children: [{
            value: 'inception_v3',
            label: 'inception_v3'
        }]
    }, {
        value: 'xception',
        label: 'xception'
    }, {
        value: 'inception_resNet',
        label: 'inception_resNet'
    }, {
        value: 'mobile',
        label: 'mobileNet'
    }, {
        value: 'nasNet',
        label: 'nasNet',
        children: [{
            value: 'nasNet_cifar',
            label: 'nasNet_cifar'
        }, {
            value: 'nasNet_small',
            label: 'nasNet_small'
        }, {
            value: 'nasNet_large',
            label: 'nasNet_large'
        }]
    }, {
        value: 'denseNet',
        label: 'denseNet',
        children: [{
            value: 'denseNet_121',
            label: 'denseNet_121'
        }, {
            value: 'denseNet_201',
            label: 'denseNet_201'
        }, {
            value: 'denseNet_169',
            label: 'denseNet_169'
        }]
    }, {
        value: 'WRN',
        label: 'WRN',
        children: [{
            value: 'wideresnet_16_4',
            label: 'wideresnet_16_4',
        }, {
            value: 'wideresnet_28_10',
            label: 'wideresnet_28_10',
        }]
    }, {
        value: 'VGG',
        label: 'VGG',
        children: [{
            value: 'vgg19',
            label: 'vgg19'
        }]
    }, {
        value: 'squeezeNet',
        label: 'squeezeNet'
    }, {
        value: 'resNet',
        label: 'resNet',
        children: [{
            value: 'resNet_v1_32_cifar',
            label: 'resNet_v1_32_cifar'
        }, {
            value: 'resNet_v1_152',
            label: 'resNet_v1_152'
        }, {
            value: 'resNet_v1_50',
            label: 'resNet_v1_50'
        }, {
            value: 'resNet_v1_56_cifar',
            label: 'resNet_v1_56_cifar'
        }, {
            value: 'resNet_v1_110_cifar',
            label: 'resNet_v1_110_cifar'
        }, {
            value: 'resNet_v2',
            label: 'resNet_v2'
        }, {
            value: 'resNet_v2_56_cifar',
            label: 'resNet_v2_56_cifar'
        }, {
            value: 'resNet_v2_110_cifar',
            label: 'resNet_v2_110_cifar'
        }]
    }]

export interface Props {
    network: string,
    dnns: any[]
}

export interface State {
    model1: string,
    model2: string,
    nodes1: EvoNode[],
    nodes2: EvoNode[],
    params1: {},
    params2: {},
    comparing: boolean,
    mounted: boolean,
}

export default class ArchitectureCompare extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            model1: '',
            model2: '',
            nodes1: [],
            nodes2: [],
            params1: {},
            params2: {},
            comparing: false,
            mounted: false
        }
        this.getData = this.getData.bind(this)
    }

    

    componentWillMount() {
        // console.log('mount')
        // let arcs: any = mapNetworkToArcs.filter((d: any) => this.props.network === d.label)[0], model: string = ''
        // if (arcs.hasOwnProperty('children')) {
        //     model = arcs.children[0].value
        // } else {
        //     model = arcs.value

        // }
        // this.getData(model, 1)
        let dnn = this.props.dnns.filter(d=>d.ID===this.props.network)[0]
        if(dnn.models){
            this.getData(dnn.models[0], 1)
        }else{
            message.info('Cannot find the detailed architecture. Try another one.')
        }
    }

    componentWillReceiveProps(nextProps: Props) {
        // let arcs: any = mapNetworkToArcs.filter((d: any) => nextProps.network === d.label)[0], model: string = ''
        // // console.log(arcs)
        // if (arcs.hasOwnProperty('children')) {
        //     model = arcs.children[0].value
        // } else {
        //     model = arcs.value
        // }

        let dnn = this.props.dnns.filter(d=>d.ID===nextProps.network)[0]
        if(dnn.models){
            this.getData(dnn.models[0], 1)
        }else{
            message.info('Cannot find the detailed architecture. Try another one.')
        }
        
    }

    async getData(model: string, idx: number) {
        let res = await axios.get('../../data/models/' + model + '.json'),
            nodes: EvoNode[]

        // console.info(res.data)
        if (idx === 1) {
            this.setState({ 
                model1: model, 
                nodes1: res.data.config.layers, 
                params1: res.data.params ? res.data.params : {} 
            })
        } else if (idx === 2) {
            this.setState({ 
                model2: model, 
                nodes2: res.data.config.layers, 
                params2: res.data.params ? res.data.params : {} 
            })
        }
    }

    ifCompare(comparing: boolean) {
        if (comparing === true) {
            d3.select('.CompareModal').style('width', '80%')
            this.setState({ model2: '', nodes2: [], params2: {}, comparing })
        } else {
            d3.select('.CompareModal').style('width', '40%')
            this.setState({ comparing })
        }
    }

    networkIsReady(mounted: boolean) {
        this.setState({ mounted: true })
    }

    render() {
        let {network, dnns} = this.props
        let options = generateOptions(dnns)
        // console.info(this.props.dnns)
        if (!this.state.comparing) {
            return (
                <div className="ArchitectureCompare" >
                    <Col span={24} className="ArchitectureColumn">
                        <Cascader
                            // options={options.filter((d: any) => network === d.label)}
                            options={options}
                            placeholder={`Choose Model in ${network}`}
                            onChange={(value: any) => { this.getData(value[value.length - 1], 1) }}
                            expandTrigger="hover"
                            allowClear={false}
                            popupClassName="MyCascade"
                            style={{ width: '35%' }}
                        />
                        <Button
                            type="primary"
                            icon="right-circle"
                            onClick={() => { this.ifCompare(true) }}
                            style={{ float: 'right', marginRight: '10px' }}
                        >
                            Compare
                        </Button>
                        {/* {this.state.mounted?
                        <span/>:
                        <Icon type="loading" style={{fontSize: "100px",position: "absolute", top: "200px"}}/>
                        } */}
                        <Network
                            nodes={this.state.nodes1}
                            params={this.state.params1}
                            name={this.state.model1} 
                            isReady={this.networkIsReady}
                        />

                    </Col>
                </div>)
        } else {
            return (
                <div className="ArchitectureCompare" >
                    <Col span={12} className="ArchitectureColumn">
                        <Cascader
                            // options={options.filter((d: any) => network === d.label)}
                            options={options}
                            placeholder={`Choose Model in ${network}`}
                            onChange={(value: any) => { this.getData(value[value.length - 1], 1) }}
                            expandTrigger="hover"
                            allowClear={false}
                            popupClassName="MyCascade"
                            style={{ width: '35%' }}
                        />
                        <Button
                            type="primary"
                            icon="left-circle"
                            onClick={() => { this.ifCompare(false) }}
                            style={{ float: 'right', marginRight: '10px' }}
                        >
                            Detail
                        </Button>
                        <Network nodes={this.state.nodes1} params={this.state.params1} name={this.state.model1} isReady={this.networkIsReady} />

                    </Col>
                    <Col span={12} className="ArchitectureColumn ArchRight">
                        <Cascader
                            options={options}
                            placeholder="Choose Model"
                            onChange={(value: any) => { this.getData(value[value.length - 1], 2) }}
                            expandTrigger="hover"
                            allowClear={false}
                            popupClassName="MyCascade"
                            style={{ width: '35%' }}
                        />
                        <Network nodes={this.state.nodes2} params={this.state.params2} name={this.state.model2} isReady={this.networkIsReady} />
                    </Col>
                </div>)
        }
    }
}
