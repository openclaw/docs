---
read_when:
    - 세션 ID, transcript JSONL, 또는 `sessions.json` 필드를 디버깅해야 합니다.
    - 자동 Compaction 동작을 변경하거나 “pre-compaction” 정리 작업을 추가하고 있습니다.
    - 메모리 flush 또는 무음 시스템 턴을 구현하려고 합니다.
summary: '심층 분석: 세션 저장소 + transcript, 수명 주기, 그리고 (자동)Compaction 내부 구조'
title: 세션 관리 심층 분석
x-i18n:
    generated_at: "2026-04-26T11:38:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: f41f1c403f978c22cc2a929629e1811414d1399fa7f9e28c481fcb594d30196f
    source_path: reference/session-management-compaction.md
    workflow: 15
---

이 페이지는 OpenClaw가 세션을 엔드 투 엔드로 어떻게 관리하는지 설명합니다:

- **세션 라우팅**(수신 메시지가 어떻게 `sessionKey`에 매핑되는지)
- **세션 저장소**(`sessions.json`)와 여기서 추적하는 내용
- **Transcript 영속화**(`*.jsonl`)와 그 구조
- **Transcript hygiene**(실행 전 provider별 수정)
- **컨텍스트 제한**(컨텍스트 창 vs 추적된 token)
- **Compaction**(수동 + 자동 Compaction) 및 pre-compaction 작업을 hook할 위치
- **무음 하우스키핑**(예: 사용자에게 보이는 출력 없이 수행되어야 하는 메모리 쓰기)

먼저 더 높은 수준의 개요가 필요하면 다음부터 시작하세요:

- [세션 관리](/ko/concepts/session)
- [Compaction](/ko/concepts/compaction)
- [메모리 개요](/ko/concepts/memory)
- [메모리 검색](/ko/concepts/memory-search)
- [세션 정리](/ko/concepts/session-pruning)
- [Transcript hygiene](/ko/reference/transcript-hygiene)

---

## 진실의 원천: Gateway

OpenClaw는 세션 상태를 소유하는 단일 **Gateway 프로세스**를 중심으로 설계되었습니다.

- UI(macOS 앱, 웹 Control UI, TUI)는 세션 목록과 token 수를 Gateway에 질의해야 합니다.
- 원격 모드에서는 세션 파일이 원격 호스트에 있으므로, “로컬 Mac 파일을 확인”해도 Gateway가 실제로 사용하는 내용과 일치하지 않습니다.

---

## 두 개의 영속화 계층

OpenClaw는 세션을 두 계층으로 영속화합니다:

1. **세션 저장소(`sessions.json`)**
   - 키/값 맵: `sessionKey -> SessionEntry`
   - 작고, 변경 가능하며, 안전하게 편집 가능(또는 항목 삭제 가능)
   - 세션 메타데이터(현재 세션 ID, 마지막 활동, 토글, token 카운터 등)를 추적

2. **Transcript (`<sessionId>.jsonl`)**
   - 트리 구조를 가진 append-only transcript(항목은 `id` + `parentId`를 가짐)
   - 실제 대화 + 도구 호출 + Compaction 요약을 저장
   - 향후 턴을 위한 모델 컨텍스트를 다시 구성하는 데 사용

---

## 디스크 상 위치

Gateway 호스트에서, 에이전트별 위치:

- 저장소: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram topic 세션: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw는 `src/config/sessions.ts`를 통해 이를 해석합니다.

---

## 저장소 유지보수 및 디스크 제어

세션 영속화에는 `sessions.json`과 transcript 아티팩트에 대한 자동 유지보수 제어(`session.maintenance`)가 있습니다:

- `mode`: `warn`(기본값) 또는 `enforce`
- `pruneAfter`: 오래된 항목의 연령 기준값(기본값 `30d`)
- `maxEntries`: `sessions.json`의 최대 항목 수(기본값 `500`)
- `rotateBytes`: 너무 커졌을 때 `sessions.json` 회전(기본값 `10mb`)
- `resetArchiveRetention`: `*.reset.<timestamp>` transcript archive의 보존 기간(기본값: `pruneAfter`와 동일, `false`면 정리 비활성화)
- `maxDiskBytes`: 선택적 세션 디렉터리 용량 한도
- `highWaterBytes`: 정리 후 목표 용량(기본값 `maxDiskBytes`의 `80%`)

