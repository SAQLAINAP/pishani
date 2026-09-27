# Decision log

These are the forks in the road for v0. For each one: what we picked, why, and what came second.

### 1. PWA and APK from one codebase (Vite + React + Capacitor)
- **Picked:** a single web app. Capacitor wraps the same `dist/` in an Android WebView.
- **Why:** one codebase gives us both deliverables. The toolchain and the GitHub Actions APK pipeline are the same ones Resume Forge already builds successfully.
- **Runner-up:** Preact, for a smaller bundle. The app is only around 7 screens (92 kB gzipped JS), so the saving wasn't worth leaving a proven setup. A native Kotlin app would have meant no PWA at all.

### 2. Tilt reads the gravity vector, not orientation angles
- **Picked:** only the z axis of gravity, the one pointing out of the screen.
  - **Preferred source:** Android's fused `GravitySensor` (accelerometer + gyro), which follows the rotation of a nod directly.
  - **Fallback:** raw `devicemotion.accelerationIncludingGravity` on iOS, or anywhere the sensor is blocked or silent for 600 ms. The raw accelerometer also picks up the head's forward jerk at the start of a nod, which briefly pulls z the wrong way and felt laggy on a real phone in v0.1.0.
- **Why:** on a forehead the phone stands upright, which puts `deviceorientation` beta at about 90°. That's where Euler angles hit gimbal lock and jitter.
  - Gravity has no singularity.
  - Upright, z ≈ 0. A nod forward swings it strongly negative and a look up swings it strongly positive.
  - Ignoring x and y means it works whichever way round the phone is in landscape, and even in portrait.
- **Details:**
  - Readings are smoothed with a light exponential moving average (weight 0.6, about one sample of lag at 60 Hz, down from 0.35). The fire/re-arm hysteresis handles jitter, so heavy smoothing only added delay.
  - A tilt fires past ~6 m/s² (about 38°), or 4.5 / 7.5 on the High / Low sensitivity settings.
  - The detector re-arms only after the phone has been back upright (under 3 m/s²) for 150 ms. That's what stops one nod counting twice.
  - The upright baseline is recalibrated at the start of each round, because foreheads lean back.
  - iOS reports gravity with the opposite sign, so `normaliseZ` flips it.
- **Tested:** `src/game/tilt.test.ts` covers nods, held nods, wobble, jitter and sensitivity. An end-to-end run fed synthetic `devicemotion` events into headless Chrome.
- **Can't test here:** how it *feels* on a real phone. That's what the sensitivity setting is for.

### 2b. Tilt tuning after testing on a real phone (v0.1.1 → next)
Your feedback was that looking up felt weaker than nodding down, and that some tilts were registered as passes when they shouldn't have been. The fixes:
- **Pure gravity on the fallback path.** Android WebView probably doesn't expose `GravitySensor`, so most phones read `devicemotion`. That event also reports linear acceleration, from Android's fused linear-acceleration sensor. Subtracting it leaves just gravity, so the forward jerk at the start of a sharp nod no longer shows up as a spike in the pass direction.
- **Hold for 30 ms.** A tilt has to stay past the threshold for about 3 samples. Jerk spikes last one or two. The cost is about 17 ms of extra latency.
- **Looking up needs 75% of the nod angle.** Tipping your head back with a phone pressed to it is a smaller movement, and most Heads Up-style games make up easier than down.
- **Rebound guard.** After a verdict, the opposite direction stays locked for 400 ms from the moment the head is back upright. That stops "nod down, swing back up past upright" from counting as a pass. It fits inside the 420 ms card flash, so it never blocks a real answer.

### 2c. Back navigation
- **One handler stack.** Whatever is on top handles a back press: the open sheet or dialog, otherwise the current screen.
- **Sources:** Android's hardware back and back gesture arrive through `@capacitor/app`'s `backButton`. The browser uses a history sentinel that is re-armed after every press.
- **Behaviour:**
  - Settings and Results go back to Home.
  - An open sheet closes.
  - During a round, back works like Quit: the first press arms it and the second quits. That way a stray edge swipe can't throw a round away.
  - On Home, back asks "Leave Pishani?", with Stay as the red primary. Back again, or Stay, dismisses it. Leave closes the app.

