const calcAAIScore = require("./aaiScore");
const { extractMonthAndYear } = require("../../dateFunctions");

const { TRANSACTION_TYPES } = require("../../../constants/fxhashConstants");

/**
 * Process a single transaction into the form required by the Postgres model
 * @param {*} transaction - transaction object originating from teztok
 * @returns {{ transData: object[], transType: string }}
 */

const processTransaction = (transaction) => {
  try {
    let transType = "";

    switch (transaction.type) {
      case "FX_MINT_WITH_TICKET":
      case "FX_MINT_V4":
      case "FX_MINT_V3":
      case "FX_MINT_V2":
      case "FX_MINT":
        transType = TRANSACTION_TYPES.PRIMARY_PURCHASE;
        break;
      case "FX_LISTING_ACCEPT":
      case "FX_COLLECT":
      case "FX_OFFER_ACCEPT_V3":
      case "FX_COLLECTION_OFFER_ACCEPT":
        transType = TRANSACTION_TYPES.SECONDARY_PURCHASE;
        break;
      case "FX_OFFER":
      case "FX_LISTING":
        transType = TRANSACTION_TYPES.LISTING;
        break;
      case "FX_CANCEL_OFFER":
      case "FX_LISTING_CANCEL":
        transType = TRANSACTION_TYPES.DELISTING;
        break;
    }

    // note for collection_id below, assign dummy collection id if not available
    // nft is assigned collection_id the first time it is seen
    // impacts collection_id analysis only
    // will not cause any fundamental data integrity issues

    let transData = {
      transaction_type: transType,
      timestamp: transaction.timestamp,
      collection_id: transaction.token.fx_issuer_id ?? 999999, // nullish coalescing operator, only refuses null or undefined!
      collection_iteration: transaction.token.fx_iteration ?? 999999, // can be missing, replace with dummy alternative
      collection_name:
        transaction.token.fx_collection_name ?? "No collection name",
      collection_editions: transaction.token.fx_collection_editions ?? 0, // can be missing, not essential
      collection_thumbnail: transaction.token.fx_collection_thumbnail_uri ?? "",
      nft_thumbnail: transaction.token.thumbnail_uri ?? "",
      artist_address: transaction.artist_address ?? "",
    };

    // artist_profile may not exist for alias
    transData.artist_alias = transaction.artist_profile
      ? transaction.artist_profile.alias ?? "No artist alias"
      : "No artist alias";

    // the scoring account_id is the buyer for purchases, seller for listings
    if (
      transType === TRANSACTION_TYPES.PRIMARY_PURCHASE ||
      transType == TRANSACTION_TYPES.SECONDARY_PURCHASE
    ) {
      transData.raw_account_id = transaction.buyer_address;
      transData.price_tz = transaction.price / 1000000; // received price is mutez
    } else {
      transData.raw_account_id = transaction.seller_address;
      transData.price_tz = null;
    }

    // create nft_mint_month and nft_mint_year for primary purchases
    // will be used for time based analysis
    const { year, month } =
      transData.transaction_type === TRANSACTION_TYPES.PRIMARY_PURCHASE
        ? extractMonthAndYear(transData.timestamp)
        : { year: null, month: null };
    transData.nft_mint_year = year;
    transData.nft_mint_month = month;

    // creates required unique id, form "dfsfd_1"
    transData.fx_nft_id = generateUniqueNftId(
      transaction.token.fa2_address,
      transaction.token.token_id
    );

    return { success: true, transData };
  } catch (error) {
    console.log(error);
    return { success: false, transData: null };
  }
};

const generateUniqueNftId = (fa2Address, tokenId) => {
  /**
   * Because token_id was reset to 1 in early 2023, with the introduction
   * of params, it is necessary to generate a unique id from a combination of
   * part of the fa2_address and the token_id:
   * - Beta phase: fa2_address: KT1KEa8z6vWXDJrVqtMrAeDVzsvxat3kHaCE
   * - Fxhash 1.0: fa2_address: KT1U6EHmNxJTkvaWJ4ThczG4FSDaHC21ssvi (April 2022)
   * - Params, not Fxhash 2.0: fa2_address: KT1EfsNuqwLAWDd3o4pvfUx1CAh5GMdTrRvr (March 2023)
   */

  // UNTESTED BUT OUTPUTS SENSIBLE

  const uniqueNftId = fa2Address.slice(-5) + "_" + tokenId;
  return uniqueNftId;
};

module.exports = processTransaction;
