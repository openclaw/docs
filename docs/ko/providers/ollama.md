---
read_when:
    - Ollama를 통해 클라우드 또는 로컬 모델로 OpenClaw를 실행하려는 경우
    - Ollama 설정 및 구성 안내가 필요합니다
    - 이미지 이해를 위해 Ollama 비전 모델을 사용하려는 경우
summary: Ollama(클라우드 및 로컬 모델)로 OpenClaw 실행
title: Ollama
x-i18n:
    generated_at: "2026-07-01T05:34:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw는 호스팅 클라우드 모델과 로컬/셀프 호스팅 Ollama 서버를 위해 Ollama의 네이티브 API(`/api/chat`)와 통합됩니다. Ollama는 세 가지 모드로 사용할 수 있습니다. 연결 가능한 Ollama 호스트를 통한 `Cloud + Local`, `https://ollama.com`을 대상으로 하는 `Cloud only`, 또는 연결 가능한 Ollama 호스트를 대상으로 하는 `Local only`입니다.

OpenClaw는 직접 Ollama Cloud를 사용할 수 있도록 `ollama-cloud`를 일급 호스팅 provider id로도 등록합니다. 로컬 `ollama` provider id를 공유하지 않고 클라우드 전용 라우팅을 원할 때는 `ollama-cloud/kimi-k2.5:cloud` 같은 참조를 사용하세요.

전용 클라우드 전용 설정 페이지는 [Ollama Cloud](/ko/providers/ollama-cloud)를 참고하세요.

<Warning>
**원격 Ollama 사용자**: OpenClaw에서 `/v1` OpenAI 호환 URL(`http://host:11434/v1`)을 사용하지 마세요. 이 경우 도구 호출이 깨지고 모델이 원시 도구 JSON을 일반 텍스트로 출력할 수 있습니다. 대신 네이티브 Ollama API URL을 사용하세요: `baseUrl: "http://host:11434"`(`/v1` 없음).
</Warning>

Ollama provider 설정은 `baseUrl`을 표준 키로 사용합니다. OpenClaw는 OpenAI SDK 스타일 예제와의 호환성을 위해 `baseURL`도 허용하지만, 새 설정에서는 `baseUrl`을 사용하는 것이 좋습니다.

## 인증 규칙

<AccordionGroup>
  <Accordion title="로컬 및 LAN 호스트">
    로컬 및 LAN Ollama 호스트에는 실제 bearer token이 필요하지 않습니다. OpenClaw는 루프백, 사설 네트워크, `.local`, 그리고 단순 호스트 이름 Ollama base URL에 대해서만 로컬 `ollama-local` 마커를 사용합니다.
  </Accordion>
  <Accordion title="원격 및 Ollama Cloud 호스트">
    원격 공개 호스트와 Ollama Cloud(`https://ollama.com`)에는 `OLLAMA_API_KEY`, 인증 프로필, 또는 provider의 `apiKey`를 통한 실제 자격 증명이 필요합니다. 직접 호스팅 사용에는 provider `ollama-cloud`를 권장합니다.
  </Accordion>
  <Accordion title="사용자 지정 provider id">
    `api: "ollama"`를 설정하는 사용자 지정 provider id도 동일한 규칙을 따릅니다. 예를 들어 사설 LAN Ollama 호스트를 가리키는 `ollama-remote` provider는 `apiKey: "ollama-local"`을 사용할 수 있으며, 하위 에이전트는 이를 누락된 자격 증명으로 취급하는 대신 Ollama provider hook을 통해 해당 마커를 해석합니다. 메모리 검색도 `agents.defaults.memorySearch.provider`를 해당 사용자 지정 provider id로 설정하여 임베딩이 일치하는 Ollama 엔드포인트를 사용하도록 할 수 있습니다.
  </Accordion>
  <Accordion title="인증 프로필">
    `auth-profiles.json`은 provider id의 자격 증명을 저장합니다. 엔드포인트 설정(`baseUrl`, `api`, model ids, headers, timeouts)은 `models.providers.<id>`에 넣으세요. `{ "ollama-windows": { "apiKey": "ollama-local" } }` 같은 오래된 평면 auth-profile 파일은 런타임 형식이 아닙니다. `openclaw doctor --fix`를 실행하여 백업과 함께 표준 `ollama-windows:default` API-key 프로필로 다시 작성하세요. 해당 파일의 `baseUrl`은 호환성 잡음이므로 provider 설정으로 옮겨야 합니다.
  </Accordion>
  <Accordion title="메모리 임베딩 범위">
    Ollama가 메모리 임베딩에 사용될 때 bearer 인증은 선언된 호스트로 범위가 제한됩니다.

    - provider 수준 키는 해당 provider의 Ollama 호스트에만 전송됩니다.
    - `agents.*.memorySearch.remote.apiKey`는 해당 원격 임베딩 호스트에만 전송됩니다.
    - 순수 `OLLAMA_API_KEY` env 값은 Ollama Cloud 관례로 취급되며, 기본적으로 로컬 또는 셀프 호스팅 호스트에는 전송되지 않습니다.

  </Accordion>
