---
read_when:
    - 메모리 검색 제공자 또는 임베딩 모델을 구성하려고 합니다
    - QMD 백엔드를 설정하려고 합니다
    - 하이브리드 검색, MMR 또는 시간 감쇠를 조정하려는 경우
    - 멀티모달 메모리 인덱싱을 활성화하려고 합니다
sidebarTitle: Memory config
summary: 메모리 검색, 임베딩 제공자, QMD, 하이브리드 검색 및 멀티모달 인덱싱을 위한 모든 구성 옵션
title: 메모리 구성 참조 자료
x-i18n:
    generated_at: "2026-07-12T15:42:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
    source_path: reference/memory-config.md
    workflow: 16
---

이 페이지는 OpenClaw 메모리 검색의 모든 구성 옵션을 나열합니다. 개념 개요는 다음을 참조하십시오.

<CardGroup cols={2}>
  <Card title="메모리 개요" href="/ko/concepts/memory">
    메모리의 작동 방식입니다.
  </Card>
  <Card title="내장 엔진" href="/ko/concepts/memory-builtin">
    기본 SQLite 백엔드입니다.
  </Card>
  <Card title="QMD 엔진" href="/ko/concepts/memory-qmd">
    로컬 우선 사이드카입니다.
  </Card>
  <Card title="메모리 검색" href="/ko/concepts/memory-search">
    검색 파이프라인과 튜닝입니다.
  </Card>
  <Card title="Active Memory" href="/ko/concepts/active-memory">
    대화형 세션용 메모리 하위 에이전트입니다.
  </Card>
</CardGroup>

별도 표기가 없는 한 모든 메모리 검색 설정은 `openclaw.json`의 `agents.defaults.memorySearch` 아래에 있습니다. 에이전트별로 `agents.list[].memorySearch`에서 재정의할 수도 있습니다.

<Note>
**Active Memory** 기능 토글과 하위 에이전트 구성을 찾는 경우, 해당 설정은 `memorySearch`가 아니라 `plugins.entries.active-memory` 아래에 있습니다.

Active Memory는 두 가지 게이트 모델을 사용합니다.

1. Plugin이 활성화되어 있고 현재 에이전트 ID를 대상으로 해야 합니다.
2. 요청이 적격한 대화형 영구 채팅 세션이어야 합니다.

활성화 모델, Plugin 소유 구성, 트랜스크립트 영속성 및 안전한 롤아웃 패턴은 [Active Memory](/ko/concepts/active-memory)를 참조하십시오.
</Note>

---

## 공급자 선택

| 키         | 유형      | 기본값           | 설명                                                                                                                                                                                                                                                                                                       |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | 메모리 검색을 활성화하거나 비활성화합니다.                                                                                                                                                                                                                                                                 |
| `provider` | `string`  | `"openai"`       | `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible`, `voyage` 등의 임베딩 어댑터 ID입니다. `api`가 메모리 임베딩 어댑터 또는 OpenAI 호환 모델 API를 가리키도록 구성된 `models.providers.<id>`일 수도 있습니다. |
| `model`    | `string`  | 공급자 기본값    | 임베딩 모델 이름입니다.                                                                                                                                                                                                                                                                                     |
| `fallback` | `string`  | `"none"`         | 기본 어댑터가 실패할 때 사용할 대체 어댑터 ID입니다.                                                                                                                                                                                                                                                       |

`provider`를 설정하지 않으면 OpenClaw는 OpenAI 임베딩을 사용합니다. Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama, Voyage, 로컬 GGUF 모델 또는 OpenAI 호환 `/v1/embeddings` 엔드포인트를 사용하려면 `provider`를 명시적으로 설정하십시오. 여전히 `provider: "auto"`를 사용하는 레거시 구성은 `openai`로 해석됩니다.

<Warning>
임베딩 공급자, 모델, 공급자 설정, 소스, 범위, 청킹 또는 토크나이저를 변경하면 기존 SQLite 벡터 인덱스가 호환되지 않을 수 있습니다. OpenClaw는 모든 항목을 자동으로 다시 임베딩하는 대신 벡터 검색을 일시 중지하고 인덱스 식별 정보 경고를 표시합니다. 준비되면 `openclaw memory status --index --agent <id>` 또는 `openclaw memory index --force --agent <id>`를 사용하여 다시 빌드하십시오.
</Warning>

`provider`가 설정되지 않았거나, 레거시 `provider: "auto"`가 있거나, `provider: "none"`으로 의도적으로 FTS 전용 모드를 선택한 경우 임베딩을 사용할 수 없더라도 메모리 회상에서 어휘 기반 FTS 순위를 계속 사용할 수 있습니다.

