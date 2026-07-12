---
read_when:
    - 라이브 Gateway를 대상으로 Path 3 SQLite 스토리지 전환을 검증하고 있습니다.
    - 예상된 레거시 JSONL 드리프트와 런타임 오류를 구분해야 합니다.
    - 에이전트 기반 라이브 SQLite E2E 하니스를 구축하거나 검토하고 있습니다
summary: Path 3 SQLite 세션/트랜스크립트 전환의 실시간 Gateway 검증 설계
title: 경로 3 라이브 SQLite E2E 하네스
x-i18n:
    generated_at: "2026-07-12T15:44:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

Path 3 라이브 SQLite E2E 하네스는 레거시 JSONL 파일이 마이그레이션 입력 또는 아카이브 자료로 남아 있는 동안 Gateway가 SQLite를 정식 세션 및 트랜스크립트 저장소로 사용하고 있음을 입증합니다. 이는 일반 사용자 진단 도구가 아니라 유지관리자용 검증 하네스입니다.

Gateway가 마이그레이션 후 트래픽을 처리한 뒤에는 레거시 JSONL 동등성이 더 이상 유효한 런타임 상태 신호가 아닙니다. 정상적으로 마이그레이션된 Gateway에서도 SQLite 트랜스크립트 행 수가 레거시 JSONL 개수와 다를 수 있습니다. 새 턴은 SQLite에서만 진행되어야 하기 때문입니다. 따라서 라이브 하네스는 각 단계에서 Gateway 동작, SQLite 행 변화, 레거시 파일의 비활성 상태, 로그 상태를 측정해야 합니다.

## 명령 형식

의도된 라이브 명령은 다음과 같습니다.

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

이 명령은 이미 실행 중인 Gateway에 연결합니다. 나중에 명시적 마이그레이션 모드가 추가되지 않는 한 마이그레이션을 시작하거나 중지하거나 가져오거나 다시 실행하지 않습니다. CI 또는 격리된 로컬 변형에서는 `test/helpers/openclaw-test-instance.ts`를 사용할 수 있지만, 라이브 검증 경로는 실제 운영자 Gateway와 에이전트별 실제 SQLite 데이터베이스를 검사해야 합니다.

## 격리된 빌드 CLI 검증

빌드된 CLI 검증 실행기는 격리된 레거시 세션 저장소에 시드 데이터를 넣고, 다시 빌드한 Gateway를 시작한 다음, 런타임 읽기가 시작되기 전에 시작 절차가 활성 레거시 세션을 SQLite로 가져오는지 입증합니다. 첫 번째 Gateway 시작 전에 `openclaw doctor --fix`를 실행해서는 안 됩니다. 그렇게 하면 전환 후 첫 부팅 시 사용자가 거치는 업그레이드 경로가 아니라 수동 마이그레이션 경로를 입증하게 됩니다.

시작 시 가져오기가 완료된 뒤 격리된 검증에서는 진단 증거로 `openclaw doctor --session-sqlite inspect`와 `openclaw doctor --session-sqlite validate`를 실행할 수 있습니다. 이러한 doctor 명령은 시작 업그레이드 검증의 마이그레이션 구동 수단이 아닙니다. 별도의 doctor 가져오기 시나리오에서는 레거시 트랜스크립트 파일과 trajectory 사이드카에 시드 데이터를 넣고, SQLite가 정식 저장소로 유지되는 동안 doctor가 해당 아티팩트를 아카이브하는지 확인해야 합니다.

## 사전 점검

사전 점검은 기준 상태를 수집하며, Gateway를 사용할 수 없으면 검증 턴을 전송하기 전에 실패합니다.

- `GET /health`와 Gateway 상세 상태는 실행 중이며 접근 가능한 Gateway를 보고해야 합니다.
- CLI 및 Gateway 버전은 테스트 중인 브랜치와 일치해야 합니다.
- 하네스는 활성 Gateway 파일 로그의 로그 커서를 기록합니다.
- 하네스는 `sessions`, `session_entries`, `transcript_events`, `transcript_event_identities`, `session_routes`에 대한 에이전트별 SQLite 테이블 행 수를 기록합니다.
- 하네스는 레거시 `sessions.json`, 참조된 JSONL 파일, 후보 검증 세션 JSONL 경로의 `mtime`, `size`, 존재 여부를 기록합니다.
- `lsof -p <gateway-pid>`에는 SQLite DB/WAL/SHM 핸들이 표시되어야 하며 활성 `.jsonl` 또는 `sessions.json` 핸들은 없어야 합니다.

라이브 모드에서 `openclaw doctor --session-sqlite validate`는 정보 제공용일 뿐입니다. 전환 후 트래픽이 발생하면 레거시 파일과 비교하여 예상된 차이를 보고할 수 있습니다. 하네스는 doctor 출력을 분류 및 마이그레이션 인벤토리에 사용해야 하며, 런타임 통과/실패 판정 기준으로 사용해서는 안 됩니다.

## 에이전트 구동 시나리오

라이브 시나리오는 전용 검증 세션 키를 사용하며, 가능한 경우 공개 RPC 경로를 통해 Gateway를 구동합니다. 일반적인 영속성을 실행하는 데는 에이전트 턴 하나면 충분하지만, 전체 검증에서는 이전에 개별 라이브 점검이 필요했던 3.1b 연결부를 다뤄야 합니다.

