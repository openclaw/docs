---
read_when:
    - Ollama를 통해 클라우드 또는 로컬 모델로 OpenClaw를 실행하려는 경우
    - Ollama 설치 및 구성 안내가 필요합니다
    - 이미지 이해를 위해 Ollama 비전 모델을 사용하려는 경우
summary: Ollama로 OpenClaw 실행하기 (클라우드 및 로컬 모델)
title: Ollama
x-i18n:
    generated_at: "2026-04-30T06:47:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw는 호스팅된 클라우드 모델과 로컬/자체 호스팅 Ollama 서버를 위해 Ollama의 네이티브 API(`/api/chat`)와 통합됩니다. Ollama는 세 가지 모드로 사용할 수 있습니다. 접근 가능한 Ollama 호스트를 통한 `Cloud + Local`, `https://ollama.com`을 대상으로 하는 `Cloud only`, 또는 접근 가능한 Ollama 호스트를 대상으로 하는 `Local only`입니다.

<Warning>
**원격 Ollama 사용자**: OpenClaw에서 `/v1` OpenAI 호환 URL(`http://host:11434/v1`)을 사용하지 마세요. 그러면 도구 호출이 깨지고 모델이 원시 도구 JSON을 일반 텍스트로 출력할 수 있습니다. 대신 네이티브 Ollama API URL을 사용하세요: `baseUrl: "http://host:11434"`(`/v1` 없음).
</Warning>

Ollama provider 구성은 `baseUrl`을 표준 키로 사용합니다. OpenClaw는 OpenAI SDK 스타일 예제와의 호환성을 위해 `baseURL`도 허용하지만, 새 구성에서는 `baseUrl`을 선호해야 합니다.

