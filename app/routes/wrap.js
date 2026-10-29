// Send HTTP 500 when a route fails instead of crashing
module.exports = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  });
