const ospath = require('path')
const childProcess = require('child_process')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
chai.use(dirtyChai)
const expect = chai.expect
const XMLHttpRequest = require('../lib/XMLHttpRequest').XMLHttpRequest

describe('XMLHttpRequest synchronous request over http', () => {
  const serverScriptPath = ospath.join(__dirname, 'server.js')
  it('should get resource', async () => {
    process.env.UNXHR_MAX_BUFFER = '1'
    const child = childProcess.fork(serverScriptPath, [])
    try {
      const result = await new Promise((resolve) => {
        child.on('message', message => {
          if (message && message.port) {
            const xhr = new XMLHttpRequest()
            xhr.open('POST', `http://localhost:${message.port}/echo`, false)
            try {
              xhr.send('ping! "from client"')
              resolve({ message: 'success' })
            } catch (err) {
              resolve(err)
            }
          }
        })
      })
      // Request should exceed max buffer size!
      // As a result `xhr.send` should throws an exception: spawnSync /bin/sh ENOBUFS
      expect(result.message).to.include('ENOBUFS')
    } finally {
      child.kill()
      delete process.env.UNXHR_MAX_BUFFER
    }
  })
})
