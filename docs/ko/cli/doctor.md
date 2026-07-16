---
read_when:
    - 연결/인증 문제가 있어 안내에 따른 해결 방법을 원합니다
    - 업데이트했으며 정상 여부를 확인하려고 합니다
summary: '`openclaw doctor`용 CLI 참조(상태 점검 + 안내식 복구)'
title: Doctor
x-i18n:
    generated_at: "2026-07-16T12:28:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Gateway, 채널, Plugin, Skills, 모델 라우팅, 로컬 상태 및 구성 마이그레이션에 대한 상태 검사와 빠른 수정 기능입니다. 무언가 예상대로 작동하지 않아 하나의 명령으로 문제의 원인을 파악하려는 경우 사용하십시오.

관련 항목:

- 문제 해결: [문제 해결](/ko/gateway/troubleshooting)
- 보안 감사: [보안](/ko/gateway/security)

## 실행 방식

Doctor에는 다섯 가지 실행 방식이 있습니다.

| 실행 방식               | 명령                                      | 동작                                                                            |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| 검사                    | `openclaw doctor`                        | 사람 중심의 검사와 안내 프롬프트를 제공합니다.                                  |
| 복구                    | `openclaw doctor --fix`                        | 비대화형 복구가 안전한 경우를 제외하고 프롬프트를 사용하여 지원되는 복구를 적용합니다. |
| 린트                    | `openclaw doctor --lint`                        | CI, 사전 검사 및 검토 게이트를 위한 읽기 전용 구조화 결과를 제공합니다.          |
| 공유 SQLite 유지 관리   | `openclaw doctor --state-sqlite compact`                        | 표준 공유 상태 DB를 명시적으로 체크포인트하고, 압축하고, 검증합니다.             |
| 세션 SQLite 마이그레이션 | `openclaw doctor --session-sqlite <mode>`                       | 세션 상태를 검사, 가져오기, 검증, 압축, 복구 또는 복원합니다.                    |

자동화에 안정적인 결과가 필요한 경우 `--lint`을(를) 사용하십시오. 운영자가 Doctor를 통해 구성이나 상태를 편집하려는 경우 `--fix`을(를) 사용하십시오.

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

채널별 권한에는 `doctor` 대신 채널 프로브를 사용하십시오.

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities`은(는) 특정 채널 대상에서 봇에 실제로 적용되는 권한을 보고합니다. `channels status --probe`은(는) 구성된 모든 채널과 음성 자동 참여 대상을 감사합니다.

## 옵션

| 옵션                            | 효과                                                                                                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`              | 워크스페이스 메모리/검색 제안을 비활성화합니다.                                                                                                                                          |
| `--yes`              | 프롬프트 없이 기본값을 수락합니다.                                                                                                                                                       |
| `--repair` / `--fix` | 프롬프트 없이 권장되는 비서비스 복구를 적용합니다(`--fix`은(는) 별칭입니다). Gateway 서비스 설치/재작성에는 여전히 대화형 확인 또는 명시적인 `gateway` 명령이 필요합니다. |
| `--force`              | 사용자 지정 서비스 구성 덮어쓰기를 포함한 강제 복구를 적용합니다.                                                                                                                       |
| `--non-interactive`              | 프롬프트 없이 실행하며 안전한 마이그레이션과 비서비스 복구만 수행합니다.                                                                                                                 |
| `--generate-gateway-token`              | Gateway 토큰을 생성하고 구성합니다.                                                                                                                                                     |
| `--allow-exec`              | 비밀 정보를 검증하는 동안 Doctor가 구성된 `exec` SecretRefs를 실행하도록 허용합니다.                                                                                        |
| `--deep`              | 추가 Gateway 설치가 있는지 시스템 서비스를 검사하고 최근 Gateway 감독자의 재시작 인계 내역을 보고합니다.                                                                                |
| `--lint`              | 최신 상태 검사를 읽기 전용 모드로 실행하고 진단 결과를 출력합니다.                                                                                                                      |
| `--post-upgrade`              | 업그레이드 후 Plugin 호환성 프로브를 실행합니다. 결과는 표준 출력으로 전송되며 오류 수준 결과가 하나라도 있으면 종료 코드가 1입니다.                                                     |
| `--state-sqlite <mode>`              | 명시적인 공유 상태 SQLite 유지 관리를 실행합니다. 유일한 모드는 `compact`입니다.                                                                                               |
| `--session-sqlite <mode>`              | 대상 세션 SQLite 마이그레이션 모드인 `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` 또는 `restore`을(를) 실행합니다. |
| `--session-sqlite-store <path>`              | `--session-sqlite`과 함께 사용하여 기존 `sessions.json` 저장소 경로 하나를 선택합니다.                                                                                               |
| `--session-sqlite-agent <id>`              | `--session-sqlite`과 함께 사용하여 구성된 에이전트 하나를 선택합니다.                                                                                                                    |
| `--session-sqlite-all-agents`              | `--session-sqlite`과 함께 사용하여 구성되거나 발견된 에이전트 저장소를 선택합니다.                                                                                                       |
| `--github-issue`              | `--session-sqlite recover`과 함께 사용하여 민감 정보가 제거된 openclaw/openclaw 이슈 보고서를 준비합니다. `--yes` 또는 대화형 확인 후 Doctor가 `gh`을(를) 사용해 이를 생성합니다. |
| `--json`              | `--lint`과 함께 사용하면 JSON 결과를 출력합니다. `--post-upgrade`과 함께 사용하면 `{ probesRun, findings }`입니다. `--state-sqlite` 또는 `--session-sqlite`과 함께 사용하면 유지 관리 보고서를 JSON으로 출력합니다. |
| `--severity-min <level>`              | `--lint`과 함께 사용하여 `info`, `warning` 또는 `error` 미만의 결과를 제외합니다.                                                             |
| `--all`              | `--lint`과 함께 사용하여 기본 집합에서 제외된 선택적 검사를 포함해 등록된 모든 검사를 실행합니다.                                                                              |
| `--skip <id>`              | `--lint`과 함께 사용하여 검사 ID 하나를 건너뜁니다. 반복해서 지정할 수 있습니다.                                                                                               |
| `--only <id>`              | `--lint`과 함께 사용하여 지정된 검사 ID만 실행합니다. 반복해서 지정할 수 있습니다.                                                                                             |

