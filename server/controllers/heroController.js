const HomeHero = require('../models/HomeHero');

// There is only ever one hero, so this behaves as a singleton document.
async function getHero(req, res) {
  const hero = await HomeHero.findOne();
  res.json(hero || {});
}

async function updateHero(req, res) {
  const hero = await HomeHero.findOneAndUpdate({}, req.body, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });
  res.json(hero);
}

module.exports = { getHero, updateHero };
