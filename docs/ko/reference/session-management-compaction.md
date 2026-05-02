---
read_when:
    - 세션 ID, 대화 기록 JSONL 또는 sessions.json 필드를 디버그해야 하는 경우
    - 자동 Compaction 동작을 변경하거나 “Compaction 전” 정리 작업을 추가하고 있습니다
    - 메모리 플러시 또는 무음 시스템 턴을 구현하려는 경우
summary: '심층 분석: 세션 저장소 + 트랜스크립트, 수명 주기 및 (자동)Compaction 내부 구조'
title: 세션 관리 심층 분석
x-i18n:
    generated_at: "2026-05-02T21:13:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8271d7b0786e1c47a8cec6e7bd73c3c86a433d629e17937fdd87fa756ed78d73
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw는 다음 영역 전반에서 세션을 처음부터 끝까지 관리합니다.

- **세션 라우팅**(인바운드 메시지가 `sessionKey`에 매핑되는 방식)
- **세션 저장소**(`sessions.json`)와 추적 항목
- **트랜스크립트 지속성**(`*.jsonl`)과 그 구조
- **트랜스크립트 위생**(실행 전 공급자별 수정)
- **컨텍스트 제한**(컨텍스트 창과 추적된 토큰)
- **Compaction**(수동 및 자동 Compaction)과 Compaction 전 작업을 연결할 위치
- **무음 관리 작업**(사용자에게 보이는 출력을 만들지 않아야 하는 메모리 쓰기)

먼저 더 높은 수준의 개요를 보고 싶다면 다음에서 시작하세요.

- [세션 관리](/ko/concepts/session)
- [Compaction](/ko/concepts/compaction)
- [메모리 개요](/ko/concepts/memory)
- [메모리 검색](/ko/concepts/memory-search)
- [세션 정리](/ko/concepts/session-pruning)
- [트랜스크립트 위생](/ko/reference/transcript-hygiene)

---

## 신뢰할 수 있는 출처: Gateway

OpenClaw는 세션 상태를 소유하는 단일 **Gateway 프로세스**를 중심으로 설계되었습니다.

- UI(macOS 앱, 웹 제어 UI, TUI)는 세션 목록과 토큰 수를 Gateway에 질의해야 합니다.
- 원격 모드에서는 세션 파일이 원격 호스트에 있습니다. “로컬 Mac 파일 확인”은 Gateway가 사용하는 내용을 반영하지 않습니다.

---

## 두 가지 지속성 계층

OpenClaw는 세션을 두 계층에 지속합니다.

1. **세션 저장소(`sessions.json`)**
   - 키/값 맵: `sessionKey -> SessionEntry`
   - 작고, 변경 가능하며, 편집(또는 항목 삭제)해도 안전함
   - 세션 메타데이터(현재 세션 ID, 마지막 활동, 토글, 토큰 카운터 등)를 추적함

2. **트랜스크립트(`<sessionId>.jsonl`)**
   - 트리 구조를 가진 append-only 트랜스크립트(항목에는 `id` + `parentId`가 있음)
   - 실제 대화 + 도구 호출 + Compaction 요약을 저장함
   - 이후 턴에서 모델 컨텍스트를 다시 빌드하는 데 사용됨
   - 활성 트랜스크립트가 체크포인트 크기 상한을 초과하면 대형 Compaction 전 디버그 체크포인트를 건너뛰어, 두 번째 거대한 `.checkpoint.*.jsonl` 복사본을 만들지 않습니다.

Gateway 히스토리 리더는 해당 화면이 임의의 과거 접근을 명시적으로 필요로 하지 않는 한 전체 트랜스크립트를 메모리에 구체화하지 않아야 합니다. 첫 페이지 히스토리, 임베디드 채팅 히스토리, 재시작 복구, 토큰/사용량 확인은 제한된 tail 읽기를 사용합니다. 전체 트랜스크립트 스캔은 비동기 트랜스크립트 인덱스를 거치며, 이 인덱스는 파일 경로와 `mtimeMs`/`size`를 기준으로 캐시되고 동시 리더 간에 공유됩니다.

---

## 디스크 위치

Gateway 호스트에서 에이전트별 위치:

- 저장소: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 트랜스크립트: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 주제 세션: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw는 `src/config/sessions.ts`를 통해 이를 해석합니다.

---

## 저장소 유지 관리 및 디스크 제어

세션 지속성에는 `sessions.json`, 트랜스크립트 아티팩트, trajectory 사이드카를 위한 자동 유지 관리 제어(`session.maintenance`)가 있습니다.

- `mode`: `warn`(기본값) 또는 `enforce`
- `pruneAfter`: 오래된 항목 나이 기준(기본값 `30d`)
- `maxEntries`: `sessions.json`의 항목 상한(기본값 `500`)
- `resetArchiveRetention`: `*.reset.<timestamp>` 트랜스크립트 아카이브 보존 기간(기본값: `pruneAfter`와 동일, `false`는 정리를 비활성화)
- `maxDiskBytes`: 선택적 세션 디렉터리 예산
- `highWaterBytes`: 정리 후 선택적 목표값(기본값은 `maxDiskBytes`의 `80%`)

일반 Gateway 쓰기는 런타임 파일 잠금을 잡지 않고 프로세스 내 변경을 직렬화하는 저장소별 세션 작성기를 거칩니다. hot-path 패치 헬퍼는 해당 작성기 슬롯을 보유하는 동안 검증된 변경 가능 캐시를 빌리므로, 대형 `sessions.json` 파일을 모든 메타데이터 업데이트마다 복제하거나 다시 읽지 않습니다. 런타임 코드는 `updateSessionStore(...)` 또는 `updateSessionStoreEntry(...)`를 선호해야 합니다. 직접 전체 저장소를 저장하는 방식은 호환성 및 오프라인 유지 관리 도구용입니다. Gateway에 도달할 수 있는 경우, dry-run이 아닌 `openclaw sessions cleanup` 및 `openclaw agents delete`는 저장소 변경을 Gateway에 위임하여 정리가 동일한 작성기 큐에 합류하도록 합니다. `--store <path>`는 직접 파일 유지 관리를 위한 명시적 오프라인 복구 경로입니다. `maxEntries` 정리는 여전히 프로덕션 크기 상한에 맞춰 일괄 처리되므로, 다음 high-water 정리가 이를 다시 줄여 쓸 때까지 저장소가 구성된 상한을 잠시 초과할 수 있습니다. 세션 저장소 읽기는 Gateway 시작 중에 항목을 정리하거나 상한 적용하지 않습니다. 정리에는 쓰기 또는 `openclaw sessions cleanup --enforce`를 사용하세요. `openclaw sessions cleanup --enforce`는 구성된 상한을 즉시 적용합니다.

유지 관리는 그룹 세션 및 스레드 범위 채팅 세션 같은 내구성 있는 외부 대화 포인터를 유지하지만, cron, hooks, heartbeat, ACP, 하위 에이전트의 합성 런타임 항목은 구성된 나이, 개수 또는 디스크 예산을 초과하면 제거될 수 있습니다.

OpenClaw는 더 이상 Gateway 쓰기 중에 자동 `sessions.json.bak.*` 회전 백업을 만들지 않습니다. 기존 `session.maintenance.rotateBytes` 키는 무시되며 `openclaw doctor --fix`는 오래된 구성에서 이를 제거합니다.

트랜스크립트 변경은 트랜스크립트 파일의 세션 쓰기 잠금을 사용합니다. 잠금 획득은 busy-session 오류를 표시하기 전에 최대 `session.writeLock.acquireTimeoutMs`까지 기다립니다. 기본값은 `60000`ms입니다. 합법적인 준비, 정리, Compaction 또는 트랜스크립트 미러 작업이 느린 머신에서 더 오래 경합하는 경우에만 이 값을 높이세요. stale-lock 감지와 최대 보유 경고는 별도의 정책으로 유지됩니다.

디스크 예산 정리(`mode: "enforce"`)의 적용 순서:

1. 가장 오래된 아카이브, 고아 트랜스크립트 또는 고아 trajectory 아티팩트를 먼저 제거합니다.
2. 그래도 목표값보다 높으면 가장 오래된 세션 항목과 해당 트랜스크립트/trajectory 파일을 축출합니다.
3. 사용량이 `highWaterBytes` 이하가 될 때까지 계속합니다.

