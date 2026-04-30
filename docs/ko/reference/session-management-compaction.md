---
read_when:
    - 세션 ID, 대화 기록 JSONL 또는 sessions.json 필드를 디버그해야 합니다
    - 자동 Compaction 동작을 변경하거나 “사전 Compaction” 정리 작업을 추가하고 있습니다
    - 메모리 플러시나 무음 시스템 턴을 구현하려는 경우
summary: '심층 분석: 세션 저장소 + 대화 기록, 수명 주기 및 (자동)Compaction 내부 구조'
title: 세션 관리 심층 분석
x-i18n:
    generated_at: "2026-04-30T06:50:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw는 다음 영역 전반에서 세션을 종단 간으로 관리합니다.

- **세션 라우팅**(인바운드 메시지가 `sessionKey`에 매핑되는 방식)
- **세션 저장소**(`sessions.json`)와 추적 항목
- **트랜스크립트 지속성**(`*.jsonl`)과 구조
- **트랜스크립트 정리**(실행 전 제공자별 수정)
- **컨텍스트 제한**(컨텍스트 창과 추적 토큰)
- **Compaction**(수동 및 자동 Compaction)과 Compaction 전 작업을 연결할 위치
- **무음 하우스키핑**(사용자에게 표시되는 출력을 생성해서는 안 되는 메모리 쓰기)

먼저 더 상위 수준의 개요를 보고 싶다면 다음부터 시작하세요.

- [세션 관리](/ko/concepts/session)
- [Compaction](/ko/concepts/compaction)
- [메모리 개요](/ko/concepts/memory)
- [메모리 검색](/ko/concepts/memory-search)
- [세션 정리](/ko/concepts/session-pruning)
- [트랜스크립트 정리](/ko/reference/transcript-hygiene)

---

## 진실의 원천: Gateway

OpenClaw는 세션 상태를 소유하는 단일 **Gateway 프로세스**를 중심으로 설계되었습니다.

- UI(macOS 앱, 웹 Control UI, TUI)는 Gateway에 세션 목록과 토큰 수를 조회해야 합니다.
- 원격 모드에서는 세션 파일이 원격 호스트에 있습니다. “로컬 Mac 파일 확인”은 Gateway가 사용하는 내용을 반영하지 않습니다.

---

## 두 가지 지속성 계층

OpenClaw는 세션을 두 계층에 지속 저장합니다.

1. **세션 저장소(`sessions.json`)**
   - 키/값 맵: `sessionKey -> SessionEntry`
   - 작고, 변경 가능하며, 편집(또는 항목 삭제)해도 안전함
   - 세션 메타데이터(현재 세션 ID, 마지막 활동, 토글, 토큰 카운터 등)를 추적함

2. **트랜스크립트(`<sessionId>.jsonl`)**
   - 트리 구조를 가진 추가 전용 트랜스크립트(항목에는 `id` + `parentId`가 있음)
   - 실제 대화 + 도구 호출 + Compaction 요약을 저장함
   - 이후 턴의 모델 컨텍스트를 다시 빌드하는 데 사용됨
   - 활성 트랜스크립트가 체크포인트 크기 상한을 초과하면 큰 Compaction 전 디버그 체크포인트를 건너뛰어 두 번째 거대한 `.checkpoint.*.jsonl` 사본을 피합니다.

---

## 디스크상의 위치

Gateway 호스트에서 에이전트별 위치:

- 저장소: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 트랜스크립트: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 주제 세션: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw는 `src/config/sessions.ts`를 통해 이를 확인합니다.

---

## 저장소 유지 관리 및 디스크 제어

세션 지속성에는 `sessions.json`, 트랜스크립트 아티팩트, trajectory 사이드카에 대한 자동 유지 관리 제어(`session.maintenance`)가 있습니다.

