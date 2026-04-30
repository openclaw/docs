---
read_when:
    - 메모리의 작동 방식을 이해하고 싶습니다
    - 어떤 메모리 파일을 작성해야 하는지 알고 싶습니다
summary: OpenClaw가 여러 세션에 걸쳐 정보를 기억하는 방식
title: 메모리 개요
x-i18n:
    generated_at: "2026-04-30T06:26:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecf6cf2c95ce3ee78d62923e795f16957088f0eb6620ed50647cff05b99bd572
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw는 에이전트의 작업 공간에 **일반 Markdown 파일**을 작성하여 내용을 기억합니다. 모델은 디스크에 저장된 것만 "기억"하며, 숨겨진 상태는 없습니다.

## 작동 방식

에이전트에는 메모리와 관련된 파일이 세 개 있습니다.

- **`MEMORY.md`** — 장기 메모리. 지속적인 사실, 선호도, 결정 사항입니다. 모든 DM 세션 시작 시 로드됩니다.
- **`memory/YYYY-MM-DD.md`** — 일일 노트. 진행 중인 컨텍스트와 관찰 내용입니다. 오늘과 어제의 노트는 자동으로 로드됩니다.
- **`DREAMS.md`** (선택 사항) — 사람이 검토할 수 있는 Dream Diary와 Dreaming 스윕 요약이며, 근거가 있는 과거 백필 항목을 포함합니다.

이 파일들은 에이전트 작업 공간(기본값 `~/.openclaw/workspace`)에 있습니다.

<Tip>
에이전트가 무언가를 기억하게 하고 싶다면, 그냥 이렇게 요청하세요. "내가 TypeScript를 선호한다는 것을 기억해." 에이전트가 적절한 파일에 이를 작성합니다.
</Tip>

## 추론된 약속

일부 향후 후속 조치는 지속적인 사실이 아닙니다. 내일 면접이 있다고 언급했다면, 유용한 메모리는 "면접 후 확인하기"일 수 있으며, "이 내용을 `MEMORY.md`에 영구 저장하기"가 아닐 수 있습니다.

[Commitments](/ko/concepts/commitments)는 이런 경우를 위한 옵트인 방식의 단기 후속 조치 메모리입니다. OpenClaw는 숨겨진 백그라운드 패스에서 이를 추론하고, 동일한 에이전트와 채널로 범위를 제한하며, Heartbeat를 통해 기한이 된 확인 메시지를 전달합니다. 명시적인 리마인더는 계속 [예약된 작업](/ko/automation/cron-jobs)을 사용합니다.

## 메모리 도구

에이전트에는 메모리 작업을 위한 도구가 두 개 있습니다.

- **`memory_search`** — 원문과 표현이 달라도 semantic search를 사용해 관련 노트를 찾습니다.
- **`memory_get`** — 특정 메모리 파일 또는 줄 범위를 읽습니다.

두 도구 모두 Active Memory Plugin(기본값: `memory-core`)에서 제공합니다.

## Memory Wiki 동반 Plugin

지속적인 메모리를 단순한 원시 노트가 아니라 관리되는 지식 베이스처럼 동작하게 하려면, 번들로 제공되는 `memory-wiki` Plugin을 사용하세요.

`memory-wiki`는 지속적인 지식을 다음을 갖춘 wiki vault로 컴파일합니다.

- 결정론적 페이지 구조
- 구조화된 주장과 증거
- 모순 및 최신성 추적
- 생성된 대시보드
- 에이전트/런타임 소비자를 위한 컴파일된 다이제스트
- `wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint` 같은 wiki 네이티브 도구

이는 Active Memory Plugin을 대체하지 않습니다. Active Memory Plugin은 여전히 회상, 승격, Dreaming을 담당합니다. `memory-wiki`는 그 옆에 출처가 풍부한 지식 계층을 추가합니다.

[Memory Wiki](/ko/plugins/memory-wiki)를 참고하세요.

## 메모리 검색

임베딩 제공자가 구성되어 있으면 `memory_search`는 **하이브리드 검색**을 사용합니다. 즉, 벡터 유사도(의미적 의미)와 키워드 일치(ID 및 코드 심볼 같은 정확한 용어)를 결합합니다. 지원되는 제공자 중 하나의 API 키만 있으면 바로 사용할 수 있습니다.

<Info>
OpenClaw는 사용 가능한 API 키에서 임베딩 제공자를 자동 감지합니다. OpenAI, Gemini, Voyage 또는 Mistral 키가 구성되어 있으면 메모리 검색이 자동으로 활성화됩니다.
</Info>

검색 작동 방식, 튜닝 옵션, 제공자 설정에 대한 자세한 내용은 [Memory Search](/ko/concepts/memory-search)를 참고하세요.

## 메모리 백엔드

<CardGroup cols={3}>
<Card title="내장(기본값)" icon="database" href="/ko/concepts/memory-builtin">
SQLite 기반입니다. 키워드 검색, 벡터 유사도, 하이브리드 검색을 바로 사용할 수 있습니다. 추가 의존성이 없습니다.
</Card>
<Card title="QMD" icon="search" href="/ko/concepts/memory-qmd">
재랭킹, 쿼리 확장, 작업 공간 밖 디렉터리 인덱싱 기능을 갖춘 로컬 우선 사이드카입니다.
</Card>
<Card title="Honcho" icon="brain" href="/ko/concepts/memory-honcho">
사용자 모델링, semantic search, 다중 에이전트 인식을 갖춘 AI 네이티브 교차 세션 메모리입니다. Plugin 설치가 필요합니다.
</Card>
<Card title="LanceDB" icon="layers" href="/ko/plugins/memory-lancedb">
OpenAI 호환 임베딩, 자동 회상, 자동 캡처, 로컬 Ollama 임베딩 지원을 갖춘 번들 LanceDB 기반 메모리입니다.
</Card>
</CardGroup>

