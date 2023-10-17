const { default: axios } = require("axios");
import { Alchemy, Network } from "alchemy-sdk";

const config = {
  apiKey: "TMbUqfFKq008ZyBmPSc6gLKw1s-oUQnX",
  network: Network.ETH_MAINNET,
};
async function getPNL(vr) {
  var txs = [];

  if (vr.data.Analysis.Sales.length) {
    const pmatchedContractAddress = {};
    const pmatchedTokenId = {};
    const mmatchedContractAddress = {};
    const mmatchedTokenId = {};
    Promise.all(
      vr.data.Analysis.Sales.map(async (sale) => {
        const tokenId = sale.tokenId;
        if (vr.data.Analysis.Purchases.length) {
          vr.data.Analysis.Purchases.map(async (purchase) => {
            if (
              purchase.tokenId === tokenId &&
              purchase.contract_address === sale.contract_address
            ) {
              pmatchedContractAddress[purchase.contract_address] = true;
              pmatchedTokenId[purchase.tokenId] = true;
              txs.push({
                category: "sold",
                tokenId: tokenId,
                tx_hash: sale.tx_hash,
                contract_address: purchase.contract_address,
                purchase_value: purchase.amount,
                sell_value: sale.amount,
                tokensymbol_sale: sale.tokensymbol,
                tokensymbol_purchase: purchase.tokensymbol,
                pnl: sale.amount - purchase.amount,
                sale_timestamp: sale.timestamp,
                purchase_timestamp: purchase.timestamp,
              });
            }
          });
        }
        if (vr.data.Analysis.Mints.length) {
          Promise.all(
            vr.data.Analysis.Mints.map(async (mint) => {
              if (
                mint.tokenId === tokenId &&
                sale.contract_address === mint.contract_address
              ) {
                mmatchedContractAddress[mint.contract_address] = true;
                mmatchedTokenId[mint.tokenId] = true;
                if (!mint.ERC20.length) {
                  txs.push({
                    category: "sold",
                    tokenId: tokenId,
                    contract_address: sale.contract_address,
                    tx_hash: sale.tx_hash,
                    mint_value: mint.value,
                    sell_value: sale.amount,
                    tokensymbol_sale: sale.tokensymbol,
                    pnl: sale.amount - mint.value,
                    sale_timestamp: sale.timestamp,
                    mint_timestamp: mint.timestamp,
                  });
                } else {
                  txs.push({
                    category: "sold",
                    tokenId: tokenId,
                    contract_address: sale.contract_address,
                    tx_hash: sale.tx_hash,
                    mint_value: mint.ERC20.map((tk) => tk.value),
                    tokenlogo: mint.ERC20.map((tk) => tk.logo),
                    tokensymbol_sale: sale.tokensymbol,
                    tokensymbol_mint: mint.ERC20.map((tk) => tk.token),
                    sell_value: sale.amount,
                    tokensymbol_sale: sale.tokensymbol,
                    pnl: sale.amount - mint.value,
                    sale_timestamp: sale.timestamp,
                    mint_timestamp: mint.timestamp,
                  });
                }
              }
            })
          );
        }
      })
    );
    vr.data.Analysis.Purchases.map((purchase) => {
      if (!pmatchedContractAddress[purchase.contract_address]) {
        txs.push({
          category: "hold",
          tokenId: purchase.tokenId,
          tx_hash: purchase.tx_hash,
          contract_address: purchase.contract_address,
          purchase_value: purchase.amount,
          tokensymbol: purchase.tokensymbol,
          purchase_timestamp: purchase.timestamp,
          floorprice: purchase.floorprice,
          unrealised_pnl: purchase.floorprice - purchase.amount,
        });
      } else {
        if (!pmatchedTokenId[purchase.contract_address]) {
          txs.push({
            category: "hold",
            tokenId: purchase.tokenId,
            tx_hash: purchase.tx_hash,
            contract_address: purchase.contract_address,
            purchase_value: purchase.amount,
            purchase_timestamp: purchase.timestamp,
            tokensymbol: purchase.tokensymbol,
            floorprice: purchase.floorprice,
            unrealised_pnl: purchase.floorprice - purchase.amount,
          });
        }
      }
    });

    vr.data.Analysis.Mints.map((mint) => {
      if (!mmatchedContractAddress[mint.contract_address]) {
        txs.push({
          category: "hold",
          tokenId: mint.tokenId,
          tx_hash: mint.tx_hash,
          contract_address: mint.contract_address,
          mint_value: mint.value,
          mint_timestamp: mint.timestamp,
          floorprice: mint.floorprice,
          unrealized_pnl: mint.floorprice - mint.value,
        });
      } else {
        if (!mmatchedTokenId[mint.contract_address]) {
          txs.push({
            category: "hold",
            tokenId: mint.tokenId,
            tx_hash: mint.tx_hash,
            contract_address: mint.contract_address,
            mint_value: mint.value,
            mint_timestamp: mint.timestamp,
            floorprice: mint.floorprice,
            unrealized_pnl: mint.floorprice - mint.value,
          });
        }
      }
    });
  }
  return txs;
}

export default async function handler(req, res) {
  const { method } = req;
  const { wallet } = req.query;
  const { token } = req.query;

  switch (method) {
    case "GET":
      const vr = await axios.get(
        `http://localhost:3000/api/nft?wallet=${wallet}&token=${token}`
      );
      const rep = await getPNL(vr);
      res.status(200).json({ rep });
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
