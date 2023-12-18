async function start () {
  const { getConfig, eachPlugins, readConfig, fatal, buildName } = this.bajo.helper
  this.bajoCron.jobs = []
  const config = getConfig()
  if (config.tool) return // can't run in sidetool mode
  await eachPlugins(async function ({ file, dir, plugin }) {
    const item = await readConfig(file, { ignoreError: true })
    if (!item) return undefined
    item.name = buildName(file, `${dir}/job`)
    item.plugin = plugin
    item.params = item.params ?? []
    item.options = item.options ?? {}
    if (typeof item.params === 'string') item.params = [item.params]
    if (!item.cron) fatal('Job \'%s\' must have a valid cron pattern')
    if (!item.handler) fatal('Job \'%s\' must have a valid handler')
    this.bajoCron.jobs.push(item)
  }, 'job/**/*.*')
}

export default start