명시적인 비로컬 공급자는 실패 시 닫힌 상태로 처리됩니다. `memorySearch.provider`를 Bedrock, DeepInfra, Gemini, GitHub Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage 또는 OpenAI 호환 사용자 지정 공급자와 같은 구체적인 원격 기반 공급자로 설정했는데 런타임에 해당 공급자를 사용할 수 없으면, `memory_search`는 자동으로 FTS 전용 회상을 사용하는 대신 사용할 수 없음 결과를 반환합니다. 공급자/인증 구성을 수정하거나, 연결 가능한 공급자로 전환하거나, 의도적으로 FTS 전용 회상을 사용하려면 `provider: "none"`을 설정하십시오.

### 사용자 지정 공급자 ID

`memorySearch.provider`는 `ollama` 같은 메모리 전용 공급자 어댑터 또는 `openai-responses` / `openai-completions` 같은 OpenAI 호환 모델 API를 위해 사용자 지정 `models.providers.<id>` 항목을 가리킬 수 있습니다. OpenClaw는 엔드포인트, 인증 및 모델 접두사 처리를 위해 사용자 지정 공급자 ID를 유지하면서 임베딩 어댑터에 해당 공급자의 `api` 소유자를 사용합니다. 이를 통해 다중 GPU 또는 다중 호스트 설정에서 메모리 임베딩을 특정 로컬 엔드포인트 전용으로 지정할 수 있습니다.

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### API 키 확인

원격 임베딩에는 API 키가 필요합니다. Bedrock은 대신 AWS SDK 기본 자격 증명 체인(인스턴스 역할, SSO, 액세스 키 또는 Bedrock API 키)을 사용합니다.

| 공급자         | 환경 변수                                           | 구성 키                             |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 자격 증명 체인 또는 `AWS_BEARER_TOKEN_BEDROCK` | API 키가 필요하지 않음              |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | 기기 로그인을 통한 인증 프로필      |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (자리표시자)                       | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth는 채팅/완성만 지원하며 임베딩 요청에는 사용할 수 없습니다.
</Note>

---

## 원격 엔드포인트 구성

전역 OpenAI 채팅 자격 증명을 상속하지 않아야 하는 일반적인 OpenAI 호환 `/v1/embeddings` 서버에는 `provider: "openai-compatible"`을 사용하십시오.

<ParamField path="remote.baseUrl" type="string">
  사용자 지정 API 기본 URL입니다.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API 키를 재정의합니다.
</ParamField>
<ParamField path="remote.headers" type="object">
  추가 HTTP 헤더입니다(공급자 기본값과 병합됨).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## 공급자별 구성

