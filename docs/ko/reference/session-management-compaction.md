---
read_when:
    - 세션 ID, transcript JSONL 또는 sessions.json 필드를 디버그해야 합니다
    - 자동 Compaction 동작을 변경하거나 "pre-Compaction" 하우스키핑을 추가하는 경우
    - 메모리 플러시 또는 무음 시스템 턴을 구현하려는 경우
summary: '심층 분석: 세션 저장소 + 대화 기록, 수명 주기, (자동)Compaction 내부 구조'
title: 세션 관리 심층 분석
x-i18n:
    generated_at: "2026-05-06T06:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw는 다음 영역 전반에서 세션을 종단 간 관리합니다.

- **세션 라우팅**(수신 메시지가 `sessionKey`에 매핑되는 방식)
- **세션 저장소**(`sessions.json`)와 저장소가 추적하는 항목
- **트랜스크립트 지속성**(`*.jsonl`)과 그 구조
- **트랜스크립트 위생**(실행 전 공급자별 수정)
- **컨텍스트 제한**(컨텍스트 윈도우와 추적 토큰)
- **Compaction**(수동 및 자동 Compaction)과 Compaction 전 작업을 연결할 위치
- **무음 하우스키핑**(사용자에게 보이는 출력을 생성하지 않아야 하는 메모리 쓰기)

먼저 더 높은 수준의 개요를 보려면 다음부터 시작하세요.

- [세션 관리](/ko/concepts/session)
- [Compaction](/ko/concepts/compaction)
- [메모리 개요](/ko/concepts/memory)
- [메모리 검색](/ko/concepts/memory-search)
- [세션 정리](/ko/concepts/session-pruning)
- [트랜스크립트 위생](/ko/reference/transcript-hygiene)

---

## 진실의 원천: Gateway

OpenClaw는 세션 상태를 소유하는 단일 **Gateway 프로세스**를 중심으로 설계되었습니다.

- UI(macOS 앱, 웹 Control UI, TUI)는 세션 목록과 토큰 수를 Gateway에 조회해야 합니다.
- 원격 모드에서는 세션 파일이 원격 호스트에 있습니다. 따라서 "로컬 Mac 파일 확인"은 Gateway가 사용하는 내용을 반영하지 않습니다.

---

## 두 가지 지속성 계층

OpenClaw는 세션을 두 계층에 지속합니다.

1. **세션 저장소(`sessions.json`)**
   - 키/값 맵: `sessionKey -> SessionEntry`
   - 작고, 변경 가능하며, 편집해도 안전함(또는 항목 삭제 가능)
   - 세션 메타데이터(현재 세션 ID, 마지막 활동, 토글, 토큰 카운터 등)를 추적함

2. **트랜스크립트(`<sessionId>.jsonl`)**
   - 트리 구조를 가진 추가 전용 트랜스크립트(항목에는 `id` + `parentId`가 있음)
   - 실제 대화 + 도구 호출 + Compaction 요약을 저장함
   - 이후 턴의 모델 컨텍스트를 다시 빌드하는 데 사용됨
   - 활성 트랜스크립트가 체크포인트 크기 상한을 초과하면 큰 Compaction 전 디버그 체크포인트는 건너뛰어, 두 번째 거대한 `.checkpoint.*.jsonl` 복사본을 만들지 않습니다.

Gateway 히스토리 리더는 표면이 임의의 과거 접근을 명시적으로 필요로 하지 않는 한 전체 트랜스크립트를 메모리에 올리지 않아야 합니다. 첫 페이지 히스토리, 임베드된 채팅 히스토리, 재시작 복구, 토큰/사용량 확인은 제한된 꼬리 읽기를 사용합니다. 전체 트랜스크립트 스캔은 비동기 트랜스크립트 인덱스를 거치며, 이 인덱스는 파일 경로와 `mtimeMs`/`size` 기준으로 캐시되고 동시 리더 간에 공유됩니다.

---

## 디스크상 위치

Gateway 호스트에서 에이전트별 위치:

