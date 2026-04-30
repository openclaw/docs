---
read_when:
    - CLI 온보딩 실행 또는 구성
    - 새 머신 설정하기
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI 온보딩: Gateway, 워크스페이스, 채널 및 Skills를 위한 안내형 설정'
title: 온보딩 (CLI)
x-i18n:
    generated_at: "2026-04-30T06:52:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9e9ee3af82ab9f4a1af5d20e3680eb932a9428cb914bbc08c9a2bf83c94ec158
    source_path: start/wizard.md
    workflow: 16
---

CLI 온보딩은 macOS, Linux 또는 Windows(WSL2 사용; 강력 권장)에서 OpenClaw를 설정하는 **권장** 방법입니다.
하나의 안내 흐름에서 로컬 Gateway 또는 원격 Gateway 연결과 채널, Skills,
작업 공간 기본값을 구성합니다.

```bash
openclaw onboard
```

<Info>
가장 빠른 첫 채팅: Control UI를 엽니다(채널 설정 필요 없음). `openclaw dashboard`를 실행하고 브라우저에서 채팅하세요. 문서: [Dashboard](/ko/web/dashboard).
</Info>

나중에 다시 구성하려면:

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`은 비대화형 모드를 의미하지 않습니다. 스크립트에서는 `--non-interactive`를 사용하세요.
</Note>

<Tip>
CLI 온보딩에는 Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search,
Ollama Web Search, Perplexity, SearXNG 또는 Tavily 같은 제공자를 선택할 수 있는 웹 검색 단계가 포함됩니다.
일부 제공자는 API 키가 필요하고, 다른 제공자는 키가 필요 없습니다. 나중에
`openclaw configure --section web`으로도 구성할 수 있습니다. 문서: [웹 도구](/ko/tools/web).
</Tip>

## 빠른 시작 대 고급

온보딩은 **빠른 시작**(기본값)과 **고급**(전체 제어) 중 하나로 시작합니다.

<Tabs>
  <Tab title="빠른 시작(기본값)">
    - 로컬 Gateway(loopback)
    - 작업 공간 기본값(또는 기존 작업 공간)
    - Gateway 포트 **18789**
    - Gateway 인증 **Token**(loopback에서도 자동 생성)
    - 새 로컬 설정의 기본 도구 정책: `tools.profile: "coding"`(기존 명시적 프로필은 보존됨)
    - DM 격리 기본값: 로컬 온보딩은 설정되지 않은 경우 `session.dmScope: "per-channel-peer"`를 기록합니다. 자세히 보기: [CLI 설정 참조](/ko/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 노출 **꺼짐**
    - Telegram + WhatsApp DM은 기본적으로 **허용 목록**을 사용합니다(전화번호 입력을 요청받습니다).

  </Tab>
  <Tab title="고급(전체 제어)">
    - 모든 단계(모드, 작업 공간, Gateway, 채널, 데몬, Skills)를 노출합니다.

  </Tab>
</Tabs>

## 온보딩이 구성하는 항목

**로컬 모드(기본값)**는 다음 단계를 안내합니다.

1. **모델/인증** — Custom Provider
   (OpenAI 호환, Anthropic 호환 또는 Unknown 자동 감지)를 포함하여 지원되는 제공자/인증 흐름(API 키, OAuth 또는 제공자별 수동 인증)을 선택합니다. 기본 모델을 선택합니다.
   보안 참고: 이 에이전트가 도구를 실행하거나 webhook/hooks 콘텐츠를 처리한다면, 사용 가능한 가장 강력한 최신 세대 모델을 선호하고 도구 정책을 엄격하게 유지하세요. 더 약하거나 오래된 등급은 프롬프트 인젝션에 더 취약합니다.
   비대화형 실행에서는 `--secret-input-mode ref`가 일반 텍스트 API 키 값 대신 환경 변수 기반 참조를 인증 프로필에 저장합니다.
   비대화형 `ref` 모드에서는 제공자 환경 변수가 설정되어 있어야 합니다. 해당 환경 변수 없이 인라인 키 플래그를 전달하면 빠르게 실패합니다.
   대화형 실행에서 비밀 참조 모드를 선택하면 저장 전 빠른 사전 검증을 거쳐 환경 변수 또는 구성된 제공자 참조(`file` 또는 `exec`)를 가리킬 수 있습니다.
   Anthropic의 경우, 대화형 온보딩/구성은 선호되는 로컬 경로로 **Anthropic Claude CLI**를, 권장 프로덕션 경로로 **Anthropic API key**를 제공합니다. Anthropic setup-token도 지원되는 토큰 인증 경로로 계속 사용할 수 있습니다.
2. **작업 공간** — 에이전트 파일의 위치입니다(기본값 `~/.openclaw/workspace`). 부트스트랩 파일을 시드합니다.
3. **Gateway** — 포트, 바인드 주소, 인증 모드, Tailscale 노출입니다.
   대화형 토큰 모드에서는 기본 일반 텍스트 토큰 저장소를 선택하거나 SecretRef를 사용할 수 있습니다.
   비대화형 토큰 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
4. **채널** — BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp 등을 포함한 내장 및 번들 채팅 채널입니다.
5. **데몬** — LaunchAgent(macOS), systemd 사용자 유닛(Linux/WSL2) 또는 사용자별 Startup 폴더 대체 경로가 있는 네이티브 Windows Scheduled Task를 설치합니다.
   토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, 데몬 설치는 이를 검증하지만 해석된 토큰을 supervisor 서비스 환경 메타데이터에 유지하지 않습니다.
   토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 해석되지 않은 경우, 데몬 설치는 실행 가능한 안내와 함께 차단됩니다.
   `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, 모드가 명시적으로 설정될 때까지 데몬 설치가 차단됩니다.
