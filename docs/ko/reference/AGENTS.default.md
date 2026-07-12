---
read_when:
    - 새 OpenClaw 에이전트 세션 시작하기
    - 기본 Skills 활성화 또는 감사
summary: 개인 비서 설정을 위한 기본 OpenClaw 에이전트 지침 및 Skills 목록
title: 기본 AGENTS.md
x-i18n:
    generated_at: "2026-07-12T01:10:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## 첫 실행(권장)

OpenClaw 에이전트는 작업 공간 디렉터리를 사용합니다. 기본값: `~/.openclaw/workspace` (`agents.defaults.workspace`를 통해 구성할 수 있으며 `~`를 지원합니다).

1. 작업 공간을 생성합니다.

```bash
mkdir -p ~/.openclaw/workspace
```

2. 기본 작업 공간 템플릿을 이 디렉터리에 복사합니다.

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 선택 사항: 일반 템플릿 대신 이 파일의 개인 비서 Skills 목록을 사용합니다.

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 선택 사항: 다른 작업 공간을 지정합니다.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 기본 안전 설정

- 디렉터리 내용이나 비밀 정보를 채팅에 쏟아내지 마세요.
- 명시적으로 요청받지 않는 한 파괴적인 명령을 실행하지 마세요.
- 구성이나 스케줄러(crontab, systemd 유닛, nginx 구성, 셸 rc 파일)를 변경하기 전에 먼저 기존 상태를 확인하고, 기본적으로 보존하거나 병합하세요.
- 외부 메시징 인터페이스에 부분적이거나 스트리밍 방식의 답변을 보내지 마세요(최종 답변만 전송).

## 기존 솔루션 사전 점검

맞춤형 시스템, 기능, 워크플로, 도구, 통합 또는 자동화를 제안하거나 구축하기 전에 이미 충분히 문제를 해결하는 오픈 소스 프로젝트, 유지 관리되는 라이브러리, 기존 OpenClaw Plugin 또는 무료 플랫폼이 있는지 확인하세요. 적합한 경우 이를 우선 사용하세요. 기존 옵션이 부적합하거나, 너무 비싸거나, 유지 관리되지 않거나, 안전하지 않거나, 규정을 준수하지 못하거나, 사용자가 맞춤형 구축을 명시적으로 요청한 경우에만 직접 구축하세요. 사용자가 비용 지출을 명시적으로 승인하지 않는 한 유료 서비스는 추천하지 마세요. 이를 연구 과제가 아닌 가벼운 사전 점검 단계로 유지하세요.

## 세션 시작(필수)

- 응답하기 전에 `SOUL.md`, `USER.md`, 그리고 `memory/`의 오늘 및 어제 파일을 읽으세요.
- `MEMORY.md`가 있으면 읽으세요.

## 정체성(필수)

- `SOUL.md`는 정체성, 어조, 경계를 정의합니다. 최신 상태로 유지하세요.
- `SOUL.md`를 변경하면 사용자에게 알리세요.
- 각 세션마다 새로운 인스턴스로 시작하며, 연속성은 이 파일들에 저장됩니다.

## 공유 공간(권장)

- 사용자의 대변인이 아니므로 그룹 채팅이나 공개 채널에서는 신중하게 행동하세요.
- 개인 데이터, 연락처 정보 또는 내부 메모를 공유하지 마세요.

## 메모리 시스템(권장)

- 일일 로그: `memory/YYYY-MM-DD.md`(필요한 경우 `memory/` 생성).
- 장기 메모리: 지속적으로 보존할 사실, 선호 사항 및 결정은 `MEMORY.md`에 기록합니다.
- 소문자 `memory.md`는 레거시 복구 입력 전용입니다. 루트 파일 두 개를 의도적으로 함께 유지하지 마세요.
- 세션 시작 시 오늘 + 어제 + `MEMORY.md`가 있으면 읽으세요.
- 메모리 파일에 쓰기 전에 먼저 읽으세요. 구체적인 업데이트만 작성하고 빈 자리표시자는 절대 작성하지 마세요.
- 기록 대상: 결정, 선호 사항, 제약 조건, 미해결 작업.
- 명시적으로 요청받지 않는 한 비밀 정보는 기록하지 마세요.

## 도구와 Skills

- 도구는 Skills에 포함되어 있습니다. 필요할 때 각 Skills의 `SKILL.md`를 따르세요.
- 환경별 메모는 `TOOLS.md`에 보관하세요(Skills용 메모).

## 백업 팁(권장)

