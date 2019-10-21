import React, {CSSProperties, useState, useEffect, Fragment} from 'react';
import {RouteComponentProps, navigate} from "@reach/router";
import Frame from '../components/Frame';
import svg from '../images/upload.svg';
import MusicXML from 'musicxml-interfaces';
import {useCurrentFileState} from '../contexts/CurrentFile';

type Props = {} & RouteComponentProps;

const Menu: React.FC<Props> = () => {
    type recentFile = {
        file_name: string,
        date: number,
        id: string,
    };

    let [recentFiles, setRecentFiles] = useState<recentFile[]>(undefined!);

    let [, setCurrentFile] = useCurrentFileState();

    useEffect(() => {
        let recent: recentFile[] = null!;
        try {
            recent = JSON.parse(localStorage.getItem('recent_files')!);
        } catch (e) {}
        if (recent === null) {
            recent = [];
        }
        setRecentFiles(recent);


    }, []);

    const loadFile = (x: recentFile) => {
        try {
            let parsed = JSON.parse(localStorage.getItem(x.id)!);

            // Set this song as the current work in the global context
            setCurrentFile({type: 'set', val: {id: x.id, file_name: x.file_name, data: parsed}});

            // Set this song as the current work in localStorage
            localStorage.setItem('current_file', x.id);

            navigate('convert');
        } catch (e) {
            console.error(e);
        }
    };

    const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        let fileName = (e.target as any).files[0].name.replace(/\.musicxml$/ig, '');
        try {
            let reader = new FileReader();
            reader.onload = function (e) {
                try {
                    let parsed = MusicXML.parseScore((e.target as any).result);

                    try {
                        let id = `file_${Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

                        // Set this song as the current work in the global context
                        setCurrentFile({type: 'set', val: {id, file_name: fileName, data: parsed}});

                        // Set this song as the current work in localStorage
                        localStorage.setItem(id, JSON.stringify(parsed));
                        localStorage.setItem('current_file', id);

                        // Add this song to the recent songs list
                        let newRecentFiles = recentFiles.map(x => x);

                        for (let i = 0; i < newRecentFiles.length; i++) {
                            if (newRecentFiles[i]['file_name'] == fileName) {
                                newRecentFiles.splice(i, 1);
                            }
                        }

                        newRecentFiles.unshift({file_name: fileName, date: new Date().getTime(), id});
                        localStorage.setItem('recent_files', JSON.stringify(newRecentFiles));

                    } catch (e) {
                        console.error(e);
                    }

                    navigate('convert');
                } catch (e) {
                    console.error(e);
                }
            };
            reader.readAsText((e.target as any).files[0]);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Frame header="SNapp">
            {recentFiles === undefined ? null : <div style={styles.container}>
                <div style={{...styles.item, flex: '1 0 auto'}} />
                <div style={{...styles.item, maxWidth: '720px'}}>
                    SNapp implements a simpler and more intuitive music notation so that
                    musicians can spend less time learning music and more time playing it!
                </div>
                {recentFiles.length === 0 ? <>
                    <div style={{...styles.item, flex: '.2 0 auto'}} />
                    <div style={styles.item}>
                        Try uploading a MusicXML file below
                    </div>
                    <div style={{...styles.item, flex: '.35 0 auto'}} />
                </> : <>
                        <div style={{...styles.item, flex: '.36 0 auto'}} />
                        <div style={{...styles.item, fontSize: '28px', fontWeight: 'bolder'}}>Recent Files</div>
                        <div style={{...styles.item, flex: '.08 0 auto'}} />
                        <div style={{...styles.item, ...styles.recentFiles}}>
                            <div style={{...styles.recentFilesInner}}>
                                {recentFiles.map(x => <Fragment key={x.id}>
                                    <div style={styles.recentFilesItem} onClick={() => {loadFile(x);}}>
                                        <div style={{...styles.recentFilesItemInner, flex: '0 1 auto', fontWeight: 'bold'}}>
                                            {x.file_name}
                                        </div>
                                        <div style={{...styles.recentFilesItemInner, width: '10px', flex: '1 1 auto'}} />
                                        <div style={{...styles.recentFilesItemInner, flex: '0 100000 auto', fontSize: '22px'}}>
                                            {(d => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`)(new Date(x.date))}
                                        </div>
                                    </div>
                                    <div style={styles.recentFilesSeparator}></div>
                                </Fragment>)}
                            </div>
                        </div>
                        <div style={{...styles.item, flex: '.24 0 auto'}} />
                    </>}
                <div style={styles.item}>
                    <span style={styles.link} onClick={() => {}}>
                        <img src={svg} style={styles.icon} alt="" />
                        Upload MusicXML File
                        <input style={styles.fileInput} type="file" title="Click to upload" accept=".musicxml" onChange={(e) => {uploadFile(e);}}></input>
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
    fileInput: {
        position: 'absolute',
        top: '0px',
        left: 'calc(50% - 170px)',
        width: '340px',
        height: '100%',
        cursor: 'pointer',
        opacity: 0,
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
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;

export default Menu;
