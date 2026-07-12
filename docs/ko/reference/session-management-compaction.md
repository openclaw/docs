---
read_when:
    - 세션 ID, 트랜스크립트 이벤트 또는 세션 행 필드를 디버깅해야 합니다.
    - 자동 Compaction 동작을 변경하거나 "Compaction 전" 정리 작업을 추가합니다
    - 메모리 플러시 또는 무응답 시스템 턴을 구현하려고 합니다
summary: '심층 분석: 세션 저장소 + 대화 기록, 수명 주기 및 (자동)Compaction 내부 구조'
title: 세션 관리 심층 분석
x-i18n:
    generated_at: "2026-07-12T15:44:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2f06b50dcece64a92c2b35a468910b2069622d14649ab24052a5a7956f9d41d1
    source_path: reference/session-management-compaction.md
    workflow: 16
---

단일 **Gateway 프로세스**가 세션 상태를 처음부터 끝까지 소유합니다. UI(macOS 앱, 웹 Control UI, TUI)는 Gateway에 세션 목록과 토큰 수를 조회합니다. 원격 모드에서는 세션 파일이 원격 호스트에 있으므로 로컬 Mac의 파일을 확인해도 Gateway가 사용하는 내용이 반영되지 않습니다.

먼저 개요 문서를 참조하십시오: [세션 관리](/ko/concepts/session), [Compaction](/ko/concepts/compaction), [메모리 개요](/ko/concepts/memory), [메모리 검색](/ko/concepts/memory-search), [세션 정리](/ko/concepts/session-pruning), [트랜스크립트 위생](/ko/reference/transcript-hygiene), 전체 구성 레퍼런스는 [에이전트 구성](/ko/gateway/config-agents)을 참조하십시오.

## 두 가지 영속성 계층

1. **세션 행(에이전트별 SQLite)** - 키/값 맵 `sessionKey -> SessionEntry`입니다. Gateway가 소유하는 변경 가능한 런타임 상태입니다. 현재 세션 ID, 마지막 활동, 토글, 토큰 카운터 등의 메타데이터를 추적합니다.
2. **트랜스크립트 이벤트(에이전트별 SQLite)** - 추가 전용이며 트리 구조입니다(항목에 `id` + `parentId`가 있음). 대화, 도구 호출, Compaction 요약을 저장하며 이후 턴을 위한 모델 컨텍스트를 다시 구성합니다. Compaction 체크포인트는 압축된 후속 트랜스크립트에 대한 메타데이터입니다. 새 Compaction은 두 번째 `.checkpoint.*.jsonl` 사본을 기록하지 않습니다.

