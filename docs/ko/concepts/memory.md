---
read_when:
    - 메모리가 작동하는 방식을 이해하려고 합니다
    - 어떤 메모리 파일을 작성해야 하는지 알고 싶습니다
summary: OpenClaw가 세션 간에 정보를 기억하는 방식
title: 메모리 개요
x-i18n:
    generated_at: "2026-07-16T12:32:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22542c5df22f1602c89bae05760a5418224d8ee1f1a73679203dec9b2f091f2a
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw는 에이전트의 작업 공간(기본값 `~/.openclaw/workspace`)에 일반 Markdown 파일을 작성하여 정보를 기억합니다. 모델은 디스크에
저장된 내용만 기억하며, 숨겨진 상태는 없습니다.

## 작동 방식

에이전트에는 메모리와 관련된 파일이 세 개 있습니다.

- **`MEMORY.md`** — 장기 메모리입니다. 지속적으로 보존할 사실, 선호 사항, 결정을
  저장합니다. 세션을 시작할 때 로드됩니다.
- **`memory/YYYY-MM-DD.md`**(또는 `memory/YYYY-MM-DD-<slug>.md`) — 일일 메모입니다.
  진행 중인 컨텍스트와 관찰 내용을 저장합니다. 별도 수식어가 없는 `/new` 또는 `/reset`에서는
  오늘과 어제 날짜의 메모가 자동으로 로드되며, 번들로 제공되는 세션 메모리 훅이 작성하는 파일과 같이
  슬러그가 포함된 변형도 날짜만 포함된 파일과 함께
  로드됩니다.
- **`DREAMS.md`**(선택 사항) — 사람이 검토할 수 있는 Dream Diary와 Dreaming 스윕 요약으로,
  근거가 있는 과거 백필 항목을 포함합니다.

<Tip>
에이전트가 무언가를 기억하게 하려면 요청하기만 하면 됩니다. 예: "TypeScript를
선호한다고 기억해 주세요." 에이전트가 적절한 파일에 메모를 작성합니다.
</Tip>

## 저장 위치 구분

`MEMORY.md`은 간결하게 선별된 계층입니다. 세션 시작 시 제공되어야 하는 지속적으로 보존할 사실, 선호 사항, 상시
결정, 짧은 요약을 저장합니다. 원본 대화 기록, 일일 로그 또는 완전한 아카이브를
저장하는 곳이 아닙니다.

`memory/YYYY-MM-DD.md` 파일은 작업 계층입니다. 나중에도 유용할 수 있는 자세한 일일 메모,
관찰 내용, 세션 요약, 원본 컨텍스트를 저장합니다. 이 파일은 `memory_search` 및 `memory_get`을 위해
색인되지만, 매 턴마다 부트스트랩 프롬프트에 삽입되지는
않습니다.

시간이 지나면 에이전트는 일일 메모에서 유용한 내용을 추려
`MEMORY.md`에 저장하고 오래된 장기 항목을 제거합니다. 생성된 작업 공간
지침과 Heartbeat 흐름이 이 작업을 주기적으로 수행하므로, 모든 세부 사항을 위해
`MEMORY.md`을 수동으로 편집할 필요는 없습니다.

`MEMORY.md`이 부트스트랩 파일 예산을 초과하면 OpenClaw는 디스크의 파일은
그대로 유지하지만 컨텍스트에 삽입되는 복사본은 잘라냅니다. 이를 자세한 내용을
`memory/*.md`로 옮기고 `MEMORY.md`에는 지속적으로 보존할 요약만 남기거나, 더 많은
프롬프트 예산을 사용하려면 부트스트랩 제한을 높여야 한다는 신호로 간주하십시오.
`/context list`, `/context detail` 또는 `openclaw doctor`을 사용하여
원본 크기와 삽입된 크기 및 잘림 상태를 확인하십시오.

## 코딩 어시스턴트에서 가져오기

Control UI에서 Codex와 Claude Code의 기존 로컬 메모리를 가져올 수 있습니다.
**Settings** → **Import Memory**를 열고 대상 에이전트를 선택한 다음, 감지된
파일을 검토하고 가져오기를 확인하십시오. OpenClaw는 Markdown 메모리만 복사합니다.

- Codex: `~/.codex/memories`(또는 `CODEX_HOME/memories`) 아래의
  통합된 `MEMORY.md` 및 `memory_summary.md` 파일입니다. 원본 롤아웃 및 대화 기록
  파일은 가져오지 않습니다.
