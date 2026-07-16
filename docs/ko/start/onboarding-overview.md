---
read_when:
    - 온보딩 경로 선택하기
    - 새 환경 설정하기
sidebarTitle: Onboarding Overview
summary: OpenClaw 온보딩 옵션 및 흐름 개요
title: 온보딩 개요
x-i18n:
    generated_at: "2026-07-16T13:06:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4bcda1dcfb91f388ca6bef59f9bdf5177571d93c0d89c45025ef837628fa7ba0
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw에는 터미널 및 macOS 앱 온보딩이 있습니다. 두 방식 모두 추론을 먼저 설정합니다.
기존 AI 액세스를 감지하고 실제 완성을 요구하며, 그 후에만
OpenClaw를 시작하여 나머지 설정을 구성합니다. 연결 가능하고 구성된 Gateway에서
기본 에이전트에 이미 모델이 구성되어 있으면 온보딩을 건너뛰고
일반 에이전트 UI를 엽니다. 터미널 흐름에서는 세부 설정을 위한
전체 클래식 마법사도 제공합니다.

## 어떤 경로를 사용해야 합니까?

|                | CLI 온보딩                              | macOS 앱 온보딩                |
| -------------- | --------------------------------------- | ------------------------------ |
| **플랫폼**     | macOS, Linux, Windows(네이티브 또는 WSL2) | macOS 전용                     |
| **인터페이스** | 추론 설정 후 OpenClaw                   | 추론 설정 후 OpenClaw          |
| **적합한 용도** | 서버, 헤드리스 환경, 완전한 제어        | 데스크톱 Mac, 시각적 설정      |
| **자동화**     | 스크립트용 `--non-interactive`           | 수동으로만 가능                |
| **명령어**     | `openclaw onboard`                      | 앱 실행                        |

대부분의 사용자는 **CLI 온보딩**으로 시작해야 합니다. 모든 환경에서 작동하며
가장 높은 수준의 제어 기능을 제공합니다.

## 온보딩에서 구성하는 항목

안내식 추론 단계에서는 다음 항목만 설정합니다.

1. **모델 제공자 및 인증** — 감지된 액세스 또는 검증된 제공자 로그인,
   API 키 또는 토큰
2. **검증된 추론** — 기본 에이전트의 실제 적용 모델에서 수행한
   실제 완성

해당 완성이 통과하면 OpenClaw에서 워크스페이스, Gateway,
Gateway 서비스, 채널, 에이전트, Plugin 및 기타 선택적 기능을 구성할 수 있습니다.

클래식 CLI 마법사에서는 다음 항목도 추가로 구성할 수 있습니다.

1. **채널**(선택 사항) — Discord, Feishu, Google Chat, iMessage,
   Mattermost, Microsoft Teams, Telegram, WhatsApp 등을 포함한
   기본 제공 및 번들 채팅 채널
2. **고급 Gateway 제어 기능** — 원격 모드, 네트워크 설정 및 데몬 선택

## CLI 온보딩

아무 터미널에서나 다음을 실행하십시오.

```bash
openclaw onboard
```

안내식 흐름은 기존 AI 액세스를 감지하고 후보를 순서대로 실제 테스트하며,
실패하면 다음 후보로 넘어갑니다. 감지할 후보가 모두 소진되면 OpenAI,
Anthropic, xAI(Grok), Google 및 OpenRouter를 먼저 표시합니다. **더 보기…**에는
나머지 제공자가 제공자 그룹별로 포함되며, 두 번째 메뉴에는 지역, 요금제 및 지원되는
브라우저, 기기, API 키 또는 토큰 방식이 표시됩니다. 완성이 통과한 후에만 모델과
자격 증명을 저장한 다음, OpenClaw를 시작하여 워크스페이스, Gateway, 채널,
에이전트, Plugin 및 기타 선택적 기능을 구성합니다. **지금은 건너뛰기**를 선택하면
OpenClaw를 시작하지 않고 종료합니다. 흐름 내에서 클래식 마법사로 전환할 수는
없습니다. 클래식 마법사를 사용하려면 종료한 후 `openclaw onboard --classic`을 실행하십시오.

추론이 통과하면 OpenClaw에서 마스킹된 터미널 마법사로 채널 설정을 넘길 수
있습니다. 안내식 또는 클래식 제공자 설정은 열리지 않습니다. 모델 제공자 또는
인증을 변경하려면 OpenClaw를 종료하고 `openclaw onboard`을 실행하십시오.

모델/인증, 채널, skill, 원격 Gateway 또는 가져오기를 세부적으로 설정하려면
`openclaw onboard --classic`을 사용하십시오. `--install-daemon`도 추가하면 클래식 흐름을
선택하고 백그라운드 서비스를 한 단계로 설치합니다. 대화형 비추론 설정 및 복구에는
`openclaw
openclaw`을 사용하십시오. `openclaw
onboard --modern`은 동일한 실제 추론
게이트를 사용하는 호환성 별칭입니다.

전체 참고 자료: [온보딩(CLI)](/ko/start/wizard)
CLI 명령어 문서: [`openclaw onboard`](/ko/cli/onboard)

## macOS 앱 온보딩

OpenClaw 앱을 여십시오. 구성된 로컬 또는 원격 Gateway에 연결할 수 있고
기본 에이전트에 이미 모델이 구성되어 있으면 앱은 온보딩과 OpenClaw를 건너뛰고
즉시 일반 에이전트 UI를 엽니다.

새 Gateway이거나 설정이 완료되지 않은 경우, 최초 실행 흐름에서 기존 AI
액세스(Claude Code, Codex 또는 API 키)를 감지하고 최적의
옵션을 실제 테스트하며, 실제 응답을 받은 후에만 저장합니다. 실패하면 자동으로
다음 옵션을 시도하고, 아무것도 찾지 못하면 검증된 수동 API 키 단계를 제공합니다.
민감한 자격 증명에는 마스킹된 입력을 사용합니다. 추론이 통과하면 OpenClaw가
시작되고 나머지 구성을 지원합니다.

Gemini CLI는 설정 후 일반 에이전트에서 계속 사용할 수 있지만, 도구를 사용하지 않는
프로브를 강제할 수 없으므로 이 추론 게이트에서는 제공되지 않습니다.

전체 참고 자료: [온보딩(macOS 앱)](/ko/start/onboarding)

## 사용자 지정 또는 목록에 없는 제공자

제공자가 목록에 없으면 `openclaw onboard --classic`을 실행하고
**사용자 지정 제공자**를 선택한 후 다음을 입력하십시오.

- 엔드포인트 호환성: OpenAI 호환(`/chat/completions`), OpenAI Responses 호환(`/responses`), Anthropic 호환(`/messages`) 또는 알 수 없음(세 가지를 모두 프로브하여 자동 감지)
- 기본 URL 및 API 키(엔드포인트에서 요구하지 않는 경우 API 키는 선택 사항)
- 모델 ID 및 선택적 모델 별칭

여러 사용자 지정 엔드포인트가 함께 존재할 수 있으며, 각 엔드포인트에는 고유한 엔드포인트 ID가 부여됩니다.

## 관련 자료

- [시작하기](/ko/start/getting-started)
- [CLI 설정 참고 자료](/ko/start/wizard-cli-reference)
