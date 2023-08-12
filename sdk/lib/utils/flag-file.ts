import * as fs from 'fs';
import { KV } from '../types';
import { __VERBOSE__ } from './constants';

export const FLAG_FILE = '.serverlessq-config.json';
const PROCESS_END_EVENTS = ['exit', 'beforeExit', 'uncaughtException', 'unhandledRejection', 'SIGINT', 'SIGTERM'];

const createUnlinkListener = () => {
    for (const event of PROCESS_END_EVENTS) {
        process.on(event, removeFlagFile);
    }
}

const removeFlagFile = () => {
    if(fs.existsSync(FLAG_FILE)) fs.unlink(FLAG_FILE, (err) => {
        if (err) {
            console.error(`[ServerlessQ] Error deleting flag file. Please check for a ${FLAG_FILE} in your root and delete it manually.`);
        }
    });
};

/**
 *  Creates a flag file to stop NextJS from running the plugin multiple times 
 */
export const ensureSingleExecution = async (params: { onExecution: Function, isProduction: boolean}) => {
    // ensure dev process does not start with a flag file
    if (!fs.existsSync(FLAG_FILE)) {
        fs.writeFileSync(FLAG_FILE, '');
        if (__VERBOSE__) {
            console.log(`Creating config file ${FLAG_FILE}`);
          }
        await params.onExecution();
        // deployed version needs a lookup for the flag file
        if (!params.isProduction) {
            createUnlinkListener();
        }
      }else {
        if (__VERBOSE__) {
            console.log(`Config file ${FLAG_FILE} found`)
          }
      }

    process.on('SIGINT', () => {
        if(!params.isProduction && fs.existsSync(FLAG_FILE)) {
            fs.unlinkSync(FLAG_FILE);
        }
    });
}

// This is a hacky way to store metadata and very slow. It is necessary as the are different node processes running
export const setMetadata = async (params: KV) => {
    const file = await fs.promises.readFile(FLAG_FILE, 'utf-8');

    const crtMetadata = file ? JSON.parse(file || '{}') : {};
    const stringified = JSON.stringify(Object.assign(crtMetadata, params));

    await fs.promises.writeFile(FLAG_FILE, stringified);
}

export const useMetadata = async () => {
    try {
        const file = await fs.promises.readFile(FLAG_FILE, 'utf-8');
        const metadata = file ? file : '{}';
        return JSON.parse(metadata) as Partial<KV>;
    } catch (_) {
        if(__VERBOSE__) {
            console.log('No metadata found')
        }
        return {}
    }
}