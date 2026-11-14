const express = require('express');
const problemService = require('../services/ProblemService');
const router = express.Router();
router.get('/', (req, res) => {
  res.json({ problems: problemService.listProblems(req.query.difficulty || null) });
});
router.get('/:id', (req, res) => {
  const p = problemService.getProblem(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json(p);
});
router.post('/reindex', (req, res) => {
  const idx = problemService.buildIndex();
  res.json({ success: true, count: idx.problems.length });
});
module.exports = router;
