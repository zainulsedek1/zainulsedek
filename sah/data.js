/* SAH. — program data. Everything the app knows about the plan lives here. */
'use strict';

const PLAN = {
  start: '2026-11-09',     // Monday, week 1
  fitting: '2026-12-15',
  wedding: '2027-01-23',   // Nikah
  loc: { name: 'Shah Alam', lat: 3.0733, lng: 101.5185, tz: 8 },
};

/* ---------- Phases ---------- */
const PHASES = [
  { id: 'learn', name: 'LEARN', weeks: [1, 2], from: '2026-11-09', to: '2026-11-22', rir: 3,
    line: 'Form first. Ego later.',
    focus: ['3 full-body days + 2 cardio days (beginner guideline: 2–3 lifting days/week)',
            'Learn every lift with smooth, controlled reps — stop 3 reps before failure',
            'Lock in the 5:30 wake-up. Every day. Weekends too.',
            'Calorie cut starts. Hit protein every single day.'] },
  { id: 'build', name: 'BUILD', weeks: [3, 5], from: '2026-11-23', to: '2026-12-13', rir: 2,
    line: 'Add weight. Earn it.',
    focus: ['Upper / Lower split — every muscle trained 2× a week',
            '3 sets per exercise. Hit the top of the rep range → go up a weight',
            'Stop 2 reps before failure',
            'Fitting on 15 Dec — show up sharp'] },
  { id: 'push', name: 'PUSH', weeks: [6, 9], from: '2026-12-14', to: '2027-01-10', rir: 1,
    line: 'This is where it gets built.',
    focus: ['Main lifts go to 4 sets. 10-min incline-walk finishers',
            'Stop 1–2 reps before failure',
            '10K steps every day — no exceptions',
            'Year-end makan plan: protein first, one plate, no sweet drinks'] },
  { id: 'peak', name: 'PEAK', weeks: [10, 10], from: '2027-01-11', to: '2027-01-17', rir: 1,
    line: 'Hold the line.',
    focus: ['Keep the weights heavy. No new exercises',
            'Final tailor adjustment this week',
            'Sleep 7h+ is non-negotiable now'] },
  { id: 'ready', name: 'READY', weeks: [11, 11], from: '2027-01-18', to: '2027-01-23', rir: 3,
    line: 'You did the work. Now shine.',
    focus: ['Two short pump sessions (Mon, Tue), walk Wed, rest Thu–Fri',
            'Keep salt steady, water normal, normal carbs on Friday',
            'No crash diets. No dehydration. No new foods.'] },
];

/* sets per phase: M = main lift, A = accessory */
const SETS = {
  learn: { M: 2, A: 2 }, build: { M: 3, A: 3 }, push: { M: 4, A: 3 },
  peak: { M: 3, A: 3 }, ready: { M: 2, A: 2 },
};

