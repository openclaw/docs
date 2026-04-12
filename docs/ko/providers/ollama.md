---
read_when:
    - Ollama를 통해 클라우드 또는 로컬 모델로 OpenClaw를 실행하려고 합니다
    - Ollama 설정 및 구성 안내가 필요합니다
summary: Ollama로 OpenClaw 실행하기(클라우드 및 로컬 모델)
title: Ollama
x-i18n:
    generated_at: "2026-04-12T23:31:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec796241b884ca16ec7077df4f3f1910e2850487bb3ea94f8fdb37c77e02b219
    source_path: providers/ollama.md
    workflow: 15
---

# Ollama

Ollama는 내 컴퓨터에서 오픈 소스 모델을 쉽게 실행할 수 있게 해주는 로컬 LLM 런타임입니다. OpenClaw는 Ollama의 네이티브 API(`/api/chat`)와 통합되며, 스트리밍과 도구 호출을 지원하고, `OLLAMA_API_KEY`(또는 인증 프로필)를 사용하면서 명시적인 `models.providers.ollama` 항목을 정의하지 않으면 로컬 Ollama 모델을 자동 검색할 수 있습니다.

<Warning>
**원격 Ollama 사용자**: OpenClaw에서 `/v1` OpenAI 호환 URL(`http://host:11434/v1`)을 사용하지 마세요. 이렇게 하면 도구 호출이 깨지고 모델이 원시 도구 JSON을 일반 텍스트로 출력할 수 있습니다. 대신 네이티브 Ollama API URL을 사용하세요: `baseUrl: "http://host:11434"` (`/v1` 없음).
</Warning>

## 시작하기

선호하는 설정 방법과 모드를 선택하세요.

<Tabs>
  <Tab title="온보딩(권장)">
    **가장 적합한 경우:** 자동 모델 검색이 포함된 동작하는 Ollama 설정까지 가장 빠른 경로.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard
        ```

        provider 목록에서 **Ollama**를 선택하세요.
      </Step>
      <Step title="모드 선택">
        - **클라우드 + 로컬** — 클라우드 호스팅 모델과 로컬 모델을 함께 사용
        - **로컬** — 로컬 모델만 사용

        **클라우드 + 로컬**을 선택했고 ollama.com에 로그인되어 있지 않다면, 온보딩이 브라우저 로그인 흐름을 엽니다.
      </Step>
      <Step title="모델 선택">
        온보딩은 사용 가능한 모델을 검색하고 기본값을 제안합니다. 선택한 모델을 로컬에서 사용할 수 없으면 자동으로 가져옵니다.
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

    선택적으로 사용자 지정 base URL 또는 모델을 지정할 수 있습니다:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="수동 설정">
    **가장 적합한 경우:** 설치, 모델 pull, 구성에 대한 완전한 제어.

    <Steps>
      <Step title="Ollama 설치">
        [ollama.com/download](https://ollama.com/download)에서 다운로드하세요.
      </Step>
      <Step title="로컬 모델 pull">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="클라우드 모델용 로그인(선택 사항)">
        클라우드 모델도 사용하려면:

        ```bash
        ollama signin
        ```
      </Step>
      <Step title="OpenClaw에서 Ollama 활성화">
        API 키에는 아무 값이나 설정해도 됩니다(Ollama는 실제 키를 요구하지 않음):

        ```bash
        # 환경 변수 설정
        export OLLAMA_API_KEY="ollama-local"

        # 또는 구성 파일에서 설정
        openclaw config set models.providers.ollama.apiKey "ollama-local"
        ```
      </Step>
      <Step title="모델 확인 및 설정">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        또는 구성에서 기본값을 설정:

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
  <Tab title="클라우드 + 로컬">
    클라우드 모델을 사용하면 로컬 모델과 함께 클라우드 호스팅 모델을 실행할 수 있습니다. 예로 `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`가 있으며, 이들은 로컬 `ollama pull`이 **필요하지 않습니다**.

    설정 중에 **클라우드 + 로컬** 모드를 선택하세요. 마법사는 로그인 여부를 확인하고 필요할 때 브라우저 로그인 흐름을 엽니다. 인증을 확인할 수 없으면 마법사는 로컬 모델 기본값으로 대체합니다.

    [ollama.com/signin](https://ollama.com/signin)에서 직접 로그인할 수도 있습니다.

    OpenClaw는 현재 다음 클라우드 기본값을 제안합니다: `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`.

  </Tab>

  <Tab title="로컬만">
    로컬 전용 모드에서 OpenClaw는 로컬 Ollama 인스턴스에서 모델을 검색합니다. 클라우드 로그인은 필요하지 않습니다.

    OpenClaw는 현재 로컬 기본값으로 `gemma4`를 제안합니다.

  </Tab>
</Tabs>

## 모델 검색(암시적 provider)

`OLLAMA_API_KEY`(또는 인증 프로필)를 설정하고 **`models.providers.ollama`를 정의하지 않으면**, OpenClaw는 `http://127.0.0.1:11434`의 로컬 Ollama 인스턴스에서 모델을 검색합니다.

