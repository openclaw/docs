---
read_when:
    - OpenClaw 에이전트 런타임 코드 또는 테스트 작업하기
    - 에이전트 런타임 린트, 타입 검사 및 라이브 테스트 흐름 실행하기
summary: 'OpenClaw 에이전트 런타임 개발자 워크플로: 빌드, 테스트 및 라이브 검증'
title: OpenClaw 에이전트 런타임 워크플로우
x-i18n:
    generated_at: "2026-07-12T15:24:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw 저장소의 에이전트 런타임(`src/agents/`)을 위한 개발자 워크플로입니다.

## 타입 검사 및 린팅

- 기본 로컬 게이트: `pnpm check`(타입 검사, 린팅, 정책 가드)
- 빌드 게이트: 변경 사항이 빌드 출력, 패키징 또는 지연 로딩/모듈 경계에 영향을 줄 수 있는 경우 `pnpm build`
- 전체 푸시 전 게이트: `pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## 에이전트 런타임 테스트 실행

에이전트 런타임 단위 테스트 스위트를 실행합니다.

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

첫 번째 glob에는 `agent-tools*`, `agent-settings`,
`agent-tool-definition-adapter*` 스위트도 포함됩니다.

라이브 테스트는 단위 테스트 구성에서 제외됩니다. 라이브
래퍼를 통해 실행하십시오(`OPENCLAW_LIVE_TEST=1`을 설정하며 공급자 자격 증명이 필요합니다).

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## 수동 테스트

- 개발 모드에서 Gateway를 실행합니다(`OPENCLAW_SKIP_CHANNELS=1`을 통해 채널 연결을 건너뜁니다): `pnpm gateway:dev`
- Gateway를 통해 에이전트 턴 하나를 트리거합니다: `pnpm openclaw agent --message "Hello" --thinking low`
- 대화형 디버깅에는 TUI를 사용합니다: `pnpm tui`

도구 호출 동작을 확인하려면 도구 스트리밍 및 페이로드 처리를 관찰할 수 있도록
`read` 또는 `exec` 작업을 요청하는 프롬프트를 입력하십시오.

## 초기 상태로 재설정

상태는 기본적으로 OpenClaw 상태 디렉터리인 `~/.openclaw`에 저장되며,
`$OPENCLAW_STATE_DIR`이 설정된 경우 해당 디렉터리에 저장됩니다. 다음 경로는 해당 디렉터리를 기준으로 합니다.

| 경로                                           | 저장 내용                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | 구성                                                             |
| `state/openclaw.sqlite`                        | 공유 런타임 상태 데이터베이스                                      |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | 에이전트별 모델 인증 프로필(API 키 + OAuth) 및 런타임 상태 |
| `credentials/`                                 | 인증 프로필 저장소 외부의 공급자/채널 자격 증명        |
| `agents/<agentId>/sessions/`                   | 대화 기록 및 레거시 세션 마이그레이션 소스            |
| `sessions/`                                    | 레거시 단일 에이전트 세션 저장소(이전 설치에만 해당)              |
| `workspace/`                                   | 기본 에이전트 작업 공간(추가 에이전트는 `workspace-<agentId>` 사용)   |

완전히 재설정하려면 해당 경로를 삭제하십시오. 범위를 좁혀 재설정하려면 다음과 같이 하십시오.

- 세션만: `agents/<agentId>/agent/openclaw-agent.sqlite`를 삭제하지 마십시오. 세션 행은 에이전트별 다른 상태와 함께 여기에 저장됩니다. 한 채팅에서 새 세션을 시작하려면 `/new` 또는 `/reset`을 사용하고, 세션 유지 관리에는 `openclaw sessions cleanup`을 사용하십시오.
- 인증 유지: `agents/<agentId>/agent/openclaw-agent.sqlite`와 `credentials/`를 그대로 두십시오.

레거시 `auth-profiles.json` 파일은 더 이상 런타임에서 읽지 않습니다.
`openclaw doctor --fix`는 해당 파일을 SQLite 저장소로 가져옵니다.

## 참고 자료

- [테스트](/ko/help/testing)
- [시작하기](/ko/start/getting-started)

## 관련 문서

- [OpenClaw 에이전트 런타임 아키텍처](/ko/agent-runtime-architecture)
