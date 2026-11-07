# 「기록관 — 연세 1885–1957」 story bible

Sources of truth: the three PDFs (2–4장 『미래를 향한 연세 역사』) and `dev/research.json` (fact-checked; use `verification.corrections` when a fact was corrected). Real events must match those sources. Invented things are limited to the fictional characters below and their private moments.

## Premise
2026년 11월. 신입생 **연우**(player, 국문과 1학년) volunteers at the 연세대 박물관 archive and finds an unlabeled bundle: a diary in old hangul signed **김복동**. When opened, a lantern-carrying figure, the **기록관**, appears. He says "이 기록은 아직 끝나지 않았다", and the diary's memories open one by one. Each act is a memory. Nobody in the past questions 연우's odd clothes beyond a line or two ("양복도 아니고 그게 무슨 옷이냐").

Theme: **사람이 기억을 지키고, 기억이 사람을 지킨다.** Healing (1막) → building (2막) → preserving (3막). The name 연세 = 연희 + 세브란스, two schools that survived the dark age together (reveal in the epilogue).

## Through-line: 김복동 (fictional, b. 1876)
- **1막 (1885, age 9):** a street orphan in 재동, quick, cynical and funny. He calls the foreign doctors "양귀신" because of rumors. His only family is a younger friend, **막동** (fictional), who has a leg wound going bad. He tests the player and steals from them, then softens. Ending: Underwood's orphanage school opened on 1886-05-11 with exactly **one boy**. In our story that boy is 복동 (mark him as 가상 인물 in the credits).
- **2막 (1902–1919, age 26–43):** a brick mason (벽돌공), married to **순례** (fictional, mentioned only). He lays bricks for 세브란스병원 (cornerstone 1902-11, opened 1904-09-23), then for the 신촌 buildings (Stimson Hall cornerstone in April 1919, during 3·1운동). His growth beat comes with **박서양**, a 백정's son who became one of the first 7 licensed doctors (1908-06-03). 복동 sneers once ("백정 아들이 의사를?") and is ashamed of it later. Underwood dies on 1916-10-12 without seeing 신촌. 복동 lays the cornerstone "for the old man".
- **3막 (1941 late autumn, age 65):** 소사 (janitor) of 연희전문, living by 핀슨관. He recognizes 연우 instantly: "너… 그때 그 아이 아니냐. 어찌 하나도 안 늙었어." This is the emotional hinge. He has been writing the diary all his life. He helps 윤동주 and hides papers under the 마루 of the janitor room. This mirrors 정병욱's mother hiding Yun's manuscript under her 마루.
- **The 기록관**: ambiguous guide. In the last scene his lantern-lit face briefly becomes the boy 복동's grin. Never explain it.

## Real people and voice
- **알렌**: 26, self-taught surgeon, brave but nervous and proud. He speaks short, plain Korean with an occasional English word ("All right… 괜찮소."). He worries about 묄렌도르프 and about failing.
- **언더우드 (원두우)**: warm, funny, stubborn, fluent polite Korean. He almost stayed home and became a pastor ("No one for Korea"). In Act 2 he is old and coughing but still dreaming of the university.
- **아펜젤러**: a cameo. He and Underwood landed together on Easter 1885.
- **에비슨**: practical, steady humor, Canadian. 1900 Carnegie Hall: "일곱 개의 부실한 병원보다 하나의 좋은 병원". Severance asks about the plan, and Avison pulls Gordon's blueprint from his pocket.
- **세브란스**: a quiet Cleveland businessman. "받는 기쁨보다 주는 기쁨이 크오." Use the spirit of it only; don't invent a direct quote. Present it as a paraphrase.
- **박서양**: quiet, precise, carries his father 박성춘's dignity (Avison treated 박성춘, who then petitioned for 백정 emancipation). Graduated 1908.
- **김필순**: a fellow graduate, later exiled (only mention it).
- **이갑성 / 스코필드 / 김원벽**: 1919 cameos in cutscene 3 only.
- **윤동주**: soft-spoken, self-doubting, precise with words, 1941 graduate. He copied 19 poems three times. 이양하 told him to wait. Never melodramatic. 서시 (1941-11-20) is public domain and may be quoted in full in the ending only.
- **정병욱**: younger (연전 후배), earnest, protective. "살아서 돌아오지 못하면 이걸 연전으로 보내 다오."
- **최현배**: appears in Act 3 only through his 『우리말본』 sheets and one remembered line. He left 연전 in 1938 (흥업구락부 사건) and was arrested in the 조선어학회 사건 on 1942-10-01.
- **정인보 / 백남운**: optional flavor NPCs (연전 삼보) with one line each, done as memories or portraits on the wall.
- **순사 (guards)**: clipped, threatening ("국어로 말해! 국어 상용 모르나?" — in this era 국어 meant Japanese).

## Dialogue rules ("feel real")
1. **No lectures.** Facts arrive through stakes, jokes, arguments and objects ("이 게시문 말이오, 사대문에 다 붙여야 하오"). One fact per exchange at most.
2. Lines are short, ≤ about 45 Korean characters, and broken over several lines. Use interruptions, "…", people talking past each other, silence (`pause`).
3. Each speaker sounds like their era and class:
   - 복동 (kid): 반말 street talk ("에이씨", "양귀신", "나리").
   - Adult 복동: rough 하게체 ("자네", "~하게", "~지").
   - Old 복동: slow, fond.
   - Officials: 하오체.
   - Missionaries: polite 하오/합쇼, slightly formal.
   - Students in 1941: 해요체 with period words ("형님", "선생님").
   - 연우: modern 해요/반말 with 2026 vocabulary, used sparingly for humor and shock ("…설마 여기가 1885년?").
