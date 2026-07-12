---
read_when:
    - clawdbot-d63.2 / clawdbot-04b를 구현하고 있습니다.
    - SQLite 세션 보존, 재설정, 삭제 또는 에이전트 삭제 시 보관 기능을 수정하는 경우
    - SQLite 시대의 아티팩트 계열과 레거시 JSONL 사이드카를 구분해야 합니다
summary: 세션에 속한 모든 SQLite 트랜스크립트 아티팩트를 보관하기 위한 경로 3 계획
title: 경로 3 SQLite 세션 아티팩트 계열
x-i18n:
    generated_at: "2026-07-12T15:25:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# 경로 3 SQLite 세션 아티팩트 패밀리

이 메모에서는 `clawdbot-d63.2`의 범위를 정합니다. 한편 `clawdbot-d63.1`은 `src/config/sessions/session-accessor.sqlite.ts`에서 범위가 겹치는 재설정/삭제 아카이브 헬퍼를 담당합니다.
이번 작업 중 구현 파일에 커밋되지 않은 변경 사항이 있었으므로, 이 아티팩트에는 다른 작업자와 충돌하지 않도록 정확한 계약과 패치 지점을 기록합니다.

## 권위 있는 패밀리

SQLite 전환 후 활성 세션 트랜스크립트는 SQLite 행입니다. 세션의 아카이브 패밀리는 다음과 같습니다.

- 항목의 현재 `sessionId`에 해당하는 `transcript_events`, `transcript_event_identities`, `sessions` 행
- `entry.compactionCheckpoints[*].preCompaction.sessionId`가 참조하는 모든 `sessionId`에 해당하는 동일한 SQLite 트랜스크립트 행 집합
- `entry.compactionCheckpoints[*].postCompaction.sessionId`가 참조하는 모든 `sessionId`에 해당하는 동일한 SQLite 트랜스크립트 행 집합
- `entry.usageFamilySessionIds`의 모든 `sessionId`에 해당하는 동일한 SQLite 트랜스크립트 행 집합

남아 있는 어떤 `session_entries` 행에서도, 또는 남아 있는 어떤 항목의 Compaction이나 사용량 패밀리 메타데이터에서도 더 이상 참조하지 않는 행만 아카이브하십시오. 이렇게 하면 마지막 활성 참조가 사라질 때까지 체크포인트 분기/복원 및 사용량 롤업 상태가 보존됩니다.

## 전환 후 패밀리가 아닌 아티팩트

생성된 주제 트랜스크립트 파일 변형과 트래젝터리 사이드카는 활성 SQLite 런타임 상태가 아닙니다. 이는 레거시 파일 아티팩트입니다.

- `<sessionId>-topic-<thread>.jsonl` 같은 주제 변형은 파일 기반 트랜스크립트 형식에만 존재합니다. SQLite는 주제별 JSONL 파일 대신 정규 세션 ID와 `session_routes`/항목 전달 메타데이터를 사용합니다.
- `.trajectory.jsonl` 및 `.trajectory-path.json` 같은 트래젝터리 사이드카는 실제 JSONL `sessionFile` 경로를 기반으로 이름이 지정됩니다. SQLite `sessionFile` 값은 `sqlite:<agentId>:<sessionId>:<storePath>` 마커이며 사이드카 파일을 나타내지 않습니다.
- 아카이브 계층 리더는 레거시 아카이브 JSONL 파일을 계속 읽어야 하지만, 런타임 보존 처리는 활성 세션 디렉터리를 스캔하거나 SQLite 세션의 JSONL 트랜스크립트 파일을 다시 열어서는 안 됩니다.

Doctor 가져오기는 레거시 기본 JSONL 파일과 인접한 트래젝터리 사이드카의 마이그레이션 담당자로 유지됩니다. 런타임 SQLite 보존 처리에 두 번째 가져오기 도구나 파일 폴백을 추가해서는 안 됩니다.

## 패치 지점

병렬 경로를 추가하지 말고 `clawdbot-d63.1`에서 도입한 SQLite 아카이브 헬퍼를 확장하십시오.

1. `deleteSqliteSessionStateIfUnreferenced` 근처에 로컬 수집기를 추가합니다.
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - `entry.sessionId`, 체크포인트의 전/후 세션 ID 및 `usageFamilySessionIds`를 포함합니다.
   - 빈 문자열을 필터링하고 결정론적으로 중복을 제거합니다.

2. 제거 후 저장소를 위한 참조 수집기를 추가합니다.
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - 현재 `session_entries`를 순회하고 각 `entry_json`을 파싱한 다음, 남아 있는 모든 항목에서 동일한 패밀리 ID를 수집합니다.

3. 현재 제거된 `sessionId` 하나를 아카이브하는 재설정/삭제/유지관리 호출자가 제거된 항목의 전체 패밀리를 전달하도록 변경합니다.

4. 각 패밀리 ID에 대해 호출자의 사유(`reset` 또는 `deleted`)로 SQLite 트랜스크립트 행을 아카이브한 다음, 해당 패밀리 ID가 제거 후 참조 집합에 없을 때만 `sessions` 행을 삭제합니다.

5. 기존 SQLite 세션 행 정리 경로를 통해 트랜스크립트 이벤트 삭제를 중앙화된 상태로 유지합니다. 활성 JSONL 읽기를 추가하지 마십시오.

## 집중 테스트

`clawdbot-d63.1`이 커밋된 후 `src/config/sessions/session-accessor.conformance.test.ts` 또는 같은 계층의 수명 주기 테스트에 SQLite 전용 테스트를 추가합니다.

- Compaction 이전 트랜스크립트가 있는 항목을 삭제하면 현재 세션과 Compaction 이전 세션이 모두 아카이브된 후, 두 SQLite 행 집합이 모두 제거됩니다.
- Compaction 이전 세션을 공유하는 두 항목 중 하나를 삭제하면, 마지막으로 참조하는 항목이 제거될 때까지 공유된 이전 세션에 대해서는 아무것도 아카이브되지 않습니다.
- `usageFamilySessionIds`가 있는 항목을 삭제하면 다른 항목에서 해당 사용량 패밀리를 참조하지 않을 때 선행 SQLite 트랜스크립트 행이 아카이브됩니다.
- SQLite 마커가 있는 주제 형태의 세션 키로 인해 생성된 주제 JSONL 읽기 또는 사이드카 조회가 발생하지 않습니다.

집중 검증에는 다음을 사용해야 합니다.

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

최종 테스트가 `store.session-lifecycle-mutation.test.ts`에 있다면 동일한 래퍼로 해당 파일을 명시적으로 실행하십시오. 이 Codex 작업 트리의 광범위한 `pnpm` 게이트는 Crabbox/Testbox에서 실행해야 합니다.
