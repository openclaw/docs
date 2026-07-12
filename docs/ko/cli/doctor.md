---
read_when:
    - 연결/인증 문제가 있어 안내에 따라 해결하려고 합니다
    - 업데이트한 후 기본 점검을 원합니다
summary: '`openclaw doctor`의 CLI 참조(상태 검사 + 안내식 복구)'
title: Doctor
x-i18n:
    generated_at: "2026-07-12T15:04:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4e616fd0843183167662292acf501297f44520050b664796fbb15a117cb68905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway, 채널, Plugin, Skills, 모델 라우팅, 로컬 상태 및 구성 마이그레이션에 대한 상태 점검과 빠른 수정 기능입니다. 무언가 예상대로 작동하지 않아 하나의 명령으로 문제를 파악하려는 경우 사용하십시오.

관련 문서:

- 문제 해결: [문제 해결](/ko/gateway/troubleshooting)
- 보안 감사: [보안](/ko/gateway/security)

## 작동 방식

Doctor에는 다섯 가지 작동 방식이 있습니다.

| 작동 방식                | 명령                                      | 동작                                                                                   |
| ------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| 검사                     | `openclaw doctor`                         | 사람을 위한 점검과 안내형 프롬프트를 제공합니다.                                      |
| 복구                     | `openclaw doctor --fix`                   | 지원되는 복구를 적용하며, 비대화형 복구가 안전한 경우를 제외하면 프롬프트를 사용합니다. |
| 린트                     | `openclaw doctor --lint`                  | CI, 사전 점검 및 검토 게이트를 위한 읽기 전용 구조화된 진단 결과를 제공합니다.         |
| 공유 SQLite 유지 관리    | `openclaw doctor --state-sqlite compact`  | 표준 공유 상태 DB를 명시적으로 체크포인트하고 압축한 후 검증합니다.                    |
| 세션 SQLite 마이그레이션 | `openclaw doctor --session-sqlite <mode>` | 세션 상태를 검사, 가져오기, 검증, 압축, 복구 또는 복원합니다.                          |

자동화에 안정적인 결과가 필요한 경우 `--lint`를 사용하십시오. 운영자가 doctor를 통해 구성 또는 상태를 편집하려는 경우 `--fix`를 사용하십시오.

## 예시

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

채널별 권한을 확인하려면 `doctor` 대신 채널 프로브를 사용하십시오.

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities`는 특정 채널 대상에 대한 봇의 실효 권한을 보고합니다. `channels status --probe`는 구성된 모든 채널과 음성 자동 참여 대상을 감사합니다.

## 옵션

| 옵션                            | 효과                                                                                                                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`    | 워크스페이스 메모리/검색 제안을 비활성화합니다.                                                                                                                                                                    |
| `--yes`                         | 프롬프트를 표시하지 않고 기본값을 수락합니다.                                                                                                                                                                      |
| `--repair` / `--fix`            | 프롬프트 없이 권장되는 비서비스 복구를 적용합니다(`--fix`는 별칭입니다). Gateway 서비스 설치/재작성에는 여전히 대화형 확인 또는 명시적인 `gateway` 명령이 필요합니다.                                                |
| `--force`                       | 사용자 지정 서비스 구성 덮어쓰기를 포함한 강제 복구를 적용합니다.                                                                                                                                                 |
| `--non-interactive`             | 프롬프트 없이 실행하며, 안전한 마이그레이션과 비서비스 복구만 수행합니다.                                                                                                                                           |
| `--generate-gateway-token`      | Gateway 토큰을 생성하고 구성합니다.                                                                                                                                                                                |
| `--allow-exec`                  | 시크릿을 검증하는 동안 doctor가 구성된 `exec` SecretRefs를 실행하도록 허용합니다.                                                                                                                                  |
| `--deep`                        | 시스템 서비스에서 추가 Gateway 설치를 검사하고 최근 Gateway 감독자 재시작 인계 내역을 보고합니다.                                                                                                                 |
| `--lint`                        | 현대화된 상태 점검을 읽기 전용 모드로 실행하고 진단 결과를 출력합니다.                                                                                                                                             |
| `--post-upgrade`                | 업그레이드 후 Plugin 호환성 프로브를 실행합니다. 진단 결과는 stdout으로 출력되며, 오류 수준의 진단 결과가 하나라도 있으면 종료 코드가 1입니다.                                                                     |
| `--state-sqlite <mode>`         | 명시적인 공유 상태 SQLite 유지 관리를 실행합니다. 유일한 모드는 `compact`입니다.                                                                                                                                   |
| `--session-sqlite <mode>`       | 대상 세션 SQLite 마이그레이션 모드인 `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` 또는 `restore`를 실행합니다.                                                                                  |
| `--session-sqlite-store <path>` | `--session-sqlite`와 함께 사용하여 레거시 `sessions.json` 저장소 경로 하나를 선택합니다.                                                                                                                           |
| `--session-sqlite-agent <id>`   | `--session-sqlite`와 함께 사용하여 구성된 에이전트 하나를 선택합니다.                                                                                                                                               |
| `--session-sqlite-all-agents`   | `--session-sqlite`와 함께 사용하여 구성되거나 검색된 에이전트 저장소를 선택합니다.                                                                                                                                 |
| `--github-issue`                | `--session-sqlite recover`와 함께 사용하여 정리된 openclaw/openclaw 이슈 보고서를 준비합니다. `--yes` 또는 대화형 확인 후 doctor가 `gh`를 사용하여 이슈를 생성합니다.                                               |
| `--json`                        | `--lint` 사용 시 JSON 진단 결과를 출력합니다. `--post-upgrade` 사용 시 `{ probesRun, findings }`를 출력합니다. `--state-sqlite` 또는 `--session-sqlite` 사용 시 유지 관리 보고서를 JSON으로 출력합니다.             |
| `--severity-min <level>`        | `--lint`와 함께 사용하여 `info`, `warning` 또는 `error` 미만의 진단 결과를 제외합니다.                                                                                                                             |
| `--all`                         | `--lint`와 함께 사용하여 기본 집합에서 제외된 선택형 점검을 포함한 등록된 모든 점검을 실행합니다.                                                                                                                  |
| `--skip <id>`                   | `--lint`와 함께 사용하여 점검 ID를 건너뜁니다. 반복해서 지정할 수 있습니다.                                                                                                                                         |
| `--only <id>`                   | `--lint`와 함께 사용하여 지정된 점검 ID만 실행합니다. 반복해서 지정할 수 있습니다.                                                                                                                                  |

