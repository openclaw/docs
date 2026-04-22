---
read_when:
    - Ollama를 통해 클라우드 또는 로컬 모델로 OpenClaw를 실행하려고 합니다.
    - Ollama 설정 및 구성 안내가 필요합니다.
    - 이미지 이해를 위해 Ollama 비전 모델을 사용하려고 합니다.
summary: Ollama로 OpenClaw 실행하기(클라우드 및 로컬 모델)
title: Ollama
x-i18n:
    generated_at: "2026-04-22T06:00:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 704beed3bf988d6c2ad50b2a1533f6dcef655e44b34f23104827d2acb71b8655
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

OpenClaw는 Ollama의 네이티브 API(`/api/chat`)와 통합되어, 호스팅된 클라우드 모델과 로컬/자체 호스팅 Ollama 서버를 모두 사용할 수 있습니다. Ollama는 세 가지 모드로 사용할 수 있습니다: 연결 가능한 Ollama 호스트를 통한 `Cloud + Local`, `https://ollama.com`에 대한 `Cloud only`, 또는 연결 가능한 Ollama 호스트에 대한 `Local only`.

<Warning>
**원격 Ollama 사용자**: OpenClaw에서 `/v1` OpenAI 호환 URL(`http://host:11434/v1`)을 사용하지 마세요. 이렇게 하면 도구 호출이 깨지고 모델이 원시 도구 JSON을 일반 텍스트로 출력할 수 있습니다. 대신 네이티브 Ollama API URL을 사용하세요: `baseUrl: "http://host:11434"` (`/v1` 없음).
</Warning>

## 시작하기

선호하는 설정 방법과 모드를 선택하세요.

