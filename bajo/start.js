import { CronJob } from 'cron'
import { spawnSync } from 'child_process'

function exec (job) {
  job.options.encoding = 'utf8'
  const err = spawnSync(job.handler, ...job.params, job.options)
  if (err) throw err
}

async function start () {
  const { callHandler, secToHms } = this.app.bajo
  const { dayjs } = this.lib

  if (this.app.bajo.applet) return

  for (const job of this.jobs) {
    async function onTick () {
      if (job.runAt) {
        this.log.warn('Job \'%s:%s\' is still running, skipped', job.ns, job.name)
        return
      }
      this.log.trace('Job \'%s:%s\' is running...', job.ns, job.name)
      job.runAt = dayjs()
      try {
        switch (typeof job.handler) {
          case 'function':
            await job.handler.call(this, job)
            break
          case 'string':
            if (job.handler.startsWith('exec:')) exec.call(this, job)
            else await callHandler(job.handler, ...job.params)
            break
        }
        const now = dayjs()
        this.log.trace('Job \'%s:%s\' completed, time taken: %s', job.ns, job.name, secToHms(now.diff(job.runAt), true))
      } catch (err) {
        const now = dayjs()
        this.log.error('Job \'%s:%s\' failed with error: %s, time taken: %s', job.ns, job.name, err.message, secToHms(now.diff(job.runAt), true))
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
  this.log.debug('%d job(s) in queue', this.jobs.length)
}

export default start
