---
read_when:
    - memory-wiki CLI를 사용하려고 합니다
    - '`openclaw wiki`을 문서화하거나 변경하고 있습니다'
summary: '`openclaw wiki`용 CLI 참조(memory-wiki vault status, search, compile, lint, apply, bridge 및 Obsidian 헬퍼)'
title: 위키
x-i18n:
    generated_at: "2026-04-30T06:25:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

`memory-wiki` 볼트를 검사하고 유지 관리합니다.

번들로 제공되는 `memory-wiki` Plugin이 제공합니다.

관련 항목:

- [Memory Wiki Plugin](/ko/plugins/memory-wiki)
- [메모리 개요](/ko/concepts/memory)
- [CLI: memory](/ko/cli/memory)

## 용도

다음과 같은 컴파일된 지식 볼트가 필요할 때 `openclaw wiki`를 사용하세요.

- 위키 네이티브 검색 및 페이지 읽기
- 출처 정보가 풍부한 종합
- 모순 및 최신성 보고서
- Active Memory Plugin에서 가져오는 브리지 가져오기
- 선택적 Obsidian CLI 헬퍼

## 일반 명령

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## 명령

### `wiki status`

현재 볼트 모드, 상태, Obsidian CLI 사용 가능 여부를 검사합니다.

볼트가 초기화되었는지, 브리지 모드가 정상인지, Obsidian 통합을 사용할 수 있는지 확실하지 않을 때 먼저 사용하세요.

브리지 모드가 활성 상태이고 메모리 아티팩트를 읽도록 구성된 경우, 이 명령은 실행 중인 Gateway를 쿼리하므로 에이전트/런타임 메모리와 동일한 Active Memory Plugin 컨텍스트를 봅니다.

### `wiki doctor`

위키 상태 검사를 실행하고 구성 또는 볼트 문제를 표시합니다.

브리지 모드가 활성 상태이고 메모리 아티팩트를 읽도록 구성된 경우, 이 명령은 보고서를 작성하기 전에 실행 중인 Gateway를 쿼리합니다. 비활성화된 브리지 가져오기와 메모리 아티팩트를 읽지 않는 브리지 구성은 로컬/오프라인 상태로 유지됩니다.

일반적인 문제는 다음과 같습니다.

- 공개 메모리 아티팩트 없이 브리지 모드가 활성화됨
- 유효하지 않거나 누락된 볼트 레이아웃
- Obsidian 모드가 예상될 때 외부 Obsidian CLI 누락

### `wiki init`

위키 볼트 레이아웃과 시작 페이지를 생성합니다.

최상위 인덱스와 캐시 디렉터리를 포함한 루트 구조를 초기화합니다.

### `wiki ingest <path-or-url>`

콘텐츠를 위키 소스 계층으로 가져옵니다.

참고:

- URL 가져오기는 `ingest.allowUrlIngest`로 제어됩니다.
- 가져온 소스 페이지는 frontmatter에 출처 정보를 유지합니다.
- 활성화된 경우 가져오기 후 자동 컴파일이 실행될 수 있습니다.

### `wiki compile`

인덱스, 관련 블록, 대시보드, 컴파일된 다이제스트를 다시 빌드합니다.

