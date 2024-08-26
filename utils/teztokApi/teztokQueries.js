/* Collects all primary mints using Teztok. Defined as follows:

  FX_MINT - 2021-11-03
  FX_COLLECT - 2021-11-11
  FX_OFFER - 2021-11-11
  FX_CANCEL_OFFER - 2021-11-11

  FX_MINT_V2 - 2022-01-05
  
  FX_MINT_V3 -
  FX_MINT_V4
  FX_MINT_WITH_TICKET
  
  
  FX_LISTING_ACCEPT
  
  FX_OFFER_ACCEPT_V3
  FX_COLLECTION_OFFER_ACCEPT
  
  FX_LISTING
  
  FX_LISTING_CANCEL

  Primary sales:
    Project launched beta, pre Jan stage. NOTE, NO LONGER MINTABLE, ALL UNMINTED WERE BURNT IN JAN-22
      events(type: {_eq: "FX_MINT"}}) {
    Project launched beta, post Jan stage. Mint.
      events(type: {_eq: "FX_MINT_V2"}}) {
    Project launched full release stage. Mint.
      events(type: {_eq: "FX_MINT_V3"}}) {
    Project launched post-params stage. Original mint of the ticket.
      events(type: {_eq: "FX_MINT_V4"}}) {
    Project launched post-params stage. Conversion of ticket into objkt (not the original minting of the ticket).
      events(type: {_eq: "FX_MINT_WITH_TICKET"}}) {
  
  Secondary sales:
    Marketplace sale
    - type "FX_COLLECT" (corresponds to MARKETPLACE_V1 - can only relate to beta projects)
    - type "FX_LISTING_ACCEPT" (corresponds to MARKETPLACE_V2 - applies to all projects, including back to beta, depending on when they were created)
    Accepted offer
    - type "FX_OFFER_ACCEPT_V3" (corresponds to MARKETPLACE_V2 - applies to all projects, including back to beta, depending on when they were created)
    Collection offer
    - type "FX_COLLECTION_OFFER_ACCEPT" (available from the post params stage onwards)

    Note: Original minting of a params project ticket is messy in teztok, only has SET_LEDGER and SET_METADATA action types.
    fa2 address is ticket manager.
    Decided not worth the extra work to use this instead, as the important thing is to quantify the overall primary mint cost, which this does

  Other actions for use in unique addresses only:  
    Listings
    - type "FX_OFFER" (corresponds to MARKETPLACE_V1 - can only relate to beta projects)
    - type "FX_LISTING" (corresponds to MARKETPLACE_V2 - applies to all projects, including back to beta, depending on when they were created)
    Cancelled Listings
    - type "FX_CANCEL_OFFER" (corresponds to MARKETPLACE_V1 - can only relate to beta projects)
    - type "FX_LISTING_CANCEL" (corresponds to MARKETPLACE_V2 - applies to all projects, including back to beta, depending on when they were created)
    Offers - not included
    - type "FX_OFFER_V3" (introduced in May-22, a month after full release, but can apply to any token for any time)

  First transaction ever on FXHASH: 2021-11-03T12:28:02+00:00

  */

const teztokEventRequest = require("./teztokRequest.js");

// 1508 on 2021-11-10

/**
 * Runs a function with the given parameters repeatedly until there are no more results
 * @param {function} teztokFn
 * @param {number} limit
 * @param  {...any} params
 * @returns {{success:boolean, error: Error, data: object}}
 */

async function collateQueryResults(teztokFn, limit, ...params) {
  let outputArray = [];
  let response = {};
  let offset = 0;

  do {
    response = await teztokFn(limit, offset, ...params);
    console.log(`Request has returned ${response.data.length} results`);
    outputArray = [...outputArray, ...response.data];
    offset += limit;
  } while (response.success && response.data.length > 0);

  if (response.success) {
    return { success: true, error: null, data: outputArray };
  } else {
    return { success: false, error: response.error, data: null };
  }
}

/**
 * Collect relevant fxhash activity for a calendar day from teztok API
 * @param {number} limit
 * @param {number} offset
 * @param {string} dateString
 * @returns {{success:boolean, error: Error, data: object}}
 */
async function teztok_FxhashActivityOnDate(limit, offset, dateString) {
  const queryString = `
      query MyQuery {
        events(
          where: {
            _or: [
              { type: { _eq: "FX_MINT_WITH_TICKET" } }
              { type: { _eq: "FX_MINT_V4" } }
              { type: { _eq: "FX_MINT_V3" } }
              { type: { _eq: "FX_MINT_V2" } }
              { type: { _eq: "FX_MINT" } }
              { type: { _eq: "FX_LISTING_ACCEPT" } }
              { type: { _eq: "FX_COLLECT" } }
              { type: { _eq: "FX_OFFER_ACCEPT_V3" } }
              { type: { _eq: "FX_COLLECTION_OFFER_ACCEPT" } }
              { type: { _eq: "FX_OFFER" } }
              { type: { _eq: "FX_LISTING" } }
              { type: { _eq: "FX_CANCEL_OFFER" } }
              { type: { _eq: "FX_LISTING_CANCEL" } }
            ]
            _and: [
              { timestamp: { _gte: "${dateString}T00:00:00" } }
              { timestamp: { _lte: "${dateString}T23:59:59" } }
            ]
          }
          limit: ${limit}
          offset: ${offset}
        ) {
          type
          timestamp
          token {
            token_id
          }
          price
          buyer_address
          seller_address
        }
      }
    `;

  const response = await teztokEventRequest(queryString);
  return response;
}

module.exports = {
  collateQueryResults,
  teztok_FxhashActivityOnDate,
};