| Behavior             | Detail                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catalog query        | `/api/tags` 조회                                                                                                                                                    |
| Capability detection | 최선의 노력 방식의 `/api/show` 조회를 사용해 `contextWindow`를 읽고 기능(vision 포함)을 감지                                                                       |
| Vision models        | `/api/show`가 `vision` 기능을 보고하는 모델은 이미지 지원 가능(`input: ["text", "image"]`)으로 표시되므로, OpenClaw가 프롬프트에 이미지를 자동 주입함             |
| Reasoning detection  | 모델 이름 휴리스틱(`r1`, `reasoning`, `think`)으로 `reasoning` 표시                                                                                                |
| Token limits         | OpenClaw가 사용하는 기본 Ollama 최대 토큰 한도로 `maxTokens` 설정                                                                                                   |
| Costs                | 모든 비용을 `0`으로 설정                                                                                                                                             |

이렇게 하면 카탈로그를 로컬 Ollama 인스턴스와 일치시킨 상태로 유지하면서 수동 모델 항목 정의를 피할 수 있습니다.

```bash
# 사용 가능한 모델 확인
ollama list
openclaw models list
```

새 모델을 추가하려면 Ollama로 pull만 하면 됩니다:

```bash
ollama pull mistral
```

새 모델은 자동으로 검색되어 바로 사용할 수 있습니다.

<Note>
`models.providers.ollama`를 명시적으로 설정하면 자동 검색은 건너뛰며, 모델을 수동으로 정의해야 합니다. 아래의 명시적 구성 섹션을 참조하세요.
</Note>

## 구성

<Tabs>
  <Tab title="기본(암시적 검색)">
    Ollama를 활성화하는 가장 간단한 방법은 환경 변수를 사용하는 것입니다:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY`가 설정되어 있으면 provider 항목에서 `apiKey`를 생략할 수 있으며, OpenClaw가 사용 가능 여부 확인을 위해 이를 채워 넣습니다.
    </Tip>

  </Tab>

  <Tab title="명시적(수동 모델)">
    Ollama가 다른 호스트/포트에서 실행 중이거나, 특정 컨텍스트 윈도우 또는 모델 목록을 강제하고 싶거나, 완전히 수동 모델 정의를 원하는 경우 명시적 구성을 사용하세요.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            apiKey: "ollama-local",
            api: "ollama",
            models: [
              {
                id: "gpt-oss:20b",
                name: "GPT-OSS 20B",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 8192,
                maxTokens: 8192 * 10
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="사용자 지정 base URL">
    Ollama가 다른 호스트나 포트에서 실행 중인 경우(명시적 구성은 자동 검색을 비활성화하므로 모델을 수동 정의해야 함):

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
    URL에 `/v1`을 추가하지 마세요. `/v1` 경로는 OpenAI 호환 모드를 사용하며, 이 모드에서는 도구 호출이 신뢰할 수 없습니다. 경로 접미사 없이 기본 Ollama URL을 사용하세요.
    </Warning>

  </Tab>
</Tabs>

### 모델 선택

구성이 완료되면 모든 Ollama 모델을 사용할 수 있습니다:

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

OpenClaw는 번들 `web_search` provider로 **Ollama Web Search**를 지원합니다.

| Property    | Detail                                                                                                                |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| Host        | 구성된 Ollama 호스트 사용(`models.providers.ollama.baseUrl`이 설정된 경우 해당 값, 아니면 `http://127.0.0.1:11434`) |
| Auth        | 키 불필요                                                                                                             |
| Requirement | Ollama가 실행 중이어야 하며 `ollama signin`으로 로그인되어 있어야 함                                                  |