`--severity-min`, `--all`, `--only` 및 `--skip`은 `--lint`와 함께 사용할 때만 허용됩니다. `--json`은 `--lint`, `--post-upgrade`, `--state-sqlite` 및 `--session-sqlite`와 함께 사용할 수 있습니다.

## 린트 모드

`openclaw doctor --lint`는 읽기 전용입니다. 프롬프트, 복구 또는 구성/상태 재작성을 수행하지 않습니다.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

사람이 읽는 출력은 간결합니다.

```text
doctor --lint: 6개 점검 실행, 1개 진단 결과
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode이 설정되지 않았습니다. gateway 시작이 차단됩니다.
    수정: `openclaw configure`를 실행하여 Gateway 모드(local/remote)를 설정하거나 `openclaw config set gateway.mode local`을 실행하십시오.
```

JSON 출력은 스크립팅 인터페이스입니다.

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode이 설정되지 않았습니다. gateway 시작이 차단됩니다.",
      "path": "gateway.mode",
      "fixHint": "`openclaw configure`를 실행하여 Gateway 모드(local/remote)를 설정하거나 `openclaw config set gateway.mode local`을 실행하십시오."
    }
  ]
}
```

종료 코드:

| 코드 | 의미                                                       |
| ---- | ---------------------------------------------------------- |
| `0`  | 선택한 심각도 임계값 이상의 진단 결과가 없습니다.          |
| `1`  | 선택한 임계값을 충족하는 진단 결과가 하나 이상 있습니다.   |
| `2`  | 린트 진단 결과를 생성하기 전에 명령/런타임이 실패했습니다. |

`--severity-min`은 출력할 진단 결과와 종료 임계값을 모두 제어합니다. 심각도가 더 낮은 `info`/`warning` 진단 결과가 있더라도 `openclaw doctor --lint --severity-min error`는 아무것도 출력하지 않고 `0`으로 종료될 수 있습니다.

`--all`은 심각도 필터링 전에 선택되는 점검을 제어합니다. 기본 린트 실행에서는 심층적이거나 과거 상태를 확인하거나 복구 가능한 레거시 잔여물을 발견할 가능성이 높은 점검을 제외합니다. 전체 목록을 확인하려면 `--all`을 사용하십시오. `--only <id>`는 가장 정밀한 선택자이며 등록된 모든 점검을 ID로 실행할 수 있습니다.

`core/doctor/local-audio-acceleration`은 음성 모델을 로드하지 않고 자동 선택된 로컬 STT 명령, 지원 가능/요청됨/관찰됨 백엔드 증거를 각각 구분하여 표시하고 폴백 순서를 보고합니다. 정보 수준의 진단 결과를 출력하므로 표시하려면 `--severity-min info`를 포함하십시오.

## 구조화된 상태 점검

현대적인 doctor 점검은 작게 분리된 계약을 사용합니다.

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()`는 `doctor --lint`를 지원합니다. `repair()`는 선택 사항이며 `doctor --fix` / `doctor --repair`에서만 실행됩니다. 아직 이 형태로 마이그레이션되지 않은 점검은 기존 doctor 기여 흐름을 계속 사용합니다.

