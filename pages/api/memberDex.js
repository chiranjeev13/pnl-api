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

var addresses = [];
const json_addresses = [];

(async () => {
  var options = {
    pageKey: undefined,
  };
  var i = 0;
  var pk;
  while (1) {
    const data = await alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
      contractAddresses: ["0xa19f5264f7d7be11c451c093d8f92592820bea86"],
      category: ["erc20"],
      excludeZeroValue: true,
      pageKey: pk,
    });
    i++;
    console.log(i);
    pk = data.pageKey;
    data.transfers.map((p) => {
      addresses.push(p.to);
      addresses.push(p.from);
    });

    if (data.pageKey === undefined) {
      break;
    }
  }

  const data = _.uniq(addresses);

  console.log(data);

  data.map((t) => {
    json_addresses.push({
      addresses: t,
    });
  });

  const csvData = csv.json2csv(json_addresses);
  try {
    fs.writeFileSync("bytes.csv", csvData, "utf-8");
  } catch (err) {
    console.log(err);
  }
})();
