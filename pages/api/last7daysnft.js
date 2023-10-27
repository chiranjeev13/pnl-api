import { Alchemy, Network } from "alchemy-sdk";
import axios from "axios";
import Bottleneck from "bottleneck";
const config = {
  apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
  network: Network.ETH_MAINNET,
};
const limiter = new Bottleneck({
  maxConcurrent: 100,
});

async function getSales(wallet, token, alchemy, fromBlock) {
  const SELL = [];
  while (1) {
    var f;
    const contractAddress = token;
    console.log(fromBlock);
    var sales = await alchemy.nft.getNftSales({
      toBlock: "latest",
      fromBlock: fromBlock,
      sellerAddress: wallet,
      pageKey: f,
    });

    if (contractAddress) {
      sales.nftSales = sales.nftSales.filter(
        (nfts) => nfts.contractAddress === contractAddress
      );
    }

    Promise.all(
      sales.nftSales.map(async (sold) => {
        const contract_address = sold.contractAddress;
        const tokenId = sold.tokenId;

        const nftMetadata = await limiter.schedule(async () => {
          return await alchemy.nft.getNftMetadata(contract_address, tokenId);
        });
        const tx_hash = sold.transactionHash;
        const tokensymbol =
          sold.sellerFee.symbol ||
          sold.protocolFee.symbol ||
          sold.royaltyFee.symbol ||
          sold.marketplaceFee.symbol;

        const tokenAddress =
          sold.sellerFee.tokenAddress ||
          sold.protocolFee.tokenAddress ||
          sold.royaltyFee.tokenAddress ||
          sold.marketplaceFee.tokenAddress;

        var blockNumber = sold.blockNumber;
        var s1,
          s2,
          s3 = 0;

        var amount = 0;

        if (sold.sellerFee.amount && sold.sellerFee.decimals) {
          s1 = sold.sellerFee.amount / 10 ** sold.sellerFee.decimals;
          amount += s1;
        }
        if (sold.protocolFee.amount && sold.protocolFee.decimals) {
          s2 = sold.protocolFee.amount / 10 ** sold.protocolFee.decimals;
          amount += s2;
        }
        if (sold.royaltyFee.amount && sold.royaltyFee.decimals) {
          s3 = sold.royaltyFee.amount / 10 ** sold.royaltyFee.decimals;
          amount += s3;
        }

        if (sold.marketplaceFee.amount && sold.marketplaceFee.decimals) {
          amount +=
            sold.marketplaceFee.amount / 10 ** sold.marketplaceFee.decimals;
        }

        if (tokenAddress === "0x0000000000a39bb272e79075ade125fd351887ac") {
          if (sold.sellerFee.amount) {
            s1 = sold.sellerFee.amount / 10 ** 18;
            amount += s1;
          }
          if (sold.protocolFee.amount) {
            s2 = sold.protocolFee.amount / 10 ** 18;
            amount += s2;
          }
          if (sold.royaltyFee.amount) {
            s3 = sold.royaltyFee.amount / 10 ** 18;
            amount += s3;
          }

          if (sold.marketplaceFee.amount) {
            amount += sold.marketplaceFee.amount / 10 ** 18;
          }
        }

        const timestamp = await limiter.schedule(async () => {
          return await alchemy.core.getBlock(parseInt(blockNumber)).timestamp;
        });
        SELL.push({
          contract_address: contract_address,
          tokenId: tokenId,
          tx_hash: tx_hash,
          amount: amount,
          tokensymbol: tokensymbol,
          blockNumber: blockNumber,
          tokenAddress: tokenAddress,
          media: nftMetadata.media,
          timestamp: timestamp,
          floorprice: nftMetadata.contract.openSea.floorPrice,
        });
      })
    );

    if (sales.pageKey === undefined) {
      break;
    }
    f = sales.pageKey;
  }
  return SELL;
}

async function getMints(wallet, token, alchemy, fromBlock) {
  const MINTS = [];
  var pageKey;
  while (1) {
    const nftdata = {
      tokenType: ["ERC721", "ERC1155"],
      pageKey: pageKey,
      ...(token ? { contractAddresses: [token] } : {}),
    };

    const mint = await limiter.schedule(async () => {
      return await alchemy.nft.getMintedNfts(wallet, nftdata);
    });
    console.log(fromBlock);
    const mints = mint.nfts.filter(
      (min) => parseInt(min.blockNumber) >= fromBlock
    );

    console.log(mints);
    if (mints.length) {
      await Promise.all(
        mints.nfts.map(async (nft) => {
          const ERC20 = [];
          try {
            const txhash = nft.transactionHash;
            const tx = await alchemy.transact.getTransaction(txhash);
            const value = parseInt(tx.value._hex, 16) / 10 ** 18;
            const recpt = await alchemy.core.getTransactionReceipt(txhash);
            const res = recpt.logs.filter((transaction) => {
              return transaction.topics.includes(
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
              );
            });

            await Promise.all(
              res.map(async (tken) => {
                if (
                  tken.address.toLowerCase() !==
                  nft.contract.address.toLowerCase()
                ) {
                  // console.log(tken);
                  const tokenmeta = await alchemy.core.getTokenMetadata(
                    tken.address
                  );
                  const decimals = tokenmeta.decimals;
                  const logo = tokenmeta.logo;
                  const symbol = tokenmeta.symbol;
                  const value = parseInt(tken.data) / 10 ** decimals;
                  if (value) {
                    ERC20.push({
                      symbol: symbol,
                      logo: logo,
                      value: value,
                    });
                  }
                }
              })
            );

            const nftMetadata = await limiter.schedule(async () => {
              return await alchemy.nft.getNftMetadata(
                nft.contract.address,
                nft.tokenId
              );
            });
            const t = parseInt(nft.blockNumber, 16);
            const timestamp = await limiter.schedule(async () => {
              return (await alchemy.core.getBlock(t)).timestamp;
            });
            MINTS.push({
              tokenId: nft.tokenId,
              tx_hash: nft.transactionHash,
              value: value,
              ERC20: ERC20,
              blockNumber: nft.blockNumber,
              contract_address: nft.contract.address,
              media: nftMetadata.media,
              floorprice: nftMetadata.contract.openSea.floorPrice,
              timestamp: timestamp,
            });
          } catch (err) {
            //console.log(err);
          }
        })
      );
    }

    if (mints.pageKey === undefined) {
      break;
    }
    pageKey = mints.pageKey;
  }
  return MINTS;
}