디스크 용량 정리 적용 순서(`mode: "enforce"`):

1. 가장 오래된 archive 또는 orphan transcript 아티팩트부터 제거
2. 여전히 목표보다 크면, 가장 오래된 세션 항목과 해당 transcript 파일 제거
3. 사용량이 `highWaterBytes` 이하가 될 때까지 계속

`mode: "warn"`에서는 OpenClaw가 잠재적인 제거를 보고만 하고 저장소/파일은 변경하지 않습니다.

필요 시 유지보수를 실행하세요:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 세션 및 실행 로그

격리된 Cron 실행도 세션 항목/transcript를 생성하며, 전용 보존 제어가 있습니다:

- `cron.sessionRetention`(기본값 `24h`)은 세션 저장소에서 오래된 격리 Cron 실행 세션을 정리합니다(`false`면 비활성화).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl` 파일을 정리합니다(기본값: `2_000_000` bytes 및 `2000`줄).

Cron이 새 격리 실행 세션을 강제로 생성할 때는 새 행을 쓰기 전에
이전 `cron:<jobId>` 세션 항목을 정리합니다. thinking/fast/verbose 설정,
라벨, 명시적으로 사용자가 선택한 모델/auth 재정의 같은 안전한 기본 설정은 유지합니다.
반면 채널/그룹 라우팅, send 또는 queue 정책, 권한 상승, origin, ACP
런타임 바인딩 같은 주변 대화 컨텍스트는 제거하여, 새 격리 실행이 오래된 실행의
오래된 전달 또는 런타임 권한을 상속하지 못하게 합니다.

---

## 세션 키(`sessionKey`)

`sessionKey`는 _현재 어떤 대화 버킷_에 있는지를 식별합니다(라우팅 + 격리).

일반적인 패턴:

- 메인/직접 채팅(에이전트별): `agent:<agentId>:<mainKey>` (기본값 `main`)
- 그룹: `agent:<agentId>:<channel>:group:<id>`
- room/channel(Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` 또는 `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>`(재정의하지 않은 경우)

정규 규칙은 [/concepts/session](/ko/concepts/session)에 문서화되어 있습니다.

---

## 세션 ID(`sessionId`)

각 `sessionKey`는 현재 `sessionId`(대화를 계속 이어가는 transcript 파일)를 가리킵니다.

경험칙:

- **재설정**(`/new`, `/reset`)은 해당 `sessionKey`에 대해 새 `sessionId`를 생성합니다.
- **일일 재설정**(기본값: Gateway 호스트의 현지 시간 오전 4:00)은 재설정 경계 이후 첫 메시지에서 새 `sessionId`를 생성합니다.
- **유휴 만료**(`session.reset.idleMinutes` 또는 레거시 `session.idleMinutes`)는 유휴 시간 창 이후 메시지가 도착하면 새 `sessionId`를 생성합니다. 일일 + 유휴가 모두 구성된 경우, 먼저 만료되는 쪽이 우선합니다.
- **시스템 이벤트**(Heartbeat, Cron wakeup, exec 알림, Gateway bookkeeping)는 세션 행을 변경할 수는 있지만 일일/유휴 재설정 freshness를 연장하지는 않습니다. 재설정 롤오버는 새 프롬프트를 만들기 전에 이전 세션에 대해 대기 중이던 시스템 이벤트 알림을 버립니다.
- **thread parent fork guard**(`session.parentForkMaxTokens`, 기본값 `100000`)는 부모 세션이 이미 너무 큰 경우 부모 transcript 포킹을 건너뜁니다. 이 경우 새 thread는 새로 시작합니다. 비활성화하려면 `0`으로 설정하세요.

구현 세부 사항: 이 결정은 `src/auto-reply/reply/session.ts`의 `initSessionState()`에서 이루어집니다.

---

## 세션 저장소 스키마(`sessions.json`)

저장소 값 타입은 `src/config/sessions.ts`의 `SessionEntry`입니다.

주요 필드(전부는 아님):

