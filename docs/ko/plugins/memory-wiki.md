---
read_when:
    - 단순한 `MEMORY.md` 노트를 넘어서는 영구적인 지식을 원합니다
    - 번들된 memory-wiki Plugin을 구성하고 있습니다
    - '`wiki_search`, `wiki_get`, 또는 브리지 모드를 이해하고 싶습니다'
summary: 'memory-wiki: 출처, 주장, 대시보드, 브리지 모드를 갖춘 컴파일된 지식 볼트'
title: 메모리 위키
x-i18n:
    generated_at: "2026-04-12T23:28:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44d168a7096f744c56566ecac57499192eb101b4dd8a78e1b92f3aa0d6da3ad1
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# 메모리 위키

`memory-wiki`는 지속적인 메모리를 컴파일된 지식 볼트로 바꾸는 번들 Plugin입니다.

이 Plugin은 active memory Plugin을 대체하지 않습니다. active memory Plugin은 여전히 회상, 승격, 인덱싱, Dreaming을 담당합니다. `memory-wiki`는 그 옆에서 동작하며 지속적인 지식을 탐색 가능한 위키로 컴파일하고, 결정적인 페이지, 구조화된 주장, 출처, 대시보드, 기계가 읽을 수 있는 다이제스트를 제공합니다.

메모리가 Markdown 파일 더미가 아니라 잘 관리되는 지식 계층처럼 동작하기를 원할 때 사용하세요.

## 추가되는 기능

- 결정적인 페이지 레이아웃을 갖춘 전용 위키 볼트
- 단순한 산문이 아닌 구조화된 주장 및 증거 메타데이터
- 페이지 수준의 출처, 신뢰도, 모순, 미해결 질문
- agent/런타임 소비자를 위한 컴파일된 다이제스트
- 위키 전용 search/get/apply/lint 도구
- active memory Plugin의 공개 아티팩트를 가져오는 선택적 브리지 모드
- 선택적 Obsidian 친화적 렌더 모드 및 CLI 통합

## 메모리와의 관계

역할 분담은 다음과 같습니다:

| 계층                                                    | 담당 역할                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active memory Plugin (`memory-core`, QMD, Honcho 등)    | 회상, 시맨틱 검색, 승격, Dreaming, 메모리 런타임                                           |
| `memory-wiki`                                           | 컴파일된 위키 페이지, 출처가 풍부한 종합, 대시보드, 위키 전용 search/get/apply             |

active memory Plugin이 공유 회상 아티팩트를 노출하면 OpenClaw는 `memory_search corpus=all`로 두 계층을 한 번에 검색할 수 있습니다.

위키 전용 순위화, 출처, 또는 직접 페이지 접근이 필요할 때는 대신 위키 전용 도구를 사용하세요.

## 권장 하이브리드 패턴

로컬 우선 설정의 강력한 기본값은 다음과 같습니다:

- 회상 및 광범위한 시맨틱 검색을 위한 active memory 백엔드로서의 QMD
- 지속적인 종합 지식 페이지를 위한 `bridge` 모드의 `memory-wiki`

이 분리는 각 계층이 역할에 집중할 수 있어 잘 작동합니다:

- QMD는 원시 노트, 세션 내보내기, 추가 컬렉션을 검색 가능하게 유지합니다
- `memory-wiki`는 안정적인 엔터티, 주장, 대시보드, 소스 페이지를 컴파일합니다

실전 규칙:

- 메모리 전체를 한 번에 광범위하게 회상하고 싶다면 `memory_search`를 사용하세요
- 출처를 인지하는 위키 결과가 필요하다면 `wiki_search`와 `wiki_get`을 사용하세요
- 두 계층 모두를 아우르는 공유 검색이 필요하다면 `memory_search corpus=all`을 사용하세요

브리지 모드가 내보낸 아티팩트 수를 0으로 보고한다면, active memory Plugin이 아직 공개 브리지 입력을 노출하지 않고 있는 것입니다. 먼저 `openclaw wiki doctor`를 실행한 뒤, active memory Plugin이 공개 아티팩트를 지원하는지 확인하세요.

## 볼트 모드

`memory-wiki`는 세 가지 볼트 모드를 지원합니다:

### `isolated`

독립적인 볼트, 독립적인 소스, `memory-core`에 대한 의존성 없음.

