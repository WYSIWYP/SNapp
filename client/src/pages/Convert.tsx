import React, {useEffect, useState, CSSProperties} from 'react';
import {RouteComponentProps, navigate} from "@reach/router";
import SNView from '../components/SNView';
import Frame from '../components/Frame';
import Connection from '../util/Connection';
import MusicXML from 'musicxml-interfaces';



type Props = {} & RouteComponentProps;

const Convert: React.FC<Props> = () => {
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

         <Frame header="SNapp" fontSize={55}></Frame>
            <div style={styles.leftSide} >
                <div style={styles.subHeader}>

                    <div style={styles.left} onClick={()=>{navigate('/');}}>
                        <svg style={styles.svg} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        Home
                    </div>

                    <div style={styles.right}>
                        <svg style={styles.svg} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Preferences
                    </div>

                    <div style={styles.right}>
                        <svg style={styles.svg} xmlns="http://www.w3.org/2000/svg" padding-right="5px" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                        Save as PDF
                    </div>

                </div>
                <div style={styles.snv}>
                {xml===undefined?null:<SNView xml={xml} />}
                </div>
            </div>
            
         {/* <Btn text="TESTBnjknUTTON" action={()=>alert('f')}></Btn> */}

        </>

    );
};

const styleMap = {
    leftSide:{
        float:'left',
        width:'80%',
    },

    svg:{
        marginRight:'7px',
    },
    snv:{
        top: '200px',
    },

    left:{
        display:'flex',
        height:'auto',
        color:'#31B7D6',
        marginTop: '27px',
        marginLeft: '25px',
        fontSize: '25px',
        fontWeight:'bold',
        cursor: 'pointer',
        position: 'relative',
        float: 'left',
        width: 'auto',
    },
    right:{
        height:'auto',
        display:'flex',
        marginTop: '27px',
        fontWeight:'bold',
        color:'#31B7D6',
        marginRight: '25px',
        fontSize: '25px',
        position: 'relative',
        float: 'right',
        width: 'auto',
        cursor: 'pointer',
    },

    subHeader:{
        // background:'blue',
        height: '80px',
        top:'80px',
    },

    
} as const;
const styles: Record<keyof typeof styleMap,CSSProperties> = styleMap;


export default Convert;
