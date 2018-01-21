
import * as React from 'react';
import "./App.css";
// import SiderBar from "../containers/SideBar";
import MultiSunBurst from "./MultiSunBurst";
import Evolution from "./Evolution";
import {Col} from "antd";

// import { Row, Col} from 'antd';

class App extends React.Component{
    render() {
        return (
            <div className="app" >
                <div className="header" style={{ width: "100vw", height: "70px" }}>DNN Genealogy</div>
                <div>
                <Col span={4}>
                    <MultiSunBurst/>
                </Col>
                <Col span={20} style={{float: "left"}}>
                    <Evolution/>
                </Col>
                </div>
            </div>
        );
    }
}

export default App;

// helpers

// function getExclamationMarks(numChars: number) {
//     return Array(numChars + 1).join('!');
// }