`mode: "warn"`에서 OpenClaw는 잠재적 축출을 보고하지만 저장소/파일은 변경하지 않습니다.

필요할 때 유지 관리를 실행하세요.

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 세션 및 실행 로그

격리된 cron 실행도 세션 항목/트랜스크립트를 만들며, 전용 보존 제어가 있습니다.

- `cron.sessionRetention`(기본값 `24h`)은 세션 저장소에서 오래된 격리 cron 실행 세션을 정리합니다(`false`는 비활성화).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl` 파일을 정리합니다(기본값: `2_000_000`바이트 및 `2000`줄).

cron이 새 격리 실행 세션을 강제로 만들 때, 새 행을 쓰기 전에 이전 `cron:<jobId>` 세션 항목을 정리합니다. thinking/fast/verbose 설정, 레이블, 명시적으로 사용자가 선택한 모델/auth 재정의 같은 안전한 선호사항은 이어받습니다. 채널/그룹 라우팅, 전송 또는 큐 정책, 권한 상승, 출처, ACP 런타임 바인딩 같은 주변 대화 컨텍스트는 제거하여, 새 격리 실행이 이전 실행의 오래된 전달 또는 런타임 권한을 상속하지 못하게 합니다.

---

## 세션 키(`sessionKey`)

`sessionKey`는 사용자가 속한 _대화 버킷_(라우팅 + 격리)을 식별합니다.

일반적인 패턴:

- 메인/직접 채팅(에이전트별): `agent:<agentId>:<mainKey>`(기본값 `main`)
- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 방/채널(Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` 또는 `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`(재정의되지 않은 경우)

정식 규칙은 [/concepts/session](/ko/concepts/session)에 문서화되어 있습니다.

---

## 세션 ID(`sessionId`)

각 `sessionKey`는 현재 `sessionId`(대화를 이어가는 트랜스크립트 파일)를 가리킵니다.

경험칙:

- **재설정**(`/new`, `/reset`)은 해당 `sessionKey`에 대한 새 `sessionId`를 만듭니다.
- **일일 재설정**(기본값: Gateway 호스트의 로컬 시간 오전 4:00)은 재설정 경계 이후 다음 메시지에서 새 `sessionId`를 만듭니다.
- **유휴 만료**(`session.reset.idleMinutes` 또는 기존 `session.idleMinutes`)는 유휴 창 이후 메시지가 도착하면 새 `sessionId`를 만듭니다. 일일 + 유휴가 모두 구성된 경우 먼저 만료되는 쪽이 적용됩니다.
- **시스템 이벤트**(heartbeat, cron wakeups, exec notifications, gateway bookkeeping)는 세션 행을 변경할 수 있지만 일일/유휴 재설정 신선도를 연장하지 않습니다. 재설정 롤오버는 새 프롬프트를 만들기 전에 이전 세션에 대해 큐에 있던 시스템 이벤트 알림을 버립니다.
- **상위 fork 정책**은 스레드 또는 하위 에이전트 fork를 만들 때 PI의 활성 브랜치를 사용합니다. 해당 브랜치가 너무 크면 OpenClaw는 실패하거나 사용할 수 없는 히스토리를 상속하는 대신 격리된 컨텍스트로 자식을 시작합니다. 크기 산정 정책은 자동입니다. 기존 `session.parentForkMaxTokens` 구성은 `openclaw doctor --fix`로 제거됩니다.

구현 세부 정보: 결정은 `src/auto-reply/reply/session.ts`의 `initSessionState()`에서 이루어집니다.

---

## 세션 저장소 스키마(`sessions.json`)

저장소의 값 타입은 `src/config/sessions.ts`의 `SessionEntry`입니다.

주요 필드(전체 목록은 아님):

