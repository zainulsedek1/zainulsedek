# Zainul Sedek — Portfolio

**Structure (multi-page):**
- `index.html` — homepage (hero, work grid, systems, personal, about, services, contact)
- `styles.css` — shared styles for all case-study pages
- `work.html` — full portfolio grid (all clients, systems, personal), linked from the homepage "View all" links
- Case-study pages for the 7 live clients: `amina-rose.html`, `binggrae.html`, `chek-hup.html`, `china-airlines.html`, `genki-sushi.html`, `hot-and-roll.html`, `taiwan-excellence.html`

Deploy the whole folder. Each client card on the homepage links to its case-study page. Pages with real assets (Amina, Binggrae) are populated; the rest have the write-up ready and a placeholder for visuals you add later (same way we filled Binggrae).

A single-file portfolio site. No build step, no dependencies to install — just `index.html`.

## Deploy free on GitHub Pages
1. Create a public repo named **`yourusername.github.io`**
2. Upload `index.html` (and your `images/` folder) → commit
3. Settings → Pages → Deploy from branch → `main` / `root` → Save
4. Live at `https://yourusername.github.io` in ~1 minute

(Works the same on Netlify — just drag the folder onto the deploy area.)

## Add your images/videos later
Create a folder named **`images`** next to `index.html` and drop files in with these exact names.
Any slot without a matching file keeps its designed colour panel — nothing breaks.

| Slot | Filename |
|---|---|
| Hero (optional) | `images/hero.jpg` or `images/hero.mp4` |
| Profile photo | `images/profile.jpg` |
| Amina Rose (cover) | `images/amina-rose.jpg` |
| Amina Rose (lifestyle) | `images/amina-rose-2.jpg` |
| Amina Rose (recipe) | `images/amina-rose-3.jpg` |
| Chek Hup | `images/chek-hup.jpg` |
| Binggrae (images) | `binggrae.jpg`, `binggrae-2/3/4.jpg` |
| Binggrae (videos) | `binggrae-gif.mp4`, `binggrae-reels.mp4`, `binggrae-recap.mp4`, `binggrae-interview.mp4` (+ posters) |
| Binggrae (June campaign) | `binggrae-5.jpg` … `binggrae-12.jpg` |
| Binggrae (July campaign) | `binggrae-13.jpg` … `binggrae-19.jpg` |
| Chek Hup (Feb 2025) | `chek-hup.jpg`, `chek-hup-1.jpg` … `chek-hup-13.jpg`, `chek-hup-cover.jpg` |
| Chek Hup (videos) | `chek-hup-vt1.mp4` … `chek-hup-vt4.mp4` (+ posters) |
| China Airlines (Jan/Feb 2026) | `china-airlines.jpg`, `china-airlines-1.jpg` … `china-airlines-12.jpg` |
| China Airlines (video) | `china-airlines-video.mp4` (+ poster) |
| Genki Sushi (Sept) | `genki.jpg`, `genki-1.jpg` … `genki-8.jpg` |
| Genki Sushi (videos) | `genki-vt1.mp4` … `genki-vt3.mp4` (+ posters) |
| Taiwan Excellence (July 2026) | `taiwan-excellence.jpg`, `taiwan-excellence-1/2/3.jpg` |
| Taiwan Excellence (videos) | `taiwan-excellence-loop1/2.mp4`, `taiwan-excellence-vt1/2/3.mp4` (+ posters) |
| Hot & Roll (Jan/Feb 2025) | POV: `hot-roll-pov1..5`, `hot-roll-homemade/singgah/cubalagi`; Food: `hot-roll-food1..5`, `hot-roll-order/raya` (all .mp4 + posters) |
| China Airlines | `images/china-airlines.jpg` |
| Genki Sushi | `images/genki-salmon.jpg` |
| Hot & Roll | `images/hot-and-roll.jpg` |
| MFM Cap Ros | `images/mfm-cap-ros.jpg` |
| SJKP | `images/sjkp.jpg` |
| Taiwan Excellence | `images/taiwan-excellence.jpg` |
| Taj Mahal | `images/taj-mahal.jpg` |
| Teh Cap Panglima | `images/teh-cap-panglima.jpg` |
| Dragonfruit Brand | `images/dragonfruit.jpg` |
| Tapak Group (cover) | `images/tapak-group.jpg` |
| Tapak Group (case study gallery) | `tapak-group-1.jpg` … `tapak-group-6.jpg` (T'Dahlia ×2, T'Avenue ×1, T'Clover ×3) |
| Content Hub | `images/web-hub.jpg` |
| ContentOps Agent | `images/contentops.jpg` |
| Kanban Board | `images/kanban.jpg` |
| Claude Skills | `images/skills.jpg` |
| Gemini Omni | `images/gemini-omni.jpg` |
| TeaRai | `images/tearai.jpg` |
| ATELIER GPT | `images/atelier.jpg` |
| IOO E-book | `images/ioo-ebook.jpg` |
| Travel B-roll | `images/broll.jpg` |
| Prompt Packs | `images/prompt-packs.jpg` |

### Résumé button
Drop your CV (e.g. `zainul-resume.pdf`) next to `index.html`, then change the
"Download Résumé" link's `href="#"` to `href="zainul-resume.pdf"`.

### Hero video
Name it `images/hero.mp4` and swap the commented `<video>` block into the hero
(instructions are right there in the HTML).


## Images not showing on GitHub Pages?
This is almost always an upload issue, not a code issue. Check:
1. Your repo has `index.html` AND an `images/` folder at the SAME level (the root).
2. Click into `images/` on GitHub and confirm the `.jpg` / `.mp4` files are actually there.
3. If the folder is missing, re-upload: drag the CONTENTS of the unzipped folder (including `images/`) into GitHub's uploader, then commit.
4. A `.nojekyll` file is included to stop GitHub's Jekyll from interfering.

Easiest alternative: drag the whole unzipped folder onto Netlify. It handles nested folders reliably.