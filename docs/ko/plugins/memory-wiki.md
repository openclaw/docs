---
read_when:
    - 평범한 MEMORY.md 메모를 넘어 지속적인 지식을 원합니다
    - 번들된 memory-wiki Plugin을 구성하는 중입니다
    - wiki_search, wiki_get 또는 브리지 모드를 이해하려는 경우
summary: 'memory-wiki: 출처, 클레임, 대시보드, 브리지 모드를 갖춘 컴파일된 지식 저장소'
title: 메모리 위키
x-i18n:
    generated_at: "2026-06-27T17:46:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91512fbab8bfa87d3be29a75c217f99dbae11d9d7065fcc5ae9aa2c51847ec42
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki`는 지속 메모리를 컴파일된 지식 저장소로 바꾸는 번들 Plugin입니다.

이것은 **Active Memory Plugin을 대체하지 않습니다**. Active Memory Plugin은 계속
회상, 승격, 인덱싱, Dreaming을 담당합니다. `memory-wiki`는 그 옆에서
지속 지식을 결정적 페이지, 구조화된 주장, 출처 이력, 대시보드, 기계 판독 가능
다이제스트를 갖춘 탐색 가능한 위키로 컴파일합니다.

메모리가 Markdown 파일 더미가 아니라 관리되는 지식 계층처럼 동작하기를 원할 때
사용하세요.

## 추가되는 것

- 결정적 페이지 레이아웃을 갖춘 전용 위키 저장소
- 단순한 산문이 아닌 구조화된 주장 및 증거 메타데이터
- 페이지 수준 출처 이력, 신뢰도, 모순, 열린 질문
- 에이전트/런타임 소비자를 위한 컴파일된 다이제스트
- 위키 네이티브 검색/가져오기/적용/린트 도구
- Open Knowledge Format을 컴파일된 위키 개념으로 가져오기
- Active Memory Plugin의 공개 아티팩트를 가져오는 선택적 브리지 모드
- 선택적 Obsidian 친화적 렌더링 모드 및 CLI 통합

## 메모리와 맞물리는 방식

분리를 다음처럼 생각하세요.

| 계층                                                    | 담당                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Active Memory Plugin(`memory-core`, QMD, Honcho 등)     | 회상, 의미 검색, 승격, Dreaming, 메모리 런타임                                             |
| `memory-wiki`                                           | 컴파일된 위키 페이지, 출처 이력이 풍부한 종합, 대시보드, 위키 전용 검색/가져오기/적용     |

Active Memory Plugin이 공유 회상 아티팩트를 노출하면 OpenClaw는
`memory_search corpus=all`로 두 계층을 한 번에 검색할 수 있습니다.

위키 전용 순위 지정, 출처 이력, 직접 페이지 접근이 필요하면 대신
위키 네이티브 도구를 사용하세요.

## 권장 하이브리드 패턴

로컬 우선 설정의 강력한 기본값은 다음과 같습니다.

- 회상 및 광범위한 의미 검색을 위한 Active Memory 백엔드로 QMD 사용
- 지속적으로 종합된 지식 페이지를 위해 `memory-wiki`를 `bridge` 모드로 사용

이 분리는 각 계층이 집중할 수 있어서 잘 작동합니다.

- QMD는 원시 노트, 세션 내보내기, 추가 컬렉션을 검색 가능하게 유지합니다
- `memory-wiki`는 안정적인 엔티티, 주장, 대시보드, 소스 페이지를 컴파일합니다

실무 규칙:

- 메모리 전체에서 광범위한 회상 패스를 한 번 수행하려면 `memory_search`를 사용하세요
- 출처 이력을 인식하는 위키 결과가 필요하면 `wiki_search`와 `wiki_get`을 사용하세요
- 공유 검색이 두 계층 모두에 걸치게 하려면 `memory_search corpus=all`을 사용하세요

브리지 모드가 내보낸 아티팩트 0개를 보고하면 Active Memory Plugin이 아직
공개 브리지 입력을 노출하고 있지 않은 상태입니다. 먼저 `openclaw wiki doctor`를
실행한 다음 Active Memory Plugin이 공개 아티팩트를 지원하는지 확인하세요.

브리지 모드가 활성화되어 있고 `bridge.readMemoryArtifacts`가 활성화되면,
`openclaw wiki status`, `openclaw wiki doctor`, `openclaw wiki bridge
import`는 실행 중인 Gateway를 통해 읽습니다. 이렇게 하면 CLI 브리지 검사가
런타임 메모리 Plugin 컨텍스트와 정렬됩니다. 브리지가 비활성화되었거나 아티팩트
읽기가 꺼져 있으면 해당 명령은 로컬/오프라인 동작을 유지합니다.

## 저장소 모드

`memory-wiki`는 세 가지 저장소 모드를 지원합니다.

### `isolated`

자체 저장소, 자체 소스, `memory-core`에 대한 의존성 없음.

위키를 자체적으로 큐레이션된 지식 저장소로 만들고 싶을 때 사용하세요.

### `bridge`

공개 Plugin SDK 경계를 통해 Active Memory Plugin에서 공개 메모리 아티팩트와
메모리 이벤트를 읽습니다.

비공개 Plugin 내부에 접근하지 않고, 메모리 Plugin이 내보낸 아티팩트를 위키가
컴파일하고 정리하기를 원할 때 사용하세요.

브리지 모드는 다음을 인덱싱할 수 있습니다.

- 내보낸 메모리 아티팩트
- Dream 보고서
- 일일 노트
- 메모리 루트 파일
- 메모리 이벤트 로그

### `unsafe-local`

로컬 비공개 경로를 위한 명시적 동일 머신 탈출구입니다.

이 모드는 의도적으로 실험적이며 이식성이 없습니다. 신뢰 경계를 이해하고 있으며
브리지 모드가 제공할 수 없는 로컬 파일 시스템 접근이 구체적으로 필요할 때만
사용하세요.

## 저장소 레이아웃

Plugin은 다음과 같이 저장소를 초기화합니다.

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

관리되는 콘텐츠는 생성된 블록 안에 유지됩니다. 사람이 작성한 노트 블록은
보존됩니다.

주요 페이지 그룹은 다음과 같습니다.

- 가져온 원자료와 브리지 기반 페이지를 위한 `sources/`
- 지속적인 사물, 사람, 시스템, 프로젝트, 객체를 위한 `entities/`
- 아이디어, 추상화, 패턴, 정책을 위한 `concepts/`
- 컴파일된 요약과 관리되는 롤업을 위한 `syntheses/`
- 생성된 대시보드를 위한 `reports/`

## Open Knowledge Format 가져오기

`memory-wiki`는 압축 해제된 Open Knowledge Format 번들을 다음으로 가져올 수 있습니다.

```bash
openclaw wiki okf import ./bundles/ga4
```

데이터 카탈로그, 문서 크롤러, 보강 에이전트가 이미 OKF를 생성하는 경우 이것이
가장 깔끔하게 맞습니다. OKF를 이식 가능한 교환 아티팩트로 유지한 뒤
`memory-wiki`가 이를 OpenClaw 네이티브 개념 페이지와 컴파일된 다이제스트로
변환하게 하세요.

가져오기 도구는 OKF v0.1 형태를 따릅니다.

- 예약되지 않은 `.md` 파일은 개념 문서입니다
- 가져온 각 개념에는 비어 있지 않은 `type` frontmatter 필드가 필요합니다
- 알 수 없는 OKF `type` 값도 허용됩니다
- 예약된 `index.md` 및 `log.md` 파일은 개념으로 가져오지 않습니다
- 깨진 Markdown 링크 또는 외부 Markdown 링크는 보존됩니다

가져온 개념 페이지는 `concepts/` 아래에 평탄화되므로 기존 컴파일, 검색, 가져오기,
대시보드, 프롬프트 다이제스트 경로가 두 번째 위키 트리를 추가하지 않고도 이를
볼 수 있습니다. 각 페이지는 원래 OKF 개념 ID, 소스 경로, `type`, `resource`,
`tags`, 타임스탬프, 전체 생산자 frontmatter를 유지합니다. 내부 OKF 링크는
생성된 위키 개념 페이지로 다시 작성되며, `kind: okf-link`를 포함한 구조화된
`relationships` 항목으로도 내보내집니다.

## 구조화된 주장과 증거

페이지는 자유 형식 텍스트뿐 아니라 구조화된 `claims` frontmatter를 가질 수 있습니다.

각 주장은 다음을 포함할 수 있습니다.

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

증거 항목은 다음을 포함할 수 있습니다.

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

이것이 위키를 수동적인 노트 덤프가 아니라 믿음 계층처럼 동작하게 합니다.
주장은 추적, 점수화, 이의 제기, 소스로의 해결이 가능합니다.

## 에이전트 대상 엔티티 메타데이터

엔티티 페이지는 에이전트 사용을 위한 라우팅 메타데이터도 가질 수 있습니다.
이것은 일반 frontmatter이므로 사람, 팀, 시스템, 프로젝트 또는 다른 모든
엔티티 유형에 사용할 수 있습니다.

일반적인 필드는 다음과 같습니다.

- `entityType`: 예: `person`, `team`, `system`, 또는 `project`
- `canonicalId`: 별칭과 가져오기 전반에서 사용되는 안정적인 식별 키
- `aliases`: 같은 페이지로 해석되어야 하는 이름, 핸들 또는 레이블
- `privacyTier`: `public`, `local-private`, `sensitive`, 또는 `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: 간결한 라우팅 힌트
- `lastRefreshedAt`: 페이지 편집 시간과 별도인 소스 새로 고침 타임스탬프
- `personCard`: 핸들, 소셜, 이메일, 시간대, 레인, 요청할 항목, 요청을 피할 항목,
  신뢰도, 개인정보 등급이 포함된 선택적 사람 전용 라우팅 카드
