import React, {useEffect, useState} from 'react';
import {RouteComponentProps} from "@reach/router";
import SNView from '../components/SNView';
import Connection from '../util/Connection';
import MusicXML from 'musicxml-interfaces';

type Props = {} & RouteComponentProps;

const Menu: React.FC<Props> = () => {
    let [xml,setXML] = useState<undefined | MusicXML.ScoreTimewise>(undefined);
    useEffect(()=>{
        let canceled = false;
        (async ()=>{
            let res = await Connection.get('BeetAnGeSample.musicxml');
            if(!canceled){
                let parsed = MusicXML.parseScore(res)
                console.log(parsed);
                setXML(parsed);
            }
        })();
        return ()=>{canceled = true;}
    },[]);
    return (
        <>
            {xml===undefined?null:<SNView xml={xml} />}
        </>
    );
};

// const styleMap = {
//     boxes: {
//         top: '200px',
//         height: '200px',
//         display: 'flex',
//         flexWrap: 'nowrap',
//         justifyContent: 'space-evenly',
//     },
// } as const;
// const styles: Record<keyof typeof styleMap,CSSProperties> = styleMap;

export default Menu;
