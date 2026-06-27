---
read_when:
    - OpenClaw의 메모리가 어떻게 작동하는지 이해하고 싶습니다
    - 어떤 메모리 파일을 작성해야 하는지 알고 싶습니다
summary: OpenClaw가 세션 간에 내용을 기억하는 방식
title: 메모리 개요
x-i18n:
    generated_at: "2026-06-27T17:23:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw는 에이전트의 작업공간에 **일반 Markdown 파일**을 작성해 내용을 기억합니다. 모델은 디스크에 저장된 것만 "기억"하며 숨겨진 상태는 없습니다.

## 작동 방식

에이전트에는 메모리 관련 파일이 세 개 있습니다.

- **`MEMORY.md`** — 장기 메모리. 지속되는 사실, 선호도, 결정 사항입니다. 모든 DM 세션이 시작될 때 로드됩니다.
- **`memory/YYYY-MM-DD.md`**(또는 **`memory/YYYY-MM-DD-<slug>.md`**) — 일일 노트.
  실행 중인 컨텍스트와 관찰 내용입니다. 오늘과 어제의 노트는 자동으로 로드되며, `/new` 또는 `/reset`에서 번들된 세션 메모리 훅이 작성하는 것과 같은 슬러그가 붙은 변형도 이제 날짜만 있는 파일과 함께 선택됩니다.
- **`DREAMS.md`**(선택 사항) — 사람이 검토할 수 있는 Dream Diary 및 Dreaming 스윕 요약으로, 근거가 있는 과거 백필 항목을 포함합니다.

이 파일들은 에이전트 작업공간(기본값 `~/.openclaw/workspace`)에 있습니다.

## 어디에 무엇을 넣는가

`MEMORY.md`는 작고 선별된 계층입니다. 지속되는 사실, 선호도, 상시 결정 사항, 그리고 주요 비공개 세션 시작 시 사용할 수 있어야 하는 짧은 요약에 사용하세요. 원시 대화 기록, 일일 로그, 또는 전체 아카이브로 쓰기 위한 파일이 아닙니다.

`memory/YYYY-MM-DD.md` 파일은 작업 계층입니다. 자세한 일일 노트, 관찰 내용, 세션 요약, 나중에도 유용할 수 있는 원시 컨텍스트에 사용하세요. 이 파일들은 `memory_search` 및 `memory_get`을 위해 인덱싱되지만, 매 턴 일반 부트스트랩 프롬프트에 주입되지는 않습니다.

시간이 지나면 에이전트는 일일 노트에서 유용한 내용을 추려 `MEMORY.md`로 옮기고 오래된 장기 항목을 제거해야 합니다. 생성된 작업공간 지침과 Heartbeat 흐름이 이를 주기적으로 수행할 수 있으므로, 기억해야 할 모든 세부 사항마다 `MEMORY.md`를 직접 편집할 필요는 없습니다.

`MEMORY.md`가 부트스트랩 파일 예산을 넘어서면 OpenClaw는 디스크의 파일은 그대로 보존하지만 모델 컨텍스트에 주입되는 사본은 잘라냅니다. 이는 자세한 자료를 `memory/*.md`로 다시 옮기고, `MEMORY.md`에는 지속되는 요약만 남기거나, 명시적으로 더 많은 프롬프트 예산을 쓰고 싶다면 부트스트랩 제한을 올리라는 신호로 보세요. 원본 크기와 주입된 크기, 잘림 상태를 보려면 `/context list`, `/context detail`, 또는 `openclaw doctor`를 사용하세요.

<Tip>
에이전트가 어떤 내용을 기억하길 원한다면 그냥 요청하세요. 예: "TypeScript를 선호한다고 기억해." 에이전트가 적절한 파일에 기록합니다.
</Tip>

## 행동에 민감한 메모리

대부분의 메모리는 일반 Markdown 노트로 작성할 수 있습니다. 하지만 일부 메모리는 나중에 에이전트가 무엇을 해야 하는지에 영향을 줍니다. 그런 경우에는 사실 자체뿐 아니라, 언제 그 노트를 근거로 행동해도 안전한지도 함께 기록하세요.

노트가 다음을 포함한다면 그 행동 경계를 기록하세요.

- 승인 또는 권한 요구 사항,
- 일시적 제약,
- 다른 세션, 스레드, 또는 사람에게 넘기는 작업,
- 만료 조건,
- 행동해도 안전한 시점,
- 출처 또는 소유자의 권한,
- 유혹적인 행동을 피하라는 지침.

유용한 행동 민감 메모리는 다음을 명확히 합니다.

- 향후 동작을 바꾸는 내용,
- 적용되는 시점 또는 조건,
- 만료 시점, 또는 행동을 가능하게 하는 조건,
- 에이전트가 피해야 할 행동,
- 신뢰나 권한에 영향을 준다면 출처 또는 소유자.

메모리는 승인 컨텍스트를 보존할 수 있지만 정책을 강제하지는 않습니다. 강한 운영 제어에는 OpenClaw 승인 설정, 샌드박싱, 예약 작업을 사용하세요.

예시:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

