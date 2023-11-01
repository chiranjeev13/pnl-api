import { Alchemy, Network } from "alchemy-sdk";
import csv from "json-2-csv";
import fs from "fs";
import _ from "underscore";
const config = {
  apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(config);

var pageKey;

const addresses = [];
const json_addresses = [];

(async () => {
  while (1) {
    const data = await alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
      fromAddress: "0xf896527c49b44aAb3Cf22aE356Fa3AF8E331F280",
      category: ["external", "internal", "erc20", "erc721", "erc1155"],
      pageKey: pageKey,
    });
    if (data.pageKey === undefined) {
      break;
    }
    pageKey = data.pageKey;
    data.transfers.map((dt) => {
      addresses.push(dt.from);
      addresses.push(dt.to);
    });
  }

  const data = _.uniq(addresses);

  data.map((t) => {
    json_addresses.push({
      addresses: t,
    });
  });

  const csvData = csv.json2csv(json_addresses);
  try {
    fs.writeFileSync("NFTfi2.csv", csvData, "utf-8");
  } catch (err) {
    console.log(err);
  }
})();
