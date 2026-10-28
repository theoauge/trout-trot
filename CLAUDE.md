# Trout Trot

A top-down mobile arcade game: a rainbow trout stranded on a bank of the Upper Iowa River near Decorah flops back into the water before it dries out. A web game in one HTML file, wrapped as an iPhone and Android app with Capacitor 8.

## How the owner wants us to work

- **Read the plan before making changes.** Lay out what will change, raise anything ambiguous as questions, and wait for approval before editing game code.
- **Team rules are in `TEAM-RULES.md`.** Read them too.
- **Commit locally only when the owner or the director asks. Never push to GitHub.** Rebuild the app after changes, but leave commits to that explicit go-ahead. Leave `trout-trot-app/android/.idea/*` out of commits. Screenshots and previews go in the session's scratchpad, or are root PNGs (git-ignored); never commit them.
- **Test before reporting:** syntax-check the game script, simulate the logic, and take screenshots for visual changes. Say plainly what wasn't verified on a real device.
- **A "Code Review" Claude session reviews batches of changes.** Check its findings against the code before fixing, and reply with what was fixed. If its address is stale, look it up with ListAgents.

## Layout

| Path | What it is |
|---|---|
| `flop-home.html` | **The game.** All HTML, CSS and JS in one file. Edit this. |
| `trout-trot-app/` | Capacitor app (app ID `com.thomas.trouttrot`, v1.1.001 build 1) |
| `trout-trot-app/www/index.html` | Generated from `flop-home.html` by `npm run build`. Never edit by hand. |
| `trout-trot-app/scripts/` | `build-www.mjs`, `make-icons.mjs`, `fetch-fonts.mjs`, `set-version.mjs` |
| `trout-trot-app/README.md` | App commands and the Android release steps |
| `SETUP-IPHONE.md` | Account steps for Codemagic + TestFlight (the owner has no Mac) |
| `codemagic.yaml` | Cloud iPhone build to TestFlight (needs the App Store Apple ID filled in) |
| `privacy-policy.html` | Store privacy policy, published as a claude.ai artifact (contact email still a placeholder) |

## Commands (run in `trout-trot-app/`)

- `npm run build`: rebuild `www/index.html` from `flop-home.html` with bundled fonts, then `cap sync` to both native projects. Run after every game change.
- `npm run icons` / `npm run fonts` / `npm run version:set -- <version> <build>`. Run `npm run build` after `version:set`, so `www/index.html` picks up the new version.

**Quick check of the game script:**
```
sed -n '/^<script>$/,/^<\/script>$/p' flop-home.html | sed '1d;$d' > /tmp/g.js && node --check /tmp/g.js
```

**Simulation:** eval the script with a stubbed `document`/canvas, replacing the final `})();` to expose internals (`makeLevel`, `update`, `draw`, `fish`, `eagles`, ...).

**Screenshots:**
- Use headless Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe --headless=new --screenshot --window-size=412,915 --virtual-time-budget=6000`) on a preview copy that forces the round, seeds `Math.random`, and clicks `startBtn` at the end of the **game's** script.
- Edge sometimes captures before the first frame.
- Headless Chrome won't render narrower than about 500px, so cards look off-center. That's an artifact.

## Game rules (current)

- **Coordinates:** the world is 860 units tall. Bank width = 600 + 40 per round, up to round 100 (`MAX_ROUND`). The camera scrolls. Logic keeps the river on the left; `flip` mirrors drawing and input.
- **Progress:** there's no score. The round is saved in localStorage (`trout-trot-round`), and play resumes from it. Try again replays the round.
  - Start over (start screen, two taps) resets to round 1.
  - Pause menu: Go to round, 1–400.
- **Round start:** moisture and eagles wait for the trout's first flop (`troutMoved`).
- **Autumn (rounds 1–99)**
  - "Autumn" banner at round 1.
  - Trees turn by species as `fall` goes 0→1: ash and hickory yellow, then sugar maple orange, red maple red, oak russet. Grass tufts sway in gusts.
  - Herons stand on logs: 1 per 10 rounds from round 10 (max 9 at 90–99). Reach 160; they cock, then strike.
  - Invisibility bubble from round 9 (6 s).
  - One eagle from round 5. Approach and circling get 5% faster per 10 rounds, compounding, to ×1.63 at round 100. The dive doesn't speed up.
- **Winter (round 100+)**
  - "Winter" banner. Dead grass, bare trees, a frozen river entered only through 4 ice-fishing holes (with ice fishers). Slippery ice. Springs stay open and steam. No herons, anglers or canoe.
  - Snow comes from `snowAt(n)`:
    - **cover:** 10→100% over rounds 100–110, 100% through 190, melting to 10% by 199 and staying there.
    - **depth:** a dusting through 110, deepening to 190, then melting.
    - **snowfall:** builds through 190 and stops by 199.
  - Ground snow is drawn as crisp blue-shadowed drifts plus a grain tile and glints.
  - Flops weaken 4% per 10 rounds to 60% at 190 (`flopScale`), and drying slows by the same factor.
  - **Weather** per round: 75% clear, 12.5% snowing, 12.5% storm. Haze beyond 260 / 150 units of the trout. Eagles circle longer and aim worse; in storms they abort 25% of pair dives. Red rings always draw above the haze.
  - **Eagles:** 2 (one pair) in rounds 100–149, 4 (two pairs, taking turns) from 150 on. Pairs circle opposite each other, then a coin flip picks one-two or pincer.
- **Dive fairness:** a ring only drops once the trout has landed. The warning is 0.6 s in autumn and 0.45 s ÷ flop strength in winter. Rings drift slowly (80 or 130 units/s × flop strength). The aim is to keep every dive escapable; verify with a reacting-player simulation after any eagle change.

## State

- **Last commit:** v1.1.001 cleanup on top of `v1.1.001` (readable version label, `version:set` updates the label, the device-specific `.idea/deploymentTargetSelector.xml` untracked and ignored, root PNGs ignored). Nothing is uncommitted.
- **Not yet verified on a device:** frame rate in winter, how the haze reads, pincer geometry near walls, the eagle difficulty feel, and ice sliding. iOS "1.1.001" is likely read as 1.1.1 by App Store Connect; confirm on the first TestFlight upload.
- **Not pushed anywhere:** no GitHub remote yet. iPhone builds go through Codemagic; see `SETUP-IPHONE.md`.
