
const axios = require('axios');

async function testPost() {
    const url = 'https://www.uniqlo.com/vn/api/commerce/v1/vi/products/query';
    const body = {
        categoryCode: '4221',
        pageSize: 1,
        pageOffset: 0
    };
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    try {
        console.log('Testing POST...');
        const response = await axios.post(url, body, { headers });
        console.log('POST Success:', response.status);
        console.log(JSON.stringify(response.data).substring(0, 500));
    } catch (e) {
        console.log('POST Failed:', e.response ? e.response.status : e.message);
    }

    try {
        console.log('\nTesting GET...');
        const getUrl = `${url}?categoryCode=4221&pageSize=1`;
        const getResponse = await axios.get(getUrl, { headers });
        console.log('GET Success:', getResponse.status);
    } catch (e) {
        console.log('GET Failed:', e.response ? e.response.status : e.message);
    }
}

testPost();
