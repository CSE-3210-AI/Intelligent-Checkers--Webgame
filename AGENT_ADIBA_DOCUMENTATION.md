# Agent Adiba Technical Documentation

## 1. Introduction

### 1.1 What Agent Adiba Is
Agent Adiba is a custom checkers AI integrated into this project as a decision service (`backend/services/agentAdiba`). It combines:
- Monte Carlo Tree Search (MCTS) for probabilistic planning.
- Fuzzy logic scoring for heuristic move quality estimation.
- Phase-adaptive parameter control (Opening, Midgame, Endgame).
- Natural-language explanation generation for transparent decisions.

### 1.2 Purpose of the Agent
The agent is designed to produce strong practical moves under limited time by combining search-based decision making with heuristic priors. Instead of relying only on deterministic evaluation, it explores multiple futures through simulation and biases search toward strategically meaningful candidates.

### 1.3 Key Features
- Hybrid decision model: fuzzy pre-evaluation + MCTS selection.
- UCT node selection with additional fuzzy prior bias.
- Dynamic behavior tuning by game phase (risk, search budget, filtering intensity).
- Explainability output including tactical/positional rationale and estimated win probability.

---

## 2. Overall Architecture

### 2.1 High-Level Pipeline
Agent Adiba follows this exact pipeline in `get_agent_adiba_move`:
1. Generate legal moves from current board state.
2. Detect current game phase.
3. Load phase-adaptive parameters.
4. Fuzzy-score each legal move.
5. Filter weaker moves based on fuzzy score threshold policy.
6. Build priors map (`move_signature -> fuzzy_score`).
7. Run MCTS with UCT + fuzzy bias.
8. Select final move (or fuzzy fallback if MCTS yields none).
9. Generate explanation from move metadata + phase + win probability.
10. Return decision object.

### 2.2 Data Flow (State -> Decision -> Move)
- **Input state**: board + player color.
- **Candidate generation**: legal moves from rules engine (`getLegalMoves`; frontend equivalent naming: `getAllMoves`).
- **State transitions**: hypothetical next states via `applyMove`.
- **Terminal checks**: winner detection via `checkWin` (frontend equivalent naming: `checkWinner`).
- **Output decision**: `{ move, phase, win_probability, explanation }`.

### 2.3 Module Responsibilities
- `agent_adiba.py`: orchestration and fallback policy.
- `phase_detector.py`: phase detection and parameter presets.
- `fuzzy_logic.py`: feature extraction, fuzzy scoring, move filtering.
- `mcts.py`: search tree, UCT selection, rollout simulation, backpropagation.
- `explanation_engine.py`: post-hoc reasoning text generation.

---

## 3. Core Algorithm: Monte Carlo Tree Search (MCTS)

Agent Adiba uses a standard four-stage MCTS loop with checkers-specific constraints and priors.

### 3.1 Selection
From root, repeatedly choose child with maximum UCT-derived score until reaching:
- A terminal node, or
- A node that is not fully expanded.

### 3.2 Expansion
If node has untried legal moves:
- Randomly select one untried move.
- Validate legality against engine-generated moves.
- Apply move to produce child board.
- Create child node with opponent as next player.
- Assign prior from fuzzy map (`default=0.5` when absent).

### 3.3 Simulation (Rollout)
From expanded node, run random playout up to `max_plies = 80`:
- Stop early on terminal state.
- If no legal moves, assign win/loss from perspective of AI player.
- Otherwise play random legal moves.
- If depth limit reached without terminal result, use a lightweight material proxy:
  - `(ai_count - opp_count + 12) / 24`, clamped to `[0,1]`.

### 3.4 Backpropagation
Propagate simulation result up the ancestor chain:
- `visits += 1`
- `wins += result`

### 3.5 Checkers-Specific Adaptations
- Uses mandatory-capture legal generator (`getLegalMoves`) so tree expands only rule-valid moves.
- Node terminal test uses `checkWin(board, player_to_move)`.
- Legality guard `_is_move_legal` prevents corrupted tree transitions.

### 3.6 Search Budget
MCTS is bounded by both:
- Iteration target (`mcts_simulations`, phase-dependent), and
- Time budget (`time_budget_ms = 900`).

---

## 4. UCT with Fuzzy Bias

### 4.1 Standard UCT Component
For visited child nodes, Adiba uses:
- Exploitation: `wins / visits`
- Exploration: `c * sqrt(log(parent_visits) / visits)`