다음 위치에 안정적인 머신 대상 아티팩트를 작성합니다.

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards`가 활성화된 경우, compile은 보고서 페이지도 새로 고칩니다.

### `wiki lint`

볼트를 린트하고 다음을 보고합니다.

- 구조적 문제
- 출처 정보 공백
- 모순
- 열린 질문
- 낮은 신뢰도의 페이지/클레임
- 오래된 페이지/클레임

의미 있는 위키 업데이트 후에 이 명령을 실행하세요.

### `wiki search <query>`

위키 콘텐츠를 검색합니다.

동작은 구성에 따라 달라집니다.

- `search.backend`: `shared` 또는 `local`
- `search.corpus`: `wiki`, `memory` 또는 `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` 또는 `raw-claim`

위키별 순위 지정이나 출처 세부 정보가 필요할 때 `wiki search`를 사용하세요. 광범위한 공유 회수 패스를 한 번 수행하려면 Active Memory Plugin이 공유 검색을 노출하는 경우 `openclaw memory search`를 사용하는 것이 좋습니다.

검색 모드는 에이전트가 올바른 표면을 선택하도록 돕습니다.

- `find-person`: 별칭, 핸들, 소셜, 표준 ID, 사람 페이지
- `route-question`: 문의 대상/가장 적합한 용도 힌트와 관계 컨텍스트
- `source-evidence`: 소스 페이지 및 구조화된 증거 필드
- `raw-claim`: 클레임/증거 메타데이터가 포함된 구조화된 클레임 텍스트

예시:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

결과가 구조화된 클레임과 일치하면 텍스트 출력에는 `Claim:` 및 `Evidence:` 줄이 포함됩니다. JSON 출력은 에이전트 측 드릴다운을 위해 `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds`, `evidenceSourceIds`도 노출합니다.

### `wiki get <lookup>`

ID 또는 상대 경로로 위키 페이지를 읽습니다.

예시:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

자유 형식 페이지 수술 없이 좁은 범위의 변경을 적용합니다.

지원되는 흐름은 다음과 같습니다.

- 종합 페이지 생성/업데이트
- 페이지 메타데이터 업데이트
- 소스 ID 첨부
- 질문 추가
- 모순 추가
- 신뢰도/상태 업데이트
- 구조화된 클레임 작성

이 명령은 관리되는 블록을 수동으로 편집하지 않고도 위키를 안전하게 발전시킬 수 있도록 존재합니다.

### `wiki bridge import`

Active Memory Plugin의 공개 메모리 아티팩트를 브리지 기반 소스 페이지로 가져옵니다.

최신 내보낸 메모리 아티팩트를 위키 볼트로 가져오려는 경우 `bridge` 모드에서 사용하세요.

활성 브리지 아티팩트 읽기의 경우, CLI는 Gateway RPC를 통해 가져오기를 라우팅하므로 가져오기가 런타임 메모리 Plugin 컨텍스트를 사용합니다. 브리지 가져오기가 비활성화되었거나 아티팩트 읽기가 꺼져 있으면, 명령은 로컬/오프라인 0개 가져오기 동작을 유지합니다.

### `wiki unsafe-local import`

`unsafe-local` 모드에서 명시적으로 구성된 로컬 경로에서 가져옵니다.

이는 의도적으로 실험적이며 동일한 머신에서만 사용됩니다.

### `wiki obsidian ...`

Obsidian 친화 모드에서 실행되는 볼트를 위한 Obsidian 헬퍼 명령입니다.

하위 명령:

- `status`
- `search`
- `open`
- `command`
- `daily`

`obsidian.useOfficialCli`가 활성화된 경우, `PATH`에 공식 `obsidian` CLI가 있어야 합니다.

## 실제 사용 지침

- 출처 정보와 페이지 식별자가 중요할 때 `wiki search` + `wiki get`을 사용하세요.
- 관리되는 생성 섹션을 직접 편집하는 대신 `wiki apply`를 사용하세요.
- 모순되거나 낮은 신뢰도의 콘텐츠를 신뢰하기 전에 `wiki lint`를 사용하세요.
- 대량 가져오기나 소스 변경 후 대시보드와 컴파일된 다이제스트를 즉시 최신 상태로 만들려면 `wiki compile`을 사용하세요.
- 브리지 모드가 새로 내보낸 메모리 아티팩트에 의존할 때 `wiki bridge import`를 사용하세요.

## 구성 연결

`openclaw wiki` 동작은 다음에 의해 형성됩니다.

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

전체 구성 모델은 [Memory Wiki Plugin](/ko/plugins/memory-wiki)을 참조하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Memory Wiki](/ko/plugins/memory-wiki)
