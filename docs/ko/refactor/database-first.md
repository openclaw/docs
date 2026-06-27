---
read_when:
    - OpenClaw 런타임 데이터, 캐시, 대화 기록, 작업 상태 또는 스크래치 파일을 SQLite로 이동하기
    - 레거시 JSON 또는 JSONL 파일에서 doctor 마이그레이션 설계하기
    - Changing 백업, 복원, VFS 또는 워커 스토리지 동작하기
    - 세션 잠금 제거, 정리, 잘라내기 또는 JSON 호환성 경로
summary: SQLite를 기본 지속 상태 및 캐시 계층으로 만들면서 설정은 파일 기반으로 유지하기 위한 마이그레이션 계획
title: 데이터베이스 우선 상태 리팩터링
x-i18n:
    generated_at: "2026-06-27T18:05:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# 데이터베이스 우선 상태 리팩터링

## 결정

두 단계 SQLite 레이아웃을 사용합니다.

- 전역 데이터베이스: `~/.openclaw/state/openclaw.sqlite`
- 에이전트 데이터베이스: 에이전트가 소유하는 작업 영역,
  트랜스크립트, VFS, 아티팩트, 대규모 에이전트별 런타임 상태를 위한 에이전트당 SQLite 데이터베이스 하나
- 구성은 파일 기반으로 유지합니다. `openclaw.json`은 계속
  데이터베이스 밖에 둡니다. 런타임 인증 프로필은 SQLite로 이동하며, 외부 제공자 또는 CLI
  자격 증명 파일은 OpenClaw 데이터베이스 밖에서 소유자가 관리합니다.

전역 데이터베이스는 제어 평면 데이터베이스입니다. 에이전트 검색,
공유 Gateway 상태, 페어링, 디바이스/노드 상태, 작업 및 플로 원장, Plugin
상태, 스케줄러 런타임 상태, 백업 메타데이터, 마이그레이션 상태를 소유합니다.

에이전트 데이터베이스는 데이터 평면 데이터베이스입니다. 에이전트의 세션
메타데이터, 트랜스크립트 이벤트 스트림, VFS 작업 영역 또는 스크래치 네임스페이스, 도구
아티팩트, 실행 아티팩트, 검색/인덱싱 가능한 에이전트 로컬 캐시 데이터를 소유합니다.

이렇게 하면 대규모 에이전트 작업 영역, 트랜스크립트, 바이너리 스크래치 데이터를
공유 Gateway 쓰기 경로에 강제로 넣지 않으면서도 내구성 있는 전역 뷰 하나를 제공합니다.

## 엄격한 계약

이 마이그레이션에는 하나의 표준 런타임 형태가 있습니다.

- 세션 행은 세션 메타데이터만 지속합니다. `transcriptLocator`, 트랜스크립트 파일 경로, 형제 JSONL 경로, 잠금 경로,
  가지치기 메타데이터, 파일 시대 호환성 포인터를 지속해서는 안 됩니다.
- 트랜스크립트 식별자는 항상 SQLite 식별자입니다. `{agentId, sessionId}`에
  프로토콜에서 필요한 경우 선택적 주제 메타데이터를 더합니다.
- `sqlite-transcript://...`는 런타임 또는 프로토콜 식별자가 아닙니다. 새 코드는
  트랜스크립트 로케이터를 파생, 지속, 전달, 파싱, 마이그레이션해서는 안 됩니다. 런타임과
  테스트에는 의사 로케이터가 전혀 없어야 합니다. 문서는 해당 문자열을
  금지하기 위해서만 언급할 수 있습니다.
- 기존 `sessions.json`, 트랜스크립트 JSONL, `.jsonl.lock`, 가지치기, 잘라내기,
  오래된 세션 경로 로직은 doctor 마이그레이션/가져오기 경로에만 속합니다.
- 기존 세션 구성 별칭은 doctor 마이그레이션에만 속합니다. 런타임은
  `session.idleMinutes`, `session.resetByType.dm`, 또는
  다른 구성된 에이전트에 대한 교차 에이전트 `agent:main:*` 메인 세션 별칭을 해석하지 않습니다.
- 세션 라우팅 식별자는 타입이 있는 관계형 상태입니다. 핫 런타임 및 UI 경로는
  `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations`,
  `session_conversations`를 읽어야 하며, 오래된 호출 지점을 삭제하는 동안의 호환성
  섀도를 제외하고 제공자 식별자를 얻기 위해 `session_key`를 파싱하거나
  `session_entries.entry_json`을 캐내서는 안 됩니다.
- `dm`과 `direct` 같은 채널 수준 직접 메시지 마커는 라우팅
  어휘이지, 트랜스크립트 로케이터나 파일 저장소 호환성 핸들이 아닙니다.
- 기존 훅 핸들러 구성은 doctor 경고/마이그레이션 표면에만 속합니다.
  런타임은 `hooks.internal.handlers`를 로드해서는 안 됩니다. 훅은 검색된
  훅 디렉터리와 `HOOK.md` 메타데이터를 통해서만 실행됩니다.
- 런타임 시작, 핫 응답 경로, Compaction, 재설정, 복구, 진단,
  TTS, 메모리 훅, 하위 에이전트, Plugin 명령 라우팅, 프로토콜 경계,
  훅은 런타임 전체에서 `{agentId, sessionId}`를 전달해야 합니다.
- 테스트는 `{agentId, sessionId}`를 통해 SQLite 트랜스크립트 행을 시드하고
  검증해야 합니다. JSONL 경로 전달, 호출자가 제공한 로케이터 보존,
  또는 트랜스크립트 파일 호환성만 증명하는 테스트는 doctor 가져오기,
  비세션 지원/디버그 구체화, 또는 프로토콜 형태를 다루지 않는 한 삭제해야 합니다.
- `runEmbeddedPiAgent(...)`, 준비된 워커 실행, 내부 임베디드
  시도는 트랜스크립트 로케이터를 받아서는 안 됩니다. 이들은 `{agentId, sessionId}`로
  SQLite 트랜스크립트 관리자를 열고 그 관리자를 내부화된
  PI 호환 에이전트 세션에 전달하므로, 오래된 호출자가 러너로 하여금
  JSON/JSONL 트랜스크립트를 쓰게 만들 수 없습니다.
- 러너 진단은 런타임/캐시/페이로드 추적 레코드를 SQLite에 저장해야 합니다.
  런타임 진단은 JSONL 파일 오버라이드 노브나 범용
  트랜스크립트 JSONL 내보내기 헬퍼를 노출해서는 안 됩니다. 사용자 대상 내보내기는
  파일 이름을 런타임으로 다시 공급하지 않고 데이터베이스 행에서 명시적
  아티팩트를 구체화할 수 있습니다.
- 원시 스트림 로깅은 `OPENCLAW_RAW_STREAM=1`과 SQLite 진단 행을 사용합니다.
  오래된 pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH`,
  `raw-openai-completions.jsonl` 파일 로거 계약은 OpenClaw
  런타임 또는 테스트의 일부가 아닙니다.
- QMD 메모리 인덱싱은 SQLite 트랜스크립트를 markdown 파일로 내보내서는 안 됩니다.
  QMD는 구성된 메모리 파일만 인덱싱합니다. 세션 트랜스크립트 검색은 계속
  SQLite 기반입니다.
- QMD SDK 하위 경로는 새 코드에서 QMD 전용입니다. SQLite 세션 트랜스크립트
  인덱싱 헬퍼는 `memory-core-host-engine-session-transcripts`에 있습니다. 모든
  QMD 재내보내기는 호환성 전용이며 런타임 코드에서 사용해서는 안 됩니다.
- 기본 제공 메모리 인덱스는 소유 에이전트 데이터베이스에 있습니다. 런타임 구성과
  해석된 런타임 계약은 `memorySearch.store.path`를 노출해서는 안 됩니다. doctor는
  해당 기존 구성 키를 삭제하고 현재 코드는 에이전트
  `databasePath`를 내부적으로 전달합니다.

구현 작업은 doctor/가져오기/내보내기/디버그 경계 밖에서 예외 없이
이 문장들이 참이 될 때까지 코드를 계속 삭제해야 합니다.

## 목표 상태 및 진행 상황

### 엄격한 목표

- 하나의 전역 SQLite 데이터베이스가 제어 평면 상태를 소유합니다.
  `state/openclaw.sqlite`.
- 하나의 에이전트별 SQLite 데이터베이스가 데이터 평면 상태를 소유합니다.
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- 구성은 파일 기반으로 유지합니다. `openclaw.json`은 이 데이터베이스
  리팩터링의 일부가 아닙니다.
- 기존 파일은 doctor 마이그레이션 입력으로만 사용합니다.
- 런타임은 활성 상태로서 세션 또는 트랜스크립트 JSONL을 절대 쓰거나 읽지 않습니다.

### 목표 상태

- `not-started`: 파일 시대 런타임 코드가 아직 활성 상태를 씁니다.
- `migrating`: doctor/가져오기 코드가 파일 데이터를 SQLite로 이동할 수 있습니다.
- `dual-read`: 임시 브리지가 SQLite와 기존 파일을 모두 읽습니다. 이 상태는
  doctor 전용으로 명시적으로 문서화되지 않는 한 이 리팩터링에서 금지됩니다.
- `sqlite-runtime`: 런타임이 SQLite만 읽고 씁니다.
- `clean`: 기존 런타임 API와 테스트가 제거되고, 가드가
  회귀를 방지합니다.
- `done`: 문서, 테스트, 백업, doctor 마이그레이션, 변경 검사로
  깨끗한 상태를 증명합니다.

### 현재 상태

- 세션: 런타임에서 `clean`입니다. 세션 행은 에이전트별 데이터베이스에 있으며,
  런타임 API는 `{agentId, sessionId}` 또는 `{agentId, sessionKey}`를 사용하고,
  `sessions.json`은 doctor 전용 기존 입력입니다.
- 트랜스크립트: 런타임에서 `clean`입니다. 트랜스크립트 이벤트, 식별자, 스냅샷,
  트래젝터리 런타임 이벤트는 에이전트별 데이터베이스에 있습니다. 런타임은 더 이상
  트랜스크립트 로케이터나 JSONL 트랜스크립트 경로를 받지 않습니다.
- PI 임베디드 러너: `clean`입니다. 임베디드 PI 실행, 준비된 워커, Compaction,
  재시도 루프는 SQLite 세션 범위를 사용하고 오래된 트랜스크립트 핸들을 거부합니다.
- Cron: 런타임에서 `clean`입니다. 런타임은 `cron_jobs`와 `cron_run_logs`를 사용합니다.
  런타임 테스트는 SQLite `storeKey` 명명을 사용하며, 파일 시대 Cron 경로는
  doctor 기존 마이그레이션 테스트에만 남아 있습니다.
- 작업 레지스트리: `clean`입니다. 작업 및 TaskFlow 런타임 행은
  `state/openclaw.sqlite`에 있습니다. 출시되지 않은 사이드카 SQLite 가져오기 도구는 삭제되었습니다.
- Plugin 상태: `clean`입니다. Plugin 상태/blob 행은 공유 전역
  데이터베이스에 있습니다. 오래된 Plugin 상태 사이드카 SQLite 헬퍼는 가드로 차단됩니다.
- 메모리: 기본 제공 메모리와 세션 트랜스크립트 인덱싱에서 `sqlite-runtime`입니다.
  메모리 인덱스 테이블은 에이전트별 데이터베이스에 있으며, Plugin 메모리 상태는
  공유 Plugin 상태 행을 사용하고, 기존 메모리 파일은 doctor 마이그레이션 입력
  또는 사용자 작업 영역 콘텐츠입니다.
- 백업: `sqlite-runtime`입니다. 백업 단계는 SQLite 스냅샷을 압축하고, 라이브
  WAL/SHM 사이드카를 생략하며, SQLite 무결성을 검증하고, 백업 실행을
  전역 데이터베이스에 기록합니다.
- doctor 마이그레이션: 의도적으로 `migrating`입니다. doctor는 기존 JSON,
  JSONL, 폐기된 사이드카 저장소를 SQLite로 가져오고, 마이그레이션 실행/소스를 기록하며,
  성공한 소스를 제거합니다.
- E2E 스크립트: 런타임 커버리지에서 `clean`입니다. Docker MCP 시드는 SQLite
  행을 씁니다. runtime-context Docker 스크립트는 doctor 마이그레이션 시드 안에서만
  기존 JSONL을 만들고, 기존 세션 인덱스 경로를 명시적으로 이름 붙입니다.

### 남은 작업

- [x] doctor 기존 입력이 아닌 한 Cron 런타임 테스트 저장소 변수를 `storePath`에서
      다른 이름으로 바꿉니다.
      파일: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      증명: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] 오래된 파일 시대 내보내기 테스트 목을 제거하거나 이름을 바꿉니다.
      파일: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      증명: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Docker runtime-context 기존 JSONL 시드가 명확히 doctor 전용임을 드러냅니다.
      파일: `scripts/e2e/session-runtime-context-docker-client.ts`.
      증명: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts`가
      `seedBrokenLegacySessionForDoctorMigration`만 표시합니다.
- [x] 스키마 변경 후 Kysely 생성 타입을 계속 정렬합니다.
      파일: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      증명: 이번 작업에는 스키마 변경 없음. `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] 변경한 저장소, 명령, 스크립트에 대한 집중 테스트를 다시 실행합니다.
      증명: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] `done`을 선언하기 전에 변경 게이트 또는 원격 광범위 증명을 실행합니다.
      증명: `pnpm check:changed --timed -- <changed extension paths>`는
      Hetzner Crabbox 실행 `run_3f1cabf6b25c`에서 임시 Node 24/pnpm 설정과
      동기화된 `.git` 없는 작업 영역에 대한 명시적 경로 라우팅 후 통과했습니다.

### 회귀 금지

- 트랜스크립트 로케이터 없음.
- 활성 세션 파일 없음.
- doctor 기존 마이그레이션 테스트를 제외한 가짜 JSONL 테스트 픽스처 없음.
- Kysely가 예상되는 곳에서 원시 SQLite 접근 없음.
- 새 기존 DB 마이그레이션 없음. 이 레이아웃은 출시되지 않았으므로 강력한 이유가 없는 한
  스키마 버전을 `1`로 유지합니다.

## 코드 읽기 가정

이 계획을 막는 후속 제품 결정은 없습니다. 구현은
다음 가정으로 진행해야 합니다.

- 이 스토리지 경로에는 `node:sqlite`를 직접 사용하고 Node 22+ 런타임을 요구합니다.
- 일반 구성 파일은 정확히 하나만 유지합니다. 이 리팩터링에서 구성, Plugin
  매니페스트, Git 작업 공간을 SQLite로 옮기지 마세요.
- 런타임 호환성 파일은 필요하지 않습니다. 레거시 JSON 및 JSONL 파일은
  마이그레이션 입력으로만 사용됩니다. 브랜치 로컬 SQLite 사이드카는 출시된 적이
  없으므로 가져오지 않고 삭제합니다.
- `openclaw doctor --fix`가 레거시 파일-데이터베이스 마이그레이션 단계를
  담당합니다. 런타임 시작과 `openclaw migrate`는 레거시 OpenClaw
  데이터베이스 업그레이드 경로를 포함해서는 안 됩니다.
- 자격 증명 호환성도 같은 규칙을 따릅니다. 런타임 자격 증명은 SQLite에
  저장됩니다. 기존 `auth-profiles.json`, 에이전트별 `auth.json`, 공유
  `credentials/oauth.json` 파일은 doctor 마이그레이션 입력으로 사용한 뒤,
  가져오기 후 제거합니다.
- 생성된 모델 카탈로그 상태는 데이터베이스 기반입니다. 런타임 코드는
  `agents/<agentId>/agent/models.json`을 쓰면 안 됩니다. 기존 `models.json`
  파일은 레거시 doctor 입력이며 `agent_model_catalogs`로 가져온 뒤 제거합니다.
- 런타임은 transcript locator를 마이그레이션하거나 정규화하거나 브리지해서는 안 됩니다. 활성
  transcript ID는 SQLite의 `{agentId, sessionId}`입니다. 파일 경로는
  레거시 doctor 입력으로만 사용되며, `sqlite-transcript://...`는
  경계 핸들로 취급하는 대신 런타임, 프로토콜, 훅, Plugin 표면에서 사라져야 합니다.
- 런타임 SQLite transcript 읽기는 기존 JSONL 엔트리 형태 마이그레이션을 실행하거나
  호환성을 위해 전체 transcript를 다시 쓰지 않습니다. 레거시 엔트리 정규화는
  명시적인 doctor/import 유틸리티에 남습니다. Doctor는 SQLite 행을 삽입하기 전에
  레거시 JSONL transcript 파일을 정규화합니다. 현재 런타임 행은 이미 현재
  transcript 스키마로 작성됩니다. trajectory/session 내보내기는 해당 행을 그대로
  읽으며 내보내기 시점의 레거시 마이그레이션을 수행해서는 안 됩니다.
- 레거시 transcript JSONL 파싱/마이그레이션 헬퍼는 doctor 전용입니다. 런타임
  transcript 형식 코드는 현재 SQLite transcript 컨텍스트만 빌드합니다. doctor는
  행을 삽입하기 전에 기존 JSONL 엔트리 업그레이드를 담당합니다.
- 기존 런타임 소유 JSONL transcript 스트리밍 헬퍼는 삭제되었습니다. Doctor
  가져오기 코드는 명시적인 레거시 파일 읽기를 담당하며, 런타임 세션 기록은
  SQLite 행을 읽습니다.
- Codex app-server 바인딩은 Codex Plugin 상태 네임스페이스에서 OpenClaw `sessionId`를
  표준 키로 사용합니다. `sessionKey`는 라우팅/표시용 메타데이터이며,
  영구 세션 id를 대체하거나 transcript 파일 ID를 되살려서는 안 됩니다.
- 컨텍스트 엔진은 현재 런타임 계약을 직접 받습니다. 레지스트리는 `sessionKey`,
  `transcriptScope`, 또는 `prompt`를 삭제하는 재시도 shim으로 엔진을
  감싸서는 안 됩니다. 현재 데이터베이스 우선 매개변수를 받을 수 없는 엔진은
  브리지되는 대신 명확하게 실패해야 합니다.
- 백업 출력은 하나의 아카이브 파일로 유지해야 합니다. 데이터베이스 내용은
  원시 라이브 WAL 사이드카가 아니라 압축된 SQLite 스냅샷으로 해당 아카이브에
  포함되어야 합니다.
- transcript 검색은 유용하지만 첫 번째 데이터베이스 우선 전환에는 필수가 아닙니다.
  나중에 FTS를 추가할 수 있도록 스키마를 설계하세요.
- 데이터베이스 경계가 안정화되는 동안 워커 실행은 설정 뒤의 실험적 기능으로
  유지해야 합니다.

## 코드 읽기 결과

현재 브랜치는 이미 개념 증명 단계를 지나 있습니다. 공유 데이터베이스가 존재하고,
Node `node:sqlite`는 작은 런타임 헬퍼를 통해 연결되어 있으며, 이전 스토어들은 이제
`state/openclaw.sqlite` 또는 소유 `openclaw-agent.sqlite` 데이터베이스에 씁니다.

남은 작업은 SQLite를 선택하는 것이 아니라, 새 경계를 깔끔하게 유지하고 여전히
예전 파일 세계처럼 보이는 호환성 형태의 인터페이스를 삭제하는 것입니다.

- 세션 `storePath`는 더 이상 런타임 ID, 테스트 픽스처 형태, 또는 상태 페이로드
  필드가 아닙니다. 런타임 및 브리지 테스트에는 더 이상 `storePath` 계약 이름이
  포함되지 않습니다. doctor/마이그레이션 코드가 해당 레거시 용어를 담당합니다.
- 세션 쓰기는 더 이상 기존 인프로세스 `store-writer.ts` 큐를 거치지 않습니다.
  SQLite 패치 쓰기는 대신 충돌 감지와 제한된 재시도를 사용합니다.
- 레거시 경로 발견은 여전히 유효한 마이그레이션 용도가 있지만, 런타임 코드는
  `sessions.json`과 transcript JSONL 파일을 가능한 쓰기 대상으로 취급하는 것을
  중단해야 합니다.
- 에이전트 소유 테이블은 에이전트별 SQLite 데이터베이스에 있습니다. 전역 DB는
  레지스트리/제어 플레인 행을 유지합니다. transcript ID는 에이전트별 transcript
  행의 `{agentId, sessionId}`입니다. 런타임 코드는 transcript 파일 경로를
  영속화하거나 transcript locator를 마이그레이션해서는 안 됩니다.
