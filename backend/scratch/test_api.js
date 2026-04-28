
const testUrls = [
    { url: 'https://www.uniqlo.com/vn/api/commerce/v1/vi/products/query?categoryCode=4221&pageSize=1', method: 'GET' },
    { url: 'https://www.uniqlo.com/vn/api/commerce/v1/vi/products/query', method: 'POST', body: JSON.stringify({ categoryCode: '4221', pageSize: 1 }) }
];

async function test() {
    for (const test of testUrls) {
        console.log(`Testing ${test.method} ${test.url}...`);
        try {
            const response = await fetch(test.url, {
                method: test.method,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: test.body
            });
            console.log(`Status: ${response.status}`);
            if (response.status === 200) {
                const text = await response.text();
                console.log(`Response starts with: ${text.substring(0, 100)}`);
            }
        } catch (e) {
            console.error(`Error: ${e.message}`);
        }
    }
}

test();
