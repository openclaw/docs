---
read_when:
    - Ollama를 통해 클라우드 또는 로컬 모델로 OpenClaw를 실행하고 싶습니다
    - Ollama 설정 및 구성 가이드가 필요합니다
    - 이미지 이해용 Ollama 비전 모델을 원합니다
summary: Ollama로 OpenClaw 실행하기 (클라우드 및 로컬 모델)
title: Ollama
x-i18n:
    generated_at: "2026-04-24T06:31:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9595459cc32ff81332b09a81388f84059f48e86039170078fd7f30ccd9b4e1f5
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw는 Ollama의 네이티브 API(`/api/chat`)를 통해 호스팅된 클라우드 모델과 로컬/셀프 호스팅 Ollama 서버를 통합합니다. Ollama는 세 가지 모드로 사용할 수 있습니다: 접근 가능한 Ollama 호스트를 통한 `Cloud + Local`, `https://ollama.com`에 대한 `Cloud only`, 접근 가능한 Ollama 호스트에 대한 `Local only`.

<Warning>
**원격 Ollama 사용자**: OpenClaw와 함께 `/v1` OpenAI 호환 URL (`http://host:11434/v1`)을 사용하지 마세요. 이렇게 하면 도구 호출이 깨지고 모델이 원시 도구 JSON을 일반 텍스트로 출력할 수 있습니다. 대신 네이티브 Ollama API URL을 사용하세요: `baseUrl: "http://host:11434"` (`/v1` 없음).
</Warning>

## 시작하기

원하는 설정 방법과 모드를 선택하세요.

<Tabs>
  <Tab title="온보딩 (권장)">
    **적합한 경우:** 가장 빠르게 동작하는 Ollama 클라우드 또는 로컬 설정을 만들고 싶을 때.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard
        ```

        provider 목록에서 **Ollama**를 선택하세요.
      </Step>
      <Step title="모드 선택">
        - **Cloud + Local** — 로컬 Ollama 호스트와, 해당 호스트를 통해 라우팅되는 클라우드 모델
        - **Cloud only** — `https://ollama.com`을 통한 호스팅 Ollama 모델
        - **Local only** — 로컬 모델만 사용

      </Step>
      <Step title="모델 선택">
        `Cloud only`는 `OLLAMA_API_KEY`를 요청하고 호스팅된 클라우드 기본값을 제안합니다. `Cloud + Local`과 `Local only`는 Ollama base URL을 요청하고, 사용 가능한 모델을 확인하며, 아직 선택된 로컬 모델이 없으면 자동으로 pull합니다. `Cloud + Local`은 해당 Ollama 호스트가 클라우드 접근용으로 로그인되어 있는지도 확인합니다.
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

    선택적으로 커스텀 base URL 또는 모델을 지정할 수 있습니다:

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
      <Step title="로컬 모델 pull (로컬 전용)">
        ```bash
        ollama pull gemma4
        # 또는
        ollama pull gpt-oss:20b
        # 또는
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClaw에 Ollama 활성화">
        `Cloud only`에서는 실제 `OLLAMA_API_KEY`를 사용하세요. 호스트 기반 설정에서는 아무 placeholder 값이나 동작합니다:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # 또는 구성 파일에 설정
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="모델 확인 및 설정">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        또는 기본값을 구성에 설정:

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
    `Cloud + Local`은 접근 가능한 Ollama 호스트를 로컬 및 클라우드 모델 모두의 제어 지점으로 사용합니다. 이것이 Ollama가 선호하는 하이브리드 흐름입니다.

    설정 중 **Cloud + Local**을 사용하세요. OpenClaw는 Ollama base URL을 요청하고, 해당 호스트의 로컬 모델을 확인하며, `ollama signin`으로 클라우드 접근용 로그인 여부를 확인합니다. 호스트가 로그인되어 있으면 OpenClaw는 `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud` 같은 호스팅 클라우드 기본값도 제안합니다.

    호스트가 아직 로그인되지 않았다면, `ollama signin`을 실행할 때까지 OpenClaw는 설정을 로컬 전용으로 유지합니다.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only`는 Ollama의 호스팅 API `https://ollama.com`에 대해 실행됩니다.

    설정 중 **Cloud only**를 사용하세요. OpenClaw는 `OLLAMA_API_KEY`를 요청하고, `baseUrl: "https://ollama.com"`을 설정하며, 호스팅된 클라우드 모델 목록을 시드합니다. 이 경로는 로컬 Ollama 서버나 `ollama signin`이 **필요하지 않습니다**.

    `openclaw onboard` 중에 표시되는 클라우드 모델 목록은 `https://ollama.com/api/tags`에서 실시간으로 채워지며, 최대 500개 항목으로 제한되므로 정적인 시드가 아닌 현재 호스팅 카탈로그를 반영합니다. 설정 시점에 `ollama.com`에 접근할 수 없거나 모델을 반환하지 않으면, OpenClaw는 이전의 하드코딩된 제안으로 폴백하여 온보딩이 계속 완료되도록 합니다.

  </Tab>

  <Tab title="Local only">
    로컬 전용 모드에서 OpenClaw는 구성된 Ollama 인스턴스에서 모델을 확인합니다. 이 경로는 로컬 또는 셀프 호스팅 Ollama 서버용입니다.

    OpenClaw는 현재 로컬 기본값으로 `gemma4`를 제안합니다.

  </Tab>
