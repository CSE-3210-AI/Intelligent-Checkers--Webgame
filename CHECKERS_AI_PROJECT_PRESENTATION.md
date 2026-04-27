# 🎯 Checkers AI Project Presentation

## 1. Introduction
- This project is an intelligent Checkers game with a modern frontend and a Python backend.
- It includes two different AI agents that choose moves in different ways.
- The objective is to compare two AI thinking styles on the same board and rules.
- Why AI in Checkers:
- Checkers is simple to understand but deep in strategy.
- Every move has consequences, so it is perfect for showing AI decision making.
- Key idea:
- Agent Megha thinks by looking ahead in a fixed decision tree.
- Agent Adiba thinks by running many possible simulations and using fuzzy strategic scoring.
- This gives a clear comparison: exact deterministic search vs adaptive probabilistic search.

## 2. System Overview
- Architecture:
- Frontend (React + Vite): board UI, player interactions, move animations, strategy panel.
- Backend (FastAPI): legal move generation, move execution, win checking, and AI move selection.
- Core game engine (shared logic idea in backend and helper frontend libs):
- Generate legal moves with mandatory capture rule.
- Apply move and remove captured pieces.
- Promote to king when reaching the opposite end.
- Detect winner by no pieces or no legal moves.
- Role of agents:
- Agent Megha: deterministic Minimax/Negamax with Alpha-Beta pruning.
- Agent Adiba: MCTS with fuzzy scoring, phase adaptation, and explanation text.
- Game flow:
- Turn starts.
- Backend generates legal moves.
- Human or AI picks one move.
- Backend applies move and updates board state.
- System checks winner.
- Turn switches to next player.
- Frontend updates board and strategy/explanation panel.

## 3. Agent Megha (Minimax + Alpha-Beta)

### 3.1 Core Idea
- Minimax in simple words:
- The AI imagines future turns like a “what if” tree.
- On its own turns, it tries to maximize advantage.
- On opponent turns, it assumes the opponent will minimize that advantage.
- Maximizing vs minimizing:
- Max node: “What is my best possible outcome?”
- Min node: “What is the worst the opponent can force on me?”
- This back-and-forth models smart play from both sides.

### 3.2 Decision Tree Explanation
- How the tree is built:
- Root = current board.
- Children = all legal moves now.
- Grandchildren = opponent replies.
- Continue until target depth or terminal position.
- Depth exploration:
- Megha uses iterative deepening (depth 1, 2, 3, ...), stopping by time budget.
- Depth target is adaptive by phase:
- Opening: at least depth 10.
- Midgame: at least depth 12.
- Endgame: at least depth 14.
- Terminal states:
- Win/loss positions (opponent has no pieces or no legal moves).
- These receive very large positive/negative values.
- Non-terminal leaf states are scored by evaluation features:
- material,
- advancement,
- center control,
- back-rank guard,
- mobility,
- capture pressure.

### 3.3 Alpha-Beta Pruning
- Why pruning is needed:
- Full tree search is expensive because branching grows quickly.
- Many branches cannot change the final decision.
- How branches are skipped:
- Alpha = best score found so far for maximizing side.
- Beta = best score found so far for minimizing side.
- If a branch becomes clearly worse than an already known option, it is cut.SUPABASE_URL=https://dnauxuozanmjdjchvbff.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuYXV4dW96YW5tamRqY2h2YmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNTQ2MTYsImV4cCI6MjA4NzkzMDYxNn0.m4ChZ8o5u5TSRLq2JJb0ZzzxipPIQyEVWDtBI9jK_OY
SUPABASE_SERVICE_ROLE_KEY=<paste your service_role key here>
- Effect on performance:
- Same final move quality (in ideal ordering) with much less search.
- Allows deeper practical search in real-time gameplay.
- Megha also improves pruning with:
- move ordering,
- transposition table,
- killer move heuristic,
- history heuristic.

### 3.4 Step-by-Step Decision Example
- Scenario:
- It is Red’s turn in midgame.
- Legal moves: M1, M2, M3, M4.
- Step 1: Order moves first.
- Captures and strong positional moves are checked earlier.
- Suppose M2 is a center-improving move, so it is searched early.
- Step 2: Explore M2 branch deeply.
- After opponent best replies, M2 gets score +2.1.
- Alpha becomes +2.1.
- Step 3: Explore M3 branch.
- Opponent has a reply that quickly drives score below +2.1.
- At some node, beta <= alpha, so deeper lines in that branch are pruned.
- Step 4: Explore M1 and M4 similarly.
- M1 ends at +0.8.
- M4 ends at +1.4.
- Step 5: Final selection.
- Best score is M2 (+2.1), so Megha chooses M2.
- Output shown to user:
- selected move,
- searched depth,
- evaluation-based win probability,
- explanation text.
- Analogy:
- Megha is like a chess student who writes all likely opponent replies, crosses out useless lines early, and keeps the strongest plan.

