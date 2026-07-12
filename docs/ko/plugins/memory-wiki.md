---
read_when:
    - 단순한 MEMORY.md 메모를 넘어 지식을 지속적으로 보존하려는 경우
    - 번들로 제공되는 memory-wiki Plugin을 구성하고 있습니다
    - 하나의 Gateway에 있는 에이전트마다 별도의 위키 볼트가 필요합니다
    - wiki_search, wiki_get 또는 bridge 모드를 이해하려는 경우
summary: 'memory-wiki: 출처, 주장, 대시보드 및 브리지 모드를 갖춘 컴파일된 지식 저장소'
title: 메모리 위키
x-i18n:
    generated_at: "2026-07-12T01:00:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki`는 지속성 있는 지식을 탐색 가능한 위키로 컴파일하는 번들 Plugin입니다. 결정론적 페이지, 증거가 포함된 구조화된 주장, 출처 추적 정보, 대시보드, 기계 판독 가능한 다이제스트를 제공합니다.

이 Plugin은 Active Memory Plugin을 대체하지 않습니다. 회상, 승격, 인덱싱, Dreaming은 구성된 메모리 백엔드(`memory-core`, QMD, Honcho 등)가 계속 담당합니다. `memory-wiki`는 그 옆에서 지식을 유지 관리되는 위키 계층으로 컴파일합니다.

| 계층                 | 담당 범위                                                                          |
| -------------------- | --------------------------------------------------------------------------------- |
| Active Memory Plugin | 회상, 의미 검색, 승격, Dreaming, 메모리 런타임                                     |
| `memory-wiki`        | 컴파일된 위키 페이지, 출처 추적 정보가 풍부한 종합 자료, 대시보드, 위키 검색/조회/적용 |

실용적인 규칙:

- 구성된 모든 코퍼스를 대상으로 한 번의 광범위한 회상이 필요하면 `memory_search`
- 위키별 순위 지정, 출처 추적 정보 또는 페이지 수준의 신념 구조가 필요하면 `wiki_search` / `wiki_get`
- Active Memory Plugin이 코퍼스 선택을 지원하는 경우 한 번의 호출로 두 계층을 모두 검색하려면 `memory_search corpus=all`