- 저장소: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- 트랜스크립트: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 토픽 세션: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw는 이를 `src/config/sessions.ts`를 통해 해석합니다.

---

## 저장소 유지관리 및 디스크 제어

세션 지속성에는 `sessions.json`, 트랜스크립트 아티팩트, trajectory 사이드카를 위한 자동 유지관리 제어(`session.maintenance`)가 있습니다.

- `mode`: `warn`(기본값) 또는 `enforce`
- `pruneAfter`: 오래된 항목 나이 기준(기본값 `30d`)
- `maxEntries`: `sessions.json`의 항목 상한(기본값 `500`)
- `resetArchiveRetention`: `*.reset.<timestamp>` 트랜스크립트 아카이브 보존 기간(기본값: `pruneAfter`와 동일, `false`는 정리 비활성화)
- `maxDiskBytes`: 선택적 세션 디렉터리 예산
- `highWaterBytes`: 정리 후 선택적 목표값(기본값은 `maxDiskBytes`의 `80%`)

일반 Gateway 쓰기는 프로세스 내 변경을 직렬화하는 저장소별 세션 writer를 거치며, 런타임 파일 락을 잡지 않습니다. 핫 경로 패치 헬퍼는 writer 슬롯을 보유하는 동안 검증된 변경 가능 캐시를 빌리므로, 큰 `sessions.json` 파일을 모든 메타데이터 업데이트마다 복제하거나 다시 읽지 않습니다. 런타임 코드는 `updateSessionStore(...)` 또는 `updateSessionStoreEntry(...)`를 선호해야 합니다. 직접 전체 저장소 저장은 호환성 및 오프라인 유지관리 도구입니다. Gateway에 연결할 수 있을 때, 비 dry-run `openclaw sessions cleanup` 및 `openclaw agents delete`는 저장소 변경을 Gateway에 위임하여 정리가 동일한 writer 큐에 합류하도록 합니다. `--store <path>`는 직접 파일 유지관리를 위한 명시적 오프라인 복구 경로입니다. `maxEntries` 정리는 운영 규모 상한에서도 여전히 일괄 처리되므로, 다음 high-water 정리가 다시 줄여 쓸 때까지 저장소가 구성된 상한을 잠시 초과할 수 있습니다. 세션 저장소 읽기는 Gateway 시작 중에 항목을 정리하거나 상한을 적용하지 않습니다. 정리에는 쓰기 또는 `openclaw sessions cleanup --enforce`를 사용하세요. `openclaw sessions cleanup --enforce`는 디스크 예산이 구성되지 않았더라도 구성된 상한을 즉시 적용하고 오래된 참조되지 않은 트랜스크립트, 체크포인트, trajectory 아티팩트를 정리합니다.

유지관리는 그룹 세션 및 스레드 범위 채팅 세션 같은 내구성 있는 외부 대화 포인터를 유지하지만, cron, 훅, Heartbeat, ACP, 하위 에이전트용 합성 런타임 항목은 구성된 나이, 개수 또는 디스크 예산을 초과하면 제거될 수 있습니다.

OpenClaw는 더 이상 Gateway 쓰기 중 자동 `sessions.json.bak.*` 회전 백업을 만들지 않습니다. 레거시 `session.maintenance.rotateBytes` 키는 무시되며 `openclaw doctor --fix`가 이전 구성에서 이를 제거합니다.

트랜스크립트 변경은 트랜스크립트 파일의 세션 쓰기 락을 사용합니다. 락 획득은 바쁜 세션 오류를 표시하기 전에 최대 `session.writeLock.acquireTimeoutMs`까지 기다립니다. 기본값은 `60000` ms입니다. 느린 머신에서 합법적인 준비, 정리, Compaction 또는 트랜스크립트 미러 작업이 더 오래 경합할 때만 이 값을 높이세요. 오래된 락 감지와 최대 보유 경고는 별도 정책으로 유지됩니다.

디스크 예산 정리(`mode: "enforce"`)의 적용 순서:

1. 가장 오래된 아카이브, 고아 트랜스크립트 또는 고아 trajectory 아티팩트를 먼저 제거합니다.
2. 그래도 목표를 초과하면 가장 오래된 세션 항목과 해당 트랜스크립트/trajectory 파일을 제거합니다.
3. 사용량이 `highWaterBytes` 이하가 될 때까지 계속합니다.

`mode: "warn"`에서 OpenClaw는 잠재적 제거를 보고하지만 저장소/파일을 변경하지 않습니다.

필요할 때 유지관리를 실행하세요.

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 세션 및 실행 로그

격리된 cron 실행도 세션 항목/트랜스크립트를 만들며, 전용 보존 제어가 있습니다.

- `cron.sessionRetention`(기본값 `24h`)은 세션 저장소에서 오래된 격리 cron 실행 세션을 정리합니다(`false`는 비활성화).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl` 파일을 정리합니다(기본값: `2_000_000` 바이트 및 `2000`줄).

cron이 새 격리 실행 세션을 강제로 만들 때, 새 행을 쓰기 전에 이전 `cron:<jobId>` 세션 항목을 정리합니다. thinking/fast/verbose 설정, 라벨, 명시적으로 사용자가 선택한 모델/인증 재정의 같은 안전한 기본 설정은 유지합니다. 채널/그룹 라우팅, 전송 또는 큐 정책, 권한 상승, 출처, ACP 런타임 바인딩 같은 주변 대화 컨텍스트는 제거하여 새로운 격리 실행이 오래된 실행의 낡은 전달 또는 런타임 권한을 상속하지 못하게 합니다.

---

## 세션 키(`sessionKey`)

`sessionKey`는 현재 속한 _대화 버킷_(라우팅 + 격리)을 식별합니다.

일반적인 패턴:

- 기본/직접 채팅(에이전트별): `agent:<agentId>:<mainKey>`(기본값 `main`)
- 그룹: `agent:<agentId>:<channel>:group:<id>`
- 방/채널(Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` 또는 `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`(재정의하지 않는 한)

정식 규칙은 [/concepts/session](/ko/concepts/session)에 문서화되어 있습니다.

---

## 세션 ID(`sessionId`)

각 `sessionKey`는 현재 `sessionId`(대화를 이어가는 트랜스크립트 파일)를 가리킵니다.

경험칙:

- **재설정**(`/new`, `/reset`)은 해당 `sessionKey`에 새 `sessionId`를 만듭니다.
- **일일 재설정**(기본값: Gateway 호스트의 로컬 시간 오전 4:00)은 재설정 경계를 지난 뒤 다음 메시지에서 새 `sessionId`를 만듭니다.
- **유휴 만료**(`session.reset.idleMinutes` 또는 레거시 `session.idleMinutes`)는 유휴 윈도우 이후 메시지가 도착하면 새 `sessionId`를 만듭니다. 일일 재설정과 유휴 만료가 모두 구성된 경우 먼저 만료되는 쪽이 적용됩니다.
- **시스템 이벤트**(Heartbeat, cron 깨우기, exec 알림, gateway 장부 처리)는 세션 행을 변경할 수 있지만 일일/유휴 재설정 freshness를 연장하지 않습니다. 재설정 롤오버는 새 프롬프트를 빌드하기 전에 이전 세션에 대해 대기 중이던 시스템 이벤트 알림을 버립니다.
- **부모 포크 정책**은 스레드 또는 하위 에이전트 포크를 만들 때 Pi의 활성 브랜치를 사용합니다. 해당 브랜치가 너무 크면 OpenClaw는 실패하거나 사용할 수 없는 히스토리를 상속하는 대신 격리된 컨텍스트로 자식을 시작합니다. 크기 정책은 자동입니다. 레거시 `session.parentForkMaxTokens` 구성은 `openclaw doctor --fix`로 제거됩니다.

구현 세부 정보: 결정은 `src/auto-reply/reply/session.ts`의 `initSessionState()`에서 이루어집니다.

---

## 세션 저장소 스키마(`sessions.json`)