- 일반 채팅 턴: 검증 세션을 생성하거나 재사용하고, 실제 에이전트 프롬프트를 전송하고, 최종 어시스턴트 결과를 기다린 다음, `chat.history` 또는 이에 상응하는 Gateway 프로젝션을 확인합니다.
- 트랜스크립트 ID: 동일한 마커가 Gateway 기록과 SQLite 트랜스크립트 행에 나타나는지 확인하며, 존재하는 경우 안정적인 이벤트 ID 행도 포함합니다.
- 세션 메타데이터 접근자: Gateway/세션 접근자를 통해 검증 세션과 선택한 기존 라이브 세션을 읽고 SQLite 행과 비교합니다.
- 세션 패치 프로젝션: 검증 세션에 되돌릴 수 있는 모델/세션 메타데이터 변경을 적용한 다음, 프로젝션된 행과 Gateway 응답이 일치하는지 확인합니다.
- Compaction 체크포인트 수명 주기: 검증 세션 또는 하네스가 생성한 합성 픽스처 세션에서만 체크포인트를 나열하고, 분기하고, 복원합니다.
- 재시작 복구: 제어된 검증 세션 또는 격리된 테스트 인스턴스에서 안전한 복구 마커 경로를 실행합니다. 라이브 모드에서는 대상 세션 집합이 명시적이고 되돌릴 수 있는 경우에만 이 단계를 실행할 수 있습니다.
- 정리 수명 주기: 검증 세션을 삭제하거나 초기화한 다음 SQLite 수명 주기 행과 아카이브된 트랜스크립트 상태를 확인합니다.

WhatsApp 또는 음성 통화 인그레스처럼 실제 운영자 Gateway에서 안전하게 실행할 수 없는 전송 방식별 연결부는 외부 전송을 모조하는 대신 동일한 SQLite 계약을 대상으로 하는 소유자 수준 런타임 프로브를 사용해야 합니다.

## 단계별 어설션

각 단계는 전후 상태의 스냅샷을 생성하고 구조화된 어설션 레코드를 기록합니다.

- SQLite 행 수는 예상된 위치에서만 증가합니다.
- 런타임 이벤트를 기록하는 마커 기반 검증 세션에서는 trajectory 런타임 행이 증가합니다.
- 검증 세션 행에는 예상된 `session_id`, 상태, 타임스탬프, 메타데이터, 라우트 행이 있습니다.
- Gateway 기록/세션 프로젝션은 SQLite 트랜스크립트 끝부분과 일치합니다.
- 검증 세션 JSONL 파일이 생성되거나 수정되지 않습니다.
- 검증 세션 `.trajectory.jsonl`, `.trajectory-path.json` 또는 마커에서 파생된 `trajectory/<session>.jsonl` 사이드카가 생성되지 않습니다.
- 단계가 명시적인 오프라인 마이그레이션 또는 아카이브 작업이 아닌 한 기존 레거시 JSONL 파일과 `sessions.json`은 변경되지 않습니다.
- Gateway 프로세스는 `.jsonl` 또는 `sessions.json` 핸들을 열지 않습니다.
- 시나리오에서 명시적으로 허용 목록에 추가하지 않는 한 이전 커서 이후의 로그에는 `ERROR`, `FATAL`, `SQLITE_`, `no such column`, 세션 저장소 사용 불가, 재시작 복구 실패 또는 트랜스크립트 조정 경고가 없어야 합니다.

로그 스캔은 통과/실패 계약의 일부입니다. 상태 점검에는 응답하지만 SQLite 스키마 오류 또는 반복되는 트랜스크립트 조정 실패를 내보내는 Gateway는 Path 3에서 정상으로 판정되지 않습니다.

## 증거 아티팩트

하네스는 `.artifacts/path3-live-e2e/<timestamp>/` 아래에 증거를 기록하고 git에는 포함하지 않아야 합니다.

- `summary.json`: 명령 인수, Gateway 버전, 결과, 실패한 어설션, 아티팩트 경로.
- `sqlite-before.json` 및 `sqlite-after.json`: 행 수와 선택된 검증 행.
- `legacy-files.json`: 레거시 파일 존재 여부, `mtime`, 크기, 각 파일의 변경 여부.
- `gateway-log-scan.json`: 커서 범위, 일치한 로그 줄, 허용 목록 판정.
- `events.jsonl`: PR 검증 댓글에 적합한 순서가 지정된 단계별 관찰 결과.

PR 검증에서는 전체 트랜스크립트 또는 비공개 메시지 내용을 붙여 넣는 대신 이러한 아티팩트를 요약해야 합니다.

## 안전 규칙

- 라이브 모드에서는 Gateway가 실행 중일 때 레거시 JSONL을 다시 가져와서는 안 됩니다.
- 라이브 모드에서는 명시적으로 선택한 되돌릴 수 있는 복구 프로브를 제외하고 검증용이 아닌 세션을 변경해서는 안 됩니다.
- 파괴적이거나 광범위한 마이그레이션 단계에는 영향을 받는 SQLite DB와 레거시 세션 디렉터리의 새 백업이 필요합니다.
- 백업은 변경 대상 에이전트 DB/세션 디렉터리로 범위를 제한하고, 디스크 사용량이 제한 없이 증가하지 않도록 한 번의 검증 실행 동안 재사용해야 합니다.
- 호출자가 `--keep-artifacts`를 전달하지 않는 한 정리 단계 후에는 검증 세션, 검증 JSONL 또는 수정된 레거시 파일이 남아 있어서는 안 됩니다.

## 통과 결과

라이브 실행이 통과했다는 것은 Gateway가 실제 에이전트 구동 세션 흐름을 수락했고, 관찰된 모든 정식 상태가 SQLite에 있었으며, 레거시 런타임 파일이 비활성 상태로 유지되고, 측정된 기간 동안 로그 상태가 깨끗하게 유지되었음을 의미합니다. 라이브 트래픽 이후에도 레거시 JSONL 동등성이 유지된다는 의미는 아닙니다. SQLite가 정식 저장소가 되면 라이브 상태 차이가 발생하는 것이 정상입니다.