### 3.5 Visualization Instructions (IMPORTANT)
- Slide animation plan:
- Show root board node first.
- Animate one level of children (M1, M2, M3, M4).
- Expand M2 and M3 branches step-by-step.
- Use red X marks to fade out pruned branches.
- Put alpha and beta values in small labels on the side.
- Show score bubbles moving upward from leaves to parent.
- Color convention:
- Max layer: blue outline.
- Min layer: red outline.
- Pruned branch: gray + strike-through.
- End frame:
- Highlight final chosen move node in green glow.
- Add one short caption: “Best guaranteed move under smart opponent response.”

## 4. Agent Adiba (MCTS + Fuzzy Logic)

### 4.1 Core Idea
- MCTS in simple words:
- Instead of fully expanding every branch, Adiba samples many possible futures.
- It balances:
- explore = try less-tested moves,
- exploit = keep testing moves that already look good.
- Why it is different from Minimax:
- Minimax is fixed-depth and deterministic.
- MCTS is simulation-based and probabilistic.
- Adiba does not need a fully expanded tree to make a good choice.

### 4.2 MCTS Steps
- Selection:
- Start at root.
- Repeatedly pick child with best UCT score (value + exploration bonus + fuzzy prior bonus).
- Expansion:
- When a node has untried legal moves, add one new child.
- Simulation (playout):
- From that child, play random legal moves for up to a limit.
- Stop early if game ends.
- If no terminal result appears, use quick piece-count estimate.
- Backpropagation:
- Send simulation result back up the path.
- Increase visit count and accumulated wins on each node.
- Repeat this cycle for many iterations until simulation/time budget is used.

### 4.3 Fuzzy Logic Integration
- Why fuzzy logic is used:
- Pure random simulation can be noisy.
- Fuzzy scoring gives strategic guidance before and during MCTS.
- It acts like “common sense weighting” for moves.
- Factors considered:
- capture opportunity,
- king safety,
- center control,
- mobility,
- threat level,
- plus flank protection and promotion prevention.
- Fuzzy scoring in simple terms:
- Each move gets safety score, attack score, and risk score.
- Scores are blended with risk tolerance.
- Risk tolerance depends on game phase.
- Opening prefers safer choices.
- Endgame allows more aggressive risk.
- Then weak moves are filtered out (keep top percentage) before full MCTS search.

### 4.4 Decision Process Flow
- Step-by-step:
- Generate all legal moves.
- Detect game phase (Opening/Midgame/Endgame by total piece count).
- Load phase parameters:
- risk tolerance,
- MCTS simulation count,
- fuzzy filtering strength,
- UCT exploration constant.
- Fuzzy-score each move.
- Filter weaker moves.
- Build priors from fuzzy score for remaining moves.
- Run MCTS iterations:
- selection,
- expansion,
- simulation,
- backpropagation.
- Pick most visited best child move.
- Return move + phase + win probability + explanation.

### 4.5 Explainability Output
- Adiba explains three things clearly:
- selected move,
- reasoning sentence(s),
- confidence as win probability.
- Typical explanation style:
- “Aggressive capture selected due to favorable simulation outcomes.”
- “Central control move selected to improve board dominance.”
- “Estimated win probability: 73% during midgame.”
- Why this is useful for presentation:
- Students can explain not only what move was chosen, but why the AI felt confident.

### 4.6 Visualization Instructions (IMPORTANT)
- Slide animation plan:
- Start with root and only a few child nodes.
- Animate tree growth over time (not full static tree).
- Show many thin arrows for random playouts from expanded nodes.
- Use pulse animation on node visit counters.
- Highlight most visited node with a bright ring.
- Overlay fuzzy score cards beside top moves:
- Safety,
- Attack,
- Risk,
- Final fuzzy score.
- End frame:
- Show selected move with confidence bar and short explanation text bubble.
- Analogy caption:
- “Adiba is like trying many short future stories, then trusting the one that wins most often.”

