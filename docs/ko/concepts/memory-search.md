---
read_when:
    - memory_search가 어떻게 작동하는지 이해하고 싶습니다.
    - 임베딩 공급자를 선택하고 싶습니다.
    - 검색 품질을 조정하고 싶습니다.
summary: 메모리 검색은 임베딩과 하이브리드 검색을 사용해 관련 메모를 찾는 방식입니다.
title: 메모리 검색
x-i18n:
    generated_at: "2026-04-10T06:00:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca0237f4f1ee69dcbfb12e6e9527a53e368c0bf9b429e506831d4af2f3a3ac6f
    source_path: concepts/memory-search.md
    workflow: 15
---

# 메모리 검색

`memory_search`는 원래 텍스트와 표현이 다르더라도 메모리 파일에서 관련 메모를 찾습니다. 이 기능은 메모리를 작은 청크로 인덱싱한 뒤, 임베딩, 키워드 또는 둘 다를 사용해 검색하는 방식으로 동작합니다.

## 빠른 시작

OpenAI, Gemini, Voyage 또는 Mistral API 키가 구성되어 있으면 메모리 검색은 자동으로 작동합니다. 공급자를 명시적으로 설정하려면 다음과 같이 하세요.

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

## 지원되는 공급자

| 공급자 | ID        | API 키 필요 | 참고                                                 |
| ------ | --------- | ----------- | ---------------------------------------------------- |
| OpenAI | `openai`  | 예          | 자동 감지, 빠름                                     |
| Gemini | `gemini`  | 예          | 이미지/오디오 인덱싱 지원                           |
| Voyage | `voyage`  | 예          | 자동 감지                                           |
| Mistral| `mistral` | 예          | 자동 감지                                           |
| Bedrock| `bedrock` | 아니요      | AWS 자격 증명 체인이 해석되면 자동 감지             |
| Ollama | `ollama`  | 아니요      | 로컬, 명시적으로 설정해야 함                        |
| Local  | `local`   | 아니요      | GGUF 모델, 약 0.6 GB 다운로드 필요                  |

## 검색 작동 방식

OpenClaw는 두 개의 검색 경로를 병렬로 실행한 뒤 결과를 병합합니다.

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

- **벡터 검색**은 의미가 비슷한 메모를 찾습니다("gateway host"는 "the machine running OpenClaw"와 일치할 수 있습니다).
- **BM25 키워드 검색**은 정확히 일치하는 항목을 찾습니다(ID, 오류 문자열, 설정 키 등).

한 경로만 사용할 수 있는 경우(임베딩 없음 또는 FTS 없음), 다른 경로만 단독으로 실행됩니다.

## 검색 품질 개선

메모 기록이 많을 때 도움이 되는 선택적 기능 두 가지가 있습니다.

### 시간 감쇠

오래된 메모는 순위 가중치가 점차 낮아져 최근 정보가 먼저 노출됩니다.
기본 반감기 30일 기준으로 지난달의 메모는 원래 가중치의 50% 점수를 받습니다.
`MEMORY.md` 같은 상시 유효 파일에는 감쇠가 적용되지 않습니다.

<Tip>
에이전트에 수개월치 일일 메모가 있고 오래된 정보가 최신 컨텍스트보다 계속 더 높은 순위에 오르면 시간 감쇠를 활성화하세요.
</Tip>

### MMR(다양성)

중복되는 결과를 줄입니다. 다섯 개의 메모가 모두 동일한 라우터 설정을 언급하더라도, MMR은 같은 내용이 반복되지 않도록 상위 결과가 서로 다른 주제를 다루게 합니다.

<Tip>
`memory_search`가 서로 다른 일일 메모에서 거의 중복되는 스니펫을 계속 반환한다면 MMR을 활성화하세요.
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

Gemini Embedding 2를 사용하면 Markdown과 함께 이미지 및 오디오 파일도 인덱싱할 수 있습니다.
검색 질의는 여전히 텍스트이지만, 시각 및 오디오 콘텐츠와 매칭됩니다.
설정 방법은 [메모리 구성 참조](/ko/reference/memory-config)를 확인하세요.

## 세션 메모리 검색

세션 대화 내용을 선택적으로 인덱싱해 `memory_search`가 이전 대화를 기억하도록 할 수 있습니다. 이 기능은 `memorySearch.experimental.sessionMemory`를 통해 옵트인 방식으로 활성화됩니다. 자세한 내용은 [구성 참조](/ko/reference/memory-config)를 확인하세요.

## 문제 해결

**결과가 없나요?** `openclaw memory status`를 실행해 인덱스를 확인하세요. 비어 있다면 `openclaw memory index --force`를 실행하세요.

**키워드 일치만 되나요?** 임베딩 공급자가 구성되지 않았을 수 있습니다. `openclaw memory status --deep`로 확인하세요.

**CJK 텍스트가 검색되지 않나요?** `openclaw memory index --force`로 FTS 인덱스를 다시 빌드하세요.

## 더 읽어보기

- [Active Memory](/ko/concepts/active-memory) -- 대화형 채팅 세션을 위한 서브 에이전트 메모리
- [Memory](/ko/concepts/memory) -- 파일 레이아웃, 백엔드, 도구
- [Memory configuration reference](/ko/reference/memory-config) -- 모든 구성 옵션
