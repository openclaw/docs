---
read_when:
    - memory-lancedb Plugin을 구성하고 있습니다.
    - 자동 회상 또는 자동 캡처 기능을 갖춘 LanceDB 기반 장기 메모리가 필요한 경우
    - Ollama와 같은 로컬 OpenAI 호환 임베딩을 사용하고 있습니다
sidebarTitle: Memory LanceDB
summary: 로컬 Ollama 호환 임베딩을 포함하여 공식 외부 LanceDB 메모리 Plugin 구성하기
title: 메모리 LanceDB
x-i18n:
    generated_at: "2026-07-12T00:58:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb`는 벡터 검색을 사용하여 LanceDB에 장기 메모리를 저장하는 공식 외부 Plugin입니다. 모델 턴 전에 관련 메모리를 자동으로 회상하고 응답 후에 중요한 사실을 자동으로 캡처할 수 있습니다.

로컬 벡터 데이터베이스, OpenAI 호환 임베딩 엔드포인트 또는 기본 내장 메모리 백엔드 외부의 메모리 저장소가 필요할 때 사용하세요.

## 설치

```bash
openclaw plugins install @openclaw/memory-lancedb
```

이 Plugin은 npm에 게시되며 OpenClaw 런타임 이미지에 번들로 포함되지 않습니다. 설치하면 Plugin 항목을 작성하고 활성화하며 `plugins.slots.memory`를 `memory-lancedb`로 전환합니다. 현재 다른 Plugin이 메모리 슬롯을 소유하고 있다면 경고와 함께 해당 Plugin이 비활성화됩니다.

<Note>
`memory-wiki`와 같은 보조 Plugin은 `memory-lancedb`와 함께 실행할 수 있지만, 활성 메모리 슬롯은 한 번에 하나의 Plugin만 소유합니다.
</Note>

## 빠른 시작

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Plugin 구성을 변경한 후 Gateway를 다시 시작하고 정상적으로 로드되었는지 확인하세요.

```bash
openclaw gateway restart
openclaw plugins list
```

## 임베딩 구성

`embedding`은 필수이며 적어도 하나의 필드를 포함해야 합니다. `provider`의 기본값은 `openai`이고 `model`의 기본값은 `text-embedding-3-small`입니다.

| 필드                   | 유형          | 참고                                                                     |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | 문자열        | 어댑터 ID(예: `openai`, `github-copilot`, `ollama`). 기본값은 `openai`. |
| `embedding.model`      | 문자열        | 기본값은 `text-embedding-3-small`.                                       |
| `embedding.apiKey`     | 문자열        | 선택 사항이며 `${ENV_VAR}` 확장을 지원합니다.                            |
| `embedding.baseUrl`    | 문자열        | 선택 사항이며 `${ENV_VAR}` 확장을 지원합니다.                            |
| `embedding.dimensions` | 정수 (>=1)    | 내장 표에 없는 모델에는 필수입니다(아래 참조).                            |

두 가지 요청 경로가 있습니다.

- **제공자 어댑터 경로**(기본값): `embedding.provider`를 설정하고 `embedding.apiKey`/`embedding.baseUrl`은 생략합니다. Plugin은 `memory-core`에서 사용하는 것과 동일한 메모리 임베딩 어댑터를 통해 제공자에 구성된 인증 프로필, 환경 변수 또는 `models.providers.<provider>.apiKey`를 확인합니다. 이 경로는 `github-copilot`, `ollama` 및 임베딩을 지원하는 다른 번들 제공자에 사용합니다.
- **직접 OpenAI 호환 클라이언트 경로**: `embedding.provider`를 설정하지 않거나 `"openai"`로 두고 `embedding.apiKey`와 `embedding.baseUrl`을 설정합니다. 번들 제공자 어댑터가 없는 원시 OpenAI 호환 임베딩 엔드포인트에 사용하세요.

