import { Editor } from "obsidian"

const skipFrontMatterField: string[] = [
	"freetimetask: ",
	"expectedtime: ",
	"mode: ",
	"days: ",
	"showheaderfooter: ",
	"showstate: ",
	"sortsubpagefilter: ",
	"throughttree: ",
	"urgent: ",
	"displayas: ",
	"startdate: ",
	"readwritemode: ",
	"showChandlerNow: ",
	"deepwork: ",
	"expectedtime: ",
	"parsedate: ",
	"tidscope: ",
	"inserttodoaction: ",
	"optional: ",
	"replaceto: ",
	"backuptiddler: ",
	"deadline: ",
	"caption: ",
	"collection: ",
	"library: ",
	"library_version: ",
	"dummy: ",
	"tidName: ",
	"chronicledate: ",
	"eventdate: ",
	"dailyhighlight: ",
	"displaycardmode: ",
	"displaymode: ",
	"numcol: ",
	"dateyyyymmdd: ",
	"graphdisplaymode: ",
	"maxdepth: ",
	"journaldate: ",
	"thisBillDate: ",
	"lastBillDate: ",
	"roottiddler: ",
	"year: ",
	"to: ",
	"tidtemplate: ",
	"tiddlername: ",
	"theme: ",
	"tagvalue: ",
	"subtasknum: ",
	"removetagvalue: ",
	"recurringeventstartdate: ",
	"recurringeventenddate: ",
	"pluginname: ",
	"pid: ",
	"macroname: ",
	"limit: ",
	"keyword: ",
	"keywordtmp: ",
	"from: ",
	"deprecatereason: ",
	"deepwo: ",
	"color: ",
	"row: ",
	"col: ",
	"bookmarked: ",
	"blockingreminderdate: ",
	"backup: "
]

export function replaceTWUselessValue(value: string) : string {
    return value
        .replace("## > References\n\n* \n\n", "")
        .replace("## > Goal and Reason\n\n* \n\n", "")
        .replace("## > Deliverable Spec\n\n* \n\n", "")
        .replace("## > Conditon of done\n\n* \n\n", "")
        .replace("## > Step\n\n* \n\n", "")
        .replace("## > Progress\n\n* \n\n", "")
        .replace("## > Results\n\n* \n\n", "")
        .replace("## > Experience\n\n* \n\n", "")
        .replace("## > References\n\n* \n\n", "")
        .replace("## > Results, Steps and Exp\n\n* \n\n", "")
        .replace("## > Checklist\n\n[ ] \n\n", "")
        .replace(/\n\n\n+/, "\n\n")
}

export function shouldSkipFrontMatter(line: string) : boolean {
    for (let i = 0; i < skipFrontMatterField.length; i++) {
        if (line.startsWith(skipFrontMatterField[i])) {
            return true
        }
    }
    return false
}

export function getParentLine(value: string) {
    const values = value.split("\n")
    for (let i = 0; i < values.length; i++) {
        const lineContent = values[i]
        if (/^parent\d+: /.test(lineContent) || /^\t+- parent\d+: /.test(lineContent)) {
            return i
        }
    }
    return 0
}

export function	tidyUpFrontMatteronEditor(editor: Editor) {
    const value = editor.getValue()
    const modifiedValue = tidyUpFrontMatterOnValue(value)
    editor.setValue(modifiedValue)
}