이전 설치에는 에이전트 `sessions/` 디렉터리 아래에 `sessions.json` 파일이 남아 있을 수 있습니다. 이러한 파일은 레거시 세션 행 마이그레이션 입력 또는 명시적인 오프라인 유지 관리 대상으로 취급하십시오. Gateway 시작 및 `openclaw doctor --fix`는 사용 중인 레거시 행과 트랜스크립트 기록을 에이전트별 SQLite 저장소로 자동으로 가져옵니다. 명시적인 검사 또는 검증 증거가 필요하면 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`를 실행한 다음 [Doctor 마이그레이션
순서](/ko/cli/doctor#session-sqlite-migration)를 따르십시오. 레거시 트랜스크립트 아티팩트가 보관된 후 마이그레이션이 실패하면 해당 순서의 Doctor 복구 모드를 사용하십시오. 복구는 마이그레이션 매니페스트를 사용하고, 영향을 받은 보관 지원 아티팩트만 복원하며, 요청 시 정제된 GitHub 이슈 보고서를 준비하고, 활성 런타임이 JSONL 파일을 다시 읽도록 만들지 않습니다.

Gateway 기록 리더는 임의의 과거 접근이 필요한 표면이 아니면 전체 트랜스크립트를 메모리에 구체화하지 않습니다. 첫 페이지 기록, 내장 채팅 기록, 재시작 복구, 토큰/사용량 검사는 SQLite에서 범위가 제한된 꼬리 읽기를 사용합니다. 전체 트랜스크립트 스캔은 비동기 트랜스크립트 인덱스를 거치며 동시 리더 간에 공유됩니다.

## 디스크 내 위치

Gateway 호스트에서 에이전트별 위치는 다음과 같습니다(`src/config/sessions.ts`를 통해 결정됨).

- 런타임 세션 행 저장소: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 런타임 트랜스크립트 행: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 레거시/보관 트랜스크립트 아티팩트: `~/.openclaw/agents/<agentId>/sessions/`
- 레거시 행 마이그레이션 입력: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## 저장소 유지 관리 및 디스크 제어

`session.maintenance`는 SQLite 세션 행, SQLite 트랜스크립트 행, 보관 아티팩트 및 궤적 사이드카의 자동 유지 관리를 제어합니다.

| 키                      | 기본값                | 참고                                                                                          |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------------------- |
| `mode`                  | `"enforce"`           | 또는 `"warn"`(보고만 수행하며 변경하지 않음)                                                  |
| `pruneAfter`            | `"30d"`               | 오래된 항목의 경과 시간 기준                                                                  |
| `maxEntries`            | `500`                 | 세션 항목 수 제한                                                                             |
| `resetArchiveRetention` | 유지(경과 시간 기준 없음) | `*.reset.*`/`*.deleted.*` 트랜스크립트 아카이브의 경과 시간 기준이며, 기간을 지정하면 삭제함 |
| `maxDiskBytes`          | `2gb`                 | 에이전트별 세션 디스크 예산이며, `false`로 비활성화                                            |
| `highWaterBytes`        | `maxDiskBytes`의 80%  | 예산 정리 후 목표값                                                                           |

보관된 트랜스크립트는 기본적으로 유지되며 런타임에서 지원하는 경우 zstd(`*.jsonl.<reason>.<timestamp>.zst`)로 압축됩니다. 따라서 세션을 삭제하거나 재설정해도 대화 기록이 사용자 모르게 폐기되지 않습니다. 디스크 예산 정리 시 활성 세션을 처리하기 전에 가장 오래된 아카이브부터 제거합니다.

`maxDiskBytes`의 활성 SQLite 적용은 세션별 세션 행 JSON과 트랜스크립트 이벤트 JSON의 바이트 수를 측정하며, 레거시 오프라인 유지 관리 적용은 선택한 세션 디렉터리의 파일을 측정합니다.

Gateway 모델 실행 프로브 세션(`agent:*:explicit:model-run-<uuid>`와 일치하는 키)에는 별도의 고정 `24h` 보존 기간이 적용됩니다. 이 정리는 압력 조건에 따라 실행됩니다. 즉, 세션 항목 유지 관리/제한 압력에 도달한 경우에만, 전역 오래된 항목 정리/제한 단계 전에만 실행됩니다. 다른 명시적 세션에는 이 보존 기간이 적용되지 않습니다.

디스크 예산 정리(`mode: "enforce"`)의 적용 순서는 다음과 같습니다.

1. 가장 오래된 보관 트랜스크립트 아티팩트, 소유자가 없는 레거시 아티팩트 또는 소유자가 없는 궤적 아티팩트를 먼저 제거합니다.
2. 여전히 목표값을 초과하면 가장 오래된 세션 항목과 해당 트랜스크립트 행 또는 궤적 아티팩트를 제거합니다.
3. 사용량이 `highWaterBytes` 이하가 될 때까지 반복합니다.

`mode: "warn"`은 저장소나 파일을 변경하지 않고 잠재적인 제거 항목을 보고합니다.

필요할 때 유지 관리를 실행합니다.

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

유지 관리는 그룹 세션 및 스레드 범위 채팅 세션과 같은 지속성 있는 외부 대화 포인터를 보존하지만, 합성 런타임 항목(cron, 훅, heartbeat, ACP, 하위 에이전트)은 구성된 기간, 개수 또는 디스크 예산을 초과하면 여전히 제거될 수 있습니다. 격리된 cron 실행은 모델 실행 프로브 보존과 독립적인 별도의 `cron.sessionRetention` 제어를 사용합니다.

일반적인 Gateway 쓰기는 세션 접근자를 통해 진행되며, 접근자는 런타임 작성기 경로를 통해 에이전트별 SQLite 변경을 직렬화합니다. 런타임 코드는 `src/config/sessions/session-accessor.ts`의 접근자 헬퍼를 우선 사용해야 하며, 기존 `sessions.json` 헬퍼는 마이그레이션 및 오프라인 유지 관리 도구입니다. Gateway에 연결할 수 있는 경우 드라이런이 아닌 `openclaw sessions cleanup` 및 `openclaw agents delete`는 저장소 변경을 Gateway에 위임하므로 정리 작업이 동일한 작성기 대기열에 합류합니다. `--store <path>`는 선택한 기존 저장소를 위한 명시적인 오프라인 복구 경로이며 항상 로컬에서 실행됩니다(`--dry-run`도 마찬가지입니다). `maxEntries` 정리는 프로덕션 규모 저장소에 맞게 일괄 처리되므로, 다음 상한선 정리에서 저장소를 다시 작성해 제한 이하로 줄이기 전까지 저장소가 구성된 한도를 잠시 초과할 수 있습니다. 읽기 작업은 Gateway 시작 중 항목을 정리하거나 개수를 제한하지 않습니다. 쓰기 작업 또는 `openclaw sessions cleanup --enforce`만 이를 수행하며, 후자는 한도를 즉시 적용하고 디스크 예산이 구성되지 않은 경우에도 참조되지 않는 오래된 기존 트랜스크립트, 체크포인트 및 궤적 아티팩트를 정리합니다.

OpenClaw는 더 이상 Gateway 쓰기 중 자동 `sessions.json.bak.*` 순환 백업을 생성하지 않습니다. 기존 `session.maintenance.rotateBytes` 키는 무시되며 `openclaw doctor --fix`는 이전 구성에서 이 키를 제거합니다.

트랜스크립트 변경은 SQLite 트랜스크립트 대상에 세션 쓰기 대기열을 사용합니다.

| 설정                                 | 기본값    | 환경 변수 재정의                                 |
| ------------------------------------ | --------- | ------------------------------------------------ |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs`는 잠금 대기가 포기하기 전에 세션 사용 중 오류를 표시하기까지의 시간입니다. 느린 시스템에서 정상적인 준비, 정리, Compaction 또는 트랜스크립트 미러 작업의 경합이 더 오래 지속되는 경우에만 늘리십시오. `staleMs`는 기존 잠금을 오래된 잠금으로 간주하여 회수할 수 있게 되는 시점입니다. `maxHoldMs`는 프로세스 내 감시 타이머의 해제 임계값입니다.

