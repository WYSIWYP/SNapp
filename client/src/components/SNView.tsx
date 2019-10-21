import React, {useEffect, useState, useRef} from 'react';
import {range} from '../util/Util';
// import {Note} from '@tonejs/midi/dist/Note';
import MusicXML from 'musicxml-interfaces';
import {parse} from '../parser/MusicXML'
import {basicNote, Score} from '../parser/Types'
import {colorPreferenceStyles, usePreferencesState, noteHeadPreferenceOption} from '../contexts/Preferences';

type Props = {
    xml: MusicXML.ScoreTimewise,
    options?: {},
};

const SNView: React.FC<Props> = ({xml, options, children}) => {
    const ref = useRef(null! as HTMLDivElement);
    let [width, setWidth] = useState<number | undefined>(undefined);
    let [score, setScore] = useState<Score | undefined>(undefined);
    let [preferences,] = usePreferencesState();

    useEffect(() => {
        let width: number = undefined!;
        let callback = () => {
            let newWidth = ref.current!.getBoundingClientRect().width;
            if (width !== newWidth) {
                width = newWidth;
                setWidth(newWidth);
            }
        }
        window.addEventListener("resize", callback);
        let interval = setInterval(callback, 20);
        callback();
        return () => {
            window.removeEventListener("resize", callback);
            clearInterval(interval);
        }
    }, []);


    useEffect(() => {
        // parse only when page loads or xml changes
        setScore(parse(xml));
    }, [xml]);

    if (score === undefined || width === undefined) { //skip first render when width is unknown or parsing is incomplete
        return <div ref={ref}></div>; //<div ref={ref}>Loading...</div>; //need to add styling for the loading message.. the empty div is just to set the ref value
    }

    let devMode = false;
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

    let octaveGroups = [1, 1, 0, 0, 0, 1, 1]; //octaveGroups (C D E / F G A B)
    // let staffLabels = ['𝒯','𝐵'];
    let octaveLines = [undefined, undefined, {
        color: 'red', number: true
    }, undefined, undefined, {
            color: 'blue'
        }, undefined];
    let sharpMap = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0].map(x => x === 1);
    let noteMap = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

    let getNoteIsSharp = (note: number) => sharpMap[note % 12];
    let getNoteLine = (note: number) => Math.floor(note / 12) * 7 + noteMap[note % 12];


    // type staff = {
    //     notes: Note[],
    // };

    //let staves: staff[] = midi.tracks.filter(x=>x.notes.length>0).map(x=>{});

    //calculate lowest note per row
    let minNote = score.tracks.reduce((x, track) => Math.min(x, track.notes.reduce((x, note) => Math.min(x, note.midi), 128)), 128);

    //calculate highest note per row
    let maxNote = score.tracks.reduce((x, track) => Math.max(x, track.notes.reduce((x, note) => Math.max(x, note.midi), -1)), -1);

    //if there was an issue, abort
    if (minNote >= 128 || minNote < 0 || maxNote >= 128 || maxNote < 0) {
        console.log(minNote, maxNote);
        throw new Error('An issue was detected while analyzing this work\'s note range');
    }


    //calculate the height of each row (based upon low/high notes and oct groups)
    let minLine = getNoteLine(minNote);
    while (octaveGroups[minLine % 7] === octaveGroups[(minLine - 1 + 7) % 7]) {
        minLine--;
    }
    let maxLine = getNoteLine(maxNote);
    while (octaveGroups[maxLine % 7] === octaveGroups[(maxLine - 1 + 7) % 7]) {
        maxLine++;
    }
    let rowHeight = (maxLine - minLine) * noteSymbolSize / 2; //not including measure labels

    //calculate the number of beats per measure
    let beatsPerMeasure = score.tracks[0].timeSignatures.length > 0 ? score.tracks[0].timeSignatures[0].beats : 4;
    let measureWidth = beatWidth * beatsPerMeasure;

    //calculate tne number of measures per row
    let availableMeasureSpace = width - horizontalPadding * 2 - staffLabelSpace - octaveLabelSpace;
    let measuresPerRow = Math.floor(availableMeasureSpace / measureWidth);
    if (measuresPerRow <= 0) {
        throw new Error('Could not place a measure in the allowed space');
    }
    horizontalPadding += (availableMeasureSpace - measuresPerRow * measureWidth) / 2; //update horizontal padding to center rows

    //calculate the number of rows
    //let ticksPerMeasure = midi.header.ppq*beatsPerMeasure; //needs to take into account size of a beat
    let beatsPerRow = beatsPerMeasure * measuresPerRow;
    let measureNumber = Math.ceil(score.duration / beatsPerMeasure);
    if (measureNumber <= 0) {
        throw new Error('Failed to identify number of measures');
    }
    let rowNumber = Math.ceil(measureNumber / measuresPerRow);

    //calculate required height (vert padding + row height + row padding)
    let height = verticalPadding * 2 + rowNumber * (rowHeight + measureLabelSpace) + (rowNumber - 1) * rowPadding;

    let measure = (x: number, y: number, i: number) => {
        let key = 0;
        let elements: JSX.Element[] = [];
        elements.push(<rect key={key++} x={measureWidth - strokeWidth / 2} y={measureLabelSpace - strokeWidth / 2} width={strokeWidth} height={rowHeight + strokeWidth} fill="#000000" />);

        for (let j = minLine; j <= maxLine; j++) {
            let octaveLine = octaveLines[j % 7];
            if (octaveLine !== undefined) {
                let lineY = measureLabelSpace + rowHeight - (j - minLine) * noteSymbolSize / 2;
                elements.push(<rect key={key++} x={strokeWidth / 2} y={lineY - strokeWidth / 2} width={measureWidth - strokeWidth} height={strokeWidth} fill={octaveLine.color} />);
                if (i % measuresPerRow === 0 && octaveLine.number === true) {
                    elements.push(<text x={-strokeWidth} key={key++} y={lineY} fontSize={measureLabelSpace} textAnchor="end" dominantBaseline="middle">{Math.floor(j / 7) + 2}</text>);
                }
                if (j < maxLine) {
                    for (let i = 1; i < beatsPerMeasure; i++) {
                        let tickX = measureWidth / beatsPerMeasure * i;
                        elements.push(<rect key={key++} x={tickX - strokeWidth / 2} y={lineY - tickSize} width={strokeWidth} height={tickSize - strokeWidth / 2} fill="#000000" />);
                    }
                }
            }
        }

        return (
            <g id={`measure${i + 1}`} key={i} transform={`translate(${x}, ${y})`}>
                {devMode ? <rect width={measureWidth} height={measureLabelSpace - strokeWidth / 2} fill="#ffdddd" /> : null}
                <text x={strokeWidth} y={measureLabelSpace - strokeWidth} fontSize={measureLabelSpace}>{i + 1}</text>
                {elements}
            </g>
        );
    }

    let row = (i: number) => {
        let x = horizontalPadding;
        let y = verticalPadding + i * (rowHeight + measureLabelSpace + rowPadding)
        return (
            <g id={`row${i}`} key={i} transform={`translate(${x}, ${y})`}>
                {devMode ? <rect y={measureLabelSpace} width={staffLabelSpace} height={rowHeight} fill="#ffdddd" /> : null}
                {devMode ? <rect x={staffLabelSpace} y={measureLabelSpace} width={octaveLabelSpace} height={rowHeight} fill="#ffddff" /> : null}
                <text x={staffLabelSpace} y={measureLabelSpace + rowHeight / 2} fontSize={staffLabelSpace * 1.5} textAnchor="end" dominantBaseline="middle">𝒯</text>
                <rect x={staffLabelSpace + octaveLabelSpace - strokeWidth / 2} y={measureLabelSpace - strokeWidth / 2} width={strokeWidth} height={rowHeight + strokeWidth} fill="#000000" />

                {range(0, i < rowNumber - 1 ? measuresPerRow : measureNumber - (rowNumber - 1) * measuresPerRow).map(j =>
                    measure(staffLabelSpace + octaveLabelSpace + j * measureWidth, 0, i * measuresPerRow + j)
                )}
            </g>
        );
    }

    let beatsToPos = (beat: number) => {
        let row = Math.floor(beat / beatsPerRow);
        let measure = (beat - row * beatsPerRow) / beatsPerMeasure;
        return {
            row, measure,
            ...rowMeasureToPos(row, measure)
        };
    }
    let rowMeasureToPos = (row: number, measure: number) => ({
        x: horizontalPadding + staffLabelSpace + octaveLabelSpace + measure * measureWidth,
        y: verticalPadding + row * (rowHeight + measureLabelSpace + rowPadding) + rowHeight + measureLabelSpace
    });

    let noteTail = (note: basicNote, i: number) => {
        let key = 0;
        let boxes: JSX.Element[] = [];

        let line = getNoteLine(note.midi) - minLine;

        let {row: rowStart, measure: measureStart, x: xStart, y: yStart} = beatsToPos(note.time);
        let {row: rowEnd, x: xEnd} = beatsToPos(note.time + note.duration);

        let pushBox = (x1: number, x2: number, y: number) => {
            boxes.push(<rect key={key++} x={x1} y={y - (line + 1) * noteSymbolSize / 2} width={x2 - x1} height={noteSymbolSize} fill={colorPreferenceStyles[preferences.noteDurationColor]} fillOpacity={.5} />);
        }
        while (rowStart < rowEnd) {
            //only executes rarely so it is faster to compute this value in the loop
            pushBox(xStart, horizontalPadding + staffLabelSpace + octaveLabelSpace + measuresPerRow * measureWidth, yStart);
            rowStart++;
            measureStart = 0;
            let {x, y} = rowMeasureToPos(rowStart, measureStart);
            xStart = x;
            yStart = y;
        }
        pushBox(xStart, xEnd, yStart);

        return (
            <React.Fragment key={i}>
                {boxes}
            </React.Fragment>
        );
    }

    let noteHead = (note: basicNote, i: number) => {
        let sharp = getNoteIsSharp(note.midi);
        let line = getNoteLine(note.midi) - minLine;
        let {x, y} = beatsToPos(note.time);
        x += noteSymbolSize / 2;
        y -= line * noteSymbolSize / 2;
        let triHeight = noteSymbolSize * Math.sqrt(3) / 2;

        let strokeWidth = 3;
        let crossCircleWidth = noteSymbolSize/2/Math.sqrt(2);

        let triangleUp = <polygon key={i} points={`${x},${y - triHeight / 2} ${x + noteSymbolSize / 2},${y + triHeight / 2} ${x - noteSymbolSize / 2},${y + triHeight / 2}`} fill={colorPreferenceStyles[preferences.noteSymbolColor]} />;
        let triangleDown = <polygon key={i} points={`${x},${y + triHeight / 2} ${x + noteSymbolSize / 2},${y - triHeight / 2} ${x - noteSymbolSize / 2},${y - triHeight / 2}`} fill={colorPreferenceStyles[preferences.noteSymbolColor]} />;
        let hollowCircle = <circle key={i} cx={x} cy={y} r={(noteSymbolSize - strokeWidth) / 2} strokeWidth={strokeWidth} stroke={colorPreferenceStyles[preferences.noteSymbolColor]} fill='none' />;
        let circle = <circle key={i} cx={x} cy={y} r={noteSymbolSize / 2} fill={colorPreferenceStyles[preferences.noteSymbolColor]} />;
        
        let crossCircle = <g key={i}>
            <circle cx={x} cy={y} r={(noteSymbolSize - 2) / 2} strokeWidth={2} stroke={colorPreferenceStyles[preferences.noteSymbolColor]} fill='none' />;
            <line x1={x  -  crossCircleWidth } y1={ y - crossCircleWidth } x2={ x + crossCircleWidth} y2={ y + crossCircleWidth} stroke={colorPreferenceStyles[preferences.noteSymbolColor]} strokeWidth={2}/>
            <line x1={x  -  crossCircleWidth } y1={ y + crossCircleWidth } x2={ x + crossCircleWidth} y2={ y - crossCircleWidth} stroke={colorPreferenceStyles[preferences.noteSymbolColor]} strokeWidth={2}/>
        
        </g>

        let square = <rect x={x - noteSymbolSize/2 + strokeWidth/2 } y={y - noteSymbolSize/2 + strokeWidth/2} width={noteSymbolSize - strokeWidth} height={noteSymbolSize - strokeWidth} fill={colorPreferenceStyles[preferences.noteSymbolColor]} />
        let hollowSquare = <rect x={x - noteSymbolSize/2 + strokeWidth/2 } y={y - noteSymbolSize/2 + strokeWidth/2} width={noteSymbolSize - strokeWidth} height={noteSymbolSize - strokeWidth} stroke={colorPreferenceStyles[preferences.noteSymbolColor]} strokeWidth={strokeWidth} fill='none'  />
        
        
        return (
            ({
                '▲': triangleUp,
                '▼': triangleDown,
                '○': hollowCircle,
                '●': circle,
                '◼': square, 
                '□': hollowSquare,
                '⨂': crossCircle,
            } as any)[sharp ? preferences.sharpNoteShape : preferences.naturalNoteShape]
        );
    }

    let devSvg = devMode ? (
        <g id="devMode">
            {<rect x={0} y={0} width={width} height={height} fill="#ddddff" />}
            {<circle cx={0} cy={0} r="40" stroke="black" strokeWidth="3" fill="red" />}
            {<circle cx={width} cy={0} r="40" stroke="black" strokeWidth="3" fill="red" />}
            {<circle cx={width} cy={`${height}`} r="40" stroke="black" strokeWidth="3" fill="red" />}
            {<circle cx={0} cy={height} r="40" stroke="black" strokeWidth="3" fill="red" />}
            {<rect x={horizontalPadding} y={verticalPadding} width={width - horizontalPadding * 2} height={height - verticalPadding * 2} fill="#ddffdd" />}
        </g>
    ) : null;

    return (
        <div id="snview" ref={ref} style={{width: '100%', height: 'auto', overflow: 'hidden', minWidth: '350px'}}>
            <svg viewBox={`0 0 ${width} ${height}`} width={`${width}`} height={`${height}`}>
                {devSvg}
                <g id="measures">
                    {range(0, rowNumber).map(i => row(i))}
                </g>
                <g id="notes" opacity="1.0">
                    {score.tracks.map((track, i) => track.notes.map((x, j) => noteTail(x, i * 10000000 + j)))}
                    {score.tracks.map((track, i) => track.notes.map((x, j) => noteHead(x, i * 10000000 + j)))}
                </g>
            </svg>
        </div>
    );
};

export default SNView;
