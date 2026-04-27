# Checkers AI Project: Complete Academic Report

## 1. Title Page
**Project Title:** Intelligent Checkers AI System: A Comparative Study of Minimax Alpha-Beta and MCTS with Fuzzy Logic  
**Course Name:** `[Enter Course Name]`  
**Student Name(s):** `[Enter Student Name(s)]`  
**Student ID(s):** `[Enter Student ID(s)]`  
**Instructor:** `[Enter Instructor Name]`  
**Institution:** `[Enter Institution Name]`  
**Submission Date:** `[Enter Date]`

## 2. Abstract
This project presents a full-stack intelligent Checkers platform that supports human gameplay, AI-assisted gameplay, internal AI-vs-AI simulation, and external benchmark evaluation. The system compares two distinct decision-making agents under the same rule engine: Agent Megha (deterministic Minimax/Negamax with Alpha-Beta pruning) and Agent Adiba (probabilistic Monte Carlo Tree Search with fuzzy-logic priors and phase adaptation). The backend is implemented in FastAPI with rule-safe move generation, turn execution, and draw detection; the frontend is implemented in React + Vite with animated board interactions and explainability panels. The project also includes a score tracking module with win/loss/draw accounting and duplicate-safe matchup aggregation. The key contribution is a practical, explainable comparison between exact tree search and simulation-based adaptive planning in a classical board game environment.

## 3. Introduction
Artificial intelligence in board games has long been a core research area for evaluating planning, decision quality, and opponent modeling. Classical systems used deterministic search methods (for example Minimax), while modern systems often combine simulation and heuristic guidance to improve flexibility.

Checkers is selected in this project because it provides a balanced challenge: the rules are simple enough to understand and explain, but the tactical and strategic depth is high enough to demonstrate advanced AI behavior. The game includes forced captures, multi-jump sequences, promotions to king, and positional trade-offs. These characteristics make it ideal for evaluating search quality and decision explainability.

The problem statement is: **How do two different AI paradigms perform and behave in the same Checkers environment when constrained by real-time gameplay requirements?** Specifically, the project compares:
- A deterministic depth-based planner (Agent Megha).
- A probabilistic simulation-driven planner with fuzzy priors (Agent Adiba).

The motivation is both educational and practical. From an educational perspective, this system allows students to clearly present how AI algorithms reason. From an engineering perspective, it demonstrates how to combine game theory, heuristic modeling, API design, and modern frontend interaction into one complete, deployable project.

## 4. Objectives
The project objectives are:
- Build an intelligent Checkers game system with a reliable rule engine.
- Compare different AI decision-making strategies in the same environment.
- Provide explainable AI outputs for easier understanding and presentation.
- Integrate multiple agent types, including an external benchmark agent.
- Support complete match lifecycle management including draw handling.
- Build a scoreboard that tracks wins, losses, and draws without duplicate match rows.

## 5. System Overview
### 5.1 Architecture
The system uses a layered architecture:
- **Frontend (React + Vite):** board rendering, user input, turn indicator, strategy panel, animations, and scoreboard modal.
- **Backend (FastAPI):** API endpoints, move legality, move execution, win/draw checks, and AI move services.
- **Game Engine Modules:** board initialization, legal move generation, mandatory capture enforcement, capture resolution, promotion, and result detection.
- **Persistence Layer (Supabase + fallback):** match history and aggregated score records.

### 5.2 Game Flow
The game loop follows:
1. Turn starts.
2. Backend returns legal moves for current player.
3. Human or AI selects one legal move.
4. Backend applies move and updates board state.
5. Backend checks winner.
6. Backend checks draw conditions.
7. Turn switches to the next player if game is ongoing.
8. Frontend updates board, telemetry, and explanation panel.

### 5.3 Technologies Used
- Python 3, FastAPI, Uvicorn
- React, Vite, JavaScript
- Supabase (scoreboard persistence)
- Async game APIs (`/api/game/*`, `/api/scores/*`)
- Pydantic for request validation

## 6. Agent Design
### 6.1 Agent Megha (Minimax + Alpha-Beta)
Agent Megha follows a deterministic adversarial search model. It assumes both players choose moves optimally.

#### Minimax Concept
Minimax evaluates a game tree by alternating:
- **Max nodes:** choose move with highest score (AI advantage).
- **Min nodes:** choose move with lowest score (opponent resistance).

This produces a robust “best guaranteed move” under optimal opposition.

#### Depth-Based Search and Evaluation
Megha explores moves to increasing depth (iterative deepening). For non-terminal states, it computes a heuristic evaluation using:
- Material value (piece/king weighting),
- Advancement and promotion potential,
- Center control,
- Back-rank stability,
- Mobility,
- Capture pressure.