`--severity-min`, `--all`, `--only` 및 `--skip`은(는) `--lint`과 함께 사용한 경우에만 허용됩니다. `--json`은(는) `--lint`, `--post-upgrade`, `--state-sqlite` 및 `--session-sqlite`과 함께 사용할 수 있습니다.

## 린트 모드

`openclaw doctor --lint`은(는) 읽기 전용입니다. 프롬프트, 복구 및 구성/상태 재작성을 수행하지 않습니다.

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
doctor --lint: 검사 6개 실행, 결과 1개
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode가 설정되지 않았습니다. Gateway 시작이 차단됩니다.
    수정: `openclaw configure`를 실행하고 Gateway 모드(local/remote)를 설정하거나 `openclaw config set gateway.mode local`을 실행하십시오.
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
      "message": "gateway.mode가 설정되지 않았습니다. Gateway 시작이 차단됩니다.",
      "path": "gateway.mode",
      "fixHint": "`openclaw configure`를 실행하고 Gateway 모드(local/remote)를 설정하거나 `openclaw config set gateway.mode local`을 실행하십시오."
    }
  ]
}
```

종료 코드:

| 코드 | 의미                                                          |
| ---- | ------------------------------------------------------------- |
| `0` | 선택한 심각도 임계값 이상의 결과가 없습니다.                  |
| `1` | 하나 이상의 결과가 선택한 임계값을 충족합니다.                |
| `2` | 린트 결과를 생성하기 전에 명령/런타임 오류가 발생했습니다.    |

`--severity-min`은(는) 출력할 결과와 종료 임계값을 모두 제어합니다. 심각도가 더 낮은 `info`/`warning` 결과가 있더라도 `openclaw doctor --lint --severity-min error`은(는) 아무것도 출력하지 않고 `0`로 종료될 수 있습니다.

`--all`은(는) 심각도 필터링 전에 선택할 검사를 제어합니다. 기본 린트 실행에서는 심층적이거나 과거 상태를 다루거나 복구 가능한 기존 잔여물을 표시할 가능성이 높은 검사를 제외합니다. 전체 목록을 사용하려면 `--all`을(를) 사용하십시오. `--only <id>`은(는) 가장 정밀한 선택자로, 등록된 모든 검사를 ID로 실행할 수 있습니다.

`core/doctor/local-audio-acceleration`은(는) 음성 모델을 로드하지 않고 자동으로 선택된 로컬 STT 명령, 지원 가능/요청/관찰된 백엔드의 개별 증거 및 대체 순서를 보고합니다. 정보성 결과를 출력하므로 이를 표시하려면 `--severity-min info`을(를) 포함하십시오.

## 구조화된 상태 검사

최신 Doctor 검사는 간단히 분리된 계약을 사용합니다.

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()`은(는) `doctor --lint`을(를) 구동합니다. `repair()`은(는) 선택 사항이며 `doctor --fix` / `doctor --repair`에서만 실행됩니다. 아직 이 형태로 마이그레이션되지 않은 검사는 기존 Doctor 기여 흐름을 계속 사용합니다.

복구 컨텍스트에는 `dryRun`/`diff` 요청이 포함될 수 있습니다. 복구 결과는 구조화된 `diffs`(구성/파일 편집) 및 `effects`(서비스, 프로세스, 패키지, 상태 또는 기타 부작용)을 반환할 수 있으므로, 변환된 검사는 변경 계획을 `detect()`으로 옮기지 않고도 `doctor --fix --dry-run` 방향으로 발전할 수 있습니다.

