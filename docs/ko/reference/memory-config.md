---
read_when:
    - 메모리 검색 제공자 또는 임베딩 모델을 구성하려는 경우
    - QMD 백엔드를 설정하려고 합니다
    - 하이브리드 검색, MMR 또는 시간적 감쇠를 조정하려는 경우
    - 멀티모달 메모리 인덱싱을 활성화하려는 경우
sidebarTitle: Memory config
summary: 메모리 검색, 임베딩 제공자, QMD, 하이브리드 검색, 멀티모달 인덱싱에 대한 모든 구성 옵션
title: 메모리 구성 참조
x-i18n:
    generated_at: "2026-04-30T16:30:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58b75751a19afb883fd7646cf5f71859f95bac468b2bfd8cc79db12ae892f70f
    source_path: reference/memory-config.md
    workflow: 16
---

이 페이지는 OpenClaw 메모리 검색의 모든 구성 옵션을 나열합니다. 개념 개요는 다음을 참고하세요:

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
    대화형 세션을 위한 메모리 하위 에이전트입니다.
  </Card>
</CardGroup>

별도로 명시되지 않는 한 모든 메모리 검색 설정은 `openclaw.json`의 `agents.defaults.memorySearch` 아래에 있습니다.

<Note>
**Active Memory** 기능 토글과 하위 에이전트 구성을 찾고 있다면, 해당 설정은 `memorySearch`가 아니라 `plugins.entries.active-memory` 아래에 있습니다.

Active Memory는 두 단계 게이트 모델을 사용합니다:

1. Plugin이 활성화되어 있고 현재 에이전트 ID를 대상으로 해야 합니다
2. 요청이 적합한 대화형 영구 채팅 세션이어야 합니다

활성화 모델, Plugin 소유 구성, 대화 기록 영속성, 안전한 롤아웃 패턴은 [Active Memory](/ko/concepts/active-memory)를 참고하세요.
</Note>

---

## 제공자 선택

| 키        | 유형      | 기본값          | 설명                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | 자동 감지    | `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` 같은 임베딩 어댑터 ID입니다. `api`가 이러한 어댑터 중 하나를 가리키는 구성된 `models.providers.<id>`일 수도 있습니다 |
| `model`    | `string`  | 제공자 기본값 | 임베딩 모델 이름입니다                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`         | 기본 어댑터가 실패할 때 사용할 폴백 어댑터 ID입니다                                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`           | 메모리 검색을 활성화하거나 비활성화합니다                                                                                                                                                                                                    |

### 자동 감지 순서

`provider`가 설정되지 않은 경우 OpenClaw는 사용 가능한 첫 번째 항목을 선택합니다:

<Steps>
  <Step title="local">
    `memorySearch.local.modelPath`가 구성되어 있고 파일이 존재하면 선택됩니다.
  </Step>
  <Step title="github-copilot">
    GitHub Copilot 토큰을 확인할 수 있으면 선택됩니다(환경 변수 또는 인증 프로필).
  </Step>
  <Step title="openai">
    OpenAI 키를 확인할 수 있으면 선택됩니다.
  </Step>
  <Step title="gemini">
    Gemini 키를 확인할 수 있으면 선택됩니다.
  </Step>
  <Step title="voyage">
    Voyage 키를 확인할 수 있으면 선택됩니다.
  </Step>
  <Step title="mistral">
    Mistral 키를 확인할 수 있으면 선택됩니다.
  </Step>
  <Step title="deepinfra">
    DeepInfra 키를 확인할 수 있으면 선택됩니다.
  </Step>
  <Step title="bedrock">
    AWS SDK 자격 증명 체인이 확인되면 선택됩니다(인스턴스 역할, 액세스 키, 프로필, SSO, 웹 ID 또는 공유 구성).
  </Step>
</Steps>

`ollama`는 지원되지만 자동 감지되지 않습니다(명시적으로 설정하세요).

### 사용자 지정 제공자 ID

