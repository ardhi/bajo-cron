import { CronJob } from 'cron'
import { spawnSync } from 'child_process'

function spawn (job) {
  job.options.encoding = 'utf8'
  const result = spawnSync(job.handler, ...job.params, job.options)
  console.log(result)
}

async function runHelper (job) {
  const { getHelper, print } = this.bajo.helper
  const [, ...helper] = job.handler.split(':')
  const fn = getHelper(helper.join(':'), false)
  if (fn) await fn(job, ...job.params)
  else return print.__('Can\'t find function helper for job \'%s:%s\'', job.plugin, job.name)
}

async function runTool (job) {
  const { importModule, print } = this.bajo.helper
  const [, ns, name, ...params] = job.handler.split(':')
  const tool = this.bajo.tools.find(t => (t.ns === ns || t.nsAlias === ns))
  if (tool) {
    const mod = await importModule(tool.file)
    const opts = { ns, toc: false, path: name, params, args: job.params }
    const handler = mod.handler ?? mod
    await handler.call(this, opts)
  } else return print.__('Can\'t find tool for job \'%s:%s\'', job.plugin, job.name)
}

async function start () {
  const { log, dayjs, secToHms } = this.bajo.helper

  for (const job of this.bajoCron.jobs) {
    async function onTick () {
      let err
      if (job.runAt) {
        log.warn('Job \'%s:%s\' is still running, skipped', job.plugin, job.name)
        return
      }
      log.trace('Job \'%s:%s\' started...', job.plugin, job.name)
      job.runAt = dayjs()
      switch (typeof job.handler) {
        case 'function':
          err = await job.handler.call(this, job)
          break
        case 'string':
          if (job.handler.startsWith('helper:')) err = await runHelper.call(this, job)
          else if (job.handler.startsWith('tool:')) err = await runTool.call(this, job)
          else err = spawn.call(this, job)
          break
      }
      if (err) log.error(err)
      else {
        const now = dayjs()
        log.trace('Job \'%s:%s\' completed, time taken: %s', job.plugin, job.name, secToHms(now.diff(job.runAt), true))
      }
      job.runAt = null
    }

    const instance = CronJob.from({
      cronTime: job.cron,
      context: this,
      onTick,
      start: false
    })
    job.instance = instance
  }
  log.debug('%d job(s) instatiated', this.bajoCron.jobs.length)
}

export default start
