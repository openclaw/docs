---
read_when:
    - 새 OpenClaw 에이전트 세션 시작하기
    - 기본 Skills 활성화 또는 감사
summary: 개인 비서 설정을 위한 기본 OpenClaw 에이전트 지침 및 Skills 목록
title: 기본 AGENTS.md
x-i18n:
    generated_at: "2026-07-12T15:42:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## 첫 실행(권장)

OpenClaw 에이전트는 작업 공간 디렉터리를 사용합니다. 기본값은 `~/.openclaw/workspace`입니다(`agents.defaults.workspace`에서 구성할 수 있으며 `~`를 지원합니다).

1. 작업 공간을 생성합니다.

```bash
mkdir -p ~/.openclaw/workspace
```

2. 기본 작업 공간 템플릿을 이 디렉터리로 복사합니다.

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 선택 사항: 일반 템플릿 대신 이 파일의 개인 비서 스킬 목록을 사용합니다.

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 선택 사항: 다른 작업 공간을 지정합니다.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 기본 안전 수칙

- 디렉터리 내용이나 비밀 정보를 채팅에 그대로 노출하지 마십시오.
- 명시적으로 요청받지 않는 한 파괴적인 명령을 실행하지 마십시오.
- 구성이나 스케줄러(crontab, systemd 유닛, nginx 구성, 셸 rc 파일)를 변경하기 전에 먼저 기존 상태를 검사하고, 기본적으로 이를 보존하거나 병합하십시오.
- 외부 메시징 화면에 불완전하거나 스트리밍 중인 답변을 보내지 마십시오(최종 답변만 보내십시오).

## 기존 솔루션 사전 확인

맞춤형 시스템, 기능, 워크플로, 도구, 통합 또는 자동화를 제안하거나 구축하기 전에 이미 충분히 문제를 해결하는 오픈 소스 프로젝트, 유지 관리되는 라이브러리, 기존 OpenClaw 플러그인 또는 무료 플랫폼이 있는지 확인하십시오. 적합한 경우 이를 우선 사용하십시오. 기존 옵션이 부적합하거나, 너무 비싸거나, 유지 관리되지 않거나, 안전하지 않거나, 규정을 준수하지 않거나, 사용자가 맞춤형 구현을 명시적으로 요청한 경우에만 직접 구축하십시오. 사용자가 비용 지출을 명시적으로 승인하지 않는 한 유료 서비스는 추천하지 마십시오. 광범위한 조사 작업이 아니라 간단한 사전 확인 단계로 수행하십시오.

## 세션 시작(필수)

- 응답하기 전에 `SOUL.md`, `USER.md`, 그리고 `memory/`에 있는 오늘 및 어제 파일을 읽으십시오.
- `MEMORY.md`가 있으면 읽으십시오.

## 정체성(필수)

- `SOUL.md`는 정체성, 어조 및 경계를 정의합니다. 최신 상태로 유지하십시오.
- `SOUL.md`를 변경하면 사용자에게 알리십시오.
- 매 세션마다 새로운 인스턴스로 시작하며, 연속성은 이 파일들에 저장됩니다.

## 공유 공간(권장)

- 사용자를 대변하는 존재가 아니므로 그룹 채팅이나 공개 채널에서는 주의하십시오.
- 개인 데이터, 연락처 정보 또는 내부 메모를 공유하지 마십시오.

## 메모리 시스템(권장)

- 일일 로그: `memory/YYYY-MM-DD.md`(필요한 경우 `memory/`를 생성하십시오).
- 장기 메모리: 지속적으로 보존할 사실, 기본 설정 및 결정은 `MEMORY.md`에 기록합니다.
- 소문자 `memory.md`는 레거시 복구 입력으로만 사용합니다. 의도적으로 두 루트 파일을 모두 유지하지 마십시오.
- 세션 시작 시 오늘 파일, 어제 파일 및 존재하는 경우 `MEMORY.md`를 읽으십시오.
- 메모리 파일에 쓰기 전에 먼저 읽으십시오. 구체적인 업데이트만 작성하고 빈 자리표시자는 절대 작성하지 마십시오.
- 기록할 내용: 결정, 기본 설정, 제약 조건, 미해결 작업.
- 명시적으로 요청받지 않는 한 비밀 정보는 기록하지 마십시오.

## 도구 및 스킬

- 도구는 스킬에 포함되어 있습니다. 필요할 때 각 스킬의 `SKILL.md`를 따르십시오.
- 환경별 메모는 `TOOLS.md`에 보관하십시오(스킬 관련 메모).

## 백업 팁(권장)