- `sessionId`: 현재 transcript ID(`sessionFile`이 설정되지 않았다면 파일 이름은 여기에서 파생)
- `sessionStartedAt`: 현재 `sessionId`의 시작 타임스탬프. 일일 재설정
  freshness는 이를 사용합니다. 레거시 행은 JSONL 세션 헤더에서 이를 유도할 수 있습니다.
- `lastInteractionAt`: 마지막 실제 사용자/채널 상호작용 타임스탬프. 유휴 재설정
  freshness는 Heartbeat, Cron, exec 이벤트가 세션을 계속 살아 있게 만들지 않도록 이를 사용합니다.
  이 필드가 없는 레거시 행은 유휴 freshness를 위해 복구된 세션 시작 시각으로 fallback합니다.
- `updatedAt`: 마지막 저장소 행 변경 타임스탬프. 목록 표시, 정리, bookkeeping에 사용됩니다.
  일일/유휴 재설정 freshness의 권위 있는 기준은 아닙니다.
- `sessionFile`: 선택적 명시적 transcript 경로 재정의
- `chatType`: `direct | group | room` (UI 및 전송 정책에 도움)
- `provider`, `subject`, `room`, `space`, `displayName`: 그룹/채널 라벨링용 메타데이터
- 토글:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy`(세션별 재정의)
- 모델 선택:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- token 카운터(최선형 / provider 의존적):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: 이 세션 키에서 자동 Compaction이 완료된 횟수
- `memoryFlushAt`: 마지막 pre-compaction 메모리 flush의 타임스탬프
- `memoryFlushCompactionCount`: 마지막 flush가 실행되었을 때의 Compaction 횟수

저장소는 안전하게 편집할 수 있지만, Gateway가 권위 있는 기준입니다. 세션이 실행되면서 항목을 다시 쓰거나 재hydrate할 수 있습니다.

---

## Transcript 구조(`*.jsonl`)

Transcript는 `@mariozechner/pi-coding-agent`의 `SessionManager`로 관리됩니다.

파일은 JSONL 형식입니다:

- 첫 줄: 세션 헤더(`type: "session"`, `id`, `cwd`, `timestamp`, 선택적 `parentSession` 포함)
- 이후: `id` + `parentId`를 가진 세션 항목(트리 구조)

주요 항목 타입:

- `message`: user/assistant/toolResult 메시지
- `custom_message`: 모델 컨텍스트에 _들어가는_ 확장 주입 메시지(UI에서는 숨길 수 있음)
- `custom`: 모델 컨텍스트에는 _들어가지 않는_ 확장 상태
- `compaction`: `firstKeptEntryId`와 `tokensBefore`를 가진 영속화된 Compaction 요약
- `branch_summary`: 트리 분기를 탐색할 때 영속화된 요약

OpenClaw는 의도적으로 transcript를 **수정하지 않습니다**. Gateway는 이를 읽고 쓰기 위해 `SessionManager`를 사용합니다.

---

## 컨텍스트 창 vs 추적된 token

두 가지 다른 개념이 중요합니다:

1. **모델 컨텍스트 창**: 모델별 하드 한도(모델이 볼 수 있는 token)
2. **세션 저장소 카운터**: `sessions.json`에 기록되는 롤링 통계(`/status`와 대시보드에 사용)

제한을 조정하는 경우:

- 컨텍스트 창은 모델 카탈로그에서 오며(구성으로 재정의 가능)
- 저장소의 `contextTokens`는 런타임 추정/보고 값입니다. 이를 엄격한 보장으로 취급하지 마세요.

자세한 내용은 [/token-use](/ko/reference/token-use)를 참조하세요.

---

## Compaction: 무엇인가

Compaction은 transcript에 영속화된 `compaction` 항목으로 오래된 대화를 요약하고, 최근 메시지는 그대로 유지합니다.

Compaction 이후 향후 턴은 다음을 보게 됩니다:

- Compaction 요약
- `firstKeptEntryId` 이후의 메시지

Compaction은 **영속적**입니다(세션 정리와 다름). [/concepts/session-pruning](/ko/concepts/session-pruning)을 참조하세요.

## Compaction chunk 경계와 도구 페어링

OpenClaw가 긴 transcript를 Compaction chunk로 나눌 때는
어시스턴트 도구 호출과 이에 대응하는 `toolResult` 항목을 함께 유지합니다.

- token-share 분할 지점이 도구 호출과 그 결과 사이에 걸리면, OpenClaw는
  경계를 페어를 분리하지 않도록 assistant 도구 호출 메시지 쪽으로 이동시킵니다.
- 뒤따르는 tool-result 블록 때문에 chunk가 목표를 넘게 될 경우,
  OpenClaw는 해당 대기 중 도구 블록을 보존하고 요약되지 않은 tail을 그대로 유지합니다.
- 중단되었거나 오류가 난 tool-call 블록은 대기 중 분할을 계속 열어 두지 않습니다.

---

## 자동 Compaction이 발생하는 시점(Pi 런타임)

내장 Pi 에이전트에서 자동 Compaction은 두 경우에 트리거됩니다:

1. **오버플로 복구**: 모델이 컨텍스트 오버플로 오류를 반환하는 경우
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` 및 유사한 provider별 변형) → compact → retry.
2. **임계값 유지보수**: 성공적인 턴 이후 다음 조건일 때:

`contextTokens > contextWindow - reserveTokens`

여기서:

- `contextWindow`는 모델의 컨텍스트 창
- `reserveTokens`는 프롬프트 + 다음 모델 출력용으로 예약된 여유 공간

이것은 Pi 런타임 의미 체계입니다(OpenClaw는 이벤트를 소비하지만, 언제 Compaction할지는 Pi가 결정합니다).

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

OpenClaw는 내장 실행에 대해 안전 하한도 적용합니다:

- `compaction.reserveTokens < reserveTokensFloor`이면 OpenClaw가 값을 올립니다.
- 기본 하한은 `20000` token입니다.
- 하한을 비활성화하려면 `agents.defaults.compaction.reserveTokensFloor: 0`으로 설정하세요.
- 이미 더 높으면 OpenClaw는 그대로 둡니다.
- 수동 `/compact`는 명시적인 `agents.defaults.compaction.keepRecentTokens`를 존중하며
  Pi의 최근 tail 절단 지점을 유지합니다. 명시적 keep 예산이 없으면,
  수동 Compaction은 hard checkpoint로 유지되며 재구성된 컨텍스트는
  새 요약에서부터 시작합니다.

이유: Compaction이 불가피해지기 전에 메모리 쓰기 같은 다중 턴 “housekeeping”을 위한 충분한 여유 공간을 남겨두기 위해서입니다.

구현: `src/agents/pi-settings.ts`의 `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts`에서 호출됨).

---

## 플러그형 Compaction provider

Plugin은 plugin API의 `registerCompactionProvider()`를 통해 Compaction provider를 등록할 수 있습니다. `agents.defaults.compaction.provider`가 등록된 provider id로 설정되면, safeguard extension은 내장 `summarizeInStages` 파이프라인 대신 해당 provider에 요약을 위임합니다.

- `provider`: 등록된 Compaction provider plugin의 id입니다. 기본 LLM 요약을 사용하려면 설정하지 마세요.
- `provider`를 설정하면 `mode: "safeguard"`가 강제됩니다.
- Provider는 내장 경로와 동일한 Compaction 지침 및 식별자 보존 정책을 받습니다.
- safeguard는 provider 출력 이후에도 최근 turn 및 분할 turn 접미사 컨텍스트를 계속 보존합니다.
- 내장 safeguard 요약은 전체 이전 요약을 그대로 보존하는 대신,
  새 메시지와 함께 이전 요약을 다시 정제합니다.
- Safeguard 모드는 기본적으로 요약 품질 감사를 활성화합니다. 재시도-잘못된-출력 동작을 건너뛰려면
  `qualityGuard.enabled: false`로 설정하세요.
- provider가 실패하거나 빈 결과를 반환하면, OpenClaw는 자동으로 내장 LLM 요약으로 대체합니다.
- 중단/타임아웃 신호는 호출자 취소를 존중하기 위해 다시 throw됩니다(삼키지 않음).

출처: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## 사용자에게 표시되는 표면

다음에서 Compaction 및 세션 상태를 확인할 수 있습니다:

- `/status`(모든 채팅 세션에서)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- 자세한 모드: `🧹 Auto-compaction complete` + Compaction 횟수

---

