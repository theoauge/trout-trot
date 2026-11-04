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
| `trout-trot-app/` | Capacitor app (app ID `com.thomas.trouttrot`, v1.1.007 build 7) |
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

- **Coordinates:** the world is 860 units tall. Bank width = 600 + 40 per round, up to round 100 (`MAX_ROUND`), capped at 4104 in every season (`MAX_WW`, reached at round 89; intended). The camera scrolls. Logic keeps the river on the left; `flip` mirrors drawing and input.
- **Progress:** there's no score. The round is saved in localStorage (`trout-trot-round`), and play resumes from it. Try again replays the round.
  - Start over (start screen, two taps) resets to round 1.
  - Pause menu: Go to round, 1–400.
- **Back (Android):** the native app handles the back button and edge-swipe back gesture through Capacitor's App plugin (absent in the plain web build, which skips it): in a round it pauses, when paused it resumes, during the ending it skips the scene, and on the start screen, the game-over card and the ending card it asks "Leave Trout Trot?" (Stay / Leave). `MainActivity.java` also asks Android (API 29+) to leave a 200 dp strip on each side edge to the app, so edge swipes in play reach the game instead of being the back gesture.
- **Ground and grass (v1.1.005):** one warm brown (`GROUND_BROWN` #94764d) under every season and the finale, wetter in spring (`GROUND_WET` #7d6240); snow, grass and flowers sit on top. Every season has 7.8× the v1.1.004 grass tufts (see Grass drawing): the original tufts still draw their `Math.random` numbers exactly as before, and the extra ones come from the grass's own seeded random stream (`grassRng`), so the rest of a round's layout, weather and birds are unchanged.
- **Grass drawing (v1.1.007):** looks only; layouts and random streams are unchanged.
  - **Tuft stamps:** `grass` is `{tufts, variants, atlas}`. Each round has `GRASS_V` (24) tuft variants (3–6 blades in the season's colours, 2 px butt-cap two-segment blades, `bladeScale` / finale length scale) made by `makeVariants` from `grassRng`. `buildAtlas(sc)` draws them once at the real pixel scale (`dprNow` × `view.s`) with `GRASS_F` (43) lean frames from −`GRASS_R` to +`GRASS_R` (1.0, about 0.048 rad per frame), `GRASS_COLS` (24) columns, built lazily on the first draw and rebuilt when the scale changes (about 18 MB at dpr 2, about 28 MB in summer). A new round or finale phase makes a new `grass`, so everything rebuilds.
  - **Tufts:** `{x, y, v}`, sorted by x. The count is the original loop plus `Math.round(count × GRASS_EXTRA)` (6.8) from `grassRng` (7.8× in all). The original loops still consume `Math.random` exactly as in v1.1.004 (the results are discarded, only positions are kept), and the variant picks come from `grassRng`.
  - **Wind:** every tuft uses the same lean at any moment: `SWAY_DIR` (+x) × (`SWAY_BASE` 0.08 + `SWAY_SWING` 0.4 × `swayWave(t)`), `swayWave` a smooth −1..+1 from two slow sines (`SWAY_SPEED` 1 = a full swing about every 4.5 s). The grass swings through upright to the other side (about −0.32 to +0.48 rad). Storm lean is added on top: the sideways part (`leanX`) into the same lean, with the direction following the gust's sign; the along-the-blade part stretches the stamp from its base (`leanY`, quantized to 0.1 steps, clamped 0.4–1.6). The lean picks one atlas frame `j`.
  - **Cached layer:** `drawGrassLayer` keeps one offscreen canvas at the real pixel scale, `view.w` + 2 × `GRASS_MARGIN` (160) wide, and redraws all the tufts into it (`drawStamps`, one `drawImage` per tuft) only when the frame, the stretch, the camera's reach (the screen ±20 passing the layer's edge), the round or finale phase, the scale or the view width changes; otherwise it is blitted at its own world position, so it stays locked to the world. About 4.6 redraws a second in calm rounds, bursts of about 15 a second during storm gusts (stubbed tests). There is no per-blade path work, no 30 fps layer and no frame-time thinning.
  - **Reduced motion:** with no wind or storm lean, `drawGrassStill` draws the still grass once (from the stamps, upright frame) into 512-unit chunk canvases at the screen's pixel scale (`GRASS_CHUNK`), keeps only the chunks on screen, and blits them. The cache key is the `grass` object and the scale. `window.__grass()` reports `{tufts, drawn, renders, rps, atlasMB, chunks}` for the bot tester; `GRASS_DEBUG` (false) draws "grass r/s" in the corner for test builds.
  - **Looks to check on a device:** the swing's steps (about 2.7°), the soft look of tufts blitted at fractional positions, and frame cost with the layer redraws (about 4,500–4,900 `drawImage` per redraw at 7.8×).
- **Charms (v1.1.006):** four bonuses that stack, kept in localStorage `trout-trot-charms` (a JSON list of ids; missing or corrupt data counts as none, unknown ids are dropped) next to the saved round.
  - **Keen Eye** (`eyeBonus`, +0.2 s on every warning, added after any cap): `diveWarn` (eagles, pairs, trio rings), the osprey warning, the Great Eagle's `P.warn`, the lightning warning (after `LIGHT`'s cap) and the heron's cock time.
  - **Thick Skin** (`SKIN_DRAIN` 0.9): the last factor in `drainRate`.
  - **Slick Scales** (`SLICK_FLOP` 1.1): in `launch` and the swipe preview only, not in `flopScale`, so warnings and drying are unchanged.
  - **Lucky Fin** (`luckyFin`, 15%, `FIN_GRACE` 0.5 s): checked at each catch: eagle and osprey strike, heron strike, lightning, both Great Eagle hits, and the raccoon (it backs off for 1.5 s). The attacker misses as on a normal miss, the trout flashes gold, "Lucky Fin!" shows and is announced. During the grace window any strike is ignored. Never applies to drying out.
  - **Earning:** the picker (`openCharmPicker`, `charmCount`, `charmsDue`) shows after clearing rounds 99, 199, 299 and 399 (one of the charms not yet owned; at 399 a single "You earned" card). **Go to round N** clears the charms and asks for the normal number for N (1–99: 0, 100–199: 1, 200–299: 2, 300–399: 3, 400: all four, granted without asking); **Start over** clears them; a saved round past 99 with no charm data gets the same prompt on load; retrying a round changes nothing. Owned charms show as small icons under the moisture bar, in the pause card and on the ending card.
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
  - **Eagles:** 2 (one pair) in rounds 100–149; from 150 on 3, one trio. Pairs circle opposite each other, then a coin flip picks one-two or pincer. The trio circles 120° apart and picks at random: **chain** (a ring, then one where the trout landed, then a third), **net** (three rings at once, `NET_SPREAD` 1.6 ring-radii out, one open gap in a direction a normal flop can reach) or **chaser** (a pincer, then the third drops where the trout landed). The trio rests 2 s plus up to 1 s between hunts (`TRIO_REST`). Rings still wait for the trout to be on the ground.