`openclaw onboard` 또는 `openclaw configure --section web` 중에 **Ollama Web Search**를 선택하거나 다음과 같이 설정하세요:

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
전체 설정 및 동작 세부 정보는 [Ollama Web Search](/ko/tools/ollama-search)를 참조하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="레거시 OpenAI 호환 모드">
    <Warning>
    **OpenAI 호환 모드에서는 도구 호출이 신뢰할 수 없습니다.** 프록시에 OpenAI 형식이 꼭 필요하고 네이티브 도구 호출 동작에 의존하지 않는 경우에만 이 모드를 사용하세요.
    </Warning>

    대신 OpenAI 호환 엔드포인트를 사용해야 하는 경우(예: OpenAI 형식만 지원하는 프록시 뒤에 있는 경우), `api: "openai-completions"`를 명시적으로 설정하세요:

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

    이 모드는 스트리밍과 도구 호출을 동시에 지원하지 못할 수 있습니다. 모델 구성에서 `params: { streaming: false }`로 스트리밍을 비활성화해야 할 수 있습니다.

    Ollama에서 `api: "openai-completions"`를 사용할 때 OpenClaw는 기본적으로 `options.num_ctx`를 주입하므로, Ollama가 조용히 4096 컨텍스트 윈도우로 대체되지 않습니다. 프록시/업스트림이 알 수 없는 `options` 필드를 거부하는 경우 이 동작을 비활성화하세요:

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
    자동 검색된 모델의 경우, OpenClaw는 가능하면 Ollama가 보고한 컨텍스트 윈도우를 사용하고, 그렇지 않으면 OpenClaw가 사용하는 기본 Ollama 컨텍스트 윈도우로 대체합니다.

    명시적 provider 구성에서 `contextWindow`와 `maxTokens`를 재정의할 수 있습니다:

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

  <Accordion title="추론 모델">
    OpenClaw는 기본적으로 `deepseek-r1`, `reasoning`, `think` 같은 이름의 모델을 추론 가능 모델로 처리합니다.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    추가 구성은 필요하지 않습니다. OpenClaw가 자동으로 표시합니다.

  </Accordion>

  <Accordion title="모델 비용">
    Ollama는 무료이며 로컬에서 실행되므로 모든 모델 비용은 $0으로 설정됩니다. 이는 자동 검색된 모델과 수동 정의된 모델 모두에 적용됩니다.
  </Accordion>

  <Accordion title="메모리 임베딩">
    번들 Ollama Plugin은 [메모리 검색](/ko/concepts/memory)을 위한 메모리 임베딩 provider를 등록합니다. 구성된 Ollama base URL과 API 키를 사용합니다.

    | Property      | Value               |
    | ------------- | ------------------- |
    | Default model | `nomic-embed-text`  |
    | Auto-pull     | 예 — 로컬에 없으면 임베딩 모델을 자동으로 pull |

    메모리 검색 임베딩 provider로 Ollama를 선택하려면:

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
    OpenClaw의 Ollama 통합은 기본적으로 **네이티브 Ollama API**(`/api/chat`)를 사용하며, 이는 스트리밍과 도구 호출을 동시에 완전히 지원합니다. 별도의 특별한 구성은 필요하지 않습니다.

    <Tip>
    OpenAI 호환 엔드포인트를 사용해야 하는 경우 위의 "레거시 OpenAI 호환 모드" 섹션을 참조하세요. 그 모드에서는 스트리밍과 도구 호출이 동시에 동작하지 않을 수 있습니다.
    </Tip>

  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="Ollama가 감지되지 않음">
    Ollama가 실행 중인지, `OLLAMA_API_KEY`(또는 인증 프로필)를 설정했는지, 그리고 명시적인 `models.providers.ollama` 항목을 **정의하지 않았는지** 확인하세요:

    ```bash
    ollama serve
    ```

    API에 접근 가능한지도 확인하세요:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="사용 가능한 모델이 없음">
    모델이 목록에 없으면 로컬에서 모델을 pull하거나 `models.providers.ollama`에 명시적으로 정의하세요.

    ```bash
    ollama list  # 설치된 항목 확인
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 또는 다른 모델
    ```

  </Accordion>

  <Accordion title="연결 거부됨">
    Ollama가 올바른 포트에서 실행 중인지 확인하세요:

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

## 관련

<CardGroup cols={2}>
  <Card title="모델 provider" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, 모델 참조 및 장애 조치 동작 개요.
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
