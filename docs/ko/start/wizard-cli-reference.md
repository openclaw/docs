---
read_when:
    - 특정 `openclaw onboard` 단계의 자세한 동작이 필요합니다
    - 온보딩 결과를 디버깅하거나 온보딩 클라이언트를 통합하고 있습니다
sidebarTitle: CLI reference
summary: 'openclaw onboard의 단계별 동작: 각 단계의 기능, 작성하는 구성, 내부 동작'
title: CLI 설정 참조 문서
x-i18n:
    generated_at: "2026-07-16T13:06:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96c1469c6b64f08fd9105c8b737df164d39d27d051bbb9bb4f76b9e1e057785d
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

이 페이지에서는 단계별 온보딩 동작, 출력 및 내부 구조를 다룹니다.
둘러보기는 [온보딩(CLI)](/ko/start/wizard)을 참조하십시오. 전체 CLI 플래그
참조(`--flag` 전체, 비대화형 예시, 공급자별
명령)는 [`openclaw onboard`](/ko/cli/onboard)을 참조하십시오.

## 마법사가 수행하는 작업

로컬 모드(기본값)는 다음 과정을 안내합니다.

- 모델 및 인증 설정(Anthropic, OpenAI Code 구독 OAuth, xAI, OpenCode, 사용자 지정 엔드포인트 및 기타 공급자 소유 인증 흐름)
- 워크스페이스 위치 및 부트스트랩 파일
- Gateway 설정(포트, 바인드, 인증, Tailscale)
- 채널 및 공급자(Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp 및 기타 번들 또는 Plugin 채널)
- 웹 검색 공급자(선택 사항)
- 데몬 설치(LaunchAgent, systemd 사용자 유닛 또는 시작 프로그램 폴더 대체 경로를 사용하는 네이티브 Windows 예약 작업)
- 상태 검사
- Skills 설정

원격 모드는 이 컴퓨터가 다른 위치의 Gateway에 연결하도록 구성합니다. 원격
호스트에는 아무것도 설치하거나 수정하지 않습니다.

## 로컬 흐름 세부 정보