- **Spring (rounds 200–299)**
  - Season comes from `seasonOf(n)` (autumn 1–99, winter 100–199, spring 200–299, summer 300–399, finale 400); `winter` is the cheap flag for winter-only checks. `springAt(n)` gives `melt`, `green`, `leafOut`, `flood` and `blossom` (each 0–1).
  - Round 200 opens with a green "Spring" banner. Leftover snow patches are gone by 205. The ground is wet brown mud all spring (the grass and flowers green up on top of it by 240); the river runs high and brown at 200 and clears by 240 (looks only). A few old brown leaves vanish by 220.
  - Flowers: bluebells 200–230, trillium 219–261, dandelions 239–300 (small ground sprites in clusters). Hardwoods start bare, bud, and leaf out one by one (all in full leaf by 250); wild plums flower white around 231–249. Cedars stay green.
  - Weather per round (v1.1.005): never clear. Each round is rain (light grey haze, slanting rain streaks) or, from round 200, a thunderstorm (darker, heavier haze, rain, lightning): 30% thunderstorm, 70% if the round before was one (`wxMemo`, in memory only; only moving on to the next round chains, so Go to round, Start over and the step from winter use 30%). A replayed (lost) round keeps its weather (`retryWx`). Rain and storms dry the trout 10% slower (`drain` 0.9). Rain is capped at 360 drops; red dive rings draw above haze and lightning.
  - **Wet ground:** the whole bank is mud. Every flop is 10% shorter (`SPRING_MUD` 0.9, folded into `flopScale`, so bird and lightning warnings lengthen to match; `thawScale` is the thaw part alone). Drying is ×0.8 (`SPRING_DRAIN`, on `thawScale`, not on the mud factor): about 75% of spring rounds cleared in bot tests (storms ~62%, rain ~89%). No moisture ponds are placed in spring. The old mud patches and rain puddles are gone.
  - **Ground and river rules (stage 3):**
    - Ice floes, rounds 200–215, drift downstream along the near bank (all together; every third slot is left empty, so there is always an open stretch of bank). They shrink and thin out each round, none from 216. A floe is solid footing, not water: `inRiver` ignores landings on one.
    - `thawScale` climbs smoothly from 0.6 at 200 to 1.0 at 250, times the mud 0.9 for `flopScale`.
    - Anglers return from round 205 (none at 200–204, while floes drift). Herons return at 210: 1, then one more every 20 rounds, max 5 (selected by `heronCount`, keyed on season). The canoe is back from 240.
  - **Threats (stage 4):**
    - Eagles: one in 200–249, then one pair (the winter pair logic, autumn dive style) from 250. The warning is `warn / flopScale`: 1.0 s at 200, easing to 0.6 s at 250 (flopScale now includes the spring mud ×0.9, so the numbers are about 11% longer), which is the intended recovery from winter.
    - Osprey (kind `'osprey'`, in the `eagles` list after the eagles): from round 210 one flies in, hovers over the trout (following it loosely), then drops a fixed ring at the hover point and plunges after `0.55 / flopScale` s (plus the time left in a hop, as for eagles). The ring never drifts, so leaving it always escapes. It rests 3–4.5 s between plunges. Two ospreys from 270, taking turns. Pale, see-through bird with a dark eye stripe; high chirp on the warning.
    - One strike warning at a time across all birds: an osprey waits for any eagle ring and the other osprey, and the eagles wait for the osprey, each with a 0.6 s gap (`ospreyBusy`, `lastEagleEnd`). Pincer rings of one pair still drop together.
  - Check rounds 1–199 with a before/after hash harness (screen set to 412x915, camera on the bank; compare runs that use the same round list) after any season change.
