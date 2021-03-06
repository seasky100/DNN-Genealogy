
import * as React from 'react';
import './App.css';
// import SiderBar from "../containers/SideBar";
// import MultiSunBurst from "./MultiSunBurst";
import TextInfo from 'containers/TextInfo';
import Evolution from 'containers/Evolution';
// import SimpleTree from "./SimpleTree";
// import Compare2 from './Compare2'
// import ArcTree from '../containers/ArcTree';
import TrainTree from 'containers/TrainTree';
import CorpusCompare from 'containers/CorpusCompare';
// import Navi from "./Navi";
import { Col, Layout, } from 'antd';
import HeaderIcon from 'components/HeaderIcon';

const { Header, Content } = Layout;

class App extends React.Component{
    selectedFilters = ['', '', '', '']
    onChildrenChanged(filter: string, newState: string) {
        const taxonomy = ['Application', 'Architecture', 'Training', 'Corpus']
        let index = taxonomy.indexOf(filter)
        this.selectedFilters[index] = newState
        this.forceUpdate()
    }
    render() {
        return (
            <div className="app">
                <Header className="header">
                    DNN Genealogy
                    <HeaderIcon/>
                </Header>
                <Content>
                    <Col span={24}> <Evolution />  </Col>
                </Content>
                <Content>
                    <Col span={7}><TrainTree/> </Col>
                    <Col span={11}> <CorpusCompare /> </Col>
                    <Col span={6}> <TextInfo /> </Col>
                </Content>
            </div>
        );
    }
}

export default App;

// helpers

// function getExclamationMarks(numChars: number) {
//     return Array(numChars + 1).join('!');
// }