- `relationships`: 대상, 종류, 가중치, 신뢰도, 증거 종류, 개인정보 등급, 노트가
  포함된 관련 페이지로 향하는 타입 지정 엣지

사람 위키의 경우 에이전트는 일반적으로 `reports/person-agent-directory.md`에서
시작한 다음, 연락처 세부 정보나 추론된 사실을 사용하기 전에 `wiki_get`으로 사람
페이지를 열어야 합니다.

예:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## 컴파일 파이프라인

컴파일 단계는 위키 페이지를 읽고, 요약을 정규화하며, 다음 위치 아래에 안정적인
머신 대상 아티팩트를 내보냅니다.

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

이 다이제스트는 에이전트와 런타임 코드가 Markdown 페이지를 스크래핑하지 않아도
되도록 존재합니다.

컴파일된 출력은 다음도 구동합니다.

- 검색/가져오기 흐름을 위한 1차 위키 인덱싱
- 주장 ID에서 소유 페이지로의 역조회
- 간결한 프롬프트 보충 자료
- 보고서/대시보드 생성

## 대시보드와 상태 보고서

`render.createDashboards`가 활성화되면 컴파일은 `reports/` 아래 대시보드를
관리합니다.

내장 보고서는 다음을 포함합니다.

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

이 보고서는 다음과 같은 항목을 추적합니다.