`memorySearch.provider`는 사용자 지정 `models.providers.<id>` 항목을 가리킬 수 있습니다. OpenClaw는 임베딩 어댑터에 대해 해당 제공자의 `api` 소유자를 확인하면서, 엔드포인트, 인증, 모델 접두사 처리를 위해 사용자 지정 제공자 ID를 보존합니다. 이를 통해 다중 GPU 또는 다중 호스트 설정에서 메모리 임베딩을 특정 로컬 엔드포인트 전용으로 사용할 수 있습니다:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
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

원격 임베딩에는 API 키가 필요합니다. Bedrock은 대신 AWS SDK 기본 자격 증명 체인을 사용합니다(인스턴스 역할, SSO, 액세스 키).

| 제공자       | 환경 변수                                            | 구성 키                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 자격 증명 체인                               | API 키가 필요하지 않음                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | 기기 로그인을 통한 인증 프로필       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (플레이스홀더)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth는 채팅/완성에만 적용되며 임베딩 요청을 충족하지 않습니다.
</Note>

---

## 원격 엔드포인트 구성

사용자 지정 OpenAI 호환 엔드포인트 또는 제공자 기본값 재정의에 사용합니다:

<ParamField path="remote.baseUrl" type="string">
  사용자 지정 API 기본 URL입니다.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API 키를 재정의합니다.
</ParamField>
<ParamField path="remote.headers" type="object">
  추가 HTTP 헤더입니다(제공자 기본값과 병합됨).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
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

## 제공자별 구성

<AccordionGroup>
  <Accordion title="Gemini">
    | 키                    | 유형     | 기본값                | 설명                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview`도 지원합니다 |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2의 경우: 768, 1536 또는 3072        |

    <Warning>
    모델 또는 `outputDimensionality`를 변경하면 자동 전체 재색인이 트리거됩니다.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 호환 입력 유형">
    OpenAI 호환 임베딩 엔드포인트는 제공자별 `input_type` 요청 필드를 사용할 수 있습니다. 이는 쿼리와 문서 임베딩에 서로 다른 레이블이 필요한 비대칭 임베딩 모델에 유용합니다.

    | 키                 | 유형     | 기본값 | 설명                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | 설정되지 않음   | 쿼리 및 문서 임베딩에 공유되는 `input_type`입니다   |
    | `queryInputType`    | `string` | 설정되지 않음   | 쿼리 시점의 `input_type`입니다. `inputType`을 재정의합니다          |
    | `documentInputType` | `string` | 설정되지 않음   | 색인/문서 `input_type`입니다. `inputType`을 재정의합니다      |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    이러한 값을 변경하면 제공자 배치 색인에 대한 임베딩 캐시 ID에 영향을 주며, 업스트림 모델이 레이블을 다르게 처리하는 경우 메모리 재색인을 이어서 수행해야 합니다.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock은 AWS SDK 기본 자격 증명 체인을 사용하므로 API 키가 필요하지 않습니다. OpenClaw가 Bedrock이 활성화된 인스턴스 역할로 EC2에서 실행되는 경우 제공자와 모델만 설정하면 됩니다:

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

    | 키                    | 유형     | 기본값                        | 설명                     |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 모든 Bedrock 임베딩 모델 ID  |
    | `outputDimensionality` | `number` | 모델 기본값                  | Titan V2의 경우: 256, 512 또는 1024 |

    **지원되는 모델**(제품군 감지 및 차원 기본값 포함):

    | 모델 ID                                   | 제공자   | 기본 차원 | 구성 가능한 차원    |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    처리량 접미사가 붙은 변형(예: `amazon.titan-embed-text-v1:2:8k`)은 기본 모델의 구성을 상속합니다.

    **인증:** Bedrock 인증은 표준 AWS SDK 자격 증명 확인 순서를 사용합니다:

    1. 환경 변수(`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. SSO 토큰 캐시
    3. 웹 ID 토큰 자격 증명
    4. 공유 자격 증명 및 구성 파일
    5. ECS 또는 EC2 메타데이터 자격 증명

    리전은 `AWS_REGION`, `AWS_DEFAULT_REGION`, `amazon-bedrock` 제공자 `baseUrl`에서 확인되거나 기본값인 `us-east-1`을 사용합니다.

    **IAM 권한:** IAM 역할 또는 사용자에게 다음이 필요합니다:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    최소 권한 원칙을 적용하려면 `InvokeModel`의 범위를 특정 모델로 제한하세요:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | 키                    | 유형               | 기본값                  | 설명                                                                                                                                                                                                                                                                                                                             |
    | --------------------- | ------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 자동 다운로드됨         | GGUF 모델 파일 경로                                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 기본값   | 다운로드된 모델의 캐시 디렉터리                                                                                                                                                                                                                                                                                                  |
    | `local.contextSize`   | `number \| "auto"` | `4096`                  | 임베딩 컨텍스트의 컨텍스트 창 크기입니다. 4096은 일반적인 청크(128~512 토큰)를 감당하면서 비가중치 VRAM을 제한합니다. 제약이 있는 호스트에서는 1024~2048로 낮추세요. `"auto"`는 모델의 학습된 최대값을 사용합니다. 8B+ 모델에는 권장되지 않습니다(Qwen3-Embedding-8B: 40,960 토큰 → 약 32GB VRAM, 4096에서는 약 8.8GB). |

    기본 모델: `embeddinggemma-300m-qat-Q8_0.gguf`(약 0.6GB, 자동 다운로드됨). 패키징된 설치는 `provider: "local"`이 구성된 경우 관리형 Plugin 런타임 의존성을 통해 네이티브 `node-llama-cpp` 런타임을 복구합니다. 소스 체크아웃에는 여전히 네이티브 빌드 승인이 필요합니다: `pnpm approve-builds` 후 `pnpm rebuild node-llama-cpp`.

    Gateway가 사용하는 동일한 공급자 경로를 확인하려면 독립 실행형 CLI를 사용하세요:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    `provider`가 `auto`이면 `local.modelPath`가 기존 로컬 파일을 가리킬 때만 `local`이 선택됩니다. `hf:` 및 HTTP(S) 모델 참조는 `provider: "local"`로 명시적으로 계속 사용할 수 있지만, 모델이 디스크에서 사용 가능해지기 전에는 `auto`가 local을 선택하게 하지 않습니다.

  </Accordion>
