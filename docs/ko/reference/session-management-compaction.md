---
read_when:
    - 세션 ID, transcript JSONL 또는 `sessions.json` 필드를 디버깅해야 합니다
    - 자동 Compaction 동작을 변경하거나 “사전 Compaction” 하우스키핑을 추가하고 있습니다
    - 메모리 플러시 또는 무음 시스템 턴을 구현하려고 합니다
summary: '심층 분석: 세션 저장소 + transcript, 수명 주기, 그리고 (자동)Compaction 내부 구조'
title: 세션 관리 심층 분석
x-i18n:
    generated_at: "2026-04-25T06:10:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: f15b8cf4b1deb947b292c6931257218d7147c11c963e7bf2689b6d1f77ea8159
    source_path: reference/session-management-compaction.md
    workflow: 15
---

이 페이지는 OpenClaw가 세션을 종단 간으로 어떻게 관리하는지 설명합니다:

- **세션 라우팅** (인바운드 메시지가 어떻게 `sessionKey`에 매핑되는지)
- **세션 저장소** (`sessions.json`)와 그 추적 항목
- **Transcript 영속화** (`*.jsonl`)와 그 구조
- **Transcript 위생** (실행 전 provider별 수정)
- **컨텍스트 제한** (컨텍스트 창 vs 추적 토큰)
- **Compaction** (수동 + 자동 Compaction)과 사전 Compaction 작업을 Hook할 위치
- **무음 하우스키핑** (예: 사용자에게 보이는 출력을 만들지 않아야 하는 메모리 쓰기)

먼저 더 높은 수준의 개요가 필요하다면 다음부터 시작하세요:

- [Session management](/ko/concepts/session)
- [Compaction](/ko/concepts/compaction)
- [Memory overview](/ko/concepts/memory)
- [Memory search](/ko/concepts/memory-search)
- [Session pruning](/ko/concepts/session-pruning)
- [Transcript hygiene](/ko/reference/transcript-hygiene)

---

## 단일 진실 공급원: Gateway

OpenClaw는 세션 상태를 소유하는 단일 **Gateway 프로세스**를 중심으로 설계되었습니다.

- UI(macOS 앱, 웹 Control UI, TUI)는 Gateway에 세션 목록과 토큰 수를 질의해야 합니다.
- 원격 모드에서는 세션 파일이 원격 호스트에 있으므로, “로컬 Mac 파일 확인”으로는 Gateway가 실제 사용하는 내용을 반영하지 않습니다.

---

## 두 개의 영속화 계층

OpenClaw는 세션을 두 계층으로 영속화합니다:

1. **세션 저장소 (`sessions.json`)**
   - 키/값 맵: `sessionKey -> SessionEntry`
   - 작고 가변적이며 편집(또는 항목 삭제)해도 안전함
   - 세션 메타데이터(현재 세션 ID, 마지막 활동, 토글, 토큰 카운터 등)를 추적

2. **Transcript (`<sessionId>.jsonl`)**
   - 트리 구조를 가진 append-only transcript(항목에는 `id` + `parentId`가 있음)
   - 실제 대화 + 도구 호출 + Compaction 요약을 저장
   - 향후 턴을 위한 모델 컨텍스트 재구성에 사용됨

---

## 디스크 상 위치

Gateway 호스트에서, 에이전트별:

- 저장소: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcript: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram topic 세션: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw는 `src/config/sessions.ts`를 통해 이 경로를 확인합니다.

---

## 저장소 유지 관리 및 디스크 제어

세션 영속화에는 `sessions.json` 및 transcript 아티팩트용 자동 유지 관리 제어(`session.maintenance`)가 있습니다:

- `mode`: `warn` (기본값) 또는 `enforce`
- `pruneAfter`: 오래된 항목의 나이 기준선(기본값 `30d`)
- `maxEntries`: `sessions.json`의 항목 상한(기본값 `500`)
- `rotateBytes`: 크기가 너무 커지면 `sessions.json` 회전(기본값 `10mb`)
- `resetArchiveRetention`: `*.reset.<timestamp>` transcript 아카이브의 보존 기간(기본값: `pruneAfter`와 동일, `false`면 정리 비활성화)
- `maxDiskBytes`: 선택적 세션 디렉터리 예산
- `highWaterBytes`: 정리 후 목표값(기본값 `maxDiskBytes`의 `80%`)