/* ---------- Exercise library ---------- */
const EX = {
  goblet_squat: { name: 'Goblet Squat', target: 'Quads · Glutes', kind: 'db', rest: 120, cues: [
    'Hold one dumbbell upright against your chest, elbows under it.',
    'Feet shoulder-width, toes slightly out.',
    'Sit down between your heels — chest up, knees track over toes.',
    'Go as deep as your back stays flat, then drive up through the whole foot.'] },
  smith_squat: { name: 'Smith Machine Squat', target: 'Quads · Glutes', kind: 'smith', rest: 150,
    swap: 'Smith busy? Do Goblet Squat or Hack Squat.', cues: [
    'Bar on your upper back (not your neck). Feet slightly in front of the bar.',
    'Brace your belly like someone is about to punch it.',
    'Sit down until thighs are at least parallel, knees pushed out.',
    'Push the floor away. Breathe out at the top.'] },
  db_rdl: { name: 'Dumbbell Romanian Deadlift', target: 'Hamstrings · Glutes', kind: 'db', rest: 120, cues: [
    'Stand tall, dumbbells in front of your thighs, soft knees.',
    'Push your hips BACK (not down) and slide the dumbbells down your legs.',
    'Stop at a strong hamstring stretch (around mid-shin). Back stays flat.',
    'Squeeze your glutes to stand up.'] },
  leg_press: { name: 'Leg Press', target: 'Quads · Glutes', kind: 'machine', rest: 120, cues: [
    'Feet shoulder-width, middle of the platform.',
    'Lower until knees are about 90°. Lower back stays glued to the pad.',
    'Push through heels and mid-foot.',
    'Don\'t slam the knees locked at the top.'] },
  leg_curl: { name: 'Leg Curl', target: 'Hamstrings', kind: 'machine', rest: 75, cues: [
    'Line your knee up with the machine pivot.',
    'Curl all the way, pause 1 second.',
    'Lower slowly — 2–3 seconds.',
    'Hips stay down.'] },
  leg_ext: { name: 'Leg Extension', target: 'Quads', kind: 'machine', rest: 75, cues: [
    'Knee lined up with the pivot, pad on your lower shin.',
    'Straighten fully, squeeze your quads 1 second.',
    'Lower slowly.'] },
  calf_raise: { name: 'Standing Calf Raise', target: 'Calves', kind: 'machine', rest: 60, cues: [
    'Balls of your feet on the edge.',
    'Full stretch at the bottom — pause 1 second.',
    'Rise all the way up and squeeze. No bouncing.'] },
  hip_thrust: { name: 'Hip Thrust', target: 'Glutes · Hamstrings', kind: 'smith', rest: 120,
    swap: 'Use the hip thrust / glute machine if there is one.', cues: [
    'Upper back on the bench edge, bar padded across your hips.',
    'Feet flat, shins vertical at the top.',
    'Tuck your chin, drive hips up until knees-hips-shoulders are a straight line.',
    'Squeeze glutes 1 second. Don\'t arch your lower back.'] },
  walking_lunge: { name: 'DB Walking Lunge', target: 'Quads · Glutes', kind: 'db', rest: 90, cues: [
    'Dumbbells at your sides, take a long step forward.',
    'Lower the back knee toward the floor.',
    'Push through the front heel into the next step.',
    'Reps are counted per leg.'] },
  back_ext: { name: '45° Back Extension', target: 'Lower back · Glutes', kind: 'bw', rest: 60, cues: [
    'Pad at your hip crease.',
    'Lower with a flat back, rise until your body is straight — don\'t over-arch.',
    'Too easy? Hug a plate to your chest.'] },
  db_bench: { name: 'Dumbbell Bench Press', target: 'Chest · Shoulders · Triceps', kind: 'db', rest: 120, cues: [
    'Sit with dumbbells on your thighs, kick them up as you lie back.',
    'Squeeze shoulder blades back and down. Feet planted.',
    'Lower to chest level, elbows about 45° from your body (not flared).',
    'Press up and slightly in.'] },
  incline_db: { name: 'Incline Dumbbell Press', target: 'Upper chest · Shoulders', kind: 'db', rest: 120, cues: [
    'Bench at about 30°.',
    'Shoulder blades back and down, feet planted.',
    'Lower to your upper chest, elbows about 45°.',
    'Press up and slightly in.'] },
  chest_press: { name: 'Machine Chest Press', target: 'Chest · Triceps', kind: 'machine', rest: 90, cues: [
    'Seat so the handles are at mid-chest.',
    'Shoulder blades back. Press without slamming the lockout.',
    'Slow return — feel the stretch.'] },
  lat_pulldown: { name: 'Lat Pulldown', target: 'Back · Biceps', kind: 'cable', rest: 90, cues: [
    'Grip a bit wider than shoulders, thighs locked under the pad.',
    'Lean back slightly. Pull the bar to your upper chest by driving elbows down.',
    'Control it up — full stretch at the top.'] },
  assisted_pullup: { name: 'Assisted Pull-up', target: 'Back · Biceps', kind: 'machine', rest: 120,
    swap: 'No assist machine? Close-grip Lat Pulldown.', cues: [
    'More counterweight = easier. Log the assist weight.',
    'Pull your chest toward the bar, elbows down to your ribs.',
    'Lower all the way.'] },
  cable_row: { name: 'Seated Cable Row', target: 'Mid back · Lats', kind: 'cable', rest: 90, cues: [
    'Chest tall, slight bend in the knees.',
    'Pull the handle to your belly button, squeeze shoulder blades together.',
    'Don\'t rock your body to move the weight.'] },
  machine_row: { name: 'Chest-Supported Row', target: 'Mid back · Lats', kind: 'machine', rest: 90, cues: [
    'Chest on the pad.',
    'Drive elbows back past your ribs, squeeze 1 second.',
    'Slow stretch forward.'] },
  db_ohp: { name: 'Seated DB Shoulder Press', target: 'Shoulders · Triceps', kind: 'db', rest: 90, cues: [
    'Bench upright. Dumbbells at ear level.',
    'Press up until arms are straight.',
    'Ribs down — don\'t arch your lower back.'] },
  lat_raise: { name: 'DB Lateral Raise', target: 'Side delts (wide shoulders)', kind: 'db', rest: 60, cues: [
    'Lean slightly forward, soft elbows.',
    'Raise out to the side to shoulder height, lead with your elbows.',
    'Light weight. No swinging. This is the "wide shoulders" lift.'] },
  rear_delt: { name: 'Reverse Pec Deck', target: 'Rear delts · Posture', kind: 'machine', rest: 60, cues: [
    'Face the pad, arms nearly straight.',
    'Sweep the handles back until your arms line up with your body.',
    'Squeeze, then control back.'] },
  face_pull: { name: 'Cable Face Pull', target: 'Rear delts · Posture', kind: 'cable', rest: 60, cues: [
    'Rope at upper-chest to face height.',
    'Pull toward your forehead, hands apart, elbows high.',
    'Great for posture — and posture is great for photos.'] },
  tri_pushdown: { name: 'Cable Triceps Pushdown', target: 'Triceps', kind: 'cable', rest: 60, cues: [
    'Elbows pinned to your sides.',
    'Push down until arms are straight, squeeze.',
    'Control it back up.'] },
  db_curl: { name: 'Dumbbell Curl', target: 'Biceps', kind: 'db', rest: 60, cues: [
    'Elbows by your sides.',
    'Curl up, turn your pinky up at the top.',
    'Lower slowly (2–3 seconds). No swinging.'] },
  hammer_curl: { name: 'Hammer Curl', target: 'Biceps · Forearms', kind: 'db', rest: 60, cues: [
    'Palms facing each other the whole time.',
    'Elbows by your sides, curl up, lower slowly.'] },
  cable_crunch: { name: 'Kneeling Cable Crunch', target: 'Abs', kind: 'cable', rest: 60, cues: [
    'Kneel, rope held beside your head.',
    'Crunch your ribs toward your hips — round your spine.',
    'Hips stay still. Breathe out hard.'] },
  knee_raise: { name: "Captain's Chair Knee Raise", target: 'Lower abs', kind: 'bw', rest: 60, cues: [
    'Back against the pad.',
    'Bring knees to chest by curling your pelvis up.',
    'Lower slowly. No swinging.'] },
  plank: { name: 'Plank', target: 'Core', kind: 'bw', rest: 45, time: true, cues: [
    'Forearms under shoulders, body in a straight line.',
    'Squeeze glutes and brace your abs.',
    'Log seconds, not reps.'] },
  side_plank: { name: 'Side Plank (each side)', target: 'Obliques', kind: 'bw', rest: 45, time: true, cues: [
    'Elbow under shoulder, feet stacked.',
    'Hips high — straight line head to feet.',
    'Seconds per side.'] },
  dead_bug: { name: 'Dead Bug', target: 'Deep core', kind: 'bw', rest: 45, cues: [
    'On your back, arms up, knees bent 90°.',
    'Slowly lower opposite arm and leg.',
    'Lower back stays pressed into the floor. Reps per side.'] },
};

