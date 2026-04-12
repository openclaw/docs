---
read_when:
    - memory_search가 어떻게 작동하는지 이해하고 싶습니다
    - 임베딩 제공자를 선택하고 싶습니다
    - 검색 품질을 조정하고 싶습니다
summary: 메모리 검색이 임베딩과 하이브리드 검색을 사용해 관련 노트를 찾는 방법
title: 메모리 검색
x-i18n:
    generated_at: "2026-04-12T23:28:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71fde251b7d2dc455574aa458e7e09136f30613609ad8dafeafd53b2729a0310
    source_path: concepts/memory-search.md
    workflow: 15
---

# 메모리 검색

`memory_search`는 메모리 파일에서 관련 노트를 찾습니다. 원문과 표현이 달라도 찾을 수 있습니다. 이 기능은 메모리를 작은 청크로 인덱싱한 다음, 임베딩, 키워드 또는 둘 다를 사용해 검색합니다.

## 빠른 시작

OpenAI, Gemini, Voyage 또는 Mistral API 키가 구성되어 있으면 메모리 검색은 자동으로 작동합니다. 제공자를 명시적으로 설정하려면 다음과 같이 하세요.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // 또는 "gemini", "local", "ollama" 등
      },
    },
  },
}
```

API 키 없이 로컬 임베딩을 사용하려면 `provider: "local"`을 사용하세요(`node-llama-cpp` 필요).

## 지원되는 제공자

| 제공자 | ID        | API 키 필요 | 참고                                                 |
| ------- | --------- | ----------- | ---------------------------------------------------- |
| OpenAI  | `openai`  | 예          | 자동 감지, 빠름                                      |
| Gemini  | `gemini`  | 예          | 이미지/오디오 인덱싱 지원                            |
| Voyage  | `voyage`  | 예          | 자동 감지                                            |
| Mistral | `mistral` | 예          | 자동 감지                                            |
| Bedrock | `bedrock` | 아니요      | AWS 자격 증명 체인이 확인되면 자동 감지              |
| Ollama  | `ollama`  | 아니요      | 로컬, 명시적으로 설정해야 함                         |
| Local   | `local`   | 아니요      | GGUF 모델, 약 0.6 GB 다운로드                        |

## 검색 작동 방식

OpenClaw는 두 개의 검색 경로를 병렬로 실행하고 결과를 병합합니다.

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

- **벡터 검색**은 의미가 비슷한 노트를 찾습니다(예: "gateway host"는 "OpenClaw를 실행하는 머신"과 일치).
- **BM25 키워드 검색**은 정확히 일치하는 항목을 찾습니다(ID, 오류 문자열, config 키).

한 경로만 사용할 수 있는 경우(임베딩 없음 또는 FTS 없음) 다른 한 경로만 단독으로 실행됩니다.

임베딩을 사용할 수 없을 때도 OpenClaw는 단순한 원시 exact-match 정렬로만 되돌아가지 않고 FTS 결과에 대해 어휘 기반 순위를 계속 사용합니다. 이 저하 모드에서는 쿼리 용어를 더 강하게 포괄하는 청크와 관련 파일 경로의 점수를 높여, `sqlite-vec` 또는 임베딩 제공자가 없어도 재현율을 유용하게 유지합니다.

## 검색 품질 개선

노트 기록이 많은 경우 도움이 되는 두 가지 선택적 기능이 있습니다.

### 시간 감쇠

오래된 노트는 순위 가중치가 점차 줄어들어 더 최근 정보가 먼저 표시됩니다. 기본 반감기인 30일 기준으로 지난달의 노트는 원래 가중치의 50% 점수를 받습니다. `MEMORY.md` 같은 evergreen 파일에는 감쇠가 적용되지 않습니다.

<Tip>
에이전트에 수개월치 일일 노트가 있고 오래된 정보가 최신 컨텍스트보다 계속 더 높은 순위에 오르면 시간 감쇠를 활성화하세요.
</Tip>

### MMR(다양성)

중복되는 결과를 줄입니다. 다섯 개의 노트가 모두 같은 라우터 구성을 언급하더라도, MMR은 같은 내용을 반복하는 대신 상위 결과가 서로 다른 주제를 다루도록 합니다.

<Tip>
`memory_search`가 서로 다른 일일 노트에서 나온 거의 중복된 스니펫을 계속 반환하면 MMR을 활성화하세요.
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

Gemini Embedding 2를 사용하면 Markdown과 함께 이미지 및 오디오 파일도 인덱싱할 수 있습니다. 검색 쿼리는 여전히 텍스트이지만, 시각 및 오디오 콘텐츠와 매칭됩니다. 설정 방법은 [메모리 구성 참조](/ko/reference/memory-config)를 확인하세요.

## 세션 메모리 검색

선택적으로 세션 전사본을 인덱싱하여 `memory_search`가 이전 대화를 회상할 수 있게 할 수 있습니다. 이 기능은 `memorySearch.experimental.sessionMemory`를 통해 opt-in 방식으로 활성화됩니다. 자세한 내용은 [구성 참조](/ko/reference/memory-config)를 확인하세요.

## 문제 해결

**결과가 없나요?** 인덱스를 확인하려면 `openclaw memory status`를 실행하세요. 비어 있으면 `openclaw memory index --force`를 실행하세요.

**키워드 일치만 보이나요?** 임베딩 제공자가 구성되지 않았을 수 있습니다. `openclaw memory status --deep`를 확인하세요.

**CJK 텍스트를 찾을 수 없나요?** `openclaw memory index --force`로 FTS 인덱스를 다시 빌드하세요.

## 추가 읽을거리

- [Active Memory](/ko/concepts/active-memory) -- 대화형 채팅 세션용 하위 에이전트 메모리
- [메모리](/ko/concepts/memory) -- 파일 레이아웃, 백엔드, 도구
- [메모리 구성 참조](/ko/reference/memory-config) -- 모든 구성 옵션