async function getPurchases(wallet, token, alchemy, fromBlock) {
  const BUY = [];
  const contractAddress = token;
  let f;
  while (true) {
    const purchases = await alchemy.nft.getNftSales({
      toBlock: "latest",
      fromBlock: fromBlock,
      buyerAddress: wallet,
      pageKey: f,
    });

    if (contractAddress) {
      purchases.nftSales = purchases.nftSales.filter(
        (nfts) => nfts.contractAddress === contractAddress
      );
    }

    const promises = purchases.nftSales.map(async (bought) => {
      const contract_address = bought.contractAddress;
      const tokenId = bought.tokenId;
      const nftMetadata = await limiter.schedule(async () => {
        return await alchemy.nft.getNftMetadata(contract_address, tokenId);
      });
      const tx_hash = bought.transactionHash;
      const tokensymbol =
        bought.sellerFee.symbol ||
        bought.protocolFee.symbol ||
        bought.royaltyFee.symbol ||
        bought.marketplaceFee.symbol;

      const tokenAddress =
        bought.sellerFee.tokenAddress ||
        bought.protocolFee.tokenAddress ||
        bought.royaltyFee.tokenAddress ||
        bought.marketplaceFee.tokenAddress;

      let blockNumber = bought.blockNumber;

      let s1,
        s2,
        s3,
        amount = 0;

      if (bought.sellerFee.amount && bought.sellerFee.decimals) {
        s1 = bought.sellerFee.amount / 10 ** bought.sellerFee.decimals;
        amount += s1;
      }
      if (bought.protocolFee.amount && bought.protocolFee.decimals) {
        s2 = bought.protocolFee.amount / 10 ** bought.protocolFee.decimals;
        amount += s2;
      }
      if (bought.royaltyFee.amount && bought.royaltyFee.decimals) {
        s3 = bought.royaltyFee.amount / 10 ** bought.royaltyFee.decimals;
        amount += s3;
      }

      if (bought.marketplaceFee.amount && bought.marketplaceFee.decimals) {
        amount +=
          bought.marketplaceFee.amount / 10 ** bought.marketplaceFee.decimals;
      }

      if (tokenAddress === "0x0000000000a39bb272e79075ade125fd351887ac") {
        if (bought.sellerFee.amount) {
          s1 = bought.sellerFee.amount / 10 ** 18;
          amount += s1;
        }
        if (bought.protocolFee.amount) {
          s2 = bought.protocolFee.amount / 10 ** 18;
          amount += s2;
        }
        if (bought.royaltyFee.amount) {
          s3 = sold.royaltyFee.amount / 10 ** 18;
          amount += s3;
        }

        if (bought.marketplaceFee.amount) {
          amount += bought.marketplaceFee.amount / 10 ** 18;
        }
      }

      const timestamp = await limiter.schedule(async () => {
        return (await alchemy.core.getBlock(parseInt(blockNumber))).timestamp;
      });
      return {
        contract_address: contract_address,
        tokenId: tokenId,
        tx_hash: tx_hash,
        amount: amount,
        tokensymbol: tokensymbol,
        blockNumber: blockNumber,
        tokenAddress: tokenAddress,
        nftMetadata: nftMetadata.media,
        floorprice: nftMetadata.contract.openSea.floorPrice,
        timestamp: timestamp,
      };
    });

    const results = await Promise.all(promises);
    BUY.push(...results);

    if (!purchases.pageKey) {
      break;
    }

    f = purchases.pageKey;
  }

  return BUY;
}

export default async function handler(req, res) {
  const { method } = req;
  const { wallet } = req.query;
  const { token } = req.query;

  switch (method) {
    case "GET":
      const alchemy = new Alchemy(config);

      const apiKey =
        "IdM0rE9W5zfBERFNCY5sCwNyYrhtkyYefjBYeT0H1XGLIn6JzJBJeJS5oSnJzRDy";
      const url = "https://deep-index.moralis.io/api/v2.2/dateToBlock";
      const chain = "eth";
      const date = (await alchemy.core.getBlock()).timestamp - 7 * 24 * 60 * 60;
      const conffig = {
        headers: {
          accept: "application/json",
          "X-API-Key": apiKey,
        },
        params: {
          chain,
          date,
        },
      };

      const fromBlock = (await axios.get(url, conffig)).data.block;

      // const date = "1667823435";

      // const chain = evm_api.ETHEREUM;

      // const response = await Moralis.EvmApi.block.getDateToBlock({
      //   date,
      //   chain,
      // });

      //console.log(response.toJSON());
      try {
        const SELL = await getSales(wallet, token, alchemy, fromBlock);
        const MINTS = await getMints(wallet, token, alchemy, fromBlock);
        const BUY = await getPurchases(wallet, token, alchemy, fromBlock);

        const Analysis = {
          Sales: SELL,
          Mints: MINTS,
          Purchases: BUY,
        };
        res.status(200).json({
          Analysis,
        });

        break;
      } catch (err) {
        console.error(err);
      }

    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