또 다른 예시:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

추론된 단기 후속 작업에는 [commitments](/ko/concepts/commitments)를 사용하세요. 정확한 알림, 시간 지정 확인, 반복 작업에는 [예약 작업](/ko/automation/cron-jobs)을 사용하세요. 메모리는 어느 경로든 그 주변의 지속되는 컨텍스트를 계속 요약할 수 있습니다.

이는 모든 메모리에 필요한 스키마가 아닙니다. 단순한 사실은 간결하게 유지해도 됩니다. 시점, 권한, 만료, 또는 행동해도 안전한 컨텍스트를 잃으면 에이전트가 나중에 잘못된 행동을 할 수 있을 때 행동 민감 경계를 사용하세요.

## 추론된 commitments

일부 향후 후속 작업은 지속되는 사실이 아닙니다. 내일 면접이 있다고 언급했다면 유용한 메모리는 "면접 후 확인하기"일 수 있으며, "`MEMORY.md`에 영구 저장하기"가 아닐 수 있습니다.

[Commitments](/ko/concepts/commitments)는 이런 경우를 위한 옵트인 단기 후속 작업 메모리입니다. OpenClaw는 숨겨진 백그라운드 패스에서 이를 추론하고, 같은 에이전트와 채널로 범위를 제한하며, Heartbeat를 통해 기한이 된 확인 메시지를 전달합니다. 명시적 알림은 여전히 [예약 작업](/ko/automation/cron-jobs)을 사용합니다.

## 메모리 도구

에이전트에는 메모리 작업을 위한 도구가 두 개 있습니다.

- **`memory_search`** — 원문과 표현이 달라도 의미 검색을 사용해 관련 노트를 찾습니다.
- **`memory_get`** — 특정 메모리 파일 또는 줄 범위를 읽습니다.

두 도구는 Active Memory Plugin(기본값: `memory-core`)에서 제공합니다.

## Memory Wiki 동반 Plugin

지속되는 메모리가 단순한 원시 노트가 아니라 관리되는 지식 베이스처럼 동작하길 원한다면 번들된 `memory-wiki` Plugin을 사용하세요.

`memory-wiki`는 지속되는 지식을 다음을 갖춘 위키 보관소로 컴파일합니다.

- 결정적 페이지 구조
- 구조화된 주장과 증거
- 모순 및 최신성 추적
- 생성된 대시보드
- 에이전트/런타임 소비자를 위한 컴파일된 다이제스트
- `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint` 같은 위키 네이티브 도구

이는 Active Memory Plugin을 대체하지 않습니다. Active Memory Plugin은 여전히 회상, 승격, Dreaming을 소유합니다. `memory-wiki`는 그 옆에 출처 정보가 풍부한 지식 계층을 추가합니다.

[Memory Wiki](/ko/plugins/memory-wiki)를 참고하세요.

## 메모리 검색

임베딩 제공자가 구성되어 있으면 `memory_search`는 **하이브리드 검색**을 사용합니다. 즉, 벡터 유사도(의미적 뜻)와 키워드 매칭(ID 및 코드 심볼 같은 정확한 용어)을 결합합니다. 지원되는 제공자 중 하나의 API 키만 있으면 바로 동작합니다.

<Info>
OpenClaw는 기본적으로 OpenAI 임베딩을 사용합니다. Gemini, Voyage, Mistral, local, Ollama, Bedrock, GitHub Copilot, 또는 OpenAI 호환 임베딩을 사용하려면 `agents.defaults.memorySearch.provider`를 명시적으로 설정하세요.
</Info>

검색 작동 방식, 조정 옵션, 제공자 설정에 대한 자세한 내용은 [메모리 검색](/ko/concepts/memory-search)을 참고하세요.

## 메모리 백엔드

<CardGroup cols={3}>
<Card title="Builtin (default)" icon="database" href="/ko/concepts/memory-builtin">
SQLite 기반입니다. 키워드 검색, 벡터 유사도, 하이브리드 검색으로 바로 동작합니다. 추가 의존성이 없습니다.
</Card>
<Card title="QMD" icon="search" href="/ko/concepts/memory-qmd">
재정렬, 쿼리 확장, 작업공간 밖 디렉터리 인덱싱 기능을 갖춘 로컬 우선 사이드카입니다.
</Card>
<Card title="Honcho" icon="brain" href="/ko/concepts/memory-honcho">
사용자 모델링, 의미 검색, 멀티 에이전트 인식을 갖춘 AI 네이티브 교차 세션 메모리입니다. Plugin 설치가 필요합니다.
</Card>
<Card title="LanceDB" icon="layers" href="/ko/plugins/memory-lancedb">
OpenAI 호환 임베딩, 자동 회상, 자동 캡처, 로컬 Ollama 임베딩 지원을 갖춘 번들 LanceDB 기반 메모리입니다.
</Card>
</CardGroup>

## 지식 위키 계층

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/ko/plugins/memory-wiki">
지속되는 메모리를 주장, 대시보드, 브리지 모드, Obsidian 친화 워크플로를 갖춘 출처 정보가 풍부한 위키 보관소로 컴파일합니다.
</Card>
</CardGroup>