이 작업 공간을 비서의 메모리로 취급하십시오. `AGENTS.md`와 메모리 파일이 백업되도록 git 저장소로 만드십시오(가급적 비공개).

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# 선택 사항: 비공개 원격 저장소를 추가하고 푸시
```

## OpenClaw의 기능

- 메시징 채널 Gateway(WhatsApp, Telegram, Discord, Signal, iMessage, Slack 등)와 내장 에이전트를 실행하여 비서가 채팅을 읽고 쓰고, 컨텍스트를 가져오며, 호스트 머신을 통해 스킬을 실행할 수 있게 합니다.
- macOS 앱은 권한(화면 기록, 알림, 마이크)을 관리하고 번들 바이너리를 통해 `openclaw` CLI를 제공합니다.
- 기본적으로 다이렉트 채팅은 에이전트의 `main` 세션으로 통합되며, 그룹과 채널/대화방에는 각각 고유한 세션 키가 할당됩니다. 정확한 키 형식은 [채널 라우팅](/ko/channels/channel-routing)을 참조하십시오. Heartbeat는 백그라운드 작업이 계속 실행되도록 유지합니다.

## 핵심 스킬(Settings → Skills에서 활성화)

개인 비서 작업 공간용 목록 예시입니다. 설정에 맞는 스킬로 교체하십시오.

- **mcporter** - 외부 스킬 백엔드를 관리하는 도구 서버 런타임/CLI입니다.
- **Peekaboo** - 선택적 AI 비전 분석을 지원하는 빠른 macOS 스크린샷 도구입니다.
- **camsnap** - RTSP/ONVIF 보안 카메라에서 프레임, 클립 또는 동작 알림을 캡처합니다.
- **oracle** - 세션 재생과 브라우저 제어 기능을 갖춘 OpenAI 지원 에이전트 CLI입니다.
- **eightctl** - 터미널에서 수면을 제어합니다.
- **imsg** - iMessage 및 SMS를 전송하고 읽고 스트리밍합니다.
- **wacli** - WhatsApp CLI로 동기화, 검색 및 전송 기능을 제공합니다.
- **discord** - 반응, 스티커, 설문 조사 등의 Discord 작업을 수행합니다. `user:<id>` 또는 `channel:<id>` 대상을 사용하십시오(숫자로만 된 ID는 모호합니다).
- **gog** - Gmail, Calendar, Drive, Contacts용 Google Suite CLI입니다.
- **spotify-player** - 재생 항목을 검색하고 대기열에 추가하며 제어하는 터미널용 Spotify 클라이언트입니다.
- **sag** - macOS의 say와 유사한 UX를 제공하는 ElevenLabs 음성 도구입니다. 기본적으로 스피커로 스트리밍합니다.
- **Sonos CLI** - 스크립트에서 Sonos 스피커를 제어합니다(검색/상태/재생/볼륨/그룹화).
- **blucli** - 스크립트에서 BluOS 플레이어를 재생하고 그룹화하며 자동화합니다.
- **OpenHue CLI** - 장면 및 자동화를 위한 Philips Hue 조명 제어 도구입니다.
- **OpenAI Whisper** - 빠른 받아쓰기와 음성 메시지 전사를 위한 로컬 음성 텍스트 변환 도구입니다.
- **Gemini CLI** - 빠른 질의응답을 위해 터미널에서 Google Gemini 모델을 사용합니다.
- **agent-tools** - 자동화 및 도우미 스크립트용 유틸리티 도구 모음입니다.

## 사용 참고 사항

- 스크립팅에는 `openclaw` CLI를 우선 사용하십시오. 데스크톱 앱은 권한을 처리합니다.
- Skills 탭에서 설치를 실행하십시오. 필수 바이너리가 이미 있으면 설치 버튼이 숨겨집니다.
- 비서가 알림을 예약하고, 받은 편지함을 모니터링하며, 카메라 캡처를 트리거할 수 있도록 Heartbeat를 활성화해 두십시오.
- Canvas UI는 네이티브 오버레이와 함께 전체 화면으로 실행됩니다. 중요한 컨트롤을 왼쪽 위, 오른쪽 위 또는 아래쪽 가장자리에 배치하지 마십시오. safe-area inset에 의존하지 말고 명시적인 레이아웃 여백을 추가하십시오.
- 브라우저 기반 검증에는 OpenClaw에서 관리하는 Chrome/Brave/Edge/Chromium 프로필과 함께 `openclaw browser` CLI(번들 `browser` 플러그인)를 사용하십시오.
- 관리: `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- 검사: `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- 작업: `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. 작업에는 `snapshot`에서 얻은 `ref`가 필요합니다(CSS 선택자는 작업에 사용할 수 없습니다). `document.querySelector` 스타일의 대상 지정이 필요하면 `evaluate`를 사용하십시오.
- 모든 검사 명령에 `--json`을 추가하면 기계 판독 가능한 출력이 생성됩니다.

## 관련 문서

- [에이전트 작업 공간](/ko/concepts/agent-workspace)
- [에이전트 런타임](/ko/concepts/agent)
- [채널 라우팅](/ko/channels/channel-routing)
