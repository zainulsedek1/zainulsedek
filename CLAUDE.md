# CLAUDE.md — Zainul Sedek Portfolio

Context handoff for Claude Code. Read this first. It captures the project, the
design system, the brand voice, what's been built, and the open tasks so you can
continue seamlessly.

## Project

- Personal portfolio for **Zainul Sedek** — Content & Brand Strategist, Kuala Lumpur.
- **Static multi-page site.** Plain HTML + CSS, GSAP for motion. No build step, no framework, no dependencies to install.
- **Repo:** `~/Documents/GitHub/zainulsedek` (this folder). Hosted on **GitHub Pages**.
- **Live URL:** https://zainulsedek1.github.io/zainulsedek/
- **Deploy:** commit to `main` and push. GitHub Pages rebuilds in ~1 min. A `.nojekyll` file is present — keep it.
- Note: the repo lives in iCloud Drive and the user's **iCloud storage is full**, so files may show sync "Error" badges. This does not affect git; local files are the source of truth.

## File structure

- `index.html` — homepage. Self-contained: its CSS lives in a `<style>` block in the head, JS in a `<script>` at the end. Sections: nav, hero, marquee, manifesto, work grid (2 featured cards), about, proof/stats, services, contact, footer.
- `styles.css` — **shared** stylesheet for all case-study pages and `work.html`.
- `work.html` — full portfolio grid, links to every case-study page.
- Case-study pages (one per client): `amina-rose.html`, `binggrae.html`, `chek-hup.html`, `china-airlines.html`, `genki-sushi.html`, `hot-and-roll.html`, `taiwan-excellence.html`, `tapak-group.html`, `akisyah.html`.
- `images/` — all images/videos. The user maintains this folder; follow existing naming exactly. Any missing image falls back to a designed colour panel (never a broken image).
- `README.md` — image filename map and deploy notes.
- `zainul-resume.pdf` — the résumé (see open tasks).

## Design system (current — the redesign may evolve it, but know the baseline)

Fonts (Google Fonts): **Fraunces** (serif, headings — often italic for accent words) + **Space Grotesk** (sans, body/UI).

Palette (CSS variables in `:root`):
- `--bone #F5EEE1` (bg), `--bone-2 #EFE5D3`
- `--ink #191411` (text), `--ink-soft #4C433A`, `--ink-mute #8B8073`
- `--coral #FF5630` (primary accent), `--coral-deep #E8401B`
- `--lime #D4F250` (sparingly), `--clay #C9744A`, `--clay-soft #E6D3BF`
- Deliberately warm/vibrant/editorial — NOT generic "AI indigo".

Type scale is fluid (`clamp()`), tokens named `--fs-display/-h1/-h2/-h3/-lead/-body/-sm`. Spacing tokens `--s-1`..`--s-9`. `--radius: 18px`. `--maxw` ~1240–1320px. Motion: GSAP ScrollTrigger for reveal-on-scroll (`.r` → `.in`), hero blob parallax, marquee, number count-up. Respect `prefers-reduced-motion`.

Card style: on the work cards (`.wcard`), the **client/brand name sits ABOVE the title** (`.wcard__row { flex-direction: column-reverse }`). Keep this if redesigning cards.

## Brand voice

Warm, bold, energetic, a little cheeky. Confident but not corporate. Malaysian context. Writes like a marketer who loves the craft. Example lines already on the site: "Ideas that refuse to be scrolled past.", "Brands I've helped become impossible to ignore." Keep copy punchy and human; avoid buzzword soup.

Key proof points (used in stats): grew a TikTok account **9,000 → 500,000 followers in 7 months**, **20M+ cumulative views**, **RM1.3M+ in client projects**, leads content strategy at Newnormz, AI-native workflows.

Contact: zainulsedek.main@gmail.com · LinkedIn (in/zainul-sedek-133a5a1b0) · WhatsApp +60132861803.

## Recently built (context on the latest work)

- **Tapak Group** case study (`tapak-group.html`): property developer, 3 projects (T'Dahlia residential/Kuantan, T'Avenue commercial/Balok Makmur, T'Clover coming-soon/Tg Tualang). Uses `.band` sections + `.gal` galleries. Images `tapak-group.jpg`, `tapak-group-1..6.jpg`.
- **Akisyah** case study (`akisyah.html`): the account behind the 9K→500K growth. 9 vertical (9:16) explainer videos with **view-count badges shown top-left** on each clip (custom `.vgrid`/`.vclip` styles inline in that file). Videos `akisyah-vt1..9.mp4` + `-poster.jpg`, ordered by views (Putin 1.8M → Gaza 38.1K). Credited as producer/editor. Growth stats strip up top.
- Both are linked as cards in `work.html` (Akisyah first).
- Removed a "Lifestyle story" video from `genki-sushi.html` (now 2 videos, not 3).

## OPEN TASKS (please handle)

1. **Résumé button is broken on the live site.** The deployed `index.html` still has:
   `<a href="#" ... id="resumeBtn">Download Résumé</a>` plus a placeholder `resumeBtn` click handler that shows an `alert(...)`. Fix: point the button at the résumé and remove the placeholder alert JS. Target markup:
   `<a href="zainul-resume.pdf" target="_blank" rel="noopener" class="btn btn--fill" id="resumeBtn">Download Résumé</a>`
   `zainul-resume.pdf` is already in this folder (may be uncommitted). Commit + push both.
2. **"Book a session" button** still points at a placeholder Google Calendar link (`REPLACE-WITH-YOUR-LINK`) with a similar alert handler. Ask the user for their booking link, or leave a clear TODO.
3. The homepage only shows 2 work cards (Binggrae, Chek Hup) and a "View all" link. The Systems & Tools and Personal Projects sections are intentionally commented out ("hidden for now"). Confirm with the user before re-adding.

## The redesign

The user wants to **redesign the portfolio** (primarily the homepage `index.html`). Recommended approach: read all current files first, then propose 2–3 distinct directions BEFORE writing code. Preserve: the case-study pages and `images/` naming, the résumé fix, GitHub Pages compatibility (`.nojekyll`, relative paths, no build step unless the user opts in). When a direction is approved, build it, then commit and push to `main`.
