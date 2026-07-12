---
read_when:
    - memory-wiki CLI를 사용하려고 합니다
    - '`openclaw wiki`을(를) 문서화하거나 변경하고 있습니다.'
summary: '`openclaw wiki`용 CLI 참조 문서(memory-wiki 볼트 상태, 검색, 컴파일, 린트, 적용, 브리지, ChatGPT 가져오기 및 Obsidian 도우미)'
title: 위키
x-i18n:
    generated_at: "2026-07-12T15:08:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki` 볼트를 검사하고 유지 관리합니다. 번들로 제공되는 `memory-wiki` Plugin에서 제공합니다.

관련 문서: [메모리 위키 Plugin](/ko/plugins/memory-wiki), [메모리 개요](/ko/concepts/memory), [CLI: 메모리](/ko/cli/memory)

## 일반 명령

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "Teams에 관해서는 누구에게 물어봐야 하나요?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha 요약" \
  --body "간단한 종합 본문" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "아직 활성 상태인가요?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## 에이전트 선택

`plugins.entries.memory-wiki.config.vault.scope`가 `agent`이면 최상위
`--agent <id>` 옵션으로 볼트를 선택합니다.

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "환불 정책"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

여러 에이전트가 구성된 설정에서는 명령이 임의의 기본 볼트를 읽거나 쓰지
못하도록 CLI 작업에 `--agent`가 필요합니다. 에이전트가 하나만 구성된 경우에는
해당 에이전트가 계속 기본값으로 사용됩니다. 알 수 없는 에이전트 ID는 볼트 작업이
시작되기 전에 실패합니다. `vault.scope`가 `global`인 경우 이 옵션은 선택된
경로를 변경하지 않습니다.

Gateway 클라이언트에도 같은 규칙이 적용됩니다. 에이전트 범위의 다중 에이전트
설정에서는 볼트 기반 `wiki.*` 요청에 `agentId`를 전달하십시오. ID가 없거나
알 수 없는 경우 오류가 발생합니다. 에이전트 턴, 위키 도구, 메모리 코퍼스 보충 자료,
컴파일된 프롬프트 다이제스트에는 이미 활성 런타임 에이전트 컨텍스트가 포함됩니다.

## 명령

### `wiki status`

볼트 모드와 범위, 확인된 에이전트, 상태 및 Obsidian CLI 사용 가능 여부를 표시합니다. 의도한 볼트가 초기화되었는지, 브리지 모드가 정상인지, 또는 Obsidian 통합을 사용할 수 있는지 확인하려면 이 명령을 먼저 사용하십시오.

브리지 모드가 활성화되어 있고 메모리 아티팩트를 읽도록 구성된 경우, 이 명령은 실행 중인 Gateway를 쿼리하므로 에이전트/런타임 메모리와 동일한 활성 메모리 Plugin 컨텍스트를 확인합니다.

### `wiki doctor`

위키 상태 검사를 실행하고 실행 가능한 수정 방법을 보고합니다. 상태가 정상이 아니면 0이 아닌 코드로 종료됩니다.

브리지 모드가 활성화되어 있고 메모리 아티팩트를 읽도록 구성된 경우, 이 명령은 보고서를 작성하기 전에 실행 중인 Gateway를 쿼리합니다. 비활성화된 브리지 가져오기와 메모리 아티팩트를 읽지 않는 브리지 구성은 로컬/오프라인 상태로 유지됩니다.

일반적인 문제:

- 공개 메모리 아티팩트 없이 브리지 모드가 활성화됨
- 볼트 레이아웃이 유효하지 않거나 없음
- Obsidian 모드가 필요하지만 외부 Obsidian CLI가 없음

### `wiki init`

최상위 인덱스와 캐시 디렉터리를 포함하여 위키 볼트 레이아웃과 시작 페이지를 생성합니다.

### `wiki ingest <path>`

로컬 마크다운 또는 텍스트 파일을 소스 페이지로 위키의 `sources/` 폴더에 가져옵니다. `<path>`는 로컬 파일 경로여야 하며, 현재는 URL 가져오기를 지원하지 않습니다. 바이너리 파일은 거부됩니다.

