---
read_when:
    - OpenClaw 런타임 데이터, 캐시, 트랜스크립트, 작업 상태 또는 스크래치 파일을 SQLite로 이동하기
    - 레거시 JSON 또는 JSONL 파일에서 doctor 마이그레이션 설계하기
    - 백업, 복원, VFS 또는 작업자 저장소 동작 변경
    - 세션 잠금 제거, 정리, 잘림 또는 JSON 호환성 경로
summary: SQLite를 기본 영구 상태 및 캐시 계층으로 만들면서 구성 파일 기반은 유지하기 위한 마이그레이션 계획
title: 데이터베이스 우선 상태 리팩터링
x-i18n:
    generated_at: "2026-07-01T20:16:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# 데이터베이스 우선 상태 리팩터링

## 결정

두 단계 SQLite 레이아웃을 사용합니다:

- 전역 데이터베이스: `~/.openclaw/state/openclaw.sqlite`
- 에이전트 데이터베이스: 에이전트가 소유하는 작업공간,
  트랜스크립트, VFS, 아티팩트, 대용량 에이전트별 런타임 상태를 위한 에이전트당 하나의 SQLite 데이터베이스
- 구성은 계속 파일 기반으로 유지합니다. `openclaw.json`은
  데이터베이스 밖에 남습니다. 런타임 인증 프로필은 SQLite로 이동하며, 외부 제공자 또는 CLI
  자격 증명 파일은 OpenClaw 데이터베이스 밖에서 소유자가 관리하는 상태로 남습니다.

전역 데이터베이스는 제어 평면 데이터베이스입니다. 에이전트 검색,
공유 Gateway 상태, 페어링, 디바이스/Node 상태, 작업 및 플로우 원장, Plugin
상태, 스케줄러 런타임 상태, 백업 메타데이터, 마이그레이션 상태를 소유합니다.

에이전트 데이터베이스는 데이터 평면 데이터베이스입니다. 에이전트의 세션
메타데이터, 트랜스크립트 이벤트 스트림, VFS 작업공간 또는 스크래치 네임스페이스, 도구
아티팩트, 실행 아티팩트, 검색/인덱싱 가능한 에이전트 로컬 캐시 데이터를 소유합니다.

이렇게 하면 대용량 에이전트 작업공간,
트랜스크립트, 바이너리 스크래치 데이터를 공유 Gateway 쓰기 경로에 강제로 넣지 않으면서도 하나의 내구성 있는 전역 보기를 제공합니다.

## 엄격한 계약

이 마이그레이션에는 하나의 표준 런타임 형태가 있습니다:

- 세션 행은 세션 메타데이터만 유지합니다. `transcriptLocator`, 트랜스크립트 파일 경로, 형제 JSONL 경로, 잠금 경로,
  가지치기 메타데이터, 파일 시대 호환성 포인터를 유지해서는 안 됩니다.
- 트랜스크립트 ID는 항상 SQLite ID입니다: `{agentId, sessionId}`에
  프로토콜이 필요로 하는 경우 선택적 토픽 메타데이터를 더합니다.
- `sqlite-transcript://...`는 런타임 또는 프로토콜 ID가 아닙니다. 새 코드는
  트랜스크립트 로케이터를 파생, 유지, 전달, 파싱, 마이그레이션해서는 안 됩니다. 런타임과
  테스트에는 의사 로케이터가 전혀 없어야 하며, 문서는 해당 문자열을 금지하기 위해서만 언급할 수 있습니다.
- 레거시 `sessions.json`, 트랜스크립트 JSONL, `.jsonl.lock`, 가지치기, 잘라내기,
  이전 세션 경로 로직은 doctor 마이그레이션/가져오기 경로에만 속합니다.
- 레거시 세션 구성 별칭은 doctor 마이그레이션에만 속합니다. 런타임은
  `session.idleMinutes`, `session.resetByType.dm` 또는
  다른 구성된 에이전트를 위한 교차 에이전트 `agent:main:*` 메인 세션 별칭을 해석하지 않습니다.
- 세션 라우팅 ID는 타입이 지정된 관계형 상태입니다. 핫 런타임 및 UI 경로는
  `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations`,
  `session_conversations`를 읽어야 합니다. 이전 호출 지점을 삭제하는 동안의 호환성
  그림자가 아닌 한, 제공자 ID를 얻기 위해 `session_key`를 파싱하거나
  `session_entries.entry_json`을 캐내서는 안 됩니다.
- `dm` 대 `direct` 같은 채널 수준 직접 메시지 마커는 라우팅
  어휘이며, 트랜스크립트 로케이터나 파일 저장소 호환성 핸들이 아닙니다.
- 레거시 훅 핸들러 구성은 doctor 경고/마이그레이션 표면에만 속합니다.
  런타임은 `hooks.internal.handlers`를 로드해서는 안 됩니다. 훅은 검색된
  훅 디렉터리와 `HOOK.md` 메타데이터를 통해서만 실행됩니다.
- 런타임 시작, 핫 응답 경로, Compaction, 재설정, 복구, 진단,
  TTS, 메모리 훅, 하위 에이전트, Plugin 명령 라우팅, 프로토콜 경계,
  훅은 런타임을 통해 `{agentId, sessionId}`를 전달해야 합니다.
- 테스트는 `{agentId, sessionId}`를 통해 SQLite 트랜스크립트 행을 시드하고 검증해야 합니다.
  JSONL 경로 전달, 호출자 제공 로케이터 보존, 트랜스크립트 파일 호환성만 증명하는 테스트는
  doctor 가져오기, 비세션 지원/디버그
  구체화, 프로토콜 형태를 다루지 않는 한 삭제해야 합니다.
- `runEmbeddedPiAgent(...)`, 준비된 워커 실행, 내부 임베디드
  시도는 트랜스크립트 로케이터를 받아서는 안 됩니다. 이들은 `{agentId, sessionId}`로 SQLite 트랜스크립트
  관리자를 열고 해당 관리자를 내부화된
  PI 호환 에이전트 세션에 전달하여, 오래된 호출자가 실행기가
  JSON/JSONL 트랜스크립트를 쓰게 만들 수 없도록 합니다.
- 실행기 진단은 런타임/캐시/페이로드 추적 레코드를 SQLite에 저장해야 합니다.
  런타임 진단은 JSONL 파일 재정의 노브나 일반적인
  트랜스크립트 JSONL 내보내기 헬퍼를 노출해서는 안 됩니다. 사용자 대상 내보내기는
  파일 이름을 런타임에 다시 공급하지 않고 데이터베이스 행에서 명시적
  아티팩트를 구체화할 수 있습니다.
- 원시 스트림 로깅은 `OPENCLAW_RAW_STREAM=1`과 SQLite 진단 행을 사용합니다.
  이전 pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH`,
  `raw-openai-completions.jsonl` 파일 로거 계약은 OpenClaw
  런타임 또는 테스트의 일부가 아닙니다.
- QMD 메모리 인덱싱은 SQLite 트랜스크립트를 마크다운 파일로 내보내서는 안 됩니다.
  QMD는 구성된 메모리 파일만 인덱싱합니다. 세션 트랜스크립트 검색은
  SQLite 기반으로 유지됩니다.
- QMD SDK 하위 경로는 새 코드에서 QMD 전용입니다. SQLite 세션 트랜스크립트
  인덱싱 헬퍼는 `memory-core-host-engine-session-transcripts`에 있으며, 모든
  QMD 재내보내기는 호환성 전용이고 런타임 코드에서 사용해서는 안 됩니다.
- 내장 메모리 인덱스는 소유 에이전트 데이터베이스에 있습니다. 런타임 구성과
  해석된 런타임 계약은 `memorySearch.store.path`를 노출해서는 안 됩니다. doctor는
  해당 레거시 구성 키를 삭제하고 현재 코드는 에이전트
  `databasePath`를 내부적으로 전달합니다.

구현 작업은 doctor/가져오기/내보내기/디버그 경계 밖에서 예외 없이 이 문장들이 참이 될 때까지 코드를 계속 삭제해야 합니다.

## 목표 상태 및 진행 상황

### 엄격한 목표

- 하나의 전역 SQLite 데이터베이스가 제어 평면 상태를 소유합니다:
  `state/openclaw.sqlite`.
- 하나의 에이전트별 SQLite 데이터베이스가 데이터 평면 상태를 소유합니다:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- 구성은 파일 기반으로 남습니다. `openclaw.json`은 이 데이터베이스
  리팩터링의 일부가 아닙니다.
- 레거시 파일은 doctor 마이그레이션 입력으로만 사용됩니다.
- 런타임은 활성 상태로 세션 또는 트랜스크립트 JSONL을 쓰거나 읽지 않습니다.

### 목표 상태

- `not-started`: 파일 시대 런타임 코드가 여전히 활성 상태를 씁니다.
- `migrating`: doctor/가져오기 코드가 파일 데이터를 SQLite로 이동할 수 있습니다.
- `dual-read`: 임시 브리지가 SQLite와 레거시 파일을 모두 읽습니다. 이 상태는
  doctor 전용으로 명시적으로 문서화되지 않는 한 이 리팩터링에서 금지됩니다.
- `sqlite-runtime`: 런타임이 SQLite만 읽고 씁니다.
- `clean`: 레거시 런타임 API와 테스트가 제거되고, 가드가
  회귀를 방지합니다.
- `done`: 문서, 테스트, 백업, doctor 마이그레이션, 변경된 검사가
  정리된 상태를 증명합니다.

### 현재 상태

- 세션: 런타임 기준 `clean`. 세션 행은 에이전트별 데이터베이스에 있으며,
  런타임 API는 `{agentId, sessionId}` 또는 `{agentId, sessionKey}`를 사용하고,
  `sessions.json`은 doctor 전용 레거시 입력입니다.
- 트랜스크립트: 런타임 기준 `clean`. 트랜스크립트 이벤트, ID, 스냅샷,
  트래젝터리 런타임 이벤트는 에이전트별 데이터베이스에 있습니다. 런타임은 더 이상
  트랜스크립트 로케이터나 JSONL 트랜스크립트 경로를 받지 않습니다.
- PI 임베디드 실행기: `clean`. 임베디드 PI 실행, 준비된 워커, Compaction,
  재시도 루프는 SQLite 세션 범위를 사용하고 오래된 트랜스크립트 핸들을 거부합니다.
- Cron: 런타임 기준 `clean`. 런타임은 `cron_jobs`와 `cron_run_logs`를 사용합니다.
  런타임 테스트는 SQLite `storeKey` 명명 방식을 사용하며, 파일 시대 Cron 경로는
  doctor 레거시 마이그레이션 테스트에만 남아 있습니다.
- 작업 레지스트리: `clean`. 작업 및 TaskFlow 런타임 행은
  `state/openclaw.sqlite`에 있으며, 배포되지 않은 사이드카 SQLite 가져오기 도구는 삭제되었습니다.
- Plugin 상태: `clean`. Plugin 상태/blob 행은 공유 전역
  데이터베이스에 있으며, 이전 Plugin 상태 사이드카 SQLite 헬퍼는 가드로 차단됩니다.
- 메모리: 내장 메모리와 세션 트랜스크립트 인덱싱 기준 `sqlite-runtime`.
  메모리 인덱스 테이블은 에이전트별 데이터베이스에 있으며, Plugin 메모리 상태는
  공유 Plugin 상태 행을 사용하고, 레거시 메모리 파일은 doctor 마이그레이션 입력
  또는 사용자 작업공간 콘텐츠입니다.
- 백업: `sqlite-runtime`. 백업 단계는 SQLite 스냅샷을 압축하고, 활성
  WAL/SHM 사이드카를 생략하며, SQLite 무결성을 검증하고, 백업 실행을
  전역 데이터베이스에 기록합니다.
- doctor 마이그레이션: 의도적으로 `migrating`입니다. doctor는 레거시 JSON,
  JSONL, 폐기된 사이드카 저장소를 SQLite로 가져오고, 마이그레이션 실행/소스를 기록하며,
  성공한 소스를 제거합니다.
- E2E 스크립트: 런타임 커버리지 기준 `clean`. Docker MCP 시딩은 SQLite
  행을 씁니다. runtime-context Docker 스크립트는 doctor 마이그레이션 시드 안에서만
  레거시 JSONL을 만들고 레거시 세션 인덱스 경로를 명시적으로 이름 짓습니다.

### 남은 작업

- [x] doctor 레거시 입력이 아닌 Cron 런타임 테스트 저장소 변수를 `storePath`에서 벗어나도록 이름 변경.
      파일: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      증명: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] 오래된 파일 시대 내보내기 테스트 목을 제거하거나 이름 변경.
      파일: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      증명: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Docker runtime-context 레거시 JSONL 시드가 명백히 doctor 전용이 되도록 함.
      파일: `scripts/e2e/session-runtime-context-docker-client.ts`.
      증명: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts`가
      `seedBrokenLegacySessionForDoctorMigration`만 표시합니다.
- [x] 스키마 변경 후 Kysely 생성 타입을 정렬된 상태로 유지.
      파일: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      증명: 이번 작업에서는 스키마 변경 없음; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] 변경된 저장소, 명령, 스크립트에 대한 집중 테스트 재실행.
      증명: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] `done`을 선언하기 전에 변경 게이트 또는 원격 광범위 증명 실행.
      증명: `pnpm check:changed --timed -- <changed extension paths>`가
      임시 Node 24/pnpm 설정과
      동기화된 `.git` 없는 작업공간에 대한 명시적 경로 라우팅 후 Hetzner Crabbox 실행 `run_3f1cabf6b25c`에서 통과했습니다.

### 회귀 금지

- 트랜스크립트 로케이터 없음.
- 활성 세션 파일 없음.
- doctor 레거시 마이그레이션 테스트를 제외한 가짜 JSONL 테스트 픽스처 없음.
- Kysely가 기대되는 곳에서 원시 SQLite 접근 없음.
- 새 레거시 DB 마이그레이션 없음. 이 레이아웃은 아직 배포되지 않았으므로 강한 이유가 없는 한 스키마 버전을
  `1`로 유지합니다.

## 코드 읽기 가정

이 계획을 막는 후속 제품 결정은 없습니다. 구현은
다음 가정을 바탕으로 진행해야 합니다:

- 이 저장소 경로에는 `node:sqlite`를 직접 사용하고 Node 22+ 런타임을 요구합니다.
- 일반 구성 파일은 정확히 하나만 유지합니다. 이 리팩터링에서 config, plugin
  manifests 또는 Git workspaces를 SQLite로 이동하지 마세요.
- 런타임 호환성 파일은 필요하지 않습니다. 레거시 JSON 및 JSONL 파일은
  마이그레이션 입력일 뿐입니다. 브랜치 로컬 SQLite 사이드카는 출시된 적이 없으므로
  가져오지 않고 삭제합니다.
- `openclaw doctor --fix`가 레거시 파일-데이터베이스 마이그레이션 단계를 담당합니다.
  런타임 시작 및 `openclaw migrate`는 레거시 OpenClaw
  데이터베이스 업그레이드 경로를 가져서는 안 됩니다.
- 자격 증명 호환성도 같은 규칙을 따릅니다. 런타임 자격 증명은
  SQLite에 저장됩니다. 기존 `auth-profiles.json`, 에이전트별 `auth.json`, 공유
  `credentials/oauth.json` 파일은 doctor 마이그레이션 입력이며, 가져온 후
  제거됩니다.
- 생성된 모델 카탈로그 상태는 데이터베이스 기반입니다. 런타임 코드는
  `agents/<agentId>/agent/models.json`을 쓰면 안 됩니다. 기존 `models.json` 파일은 레거시
  doctor 입력이며 `agent_model_catalogs`로 가져온 후 제거됩니다.
- 런타임은 transcript locator를 마이그레이션, 정규화 또는 브리지하면 안 됩니다. 활성
  transcript ID는 SQLite의 `{agentId, sessionId}`입니다. 파일 경로는
  레거시 doctor 입력일 뿐이며, `sqlite-transcript://...`는 경계 핸들로
  취급되는 대신 런타임, 프로토콜, hook, plugin 표면에서 사라져야 합니다.
- 런타임 SQLite transcript 읽기는 기존 JSONL entry-shape 마이그레이션을 실행하거나
  호환성을 위해 전체 transcript를 다시 쓰지 않습니다. 레거시 엔트리 정규화는
  명시적인 doctor/import 유틸리티에 남습니다. Doctor는 레거시 JSONL transcript
  파일을 SQLite 행으로 삽입하기 전에 정규화합니다. 현재 런타임 행은
  이미 현재 transcript 스키마로 작성됩니다. trajectory/session 내보내기는
  해당 행을 있는 그대로 읽으며 내보내기 시점의 레거시 마이그레이션을 수행하면 안 됩니다.
- 레거시 transcript JSONL 파싱/마이그레이션 헬퍼는 doctor 전용입니다. 런타임
  transcript 형식 코드는 현재 SQLite transcript 컨텍스트만 빌드합니다. doctor는
  행 삽입 전에 기존 JSONL 엔트리 업그레이드를 담당합니다.
- 기존 런타임 소유 JSONL transcript 스트리밍 헬퍼는 삭제되었습니다. Doctor
  import 코드는 명시적인 레거시 파일 읽기를 담당하며, 런타임 session history는
  SQLite 행을 읽습니다.
- Codex app-server 바인딩은 Codex plugin-state 네임스페이스에서 OpenClaw `sessionId`를
  정식 키로 사용합니다. `sessionKey`는 라우팅/표시용 메타데이터이며,
  지속되는 session id를 대체하거나 transcript-file ID를 되살리면 안 됩니다.
- 컨텍스트 엔진은 현재 런타임 계약을 직접 받습니다. 레지스트리는
  `sessionKey`, `transcriptScope` 또는 `prompt`를 삭제하는 재시도 shim으로
  엔진을 감싸면 안 됩니다. 현재 데이터베이스 우선 매개변수를 받을 수 없는 엔진은
  브리지되는 대신 명확히 실패해야 합니다.
- 백업 출력은 하나의 아카이브 파일로 유지되어야 합니다. 데이터베이스 내용은
  원시 라이브 WAL 사이드카가 아니라 압축된 SQLite 스냅샷으로 해당 아카이브에
  들어가야 합니다.
- Transcript 검색은 유용하지만 첫 데이터베이스 우선 전환에는 필수가 아닙니다.
  나중에 FTS를 추가할 수 있도록 스키마를 설계하세요.
- Worker 실행은 데이터베이스 경계가 안정될 때까지 설정 뒤에서 실험적으로 유지되어야 합니다.

## 코드 읽기 결과

현재 브랜치는 이미 개념 증명 단계를 넘어섰습니다. 공유
데이터베이스가 존재하고, Node `node:sqlite`가 작은 런타임 헬퍼를 통해 연결되어 있으며,
이전 저장소들은 이제 `state/openclaw.sqlite` 또는 소유 주체의
`openclaw-agent.sqlite` 데이터베이스에 씁니다.

남은 작업은 SQLite를 선택하는 것이 아닙니다. 새 경계를 깔끔하게 유지하고
여전히 예전 파일 세계처럼 보이는 호환성 형태의 인터페이스를 삭제하는 것입니다.

- Session `storePath`는 더 이상 런타임 ID, 테스트 fixture 형태 또는
  status payload 필드가 아닙니다. 런타임 및 bridge 테스트에는 더 이상
  `storePath` 계약 이름이 없습니다. doctor/migration 코드가 해당 레거시 용어를 담당합니다.
- Session 쓰기는 더 이상 기존 인프로세스 `store-writer.ts`
  큐를 통과하지 않습니다. SQLite patch 쓰기는 대신 충돌 감지와 제한된 재시도를 사용합니다.
- 레거시 경로 검색은 여전히 유효한 마이그레이션 용도가 있지만, 런타임 코드는
  `sessions.json` 및 transcript JSONL 파일을 가능한 쓰기 대상으로 취급하는 것을 중단해야 합니다.
- 에이전트 소유 테이블은 에이전트별 SQLite 데이터베이스에 있습니다. 전역 DB는
  registry/control-plane 행을 유지합니다. transcript ID는 에이전트별 transcript 행의
  `{agentId, sessionId}`입니다. 런타임 코드는 transcript 파일 경로를 지속하거나
  transcript locator를 마이그레이션하면 안 됩니다.
- Doctor는 이미 여러 레거시 파일을 가져옵니다. 정리는 이를 doctor가 호출하는
  하나의 명시적인 마이그레이션 구현으로 만들고, 지속적인 마이그레이션 보고서를 갖추는 것입니다.

구현을 막는 추가 제품 질문은 없습니다.

## 현재 코드 형태

브랜치는 이미 실제 공유 SQLite 기반을 갖추고 있습니다:

- 런타임 하한은 이제 Node 22+입니다. `package.json`, CLI 런타임 가드,
  설치 프로그램 기본값, macOS 런타임 로케이터, CI, 공개 설치 문서가 모두
  일치합니다. 기존 Node 22 호환성 레인은 제거되었습니다.