4. 연우 reacts as a person: confused, scared, moved. 연우 asks the questions the player would ask.
5. Every act has **one hard moment**:
   - 1막: 막동's leg and the surgery by lamplight.
   - 2막: 복동's slur at 박서양, then his apology.
   - 3막: saying goodbye to 윤동주, knowing (as 연우 knows) that he will die in 1945.
6. Humor is allowed: the hospital yard full of eggs, pigs and pheasants ("no cure, no pay").
7. **Choices** (2 per act) set flags that change later lines. In 1막, if 연우 sides with 복동 (`trust_bokdong`), his Act 3 reunion line changes.

## Acts (maps reuse v1 layouts from dev/v1-single-file.html; quests keep v1 step types)
### 1막 「혼돈 속에서 피어난 치유의 빛」 1885년 4월, 한양 (v1 act 1 map)
1. Arrive in an alley. 복동 snatches your phone ("이게 뭔 요상한 거울이여?"). Talk to him (choice: chase him / laugh it off → `trust_bokdong`).
2. Meet 알렌 at the 제중원 gate. Free treatment notices must go up: post the 게시문 at 3 boards (tag `notice`, need 3). 편견/오해 mobs roam the streets; touching one sends you back.
3. Persuade the sick who fear the 양의 (tag `hurt`, need 3). Each one is a mini-conversation with a real fear (spirits, the 홍영식 house is cursed, women's gaze).
4. 복동 brings 막동, whose leg is rotting (echoing the first inpatient, a femur case). Tense VN scene: Allen operates and 연우 holds the lamp (choice: watch / look away). 막동 lives.
5. Yard full of eggs and a pig ("no cure, no pay"). 언더우드 laughs, then asks 복동 to be the first student of his new school (1886-05-11, one boy). Quiz by the 기록관 at the exit.

### 2막 「두 개의 굳건한 기둥」 1902–1919 (v1 act 2 map: left 남대문 밖 hospital site, right 신촌)
1. 1902. 에비슨 tells the Carnegie Hall story as a memory. Adult 복동 is the head mason.
2. Fire bricks: carry 4 brick stacks from the kiln (tag `brick`) → build the hospital (1904-09-23 opening, key ceremony at 5 p.m.).
3. 1908-06-03, graduation day. 박서양 and his father's story. 복동's slur, then a choice: call him out / stay silent (`called_out`). Later he apologizes either way, but differently.
4. 1915–1917. Old 언더우드 (coughing) talks about 신촌 and about almost not coming to Korea. He leaves. A time card: 1916-10-12 his death, told quietly by 에비슨.
5. Gather 6 materials (tag `mat`) → in April 1919, with 3·1 happening off-screen ("만세 소리가 여기까지 들리네"), lay the Stimson Hall cornerstone and build. Quiz.

### 3막 「암흑기를 뚫고 지켜낸 얼」 1941년 늦가을 (v1 act 3 night campus, guards, 화충 hearts)
1. Old 복동 recognizes 연우 (the line depends on `trust_bokdong`).
2. 윤동주 in the 핀슨관 attic, copying poems. 이양하's warning. He asks you to take a copy to 정병욱.
3. A dorm search scatters the pages: recover 3 pages past the guards (tag `page`).
4. Deliver them to 정병욱 by the poplar road. Promise scene.
5. 복동 pries up the janitor-room 마루 and hides 『우리말본』 sheets together with his diary. "누가 언젠가 꺼내 읽겠지." Choice: tell him what happens in 1945 / keep silent (`told_future`). Quiz → exit "해방을 향해".

## Cutscenes (shot lists; each shot gets a 1–2 line caption)
- `intro`: 2026 archive at night (shelves, desk lamp, the diary) → the diary opens → the lantern light of the 기록관.
- `c1` (existing v1 shots, keep): 1884 갑신정변 fire → Easter 1885 ship at 제물포 → 광혜원 gate at sunrise.
- `c2`: 1900 Carnegie Hall (podium, audience silhouettes, a man rising: Severance) → 1904 hospital at dusk (existing) → 1915 YMCA rented classroom (60 students, Underwood at a blackboard).
- `c3`: 1919-03-05 남대문역 광장 (crowd, 김원벽 on a rickshaw with a flag) → 제암리 ruins, 스코필드 behind a camera → 1941 핀슨관 attic, 윤동주 copying by lamplight.
- `c4`: 1942-08-17 the statue pulled down by ropes → 1945-02-16 a prison window in Fukuoka, a falling star → 1945-08-15 crowds with 태극기 → 1945-09 서울역 warehouse, the 조선말 큰사전 manuscript found.
- `epilogue`: 1957-01-05 sign "연희 + 세브란스 = 연세" → 2026 백양로 at dawn with students → the archive: 연우 closes the diary. Final text: 서시.

## Music map
title, intro (archive, mysterious) → c1 (`cut_fire`, `cut_sea`, `cut_dawn`) → act1 (warm, Korean pentatonic, gayageum-like pluck) → vn_warm / vn_tense for the surgery → c2 `cut_build` → act2 (busy, hopeful) → c3 `cut_rain` → act3 (`stealth` and `act3`, minor) → c4 `cut_liberation` (Arirang refrain, slow, swelling) → ending (Arirang, full arrangement) → epilogue.
