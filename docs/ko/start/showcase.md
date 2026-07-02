---
description: Real-world OpenClaw projects from the community
read_when:
    - 실제 OpenClaw 사용 예시 찾기
    - 커뮤니티 프로젝트 주요 내용 업데이트
summary: OpenClaw로 구동되는 커뮤니티 제작 프로젝트 및 통합
title: 쇼케이스
x-i18n:
    generated_at: "2026-07-02T08:11:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw 프로젝트는 장난감 데모가 아닙니다. 사람들은 이미 사용하는 채널에서 PR 리뷰 루프, 모바일 앱, 홈 자동화, 음성 시스템, 개발 도구, 메모리 집약적 워크플로를 실제로 배포하고 있습니다. Telegram, WhatsApp, Discord, 터미널 위의 채팅 네이티브 빌드, API를 기다리지 않고 예약, 쇼핑, 지원을 처리하는 실제 자동화, 그리고 프린터, 청소기, 카메라, 홈 시스템과 연결되는 물리 세계 통합까지 포함됩니다.

<Info>
**소개되고 싶으신가요?** [Discord의 #self-promotion](https://discord.gg/clawd)에 프로젝트를 공유하거나 [X에서 @openclaw를 태그](https://x.com/openclaw)하세요.
</Info>

## Discord의 최신 소식

코딩, 개발 도구, 모바일, 채팅 네이티브 제품 제작 전반의 최근 주목 사례입니다.

<CardGroup cols={2}>

<Card title="PR 리뷰에서 Telegram 피드백까지" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode가 변경을 마치고 PR을 열면, OpenClaw가 diff를 리뷰하고 제안과 명확한 병합 판단을 Telegram으로 답장합니다.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="몇 분 만에 만드는 와인 셀러 Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

"Robby"(@openclaw)에게 로컬 와인 셀러 Skill을 요청했습니다. 샘플 CSV 내보내기 파일과 저장 경로를 요청한 뒤, 해당 Skill을 빌드하고 테스트합니다(예시에는 962병).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco 쇼핑 자동 조종" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

주간 식단 계획, 단골 상품, 배송 시간대 예약, 주문 확인까지 처리합니다. API 없이 브라우저 제어만 사용합니다.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG 스크린샷-Markdown 변환" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

화면 영역을 단축키로 선택하면, Gemini 비전으로 즉시 Markdown이 클립보드에 들어갑니다.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex, OpenClaw 전반의 Skills와 명령을 관리하는 데스크톱 앱입니다.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram 음성 메모(papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTS를 감싸고 결과를 Telegram 음성 메모로 보냅니다(성가신 자동 재생 없음).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

로컬 OpenAI Codex 세션을 나열, 검사, 감시하는 Homebrew 설치 헬퍼입니다(CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D 프린터 제어" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab 프린터를 제어하고 문제를 해결합니다. 상태, 작업, 카메라, AMS, 보정 등을 지원합니다.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="비엔나 교통(Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

비엔나 대중교통의 실시간 출발, 운행 차질, 엘리베이터 상태, 경로 안내를 제공합니다.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay 학교 급식" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay를 통한 영국 학교 급식 예약 자동화입니다. 안정적인 표 셀 클릭을 위해 마우스 좌표를 사용합니다.
</Card>

<Card title="R2 업로드(Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3에 업로드하고 안전한 사전 서명 다운로드 링크를 생성합니다. 원격 OpenClaw 인스턴스에 유용합니다.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="Telegram을 통한 iOS 앱" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

지도와 음성 녹음 기능을 갖춘 완전한 iOS 앱을 만들고, App Store 배포 준비까지 전부 Telegram 채팅으로 완료했습니다.
</Card>

<Card title="Oura Ring 건강 어시스턴트" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ring 데이터를 캘린더, 약속, 헬스장 일정과 통합하는 개인 AI 건강 어시스턴트입니다.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team(14개 이상 에이전트)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Opus 4.5 오케스트레이터가 Codex 워커에게 위임하는 하나의 Gateway 아래 14개 이상의 에이전트입니다. 에이전트 샌드박싱은 [기술 설명](https://github.com/adam91holt/orchestrated-ai-articles)과 [Clawdspace](https://github.com/adam91holt/clawdspace)를 참고하세요.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

에이전트형 워크플로(Claude Code, OpenClaw)와 통합되는 Linear용 CLI입니다. 터미널에서 이슈, 프로젝트, 워크플로를 관리합니다.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop을 통해 메시지를 읽고, 보내고, 보관합니다. Beeper local MCP API를 사용하므로 에이전트가 모든 채팅(iMessage, WhatsApp 등)을 한곳에서 관리할 수 있습니다.
</Card>

</CardGroup>

## 자동화와 워크플로

일정 예약, 브라우저 제어, 지원 루프, 그리고 제품의 "그 작업을 대신 해줘"에 해당하는 부분입니다.

<CardGroup cols={2}>

<Card title="Winix 공기청정기 제어" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code가 공기청정기 제어 기능을 발견하고 확인한 뒤, OpenClaw가 이어받아 실내 공기질을 관리합니다.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="예쁜 하늘 카메라 촬영" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

옥상 카메라가 트리거합니다. 하늘이 예뻐 보일 때마다 OpenClaw에게 하늘 사진을 찍어 달라고 요청합니다. OpenClaw가 Skill을 설계하고 사진을 촬영했습니다.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="시각적 아침 브리핑 장면" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

예약된 프롬프트가 OpenClaw 페르소나를 통해 매일 아침 하나의 장면 이미지(날씨, 작업, 날짜, 좋아하는 게시물 또는 인용문)를 생성합니다.
</Card>

<Card title="파델 코트 예약" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 예약 가능 여부 확인기와 예약 CLI입니다. 다시는 빈 코트를 놓치지 마세요.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="회계 접수" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

이메일에서 PDF를 수집하고 세무 컨설턴트에게 보낼 문서를 준비합니다. 월간 회계를 자동 조종합니다.
</Card>

<Card title="소파 감자 개발 모드" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix를 보면서 Telegram으로 개인 사이트 전체를 다시 만들었습니다. Notion에서 Astro로, 게시물 18개를 마이그레이션하고 DNS를 Cloudflare로 옮겼습니다. 노트북은 한 번도 열지 않았습니다.
</Card>

<Card title="구직 에이전트" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

채용 공고를 검색하고, 이력서 키워드와 대조한 뒤, 관련 기회를 링크와 함께 반환합니다. JSearch API를 사용해 30분 만에 만들었습니다.
</Card>

<Card title="Jira Skill 빌더" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw가 Jira에 연결한 뒤, 즉석에서 새 Skill을 생성했습니다(ClawHub에 존재하기 전).
</Card>

<Card title="Telegram을 통한 Todoist Skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist 작업을 자동화하고 OpenClaw가 Telegram 채팅에서 직접 Skill을 생성하게 했습니다.
</Card>

<Card title="TradingView 분석" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

브라우저 자동화를 통해 TradingView에 로그인하고, 차트 스크린샷을 찍고, 요청 시 기술적 분석을 수행합니다. API는 필요 없습니다. 브라우저 제어만 있으면 됩니다.
</Card>

<Card title="Slack 자동 지원" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

회사 Slack 채널을 감시하고, 유용하게 응답하며, 알림을 Telegram으로 전달합니다. 요청받지 않았는데도 배포된 앱의 프로덕션 버그를 자율적으로 수정했습니다.
</Card>

</CardGroup>

## 지식과 메모리

개인 또는 팀 지식을 색인화하고, 검색하고, 기억하고, 추론하는 시스템입니다.

<CardGroup cols={2}>

<Card title="xuezh 중국어 학습" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw를 통해 발음 피드백과 학습 플로를 제공하는 중국어 학습 엔진입니다.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp 메모리 금고" icon="vault">
  **Community** • `memory` `transcription` `indexing`

전체 WhatsApp 내보내기를 수집하고, 1천 개 이상의 음성 메모를 전사하며, git 로그와 교차 확인한 뒤, 링크된 markdown 보고서를 출력합니다.
</Card>

<Card title="Karakeep 의미 검색" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant와 OpenAI 또는 Ollama 임베딩을 사용해 Karakeep 북마크에 벡터 검색을 추가합니다.
</Card>

<Card title="Inside-Out-2 메모리" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

세션 파일을 메모리로, 그다음 신념으로, 그다음 진화하는 자기 모델로 바꾸는 별도 메모리 관리자입니다.
</Card>

</CardGroup>

## 음성과 전화

음성 우선 진입점, 전화 브리지, 전사 중심 워크플로입니다.

<CardGroup cols={2}>

<Card title="Clawdia 전화 브리지" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi 음성 어시스턴트에서 OpenClaw HTTP로 이어지는 브리지입니다. 에이전트와 거의 실시간 전화 통화를 할 수 있습니다.
</Card>

<Card title="OpenRouter 전사" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter(Gemini 등)를 통한 다국어 오디오 전사입니다. ClawHub에서 사용할 수 있습니다.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## 인프라와 배포

OpenClaw를 더 쉽게 실행하고 확장하게 해주는 패키징, 배포, 통합입니다.

<CardGroup cols={2}>

<Card title="Home Assistant 애드온" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH 터널 지원과 영구 상태를 갖추고 Home Assistant OS에서 실행되는 OpenClaw gateway입니다.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

자연어로 Home Assistant 기기를 제어하고 자동화합니다.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

재현 가능한 배포를 위한 필요한 요소가 포함된 nix화된 OpenClaw 구성입니다.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

khal 및 vdirsyncer를 사용하는 캘린더 skill입니다. 셀프 호스팅 캘린더 통합입니다.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## 홈 및 하드웨어

OpenClaw의 물리 세계 측면: 집, 센서, 카메라, 청소기 및 기타 기기입니다.

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

OpenClaw를 인터페이스로 사용하는 Nix 네이티브 홈 자동화와 Grafana 대시보드입니다.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

자연스러운 대화로 Roborock 로봇 청소기를 제어합니다.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## 커뮤니티 프로젝트

단일 워크플로를 넘어 더 넓은 제품이나 생태계로 성장한 것들입니다.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **커뮤니티** • `marketplace` `astronomy` `webapp`

완전한 천문 장비 마켓플레이스입니다. OpenClaw 생태계와 함께, 그리고 그 주변에서 구축되었습니다.
</Card>

</CardGroup>

## 프로젝트 제출

<Steps>
  <Step title="Share it">
    [Discord의 #self-promotion](https://discord.gg/clawd)에 게시하거나 [@openclaw로 트윗](https://x.com/openclaw)하세요.
  </Step>
  <Step title="Include details">
    무엇을 하는지 알려 주고, 리포지토리나 데모 링크를 제공하며, 스크린샷이 있으면 공유해 주세요.
  </Step>
  <Step title="Get featured">
    돋보이는 프로젝트를 이 페이지에 추가합니다.
  </Step>
</Steps>

## 관련 항목

- [시작하기](/ko/start/getting-started)
- [OpenClaw](/ko/start/openclaw)
