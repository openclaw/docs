---
read_when:
    - memory_search가 어떻게 작동하는지 이해하려고 합니다
    - 임베딩 제공자를 선택하려고 합니다
    - 검색 품질을 조정하려는 경우
summary: 메모리 검색이 임베딩과 하이브리드 검색을 사용해 관련 노트를 찾는 방식
title: 메모리 검색
x-i18n:
    generated_at: "2026-06-27T17:23:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bcb8cf400100ba8b6ddbb46bdf8b2a89a8bc32a550ee6df47c874e7e9e0879
    source_path: concepts/memory-search.md
    workflow: 16
---

`memory_search`는 표현이 원문과 달라도 메모리 파일에서 관련 노트를 찾습니다. 메모리를 작은 청크로 색인한 뒤 임베딩, 키워드 또는 둘 다를 사용해 검색하는 방식으로 작동합니다.

## 빠른 시작

메모리 검색은 기본적으로 OpenAI 임베딩을 사용합니다. 다른 임베딩 백엔드를 사용하려면 provider를 명시적으로 설정하세요.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // or "gemini", "local", "ollama", "openai-compatible", etc.
      },
    },
  },
}
```

메모리 전용 provider가 있는 다중 엔드포인트 설정에서는 해당 provider가 `api: "ollama"` 또는 다른 메모리 임베딩 어댑터 소유자를 설정하는 경우, `provider`가 `ollama-5080` 같은 사용자 지정 `models.providers.<id>` 항목일 수도 있습니다.

API 키 없이 로컬 임베딩을 사용하려면 `@openclaw/llama-cpp-provider`를 설치하고 `provider: "local"`을 설정하세요. 소스 체크아웃에서는 여전히 네이티브 빌드 승인이 필요할 수 있습니다: `pnpm approve-builds`를 실행한 다음 `pnpm rebuild node-llama-cpp`를 실행하세요.

일부 OpenAI 호환 임베딩 엔드포인트는 검색에는 `input_type: "query"`, 색인된 청크에는 `input_type: "document"` 또는 `"passage"` 같은 비대칭 레이블이 필요합니다. `memorySearch.queryInputType` 및 `memorySearch.documentInputType`으로 이를 구성하세요. [메모리 구성 참조](/ko/reference/memory-config#provider-specific-config)를 확인하세요.

## 지원되는 provider

| Provider          | ID                  | API 키 필요 | 참고                          |
| ----------------- | ------------------- | ----------- | ----------------------------- |
| Bedrock           | `bedrock`           | 아니요      | AWS 자격 증명 체인을 사용     |
| DeepInfra         | `deepinfra`         | 예          | 기본값: `BAAI/bge-m3`         |
| Gemini            | `gemini`            | 예          | 이미지/오디오 색인 지원       |
| GitHub Copilot    | `github-copilot`    | 아니요      | Copilot 구독 사용             |
| Local             | `local`             | 아니요      | GGUF 모델, 약 0.6GB 다운로드  |
| Mistral           | `mistral`           | 예          |                               |
| Ollama            | `ollama`            | 아니요      | 로컬/자체 호스팅              |
| OpenAI            | `openai`            | 예          | 기본값                        |
| OpenAI-compatible | `openai-compatible` | 보통        | 일반 `/v1/embeddings`         |
| Voyage            | `voyage`            | 예          |                               |

## 검색 작동 방식

OpenClaw는 두 검색 경로를 병렬로 실행하고 결과를 병합합니다.

```mermaid
flowchart LR
    Q["Query"] --> E["Embedding"]
    Q --> T["Tokenize"]
    E --> VS["Vector Search"]
    T --> BM["BM25 Search"]
    VS --> M["Weighted Merge"]
    BM --> M
    M --> R["Top Results"]