복구 컨텍스트는 `dryRun`/`diff` 요청을 전달할 수 있습니다. 복구 결과는 구조화된 `diffs`(구성/파일 편집)와 `effects`(서비스, 프로세스, 패키지, 상태 또는 기타 부수 효과)를 반환할 수 있으므로, 변환된 점검은 변경 계획을 `detect()`로 옮기지 않고도 `doctor --fix --dry-run`을 지원하는 방향으로 확장할 수 있습니다.

`repair()`는 `status: "repaired" | "skipped" | "failed"`를 보고합니다(상태를 생략하면 `repaired`를 의미합니다). 복구가 `skipped` 또는 `failed`를 반환하면 doctor는 이유를 보고하고 해당 점검에 대한 검증을 건너뜁니다. 복구에 성공하면 doctor는 복구된 진단 결과로 범위를 한정하여 `detect()`를 다시 실행합니다. 진단 결과가 여전히 존재하면 doctor는 변경이 완료된 것으로 처리하지 않고 복구 경고를 보고합니다.

진단 결과에는 다음이 포함됩니다:

| 필드              | 목적                                                           |
| ----------------- | -------------------------------------------------------------- |
| `checkId`         | 건너뛰기/전용 필터 및 CI 허용 목록에 사용하는 안정적인 ID입니다. |
| `severity`        | `info`, `warning` 또는 `error`입니다.                          |
| `message`         | 사람이 읽을 수 있는 문제 설명입니다.                           |
| `path`            | 사용 가능한 경우 구성, 파일 또는 논리적 경로입니다.            |
| `line` / `column` | 사용 가능한 경우 소스 위치입니다.                              |
| `ocPath`          | 검사가 특정 주소를 가리킬 수 있는 경우 정확한 `oc://` 주소입니다. |
| `fixHint`         | 권장 운영자 조치 또는 복구 요약입니다.                         |

현대화된 핵심 doctor 검사는 사람이 사용하는 `doctor` / `doctor --fix` 동작을 소유하는 순서 지정 doctor 기여 항목에 계속 연결됩니다. 공유 구조화 상태 레지스트리가 확장 지점입니다. 번들 및 Plugin 기반 검사는 소유 패키지가 활성 명령 경로에 등록된 후 핵심 doctor 검사 다음에 실행됩니다. `openclaw/plugin-sdk/health`는 Plugin 작성자에게 동일한 계약을 제공합니다.

