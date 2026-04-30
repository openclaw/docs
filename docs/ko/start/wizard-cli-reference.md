---
read_when:
    - openclaw onboard에 대한 자세한 동작이 필요합니다
    - 온보딩 결과를 디버깅하거나 온보딩 클라이언트를 통합하는 중입니다
sidebarTitle: CLI reference
summary: CLI 설정 흐름, 인증/모델 설정, 출력 및 내부 구조에 대한 전체 참조
title: CLI 설정 참조
x-i18n:
    generated_at: "2026-04-30T06:52:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d40a63ff27d6aaf4cda167ad0cdf3ad7c4f61ecf92d1cf51b5a0237b24917a7
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

이 페이지는 `openclaw onboard`의 전체 참조 문서입니다.
짧은 가이드는 [온보딩(CLI)](/ko/start/wizard)을 참조하세요.

## 마법사가 하는 일

로컬 모드(기본값)는 다음을 안내합니다.

- 모델 및 인증 설정(OpenAI Code 구독 OAuth, Anthropic Claude CLI 또는 API 키, 그리고 MiniMax, GLM, Ollama, Moonshot, StepFun, AI Gateway 옵션)
- 워크스페이스 위치 및 부트스트랩 파일
- Gateway 설정(포트, 바인드, 인증, Tailscale)
- 채널 및 제공자(Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles 및 기타 번들 채널 Plugin)
- 데몬 설치(LaunchAgent, systemd 사용자 유닛 또는 Startup 폴더 폴백이 있는 네이티브 Windows Scheduled Task)
- 상태 확인
- Skills 설정

원격 모드는 이 머신이 다른 위치의 Gateway에 연결하도록 구성합니다.
원격 호스트에는 아무것도 설치하거나 수정하지 않습니다.

## 로컬 흐름 세부 정보

