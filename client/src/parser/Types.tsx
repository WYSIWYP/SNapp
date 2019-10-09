/**
 * This file contains types shared across all parsers.
 */

export type basicNote = {
    time: number,
    duration: number,
    midi: number,
};

export type timeSignature = {
    time: number,
    beats: number,
    beatTypes: number,
};

export type Tracks = {
    notes: basicNote[],
    timeSignatures: timeSignature[],
}[]

export type Score = {
    tracks: Tracks,
    duration: number
}