const STEP = {
  db: 'go up one dumbbell (≈2 kg)',
  machine: 'go up one pin (≈2.5–5 kg)',
  cable: 'go up one pin (≈2.5–5 kg)',
  smith: 'add 2.5 kg (1.25 each side)',
  bw: 'add reps, seconds or a plate',
};

/* ---------- Workouts ---------- */
/* item: [exerciseId, 'M'|'A', reps] ; cardio block: {cardio:...} */
const WARMUP = '5 min easy bike, then 1–2 light warm-up sets of the first lift.';

const WORKOUTS = {
  FB_A: { name: 'FULL BODY A', short: 'Full Body A', type: 'lift', mins: 45, items: [
    ['goblet_squat', 'M', '10–12'], ['db_bench', 'M', '10–12'], ['lat_pulldown', 'M', '10–12'],
    ['db_rdl', 'A', '10–12'], ['lat_raise', 'A', '12–15'], ['plank', 'A', '20–40s']] },
  FB_B: { name: 'FULL BODY B', short: 'Full Body B', type: 'lift', mins: 45, items: [
    ['leg_press', 'M', '10–12'], ['cable_row', 'M', '10–12'], ['db_ohp', 'M', '10–12'],
    ['leg_curl', 'A', '10–12'], ['tri_pushdown', 'A', '10–15'], ['dead_bug', 'A', '6–10']] },
  ZONE2: { name: 'CARDIO + CORE', short: 'Cardio + Core', type: 'cardio', mins: 45,
    cardio: { label: 'Bike or Incline Walk', note: 'Talk-test pace: you can speak in full sentences but not sing. Incline walk ≈ 10–12% at 5 km/h.',
      segments: [{ label: 'STEADY', secs: 30 * 60, hard: false }] },
    items: [['plank', 'A', '20–40s'], ['side_plank', 'A', '15–30s'], ['dead_bug', 'A', '6–10']] },

  UPPER_A: { name: 'UPPER A', short: 'Upper A', type: 'lift', mins: 55, items: [
    ['db_bench', 'M', '6–10'], ['lat_pulldown', 'M', '8–12'], ['db_ohp', 'A', '8–12'],
    ['cable_row', 'A', '10–12'], ['lat_raise', 'A', '12–15'], ['tri_pushdown', 'A', '10–15']] },
  LOWER_A: { name: 'LOWER A', short: 'Lower A', type: 'lift', mins: 55, items: [
    ['smith_squat', 'M', '6–10'], ['db_rdl', 'M', '8–10'], ['leg_press', 'A', '10–15'],
    ['leg_curl', 'A', '10–15'], ['calf_raise', 'A', '10–15'], ['plank', 'A', '30–45s']] },
  ENGINE: { name: 'ENGINE', short: 'Engine', type: 'cardio', mins: 50,
    cardio: { label: 'Bike Intervals', note: 'Bike, not running — cycling interferes less with muscle gain. HARD = 8/10 effort. EASY = slow spin.',
      segments: null /* built from phase */ },
    items: [['cable_crunch', 'A', '10–15'], ['knee_raise', 'A', '10–15'], ['face_pull', 'A', '12–15'], ['db_curl', 'A', '10–12']] },
  UPPER_B: { name: 'UPPER B', short: 'Upper B', type: 'lift', mins: 55, items: [
    ['machine_row', 'M', '8–12'], ['incline_db', 'M', '8–12'], ['assisted_pullup', 'A', '6–10'],
    ['chest_press', 'A', '10–12'], ['rear_delt', 'A', '12–15'], ['hammer_curl', 'A', '10–12']] },
  LOWER_B: { name: 'LOWER B', short: 'Lower B', type: 'lift', mins: 55, items: [
    ['hip_thrust', 'M', '8–12'], ['leg_press', 'M', '12–15'], ['walking_lunge', 'A', '10–12'],
    ['leg_ext', 'A', '12–15'], ['back_ext', 'A', '10–15'], ['calf_raise', 'A', '12–15']] },

  READY_A: { name: 'PUMP A', short: 'Pump A', type: 'lift', mins: 35, items: [
    ['db_bench', 'A', '10–12'], ['lat_pulldown', 'A', '10–12'], ['goblet_squat', 'A', '10–12'],
    ['lat_raise', 'A', '12–15'], ['db_curl', 'A', '10–12'], ['tri_pushdown', 'A', '10–12']] },
  READY_B: { name: 'PUMP B', short: 'Pump B', type: 'lift', mins: 35, items: [
    ['chest_press', 'A', '10–12'], ['machine_row', 'A', '10–12'], ['db_ohp', 'A', '10–12'],
    ['leg_press', 'A', '12–15'], ['rear_delt', 'A', '12–15'], ['hammer_curl', 'A', '10–12']] },
  WALK: { name: 'EASY WALK', short: 'Easy walk', type: 'cardio', mins: 40,
    cardio: { label: 'Easy Walk + Stretch', note: 'Relaxed pace. Loosen up, clear your head.',
      segments: [{ label: 'EASY', secs: 35 * 60, hard: false }] }, items: [] },

  ACTIVE: { name: 'ACTIVE REST', short: 'Active rest', type: 'rest', mins: 0,
    note: '10K steps. Walk, badminton, a swim with family — move, don\'t train.' },
  CHECKIN: { name: 'REST + CHECK-IN', short: 'Rest + check-in', type: 'rest', mins: 0,
    note: 'Morning weigh-in, waist measurement, progress photo (same spot, same light). Plan the week\'s lunchboxes with Mak.' },
  REST: { name: 'REST', short: 'Rest', type: 'rest', mins: 0,
    note: 'Full rest. Easy steps, early night. Your muscles fill out when you recover.' },
  PRE: { name: 'GET READY', short: 'Get ready', type: 'rest', mins: 0,
    note: 'Pack your gym bag tonight. Set a 5:30 alarm. Lights out 10:30. Week 1 starts tomorrow.' },
  SAH: { name: 'SAH.', short: 'Nikah', type: 'sah', mins: 0,
    note: 'Optional: 2 sets of push-ups + band pulls 15 min before photos. Eat a normal breakfast with protein. Breathe. Enjoy it.' },
  DONE: { name: 'MARRIED.', short: 'Married', type: 'rest', mins: 0,
    note: 'Tahniah! Keep the habits — you built them for life, not just for one day.' },
};

