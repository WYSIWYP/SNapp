import React, {useEffect, useState, CSSProperties} from 'react';
import {RouteComponentProps, navigate} from "@reach/router";
import SNView from '../components/SNView';
import Frame from '../components/Frame';
import {saveAs} from 'file-saver';
import dropDown from '../images/dropDown.svg'
import {useCurrentFileState} from '../contexts/CurrentFile';
import {
    usePreferencesState, colorPreferenceOptions, scalePreferenceOptions, 
    spacingPreferenceOptions, noteHeadPreferenceOptions, measuresPerRowOptions
} from '../contexts/Preferences';
import jsPDF from 'jspdf';
import canvg from 'canvg';

type Props = {} & RouteComponentProps;

const Convert: React.FC<Props> = () => {

    let [show, setShow] = useState(false);

    let [preferences, setPreferences] = usePreferencesState();
    let [currentFile, setCurrentFile] = useCurrentFileState();

    let [showPreferencesButton, setShowPreferencesButton] = useState(true);
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
            (window as any).canvg = canvg;
            let pdf = new jsPDF('p', 'px', 'letter');
            (pdf as any).addSvgAsImage(document.getElementById('snview')!.innerHTML, 0, 0, 1000, 1000);
            pdf.save(`${currentFile.file_name || 'WYSIWYP'}.pdf`);
        } catch (e) {
            console.error(e);
        }
    };
    let exportFile = () => {
        var file = new Blob([JSON.stringify(preferences, null, 4)], {type: 'text/plain'});
        saveAs(file, 'preferences.snapp');
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
    let sidebar = (<div style={styles.sideBar}>
        <div style={styles.sideBarTop}>
            <div title="Click to export" style={styles.sideBarTopOptions} onClick={() => {exportFile();}}>
                Export
            </div>
            <div style={styles.sideBarTopOptions}>
                Import
                <input style={styles.fileInput} type="file" title="Click to import" accept=".snapp" onChange={(e) => {importFile(e);}}></input>
            </div>
            <div style={styles.sideBarTopOptions} onClick={() => {setShow(false);}}>
                Close X
            </div>
        </div>
        <form onSubmit={() => {setShow(false);}} >
            <label>
                <div style={styles.sideBarContent}>
                    <div style={styles.line}>
                        <div style={styles.name}>Note Duration Color</div>
                        <select style={styles.select} value={preferences.noteDurationColor} onChange={
                            (e) => {setPreferences({type: 'set', val: {noteDurationColor: e.target.value as any}});}
                        }>{colorPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>
                    <div style={styles.line}>
                        <div style={styles.name}>Note Symbol Color</div>
                        <select style={styles.select} value={preferences.noteSymbolColor} onChange={
                            (e) => {setPreferences({type: 'set', val: {noteSymbolColor: e.target.value as any}});}
                        }>{colorPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Staff Scale</div>
                        {/* deleted value and onchange */}
                        <select style={styles.select} value={preferences.staffScale} onChange={
                            (e) => {setPreferences({type: 'set', val: {staffScale: e.target.value as any}});}
                        }>{scalePreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Horizontal Spacing</div>
                        {/* deleted value and onchange */}
                        <select style={styles.select} value={preferences.horizontalSpacing} onChange={
                            (e) => {setPreferences({type: 'set', val: {horizontalSpacing: e.target.value as any}});}
                        }>{spacingPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Vertical Spacing</div>
                        {/* deleted value and onchange */}
                        <select style={styles.select} value={preferences.verticalSpacing} onChange={
                            (e) => {setPreferences({type: 'set', val: {verticalSpacing: e.target.value as any}});}
                        }>{spacingPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>


                    <div style={styles.line}>
                        <div style={styles.name}>Note Scale</div>
                        {/* deleted value and onchange */}
                        <select style={styles.select} value={preferences.noteScale} onChange={
                            (e) => {setPreferences({type: 'set', val: {noteScale: e.target.value as any}});}
                        }>{scalePreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Natural Note Shape</div>
                        {/* deleted value and onchange */}
                        <select style={styles.select} value={preferences.naturalNoteShape} onChange={
                            (e) => {setPreferences({type: 'set', val: {naturalNoteShape: e.target.value as any}});}
                        }>{noteHeadPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Sharp Note Shape</div>
                        {/* deleted value and onchange */}
                        <select style={styles.select} value={preferences.sharpNoteShape} onChange={
                            (e) => {setPreferences({type: 'set', val: {sharpNoteShape: e.target.value as any}});}
                        }>{noteHeadPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Flat Note Shape</div>
                        {/* deleted value and onchange */}
                        <select style={styles.select} value={preferences.flatNoteShape} onChange={
                            (e) => {setPreferences({type: 'set', val: {flatNoteShape: e.target.value as any}});}
                        }>{noteHeadPreferenceOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>

                    <div style={styles.line}>
                        <div style={styles.name}>Measures per Row</div>
                        <select style={styles.select} value={preferences.measuresPerRow} onChange={
                            (e) => {setPreferences({type: 'set', val: {measuresPerRow: e.target.value as any}});}
                        }>{measuresPerRowOptions.map(x => <option key={x}>{x}</option>)}</select>
                    </div>
                </div>
            </label>
        </form>
    </div>)

    return (
        <Frame header="SNapp" showSideMenu={show} sideMenu={sidebar}>
            <div style={styles.subHeader}>

                <div style={styles.left} onClick={() => {navigate('/');}}>
                    <svg style={styles.svg} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Home
                </div>
                <div style={styles.left} onClick={() => {openPDF();}}>
                    <svg style={styles.svg} xmlns="http://www.w3.org/2000/svg" padding-right="5px" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                    Save as PDF
                </div>

                <div style={styles.right} onClick={() => {setShow(true);}} >

                    {!showPreferencesButton ? <></> : <><svg style={styles.svg} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>Preferences</>}

                </div>

            </div>
            <div style={styles.SNView}>
                {currentFile.data === undefined ? null : <SNView xml={currentFile.data} />}
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
        height: 'auto',
    },
    sideBar: {
        color: 'white',
        minWidth: '350px',
    },
    sideBarTop: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        borderBottom: '1px solid #BBBBBB',
        height: '65px',
        color: '#31B7D6',
        fontSize: '23px',
        fontWeight: 'bold',
        position: 'relative',
        width: 'auto',
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
        padding: '0 20px',
        position: 'relative',
        marginTop: '40px',
    },
    line: {
        fontSize: '17px',
        margin: '30px 0px',
        justifyContent: 'center',
        alignItems: 'baseline',
        display: 'flex',
        position: 'relative',
        height: 'auto',

    },
    name: {
        position: 'relative',
        width: '60%',
    },
    select: {
        fontSize: '17px',
        height: '40px',
        backgroundPosition: '95% center',
        backgroundRepeat: 'no-repeat',
        backgroundImage: `url(${dropDown})`,
        backgroundColor: 'rgba(255,255,255,0.6)',
        paddingLeft: '20px',
        border: '1px solid #6F6F6F',
        borderRadius: '10px',
        position: 'relative',
        width: '40%',
        textAlign: 'center',
        WebkitAppearance: 'none',
    },

} as const;
const styles: Record<keyof typeof styleMap, CSSProperties> = styleMap;


export default Convert;