`repair()`은(는) `status: "repaired" | "skipped" | "failed"`을(를) 보고합니다(상태가 생략되면 `repaired`을(를) 의미합니다). 복구가 `skipped` 또는 `failed`을(를) 반환하면 doctor는 이유를 보고하고 해당 검사에 대한 검증을 건너뜁니다. 복구에 성공한 후 doctor는 복구된 발견 항목으로 범위를 한정하여 `detect()`을(를) 다시 실행합니다. 발견 항목이 여전히 존재하면 doctor는 변경을 완료된 것으로 처리하는 대신 복구 경고를 보고합니다.

발견 항목에는 다음이 포함됩니다.

| 필드              | 용도                                                   |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | 건너뛰기/전용 필터 및 CI 허용 목록에 사용하는 안정적인 ID입니다. |
| `severity`        | `info`, `warning` 또는 `error`입니다. |
| `message`         | 사람이 읽을 수 있는 문제 설명입니다.                   |
| `path`            | 사용 가능한 경우 구성, 파일 또는 논리적 경로입니다.   |
| `line` / `column` | 사용 가능한 경우 소스 위치입니다.                     |
| `ocPath`          | 검사가 특정 주소를 가리킬 수 있는 경우의 정확한 `oc://` 주소입니다. |
| `fixHint`         | 권장 운영자 조치 또는 복구 요약입니다.                 |

현대화된 핵심 doctor 검사는 사람이 사용하는 `doctor` / `doctor --fix` 동작을 소유하는 순서 지정 doctor 기여 항목에 계속 연결됩니다. 공유 구조화 상태 레지스트리가 확장 지점입니다. 번들 및 Plugin 기반 검사는 해당 소유 패키지가 활성 명령 경로에 등록한 후 핵심 doctor 검사 뒤에 실행됩니다. `openclaw/plugin-sdk/health`은(는) Plugin 작성자에게 동일한 계약을 제공합니다.