<AccordionGroup>
  <Accordion title="Gemini">
    | 키                     | 유형     | 기본값                 | 설명                                      |
    | ---------------------- | -------- | ---------------------- | ----------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview`도 지원합니다. |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2의 경우: 768, 1536 또는 3072   |

    <Warning>
    모델 또는 `outputDimensionality`를 변경하면 인덱스 식별 정보가 변경됩니다. 메모리 인덱스를 명시적으로 다시 빌드할 때까지 OpenClaw는 벡터 검색을 일시 중지합니다.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 호환 입력 유형">
    OpenAI 호환 임베딩 엔드포인트에서는 공급자별 `input_type` 요청 필드를 선택적으로 사용할 수 있습니다. 이는 쿼리와 문서 임베딩에 서로 다른 레이블이 필요한 비대칭 임베딩 모델에 유용합니다.

    | 키                  | 유형     | 기본값    | 설명                                                    |
    | ------------------- | -------- | --------- | ------------------------------------------------------- |
    | `inputType`         | `string` | 설정 안 됨 | 쿼리 및 문서 임베딩에 공통으로 사용할 `input_type`     |
    | `queryInputType`    | `string` | 설정 안 됨 | 쿼리 시점의 `input_type`이며 `inputType`을 재정의합니다. |
    | `documentInputType` | `string` | 설정 안 됨 | 인덱스/문서의 `input_type`이며 `inputType`을 재정의합니다. |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    이러한 값을 변경하면 공급자의 일괄 인덱싱에 사용하는 임베딩 캐시 식별 정보에 영향을 줍니다. 업스트림 모델이 레이블을 서로 다르게 처리하는 경우 이후에 메모리를 다시 인덱싱해야 합니다.

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 임베딩 구성

    Bedrock은 AWS SDK 기본 자격 증명 체인과 OpenClaw에서 확인하는 전달자 토큰을 사용하므로 구성에 API 키가 저장되지 않습니다. OpenClaw가 Bedrock이 활성화된 인스턴스 역할을 사용하는 EC2에서 실행되는 경우 공급자와 모델만 설정하십시오.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | 키                     | 유형     | 기본값                         | 설명                           |
    | ---------------------- | -------- | ------------------------------ | ------------------------------ |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 모든 Bedrock 임베딩 모델 ID    |
    | `outputDimensionality` | `number` | 모델 기본값                    | Titan V2의 경우: 256, 512 또는 1024 |

    **지원되는 모델**(제품군 감지 및 차원 기본값 포함):

    | 모델 ID                                     | 제공업체   | 기본 차원 | 구성 가능한 차원               |
    | ------------------------------------------- | ---------- | --------- | ------------------------------ |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024      | 256, 512, 1024                 |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536      | --                             |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536      | --                             |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024      | --                             |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024      | 256, 384, 1024, 3072           |
    | `cohere.embed-english-v3`                  | Cohere     | 1024      | --                             |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024      | --                             |
    | `cohere.embed-v4:0`                        | Cohere     | 1536      | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512       | --                             |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024      | --                             |

    처리량 접미사가 붙은 변형(예: `amazon.titan-embed-text-v1:2:8k`)과 리전 접두사가 붙은 추론 프로필 ID(예: `us.amazon.titan-embed-text-v2:0`)는 기본 모델의 구성을 상속합니다.

    **리전:** 다음 순서로 결정됩니다: `memorySearch.remote.baseUrl` 재정의, `models.providers.amazon-bedrock.baseUrl` 구성, `AWS_REGION`, `AWS_DEFAULT_REGION`, 이후 기본값 `us-east-1`.

    **인증:** OpenClaw는 먼저 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 또는 `AWS_BEARER_TOKEN_BEDROCK`을 확인한 후, 표준 AWS SDK 기본 자격 증명 제공자 체인으로 넘어갑니다.

    1. `AWS_PROFILE`도 설정된 경우를 제외한 환경 변수(`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO(SSO 필드가 구성된 경우에만)
    3. 공유 자격 증명 및 구성 파일(`fromIni`, `AWS_PROFILE` 포함)
    4. 자격 증명 프로세스(AWS 구성 파일의 `credential_process`)
    5. 웹 ID 토큰 자격 증명
    6. ECS 또는 EC2 인스턴스 메타데이터 자격 증명

    **IAM 권한:** IAM 역할 또는 사용자에게 다음 권한이 필요합니다.

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    최소 권한을 적용하려면 `InvokeModel`의 범위를 특정 모델로 제한하십시오.

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="로컬(GGUF + llama.cpp)">
    | 키                    | 유형               | 기본값                  | 설명                                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | 자동 다운로드           | GGUF 모델 파일 경로                                                                                                                                                                                                                                                                                                                  |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 기본값   | 다운로드한 모델의 캐시 디렉터리                                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                  | 임베딩 컨텍스트의 컨텍스트 창 크기입니다. 4096은 일반적인 청크(128-512 토큰)를 처리하면서 가중치 외 VRAM 사용량을 제한합니다. 리소스가 제한된 호스트에서는 1024-2048로 낮추십시오. `"auto"`는 모델의 학습된 최댓값을 사용하며, 8B+ 모델에는 권장하지 않습니다(Qwen3-Embedding-8B: 최대 40 960 토큰으로 인해 VRAM 사용량이 ~32 GB까지 늘어날 수 있습니다). |

    먼저 공식 llama.cpp 제공업체를 설치하십시오: `openclaw plugins install @openclaw/llama-cpp-provider`.
    기본 모델: `embeddinggemma-300m-qat-Q8_0.gguf`(~0.6 GB, 자동 다운로드). 소스 체크아웃에서는 여전히 네이티브 빌드 승인이 필요합니다: `pnpm approve-builds`를 실행한 다음 `pnpm rebuild node-llama-cpp`를 실행하십시오.

    독립 실행형 CLI를 사용하여 Gateway가 사용하는 것과 동일한 제공업체 경로를 확인하십시오.

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    숫자형 `local.contextSize` 값은 모델 가중치와 요청된 임베딩 컨텍스트가 함께 배치되도록 node-llama-cpp의 자동 GPU 레이어 배치에도 사용됩니다. 런타임이 로드된 후 `openclaw memory status --deep`는 마지막으로 알려진 llama.cpp 백엔드, 장치, 오프로딩, 요청된 컨텍스트 및 타임스탬프가 포함된 메모리 정보를 보고합니다. 수동 상태 확인은 모델을 로드하지 않습니다.

    로컬 GGUF 임베딩에는 `provider: "local"`을 명시적으로 설정하십시오. 명시적인 로컬 구성에서는 `hf:` 및 HTTP(S) 모델 참조가 지원되지만(node-llama-cpp의 모델 해석 사용), 기본 제공업체는 변경되지 않습니다.

  </Accordion>
