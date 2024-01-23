import dotenv from 'dotenv';
dotenv.config();
import * as bitcoin from 'bitcoinjs-lib';
import axios from "axios";
import {ECPairFactory} from "ecpair";

async function buildTransferTx() {
    const network = bitcoin.networks.testnet;

    const tinysecp = require('tiny-secp256k1');
    const ECPair = ECPairFactory(tinysecp);

    const keyPair = ECPair.fromWIF(process.env.BITCOIN_PRIVATE_KEY ?? '', network);
    const pubKeyHash = bitcoin.crypto.hash160(keyPair.publicKey).toString('hex')

    //hash of previous tx to
    const txHash = '55e54aca345f5a56f2b7f827184f69942de45f1968b34d7cac8c36f6814f2fbf';
    //output index to spend
    const txIndex = 0;

    let tx = new bitcoin.Psbt({network:bitcoin.networks.testnet})
    tx.addInput({
        hash: txHash,
        index: txIndex,
        witnessUtxo: {
            script: Buffer.from('0014' + pubKeyHash, 'hex'),
            value: 10000, //0.1 btc
        },
    })
    tx.addOutput({
        address: 'tb1q6kc0gt0f6wce980jw9x449wl4l8erqx72p5jvm',
        value: 7000
    })
    await tx.signAllInputsAsync(keyPair)
    tx.finalizeAllInputs()
    return tx.extractTransaction(true).toHex()
}

async function sendBTCTransaction(){
    const tx = await buildTransferTx()
    const network = 'BTC-T'
    const resp = await axios.post(
        `${process.env.API_PROVIDER_URL}/integrations/gateway-svc/v1/network/${network}/tx`,
        {
            data: {
                id: "string",
                type: "encoded_tx",
                attributes: {
                    tx: tx,
                },
            },
        },
    )
    console.log(resp.data)
}

(async () => {
    try {
        await sendBTCTransaction()
    } catch (e) {
        console.error(`[ERROR] ${e}`)
    }
})()