/* ---------- Science ---------- */
const SCIENCE = [
  { v: 'Frequency', f: 'Training each muscle 2× a week built more muscle than 1×.', p: 'Upper/Lower split hits every muscle twice a week.',
    s: 'Schoenfeld et al. 2016, Sports Medicine', u: 'https://link.springer.com/10.1007/s40279-016-0543-8' },
  { v: 'Volume', f: 'More weekly sets → more growth; 10+ sets per muscle per week did best.', p: 'Starts ~6 sets, builds to 10–14 sets per muscle by week 5.',
    s: 'Schoenfeld et al. 2017, J Sports Sci', u: 'https://researchgate.net/profile/Brad-Schoenfeld/publication/305455324_Dose-response_relationship_between_weekly_resistance_training_volume_and_increases_in_muscle_mass_A_systematic_review_and_meta-analysis/links/59dc0269458515e9ab4527d6/Dose-response-relationship-between-weekly-resistance-training-volume-and-increases-in-muscle-mass-A-systematic-review-and-meta-analysis.pdf' },
  { v: 'Beginners', f: 'Novices: 2–3 lifting days a week, loads around 8–12 reps.', p: 'Weeks 1–2 are 3 full-body days at 10–12 reps.',
    s: 'ACSM Position Stand 2009', u: 'https://pubmed.ncbi.nlm.nih.gov/19204579/' },
  { v: 'Load', f: 'Muscle grows similarly with heavy or moderate loads when sets are hard; heavy loads build more strength.', p: 'Main lifts 6–10 reps, accessories 10–15, stopping 1–3 reps before failure.',
    s: 'Schoenfeld et al. 2017, JSCR', u: 'https://pubmed.ncbi.nlm.nih.gov/28834797/' },
  { v: 'Cardio', f: 'Running interfered with muscle gain more than cycling did.', p: 'Bike and incline walking. No running.',
    s: 'Wilson et al. 2012, JSCR', u: 'https://pesquisa.bvsalud.org/sms/resource/pt/mdl-22002517' },
  { v: 'Deficit size', f: 'Deficits larger than ~500 kcal/day blocked lean-mass gains from lifting.', p: 'Cut is ~600 kcal/day — aggressive, but just about at the line.',
    s: 'Murphy & Koehler 2022, Scand J Med Sci Sports', u: 'https://pubmed.ncbi.nlm.nih.gov/34623696/' },
  { v: 'Rate of loss', f: 'Losing 0.7%/week kept and gained lean mass; 1.4%/week did not.', p: 'Target 0.6–1.0%/week. The app warns you if you go faster.',
    s: 'Garthe et al. 2011, IJSNEM', u: 'https://agris.fao.org/search/en/providers/122535/records/65df7eb30f3e94b9e5d93233' },
  { v: 'Protein', f: 'Muscle gains plateaued around 1.6 g/kg/day.', p: '2.0 g/kg/day — above the plateau, extra insurance while cutting.',
    s: 'Morton et al. 2018, Br J Sports Med', u: 'https://openrepository.aut.ac.nz/items/8dea98a4-4e37-4c60-be43-4b6ece0bd9a5' },
  { v: 'Sleep', f: 'Dieting on 5.5h vs 8.5h sleep: 55% less fat lost, 60% more muscle lost.', p: 'Fixed 5:30 wake, lights out 10:30 = 7h.',
    s: 'Nedeltcheva et al. 2010, Ann Intern Med', u: 'https://pubmed.ncbi.nlm.nih.gov/20921542/' },
  { v: 'Face fat', f: 'Training one area doesn\'t burn fat in that area.', p: 'No face exercises — face slims as total body fat drops.',
    s: 'Meta-analysis 2022, Human Movement', u: 'https://doi.org/10.5114/hm.2022.110373' },
  { v: 'Wedding week', f: 'Little evidence that water/sodium cutting works; real risks.', p: 'Steady salt, normal water. No dehydration.',
    s: 'Escalante et al. 2021, BMC Sports Sci Med Rehabil', u: 'https://pubmed.ncbi.nlm.nih.gov/34120635/' },
];