## 지식 wiki 계층

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/ko/plugins/memory-wiki">
주장, 대시보드, 브리지 모드, Obsidian 친화적 워크플로를 갖춘 출처가 풍부한 wiki vault로 지속적인 메모리를 컴파일합니다.
</Card>
</CardGroup>

## 자동 메모리 플러시

[Compaction](/ko/concepts/compaction)이 대화를 요약하기 전에, OpenClaw는 에이전트에게 중요한 컨텍스트를 메모리 파일에 저장하라고 알리는 조용한 턴을 실행합니다. 이는 기본적으로 켜져 있으며, 아무것도 구성할 필요가 없습니다.

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

이 오버라이드는 메모리 플러시 턴에만 적용되며, 활성 세션 폴백 체인을 상속하지 않습니다.

<Tip>
메모리 플러시는 Compaction 중 컨텍스트 손실을 방지합니다. 에이전트가 대화 속에 아직 파일에 작성되지 않은 중요한 사실을 가지고 있다면, 요약이 발생하기 전에 자동으로 저장됩니다.
</Tip>

## Dreaming

Dreaming은 메모리를 위한 선택적 백그라운드 통합 패스입니다. 단기 신호를 수집하고 후보를 점수화한 뒤, 자격을 갖춘 항목만 장기 메모리(`MEMORY.md`)로 승격합니다.

이는 장기 메모리의 신호 품질을 높게 유지하도록 설계되었습니다.

- **옵트인**: 기본적으로 비활성화되어 있습니다.
- **예약됨**: 활성화하면 `memory-core`가 전체 Dreaming 스윕을 위한 반복 Cron 작업 하나를 자동 관리합니다.
- **임계값 적용**: 승격은 점수, 회상 빈도, 쿼리 다양성 게이트를 통과해야 합니다.
- **검토 가능**: 사람이 검토할 수 있도록 단계 요약과 일기 항목이 `DREAMS.md`에 작성됩니다.

단계 동작, 점수화 신호, Dream Diary 세부 정보는 [Dreaming](/ko/concepts/dreaming)을 참고하세요.

## 근거 기반 백필과 라이브 승격

Dreaming 시스템에는 이제 서로 밀접하게 관련된 두 개의 검토 레인이 있습니다.

- **라이브 Dreaming**은 `memory/.dreams/` 아래의 단기 Dreaming 저장소에서 작업하며, 일반적인 심층 단계가 무엇을 `MEMORY.md`로 승격할 수 있는지 결정할 때 사용하는 것입니다.
- **근거 기반 백필**은 과거 `memory/YYYY-MM-DD.md` 노트를 독립적인 일별 파일로 읽고, 구조화된 검토 출력을 `DREAMS.md`에 작성합니다.

근거 기반 백필은 오래된 노트를 다시 재생하고, 시스템이 어떤 내용을 지속 가능하다고 판단하는지 `MEMORY.md`를 수동 편집하지 않고 검사하고 싶을 때 유용합니다.

다음을 사용하면:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

근거가 있는 지속 후보는 직접 승격되지 않습니다. 일반적인 심층 단계가 이미 사용하는 동일한 단기 Dreaming 저장소에 스테이징됩니다. 즉:

- `DREAMS.md`는 사람이 검토하는 표면으로 유지됩니다.
- 단기 저장소는 기계 대상 랭킹 표면으로 유지됩니다.
- `MEMORY.md`는 여전히 심층 승격에 의해서만 작성됩니다.

재생이 유용하지 않았다고 판단되면, 일반 일기 항목이나 일반 회상 상태를 건드리지 않고 스테이징된 아티팩트를 제거할 수 있습니다.

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # 인덱스 상태와 제공자 확인
openclaw memory search "query"  # 명령줄에서 검색
openclaw memory index --force   # 인덱스 다시 빌드
```

## 추가 자료

- [내장 메모리 엔진](/ko/concepts/memory-builtin): 기본 SQLite 백엔드입니다.
- [QMD 메모리 엔진](/ko/concepts/memory-qmd): 고급 로컬 우선 사이드카입니다.
- [Honcho 메모리](/ko/concepts/memory-honcho): AI 네이티브 교차 세션 메모리입니다.
- [Memory LanceDB](/ko/plugins/memory-lancedb): OpenAI 호환 임베딩을 갖춘 LanceDB 기반 Plugin입니다.
- [Memory Wiki](/ko/plugins/memory-wiki): 컴파일된 지식 vault와 wiki 네이티브 도구입니다.
- [Memory search](/ko/concepts/memory-search): 검색 파이프라인, 제공자, 튜닝입니다.
- [Dreaming](/ko/concepts/dreaming): 단기 회상에서 장기 메모리로의 백그라운드 승격입니다.
- [메모리 구성 참조](/ko/reference/memory-config): 모든 구성 조절 항목입니다.
- [Compaction](/ko/concepts/compaction): Compaction이 메모리와 상호작용하는 방식입니다.

## 관련 항목

- [Active Memory](/ko/concepts/active-memory)
- [Memory search](/ko/concepts/memory-search)
- [내장 메모리 엔진](/ko/concepts/memory-builtin)
- [Honcho 메모리](/ko/concepts/memory-honcho)
- [Memory LanceDB](/ko/plugins/memory-lancedb)
- [Commitments](/ko/concepts/commitments)
