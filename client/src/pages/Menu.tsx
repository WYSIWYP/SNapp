import React, { CSSProperties, useState, useEffect, Fragment } from 'react';
import { RouteComponentProps, navigate } from "@reach/router";
import Frame from '../components/Frame';
import svg from '../images/upload.svg';
import MusicXML, { ScoreTimewise } from 'musicxml-interfaces';
import { useCurrentFileState } from '../contexts/CurrentFile';
import { useDialogState } from '../contexts/Dialog';
import * as Dialog from '../util/Dialog';
import JSZip from 'jszip';

type Props = {} & RouteComponentProps;

const Menu: React.FC<Props> = () => {
    type recentFile = {
        file_name: string,
        date_created: number,
        date_opened: number,
        id: string,
    };

    let [recentFiles, setRecentFiles] = useState<recentFile[]>(undefined!);
    let [installHandle, setInstallHandle] = useState<{
        prompt: ()=>void,
        userChoice: Promise<{outcome: 'accepted'|'rejected'}>
    } | undefined>(undefined);
    useEffect(()=>{
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setInstallHandle(e as any);
        });
    },[]);

    let [, setDialogState] = useDialogState();
    let [, setCurrentFile] = useCurrentFileState();

    let showError = (error: string) => {
        setDialogState(Dialog.showMessage('An Error Occurred', error, 'Cancel', () => {
            setDialogState(Dialog.close());
        }));
     };

    let deleteAllPrompt = () => {
        setDialogState(Dialog.showPrompt('Delete Confirmation', 'Are you sure you want to delete all converted files?', 'Cancel', () => {
            setDialogState(Dialog.close());
        }, 'Delete', () => {
            recentFiles.forEach(x=>{
                localStorage.removeItem(x.id);
            });
            setRecentFiles([]);
            localStorage.setItem('recent_files', JSON.stringify([]));
            setDialogState(Dialog.close());
        }));
    };
    let deleteSinglePrompt = (x: recentFile) => {
        setDialogState(Dialog.showPrompt('Delete Confirmation', 'Are you sure you want to delete this converted file?', 'Cancel', () => {
            setDialogState(Dialog.close());
        }, 'Delete', () => {
            let newRecentFiles = recentFiles.filter(y => y.id !== x.id);
            setRecentFiles(newRecentFiles);
            localStorage.setItem('recent_files', JSON.stringify(newRecentFiles));
            localStorage.removeItem(x.id);
            setDialogState(Dialog.close());
        }));
    };

    useEffect(() => {
        let recent: recentFile[] = null!;
        try {
            recent = JSON.parse(localStorage.getItem('recent_files')!);
        } catch (e) { }
        if (recent === null) {
            recent = [];
        }
        setRecentFiles(recent);
    }, []);

    const loadFile = (x: recentFile) => {
        try {
            let parsed = JSON.parse(localStorage.getItem(x.id)!);

            // Set this song as the current work in the global context
            setCurrentFile({ type: 'set', val: { id: x.id, file_name: x.file_name, data: parsed } });

            try {
                // Set this song as the current work in localStorage
                localStorage.setItem('current_file', x.id);

                // Update the accessed date for this song and move it to the top of the list
                localStorage.setItem('recent_files', JSON.stringify([
                    { ...x, date_opened: new Date().getTime() } as recentFile,
                    ...recentFiles.filter(y => y.id !== x.id)
                ]));
            } catch (e) {
                // Writing to local storage may be disabled currently
                console.error(e);
            }

            navigate('convert');
        } catch (e) {
            showError('An issue was encountered while loading the data for this file.');
            console.error(e);
        }
    };

    const deleteFile = (x: recentFile) => {
        try {
            deleteSinglePrompt(x);
            // let newRecentFiles = recentFiles.filter(y => y.id !== x.id);
            // setRecentFiles(newRecentFiles);
            // localStorage.setItem('recent_files', JSON.stringify(newRecentFiles));
        } catch (e) {
            showError('An issue was encountered while deleting this file.');
            console.error(e);
        }
    };

    const deleteAllFiles = () => {
        try {
            deleteAllPrompt();
        } catch (e) {
            showError('An issue was encountered while deleting all file(s).');
            console.error(e);
        }
    };

    const uploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        let fileName = (e.target as any).files[0].name.replace(/\.(?:musicxml|mxl|xml)$/i, '');
        let failedReads = 0;
        let fail = () => {
            failedReads++;
            if (failedReads === 2) { //both reads failed
                showError('An issue was encountered while reading the selected file.');
            }
        };
        try {
            let reader1 = new FileReader();
            reader1.onload = function () {
                try {
                    let data = reader1.result;
                    if (data === null) {
                        throw new Error('Failed to read file - null');
                    }
                    //try to interpret this file as compressed

                    (async () => {
                        try {
                            let zip = await JSZip.loadAsync(data);
                            // 2020 09 02 Added exclamation mark to following
                            let details = await zip.file('META-INF/container.xml')!.async("text");
                            let parser = new DOMParser();
                            let detailsDOM = parser.parseFromString(details, "application/xml");
                            let nodes = detailsDOM.getElementsByTagName('rootfile');
                            let musicXMLPath = nodes[0].getAttribute('full-path')!;
                            for (let i = nodes.length - 1; i >= 0; i--) {
                                if (nodes[i].getAttribute('media-type') === 'application/vnd.recordare.musicxml+xml') {
                                    musicXMLPath = nodes[i].getAttribute('full-path')!;
                                }
                            }
                            // 2020 09 02 Added exclamation mark to following
                            let musicXMLData = await zip.file(musicXMLPath)!.async("text");
                            let parsed = MusicXML.parseScore(musicXMLData);
                            if (parsed.measures === undefined) {
                                throw new Error('Invalid MusicXML format');
                            }
                            onUpload(fileName, parsed);
                        } catch (e) {
                            fail();
                            console.error(e);
                        }
                    })();
                } catch (e) {
                    fail();
                    console.error(e);
                }
            };
            reader1.readAsArrayBuffer((e.target as any).files[0]);
            let reader2 = new FileReader();
            reader2.onload = function () {
                try {
                    let data = reader2.result;
                    if (data === null) {
                        throw new Error('Failed to read file - null');
                    }
                    //try to interpret this file as uncompressed
                    let parsed = MusicXML.parseScore(data as string);

                    if (parsed.measures === undefined) {
                        throw new Error('Invalid MusicXML format');
                    }
                    console.log(parsed);

                    onUpload(fileName, parsed);
                } catch (e) {
                    fail();
                    console.error(e);
                }
            };
            reader2.readAsText((e.target as any).files[0]);





            // let reader = new FileReader();
            // reader.onload = function () {
            //     try {
            //         let data = reader.result;
            //         let parsed: ScoreTimewise;
            //         if(data === null){
            //             throw new Error('Failed to read file - null');
            //         }
            //         try {
            //             //try to interpret this file as uncompressed
            //             parsed = MusicXML.parseScore(data.toString());
            //             console.log(data.toString());
            //             console.log(parsed);
            //         } catch(e){

            //             throw new Error('...');
            //         }

            //         let id = `file_${Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

            //         // Set this song as the current work in the global context
            //         setCurrentFile({type: 'set', val: {id, file_name: fileName, data: parsed}});

            //         // Fail silently if localStorage is disabled
            //         try {

            //             // Set this song as the current work in localStorage
            //             localStorage.setItem(id, JSON.stringify(parsed));
            //             localStorage.setItem('current_file', id);

            //             // Add this song to the recent songs list
            //             let newRecentFiles = recentFiles.map(x => x);

            //             for (let i = 0; i < newRecentFiles.length; i++) {
            //                 if (newRecentFiles[i]['file_name'] === fileName) {
            //                     newRecentFiles.splice(i, 1);
            //                 }
            //             }

            //             newRecentFiles.unshift({file_name: fileName, date: new Date().getTime(), id});
            //             localStorage.setItem('recent_files', JSON.stringify(newRecentFiles));

            //         } catch (e) {
            //             console.error(e);
            //         }

            //         navigate('convert');
            //     } catch (e) {
            //         showError('An issue was encountered while reading the selected file.');
            //         console.error(e);
            //     }
            // };
            // reader.readAsArrayBuffer((e.target as any).files[0]);
        } catch (e) {
            showError('An issue was encountered while reading the selected file.');
            console.error(e);
        }
    };

    const onUpload = (fileName: string, parsed: ScoreTimewise) => {
        let id = `file_${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

        // Set this song as the current work in the global context
        setCurrentFile({ type: 'set', val: { id, file_name: fileName, data: parsed } });

        // Fail silently if localStorage is disabled
        try {

            // Set this song as the current work in localStorage
            localStorage.setItem(id, JSON.stringify(parsed));
            localStorage.setItem('current_file', id);

            // Add this song to the recent songs list
            localStorage.setItem('recent_files', JSON.stringify([
                { file_name: fileName, date_created: new Date().getTime(), date_opened: new Date().getTime(), id } as recentFile,
                ...recentFiles.filter(x => x.file_name !== fileName)
            ]));

        } catch (e) {
            console.error(e);
        }

        navigate('convert');
    };

    return (
        <Frame header="SNapp -&nbsp;Simplified&nbsp;Notation&nbsp;App&nbsp;for&nbsp;Sheet&nbsp;Music">
            {recentFiles === undefined ? null : <div style={styles.container}>
                <div style={{ ...styles.item, flex: '.37 0 auto' }} />
                <div style={{ ...styles.item, maxWidth: '1200px' }}>
                    SNapp implements a simple and intuitive music notation known as What You See Is What You Play,
                    or WYSIWYP. With it, musicians can spend less time learning to read music and more time playing it!
                </div>
                {recentFiles.length === 0 ? <>
                    <div style={{ ...styles.item, flex: '.2 0 auto' }} />
                    <div style={styles.item}>
                        Try uploading a MusicXML file below
                    </div>
                    <div style={{ ...styles.item, flex: '.35 0 auto' }} />
                </> : <>
                        <div style={{ ...styles.item, flex: '.36 0 auto' }} />
                        <div style={{ ...styles.item, fontSize: '28px', fontWeight: 'bolder' }}>files already converted from MusicXML</div>
                        <div style={{ ...styles.item, flex: '.08 0 auto' }} />
                        <div style={{ ...styles.item, ...styles.recentFiles }}>
                            <div style={{ ...styles.recentFilesInner }}>
                                {recentFiles.map(x => <Fragment key={x.id}>
                                    <div className="button-recent-file" style={styles.recentFilesItem}>
                                        <div onClick={() => { loadFile(x); }} style={{ ...styles.recentFilesItemInner, flex: '0 1 auto', fontWeight: 'bold' }}>
                                            {x.file_name}
                                        </div>
                                        <div onClick={() => { loadFile(x); }} style={{ ...styles.recentFilesItemInner, width: '10px', flex: '1 1 auto' }} />
                                        <div onClick={() => { loadFile(x); }} style={{ ...styles.recentFilesItemInner, flex: '0 100000 auto', fontSize: '22px' }}>
                                            {(d => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`)(new Date(x.date_created || (x as any).date /*migrate from x.date to x.date_created*/))}
                                        </div>
                                        <div onClick={() => { deleteFile(x); }} style={{ ...styles.recentFilesItemInner, color: 'gray', width: '35px' }} >
                                            <svg style={{ paddingTop: '9px' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </div>
                                    </div>
                                    <div style={styles.recentFilesSeparator}></div>
                                </Fragment>)}
                                <div onClick={() => { deleteAllFiles(); }} style={styles.deleteAll}>Delete All Files</div>
                            </div>
                        </div>
                        <div style={{ ...styles.item, flex: '.24 0 auto' }} />
                    </>}
                <div style={styles.item}>
                    <span id="button-upload" style={styles.link}>                        Convert another MusicXML File
                        <input style={styles.fileInput} type="file" title="Convert another MusicXML file" accept=".musicxml,.mxl,.xml,application/octet-stream" onChange={(e) => { uploadFile(e); }}></input>
                    </span>
                </div>
                {installHandle===undefined?null:<>
                    <div style={{ ...styles.item, flex: '.5 0 auto' }} />
                    <div style={{ ...styles.item, maxWidth: '720px' }}>
                        Click the button below to add SNapp to your device's home screen.
                    </div>
                    <div style={{ ...styles.item, flex: '.07 0 auto' }} />
                    <div style={styles.item}>
                        <span id="button-upload" style={styles.link} onClick={() => {
                            installHandle!.prompt();
                            installHandle!.userChoice.then(result=>{
                                if (result.outcome === 'accepted') {
                                    setInstallHandle(undefined);
                                }
                            });
                        }}>
                            Add to Home Screen
                        </span>
                    </div>
                </>}
                <div style={{ ...styles.item, flex: '1 0 auto' }} />
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
        width: '80%',
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
        opacity: 0
    },
    recentFiles: {
        color: '#31B7D6',
        maxWidth: '1200px',
        height: '400px',
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
        marginTop: '1px',
        marginLeft: '5px',
        marginRight: '5px',
        lineHeight: '40px',
        fontSize: '22px',
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
    deleteAll: {
        position: 'relative',
        height: '40px',
        width: '200px',
        fontSize: '22px',
        lineHeight: '40px',
        left: '50%',
        transform: 'translate(-50%, 0)',
        cursor: 'pointer',
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