## 자동 정리(`NO_REPLY`)

OpenClaw는 사용자가 중간 출력을 보지 않아야 하는 백그라운드 작업을 위해 “silent” turn을 지원합니다.

규약:

- assistant는 출력 시작 부분에 정확한 silent 토큰 `NO_REPLY` /
  `no_reply`를 넣어 “사용자에게 응답을 전달하지 않음”을 나타냅니다.
- OpenClaw는 전달 계층에서 이를 제거/억제합니다.
- 정확한 silent 토큰 억제는 대소문자를 구분하지 않으므로, 전체 페이로드가 silent 토큰뿐인 경우 `NO_REPLY`와
  `no_reply`는 모두 해당됩니다.
- 이것은 진짜 백그라운드/무전달 turn 전용이며, 일반적인 실행 가능한 사용자 요청을 위한
  단축 방식이 아닙니다.

`2026.1.10`부터 OpenClaw는
부분 청크가 `NO_REPLY`로 시작할 때 **초안/타이핑 스트리밍**도 억제하므로, silent 작업이
turn 도중 부분 출력을 유출하지 않습니다.

---

## Compaction 전 "메모리 플러시"(구현됨)

목표: 자동 Compaction이 발생하기 전에, 디스크에 영속 상태를 기록하는
silent agentic turn을 실행합니다(예: 에이전트 워크스페이스의 `memory/YYYY-MM-DD.md`). 이렇게 하면 Compaction이
중요한 컨텍스트를 지워버릴 수 없습니다.

OpenClaw는 **사전 임계값 플러시** 방식을 사용합니다:

1. 세션 컨텍스트 사용량을 모니터링합니다.
2. 사용량이 “소프트 임계값”(Pi의 Compaction 임계값보다 낮음)을 넘으면, silent
   “지금 메모리 쓰기” 지시를 에이전트에 실행합니다.
3. 사용자가 아무것도 보지 않도록 정확한 silent 토큰 `NO_REPLY` / `no_reply`를
   사용합니다.

설정(`agents.defaults.compaction.memoryFlush`):

- `enabled`(기본값: `true`)
- `softThresholdTokens`(기본값: `4000`)
- `prompt`(플러시 turn용 사용자 메시지)
- `systemPrompt`(플러시 turn에 추가되는 추가 system prompt)

참고:

- 기본 prompt/system prompt에는 전달을 억제하기 위한 `NO_REPLY` 힌트가 포함됩니다.
- 플러시는 Compaction 주기마다 한 번 실행됩니다(`sessions.json`에서 추적).
- 플러시는 임베디드 Pi 세션에서만 실행됩니다(CLI 백엔드는 건너뜀).
- 세션 워크스페이스가 읽기 전용인 경우 플러시는 건너뜁니다(`workspaceAccess: "ro"` 또는 `"none"`).
- 워크스페이스 파일 레이아웃 및 쓰기 패턴은 [Memory](/ko/concepts/memory)를 참조하세요.

Pi는 extension API에서 `session_before_compact` hook도 노출하지만, OpenClaw의
플러시 로직은 현재 Gateway 측에 있습니다.

---

## 문제 해결 체크리스트

- 세션 키가 잘못되었나요? [/concepts/session](/ko/concepts/session)부터 시작해서 `/status`의 `sessionKey`를 확인하세요.
- 저장소와 transcript가 일치하지 않나요? `openclaw status`에서 Gateway 호스트와 저장소 경로를 확인하세요.
- Compaction이 너무 자주 발생하나요? 다음을 확인하세요:
  - 모델 컨텍스트 창이 너무 작음
  - Compaction 설정(`reserveTokens`가 모델 창에 비해 너무 높으면 더 이른 Compaction이 발생할 수 있음)
  - 도구 결과 비대화: 세션 pruning을 활성화/조정하세요
- silent turn이 새어나오나요? 응답이 `NO_REPLY`(대소문자 구분 없는 정확한 토큰)로 시작하는지, 그리고 스트리밍 억제 수정이 포함된 빌드를 사용 중인지 확인하세요.

## 관련

- [세션 관리](/ko/concepts/session)
- [세션 pruning](/ko/concepts/session-pruning)
- [컨텍스트 엔진](/ko/concepts/context-engine)