## 검사 선택

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only`와 `--skip`은 전체 검사 ID를 허용하며 반복해서 지정할 수 있습니다. `--only` ID가 등록되지 않은 경우 해당 ID에 대해 검사가 실행되지 않습니다. 출력의 `checksRun`/`checksSkipped`를 사용하여 집중 게이트가 예상한 검사를 선택하는지 확인하십시오.

## 업그레이드 후 모드

`openclaw doctor --post-upgrade`는 빌드 또는 업그레이드 후 연속 실행하기 위한 Plugin 호환성 프로브를 실행합니다. 발견 사항은 stdout으로 출력되며, 발견 사항 중 하나라도 `level: "error"`이면 종료 코드는 1입니다. 기계가 읽을 수 있는 봉투 형식(`{ probesRun, findings }`)을 사용하려면 `--json`을 추가하십시오. 이 형식은 CI, 커뮤니티 `fork-upgrade` skill 및 기타 업그레이드 후 스모크 도구에 적합합니다. 설치된 Plugin 인덱스가 없거나 형식이 잘못된 경우에도 JSON 모드는 `plugin.index_unavailable` 오류 발견 사항을 포함한 봉투를 출력합니다.

컨테이너 이미지 시작은 일반적인 "업데이트 후 doctor 실행" 흐름의 예외입니다. 새 OpenClaw 버전에서 `openclaw gateway run`이 시작되면 준비 완료를 보고하기 전에 안전한 상태 및 Plugin 복구를 실행합니다. 복구를 안전하게 완료할 수 없으면 시작이 종료되며, 컨테이너를 정상적으로 다시 시작하기 전에 동일하게 마운트된 상태/구성을 대상으로 동일한 이미지를 `openclaw doctor --fix`와 함께 한 번 실행하라고 안내합니다.

## 공유 상태 SQLite Compaction

`openclaw doctor --state-sqlite compact`는 `<state-dir>/state/openclaw.sqlite`에 있는 정식 공유 상태 데이터베이스를 위한 명시적인 오프라인 유지 관리입니다. 임의의 데이터베이스 경로를 허용하지 않으며, 정상적인 Gateway 작업에서 호출되지 않고, `openclaw doctor --fix`의 일부도 아닙니다.

먼저 Gateway를 중지하고 검증된 백업을 생성하십시오.

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

이 명령은 다음을 수행합니다.

1. 정식 공유 상태 경로에 일반 파일이 있어야 합니다. 데이터베이스가 없으면 `skipped`로 보고하고 성공적으로 종료합니다.
2. 체크포인트를 수행하거나 파일을 변경하기 전에 현재 지원되는 스키마 버전과 `schema_meta.role = "global"`을 검증합니다.
3. 사용 중이 아닌 `wal_checkpoint(TRUNCATE)`가 필요합니다. 체크포인트가 사용 중이면 남아 있는 OpenClaw 프로세스를 모두 중지하고 다시 시도하십시오.
4. `auto_vacuum`을 `INCREMENTAL`로 설정하고 전체 `VACUUM`을 실행한 후 다시 체크포인트를 수행합니다.
5. `quick_check`, `integrity_check`, `foreign_key_check`를 실행한 다음 데이터베이스와 SQLite 사이드카 파일에 소유자 전용 권한을 다시 적용합니다.

JSON 출력은 Compaction 전후의 데이터베이스 및 WAL 크기, 프리리스트 페이지, 페이지 크기, `auto_vacuum` 값과 회수된 바이트 수, `quick_check` 및 `integrity_check` 결과를 보고합니다. `foreign_key_check`는 실패 시 차단 방식으로 강제되며 별도의 성공 필드가 없습니다. SQLite는 `auto_vacuum`을 없음은 `0`, 전체는 `1`, 증분은 `2`로 보고합니다.

스키마가 오래되었거나 실행 중인 OpenClaw 빌드보다 최신이거나 에이전트 데이터베이스에 속하는 경우 Compaction은 변경 없이 실패합니다. 이전 공유 상태 스키마의 경우 먼저 `openclaw doctor --fix`를 실행하십시오. 최신 스키마의 경우 호환되는 백업을 복원하거나 OpenClaw를 업그레이드하십시오.

## 세션 SQLite 마이그레이션

OpenClaw는 Gateway 시작 중과 `openclaw doctor --fix` 실행 중에 레거시 세션 행과 트랜스크립트 기록을 각 에이전트의 SQLite 데이터베이스로 자동으로 가져옵니다. `openclaw doctor --session-sqlite <mode>`는 해당 마이그레이션을 위한 대상 지정 검사 및 검증 도구입니다. 현재 런타임 세션 행은 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`에 있습니다. 레거시 `sessions.json` 파일은 마이그레이션 소스입니다. 활성 트랜스크립트 JSONL 파일은 성공적으로 가져온 후 활성 세션 디렉터리 밖으로 가져와 보관됩니다. 보관 계층 JSONL 파일은 런타임 폴백이 아니라 지원 아티팩트로 유지됩니다.

모드:

| 모드       | 동작                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | 가져오지 않고 레거시 및 SQLite 개수와 참조되지 않은 JSONL 파일을 읽습니다.                                       |
| `dry-run`  | 레거시 항목과 트랜스크립트 JSONL 파일을 파싱하고, 가져올 수 있는 행의 수를 계산하며, SQLite 행을 쓰지 않고 문제를 보고합니다. |
| `import`   | 선택한 대상의 레거시 항목과 트랜스크립트 이벤트를 SQLite로 가져옵니다.                                      |
| `validate` | 선택한 레거시 소스를 SQLite 행 및 트랜스크립트 이벤트 수와 비교합니다.                                   |
| `compact`  | 대량 삭제 또는 아카이브 정리 후 사용 가능한 페이지를 회수하도록 선택한 에이전트 SQLite 데이터베이스를 체크포인트하고 VACUUM을 실행합니다.    |
| `recover`  | 최근 실패한 마이그레이션 실행을 복원하고 대상을 검증한 후 정제된 GitHub 이슈 보고서를 준비합니다.            |
| `restore`  | SQLite 데이터를 삭제하지 않고 기록된 마이그레이션 매니페스트에서 보관된 트랜스크립트 아티팩트를 복원합니다.                  |

선택기:

- 기본값: 해당 레거시 저장소 파일이 존재할 때 구성된 기본 에이전트 저장소입니다.
- `--session-sqlite-agent <id>`: 구성된 에이전트 하나입니다.
- `--session-sqlite-all-agents`: 구성된 에이전트 저장소와 발견된 에이전트 저장소입니다.
- `--session-sqlite-store <path>`: 명시적으로 지정한 레거시 `sessions.json` 경로 하나입니다.

수동 검사 순서:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

중요한 기록이 있는 설치 환경에서 `import`를 실행하기 전에 OpenClaw 상태
디렉터리를 백업하십시오. 선택한 레거시 항목이 SQLite에 없거나, 세션 ID가
다르거나, 트랜스크립트 이벤트 수가 다르면 `validate`는 0이 아닌 값으로 종료됩니다.
`--session-sqlite-store <path>`를 사용할 때는 보고서에 예상한 대상 수가
포함되어 있는지 확인하십시오. 존재하지 않는 명시적 저장소 경로를 지정하면 대상이 선택되지 않습니다.

SQLite에서 삭제하면 먼저 데이터베이스 내부의 페이지를 회수하며, 데이터베이스 파일의
크기가 즉시 줄어든다고 보장되지는 않습니다. 대용량 트랜스크립트를 삭제하거나 보관한
후 `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`를
실행하여 WAL 파일을 체크포인트하고 `VACUUM`을 실행한 뒤 데이터베이스와 WAL의
실행 전후 크기를 보고하십시오. Compaction을 실행하려면 현재 에이전트 스키마가 적용된
일반 파일, 선택한 에이전트의 영구 소유자 메타데이터가 필요하며 doctor 프로세스에 열린
핸들이 없어야 합니다. 이는 명시적인 오프라인 유지 관리입니다. 일반 쓰기 작업이
체크포인트 또는 `VACUUM`과 경합하지 않도록 먼저 Gateway를 중지하십시오.

각 가져오기는 트랜스크립트 아티팩트를 아카이브로 이동하기 전에
`~/.openclaw/session-sqlite-migration-runs/` 아래에 매니페스트를 작성합니다.
아티팩트가 이동한 후 시작 시 세션 SQLite 마이그레이션 실패가 보고되면 복구를
실행하십시오.

```bash
openclaw doctor --session-sqlite recover --github-issue
```

복구는 최근 실패한 마이그레이션 매니페스트를 선택하고, 해당 매니페스트에 기록된
보관 아티팩트만 복원하며, 영향을 받은 대상을 검증하고, 정제된 `.failure.md` 및
`.failure.json` 보고서를 갱신한 후 트랜스크립트 내용, 원시 환경, 비밀 정보 및
제한되지 않은 구성을 제외한 GitHub 이슈 본문을 준비합니다. 실패한 마이그레이션
매니페스트가 없지만 선택한 에이전트 SQLite 데이터베이스가 손상되었거나 데이터베이스가
아니거나 주 데이터베이스 없이 저널 사이드카만 있는 경우, 복구는 전체 파일 세트를
임시 검사 디렉터리로 복사합니다. 원본 포렌식 파일을 변경하지 않은 상태에서 SQLite는
폐기 가능한 복사본의 유효한 핫 저널을 롤백한 후 `quick_check`, `integrity_check`,
`foreign_key_check`를 실행할 수 있습니다. 무결성 검사 실패 또는 고아 사이드카가
발견되면 발견된 전체 세트의 이름에 하나의 `.corrupt-<timestamp>` 접미사를 추가하여
DB, WAL, SHM 및 롤백 저널 파일을 보존합니다. 이름 변경 실패가 포착되면 실패를
보고하기 전에 이미 이동된 파일을 롤백하므로 복구 가능한 파일 세트가 아무런 알림 없이
분리되지 않습니다. 복구 전에 Gateway를 중지하십시오. 활발하게 변경 중인 SQLite
파일 세트를 복사하거나 이름을 변경하는 것은 안전하지 않으며 운영 체제마다 동작이
다릅니다. `--github-issue --yes`를 사용하면 doctor가 GitHub CLI를 사용하여
`openclaw/openclaw`에 이슈를 생성합니다. 확인 옵션이 없으면 로컬 지원 보고서를
작성하고 미리 채워진 이슈 URL을 출력합니다.

`restore`는 하위 수준의 실행 취소 작업으로 유지됩니다. 매니페스트의
`sourcePath -> archivePath` 레코드를 사용하며, 원래 경로가 없을 때만 보관된
아티팩트를 다시 이동하고, 두 경로가 모두 존재하면 충돌을 보고하며, SQLite
데이터베이스는 그대로 둡니다.

### 세션 SQLite 마이그레이션 후 다운그레이드

파일 기반의 이전 OpenClaw 버전을 시작하기 전에 보관된 레거시 트랜스크립트
아티팩트를 복원하십시오.

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

