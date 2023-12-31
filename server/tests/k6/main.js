import { group, check, sleep } from 'k6'
import http from 'k6/http'

const SERVER_HOST= 'unshorten-site:8443'
const SERVER_ENDPOINT= `https://${SERVER_HOST}/api/v1`
const {
  UNSHORTEN_ADMIN_LOGIN,
  UNSHORTEN_ADMIN_PASSWORD,
} = __ENV

function checkAndLog(v, checks) {
	try {
	if (!check(v, checks)) {
		console.warn("check failed on", JSON.stringify(v))
	}
	} catch (err) {
		console.error(`error thrown on check: ${err}`)
		console.warn("check failed on", JSON.stringify(v))
	}
}

/**
 * Test options.
 * https://k6.io/docs/using-k6/k6-options/
 */
export const options = {
	setupTimeout: '60s',
	thresholds: { checks: ['rate==1.0'] },
	scenarios: {
	default: {
		executor: 'per-vu-iterations',
		vus: 1,
		iterations: 1
		}
	},
	tlsVersion: {
		min: http.TLS_1_2,
	},
}

const urls = Object.keys(JSON.parse(open('/etc/urls.json'))).map(k => `http://static-url-shortner:3000/${k}`)

/**
 * Setup function before VUs iterations.
 * @link https://k6.io/docs/using-k6/test-lifecycle/
 */
export function setup () {
	while (true) {
		let response = http.get("http://static-url-shortner:3000/health")
		if (response.status !== 200) {
			sleep(3)
			continue
		}

		response = http.get(`https://${UNSHORTEN_ADMIN_LOGIN}:${UNSHORTEN_ADMIN_PASSWORD}@${SERVER_HOST}/admin/health`)
		if (response.status !== 200) {
			sleep(3)
			continue
		}

		break
	}
}

/**
 * Virtual User iteration.
 * @link https://k6.io/docs/using-k6/test-lifecycle/
 */
export default function () {
	group('GET /unshorten/{url}', () => {
		group('nonexistent URL', () => {
			const response = http.get(`${SERVER_ENDPOINT}/unshorten/http://nonexistent.example.com/service`)
			checkAndLog(response, {
				'status code is 400': (r) => r.status === 400,
				'body contains an error': (r) => r.json().error === 'error sending request for url (http://nonexistent.example.com/service): error trying to connect: dns error: failed to lookup address information: Name or service not known'
			})
		})

		group('invalid URL', () => {
			const response = http.get(`${SERVER_ENDPOINT}/unshorten/invalid.example.com/service`)
			checkAndLog(response, {
				'status code is 400': (r) => r.status === 400,
				'body contains an error': (r) => r.json().error === 'builder error: relative URL without a base'
			})
		})

		group('valid URL', () => {
			const response = http.get(`${SERVER_ENDPOINT}/unshorten/${urls[0]}`)
			checkAndLog(response, {
				'status code is 200': (r) => r.status === 200,
				'body contains an url': (r) => r.json().url !== urls[0]
			})
		})
	})

	group('POST /unshorten', () => {
		const requestBody = {
			urls: [
				`invalid.example.com/service`,
				urls[0],
				urls[1],
				`http://nonexistent.example.com/service`,
			]
		}

		const response = http.post(`${SERVER_ENDPOINT}/unshorten`, JSON.stringify(requestBody), {
			headers: {
				'Content-Type': 'application/json'
			}
		})

		checkAndLog(response, {
			'status code is 200': (r) => r.status === 200,
			'body contains 4 results': (r) => r.json().results.length === 4,
			'first result is an error': (r) => r.json().results[0].error === 'builder error: relative URL without a base',
			'second result is ok': (r) => r.json().results[1].url === 'https://www.negrel.dev/index.html',
			'third result is ok': (r) => r.json().results[2].url === 'https://qtl.ink/index.html',
			'forth result is an error': (r) => r.json().results[3].error === 'error sending request for url (http://nonexistent.example.com/service): error trying to connect: dns error: failed to lookup address information: Name or service not known',
		})
	})
}

/**
 * Tear down tests.
 * @link https://k6.io/docs/using-k6/test-lifecycle/
 */
export function teardown () {}

