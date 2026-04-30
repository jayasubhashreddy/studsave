// No-auth middleware: app is single-user, no login required.
// We attach a fixed userId so all existing DB queries still work.
const SINGLE_USER_ID = '000000000000000000000001';

const auth = (req, res, next) => {
  req.user = { _id: SINGLE_USER_ID, id: SINGLE_USER_ID };
  next();
};

module.exports = auth;