위키를 자체적으로 큐레이션된 지식 저장소로 사용하고 싶을 때 사용하세요.

### `bridge`

공개 Plugin SDK 경계를 통해 active memory Plugin의 공개 메모리 아티팩트와 메모리 이벤트를 읽습니다.

Plugin 내부 비공개 구현에 접근하지 않고, memory Plugin이 내보낸 아티팩트를 위키에서 컴파일하고 정리하고 싶을 때 사용하세요.

브리지 모드는 다음을 인덱싱할 수 있습니다:

- 내보낸 메모리 아티팩트
- dream 보고서
- 일일 노트
- 메모리 루트 파일
- 메모리 이벤트 로그

### `unsafe-local`

로컬 비공개 경로를 위한, 동일 머신 전용의 명시적 탈출구입니다.

이 모드는 의도적으로 실험적이며 이식성이 없습니다. 신뢰 경계를 이해하고, 브리지 모드로는 제공할 수 없는 로컬 파일 시스템 접근이 꼭 필요할 때만 사용하세요.

## 볼트 레이아웃

Plugin은 다음과 같이 볼트를 초기화합니다:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

관리되는 콘텐츠는 생성된 블록 내부에 유지됩니다. 사람이 작성한 노트 블록은 보존됩니다.

주요 페이지 그룹은 다음과 같습니다:

- `sources/` -- 가져온 원본 자료 및 브리지 기반 페이지
- `entities/` -- 지속적인 사물, 사람, 시스템, 프로젝트, 객체
- `concepts/` -- 아이디어, 추상화, 패턴, 정책
- `syntheses/` -- 컴파일된 요약 및 관리되는 롤업
- `reports/` -- 생성된 대시보드

## 구조화된 주장과 증거

페이지는 자유 형식 텍스트뿐 아니라 구조화된 `claims` 프론트매터를 가질 수 있습니다.

각 주장은 다음을 포함할 수 있습니다:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

증거 항목은 다음을 포함할 수 있습니다:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

이 구조 덕분에 위키는 수동적인 노트 덤프가 아니라 신념 계층처럼 동작합니다. 주장은 추적, 점수화, 이의 제기, 그리고 소스로의 해결이 가능합니다.

## 컴파일 파이프라인

컴파일 단계는 위키 페이지를 읽고, 요약을 정규화한 뒤, 안정적인 기계 지향 아티팩트를 다음 위치에 출력합니다:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

이 다이제스트는 agent와 런타임 코드가 Markdown 페이지를 긁어오지 않아도 되도록 존재합니다.

컴파일된 출력은 다음에도 사용됩니다:

- search/get 흐름을 위한 1차 위키 인덱싱
- claim id를 소유 페이지로 역조회
- 간결한 프롬프트 보충
- 보고서/대시보드 생성

## 대시보드와 상태 보고서

`render.createDashboards`가 활성화되면 컴파일은 `reports/` 아래의 대시보드를 유지합니다.

기본 제공 보고서는 다음과 같습니다:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

이 보고서들은 다음과 같은 항목을 추적합니다:

- 모순 노트 클러스터
- 경쟁하는 주장 클러스터
- 구조화된 증거가 없는 주장
- 신뢰도가 낮은 페이지와 주장
- 오래되었거나 최신성이 알 수 없는 항목
- 해결되지 않은 질문이 있는 페이지

## 검색 및 검색 결과 가져오기

`memory-wiki`는 두 가지 검색 백엔드를 지원합니다:

- `shared`: 가능할 때 공유 메모리 검색 흐름 사용
- `local`: 위키를 로컬에서 검색

또한 세 가지 corpus를 지원합니다:

- `wiki`
- `memory`
- `all`

중요한 동작:

- `wiki_search`와 `wiki_get`은 가능할 때 컴파일된 다이제스트를 1차 패스로 사용합니다
- claim id는 소유 페이지로 다시 해석될 수 있습니다
- 이의 제기됨/오래됨/최신 상태의 주장이 순위화에 영향을 줍니다
- 출처 레이블이 결과까지 유지될 수 있습니다

실전 규칙:

- 광범위한 단일 회상 패스에는 `memory_search corpus=all`을 사용하세요
- 위키 전용 순위화, 출처, 또는 페이지 수준의 신념 구조가 중요하다면 `wiki_search` + `wiki_get`을 사용하세요

