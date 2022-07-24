import React, {useEffect, useState, useRef} from 'react';
import {range} from '../util/Util';
// import {Note} from '@tonejs/midi/dist/Note';
import MusicXML from 'musicxml-interfaces';
import {parse} from '../parser/MusicXML';
import {Note, Score, TimeSignature, KeySignature, StaffType} from '../parser/Types';
import { colorPreferenceStyles, usePreferencesState, spacingPreferenceOption, scalePreferenceOption, lyricsFontSizeOption} from '../contexts/Preferences';
import {useDialogState} from '../contexts/Dialog';
import * as Dialog from '../util/Dialog';
import {navigate} from '@reach/router';

type Props = {
    xml: MusicXML.ScoreTimewise,
    forcedWidth?: number,
    editMode?: '' | 'fingerings',
    editCallback?: () => void, //called when the xml is edited
};

type Wedge = {
    startMeasure: number,
    startTime: number,
    continuesFromLastRow: boolean,
    type: 'crescendo' | 'diminuendo'
} | undefined;

enum Accidental {
    Flat = -1,
    Natural = 0,
    Sharp = 1
}

const keySignatureNamesArrayMajor = [
    'Cb Major',  // -7
    'Gb Major',  // -6
    'Db Major',  // -5
    'Ab Major',  // -4
    'Eb Major',  // -3
    'Bb Major',  // -2
    'F Major',   // -1
    'C Major',   //  0
    'G Major',   //  1
    'D Major',   //  2
    'A Major',   //  3 
    'E Major',   //  4
    'B Major',   //  5
    'F# Major',  //  6
    'C# Major'   //  7
];
const keySignatureNamesArrayMinor = [
    'g# minor', // -7
    'eb minor', // -6
    'bb minor', // -5
    'f minor',  // -4
    'c minor',  // -3
    'g minor',  // -2
    'd minor',  // -1
    'a minor',  //  0
    'e minor',  //  1
    'b minor',  //  2
    'f# minor', //  3 
    'c# minor', //  4
    'g# minor', //  5
    'd# minor', //  6
    'bb minor'  //  7
]; 