```

- **벡터 검색**은 의미가 비슷한 노트를 찾습니다("gateway host"는
  "the machine running OpenClaw"와 일치).
- **BM25 키워드 검색**은 정확한 일치 항목을 찾습니다(IDs, 오류 문자열, config
  키).

한 경로만 사용할 수 있으면 다른 경로 없이 단독으로 실행됩니다. 의도적인 FTS 전용 모드(`provider: "none"`)와 자동/기본 provider 선택은 임베딩을 사용할 수 없을 때도 어휘 순위를 사용할 수 있습니다.

명시적인 비로컬 임베딩 provider는 다릅니다. `memorySearch.provider`를 구체적인 원격 기반 provider로 설정했고 해당 provider를 런타임에 사용할 수 없으면, `memory_search`는 FTS 전용 결과를 조용히 사용하는 대신 메모리를 사용할 수 없다고 보고합니다. 이렇게 하면 손상된 구성의 의미 검색 provider가 드러납니다. 의도적으로 FTS 전용 회상을 사용하려면 `provider: "none"`을 설정하거나, provider/auth 구성을 수정해 의미 순위를 복원하세요.

## 검색 품질 개선

노트 기록이 많을 때 도움이 되는 선택적 기능 두 가지가 있습니다.

### 시간 감쇠

오래된 노트는 점진적으로 순위 가중치를 잃어 최근 정보가 먼저 표시됩니다. 기본 반감기 30일에서는 지난달의 노트가 원래 가중치의 50% 점수를 받습니다. `MEMORY.md` 같은 상시 유효 파일은 감쇠되지 않습니다.

<Tip>
에이전트에 여러 달 분량의 일일 노트가 있고 오래된 정보가 최근 컨텍스트보다 계속 높은 순위를 차지한다면 시간 감쇠를 활성화하세요.
</Tip>

### MMR(다양성)

중복 결과를 줄입니다. 다섯 개의 노트가 모두 같은 라우터 config를 언급하는 경우, MMR은 상위 결과가 반복되는 대신 서로 다른 주제를 포괄하도록 보장합니다.

<Tip>
`memory_search`가 서로 다른 일일 노트에서 거의 중복된 스니펫을 계속 반환한다면 MMR을 활성화하세요.
</Tip>

### 둘 다 활성화

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            mmr: { enabled: true },
            temporalDecay: { enabled: true },
          },
        },
      },
    },
  },
}
```

## 멀티모달 메모리

Gemini Embedding 2를 사용하면 Markdown과 함께 이미지 및 오디오 파일을 색인할 수 있습니다. 검색 쿼리는 텍스트로 유지되지만 시각 및 오디오 콘텐츠와 일치합니다. 설정은 [메모리 구성 참조](/ko/reference/memory-config)를 확인하세요.

## 세션 메모리 검색

선택적으로 세션 transcript를 색인하여 `memory_search`가 이전 대화를 회상할 수 있게 할 수 있습니다. 이는 `memorySearch.experimental.sessionMemory`를 통한 옵트인 기능입니다. 자세한 내용은 [구성 참조](/ko/reference/memory-config)를 확인하세요.

## 문제 해결

**결과가 없나요?** 색인을 확인하려면 `openclaw memory status`를 실행하세요. 비어 있으면 `openclaw memory index --force`를 실행하세요.

**키워드 일치만 나오나요?** 임베딩 provider가 구성되지 않았을 수 있습니다. `openclaw memory status --deep`을 확인하세요.

**로컬 임베딩이 시간 초과되나요?** `ollama`, `lmstudio`, `local`은 기본적으로 더 긴 인라인 배치 시간 초과를 사용합니다. 호스트가 단순히 느린 경우 `agents.defaults.memorySearch.sync.embeddingBatchTimeoutSeconds`를 설정하고 `openclaw memory index --force`를 다시 실행하세요.

**CJK 텍스트를 찾을 수 없나요?** `openclaw memory index --force`로 FTS 색인을 다시 빌드하세요.

## 더 읽기

- [Active Memory](/ko/concepts/active-memory) -- 대화형 채팅 세션을 위한 하위 에이전트 메모리
- [메모리](/ko/concepts/memory) -- 파일 레이아웃, 백엔드, 도구
- [메모리 구성 참조](/ko/reference/memory-config) -- 모든 config 조정 항목

## 관련 항목

- [메모리 개요](/ko/concepts/memory)
- [Active memory](/ko/concepts/active-memory)
- [기본 제공 메모리 엔진](/ko/concepts/memory-builtin)
