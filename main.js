// .env 에서 불러오기 위함

require("dotenv").config();
const request = require('request')
const uuid = require("uuid")
const crypto = require('crypto')
const sign = require('jsonwebtoken').sign
const queryEncode = require("querystring").encode

// .env 파일에서 불러옴 (이건 깃에 안올립니다)
const access_key = process.env.UPBIT_OPEN_API_ACCESS_KEY
const secret_key = process.env.UPBIT_OPEN_API_SECRET_KEY
const server_url = process.env.UPBIT_OPEN_API_SERVER_URL



const body = {
    txid: 'upbitac5c35c5ce3b4806b56a3ac55e201b9ab9aab49b78b44536bd416a4f669'  // 조회할 거래 id값을 여기다 넣으면 됩니다.
}

const query = queryEncode(body)

const hash = crypto.createHash('sha512')
const queryHash = hash.update(query, 'utf-8').digest('hex')

const payload = {
    access_key: access_key,
    nonce: uuid.v4(),
    query_hash: queryHash,
    query_hash_alg: 'SHA512',
}

const token = sign(payload, secret_key)

const options = {
    method: "GET",
    url: server_url + "/v1/deposit?" + query,
    headers: {Authorization: `Bearer ${token}`},
    json: body
}

request(options, (error, response, body) => {
    if (error) throw new Error(error)
    console.log(body)
})