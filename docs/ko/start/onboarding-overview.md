---
read_when:
    - 온보딩 경로 선택
    - 새 환경 설정
sidebarTitle: Onboarding Overview
summary: OpenClaw 온보딩 옵션 및 흐름 개요
title: 온보딩 개요
x-i18n:
    generated_at: "2026-05-10T19:51:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9b375b9090250992b9deead25ae6502592cb63c9774204782b2d4f69d8f3395
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw에는 두 가지 온보딩 경로가 있습니다. 둘 다 인증, Gateway, 선택적 채팅 채널을 구성하며, 설정과 상호작용하는 방식만 다릅니다.

## 어떤 경로를 사용해야 하나요?

|                | CLI 온보딩                            | macOS 앱 온보딩        |
| -------------- | ------------------------------------- | ---------------------- |
| **플랫폼**     | macOS, Linux, Windows(네이티브 또는 WSL2) | macOS 전용             |
| **인터페이스** | 터미널 마법사                         | 앱의 안내식 UI         |
| **적합한 용도** | 서버, 헤드리스, 완전한 제어           | 데스크톱 Mac, 시각적 설정 |
| **자동화**     | 스크립트용 `--non-interactive`        | 수동 전용              |
| **명령**       | `openclaw onboard`                    | 앱 실행                |

대부분의 사용자는 **CLI 온보딩**으로 시작하는 것이 좋습니다. 어디서나 동작하고 가장 많은 제어권을 제공합니다.

## 온보딩이 구성하는 항목

어떤 경로를 선택하든 온보딩은 다음을 설정합니다.

1. **모델 제공자 및 인증** — 선택한 제공자의 API 키, OAuth 또는 설정 토큰
2. **작업공간** — 에이전트 파일, 부트스트랩 템플릿, 메모리를 위한 디렉터리
3. **Gateway** — 포트, 바인드 주소, 인증 모드
4. **채널**(선택 사항) — iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp 등 기본 제공 및 번들 채팅 채널
5. **데몬**(선택 사항) — Gateway가 자동으로 시작되도록 하는 백그라운드 서비스

## CLI 온보딩

아무 터미널에서나 실행합니다.

```bash
openclaw onboard
```

한 번에 백그라운드 서비스도 설치하려면 `--install-daemon`을 추가하세요.

전체 참조: [온보딩(CLI)](/ko/start/wizard)
CLI 명령 문서: [`openclaw onboard`](/ko/cli/onboard)

## macOS 앱 온보딩

OpenClaw 앱을 엽니다. 최초 실행 마법사가 시각적 인터페이스로 동일한 단계를 안내합니다.

전체 참조: [온보딩(macOS 앱)](/ko/start/onboarding)

## 사용자 지정 또는 목록에 없는 제공자

온보딩에 제공자가 나열되어 있지 않으면 **사용자 지정 제공자**를 선택하고 다음을 입력하세요.

- API 호환성 모드(OpenAI 호환, Anthropic 호환 또는 자동 감지)
- 기본 URL 및 API 키
- 모델 ID 및 선택적 별칭

여러 사용자 지정 엔드포인트가 공존할 수 있으며, 각각 고유한 엔드포인트 ID를 갖습니다.

## 관련 항목

- [시작하기](/ko/start/getting-started)
- [CLI 설정 참조](/ko/start/wizard-cli-reference)