</AccordionGroup>

### 인라인 임베딩 제한 시간

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  메모리 인덱싱 중 인라인 임베딩 배치의 제한 시간을 재정의합니다.

설정하지 않으면 공급자 기본값이 사용됩니다. `local`, `ollama`, `lmstudio` 같은 로컬/자체 호스팅 공급자는 600초이고, 호스팅 공급자는 120초입니다. 로컬 CPU 기반 임베딩 배치가 정상적으로 동작하지만 느릴 때 이 값을 늘리세요.
</ParamField>

---

## 하이브리드 검색 구성

모두 `memorySearch.query.hybrid` 아래에 있습니다:

| 키                    | 유형      | 기본값 | 설명                         |
| --------------------- | --------- | ------ | ---------------------------- |
| `enabled`             | `boolean` | `true` | 하이브리드 BM25 + 벡터 검색 활성화 |
| `vectorWeight`        | `number`  | `0.7`  | 벡터 점수의 가중치(0-1)      |
| `textWeight`          | `number`  | `0.3`  | BM25 점수의 가중치(0-1)      |
| `candidateMultiplier` | `number`  | `4`    | 후보 풀 크기 배율            |

<Tabs>
  <Tab title="MMR (diversity)">
    | 키            | 유형      | 기본값  | 설명                         |
    | ------------- | --------- | ------- | ---------------------------- |
    | `mmr.enabled` | `boolean` | `false` | MMR 재순위 지정 활성화       |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 최대 다양성, 1 = 최대 관련성 |
  </Tab>
  <Tab title="Temporal decay (recency)">
    | 키                           | 유형      | 기본값 | 설명                    |
    | ---------------------------- | --------- | ------ | ----------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 최신성 부스트 활성화    |
    | `temporalDecay.halfLifeDays` | `number`  | `30`   | N일마다 점수가 절반으로 감소 |

    Evergreen 파일(`MEMORY.md`, `memory/`의 날짜가 없는 파일)은 절대 감쇠되지 않습니다.

  </Tab>
