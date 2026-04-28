---
read_when:
    - CLI 온보딩 실행 또는 구성하기
    - 새 머신 설정하기
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI 온보딩: Gateway, 워크스페이스, 채널, Skills를 위한 안내형 설정'
title: 온보딩 (CLI)
x-i18n:
    generated_at: "2026-04-24T06:37:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 919a4ab57f42f663e98e77c967e08e7ad7afbb193bd048ca1dedc884002d3801
    source_path: start/wizard.md
    workflow: 15
---

CLI 온보딩은 macOS, Linux 또는 Windows(WSL2 경유; 강력 권장)에서 OpenClaw를 설정하는 **권장 방식**입니다.
이 흐름은 로컬 Gateway 또는 원격 Gateway 연결과 함께 채널, Skills,
워크스페이스 기본값을 하나의 안내형 흐름으로 구성합니다.

```bash
openclaw onboard
```

<Info>
가장 빠른 첫 채팅: Control UI를 여세요(채널 설정 불필요). `openclaw dashboard`를 실행하고 브라우저에서 채팅하세요. 문서: [대시보드](/ko/web/dashboard).
</Info>

나중에 다시 구성하려면:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`은 비대화형 모드를 의미하지 않습니다. 스크립트에는 `--non-interactive`를 사용하세요.
</Note>

<Tip>
CLI 온보딩에는 Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily 같은 Provider를 선택할 수 있는 웹 검색 단계가 포함됩니다. 일부 Provider는 API 키가 필요하고, 일부는 키가 필요 없습니다. 나중에 `openclaw configure --section web`으로도 이를 구성할 수 있습니다. 문서: [웹 도구](/ko/tools/web).
</Tip>

## QuickStart vs Advanced

온보딩은 **QuickStart**(기본값)와 **Advanced**(전체 제어) 중 하나로 시작합니다.

<Tabs>
  <Tab title="QuickStart (기본값)">
    - 로컬 Gateway (loopback)
    - 워크스페이스 기본값(또는 기존 워크스페이스)
    - Gateway 포트 **18789**
    - Gateway 인증 **토큰**(loopback에서도 자동 생성)
    - 새 로컬 설정의 도구 정책 기본값: `tools.profile: "coding"` (기존 명시적 프로필은 유지)
    - DM 격리 기본값: 로컬 온보딩은 설정되지 않은 경우 `session.dmScope: "per-channel-peer"`를 기록합니다. 자세한 내용: [CLI 설정 참조](/ko/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 노출 **끄기**
    - Telegram + WhatsApp DM 기본값은 **allowlist** (전화번호를 묻는 프롬프트가 표시됨)

  </Tab>
  <Tab title="Advanced (전체 제어)">
    - 모든 단계(mode, workspace, gateway, channels, daemon, skills)를 노출합니다.

  </Tab>
</Tabs>

## 온보딩이 구성하는 것

**로컬 모드(기본값)**에서는 다음 단계를 안내합니다:

1. **모델/인증** — 지원되는 Provider/인증 흐름(API 키, OAuth, 또는 Provider별 수동 인증)을 선택합니다. 사용자 지정 Provider(OpenAI 호환, Anthropic 호환 또는 Unknown 자동 감지)도 포함됩니다. 기본 모델을 선택합니다.
   보안 참고: 이 에이전트가 도구를 실행하거나 webhook/hooks 콘텐츠를 처리한다면, 사용 가능한 가장 강력한 최신 세대 모델을 우선 선택하고 도구 정책은 엄격하게 유지하세요. 더 약하거나 오래된 계층은 프롬프트 주입에 더 취약합니다.
   비대화형 실행에서 `--secret-input-mode ref`는 평문 API 키 값 대신 auth profile에 env 기반 ref를 저장합니다.
   비대화형 `ref` 모드에서는 Provider env var가 반드시 설정되어 있어야 하며, 그 env var 없이 인라인 키 플래그를 전달하면 즉시 실패합니다.
   대화형 실행에서 secret reference 모드를 선택하면 환경 변수 또는 구성된 Provider ref(`file` 또는 `exec`)를 가리킬 수 있으며, 저장 전 빠른 사전 검증이 수행됩니다.
   Anthropic의 경우, 대화형 온보딩/구성은 **Anthropic Claude CLI**를 선호하는 로컬 경로로, **Anthropic API 키**를 권장되는 프로덕션 경로로 제공합니다. Anthropic setup-token도 지원되는 token-auth 경로로 계속 사용할 수 있습니다.
2. **워크스페이스** — 에이전트 파일의 위치(기본값 `~/.openclaw/workspace`). bootstrap 파일을 시드합니다.
3. **Gateway** — 포트, 바인드 주소, 인증 모드, Tailscale 노출.
   대화형 토큰 모드에서는 기본 평문 토큰 저장을 선택하거나 SecretRef를 옵트인할 수 있습니다.
   비대화형 토큰 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
4. **채널** — BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ 봇, Signal, Slack, Telegram, WhatsApp 등 내장 및 번들 채팅 채널.
5. **데몬** — LaunchAgent(macOS), systemd user unit(Linux/WSL2), 또는 기본 Windows Scheduled Task와 사용자별 Startup 폴더 폴백을 설치합니다.
   토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, 데몬 설치는 이를 검증하지만 supervisor 서비스 환경 메타데이터에 해석된 토큰을 영속 저장하지 않습니다.
   토큰 인증에 토큰이 필요한데 구성된 토큰 SecretRef가 해석되지 않으면, 데몬 설치는 실행 가능한 안내와 함께 차단됩니다.
   `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않았다면, 데몬 설치는 모드가 명시적으로 설정될 때까지 차단됩니다.
