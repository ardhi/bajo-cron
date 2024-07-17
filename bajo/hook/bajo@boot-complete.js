async function bootComplete () {
  const { log } = this.app.bajo
  for (const j of this.jobs) {
    if (!j.instance) continue
    j.instance.start()
    log.trace('Job \'%s@%s\' has been started', j.plugin, j.name)
  }
}

export default bootComplete
