// Import necessary modules
import axios from "axios";
import { uniq } from "underscore";
import csvtojson from "csvtojson";
import fs from "fs/promises";
import jsonWriter from "fs-json-writer";
import path from "path";

const csvFilePath = "./onchain.csv";

async function getTotalPNL(vr, wallet) {
  const result = { Address: wallet, SELL: [], PURCHASED: [], MINT: [] };

  processTransactions(vr.data.Analysis.Sales, result.SELL);
  processTransactions(vr.data.Analysis.Purchases, result.PURCHASED);
  processMints(vr.data.Analysis.Mints, result.MINT);

  console.log(result);
  return result;
}

function processTransactions(transactions, resultArray) {
  const Tokens = [];

  transactions.forEach((transaction) => {
    const token =
      transaction.tokenAddress === "0x0000000000a39bb272e79075ade125fd351887ac"
        ? "BLUR"
        : transaction.tokensymbol;
    Tokens.push(token);
  });

  const tokens = uniq(Tokens);

  tokens.forEach((token) => {
    const tBal = transactions.filter(
      (transaction) =>
        transaction.tokensymbol === token ||
        transaction.tokenAddress ===
          "0x0000000000a39bb272e79075ade125fd351887ac"
    );

    let tokenBal = 0;
    tBal.forEach((amount) => {
      tokenBal += amount.amount;
    });

    resultArray.push({ token, amount: tokenBal });
  });
}

function processMints(mints, resultArray) {
  let mintamountETH = 0;

  mints.forEach((mint) => {
    const temp = {};

    if (mint.ERC20.length === 0) {
      mintamountETH += mint.value;
    } else {
      temp.symbol = mint.ERC20[0].symbol;
      temp.amount = 0;

      mint.ERC20.forEach((tk) => {
        temp.amount += tk.value;
      });
      resultArray.push({ token: temp.symbol, amount: temp.amount });
    }
  });

  resultArray.push({ token: "ETH", amount: mintamountETH });
}

export default async function handler(req, res) {
  const { method } = req;
  const { wallet } = req.query;
  const { token } = req.query;
  switch (method) {
    case "GET":
      const vr = await axios.get(
        `https://pnl-api.vercel.app/api/nft?wallet=${wallet}&token=${token}`
      );
      const result = await getTotalPNL(vr, wallet);
      res.status(200).json(result);
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