<Tabs>
  <Tab title="온보딩(권장)">
    **적합한 경우:** 작동하는 Ollama 클라우드 또는 로컬 설정으로 가장 빠르게 시작하고 싶을 때.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard
        ```

        제공자 목록에서 **Ollama**를 선택하세요.
      </Step>
      <Step title="모드 선택">
        - **Cloud + Local** — 로컬 Ollama 호스트와, 해당 호스트를 통해 라우팅되는 클라우드 모델
        - **Cloud only** — `https://ollama.com`을 통한 호스팅된 Ollama 모델
        - **Local only** — 로컬 모델만 사용
      </Step>
      <Step title="모델 선택">
        `Cloud only`는 `OLLAMA_API_KEY`를 요청하고 호스팅된 클라우드 기본값을 제안합니다. `Cloud + Local`과 `Local only`는 Ollama 기본 URL을 요청하고, 사용 가능한 모델을 검색하며, 선택한 로컬 모델이 아직 없으면 자동으로 pull합니다. `Cloud + Local`은 해당 Ollama 호스트가 클라우드 액세스를 위해 로그인되어 있는지도 확인합니다.
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### 비대화형 모드

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    선택적으로 사용자 지정 기본 URL 또는 모델을 지정할 수 있습니다.

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="수동 설정">
    **적합한 경우:** 클라우드 또는 로컬 설정을 완전히 제어하고 싶을 때.

    <Steps>
      <Step title="클라우드 또는 로컬 선택">
        - **Cloud + Local**: Ollama를 설치하고, `ollama signin`으로 로그인한 뒤, 해당 호스트를 통해 클라우드 요청을 라우팅
        - **Cloud only**: `OLLAMA_API_KEY`와 함께 `https://ollama.com` 사용
        - **Local only**: [ollama.com/download](https://ollama.com/download)에서 Ollama 설치
      </Step>
      <Step title="로컬 모델 pull하기(Local only)">
        ```bash
        ollama pull gemma4
        # 또는
        ollama pull gpt-oss:20b
        # 또는
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClaw에서 Ollama 활성화">
        `Cloud only`에서는 실제 `OLLAMA_API_KEY`를 사용하세요. 호스트 기반 설정에서는 아무 자리표시자 값이나 작동합니다.

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # 또는 구성 파일에서 설정
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="모델 확인 및 설정">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        또는 구성에서 기본값을 설정하세요.

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 클라우드 모델

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local`은 연결 가능한 Ollama 호스트를 로컬 모델과 클라우드 모델 모두의 제어 지점으로 사용합니다. 이것이 Ollama에서 권장하는 하이브리드 흐름입니다.

    설정 중에 **Cloud + Local**을 사용하세요. OpenClaw는 Ollama 기본 URL을 요청하고, 해당 호스트에서 로컬 모델을 검색하며, 호스트가 `ollama signin`으로 클라우드 액세스에 로그인되어 있는지 확인합니다. 호스트가 로그인되어 있으면 OpenClaw는 `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud` 같은 호스팅된 클라우드 기본값도 제안합니다.

    호스트가 아직 로그인되어 있지 않으면, `ollama signin`을 실행할 때까지 OpenClaw는 설정을 로컬 전용으로 유지합니다.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only`는 `https://ollama.com`의 Ollama 호스팅 API를 대상으로 실행됩니다.

    설정 중에 **Cloud only**를 사용하세요. OpenClaw는 `OLLAMA_API_KEY`를 요청하고, `baseUrl: "https://ollama.com"`을 설정하며, 호스팅된 클라우드 모델 목록을 시드합니다. 이 경로는 로컬 Ollama 서버나 `ollama signin`이 **필요하지 않습니다**.

    `openclaw onboard` 중에 표시되는 클라우드 모델 목록은 `https://ollama.com/api/tags`에서 실시간으로 채워지며, 최대 500개 항목으로 제한되므로 선택기는 정적인 시드가 아니라 현재 호스팅 카탈로그를 반영합니다. 설정 시점에 `ollama.com`에 연결할 수 없거나 모델이 반환되지 않으면, 온보딩이 계속 완료되도록 OpenClaw는 이전 하드코딩된 제안값으로 대체합니다.

  </Tab>

  <Tab title="Local only">
    로컬 전용 모드에서 OpenClaw는 구성된 Ollama 인스턴스에서 모델을 검색합니다. 이 경로는 로컬 또는 자체 호스팅 Ollama 서버용입니다.

    현재 OpenClaw는 로컬 기본값으로 `gemma4`를 제안합니다.

  </Tab>
</Tabs>

## 모델 검색(암시적 provider)

`OLLAMA_API_KEY`(또는 auth profile)를 설정하고 `models.providers.ollama`를 정의하지 **않으면**, OpenClaw는 `http://127.0.0.1:11434`의 로컬 Ollama 인스턴스에서 모델을 검색합니다.

| 동작 | 상세 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 카탈로그 조회 | `/api/tags` 조회 |
| 기능 감지 | 최선형 `/api/show` 조회를 사용해 `contextWindow`를 읽고 기능(비전 포함)을 감지 |
| 비전 모델 | `/api/show`에서 `vision` 기능이 보고되는 모델은 이미지 지원(`input: ["text", "image"]`)으로 표시되므로, OpenClaw가 프롬프트에 이미지를 자동 주입 |
| reasoning 감지 | 모델 이름 휴리스틱(`r1`, `reasoning`, `think`)으로 `reasoning` 표시 |
| 토큰 제한 | OpenClaw가 사용하는 기본 Ollama 최대 토큰 제한으로 `maxTokens` 설정 |
| 비용 | 모든 비용을 `0`으로 설정 |

이렇게 하면 수동 모델 항목 없이도 카탈로그를 로컬 Ollama 인스턴스와 일치된 상태로 유지할 수 있습니다.

```bash
# 사용 가능한 모델 확인
ollama list
openclaw models list
```

새 모델을 추가하려면 Ollama로 간단히 pull하면 됩니다.

```bash
ollama pull mistral
```

새 모델은 자동으로 검색되어 사용할 수 있게 됩니다.

<Note>
`models.providers.ollama`를 명시적으로 설정하면 자동 검색은 건너뛰며, 모델을 수동으로 정의해야 합니다. 아래의 명시적 구성 섹션을 참고하세요.
</Note>

## 비전 및 이미지 설명

번들된 Ollama Plugin은 Ollama를 이미지 지원 미디어 이해 provider로 등록합니다. 이를 통해 OpenClaw는 명시적인 이미지 설명 요청과 구성된 이미지 모델 기본값을 로컬 또는 호스팅된 Ollama 비전 모델로 라우팅할 수 있습니다.

로컬 비전의 경우 이미지를 지원하는 모델을 pull하세요.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

그다음 infer CLI로 확인하세요.

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model`은 전체 `<provider/model>` 참조여야 합니다. 이 값이 설정되면 `openclaw infer image describe`는 해당 모델이 네이티브 비전을 지원해서 설명을 건너뛰는 대신, 그 모델을 직접 실행합니다.

수신 미디어에 대한 기본 이미지 이해 모델로 Ollama를 사용하려면 `agents.defaults.imageModel`을 구성하세요.

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

`models.providers.ollama.models`를 수동으로 정의하는 경우, 비전 모델에 이미지 입력 지원을 표시하세요.

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw는 이미지 지원으로 표시되지 않은 모델에 대한 이미지 설명 요청을 거부합니다. 암시적 검색을 사용할 때는 `/api/show`가 비전 기능을 보고하면 OpenClaw가 이를 Ollama에서 읽어옵니다.

## 구성

<Tabs>
  <Tab title="기본(암시적 검색)">
    가장 간단한 로컬 전용 활성화 경로는 환경 변수를 사용하는 것입니다.

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY`가 설정되어 있으면 provider 항목에서 `apiKey`를 생략할 수 있으며, OpenClaw가 사용 가능 여부 확인을 위해 이를 채웁니다.
    </Tip>

  </Tab>

  <Tab title="명시적(수동 모델)">
    호스팅된 클라우드 설정을 원하거나, Ollama가 다른 호스트/포트에서 실행되거나, 특정 컨텍스트 윈도우 또는 모델 목록을 강제하고 싶거나, 완전 수동 모델 정의를 원할 때는 명시적 구성을 사용하세요.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="사용자 지정 기본 URL">
    Ollama가 다른 호스트나 포트에서 실행 중인 경우(명시적 구성은 자동 검색을 비활성화하므로 모델을 수동으로 정의해야 함):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // /v1 없음 - 네이티브 Ollama API URL 사용
            api: "ollama", // 네이티브 도구 호출 동작을 보장하려면 명시적으로 설정
          },
        },
      },
    }
    ```

    <Warning>
    URL에 `/v1`을 추가하지 마세요. `/v1` 경로는 OpenAI 호환 모드를 사용하므로 도구 호출이 안정적이지 않습니다. 경로 접미사 없이 기본 Ollama URL을 사용하세요.
    </Warning>

  </Tab>
</Tabs>

### 모델 선택

구성이 완료되면 모든 Ollama 모델을 사용할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

OpenClaw는 번들된 `web_search` provider로 **Ollama Web Search**를 지원합니다.

| 속성 | 상세 |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| 호스트 | 구성된 Ollama 호스트 사용(`models.providers.ollama.baseUrl`이 설정된 경우 해당 값, 그렇지 않으면 `http://127.0.0.1:11434`) |
| 인증 | 키 불필요 |
| 요구 사항 | Ollama가 실행 중이어야 하며 `ollama signin`으로 로그인되어 있어야 함 |