- Doctor는 이미 여러 레거시 파일을 가져옵니다. 정리 작업은 이를 doctor가 호출하는
  하나의 명시적인 마이그레이션 구현으로 만들고, 영구적인 마이그레이션 보고서를
  갖추는 것입니다.

구현을 막는 추가 제품 질문은 없습니다.

## 현재 코드 형태

이 브랜치에는 이미 실제 공유 SQLite 기반이 있습니다:

- 런타임 최소 버전은 이제 Node 22+입니다. `package.json`, CLI 런타임 가드,
  설치 프로그램 기본값, macOS 런타임 로케이터, CI, 공개 설치 문서가 모두
  일치합니다. 기존 Node 22 호환성 레인은 제거되었습니다.
- `src/state/openclaw-state-db.ts`는 `openclaw.sqlite`를 열고, WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`을 설정하며,
  `src/state/openclaw-state-schema.sql`에서 파생된 생성 스키마 모듈을
  적용합니다.
- Kysely 테이블 타입과 런타임 스키마 모듈은 커밋된 `.sql` 파일에서 만든
  일회용 SQLite 데이터베이스로부터 생성됩니다. 런타임 코드는 더 이상 전역,
  에이전트별, 프록시 캡처 데이터베이스용 복사-붙여넣기 스키마 문자열을
  유지하지 않습니다.
- 런타임 저장소는 SQLite 행 형태를 수동으로 복제하는 대신, 생성된 Kysely
  `DB` 인터페이스에서 선택 및 삽입 행 타입을 파생합니다. 원시 SQL은 스키마
  적용, pragma, 마이그레이션 전용 DDL로 계속 제한됩니다.
- 이 데이터베이스 레이아웃은 아직 출시되지 않았으므로 SQLite 스키마는
  `user_version = 1`로 통합되었습니다. 런타임 오프너는 현재 스키마만
  생성합니다. 파일-데이터베이스 가져오기는 doctor 코드에 남아 있으며,
  브랜치 로컬 데이터베이스 업그레이드 헬퍼는 삭제되었습니다.
- 소유권 경계가 정식인 곳에서 관계형 소유권이 강제됩니다. 소스 마이그레이션
  행은 `migration_runs`에서 cascade되고, 작업 전달 상태는 `task_runs`에서
  cascade되며, 트랜스크립트 ID 행은 트랜스크립트 이벤트에서 cascade됩니다.
- 현재 공유 테이블에는 `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs`, `backup_runs`가 포함됩니다.
- 임의의 Plugin 소유 상태에는 호스트 소유 typed 테이블이 생기지 않습니다.
  설치된 Plugin은 버전 지정 JSON 페이로드에 `plugin_state_entries`를,
  바이트에 `plugin_blob_entries`를 사용하며, 네임스페이스/키 소유권,
  TTL 정리, 백업, Plugin 마이그레이션 기록을 함께 사용합니다. 호스트가
  쿼리 계약을 소유하는 경우, 예를 들어 `plugin_binding_approvals`처럼
  호스트 소유 Plugin 오케스트레이션 상태는 여전히 typed 테이블을 가질 수
  있습니다.
- Plugin 마이그레이션은 호스트 스키마 마이그레이션이 아니라 Plugin 소유
  네임스페이스에 대한 데이터 마이그레이션입니다. Plugin은 마이그레이션
  제공자를 통해 자체 버전 지정 상태/blob 항목을 마이그레이션할 수 있고,
  호스트는 일반 마이그레이션 원장에 소스/실행 상태를 기록합니다. 새 Plugin
  설치는 호스트 자체가 새 교차-Plugin 계약의 소유권을 가져가는 경우가
  아니라면 `openclaw-state-schema.sql` 변경을 요구하지 않습니다.
- `src/state/openclaw-agent-db.ts`는
  `agents/<agentId>/agent/openclaw-agent.sqlite`를 열고, 데이터베이스를
  전역 DB에 등록하며, 에이전트 로컬 세션, 트랜스크립트, VFS, 아티팩트,
  캐시, 메모리 인덱스 테이블을 소유합니다. 공유 런타임 탐색은 이제 각 호출
  지점에서 해당 쿼리를 다시 구현하는 대신 생성된 타입의 `agent_databases`
  레지스트리를 읽습니다.
- 전역 및 에이전트별 데이터베이스는 데이터베이스 역할, 스키마 버전,
  타임스탬프, 에이전트 데이터베이스의 에이전트 id가 있는 `schema_meta`
  행을 기록합니다. 이 SQLite 스키마는 아직 출시되지 않았으므로 레이아웃은
  여전히 `user_version = 1`로 유지됩니다.
- 에이전트별 세션 ID에는 이제 `session_id`를 키로 하는 정식 `sessions`
  루트 테이블이 있으며, `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, 타임스탬프, 표시 필드, 모델 메타데이터,
  하네스 id, 부모/생성 연결이 쿼리 가능한 열로 포함됩니다.
  `session_routes`는 `session_key`에서 현재 `session_id`로 가는 고유한
  활성 라우트 인덱스이므로, 라우트 키는 hot 읽기가 중복된
  `sessions.session_key` 행 사이에서 선택하게 만들지 않고도 새 durable
  세션으로 이동할 수 있습니다. 기존 `session_entries.entry_json` 호환성
  형태 페이로드는 외래 키로 durable `session_id` 루트에 매달립니다. 더 이상
  세션의 유일한 스키마 수준 표현이 아닙니다.
- 에이전트별 외부 대화 ID도 관계형입니다.
  `conversations`는 정규화된 제공자/계정/대화 ID를 저장하고,
  `session_conversations`는 하나의 OpenClaw 세션을 하나 이상의 외부 대화에
  연결합니다. 이는 여러 피어가 `session_key`에서 거짓 정보를 만들지 않고도
  의도적으로 하나의 세션에 매핑될 수 있는 shared-main DM 세션을 포괄합니다.
  SQLite는 동일한 channel/account/kind/peer/thread 튜플이 여러 대화 id로
  갈라질 수 없도록 자연 제공자 ID의 고유성도 강제합니다.
  shared-main 직접 피어는 `participant` 역할로 연결되므로 하나의 OpenClaw
  세션이 이전 피어를 모호한 관련 행으로 격하하지 않고도 여러 외부 DM 피어를
  나타낼 수 있습니다. `sessions.primary_conversation_id`는 여전히 현재 typed
  전달 대상을 가리킵니다. 닫힌 라우팅/상태 열은 TypeScript 유니언에만
  의존하지 않고 SQLite `CHECK` 제약 조건으로 강제됩니다.
  런타임 세션 프로젝션은 typed 세션/대화 열을 적용하기 전에
  `session_entries.entry_json`에서 호환성 라우팅 shadow를 지우므로 오래된
  JSON 페이로드가 전달 대상을 되살릴 수 없습니다.
  서브에이전트 announce 라우팅도 typed SQLite 전달 컨텍스트를 요구합니다.
  더 이상 호환성 `SessionEntry` 라우트 필드로 fallback하지 않습니다.
  Gateway `chat.send` 명시적 전달 상속은 `origin`/`last*` 호환성 필드 대신
  typed SQLite 전달 컨텍스트를 읽습니다.
  `tools.effective`도 오래된 `last*` 세션 항목 shadow가 아니라 typed SQLite
  전달/라우팅 행에서 제공자/계정/thread 컨텍스트를 파생합니다.
  시스템 이벤트 프롬프트 컨텍스트는 `origin` shadow 대신 typed 전달 필드에서
  channel/to/account/thread 필드를 다시 구성합니다.
  공유 `deliveryContextFromSession` 헬퍼와 세션-대화 매퍼는 이제
  `SessionEntry.origin`을 완전히 무시합니다. typed 전달 필드와 관계형 대화
  행만 hot 라우트 ID를 만들 수 있습니다.
  런타임 세션 항목 정규화는 `entry_json`을 유지하거나 프로젝션하기 전에
  `origin`을 제거하며, 인바운드 메타데이터는 새 origin shadow를 만드는 대신
  typed channel/chat 필드와 관계형 대화 행을 씁니다.
- 트랜스크립트 이벤트, 트랜스크립트 스냅샷, trajectory 런타임 이벤트는 이제
  정식 에이전트별 `sessions` 루트를 참조하며 세션 삭제 시 cascade됩니다.
  트랜스크립트 ID/idempotency 행은 계속 정확한 트랜스크립트 이벤트 행에서
  cascade됩니다.
- memory-core 인덱스는 이제 명시적 에이전트 데이터베이스 테이블
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks`,
  `memory_embedding_cache`를 사용하며, `memory_index_state`는 리비전 변경을
  추적합니다. 선택적 FTS/vector 사이드 인덱스는 일반적인 `meta`, `files`,
  `chunks`, `chunks_fts`, `chunks_vec` 테이블 대신
  `memory_index_chunks_fts`와 `memory_index_chunks_vec`로 명명됩니다. 정식
  이름은 현재 경로/소스 행 형태와 직렬화된 임베딩 호환성을 유지합니다. 이
  테이블들은 파생/검색 캐시이며 정식 트랜스크립트 저장소가 아닙니다. 메모리
  작업공간 파일과 구성된 소스에서 삭제 후 다시 빌드할 수 있습니다.
  출시된 generic-name 메모리 인덱스를 열면 해당 메타데이터, 소스, chunk,
  임베딩 캐시가 정식 테이블로 마이그레이션됩니다. 파생 FTS/vector 테이블은
  정식 이름 아래에서 다시 빌드됩니다.
- 서브에이전트 실행 복구 상태는 이제 인덱싱된 자식, 요청자, 컨트롤러 세션
  키가 있는 typed 공유 `subagent_runs` 행에 저장됩니다. 기존
  `subagents/runs.json` 파일은 doctor 마이그레이션 입력 전용입니다.
- 현재 대화 바인딩은 이제 정규화된 대화 id를 키로 하는 typed 공유
  `current_conversation_bindings` 행에 저장되며, 대상 에이전트/세션 열,
  대화 종류, 상태, 만료, 메타데이터가 중복된 불투명 바인딩 레코드 대신
  관계형 열로 저장됩니다. durable 바인딩 키에는 정규화된 대화 종류가
  포함되므로 direct/group/channel 참조가 충돌할 수 없고, SQLite는 유효하지
  않은 바인딩 종류/상태 값을 거부합니다. 기존
  `bindings/current-conversations.json` 파일은 doctor 마이그레이션 입력
  전용입니다.
- 전달 큐 복구는 channel, target, account, session, retry, error,
  platform-send, recovery state용 typed 큐 열을 replay JSON 위에 오버레이합니다.
  `entry_json`은 replay 페이로드, hook, formatting 페이로드를 유지하지만,
  typed 열이 hot 큐 라우팅/상태의 권위 있는 소스입니다.
- TUI 마지막 세션 복원 포인터는 이제 해시된 TUI 연결/세션 범위를 키로 하는
  typed 공유 `tui_last_sessions` 행에 저장됩니다. 기존 TUI JSON 파일은
  doctor 마이그레이션 입력 전용입니다.
- 기본 TTS prefs는 이제 `speech-core` Plugin 아래의 키를 사용하는 공유
  Plugin-state SQLite 행에 저장됩니다. 기존 `settings/tts.json` 파일은
  doctor 마이그레이션 입력 전용입니다. 런타임은 더 이상 TTS prefs JSON 파일을
  읽거나 쓰지 않으며, 레거시 경로 해석기는 doctor 마이그레이션 모듈에
  있습니다.
- Secret 대상 메타데이터는 이제 모든 credential 대상이 config 파일인 척하지
  않고 store에 대해 설명합니다. `openclaw.json`은 config store로 유지됩니다.
  auth-profile 대상은 제공자 형태 credential을 JSON 페이로드로 보관하는 typed
  SQLite `auth_profile_stores` 행을 사용합니다.
- Secret 감사는 더 이상 폐기된 에이전트별 `auth.json` 파일을 스캔하지
  않습니다. doctor가 해당 레거시 파일에 대한 경고, 가져오기, 제거를
  소유합니다.
- 레거시 auth profile 경로 헬퍼는 이제 doctor 레거시 코드에 있습니다. 코어
  auth profile 경로 헬퍼는 `auth-profiles.json` 또는 `auth-state.json`
  런타임 경로가 아니라 SQLite auth-store ID와 표시 위치를 노출합니다.
- 서브에이전트 실행 복구와 OpenRouter 모델 capability 캐시 런타임 모듈은 이제
  SQLite 스냅샷 reader/writer를 doctor 전용 레거시 JSON 가져오기 헬퍼와
  분리해 유지합니다. OpenRouter capability는 하나의 불투명 캐시 blob이나
  제공자별 호스트 테이블 대신 `provider_id = "openrouter"` 아래의 typed
  generic `model_capability_cache` 행을 사용합니다. 서브에이전트 실행
  `taskName`은 typed `subagent_runs.task_name` 열에 저장됩니다.
  `payload_json` 사본은 replay/debug 데이터이며 hot 표시 또는 조회 필드의
  소스가 아닙니다.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts`는 에이전트 데이터베이스
  `vfs_entries` 테이블 위에 SQLite VFS를 구현합니다. 디렉터리 읽기, 재귀적
  내보내기, 삭제, 이름 변경은 전체 네임스페이스를 스캔하거나 `LIKE` 경로
  매칭에 의존하는 대신 인덱싱된 `(namespace, path)` prefix 범위를 사용합니다.
- `src/agents/runtime-worker.entry.ts`는 worker를 위해 실행별 SQLite VFS,
  tool artifact, run artifact, scoped cache 저장소를 생성합니다.
- 작업공간 bootstrap 완료 marker는 이제 `.openclaw/workspace-state.json`
  대신 해석된 작업공간 경로를 키로 하는 typed 공유 `workspace_setup_state`
  행에 저장됩니다. 런타임은 더 이상 레거시 작업공간 marker를 읽거나 다시 쓰지
  않으며, 헬퍼 API도 저장소 ID를 파생하기 위해 가짜 `.openclaw/setup-state`
  경로를 넘겨주지 않습니다.
- Exec approval은 이제 typed 공유 SQLite `exec_approvals_config` singleton
  행에 저장됩니다. Doctor는 레거시 `~/.openclaw/exec-approvals.json`을
  가져옵니다. 런타임 쓰기는 더 이상 해당 파일을 active store 위치로 생성,
  다시 쓰기, 보고하지 않습니다. macOS companion은 동일한
  `state/openclaw.sqlite` 테이블 행을 읽고 씁니다. 디스크에는 Unix prompt
  socket만 유지하는데, 이는 durable 런타임 상태가 아니라 IPC이기 때문입니다.
- Device identity, device auth, bootstrap 런타임 모듈은 이제 SQLite 스냅샷
  reader/writer를 doctor 전용 레거시 JSON 가져오기 헬퍼와 분리해 유지합니다.
  Device identity는 typed `device_identities` 행을 사용하고, device auth
  token은 typed `device_auth_tokens` 행을 사용합니다. Device auth 쓰기는 token
  테이블을 truncate하는 대신 device/role별로 행을 reconcile하며, 런타임은 더
  이상 단일 token 업데이트를 기존 whole-store 어댑터로 라우팅하지 않습니다.
  레거시
  버전 1 JSON 페이로드는 doctor 가져오기/내보내기 형태로만 존재합니다.
- GitHub Copilot 토큰 교환 캐시는 `github-copilot/token-cache/default` 아래의 공유 SQLite Plugin 상태 테이블을 사용합니다. 이는 provider 소유 캐시 상태이므로 의도적으로 호스트 스키마 테이블을 추가하지 않습니다.
- GitHub Copilot Compaction은 더 이상 `openclaw-compaction-*.json` 워크스페이스 사이드카를 쓰지 않습니다. 하네스는 추적 중인 SDK 세션에 대해 SDK 기록 Compaction RPC를 호출하며, OpenClaw는 호환성 마커 파일 대신 SQLite에 지속 세션/트랜스크립트 상태를 유지합니다.
- 공유 Swift 런타임(`OpenClawKit`)은 기기 ID와 기기 인증에 동일한
  `state/openclaw.sqlite` 행을 사용합니다. macOS 앱 헬퍼는 두 번째 JSON 또는
  SQLite 경로를 소유하는 대신 공유 SQLite 헬퍼를 가져옵니다. 남아 있는 레거시 `identity/device.json`은 doctor가 이를 SQLite로 가져오기 전까지 ID 생성을 차단하며, 이는 TypeScript 및 Android
  시작 게이트와 일치합니다.
- Android 기기 ID는 형식화된 `state/openclaw.sqlite#table/device_identities` 행에 저장된 동일한 TypeScript 호환 키 자료를 사용합니다. `openclaw/identity/device.json`을 읽거나 쓰지 않으며, 남아 있는 레거시 파일은 doctor가 이를 SQLite로 가져오기 전까지 시작을 차단합니다.
- Android 캐시된 기기 인증 토큰도 형식화된
  `state/openclaw.sqlite#table/device_auth_tokens` 행을 사용하며 TypeScript 및 Swift와 동일한
  버전 1 토큰 의미 체계를 공유합니다. 런타임은 더 이상 `SecurePrefs`
  `gateway.deviceToken*` 호환성 키를 읽지 않으며, 해당 키는 마이그레이션/doctor
  로직에만 속합니다.
- Android 알림 최근 패키지 기록은 형식화된
  `android_notification_recent_packages` 행을 사용합니다. 런타임은 더 이상 이전 SharedPreferences CSV 키를 마이그레이션하거나 읽지 않습니다.
- 레거시 `identity/device.json`이 있거나, SQLite ID 행이 유효하지 않거나, SQLite ID
  저장소를 열 수 없는 경우 기기 ID 생성은 실패 폐쇄 방식으로 동작합니다. doctor가 먼저 해당 파일을 가져오고 제거하므로, 런타임 시작이 마이그레이션 전에 페어링 ID를 조용히 회전시킬 수 없습니다.
- 기기 ID 선택은 JSON 파일 위치 지정자가 아니라 SQLite 행 키입니다. 테스트와 Gateway 헬퍼는 명시적 ID 키를 전달하며, doctor 마이그레이션과 실패 폐쇄 시작 게이트만 폐기된 `identity/device.json` 파일 이름을 압니다.
- 세션 재설정 호환성은 이제 doctor 구성 마이그레이션에 있습니다.
  `session.idleMinutes`는 `session.reset.idleMinutes`로 이동되고,
  `session.resetByType.dm`은 `session.resetByType.direct`로 이동되며,
  런타임 재설정 정책은 정식 재설정 키만 읽습니다.
- 레거시 구성 호환성은 이제 `src/commands/doctor/` 아래에 있습니다. 일반
  `readConfigFileSnapshot()` 검증은 doctor 레거시 감지기를 가져오거나 레거시 문제에 주석을 달지 않습니다. `runDoctorConfigPreflight()`는 doctor 복구/보고를 위해 해당 문제를 추가합니다. doctor 구성 흐름은
  `src/commands/doctor/legacy-config.ts`를 가져오며, 이전 OAuth 프로필 ID 복구는
  `src/commands/doctor/legacy/oauth-profile-ids.ts` 아래에 있습니다.
- doctor가 아닌 명령은 레거시 구성 복구를 자동 실행하지 않습니다. 예를 들어,
  `openclaw update --channel`은 이제 잘못된 레거시 구성에서 실패하고 사용자에게 doctor 실행을 요청하며, doctor 마이그레이션 코드를 조용히 가져오지 않습니다.
- Web push, APNs, Voice Wake, 업데이트 확인, 구성 상태는 이제 불투명한 전체 JSON blob 대신 구독, VAPID 키, Node 등록, 트리거 행,
  라우팅 행, 업데이트 알림 상태, 구성 상태 항목에 대해 형식화된 공유 SQLite
  테이블을 사용합니다. Web push 및 APNs 스냅샷 쓰기는 이제 테이블을 비우는 대신 기본 키로 구독/등록을 조정합니다.
  구성 상태도 구성 경로 기준으로 동일하게 처리합니다.
  해당 런타임 모듈은 SQLite 스냅샷 리더/라이터를 doctor 전용 레거시 JSON 가져오기 헬퍼와 분리해 유지합니다.
- Node 호스트 구성은 이제 공유 SQLite 데이터베이스의 형식화된 싱글턴 행을 사용합니다.
  doctor는 일반 런타임 사용 전에 이전 `node.json` 파일을 가져옵니다.
