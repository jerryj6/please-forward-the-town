# Superseded-verdict marking — PFT client patch (upstream-bound)

Shared policy (coordinator, pass-13): board stays live; any post-completion
commit that mutates state marks the verdict **superseded** in the client.

`src/client` is upstream-only — this is the patch shape + the engine
contract it consumes. Verified engine-side by `audit/probe-waitsweep.mts`:
ALL 12 levels accept `wait` post-completion and mutate canonical hash
(completed flag survives) — so the client-side signal is well-defined.

## The engine contract the client consumes

- `res.ok === true` on a commit issued when `state.completed === true`
  already → the board just folded post-verdict.
- `canonicalHash(level, state)` changes for accepted post-completion
  commits (proved on all 12 levels: hashChanged=true).
- `state.completed` remains `true` — the old verdict stays on record;
  only its freshness is invalidated.

## Patch shape for src/client/App.tsx

Wherever the commit result is applied (the same place that currently
drives the completed banner):

```ts
const [completedOnce, setCompletedOnce] = useState(false);
const [superseded, setSuperseded] = useState(false);

// in the commit handler, after engine commit resolves:
if (res.ok) {
  if (completedOnce) setSuperseded(true);   // late fold → stale verdict
  // ...existing state application...
}
// when completion first arrives:
if (newState.completed && !completedOnce) setCompletedOnce(true);
// verdict chip render:
{completedOnce && (
  <span className={superseded ? 'verdict stale' : 'verdict'}>
    {superseded ? 'Verdict superseded — board changed after completion' : 'Complete'}
  </span>
)}
```

Co-op note: the same applies to a peer's post-completion commit — mark
superseded on ANY accepted commit once completed, regardless of author.

## Files

- `src/client/App.tsx` (upstream) — superseded flag + banner; landing
  by coordinator since this tree cannot run the client.
- `audit/probe-waitsweep.mts` — the engine-side evidence (12/12 leak).