#### Alpha-Beta Pruning
To reduce unnecessary computation, Megha uses Alpha-Beta pruning:
- `alpha`: best score currently guaranteed for maximizing side,
- `beta`: best score currently guaranteed for minimizing side.

When `alpha >= beta`, the branch is pruned because it cannot improve the final choice.

#### Decision-Making Flow (Megha)
1. Generate legal moves.
2. Order moves using tactical and historical heuristics.
3. Run iterative deepening Negamax + Alpha-Beta.
4. Use transposition table entries where available.
5. Select best-scoring move within time budget.
6. Return move, phase, searched depth, win probability, and explanation.

**Figure 1: Minimax Decision Tree Diagram**
```text
Depth 0 (MAX: Megha)
                 [Root]
               /    |    \
             M1     M2     M3
            / \    / \    / \
Depth 1   r1  r2  r3  r4 r5  r6   (MIN: Opponent)
          / \      X
Depth 2  ...      (pruned: alpha >= beta)

Legend:
MAX node = AI trying to maximize score
MIN node = Opponent trying to minimize score
X = pruned branch (not searched further)
```
**Explanation:** The figure shows how Megha expands candidate moves and stops exploring branches that are provably irrelevant to the final decision. This enables deeper tactical calculation under limited time.

---

### 6.2 Agent Adiba (MCTS + Fuzzy Logic)
Agent Adiba uses Monte Carlo Tree Search (MCTS), which relies on repeated simulations instead of fully evaluating every branch.

#### MCTS Concept (Explore vs Exploit)
- **Explore:** test less-visited branches to discover hidden strong options.
- **Exploit:** focus on branches that already show good outcomes.

This balance is controlled by UCT-style selection.

#### Four MCTS Steps
1. **Selection:** follow highest UCT-style value from root to a leaf candidate.
2. **Expansion:** add a new child node from an untried move.
3. **Simulation:** run rollout(s) from the new node to estimate outcome.
4. **Backpropagation:** update visit and value statistics back to root.

#### Fuzzy Logic Integration
Before and during search, Adiba applies fuzzy scoring to prioritize moves. Key inputs:
- Safety,
- Attack potential,
- Risk,
- Mobility,
- Center control.

Fuzzy priors guide early search toward strategically meaningful lines and reduce noise from purely random playouts.

#### Phase-Based Adaptation
Adiba adjusts parameters by phase:
- **Opening:** safer behavior, stronger filtering, lower simulation budget.
- **Midgame:** balanced risk and simulation budget.
- **Endgame:** higher aggression and larger simulation budget for conversion.

**Figure 2: MCTS Tree Growth Diagram**
```text
Iteration 1:   Root -> A
Iteration 2:   Root -> B
Iteration 3:   Root -> A -> A1
Iteration 4:   Root -> C
Iteration 5:   Root -> A -> A2

Visit counts after iterations:
Root(5)
 |- A(3)
 |   |- A1(1)
 |   |- A2(1)
 |- B(1)
 |- C(1)
```
**Explanation:** Unlike fixed-depth trees, MCTS grows unevenly. Stronger lines receive more visits, creating an empirical confidence signal from repeated rollouts.

**Figure 3: Fuzzy Decision Model**
```text
Input Features
  ├─ Safety
  ├─ Attack
  ├─ Risk
  ├─ Mobility
  └─ Center Control
        ↓
Fuzzy Inference & Weighted Blending
        ↓
Move Priority Score (Prior)
        ↓
MCTS Selection Bias + Rollout Evidence
        ↓
Final Move + Win Probability + Explanation
```
**Explanation:** The fuzzy layer acts as strategic guidance, while MCTS supplies statistical validation. Together they produce adaptive and explainable decisions.

---

### 6.3 External / Online Agent
The external/online agent is integrated as a benchmark opponent. Its role is:
- Provide out-of-system comparison,
- Validate robustness of internal agents,
- Support online benchmark mode.

Its internal algorithm is defined by the external implementation and adapter. In this project, it is treated as an independent decision service and used as a comparative reference rather than the primary research focus.

## 7. Features
Implemented system features include:
- Human vs Human and Human vs AI gameplay modes.
- Internal AI vs AI simulation mode.
- External benchmark agent integration.
- Real-time move execution with strict legality enforcement.
- Strategy/explanation panel for AI reasoning output.
- Animated UI for move transitions and captures.
- Persistent scoreboard with wins, losses, and draws.
- Draw detection:
  - No-progress rule (40 moves without capture/promotion),
  - Repetition rule (same position 3 times).
- Unique matchup aggregation to avoid duplicate score rows.

