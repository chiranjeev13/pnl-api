import csvtojson from "csvtojson";
import csv from "json-2-csv";
import fs from "fs";

import { Alchemy, Network } from "alchemy-sdk";

const config = {
  apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
  network: Network.ETH_MAINNET,
};

const csvFilePath = "./bytes.csv";

const alchemy = new Alchemy(config);

const jsonArray = await csvtojson().fromFile(csvFilePath);

const tokenContractAddresses = ["0xa19f5264f7d7be11c451c093d8f92592820bea86"];

const bal = [];

var i = 0;
for (const j of jsonArray) {
  i++;
  try {
    const data = await alchemy.core.getTokenBalances(
      j.addresses,
      tokenContractAddresses
    );
    console.log(i);
    bal.push({
      address: data.address,
      balances: parseInt(data.tokenBalances[0].tokenBalance) / 10 ** 18,
    });
  } catch (error) {
    console.error(`Error processing address ${j.addresses}:`, error.message);
  }
}

const resp = bal.sort((a, b) => b.balances - a.balances);

const result = resp.slice(0, 40);

const csvData = csv.json2csv(result);
try {
  fs.writeFileSync("bytesHolders.csv", csvData, "utf-8");
} catch (err) {
  console.log(err);
}