- `src/state/openclaw-state-db.ts`는 `openclaw.sqlite`를 열고, WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`을 설정하며,
  `src/state/openclaw-state-schema.sql`에서 파생된 생성된 스키마 모듈을
  적용합니다.
- Kysely 테이블 타입과 런타임 스키마 모듈은 커밋된 `.sql` 파일로 만든 일회용
  SQLite 데이터베이스에서 생성됩니다. 런타임 코드는 더 이상 전역, 에이전트별,
  프록시 캡처 데이터베이스에 대해 복사해 붙여 넣은 스키마 문자열을 유지하지
  않습니다.
- 런타임 저장소는 SQLite 행 형태를 수동으로 섀도잉하는 대신, 생성된 Kysely
  `DB` 인터페이스에서 선택 및 삽입 행 타입을 파생합니다. Raw SQL은 스키마
  적용, pragma, 마이그레이션 전용 DDL로 계속 제한됩니다.
- 이 데이터베이스 레이아웃은 아직 릴리스되지 않았으므로 SQLite 스키마는
  `user_version = 1`로 축소되었습니다. 런타임 오프너는 현재 스키마만
  생성합니다. 파일-데이터베이스 가져오기는 doctor 코드에 남아 있으며,
  브랜치 로컬 데이터베이스 업그레이드 헬퍼는 삭제되었습니다.
- 소유권 경계가 표준인 곳에서는 관계형 소유권이 강제됩니다. 소스 마이그레이션
  행은 `migration_runs`에서, 작업 전달 상태는 `task_runs`에서, 트랜스크립트
  ID 행은 트랜스크립트 이벤트에서 cascade됩니다.
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
- 임의의 Plugin 소유 상태에는 호스트 소유 타입 지정 테이블을 만들지 않습니다.
  설치된 Plugin은 버전 지정 JSON 페이로드에 `plugin_state_entries`를, 바이트에
  `plugin_blob_entries`를 사용하며, 네임스페이스/키 소유권, TTL 정리, 백업,
  Plugin 마이그레이션 레코드를 갖습니다. `plugin_binding_approvals`처럼 호스트가
  쿼리 계약을 소유하는 경우에는 호스트 소유 Plugin 오케스트레이션 상태가
  여전히 타입 지정 테이블을 가질 수 있습니다.
- Plugin 마이그레이션은 호스트 스키마 마이그레이션이 아니라 Plugin 소유
  네임스페이스에 대한 데이터 마이그레이션입니다. Plugin은 마이그레이션
  provider를 통해 자체 버전 지정 상태/blob 항목을 마이그레이션할 수 있으며,
  호스트는 일반 마이그레이션 원장에 소스/실행 상태를 기록합니다. 새 Plugin
  설치는 호스트 자체가 새 교차 Plugin 계약의 소유권을 가져가는 경우가 아니라면
  `openclaw-state-schema.sql` 변경을 요구하지 않습니다.
- `src/state/openclaw-agent-db.ts`는
  `agents/<agentId>/agent/openclaw-agent.sqlite`를 열고, 전역 DB에
  데이터베이스를 등록하며, 에이전트 로컬 세션, 트랜스크립트, VFS, 아티팩트,
  캐시, 메모리 인덱스 테이블을 소유합니다. 공유 런타임 검색은 이제 각 호출
  지점에서 해당 쿼리를 다시 구현하는 대신, 생성된 타입의 `agent_databases`
  레지스트리를 읽습니다.
- 전역 및 에이전트별 데이터베이스는 데이터베이스 역할, 스키마 버전,
  타임스탬프, 에이전트 데이터베이스의 에이전트 ID를 포함하는 `schema_meta`
  행을 기록합니다. 이 SQLite 스키마는 아직 릴리스되지 않았으므로 레이아웃은
  여전히 `user_version = 1`로 유지됩니다.
- 에이전트별 세션 ID에는 이제 `session_id`를 키로 하는 표준 `sessions` 루트
  테이블이 있으며, `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, 타임스탬프, 표시 필드, 모델 메타데이터, 하네스 ID,
  부모/스폰 연결이 쿼리 가능한 열로 포함됩니다. `session_routes`는
  `session_key`에서 현재 `session_id`로 가는 고유한 활성 라우트 인덱스이므로,
  라우트 키는 핫 리드가 중복 `sessions.session_key` 행 중에서 선택하게 만들지
  않고도 새 durable 세션으로 이동할 수 있습니다. 기존
  `session_entries.entry_json` 호환성 형태 페이로드는 외래 키로 durable
  `session_id` 루트에 매달립니다. 더 이상 세션의 유일한 스키마 수준 표현이
  아닙니다.
- 에이전트별 외부 대화 ID도 관계형입니다.
  `conversations`는 정규화된 provider/account/conversation ID를 저장하고,
  `session_conversations`는 하나의 OpenClaw 세션을 하나 이상의 외부 대화에
  연결합니다. 이는 여러 피어가 `session_key`에서 거짓말하지 않고 의도적으로
  하나의 세션에 매핑될 수 있는 공유 메인 DM 세션을 포괄합니다. SQLite는 또한
  동일한 channel/account/kind/peer/thread 튜플이 여러 conversation ID로
  갈라질 수 없도록 자연 provider ID의 고유성을 강제합니다.
  공유 메인 직접 피어는 `participant` 역할로 연결되므로, 하나의 OpenClaw
  세션은 이전 피어를 모호한 관련 행으로 강등하지 않고 여러 외부 DM 피어를
  나타낼 수 있습니다. `sessions.primary_conversation_id`는 여전히 현재 타입
  지정 전달 대상을 가리킵니다. 닫힌 라우팅/상태 열은 TypeScript 유니언에만
  의존하지 않고 SQLite `CHECK` 제약 조건으로 강제됩니다.
  런타임 세션 프로젝션은 타입 지정 session/conversation 열을 적용하기 전에
  `session_entries.entry_json`에서 호환성 라우팅 섀도를 지우므로, 오래된 JSON
  페이로드가 전달 대상을 되살릴 수 없습니다.
  서브에이전트 announce 라우팅도 타입 지정 SQLite 전달 컨텍스트를 요구합니다.
  더 이상 호환성 `SessionEntry` 라우트 필드로 폴백하지 않습니다.
  Gateway `chat.send` 명시적 전달 상속은 `origin`/`last*` 호환성 필드 대신
  타입 지정 SQLite 전달 컨텍스트를 읽습니다.
  `tools.effective`도 오래된 `last*` 세션 항목 섀도가 아니라 타입 지정 SQLite
  전달/라우팅 행에서 provider/account/thread 컨텍스트를 파생합니다.
  시스템 이벤트 프롬프트 컨텍스트는 `origin` 섀도 대신 타입 지정 전달 필드에서
  channel/to/account/thread 필드를 다시 빌드합니다.
  공유 `deliveryContextFromSession` 헬퍼와 세션-대화 매퍼는 이제
  `SessionEntry.origin`을 완전히 무시합니다. 타입 지정 전달 필드와 관계형 대화
  행만 핫 라우트 ID를 만들 수 있습니다.
  런타임 세션 항목 정규화는 `entry_json`을 저장하거나 프로젝션하기 전에
  `origin`을 제거하며, 인바운드 메타데이터는 새 origin 섀도를 만들지 않고
  타입 지정 channel/chat 필드와 관계형 대화 행을 씁니다.
- 트랜스크립트 이벤트, 트랜스크립트 스냅샷, trajectory 런타임 이벤트는 이제
  표준 에이전트별 `sessions` 루트를 참조하고 세션 삭제 시 cascade됩니다.
  트랜스크립트 ID/idempotency 행은 계속 정확한 트랜스크립트 이벤트 행에서
  cascade됩니다.
- memory-core 인덱스는 이제 명시적 에이전트 데이터베이스 테이블인
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks`,
  `memory_embedding_cache`를 사용하며, `memory_index_state`가 리비전 변경을
  추적합니다. 선택적 FTS/vector 사이드 인덱스는 일반적인 `meta`, `files`,
  `chunks`, `chunks_fts`, `chunks_vec` 테이블 대신 `memory_index_chunks_fts`와
  `memory_index_chunks_vec`로 명명됩니다. 표준 이름은 현재 path/source 행
  형태와 직렬화된 embedding 호환성을 유지합니다. 이 테이블은 파생/검색
  캐시이며, 표준 트랜스크립트 저장소가 아닙니다. 메모리 워크스페이스 파일과
  구성된 소스에서 삭제하고 다시 빌드할 수 있습니다.
  릴리스된 일반 이름 메모리 인덱스를 열면 해당 메타데이터, 소스, 청크,
  embedding 캐시가 표준 테이블로 마이그레이션됩니다. 파생 FTS/vector 테이블은
  표준 이름 아래에서 다시 빌드됩니다.
- 서브에이전트 실행 복구 상태는 이제 인덱싱된 자식, 요청자, 컨트롤러 세션 키가
  있는 타입 지정 공유 `subagent_runs` 행에 있습니다. 기존 `subagents/runs.json`
  파일은 doctor 마이그레이션 입력 전용입니다.
- 현재 대화 바인딩은 이제 정규화된 conversation ID를 키로 하는 타입 지정 공유
  `current_conversation_bindings` 행에 있으며, 대상 agent/session 열, 대화
  종류, 상태, 만료, 메타데이터가 중복된 불투명 바인딩 레코드 대신 관계형 열로
  저장됩니다. durable 바인딩 키에는 정규화된 대화 종류가 포함되므로
  direct/group/channel 참조가 충돌할 수 없으며, SQLite는 유효하지 않은 바인딩
  종류/상태 값을 거부합니다. 기존
  `bindings/current-conversations.json` 파일은 doctor 마이그레이션 입력
  전용입니다.
- 전달 큐 복구는 이제 replay JSON 위에 channel, target, account, session,
  retry, error, platform-send, recovery state에 대한 타입 지정 큐 열을
  오버레이합니다. `entry_json`은 replay 페이로드, hook, formatting 페이로드를
  유지하지만, 타입 지정 열이 핫 큐 라우팅/상태의 권위 있는 원천입니다.
- TUI 마지막 세션 복원 포인터는 이제 해시된 TUI 연결/세션 범위를 키로 하는 타입
  지정 공유 `tui_last_sessions` 행에 있습니다. 기존 TUI JSON 파일은 doctor
  마이그레이션 입력 전용입니다.
- 기본 TTS prefs는 이제 `speech-core` Plugin 아래 키가 지정된 공유 Plugin 상태
  SQLite 행에 있습니다. 기존 `settings/tts.json` 파일은 doctor 마이그레이션
  입력 전용입니다. 런타임은 더 이상 TTS prefs JSON 파일을 읽거나 쓰지 않으며,
  레거시 경로 resolver는 doctor 마이그레이션 모듈에 있습니다.
- 비밀 대상 메타데이터는 이제 모든 자격 증명 대상이 config 파일인 것처럼
  가장하는 대신 저장소에 대해 말합니다. `openclaw.json`은 config 저장소로
  남습니다. auth-profile 대상은 provider 형태의 자격 증명을 JSON 페이로드로
  유지하는 타입 지정 SQLite `auth_profile_stores` 행을 사용합니다.
- 비밀 감사는 더 이상 폐기된 에이전트별 `auth.json` 파일을 스캔하지 않습니다.
  해당 레거시 파일에 대한 경고, 가져오기, 제거는 doctor가 소유합니다.
- 레거시 auth profile 경로 헬퍼는 이제 doctor 레거시 코드에 있습니다. 코어 auth
  profile 경로 헬퍼는 `auth-profiles.json` 또는 `auth-state.json` 런타임 경로가
  아니라 SQLite auth-store ID와 표시 위치를 노출합니다.
- 서브에이전트 실행 복구 및 OpenRouter 모델 기능 캐시 런타임 모듈은 이제 SQLite
  스냅샷 reader/writer를 doctor 전용 레거시 JSON 가져오기 헬퍼와 분리해서
  유지합니다. OpenRouter 기능은 하나의 불투명 캐시 blob이나 provider 전용
  호스트 테이블 대신 `provider_id = "openrouter"` 아래 타입 지정 일반
  `model_capability_cache` 행을 사용합니다. 서브에이전트 실행 `taskName`은 타입
  지정 `subagent_runs.task_name` 열에 저장됩니다. `payload_json` 사본은
  replay/debug 데이터이며, 핫 표시 또는 조회 필드의 원천이 아닙니다.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts`는 에이전트 데이터베이스
  `vfs_entries` 테이블 위에 SQLite VFS를 구현합니다. 디렉터리 읽기, 재귀적
  내보내기, 삭제, 이름 변경은 전체 네임스페이스를 스캔하거나 `LIKE` 경로
  매칭에 의존하지 않고 인덱싱된 `(namespace, path)` prefix 범위를 사용합니다.
- `src/agents/runtime-worker.entry.ts`는 worker를 위한 실행별 SQLite VFS, 도구
  아티팩트, 실행 아티팩트, 범위 지정 캐시 저장소를 생성합니다.
- 워크스페이스 부트스트랩 완료 마커는 이제 `.openclaw/workspace-state.json`
  대신 resolved workspace path를 키로 하는 타입 지정 공유
  `workspace_setup_state` 행에 있습니다. 런타임은 더 이상 레거시 워크스페이스
  마커를 읽거나 다시 쓰지 않으며, 헬퍼 API는 저장소 ID를 파생하기 위해 가짜
  `.openclaw/setup-state` 경로를 전달하지 않습니다.
- Exec 승인은 이제 타입 지정 공유 SQLite `exec_approvals_config` 싱글턴 행에
  있습니다. Doctor는 레거시 `~/.openclaw/exec-approvals.json`을 가져옵니다.
  런타임 쓰기는 더 이상 해당 파일을 활성 저장소 위치로 만들거나, 다시 쓰거나,
  보고하지 않습니다. macOS companion은 동일한 `state/openclaw.sqlite` 테이블
  행을 읽고 씁니다. Unix 프롬프트 소켓은 IPC이지 durable 런타임 상태가
  아니므로 디스크에는 그것만 유지합니다.
- 디바이스 ID, 디바이스 auth, 부트스트랩 런타임 모듈은 이제 SQLite 스냅샷
  reader/writer를 doctor 전용 레거시 JSON 가져오기 헬퍼와 분리해서 유지합니다.
  디바이스 ID는 타입 지정 `device_identities` 행을 사용하고, 디바이스 auth
  토큰은 타입 지정 `device_auth_tokens` 행을 사용합니다. 디바이스 auth 쓰기는
  토큰 테이블을 truncate하는 대신 device/role 기준으로 행을 조정하며, 런타임은
  더 이상 단일 토큰 업데이트를 기존 whole-store adapter로 라우팅하지 않습니다. 레거시
  버전 1 JSON 페이로드는 doctor 가져오기/내보내기 형태로만 존재합니다.
- GitHub Copilot 토큰 교환 캐시는 `github-copilot/token-cache/default` 아래의 공유 SQLite Plugin 상태 테이블을 사용합니다. 이는 공급자 소유 캐시 상태이므로 의도적으로 호스트 스키마 테이블을 추가하지 않습니다.
- GitHub Copilot Compaction은 더 이상 `openclaw-compaction-*.json` 작업 영역 사이드카를 쓰지 않습니다. 하네스는 추적 중인 SDK 세션에 대해 SDK 기록 Compaction RPC를 호출하며, OpenClaw는 호환성 마커 파일 대신 SQLite에 내구성 있는 세션/트랜스크립트 상태를 유지합니다.
- 공유 Swift 런타임(`OpenClawKit`)은 기기 ID와 기기 인증에 동일한 `state/openclaw.sqlite` 행을 사용합니다. macOS 앱 헬퍼는 두 번째 JSON 또는 SQLite 경로를 소유하는 대신 공유 SQLite 헬퍼를 가져옵니다. 남아 있는 레거시 `identity/device.json`은 doctor가 이를 SQLite로 가져올 때까지 ID 생성을 차단하며, 이는 TypeScript 및 Android 시작 게이트와 일치합니다.
- Android 기기 ID는 타입이 지정된 `state/openclaw.sqlite#table/device_identities` 행에 저장된 동일한 TypeScript 호환 키 자료를 사용합니다. `openclaw/identity/device.json`을 읽거나 쓰지 않으며, 남아 있는 레거시 파일은 doctor가 이를 SQLite로 가져올 때까지 시작을 차단합니다.
- Android 캐시된 기기 인증 토큰도 타입이 지정된 `state/openclaw.sqlite#table/device_auth_tokens` 행을 사용하며 TypeScript 및 Swift와 동일한 버전 1 토큰 의미 체계를 공유합니다. 런타임은 더 이상 `SecurePrefs` `gateway.deviceToken*` 호환성 키를 읽지 않으며, 해당 키는 마이그레이션/doctor 로직에만 속합니다.
- Android 알림 최근 패키지 기록은 타입이 지정된 `android_notification_recent_packages` 행을 사용합니다. 런타임은 더 이상 이전 SharedPreferences CSV 키를 마이그레이션하거나 읽지 않습니다.
- 레거시 `identity/device.json`이 있거나, SQLite ID 행이 유효하지 않거나, SQLite ID 저장소를 열 수 없으면 기기 ID 생성은 실패 시 차단됩니다. doctor가 먼저 해당 파일을 가져오고 제거하므로, 런타임 시작이 마이그레이션 전에 페어링 ID를 조용히 회전할 수 없습니다.
- 기기 ID 선택은 JSON 파일 위치 지정자가 아니라 SQLite 행 키입니다. 테스트와 Gateway 헬퍼는 명시적 ID 키를 전달하며, doctor 마이그레이션과 실패 시 차단하는 시작 게이트만 폐기된 `identity/device.json` 파일 이름을 알고 있습니다.
- 세션 재설정 호환성은 이제 doctor 구성 마이그레이션에 있습니다. `session.idleMinutes`는 `session.reset.idleMinutes`로 이동되고, `session.resetByType.dm`은 `session.resetByType.direct`로 이동되며, 런타임 재설정 정책은 표준 재설정 키만 읽습니다.
- 레거시 구성 호환성은 이제 `src/commands/doctor/` 아래에 있습니다. 일반 `readConfigFileSnapshot()` 검증은 doctor 레거시 감지기를 가져오거나 레거시 이슈에 주석을 달지 않습니다. `runDoctorConfigPreflight()`가 doctor 복구/보고를 위해 해당 이슈를 추가합니다. doctor 구성 흐름은 `src/commands/doctor/legacy-config.ts`를 가져오며, 이전 OAuth 프로필 ID 복구는 `src/commands/doctor/legacy/oauth-profile-ids.ts` 아래에 있습니다.
- doctor가 아닌 명령은 레거시 구성 복구를 자동 실행하지 않습니다. 예를 들어 `openclaw update --channel`은 이제 유효하지 않은 레거시 구성에서 실패하고, doctor 마이그레이션 코드를 조용히 가져오는 대신 사용자에게 doctor 실행을 요청합니다.
- 웹 푸시, APNs, Voice Wake, 업데이트 확인, 구성 상태는 이제 전체 불투명 JSON 블롭 대신 구독, VAPID 키, 노드 등록, 트리거 행, 라우팅 행, 업데이트 알림 상태, 구성 상태 항목에 타입이 지정된 공유 SQLite 테이블을 사용합니다. 웹 푸시와 APNs 스냅샷 쓰기는 이제 테이블을 지우는 대신 기본 키로 구독/등록을 조정하며, 구성 상태도 구성 경로를 기준으로 동일하게 처리합니다.
  해당 런타임 모듈은 SQLite 스냅샷 리더/라이터를 doctor 전용 레거시 JSON 가져오기 헬퍼와 분리해 유지합니다.
