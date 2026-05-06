---
read_when:
    - 특정 온보딩 단계 또는 플래그 찾아보기
    - 비대화형 모드로 온보딩 자동화하기
    - 온보딩 동작 디버깅
sidebarTitle: Onboarding Reference
summary: 'CLI 온보딩 전체 참고 자료: 모든 단계, 플래그 및 구성 필드'
title: 온보딩 참조
x-i18n:
    generated_at: "2026-05-06T06:39:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce0ddb07600ef4f84c44734176e42eb6beaa00fede0be156f3bdd2ec1c0111bb
    source_path: reference/wizard.md
    workflow: 16
---

이 문서는 `openclaw onboard`에 대한 전체 참조입니다.
상위 수준 개요는 [온보딩(CLI)](/ko/start/wizard)을 참조하세요.

## 흐름 세부 정보(로컬 모드)

<Steps>
  <Step title="기존 구성 감지">
    - `~/.openclaw/openclaw.json`이 있으면 **유지 / 수정 / 초기화** 중에서 선택합니다.
    - 온보딩을 다시 실행해도 명시적으로 **초기화**를 선택하지 않는 한 아무것도 지우지 않습니다
      (`--reset`을 전달한 경우도 해당).
    - CLI `--reset`의 기본값은 `config+creds+sessions`입니다. 워크스페이스도 제거하려면 `--reset-scope full`을 사용하세요.
    - 구성이 유효하지 않거나 레거시 키가 포함되어 있으면, 마법사가 중지되고 계속하기 전에 `openclaw doctor`를 실행하라고 요청합니다.
    - 초기화는 `trash`를 사용하며(`rm`은 절대 사용하지 않음) 다음 범위를 제공합니다.
      - 구성만
      - 구성 + 자격 증명 + 세션
      - 전체 초기화(워크스페이스도 제거)

  </Step>
  <Step title="모델/인증">
    - **Anthropic API 키**: 있으면 `ANTHROPIC_API_KEY`를 사용하고, 없으면 키 입력을 요청한 뒤 데몬 사용을 위해 저장합니다.
    - **Anthropic API 키**: 온보딩/구성에서 선호되는 Anthropic 어시스턴트 선택입니다.
    - **Anthropic setup-token**: OpenClaw가 이제 가능한 경우 Claude CLI 재사용을 선호하지만, 온보딩/구성에서 여전히 사용할 수 있습니다.
    - **OpenAI Code (Codex) 구독(OAuth)**: 브라우저 흐름입니다. `code#state`를 붙여넣습니다.
      - 모델이 설정되지 않았거나 이미 OpenAI 계열이면 `agents.defaults.model`을 `openai-codex/gpt-5.5`로 설정합니다.
    - **OpenAI Code (Codex) 구독(디바이스 페어링)**: 짧은 수명의 디바이스 코드를 사용하는 브라우저 페어링 흐름입니다.
      - 모델이 설정되지 않았거나 이미 OpenAI 계열이면 `agents.defaults.model`을 `openai-codex/gpt-5.5`로 설정합니다.
    - **OpenAI API 키**: 있으면 `OPENAI_API_KEY`를 사용하고, 없으면 키 입력을 요청한 뒤 인증 프로필에 저장합니다.
      - 모델이 설정되지 않았거나 `openai/*` 또는 `openai-codex/*`이면 `agents.defaults.model`을 `openai/gpt-5.5`로 설정합니다.
    - **xAI (Grok) API 키**: `XAI_API_KEY`를 요청하고 xAI를 모델 제공자로 구성합니다.
    - **OpenCode**: `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`, https://opencode.ai/auth 에서 발급)를 요청하고 Zen 또는 Go 카탈로그를 선택할 수 있게 합니다.
    - **Ollama**: 먼저 **Cloud + Local**, **Cloud only**, **Local only** 중에서 제공합니다. `Cloud only`는 `OLLAMA_API_KEY`를 요청하고 `https://ollama.com`을 사용합니다. 호스트 기반 모드는 Ollama 기본 URL을 요청하고, 사용 가능한 모델을 검색하며, 필요한 경우 선택한 로컬 모델을 자동으로 가져옵니다. `Cloud + Local`은 해당 Ollama 호스트가 클라우드 액세스를 위해 로그인되어 있는지도 확인합니다.
    - 자세한 내용: [Ollama](/ko/providers/ollama)
    - **API 키**: 키를 저장해 줍니다.
    - **Vercel AI Gateway(멀티 모델 프록시)**: `AI_GATEWAY_API_KEY`를 요청합니다.
    - 자세한 내용: [Vercel AI Gateway](/ko/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: 계정 ID, Gateway ID, `CLOUDFLARE_AI_GATEWAY_API_KEY`를 요청합니다.
    - 자세한 내용: [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway)
    - **MiniMax**: 구성이 자동으로 작성됩니다. 호스팅 기본값은 `MiniMax-M2.7`입니다.
      API 키 설정은 `minimax/...`를 사용하고, OAuth 설정은
      `minimax-portal/...`을 사용합니다.
    - 자세한 내용: [MiniMax](/ko/providers/minimax)
    - **StepFun**: 중국 또는 글로벌 엔드포인트의 StepFun 표준 또는 Step Plan에 맞게 구성이 자동으로 작성됩니다.
    - 현재 표준에는 `step-3.5-flash`가 포함되며, Step Plan에는 `step-3.5-flash-2603`도 포함됩니다.
    - 자세한 내용: [StepFun](/ko/providers/stepfun)
    - **Synthetic(Anthropic 호환)**: `SYNTHETIC_API_KEY`를 요청합니다.
    - 자세한 내용: [Synthetic](/ko/providers/synthetic)
    - **Moonshot (Kimi K2)**: 구성이 자동으로 작성됩니다.
    - **Kimi Coding**: 구성이 자동으로 작성됩니다.
    - 자세한 내용: [Moonshot AI (Kimi + Kimi Coding)](/ko/providers/moonshot)
    - **건너뛰기**: 아직 인증을 구성하지 않습니다.
    - 감지된 옵션에서 기본 모델을 선택하거나 제공자/모델을 직접 입력합니다. 최고의 품질과 더 낮은 프롬프트 인젝션 위험을 위해, 제공자 스택에서 사용할 수 있는 가장 강력한 최신 세대 모델을 선택하세요.
    - 온보딩은 모델 검사를 실행하고 구성된 모델을 알 수 없거나 인증이 누락된 경우 경고합니다.
    - API 키 저장 모드는 기본적으로 일반 텍스트 인증 프로필 값입니다. 대신 환경 변수 기반 참조를 저장하려면 `--secret-input-mode ref`를 사용하세요(예: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - 인증 프로필은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 있습니다(API 키 + OAuth). `~/.openclaw/credentials/oauth.json`은 레거시 가져오기 전용입니다.
    - 자세한 내용: [/concepts/oauth](/ko/concepts/oauth)
    <Note>
    헤드리스/서버 팁: 브라우저가 있는 머신에서 OAuth를 완료한 다음, 해당 에이전트의 `auth-profiles.json`(예:
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 또는 일치하는
    `$OPENCLAW_STATE_DIR/...` 경로)을 Gateway 호스트로 복사하세요. `credentials/oauth.json`은 레거시 가져오기 소스일 뿐입니다.
    </Note>
  </Step>
  <Step title="워크스페이스">
    - 기본값은 `~/.openclaw/workspace`입니다(구성 가능).
    - 에이전트 부트스트랩 절차에 필요한 워크스페이스 파일을 시드합니다.
    - 전체 워크스페이스 레이아웃 + 백업 가이드: [에이전트 워크스페이스](/ko/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - 포트, 바인드, 인증 모드, Tailscale 노출입니다.
    - 인증 권장 사항: 로컬 WS 클라이언트도 인증해야 하도록 loopback에서도 **Token**을 유지하세요.
    - 토큰 모드에서 대화형 설정은 다음을 제공합니다.
      - **일반 텍스트 토큰 생성/저장**(기본값)
      - **SecretRef 사용**(선택 사항)
      - Quickstart는 온보딩 프로브/대시보드 부트스트랩을 위해 `env`, `file`, `exec` 제공자 전반에서 기존 `gateway.auth.token` SecretRef를 재사용합니다.
      - 해당 SecretRef가 구성되어 있지만 해석할 수 없으면, 온보딩은 런타임 인증을 조용히 약화하지 않고 명확한 수정 메시지와 함께 일찍 실패합니다.
    - 비밀번호 모드에서 대화형 설정은 일반 텍스트 또는 SecretRef 저장도 지원합니다.
    - 비대화형 토큰 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
      - 온보딩 프로세스 환경에 비어 있지 않은 환경 변수가 필요합니다.
      - `--gateway-token`과 함께 사용할 수 없습니다.
    - 모든 로컬 프로세스를 완전히 신뢰하는 경우에만 인증을 비활성화하세요.
    - loopback이 아닌 바인드는 여전히 인증이 필요합니다.

  </Step>
  <Step title="채널">
    - [WhatsApp](/ko/channels/whatsapp): 선택적 QR 로그인.
    - [Telegram](/ko/channels/telegram): 봇 토큰.
    - [Discord](/ko/channels/discord): 봇 토큰.
    - [Google Chat](/ko/channels/googlechat): 서비스 계정 JSON + Webhook 대상.
    - [Mattermost](/ko/channels/mattermost) (Plugin): 봇 토큰 + 기본 URL.
    - [Signal](/ko/channels/signal): 선택적 `signal-cli` 설치 + 계정 구성.
    - [BlueBubbles](/ko/channels/bluebubbles): **iMessage에 권장**; 서버 URL + 비밀번호 + Webhook.
    - [iMessage](/ko/channels/imessage): 레거시 `imsg` CLI 경로 + DB 액세스.
    - DM 보안: 기본값은 페어링입니다. 첫 DM이 코드를 보냅니다. `openclaw pairing approve <channel> <code>`로 승인하거나 허용 목록을 사용하세요.

  </Step>
  <Step title="웹 검색">
    - Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily 같은 지원 제공자를 선택하거나 건너뜁니다.
    - API 기반 제공자는 빠른 설정에 환경 변수나 기존 구성을 사용할 수 있습니다. 키가 필요 없는 제공자는 대신 제공자별 필수 조건을 사용합니다.
    - `--skip-search`로 건너뜁니다.
    - 나중에 구성: `openclaw configure --section web`.

  </Step>
  <Step title="데몬 설치">
    - macOS: LaunchAgent
      - 로그인한 사용자 세션이 필요합니다. 헤드리스의 경우 사용자 지정 LaunchDaemon을 사용하세요(제공되지 않음).
    - Linux(및 WSL2를 통한 Windows): systemd 사용자 유닛
      - 온보딩은 로그아웃 후에도 Gateway가 계속 실행되도록 `loginctl enable-linger <user>`로 lingering 활성화를 시도합니다.
      - sudo를 요청할 수 있습니다(`/var/lib/systemd/linger`에 기록). 먼저 sudo 없이 시도합니다.
    - **런타임 선택:** Node(권장, WhatsApp/Telegram에 필요). Bun은 **권장하지 않습니다**.
    - 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, 데몬 설치는 이를 검증하지만 해석된 일반 텍스트 토큰 값을 supervisor 서비스 환경 메타데이터에 유지하지 않습니다.
    - 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 해석되지 않으면, 실행 가능한 안내와 함께 데몬 설치가 차단됩니다.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드가 명시적으로 설정될 때까지 데몬 설치가 차단됩니다.

  </Step>
  <Step title="상태 검사">
    - Gateway를 시작하고(필요한 경우) `openclaw health`를 실행합니다.
    - 팁: `openclaw status --deep`은 실시간 Gateway 상태 프로브를 상태 출력에 추가하며, 지원되는 경우 채널 프로브도 포함합니다(연결 가능한 Gateway 필요).

  </Step>
  <Step title="Skills(권장)">
    - 사용 가능한 Skills를 읽고 요구 사항을 확인합니다.
    - Node 관리자를 선택할 수 있게 합니다: **npm / pnpm**(bun은 권장하지 않음).
    - 선택적 종속성을 설치합니다(일부는 macOS에서 Homebrew 사용).

  </Step>
  <Step title="마침">
    - 추가 기능을 위한 iOS/Android/macOS 앱을 포함한 요약 + 다음 단계입니다.

  </Step>
</Steps>

<Note>
GUI가 감지되지 않으면, 온보딩은 브라우저를 여는 대신 Control UI용 SSH 포트 포워딩 안내를 출력합니다.
Control UI 자산이 없으면, 온보딩은 이를 빌드하려고 시도합니다. 대체 방법은 `pnpm ui:build`입니다(UI 종속성 자동 설치).
</Note>

## 비대화형 모드

온보딩을 자동화하거나 스크립트화하려면 `--non-interactive`를 사용하세요.

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

머신이 읽을 수 있는 요약을 보려면 `--json`을 추가하세요.

비대화형 모드의 Gateway 토큰 SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token`과 `--gateway-token-ref-env`는 서로 배타적입니다.

<Note>
`--json`은 비대화형 모드를 의미하지 **않습니다**. 스크립트에는 `--non-interactive`(및 `--workspace`)를 사용하세요.
</Note>

제공자별 명령 예시는 [CLI 자동화](/ko/start/wizard-cli-automation#provider-specific-examples)에 있습니다.
플래그 의미와 단계 순서는 이 참조 페이지를 사용하세요.

### 에이전트 추가(비대화형)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway 마법사 RPC

Gateway는 RPC(`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`)를 통해 온보딩 흐름을 노출합니다.
클라이언트(macOS 앱, Control UI)는 온보딩 로직을 다시 구현하지 않고 단계를 렌더링할 수 있습니다.

## Signal 설정(signal-cli)

온보딩은 GitHub 릴리스에서 `signal-cli`를 설치할 수 있습니다.

- 적절한 릴리스 자산을 다운로드합니다.
- `~/.openclaw/tools/signal-cli/<version>/` 아래에 저장합니다.
- 구성에 `channels.signal.cliPath`를 작성합니다.

참고:

- JVM 빌드는 **Java 21**이 필요합니다.
- 사용 가능한 경우 네이티브 빌드를 사용합니다.
- Windows는 WSL2를 사용합니다. signal-cli 설치는 WSL 내부의 Linux 흐름을 따릅니다.

## 마법사가 작성하는 내용

`~/.openclaw/openclaw.json`의 일반적인 필드:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`(Minimax를 선택한 경우)
- `tools.profile`(설정되지 않은 경우 로컬 온보딩의 기본값은 `"coding"`입니다. 기존의 명시적 값은 보존됩니다)
- `gateway.*`(mode, bind, auth, tailscale)
- `session.dmScope`(동작 세부 정보: [CLI 설정 참조](/ko/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- 프롬프트 중에 선택하는 경우 채널 허용 목록(Slack/Discord/Matrix/Microsoft Teams)(가능한 경우 이름이 ID로 확인됨).
- `skills.install.nodeManager`
  - `setup --node-manager`는 `npm`, `pnpm` 또는 `bun`을 허용합니다.
  - 수동 구성에서는 `skills.install.nodeManager`를 직접 설정하여 계속 `yarn`을 사용할 수 있습니다.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add`는 `agents.list[]`와 선택적 `bindings`를 기록합니다.

WhatsApp 자격 증명은 `~/.openclaw/credentials/whatsapp/<accountId>/` 아래에 저장됩니다.
세션은 `~/.openclaw/agents/<agentId>/sessions/` 아래에 저장됩니다.

일부 채널은 Plugin으로 제공됩니다. 설정 중 하나를 선택하면 구성하기 전에 온보딩에서 해당 Plugin을 설치하도록 안내합니다(npm 또는 로컬 경로).

## 관련 문서

- 온보딩 개요: [온보딩(CLI)](/ko/start/wizard)
- macOS 앱 온보딩: [온보딩](/ko/start/onboarding)
- 구성 참조: [Gateway 구성](/ko/gateway/configuration)
- 제공자: [WhatsApp](/ko/channels/whatsapp), [Telegram](/ko/channels/telegram), [Discord](/ko/channels/discord), [Google Chat](/ko/channels/googlechat), [Signal](/ko/channels/signal), [BlueBubbles](/ko/channels/bluebubbles)(iMessage), [iMessage](/ko/channels/imessage)(레거시)
- Skills: [Skills](/ko/tools/skills), [Skills 구성](/ko/tools/skills-config)
