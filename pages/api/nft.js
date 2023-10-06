import { Alchemy, Network } from "alchemy-sdk";

const config = {
  apiKey: "TMbUqfFKq008ZyBmPSc6gLKw1s-oUQnX",
  network: Network.ETH_MAINNET,
};

async function getSales(wallet, token, alchemy) {
  const SELL = [];
  const ERC20 = [];
  const sells = await alchemy.core.getAssetTransfers({
    toBlock: "latest",
    fromAddress: wallet,
    contractAddresses: [token],
    withMetadata: true,
    category: ["ERC721", "ERC1155", "ERC20"],
  });

  await Promise.all(
    sells.transfers.map(async (sold) => {
      const txhash = sold.hash;
      const tx = await alchemy.transact.getTransaction(txhash);
      const block = await alchemy.core.getBlock(tx.blockNumber);
      const timestamp = block.timestamp;
      const value = parseInt(tx.value._hex, 16) / 10 ** 18;
      const recpt = await alchemy.core.getTransactionReceipt(txhash);
      const res = recpt.logs.filter((transaction) => {
        return transaction.topics.includes(
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        );
      });

      await Promise.all(
        res.map(async (tken) => {
          if (tken.address !== token) {
            const tokenmeta = await alchemy.core.getTokenMetadata(tken.address);
            const decimals = tokenmeta.decimals;
            const logo = tokenmeta.logo;
            const symbol = tokenmeta.symbol;
            const value = parseInt(tken.data) / 10 ** decimals;
            ERC20.push({
              symbol: symbol,
              logo: logo,
              value: value,
            });
          }
        })
      );

      SELL.push({
        tokenId: parseInt(sold.tokenId, 16),
        txhash: txhash,
        value: value,
        timestamp: timestamp,
        ERC20: ERC20,
      });
    })
  );

  return SELL;
}

async function getMints(wallet, token, alchemy) {
  const MINTS = [];
  const ERC20 = [];

  const nftdata = {
    contractAddresses: [token],
    tokenType: ["ERC721", "ERC1155", "ERC20"],
  };

  const mints = await alchemy.nft.getMintedNfts(wallet, nftdata);

  await Promise.all(
    mints.nfts.map(async (nft) => {
      const txhash = nft.transactionHash;
      const tx = await alchemy.transact.getTransaction(txhash);
      const block = await alchemy.core.getBlock(tx.blockNumber);
      const timestamp = block.timestamp;
      const value = parseInt(tx.value._hex, 16) / 10 ** 18;
      const recpt = await alchemy.core.getTransactionReceipt(txhash);
      const res = recpt.logs.filter((transaction) => {
        return transaction.topics.includes(
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        );
      });
      await Promise.all(
        res.map(async (tken) => {
          if (tken.address !== token) {
            const tokenmeta = await alchemy.core.getTokenMetadata(tken.address);
            const decimals = tokenmeta.decimals;
            const logo = tokenmeta.logo;
            const symbol = tokenmeta.symbol;
            const value = parseInt(tken.data) / 10 ** decimals;
            ERC20.push({
              symbol: symbol,
              logo: logo,
              value: value,
            });
          }
        })
      );

      MINTS.push({
        tokenId: nft.tokenId,
        txhash: nft.transactionHash,
        value: value,
        timestamp: timestamp,
        ERC20: ERC20,
      });
    })
  );

  return MINTS;
}

async function getPurchases(wallet, token, alchemy) {
  const BUY = [];
  const ERC20 = [];

  const buys = await alchemy.core.getAssetTransfers({
    toBlock: "latest",
    toAddress: wallet,
    contractAddresses: [token],
    withMetadata: true,
    category: ["ERC721", "ERC1155", "ERC20"],
  });

  await Promise.all(
    buys.transfers.map(async (txn) => {
      const txHash = txn.hash;
      console.log(txn.from);
      if (txn.from !== "0x0000000000000000000000000000000000000000") {
        const tx = await alchemy.transact.getTransaction(txHash);
        const block = await alchemy.core.getBlock(tx.blockNumber);
        const recpt = await alchemy.core.getTransactionReceipt(txHash);
        const res = recpt.logs.filter((transaction) => {
          return transaction.topics.includes(
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
          );
        });
        await Promise.all(
          res.map(async (tken) => {
            if (tken.address !== token) {
              const tokenmeta = await alchemy.core.getTokenMetadata(
                tken.address
              );
              const decimals = tokenmeta.decimals;
              const logo = tokenmeta.logo;
              const symbol = tokenmeta.symbol;
              const value = parseInt(tken.data) / 10 ** decimals;
              ERC20.push({
                symbol: symbol,
                logo: logo,
                value: value,
              });
            }
          })
        );

        const timestamp = block.timestamp;
        const value = parseInt(tx.value._hex, 16) / 10 ** 18;
        BUY.push({
          tokenId: parseInt(txn.tokenId, 16),
          txhash: txHash,
          value: value,
          timestamp: timestamp,
          ERC20: ERC20,
        });
      }
    })
  );

  return BUY;
}

export default async function handler(req, res) {
  const { method } = req;
  const { wallet } = req.query;
  const { token } = req.query;

  switch (method) {
    case "GET":
      const alchemy = new Alchemy(config);
      try {
        const SELL = await getSales(wallet, token, alchemy);
        const MINTS = await getMints(wallet, token, alchemy);
        const BUY = await getPurchases(wallet, token, alchemy);

        const Analysis = {
          Sales: SELL,
          Mints: MINTS,
          Purchases: BUY,
        };
        res.status(200).json({
          Analysis,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred." });
      }
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