## 검사 선택

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` 및 `--skip`은(는) 전체 검사 ID를 허용하며 반복해서 지정할 수 있습니다. `--only` ID가 등록되지 않은 경우 해당 ID에 대한 검사는 실행되지 않습니다. 출력의 `checksRun`/`checksSkipped`을(를) 사용하여 범위가 한정된 게이트가 예상한 검사를 선택하는지 확인하십시오.

## 업그레이드 후 모드

`openclaw doctor --post-upgrade`은(는) 빌드 또는 업그레이드 후 연속 실행할 Plugin 호환성 검사를 수행합니다. 발견 항목은 표준 출력으로 전달되며, 발견 항목 중 하나라도 `level: "error"`을(를) 가지면 종료 코드는 1입니다. CI, 커뮤니티 `fork-upgrade` 스킬 및 기타 업그레이드 후 스모크 도구에 적합한 기계 판독 가능 봉투(`{ probesRun, findings }`)를 사용하려면 `--json`을(를) 추가하십시오. 설치된 Plugin 인덱스가 없거나 형식이 잘못된 경우에도 JSON 모드는 `plugin.index_unavailable` 오류 발견 항목이 포함된 봉투를 출력합니다.

컨테이너 이미지 시작은 일반적인 "업데이트 후 doctor 실행" 흐름의 예외입니다. `openclaw gateway run`이(가) 새 OpenClaw 버전에서 시작되면 준비 완료를 보고하기 전에 안전한 상태 및 Plugin 복구를 실행합니다. 복구를 안전하게 완료할 수 없으면 시작이 종료되며, 컨테이너를 정상적으로 다시 시작하기 전에 동일하게 마운트된 상태/구성을 대상으로 동일한 이미지를 `openclaw doctor --fix`과(와) 함께 한 번 실행하라고 안내합니다.

## 공유 상태 SQLite 압축

`openclaw doctor --state-sqlite compact`은(는)
`<state-dir>/state/openclaw.sqlite`에 있는 표준 공유 상태 데이터베이스를 위한 명시적인 오프라인 유지 관리입니다. 임의의 데이터베이스 경로를 허용하지 않으며, 정상적인 Gateway 작동에서 호출되지 않고, `openclaw doctor --fix`의 일부도 아닙니다. 이 명령은 Gateway 시작과 동일한 상태 소유권 잠금을 획득하며 검증, 체크포인트, `VACUUM` 및 최종 무결성 검사를 수행하는 동안 잠금을 유지합니다. Gateway 또는 다른 SQLite 유지 관리 명령이 해당 잠금을 소유하고 있으면 실행을 거부합니다. `OPENCLAW_ALLOW_MULTI_GATEWAY=1`이(가) 구성별 Gateway 싱글턴을 건너뛰는 경우에도 상태 잠금은 활성 상태로 유지되므로, 유지 관리에서 이를 감지하기 위해 운영자 셸이 Gateway 서비스의 환경을 상속할 필요가 없습니다.

먼저 Gateway를 중지하고 검증된 백업을 생성하십시오.

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

명령은 다음을 수행합니다.

1. 표준 공유 상태 경로에 일반 파일이 있어야 합니다. 데이터베이스가 없으면 `skipped`로 보고하고 성공적으로 종료합니다.
2. 체크포인트를 수행하거나 파일을 변경하기 전에 현재 지원되는 스키마 버전과 `schema_meta.role = "global"`을(를) 검증합니다.
3. 사용 중이 아닌 `wal_checkpoint(TRUNCATE)`이(가) 필요합니다. 체크포인트가 사용 중이면 남아 있는 모든 OpenClaw 프로세스를 중지하고 다시 시도하십시오.
4. `auto_vacuum`을(를) `INCREMENTAL`으로 설정하고 전체 `VACUUM`을(를) 실행한 다음 다시 체크포인트를 수행합니다.
5. `quick_check`, `integrity_check` 및 `foreign_key_check`을(를) 실행한 다음 데이터베이스와 SQLite 사이드카 파일에 소유자 전용 권한을 다시 적용합니다.

JSON 출력은 압축 전후의 데이터베이스 및 WAL 크기, 프리리스트 페이지, 페이지 크기 및 `auto_vacuum` 값과 회수된 바이트, `quick_check` 및 `integrity_check` 결과를 보고합니다. `foreign_key_check`은(는) 실패 시 닫히도록 강제되며 별도의 성공 필드가 없습니다. SQLite는 `auto_vacuum`을(를) 없음은 `0`, 전체는 `1`, 증분은 `2`으로 보고합니다.

스키마가 오래되었거나 실행 중인 OpenClaw 빌드보다 새 버전이거나 에이전트 데이터베이스에 속하는 경우 압축은 변경 없이 실패합니다. 오래된 공유 상태 스키마의 경우 먼저 `openclaw doctor --fix`을(를) 실행하십시오. 더 새로운 스키마의 경우 호환되는 백업을 복원하거나 OpenClaw를 업그레이드하십시오.

## 세션 SQLite 마이그레이션

OpenClaw는 Gateway 시작 및 `openclaw doctor --fix` 실행 중에 레거시 세션 행과 기록 이력을 각 에이전트의 SQLite 데이터베이스로 자동으로 가져옵니다. `openclaw doctor --session-sqlite <mode>`은(는) 해당 마이그레이션을 위한 대상별 검사 및 검증 도구입니다. 현재 런타임 세션 행은 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`에 있습니다. 레거시 `sessions.json` 파일은 마이그레이션 소스입니다. 활성 기록 JSONL 파일은 성공적으로 가져온 후 활성 세션 디렉터리 밖으로 가져와 보관됩니다. 보관 계층 JSONL 파일은 런타임 대체 경로가 아니라 지원 자료로 유지됩니다.

모드:

| 모드       | 동작                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | 가져오지 않고 레거시 및 SQLite 개수와 참조되지 않는 JSONL 파일을 읽습니다.                                             |
| `dry-run`  | 레거시 항목과 기록 JSONL 파일을 구문 분석하고, 가져올 수 있는 행 수를 계산하며, SQLite 행을 쓰지 않고 문제를 보고합니다. |
| `import`   | 선택한 대상에 대해 레거시 항목과 기록 이벤트를 SQLite로 가져옵니다.                                                    |
| `validate` | 선택한 레거시 소스를 SQLite 행 및 기록 이벤트 수와 비교합니다.                                                        |
| `compact`  | 대규모 삭제 또는 보관 정리 후 빈 페이지를 회수하도록 선택한 에이전트 SQLite 데이터베이스를 체크포인트하고 VACUUM합니다. |
| `recover`  | 최근 실패한 마이그레이션 실행을 복구하고, 대상을 검증하며, 정제된 GitHub 이슈 보고서를 준비합니다.                    |
| `restore`  | SQLite 데이터를 삭제하지 않고 기록된 마이그레이션 매니페스트에서 보관된 기록 자료를 복원합니다.                       |

선택기:

- 기본값: 해당 레거시 저장소 파일이 존재하는 경우 구성된 기본 에이전트 저장소입니다.
- `--session-sqlite-agent <id>`: 구성된 에이전트 하나입니다.
- `--session-sqlite-all-agents`: 구성된 에이전트 저장소와 검색된 에이전트 저장소입니다.
- `--session-sqlite-store <path>`: 명시적인 레거시 `sessions.json` 경로 하나입니다.

수동 검사 순서:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