### 4.2 Added Fuzzy Bias
Adiba augments UCT with a prior bonus:
- `fuzzy_bias = 0.25 * prior / (1 + visits)`

Final score:
- `UCT_fuzzy = exploitation + exploration + fuzzy_bias`

Where:
- `prior` is derived from fuzzy move score.
- Bias decays as visits increase, so long-term value still comes from empirical rollouts.

### 4.3 Why This Improves Decision Quality
- Early search is guided toward semantically strong moves (safety/attack/mobility-aware).
- Random rollout noise is reduced by informed prior steering.
- As visits increase, rollout evidence dominates, preventing hard heuristic lock-in.

---

## 5. Fuzzy Logic System

### 5.1 Input Features
For each legal move, Adiba computes:
- `capture_opportunity`: normalized capture count.
- `king_safety`: inverse threat (only meaningful for king destinations; otherwise neutral baseline).
- `center_control`: high if landing in central 4x4 zone.
- `flank_protection`: higher for edge-file protective placement.
- `promotion_prevention`: pressure against opponent promotion progress.
- `mobility_advantage`: normalized difference between own and opponent legal move counts.
- `threat_score`: normalized count of opponent jump lines targeting landing square.

### 5.2 Intermediate Output Scores
Adiba computes:
- `safety_score`
- `attack_score`
- `risk_score`
- `mobility_score` (returned as metadata)

#### Formulas
- `safety_score = 0.36*king_safety + 0.28*flank_protection + 0.20*(1-threat_score) + 0.16*promotion_prevention`
- `attack_score = 0.45*capture_opportunity + 0.23*center_control + 0.17*mobility_advantage + 0.15*promotion_prevention`
- `risk_score = 0.65*threat_score + 0.35*(1-safety_score)`

All values are clamped to `[0,1]`.

### 5.3 Final Fuzzy Score
Final blended score depends on phase-specific `risk_tolerance`:
- `fuzzy_score = (1-risk_tolerance)*(0.6*safety + 0.4*attack) + risk_tolerance*(0.7*attack + 0.3*(1-risk))`

Interpretation:
- Low `risk_tolerance` favors safer, stability-oriented moves.
- High `risk_tolerance` shifts weight toward aggressive conversion pressure.

### 5.4 Move Classification
Each move is labeled:
- `Safe` (default)
- `Aggressive` if `attack_score > 0.7` and `risk_score > 0.45`
- `Risky` if `risk_score > 0.62`

This label supports explanation generation.

### 5.5 Fuzzy Filtering
Before MCTS, weaker moves are pruned by rank percentile:
- `strong`: keep top ~45% (minimum 2 moves)
- `medium`: keep top ~65%
- `weak`: keep top ~85%

Threshold ties are retained.

---

## 6. Phase-Based Strategy

### 6.1 Phase Definitions
Phase is determined by total remaining pieces (`blue + red`):
- **Opening**: `total > 16`
- **Midgame**: `8 <= total <= 16`
- **Endgame**: `total < 8`

### 6.2 Adaptive Parameters by Phase

#### Opening
- `risk_tolerance = 0.25`
- `mcts_simulations = 200`
- `fuzzy_filtering = strong`
- `uct_c = 1.25`
- Strategy label: `Opening Strategy`

#### Midgame
- `risk_tolerance = 0.50`
- `mcts_simulations = 400`
- `fuzzy_filtering = medium`
- `uct_c = 1.35`
- Strategy label: `Midgame Tactical Play`

#### Endgame
- `risk_tolerance = 0.78`
- `mcts_simulations = 700`
- `fuzzy_filtering = weak`
- `uct_c = 1.45`
- Strategy label: `Endgame Aggression`

### 6.3 Why Adaptation Matters
- Opening prioritizes positional safety and pruning.
- Midgame balances tactical complexity with broader search.
- Endgame increases search depth and controlled aggression for conversion.

---

## 7. Move Generation and Simulation Infrastructure

### 7.1 `getAllMoves()` / `getLegalMoves()`
- Frontend naming: `getAllMoves`.
- Backend naming: `getLegalMoves`.
- Enforces mandatory captures and supports full multi-jump chains.
- Guarantees MCTS expansion and rollouts use rule-valid action sets.

### 7.2 `applyMove()`
- Produces immutable next board state.
- Applies captures, destination path, and king promotion.
- Used in both fuzzy evaluation and MCTS tree/rollout transitions.

