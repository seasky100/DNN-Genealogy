import * as React from 'react'
import { Modal } from 'antd'
import ArchitectureCompare from "./ArchitectureCompare"
//import Network from './Network'
import axios from 'axios'
import { EvoNode } from '../types';

const info = Modal.info

export async function showDetailedStructure(label: string) {
    return info({
        title: (
            <div style={{textAlign:'center'}}>Detailed Structure of {label}</div>
        ),
        content: (
            //<Network nodes={datum} />
            <ArchitectureCompare network={label}/>
        ),
        okText: 'OK',
        iconType: '',
        width: '80%',
        onOk() {
            // do nothing
        },
    });
}
