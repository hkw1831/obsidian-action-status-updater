import {App, MarkdownView, Notice, TAbstractFile, TFile, parseFrontMatterAliases, parseFrontMatterTags} from "obsidian";
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

export function renameBlogTitle(app : App, path: string, view: MarkdownView) : Promise<void> {
    let moment = require('moment');
    const dateYYYYMMDD = moment().format('YYYYMMDD');
    let renamedPath = ""
    if (path.match(/^.\/Blog \d\d\d\d\d\d\d\d/)) {
        return Promise.resolve()
    } else if (path.match(/^.\/blog \d\d\d\d\d\d\d\d/)) {
        new Notice("start with blog with date, renaming blog to Blog")
        renamedPath = path.replace(/^(.\/)blog /, `$1Blog `)
        return renameFile(app, view.file, renamedPath);
    } else if (path.match(/^.\/Blog /)) {
        new Notice("starts with Blog but no date, adding date")
        renamedPath = path.replace(/^(.\/Blog )/, `$1${dateYYYYMMDD} `)
        return renameFile(app, view.file, renamedPath);
    } else if (path.match(/^.\/blog /)) {
        new Notice("starts with blog but no date, adding date")
        renamedPath = path.replace(/^(.\/)blog /, `$1Blog ${dateYYYYMMDD} `)
        return renameFile(app, view.file, renamedPath);
    } else {
        new Notice("starts without blog, adding Blog + date")
        renamedPath = path.replace(/^(.\/)/, `$1Blog ${dateYYYYMMDD} `)
        return renameFile(app, view.file, renamedPath);
    }
}

export function renameThreadsTitle(app : App, path: string, view: MarkdownView) : Promise<void> {
    let moment = require('moment');
    const dateYYYYMMDD = moment().format('YYYYMMDD');
    let renamedPath = ""
    if (path.match(/^.\/Threads \d\d\d\d\d\d\d\d/)) {
        return Promise.resolve()
    } else if (path.match(/^.\/threads \d\d\d\d\d\d\d\d/)) {
        new Notice("start with threads with date, renaming threads to Threads")
        renamedPath = path.replace(/^(.\/)threads /, `$1Threads `)
        return renameFile(app, view.file, renamedPath);
    } else if (path.match(/^.\/Threads /)) {
        new Notice("starts with Threads but no date, adding date")
        renamedPath = path.replace(/^(.\/Threads )/, `$1${dateYYYYMMDD} `)
        return renameFile(app, view.file, renamedPath);
    } else if (path.match(/^.\/threads /)) {
        new Notice("starts with threads but no date, adding date")
        renamedPath = path.replace(/^(.\/)threads /, `$1Threads ${dateYYYYMMDD} `)
        return renameFile(app, view.file, renamedPath);
    } else {
        new Notice("starts without threads, adding Threads + date")
        renamedPath = path.replace(/^(.\/)/, `$1Threads ${dateYYYYMMDD} `)
        return renameFile(app, view.file, renamedPath);
    }
}

async function renameFile(app : App, file : TAbstractFile, newPath: string) {
    app.fileManager.renameFile(file, newPath)
}