</Tabs>

### 전체 예시

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
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
| `extraPaths` | `string[]` | 인덱싱할 추가 디렉터리 또는 파일 |

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

경로는 절대 경로 또는 작업 영역 기준 상대 경로일 수 있습니다. 디렉터리는 `.md` 파일을 찾기 위해 재귀적으로 스캔됩니다. 심볼릭 링크 처리는 활성 백엔드에 따라 달라집니다. 내장 엔진은 심볼릭 링크를 무시하지만, QMD는 기본 QMD 스캐너 동작을 따릅니다.

에이전트 범위의 교차 에이전트 transcript 검색에는 `memory.qmd.paths` 대신 `agents.list[].memorySearch.qmd.extraCollections`를 사용하세요. 이러한 추가 컬렉션은 동일한 `{ path, name, pattern? }` 형태를 따르지만, 에이전트별로 병합되며 경로가 현재 작업 영역 밖을 가리킬 때 명시적인 공유 이름을 보존할 수 있습니다. 동일하게 해석된 경로가 `memory.qmd.paths`와 `memorySearch.qmd.extraCollections`에 모두 나타나면 QMD는 첫 번째 항목을 유지하고 중복 항목을 건너뜁니다.

---

## 멀티모달 메모리(Gemini)

Gemini Embedding 2를 사용해 Markdown과 함께 이미지 및 오디오를 인덱싱합니다:

| 키                        | 유형       | 기본값     | 설명                                  |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 멀티모달 인덱싱 활성화                |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` 또는 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | 인덱싱할 최대 파일 크기               |

<Note>
`extraPaths`의 파일에만 적용됩니다. 기본 메모리 루트는 Markdown 전용으로 유지됩니다. `gemini-embedding-2-preview`가 필요합니다. `fallback`은 `"none"`이어야 합니다.
</Note>

지원 형식: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`(이미지); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac`(오디오).

---

## 임베딩 캐시

| 키                 | 유형      | 기본값  | 설명                               |
| ------------------ | --------- | ------- | ---------------------------------- |
| `cache.enabled`    | `boolean` | `false` | SQLite에 청크 임베딩 캐시          |
| `cache.maxEntries` | `number`  | `50000` | 캐시된 임베딩의 최대 개수          |

재인덱싱 또는 transcript 업데이트 중 변경되지 않은 텍스트를 다시 임베딩하지 않도록 합니다.

---

## 배치 인덱싱

| 키                            | 유형      | 기본값 | 설명                       |
| ----------------------------- | --------- | ------ | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`    | 병렬 인라인 임베딩         |
| `remote.batch.enabled`        | `boolean` | `false` | 배치 임베딩 API 활성화     |
| `remote.batch.concurrency`    | `number`  | `2`    | 병렬 배치 작업             |
| `remote.batch.wait`           | `boolean` | `true` | 배치 완료 대기             |
| `remote.batch.pollIntervalMs` | `number`  | --     | 폴링 간격                  |
| `remote.batch.timeoutMinutes` | `number`  | --     | 배치 제한 시간             |

`openai`, `gemini`, `voyage`에서 사용할 수 있습니다. OpenAI 배치는 일반적으로 대규모 백필에 가장 빠르고 저렴합니다.

`remote.nonBatchConcurrency`는 로컬/자체 호스팅 공급자와, 공급자 배치 API가 활성화되지 않은 경우 호스팅 공급자가 사용하는 인라인 임베딩 호출을 제어합니다. Ollama는 더 작은 로컬 호스트에 과부하가 걸리지 않도록 비배치 인덱싱의 기본값이 `1`입니다. 더 큰 머신에서는 더 높은 값을 설정하세요.

이는 인라인 임베딩 호출의 제한 시간을 제어하는 `sync.embeddingBatchTimeoutSeconds`와는 별개입니다.

---

## 세션 메모리 검색(실험적)

세션 transcript를 인덱싱하고 `memory_search`를 통해 노출합니다:

| 키                            | 유형       | 기본값       | 설명                                  |
| ----------------------------- | ---------- | ------------ | ------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 세션 인덱싱 활성화                    |
| `sources`                     | `string[]` | `["memory"]` | transcript를 포함하려면 `"sessions"` 추가 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 재인덱싱을 위한 바이트 임계값         |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 재인덱싱을 위한 메시지 임계값         |

<Warning>
세션 인덱싱은 옵트인 방식이며 비동기적으로 실행됩니다. 결과가 약간 오래되었을 수 있습니다. 세션 로그는 디스크에 있으므로 파일 시스템 접근을 신뢰 경계로 취급하세요.
</Warning>

---

## SQLite 벡터 가속(sqlite-vec)

| 키                           | 유형      | 기본값 | 설명                              |
| ---------------------------- | --------- | ------ | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true` | 벡터 쿼리에 sqlite-vec 사용       |
| `store.vector.extensionPath` | `string`  | 번들됨 | sqlite-vec 경로 재정의            |

sqlite-vec를 사용할 수 없으면 OpenClaw는 자동으로 프로세스 내 코사인 유사도로 대체합니다.

---

## 인덱스 저장소

| 키                    | 유형     | 기본값                                | 설명                                      |
| --------------------- | -------- | ------------------------------------- | ----------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | 인덱스 위치(`{agentId}` 토큰 지원)        |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 토크나이저(`unicode61` 또는 `trigram`) |

---

## QMD 백엔드 구성

활성화하려면 `memory.backend = "qmd"`를 설정하세요. 모든 QMD 설정은 `memory.qmd` 아래에 있습니다:

| 키                      | 유형      | 기본값  | 설명                                                                           |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 실행 파일 경로; 서비스 `PATH`가 셸과 다를 때 절대 경로를 설정하세요 |
| `searchMode`             | `string`  | `search` | 검색 명령: `search`, `vsearch`, `query`                                          |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md`를 자동 색인                                             |
| `paths[]`                | `array`   | --       | 추가 경로: `{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | 세션 transcript 색인                                                             |
| `sessions.retentionDays` | `number`  | --       | Transcript 보존 기간                                                                  |
| `sessions.exportDir`     | `string`  | --       | 내보내기 디렉터리                                                                      |

`searchMode: "search"`는 lexical/BM25 전용입니다. OpenClaw는 `memory status --deep` 중을 포함하여 이 모드에 대해 semantic vector readiness probe나 QMD embedding maintenance를 실행하지 않습니다. `vsearch`와 `query`는 계속 QMD vector readiness와 embedding을 필요로 합니다.

OpenClaw는 현재 QMD collection 및 MCP query 형태를 선호하지만, 필요할 때 호환 가능한 collection pattern flag와 이전 MCP tool 이름을 시도하여 오래된 QMD 릴리스도 계속 작동하게 합니다. QMD가 여러 collection filter 지원을 알리면 동일 소스 collection은 하나의 QMD 프로세스로 검색됩니다. 이전 QMD 빌드는 collection별 호환성 경로를 유지합니다. 동일 소스란 durable memory collection은 함께 그룹화되고, session transcript collection은 별도 그룹으로 유지되어 source diversification이 여전히 두 입력을 모두 갖는다는 뜻입니다.

<Note>
QMD 모델 override는 OpenClaw config가 아니라 QMD 쪽에 유지됩니다. QMD의 모델을 전역으로 override해야 한다면 gateway runtime environment에서 `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, `QMD_GENERATE_MODEL` 같은 environment variable을 설정하세요.
</Note>