### SQLite 전환 후 다운그레이드

이전의 파일 기반 OpenClaw 버전을 실행하기 전에 보관된 기존 트랜스크립트 아티팩트를 복원하십시오.

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

마이그레이션은 지원 및 롤백을 위해 기존 `sessions.json` 파일을 그대로 유지하지만, SQLite로 가져온 활성 트랜스크립트 JSONL 파일은 `session-sqlite-import-archive/`로 이름이 변경됩니다. 이전 파일 기반 런타임은 `sessions.json`의 `sessionFile` 경로를 따르므로 시작하기 전에 해당 아티팩트를 복원해야 합니다. 복원은 마이그레이션 매니페스트를 사용하며, 원래 경로가 누락된 기록된 보관 아티팩트만 이동하고 향후 복구를 위해 SQLite 데이터베이스는 그대로 둡니다.

SQLite 전환 후 생성된 세션은 SQLite에만 존재하며 이전 파일 기반 런타임에는 나타나지 않습니다. 다운그레이드 후 다시 업그레이드하는 경우 OpenClaw가 복원된 기존 아티팩트를 가져오기 전에 검증할 수 있도록 Doctor 검사 및 검증 절차를 다시 실행하십시오.

## Cron 세션 및 실행 로그

격리된 cron 실행은 전용 보존 정책이 적용되는 자체 세션 항목/트랜스크립트를 생성합니다.

- `cron.sessionRetention`(기본값 `"24h"`)은 저장소에서 오래된 격리 cron 실행 세션을 정리하며, `false`는 이 기능을 비활성화합니다.
- `cron.runLog.keepLines`는 cron 작업별로 보존되는 SQLite 실행 기록 행을 정리합니다(기본값 `2000`). `cron.runLog.maxBytes`는 이전 파일 기반 실행 로그와의 호환성을 위해서만 허용됩니다.

cron이 새 격리 실행 세션을 강제로 생성할 때는 새 행을 쓰기 전에 이전 `cron:<jobId>` 세션 항목을 정리합니다. 안전한 기본 설정(사고/고속/상세/추론 설정, 레이블, 표시 이름)과 사용자가 명시적으로 선택한 모델/인증 재정의는 유지하지만, 주변 대화 컨텍스트(채널/그룹 라우팅, 전송/대기열 정책, 권한 상승, 출처, ACP 런타임 바인딩)는 삭제하여 새로운 격리 실행이 이전 실행의 오래된 전달 설정이나 런타임 권한을 상속하지 못하도록 합니다.

## 세션 키(`sessionKey`)

`sessionKey`는 현재 속한 대화 버킷(라우팅 + 격리)을 식별합니다. 표준 규칙: [/concepts/session](/ko/concepts/session).

| 패턴                           | 예시                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| 기본/직접 채팅(에이전트별)     | `agent:<agentId>:<mainKey>`(기본값 `main`)                  |
| 그룹                           | `agent:<agentId>:<channel>:group:<id>`                      |
| 룸/채널(Discord/Slack)         | `agent:<agentId>:<channel>:channel:<id>` 또는 `...:room:<id>` |
| Cron                           | `cron:<job.id>`                                             |
| Webhook                        | `hook:<uuid>`(재정의하지 않은 경우)                         |

## 세션 ID(`sessionId`)

각 `sessionKey`는 현재 `sessionId`(대화를 계속하는 SQLite 트랜스크립트 ID)를 가리킵니다. 결정 로직은 `src/auto-reply/reply/session.ts`의 `initSessionState()`에 있습니다.