</Tabs>

## 모델 확인(암시적 provider)

`OLLAMA_API_KEY`(또는 인증 프로필)를 설정하고 **`models.providers.ollama`를 정의하지 않으면**, OpenClaw는 `http://127.0.0.1:11434`의 로컬 Ollama 인스턴스에서 모델을 확인합니다.

| 동작                 | 세부 정보                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 카탈로그 질의        | `/api/tags` 질의                                                                                                                                                      |
| capability 감지      | `contextWindow`를 읽고 capability(비전 포함)를 감지하기 위해 best-effort `/api/show` 조회 사용                                                                        |
| 비전 모델            | `/api/show`에서 `vision` capability를 보고한 모델은 이미지 가능(`input: ["text", "image"]`)으로 표시되므로 OpenClaw가 이미지를 프롬프트에 자동 주입합니다            |
| 추론 감지            | 모델 이름 휴리스틱(`r1`, `reasoning`, `think`)으로 `reasoning`을 표시                                                                                                 |
| 토큰 제한            | OpenClaw가 사용하는 기본 Ollama 최대 토큰 상한으로 `maxTokens` 설정                                                                                                   |
| 비용                 | 모든 비용을 `0`으로 설정                                                                                                                                              |

이렇게 하면 로컬 Ollama 인스턴스와 카탈로그를 일치시키면서 수동 모델 항목 작성을 피할 수 있습니다.

```bash
# 사용 가능한 모델 확인
ollama list
openclaw models list
```

새 모델을 추가하려면 Ollama로 pull하기만 하면 됩니다:

```bash
ollama pull mistral
```

새 모델은 자동으로 확인되어 사용할 수 있게 됩니다.

<Note>
`models.providers.ollama`를 명시적으로 설정하면 자동 확인은 건너뛰고, 모델을 수동으로 정의해야 합니다. 아래 명시적 구성 섹션을 참조하세요.
</Note>

## 비전 및 이미지 설명

번들된 Ollama Plugin은 Ollama를 이미지 가능 미디어 이해 provider로 등록합니다. 이를 통해 OpenClaw는 명시적 이미지 설명 요청과 구성된 이미지 모델 기본값을 로컬 또는 호스팅된 Ollama 비전 모델을 통해 라우팅할 수 있습니다.

로컬 비전을 위해서는 이미지를 지원하는 모델을 pull하세요:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

그다음 infer CLI로 확인하세요:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model`은 전체 `<provider/model>` ref여야 합니다. 이 값이 설정되면
`openclaw infer image describe`는 이미지 지원 때문에 설명을 건너뛰는 대신 해당 모델을 직접 실행합니다.

수신 미디어의 기본 이미지 이해 모델로 Ollama를 사용하려면 `agents.defaults.imageModel`을 구성하세요:

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

`models.providers.ollama.models`를 수동으로 정의한다면, 비전 모델에 이미지 입력 지원을 표시하세요:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw는 이미지 가능으로 표시되지 않은 모델에 대한 이미지 설명 요청을 거부합니다. 암시적 확인에서는 `/api/show`가 비전 capability를 보고할 때 OpenClaw가 이를 읽습니다.

## 구성

<Tabs>
  <Tab title="기본 (암시적 확인)">
    가장 간단한 로컬 전용 활성화 경로는 환경 변수를 사용하는 것입니다:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY`가 설정되어 있으면 provider 항목에서 `apiKey`를 생략해도 OpenClaw가 가용성 확인용으로 채워 넣을 수 있습니다.
    </Tip>

  </Tab>

  <Tab title="명시적 (수동 모델)">
    호스팅된 클라우드 설정, 다른 호스트/포트에서 실행되는 Ollama, 특정 context window나 모델 목록 강제, 또는 완전 수동 모델 정의가 필요할 때는 명시적 구성을 사용하세요.

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

  <Tab title="커스텀 base URL">
    Ollama가 다른 호스트나 포트에서 실행 중인 경우(명시적 구성은 자동 확인을 비활성화하므로 모델도 수동으로 정의해야 함):

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
    URL에 `/v1`를 추가하지 마세요. `/v1` 경로는 OpenAI 호환 모드를 사용하며, 여기서는 도구 호출이 신뢰할 수 없습니다. 경로 접미사 없이 기본 Ollama URL을 사용하세요.
    </Warning>

  </Tab>
