import { App, TFile } from "obsidian"
import { LinkType } from "./linkType"

export function getChildlinkItems(app: App, file : TFile): LinkType[] {
    const backlinks = app.metadataCache.getBacklinksForFile(file)
    const backlinksData = backlinks?.data
    if (!backlinksData) {
      return []
    }
    let childLinkResult = []
    for (let [i, v] of backlinksData.entries()) {
      for (let j = 0; j < v.length; j++) {
        const index = v.length > 1 ? "[" + j + "]" : ""
        if (i != file.path) {
          const key = v[j]['key']
          if (key) {
            childLinkResult.push({path: i, type: "v ", index: index, heading: "", line: 0, ch: 0})  
          }
        }
      }
    }
    return childLinkResult
  }