가져온 소스 페이지에는 출처 frontmatter(`sourceType: local-file`, `sourcePath`, `ingestedAt`)가 포함됩니다. 가져오기 후에는 항상 볼트를 다시 컴파일합니다.

플래그: `--title <title>`은 소스 제목을 재정의합니다(기본값: 파일 이름에서 파생).

### `wiki okf import <path>`

압축을 푼 Open Knowledge Format 번들을 위키 개념 페이지로 가져옵니다.

가져오기 도구는 OKF 디렉터리 트리에 있는 예약되지 않은 모든 `.md` 개념 문서를 읽고, 비어 있지 않은 `type` 필드를 요구하며, 알 수 없는 OKF `type` 값을 일반 개념으로 처리합니다. 예약된 OKF `index.md` 및 `log.md` 파일은 개념으로 가져오지 않습니다.

가져온 페이지는 `concepts/` 아래에 평면화되므로 기존 위키 컴파일, 검색, 가져오기, 다이제스트 및 대시보드 흐름에서 즉시 확인할 수 있습니다. 원본 OKF 개념 ID, `type`, `resource`, `tags`, 타임스탬프, 소스 경로 및 전체 frontmatter는 페이지 frontmatter에 보존됩니다. 내부 OKF 마크다운 링크는 생성된 위키 페이지를 가리키도록 다시 작성되며, 끊어진 링크나 외부 링크는 변경하지 않습니다. 가져오기 후에는 항상 볼트를 다시 컴파일합니다.

예:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery 테이블" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

