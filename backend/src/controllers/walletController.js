const walletService = require('../services/walletService');

async function getWallet(req, res) {
  try {
    const wallet = await walletService.getWallet(req.user.id);
    res.json(wallet);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function getTransactions(req, res) {
  try {
    const transactions = await walletService.getTransactions(req.user.id);
    res.json(transactions);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function topUp(req, res) {
  try {
    const wallet = await walletService.topUp(req.user.id, req.body.amount, req.body.description);
    res.json(wallet);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function listCards(req, res) {
  try {
    const cards = await walletService.listCards(req.user.id);
    res.json(cards);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function addCard(req, res) {
  try {
    const card = await walletService.addCard(req.user.id, req.body);
    res.status(201).json(card);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function deleteCard(req, res) {
  try {
    const result = await walletService.deleteCard(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

async function setDefaultCard(req, res) {
  try {
    const cards = await walletService.setDefaultCard(req.user.id, req.params.id);
    res.json(cards);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

module.exports = {
  getWallet,
  getTransactions,
  topUp,
  listCards,
  addCard,
  deleteCard,
  setDefaultCard,
};
