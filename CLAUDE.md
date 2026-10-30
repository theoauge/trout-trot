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
| `trout-trot-app/` | Capacitor app (app ID `com.thomas.trouttrot`, v1.1.004 build 1) |
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
- **Back (Android):** the native app handles the back button and edge-swipe back gesture through Capacitor's App plugin (absent in the plain web build, which skips it): in a round it pauses, when paused it resumes, during the ending it skips the scene, and on the start screen, the game-over card and the ending card it asks "Leave Trout Trot?" (Stay / Leave). `MainActivity.java` also asks Android (API 29+) to leave a 200 dp strip on each side edge to the app, so edge swipes in play reach the game instead of being the back gesture.
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
- **Spring (rounds 200–299)**
  - Season comes from `seasonOf(n)` (autumn 1–99, winter 100–199, spring 200–299, summer 300–399, finale 400); `winter` is the cheap flag for winter-only checks. `springAt(n)` gives `melt`, `green`, `leafOut`, `flood` and `blossom` (each 0–1).
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
- **Summer (rounds 300–399; v1.1.003)**
  - "Summer" banner in warm gold at 300. Deep green grass, longer tufts, dark green trees, no fallen leaves; black-eyed Susans from 300 and purple coneflowers from 310. The river is low and clear, with a wide pale shallow edge and a few dragonflies. No mud, floes or puddles.
  - **Heat:** drying is `summerHeat()` = ×1.15 at 300 rising to ×1.25 at 399 (so 12.65/s at 300 against spring's 11). A heat wave round adds ×1.15 and a warm shimmer tint (no haze).
  - **Shade:** about 35 lone shade trees (one per ~115 units of bank, random heights, never on the start spot) are built per round as canopy sprites. The ground under one is a dark soft patch and a trout standing in it dries ×0.6 (`SHADE_DRAIN`); the canopy is drawn see-through over the trout. About 22% of the bank is shaded and every straight route to the river crosses some.
  - **Weather** per round: 65% clear, 15% heat wave, 10% downpour (heavy rain, haze, drying ×0.9 and +2 moisture/s while it falls), 10% wind. Wind: gusts push a trout that is in the air sideways along the river (up to 110 units/s, about 50 units over a flop, one direction per round, `windDir`); grass bends and leaves blow the same way.
  - Rounds 390–399: `fall` rises to 0.35, so a few trees and tufts begin to turn yellow and orange. Eagle pair and ospreys continue as in late spring; herons stay at 5.
  - **Summer stage 2:**
    - Shade sprites are pooled: six canopy canvases per round (about 0.8 MB, down from about 4.6 MB), each tree picking the nearest size and drawn flipped and turned. The shade hit-test still uses each tree's own radius.
    - Tall grass: about 18 patches per bank. A trout inside one is hidden from the birds (`visibleTrout` is null): an eagle or osprey that has not dropped its ring loses track, a ring already down still strikes. Flops that start in tall grass are ×0.8 (`TALL_SLOW`). Never on the start spot.
    - Gravel bars: 6–8 pale shoals push the water's edge out 28–50 units. `edgeAt(y)` = `shoreAt(y)` minus the bar; `inRiver`, the river hint and the drawing all use it.
    - Floaters: 3 canoes and 4 tubers drift down the river (the old single canoe is off in summer). Landing in one bumps the trout back onto the bank (`bumpFish`, no harm). The river edge is always at least 73% clear.
    - Dusk: 20% of summer rounds at 300 rising to 35% at 399. Dark and warm with a short sight around the trout, fireflies (none with reduced motion), weather forced clear, one eagle and no osprey.
    - Raccoon (dusk rounds only): appears 3.5–5.5 s after the first flop from the far end of the bank with an eyeshine glint and a chitter, walks at 170 units/s (×0.55 in tall grass) straight at the trout, stays out of the river, catches a trout on the ground within 26 units ("Caught by a raccoon"). Full-power flops toward the water always escape (closest approach 199 units in tests); weak hops and standing still do not. The invisibility bubble freezes it.
- **Finale (round 400, "The Eagle's Nest"; v1.1.004 stages A and B: the boss fight and the ending)**
  - Its own level (`seasonOf` = 'finale', `boss` non-null only here; `bossLook` is '', 'autumn', 'snow' or 'storm'). A short, wide bank (`FINALE_WW` 1100: about 780 units from the start to the edge), 14–15 lures (boulders, stumps, logs) on a 5 × 3 grid so every spot is within 262 units of a lure's edge (one full flop is about 298), 4 springs, drying ×0.3. Banner "The Eagle's Nest". A giant cottonwood by the river holds a stick nest with two eaglets that peek and squawk.
  - The river is shut until the boss is beaten: `inRiver` is false and the trout bounces off the bank's edge, with a golden dashed rope along the edge, a "River closed" tag and a "The river is closed until the Great Eagle is beaten" message.
  - **The Great Eagle** (kind 'great'; about twice the size of the others, pale head, scarred beak) uses the ring-and-dive system with the pale underlay. Three feathers (icons under the moisture bar). When its dive lands with the ring centre within `LURE_PAD` (20 units beyond a lure's edge, shown as a faint dashed golden outline around every lure that still works) of a lure it slams into it: stunned 1.5 s with stars, a feather lost, the lure cracked (a used lure never works again), and the next phase starts with a quick flash and a banner. A miss on open ground angers it (next rest shorter, up to −0.9 s). Being caught in any phase restarts the whole fight (Try again).
  - In the finale rocks and logs stop the trout beside them (bounce 0.05 instead of 0.45), so a hop aimed at a rock leaves it 12–15 units from the edge, inside the pad, on grass and ice alike; that is the lure's skill. Pure dodgers (never near a rock) win 0 of 12 fights; a bot that hops at rocks and flops off the ring just before the strike wins about 9 in 10.
  - The Great Eagle is drawn by `drawGreatBird`: dark brown wings edged and streaked with lighter feathers, white head and tail, golden beak (scarred) and talons; a little see-through while hovering over its ring.
  - Phase 1 Autumn, the Watch: the Great Eagle alone, warning 1.0 s, ring radius 100, no drift, circle 3.2 s, rest 5.0 s; hint "Lure its dive onto a rock!" at the first dive. Phase 2 Winter, the Pair: snow and slippery ice everywhere (`onIce`), its mate drops a second ring (radius 78) to one side at the same time (it cannot be lured), warning 0.9 s. Phase 3 The Storm: thunder, rain and a wind that pushes the trout in the air; the ring drifts after the trout at 90 units/s but commits for the last 0.4 s; every 7–9 s an osprey swoops in and the eagle flies in smoothly to meet it; the whole squabble takes about 2.5 s (2.2–2.9), during which the eagle cannot dive. The osprey never strikes.
  - After the third feather the eagle flees to its nest and the river opens. Reaching the water starts the ending (`startEnding`, mode 'ending', about 10.5 s, 6 s with reduced motion; a tap, Space or Enter skips it, and it can be paused): the Great Eagle lands at the nest with empty talons while the eaglets complain, then the trout swims upstream into cool shaded water. Then the ending card (mode 'endcard', `showEndCard`): run stats, credits, and the menu: Fight again (round 400), Go to round (1–400, same two-tap rule for going back), Start over (two taps; also resets the stats). The saved round stays 400.
  - **Run stats** (`stats`, localStorage `trout-trot-stats`, saved on every round, loss and ending and every 15 s): rounds cleared by playing (Go to round adds none), flops, times lost (caught or dried out), time played. They count from the version that added them (`stats.since`); a player who already had saved progress gets a note that earlier rounds are not included. Start over resets them.
  - Credits name only the game, the river and Decorah, and the version (the repo does not name an author).
  - `updateBoss` runs the three birds (they sit in `eagles` with `boss: true`, so drawing, catching and standing down are shared; `updateEagle` skips them).
- **Storm rounds** (the winter 'snowstorm' roll, rounds 100–199, and the spring 'thunder' roll, 260–299; never the finale): `squall` is non-null. The eagles, ospreys and herons shelter (none are created) and the banner line adds "Eagles sheltering".
  - **Gusts** (`updateSquall`): a calm spell (3.4–5.2 s, shorter later), a 1 s warning, then 1.6 s of gust, each in its own direction (down, up, away from the river twice as often, diagonals, toward the river). During the warning the rain and snow streaks swing to the new direction, the grass flattens, and there is a whoosh. A gust shoves a trout in the air by up to 240–380 units/s (`peak`; summer's wind is 110) and, on winter ice, pushes it along the ground so it slides. In the snowstorm a flop into a gust is up to 30% weaker. The trout is always clamped inside the bank (walls and trees as before).
  - **Snowstorm whiteouts:** every 6–15 s the sight radius closes in to half and recovers over about 3 s.
  - **Thunderstorm lightning:** a yellow-white dashed warning ring (dark underlay, unlike the red bird rings; radius 70, about 1 s, plus the rest of a hop in progress) drops only once the trout is on the ground; at the end a bolt strikes, and a trout inside the ring and below the usual reach height is "Struck by lightning". One strike at a time, every 5.5–8 s early in the season down to 2.5–5 s by round 299. The old visual flashes stay.
  - Everything scales with `squall.sev` (0 at round 100 or 260, 1 at 199 or 299).
- **Dive fairness:** the red ring has a pale underlay so it reads on grass, snow and haze. A ring only drops once the trout has landed. The warning is 0.6 s in autumn and 0.45 s ÷ flop strength in winter. Rings drift slowly (80 or 130 units/s × flop strength). The aim is to keep every dive escapable; verify with a reacting-player simulation after any eagle change.

## State

- **Last commit:** `v1.1.004`: the Great Eagle finale, ending and stats, storm rounds, the Android back gesture and the shorter swipe buffer, on top of `v1.1.003`. Nothing is uncommitted. Not yet reviewed on a device or released.
- **Not yet verified on a device:** frame rate in winter, how the haze reads, pincer geometry near walls, the eagle difficulty feel, and ice sliding, summer frame rate (draw work is about 30–60% above late spring: tall grass blades, canopies and floaters are the likely costs) and whether summer routes feel fair now that a trout needs a spring stop on the way. iOS "1.1.003" is likely read as 1.1.3 by App Store Connect; confirm on the first TestFlight upload.
- **Not pushed anywhere:** no GitHub remote yet. iPhone builds go through Codemagic; see `SETUP-IPHONE.md`.