- **재설정**(`/new`, `/reset`)은 해당 `sessionKey`에 대해 새 `sessionId`를 생성합니다.
- **일일 재설정**(기본값: Gateway 호스트의 현지 시간 오전 4:00)은 재설정 경계를 지난 후 다음 메시지에서 새 `sessionId`를 생성합니다.
- **유휴 만료**(`session.reset.idleMinutes` 또는 레거시 `session.idleMinutes`)는 유휴 시간 범위가 지난 후 메시지가 도착하면 새 `sessionId`를 생성합니다. 일일 재설정과 유휴 만료가 모두 구성된 경우 먼저 만료되는 설정이 적용됩니다.
- **Control UI 재연결 재개**는 Gateway가 운영자 UI 클라이언트에서 일치하는 `sessionId`를 수신하면 재연결 후 한 번의 전송에 대해 현재 표시 중인 세션을 유지합니다. 이는 일회성 신호이며, 일반적인 오래된 전송은 여전히 새 `sessionId`를 생성합니다.
- **시스템 이벤트**(Heartbeat, Cron 깨우기, exec 알림, Gateway 내부 관리)는 세션 행을 변경할 수 있지만 일일/유휴 재설정의 최신 상태를 연장하지는 않습니다. 재설정 전환 시 새 프롬프트를 구성하기 전에 이전 세션에 대기 중인 시스템 이벤트 알림을 폐기합니다.
- **상위 포크 정책**은 스레드 또는 하위 에이전트 포크를 생성할 때 OpenClaw의 활성 브랜치를 사용합니다. 해당 브랜치가 너무 크면(고정된 내부 상한 초과, 현재 100K 토큰) OpenClaw는 실패하거나 사용할 수 없는 기록을 상속하는 대신 격리된 컨텍스트로 하위 항목을 시작합니다. 크기 산정은 자동이며 구성할 수 없습니다. 레거시 `session.parentForkMaxTokens` 구성은 `openclaw doctor --fix`로 제거됩니다.
- **운영자 포크**: `sessions.create { parentSessionKey, fork: true }`는 상위 세션의 현재 상태에서 트랜스크립트가 분기되는 새 세션을 생성합니다(위의 크기 상한을 포함하여 하위 에이전트를 생성할 때와 동일한 포크 메커니즘). 상위 세션에서 실행이 활성 상태이면 포크가 거부되고, 명시적으로 전달하지 않는 한 상위 세션의 모델 선택을 상속하며, 새로운 토큰 카운터와 함께 하위 세션을 `forkedFromParent`로 표시합니다.

## 세션 저장소 스키마

런타임 저장소는 에이전트별 SQLite에 `SessionEntry` 값을 보관합니다. 값 형식은 `src/config/sessions.ts`의 `SessionEntry`입니다. 주요 필드는 다음과 같습니다(전체 목록은 아님).

