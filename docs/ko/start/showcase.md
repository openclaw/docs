---
description: Real-world OpenClaw projects from the community
read_when:
    - 실제 OpenClaw 사용 예시를 찾고 있습니다
    - 커뮤니티 프로젝트 하이라이트 업데이트하기
summary: OpenClaw로 구동되는 커뮤니티 제작 프로젝트 및 통합
title: 쇼케이스
x-i18n:
    generated_at: "2026-04-23T14:09:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bf4bd2548709a01ad18331537f804b32c3213139c2234915aa17f7a2638f19f
    source_path: start/showcase.md
    workflow: 15
---

# 쇼케이스

<div className="showcase-hero">
  <p className="showcase-kicker">채팅, 터미널, browser, 거실에서 만들어짐</p>
  <p className="showcase-lead">
    OpenClaw 프로젝트는 장난감 데모가 아닙니다. 사람들은 이미 사용하는 채널에서 PR 리뷰 루프, 모바일 앱, 홈 오토메이션,
    음성 시스템, devtools, 메모리 집약적 워크플로를 실제로 출시하고 있습니다.
  </p>
  <div className="showcase-actions">
    <a href="#videos">데모 보기</a>
    <a href="#fresh-from-discord">프로젝트 둘러보기</a>
    <a href="https://discord.gg/clawd">내 프로젝트 공유하기</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>채팅 네이티브 빌드</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, 웹 채팅, 터미널 우선 워크플로.</span>
    </div>
    <div className="showcase-highlight">
      <strong>실제 자동화</strong>
      <span>API를 기다리지 않고 예약, 쇼핑, 지원, 보고, browser 제어까지.</span>
    </div>
    <div className="showcase-highlight">
      <strong>로컬 + 물리적 세계</strong>
      <span>프린터, 청소기, 카메라, 건강 데이터, 홈 시스템, 개인 지식 베이스.</span>
    </div>
  </div>
</div>

