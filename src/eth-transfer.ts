import dotenv from 'dotenv';
dotenv.config();
import {Wallet, JsonRpcProvider, parseEther, Transaction, TransactionLike, hexlify} from "ethers";
import axios from "axios";

async function buildTransferTx() {
    //Infura doesn't support holesky yet, using public node as provider
    const provider = new JsonRpcProvider('https://ethereum-holesky.publicnode.com');
    const privateKey = process.env.ETHEREUM_PRIVATE_KEY ?? '';

    const wallet = new Wallet(privateKey, provider);
    const fromAddress = await wallet.getAddress();

    const nonce = await provider.getTransactionCount(fromAddress);
    const transaction = {
        nonce: nonce,
        to: '0x0D9acB015B1388052c7253FE228e1F8DF856F955',
        value: parseEther('0.1'),
        data: "0x", //just for transfer
        gasLimit: 21000,
    };

    const populatedTx = await wallet.populateTransaction(transaction);
    delete populatedTx.from;
    const txObj = Transaction.from(populatedTx);
    return wallet.signTransaction(txObj);
}

async function sendETHTransaction(){
    const tx = await buildTransferTx()
    const network = 'ETH-T'
    const resp = await axios.post(
        // `${process.env.API_PROVIDER_URL}/integrations/gateway-svc/v1/network/${network}/tx`,
        `https://api.stage.sentry.tokend.io/integrations/gateway-svc/v1/network/${network}/tx`,
        {
            data: {
                id: "holesky",
                type: "encoded_tx",
                attributes: {
                    tx: tx.slice(2), //trim 0x
                },
            },
        },
    )

    console.log(resp.data);
}

(async () => {
    try {
        await sendETHTransaction()
    } catch (e) {
        console.error(`[ERROR] ${e}`)
    }
})()

