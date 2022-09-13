import MusicXML from 'musicxml-interfaces';
import {Note, TimeSignature, KeySignature, Tracks, Score, Notes, Track, TrackType, isDynamics, Direction, Directions, Slur} from './Types';

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
    let tempo: number | undefined;

    let currentBeatType = 4;
    let currentBeats = 4;
    let parts: {
        [index: string]: {
            divisions: number,
            progress: number,
            timeSignatures: TimeSignature[];
            keySignatures: KeySignature[];
            measures: Notes[],
            directions: Directions[]
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
        trackIDsToParse.push(lyricsPartId);
    }

    xml.measures.forEach((measure, measureNumber) => {
        trackIDsToParse.forEach(partName => {
            if (measure.parts[partName] === undefined) return; // if part has not started yet, skip this measure.

            if (parts[partName] === undefined) {
                parts[partName] = {
                    divisions: undefined!,
                    progress: 0,
                    timeSignatures: [],
                    keySignatures: [],
                    measures: Array(xml.measures.length).fill([]),
                    directions: Array(xml.measures.length).fill([])
                };
            }
            let part = parts[partName];
            let notes: Note[] = [];
            let directions: Direction[] = [];
            // computes note lengh with respect to the beat type
            let divisionsToNoteLength = (divisions: number) => {
                if (part.divisions === undefined) {
                    console.error('A note was defined before timing information was established');
                    return divisions / 24;
                }
                return divisions / part.divisions * (currentBeatType / 4);
            };
            part.progress = 0;
            let measureEnd = 0;

            measure.parts[partName].forEach(entry => {
                switch (entry._class) {
                    case 'Note':
                        if (entry.duration !== undefined) { //grace notes do not have a duration - are not displayed
                            let time = part.progress;

                            measureEnd = Math.max(measureEnd, time + divisionsToNoteLength(entry.duration));
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
                                let entrySlur: Slur | undefined;
                                let entryFingering = '';
                                let lyricsText: string | undefined;

                                if (entry.notations && entry.notations.length > 0) {
                                    entry.notations.forEach((notation: any) => {
                                        if (notation.slurs) {
                                            notation.slurs.forEach((slur: any) => {
                                                if (slur.type === 0) entrySlur = 'start';
                                                if (slur.type === 1) entrySlur = 'end';
                                            });
                                        }
                                        if (notation.technicals) {
                                            notation.technicals.forEach((technical: any) => {
                                                // console.log(technical.fingering);
                                                if (technical.fingering) {
                                                    if (technical.fingering.finger > -1) {
                                                        entryFingering = `${technical.fingering.finger}`;
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                                if (entry.lyrics) {
                                    let lyrics = entry.lyrics[0].lyricParts.find((lyrics: any) => lyrics._class === 'Text');
                                    if (lyrics) lyricsText = lyrics.data;
                                }
                                let setFingering = (value: number)=>{
                                    if(!entry.notations){
                                        entry.notations = [];
                                    }
                                    if((entry.notations as any[]).every(x=>x.technicals===undefined)){
                                        entry.notations.push({technicals: []});
                                    }
                                    let technicals = (entry.notations as any[]).filter(x=>x.technicals!==undefined)[0].technicals as any[];
                                    if(technicals.every(x=>x.fingering===undefined)){
                                        technicals.push({fingering: {
                                            substitution: false,
                                            fontWeight: 0,
                                            fontStyle: 0,
                                            color: "#000000",
                                            placement: 0,
                                            alternate: false,
                                        }});
                                    }
                                    technicals.filter(x=>x.fingering!==undefined)[0].fingering.finger = value;
                                    (xml as any).revision = Math.random();
                                }
                                notes.push({
                                    time, duration: divisionsToNoteLength(entry.duration),
                                    midi: pitchToMidi(entry.pitch),
                                    fingering: entryFingering,
                                    setFingering,
                                    staff: staffNumber === 1 ? 'treble' : 'bass',
                                    attributes: {
                                        tie: entryTies ? (entryTies.some(tie => tie.type === 0) ? 'start' : 'end') : undefined,
                                        slur: entrySlur,
                                        lyrics: lyricsText
                                    }
                                });
                            }
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
                                    currentBeats = entry.times[0].beats[0];
                                } catch (e) {
                                    console.error('Failed to parse time signature', entry.times[0]);
                                }
                            }
                        }
                        if (entry.keySignatures && entry.keySignatures.length !== 0) {
                            try {
                                part.keySignatures.push({
                                    measure: measureNumber,
                                    fifths: entry.keySignatures[0].fifths,
                                    mode: entry.keySignatures[0].mode
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
                        // parse tempo
                        if (entry.hasOwnProperty('sound') && entry.sound.tempo !== undefined) {
                            if (!tempo && entry.sound.tempo) tempo = parseInt(entry.sound.tempo); // take the first defined tempo
                        }
                        if (!entry.directionTypes || entry.directionTypes === 0) break;

                        // parse other directions
                        entry.directionTypes.forEach((direction: any) => {
                            // parse dynamics
                            if (direction.hasOwnProperty('dynamics')) {
                                Object.keys(direction.dynamics).forEach(key => {
                                    if (isDynamics(key)) directions.push({time: part.progress, dynamics: key});
                                });
                            }

                            // parse wedge (crescendo / diminuendo)
                            if (direction.hasOwnProperty('wedge')) {
                                if (direction.wedge.type === 0) directions.push({time: part.progress, wedge: 'crescendo'});
                                else if (direction.wedge.type === 1) directions.push({time: part.progress, wedge: 'diminuendo'});
                                else if (direction.wedge.type === 2) directions.push({time: part.progress, wedge: 'stop'});
                            }

                            // parse pedal
                            if (direction.hasOwnProperty('pedal')) {
                                if (direction.pedal.type === 0) directions.push({time: part.progress, pedal: 'start'});
                                else if (direction.pedal.type === 1) directions.push({time: part.progress, pedal: 'end'});
                                // we disregard other pedal types
                            }
                        });
                        break;
                    case 'Sound':
                        if (!tempo && entry.tempo) tempo = parseInt(entry.tempo); // take the first defined tempo
                        break;
                    default:
                        console.error(`Unrecognized MusicXML entry: '${entry._class}'`);
                        break;
                }
            });
            part.measures[measureNumber] = notes;
            part.directions[measureNumber] = directions;

            // check pick up measure
            if (measureNumber === 0 && measureEnd < currentBeats) {
                let offset = currentBeats - measureEnd;
                part.measures[0].forEach(note => note.time += offset);
                part.directions[0].forEach(direction => direction.time += offset);
            }
        });
    });
    let tracks: Tracks = Object.keys(parts).map(partId => {
        let trackTypes: TrackType[] = [];
        if (partId === lyricsPartId) trackTypes.push('lyrics');
        if (partId === instrumentId) trackTypes.push('instrument');

        let trackHasBassStaffOnly = (xml: MusicXML.ScoreTimewise, partId: string) => {
            // TODO: optimize this
            let trackHasBassStaff = xml.measures.some(measure => {
                return measure.parts[partId].some(entry => {
                    return entry.clefs && entry.clefs.some((clef: any) => {
                        return clef.sign === 'F' && clef.line === 4;
                    });
                });
            });
            let trackHasOneStaff = xml.measures.every(measure => {
                return measure.parts[partId].every(entry => {
                    return entry.staff === undefined;
                });
            });
            return trackHasBassStaff && trackHasOneStaff;
        };

        return {
            measures: parts[partId].measures,
            directions: parts[partId].directions,
            timeSignatures: parts[partId].timeSignatures,
            keySignatures: parts[partId].keySignatures,
            trackTypes,
            bassStaffOnly: trackHasBassStaffOnly(xml, partId)
        } as Track;
    });

    // handle unprovided signatures
    tracks.forEach(track => {
        // add default values for key signatures if it is not provided.
        if (track.keySignatures.length === 0) track.keySignatures.push({measure: 0, fifths: 0, mode: ''});

        if (track.timeSignatures.length === 0) {
            if (track.measures.length === 1) {
                // case 1: all notes grouped into a single measure
                let measure = track.measures[0];
                let newMeasures: Note[][] = Array(Math.ceil(measure.length / 4)).fill([]).map((_, index) => index * 4).map(start => measure.slice(start, start + 4)); // divide notes into chunks of four
                newMeasures.forEach((measure, idx) => measure.forEach(note => note.time -= 4 * idx)); // shift note start time appropriately
                track.timeSignatures.push({measure: newMeasures.length, beats: 4, beatTypes: 4});
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
    return {tracks, tempo};
};