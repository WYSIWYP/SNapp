import MusicXML from 'musicxml-interfaces';
import {basicNote, TimeSignature, KeySignature, Tracks, Score, Tie, measure} from './Types'

const pitchToMidi = (pitch: {octave: number, step: string, alter?: number}) => {
    // we assume C4 = 60 as middle C. Note that typical 88-key piano contains notes from A0 (21) - C8 (108).
    let step = ({c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11} as {[index: string]: number})[pitch.step.toLowerCase()];
    return (pitch.octave + 1) * 12 + step + (pitch.alter === undefined ? 0 : Math.round(pitch.alter));
};

export const parse = (xml: MusicXML.ScoreTimewise): Score => {
    let currentBeatType = 4;
    let parts: {
        [index: string]: {
            divisions: number,
            progress: number,
            timeSignatures: TimeSignature[];
            keySignatures: KeySignature[];
            measures: measure[],
        }
    } = {};
    xml.measures.forEach((measure, measureNumber) => {
        Object.keys(measure.parts).forEach(partName => {
            if (parts[partName] === undefined) {
                parts[partName] = {
                    divisions: undefined!,
                    progress: 0,
                    timeSignatures: [],
                    keySignatures: [],
                    measures: Array(xml.measures.length)
                };
            }
            let part = parts[partName];
            let notes: basicNote[] = [];
            // computes note lengh with respect to the beat type
            let divisionsToNoteLength = (divisions: number) => {
                if (part.divisions === undefined) {
                    console.error('A note was defined before timing information was established');
                    return divisions / 24;
                }
                return divisions / part.divisions * (currentBeatType / 4);
            }
            part.progress = 0;
            measure.parts[partName].forEach(entry => {
                switch (entry._class) {
                    case 'Note':
                        if (entry.duration !== undefined) { //grace notes do not have a duration - are not displayed
                            let time = part.progress;
                            if (entry.chord !== undefined) {
                                if (notes.length === 0) {
                                    console.error('The first note within a measure was marked as being part of a chord');
                                } else {
                                    if (notes[notes.length - 1].duration !== divisionsToNoteLength(entry.duration)) {
                                        console.error('Two notes in a chord were of different durations');
                                    }
                                    time = notes[notes.length - 1].time;
                                }
                            } else {
                                part.progress += divisionsToNoteLength(entry.duration);
                            }
                            if (entry.rest === undefined && entry.pitch === undefined) {
                                console.error('A note was neither marked as a rest or given a pitch');
                            }
                            if (entry.rest !== undefined && entry.pitch !== undefined) {
                                console.error('A note was marked as a rest but was also given a pitch');
                            }
                            if (entry.pitch !== undefined) {
                                const entryTies = entry.ties as {type: number}[];
                                notes.push({
                                    time, duration: divisionsToNoteLength(entry.duration),
                                    midi: pitchToMidi(entry.pitch),
                                    attributes: {
                                        ties: entryTies ? entryTies.map(tie => tie.type === 0 ? Tie.Start : Tie.Stop) : []
                                    }
                                });
                            }
                            part.measures[measureNumber] = notes;
                        }
                        break;
                    case 'Backup':
                        part.progress -= divisionsToNoteLength(entry.duration);
                        break;
                    case 'Forward':
                        part.progress += divisionsToNoteLength(entry.duration);
                        break;
                    case 'Attributes':
                        if (entry.divisions !== undefined) {
                            part.divisions = entry.divisions;
                        }
                        if (entry.times !== undefined) {
                            if (entry.times.length !== 0) {
                                try {
                                    part.timeSignatures.push({
                                        measure: measureNumber,
                                        beats: parseInt(entry.times[0].beats[0]),
                                        beatTypes: entry.times[0].beatTypes[0],
                                    });
                                    currentBeatType = entry.times[0].beatTypes[0];
                                } catch (e) {
                                    console.error('Failed to parse time signature', entry.times[0]);
                                }
                            }
                        }
                        if (entry.keySignatures && entry.keySignatures.length !== 0) {
                            try {
                                part.keySignatures.push({
                                    measure: measureNumber,
                                    fifths: entry.keySignatures[0].fifths
                                });
                            } catch (e) {
                                console.error('Failed to parse key signature', entry.keySignatures[0]);
                            }
                        }
                        break;
                    case 'Print':
                        break;
                    case 'Barline':
                        break;
                    case 'Direction':
                        break;
                    default:
                        console.error(`Unrecognized MusicXML entry: '${entry._class}'`);
                        break;
                }
            });
        });
    });
    let tracks: Tracks = Object.keys(parts).map(x => ({
        measures: parts[x].measures,
        timeSignatures: parts[x].timeSignatures,
        keySignatures: parts[x].keySignatures
    }));

    // TODO: more error checking
    // handle unprovided signatures
    tracks.forEach(track => {
        // add default values for key signatures if it is not provided.
        if (track.keySignatures.length === 0) track.keySignatures.push({measure: 0, fifths: 0});
        // handling unprovided time signatures requires extra care. We go through each measure and assign appropriate beatTypes for each measure.
        if (track.timeSignatures.length === 0) {
            if (track.measures.length === 1) {
                // case 1: all notes grouped into a single measure
                let measure = track.measures[0];
                let newMeasures: basicNote[][] = Array(Math.ceil(measure.length / 4)).fill([]).map((_, index) => index * 4).map(start => measure.slice(start, start + 4)); // divide notes into chunks of four
                newMeasures.forEach((measure, idx) => measure.forEach(note => note.time -= 4 * idx)); // shift note start time appropriately
                track.timeSignatures.push({measure: newMeasures.length, beats: 4, beatTypes: 4})
                track.measures = newMeasures;
            } else {
                // case 2: time signature is just not provided
                let currentMeasureLength = 4; // start with assuming 4/4 time signature.
                track.measures.forEach((measure, measureNumber) => {
                    let lastNote = measure[measure.length - 1];
                    let measureLength = Math.max(lastNote.time + lastNote.duration);
                    if (currentMeasureLength !== measureLength) {
                        track.timeSignatures.push({measure: measureNumber, beats: measureLength, beatTypes: 4});
                        currentMeasureLength = measureLength;
                    }
                });
            }
        }
    });
    return {tracks}
};