이 작업 공간을 비서의 메모리로 취급하세요. `AGENTS.md`와 메모리 파일이 백업되도록 git 저장소로 만드세요(가급적 비공개).

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# 선택 사항: 비공개 원격 저장소 추가 + 푸시
```

## OpenClaw의 기능

- 메시징 채널 Gateway(WhatsApp, Telegram, Discord, Signal, iMessage, Slack 등)와 내장 에이전트를 실행하여, 비서가 채팅을 읽고 쓰며 컨텍스트를 가져오고 호스트 시스템을 통해 Skills를 실행할 수 있게 합니다.
- macOS 앱은 권한(화면 기록, 알림, 마이크)을 관리하고 번들 바이너리를 통해 `openclaw` CLI를 제공합니다.
- 기본적으로 직접 채팅은 에이전트의 `main` 세션으로 통합되고, 그룹과 채널/대화방에는 각각 별도의 세션 키가 부여됩니다. 정확한 키 형식은 [채널 라우팅](/ko/channels/channel-routing)을 참조하세요. Heartbeat는 백그라운드 작업이 계속 실행되도록 유지합니다.

## 핵심 Skills(Settings → Skills에서 활성화)

개인 비서 작업 공간을 위한 예시 목록입니다. 설정에 맞는 Skills로 교체하세요.

- **mcporter** - 외부 Skills 백엔드를 관리하기 위한 도구 서버 런타임/CLI.
- **Peekaboo** - 선택적 AI 비전 분석을 지원하는 빠른 macOS 스크린샷 도구.
- **camsnap** - RTSP/ONVIF 보안 카메라에서 프레임, 클립 또는 움직임 알림을 캡처.
- **oracle** - 세션 재생과 브라우저 제어 기능을 갖춘 OpenAI 지원 에이전트 CLI.
- **eightctl** - 터미널에서 수면을 제어.
- **imsg** - iMessage 및 SMS를 전송하고 읽고 스트리밍.
- **wacli** - WhatsApp CLI: 동기화, 검색, 전송.
- **discord** - Discord 작업: 반응, 스티커, 투표. `user:<id>` 또는 `channel:<id>` 대상을 사용하세요(숫자 ID만 사용하면 모호함).
- **gog** - Google Suite CLI: Gmail, Calendar, Drive, Contacts.
- **spotify-player** - 재생 항목을 검색하고 대기열에 추가하며 재생을 제어하는 터미널 Spotify 클라이언트.
- **sag** - macOS 스타일의 말하기 사용자 경험을 제공하는 ElevenLabs 음성 도구. 기본적으로 스피커로 스트리밍.
- **Sonos CLI** - 스크립트에서 Sonos 스피커를 제어(검색/상태/재생/볼륨/그룹화).
- **blucli** - 스크립트에서 BluOS 플레이어를 재생, 그룹화 및 자동화.
- **OpenHue CLI** - 장면과 자동화를 위한 Philips Hue 조명 제어.
- **OpenAI Whisper** - 빠른 받아쓰기와 음성 메시지 기록을 위한 로컬 음성-텍스트 변환.
- **Gemini CLI** - 빠른 질의응답을 위해 터미널에서 Google Gemini 모델을 사용.
- **agent-tools** - 자동화 및 도우미 스크립트용 유틸리티 도구 모음.

## 사용 참고 사항

- 스크립팅에는 `openclaw` CLI를 우선 사용하세요. 데스크톱 앱은 권한을 처리합니다.
- Skills 탭에서 설치를 실행하세요. 필수 바이너리가 이미 있으면 설치 버튼이 숨겨집니다.
- 비서가 알림을 예약하고, 받은 편지함을 모니터링하고, 카메라 캡처를 실행할 수 있도록 Heartbeat를 활성화 상태로 유지하세요.
- Canvas UI는 네이티브 오버레이와 함께 전체 화면으로 실행됩니다. 중요한 컨트롤을 왼쪽 위, 오른쪽 위 또는 아래쪽 가장자리에 배치하지 마세요. 안전 영역 인셋에 의존하지 말고 명시적인 레이아웃 여백을 추가하세요.
- 브라우저 기반 검증에는 OpenClaw가 관리하는 Chrome/Brave/Edge/Chromium 프로필과 함께 `openclaw browser` CLI(번들 `browser` Plugin)를 사용하세요.
- 관리: `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- 검사: `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- 실행: `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. 작업에는 `snapshot`에서 얻은 `ref`가 필요합니다(CSS 선택자는 작업에 사용할 수 없음). `document.querySelector` 방식의 대상 지정이 필요하면 `evaluate`를 사용하세요.
- 모든 검사 명령에 `--json`을 추가하면 기계 판독 가능한 출력을 얻을 수 있습니다.

## 관련 문서

- [에이전트 작업 공간](/ko/concepts/agent-workspace)
- [에이전트 런타임](/ko/concepts/agent)
- [채널 라우팅](/ko/channels/channel-routing)