</AccordionGroup>

### 인라인 임베딩 제한 시간

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  메모리 인덱싱 중 인라인 임베딩 배치의 제한 시간을 재정의합니다.

설정하지 않으면 제공업체 기본값을 사용합니다. `local`, `ollama`, `lmstudio` 같은 로컬/자체 호스팅 제공업체는 600초이고, 호스팅 제공업체는 120초입니다. 로컬 CPU 기반 임베딩 배치가 정상적으로 작동하지만 느린 경우 이 값을 늘리십시오.
</ParamField>

---

## 인덱싱 동작

별도로 명시하지 않는 한 모두 `memorySearch.sync` 아래에 있습니다.

| 키                             | 유형      | 기본값 | 설명                                                                |
| ------------------------------ | --------- | ------ | ------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true` | 세션이 시작될 때 메모리 인덱스를 동기화합니다                       |
| `onSearch`                     | `boolean` | `true` | 콘텐츠 변경을 감지한 후 검색 시 지연 동기화합니다                   |
| `watch`                        | `boolean` | `true` | 메모리 파일을 감시하고(chokidar) 변경 시 재인덱싱을 예약합니다      |
| `watchDebounceMs`              | `number`  | `1500` | 빠르게 연속되는 파일 감시 이벤트를 병합하는 디바운스 기간입니다     |
| `intervalMinutes`              | `number`  | `0`    | 분 단위의 주기적 재인덱싱 간격입니다(`0`이면 비활성화)              |
| `sessions.postCompactionForce` | `boolean` | `true` | Compaction으로 트리거된 트랜스크립트 업데이트 후 세션을 강제로 재인덱싱합니다 |

<ParamField path="chunking.tokens" type="number">
  임베딩 전에 메모리 소스를 분할할 때 사용하는 토큰 단위 청크 크기입니다(기본값: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  분할 경계 근처의 컨텍스트를 보존하기 위한 인접 청크 간 토큰 중첩 크기입니다(기본값: 80).
</ParamField>

<Note>
`chunking.tokens` 또는 `chunking.overlap`을 변경하면 청크 경계가 바뀌고 기존 인덱스 ID가 무효화됩니다(제공자 선택 아래의 경고 참조).
</Note>

---

## 하이브리드 검색 구성

모두 `memorySearch.query` 아래에 있습니다.

| 키           | 유형     | 기본값 | 설명                                      |
| ------------ | -------- | ------ | ----------------------------------------- |
| `maxResults` | `number` | `6`    | 주입 전에 반환되는 최대 메모리 검색 결과 수 |
| `minScore`   | `number` | `0.35` | 검색 결과를 포함할 최소 관련성 점수          |

그리고 `memorySearch.query.hybrid` 아래에는 다음 항목이 있습니다.

| 키                    | 유형      | 기본값 | 설명                              |
| --------------------- | --------- | ------ | --------------------------------- |
| `enabled`             | `boolean` | `true` | 하이브리드 BM25 + 벡터 검색 활성화 |
| `vectorWeight`        | `number`  | `0.7`  | 벡터 점수의 가중치(0-1)            |
| `textWeight`          | `number`  | `0.3`  | BM25 점수의 가중치(0-1)            |
| `candidateMultiplier` | `number`  | `4`    | 후보 풀 크기 배수                   |

<Tabs>
  <Tab title="MMR(다양성)">
    | 키            | 유형      | 기본값  | 설명                                 |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | MMR 재순위 지정 활성화                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 최대 다양성, 1 = 최대 관련성      |
  </Tab>
  <Tab title="시간 감쇠(최신성)">
    | 키                             | 유형      | 기본값  | 설명                         |
    | ------------------------------ | --------- | ------- | ---------------------------- |
    | `temporalDecay.enabled`        | `boolean` | `false` | 최신성 가중치 활성화           |
    | `temporalDecay.halfLifeDays`   | `number`  | `30`    | N일마다 점수가 절반으로 감소    |

    상시 유지 파일(`MEMORY.md`, `memory/`의 날짜가 없는 파일)에는 감쇠가 적용되지 않습니다.

  </Tab>
</Tabs>

### 전체 예시

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## 추가 메모리 경로

| 키           | 유형       | 설명                              |
| ------------ | ---------- | --------------------------------- |
| `extraPaths` | `string[]` | 인덱싱할 추가 디렉터리 또는 파일   |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

경로는 절대 경로 또는 워크스페이스 기준 상대 경로일 수 있습니다. 디렉터리에서 `.md` 파일을 재귀적으로 검색합니다. 심볼릭 링크 처리는 활성 백엔드에 따라 달라집니다. 내장 엔진은 심볼릭 링크를 건너뛰지만, QMD는 기본 QMD 스캐너의 동작을 따릅니다.

에이전트 범위의 에이전트 간 트랜스크립트 검색에는 `memory.qmd.paths` 대신 `agents.list[].memorySearch.qmd.extraCollections`를 사용하십시오. 이러한 추가 컬렉션은 동일한 `{ path, name, pattern? }` 형식을 따르지만 에이전트별로 병합되며, 경로가 현재 워크스페이스 외부를 가리킬 때 명시적으로 지정한 공유 이름을 유지할 수 있습니다. 확인된 동일한 경로가 `memory.qmd.paths`와 `memorySearch.qmd.extraCollections`에 모두 있으면 QMD는 첫 번째 항목을 유지하고 중복 항목을 건너뜁니다.

---

## 멀티모달 메모리(Gemini)

Gemini Embedding 2를 사용하여 이미지와 오디오를 Markdown과 함께 인덱싱합니다.

| 키                        | 유형       | 기본값     | 설명                                      |
| ------------------------- | ---------- | ---------- | ----------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 멀티모달 인덱싱 활성화                     |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` 또는 `["all"]`    |
| `multimodal.maxFileBytes` | `number`   | `10485760` | 인덱싱할 최대 파일 크기(10 MiB)             |