## 5. Comparison: Megha vs Adiba
- Deterministic vs Probabilistic:
- Megha returns same move for same state (mostly deterministic).
- Adiba may vary slightly because simulations include randomness.
- Fixed depth vs simulation-based:
- Megha: depth-limited tree with pruning.
- Adiba: iteration/time-limited simulations.
- Exact vs approximate decision:
- Megha approximates with deterministic evaluation but searches exact branches to depth.
- Adiba approximates outcomes by sampled playout statistics.
- Speed vs flexibility:
- Megha can be very strong in tactical lines with good pruning.
- Adiba is flexible in uncertain positions and phase tuning.
- Predictability vs adaptability:
- Megha is predictable and stable.
- Adiba adapts behavior by phase and risk profile.

| Dimension | Agent Megha | Agent Adiba |
|---|---|---|
| Core method | Minimax/Negamax + Alpha-Beta | MCTS + Fuzzy Logic |
| Decision style | Deterministic | Probabilistic |
| Main strength | Deep tactical calculation | Adaptive exploration |
| Guidance | Evaluation function + heuristics | Fuzzy priors + simulations |
| Search control | Depth + time budget | Simulation count + time budget |
| Explainability | Move + score + depth-based explanation | Move + win probability + feature-based explanation |
| Best use case | Forcing lines, exact tactical pressure | Complex uncertain positions, adaptive planning |

## 6. Game Phases (Adiba Specific)
- Opening:
- Many pieces remain.
- Simulations: lower (around 200).
- Risk tolerance: low (safer play).
- Filtering: strong (keep fewer top moves).
- Strategy: stable setup and safe structure.
- Midgame:
- Balanced board complexity.
- Simulations: medium (around 400).
- Risk tolerance: moderate.
- Filtering: medium.
- Strategy: balance attack chances with safety.
- Endgame:
- Few pieces remain.
- Simulations: high (around 700).
- Risk tolerance: high (more aggressive conversion).
- Filtering: weak (keep more move options).
- Strategy: push for concrete win chances.
- How strategy evolves:
- Early game: protect and build position.
- Middle game: fight for control and tactics.
- Endgame: convert advantage decisively.

## 7. Example Gameplay Walkthrough
- Example A: Megha move (Minimax + Alpha-Beta)
- Situation:
- Red has 4 legal moves.
- One move wins material later, one move looks good now but loses center later.
- Options considered:
- A1: safe edge move,
- A2: center move,
- A3: tactical capture line,
- A4: passive retreat.
- Why chosen:
- A3 evaluated highest after opponent best reply.
- Alpha-Beta pruned weaker continuations quickly.
- Logic applied:
- deterministic tree search,
- opponent assumed optimal,
- best guaranteed score selected.
- Example B: Adiba move (MCTS + Fuzzy)
- Situation:
- Red has 5 legal moves in midgame.
- Options include one capture, two center moves, two defensive moves.
- Why chosen:
- Capture line got high attack score and strong simulation win rate.
- Most visited node after MCTS became final move.
- Logic applied:
- fuzzy scoring filtered weak candidates,
- MCTS explored outcomes,
- best empirical result + confidence selected.

## 8. Key Challenges
- Performance issues:
- Tree search and many simulations are computationally heavy.
- Need to keep response fast for smooth gameplay.
- Balancing exploration vs exploitation:
- Too much exploration wastes time.
- Too much exploitation can miss better ideas.
- Designing fuzzy rules:
- Feature weights strongly affect behavior.
- Hard to tune safety and aggression balance for all positions.
- Visualization complexity:
- AI internals are difficult to present clearly on slides.
- Need clean animation and simple narrative to avoid confusion.

## 9. Conclusion
- What we learned:
- Two AIs can solve the same game with very different decision logic.
- Minimax-style thinking is structured and exact.
- MCTS-style thinking is adaptive and probability-driven.
- Why this comparison matters:
- It teaches that AI is not one single method.
- Algorithm choice depends on problem type, time budget, and explainability goals.
- Real-world relevance:
- Similar tradeoffs appear in robotics, route planning, finance, and recommendation systems.
- Systems must choose between exact planning and adaptive sampling under uncertainty.