- `sessionId`: 현재 트랜스크립트 ID(`sessionFile`이 설정되지 않은 경우 파일 이름은 여기서 파생됨)
- `sessionStartedAt`: 현재 `sessionId`의 시작 타임스탬프입니다. 일일 재설정 신선도는 이를 사용합니다. 기존 행은 JSONL 세션 헤더에서 이를 파생할 수 있습니다.
- `lastInteractionAt`: 마지막 실제 사용자/채널 상호작용 타임스탬프입니다. 유휴 재설정 신선도는 이를 사용하므로 heartbeat, cron, exec 이벤트가 세션을 계속 살아 있게 하지 않습니다. 이 필드가 없는 기존 행은 복구된 세션 시작 시간으로 유휴 신선도를 대체합니다.
- `updatedAt`: 마지막 저장소 행 변경 타임스탬프이며 목록, 정리, bookkeeping에 사용됩니다. 일일/유휴 재설정 신선도의 권위 있는 기준은 아닙니다.
- `sessionFile`: 선택적 명시적 트랜스크립트 경로 재정의
- `chatType`: `direct | group | room`(UI 및 전송 정책에 도움)
- `provider`, `subject`, `room`, `space`, `displayName`: 그룹/채널 레이블링용 메타데이터
- 토글:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`(세션별 재정의)
- 모델 선택:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- 토큰 카운터(best-effort / 공급자 의존):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: 이 세션 키에 대해 자동 Compaction이 완료된 횟수
- `memoryFlushAt`: 마지막 Compaction 전 메모리 flush의 타임스탬프
- `memoryFlushCompactionCount`: 마지막 flush가 실행되었을 때의 Compaction 횟수

저장소는 편집해도 안전하지만, Gateway가 권위 있는 기준입니다. 세션이 실행되는 동안 Gateway가 항목을 다시 쓰거나 다시 hydrate할 수 있습니다.

---

## 트랜스크립트 구조(`*.jsonl`)

트랜스크립트는 `@mariozechner/pi-coding-agent`의 `SessionManager`가 관리합니다.

파일은 JSONL입니다.

- 첫 줄: 세션 헤더(`type: "session"`, `id`, `cwd`, `timestamp`, 선택적 `parentSession` 포함)
- 이후: `id` + `parentId`를 가진 세션 항목(트리)

주목할 만한 항목 타입:

- `message`: 사용자/assistant/toolResult 메시지
- `custom_message`: 모델 컨텍스트에 _들어가는_ extension 주입 메시지(UI에서 숨길 수 있음)
- `custom`: 모델 컨텍스트에 _들어가지 않는_ extension 상태
- `compaction`: `firstKeptEntryId` 및 `tokensBefore`가 포함된 지속된 Compaction 요약
- `branch_summary`: 트리 브랜치를 탐색할 때 지속되는 요약

OpenClaw는 의도적으로 트랜스크립트를 “수정”하지 않습니다. Gateway는 `SessionManager`를 사용해 이를 읽고 씁니다.

---

## 컨텍스트 창과 추적된 토큰

두 가지 서로 다른 개념이 중요합니다.

1. **모델 컨텍스트 창**: 모델별 hard cap(모델에 보이는 토큰)
2. **세션 저장소 카운터**: `sessions.json`에 기록되는 롤링 통계(/status 및 대시보드에 사용)

제한을 조정하는 경우:

- 컨텍스트 창은 모델 카탈로그에서 가져옵니다(구성을 통해 재정의 가능).
- 저장소의 `contextTokens`는 런타임 추정/보고 값입니다. 이를 엄격한 보장으로 취급하지 마세요.

자세한 내용은 [/token-use](/ko/reference/token-use)를 참조하세요.

---

## Compaction: 의미

Compaction은 오래된 대화를 트랜스크립트의 지속된 `compaction` 항목으로 요약하고 최근 메시지는 그대로 유지합니다.

Compaction 이후 이후 턴에서 보이는 항목:

- Compaction 요약
- `firstKeptEntryId` 이후의 메시지

Compaction은 **지속적**입니다(세션 정리와 다름). [/concepts/session-pruning](/ko/concepts/session-pruning)을 참조하세요.

## Compaction 청크 경계와 도구 페어링

OpenClaw가 긴 트랜스크립트를 Compaction 청크로 나눌 때, 어시스턴트 도구 호출을
해당 `toolResult` 항목과 짝지어 유지합니다.

- 토큰 비율 기준 분할 지점이 도구 호출과 그 결과 사이에 걸리면, OpenClaw는
  쌍을 분리하지 않고 경계를 어시스턴트 도구 호출 메시지로 이동합니다.
- 뒤쪽의 도구 결과 블록 때문에 청크가 목표치를 초과하게 되는 경우, OpenClaw는
  해당 대기 중인 도구 블록을 보존하고 요약되지 않은 꼬리 부분을 그대로 유지합니다.
- 중단되었거나 오류가 발생한 도구 호출 블록은 대기 중인 분할을 열린 상태로 유지하지 않습니다.

---

## 자동 Compaction이 발생하는 경우(Pi 런타임)

내장 Pi 에이전트에서는 자동 Compaction이 두 가지 경우에 트리거됩니다.

1. **오버플로 복구**: 모델이 컨텍스트 오버플로 오류
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` 및 유사한 공급자별 변형)를 반환함 → 압축 → 재시도.
2. **임계값 유지 관리**: 성공적인 턴 이후 다음 조건일 때:

`contextTokens > contextWindow - reserveTokens`

여기서:

- `contextWindow`는 모델의 컨텍스트 창입니다
- `reserveTokens`는 프롬프트와 다음 모델 출력을 위해 예약된 여유 공간입니다

이는 Pi 런타임 의미 체계입니다(OpenClaw는 이벤트를 소비하지만, 언제 압축할지는 Pi가 결정합니다).

OpenClaw는 `agents.defaults.compaction.maxActiveTranscriptBytes`가 설정되어 있고
활성 트랜스크립트 파일이 해당 크기에 도달하면 다음 실행을 열기 전에 사전 점검 로컬 Compaction도 트리거할 수 있습니다. 이는 로컬 재개 비용을 위한 파일 크기 가드이며 원시 보관이 아닙니다. OpenClaw는 여전히 일반적인 의미 기반 Compaction을 실행하며,
압축된 요약이 새 후속 트랜스크립트가 될 수 있도록 `truncateAfterCompaction`이 필요합니다.

내장 Pi 실행에서 `agents.defaults.compaction.midTurnPrecheck.enabled: true`는
선택형 도구 루프 가드를 추가합니다. 도구 결과가 추가된 후 다음 모델 호출 전에,
OpenClaw는 턴 시작 시 사용하는 것과 동일한 사전 점검 예산 로직으로 프롬프트 압력을 추정합니다. 컨텍스트가 더 이상 맞지 않으면, 가드는 Pi의 `transformContext` 훅 안에서 압축하지 않습니다. 대신 구조화된 턴 중간 사전 점검 신호를 발생시키고, 현재 프롬프트 제출을 중지한 뒤, 외부 실행 루프가 기존 복구 경로를 사용하도록 합니다. 그것만으로 충분하면 너무 큰 도구 결과를 잘라내고, 아니면 구성된 Compaction 모드를 트리거한 뒤 재시도합니다. 이 옵션은 기본적으로 비활성화되어 있으며, 공급자 기반 safeguard Compaction을 포함해 `default`와 `safeguard` Compaction 모드 모두에서 작동합니다.
이는 `maxActiveTranscriptBytes`와 독립적입니다. 바이트 크기 가드는 턴이 열리기 전에 실행되고, 턴 중간 사전 점검은 새 도구 결과가 추가된 뒤 내장 Pi 도구 루프에서 나중에 실행됩니다.

---

## Compaction 설정(`reserveTokens`, `keepRecentTokens`)

Pi의 Compaction 설정은 Pi 설정에 있습니다.

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw는 내장 실행에 대해 안전 하한도 적용합니다.

- `compaction.reserveTokens < reserveTokensFloor`이면 OpenClaw가 값을 올립니다.
- 기본 하한은 `20000` 토큰입니다.
- 하한을 비활성화하려면 `agents.defaults.compaction.reserveTokensFloor: 0`을 설정합니다.
- 이미 더 높게 설정되어 있으면 OpenClaw는 그대로 둡니다.
- 수동 `/compact`는 명시적인 `agents.defaults.compaction.keepRecentTokens`를 존중하고
  Pi의 최근 꼬리 부분 절단 지점을 유지합니다. 명시적인 유지 예산이 없으면,
  수동 Compaction은 하드 체크포인트로 유지되며 재구성된 컨텍스트는
  새 요약에서 시작합니다.
