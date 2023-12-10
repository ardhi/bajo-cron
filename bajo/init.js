async function start () {
  const { eachPlugins, readConfig, fatal, buildName, importPkg } = this.bajo.helper
  const { isArray } = await importPkg('lodash-es')
  this.bajoCron.jobs = []
  await eachPlugins(async function ({ file, dir, plugin }) {
    const item = await readConfig(file, { ignoreError: true })
    if (!item) return undefined
    item.name = buildName(file, `${dir}/job`)
    item.plugin = plugin
    item.params = item.params ?? []
    if (!isArray(item.params)) item.params = [item.params]
    if (!item.cron) fatal('Job \'%s\' must have a valid cron pattern')
    if (!item.handler) fatal('Job \'%s\' must have a valid handler')
    this.bajoCron.jobs.push(item)
  }, 'job/**/*.*')
}

export default start
