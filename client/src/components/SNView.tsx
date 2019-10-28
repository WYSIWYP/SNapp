import React, {useEffect, useState, useRef} from 'react';
import {range} from '../util/Util';
// import {Note} from '@tonejs/midi/dist/Note';
import MusicXML from 'musicxml-interfaces';
import {parse} from '../parser/MusicXML'
import {basicNote, Score, Tie} from '../parser/Types'
import {colorPreferenceStyles, usePreferencesState} from '../contexts/Preferences';

type Props = {
    xml: MusicXML.ScoreTimewise,
    options?: {},
};

enum Accidental {
    Flat = -1,
    Natural = 0,
    Sharp = 1
}

const SNView: React.FC<Props> = ({xml, /* options, children */}) => {
    const ref = useRef(null! as HTMLDivElement);
    let [width, setWidth] = useState<number | undefined>(undefined);
    let [score, setScore] = useState<Score | undefined>(undefined);
    let [preferences,] = usePreferencesState();

    console.log(score);
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
        return <div ref={ref}></div>;
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
    let horizontalPadding = 20; //left/right padding
    let staffLabelSpace = 25; //space for staff labels
    let octaveLabelSpace = measureLabelSpace; //space for octave labels
    // let tieExtensionSpace = measureLabelSpace;

    // composite horizontal spacing
    let scoreWidth = width - 2 * horizontalPadding - staffLabelSpace - octaveLabelSpace; // width of just the WYSIWYP score
    let beatWidth = scoreWidth / score.tracks[0].timeSignatures[0].beats / preferences.measuresPerRow;

    // get key signature
    let keyFifths = score.tracks[0].keySignatures[0].fifths;

    // let octaveGroups = [1, 1, 0, 0, 0, 1, 1]; //octaveGroups (C D E / F G A B)
    // let staffLabels = ['𝒯','𝐵'];
    let octaveLines = [
        {color: 'red', number: true}, undefined, undefined, /* C, D, E */
        {color: 'blue'}, undefined, undefined, undefined, /* F, G, A, B */
    ];
    let accidentalMap = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0].map(x => x === 1); // C, C#, D, D#, E, ...
    let noteMap = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

    let getNoteAccidental = (note: number): Accidental => {
        return accidentalMap[note % 12] ? (keyFifths >= 0 ? Accidental.Sharp : Accidental.Flat) : Accidental.Natural;
    };

    // We map C0 (midi note 12) to line 0.
    let getNoteLine = (note: number) => {
        let line = Math.floor(note / 12 - 1) * 7 + noteMap[note % 12];
        line += getNoteAccidental(note) < 0 ? 1 : 0; // if note is flat, we need to bring it a line higher.
        return line;
    };
    //calculate lowest and highest note
    let minNote = 128, maxNote = -1;
    score.tracks.forEach(track => {
        track.measures.forEach(measure => {
            measure.forEach(note => {
                minNote = Math.min(minNote, note.midi);
                maxNote = Math.max(maxNote, note.midi);
            });
        });
    });

    //if there was an issue, abort
    if (minNote >= 128 || minNote < 0 || maxNote >= 128 || maxNote < 0) {
        console.log(minNote, maxNote);
        throw new Error('An issue was detected while analyzing this work\'s note range');
    }

    //calculate the height of each row (based upon low/high notes and oct groups)
    let minLine = getNoteLine(minNote);
    let maxLine = getNoteLine(maxNote);

    // TODO: draw minimal number of lines
    // find the closest colored line for minNote and minLine
    while (minLine % 7 !== 0 && minLine % 7 !== 3) minLine--;
    while (maxLine % 7 !== 0 && maxLine % 7 !== 3) maxLine++;

    // widen staff range if it is too small
    if (Math.abs(maxLine - minLine) <= 1) {
        maxLine += (maxLine % 7 === 0) ? 3 : 4;
        minLine -= (minLine % 7 === 0) ? 4 : 3;
    }

    let rowHeight = (maxLine - minLine) * noteSymbolSize / 2; //not including measure labels

    // TODO: Refactor logic below
    //calculate the number of beats per measure
    let beatsPerMeasure = score.tracks[0].timeSignatures.length > 0 ? score.tracks[0].timeSignatures[0].beats : 4; // TODO: empty check shouldn't be necessary
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
    let measureNumber = score.tracks.reduce((accum, track) => Math.max(accum, track.measures.length), 0);
    if (measureNumber <= 0) {
        throw new Error('Failed to identify number of measures');
    }
    let rowNumber = Math.ceil(measureNumber / measuresPerRow);

    //calculate required height (vert padding + row height + row padding)
    // let height = verticalPadding * 2 + rowNumber * (rowHeight + measureLabelSpace) + (rowNumber - 1) * rowPadding;

    let getTimeSignature = (measureNumber: number) => {
        let timeSignatures = [...score!.tracks[0].timeSignatures].reverse(); // we reverse the array because we want to find the latest key signature.
        let keySignatures = [...score!.tracks[0].keySignatures].reverse();

        const currentTime = timeSignatures.find(timeSignature => timeSignature.measure <= measureNumber)!;
        const currentKey = keySignatures.find((keySignature) => keySignature.measure <= measureNumber);

        console.log({currentTime, currentKey});
        return {currentTime, currentKey};
    }

    let measure = (x: number, y: number, measureNumber: number) => {
        // Get time signature of current measure // TODO: reduce number of calls
        let {currentTime, currentKey} = getTimeSignature(measureNumber);
        beatWidth = scoreWidth / currentTime.beats / preferences.measuresPerRow;
        beatsPerMeasure = currentTime.beats;
        keyFifths = currentKey!.fifths;

        // Draw measure
        let key = 0;
        let measureSVG: JSX.Element[] = [];
        measureSVG.push(<rect key={key++} x={measureWidth - strokeWidth / 2} y={measureLabelSpace - strokeWidth / 2} width={strokeWidth} height={rowHeight + strokeWidth} fill="#000000" />);
        for (let j = minLine; j <= maxLine; j++) {
            let octaveLine = octaveLines[j % 7];
            if (octaveLine !== undefined) {
                let lineY = measureLabelSpace + rowHeight - (j - minLine) * noteSymbolSize / 2;
                measureSVG.push(<rect key={key++} x={strokeWidth / 2} y={lineY - strokeWidth / 2} width={measureWidth - strokeWidth} height={strokeWidth} fill={octaveLine.color} />);
                if (measureNumber % measuresPerRow === 0 && octaveLine.number === true) {
                    measureSVG.push(<text x={-strokeWidth} key={key++} y={lineY} fontSize={measureLabelSpace} textAnchor="end" dominantBaseline="middle">{Math.floor(j / 7)}</text>);
                }
                if (j < maxLine) {
                    for (let measureNumber = 1; measureNumber < beatsPerMeasure; measureNumber++) {
                        let tickX = measureWidth / beatsPerMeasure * measureNumber;
                        measureSVG.push(<rect key={key++} x={tickX - strokeWidth / 2} y={lineY - tickSize} width={strokeWidth} height={tickSize - strokeWidth / 2} fill="#000000" />);
                    }
                }
            }
        }

        // Add notes to the measure
        const noteHeadSVG: JSX.Element[] = [];
        const noteTailSVG: JSX.Element[] = [];
        score!.tracks.forEach(track => {
            track.measures[measureNumber].forEach(note => {
                noteHeadSVG.push(noteHead(note, key++));
                noteTailSVG.push(noteTail(note, key++));
            });
        });

        return (
            <g id={`measure${measureNumber + 1}`} key={measureNumber} transform={`translate(${x}, ${y})`}>
                <g id='frame'>
                    {devMode ? <rect width={measureWidth} height={measureLabelSpace - strokeWidth / 2} fill="#ffdddd" /> : null}
                    <text x={strokeWidth} y={measureLabelSpace - strokeWidth} fontSize={measureLabelSpace}>{measureNumber + 1}</text>
                    {measureSVG}
                </g>
                <g id='notes'>
                    {noteTailSVG}
                    {noteHeadSVG}
                </g>
            </g>
        );
    }

    let row = (i: number): JSX.Element => {
        let height = (rowHeight + measureLabelSpace) + noteSymbolSize / 2; // TODO: need to add paddings between rows

        return (
            <svg id={`row${i}`} key={i} viewBox={`0 0 ${width} ${height}`}>
                <g id={`row${i}`} key={i} transform={`translate(${horizontalPadding}, 0)`}>
                    {devMode ? <rect y={measureLabelSpace} width={staffLabelSpace} height={rowHeight} fill="#ffdddd" /> : null}
                    {devMode ? <rect x={staffLabelSpace} y={measureLabelSpace} width={octaveLabelSpace} height={rowHeight} fill="#ffddff" /> : null}
                    <text x={staffLabelSpace} y={measureLabelSpace + rowHeight / 2} fontSize={staffLabelSpace * 1.5} textAnchor="end" dominantBaseline="middle">𝒯</text>
                    <rect x={staffLabelSpace + octaveLabelSpace - strokeWidth / 2} y={measureLabelSpace - strokeWidth / 2} width={strokeWidth} height={rowHeight + strokeWidth} fill="#000000" />

                    {range(0, i < rowNumber - 1 ? measuresPerRow : measureNumber - (rowNumber - 1) * measuresPerRow).map(j =>
                        measure(staffLabelSpace + octaveLabelSpace + j * measureWidth, 0, i * measuresPerRow + j)
                    )}
                </g>
            </svg>
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

        // TODO: clean up logic below
        let {row: rowStart, measure: measureStart} = beatsToPos(note.time);
        let {row: rowEnd} = beatsToPos(note.time + note.duration);

        let xStart = beatWidth * note.time;
        let xEnd = beatWidth * (note.time + note.duration);
        let yStart = rowHeight + measureLabelSpace;

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
        if (note.attributes.ties.includes(Tie.Stop))
            return;
        let accidental: Accidental = getNoteAccidental(note.midi);
        let line = getNoteLine(note.midi) - minLine;

        let x = beatWidth * note.time;
        let y = rowHeight + measureLabelSpace;

        x += noteSymbolSize / 2;
        y -= line * noteSymbolSize / 2;
        let triHeight = noteSymbolSize * Math.sqrt(3) / 2;

        let strokeWidth = 3;
        let crossCircleWidth = noteSymbolSize / 2 / Math.sqrt(2);

        let triangleUp = <polygon key={i} points={`${x},${y - triHeight / 2} ${x + noteSymbolSize / 2},${y + triHeight / 2} ${x - noteSymbolSize / 2},${y + triHeight / 2}`} fill={colorPreferenceStyles[preferences.noteSymbolColor]} />;
        let triangleDown = <polygon key={i} points={`${x},${y + triHeight / 2} ${x + noteSymbolSize / 2},${y - triHeight / 2} ${x - noteSymbolSize / 2},${y - triHeight / 2}`} fill={colorPreferenceStyles[preferences.noteSymbolColor]} />;
        let hollowCircle = <circle key={i} cx={x} cy={y} r={(noteSymbolSize - strokeWidth) / 2} strokeWidth={strokeWidth} stroke={colorPreferenceStyles[preferences.noteSymbolColor]} fill='none' />;
        let circle = <circle key={i} cx={x} cy={y} r={noteSymbolSize / 2} fill={colorPreferenceStyles[preferences.noteSymbolColor]} />;

        let crossCircle = <g key={i}>
            <circle cx={x} cy={y} r={(noteSymbolSize - 2) / 2} strokeWidth={2} stroke={colorPreferenceStyles[preferences.noteSymbolColor]} fill='none' />;
            <line x1={x - crossCircleWidth} y1={y - crossCircleWidth} x2={x + crossCircleWidth} y2={y + crossCircleWidth} stroke={colorPreferenceStyles[preferences.noteSymbolColor]} strokeWidth={2} />
            <line x1={x - crossCircleWidth} y1={y + crossCircleWidth} x2={x + crossCircleWidth} y2={y - crossCircleWidth} stroke={colorPreferenceStyles[preferences.noteSymbolColor]} strokeWidth={2} />
        </g>

        let square = <rect x={x - noteSymbolSize / 2 + strokeWidth / 2} y={y - noteSymbolSize / 2 + strokeWidth / 2} width={noteSymbolSize - strokeWidth} height={noteSymbolSize - strokeWidth} fill={colorPreferenceStyles[preferences.noteSymbolColor]} />
        let hollowSquare = <rect x={x - noteSymbolSize / 2 + strokeWidth / 2} y={y - noteSymbolSize / 2 + strokeWidth / 2} width={noteSymbolSize - strokeWidth} height={noteSymbolSize - strokeWidth} stroke={colorPreferenceStyles[preferences.noteSymbolColor]} strokeWidth={strokeWidth} fill='none' />

        let noteShapes = {
            '▲': triangleUp,
            '▼': triangleDown,
            '○': hollowCircle,
            '●': circle,
            '◼': square,
            '□': hollowSquare,
            '⨂': crossCircle,
        } as any;
        return accidental === 0 ? noteShapes[preferences.naturalNoteShape] : (accidental > 0 ? noteShapes[preferences.sharpNoteShape] : noteShapes[preferences.flatNoteShape]);
    }

    // let devSvg = devMode ? (
    //     <g id="devMode">
    //         {<rect x={0} y={0} width={width} height={height} fill="#ddddff" />}
    //         {<circle cx={0} cy={0} r="40" stroke="black" strokeWidth="3" fill="red" />}
    //         {<circle cx={width} cy={0} r="40" stroke="black" strokeWidth="3" fill="red" />}
    //         {<circle cx={width} cy={`${height}`} r="40" stroke="black" strokeWidth="3" fill="red" />}
    //         {<circle cx={0} cy={height} r="40" stroke="black" strokeWidth="3" fill="red" />}
    //         {<rect x={horizontalPadding} y={verticalPadding} width={width - horizontalPadding * 2} height={height - verticalPadding * 2} fill="#ddffdd" />}
    //     </g>
    // ) : null;

    let svgRows: JSX.Element[] = range(0, rowNumber).map(i => row(i));
    return (
        <div id="snview" ref={ref} style={{width: '100%', height: 'auto', overflow: 'hidden', minWidth: '350px', userSelect: 'text'}}>
            {/*devSvg*/}
            {svgRows}
        </div>
    );
};

export default SNView;