</AccordionGroup>

## 시작하기

선호하는 설정 방법과 모드를 선택하세요.

<Tabs>
  <Tab title="온보딩(권장)">
    **권장 대상:** 작동하는 Ollama 클라우드 또는 로컬 설정으로 가는 가장 빠른 경로.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard
        ```

        provider 목록에서 **Ollama**를 선택하세요.
      </Step>
      <Step title="모드 선택">
        - **클라우드 + 로컬** — 로컬 Ollama 호스트와 해당 호스트를 통해 라우팅되는 클라우드 모델
        - **클라우드 전용** — `https://ollama.com`을 통한 호스팅 Ollama 모델
        - **로컬 전용** — 로컬 모델만

      </Step>
      <Step title="모델 선택">
        `Cloud only`는 `OLLAMA_API_KEY`를 묻고 호스팅 클라우드 기본값을 제안합니다. `Cloud + Local`과 `Local only`는 Ollama base URL을 요청하고, 사용 가능한 모델을 검색하며, 선택한 로컬 모델이 아직 없으면 자동으로 pull합니다. Ollama가 `gemma4:latest` 같은 설치된 `:latest` 태그를 보고하면, 설정은 `gemma4`와 `gemma4:latest`를 둘 다 보여주거나 기본 alias를 다시 pull하는 대신 해당 설치된 모델을 한 번만 보여줍니다. `Cloud + Local`은 또한 해당 Ollama 호스트가 클라우드 액세스를 위해 로그인되어 있는지도 확인합니다.
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

    선택적으로 사용자 지정 base URL 또는 모델을 지정할 수 있습니다.

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="수동 설정">
    **권장 대상:** 클라우드 또는 로컬 설정에 대한 완전한 제어.

    <Steps>
      <Step title="클라우드 또는 로컬 선택">
        - **클라우드 + 로컬**: Ollama를 설치하고, `ollama signin`으로 로그인한 뒤, 해당 호스트를 통해 클라우드 요청을 라우팅합니다
        - **클라우드 전용**: `OLLAMA_API_KEY`와 함께 `https://ollama.com`을 사용합니다
        - **로컬 전용**: [ollama.com/download](https://ollama.com/download)에서 Ollama를 설치합니다

      </Step>
      <Step title="로컬 모델 pull(로컬 전용)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClaw에서 Ollama 활성화">
        `Cloud only`의 경우 실제 `OLLAMA_API_KEY`를 사용하세요. 호스트 기반 설정에서는 어떤 placeholder 값이든 작동합니다.

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="모델 확인 및 설정">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        또는 설정에서 기본값을 지정하세요.

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
    `Cloud + Local`은 로컬 모델과 클라우드 모델 모두의 제어 지점으로 연결 가능한 Ollama 호스트를 사용합니다. 이는 Ollama가 권장하는 하이브리드 흐름입니다.

    설정 중 **클라우드 + 로컬**을 사용하세요. OpenClaw는 Ollama base URL을 묻고, 해당 호스트에서 로컬 모델을 검색하며, `ollama signin`으로 호스트가 클라우드 액세스에 로그인되어 있는지 확인합니다. 호스트가 로그인되어 있으면 OpenClaw는 `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud` 같은 호스팅 클라우드 기본값도 제안합니다.

    호스트가 아직 로그인되어 있지 않으면, `ollama signin`을 실행할 때까지 OpenClaw는 설정을 로컬 전용으로 유지합니다.

  </Tab>

  <Tab title="클라우드 전용">
    `Cloud only`는 `https://ollama.com`의 Ollama 호스팅 API를 대상으로 실행됩니다.

    설정 중 **클라우드 전용**을 사용하세요. OpenClaw는 `OLLAMA_API_KEY`를 묻고, `baseUrl: "https://ollama.com"`을 설정하며, 호스팅 클라우드 모델 목록을 시드합니다. 이 경로에는 로컬 Ollama 서버나 `ollama signin`이 필요하지 않습니다.

    `openclaw onboard` 중 표시되는 클라우드 모델 목록은 `https://ollama.com/api/tags`에서 실시간으로 채워지며, 최대 500개 항목으로 제한됩니다. 따라서 선택기는 정적 시드가 아니라 현재 호스팅 카탈로그를 반영합니다. 설정 시점에 `ollama.com`에 연결할 수 없거나 모델을 반환하지 않으면, OpenClaw는 온보딩이 계속 완료될 수 있도록 이전의 하드코딩된 제안으로 대체합니다.

    일급 클라우드 provider를 직접 설정할 수도 있습니다.

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="로컬 전용">
    로컬 전용 모드에서 OpenClaw는 설정된 Ollama 인스턴스에서 모델을 검색합니다. 이 경로는 로컬 또는 셀프 호스팅 Ollama 서버용입니다.

    OpenClaw는 현재 로컬 기본값으로 `gemma4`를 제안합니다.

  </Tab>
</Tabs>

## 모델 검색(암시적 provider)

`OLLAMA_API_KEY`(또는 인증 프로필)를 설정하고 `models.providers.ollama` 또는 `api: "ollama"`를 사용하는 다른 사용자 지정 원격 provider를 정의하지 **않은** 경우, OpenClaw는 `http://127.0.0.1:11434`의 로컬 Ollama 인스턴스에서 모델을 검색합니다.

| 동작                 | 세부 정보                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 카탈로그 쿼리        | `/api/tags`를 쿼리합니다                                                                                                                                                  |
| 기능 감지 | 최선의 `/api/show` 조회를 사용해 `contextWindow`, 확장된 `num_ctx` Modelfile 매개변수, 그리고 vision/tools를 포함한 기능을 읽습니다                       |
| 비전 모델        | `/api/show`가 보고한 `vision` 기능이 있는 모델은 이미지 가능(`input: ["text", "image"]`)으로 표시되어 OpenClaw가 이미지를 프롬프트에 자동 삽입합니다  |
| 추론 감지  | 사용 가능한 경우 `thinking`을 포함한 `/api/show` 기능을 사용합니다. Ollama가 기능을 생략하면 모델 이름 휴리스틱(`r1`, `reasoning`, `think`)으로 대체합니다 |
| 토큰 제한         | `maxTokens`를 OpenClaw가 사용하는 기본 Ollama 최대 토큰 상한으로 설정합니다                                                                                                |
| 비용                | 모든 비용을 `0`으로 설정합니다                                                                                                                                                |

이를 통해 수동 모델 항목 없이도 카탈로그를 로컬 Ollama 인스턴스와 정렬된 상태로 유지할 수 있습니다. 로컬 `infer model run`에서 `ollama/<pulled-model>:latest` 같은 전체 참조를 사용할 수 있습니다. OpenClaw는 손으로 작성한 `models.json` 항목을 요구하지 않고 Ollama의 라이브 카탈로그에서 해당 설치된 모델을 해석합니다.

로그인된 Ollama 호스트의 경우 일부 `:cloud` 모델은 `/api/tags`에 표시되기 전에 `/api/chat` 및 `/api/show`를 통해 사용할 수 있습니다. 전체 `ollama/<model>:cloud` 참조를 명시적으로 선택하면, OpenClaw는 누락된 정확한 모델을 `/api/show`로 검증하고 Ollama가 모델 메타데이터를 확인한 경우에만 런타임 카탈로그에 추가합니다. 오타는 여전히 자동 생성되는 대신 알 수 없는 모델로 실패합니다.

```bash
# See what models are available
ollama list
openclaw models list
```

전체 에이전트 도구 표면을 피하는 좁은 텍스트 생성 smoke test에는 전체 Ollama 모델 참조와 함께 로컬 `infer model run`을 사용하세요.

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

해당 경로는 여전히 OpenClaw의 설정된 provider, 인증, 네이티브 Ollama 전송을 사용하지만, chat-agent 턴을 시작하거나 MCP/도구 컨텍스트를 로드하지 않습니다. 이것은 성공하지만 일반 에이전트 응답이 실패한다면, 다음으로 모델의 에이전트 프롬프트/도구 용량을 문제 해결하세요.

동일한 가벼운 경로에서 좁은 비전 모델 smoke test를 수행하려면 `infer model run`에 하나 이상의 이미지 파일을 추가하세요. 이렇게 하면 채팅 도구, 메모리, 이전 세션 컨텍스트를 로드하지 않고 프롬프트와 이미지를 선택한 Ollama 비전 모델에 직접 전송합니다.

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file`은 일반적인 PNG, JPEG, WebP 입력을 포함하여 `image/*`로 감지되는 파일을 허용합니다. 이미지가 아닌 파일은 Ollama가 호출되기 전에 거부됩니다.
음성 인식에는 대신 `openclaw infer audio transcribe`를 사용하세요.

`/model ollama/<model>`로 대화를 전환하면 OpenClaw는 이를 정확한 사용자 선택으로 취급합니다. 구성된 Ollama `baseUrl`에 연결할 수 없으면 다음 응답은 구성된 다른 fallback 모델에서 조용히 답하지 않고 provider 오류로 실패합니다.

격리된 cron 작업은 agent turn을 시작하기 전에 로컬 안전 검사를 하나 더 수행합니다. 선택된 모델이 로컬, 사설 네트워크 또는 `.local` Ollama provider로 확인되고 `/api/tags`에 연결할 수 없으면 OpenClaw는 해당 cron run을 오류 텍스트의 선택된 `ollama/<model>`과 함께 `skipped`로 기록합니다. endpoint preflight는 5분 동안 캐시되므로, 중지된 동일한 Ollama daemon을 가리키는 여러 cron 작업이 모두 실패하는 model request를 실행하지 않습니다.

로컬 Ollama에 대해 로컬 텍스트 경로, native stream 경로, embeddings를 live-verify하려면 다음을 사용하세요.

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud API 키 smoke test의 경우 live test가 `https://ollama.com`을 가리키도록 하고 현재 catalog에서 hosted model을 선택하세요.

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

cloud smoke는 텍스트, native stream, web search를 실행합니다. Ollama Cloud API 키가 `/api/embed` 권한을 부여하지 않을 수 있으므로 `https://ollama.com`에서는 기본적으로 embeddings를 건너뜁니다. 구성된 cloud key가 embed endpoint를 사용할 수 없을 때 live test가 실패하도록 명시적으로 원하면 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`을 설정하세요.

새 모델을 추가하려면 Ollama로 pull하면 됩니다.

```bash
ollama pull mistral
```

새 모델은 자동으로 검색되어 사용할 수 있게 됩니다.

<Note>
`models.providers.ollama`를 명시적으로 설정하거나 `api: "ollama"`를 사용해 `models.providers.ollama-cloud` 같은 custom remote provider를 구성하면 auto-discovery가 건너뛰어지며 모델을 수동으로 정의해야 합니다. `http://127.0.0.2:11434` 같은 loopback custom provider는 여전히 로컬로 취급됩니다. 아래의 명시적 구성 섹션을 참고하세요.
</Note>

## Vision 및 이미지 설명

번들 Ollama Plugin은 Ollama를 이미지 지원 media-understanding provider로 등록합니다. 이를 통해 OpenClaw는 명시적인 이미지 설명 요청과 구성된 image-model 기본값을 로컬 또는 hosted Ollama vision model로 라우팅할 수 있습니다.

로컬 vision의 경우 이미지를 지원하는 모델을 pull하세요.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

그런 다음 infer CLI로 확인하세요.

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model`은 전체 `<provider/model>` ref여야 합니다. 이 값이 설정되면 `openclaw infer image describe`는 모델이 native vision을 지원한다는 이유로 설명을 건너뛰지 않고 해당 모델을 먼저 시도합니다. 모델 호출이 실패하면 OpenClaw는 구성된 `agents.defaults.imageModel.fallbacks`를 통해 계속 진행할 수 있습니다. 파일 또는 URL 준비 오류는 fallback 시도 전에 계속 실패합니다.

OpenClaw의 image-understanding provider 흐름, 구성된 `agents.defaults.imageModel`, 이미지 설명 출력 shape가 필요할 때는 `infer image describe`를 사용하세요. custom prompt와 하나 이상의 이미지로 원시 multimodal model probe를 원할 때는 `infer model run --file`을 사용하세요.

Ollama를 inbound media의 기본 image-understanding model로 만들려면 `agents.defaults.imageModel`을 구성하세요.

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

전체 `ollama/<model>` ref를 선호하세요. 동일한 모델이 `models.providers.ollama.models` 아래에 `input: ["text", "image"]`와 함께 나열되어 있고, 구성된 다른 image provider가 해당 bare model ID를 노출하지 않는 경우 OpenClaw는 `qwen2.5vl:7b` 같은 bare `imageModel` ref도 `ollama/qwen2.5vl:7b`로 정규화합니다. 둘 이상의 구성된 image provider가 동일한 bare ID를 가진 경우 provider prefix를 명시적으로 사용하세요.

느린 로컬 vision model은 cloud model보다 더 긴 image-understanding timeout이 필요할 수 있습니다. 또한 Ollama가 제약된 하드웨어에서 광고된 전체 vision context를 할당하려고 할 때 crash되거나 중지될 수 있습니다. 일반 이미지 설명 turn만 필요한 경우 capability timeout을 설정하고 model entry에서 `num_ctx`를 제한하세요.

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

이 timeout은 inbound image understanding과 agent가 turn 중 호출할 수 있는 명시적인 `image` tool에 적용됩니다. Provider 수준의 `models.providers.ollama.timeoutSeconds`는 여전히 일반 모델 호출에 대한 기본 Ollama HTTP request guard를 제어합니다.

로컬 Ollama에 대해 명시적인 image tool을 live-verify하려면 다음을 사용하세요.

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

OpenClaw는 image-capable로 표시되지 않은 모델의 이미지 설명 요청을 거부합니다. implicit discovery를 사용하는 경우 `/api/show`가 vision capability를 보고하면 OpenClaw가 Ollama에서 이를 읽습니다.

## 구성

<Tabs>
  <Tab title="Basic (implicit discovery)">
    가장 단순한 로컬 전용 enablement 경로는 환경 변수를 사용하는 것입니다.

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY`가 설정되어 있으면 provider entry에서 `apiKey`를 생략할 수 있으며 OpenClaw가 availability check를 위해 이를 채웁니다.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    hosted cloud 설정이 필요하거나, Ollama가 다른 host/port에서 실행되거나, 특정 context window 또는 모델 목록을 강제하려는 경우, 또는 완전한 수동 모델 정의를 원하는 경우 명시적 구성을 사용하세요.

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

  <Tab title="Custom base URL">
    Ollama가 다른 host 또는 port에서 실행 중인 경우입니다(명시적 구성은 auto-discovery를 비활성화하므로 모델을 수동으로 정의하세요).

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
    URL에 `/v1`을 추가하지 마세요. `/v1` 경로는 OpenAI 호환 모드를 사용하며, 이 모드에서는 tool calling이 안정적이지 않습니다. 경로 suffix가 없는 기본 Ollama URL을 사용하세요.
    </Warning>

  </Tab>
</Tabs>

## 일반적인 레시피

이를 시작점으로 사용하고 model ID를 `ollama list` 또는 `openclaw models list --provider ollama`의 정확한 이름으로 바꾸세요.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Ollama가 Gateway와 동일한 머신에서 실행되고 OpenClaw가 설치된 모델을 자동으로 검색하기를 원할 때 사용하세요.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    이 경로는 구성을 최소로 유지합니다. 모델을 수동으로 정의하려는 경우가 아니라면 `models.providers.ollama` block을 추가하지 마세요.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    LAN host에는 native Ollama URL을 사용하세요. `/v1`을 추가하지 마세요.

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

    `contextWindow`는 OpenClaw 측 context budget입니다. `params.num_ctx`는 request를 위해 Ollama로 전송됩니다. 하드웨어가 모델의 광고된 전체 context를 실행할 수 없는 경우 두 값을 정렬해 유지하세요.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    로컬 daemon을 실행하지 않고 hosted Ollama 모델을 직접 사용하려는 경우 사용하세요.

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

  <Accordion title="Cloud plus local through a signed-in daemon">
    로컬 또는 LAN Ollama daemon이 `ollama signin`으로 로그인되어 있고 로컬 모델과 `:cloud` 모델을 모두 제공해야 할 때 사용하세요.

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

  <Accordion title="여러 Ollama 호스트">
    Ollama 서버가 둘 이상인 경우 사용자 지정 provider ID를 사용하세요. 각 provider는 자체 호스트, 모델, 인증, 타임아웃, 모델 참조를 가집니다.

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

    OpenClaw가 요청을 보낼 때 활성 provider 접두사가 제거되므로 `ollama-large/qwen3.5:27b`는 Ollama에 `qwen3.5:27b`로 전달됩니다.

  </Accordion>

  <Accordion title="간결한 로컬 모델 프로필">
    일부 로컬 모델은 간단한 프롬프트에는 응답할 수 있지만 전체 에이전트 도구 표면에서는 어려움을 겪을 수 있습니다. 전역 런타임 설정을 변경하기 전에 도구와 컨텍스트를 제한하는 것부터 시작하세요.

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
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

    모델이나 서버가 도구 스키마에서 안정적으로 실패하는 경우에만 `compat.supportsTools: false`를 사용하세요. 이는 안정성을 위해 에이전트 기능을 맞바꿉니다.
    `localModelLean`은 직접 에이전트 표면에서 브라우저, cron, 메시지 도구를 제거하고, 실행이 직접 메시지 전달 의미를 유지해야 하는 경우를 제외하면 더 큰 카탈로그를 구조화된 도구 검색 컨트롤 뒤에 기본 배치합니다. 하지만 Ollama의 런타임 컨텍스트나 사고 모드는 변경하지 않습니다. 루프에 빠지거나 숨겨진 추론에 응답 예산을 소비하는 작은 Qwen 스타일 사고 모델에는 명시적인 `params.num_ctx` 및 `params.thinking: false`와 함께 사용하세요.

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

사용자 지정 Ollama provider ID도 지원됩니다. 모델 참조가 `ollama-spark/qwen3:32b`처럼 활성
provider 접두사를 사용하는 경우, OpenClaw는 Ollama를 호출하기 전에 해당
접두사만 제거하므로 서버는 `qwen3:32b`를 받습니다.

느린 로컬 모델의 경우 전체 에이전트 런타임 타임아웃을 늘리기 전에
provider 범위 요청 튜닝을 우선 사용하세요.

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

`timeoutSeconds`는 연결 설정, 헤더, 본문 스트리밍, 전체 보호된 fetch 중단을 포함한 모델 HTTP 요청에 적용됩니다. `params.keep_alive`는 네이티브 `/api/chat` 요청에서 최상위 `keep_alive`로 Ollama에 전달됩니다.
첫 턴 로드 시간이 병목인 경우 모델별로 설정하세요.

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

원격 호스트의 경우 `127.0.0.1`을 `baseUrl`에 사용한 호스트로 바꾸세요. `curl`은 작동하지만 OpenClaw가 작동하지 않는다면 Gateway가 다른 머신, 컨테이너 또는 서비스 계정에서 실행되는지 확인하세요.

## Ollama 웹 검색

OpenClaw는 번들 `web_search` provider로 **Ollama 웹 검색**을 지원합니다.

| 속성        | 세부 정보                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 호스트      | 구성된 Ollama 호스트를 사용합니다(`models.providers.ollama.baseUrl`이 설정된 경우 해당 값, 아니면 `http://127.0.0.1:11434`). `https://ollama.com`은 호스팅 API를 직접 사용합니다 |
| 인증        | 로그인된 로컬 Ollama 호스트는 키가 필요 없습니다. 직접 `https://ollama.com` 검색 또는 인증으로 보호된 호스트에는 `OLLAMA_API_KEY` 또는 구성된 provider 인증을 사용합니다               |
| 요구 사항   | 로컬/자체 호스팅 호스트는 실행 중이어야 하며 `ollama signin`으로 로그인되어 있어야 합니다. 직접 호스팅 검색에는 `baseUrl: "https://ollama.com"`과 실제 Ollama API 키가 필요합니다 |

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

로그인된 로컬 데몬의 경우 OpenClaw는 데몬의 `/api/experimental/web_search` 프록시를 사용합니다. `https://ollama.com`의 경우 호스팅 `/api/web_search` 엔드포인트를 직접 호출합니다.

<Note>
전체 설정 및 동작 세부 정보는 [Ollama 웹 검색](/ko/tools/ollama-search)을 참조하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="레거시 OpenAI 호환 모드">
    <Warning>
    **OpenAI 호환 모드에서는 도구 호출이 안정적이지 않습니다.** 프록시에 OpenAI 형식이 필요하고 네이티브 도구 호출 동작에 의존하지 않는 경우에만 이 모드를 사용하세요.
    </Warning>

    대신 OpenAI 호환 엔드포인트를 사용해야 하는 경우(예: OpenAI 형식만 지원하는 프록시 뒤에서), `api: "openai-completions"`를 명시적으로 설정하세요.

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

    Ollama와 함께 `api: "openai-completions"`를 사용하는 경우 OpenClaw는 Ollama가 4096 컨텍스트 창으로 조용히 폴백하지 않도록 기본적으로 `options.num_ctx`를 삽입합니다. 프록시/업스트림이 알 수 없는 `options` 필드를 거부한다면 이 동작을 비활성화하세요.

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

  <Accordion title="컨텍스트 창">
    자동 검색된 모델의 경우 OpenClaw는 사용 가능하면 사용자 지정 Modelfile의 더 큰 `PARAMETER num_ctx` 값을 포함하여 Ollama가 보고한 컨텍스트 창을 사용합니다. 그렇지 않으면 OpenClaw에서 사용하는 기본 Ollama 컨텍스트 창으로 폴백합니다.

    해당 Ollama provider 아래의 모든 모델에 대해 provider 수준 `contextWindow`, `contextTokens`, `maxTokens` 기본값을 설정한 다음, 필요할 때 모델별로 재정의할 수 있습니다. `contextWindow`는 OpenClaw의 프롬프트 및 Compaction 예산입니다. 네이티브 Ollama 요청은 `params.num_ctx`를 명시적으로 구성하지 않는 한 `options.num_ctx`를 설정하지 않으므로 Ollama가 자체 모델, `OLLAMA_CONTEXT_LENGTH` 또는 VRAM 기반 기본값을 적용할 수 있습니다. Modelfile을 다시 빌드하지 않고 Ollama의 요청별 런타임 컨텍스트를 제한하거나 강제하려면 `params.num_ctx`를 설정하세요. 유효하지 않거나 0, 음수, 유한하지 않은 값은 무시됩니다. 네이티브 Ollama 요청 컨텍스트를 강제하기 위해 `contextWindow` 또는 `maxTokens`만 사용한 이전 구성을 업그레이드했다면, `openclaw doctor --fix`를 실행하여 해당 명시적 provider 또는 모델 예산을 `params.num_ctx`로 복사하세요. OpenAI 호환 Ollama 어댑터는 여전히 구성된 `params.num_ctx` 또는 `contextWindow`에서 기본적으로 `options.num_ctx`를 삽입합니다. 업스트림이 `options`를 거부한다면 `injectNumCtxForOpenAICompat: false`로 비활성화하세요.

    네이티브 Ollama 모델 항목은 `params` 아래에서 `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread`, `use_mmap`을 포함한 공통 Ollama 런타임 옵션도 허용합니다. OpenClaw는 Ollama 요청 키만 전달하므로 `streaming` 같은 OpenClaw 런타임 params는 Ollama로 유출되지 않습니다. 최상위 Ollama `think`를 보내려면 `params.think` 또는 `params.thinking`을 사용하세요. `false`는 Qwen 스타일 사고 모델의 API 수준 사고를 비활성화합니다.

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

    모델별 `agents.defaults.models["ollama/<model>"].params.num_ctx`도 작동합니다. 둘 다 구성된 경우 명시적인 provider 모델 항목이 에이전트 기본값보다 우선합니다.

  </Accordion>

  <Accordion title="사고 제어">
    네이티브 Ollama 모델의 경우 OpenClaw는 Ollama가 기대하는 방식대로 사고 제어를 전달합니다. 즉, `options.think`가 아니라 최상위 `think`입니다. `/api/show` 응답에 `thinking` 기능이 포함된 자동 검색 모델은 `/think low`, `/think medium`, `/think high`, `/think max`를 노출합니다. 사고 모델이 아닌 모델은 `/think off`만 노출합니다.

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
    Ollama는 무료이며 로컬에서 실행되므로 모든 모델 비용은 $0로 설정됩니다. 이는 자동 검색된 모델과 수동으로 정의한 모델 모두에 적용됩니다.
  </Accordion>

  <Accordion title="메모리 임베딩">
    번들 Ollama Plugin은 [메모리 검색](/ko/concepts/memory)을 위한 메모리 임베딩 공급자를 등록합니다. 구성된 Ollama 기본 URL과 API 키를 사용하고, Ollama의 현재 `/api/embed` 엔드포인트를 호출하며, 가능한 경우 여러 메모리 청크를 하나의 `input` 요청으로 일괄 처리합니다.

    `proxy.enabled=true`일 때, 구성된 `baseUrl`에서 파생된 정확한 호스트 로컬 루프백 원본으로 보내는 Ollama 메모리 임베딩 요청은 관리형 포워드 프록시 대신 OpenClaw의 보호된 직접 경로를 사용합니다. 구성된 호스트 이름 자체가 `localhost` 또는 루프백 IP 리터럴이어야 합니다. 단순히 루프백으로 확인되는 DNS 이름은 여전히 관리형 프록시 경로를 사용합니다. LAN, tailnet, 사설 네트워크 및 공개 Ollama 호스트도 관리형 프록시 경로에 유지됩니다. 다른 호스트나 포트로의 리디렉션은 신뢰를 상속하지 않습니다. 운영자는 여전히 전역 `proxy.loopbackMode: "proxy"` 설정을 지정해 루프백 트래픽을 프록시를 통해 보내거나, `proxy.loopbackMode: "block"`을 지정해 연결을 열기 전에 루프백 연결을 거부할 수 있습니다. 이 설정의 프로세스 전체 효과는 [관리형 프록시](/ko/security/network-proxy#gateway-loopback-mode)를 참조하세요.

    | 속성 | 값 |
    | ------------- | ------------------- |
    | 기본 모델 | `nomic-embed-text` |
    | 자동 가져오기 | 예 — 임베딩 모델이 로컬에 없으면 자동으로 가져옵니다 |

    쿼리 시점 임베딩은 `nomic-embed-text`, `qwen3-embedding`, `mxbai-embed-large`를 포함하여 검색 접두사를 요구하거나 권장하는 모델에 검색 접두사를 사용합니다. 메모리 문서 배치는 기존 인덱스에 형식 마이그레이션이 필요하지 않도록 원시 상태로 유지됩니다.

    Ollama를 메모리 검색 임베딩 공급자로 선택하려면:

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

    원격 임베딩 호스트의 경우 인증 범위를 해당 호스트로 제한하세요.

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
    OpenClaw의 Ollama 통합은 기본적으로 **네이티브 Ollama API**(`/api/chat`)를 사용하며, 스트리밍과 도구 호출을 동시에 완전히 지원합니다. 특별한 구성은 필요하지 않습니다.

    네이티브 `/api/chat` 요청의 경우 OpenClaw는 사고 제어도 Ollama에 직접 전달합니다. 명시적인 모델 `params.think`/`params.thinking` 값이 구성되어 있지 않으면 `/think off`와 `openclaw agent --thinking off`는 최상위 `think: false`를 보내고, `/think low|medium|high`는 일치하는 최상위 `think` 노력 문자열을 보냅니다. `/think max`는 Ollama의 가장 높은 네이티브 노력인 `think: "high"`에 매핑됩니다.

    <Tip>
    OpenAI 호환 엔드포인트를 사용해야 하는 경우, 위의 "레거시 OpenAI 호환 모드" 섹션을 참조하세요. 해당 모드에서는 스트리밍과 도구 호출이 동시에 작동하지 않을 수 있습니다.
    </Tip>

  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="WSL2 크래시 루프(반복 재부팅)">
    NVIDIA/CUDA를 사용하는 WSL2에서 공식 Ollama Linux 설치 프로그램은 `Restart=always`가 포함된 `ollama.service` systemd 유닛을 생성합니다. 해당 서비스가 자동 시작되고 WSL2 부팅 중 GPU 기반 모델을 로드하면, 모델이 로드되는 동안 Ollama가 호스트 메모리를 고정할 수 있습니다. Hyper-V 메모리 회수는 이러한 고정된 페이지를 항상 회수할 수 없으므로 Windows가 WSL2 VM을 종료할 수 있고, systemd가 Ollama를 다시 시작하면서 루프가 반복됩니다.

    일반적인 증거:

    - Windows 측에서 반복되는 WSL2 재부팅 또는 종료
    - WSL2 시작 직후 `app.slice` 또는 `ollama.service`의 높은 CPU 사용량
    - Linux OOM-killer 이벤트가 아니라 systemd에서 온 SIGTERM

    OpenClaw는 WSL2, `Restart=always`로 활성화된 `ollama.service`, 보이는 CUDA 마커를 감지하면 시작 경고를 기록합니다.

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
    Ollama가 실행 중이고 `OLLAMA_API_KEY`(또는 인증 프로필)를 설정했는지, 그리고 명시적인 `models.providers.ollama` 항목을 정의하지 **않았는지** 확인하세요.

    ```bash
    ollama serve
    ```

    API에 액세스할 수 있는지 확인하세요.

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="사용 가능한 모델 없음">
    모델이 나열되지 않으면 모델을 로컬로 가져오거나 `models.providers.ollama`에 명시적으로 정의하세요.

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

  <Accordion title="원격 호스트는 curl에서 작동하지만 OpenClaw에서는 작동하지 않음">
    Gateway를 실행하는 동일한 머신과 런타임에서 확인하세요.

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    일반적인 원인:

    - `baseUrl`이 `localhost`를 가리키지만 Gateway가 Docker 또는 다른 호스트에서 실행됩니다.
    - URL이 `/v1`을 사용하여 네이티브 Ollama 대신 OpenAI 호환 동작을 선택합니다.
    - 원격 호스트의 Ollama 측에서 방화벽 또는 LAN 바인딩 변경이 필요합니다.
    - 모델이 노트북의 데몬에는 있지만 원격 데몬에는 없습니다.

  </Accordion>

  <Accordion title="모델이 도구 JSON을 텍스트로 출력함">
    이는 일반적으로 공급자가 OpenAI 호환 모드를 사용 중이거나 모델이 도구 스키마를 처리할 수 없음을 의미합니다.

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
    호스팅된 Kimi/GLM 응답이 길고 비언어적인 기호 나열이면 성공적인 어시스턴트 답변 대신 실패한 공급자 출력으로 처리됩니다. 이렇게 하면 손상된 텍스트를 세션에 유지하지 않고 정상적인 재시도, 폴백 또는 오류 처리가 이어질 수 있습니다.

    반복해서 발생하면 원시 모델 이름, 현재 세션 파일, 실행이 `Cloud + Local` 또는 `Cloud only` 중 무엇을 사용했는지 캡처한 다음, 새 세션과 폴백 모델을 시도하세요.

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="차가운 로컬 모델 시간이 초과됨">
    대형 로컬 모델은 스트리밍이 시작되기 전에 긴 최초 로드 시간이 필요할 수 있습니다. 제한 시간을 Ollama 공급자 범위로 유지하고, 선택적으로 Ollama에 턴 사이에 모델을 로드된 상태로 유지하도록 요청하세요.

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

    호스트 자체가 연결 수락이 느린 경우, `timeoutSeconds`는 이 공급자의 보호된 Undici 연결 제한 시간도 연장합니다.

  </Accordion>

  <Accordion title="대형 컨텍스트 모델이 너무 느리거나 메모리가 부족함">
    많은 Ollama 모델은 하드웨어가 편안하게 실행할 수 있는 것보다 큰 컨텍스트를 광고합니다. 네이티브 Ollama는 `params.num_ctx`를 설정하지 않는 한 Ollama 자체 런타임 컨텍스트 기본값을 사용합니다. 예측 가능한 첫 토큰 지연 시간을 원할 때 OpenClaw의 예산과 Ollama의 요청 컨텍스트를 모두 제한하세요.

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
  <Card title="모델 공급자" href="/ko/concepts/model-providers" icon="layers">
    모든 공급자, 모델 참조 및 장애 조치 동작의 개요입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법입니다.
  </Card>
  <Card title="Ollama 웹 검색" href="/ko/tools/ollama-search" icon="magnifying-glass">
    Ollama 기반 웹 검색에 대한 전체 설정 및 동작 세부 정보입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 구성 참조입니다.
  </Card>
</CardGroup>
