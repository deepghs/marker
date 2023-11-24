import { downloadFile, listFiles } from '@huggingface/hub'
import type { RepoDesignation } from '@huggingface/hub'
import JSZip from 'jszip'

// const HF_ACCESS_TOKEN = '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';

export enum HuggingFaceFileType {
    FILE = 'file',
    FOLDER = 'directory',
    UNKNOWN = 'unknown'
}

export class Reporitory {
    repo: RepoDesignation
    files: string[] = []
    loaded = false
    constructor(repo: RepoDesignation) {
        this.repo = repo
    }

    async getFiles(force = false) {
        if (!this.files || force) {
            this.files = await getFilesNameList(this.repo, HuggingFaceFileType.FILE, 'zip')
        }
        this.loaded = true
        return this.files
    }

    getRepoName() {
        if (typeof this.repo === 'string') {
            return this.repo
        } else {
            return this.repo.name
        }
    }
}

export async function getFilesNameList(repo: RepoDesignation, fileType: HuggingFaceFileType, suffix = '') {
    let files = listFiles({ repo })
    let datasets = [] as string[]
    for await (const file of files) {
        if (file.type === fileType && file.path.endsWith(suffix)) {
            datasets.push(file.path)
        }
    }
    return datasets
}

export async function downloadAndUnzip(repo: RepoDesignation, path: string) {
    let zipFile = await downloadFile({ repo, path })
    if (zipFile && zipFile?.ok) {
        let arraybuffer = await zipFile.arrayBuffer()
        let unzip = JSZip.loadAsync(arraybuffer)
        return unzip
    }
}