/* ---------- Food ---------- */
const PROTEIN_FOODS = [
  { n: 'Telur', d: '1 egg', g: 6 },
  { n: 'Ayam', d: '1 palm · 100 g', g: 27 },
  { n: 'Ikan', d: '1 palm · 100 g', g: 22 },
  { n: 'Daging', d: '1 palm · 100 g', g: 26 },
  { n: 'Udang / Sotong', d: '100 g', g: 20 },
  { n: 'Whey', d: '1 scoop', g: 24 },
  { n: 'Tempeh', d: '100 g', g: 19 },
  { n: 'Tauhu', d: '100 g', g: 10 },
  { n: 'Greek yogurt', d: '150 g', g: 15 },
  { n: 'Susu', d: '250 ml', g: 8 },
];

const MEALS = [
  { t: '07:20', n: 'BREAKFAST', s: 'After the gym', o: [
    '3 telur (rebus/hancur) + 2 slices wholemeal bread + 1 fruit',
    'Oats + 1 scoop whey + banana',
    'Leftover lauk ayam + ½ cup rice + 2 telur rebus'] },
  { t: '12:30', n: 'LUNCHBOX', s: 'Mum\'s cooking', o: [
    '1 cup rice (measured, ~200 g cooked)',
    '1–2 palms protein: ayam/ikan/daging',
    'Half the box = sayur. Sambal on the side, a little.'] },
  { t: '16:00', n: 'SNACK', s: 'Beat the 4pm slump', o: [
    'Greek yogurt + fruit', '2 telur rebus + 1 fruit', 'Whey shake (if protein is behind)'] },
  { t: '19:30', n: 'DINNER', s: 'After Maghrib', o: [
    '½ cup rice', '1–2 palms protein', 'Sayur — as much as you want'] },
];