- 기기/Node 페어링, 채널 페어링, 채널 허용 목록, 부트스트랩 상태는 이제 불투명한 전체 JSON blob 대신 형식화된 SQLite 행을 사용합니다. Plugin 바인딩
  승인과 Cron 작업 상태도 동일하게 분리됩니다. 런타임 모듈은
  SQLite 기반 작업과 중립적 스냅샷 헬퍼를 노출하며, 페어링/부트스트랩과
  Plugin 바인딩 승인 스냅샷 쓰기는 테이블을 잘라내는 대신 기본 키로 행을 조정합니다. doctor는
  `src/commands/doctor/legacy/*` 모듈을 통해 이전 JSON 파일을 가져오고 제거합니다.
- 설치된 Plugin 레코드는 이제 SQLite 설치 Plugin 인덱스에 있습니다.
  런타임 구성 읽기/쓰기는 더 이상 이전 `plugins.installs` 작성 구성 데이터를 마이그레이션하거나 보존하지 않습니다. doctor는 일반 런타임 사용 전에 해당 레거시 구성 형태를 SQLite로 가져옵니다.
- QQBot 자격 증명 복구 스냅샷은 이제 `qqbot/credential-backups` 아래의 SQLite Plugin 상태에 있습니다. 런타임은 더 이상
  `qqbot/data/credential-backup*.json`을 쓰지 않습니다. doctor는 다른 QQBot 상태 입력과 함께 해당 레거시 백업 파일을 가져오고 제거합니다.
- Gateway 다시 로드 계획은 내부 `installedPluginIndex.installRecords.*` diff 네임스페이스 아래의 SQLite 설치 Plugin 인덱스 스냅샷을 비교합니다. 런타임
  다시 로드 결정은 더 이상 해당 행을 가짜 `plugins.installs` 구성 객체로 감싸지 않습니다.
- Matrix 명명된 계정 자격 증명 업그레이드는 더 이상 런타임 읽기 중에 발생하지 않습니다.
  단일/기본 Matrix 계정을 확인할 수 있는 경우, doctor가 이전 최상위 `credentials/matrix/credentials.json`
  이름 변경을 소유합니다.
- 코어 페어링 및 Cron 런타임 모듈은 더 이상 레거시 JSON 경로 빌더를 내보내지 않습니다.
  doctor 소유 레거시 모듈은 가져오기 테스트와 마이그레이션 전용으로 `pending.json`, `paired.json`,
  `bootstrap.json`, `cron/jobs.json` 소스 경로를 구성합니다. 레거시 Cron 작업 형태 정규화와 Cron 실행 로그 가져오기는 `src/commands/doctor/legacy/cron*.ts` 아래에 있습니다.
- `src/commands/doctor/legacy/runtime-state.ts`는 Node 호스트 구성을 포함한 레거시 JSON 상태
  파일을 doctor에서 SQLite로 가져옵니다. 새 레거시 파일 가져오기 모듈은 `src/commands/doctor/legacy/` 아래에 유지됩니다.
- `src/commands/doctor/state-migrations.ts`는 레거시 `sessions.json`과
  `*.jsonl` 트랜스크립트를 SQLite로 직접 가져오고 성공한 소스를 제거합니다. 더 이상 루트 레거시 트랜스크립트를
  `agents/<agentId>/sessions/*.jsonl`을 통해 스테이징하거나 가져오기 전에 정식 JSONL 대상을 만들지 않습니다.
- 상태 무결성 doctor 검사는 더 이상 레거시 세션 디렉터리를 스캔하거나
  고아 JSONL 삭제를 제안하지 않습니다. 레거시 트랜스크립트 파일은 마이그레이션 입력일 뿐이며, 마이그레이션 단계가 가져오기와 소스 제거를 소유합니다.
- 레거시 샌드박스 레지스트리 가져오기는
  `src/commands/doctor/legacy/sandbox-registry.ts` 아래에 있습니다. 활성 샌드박스 레지스트리
  읽기와 쓰기는 SQLite 전용으로 유지됩니다.
- 레거시 세션 트랜스크립트 상태/가져오기 복구는
  `src/commands/doctor/legacy/session-transcript-health.ts` 아래에 있습니다. 런타임 명령
  모듈은 더 이상 JSONL 트랜스크립트 파싱이나 활성 브랜치 복구 코드를 포함하지 않습니다.

완료된 통합/삭제 주요 사항:

- Plugin 상태는 이제 공유 `state/openclaw.sqlite` 데이터베이스를 사용합니다. 이전
  브랜치 로컬 `plugin-state/state.sqlite` 사이드카 임포터는 해당 SQLite 레이아웃이
  출시된 적이 없기 때문에 제거되었습니다. 프로브/테스트 헬퍼는 Plugin 상태 전용
  SQLite 경로를 노출하는 대신 공유 `databasePath`를 보고합니다.
- Task 및 Task Flow 런타임 테이블은 이제 `tasks/runs.sqlite` 및
  `tasks/flows/registry.sqlite` 대신 공유 `state/openclaw.sqlite` 데이터베이스에
  있습니다. 이전 사이드카 임포터는 동일하게 출시되지 않은 레이아웃이라는 이유로
  제거되었습니다.
- `src/config/sessions/store.ts`는 더 이상 인바운드 메타데이터, 라우트 업데이트 또는
  updated-at 읽기에 `storePath`가 필요하지 않습니다. 명령 지속성, CLI 세션 정리,
  서브에이전트 깊이, 인증 오버라이드, 트랜스크립트 세션 ID는 에이전트/세션 행 API를
  사용합니다. 쓰기는 낙관적 충돌 재시도와 함께 SQLite 행 패치로 적용됩니다.
- 세션 대상 해석은 이제 레거시 `sessions.json` 경로가 아니라 에이전트별 데이터베이스
  대상을 노출합니다. 공유 Gateway, ACP 메타데이터, doctor 라우트 복구 및
  `openclaw sessions`는 `agent_databases`와 구성된 에이전트를 열거합니다.
- Gateway 세션 라우팅은 이제 `resolveGatewaySessionDatabaseTarget`을 사용합니다.
  반환된 대상은 레거시 세션 저장소 파일 경로 대신 `databasePath`와 후보 SQLite 행
  키를 포함합니다.
- 채널 세션 런타임 타입은 이제 updated-at 읽기, 인바운드 메타데이터 및 마지막 라우트
  업데이트를 위해 `{agentId, sessionKey}`를 노출합니다. 이전
  `saveSessionStore(storePath, store)` 호환성 타입은 제거되었습니다.
