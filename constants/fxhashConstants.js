const FIRST_FXHASH_DAY = "2021-11-03";
const EARLIEST_TIMESTAMP = `${FIRST_FXHASH_DAY}T00:00:00Z`;

// mimics an enum
const TRANSACTION_TYPES = Object.freeze({
  PRIMARY_PURCHASE: "primary_purchase",
  SECONDARY_PURCHASE: "secondary_purchase",
  LISTING: "listing",
  DELISTING: "delisting",
});
// const TRANSACTION_TYPES = Object.freeze({
//   PURCHASE: "purchase",
//   LISTING: "listing",
// });

module.exports = {
  FIRST_FXHASH_DAY,
  EARLIEST_TIMESTAMP,
  TRANSACTION_TYPES,
};