- Claude Code: 각 프로젝트의 `~/.claude/projects/*/memory` 아래에 있는 자동 메모리 디렉터리의
  Markdown 파일과, 존재하는 경우 사용자가 구성한
  `autoMemoryDirectory`입니다. 프로젝트 지침, 세션, 설정,
  자격 증명은 이 메모리 전용 작업에 포함되지 않습니다.

가져온 파일은 선택한 에이전트 작업 공간의 `memory/imports/codex/` 및
`memory/imports/claude-code/` 아래에 별도로 유지됩니다. 이 파일은
`memory_search`을 위해 색인되고 `memory_get`을 통해 사용할 수 있지만, 에이전트의
부트스트랩 `MEMORY.md`에 병합되지는 않습니다. 원본 파일은 변경되지 않습니다.

미리보기에는 대상 충돌이 표시됩니다. 해당 파일을 교체하려면 **Replace existing imports**를
활성화하십시오. 적용 시 검증된 가져오기 전 백업이 생성되며, 덮어쓴 파일의
항목별 복사본이 마이그레이션 보고서에 보존됩니다.

## 작업에 민감한 메모리

대부분의 메모리는 일반적인 Markdown 메모입니다. 일부 메모리는 나중에 에이전트가
수행해야 할 작업에 영향을 줍니다. 이러한 경우에는 사실 자체뿐 아니라 해당 메모에
따라 작업해도 안전한 시점도 기록하십시오.

메모에 다음 내용이 포함되면 작업 경계를 기록하십시오.

- 승인 또는 권한 요구 사항,
- 일시적인 제약 조건,
- 다른 세션, 스레드 또는 사람에게 인계,
- 만료 조건,
- 작업해도 안전한 시점,
- 출처 또는 소유자의 권한,
- 하기 쉬운 특정 작업을 피하라는 지침.

유용한 작업 민감형 메모에는 다음 내용이 명확히 나타납니다.

- 향후 동작을 변경하는 요소,
- 적용되는 시점 또는 조건,
- 만료되는 시점 또는 작업을 허용하는 조건,
- 에이전트가 피해야 할 작업,
- 신뢰 또는 권한에 영향을 주는 경우 출처 또는 소유자.

메모리는 승인 컨텍스트를 보존할 수 있지만 정책을 강제하지는 않습니다. 강제적인
운영 제어에는 OpenClaw 승인 설정, 샌드박싱, 예약된 작업을
사용하십시오.

예:

```md
API 마이그레이션은 다른 세션에서 설계 중입니다. 향후 턴에서는
이 스레드에서 API 구현을 편집하지 않아야 합니다. 마이그레이션 계획이 반영될 때까지
여기에서 얻은 결과는 설계 입력으로만 사용하십시오.
```

또 다른 예:

```md
신뢰할 수 없는 출처의 보고서는 반영하기 전에 검토해야 합니다. 향후 턴에서는
이를 증거로만 취급하고, 신뢰할 수 있는 검토자가 내용을 확인할 때까지 지속적으로
보존할 메모리로 저장하지 마십시오.
```

모든 메모리에 이 스키마가 필요한 것은 아니며, 단순한 사실은 간결하게 유지할 수 있습니다.
시점, 권한, 만료 또는 작업해도 안전한 컨텍스트가 누락되어 나중에 에이전트가
잘못된 작업을 수행할 수 있다면 작업 민감형 경계를 사용하십시오.

추론된 단기 후속 작업에는 [커밋먼트](/ko/concepts/commitments)를 사용하십시오.
정확한 알림, 시간 지정 확인, 반복 작업에는 [예약된 작업](/ko/automation/cron-jobs)을
사용하십시오. 두 경로 모두 메모리에 관련된 지속적인 컨텍스트를
요약할 수 있습니다.

## 추론된 커밋먼트

일부 향후 후속 작업은 지속적으로 보존할 사실이 아닙니다. 내일 인터뷰가 있다고
언급한 경우 유용한 메모리는 "인터뷰 후에 확인하기"일 수 있으며, "이 내용을
`MEMORY.md`에 영구 저장하기"가 아닐 수 있습니다.