- 새 도구 결과 이후와 다음 모델 호출 전에 선택형 도구 루프 사전 점검을 실행하려면
  `agents.defaults.compaction.midTurnPrecheck.enabled: true`를 설정합니다. 이는 트리거일 뿐이며, 요약 생성은 여전히 구성된 Compaction 경로를 사용합니다. 이는 턴 시작 활성 트랜스크립트 바이트 크기 가드인 `maxActiveTranscriptBytes`와 독립적입니다.
- 활성 트랜스크립트가 커졌을 때 턴 전에 로컬 Compaction을 실행하려면
  `agents.defaults.compaction.maxActiveTranscriptBytes`를 바이트 값 또는 `"20mb"` 같은
  문자열로 설정합니다. 이 가드는 `truncateAfterCompaction`도 활성화된 경우에만 동작합니다. 비활성화하려면 설정하지 않거나 `0`으로 설정합니다.
- `agents.defaults.compaction.truncateAfterCompaction`이 활성화되면,
  OpenClaw는 Compaction 이후 활성 트랜스크립트를 압축된 후속 JSONL로 로테이션합니다.
  이전 전체 트랜스크립트는 제자리에서 다시 쓰이지 않고 보관되며 Compaction 체크포인트에서 링크됩니다.

이유: Compaction이 불가피해지기 전에 여러 턴에 걸친 “정리 작업”(예: 메모리 쓰기)을 위한 충분한 여유 공간을 남기기 위해서입니다.

구현: `src/agents/pi-settings.ts`의 `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts`에서 호출됨).

---

## 플러그형 Compaction 공급자

Plugin은 Plugin API의 `registerCompactionProvider()`를 통해 Compaction 공급자를 등록할 수 있습니다. `agents.defaults.compaction.provider`가 등록된 공급자 ID로 설정되면, safeguard Plugin은 내장 `summarizeInStages` 파이프라인 대신 해당 공급자에 요약을 위임합니다.

- `provider`: 등록된 Compaction 공급자 Plugin의 ID입니다. 기본 LLM 요약을 사용하려면 설정하지 않습니다.
- `provider`를 설정하면 `mode: "safeguard"`가 강제됩니다.
- 공급자는 내장 경로와 동일한 Compaction 지침 및 식별자 보존 정책을 받습니다.
- safeguard는 공급자 출력 이후에도 최근 턴 및 분할 턴 접미사 컨텍스트를 보존합니다.
- 내장 safeguard 요약은 전체 이전 요약을 그대로 보존하는 대신, 새 메시지와 함께 이전 요약을 다시 정제합니다.
- safeguard 모드는 기본적으로 요약 품질 감사를 활성화합니다. 잘못된 형식의 출력에 대한 재시도 동작을 건너뛰려면
  `qualityGuard.enabled: false`를 설정합니다.
- 공급자가 실패하거나 빈 결과를 반환하면 OpenClaw는 자동으로 내장 LLM 요약으로 대체합니다.
- 중단/타임아웃 신호는 호출자 취소를 존중하기 위해 다시 던져집니다(삼키지 않음).

출처: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## 사용자에게 보이는 표면

다음을 통해 Compaction과 세션 상태를 관찰할 수 있습니다.

- `/status`(모든 채팅 세션에서)
- `openclaw status`(CLI)
- `openclaw sessions` / `sessions --json`
- 자세한 모드: `🧹 Auto-compaction complete` + Compaction 횟수

---

## 조용한 정리 작업(`NO_REPLY`)

OpenClaw는 사용자가 중간 출력을 보지 않아야 하는 백그라운드 작업을 위한 “조용한” 턴을 지원합니다.

규칙:

- 어시스턴트는 “사용자에게 답장을 전달하지 않음”을 나타내기 위해 정확한 조용한 토큰 `NO_REPLY` /
  `no_reply`로 출력을 시작합니다.
