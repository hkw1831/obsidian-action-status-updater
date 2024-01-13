import { App, Notice, TFile, Vault } from "obsidian"

export function addLinkToEndOfNotes(linkToAdd: string, toPath: string, app: App) {
    const { vault, workspace } = this.app;
    const tFile: TFile = vault.getAbstractFileByPath(toPath) as TFile
    const link = "[[" + linkToAdd + "]]"
    Promise.resolve()
        .then(() => {
            return vault.read(tFile)
        }, reason => { new Notice("Error occurred when reading " + toPath) })
        .then((value) => {
            if (value.includes(link)) {
                const errorReason = `Link ${linkToAdd} already exists in ${toPath}!`
                return Promise.reject(errorReason)
            }
            const newValue = value + "\n- " + link
            return vault.modify(tFile, newValue)
        })
        .then(() => {
            new Notice(`Added link to ${toPath}!`);
            const leaf = workspace.getLeaf(false);
            return leaf.openFile(tFile, { active: true });
        }, (reason) => { 
            new Notice(reason) 
            const leaf = workspace.getLeaf(false);
            return leaf.openFile(tFile, { active: true });
        })
}