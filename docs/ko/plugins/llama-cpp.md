---
read_when:
    - 로컬 GGUF 모델로 메모리 검색 임베딩을 사용하려는 경우
    - memorySearch.provider = "local"을 구성하고 있습니다
    - node-llama-cpp 런타임을 소유한 OpenClaw Plugin이 필요합니다
sidebarTitle: llama.cpp Provider
summary: 공식 llama.cpp provider를 설치하여 로컬 GGUF 메모리 임베딩 사용
title: llama.cpp 제공자
x-i18n:
    generated_at: "2026-06-27T17:46:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp`는 로컬 GGUF 임베딩을 위한 공식 외부 공급자 Plugin입니다.
`memorySearch.provider: "local"`에서 사용하는 `node-llama-cpp` 런타임 의존성을
소유합니다.

로컬 메모리 임베딩을 사용하기 전에 설치하세요.

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

기본 `openclaw` npm 패키지에는 `node-llama-cpp`가 포함되어 있지 않습니다. 네이티브
의존성을 이 Plugin에 유지하면 일반 OpenClaw npm 업데이트가 OpenClaw 패키지 디렉터리
안에 수동으로 설치한 런타임을 삭제하지 못하게 할 수 있습니다.

## 구성

메모리 검색 공급자를 `local`로 설정합니다.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

기본 모델은 `embeddinggemma-300m-qat-Q8_0.gguf`입니다. `local.modelPath`가 로컬
`.gguf` 파일을 가리키게 할 수도 있습니다.

## 네이티브 런타임

가장 원활한 네이티브 설치 경로를 위해 Node 24를 사용하세요. pnpm을 사용하는 소스
체크아웃은 네이티브 의존성을 승인하고 다시 빌드해야 할 수 있습니다.

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

마찰이 적은 로컬 임베딩을 원한다면 대신 Ollama 또는 LM Studio 같은 로컬 서비스
공급자를 사용하세요.
