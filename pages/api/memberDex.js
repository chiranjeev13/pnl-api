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
  while (1) {
    const data = await alchemy.nft.getOwnersForContract(
      "0x1dC454EE1Fd63F3D792aEee9D331c05D9C62B20A",
      options
    );

    options.pageKey = data.pageKey;
    data.owners.map((p) => {
      addresses.push(p);
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
    fs.writeFileSync("onchain.csv", csvData, "utf-8");
  } catch (err) {
    console.log(err);
  }
})();