</Tabs>

### 모델 선택

구성이 끝나면 모든 Ollama 모델을 사용할 수 있습니다:

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

| 속성        | 세부 정보                                                                                                             |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| 호스트      | 구성된 Ollama 호스트를 사용함(`models.providers.ollama.baseUrl`이 설정되면 그것, 아니면 `http://127.0.0.1:11434`) |
| 인증        | 키 불필요                                                                                                             |
| 요구 사항   | Ollama가 실행 중이어야 하고 `ollama signin`으로 로그인되어 있어야 함                                                  |

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
전체 설정과 동작 세부 정보는 [Ollama Web Search](/ko/tools/ollama-search)를 참조하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="레거시 OpenAI 호환 모드">
    <Warning>
    **OpenAI 호환 모드에서는 도구 호출이 신뢰할 수 없습니다.** 프록시에 OpenAI 형식이 필요하고 네이티브 도구 호출 동작에 의존하지 않는 경우에만 이 모드를 사용하세요.
    </Warning>

    대신 OpenAI 호환 엔드포인트를 사용해야 하는 경우(예: OpenAI 형식만 지원하는 프록시 뒤에 있을 때), `api: "openai-completions"`를 명시적으로 설정하세요:

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

    이 모드는 스트리밍과 도구 호출을 동시에 지원하지 않을 수 있습니다. 모델 구성의 `params: { streaming: false }`로 스트리밍을 비활성화해야 할 수도 있습니다.

    Ollama와 함께 `api: "openai-completions"`를 사용하면, OpenClaw는 기본적으로 `options.num_ctx`를 주입하여 Ollama가 조용히 4096 컨텍스트 윈도로 폴백하지 않도록 합니다. 프록시/업스트림이 알 수 없는 `options` 필드를 거부한다면 이 동작을 비활성화하세요:

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

  <Accordion title="컨텍스트 윈도">
    자동 확인된 모델의 경우, OpenClaw는 가능하면 Ollama가 보고한 컨텍스트 윈도를 사용하고, 그렇지 않으면 OpenClaw가 사용하는 기본 Ollama 컨텍스트 윈도로 폴백합니다.

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
    OpenClaw는 `deepseek-r1`, `reasoning`, `think` 같은 이름을 가진 모델을 기본적으로 추론 가능 모델로 취급합니다.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    추가 구성은 필요하지 않습니다 -- OpenClaw가 이를 자동으로 표시합니다.

  </Accordion>

  <Accordion title="모델 비용">
    Ollama는 무료이며 로컬에서 실행되므로 모든 모델 비용은 $0으로 설정됩니다. 이는 자동 확인된 모델과 수동 정의된 모델 모두에 적용됩니다.
  </Accordion>

  <Accordion title="메모리 임베딩">
    번들된 Ollama Plugin은 [메모리 검색](/ko/concepts/memory)을 위한 메모리 임베딩 provider를 등록합니다. 구성된 Ollama base URL과 API 키를 사용합니다.

    | 속성          | 값                  |
    | ------------- | ------------------- |
    | 기본 모델     | `nomic-embed-text`  |
    | 자동 pull     | 예 — 로컬에 없으면 임베딩 모델을 자동으로 pull함 |

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
    OpenClaw의 Ollama 통합은 기본적으로 **네이티브 Ollama API** (`/api/chat`)를 사용하며, 이 방식은 스트리밍과 도구 호출을 동시에 완전히 지원합니다. 특별한 구성이 필요하지 않습니다.

    네이티브 `/api/chat` 요청의 경우, OpenClaw는 thinking 제어도 직접 Ollama로 전달합니다: `/think off`와 `openclaw agent --thinking off`는 최상위 `think: false`를 보내고, `off`가 아닌 thinking level은 `think: true`를 보냅니다.

    <Tip>
    OpenAI 호환 엔드포인트를 사용해야 한다면 위의 "레거시 OpenAI 호환 모드" 섹션을 참조하세요. 그 모드에서는 스트리밍과 도구 호출이 동시에 동작하지 않을 수 있습니다.
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

    API에 접근할 수 있는지 확인:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="사용 가능한 모델이 없음">
    모델이 목록에 없으면, 모델을 로컬로 pull하거나 `models.providers.ollama`에 명시적으로 정의하세요.

    ```bash
    ollama list  # 설치된 모델 보기
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
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, 모델 참조, failover 동작 개요.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법.
  </Card>
  <Card title="Ollama Web Search" href="/ko/tools/ollama-search" icon="magnifying-glass">
    Ollama 기반 웹 검색의 전체 설정과 동작 세부 정보.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 구성 참조.
  </Card>
</CardGroup>
