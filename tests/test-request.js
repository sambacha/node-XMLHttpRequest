'use strict'

const ospath = require('path')
const childProcess = require('child_process')
const fs = require('fs')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
chai.use(dirtyChai)
const expect = chai.expect
const XMLHttpRequest = require('../lib/XMLHttpRequest').XMLHttpRequest

function setRejectUnauthorized (ssl) {
  if (ssl) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  } else {
    delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
  }
}

;[true, false].forEach((ssl) => {
  const protocol = ssl ? 'https' : 'http'
  const serverArgs = ssl ? ['--ssl'] : []
  ;[true, false].forEach((asyncReq) => {
    describe(`XMLHttpRequest ${asyncReq ? 'asynchronous' : 'synchronous'} request over ${protocol}`, () => {
      const serverScriptPath = ospath.join(__dirname, 'server.js')
      it('should get resource', async () => {
        setRejectUnauthorized(ssl)
        const child = childProcess.fork(serverScriptPath, serverArgs)
        try {
          let data = ''
          await new Promise((resolve) => {
            child.on('message', message => {
              if (message && message.port) {
                const xhr = new XMLHttpRequest()
                xhr.open('GET', `${protocol}://localhost:${message.port}`, asyncReq)
                xhr.onload = function () {
                  if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                      data = xhr.responseText
                    }
                    resolve()
                  }
                }
                xhr.send()
              }
            })
          })
          expect(data).to.equal('Hello World')
        } finally {
          child.kill()
        }
      })
      it('should get image', async () => {
        setRejectUnauthorized(ssl)
        const child = childProcess.fork(serverScriptPath, serverArgs)
        try {
          let response
          await new Promise((resolve) => {
            child.on('message', message => {
              if (message && message.port) {
                const xhr = new XMLHttpRequest()
                xhr.open('GET', `${protocol}://localhost:${message.port}/cat.png`, asyncReq)
                xhr.responseType = 'arraybuffer'
                xhr.onload = function () {
                  if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                      response = xhr.response
                    }
                    resolve()
                  }
                }
                xhr.send()
              }
            })
          })
          expect(response instanceof ArrayBuffer).to.equal(true)
          expect(fs.readFileSync(ospath.join(__dirname, 'cat.png')).compare(new Uint8Array(response))).to.equal(0)
        } finally {
          child.kill()
        }
      })
      it('should post data', async () => {
        setRejectUnauthorized(ssl)
        const child = childProcess.fork(serverScriptPath, serverArgs)
        try {
          let responseText = ''
          await new Promise((resolve) => {
            child.on('message', message => {
              if (message && message.port) {
                const xhr = new XMLHttpRequest()
                xhr.open('POST', `${protocol}://localhost:${message.port}/echo`, asyncReq)
                xhr.onload = function () {
                  if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                      responseText = xhr.responseText
                    }
                    resolve()
                  }
                }
                xhr.send('ping! "from client"')
              }
            })
          })
          expect(responseText).to.equal('ping! "from client"')
        } finally {
          child.kill()
        }
      })
      it('should post json data (with correct content-length)', async () => {
        setRejectUnauthorized(ssl)
        const child = childProcess.fork(serverScriptPath, serverArgs)
        try {
          let responseText = ''
          await new Promise((resolve) => {
            child.on('message', message => {
              if (message && message.port) {
                const xhr = new XMLHttpRequest()
                xhr.open('POST', `${protocol}://localhost:${message.port}/length`, asyncReq)
                xhr.onload = function () {
                  if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                      responseText = xhr.responseText
                    }
                    resolve()
                  }
                }
                xhr.send(' \n{  "message":  "hello" }  \r\n')
              }
            })
          })
          expect(responseText).to.equal('30')
        } finally {
          child.kill()
        }
      })
    })
  })
})

describe('XMLHttpRequest unauthorized request', () => {
  const serverScriptPath = ospath.join(__dirname, 'server.js')
  const serverArgs = ['--ssl']
  it('XMLHttpRequest synchronous unauthorized request should be rejected', async () => {
    setRejectUnauthorized(false)
    const child = childProcess.fork(serverScriptPath, serverArgs)
    try {
      child.on('message', async message => {
        if (message && message.port) {
          const xhr = new XMLHttpRequest()
          try {
            xhr.open('POST', `https://localhost:${message.port}/echo`, false)
            xhr.send('ping! "from client"')
            expect.fail('Request should not succeed!')
          } catch (err) {
            expect(err.message).to.equal('{"code":"CERT_HAS_EXPIRED"}')
          }
        }
      })
    } finally {
      child.kill()
    }
  })
  it('XMLHttpRequest asynchronous unauthorized request should be rejected', async () => {
    setRejectUnauthorized(false)
    const child = childProcess.fork(serverScriptPath, serverArgs)
    try {
      await new Promise((resolve, reject) => {
        child.on('message', async message => {
          if (message && message.port) {
            const xhr = new XMLHttpRequest()
            xhr.open('POST', `https://localhost:${message.port}/echo`, true)
            xhr.onload = function () {
              if (xhr.readyState === 4) {
                resolve({ })
              }
            }
            xhr.onerror = function (e) {
              reject(e.error)
            }
            xhr.send('ping! "from client"')
          }
        })
      })
      expect.fail('Request should not succeed!')
    } catch (err) {
      expect(err.code).to.equal('CERT_HAS_EXPIRED')
      expect(err.message).to.equal('certificate has expired')
    } finally {
      child.kill()
    }
  })
})
