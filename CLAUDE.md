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
| `trout-trot-app/` | Capacitor app (app ID `com.thomas.trouttrot`, v1.1.002 build 1) |
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
- **Winter (rounds 100–199)**
  - "Winter" banner. Dead grass, bare trees, a frozen river entered only through 4 ice-fishing holes (with ice fishers). Slippery ice. Springs stay open and steam. No herons, anglers or canoe.
  - Snow comes from `snowAt(n)`:
    - **cover:** 10→100% over rounds 100–110, 100% through 190, melting to 10% by 199 and staying there.
    - **depth:** a dusting through 110, deepening to 190, then melting.
    - **snowfall:** builds through 190 and stops by 199.
  - Ground snow is drawn as crisp blue-shadowed drifts plus a grain tile and glints.
  - Flops weaken 4% per 10 rounds to 60% at 190 (`flopScale`), and drying slows by the same factor.
  - **Weather** per round: 75% clear, 12.5% snowing, 12.5% storm. Haze beyond 260 / 150 units of the trout. Eagles circle longer and aim worse; in storms they abort 25% of pair dives. Red rings always draw above the haze.
  - **Eagles:** 2 (one pair) in rounds 100–149, 4 (two pairs, taking turns) from 150 on. Pairs circle opposite each other, then a coin flip picks one-two or pincer.
- **Spring (round 200+; built in stages for v1.1.002, summer follows in 1.1.003, so 300–400 stay spring for now)**
  - Season comes from `seasonOf(n)` (autumn 1–99, winter 100–199, spring 200+); `winter` is the cheap flag for winter-only checks. `springAt(n)` gives `melt`, `green`, `leafOut`, `flood` and `blossom` (each 0–1).
  - Round 200 opens with a green "Spring" banner. Leftover snow patches are gone by 205. The ground goes from mud to full green by 240; the river runs high and brown at 200 and clears by 240 (looks only). A few old brown leaves vanish by 220.
  - Flowers: bluebells 200–230, trillium 219–261, dandelions 239–300 (small ground sprites in clusters). Hardwoods start bare, bud, and leaf out one by one (all in full leaf by 250); wild plums flower white around 231–249. Cedars stay green.
  - Weather per round: mostly clear, 20% rain (light grey haze, slanting rain streaks); from round 260 a further 1 in 7 is a thunderstorm (darker, heavier haze and rain, double lightning flashes every 4–9 s). Rain and storms dry the trout 10% slower (`drain` 0.9) and change nothing else. Rain is capped at 360 drops; red dive rings draw above haze and lightning.
  - **Ground and river rules (stage 3):**
    - Ice floes, rounds 200–215, drift downstream along the near bank (all together; every third slot is left empty, so there is always an open stretch of bank). They shrink and thin out each round, none from 216. A floe is solid footing, not water: `inRiver` ignores landings on one.
    - Mud patches (dark wet brown) cut a flop's length by 30% when the trout takes off from one. Most at 200, a few by 250, none from 253. Never near the start spot or the water's edge.
    - Puddles on rain and thunderstorm rounds only (4 on the widest banks): landing in one gives +15 moisture, once per visit (it re-arms when the trout leaves), with a small splash.
    - `flopScale` climbs smoothly from 0.6 at 200 to 1.0 at 250; drying scales with it as in winter, times 0.9 in rain.
    - Anglers return from round 205 (none at 200–204, while floes drift). Herons return at 210: 1, then one more every 20 rounds, max 5 (selected by `heronCount`, keyed on season). The canoe is back from 240.
  - **Threats (stage 4):**
    - Eagles: one in 200–249, then one pair (the winter pair logic, autumn dive style) from 250. The warning is `warn / flopScale`: 1.0 s at 200, easing to 0.6 s at 250, which is the intended recovery from winter.
    - Osprey (kind `'osprey'`, in the `eagles` list after the eagles): from round 210 one flies in, hovers over the trout (following it loosely), then drops a fixed ring at the hover point and plunges after `0.55 / flopScale` s (plus the time left in a hop, as for eagles). The ring never drifts, so leaving it always escapes. It rests 3–4.5 s between plunges. Two ospreys from 270, taking turns. Pale, see-through bird with a dark eye stripe; high chirp on the warning.
    - One strike warning at a time across all birds: an osprey waits for any eagle ring and the other osprey, and the eagles wait for the osprey, each with a 0.6 s gap (`ospreyBusy`, `lastEagleEnd`). Pincer rings of one pair still drop together.
  - Check rounds 1–199 with a before/after hash harness (screen set to 412x915, camera on the bank; compare runs that use the same round list) after any season change.
- **Dive fairness:** the red ring has a pale underlay so it reads on grass, snow and haze. A ring only drops once the trout has landed. The warning is 0.6 s in autumn and 0.45 s ÷ flop strength in winter. Rings drift slowly (80 or 130 units/s × flop strength). The aim is to keep every dive escapable; verify with a reacting-player simulation after any eagle change.

## State

- **Last commit:** `v1.1.002` spring (rounds 200–299: season setup, spring look and weather, ground and river rules, osprey and spring eagles; a bolder warning ring with a pale underlay in every season; version label and native versions 1.1.002). Nothing is uncommitted.
- **Not yet verified on a device:** frame rate in winter, how the haze reads, pincer geometry near walls, the eagle difficulty feel, and ice sliding. iOS "1.1.001" is likely read as 1.1.1 by App Store Connect; confirm on the first TestFlight upload.
- **Not pushed anywhere:** no GitHub remote yet. iPhone builds go through Codemagic; see `SETUP-IPHONE.md`.