- `sessionId`: SQLite 트랜스크립트 행을 지정하는 데 사용하는 현재 트랜스크립트 ID
- `sessionStartedAt`: 현재 `sessionId`의 시작 타임스탬프이며, 일일 재설정의 최신 상태 판단에 사용됩니다. 레거시 행에서는 JSONL 세션 헤더로부터 이 값을 파생할 수 있습니다.
- `lastInteractionAt`: 마지막 실제 사용자/채널 상호작용 타임스탬프입니다. Heartbeat, Cron, exec 이벤트가 세션을 계속 활성 상태로 유지하지 않도록 유휴 재설정의 최신 상태 판단에 사용합니다. 이 필드가 없는 레거시 행은 복구된 세션 시작 시간으로 대체합니다.
- `updatedAt`: 저장소 행이 마지막으로 변경된 타임스탬프로, 목록 표시/정리/내부 관리에 사용되며 일일/유휴 최신 상태의 기준은 아닙니다.
- `archivedAt`: 선택적 보관 타임스탬프입니다. 보관된 세션은 트랜스크립트가 그대로 유지된 채 저장소에 남으며 일반적인 활성 목록에서는 제외됩니다.
- `pinnedAt`: 선택적 고정 타임스탬프입니다. 고정된 활성 세션은 고정되지 않은 세션보다 앞에 정렬되며, 세션을 보관하면 고정이 해제됩니다.
- Codex 스레드 상호 운용: 두 필드 모두 Codex 스레드 관리 형식을 따릅니다. 전송되는 `archived`/`pinned` 불리언은 항상 타임스탬프에서 파생되고 서버 측에서 기록되며, Codex의 `threads.archived_at` 의미 체계 및 camelCase 직렬화와 일치합니다. OpenClaw 타임스탬프는 epoch 밀리초를 사용하고 Codex는 epoch 초를 사용하므로 브리지는 `codex` Plugin 경계에서 변환합니다. Codex에는 아직 고정 API가 없으며(`thread/archive`/`thread/unarchive`만 지원), 고정 상태는 해당 API가 생길 때까지 OpenClaw 측에 유지됩니다. API가 생기면 일치하는 형식 덕분에 바인딩된 세션의 고정 상태를 기계적으로 왕복할 수 있습니다.
- Codex 감독 목록에는 보관되지 않은 네이티브 스레드만 표시됩니다. Gateway 로컬의 활동 상태를 알 수 없는 `idle` 또는 `notLoaded` 스레드는 다른 Codex 프로세스가 해당 스레드를 소유하지 않는다고 운영자가 명시적으로 확인한 후에만 네이티브 `thread/archive`를 통해 보관할 수 있습니다. Plugin은 먼저 프로세스 로컬 상태를 새로 읽고, 이후 해당 스레드는 카탈로그에서 사라집니다. 이 읽기만으로는 다른 App Server 프로세스가 해당 스레드를 사용하지 않는다는 점을 입증할 수 없습니다. OpenClaw는 활성 상태 및 오류 상태의 행 보관을 거부하며, 페어링된 Node 보관은 Node 브리지가 스트리밍되는 전체 스레드 수명 주기를 소유할 수 있을 때까지 사용할 수 없습니다. 네이티브 Codex 클라이언트에서 보관을 해제하면 해당 스레드가 다시 표시될 수 있습니다.
- `lastReadAt` / `markedUnreadAt`: `sessions.patch { unread }`가 서버 측에서 기록하는 읽음 상태 타임스탬프입니다. `unread: false`는 읽음을 기록하고(`lastReadAt` 설정, `markedUnreadAt` 지우기), `unread: true`는 다음에 읽을 때까지 세션을 읽지 않음으로 표시합니다. 세션 행은 파생된 `unread` 불리언을 노출합니다. 명시적으로 읽지 않음으로 표시되었거나 최신 활동 전에 읽은 경우입니다. 읽음으로 표시된 적이 없는 세션은 `unread: false`를 유지하므로 기존 설치 환경에서는 업그레이드 시 갑자기 읽지 않음 표시가 활성화되지 않습니다.
- `lastActivityAt`: 읽지 않음으로 간주할 만한 활동(사용자, 채널 및 Cron 실행)에 해당하는 마지막 완료된 에이전트 실행의 타임스탬프입니다. Heartbeat와 내부 이벤트 턴 및 메타데이터 패치는 이를 업데이트하지 않으며, `updatedAt`은 활동 신호가 아닙니다.
- `sessionFile`: 마이그레이션/보관 호환성을 위해 유지되는 레거시 표시자이며, 활성 런타임은 SQLite ID를 사용합니다.
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: 그룹/채널 레이블 지정 메타데이터
- 토글: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy`(세션별 재정의)
- 모델 선택: `providerOverride`, `modelOverride`, `authProfileOverride`
- 토큰 카운터(최선 추정/제공자에 따라 다름): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: 이 세션 키에 대해 자동 Compaction이 완료된 횟수
- `memoryFlushAt` / `memoryFlushCompactionCount`: 마지막 Compaction 전 메모리 플러시의 타임스탬프와 Compaction 횟수

Gateway가 최종 기준입니다. 세션 실행 중 항목을 다시 쓰거나 재구성할 수 있습니다. 레거시 파일 기반 설치에서는 `sessions.json`을 편집하고 런타임이 계속 해당 파일을 읽을 것으로 기대하지 말고 다음 명령으로 마이그레이션하십시오.
`openclaw doctor --session-sqlite import --session-sqlite-all-agents`

## 트랜스크립트 이벤트 구조

트랜스크립트는 OpenClaw 세션 접근자가 관리하며 ID 기반 헬퍼를 통해 런타임 코드에 노출됩니다. 이벤트 스트림은 추가 전용입니다.

- 첫 번째 항목: 세션 헤더 - `type: "session"`, `id`, `cwd`, `timestamp`, 선택적 `parentSession`.
- 이후: `id` + `parentId`가 있는 항목(트리 구조).

주요 항목 형식:

- `message`: 사용자/어시스턴트/toolResult 메시지
- `custom_message`: 모델 컨텍스트에 _포함되는_ 확장에서 삽입한 메시지(`display: true`이면 TUI에 렌더링되고, `display: false`이면 완전히 숨겨짐)
- `custom`: 모델 컨텍스트에 _포함되지 않는_ 확장 상태(다시 로드할 때까지 확장 상태를 유지하는 데 사용)
- `compaction`: `firstKeptEntryId`와 `tokensBefore`가 포함된 영구 저장된 Compaction 요약
- `branch_summary`: 트리 브랜치를 탐색할 때 영구 저장되는 요약

OpenClaw는 의도적으로 트랜스크립트를 "수정"하지 않습니다. Gateway는 `SessionManager`를 사용하여 트랜스크립트를 읽고 씁니다.

## 컨텍스트 창과 추적 토큰의 차이

서로 다른 두 가지 개념이 있습니다.

1. **모델 컨텍스트 창**: 모델별 하드 상한(모델에 표시되는 토큰)입니다. 모델 카탈로그에서 가져오며 구성을 통해 재정의할 수 있습니다.
2. **세션 저장소 카운터**: 세션 행에 기록되는 누적 통계(`/status` 및 대시보드에서 사용)입니다. `contextTokens`는 런타임 추정/보고 값이므로 엄격한 보장으로 간주하지 마십시오.

제한에 대한 자세한 내용은 [/reference/token-use](/ko/reference/token-use)를 참조하십시오.

## Compaction의 정의

Compaction은 이전 대화를 트랜스크립트의 영구 저장된 `compaction` 항목으로 요약하고 최근 메시지는 그대로 유지합니다. Compaction 후 향후 턴에는 Compaction 요약과 `firstKeptEntryId` 이후의 메시지가 표시됩니다. Compaction은 세션 정리와 달리 **영구적**입니다. [/concepts/session-pruning](/ko/concepts/session-pruning)을 참조하십시오.

Compaction 후 AGENTS.md 섹션 재삽입은 `agents.defaults.compaction.postCompactionSections`를 통해 명시적으로 활성화해야 합니다. 설정하지 않거나 `[]`이면 OpenClaw는 Compaction 요약 위에 AGENTS.md 발췌문을 추가하지 않습니다.

### 청크 경계와 도구 쌍 유지

긴 트랜스크립트를 Compaction 청크로 분할할 때 OpenClaw는 어시스턴트 도구 호출과 일치하는 `toolResult` 항목의 쌍을 유지합니다.

- 토큰 비율에 따른 분할 지점이 도구 호출과 그 결과 사이에 놓이게 되면 OpenClaw는 쌍을 분리하지 않고 경계를 어시스턴트 도구 호출 메시지로 이동합니다.
- 후행 도구 결과 블록으로 인해 청크가 목표 크기를 초과하게 되는 경우 OpenClaw는 대기 중인 해당 도구 블록을 보존하고 요약되지 않은 뒷부분을 그대로 유지합니다.
- 중단되거나 오류가 발생한 도구 호출 블록은 대기 중인 분할을 계속 열어 두지 않습니다.

## 자동 Compaction 발생 시점

내장 OpenClaw 에이전트에는 두 가지 트리거가 있습니다.

1. **오버플로 복구**: 모델이 컨텍스트 오버플로 오류(`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` 및 기타 제공자별 변형)를 반환하면 Compaction한 후 다시 시도합니다. 제공자가 시도한 토큰 수를 보고하면 OpenClaw는 관측된 해당 수치를 오버플로 복구 Compaction에 전달합니다. 제공자가 오버플로를 확인하지만 파싱 가능한 수치를 노출하지 않으면 OpenClaw는 예산을 최소한으로 초과하는 합성 수치를 Compaction 엔진과 진단에 전달합니다. 오버플로 복구가 계속 실패하면 OpenClaw는 현재 세션 매핑을 유지하고 명시적인 지침을 표시하며, 새 세션 ID로 자동 전환하지 않습니다. 메시지를 다시 시도하거나 `/compact` 또는 `/new`를 실행하십시오.
2. **임계값 유지 관리**: 성공적인 턴 후 `contextTokens > contextWindow - reserveTokens`일 때 발생합니다. 여기서 `contextWindow`는 모델의 컨텍스트 창이고 `reserveTokens`는 프롬프트와 다음 모델 출력을 위해 예약된 여유 공간입니다.

이 두 트리거 외부에서 두 가지 추가 보호 장치가 실행됩니다.

- **사전 로컬 Compaction**: 활성 트랜스크립트가 지정된 크기에 도달하면 다음 실행을 열기 전에 로컬 Compaction을 트리거하도록 `agents.defaults.compaction.maxActiveTranscriptBytes`(바이트 또는 `"20mb"` 같은 문자열)를 설정합니다. 이는 원시 보관이 아니라 로컬 재개 비용을 위한 크기 보호 장치입니다. 일반적인 의미론적 Compaction은 계속 실행되며, Compaction된 요약이 새 후속 트랜스크립트가 되도록 `truncateAfterCompaction`이 필요합니다.
- **턴 중간 사전 검사**: 도구 루프 보호 장치를 추가하려면 `agents.defaults.compaction.midTurnPrecheck.enabled: true`(기본값 `false`)로 설정합니다. 도구 결과가 추가된 후 다음 모델을 호출하기 전에 OpenClaw는 턴 시작 시 사용되는 것과 동일한 사전 예산 로직을 사용하여 프롬프트 압력을 추정합니다. 컨텍스트가 더 이상 들어맞지 않으면 보호 장치는 인라인 Compaction을 수행하지 않습니다. 대신 구조화된 턴 중간 사전 검사 신호를 발생시키고 현재 프롬프트 제출을 중단한 다음, 외부 실행 루프가 기존 복구 경로를 사용하도록 합니다. 즉, 충분한 경우 너무 큰 도구 결과를 자르거나 구성된 Compaction 모드를 트리거한 후 다시 시도합니다. 제공자 기반 보호 Compaction을 포함하여 `default`와 `safeguard` Compaction 모드 모두에서 작동합니다. `maxActiveTranscriptBytes`와는 독립적입니다. 바이트 크기 보호 장치는 턴을 열기 전에 실행되고, 턴 중간 사전 검사는 나중에 새 도구 결과가 추가된 후 실행됩니다.

## Compaction 설정

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw은 임베디드 실행에도 안전 하한을 적용합니다. `compaction.reserveTokens`가 `reserveTokensFloor`(기본값 `20000`)보다 낮으면 OpenClaw이 이를 상향 조정합니다. 하한을 비활성화하려면 `agents.defaults.compaction.reserveTokensFloor: 0`을 설정하십시오. 활성 모델의 컨텍스트 윈도우가 알려진 경우, 예약량이 전체 프롬프트 예산을 소진하지 않도록 하한과 최종 유효 예약량이 모두 제한됩니다. 따라서 컨텍스트가 작은 모델(예: 16K 토큰 로컬 모델)이 첫 번째 토큰부터 Compaction에 들어가는 것을 방지합니다. 알려진 컨텍스트 윈도우가 없으면 구성된 예약 예산과 현재 예약 예산은 제한되지 않습니다. 하한을 두는 이유는 Compaction이 불가피해지기 전에 아래의 메모리 플러시와 같은 여러 턴의 "유지 관리"를 수행할 충분한 여유를 확보하기 위해서입니다. 구현은 `src/agents/agent-settings.ts`의 `applyAgentCompactionSettingsFromConfig()`이며, 임베디드 러너의 턴 및 Compaction 설정 경로에서 호출됩니다.

수동 `/compact`는 명시적인 `agents.defaults.compaction.keepRecentTokens`를 준수하며 런타임의 최근 꼬리 부분 절단 지점을 유지합니다. 명시적인 유지 예산이 없으면 수동 Compaction은 하드 체크포인트로 동작하며 재구성된 컨텍스트는 새 요약부터 시작합니다.

`truncateAfterCompaction`이 활성화되면 OpenClaw은 Compaction 후 활성 트랜스크립트를 압축된 후속 트랜스크립트로 교체합니다. 브랜치/복원 체크포인트 작업은 이 압축된 후속 트랜스크립트를 사용하며, 기존 Compaction 이전 체크포인트 파일도 참조되는 동안에는 계속 읽을 수 있습니다.

## 교체 가능한 Compaction 제공자

Plugin은 Plugin API의 `registerCompactionProvider()`를 통해 Compaction 제공자를 등록합니다. `agents.defaults.compaction.provider`를 등록된 제공자 ID로 설정하면 세이프가드 확장이 내장 `summarizeInStages` 파이프라인 대신 해당 제공자에게 요약을 위임합니다.

- `provider`: 등록된 Compaction 제공자 Plugin의 ID입니다. 기본 LLM 요약을 사용하려면 설정하지 마십시오. `provider`를 설정하면 `mode: "safeguard"`가 강제됩니다.
- 제공자는 내장 경로와 동일한 Compaction 지침 및 식별자 보존 정책을 전달받으며, 세이프가드는 제공자 출력 이후에도 최근 턴 및 분할된 턴의 접미 컨텍스트를 보존합니다.
- 내장 세이프가드 요약은 이전 요약 전체를 그대로 보존하지 않고 새 메시지와 함께 이전 요약을 다시 정제합니다.
- 세이프가드 모드에서는 기본적으로 요약 품질 감사를 활성화합니다. 잘못된 형식의 출력에 대한 재시도 동작을 생략하려면 `qualityGuard.enabled: false`를 설정하십시오.
- 제공자가 실패하거나 빈 결과를 반환하면 OpenClaw은 자동으로 내장 LLM 요약으로 폴백합니다. 호출자가 명시적으로 발생시킨 중단/시간 초과 신호는 무시하지 않고 다시 던지므로 취소 요청이 항상 준수됩니다.

출처: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## 사용자에게 표시되는 위치

- 모든 채팅 세션의 `/status`
- `openclaw status`(CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Gateway 로그(`pnpm gateway:watch` 또는 `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- 상세 모드: `🧹 Auto-compaction complete`와 Compaction 횟수

