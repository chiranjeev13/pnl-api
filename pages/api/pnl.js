import axios from "axios";
import _ from "underscore";

async function getTotalPNL(vr) {
  const RESP = {};
  var Tokens = [];
  vr.data.Analysis.Sales.map((sales) => {
    if (sales.tokenAddress === "0x0000000000a39bb272e79075ade125fd351887ac") {
      Tokens.push("BLUR");
    } else {
      Tokens.push(sales.tokensymbol);
    }
  });

  var tokens = _.uniq(Tokens);

  tokens.map((token) => {
    const tBal = vr.data.Analysis.Sales.filter(
      (sales) =>
        sales.tokensymbol === token ||
        sales.tokenAddress === "0x0000000000a39bb272e79075ade125fd351887ac"
    );

    var tokenBal = 0;
    tBal.map((amount) => {
      tokenBal += amount.amount;
    });
    console.log("SELL", token, tokenBal);
  });

  Tokens = [];
  vr.data.Analysis.Purchases.map((purchase) => {
    if (
      purchase.tokenAddress === "0x0000000000a39bb272e79075ade125fd351887ac"
    ) {
      Tokens.push("BlUR");
    } else {
      Tokens.push(purchase.tokensymbol);
    }
  });

  tokens = _.uniq(Tokens);

  tokens.map((token) => {
    const tBal = vr.data.Analysis.Purchases.filter(
      (purchase) =>
        purchase.tokensymbol === token ||
        purchase.tokenAddress === "0x0000000000a39bb272e79075ade125fd351887ac"
    );
    var tokenBal = 0;
    tBal.map((amount) => {
      tokenBal += amount.amount;
    });
    console.log("PURCHASED", token, tokenBal);
  });
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
      getTotalPNL(vr);
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
