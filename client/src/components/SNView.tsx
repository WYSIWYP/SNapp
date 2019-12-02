import React, {useEffect, useState, useRef} from 'react';
import {range} from '../util/Util';
// import {Note} from '@tonejs/midi/dist/Note';
import MusicXML from 'musicxml-interfaces';
import {parse} from '../parser/MusicXML'
import {Note, Score, Tie, TimeSignature, KeySignature, StaffType} from '../parser/Types'
import {colorPreferenceStyles, usePreferencesState, spacingPreferenceOption, scalePreferenceOption} from '../contexts/Preferences';
import {useDialogState} from '../contexts/Dialog';
import * as Dialog from '../util/Dialog';
import {navigate} from '@reach/router';

type Props = {
    xml: MusicXML.ScoreTimewise,
    forcedWidth?: number,
};

enum Accidental {
    Flat = -1,
    Natural = 0,
    Sharp = 1
};

const SNView: React.FC<Props> = ({xml, forcedWidth}) => {
    console.log(xml)
    const ref = useRef(null! as HTMLDivElement);
    let [width, setWidth] = useState<number | undefined>(undefined);
    let [score, setScore] = useState<Score | undefined>(undefined);
    let [preferences,] = usePreferencesState();

    let [dialogState, setDialogState] = useDialogState();

    let showError = (error: string) => {
        setDialogState(Dialog.showMessage('An Error Occurred', error, 'Close', () => {
            navigate('/');
            setImmediate(() => setDialogState(Dialog.close()));
        }));
    }
    let showErrorRef = useRef(showError);

    console.log('Score:', score);
    useEffect(() => {
        if (forcedWidth === undefined) {
            let width: number = undefined!;
            let callback = () => {
                let newWidth = ref.current!.getBoundingClientRect().width;
                if (width !== newWidth) {
                    width = newWidth;
                    setWidth(newWidth);
                }
            };
            window.addEventListener("resize", callback);
            // let interval = setInterval(callback, 20);
            callback();
            return () => {
                window.removeEventListener("resize", callback);
                // clearInterval(interval);
            }
        } else {
            setWidth(forcedWidth);
        }
    }, [setWidth, forcedWidth]);

    useEffect(() => {
        // parse only when page loads or xml changes
        try {
            setScore(parse(xml));
        } catch (e) {
            showErrorRef.current('An issue was encountered while processing this file.');
            console.error(e);
        }
    }, [xml]);

    if (score === undefined || width === undefined) { //skip first render when width is unknown or parsing is incomplete
        return <div ref={ref}></div>;
    }

    try {
        let devMode = false;

        // fetch preference values
        let {
            noteDurationColor,
            noteSymbolColor,
            staffScale,
            horizontalSpacing,
            verticalSpacing,
            noteScale,
            naturalNoteShape,
            sharpNoteShape,
            flatNoteShape,
            measuresPerRow,
            accidentalType
        } = preferences;

        // Map preference strings to numeric values 
        let noteScaleMap: Record<scalePreferenceOption, number> = {
            small: 15,
            medium: 20,
            large: 25
        }
        let staffScaleMap: Record<scalePreferenceOption, number> = {
            small: 18,
            medium: 25,
            large: 32
        };
        let verticalSpacingMap: Record<spacingPreferenceOption, number> = {
            narrow: 10,
            moderate: 30,
            wide: 50
        };
        let horizontalSpacingMap: Record<spacingPreferenceOption, number> = {
            narrow: 20,
            moderate: 40,
            wide: 60
        };

        //general spacing
        let noteSymbolSize = noteScaleMap[noteScale]; //width/height of note symbols
        let strokeWidth = 2;
        let tickSize = 7;

        //vertical spacing
        let verticalPadding = 30; //top/bottom padding
        let rowPadding = verticalSpacingMap[verticalSpacing]; //space between rows
        let measureLabelSpace = 15; //space for measure labels

        //horizontal spacing
        let horizontalPadding = horizontalSpacingMap[horizontalSpacing]; //left/right padding
        let staffLabelSpace = staffScaleMap[staffScale]; //space for staff labels
        let octaveLabelSpace = measureLabelSpace; //space for octave labels
        // let tieExtensionSpace = measureLabelSpace;

        // composite horizontal spacing
        let scoreWidth = width - 2 * horizontalPadding - staffLabelSpace - octaveLabelSpace; // width of just the WYSIWYP score
        let beatWidth = scoreWidth / score.tracks[0].timeSignatures[0].beats / measuresPerRow;

        // get key signature
        let keyFifths = score.tracks[0].keySignatures[0].fifths;

        // let octaveGroups = [1, 1, 0, 0, 0, 1, 1]; //octaveGroups (C D E / F G A B)
        let staffLabels = ['𝒯', '𝄢'];
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

            // if note is flat, we need to bring it a line higher.
            if (accidentalType === 'auto' && getNoteAccidental(note) < 0) line++;
            else if (accidentalType === 'flat' && getNoteAccidental(note) !== 0) line++; // handle user override

            return line;
        };

        //find the title and author
        let title = '';
        try {
            title = xml.movementTitle;
            title = xml.work.workTitle;
        } catch (e) {}

        let author = '';
        try {
            let credits = xml.credits.filter(x => x.creditWords !== undefined && x.creditWords.length > 0).map(x => x.creditWords);
            credits.forEach(credit => {
                credit.forEach(words => {
                    if (Math.abs(words.words.length - 20) < Math.abs(author.length - 20)) {
                        author = words.words;
                    }
                })
            })
        } catch (e) {}

        let minNote: Record<StaffType, number> = {
            treble: 128,
            bass: 128
        };

        let maxNote: Record<StaffType, number> = {
            treble: -1,
            bass: -1
        };

        //calculate lowest and highest note
        let instrumentTrack = score.tracks.filter(track => track.trackTypes.includes('Instrument'))[0];
        instrumentTrack.measures.forEach(measure => {
            measure.forEach(note => {
                minNote[note.staff] = Math.min(minNote[note.staff], note.midi);
                maxNote[note.staff] = Math.max(maxNote[note.staff], note.midi);
            })
        });

        let staffTypes: StaffType[] = ['treble', 'bass'];
        //if there was an issue, abort

        // if bass clef is empty, then we create an empty clef
        let bassClefIsEmpty = false;
        if (minNote.bass === 128 && maxNote.bass === -1) {
            bassClefIsEmpty = true;
            minNote.bass = 48;
            maxNote.bass = 60;
        }

        staffTypes.forEach(staff => {
            if (minNote[staff] >= 128 || minNote[staff] < 0 || maxNote[staff] >= 128 || maxNote[staff] < 0) {
                console.log(minNote[staff], maxNote[staff]);
                throw new Error('An issue was detected while analyzing this work\'s note range');
            }
        });

        //calculate the height of each row (based upon low/high notes and oct groups)
        let minLine: Record<StaffType, number> = {
            treble: getNoteLine(minNote.treble),
            bass: getNoteLine(minNote.bass)
        }
        let maxLine: Record<StaffType, number> = {
            treble: getNoteLine(maxNote.treble),
            bass: getNoteLine(maxNote.bass)
        }
        staffTypes.forEach(staff => {
            // find the closest note line
            while (minLine[staff] % 7 !== 0 && minLine[staff] % 7 !== 3) minLine[staff]--;
            while (maxLine[staff] % 7 !== 0 && maxLine[staff] % 7 !== 3) maxLine[staff]++;

            // widen staff range if it is too small
            if (Math.abs(maxLine[staff] - minLine[staff]) <= 1) {
                maxLine[staff] += (maxLine[staff] % 7 === 0) ? 3 : 4;
                minLine[staff] -= (minLine[staff] % 7 === 0) ? 4 : 3;
            }
        });
        let staffHeights: Record<StaffType, number> = {
            treble: (maxLine.treble - minLine.treble) * noteSymbolSize / 2,
            bass: (maxLine.bass - minLine.bass) * noteSymbolSize / 2
        }

        //calculate the number of beats per measure
        let beatsPerMeasure = score.tracks[0].timeSignatures[0].beats;
        let measureWidth = beatWidth * beatsPerMeasure;

        //calculate tne number of measures per row
        let availableMeasureSpace = width - horizontalPadding * 2 - staffLabelSpace - octaveLabelSpace;
        // let measuresPerRow = Math.floor(availableMeasureSpace / measureWidth);
        // if (measuresPerRow <= 0) {
        //     throw new Error('Could not place a measure in the allowed space');
        // }
        horizontalPadding += (availableMeasureSpace - measuresPerRow * measureWidth) / 2; //update horizontal padding to center rows

        //calculate the number of rows
        //let ticksPerMeasure = midi.header.ppq*beatsPerMeasure; //needs to take into account size of a beat
        // let beatsPerRow = beatsPerMeasure * measuresPerRow;
        let measureNumber = score.tracks.reduce((accum, track) => Math.max(accum, track.measures.length), 0);
        if (measureNumber <= 0) {
            throw new Error('Failed to identify number of measures');
        }
        let rowNumber = Math.ceil(measureNumber / measuresPerRow);

        //calculate required height (vert padding + row height + row padding)
        // let height = verticalPadding * 2 + rowNumber * (staffHeight + measureLabelSpace) + (rowNumber - 1) * rowPadding;

        let getCurrentSignatures = (measureNumber: number): {currentTime: TimeSignature, currentKey: KeySignature} => {
            let timeSignatures = [...score!.tracks[0].timeSignatures].reverse(); // we reverse the array because we want to find the latest key signature.
            let keySignatures = [...score!.tracks[0].keySignatures].reverse();

            let currentTime = timeSignatures.find(timeSignature => timeSignature.measure <= measureNumber);
            let currentKey = keySignatures.find(keySignature => keySignature.measure <= measureNumber);

            // sometimes, signatures are defined on the second measure. Below lines handle such cases.
            if (!currentTime) currentTime = score!.tracks[0].timeSignatures[0];
            if (!currentKey) currentKey = score!.tracks[0].keySignatures[0];
            return {currentTime, currentKey};
        }

        let grandStaff = (i: number): JSX.Element => {
            return (
                <div className={`snview-row snview-row-${i + 1}`} key={i} style={{position: 'relative', height: 'auto', paddingTop: `${rowPadding}px`}}>
                    {staff(i, 'treble')}
                    {staffBreak(i)} {/* information that goes between two staffs */}
                    {staff(i, 'bass')}
                    {pedal(i)}
                </div>
            );
        }

        let staff = (i: number, staff: StaffType): JSX.Element | null => {
            if (bassClefIsEmpty && staff === 'bass') return null;
            let staffHeight = staffHeights[staff];
            let svgHeight = staffHeight + measureLabelSpace + noteSymbolSize;
            let staffName = staff === 'treble' ? staffLabels[0] : staffLabels[1];

            return <svg viewBox={`0 0 ${width} ${svgHeight}`} transform={`translate(${horizontalPadding}, 0)`}>
                {devMode ? <rect y={measureLabelSpace} width={staffLabelSpace} height={staffHeight} fill="#ffdddd" /> : null}
                {devMode ? <rect x={staffLabelSpace} y={measureLabelSpace} width={octaveLabelSpace} height={staffHeight} fill="#ffddff" /> : null}
                <text x={staffLabelSpace} y={measureLabelSpace + staffHeight / 2} fontSize={staffLabelSpace * 1.5} textAnchor="end" dominantBaseline="middle">{staffName}</text>
                <rect x={staffLabelSpace + octaveLabelSpace - strokeWidth / 2} y={measureLabelSpace - strokeWidth / 2} width={strokeWidth} height={staffHeight + strokeWidth} fill="#000000" />

                {range(0, i < rowNumber - 1 ? measuresPerRow : measureNumber - (rowNumber - 1) * measuresPerRow).map(j =>
                    measure(staffLabelSpace + octaveLabelSpace + j * measureWidth, 0, i * measuresPerRow + j, staff)
                )}
            </svg>
        }

        let staffBreak = (i: number): JSX.Element | null => {
            // 1. lyrics
            let lyrics: JSX.Element[] = [];
            let lyricsTrack = score!.tracks.find(track => track.trackTypes.includes('Lyrics'));
            if (lyricsTrack === undefined) return null;
            let key = 0;

            let notesAtRow = lyricsTrack.measures.slice(i * measuresPerRow, (i + 1) * measuresPerRow);
            // let rowIsEmpty = notesAtRow.every(measure => measure.length === 0);
            // if (rowIsEmpty) return null;

            notesAtRow.forEach((notesAtMeasure, measureNumber) => {
                notesAtMeasure.forEach(note => {
                    if (!note.attributes.lyrics) return;
                    let x = strokeWidth + horizontalPadding + staffLabelSpace + octaveLabelSpace + measureNumber * measureWidth + noteTimeToPos(note.time, 'treble').x;
                    lyrics.push(
                        <text x={`${x}`} y={noteSymbolSize} key={key++} fontSize={noteSymbolSize}>
                            {note.attributes.lyrics}
                        </text>
                    )
                })
            });
            return (
                <svg viewBox={`0 0 ${width} ${noteSymbolSize * 2}`} style={{position: 'relative', height: 'auto'}}>
                    {lyrics}
                </svg>
            );
        }

        let pedal = (i: number) => {
            let pedals: JSX.Element[] = [];
            let instrumentTrack = score!.tracks.find(track => track.trackTypes.includes('Instrument'));
            if (!instrumentTrack) return null;
            let key = 0;

            let directionsAtRow = instrumentTrack.directions.slice(i * measuresPerRow, (i + 1) * measuresPerRow);
            // let directionsAreEmpty = directionsAtRow.every(directions => directions.length === 0);
            // if (directionsAreEmpty) return null;

            directionsAtRow.forEach((directionsAtMeasure, measureNumber) => {
                directionsAtMeasure.forEach(direction => {
                    if (!direction.pedal) return;
                    let pedalText = direction.pedal === 'pedalStart' ? '𝒫𝑒𝒹.' : '✻';
                    let x = horizontalPadding + staffLabelSpace + octaveLabelSpace + measureNumber * measureWidth + noteTimeToPos(direction.time, 'treble').x;
                    pedals.push(
                        <text x={`${x}`} y={noteSymbolSize} key={key++} fontSize={noteSymbolSize} fontWeight='bold'>
                            {pedalText}
                        </text>
                    )
                })
            });

            return (
                <svg viewBox={`0 0 ${width} 20`} style={{position: 'relative', height: 'auto'}}>
                    {pedals}
                </svg>
            );
        }

        let measure = (x: number, y: number, measureNumber: number, staff: StaffType) => {
            // Get time signature of current measure
            let {currentTime, currentKey} = getCurrentSignatures(measureNumber);
            beatWidth = scoreWidth / currentTime.beats / measuresPerRow;
            beatsPerMeasure = currentTime.beats;
            keyFifths = currentKey!.fifths;

            // Draw measure
            let key = 0;
            let measureSVG: JSX.Element[] = [];
            measureSVG.push(<rect key={key++} x={measureWidth - strokeWidth / 2} y={measureLabelSpace - strokeWidth / 2} width={strokeWidth} height={staffHeights[staff] + strokeWidth} fill="#000000" />);
            for (let j = minLine[staff]; j <= maxLine[staff]; j++) {
                let octaveLine = octaveLines[j % 7];
                if (octaveLine !== undefined) {
                    let lineY = measureLabelSpace + staffHeights[staff] - (j - minLine[staff]) * noteSymbolSize / 2;
                    measureSVG.push(<rect key={key++} x={strokeWidth / 2} y={lineY - strokeWidth / 2} width={measureWidth - strokeWidth} height={strokeWidth} fill={octaveLine.color} />);
                    if (measureNumber % measuresPerRow === 0 && octaveLine.number === true) {
                        measureSVG.push(<text x={-strokeWidth} key={key++} y={lineY} fontSize={measureLabelSpace} textAnchor="end" dominantBaseline="middle">{Math.floor(j / 7)}</text>);
                    }
                    if (j < maxLine[staff]) {
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
                if (!track.trackTypes.includes('Instrument')) return; // we do not render notes for lyrics only track.
                let notes = track.measures[measureNumber].filter(note => note.staff === staff);
                notes.forEach((note, _idx) => {
                    noteHeadSVG.push(noteHead(note, key++, staff));
                    let tieStart = note.attributes.ties.includes(Tie.Start);
                    let tieStop = note.attributes.ties.includes(Tie.Stop);
                    let isLastMeasure = ((measureNumber + 1) % measuresPerRow === 0); // whether current measure is the last measure of the row
                    let isLastNote = note.time + note.duration >= currentTime.beats; // whether the note reaches the end of the measure
                    let noteSpansRow = tieStart && isLastMeasure && isLastNote; // whether tied note spans next row
                    noteTailSVG.push(noteTail(note, key++, tieStart, tieStop, noteSpansRow, staff));
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

        let noteTimeToPos = (noteTime: number, staff: StaffType) => ({
            x: beatWidth * noteTime,
            y: staffHeights[staff] + measureLabelSpace
        });

        let noteTail = (note: Note, i: number, tieStart: boolean, tieStop: boolean, noteSpansRow: boolean, staff: StaffType) => {
            let key = 0;
            let boxes: JSX.Element[] = [];

            let line = getNoteLine(note.midi) - minLine[staff];
            let {x: xStart, y: yStart} = noteTimeToPos(note.time, staff);
            let {x: xEnd} = noteTimeToPos(note.time + note.duration, staff);

            let roundingSpace = Math.max(Math.min(noteSymbolSize, xEnd - xStart), 0);
            let radiusStart = roundingSpace / 4;
            let radiusEnd = roundingSpace / 2;
            let pointedEnd = noteSpansRow;

            if (tieStart) {
                radiusEnd = 0;
            }
            if (tieStop) {
                radiusStart = 0;
            }
            boxes.push(
                <path
                    key={key++}
                    d={`
                        M${xStart + radiusStart} ${yStart - (line + 1) * noteSymbolSize / 2}
                        H${xEnd - radiusEnd}
                        ${pointedEnd ? `l` : `a${radiusEnd} ${radiusEnd} 0 0 ${noteSpansRow ? 0 : 1} `}${radiusEnd} ${radiusEnd}
                        ${pointedEnd ? `
                            l${noteSymbolSize / 2 - radiusEnd} ${noteSymbolSize / 2 - radiusEnd}
                            l${-noteSymbolSize / 2 + radiusEnd} ${noteSymbolSize / 2 - radiusEnd}
                        `: `v${noteSymbolSize - 2 * radiusEnd}`}
                        ${pointedEnd ? `l` : `a${radiusEnd} ${radiusEnd} 0 0 ${noteSpansRow ? 0 : 1} `}${-radiusEnd} ${radiusEnd}
                        H${xStart + radiusStart}
                        a${radiusStart} ${radiusStart} 0 0 1 ${-radiusStart} ${-radiusStart}
                        v${-noteSymbolSize + 2 * radiusStart}
                        a${radiusStart} ${radiusStart} 0 0 1 ${radiusStart} ${-radiusStart}
                        z
                    `}
                    fill={colorPreferenceStyles[noteDurationColor]}
                    fillOpacity={0.5}
                />
            );

            return (
                <React.Fragment key={i}>
                    {boxes}
                </React.Fragment>
            );
        }

        let noteHead = (note: Note, i: number, staff: StaffType) => {
            if (note.attributes.ties.includes(Tie.Stop))
                return null!;
            let accidental: Accidental = getNoteAccidental(note.midi);
            let line = getNoteLine(note.midi) - minLine[staff];

            let {x, y} = noteTimeToPos(note.time, staff);

            x += noteSymbolSize / 2;
            y -= line * noteSymbolSize / 2;
            let triHeight = noteSymbolSize * Math.sqrt(3) / 2;

            let strokeWidth = noteSymbolSize / 8;
            let crossCircleWidth = noteSymbolSize / 2 / Math.sqrt(2);

            let autoNoteShape = accidentalType === 'sharp' ? sharpNoteShape : flatNoteShape;
            let shape = {
                [Accidental.Natural]: naturalNoteShape,
                [Accidental.Flat]: accidentalType === 'auto' ? flatNoteShape : autoNoteShape,
                [Accidental.Sharp]: accidentalType === 'auto' ? sharpNoteShape : autoNoteShape,
            }[accidental];

            switch (shape) {
                case '●':
                    return <circle key={i} cx={x} cy={y} r={noteSymbolSize / 2} fill={colorPreferenceStyles[noteSymbolColor]} />;
                case '◼':
                    return <rect key={i} x={x - noteSymbolSize / 2 + strokeWidth / 2} y={y - noteSymbolSize / 2 + strokeWidth / 2} width={noteSymbolSize - strokeWidth} height={noteSymbolSize - strokeWidth} fill={colorPreferenceStyles[noteSymbolColor]} />;
                case '▲':
                    return <polygon key={i} points={`${x},${y - triHeight / 2} ${x + noteSymbolSize / 2},${y + triHeight / 2} ${x - noteSymbolSize / 2},${y + triHeight / 2}`} fill={colorPreferenceStyles[noteSymbolColor]} />;
                case '▼':
                    return <polygon key={i} points={`${x},${y + triHeight / 2} ${x + noteSymbolSize / 2},${y - triHeight / 2} ${x - noteSymbolSize / 2},${y - triHeight / 2}`} fill={colorPreferenceStyles[noteSymbolColor]} />;
                case '○':
                    return <circle key={i} cx={x} cy={y} r={(noteSymbolSize - strokeWidth) / 2} strokeWidth={strokeWidth} stroke={colorPreferenceStyles[noteSymbolColor]} fill='none' />;
                case '☐':
                    return <rect key={i} x={x - noteSymbolSize / 2 + strokeWidth / 2} y={y - noteSymbolSize / 2 + strokeWidth / 2} width={noteSymbolSize - strokeWidth} height={noteSymbolSize - strokeWidth} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} fill='none' />;
                case '△':
                    return <polygon key={i} points={`${x},${y - triHeight / 2 + strokeWidth} ${x + noteSymbolSize / 2 - Math.sqrt(3) * strokeWidth / 2},${y + triHeight / 2 - strokeWidth / 2} ${x - noteSymbolSize / 2 + Math.sqrt(3) * strokeWidth / 2},${y + triHeight / 2 - strokeWidth / 2}`} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} fill='none' />;
                case '▽':
                    return <polygon key={i} points={`${x},${y + triHeight / 2 - strokeWidth} ${x + noteSymbolSize / 2 - Math.sqrt(3) * strokeWidth / 2},${y - triHeight / 2 + strokeWidth / 2} ${x - noteSymbolSize / 2 + Math.sqrt(3) * strokeWidth / 2},${y - triHeight / 2 + strokeWidth / 2}`} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} fill='none' />;
                case '⊗':
                    return (<g key={i}>
                        <circle cx={x} cy={y} r={(noteSymbolSize - 2) / 2} strokeWidth={strokeWidth} stroke={colorPreferenceStyles[noteSymbolColor]} fill='none' />;
                        <line x1={x - crossCircleWidth} y1={y - crossCircleWidth} x2={x + crossCircleWidth} y2={y + crossCircleWidth} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} />
                        <line x1={x - crossCircleWidth} y1={y + crossCircleWidth} x2={x + crossCircleWidth} y2={y - crossCircleWidth} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} />
                    </g>);
                case '⊠':
                    return (<g key={i}>
                        <rect x={x - noteSymbolSize / 2 + strokeWidth / 2} y={y - noteSymbolSize / 2 + strokeWidth / 2} width={noteSymbolSize - strokeWidth} height={noteSymbolSize - strokeWidth} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} fill='none' />
                        <line x1={x - noteSymbolSize / 2 + strokeWidth / 2} y1={y - noteSymbolSize / 2 + strokeWidth / 2} x2={x + noteSymbolSize / 2 - strokeWidth / 2} y2={y + noteSymbolSize / 2 - strokeWidth / 2} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} />
                        <line x1={x - noteSymbolSize / 2 + strokeWidth / 2} y1={y + noteSymbolSize / 2 - strokeWidth / 2} x2={x + noteSymbolSize / 2 - strokeWidth / 2} y2={y - noteSymbolSize / 2 + strokeWidth / 2} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} />
                    </g>);
            }
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

        let svgRows: JSX.Element[] = range(0, rowNumber).map(i => grandStaff(i));
        return (
            <div id="snview" ref={ref} style={{width: '100%', height: 'auto', overflow: 'hidden', minWidth: '350px', userSelect: 'text', paddingTop: verticalPadding, paddingBottom: verticalPadding}}>
                {/*devSvg*/}
                <div className={`snview-row snview-row-0`} style={{position: 'relative', height: 'auto', paddingBottom: `${rowPadding}px`}}>
                    <svg viewBox={`0 0 ${width} ${180}`}>
                        <text x={width / 2} y={50} fontSize={40} textAnchor="middle" alignmentBaseline="hanging">{title}</text>
                        <text x={70} y={170} fontSize={25} textAnchor="start">{score.tempo} bpm</text>
                        <text x={width - 70} y={170} fontSize={25} textAnchor="end">{author}</text>
                    </svg>
                </div>
                {svgRows}
            </div>
        );
    } catch (e) {
        console.error(e);
        if (!dialogState.shown) {
            showError('An issue was encountered while generating WYSIWYP output for the selected file.');
        }
        //console.error(e);
        return <div ref={ref}></div>;
    }
};

export default SNView;