## 자동 유지 관리(`NO_REPLY`)

OpenClaw은 사용자가 중간 출력을 볼 필요가 없는 백그라운드 작업을 위해 "무응답" 턴을 지원합니다.

- 어시스턴트가 출력의 시작 부분에 정확한 무응답 토큰 `NO_REPLY` / `no_reply`를 사용하면 "사용자에게 응답을 전달하지 않음"을 의미합니다. OpenClaw은 전달 계층에서 이를 제거하거나 억제합니다.
- 정확한 무응답 토큰 억제는 대소문자를 구분하지 않습니다. 전체 페이로드가 무응답 토큰 하나뿐이면 `NO_REPLY`와 `no_reply`가 모두 해당합니다.
- `2026.1.10`부터 OpenClaw은 부분 청크가 `NO_REPLY`로 시작할 때 초안/입력 중 스트리밍도 억제하므로, 무응답 작업의 부분 출력이 턴 중간에 노출되지 않습니다.
- 이는 실제 백그라운드/미전달 턴에만 사용해야 하며, 일반적으로 실행 가능한 사용자 요청을 처리하지 않기 위한 우회 수단이 아닙니다.

## Compaction 이전 메모리 플러시

자동 Compaction이 실행되기 전에 OpenClaw은 영구 상태를 디스크(예: 에이전트 작업 공간의 `memory/YYYY-MM-DD.md`)에 기록하는 무응답 에이전트 턴을 실행하여 Compaction으로 인해 중요한 컨텍스트가 삭제되지 않도록 할 수 있습니다. 세션 컨텍스트 사용량을 모니터링하며, Compaction 임계값보다 낮은 소프트 임계값을 넘으면 정확한 무응답 토큰 `NO_REPLY` / `no_reply`를 사용하여 "지금 메모리 기록" 지시를 보내므로 사용자에게는 아무것도 표시되지 않습니다.

