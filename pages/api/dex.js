// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fetch from 'node-fetch';
import Decimal from 'decimal.js';
import axios from 'axios';
import BigNumber from 'bignumber.js';


export default function handler(req, res) {
  const { method } = req;

  // Bitquery API endpoint
  const BITQUERY_API_ENDPOINT = 'https://graphql.bitquery.io/';

  const { wallet } = req.query;

  const { token } = req.query;
  // Wallet address
  const WALLET_ADDRESS = wallet;

  // Token contract address
  const TOKEN_ADDRESS = token;

  const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

  const ETH_USDT_PRICE = 2000;


  switch (method) {
    case "GET":



      const SUBGRAPH_URLS = {
        uniswapV2: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
        sushiswap: 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange',
        balancer: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer',
        curve: 'https://api.thegraph.com/subgraphs/name/curvefi/curve'
      };

      const address = '0xE0D4C9D208eeb4B151aF6b4B3BddB3717358CFB4'; // Replace with the Ethereum address you want to check

      const queries = {
        uniswapV2: `
        query {
            swaps(where: { to: "${address}" }) {
                id
                timestamp
                amount0In
                amount1In
                amount0Out
                amount1Out
                pair {
                    token0 {
                        symbol
                    }
                    token1 {
                        symbol
                    }
                }
            }
        }
    `,
        // sushiswap: `...`, // Replace with the appropriate query for SushiSwap
        // balancer: `...`, // Replace with the appropriate query for Balancer
        // curve: `...` // Replace with the appropriate query for Curve
      };

      async function getDEXTrades() {
        const trades = {};

        for (const dex in SUBGRAPH_URLS) {
          try {
            const response = await axios.post(SUBGRAPH_URLS[dex], { query: queries[dex] });
            trades[dex] = response.data.data.swaps;
          } catch (error) {
            console.error(`Error fetching trades from ${dex}: ${error}`);
          }
        }

        return trades;
      }

      getDEXTrades().then(trades => {
        for (const dex in trades) {
          console.log(`Trades from ${dex}:`);
          for (const trade of trades[dex]) {
            console.log(trade);
            console.log(`------------------------`);
          }
        }
      });
      res

      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }

}