`openclaw onboard` 또는 `openclaw configure --section web` 중에 **Ollama Web Search**를 선택하거나, 다음을 설정하세요:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
전체 설정 및 동작 세부 정보는 [Ollama Web Search](/ko/tools/ollama-search)를 참고하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="레거시 OpenAI 호환 모드">
    <Warning>
    **OpenAI 호환 모드에서는 도구 호출이 안정적이지 않습니다.** 프록시에 OpenAI 형식이 필요한 경우에만 이 모드를 사용하고, 네이티브 도구 호출 동작에 의존하지 마세요.
    </Warning>

    대신 OpenAI 호환 엔드포인트를 사용해야 하는 경우(예: OpenAI 형식만 지원하는 프록시 뒤에 있는 경우), `api: "openai-completions"`를 명시적으로 설정하세요.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // 기본값: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    이 모드에서는 스트리밍과 도구 호출을 동시에 지원하지 않을 수 있습니다. 모델 구성에서 `params: { streaming: false }`로 스트리밍을 비활성화해야 할 수도 있습니다.

    Ollama와 함께 `api: "openai-completions"`를 사용할 때 OpenClaw는 기본적으로 `options.num_ctx`를 주입하여 Ollama가 조용히 4096 컨텍스트 윈도우로 대체되지 않도록 합니다. 프록시/업스트림이 알 수 없는 `options` 필드를 거부한다면 이 동작을 비활성화하세요.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="컨텍스트 윈도우">
    자동 검색된 모델의 경우 OpenClaw는 가능하면 Ollama가 보고한 컨텍스트 윈도우를 사용하고, 그렇지 않으면 OpenClaw가 사용하는 기본 Ollama 컨텍스트 윈도우로 대체합니다.

    명시적 provider 구성에서 `contextWindow`와 `maxTokens`를 재정의할 수 있습니다.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="reasoning 모델">
    OpenClaw는 기본적으로 `deepseek-r1`, `reasoning`, `think` 같은 이름을 가진 모델을 reasoning 지원 모델로 취급합니다.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    추가 구성은 필요하지 않습니다. OpenClaw가 자동으로 표시합니다.

  </Accordion>

  <Accordion title="모델 비용">
    Ollama는 무료이며 로컬에서 실행되므로 모든 모델 비용은 $0으로 설정됩니다. 이는 자동 검색된 모델과 수동으로 정의된 모델 모두에 적용됩니다.
  </Accordion>

  <Accordion title="메모리 임베딩">
    번들된 Ollama Plugin은 [메모리 검색](/ko/concepts/memory)을 위한 메모리 임베딩 provider를 등록합니다. 구성된 Ollama 기본 URL과 API 키를 사용합니다.

    | 속성 | 값 |
    | ------------- | ------------------- |
    | 기본 모델 | `nomic-embed-text` |
    | 자동 pull | 예 — 로컬에 없으면 임베딩 모델을 자동으로 pull합니다 |

    메모리 검색 임베딩 provider로 Ollama를 선택하려면 다음과 같이 설정하세요.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="스트리밍 구성">
    OpenClaw의 Ollama 통합은 기본적으로 **네이티브 Ollama API**(`/api/chat`)를 사용하며, 이 API는 스트리밍과 도구 호출을 동시에 완전히 지원합니다. 별도의 특별한 구성은 필요하지 않습니다.

    네이티브 `/api/chat` 요청의 경우 OpenClaw는 thinking 제어도 Ollama에 직접 전달합니다. `/think off`와 `openclaw agent --thinking off`는 최상위 `think: false`를 보내고, `off`가 아닌 thinking 수준은 `think: true`를 보냅니다.

    <Tip>
    OpenAI 호환 엔드포인트를 사용해야 한다면 위의 "레거시 OpenAI 호환 모드" 섹션을 참고하세요. 해당 모드에서는 스트리밍과 도구 호출이 동시에 작동하지 않을 수 있습니다.
    </Tip>

  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="Ollama가 감지되지 않음">
    Ollama가 실행 중인지, `OLLAMA_API_KEY`(또는 auth profile)를 설정했는지, 그리고 명시적인 `models.providers.ollama` 항목을 정의하지 **않았는지** 확인하세요.

    ```bash
    ollama serve
    ```

    API에 접근할 수 있는지 확인하세요.

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="사용 가능한 모델이 없음">
    모델이 목록에 없으면 로컬에서 해당 모델을 pull하거나 `models.providers.ollama`에 명시적으로 정의하세요.

    ```bash
    ollama list  # 설치된 항목 확인
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 또는 다른 모델
    ```

  </Accordion>

  <Accordion title="연결 거부됨">
    Ollama가 올바른 포트에서 실행 중인지 확인하세요.

    ```bash
    # Ollama 실행 여부 확인
    ps aux | grep ollama

    # 또는 Ollama 재시작
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [문제 해결](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq).
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 provider" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, 모델 참조, 장애 조치 동작 개요.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델 선택 및 구성 방법.
  </Card>
  <Card title="Ollama Web Search" href="/ko/tools/ollama-search" icon="magnifying-glass">
    Ollama 기반 웹 검색의 전체 설정 및 동작 세부 정보.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 구성 참조.
  </Card>
</CardGroup>
