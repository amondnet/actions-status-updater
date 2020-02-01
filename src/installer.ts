// Load tempDirectory before it gets wiped by tool-cache
let tempDirectory = process.env['RUNNER_TEMPDIRECTORY'] || '';
import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';

let osPlat: string = os.platform();
let osArch: string = os.arch();

if (!tempDirectory) {
    let baseLocation;
    if (process.platform === 'win32') {
        // On windows use the USERPROFILE env variable
        baseLocation = process.env['USERPROFILE'] || 'C:\\';
    } else {
        if (process.platform === 'darwin') {
            baseLocation = '/Users';
        } else {
            baseLocation = '/home';
        }
    }
    tempDirectory = path.join(baseLocation, 'actions', 'temp');
}


export async function getBinary(version: string) {
    // check cache
    let toolPath: string;
    toolPath = tc.find('github-status-updater', version);

    if (!toolPath) {
        // download, extract, cache
        toolPath = await acquireRelease(version);
        core.debug('Go tool is cached under ' + toolPath);
    }

    toolPath = path.join(toolPath, 'bin');
    //
    // prepend the tools path. instructs the agent to prepend for future tasks
    //
    core.addPath(toolPath);
}

async function acquireRelease(version: string): Promise<string> {
    //
    // Download - a tool installer intimately knows how to get the tool (and construct urls)
    //
    let fileName: string = getFileName();
    let downloadUrl: string = getDownloadUrl(version, fileName);

    core.debug('Downloading Binary from: ' + downloadUrl);

    let downloadPath: string | null = null;
    try {
        downloadPath = await tc.downloadTool(downloadUrl);
    } catch (error) {
        core.debug(error);

        throw `Failed to download version ${version}: ${error}`;
    }

    //
    // Install into the local tool cache - node extracts with a root folder that matches the fileName downloaded
    //
    const toolRoot = path.join(downloadPath, fileName);
    return await tc.cacheDir(toolRoot, 'github-status-updater', version);
}

function getFileName(): string {
    const arches: {[arch: string]: string} = {
        x64: 'amd64',
        arm: 'armv6l',
        arm64: 'arm64',
        default: '386'
    };

    const platform: string = osPlat == 'win32' ? 'windows' : osPlat;
    const arch: string = arches[osArch] || arches['default'];
    const filename: string = util.format(
        'github-status-updater_%s_%s',
        platform,
        arch
    );

    return filename;
}

function getDownloadUrl(version: string, filename: string): string {
    return util.format('https://github.com/cloudposse/github-status-updater/releases/download/%s/$s',version,  filename);
}