<Note>
`extraPaths`의 파일에만 적용됩니다. 기본 메모리 루트는 Markdown 전용으로 유지됩니다. `gemini-embedding-2-preview`가 필요합니다. `fallback`은 반드시 `"none"`이어야 합니다.
</Note>

지원 형식: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`(이미지), `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac`(오디오).

---

## 임베딩 캐시

| 키                 | 유형      | 기본값  | 설명                                      |
| ------------------ | --------- | ------- | ----------------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | 청크 임베딩을 SQLite에 캐시합니다         |
| `cache.maxEntries` | `number`  | 미설정  | 캐시된 임베딩 수의 최선형 상한입니다      |

재인덱싱 또는 대화 기록 업데이트 중 변경되지 않은 텍스트가 다시 임베딩되는 것을 방지합니다. 무제한 캐시를 사용하려면 `maxEntries`를 설정하지 마십시오. 최대 재인덱싱 속도보다 디스크 증가량이 더 중요할 때 설정하십시오. 설정된 경우 캐시가 한도를 초과하면 마지막 업데이트 시간을 기준으로 가장 오래된 항목부터 정리됩니다.

---

## 배치 인덱싱

| 키                            | 유형      | 기본값  | 설명                   |
| ----------------------------- | --------- | ------- | ---------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 병렬 인라인 임베딩     |
| `remote.batch.enabled`        | `boolean` | `false` | 배치 임베딩 API 활성화 |
| `remote.batch.concurrency`    | `number`  | `2`     | 병렬 배치 작업         |
| `remote.batch.wait`           | `boolean` | `true`  | 배치 완료 대기         |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | 폴링 간격              |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | 배치 시간 제한         |

`gemini`, `openai`, `voyage`에서 사용할 수 있습니다. 대규모 백필에는 일반적으로 OpenAI 배치가 가장 빠르고 저렴합니다.

`remote.nonBatchConcurrency`는 공급자 배치 API가 활성화되지 않았을 때 로컬/자체 호스팅 공급자와 호스팅 공급자가 사용하는 인라인 임베딩 호출을 제어합니다. 소규모 로컬 호스트에 과도한 부하가 걸리지 않도록 Ollama의 비배치 인덱싱 기본값은 `1`입니다. 더 큰 시스템에서는 더 높은 값을 설정하십시오.

이는 인라인 임베딩 호출의 시간 제한을 제어하는 `sync.embeddingBatchTimeoutSeconds`와 별개입니다.

---

## 세션 메모리 검색(실험적)

세션 대화 기록을 인덱싱하고 `memory_search`를 통해 표시합니다.

| 키                            | 유형       | 기본값       | 설명                                        |
| ----------------------------- | ---------- | ------------ | ------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 세션 인덱싱을 활성화합니다                  |
| `sources`                     | `string[]` | `["memory"]` | 대화 기록을 포함하려면 `"sessions"`를 추가합니다 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 재인덱싱을 위한 바이트 임계값               |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 재인덱싱을 위한 메시지 임계값               |

<Warning>
세션 인덱싱은 명시적으로 활성화해야 하며 비동기적으로 실행됩니다. 결과가 약간 최신 상태가 아닐 수 있습니다. 세션 로그는 디스크에 저장되므로 파일 시스템 액세스를 신뢰 경계로 간주하십시오.
</Warning>

세션 대화 기록 검색 결과에도
[`tools.sessions.visibility`](/ko/gateway/config-tools#toolssessions)가 적용됩니다. 기본
`tree` 가시성은 현재 세션과 현재 세션이 생성한 세션만 노출합니다. DM과 같이
다른 세션에서 동일한 에이전트의 Gateway를 통해 디스패치된 관련 없는 세션을
불러오려면 의도적으로 가시성을 `agent`로 확장하십시오. 에이전트 간 회상도
필요하고 에이전트 간 정책에서 허용하는 경우에만 `all`을 사용하십시오.

아래 예시에서는 이러한 설정을 `agents.defaults` 아래에 배치합니다. 하나의
에이전트만 세션 대화 기록을 인덱싱하고 검색해야 하는 경우 에이전트별 재정의에
동등한 `memorySearch` 설정을 적용할 수도 있습니다.

동일 에이전트의 Gateway에서 DM으로 회상하려면 다음과 같이 설정합니다.

<Tabs>
  <Tab title="기본 제공 백엔드">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="QMD 백엔드">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

QMD를 사용할 때 `agents.defaults.memorySearch.experimental.sessionMemory`와
`sources: ["sessions"]`만으로는 대화 기록이 QMD로 내보내지지 않습니다.
`memory.qmd.sessions.enabled: true`도 함께 설정하십시오.

---

  ## SQLite 벡터 가속(sqlite-vec)

  | 키                           | 유형      | 기본값  | 설명                             |
  | ---------------------------- | --------- | ------- | -------------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`  | 벡터 쿼리에 sqlite-vec 사용      |
  | `store.vector.extensionPath` | `string`  | 번들됨  | sqlite-vec 경로 재정의           |

  sqlite-vec를 사용할 수 없으면 OpenClaw는 자동으로 프로세스 내 코사인 유사도로 대체합니다.

  ---

  ## 인덱스 저장소

  내장 메모리 인덱스는 각 에이전트의 OpenClaw SQLite 데이터베이스인
  `agents/<agentId>/agent/openclaw-agent.sqlite`에 저장됩니다.

  | 키                    | 유형     | 기본값      | 설명                                      |
  | --------------------- | -------- | ----------- | ----------------------------------------- |
  | `store.fts.tokenizer` | `string` | `unicode61` | FTS5 토크나이저(`unicode61` 또는 `trigram`) |

  ---

  ## QMD 백엔드 구성

  활성화하려면 `memory.backend = "qmd"`를 설정합니다. 모든 QMD 설정은 `memory.qmd` 아래에 있습니다.

  | 키                       | 유형      | 기본값   | 설명                                                                                      |
  | ------------------------ | --------- | -------- | ----------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`    | QMD 실행 파일 경로. 서비스 `PATH`가 셸과 다른 경우 절대 경로를 설정합니다.                |
  | `searchMode`             | `string`  | `search` | 검색 명령: `search`, `vsearch`, `query`                                                   |
  | `rerank`                 | `boolean` | --       | QMD 재순위 지정을 건너뛰려면 QMD 2.1+에서 `searchMode: "query"`와 함께 `false`로 설정합니다. |
  | `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` 자동 인덱싱                                                |
  | `paths[]`                | `array`   | --       | 추가 경로: `{ name, path, pattern? }`                                                     |
  | `sessions.enabled`       | `boolean` | `false`  | 세션 대화 기록을 QMD로 내보냅니다.                                                        |
  | `sessions.retentionDays` | `number`  | --       | 대화 기록 보존 기간                                                                      |
  | `sessions.exportDir`     | `string`  | --       | 내보내기 디렉터리                                                                         |

  `searchMode: "search"`는 어휘/BM25 전용입니다. OpenClaw는 `memory status --deep` 실행 중을 포함하여 이 모드에서 의미론적 벡터 준비 상태 검사 또는 QMD 임베딩 유지 관리를 실행하지 않습니다. `vsearch`와 `query`에는 계속 QMD 벡터 준비 상태와 임베딩이 필요합니다.

  `rerank: false`는 QMD `query` 모드만 변경하며 QMD 2.1 이상이 필요합니다. 직접 CLI 모드에서는 OpenClaw가 `--no-rerank`를 전달하고, mcporter 기반 MCP 모드에서는 QMD의 통합 쿼리 도구에 `rerank: false`를 전달합니다. QMD의 기본 쿼리 재순위 지정 동작을 사용하려면 설정하지 않은 상태로 둡니다.

  OpenClaw는 현재 QMD 컬렉션 및 MCP 쿼리 형식을 우선 사용하지만, 필요한 경우 호환되는 컬렉션 패턴 플래그와 이전 MCP 도구 이름을 시도하여 이전 QMD 릴리스도 계속 작동하도록 합니다. QMD가 여러 컬렉션 필터 지원을 알리면 동일 출처 컬렉션을 하나의 QMD 프로세스로 검색하고, 이전 QMD 빌드에서는 컬렉션별 호환 경로를 유지합니다. 동일 출처란 영구 메모리 컬렉션(기본 메모리 파일 및 사용자 지정 경로)을 함께 그룹화한다는 의미이며, 세션 대화 기록 컬렉션은 출처 다각화에 계속 두 입력이 모두 포함되도록 별도 그룹으로 유지합니다.

  <Note>
  QMD 모델 재정의는 OpenClaw 구성이 아니라 QMD 측에 유지됩니다. QMD 모델을 전역으로 재정의해야 하는 경우 Gateway 런타임 환경에서 `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, `QMD_GENERATE_MODEL` 같은 환경 변수를 설정합니다.
  </Note>

  ### mcporter 통합

  모든 설정은 `memory.qmd.mcporter` 아래에 있습니다. 쿼리마다 `qmd`를 생성하는 대신 장기 실행 `mcporter` MCP 데몬을 통해 QMD 검색을 라우팅하여 대형 모델의 콜드 스타트 오버헤드를 줄입니다.

  | 키            | 유형      | 기본값  | 설명                                                                            |
  | ------------- | --------- | ------- | ------------------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false` | 요청마다 `qmd`를 생성하는 대신 mcporter를 통해 QMD 호출을 라우팅합니다.         |
  | `serverName`  | `string`  | `qmd`   | `lifecycle: keep-alive`로 `qmd mcp`를 실행하는 mcporter 서버 이름               |
  | `startDaemon` | `boolean` | `true`  | `enabled`가 true이면 mcporter 데몬을 자동으로 시작합니다.                       |

  `mcporter`가 설치되어 있고 PATH에 있어야 하며, `qmd mcp`를 실행하는 mcporter 서버가 구성되어 있어야 합니다. 쿼리별 프로세스 생성 비용을 감수할 수 있는 단순한 로컬 설정에서는 비활성화 상태로 유지합니다.

  <AccordionGroup>
  <Accordion title="업데이트 일정">
    | 키                          | 유형      | 기본값   | 설명                                                                      |
    | --------------------------- | --------- | -------- | ------------------------------------------------------------------------- |
    | `update.interval`           | `string`  | `5m`     | 새로 고침 간격                                                            |
    | `update.debounceMs`         | `number`  | `15000`  | 파일 변경 디바운스                                                        |
    | `update.onBoot`             | `boolean` | `true`   | 장기 실행 QMD 관리자가 열릴 때 새로 고칩니다. 즉시 부팅 업데이트를 건너뛰려면 false로 설정합니다. |
    | `update.startup`            | `string`  | `off`    | 선택적 Gateway 시작 시 QMD 초기화: `off`, `idle` 또는 `immediate`         |
    | `update.startupDelayMs`     | `number`  | `120000` | `startup: "idle"` 새로 고침 실행 전 지연                                  |
    | `update.waitForBootSync`    | `boolean` | `false`  | 초기 새로 고침이 완료될 때까지 관리자 열기를 차단합니다.                  |
    | `update.embedInterval`      | `string`  | `60m`    | 별도의 임베딩 주기                                                        |
    | `update.commandTimeoutMs`   | `number`  | `30000`  | QMD 유지 관리 명령(컬렉션 목록/추가)의 시간 제한                          |
    | `update.updateTimeoutMs`    | `number`  | `120000` | 각 `qmd update` 주기의 시간 제한                                          |
    | `update.embedTimeoutMs`     | `number`  | `120000` | 각 `qmd embed` 주기의 시간 제한                                           |
  </Accordion>
  <Accordion title="제한">
    | 키                          | 유형     | 기본값 | 설명                      |
    | --------------------------- | -------- | ------- | ------------------------- |
    | `limits.maxResults`         | `number` | `4`     | 최대 검색 결과 수         |
    | `limits.maxSnippetChars`    | `number` | `450`   | 스니펫 길이 제한          |
    | `limits.maxInjectedChars`   | `number` | `2200`  | 삽입되는 총 문자 수 제한  |
    | `limits.timeoutMs`          | `number` | `4000`  | 검색 시간 제한            |
  </Accordion>
  <Accordion title="범위">
    QMD 검색 결과를 받을 수 있는 세션을 제어합니다. [`session.sendPolicy`](/ko/gateway/config-agents#session)와 동일한 스키마입니다.

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    제공되는 기본값은 DM/직접 메시지 전용이며 그룹 및 기타 채널 유형을 거부합니다. `match.keyPrefix`는 정규화된 세션 키와 일치하고, `match.rawKeyPrefix`는 `agent:<id>:`를 포함한 원시 키와 일치합니다.

  </Accordion>
  <Accordion title="인용">
    `memory.citations`는 모든 백엔드에 적용됩니다:

    | 값               | 동작                                                   |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (기본값)  | 스니펫에 `Source: <path#line>` 바닥글을 포함합니다     |
    | `on`             | 항상 바닥글을 포함합니다                               |
    | `off`            | 바닥글을 생략합니다(경로는 내부적으로 에이전트에 계속 전달됨) |

  </Accordion>
