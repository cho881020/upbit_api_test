// .env 에서 불러오기 위함

require("dotenv").config();
const request = require('request')
const uuid = require("uuid")
const crypto = require('crypto');
const { default: axios } = require("axios");
const sign = require('jsonwebtoken').sign
const queryEncode = require("querystring").encode

// .env 파일에서 불러옴 (이건 깃에 안올립니다)
const access_key = process.env.UPBIT_OPEN_API_ACCESS_KEY
const secret_key = process.env.UPBIT_OPEN_API_SECRET_KEY
const server_url = process.env.UPBIT_OPEN_API_SERVER_URL


// 업비트에 가기 전에, 만약에 이미 등록된 (관리자가 승인한 적이 있는) 거래 ID라면 막아야할거같아여

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

    // 거래에 대한 정보가 들어있습니다. 시간, 수량, 상태값이 중요한 정보일거 같아요.
    console.log(body)

    let time = body.created_at // 거래가 생성된 (그니까 송금을 시도한) 시간
    let amount = body.amount // 보내준 갯수
    console.log(time)
    console.log(amount)

    // 코인을 보내줬다면, 그게 신청한 금액과 맞는지를 검토해야 합니다.
    // 이건 아마 KRW 상품에서만 필요한 로직 같긴 합니다.
    axios.get('https://api.upbit.com/v1/candles/minutes/1',
        {
            params : {
                market: 'KRW-BTC',
                count: 1,
                to: time  // 돈을 보낸 시점에서의 시세를 확인합니다.
            }
        }
    )
        .then( (response) => {
            console.log(response.data)
            let high_price = response.data[0].high_price // 보낸 시점의 가능한 시세 중, 제일 높은값으로 채택합니다.

            let krw_amount = body.amount * high_price  // 그래서 얼마를 보낸건지 확인합니다.

            console.log( krw_amount ) // 계산된 금액이, 신청금액과 +-0.1% (가안) 이내로 차이난다면 승인해주는걸로 하면 될것 같습니다. 그 이상 벌어져있다면 거절하구요.
        } )
})