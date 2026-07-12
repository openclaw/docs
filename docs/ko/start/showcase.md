---
description: Real-world OpenClaw projects from the community
read_when:
    - 실제 OpenClaw 사용 예시 찾기
    - 커뮤니티 프로젝트 주요 내용 업데이트 중
summary: OpenClaw로 구동되는 커뮤니티 제작 프로젝트 및 통합 기능
title: 쇼케이스
x-i18n:
    generated_at: "2026-07-12T01:18:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

커뮤니티에서 제작한 OpenClaw 프로젝트: PR 검토 루프, 모바일 앱, 홈 자동화, 음성 시스템, 개발자 도구, 메모리 워크플로. Telegram, WhatsApp, Discord 및 터미널에서 채팅 중심으로 구축되었습니다.

<Info>
**소개되기를 원하시나요?** [Discord의 #self-promotion](https://discord.gg/clawd)에서 프로젝트를 공유하거나 [X에서 @openclaw를 태그하세요](https://x.com/openclaw).
</Info>

## Discord의 최신 소식

코딩, 개발자 도구, 모바일 및 채팅 중심 제품 개발 분야에서 최근 주목받은 프로젝트입니다.

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

에이전트에게 "이 HTML을 배포해 줘"라고 말하면 약 1초 만에 공개 URL을 받을 수 있습니다. 페이지는 한 시간 후 자동 만료되며 서버, 구성, 가입이 필요하지 않습니다.
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

어떤 URL이든 붙여 넣으면 판정 결과를 받을 수 있습니다. PhishTank, OpenPhish, CERT.PL 등 38개 피드에서 수집한 250만 개 이상의 사기 도메인과 로컬에서 대조하므로 검색 기록이 기기 외부로 전송되지 않습니다.
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

제품 작업을 위한 세 가지 Skills입니다. [소크라테스식 대화](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog)는 답변하기 전에 질문을 철저히 검토하고, [카노 모델 전략가](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist)는 기능을 가치가 있는 항목별로 분류하며, [읽기 쉬운 에이전트 출력](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output)은 에이전트 출력을 쉬운 언어로 다시 작성합니다.
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

하위 에이전트가 작업하는 동안 오케스트레이터가 유휴 상태로 머무는 것을 방지합니다. 상위 에이전트를 차단하는 대신 결과가 편지함에 도착하는 비동기 콜백 메커니즘입니다.
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

2~4GB 메모리 기기에서도 OpenClaw를 사용할 수 있게 해 줍니다. 사용 가능한 메모리를 확인하고 기기가 스와핑을 시작하기 전에 무거운 기능을 축소합니다. [GitHub 소스](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

OpenClaw를 일급으로 지원하는 NVIDIA 엔지니어의 토큰 비용 추적기입니다. 모델별, 세션별로 에이전트 비용이 정확히 어디에 사용되는지 확인할 수 있습니다.
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

채팅에서 다이어그램을 설명하면 프로그래밍 방식으로 생성된 Excalidraw 스케치를 받을 수 있습니다.
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

OpenClaw가 자체 Google Analytics 쿼리 도구를 구축하도록 한 다음, 이를 패키징하여 ClawHub에 게시했습니다.
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

"내 GPU에는 어떤 LLM이 적합한가?"라는 질문에 답하기 위해 59개 에이전트 역할에서 모델을 벤치마크합니다. 로컬 모델을 선택할 때 커뮤니티에서 널리 선호하는 도구입니다.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

제공자에 종속되지 않는 노래 생성 도구입니다. 단발성 프롬프트 대신 트랙을 계획하고, 가사를 구성하고, 빈약한 결과를 수정합니다. BPM, 조성, 구조 및 매시업 제어 기능을 갖춘 [MiniMax 변형](https://clawhub.ai/luischarro/music-craft-minimax)도 포함합니다.
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode가 변경을 완료하고 PR을 열면 OpenClaw가 차이를 검토한 후 제안 사항과 명확한 병합 판정을 Telegram으로 회신합니다.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

"Robby"(@openclaw)에게 로컬 와인 저장고 Skill을 요청했습니다. 샘플 CSV 내보내기 파일과 저장 경로를 요청한 후 Skill을 구축하고 테스트합니다(예시에는 962병이 있습니다).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

주간 식단을 계획하고, 자주 구매하는 품목을 담고, 배송 시간대를 예약하고, 주문을 확인합니다. API 없이 브라우저 제어만 사용합니다.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

단축키로 화면 영역을 지정하면 Gemini 비전을 사용해 즉시 Markdown을 클립보드에 복사합니다.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex 및 OpenClaw 전반의 Skills와 명령을 관리하는 데스크톱 앱입니다.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **커뮤니티** • `voice` `tts` `telegram`

papla.media TTS를 래핑하고 결과를 Telegram 음성 메시지로 전송합니다(성가신 자동 재생 없음).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

로컬 OpenAI Codex 세션을 나열하고, 검사하고, 모니터링하는 Homebrew 설치형 도우미입니다(CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab 프린터를 제어하고 문제를 해결합니다. 상태, 작업, 카메라, AMS, 보정 등을 지원합니다.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

빈 대중교통의 실시간 출발 정보, 운행 장애, 엘리베이터 상태 및 경로 안내를 제공합니다.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay를 통한 영국 학교 급식 예약을 자동화합니다. 표의 셀을 안정적으로 클릭하기 위해 마우스 좌표를 사용합니다.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3에 업로드하고 안전한 사전 서명 다운로드 링크를 생성합니다. 원격 OpenClaw 인스턴스에 유용합니다.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Telegram 채팅만으로 지도와 음성 녹음 기능을 갖춘 완전한 iOS 앱을 구축하고 App Store 배포까지 준비했습니다.
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura Ring 데이터를 캘린더, 일정 및 헬스장 계획과 통합하는 개인용 AI 건강 도우미입니다.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

하나의 Gateway 아래에서 14개 이상의 에이전트를 운영하며, Opus 4.5 오케스트레이터가 Codex 작업자에게 업무를 위임합니다. 에이전트 샌드박싱에 관한 [기술 문서](https://github.com/adam91holt/orchestrated-ai-articles)와 [Clawdspace](https://github.com/adam91holt/clawdspace)를 참조하세요.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

에이전트형 워크플로(Claude Code, OpenClaw)와 통합되는 Linear용 CLI입니다. 터미널에서 이슈, 프로젝트 및 워크플로를 관리할 수 있습니다.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop을 통해 메시지를 읽고, 보내고, 보관합니다. Beeper local MCP API를 사용하므로 에이전트가 모든 채팅(iMessage, WhatsApp 등)을 한곳에서 관리할 수 있습니다.
</Card>

</CardGroup>

## 자동화 및 워크플로

예약, 브라우저 제어, 지원 루프 및 제품의 "작업을 대신 처리해 줘" 측면을 다룹니다.

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code가 공기청정기 제어 방법을 발견하고 확인한 다음, OpenClaw가 방의 공기질 관리를 이어받습니다.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

옥상 카메라로 트리거됩니다. 하늘이 아름다워 보일 때마다 사진을 찍도록 OpenClaw에 요청하면 Skill을 설계하고 사진을 촬영합니다.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

예약된 프롬프트가 OpenClaw 페르소나를 통해 매일 아침 하나의 장면 이미지(날씨, 작업, 날짜, 좋아하는 게시물 또는 인용문)를 생성합니다.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 예약 가능 여부 확인 도구와 예약 CLI입니다. 이제 빈 코트를 놓치지 마세요.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **커뮤니티** • `automation` `email` `pdf`

이메일에서 PDF를 수집하고 세무 상담사를 위한 문서를 준비합니다. 월간 회계 업무를 자동으로 처리합니다.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix를 시청하면서 Telegram을 통해 개인 사이트 전체를 다시 구축했습니다. Notion에서 Astro로 이전하고 게시물 18개를 마이그레이션했으며 DNS를 Cloudflare로 옮겼습니다. 노트북은 한 번도 열지 않았습니다.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

채용 공고를 검색하고 이력서 키워드와 대조한 후 관련 기회를 링크와 함께 반환합니다. JSearch API를 사용해 30분 만에 구축했습니다.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw을 Jira에 연결한 다음, ClawHub에 존재하기도 전에 즉석에서 새로운 Skills를 생성했습니다.
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist 작업을 자동화하고 OpenClaw이 Telegram 채팅에서 직접 Skills를 생성하도록 했습니다.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

브라우저 자동화를 통해 TradingView에 로그인하고 차트를 캡처한 뒤, 요청에 따라 기술적 분석을 수행합니다. API는 필요하지 않으며 브라우저 제어만으로 작동합니다.
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

OpenClaw이 자동차 판매점들과 자유롭게 협상하도록 했습니다. 주고받는 협상을 처리해 가격을 4,200달러 낮췄습니다.
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

이메일에서 다음 항공편을 찾고 온라인 체크인을 진행한 뒤 창가 좌석을 선택합니다. 항공사 앱은 필요하지 않습니다.
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

보험금을 자율적으로 청구하고 후속 예약까지 잡았습니다.
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

부동산 검색과 가치 평가를 위한 Idealista API CLI를 Skills로 래핑하여 에이전트가 채팅에서 주택을 찾을 수 있게 했습니다.
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Gmail에서 작업 지시를 확인하고, Telegram으로 전송된 부동산 사진을 분석하며, 여러 페이지로 구성된 LaTeX 견적서 PDF를 작성하고 Xero를 통해 청구서를 발행합니다.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

회사 Slack 채널을 모니터링하고 유용한 답변을 제공하며 알림을 Telegram으로 전달합니다. 요청받지 않았는데도 배포된 앱의 프로덕션 버그를 자율적으로 수정했습니다.
</Card>

</CardGroup>

## 지식과 메모리

개인 또는 팀의 지식을 색인화하고 검색하고 기억하며 추론하는 시스템입니다.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw을 통해 발음 피드백과 학습 과정을 제공하는 중국어 학습 엔진입니다.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

상위 X 계정 100개에서 게시물 400만 개를 가져와 조회 가능한 분석 파이프라인으로 변환했습니다.
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

수년간의 혈액 검사 결과를 구조화된 Notion 데이터베이스로 정리했습니다.
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

모든 메모리를 버전 관리되는 Obsidian 보관소에 마크다운으로 저장하는 WhatsApp 상시 사용 어시스턴트입니다. 칼로리 및 운동 추적, 할 일 목록, 생활 행정 업무를 처리합니다.
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

가족 Telegram 그룹 채팅에서 활동하며 50명이 넘는 친척들의 이야기를 기록하고, 관련 정보를 바탕으로 후속 질문을 합니다. 네팔어 원어민에게는 네팔어로 답변합니다.
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **커뮤니티** • `memory` `transcription` `indexing`

전체 WhatsApp 내보내기 데이터를 수집하고, 1,000개가 넘는 음성 메모를 전사하며, git 로그와 교차 확인한 뒤 서로 연결된 마크다운 보고서를 출력합니다.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant와 OpenAI 또는 Ollama 임베딩을 사용하여 Karakeep 북마크에 벡터 검색을 추가합니다.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **커뮤니티** • `memory` `beliefs` `self-model`

세션 파일을 메모리로, 그다음에는 신념으로, 마지막에는 계속 진화하는 자기 모델로 변환하는 별도의 메모리 관리자입니다.
</Card>

</CardGroup>

## 음성과 전화

음성 중심 진입점, 전화 연결 기능, 전사를 많이 사용하는 워크플로입니다.

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Pebble Ring을 한 번 탭하면 OpenClaw과 음성 대화가 시작되어 웨어러블 기기에서 에이전트에 접근할 수 있습니다.
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

채팅 안에서 사용할 수 있는 완전한 미디어 스튜디오입니다. TTS, 전사, 브라우저 자동화가 Codex 5.2 및 MiniMax에 연결되어 있습니다.
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

iPhone Action Button을 OpenClaw에 연결했습니다. 버튼을 누르고 말하면 에이전트가 무전기처럼 음성으로 답합니다.
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi 음성 어시스턴트를 OpenClaw HTTP에 연결하는 브리지입니다. 에이전트와 거의 실시간으로 통화할 수 있습니다.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter를 통한 다국어 오디오 전사 기능입니다. Gemini 등을 지원하며 ClawHub에서 이용할 수 있습니다.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## 인프라 및 배포

OpenClaw을 더 쉽게 실행하고 확장할 수 있게 하는 패키징, 배포 및 통합 기능입니다.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH 터널 지원과 영구 상태 저장 기능을 갖추고 Home Assistant OS에서 실행되는 OpenClaw Gateway입니다.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

자연어를 통해 Home Assistant 기기를 제어하고 자동화합니다.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

빠른 제어 기능과 함께 에이전트 상태를 보여주는 네이티브 Swift 메뉴 막대 앱입니다.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

재현 가능한 배포를 위해 필요한 기능을 모두 포함한 Nix 기반 OpenClaw 구성입니다.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

khal과 vdirsyncer를 사용하는 캘린더 Skills입니다. 자체 호스팅 캘린더 통합 기능을 제공합니다.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## 가정과 하드웨어

주택, 센서, 카메라, 청소기 및 기타 기기를 아우르는 OpenClaw의 물리적 환경 활용 사례입니다.

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw이 로컬 네트워크에서 HomePod를 찾아 직접 제어용 Skills를 작성했습니다.
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

저렴한 홀로그램 큐브를 책상 위 에이전트의 물리적 얼굴로 사용합니다.
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

OpenClaw을 인터페이스로 사용하고 Grafana 대시보드를 함께 제공하는 Nix 네이티브 홈 자동화 시스템입니다.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

자연스러운 대화를 통해 Roborock 로봇청소기를 제어합니다.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## 커뮤니티 프로젝트

단일 워크플로를 넘어 더 폭넓은 제품이나 생태계로 성장한 프로젝트입니다.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **커뮤니티** • `marketplace` `astronomy` `webapp`

완전한 천문 장비 마켓플레이스입니다. OpenClaw 생태계를 활용하고 그 주변에서 구축되었습니다.
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

개방형 에이전트 간 협상 기능입니다. 사용자의 에이전트가 다른 Node와 거래, 일정, 서비스 계약을 협상하고 결과에 암호학적으로 서명합니다. 사용자는 승인하거나 거부하기만 하면 됩니다.
</Card>

</CardGroup>

## 프로젝트 제출하기

<Steps>
  <Step title="Share it">
    [Discord의 #self-promotion](https://discord.gg/clawd)에 게시하거나 [@openclaw을 태그해 트윗](https://x.com/openclaw)하세요.
  </Step>
  <Step title="Include details">
    프로젝트의 기능을 설명하고 저장소나 데모 링크를 제공하며, 스크린샷이 있다면 공유해 주세요.
  </Step>
  <Step title="Get featured">
    뛰어난 프로젝트는 이 페이지에 추가하겠습니다.
  </Step>
</Steps>

## 관련 문서

- [시작하기](/ko/start/getting-started)
- [OpenClaw](/ko/start/openclaw)
- [openclaw.ai에서 전체 X 쇼케이스 보기](https://openclaw.ai/showcase/)