[커밋먼트](/ko/concepts/commitments)는 이러한 경우에 사용하는 선택형 단기 후속 작업
메모리입니다. OpenClaw는 숨겨진 백그라운드 패스에서 이를 추론하고,
동일한 에이전트와 채널로 범위를 제한하며, Heartbeat를 통해 기한이 된 확인 메시지를
전달합니다. 명시적인 알림에는 계속 [예약된 작업](/ko/automation/cron-jobs)을 사용합니다.

## 메모리 도구

에이전트에는 메모리를 다루는 두 가지 도구가 있습니다.

- **`memory_search`** — 표현이 원문과 다르더라도 시맨틱 검색을 사용하여 관련 메모를
  찾습니다.
- **`memory_get`** — 특정 메모리 파일 또는 줄 범위를 읽습니다.

두 도구 모두 활성 메모리 Plugin(기본값: `memory-core`)에서 제공합니다.

## 메모리 검색

임베딩 공급자가 구성된 경우 `memory_search`은 하이브리드 검색을 사용합니다.
벡터 유사도(의미적 의미)와 키워드 일치(ID 및 코드 기호 같은 정확한
용어)를 결합합니다. 지원되는 공급자의 API 키가 있으면 별도 설정 없이
작동합니다.

<Info>
OpenClaw는 기본적으로 OpenAI 임베딩을 사용합니다. Gemini, Voyage,
Mistral, Bedrock, DeepInfra, 로컬 GGUF, Ollama, LM Studio, GitHub Copilot 또는
일반적인 OpenAI 호환 엔드포인트를 사용하려면
`agents.defaults.memorySearch.provider`을 명시적으로 설정하십시오.
</Info>

검색 작동 방식, 조정 옵션, 공급자 설정은 [메모리 검색](/ko/concepts/memory-search)을
참조하십시오.

## 메모리 백엔드

<CardGroup cols={3}>
<Card title="내장형(기본값)" icon="database" href="/ko/concepts/memory-builtin">
SQLite 기반입니다. 키워드 검색, 벡터 유사도, 하이브리드 검색을 별도 설정 없이
사용할 수 있습니다. 추가 종속성이 없습니다.
</Card>
<Card title="QMD" icon="search" href="/ko/concepts/memory-qmd">
재순위 지정, 쿼리 확장, 작업 공간 외부 디렉터리 색인 기능을 제공하는
로컬 우선 사이드카입니다.
</Card>
<Card title="Honcho" icon="brain" href="/ko/concepts/memory-honcho">
사용자 모델링, 시맨틱 검색, 다중 에이전트 인식 기능을 갖춘
AI 네이티브 교차 세션 메모리입니다. Plugin 설치가 필요합니다.
</Card>
<Card title="LanceDB" icon="layers" href="/ko/plugins/memory-lancedb">
OpenAI 호환 임베딩, 자동 회상, 자동 캡처, 로컬 Ollama 임베딩 지원을 갖춘
LanceDB 기반 메모리입니다. Plugin 설치가 필요합니다.
</Card>
</CardGroup>

## 지식 위키 계층

지속적으로 보존할 메모리를 원본 메모보다 관리되는 지식 베이스에 가깝게
사용하려면 번들로 제공되는 `memory-wiki` Plugin을 사용하십시오. 이 Plugin은 지속적으로 보존할
지식을 결정론적인 페이지 구조, 구조화된 주장과 증거, 모순 및 최신성 추적, 생성된
대시보드, 컴파일된 다이제스트, 위키 네이티브 도구(`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`)를 갖춘 위키 볼트로 컴파일합니다.

`memory-wiki`은 활성 메모리 Plugin을 대체하지 않습니다. 활성 메모리
Plugin이 계속 회상, 승격, Dreaming을 담당합니다. `memory-wiki`은 그 옆에
출처 정보가 풍부한 지식 계층을 추가합니다.

<CardGroup cols={1}>
<Card title="메모리 위키" icon="book" href="/ko/plugins/memory-wiki">
지속적으로 보존할 메모리를 주장, 대시보드, 브리지 모드, Obsidian 친화적 워크플로를 갖춘
출처 정보가 풍부한 위키 볼트로 컴파일합니다.
</Card>
</CardGroup>

## 자동 메모리 플러시

[Compaction](/ko/concepts/compaction)이 대화를 요약하기 전에
OpenClaw는 중요한 컨텍스트를 메모리 파일에 저장하도록 에이전트에 알리는 무음 턴을
실행합니다. 이 기능은 기본적으로 활성화되어 있습니다. 비활성화하려면
`agents.defaults.compaction.memoryFlush.enabled: false`을 설정하십시오.