- 모순 노트 클러스터
- 경쟁하는 주장 클러스터
- 구조화된 증거가 누락된 주장
- 낮은 신뢰도의 페이지와 주장
- 오래되었거나 알 수 없는 최신성
- 해결되지 않은 질문이 있는 페이지
- 사람/엔티티 라우팅 카드
- 구조화된 관계 엣지
- 증거 클래스 커버리지
- 사용 전 검토가 필요한 비공개 개인정보 등급

## 검색과 조회

`memory-wiki`는 두 가지 검색 백엔드를 지원합니다.

- `shared`: 사용 가능한 경우 공유 메모리 검색 흐름 사용
- `local`: 위키를 로컬에서 검색

또한 세 가지 말뭉치를 지원합니다.

- `wiki`
- `memory`
- `all`

중요 동작:

- `wiki_search`와 `wiki_get`은 가능하면 컴파일된 다이제스트를 1차 패스로 사용합니다
- 주장 ID는 소유 페이지로 역해결될 수 있습니다
- 논쟁 중인/오래된/최신 주장은 순위 지정에 영향을 줍니다
- 출처 이력 레이블은 결과까지 유지될 수 있습니다
- 검색 모드는 사람 조회, 질문 라우팅, 소스 증거, 원시 주장에 대해 순위 지정을
  편향할 수 있습니다

실무 규칙:

- 하나의 광범위한 회상 패스를 위해 `memory_search corpus=all`을 사용하세요
- 위키 전용 순위 지정, 출처 이력 또는 페이지 수준 믿음 구조가 중요하면
  `wiki_search` + `wiki_get`을 사용하세요

검색 모드:

- `auto`: 균형 잡힌 기본값
- `find-person`: 사람 같은 엔티티, 별칭, 핸들, 소셜, 정규 ID를 강화
- `route-question`: 에이전트 카드, 요청할 항목 힌트, 가장 적합한 용도 힌트,
  관계 컨텍스트를 강화
- `source-evidence`: 소스 페이지와 구조화된 증거 메타데이터를 강화
- `raw-claim`: 일치하는 구조화된 주장을 강화하고 결과에 주장/증거 메타데이터를 반환