## agent 도구

이 Plugin은 다음 도구를 등록합니다:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

각 도구의 역할:

- `wiki_status`: 현재 볼트 모드, 상태, Obsidian CLI 사용 가능 여부
- `wiki_search`: 위키 페이지와, 구성된 경우 공유 메모리 corpus 검색
- `wiki_get`: id/path로 위키 페이지를 읽거나 공유 메모리 corpus로 폴백
- `wiki_apply`: 자유 형식 페이지 수술 없이 좁은 범위의 종합/메타데이터 변경 수행
- `wiki_lint`: 구조 검사, 출처 누락, 모순, 미해결 질문 확인

이 Plugin은 또한 비독점 메모리 corpus 보충도 등록하므로, active memory Plugin이 corpus 선택을 지원하면 공유 `memory_search`와 `memory_get`이 위키에 접근할 수 있습니다.

## 프롬프트 및 컨텍스트 동작

`context.includeCompiledDigestPrompt`가 활성화되면 메모리 프롬프트 섹션은 `agent-digest.json`의 간결한 컴파일 스냅샷을 덧붙입니다.

이 스냅샷은 의도적으로 작고 신호 밀도가 높습니다:

- 상위 페이지만
- 상위 주장만
- 모순 개수
- 질문 개수
- 신뢰도/최신성 한정자

이 기능은 프롬프트 형태를 바꾸며, 주로 컨텍스트 엔진이나 메모리 보충을 명시적으로 소비하는 레거시 프롬프트 조립에 유용하기 때문에 옵트인입니다.

## 구성

구성은 `plugins.entries.memory-wiki.config` 아래에 두세요:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

주요 전환 항목:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` 또는 `obsidian`
- `bridge.readMemoryArtifacts`: active memory Plugin 공개 아티팩트 가져오기
- `bridge.followMemoryEvents`: 브리지 모드에서 이벤트 로그 포함
- `search.backend`: `shared` 또는 `local`
- `search.corpus`: `wiki`, `memory`, 또는 `all`
- `context.includeCompiledDigestPrompt`: 메모리 프롬프트 섹션에 간결한 다이제스트 스냅샷 추가
- `render.createBacklinks`: 결정적인 관련 블록 생성
- `render.createDashboards`: 대시보드 페이지 생성

### 예시: QMD + 브리지 모드

회상에는 QMD를, 관리되는 지식 계층에는 `memory-wiki`를 사용하려면 다음과 같이 구성하세요:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

이렇게 하면 다음이 유지됩니다:

- active memory 회상은 QMD가 담당
- `memory-wiki`는 컴파일된 페이지와 대시보드에 집중
- 컴파일된 다이제스트 프롬프트를 의도적으로 활성화하기 전까지 프롬프트 형태는 변경되지 않음

## CLI

`memory-wiki`는 최상위 CLI 표면도 제공합니다:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

전체 명령 참조는 [CLI: wiki](/cli/wiki)를 참고하세요.

## Obsidian 지원

`vault.renderMode`가 `obsidian`이면 Plugin은 Obsidian 친화적인 Markdown을 기록하고 선택적으로 공식 `obsidian` CLI를 사용할 수 있습니다.

지원되는 워크플로에는 다음이 포함됩니다:

- 상태 확인
- 볼트 검색
- 페이지 열기
- Obsidian 명령 호출
- 일일 노트로 이동

이 기능은 선택 사항입니다. 위키는 Obsidian 없이도 native 모드에서 계속 동작합니다.

## 권장 워크플로

1. 회상/승격/Dreaming용 active memory Plugin은 그대로 유지하세요.
2. `memory-wiki`를 활성화하세요.
3. 명시적으로 브리지 모드를 원하지 않는 한 `isolated` 모드로 시작하세요.
4. 출처가 중요할 때는 `wiki_search` / `wiki_get`을 사용하세요.
5. 좁은 범위의 종합 또는 메타데이터 업데이트에는 `wiki_apply`를 사용하세요.
6. 의미 있는 변경 후에는 `wiki_lint`를 실행하세요.
7. 오래됨/모순 가시성이 필요하다면 대시보드를 켜세요.

## 관련 문서

- [메모리 개요](/ko/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
