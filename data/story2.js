/* data/story2.js — adds STORY.acts.act2 and STORY.acts.act3 (2막 벽돌, 3막 암흑기).
   Pure data; the small helpers below only build plain objects. Line ids are stable: a<act>_<speaker>_<nn>. */
(function () {
  window.STORY = window.STORY || {};
  STORY.acts = STORY.acts || {};

  // L = dialogue line, N = person/sign entity, S = sign, I = pick-up item
  const L = (id, who, mood, text, o) => Object.assign({ id, who, mood, text }, o);
  const N = (x, y, name, sprite, script, o) => Object.assign({ x, y, name, sprite, script }, o);
  const S = (x, y, script, o) => N(x, y, '표지판', 'sign', script, o);
  const I = (x, y, tag, sprite, name) => ({ x, y, name, sprite, tag, item: 1 });

  /* ============================== 2막 ============================== */
  STORY.acts.act2 = {
    title: '제2막 · 두 개의 굳건한 기둥 (1902–1919)',
    hint: '아래쪽 출구',
    music: 'act2',
    start: [5, 15],
    intro: [
      '제2막 · 두 개의 굳건한 기둥',
      '기억이 다시 열린다. 이번에는 벽돌 가마 냄새가 먼저 온다.',
      '왼쪽은 남대문 밖 병원 터, 오른쪽은 아직 풀밭뿐인 신촌.',
      '달릴 땐 Shift(또는 B). 금빛 화살표가 떠 있는 자재는 걸어가서 주워요.',
      '신촌 쪽 들판에는 수군거림(보라색)이 떠돌아요. 닿으면 제자리로 돌아가요.',
    ],
    // rows copied verbatim from v1
    map: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T..........T...........T',
      'T.________.T..________.T',
      'T.________.T..________.T',
      'T....,.....T.....,.....T',
      'T....,.....T.....,.....T',
      'T....,.....T..P..,..P..T',
      'T....,.....T..P..,..P..T',
      'T....,,,,,,,,,,,,,.....T',
      'T....,.....T.....,.....T',
      'T.RRR,.....T..P..,..P..T',
      'T.BDB,.....T..P..,..P..T',
      'T....,.....T.....,.....T',
      'T..F.,..F..T.....,..F..T',
      'T....,.....T.....,..HHHT',
      'T....,.....T.....,..MDMT',
      'T....,.....T.....,.....T',
      'TTTTTTTTTTTTTTTTTETTTTTT',
    ],
    steps: [
      // 1. 1902 — Avison, the Carnegie Hall story as a memory
      { goal: '에비슨 만나기 (1902)', who: 'avison', script: [
        '1902년 11월. 남대문 밖 빈 터에 말뚝이 줄지어 박혀 있다.',
        L('a2_me_01', 'me', 'surprised', '어, 이번엔 폰 뺏는 사람이 없네. 다행이다.'),
        L('a2_avison_01', 'avison', 'neutral', '거기, 젊은이. 멍하니 서 있을 틈이 없소.'),
        L('a2_avison_02', 'avison', 'neutral', '그 옷은… 아니, 묻지 않겠소. 손이 하나라도 아쉬우니.'),
        L('a2_me_02', 'me', 'neutral', '여기, 병원 짓는 데예요?'),
        L('a2_avison_03', 'avison', 'smile', '오늘 머릿돌을 놓았소. 병원은 아직 말뚝뿐이지만.'),
        L('a2_avison_04', 'avison', 'neutral', '재작년 봄, 뉴욕 카네기홀이었소. 단상에서 다리가 떨렸지.'),
        L('a2_avison_05', 'avison', 'neutral', '“일곱 개의 부실한 병원보다 하나의 좋은 병원.” 그렇게 외치고 내려왔소.'),
        L('a2_avison_06', 'avison', 'neutral', '끝나자 낯선 신사가 다가와 물었소.\n그런 병원을 지으려면 뭐가 필요하냐고.'),
        L('a2_me_03', 'me', 'surprised', '뭐라고 하셨어요?'),
        L('a2_avison_07', 'avison', 'smile', '주머니에서 설계도를 꺼냈소. 토론토의 고든이 그려 준 것을.', { pause: 600 }),
        L('a2_me_04', 'me', 'surprised', '…늘 갖고 다니셨어요?'),
        L('a2_avison_08', 'avison', 'smile', '기도만 하고 있을 순 없잖소. 기도하고, 그림도 그려 두는 거요.'),
        L('a2_avison_09', 'avison', 'neutral', '그 신사가 클리블랜드의 세브란스 씨요. 1만 달러를 내놓았지.'),
        L('a2_avison_10', 'avison', 'neutral', '자, 벽돌이 모자라오. 가마에서 네 무더기만 날라 주시오.'),
        L('a2_me_05', 'me', 'neutral', '삯은요?'),
        L('a2_avison_11', 'avison', 'smile', '삯은 못 주오. 대신 이 병원에서 아프면 공짜로 봐 드리리다.'),
        L('a2_me_06', 'me', 'smile', '…그거면 충분하네요.'),
      ] },
      // 2. carry 4 brick stacks; Bokdong (adult mason) appears in the done scene
      { goal: '구운 벽돌 4무더기 모아 오기', tag: 'brick', need: 4, done: [
        '벽돌 네 무더기를 현장으로 날랐다.',
        L('a2_bokdong_01', 'bokdong_adult', 'angry', '거기! 벽돌을 던지듯 놓으면 금 가네!'),
        L('a2_bokdong_02', 'bokdong_adult', 'neutral', '…허, 손은 있구먼. 쌓는 건 내가 하지. 자넨 날라 오기나 하게.'),
        L('a2_me_07', 'me', 'surprised', '(…복동이다. 그 꼬마가 이렇게 컸구나.)', { pause: 500 }),
        L('a2_bokdong_03', 'bokdong_adult', 'neutral', '뭘 그리 빤히 보나. 얼굴에 회칠이라도 했나?'),
        L('a2_me_08', 'me', 'surprised', '아, 아니요! 닮은 사람이 있어서요.'),
        L('a2_bokdong_04', 'bokdong_adult', 'neutral', '…나도 어디서 본 듯하군. 에이, 흔한 얼굴이지.'),
        L('a2_bokdong_05', 'bokdong_adult', 'neutral', '순례가 싸 준 주먹밥 식겠네. 비키게.'),
      ] },
      // 3. hospital rises (opened 1904-09-23)
      { goal: '병원 부지에서 개원 지켜보기', who: 'hsite', script: [
        { bg: 'hospital', text: '1904년 9월 23일. 남대문 밖 복숭아골. 병원이 문을 연다.' },
        L('a2_bokdong_06', 'bokdong_adult', 'smile', '다 올랐네. 저 벽 한 장 한 장이 내 손을 거쳤지.'),
        L('a2_bokdong_07', 'bokdong_adult', 'smile', '…순례한테 자랑해야겠군. 허구한 날 흙투성이라고 타박하던 사람이.'),
        L('a2_me_09', 'me', 'smile', '진짜 병원 같아요.'),
        L('a2_bokdong_08', 'bokdong_adult', 'neutral', '같은 게 아니라 병원이네, 이 사람아.'),
        L('a2_avison_12', 'avison', 'smile', '오후 다섯 시에 열쇠를 돌리겠소. 하지만 문을 만든 건 자네들이오.'),
        L('a2_bokdong_09', 'bokdong_adult', 'sad', '…나리, 그런 말은 사람 민망하게 하오.'),
        '오후 다섯 시. 열쇠가 돌아가는 소리가 마당 끝까지 들렸다.',
      ], build: [[2, 2, 'YYYYYYYY', 'XXXDXXXX']] },
      // 4. 1908 graduation — Park Seo-yang, Bokdong's slur, choice
      { goal: '1908년, 졸업식 날 — 박서양 만나기', who: 'park', script: [
        '1908년 6월 3일 오후. 마당에 큰 천막이 오르고 의자가 줄지어 놓였다.',
        '졸업생은 일곱 명. 이튿날이면 한국 최초의 의사 면허를 받을 사람들이다.',
        L('a2_park_01', 'park_seoyang', 'neutral', '…졸업장이 이렇게 가벼운 줄 몰랐습니다.'),
        L('a2_me_10', 'me', 'smile', '축하드려요! 박서양… 선생님이시죠?'),
        L('a2_park_02', 'park_seoyang', 'neutral', '선생이라는 말은 아직 입에 안 붙습니다.'),
        L('a2_park_03', 'park_seoyang', 'neutral', '아버지가 와 계십니다. 저 뒷줄 끝에.'),
        '뒷줄 끝에 노인이 혼자 서 있다. 양옆 의자는 비어 있다.',
        L('a2_park_04', 'park_seoyang', 'sad', '에비슨 선생님이 아버지 병을 고쳐 주셨습니다.\n…그게 시작이었습니다. 전부의.'),
        L('a2_park_05', 'park_seoyang', 'neutral', '아버지는 칼로 소를 잡으셨고, 저는…\n…칼로 사람을 고치고 싶었습니다.', { pause: 500 }),
        '그때, 등 뒤에서 낮은 웃음이 들린다.',
        L('a2_bokdong_10', 'bokdong_adult', 'angry', '백정 아들이 의사라? 소 잡던 손으로 사람 배를 가르겠다고?'),
        L('a2_bokdong_11', 'bokdong_adult', 'angry', '세상 참 말세로군.', { pause: 600 }),
        '박서양은 돌아보지 않는다. 졸업장을 쥔 손끝만 하얘진다.',
        L('a2_me_11', 'me', 'neutral', '(…어떻게 하지?)', { choice: [
          { text: '“그만하세요. 그 손이 사람을 살릴 거예요.”', set: 'called_out', next: [
            L('a2_bokdong_12', 'bokdong_adult', 'surprised', '…뭐? 자네가 뭔데.'),
            L('a2_me_12', 'me', 'angry', '어디서 났든 아저씨가 무슨 상관이에요!'),
            L('a2_bokdong_13', 'bokdong_adult', 'angry', '내가 틀린 말을 했다고…', { pause: 900 }),
            L('a2_park_06', 'park_seoyang', 'neutral', '괜찮습니다. 익숙합니다.'),
            L('a2_me_13', 'me', 'sad', '저는 안 괜찮아요.'),
            L('a2_park_07', 'park_seoyang', 'smile', '…고맙습니다. 식이 곧 시작됩니다.'),
            L('a2_park_08', 'park_seoyang', 'neutral', '아버지 옆자리가 비어 있어서요. 앉으러 가야겠습니다.'),
            '그는 뒷줄로 걸어가 노인 옆의 빈 의자에 앉는다.',
          ] },
          { text: '(아무 말도 하지 못한다)', set: 'stayed_silent', next: [
            '입이 떨어지지 않는다. 심장 소리만 크게 들린다.',
            L('a2_park_09', 'park_seoyang', 'neutral', '괜찮습니다. 익숙합니다.'),
            L('a2_me_14', 'me', 'sad', '(익숙하다는 말이 제일 아팠다.)'),
            L('a2_park_10', 'park_seoyang', 'neutral', '식이 곧 시작됩니다. 아버지 옆자리가 비어 있어서요.'),
            '그는 뒷줄로 걸어가 노인 옆의 빈 의자에 앉는다.',
          ] },
        ] }),
      ] },
      // 5. Bokdong apologises (differs by choice)
      { goal: '복동 만나기 — 그날 저녁', who: 'bokdong', script: [
        { bg: 'dusk', text: '그날 저녁. 천막이 걷힌 마당. 복동이 벽돌 더미에 걸터앉아 있다.' },
        L('a2_bokdong_14', 'bokdong_adult', 'sad', '…', { pause: 700 }),
        L('a2_bokdong_15', 'bokdong_adult', 'sad', '아까 그 말 말이네.'),
        L('a2_bokdong_16', 'bokdong_adult', 'sad', '자네가 눈 똑바로 뜨고 나무랐지. 얼굴이 화끈거려 혼났네.', { if: 'called_out' }),
        L('a2_bokdong_17', 'bokdong_adult', 'sad', '다들 입을 다물고 있더군. 그게 더 무서웠네.\n내 말이 그냥 통한다는 게.', { if: 'stayed_silent' }),
        L('a2_bokdong_18', 'bokdong_adult', 'neutral', '나도 길바닥에서 “거지 새끼” 소리 들으며 컸네.'),
        L('a2_bokdong_19', 'bokdong_adult', 'neutral', '그런 주제에 남한테 똑같은 소릴 했지. 입이 그렇게 생겨먹었나.'),
        L('a2_me_15', 'me', 'neutral', '…사과하셨어요?'),
        L('a2_bokdong_20', 'bokdong_adult', 'neutral', '했네. 박 선생이 한참 보더니 웃더군.'),
        L('a2_bokdong_21', 'bokdong_adult', 'sad', '“이 병원 벽은 당신 손이 쌓았습니다. 저는 그 안에서 배웠고요.”\n…그러더군.'),
        L('a2_bokdong_22', 'bokdong_adult', 'sad', '그 말 듣고 벽돌 하나를 못 들겠더군.'),
        L('a2_me_16', 'me', 'smile', '다행이에요. 직접 가서 말씀하신 것만으로도요.'),
        L('a2_bokdong_23', 'bokdong_adult', 'neutral', '다행은 무슨. 말은 벽돌 같네. 한번 올리면 빼기 어렵지.'),
        L('a2_bokdong_24', 'bokdong_adult', 'smile', '순례가 알면 부지깽이로 맞았을 걸세.'),
        L('a2_bokdong_25', 'bokdong_adult', 'smile', '…내일은 내가 먼저 인사를 건네 봐야겠네.'),
      ] },
      // 6. 1915 — old Underwood (choice 2)
      { goal: '1915년, 종로 YMCA — 언더우드 만나기', who: 'under', script: [
        { bg: 'ymca', text: '1915년 봄. 종로 YMCA 건물. 빌린 교실 칠판에 분필 가루가 날린다.' },
        L('a2_under_01', 'underwood_old', 'sad', '콜록… 콜록. 아, 미안하오. 별것 아니오.'),
        L('a2_me_17', 'me', 'surprised', '괜찮으세요? 물이라도 가져올까요?'),
        L('a2_under_02', 'underwood_old', 'smile', '늙은이 기침은 시계 같은 거라오. 때가 되면 울리지.'),
        L('a2_under_03', 'underwood_old', 'smile', '교실은 빌렸지만, 대학은 대학이오.'),
        L('a2_under_04', 'underwood_old', 'neutral', '내가 처음엔 인도로 가려 했다면 믿겠소?'),
        L('a2_me_18', 'me', 'surprised', '인도요?'),
        L('a2_under_05', 'underwood_old', 'neutral', '기도하는데 이런 말이 들렸소.\n“조선엔 갈 사람이 없다.” No one for Korea.'),
        L('a2_under_06', 'underwood_old', 'smile', '그래서 말했지. 그럼 제가 가겠습니다.'),
        L('a2_under_07', 'underwood_old', 'smile', '후회? 날마다 했소. 그리고 날마다 감사했지. 허허, 콜록.'),
        L('a2_under_08', 'underwood_old', 'neutral', '신촌에 학교 터를 알아보는 중이오.\n연희궁 터 근처라는데, 풀밭에 바람뿐이라더군.'),
        L('a2_me_26', 'me', 'surprised', '땅값은요? 엄청 비쌀 텐데…'),
        L('a2_under_15', 'underwood_old', 'smile', '뉴욕에 형님이 있소. 존이라고, 타자기를 만들어 파는 사람이지.'),
        L('a2_under_16', 'underwood_old', 'smile', '처음 조선에 올 때부터 뒤를 대 주더니, 이번에도 땅값과 학교 세울 돈을 큰돈으로 보내 주겠다 하오.'),
        L('a2_under_17', 'underwood_old', 'neutral', '형님은 자판을 두드려 돈을 벌고, 나는 그 돈으로 종을 달 셈이오. 허허.'),
        L('a2_under_09', 'underwood_old', 'sad', '거기서 종소리 울리는 걸 보고 싶소. 그게 전부요.', { pause: 500 }),
        L('a2_me_19', 'me', 'sad', '(…뭐라고 대답하지?)', { choice: [
          { text: '“꼭 보실 거예요.”', set: 'promised_underwood', next: [
            L('a2_under_10', 'underwood_old', 'smile', '허허. 점쟁이 같은 소리를 하는군.'),
            L('a2_under_11', 'underwood_old', 'smile', '고맙소. 오늘 밤 기도에 그 말을 넣어 두겠소.'),
            '연우는 웃어 보였다. 웃는 얼굴이 이렇게 무거운 건 처음이었다.',
          ] },
          { text: '“신촌 이야기, 더 해 주세요.”', set: 'asked_dream', next: [
            L('a2_under_12', 'underwood_old', 'smile', '그럴까? 앉아 보오.'),
            L('a2_under_13', 'underwood_old', 'smile', '언덕에 학교가 앉고, 그 아래 병원이 서고…\n나무 심은 길도 하나 내고 싶소.'),
            L('a2_under_14', 'underwood_old', 'smile', '그 길을 우리 아이들이 걸어 다니겠지. 콜록, 허허.'),
            '연우는 오래 들었다. 끝나지 않았으면 했다.',
          ] },
        ] }),
      ] },
      // 7. 1916 — Avison tells of the death
      { goal: '1916년 가을 — 에비슨 만나기', who: 'avison', script: [
        '1916년 10월 12일. 미국 애틀랜틱시티. 언더우드가 숨을 거두었다.',
        { bg: 'lamp', text: '그 소식이 서울에 닿은 날 밤. 에비슨의 진료실.' },
        L('a2_avison_13', 'avison', 'sad', '전보가 왔소.', { pause: 800 }),
        L('a2_avison_14', 'avison', 'sad', '원 목사가… 떠났다 하오. 쉰일곱이었지.'),
        L('a2_me_20', 'me', 'sad', '…', { pause: 700 }),
        L('a2_me_21', 'me', 'sad', '꼭 보실 거라고… 제가 말했는데.', { if: 'promised_underwood' }),
        L('a2_me_22', 'me', 'sad', '신촌 이야기를 끝까지 들었는데…', { if: 'asked_dream' }),
        L('a2_avison_15', 'avison', 'sad', '그 사람은 병상에서도 설교를 하려 들었소. 내가 의사라 막았지만.'),
        L('a2_avison_16', 'avison', 'sad', '마지막 편지에도 신촌 땅 얘기뿐이었소. 어느 언덕에 무엇을 앉힐지.'),
        L('a2_avison_20', 'avison', 'neutral', '뉴욕의 형님 존 언더우드 씨가 동생 뜻을 끝까지 잇겠다 하오.\n그 기부금으로 신촌 땅을 사고 학교를 세울 거요.'),
        L('a2_avison_17', 'avison', 'neutral', '이제 연희는 내가 맡겠소. 병원과 학교, 두 쪽 다.'),
        L('a2_avison_18', 'avison', 'neutral', '남은 사람이 짓는 거요. 그게 순서요.'),
        L('a2_avison_19', 'avison', 'neutral', '복동에게 전해 주시오.\n신촌 머릿돌을 놓을 땐 그 사람 이름을 불러 달라고.'),
      ] },
      // 8. gather 6 materials
      { goal: '붉은 벽돌·건축 자재 6개 모으기', tag: 'mat', need: 6, done: [
        '건축 자재가 모두 모였다.',
        '신촌 공사 현장의 표지판으로 가져가자.',
      ] },
      // 9. 1919 Stimson Hall cornerstone, 3·1 off-screen
      { goal: '신촌 공사 현장에서 머릿돌 놓기', who: 'csite', script: [
        '1919년 4월. 신촌 연희궁 터. 도시에는 3월부터 이어진 만세 소리가 아직 가시지 않았다.',
        L('a2_bokdong_26', 'bokdong_adult', 'neutral', '…들리나? 만세 소리가 여기까지 오는군.'),
        L('a2_me_23', 'me', 'neutral', '네. 들려요.'),
        L('a2_bokdong_27', 'bokdong_adult', 'sad', '인부 절반이 오늘 안 나왔네. 나도 따라가고 싶었지.'),
        L('a2_bokdong_28', 'bokdong_adult', 'neutral', '그런데 벽돌 쌓는 놈은 벽돌을 쌓아야지 않겠나.'),
        L('a2_me_24', 'me', 'smile', '그것도 만세예요. 아저씨 식의.'),
        L('a2_bokdong_29', 'bokdong_adult', 'smile', '…허. 이상한 소리를 잘도 하는구먼.'),
        L('a2_bokdong_30', 'bokdong_adult', 'neutral', '머릿돌은 둘이 드는 거네. 이쪽을 잡게.'),
        L('a2_bokdong_31', 'bokdong_adult', 'sad', '원 목사 이름을 부르려는데, 말주변이 없어서.'),
        L('a2_me_25', 'me', 'smile', '같이 해요.'),
        L('a2_bokdong_32', 'bokdong_adult', 'sad', '원두우 선생. 보이시오? 여기가 그 언덕이오.', { pause: 600 }),
        '머릿돌이 내려앉는다. 스팀슨관, 신촌의 첫 건물이다.',
        L('a2_bokdong_33', 'bokdong_adult', 'smile', '자, 이제 쌓아 보세. 평생 해 온 일이네.'),
      ], build: [[14, 2, 'YYY.YYYY', 'GDG.GGDG']] },
      // 10. quiz at the exit
      { goal: '출구 앞 기록관의 퀴즈 풀기', who: 'quiz', quiz: [
        { q: '세브란스가 병원을 짓도록 기부한 돈은?', a: ['1천 달러', '1만 달러', '10만 달러'], c: 1, why: '그 돈으로 1904년 세브란스병원이 문을 열었소.' },
        { q: '1915년 조선기독교대학이 처음 문을 연 곳은?', a: ['신촌 연희궁 터', '종로 YMCA 건물', '서울역 앞'], c: 1, why: '1917년에 신촌 땅을 사고서야 옮겨 갈 채비를 했소.' },
        { q: '1908년 제1회 졸업생은 몇 명?', a: ['3명', '12명', '7명'], c: 2, why: '그들이 우리나라 최초의 의사 면허를 받았소.' },
      ] },
    ],
    ents: [
      N(4, 5, '에비슨 (O. R. Avison)', 'avison', [
        L('a2_avison_90', 'avison', 'neutral', '벽돌은 저기 복동이 책임지오. 성질은 급해도 그가 쌓은 벽은 비가 새지 않소.'),
      ], { id: 'avison', after: [
        L('a2_avison_91', 'avison', 'smile', '언더우드가 떠난 뒤 나는 두 학교의 교장이 되었소. 바쁘오, 허허.'),
      ] }),
      S(8, 5, [
        '클리블랜드에서 온 마음 (뜻을 옮김)',
        '“받는 기쁨보다 주는 기쁨이 더 큽니다.” — 세브란스가 전한 뜻을 의역한 것이다.',
        '1900년의 기부 1만 달러가 이 병원의 첫 벽돌이 되었다.',
      ], { name: '편지' }),
      S(6, 4, ['병원 부지 — 남대문 밖', '이곳에 새 병원이 선다.'], { id: 'hsite', name: '병원 부지',
        after: ['세브란스병원 (1904)', '교파를 넘어 연합으로 운영된 근대식 병원.'] }),
      N(7, 10, '복동 (석공)', 'bokdong_adult', [
        L('a2_bokdong_90', 'bokdong_adult', 'neutral', '일하는 사람 붙잡고 말 걸지 말게. 벽이 기다려 주진 않아.'),
      ], { id: 'bokdong', after: [
        L('a2_bokdong_91', 'bokdong_adult', 'smile', '저 벽 보이나? 내가 쌓았네. 몇 번을 말해도 질리질 않아.'),
      ] }),
      N(2, 8, '박서양', 'park_seoyang', [
        L('a2_park_90', 'park_seoyang', 'neutral', '식이 끝나면 아버지와 함께 걸어 나가려 합니다.'),
      ], { id: 'park', from: 3, after: [
        '1911년 말, 동기 김필순은 체포망을 피해 중국으로 떠났다.',
        '박서양은 훗날 간도로 건너가 병원을 세웠다.',
      ] }),
      S(4, 12, ['제중원의학교', '1909년 7월 ‘세브란스병원의학교’로 등록. 훗날 세브란스의학전문학교로 발전했다.']),
      S(1, 13, ['벽돌 가마', '구운 벽돌 무더기를 현장으로 나른다. 아직 뜨겁다.'], { name: '벽돌 가마' }),
      N(7, 13, '일꾼', 'worker', [
        L('a2_worker_01', 'worker', 'neutral', '벽돌이 모자라오! 가마는 저쪽이오.'),
      ]),
      N(15, 5, '언더우드 (원두우)', 'underwood_old', [
        L('a2_under_90', 'underwood_old', 'smile', '신촌에 종소리가 울리는 날을 보고 싶소. 콜록.'),
      ], { id: 'under', from: 5, until: 6 }),
      S(16, 4, ['신촌 공사 현장 — 연희궁 터', '새 교사를 지을 자리.'], { id: 'csite', name: '공사 현장',
        after: ['스팀슨관 (1919 정초)', '1917년, 언더우드의 형 존 T. 언더우드의 기부금으로 창천리 일대 약 19만 평의 부지를 마련했다.',
          '언더우드관과 아펜젤러관은 1921년 10월 정초로 전한다.'] }),
      N(18, 16, '기록관', 'keeper', [
        L('a2_keeper_01', 'keeper', 'neutral', '이 시대의 이야기를 모두 듣고 오시오. 그때 시험하겠소.'),
      ], { id: 'quiz' }),
      I(2, 14, 'brick', 'brick', '벽돌'), I(9, 15, 'brick', 'brick', '벽돌'),
      I(8, 9, 'brick', 'brick', '벽돌'), I(9, 12, 'brick', 'brick', '벽돌'),
      I(13, 9, 'mat', 'brick', '벽돌'), I(22, 7, 'mat', 'wood', '목재'), I(19, 12, 'mat', 'brick', '벽돌'),
      I(13, 15, 'mat', 'wood', '목재'), I(21, 15, 'mat', 'brick', '벽돌'), I(12, 1, 'mat', 'wood', '목재'),
    ],
    // 신촌 side only: whispers and prejudice (the act's theme — 박서양, 복동's slur) still get in the way
    mobs: [
      ['doubt', [[12, 9], [22, 9]]],
      ['doubt', [[18, 10], [18, 15]]],
    ],
    doubtLines: ['“백정 아들 다니는 학교라지?” 수군거림에 발이 묶였다…', '제자리로 돌아간다.'],
  };

  /* ============================== 3막 ============================== */
  // Shared tail of the 마루 scene so both choice branches end the same way (unique ids per branch)
  const floorTail = (a, b, c) => [
    '판자가 제자리에 놓인다. 먼지가 천천히 가라앉는다.',
    L('a3_bokdong_' + a, 'bokdong_old', 'neutral', '자, 덮는다. 이제 이 방이 제일 믿을 만한 책장이다.', { sfx: 'door' }),
    L('a3_bokdong_' + b, 'bokdong_old', 'smile', '가거라. 네 시대가 어디인지는 모르겠다만.'),
    L('a3_bokdong_' + c, 'bokdong_old', 'smile', '…또 오너라. 아니, 오지 말고 그냥 잘 살아라.'),
  ];

  STORY.acts.act3 = {
    title: '제3막 · 암흑기를 뚫고 지켜낸 얼 (1941)',
    hint: '아래쪽 출구',
    music: 'act3',
    start: [12, 16],
    dark: 1,
    hearts: 1,
    intro: [
      '제3막 · 암흑기를 뚫고 지켜낸 얼',
      '1941년 늦가을. 연희전문 교정에는 낙엽과 순사의 구둣발 소리뿐이다.',
      '순사의 붉은 시야에 들어가면 붙잡혀요. 화충(♥)이 줄고, 처음 자리로 돌아가요.',
      '붉은 하트는 화충을 되살려요. 순사가 돌아설 때를 노리세요.',
    ],
    // rows copied verbatim from v1
    map: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T......................T',
      'T.YYYYY..YYYYYY..YYYYY.T',
      'T.GGDGG..GGGDGG..GGDGG.T',
      'T...,.......,......,...T',
      'T...,,,,,,,,,,,,,,,,...T',
      'T..........P,P.........T',
      'T..........P,P.........T',
      'T.RRR......P,P.....F...T',
      'T.BDB......P,P.........T',
      'T..........P,P.........T',
      'T..........P,P..YYYY...T',
      'T..F.......P,P..XXDX...T',
      'T..........P,P.........T',
      'T...........,..........T',
      'T...........,..........T',
      'T...........,..........T',
      'TTTTTTTTTTTTETTTTTTTTTTT',
    ],
    steps: [
      // 1. old Bokdong recognises 연우 (first line depends on trust_bokdong)
      { goal: '교정의 소사 만나기', who: 'bokdong1', script: [
        '1941년 11월. 연희전문 교정, 해 질 녘. 빗자루 소리가 뚝 멈춘다.',
        L('a3_bokdong_01', 'bokdong_old', 'sad', '…거울을 훔쳐 간 나를 웃어넘겨 주던 아이.', { if: 'trust_bokdong' }),
        L('a3_bokdong_02', 'bokdong_old', 'surprised', '너… 그때 그 아이 아니냐. 어찌 하나도 안 늙었어.', { pause: 600 }),
        L('a3_me_01', 'me', 'surprised', '복동… 아저씨?'),
        L('a3_bokdong_03', 'bokdong_old', 'smile', '쉰여섯 해다. 눈은 침침해도 그 얼굴은 안 잊어.'),
        L('a3_me_02', 'me', 'neutral', '1902년엔 못 알아보셨잖아요.'),
        L('a3_bokdong_04', 'bokdong_old', 'smile', '“흔한 얼굴이지” 했던가. 허허. 그땐 나도 못 믿었다.'),
        L('a3_bokdong_05', 'bokdong_old', 'neutral', '쓸고 닦다 보면 할 말이 쌓이더구나. 그래서 적는다.'),
        L('a3_me_03', 'me', 'neutral', '…적어요?'),
        L('a3_bokdong_06', 'bokdong_old', 'neutral', '그건 됐고. 오늘 밤은 일손이 필요하다. 핀슨관 다락에 올라가 보아라.'),
        L('a3_bokdong_07', 'bokdong_old', 'neutral', '윤 군이라고, 밤마다 불을 켜고 뭘 베낀다. 순사 눈에 띄면 큰일이다.'),
        L('a3_bokdong_08', 'bokdong_old', 'smile', '너는 낯선 얼굴이라 의심을 덜 받겠지. 옷은 좀 이상하다만.'),
      ] },
      // 2. 윤동주 in the attic
      { goal: '핀슨관 다락방의 윤동주 만나기', who: 'yun', warp: [10, 6], script: [
        { bg: 'attic', text: '핀슨관 3층, 다락방. 호롱불 하나가 흔들린다.' },
        L('a3_yun_01', 'yun', 'neutral', '…누구세요?'),
        L('a3_me_04', 'me', 'neutral', '소사 어르신이 보내셨어요. 연우라고 해요.'),
        L('a3_yun_02', 'yun', 'smile', '어르신이요? 앉으세요. 종이 밟지 않게 조심하시고요.'),
        '책상 위에 손으로 쓴 시가 겹겹이 놓여 있다. 같은 시가 세 벌씩.',
        L('a3_me_05', 'me', 'neutral', '시, 쓰세요?'),
        L('a3_yun_03', 'yun', 'neutral', '쓴다기보다 베끼는 중이에요. 세 벌을요.'),
        L('a3_yun_04', 'yun', 'neutral', '한 벌은 제가, 한 벌은 이양하 선생님께, 한 벌은 정병욱 군에게.'),
        L('a3_me_06', 'me', 'neutral', '왜 세 벌이나요?'),
        L('a3_yun_05', 'yun', 'sad', '하나는 잃어버릴 수도 있으니까요.', { pause: 600 }),
        L('a3_yun_06', 'yun', 'neutral', '이 선생님은 기다리라고 하셨어요. 지금은 때가 아니라고요.'),
        L('a3_yun_07', 'yun', 'sad', '틀린 말씀 아닌 건 알아요.\n그래도 접어 둔 채로 사는 건 쉽지 않네요.'),
        L('a3_me_07', 'me', 'neutral', '제목은 정하셨어요?'),
        L('a3_yun_08', 'yun', 'smile', '아직이요. 하늘이랑 바람이랑 별… 자꾸 그런 것만 나와요.'),
        L('a3_yun_09', 'yun', 'neutral', '부끄럽지 않게 쓰고 싶은데, 부끄러운 건 늘 저더라고요.'),
        L('a3_yun_10', 'yun', 'neutral', '부탁이 하나 있어요. 정병욱 군에게 한 벌만 전해 주실래요?'),
        L('a3_yun_11', 'yun', 'neutral', '병욱이는 포플러 길에서 기다릴 거예요. 저는 움직이면 눈에 띄니까요.'),
        '쾅. 아래층에서 군화 소리가 계단을 타고 올라온다.',
        L('a3_guard_01', 'guard', 'angry', '전원 기숙사 앞으로! 가택 수색이다!', { sfx: 'alarm' }),
        L('a3_yun_12', 'yun', 'surprised', '…뒤쪽 창으로 나가세요. 어서요!'),
        '급히 추린 원고가 창밖 어둠으로 흩어진다. 세 장이 교정 곳곳에 떨어졌다.',
        L('a3_yun_13', 'yun', 'sad', '찾아 주세요. 제가 직접 나설 순 없어요.'),
        '연우는 뒤쪽 창으로 빠져나와 포플러 그늘에 몸을 숨긴다.',
      ] },
      // 3. recover 3 pages past the guards
      { goal: '흩어진 원고 3장 되찾기 (순사를 피하자)', tag: 'page', need: 3, done: [
        '원고를 모두 되찾았다.',
        '종이마다 또박또박한 손글씨가 적혀 있다. 포플러 길의 정병욱에게 가자.',
      ] },
      // 4. 정병욱 promise + goodbye to 윤동주
      { goal: '포플러 길의 정병욱에게 원고 전하기', who: 'jeong', script: [
        '포플러 길. 낙엽이 발목까지 쌓였다.',
        L('a3_jeong_01', 'jeong_byeongwook', 'surprised', '형님 심부름 오셨죠? 늦으셨네요. 순사가 이쪽까지…'),
        L('a3_me_08', 'me', 'neutral', '여기요. 세 장이 전부예요.'),
        L('a3_jeong_02', 'jeong_byeongwook', 'neutral', '…고맙습니다. 형님은 또 당신 몫은 안 챙기셨겠죠. 늘 그래요.'),
        L('a3_jeong_03', 'jeong_byeongwook', 'sad', '졸업 기념으로 책 내자고 졸랐는데…\n이 선생님 말씀대로 때가 아니래요.'),
        L('a3_jeong_04', 'jeong_byeongwook', 'neutral', '그래서 필사본이라도 제가 품고 있으려고요.'),
        L('a3_jeong_05', 'jeong_byeongwook', 'sad', '만약에… 만약에요.\n제가 살아서 돌아오지 못하면, 이건 연전으로 보내 주세요.', { pause: 500 }),
        L('a3_me_09', 'me', 'sad', '(……)'),
        L('a3_jeong_06', 'jeong_byeongwook', 'neutral', '약속해 주세요. 오늘 일은 아무한테도 말 안 하겠다고.'),
        L('a3_me_10', 'me', 'neutral', '약속할게요.'),
        '포플러 사이로 외투 깃을 세운 그림자가 다가온다. 윤동주다.',
        L('a3_yun_14', 'yun', 'smile', '무사하셨군요. 다행이에요.'),
        L('a3_yun_15', 'yun', 'neutral', '연우 씨는 어디로 가세요?'),
        L('a3_me_11', 'me', 'sad', '…멀리요. 아주 멀리.'),
        L('a3_yun_16', 'yun', 'smile', '그럼 인사는 짧게 할게요. 별이 잘 보이네요, 오늘.'),
        L('a3_me_12', 'me', 'sad', '네. 정말… 잘 보여요.', { pause: 600 }),
        '연우는 알고 있다. 그가 마지막으로 올려다볼 하늘이 어느 감옥의 작은 창이라는 것을.',
        L('a3_me_13', 'me', 'sad', '윤동주 씨. 시는… 계속 쓰세요.'),
        L('a3_yun_17', 'yun', 'smile', '쓸게요. 부끄럽지 않을 때까지.'),
        '그의 뒷모습이 포플러 길 끝에서 작아진다. 연우는 끝내 손을 흔들지 못했다.',
      ] },
      // 5. 마루: Bokdong hides 『우리말본』 sheets and his diary (choice: told_future)
      { goal: '소사실의 복동 찾아가기', who: 'bokdong2', script: [
        { bg: 'lamp', text: '소사실. 밤. 호롱불 아래 낡은 방이 좁고 따뜻하다.' },
        L('a3_bokdong_09', 'bokdong_old', 'neutral', '왔느냐. 앉아라, 좁다.'),
        L('a3_bokdong_10', 'bokdong_old', 'neutral', '최 선생이 쓰시던 『우리말본』 교정지 낱장이다. 쓰레기로 내놓으라더구나.'),
        L('a3_bokdong_11', 'bokdong_old', 'neutral', '“말이 살아 있어야 사람도 산다.” 떠나시며 그런 말씀을 하셨지. 아마도.'),
        L('a3_bokdong_12', 'bokdong_old', 'neutral', '순사들은 조선어 글은 태우라 한다. 태우는 시늉만 했다.'),
        '그가 방바닥 판자 한 장을 뜯어낸다. 아래에 마른 빈 공간이 있다.',
        L('a3_bokdong_13', 'bokdong_old', 'smile', '여기가 좋다. 습기도 안 차고 아무도 안 본다.'),
        L('a3_me_18', 'me', 'sad', '(…마루 밑. 몇 해 뒤 정병욱 씨의 어머니도\n광양 집 마루 밑에 윤동주의 원고를 숨기신다.)', { pause: 500 }),
        L('a3_bokdong_14', 'bokdong_old', 'neutral', '내 일기도 같이 넣는다. 쉰여섯 해 쓴 거다. 별것 없다.'),
        L('a3_me_14', 'me', 'sad', '별것 없다니요. 그게… 전부예요.'),
        L('a3_bokdong_15', 'bokdong_old', 'smile', '허허. 누가 언젠가 꺼내 읽겠지.'),
        L('a3_bokdong_16', 'bokdong_old', 'neutral', '읽고 나서 웃어 주면 좋겠다. 헛된 일은 아니었구나 싶게.', { pause: 500 }),
        L('a3_bokdong_17', 'bokdong_old', 'sad', '연우야. 너는 아느냐. 이게… 끝이 나긴 나느냐.'),
        L('a3_me_15', 'me', 'sad', '(……알려 드려야 할까.)', { choice: [
          { text: '“끝나요. 1945년 8월에요.”', set: 'told_future', next: [
            L('a3_bokdong_18', 'bokdong_old', 'surprised', '…사 년 뒤? 정말이냐.'),
            L('a3_me_16', 'me', 'smile', '네. 하루아침에 거리가 태극기로 가득 차요.'),
            L('a3_bokdong_19', 'bokdong_old', 'smile', '…살아서 보겠구나. 그럼 일기 끝에 한 줄만 더 쓰자.', { pause: 600 }),
            L('a3_bokdong_20', 'bokdong_old', 'neutral', '윤 군은. 그 아이도 그날을 보겠느냐.'),
            L('a3_me_17', 'me', 'sad', '…', { pause: 900 }),
            L('a3_bokdong_21', 'bokdong_old', 'sad', '…대답 말아라. 네 얼굴에 다 써 있다.'),
          ].concat(floorTail(30, 31, 32)) },
          { text: '(말없이 고개를 젓는다)', set: 'kept_silent', next: [
            L('a3_bokdong_22', 'bokdong_old', 'neutral', '…말하지 않는 것도 도리지.'),
            L('a3_bokdong_23', 'bokdong_old', 'smile', '알고 기다리면 하루가 더 길다. 모르고 기다리는 것도 복이다.'),
          ].concat(floorTail(33, 34, 35)) },
        ] }),
      ] },
      // 6. quiz at the exit
      { goal: '출구 앞 기록관의 마지막 퀴즈 풀기', who: 'quiz', quiz: [
        { q: '윤동주가 연희전문을 졸업한 해는?', a: ['1938년', '1941년', '1945년'], c: 1, why: '1941년 12월. 졸업을 앞두고 시를 세 벌 필사했소.' },
        { q: '정병욱의 어머니가 원고를 숨긴 곳은?', a: ['학교 도서관 서가', '광양 집 마루 밑', '기숙사 지붕'], c: 1, why: '명주 보자기에 싸서 마루 밑에 감췄소. 덕분에 시집이 세상에 나왔지.' },
        { q: '최현배가 쓴 우리말 문법책은?', a: ['『우리말본』', '『여유당전서』', '『조선사회경제사』'], c: 0, why: '우리말이 지워지던 시절에도 끝까지 지켜 낸 책이오.' },
      ] },
    ],
    ents: [
      N(10, 15, '소사 (복동)', 'bokdong_old', [
        L('a3_bokdong_90', 'bokdong_old', 'neutral', '쓸고 또 쓸어도 낙엽은 끝이 없구나.'),
      ], { id: 'bokdong1', until: 4, after: [
        L('a3_bokdong_91', 'bokdong_old', 'neutral', '다락 일은 조심해라. 벽에도 귀가 있는 시절이다.'),
      ] }),
      N(12, 4, '윤동주', 'yun', [
        L('a3_yun_90', 'yun', 'neutral', '…조용히요. 아래층에 사람이 있어요.'),
      ], { id: 'yun', until: 4, after: [
        L('a3_yun_91', 'yun', 'smile', '별이 잘 보이는 밤이에요.'),
      ] }),
      N(12, 9, '정병욱', 'jeong_byeongwook', [
        L('a3_jeong_90', 'jeong_byeongwook', 'neutral', '형님 심부름이죠? 먼저 순사부터 피하세요.'),
      ], { id: 'jeong', after: [
        L('a3_jeong_91', 'jeong_byeongwook', 'neutral', '약속, 안 잊을게요.'),
      ] }),
      N(3, 10, '소사실의 복동', 'bokdong_old', [
        L('a3_bokdong_92', 'bokdong_old', 'neutral', '다락 쪽은 다 끝났느냐. 들어와 앉아라, 좁다.'),
      ], { id: 'bokdong2', from: 4, after: [
        L('a3_bokdong_93', 'bokdong_old', 'smile', '가거라. 이 방은 내가 지킨다.'),
      ] }),
      S(8, 4, ['벽에 걸린 사진 — 정인보', '연전에서 한문과 조선문학을 가르치다 1937년 학교를 떠났다. ‘얼’을 말하던 사람.'], { name: '액자' }),
      S(16, 4, ['벽에 걸린 사진 — 백남운', '상과 교수로 『조선사회경제사』를 썼고, 1938년 사건으로 잡혀갔다.', '연전 사람들은 최현배, 정인보와 함께 그를 ‘삼보’라 불렀다.'], { name: '액자' }),
      S(11, 4, ['벽보: ‘국어 상용’', '여기서 ‘국어’는 일본어를 뜻한다. 조선어 강좌가 폐지되고 ‘일본학’ 과목이 생겼다.'], { name: '벽보', sprite: 'notice_board' }),
      S(14, 14, ['1932년 연희전문 교육방침 — ‘화충(和衷)’', '기독교 정신 위에 동서고금의 사상을 마음 깊이 화목하게 융합하여, 학문과 실용의 능력을 겸비한 인재를 기른다.']),
      S(13, 16, [
        '기록관의 메모',
        '이 교정은 곧 달라진다. 1942년 8월 언더우드 동상이 철거되고, 1944년 연희전문은 이름마저 바뀐다.',
        '그래도 이곳에서 적힌 것들은 마루 밑에서 숨을 쉰다.',
      ], { name: '메모' }),
      N(11, 16, '기록관', 'keeper', [
        L('a3_keeper_01', 'keeper', 'neutral', '이 밤의 이야기를 모두 듣고 오시오. 그때 시험하겠소.'),
      ], { id: 'quiz', after: [
        L('a3_keeper_02', 'keeper', 'reveal', '…가거라. 해방은 아직 멀다. 그래도 길은 이쪽이다.'),
      ] }),
      I(3, 1, 'page', 'page', '원고'), I(21, 1, 'page', 'page', '원고'), I(5, 10, 'page', 'page', '원고'),
      I(1, 1, 'heart', 'heart', '화충'), I(22, 16, 'heart', 'heart', '화충'),
    ],
    // patrol lanes: every waypoint and segment lies on walkable tiles and avoids NPC/sign tiles
    mobs: [
      ['guard', [[4, 5], [19, 5]]],
      ['guard', [[15, 6], [15, 13]]],
      ['guard', [[2, 7], [9, 7], [9, 12]]],
      ['guard', [[6, 1], [17, 1]]],
    ],
  };
})();