결과가 구조화된 주장과 일치하면 `wiki_search`는 세부 정보 페이로드에
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds`, `evidenceSourceIds`를 반환할 수 있습니다. 텍스트 출력도 사용
가능한 경우 간결한 `Claim:` 및 `Evidence:` 줄을 포함합니다.

## 에이전트 도구

Plugin은 다음 도구를 등록합니다.

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

각 도구의 역할:

- `wiki_status`: 현재 저장소 모드, 상태, Obsidian CLI 가용성
- `wiki_search`: 위키 페이지와, 설정된 경우 공유 메모리 말뭉치 검색;
  사람 조회, 질문 라우팅, 소스 증거 또는 원시 주장 드릴다운을 위한 `mode`를 받음
- `wiki_get`: ID/경로로 위키 페이지 읽기 또는 공유 메모리 말뭉치로 폴백
- `wiki_apply`: 자유 형식 페이지 수술 없이 좁은 종합/메타데이터 변경
- `wiki_lint`: 구조 검사, 출처 이력 누락, 모순, 열린 질문

Plugin은 또한 비독점 메모리 코퍼스 보충 자료를 등록하므로, Active Memory
Plugin이 코퍼스 선택을 지원할 때 공유 `memory_search`와 `memory_get`이 위키에 접근할 수 있습니다.

## 프롬프트 및 컨텍스트 동작

`context.includeCompiledDigestPrompt`가 활성화되면, 메모리 프롬프트 섹션은
`agent-digest.json`의 압축된 컴파일 스냅샷을 덧붙입니다.

이 스냅샷은 의도적으로 작고 신호 밀도가 높습니다.

- 상위 페이지만
- 상위 주장만
- 모순 수
- 질문 수
- 신뢰도/최신성 한정자

이는 프롬프트 형태를 변경하며, 메모리 보충 자료를 명시적으로 소비하는
컨텍스트 엔진이나 레거시 프롬프트 조립에 주로 유용하므로 옵트인입니다.

## 구성

구성은 `plugins.entries.memory-wiki.config` 아래에 넣습니다.

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

주요 토글:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` 또는 `obsidian`
- `bridge.readMemoryArtifacts`: Active Memory Plugin의 공개 아티팩트 가져오기
- `bridge.followMemoryEvents`: 브리지 모드에서 이벤트 로그 포함
- `search.backend`: `shared` 또는 `local`
- `search.corpus`: `wiki`, `memory`, 또는 `all`
- `context.includeCompiledDigestPrompt`: 압축 다이제스트 스냅샷을 메모리 프롬프트 섹션에 덧붙이기
- `render.createBacklinks`: 결정론적 관련 블록 생성
- `render.createDashboards`: 대시보드 페이지 생성

### 예: QMD + 브리지 모드

회상에는 QMD를 사용하고 유지 관리되는 지식 계층에는 `memory-wiki`를
사용하려는 경우 이 구성을 사용합니다.

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
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

이 구성은 다음을 유지합니다.

- Active Memory 회상은 QMD가 담당
- `memory-wiki`는 컴파일된 페이지와 대시보드에 집중
- 컴파일 다이제스트 프롬프트를 의도적으로 활성화하기 전까지 프롬프트 형태는 변경되지 않음

## CLI

`memory-wiki`는 최상위 CLI 표면도 제공합니다.

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

전체 명령 참조는 [CLI: wiki](/ko/cli/wiki)를 참조하세요.

## Obsidian 지원

`vault.renderMode`가 `obsidian`이면, Plugin은 Obsidian 친화적
Markdown을 작성하고 선택적으로 공식 `obsidian` CLI를 사용할 수 있습니다.

지원되는 워크플로에는 다음이 포함됩니다.

- 상태 탐색
- 볼트 검색
- 페이지 열기
- Obsidian 명령 호출
- 일일 노트로 이동

이는 선택 사항입니다. 위키는 Obsidian 없이 네이티브 모드에서도 계속 작동합니다.

## 권장 워크플로

1. 회상/승격/Dreaming에는 Active Memory Plugin을 유지합니다.
2. `memory-wiki`를 활성화합니다.
3. 브리지 모드를 명시적으로 원하지 않는 한 `isolated` 모드로 시작합니다.
4. 출처가 중요할 때 `wiki_search` / `wiki_get`을 사용합니다.
5. 좁은 범위의 종합이나 메타데이터 업데이트에는 `wiki_apply`를 사용합니다.
6. 의미 있는 변경 후에는 `wiki_lint`를 실행합니다.
7. 오래된 항목/모순 가시성이 필요하면 대시보드를 켭니다.

## 관련 문서

- [메모리 개요](/ko/concepts/memory)
- [CLI: memory](/ko/cli/memory)
- [CLI: wiki](/ko/cli/wiki)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