- OpenClaw는 전달 계층에서 이를 제거/억제합니다.
- 정확한 조용한 토큰 억제는 대소문자를 구분하지 않으므로, 전체 페이로드가 조용한 토큰만인 경우
  `NO_REPLY`와 `no_reply`가 모두 해당됩니다.
- 이는 실제 백그라운드/무전달 턴 전용입니다. 일반적인 실행 가능한 사용자 요청을 위한 지름길이 아닙니다.

`2026.1.10`부터 OpenClaw는 부분 청크가 `NO_REPLY`로 시작할 때 **초안/입력 중 스트리밍**도 억제하므로, 조용한 작업이 턴 중간에 부분 출력을 노출하지 않습니다.

---

## Compaction 전 “메모리 플러시”(구현됨)

목표: 자동 Compaction이 발생하기 전에, 지속 가능한 상태를 디스크(예: 에이전트 워크스페이스의 `memory/YYYY-MM-DD.md`)에 쓰는 조용한 에이전트 턴을 실행하여 Compaction이 중요한 컨텍스트를 지우지 못하게 합니다.

OpenClaw는 **사전 임계값 플러시** 접근 방식을 사용합니다.

1. 세션 컨텍스트 사용량을 모니터링합니다.
2. Pi의 Compaction 임계값보다 낮은 “소프트 임계값”을 넘으면, 에이전트에 조용한
   “지금 메모리 쓰기” 지시문을 실행합니다.
3. 정확한 조용한 토큰 `NO_REPLY` / `no_reply`를 사용하여 사용자가 아무것도 보지 않게 합니다.

구성(`agents.defaults.compaction.memoryFlush`):

- `enabled`(기본값: `true`)
- `model`(플러시 턴에 대한 선택적 정확한 공급자/모델 재정의, 예: `ollama/qwen3:8b`)
- `softThresholdTokens`(기본값: `4000`)
- `prompt`(플러시 턴에 대한 사용자 메시지)
- `systemPrompt`(플러시 턴에 추가로 덧붙이는 시스템 프롬프트)

참고:

- 기본 프롬프트/시스템 프롬프트에는 전달을 억제하기 위한 `NO_REPLY` 힌트가 포함됩니다.
- `model`이 설정되면, 플러시 턴은 활성 세션 대체 체인을 상속하지 않고 해당 모델을 사용하므로, 로컬 전용 정리 작업이 유료 대화 모델로 조용히 대체되지 않습니다.
- 플러시는 Compaction 주기마다 한 번 실행됩니다(`sessions.json`에서 추적).
- 플러시는 내장 Pi 세션에 대해서만 실행됩니다(CLI 백엔드는 건너뜀).
- 세션 워크스페이스가 읽기 전용(`workspaceAccess: "ro"` 또는 `"none"`)이면 플러시는 건너뜁니다.
- 워크스페이스 파일 레이아웃과 쓰기 패턴은 [메모리](/ko/concepts/memory)를 참조하세요.

Pi는 Plugin API에서 `session_before_compact` 훅도 노출하지만, OpenClaw의 플러시 로직은 현재 Gateway 쪽에 있습니다.

---

## 문제 해결 체크리스트

- 세션 키가 잘못되었나요? [/concepts/session](/ko/concepts/session)에서 시작하고 `/status`의 `sessionKey`를 확인하세요.
- 저장소와 트랜스크립트가 일치하지 않나요? `openclaw status`에서 Gateway 호스트와 저장소 경로를 확인하세요.
- Compaction이 과도하게 발생하나요? 다음을 확인하세요.
  - 모델 컨텍스트 창(너무 작음)
  - Compaction 설정(모델 창에 비해 `reserveTokens`가 너무 높으면 더 이른 Compaction이 발생할 수 있음)
  - 도구 결과 비대화: 세션 가지치기를 활성화/조정하세요
- 조용한 턴이 노출되나요? 답장이 `NO_REPLY`(대소문자를 구분하지 않는 정확한 토큰)로 시작하는지, 그리고 스트리밍 억제 수정이 포함된 빌드인지 확인하세요.

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [세션 가지치기](/ko/concepts/session-pruning)
- [컨텍스트 엔진](/ko/concepts/context-engine)
