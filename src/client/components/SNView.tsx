import React, {useEffect, useState, useRef} from 'react';
import {Midi} from '@tonejs/midi';
import {range} from '../util/Util';
import {Note} from '@tonejs/midi/dist/Note';
import MusicXML from 'musicxml-interfaces';

type Props = {
    xml: MusicXML.ScoreTimewise,
    options?: {},
};

const SNView: React.FC<Props> = ({xml,options,children}) => {
    const ref = useRef(null! as HTMLDivElement);
    let [width,setWidth] = useState<number | undefined>(undefined);
    useEffect(()=>{
        let callback = ()=>{
            setWidth(ref.current!.getBoundingClientRect().width);
        }
        window.addEventListener("resize", callback);
        callback();
        return ()=>{
            window.removeEventListener("resize", callback);
        }
    },[]);

    if(width === undefined){ //skip first render when width is unknown
        return <div ref={ref} />;
    }

    let devMode = false;
    let maxStaffNumber = 2;
    //general spacing
    let noteSymbolSize = 20; //width/height of note symbols
    let strokeWidth = 2;
    let tickSize = 7;

    //vertical spacing
    let verticalPadding = 30; //top/bottom padding
    let rowPadding = 30; //space between rows
    let measureLabelSpace = 15; //space for measure labels
    
    //horizontal spacing
    let beatWidth = 40;
    let horizontalPadding = 20; //left/right padding
    let staffLabelSpace = 25; //space for staff labels
    let octaveLabelSpace = measureLabelSpace; //space for octave labels

    
    
    
    let octaveGroups = [1,1,0,0,0,1,1]; //octaveGroups (C D E / F G A B)
    let staffLabels = ['𝒯','𝐵'];
    let octaveLines = [undefined,undefined,{
        color: 'red', number: true
    },undefined,undefined,{
        color: 'blue'
    },undefined];
    let sharpMap = [0,1,0,1,0,0,1,0,1,0,1,0].map(x=>x===1);
    let noteMap = [0,0,1,1,2,3,3,4,4,5,5,6];

    let getNoteIsSharp = (note: number)=>sharpMap[note%12];
    let getNoteLine = (note: number)=>Math.floor(note/12)*7+noteMap[note%12];


    // type staff = {
    //     notes: Note[],
    // };

    //let staves: staff[] = midi.tracks.filter(x=>x.notes.length>0).map(x=>{});

    type basicNote = {
        time: number,
        duration: number,
        midi: number,
    };

    //extract note data

    let pitchToMidi = (pitch: {octave: number, step: string, alter?: number})=>{
        let step = ({c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11} as {[index: string]: number})[pitch.step.toLowerCase()];
        return (pitch.octave-5)*12+step+(pitch.alter===undefined?0:Math.round(pitch.alter));
    };
    let parts: {[index: string]: basicNote[]} = {};
    let progress: {[index: string]: number} = {};
    xml.measures.forEach(measure=>{
        Object.keys(measure.parts).forEach(part=>{
            if(parts[part] === undefined){
                parts[part] = [];
            }
            if(progress[part] === undefined){
                progress[part] = 0;
            }
            let notes: basicNote[] = [];
            measure.parts[part].forEach(entry=>{
                switch(entry._class){
                    case 'Note':
                        let time = progress[part];
                        if(entry.chord !== undefined){
                            if(notes.length === 0){
                                console.error('The first note within a measure was marked as being part of a chord');
                            } else {
                                time = notes[notes.length-1].time;
                            }
                        } else {
                            progress[part] += entry.duration;
                        }
                        if(entry.rest === undefined && entry.pitch === undefined){
                            console.error('A note was neither marked as a rest or given a pitch');
                        }
                        if(entry.rest !== undefined && entry.pitch !== undefined){
                            console.error('A note was marked as a rest but was also given a pitch');
                        }
                        if(entry.pitch !== undefined){
                            notes.push({time, duration: entry.duration, midi: pitchToMidi(entry.pitch)});
                        }
                        break;
                    case 'Backup':
                        progress[part] -= entry.duration;
                    case 'Forward':
                        progress[part] += entry.duration;
                        break;
                    
                    case 'Print':
                    case 'Attributes':
                    case 'Direction':
                        break;
                    default:
                        console.error(`Unrecognized MusicXML entry: '${entry._class}'`);
                        break;
                }
                //console.log(entry);
            });
        });
    });



    let midi: any = undefined;


    //calculate lowest note per row
    let minNote = midi.tracks.reduce((x: any,track: any)=>Math.min(x,track.notes.reduce((x: any,note: any)=>Math.min(x,note.midi),128)),128);
    
    //calculate highest note per row
    let maxNote = midi.tracks.reduce((x: any,track: any)=>Math.max(x,track.notes.reduce((x: any,note: any)=>Math.max(x,note.midi),-1)),-1);

    //if there was an issue, abort
    if(minNote === 128 || maxNote === -1){
        throw new Error('An issue was detected while analyzing this work\'s note range');
    }

    //calculate the height of each row (based upon low/high notes and oct groups)
    let minLine = getNoteLine(minNote);
    while(octaveGroups[minLine%7] === octaveGroups[(minLine-1+7)%7]){
        minLine--;
    }
    let maxLine = getNoteLine(maxNote);
    while(octaveGroups[maxLine%7] === octaveGroups[(maxLine-1+7)%7]){
        maxLine++;
    }
    let rowHeight = (maxLine-minLine)*noteSymbolSize/2; //not including measure labels

    //calculate the number of beats per measure
    let beatsPerMeasure = midi.header.timeSignatures.length>0?midi.header.timeSignatures[0].timeSignature[0]:4;
    let measureWidth = beatWidth*beatsPerMeasure;

    //calculate tne number of measures per row
    let availableMeasureSpace = width-horizontalPadding*2-staffLabelSpace-octaveLabelSpace;
    let measuresPerRow = Math.floor(availableMeasureSpace/measureWidth);
    if(measuresPerRow <= 0){
        throw new Error('Could not place a measure in the allowed space');
    }
    horizontalPadding += (availableMeasureSpace-measuresPerRow*measureWidth)/2; //update horizontal padding to center rows
    
    //calculate the number of rows
    let ticksPerMeasure = midi.header.ppq*beatsPerMeasure; //needs to take into account size of a beat
    let ticksPerRow = ticksPerMeasure*measuresPerRow;
    let measureNumber = Math.ceil(midi.durationTicks/ticksPerMeasure);
    if(measureNumber <= 0){
        throw new Error('Failed to identify number of measures');
    }
    let rowNumber = Math.ceil(measureNumber/measuresPerRow);

    //calculate required height (vert padding + row height + row padding)
    let height = verticalPadding*2+rowNumber*(rowHeight+measureLabelSpace)+(rowNumber-1)*rowPadding;
    
    let measure = (x: number, y: number, i: number)=>{
        let key = 0;
        let elements: JSX.Element[] = [];
        elements.push(<rect key={key++} x={x+measureWidth-strokeWidth/2} y={y+measureLabelSpace-strokeWidth/2} width={strokeWidth} height={rowHeight+strokeWidth} fill="#000000"/>);
        
        for(let j = minLine; j <= maxLine; j++){
            let octaveLine = octaveLines[j%7];
            if(octaveLine !== undefined){
                let lineY = y+measureLabelSpace+rowHeight-(j-minLine)*noteSymbolSize/2;
                elements.push(<rect key={key++} x={x+strokeWidth/2} y={lineY-strokeWidth/2} width={measureWidth-strokeWidth} height={strokeWidth} fill={octaveLine.color}/>);
                if(i%measuresPerRow===0 && octaveLine.number === true){
                    elements.push(<text x={x-strokeWidth} y={lineY} fontSize={measureLabelSpace} textAnchor="end" dominantBaseline="middle">{Math.floor(j/7)+2}</text>);
                }
                if(j < maxLine){
                    for(let i = 1; i < beatsPerMeasure; i++){
                        let tickX = x+measureWidth/beatsPerMeasure*i;
                        elements.push(<rect key={key++} x={tickX-strokeWidth/2} y={lineY-tickSize} width={strokeWidth} height={tickSize-strokeWidth/2} fill="#000000"/>);
                    }
                }
            }
        }

        return (
            <React.Fragment key={i}>
                {devMode?<rect x={x} y={y} width={measureWidth} height={measureLabelSpace-strokeWidth/2} fill="#ffdddd"/>:null}
                <text x={x+strokeWidth} y={y+measureLabelSpace-strokeWidth} fontSize={measureLabelSpace}>{i+1}</text>
                {elements}
            </React.Fragment>
        );
    }

    let row = (i: number)=>{
        let y = verticalPadding+i*(rowHeight+measureLabelSpace+rowPadding)
        return (
            <React.Fragment key={i}>
                {devMode?<rect x={horizontalPadding} y={y+measureLabelSpace} width={staffLabelSpace} height={rowHeight} fill="#ffdddd"/>:null}
                {devMode?<rect x={horizontalPadding+staffLabelSpace} y={y+measureLabelSpace} width={octaveLabelSpace} height={rowHeight} fill="#ffddff"/>:null}
                
                <text x={horizontalPadding+staffLabelSpace} y={y+measureLabelSpace+rowHeight/2} fontSize={staffLabelSpace*1.5} textAnchor="end" dominantBaseline="middle">𝒯</text>

                <rect x={horizontalPadding+staffLabelSpace+octaveLabelSpace-strokeWidth/2} y={y+measureLabelSpace-strokeWidth/2} width={strokeWidth} height={rowHeight+strokeWidth} fill="#000000"/>
                {range(0,i<rowNumber-1?measuresPerRow:measureNumber-(rowNumber-1)*measuresPerRow).map(j=>
                    measure(horizontalPadding+staffLabelSpace+octaveLabelSpace+j*measureWidth,y,i*measuresPerRow+j)
                )}
            </React.Fragment>
        );
    }

    let tickToPos = (tick: number)=>{
        let row = Math.floor(tick/ticksPerRow);
        let measure = (tick-row*ticksPerRow)/ticksPerMeasure;
        return {
            row, measure,
            ...rowMeasureToPos(row,measure)
        };
    }
    let rowMeasureToPos = (row: number, measure: number)=>({
        x: horizontalPadding+staffLabelSpace+octaveLabelSpace+measure*measureWidth,
        y: verticalPadding+row*(rowHeight+measureLabelSpace+rowPadding)+rowHeight+measureLabelSpace
    });

    let noteTail = (note: note, i: number)=>{
        let key = 0;
        let boxes: JSX.Element[] = [];
        
        let line = getNoteLine(note.data.midi)-minLine;
        
        let {row: rowStart, measure: measureStart, x: xStart, y: yStart} = tickToPos(note.data.ticks);
        let {row: rowEnd, x: xEnd} = tickToPos(note.data.ticks+note.data.durationTicks);
        
        let pushBox = (x1: number, x2: number, y: number)=>{
            boxes.push(<rect key={key++} x={x1} y={y-(line+1)*noteSymbolSize/2} width={x2-x1} height={noteSymbolSize} fill="#777777" fillOpacity={.5}/>);
        }
        while(rowStart < rowEnd){
            //only executes rarely so it is faster to compute this value in the loop
            pushBox(xStart,horizontalPadding+staffLabelSpace+octaveLabelSpace+measuresPerRow*measureWidth,yStart);
            rowStart++;
            measureStart = 0;
            let {x,y} = rowMeasureToPos(rowStart,measureStart);
            xStart = x;
            yStart = y;
        }
        pushBox(xStart,xEnd,yStart);
        
        return (
            <React.Fragment key={i}>
                {boxes}
            </React.Fragment>
        );
    }

    let noteHead = (note: note, i: number)=>{
        let sharp = getNoteIsSharp(note.data.midi);
        let line = getNoteLine(note.data.midi)-minLine;
        let {x, y} = tickToPos(note.data.ticks);
        x += noteSymbolSize/2;
        y -= line*noteSymbolSize/2;
        let triHeight = noteSymbolSize*Math.sqrt(3)/2;
        return (
            sharp?<polygon key={i} points={`${x},${y-triHeight/2} ${x+noteSymbolSize/2},${y+triHeight/2} ${x-noteSymbolSize/2},${y+triHeight/2}`} fill="#000000"/>
                :<circle key={i} cx={x} cy={y} r={noteSymbolSize/2} fill="#000000"/>
        );
    }

    type note = {
        track: number,
        data: Note
    };
    let notes: note[] = [];
    midi.tracks.forEach((track: any,i: any)=>{
        track.notes.forEach((note: any)=>{
            notes.push({track: i, data: note});
        });
    });

    return (
        <div ref={ref}>
            <svg viewBox={`0 0 ${width} ${height}`} width={`${width}`} height={`${height}`}>
                {devMode?<rect x={0} y={0} width={width} height={height} fill="#ddddff"/>:null}
                {devMode?<circle cx={0} cy={0} r="40" stroke="black" strokeWidth="3" fill="red" />:null}
                {devMode?<circle cx={width} cy={0} r="40" stroke="black" strokeWidth="3" fill="red" />:null}
                {devMode?<circle cx={width} cy={`${height}`} r="40" stroke="black" strokeWidth="3" fill="red" />:null}
                {devMode?<circle cx={0} cy={height} r="40" stroke="black" strokeWidth="3" fill="red" />:null}

                {devMode?<rect x={horizontalPadding} y={verticalPadding} width={width-horizontalPadding*2} height={height-verticalPadding*2} fill="#ddffdd"/>:null}
                {range(0,rowNumber).map(i=>row(i))}
                {notes.map((x,i)=>noteTail(x,i))}
                {notes.map((x,i)=>noteHead(x,i))}
            </svg>
        </div>
    );
};

export default SNView;