디스크 예산 정리 강제 적용 순서 (`mode: "enforce"`):

1. 가장 오래된 아카이브 또는 orphan transcript 아티팩트를 먼저 제거합니다.
2. 여전히 목표값보다 크면 가장 오래된 세션 항목과 해당 transcript 파일을 제거합니다.
3. 사용량이 `highWaterBytes` 이하가 될 때까지 계속합니다.

`mode: "warn"`에서는 OpenClaw가 잠재적인 제거 대상을 보고하지만 저장소/파일을 변경하지는 않습니다.

필요 시 유지 관리 실행:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron 세션 및 실행 로그

격리된 Cron 실행도 세션 항목/transcript를 만들며, 이에 대한 전용 보존 제어도 있습니다:

- `cron.sessionRetention` (기본값 `24h`)은 세션 저장소에서 오래된 격리 Cron 실행 세션을 정리합니다(`false`면 비활성화).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines`는 `~/.openclaw/cron/runs/<jobId>.jsonl` 파일을 정리합니다(기본값: `2_000_000` bytes 및 `2000` lines).

Cron이 새로운 격리 실행 세션을 강제로 만들 때는 새 행을 기록하기 전에 이전
`cron:<jobId>` 세션 항목을 정리합니다. 여기에는 thinking/fast/verbose 설정,
레이블, 명시적으로 사용자가 선택한 모델/auth 재정의 같은 안전한 기본 설정은 유지됩니다. 하지만
채널/그룹 라우팅, 전송 또는 큐 정책, 권한 상승, origin, ACP
런타임 바인딩 같은 주변 대화 컨텍스트는 제거되므로 새로운 격리 실행이 이전 실행의 오래된 전송 또는
런타임 권한을 상속할 수 없습니다.

---

## 세션 키 (`sessionKey`)

`sessionKey`는 _어느 대화 버킷에 있는지_를 식별합니다(라우팅 + 격리).

일반적인 패턴:

- 메인/direct chat (에이전트별): `agent:<agentId>:<mainKey>` (기본값 `main`)
- 그룹: `agent:<agentId>:<channel>:group:<id>`
- room/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` 또는 `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (재정의되지 않는 한)

정식 규칙은 [/concepts/session](/ko/concepts/session)에 문서화되어 있습니다.

---

## 세션 ID (`sessionId`)

각 `sessionKey`는 현재 `sessionId`(대화를 계속 이어가는 transcript 파일)를 가리킵니다.

경험칙:

- **Reset** (`/new`, `/reset`)은 해당 `sessionKey`에 대해 새 `sessionId`를 생성합니다.
- **일일 reset** (기본값: Gateway 호스트 로컬 시간 기준 오전 4:00)은 reset 경계 이후 다음 메시지에서 새 `sessionId`를 만듭니다.
- **유휴 만료** (`session.reset.idleMinutes` 또는 레거시 `session.idleMinutes`)는 유휴 창 이후 메시지가 도착하면 새 `sessionId`를 생성합니다. 일일 reset과 idle이 모두 구성된 경우 먼저 만료되는 쪽이 우선합니다.
- **스레드 부모 fork guard** (`session.parentForkMaxTokens`, 기본값 `100000`)는 부모 세션이 이미 너무 클 때 부모 transcript 포크를 건너뜁니다. 새 스레드는 새로 시작됩니다. 비활성화하려면 `0`으로 설정하세요.

구현 세부 사항: 이 결정은 `src/auto-reply/reply/session.ts`의 `initSessionState()`에서 이루어집니다.

---

## 세션 저장소 스키마 (`sessions.json`)

저장소의 값 타입은 `src/config/sessions.ts`의 `SessionEntry`입니다.

주요 필드(전체는 아님):

- `sessionId`: 현재 transcript ID (`sessionFile`이 설정되지 않은 경우 파일명은 이 값에서 파생됨)
- `updatedAt`: 마지막 활동 타임스탬프
- `sessionFile`: 선택적 명시적 transcript 경로 재정의
- `chatType`: `direct | group | room` (UI 및 전송 정책에 도움)
- `provider`, `subject`, `room`, `space`, `displayName`: 그룹/채널 레이블용 메타데이터
- 토글:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (세션별 재정의)
- 모델 선택:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- 토큰 카운터(best-effort / provider 종속):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: 이 session key에 대해 자동 Compaction이 완료된 횟수
- `memoryFlushAt`: 마지막 사전 Compaction 메모리 플러시의 타임스탬프
- `memoryFlushCompactionCount`: 마지막 플러시가 실행된 시점의 Compaction 횟수

저장소는 편집해도 안전하지만, Gateway가 권위자입니다: 세션이 실행되면서 항목을 다시 쓰거나 재수화할 수 있습니다.

---

## Transcript 구조 (`*.jsonl`)

Transcript는 `@mariozechner/pi-coding-agent`의 `SessionManager`가 관리합니다.

파일은 JSONL 형식입니다:

- 첫 줄: 세션 헤더 (`type: "session"`, `id`, `cwd`, `timestamp`, 선택적 `parentSession` 포함)
- 그다음: `id` + `parentId`를 가진 세션 항목(트리)

주목할 항목 타입:

- `message`: user/assistant/toolResult 메시지
- `custom_message`: 모델 컨텍스트에 _들어가는_ extension 주입 메시지(UI에서는 숨길 수 있음)
- `custom`: 모델 컨텍스트에는 _들어가지 않는_ extension 상태
- `compaction`: `firstKeptEntryId` 및 `tokensBefore`를 가진 영속화된 Compaction 요약
- `branch_summary`: 트리 브랜치를 탐색할 때의 영속화된 요약

OpenClaw는 의도적으로 transcript를 “수정”하지 않습니다. Gateway는 `SessionManager`를 사용해 이를 읽고 씁니다.

---

## 컨텍스트 창 vs 추적 토큰

서로 다른 두 개념이 중요합니다:

1. **모델 컨텍스트 창**: 모델별 하드 상한(모델에 보이는 토큰)
2. **세션 저장소 카운터**: `sessions.json`에 기록되는 롤링 통계(`/status` 및 대시보드에 사용)

제한을 조정할 때:

- 컨텍스트 창은 모델 카탈로그에서 오며 config로 재정의할 수 있습니다.
- 저장소의 `contextTokens`는 런타임 추정/보고 값이므로 엄격한 보장으로 취급하지 마세요.

자세한 내용은 [/token-use](/ko/reference/token-use)를 참조하세요.

---

## Compaction: 무엇인가

Compaction은 오래된 대화를 transcript 안의 영속화된 `compaction` 항목으로 요약하고, 최근 메시지는 그대로 유지합니다.

Compaction 후 향후 턴에서는 다음이 보입니다:

- Compaction 요약
- `firstKeptEntryId` 이후의 메시지

Compaction은 **영속적**입니다(세션 pruning과 다름). [/concepts/session-pruning](/ko/concepts/session-pruning)을 참조하세요.

## Compaction 청크 경계 및 도구 페어링

OpenClaw가 긴 transcript를 Compaction 청크로 나눌 때는
assistant 도구 호출과 해당하는 `toolResult` 항목이 함께 유지되도록 합니다.

- 토큰 분할 지점이 도구 호출과 그 결과 사이에 걸리면, OpenClaw는
  페어를 분리하는 대신 경계를 assistant 도구 호출 메시지로 이동합니다.
- 뒤따르는 tool-result 블록 때문에 청크가 목표 크기를 초과하게 될 경우,
  OpenClaw는 해당 보류 도구 블록을 보존하고 요약되지 않은 꼬리 부분을
  그대로 유지합니다.
- 중단되었거나 오류가 난 도구 호출 블록은 보류 중인 분할을 계속 열어두지 않습니다.

---

## 자동 Compaction이 발생하는 시점 (Pi 런타임)

임베디드 Pi 에이전트에서 자동 Compaction은 두 경우에 트리거됩니다:

1. **오버플로 복구**: 모델이 컨텍스트 오버플로 오류를 반환할 때
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, 및 유사한 provider별 변형) → compact → retry.
2. **임계값 유지 관리**: 성공적인 턴 이후 다음 조건일 때:

`contextTokens > contextWindow - reserveTokens`

여기서:

- `contextWindow`는 모델의 컨텍스트 창
- `reserveTokens`는 프롬프트 + 다음 모델 출력용으로 예약된 여유 공간

이들은 Pi 런타임 의미론입니다(OpenClaw는 이벤트를 소비하지만, Compaction 시점은 Pi가 결정합니다).

---

## Compaction 설정 (`reserveTokens`, `keepRecentTokens`)

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

OpenClaw는 임베디드 실행에 대해 안전 하한도 강제 적용합니다:

- `compaction.reserveTokens < reserveTokensFloor`이면 OpenClaw가 값을 올립니다.
- 기본 하한은 `20000` 토큰입니다.
- 하한을 비활성화하려면 `agents.defaults.compaction.reserveTokensFloor: 0`을 설정하세요.
- 이미 더 높다면 OpenClaw는 그대로 둡니다.
- 수동 `/compact`는 명시적인 `agents.defaults.compaction.keepRecentTokens`
  를 존중하고 Pi의 최근 꼬리 잘라내기 지점을 유지합니다. 명시적인 keep 예산이
  없으면 수동 Compaction은 하드 체크포인트로 유지되고 재구성된 컨텍스트는
  새 요약에서 시작합니다.

이유: Compaction이 불가피해지기 전에 메모리 쓰기 같은 다중 턴 “하우스키핑”을 위한
충분한 여유 공간을 남겨두기 위함입니다.

구현: `src/agents/pi-settings.ts`의 `ensurePiCompactionReserveTokens()`
(`src/agents/pi-embedded-runner.ts`에서 호출됨).

---

## 플러그형 Compaction provider

Plugin은 plugin API의 `registerCompactionProvider()`를 통해 Compaction provider를 등록할 수 있습니다. `agents.defaults.compaction.provider`가 등록된 provider ID로 설정되면, safeguard extension은 내장 `summarizeInStages` 파이프라인 대신 해당 provider에 요약을 위임합니다.

- `provider`: 등록된 Compaction provider Plugin의 ID입니다. 기본 LLM 요약을 사용하려면 설정하지 마세요.
- `provider`를 설정하면 `mode: "safeguard"`가 강제됩니다.
- Provider는 내장 경로와 동일한 Compaction 지침 및 식별자 보존 정책을 받습니다.
- safeguard는 provider 출력 이후에도 최근 턴 및 분할 턴 접미사 컨텍스트를 계속 보존합니다.
- 내장 safeguard 요약은 이전 전체 요약을 그대로 보존하는 대신
  이전 요약을 새 메시지와 함께 다시 증류합니다.
- safeguard 모드는 기본적으로 요약 품질 감사를 활성화합니다. 잘못된 출력 시 재시도 동작을 건너뛰려면
  `qualityGuard.enabled: false`를 설정하세요.
- provider가 실패하거나 빈 결과를 반환하면 OpenClaw는 자동으로 내장 LLM 요약으로 대체합니다.
- Abort/timeout 신호는 호출자 취소를 존중하기 위해 다시 throw되며(삼켜지지 않음) 처리됩니다.

소스: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## 사용자에게 보이는 표면

다음으로 Compaction 및 세션 상태를 관찰할 수 있습니다:

- `/status` (모든 채팅 세션에서)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- 상세 모드: `🧹 Auto-compaction complete` + Compaction 횟수

---

## 무음 하우스키핑 (`NO_REPLY`)

OpenClaw는 사용자가 중간 출력을 보지 않아야 하는 백그라운드 작업용 “무음” 턴을 지원합니다.

규약:

- assistant는 출력 시작에 정확한 무음 토큰 `NO_REPLY` /
  `no_reply`를 넣어 “사용자에게 답장을 전달하지 말라”는 뜻을 나타냅니다.
- OpenClaw는 전송 계층에서 이를 제거/억제합니다.
- 정확한 무음 토큰 억제는 대소문자를 구분하지 않으므로, payload 전체가 무음 토큰뿐일 때
  `NO_REPLY`와 `no_reply` 둘 다 유효합니다.
- 이것은 진정한 백그라운드/무전송 턴 전용이며,
  일반적인 실행 가능한 사용자 요청을 위한 지름길이 아닙니다.

`2026.1.10`부터 OpenClaw는
부분 청크가 `NO_REPLY`로 시작할 때 **초안/입력 중 스트리밍**도 억제하므로, 무음 작업이 턴 중간에
부분 출력을 새어 나오지 않게 합니다.

---

## 사전 Compaction "메모리 플러시" (구현됨)

목표: 자동 Compaction이 발생하기 전에, 디스크에 durable
상태를 쓰는 무음 agentic 턴을 실행합니다(예: 에이전트 워크스페이스의 `memory/YYYY-MM-DD.md`). 이렇게 하면 Compaction이
중요한 컨텍스트를 지울 수 없습니다.

OpenClaw는 **사전 임계값 플러시** 접근 방식을 사용합니다:

1. 세션 컨텍스트 사용량을 모니터링합니다.
2. “소프트 임계값”(Pi의 Compaction 임계값보다 낮음)을 넘으면, agent에
   무음 “지금 메모리 쓰기” 지시를 실행합니다.
3. 사용자가 아무것도 보지 않도록 정확한 무음 토큰 `NO_REPLY` / `no_reply`를 사용합니다.

config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (기본값: `true`)
- `softThresholdTokens` (기본값: `4000`)
- `prompt` (플러시 턴용 사용자 메시지)
- `systemPrompt` (플러시 턴에 추가되는 추가 시스템 프롬프트)

참고:

- 기본 prompt/system prompt에는 전송을 억제하기 위한
  `NO_REPLY` 힌트가 포함됩니다.
- 플러시는 Compaction 주기마다 한 번 실행됩니다(`sessions.json`에서 추적).
- 플러시는 임베디드 Pi 세션에서만 실행됩니다(CLI backend는 이를 건너뜀).
- 세션 워크스페이스가 읽기 전용(`workspaceAccess: "ro"` 또는 `"none"`)이면 플러시는 건너뜁니다.
- 워크스페이스 파일 레이아웃과 쓰기 패턴은 [Memory](/ko/concepts/memory)를 참조하세요.

Pi는 extension API에서 `session_before_compact` Hook도 노출하지만, OpenClaw의
플러시 로직은 현재 Gateway 측에 있습니다.

---

## 문제 해결 체크리스트

- 세션 키가 잘못되었나요? [/concepts/session](/ko/concepts/session)부터 시작하고 `/status`의 `sessionKey`를 확인하세요.
- 저장소와 transcript가 불일치하나요? Gateway 호스트와 `openclaw status`의 저장소 경로를 확인하세요.
- Compaction이 너무 자주 발생하나요? 다음을 확인하세요:
  - 모델 컨텍스트 창(너무 작음)
  - Compaction 설정(모델 창에 비해 `reserveTokens`가 너무 크면 더 이른 Compaction이 발생할 수 있음)
  - tool-result 비대화: 세션 pruning을 활성화/조정하세요
- 무음 턴이 새고 있나요? 답장이 `NO_REPLY`로 시작하는지(대소문자 구분 없는 정확한 토큰) 확인하고, 스트리밍 억제 수정이 포함된 빌드인지 확인하세요.

## 관련 항목

- [Session management](/ko/concepts/session)
- [Session pruning](/ko/concepts/session-pruning)
- [Context engine](/ko/concepts/context-engine)