인덱스, 관련 블록, 대시보드 및 컴파일된 다이제스트를 다시 빌드합니다. 다음 위치에 안정적인 머신용 아티팩트를 작성합니다.

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards`가 활성화된 경우 컴파일 시 보고서 페이지도 새로 고칩니다.

### `wiki lint`

볼트를 린트하고 다음 내용을 다루는 보고서를 작성합니다.

- 구조적 문제(끊어진 링크, 누락되거나 중복된 ID, 누락된 페이지 유형 또는 제목, 유효하지 않은 frontmatter)
- 출처 정보의 공백(누락된 소스 ID, 누락된 가져오기 출처 정보)
- 모순(표시된 모순, 상충하는 주장)
- 미해결 질문
- 신뢰도가 낮은 페이지 및 주장
- 오래된 페이지 및 주장

의미 있는 위키 업데이트 후 이 명령을 실행하십시오.

### `wiki search <query>`

위키 콘텐츠를 검색합니다. 동작은 구성에 따라 달라집니다.

- `search.backend`: `shared` 또는 `local`
- `search.corpus`: `wiki`, `memory` 또는 `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` 또는 `raw-claim`

위키 전용 순위 지정과 출처 추적이 필요하면 `wiki search`를 사용하십시오. 활성 메모리 Plugin이 공유 검색을 제공하는 경우, 한 번의 광범위한 공유 회상 검색에는 `openclaw memory search`를 사용하는 것이 좋습니다.

검색 모드:

- `find-person`: 별칭, 핸들, 소셜 계정, 정규 ID 및 인물 페이지
- `route-question`: 문의 대상/가장 적합한 용도에 관한 힌트와 관계 맥락
- `source-evidence`: 소스 페이지와 구조화된 근거 필드
- `raw-claim`: 주장/근거 메타데이터가 포함된 구조화된 주장 텍스트

예시:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

결과가 구조화된 주장과 일치하면 텍스트 출력에 `Claim:` 및 `Evidence:` 줄이 포함됩니다. JSON 출력에는 에이전트 측 상세 조사를 위한 `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` 및 `evidenceSourceIds`도 추가로 제공됩니다.

### `wiki get <lookup>`

ID 또는 상대 경로로 위키 페이지를 읽습니다.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

자유 형식 페이지 편집 없이 범위가 제한된 변경을 적용합니다.

- `apply synthesis <title>`: 관리형 요약 본문이 포함된 종합 페이지를 생성하거나 새로 고칩니다.
- `apply metadata <lookup>`: 기존 페이지의 메타데이터를 업데이트합니다.

두 명령 모두 `--source-id`, `--contradiction`, `--question`(각각 반복 가능), `--confidence <n>`(0-1) 및 `--status <status>`를 허용합니다. `apply metadata`는 저장된 신뢰도 값을 제거하는 `--clear-confidence`도 허용합니다. 관리되는 생성 블록을 온전하게 유지하면서 위키 페이지를 발전시키는 데 지원되는 방법입니다.

### `wiki bridge import`

활성 메모리 Plugin의 공개 메모리 아티팩트를 브리지 기반 소스 페이지로 가져옵니다. `bridge` 모드에서 최근에 내보낸 메모리 아티팩트를 위키 볼트로 가져오려면 이 명령을 사용하십시오.

활성 브리지 아티팩트를 읽을 때 CLI는 런타임 메모리 Plugin 컨텍스트를 사용하도록 Gateway RPC를 통해 가져오기를 라우팅합니다. 브리지 가져오기가 비활성화되어 있거나 아티팩트 읽기가 꺼져 있으면 명령은 로컬/오프라인의 가져오기 0건 동작을 유지합니다. 가져오기 후 인덱스 새로 고침은 `ingest.autoCompile`에 의해 제어됩니다.

### `wiki unsafe-local import`

`unsafe-local` 모드에서 명시적으로 구성된 로컬 경로(`unsafeLocal.paths`)로부터 가져옵니다. 의도적으로 실험적이며 동일한 시스템에서만 사용할 수 있습니다. 가져오기 후 인덱스 새로 고침은 `ingest.autoCompile`에 의해 제어됩니다.

### `wiki chatgpt import`

ChatGPT 내보내기를 위키 소스 페이지 초안으로 가져옵니다.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| 플래그            | 기본값     | 설명                                                          |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | (필수)     | ChatGPT 내보내기 디렉터리 또는 `conversations.json` 경로입니다. |
| `--dry-run`       | `false`    | 페이지를 작성하지 않고 생성/업데이트/건너뜀 수를 미리 봅니다. |

시험 실행이 아닌 가져오기로 페이지가 변경되면 가져오기 실행 ID가 기록되어 요약에 출력되며, 롤백할 때 이 ID가 필요합니다.

### `wiki chatgpt rollback <run-id>`

이전에 적용한 ChatGPT 가져오기 실행을 롤백하여 생성된 페이지를 제거하고 덮어쓴 페이지를 복원합니다. 실행이 이미 롤백된 경우 아무 작업도 하지 않고 `alreadyRolledBack`을 보고합니다.

### `wiki obsidian ...`

Obsidian 친화적 모드로 실행되는 볼트를 위한 Obsidian 도우미 명령입니다: `status`, `search`, `open`, `command`, `daily`. `obsidian.useOfficialCli`가 활성화된 경우, 이러한 명령을 사용하려면 공식 `obsidian` CLI가 `PATH`에 있어야 합니다.

`vault.scope`가 `agent`일 때 `obsidian.useOfficialCli: true`를 설정하면 구성 검증에서 거부됩니다. `obsidian.vaultName`은 에이전트별 매핑이 아닌 하나의 전역 설정이기 때문입니다. Obsidian 친화적 Markdown 렌더링은 계속 사용할 수 있습니다.

## 실용적인 사용 지침

- 출처 추적과 페이지 식별 정보가 중요하면 `wiki search`와 `wiki get`을 사용하십시오.
- 관리되는 생성 섹션을 직접 편집하지 말고 `wiki apply`를 사용하십시오.
- 상충하거나 신뢰도가 낮은 콘텐츠를 신뢰하기 전에 `wiki lint`를 사용하십시오.
- 대량 가져오기 또는 소스 변경 후 최신 대시보드와 컴파일된 요약이 즉시 필요하면 `wiki compile`을 사용하십시오.
- 데이터 카탈로그, 문서 내보내기 또는 에이전트 보강 파이프라인에서 이미 OKF Markdown 번들을 생성하는 경우 `wiki okf import`를 사용하십시오.
- 브리지 모드가 새로 내보낸 메모리 아티팩트에 의존하는 경우 `wiki bridge import`를 사용하십시오.

## 구성 연계

`openclaw wiki` 동작은 다음 항목의 영향을 받습니다.

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

전체 구성 모델은 [Memory Wiki Plugin](/ko/plugins/memory-wiki)을 참조하십시오.

## 관련 항목

- [CLI 참조](/ko/cli)
- [메모리 위키](/ko/plugins/memory-wiki)