<Steps>
  <Step title="기존 구성 감지">
    - `~/.openclaw/openclaw.json`이 있으면 **현재 값 유지**, **검토 및 업데이트** 또는 **설정 전 초기화**를 선택하십시오.
    - 초기화를 명시적으로 선택하거나 `--reset`을 전달하지 않는 한 마법사를 다시 실행해도 아무것도 지워지지 않습니다.
    - CLI `--reset`의 기본값은 `config+creds+sessions`입니다. 워크스페이스도 제거하려면 `--reset-scope full`을 사용하십시오.
    - 구성이 유효하지 않거나 레거시 키를 포함하면 마법사가 중지되고 계속하기 전에 `openclaw doctor`을 실행하라는 메시지를 표시합니다.
    - 초기화는 상태를 휴지통으로 이동하며(직접 삭제하지 않음) 다음 범위를 제공합니다.
      - 구성만
      - 구성 + 자격 증명 + 세션
      - 전체 초기화(워크스페이스도 제거)

  </Step>
  <Step title="모델 및 인증">
    - 전체 옵션 조합은 [인증 및 모델 옵션](#auth-and-model-options)에 있습니다.

  </Step>
  <Step title="워크스페이스">
    - 기본값은 `~/.openclaw/workspace`입니다(구성 가능).
    - 최초 실행 부트스트랩에 필요한 워크스페이스 파일을 생성합니다.
    - 워크스페이스 레이아웃: [에이전트 워크스페이스](/ko/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - 포트, 바인드, 인증 모드 및 Tailscale 노출을 묻습니다.
    - 권장: 로컬 WS 클라이언트도 인증해야 하도록 루프백에서도 토큰 인증을 활성화해 두십시오.
    - 토큰 모드의 대화형 설정에서는 다음 옵션을 제공합니다.
      - **평문 토큰 생성/저장**(기본값)
      - **SecretRef 사용**(선택 사용)
    - 비밀번호 모드의 대화형 설정에서도 평문 또는 SecretRef 저장을 지원합니다.
    - 비대화형 토큰 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
      - 온보딩 프로세스 환경에 비어 있지 않은 환경 변수가 필요합니다.
      - `--gateway-token`과 함께 사용할 수 없습니다.
    - 모든 로컬 프로세스를 완전히 신뢰하는 경우에만 인증을 비활성화하십시오.
    - 루프백 이외의 바인드에는 여전히 인증이 필요합니다.

  </Step>
  <Step title="채널">
    - [WhatsApp](/ko/channels/whatsapp): 선택적 QR 로그인
    - [Telegram](/ko/channels/telegram): 봇 토큰
    - [Discord](/ko/channels/discord): 봇 토큰
    - [Google Chat](/ko/channels/googlechat): 서비스 계정 JSON + Webhook 대상
    - [Mattermost](/ko/channels/mattermost): 봇 토큰 + 기본 URL
    - [Signal](/ko/channels/signal): 선택적 `signal-cli` 설치 + 계정 구성
    - [iMessage](/ko/channels/imessage): `imsg` CLI 경로 + 메시지 DB 접근 권한. Gateway가 Mac 이외의 환경에서 실행되는 경우 SSH 래퍼를 사용하십시오.
    - DM 보안: 기본값은 페어링입니다. 첫 번째 DM에서 코드를 전송합니다. 다음을 통해 승인하거나
      `openclaw pairing approve <channel> <code>` 허용 목록을 사용하십시오.
  </Step>
  <Step title="웹 검색">
    - 공급자(Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)를 선택하거나 건너뛰십시오.
    - `--skip-search`으로 이 단계를 건너뛸 수 있습니다. 나중에 `openclaw configure --section web`으로 다시 구성하십시오.

  </Step>
  <Step title="데몬 설치">
    - macOS: LaunchAgent
      - 로그인한 사용자 세션이 필요합니다. 헤드리스 환경에서는 사용자 지정 LaunchDaemon을 사용하십시오(제공되지 않음).
    - Linux 및 WSL2를 통한 Windows: systemd 사용자 유닛
      - 마법사는 로그아웃 후에도 Gateway가 계속 실행되도록 `loginctl enable-linger <user>`을 시도합니다.
      - sudo를 요청할 수 있습니다(`/var/lib/systemd/linger`에 기록). 먼저 sudo 없이 시도합니다.
    - 네이티브 Windows: 예약 작업 우선
      - 작업 생성이 거부되면 OpenClaw는 사용자별 시작 프로그램 폴더 로그인 항목으로 대체하고 Gateway를 즉시 시작합니다.
      - 예약 작업은 더 나은 감독자 상태를 제공하므로 여전히 권장됩니다.
    - 런타임 선택: OpenClaw의 표준 런타임 상태 저장소가 `node:sqlite`을 사용하므로 Node가 필요합니다.

  </Step>
  <Step title="상태 검사">
    - 필요한 경우 Gateway를 시작하고 `openclaw health`을 실행합니다.
    - `openclaw status --deep`은 지원되는 경우 채널 프로브를 포함하여 실시간 Gateway 상태 프로브를 상태 출력에 추가합니다.

  </Step>
  <Step title="Skills">
    - 사용 가능한 Skills를 읽고 요구 사항을 확인합니다.
    - Node 관리자(npm, pnpm 또는 bun)를 선택할 수 있습니다.
    - 필요한 설치 프로그램을 사용할 수 있는 경우 신뢰할 수 있는 번들 Skills의 선택적
      종속성을 설치합니다.
    - 사용할 수 없는 Homebrew, uv 및 Go 설치 프로그램을 건너뛴 다음 영향을 받는
      Skills를 수동 설정 안내와 함께 그룹화합니다. 누락된 필수 구성 요소를
      설치한 후 `openclaw doctor`을 실행하십시오.

  </Step>
  <Step title="완료">
    - iOS, Android 및 macOS 앱 옵션을 포함한 요약과 다음 단계입니다.

  </Step>
</Steps>

<Note>
GUI가 감지되지 않으면 마법사는 브라우저를 여는 대신 Control UI용 SSH 포트 전달 지침을 출력합니다.
Control UI 자산이 없으면 마법사가 빌드를 시도하며, 대체 명령은 `pnpm ui:build`입니다(UI 종속성을 자동으로 설치함).
</Note>

## 원격 모드 세부 정보

원격 모드는 이 컴퓨터가 다른 위치의 Gateway에 연결하도록 구성합니다. 원격
호스트에는 아무것도 설치하거나 수정하지 않습니다.

설정 항목:

- 원격 Gateway URL(`ws://...` 또는 `wss://...`)
- 원격 Gateway 구성과 일치하는 토큰, 비밀번호 또는 인증 없음

<Steps>
  <Step title="검색(선택 사항)">
    `dns-sd`(macOS) 또는 `avahi-browse`(Linux)을 사용할 수 있으면 온보딩에서
    수동 URL 입력으로 대체하기 전에 Bonjour/mDNS Gateway 비콘을 검색하도록
    제안합니다. 구성된 경우 광역 DNS-SD 검색도 시도합니다.
    문서: [Gateway 검색](/ko/gateway/discovery), [Bonjour](/ko/gateway/bonjour).
  </Step>
  <Step title="연결 방법">
    비콘을 선택하면 직접 WebSocket 또는 SSH 터널을 선택하십시오.
    - **직접**: `wss://`을 통해 연결하고 검색된
      TLS 지문을 신뢰할지 묻습니다(최초 사용 시 신뢰 고정. 수락하는 경우에만 고정됨).
    - **SSH 터널**: 먼저 실행할 `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
      명령을 출력한 다음 로컬 터널 엔드포인트에 연결합니다.
  </Step>
  <Step title="인증">
    토큰(권장), 비밀번호 또는 인증 없음을 선택한 다음 선택적으로 평문 대신
    SecretRef로 저장하십시오.
  </Step>
</Steps>

<Note>
Gateway가 루프백 전용이며 검색할 수 없는 경우 SSH 터널링 또는 tailnet을 수동으로 사용하십시오.
평문 `ws://`은 루프백, 사설 IP 리터럴, `.local` 및 Tailnet `*.ts.net` URL에 허용됩니다. 그 외 사설 DNS 이름에는 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`이 필요합니다.
</Note>

## 인증 및 모델 옵션

대화형 온보딩에서 공급자 설정 단계가 실패하면(예: 로컬 로그인 없이 CLI 재사용 옵션을 사용하는 경우)
마법사는 종료하는 대신 오류를 표시하고 공급자 선택 화면으로 돌아갑니다.
명시적 `--auth-choice` 실행은 자동화를 위해 계속 빠르게 실패합니다.

<AccordionGroup>
  <Accordion title="Anthropic API 키">
    `ANTHROPIC_API_KEY`이 있으면 이를 사용하고, 없으면 키를 요청한 다음 데몬에서 사용하도록 저장합니다.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    대화형 온보딩/구성에서 선호되는 로컬 경로입니다. 기존 Claude CLI 로그인이 있으면 이를 재사용합니다.
  </Accordion>
  <Accordion title="OpenAI Code 구독(OAuth)">
    브라우저 흐름이며 `code#state`을 붙여 넣으십시오.

    기본 모델이 없는 새 설정에서는 Codex 런타임을 통해 `agents.defaults.model`을
    `openai/gpt-5.6-sol`으로 설정합니다.

  </Accordion>
  <Accordion title="OpenAI Code 구독(기기 페어링)">
    수명이 짧은 기기 코드를 사용하는 브라우저 페어링 흐름입니다.

    기본 모델이 없는 새 설정에서는 Codex 런타임을 통해 `agents.defaults.model`을
    `openai/gpt-5.6-sol`으로 설정합니다.

  </Accordion>
  <Accordion title="OpenAI API 키">
    `OPENAI_API_KEY`이 있으면 이를 사용하고, 없으면 키를 요청한 다음 자격 증명을 인증 프로필에 저장합니다.

    기본 모델이 없는 새 설정에서는 `agents.defaults.model`을
    `openai/gpt-5.6`로 설정합니다. 단순 직접 API 모델 ID는 Sol 티어로 확인됩니다.

    OpenAI를 추가하거나 다시 인증해도 `openai/gpt-5.5`을 포함한 기존의 명시적 기본
    모델은 유지됩니다. 계정에서 GPT-5.6을 제공하지 않으면
    `openai/gpt-5.5`을 명시적으로 선택하십시오. OpenClaw는 이를 자동으로 다운그레이드하지 않습니다.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    자격 요건을 충족하는 SuperGrok 또는 X Premium 계정의 브라우저 로그인입니다. 이는 대부분의
    사용자에게 권장되는 xAI 방식입니다. OpenClaw는 Grok 모델, Grok `web_search`,
    `x_search`, `code_execution`에 사용할 인증 프로필을 저장합니다.
  </Accordion>
  <Accordion title="xAI (Grok) 기기 코드">
    localhost 콜백 대신 짧은 코드를 사용하는 원격 환경 친화적인 브라우저 로그인입니다.
    SSH, Docker 또는 VPS 호스트에서 사용하십시오.
  </Accordion>
  <Accordion title="xAI (Grok) API 키">
    `XAI_API_KEY` 입력을 요청하고 xAI를 모델 제공자로 구성합니다. 구독 OAuth 대신
    xAI Console API 키를 사용하려는 경우 사용하십시오.
  </Accordion>
  <Accordion title="OpenCode">
    `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`) 입력을 요청하고 Zen 또는 Go 카탈로그를 선택할 수 있게 합니다(API 키 하나로 둘 다 사용할 수 있습니다).
    설정 URL: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API 키(일반)">
    키를 저장합니다.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    `AI_GATEWAY_API_KEY` 입력을 요청합니다.
    자세한 내용: [Vercel AI Gateway](/ko/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    계정 ID, Gateway ID, `CLOUDFLARE_AI_GATEWAY_API_KEY` 입력을 요청합니다.
    자세한 내용: [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    구성이 자동으로 작성됩니다. 호스팅 환경의 기본값은 `MiniMax-M3`이며, API 키 설정은
    `minimax/...`을 사용하고 OAuth 설정은 `minimax-portal/...`을 사용합니다.
    자세한 내용: [MiniMax](/ko/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    중국 또는 글로벌 엔드포인트의 StepFun 표준이나 Step Plan에 맞게 구성이 자동으로 작성됩니다.
    현재 표준에는 `step-3.5-flash`이 포함되며, Step Plan에는 `step-3.5-flash-2603`도 포함됩니다.
    자세한 내용: [StepFun](/ko/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic(Anthropic 호환)">
    `SYNTHETIC_API_KEY` 입력을 요청합니다.
    자세한 내용: [Synthetic](/ko/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama(클라우드 및 로컬 오픈 모델)">
    먼저 `Cloud + Local`, `Cloud only` 또는 `Local only` 입력을 요청합니다.
    `Cloud only`은 `https://ollama.com`과 함께 `OLLAMA_API_KEY`을 사용합니다.
    호스트 기반 모드는 기본 URL(기본값 `http://127.0.0.1:11434`) 입력을 요청하고, 사용 가능한 모델을 검색하며, 기본값을 제안합니다.
    `Cloud + Local`은 해당 Ollama 호스트가 클라우드 액세스를 위해 로그인되어 있는지도 확인합니다.
    자세한 내용: [Ollama](/ko/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot 및 Kimi Coding">
    Moonshot(Kimi K2) 및 Kimi Coding 구성이 자동으로 작성됩니다.
    자세한 내용: [Moonshot AI(Kimi + Kimi Coding)](/ko/providers/moonshot).
  </Accordion>
  <Accordion title="사용자 지정 제공자">
    OpenAI 호환, OpenAI Responses 호환 및 Anthropic 호환 엔드포인트에서 작동합니다.

    대화형 온보딩은 다른 제공자의 API 키 흐름과 동일한 API 키 저장 옵션을 지원합니다.
    - **지금 API 키 붙여넣기**(일반 텍스트)
    - **비밀 참조 사용**(환경 변수 참조 또는 구성된 제공자 참조, 사전 검증 포함)

    온보딩은 일반적인 비전 모델 ID(GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral 등)의 이미지 지원을 추론하며, 모델 이름을 알 수 없는 경우에만 질문합니다.

    비대화형 플래그:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`(선택 사항, `CUSTOM_API_KEY`로 대체)
    - `--custom-provider-id`(선택 사항)
    - `--custom-compatibility <openai|openai-responses|anthropic>`(선택 사항, 기본값 `openai`)
    - `--custom-image-input` / `--custom-text-input`(선택 사항, 추론된 모델 입력 기능 재정의)

  </Accordion>
  <Accordion title="건너뛰기">
    인증을 구성하지 않은 상태로 둡니다.
  </Accordion>
</AccordionGroup>

모델 동작:

- 감지된 옵션에서 기본 모델을 선택하거나 제공자와 모델을 직접 입력합니다.
- 제공자 인증 선택에서 온보딩을 시작하면 모델 선택기가
  해당 제공자를 자동으로 우선합니다. Volcengine과 BytePlus의 경우 동일한 우선 설정이
  해당 코딩 플랜 변형(`volcengine-plan/*`,
  `byteplus-plan/*`)에도 적용됩니다.
- 해당 우선 제공자 필터의 결과가 비어 있으면 모델을 표시하지 않는 대신
  전체 카탈로그로 대체합니다.
- 마법사가 모델 검사를 실행하고 구성된 모델을 알 수 없거나 인증이 누락된 경우 경고합니다.

자격 증명 및 프로필 경로:

- 인증 프로필(API 키 + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 레거시 OAuth 가져오기: `~/.openclaw/credentials/oauth.json`

자격 증명 저장 모드:

- 기본 온보딩 동작은 API 키를 인증 프로필에 일반 텍스트 값으로 영구 저장합니다.
- `--secret-input-mode ref`은 일반 텍스트 키 저장 대신 참조 모드를 활성화합니다.
  대화형 설정에서는 다음 중 하나를 선택할 수 있습니다.
  - 환경 변수 참조(예: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - 제공자 별칭 + ID를 사용하는 구성된 제공자 참조(`file` 또는 `exec`)
- 대화형 참조 모드는 저장하기 전에 빠른 사전 검증을 실행합니다.
  - 환경 변수 참조: 현재 온보딩 환경에서 변수 이름과 비어 있지 않은 값을 검증합니다.
  - 제공자 참조: 제공자 구성을 검증하고 요청된 ID를 확인합니다.
  - 사전 검증에 실패하면 온보딩에서 오류를 표시하고 다시 시도할 수 있게 합니다.
- 비대화형 모드에서 `--secret-input-mode ref`은 환경 변수 기반으로만 작동합니다.
  - 온보딩 프로세스 환경에 제공자 환경 변수를 설정하십시오.
  - 인라인 키 플래그(예: `--openai-api-key`)를 사용하려면 해당 환경 변수가 설정되어 있어야 하며, 그렇지 않으면 온보딩이 즉시 실패합니다.
  - 사용자 지정 제공자의 경우 비대화형 `ref` 모드는 `models.providers.<id>.apiKey`을 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`으로 저장합니다.
  - 이 사용자 지정 제공자 사례에서는 `--custom-api-key`을 사용하려면 `CUSTOM_API_KEY`이 설정되어 있어야 하며, 그렇지 않으면 온보딩이 즉시 실패합니다.
- Gateway 인증 자격 증명은 대화형 설정에서 일반 텍스트와 SecretRef 옵션을 지원합니다.
  - 토큰 모드: **일반 텍스트 토큰 생성/저장**(기본값) 또는 **SecretRef 사용**.
  - 비밀번호 모드: 일반 텍스트 또는 SecretRef.
- 비대화형 토큰 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
- 기존 일반 텍스트 설정은 변경 없이 계속 작동합니다.

<Note>
헤드리스 및 서버 팁: 브라우저가 있는 시스템에서 OAuth를 완료한 다음 해당
에이전트의 `auth-profiles.json`(예:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 또는 이에 해당하는
`$OPENCLAW_STATE_DIR/...` 경로)을 Gateway 호스트로 복사하십시오. `credentials/oauth.json`은
레거시 가져오기 소스로만 사용됩니다.
</Note>

## 출력 및 내부 구조

`~/.openclaw/openclaw.json`의 일반적인 필드:

- `agents.defaults.workspace`
- `--skip-bootstrap`이 전달된 경우 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`(Minimax를 선택한 경우)
- `tools.profile`(설정되지 않은 경우 로컬 온보딩의 기본값은 `"coding"`이며, 기존에 명시적으로 설정된 값은 유지됩니다)
- `gateway.*`(모드, 바인드, 인증, Tailscale)
- `session.dmScope`(설정되지 않은 경우 로컬 온보딩에서 기본값을 `per-channel-peer`으로 설정하며, 기존에 명시적으로 설정된 값은 유지됩니다)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- 프롬프트에서 사용에 동의한 경우 채널 허용 목록(Discord, iMessage, Signal, Slack, Telegram, WhatsApp)을 구성하며, Discord와 Slack은 입력한 이름을 ID로 확인하기도 합니다
- `skills.install.nodeManager`
  - `setup --node-manager` 플래그는 `npm`, `pnpm` 또는 `bun`을 허용합니다.
  - 나중에 수동 구성으로 `skills.install.nodeManager: "yarn"`을 설정할 수도 있습니다.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add`은 `agents.list[]`과 선택 사항인 `bindings`을 작성합니다.

WhatsApp 자격 증명은 `~/.openclaw/credentials/whatsapp/<accountId>/` 아래에 저장됩니다.
활성 세션과 대화 기록은
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`에 저장됩니다.
`~/.openclaw/agents/<agentId>/sessions/` 디렉터리는 레거시 마이그레이션
입력 및 보관/지원 아티팩트에 사용됩니다.

<Note>
일부 채널은 Plugin으로 제공됩니다. 설정 중 선택하면 마법사가 채널 구성 전에
Plugin(npm 또는 로컬 경로)을 설치하도록 요청합니다.
</Note>

## 비대화형 설정

`--non-interactive`에는 `--accept-risk`이 필요합니다(에이전트가
강력하며 전체 시스템 액세스에는 위험이 따른다는 점을 인정합니다).

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY"
```

전체 플래그 참조 및 제공자별 예: [`openclaw onboard`](/ko/cli/onboard), [CLI 자동화](/ko/start/wizard-cli-automation).

## Gateway 마법사 RPC

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

클라이언트(macOS 앱 및 Control UI)는 온보딩 로직을 다시 구현하지 않고도 단계를 렌더링할 수 있습니다.

## Signal 설정 동작

- 공식 `signal-cli` GitHub 릴리스에서 적절한 릴리스 아티팩트를 다운로드합니다(네이티브 빌드, Linux x86-64만 해당)
- 다른 플랫폼(macOS, x64가 아닌 Linux)에서는 대신 Homebrew를 통해 설치합니다
- 릴리스 아티팩트 설치를 `~/.openclaw/tools/signal-cli/<version>/` 아래에 저장합니다
- 구성에 `channels.signal.cliPath`을 작성합니다
- 네이티브 Windows는 아직 지원되지 않습니다. Linux 설치 경로를 사용하려면 WSL2 내부에서 온보딩을 실행하십시오

## 관련 문서

- 온보딩 허브: [온보딩(CLI)](/ko/start/wizard)
- 자동화 및 스크립트: [CLI 자동화](/ko/start/wizard-cli-automation)
- 명령어 참조: [`openclaw onboard`](/ko/cli/onboard)
