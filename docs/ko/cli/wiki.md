---
read_when:
    - memory-wiki CLI를 사용하려는 경우
    - '`openclaw wiki`을 문서화하거나 변경하는 경우'
summary: '`openclaw wiki`용 CLI 참조(memory-wiki 볼트 상태, 검색, 컴파일, lint, 적용, 브리지 및 Obsidian 도우미)'
title: 위키
x-i18n:
    generated_at: "2026-04-23T14:02:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

`memory-wiki` 볼트를 점검하고 유지 관리합니다.

번들된 `memory-wiki` plugin이 제공합니다.

관련 항목:

- [메모리 위키 plugin](/ko/plugins/memory-wiki)
- [메모리 개요](/ko/concepts/memory)
- [CLI: memory](/ko/cli/memory)

## 용도

다음이 포함된 컴파일된 지식 볼트를 원할 때 `openclaw wiki`를 사용하세요:

- 위키 고유 검색 및 페이지 읽기
- 출처 정보가 풍부한 합성
- 모순 및 최신성 보고서
- 활성 메모리 plugin에서의 브리지 가져오기
- 선택적인 Obsidian CLI 도우미

## 자주 사용하는 명령

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
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

현재 볼트 모드, 상태, Obsidian CLI 가용성을 점검합니다.

볼트가 초기화되었는지, bridge 모드가 정상인지, 또는 Obsidian 통합을 사용할 수 있는지 확신이 없을 때 먼저 이 명령을 사용하세요.

### `wiki doctor`

위키 상태 검사를 실행하고 config 또는 볼트 문제를 표시합니다.

일반적인 문제는 다음과 같습니다:

- 공개 메모리 아티팩트 없이 bridge 모드가 활성화됨
- 유효하지 않거나 누락된 볼트 레이아웃
- Obsidian 모드가 예상되지만 외부 Obsidian CLI가 없음

### `wiki init`

위키 볼트 레이아웃과 시작 페이지를 생성합니다.

최상위 인덱스와 캐시 디렉터리를 포함한 루트 구조를 초기화합니다.

### `wiki ingest <path-or-url>`

콘텐츠를 위키 소스 레이어로 가져옵니다.

참고:

- URL 가져오기는 `ingest.allowUrlIngest`로 제어됩니다
- 가져온 소스 페이지는 frontmatter에 출처 정보를 유지합니다
- 활성화된 경우 가져오기 후 자동 컴파일이 실행될 수 있습니다

### `wiki compile`

인덱스, 관련 블록, 대시보드, 컴파일된 다이제스트를 다시 빌드합니다.

다음 경로 아래에 안정적인 머신용 아티팩트를 씁니다:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

`render.createDashboards`가 활성화되어 있으면, compile은 보고서 페이지도 새로 고칩니다.

### `wiki lint`

볼트를 lint하고 다음을 보고합니다:

- 구조적 문제
- 출처 정보 누락
- 모순
- 열린 질문
- 신뢰도가 낮은 페이지/클레임
- 오래된 페이지/클레임

의미 있는 위키 업데이트 후에 이 명령을 실행하세요.

### `wiki search <query>`

위키 콘텐츠를 검색합니다.

동작은 config에 따라 달라집니다:

- `search.backend`: `shared` 또는 `local`
- `search.corpus`: `wiki`, `memory`, 또는 `all`

위키 전용 순위 또는 출처 세부 정보가 필요할 때 `wiki search`를 사용하세요.
하나의 폭넓은 공유 회상 패스를 원한다면, 활성 메모리 plugin이 공유 검색을 노출하는 경우 `openclaw memory search`를 사용하는 것이 좋습니다.

### `wiki get <lookup>`

id 또는 상대 경로로 위키 페이지를 읽습니다.

예제:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

자유 형식 페이지 수술 없이 좁은 범위의 변경을 적용합니다.

지원되는 흐름은 다음과 같습니다:

- 합성 페이지 생성/업데이트
- 페이지 메타데이터 업데이트
- source id 연결
- 질문 추가
- 모순 추가
- 신뢰도/상태 업데이트
- 구조화된 클레임 쓰기

이 명령은 관리되는 블록을 수동 편집하지 않고도 위키가 안전하게 발전할 수 있도록 존재합니다.

### `wiki bridge import`

활성 메모리 plugin의 공개 메모리 아티팩트를 bridge 기반 소스 페이지로 가져옵니다.

최신으로 내보낸 메모리 아티팩트를 위키 볼트로 가져오고 싶을 때 `bridge` 모드에서 이 명령을 사용하세요.

### `wiki unsafe-local import`

`unsafe-local` 모드에서 명시적으로 구성된 로컬 경로에서 가져옵니다.

이는 의도적으로 실험적이며 동일한 머신에서만 사용 가능합니다.

### `wiki obsidian ...`

Obsidian 친화 모드로 실행되는 볼트를 위한 Obsidian 도우미 명령입니다.

하위 명령:

- `status`
- `search`
- `open`
- `command`
- `daily`

`obsidian.useOfficialCli`가 활성화되어 있으면, 이는 `PATH`에 공식 `obsidian` CLI가 있어야 합니다.

## 실용적인 사용 지침

- 출처 정보와 페이지 식별이 중요할 때는 `wiki search` + `wiki get`을 사용하세요.
- 관리되는 생성 섹션은 직접 편집하지 말고 `wiki apply`를 사용하세요.
- 모순되거나 신뢰도가 낮은 콘텐츠를 신뢰하기 전에 `wiki lint`를 사용하세요.
- 대량 가져오기 또는 소스 변경 후 즉시 최신 대시보드와 컴파일된 다이제스트가 필요하면 `wiki compile`을 사용하세요.
- bridge 모드가 새로 내보낸 메모리 아티팩트에 의존할 때는 `wiki bridge import`를 사용하세요.

## 관련 config

`openclaw wiki` 동작은 다음의 영향을 받습니다:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

전체 config 모델은 [메모리 위키 plugin](/ko/plugins/memory-wiki)을 참조하세요.