6. **상태 확인** — Gateway를 시작하고 실행 중인지 확인합니다.
7. **Skills** — 권장 Skills와 선택적 의존성을 설치합니다.

<Note>
온보딩을 다시 실행해도 명시적으로 **재설정**을 선택하거나 `--reset`을 전달하지 않는 한 아무것도 삭제하지 않습니다.
CLI `--reset`은 기본적으로 구성, 자격 증명, 세션을 대상으로 합니다. 작업 공간을 포함하려면 `--reset-scope full`을 사용하세요.
구성이 유효하지 않거나 레거시 키를 포함하는 경우, 온보딩은 먼저 `openclaw doctor`를 실행하라고 요청합니다.
</Note>

**원격 모드**는 다른 위치의 Gateway에 연결하도록 로컬 클라이언트만 구성합니다.
원격 호스트에 아무것도 설치하거나 변경하지 않습니다.

## 다른 에이전트 추가

`openclaw agents add <name>`을 사용해 자체 작업 공간,
세션, 인증 프로필을 가진 별도 에이전트를 만듭니다. `--workspace` 없이 실행하면 온보딩이 시작됩니다.

설정되는 항목:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

참고:

- 기본 작업 공간은 `~/.openclaw/workspace-<agentId>`를 따릅니다.
- 인바운드 메시지를 라우팅하려면 `bindings`를 추가하세요(온보딩에서 이를 수행할 수 있음).
- 비대화형 플래그: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## 전체 참조

자세한 단계별 설명과 구성 출력은
[CLI 설정 참조](/ko/start/wizard-cli-reference)를 참조하세요.
비대화형 예제는 [CLI 자동화](/ko/start/wizard-cli-automation)를 참조하세요.
RPC 세부 정보를 포함한 더 깊은 기술 참조는
[온보딩 참조](/ko/reference/wizard)를 참조하세요.

## 관련 문서

- CLI 명령 참조: [`openclaw onboard`](/ko/cli/onboard)
- 온보딩 개요: [온보딩 개요](/ko/start/onboarding-overview)
- macOS 앱 온보딩: [온보딩](/ko/start/onboarding)
- 에이전트 최초 실행 의식: [에이전트 부트스트래핑](/ko/start/bootstrapping)
