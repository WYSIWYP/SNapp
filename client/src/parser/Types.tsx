/**
 * This file contains types shared across all parsers.
 */

export enum Tie {
    Start = "START", 
    Stop = "STOP",
}

export type basicNote = {
    time: number,
    duration: number,
    midi: number,
    attributes: {
        ties: Tie[], // TODO: consider making this optional
        // other attributes like slurs and dynamics can go here
    }
};

export type measure = basicNote[];

export type TimeSignature = {
    measure: number,
    beats: number,
    beatTypes: number,
};

export type KeySignature = {
    measure: number,
    fifths: number
}

export type Tracks = {
    measures: measure[],
    timeSignatures: TimeSignature[],
    keySignatures: KeySignature[]
}[]

export type Score = {
    tracks: Tracks,
    duration: number
}
