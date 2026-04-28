const fs = require('fs');
const path = require('path');

const categories = ['women', 'men', 'kids', 'baby'];
const baseUrl = 'https://www.uniqlo.com/vn/api/commerce/v1/vi/products/query';

async function fetchProducts() {
    const allData = {};
    for (const catName of categories) {
        console.log(`Fetching ${catName}...`);
        try {
            const url = `${baseUrl}?categoryCode=${catName}&pageSize=24&pageOffset=0&httpQualifiers=true`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                allData[catName] = data.result.items || data;
            } catch (e) {
                console.error(`Failed to parse JSON for ${catName}. Status: ${response.status}. Response starts with: ${text.substring(0, 100)}`);
            }
        } catch (error) {
            console.error(`Error fetching ${cat}:`, error.message);
        }
    }
    
    const outputPath = path.join(__dirname, 'raw_uniqlo_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
    console.log(`Saved raw data to ${outputPath}`);
}

fetchProducts();