이전 버전은 `sessions.json` 항목과 해당 항목에 기록된 `sessionFile` 경로를
읽습니다. SQLite 마이그레이션 후 성공적으로 가져오면 활성 JSONL 트랜스크립트가
`session-sqlite-import-archive/`로 이동하므로, 복원이 매니페스트에 기록된
아티팩트를 원래 경로로 되돌릴 때까지 이전 런타임에서는 해당 기록을 볼 수 없습니다.

복원은 SQLite 데이터를 삭제하지 않습니다. SQLite 전환 후 생성된 세션은 SQLite에만
존재하며 이전 런타임에는 표시되지 않습니다. 나중에 다시 업그레이드하는 경우 위의
일반 마이그레이션 검증 순서를 실행하여 OpenClaw가 가져오기 전에 복원된 레거시
아티팩트를 SQLite 행과 비교할 수 있도록 하십시오.

## 참고 사항

- Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 읽기 전용 doctor 검사가 계속 작동하지만, `openclaw.json`이 변경 불가능하므로 `doctor --fix`, `doctor --repair`, `doctor --yes`, `doctor --generate-gateway-token`은 비활성화됩니다. 대신 이 설치의 Nix 소스를 편집하십시오. nix-openclaw의 경우 에이전트 우선 [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하십시오.
- 대화형 프롬프트(키체인/OAuth 수정 등)는 stdin이 TTY이고 `--non-interactive`가 설정되지 **않은** 경우에만 실행됩니다. 헤드리스 실행(cron, Telegram, 터미널 없음)에서는 프롬프트를 건너뜁니다.
- 비대화형 `doctor` 실행은 헤드리스 상태 검사를 빠르게 유지하기 위해 선제적 Plugin 로드를 건너뜁니다. 대화형 세션에서는 기존 상태 확인/복구 흐름에 필요한 Plugin 표면을 계속 로드합니다.
- `--lint`는 `--non-interactive`보다 엄격합니다. 항상 읽기 전용이며, 프롬프트를 표시하지 않고, 안전한 마이그레이션도 적용하지 않습니다. doctor가 변경 사항을 적용하도록 하려면 `doctor --fix` 또는 `doctor --repair`를 사용하십시오.
- Doctor는 기본적으로 시크릿을 검사할 때 `exec` SecretRef를 실행하지 않습니다. 구성된 시크릿 리졸버를 doctor가 실행하도록 의도한 경우에만 `--allow-exec`를 사용하십시오(`--lint` 사용 여부와 무관).
- 모든 구성 쓰기(`--fix` 복구 포함)는 백업을 `~/.openclaw/openclaw.json.bak`로 순환하며, 번호가 지정된 `.bak.1`..`.bak.4` 링을 사용합니다. 또한 `--fix`는 스키마 검증에서 보고된 알 수 없는 구성 키를 제거하고 각 제거 항목을 나열합니다. 단, 업데이트가 진행 중일 때는 부분적으로 작성된 업그레이드 상태가 마이그레이션 완료 전에 제거되지 않도록 이 작업을 건너뜁니다.
- 다른 감독자가 Gateway 수명 주기를 관리하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하십시오. Doctor는 계속 Gateway/서비스 상태를 보고하고 서비스 외 복구를 적용하지만, 서비스 설치/시작/재시작/부트스트랩 및 기존 서비스 정리는 건너뜁니다.
- Linux에서 doctor는 비활성 상태인 추가 Gateway 유사 systemd 유닛을 무시하며, 복구 중 실행 중인 systemd Gateway 서비스의 명령/진입점 메타데이터를 다시 작성하지 않습니다. 먼저 서비스를 중지하거나 `openclaw gateway install --force`를 사용하여 활성 런처를 교체하십시오.
- `doctor --fix --non-interactive`는 누락되거나 오래된 Gateway 서비스 정의를 보고하지만, 업데이트 복구 모드 외부에서는 이를 설치하거나 다시 작성하지 않습니다. 서비스가 누락된 경우 `openclaw gateway install`을 실행하고, 런처를 교체하려면 `openclaw gateway install --force`를 실행하십시오.
- 상태 무결성 검사는 세션 디렉터리에서 고아 트랜스크립트 파일을 감지합니다. 이를 `.deleted.<timestamp>`로 보관하려면 대화형 확인이 필요하며, `--fix`, `--yes`, 헤드리스 실행에서는 해당 파일을 그대로 둡니다.
- Doctor는 `~/.openclaw/cron/jobs.json`(또는 `cron.store`)에서 기존 cron 작업 형식을 검사하고, 표준 행을 SQLite로 가져오기 전에 이를 다시 작성합니다.
- Doctor는 명시적인 `payload.model` 재정의가 있는 cron 작업을 보고하며, 여기에는 제공자 네임스페이스별 개수와 `agents.defaults.model`과의 불일치가 포함됩니다. 따라서 기본 모델을 상속하지 않는 예약 작업을 인증 또는 결제 조사 중에 확인할 수 있습니다.
- Doctor는 여전히 실행 중으로 표시된(`state.runningAtMs`) cron 작업을 보고합니다. 이 상태로 인해 `openclaw cron list`에서 해당 작업이 `running`으로 표시될 수 있습니다. 이 검사는 읽기 전용입니다. 현재 어떤 Gateway도 표시된 작업을 실행하고 있지 않다면, 다음 cron 서비스 시작 시 중단된 실행을 기록하고 해당 표시를 지웁니다.
- Linux에서 doctor는 사용자의 crontab이 더 이상 유지 관리되지 않는 기존 `~/.openclaw/bin/ensure-whatsapp.sh`를 여전히 실행할 경우 경고합니다. cron에 systemd 사용자 버스 환경이 없으면 이 스크립트가 `Gateway inactive`를 잘못 보고할 수 있습니다.
- WhatsApp이 활성화된 경우 doctor는 로컬 `openclaw-tui` 클라이언트가 계속 실행 중인 상태에서 성능이 저하된 Gateway 이벤트 루프가 있는지 검사합니다. `doctor --fix`는 검증된 로컬 TUI 클라이언트만 중지하여 WhatsApp 응답이 오래된 TUI 새로 고침 루프 뒤에 대기하지 않도록 합니다.
- Doctor는 기본 모델, 폴백, 이미지/동영상 생성 모델, heartbeat/하위 에이전트/compaction 재정의, 훅, 채널 모델 재정의, 오래된 세션 경로 고정 전반에서 기존 `openai-codex/*` 모델 참조를 표준 `openai/*` 참조로 다시 작성합니다. 또한 `--fix`는 기존 `openai-codex:*` 인증 프로필과 `auth.order.openai-codex` 항목을 `openai:*`로 마이그레이션하고, Codex 의도를 제공자/모델 범위의 `agentRuntime.id: "codex"` 항목으로 이동하며, 오래된 전체 에이전트/세션 런타임 고정을 제거하고, 복구된 OpenAI 에이전트 참조가 직접 OpenAI API 키 인증 대신 Codex 인증 라우팅을 계속 사용하도록 합니다.
- Doctor는 참조하는 프로필이 모두 사라졌지만 호환되는 저장 자격 증명이 존재하는 비어 있지 않은 `auth.order.<provider>` 목록을 보고합니다. `doctor --fix`는 이러한 오래된 재정의만 삭제하여 에이전트별 자동 자격 증명 선택을 복원합니다. 명시적으로 비어 있는 순서, 일부 항목이 여전히 유효한 목록, 호환되는 저장 자격 증명이 없는 순서는 변경하지 않습니다. 활성 SQLite 인증 저장소를 읽을 수 없거나 형식이 잘못된 경우 doctor는 이 복구를 건너뛴 이유를 설명합니다. 실행 중인 Gateway의 구성 다시 로드 모드가 쓰기 내용을 자동으로 적용하지 않는다면, 인증 상태를 다시 확인하기 전에 Gateway를 재시작하십시오.
- Doctor는 이전 OpenClaw 버전의 기존 Plugin 종속성 스테이징 상태를 정리하고, 호스트 `openclaw` 패키지를 피어 종속성으로 선언한 관리형 npm Plugin에 대해 해당 패키지를 다시 연결합니다. 또한 구성에서 참조하지만 누락된 다운로드 가능 Plugin(`plugins.entries`, 구성된 채널, 구성된 제공자/검색 설정, 구성된 에이전트 런타임)을 복구합니다. 패키지 업데이트 중에는 패키지 교체가 완료될 때까지 패키지 관리자 Plugin 복구를 건너뜁니다. 구성된 Plugin에 여전히 복구가 필요하면 이후 `openclaw doctor --fix`를 다시 실행하십시오. 다운로드가 실패하면 doctor는 설치 오류를 보고하고 다음 복구 시도를 위해 구성된 Plugin 항목을 보존합니다.
- Plugin 검색이 정상인 경우 doctor는 `plugins.allow`/`plugins.deny`/`plugins.entries`에서 누락된 Plugin ID를 제거하고, 일치하는 연결 끊긴 채널 구성, Heartbeat 대상, 채널 모델 재정의도 함께 제거하여 오래된 Plugin 구성을 복구합니다.
- Doctor는 영향을 받는 `plugins.entries.<id>` 항목을 비활성화하고 유효하지 않은 `config` 페이로드를 제거하여 잘못된 Plugin 구성을 격리합니다. Gateway 시작 시 이미 문제가 있는 해당 Plugin만 건너뛰므로 다른 Plugin과 채널은 계속 실행됩니다.
- Doctor는 폐기된 `plugins.entries.codex.config.codexDynamicToolsProfile`을 제거합니다. Codex 앱 서버는 항상 Codex 네이티브 작업 공간 도구를 네이티브 상태로 유지합니다.
- Doctor는 기존의 평면 Talk 구성(`talk.voiceId`, `talk.modelId` 등)을 `talk.provider` + `talk.providers.<provider>`로 자동 마이그레이션합니다. 유일한 차이가 객체 키 순서뿐인 경우 `doctor --fix`를 반복 실행해도 더 이상 Talk 정규화를 보고하거나 적용하지 않습니다.
- Doctor에는 메모리 검색 준비 상태 검사가 포함되며, 임베딩 자격 증명이 누락된 경우 `openclaw configure --section model`을 권장할 수 있습니다.
- Doctor는 명령 소유자가 구성되지 않은 경우 경고합니다. 명령 소유자는 소유자 전용 명령을 실행하고 위험한 작업을 승인할 수 있는 인간 운영자 계정입니다. DM 페어링은 누군가가 봇과 대화할 수 있게만 합니다. 최초 소유자 부트스트랩이 존재하기 전에 발신자를 승인했다면 `commands.ownerAllowFrom`을 명시적으로 설정하십시오.
- Doctor는 Codex 모드 에이전트가 구성되어 있고 운영자의 Codex 홈에 개인 Codex CLI 자산이 존재하는 경우 정보 메모를 보고합니다. 로컬 Codex 앱 서버 실행은 격리된 에이전트별 홈을 사용합니다. 필요한 경우 먼저 Codex Plugin을 설치한 다음, 의도적으로 승격해야 하는 자산의 목록을 작성하려면 `openclaw migrate plan codex`를 사용하십시오.
- Doctor는 기본 에이전트에 허용된 스킬을 현재 런타임 환경에서 사용할 수 없는 경우(바이너리, 환경 변수, 구성 또는 OS 요구 사항 누락) 경고합니다. `doctor --fix`는 `skills.entries.<skill>.enabled=false`를 사용하여 사용할 수 없는 해당 스킬을 비활성화할 수 있습니다. 스킬을 활성 상태로 유지하려면 대신 누락된 요구 사항을 설치하거나 구성하십시오.
- 샌드박스 모드가 활성화되어 있지만 Docker를 사용할 수 없는 경우 doctor는 해결 방법(`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)과 함께 명확한 경고를 보고합니다.
- 기존 샌드박스 레지스트리 파일 또는 샤드 디렉터리(`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/`, `~/.openclaw/sandbox/browsers/`)가 존재하면 doctor가 이를 보고합니다. `--fix`는 유효한 항목을 SQLite로 마이그레이션하고 유효하지 않은 기존 파일을 격리합니다.
- `gateway.auth.token`/`gateway.auth.password`가 SecretRef로 관리되며 현재 명령 경로에서 사용할 수 없는 경우 doctor는 읽기 전용 경고를 보고하고 평문 폴백 자격 증명을 쓰지 않습니다. exec 기반 SecretRef의 경우 `--allow-exec`가 없으면 doctor는 실행을 건너뜁니다.
- 수정 경로에서 채널 SecretRef 검사가 실패하면 doctor는 조기에 종료하지 않고 계속 진행하며 경고를 보고합니다.
- 상태 디렉터리 마이그레이션 후, 활성화된 기본 Telegram 또는 Discord 계정이 환경 변수 폴백에 의존하지만 doctor 프로세스에서 `TELEGRAM_BOT_TOKEN` 또는 `DISCORD_BOT_TOKEN`을 사용할 수 없는 경우 doctor가 경고합니다.
- Telegram `allowFrom` 사용자 이름 자동 확인(`doctor --fix`)에는 현재 명령 경로에서 확인 가능한 Telegram 토큰이 필요합니다. 토큰 검사를 사용할 수 없는 경우 doctor는 경고를 보고하고 해당 실행에서 자동 확인을 건너뜁니다.

## macOS: `launchctl` 환경 변수 재정의

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)을 실행했다면 해당 값이 구성 파일보다 우선하며 지속적인 "unauthorized" 오류를 일으킬 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 관련 문서

- [CLI 참조](/ko/cli)
- [Gateway doctor](/ko/gateway/doctor)
