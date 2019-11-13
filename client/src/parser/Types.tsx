/**
 * This file contains types shared across all parsers.
 */

export enum Tie {
    Start = "START", 
    Stop = "STOP",
}

export type TrackType = 'Instrument' | 'Lyrics'; // part types that app currently handles

export type StaffType = 'treble' | 'bass';

export type Note = {
    time: number,
    duration: number,
    midi: number,
    staff: StaffType,
    attributes: {
        ties: Tie[], // TODO: consider making this optional
        // other attributes like slurs and dynamics can go here
    }
};

export type Measure = Note[]; // note: each part should have 1 staff or 2 staves (for piano)

export type TimeSignature = {
    measure: number,
    beats: number,
    beatTypes: number,
};

export type KeySignature = {
    measure: number,
    fifths: number
}

export type Track = {
    measures: Measure[],
    timeSignatures: TimeSignature[],
    keySignatures: KeySignature[],
    trackTypes: TrackType[] // we use an array here because a track might contain both lyrics and piano part.
};

export type Tracks = Track[];

export type Score = {
    tracks: Tracks,
};