OpenAI Codex / ChatGPT OAuth는 OpenAI Platform 임베딩 자격 증명이 아닙니다. OpenAI 임베딩에는 OpenAI API 키 인증 프로필, `OPENAI_API_KEY` 또는 `models.providers.openai.apiKey`를 사용하세요. OAuth만 사용하는 사용자는 `github-copilot`이나 `ollama`처럼 임베딩을 지원하는 다른 제공자를 선택해야 합니다.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

일부 OpenAI 호환 임베딩 엔드포인트는 `encoding_format` 매개변수를 거부하며, 다른 엔드포인트는 이를 무시하고 항상 `number[]`를 반환합니다. `memory-lancedb`는 요청에서 `encoding_format`을 생략하고 부동소수점 배열 또는 base64로 인코딩된 float32 응답을 모두 허용하므로 별도 구성 없이 두 응답 형식 모두 작동합니다.

### 차원

OpenClaw에는 `text-embedding-3-small`(1536)과 `text-embedding-3-large`(3072)의 차원만 내장되어 있습니다. 다른 모든 모델은 LanceDB가 벡터 열을 생성할 수 있도록 명시적인 `embedding.dimensions`가 필요합니다. 예를 들어 ZhiPu `embedding-3`의 차원은 2048입니다.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Ollama 임베딩

번들 Ollama 제공자 어댑터 경로(`embedding.provider: "ollama"`)를 사용하세요. 이 경로는 Ollama의 네이티브 `/api/embed` 엔드포인트를 호출하며 [Ollama](/ko/providers/ollama) 제공자와 동일한 인증 및 기본 URL 규칙을 따릅니다.

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large`는 내장 차원 표에 없으므로 `dimensions`가 필수입니다. 소형 로컬 임베딩 모델의 경우 로컬 서버에서 컨텍스트 길이 오류를 반환하면 `recallMaxChars`를 낮추세요.

## 회상 및 캡처 제한

| 설정              | 기본값  | 범위                         | 적용 대상                                                  |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | 회상을 위해 임베딩 API로 전송되는 텍스트.                  |
| `captureMaxChars` | `500`   | 100-10000                    | 자동 캡처 대상이 될 수 있는 메시지 길이.                   |
| `customTriggers`  | `[]`    | 0-50개, 각각 100자 이하      | 자동 캡처에서 메시지를 검토하게 하는 리터럴 문구.          |

`recallMaxChars`는 `before_prompt_build` 자동 회상 쿼리, `memory_recall` 도구, `memory_forget` 쿼리 경로 및 `openclaw ltm search`를 제한합니다. 자동 회상은 해당 턴의 최신 사용자 메시지를 임베딩하며, 사용자 메시지가 없는 경우에만 전체 프롬프트로 대체하여 채널 메타데이터와 큰 프롬프트 블록이 임베딩 요청에 포함되지 않도록 합니다.

`captureMaxChars`는 해당 턴의 `agent_end` 이벤트에서 가져온 사용자 메시지가 자동 캡처 대상으로 검토될 만큼 짧은지 판별하며, 회상 쿼리에는 영향을 주지 않습니다.

`customTriggers`는 정규식 없이 리터럴 자동 캡처 문구를 추가합니다. 내장 트리거는 영어, 체코어, 중국어, 일본어 및 한국어의 일반적인 메모리 관련 문구(`remember`, `prefer`, `记住`, `覚えて`, `기억해` 등)를 처리합니다.

또한 자동 캡처는 봉투/전송 메타데이터, 프롬프트 인젝션 페이로드 또는 이미 주입된 `<relevant-memories>` 컨텍스트처럼 보이는 텍스트를 거부하며, 에이전트 턴당 캡처되는 메모리를 최대 3개로 제한합니다.

## 명령어

`memory-lancedb`는 활성 메모리 슬롯을 소유한 경우뿐만 아니라 설치되어 있기만 하면 `ltm` CLI 네임스페이스를 등록합니다.

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query`는 LanceDB 테이블을 대상으로 비벡터 쿼리를 직접 실행합니다.

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| 플래그                            | 기본값                                  | 참고                                                                                                                                      |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | 쉼표로 구분된 허용 열 목록.                                                                                                               |
| `--filter <condition>`            | 없음                                    | SQL 형식의 WHERE 절. 최대 200자이며 영숫자, `_-`, 공백 및 `='"<>!.,()%*`만 허용됩니다.                                                     |
| `--limit <n>`                     | `10`                                    | 양의 정수.                                                                                                                                |
| `--order-by <column>:<asc\|desc>` | 없음                                    | 필터 실행 후 메모리에서 정렬합니다. 정렬 열은 프로젝션에 자동으로 추가되며 요청하지 않은 경우 출력에서 제거됩니다.                        |

