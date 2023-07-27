const tagBody = /^#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]+$/;

export class Tag {
    tag: any;
    canonical_prefix: string;
    canonical: string;
    name: any;
    matches: (text: any) => any;
    constructor(name: any) {
        const
            hashed = this.tag = Tag.toTag(name),
            canonical = this.canonical = hashed.toLowerCase(),
            canonical_prefix = this.canonical_prefix = canonical + "/";
        this.name = hashed.slice(1);
        this.matches = function (text) {
            text = text.toLowerCase();
            return text == canonical || text.startsWith(canonical_prefix);
        };
    }
    toString() { return this.tag; }

    static isTag(s: string) { return tagBody.test(s); }

    static toTag(name: string) {
        while (name.startsWith("##")) name = name.slice(1);
        return name.startsWith("#") ? name : "#"+name;
    }

    static canonical(name: any) {
        return Tag.toTag(name).toLowerCase();
    }
}

export class Replacement {
    inString: (text: any, pos?: number) => any;
    inArray: (tags: any, skipOdd: any, isAlias: any) => any;
    willMergeTags: (tagNames: any) => Tag[] | undefined;

    constructor(fromTag: Tag, toTag: Tag) {
        const cache =  Object.assign(
            Object.create(null), {
                [fromTag.tag]:  toTag.tag,
                [fromTag.name]: toTag.name,
            }
        );

        this.inString = function(text, pos = 0) {
            return text.slice(0, pos) + toTag.tag + text.slice(pos + fromTag.tag.length);
        }

        this.inArray = (tags, skipOdd, isAlias) => {
            return tags.map((t: string, i: number) => {
                if (skipOdd && (i & 1)) return t;   // leave odd entries (separators) alone
                // Obsidian allows spaces as separators within array elements
                if (!t) return t;
                // Skip non-tag parts
                if (isAlias) {
                    if (!t.startsWith("#") || !Tag.isTag(t)) return t;
                } else if (/[ ,\n]/.test(t)) {
                    // return this.inArray(t.split(/([, \n]+)/), true).join(""); // not sure
                    return this.inArray(t.split(/([, \n]+)/), true, isAlias).join(""); // not sure
                }
                if (cache[t]) return cache[t];
                const lc = t.toLowerCase();
                if (cache[lc]) {
                    return cache[t] = cache[lc];
                } else if (lc.startsWith(fromTag.canonical_prefix)) {
                    return cache[t] = cache[lc] = this.inString(t);
                } else if (("#" + lc).startsWith(fromTag.canonical_prefix)) {
                    return cache[t] = cache[lc] = this.inString("#" + t).slice(1);
                }
                return cache[t] = cache[lc] = t;
            });
        };

        this.willMergeTags = function (tagNames) {
            // Renaming to change case doesn't lose info, so ignore it
            if (fromTag.canonical === toTag.canonical) return;

            const existing = new Set(tagNames.map((s: string) => s.toLowerCase()));

            for (const tagName of tagNames.filter(fromTag.matches)) {
                const changed = this.inString(tagName);
                if (existing.has(changed.toLowerCase()))
                    return [new Tag(tagName), new Tag(changed)];
            }

        }
    }
}