### 3. Tilt mode starts itself
The countdown starts once the phone has been held upright for 0.9 s. Holding it naturally in your hand tips the screen back and doesn't trigger it. You can also tap to start.

### 4. Swipe down = correct
This matches the direction of the tilt-mode nod, so both modes share one mental model.
- **Runner-up:** swipe up = correct, which reads as a "thumbs up".
- **To flip it:** it's a one-line change in `src/game/swipe.ts`.

### 5. Swipe is always armed
In tilt mode, swiping still works as a fallback. If no motion data arrives within 1.8 s, the round switches to swipe hints and on-screen buttons. That makes it playable on desktops and on phones with a missing or blocked sensor.

### 6. Storage: memory plus localStorage, one versioned name
- **How it's read:** the brief asked for "in-memory persistent storage". That's taken to mean state lives in memory while the app runs and is mirrored to `localStorage` so it survives restarts.
- **What it holds:** settings, best score per deck, the last 20 rounds, and the seen-words list per deck.
- **Failure handling:** corrupt data or an unknown version falls back to defaults. If storage throws (private mode, quota), the app keeps working from memory.
- **Why not IndexedDB:** nothing here is big or relational.

### 7. No-repeat shuffle bag, persisted
Each deck remembers which words it has shown. Unseen words come first in random order, then seen ones as a fallback, and the bag resets once the whole deck has come up. Without this, repeats become obvious after a few rounds on a ~110-card deck.

### 8. Deck content rules
- **Recognisable first:** every entry had to be well known to a typical urban Indian player.
- **Accuracy:** entries use real spellings. For the brand decks, the Indian deck only has brands founded in India. Maggi, for example, goes in International.
- **Politics:** people are included if they're famous *mainly* for film or sport, even if they later had a political career. Examples: Hema Malini, Kamal Haasan, Gambhir. People famous mainly as politicians are left out, and so are disputed territories.
- **Countries:** sovereign states only.
- **Tone:** no adult-only or controversial titles. Mirzapur and Sacred Games stay in because they were asked for by name.
- **Checks:** `src/data/decks.test.ts` enforces at least 60 cards per deck, no duplicates, no stray whitespace and a maximum length.

### 9. Montgomery brutalism, as implemented
- **Sources:** concrete civic architecture (slabs, board-form texture, cantilevered mass), the Swiss style (grid, grotesk, index numbers) and a dose of anti-design.
- **Hard rules in CSS:** `border-radius: 0` everywhere, no blur shadows, and one accent colour (Swiss red). Green, orange and red appear only as full-screen feedback.
- **Offline-friendly:** texture comes from an inline SVG `feTurbulence` plus CSS gradients, so there's nothing to download and nothing to miss offline.
- **Word display:** during a round the word sits on an ink slab in paper-coloured type, the highest contrast available for friends reading from across a room. `FitText` binary-searches the largest font size at which the word fits without breaking mid-word.

### 10. Landscape during a round, free otherwise
- **Android:** `@capacitor/screen-orientation` locks landscape for the round and unlocks it afterwards. The manifest uses `fullUser`.
- **Browser:** the web API only allows an orientation lock in fullscreen, so touch devices go fullscreen when the round starts. Everything else just adapts, since the play layout is built to work in both orientations.

### 11. Git identity and gitleaks
- **Identity:** the repo sets its own git identity (SAQLAINAP, noreply email), and pushes use the SAQLAINAP `gh` token. The machine's global identity is never used.
- **Before every commit:** we run `gitleaks dir .` and avoid names like `token` or `key` for ordinary identifiers. The storage slot is `STORAGE_NAME`, for example.
