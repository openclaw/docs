---
read_when:
    - 특정 온보딩 단계 또는 플래그 조회하기
    - 비대화형 모드로 온보딩 자동화하기
    - 온보딩 동작 디버깅
sidebarTitle: Onboarding Reference
summary: 'CLI 온보딩 전체 참조: 모든 단계, 플래그 및 구성 필드'
title: 온보딩 참고 자료
x-i18n:
    generated_at: "2026-07-12T15:44:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39155617d74a4004e9474c9d0ede231a6ccd4cb31becc07f25bcd9306b6a6675
    source_path: reference/wizard.md
    workflow: 16
---

다음은 `openclaw onboard`의 전체 참조 문서입니다.
개괄적인 내용은 [온보딩(CLI)](/ko/start/wizard)을 참조하십시오. 단계별
동작과 출력은 [CLI 설정 참조](/ko/start/wizard-cli-reference)를 참조하십시오.

## 흐름 세부 정보(로컬 모드)

<Steps>
  <Step title="재설정(선택 사항)">
    - `--reset`은 설정을 실행하기 전에 상태를 재설정합니다. 이 옵션 없이 온보딩을 다시 실행하면
      기존 구성을 유지하고 기본값으로 재사용합니다.
    - `--reset-scope`는 `--reset`이 제거할 항목을 제어합니다. `config`(구성 파일만),
      `config+creds+sessions`(기본값) 또는 `full`(워크스페이스도
      제거) 중 하나입니다.
    - 구성 파일이 유효하지 않으면 온보딩이 중단되고 먼저
      `openclaw doctor`를 실행한 다음 설정을 다시 실행하라는 안내가 표시됩니다.
    - 재설정은 상태를 휴지통으로 이동합니다(직접 삭제하지 않습니다).

  </Step>
  <Step title="위험 확인">
    - 최초 실행 시(또는 `wizard.securityAcknowledgedAt`이 설정되기 전의 모든 실행에서)
      에이전트는 강력하며 전체 시스템 접근에는 위험이 따른다는 점을
      이해했는지 확인합니다.
    - `--non-interactive`에는 `--accept-risk`를 명시적으로 지정해야 합니다. 지정하지 않으면
      온보딩은 확인을 요청하는 대신 오류와 함께 종료됩니다.
    - 대화형 실행에서는 플래그 대신 확인 프롬프트가 표시되며, 거부하면
      설정이 취소됩니다.

  </Step>
  <Step title="모델/인증">
    - **Anthropic API 키**: `ANTHROPIC_API_KEY`가 있으면 사용하고, 없으면 키를 입력하라는 프롬프트를 표시한 다음 데몬에서 사용할 수 있도록 저장합니다.
    - **Anthropic Claude CLI**: Claude CLI 로그인이 이미 존재할 때 선호되는 로컬 경로입니다. OpenClaw는 대안으로 Anthropic 설정 토큰 인증도 계속 지원합니다.
    - **OpenAI Code(Codex) 구독(OAuth)**: 브라우저 흐름을 사용하며 `code#state`를 붙여 넣습니다.
      - 기본 모델이 없는 새 설정에서는 Codex 런타임을 통해 `agents.defaults.model`을 `openai/gpt-5.6-sol`로 설정합니다.
    - **OpenAI Code(Codex) 구독(기기 페어링)**: 수명이 짧은 기기 코드를 사용하는 브라우저 페어링 흐름입니다.
      - 기본 모델이 없는 새 설정에서는 Codex 런타임을 통해 `agents.defaults.model`을 `openai/gpt-5.6-sol`로 설정합니다.
    - **OpenAI API 키**: `OPENAI_API_KEY`가 있으면 사용하고, 없으면 키를 입력하라는 프롬프트를 표시한 다음 인증 프로필에 저장합니다.
      - 기본 모델이 없는 새 설정에서는 `agents.defaults.model`을 `openai/gpt-5.6`으로 설정합니다. 별도의 접미사가 없는 직접 API 모델 ID는 Sol 등급으로 해석됩니다.
    - OpenAI를 추가하거나 다시 인증해도 `openai/gpt-5.5`를 포함하여 명시적으로 지정된 기존 기본 모델은 유지됩니다. 계정에서 GPT-5.6을 제공하지 않는 경우 `openai/gpt-5.5`를 명시적으로 선택하십시오. OpenClaw는 모델을 자동으로 하향 조정하지 않습니다.
    - **xAI OAuth**: localhost 콜백이 필요 없는 기기 코드 브라우저 로그인이므로 SSH/Docker/VPS에서도 작동합니다(`--auth-choice xai-oauth`).
    - **xAI API 키**: `XAI_API_KEY`를 입력하라는 프롬프트를 표시합니다(`--auth-choice xai-api-key`).
    - `--auth-choice xai-device-code`도 동일한 xAI OAuth 기기 코드 흐름을 위한 수동 전용 호환성 별칭으로 계속 작동합니다. 새 스크립트에는 `xai-oauth`를 사용하십시오.
    - **OpenCode**: `OPENCODE_API_KEY`(또는 `OPENCODE_ZEN_API_KEY`, https://opencode.ai/auth 에서 발급)를 입력하라는 프롬프트를 표시하고 Zen 또는 Go 카탈로그를 선택할 수 있게 합니다.
    - **Ollama**: 먼저 **클라우드 + 로컬**, **클라우드만** 또는 **로컬만**을 제공합니다. `Cloud only`는 `OLLAMA_API_KEY`를 입력하라는 프롬프트를 표시하고 `https://ollama.com`을 사용합니다. 호스트 기반 모드는 Ollama 기본 URL(기본값 `http://127.0.0.1:11434`)을 입력하라는 프롬프트를 표시하고, 사용 가능한 모델을 검색하며, 필요한 경우 선택한 로컬 모델을 자동으로 가져옵니다. `Cloud + Local`은 해당 Ollama 호스트가 클라우드 접근을 위해 로그인되어 있는지도 확인합니다.
    - 자세한 내용: [Ollama](/ko/providers/ollama)
    - **API 키**: 키를 대신 저장합니다.
    - **Vercel AI Gateway(다중 모델 프록시)**: `AI_GATEWAY_API_KEY`를 입력하라는 프롬프트를 표시합니다.
    - 자세한 내용: [Vercel AI Gateway](/ko/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: Account ID, Gateway ID 및 `CLOUDFLARE_AI_GATEWAY_API_KEY`를 입력하라는 프롬프트를 표시합니다.
    - 자세한 내용: [Cloudflare AI Gateway](/ko/providers/cloudflare-ai-gateway)
    - **MiniMax**: 구성이 자동으로 작성되며, 호스팅 기본값은 `MiniMax-M3`입니다.
      API 키 설정은 `minimax/...`를 사용하고 OAuth 설정은
      `minimax-portal/...`을 사용합니다.
    - 자세한 내용: [MiniMax](/ko/providers/minimax)
    - **StepFun**: 중국 또는 글로벌 엔드포인트의 StepFun 표준이나 Step Plan에 맞게 구성이 자동으로 작성됩니다.
    - 표준의 현재 기본값은 `step-3.5-flash`이며, Step Plan에는 `step-3.5-flash-2603`도 포함됩니다.
    - 자세한 내용: [StepFun](/ko/providers/stepfun)
    - **Synthetic(Anthropic 호환)**: `SYNTHETIC_API_KEY`를 입력하라는 프롬프트를 표시합니다.
    - 자세한 내용: [Synthetic](/ko/providers/synthetic)
    - **Moonshot(Kimi K2)**: 구성이 자동으로 작성됩니다.
    - **Kimi Coding**: 구성이 자동으로 작성됩니다.
    - 자세한 내용: [Moonshot AI(Kimi + Kimi Coding)](/ko/providers/moonshot)
    - **사용자 지정 제공자**: OpenAI 호환, OpenAI Responses 호환 또는 Anthropic 호환 엔드포인트와 함께 작동합니다. 비대화형 플래그: `--auth-choice custom-api-key`, `--custom-base-url`, `--custom-model-id`, `--custom-api-key`(선택 사항, `CUSTOM_API_KEY`로 대체), `--custom-provider-id`(선택 사항, 기본 URL에서 자동으로 파생), `--custom-compatibility openai|openai-responses|anthropic`(기본값 `openai`), `--custom-image-input` / `--custom-text-input`(추론된 비전 모델 감지를 재정의).
    - **건너뛰기**: 아직 인증을 구성하지 않습니다.
    - 감지된 옵션에서 기본 모델을 선택하거나 제공자/모델을 직접 입력합니다. 최상의 품질과 더 낮은 프롬프트 인젝션 위험을 위해 제공자 스택에서 사용 가능한 가장 강력한 최신 세대 모델을 선택하십시오.
    - 온보딩은 모델 검사를 실행하며 구성된 모델을 알 수 없거나 인증이 누락된 경우 경고합니다.
    - API 키 저장 모드의 기본값은 일반 텍스트 인증 프로필 값입니다. 대신 환경 변수 기반 참조를 저장하려면 `--secret-input-mode ref`를 사용하십시오(예: `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`). 참조되는 환경 변수가 이미 설정되어 있어야 하며, 그렇지 않으면 온보딩이 즉시 실패합니다.
    - 인증 프로필은 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`에 있습니다(API 키 + OAuth). `~/.openclaw/credentials/oauth.json`은 레거시 가져오기 전용입니다.
    - 자세한 내용: [OAuth](/ko/concepts/oauth)
    <Note>
    헤드리스/서버 팁: 브라우저가 있는 컴퓨터에서 OAuth를 완료한 다음 해당
    에이전트의 `auth-profiles.json`(예:
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 또는 이에 해당하는
    `$OPENCLAW_STATE_DIR/...` 경로)을 Gateway 호스트로 복사하십시오. `credentials/oauth.json`은
    레거시 가져오기 소스로만 사용됩니다.
    </Note>
  </Step>
  <Step title="워크스페이스">
    - 기본값은 `~/.openclaw/workspace`입니다(구성 가능).
    - 에이전트 부트스트랩 절차에 필요한 워크스페이스 파일을 초기화합니다.
    - 전체 워크스페이스 구성 + 백업 안내: [에이전트 워크스페이스](/ko/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - 포트(기본값 **18789**), 바인드, 인증 모드, tailscale 노출을 설정합니다.
    - 인증 권장 사항: 로컬 WS 클라이언트도 인증하도록 루프백에서도 **토큰**을 유지하십시오.
    - 토큰 모드의 대화형 설정에서는 다음 옵션을 제공합니다.
      - **일반 텍스트 토큰 생성/저장**(기본값)
      - **SecretRef 사용**(옵트인)
      - 빠른 시작은 온보딩 프로브/대시보드 부트스트랩을 위해 `env`, `file`, `exec` 제공자의 기존 `gateway.auth.token` SecretRef를 재사용합니다.
      - 해당 SecretRef가 구성되어 있지만 해석할 수 없으면 런타임 인증을 자동으로 약화하는 대신 온보딩이 명확한 해결 안내와 함께 조기에 실패합니다.
    - 비밀번호 모드의 대화형 설정에서도 일반 텍스트 또는 SecretRef 저장을 지원합니다.
    - 비대화형 토큰 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
      - 온보딩 프로세스 환경에 비어 있지 않은 환경 변수가 필요합니다.
      - `--gateway-token`과 함께 사용할 수 없습니다.
    - 모든 로컬 프로세스를 완전히 신뢰하는 경우에만 인증을 비활성화하십시오.
    - 루프백이 아닌 바인드에는 여전히 인증이 필요합니다.

  </Step>
  <Step title="채널">
    - [WhatsApp](/ko/channels/whatsapp): 선택적 QR 로그인.
    - [Telegram](/ko/channels/telegram): 봇 토큰.
    - [Discord](/ko/channels/discord): 봇 토큰.
    - [Google Chat](/ko/channels/googlechat): 서비스 계정 JSON + Webhook 대상.
    - [Mattermost](/ko/channels/mattermost)(Plugin): 봇 토큰 + 기본 URL.
    - [Signal](/ko/channels/signal)(Plugin): 선택적 `signal-cli` 설치 + 계정 구성.
    - [iMessage](/ko/channels/imessage): `imsg` CLI 경로 + Messages DB 접근. Gateway가 Mac 외부에서 실행될 때는 SSH 래퍼를 사용하십시오.
    - Discord, Feishu, Microsoft Teams, QQ Bot, Slack 및 기타 채널은 온보딩에서 대신 설치할 수 있는
      Plugin으로 제공됩니다. 전체 카탈로그: [채널](/ko/channels).
    - DM 보안: 기본값은 페어링입니다. 첫 번째 DM에서 코드를 보냅니다. `openclaw pairing approve <channel> <code>`를 통해 승인하거나 허용 목록을 사용하십시오.

  </Step>
  <Step title="웹 검색">
    - Brave, Codex(호스팅 검색), DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Parallel, Perplexity, SearXNG 또는 Tavily 등의 지원되는 제공자를 선택하거나 건너뜁니다.
    - API 기반 제공자는 빠른 설정을 위해 환경 변수나 기존 구성을 사용할 수 있습니다. 키가 필요 없는 제공자는 대신 해당 제공자별 전제 조건을 사용합니다.
    - `--skip-search`로 건너뜁니다.
    - 나중에 구성: `openclaw configure --section web`.

  </Step>
  <Step title="데몬 설치">
    - macOS: LaunchAgent
      - 로그인된 사용자 세션이 필요합니다. 헤드리스 환경에서는 사용자 지정 LaunchDaemon을 사용하십시오(제공되지 않음).
    - Linux(및 WSL2를 통한 Windows): systemd 사용자 단위
      - 온보딩은 로그아웃 후에도 Gateway가 계속 실행되도록 `loginctl enable-linger <user>`를 통해 linger 활성화를 시도합니다.
      - sudo를 요청할 수 있습니다(`/var/lib/systemd/linger`에 쓰기). 먼저 sudo 없이 시도합니다.
    - 네이티브 Windows: 먼저 예약된 작업을 사용합니다. 작업 생성이 거부되면 OpenClaw는 사용자별 시작 폴더 로그인 항목으로 대체하고 Gateway를 즉시 시작합니다.
    - **런타임 선택:** Node(권장, WhatsApp/Telegram에 필수 - Bun은 재연결 시 메모리를 손상시킬 수 있음). 대화형으로는 Node만 제공되며 `--daemon-runtime bun`은 CLI 전용입니다.
    - 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우 데몬 설치는 이를 검증하지만 해석된 일반 텍스트 토큰 값을 감독자 서비스 환경 메타데이터에 저장하지 않습니다.
    - 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef를 해석할 수 없는 경우 실행 가능한 안내와 함께 데몬 설치가 차단됩니다.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우 모드가 명시적으로 설정될 때까지 데몬 설치가 차단됩니다.

  </Step>
  <Step title="상태 검사">
    - 필요한 경우 Gateway를 시작하고 `openclaw health`를 실행합니다.
    - 팁: `openclaw status --deep`은 지원되는 경우 채널 프로브를 포함하여 실시간 Gateway 상태 프로브를 상태 출력에 추가합니다(접근 가능한 Gateway 필요).

  </Step>
  <Step title="Skills(권장)">
    - 사용 가능한 Skills를 읽고 요구 사항을 확인합니다.
    - Node 관리자를 선택할 수 있습니다. **npm / pnpm / bun**.
    - 신뢰할 수 있는 번들 Skills의 선택적 종속 항목을 자동으로 설치합니다(일부는 macOS에서 Homebrew 사용).
    - Homebrew, uv 또는 Go 설치 프로그램 전제 조건을 사용할 수 없는 Skills를 건너뛰고 수동 설정 안내와 함께 그룹화하며, 전제 조건을 설치한 후 `openclaw doctor`를 실행하도록 안내합니다.

  </Step>
  <Step title="완료">
    - 요약 + 다음 단계로, 터미널, 브라우저 또는 나중에 실행할지 묻는 **에이전트를 어떻게 부화하시겠습니까?** 프롬프트를 포함합니다.

  </Step>
</Steps>

<Note>
GUI가 감지되지 않으면 온보딩은 브라우저를 여는 대신 Control UI의 SSH 포트 전달 안내를 출력합니다.
Control UI 자산이 누락된 경우 온보딩은 빌드를 시도합니다. 대체 명령은 `pnpm ui:build`입니다(UI 종속 항목 자동 설치).
</Note>

## 비대화형 모드

온보딩을 자동화하거나 스크립트로 실행하려면 `--non-interactive --accept-risk`를 사용하십시오(이
플래그는 필수 위험 확인이며, 지정하지 않으면 온보딩이 오류와 함께
종료됩니다).

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

기계가 읽을 수 있는 요약을 사용하려면 `--json`을 추가하십시오.

비대화형 모드의 Gateway 토큰 SecretRef:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token`과 `--gateway-token-ref-env`은 함께 사용할 수 없습니다.

<Note>
`--json`은 비대화형 모드를 **의미하지 않습니다**. 스크립트에서는 `--non-interactive --accept-risk`(및 `--workspace`)를 사용하십시오.
</Note>

제공자별 명령 예시는 [CLI 자동화](/ko/start/wizard-cli-automation#provider-specific-examples)에 있습니다.
플래그의 의미와 단계 순서는 이 참조 페이지를 확인하십시오.

### 에이전트 추가(비대화형)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

`main`은 예약된 에이전트 ID이므로 `openclaw agents add`에 사용할 수 없습니다.

## Gateway 마법사 RPC

Gateway는 RPC(`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`)를 통해 온보딩 흐름을 제공합니다.
클라이언트(macOS 앱, Control UI)는 온보딩 로직을 다시 구현하지 않고도 단계를 렌더링할 수 있습니다.

## Signal 설정(signal-cli)

온보딩은 `signal-cli`가 `PATH`에 있는지 감지하고, 없으면 설치 옵션을 제공합니다.

- Linux x86-64: `signal-cli` GitHub 릴리스에서 공식 네이티브 GraalVM 빌드를 다운로드하여 `~/.openclaw/tools/signal-cli/<version>/` 아래에 저장합니다.
- macOS 및 기타 아키텍처: 대신 Homebrew를 통해 설치합니다.
- 네이티브 Windows: 아직 지원하지 않습니다. Linux 설치 경로를 사용하려면 WSL2 내에서 온보딩을 실행하십시오.
- 어느 방식이든 구성에 `channels.signal.cliPath`를 기록합니다.

## 마법사가 기록하는 항목

`~/.openclaw/openclaw.json`의 일반적인 필드는 다음과 같습니다.

- `agents.defaults.workspace`
- `--skip-bootstrap`이 전달된 경우 `agents.defaults.skipBootstrap`
- `agents.defaults.model` / `models.providers`(Minimax를 선택한 경우)
- `tools.profile`(설정되어 있지 않으면 로컬 온보딩의 기본값은 `"coding"`이며, 기존에 명시된 값은 유지됩니다)
- `gateway.*`(모드, 바인드, 인증, Tailscale)
- `session.dmScope`(설정되어 있지 않으면 로컬 온보딩의 기본값은 `"per-channel-peer"`이며, 기존에 명시된 값은 유지됩니다. 자세한 내용: [CLI 설정 참조](/ko/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- 채널 프롬프트에서 사용을 선택한 경우 채널 DM 허용 목록. Discord, Matrix, Microsoft Teams 및 Slack은 가능한 경우 이름을 ID로 해석하며, 다른 채널은 ID를 직접 사용합니다(예: 숫자로 된 Telegram 발신자 ID 또는 WhatsApp 전화번호).
- `skills.install.nodeManager`
  - `setup --node-manager`는 `npm`, `pnpm` 또는 `bun`을 허용합니다.
  - 수동 구성에서는 `skills.install.nodeManager`를 직접 설정하여 계속 `yarn`을 사용할 수 있습니다.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add`는 `agents.list[]`와 선택적 `bindings`를 기록합니다.

WhatsApp 자격 증명은 `~/.openclaw/credentials/whatsapp/<accountId>/` 아래에 저장됩니다.
활성 세션과 대화 기록은
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`에 저장됩니다.
`~/.openclaw/agents/<agentId>/sessions/` 디렉터리는 레거시 마이그레이션
입력 및 보관/지원 아티팩트에 사용됩니다.

일부 채널은 Plugin으로 제공됩니다. 설정 중 하나를 선택하면 구성하기 전에
온보딩에서 해당 Plugin을 설치하도록 안내합니다(npm 또는 로컬 경로).

## 관련 문서

- 온보딩 개요: [온보딩(CLI)](/ko/start/wizard)
- CLI 설정 참조: [CLI 설정 참조](/ko/start/wizard-cli-reference)
- macOS 앱 온보딩: [온보딩](/ko/start/onboarding)
- 구성 참조: [Gateway 구성](/ko/gateway/configuration)
- 제공자: [WhatsApp](/ko/channels/whatsapp), [Telegram](/ko/channels/telegram), [Discord](/ko/channels/discord), [Google Chat](/ko/channels/googlechat), [Signal](/ko/channels/signal), [iMessage](/ko/channels/imessage)
- Skills: [Skills](/ko/tools/skills), [Skills 구성](/ko/tools/skills-config)
