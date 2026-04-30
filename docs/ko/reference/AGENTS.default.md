---
read_when:
    - 새 OpenClaw 에이전트 세션 시작하기
    - 기본 Skills 활성화 또는 감사하기
summary: 개인 비서 설정을 위한 기본 OpenClaw 에이전트 지침 및 Skills 명단
title: 기본 AGENTS.md
x-i18n:
    generated_at: "2026-04-30T06:49:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - OpenClaw 개인 비서(기본값)

## 첫 실행(권장)

OpenClaw는 에이전트 전용 workspace 디렉터리를 사용합니다. 기본값: `~/.openclaw/workspace`(`agents.defaults.workspace`를 통해 구성 가능).

1. workspace를 만듭니다(아직 없는 경우).

```bash
mkdir -p ~/.openclaw/workspace
```

2. 기본 workspace 템플릿을 workspace로 복사합니다.

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 선택 사항: 개인 비서 Skills 목록을 원한다면 AGENTS.md를 이 파일로 교체합니다.

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 선택 사항: `agents.defaults.workspace`를 설정해 다른 workspace를 선택합니다(`~` 지원).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 안전 기본값

- 디렉터리나 비밀 정보를 채팅에 덤프하지 마세요.
- 명시적으로 요청받지 않는 한 파괴적인 명령을 실행하지 마세요.
- 외부 메시징 표면에는 부분/스트리밍 응답을 보내지 마세요(최종 응답만).

## 세션 시작(필수)

- `SOUL.md`, `USER.md`, 그리고 `memory/`의 오늘+어제 항목을 읽습니다.
- 있으면 `MEMORY.md`를 읽습니다.
- 응답하기 전에 수행합니다.

## Soul(필수)

- `SOUL.md`는 정체성, 어조, 경계를 정의합니다. 최신 상태로 유지하세요.
- `SOUL.md`를 변경하면 사용자에게 알리세요.
- 각 세션은 새 인스턴스입니다. 연속성은 이 파일들에 저장됩니다.

## 공유 공간(권장)

- 당신은 사용자의 목소리가 아닙니다. 그룹 채팅이나 공개 채널에서는 주의하세요.
- 개인 데이터, 연락처 정보, 내부 메모를 공유하지 마세요.

## 메모리 시스템(권장)

- 일일 로그: `memory/YYYY-MM-DD.md`(필요하면 `memory/` 생성).
- 장기 메모리: 지속적인 사실, 선호, 결정을 위한 `MEMORY.md`.
- 소문자 `memory.md`는 레거시 복구 입력 전용입니다. 의도적으로 두 루트 파일을 모두 유지하지 마세요.
- 세션 시작 시 오늘 + 어제 + 있으면 `MEMORY.md`를 읽습니다.
- 기록: 결정, 선호, 제약, 열린 작업.
- 명시적으로 요청받지 않는 한 비밀 정보는 피하세요.

## 도구 및 Skills

- 도구는 Skills 안에 있습니다. 필요할 때 각 Skills의 `SKILL.md`를 따르세요.
- 환경별 메모는 `TOOLS.md`에 보관하세요(Skills용 메모).

## 백업 팁(권장)

이 workspace를 Clawd의 “메모리”로 취급한다면 `AGENTS.md`와 메모리 파일이 백업되도록 git repo(가능하면 비공개)로 만드세요.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw가 하는 일

- WhatsApp Gateway + Pi 코딩 에이전트를 실행해 비서가 채팅을 읽고/쓰고, 컨텍스트를 가져오며, 호스트 Mac을 통해 Skills를 실행할 수 있게 합니다.
- macOS 앱은 권한(화면 녹화, 알림, 마이크)을 관리하고 번들 바이너리를 통해 `openclaw` CLI를 노출합니다.
- 직접 채팅은 기본적으로 에이전트의 `main` 세션으로 합쳐집니다. 그룹은 `agent:<agentId>:<channel>:group:<id>`로 격리됩니다(방/채널: `agent:<agentId>:<channel>:channel:<id>`). Heartbeat는 백그라운드 작업을 계속 살아 있게 합니다.

## 핵심 Skills(설정 → Skills에서 활성화)

- **mcporter** — 외부 Skills 백엔드를 관리하기 위한 도구 서버 런타임/CLI.
- **Peekaboo** — 선택적 AI 비전 분석을 지원하는 빠른 macOS 스크린샷.
- **camsnap** — RTSP/ONVIF 보안 카메라에서 프레임, 클립 또는 동작 알림 캡처.
- **oracle** — 세션 재생과 브라우저 제어를 지원하는 OpenAI-ready 에이전트 CLI.
- **eightctl** — 터미널에서 수면을 제어합니다.
- **imsg** — iMessage 및 SMS 보내기, 읽기, 스트리밍.
- **wacli** — WhatsApp CLI: 동기화, 검색, 보내기.
- **discord** — Discord 작업: 반응, 스티커, 투표. `user:<id>` 또는 `channel:<id>` 대상을 사용하세요(숫자 ID만 쓰면 모호합니다).
- **gog** — Google Suite CLI: Gmail, Calendar, Drive, Contacts.
- **spotify-player** — 재생을 검색/대기열 추가/제어하는 터미널 Spotify 클라이언트.
- **sag** — mac 스타일 say UX를 제공하는 ElevenLabs 음성. 기본적으로 스피커로 스트리밍합니다.
- **Sonos CLI** — 스크립트에서 Sonos 스피커(검색/상태/재생/볼륨/그룹화)를 제어합니다.
- **blucli** — 스크립트에서 BluOS 플레이어를 재생, 그룹화, 자동화합니다.
- **OpenHue CLI** — 장면과 자동화를 위한 Philips Hue 조명 제어.
- **OpenAI Whisper** — 빠른 받아쓰기와 음성메일 전사를 위한 로컬 음성-텍스트 변환.
- **Gemini CLI** — 빠른 Q&A를 위해 터미널에서 Google Gemini 모델 사용.
- **agent-tools** — 자동화와 헬퍼 스크립트를 위한 유틸리티 도구 키트.

## 사용 참고 사항

- 스크립팅에는 `openclaw` CLI를 선호하세요. Mac 앱이 권한을 처리합니다.
- 설치는 Skills 탭에서 실행하세요. 바이너리가 이미 있으면 버튼을 숨깁니다.
- 비서가 미리 알림을 예약하고, 받은 편지함을 모니터링하며, 카메라 캡처를 트리거할 수 있도록 Heartbeat를 활성화한 상태로 유지하세요.
- Canvas UI는 네이티브 오버레이와 함께 전체 화면으로 실행됩니다. 중요한 컨트롤을 왼쪽 상단/오른쪽 상단/하단 가장자리에 배치하지 마세요. 레이아웃에 명시적인 여백을 추가하고 safe-area inset에 의존하지 마세요.
- 브라우저 기반 검증에는 OpenClaw가 관리하는 Chrome 프로필과 함께 `openclaw browser`(탭/상태/스크린샷)를 사용하세요.
- DOM 검사에는 `openclaw browser eval|query|dom|snapshot`을 사용하세요(머신 출력이 필요할 때는 `--json`/`--out` 사용).
- 상호작용에는 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`을 사용하세요(click/type에는 snapshot ref가 필요합니다. CSS 선택자에는 `evaluate` 사용).

## 관련 항목

- [에이전트 workspace](/ko/concepts/agent-workspace)
- [에이전트 런타임](/ko/concepts/agent)