일반적인 로컬 우선 구성은 회상을 위한 Active Memory 백엔드로 QMD를 사용하고, 지속성 있는 종합 페이지를 위해 `memory-wiki`를 `bridge` 모드로 사용하는 것입니다. [구성](#configuration)의 QMD + 브리지 모드 예시를 참조하세요.

브리지 모드에서 내보낸 아티팩트가 0개라고 보고되면 현재 Active Memory Plugin이 공개 브리지 입력을 노출하지 않는 것입니다. 먼저 `openclaw wiki doctor`를 실행한 다음, Active Memory Plugin이 공개 아티팩트를 지원하는지 확인하세요.

## 볼트 모드

- `isolated`(기본값): 자체 볼트와 자체 소스를 사용하며 Active Memory Plugin에 의존하지 않습니다. 독립적으로 구성된 지식 저장소에 사용하세요.
- `bridge`: 공개 Plugin SDK 연결부를 통해 Active Memory Plugin의 공개 메모리 아티팩트와 이벤트 로그를 읽습니다. 비공개 Plugin 내부에 접근하지 않고 메모리 Plugin이 내보낸 아티팩트를 컴파일할 때 사용하세요.
- `unsafe-local`: 로컬 비공개 경로를 위한 명시적인 동일 머신 우회 수단입니다. 의도적으로 실험적이며 이식할 수 없습니다. 신뢰 경계를 이해하고 브리지 모드로는 제공할 수 없는 로컬 파일 시스템 접근이 반드시 필요한 경우에만 사용하세요.

볼트 모드와 볼트 범위는 별개의 선택 사항입니다.

- `vaultMode`는 위키 입력의 출처를 선택합니다.
- `vault.scope`는 모든 에이전트가 하나의 볼트를 사용할지, 각 에이전트가 하위 볼트를 가질지 선택합니다.

`vault.scope: "global"`은 기본값이며 기존의 단일 볼트 동작을 유지합니다. 에이전트 간에 위키 페이지, 컴파일된 다이제스트, 검색 결과 또는 쓰기 작업을 공유해서는 안 되는 경우 `isolated` 또는 `bridge` 모드에서 `vault.scope: "agent"`를 사용하세요. 구성된 비공개 경로는 에이전트 소유 입력이 아니므로 에이전트 범위는 `unsafe-local` 모드와 함께 사용할 수 없습니다. 구성 검증에서 이 조합을 거부합니다.

브리지 모드는 `bridge.*` 구성 토글에 따라 다음 항목을 인덱싱할 수 있습니다.

- 내보낸 메모리 아티팩트(`indexMemoryRoot`)
- 일일 노트(`indexDailyNotes`)
- Dreaming 보고서(`indexDreamReports`)
- 메모리 이벤트 로그(`followMemoryEvents`)

브리지 모드가 활성화되고 `bridge.readMemoryArtifacts`가 켜져 있으면 `openclaw wiki status`, `openclaw wiki doctor`, `openclaw wiki bridge import`는 실행 중인 Gateway를 통해 라우팅되므로 에이전트/런타임 메모리와 동일한 Active Memory Plugin 컨텍스트를 확인합니다. 브리지가 비활성화되어 있거나 아티팩트 읽기가 꺼져 있으면 이러한 명령은 로컬/오프라인 동작을 유지합니다.

## 볼트 레이아웃

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

관리되는 콘텐츠는 생성된 블록 안에 유지되며, 사람이 작성한 노트 블록은 재생성 후에도 보존됩니다.

- `sources/`: 가져온 원본 자료와 브리지/`unsafe-local` 기반 페이지
- `entities/`: 지속성 있는 대상, 사람, 시스템, 프로젝트, 객체
- `concepts/`: 아이디어, 추상 개념, 패턴, 정책(OKF 가져오기의 저장 위치이기도 함)
- `syntheses/`: 컴파일된 요약과 유지 관리되는 종합 자료
- `reports/`: 생성된 대시보드

## Open Knowledge Format 가져오기

```bash
openclaw wiki okf import ./bundles/ga4
```

압축 해제된 Open Knowledge Format 번들을 위키 개념 페이지로 가져옵니다. 데이터 카탈로그, 문서 크롤러 또는 보강 에이전트가 이미 OKF를 생성하는 경우에 적합합니다. OKF는 이식 가능한 교환 아티팩트로 유지하고, `memory-wiki`가 이를 OpenClaw 네이티브 개념 페이지와 컴파일된 다이제스트로 변환하도록 하세요.

- 예약되지 않은 `.md` 파일은 개념 문서입니다.
- 가져오는 각 개념에는 비어 있지 않은 `type` 프런트매터 필드가 필요합니다. `type`이 없으면 `missing-type` 경고가 발생하고 해당 파일을 건너뜁니다.
- 알 수 없는 `type` 값은 일반 개념으로 허용됩니다.
- `index.md`와 `log.md`는 예약되어 있으며 개념으로 가져오지 않습니다.
- 손상되었거나 외부를 가리키는 Markdown 링크는 변경하지 않습니다.

가져온 페이지는 `concepts/` 아래에 평탄화되므로 기존 컴파일, 검색, 조회 및 대시보드 흐름에서 두 번째 위키 트리 없이 확인할 수 있습니다. 각 페이지는 원본 OKF 개념 ID, 소스 경로, `type`, `resource`, `tags`, 타임스탬프 및 전체 생성자 프런트매터를 유지합니다. 내부 OKF 링크는 생성된 위키 개념 페이지를 가리키도록 다시 작성되며, `kind: okf-link`가 포함된 구조화된 `relationships` 항목도 생성합니다.

## 구조화된 주장과 증거

페이지는 자유 형식 텍스트뿐 아니라 구조화된 `claims` 프런트매터를 포함합니다. 각 주장에는 `id`, `text`, `status`, `confidence`, `evidence[]`, `updatedAt`가 포함될 수 있습니다. 각 증거 항목에는 `kind`, `sourceId`, `path`, `lines`, `weight`, `confidence`, `privacyTier`, `note`, `updatedAt`가 포함될 수 있습니다.

이를 통해 위키는 수동적인 노트 저장소가 아니라 신념 계층처럼 동작합니다. 주장을 추적하고, 점수를 매기고, 이의를 제기하며, 소스를 바탕으로 해결할 수 있습니다.

## 에이전트용 엔터티 메타데이터

엔터티 페이지는 사람, 팀, 시스템, 프로젝트 또는 기타 모든 엔터티 유형에 사용할 수 있는 일반 라우팅 메타데이터를 포함합니다.

- `entityType`: 예: `person`, `team`, `system`, `project`
- `canonicalId`: 별칭과 가져오기 전반에서 안정적으로 유지되는 식별 키
- `aliases`: 동일한 페이지로 해석되는 이름, 핸들 또는 레이블
- `privacyTier`: 자유 형식 문자열입니다. `public`은 검토가 필요 없는 것으로 처리되며, 그 밖의 값(예: `local-private`, `sensitive`, `confirm-before-use`)은 `reports/privacy-review.md`에서 표시됩니다.
- `bestUsedFor` / `notEnoughFor`: 간결한 라우팅 힌트
- `lastRefreshedAt`: 페이지 편집 시간과 별개인 소스 새로 고침 타임스탬프
- `personCard`: 선택적인 사람별 라우팅 카드(핸들, 소셜 계정, 이메일, 시간대, 담당 영역, 요청하기 적합한 사항, 요청을 피해야 할 사항, 신뢰도, 개인정보 보호 등급)
- `relationships`: 관련 페이지로 연결되는 유형 지정 간선(대상, 종류, 가중치, 신뢰도, 증거 종류, 개인정보 보호 등급, 노트)

사람 위키에서는 `reports/person-agent-directory.md`부터 확인한 다음, 연락처 정보나 추론된 사실을 사용하기 전에 `wiki_get`으로 해당 인물 페이지를 여세요.

<Accordion title="엔터티 페이지 예시">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - 예시 생태계 라우팅
notEnoughFor:
  - 법적 승인
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: 예시 생태계
  askFor:
    - 예시 출시 관련 질문
  avoidAskingFor:
    - 관련 없는 청구 결정
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: 다른 사람
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex는 예시 생태계 라우팅에 유용합니다.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## 컴파일 파이프라인

컴파일은 위키 페이지를 읽고 요약을 정규화하며 다음 위치에 안정적인 기계용 아티팩트를 생성합니다.

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

에이전트와 런타임 코드는 Markdown을 스크레이핑하는 대신 이러한 다이제스트를 읽습니다. 컴파일된 출력은 검색/조회를 위한 1차 위키 인덱싱, 소유 페이지로의 주장 ID 역조회, 간결한 프롬프트 보충 자료 및 보고서 생성에도 사용됩니다.

## 대시보드 및 상태 보고서

`render.createDashboards`가 활성화되면 컴파일 과정에서 `reports/` 아래의 대시보드를 유지 관리합니다.

| 보고서                              | 추적 대상                                            |
| ----------------------------------- | ---------------------------------------------------- |
| `reports/open-questions.md`         | 해결되지 않은 질문이 있는 페이지                    |
| `reports/contradictions.md`         | 모순 노트 클러스터                                  |
| `reports/low-confidence.md`         | 신뢰도가 낮은 페이지와 주장                         |
| `reports/claim-health.md`           | 구조화된 증거가 없는 주장                           |
| `reports/stale-pages.md`            | 오래되었거나 최신 여부를 알 수 없는 페이지          |
| `reports/person-agent-directory.md` | 사람/엔터티 라우팅 카드                             |
| `reports/relationship-graph.md`     | 구조화된 관계 간선                                  |
| `reports/provenance-coverage.md`    | 증거 클래스 범위                                    |
| `reports/privacy-review.md`         | 사용 전 검토가 필요한 비공개 개인정보 보호 등급     |

## 검색 및 조회

검색 백엔드는 두 가지입니다.

- `shared`: 가능한 경우 공유 메모리 검색 흐름 사용
- `local`: 위키를 로컬에서 검색

코퍼스는 `wiki`, `memory`, `all` 세 가지입니다.

- 가능한 경우 `wiki_search` / `wiki_get`은 컴파일된 다이제스트를 1차 검색에 사용합니다.
- 주장 ID는 해당 주장을 소유한 페이지로 역해석됩니다.
- 이의가 제기된 주장, 오래된 주장, 최신 주장이 순위에 영향을 줍니다.
- 출처 추적 레이블은 결과에도 유지됩니다.

검색 모드(`--mode` / 도구 `mode` 매개변수):

| 모드              | 우선순위가 높아지는 항목                                           |
| ----------------- | ------------------------------------------------------------------ |
| `auto`            | 균형 잡힌 기본값                                                   |
| `find-person`     | 사람과 유사한 엔터티, 별칭, 핸들, 소셜 계정, 정식 ID              |
| `route-question`  | 에이전트 카드, 요청 대상/최적 활용 분야 힌트, 관계 컨텍스트        |
| `source-evidence` | 소스 페이지와 구조화된 증거 메타데이터                             |
| `raw-claim`       | 일치하는 구조화된 주장, 주장/증거 메타데이터 반환                  |

결과가 구조화된 주장과 일치하면 `wiki_search`는 세부 정보 페이로드에 `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds`, `evidenceSourceIds`를 반환합니다. 사용 가능한 경우 텍스트 출력에는 간결한 `Claim:` 및 `Evidence:` 줄이 포함됩니다.

## 에이전트 도구

| 도구          | 용도                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | 현재 볼트 모드와 범위, 확인된 에이전트, 상태, Obsidian CLI 사용 가능 여부                                                                                           |
| `wiki_search` | 위키 페이지와, 구성된 경우 공유 메모리 코퍼스를 검색합니다. 사람 조회, 질문 라우팅, 출처 증거 또는 원시 주장 상세 분석을 위한 `mode`를 받습니다.                    |
| `wiki_get`    | ID/경로로 위키 페이지를 읽고, 공유 검색이 활성화되어 있으며 조회 결과가 없으면 공유 메모리 코퍼스로 대체합니다.                                                     |
| `wiki_apply`  | 자유 형식 페이지 편집 없이 제한적인 종합/메타데이터 변경을 수행합니다.                                                                                              |
| `wiki_lint`   | 구조 검사, 출처 추적 공백, 모순, 미해결 질문                                                                                                                        |

또한 Plugin은 비독점 메모리 코퍼스 보충 자료를 등록하므로, 활성 메모리
Plugin이 코퍼스 선택을 지원하면 공유 `memory_search`와 `memory_get`에서
위키에 접근할 수 있습니다.

## 프롬프트 및 컨텍스트 동작

`context.includeCompiledDigestPrompt`가 활성화되면 메모리 프롬프트 섹션에
`agent-digest.json`의 간결한 컴파일 스냅샷이 추가됩니다. 여기에는 상위
페이지만, 상위 주장만, 모순 수, 질문 수, 신뢰도/최신성 한정자가 포함됩니다.
프롬프트 형식을 변경하므로 선택적으로 사용해야 하며, 주로 메모리 보충 자료를
명시적으로 사용하는 컨텍스트 엔진이나 프롬프트 조합에 중요합니다.

## 구성

`plugins.entries.memory-wiki.config` 아래에 구성을 배치합니다.

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            scope: "global",
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
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
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

주요 설정:

| 키                                         | 값 / 기본값                                    | 참고                                                                                   |
| ------------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated`(기본값), `bridge`, `unsafe-local`   | 입력 및 통합 동작을 선택합니다.                                                        |
| `vault.scope`                              | `global`(기본값), `agent`                      | 하나의 공유 볼트 또는 에이전트별 하나의 하위 볼트                                      |
| `vault.path`                               | 전역 기본값 `~/.openclaw/wiki/main`            | 전역에서는 정확한 볼트 경로이며, 에이전트 범위의 상위 경로 기본값은 `~/.openclaw/wiki` |
| `vault.renderMode`                         | `native`(기본값), `obsidian`                   |                                                                                        |
| `bridge.readMemoryArtifacts`               | 기본값 `true`                                  | 활성 메모리 Plugin의 공개 아티팩트를 가져옵니다.                                       |
| `bridge.followMemoryEvents`                | 기본값 `true`                                  | 브리지 모드에 이벤트 로그를 포함합니다.                                                |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | 기본값 `false`                                 | `unsafe-local` 가져오기를 실행하는 데 필요합니다.                                      |
| `unsafeLocal.paths`                        | 기본값 `[]`                                    | `unsafe-local` 모드에서 가져올 명시적인 로컬 경로                                      |
| `search.backend`                           | `shared`(기본값), `local`                      |                                                                                        |
| `search.corpus`                            | `wiki`(기본값), `memory`, `all`                |                                                                                        |
| `context.includeCompiledDigestPrompt`      | 기본값 `false`                                 | 선택한 에이전트의 간결한 다이제스트 스냅샷을 메모리 프롬프트 섹션에 추가합니다.         |
| `render.createBacklinks`                   | 기본값 `true`                                  | 결정론적 관련 블록을 생성합니다.                                                       |
| `render.createDashboards`                  | 기본값 `true`                                  | 대시보드 페이지를 생성합니다.                                                         |

### 에이전트별 볼트

구성된 각 에이전트에 별도의 위키를 제공하려면 `vault.scope`를 `agent`로
설정합니다. 이 범위에서 `vault.path`는 상위 디렉터리이며 OpenClaw가 정규화된
에이전트 ID를 추가합니다.

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

이는 `~/.openclaw/wiki/support`와
`~/.openclaw/wiki/marketing`으로 확인됩니다. 에이전트 범위에서
`vault.path`를 생략하면 상위 경로의 기본값은 `~/.openclaw/wiki`입니다.
따라서 기본 `main` 에이전트는 기존 `~/.openclaw/wiki/main` 경로를
유지합니다.

에이전트 도구, 컴파일된 프롬프트 다이제스트 및 `memory_search` /
`memory_get`을 통해 노출되는 위키 보충 자료는 활성 에이전트 컨텍스트에서
볼트를 확인합니다. 여러 에이전트가 구성된 환경의 CLI 및 Gateway 호출에서는
`openclaw wiki --agent <agentId> ...` 또는 Gateway 요청의 `agentId`를
사용하여 에이전트를 명시적으로 지정합니다. 구성된 에이전트가 하나뿐이면 ID를
제공하지 않아도 해당 에이전트가 기본값으로 사용됩니다.

브리지 모드에서 에이전트 범위 가져오기는 공개 메모리 아티팩트의 `agentIds`에
선택한 에이전트가 포함된 경우에만 이를 허용합니다. 다른 에이전트가 소유하거나,
소유권 메타데이터가 없거나, 소유자를 알 수 없는 아티팩트는 건너뜁니다. 전역
범위에서는 기존 공유 아티팩트 동작을 유지합니다.

<Warning>
`vault.scope`를 변경해도 기존 볼트를 복사하거나 분할하지 않습니다. 에이전트
범위에서는 명시적으로 구성한 `vault.path`가 상위 디렉터리가 되므로, 프로덕션
에이전트를 전환하기 전에 기존 페이지를 의도적으로 이동하거나 가져오십시오.
먼저 볼트를 백업하십시오.

에이전트별 볼트는 동일 프로세스 내의 지식 경계이지 운영 체제 보안 경계가
아닙니다. 호스트 파일 시스템에 접근할 수 있는 Plugin과 샌드박스되지 않은
도구는 여전히 다른 에이전트의 디렉터리를 읽을 수 있습니다. 에이전트가 서로를
신뢰하지 않는 경우 [샌드박싱](/ko/gateway/sandboxing) 또는
[별도의 Gateway 프로필](/ko/gateway/multiple-gateways)을 사용하십시오.
</Warning>

### 예시: QMD + 브리지 모드

회상에는 QMD를 사용하고 관리되는 지식 계층에는 `memory-wiki`를 사용하려는
경우에 적합합니다. 각 계층은 역할에 집중합니다. QMD는 원시 메모, 세션 내보내기,
추가 컬렉션을 검색 가능하게 유지하고, `memory-wiki`는 안정적인 엔터티, 주장,
대시보드 및 출처 페이지를 컴파일합니다.

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

이 구성에서는 QMD가 활성 메모리 회상을 담당하고, `memory-wiki`는 컴파일된
페이지와 대시보드에 집중하며, 컴파일된 다이제스트 프롬프트를 의도적으로
활성화하기 전까지 프롬프트 형식은 변경되지 않습니다.

## CLI

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

`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` 및 전체 `wiki obsidian`
하위 명령어 모음을 포함한 전체 명령어 참조는 [CLI: 위키](/ko/cli/wiki)를
참조하십시오.

## Obsidian 지원

`vault.renderMode`가 `obsidian`이면 Plugin은 Obsidian 친화적인 Markdown을
작성하며, 선택적으로 공식 `obsidian` CLI를 사용하여 상태 확인, 볼트 검색,
페이지 열기, 명령 호출 및 일일 메모로 이동할 수 있습니다. 이는 선택 사항이며,
Obsidian 없이도 위키는 네이티브 모드에서 계속 작동합니다.

에이전트 범위 볼트에서도 Obsidian 친화적인 Markdown을 사용할 수 있지만,
구성 검증은 `vault.scope: "agent"`와 함께 `obsidian.useOfficialCli: true`를
사용하는 것을 거부합니다. 현재 `obsidian.vaultName` 설정은 전역 설정이며
에이전트별로 서로 다른 Obsidian 볼트를 선택할 수 없습니다. 대신 위키 도구와
CLI 작업을 사용하거나, Obsidian으로 운영하는 위키를 전역 범위로 유지하십시오.

## 권장 워크플로

<Steps>
<Step title="회상용 활성 메모리 Plugin 유지">
회상, 승격 및 Dreaming은 구성된 메모리 백엔드가 계속 담당합니다.
</Step>
<Step title="memory-wiki 활성화">
브리지 모드를 명시적으로 사용하려는 경우가 아니라면 `isolated` 모드로 시작하십시오.
</Step>
<Step title="출처 추적이 중요하면 wiki_search / wiki_get 사용">
위키별 순위 지정이나 페이지 수준의 신념 구조가 필요하면 `memory_search`보다 이 도구들을 우선 사용하십시오.
</Step>
<Step title="제한적인 종합 또는 메타데이터 업데이트에 wiki_apply 사용">
관리되는 생성 블록을 직접 편집하지 마십시오.
</Step>
<Step title="중요한 변경 후 wiki_lint 실행">
모순, 미해결 질문 및 출처 추적 공백을 찾아냅니다.
</Step>
<Step title="오래된 정보와 모순을 확인할 수 있도록 대시보드 활성화">
`render.createDashboards: true`(기본값)로 설정합니다.
</Step>
</Steps>

## 관련 문서

- [메모리 개요](/ko/concepts/memory)
- [CLI: 메모리](/ko/cli/memory)
- [CLI: 위키](/ko/cli/wiki)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