## 자동 메모리 플러시

[Compaction](/ko/concepts/compaction)이 대화를 요약하기 전에 OpenClaw는 에이전트에게 중요한 컨텍스트를 메모리 파일에 저장하라고 상기시키는 조용한 턴을 실행합니다. 이는 기본적으로 켜져 있으므로 아무것도 구성할 필요가 없습니다.

해당 정리 턴을 로컬 모델에서 유지하려면 정확한 메모리 플러시 모델 오버라이드를 설정하세요.

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

이 오버라이드는 메모리 플러시 턴에만 적용되며 활성 세션 fallback 체인을 상속하지 않습니다.

<Tip>
메모리 플러시는 Compaction 중 컨텍스트 손실을 방지합니다. 에이전트가 대화 안에 아직 파일에 기록하지 않은 중요한 사실을 가지고 있다면, 요약이 일어나기 전에 자동으로 저장됩니다.
</Tip>

## Dreaming

Dreaming은 메모리를 위한 선택적 백그라운드 통합 패스입니다. 단기 신호를 수집하고, 후보를 점수화하며, 자격을 갖춘 항목만 장기 메모리(`MEMORY.md`)로 승격합니다.

장기 메모리를 높은 신호로 유지하도록 설계되었습니다.

- **옵트인**: 기본적으로 비활성화되어 있습니다.
- **예약됨**: 활성화되면 `memory-core`가 전체 Dreaming 스윕을 위한 반복 Cron 작업 하나를 자동 관리합니다.
- **임계값 기반**: 승격은 점수, 회상 빈도, 쿼리 다양성 게이트를 통과해야 합니다.
- **검토 가능**: 단계 요약과 다이어리 항목이 사람이 검토할 수 있도록 `DREAMS.md`에 작성됩니다.

단계 동작, 점수화 신호, Dream Diary 세부 정보는 [Dreaming](/ko/concepts/dreaming)을 참고하세요.

## 근거 기반 백필과 실시간 승격

Dreaming 시스템에는 이제 밀접하게 관련된 두 개의 검토 레인이 있습니다.

- **실시간 Dreaming**은 `memory/.dreams/` 아래의 단기 Dreaming 저장소에서 작동하며, 일반 깊은 단계가 무엇을 `MEMORY.md`로 승격할 수 있는지 결정할 때 사용하는 방식입니다.
- **근거 기반 백필**은 과거 `memory/YYYY-MM-DD.md` 노트를 독립적인 일별 파일로 읽고 구조화된 검토 출력을 `DREAMS.md`에 작성합니다.

근거 기반 백필은 오래된 노트를 다시 실행하고, `MEMORY.md`를 직접 편집하지 않고도 시스템이 무엇을 지속 가능한 것으로 판단하는지 확인하고 싶을 때 유용합니다.

다음을 사용할 때:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

근거 있는 지속 후보는 직접 승격되지 않습니다. 일반 깊은 단계가 이미 사용하는 동일한 단기 Dreaming 저장소에 스테이징됩니다. 이는 다음을 의미합니다.

- `DREAMS.md`는 사람이 검토하는 표면으로 남습니다.
- 단기 저장소는 기계가 사용하는 랭킹 표면으로 남습니다.
- `MEMORY.md`는 여전히 깊은 승격에 의해서만 작성됩니다.

재실행이 유용하지 않았다고 판단하면 일반 다이어리 항목이나 정상 회상 상태를 건드리지 않고 스테이징된 산출물을 제거할 수 있습니다.

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## 더 읽기

- [내장 메모리 엔진](/ko/concepts/memory-builtin): 기본 SQLite 백엔드입니다.
- [QMD 메모리 엔진](/ko/concepts/memory-qmd): 고급 로컬 우선 사이드카입니다.
- [Honcho 메모리](/ko/concepts/memory-honcho): AI 네이티브 교차 세션 메모리입니다.
- [Memory LanceDB](/ko/plugins/memory-lancedb): OpenAI 호환 임베딩을 갖춘 LanceDB 기반 Plugin입니다.
- [Memory Wiki](/ko/plugins/memory-wiki): 컴파일된 지식 보관소와 위키 네이티브 도구입니다.
- [메모리 검색](/ko/concepts/memory-search): 검색 파이프라인, 제공자, 조정입니다.
- [Dreaming](/ko/concepts/dreaming): 단기 회상에서 장기 메모리로의 백그라운드 승격입니다.
- [메모리 구성 참조](/ko/reference/memory-config): 모든 구성 조정 항목입니다.
- [Compaction](/ko/concepts/compaction): Compaction이 메모리와 상호작용하는 방식입니다.

## 관련

- [Active Memory](/ko/concepts/active-memory)
- [메모리 검색](/ko/concepts/memory-search)
- [내장 메모리 엔진](/ko/concepts/memory-builtin)
- [Honcho 메모리](/ko/concepts/memory-honcho)
- [Memory LanceDB](/ko/plugins/memory-lancedb)
- [Commitments](/ko/concepts/commitments)