저장소의 값 타입은 `src/config/sessions.ts`의 `SessionEntry`입니다.

주요 필드(전체 목록 아님):

- `sessionId`: 현재 트랜스크립트 ID(`sessionFile`이 설정되지 않은 한 파일명은 여기에서 파생됨)
- `sessionStartedAt`: 현재 `sessionId`의 시작 타임스탬프. 일일 재설정 freshness는 이를 사용합니다. 레거시 행은 JSONL 세션 헤더에서 이를 파생할 수 있습니다.
- `lastInteractionAt`: 마지막 실제 사용자/채널 상호작용 타임스탬프. 유휴 재설정 freshness는 이를 사용하므로 Heartbeat, cron, exec 이벤트가 세션을 계속 살아 있게 하지 않습니다. 이 필드가 없는 레거시 행은 복구된 세션 시작 시간으로 폴백하여 유휴 freshness에 사용합니다.
- `updatedAt`: 마지막 저장소 행 변경 타임스탬프이며, 목록 표시, 정리, 장부 처리에 사용됩니다. 일일/유휴 재설정 freshness의 기준은 아닙니다.
- `sessionFile`: 선택적 명시적 트랜스크립트 경로 재정의
- `chatType`: `direct | group | room`(UI 및 전송 정책에 도움)
- `provider`, `subject`, `room`, `space`, `displayName`: 그룹/채널 라벨링용 메타데이터
- 토글:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`(세션별 재정의)
- 모델 선택:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- 토큰 카운터(최선 노력 / 공급자 의존):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: 이 세션 키에 대해 자동 Compaction이 완료된 횟수
- `memoryFlushAt`: 마지막 Compaction 전 메모리 플러시의 타임스탬프
- `memoryFlushCompactionCount`: 마지막 플러시가 실행되었을 때의 Compaction 횟수

저장소는 편집해도 안전하지만 Gateway가 기준입니다. 세션이 실행되면서 항목을 다시 쓰거나 재수화할 수 있습니다.

---

## 트랜스크립트 구조(`*.jsonl`)

트랜스크립트는 `@mariozechner/pi-coding-agent`의 `SessionManager`가 관리합니다.

파일은 JSONL입니다.

- 첫 줄: 세션 헤더(`type: "session"`, `id`, `cwd`, `timestamp`, 선택적 `parentSession` 포함)
- 이후: `id` + `parentId`가 있는 세션 항목(트리)

주요 항목 타입:

- `message`: 사용자/어시스턴트/toolResult 메시지
- `custom_message`: 모델 컨텍스트에 _들어가는_ extension 주입 메시지(UI에서는 숨길 수 있음)
- `custom`: 모델 컨텍스트에 _들어가지 않는_ extension 상태
- `compaction`: `firstKeptEntryId` 및 `tokensBefore`가 있는 지속된 Compaction 요약
- `branch_summary`: 트리 브랜치를 탐색할 때 지속된 요약

OpenClaw는 의도적으로 트랜스크립트를 "수정"하지 않습니다. Gateway는 `SessionManager`를 사용해 이를 읽고 씁니다.

---

## 컨텍스트 윈도우와 추적 토큰

중요한 개념은 두 가지입니다.

1. **모델 컨텍스트 윈도우**: 모델별 하드 상한(모델이 볼 수 있는 토큰)
2. **세션 저장소 카운터**: `sessions.json`에 기록되는 롤링 통계(/status 및 대시보드에 사용)

제한을 조정하는 경우:

- 컨텍스트 윈도우는 모델 카탈로그에서 가져옵니다(구성을 통해 재정의 가능).
- 저장소의 `contextTokens`는 런타임 추정/보고 값입니다. 이를 엄격한 보장으로 취급하지 마세요.

자세한 내용은 [/token-use](/ko/reference/token-use)를 참조하세요.

---

## Compaction: 정의

Compaction은 이전 대화를 트랜스크립트의 지속된 `compaction` 항목으로 요약하고 최근 메시지는 그대로 유지합니다.

Compaction 이후 이후 턴은 다음을 봅니다.

- Compaction 요약
- `firstKeptEntryId` 이후의 메시지

Compaction은 **영구적**입니다(세션 가지치기와 다름). [/concepts/session-pruning](/ko/concepts/session-pruning)을 참고하세요.

## Compaction 청크 경계와 도구 페어링

OpenClaw가 긴 transcript를 Compaction 청크로 나눌 때, assistant 도구 호출을
일치하는 `toolResult` 항목과 쌍으로 유지합니다.

- 토큰 비율 분할 지점이 도구 호출과 그 결과 사이에 걸리면, OpenClaw는
  쌍을 분리하지 않고 경계를 assistant 도구 호출 메시지로 옮깁니다.
- 뒤따르는 도구 결과 블록 때문에 청크가 목표치를 초과하게 될 경우,
  OpenClaw는 해당 대기 중인 도구 블록을 보존하고 요약되지 않은 꼬리 부분을
  그대로 유지합니다.
- 중단된/오류 도구 호출 블록은 대기 중인 분할을 열린 상태로 유지하지 않습니다.

---

## 자동 Compaction이 발생하는 시점(Pi 런타임)

임베디드 Pi 에이전트에서 자동 Compaction은 두 경우에 트리거됩니다.

1. **오버플로 복구**: 모델이 context 오버플로 오류를 반환하는 경우
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` 및 유사한 provider 형식의 변형) → compact → 재시도.
2. **임계값 유지 관리**: 성공적인 turn 이후, 다음 조건일 때:

