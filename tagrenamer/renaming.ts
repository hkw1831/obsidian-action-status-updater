import {App, Notice, TFile, parseFrontMatterAliases, parseFrontMatterTags} from "obsidian";
import {Tag, Replacement} from "./Tag";
import {File} from "./File";

export function hasFrontMatter(file: TFile) : boolean {
    let { frontmatter } = app.metadataCache.getFileCache(file) || {};
    return frontmatter != null
}

export function hasTags(file: TFile) : boolean {
    let { frontmatter } = app.metadataCache.getFileCache(file) || {};
    const fmtags = (parseFrontMatterTags(frontmatter) || []);
    const aliasTags = (parseFrontMatterAliases(frontmatter) || []).filter(Tag.isTag);
    return (fmtags.length || aliasTags.length) ? true : false
}

export async function renameTag(file: TFile, tagName: string, newName:string) : Promise<boolean> {
    const
        oldTag  = new Tag(tagName),
        newTag  = new Tag(newName),
        replace = new Replacement(oldTag, newTag)

    const target = await findTargets(oldTag, file);
    if (!target) {
        return false;
    }
    await target.renamed(replace)
    return true
}

export async function findTargets(tag: Tag, file: TFile) {
    let { frontmatter, tags } = app.metadataCache.getFileCache(file) || {};
    const fmtags = (parseFrontMatterTags(frontmatter) || []).filter(tag.matches);
    const aliasTags = (parseFrontMatterAliases(frontmatter) || []).filter(Tag.isTag).filter(tag.matches);
    if (fmtags.length || aliasTags.length) {
        return new File(app, file.path, tags, fmtags.length + aliasTags.length);
    }
    return null;
}


