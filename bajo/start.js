import { CronJob } from 'cron'
// import { spawn } from 'child_process'

async function start () {
  const { importPkg, log, getHelper, dayjs, print, importModule } = this.bajo.helper
  const { isFunction, find } = await importPkg('lodash-es')

  for (const job of this.bajoCron.jobs) {
    async function onTick () {
      let err
      if (job.runAt) {
        log.warn('Job \'%s:%s\' is still running, skipped', job.plugin, job.name)
        return
      }
      log.trace('Job \'%s:%s\' started...', job.plugin, job.name)
      job.runAt = dayjs()
      if (isFunction(job.handler)) await job.handler.call(this, job)
      else if (job.handler.startsWith('helper:')) {
        const [, ...helper] = job.handler.split(':')
        const fn = getHelper(helper.join(':'), false)
        if (fn) await fn(job, ...job.params)
        else err = print.__('Can\'t find function helper for job \'%s:%s\'', job.plugin, job.name)
      } else if (job.handler.startsWith('tool:')) {
        const [, ns, name, ...params] = job.handler.split(':')
        const tool = find(this.bajo.tools, t => (t.ns === ns || t.nsAlias === ns))
        if (tool) {
          const mod = await importModule(tool.file)
          const opts = { ns, toc: false, path: name, params, args: job.params, returnEarly: true }
          const handler = mod.handler ?? mod
          await handler.call(this, opts)
        } else err = print.__('Can\'t find tool for job \'%s:%s\'', job.plugin, job.name)
      } else {
        // spawning child process
      }
      if (err) log.error(err)
      else {
        const now = dayjs()
        log.trace('Job \'%s:%s\' completed, time taken: %sms', job.plugin, job.name, now.diff(job.runAt))
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