/*
export function	tidyUpFrontMatterOnValue(value: String) {
    const values: string[] = value.split("\n")
    const lineCount = values.length

    let fm = ""
    let c = ""
    let text = ""
    let h3Count = 0;
    let content = ""
    for (let i = 0; i < lineCount; i++) {
        const line = values[i]
        if (h3Count == 0) {
            content += (line + "\n")
        } else if (h3Count == 1) {
            if (shouldSkipFrontMatter(line)) {
                // do nothing
            } else if (/^parent\d+: /.test(line)) {
                const modifiedLine = line.replace(/\//g, "_").replace(/\?/g, "_").replace(/:/g, "_").replace(/^(parent\d+)_ /, "$1: ")
                fm += (modifiedLine + "\n")
            } else if (line.startsWith("title: ")) {
                const modifiedLine = line.replace(/:/g, "_").replace(/^title_ /, "title: ").replace(/\//g, "_").replace(/\?/g, "_")
                fm += (modifiedLine + "\n")
            } else if (line === "tags: [excalidraw]"){
                fm += (line + "\n")
            } else if (line.startsWith("tagsss: ") || line.startsWith("tags: ")) {
                const bracketPattern = /\[\[.*?\]\]/g;

                // Find all bracketed items
                const bracketedItems = line.match(bracketPattern) || [];
                
                // Remove bracketed items from the input string to deal with the remaining
                const remainingString = line.replace(bracketPattern, '').trim();
                
                // Split the remaining string by spaces to get the individual words
                const remainingItems = remainingString.split(/\s+/).filter(item => item);
                
                // Combine the bracketed items and the individual words into one array
                const fmtagsss = [...bracketedItems, ...remainingItems];

                let parent : string[] = []
                let tagsss : string[] = []
                let skips : string[]= []
                
                fmtagsss.forEach(tag => {
                    tag = tag.trim()
                    // [[event n]] / [[event w]] / regex of [[20220717 Journal (Week 28 Sun)]]: put in skips
                    // [[20220721 Journal (Week 29 Thu)]]
                    if (tag === "[[.Header Shortcut]]" || tag === "[[.Current Project]]" || tag === "concept" || tag === "space" || tag === "problem" || tag === "tagsss:" || tag === "tags:" || tag === "[[event n]]" || tag === "[[event w]]"
                        || /\[\[\d{8} Journal \(Week \d+ [A-Za-z]{3}\)\]\]/.test(tag)) {
                        skips.push(tag)
                    } else if (tag === "permtask" || 	tag === "N" || tag === "W" || tag === "now" || tag === "later" || tag === "waiting" || tag === "done" || tag === "archive" || tag === "action" || tag === "task") {
                        tagsss.push(tag.replace("[[", "").replace("]]", ""))
                    } else if (tag === "preblog" || tag === "prepreblog") {
                        parent.push("[[Blog _ Post]]")
                    } else {
                        parent.push(tag)
                    }
                })
                //new Notice(skips.join("\n"))
                let modifiedLine = ""
                if (tagsss.length > 0) {
                    modifiedLine += "tagsss: " + tagsss.join(" ") + "\n"
                }
                let parentCount = 1
                if (parent.length > 0) {
                    const uniqueParent = Array.from(new Set(parent));
                    uniqueParent.forEach(p => {
                        if (p.startsWith("[[") && p.endsWith("]]")) {
                            modifiedLine += "parent" + parentCount + ": \"" + p.replace(":", "_") + "\"\n"
                        } else {
                            modifiedLine += "parent" + parentCount + ": \"[[" + p.replace(":", "_") + "]]\"\n"
                        }
                        parentCount++
                    })
                }
                fm += modifiedLine
            } else {
                fm += (line + "\n")
            }
        }
        if (h3Count >= 2) {
            c += (line + "\n")
        }
        if (line === "---") {
            h3Count++;
        }
    } 
    text += content
    if (fm.length > 0) {
        text += fm
    }
    text += c
    
    return text.replace(/^---\n---\n/m, "").replace(/\n$/, "")
}
*/

export function	tidyUpFrontMatterOnValue(value: String) {
    const values: string[] = value.split("\n")
    const lineCount = values.length

    let fm = ""
    let c = ""
    let text = ""
    let h3Count = 0;
    let content = ""
    for (let i = 0; i < lineCount; i++) {
        const line = values[i]
        if (h3Count == 0) {
            content += (line + "\n")
        } else if (h3Count == 1) {
            if (/^tag: [a-c]\/[a-z]\/[a-z]$/.test(line)) {
                fm += (line.replace(/^tag: /, "tags: ") + "\n")
            } else {
                fm += (line + "\n")
            }
        }
        if (h3Count >= 2) {
            c += (line + "\n")
        }
        if (line === "---") {
            h3Count++;
        }
    } 
    text += content
    if (fm.length > 0) {
        text += fm
    }
    text += c
    
    return text.replace(/^---\n---\n/m, "").replace(/\n$/, "")
}