- `mode`: `warn`(기본값) 또는 `enforce`
- `pruneAfter`: 오래된 항목의 나이 기준(기본값 `30d`)
- `maxEntries`: `sessions.json`의 항목 상한(기본값 `500`)
- `resetArchiveRetention`: `*.reset.<timestamp>` 트랜스크립트 아카이브의 보존 기간(기본값: `pruneAfter`와 동일, `false`는 정리 비활성화)
- `maxDiskBytes`: 선택적 세션 디렉터리 예산
- `highWaterBytes`: 정리 후 선택적 목표값(기본값은 `maxDiskBytes`의 `80%`)

일반 Gateway 쓰기는 프로덕션 크기 상한에 대해 `maxEntries` 정리를 배치 처리하므로, 다음 high-water 정리가 다시 줄여 쓰기 전까지 저장소가 구성된 상한을 잠시 초과할 수 있습니다. `openclaw sessions cleanup --enforce`는 여전히 구성된 상한을 즉시 적용합니다.

OpenClaw는 더 이상 Gateway 쓰기 중 자동 `sessions.json.bak.*` 순환 백업을 생성하지 않습니다. 레거시 `session.maintenance.rotateBytes` 키는 무시되며, `openclaw doctor --fix`는 오래된 설정에서 이를 제거합니다.

디스크 예산 정리의 강제 적용 순서(`mode: "enforce"`):

1. 가장 오래된 아카이브, 고아 트랜스크립트 또는 고아 trajectory 아티팩트를 먼저 제거합니다.
2. 그래도 목표값을 초과하면 가장 오래된 세션 항목과 해당 트랜스크립트/trajectory 파일을 제거합니다.
3. 사용량이 `highWaterBytes` 이하가 될 때까지 계속합니다.

`mode: "warn"`에서는 OpenClaw가 잠재적 제거 항목을 보고하지만 저장소/파일을 변경하지 않습니다.

필요할 때 유지 관리를 실행하세요.

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 세션 및 실행 로그

격리된 Cron 실행도 세션 항목/트랜스크립트를 생성하며, 전용 보존 제어가 있습니다.

- `cron.sessionRetention`(기본값 `24h`)은 세션 저장소에서 오래된 격리 Cron 실행 세션을 정리합니다(`false`는 비활성화).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl` 파일을 정리합니다(기본값: `2_000_000`바이트 및 `2000`줄).

Cron이 새 격리 실행 세션을 강제로 생성할 때, 새 행을 쓰기 전에 이전 `cron:<jobId>` 세션 항목을 정리합니다. thinking/fast/verbose 설정, 레이블, 사용자가 명시적으로 선택한 모델/인증 재정의 같은 안전한 기본 설정은 유지합니다. 채널/그룹 라우팅, 전송 또는 큐 정책, 권한 상승, 원점, ACP 런타임 바인딩 같은 주변 대화 컨텍스트는 제거하여 새 격리 실행이 오래된 실행의 낡은 전달 또는 런타임 권한을 상속하지 못하게 합니다.

---

## 세션 키(`sessionKey`)

`sessionKey`는 사용자가 속한 _대화 버킷_(라우팅 + 격리)을 식별합니다.

일반적인 패턴:

- 기본/직접 채팅(에이전트별): `agent:<agentId>:<mainKey>`(기본값 `main`)
- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 방/채널(Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` 또는 `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`(재정의하지 않은 경우)

정식 규칙은 [/concepts/session](/ko/concepts/session)에 문서화되어 있습니다.

---

## 세션 ID(`sessionId`)

각 `sessionKey`는 현재 `sessionId`(대화를 이어 가는 트랜스크립트 파일)를 가리킵니다.

경험적 규칙:

- **재설정**(`/new`, `/reset`)은 해당 `sessionKey`에 대한 새 `sessionId`를 생성합니다.
- **일일 재설정**(기본값: Gateway 호스트의 현지 시간 오전 4:00)은 재설정 경계 이후 다음 메시지에서 새 `sessionId`를 생성합니다.
- **유휴 만료**(`session.reset.idleMinutes` 또는 레거시 `session.idleMinutes`)는 유휴 창 이후 메시지가 도착하면 새 `sessionId`를 생성합니다. 일일 재설정과 유휴 만료가 모두 구성된 경우 먼저 만료되는 쪽이 우선합니다.
- **시스템 이벤트**(Heartbeat, Cron 깨우기, exec 알림, Gateway 장부 작업)는 세션 행을 변경할 수 있지만 일일/유휴 재설정 신선도를 연장하지 않습니다. 재설정 롤오버는 새 프롬프트를 빌드하기 전에 이전 세션에 대해 대기 중이던 시스템 이벤트 알림을 폐기합니다.
- **스레드 부모 포크 가드**(`session.parentForkMaxTokens`, 기본값 `100000`)는 부모 세션이 이미 너무 클 때 부모 트랜스크립트 포크를 건너뜁니다. 새 스레드는 새로 시작합니다. 비활성화하려면 `0`으로 설정하세요.

구현 세부 정보: 이 결정은 `src/auto-reply/reply/session.ts`의 `initSessionState()`에서 이루어집니다.

---

## 세션 저장소 스키마(`sessions.json`)

저장소의 값 타입은 `src/config/sessions.ts`의 `SessionEntry`입니다.

주요 필드(전체 목록 아님):

