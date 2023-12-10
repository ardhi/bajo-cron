async function bootComplete () {
  const { log } = this.bajo.helper
  for (const j of this.bajoCron.jobs) {
    j.instance.start()
    log.trace('Job \'%s@%s\' has been started', j.plugin, j.name)
  }
}

export default bootComplete