const SWAPS = [
  ['Ayam goreng', 'Ayam bakar / panggang / masak kicap'],
  ['Gulai lemak / masak lemak', 'Asam pedas, singgang, sup, masak merah'],
  ['Teh tarik / sirap', 'Teh O / Kopi O kosong, or 100 Plus Zero'],
  ['Nasi lemak (full)', 'Rice ½ cup + telur rebus + sambal sikit + timun'],
  ['Kuih petang', 'Fruit or Greek yogurt'],
  ['Roti canai ×2', 'Roti telur ×1 or capati + dhal'],
  ['Mee/kuey teow goreng', 'Sup mee / kuey teow sup + extra ayam'],
  ['Supper after Isyak', 'Glass of susu or 2 telur rebus — then sleep'],
];

const MAK_TIPS = [
  'Bakar, panggang, sup, singgang, asam pedas, masak kicap — more of these please.',
  'Less santan and deep-frying for the next 10 weeks (sikit-sikit is fine).',
  'Extra protein in every lauk — 2 pieces of ayam/ikan for me.',
  'Double the sayur. Stir-fried with less oil is perfect.',
  'Sambal on the side so I can control it.',
  'I\'ll measure my own rice — 1 cup lunch, ½ cup dinner.',
];

const KENDURI = [
  'Eat protein first — ayam/daging/ikan — then sayur, then a little rice.',
  'One plate. No second round.',
  'Air kosong or teh O. Skip the sirap bandung.',
  'Dessert: pick one, small. Or fruit.',
  'Back on plan at the next meal. One meal never ruins anything.',
];

