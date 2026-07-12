---
read_when:
    - 로컬 GGUF 모델에서 메모리 검색 임베딩을 사용하려는 경우
    - memorySearch.provider = "local"을 구성하고 있습니다.
    - node-llama-cpp 런타임을 소유하는 OpenClaw Plugin이 필요합니다.
sidebarTitle: llama.cpp Provider
summary: 로컬 GGUF 메모리 임베딩용 공식 llama.cpp 제공자를 설치합니다
title: llama.cpp 제공자
x-i18n:
    generated_at: "2026-07-12T01:01:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp`는 로컬 GGUF 임베딩을 위한 공식 외부 제공자 Plugin입니다. 임베딩 제공자 ID `local`을 등록하고 `memorySearch.provider: "local"`에서 사용하는 `node-llama-cpp` 런타임 종속성을 관리합니다.

로컬 메모리 임베딩을 사용하기 전에 설치하세요.

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

기본 `openclaw` npm 패키지에는 `node-llama-cpp`가 포함되어 있지 않습니다. 네이티브 종속성을 이 Plugin에 유지하면 일반적인 OpenClaw npm 업데이트가 OpenClaw 패키지 디렉터리 내부에 수동으로 설치한 런타임을 삭제하는 일을 방지할 수 있습니다.

## 구성

`memorySearch.provider`를 `local`로 설정하세요.

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

`local.modelPath`의 기본값은 위에 표시된 `hf:` URI(`embeddinggemma-300m-qat-Q8_0.gguf`)입니다. 다른 모델을 사용하려면 다른 `hf:` URI 또는 로컬 `.gguf` 파일을 지정하세요. `local.modelCacheDir`은 다운로드한 모델이 캐시되는 위치를 재정의하며(기본값: `~/.node-llama-cpp/models`), `local.contextSize`에는 정수 또는 `"auto"`를 사용할 수 있습니다.

`local.contextSize`가 숫자이면 제공자는 해당 요구 사항을 node-llama-cpp의 자동 GPU 레이어 배치에도 전달합니다. 이를 통해 node-llama-cpp는 메모리 안전성 검사를 유지하면서 모델과 임베딩 컨텍스트를 함께 메모리에 맞게 배치할 수 있습니다. `"auto"`를 사용하면 node-llama-cpp는 일반적인 자동 배치를 유지합니다.

## 네이티브 런타임

네이티브 설치를 가장 원활하게 진행하려면 Node 24를 사용하세요. pnpm을 사용하는 소스 체크아웃에서는 네이티브 종속성 빌드를 승인하고 다시 빌드해야 할 수 있습니다.

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## 런타임 진단

제공자가 로드된 후 `openclaw memory status --deep`을 실행하면 선택된 백엔드와 빌드, 장치 이름, GPU로 오프로드된 레이어, 요청된 컨텍스트 크기, 마지막으로 관찰된 VRAM 또는 통합 메모리 스냅샷을 확인할 수 있습니다. 수동 상태 조회는 모델을 다시 로드하거나 장치를 폴링하지 않으므로 VRAM 값에는 관찰 타임스탬프가 포함됩니다.

실행 중인 Gateway가 이미 로컬 제공자를 사용한 경우 동일한 마지막 확인 정보가 `openclaw doctor`에도 표시될 수 있습니다. 일반적인 상태 확인 또는 진단 명령은 진단 정보를 수집하기 위한 목적으로만 모델을 로드하지 않습니다.

## 문제 해결

`node-llama-cpp`가 없거나 로드에 실패하면 OpenClaw는 다음 해결 방법과 함께 실패를 보고합니다.

1. Plugin을 설치합니다: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. 네이티브 설치 및 업데이트에는 Node 24를 사용합니다.
3. pnpm 소스 체크아웃에서는 `pnpm approve-builds`를 실행한 다음 `pnpm rebuild node-llama-cpp`를 실행합니다.

네이티브 빌드 단계 없이 더 간편하게 로컬 임베딩을 사용하려면 대신 `memorySearch.provider`를 `lmstudio`, `ollama`, `openai`, `voyage` 등의 원격 임베딩 제공자로 설정하세요.
