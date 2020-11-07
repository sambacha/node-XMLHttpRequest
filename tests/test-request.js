const ospath = require('path')
const childProcess = require('child_process')
const fs = require('fs')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
chai.use(dirtyChai)
const expect = chai.expect
const XMLHttpRequest = require('../lib/XMLHttpRequest').XMLHttpRequest

;[true, false].forEach((asyncReq) => {
  describe(`XMLHttpRequest ${asyncReq ? 'async' : 'sync'} request`, () => {
    const serverScriptPath = ospath.join(__dirname, 'server.js')
    it('should get resource', async () => {
      const child = childProcess.fork(serverScriptPath)
      try {
        let data = ''
        await new Promise((resolve) => {
          child.on('message', message => {
            if (message && message.port) {
              const xhr = new XMLHttpRequest()
              xhr.open('GET', `http://localhost:${message.port}`, asyncReq)
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
      const child = childProcess.fork(serverScriptPath)
      try {
        let response
        await new Promise((resolve) => {
          child.on('message', message => {
            if (message && message.port) {
              const xhr = new XMLHttpRequest()
              xhr.open('GET', `http://localhost:${message.port}/cat.png`, asyncReq)
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
      const child = childProcess.fork(serverScriptPath)
      try {
        let responseText = ''
        await new Promise((resolve) => {
          child.on('message', message => {
            if (message && message.port) {
              const xhr = new XMLHttpRequest()
              xhr.open('POST', `http://localhost:${message.port}/echo`, asyncReq)
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
      const child = childProcess.fork(serverScriptPath)
      try {
        let responseText = ''
        await new Promise((resolve) => {
          child.on('message', message => {
            if (message && message.port) {
              const xhr = new XMLHttpRequest()
              xhr.open('POST', `http://localhost:${message.port}/length`, asyncReq)
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
