import MusicXML from 'musicxml-interfaces';
import {Note, TimeSignature, KeySignature, Tracks, Score, Tie, Measure, Track, TrackType} from './Types'

const pitchToMidi = (pitch: {octave: number, step: string, alter?: number}) => {
    // we assume C4 = 60 as middle C. Note that typical 88-key piano contains notes from A0 (21) - C8 (108).
    let step = ({c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11} as {[index: string]: number})[pitch.step.toLowerCase()];
    return (pitch.octave + 1) * 12 + step + (pitch.alter === undefined ? 0 : Math.round(pitch.alter));
};

const isScorePart = (part: MusicXML.PartGroup | MusicXML.ScorePart): part is MusicXML.ScorePart => {
    return part && part._class === 'ScorePart';
};

// get piano part name from xml
const getPianoPartID = (xml: MusicXML.ScoreTimewise): string | undefined => {
    const pianoPart = xml.partList.find(part => isScorePart(part) && part.partName.partName.toLowerCase() === 'piano');
    return pianoPart ? (pianoPart as MusicXML.ScorePart).id : undefined;
    // if (!pianoPart) return undefined;
    // const pianoPartId = (pianoPart as MusicXML.ScorePart).id;

    // get the number of staves 
    // let numStaves: number | undefined;
    // xml.measures.some(measure => measure.parts[pianoPartId].some(entry => numStaves = entry.staves)); // loop until entry.staves is defined
    // if (numStaves === undefined) numStaves = 1; // default is 1
    // return {pianoPartId, numStaves};
};

const getLyricsPartID = (xml: MusicXML.ScoreTimewise): string | undefined => {
    let lyricsPartId: string | undefined;
    // loop until we find a part with some lyrics defined. 
    xml.measures.some(measure => {
        return Object.keys(measure.parts).some(partName => {
            let part = measure.parts[partName];
            let partContainsLyrics = part.some(entry => entry.lyrics !== undefined);
            lyricsPartId = partContainsLyrics ? partName : undefined;
            return lyricsPartId !== undefined;
        });
    });
    return lyricsPartId;
};

export const parse = (xml: MusicXML.ScoreTimewise): Score => {
    let lyricsPartId = getLyricsPartID(xml);
    let pianoPartId = getPianoPartID(xml);

    // currently, SNApp renders piano and lyric parts. We store the ids of the tracks we have to parse below.
    // let trackTypeMap: Partial<Record<string, TrackType>> = {
    //     [pianoPartId]: 'Piano',
    //     ...(lyricsPartId && {[lyricsPartId]: 'Lyrics'}) // conditionally assign lyrics part
    // }

    let currentBeatType = 4;
    let parts: {
        [index: string]: {
            divisions: number,
            progress: number,
            timeSignatures: TimeSignature[];
            keySignatures: KeySignature[];
            measures: Measure[],
        }
    } = {};

    /** 
     * Multitrack Handling Logic
     * 
     * We parse:
     *      1) just the instrument part from a two part work for instrument and vocal
     *      2) just the piano part from a work with multiple instrument parts
     *      3) just one instrument part from a work with multiple instruments and none of them are piano
     */

    // parts that we want to parse. We may add more ids here if we decide to render more instruments parts.
    let trackIDsToParse: string[] = [];

    let instrumentId = pianoPartId !== undefined ? pianoPartId : 'P1';
    trackIDsToParse.push(instrumentId);
    if (lyricsPartId !== undefined && !trackIDsToParse.includes(lyricsPartId)) {
        trackIDsToParse.push(lyricsPartId) 
    }
    console.log(`lyrics partId: ${lyricsPartId}, instrument partId: ${instrumentId}`);

    xml.measures.forEach((measure, measureNumber) => {
        trackIDsToParse.forEach(partName => {
            if (measure.parts[partName] === undefined) return; // if part has not started yet, skip this measure.

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
            let notes: Note[] = [];
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
                                let entryTies = entry.ties as {type: number}[];
                                let staffNumber = entry.staff ? entry.staff : 1;
                                notes.push({
                                    time, duration: divisionsToNoteLength(entry.duration),
                                    midi: pitchToMidi(entry.pitch),
                                    staff: staffNumber,
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
                    case 'Sound':
                        break;
                    default:
                        console.error(`Unrecognized MusicXML entry: '${entry._class}'`);
                        break;
                }
            });
        });
    });
    let tracks: Tracks = Object.keys(parts).map(partId => {
        let trackTypes: TrackType[] = []
        if (partId === lyricsPartId) trackTypes.push('Lyrics');
        if (partId === instrumentId) trackTypes.push('Instrument');

        return {
            measures: parts[partId].measures,
            timeSignatures: parts[partId].timeSignatures,
            keySignatures: parts[partId].keySignatures,
            trackTypes: trackTypes
        } as Track;
    });

    // TODO: handle grace note 
    // handle unprovided signatures
    tracks.forEach(track => {
        // add default values for key signatures if it is not provided.
        if (track.keySignatures.length === 0) track.keySignatures.push({measure: 0, fifths: 0});

        if (track.timeSignatures.length === 0) {
            if (track.measures.length === 1) {
                // case 1: all notes grouped into a single measure
                let measure = track.measures[0];
                let newMeasures: Note[][] = Array(Math.ceil(measure.length / 4)).fill([]).map((_, index) => index * 4).map(start => measure.slice(start, start + 4)); // divide notes into chunks of four
                newMeasures.forEach((measure, idx) => measure.forEach(note => note.time -= 4 * idx)); // shift note start time appropriately
                track.timeSignatures.push({measure: newMeasures.length, beats: 4, beatTypes: 4})
                track.measures = newMeasures;
            } else {
                // case 2: time signature is not provided at all
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