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
        ties: Tie[],
        // other attributes like slurs and dynamics can go here
    }
};

export type timeSignature = {
    time: number,
    beats: number,
    beatTypes: number,
};

export type keySignature = {
    time: number,
    fifths: number
}

export type Tracks = {
    notes: basicNote[],
    timeSignatures: timeSignature[],
    keySignatures: keySignature[]
}[]

export type Score = {
    tracks: Tracks,
    duration: number
}
