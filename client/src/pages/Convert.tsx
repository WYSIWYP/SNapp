import React, {useEffect, useState, CSSProperties} from 'react';
import {RouteComponentProps, navigate} from "@reach/router";
import SNView from '../components/SNView';
import Frame from '../components/Frame';
import Expandable from '../components/Expandable';
import {saveAs} from 'file-saver';
import {useCurrentFileState} from '../contexts/CurrentFile';
import {
    usePreferencesState, colorPreferenceOptions, scalePreferenceOptions,
    spacingPreferenceOptions, noteHeadPreferenceOptions, measuresPerRowOptions, accidentalTypeOptions, clefPreferenceOptions
} from '../contexts/Preferences';
import jsPDF from 'jspdf';
import canvg from 'canvg';
// import {useDialogState} from '../contexts/Dialog';
// import * as Dialog from '../util/Dialog';

type Props = {} & RouteComponentProps;

const Convert: React.FC<Props> = () => {

    let [show, setShow] = useState(false);

    let [preferences, setPreferences] = usePreferencesState();
    let [currentFile, setCurrentFile] = useCurrentFileState();
    // let [, setDialogState] = useDialogState();

    let [showPreferencesButton, setShowPreferencesButton] = useState(true);

    // let showError = (error: string)=>{
    //     setDialogState(Dialog.showMessage('An Error Occurred',error,'Close',()=>{
    //         setDialogState(Dialog.close());
    //     }));
    // }

    useEffect(() => {
        if (show) {
            setShowPreferencesButton(false);
            return () => {};
        } else {
            let timeout = setTimeout(() => {
                setShowPreferencesButton(true);
            }, 1000);
            return () => {
                clearTimeout(timeout);
            }
        }
    }, [show])

    useEffect(() => {
        (async () => {
            // If the current file is not in the context,
            if (currentFile.id === undefined) {
                try {
                    // Load the current file data from localStorage
                    let id = localStorage.getItem('current_file')!;
                    let file_name = JSON.parse(localStorage.getItem('recent_files')!).filter((x: any) => x.id === id)[0].file_name;
                    let data = JSON.parse(localStorage.getItem(id)!);
                    setCurrentFile({type: 'set', val: {id, file_name, data}});
                } catch (e) {
                    console.log(e);
                    navigate('..');
                }
            }
        })();
    }, [currentFile.id, setCurrentFile]);

    let openPDF = () => {
        try {

            let margin = 5;
            let padding = 5;

            let hidden = document.getElementById('hidden-pdf-generation') as HTMLDivElement;
            let canvas = hidden.getElementsByClassName('canvas')[0] as HTMLCanvasElement;

            let pdf = new jsPDF(); //210 x 297 mm (A4 paper dimensions)
            let width = 210;
            let height = 297;

            // should change with preferences
            margin = width * margin / 100;
            padding = width * padding / 100;


            let rows = hidden.getElementsByClassName('snview-row');

            let nextRowY = margin;
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];

                let [, , w, h] = row.getElementsByTagName('svg')[0].getAttribute('viewBox')!.split(' ').map(x => parseInt(x));
                let canvasRowHeight = Math.ceil(1000 * h / w);
                let pdfRowHeight = Math.ceil((width - margin * 2) * h / w);

                if (nextRowY + pdfRowHeight > height - margin) {
                    pdf.addPage();
                    nextRowY = margin;
                }

                canvas.height = canvasRowHeight;
                let ctx = canvas.getContext("2d")!;
                ctx.fillStyle = "white";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "black";
                canvg(canvas, row.innerHTML, {ignoreClear: true});
                pdf.addImage(canvas, 'JPEG', margin, nextRowY, width - margin * 2, pdfRowHeight);

                nextRowY += pdfRowHeight + padding;
            }



            // pdf.rect(0,0,200,287,'F');
            // pdf.addPage();
            // pdf.rect(0,10,200,287,'F');

            //(pdf as any).addSvgAsImage(document.getElementById('snview')!.innerHTML, 0, 0, 1000, 1000);
            pdf.save(`${currentFile.file_name || 'WYSIWYP'}.pdf`);
        } catch (e) {
            console.error(e);
        }
    };
    let exportFile = () => {
        var file = new Blob([JSON.stringify(preferences, null, 4)], {type: 'text/plain'});
        saveAs(file, 'preferences.snapp', {
            autoBom: false,
        });
    };
    let importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            let reader = new FileReader();
            reader.onload = function (e) {
                try {
                    let parsed = JSON.parse((e.target as any).result);
                    setPreferences({type: 'set', val: parsed});
                } catch (e) {
                    console.error(e);
                }
            };
            reader.readAsText((e.target as any).files[0]);
        } catch (e) {
            console.error(e);
        }
        e.target.value = "";
    };
    let sidebar = (
        <div style={styles.sideBar}>
            <div style={styles.sideBarTop}>
                <div id="export" title="Click to save your preferences" style={styles.sideBarTopOptions} onClick={() => {exportFile();}}>
                    Save
                </div>
                <div id="import" style={styles.sideBarTopOptions}>
                    Open
                <input style={styles.fileInput} type="file" title="Click to load your preferences" accept=".snapp" onChange={(e) => {importFile(e);}}></input>
                </div>
                <div id="close" style={styles.sideBarTopOptions} onClick={() => {setShow(false);}}>
                    Close ✕
                </div>
            </div>

            <div style={styles.sideBarContent}>

            <Expandable title="Staff Appearance">

                <div style={styles.line}>
                    <div style={styles.name}>Measures per Row</div>
                    <select value={preferences.measuresPerRow} onChange={
                        (e) => {setPreferences({type: 'set', val: {measuresPerRow: e.target.value as any}});}
                    }>{measuresPerRowOptions.map(x => <option key={x}>{x}</option>)}</select>
                </div>

                <div style={styles.line}>
                    <div style={styles.name}>Clef Symbols</div>
                    {/* deleted value and onchange */}
                    <select value={preferences.clefSymbols} onChange={
                        (e) => {setPreferences({type: 'set', val: {clefSymbols: e.target.value as any}});}
                    }>{clefPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                </div>

                <div style={styles.line}>
                    <div style={styles.name}>Clef Size</div>
                    {/* deleted value and onchange */}
                    <select value={preferences.staffScale} onChange={
                        (e) => {setPreferences({type: 'set', val: {staffScale: e.target.value as any}});}
                    }>{scalePreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                </div>

                <div style={styles.line}>
                    <div style={styles.name}>Margin Size</div>
                    {/* deleted value and onchange */}
                    <select value={preferences.horizontalSpacing} onChange={
                        (e) => {setPreferences({type: 'set', val: {horizontalSpacing: e.target.value as any}});}
                    }>{spacingPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                </div>

                <div style={styles.line}>
                    <div style={styles.name}>Staff Spacing Size</div>
                    {/* deleted value and onchange */}
                    <select value={preferences.verticalSpacing} onChange={
                        (e) => {setPreferences({type: 'set', val: {verticalSpacing: e.target.value as any}});}
                    }>{spacingPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                </div>

                </Expandable>

                <Expandable title="Note Appearance">

                    <div style={styles.line}>
                        <div style={styles.name}>Accidental Type</div>
                        <select value={preferences.accidentalType} onChange={
                            (e) => {setPreferences({type: 'set', val: {accidentalType: e.target.value as any}});}
                        }>{accidentalTypeOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Note Size</div>
                        {/* deleted value and onchange */}
                        <select value={preferences.noteScale} onChange={
                            (e) => {setPreferences({type: 'set', val: {noteScale: e.target.value as any}});}
                        }>{scalePreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>
                    
                    <div style={styles.line}>
                        <div style={styles.name}>Natural Notehead</div>
                        {/* deleted value and onchange */}
                        <select value={preferences.naturalNoteShape} onChange={
                            (e) => {setPreferences({type: 'set', val: {naturalNoteShape: e.target.value as any}});}
                        }>{noteHeadPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Sharp Notehead</div>
                        {/* deleted value and onchange */}
                        <select value={preferences.sharpNoteShape} onChange={
                            (e) => {setPreferences({type: 'set', val: {sharpNoteShape: e.target.value as any}});}
                        }>{noteHeadPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Flat Notehead</div>
                        {/* deleted value and onchange */}
                        <select value={preferences.flatNoteShape} onChange={
                            (e) => {setPreferences({type: 'set', val: {flatNoteShape: e.target.value as any}});}
                        }>{noteHeadPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Notehead Color</div>
                        <select value={preferences.noteSymbolColor} onChange={
                            (e) => {setPreferences({type: 'set', val: {noteSymbolColor: e.target.value as any}});}
                        }>{colorPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Duration Color</div>
                        <select value={preferences.noteDurationColor} onChange={
                            (e) => {setPreferences({type: 'set', val: {noteDurationColor: e.target.value as any}});}
                        }>{colorPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>
                    
                </Expandable>

            </div>

        </div>)

    return (
        <Frame showSideMenu={show} sideMenu={sidebar}>
            <div style={styles.subHeader}>

                <div id="home" style={styles.left} onClick={() => {navigate('/');}}>
                    <svg style={styles.svg} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    SNapp Home
                </div>
                <div style={styles.left} onClick={() => {openPDF();}}>
                    <svg style={styles.svg} xmlns="http://www.w3.org/2000/svg" padding-right="5px" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                    Save as PDF
                </div>

                <div id="preference" style={styles.right} onClick={() => {setShow(true);}} >

                    {!showPreferencesButton ? <></> : <><svg style={styles.svg} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>Preferences</>}

                </div>

            </div>
            <div style={styles.SNView} onClick={() => {setShow(false);}}>
                {currentFile.data === undefined ? null : <SNView xml={currentFile.data} />}
            </div>
            <div id="hidden-pdf-generation" style={styles.hidden}>
                <canvas className="canvas" width={1000} height={1000} />
                {currentFile.data === undefined ? null : <SNView xml={currentFile.data} forcedWidth={1000} />}
            </div>

        </Frame>


    );
};

const styleMap = {
    leftSide: {
        float: 'left',
        width: '80%',
    },

    svg: {
        marginRight: '7px',
    },
    // snv:{
    //     top: '200px',
    // },

    left: {
        display: 'flex',
        alignItems: 'center',
        height: 'auto',
        color: '#31B7D6',
        marginTop: '15px',
        marginLeft: '25px',
        fontSize: '23px',
        fontWeight: 'bold',
        cursor: 'pointer',
        position: 'relative',
        float: 'left',
        width: 'auto',
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        height: 'auto',
        marginTop: '15px',
        fontWeight: 'bold',
        color: '#31B7D6',
        fontSize: '23px',
        marginRight: '25px',
        position: 'relative',
        float: 'right',
        width: 'auto',
        cursor: 'pointer',
    },

    subHeader: {
        height: '65px',
    },
    SNView: {
        top: '65px',
        height: 'calc(100% - 65px)',
        overflow: 'auto',
    },
    sideBar: {
        color: 'white',
        minWidth: '350px',
    },
    sideBarTop: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: 'solid 1px #bbb',
        height: '65px',
        color: '#31B7D6',
        fontSize: '23px',
        fontWeight: 'bold',
    },
    sideBarTopOptions: {
        position: 'relative',
        width: '33%',
        height: 'auto',
        whiteSpace: 'nowrap',
        textAlign: 'center',
        cursor: 'pointer',
    },
    fileInput: {
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        padding: '0px',
        opacity: 0,
    },
    sideBarContent: {
        position: 'absolute',
        top: '65px',
        height: 'calc(100% - 65px)',
        overflow: 'auto',
    },
    line: {
        marginTop: '30px',
        marginBottom: '30px',
        justifyContent: 'center',
        alignItems: 'baseline',
        display: 'flex',
        position: 'relative',
        height: 'auto',
        width: '100%'
    },
    name: {
        position: 'relative',
        width: '50%',
        display: 'inline-block'
    },
    hidden: {
        width: '0px',
        height: '0px',
        overflow: 'hidden',
        opacity: .01,
    }
} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;


export default Convert;
