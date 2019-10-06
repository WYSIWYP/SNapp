import React, {CSSProperties, useState, useEffect, Fragment} from 'react';
import {RouteComponentProps, Link, navigate} from "@reach/router";
import Frame from '../components/Frame';
import svg from '../images/upload.svg';
import MusicXML from 'musicxml-interfaces';

type Props = {} & RouteComponentProps;

const Menu: React.FC<Props> = () => {
    type recentFile = {
        name: string,
        date: number,
        data: MusicXML.ScoreTimewise,
    };

    let [state,setState] = useState<recentFile[]>(undefined!);

    useEffect(()=>{

        let recent = null;
        try {
            recent = JSON.parse(localStorage.getItem('recent_files')!);
        } catch(e){}

        if(recent === null){
            let now = new Date().getTime();
            let recentFiles: recentFile[] = [];
            let recentFilesLength = Math.floor(Math.random()*6)+1;
            for(let i = 0; i < recentFilesLength; i++){
                recentFiles.push({
                    name: [
                        'A Hard Days Night',
                        'Be Mine Tonight',
                        'Baa, Baa, Black Sheep',
                        'Twinkle Twinkle Little Star',
                        'Tchaikovsky – Swan Lake Theme',
                        'Fur Elise',
                    ][i],
                    date: now-(i*2+1)*24*60*60*1000, data: undefined!
                });
            }
            localStorage.setItem('recent_files',JSON.stringify(recentFiles));
            setState([]);
        } else {
            localStorage.removeItem('recent_files');
            setState(recent);
        }
    },[]);

    return (
        <Frame header="SNapp" fontSize={55}>
            {state === undefined?null:<div style={styles.container}>
                <div style={{...styles.item, flex: '1 0 auto'}} />
                <div style={{...styles.item, maxWidth: '720px'}}>
                    SNapp implements a simpler and more intuitive music notation so that
                    musicians can spend less time learning music and more time playing it!
                </div>
                {state.length===0?<>
                    <div style={{...styles.item, flex: '.2 0 auto'}} />
                    <div style={styles.item}>
                        Try uploading a MusicXML file below
                    </div>
                    <div style={{...styles.item, flex: '.35 0 auto'}} />
                </>:<>
                    <div style={{...styles.item, flex: '.36 0 auto'}} />
                    <div style={{...styles.item, fontSize: '28px', fontWeight: 'bolder'}}>Recent Files</div>
                    <div style={{...styles.item, flex: '.08 0 auto'}} />
                    <div style={{...styles.item, ...styles.recentFiles}}>
                        <div style={{...styles.recentFilesInner}}>
                            {state.map((x,i)=><Fragment key={i}>
                                <div style={styles.recentFilesItem} onClick={()=>{navigate('convert');}}>
                                    <div style={{...styles.recentFilesItemInner, flex: '0 1 auto', fontWeight: 'bold'}}>
                                        {x.name}
                                    </div>
                                    <div style={{...styles.recentFilesItemInner, width: '10px', flex: '1 1 auto'}} />
                                    <div style={{...styles.recentFilesItemInner, flex: '0 100000 auto', fontSize: '22px'}}>
                                        {(d=>`${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`)(new Date(x.date))}
                                    </div>
                                </div>
                                <div style={styles.recentFilesSeparator}></div>
                            </Fragment>)}
                        </div>
                    </div>
                    <div style={{...styles.item, flex: '.24 0 auto'}} />
                </>}
                <div style={styles.item}>
                    <span style={styles.link} onClick={()=>{navigate('convert');}}>
                        <img src={svg} style={styles.icon}/>
                        Upload MusicXML File
                    </span>
                </div>
                <div style={{...styles.item, flex: '1 0 auto'}} />
            </div>}
        </Frame>
    );
};

const styleMap = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    item: {
        position: 'initial',
        top: 'auto',
        left: 'auto',
        height: 'auto',
        marginLeft: '50%',
        width: '70%',
        transform: 'translate(-50%,0px)',
        textAlign: 'center',
        fontSize: '21px',
        flex: '0 0 auto',
    },
    recentFiles: {
        color: '#31B7D6',
        maxWidth: '600px',
        height: '250px',
        borderRadius: '10px',
        border: '2px solid #BBBBBB',
        padding: '5px',
        overflow: 'hidden',
    },
    recentFilesInner: {
        position: 'relative',
        paddingLeft: '15px',
        paddingRight: '15px',
        overflowX: 'hidden',
        overflowY: 'auto',
    },
    recentFilesItem: {
        display: 'flex',
        width: 'calc(100% - 10px)',
        marginTop: '20px',
        marginLeft: '5px',
        marginRight: '5px',
        lineHeight: '40px',
        fontSize: '24px',
        position: 'relative',
        height: '40px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'pointer',
    },
    recentFilesSeparator: {
        position: 'relative',
        height: '2px',
        backgroundColor: '#DDDDDD',
        borderRadius: '10px',
    },
    recentFilesItemInner: {
        position: 'initial',
        width: 'auto',
        flex: '0 0 auto',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    link: {
        color: '#31B7D6',
        cursor: 'pointer',
        fontSize: '28px',
        fontWeight: 'bold',
    },
    icon: {
        height: '1em',
        width: '1em',
        position: 'relative',
        display: 'inline-flex',
        top: '.125em',
        marginRight: '.25em',
    },
} as const;
const styles: Record<keyof typeof styleMap,CSSProperties> = styleMap;

export default Menu;