- 노드 호스트 구성은 이제 공유 SQLite 데이터베이스의 타입이 지정된 싱글턴 행을 사용합니다. doctor는 일반 런타임 사용 전에 이전 `node.json` 파일을 가져옵니다.
- 기기/노드 페어링, 채널 페어링, 채널 허용 목록, 부트스트랩 상태는 이제 전체 불투명 JSON 블롭 대신 타입이 지정된 SQLite 행을 사용합니다. Plugin 바인딩 승인과 Cron 작업 상태도 동일하게 분리됩니다. 런타임 모듈은 SQLite 기반 작업과 중립적인 스냅샷 헬퍼를 노출하고, 페어링/부트스트랩 및 Plugin 바인딩 승인 스냅샷 쓰기는 테이블을 잘라내는 대신 기본 키로 행을 조정하며, doctor는 `src/commands/doctor/legacy/*` 모듈을 통해 이전 JSON 파일을 가져오고 제거합니다.
- 설치된 Plugin 레코드는 이제 SQLite 설치된 Plugin 인덱스에 있습니다. 런타임 구성 읽기/쓰기는 더 이상 이전 `plugins.installs` 작성자 구성 데이터를 마이그레이션하거나 보존하지 않습니다. doctor는 일반 런타임 사용 전에 해당 레거시 구성 형태를 SQLite로 가져옵니다.
- QQBot 자격 증명 복구 스냅샷은 이제 `qqbot/credential-backups` 아래 SQLite Plugin 상태에 있습니다. 런타임은 더 이상 `qqbot/data/credential-backup*.json`을 쓰지 않습니다. QQBot doctor 계약은 활성 상태 디렉터리에서 해당 레거시 백업 파일을 가져오고 보관합니다.
- Gateway 다시 로드 계획은 내부 `installedPluginIndex.installRecords.*` diff 네임스페이스 아래의 SQLite 설치된 Plugin 인덱스 스냅샷을 비교합니다. 런타임 다시 로드 결정은 더 이상 해당 행을 가짜 `plugins.installs` 구성 객체로 감싸지 않습니다.
- Matrix 명명된 계정 자격 증명 업그레이드는 더 이상 런타임 읽기 중에 발생하지 않습니다. 단일/기본 Matrix 계정을 해석할 수 있을 때 이전 최상위 `credentials/matrix/credentials.json` 이름 변경은 doctor가 소유합니다.
- 코어 페어링 및 Cron 런타임 모듈은 더 이상 레거시 JSON 경로 빌더를 내보내지 않습니다. doctor 소유 레거시 모듈은 가져오기 테스트와 마이그레이션에만 `pending.json`, `paired.json`, `bootstrap.json`, `cron/jobs.json` 소스 경로를 구성합니다. 레거시 Cron 작업 형태 정규화와 Cron 실행 로그 가져오기는 `src/commands/doctor/legacy/cron*.ts` 아래에 있습니다.
- `src/commands/doctor/legacy/runtime-state.ts`는 노드 호스트 구성을 포함한 레거시 JSON 상태 파일을 doctor에서 SQLite로 가져옵니다. 새로운 레거시 파일 가져오기 도구는 `src/commands/doctor/legacy/` 아래에 유지됩니다.
- `src/commands/doctor/state-migrations.ts`는 레거시 `sessions.json` 및 `*.jsonl` 트랜스크립트를 SQLite로 직접 가져오고 성공한 소스를 제거합니다. 더 이상 루트 레거시 트랜스크립트를 `agents/<agentId>/sessions/*.jsonl`을 통해 스테이징하거나 가져오기 전에 표준 JSONL 대상을 만들지 않습니다.
- 상태 무결성 doctor 검사는 더 이상 레거시 세션 디렉터리를 스캔하거나 고아 JSONL 삭제를 제안하지 않습니다. 레거시 트랜스크립트 파일은 마이그레이션 입력일 뿐이며, 마이그레이션 단계가 가져오기와 소스 제거를 소유합니다.
- 레거시 샌드박스 레지스트리 가져오기는 `src/commands/doctor/legacy/sandbox-registry.ts` 아래에 있습니다. 활성 샌드박스 레지스트리 읽기와 쓰기는 SQLite 전용으로 유지됩니다.
- 레거시 세션 트랜스크립트 상태/가져오기 복구는 `src/commands/doctor/legacy/session-transcript-health.ts` 아래에 있습니다. 런타임 명령 모듈은 더 이상 JSONL 트랜스크립트 구문 분석이나 활성 브랜치 복구 코드를 포함하지 않습니다.

완료된 통합/삭제 주요 사항:

- Plugin 상태는 이제 공유 `state/openclaw.sqlite` 데이터베이스를 사용합니다. 이전
  브랜치 로컬 `plugin-state/state.sqlite` 사이드카 임포터는 해당 SQLite 레이아웃이
  출시된 적이 없으므로 제거되었습니다. 프로브/테스트 헬퍼는 Plugin 상태 전용
  SQLite 경로를 노출하는 대신 공유 `databasePath`를 보고합니다.
- 작업 및 작업 흐름 런타임 테이블은 이제 `tasks/runs.sqlite` 및
  `tasks/flows/registry.sqlite` 대신 공유 `state/openclaw.sqlite` 데이터베이스에
  있습니다. 이전 사이드카 임포터는 동일하게 출시되지 않은 레이아웃이라는 이유로
  제거되었습니다.
- `src/config/sessions/store.ts`는 더 이상 인바운드 메타데이터, 라우트 업데이트,
  updated-at 읽기에 `storePath`가 필요하지 않습니다. 명령 지속성, CLI 세션 정리,
  하위 에이전트 깊이, 인증 재정의, 트랜스크립트 세션 식별은 에이전트/세션 행 API를
  사용합니다. 쓰기는 낙관적 충돌 재시도와 함께 SQLite 행 패치로 적용됩니다.
- 세션 대상 해석은 이제 레거시 `sessions.json` 경로가 아니라 에이전트별 데이터베이스
  대상을 노출합니다. 공유 Gateway, ACP 메타데이터, doctor 라우트 복구,
  `openclaw sessions`는 `agent_databases`와 구성된 에이전트를 열거합니다.
- Gateway 세션 라우팅은 이제 `resolveGatewaySessionDatabaseTarget`을 사용합니다.
  반환된 대상은 레거시 세션 저장소 파일 경로 대신 `databasePath`와 후보 SQLite 행
  키를 포함합니다.
- 채널 세션 런타임 타입은 이제 updated-at 읽기, 인바운드 메타데이터, 마지막 라우트
  업데이트를 위해 `{agentId, sessionKey}`를 노출합니다. 이전
  `saveSessionStore(storePath, store)` 호환성 타입은 사라졌습니다.