let creditsDisplay = ['', '', '', '', ''];
const SNView: React.FC<Props> = ({ xml, forcedWidth, editMode = '', editCallback = () => { } }) => {
    console.log(xml);
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
    };
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
            };
        } else {
            setWidth(forcedWidth);
        }
    }, [setWidth, forcedWidth]);

    useEffect(() => {
        // parse only when page loads, xml changes, or an edit occurs
        try {
            setScore(parse(xml));
        } catch (e) {
            showErrorRef.current('An issue was encountered while processing this file.');
            console.error(e);
        }
        // notify parent that xml has been modified so that it can be saved
        editCallback();

    }, [xml, (xml as any).revision]);

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

        // Map preference strings to numeric values     21 June 2021 made all smaller
        let noteScaleMap: Record<scalePreferenceOption, number> = {
            small: 9,
            medium: 15,
            large: 22
        };
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
        // 2020 08 31: changed values from 20, 40, 60
        let horizontalSpacingMap: Record<spacingPreferenceOption, number> = {
            narrow: 20,
            moderate: 60,
            wide: 100
        };

        //general spacing
        let noteSymbolSize = noteScaleMap[noteScale]; //width/height of note symbols
        let strokeWidth = 2;
        let tickSize = 7;

        // Map lyrics font size preference to numeric values
        let lyricsFontSizeMap: Record<lyricsFontSizeOption, number> = {
            small: noteSymbolSize * 4 / 7,
            medium: noteSymbolSize * 5 / 7,
            large: noteSymbolSize * 6 / 7
        }

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

        // let octaveGroups = [1, 1, 0, 0, 0, 1, 1]; //octaveGroups (C D E / F G A B)
        let staffLabels = preferences.clefSymbols === 'WYSIWYP' ? ['𝒯', 'ℬ'] : ['𝄞', '𝄢']; //𝄢
        let octaveLines = [
            { color: 'red', number: true }, undefined, undefined, /* C, D, E */
            { color: 'blue' }, undefined, undefined, undefined, /* F, G, A, B */
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
            else if (accidentalType === 'flats' && getNoteAccidental(note) !== 0) line++; // handle user override

            return line;
        };

        // find the title and author
        let title = 'no title specified';
        try {
            title = xml.movementTitle;
            console.log(title);
            title = xml.work.workTitle;
        } catch (e) { }
        if (title === undefined) title = 'no title specified';
        console.log(title);

        let findCredits = (): number => {
            // retrieve all credits but skip any that match the previously found title
            console.log(creditsDisplay);
            let creditNum = 0;
            creditsDisplay = ['', '', '', '', ''];
            if (xml.credits !== undefined) {
                let credits = xml.credits.filter(x => x.creditWords !== undefined && x.creditWords.length > 0).map(x => x.creditWords);
                credits.forEach(credit => {
                    credit.forEach(words => {
                        creditsDisplay[creditNum] = words.words;
                        //}
                        console.log(creditNum, creditsDisplay, words, title);
                        if (creditsDisplay[creditNum] === title) {
                            creditsDisplay[creditNum] = '';
                        }
                        else {
                            creditNum = creditNum + 1;
                        };
                        console.log(title, creditNum, creditsDisplay);
                    });
                });

            }
            return creditNum;
        };

        let numberOfCredits = findCredits();
        console.log(creditsDisplay, numberOfCredits);

        // get key signature     21 June 2021  modified logic (don't examine title for "minor" anymore; display both Major/minor if mode parm not specified)
        let keyFifths = score.tracks[0].keySignatures[0].fifths;
        // The values for fifths range from -7 for Cb Major to +7 for C# Major.  So adjust index to names array by 7 to start at array offset 0
        let keySignatureDisplayed = keySignatureNamesArrayMajor[keyFifths + 7] + " / " + keySignatureNamesArrayMinor[keyFifths + 7];  // if no mode, default to major and indicate that with an asterisk
        let scoreMode: any = score.tracks[0].keySignatures[0].mode;
        // According to MusicXML website, the modes are all lowercase
        if (scoreMode === 'major') keySignatureDisplayed = keySignatureNamesArrayMajor[keyFifths + 7];
        else if (scoreMode === 'minor') keySignatureDisplayed = keySignatureNamesArrayMinor[keyFifths + 7];
        

        let minNote: Record<StaffType, number> = {
            treble: 128,
            bass: 128
        };
        let maxNote: Record<StaffType, number> = {
            treble: -1,
            bass: -1
        };

        //calculate lowest and highest note
        let instrumentTrack = score.tracks.filter(track => track.trackTypes.includes('instrument'))[0];
        instrumentTrack.measures.forEach(measure => {
            measure.forEach(note => {
                minNote[note.staff] = Math.min(minNote[note.staff], note.midi);
                maxNote[note.staff] = Math.max(maxNote[note.staff], note.midi);
            });
        });

        let staffTypes: StaffType[] = ['treble', 'bass'];

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
        };
        let maxLine: Record<StaffType, number> = {
            treble: getNoteLine(maxNote.treble),
            bass: getNoteLine(maxNote.bass)
        };

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
        };

        //calculate the number of beats per measure
        let beatsPerMeasure = score.tracks[0].timeSignatures[0].beats;
        let measureWidth = beatWidth * beatsPerMeasure;

        //calculate tne number of measures per row
        let availableMeasureSpace = width - horizontalPadding * 2 - staffLabelSpace - octaveLabelSpace;
        horizontalPadding += (availableMeasureSpace - measuresPerRow * measureWidth) / 2; //update horizontal padding to center rows

        //calculate the number of rows
        let measureNumber = score.tracks.reduce((accum, track) => Math.max(accum, track.measures.length), 0);
        if (measureNumber <= 0) {
            throw new Error('Failed to identify number of measures');
        }
        let rowNumber = Math.ceil(measureNumber / measuresPerRow);

        // set up wedge (crescendo / diminuendo) tracking
        let currentWedge: Wedge;
        let key = 0; // keys for JSX elements

        let getCurrentSignatures = (measureNumber: number): {currentTime: TimeSignature, currentKey: KeySignature} => {
            let timeSignatures = [...score!.tracks[0].timeSignatures].reverse(); // we reverse the array because we want to find the latest key signature.
            let keySignatures = [...score!.tracks[0].keySignatures].reverse();

            let currentTime = timeSignatures.find(timeSignature => timeSignature.measure <= measureNumber);
            let currentKey = keySignatures.find(keySignature => keySignature.measure <= measureNumber);

            // sometimes, signatures are defined on the second measure. Below lines handle such cases.
            if (!currentTime) currentTime = score!.tracks[0].timeSignatures[0];
            if (!currentKey) currentKey = score!.tracks[0].keySignatures[0];
            return {currentTime, currentKey};
        };

        let grandStaff = (i: number): JSX.Element => {
            return (
                <div className={`snview-row snview-row-${i + 1}`} key={i} style={{position: 'relative', height: 'auto', paddingTop: `${rowPadding}px`}}>
                    {staff(i, 'treble')}
                    {staffBreak(i)} {/* information that goes between two staffs */}
                    {staff(i, 'bass')}
                    {pedal(i)}
                </div>
            );
        };

        let staff = (i: number, staff: StaffType): JSX.Element | null => {
            if (bassClefIsEmpty && staff === 'bass') return null;

            let staffHeight = staffHeights[staff];
            let svgHeight = staffHeight + measureLabelSpace + noteSymbolSize / 2;
            let staffName = (staff === 'treble' && !instrumentTrack.bassStaffOnly) ? staffLabels[0] : staffLabels[1];

            return <div style={{position: 'relative', height: 'auto'}}>
                <svg viewBox={`0 0 ${width} ${svgHeight}`}>
                    <g transform={`translate(${horizontalPadding}, 0)`}>
                        <text x={staffLabelSpace} y={measureLabelSpace + staffHeight / 2} fontSize={staffLabelSpace * 1.5} textAnchor="end" dominantBaseline="middle">{staffName}</text>
                        <rect x={staffLabelSpace + octaveLabelSpace - strokeWidth / 2} y={measureLabelSpace - strokeWidth / 2} width={strokeWidth} height={staffHeight + strokeWidth} fill="#000000" />

                        {range(0, i < rowNumber - 1 ? measuresPerRow : measureNumber - (rowNumber - 1) * measuresPerRow).map(j =>
                            measure(staffLabelSpace + octaveLabelSpace + j * measureWidth, 0, i * measuresPerRow + j, staff)
                        )}
                    </g>
                </svg>
            </div>;
        };

        let measureNumberToPos = (measureNumber: number): number => {
            return strokeWidth + horizontalPadding + staffLabelSpace + octaveLabelSpace + measureNumber * measureWidth;
        };

        let drawWedge = (height: number, endTime: number, measureNumber: number, continuesToNextRow: boolean): JSX.Element[] => {
            let {startMeasure, startTime, continuesFromLastRow, type} = currentWedge!;
            let startX = measureNumberToPos(startMeasure) + noteTimeToPos(startTime, 'treble').x;
            let endX = measureNumberToPos(measureNumber) + noteTimeToPos(endTime, 'treble').x;
            if (startX === endX) endX += noteSymbolSize;

            // TODO: consider combining the below logic
            if (type === 'crescendo' && continuesFromLastRow) {
                return [
                    <line key={key++}
                        x1={startX + strokeWidth} x2={endX - strokeWidth}
                        y1={height / 3} y2={strokeWidth}
                        strokeWidth={strokeWidth} stroke='black'
                    />,
                    <line key={key++}
                        x1={startX + strokeWidth} x2={endX - strokeWidth}
                        y1={height * 2 / 3} y2={height - strokeWidth}
                        strokeWidth={strokeWidth} stroke='black'
                    />
                ];
            } else if (type === 'diminuendo' && continuesToNextRow) {
                return [
                    <line key={key++}
                        x1={startX + strokeWidth} x2={endX - strokeWidth}
                        y1={strokeWidth} y2={height / 3}
                        strokeWidth={strokeWidth} stroke='black'
                    />,
                    <line key={key++}
                        x1={startX + strokeWidth} x2={endX - strokeWidth}
                        y1={height - strokeWidth} y2={height * 2 / 3}
                        strokeWidth={strokeWidth} stroke='black'
                    />
                ];
            } else {
                return [
                    <line key={key++}
                        x1={startX + strokeWidth} x2={endX - strokeWidth}
                        y1={type === 'crescendo' ? height / 2 : strokeWidth} y2={type === 'crescendo' ? strokeWidth : height / 2}
                        strokeWidth={strokeWidth} stroke='black'
                    />,
                    <line key={key++}
                        x1={startX + strokeWidth} x2={endX - strokeWidth}
                        y1={type === 'crescendo' ? height / 2 : height - strokeWidth} y2={type === 'crescendo' ? height - strokeWidth : height / 2}
                        strokeWidth={strokeWidth} stroke='black'
                    />
                ];
            }
        };

        let staffBreak = (i: number): JSX.Element | null => {
            // general spacing
            let textSize = noteSymbolSize * 6 / 7;
            let lyricsFontSize = lyricsFontSizeMap[preferences.lyricsFontSize];

            // vertical spacing
            let lyricsSpace = lyricsFontSize;
            let dynamicsSpace = noteSymbolSize * 1;
            let margin = 10;

            // get respective directions and notes
            let directionsAtRow = instrumentTrack.directions.slice(i * measuresPerRow, (i + 1) * measuresPerRow);
            let dynamicsAreEmpty = currentWedge === undefined && directionsAtRow.every(directions =>
                directions.length === 0 || directions.every(direction => direction.dynamics === undefined && direction.wedge === undefined)
            );

            let lyrics: JSX.Element[] = [];
            let lyricsTrack = score!.tracks.find(track => track.trackTypes.includes('lyrics'));
            if (lyricsTrack === undefined) return null;

            let notesAtRow = lyricsTrack.measures.slice(i * measuresPerRow, (i + 1) * measuresPerRow);
            let lyricsAreEmpty = notesAtRow.every(measure => measure.length === 0);

            // 1. render dynamics
            let dynamics: JSX.Element[] = [];

            directionsAtRow.forEach((directionsAtMeasure, measureNumber) => {
                directionsAtMeasure.forEach(direction => {
                    if (direction.dynamics === undefined) return;
                    let x = measureNumberToPos(measureNumber) + noteTimeToPos(direction.time, 'treble').x;
                    let y = dynamicsSpace * 6 / 7;
                    dynamics.push(
                        <text x={x} y={y} fontWeight='bold' fontFamily='monospace' fontStyle='italic' key={key++} fontSize={textSize}>
                            {direction.dynamics}
                        </text>
                    );
                });
            });

            // 2. render wedges
            directionsAtRow.forEach((directionsAtMeasure, measureNumber) => {
                directionsAtMeasure.forEach(direction => {
                    if (direction.wedge === undefined) return;
                    if (direction.wedge === 'crescendo' || direction.wedge === 'diminuendo') {
                        currentWedge = {
                            startMeasure: /* i * measuresPerRow */ + measureNumber,
                            startTime: direction.time,
                            continuesFromLastRow: false,
                            type: direction.wedge,
                        };
                    } else if (direction.wedge === 'stop') {
                        // draw wedge
                        dynamics.push(...drawWedge(dynamicsSpace, direction.time, measureNumber, false));
                        currentWedge = undefined; // finish this wedge
                    }
                });
            });

            // check if current wedge spans then next row
            if (currentWedge !== undefined) {
                // draw wedge for this row (ending at the last measure)
                dynamics.push(...drawWedge(dynamicsSpace, beatsPerMeasure, measuresPerRow - 1, true));
                // split off the remaining wedge
                currentWedge.startMeasure = currentWedge.startTime = 0;
                currentWedge.continuesFromLastRow = true;
            }

            // 3. render lyrics
            notesAtRow.forEach((notesAtMeasure, measureNumber) => {
                notesAtMeasure.forEach(note => {
                    if (!note.attributes.lyrics) return;
                    let x = measureNumberToPos(measureNumber) + noteTimeToPos(note.time, 'treble').x;

                    let y = lyricsSpace * 6 / 7; // multiply by 6 / 7 so that text render in the middle and not the bottom
                    if (!dynamicsAreEmpty) y += margin + dynamicsSpace; // if there are dynamics, then we render lyrics below dynamics

                    lyrics.push(
                        <text x={x} y={y} key={key++} fontSize={lyricsFontSize}>
                            {note.attributes.lyrics}
                        </text>
                    );
                });
            });

            let svgHeight = 0;
            // fit svg height to contents
            if (!dynamicsAreEmpty) svgHeight += dynamicsSpace;
            if (!lyricsAreEmpty) svgHeight += lyricsSpace;
            if (!lyricsAreEmpty && !dynamicsAreEmpty) svgHeight += margin;

            let contentSVG = dynamicsAreEmpty && lyricsAreEmpty ? null : (
                <svg viewBox={`0 0 ${width} ${svgHeight}`}>
                    {dynamics}
                    {lyrics}
                </svg>
            ); // don't render svg if empty

            return (
                <div style={{position: 'relative', height: 'auto', marginBottom: '10px'}}>
                    {contentSVG}
                </div>
            );
        };

        let pedal = (i: number) => {
            let pedals: JSX.Element[] = [];
            let instrumentTrack = score!.tracks.find(track => track.trackTypes.includes('instrument'));
            if (!instrumentTrack) return null;

            let directionsAtRow = instrumentTrack.directions.slice(i * measuresPerRow, (i + 1) * measuresPerRow);
            let directionsAreEmpty = directionsAtRow.every(directions => directions.length === 0);
            if (bassClefIsEmpty && directionsAreEmpty) return null;

            directionsAtRow.forEach((directionsAtMeasure, measureNumber) => {
                directionsAtMeasure.forEach(direction => {
                    if (!direction.pedal) return;
                    let pedalText = direction.pedal === 'start' ? '𝒫𝑒𝒹.' : '✻';
                    let x = measureNumberToPos(measureNumber) + noteTimeToPos(direction.time, 'treble').x;
                    // When the start and stop symbols occur at the same point, the symbols will display as overlapping.
                    // To correct this, the end symbol is backed up 2/3 the width of a note symbol.  stuart-change 4/8/20
                    if (direction.pedal === 'end') { x = x - (2 * noteSymbolSize) / 3 };
                    pedals.push(
                        <text x={`${x}`} y={noteSymbolSize} key={key++} fontSize={noteSymbolSize} fontWeight='bold'>
                            {pedalText}
                        </text>
                    );
                });
            });

            return (
                <div style={{position: 'relative', height: 'auto'}}>
                    <svg viewBox={`0 0 ${width} ${2 * noteSymbolSize}`}>
                        {pedals}
                    </svg>
                </div>
            );
        };

        let measure = (x: number, y: number, measureNumber: number, staff: StaffType) => {
            // Get time signature of current measure
            let {currentTime, currentKey} = getCurrentSignatures(measureNumber);
            beatWidth = scoreWidth / currentTime.beats / measuresPerRow;
            beatsPerMeasure = currentTime.beats;
            keyFifths = currentKey!.fifths;

            // Draw measure
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
                if (!track.trackTypes.includes('instrument')) return; // we do not render notes for lyrics only track.
                let notes = track.measures[measureNumber].filter(note => note.staff === staff);
                notes.forEach((note, _idx) => {
                    noteHeadSVG.push(noteHead(note, key++, staff));
                    let tieStart = note.attributes.tie !== undefined && note.attributes.tie === 'start';
                    let tieStop = note.attributes.tie !== undefined && note.attributes.tie === 'end';

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
        };

        let noteTimeToPos = (noteTime: number, staff: StaffType) => ({
            x: beatWidth * noteTime,
            y: staffHeights[staff] + measureLabelSpace
        });

        let noteTail = (note: Note, i: number, tieStart: boolean, tieStop: boolean, noteSpansRow: boolean, staff: StaffType) => {
            let boxes: JSX.Element[] = [];

            let line = getNoteLine(note.midi) - minLine[staff];
            let {x: xStart, y: yStart} = noteTimeToPos(note.time, staff);
            let {x: xEnd} = noteTimeToPos(note.time + note.duration, staff);

            let roundingSpace = Math.max(Math.min(noteSymbolSize, xEnd - xStart), 0);
            let radiusStart = tieStop ? 0 : roundingSpace / 4;
            let radiusEnd = tieStart ? 0 : roundingSpace / 2;
            let pointedEnd = noteSpansRow;

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
        };

        let noteHead = (note: Note, i: number, staff: StaffType) => {
            if (note.attributes.tie !== undefined && note.attributes.tie === 'end')
                return null!;
            let accidental: Accidental = getNoteAccidental(note.midi);
            let line = getNoteLine(note.midi) - minLine[staff];

            let {x, y} = noteTimeToPos(note.time, staff);

            x += noteSymbolSize / 2;
            y -= line * noteSymbolSize / 2;
            let triHeight = noteSymbolSize * Math.sqrt(3) / 2;

            let strokeWidth = noteSymbolSize / 8;
            
            let autoNoteShape = 'tbd';
            if (accidentalType === 'auto') {
                if (keyFifths >= 0) { autoNoteShape = sharpNoteShape }
                else { autoNoteShape = flatNoteShape }
            }
            else {
                if (accidentalType === 'sharps') { autoNoteShape = sharpNoteShape }
                else { autoNoteShape = flatNoteShape }
            }

            let shape = {
                [Accidental.Natural]: naturalNoteShape,
                [Accidental.Flat]: accidentalType === 'auto' ? flatNoteShape : autoNoteShape,
                [Accidental.Sharp]: accidentalType === 'auto' ? sharpNoteShape : autoNoteShape,
            }[accidental];

            let callback = () => {
                if (editMode === 'fingerings') {
                    setDialogState(Dialog.showMessage('Edit Fingering', <>
                        Value:&emsp;<select style={{backgroundColor: 'rgb(221,221,221)'}} defaultValue={`${note.fingering}`} onChange={
                            (e) => {
                                note.setFingering(parseFloat(e.target.value));
                            }
                        }>{['', '1', '2', '3', '4', '5'].map(x => <option key={x}>{x}</option>)}</select>
                    </>, 'Done', () => {
                        setDialogState(Dialog.close());
                    }));
                }
            };

            let notehead: any;
            switch (shape) {
                case '●':
                    notehead = <circle cx={x} cy={y} r={noteSymbolSize / 2} fill={colorPreferenceStyles[noteSymbolColor]} />;
                    break;
                case '▲':
                    notehead = <polygon points={`${x},${y - triHeight / 2} ${x + noteSymbolSize / 2},${y + triHeight / 2} ${x - noteSymbolSize / 2},${y + triHeight / 2}`} fill={colorPreferenceStyles[noteSymbolColor]} />;
                    break;
                case '▼':
                    notehead = <polygon points={`${x},${y + triHeight / 2} ${x + noteSymbolSize / 2},${y - triHeight / 2} ${x - noteSymbolSize / 2},${y - triHeight / 2}`} fill={colorPreferenceStyles[noteSymbolColor]} />;
                    break;
                case '○':
                    notehead = <circle cx={x} cy={y} r={(noteSymbolSize - strokeWidth) / 2} strokeWidth={strokeWidth} stroke={colorPreferenceStyles[noteSymbolColor]} fill='none' />;
                    break;
                case '△':
                    notehead = <polygon points={`${x},${y - triHeight / 2 + strokeWidth} ${x + noteSymbolSize / 2 - Math.sqrt(3) * strokeWidth / 2},${y + triHeight / 2 - strokeWidth / 2} ${x - noteSymbolSize / 2 + Math.sqrt(3) * strokeWidth / 2},${y + triHeight / 2 - strokeWidth / 2}`} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} fill='none' />;
                    break;
                case '▽':
                    notehead = <polygon points={`${x},${y + triHeight / 2 - strokeWidth} ${x + noteSymbolSize / 2 - Math.sqrt(3) * strokeWidth / 2},${y - triHeight / 2 + strokeWidth / 2} ${x - noteSymbolSize / 2 + Math.sqrt(3) * strokeWidth / 2},${y - triHeight / 2 + strokeWidth / 2}`} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} fill='none' />;
                    break;
                case '#':
                    notehead = (<g>
                        <line x1={x - (noteSymbolSize / 2) + (noteSymbolSize / 3)} y1={y - (noteSymbolSize / 2)} x2={x - (noteSymbolSize / 2) + (noteSymbolSize / 3)} y2={y + (noteSymbolSize / 2)} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} />
                        <line x1={x - (noteSymbolSize / 2) + 2 * (noteSymbolSize / 3)} y1={y - (noteSymbolSize / 2)} x2={x - (noteSymbolSize / 2) + 2 * (noteSymbolSize / 3)} y2={y + (noteSymbolSize / 2)} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} />
                        <line x1={x - (noteSymbolSize / 2)} y1={y - (noteSymbolSize / 2) + (noteSymbolSize / 3)} x2={x + (noteSymbolSize / 2)} y2={y - (noteSymbolSize / 2) + (noteSymbolSize / 3)} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} />
                        <line x1={x - (noteSymbolSize / 2)} y1={y - (noteSymbolSize / 2) + 2 * (noteSymbolSize / 3)} x2={x + (noteSymbolSize / 2)} y2={y - (noteSymbolSize / 2) + 2 * (noteSymbolSize / 3)} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} />;
                    </g>);
                    break;
                case 'b':
                    notehead = (<g>
                        <line x1={x - 0.6 * (noteSymbolSize / 2)} y1={y - (noteSymbolSize / 2)} x2={x - 0.6 * (noteSymbolSize / 2)} y2={y + 0.7 * (noteSymbolSize / 2)} stroke={colorPreferenceStyles[noteSymbolColor]} strokeWidth={strokeWidth} />
                        <ellipse cx={x - (noteSymbolSize / 2) + 1.2 * (noteSymbolSize / 3)} cy={y - (noteSymbolSize / 2) + 2 * (noteSymbolSize / 3)} rx={(noteSymbolSize - strokeWidth) / 4} ry={(noteSymbolSize - strokeWidth) / 3} strokeWidth={strokeWidth} stroke={colorPreferenceStyles[noteSymbolColor]} fill='none' />
                    </g>);
                    break;
            }

            return <g onClick={callback} key={i}>
                // stuart-change 3/13/2020  5pm
                <text x={x} y={y} fontSize={14} textAnchor="middle" dominantBaseline="middle">{note.fingering}</text>
                {notehead}
            </g>;
        };

        let svgRows: JSX.Element[] = range(0, rowNumber).map(i => grandStaff(i));
        let titleRowHeight = 80;
        if (title === 'no title specified') title = '';
        return (
            <div id="snview" ref={ref} style={{ width: '100%', height: 'auto', overflow: 'hidden', minWidth: '350px', userSelect: 'text', paddingTop: verticalPadding, paddingBottom: verticalPadding }}>
                <div className={`snview-row snview-row-0`} style={{ position: 'relative', height: 'auto' }}>
                    <div style={{ position: 'relative', height: 'auto' }}>

                        <svg viewBox={`0 0 ${width} ${titleRowHeight}`}>
                            <text x={width / 2} y={0} fontSize={40} textAnchor="middle" dominantBaseline="hanging">{title}</text>
                            <text x={70} y={20} fontSize={25} textAnchor="start">{score.tempo ? `${score.tempo} bpm` : null}</text>
                            <text x={width - 70} y={20} fontSize={25} textAnchor="end">{keySignatureDisplayed}</text>

                            <text x={70} y={titleRowHeight - 10} fontSize={25} textAnchor="start">{creditsDisplay[0]}</text>
                            <text x={width / 2} y={titleRowHeight - 10} fontSize={25} textAnchor="middle">{creditsDisplay[1]}</text>
                            <text x={width - 70} y={titleRowHeight - 10} fontSize={25} textAnchor="end">{creditsDisplay[2]}</text>
                        </svg>


                    </div>
                </div>
                {svgRows}
            </div>
        );
    } catch (e) {
        console.error(e);
        if (!dialogState.shown) {
            showError('An issue was encountered while generating WYSIWYP output for the selected file.');
        }
        return <div ref={ref}></div>;
    }
};

export default SNView;