구성(`agents.defaults.compaction.memoryFlush`)에 대한 전체 참조는 [/gateway/config-agents](/ko/gateway/config-agents#agentsdefaultscompaction)를 확인하십시오.

| 키                          | 기본값           | 참고                                                                                                                                   |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | 설정 안 됨       | 플러시 턴에만 적용되는 정확한 제공자/모델 재정의입니다. 예: `ollama/qwen3:8b`                                                          |
| `softThresholdTokens`       | `4000`           | 플러시를 트리거하는 Compaction 임계값 아래의 간격                                                                                      |
| `forceFlushTranscriptBytes` | 설정 안 됨(비활성화) | 토큰 카운터가 오래되었더라도 트랜스크립트 파일이 이 바이트 크기(또는 `"2mb"` 같은 문자열)에 도달하면 강제로 플러시합니다. `0`은 비활성화합니다. |
| `prompt`                    | 내장             | 플러시 턴의 사용자 메시지                                                                                                              |
| `systemPrompt`              | 내장             | 플러시 턴에 추가되는 시스템 프롬프트                                                                                                   |

참고:

- 기본 프롬프트/시스템 프롬프트에는 전달을 억제하기 위한 `NO_REPLY` 힌트가 포함됩니다.
- `model`이 설정되면 플러시 턴은 활성 세션의 폴백 체인을 상속하지 않고 해당 모델을 사용하므로, 로컬 전용 유지 관리가 실패했을 때 유료 대화 모델로 자동 폴백하지 않습니다.
- 플러시는 Compaction 주기당 한 번 실행됩니다(세션 행에서 추적).
- 플러시는 임베디드 OpenClaw 세션에서만 실행되며 CLI 백엔드와 Heartbeat 턴에서는 건너뜁니다.
- 세션 작업 공간이 읽기 전용(`workspaceAccess: "ro"` 또는 `"none"`)이면 플러시를 건너뜁니다.
- 작업 공간 파일 레이아웃과 쓰기 패턴은 [메모리](/ko/concepts/memory)를 참조하십시오.

OpenClaw은 확장 API에 `session_before_compact` 훅을 제공하지만, 위의 플러시 로직은 해당 훅이 아니라 Gateway 측(`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`)에 있습니다.

## 문제 해결 체크리스트

- **세션 키가 잘못되었습니까?** [/concepts/session](/ko/concepts/session)부터 확인하고 `/status`의 `sessionKey`를 확인하십시오.
- **저장소와 트랜스크립트가 일치하지 않습니까?** `openclaw status`에서 Gateway 호스트와 저장소 경로를 확인하십시오.
- **Compaction이 과도하게 발생합니까?** 모델의 컨텍스트 윈도우(너무 작으면 Compaction이 자주 발생함), `reserveTokens`(모델 윈도우에 비해 너무 높으면 Compaction이 더 일찍 발생함), 도구 결과의 비대화(세션 정리를 조정)를 확인하십시오.
- **작은 로컬 모델에서 모든 프롬프트가 오버플로되는 것처럼 보입니까?** 제공자가 올바른 모델 컨텍스트 윈도우를 보고하는지 확인하십시오. OpenClaw은 해당 윈도우를 알고 있을 때만 유효 예약량을 제한할 수 있습니다.
- **무응답 턴이 노출됩니까?** 응답이 정확한 무응답 토큰 `NO_REPLY`(대소문자 구분 없음)로 시작하는지, 스트리밍 억제 수정 사항이 포함된 빌드(`2026.1.10`+)를 사용 중인지 확인하십시오.

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [세션 정리](/ko/concepts/session-pruning)
- [컨텍스트 엔진](/ko/concepts/context-engine)
- [에이전트 구성 참조](/ko/gateway/config-agents)