중요한 기록이 있는 설치에서 `import`을(를) 실행하기 전에 OpenClaw 상태 디렉터리를 백업하십시오. 선택한 레거시 항목이 SQLite에 없거나, 세션 ID가 다르거나, 기록 이벤트 수가 다르면 `validate`은(는) 0이 아닌 코드로 종료됩니다. `--session-sqlite-store <path>`을(를) 사용할 때는 보고서에 예상한 대상 수가 포함되어 있는지 확인하십시오. 존재하지 않는 명시적 저장소 경로는 대상을 선택하지 않습니다.

SQLite 삭제는 먼저 데이터베이스 내부의 페이지를 회수하며 데이터베이스 파일을 즉시 축소하지 않을 수도 있습니다. 대용량 기록을 삭제하거나 보관한 후 `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`을(를) 실행하여 WAL 파일을 체크포인트하고, `VACUUM`을(를) 실행하며, 전후 데이터베이스 및 WAL 크기를 보고하십시오. 압축을 수행하려면 현재 에이전트 스키마를 사용하는 일반 파일, 선택한 에이전트의 영구 소유자 메타데이터 및 doctor 프로세스에서 열린 핸들이 없는 상태가 필요합니다. 파괴적인 `import`, `compact`, `recover` 및 `restore` 모드는 전체 작업 동안 Gateway 시작과 동일한 상태 소유권 잠금을 유지합니다. `inspect`, `dry-run` 및 `validate`은(는) 읽기 전용으로 유지되며 잠금을 획득하지 않습니다. 먼저 Gateway를 중지하십시오. 파괴적 모드는 실시간 쓰기 또는 다른 유지 관리 명령과 경합하는 대신 실패합니다. 파괴적인 `--session-sqlite-store` 대상은 활성 상태 디렉터리 내부에 있어야 합니다. 다른 설치를 유지 관리하기 전에 `OPENCLAW_STATE_DIR`을(를) 저장소를 소유한 상태 디렉터리로 설정하십시오. 기존 하드 링크 대상은 잠긴 상태 디렉터리 외부의 다른 경로가 동일한 데이터베이스 inode를 공유할 수 있으므로 거부됩니다. 동일한 소유권 검사는 SQLite WAL, 공유 메모리 및 롤백 저널 사이드카에도 적용됩니다.

각 가져오기는 기록 자료를 보관소로 이동하기 전에 `~/.openclaw/session-sqlite-migration-runs/` 아래에 매니페스트를 작성합니다. 자료가 이동된 후 시작 시 세션 SQLite 마이그레이션 실패가 보고되면 복구를 실행하십시오.

```bash
openclaw doctor --session-sqlite recover --github-issue
```

복구는 최근 실패한 마이그레이션 매니페스트를 선택하고, 해당 매니페스트의 보관된 자료만 복원하며, 영향을 받은 대상을 검증하고, 정제된 `.failure.md` 및 `.failure.json` 보고서를 새로 고치며, 기록 내용, 원시 환경, 비밀 및 제한 없는 구성을 포함하지 않는 GitHub 이슈 본문을 준비합니다. 실패한 마이그레이션 매니페스트가 없지만 선택한 에이전트 SQLite 데이터베이스가 손상되었거나 데이터베이스가 아니거나 주 데이터베이스 없이 저널 사이드카가 있는 경우, 복구는 전체 파일 집합을 임시 검사 디렉터리로 복사합니다. 원본 포렌식 파일은 그대로 유지하면서 SQLite가 해당 폐기 가능한 복사본에서 유효한 핫 저널을 롤백한 후 `quick_check`, `integrity_check` 및 `foreign_key_check`을(를) 실행할 수 있습니다. 무결성 검사 실패 또는 고립된 사이드카가 있으면 검색된 전체 집합의 이름을 하나의 `.corrupt-<timestamp>` 접미사로 변경하여 DB, WAL, SHM 및 롤백 저널 파일을 보존합니다. 이름 변경 실패를 포착하면 실패를 보고하기 전에 이미 이동한 파일을 롤백하므로 복구 가능한 파일 집합이 알리지 않고 분리되지 않습니다. 복구하기 전에 Gateway를 중지하십시오. 활발하게 변경되는 SQLite 파일 집합을 복사하거나 이름을 변경하는 작업은 안전하지 않으며 운영 체제에 따라 다르게 동작합니다. `--github-issue --yes`을(를) 사용하면 doctor는 GitHub CLI를 사용하여 `openclaw/openclaw`에 이슈를 생성합니다. 확인하지 않으면 로컬 지원 보고서를 작성하고 미리 채워진 이슈 URL을 출력합니다.

`restore`은(는) 하위 수준 실행 취소 작업으로 유지됩니다. 이 작업은 매니페스트 `sourcePath -> archivePath` 레코드를 사용하고, 원래 경로가 없는 경우에만 보관된 자료를 다시 이동하며, 두 경로가 모두 존재하면 충돌을 보고하고, SQLite 데이터베이스는 그대로 둡니다.

