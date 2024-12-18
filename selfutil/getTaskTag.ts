import { parseFrontMatterAliases, parseFrontMatterTags } from "obsidian";

export interface NoteType {
    type: string;
    description: string;
    prefix: string;
  }
  
export const ALL_TYPES = [
    {
      type: "a/n/n",
      description: "N Current Task",
      prefix: "🔴",
    },
    {
      type: "a/w/n",
      description: "W Current Task",
      prefix: "🔴",
    },
    {
      type: "a/n/l",
      description: "N Later Task",
      prefix: "🟢",
    },
    {
      type: "a/w/l",
      description: "W Later Task",
      prefix: "🟢",
    },
    {
      type: "a/n/p",
      description: "N Permanent Task",
      prefix: "🟠",
    },
    {
      type: "a/w/p",
      description: "W Permanent Task",
      prefix: "🟠",
    },
    {
      type: "a/a/p",
      description: "Area of Responsibility - Primary",
      prefix: "🟥",
    },
    {
      type: "a/a/s",
      description: "Area of Responsibility - Secondary",
      prefix: "🟩",
    },
    {
      type: "a/a/a",
      description: "Area of Responsibility - Abandoned",
      prefix: "🟪",
    },
    {
      type: "b/n/s",
      description: "Zettelkasten - Source notes snippets from content or Reference notes (like books / video / thoughts / conversation)",
      prefix: "📨",
    },
    /*
    {
      type: "b/n/r",
      description: "Zettelkasten - Reference notes (like books / video / thoughts / conversation)",
      prefix: "📖",
    },
    */
    {
      type: "b/n/c",
      description: "Zettelkasten - Cards (With your own thought)",
      prefix: "🔖",
    },
    {
      type: "b/n/p",
      description: "Perspective - combine mulitple notes into a perspective e.g. solve a problem",
      prefix: "🔍",
    },
    {
      type: "b/n/f",
      description: "Framework - Try to put the stuff into a a framework and find the missing puzzle",
      prefix: "🧩",
    },
    {
      type: "c/b/d",
      description: "Blog post draft",
      prefix: "📄",
    },
    {
      type: "b/n/j",
      description: "Journal / events",
      prefix: "📅",
    },
    {
      type: "b/n/m",
      description: "Zettelkasten - MOC Notes for a small topic",
      prefix: "📂",
    },
    {
      type: "b/n/z",
      description: "Zettelkasten - Slip box (mainly on thought and the one I am interested)",
      prefix: "🗃️",
    },
    {
      type: "b/n/i",
      description: "Index Notes for others framework",
      prefix: "📉",
    },
    {
      type: "b/n/t",
      description: "Placeholder Notes for Target Audience (Notes starts with TA)",
      prefix: "👤",
    },
    /*
    {
      type: "b/n/w",
      description: "Wiki Notes for a messy wiki topic",
      prefix: "📖",
    },
    */
    /*
    {
      type: "b/n/v",
      description: "Zettelkasten - Voice script (Deprecated?)",
      prefix: "🗣️",
    },
    */
    /*
    {
      type: "b/n/r",
      description: "Zettelkasten - Reference (Deprecated?)",
      prefix: "📖",
    },
    */
    /*
    {
      type: "b/n/u",
      description: "Zettelkasten - Unprocessed material like an inbox",
      prefix: "📥",
    },
    */
    {
      type: "b/t/a",
      description: "Atomic Essay Template",
      prefix: "✍🏻",
    },
    {
      type: "b/t/p",
      description: "ChatGPT Prompt Template",
      prefix: "🪄",
    },
    {
      type: "c/a/d",
      description: "Atomic Essay drafting",
      prefix: "🆕",
    },
    {
      type: "c/a/r",
      description: "Atomic Essay ready to post",
      prefix: "🆗",
    },
    {
      type: "c/a/p",
      description: "Atomic Essay published",
      prefix: "🆙",
    },
    {
      type: "c/a/a",
      description: "Atomic Essay abandoned",
      prefix: "🗑️",
    },
    {
      type: "c/b/r",
      description: "Blog post ready to publish",
      prefix: "🆗",
    },
    {
      type: "c/b/p",
      description: "Blog post published",
      prefix: "🆙",
    },
    {
      type: "c/b/a",
      description: "Blog post abandoned",
      prefix: "🗑️",
    },
    {
      type: "c/t/d",
      description: "Threads post draft",
      prefix: "🆕",
    },
    {
      type: "c/t/r",
      description: "Threads post ready to post",
      prefix: "🆗",
    },
    {
      type: "c/t/t",
      description: "Threads post threads published",
      prefix: "🆙",
    },
    {
      type: "c/t/p",
      description: "Threads post published",
      prefix: "🆙",
    },
    {
      type: "c/t/o",
      description: "Threads post old (rewritten somewhere",
      prefix: "👴🏻",
    },
    {
      type: "c/t/a",
      description: "Threads post abandoned",
      prefix: "🗑️",
    },
    {
      type: "c/x/d",
      description: "Twitter post drafting",
      prefix: "🆕",
    },
    {
      type: "c/x/r",
      description: "Twitter post ready to publish",
      prefix: "🆗",
    },
    {
      type: "c/x/p",
      description: "Twitter post published",
      prefix: "🆙",
    },
    {
      type: "a/n/w",
      description: "N Waiting Task",
      prefix: "🔵",
    },
    {
      type: "a/n/d",
      description: "N Done Task",
      prefix: "⚪️",
    },
    {
      type: "a/n/a",
      description: "N Archive Task",
      prefix: "🟣",
    },
    {
      type: "a/n/o",
      description: "N Others' Task",
      prefix: "🟤",
    },
    {
      type: "a/w/w",
      description: "W Waiting Task",
      prefix: "🔵",
    },
    {
      type: "a/w/d",
      description: "W Done Task",
      prefix: "⚪️",
    },
    {
      type: "a/w/a",
      description: "W Archive Task",
      prefix: "🟣",
    },
    {
      type: "a/w/o",
      description: "W Others' Task",
      prefix: "🟤",
    },
    {
      type: "b/k/q",
      description: "Expermential Knowledge Group - Dummy Question",
      prefix: "0️⃣",
    },
    {
      type: "b/k/d",
      description: "Expermential Knowledge Group - Data",
      prefix: "1️⃣",
    },
    {
      type: "b/k/s",
      description: "Expermential Knowledge Group - Subjective",
      prefix: "2️⃣",
    },
    {
      type: "b/k/p",
      description: "Expermential Knowledge Group - Complete system to solve a Problem",
      prefix: "3️⃣",
    },
    {
      type: "b/k/c",
      description: "Expermential Knowledge Group - Collections of Subjective / Problem",
      prefix: "4️⃣",
    },
];

// #a/a/p -> "Area of Responsibility - Primary"
export function getNoteDescriptionByType(type: string): string {
    for (const noteType of ALL_TYPES) {
        if (type.replace("#", "") == noteType.type) {
            return noteType.description;
        }
    }
    return "";
}

export function getNoteType(path:String) : NoteType | null {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!file) {
        return null;
    }
    const { frontmatter } = app.metadataCache.getFileCache(file) || {};
    const fmtags = (parseFrontMatterTags(frontmatter) || []);
    for (const tag of fmtags) {
        for (const noteType of ALL_TYPES) {
            if (tag == "#" + noteType.type) {
                return noteType;
            }
        }
    }
    return null
}