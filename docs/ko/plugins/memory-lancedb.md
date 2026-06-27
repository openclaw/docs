---
read_when:
    - memory-lancedb Plugin을 구성하고 있습니다
    - LanceDB 기반 장기 기억에 자동 회상 또는 자동 캡처를 사용하려는 경우
    - 로컬에서 Ollama와 같은 OpenAI 호환 임베딩을 사용하고 있습니다
sidebarTitle: Memory LanceDB
summary: 공식 외부 LanceDB 메모리 Plugin 구성하기, 로컬 Ollama 호환 임베딩 포함
title: Memory LanceDB
x-i18n:
    generated_at: "2026-06-27T17:46:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb`는 장기 메모리를 LanceDB에 저장하고 임베딩을 사용해 회상하는 공식 외부 메모리 Plugin입니다. 모델 턴 전에 관련 메모리를 자동으로 회상하고, 응답 후 중요한 사실을 캡처할 수 있습니다.

메모리에 로컬 벡터 데이터베이스가 필요하거나, OpenAI 호환 임베딩 엔드포인트가 필요하거나, 기본 내장 메모리 저장소 밖에 메모리 데이터베이스를 유지하려는 경우 사용하세요.

## 설치

`plugins.slots.memory = "memory-lancedb"`를 설정하기 전에 `memory-lancedb`를 설치하세요.

```bash
openclaw plugins install @openclaw/memory-lancedb
```

이 Plugin은 npm에 게시되며 OpenClaw 런타임 이미지에 번들로 포함되지 않습니다.
다른 Plugin이 소유하고 있지 않은 경우 설치 관리자가 Plugin 항목을 쓰고 메모리 슬롯을 전환합니다.

<Note>
`memory-lancedb`는 활성 메모리 Plugin입니다. `plugins.slots.memory = "memory-lancedb"`로 메모리 슬롯을 선택해 활성화하세요. `memory-wiki` 같은 동반 Plugin은 함께 실행할 수 있지만, 활성 메모리 슬롯은 하나의 Plugin만 소유합니다.
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

Plugin 구성을 변경한 후 Gateway를 다시 시작하세요.

```bash
openclaw gateway restart
```

그런 다음 Plugin이 로드되었는지 확인하세요.

```bash
openclaw plugins list
```

## 공급자 기반 임베딩

