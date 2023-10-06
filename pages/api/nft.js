import Web3 from "web3";
import BigNumber from "bignumber.js";
import { Alchemy, Network } from "alchemy-sdk";
const config = {
    apiKey: "TMbUqfFKq008ZyBmPSc6gLKw1s-oUQnX",
    network: Network.ETH_MAINNET,
};

export default async function handler(req, res) {
    const { method } = req;

    const { wallet } = req.query;

    const { token } = req.query;


    const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';



    switch (method) {
        case "GET":
            const web3 = new Web3(new Web3.providers.HttpProvider('https://eth-mainnet.g.alchemy.com/v2/TMbUqfFKq008ZyBmPSc6gLKw1s-oUQnX'));
            const alchemy = new Alchemy(config);

            const sells = await alchemy.core.getAssetTransfers({
                toBlock: "latest",
                fromAddress: wallet,
                contractAddresses: [token],
                withMetadata: true,
                category: ["erc721"],
            })

            // const sellTxns = sells.transfers.map(async (txn) => {
            //     const txHash = txn.hash

            //     const txnReceipt = await alchemy.core.getTransactionReceipt(txHash)

            //     const trade = {
            //         txHash,
            //         wethAmount: 0,
            //         tokenAmount: 0,
            //     }

            //     for (const log of txnReceipt.logs) {
            //         if (log.topics[0] === TRANSFER_EVENT_SIGNATURE) {
            //             // Decode the ERC-20 Transfer event
            //             const from = '0x' + log.topics[1].slice(26);  // Topics are 32 bytes; Ethereum addresses are 20 bytes
            //             const to = '0x' + log.topics[2].slice(26);
            //             const token = log.address;
            //             const amount = web3.utils.fromWei(web3.utils.toBigInt(log.data), 'ether')  // Amount is stored in the log data

            //             // only count the amount if the to address is not the wallet address

            //             // if (from.toLowerCase() !== wallet.toLowerCase()) return;

            //             if (token.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
            //                 trade.wethAmount = amount
            //             } else {
            //                 trade.tokenAmount = amount
            //             }
            //         }
            //     }

            //     return trade



            // })


            const buys = await alchemy.core.getAssetTransfers({
                toBlock: "latest",
                toAddress: wallet,
                contractAddresses: [token],
                withMetadata: true,
                category: ["erc721"],
            })

            const buyTxns = buys.transfers.map(async (txn) => {
                const txHash = txn.hash
                // hash already exists, skip it 

                const txnReceipt = await alchemy.core.getTransactionReceipt(txHash)
                console.log(txnReceipt)


            })




            res.status(200).json({
                buys,
                sells,
                buyTxns,

            });

            break;
        default:
            res.setHeader("Allow", ["GET"]);
            res.status(405).end(`Method ${method} Not Allowed`);
    }

}