<AccordionGroup>
  <Accordion title="Update schedule">
    | 키                       | 유형      | 기본값 | 설명                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | 새로 고침 간격                      |
    | `update.debounceMs`       | `number`  | `15000` | 파일 변경 debounce                 |
    | `update.onBoot`           | `boolean` | `true`  | 장기 실행 QMD manager가 열릴 때 새로 고침; opt-in startup refresh도 gate 처리 |
    | `update.startup`          | `string`  | `off`   | 선택적 gateway 시작 새로 고침: `off`, `idle`, 또는 `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` 새로 고침이 실행되기 전 지연 |
    | `update.waitForBootSync`  | `boolean` | `false` | 초기 새로 고침이 완료될 때까지 manager 열기를 차단 |
    | `update.embedInterval`    | `string`  | --      | 별도 embed 주기                |
    | `update.commandTimeoutMs` | `number`  | --      | QMD 명령 timeout              |
    | `update.updateTimeoutMs`  | `number`  | --      | QMD update 작업 timeout     |
    | `update.embedTimeoutMs`   | `number`  | --      | QMD embed 작업 timeout      |
  </Accordion>
  <Accordion title="Limits">
    | 키                       | 유형     | 기본값 | 설명                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | 최대 검색 결과         |
    | `limits.maxSnippetChars`  | `number` | --      | snippet 길이 제한       |
    | `limits.maxInjectedChars` | `number` | --      | 전체 injected 문자 수 제한 |
    | `limits.timeoutMs`        | `number` | `4000`  | 검색 timeout             |
  </Accordion>
  <Accordion title="Scope">
    어떤 세션이 QMD 검색 결과를 받을 수 있는지 제어합니다. [`session.sendPolicy`](/ko/gateway/config-agents#session)와 같은 schema입니다.

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

    제공되는 기본값은 direct 및 channel 세션을 허용하면서 group은 계속 거부합니다.

    기본값은 DM 전용입니다. `match.keyPrefix`는 정규화된 session key와 일치하고, `match.rawKeyPrefix`는 `agent:<id>:`를 포함한 raw key와 일치합니다.

  </Accordion>
  <Accordion title="Citations">
    `memory.citations`는 모든 backend에 적용됩니다.

    | 값            | 동작                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (기본값) | snippet에 `Source: <path#line>` footer 포함    |
    | `on`             | 항상 footer 포함                               |
    | `off`            | footer 생략(path는 내부적으로 agent에 계속 전달됨) |

  </Accordion>
</AccordionGroup>

QMD boot refresh는 gateway 시작 중 one-shot subprocess 경로를 사용합니다. 장기 실행 QMD manager는 memory search가 interactive 사용을 위해 열릴 때 여전히 일반 file watcher와 interval timer를 소유합니다.

### 전체 QMD 예시

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
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

Dreaming은 `agents.defaults.memorySearch` 아래가 아니라 `plugins.entries.memory-core.config.dreaming` 아래에서 구성됩니다.

Dreaming은 하나의 scheduled sweep으로 실행되며 내부 light/deep/REM phase를 구현 세부 사항으로 사용합니다.

개념적 동작과 slash command는 [Dreaming](/ko/concepts/dreaming)을 참고하세요.

### 사용자 설정

| 키         | 유형      | 기본값       | 설명                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | dreaming을 완전히 활성화하거나 비활성화               |
| `frequency` | `string`  | `0 3 * * *`   | 전체 dreaming sweep에 대한 선택적 cron 주기 |
| `model`     | `string`  | 기본 모델 | 선택적 Dream Diary subagent 모델 override      |

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
- Dreaming은 machine state를 `memory/.dreams/`에 씁니다.
- Dreaming은 사람이 읽을 수 있는 narrative output을 `DREAMS.md`(또는 기존 `dreams.md`)에 씁니다.
- `dreaming.model`은 기존 plugin subagent trust gate를 사용합니다. 활성화하기 전에 `plugins.entries.memory-core.subagent.allowModelOverride: true`를 설정하세요.
- 구성된 모델을 사용할 수 없으면 Dream Diary는 session default model로 한 번 재시도합니다. trust 또는 allowlist 실패는 기록되며 조용히 재시도되지 않습니다.
- light/deep/REM phase policy와 threshold는 사용자 대상 config가 아니라 내부 동작입니다.

</Note>

## 관련 항목

- [Configuration reference](/ko/gateway/configuration-reference)
- [Memory overview](/ko/concepts/memory)
- [Memory search](/ko/concepts/memory-search)