에이전트는 활성 메모리 Plugin으로부터 다음 세 가지 도구를 받습니다.

- `memory_recall`: 저장된 메모리를 대상으로 벡터 검색을 수행합니다.
- `memory_store`: 사실, 선호 사항, 결정 또는 엔터티를 저장합니다(프롬프트 인젝션 페이로드처럼 보이는 텍스트는 거부하고 거의 중복되는 저장 항목은 건너뜁니다).
- `memory_forget`: `memoryId`로 삭제하거나 `query`로 삭제합니다(점수가 90%를 넘는 일치 항목이 하나이면 자동으로 삭제하고, 그렇지 않으면 구분할 수 있도록 후보 ID를 나열합니다).

## 저장소

LanceDB 데이터의 기본 경로는 `~/.openclaw/memory/lancedb`입니다. `dbPath`로 재정의할 수 있습니다.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions`는 LanceDB 저장소 백엔드(예: S3 호환 객체 저장소)를 위한 문자열 키/값 쌍을 허용하며 `${ENV_VAR}` 확장을 지원합니다.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## 런타임 종속성과 플랫폼 지원

`memory-lancedb`는 Plugin 패키지가 소유하는 네이티브 `@lancedb/lancedb` 패키지에 의존합니다(OpenClaw 핵심 배포판이 소유하지 않음). Gateway 시작 과정에서는 Plugin 종속성을 복구하지 않습니다. 네이티브 종속성이 없거나 로드에 실패하면 Plugin 패키지를 다시 설치하거나 업데이트한 후 Gateway를 다시 시작하세요.

`@lancedb/lancedb`는 `darwin-x64`(Intel Mac)용 네이티브 빌드를 게시하지 않습니다. 이 플랫폼에서는 Plugin을 로드할 때 LanceDB를 사용할 수 없다는 로그가 기록됩니다. 기본 메모리 백엔드를 사용하거나, 지원되는 플랫폼/아키텍처에서 Gateway를 실행하거나, `memory-lancedb`를 비활성화하세요.

## 문제 해결

### 입력 길이가 컨텍스트 길이를 초과함

임베딩 모델이 회상 쿼리를 거부했습니다.

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

`recallMaxChars`를 낮춘 후 Gateway를 다시 시작하세요.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Ollama의 경우 네이티브 임베딩 엔드포인트를 사용하여 Gateway 호스트에서 임베딩 서버에 접근할 수 있는지도 확인하세요.

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 지원되지 않는 임베딩 모델

`embedding.dimensions`가 없으면 내장 OpenAI 임베딩 차원(`text-embedding-3-small`, `text-embedding-3-large`)만 인식됩니다. 다른 모델을 사용하려면 `embedding.dimensions`를 해당 모델이 보고하는 벡터 크기로 설정하세요.

### Plugin은 로드되지만 메모리가 표시되지 않음

`plugins.slots.memory`가 `memory-lancedb`를 가리키는지 확인한 후 다음을 실행합니다.

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

`autoCapture`가 비활성화되어 있어도 Plugin은 기존 메모리를 불러오지만
새 메모리를 자동으로 저장하지는 않습니다. `memory_store` 도구를 사용하거나
`autoCapture`를 활성화하세요.

## 관련 문서

- [메모리 개요](/ko/concepts/memory)
- [Active Memory](/ko/concepts/active-memory)
- [메모리 검색](/ko/concepts/memory-search)
- [메모리 위키](/ko/plugins/memory-wiki)
- [Ollama](/ko/providers/ollama)