## 인증 규칙

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    로컬 및 LAN Ollama 호스트에는 실제 bearer 토큰이 필요하지 않습니다. OpenClaw는 루프백, 사설 네트워크, `.local`, 그리고 단순 호스트 이름 Ollama 기본 URL에만 로컬 `ollama-local` 마커를 사용합니다.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    원격 공개 호스트와 Ollama Cloud(`https://ollama.com`)에는 `OLLAMA_API_KEY`, 인증 프로필, 또는 provider의 `apiKey`를 통한 실제 자격 증명이 필요합니다.
  </Accordion>
  <Accordion title="Custom provider ids">
    `api: "ollama"`를 설정하는 사용자 지정 provider ID도 같은 규칙을 따릅니다. 예를 들어 사설 LAN Ollama 호스트를 가리키는 `ollama-remote` provider는 `apiKey: "ollama-local"`을 사용할 수 있으며, 하위 에이전트는 이를 누락된 자격 증명으로 처리하는 대신 Ollama provider 훅을 통해 해당 마커를 해석합니다. 메모리 검색도 `agents.defaults.memorySearch.provider`를 해당 사용자 지정 provider ID로 설정하여 임베딩이 일치하는 Ollama 엔드포인트를 사용하도록 할 수 있습니다.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json`은 provider ID의 자격 증명을 저장합니다. 엔드포인트 설정(`baseUrl`, `api`, 모델 ID, 헤더, 타임아웃)은 `models.providers.<id>`에 넣으세요. `{ "ollama-windows": { "apiKey": "ollama-local" } }` 같은 오래된 평면 인증 프로필 파일은 런타임 형식이 아닙니다. `openclaw doctor --fix`를 실행해 백업과 함께 표준 `ollama-windows:default` API 키 프로필로 다시 작성하세요. 해당 파일의 `baseUrl`은 호환성 잡음이며 provider 구성으로 옮겨야 합니다.
  </Accordion>
  <Accordion title="Memory embedding scope">
    Ollama를 메모리 임베딩에 사용할 때 bearer 인증은 선언된 호스트로 범위가 제한됩니다.

    - provider 수준 키는 해당 provider의 Ollama 호스트에만 전송됩니다.
    - `agents.*.memorySearch.remote.apiKey`는 해당 원격 임베딩 호스트에만 전송됩니다.
    - 순수한 `OLLAMA_API_KEY` 환경값은 Ollama Cloud 관례로 처리되며, 기본적으로 로컬 또는 자체 호스팅 호스트에는 전송되지 않습니다.

  </Accordion>
</AccordionGroup>

## 시작하기

선호하는 설정 방법과 모드를 선택하세요.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **가장 적합한 경우:** 작동하는 Ollama 클라우드 또는 로컬 설정으로 가는 가장 빠른 경로.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        provider 목록에서 **Ollama**를 선택하세요.
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — 로컬 Ollama 호스트와 해당 호스트를 통해 라우팅되는 클라우드 모델
        - **Cloud only** — `https://ollama.com`을 통한 호스팅 Ollama 모델
        - **Local only** — 로컬 모델만

      </Step>
      <Step title="Select a model">
        `Cloud only`는 `OLLAMA_API_KEY`를 요청하고 호스팅 클라우드 기본값을 제안합니다. `Cloud + Local`과 `Local only`는 Ollama 기본 URL을 요청하고, 사용 가능한 모델을 검색하며, 선택한 로컬 모델이 아직 없으면 자동으로 가져옵니다. Ollama가 `gemma4:latest` 같은 설치된 `:latest` 태그를 보고하면, 설정은 `gemma4`와 `gemma4:latest`를 모두 표시하거나 단순 별칭을 다시 가져오는 대신 해당 설치된 모델을 한 번만 표시합니다. `Cloud + Local`은 해당 Ollama 호스트가 클라우드 접근을 위해 로그인되어 있는지도 확인합니다.
      </Step>
      <Step title="Verify the model is available">
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

    필요하면 사용자 지정 기본 URL 또는 모델을 지정하세요.

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **가장 적합한 경우:** 클라우드 또는 로컬 설정을 완전히 제어하고 싶은 경우.

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local**: Ollama를 설치하고 `ollama signin`으로 로그인한 다음, 해당 호스트를 통해 클라우드 요청을 라우팅합니다
        - **Cloud only**: `OLLAMA_API_KEY`와 함께 `https://ollama.com`을 사용합니다
        - **Local only**: [ollama.com/download](https://ollama.com/download)에서 Ollama를 설치합니다

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        `Cloud only`의 경우 실제 `OLLAMA_API_KEY`를 사용하세요. 호스트 기반 설정에서는 어떤 자리표시자 값도 동작합니다.

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
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
    `Cloud + Local`은 접근 가능한 Ollama 호스트를 로컬 모델과 클라우드 모델 모두의 제어 지점으로 사용합니다. 이는 Ollama가 선호하는 하이브리드 흐름입니다.

    설정 중 **Cloud + Local**을 사용하세요. OpenClaw는 Ollama 기본 URL을 요청하고, 해당 호스트에서 로컬 모델을 검색하며, `ollama signin`으로 호스트가 클라우드 접근을 위해 로그인되어 있는지 확인합니다. 호스트가 로그인되어 있으면 OpenClaw는 `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud` 같은 호스팅 클라우드 기본값도 제안합니다.

    호스트가 아직 로그인되어 있지 않으면, `ollama signin`을 실행할 때까지 OpenClaw는 설정을 로컬 전용으로 유지합니다.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only`는 `https://ollama.com`의 Ollama 호스팅 API를 대상으로 실행됩니다.

    설정 중 **Cloud only**를 사용하세요. OpenClaw는 `OLLAMA_API_KEY`를 요청하고, `baseUrl: "https://ollama.com"`을 설정하며, 호스팅 클라우드 모델 목록을 초기화합니다. 이 경로에는 로컬 Ollama 서버나 `ollama signin`이 필요하지 않습니다.

    `openclaw onboard` 중 표시되는 클라우드 모델 목록은 `https://ollama.com/api/tags`에서 실시간으로 채워지며 500개 항목으로 제한됩니다. 따라서 선택기는 정적 초기 목록이 아니라 현재 호스팅 카탈로그를 반영합니다. 설정 시점에 `ollama.com`에 접근할 수 없거나 모델을 반환하지 않으면, 온보딩이 계속 완료될 수 있도록 OpenClaw는 이전의 하드코딩된 제안으로 대체합니다.

  </Tab>

  <Tab title="Local only">
    로컬 전용 모드에서 OpenClaw는 구성된 Ollama 인스턴스에서 모델을 검색합니다. 이 경로는 로컬 또는 자체 호스팅 Ollama 서버를 위한 것입니다.

    OpenClaw는 현재 `gemma4`를 로컬 기본값으로 제안합니다.

  </Tab>
</Tabs>

## 모델 검색(암시적 provider)

`OLLAMA_API_KEY`(또는 인증 프로필)를 설정하고 **`models.providers.ollama` 또는 `api: "ollama"`를 가진 다른 사용자 지정 원격 provider를 정의하지 않은 경우**, OpenClaw는 `http://127.0.0.1:11434`의 로컬 Ollama 인스턴스에서 모델을 검색합니다.

| 동작                 | 세부 정보                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 카탈로그 쿼리        | `/api/tags`를 쿼리합니다                                                                                                                                              |
| 기능 감지            | 최선의 `/api/show` 조회를 사용해 `contextWindow`, 확장된 `num_ctx` Modelfile 매개변수, 그리고 비전/도구를 포함한 기능을 읽습니다                                      |
| 비전 모델            | `/api/show`가 보고한 `vision` 기능이 있는 모델은 이미지 가능(`input: ["text", "image"]`)으로 표시되므로 OpenClaw가 이미지를 프롬프트에 자동 주입합니다                 |
| 추론 감지            | 사용 가능한 경우 `thinking`을 포함해 `/api/show` 기능을 사용합니다. Ollama가 기능을 생략하면 모델 이름 휴리스틱(`r1`, `reasoning`, `think`)으로 대체합니다             |
| 토큰 제한            | `maxTokens`를 OpenClaw가 사용하는 기본 Ollama 최대 토큰 한도로 설정합니다                                                                                              |
| 비용                 | 모든 비용을 `0`으로 설정합니다                                                                                                                                        |

이렇게 하면 로컬 Ollama 인스턴스와 카탈로그를 맞춰 유지하면서 수동 모델 항목을 피할 수 있습니다. 로컬 `infer model run`에서 `ollama/<pulled-model>:latest` 같은 전체 참조를 사용할 수 있습니다. OpenClaw는 손으로 작성한 `models.json` 항목 없이도 Ollama의 라이브 카탈로그에서 해당 설치된 모델을 해석합니다.

로그인된 Ollama 호스트의 경우 일부 `:cloud` 모델은 `/api/tags`에 나타나기 전에 `/api/chat`과 `/api/show`를 통해 사용할 수 있습니다. 전체 `ollama/<model>:cloud` 참조를 명시적으로 선택하면, OpenClaw는 `/api/show`로 정확히 그 누락된 모델을 검증하고 Ollama가 모델 메타데이터를 확인하는 경우에만 런타임 카탈로그에 추가합니다. 오타는 여전히 자동 생성되는 대신 알 수 없는 모델로 실패합니다.

```bash
# See what models are available
ollama list
openclaw models list
```

전체 에이전트 도구 표면을 피하는 좁은 텍스트 생성 스모크 테스트에는 전체 Ollama 모델 참조와 함께 로컬 `infer model run`을 사용하세요.

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

이 경로는 여전히 OpenClaw의 구성된 provider, 인증, 네이티브 Ollama 전송을 사용하지만, 채팅 에이전트 턴을 시작하거나 MCP/도구 컨텍스트를 로드하지 않습니다. 이것은 성공하지만 일반 에이전트 응답이 실패한다면, 다음으로 모델의 에이전트 프롬프트/도구 용량을 문제 해결하세요.

같은 가벼운 경로에서 좁은 비전 모델 스모크 테스트를 하려면 `infer model run`에 하나 이상의 이미지 파일을 추가하세요. 그러면 채팅 도구, 메모리 또는 이전 세션 컨텍스트를 로드하지 않고 프롬프트와 이미지를 선택한 Ollama 비전 모델로 직접 전송합니다.

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file`은 일반적인 PNG, JPEG, WebP 입력을 포함해 `image/*`로 감지되는 파일을 허용합니다. 이미지가 아닌 파일은 Ollama가 호출되기 전에 거부됩니다. 음성 인식에는 대신 `openclaw infer audio transcribe`를 사용하세요.

`/model ollama/<model>`로 대화를 전환하면 OpenClaw는 이를 정확한 사용자 선택으로 처리합니다. 구성된 Ollama `baseUrl`에 접근할 수 없으면, 다음 응답은 다른 구성된 폴백 모델에서 조용히 답하는 대신 provider 오류로 실패합니다.

격리된 Cron 작업은 agent 턴을 시작하기 전에 로컬 안전 검사를 하나 더 수행합니다. 선택된 model이 로컬, 사설 네트워크 또는 `.local` Ollama 공급자로 해석되고 `/api/tags`에 접근할 수 없으면, OpenClaw는 해당 Cron 실행을 error 텍스트에 선택된 `ollama/<model>`과 함께 `skipped`로 기록합니다. 엔드포인트 사전 검사는 5분 동안 캐시되므로, 중지된 동일한 Ollama daemon을 가리키는 여러 Cron 작업이 모두 실패하는 model 요청을 시작하지는 않습니다.

다음으로 로컬 Ollama에 대해 로컬 텍스트 경로, 네이티브 스트림 경로, embeddings를 실시간 검증하세요.

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

새 model을 추가하려면 Ollama로 pull만 하면 됩니다.

```bash
ollama pull mistral
```

새 model은 자동으로 발견되어 사용할 수 있습니다.

<Note>
`models.providers.ollama`를 명시적으로 설정하거나 `api: "ollama"`가 있는 `models.providers.ollama-cloud` 같은 사용자 지정 원격 공급자를 구성하면 자동 발견을 건너뛰며 model을 수동으로 정의해야 합니다. `http://127.0.0.2:11434` 같은 loopback 사용자 지정 공급자는 여전히 로컬로 처리됩니다. 아래의 명시적 config 섹션을 참고하세요.
</Note>

## Vision 및 이미지 설명

번들된 Ollama Plugin은 Ollama를 이미지 지원 media-understanding 공급자로 등록합니다. 이를 통해 OpenClaw는 명시적인 이미지 설명 요청과 구성된 이미지 model 기본값을 로컬 또는 호스팅된 Ollama vision model로 라우팅할 수 있습니다.

로컬 vision의 경우 이미지를 지원하는 model을 pull하세요.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

그런 다음 infer CLI로 검증하세요.

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model`은 전체 `<provider/model>` 참조여야 합니다. 이 값이 설정되면 `openclaw infer image describe`는 model이 네이티브 vision을 지원한다는 이유로 설명을 건너뛰지 않고 해당 model을 직접 실행합니다.

OpenClaw의 이미지 이해 공급자 흐름, 구성된 `agents.defaults.imageModel`, 이미지 설명 출력 형태를 원할 때는 `infer image describe`를 사용하세요. 사용자 지정 prompt와 하나 이상의 이미지로 원시 multimodal model probe를 원할 때는 `infer model run --file`을 사용하세요.

Ollama를 인바운드 media의 기본 이미지 이해 model로 만들려면 `agents.defaults.imageModel`을 구성하세요.

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

전체 `ollama/<model>` 참조를 선호하세요. 동일한 model이 `models.providers.ollama.models` 아래에 `input: ["text", "image"]`로 나열되어 있고 구성된 다른 이미지 공급자가 해당 bare model ID를 노출하지 않으면, OpenClaw는 `qwen2.5vl:7b` 같은 bare `imageModel` 참조도 `ollama/qwen2.5vl:7b`로 정규화합니다. 구성된 이미지 공급자가 둘 이상 동일한 bare ID를 갖고 있다면 공급자 접두사를 명시적으로 사용하세요.

느린 로컬 vision model에는 cloud model보다 더 긴 이미지 이해 timeout이 필요할 수 있습니다. 또한 제약된 하드웨어에서 Ollama가 광고된 전체 vision context를 할당하려고 할 때 crash되거나 중지될 수도 있습니다. 일반적인 이미지 설명 턴만 필요한 경우 capability timeout을 설정하고 model 항목에서 `num_ctx`를 제한하세요.

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

이 timeout은 인바운드 이미지 이해와 agent가 턴 중 호출할 수 있는 명시적인 `image` tool에 적용됩니다. 공급자 수준의 `models.providers.ollama.timeoutSeconds`는 일반 model 호출에 대한 기본 Ollama HTTP 요청 guard를 계속 제어합니다.

다음으로 로컬 Ollama에 대해 명시적 이미지 tool을 실시간 검증하세요.

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models`를 수동으로 정의하는 경우 vision model에 이미지 입력 지원을 표시하세요.

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw는 image-capable로 표시되지 않은 model에 대한 이미지 설명 요청을 거부합니다. 암시적 발견을 사용하는 경우 OpenClaw는 `/api/show`가 vision capability를 보고할 때 Ollama에서 이를 읽습니다.

## 구성

<Tabs>
  <Tab title="기본 (암시적 발견)">
    가장 간단한 로컬 전용 활성화 경로는 environment variable을 사용하는 것입니다.

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY`가 설정되어 있으면 공급자 항목에서 `apiKey`를 생략할 수 있으며, OpenClaw가 availability check를 위해 이를 채웁니다.
    </Tip>

  </Tab>

  <Tab title="명시적 (수동 model)">
    호스팅된 cloud 설정을 원하거나, Ollama가 다른 host/port에서 실행되거나, 특정 context window 또는 model 목록을 강제하려는 경우, 또는 완전히 수동인 model 정의를 원하는 경우 명시적 config를 사용하세요.

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

  <Tab title="사용자 지정 base URL">
    Ollama가 다른 host 또는 port에서 실행 중인 경우(명시적 config는 자동 발견을 비활성화하므로 model을 수동으로 정의하세요):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    URL에 `/v1`을 추가하지 마세요. `/v1` 경로는 OpenAI-compatible mode를 사용하며, 이 모드에서는 tool calling이 신뢰할 수 없습니다. 경로 suffix가 없는 기본 Ollama URL을 사용하세요.
    </Warning>

  </Tab>
</Tabs>

## 일반적인 레시피

이를 시작점으로 사용하고 model ID를 `ollama list` 또는 `openclaw models list --provider ollama`의 정확한 이름으로 교체하세요.

<AccordionGroup>
  <Accordion title="자동 발견을 사용하는 로컬 model">
    Ollama가 Gateway와 같은 machine에서 실행되고 OpenClaw가 설치된 model을 자동으로 발견하도록 하려면 이 방법을 사용하세요.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    이 경로는 config를 최소화합니다. model을 수동으로 정의하려는 경우가 아니라면 `models.providers.ollama` block을 추가하지 마세요.

  </Accordion>

  <Accordion title="수동 model을 사용하는 LAN Ollama host">
    LAN host에는 네이티브 Ollama URL을 사용하세요. `/v1`을 추가하지 마세요.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow`는 OpenClaw 쪽 context budget입니다. `params.num_ctx`는 요청을 위해 Ollama로 전송됩니다. 하드웨어가 model의 광고된 전체 context를 실행할 수 없을 때는 둘을 맞춰 두세요.

  </Accordion>

  <Accordion title="Ollama Cloud만 사용">
    로컬 daemon을 실행하지 않고 호스팅된 Ollama model을 직접 사용하려는 경우 이 방법을 사용하세요.

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

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
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="로그인된 daemon을 통한 cloud 및 local">
    로컬 또는 LAN Ollama daemon이 `ollama signin`으로 로그인되어 있고 로컬 model과 `:cloud` model을 모두 제공해야 하는 경우 이 방법을 사용하세요.

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="여러 Ollama host">
    Ollama server가 둘 이상이면 사용자 지정 공급자 ID를 사용하세요. 각 공급자는 자체 host, model, auth, timeout, model 참조를 갖습니다.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    OpenClaw가 요청을 보낼 때 active 공급자 접두사는 제거되므로 `ollama-large/qwen3.5:27b`는 Ollama에 `qwen3.5:27b`로 도달합니다.

  </Accordion>

  <Accordion title="가벼운 로컬 model profile">
    일부 로컬 model은 간단한 prompt에는 답할 수 있지만 전체 agent tool surface에서는 어려움을 겪을 수 있습니다. 전역 runtime 설정을 변경하기 전에 먼저 tool과 context를 제한하는 것부터 시작하세요.

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    모델이나 서버가 도구 스키마에서 안정적으로 실패하는 경우에만 `compat.supportsTools: false`를 사용하세요. 이는 안정성을 위해 에이전트 기능을 줄입니다.
    `localModelLean`은 에이전트 표면에서 브라우저, Cron, 메시지 도구를 제거하지만, Ollama의 런타임 컨텍스트나 사고 모드를 변경하지는 않습니다. 반복 실행되거나 숨겨진 추론에 응답 예산을 소비하는 작은 Qwen 스타일 사고 모델에는 명시적인 `params.num_ctx` 및 `params.thinking: false`와 함께 사용하세요.

  </Accordion>
</AccordionGroup>

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

사용자 지정 Ollama 제공자 ID도 지원됩니다. 모델 참조가 `ollama-spark/qwen3:32b`처럼 활성 제공자 접두사를 사용하는 경우, OpenClaw는 Ollama를 호출하기 전에 해당 접두사만 제거하므로 서버는 `qwen3:32b`를 받습니다.

느린 로컬 모델의 경우 전체 에이전트 런타임 시간 제한을 늘리기 전에 제공자 범위 요청 조정을 우선 사용하세요.

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds`는 연결 설정, 헤더, 본문 스트리밍, 전체 보호된 fetch 중단을 포함한 모델 HTTP 요청에 적용됩니다. `params.keep_alive`는 네이티브 `/api/chat` 요청에서 최상위 `keep_alive`로 Ollama에 전달됩니다. 첫 번째 턴 로드 시간이 병목인 경우 모델별로 설정하세요.

### 빠른 확인

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

원격 호스트의 경우 `127.0.0.1`을 `baseUrl`에 사용된 호스트로 바꾸세요. `curl`은 작동하지만 OpenClaw가 작동하지 않는다면 Gateway가 다른 머신, 컨테이너 또는 서비스 계정에서 실행되는지 확인하세요.

## Ollama 웹 검색

OpenClaw는 번들 `web_search` 제공자로 **Ollama 웹 검색**을 지원합니다.

| 속성        | 세부 정보                                                                                                                                                            |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 호스트      | 구성된 Ollama 호스트를 사용합니다(`models.providers.ollama.baseUrl`이 설정된 경우 해당 값, 그렇지 않으면 `http://127.0.0.1:11434`). `https://ollama.com`은 호스팅 API를 직접 사용합니다 |
| 인증        | 로그인된 로컬 Ollama 호스트에서는 키가 필요 없습니다. 직접 `https://ollama.com` 검색 또는 인증으로 보호된 호스트에는 `OLLAMA_API_KEY` 또는 구성된 제공자 인증이 필요합니다 |
| 요구 사항   | 로컬/셀프 호스팅 호스트는 실행 중이어야 하며 `ollama signin`으로 로그인되어 있어야 합니다. 직접 호스팅 검색에는 `baseUrl: "https://ollama.com"`과 실제 Ollama API 키가 필요합니다 |

`openclaw onboard` 또는 `openclaw configure --section web` 중에 **Ollama 웹 검색**을 선택하거나 다음을 설정하세요.

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

Ollama Cloud를 통한 직접 호스팅 검색의 경우:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

로그인된 로컬 데몬의 경우 OpenClaw는 데몬의 `/api/experimental/web_search` 프록시를 사용합니다. `https://ollama.com`의 경우 호스팅된 `/api/web_search` 엔드포인트를 직접 호출합니다.

<Note>
전체 설정 및 동작 세부 정보는 [Ollama 웹 검색](/ko/tools/ollama-search)을 참조하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="레거시 OpenAI 호환 모드">
    <Warning>
    **OpenAI 호환 모드에서는 도구 호출이 안정적이지 않습니다.** 프록시에 OpenAI 형식이 필요하고 네이티브 도구 호출 동작에 의존하지 않는 경우에만 이 모드를 사용하세요.
    </Warning>

    대신 OpenAI 호환 엔드포인트를 사용해야 하는 경우(예: OpenAI 형식만 지원하는 프록시 뒤에서) `api: "openai-completions"`를 명시적으로 설정하세요.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    이 모드는 스트리밍과 도구 호출을 동시에 지원하지 않을 수 있습니다. 모델 구성에서 `params: { streaming: false }`로 스트리밍을 비활성화해야 할 수 있습니다.

    Ollama와 함께 `api: "openai-completions"`를 사용할 때 OpenClaw는 기본적으로 `options.num_ctx`를 주입하므로 Ollama가 조용히 4096 컨텍스트 윈도로 되돌아가지 않습니다. 프록시/업스트림이 알 수 없는 `options` 필드를 거부하는 경우 이 동작을 비활성화하세요.

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
    자동 발견된 모델의 경우, OpenClaw는 사용할 수 있을 때 Ollama가 보고한 컨텍스트 윈도를 사용합니다. 여기에는 사용자 지정 Modelfile의 더 큰 `PARAMETER num_ctx` 값도 포함됩니다. 그렇지 않으면 OpenClaw가 사용하는 기본 Ollama 컨텍스트 윈도로 대체됩니다.

    해당 Ollama 제공자 아래의 모든 모델에 대해 제공자 수준 `contextWindow`, `contextTokens`, `maxTokens` 기본값을 설정한 다음, 필요할 때 모델별로 재정의할 수 있습니다. `contextWindow`는 OpenClaw의 프롬프트 및 Compaction 예산입니다. 네이티브 Ollama 요청은 `params.num_ctx`를 명시적으로 구성하지 않는 한 `options.num_ctx`를 설정하지 않으므로 Ollama는 자체 모델, `OLLAMA_CONTEXT_LENGTH` 또는 VRAM 기반 기본값을 적용할 수 있습니다. Modelfile을 다시 빌드하지 않고 Ollama의 요청별 런타임 컨텍스트를 제한하거나 강제하려면 `params.num_ctx`를 설정하세요. 유효하지 않거나, 0이거나, 음수이거나, 유한하지 않은 값은 무시됩니다. OpenAI 호환 Ollama 어댑터는 여전히 구성된 `params.num_ctx` 또는 `contextWindow`에서 기본적으로 `options.num_ctx`를 주입합니다. 업스트림이 `options`를 거부하는 경우 `injectNumCtxForOpenAICompat: false`로 이를 비활성화하세요.

    네이티브 Ollama 모델 항목은 `params` 아래에 `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread`, `use_mmap`을 포함한 일반적인 Ollama 런타임 옵션도 허용합니다. OpenClaw는 Ollama 요청 키만 전달하므로 `streaming` 같은 OpenClaw 런타임 params는 Ollama로 누출되지 않습니다. 최상위 Ollama `think`를 보내려면 `params.think` 또는 `params.thinking`을 사용하세요. `false`는 Qwen 스타일 사고 모델의 API 수준 사고를 비활성화합니다.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    모델별 `agents.defaults.models["ollama/<model>"].params.num_ctx`도 작동합니다. 둘 다 구성된 경우 명시적인 제공자 모델 항목이 에이전트 기본값보다 우선합니다.

  </Accordion>

  <Accordion title="사고 제어">
    네이티브 Ollama 모델의 경우 OpenClaw는 Ollama가 기대하는 방식으로 사고 제어를 전달합니다. 즉 `options.think`가 아니라 최상위 `think`입니다. `/api/show` 응답에 `thinking` 기능이 포함된 자동 발견 모델은 `/think low`, `/think medium`, `/think high`, `/think max`를 노출합니다. 사고 모델이 아닌 경우 `/think off`만 노출합니다.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    모델 기본값도 설정할 수 있습니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    모델별 `params.think` 또는 `params.thinking`은 특정 구성 모델에 대해 Ollama API 사고를 비활성화하거나 강제할 수 있습니다. 활성 실행에 암시적 기본값 `off`만 있는 경우 OpenClaw는 이러한 명시적 모델 params를 보존합니다. `/think medium` 같은 off가 아닌 런타임 명령은 여전히 활성 실행을 재정의합니다.

  </Accordion>

  <Accordion title="추론 모델">
    OpenClaw는 `deepseek-r1`, `reasoning`, `think` 같은 이름의 모델을 기본적으로 추론 가능 모델로 취급합니다.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    추가 구성은 필요하지 않습니다. OpenClaw가 자동으로 표시합니다.

  </Accordion>

  <Accordion title="모델 비용">
    Ollama는 무료이며 로컬에서 실행되므로 모든 모델 비용은 $0으로 설정됩니다. 이는 자동 발견 모델과 수동 정의 모델 모두에 적용됩니다.
  </Accordion>

  <Accordion title="메모리 임베딩">
    번들 Ollama Plugin은 [메모리 검색](/ko/concepts/memory)을 위한 메모리 임베딩 제공자를 등록합니다. 구성된 Ollama 기본 URL과 API 키를 사용하고, Ollama의 현재 `/api/embed` 엔드포인트를 호출하며, 가능할 때 여러 메모리 청크를 하나의 `input` 요청으로 배치 처리합니다.

    | 속성        | 값                  |
    | ----------- | ------------------- |
    | 기본 모델   | `nomic-embed-text`  |
    | 자동 pull   | 예 — 임베딩 모델이 로컬에 없으면 자동으로 pull됩니다 |

    쿼리 시점 임베딩은 `nomic-embed-text`, `qwen3-embedding`, `mxbai-embed-large`를 포함하여 접두사가 필요하거나 권장되는 모델에 검색 접두사를 사용합니다. 메모리 문서 배치는 기존 인덱스에 형식 마이그레이션이 필요하지 않도록 원시 상태를 유지합니다.

    Ollama를 메모리 검색 임베딩 제공자로 선택하려면:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    원격 임베딩 호스트의 경우 인증을 해당 호스트 범위로 유지하세요.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="스트리밍 구성">
    OpenClaw의 Ollama 통합은 기본적으로 스트리밍과 도구 호출을 동시에 완전히 지원하는 **네이티브 Ollama API**(`/api/chat`)를 사용합니다. 특별한 구성이 필요하지 않습니다.

    네이티브 `/api/chat` 요청의 경우 OpenClaw는 사고 제어도 Ollama에 직접 전달합니다. `/think off`와 `openclaw agent --thinking off`는 명시적인 모델 `params.think`/`params.thinking` 값이 구성되어 있지 않은 한 최상위 `think: false`를 보내며, `/think low|medium|high`는 일치하는 최상위 `think` 노력 문자열을 보냅니다. `/think max`는 Ollama의 가장 높은 네이티브 노력 수준인 `think: "high"`에 매핑됩니다.

    <Tip>
    OpenAI 호환 엔드포인트를 사용해야 하는 경우 위의 "레거시 OpenAI 호환 모드" 섹션을 참조하세요. 해당 모드에서는 스트리밍과 도구 호출이 동시에 작동하지 않을 수 있습니다.
    </Tip>

  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="WSL2 크래시 루프(반복 재부팅)">
    NVIDIA/CUDA가 있는 WSL2에서 공식 Ollama Linux 설치 프로그램은 `Restart=always`가 있는 `ollama.service` systemd 유닛을 만듭니다. 이 서비스가 자동 시작되고 WSL2 부팅 중 GPU 기반 모델을 로드하면, Ollama가 모델을 로드하는 동안 호스트 메모리를 고정할 수 있습니다. Hyper-V 메모리 회수는 이러한 고정 페이지를 항상 회수할 수 없으므로 Windows가 WSL2 VM을 종료하고, systemd가 Ollama를 다시 시작하며, 이 루프가 반복될 수 있습니다.

    일반적인 증거:

    - Windows 측에서 반복되는 WSL2 재부팅 또는 종료
    - WSL2 시작 직후 `app.slice` 또는 `ollama.service`의 높은 CPU 사용량
    - Linux OOM-killer 이벤트가 아니라 systemd에서 발생한 SIGTERM

    OpenClaw는 WSL2, `Restart=always`로 활성화된 `ollama.service`, 그리고 표시되는 CUDA 마커를 감지하면 시작 경고를 기록합니다.

    완화 방법:

    ```bash
    sudo systemctl disable ollama
    ```

    Windows 측의 `%USERPROFILE%\.wslconfig`에 다음을 추가한 다음 `wsl --shutdown`을 실행하세요.

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ollama 서비스 환경에서 더 짧은 keep-alive를 설정하거나, 필요할 때만 Ollama를 수동으로 시작하세요.

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)을 참조하세요.

  </Accordion>

  <Accordion title="Ollama가 감지되지 않음">
    Ollama가 실행 중이고 `OLLAMA_API_KEY`(또는 인증 프로필)를 설정했으며, 명시적인 `models.providers.ollama` 항목을 정의하지 **않았는지** 확인하세요.

    ```bash
    ollama serve
    ```

    API에 접근할 수 있는지 확인하세요.

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="사용 가능한 모델 없음">
    모델이 목록에 없으면 모델을 로컬로 가져오거나 `models.providers.ollama`에 명시적으로 정의하세요.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="연결 거부됨">
    Ollama가 올바른 포트에서 실행 중인지 확인하세요.

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="원격 호스트는 curl로 작동하지만 OpenClaw에서는 작동하지 않음">
    Gateway를 실행하는 동일한 머신과 런타임에서 확인하세요.

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    일반적인 원인:

    - `baseUrl`이 `localhost`를 가리키지만 Gateway가 Docker 또는 다른 호스트에서 실행됩니다.
    - URL이 `/v1`을 사용하여 네이티브 Ollama 대신 OpenAI 호환 동작을 선택합니다.
    - 원격 호스트에서 Ollama 측 방화벽 또는 LAN 바인딩 변경이 필요합니다.
    - 모델이 노트북의 데몬에는 있지만 원격 데몬에는 없습니다.

  </Accordion>

  <Accordion title="모델이 도구 JSON을 텍스트로 출력함">
    이는 일반적으로 provider가 OpenAI 호환 모드를 사용 중이거나 모델이 도구 스키마를 처리할 수 없다는 뜻입니다.

    네이티브 Ollama 모드를 선호하세요.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    작은 로컬 모델이 여전히 도구 스키마에서 실패하면 해당 모델 항목에 `compat.supportsTools: false`를 설정하고 다시 테스트하세요.

  </Accordion>

  <Accordion title="Kimi 또는 GLM이 깨진 기호를 반환함">
    길고 언어적이지 않은 기호 나열로 된 호스팅 Kimi/GLM 응답은 성공적인 어시스턴트 답변이 아니라 실패한 provider 출력으로 처리됩니다. 이렇게 하면 손상된 텍스트를 세션에 유지하지 않고 일반적인 재시도, 폴백 또는 오류 처리가 이어질 수 있습니다.

    반복해서 발생하면 원시 모델 이름, 현재 세션 파일, 실행이 `Cloud + Local`을 사용했는지 `Cloud only`를 사용했는지 캡처한 다음 새 세션과 폴백 모델을 시도하세요.

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="콜드 로컬 모델 시간 초과">
    큰 로컬 모델은 스트리밍이 시작되기 전에 긴 최초 로드 시간이 필요할 수 있습니다. 시간 초과를 Ollama provider로 제한하고, 선택적으로 Ollama에 턴 사이에 모델을 로드된 상태로 유지하도록 요청하세요.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    호스트 자체가 연결을 수락하는 데 느린 경우, `timeoutSeconds`는 이 provider에 대해 보호되는 Undici 연결 시간 초과도 연장합니다.

  </Accordion>

  <Accordion title="큰 컨텍스트 모델이 너무 느리거나 메모리가 부족함">
    많은 Ollama 모델은 하드웨어에서 편안하게 실행할 수 있는 것보다 더 큰 컨텍스트를 표시합니다. 네이티브 Ollama는 `params.num_ctx`를 설정하지 않는 한 Ollama 자체 런타임 컨텍스트 기본값을 사용합니다. 예측 가능한 첫 토큰 지연 시간을 원할 때는 OpenClaw의 예산과 Ollama의 요청 컨텍스트를 모두 제한하세요.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw가 너무 많은 프롬프트를 보내는 경우 먼저 `contextWindow`를 낮추세요. Ollama가 머신에 비해 너무 큰 런타임 컨텍스트를 로드하는 경우 `params.num_ctx`를 낮추세요. 생성이 너무 오래 실행되는 경우 `maxTokens`를 낮추세요.

  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [문제 해결](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq).
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 provider" href="/ko/concepts/model-providers" icon="layers">
    모든 provider, 모델 참조, 장애 조치 동작 개요입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법입니다.
  </Card>
  <Card title="Ollama 웹 검색" href="/ko/tools/ollama-search" icon="magnifying-glass">
    Ollama 기반 웹 검색을 위한 전체 설정 및 동작 세부 정보입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 구성 참조입니다.
  </Card>
</CardGroup>