`memory-lancedb`는 `memory-core`와 동일한 메모리 임베딩 공급자 어댑터를 사용할 수 있습니다. 공급자의 구성된 인증 프로필, 환경 변수 또는 `models.providers.<provider>.apiKey`를 사용하려면 `embedding.provider`를 설정하고 `embedding.apiKey`는 생략하세요.

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
        },
      },
    },
  },
}
```

이 경로는 임베딩 자격 증명을 노출하는 공급자 인증 프로필과 함께 작동합니다. 예를 들어 Copilot 프로필/플랜이 임베딩을 지원하는 경우 GitHub Copilot을 사용할 수 있습니다.

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth는 OpenAI Platform 임베딩 자격 증명이 아닙니다. OpenAI 임베딩에는 OpenAI API 키 인증 프로필, `OPENAI_API_KEY` 또는 `models.providers.openai.apiKey`를 사용하세요. OAuth 전용 사용자는 GitHub Copilot 또는 Ollama 같은 다른 임베딩 지원 공급자를 사용할 수 있습니다.

## Ollama 임베딩

Ollama 임베딩에는 번들된 Ollama 임베딩 공급자를 권장합니다. 이 공급자는 네이티브 Ollama `/api/embed` 엔드포인트를 사용하며 [Ollama](/ko/providers/ollama)에 문서화된 Ollama 공급자와 동일한 인증/기본 URL 규칙을 따릅니다.

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

비표준 임베딩 모델에는 `dimensions`를 설정하세요. OpenClaw는 `text-embedding-3-small` 및 `text-embedding-3-large`의 차원을 알고 있습니다. 사용자 지정 모델은 LanceDB가 벡터 열을 생성할 수 있도록 구성에 해당 값이 필요합니다.

작은 로컬 임베딩 모델의 경우 로컬 서버에서 컨텍스트 길이 오류가 표시되면 `recallMaxChars`를 낮추세요.

## OpenAI 호환 공급자

일부 OpenAI 호환 임베딩 공급자는 `encoding_format` 매개변수를 거부하지만, 다른 공급자는 이를 무시하고 항상 `number[]` 벡터를 반환합니다. 따라서 `memory-lancedb`는 임베딩 요청에서 `encoding_format`을 생략하고 float 배열 응답 또는 base64로 인코딩된 float32 응답을 모두 허용합니다.

번들된 공급자 어댑터가 없는 원시 OpenAI 호환 임베딩 엔드포인트가 있는 경우 `embedding.provider`를 생략하거나 `openai`로 둔 뒤 `embedding.apiKey`와 `embedding.baseUrl`을 설정하세요. 이렇게 하면 직접 OpenAI 호환 클라이언트 경로가 유지됩니다.

모델 차원이 내장되어 있지 않은 공급자에는 `embedding.dimensions`를 설정하세요. 예를 들어 ZhiPu `embedding-3`는 `2048` 차원을 사용합니다.

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

## 회상 및 캡처 제한

`memory-lancedb`에는 두 가지 별도 텍스트 제한이 있습니다.

| 설정              | 기본값  | 범위      | 적용 대상                                                 |
| ----------------- | ------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | 회상을 위해 임베딩 API로 전송되는 텍스트                 |
| `captureMaxChars` | `500`   | 100-10000 | 자동 캡처 대상이 될 수 있는 메시지 길이                  |
| `customTriggers`  | `[]`    | 0-50      | 자동 캡처가 메시지를 고려하게 만드는 리터럴 문구         |

`recallMaxChars`는 자동 회상, `memory_recall` 도구, `memory_forget` 쿼리 경로 및 `openclaw ltm search`를 제어합니다. 자동 회상은 해당 턴의 최신 사용자 메시지를 우선 사용하며, 사용자 메시지가 없을 때만 전체 프롬프트로 대체합니다. 이렇게 하면 채널 메타데이터와 큰 프롬프트 블록이 임베딩 요청에 포함되지 않습니다.

`captureMaxChars`는 응답이 자동 캡처 대상으로 고려될 만큼 충분히 짧은지 제어합니다. 회상 쿼리 임베딩을 제한하지는 않습니다.

`customTriggers`를 사용하면 정규식을 작성하지 않고 리터럴 자동 캡처 문구를 추가할 수 있습니다. 내장 트리거에는 일반적인 영어, 체코어, 중국어, 일본어 및 한국어 메모리 문구가 포함됩니다.

## 명령

`memory-lancedb`가 활성 메모리 Plugin이면 `ltm` CLI 네임스페이스를 등록합니다.

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

`query` 하위 명령은 LanceDB 테이블에 대해 직접 비벡터 쿼리를 실행합니다.

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: 쉼표로 구분된 열 허용 목록입니다. 기본값은 `id`, `text`, `importance`, `category`, `createdAt`입니다.
- `--filter <condition>`: SQL 스타일 WHERE 절입니다. 200자로 제한되며 영숫자, 비교 연산자, 따옴표, 괄호 및 소수의 안전한 문장 부호로 제한됩니다.
- `--limit <n>`: 양의 정수입니다. 기본값은 `10`입니다.
- `--order-by <column>:<asc|desc>`: 필터 적용 후 적용되는 인메모리 정렬입니다. 정렬 열은 프로젝션에 자동으로 포함됩니다.

에이전트도 활성 메모리 Plugin에서 LanceDB 메모리 도구를 받습니다.

- LanceDB 기반 회상을 위한 `memory_recall`
- 중요한 사실, 선호도, 결정 및 엔터티를 저장하기 위한 `memory_store`
- 일치하는 메모리를 제거하기 위한 `memory_forget`

## 저장소

기본적으로 LanceDB 데이터는 `~/.openclaw/memory/lancedb` 아래에 있습니다. `dbPath`로 경로를 재정의하세요.

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

`storageOptions`는 LanceDB 저장소 백엔드용 문자열 키/값 쌍을 허용하며 `${ENV_VAR}` 확장을 지원합니다.

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

## 런타임 종속성

`memory-lancedb`는 네이티브 `@lancedb/lancedb` 패키지에 의존합니다. 패키징된 OpenClaw는 해당 패키지를 Plugin 패키지의 일부로 취급합니다. Gateway 시작은 Plugin 종속성을 복구하지 않습니다. 종속성이 없으면 Plugin 패키지를 다시 설치하거나 업데이트한 뒤 Gateway를 다시 시작하세요.

오래된 설치에서 Plugin 로드 중 누락된 `dist/package.json` 또는 누락된 `@lancedb/lancedb` 오류가 기록되면 OpenClaw를 업그레이드하고 Gateway를 다시 시작하세요.

Plugin이 LanceDB를 `darwin-x64`에서 사용할 수 없다고 기록하는 경우, 해당 머신에서 기본 메모리 백엔드를 사용하거나 Gateway를 지원되는 플랫폼으로 옮기거나 `memory-lancedb`를 비활성화하세요.

## 문제 해결

### 입력 길이가 컨텍스트 길이를 초과함

이는 일반적으로 임베딩 모델이 회상 쿼리를 거부했다는 뜻입니다.

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

더 낮은 `recallMaxChars`를 설정한 뒤 Gateway를 다시 시작하세요.

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

Ollama의 경우 임베딩 서버가 Gateway 호스트에서 접근 가능한지도 확인하세요.

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 지원되지 않는 임베딩 모델

`dimensions`가 없으면 내장 OpenAI 임베딩 차원만 알려져 있습니다. 로컬 또는 사용자 지정 임베딩 모델의 경우 `embedding.dimensions`를 해당 모델이 보고하는 벡터 크기로 설정하세요.

### Plugin은 로드되지만 메모리가 표시되지 않음

`plugins.slots.memory`가 `memory-lancedb`를 가리키는지 확인한 뒤 다음을 실행하세요.

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

`autoCapture`가 비활성화되어 있으면 Plugin은 기존 메모리를 회상하지만 새 메모리를 자동으로 저장하지 않습니다. 자동 캡처를 원하면 `memory_store` 도구를 사용하거나 `autoCapture`를 활성화하세요.

## 관련 항목

- [메모리 개요](/ko/concepts/memory)
- [Active memory](/ko/concepts/active-memory)
- [메모리 검색](/ko/concepts/memory-search)
- [Memory Wiki](/ko/plugins/memory-wiki)
- [Ollama](/ko/providers/ollama)