`contextTokens > contextWindow - reserveTokens`

여기서:

- `contextWindow`는 모델의 context window입니다.
- `reserveTokens`는 프롬프트 + 다음 모델 출력을 위해 예약된 여유 공간입니다.

이는 Pi 런타임 시맨틱입니다(OpenClaw는 이벤트를 소비하지만, 언제 compact할지는 Pi가 결정합니다).

OpenClaw는 `agents.defaults.compaction.maxActiveTranscriptBytes`가 설정되어 있고
active transcript 파일이 해당 크기에 도달하면 다음 run을 열기 전에 preflight 로컬 Compaction도
트리거할 수 있습니다. 이는 원시 보관용이 아니라 로컬 재열기 비용을 위한 파일 크기 가드입니다.
OpenClaw는 여전히 일반 semantic Compaction을 실행하며,
compacted 요약이 새 successor transcript가 될 수 있도록 `truncateAfterCompaction`이 필요합니다.

임베디드 Pi 실행에서 `agents.defaults.compaction.midTurnPrecheck.enabled: true`는
옵트인 도구 루프 가드를 추가합니다. 도구 결과가 추가된 뒤, 다음 모델 호출 전에
OpenClaw는 turn 시작 시 사용하는 것과 동일한 preflight budget 로직으로 프롬프트 압력을 추정합니다.
context가 더 이상 맞지 않으면, 이 가드는 Pi의 `transformContext` hook 내부에서 compact하지 않습니다.
대신 구조화된 mid-turn precheck 신호를 발생시키고, 현재 프롬프트 제출을 중단하며,
외부 run loop가 기존 복구 경로를 사용하게 합니다. 충분한 경우 과도하게 큰 도구 결과를 자르거나,
설정된 Compaction 모드를 트리거한 뒤 재시도합니다. 이 옵션은 기본적으로 비활성화되어 있으며
provider-backed safeguard Compaction을 포함해 `default`와 `safeguard` Compaction 모드 모두에서 동작합니다.
이는 `maxActiveTranscriptBytes`와 독립적입니다. byte 크기 가드는 turn이 열리기 전에 실행되고,
mid-turn precheck는 새 도구 결과가 추가된 뒤 임베디드 Pi 도구 루프에서 나중에 실행됩니다.

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

OpenClaw는 임베디드 실행에 대해 안전 하한도 강제합니다.

