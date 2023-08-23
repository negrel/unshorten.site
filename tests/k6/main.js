import { group, check } from 'k6'
import http from 'k6/http'

const SERVER_ENDPOINT= 'http://unshorten-site:8080/api/v1'

/**
 * Test options.
 * https://k6.io/docs/using-k6/k6-options/
 */
export const options = {
	thresholds: { checks: ['rate==1.0'] },
	scenarios: {
	default: {
		executor: 'per-vu-iterations',
		vus: 1,
		iterations: 1
		}
	}
}

const urls = Object.keys(JSON.parse(open('/etc/urls.json'))).map(k => `http://static-url-shortner:3000/${k}`)

/**
 * Setup function before VUs iterations.
 * @link https://k6.io/docs/using-k6/test-lifecycle/
 */
export function setup () {}

/**
 * Virtual User iteration.
 * @link https://k6.io/docs/using-k6/test-lifecycle/
 */
export default function () {
	group('GET /unshorten/{url}', () => {
		group('nonexistent URL', () => {
			const response = http.get(`${SERVER_ENDPOINT}/unshorten/http://nonexistent.example.com/service`)
			check(response, {
				'status code is 400': (r) => r.status === 400,
				'body contains an error': (r) => r.json().error === 'error sending request for url (http://nonexistent.example.com/service): error trying to connect: dns error: failed to lookup address information: Name or service not known'
			})
		})

		group('invalid URL', () => {
			const response = http.get(`${SERVER_ENDPOINT}/unshorten/invalid.example.com/service`)
			check(response, {
				'status code is 400': (r) => r.status === 400,
				'body contains an error': (r) => r.json().error === 'builder error: relative URL without a base'
			})
		})

		group('valid URL', () => {
			const response = http.get(`${SERVER_ENDPOINT}/unshorten/${urls[0]}`)
			check(response, {
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

		check(response, {
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