/* ---------- Sleep ---------- */
const SLEEP_RULES = [
  ['SAME WAKE TIME', '5:30 every day, weekends included (max +30 min). This is the anchor that resets your body clock.'],
  ['DAYLIGHT AFTER SUBUH', 'Get outside light within an hour of waking — the drive to the gym counts.'],
  ['CAFFEINE BEFORE 2PM', 'No coffee, tea or energy drinks after 2pm.'],
  ['DINNER 2H BEFORE BED', 'Done eating by ~8:30pm.'],
  ['PHONE OUT AT 9:45', 'Charge it outside the bedroom. Use a cheap alarm clock if you need one.'],
  ['COOL + DARK', 'Aircond 24–25°C, curtains shut, lights off.'],
  ['CAN\'T SLEEP? GET UP', 'Not asleep after ~20 min? Get up, sit somewhere dim and calm (zikir, read), back to bed when sleepy.'],
  ['NAPS: SHORT + EARLY', 'Max 20 minutes, before 3pm. Or skip them for the first 2 weeks.'],
];

const WIND_DOWN = [
  'Isyak done', 'Phone on charge OUTSIDE the bedroom', 'Lights dim, aircond 24–25°C',
  'Shower', 'Gym bag + lunchbox ready for tomorrow', 'Read, zikir or stretch — no screens',
];

/* ---------- Wedding week ---------- */
const WEDDING_WEEK = [
  ['MON 18 JAN', 'Pump A — 2 sets each, 3 reps in reserve. Normal eating.'],
  ['TUE 19 JAN', 'Pump B — last gym session. Normal eating.'],
  ['WED 20 JAN', 'Easy 35-min walk + stretch. Final fitting check if needed.'],
  ['THU 21 JAN', 'Rest. Keep salt steady, water ~3L. No new foods, no fast food.'],
  ['FRI 22 JAN', 'Rest. Normal carbs (your usual rice). 3L water. Lights out 10:00pm.'],
  ['SAT 23 JAN', 'SAH. Normal breakfast with protein. Water through the day. Optional 2 sets push-ups before photos.'],
];

const FITTING = [
  'Tell the tailor you are still cutting until 23 Jan.',
  'Ask for extra seam allowance so it can be taken in.',
  'Book the final adjustment for the week of 11 Jan.',
  'Wear the same undershirt/shoes you will wear on the day.',
];

/* ---------- Motivation ---------- */
const LINES = [
  'WIN THE MORNING. WIN THE DAY.',
  'NO ONE REMEMBERS THE EXCUSE. THEY REMEMBER THE PHOTOS.',
  'SHOW UP. EVEN AT 60%.',
  'ONE REP CLOSER TO SAH.',
  '5:30 DOESN\'T NEGOTIATE.',
  'TRAIN LIKE THE PHOTOGRAPHER IS ALREADY HERE.',
  'HUNGRY? DRINK WATER. STILL HUNGRY? EAT PROTEIN.',
  'THE BAJU IS WAITING.',
  'SLEEP IS PART OF THE PROGRAM.',
  'BISMILLAH. LET\'S WORK.',
  'STRONGER THAN LAST WEEK. THAT\'S THE ONLY RULE.',
  'SMALL PLATE. BIG PROMISE.',
  'TODAY COUNTS.',
  'DISCIPLINE IS A GIFT TO FUTURE YOU.',
  'FORM FIRST. EGO LATER.',
  'CONSISTENT BEATS PERFECT.',
];

const DONE_LINES = [
  'ONE STEP CLOSER TO SAH.',
  'THAT\'S HOW IT\'S BUILT.',
  'BANKED. SEE YOU TOMORROW.',
  'FUTURE YOU SAYS THANKS.',
  'ANOTHER ONE. NO SKIPS.',
];