<Info>
**소개되고 싶나요?** [Discord의 #self-promotion](https://discord.gg/clawd)에서 프로젝트를 공유하거나 [X에서 @openclaw를 태그](https://x.com/openclaw)하세요.
</Info>

<div className="showcase-jump-links">
  <a href="#videos">영상</a>
  <a href="#fresh-from-discord">Discord 최신 프로젝트</a>
  <a href="#automation-workflows">자동화</a>
  <a href="#knowledge-memory">메모리</a>
  <a href="#voice-phone">음성 및 전화</a>
  <a href="#infrastructure-deployment">인프라</a>
  <a href="#home-hardware">홈 및 하드웨어</a>
  <a href="#community-projects">커뮤니티</a>
  <a href="#submit-your-project">프로젝트 제출</a>
</div>

## 영상

<p className="showcase-section-intro">
  “이게 뭐지?”에서 “아, 이해했다”까지 가장 빠르게 가고 싶다면 여기서 시작하세요.
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>전체 설정 워크스루</h3>
    <p>VelvetShark, 28분. 설치, 온보딩, 첫 번째로 제대로 동작하는 어시스턴트까지 전 과정을 다룹니다.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">YouTube에서 보기</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw showcase video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>커뮤니티 쇼케이스 릴</h3>
    <p>OpenClaw을 중심으로 만들어진 실제 프로젝트, 표면, 워크플로를 더 빠르게 훑어봅니다.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">YouTube에서 보기</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw community showcase"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>현장에서 쓰이는 프로젝트</h3>
    <p>채팅 네이티브 코딩 루프부터 하드웨어와 개인 자동화까지, 커뮤니티의 실제 사례를 보여줍니다.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">YouTube에서 보기</a>
  </div>
</div>

## Discord 최신 프로젝트

<p className="showcase-section-intro">
  코딩, devtools, 모바일, 채팅 네이티브 제품 개발 전반의 최근 눈에 띄는 사례들입니다.
</p>

<CardGroup cols={2}>

<Card title="PR Review → Telegram 피드백" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode가 변경을 마무리 → PR 생성 → OpenClaw이 diff를 검토하고 Telegram에서 “사소한 제안”과 함께 명확한 병합 판단을 답장합니다(먼저 적용해야 할 중요한 수정 포함).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegram으로 전달된 OpenClaw PR 리뷰 피드백" />
</Card>

<Card title="몇 분 만에 완성한 와인 셀러 Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

“Robby”(@openclaw)에게 로컬 와인 셀러 skill을 요청했습니다. 샘플 CSV 내보내기와 저장 위치를 묻고, 이후 빠르게 skill을 빌드/테스트합니다(예시에서는 962병).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="CSV로부터 로컬 와인 셀러 skill을 만드는 OpenClaw" />
</Card>

<Card title="Tesco 쇼핑 오토파일럿" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

주간 식단 계획 → 자주 사는 품목 → 배송 슬롯 예약 → 주문 확인. API 없이 browser 제어만으로 동작합니다.

  <img src="/assets/showcase/tesco-shop.jpg" alt="채팅을 통한 Tesco 쇼핑 자동화" />
</Card>

<Card title="SNAG 스크린샷-마크다운" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

화면 영역을 단축키로 선택 → Gemini 비전 → 클립보드에 즉시 Markdown 생성.

  <img src="/assets/showcase/snag.png" alt="SNAG 스크린샷-마크다운 도구" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex, OpenClaw 전반의 skills/commands를 관리하는 데스크톱 앱.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 앱" />
</Card>

<Card title="Telegram 음성 노트 (papla.media)" icon="microphone" href="https://papla.media/docs">
  **커뮤니티** • `voice` `tts` `telegram`

papla.media TTS를 감싸고 결과를 Telegram 음성 노트로 전송합니다(거슬리는 자동 재생 없음).

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS에서 생성된 Telegram 음성 노트 출력" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

로컬 OpenAI Codex 세션을 나열/검사/감시하는 Homebrew 설치 도우미(CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub의 CodexMonitor" />
</Card>

<Card title="Bambu 3D 프린터 제어" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab 프린터를 제어하고 문제를 해결합니다: 상태, 작업, 카메라, AMS, 보정 등.

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub의 Bambu CLI skill" />
</Card>

<Card title="비엔나 교통 (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

비엔나 대중교통의 실시간 출발 정보, 운행 중단, 엘리베이터 상태, 경로 안내를 제공합니다.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill" />
</Card>

<Card title="ParentPay 학교 급식" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay를 통한 영국 학교 급식 예약 자동화. 안정적인 표 셀 클릭을 위해 마우스 좌표를 사용합니다.
</Card>

<Card title="R2 Upload (내 파일 보내기)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3에 업로드하고 안전한 presigned 다운로드 링크를 생성합니다. 원격 OpenClaw 인스턴스에 적합합니다.
</Card>

<Card title="Telegram으로 만든 iOS 앱" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

지도와 음성 녹음을 포함한 완전한 iOS 앱을 Telegram 채팅만으로 만들어 TestFlight에 배포했습니다.

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight의 iOS 앱" />
</Card>

<Card title="Oura Ring 건강 어시스턴트" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ring 데이터와 캘린더, 약속, 운동 일정을 통합한 개인 AI 건강 어시스턴트.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring 건강 어시스턴트" />
</Card>
<Card title="Kev의 Dream Team (14개 이상 에이전트)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

Opus 4.5 오케스트레이터가 Codex 워커에게 작업을 위임하는, 하나의 gateway 아래 14개 이상의 에이전트. Dream Team 구성, 모델 선택, 샌드박싱, Webhook, Heartbeat, 위임 흐름을 다루는 포괄적인 [기술 문서](https://github.com/adam91holt/orchestrated-ai-articles)가 있습니다. 에이전트 샌드박싱용 [Clawdspace](https://github.com/adam91holt/clawdspace)도 제공됩니다. [블로그 글](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

에이전트형 워크플로(Claude Code, OpenClaw)와 통합되는 Linear용 CLI. 터미널에서 이슈, 프로젝트, 워크플로를 관리합니다. 첫 외부 PR이 병합되었습니다!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Beeper Desktop을 통해 메시지를 읽고, 보내고, 보관합니다. Beeper local MCP API를 사용하므로 에이전트가 하나의 장소에서 모든 채팅(iMessage, WhatsApp 등)을 관리할 수 있습니다.
</Card>

</CardGroup>

<a id="automation-workflows"></a>

## 자동화 및 워크플로

<p className="showcase-section-intro">
  일정 관리, browser 제어, 지원 루프, 그리고 “그냥 일을 대신 해줘”라는 제품의 측면입니다.
</p>

<CardGroup cols={2}>

<Card title="Winix 공기청정기 제어" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code가 공기청정기 제어 방식을 찾아 확인한 뒤, OpenClaw이 이를 넘겨받아 실내 공기 질을 관리합니다.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw을 통한 Winix 공기청정기 제어" />
</Card>

<Card title="예쁜 하늘 카메라 촬영" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

지붕 카메라에 의해 트리거됨: 하늘이 예뻐 보일 때마다 OpenClaw에게 하늘 사진을 찍어 달라고 요청 — skill을 설계하고 실제로 촬영까지 했습니다.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw이 촬영한 지붕 카메라 하늘 스냅샷" />
</Card>

<Card title="시각적 아침 브리핑 장면" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

예약된 프롬프트가 OpenClaw 페르소나를 통해 매일 아침 하나의 “장면” 이미지를 생성합니다(날씨, 작업, 날짜, 좋아하는 게시물/인용문).
</Card>

<Card title="Padel 코트 예약" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomic 가용성 확인 + 예약 CLI. 다시는 빈 코트를 놓치지 마세요.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 스크린샷" />
</Card>

<Card title="회계 서류 수집" icon="file-invoice-dollar">
  **커뮤니티** • `automation` `email` `pdf`
  
  이메일에서 PDF를 수집하고 세무사를 위한 문서를 준비합니다. 월간 회계를 자동화합니다.
</Card>

<Card title="소파 감자 개발 모드" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Netflix를 보면서 Telegram만으로 개인 사이트 전체를 다시 만들었습니다 — Notion → Astro, 게시물 18개 마이그레이션, DNS는 Cloudflare로 이전. 노트북은 한 번도 열지 않았습니다.
</Card>

<Card title="구직 에이전트" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

채용 공고를 검색하고, 이력서 키워드와 매칭한 뒤, 관련 기회를 링크와 함께 반환합니다. JSearch API를 사용해 30분 만에 만들었습니다.
</Card>

<Card title="Jira Skill 빌더" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw을 Jira에 연결한 뒤, 새로운 skill을 즉석에서 생성했습니다(ClawHub에 존재하기 전).
</Card>

<Card title="Telegram으로 만든 Todoist Skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Todoist 작업을 자동화하고 OpenClaw이 skill을 Telegram 채팅 안에서 직접 생성하게 했습니다.
</Card>

<Card title="TradingView 분석" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

browser 자동화로 TradingView에 로그인하고, 차트 스크린샷을 찍고, 요청 시 기술적 분석을 수행합니다. API는 필요 없고 browser 제어만 있으면 됩니다.
</Card>

<Card title="Slack 자동 지원" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

회사 Slack 채널을 감시하고, 도움이 되는 답변을 하며, 알림을 Telegram으로 전달합니다. 요청받지 않았는데도 배포된 앱의 프로덕션 버그를 자율적으로 수정했습니다.
</Card>

</CardGroup>

<a id="knowledge-memory"></a>

## 지식 및 메모리

<p className="showcase-section-intro">
  개인 또는 팀의 지식을 색인화하고, 검색하고, 기억하고, 추론하는 시스템입니다.
</p>

<CardGroup cols={2}>

<Card title="xuezh 중국어 학습" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  OpenClaw을 통한 발음 피드백과 학습 흐름을 제공하는 중국어 학습 엔진.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 발음 피드백" />
</Card>

<Card title="WhatsApp 메모리 보관소" icon="vault">
  **커뮤니티** • `memory` `transcription` `indexing`
  
  전체 WhatsApp 내보내기를 수집하고, 1천 개 이상의 음성 노트를 전사하고, git 로그와 교차 확인한 뒤, 연결된 markdown 보고서를 출력합니다.
</Card>

<Card title="Karakeep 시맨틱 검색" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Qdrant + OpenAI/Ollama 임베딩을 사용해 Karakeep 북마크에 벡터 검색을 추가합니다.
</Card>

<Card title="Inside-Out-2 메모리" icon="brain">
  **커뮤니티** • `memory` `beliefs` `self-model`
  
  세션 파일을 메모리 → 신념 → 진화하는 자기 모델로 바꾸는 별도 메모리 관리자입니다.
</Card>

</CardGroup>

<a id="voice-phone"></a>

## 음성 및 전화

<p className="showcase-section-intro">
  음성 우선 진입점, 전화 브리지, 전사 중심 워크플로입니다.
</p>

<CardGroup cols={2}>

<Card title="Clawdia 전화 브리지" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi 음성 어시스턴트 ↔ OpenClaw HTTP 브리지. 에이전트와 거의 실시간에 가까운 전화 통화를 제공합니다.
</Card>

<Card title="OpenRouter 전사" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter(Gemini 등)를 통한 다국어 오디오 전사. ClawHub에서 사용할 수 있습니다.
</Card>

</CardGroup>

<a id="infrastructure-deployment"></a>

## 인프라 및 배포

<p className="showcase-section-intro">
  OpenClaw을 더 쉽게 실행하고 확장할 수 있게 만드는 패키징, 배포, 통합입니다.
</p>

<CardGroup cols={2}>

<Card title="Home Assistant Add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  SSH 터널 지원과 영구 상태를 갖춘 Home Assistant OS 위에서 실행되는 OpenClaw gateway.
</Card>

<Card title="Home Assistant Skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  자연어로 Home Assistant 장치를 제어하고 자동화합니다.
</Card>

<Card title="Nix 패키징" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  재현 가능한 배포를 위한 배터리 포함형 nix 기반 OpenClaw 구성.
</Card>

<Card title="CalDAV 캘린더" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  khal/vdirsyncer를 사용하는 캘린더 skill. self-hosted 캘린더 통합.
</Card>

</CardGroup>

<a id="home-hardware"></a>

## 홈 및 하드웨어

<p className="showcase-section-intro">
  집, 센서, 카메라, 청소기, 기타 장치를 다루는 OpenClaw의 물리적 세계 측면입니다.
</p>

<CardGroup cols={2}>

<Card title="GoHome 자동화" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  인터페이스로 OpenClaw을 사용하는 Nix 네이티브 홈 자동화와 아름다운 Grafana 대시보드.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 대시보드" />
</Card>

<Card title="Roborock 청소기" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  자연스러운 대화를 통해 Roborock 로봇 청소기를 제어합니다.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 상태" />
</Card>

</CardGroup>

## 커뮤니티 프로젝트

<p className="showcase-section-intro">
  하나의 워크플로를 넘어 더 넓은 제품이나 생태계로 성장한 것들입니다.
</p>

<CardGroup cols={2}>

<Card title="StarSwap 마켓플레이스" icon="star" href="https://star-swap.com/">
  **커뮤니티** • `marketplace` `astronomy` `webapp`
  
  완전한 천문 장비 마켓플레이스. OpenClaw 생태계를 사용하거나 이를 중심으로 구축되었습니다.
</Card>

</CardGroup>

---

## 프로젝트 제출

<p className="showcase-section-intro">
  OpenClaw로 흥미로운 것을 만들고 있다면 보내주세요. 강력한 스크린샷과 구체적인 결과물이 큰 도움이 됩니다.
</p>

공유할 것이 있나요? 소개하고 싶습니다!

<Steps>
  <Step title="공유하기">
    [Discord의 #self-promotion](https://discord.gg/clawd)에 게시하거나 [@openclaw에 트윗](https://x.com/openclaw)하세요
  </Step>
  <Step title="세부 정보 포함">
    무엇을 하는지 설명하고, 저장소/데모 링크를 주고, 가능하다면 스크린샷도 공유해 주세요
  </Step>
  <Step title="소개되기">
    눈에 띄는 프로젝트를 이 페이지에 추가하겠습니다
  </Step>
</Steps>
