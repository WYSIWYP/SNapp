import React, {useEffect, useState, useRef} from 'react';
import {range} from '../util/Util';
// import {Note} from '@tonejs/midi/dist/Note';
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

    let devMode = true;
    //let maxStaffNumber = 2;
    
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
    // let staffLabels = ['𝒯','𝐵'];
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
    type timeSignature = {
        time: number,
        beats: number,
        beatTypes: number,
    };

    //extract note data

    console.log('Render');
    let pitchToMidi = (pitch: {octave: number, step: string, alter?: number})=>{
        
        let step = ({c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11} as {[index: string]: number})[pitch.step.toLowerCase()];
        console.log(`${JSON.stringify(pitch)} => ${pitch.octave*12+step+(pitch.alter===undefined?0:Math.round(pitch.alter))}`);
        return pitch.octave*12+step+(pitch.alter===undefined?0:Math.round(pitch.alter));
    };
    let duration = 0;
    let parts: {[index: string]: {
        divisions: number,
        progress: number,
        timeSignatures: timeSignature[];
        notes: basicNote[],
    }} = {};
    xml.measures.forEach((measure,i)=>{
        //console.log(`measure ${i}`);
        Object.keys(measure.parts).forEach(partName=>{
            
            //console.log(`part '${part}'`);
            if(parts[partName] === undefined){
                parts[partName] = {
                    divisions: undefined!,
                    progress: 0,
                    timeSignatures: [],
                    notes: [],
                };
            }
            let part = parts[partName];
            let notes: basicNote[] = [];
            let divisionsToQuarterNotes = (divisions: number)=>{
                if(part.divisions === undefined){
                    console.error('A note was defined before timing information was established');
                    return divisions/24;
                }
                return divisions/part.divisions;
            }
            measure.parts[partName].forEach(entry=>{
                //console.log(`entry '${entry._class}'`,entry);
                console.log(`(${partName} - ${part.progress})`);
                switch(entry._class){
                    case 'Note':
                        if(entry.duration !== undefined){ //grace notes do not have a duration - are not displayed
                            let time = part.progress;
                            if(entry.chord !== undefined){
                                if(notes.length === 0){
                                    console.error('The first note within a measure was marked as being part of a chord');
                                } else {
                                    if(notes[notes.length-1].duration !== divisionsToQuarterNotes(entry.duration)){
                                        console.error('Two notes in a chord were of different durations');
                                    }
                                    time = notes[notes.length-1].time;
                                }
                            } else {
                                part.progress += divisionsToQuarterNotes(entry.duration);
                            }
                            if(entry.rest === undefined && entry.pitch === undefined){
                                console.error('A note was neither marked as a rest or given a pitch');
                            }
                            if(entry.rest !== undefined && entry.pitch !== undefined){
                                console.error('A note was marked as a rest but was also given a pitch');
                            }
                            if(entry.pitch !== undefined){
                                notes.push({time, duration: divisionsToQuarterNotes(entry.duration), midi: pitchToMidi(entry.pitch)});
                            }
                        }
                        break;
                    case 'Backup':
                        console.log(`Backup ${divisionsToQuarterNotes(entry.duration)}`);
                        part.progress -= divisionsToQuarterNotes(entry.duration);
                        break;
                    case 'Forward':
                        console.log(`Forward ${divisionsToQuarterNotes(entry.duration)}`);
                        part.progress += divisionsToQuarterNotes(entry.duration);
                        break;
                    case 'Attributes':
                        if(entry.divisions !== undefined){
                            part.divisions = entry.divisions;
                        }
                        if(entry.times !== undefined){
                            if(entry.times.length !== 0){
                                try {
                                    part.timeSignatures.push({time: part.progress, beats: parseInt(entry.times[0].beats[0]), beatTypes: entry.times[0].beatTypes})
                                    //console.log(entry)
                                    console.log(`Time signature (${partName} - ${part.progress}): ${entry.times[0].beats[0]}/${entry.times[0].beatTypes}`)
                                } catch(e){
                                    console.error('Failed to parse time signature',entry.times[0]);
                                }
                            }
                        }
                        break;
                    case 'Print':
                        break;
                    case 'Direction':
                        break;
                    default:
                        console.error(`Unrecognized MusicXML entry: '${entry._class}'`);
                        break;
                }
                if(part.progress > duration){
                    duration = part.progress;
                }
                //console.log(entry);
            });
            part.notes.push(...notes);
        });
    });

    let tracks = Object.keys(parts).map(x=>({
        notes: parts[x].notes,
        timeSignatures: parts[x].timeSignatures,
    }));

    console.log(tracks);


    //calculate lowest note per row
    let minNote = tracks.reduce((x, track)=>Math.min(x,track.notes.reduce((x, note)=>Math.min(x,note.midi),128)),128);
    
    //calculate highest note per row
    let maxNote = tracks.reduce((x, track)=>Math.max(x,track.notes.reduce((x, note)=>Math.max(x,note.midi),-1)),-1);

    //if there was an issue, abort
    if(minNote >= 128 || minNote < 0 || maxNote >= 128 || maxNote < 0){
        console.log(minNote,maxNote);
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
    let beatsPerMeasure = tracks[0].timeSignatures.length>0?tracks[0].timeSignatures[0].beats:4;
    let measureWidth = beatWidth*beatsPerMeasure;

    //calculate tne number of measures per row
    let availableMeasureSpace = width-horizontalPadding*2-staffLabelSpace-octaveLabelSpace;
    let measuresPerRow = Math.floor(availableMeasureSpace/measureWidth);
    if(measuresPerRow <= 0){
        throw new Error('Could not place a measure in the allowed space');
    }
    horizontalPadding += (availableMeasureSpace-measuresPerRow*measureWidth)/2; //update horizontal padding to center rows
    
    //calculate the number of rows
    //let ticksPerMeasure = midi.header.ppq*beatsPerMeasure; //needs to take into account size of a beat
    let beatsPerRow = beatsPerMeasure*measuresPerRow;
    let measureNumber = Math.ceil(duration/beatsPerMeasure);
    if(measureNumber <= 0){
        throw new Error('Failed to identify number of measures');
    }
    let rowNumber = Math.ceil(measureNumber/measuresPerRow);

    //calculate required height (vert padding + row height + row padding)
    let height = verticalPadding*2+rowNumber*(rowHeight+measureLabelSpace)+(rowNumber-1)*rowPadding;
    
    let measure = (x: number, y: number, i: number)=>{
        let key = 0;
        let elements: JSX.Element[] = [];
        elements.push(<rect key={key++} x={measureWidth-strokeWidth/2} y={measureLabelSpace-strokeWidth/2} width={strokeWidth} height={rowHeight+strokeWidth} fill="#000000"/>);
        
        for(let j = minLine; j <= maxLine; j++){
            let octaveLine = octaveLines[j%7];
            if(octaveLine !== undefined){
                let lineY = measureLabelSpace+rowHeight-(j-minLine)*noteSymbolSize/2;
                elements.push(<rect key={key++} x={strokeWidth/2} y={lineY-strokeWidth/2} width={measureWidth-strokeWidth} height={strokeWidth} fill={octaveLine.color}/>);
                if(i%measuresPerRow===0 && octaveLine.number === true){
                    elements.push(<text x={-strokeWidth} key={key++} y={lineY} fontSize={measureLabelSpace} textAnchor="end" dominantBaseline="middle">{Math.floor(j/7)+2}</text>);
                }
                if(j < maxLine){
                    for(let i = 1; i < beatsPerMeasure; i++){
                        let tickX = measureWidth/beatsPerMeasure*i;
                        elements.push(<rect key={key++} x={tickX-strokeWidth/2} y={lineY-tickSize} width={strokeWidth} height={tickSize-strokeWidth/2} fill="#000000"/>);
                    }
                }
            }
        }

        return (
            <g id={`measure${i+1}`} key={i} transform={`translate(${x}, ${y})`}>
                {devMode?<rect width={measureWidth} height={measureLabelSpace-strokeWidth/2} fill="#ffdddd"/>:null}
                <text x={strokeWidth} y={measureLabelSpace-strokeWidth} fontSize={measureLabelSpace}>{i+1}</text>
                {elements}
            </g>
        );
    }

    let row = (i: number)=>{
        let x = horizontalPadding;
        let y = verticalPadding+i*(rowHeight+measureLabelSpace+rowPadding)
        return (
            <g id={`row${i}`} key={i} transform={`translate(${x}, ${y})`}>
                {devMode?<rect y={measureLabelSpace} width={staffLabelSpace} height={rowHeight} fill="#ffdddd"/>:null}
                {devMode?<rect x={staffLabelSpace} y={measureLabelSpace} width={octaveLabelSpace} height={rowHeight} fill="#ffddff"/>:null}
                <text x={staffLabelSpace} y={measureLabelSpace+rowHeight/2} fontSize={staffLabelSpace*1.5} textAnchor="end" dominantBaseline="middle">𝒯</text>
                <rect x={staffLabelSpace+octaveLabelSpace-strokeWidth/2} y={measureLabelSpace-strokeWidth/2} width={strokeWidth} height={rowHeight+strokeWidth} fill="#000000"/>

                {range(0,i<rowNumber-1?measuresPerRow:measureNumber-(rowNumber-1)*measuresPerRow).map(j=>
                    measure(staffLabelSpace+octaveLabelSpace+j*measureWidth,0,i*measuresPerRow+j)
                )}
            </g>
        );
    }

    let beatsToPos = (beat: number)=>{
        let row = Math.floor(beat/beatsPerRow);
        let measure = (beat-row*beatsPerRow)/beatsPerMeasure;
        return {
            row, measure,
            ...rowMeasureToPos(row,measure)
        };
    }
    let rowMeasureToPos = (row: number, measure: number)=>({
        x: horizontalPadding+staffLabelSpace+octaveLabelSpace+measure*measureWidth,
        y: verticalPadding+row*(rowHeight+measureLabelSpace+rowPadding)+rowHeight+measureLabelSpace
    });

    let noteTail = (note: basicNote, i: number)=>{
        let key = 0;
        let boxes: JSX.Element[] = [];
        
        let line = getNoteLine(note.midi)-minLine;
        
        let {row: rowStart, measure: measureStart, x: xStart, y: yStart} = beatsToPos(note.time);
        let {row: rowEnd, x: xEnd} = beatsToPos(note.time+note.duration);
        
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

    let noteHead = (note: basicNote, i: number)=>{
        let sharp = getNoteIsSharp(note.midi);
        let line = getNoteLine(note.midi)-minLine;
        let {x, y} = beatsToPos(note.time);
        x += noteSymbolSize/2;
        y -= line*noteSymbolSize/2;
        let triHeight = noteSymbolSize*Math.sqrt(3)/2;
        return (
            sharp?<polygon key={i} points={`${x},${y-triHeight/2} ${x+noteSymbolSize/2},${y+triHeight/2} ${x-noteSymbolSize/2},${y+triHeight/2}`} fill="#000000"/>
                :<circle key={i} cx={x} cy={y} r={noteSymbolSize/2} fill="#000000"/>
        );
    }

    let devSvg = devMode ? (
        <g id="devMode">
            {<rect x={0} y={0} width={width} height={height} fill="#ddddff"/>}
            {<circle cx={0} cy={0} r="40" stroke="black" strokeWidth="3" fill="red"/>}
            {<circle cx={width} cy={0} r="40" stroke="black" strokeWidth="3" fill="red"/>}
            {<circle cx={width} cy={`${height}`} r="40" stroke="black" strokeWidth="3" fill="red"/>}
            {<circle cx={0} cy={height} r="40" stroke="black" strokeWidth="3" fill="red"/>}
            {<rect x={horizontalPadding} y={verticalPadding} width={width-horizontalPadding*2} height={height-verticalPadding*2} fill="#ddffdd"/>}
        </g>
    ) : null;

    return (
        <div ref={ref}>
            <svg viewBox={`0 0 ${width} ${height}`} width={`${width}`} height={`${height}`}>
                {devSvg}
                <g id="measures">
                    {range(0,rowNumber).map(i=>row(i))}
                </g>
                <g id="notes" opacity = "1.0">
                    {tracks.map((track,i)=>track.notes.map((x,j)=>noteTail(x,i*10000000+j)))}
                    {tracks.map((track,i)=>track.notes.map((x,j)=>noteHead(x,i*10000000+j)))}
                </g>
            </svg>
        </div>
    );
};

export default SNView;
