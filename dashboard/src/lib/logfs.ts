import { promisify } from "util";
import { exec } from "child_process";
import { promises as fs } from "fs";
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { get_config } from "@/lib/config";
const exec_async = promisify(exec);

const SSHFS_PREFIX = "sshfs://";
const SSHFS_MOUNTS_PREFIX = "sshfsmount-";
const SSHFS_MOUNTS_DURATION_MS = 600000;
const SSHFS_MOUNTS_CMD = "sshfs -o allow_other"
const SSHFS_MOUNTS: Record<string, string> = {};

export async function getlocapath(logname: string, logfilepath: string, repologpath: string): Promise<string> {
  // If it's sshfs
  if (repologpath.startsWith(SSHFS_PREFIX)) {
    await sshfs_mount(repologpath);
    return join(SSHFS_MOUNTS[repologpath], logname);
  }

  // By default assume it's a local file
  return logfilepath;
}

async function sshfs_mount(repologpath: string) {
  // Only actually mounts if it isn't already
  if (!(repologpath in SSHFS_MOUNTS)) {
    const cfg = await get_config();
    SSHFS_MOUNTS[repologpath] = await fs.realpath(await fs.mkdtemp(join(tmpdir(), SSHFS_MOUNTS_PREFIX)));

    const remotepath = repologpath.replace(SSHFS_PREFIX, '');
    const { stdout, stderr } = await exec_async(`${SSHFS_MOUNTS_CMD} ${remotepath} ${SSHFS_MOUNTS[repologpath]}`);

    if (stdout) console.log(`sshfs mount stdout: ${stdout}`);
    if (stderr) console.error(`sshfs mount stderr: ${stderr}`);
    console.log(`Mounted ${repologpath} as ${SSHFS_MOUNTS[repologpath]}`);

    // Set a timeout to unmount automatically after some time
    setTimeout(() => {
      sshfs_umount(repologpath).then(() => { });
    }, cfg.dashboard.sshfs_mount_uptime_ms ? cfg.dashboard.sshfs_mount_uptime_ms : SSHFS_MOUNTS_DURATION_MS);
  }
}

async function sshfs_umount(repologpath: string) {
  if (repologpath in SSHFS_MOUNTS) {
    const { stdout, stderr } = await exec_async(`umount ${SSHFS_MOUNTS[repologpath]}`);
    if (stdout) console.log(`sshfs mount stdout: ${stdout}`);
    if (stderr) console.error(`sshfs mount stderr: ${stderr}`);
    fs.rm(SSHFS_MOUNTS[repologpath], { recursive: true, force: true });
    delete SSHFS_MOUNTS[repologpath];
    console.log("Unmounted " + repologpath);
  }
}

/*
if repologpath local -> return  logfilepath

if repologpath sshfs
  if mounted[repologpath]
    file = mounted[repologpath] + logname
    if file exist return file
  else
    mounted[repologpath] = mount(repologpath)
    starttimer(timeout, unmount(repologpath))

    const { exec } = require('node:child_process');
    exec('cat *.js missing_file | wc -l', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
*/
