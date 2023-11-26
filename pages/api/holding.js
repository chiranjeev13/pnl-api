import csv from "csv-parser";
import js2csv from "json-2-csv";

import fs from "fs";
import { Alchemy, Network } from "alchemy-sdk";

const config = {
  apiKey: "thZ6Uov_nnjBegiTs5aXqlqLHHOjEXII",
  network: Network.ETH_MAINNET,
};

const results = [];
const NAMES = [];
var p = {};

fs.createReadStream("merged.csv")
  .pipe(csv())
  .on("data", (data) => results.push(data))
  .on("end", () => {
    main();
  });

var t = [];
async function test(address, alchemy) {
  try {
    let pageKey = undefined;
    while (true) {
      const options = {
        pageKey: pageKey,
      };
      const data = await alchemy.nft.getContractsForOwner(address, options);
      pageKey = data.pageKey;
      const res = data.contracts;

      res.forEach((r) => {
        const existingEntry = NAMES.find((entry) => entry.name === r.name);
        if (existingEntry) {
          if (!existingEntry.addresses.includes(address)) {
            existingEntry.addresses.push(address);
          }
        } else {
          NAMES.push({ name: r.name, addresses: [address] });
        }
      });

      if (!pageKey) {
        break;
      }
      t = [];
    }
    return NAMES;
  } catch (error) {
    console.error("Error fetching data:", error);
    return [];
  }
}

async function main() {
  const alchemy = new Alchemy(config);
  var contractNames;
  for (let i = 0; i < results.length; i++) {
    const addr = results[i].addresses;
    console.log("At wallet", addr, "index", i + 1);
    contractNames = await test(addr, alchemy);
  }

  var a = [];
  for (const contract of contractNames) {
    a.push({
      name: contract.name,
      addresses: contract.addresses.toString(),
      length: contract.addresses.length,
    });
  }
  console.log(a);

  const csvData = js2csv.json2csv(a);
  try {
    fs.writeFileSync("test.csv", csvData, "utf-8");
  } catch (err) {
    console.log(err);
  }
}