### 7.3 `checkWinner()` / `checkWin()`
- Frontend naming: `checkWinner`.
- Backend naming: `checkWin`.
- Detects terminal outcomes by piece exhaustion or no-legal-move condition.
- Used for terminal checks in rollouts and node status.

### 7.4 Random Playout Logic
- At each rollout step, select random legal move.
- Respect legality checks before applying move.
- Stop on win/loss or depth cap.
- Maximum rollout depth is approximately 80 plies.

---

## 8. Decision Output and Explainability

### 8.1 Returned Decision Contract
Adiba returns:
- `move`: selected move object (`from`, `to`, `isJump`, `captures`)
- `phase`: Opening/Midgame/Endgame
- `win_probability`: scalar in `[0,1]`
- `explanation`: natural-language rationale

### 8.2 Win Probability Source
- Primary: visit-based estimate from selected MCTS child (`wins/visits`).
- Fallback (when MCTS move missing):
  - `win_probability = clamp(0.45 + 0.4*fuzzy_score)`

### 8.3 Explanation Generation Logic
Explanation engine composes reasons from tactical and fuzzy metadata:
- Capture chosen if jump move selected.
- Promotion prevention emphasized when feature score high.
- Flank defense highlighted when safety and flank metrics are strong.
- Center control highlighted for central dominance moves.
- If no specific trigger, uses classification-guided template (Safe/Aggressive/Balanced).
- Appends estimated win probability with phase strategy context.

This gives users interpretable, context-aware justifications instead of opaque moves.

---

## 9. Strengths of Agent Adiba

### 9.1 Adaptability
Phase-aware parameters let behavior shift naturally from safe development to tactical and conversion-focused play.

### 9.2 Explainability
Decision output includes structured confidence and narrative reasoning, improving trust and educational value.

### 9.3 Balanced Attack-Defense Tradeoff
Fuzzy system explicitly models safety, attack pressure, and risk, then blends them with configurable risk tolerance.

### 9.4 Robustness Across Position Types
MCTS handles tactical uncertainty, while fuzzy priors prevent purely random rollout behavior in large branching states.

---

## 10. Limitations

### 10.1 Computational Cost
MCTS with up to hundreds of simulations per move and rollout depth up to 80 can be expensive under strict latency constraints.

### 10.2 Simulation Randomness
Rollouts are random-policy based; noisy playouts may misestimate deep tactical forcing lines.

### 10.3 Heuristic Dependence
Fuzzy quality depends on feature design and weights. Suboptimal weights can bias search toward locally attractive but globally inferior plans.

### 10.4 Probability Calibration
`win_probability` is an empirical search statistic, not a formally calibrated game-theoretic probability.

---

## 11. Comparison with Agent Megha (Minimax + Alpha-Beta)

### 11.1 Search Paradigm
- **Adiba**: stochastic tree search (MCTS) + fuzzy priors.
- **Megha**: deterministic Negamax with Alpha-Beta pruning.

### 11.2 Evaluation Style
- **Adiba**: rollout outcomes plus fuzzy heuristic guidance.
- **Megha**: handcrafted static evaluation (material, advancement, center, mobility, capture pressure) with iterative deepening.

### 11.3 Performance Profile
- **Adiba** excels in uncertain, high-branching tactical environments where probabilistic exploration is beneficial.
- **Megha** provides stronger deterministic tactical accuracy in calculable lines due to deeper bounded search and pruning optimizations (transposition table, move ordering, killer/history heuristics).

### 11.4 Explainability Style
- **Adiba** explains with fuzzy feature semantics + MCTS confidence.
- **Megha** explains with depth reached, positional/tactical summary, and evaluation score-derived win chance.

---

## 12. Conclusion

Agent Adiba is effective because it integrates three complementary capabilities:
1. **Search** (MCTS) to explore future possibilities under uncertainty.
2. **Knowledge-guided bias** (fuzzy logic) to prioritize strategically meaningful continuations.
3. **Adaptive control** (phase-based tuning) to align risk and compute budget with game context.

This hybrid design yields a practical, interpretable, and phase-aware checkers agent suitable for project and academic settings where both decision quality and explainability matter.

### Future Improvements
- Replace purely random rollouts with light policy-guided playouts.
- Calibrate win probability using offline self-play statistics.
- Learn fuzzy weights from data (self-play or expert games).
- Add transposition handling to MCTS for repeated-state efficiency.
- Integrate deeper tactical verification pass for critical endgame positions.
