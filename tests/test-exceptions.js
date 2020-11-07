const chai = require('chai')
const dirtyChai = require('dirty-chai')
const os = require('os')
chai.use(dirtyChai)
const expect = chai.expect
const osplatform = os.platform()
const XMLHttpRequest = require('../lib/XMLHttpRequest').XMLHttpRequest
const xhr = new XMLHttpRequest()

describe('XMLHttpRequest exceptions', () => {
  it('should throw an exception if method TRACK is used', () => {
    expect(() => xhr.open('TRACK', 'http://localhost:8000/')).to.throw('SecurityError: Request method not allowed')
  })
  it('should throw an exception if method TRACE is used', () => {
    expect(() => xhr.open('TRACE', 'http://localhost:8000/')).to.throw('SecurityError: Request method not allowed')
  })
  it('should throw an exception if method CONNECT is used', () => {
    expect(() => xhr.open('CONNECT', 'http://localhost:8000/')).to.throw('SecurityError: Request method not allowed')
  })
  it('should not throw an exception if method GET is used', () => {
    expect(() => xhr.open('GET', 'http://localhost:8000/')).to.not.throw()
  })
  it('should not add forbidden request headers', () => {
    // Test forbidden headers
    const forbiddenRequestHeaders = [
      'accept-charset',
      'accept-encoding',
      'access-control-request-headers',
      'access-control-request-method',
      'connection',
      'content-length',
      'content-transfer-encoding',
      'cookie',
      'cookie2',
      'date',
      'expect',
      'host',
      'keep-alive',
      'origin',
      'referer',
      'te',
      'trailer',
      'transfer-encoding',
      'upgrade',
      'via'
    ]
    for (const i in forbiddenRequestHeaders) {
      const headerKey = forbiddenRequestHeaders[i]
      xhr.setRequestHeader(headerKey, 'Test')
      // should ignore forbidden request headers and log a warning
      expect(xhr.getRequestHeader(headerKey)).to.equal('')
    }
  })
  it('should add a valid request header', () => {
    xhr.setRequestHeader('X-Foobar', 'Test')
    expect(xhr.getRequestHeader('X-Foobar')).to.equal('Test')
  })
  // Windows has a "long" timeout (> 2s) on DNS resolution
  if (osplatform !== 'win32') {
    it('should throw an exception on DNS resolution failure (sync)', () => {
      const url = 'http://nodns/'
      expect(() => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', url, false)
        xhr.send()
      }).to.throw('Failed to execute \'send\' on \'XMLHttpRequest\': Failed to load \'http://nodns/\'.')
    })
    it('should throw an exception on DNS resolution failure (async)', async () => {
      const url = 'http://nodns/'
      const xhr = new XMLHttpRequest()
      try {
        await new Promise((resolve, reject) => {
          xhr.open('GET', url, true)
          xhr.onload = function () {
            if (xhr.readyState === 4) {
              resolve({})
            }
          }
          xhr.onerror = function () {
            // responseText and response should be empty
            reject(new Error('Error while executing the query'))
          }
          xhr.send()
        })
        expect.fail('should throw an exception on DNS resolution failure')
      } catch (err) {
        expect(err.message).to.equal('Error while executing the query')
      }
    })
  }
})

/*
// Test forbidden headers
const forbiddenRequestHeaders = [
  'accept-charset',
  'accept-encoding',
  'access-control-request-headers',
  'access-control-request-method',
  'connection',
  'content-length',
  'content-transfer-encoding',
  'cookie',
  'cookie2',
  'date',
  'expect',
  'host',
  'keep-alive',
  'origin',
  'referer',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'user-agent',
  'via'
]

for (let i in forbiddenRequestHeaders) {
  try {
    const headerKey = forbiddenRequestHeaders[i]
    xhr.setRequestHeader(headerKey, 'Test')
    // should ignore forbidden request headers and log a warning
    assert.strictEqual(xhr.headers[headerKey], undefined)
  } catch (e) {
  }
}

// Try valid header
xhr.setRequestHeader('X-Foobar', 'Test')

console.log('Done')
*/
