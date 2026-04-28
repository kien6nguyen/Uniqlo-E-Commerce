
async function test() {
    const url = 'https://www.uniqlo.com/vn/api/commerce/v1/vi/products/query';
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    try {
        console.log('Testing POST...');
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                categoryCode: '4221',
                pageSize: 1,
                pageOffset: 0
            })
        });
        console.log('POST Status:', response.status);
        const text = await response.text();
        console.log('POST Response:', text.substring(0, 500));
    } catch (e) {
        console.log('POST Error:', e.message);
    }

    try {
        console.log('\nTesting GET...');
        const getUrl = `${url}?categoryCode=4221&pageSize=1`;
        const response = await fetch(getUrl, { headers });
        console.log('GET Status:', response.status);
        const text = await response.text();
        console.log('GET Response:', text.substring(0, 500));
    } catch (e) {
        console.log('GET Error:', e.message);
    }
}

test();