- **Summer (rounds 300–399; v1.1.003)**
  - **Shelter (v1.1.005):** a trout on the ground (`z < 20`) under a shade tree (`shadeAt`) is hidden from birds and herons, like the invisibility bubble (`visibleTrout` is null): hunters that have not dropped a ring leave, teams drop no new ring (pair or trio), a heron will not start to cock, but a ring already down still strikes (a cocked heron strikes whatever the shade; only the invisibility bubble calls it off). Shade trees start at least 170 units from the water, so the home edge is never sheltered, and drying still runs (×0.6).
  - "Summer" banner in warm gold at 300. Deep green grass, longer tufts, dark green trees, no fallen leaves; black-eyed Susans from 300 and purple coneflowers from 310. The river is low and clear, with a wide pale shallow edge and a few dragonflies. No mud, floes or puddles.
  - **Heat:** drying is `summerHeat()` = ×1.15 at 300 rising to ×1.25 at 399 (so 12.65/s at 300 against spring's 11). A heat wave round adds ×1.15 and a warm shimmer tint (no haze).
  - **Shade:** about 35 lone shade trees (one per ~115 units of bank, random heights, never on the start spot) are built per round as canopy sprites. The ground under one is a dark soft patch and a trout standing in it dries ×0.6 (`SHADE_DRAIN`); the canopy is drawn see-through over the trout. About 22% of the bank is shaded and every straight route to the river crosses some.
  - **Weather** per round: 65% clear, 15% heat wave, 10% downpour (heavy rain, haze, drying ×0.9 and +2 moisture/s while it falls), 10% wind. Wind: gusts push a trout that is in the air sideways along the river (up to 110 units/s, about 50 units over a flop, one direction per round, `windDir`); grass bends and leaves blow the same way.
  - Rounds 390–399: `fall` rises to 0.35, so a few trees and tufts begin to turn yellow and orange. Eagle pair and ospreys continue as in late spring; herons stay at 5.
  - **Summer stage 2:**
    - Shade sprites are pooled: six canopy canvases per round (about 0.8 MB, down from about 4.6 MB), each tree picking the nearest size and drawn flipped and turned. The shade hit-test still uses each tree's own radius.
    - Tall grass patches were removed in v1.1.007 (no hiding, no slower flops, no slower raccoon). The patch placement code still draws the same random numbers in the same order and throws the result away, so every summer round's trees, birds and weather are unchanged.
    - Gravel bars: 6–8 pale shoals push the water's edge out 28–50 units. `edgeAt(y)` = `shoreAt(y)` minus the bar; `inRiver`, the river hint and the drawing all use it.
    - Floaters: 3 canoes and 4 tubers drift down the river (the old single canoe is off in summer). Landing in one bumps the trout back onto the bank (`bumpFish`, no harm). The river edge is always at least 73% clear.
    - Dusk: 20% of summer rounds at 300 rising to 35% at 399. Dark and warm with a short sight around the trout, fireflies (none with reduced motion), weather forced clear, one eagle and no osprey.
    - Raccoon (dusk rounds only): appears 3.5–5.5 s after the first flop from the far end of the bank with an eyeshine glint and a chitter, walks at 170 units/s straight at the trout, stays out of the river, catches a trout on the ground within 26 units ("Caught by a raccoon"). Full-power flops toward the water always escape (closest approach 199 units in tests); weak hops and standing still do not. The invisibility bubble freezes it.
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
- **Storm rounds** (the winter 'snowstorm' roll, rounds 100–199, and the spring 'thunder' roll, 200–299; never the finale): `squall` is non-null. The eagles, ospreys and herons shelter (none are created) and the banner line adds "Eagles sheltering".
  - **Gusts** (`updateSquall`): a calm spell (3.4–5.2 s, shorter later), a 1 s warning, then 1.6 s of gust, each in its own direction (down, up, away from the river twice as often, diagonals, toward the river). During the warning the rain and snow streaks swing to the new direction, the grass flattens, and there is a whoosh. A gust shoves a trout in the air by up to 240–380 units/s (`peak`; summer's wind is 110) and, on winter ice, pushes it along the ground so it slides. In the snowstorm a flop into a gust is up to 30% weaker. The trout is always clamped inside the bank (walls and trees as before).
  - **Snowstorm whiteouts:** every 6–15 s the sight radius closes in to half and recovers over about 3 s.
  - **Thunderstorm lightning:** a yellow-white dashed warning ring (dark underlay, unlike the red bird rings; radius 75 widening to 105 through the season (`strikeR()`), 0.75–1.2 s, plus the rest of a hop in progress) drops only once the trout is on the ground; at the end a bolt strikes, and a trout inside the ring and below the usual reach height is "Struck by lightning". One strike at a time, in spring (v1.1.005) all of this eases with severity (`LIGHT`): the gap between strikes is 2.4–3.4 s at round 200 shortening to 0.7 s late, the ring widens from 75 to 105 units, and the warning is `(1.0 − 0.1 × sev) / flopScale` capped at 1.2 s at round 200 down to 0.75 s at 299 (verified escapable at a 0.4 s reaction). The old visual flashes stay.
  - Everything scales with `squall.sev` (0 at round 100 or 200, 1 at 199 or 299).
- **Dive fairness:** the red ring has a pale underlay so it reads on grass, snow and haze. A ring only drops once the trout has landed. The warning is 0.6 s in autumn and 0.45 s ÷ flop strength in winter. Rings drift slowly (80 or 130 units/s × flop strength). The aim is to keep every dive escapable; verify with a reacting-player simulation after any eagle change.

## State

- **Last commit:** `v1.1.007` (build 7): grass as stamped tufts (7.8× density) with a uniform swing through upright on a cached layer, summer tall grass removed, on top of `v1.1.006` (the four charms). Not yet reviewed on a device or released; the owner has seen the stamps on the Pixel and liked them.
- **Not yet verified on a device:** frame rate in winter, how the haze reads, pincer geometry near walls, the eagle difficulty feel, and ice sliding, summer frame rate (canopies and floaters are the likely costs) and whether summer routes feel fair now that a trout needs a spring stop on the way. iOS "1.1.003" is likely read as 1.1.3 by App Store Connect; confirm on the first TestFlight upload.
- **Not pushed anywhere:** no GitHub remote yet. iPhone builds go through Codemagic; see `SETUP-IPHONE.md`.
