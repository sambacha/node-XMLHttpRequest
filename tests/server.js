const getPort = require('get-port')
const http = require('http')
const https = require('https')
const fs = require('fs')
const ospath = require('path')

;(async () => {
  const options = {
    key: fs.readFileSync('tests/keys/server.key'),
    cert: fs.readFileSync('tests/keys/server.cert')
  }
  const args = process.argv.slice(2)
  const ssl = args && args[0] === '--ssl'
  const port = await getPort()
  const server = (ssl ? https : http).createServer(options, function (req, res) {
    if (req.url === '/length' && req.method === 'POST') {
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      })
      res.end(req.headers['content-length'])
    } else if (req.url === '/echo' && req.method === 'POST') {
      let data = ''
      req.on('data', chunk => {
        data += chunk.toString()
      })
      req.on('end', () => {
        res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(data)
        })
        res.end(data)
      })
    } else if (req.url === '/cat.png') {
      const buffer = fs.readFileSync(ospath.join(__dirname, 'cat.png'))
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': buffer.byteLength
      })
      res.write(buffer)
      res.end()
    } else {
      const body = 'Hello World'

      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(body)
      })
      res.write(body)
      res.end()
    }
    this.close()
  }).listen(port, () => {
    process.send({ port: port })
  })
  await new Promise((resolve) => {
    server.on('close', () => {
      process.send({ event: 'serverClosed' })
      resolve()
    })
  })
})()
