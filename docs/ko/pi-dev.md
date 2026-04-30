---
read_when:
    - Pi 통합 코드 또는 테스트 작업
    - Pi 전용 린트, 타입 검사 및 라이브 테스트 흐름 실행
summary: 'Pi 통합을 위한 개발자 워크플로: 빌드, 테스트 및 라이브 검증'
title: Pi 개발 워크플로
x-i18n:
    generated_at: "2026-04-30T06:39:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 16
---

OpenClaw에서 Pi 통합 작업을 하기 위한 합리적인 워크플로.

## 타입 검사 및 린팅

- 기본 로컬 게이트: `pnpm check`
- 빌드 게이트: 변경 사항이 빌드 출력, 패키징 또는 지연 로딩/모듈 경계에 영향을 줄 수 있을 때 `pnpm build`
- Pi 관련 변경이 많은 경우 전체 랜딩 게이트: `pnpm check && pnpm test`

## Pi 테스트 실행

Pi 중심 테스트 세트를 Vitest로 직접 실행합니다.

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

라이브 프로바이더 실행을 포함하려면:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

이는 주요 Pi 단위 테스트 스위트를 포함합니다.

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## 수동 테스트

권장 흐름:

- Gateway를 개발 모드로 실행합니다.
  - `pnpm gateway:dev`
- 에이전트를 직접 트리거합니다.
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 대화형 디버깅에는 TUI를 사용합니다.
  - `pnpm tui`

도구 호출 동작의 경우 `read` 또는 `exec` 작업을 요청해 도구 스트리밍과 페이로드 처리를 확인할 수 있습니다.

## 깨끗한 상태로 초기화

상태는 OpenClaw 상태 디렉터리 아래에 저장됩니다. 기본값은 `~/.openclaw`입니다. `OPENCLAW_STATE_DIR`이 설정되어 있으면 대신 해당 디렉터리를 사용합니다.

모든 것을 초기화하려면:

- 설정용 `openclaw.json`
- 모델 인증 프로필(API 키 + OAuth)용 `agents/<agentId>/agent/auth-profiles.json`
- 인증 프로필 저장소 외부에 아직 남아 있는 프로바이더/채널 상태용 `credentials/`
- 에이전트 세션 기록용 `agents/<agentId>/sessions/`
- 세션 인덱스용 `agents/<agentId>/sessions/sessions.json`
- 레거시 경로가 있으면 `sessions/`
- 빈 워크스페이스를 원하면 `workspace/`

세션만 초기화하려면 해당 에이전트의 `agents/<agentId>/sessions/`를 삭제합니다. 인증을 유지하려면 `agents/<agentId>/agent/auth-profiles.json`과 `credentials/` 아래의 프로바이더 상태를 그대로 둡니다.

## 참고 자료

- [테스트](/ko/help/testing)
- [시작하기](/ko/start/getting-started)

## 관련 항목

- [Pi 통합 아키텍처](/ko/pi)