<Steps>
  <Step title="Existing config detection">
    - `~/.openclaw/openclaw.json`이 있으면 Keep, Modify 또는 Reset을 선택합니다.
    - 마법사를 다시 실행해도 Reset을 명시적으로 선택하지 않는 한(또는 `--reset`을 전달하지 않는 한) 아무것도 지우지 않습니다.
    - CLI `--reset`은 기본적으로 `config+creds+sessions`입니다. 워크스페이스도 제거하려면 `--reset-scope full`을 사용하세요.
    - 구성이 유효하지 않거나 레거시 키가 포함되어 있으면 마법사가 중단되고 계속하기 전에 `openclaw doctor`를 실행하라고 요청합니다.
    - Reset은 `trash`를 사용하며 다음 범위를 제공합니다.
      - 구성만
      - 구성 + 자격 증명 + 세션
      - 전체 Reset(워크스페이스도 제거)

  </Step>
  <Step title="Model and auth">
    - 전체 옵션 매트릭스는 [인증 및 모델 옵션](#auth-and-model-options)에 있습니다.

  </Step>
  <Step title="Workspace">
    - 기본값은 `~/.openclaw/workspace`입니다(구성 가능).
    - 최초 실행 부트스트랩 의식에 필요한 워크스페이스 파일을 시드합니다.
    - 워크스페이스 레이아웃: [에이전트 워크스페이스](/ko/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - 포트, 바인드, 인증 모드 및 Tailscale 노출을 묻습니다.
    - 권장: 루프백에서도 토큰 인증을 활성화해 로컬 WS 클라이언트가 인증해야 하도록 유지하세요.
    - 토큰 모드에서 대화형 설정은 다음을 제공합니다.
      - **일반 텍스트 토큰 생성/저장**(기본값)
      - **SecretRef 사용**(옵트인)
    - 비밀번호 모드에서 대화형 설정은 일반 텍스트 또는 SecretRef 저장도 지원합니다.
    - 비대화형 토큰 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
      - 온보딩 프로세스 환경에 비어 있지 않은 env var가 필요합니다.
      - `--gateway-token`과 함께 사용할 수 없습니다.
    - 모든 로컬 프로세스를 완전히 신뢰하는 경우에만 인증을 비활성화하세요.
    - 루프백이 아닌 바인드는 여전히 인증이 필요합니다.

  </Step>
  <Step title="Channels">
    - [WhatsApp](/ko/channels/whatsapp): 선택적 QR 로그인
    - [Telegram](/ko/channels/telegram): bot token
    - [Discord](/ko/channels/discord): bot token
    - [Google Chat](/ko/channels/googlechat): 서비스 계정 JSON + Webhook audience
    - [Mattermost](/ko/channels/mattermost): bot token + 기본 URL
    - [Signal](/ko/channels/signal): 선택적 `signal-cli` 설치 + 계정 구성
    - [BlueBubbles](/ko/channels/bluebubbles): iMessage에 권장; 서버 URL + 비밀번호 + Webhook
    - [iMessage](/ko/channels/imessage): 레거시 `imsg` CLI 경로 + DB 접근
    - DM 보안: 기본값은 페어링입니다. 첫 DM은 코드를 보냅니다. 다음으로 승인하세요.
      `openclaw pairing approve <channel> <code>` 또는 허용 목록을 사용하세요.
  </Step>
  <Step title="Daemon install">
    - macOS: LaunchAgent
      - 로그인한 사용자 세션이 필요합니다. 헤드리스의 경우 사용자 지정 LaunchDaemon을 사용하세요(제공되지 않음).
    - Linux 및 WSL2를 통한 Windows: systemd 사용자 유닛
      - 마법사는 로그아웃 후에도 Gateway가 계속 실행되도록 `loginctl enable-linger <user>`를 시도합니다.
      - sudo를 요청할 수 있습니다(`/var/lib/systemd/linger`에 씀). 먼저 sudo 없이 시도합니다.
    - 네이티브 Windows: Scheduled Task 우선
      - 작업 생성이 거부되면 OpenClaw는 사용자별 Startup 폴더 로그인 항목으로 폴백하고 Gateway를 즉시 시작합니다.
      - Scheduled Task는 더 나은 supervisor 상태를 제공하므로 계속 권장됩니다.
    - 런타임 선택: Node(권장; WhatsApp 및 Telegram에 필요). Bun은 권장되지 않습니다.

  </Step>
  <Step title="Health check">
    - Gateway를 시작하고(필요한 경우) `openclaw health`를 실행합니다.
    - `openclaw status --deep`은 지원되는 경우 채널 프로브를 포함해 실시간 Gateway 상태 프로브를 상태 출력에 추가합니다.

  </Step>
  <Step title="Skills">
    - 사용 가능한 Skills를 읽고 요구 사항을 확인합니다.
    - Node 관리자를 선택하게 합니다: npm, pnpm 또는 bun.
    - 선택적 종속성을 설치합니다(일부는 macOS에서 Homebrew를 사용).

  </Step>
  <Step title="Finish">
    - iOS, Android 및 macOS 앱 옵션을 포함한 요약과 다음 단계.

  </Step>
</Steps>

<Note>
GUI가 감지되지 않으면 마법사는 브라우저를 여는 대신 Control UI용 SSH 포트 포워딩 지침을 출력합니다.
Control UI 자산이 없으면 마법사는 빌드를 시도합니다. 폴백은 `pnpm ui:build`입니다(UI 종속성을 자동 설치).
</Note>

## 원격 모드 세부 정보

원격 모드는 이 머신이 다른 위치의 Gateway에 연결하도록 구성합니다.

<Info>
원격 모드는 원격 호스트에 아무것도 설치하거나 수정하지 않습니다.
</Info>

설정하는 항목:

- 원격 Gateway URL(`ws://...`)
- 원격 Gateway 인증이 필요한 경우 토큰(권장)

<Note>
- Gateway가 루프백 전용이면 SSH 터널링 또는 tailnet을 사용하세요.
- 검색 힌트:
  - macOS: Bonjour(`dns-sd`)
  - Linux: Avahi(`avahi-browse`)

</Note>

## 인증 및 모델 옵션

<AccordionGroup>
  <Accordion title="Anthropic API key">
    `ANTHROPIC_API_KEY`가 있으면 사용하고, 없으면 키를 요청한 다음 데몬 사용을 위해 저장합니다.
  </Accordion>
  <Accordion title="OpenAI Code subscription (OAuth)">
    브라우저 흐름입니다. `code#state`를 붙여넣으세요.

    모델이 설정되지 않았거나 이미 OpenAI 계열이면 `agents.defaults.model`을 `openai-codex/gpt-5.5`로 설정합니다.

  </Accordion>
  <Accordion title="OpenAI Code subscription (device pairing)">
    짧은 수명의 디바이스 코드가 있는 브라우저 페어링 흐름입니다.

    모델이 설정되지 않았거나 이미 OpenAI 계열이면 `agents.defaults.model`을 `openai-codex/gpt-5.5`로 설정합니다.

  </Accordion>
  <Accordion title="OpenAI API key">
    `OPENAI_API_KEY`가 있으면 사용하고, 없으면 키를 요청한 다음 인증 프로필에 자격 증명을 저장합니다.

    모델이 설정되지 않았거나 `openai/*` 또는 `openai-codex/*`이면 `agents.defaults.model`을 `openai/gpt-5.5`로 설정합니다.

  </Accordion>
  <Accordion title="xAI (Grok) API key">
    `XAI_API_KEY`를 요청하고 xAI를 모델 제공자로 구성합니다.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`)를 요청하고 Zen 또는 Go 카탈로그를 선택하게 합니다.
    설정 URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (generic)">
    키를 저장해 줍니다.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY`를 요청합니다.
    자세한 내용: [Vercel AI Gateway](/ko/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    계정 ID, Gateway ID 및 `CLOUDFLARE_AI_GATEWAY_API_KEY`를 요청합니다.
    자세한 내용: [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    구성이 자동으로 작성됩니다. 호스팅 기본값은 `MiniMax-M2.7`입니다. API 키 설정은
    `minimax/...`를 사용하고, OAuth 설정은 `minimax-portal/...`를 사용합니다.
    자세한 내용: [MiniMax](/ko/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    StepFun 표준 또는 중국/글로벌 엔드포인트의 Step Plan에 대한 구성이 자동으로 작성됩니다.
    표준에는 현재 `step-3.5-flash`가 포함되며, Step Plan에는 `step-3.5-flash-2603`도 포함됩니다.
    자세한 내용: [StepFun](/ko/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
    `SYNTHETIC_API_KEY`를 요청합니다.
    자세한 내용: [Synthetic](/ko/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud and local open models)">
    먼저 `Cloud + Local`, `Cloud only` 또는 `Local only`를 요청합니다.
    `Cloud only`는 `https://ollama.com`과 함께 `OLLAMA_API_KEY`를 사용합니다.
    호스트 기반 모드는 기본 URL(기본값 `http://127.0.0.1:11434`)을 요청하고, 사용 가능한 모델을 검색하며, 기본값을 제안합니다.
    `Cloud + Local`은 해당 Ollama 호스트가 클라우드 접근에 로그인되어 있는지도 확인합니다.
    자세한 내용: [Ollama](/ko/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot and Kimi Coding">
    Moonshot(Kimi K2) 및 Kimi Coding 구성이 자동으로 작성됩니다.
    자세한 내용: [Moonshot AI(Kimi + Kimi Coding)](/ko/providers/moonshot).
  </Accordion>
  <Accordion title="Custom provider">
    OpenAI 호환 및 Anthropic 호환 엔드포인트와 작동합니다.

    대화형 온보딩은 다른 제공자 API 키 흐름과 동일한 API 키 저장 선택지를 지원합니다.
    - **지금 API 키 붙여넣기**(일반 텍스트)
    - **비밀 참조 사용**(env 참조 또는 구성된 제공자 참조, 사전 검증 포함)

    비대화형 플래그:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`(선택 사항; `CUSTOM_API_KEY`로 폴백)
    - `--custom-provider-id`(선택 사항)
    - `--custom-compatibility <openai|anthropic>`(선택 사항; 기본값 `openai`)
    - `--custom-image-input` / `--custom-text-input`(선택 사항; 추론된 모델 입력 기능을 재정의)

  </Accordion>
  <Accordion title="Skip">
    인증을 구성하지 않은 상태로 둡니다.
  </Accordion>
</AccordionGroup>

모델 동작:

- 감지된 옵션에서 기본 모델을 선택하거나 제공자와 모델을 수동으로 입력합니다.
- 사용자 지정 제공자 온보딩은 일반적인 모델 ID에 대해 이미지 지원을 추론하고 모델 이름을 알 수 없는 경우에만 묻습니다.
- 온보딩이 제공자 인증 선택에서 시작되면 모델 선택기는
  해당 제공자를 자동으로 우선합니다. Volcengine 및 BytePlus의 경우 같은 선호도는
  해당 coding-plan 변형(`volcengine-plan/*`,
  `byteplus-plan/*`)에도 일치합니다.
- 해당 선호 제공자 필터가 비어 있으면 선택기는 모델을 표시하지 않는 대신
  전체 카탈로그로 폴백합니다.
- 마법사는 모델 검사를 실행하고 구성된 모델을 알 수 없거나 인증이 없으면 경고합니다.

자격 증명 및 프로필 경로:

- 인증 프로필(API 키 + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 레거시 OAuth 가져오기: `~/.openclaw/credentials/oauth.json`

자격 증명 저장 모드:

- 기본 온보딩 동작은 API 키를 인증 프로필에 일반 텍스트 값으로 유지합니다.
- `--secret-input-mode ref`는 일반 텍스트 키 저장 대신 참조 모드를 활성화합니다.
  대화형 설정에서는 다음 중 하나를 선택할 수 있습니다.
  - 환경 변수 참조(예: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - 제공자 별칭 + id가 있는 구성된 제공자 참조(`file` 또는 `exec`)
- 대화형 참조 모드는 저장 전에 빠른 사전 검증을 실행합니다.
  - Env refs: 현재 온보딩 환경에서 변수 이름 + 비어 있지 않은 값을 검증합니다.
  - Provider refs: 제공자 구성을 검증하고 요청된 id를 확인합니다.
  - 사전 검증에 실패하면 온보딩이 오류를 표시하고 재시도할 수 있게 합니다.
- 비대화형 모드에서 `--secret-input-mode ref`는 env 기반만 지원합니다.
  - 온보딩 프로세스 환경에서 제공자 env var를 설정하세요.
  - 인라인 키 플래그(예: `--openai-api-key`)는 해당 env var가 설정되어 있어야 합니다. 그렇지 않으면 온보딩이 빠르게 실패합니다.
  - 사용자 지정 제공자의 경우 비대화형 `ref` 모드는 `models.providers.<id>.apiKey`를 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`로 저장합니다.
  - 해당 사용자 지정 제공자 사례에서 `--custom-api-key`는 `CUSTOM_API_KEY`가 설정되어 있어야 합니다. 그렇지 않으면 온보딩이 빠르게 실패합니다.
- Gateway 인증 자격 증명은 대화형 설정에서 일반 텍스트 및 SecretRef 선택을 지원합니다.
  - 토큰 모드: **일반 텍스트 토큰 생성/저장**(기본값) 또는 **SecretRef 사용**.
  - 비밀번호 모드: 일반 텍스트 또는 SecretRef.
- 비대화형 토큰 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
- 기존 일반 텍스트 설정은 변경 없이 계속 작동합니다.

<Note>
Headless 및 서버 팁: 브라우저가 있는 머신에서 OAuth를 완료한 다음, 해당 에이전트의 `auth-profiles.json`(예:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 또는 이에 대응하는
`$OPENCLAW_STATE_DIR/...` 경로)을 Gateway 호스트로 복사하세요. `credentials/oauth.json`은
레거시 가져오기 소스일 뿐입니다.
</Note>

## 출력 및 내부 항목

`~/.openclaw/openclaw.json`의 일반적인 필드:

- `agents.defaults.workspace`
- `--skip-bootstrap`이 전달된 경우 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`(Minimax를 선택한 경우)
- `tools.profile`(설정되지 않은 경우 로컬 온보딩은 기본값으로 `"coding"`을 사용하며, 기존의 명시적 값은 보존됨)
- `gateway.*`(mode, bind, auth, tailscale)
- `session.dmScope`(설정되지 않은 경우 로컬 온보딩은 기본값으로 `per-channel-peer`를 사용하며, 기존의 명시적 값은 보존됨)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- 프롬프트에서 선택한 경우 채널 허용 목록(Slack, Discord, Matrix, Microsoft Teams)(가능한 경우 이름은 ID로 해석됨)
- `skills.install.nodeManager`
  - `setup --node-manager` 플래그는 `npm`, `pnpm` 또는 `bun`을 허용합니다.
  - 수동 구성에서는 나중에 여전히 `skills.install.nodeManager: "yarn"`을 설정할 수 있습니다.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`는 `agents.list[]` 및 선택적 `bindings`를 작성합니다.

WhatsApp 자격 증명은 `~/.openclaw/credentials/whatsapp/<accountId>/` 아래에 저장됩니다.
세션은 `~/.openclaw/agents/<agentId>/sessions/` 아래에 저장됩니다.

<Note>
일부 채널은 plugins로 제공됩니다. 설정 중 선택하면 마법사가 채널 구성 전에
plugin(npm 또는 로컬 경로)을 설치하라는 프롬프트를 표시합니다.
</Note>

Gateway 마법사 RPC:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

클라이언트(macOS 앱 및 Control UI)는 온보딩 로직을 다시 구현하지 않고도 단계를 렌더링할 수 있습니다.

Signal 설정 동작:

- 적절한 릴리스 자산 다운로드
- `~/.openclaw/tools/signal-cli/<version>/` 아래에 저장
- 구성에 `channels.signal.cliPath` 작성
- JVM 빌드에는 Java 21 필요
- 사용 가능한 경우 네이티브 빌드 사용
- Windows는 WSL2를 사용하며 WSL 내부에서 Linux signal-cli 흐름을 따름

## 관련 문서

- 온보딩 허브: [온보딩(CLI)](/ko/start/wizard)
- 자동화 및 스크립트: [CLI 자동화](/ko/start/wizard-cli-automation)
- 명령 참조: [`openclaw onboard`](/ko/cli/onboard)
