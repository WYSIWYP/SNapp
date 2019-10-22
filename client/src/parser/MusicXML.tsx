import MusicXML from 'musicxml-interfaces';
import {basicNote, timeSignature, Tracks, Score} from './Types'

const pitchToMidi = (pitch: {octave: number, step: string, alter?: number}) => {
    // we assume C4 = 60 as middle C. Note that typical 88-key piano contains notes from A0 (21) - C8 (108).
    let step = ({c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11} as {[index: string]: number})[pitch.step.toLowerCase()];
    return (pitch.octave + 1) * 12 + step + (pitch.alter === undefined ? 0 : Math.round(pitch.alter));
};

export const parse = (xml: MusicXML.ScoreTimewise): Score => {
    let duration = 0;
    let parts: {
        [index: string]: {
            divisions: number,
            progress: number,
            timeSignatures: timeSignature[];
            notes: basicNote[],
        }
    } = {};

    xml.measures.forEach((measure, i) => {
        Object.keys(measure.parts).forEach(partName => {

            if (parts[partName] === undefined) {
                parts[partName] = {
                    divisions: undefined!,
                    progress: 0,
                    timeSignatures: [],
                    notes: [],
                };
            }
            let part = parts[partName];
            let notes: basicNote[] = [];
            let divisionsToQuarterNotes = (divisions: number) => {
                if (part.divisions === undefined) {
                    console.error('A note was defined before timing information was established');
                    return divisions / 24;
                }
                return divisions / part.divisions;
            }
            measure.parts[partName].forEach(entry => {
                switch (entry._class) {
                    case 'Note':
                        if (entry.duration !== undefined) { //grace notes do not have a duration - are not displayed
                            let time = part.progress;
                            if (entry.chord !== undefined) {
                                if (notes.length === 0) {
                                    console.error('The first note within a measure was marked as being part of a chord');
                                } else {
                                    if (notes[notes.length - 1].duration !== divisionsToQuarterNotes(entry.duration)) {
                                        console.error('Two notes in a chord were of different durations');
                                    }
                                    time = notes[notes.length - 1].time;
                                }
                            } else {
                                part.progress += divisionsToQuarterNotes(entry.duration);
                            }
                            if (entry.rest === undefined && entry.pitch === undefined) {
                                console.error('A note was neither marked as a rest or given a pitch');
                            }
                            if (entry.rest !== undefined && entry.pitch !== undefined) {
                                console.error('A note was marked as a rest but was also given a pitch');
                            }
                            if (entry.pitch !== undefined) {
                                notes.push({time, duration: divisionsToQuarterNotes(entry.duration), midi: pitchToMidi(entry.pitch)});
                            }
                        }
                        break;
                    case 'Backup':
                        part.progress -= divisionsToQuarterNotes(entry.duration);
                        break;
                    case 'Forward':
                        part.progress += divisionsToQuarterNotes(entry.duration);
                        break;
                    case 'Attributes':
                        if (entry.divisions !== undefined) {
                            part.divisions = entry.divisions;
                        }
                        if (entry.times !== undefined) {
                            if (entry.times.length !== 0) {
                                try {
                                    part.timeSignatures.push({time: part.progress, beats: parseInt(entry.times[0].beats[0]), beatTypes: entry.times[0].beatTypes})
                                } catch (e) {
                                    console.error('Failed to parse time signature', entry.times[0]);
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
                if (part.progress > duration) {
                    duration = part.progress;
                }
            });
            part.notes.push(...notes);
        });
    });

    let tracks: Tracks = Object.keys(parts).map(x => ({
        notes: parts[x].notes,
        timeSignatures: parts[x].timeSignatures,
    }));
    return {tracks, duration}
};