</AccordionGroup>

Gateway 시작 시 QMD 초기화가 활성화되어 있으면 OpenClaw는 적격 에이전트에 대해서만 QMD를 시작합니다. `update.onBoot`가 true이고 간격/임베딩 유지 관리가 구성되어 있지 않으면, 시작 시 부팅 새로 고침에 일회성 관리자를 사용한 후 종료합니다. 업데이트 또는 임베딩 간격이 구성되어 있으면, 시작 시 감시자와 간격 타이머를 관리할 수 있도록 장기 실행 QMD 관리자를 엽니다. `update.onBoot: false`는 부팅 직후의 새로 고침만 건너뜁니다.

### 전체 QMD 예시

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming은 `agents.defaults.memorySearch`가 아니라 `plugins.entries.memory-core.config.dreaming`에서 구성합니다.

Dreaming은 예약된 단일 스윕으로 실행되며 내부의 light/deep/REM 단계를 구현 세부 사항으로 사용합니다.

개념적 동작과 슬래시 명령어는 [Dreaming](/ko/concepts/dreaming)을 참조하십시오.

### 사용자 설정

| 키                                     | 유형      | 기본값        | 설명                                                                                                                               |
| -------------------------------------- | --------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Dreaming을 완전히 활성화하거나 비활성화합니다                                                                                       |
| `frequency`                            | `string`  | `0 3 * * *`   | 전체 Dreaming 스윕의 선택적 Cron 실행 주기                                                                                          |
| `model`                                | `string`  | 기본 모델     | 선택적 Dream Diary 하위 에이전트 모델 재정의                                                                                        |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | `MEMORY.md`로 승격된 각 단기 회상 스니펫에서 유지할 최대 예상 토큰 수입니다. 출처 메타데이터는 계속 표시됩니다                       |

### 예시

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming은 머신 상태를 `memory/.dreams/`에 기록합니다.
- Dreaming은 사람이 읽을 수 있는 서술형 출력을 `DREAMS.md`(또는 기존 `dreams.md`)에 기록합니다.
- `dreaming.model`은 기존 Plugin 하위 에이전트 신뢰 게이트를 사용합니다. 활성화하기 전에 `plugins.entries.memory-core.subagent.allowModelOverride: true`를 설정하십시오.
- 구성된 모델을 사용할 수 없으면 Dream Diary는 세션 기본 모델로 한 번 재시도합니다. 신뢰 또는 허용 목록 오류는 기록되며 자동으로 재시도되지 않습니다.
- light/deep/REM 단계 정책과 임계값은 내부 동작이며 사용자 대상 구성이 아닙니다.

</Note>

## 관련 문서

- [구성 참조](/ko/gateway/configuration-reference)
- [메모리 개요](/ko/concepts/memory)
- [메모리 검색](/ko/concepts/memory-search)
