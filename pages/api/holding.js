import axios from "axios";
import csv from "csv-parser";
import js2csv from "json-2-csv";

import fs from "fs";
import { Alchemy, Network } from "alchemy-sdk";

const config = {
  apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
  network: Network.ETH_MAINNET,
};

const results = [];
const json_addresses = [];

fs.createReadStream("merged.csv")
  .pipe(csv())
  .on("data", (data) => results.push(data))
  .on("end", () => {
    main();
  });

async function test(address, alchemy) {
  const contractNames = [];
  try {
    let pageKey = undefined;
    while (true) {
      const options = {
        pageKey: pageKey,
      };
      const data = await alchemy.nft.getContractsForOwner(address, options);
      pageKey = data.pageKey;
      const res = data.contracts;

      res.map((r) => {
        contractNames.push(r.name);
      });
      if (!pageKey) {
        break;
      }
    }
    return contractNames;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

async function main() {
  const alchemy = new Alchemy(config);

  for (let i = 0; i < results.length; i++) {
    const addr = results[i].addresses;
    console.log("At wallet", addr, "index", i + 1);
    const contractNames = await test(addr, alchemy);
    json_addresses.push({
      address: addr,
      contractNames: contractNames.toString(),
    });

    const csvData = js2csv.json2csv(json_addresses);
    try {
      fs.writeFileSync("holdings.csv", csvData, "utf-8");
    } catch (err) {
      console.log(err);
    }
  }
}
