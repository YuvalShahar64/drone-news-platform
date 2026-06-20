const { PAGINATION_DEFAULT_LIMIT: DEFAULT_LIMIT, PAGINATION_MAX_LIMIT: MAX_LIMIT } = require('../config');

function parsePagination(query) {
  let limit  = parseInt(query.limit,  10);
  let offset = parseInt(query.offset, 10);
  if (!Number.isFinite(limit)  || limit  < 1) limit  = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT)                       limit  = MAX_LIMIT;
  if (!Number.isFinite(offset) || offset < 0) offset = 0;
  return { limit, offset };
}

module.exports = { parsePagination, DEFAULT_LIMIT, MAX_LIMIT };