6. **상태 확인** — Gateway를 시작하고 실행 중인지 검증합니다.
7. **Skills** — 권장 Skills와 선택적 의존성을 설치합니다.

<Note>
온보딩을 다시 실행해도 **Reset**을 명시적으로 선택하지 않는 한(또는 `--reset`을 전달하지 않는 한) 아무것도 지워지지 않습니다.
CLI `--reset`의 기본 범위는 config, credentials, sessions이며, workspace까지 포함하려면 `--reset-scope full`을 사용하세요.
구성이 유효하지 않거나 레거시 키가 포함되어 있으면, 온보딩은 먼저 `openclaw doctor`를 실행하라고 요청합니다.
</Note>

**원격 모드**는 로컬 클라이언트가 다른 곳의 Gateway에 연결하도록만 구성합니다.
원격 호스트에는 아무것도 설치하거나 변경하지 않습니다.

## 다른 에이전트 추가

`openclaw agents add <name>`을 사용해 별도의 워크스페이스,
세션, auth profile을 가진 별도 에이전트를 만드세요. `--workspace` 없이 실행하면 온보딩이 시작됩니다.

설정되는 항목:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

참고:

- 기본 워크스페이스는 `~/.openclaw/workspace-<agentId>` 형식을 따릅니다.
- 인바운드 메시지를 라우팅하려면 `bindings`를 추가하세요(온보딩에서도 가능).
- 비대화형 플래그: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## 전체 참조

상세한 단계별 분해와 구성 출력은 [CLI 설정 참조](/ko/start/wizard-cli-reference)를 참고하세요.
비대화형 예시는 [CLI 자동화](/ko/start/wizard-cli-automation)를 참고하세요.
RPC 세부 정보를 포함한 더 깊은 기술 참조는 [온보딩 참조](/ko/reference/wizard)를 참고하세요.

## 관련 문서

- CLI 명령 참조: [`openclaw onboard`](/ko/cli/onboard)
- 온보딩 개요: [온보딩 개요](/ko/start/onboarding-overview)
- macOS 앱 온보딩: [온보딩](/ko/start/onboarding)
- 에이전트 첫 실행 의식: [에이전트 부트스트래핑](/ko/start/bootstrapping)
