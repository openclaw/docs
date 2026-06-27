---
read_when:
    - OpenClaw 에이전트 런타임 코드 또는 테스트 작업하기
    - agent-runtime 린트, 타입 검사 및 라이브 테스트 흐름 실행
summary: 'OpenClaw 에이전트 런타임을 위한 개발자 워크플로: 빌드, 테스트 및 라이브 검증'
title: OpenClaw 에이전트 런타임 워크플로
x-i18n:
    generated_at: "2026-06-27T17:39:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw에서 OpenClaw 에이전트 런타임을 작업하기 위한 합리적인 워크플로.

## 타입 검사 및 린팅

- 기본 로컬 게이트: `pnpm check`
- 빌드 게이트: 변경 사항이 빌드 출력, 패키징 또는 지연 로딩/모듈 경계에 영향을 줄 수 있을 때 `pnpm build`
- 에이전트 런타임 변경을 위한 전체 랜딩 게이트: `pnpm check && pnpm test`

## 에이전트 런타임 테스트 실행

Vitest로 에이전트 런타임 테스트 세트를 직접 실행합니다.

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

라이브 제공자 실행을 포함하려면:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

이는 주요 에이전트 런타임 단위 테스트 스위트를 포함합니다.

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## 수동 테스트

권장 흐름:

- 개발 모드로 Gateway를 실행합니다.
  - `pnpm gateway:dev`
- 에이전트를 직접 트리거합니다.
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 대화형 디버깅에는 TUI를 사용합니다.
  - `pnpm tui`

도구 호출 동작의 경우, 도구 스트리밍과 페이로드 처리를 볼 수 있도록 `read` 또는 `exec` 작업을 프롬프트하세요.

## 클린 슬레이트 재설정

상태는 OpenClaw 상태 디렉터리 아래에 있습니다. 기본값은 `~/.openclaw`입니다. `OPENCLAW_STATE_DIR`이 설정되어 있으면 대신 해당 디렉터리를 사용하세요.

모든 것을 재설정하려면 다음을 삭제합니다.

- 설정용 `openclaw.json`
- 모델 인증 프로필(API 키 + OAuth)용 `agents/<agentId>/agent/auth-profiles.json`
- 아직 인증 프로필 저장소 외부에 있는 제공자/채널 상태용 `credentials/`
- 에이전트 세션 기록용 `agents/<agentId>/sessions/`
- 세션 인덱스용 `agents/<agentId>/sessions/sessions.json`
- 레거시 경로가 있으면 `sessions/`
- 빈 워크스페이스를 원하면 `workspace/`

세션만 재설정하려면 해당 에이전트의 `agents/<agentId>/sessions/`를 삭제하세요. 인증을 유지하려면 `agents/<agentId>/agent/auth-profiles.json`와 `credentials/` 아래의 모든 제공자 상태를 그대로 두세요.

## 참고 자료

- [테스트](/ko/help/testing)
- [시작하기](/ko/start/getting-started)

## 관련

- [OpenClaw 에이전트 런타임 아키텍처](/ko/agent-runtime-architecture)
