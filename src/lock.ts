class Lock {
  constructor () {
    this._locking = Promise.resolve()
    this._locks = 0
  }

  lock () {
    let unlockNext
    const willLock = new Promise(resolve => unlockNext = () => { resolve() })
    const willUnlock = this._locking.then(() => unlockNext)
    this._locking = this._locking.then(async () => await willLock)
    this._locks++
    return willUnlock
  }

  unlock () {
    if (this._locks > 0) {
      this._locks--
    } else {
      throw new Error('Unlock called without a corresponding lock')
    }
  }
}
