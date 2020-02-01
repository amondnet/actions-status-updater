import * as core from '@actions/core'
import * as installer from './installer'
import * as exec from '@actions/exec'

const action = core.getInput('action')
const token = core.getInput('token')
const owner = core.getInput('owner')
const repo = core.getInput('repo')
const ref = core.getInput('ref')
const state = core.getInput('state')
const context = core.getInput('context')
const description = core.getInput('description')
const url = core.getInput('url')

async function run(): Promise<void> {
  try {
    let version = core.getInput('version')
    if (!version) {
      version = '0.2.0'
    }
    if (version) {
      await installer.getBinary(version)
    }
    await exec.exec('github-status-updater', [
      '-action',
      action,
      '-token',
      token,
      '-owner',
      owner,
      '-repo',
      repo,
      '-ref',
      ref,
      '-state',
      state,
      '-context',
      context,
      '-description',
      description,
      '-url',
      url
    ])
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