### 세션 SQLite 마이그레이션 후 다운그레이드

이전 파일 기반 OpenClaw 버전을 시작하기 전에 보관된 레거시 기록 자료를 복원하십시오.

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

이전 버전은 `sessions.json` 항목과 해당 항목에 기록된 `sessionFile` 경로를
읽습니다. SQLite 마이그레이션 후 가져오기에 성공하면 활성 JSONL
트랜스크립트가 `session-sqlite-import-archive/`로 이동하므로, 복원 과정에서 매니페스트에 기록된 해당 아티팩트를
원래 경로로 다시 이동하기 전까지 이전 런타임에서는 해당 기록을
볼 수 없습니다.

복원은 SQLite 데이터를 삭제하지 않습니다. SQLite 전환 후 생성된 세션은
SQLite에만 존재하며 이전 런타임에는 표시되지 않습니다. 나중에
다시 업그레이드하는 경우 OpenClaw가 가져오기 전에 복원된 레거시 아티팩트와
SQLite 행을 비교할 수 있도록 위의 일반 마이그레이션 검증 절차를 실행하십시오.

## 참고

- Nix 모드(`OPENCLAW_NIX_MODE=1`)에서도 읽기 전용 doctor 검사는 계속 작동하지만, `openclaw.json`가 변경 불가능하므로 `doctor --fix`, `doctor --repair`, `doctor --yes`, `doctor --generate-gateway-token`는 비활성화됩니다. 대신 이 설치의 Nix 소스를 편집하십시오. nix-openclaw에서는 에이전트 우선 [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하십시오.
- 대화형 프롬프트(키체인/OAuth 수정 등)는 stdin이 TTY이고 `--non-interactive`가 설정되지 **않은** 경우에만 실행됩니다. 헤드리스 실행(cron, Telegram, 터미널 없음)에서는 프롬프트를 건너뜁니다.
- 비대화형 `doctor` 실행은 헤드리스 상태 검사를 빠르게 유지하기 위해 선제적 Plugin 로딩을 건너뜁니다. 대화형 세션은 레거시 상태 확인/복구 흐름에 필요한 Plugin 표면을 계속 로드합니다.
- `--lint`는 `--non-interactive`보다 더 엄격합니다. 항상 읽기 전용이고, 프롬프트를 표시하지 않으며, 안전한 마이그레이션도 적용하지 않습니다. doctor가 변경 사항을 적용하도록 하려면 `doctor --fix` 또는 `doctor --repair`를 사용하십시오.
- doctor는 기본적으로 시크릿을 검사할 때 `exec` SecretRef를 실행하지 않습니다. 구성된 시크릿 확인자를 doctor가 의도적으로 실행하도록 하려는 경우에만 `--allow-exec`(`--lint` 사용 여부와 무관)을 사용하십시오.
- 모든 구성 쓰기(`--fix` 복구 포함)는 백업을 `~/.openclaw/openclaw.json.bak`(번호가 지정된 `.bak.1`..`.bak.4` 순환 포함)으로 순환시킵니다. 또한 `--fix`는 스키마 검증에서 보고된 알 수 없는 구성 키를 제거하고 각 제거 항목을 나열합니다. 업데이트가 진행 중일 때는 부분적으로 작성된 업그레이드 상태가 마이그레이션 완료 전에 제거되지 않도록 이를 건너뜁니다.
- 다른 감독자가 Gateway 수명 주기를 관리하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하십시오. doctor는 계속 Gateway/서비스 상태를 보고하고 서비스 외 복구를 적용하지만, 서비스 설치/시작/재시작/부트스트랩 및 레거시 서비스 정리는 건너뜁니다.
- Linux에서 doctor는 비활성 상태인 추가 Gateway 유사 systemd 유닛을 무시하며, 복구 중 실행 중인 systemd Gateway 서비스의 명령/진입점 메타데이터를 다시 작성하지 않습니다. 먼저 서비스를 중지하거나 `openclaw gateway install --force`을 사용하여 활성 실행기를 교체하십시오.
- `doctor --fix --non-interactive`는 누락되었거나 오래된 Gateway 서비스 정의를 보고하지만, 업데이트 복구 모드 외에서는 이를 설치하거나 다시 작성하지 않습니다. 서비스가 누락된 경우 `openclaw gateway install`을 실행하고, 실행기를 교체하려면 `openclaw gateway install --force`를 실행하십시오.
- 상태 무결성 검사는 세션 디렉터리에서 고아 트랜스크립트 파일을 감지합니다. 이를 `.deleted.<timestamp>`로 보관하려면 대화형 확인이 필요합니다. `--fix`, `--yes` 및 헤드리스 실행에서는 해당 파일을 그대로 둡니다.
- doctor는 `~/.openclaw/cron/jobs.json`(또는 `cron.store`)에서 레거시 Cron 작업 형식을 검사하고, 정규 행을 SQLite로 가져오기 전에 이를 다시 작성합니다.
- doctor는 명시적인 `payload.model` 재정의가 있는 Cron 작업을 보고하며, 제공자 네임스페이스별 개수와 `agents.defaults.model`과의 불일치도 포함합니다. 따라서 기본 모델을 상속하지 않는 예약 작업을 인증 또는 결제 조사 중에 확인할 수 있습니다.
- doctor는 여전히 실행 중으로 표시된 Cron 작업(`state.runningAtMs`)을 보고합니다. 이로 인해 `openclaw cron list`에서 해당 작업이 `running`로 표시될 수 있습니다. 이 검사는 읽기 전용입니다. 현재 표시된 작업을 실행 중인 Gateway가 없으면 다음 Cron 서비스 시작 시 중단된 실행을 기록하고 표시를 지웁니다.
- Linux에서 사용자의 crontab이 유지 관리되지 않는 레거시 `~/.openclaw/bin/ensure-whatsapp.sh`를 여전히 실행하면 doctor가 경고합니다. Cron에 systemd 사용자 버스 환경이 없으면 이 도구가 `Gateway inactive`을 잘못 보고할 수 있습니다.
- WhatsApp이 활성화된 경우 doctor는 로컬 `openclaw-tui` 클라이언트가 계속 실행 중인 상태에서 성능이 저하된 Gateway 이벤트 루프가 있는지 검사합니다. `doctor --fix`는 검증된 로컬 TUI 클라이언트만 중지하여 WhatsApp 응답이 오래된 TUI 새로 고침 루프 뒤에서 대기열에 쌓이지 않도록 합니다.
- doctor는 기본 모델, 대체 모델, 모델 허용 목록, 이미지/동영상 생성 모델, Heartbeat/하위 에이전트/Compaction 재정의, 훅, 채널 모델 재정의, Cron 페이로드 및 오래된 세션/트랜스크립트 경로 고정 전반에서 레거시 `codex/*` 및 `openai-codex/*` 모델 참조를 정규 `openai/*` 참조로 다시 작성합니다. 또한 `--fix`는 안전한 경우 레거시 `models.providers.codex` 및 `models.providers.openai-codex` 구성을 병합하고, 레거시 `openai-codex:*` 인증 프로필 및 `auth.order.openai-codex` 항목을 `openai:*`로 마이그레이션하며, Codex 의도를 제공자/모델 범위의 `agentRuntime.id: "codex"` 항목으로 이동하고, 오래된 전체 에이전트/세션 런타임 고정을 제거하며, 복구된 OpenAI 에이전트 참조가 직접 OpenAI API 키 인증 대신 Codex 인증 라우팅을 계속 사용하도록 합니다.
- doctor는 참조된 프로필이 모두 사라졌지만 호환되는 저장 자격 증명이 존재하는 비어 있지 않은 `auth.order.<provider>` 목록을 보고합니다. `doctor --fix`는 이러한 오래된 재정의만 삭제하여 에이전트별 자동 자격 증명 선택을 복원합니다. 명시적으로 비어 있는 순서, 일부 유효한 항목이 남아 있는 목록, 호환되는 저장 자격 증명이 없는 순서는 변경하지 않습니다. 활성 SQLite 인증 저장소를 읽을 수 없거나 형식이 잘못된 경우 doctor는 이 복구를 건너뛴 이유를 설명합니다. 구성 다시 로드 모드에서 쓰기를 자동으로 적용하지 않는 경우, 인증 상태를 다시 확인하기 전에 실행 중인 Gateway를 재시작하십시오.
- doctor는 이전 OpenClaw 버전의 레거시 Plugin 종속성 스테이징 상태를 정리하고, 이를 피어 종속성으로 선언하는 관리형 npm Plugin에 대해 호스트 `openclaw` 패키지를 다시 연결합니다. 또한 구성에서 참조하는 누락된 다운로드 가능 Plugin(`plugins.entries`, 구성된 채널, 구성된 제공자/검색 설정, 구성된 에이전트 런타임)을 복구합니다. 패키지 업데이트 중에는 패키지 교체가 완료될 때까지 doctor가 패키지 관리자 Plugin 복구를 건너뜁니다. 구성된 Plugin에 여전히 복구가 필요하면 이후 `openclaw doctor --fix`을 다시 실행하십시오. 다운로드에 실패하면 doctor는 설치 오류를 보고하고 다음 복구 시도를 위해 구성된 Plugin 항목을 보존합니다.
- Plugin 검색이 정상인 경우 doctor는 `plugins.allow`/`plugins.deny`/`plugins.entries`에서 누락된 Plugin ID를 제거하고, 이에 대응하는 연결이 끊어진 채널 구성, Heartbeat 대상 및 채널 모델 재정의도 제거하여 오래된 Plugin 구성을 복구합니다.
- doctor는 영향을 받은 `plugins.entries.<id>` 항목을 비활성화하고 유효하지 않은 `config` 페이로드를 제거하여 유효하지 않은 Plugin 구성을 격리합니다. Gateway 시작 시 이미 문제가 있는 해당 Plugin만 건너뛰므로 다른 Plugin과 채널은 계속 실행됩니다.
- doctor는 폐기된 `plugins.entries.codex.config.codexDynamicToolsProfile`를 제거합니다. Codex 앱 서버는 항상 Codex 네이티브 작업 공간 도구를 네이티브 상태로 유지합니다.
- doctor는 레거시 평면 Talk 구성(`talk.voiceId`, `talk.modelId` 등)을 `talk.provider` + `talk.providers.<provider>`으로 자동 마이그레이션합니다. 유일한 차이가 객체 키 순서인 경우 `doctor --fix`를 반복 실행해도 더 이상 Talk 정규화를 보고하거나 적용하지 않습니다.
- doctor에는 메모리 검색 준비 상태 검사가 포함되며 임베딩 자격 증명이 누락된 경우 `openclaw configure --section model`를 권장할 수 있습니다.
- 명령 소유자가 구성되지 않은 경우 doctor가 경고합니다. 명령 소유자는 소유자 전용 명령을 실행하고 위험한 작업을 승인할 수 있는 인간 운영자 계정입니다. DM 페어링은 누군가가 봇과 대화할 수 있게 할 뿐입니다. 최초 소유자 부트스트랩이 존재하기 전에 발신자를 승인했다면 `commands.ownerAllowFrom`을 명시적으로 설정하십시오.
- Codex 모드 에이전트가 구성되어 있고 운영자의 Codex 홈에 개인 Codex CLI 자산이 있으면 doctor가 정보 참고 사항을 보고합니다. 로컬 Codex 앱 서버 실행은 격리된 에이전트별 홈을 사용합니다. 필요한 경우 먼저 Codex Plugin을 설치한 다음 `openclaw migrate plan codex`을 사용하여 의도적으로 승격해야 할 자산의 인벤토리를 확인하십시오.
- 기본 에이전트에 허용된 Skills를 현재 런타임 환경에서 사용할 수 없는 경우(바이너리, 환경 변수, 구성 또는 OS 요구 사항 누락) doctor가 경고합니다. `doctor --fix`는 `skills.entries.<skill>.enabled=false`를 사용하여 사용할 수 없는 Skills를 비활성화할 수 있습니다. Skills를 활성 상태로 유지하려면 누락된 요구 사항을 대신 설치하거나 구성하십시오.
- 샌드박스 모드가 활성화되어 있지만 Docker를 사용할 수 없는 경우 doctor는 해결 방법(`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)과 함께 명확한 경고를 보고합니다.
- 레거시 샌드박스 레지스트리 파일 또는 샤드 디렉터리(`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` 또는 `~/.openclaw/sandbox/browsers/`)가 있으면 doctor가 이를 보고합니다. `--fix`는 유효한 항목을 SQLite로 마이그레이션하고 유효하지 않은 레거시 파일을 격리합니다.
- `gateway.auth.token`/`gateway.auth.password`가 SecretRef로 관리되며 현재 명령 경로에서 사용할 수 없는 경우 doctor는 읽기 전용 경고를 보고하고 평문 대체 자격 증명을 쓰지 않습니다. exec 기반 SecretRef의 경우 `--allow-exec`가 없으면 doctor가 실행을 건너뜁니다.
- 복구 경로에서 채널 SecretRef 검사에 실패하면 doctor는 조기에 종료하지 않고 계속 진행하며 경고를 보고합니다.
- 상태 디렉터리 마이그레이션 후 활성화된 기본 Telegram 또는 Discord 계정이 환경 변수 대체에 의존하지만 doctor 프로세스에서 `TELEGRAM_BOT_TOKEN` 또는 `DISCORD_BOT_TOKEN`을 사용할 수 없는 경우 doctor가 경고합니다.
- Telegram `allowFrom` 사용자 이름 자동 확인(`doctor --fix`)에는 현재 명령 경로에서 확인 가능한 Telegram 토큰이 필요합니다. 토큰 검사를 사용할 수 없으면 doctor가 경고를 보고하고 해당 실행에서 자동 확인을 건너뜁니다.

## macOS: `launchctl` 환경 재정의

이전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`(또는 `...PASSWORD`)을 실행한 경우 해당 값이 구성 파일보다 우선하며 지속적인 "unauthorized" 오류를 일으킬 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 관련 문서

- [CLI 참조](/ko/cli)
- [Gateway doctor](/ko/gateway/doctor)
