import { App, TFile } from "obsidian"
import { LinkType } from "./linkType"

export function getChildlinkItems(app: App, file : TFile): LinkType[] {
    const backlinks = app.metadataCache.getBacklinksForFile(file)
    const backlinksData = backlinks?.data
    if (!backlinksData) {
      return []
    }
    let childLinkResult = []
    for (let i in backlinksData) {
      for (let j = 0; j < backlinksData[i].length; j++) {
        const index = backlinksData[i].length > 1 ? "[" + j + "]" : ""
        if (i != file.path) {
          const key = backlinksData[i][j]['key']
          if (key) {
            childLinkResult.push({path: i, type: "v ", index: index, heading: "", line: 0, ch: 0})  
          }
        }
      }
    }
    return childLinkResult
  }