import path from 'path'

async function init () {
  const { eachPlugins, readConfig } = this.app.bajo
  const { camelCase } = this.app.bajo.lib._

  this.jobs = []
  if (this.app.bajo.applet) {
    this.print.warn('Can\'t run cron in tool mode!')
    return
  }
  await eachPlugins(async function ({ file, dir, ns }) {
    const item = await readConfig(file, { ns, ignoreError: true })
    if (!item) return undefined
    item.name = camelCase(path.basename(file.replace(`${dir}/job`), path.extname(file)))
    item.ns = ns
    item.params = item.params ?? []
    item.options = item.options ?? {}
    if (typeof item.params === 'string') item.params = [item.params]
    if (!item.cron) this.fatal('Job \'%s\' must have a valid cron pattern')
    if (!item.handler) this.fatal('Job \'%s\' must have a valid handler')
    this.jobs.push(item)
  }, { glob: 'job/**/*.*', baseNs: this.ns })
}

export default init