- Plugin 런타임, 확장 API 및 `config/sessions` 배럴 표면은 이제 Plugin 코드가
  SQLite 기반 세션 행 헬퍼를 사용하도록 안내합니다. 루트 라이브러리 호환성 내보내기
  (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`)는 기존 소비자를 위한
  폐기 예정 shim으로 남아 있습니다. 이전 `resolveLegacySessionStorePath` 헬퍼는
  제거되었습니다. 레거시 `sessions.json` 경로 구성은 이제 마이그레이션 및 테스트
  픽스처에만 로컬로 존재합니다.
- `src/config/sessions/session-entries.sqlite.ts`는 이제 정규 세션 엔트리를 에이전트별
  데이터베이스에 저장하며 행 수준 읽기/upsert/delete 패치 지원을 제공합니다. 런타임
  upsert/patch/delete는 더 이상 대소문자 변형을 스캔하거나 레거시 별칭 키를 정리하지
  않습니다. 정규화는 doctor가 소유합니다. 독립형 JSON 임포트 헬퍼는 제거되었으며,
  마이그레이션은 전체 세션 테이블을 교체하는 대신 더 최신 행을 병합 upsert합니다.
  공개 read/list/load 헬퍼는 타입이 지정된 `sessions` 및 `conversations` 행에서 핫
  세션 메타데이터를 투영합니다. `entry_json`은 호환성/디버그 섀도이며 오래되었거나
  유효하지 않아도 타입이 지정된 세션 ID나 전달 컨텍스트는 손실되지 않습니다.
- `src/config/sessions/delivery-info.ts`는 이제 타입이 지정된 에이전트별 `sessions` +
  `conversations` + `session_conversations` 행에서 전달 컨텍스트를 해석합니다. 더 이상
  `session_entries.entry_json`에서 런타임 전달 ID를 재구성하지 않습니다. 타입이 지정된
  대화 행 누락은 런타임 폴백이 아니라 doctor 마이그레이션/복구 문제입니다.
- 저장된 세션 재설정 결정은 이제 타입이 지정된 `sessions.session_scope`,
  `sessions.chat_type`, `sessions.channel` 메타데이터를 우선합니다. `sessionKey` 파싱은
  명령 대상의 명시적 스레드/토픽 접미사에만 남아 있습니다. 그룹 대 직접 재설정
  분류는 더 이상 키 형태에서 나오지 않습니다.
- 세션 목록/상태 표시 분류는 이제 타입이 지정된 채팅 메타데이터와 Gateway 세션 종류를
  사용합니다. 더 이상 `session_key` 내부의 `:group:` 또는 `:channel:` 하위 문자열을
  내구성 있는 그룹/직접 사실로 취급하지 않습니다.
- 무음 답장 정책 선택은 이제 명시적 대화 타입 또는 표면 메타데이터만 사용합니다. 더
  이상 `session_key` 하위 문자열에서 직접/그룹 정책을 추측하지 않습니다.
- 세션 표시 모델 해석은 이제 `session_key`에서 분리하는 대신 SQLite 세션 데이터베이스
  대상에서 에이전트 id를 받습니다.
- 에이전트 간 announce 대상 하이드레이션은 이제 타입이 지정된 `sessions.list`
  `deliveryContext`만 사용합니다. 더 이상 레거시 `origin`, 미러링된 `last*` 필드 또는
  `session_key` 형태에서 채널/계정/스레드 라우팅을 복구하지 않습니다.
- `sessions_send` 스레드 대상 거부는 이제 타입이 지정된 SQLite 라우팅 메타데이터를
  읽습니다. 더 이상 대상 키에서 스레드 접미사를 파싱하여 대상을 거부하거나 허용하지
  않습니다.
- 그룹 범위 도구 정책 검증은 이제 현재 또는 생성된 세션의 타입이 지정된 SQLite 대화
  라우팅을 읽습니다. 더 이상 `sessionKey`를 디코딩하여 그룹/채널 ID를 신뢰하지
  않습니다. 타입이 지정된 세션 행이 보증하지 않는 경우 호출자가 제공한 그룹 id는
  삭제됩니다.
- 채널 모델 오버라이드 매칭은 이제 명시적 그룹 및 부모 대화 메타데이터를 사용합니다.
  더 이상 `parentSessionKey`에서 부모 대화 id를 디코딩하지 않습니다.
- 저장된 모델 오버라이드 상속은 이제 타입이 지정된 세션 컨텍스트의 명시적 부모 세션
  키가 필요합니다. 더 이상 `sessionKey`의 `:thread:` 또는 `:topic:` 접미사에서 부모
  오버라이드를 파생하지 않습니다.
- 이전 세션 thread-info 래퍼와 로드된 Plugin 스레드 파서는 제거되었습니다. 런타임
  코드는 `config/sessions/thread-info`를 임포트하지 않습니다.
- 채널 대화 헬퍼는 더 이상 전체 세션 키 파싱 브리지를 노출하지 않습니다. 코어는 여전히
  `resolveSessionConversation(...)`을 통해 provider 소유 원시 대화 id를 정규화하지만,
  `sessionKey`에서 라우트 사실을 재구성하지는 않습니다.
- 완료 전달, 전송 정책 및 작업 유지관리는 더 이상 `session_key` 형태에서 채팅 타입을
  파생하지 않습니다. 이전 채팅 타입 키 파서는 삭제되었습니다. 이러한 경로에는 타입이
  지정된 세션 메타데이터, 타입이 지정된 전달 컨텍스트 또는 명시적 전달 대상 어휘가
  필요합니다.
- 세션 목록/상태, 진단, 승인 계정 바인딩, TUI Heartbeat 필터링 및 사용량 요약은 더
  이상 provider/계정/스레드/표시 라우팅을 위해 `SessionEntry.origin`을 캐내지
  않습니다. 남아 있는 런타임 `origin` 읽기는 세션이 아닌 개념 또는 현재 턴 전달 객체뿐입니다.
- 승인 요청 네이티브 대화 조회는 이제 타입이 지정된 에이전트별 세션 라우팅 행을 읽습니다.
  더 이상 `sessionKey`에서 채널/그룹/스레드 대화 ID를 파싱하지 않습니다. 타입이 지정된
  메타데이터 누락은 마이그레이션/복구 문제입니다.
- Gateway 세션 변경/chat/세션 이벤트 페이로드는 더 이상 `SessionEntry.origin` 또는
  `last*` 라우트 섀도를 에코하지 않습니다. 클라이언트는 타입이 지정된 `channel`,
  `chatType`, `deliveryContext`를 받습니다.
- Heartbeat 전달 해석은 이제 타입이 지정된 SQLite `deliveryContext`를 직접 받을 수
  있으며, Heartbeat 런타임은 현재 라우팅을 위해 호환성 `session_entries` 섀도에 의존하는
  대신 에이전트별 세션 전달 행을 전달합니다.
- Cron 격리 에이전트 전달 대상 해석도 호환성 엔트리 페이로드로 폴백하기 전에 타입이
  지정된 에이전트별 세션 전달 행에서 현재 라우트를 하이드레이션합니다.
- 서브에이전트 announce 원본 해석은 이제 `loadRequesterSessionEntry`를 통해 타입이
  지정된 요청자 세션 전달 컨텍스트를 전달하고, 호환성 `last*`/`deliveryContext` 섀도보다
  해당 행을 우선합니다.
- 인바운드 세션 메타데이터 업데이트는 이제 먼저 타입이 지정된 에이전트별 전달 행과
  병합합니다. 이전 `SessionEntry` 전달 필드는 타입이 지정된 대화 행이 없을 때만
  폴백입니다.
- 재시작/업데이트 전달 추출은 이제 `sessionKey`에서 파싱된 토픽/스레드 조각보다 타입이
  지정된 SQLite 전달 `threadId`를 우선합니다. 파싱은 레거시 스레드 형태 키에 대한
  폴백일 뿐입니다.
- 훅 에이전트 컨텍스트 채널 id는 이제 타입이 지정된 SQLite 대화 ID를 우선하고, 그다음
  명시적 메시지 메타데이터를 사용합니다. 더 이상 `sessionKey`에서 provider/그룹/채널
  조각을 파싱하지 않습니다.
- Gateway `chat.send` 외부 라우트 상속은 이제 `sessionKey` 조각에서 채널/직접/그룹 범위를
  추론하는 대신 타입이 지정된 SQLite 세션 라우팅 메타데이터를 읽습니다. 채널 범위
  세션은 타입이 지정된 세션 채널과 채팅 타입이 저장된 전달 컨텍스트와 일치할 때만
  상속합니다. 공유 main 세션은 더 엄격한 CLI/클라이언트 메타데이터 없음 규칙을 유지합니다.
- 재시작 센티널 wake 및 continuation 라우팅은 이제 Heartbeat wake 또는 라우팅된
  에이전트 턴 continuation을 큐에 넣기 전에 타입이 지정된 SQLite 전달/라우팅 행을
  읽습니다. 더 이상 세션 엔트리 JSON 섀도에서 전달 컨텍스트를 재구성하지 않습니다.
- Gateway `tools.effective` 컨텍스트 해석은 이제 provider, 계정, 대상, 스레드 및
  reply-mode 입력에 대해 타입이 지정된 SQLite 전달/라우팅 행을 읽습니다. 더 이상 오래된
  `session_entries.entry_json` origin 섀도에서 이러한 핫 라우팅 필드를 복구하지 않습니다.
- 실시간 음성 consult 라우팅은 이제 타입이 지정된 에이전트별 SQLite 세션 행에서 부모/콜
  전달을 해석합니다. 임베디드 에이전트 메시지 라우트를 선택할 때 더 이상 호환성
  `SessionEntry.deliveryContext` 섀도로 폴백하지 않습니다.
- ACP spawn Heartbeat 릴레이 및 부모 스트림 라우팅은 이제 타입이 지정된 SQLite 세션
  행에서 부모 전달을 읽습니다. 더 이상 호환성 세션 엔트리 섀도에서 부모 전달 컨텍스트를
  재구성하지 않습니다.
- 세션 전달 라우트 보존은 이제 타입이 지정된 채팅 메타데이터와 지속된 전달 컬럼을
  따릅니다. 더 이상 `sessionKey`에서 채널 힌트, 직접/main 마커 또는 스레드 형태를
  추출하지 않습니다. 내부 webchat 라우트는 SQLite에 이미 해당 세션에 대한 타입이
  지정/지속된 전달 ID가 있을 때만 외부 대상을 상속합니다.
- 일반 세션 전달 추출은 이제 정확히 타입이 지정된 SQLite 세션 전달 행만 읽습니다. 더
  이상 스레드/토픽 접미사를 파싱하거나 스레드 형태 키에서 기본 세션 키로 폴백하지 않습니다.
- 답장 디스패치, 재시작 센티널 복구 및 실시간 음성 consult 라우팅은 이제 스레드 라우팅에
  정확한 타입이 지정된 SQLite 세션/대화 행을 사용합니다. 더 이상 스레드 형태 세션 키를
  파싱하여 스레드 id나 기본 세션 전달 컨텍스트를 복구하지 않습니다.
- 임베디드 PI 히스토리 제한은 이제 provider, 채팅 타입 및 피어 ID에 대해 타입이 지정된
  SQLite 세션 라우팅 투영(`sessions` + 기본 `conversations`)을 사용합니다. 더 이상
  `sessionKey`에서 provider, DM, 그룹 또는 스레드 형태를 파싱하지 않습니다.
- Cron 도구 전달 추론은 이제 명시적 전달 또는 현재 타입이 지정된 전달 컨텍스트만
  사용합니다. 더 이상 `agentSessionKey`에서 채널, 피어, 계정 또는 스레드 대상을
  디코딩하지 않습니다.
- 런타임 세션 행은 더 이상 이전 `lastProvider` 라우트 별칭을 포함하지 않습니다. 헬퍼와
  테스트는 타입이 지정된 `lastChannel` 및 `deliveryContext` 필드를 사용합니다. doctor
  마이그레이션만 이전 라우트 별칭 또는 지속된 `origin` 섀도를 변환해야 하는 유일한
  장소입니다.
- 트랜스크립트 이벤트, VFS 행 및 도구 아티팩트 행은 이제 에이전트별 데이터베이스에
  기록됩니다. 출시되지 않은 전역 트랜스크립트 파일 매핑 테이블은 제거되었습니다. doctor는
  대신 내구성 있는 마이그레이션 행에 레거시 소스 경로를 기록합니다.
- 런타임 트랜스크립트 조회는 더 이상 JSONL 바이트 오프셋을 스캔하거나 레거시 트랜스크립트
  파일을 프로브하지 않습니다. Gateway chat/media/history 경로는 SQLite에서 트랜스크립트
  행을 읽습니다. 세션 JSONL은 이제 레거시 doctor 입력일 뿐이며, 런타임 상태나 내보내기
  형식이 아닙니다.
- 트랜스크립트 부모 및 브랜치 관계는 경로 같은
  `agent-db:...transcript_events...` 로케이터 문자열이 아니라 SQLite 트랜스크립트 헤더의
  구조화된 `parentTranscriptScope: {agentId, sessionId}` 메타데이터를 사용합니다.
- 트랜스크립트 관리자 계약은 더 이상 암시적으로 지속되는 `create(cwd)` 또는
  `continueRecent(cwd)` 생성자를 노출하지 않습니다. 지속된 트랜스크립트 관리자는 명시적
  `{agentId, sessionId}` 범위로 열립니다. 인메모리 관리자만 테스트 및 순수 트랜스크립트
  변환을 위해 범위 없이 남아 있습니다.
- 런타임 트랜스크립트 저장소 API는 파일시스템 경로가 아니라 SQLite 범위를 해석합니다.
  이전 `resolve...ForPath` 헬퍼와 사용되지 않는 `transcriptPath` 쓰기 옵션은 런타임
  호출자에서 제거되었습니다.
- 런타임 세션 해석은 이제 `{agentId, sessionId}`를 사용하며 외부 경계를 위해
  `sqlite-transcript://<agent>/<session>` 문자열을 파생해서는 안 됩니다. 레거시 절대
  JSONL 경로는 doctor 마이그레이션 입력일 뿐입니다.
- 네이티브 훅 릴레이 직접 브리지 레코드는 이제 릴레이 id로 키가 지정된 타입이 지정된
  공유 `native_hook_relay_bridges` 행에 있습니다. 런타임은 더 이상 이러한 단기 브리지
  레코드에 대해 `/tmp` JSON 레지스트리나 불투명한 일반 레코드를 쓰지 않습니다.
- `runEmbeddedPiAgent(...)`에는 더 이상 트랜스크립트 로케이터 매개변수가 없습니다.
  준비된 worker descriptor도 transcript locator를 생략합니다. 런타임 세션
  상태와 대기 중인 후속 실행은 파생된 transcript handle 대신 `{agentId, sessionId}`를 전달합니다.
- 내장 Compaction은 이제 `agentId`와 `sessionId`에서 SQLite scope를 가져옵니다.
  Compaction hook, context-engine 호출, CLI 위임, protocol 응답은 파생된
  `sqlite-transcript://...` handle을 받으면 안 됩니다. export/debug 코드는
  행에서 명시적인 사용자 artifact를 만들 수 있지만, 범용 세션 JSONL export 경로를
  제공하거나 파일 이름을 런타임 identity로 다시 주입하지 않습니다.
- `/export-session`은 SQLite에서 transcript 행을 읽고 요청된 독립형 HTML view만
  씁니다. 내장 viewer는 더 이상 해당 행에서 세션 JSONL을 재구성하거나 다운로드하지 않습니다.
- Context-engine 위임은 더 이상 agent identity를 복구하기 위해 transcript locator를
  파싱하지 않습니다. 준비된 런타임 context가 해석된 `agentId`를 기본 제공 Compaction
  adapter로 전달합니다.
- Transcript rewrite와 live tool-result truncation은 이제 `{agentId, sessionId}`로
  transcript 상태를 읽고 저장하며, transcript-update 이벤트 payload를 위해 임시
  locator를 파생하지 않습니다.
- transcript-state helper 표면에는 더 이상 locator 기반
  `readTranscriptState`, `replaceTranscriptStateEvents`, 또는
  `persistTranscriptStateMutation` variant가 없습니다. 런타임 caller는
  `{agentId, sessionId}` API를 사용해야 합니다. Doctor import는 명시적 파일 경로로
  레거시 파일을 읽고 SQLite 행을 쓰며, locator 문자열을 마이그레이션하지 않습니다.
- 런타임 session-manager contract는 더 이상 `open(locator)`,
  `forkFrom(locator)`, 또는 `setTranscriptLocator(...)`를 노출하지 않습니다.
  영속 session manager는 `{agentId, sessionId}`로만 열립니다. list/fork helper는
  transcript manager facade 대신 행 중심 session 및 checkpoint API에 있습니다.
- Gateway transcript reader API는 scope-first입니다. `{agentId, sessionId}`를
  받고, 실수로 런타임 identity가 될 수 있는 positional transcript locator를
  허용하지 않습니다. active transcript locator 파싱은 제거되었습니다. 레거시 source
  path는 doctor import 코드에서만 읽습니다.
- Transcript update 이벤트도 scope-first입니다. `emitSessionTranscriptUpdate`는
  더 이상 bare locator 문자열을 받지 않으며, listener는 handle을 파싱하지 않고
  `{agentId, sessionId}`로 라우팅합니다.
- Gateway session-message broadcast는 transcript locator가 아니라 agent/session
  scope에서 session key를 해석합니다. 기존 transcript-locator-to-session key
  resolver/cache는 제거되었습니다.
- Gateway session-history SSE는 live update를 agent/session scope로 필터링합니다.
  stream이 update를 받아야 하는지 결정하기 위해 transcript locator 후보, realpath,
  또는 파일 형태의 transcript identity를 더 이상 canonicalize하지 않습니다.
- Session lifecycle hook은 더 이상 `session_end`에서 transcript locator를 파생하거나
  노출하지 않습니다. Hook consumer는 `sessionId`, `sessionKey`, next-session id,
  agent context를 받으며, transcript 파일은 lifecycle contract의 일부가 아닙니다.
- Reset hook도 더 이상 transcript locator를 파생하거나 노출하지 않습니다.
  `before_reset` payload는 복구된 SQLite 메시지와 reset reason을 전달하고,
  session identity는 hook context에 유지됩니다.
- Agent harness reset은 더 이상 transcript locator를 받지 않습니다. Reset dispatch는
  `sessionId`/`sessionKey`와 reason으로 scope가 지정됩니다.
- Agent extension session type은 더 이상 `transcriptLocator`를 노출하지 않습니다.
  extension은 파일 형태의 transcript identity에 접근하지 말고 session context와
  runtime API를 사용해야 합니다.
- Plugin Compaction hook은 더 이상 transcript locator를 노출하지 않습니다. Hook
  context는 이미 session identity를 전달하며, transcript 읽기는 파일 형태 handle
  대신 SQLite scope-aware API를 거쳐야 합니다.
- `before_agent_finalize` hook은 native hook relay payload를 포함해 더 이상
  `transcriptPath`를 노출하지 않습니다. Finalization hook은 session context만
  사용합니다.
- Gateway reset 응답은 더 이상 반환된 entry에 transcript locator를 합성하지 않습니다.
  reset은 SQLite transcript 행을 만들고 clean session entry를 반환하며, transcript
  접근은 scope-aware reader에 맡깁니다.
- 내장 run 및 Compaction 결과는 더 이상 session accounting을 위해 transcript
  locator를 노출하지 않습니다. 자동 Compaction은 active `sessionId`, Compaction
  counter, token metadata만 업데이트합니다.
- 내장 attempt 결과는 더 이상 `transcriptLocatorUsed`를 반환하지 않으며,
  context-engine `compact()` 결과도 더 이상 transcript locator를 반환하지 않습니다.
  런타임 retry loop는 successor `sessionId`만 받습니다.
- Delivery-mirror transcript append 결과는 더 이상 transcript locator를 반환하지
  않습니다. caller는 추가된 `messageId`를 받고, transcript update signal은 SQLite
  scope를 사용합니다.
- Parent-session fork helper는 fork된 `sessionId`만 반환합니다. Subagent 준비는
  child agent/session scope를 engine에 전달합니다.
- CLI runner param과 history reseeding은 더 이상 transcript locator를 받지 않습니다.
  CLI history 읽기는 `{agentId, sessionId}` 및 session key context에서 SQLite
  transcript scope를 해석합니다.
- CLI 및 embedded-runner test fixture는 이제 active session을 `*.jsonl` 파일인 것처럼
  가장하거나 runtime param을 통해 `sqlite-transcript://...` 문자열을 전달하는 대신,
  session id로 SQLite transcript 행을 seed하고 읽습니다.
- Session tool-result guard 이벤트는 in-memory manager에 파생 locator가 없더라도
  알려진 session scope에서 emit됩니다. 해당 test는 더 이상 active `/tmp/*.jsonl`
  transcript 파일을 fake로 만들지 않습니다.
- BTW 및 compaction-checkpoint helper는 이제 SQLite scope로 transcript 행을 읽고
  fork합니다. Checkpoint metadata는 이제 session id와 leaf/entry id만 저장하며,
  파생 locator를 checkpoint payload에 더 이상 쓰지 않습니다.
- Gateway transcript-key lookup은 protocol boundary에서 SQLite transcript scope를
  사용하며, 더 이상 transcript filename에 realpath 또는 stat을 수행하지 않습니다.
- 자동 Compaction transcript rotation은 SQLite transcript store를 통해 successor
  transcript 행을 직접 씁니다. Session 행은 durable JSONL path 또는 persisted
  locator가 아니라 successor session identity만 유지합니다.
- 내장 context-engine Compaction은 SQLite-named transcript rotation helper를
  사용합니다. rotation test는 더 이상 JSONL successor path를 구성하거나 active
  session을 파일로 모델링하지 않습니다.
- Managed outgoing image retention은 filesystem stat 호출 대신 SQLite transcript
  stat에서 transcript-message cache key를 만듭니다.
- 런타임 session lock과 독립형 레거시 `.jsonl.lock` doctor lane은 제거되었습니다.
- Microsoft Teams runtime barrel과 public Plugin SDK는 더 이상 기존 file-lock helper를
  re-export하지 않습니다. durable Plugin state path는 SQLite-backed입니다.
- Session age/count pruning과 explicit session cleanup은 제거되었습니다. Doctor가
  legacy import를 소유하며, stale session은 명시적으로 reset하거나 삭제합니다.
- Doctor integrity check는 더 이상 레거시 JSONL 파일을 SQLite session 행의 유효한
  active transcript로 계산하지 않습니다. Active transcript health는 SQLite-only이며,
  레거시 JSONL 파일은 migration/orphan-cleanup input으로 보고됩니다.
- Doctor는 더 이상 `agents/<agent>/sessions/`를 필수 runtime state로 취급하지
  않습니다. 해당 디렉터리가 이미 존재할 때만 legacy import 또는 orphan-cleanup
  input으로 스캔합니다.
- Gateway `sessions.resolve`, session patch/reset/compact path, subagent spawning,
  fast abort, ACP metadata, heartbeat-isolated session, TUI patching은 더 이상 정상
  runtime 작업의 side effect로 레거시 session key를 마이그레이션하거나 prune하지
  않습니다.
- CLI command session resolution은 이제 `storePath` 대신 owning `agentId`를
  반환하며, 정상 `--to` 또는 `--session-id` resolution 중에 레거시 main-session 행을
  더 이상 복사하지 않습니다. 레거시 main-row canonicalization은 doctor에만 속합니다.
- Runtime subagent depth resolution은 더 이상 `sessions.json` 또는 JSON5 session
  store를 읽지 않습니다. agent id로 SQLite `session_entries`를 읽으며, 레거시
  depth/session metadata는 doctor import path를 통해서만 들어올 수 있습니다.
- Auth profile session override는 file-shaped session-store runtime을 lazy-load하는
  대신 직접 `{agentId, sessionKey}` 행 upsert를 통해 persist됩니다.
- Auto-reply verbose gating과 session update helper는 이제 session identity로 SQLite
  session 행을 read/upsert하며, persisted row state를 touch하기 전에 더 이상 레거시
  store path를 요구하지 않습니다.
- Command-run session metadata helper는 이제 entry-oriented 이름과 module path를
  사용합니다. 기존 `session-store` command helper 표면은 제거되었습니다.
- Bootstrap header seeding과 manual Compaction boundary hardening은 이제 SQLite
  transcript 행을 직접 mutate합니다. 런타임 caller는 writable `.jsonl` path가 아니라
  session identity를 전달합니다.
- Silent session-rotation replay는 SQLite transcript 행에서 `{agentId, sessionId}`로
  최근 user/assistant turn을 복사합니다. 더 이상 source 또는 target transcript
  locator를 받지 않습니다.
- 새로운 runtime session 행은 더 이상 transcript locator를 저장하지 않습니다. Caller는
  `{agentId, sessionId}`를 직접 사용합니다. export/debug command는 행을 materialize할
  때 output file name을 선택할 수 있습니다.
- 새 persisted transcript session을 시작하면 이제 항상 scope로 SQLite 행을 엽니다.
  Session manager는 더 이상 이전 file-era transcript path 또는 locator를 새 session의
  identity로 재사용하지 않습니다.
- Persisted transcript session은 명시적
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API를 사용합니다.
  기존 static `SessionManager.create/openForSession/list/forkFromSession` facade는
  제거되어 test와 runtime code가 실수로 file-era session discovery를 다시 만들 수
  없습니다.
- Plugin runtime은 더 이상 `api.runtime.agent.session.resolveTranscriptLocatorPath`를
  노출하지 않습니다. Plugin code는 SQLite row helper와 scope value를 사용합니다.
- public `session-store-runtime` SDK 표면은 이제 session row와 transcript row helper만
  export합니다. 집중된 SQLite schema/path/transaction helper는 `sqlite-runtime`에
  있으며, raw open/close/reset helper는 first-party test용으로만 local에 남아 있습니다.
- 레거시 `.jsonl` trajectory/checkpoint filename classifier는 이제 doctor legacy
  session-file module에 있습니다. Core session validation은 정상 SQLite session id를
  결정하기 위해 file-artifact helper를 더 이상 import하지 않습니다.
- Active Memory blocking subagent run은 Plugin state 아래에 임시 또는 persisted
  `session.jsonl` 파일을 만드는 대신 SQLite transcript 행을 사용합니다. 기존
  `transcriptDir` option은 제거되었습니다.
- One-off slug generation과 Crestodian planner run은 임시 `session.jsonl` 파일을 만드는
  대신 SQLite transcript 행을 사용합니다.
- `llm-task` helper run과 hidden commitment extraction도 SQLite transcript 행을
  사용하므로, 이러한 model-only helper session은 더 이상 임시 JSON/JSONL transcript
  파일을 만들지 않습니다.
- `TranscriptSessionManager`는 이제 열린 SQLite transcript scope일 뿐입니다.
  런타임 code는 `openTranscriptSessionManagerForSession({agentId, sessionId})`로
  엽니다. create, branch, continue, list, fork flow는 static manager facade가 아니라
  이를 소유한 SQLite row helper에 있습니다.
  Doctor/import/debug code는 런타임 session manager 밖에서 명시적 legacy source file을
  처리합니다.
- stale `SessionManager.newSession()` 및
  `SessionManager.createBranchedSession()` facade method는 제거되었습니다. 새 session과
  transcript descendant는 이미 열린 manager를 다른 persisted session으로 mutate하는
  대신, 이를 소유한 SQLite workflow가 만듭니다.
- Parent transcript fork 결정과 fork creation은 더 이상 `storePath` 또는 `sessionsDir`를
  받지 않습니다. 유지된 filesystem path metadata 대신 `{agentId, sessionId}` SQLite
  transcript scope를 사용합니다.
- Memory-host는 더 이상 no-op session-directory transcript classification helper를
  export하지 않습니다. transcript filtering은 이제 entry construction 중 SQLite row
  metadata에서 파생됩니다.
- Memory-host 및 QMD session-export test는 SQLite transcript scope를 사용합니다. 기존
  `agents/<agentId>/sessions/*.jsonl` path는 test가 의도적으로 doctor/import/export
  compatibility를 증명하는 곳에서만 계속 cover됩니다.
- QA-lab raw session inspection은 이제 Gateway를 통해 `sessions.list`를 사용합니다.
  `agents/qa/sessions/sessions.json`을 읽는 대신, MSteams 피드백은 JSONL 경로를 조작하지 않고 SQLite transcript에 직접 추가합니다.
- 공유 인바운드 채널 턴은 이제 레거시 `storePath` 대신 `{agentId, sessionKey}`를 전달합니다. LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal, iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo, Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon, Twitch, QQBot 기록 경로는 이제 updated-at 메타데이터를 읽고 SQLite identity를 통해 인바운드 세션 행을 기록합니다.
- Transcript locator 영속성은 활성 세션 행에서 제거되었습니다. `resolveSessionTranscriptTarget`은 `agentId`, `sessionId`, 선택적 topic 메타데이터를 반환하며, doctor만 레거시 transcript 파일 이름을 가져오는 코드입니다.
- 런타임 transcript 헤더는 SQLite 버전 `1`에서 시작합니다. 이전 JSONL V1/V2/V3 shape 업그레이드는 doctor 가져오기에만 존재하며, 행이 저장되기 전에 가져온 헤더를 현재 SQLite transcript 버전으로 정규화합니다.
- 데이터베이스 우선 guard는 이제 `SessionManager.listAll` 및 `SessionManager.forkFromSession`을 금지합니다. 세션 목록 및 fork/restore 워크플로는 row/scoped SQLite API에 머물러야 합니다.
- guard는 doctor/import 코드 밖에서 레거시 transcript JSONL parse/active-branch repair helper 이름도 금지하므로, 런타임은 두 번째 레거시 transcript 마이그레이션 경로를 만들 수 없습니다.
- Embedded PI 실행은 들어오는 transcript handle을 거부합니다. worker 실행 전과 시도가 transcript 상태에 닿기 전에 다시 SQLite `{agentId, sessionId}` identity를 사용합니다. 오래된 `/tmp/*.jsonl` 입력은 런타임 쓰기 대상을 선택할 수 없습니다.
- Cache trace, Anthropic payload, raw stream, diagnostics timeline 레코드는 이제 typed SQLite `diagnostic_events` 행에 기록됩니다. Gateway stability bundle은 이제 typed SQLite `diagnostic_stability_bundles` 행에 기록됩니다. 이전 `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`, `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`, `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL override 경로는 제거되었으며, 일반 stability capture는 더 이상 `logs/stability/*.json` 파일을 쓰지 않습니다.
- Cron 영속성은 이제 저장할 때마다 전체 job table을 삭제하고 다시 삽입하는 대신 SQLite `cron_jobs` 행을 조정합니다. Plugin target writeback은 일치하는 cron 행을 직접 업데이트하고 런타임 cron 상태를 같은 state-database transaction 안에 유지합니다.
- Cron 런타임 호출자는 이제 안정적인 SQLite cron store key를 사용합니다. 레거시 `cron.store` 경로는 doctor import 입력일 뿐입니다. production gateway, task maintenance, status, run-log, Telegram target writeback 경로는 `resolveCronStoreKey`를 사용하며 더 이상 key를 path-normalize하지 않습니다. Cron status는 이제 이전 파일 모양 `storePath` 필드 대신 `storeKey`를 보고합니다.
- Cron 런타임 로드 및 스케줄링은 더 이상 `jobId`, `schedule.cron`, 숫자 `atMs`, 문자열 boolean, 누락된 `sessionTarget` 같은 레거시 영속 job shape를 정규화하지 않습니다. Doctor legacy import가 행을 SQLite에 삽입하기 전에 해당 repair를 소유합니다.
- ACP spawn은 더 이상 transcript JSONL 파일 경로를 resolve하거나 영속화하지 않습니다. Spawn 및 thread-bind setup은 SQLite 세션 행을 직접 영속화하고 세션 id를 유지되는 transcript identity로 보관합니다.
- ACP 세션 메타데이터 API는 이제 `agentId`별로 SQLite 행을 read/list/upsert하며, 더 이상 `storePath`를 ACP 세션 entry contract의 일부로 노출하지 않습니다.
- 세션 사용량 accounting과 gateway 사용량 aggregation은 이제 `{agentId, sessionId}`만으로 transcript를 resolve합니다. cost/usage cache와 discovered-session summary는 더 이상 transcript locator 문자열을 합성하거나 반환하지 않습니다.
- Gateway chat append, abort-partial persistence, `/sessions.send`, webchat media transcript write는 SQLite transcript scope를 통해 직접 append합니다. gateway transcript-injection helper는 더 이상 `transcriptLocator` parameter를 받지 않습니다.
- SQLite transcript discovery는 이제 transcript scope와 stats만 나열합니다: `{agentId, sessionId, updatedAt, eventCount}`. 죽은 `listSqliteSessionTranscriptLocators` compatibility helper와 row별 `locator` 필드는 사라졌습니다.
- Transcript repair runtime은 이제 `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`만 노출합니다. 이전 locator 기반 repair helper는 삭제되었습니다. doctor/debug 코드는 명시적인 source file path를 읽으며 locator 문자열을 마이그레이션하지 않습니다.
- ACP replay ledger runtime은 이제 `acp/event-ledger.json` 대신 공유 SQLite state database에 세션별 replay 행을 저장합니다. doctor는 레거시 파일을 가져온 뒤 제거합니다.
- Gateway transcript reader helper는 이제 이전 `session-utils.fs` 모듈 이름 대신 `src/gateway/session-transcript-readers.ts`에 있습니다. fallback retry history check는 이전 file-helper surface 대신 SQLite transcript content를 기준으로 이름이 지정되었습니다.
- Gateway injected-chat 및 compaction helper는 이제 값을 transcript path나 source file로 이름 짓는 대신 내부 helper API를 통해 SQLite transcript scope를 전달합니다.
- Bootstrap continuation detection은 이제 `hasCompletedBootstrapTranscriptTurn`을 통해 SQLite transcript 행을 확인합니다. 더 이상 파일 모양 helper 이름을 노출하지 않습니다.
- Embedded-runner 테스트는 이제 SQLite transcript identity를 사용하며, 새 transcript manager를 열 때는 항상 명시적인 `sessionId`가 필요합니다.
- Memory indexing helper는 이제 처음부터 끝까지 SQLite transcript 용어를 사용합니다. host는 `listSessionTranscriptScopesForAgent`와 `sessionTranscriptKeyForScope`를 export하고, targeted sync queue는 `sessionTranscripts`를 사용하며, public session-search hit는 opaque `transcript:<agent>:<session>` 경로를 노출하고, 내부 DB source key는 가짜 파일 경로 대신 `source_kind='sessions'` 아래의 `session:<session>`입니다.
- generic plugin SDK persistent-dedupe helper는 더 이상 파일 모양 option을 노출하지 않습니다. 호출자는 SQLite scope key를 제공하고 durable dedupe 행은 공유 plugin state에 존재합니다.
- Microsoft Teams SSO token은 locked JSON 파일에서 SQLite plugin state로 이동했습니다. Doctor는 `msteams-sso-tokens.json`을 가져오고, payload에서 canonical SSO token key를 다시 만들고, source file을 제거합니다. Delegated OAuth token은 기존 private credential-file boundary에 남습니다.
- Matrix sync cache state는 `bot-storage.json`에서 SQLite plugin state로 이동했습니다. Doctor는 레거시 raw 또는 wrapped sync payload를 가져오고 source file을 제거합니다. 활성 Matrix 및 QA Matrix client는 가짜 `sync-store.json` 또는 `bot-storage.json` 경로가 아니라 SQLite sync-store root directory를 전달합니다.
- Matrix legacy crypto migration status는 `legacy-crypto-migration.json`에서 SQLite plugin state로 이동했습니다. Doctor는 이전 status file을 가져옵니다. Matrix SDK IndexedDB snapshot은 `crypto-idb-snapshot.json`에서 SQLite plugin blob으로 이동했습니다. Matrix recovery key와 credential은 SQLite plugin-state 행이며, 이전 JSON 파일은 doctor migration 입력일 뿐입니다.
- Memory Wiki activity log는 이제 `.openclaw-wiki/log.jsonl` 대신 SQLite plugin state를 사용합니다. Memory Wiki migration provider는 이전 JSONL log를 가져옵니다. wiki markdown과 user vault content는 workspace content로서 파일 기반으로 유지됩니다.
- Memory Wiki는 더 이상 `.openclaw-wiki/state.json` 또는 사용되지 않는 `.openclaw-wiki/locks` directory를 만들지 않습니다. migration provider는 이전 vault에 해당 retired plugin metadata file이 아직 있으면 제거합니다.
- Crestodian audit entry는 이제 `audit/crestodian.jsonl` 대신 core SQLite plugin state를 사용합니다. Doctor는 레거시 JSONL audit log를 가져오고 성공적으로 가져온 후 제거합니다.
- Config write/observe audit entry는 이제 `logs/config-audit.jsonl` 대신 core SQLite plugin state를 사용합니다. Doctor는 레거시 JSONL audit log를 가져오고 성공적으로 가져온 후 제거합니다.
- macOS companion은 더 이상 `openclaw.json`을 편집하는 동안 app-local `logs/config-audit.jsonl` 또는 `logs/config-health.json` sidecar를 쓰지 않습니다. config file은 파일 기반으로 유지되고, recovery snapshot은 config file 옆에 남으며, durable config audit/health state는 Gateway SQLite store에 속합니다.
- Crestodian rescue pending approval은 이제 `crestodian/rescue-pending/*.json` 대신 core SQLite plugin state를 사용합니다. Doctor는 레거시 pending approval 파일을 가져오고 성공적으로 가져온 후 제거합니다.
- Phone Control temporary arm state는 이제 `plugins/phone-control/armed.json` 대신 SQLite plugin state를 사용합니다. Doctor는 레거시 armed-state file을 `phone-control/arm-state` namespace로 가져오고 파일을 제거합니다.
- Doctor는 더 이상 JSONL transcript를 제자리에서 repair하거나 backup JSONL 파일을 만들지 않습니다. 활성 branch를 SQLite로 가져오고 레거시 source를 제거합니다.
- Session-memory hook transcript lookup은 `{agentId, sessionId}` scope-only SQLite read를 사용합니다. 해당 helper는 더 이상 transcript locator, 레거시 file read, file-rewrite option을 받거나 derive하지 않습니다.
- Codex app-server conversation binding은 이제 OpenClaw session key 또는 명시적 `{agentId, sessionId}` scope로 SQLite plugin state key를 지정합니다. transcript-path fallback binding을 보존해서는 안 됩니다.
- Codex app-server mirrored-history read는 SQLite transcript scope만 사용합니다. transcript file path에서 identity를 recover해서는 안 됩니다.
- Role-ordering 및 compaction reset 경로는 더 이상 이전 transcript 파일을 unlink하지 않습니다. reset은 SQLite session row와 transcript identity만 rotate합니다.
- Gateway reset 및 checkpoint response는 clean session row와 session id를 반환합니다. 더 이상 client를 위해 SQLite transcript locator를 합성하지 않습니다.
- Memory-core dreaming은 더 이상 누락된 JSONL 파일을 probe하여 session row를 prune하지 않습니다. Subagent cleanup은 filesystem existence check 대신 session runtime API를 거칩니다. transcript-ingestion 테스트는 `agents/<id>/sessions` fixture 또는 locator placeholder를 만드는 대신 SQLite 행을 직접 seed합니다.
- Memory transcript indexing은 citation/read helper를 위한 virtual search-hit path로 `transcript:<agentId>:<sessionId>`를 노출할 수 있습니다. durable index source는 relational(`source_kind='sessions'`, `source_key='session:<sessionId>'`, `session_id=<sessionId>`)이므로, 해당 값은 runtime transcript locator가 아니고 filesystem path도 아니며, session runtime API로 다시 전달되어서는 안 됩니다.
- Gateway doctor memory status는 `memory/.dreams/*.json` 대신 SQLite plugin-state 행에서 short-term recall 및 phase-signal count를 읽습니다. CLI 및 doctor output은 이제 해당 storage를 path가 아니라 SQLite store로 label합니다.
- Memory-core runtime, CLI status, Gateway doctor method, plugin SDK facade는 더 이상 레거시 `.dreams/session-corpus` 파일을 audit하거나 archive하지 않습니다. 해당 파일은 migration 입력일 뿐입니다. doctor는 이를 SQLite로 가져오고 verification 후 source를 삭제합니다. 활성 session-ingestion evidence 행은 이제 virtual SQLite path `memory/session-ingestion/<day>.txt`를 사용합니다. runtime은 `.dreams/session-corpus`에서 state를 쓰거나 derive하지 않습니다.
- Memory-core public artifact는 SQLite host event를 virtual JSON artifact `memory/events/memory-host-events.json`로 노출합니다. 더 이상 레거시 `.dreams/events.jsonl` source path를 재사용하지 않습니다.
- Sandbox container/browser registry는 이제 typed session, image, timestamp, backend/config, browser port column이 있는 공유 `sandbox_registry_entries` SQLite table을 사용합니다. Doctor는 레거시 monolithic 및 sharded JSON registry 파일을 가져오고 성공한 source를 제거합니다. Runtime read는 typed row column을 source of truth로 사용합니다. `entry_json`은 replay/debug copy일 뿐입니다.
- Commitment는 이제 whole-store JSON blob 대신 typed shared `commitments` table을 사용합니다. Snapshot save는 commitment id별로 upsert하고, table을 clear하고 다시 삽입하는 대신 누락된 행만 삭제합니다. Runtime은 typed scope, delivery-window, status, attempt, text column에서 commitment를 로드합니다. `record_json`은 replay/debug copy일 뿐입니다. Doctor는 레거시 `commitments.json`을 가져오고 성공적으로 가져온 후 제거합니다.
- Cron job definition, schedule state, run history에는 더 이상 런타임 JSON writer 또는 reader가 없습니다. Runtime은 typed schedule이 있는 `cron_jobs` 행을 사용합니다.
  payload, delivery, failure-alert, session, status, runtime-state 열과 status, 진단 요약, delivery 상태/오류,
  session/run, model, token 합계에 대한 형식화된 `cron_run_logs` 메타데이터. `job_json`은 replay/debug 사본일 뿐이며, `state_json`은 아직 빠른 쿼리 필드가 없는 중첩
  런타임 진단을 보관하는 반면 런타임은 형식화된 열에서 빠른 상태 필드를 다시 수화합니다. Doctor는
  레거시 `jobs.json`, `jobs-state.json`, `runs/*.jsonl` 파일을 가져오고
  가져온 원본을 제거합니다. Plugin 대상 writeback은 전체 cron 저장소를 로드하고 교체하는 대신 일치하는 `cron_jobs`
  행을 업데이트합니다.
- Gateway 시작은 런타임
  projection의 레거시 `notify: true` 마커를 무시합니다. Doctor는
  `cron.webhook`이 유효하면 이를 명시적 SQLite delivery로 변환하고,
  설정되지 않은 경우 비활성 마커를 제거하며, 구성된 Webhook이 유효하지 않으면 경고와 함께
  보존합니다.
- 아웃바운드 및 세션 delivery 큐는 이제 큐 상태, 항목 종류,
  세션 키, 채널, 대상, 계정 ID, 재시도 횟수, 마지막 시도/오류,
  복구 상태, 플랫폼 전송 마커를 공유
  `delivery_queue_entries` 테이블의 형식화된 열로 저장합니다. 런타임 복구는
  형식화된 열에서 해당 빠른 필드를 읽고, 재시도/복구 변경은 replay JSON을 다시 쓰지 않고 해당 열을 직접 업데이트합니다.
  전체 JSON payload는 메시지 본문 및 기타 콜드 replay 데이터에 대한
  replay/debug blob으로만 남습니다.
- 관리되는 발신 이미지 레코드는 이제 형식화된 공유
  `managed_outgoing_image_records` 행을 사용하며 미디어 바이트는 여전히
  `media_blobs`에 저장됩니다. JSON 레코드는 replay/debug 사본으로만 남습니다.
- Discord model-picker 기본 설정, command-deploy 해시, 스레드 바인딩은
  이제 공유 SQLite Plugin 상태를 사용합니다. 해당 레거시 JSON 가져오기 계획은
  코어 마이그레이션 코드가 아니라 Discord Plugin setup/doctor 마이그레이션 표면에 있습니다.
- Plugin 레거시 가져오기 감지기는
  `doctor-legacy-state.ts` 또는 `doctor-state-imports.ts` 같은 doctor 이름의 모듈을 사용합니다. 일반 채널 런타임
  모듈은 레거시 JSON 감지기를 가져오면 안 됩니다.
- BlueBubbles catchup 커서와 inbound dedupe 마커는 이제 공유 SQLite
  Plugin 상태를 사용합니다. 해당 레거시 JSON 가져오기 계획은 코어 마이그레이션 코드가 아니라 BlueBubbles Plugin
  setup/doctor 마이그레이션 표면에 있습니다.
- Telegram 업데이트 오프셋, 스티커 캐시 행, 보낸 메시지 캐시 행,
  토픽 이름 캐시 행, 스레드 바인딩은 이제 공유 SQLite Plugin
  상태를 사용합니다. 해당 레거시 JSON 가져오기 계획은 코어 마이그레이션 코드가 아니라 Telegram Plugin
  setup/doctor 마이그레이션 표면에 있습니다.
- iMessage catchup 커서, 회신 short-id 매핑, sent-echo dedupe 행은
  이제 공유 SQLite Plugin 상태를 사용합니다. 이전 `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, `imessage/sent-echoes.jsonl` 파일은
  doctor 입력으로만 사용됩니다.
- Feishu 메시지 dedupe 행은 이제
  `feishu/dedup/*.json` 파일 대신 공유 SQLite Plugin 상태를 사용합니다. 해당 레거시 JSON 가져오기 계획은 코어 마이그레이션 코드가 아니라 Feishu
  Plugin setup/doctor 마이그레이션 표면에 있습니다.
- Microsoft Teams 대화, 투표, 대기 중인 업로드 버퍼, 피드백
  학습은 이제 공유 SQLite Plugin 상태/blob 테이블을 사용합니다. 대기 중인 업로드
  경로는 `plugin_blob_entries`를 사용하므로 미디어 버퍼는 base64 JSON 대신 SQLite BLOB으로 저장됩니다.
  런타임 헬퍼 이름은 이제 `*-fs` 파일 저장소 이름이 아니라 SQLite/상태 이름을 사용하며,
  이전 `storePath` shim은 이러한 저장소에서 제거되었습니다. 해당 레거시 JSON 가져오기 계획은 Microsoft Teams
  Plugin setup/doctor 마이그레이션 표면에 있습니다.
- Zalo 호스팅 아웃바운드 미디어는 이제 `openclaw-zalo-outbound-media` JSON/bin 임시 sidecar 대신 공유 SQLite `plugin_blob_entries`를 사용합니다.
- Diffs viewer HTML과 메타데이터는 이제 `meta.json`/`viewer.html` 임시 파일 대신 공유 SQLite `plugin_blob_entries`를 사용합니다. 렌더링된 PNG/PDF 출력은 채널 delivery가 여전히 파일 경로를 필요로 하므로
  임시 materialization으로 유지됩니다.
- Canvas 관리 문서는 이제 기본 `state/canvas/documents` 디렉터리 대신 공유 SQLite `plugin_blob_entries`를 사용합니다. Canvas 호스트는 해당
  blob을 직접 제공하며, 로컬 파일은 명시적 `host.root`
  운영자 콘텐츠 또는 다운스트림 미디어 리더가 경로를 요구할 때의 임시 materialization에만 생성됩니다.
- File Transfer 감사 결정은 이제 무제한 `audit/file-transfer.jsonl` 런타임 로그 대신 공유 SQLite `plugin_state_entries`를 사용합니다. Doctor는
  레거시 JSONL 감사 파일을 Plugin 상태로 가져오고 정상적으로 가져온 후 원본을 제거합니다.
- ACPX 프로세스 lease와 Gateway 인스턴스 ID는 이제 공유 SQLite Plugin
  상태를 사용합니다. Doctor는 레거시 `gateway-instance-id` 파일을 Plugin 상태로 가져오고
  원본을 제거합니다.
- ACPX 생성 wrapper 스크립트와 격리된 Codex home은 영구 OpenClaw 상태가 아니라 OpenClaw 임시 루트 아래의 임시
  materialization입니다. 영구 ACPX 런타임 레코드는 SQLite lease와 gateway-instance 행입니다.
  이전 ACPX `stateDir` config 표면은 더 이상 런타임 상태가
  그곳에 기록되지 않으므로 제거되었습니다.
- Gateway 미디어 첨부 파일은 이제 공유 `media_blobs` SQLite 테이블을
  표준 바이트 저장소로 사용합니다. 채널 및 sandbox 호환성 표면에 반환되는 로컬 경로는
  영구 미디어 저장소가 아니라 데이터베이스 행의 임시 materialization입니다. 런타임 미디어 허용 목록은 더 이상 레거시
  `$OPENCLAW_STATE_DIR/media` 또는 config-dir `media` 루트를 포함하지 않습니다. 해당 디렉터리는
  doctor 가져오기 원본으로만 사용됩니다.
- Shell completion은 더 이상 `$OPENCLAW_STATE_DIR/completions/*` 캐시
  파일을 쓰지 않습니다. install, doctor, update, release smoke 경로는 영구 completion cache
  파일 대신 생성된 completion 출력 또는 profile sourcing을 사용합니다.
- Gateway skill-upload staging은 이제 공유 `skill_uploads` 행을 사용합니다. 업로드
  메타데이터, idempotency key, archive 바이트는 SQLite에 있으며, installer는
  install이 실행 중일 때만 임시 materialized archive 경로를 받습니다.
- Subagent 인라인 첨부 파일은 더 이상 workspace
  `.openclaw/attachments/*` 아래에 materialize되지 않습니다. spawn 경로는 SQLite VFS seed entries를 준비하고,
  인라인 실행은 해당 항목을 per-agent 런타임 scratch namespace에 seed하며,
  disk-backed tools는 첨부 파일 경로에 대해 해당 SQLite scratch를 overlay합니다. 이전 subagent-run attachment-dir registry 열과 cleanup hook은 제거되었습니다.
- CLI 이미지 hydration은 더 이상 안정적인 `openclaw-cli-images` 캐시
  파일을 유지하지 않습니다. 외부 CLI backend는 여전히 파일 경로를 받지만, 해당 경로는
  cleanup이 포함된 per-run 임시 materialization입니다.
- Cache-trace 진단, Anthropic payload 진단, raw model stream
  진단, diagnostics timeline 이벤트, Gateway stability bundle은 이제
  `logs/*.jsonl` 또는 `logs/stability/*.json` 파일 대신 SQLite 행을 씁니다.
  런타임 경로 override flag와 env var는 제거되었습니다. export/debug
  명령은 데이터베이스 행에서 파일을 명시적으로 materialize할 수 있습니다.
- macOS companion에는 더 이상 rolling `diagnostics.jsonl` writer가 없습니다. App
  로그는 unified logging으로 이동하고, 영구 Gateway 진단은 SQLite-backed 상태로 유지됩니다.
- macOS port-guardian 레코드 목록은 이제 Application Support JSON 파일
  또는 opaque singleton blob 대신 형식화된 공유 SQLite
  `macos_port_guardian_records` 행을 사용합니다.
- Gateway singleton lock은 이제 temp-dir lock 파일 대신
  `gateway_locks` scope 아래의 형식화된 공유 SQLite `state_leases` 행을 사용합니다. Fly 및 OAuth
  troubleshooting 문서는 이제 오래된 file-lock cleanup 대신 SQLite lease/auth refresh lock을 가리킵니다.
- Gateway restart sentinel 상태는 이제 `restart-sentinel.json` 대신 형식화된 공유 SQLite
  `gateway_restart_sentinel` 행을 사용합니다. 런타임은
  sentinel kind, status, routing, message, continuation, stats를 형식화된 열에서 읽습니다.
  `payload_json`은 replay/debug 사본일 뿐입니다. 런타임 코드는 SQLite 행을 직접 정리하며 더 이상 file cleanup plumbing을 포함하지 않습니다.
- Gateway restart intent와 supervisor handoff 상태는 이제
  `gateway-restart-intent.json` 및
  `gateway-supervisor-restart-handoff.json` sidecar 대신 형식화된 공유 SQLite
  `gateway_restart_intent` 및 `gateway_restart_handoff` 행을 사용합니다.
- Gateway singleton 조정은 이제 `gateway.<hash>.lock` 파일을 쓰는 대신
  `gateway_locks` 아래의 형식화된 `state_leases` 행을 사용합니다. lease 행은
  lock owner, expiry, heartbeat, debug payload를 소유하며, SQLite가
  atomic acquire/release 경계를 소유합니다. 폐기된 file-lock 디렉터리 옵션은
  제거되었습니다. 테스트는 SQLite 행 ID를 직접 사용합니다.
- `cron/runs/*.jsonl`
  파일을 스캔하던 이전의 참조되지 않는 cron usage-report helper는 삭제되었습니다. Cron run history report는 형식화된
  `cron_run_logs` SQLite 행을 읽어야 합니다.
- Main-session restart recovery는 이제 `agents/*/sessions`
  디렉터리를 스캔하는 대신 SQLite `agent_databases` registry를 통해 후보 agent를 발견합니다.
- Gemini session-corruption recovery는 이제 SQLite session 행만 삭제합니다.
  더 이상 레거시 `storePath` gate가 필요하지 않으며 파생된
  transcript JSONL 경로의 연결 해제를 시도하지 않습니다.
- Path override 처리는 이제 리터럴 `undefined`/`null` environment
  값을 unset으로 취급하여 테스트 또는 shell handoff 중 실수로 repo-root `undefined/state/*.sqlite`
  데이터베이스가 생성되는 것을 방지합니다.
- Config health fingerprint는 이제 `logs/config-health.json` 대신 형식화된 공유 SQLite `config_health_entries`
  행을 사용하여 일반 config 파일만 유일한 non-credential configuration 문서로 유지합니다. macOS companion은 process-local health 상태만 유지하고
  이전 JSON sidecar를 다시 생성하지 않습니다.
- Auth profile 런타임은 더 이상 credential JSON 파일을 가져오거나 쓰지 않습니다.
  표준 credential 저장소는 SQLite입니다. `auth-profiles.json`, per-agent
  `auth.json`, 공유 `credentials/oauth.json`은 가져온 후 제거되는 doctor 마이그레이션 입력입니다.
- Auth profile save/state 테스트는 이제 형식화된 SQLite auth 테이블을 직접 assert하며,
  레거시 auth-profile 파일 이름은 doctor 마이그레이션 입력에만 사용합니다.
- `openclaw secrets apply`는 config 파일, env 파일, SQLite
  auth-profile 저장소만 scrub합니다. 더 이상 폐기된 per-agent `auth.json`을 수정하는
  호환성 로직을 포함하지 않습니다. doctor가 해당 파일을 가져오고 삭제하는 일을 소유합니다.
- Hermes secret 마이그레이션 계획 및 적용은 가져온 API-key profile을 SQLite auth-profile 저장소에 직접 넣습니다. 더 이상
  `auth-profiles.json`을 중간 대상으로 쓰거나 검증하지 않습니다.
- 사용자 대상 auth 문서는 이제 사용자에게 `auth-profiles.json`을 검사하거나 복사하라고 안내하는 대신
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>`를 설명합니다. 레거시 OAuth/auth JSON
  이름은 doctor-import 입력으로만 문서화됩니다.
- 코어 state-path helper는 더 이상 폐기된 `credentials/oauth.json`
  파일을 노출하지 않습니다. 레거시 파일 이름은 doctor auth 가져오기 경로에만 local로 존재합니다.
- Install, security, onboarding, model-auth, SecretRef 문서는 이제
  per-agent auth-profile JSON 파일 대신 SQLite auth-profile 행과 전체 상태 backup/migration을 설명합니다.
- PI model discovery는 이제 표준 credential을 in-memory
  `pi-coding-agent` auth storage로 전달합니다. discovery 중 더 이상 per-agent `auth.json`을 생성, scrub 또는 쓰지 않습니다.
- Voice Wake trigger 및 routing 설정은 이제 `settings/voicewake.json`, `settings/voicewake-routing.json` 또는
  opaque generic row 대신 형식화된 공유 SQLite 테이블을 사용합니다. doctor는 레거시 JSON 파일을 가져오고 성공적으로 마이그레이션한 후 제거합니다.
- Update-check 상태는 이제 `update-check.json` 또는 opaque generic blob 대신
  형식화된 공유 `update_check_state` 행을 사용합니다. doctor는
  레거시 JSON 파일을 가져오고 성공적으로 마이그레이션한 후 제거합니다.
- Config health 상태는 이제 `logs/config-health.json` 또는 opaque generic blob 대신 형식화된 공유 `config_health_entries` 행을 사용합니다. doctor는
  레거시 JSON 파일을 가져오고 성공적으로 마이그레이션한 후 제거합니다.
- Plugin conversation binding approval은 이제 opaque 공유 SQLite 상태 또는 대신 형식화된
  `plugin_binding_approvals` 행을 사용합니다.
  `plugin-binding-approvals.json`; 레거시 파일은 doctor 마이그레이션 입력입니다.
- 일반 현재 대화 바인딩은 이제
  `bindings/current-conversations.json`을 다시 쓰는 대신 타입이 지정된
  `current_conversation_bindings` 행을 저장합니다. doctor는 레거시 JSON 파일을 가져오고
  마이그레이션이 성공하면 이를 제거합니다.
- Memory Wiki 가져온 소스 동기화 원장은 이제 `.openclaw-wiki/source-sync.json`을
  다시 쓰는 대신 볼트/소스 키마다 하나의 SQLite Plugin-state 행을 저장합니다.
  마이그레이션 제공자는 레거시 JSON 원장을 가져오고 제거합니다.
- Memory Wiki ChatGPT 가져오기 실행 기록은 이제
  `.openclaw-wiki/import-runs/*.json`에 쓰는 대신 볼트/실행 ID마다 하나의
  SQLite Plugin-state 행을 저장합니다. 롤백 스냅샷은 가져오기 실행 스냅샷
  보관이 blob 저장소로 이동될 때까지 명시적인 볼트 파일로 유지됩니다.
- Memory Wiki 컴파일된 다이제스트는 이제
  `.openclaw-wiki/cache/agent-digest.json` 및
  `.openclaw-wiki/cache/claims.jsonl`에 쓰는 대신 SQLite Plugin blob 행을
  저장합니다. 마이그레이션 제공자는 오래된 캐시 파일을 가져오고 캐시 디렉터리가
  비면 이를 제거합니다.
- ClawHub Skills 설치 추적은 이제 런타임에 `.clawhub/lock.json` 및
  `.clawhub/origin.json` 사이드카를 쓰거나 읽는 대신 워크스페이스/Skills마다
  하나의 SQLite Plugin-state 행을 저장합니다. 런타임 코드는 파일 형태의
  락파일/원본 추상화 대신 추적된 설치 상태 객체를 사용합니다. doctor는 구성된
  에이전트 워크스페이스에서 레거시 사이드카를 가져오고 깔끔하게 가져온 후 이를
  제거합니다.
- 설치된 Plugin 인덱스는 이제 `plugins/installs.json` 대신 타입이 지정된 공유
  SQLite `installed_plugin_index` 단일 행을 읽고 씁니다. 레거시 JSON 파일은
  doctor 마이그레이션 입력일 뿐이며 가져온 후 제거됩니다.
- 레거시 `plugins/installs.json` 경로 헬퍼는 이제 doctor 레거시 코드에 있습니다.
  런타임 Plugin 인덱스 모듈은 JSON 파일 경로가 아니라 SQLite 기반 영속성 옵션만
  노출합니다.
- Gateway 재시작 센티널, 재시작 의도, supervisor 핸드오프 상태는 이제 일반
  불투명 blob 대신 타입이 지정된 공유 SQLite 행(`gateway_restart_sentinel`,
  `gateway_restart_intent`, `gateway_restart_handoff`)을 사용합니다. 런타임
  재시작 코드에는 파일 형태의 센티널/의도/핸드오프 계약이 없습니다.
- Matrix 동기화 캐시, 저장소 메타데이터, 스레드 바인딩, 인바운드 중복 제거
  표시자, 시작 검증 쿨다운 상태, SDK IndexedDB 암호화 스냅샷, 자격 증명, 복구
  키는 이제 공유 SQLite Plugin 상태/blob 테이블을 사용합니다. 런타임 경로
  구조체는 더 이상 `storage-meta.json` 메타데이터 경로를 노출하지 않습니다.
  해당 파일 이름은 레거시 마이그레이션 입력일 뿐입니다. 이들의 레거시 JSON
  가져오기 계획은 Matrix Plugin 설정/doctor 마이그레이션 표면에 있습니다.
- Matrix 시작은 더 이상 레거시 Matrix 파일 상태를 스캔하거나, 보고하거나,
  완료하지 않습니다. Matrix 파일 감지, 레거시 암호화 스냅샷 생성, room-key
  복원 마이그레이션 상태, 가져오기, 소스 제거는 모두 doctor가 소유합니다.
- Matrix 런타임 마이그레이션 배럴은 제거되었습니다. 레거시 상태/암호화 감지 및
  변경 헬퍼는 런타임 API 표면의 일부가 아니라 Matrix doctor가 직접 가져옵니다.
- Matrix 마이그레이션 스냅샷 재사용 표시자는 이제
  `matrix/migration-snapshot.json` 대신 SQLite Plugin 상태에 있습니다. doctor는
  사이드카 상태 파일을 쓰지 않고도 동일한 검증된 마이그레이션 전 아카이브를 계속
  재사용할 수 있습니다.
- Nostr 버스 커서와 프로필 게시 상태는 이제 공유 SQLite Plugin 상태를 사용합니다.
  이들의 레거시 JSON 가져오기 계획은 Nostr Plugin 설정/doctor 마이그레이션 표면에
  있습니다.
- Active Memory 세션 토글은 이제 `session-toggles.json` 대신 공유 SQLite Plugin
  상태를 사용합니다. 메모리를 다시 켜면 JSON 객체를 다시 쓰는 대신 행을
  삭제합니다.
- Skill Workshop 제안과 검토 카운터는 이제 워크스페이스별
  `skill-workshop/<workspace>.json` 저장소 대신 공유 SQLite Plugin 상태를
  사용합니다. 각 제안은 `skill-workshop/proposals` 아래 별도 행이고, 검토
  카운터는 `skill-workshop/reviews` 아래 별도 행입니다.
- Skill Workshop 검토자 하위 에이전트 실행은 이제
  `skill-workshop/<sessionId>.json` 사이드카 세션 경로를 만드는 대신 런타임 세션
  transcript resolver를 사용합니다.
- ACPX 프로세스 lease는 이제 전체 파일 `process-leases.json` 레지스트리 대신
  `acpx/process-leases` 아래 공유 SQLite Plugin 상태를 사용합니다. 각 lease는
  자체 행으로 저장되어 런타임 JSON 재작성 경로 없이도 시작 시 오래된 프로세스
  수거를 보존합니다.
- ACPX 래퍼 스크립트와 격리된 Codex 홈은 OpenClaw 임시 루트에 생성됩니다.
  필요할 때 다시 만들어지며 백업 또는 마이그레이션 입력이 아닙니다.
- 하위 에이전트 실행 레지스트리 영속성은 타입이 지정된 공유 `subagent_runs` 행을
  사용합니다. 오래된 `subagents/runs.json` 경로는 이제 doctor 마이그레이션
  입력일 뿐이며, 런타임 헬퍼 이름은 더 이상 상태 계층을 디스크 기반으로
  설명하지 않습니다. 런타임 테스트는 더 이상 레지스트리 동작을 증명하기 위해
  잘못되었거나 비어 있는 `runs.json` fixture를 만들지 않습니다. 대신 SQLite 행을
  직접 시드하고 읽습니다.
- 백업은 아카이브하기 전에 상태 디렉터리를 스테이징하고, 데이터베이스가 아닌
  파일을 복사하며, `VACUUM INTO`로 `*.sqlite` 데이터베이스를 스냅샷하고,
  live WAL/SHM 사이드카를 생략하며, 아카이브 manifest에 스냅샷 메타데이터를
  기록하고, 완료된 백업 실행을 아카이브 manifest와 함께 SQLite에 기록합니다.
  `openclaw backup create`는 기본적으로 작성된 아카이브를 검증합니다.
  `--no-verify`는 명시적인 빠른 경로입니다.
- `openclaw backup restore`는 추출 전에 아카이브를 검증하고, 검증기의 정규화된
  manifest를 재사용하며, 검증된 manifest 자산을 기록된 소스 경로로 복원합니다.
  쓰기에는 `--yes`가 필요하며 복원 계획에는 `--dry-run`을 지원합니다.
- 오래된 백업 volatile-path 필터는 삭제되었습니다. SQLite 스냅샷이 아카이브 생성
  전에 스테이징되므로 백업에는 더 이상 레거시 세션 또는 Cron JSON/JSONL 파일을
  위한 live-tar 건너뛰기 목록이 필요하지 않습니다.
- 일반 설정 및 온보딩 워크스페이스 준비는 더 이상 `agents/<agentId>/sessions/`
  디렉터리를 만들지 않습니다. 구성/워크스페이스만 만들며, SQLite 세션 행과
  transcript 행은 필요할 때 에이전트별 데이터베이스에 생성됩니다.
- 보안 권한 복구는 이제 `sessions.json` 및 transcript JSONL 파일 대신 전역 및
  에이전트별 SQLite 데이터베이스와 WAL/SHM 사이드카를 대상으로 합니다.
- 샌드박스 레지스트리 런타임 이름은 이제 활성 저장소에 레거시 JSON 레지스트리
  용어를 유지하는 대신 SQLite 레지스트리 종류를 직접 설명합니다.
- `openclaw reset --scope config+creds+sessions`는 레거시 `sessions/` 디렉터리뿐
  아니라 에이전트별 `openclaw-agent.sqlite` 데이터베이스와 WAL/SHM 사이드카도
  제거합니다.
- Gateway 집계 세션 헬퍼는 이제 항목 중심 이름을 사용합니다.
  `loadCombinedSessionEntriesForGateway`는 `{ databasePath, entries }`를
  반환합니다. 오래된 combined-store 명명은 런타임 호출자에서 제거되었습니다.
- Docker MCP 채널 시딩은 이제 `sessions.json` 및 JSONL transcript를 만드는 대신
  메인 세션 행과 transcript 이벤트를 에이전트별 SQLite 데이터베이스에 씁니다.
- 번들된 session-memory 훅은 이제 `{agentId, sessionId}`로 SQLite에서 이전 세션
  컨텍스트를 확인합니다. 더 이상 transcript 경로나 `workspace/sessions`
  디렉터리를 스캔, 저장, 합성하지 않습니다.
- 번들된 command-logger 훅은 이제 `logs/commands.log`에 추가하는 대신 공유
  SQLite `command_log_entries` 테이블에 명령 감사 행을 씁니다.
- 채널 페어링 허용 목록은 이제 런타임과 Plugin SDK에서 SQLite 기반 읽기/쓰기
  헬퍼만 노출합니다. 오래된 `*-allowFrom.json` 경로 resolver와 파일 reader는
  doctor 레거시 가져오기 코드 아래에만 있습니다.
- `migration_runs`는 레거시 상태 마이그레이션 실행을 상태, 타임스탬프, JSON
  보고서와 함께 기록합니다.
- `migration_sources`는 가져온 각 레거시 파일 소스를 해시, 크기, 레코드 수, 대상
  테이블, 실행 ID, 상태, 소스 제거 상태와 함께 기록합니다.
- `backup_runs`는 백업 아카이브 경로, 상태, JSON manifest를 기록합니다.
- 전역 스키마는 사용되지 않는 `agents` 레지스트리 테이블을 유지하지 않습니다.
  런타임에 실제 에이전트 레코드 소유자가 생기기 전까지 에이전트 데이터베이스
  발견은 정식 `agent_databases` 레지스트리입니다.
- 생성된 모델 카탈로그 구성은 에이전트 디렉터리를 키로 하는 타입이 지정된 전역
  SQLite `agent_model_catalogs` 행에 저장됩니다. 런타임 호출자는
  `ensureOpenClawModelCatalog`를 사용합니다. 런타임 코드에는 `models.json` 호환성
  API가 없습니다. 구현은 SQLite에 쓰며, 내장된 PI 레지스트리는 `models.json`
  파일을 만들지 않고 해당 저장된 payload에서 hydrate됩니다.
- QMD 세션 transcript 마크다운 내보내기와 `memory.qmd.sessions` 구성은
  제거되었습니다. QMD transcript 컬렉션도, `qmd/sessions*` 런타임 경로도, 파일
  기반 세션 메모리 브리지도 없습니다.
- memory-core 런타임은 QMD SDK 하위 경로가 아니라
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`에서 SQLite
  transcript 인덱싱 헬퍼를 가져옵니다. QMD 하위 경로는 주요 SDK 정리가 이를
  제거할 수 있을 때까지 외부 호출자를 위해 호환성 재내보내기만 유지합니다.
- QMD 자체 `index.sqlite`는 이제 메인 SQLite `plugin_blob_entries` 테이블이
  뒷받침하는 임시 런타임 materialization입니다. 런타임은 더 이상 영구적인
  `~/.openclaw/agents/<agentId>/qmd` 사이드카를 만들지 않습니다.
- 선택적 `memory-lancedb` Plugin은 더 이상
  `~/.openclaw/memory/lancedb`를 암시적인 OpenClaw 관리 저장소로 만들지 않습니다.
  이는 외부 LanceDB 백엔드이며 운영자가 명시적인 `dbPath`를 구성할 때까지
  비활성화된 상태로 유지됩니다.
- `check:database-first-legacy-stores`는 레거시 저장소 이름을 쓰기 스타일 파일
  시스템 API와 짝짓는 새 런타임 소스에 실패합니다. 또한 은퇴한 transcript 브리지
  표시자 `transcriptLocator` 또는 `sqlite-transcript://...`를 다시 도입하는
  런타임 소스에도 실패합니다. 마이그레이션, doctor, 가져오기, 명시적인 비세션
  내보내기 코드는 계속 허용됩니다. `sessionFile`, `storePath`, 오래된
  `SessionManager` 파일 시대 facade 같은 더 넓은 레거시 계약 이름은 아직 현재
  소유자가 있으며, 필수 사전 검사로 전환되기 전에 별도의 마이그레이션 가드 작업이
  필요합니다. 이제 이 가드는 런타임 `cache/*.json` 저장소, 일반
  `thread-bindings.json` 사이드카, Cron 상태/실행 로그 JSON, 구성 상태 JSON,
  재시작 및 잠금 사이드카, Voice Wake 설정, Plugin 바인딩 승인, 설치된 Plugin
  인덱스 JSON, File Transfer 감사 JSONL, Memory Wiki 활동 로그, 오래된 번들
  `command-logger` 텍스트 로그, pi-mono raw-stream JSONL 진단 knobs도 포함합니다.
  또한 호환성 코드가 `src/commands/doctor/` 아래에 머물도록 오래된 루트 수준
  doctor 레거시 모듈 이름도 금지합니다. Android 디버그 핸들러도
  `camera_debug.log` 또는 `debug_logs.txt` 캐시 파일을 스테이징하는 대신
  logcat/in-memory 출력을 사용합니다.

## 대상 스키마 형태

스키마를 명시적으로 유지하세요. 호스트 소유 런타임 상태는 타입이 지정된 테이블을 사용합니다. Plugin 소유 불투명 상태는 `plugin_state_entries` / `plugin_blob_entries`를 사용하며, 범용 호스트 `kv` 테이블은 없습니다.

전역 데이터베이스:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

에이전트 데이터베이스:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

향후 검색은 표준 이벤트 테이블을 변경하지 않고 FTS 테이블을 추가할 수 있습니다.

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

큰 값은 JSON 문자열 인코딩이 아니라 `blob` 열을 사용해야 합니다. 일반 SQLite 도구로 계속 검사할 수 있어야 하는 작은 구조화 데이터에는 `value_json`을 유지하세요.

`agent_databases`는 이 브랜치의 표준 레지스트리입니다. 실제 에이전트 레코드 소유자가 생기기 전까지 `agents` 테이블을 추가하지 마세요. 에이전트 구성은 `openclaw.json`에 남아 있습니다.

## Doctor 마이그레이션 형태

Doctor는 보고 가능하고 안전하게 다시 실행할 수 있는 하나의 명시적 마이그레이션 단계를 호출해야 합니다.

```bash
openclaw doctor --fix
```

`openclaw doctor --fix`는 일반 구성 사전 점검 후 상태 마이그레이션 구현을 호출하고, 가져오기 전에 검증된 백업을 생성합니다. 런타임 시작 및 `openclaw migrate`는 레거시 OpenClaw 상태 파일을 가져오면 안 됩니다.

마이그레이션 속성:

- 하나의 마이그레이션 패스가 모든 레거시 파일 소스를 발견하고, 어떤 것도 변경하기 전에 계획을 생성합니다.
- Doctor는 레거시 파일을 가져오기 전에 검증된 사전 마이그레이션 백업 아카이브를 생성합니다.
- 가져오기는 멱등적이며 소스 경로, mtime, 크기, 해시, 대상 테이블을 키로 사용합니다.
- 성공한 소스 파일은 대상 데이터베이스가 커밋된 후 제거되거나 아카이브됩니다.
- 실패한 가져오기는 소스를 그대로 두고 `migration_runs`에 경고를 기록합니다.
- 런타임 코드는 마이그레이션이 존재한 후 SQLite만 읽습니다.
- 다운그레이드/런타임 파일로 내보내기 경로는 필요하지 않습니다.

## 마이그레이션 인벤토리

다음을 전역 데이터베이스로 이동하세요:

- 작업 레지스트리 런타임 쓰기는 이제 공유 데이터베이스를 사용합니다. 배포되지 않은
  `tasks/runs.sqlite` 사이드카 임포터는 삭제되었습니다. 스냅샷 저장은 작업
  id 기준으로 업서트하고 누락된 작업/전달 행만 삭제합니다.
- Task Flow 런타임 쓰기는 이제 공유 데이터베이스를 사용합니다. 배포되지 않은
  `tasks/flows/registry.sqlite` 사이드카 임포터는 삭제되었습니다. 스냅샷 저장은
  플로우 id 기준으로 업서트하고 누락된 플로우 행만 삭제합니다.
- Plugin 상태 런타임 쓰기는 이제 공유 데이터베이스를 사용합니다. 배포되지 않은
  `plugin-state/state.sqlite` 사이드카 임포터는 삭제되었습니다.
- 내장 메모리 검색은 더 이상 기본값으로 `memory/<agentId>.sqlite`를 사용하지 않습니다. 해당
  인덱스 테이블은 소유 에이전트 데이터베이스에 있으며, 명시적
  `memorySearch.store.path` 사이드카 옵트인은 doctor 구성
  마이그레이션으로 폐기되었습니다.
- 내장 메모리 재인덱싱은 에이전트 데이터베이스에서 메모리가 소유한 테이블만 재설정합니다.
  같은 데이터베이스가 세션, transcript, VFS 행, artifact, 런타임 캐시를
  소유하므로 SQLite 파일 전체를 교체해서는 안 됩니다.
- 모놀리식 및 샤딩된 JSON의 sandbox 컨테이너/브라우저 레지스트리. 런타임
  쓰기는 이제 공유 데이터베이스를 사용하며, 레거시 JSON 가져오기는 유지됩니다.
- Cron 작업 정의, 일정 상태, 실행 기록은 이제 공유 SQLite를 사용합니다.
  doctor는 레거시 `jobs.json`, `jobs-state.json`,
  `cron/runs/*.jsonl` 파일을 가져오고 제거합니다.
- 디바이스 ID/auth, push, 업데이트 확인, commitments, OpenRouter 모델
  캐시, 설치된 Plugin 인덱스, app-server 바인딩
- 디바이스/Node 페어링 및 부트스트랩 레코드는 이제 형식화된 SQLite 테이블을 사용합니다.
- device-pair 알림 구독자와 전달된 요청 마커는 이제
  `device-pair-notify.json` 대신 공유 SQLite Plugin 상태 테이블을 사용합니다.
- 음성 통화 레코드는 이제 `calls.jsonl` 대신
  `voice-call` / `calls` 네임스페이스 아래의 공유 SQLite Plugin 상태 테이블을 사용합니다. Plugin CLI는
  SQLite 기반 통화 기록을 tail하고 요약합니다.
- QQBot Gateway 세션, 알려진 사용자 레코드, ref-index 인용 캐시는 이제
  `session-*.json`, `known-users.json`,
  `ref-index.jsonl` 대신 `qqbot` 네임스페이스(`sessions`, `known-users`,
  `ref-index`) 아래의 SQLite Plugin 상태를 사용합니다. QQBot doctor/setup 마이그레이션은
  레거시 파일을 가져오고 제거합니다.
- Discord 모델 선택기 기본 설정, 명령 배포 해시, 스레드 바인딩은 이제
  `model-picker-preferences.json`, `command-deploy-cache.json`,
  `thread-bindings.json` 대신 `discord` 네임스페이스
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`) 아래의 SQLite Plugin 상태를
  사용합니다. Discord doctor/setup 마이그레이션은 레거시 파일을 가져오고
  제거합니다.
- BlueBubbles catchup 커서와 inbound dedupe 마커는 이제
  `bluebubbles/catchup/*.json` 및
  `bluebubbles/inbound-dedupe/*.json` 대신 `bluebubbles` 네임스페이스(`catchup-cursors`, `inbound-dedupe`) 아래의 SQLite Plugin
  상태를 사용합니다. BlueBubbles doctor/setup 마이그레이션은
  레거시 파일을 가져오고 제거합니다.
- Telegram 업데이트 오프셋, 스티커 캐시 항목, reply-chain 메시지 캐시
  항목, 보낸 메시지 캐시 항목, topic-name 캐시 항목, 스레드
  바인딩은 이제 `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json`,
  `thread-bindings-*.json` 대신 `telegram` 네임스페이스
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) 아래의 SQLite Plugin 상태를 사용합니다. Telegram doctor/setup 마이그레이션은
  레거시 파일을 가져오고 제거합니다.
- iMessage catchup 커서, reply short-id 매핑, sent-echo dedupe 행은
  이제 `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, `imessage/sent-echoes.jsonl` 대신 `imessage` 네임스페이스(`catchup-cursors`,
  `reply-cache`, `sent-echoes`) 아래의 SQLite Plugin 상태를 사용합니다. iMessage
  doctor/setup 마이그레이션은 레거시 파일을 가져오고 제거합니다.
- Microsoft Teams 대화, poll, SSO 토큰, feedback learning은 이제
  `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json`, `*.learnings.json` 대신 SQLite Plugin 상태 네임스페이스(`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`)를 사용합니다. Microsoft Teams doctor/setup 마이그레이션은
  레거시 파일을 가져오고 보관합니다.
  보류 중인 업로드는 단기 SQLite 캐시이며 이전 JSON 캐시 파일은
  마이그레이션되지 않습니다.
- Matrix 동기화 캐시, 스토리지 메타데이터, 스레드 바인딩, inbound dedupe 마커,
  시작 검증 cooldown 상태, 자격 증명, 복구 키, SDK
  IndexedDB crypto 스냅샷은 이제 `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json`, `crypto-idb-snapshot.json` 대신 `matrix` 아래의 SQLite Plugin 상태/blob 네임스페이스
  (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)를
  사용합니다. Matrix doctor/setup 마이그레이션은 계정 범위 Matrix
  스토리지 루트에서 해당 레거시 파일을 가져오고 제거합니다.
- Nostr 버스 커서와 프로필 게시 상태는 이제
  `bus-state-*.json` 및 `profile-state-*.json` 대신
  `nostr` 네임스페이스(`bus-state`, `profile-state`) 아래의 SQLite Plugin 상태를 사용합니다. Nostr doctor/setup
  마이그레이션은 레거시 파일을 가져오고 제거합니다.
- Active Memory 세션 토글은 이제 `session-toggles.json` 대신
  `active-memory/session-toggles` 아래의 SQLite Plugin 상태를 사용합니다.
- Skill Workshop 제안 큐와 리뷰 카운터는 이제
  워크스페이스별 `skill-workshop/<workspace>.json` 파일 대신
  `skill-workshop/proposals` 및 `skill-workshop/reviews` 아래의 SQLite Plugin 상태를 사용합니다.
- 아웃바운드 전달 및 세션 전달 큐는 이제 영속
  `delivery-queue/*.json`, `delivery-queue/failed/*.json`,
  `session-delivery-queue/*.json` 파일 대신 별도 큐 이름
  (`outbound-delivery`, `session-delivery`) 아래의 전역 SQLite
  `delivery_queue_entries` 테이블을 공유합니다. doctor legacy-state 단계는
  보류 및 실패 행을 가져오고, 오래된 전달 완료 마커를 제거하며, 가져오기 후 이전
  JSON 파일을 삭제합니다. hot routing 및 retry 필드는 형식화된 열입니다. JSON
  payload는 replay/debug 용도로만 유지됩니다.
- ACPX 프로세스 lease는 이제 `process-leases.json` 대신 `acpx/process-leases`
  아래의 SQLite Plugin 상태를 사용합니다.
- 백업 및 마이그레이션 실행 메타데이터

이를 에이전트 데이터베이스로 이동:

- 에이전트 세션 루트 및 호환성 형태의 session-entry payload. 런타임 쓰기에 대해 완료됨:
  hot 세션 메타데이터는 `sessions`에서 쿼리할 수 있으며, 레거시 형태의 전체
  `SessionEntry` payload는 `session_entries`에 남아 있습니다.
- 에이전트 transcript 이벤트. 런타임 쓰기에 대해 완료됨.
- Compaction 체크포인트 및 transcript 스냅샷. 런타임 쓰기에 대해 완료됨:
  체크포인트 transcript 복사본은 SQLite transcript 행이며 체크포인트
  메타데이터는 `transcript_snapshots`에 기록됩니다. Gateway 체크포인트 헬퍼는
  이제 이 값을 소스 파일이 아니라 transcript 스냅샷으로 명명합니다.
- 에이전트 VFS scratch/workspace 네임스페이스. 런타임 VFS 쓰기에 대해 완료됨.
- 서브에이전트 attachment payload. 런타임 쓰기에 대해 완료됨: SQLite VFS
  seed 항목이며 영속 workspace 파일이 되지 않습니다.
- Tool artifact. 런타임 쓰기에 대해 완료됨.
- 실행 artifact. 에이전트별 `run_artifacts` 테이블을 통한 worker 런타임 쓰기에 대해 완료됨.
- 에이전트 로컬 런타임 캐시. 에이전트별 `cache_entries` 테이블을 통한 worker 런타임 범위 캐시 쓰기에 대해
  완료됨. Gateway 전체 모델 캐시는 에이전트별로 바뀌지 않는 한 전역 데이터베이스에 남아 있습니다.
- ACP 부모 스트림 로그. 런타임 쓰기에 대해 완료됨.
- ACP replay ledger 세션. `acp_replay_sessions` 및 `acp_replay_events`를 통해 런타임 쓰기에 대해 완료됨.
  레거시 `acp/event-ledger.json`은 doctor 입력으로만 남아 있습니다.
- ACP 세션 메타데이터. `acp_sessions`를 통해 런타임 쓰기에 대해 완료됨. `sessions.json`의 레거시
  `entry.acp` 블록은 doctor 마이그레이션 입력 전용입니다.
- 명시적 export 파일이 아닌 trajectory 사이드카. 런타임 쓰기에 대해 완료됨:
  trajectory 캡처는 에이전트 데이터베이스 `trajectory_runtime_events`
  행을 쓰고 실행 범위 artifact를 SQLite에 미러링합니다. 레거시 사이드카는 doctor
  가져오기 입력 전용입니다. export는 새 JSONL support-bundle 출력을
  materialize할 수 있지만 런타임에서 이전 trajectory/transcript 사이드카를 읽거나 마이그레이션하지 않습니다.
  런타임 trajectory 캡처는 SQLite 범위를 노출합니다. JSONL 경로 헬퍼는
  export/debug 지원으로 격리되며 런타임 모듈에서 다시 export되지 않습니다.
  embedded-runner trajectory 메타데이터는 transcript locator를 유지하는 대신 `{agentId, sessionId, sessionKey}`
  ID를 기록합니다.

현재는 파일 기반으로 유지:

- `openclaw.json`
- provider 또는 CLI 자격 증명 파일
- Plugin/package 매니페스트
- 디스크 모드가 선택된 경우 사용자 workspace 및 Git 리포지토리
- 특정 로그 surface가 이동되지 않는 한, 운영자 tailing을 위한 로그

## 마이그레이션 계획

### 0단계: 경계 동결

더 많은 행을 이동하기 전에 durable-state 경계를 명시적으로 만듭니다.

- 전역 데이터베이스에 `migration_runs` 테이블을 추가합니다.
  레거시 상태 마이그레이션 실행 보고서에 대해 완료됨.
- file-to-database 가져오기를 위한 doctor 소유의 단일 상태 마이그레이션 서비스를 추가합니다.
  완료됨: `openclaw doctor --fix`는 legacy-state 마이그레이션 구현을 사용합니다.
- `plan`을 읽기 전용으로 만들고 `apply`가 백업을 생성하고, 가져오고, 검증한 다음
  이전 파일을 삭제하거나 격리하도록 만듭니다.
  완료됨: doctor는 검증된 마이그레이션 전 백업을 생성하고, 백업 경로를
  `migration_runs`에 전달하며, 임포터/제거 경로를 재사용합니다.
- 새 런타임 코드가 레거시 상태 파일을 쓸 수 없도록 정적 금지를 추가하면서,
  마이그레이션 코드와 테스트는 여전히 해당 파일을 seed/read할 수 있게 합니다.
  현재 마이그레이션된 레거시 저장소에 대해 완료됨. guard는 금지된 런타임 transcript locator 계약을 찾기 위해
  중첩 테스트도 스캔합니다.

### 1단계: 전역 제어 플레인 완료

공유 coordination 상태를 `state/openclaw.sqlite`에 유지합니다.

- 에이전트 및 에이전트 데이터베이스 레지스트리
- 작업 및 Task Flow ledger
- Plugin 상태
- sandbox 컨테이너/브라우저 레지스트리
- Cron/scheduler 실행 기록
- 페어링, 디바이스, push, 업데이트 확인, TUI, OpenRouter/모델 캐시, 기타
  작은 Gateway 범위 런타임 상태
- 백업 및 마이그레이션 메타데이터
- Gateway 미디어 attachment 바이트. 런타임 쓰기에 대해 완료됨. 직접 파일 경로는
  채널 sender 및 sandbox staging과의 호환성을 위한 임시 materialization입니다. 런타임 allowlist는 레거시
  상태/구성 미디어 루트가 아니라 SQLite materialization 경로를 허용합니다. Doctor는 레거시 미디어 파일을
  `media_blobs`로 가져오고 성공적으로 행을 쓴 뒤 소스 파일을 제거합니다.
- 디버그 proxy 캡처 세션, 이벤트, payload blob. 완료됨: 캡처는 공유 상태 DB에
  저장되며 공유 상태 DB bootstrap, schema, WAL, busy-timeout 설정을 통해 열립니다. Payload 바이트는
  `capture_blobs.data`에서 gzip으로 압축됩니다. debug proxy 런타임 사이드카 DB override,
  blob 디렉터리, 또는 proxy-capture 전용 생성 schema/codegen 대상은 없습니다.
  Doctor/startup 마이그레이션은 활성 레거시 DB/blob 환경
  override를 포함하여 배포된 `debug-proxy/capture.sqlite` 행과 참조된 payload blob을
  가져온 다음 CA 인증서는 그대로 두고 해당 소스를 보관합니다.

이 단계에서는 해당 하위 시스템의 중복 사이드카 opener, 권한 헬퍼, WAL
설정, 파일시스템 pruning, 호환성 writer도 삭제합니다.

### 2단계: 에이전트별 데이터베이스 도입

에이전트마다 하나의 데이터베이스를 만들고 전역 DB에서 등록합니다.

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

전역 `agent_databases` 행은 경로, schema version, last-seen
timestamp, 기본 size/integrity 메타데이터를 저장합니다. 런타임 코드는
파일 경로를 직접 유도하는 대신 레지스트리에 에이전트 DB를 요청합니다.

에이전트 DB가 소유하는 항목:

- `sessions`를 표준 세션 루트로 사용하고, `session_entries`를 해당 루트에 연결된
  호환성 형태의 페이로드 테이블로 사용하며,
  `session_routes`를 고유한 활성 `session_key` 조회로 사용
- `conversations`와 `session_conversations`를 세션에 연결된 정규화된 provider
  라우팅 ID로 사용
- `transcript_events`
- transcript 스냅샷과 Compaction 체크포인트. 런타임 쓰기에 대해 완료됨.
- `vfs_entries`
- `tool_artifacts`와 실행 artifacts
- 에이전트 로컬 런타임/cache 행. worker 범위 cache에 대해 완료됨.
- ACP 상위 stream 이벤트
- 명시적 export artifact가 아닌 경우의 trajectory 런타임 이벤트

### 3단계: 세션 저장소 API 교체

런타임에 대해 완료됨. 파일 형태의 세션 저장소 표면은 활성
런타임 계약이 아님:

- 런타임은 더 이상 `loadSessionStore(storePath)`를 호출하거나 `storePath`를
  세션 ID로 취급하지 않음.
- 런타임 행 작업은 `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry`, `listSessionEntries`임.
- 전체 저장소 재작성 helper, 파일 writer, queue 테스트, alias pruning,
  legacy-key 삭제 매개변수는 런타임에서 제거됨.
- deprecated 루트 package 호환성 export는 여전히 표준
  `sessions.json` 경로를 SQLite 행 API에 맞게 조정함.
- `sessions.json` parsing은 doctor migration/import 코드와
  doctor 테스트에만 남아 있음.
- 런타임 lifecycle fallback은 JSONL 첫 줄이 아니라 SQLite transcript header를 읽음.

파일 lock 매개변수, pruning/truncation-as-file-maintenance 용어,
store-path ID, 또는 JSON persistence만 assertion하는 테스트를 다시 도입하는
모든 것을 계속 삭제할 것.

### 4단계: Transcripts, ACP Streams, Trajectories, VFS 이동

모든 에이전트 데이터 stream을 database-native로 만들 것:

- Transcript append write는 세션 header를 보장하고, message idempotency를 확인하며,
  parent tail을 선택하고, `transcript_events`에 insert하며,
  query 가능한 identity metadata를 `transcript_event_identities`에 기록하는
  하나의 SQLite transaction을 통과함. 직접 transcript message append와 일반 persisted
  `TranscriptSessionManager` append에 대해 완료됨. 명시적 branch 작업은 명시적 parent 선택을
  유지하고, 파일 locator를 파생하지 않은 채 SQLite row를 계속 씀.
- ACP parent stream log는 `.acp-stream.jsonl` 파일이 아니라 row가 됨. 완료됨.
- ACP spawn setup은 더 이상 transcript JSONL 경로를 persist하지 않음. 완료됨.
- 런타임 trajectory capture는 event row/artifact를 직접 씀. 명시적
  support/export command는 여전히 support-bundle JSONL artifact를 export format으로
  생성할 수 있지만, session export는 session JSONL을 다시 만들지 않음. 완료됨.
- disk workspace는 disk mode로 구성된 경우 disk에 유지됨.
- VFS scratch와 experimental VFS-only workspace mode는 agent DB를 사용함.

migration은 old JSONL 파일을 한 번 import하고, `migration_runs`에 counts/hashes를 기록하며,
integrity check 이후 imported file을 제거함.

### 5단계: Backup, Restore, Vacuum, Verify

Backup은 하나의 archive file로 유지됨:

- 모든 global 및 agent database를 checkpoint함.
- SQLite backup semantics 또는 `VACUUM INTO`로 각 DB를 snapshot함.
- compact DB snapshot, config, external credential, 요청된 workspace export를 archive함.
- raw live `*.sqlite-wal` 및 `*.sqlite-shm` 파일은 제외함.
- 모든 DB snapshot을 열고 `PRAGMA integrity_check`를 실행하여 verify함.
  `openclaw backup create`는 기본적으로 이 archive verification을 수행함.
  `--no-verify`는 post-write archive pass만 건너뛰며, snapshot
  creation integrity check는 건너뛰지 않음.
- Restore는 snapshot을 target path로 다시 copy함. 이 branch는
  미출시 SQLite layout을 `user_version = 1`로 reset함. 향후 출시된 schema 변경은
  필요할 때 명시적 migration을 추가할 수 있음.

### 6단계: Worker Runtime

database split이 반영되는 동안 worker mode를 experimental로 유지할 것:

- Worker는 agent id, run id, filesystem mode, DB registry identity를 받음.
- 각 worker는 자체 SQLite connection을 엶.
- Parent는 channel delivery, approval, config, cancellation authority를 유지함.
- active run당 worker 하나로 시작하고, lifecycle과 DB connection ownership이 안정된 뒤에만 pooling을 추가함.

### 7단계: 기존 세계 삭제

런타임 session management에 대해 완료됨. 기존 세계는 명시적
doctor input 또는 support/export output으로만 허용됨:

- 런타임 `sessions.json`, transcript JSONL, sandbox registry JSON, task
  sidecar SQLite, 또는 plugin-state sidecar SQLite write 없음.
- JSON/session file pruning, file transcript truncation, session file lock,
  lock 형태의 session test 없음.
- 목적이 old session file을 최신 상태로 유지하는 것인 런타임 compatibility export 없음.
- 명시적 support export는 사용자가 요청한 archive/materialization
  format으로 남으며, file name을 다시 런타임 identity로 공급해서는 안 됨.

## Backup And Restore

Backup은 하나의 archive file이어야 하지만, database capture는
SQLite-native여야 함:

1. 장기 실행 write activity를 중지하거나 짧은 backup barrier에 진입함.
2. 모든 global 및 agent database에 대해 checkpoint를 실행함.
3. SQLite backup semantics 또는 `VACUUM INTO`를 사용하여 각 database를
   temporary backup directory에 snapshot함.
4. compacted database snapshot, config file, credentials directory,
   selected workspace, manifest를 archive함.
5. 포함된 모든 SQLite snapshot을 열고 `PRAGMA integrity_check`를 실행하여
   archive를 verify함.
   `openclaw backup create`는 기본적으로 이를 수행함. `--no-verify`는
   post-write archive pass를 의도적으로 건너뛸 때만 사용함.

raw live `*.sqlite`, `*.sqlite-wal`, `*.sqlite-shm` copy를
primary backup format으로 의존하지 말 것. archive manifest는 database role,
agent id, schema version, source path, snapshot path, byte size, integrity
status를 기록해야 함.

Restore는 archive snapshot에서 global database와 agent database file을
다시 build해야 함. SQLite layout은 아직 출시되지 않았으므로, 이 refactor는
version-1 schema와 doctor file-to-database import만 유지함. restore
command는 archive를 먼저 validate한 다음, verified extracted payload에서 각
manifest asset을 replace함.

## Runtime Refactor Plan

1. database registry API 추가.
   - global DB와 per-agent DB path를 resolve함.
   - 미출시 schema를 `user_version = 1`로 유지함. 출시된 schema가 필요할 때까지
     schema migration runner code를 추가하지 말 것.
   - test, backup, doctor가 사용하는 close/checkpoint/integrity helper를 추가함.

2. sidecar SQLite store 축소.
   - plugin state table을 global database로 이동함. 런타임 write에 대해 완료됨.
     미출시 legacy sidecar importer는 삭제됨.
   - task registry table을 global database로 이동함. 런타임 write에 대해 완료됨.
     미출시 legacy sidecar importer는 삭제됨.
   - Task Flow table을 global database로 이동함. 런타임 write에 대해 완료됨.
     미출시 legacy sidecar importer는 삭제됨.
   - builtin memory-search table을 각 agent database로 이동함. 완료됨. 명시적
     custom `memorySearch.store.path`는 이제 doctor config migration으로 제거됨.
     full reindex는 memory table에 대해서만 in place로 실행됨. old whole-file
     swap path와 sidecar index swap helper는 삭제됨.
   - 해당 subsystem에서 중복 database opener, WAL setup, permission helper,
     close path를 삭제함.

3. agent-owned table을 per-agent database로 이동.
   - global database registry를 통해 필요할 때 agent DB를 생성함. 완료됨.
   - runtime session entry, transcript event, VFS row, tool
     artifact를 agent DB로 이동함. 완료됨.
   - branch-local shared-DB session entry, transcript event,
     VFS row, tool artifact는 migrate하지 말 것. 해당 layout은 출시된 적이 없음.
     doctor에 legacy file-to-database import만 유지할 것.

4. session store API 교체.
   - `storePath`를 런타임 identity로 제거함. 런타임에 대해 완료되었고
     `check:database-first-legacy-stores`로 guard됨. session metadata, route update,
     command persistence, CLI session cleanup, Feishu reasoning preview,
     transcript-state persistence, subagent depth, auth profile session
     override, parent-fork logic, QA-lab inspection은 이제 표준 agent/session key에서
     database를 resolve함.
     Gateway/TUI/UI/macOS session-list response는 이제 legacy `path` 대신 `databasePath`를 노출함.
     macOS debug surface는 `session.store` config를 쓰는 대신 per-agent database를
     read-only state로 표시함.
     `/status`, chat-driven trajectory export, CLI dependency proxy는 더 이상
     legacy store path를 propagate하지 않음. transcript usage fallback은
     agent/session identity로 SQLite를 읽음. 런타임과 bridge test는 더 이상
     `storePath`를 노출하지 않음. doctor/migration input이 해당 legacy field name을 소유함.
     Gateway combined-session loading은 non-templated `session.store` value에 대한
     특별한 런타임 branch를 더 이상 가지지 않음. per-agent SQLite row를 aggregate함.
     legacy session-lock doctor lane과 그 `.jsonl.lock` cleanup helper는 제거됨.
     이제 SQLite가 session concurrency boundary임.
     hot runtime call site는 `resolveSessionRowEntry` 같은 row-oriented helper name을 사용함.
     old `resolveSessionStoreEntry` compatibility alias는 런타임과 plugin SDK export에서 제거됨.

- `{ agentId, sessionKey }` row operation 사용.
  완료됨: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry`, `listSessionEntries`는 session store path가 필요 없는
  SQLite-first API임. status summary, local agent status, health,
  `openclaw sessions` listing command는 이제 per-agent row를 직접 읽고
  `sessions.json` path 대신 per-agent SQLite database path를 표시함.
- whole-store delete/insert를 `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries`, SQL cleanup query로 교체.
  런타임에 대해 완료됨: hot path는 이제 row API와 conflict-retried row patch를 사용함.
  남은 whole-store import/replace helper는 migration import code와 SQLite backend test로 제한됨.
  - `store-writer.ts`와 writer-queue test 삭제. 완료됨.
  - session row upsert/patch에서 런타임 legacy-key pruning과 alias-delete parameter 삭제. 완료됨.

5. 런타임 JSON registry behavior 삭제.
   - sandbox registry read와 write를 SQLite-only로 만듦. 완료됨.
   - monolithic 및 sharded JSON은 migration step에서만 import함. 완료됨.
   - sharded registry lock과 JSON write 제거. 완료됨.

- shape가 hot-path operational state로 남아 있다면 registry row를 generic
  opaque JSON으로 저장하는 대신 하나의 typed registry table을 유지함. 완료됨.

6. file-lock 형태의 session mutation 삭제.
   - 런타임 lock creation과 runtime lock API에 대해 완료됨.
   - standalone legacy `.jsonl.lock` doctor cleanup lane은 제거됨.
   - `session.writeLock`은 doctor-migrated legacy config이며, typed runtime
     setting이 아님.
   - state integrity에는 더 이상 별도의 orphan transcript-file pruning
     path가 없음. doctor migration이 legacy JSONL source를 한 곳에서 import/remove함.
   - Gateway singleton coordination은 `gateway_locks` 아래 typed SQLite `state_leases` row를 사용하며,
     file-lock directory seam을 더 이상 노출하지 않음.
   - Generic plugin SDK dedupe persistence는 더 이상 file lock이나 JSON
     file을 사용하지 않음. shared SQLite plugin-state row를 씀. 완료됨.
   - QMD embed coordination은 `qmd/embed.lock` 대신 SQLite state lease를 사용함. 완료됨.

7. worker가 database-aware가 되게 함.
   - Worker는 자체 SQLite connection을 엶.
   - Parent가 delivery, channel callback, config를 소유함.
   - Worker는 live handle이 아니라 agent id, run id, filesystem mode, DB registry
     identity를 받음.
   - `vfs-only`는 experimental로 남고 agent database를 storage
     root로 사용함.
   - 먼저 active run당 worker 하나를 유지함. DB connection lifetime과 cancellation behavior가
     지루할 정도로 안정될 때까지 pooling은 기다릴 수 있음.

8. 백업 통합.
   - SQLite 백업 또는 `VACUUM INTO`로 전역 및 에이전트 데이터베이스를 스냅샷하도록 백업에 가르칩니다. 상태 자산 아래에서 발견된 `*.sqlite` 파일에 대해 완료되었습니다.
   - SQLite 무결성과 스키마 버전에 대한 백업 검증을 추가합니다. 백업 생성 및 기본 아카이브 검증 무결성 검사에 대해 완료되었습니다.
   - 백업 실행 메타데이터를 SQLite에 기록합니다. 아카이브 경로, 상태, 매니페스트 JSON이 포함된 공유 `backup_runs` 테이블을 통해 완료되었습니다.
   - 검증된 아카이브 스냅샷에서 복원을 추가합니다. 완료: `openclaw backup
restore`는 추출 전에 검증하고, 검증기의 정규화된 매니페스트를 사용하며,
     `--dry-run`을 지원하고, 기록된 소스 경로를 교체하기 전에 `--yes`를 요구합니다.
   - 요청된 경우에만 VFS/워크스페이스 내보내기를 포함하고, 세션 내부 데이터를 JSON 또는 JSONL로 내보내지 않습니다.

9. 오래된 테스트와 코드를 삭제합니다. 알려진 런타임 세션 표면에 대해 완료되었습니다.

- 런타임이 `sessions.json` 또는 트랜스크립트 JSONL 파일을 생성한다고 단언하는 테스트를 제거합니다. 코어 세션 저장소, 채팅, Gateway 트랜스크립트 이벤트,
  미리보기, 수명 주기, 명령 세션 항목 업데이트, 자동 응답 재설정/추적, 그리고
  memory-core dreaming 픽스처, 승인 대상 라우팅, 세션 트랜스크립트
  복구, 보안 권한 복구, 궤적 내보내기, 세션 내보내기에 대해 완료되었습니다.
  active-memory 트랜스크립트 테스트는 이제 SQLite 범위와 임시 또는
  영구 JSONL 파일 생성이 없음을 단언합니다.
  런타임이 더 이상 JSONL 트랜스크립트를 잘라내지 않으므로
  오래된 heartbeat 트랜스크립트 가지치기 회귀 테스트는 제거되었습니다.
  에이전트 세션 목록 도구 테스트는 더 이상 레거시 `sessions.json` 경로를
  Gateway 응답 형태로 모델링하지 않으며, 앱/UI/macOS 테스트는 `databasePath`를 사용합니다.
  `/status` 트랜스크립트 사용량 테스트는 이제 JSONL 파일을 쓰는 대신
  SQLite 트랜스크립트 행을 직접 시드합니다.
  Gateway 세션 수명 주기 테스트는 이제 SQLite 트랜스크립트 시드 헬퍼를
  직접 사용하며, 오래된 단일 행 세션 파일 픽스처 형태는 재설정 및 삭제 커버리지에서 사라졌습니다.
  `sessions.delete`는 더 이상 파일 시대의 `archived: []` 필드를 반환하지 않으며, 삭제는
  행 변경 결과만 보고합니다. 오래된 `deleteTranscript` 옵션도 사라졌습니다.
  세션을 삭제하면 정식 `sessions` 루트가 제거되고 SQLite가 세션 소유
  트랜스크립트, 스냅샷, 궤적 행을 cascade로 처리하므로, 어떤 호출자도
  트랜스크립트 고아를 남기거나 정리 분기를 잊을 수 없습니다.
  컨텍스트 엔진 궤적 캡처 테스트는 이제 `session.trajectory.jsonl`을 읽는 대신
  격리된 에이전트 데이터베이스에서 `trajectory_runtime_events`
  행을 읽습니다.
  Docker MCP 채널 시드 스크립트는 이제 SQLite 행을 직접 시드합니다. 직접적인
  `sessions.json` 쓰기는 doctor 픽스처로 제한됩니다.
  Tool Search Gateway E2E는 `agents/<agentId>/sessions/*.jsonl` 파일을 스캔하는 대신
  SQLite 트랜스크립트 행에서 도구 호출 증거를 읽습니다.
  memory-core 호스트 이벤트와 세션 코퍼스 스크래치 행은 이제 공유
  SQLite Plugin 상태에 존재하며, `events.jsonl` 및 `session-corpus/*.txt`는 레거시
  doctor 마이그레이션 입력 전용입니다. 활성 행은 `.dreams/session-corpus`가 아니라
  `memory/session-ingestion/` 가상 경로를 사용합니다. 런타임이 더 이상 해당 코퍼스의
  파일 아카이브 복구를 소유하지 않으므로 오래된 memory-core dreaming
  복구 모듈과 그 CLI/Gateway 테스트는 제거되었습니다. memory-core
  브리지/공개 아티팩트 테스트는 더 이상 `.dreams/events.jsonl`을 노출하지 않으며,
  SQLite 기반 가상 JSON 아티팩트 이름을 사용합니다.
  공개 SDK/Codex 테스트 문서는 이제 세션 파일 대신 SQLite 세션 상태라고 말하며,
  channel-turn 예제는 더 이상 `storePath` 인수를 노출하지 않습니다.
  Matrix 동기화 상태는 이제 SQLite Plugin 상태 저장소를 직접 사용합니다. 활성
  클라이언트/런타임 계약은 `bot-storage.json` 경로가 아니라 계정 저장소 루트를 전달하고,
  doctor는 소스를 삭제하기 전에 레거시 `bot-storage.json`을 SQLite로 가져옵니다.
  QA Matrix 재시작/파괴적 시나리오는 이제 가짜 `bot-storage.json` 파일을 만들거나 삭제하는 대신
  SQLite 동기화 행을 직접 변경하며, E2EE 기반은 가짜
  `sync-store.json` 경로 대신 동기화 저장소 루트를 전달합니다.
  Matrix 저장소 루트 선택은 더 이상 레거시 동기화/스레드 JSON 파일로 루트를 점수화하지 않고,
  내구성 있는 루트 메타데이터와 실제 암호화 상태를 사용합니다.
  런타임 SQLite 세션 백엔드 테스트 스위트는 더 이상
  `sessions.json`을 조작해 만들지 않으며, 레거시 소스 픽스처는 이제 이를 가져오는 doctor
  테스트에 있습니다.
  Gateway 세션 테스트는 더 이상 `createSessionStoreDir` 헬퍼나
  사용되지 않는 임시 세션 저장소 경로 설정을 노출하지 않으며, 픽스처 디렉터리는 명시적이고, 직접적인
  행 설정은 SQLite 세션 행 명명을 사용합니다.
  doctor 전용 JSON5 세션 저장소 파서 커버리지는 인프라 테스트에서
  doctor 마이그레이션 테스트로 이동했으므로, 런타임 테스트 스위트는 더 이상 레거시
  세션 파일 파싱을 소유하지 않습니다.
  Microsoft Teams 런타임 SSO/대기 중 업로드 테스트는 더 이상 JSON 사이드카
  픽스처나 파서를 보유하지 않으며, 레거시 SSO 토큰 파싱은 Plugin
  마이그레이션 모듈에만 있습니다. Telegram 테스트는 더 이상 가짜 `/tmp/*.json` 저장소
  경로를 시드하지 않고, SQLite 기반 메시지 캐시를 직접 재설정합니다. 일반
  OpenClaw 테스트 상태 헬퍼는 더 이상 레거시 `auth-profiles.json`
  작성기를 노출하지 않으며, doctor 인증 마이그레이션 테스트가 해당 픽스처를 로컬로 소유합니다.
  TUI 마지막 세션 포인터, 실행 승인, active-memory
  토글, Matrix 중복 제거/시작 검증, Memory Wiki 소스 동기화,
  현재 대화 바인딩, 온보딩 인증, Hermes 시크릿 가져오기에 대한 런타임 테스트는 더 이상
  오래된 사이드카 파일을 만들거나 오래된 파일명이 없다고 단언하지 않습니다. 이들은
  SQLite 행과 공개 저장소 API를 통해 동작을 증명하며, 레거시 소스 파일명이 속하는 유일한 곳은
  doctor/마이그레이션 테스트입니다.
  장치/노드 페어링, 채널 allowFrom, 재시작 의도,
  재시작 핸드오프, 세션 전달 큐 항목, 구성 상태, iMessage
  캐시, cron 작업, PI 트랜스크립트 헤더, 하위 에이전트 레지스트리, 관리형
  이미지 첨부에 대한 런타임 테스트도 더 이상 사용 중지된 JSON/JSONL 파일을 생성하여
  무시되거나 없음을 증명하지 않습니다.
  PI 오버플로 복구에는 더 이상 SessionManager 재작성/잘라내기
  폴백이 없습니다. 도구 결과 잘라내기와 컨텍스트 엔진 트랜스크립트 재작성은
  SQLite 트랜스크립트 행을 변경한 다음, 데이터베이스에서 활성 프롬프트 상태를 새로 고칩니다.
  영구 SessionManager 메시지 추가는 부모 선택과 멱등성을 위해 원자적 SQLite
  트랜스크립트 추가 헬퍼에 위임합니다. 일반
  메타데이터/사용자 지정 항목 추가도 SQLite 내부에서 현재 부모를 선택하므로,
  오래된 매니저 인스턴스가 SQLite 이전 부모 체인 경쟁을 되살리지 않습니다.
  턴 중간 사전 검사와 `sessions_yield`를 위한 합성 PI 꼬리 정리는 이제
  SQLite 트랜스크립트 상태를 직접 잘라내며, 오래된 SessionManager 꼬리 제거
  브리지와 그 테스트는 삭제되었습니다.
  Compaction 체크포인트 캡처도 SQLite에서만 스냅샷하며, 호출자는 더 이상
  대체 트랜스크립트 소스로 라이브 SessionManager를 전달하지 않습니다.
- 마이그레이션 전용으로만 레거시 파일을 시드하는 테스트를 유지합니다.
- 활성 런타임 표면에 대해 JSON 파일 증거가 SQL 행 증거로 대체되었습니다.

- 레거시 세션/캐시 JSON 경로에 대한 런타임 쓰기를 정적으로 금지합니다.
  저장소 가드에 대해 완료되었습니다.

10. 마이그레이션 보고서를 감사 가능하게 만듭니다.
    - 시작/완료 타임스탬프, 소스 경로, 소스 해시, 개수, 경고, 백업 경로와 함께
      마이그레이션 실행을 SQLite에 기록합니다.
      완료: 레거시 상태 마이그레이션 실행은 이제 소스 경로/테이블 인벤토리, 소스 파일 SHA-256, 크기,
      레코드 수, 경고, 백업 경로가 포함된 `migration_runs`
      보고서를 영구 저장합니다.
      완료: 레거시 상태 마이그레이션 실행은 소스 수준 감사와 향후 건너뛰기/백필 결정을 위해
      `migration_sources` 행도 영구 저장합니다.
    - 적용을 멱등적으로 만듭니다. 부분 가져오기 후 다시 실행하면 이미 가져온 소스를
      건너뛰거나 안정적인 키로 병합해야 합니다.
      완료: 세션 인덱스, 트랜스크립트, 전달 큐, Plugin 상태, 작업
      원장, 에이전트 소유 전역 SQLite 행은 안정적인 키 또는
      upsert/replace 의미 체계를 통해 가져오므로, 재실행해도 내구성 있는
      행이 중복되지 않고 병합됩니다.
    - 가져오기에 실패하면 원본 소스 파일을 제자리에 유지해야 합니다.
      완료: 실패한 트랜스크립트 가져오기는 이제 원본 JSONL 소스를
      감지된 경로에 그대로 두며, `migration_sources`는 다음 doctor 실행을 위해
      소스를 `warning`으로, `removed_source=0`으로 기록합니다.

## 성능 규칙

- 스레드/프로세스당 하나의 연결은 괜찮습니다. 워커 간에 핸들을 공유하지 마십시오.
- WAL, `foreign_keys=ON`, 30초 busy timeout, 짧은 `BEGIN IMMEDIATE`
  쓰기 트랜잭션을 사용합니다.
- 명시적 뮤텍스/백프레셔 의미 체계를 갖춘 비동기 트랜잭션
  API가 추가되기 전까지 쓰기 트랜잭션 헬퍼는 동기식으로 유지합니다.
- 부모 전달 쓰기는 작고 트랜잭션 방식으로 유지합니다.
- 전체 저장소 재작성을 피하고, 행 수준 upsert/delete를 사용합니다.
- 핫 코드를 이동하기 전에 에이전트별 목록, 세션별 목록, updated-at, 실행 id, 만료 경로에 대한
  인덱스를 추가합니다.
- 큰 아티팩트, 미디어, 벡터는 base64 또는 숫자 배열 JSON이 아니라
  BLOB 또는 청크된 BLOB 행으로 저장합니다.
- 불투명 Plugin 상태 항목은 작고 범위가 지정되도록 유지합니다.
- 파일시스템 가지치기 대신 TTL/만료를 위한 SQL 정리를 추가합니다.
  데이터베이스 소유 런타임 저장소에 대해 완료되었습니다. 미디어, Plugin 상태, Plugin blob,
  영구 중복 제거, 에이전트 캐시는 모두 SQLite 행을 통해 만료됩니다. 남은
  파일시스템 정리는 임시 구체화 또는 명시적
  제거 명령으로 제한됩니다.

## 정적 금지

레거시 상태 경로에 대한 새로운 런타임 쓰기를 실패시키는 저장소 검사를 추가합니다:

- `sessions.json`
- 구체화된 지원 번들 출력을 제외한 `*.trajectory.jsonl`
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` 런타임 캐시 파일
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` 및 `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- sandbox 레지스트리 샤드 JSON 파일
- 네이티브 훅 릴레이 `/tmp` 브리지 JSON 파일
- `plugin-state/state.sqlite`
- 임시 `openclaw-state.sqlite` 런타임 사이드카
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- 브라우저 프로필 장식 `.openclaw-profile-decorated`
- `SessionManager.open(...)` 파일 기반 세션 오프너
- `SessionManager.listAll(...)` 및 `TranscriptSessionManager.listAll(...)`
  트랜스크립트 목록 facade
- `SessionManager.forkFromSession(...)` 및
  `TranscriptSessionManager.forkFromSession(...)` 트랜스크립트 포크 facade
- `SessionManager.newSession(...)` 및 `TranscriptSessionManager.newSession(...)`
  가변 세션 교체 facade
- `SessionManager.createBranchedSession(...)` 및
  `TranscriptSessionManager.createBranchedSession(...)` 브랜치 세션 facade

이 금지는 테스트가 레거시 fixture를 만들 수 있게 허용하고, 마이그레이션 코드가
레거시 파일 소스를 읽기/가져오기/제거할 수 있게 허용해야 합니다. 출시되지 않은 SQLite 사이드카는 계속 금지되며
doctor 가져오기 허용 대상이 되지 않습니다.

## 완료 기준

- 런타임 데이터 및 캐시 쓰기는 전역 또는 에이전트 SQLite 데이터베이스로 이동합니다.
- 런타임은 더 이상 세션 인덱스, 트랜스크립트 JSONL, sandbox 레지스트리
  JSON, 작업 사이드카 SQLite 또는 plugin-state 사이드카 SQLite를 쓰지 않습니다. 출시되지 않은 작업
  및 plugin-state 사이드카 SQLite 가져오기 도구는 삭제됩니다.
- 레거시 파일 가져오기는 doctor 전용입니다.
- 백업은 압축된 SQLite 스냅샷과 무결성 증명을 포함한 하나의 아카이브를 생성합니다.
- 에이전트 워커는 디스크, VFS 스크래치 또는 실험적 VFS 전용
  스토리지로 실행할 수 있습니다.
- 구성 및 명시적 자격 증명 파일만 예상되는 영구
  비데이터베이스 제어 파일로 유지됩니다.
- 저장소 검사는 레거시 런타임 파일 저장소가 다시 도입되는 것을 방지합니다.
