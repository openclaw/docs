---
read_when:
    - CLI 온보딩 실행 또는 구성
    - 새 시스템 설정하기
sidebarTitle: 'Onboarding: CLI'
summary: 'CLI 온보딩: 추론을 확인한 다음, 나머지 설정을 Crestodian에 맡기십시오'
title: 온보딩(CLI)
x-i18n:
    generated_at: "2026-07-12T15:46:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 62dd8fc2780940f738fc99f04ef0c765f5582161c55d11100fae3b4bbbb0ea15
    source_path: start/wizard.md
    workflow: 16
---

```bash
openclaw onboard
```

CLI 온보딩은 macOS, Linux 및 Windows(네이티브 또는 WSL2)에서 권장되는 터미널 설정 경로입니다. 기본적으로 머신에서 이미 사용할 수 있는 AI 접근 권한을 감지하고, 실제 완성 요청으로 이를 확인한 후 Crestodian을 시작하여 워크스페이스, Gateway 및 선택적 기능을 구성합니다. `openclaw setup`은 동일한 흐름을 실행합니다([설정](/ko/cli/setup)에서는 구성만 수행하는 `--baseline` 변형을 설명합니다). Windows 데스크톱 사용자는 [Windows Hub](/ko/platforms/windows)에서 시작할 수도 있습니다.

안내형 온보딩은 추론을 먼저 설정합니다. 사용 가능한 AI 액세스를 감지하고,
실제 완료를 요구한 후에만 [Crestodian](/ko/cli/crestodian)을 시작하여
OpenClaw의 나머지 부분을 구성합니다. 안내형 흐름에는 추론 전 Crestodian 또는
AI 건너뛰기 경로가 없습니다.

클래식 마법사는 공급자 로그인, 원격 Gateway 설정, 채널 페어링, 데몬 제어, Skills 및 가져오기에 계속 사용할 수 있습니다. `openclaw onboard --classic`을 사용하여 명시적으로 실행하십시오. 안내형 추론 후보 화면은 이 마법사로 위임하지 않습니다. 추론을 통과한 후 Crestodian은 `open channel
wizard for <channel>`을 사용하여 비밀 정보가 필요한 채널 설정을 마스킹된 터미널 마법사에 넘길 수 있습니다. 모델 공급자 또는 해당 인증을 변경하려면 Crestodian을 종료하고 `openclaw onboard`을 실행하십시오. Crestodian은 안내형 또는 클래식 공급자 흐름을 열지 않습니다.

<Info>
가장 빠르게 첫 채팅을 시작하려면 안내에 따라 설정을 완료하고 `openclaw dashboard`를 실행한 다음,
Control UI를 통해 브라우저에서 채팅하십시오. 문서: [대시보드](/ko/web/dashboard).
</Info>

## 로케일

마법사는 온보딩의 고정 문구를 현지화합니다. 확인 순서는 `OPENCLAW_LOCALE`,
`LC_ALL`, `LC_MESSAGES`, `LANG`, 영어 순입니다. 지원되는 로케일: `en`,
`zh-CN`, `zh-TW`.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

제품 이름, 명령어, 구성 키, URL, 제공자 ID, 모델 ID 및
Plugin/채널 레이블은 로케일과 관계없이 영어로 유지됩니다.

