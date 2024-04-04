import { NoteType } from "./getTaskTag"

export interface NoteWithHeader {
    notePath: string,
    header: string,
    startLine: number,
    noteType: NoteType | null
}

export const SEPARATOR = "-------------------------"