- `compaction.reserveTokens < reserveTokensFloor`이면 OpenClaw가 올립니다.
- 기본 하한은 `20000` 토큰입니다.
- 하한을 비활성화하려면 `agents.defaults.compaction.reserveTokensFloor: 0`을 설정하세요.
- 이미 더 높으면 OpenClaw는 그대로 둡니다.
- 수동 `/compact`는 명시적인 `agents.defaults.compaction.keepRecentTokens`를 존중하고
  Pi의 recent-tail 절단 지점을 유지합니다. 명시적인 유지 budget이 없으면
  수동 Compaction은 계속 hard checkpoint로 남으며, 재구성된 context는
  새 요약에서 시작합니다.
- 새 도구 결과 이후와 다음 모델 호출 전에 선택적 도구 루프 precheck를 실행하려면
  `agents.defaults.compaction.midTurnPrecheck.enabled: true`를 설정하세요.
  이는 trigger일 뿐이며, 요약 생성은 여전히 설정된 Compaction 경로를 사용합니다.
  이는 turn 시작 시 active transcript byte 크기 가드인 `maxActiveTranscriptBytes`와
  독립적입니다.
- active transcript가 커졌을 때 turn 전에 로컬 Compaction을 실행하려면
  `agents.defaults.compaction.maxActiveTranscriptBytes`를 byte 값 또는 `"20mb"` 같은
  문자열로 설정하세요. 이 가드는 `truncateAfterCompaction`도 활성화된 경우에만
  활성화됩니다. 비활성화하려면 설정하지 않거나 `0`으로 설정하세요.
- `agents.defaults.compaction.truncateAfterCompaction`이 활성화되면,
  OpenClaw는 Compaction 이후 active transcript를 compacted successor JSONL로 교체합니다.
  이전 전체 transcript는 제자리에서 다시 쓰이지 않고, 보관된 상태로 남아
  Compaction checkpoint에서 링크됩니다.

이유: Compaction이 불가피해지기 전에 여러 turn에 걸친 "housekeeping"(예: 메모리 쓰기)을 위한 충분한 여유 공간을 남기기 위해서입니다.

구현: `src/agents/pi-settings.ts`의 `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts`에서 호출됨).

---

## 플러그형 Compaction provider

Plugin은 Plugin API의 `registerCompactionProvider()`를 통해 Compaction provider를 등록할 수 있습니다. `agents.defaults.compaction.provider`가 등록된 provider id로 설정되면, safeguard Plugin은 내장 `summarizeInStages` pipeline 대신 해당 provider에 요약을 위임합니다.

- `provider`: 등록된 Compaction provider Plugin의 id입니다. 기본 LLM 요약을 사용하려면 설정하지 마세요.
- `provider`를 설정하면 `mode: "safeguard"`가 강제됩니다.
- Provider는 내장 경로와 동일한 Compaction 지침과 식별자 보존 정책을 받습니다.
- Safeguard는 provider 출력 이후에도 recent-turn 및 split-turn suffix context를 보존합니다.
- 내장 safeguard 요약은 전체 이전 요약을 그대로 보존하지 않고,
  이전 요약을 새 메시지와 함께 다시 정제합니다.
- Safeguard 모드는 기본적으로 요약 품질 감사를 활성화합니다. malformed output 시 재시도 동작을 건너뛰려면
  `qualityGuard.enabled: false`를 설정하세요.
- Provider가 실패하거나 빈 결과를 반환하면 OpenClaw는 자동으로 내장 LLM 요약으로 fallback합니다.
- 중단/timeout 신호는 호출자 취소를 존중하기 위해 다시 throw됩니다(삼켜지지 않음).

소스: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## 사용자에게 보이는 표면

다음을 통해 Compaction 및 세션 상태를 관찰할 수 있습니다.

- `/status`(모든 chat 세션)
- `openclaw status`(CLI)
- `openclaw sessions` / `sessions --json`
- Verbose 모드: `🧹 Auto-compaction complete` + Compaction 횟수

---

## 조용한 housekeeping(`NO_REPLY`)

OpenClaw는 사용자가 중간 출력을 보지 않아야 하는 백그라운드 작업을 위해 "silent" turn을 지원합니다.