- `sessionId`: 현재 트랜스크립트 ID(`sessionFile`이 설정되지 않은 한 파일명은 여기서 파생됨)
- `sessionStartedAt`: 현재 `sessionId`의 시작 타임스탬프입니다. 일일 재설정 신선도는 이를 사용합니다. 레거시 행은 JSONL 세션 헤더에서 이를 파생할 수 있습니다.
- `lastInteractionAt`: 마지막 실제 사용자/채널 상호작용 타임스탬프입니다. 유휴 재설정 신선도는 이를 사용하므로 Heartbeat, Cron, exec 이벤트가 세션을 계속 살아 있게 만들지 않습니다. 이 필드가 없는 레거시 행은 복구된 세션 시작 시간을 유휴 신선도에 대한 대체값으로 사용합니다.
- `updatedAt`: 마지막 저장소 행 변경 타임스탬프로, 목록 표시, 정리, 장부 작업에 사용됩니다. 일일/유휴 재설정 신선도의 권위자는 아닙니다.
- `sessionFile`: 선택적 명시 트랜스크립트 경로 재정의
- `chatType`: `direct | group | room`(UI와 전송 정책에 도움)
- `provider`, `subject`, `room`, `space`, `displayName`: 그룹/채널 레이블링을 위한 메타데이터
- 토글:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`(세션별 재정의)
- 모델 선택:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- 토큰 카운터(최선 노력 / 제공자 의존):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: 이 세션 키에 대해 자동 Compaction이 완료된 횟수
- `memoryFlushAt`: 마지막 Compaction 전 메모리 플러시의 타임스탬프
- `memoryFlushCompactionCount`: 마지막 플러시가 실행되었을 때의 Compaction 횟수

저장소는 편집해도 안전하지만 Gateway가 권위자입니다. 세션이 실행되면 항목을 다시 쓰거나 재수화할 수 있습니다.

---

## 트랜스크립트 구조(`*.jsonl`)

트랜스크립트는 `@mariozechner/pi-coding-agent`의 `SessionManager`가 관리합니다.

파일은 JSONL입니다.

- 첫 줄: 세션 헤더(`type: "session"`, `id`, `cwd`, `timestamp`, 선택적 `parentSession` 포함)
- 이후: `id` + `parentId`를 가진 세션 항목(트리)

주목할 만한 항목 타입:

- `message`: 사용자/어시스턴트/toolResult 메시지
- `custom_message`: 모델 컨텍스트에 _들어가는_ 확장 주입 메시지(UI에서는 숨길 수 있음)
- `custom`: 모델 컨텍스트에 들어가지 _않는_ 확장 상태
- `compaction`: `firstKeptEntryId`와 `tokensBefore`를 포함하는 지속 저장된 Compaction 요약
- `branch_summary`: 트리 브랜치를 탐색할 때 지속 저장되는 요약

OpenClaw는 의도적으로 트랜스크립트를 “수정”하지 않습니다. Gateway는 `SessionManager`를 사용해 이를 읽고 씁니다.

---

## 컨텍스트 창과 추적 토큰

중요한 개념은 두 가지입니다.

1. **모델 컨텍스트 창**: 모델별 하드 상한(모델에 보이는 토큰)
2. **세션 저장소 카운터**: `sessions.json`에 쓰이는 롤링 통계(/status와 대시보드에 사용)

제한을 조정하는 경우:

- 컨텍스트 창은 모델 카탈로그에서 가져옵니다(설정으로 재정의 가능).
- 저장소의 `contextTokens`는 런타임 추정/보고 값입니다. 엄격한 보장으로 간주하지 마세요.

자세한 내용은 [/token-use](/ko/reference/token-use)를 참조하세요.

---

## Compaction: 정의

Compaction은 오래된 대화를 트랜스크립트의 지속 저장된 `compaction` 항목으로 요약하고 최근 메시지는 그대로 유지합니다.

Compaction 이후의 향후 턴에는 다음이 표시됩니다.

- Compaction 요약
- `firstKeptEntryId` 이후의 메시지

Compaction은 (세션 정리와 달리) **지속적**입니다. [/concepts/session-pruning](/ko/concepts/session-pruning)을 참조하세요.

## Compaction 청크 경계 및 도구 페어링

OpenClaw가 긴 트랜스크립트를 Compaction 청크로 나눌 때, 어시스턴트 도구 호출을 일치하는 `toolResult` 항목과 함께 유지합니다.

- 토큰 비율 분할이 도구 호출과 그 결과 사이에 걸리면, OpenClaw는 해당 쌍을 분리하는 대신 경계를 어시스턴트 도구 호출 메시지로 이동합니다.
- 뒤따르는 도구 결과 블록이 청크를 목표값보다 초과하게 만들 상황이면, OpenClaw는 보류 중인 해당 도구 블록을 보존하고 요약되지 않은 꼬리 부분을 그대로 유지합니다.
- 중단/오류 도구 호출 블록은 보류 중인 분할을 열린 상태로 유지하지 않습니다.

---

## 자동 Compaction이 발생하는 시점(Pi 런타임)

내장 Pi 에이전트에서 자동 Compaction은 두 경우에 트리거됩니다.

1. **오버플로 복구**: 모델이 컨텍스트 오버플로 오류(`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` 및 유사한 제공자 형태의 변형)를 반환함 → compact → 재시도.
2. **임계값 유지 관리**: 성공적인 턴 이후 다음 조건일 때:

`contextTokens > contextWindow - reserveTokens`

여기서:

- `contextWindow`는 모델의 컨텍스트 창입니다.
- `reserveTokens`는 프롬프트 + 다음 모델 출력을 위해 예약된 여유 공간입니다.

이는 Pi 런타임 의미론입니다(OpenClaw는 이벤트를 소비하지만, 언제 compact할지는 Pi가 결정합니다).

OpenClaw는 `agents.defaults.compaction.maxActiveTranscriptBytes`가 설정되어 있고 활성 트랜스크립트 파일이 해당 크기에 도달하면 다음 실행을 열기 전에 사전 로컬 Compaction을 트리거할 수도 있습니다. 이는 원시 아카이브가 아니라 로컬 재개 비용을 위한 파일 크기 가드입니다. OpenClaw는 여전히 일반적인 의미론적 Compaction을 실행하며, 압축된 요약이 새 후속 트랜스크립트가 될 수 있도록 `truncateAfterCompaction`이 필요합니다.

---

## Compaction 설정(`reserveTokens`, `keepRecentTokens`)

Pi의 Compaction 설정은 Pi 설정에 있습니다:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw는 임베디드 실행에 안전 하한도 적용합니다.

- `compaction.reserveTokens < reserveTokensFloor`이면 OpenClaw가 이를 올립니다.
- 기본 하한은 `20000` 토큰입니다.
- 하한을 비활성화하려면 `agents.defaults.compaction.reserveTokensFloor: 0`을 설정하세요.
- 이미 더 높으면 OpenClaw는 그대로 둡니다.
- 수동 `/compact`는 명시적인 `agents.defaults.compaction.keepRecentTokens`를 존중하고
  Pi의 최근 꼬리 절단 지점을 유지합니다. 명시적인 유지 예산이 없으면
  수동 Compaction은 하드 체크포인트로 유지되며 재구성된 컨텍스트는
  새 요약부터 시작합니다.
- 활성 transcript가 커질 때 턴 전에 로컬 Compaction을 실행하려면
  `agents.defaults.compaction.maxActiveTranscriptBytes`를 바이트 값이나
  `"20mb"` 같은 문자열로 설정하세요. 이 가드는
  `truncateAfterCompaction`도 활성화된 경우에만 작동합니다. 비활성화하려면
  설정하지 않거나 `0`으로 설정하세요.
- `agents.defaults.compaction.truncateAfterCompaction`이 활성화되면
  OpenClaw는 Compaction 후 활성 transcript를 압축된 후속 JSONL로 회전합니다.
  이전 전체 transcript는 제자리에서 다시 쓰이는 대신 보관되며
  Compaction 체크포인트에서 링크됩니다.

이유: Compaction이 불가피해지기 전에 여러 턴의 “관리 작업”(예: memory 쓰기)을 위한 충분한 여유를 남기기 위해서입니다.

구현: `src/agents/pi-settings.ts`의 `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts`에서 호출됨).

---

## 플러그형 Compaction 제공자

Plugin은 Plugin API의 `registerCompactionProvider()`를 통해 Compaction 제공자를 등록할 수 있습니다. `agents.defaults.compaction.provider`가 등록된 제공자 id로 설정되면 safeguard Plugin은 기본 제공 `summarizeInStages` 파이프라인 대신 해당 제공자에 요약을 위임합니다.

- `provider`: 등록된 Compaction 제공자 Plugin의 id입니다. 기본 LLM 요약을 사용하려면 설정하지 마세요.
- `provider`를 설정하면 `mode: "safeguard"`가 강제됩니다.
- 제공자는 기본 경로와 동일한 Compaction 지침 및 식별자 보존 정책을 받습니다.
- safeguard는 제공자 출력 이후에도 최근 턴 및 분할 턴 접미사 컨텍스트를 보존합니다.
- 기본 제공 safeguard 요약은 이전 전체 요약을 그대로 보존하는 대신
  새 메시지와 함께 이전 요약을 다시 정제합니다.
- safeguard 모드는 기본적으로 요약 품질 감사를 활성화합니다. 잘못된 출력에 대한 재시도 동작을 건너뛰려면
  `qualityGuard.enabled: false`를 설정하세요.
- 제공자가 실패하거나 빈 결과를 반환하면 OpenClaw는 자동으로 기본 제공 LLM 요약으로 대체합니다.
- 호출자 취소를 존중하기 위해 중단/타임아웃 신호는 다시 던져집니다(삼키지 않음).

소스: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## 사용자에게 보이는 표면

다음으로 Compaction과 세션 상태를 확인할 수 있습니다.

- `/status`(모든 채팅 세션에서)
- `openclaw status`(CLI)
- `openclaw sessions` / `sessions --json`
- 상세 모드: `🧹 Auto-compaction complete` + Compaction 횟수

---

## 무음 관리 작업(`NO_REPLY`)

OpenClaw는 사용자가 중간 출력을 보지 않아야 하는 백그라운드 작업용 “무음” 턴을 지원합니다.

규칙:

- assistant는 “사용자에게 답장을 전달하지 않음”을 나타내기 위해 정확한 무음 토큰 `NO_REPLY` /
  `no_reply`로 출력을 시작합니다.
- OpenClaw는 전달 계층에서 이를 제거/억제합니다.
- 정확한 무음 토큰 억제는 대소문자를 구분하지 않으므로, 전체 payload가 무음 토큰뿐이면 `NO_REPLY`와
  `no_reply`가 모두 해당됩니다.
- 이는 실제 백그라운드/비전달 턴 전용입니다. 일반적인 실행 가능한 사용자 요청을 위한
  지름길이 아닙니다.

`2026.1.10`부터 OpenClaw는 partial chunk가 `NO_REPLY`로 시작할 때
**초안/타이핑 스트리밍**도 억제하므로, 무음 작업이 턴 중간에 partial
출력을 누출하지 않습니다.

---

## Compaction 전 "memory 플러시"(구현됨)

목표: 자동 Compaction이 발생하기 전에 durable
상태를 디스크(예: agent workspace의 `memory/YYYY-MM-DD.md`)에 쓰는 무음 agentic 턴을 실행하여 Compaction이
중요한 컨텍스트를 지우지 못하게 합니다.

OpenClaw는 **사전 임계값 플러시** 접근 방식을 사용합니다.

1. 세션 컨텍스트 사용량을 모니터링합니다.
2. “소프트 임계값”(Pi의 Compaction 임계값보다 낮음)을 넘으면 agent에게 무음
   “지금 memory 쓰기” 지시를 실행합니다.
3. 사용자가 아무것도 보지 않도록 정확한 무음 토큰 `NO_REPLY` / `no_reply`를 사용합니다.

Config(`agents.defaults.compaction.memoryFlush`):

- `enabled`(기본값: `true`)
- `model`(플러시 턴에 대한 선택적 정확한 provider/model 재정의, 예: `ollama/qwen3:8b`)
- `softThresholdTokens`(기본값: `4000`)
- `prompt`(플러시 턴의 사용자 메시지)
- `systemPrompt`(플러시 턴에 추가되는 추가 시스템 프롬프트)

참고:

- 기본 프롬프트/시스템 프롬프트에는 전달을 억제하기 위한 `NO_REPLY` 힌트가 포함됩니다.
- `model`이 설정되면 플러시 턴은 활성 세션 fallback 체인을 상속하지 않고 해당 모델을 사용하므로,
  로컬 전용 관리 작업이 유료 대화 모델로 조용히 fallback되지 않습니다.
- 플러시는 Compaction 주기마다 한 번 실행됩니다(`sessions.json`에서 추적).
- 플러시는 임베디드 Pi 세션에서만 실행됩니다(CLI 백엔드는 건너뜀).
- 세션 workspace가 읽기 전용(`workspaceAccess: "ro"` 또는 `"none"`)이면 플러시는 건너뜁니다.
- workspace 파일 레이아웃과 쓰기 패턴은 [Memory](/ko/concepts/memory)를 참고하세요.

Pi는 extension API에서 `session_before_compact` 훅도 노출하지만, OpenClaw의
플러시 로직은 현재 Gateway 측에 있습니다.

---

## 문제 해결 체크리스트

- 세션 키가 잘못되었나요? [/concepts/session](/ko/concepts/session)에서 시작하고 `/status`의 `sessionKey`를 확인하세요.
- 저장소와 transcript가 일치하지 않나요? `openclaw status`에서 Gateway 호스트와 저장소 경로를 확인하세요.
- Compaction 스팸이 발생하나요? 다음을 확인하세요.
  - 모델 컨텍스트 창(너무 작음)
  - Compaction 설정(모델 창에 비해 `reserveTokens`가 너무 높으면 더 이른 Compaction이 발생할 수 있음)
  - 도구 결과 비대화: 세션 가지치기를 활성화/조정하세요
- 무음 턴이 누출되나요? 답장이 `NO_REPLY`(대소문자 무시 정확 토큰)로 시작하는지, 그리고 스트리밍 억제 수정이 포함된 빌드인지 확인하세요.

## 관련

- [세션 관리](/ko/concepts/session)
- [세션 가지치기](/ko/concepts/session-pruning)
- [컨텍스트 엔진](/ko/concepts/context-engine)