## 10. Slide Design Suggestions (VERY IMPORTANT)
- Suggested slide breakdown:
- Slide 1: Title + team/project context.
- Slide 2: Introduction and objective.
- Slide 3: System overview architecture diagram.
- Slide 4: Game flow timeline (turn → decision → move → update).
- Slide 5: Agent Megha core idea.
- Slide 6: Megha decision tree animation.
- Slide 7: Alpha-Beta pruning animation.
- Slide 8: Megha step-by-step move example.
- Slide 9: Agent Adiba core idea.
- Slide 10: MCTS 4-step cycle diagram.
- Slide 11: Fuzzy logic factors and score blending (simple visual cards).
- Slide 12: Adiba decision flow from move generation to confidence output.
- Slide 13: Adiba explainability output screenshot/mockup.
- Slide 14: Side-by-side comparison table.
- Slide 15: Phase adaptation chart (opening/midgame/endgame).
- Slide 16: One gameplay walkthrough per agent.
- Slide 17: Challenges and engineering tradeoffs.
- Slide 18: Conclusion and Q&A.
- Where to use animation:
- Tree expansion for Megha.
- Pruned branch fade-out for Alpha-Beta.
- Repeated playout arrows for Adiba.
- Node visit counters increasing over time for MCTS.
- Confidence bar fill animation when final move appears.
- What diagrams to draw:
- Architecture block diagram: Frontend, API, Game Engine, Agent Megha, Agent Adiba.
- Decision tree (small depth) for Minimax.
- Growing search tree for MCTS.
- Radar/bar cards for fuzzy factors (safety, attack, risk, mobility, center, threat).
- Phase parameter table/chart.
- How to present verbally:
- Start each slide with one simple sentence: “What this slide proves.”
- Use analogies:
- Megha: “thinking ahead with strict logic.”
- Adiba: “trying many possible futures quickly.”
- Keep technical terms short, then explain in plain words.
- End every agent section with:
- input,
- thinking process,
- output.
- Presentation pacing tip:
- Spend more time on decision flow and examples, less time on UI styling details.
- Teacher-facing clarity tip:
- Always connect algorithm behavior to one board situation, not abstract theory only.

## 11. Draw Logic and Scoreboard Documentation
- Why draw support was added:
- Some games do not end with a forced win/loss quickly.
- Draw rules make tournament results fairer and prevent endless loops.

### 11.1 Draw Rules Implemented
- Rule 1: No-progress draw (40 moves)
- Count moves where:
- no capture happened, and
- no promotion happened.
- Maintain `noProgressCount` in game state.
- Reset this counter to `0` when a capture or promotion occurs.
- If `noProgressCount >= 40`, game result is draw with reason `no_progress`.

- Rule 2: Repetition draw (3 times)
- Serialize each board position after every move.
- Maintain a map: `repetitionCounts[serializedBoard]`.
- Increment count when the same position appears again.
- If any position reaches count `3`, game result is draw with reason `repetition`.

### 11.2 Turn Resolution Order (Updated)
- Apply move
- Check winner
- Check draw
- Switch turn
- Return updated state to frontend

### 11.3 API Response Contract (Draw-Aware)
- Move response now includes:
- `winner` (existing)
- `status`: `ongoing | win | draw`
- `reason`: `no_progress | repetition | null`
- `noProgressCount`
- `repetitionCounts`

- Draw response shape:
```json
{
  "status": "draw",
  "reason": "no_progress"
}
```
or
```json
{
  "status": "draw",
  "reason": "repetition"
}
```

### 11.4 Scoreboard Update (Wins + Draws)
- Match history keeps one row per unique matchup per user.
- Unique key concept:
- `user_email + matchup_key`
- Existing record is updated (no duplicates), not re-inserted.

- Stored counters:
- `wins_player1` (or equivalent `player1_wins`)
- `wins_player2` (or equivalent `player2_wins`)
- `draws`

- Result update logic:
- If Player 1 wins: increment `wins_player1`
- If Player 2 wins: increment `wins_player2`
- If draw: increment `draws` only

### 11.5 Frontend Scoreboard Display
- Recommended display:
- `Player A vs Player B`
- `Score: 5 - 3 - 2 (W-L-D)`
- `Draws: 2`

- UI behavior:
- Highlight winner side if wins differ.
- Use neutral style when draw count is dominant.
- Keep entries grouped by matchup (no duplicate cards).
- Refresh cleanly from backend API.

### 11.6 Presentation Talking Points (Quick Script)
- “We added two draw safeguards: no-progress and repetition.”
- “This prevents infinite games and improves tournament fairness.”
- “Scoreboard now tracks complete outcomes: wins, losses, and draws.”
- “Match history stays compact with one record per matchup, updated over time.”
