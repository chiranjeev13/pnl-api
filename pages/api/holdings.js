async function test(address, alchemy) {
    try {
      let pageKey = undefined;
      while (true) {
        const options = {
          pageKey: pageKey,
        };
        const data = await alchemy.nft.getContractsForOwner(address, options);
        pageKey = data.pageKey;  
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