나중에 비추론 설정을 다시 구성하려면 다음을 실행합니다.

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json`은 비대화형 모드를 의미하지 않습니다. 스크립트에서는 `--non-interactive`를 사용하십시오([CLI 자동화](/ko/start/wizard-cli-automation) 참조).
</Note>

<Tip>
클래식 마법사에는 제공자를 선택할 수 있는 웹 검색 단계가 포함되어 있습니다. 선택 가능한 제공자는 Brave,
DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web
Search, Perplexity, SearXNG 또는 Tavily입니다. 일부는 API 키가 필요하고,
나머지는 키 없이 사용할 수 있습니다. 나중에 `openclaw configure --section web`으로 구성하십시오. 문서:
[웹 도구](/ko/tools/web).
</Tip>

## 안내형 기본 흐름

일반 `openclaw onboard` 명령은 다음 절차를 따릅니다.

1. 보안 고지에 동의합니다.
2. 구성된 모델, API 키 환경 변수 및 지원되는 로컬
   AI CLI를 감지합니다.
3. 처음 감지된 후보를 실제 완성 요청으로 테스트합니다. 실패하면
   이유를 표시하고 사용 가능한 다음 후보로 계속 진행합니다.
4. 감지된 후보를 모두 확인했는데도 성공하지 못하면 감지된 후보를 다시 시도하거나 마스킹된 프롬프트에 제공자
   API 키를 입력합니다. 안내형 온보딩에서는 추론이 작동하기 전에
   Crestodian을 사용하거나 AI 설정을 건너뛰고 종료하는 옵션을 제공하지 않습니다.
5. 검증된 모델 경로와 이에 필요한 자격 증명/Plugin 상태만
   저장합니다. 워크스페이스와 Gateway 설정은 변경하지 않습니다.
6. 검증된 모델로 Crestodian을 시작하여 워크스페이스,
   Gateway, 채널, 에이전트, Plugin 및 나머지 선택적 설정을 구성하도록 합니다.

이미 구성된 설치 환경에서 명령을 다시 실행하면 현재 기본
모델을 먼저 테스트하므로 안내형 흐름이 검증 및 복구 절차로 작동합니다. 검사에 실패해도
구성된 모델을 자동으로 교체하지 않으며, 온보딩을 중지하고
계속할 방법을 묻습니다. 나중에 비추론 항목을 추가하려면 `openclaw channels add` 또는 `openclaw configure`를
실행하고, 제공자나 인증 경로를
변경하려면 `openclaw onboard`를 사용하십시오.

## 클래식 마법사: 빠른 시작과 고급 설정

전체 마법사를 열려면 `openclaw onboard --classic`을 실행하십시오. 먼저
**빠른 시작**(기본값)과 **고급 설정**(전체 제어) 중에서 선택합니다. 클래식
흐름을 선택하고 해당 프롬프트를 건너뛰려면 `--flow quickstart` 또는 `--flow advanced`(별칭 `manual`)를
전달하십시오.

<Tabs>
  <Tab title="빠른 시작(기본값)">
    - 로컬 Gateway, 루프백 바인딩
    - 기본 워크스페이스(또는 기존 워크스페이스)
    - Gateway 포트 **18789**
    - Gateway 인증 **토큰**(루프백에서도 자동 생성)
    - 도구 정책: 새 설정에는 `tools.profile: "coding"` 사용(기존에 명시적으로 지정한 프로필은 유지)
    - DM 격리: 새 설정에는 `session.dmScope: "per-channel-peer"` 사용. 자세한 내용: [CLI 설정 참고 자료](/ko/start/wizard-cli-reference#outputs-and-internals)
    - Tailscale 노출 **꺼짐**
    - Telegram 및 WhatsApp DM의 기본값은 **허용 목록**입니다. Telegram은 숫자로 된 Telegram 사용자 ID를 요청하고, WhatsApp은 전화번호를 요청합니다.

  </Tab>
  <Tab title="고급(완전한 제어)">
    - 모드, 워크스페이스, Gateway, 채널, 데몬, Skills의 모든 단계를 표시합니다.

  </Tab>
</Tabs>

원격 모드(`--mode remote`)는 항상 고급 흐름을 사용합니다. 이 모드는 현재 머신이 다른 위치의 Gateway에 연결하도록 구성할 뿐이며, 원격 호스트에는 아무것도 설치하거나 변경하지 않습니다.

## 클래식 온보딩에서 구성하는 항목

로컬 모드(기본값)는 다음 단계를 진행합니다.

1. **모델/인증** - Custom Provider(OpenAI 호환, OpenAI Responses 호환, Anthropic 호환 또는 알 수 없음 자동 감지)를 포함하여 제공자 인증 흐름(API 키, OAuth 또는 제공자별 수동 인증)을 선택합니다. 기본 모델을 선택합니다.
   새로운 OpenAI API 키 설정의 기본값은 `openai/gpt-5.6`입니다(단순 직접 API ID는 Sol로 해석됨). 새로운 ChatGPT/Codex 설정의 기본값은 `openai/gpt-5.6-sol`입니다. 설정을 다시 실행하면 `openai/gpt-5.5`를 포함하여 기존에 명시적으로 지정한 모델이 유지됩니다. 계정에서 GPT-5.6을 제공하지 않는 경우 `openai/gpt-5.5`를 명시적으로 선택하십시오.
   보안 참고: 이 에이전트가 도구를 실행하거나 Webhook/훅 콘텐츠를 처리하는 경우, 사용 가능한 최신 세대 중 가장 강력한 모델을 사용하고 도구 정책을 엄격하게 유지하는 것이 좋습니다. 성능이 낮거나 오래된 등급은 프롬프트 인젝션에 더 취약합니다.
   비대화형 실행에서 `--secret-input-mode ref`는 일반 텍스트 API 키 값 대신 환경 변수 기반 참조를 저장합니다. 참조되는 환경 변수는 이미 설정되어 있어야 하며, 그렇지 않으면 온보딩이 즉시 실패합니다. 대화형 비밀 참조 모드에서는 환경 변수나 구성된 제공자 참조(`file` 또는 `exec`)를 지정할 수 있으며, 저장하기 전에 빠른 사전 검사를 수행합니다. 모델/인증 설정 후 마법사는 선택적인 실시간 완성 테스트를 제공합니다. 실패하면 모델/인증 설정으로 한 번 돌아가거나, 나머지 클래식 마법사의 진행을 차단하지 않고 무시할 수 있습니다. 실패를 무시해도 Crestodian이 활성화되지는 않습니다. 대화형 설정에는 여전히 추론 검사 통과가 필요합니다.
2. **워크스페이스** - 에이전트 파일이 위치할 디렉터리입니다(기본값 `~/.openclaw/workspace`). 부트스트랩 파일을 생성합니다.
3. **Gateway** - 포트, 바인딩 주소, 인증 모드, Tailscale 노출을 구성합니다. 대화형 토큰 모드에서는 일반 텍스트 토큰 저장(기본값)을 선택하거나 SecretRef 사용을 선택합니다. 비대화형 SecretRef 경로: `--gateway-token-ref-env <ENV_VAR>`.
4. **채널** - Discord, Feishu, Google Chat, iMessage, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp 등을 포함한 기본 제공 및 공식 Plugin 채팅 채널입니다.
5. **데몬** - LaunchAgent(macOS), systemd 사용자 유닛(Linux/WSL2) 또는 사용자별 시작 폴더 폴백을 사용하는 기본 Windows 예약 작업을 설치합니다.
   토큰 인증이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, 데몬 설치 시 이를 검증하지만 해석된 토큰을 감독자 서비스 환경 메타데이터에 저장하지 않습니다. 해석되지 않은 SecretRef가 있으면 안내와 함께 설치가 차단됩니다. `gateway.auth.mode`가 설정되지 않은 상태에서 `gateway.auth.token`과 `gateway.auth.password`가 모두 설정되어 있으면 모드를 명시적으로 설정할 때까지 설치가 차단됩니다.
6. **상태 검사** - Gateway를 시작하고 연결 가능한지 확인합니다.
7. **Skills** - 권장 Skills와 선택적 종속성을 설치합니다.

<Note>
온보딩을 다시 실행해도 **Reset**을 명시적으로 선택하거나 `--reset`을 전달하지 않는 한 아무것도 삭제되지 않습니다. CLI `--reset`은 기본적으로 구성, 자격 증명 및 세션을 초기화합니다. 워크스페이스도 제거하려면 `--reset-scope full`을 사용하십시오. 구성이 유효하지 않거나 레거시 키를 포함한 경우, 온보딩은 먼저 `openclaw doctor`를 실행하도록 요청합니다.
</Note>

`--flow import`는 새 설정 대신 클래식 마법사에서 감지된 마이그레이션 흐름(예: Hermes)을 실행합니다. [마이그레이션](/ko/cli/migrate) 및 [설치](/ko/install/migrating-hermes)의 마이그레이션 가이드를 참조하십시오. `openclaw onboard --modern`은 [Crestodian](/ko/cli/crestodian)의 호환성 별칭입니다. `openclaw crestodian`과 동일한 추론 게이트를 사용합니다. 검증된 추론은 어시스턴트를 시작하며, 대화형 실행 중 실패하면 안내형 추론 설정으로 돌아갑니다.

## 다른 에이전트 추가

`openclaw agents add <name>`을 사용하여 자체 워크스페이스, 세션 및 인증 프로필을 갖는 별도의 에이전트를 생성하십시오. `--workspace` 없이 실행하면 이름, 워크스페이스, 인증, 채널 및 바인딩을 위한 대화형 흐름이 시작됩니다. 이는 전체 `openclaw onboard` 마법사가 아닙니다.

설정되는 항목:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

참고:

- 기본 워크스페이스: `~/.openclaw/workspace-<agentId>`(`agents.defaults.workspace`가 설정된 경우에는 해당 경로 아래).
- 수신 메시지를 이 에이전트로 라우팅하려면 `bindings`를 추가하십시오(온보딩에서 대신 구성할 수도 있음).
- 비대화형 플래그: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## 전체 참고 자료

단계별 세부 동작과 구성 출력은 [CLI 설정 참고 자료](/ko/start/wizard-cli-reference)를 참조하십시오.
비대화형 예시는 [CLI 자동화](/ko/start/wizard-cli-automation)를 참조하십시오.
전체 플래그 참고 자료는 [`openclaw onboard`](/ko/cli/onboard)를 참조하십시오.

## 관련 문서

- CLI 명령 참고 자료: [`openclaw onboard`](/ko/cli/onboard)
- 온보딩 개요: [온보딩 개요](/ko/start/onboarding-overview)
- macOS 앱 온보딩: [온보딩](/ko/start/onboarding)
- 에이전트 최초 실행 절차: [에이전트 부트스트래핑](/ko/start/bootstrapping)
