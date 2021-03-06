import {
    readdirSync, existsSync, createReadStream, createWriteStream,
    mkdirSync,
} from 'fs';
import { resolve } from 'path';
import { checkFileIsSame, checkIsDir } from './checkFile';
import { EXPLORE_REG, TS_REG } from '../globalConfig';
import { handleAssetsFile } from './handleAssetsFile';
import type { PluginFunction } from '../typings/config';

/**
 * 读取文件夹
 */
function readDir(filePath: string) {
    if (checkIsDir(filePath)) {
        return readdirSync(filePath);
    } else {
        return [];
    }
}

/**
 * 获取文件夹内所有文件
 */
export function getDirAllFile(filePath: string) {
    let fileArr: string[] = [];
    
    if (checkIsDir(filePath)) {
        const fileList = readdirSync(filePath);
        
        fileList.forEach(val => {
            const tmpPath = resolve(filePath,val)
            if (checkIsDir(tmpPath)) {
                fileArr = fileArr.concat(getDirAllFile(tmpPath));
            } else {
                fileArr.push(tmpPath);
            }
        })
        return fileArr
    }
    return [];
}

/**
 * 用流的方式复制文件
 */
export function copyFile(beginPath: string, endPath: string) {
    if(existsSync(beginPath) && !checkIsDir(beginPath)) {
        const readStream = createReadStream(beginPath);
        const writeStream = createWriteStream(endPath);
        readStream.pipe(writeStream);
    }
}

/**
 * 创建文件夹
 */
function createDir(filePath: string) {
    if (!existsSync(filePath)) {
        mkdirSync(filePath);
    }
}

/**
 * 开始编译
 */
export async function startCompile(
    filePath: string, copyPath: string, plugins: PluginFunction[] = []
) {
    // 读取所有文件
    const fileArr = readDir(filePath);
    for (let x of fileArr) {
        const tmpPath = resolve(resolve(filePath, x));
        let endPath = resolve(copyPath, x);
        if (checkIsDir(tmpPath)) {
            createDir(endPath);
            startCompile(tmpPath, endPath, plugins);
        } else if (!EXPLORE_REG.test(endPath) || /\/lib\/.*|\lib\.*/g.test(endPath)) {
            if (existsSync(endPath) && checkFileIsSame(tmpPath, endPath)) {
                continue;
            } else {
                handleAssetsFile(tmpPath, endPath, plugins);
            }
        }
    }
}

/**
 * 读取所有ts文件
 */
export function readTsFile(filePath: string, currentPath = '') {
    const fileArr = readDir(filePath);
    let resultArr: string[] = [];
    for (let x of fileArr) {
        const tmpPath = resolve(filePath, x);
        const keyPath = `${ currentPath }/${ x }`;
        if (checkIsDir(tmpPath)) {
            resultArr = resultArr.concat(readTsFile(tmpPath, keyPath));
        } else {
            if (TS_REG.test(keyPath)) {
                resultArr.push(tmpPath);
            }
        }
    }
    return resultArr;
}