## 8. Decision-Making Comparison
| Dimension | Agent Megha | Agent Adiba |
|---|---|---|
| Core strategy | Minimax/Negamax + Alpha-Beta | MCTS + Fuzzy Logic |
| Decision style | Deterministic | Probabilistic |
| Search control | Depth + time budget | Simulation count + time budget |
| Computation pattern | Structured tree expansion | Incremental stochastic sampling |
| Strength profile | Tactical precision in forcing lines | Flexible adaptation in uncertain positions |
| Explainability output | Depth-based rationale + score | Simulation confidence + fuzzy rationale |
| Behavior consistency | High repeatability | Small variation possible due to rollouts |

In simple terms, Megha is like a strict planner that computes deeply and consistently, while Adiba is like a strategic explorer that tests many plausible futures and adapts by context.

## 9. Implementation Details
### 9.1 Backend (FastAPI)
Backend endpoints:
- `/api/game/init`
- `/api/game/legal-moves`
- `/api/game/move`
- `/api/game/agent-adiba-move`
- `/api/game/agent-megha-move`
- `/api/game/agent-external-move`
- `/api/scores/upsert`
- `/api/scores`

Pydantic schemas enforce payload validity. Rule logic remains backend-authoritative.

### 9.2 Frontend (React)
Frontend responsibilities:
- Board rendering and move interactions,
- Turn visualization and card highlighting,
- AI move trigger/automation controls,
- Scoreboard modal with match aggregation display,
- End-state modals for win/draw outcomes.

### 9.3 Game Logic
Core engine handles:
- Mandatory capture constraints,
- Multi-jump execution,
- Promotion to king,
- Winner detection,
- Draw detection with no-progress and repetition counters.

### 9.4 Scoreboard and State Management
Scoreboard updates occur after match completion:
- Win increments winner-side count only.
- Draw increments draw count only.
- Unique key logic groups same matchup for each user.

This ensures no duplicate match cards and clear long-term performance tracking.

## 10. Discussion
### 10.1 Strengths of Megha
- Strong tactical reliability in forcing sequences.
- Stable and reproducible outputs for identical states.
- Effective pruning enables deeper practical search.

### 10.2 Strengths of Adiba
- Adaptive behavior under uncertain positions.
- Better exploration of diverse strategic continuations.
- Rich explainability through fuzzy-informed rationale.

### 10.3 Tradeoffs
- Megha favors precision and predictability but may under-explore unusual lines.
- Adiba favors flexibility and resilience but may vary slightly due to stochastic simulation.

### 10.4 Challenges Faced
- **Performance:** balancing search quality and response latency.
- **Fuzzy tuning:** setting weights/risk tolerance for different phases.
- **Visualization:** presenting complex AI internals clearly for students and evaluators.
- **System integration:** maintaining consistent API contracts across frontend/backend modules.

## 11. Conclusion
This project successfully demonstrates a complete intelligent Checkers platform with two contrasting AI paradigms. Megha provides deterministic tactical depth through Alpha-Beta search, while Adiba provides probabilistic adaptability through MCTS and fuzzy guidance. The system also adds practical production features such as draw handling, explainability outputs, and persistent scoreboard analytics. The main learning outcome is that algorithm choice must align with problem structure, runtime limits, and interpretability requirements.

Future improvements can include:
- Advanced transposition sharing across turns,
- Parallelized rollouts for faster MCTS convergence,
- Stronger external benchmark pools,
- Automated experiment logging and evaluation dashboards.

## 12. References
1. Russell, S., & Norvig, P. (2021). *Artificial Intelligence: A Modern Approach* (4th ed.). Pearson.  
2. Knuth, D. E., & Moore, R. W. (1975). An analysis of alpha-beta pruning. *Artificial Intelligence, 6*(4), 293-326.  
3. Browne, C. B., Powley, E., Whitehouse, D., Lucas, S. M., Cowling, P. I., Rohlfshagen, P., Tavener, S., Perez, D., Samothrakis, S., & Colton, S. (2012). A survey of Monte Carlo Tree Search methods. *IEEE Transactions on Computational Intelligence and AI in Games, 4*(1), 1-43.  
4. Zadeh, L. A. (1965). Fuzzy sets. *Information and Control, 8*(3), 338-353.  
5. FastAPI Documentation. https://fastapi.tiangolo.com/  
6. React Documentation. https://react.dev/  
7. Supabase Documentation. https://supabase.com/docs  

---
### Appendix A: Existing Report Content Preserved and Enhanced
The original report themes have been retained and expanded:
- Comparative focus: deterministic Alpha-Beta vs probabilistic MCTS.
- System architecture (Frontend + Backend + Database).
- Megha pruning mechanism and Adiba 4-step MCTS cycle.
- Fuzzy prioritization concept.
- Draw conditions and final comparative conclusion.

This final version restructures those ideas into an academic format suitable for submission and viva presentation.
