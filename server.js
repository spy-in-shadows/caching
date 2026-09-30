const fs = require('node:fs');
const path = require('node:path')
const express = require('express')

const app = express()
const filePath = path.join(__dirname, "db.json");

const delayReadData = async () => {
    await new Promise((res, rej) => {
        setTimeout(() => {}, 1500)
    })
    return await readData();
};

let cache = {};



async function readData(){
    let data = fsPromise.readFile(filePath, 'utf-8');
    return JSON.parse(data)
}

app.get('/products', async (req, res) => {
    let key = req.url;
    let value = cache[key];

    try{
        if (value){
            return res.json(value);
        }
        let products = await delayReadData()
        cache[key] = products;
        res.send(products)
    }catch(err){
        res.send(err)
    }
});

app.get('/products/:id', async (req, res) => {
    try{
        let products = await delayReadData()
        let data = products.find(p => p.id === parseInt(req.params.id))
        res.send(data)
    }catch(err){
        res.send(err)
    }
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});