- Plugin 런타임, 확장 API, `config/sessions` 배럴 표면은 이제 Plugin 코드가
  SQLite 기반 세션 행 헬퍼를 사용하도록 유도합니다. 루트 라이브러리 호환성 export
  (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`)는 기존 소비자를 위한
  deprecated shim으로 남아 있습니다. 이전 `resolveLegacySessionStorePath` 헬퍼는
  사라졌으며, 레거시 `sessions.json` 경로 구성은 이제 마이그레이션과 테스트 픽스처에
  로컬로만 존재합니다.
- `src/config/sessions/session-entries.sqlite.ts`는 이제 표준 세션 항목을 에이전트별
  데이터베이스에 저장하며 행 수준 read/upsert/delete 패치를 지원합니다. 런타임
  upsert/patch/delete는 더 이상 대소문자 변형을 스캔하거나 레거시 별칭 키를 정리하지
  않습니다. 표준화는 doctor가 담당합니다. 독립형 JSON 가져오기 헬퍼는 사라졌고,
  마이그레이션 병합은 전체 세션 테이블을 교체하는 대신 더 최신 행을 upsert합니다.
  공개 read/list/load 헬퍼는 타입이 지정된 `sessions` 및 `conversations` 행에서 핫
  세션 메타데이터를 투영합니다. `entry_json`은 호환성/디버그용 섀도이며, 오래되거나
  유효하지 않아도 타입이 지정된 세션 식별 또는 전달 컨텍스트를 잃지 않습니다.
- `src/config/sessions/delivery-info.ts`는 이제 타입이 지정된 에이전트별 `sessions` +
  `conversations` + `session_conversations` 행에서 전달 컨텍스트를 해석합니다. 더 이상
  `session_entries.entry_json`에서 런타임 전달 식별을 재구성하지 않습니다. 타입이 지정된
  대화 행이 누락된 것은 런타임 fallback이 아니라 doctor 마이그레이션/복구 문제입니다.
- 저장된 세션 재설정 결정은 이제 타입이 지정된 `sessions.session_scope`,
  `sessions.chat_type`, `sessions.channel` 메타데이터를 우선합니다. `sessionKey` 파싱은
  명령 대상의 명시적 스레드/토픽 접미사에만 남아 있습니다. 그룹 대 직접 재설정 분류는
  더 이상 키 형태에서 오지 않습니다.
- 세션 목록/상태 표시 분류는 이제 타입이 지정된 채팅 메타데이터와 Gateway 세션 종류를
  사용합니다. 더 이상 `session_key` 내부의 `:group:` 또는 `:channel:` 하위 문자열을
  지속 가능한 그룹/직접 진실로 취급하지 않습니다.
- 무음 응답 정책 선택은 이제 명시적 대화 타입 또는 표면 메타데이터만 사용합니다. 더
  이상 `session_key` 하위 문자열에서 직접/그룹 정책을 추측하지 않습니다.
- 세션 표시 모델 해석은 이제 `session_key`에서 분리하는 대신 SQLite 세션 데이터베이스
  대상에서 에이전트 ID를 받습니다.
- 에이전트 간 공지 대상 하이드레이션은 이제 타입이 지정된 `sessions.list`
  `deliveryContext`만 사용합니다. 더 이상 레거시 `origin`, 미러링된 `last*` 필드,
  `session_key` 형태에서 채널/계정/스레드 라우팅을 복구하지 않습니다.
- `sessions_send` 스레드 대상 거부는 이제 타입이 지정된 SQLite 라우팅 메타데이터를
  읽습니다. 더 이상 대상 키에서 스레드 접미사를 파싱해 대상을 거부하거나 허용하지
  않습니다.
- 그룹 범위 도구 정책 검증은 이제 현재 또는 생성된 세션의 타입이 지정된 SQLite 대화
  라우팅을 읽습니다. 더 이상 `sessionKey`를 디코딩해 그룹/채널 식별을 신뢰하지
  않습니다. 타입이 지정된 세션 행이 보증하지 않으면 호출자가 제공한 그룹 ID는
  삭제됩니다.
- 채널 모델 재정의 매칭은 이제 명시적 그룹 및 상위 대화 메타데이터를 사용합니다. 더
  이상 `parentSessionKey`에서 상위 대화 ID를 디코딩하지 않습니다.
- 저장된 모델 재정의 상속에는 이제 타입이 지정된 세션 컨텍스트의 명시적 상위 세션 키가
  필요합니다. 더 이상 `sessionKey`의 `:thread:` 또는 `:topic:` 접미사에서 상위
  재정의를 파생하지 않습니다.
- 이전 세션 스레드 정보 래퍼와 로드된 Plugin 스레드 파서는 사라졌습니다. 어떤 런타임
  코드도 `config/sessions/thread-info`를 가져오지 않습니다.
- 채널 대화 헬퍼는 더 이상 전체 세션 키 파싱 브리지를 노출하지 않습니다. Core는 여전히
  `resolveSessionConversation(...)`를 통해 공급자가 소유한 원시 대화 ID를 정규화하지만,
  `sessionKey`에서 라우트 사실을 재구성하지는 않습니다.
- 완료 전달, 전송 정책, 작업 유지 관리는 더 이상 `session_key` 형태에서 채팅 타입을
  파생하지 않습니다. 이전 채팅 타입 키 파서는 삭제되었습니다. 이 경로들은 타입이 지정된
  세션 메타데이터, 타입이 지정된 전달 컨텍스트 또는 명시적 전달 대상 어휘가 필요합니다.
- 세션 목록/상태, 진단, 승인 계정 바인딩, TUI Heartbeat 필터링, 사용량 요약은 더 이상
  공급자/계정/스레드/표시 라우팅을 위해 `SessionEntry.origin`을 캐지 않습니다. 남아
  있는 런타임 `origin` 읽기는 세션이 아닌 개념 또는 현재 턴 전달 객체뿐입니다.
- 승인 요청 네이티브 대화 조회는 이제 타입이 지정된 에이전트별 세션 라우팅 행을
  읽습니다. 더 이상 `sessionKey`에서 채널/그룹/스레드 대화 식별을 파싱하지 않습니다.
  타입이 지정된 메타데이터 누락은 마이그레이션/복구 문제입니다.
- Gateway 세션 changed/chat/session 이벤트 페이로드는 더 이상 `SessionEntry.origin` 또는
  `last*` 라우트 섀도를 되풀이하지 않습니다. 클라이언트는 타입이 지정된 `channel`,
  `chatType`, `deliveryContext`를 받습니다.
- Heartbeat 전달 해석은 이제 타입이 지정된 SQLite `deliveryContext`를 직접 받을 수
  있으며, Heartbeat 런타임은 현재 라우팅을 위해 호환성 `session_entries` 섀도에
  의존하는 대신 에이전트별 세션 전달 행을 전달합니다.
- Cron 격리 에이전트 전달 대상 해석도 호환성 항목 페이로드로 fallback하기 전에 타입이
  지정된 에이전트별 세션 전달 행에서 현재 라우트를 하이드레이션합니다.
- 하위 에이전트 공지 origin 해석은 이제 타입이 지정된 요청자 세션 전달 컨텍스트를
  `loadRequesterSessionEntry`로 전달하고, 호환성 `last*`/`deliveryContext` 섀도보다 해당
  행을 우선합니다.
- 인바운드 세션 메타데이터 업데이트는 이제 먼저 타입이 지정된 에이전트별 전달 행과
  병합합니다. 이전 `SessionEntry` 전달 필드는 타입이 지정된 대화 행이 없을 때만
  fallback으로 사용됩니다.
- 재시작/업데이트 전달 추출은 이제 `sessionKey`에서 파싱한 토픽/스레드 조각보다 타입이
  지정된 SQLite 전달 `threadId`를 우선합니다. 파싱은 레거시 스레드 형태 키를 위한
  fallback일 뿐입니다.
- 훅 에이전트 컨텍스트 채널 ID는 이제 타입이 지정된 SQLite 대화 식별을 우선하고, 그다음
  명시적 메시지 메타데이터를 사용합니다. 더 이상 `sessionKey`에서 공급자/그룹/채널
  조각을 파싱하지 않습니다.
- Gateway `chat.send` 외부 라우트 상속은 이제 `sessionKey` 조각에서 채널/직접/그룹
  범위를 추론하는 대신 타입이 지정된 SQLite 세션 라우팅 메타데이터를 읽습니다. 채널
  범위 세션은 타입이 지정된 세션 채널과 채팅 타입이 저장된 전달 컨텍스트와 일치할 때만
  상속합니다. 공유 메인 세션은 더 엄격한 CLI/클라이언트 메타데이터 없음 규칙을
  유지합니다.
- 재시작 센티널 wake 및 continuation 라우팅은 이제 Heartbeat wake 또는 라우팅된 에이전트
  턴 continuation을 큐에 넣기 전에 타입이 지정된 SQLite 전달/라우팅 행을 읽습니다. 더
  이상 세션 항목 JSON 섀도에서 전달 컨텍스트를 재구성하지 않습니다.
- Gateway `tools.effective` 컨텍스트 해석은 이제 공급자, 계정, 대상, 스레드, 응답 모드
  입력을 위해 타입이 지정된 SQLite 전달/라우팅 행을 읽습니다. 더 이상 오래된
  `session_entries.entry_json` origin 섀도에서 이러한 핵심 라우팅 필드를 복구하지
  않습니다.
- Realtime 음성 상담 라우팅은 이제 타입이 지정된 에이전트별 SQLite 세션 행에서
  상위/호출 전달을 해석합니다. 내장 에이전트 메시지 라우트를 선택할 때 더 이상 호환성
  `SessionEntry.deliveryContext` 섀도로 fallback하지 않습니다.
- ACP spawn Heartbeat 릴레이와 상위 스트림 라우팅은 이제 타입이 지정된 SQLite 세션 행에서
  상위 전달을 읽습니다. 더 이상 호환성 세션 항목 섀도에서 상위 전달 컨텍스트를
  재구성하지 않습니다.
- 세션 전달 라우트 보존은 이제 타입이 지정된 채팅 메타데이터와 지속된 전달 컬럼을
  따릅니다. 더 이상 `sessionKey`에서 채널 힌트, direct/main 마커 또는 스레드 형태를
  추출하지 않습니다. 내부 웹채팅 라우트는 SQLite가 이미 해당 세션에 대해 타입이
  지정되고 지속된 전달 식별을 가지고 있을 때만 외부 대상을 상속합니다.
- 일반 세션 전달 추출은 이제 정확한 타입이 지정된 SQLite 세션 전달 행만 읽습니다. 더
  이상 스레드/토픽 접미사를 파싱하거나 스레드 형태 키에서 기본 세션 키로 fallback하지
  않습니다.
- 응답 디스패치, 재시작 센티널 복구, Realtime 음성 상담 라우팅은 이제 스레드 라우팅에
  정확한 타입이 지정된 SQLite 세션/대화 행을 사용합니다. 더 이상 스레드 형태 세션 키를
  파싱해 스레드 ID 또는 기본 세션 전달 컨텍스트를 복구하지 않습니다.
- 내장 PI 기록 제한은 이제 공급자, 채팅 타입, 피어 식별에 타입이 지정된 SQLite 세션
  라우팅 투영(`sessions` + 기본 `conversations`)을 사용합니다. 더 이상 `sessionKey`에서
  공급자, DM, 그룹 또는 스레드 형태를 파싱하지 않습니다.
- Cron 도구 전달 추론은 이제 명시적 전달 또는 현재 타입이 지정된 전달 컨텍스트만
  사용합니다. 더 이상 `agentSessionKey`에서 채널, 피어, 계정 또는 스레드 대상을
  디코딩하지 않습니다.
- 런타임 세션 행은 더 이상 이전 `lastProvider` 라우트 별칭을 포함하지 않습니다. 헬퍼와
  테스트는 타입이 지정된 `lastChannel` 및 `deliveryContext` 필드를 사용합니다. 이전
  라우트 별칭 또는 지속된 `origin` 섀도를 변환해야 하는 유일한 위치는 doctor
  마이그레이션입니다.
- 트랜스크립트 이벤트, VFS 행, 도구 아티팩트 행은 이제 에이전트별 데이터베이스에
  기록됩니다. 출시되지 않은 전역 트랜스크립트 파일 매핑 테이블은 사라졌습니다. 대신
  doctor가 지속 가능한 마이그레이션 행에 레거시 소스 경로를 기록합니다.
- 런타임 트랜스크립트 조회는 더 이상 JSONL 바이트 오프셋을 스캔하거나 레거시
  트랜스크립트 파일을 프로브하지 않습니다. Gateway 채팅/미디어/기록 경로는 SQLite에서
  트랜스크립트 행을 읽습니다. 세션 JSONL은 이제 런타임 상태나 export 형식이 아니라
  레거시 doctor 입력일 뿐입니다.
- 트랜스크립트 상위 및 브랜치 관계는 경로 같은
  `agent-db:...transcript_events...` 로케이터 문자열이 아니라 SQLite 트랜스크립트 헤더의
  구조화된 `parentTranscriptScope: {agentId, sessionId}` 메타데이터를 사용합니다.
- 트랜스크립트 매니저 계약은 더 이상 암시적으로 지속되는 `create(cwd)` 또는
  `continueRecent(cwd)` 생성자를 노출하지 않습니다. 지속된 트랜스크립트 매니저는 명시적
  `{agentId, sessionId}` 범위로 열립니다. 범위가 없는 매니저는 테스트와 순수
  트랜스크립트 변환을 위한 인메모리 매니저에만 남아 있습니다.
- 런타임 트랜스크립트 저장소 API는 파일 시스템 경로가 아니라 SQLite 범위를 해석합니다.
  이전 `resolve...ForPath` 헬퍼와 사용되지 않는 `transcriptPath` 쓰기 옵션은 런타임
  호출자에서 사라졌습니다.
- 런타임 세션 해석은 이제 `{agentId, sessionId}`를 사용하며 외부 경계를 위해
  `sqlite-transcript://<agent>/<session>` 문자열을 파생해서는 안 됩니다. 레거시 절대
  JSONL 경로는 doctor 마이그레이션 입력일 뿐입니다.
- 네이티브 훅 릴레이 direct-bridge 레코드는 이제 릴레이 ID로 키가 지정된 타입이 지정된
  공유 `native_hook_relay_bridges` 행에 있습니다. 런타임은 더 이상 이러한 단기 브리지
  레코드를 위해 `/tmp` JSON 레지스트리나 불투명한 일반 레코드를 쓰지 않습니다.
- `runEmbeddedPiAgent(...)`에는 더 이상 트랜스크립트 로케이터 매개변수가 없습니다.
  준비된 작업자 디스크립터도 트랜스크립트 로케이터를 생략합니다. 런타임 세션
  상태와 큐에 들어간 후속 실행은 파생된 트랜스크립트 핸들 대신
  `{agentId, sessionId}`를 전달합니다.
- 임베디드 Compaction은 이제 `agentId`와 `sessionId`에서 SQLite 범위를 가져옵니다.
  Compaction 훅, 컨텍스트 엔진 호출, CLI 위임, 프로토콜 응답은
  파생된 `sqlite-transcript://...` 핸들을 받아서는 안 됩니다. 내보내기/디버그 코드는
  행에서 명시적인 사용자 아티팩트를 구체화할 수 있지만, 범용 세션 JSONL 내보내기
  경로를 제공하거나 파일 이름을 런타임 ID로 다시 공급하지 않습니다.
- `/export-session`은 SQLite에서 트랜스크립트 행을 읽고 요청된 독립형
  HTML 보기만 씁니다. 임베디드 뷰어는 더 이상 해당 행에서 세션 JSONL을
  재구성하거나 다운로드하지 않습니다.
- 컨텍스트 엔진 위임은 더 이상 에이전트 ID를 복구하기 위해
  트랜스크립트 로케이터를 파싱하지 않습니다. 준비된 런타임 컨텍스트가 해석된 `agentId`를
  내장 Compaction 어댑터로 전달합니다.
- 트랜스크립트 재작성과 실시간 도구 결과 잘라내기는 이제 `{agentId, sessionId}`로
  트랜스크립트 상태를 읽고 유지하며, 트랜스크립트 업데이트 이벤트 페이로드용
  임시 로케이터를 파생하지 않습니다.
- 트랜스크립트 상태 헬퍼 표면에는 더 이상 로케이터 기반
  `readTranscriptState`, `replaceTranscriptStateEvents`, 또는
  `persistTranscriptStateMutation` 변형이 없습니다. 런타임 호출자는
  `{agentId, sessionId}` API를 사용해야 합니다. Doctor 가져오기는 명시적 파일
  경로로 레거시 파일을 읽고 SQLite 행을 씁니다. 로케이터 문자열은 마이그레이션하지 않습니다.
- 런타임 세션 관리자 계약은 더 이상 `open(locator)`,
  `forkFrom(locator)`, 또는 `setTranscriptLocator(...)`를 노출하지 않습니다. 영속화된 세션
  관리자는 `{agentId, sessionId}`로만 열립니다. 목록/포크 헬퍼는 트랜스크립트 관리자
  퍼사드 대신 행 지향 세션 및 체크포인트 API에 있습니다.
- Gateway 트랜스크립트 리더 API는 범위 우선입니다. 이 API는
  `{agentId, sessionId}`를 받고, 우발적으로 런타임 ID가 될 수 있는
  위치 기반 트랜스크립트 로케이터를 받지 않습니다. 활성 트랜스크립트 로케이터 파싱은
  제거되었습니다. 레거시 소스 경로는 Doctor 가져오기 코드에서만 읽습니다.
- 트랜스크립트 업데이트 이벤트도 범위 우선입니다. `emitSessionTranscriptUpdate`는
  더 이상 단독 로케이터 문자열을 받지 않으며, 리스너는 핸들을 파싱하지 않고
  `{agentId, sessionId}`로 라우팅합니다.
- Gateway 세션 메시지 브로드캐스트는 트랜스크립트 로케이터가 아니라
  에이전트/세션 범위에서 세션 키를 해석합니다. 기존 트랜스크립트 로케이터-세션
  키 해석기/캐시는 제거되었습니다.
- Gateway 세션 기록 SSE는 에이전트/세션 범위로 실시간 업데이트를 필터링합니다. 스트림이
  업데이트를 받아야 하는지 결정하기 위해 트랜스크립트 로케이터 후보, realpath, 또는
  파일 형태의 트랜스크립트 ID를 더 이상 정규화하지 않습니다.
- 세션 수명주기 훅은 더 이상 `session_end`에서 트랜스크립트 로케이터를
  파생하거나 노출하지 않습니다. 훅 소비자는 `sessionId`, `sessionKey`, 다음 세션
  ID, 에이전트 컨텍스트를 받습니다. 트랜스크립트 파일은 수명주기
  계약의 일부가 아닙니다.
- 재설정 훅도 더 이상 트랜스크립트 로케이터를 파생하거나 노출하지 않습니다.
  `before_reset` 페이로드는 복구된 SQLite 메시지와 재설정
  이유를 전달하고, 세션 ID는 훅 컨텍스트에 유지됩니다.
- 에이전트 하네스 재설정은 더 이상 트랜스크립트 로케이터를 받지 않습니다. 재설정 디스패치는
  `sessionId`/`sessionKey`와 이유로 범위가 지정됩니다.
- 에이전트 확장 세션 유형은 더 이상 `transcriptLocator`를 노출하지 않습니다. 확장은
  파일 형태의 트랜스크립트 ID에 접근하는 대신 세션 컨텍스트와 런타임 API를
  사용해야 합니다.
- Plugin Compaction 훅은 더 이상 트랜스크립트 로케이터를 노출하지 않습니다. 훅 컨텍스트는
  이미 세션 ID를 전달하며, 트랜스크립트 읽기는 파일 형태의 핸들 대신
  SQLite 범위 인식 API를 통해 수행해야 합니다.
- `before_agent_finalize` 훅은 네이티브 훅 릴레이 페이로드를 포함해
  더 이상 `transcriptPath`를 노출하지 않습니다. 종료 훅은 세션 컨텍스트만 사용합니다.
- Gateway 재설정 응답은 더 이상 반환된 항목에 트랜스크립트 로케이터를
  합성하지 않습니다. 재설정은 SQLite 트랜스크립트 행을 만들고, 깨끗한
  세션 항목을 반환하며, 트랜스크립트 접근은 범위 인식 리더에 맡깁니다.
- 임베디드 실행 및 Compaction 결과는 더 이상 세션 회계용 트랜스크립트 로케이터를
  노출하지 않습니다. 자동 Compaction은 활성 `sessionId`, Compaction 카운터,
  토큰 메타데이터만 업데이트합니다.
- 임베디드 시도 결과는 더 이상 `transcriptLocatorUsed`를 반환하지 않으며,
  컨텍스트 엔진 `compact()` 결과도 더 이상 트랜스크립트 로케이터를 반환하지 않습니다.
  런타임 재시도 루프는 후속 `sessionId`만 받습니다.
- 전달 미러 트랜스크립트 추가 결과는 더 이상 트랜스크립트 로케이터를 반환하지 않습니다.
  호출자는 추가된 `messageId`를 받으며, 트랜스크립트 업데이트 신호는
  SQLite 범위를 사용합니다.
- 부모 세션 포크 헬퍼는 포크된 `sessionId`만 반환합니다. 하위 에이전트
  준비는 자식 에이전트/세션 범위를 엔진에 전달합니다.
- CLI 실행기 매개변수와 기록 재시드는 더 이상 트랜스크립트 로케이터를 받지 않습니다.
  CLI 기록 읽기는 `{agentId,
sessionId}`와 세션 키 컨텍스트에서 SQLite 트랜스크립트 범위를 해석합니다.
- CLI 및 임베디드 실행기 테스트 픽스처는 이제 활성 세션을 `*.jsonl` 파일인 것처럼
  가장하거나 런타임 매개변수에 `sqlite-transcript://...` 문자열을 전달하는 대신,
  세션 ID로 SQLite 트랜스크립트 행을 시드하고 읽습니다.
- 세션 도구 결과 가드 이벤트는 인메모리 관리자에 파생된 로케이터가 없더라도
  알려진 세션 범위에서 발생합니다. 해당 테스트는 더 이상 활성
  `/tmp/*.jsonl` 트랜스크립트 파일을 가짜로 만들지 않습니다.
- BTW 및 Compaction 체크포인트 헬퍼는 이제 SQLite 범위로 트랜스크립트 행을
  읽고 포크합니다. 체크포인트 메타데이터는 이제 세션 ID와 leaf/entry ID만 저장하며,
  파생된 로케이터는 더 이상 체크포인트 페이로드에 쓰지 않습니다.
- Gateway 트랜스크립트 키 조회는 프로토콜 경계에서 SQLite 트랜스크립트 범위를 사용하며,
  더 이상 트랜스크립트 파일 이름에 realpath 또는 stat을 수행하지 않습니다.
- 자동 Compaction 트랜스크립트 회전은 SQLite 트랜스크립트 저장소를 통해
  후속 트랜스크립트 행을 직접 씁니다. 세션 행은 내구성 있는 JSONL 경로나
  영속화된 로케이터가 아니라 후속 세션 ID만 보관합니다.
- 임베디드 컨텍스트 엔진 Compaction은 SQLite 이름 기반 트랜스크립트 회전
  헬퍼를 사용합니다. 회전 테스트는 더 이상 JSONL 후속 경로를 만들거나
  활성 세션을 파일로 모델링하지 않습니다.
- 관리형 발신 이미지 보존은 파일시스템 stat 호출 대신 SQLite 트랜스크립트
  통계에서 트랜스크립트 메시지 캐시 키를 지정합니다.
- 런타임 세션 잠금과 독립형 레거시 `.jsonl.lock` Doctor
  레인은 제거되었습니다.
- Microsoft Teams 런타임 배럴과 공개 Plugin SDK는 더 이상
  기존 파일 잠금 헬퍼를 다시 내보내지 않습니다. 내구성 있는 Plugin 상태 경로는 SQLite 기반입니다.
- 세션 수명/개수 가지치기와 명시적 세션 정리는 제거되었습니다.
  Doctor가 레거시 가져오기를 소유하며, 오래된 세션은 명시적으로 재설정되거나 삭제됩니다.
- Doctor 무결성 검사는 더 이상 레거시 JSONL 파일을 SQLite 세션 행의
  유효한 활성 트랜스크립트로 계산하지 않습니다. 활성 트랜스크립트 상태는 SQLite 전용입니다.
  레거시 JSONL 파일은 마이그레이션/고아 정리 입력으로 보고됩니다.
- Doctor는 더 이상 `agents/<agent>/sessions/`를 필수 런타임
  상태로 취급하지 않습니다. 해당 디렉터리가 이미 있을 때만 레거시 가져오기 또는
  고아 정리 입력으로 스캔합니다.
- Gateway `sessions.resolve`, 세션 패치/재설정/압축 경로, 하위 에이전트
  생성, 빠른 중단, ACP 메타데이터, Heartbeat 격리 세션, TUI
  패치는 더 이상 정상 런타임 작업의 부수 효과로 레거시 세션 키를
  마이그레이션하거나 가지치기하지 않습니다.
- CLI 명령 세션 해석은 이제 `storePath` 대신 소유 `agentId`를 반환하며,
  정상적인 `--to` 또는 `--session-id` 해석 중에 레거시 메인 세션 행을
  더 이상 복사하지 않습니다. 레거시 메인 행 정규화는 Doctor 전용입니다.
- 런타임 하위 에이전트 깊이 해석은 더 이상 `sessions.json` 또는 JSON5
  세션 저장소를 읽지 않습니다. 에이전트 ID로 SQLite `session_entries`를 읽으며,
  레거시 깊이/세션 메타데이터는 Doctor 가져오기 경로를 통해서만 들어올 수 있습니다.
- 인증 프로필 세션 재정의는 파일 형태의 세션 저장소 런타임을 지연 로드하는 대신
  직접 `{agentId, sessionKey}` 행 업서트를 통해 유지됩니다.
- 자동 응답 상세 게이팅과 세션 업데이트 헬퍼는 이제 세션 ID로 SQLite
  세션 행을 읽고 업서트하며, 영속화된 행 상태를 건드리기 전에 더 이상
  레거시 저장소 경로를 요구하지 않습니다.
- 명령 실행 세션 메타데이터 헬퍼는 이제 항목 지향 이름과 모듈
  경로를 사용합니다. 기존 `session-store` 명령 헬퍼 표면은 제거되었습니다.
- 부트스트랩 헤더 시드와 수동 Compaction 경계 강화는 이제 SQLite 트랜스크립트
  행을 직접 변경합니다. 런타임 호출자는 쓰기 가능한 `.jsonl` 경로가 아니라
  세션 ID를 전달합니다.
- 조용한 세션 회전 리플레이는 SQLite 트랜스크립트 행에서 `{agentId, sessionId}`로
  최근 사용자/어시스턴트 턴을 복사합니다. 더 이상 소스 또는 대상
  트랜스크립트 로케이터를 받지 않습니다.
- 새 런타임 세션 행은 더 이상 트랜스크립트 로케이터를 저장하지 않습니다. 호출자는
  `{agentId, sessionId}`를 직접 사용합니다. 내보내기/디버그 명령은 행을 구체화할 때
  출력 파일 이름을 선택할 수 있습니다.
- 새 영속 트랜스크립트 세션을 시작하면 이제 항상 범위로 SQLite 행을 엽니다.
  세션 관리자는 더 이상 이전 파일 시대 트랜스크립트 경로나 로케이터를 새 세션의
  ID로 재사용하지 않습니다.
- 영속 트랜스크립트 세션은 명시적인
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API를 사용합니다. 기존
  정적 `SessionManager.create/openForSession/list/forkFromSession` 퍼사드는
  제거되어 테스트와 런타임 코드가 파일 시대 세션 탐색을 우발적으로
  다시 만들 수 없습니다.
- Plugin 런타임은 더 이상 `api.runtime.agent.session.resolveTranscriptLocatorPath`를 노출하지 않습니다.
  Plugin 코드는 SQLite 행 헬퍼와 범위 값을 사용합니다.
- 공개 `session-store-runtime` SDK 표면은 이제 세션 행 및 트랜스크립트 행
  헬퍼만 내보냅니다. 집중된 SQLite 스키마/경로/트랜잭션 헬퍼는
  `sqlite-runtime`에 있으며, 원시 열기/닫기/재설정 헬퍼는 퍼스트파티 테스트용
  로컬 전용으로 남습니다.
- 레거시 `.jsonl` 궤적/체크포인트 파일 이름 분류기는 이제
  Doctor 레거시 세션 파일 모듈에 있습니다. 코어 세션 유효성 검사는 더 이상
  정상 SQLite 세션 ID를 결정하기 위해 파일 아티팩트 헬퍼를 가져오지 않습니다.
- Active Memory 차단 하위 에이전트 실행은 Plugin 상태 아래에 임시 또는 영속
  `session.jsonl` 파일을 만드는 대신 SQLite 트랜스크립트 행을 사용합니다. 기존
  `transcriptDir` 옵션은 제거되었습니다.
- 일회성 슬러그 생성과 Crestodian 플래너 실행은 임시 `session.jsonl`
  파일을 만드는 대신 SQLite 트랜스크립트 행을 사용합니다.
- `llm-task` 헬퍼 실행과 숨겨진 커밋먼트 추출도 SQLite 트랜스크립트 행을 사용하므로,
  이러한 모델 전용 헬퍼 세션은 더 이상 임시 JSON/JSONL 트랜스크립트 파일을
  만들지 않습니다.
- `TranscriptSessionManager`는 이제 열린 SQLite 트랜스크립트 범위일 뿐입니다.
  런타임 코드는 `openTranscriptSessionManagerForSession({agentId,
sessionId})`로 이를 엽니다. 생성, 분기, 계속, 목록, 포크 흐름은
  정적 관리자 퍼사드가 아니라 각 소유 SQLite 행 헬퍼에 있습니다.
  Doctor/가져오기/디버그 코드는 런타임 세션 관리자 밖에서 명시적인 레거시 소스 파일을
  처리합니다.
- 오래된 `SessionManager.newSession()` 및
  `SessionManager.createBranchedSession()` 퍼사드 메서드는 제거되었습니다. 새
  세션과 트랜스크립트 하위 항목은 이미 열린 관리자를 다른 영속
  세션으로 변경하는 대신 각 소유 SQLite 워크플로에서 생성됩니다.
- 부모 트랜스크립트 포크 결정과 포크 생성은 더 이상
  `storePath` 또는 `sessionsDir`를 받지 않습니다. 보존된 파일시스템 경로 메타데이터 대신
  `{agentId, sessionId}` SQLite 트랜스크립트 범위를 사용합니다.
- 메모리 호스트는 더 이상 no-op 세션 디렉터리 트랜스크립트
  분류 헬퍼를 내보내지 않습니다. 트랜스크립트 필터링은 이제 항목 생성 중
  SQLite 행 메타데이터에서 파생됩니다.
- 메모리 호스트와 QMD 세션 내보내기 테스트는 SQLite 트랜스크립트 범위를 사용합니다. 기존
  `agents/<agentId>/sessions/*.jsonl` 경로는 테스트가 의도적으로 Doctor/가져오기/내보내기
  호환성을 증명하는 곳에서만 계속 다룹니다.
- QA 랩 원시 세션 검사는 이제 Gateway를 통해 `sessions.list`를 사용합니다.
  `agents/qa/sessions/sessions.json`을 읽는 대신 사용합니다. MSteams 피드백은 JSONL 경로를 만들지 않고 SQLite 기록에 직접 추가됩니다.
- 공유 인바운드 채널 턴은 이제 기존 `storePath` 대신 `{agentId, sessionKey}`를 전달합니다. LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal, iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo, Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon, Twitch, QQBot 기록 경로는 이제 updated-at 메타데이터를 읽고 SQLite ID를 통해 인바운드 세션 행을 기록합니다.
- 기록 위치자 영속성은 활성 세션 행에서 제거되었습니다. `resolveSessionTranscriptTarget`은 `agentId`, `sessionId` 및 선택적 주제 메타데이터를 반환합니다. doctor만 기존 기록 파일 이름을 가져오는 코드입니다.
- 런타임 기록 헤더는 SQLite 버전 `1`에서 시작합니다. 이전 JSONL V1/V2/V3 형태 업그레이드는 doctor 가져오기에만 있으며, 행을 저장하기 전에 가져온 헤더를 현재 SQLite 기록 버전으로 정규화합니다.
- 데이터베이스 우선 가드는 이제 `SessionManager.listAll` 및 `SessionManager.forkFromSession`을 금지합니다. 세션 목록과 fork/restore 워크플로는 행/범위 지정 SQLite API에 유지되어야 합니다.
- 가드는 또한 doctor/import 코드 외부에서 기존 기록 JSONL 구문 분석/활성 브랜치 복구 헬퍼 이름을 금지하므로, 런타임은 두 번째 기존 기록 마이그레이션 경로를 늘릴 수 없습니다.
- 임베디드 PI 실행은 들어오는 기록 핸들을 거부합니다. 워커 시작 전과 시도가 기록 상태에 접근하기 전에 SQLite `{agentId, sessionId}` ID를 사용합니다. 오래된 `/tmp/*.jsonl` 입력은 런타임 쓰기 대상을 선택할 수 없습니다.
- 캐시 추적, Anthropic 페이로드, 원시 스트림, 진단 타임라인 레코드는 이제 형식화된 SQLite `diagnostic_events` 행에 씁니다. Gateway 안정성 번들은 이제 형식화된 SQLite `diagnostic_stability_bundles` 행에 씁니다. 이전 `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`, `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`, `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL 재정의 경로는 제거되었고, 일반 안정성 캡처는 더 이상 `logs/stability/*.json` 파일을 쓰지 않습니다.
- Cron 영속성은 이제 각 저장 시 전체 작업 테이블을 삭제/재삽입하는 대신 SQLite `cron_jobs` 행을 조정합니다. Plugin 대상 writeback은 일치하는 cron 행을 직접 업데이트하고 동일한 상태 데이터베이스 트랜잭션에서 런타임 cron 상태를 유지합니다.
- Cron 런타임 호출자는 이제 안정적인 SQLite cron 저장소 키를 사용합니다. 기존 `cron.store` 경로는 doctor 가져오기 입력으로만 사용됩니다. 프로덕션 gateway, 작업 유지관리, 상태, 실행 로그, Telegram 대상 writeback 경로는 `resolveCronStoreKey`를 사용하며 더 이상 키를 경로 정규화하지 않습니다. Cron 상태는 이제 이전 파일 형태의 `storePath` 필드 대신 `storeKey`를 보고합니다.
- Cron 런타임 로드 및 스케줄링은 더 이상 `jobId`, `schedule.cron`, 숫자 `atMs`, 문자열 불리언, 누락된 `sessionTarget` 같은 기존 영속 작업 형태를 정규화하지 않습니다. doctor 기존 가져오기가 행을 SQLite에 삽입하기 전에 해당 복구를 담당합니다.
- ACP spawn은 더 이상 기록 JSONL 파일 경로를 해석하거나 영속하지 않습니다. Spawn 및 thread-bind 설정은 SQLite 세션 행을 직접 영속하고 세션 ID를 유지되는 기록 ID로 둡니다.
- ACP 세션 메타데이터 API는 이제 `agentId`별로 SQLite 행을 읽기/나열/upsert하며, 더 이상 ACP 세션 항목 계약의 일부로 `storePath`를 노출하지 않습니다.
- 세션 사용량 집계와 Gateway 사용량 집계는 이제 `{agentId, sessionId}`만으로 기록을 해석합니다. 비용/사용량 캐시와 발견된 세션 요약은 더 이상 기록 위치자 문자열을 합성하거나 반환하지 않습니다.
- Gateway 채팅 추가, 중단된 partial 영속성, `/sessions.send`, webchat 미디어 기록 쓰기는 SQLite 기록 범위를 통해 직접 추가됩니다. Gateway 기록 주입 헬퍼는 더 이상 `transcriptLocator` 매개변수를 받지 않습니다.
- SQLite 기록 검색은 이제 기록 범위와 통계만 나열합니다: `{agentId, sessionId, updatedAt, eventCount}`. 사라진 `listSqliteSessionTranscriptLocators` 호환성 헬퍼와 행별 `locator` 필드는 제거되었습니다.
- 기록 복구 런타임은 이제 `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`만 노출합니다. 이전 위치자 기반 복구 헬퍼는 삭제되었습니다. doctor/debug 코드는 명시적 소스 파일 경로를 읽고 위치자 문자열을 절대 마이그레이션하지 않습니다.
- ACP replay ledger 런타임은 이제 `acp/event-ledger.json` 대신 공유 SQLite 상태 데이터베이스에 세션별 replay 행을 저장합니다. doctor는 기존 파일을 가져오고 제거합니다.
- Gateway 기록 리더 헬퍼는 이제 이전 `session-utils.fs` 모듈 이름 대신 `src/gateway/session-transcript-readers.ts`에 있습니다. fallback 재시도 히스토리 검사는 이전 파일 헬퍼 표면 대신 SQLite 기록 콘텐츠에 맞춰 이름이 지정되었습니다.
- Gateway injected-chat 및 compaction 헬퍼는 이제 값을 기록 경로나 소스 파일로 명명하는 대신 내부 헬퍼 API를 통해 SQLite 기록 범위를 전달합니다.
- Bootstrap continuation 감지는 이제 `hasCompletedBootstrapTranscriptTurn`을 통해 SQLite 기록 행을 확인합니다. 더 이상 파일 형태의 헬퍼 이름을 노출하지 않습니다.
- Embedded-runner 테스트는 이제 SQLite 기록 ID를 사용하며, 새 기록 관리자를 열려면 항상 명시적인 `sessionId`가 필요합니다.
- 메모리 인덱싱 헬퍼는 이제 처음부터 끝까지 SQLite 기록 용어를 사용합니다. host는 `listSessionTranscriptScopesForAgent` 및 `sessionTranscriptKeyForScope`를 내보내고, 대상 동기화 큐는 `sessionTranscripts`를 사용하며, 공개 세션 검색 hit는 불투명한 `transcript:<agent>:<session>` 경로를 노출하고, 내부 DB 소스 키는 가짜 파일 경로 대신 `source_kind='sessions'` 아래의 `session:<session>`입니다.
- 일반 Plugin SDK 영속 dedupe 헬퍼는 더 이상 파일 형태 옵션을 노출하지 않습니다. 호출자는 SQLite 범위 키를 제공하고, 내구성 있는 dedupe 행은 공유 Plugin 상태에 저장됩니다.
- Microsoft Teams SSO 토큰은 잠긴 JSON 파일에서 SQLite Plugin 상태로 이동했습니다. Doctor는 `msteams-sso-tokens.json`을 가져오고, 페이로드에서 표준 SSO 토큰 키를 재구성한 뒤 소스 파일을 제거합니다. 위임된 OAuth 토큰은 기존의 비공개 자격 증명 파일 경계에 유지됩니다.
- Matrix 동기화 캐시 상태는 `bot-storage.json`에서 SQLite Plugin 상태로 이동했습니다. Doctor는 기존 원시 또는 래핑된 동기화 페이로드를 가져오고 소스 파일을 제거합니다. 활성 Matrix 및 QA Matrix 클라이언트는 가짜 `sync-store.json` 또는 `bot-storage.json` 경로가 아니라 SQLite 동기화 저장소 루트 디렉터리를 전달합니다.
- Matrix 기존 crypto 마이그레이션 상태는 `legacy-crypto-migration.json`에서 SQLite Plugin 상태로 이동했습니다. Doctor는 이전 상태 파일을 가져옵니다. Matrix SDK IndexedDB 스냅샷은 `crypto-idb-snapshot.json`에서 SQLite Plugin blob으로 이동했습니다. Matrix 복구 키와 자격 증명은 SQLite Plugin 상태 행입니다. 이전 JSON 파일은 doctor 마이그레이션 입력으로만 사용됩니다.
- Memory Wiki 활동 로그는 이제 `.openclaw-wiki/log.jsonl` 대신 SQLite Plugin 상태를 사용합니다. Memory Wiki 마이그레이션 공급자는 이전 JSONL 로그를 가져옵니다. 위키 markdown 및 사용자 vault 콘텐츠는 작업공간 콘텐츠로서 파일 기반으로 유지됩니다.
- Memory Wiki는 더 이상 `.openclaw-wiki/state.json` 또는 사용되지 않는 `.openclaw-wiki/locks` 디렉터리를 만들지 않습니다. 마이그레이션 공급자는 이전 vault에 해당 은퇴한 Plugin 메타데이터 파일이 아직 있으면 제거합니다.
- Crestodian 감사 항목은 이제 `audit/crestodian.jsonl` 대신 core SQLite Plugin 상태를 사용합니다. Doctor는 기존 JSONL 감사 로그를 가져오고 성공적으로 가져온 후 제거합니다.
- Config 쓰기/관찰 감사 항목은 이제 `logs/config-audit.jsonl` 대신 core SQLite Plugin 상태를 사용합니다. Doctor는 기존 JSONL 감사 로그를 가져오고 성공적으로 가져온 후 제거합니다.
- macOS companion은 더 이상 `openclaw.json`을 편집하는 동안 app-local `logs/config-audit.jsonl` 또는 `logs/config-health.json` sidecar를 쓰지 않습니다. config 파일은 파일 기반으로 유지되고, 복구 스냅샷은 config 파일 옆에 유지되며, 내구성 있는 config 감사/health 상태는 Gateway SQLite 저장소에 속합니다.
- Crestodian rescue pending approval은 이제 `crestodian/rescue-pending/*.json` 대신 core SQLite Plugin 상태를 사용합니다. Doctor는 기존 pending approval 파일을 가져오고 성공적으로 가져온 후 제거합니다.
- Phone Control 임시 arm 상태는 이제 `plugins/phone-control/armed.json` 대신 SQLite Plugin 상태를 사용합니다. Doctor는 기존 armed-state 파일을 `phone-control/arm-state` 네임스페이스로 가져오고 파일을 제거합니다.
- Doctor는 더 이상 JSONL 기록을 제자리에서 복구하거나 백업 JSONL 파일을 만들지 않습니다. 활성 브랜치를 SQLite로 가져오고 기존 소스를 제거합니다.
- Session-memory hook 기록 조회는 `{agentId, sessionId}` 범위 전용 SQLite 읽기를 사용합니다. 해당 헬퍼는 더 이상 기록 위치자, 기존 파일 읽기 또는 파일 재작성 옵션을 받거나 파생하지 않습니다.
- Codex app-server 대화 바인딩은 이제 OpenClaw 세션 키 또는 명시적 `{agentId, sessionId}` 범위로 SQLite Plugin 상태의 키를 지정합니다. 기록 경로 fallback 바인딩을 보존해서는 안 됩니다.
- Codex app-server mirrored-history 읽기는 SQLite 기록 범위만 사용합니다. 기록 파일 경로에서 ID를 복구해서는 안 됩니다.
- 역할 순서 지정 및 Compaction reset 경로는 더 이상 이전 기록 파일을 unlink하지 않습니다. reset은 SQLite 세션 행과 기록 ID만 rotate합니다.
- Gateway reset 및 checkpoint 응답은 깔끔한 세션 행과 세션 ID를 반환합니다. 더 이상 클라이언트를 위해 SQLite 기록 위치자를 합성하지 않습니다.
- Memory-core dreaming은 더 이상 누락된 JSONL 파일을 probing하여 세션 행을 prune하지 않습니다. Subagent 정리는 파일시스템 존재 확인 대신 세션 런타임 API를 통합니다. 기록 ingestion 테스트는 `agents/<id>/sessions` fixture 또는 위치자 placeholder를 만들지 않고 SQLite 행을 직접 seed합니다.
- Memory 기록 인덱싱은 citation/read 헬퍼를 위한 가상 검색 hit 경로로 `transcript:<agentId>:<sessionId>`를 노출할 수 있습니다. 내구성 있는 인덱스 소스는 관계형(`source_kind='sessions'`, `source_key='session:<sessionId>'`, `session_id=<sessionId>`)이므로, 해당 값은 런타임 기록 위치자도 파일시스템 경로도 아니며 세션 런타임 API에 다시 전달되어서는 절대 안 됩니다.
- Gateway doctor 메모리 상태는 `memory/.dreams/*.json` 대신 SQLite Plugin 상태 행에서 단기 recall 및 phase-signal count를 읽습니다. CLI 및 doctor 출력은 이제 해당 저장소를 경로가 아니라 SQLite 저장소로 표시합니다.
- Memory-core 런타임, CLI 상태, Gateway doctor 메서드, Plugin SDK facade는 더 이상 기존 `.dreams/session-corpus` 파일을 감사하거나 archive하지 않습니다. 해당 파일은 마이그레이션 입력으로만 사용됩니다. doctor는 이를 SQLite로 가져오고 검증 후 소스를 삭제합니다. 활성 세션 ingestion 증거 행은 이제 가상 SQLite 경로 `memory/session-ingestion/<day>.txt`를 사용합니다. 런타임은 `.dreams/session-corpus`에서 상태를 쓰거나 파생하지 않습니다.
- Memory-core 공개 artifact는 SQLite host 이벤트를 가상 JSON artifact `memory/events/memory-host-events.json`로 노출합니다. 더 이상 기존 `.dreams/events.jsonl` 소스 경로를 재사용하지 않습니다.
- Sandbox container/browser registry는 이제 형식화된 세션, 이미지, timestamp, backend/config, browser port 열이 있는 공유 `sandbox_registry_entries` SQLite 테이블을 사용합니다. Doctor는 기존 단일 파일 및 sharded JSON registry 파일을 가져오고 성공한 소스를 제거합니다. 런타임 읽기는 형식화된 행 열을 source of truth로 사용합니다. `entry_json`은 replay/debug 사본일 뿐입니다.
- Commitments는 이제 전체 저장소 JSON blob 대신 형식화된 공유 `commitments` 테이블을 사용합니다. Snapshot 저장은 commitment ID별로 upsert하고, 테이블을 비우고 재삽입하는 대신 누락된 행만 삭제합니다. 런타임은 형식화된 scope, delivery-window, status, attempt, text 열에서 commitments를 로드합니다. `record_json`은 replay/debug 사본일 뿐입니다. Doctor는 기존 `commitments.json`을 가져오고 성공적으로 가져온 후 제거합니다.
- Cron 작업 정의, schedule 상태, 실행 history에는 더 이상 런타임 JSON writer 또는 reader가 없습니다. 런타임은 형식화된 schedule이 있는 `cron_jobs` 행을 사용합니다.
  payload, delivery, failure-alert, session, status, runtime-state 열과 status, diagnostics summary, delivery status/error, session/run, model, token totals용 형식화된
  `cron_run_logs` metadata. `job_json`은 replay/debug 복사본일 뿐이고, `state_json`은 아직 hot query field가 없는 중첩
  runtime diagnostics를 보관하며, runtime은 형식화된 열에서 hot state field를 다시 hydrate합니다. 진단 기능은
  기존 `jobs.json`, `jobs-state.json`, `runs/*.jsonl` 파일을 가져오고
  가져온 원본을 제거합니다. Plugin 대상 writeback은 전체 cron store를 로드하고 교체하는 대신 일치하는 `cron_jobs`
  행을 업데이트합니다.
- Gateway 시작은 runtime projection의 기존 `notify: true` marker를 무시합니다. 진단 기능은
  `cron.webhook`이 유효하면 이를 명시적 SQLite delivery로 변환하고,
  설정되지 않았으면 비활성 marker를 제거하며, 구성된 webhook이 유효하지 않으면
  경고와 함께 보존합니다.
- Outbound 및 session delivery queue는 이제 queue status, entry kind,
  session key, channel, target, account id, retry count, last attempt/error,
  recovery state, platform-send marker를 shared
  `delivery_queue_entries` table의 형식화된 열로 저장합니다. Runtime recovery는
  형식화된 열에서 이러한 hot field를 읽고, retry/recovery mutation은 replay JSON을 다시 쓰지 않고
  해당 열을 직접 업데이트합니다. 전체 JSON payload는 message body와 기타 cold replay data를 위한
  replay/debug blob으로만 남습니다.
- Managed outgoing image record는 이제 media byte는 계속
  `media_blobs`에 저장하면서 형식화된 shared
  `managed_outgoing_image_records` 행을 사용합니다. JSON record는 replay/debug 복사본으로만 남습니다.
- Discord model-picker preference, command-deploy hash, thread binding은
  이제 shared SQLite Plugin state를 사용합니다. 기존 JSON import plan은
  core migration code가 아니라 Discord Plugin setup/doctor migration surface에 있습니다.
- Plugin legacy import detector는
  `doctor-legacy-state.ts` 또는 `doctor-state-imports.ts` 같은 doctor 이름의 module을 사용합니다. 일반 channel runtime
  module은 legacy JSON detector를 import하면 안 됩니다.
- BlueBubbles catchup cursor와 inbound dedupe marker는 이제 shared SQLite
  Plugin state를 사용합니다. 기존 JSON import plan은 core migration code가 아니라 BlueBubbles Plugin
  setup/doctor migration surface에 있습니다.
- Telegram update offset, sticker cache row, sent-message cache row,
  topic-name cache row, thread binding은 이제 shared SQLite Plugin
  state를 사용합니다. 기존 JSON import plan은 core migration code가 아니라 Telegram Plugin
  setup/doctor migration surface에 있습니다.
- iMessage catchup cursor, reply short-id mapping, sent-echo dedupe row는
  이제 shared SQLite Plugin state를 사용합니다. 이전 `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, `imessage/sent-echoes.jsonl` 파일은
  doctor 입력으로만 사용됩니다.
- Feishu message dedupe row는 이제
  `feishu/dedup/*.json` 파일 대신 shared SQLite Plugin state를 사용합니다. 해당 legacy JSON import plan은 core migration code가 아니라 Feishu
  Plugin setup/doctor migration surface에 있습니다.
- Microsoft Teams conversation, poll, pending upload buffer, feedback
  learning은 이제 shared SQLite Plugin state/blob table을 사용합니다. Pending upload
  path는 `plugin_blob_entries`를 사용하므로 media buffer가 base64 JSON 대신 SQLite BLOB으로 저장됩니다.
  Runtime helper 이름은 이제 `*-fs` file-store 이름이 아니라 SQLite/state 이름을 사용하며,
  이전 `storePath` shim은 이러한 store에서 제거되었습니다. 해당 legacy JSON import plan은 Microsoft Teams
  Plugin setup/doctor migration surface에 있습니다.
- Zalo hosted outbound media는 이제 `openclaw-zalo-outbound-media` JSON/bin temp sidecar 대신 shared SQLite `plugin_blob_entries`를 사용합니다.
- Diffs viewer HTML 및 metadata는 이제 `meta.json`/`viewer.html` temp file 대신 shared SQLite `plugin_blob_entries`를 사용합니다. Rendered PNG/PDF output은 channel delivery가 여전히 file path를 필요로 하므로
  temp materialization으로 유지됩니다.
- Canvas managed document는 이제 기본 `state/canvas/documents` directory 대신 shared SQLite `plugin_blob_entries`를 사용합니다. Canvas host는 해당
  blob을 직접 제공합니다. local file은 명시적 `host.root`
  operator content 또는 downstream media reader가 path를 요구할 때의 임시 materialization에만 생성됩니다.
- File Transfer audit decision은 이제 무제한 `audit/file-transfer.jsonl` runtime log 대신 shared SQLite `plugin_state_entries`를 사용합니다. 진단 기능은
  legacy JSONL audit file을 Plugin state로 가져오고 clean import 후 원본을 제거합니다.
- ACPX process lease와 gateway instance identity는 이제 shared SQLite Plugin
  state를 사용합니다. 진단 기능은 legacy `gateway-instance-id` file을 Plugin state로 가져오고
  원본을 제거합니다.
- ACPX generated wrapper script와 isolated Codex home은 OpenClaw temp root 아래의 임시
  materialization이지 durable OpenClaw state가 아닙니다. Durable ACPX runtime record는 SQLite lease와 gateway-instance row입니다.
  이전 ACPX `stateDir` config surface는 더 이상 runtime state가
  거기에 기록되지 않으므로 제거되었습니다.
- Gateway media attachment는 이제 shared `media_blobs` SQLite table을
  canonical byte store로 사용합니다. Channel 및 sandbox compatibility surface에 반환되는 local path는
  database row의 temp materialization이지 durable media store가 아닙니다. Runtime media allowlist는 더 이상 legacy
  `$OPENCLAW_STATE_DIR/media` 또는 config-dir `media` root를 포함하지 않습니다. 해당 directory는
  doctor import source로만 사용됩니다.
- Shell completion은 더 이상 `$OPENCLAW_STATE_DIR/completions/*` cache
  file을 쓰지 않습니다. Install, doctor, update, release smoke path는 durable completion cache
  file 대신 generated completion output 또는 profile sourcing을 사용합니다.
- Gateway skill-upload staging은 이제 shared `skill_uploads` row를 사용합니다. Upload
  metadata, idempotency key, archive byte는 SQLite에 저장됩니다. installer는 install이
  실행되는 동안에만 temporary materialized archive path를 받습니다.
- Subagent inline attachment는 더 이상 workspace
  `.openclaw/attachments/*` 아래에 materialize되지 않습니다. spawn path는 SQLite VFS seed entry를 준비하고,
  inline run은 해당 entry를 per-agent runtime scratch namespace에 seed하며,
  disk-backed tool은 attachment path를 위해 해당 SQLite scratch를 overlay합니다. 이전 subagent-run attachment-dir registry column과 cleanup hook은 제거되었습니다.
- CLI image hydration은 더 이상 stable `openclaw-cli-images` cache
  file을 유지하지 않습니다. External CLI backend는 여전히 file path를 받지만, 해당 path는
  cleanup이 포함된 per-run temp materialization입니다.
- Cache-trace diagnostics, Anthropic payload diagnostics, raw model stream
  diagnostics, diagnostics timeline event, Gateway stability bundle은 이제
  `logs/*.jsonl` 또는 `logs/stability/*.json` file 대신 SQLite row를 씁니다.
  Runtime path override flag와 env var는 제거되었습니다. export/debug
  command는 database row에서 명시적으로 file을 materialize할 수 있습니다.
- macOS companion은 더 이상 rolling `diagnostics.jsonl` writer를 갖지 않습니다. App
  log는 unified logging으로 가고, durable Gateway diagnostics는 SQLite 기반으로 유지됩니다.
- macOS port-guardian record list는 이제 Application Support JSON file
  또는 opaque singleton blob 대신 형식화된 shared SQLite
  `macos_port_guardian_records` row를 사용합니다.
- Gateway singleton lock은 이제 temp-dir lock file 대신
  `gateway_locks` scope 아래의 형식화된 shared SQLite `state_leases` row를 사용합니다. Fly 및 OAuth
  troubleshooting docs는 이제 오래된 file-lock cleanup 대신 SQLite lease/auth refresh lock을 가리킵니다.
- Gateway restart sentinel state는 이제 `restart-sentinel.json` 대신 형식화된 shared SQLite
  `gateway_restart_sentinel` row를 사용합니다. runtime은
  sentinel kind, status, routing, message, continuation, stats를
  형식화된 열에서 읽습니다. `payload_json`은 replay/debug 복사본일 뿐입니다. Runtime code는
  SQLite row를 직접 clear하며 더 이상 file cleanup plumbing을 갖지 않습니다.
- Gateway restart intent 및 supervisor handoff state는 이제
  `gateway-restart-intent.json` 및
  `gateway-supervisor-restart-handoff.json` sidecar 대신 형식화된 shared
  SQLite `gateway_restart_intent` 및 `gateway_restart_handoff` row를 사용합니다.
- Gateway singleton coordination은 이제 `gateway.<hash>.lock` file을 쓰는 대신
  `gateway_locks` 아래의 형식화된 `state_leases` row를 사용합니다. Lease row는
  lock owner, expiry, Heartbeat, debug payload를 소유하며, SQLite는
  atomic acquire/release boundary를 소유합니다. 폐기된 file-lock directory option은
  제거되었습니다. test는 SQLite row identity를 직접 사용합니다.
- `cron/runs/*.jsonl`
  file을 scan하던 이전의 참조되지 않는 cron usage-report helper는 삭제되었습니다. Cron run history report는 형식화된
  `cron_run_logs` SQLite row를 읽어야 합니다.
- Main-session restart recovery는 이제 `agents/*/sessions`
  directory를 scan하는 대신 SQLite `agent_databases` registry를 통해 candidate agent를 발견합니다.
- Gemini session-corruption recovery는 이제 SQLite session row만 삭제합니다.
  더 이상 legacy `storePath` gate가 필요 없고, derived
  transcript JSONL path를 unlink하려고 시도하지 않습니다.
- Path override handling은 이제 literal `undefined`/`null` environment
  value를 unset으로 처리하여 test 또는 shell handoff 중 실수로 repo-root `undefined/state/*.sqlite`
  database가 생성되는 것을 방지합니다.
- Config health fingerprint는 이제 `logs/config-health.json` 대신 형식화된 shared SQLite `config_health_entries`
  row를 사용하여 normal config file을 유일한 non-credential configuration document로 유지합니다. macOS companion은 process-local health state만 유지하며
  이전 JSON sidecar를 다시 만들지 않습니다.
- Auth profile runtime은 더 이상 credential JSON file을 가져오거나 쓰지 않습니다.
  canonical credential store는 SQLite입니다. `auth-profiles.json`, per-agent
  `auth.json`, shared `credentials/oauth.json`은 import 후 제거되는 doctor migration input입니다.
- Auth profile save/state test는 이제 형식화된 SQLite auth table을 직접 assert하며,
  legacy auth-profile filename은 doctor migration input에만 사용합니다.
- `openclaw secrets apply`는 config file, env file, SQLite
  auth-profile store만 scrub합니다. 더 이상 폐기된 per-agent `auth.json`을 edit하는 compatibility logic을 갖지 않습니다.
  doctor가 해당 file을 import하고 delete하는 책임을 가집니다.
- Hermes secret migration plan 및 apply는 가져온 API-key profile을 SQLite auth-profile store로 직접 가져옵니다.
  더 이상 중간 target으로 `auth-profiles.json`을 쓰거나 verify하지 않습니다.
- User-facing auth docs는 이제
  사용자에게 `auth-profiles.json`을 inspect하거나 copy하라고 안내하는 대신
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>`를 설명합니다. legacy OAuth/auth JSON
  name은 doctor-import input으로만 문서화되어 있습니다.
- Core state-path helper는 더 이상 폐기된 `credentials/oauth.json`
  file을 노출하지 않습니다. legacy filename은 doctor auth import path에만 local로 남습니다.
- Install, security, onboarding, model-auth, SecretRef docs는 이제
  per-agent auth-profile JSON file 대신 SQLite auth-profile row와 whole-state backup/migration을 설명합니다.
- PI model discovery는 이제 canonical credential을 in-memory
  `pi-coding-agent` auth storage로 전달합니다. Discovery 중 더 이상
  per-agent `auth.json`을 create, scrub, write하지 않습니다.
- Voice Wake trigger 및 routing setting은 이제 `settings/voicewake.json`, `settings/voicewake-routing.json` 또는
  opaque generic row 대신 형식화된 shared SQLite table을 사용합니다. doctor는 legacy JSON file을 가져오고 성공적인 migration 후 제거합니다.
- Update-check state는 이제 `update-check.json` 또는 opaque generic blob 대신
  형식화된 shared `update_check_state` row를 사용합니다. doctor는
  legacy JSON file을 가져오고 성공적인 migration 후 제거합니다.
- Config health state는 이제 `logs/config-health.json` 또는 opaque generic blob 대신
  형식화된 shared `config_health_entries` row를 사용합니다. doctor는
  legacy JSON file을 가져오고 성공적인 migration 후 제거합니다.
- Plugin conversation binding approval은 이제 opaque shared SQLite state 또는 대신 형식화된
  `plugin_binding_approvals` row를 사용합니다.
  `plugin-binding-approvals.json`; 레거시 파일은 doctor 마이그레이션 입력입니다.
- 일반 현재 대화 바인딩은 이제
  `bindings/current-conversations.json`을 다시 쓰는 대신 형식이 지정된
  `current_conversation_bindings` 행을 저장합니다. doctor는 레거시 JSON 파일을 가져오고
  마이그레이션이 성공하면 제거합니다.
- Memory Wiki 가져온 소스 동기화 원장은 이제 `.openclaw-wiki/source-sync.json`을
  다시 쓰는 대신 볼트/소스 키마다 하나의 SQLite Plugin 상태 행을 저장합니다.
  마이그레이션 제공자는 레거시 JSON 원장을 가져오고 제거합니다.
- Memory Wiki ChatGPT 가져오기 실행 레코드는 이제
  `.openclaw-wiki/import-runs/*.json`에 쓰는 대신 볼트/실행 ID마다 하나의
  SQLite Plugin 상태 행을 저장합니다. 롤백 스냅샷은 가져오기 실행 스냅샷 보관이
  blob 저장소로 이동될 때까지 명시적인 볼트 파일로 유지됩니다.
- Memory Wiki 컴파일된 다이제스트는 이제
  `.openclaw-wiki/cache/agent-digest.json` 및
  `.openclaw-wiki/cache/claims.jsonl`에 쓰는 대신 SQLite Plugin blob 행을 저장합니다.
  마이그레이션 제공자는 이전 캐시 파일을 가져오고 캐시 디렉터리가 비면 제거합니다.
- ClawHub Skills 설치 추적은 이제 런타임에 `.clawhub/lock.json` 및
  `.clawhub/origin.json` 사이드카를 쓰거나 읽는 대신 워크스페이스/Skills마다 하나의
  SQLite Plugin 상태 행을 저장합니다. 런타임 코드는 파일 형태의 lockfile/origin
  추상화 대신 추적된 설치 상태 객체를 사용합니다. Doctor는 구성된 에이전트
  워크스페이스에서 레거시 사이드카를 가져오고 깔끔하게 가져온 뒤 제거합니다.
- 설치된 Plugin 인덱스는 이제 `plugins/installs.json` 대신 형식이 지정된 공유 SQLite
  `installed_plugin_index` 싱글턴 행을 읽고 씁니다. 레거시 JSON 파일은 doctor
  마이그레이션 입력으로만 사용되며 가져온 뒤 제거됩니다.
- 레거시 `plugins/installs.json` 경로 헬퍼는 이제 doctor 레거시 코드에 있습니다.
  런타임 Plugin 인덱스 모듈은 JSON 파일 경로가 아니라 SQLite 기반 지속성 옵션만
  노출합니다.
- Gateway 재시작 센티널, 재시작 의도, supervisor handoff 상태는 이제 일반 불투명
  blob 대신 형식이 지정된 공유 SQLite 행(`gateway_restart_sentinel`,
  `gateway_restart_intent`, `gateway_restart_handoff`)을 사용합니다. 런타임 재시작 코드에는
  파일 형태의 sentinel/intent/handoff 계약이 없습니다.
- Matrix 동기화 캐시, 저장소 메타데이터, 스레드 바인딩, 인바운드 중복 제거 마커,
  시작 검증 쿨다운 상태, SDK IndexedDB 암호화 스냅샷, 자격 증명, 복구 키는 이제
  공유 SQLite Plugin 상태/blob 테이블을 사용합니다. 런타임 경로 구조체는 더 이상
  `storage-meta.json` 메타데이터 경로를 노출하지 않습니다. 해당 파일 이름은 레거시
  마이그레이션 입력일 뿐입니다. 레거시 JSON 가져오기 계획은 Matrix Plugin
  설정/doctor 마이그레이션 표면에 있습니다.
- Matrix 시작은 더 이상 레거시 Matrix 파일 상태를 스캔하거나 보고하거나 완료하지
  않습니다. Matrix 파일 감지, 레거시 암호화 스냅샷 생성, 방 키 복원 마이그레이션
  상태, 가져오기, 소스 제거는 모두 doctor가 소유합니다.
- Matrix 런타임 마이그레이션 배럴은 제거되었습니다. 레거시 상태/암호화 감지 및
  변경 헬퍼는 런타임 API 표면의 일부가 아니라 Matrix doctor가 직접 가져옵니다.
- Matrix 마이그레이션 스냅샷 재사용 마커는 이제 `matrix/migration-snapshot.json` 대신
  SQLite Plugin 상태에 있습니다. doctor는 사이드카 상태 파일을 쓰지 않고도 동일한
  검증된 마이그레이션 전 아카이브를 계속 재사용할 수 있습니다.
- Nostr 버스 커서와 프로필 게시 상태는 이제 공유 SQLite Plugin 상태를 사용합니다.
  레거시 JSON 가져오기 계획은 Nostr Plugin 설정/doctor 마이그레이션 표면에 있습니다.
- Active Memory 세션 토글은 이제 `session-toggles.json` 대신 공유 SQLite Plugin 상태를
  사용합니다. 메모리를 다시 켜면 JSON 객체를 다시 쓰는 대신 행을 삭제합니다.
- Skill Workshop 제안과 리뷰 카운터는 이제 워크스페이스별
  `skill-workshop/<workspace>.json` 저장소 대신 공유 SQLite Plugin 상태를 사용합니다.
  각 제안은 `skill-workshop/proposals` 아래 별도 행이며, 리뷰 카운터는
  `skill-workshop/reviews` 아래 별도 행입니다.
- Skill Workshop 리뷰어 하위 에이전트 실행은 이제 `skill-workshop/<sessionId>.json`
  사이드카 세션 경로를 만드는 대신 런타임 세션 트랜스크립트 리졸버를 사용합니다.
- ACPX 프로세스 lease는 이제 전체 파일 `process-leases.json` 레지스트리 대신
  `acpx/process-leases` 아래 공유 SQLite Plugin 상태를 사용합니다. 각 lease는 자체 행으로
  저장되어 런타임 JSON 재작성 경로 없이도 시작 시 오래된 프로세스 정리를 보존합니다.
- ACPX 래퍼 스크립트와 격리된 Codex 홈은 OpenClaw 임시 루트에 생성됩니다.
  필요할 때 다시 생성되며 백업 또는 마이그레이션 입력이 아닙니다.
- 하위 에이전트 실행 레지스트리 지속성은 형식이 지정된 공유 `subagent_runs` 행을
  사용합니다. 이전 `subagents/runs.json` 경로는 이제 doctor 마이그레이션 입력일 뿐이며,
  런타임 헬퍼 이름은 더 이상 상태 계층을 디스크 기반으로 설명하지 않습니다.
  런타임 테스트는 더 이상 레지스트리 동작을 증명하기 위해 잘못되었거나 빈
  `runs.json` 픽스처를 만들지 않습니다. 대신 SQLite 행을 직접 시드/읽기합니다.
- 백업은 아카이브하기 전에 상태 디렉터리를 스테이징하고, 데이터베이스가 아닌 파일을
  복사하고, `VACUUM INTO`로 `*.sqlite` 데이터베이스를 스냅샷하며, 라이브 WAL/SHM
  사이드카를 생략하고, 아카이브 매니페스트에 스냅샷 메타데이터를 기록하며, 완료된
  백업 실행을 아카이브 매니페스트와 함께 SQLite에 기록합니다. `openclaw backup
create`는 기본적으로 작성된 아카이브를 검증합니다. `--no-verify`는 명시적인 빠른
  경로입니다.
- `openclaw backup restore`는 추출 전에 아카이브를 검증하고, 검증자의 정규화된
  매니페스트를 재사용하며, 검증된 매니페스트 자산을 기록된 소스 경로로 복원합니다.
  쓰기에는 `--yes`가 필요하며 복원 계획에는 `--dry-run`을 지원합니다.
- 이전 백업 휘발성 경로 필터는 삭제되었습니다. SQLite 스냅샷이 아카이브 생성 전에
  스테이징되므로 백업은 더 이상 레거시 세션 또는 cron JSON/JSONL 파일용 live-tar
  건너뛰기 목록이 필요하지 않습니다.
- 일반 설정 및 온보딩 워크스페이스 준비는 더 이상 `agents/<agentId>/sessions/`
  디렉터리를 만들지 않습니다. 구성/워크스페이스만 만들며, SQLite 세션 행과
  트랜스크립트 행은 에이전트별 데이터베이스에서 필요할 때 생성됩니다.
- 보안 권한 복구는 이제 `sessions.json` 및 트랜스크립트 JSONL 파일 대신 전역 및
  에이전트별 SQLite 데이터베이스와 WAL/SHM 사이드카를 대상으로 합니다.
- 샌드박스 레지스트리 런타임 이름은 이제 활성 저장소를 통해 레거시 JSON 레지스트리
  용어를 전달하는 대신 SQLite 레지스트리 종류를 직접 설명합니다.
- `openclaw reset --scope config+creds+sessions`는 레거시 `sessions/` 디렉터리뿐만 아니라
  에이전트별 `openclaw-agent.sqlite` 데이터베이스와 WAL/SHM 사이드카를 제거합니다.
- Gateway 집계 세션 헬퍼는 이제 엔트리 지향 이름을 사용합니다.
  `loadCombinedSessionEntriesForGateway`는 `{ databasePath, entries }`를 반환합니다.
  이전 combined-store 명명은 런타임 호출자에서 제거되었습니다.
- Docker MCP 채널 시딩은 이제 `sessions.json` 및 JSONL 트랜스크립트를 만드는 대신
  기본 세션 행과 트랜스크립트 이벤트를 에이전트별 SQLite 데이터베이스에 씁니다.
- 번들된 세션 메모리 훅은 이제 `{agentId, sessionId}`로 SQLite에서 이전 세션 컨텍스트를
  해석합니다. 더 이상 트랜스크립트 경로나 `workspace/sessions` 디렉터리를 스캔하거나
  저장하거나 합성하지 않습니다.
- 번들된 command-logger 훅은 이제 `logs/commands.log`에 추가하는 대신 공유 SQLite
  `command_log_entries` 테이블에 명령 감사 행을 씁니다.
- 채널 페어링 허용 목록은 이제 런타임과 Plugin SDK에서 SQLite 기반 읽기/쓰기 헬퍼만
  노출합니다. 이전 `*-allowFrom.json` 경로 리졸버와 파일 리더는 doctor 레거시 가져오기
  코드 아래에만 있습니다.
- `migration_runs`는 상태, 타임스탬프, JSON 보고서와 함께 레거시 상태 마이그레이션
  실행을 기록합니다.
- `migration_sources`는 가져온 각 레거시 파일 소스를 해시, 크기, 레코드 수, 대상 테이블,
  실행 ID, 상태, 소스 제거 상태와 함께 기록합니다.
- `backup_runs`는 백업 아카이브 경로, 상태, JSON 매니페스트를 기록합니다.
- 전역 스키마는 사용되지 않는 `agents` 레지스트리 테이블을 유지하지 않습니다.
  에이전트 데이터베이스 발견은 런타임에 실제 에이전트 레코드 소유자가 생길 때까지
  정식 `agent_databases` 레지스트리입니다.
- 생성된 모델 카탈로그 구성은 에이전트 디렉터리를 키로 하는 형식이 지정된 전역
  SQLite `agent_model_catalogs` 행에 저장됩니다. 런타임 호출자는
  `ensureOpenClawModelCatalog`를 사용합니다. 런타임 코드에는 `models.json` 호환성 API가
  없습니다. 구현은 SQLite에 쓰며 내장된 PI 레지스트리는 `models.json` 파일을 만들지
  않고 저장된 페이로드에서 hydrated됩니다.
- QMD 세션 트랜스크립트 마크다운 내보내기와 `memory.qmd.sessions` 구성이 제거되었습니다.
  QMD 트랜스크립트 컬렉션, `qmd/sessions*` 런타임 경로, 파일 기반 세션 메모리 브리지는
  없습니다.
- memory-core 런타임은 QMD SDK 하위 경로가 아니라
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`에서 SQLite 트랜스크립트
  인덱싱 헬퍼를 가져옵니다. QMD 하위 경로는 주요 SDK 정리에서 제거할 수 있을 때까지
  외부 호출자용 호환성 재내보내기만 유지합니다.
- QMD 자체 `index.sqlite`는 이제 기본 SQLite `plugin_blob_entries` 테이블을 기반으로 하는
  임시 런타임 물질화입니다. 런타임은 더 이상 지속적인
  `~/.openclaw/agents/<agentId>/qmd` 사이드카를 만들지 않습니다.
- 선택 사항인 `memory-lancedb` Plugin은 더 이상 암시적인 OpenClaw 관리 저장소로
  `~/.openclaw/memory/lancedb`를 만들지 않습니다. 이는 외부 LanceDB 백엔드이며 운영자가
  명시적인 `dbPath`를 구성할 때까지 비활성화 상태로 유지됩니다.
- `check:database-first-legacy-stores`는 레거시 저장소 이름을 쓰기 스타일 파일 시스템
  API와 결합하는 새 런타임 소스에서 실패합니다. 또한 폐기된 트랜스크립트 브리지 마커
  `transcriptLocator` 또는 `sqlite-transcript://...`를 다시 도입하는 런타임 소스에서도
  실패합니다. 마이그레이션, doctor, 가져오기, 명시적인 비세션 내보내기 코드는 계속
  허용됩니다. `sessionFile`, `storePath`, 이전 `SessionManager` 파일 시대 facade 같은 더
  넓은 레거시 계약 이름은 여전히 현재 소유자가 있으며 필수 사전 검사로 만들기 전에
  별도 마이그레이션 가드 작업이 필요합니다. 이제 가드는 런타임 `cache/*.json` 저장소,
  일반 `thread-bindings.json` 사이드카, cron 상태/실행 로그 JSON, 구성 상태 JSON,
  재시작 및 잠금 사이드카, Voice Wake 설정, Plugin 바인딩 승인, 설치된 Plugin 인덱스
  JSON, File Transfer 감사 JSONL, Memory Wiki 활동 로그, 이전 번들 `command-logger`
  텍스트 로그, pi-mono raw-stream JSONL 진단 knobs도 포함합니다. 또한 호환성 코드가
  `src/commands/doctor/` 아래에 머물도록 이전 루트 수준 doctor 레거시 모듈 이름도
  금지합니다. Android 디버그 핸들러도 `camera_debug.log` 또는 `debug_logs.txt` 캐시
  파일을 스테이징하는 대신 logcat/인메모리 출력을 사용합니다.

## 대상 스키마 형태

스키마는 명시적으로 유지하세요. 호스트 소유 런타임 상태는 타입이 지정된 테이블을 사용합니다. Plugin 소유의
불투명 상태는 `plugin_state_entries` / `plugin_blob_entries`를 사용하며, 범용
호스트 `kv` 테이블은 없습니다.

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

큰 값은 JSON 문자열 인코딩이 아니라 `blob` 열을 사용해야 합니다. 일반
SQLite 도구로 계속 검사할 수 있어야 하는 작은 구조화 데이터에는
`value_json`을 유지하세요.

`agent_databases`는 이 브랜치의 표준 레지스트리입니다. 실제 에이전트 레코드 소유자가 생기기 전까지는
`agents` 테이블을 추가하지 마세요. 에이전트 구성은
`openclaw.json`에 남습니다.

## Doctor 마이그레이션 형태

Doctor는 보고 가능하고 안전하게 다시 실행할 수 있는 하나의 명시적 마이그레이션 단계를 호출해야 합니다.

```bash
openclaw doctor --fix
```

`openclaw doctor --fix`는 일반 구성 사전 점검 후 상태 마이그레이션 구현을 호출하고,
가져오기 전에 검증된 백업을 생성합니다. 런타임 시작과 `openclaw migrate`는 레거시 OpenClaw 상태 파일을 가져오면 안 됩니다.

마이그레이션 속성:

- 하나의 마이그레이션 패스가 모든 레거시 파일 소스를 발견하고, 아무것도 변경하기 전에 계획을 생성합니다.
- Doctor는 레거시 파일을 가져오기 전에 검증된 사전 마이그레이션 백업 아카이브를 생성합니다.
- 가져오기는 멱등적이며 소스 경로, mtime, 크기, 해시, 대상
  테이블을 기준으로 키가 지정됩니다.
- 성공한 소스 파일은 대상 데이터베이스가 커밋된 후 제거되거나 아카이브됩니다.
- 실패한 가져오기는 소스를 그대로 두고
  `migration_runs`에 경고를 기록합니다.
- 런타임 코드는 마이그레이션이 존재한 뒤에는 SQLite만 읽습니다.
- 다운그레이드 또는 런타임 파일로 내보내는 경로는 필요하지 않습니다.

## 마이그레이션 인벤토리

다음을 전역 데이터베이스로 이동하세요:

- 작업 레지스트리 런타임 쓰기는 이제 공유 데이터베이스를 사용합니다. 출시되지 않은
  `tasks/runs.sqlite` 사이드카 임포터는 삭제되었습니다. 스냅샷 저장은 작업
  ID 기준으로 업서트하고, 누락된 작업/전달 행만 삭제합니다.
- Task Flow 런타임 쓰기는 이제 공유 데이터베이스를 사용합니다. 출시되지 않은
  `tasks/flows/registry.sqlite` 사이드카 임포터는 삭제되었습니다. 스냅샷 저장은
  플로우 ID 기준으로 업서트하고, 누락된 플로우 행만 삭제합니다.
- Plugin 상태 런타임 쓰기는 이제 공유 데이터베이스를 사용합니다. 출시되지 않은
  `plugin-state/state.sqlite` 사이드카 임포터는 삭제되었습니다.
- 내장 메모리 검색은 더 이상 기본값으로 `memory/<agentId>.sqlite`를 사용하지 않습니다. 해당
  인덱스 테이블은 소유 에이전트 데이터베이스에 있으며, 명시적
  `memorySearch.store.path` 사이드카 옵트인은 doctor 구성
  마이그레이션으로 폐기되었습니다.
- 내장 메모리 재인덱싱은 에이전트 데이터베이스에서 메모리 소유 테이블만 재설정합니다.
  동일한 데이터베이스가 세션, 트랜스크립트, VFS 행, 아티팩트, 런타임 캐시를
  소유하므로 SQLite 파일 전체를 교체해서는 안 됩니다.
- 모놀리식 및 샤딩된 JSON의 샌드박스 컨테이너/브라우저 레지스트리. 런타임
  쓰기는 이제 공유 데이터베이스를 사용하며, 레거시 JSON 가져오기는 유지됩니다.
- Cron 작업 정의, 일정 상태, 실행 기록은 이제 공유 SQLite를 사용합니다.
  doctor는 레거시 `jobs.json`, `jobs-state.json`, 및
  `cron/runs/*.jsonl` 파일을 가져오고 제거합니다.
- 장치 ID/인증, 푸시, 업데이트 확인, 커밋먼트, OpenRouter 모델
  캐시, 설치된 Plugin 인덱스, 앱 서버 바인딩
- 장치/Node 페어링 및 부트스트랩 레코드는 이제 형식화된 SQLite 테이블을 사용합니다.
- 장치 페어 알림 구독자와 전달된 요청 마커는 이제
  `device-pair-notify.json` 대신 공유 SQLite Plugin 상태 테이블을 사용합니다.
- 음성 통화 호출 레코드는 이제 `calls.jsonl` 대신
  `voice-call` / `calls` 네임스페이스 아래의 공유 SQLite Plugin 상태 테이블을 사용합니다. Plugin CLI는
  SQLite 기반 통화 기록을 tail하고 요약합니다.
- QQBot Gateway 세션, 알려진 사용자 레코드, ref-index 인용 캐시는 이제
  `session-*.json`, `known-users.json`,
  `ref-index.jsonl` 대신 `qqbot` 네임스페이스(`gateway-sessions`,
  `known-users`, `ref-index`) 아래의 SQLite Plugin 상태를 사용합니다. 해당 레거시 파일은 캐시이며 마이그레이션되지 않습니다.
- Discord 모델 선택기 기본 설정, 명령 배포 해시, 스레드 바인딩은 이제
  `model-picker-preferences.json`, `command-deploy-cache.json`, 및
  `thread-bindings.json` 대신 `discord` 네임스페이스
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  아래의 SQLite Plugin 상태를 사용합니다. Discord doctor/setup 마이그레이션은
  레거시 파일을 가져오고 제거합니다.
- BlueBubbles 캐치업 커서와 인바운드 중복 제거 마커는 이제
  `bluebubbles/catchup/*.json` 및
  `bluebubbles/inbound-dedupe/*.json` 대신 `bluebubbles` 네임스페이스(`catchup-cursors`, `inbound-dedupe`)
  아래의 SQLite Plugin 상태를 사용합니다. BlueBubbles doctor/setup 마이그레이션은
  레거시 파일을 가져오고 제거합니다.
- Telegram 업데이트 오프셋, 스티커 캐시 항목, 답장 체인 메시지 캐시
  항목, 보낸 메시지 캐시 항목, 주제 이름 캐시 항목, 스레드
  바인딩은 이제 `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json`, 및
  `thread-bindings-*.json` 대신 `telegram` 네임스페이스
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) 아래의 SQLite Plugin 상태를 사용합니다. Telegram doctor/setup 마이그레이션은
  레거시 파일을 가져오고 제거합니다.
- iMessage 캐치업 커서, 답장 short-id 매핑, sent-echo 중복 제거 행은
  이제 `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, 및 `imessage/sent-echoes.jsonl` 대신
  `imessage` 네임스페이스(`catchup-cursors`,
  `reply-cache`, `sent-echoes`) 아래의 SQLite Plugin 상태를 사용합니다. iMessage
  doctor/setup 마이그레이션은 레거시 파일을 가져오고 제거합니다.
- Microsoft Teams 대화, 설문, SSO 토큰, 피드백 학습은 이제
  `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json`, 및 `*.learnings.json` 대신
  SQLite Plugin 상태 네임스페이스(`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`)를 사용합니다. Microsoft Teams doctor/setup 마이그레이션은
  레거시 파일을 가져오고 보관합니다.
  보류 중인 업로드는 수명이 짧은 SQLite 캐시이며, 이전 JSON 캐시 파일은
  마이그레이션되지 않습니다.
- Matrix 동기화 캐시, 스토리지 메타데이터, 스레드 바인딩, 인바운드 중복 제거 마커,
  시작 검증 쿨다운 상태, 자격 증명, 복구 키, SDK
  IndexedDB 암호화 스냅샷은 이제
  `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json`, 및 `crypto-idb-snapshot.json` 대신
  `matrix` 아래의 SQLite Plugin 상태/blob 네임스페이스
  (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)를 사용합니다. Matrix doctor/setup
  마이그레이션은 계정 범위 Matrix 스토리지 루트에서 해당 레거시 파일을
  가져오고 제거합니다.
- Nostr 버스 커서와 프로필 게시 상태는 이제
  `bus-state-*.json` 및 `profile-state-*.json` 대신
  `nostr` 네임스페이스(`bus-state`, `profile-state`) 아래의 SQLite Plugin 상태를 사용합니다. Nostr doctor/setup
  마이그레이션은 레거시 파일을 가져오고 제거합니다.
- Active Memory 세션 토글은 이제 `session-toggles.json` 대신
  `active-memory/session-toggles` 아래의 SQLite Plugin 상태를 사용합니다.
- Skill Workshop 제안 큐와 리뷰 카운터는 이제
  워크스페이스별 `skill-workshop/<workspace>.json` 파일 대신
  `skill-workshop/proposals` 및 `skill-workshop/reviews` 아래의 SQLite Plugin 상태를 사용합니다.
- 아웃바운드 전달 및 세션 전달 큐는 이제 내구성 있는
  `delivery-queue/*.json`, `delivery-queue/failed/*.json`, 및
  `session-delivery-queue/*.json` 파일 대신 별도 큐 이름
  (`outbound-delivery`, `session-delivery`) 아래에서 전역 SQLite
  `delivery_queue_entries` 테이블을 공유합니다. doctor 레거시 상태 단계는
  보류 및 실패 행을 가져오고, 오래된 전달 완료 마커를 제거하며, 가져오기 후
  이전 JSON 파일을 삭제합니다. 핫 라우팅 및 재시도 필드는 형식화된 열입니다. JSON 페이로드는 재생/디버그용으로만 유지됩니다.
- ACPX 프로세스 임대는 이제 `process-leases.json` 대신
  `acpx/process-leases` 아래의 SQLite Plugin 상태를 사용합니다.
- 백업 및 마이그레이션 실행 메타데이터

다음을 에이전트 데이터베이스로 이동합니다.

- 에이전트 세션 루트 및 호환성 형태의 session-entry 페이로드. 런타임
  쓰기에 대해 완료됨: 핫 세션 메타데이터는 `sessions`에서 쿼리할 수 있으며,
  레거시 형태의 전체 `SessionEntry` 페이로드는 `session_entries`에 남아 있습니다.
- 에이전트 트랜스크립트 이벤트. 런타임 쓰기에 대해 완료됨.
- Compaction 체크포인트 및 트랜스크립트 스냅샷. 런타임 쓰기에 대해 완료됨:
  체크포인트 트랜스크립트 복사본은 SQLite 트랜스크립트 행이고, 체크포인트
  메타데이터는 `transcript_snapshots`에 기록됩니다. Gateway 체크포인트 헬퍼는
  이제 이러한 값을 소스 파일이 아니라 트랜스크립트 스냅샷으로 명명합니다.
- 에이전트 VFS 스크래치/워크스페이스 네임스페이스. 런타임 VFS 쓰기에 대해 완료됨.
- 하위 에이전트 첨부 파일 페이로드. 런타임 쓰기에 대해 완료됨: SQLite VFS
  시드 항목이며, 내구성 있는 워크스페이스 파일이 아닙니다.
- 도구 아티팩트. 런타임 쓰기에 대해 완료됨.
- 실행 아티팩트. 에이전트별
  `run_artifacts` 테이블을 통한 워커 런타임 쓰기에 대해 완료됨.
- 에이전트 로컬 런타임 캐시. 에이전트별 `cache_entries` 테이블을 통한
  워커 런타임 범위 캐시 쓰기에 대해 완료됨. Gateway 전체 모델 캐시는
  에이전트별이 되지 않는 한 전역 데이터베이스에 유지됩니다.
- ACP 부모 스트림 로그. 런타임 쓰기에 대해 완료됨.
- ACP 재생 원장 세션. `acp_replay_sessions` 및 `acp_replay_events`를 통해
  런타임 쓰기에 대해 완료됨. 레거시 `acp/event-ledger.json`은 doctor 입력으로만 남습니다.
- ACP 세션 메타데이터. `acp_sessions`를 통해 런타임 쓰기에 대해 완료됨. `sessions.json`의 레거시
  `entry.acp` 블록은 doctor 마이그레이션 입력 전용입니다.
- 명시적 내보내기 파일이 아닌 경우의 trajectory 사이드카. 런타임
  쓰기에 대해 완료됨: trajectory 캡처는 에이전트 데이터베이스 `trajectory_runtime_events`
  행을 쓰고, 실행 범위 아티팩트를 SQLite로 미러링합니다. 레거시 사이드카는 doctor
  가져오기 입력 전용입니다. 내보내기는 새로운 JSONL 지원 번들 출력을 구체화할 수 있지만
  런타임에서 오래된 trajectory/트랜스크립트 사이드카를 읽거나 마이그레이션하지 않습니다.
  런타임 trajectory 캡처는 SQLite 범위를 노출합니다. JSONL 경로 헬퍼는
  내보내기/디버그 지원에 격리되며 런타임 모듈에서 다시 내보내지지 않습니다.
  임베디드 러너 trajectory 메타데이터는 트랜스크립트 로케이터를 유지하는 대신 `{agentId, sessionId, sessionKey}`
  ID를 기록합니다.

지금은 다음을 파일 기반으로 유지합니다.

- `openclaw.json`
- 제공자 또는 CLI 자격 증명 파일
- Plugin/패키지 매니페스트
- 디스크 모드가 선택된 경우 사용자 워크스페이스 및 Git 저장소
- 특정 로그 표면을 이동하지 않는 한, 운영자 tail용 로그

## 마이그레이션 계획

### 0단계: 경계 동결

더 많은 행을 이동하기 전에 내구성 상태 경계를 명시적으로 만듭니다.

- 전역 데이터베이스에 `migration_runs` 테이블을 추가합니다.
  레거시 상태 마이그레이션 실행 보고서에 대해 완료됨.
- 파일-데이터베이스 가져오기를 위한 단일 doctor 소유 상태 마이그레이션 서비스를 추가합니다.
  완료됨: `openclaw doctor --fix`는 레거시 상태 마이그레이션 구현을 사용합니다.
- `plan`은 읽기 전용으로 만들고, `apply`는 백업을 만들고, 가져오고, 검증한 다음
  이전 파일을 삭제하거나 격리하도록 만듭니다.
  완료됨: doctor는 검증된 마이그레이션 전 백업을 만들고, 백업 경로를
  `migration_runs`에 전달하며, 임포터/제거 경로를 재사용합니다.
- 새 런타임 코드가 레거시 상태 파일을 쓸 수 없도록 정적 금지를 추가하되,
  마이그레이션 코드와 테스트는 계속 이를 시드/읽기할 수 있게 합니다.
  현재 마이그레이션된 레거시 스토어에 대해 완료됨. 이 가드는 금지된
  런타임 트랜스크립트 로케이터 계약을 찾기 위해 중첩 테스트도 스캔합니다.

### 1단계: 전역 제어 플레인 완료

공유 조정 상태는 `state/openclaw.sqlite`에 유지합니다.

- 에이전트 및 에이전트 데이터베이스 레지스트리
- 작업 및 Task Flow 원장
- Plugin 상태
- 샌드박스 컨테이너/브라우저 레지스트리
- Cron/스케줄러 실행 기록
- 페어링, 장치, 푸시, 업데이트 확인, TUI, OpenRouter/모델 캐시, 기타
  소규모 Gateway 범위 런타임 상태
- 백업 및 마이그레이션 메타데이터
- Gateway 미디어 첨부 파일 바이트. 런타임 쓰기에 대해 완료됨. 직접 파일 경로는
  채널 발신자 및 샌드박스 스테이징과의 호환성을 위한 임시 구체화입니다. 런타임 허용 목록은
  레거시 상태/구성 미디어 루트가 아니라 SQLite 구체화 경로를 허용합니다. Doctor는 레거시 미디어 파일을
  `media_blobs`로 가져오고, 행 쓰기가 성공하면 소스 파일을 제거합니다.
- 디버그 프록시 캡처 세션, 이벤트, 페이로드 blob. 완료됨: 캡처는
  공유 상태 DB에 있으며 공유 상태 DB 부트스트랩, 스키마,
  WAL, busy-timeout 설정을 통해 열립니다. 페이로드 바이트는
  `capture_blobs.data`에서 gzip으로 압축됩니다. 디버그 프록시 런타임 사이드카 DB 오버라이드,
  blob 디렉터리, proxy-capture 전용 생성 스키마/codegen 대상은 없습니다.
  Doctor/시작 마이그레이션은 활성 레거시 DB/blob 환경
  오버라이드를 포함하여 출시된 `debug-proxy/capture.sqlite` 행과 참조된 페이로드 blob을
  가져온 다음, CA 인증서는 그대로 두고 해당 소스를 보관합니다.

이 단계에서는 해당 하위 시스템에서 중복 사이드카 오프너, 권한 헬퍼, WAL
설정, 파일시스템 가지치기, 호환성 작성기도 삭제합니다.

### 2단계: 에이전트별 데이터베이스 도입

에이전트마다 하나의 데이터베이스를 만들고 전역 DB에서 이를 등록합니다.

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

전역 `agent_databases` 행은 경로, 스키마 버전, 마지막 확인
타임스탬프, 기본 크기/무결성 메타데이터를 저장합니다. 런타임 코드는 파일 경로를 직접
파생하는 대신 레지스트리에 에이전트 DB를 요청합니다.

에이전트 DB가 소유하는 항목:

- `sessions`를 표준 세션 루트로 사용하며, `session_entries`는 해당 루트에 연결된
  호환성 형태의 페이로드 테이블로, `session_routes`는 고유한 활성 `session_key` 조회로 사용
- `conversations` 및 `session_conversations`를 세션에 연결된 정규화된 제공자
  라우팅 ID로 사용
- `transcript_events`
- 트랜스크립트 스냅샷 및 Compaction 체크포인트. 런타임 쓰기에 대해 완료됨.
- `vfs_entries`
- `tool_artifacts` 및 실행 아티팩트
- 에이전트 로컬 런타임/캐시 행. 워커 범위 캐시에 대해 완료됨.
- ACP 부모 스트림 이벤트
- 명시적 내보내기 아티팩트가 아닌 경우의 트래젝터리 런타임 이벤트

### 3단계: 세션 저장소 API 교체

런타임에 대해 완료됨. 파일 형태의 세션 저장소 표면은 활성 런타임 계약이 아님:

- 런타임은 더 이상 `loadSessionStore(storePath)`를 호출하거나 `storePath`를
  세션 ID로 취급하지 않음.
- 런타임 행 작업은 `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry`, `listSessionEntries`임.
- 전체 저장소 재작성 헬퍼, 파일 작성기, 큐 테스트, 별칭 가지치기, 레거시 키 삭제
  매개변수는 런타임에서 제거됨.
- 사용 중단된 루트 패키지 호환성 내보내기는 여전히 표준 `sessions.json` 경로를
  SQLite 행 API에 맞게 조정함.
- `sessions.json` 파싱은 doctor 마이그레이션/가져오기 코드와 doctor 테스트에만 남아 있음.
- 런타임 수명 주기 폴백은 JSONL 첫 줄이 아니라 SQLite 트랜스크립트 헤더를 읽음.

파일 잠금 매개변수, 파일 유지관리로서의 가지치기/잘라내기 어휘, 저장소 경로 ID,
또는 유일한 어설션이 JSON 지속성인 테스트를 다시 도입하는 모든 것을 계속 삭제할 것.

### 4단계: 트랜스크립트, ACP 스트림, 트래젝터리, VFS 이동

모든 에이전트 데이터 스트림을 데이터베이스 네이티브로 만들 것:

- 트랜스크립트 추가 쓰기는 세션 헤더를 보장하고, 메시지 멱등성을 확인하며, 부모 꼬리를
  선택하고, `transcript_events`에 삽입하며, 조회 가능한 ID 메타데이터를
  `transcript_event_identities`에 기록하는 하나의 SQLite 트랜잭션을 거침.
  직접 트랜스크립트 메시지 추가 및 일반 지속 `TranscriptSessionManager` 추가에 대해 완료됨;
  명시적 브랜치 작업은 명시적 부모 선택을 유지하며 파일 로케이터를 유도하지 않고도
  SQLite 행을 계속 작성함.
- ACP 부모 스트림 로그는 `.acp-stream.jsonl` 파일이 아니라 행이 됨. 완료됨.
- ACP spawn 설정은 더 이상 트랜스크립트 JSONL 경로를 지속하지 않음. 완료됨.
- 런타임 트래젝터리 캡처는 이벤트 행/아티팩트를 직접 작성함. 명시적 지원/내보내기 명령은
  여전히 지원 번들 JSONL 아티팩트를 내보내기 형식으로 생성할 수 있지만, 세션 내보내기는
  세션 JSONL을 다시 만들지 않음. 완료됨.
- 디스크 워크스페이스는 디스크 모드로 구성된 경우 디스크에 유지됨.
- VFS 스크래치 및 실험적 VFS 전용 워크스페이스 모드는 에이전트 DB를 사용함.

마이그레이션은 오래된 JSONL 파일을 한 번 가져오고, `migration_runs`에 개수/해시를
기록하며, 무결성 확인 후 가져온 파일을 제거함.

### 5단계: 백업, 복원, Vacuum, 검증

백업은 하나의 아카이브 파일로 유지됨:

- 모든 글로벌 및 에이전트 데이터베이스를 체크포인트함.
- SQLite 백업 의미론 또는 `VACUUM INTO`로 각 DB를 스냅샷함.
- 압축된 DB 스냅샷, 설정, 외부 자격 증명, 요청된 워크스페이스 내보내기를 아카이브함.
- 원시 라이브 `*.sqlite-wal` 및 `*.sqlite-shm` 파일은 생략함.
- 모든 DB 스냅샷을 열고 `PRAGMA integrity_check`를 실행하여 검증함.
  `openclaw backup create`는 기본적으로 이 아카이브 검증을 수행함;
  `--no-verify`는 스냅샷 생성 무결성 확인이 아니라 쓰기 후 아카이브 단계만 건너뜀.
- 복원은 스냅샷을 대상 경로로 다시 복사함. 이 브랜치는 출시되지 않은 SQLite 레이아웃을
  `user_version = 1`로 재설정함; 향후 출시된 스키마 변경은 필요할 때 명시적
  마이그레이션을 추가할 수 있음.

### 6단계: 워커 런타임

데이터베이스 분리가 자리 잡는 동안 워커 모드는 실험적으로 유지할 것:

- 워커는 에이전트 ID, 실행 ID, 파일 시스템 모드, DB 레지스트리 ID를 받음.
- 각 워커는 자체 SQLite 연결을 엶.
- 부모는 채널 전달, 승인, 설정, 취소 권한을 유지함.
- 활성 실행당 워커 하나로 시작하고, 수명 주기와 DB 연결 소유권이 안정된 후에만 풀링을 추가함.

### 7단계: 오래된 세계 삭제

런타임 세션 관리에 대해 완료됨. 오래된 세계는 명시적 doctor 입력 또는 지원/내보내기 출력으로만 허용됨:

- 런타임 `sessions.json`, 트랜스크립트 JSONL, 샌드박스 레지스트리 JSON, 작업
  사이드카 SQLite, Plugin 상태 사이드카 SQLite 쓰기 없음.
- JSON/세션 파일 가지치기, 파일 트랜스크립트 잘라내기, 세션 파일 잠금, 잠금 형태의
  세션 테스트 없음.
- 오래된 세션 파일을 최신 상태로 유지하기 위한 런타임 호환성 내보내기 없음.
- 명시적 지원 내보내기는 사용자가 요청한 아카이브/구체화 형식으로 유지되며 파일 이름을
  런타임 ID로 다시 공급해서는 안 됨.

## 백업 및 복원

백업은 하나의 아카이브 파일이어야 하지만, 데이터베이스 캡처는 SQLite 네이티브여야 함:

1. 장기 실행 쓰기 활동을 중지하거나 짧은 백업 장벽에 진입함.
2. 모든 글로벌 및 에이전트 데이터베이스에 대해 체크포인트를 실행함.
3. SQLite 백업 의미론 또는 `VACUUM INTO`를 사용해 각 데이터베이스를 임시 백업
   디렉터리에 스냅샷함.
4. 압축된 데이터베이스 스냅샷, 설정 파일, 자격 증명 디렉터리, 선택한 워크스페이스,
   매니페스트를 아카이브함.
5. 포함된 모든 SQLite 스냅샷을 열고 `PRAGMA integrity_check`를 실행하여
   아카이브를 검증함.
   `openclaw backup create`는 기본적으로 이를 수행함; `--no-verify`는
   쓰기 후 아카이브 단계를 의도적으로 건너뛰는 경우에만 사용함.

원시 라이브 `*.sqlite`, `*.sqlite-wal`, `*.sqlite-shm` 복사본을 기본 백업
형식으로 의존하지 말 것. 아카이브 매니페스트는 데이터베이스 역할, 에이전트 ID,
스키마 버전, 소스 경로, 스냅샷 경로, 바이트 크기, 무결성 상태를 기록해야 함.

복원은 아카이브 스냅샷에서 글로벌 데이터베이스와 에이전트 데이터베이스 파일을 다시
구성해야 함. SQLite 레이아웃은 아직 출시되지 않았기 때문에, 이 리팩터링은 버전 1
스키마와 doctor 파일-데이터베이스 가져오기만 유지함. 복원 명령은 먼저 아카이브를 검증한
다음, 검증된 추출 페이로드에서 각 매니페스트 자산을 교체함.

## 런타임 리팩터링 계획

1. 데이터베이스 레지스트리 API를 추가함.
   - 글로벌 DB 및 에이전트별 DB 경로를 해석함.
   - 출시되지 않은 스키마는 `user_version = 1`로 유지함; 출시된 스키마가 필요할
     때까지 스키마 마이그레이션 실행기 코드를 추가하지 말 것.
   - 테스트, 백업, doctor에서 사용하는 닫기/체크포인트/무결성 헬퍼를 추가함.

2. 사이드카 SQLite 저장소를 통합함.
   - Plugin 상태 테이블을 글로벌 데이터베이스로 이동함. 런타임 쓰기에 대해 완료됨;
     출시되지 않은 레거시 사이드카 가져오기는 삭제됨.
   - 작업 레지스트리 테이블을 글로벌 데이터베이스로 이동함. 런타임 쓰기에 대해 완료됨;
     출시되지 않은 레거시 사이드카 가져오기는 삭제됨.
   - Task Flow 테이블을 글로벌 데이터베이스로 이동함. 런타임 쓰기에 대해 완료됨;
     출시되지 않은 레거시 사이드카 가져오기는 삭제됨.
   - 내장 메모리 검색 테이블을 각 에이전트 데이터베이스로 이동함. 완료됨; 명시적
     사용자 지정 `memorySearch.store.path`는 이제 doctor 설정 마이그레이션에서
     제거됨.
     전체 재인덱싱은 메모리 테이블에 대해서만 제자리에서 실행됨; 오래된 전체 파일
     교체 경로와 사이드카 인덱스 교체 헬퍼는 삭제됨.
   - 해당 하위 시스템에서 중복 데이터베이스 오프너, WAL 설정, 권한 헬퍼, 닫기 경로를 삭제함.

3. 에이전트 소유 테이블을 에이전트별 데이터베이스로 이동함.
   - 글로벌 데이터베이스 레지스트리를 통해 필요 시 에이전트 DB를 생성함. 완료됨.
   - 런타임 세션 항목, 트랜스크립트 이벤트, VFS 행, 도구 아티팩트를 에이전트 DB로
     이동함. 완료됨.
   - 브랜치 로컬 공유 DB 세션 항목, 트랜스크립트 이벤트, VFS 행, 도구 아티팩트는
     마이그레이션하지 말 것; 해당 레이아웃은 출시된 적이 없음. doctor에는 레거시
     파일-데이터베이스 가져오기만 유지함.

4. 세션 저장소 API를 교체함.
   - `storePath`를 런타임 ID로 제거함. 런타임에 대해 완료되었으며
     `check:database-first-legacy-stores`로 보호됨: 세션 메타데이터, 라우트 업데이트,
     명령 지속성, CLI 세션 정리, Feishu 추론 미리보기, 트랜스크립트 상태 지속성,
     하위 에이전트 깊이, 인증 프로필 세션 오버라이드, 부모 포크 로직, QA 랩 검사는
     이제 표준 에이전트/세션 키에서 데이터베이스를 해석함.
     Gateway/TUI/UI/macOS 세션 목록 응답은 이제 레거시 `path` 대신 `databasePath`를 노출함;
     macOS 디버그 표면은 `session.store` 설정을 작성하는 대신 에이전트별 데이터베이스를
     읽기 전용 상태로 표시함.
     `/status`, 채팅 기반 트래젝터리 내보내기, CLI 종속성 프록시는 더 이상 레거시
     저장소 경로를 전파하지 않음; 트랜스크립트 사용량 폴백은 에이전트/세션 ID로
     SQLite를 읽음. 런타임 및 브리지 테스트는 더 이상 `storePath`를 노출하지 않음;
     doctor/마이그레이션 입력이 해당 레거시 필드 이름을 소유함.
     Gateway 결합 세션 로딩에는 더 이상 템플릿화되지 않은 `session.store` 값에 대한
     특수 런타임 브랜치가 없음; 에이전트별 SQLite 행을 집계함.
     레거시 세션 잠금 doctor 레인과 해당 `.jsonl.lock` 정리 헬퍼는 제거됨;
     이제 SQLite가 세션 동시성 경계임.
     핫 런타임 호출 지점은 `resolveSessionRowEntry` 같은 행 지향 헬퍼 이름을 사용함;
     오래된 `resolveSessionStoreEntry` 호환성 별칭은 런타임 및 Plugin SDK 내보내기에서
     제거됨.

- `{ agentId, sessionKey }` 행 작업을 사용할 것.
  완료됨: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry`, `listSessionEntries`는 세션 저장소 경로가 필요 없는
  SQLite 우선 API임. 상태 요약, 로컬 에이전트 상태, 상태 확인, `openclaw sessions`
  목록 명령은 이제 에이전트별 행을 직접 읽고 `sessions.json` 경로 대신 에이전트별
  SQLite 데이터베이스 경로를 표시함.
- 전체 저장소 삭제/삽입을 `upsertSessionEntry`, `deleteSessionEntry`,
  `listSessionEntries`, SQL 정리 쿼리로 교체할 것.
  런타임에 대해 완료됨: 핫 경로는 이제 행 API와 충돌 재시도 행 패치를 사용함;
  남은 전체 저장소 가져오기/교체 헬퍼는 마이그레이션 가져오기 코드 및 SQLite 백엔드
  테스트로 제한됨.
  - `store-writer.ts` 및 writer-queue 테스트 삭제. 완료됨.
  - 세션 행 업서트/패치에서 런타임 레거시 키 가지치기 및 별칭 삭제 매개변수 삭제. 완료됨.

5. 런타임 JSON 레지스트리 동작을 삭제함.
   - 샌드박스 레지스트리 읽기 및 쓰기를 SQLite 전용으로 만들 것. 완료됨.
   - 단일체 및 샤딩된 JSON은 마이그레이션 단계에서만 가져올 것. 완료됨.
   - 샤딩된 레지스트리 잠금 및 JSON 쓰기를 제거할 것. 완료됨.

- 형태가 핫 경로 운영 상태로 남아 있다면 레지스트리 행을 일반적인 불투명 JSON으로
  저장하는 대신 하나의 타입 지정 레지스트리 테이블을 유지할 것. 완료됨.

6. 파일 잠금 형태의 세션 변경을 삭제함.
   - 런타임 잠금 생성 및 런타임 잠금 API에 대해 완료됨.
   - 독립 실행형 레거시 `.jsonl.lock` doctor 정리 레인은 제거됨.
   - `session.writeLock`은 doctor로 마이그레이션되는 레거시 설정이며, 타입 지정
     런타임 설정이 아님.
   - 상태 무결성에는 더 이상 별도의 고아 트랜스크립트 파일 가지치기 경로가 없음;
     doctor 마이그레이션이 레거시 JSONL 소스를 한곳에서 가져오고 제거함.
   - Gateway 싱글턴 조정은 `gateway_locks` 아래의 타입 지정 SQLite `state_leases`
     행을 사용하며 더 이상 파일 잠금 디렉터리 표면을 노출하지 않음.
   - 일반 Plugin SDK 중복 제거 지속성은 더 이상 파일 잠금이나 JSON 파일을 사용하지 않음;
     공유 SQLite Plugin 상태 행을 작성함. 완료됨.
   - QMD 임베드 조정은 `qmd/embed.lock` 대신 SQLite 상태 임대를 사용함. 완료됨.

7. 워커가 데이터베이스를 인식하도록 만들 것.
   - 워커는 자체 SQLite 연결을 엶.
   - 부모는 전달, 채널 콜백, 설정을 소유함.
   - 워커는 라이브 핸들이 아니라 에이전트 ID, 실행 ID, 파일 시스템 모드, DB 레지스트리
     ID를 받음.
   - `vfs-only`는 실험적으로 유지되며 에이전트 데이터베이스를 저장소 루트로 사용함.
   - 먼저 활성 실행당 워커 하나를 유지할 것. 풀링은 DB 연결 수명과 취소 동작이 안정될
     때까지 기다릴 수 있음.

8. 백업 통합.
   - SQLite 백업 또는 `VACUUM INTO`를 통해 전역 및 에이전트 데이터베이스를 스냅샷하도록 백업에 가르칩니다. 상태 자산 아래에서 발견된 `*.sqlite` 파일에 대해 완료되었습니다.
   - SQLite 무결성 및 스키마 버전에 대한 백업 검증을 추가합니다. 백업 생성 및 기본 아카이브 검증 무결성 검사에 대해 완료되었습니다.
   - 백업 실행 메타데이터를 SQLite에 기록합니다. 아카이브 경로, 상태, 매니페스트 JSON이 포함된 공유 `backup_runs` 테이블을 통해 완료되었습니다.
   - 검증된 아카이브 스냅샷에서 복원을 추가합니다. 완료: `openclaw backup
restore`는 추출 전에 검증하고, 검증기의 정규화된 매니페스트를 사용하며, `--dry-run`을 지원하고, 기록된 소스 경로를 교체하기 전에 `--yes`를 요구합니다.
   - 요청된 경우에만 VFS/작업공간 내보내기를 포함하고, 세션 내부 데이터를 JSON 또는 JSONL로 내보내지 않습니다.

9. 오래된 테스트와 코드를 삭제합니다. 알려진 런타임 세션 표면에 대해 완료되었습니다.

- `sessions.json` 또는 트랜스크립트 JSONL 파일의 런타임 생성을 단언하는 테스트를 제거합니다. 코어 세션 저장소, 채팅, Gateway 트랜스크립트 이벤트, 미리보기, 수명 주기, 명령 세션 항목 업데이트, 자동 응답 재설정/추적, memory-core dreaming 픽스처, 승인 대상 라우팅, 세션 트랜스크립트 복구, 보안 권한 복구, 궤적 내보내기, 세션 내보내기에 대해 완료되었습니다.
  Active-memory 트랜스크립트 테스트는 이제 SQLite 범위와 임시 또는 영구 JSONL 파일이 생성되지 않음을 단언합니다.
  런타임이 더 이상 JSONL 트랜스크립트를 자르지 않으므로 오래된 Heartbeat 트랜스크립트 가지치기 회귀 테스트는 제거되었습니다.
  에이전트 세션 목록 도구 테스트는 더 이상 레거시 `sessions.json` 경로를 Gateway 응답 형태로 모델링하지 않으며, 앱/UI/macOS 테스트는 `databasePath`를 사용합니다.
  `/status` 트랜스크립트 사용량 테스트는 이제 JSONL 파일을 쓰는 대신 SQLite 트랜스크립트 행을 직접 시드합니다.
  Gateway 세션 수명 주기 테스트는 이제 SQLite 트랜스크립트 시딩 헬퍼를 직접 사용합니다. 오래된 단일 줄 세션 파일 픽스처 형태는 재설정 및 삭제 커버리지에서 사라졌습니다.
  `sessions.delete`는 더 이상 파일 시대의 `archived: []` 필드를 반환하지 않습니다. 삭제는 행 변경 결과만 보고합니다. 오래된 `deleteTranscript` 옵션도 사라졌습니다. 세션을 삭제하면 정식 `sessions` 루트가 제거되고 SQLite가 세션 소유 트랜스크립트, 스냅샷, 궤적 행을 캐스케이드하므로, 어떤 호출자도 트랜스크립트 고아를 남기거나 정리 분기를 잊을 수 없습니다.
  컨텍스트 엔진 궤적 캡처 테스트는 이제 `session.trajectory.jsonl`을 읽는 대신 격리된 에이전트 데이터베이스에서 `trajectory_runtime_events` 행을 읽습니다.
  Docker MCP 채널 시드 스크립트는 이제 SQLite 행을 직접 시드합니다. 직접 `sessions.json` 쓰기는 doctor 픽스처로 제한됩니다.
  Tool Search Gateway E2E는 `agents/<agentId>/sessions/*.jsonl` 파일을 스캔하는 대신 SQLite 트랜스크립트 행에서 도구 호출 증거를 읽습니다.
  Memory-core 호스트 이벤트와 session-corpus 스크래치 행은 이제 공유 SQLite Plugin 상태에 있습니다. `events.jsonl` 및 `session-corpus/*.txt`는 레거시 doctor 마이그레이션 입력 전용입니다. 활성 행은 `.dreams/session-corpus`가 아니라 `memory/session-ingestion/` 가상 경로를 사용합니다. 런타임이 더 이상 해당 코퍼스의 파일 아카이브 복구를 소유하지 않으므로 오래된 memory-core dreaming 복구 모듈과 그 CLI/Gateway 테스트는 제거되었습니다. Memory-core 브리지/공개 아티팩트 테스트는 더 이상 `.dreams/events.jsonl`을 표면화하지 않고, SQLite 기반 가상 JSON 아티팩트 이름을 사용합니다.
  공개 SDK/Codex 테스트 문서는 이제 세션 파일 대신 SQLite 세션 상태라고 말하며, channel-turn 예시는 더 이상 `storePath` 인수를 노출하지 않습니다.
  Matrix 동기화 상태는 이제 SQLite Plugin 상태 저장소를 직접 사용합니다. 활성 클라이언트/런타임 계약은 `bot-storage.json` 경로가 아니라 계정 저장소 루트를 전달하며, doctor는 소스를 삭제하기 전에 레거시 `bot-storage.json`을 SQLite로 가져옵니다. QA Matrix 재시작/파괴적 시나리오는 이제 가짜 `bot-storage.json` 파일을 만들거나 삭제하는 대신 SQLite 동기화 행을 직접 변경하며, E2EE 기반은 가짜 `sync-store.json` 경로 대신 동기화 저장소 루트를 전달합니다.
  Matrix 저장소 루트 선택은 더 이상 레거시 동기화/스레드 JSON 파일로 루트를 점수화하지 않습니다. 내구성 있는 루트 메타데이터와 실제 암호화 상태를 사용합니다.
  런타임 SQLite 세션 백엔드 테스트 스위트는 더 이상 `sessions.json`을 조작해 만들지 않습니다. 레거시 소스 픽스처는 이제 이를 가져오는 doctor 테스트에 있습니다.
  Gateway 세션 테스트는 더 이상 `createSessionStoreDir` 헬퍼나 사용되지 않는 임시 세션 저장소 경로 설정을 노출하지 않습니다. 픽스처 디렉터리는 명시적이며, 직접 행 설정은 SQLite 세션 행 명명을 사용합니다.
  Doctor 전용 JSON5 세션 저장소 파서 커버리지는 인프라 테스트에서 doctor 마이그레이션 테스트로 이동했으므로, 런타임 테스트 스위트는 더 이상 레거시 세션 파일 파싱을 소유하지 않습니다.
  Microsoft Teams 런타임 SSO/대기 중 업로드 테스트는 더 이상 JSON 사이드카 픽스처나 파서를 포함하지 않습니다. 레거시 SSO 토큰 파싱은 Plugin 마이그레이션 모듈에만 있습니다. Telegram 테스트는 더 이상 가짜 `/tmp/*.json` 저장소 경로를 시드하지 않고, SQLite 기반 메시지 캐시를 직접 재설정합니다. 일반 OpenClaw 테스트 상태 헬퍼는 더 이상 레거시 `auth-profiles.json` 작성기를 노출하지 않습니다. doctor 인증 마이그레이션 테스트가 해당 픽스처를 로컬에서 소유합니다.
  TUI 마지막 세션 포인터, exec 승인, active-memory 토글, Matrix 중복 제거/시작 검증, Memory Wiki 소스 동기화, 현재 대화 바인딩, 온보딩 인증, Hermes 비밀 가져오기에 대한 런타임 테스트는 더 이상 오래된 사이드카 파일을 만들거나 오래된 파일명이 없음을 단언하지 않습니다. SQLite 행과 공개 저장소 API를 통해 동작을 증명합니다. 레거시 소스 파일명이 속하는 유일한 곳은 doctor/마이그레이션 테스트입니다.
  장치/노드 페어링, 채널 allowFrom, 재시작 의도, 재시작 인계, 세션 전달 큐 항목, 구성 상태, iMessage 캐시, Cron 작업, PI 트랜스크립트 헤더, 하위 에이전트 레지스트리, 관리형 이미지 첨부 파일에 대한 런타임 테스트도 더 이상 폐기된 JSON/JSONL 파일을 만들어 무시되거나 없음을 증명하지 않습니다.
  PI 오버플로 복구에는 더 이상 SessionManager 재작성/자르기 폴백이 없습니다. 도구 결과 자르기와 컨텍스트 엔진 트랜스크립트 재작성은 SQLite 트랜스크립트 행을 변경한 다음 데이터베이스에서 활성 프롬프트 상태를 새로 고칩니다.
  영구 SessionManager 메시지 추가는 부모 선택과 멱등성을 위해 원자적 SQLite 트랜스크립트 추가 헬퍼에 위임합니다. 일반 메타데이터/사용자 지정 항목 추가도 SQLite 내부에서 현재 부모를 선택하므로, 오래된 매니저 인스턴스가 SQLite 이전 부모 체인 경합을 되살리지 않습니다.
  턴 중간 사전 검사와 `sessions_yield`를 위한 합성 PI 꼬리 정리도 이제 SQLite 트랜스크립트 상태를 직접 잘라냅니다. 오래된 SessionManager 꼬리 제거 브리지와 그 테스트는 삭제되었습니다.
  Compaction 체크포인트 캡처도 SQLite에서만 스냅샷합니다. 호출자는 더 이상 대체 트랜스크립트 소스로 live SessionManager를 전달하지 않습니다.
- 마이그레이션 전용으로 레거시 파일을 시드하는 테스트는 유지합니다.
- 활성 런타임 표면에서는 JSON 파일 증거가 SQL 행 증거로 대체되었습니다.

- 레거시 세션/캐시 JSON 경로에 대한 런타임 쓰기 정적 금지를 추가합니다.
  리포지토리 가드에 대해 완료되었습니다.

10. 마이그레이션 보고서를 감사 가능하게 만듭니다.
    - 시작/완료 타임스탬프, 소스 경로, 소스 해시, 개수, 경고, 백업 경로와 함께 마이그레이션 실행을 SQLite에 기록합니다.
      완료: 레거시 상태 마이그레이션 실행은 이제 소스 경로/테이블 인벤토리, 소스 파일 SHA-256, 크기, 레코드 수, 경고, 백업 경로가 포함된 `migration_runs` 보고서를 영구 저장합니다.
      완료: 레거시 상태 마이그레이션 실행은 소스 수준 감사와 향후 건너뛰기/백필 결정을 위해 `migration_sources` 행도 영구 저장합니다.
    - 적용을 멱등적으로 만듭니다. 부분 가져오기 후 다시 실행하면 이미 가져온 소스를 건너뛰거나 안정적인 키로 병합해야 합니다.
      완료: 세션 인덱스, 트랜스크립트, 전달 큐, Plugin 상태, 작업 원장, 에이전트 소유 전역 SQLite 행은 안정적인 키 또는 upsert/replace 의미론을 통해 가져오므로, 재실행 시 내구성 있는 행을 중복하지 않고 병합됩니다.
    - 가져오기에 실패하면 원본 소스 파일을 그대로 유지해야 합니다.
      완료: 실패한 트랜스크립트 가져오기는 이제 원본 JSONL 소스를 감지된 경로에 그대로 두며, `migration_sources`는 다음 doctor 실행을 위해 해당 소스를 `warning` 및 `removed_source=0`으로 기록합니다.

## 성능 규칙

- 스레드/프로세스당 하나의 연결은 괜찮습니다. 워커 간에 핸들을 공유하지 마십시오.
- WAL, `foreign_keys=ON`, 30초 busy timeout, 짧은 `BEGIN IMMEDIATE` 쓰기 트랜잭션을 사용합니다.
- 명시적 뮤텍스/역압 의미론을 추가하는 비동기 트랜잭션 API가 생기기 전까지 쓰기 트랜잭션 헬퍼는 동기식으로 유지합니다.
- 부모 전달 쓰기는 작고 트랜잭션으로 유지합니다.
- 전체 저장소 재작성을 피하고, 행 수준 upsert/delete를 사용합니다.
- 핫 코드를 이동하기 전에 에이전트별 목록, 세션별 목록, updated-at, 실행 ID, 만료 경로에 대한 인덱스를 추가합니다.
- 큰 아티팩트, 미디어, 벡터는 base64 또는 숫자 배열 JSON이 아니라 BLOB 또는 청크 BLOB 행으로 저장합니다.
- 불투명한 Plugin 상태 항목은 작고 범위가 지정되도록 유지합니다.
- 파일시스템 가지치기 대신 TTL/만료를 위한 SQL 정리를 추가합니다.
  데이터베이스 소유 런타임 저장소에 대해 완료되었습니다. 미디어, Plugin 상태, Plugin Blob, 영구 중복 제거, 에이전트 캐시는 모두 SQLite 행을 통해 만료됩니다. 남은 파일시스템 정리는 임시 물질화 또는 명시적 제거 명령으로 제한됩니다.

## 정적 금지

레거시 상태 경로에 대한 새로운 런타임 쓰기를 실패시키는 리포지토리 검사를 추가합니다:

- `sessions.json`
- 구체화된 지원 번들 출력물을 제외한 `*.trajectory.jsonl`
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
- 샌드박스 레지스트리 샤드 JSON 파일
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
  트랜스크립트 나열 파사드
- `SessionManager.forkFromSession(...)` 및
  `TranscriptSessionManager.forkFromSession(...)` 트랜스크립트 포크 파사드
- `SessionManager.newSession(...)` 및 `TranscriptSessionManager.newSession(...)`
  변경 가능한 세션 교체 파사드
- `SessionManager.createBranchedSession(...)` 및
  `TranscriptSessionManager.createBranchedSession(...)` 브랜치 세션 파사드

금지는 테스트가 레거시 픽스처를 만들 수 있도록 허용하고, 마이그레이션 코드가
레거시 파일 소스를 읽거나 가져오거나 제거할 수 있도록 허용해야 합니다. 출시되지 않은 SQLite 사이드카는 계속 금지되며
doctor 가져오기 허용 대상에 포함되지 않습니다.

## 완료 기준

- 런타임 데이터와 캐시 쓰기는 전역 또는 에이전트 SQLite 데이터베이스로 이동합니다.
- 런타임은 더 이상 세션 인덱스, 트랜스크립트 JSONL, 샌드박스 레지스트리
  JSON, 작업 사이드카 SQLite 또는 plugin-state 사이드카 SQLite를 쓰지 않습니다. 출시되지 않은 작업
  및 plugin-state 사이드카 SQLite 가져오기 도구는 삭제됩니다.
- 레거시 파일 가져오기는 doctor 전용입니다.
- 백업은 압축된 SQLite 스냅샷과 무결성 증명이 포함된 하나의 아카이브를 생성합니다.
- 에이전트 워커는 디스크, VFS 스크래치 또는 실험적 VFS 전용
  스토리지로 실행할 수 있습니다.
- 구성 및 명시적 자격 증명 파일만 예상되는 영구
  비데이터베이스 제어 파일로 남습니다.
- 저장소 검사는 레거시 런타임 파일 저장소가 다시 도입되는 것을 방지합니다.
