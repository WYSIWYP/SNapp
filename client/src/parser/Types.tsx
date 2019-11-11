/**
 * This file contains types shared across all parsers.
 */

export enum Tie {
    Start = "START", 
    Stop = "STOP",
}

export type Note = {
    time: number,
    duration: number,
    midi: number,
    attributes: {
        ties: Tie[], // TODO: consider making this optional
        // other attributes like slurs and dynamics can go here
    }
};

export type TrackType = 'Instrument' | 'Lyrics'; // part types that app currently handles

export type staff = Note[]; 

export type measure = Note[];

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
    measures: measure[],
    timeSignatures: TimeSignature[],
    keySignatures: KeySignature[],
    trackType?: TrackType
};

export type Tracks = Track[];

export type Score = {
    tracks: Tracks,
};
