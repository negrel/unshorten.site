import http from 'node:http'

import urlMap from './urls.json' assert { type: "json" }

const server = http.createServer((req, res) => {
	const parsedUrl = new URL(req.url, `http://${req.headers.host}`)

	if (urlMap[parsedUrl.pathname.slice(1)]) {
		const originalUrl = urlMap[parsedUrl.pathname.slice(1)]
		res.writeHead(301, { Location: originalUrl })
		res.end()
	} else if (parsedUrl.pathname == "/health") {
		res.writeHead(200)
		res.end()
	} else {
		res.writeHead(404, { 'Content-Type': 'text/plain' })
		res.end('Not Found')
	}
})

const PORT = 3000
server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`)
})

// Handle SIGINT signal (CTRL+C)
process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Exiting...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