이 정리 턴을 로컬 모델에서 실행하려면 메모리 플러시 턴에만 적용되는 정확한
재정의를 설정하십시오. 활성 세션의 모델 폴백 체인은 상속하지 않습니다.

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

<Tip>
메모리 플러시는 Compaction 중 컨텍스트 손실을 방지합니다. 대화에 아직 파일로
작성되지 않은 중요한 사실이 있으면 요약이 이루어지기 전에
자동으로 저장됩니다.
</Tip>

## Dreaming

Dreaming은 메모리를 위한 선택적 백그라운드 통합 패스입니다. 단기
회상 신호를 수집하고 후보에 점수를 매긴 후, 자격을 갖춘 항목만
장기 메모리(`MEMORY.md`)로 승격합니다.

- **선택형**: 기본적으로 비활성화되어 있습니다.
- **예약형**: 활성화하면 `memory-core`이 전체 Dreaming 스윕을 위한 하나의 반복 Cron
  작업을 자동으로 관리합니다.
- **임계값 적용**: 승격하려면 점수, 회상 빈도, 쿼리 다양성
  게이트를 통과해야 합니다.
- **검토 가능**: 단계 요약과 다이어리 항목이 사람이 검토할 수 있도록
  `DREAMS.md`에 작성됩니다.

단계 동작, 점수 산정 신호, Dream Diary 세부 정보는
[Dreaming](/ko/concepts/dreaming)을 참조하십시오.

## 근거 기반 백필과 실시간 승격

Dreaming 시스템에는 서로 관련된 두 가지 검토 경로가 있습니다.

- **실시간 Dreaming**은 `memory/.dreams/` 아래의 단기 Dreaming 저장소를
  사용하며, 일반적인 심층 단계가 `MEMORY.md`로 승격할 항목을 결정할 때
  사용합니다.
- **근거 기반 백필**은 과거 `memory/YYYY-MM-DD.md` 메모를 독립적인 일별
  파일로 읽고 구조화된 검토 출력을 `DREAMS.md`에 작성합니다.

근거 기반 백필을 사용하면 `MEMORY.md`을 수동으로 편집하지 않고도 이전 메모를
재생하고 시스템이 지속적으로 보존할 대상으로 간주하는 내용을 검사할 수 있습니다.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

`--stage-short-term` 플래그는 근거가 있는 지속 후보를 일반적인 심층 단계에서 이미 사용하는
동일한 단기 Dreaming 저장소에 스테이징하며, 직접
승격하지는 않습니다. 따라서:

- `DREAMS.md`은 사람이 검토하는 표면으로 유지됩니다.
- 단기 저장소는 머신용 순위 지정 표면으로 유지됩니다.
- `MEMORY.md`은 계속 심층 승격을 통해서만 작성됩니다.

일반적인 다이어리 항목이나 정상적인 회상 상태를 건드리지 않고 재생을
되돌리려면 다음을 실행하십시오.

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # 색인 상태와 공급자 확인
openclaw memory search "query"  # 명령줄에서 검색
openclaw memory index --force   # 색인 다시 빌드
```

## 더 읽을거리

- [메모리 검색](/ko/concepts/memory-search): 검색 파이프라인, 제공자 및 튜닝.
- [내장 메모리 엔진](/ko/concepts/memory-builtin): 기본 SQLite 백엔드.
- [QMD 메모리 엔진](/ko/concepts/memory-qmd): 고급 로컬 우선 사이드카.
- [Honcho 메모리](/ko/concepts/memory-honcho): AI 네이티브 세션 간 메모리.
- [Memory LanceDB](/ko/plugins/memory-lancedb): OpenAI 호환 임베딩을 사용하는 LanceDB 기반 Plugin.
- [Memory Wiki](/ko/plugins/memory-wiki): 컴파일된 지식 저장소와 위키 네이티브 도구.
- [Dreaming](/ko/concepts/dreaming): 단기 회상에서 장기 메모리로의 백그라운드 승격.
- [메모리 구성 참조](/ko/reference/memory-config): 모든 구성 옵션.
- [Compaction](/ko/concepts/compaction): Compaction이 메모리와 상호 작용하는 방식.
- [Active Memory](/ko/concepts/active-memory): 대화형 채팅 세션을 위한 하위 에이전트 메모리.