규칙:

- assistant가 출력 시작 부분에 정확한 silent token `NO_REPLY` /
  `no_reply`를 사용하여 "사용자에게 답장을 전달하지 말라"는 의미를 표시합니다.
- OpenClaw는 delivery layer에서 이를 제거/억제합니다.
- 정확한 silent-token 억제는 대소문자를 구분하지 않으므로, 전체 payload가 silent token만인 경우
  `NO_REPLY`와 `no_reply`가 모두 해당됩니다.
- 이는 진짜 백그라운드/비전달 turn 전용입니다. 일반적인 실행 가능한 사용자 요청을 위한
  shortcut이 아닙니다.

`2026.1.10`부터 OpenClaw는 partial chunk가 `NO_REPLY`로 시작할 때 **draft/typing streaming**도
억제하므로, silent 작업이 turn 중간에 partial output을 누출하지 않습니다.

---

## Pre-Compaction "memory flush"(구현됨)

목표: 자동 Compaction이 발생하기 전에, durable state를 disk에 쓰는 조용한 agentic turn을 실행합니다
(예: agent workspace의 `memory/YYYY-MM-DD.md`). 그러면 Compaction이 중요한 context를 지울 수 없습니다.

OpenClaw는 **pre-threshold flush** 접근 방식을 사용합니다.

1. 세션 context 사용량을 모니터링합니다.
2. Pi의 Compaction 임계값보다 낮은 "soft threshold"를 넘으면, agent에 조용한
   "write memory now" 지시를 실행합니다.
3. 사용자가 아무것도 보지 않도록 정확한 silent token `NO_REPLY` / `no_reply`를 사용합니다.

Config(`agents.defaults.compaction.memoryFlush`):

- `enabled`(기본값: `true`)
- `model`(flush turn에 대한 선택적 exact provider/model override, 예: `ollama/qwen3:8b`)
- `softThresholdTokens`(기본값: `4000`)
- `prompt`(flush turn용 사용자 메시지)
- `systemPrompt`(flush turn에 추가되는 extra system prompt)

참고:

- 기본 prompt/system prompt에는 delivery를 억제하기 위한 `NO_REPLY` 힌트가 포함됩니다.
- `model`이 설정되면 flush turn은 active session fallback chain을 상속하지 않고 해당 모델을 사용하므로,
  로컬 전용 housekeeping이 유료 대화 모델로 조용히 fallback하지 않습니다.
- Flush는 Compaction cycle마다 한 번 실행됩니다(`sessions.json`에서 추적).
- Flush는 임베디드 Pi 세션에서만 실행됩니다(CLI backend는 건너뜀).
- 세션 workspace가 read-only(`workspaceAccess: "ro"` 또는 `"none"`)이면 flush를 건너뜁니다.
- workspace 파일 layout과 쓰기 패턴은 [Memory](/ko/concepts/memory)를 참고하세요.

Pi도 extension API에 `session_before_compact` hook을 노출하지만, OpenClaw의
flush 로직은 현재 Gateway 쪽에 있습니다.

---

## 문제 해결 checklist

- 세션 key가 잘못되었나요? [/concepts/session](/ko/concepts/session)에서 시작해 `/status`의 `sessionKey`를 확인하세요.
- Store와 transcript가 일치하지 않나요? `openclaw status`에서 Gateway host와 store path를 확인하세요.
- Compaction spam인가요? 다음을 확인하세요.
  - 모델 context window(너무 작음)
  - Compaction 설정(모델 window에 비해 `reserveTokens`가 너무 높으면 Compaction이 더 일찍 발생할 수 있음)
  - 도구 결과 bloat: 세션 가지치기를 활성화/조정하세요.
- Silent turn이 누출되나요? reply가 `NO_REPLY`로 시작하는지(대소문자 무관 정확한 token), 그리고 streaming suppression fix가 포함된 build인지 확인하세요.

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [세션 가지치기](/ko/concepts/session-pruning)
- [Context engine](/ko/concepts/context-engine)
