---
read_when:
    - antirez/ds4를 대상으로 OpenClaw를 실행하려고 합니다
    - 도구 호출을 지원하는 로컬 DeepSeek V4 Flash 백엔드가 필요한 경우
    - ds4-server용 OpenClaw 구성이 필요합니다.
summary: 로컬 DeepSeek V4 Flash OpenAI 호환 서버인 ds4를 통해 OpenClaw 실행
title: ds4
x-i18n:
    generated_at: "2026-07-12T01:07:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4)는 로컬 Metal 백엔드에서 OpenAI 호환 `/v1` API를 통해 DeepSeek V4 Flash를 제공합니다. OpenClaw는 범용 `openai-completions` 제공자 계열을 통해 ds4에 연결합니다.

ds4는 OpenClaw에 번들로 포함된 제공자 Plugin이 아닙니다. `models.providers.ds4` 아래에 구성한 다음 `ds4/deepseek-v4-flash`를 선택하세요.

| 속성        | 값                                                        |
| ----------- | --------------------------------------------------------- |
| 제공자 ID   | `ds4`                                                     |
| Plugin      | 없음(구성만 사용)                                         |
| API         | OpenAI 호환 Chat Completions (`openai-completions`)       |
| 기본 URL    | `http://127.0.0.1:18000/v1` (권장)                        |
| 모델 ID     | `deepseek-v4-flash`                                       |
| 도구 호출   | OpenAI 방식 `tools` / `tool_calls`                        |
| 추론        | DeepSeek 방식 `thinking` 및 `reasoning_effort`            |

## 요구 사항

- Metal을 지원하는 macOS.
- `ds4-server`와 DeepSeek V4 Flash GGUF 파일이 있는 정상 작동하는 ds4 체크아웃.
- 선택한 컨텍스트에 충분한 메모리. `--ctx` 값이 클수록 서버 시작 시 더 많은 KV 메모리가 할당됩니다.

<Warning>
OpenClaw 에이전트 턴에는 도구 스키마와 작업 공간 컨텍스트가 포함됩니다. `--ctx 4096`처럼 작은 컨텍스트는 직접 curl 테스트를 통과할 수 있지만 전체 에이전트 실행에서는 `500 prompt exceeds context` 오류가 발생할 수 있습니다. 에이전트 및 도구 스모크 테스트에는 최소 `--ctx 32768`을 사용하세요. 메모리가 충분하고 ds4 Think Max를 활성화하려는 경우에만 `--ctx 393216`을 사용하세요.
</Warning>

## 빠른 시작

<Steps>
  <Step title="ds4-server 시작">
    `<DS4_DIR>`을 ds4 체크아웃 경로로 바꾸세요.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="OpenAI 호환 엔드포인트 확인">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    응답에 `deepseek-v4-flash`가 포함되어야 합니다.

  </Step>
  <Step title="OpenClaw 제공자 구성 추가">
    [전체 구성](#full-config)의 구성을 추가한 다음 일회성 모델 검사를 실행하세요.

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## 전체 구성

ds4가 이미 `127.0.0.1:18000`에서 실행 중일 때 이 구성을 사용하세요.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`contextWindow`을 `ds4-server --ctx`와 일치시키세요. OpenClaw가 서버 기본값보다 적은 출력을 의도적으로 요청하도록 하려는 경우가 아니라면 `maxTokens`를 `--tokens`와 일치시키세요.

## 주문형 시작

OpenClaw는 `ds4/...` 모델이 선택된 경우에만 ds4를 시작할 수 있습니다. 동일한 제공자 항목에 `localService`를 추가하세요.

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command`는 절대 실행 파일 경로여야 합니다. 셸 조회와 `~` 확장은 사용되지 않습니다. 모든 `localService` 필드는 [로컬 모델 서비스](/ko/gateway/local-model-services)를 참조하세요.

## Think Max

ds4는 다음 두 조건이 모두 충족될 때만 Think Max를 적용합니다.

- `ds4-server`가 `--ctx 393216` 이상으로 시작됩니다.
- 요청이 `reasoning_effort: "max"` 또는 이에 해당하는 ds4 노력 필드를 사용합니다.

이처럼 큰 컨텍스트를 실행하는 경우 서버 플래그와 OpenClaw 모델 메타데이터를 모두 업데이트하세요.

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## 테스트

OpenClaw를 우회하는 직접 HTTP 검사:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

OpenClaw 모델 라우팅(빠른 시작 검사와 동일):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

최소 32768의 컨텍스트를 사용하는 전체 에이전트 및 도구 호출 스모크 테스트:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

예상 결과:

- `executionTrace.winnerProvider`가 `ds4`임
- `executionTrace.winnerModel`이 `deepseek-v4-flash`임
- `toolSummary.calls`가 `1` 이상임
- `finalAssistantVisibleText`가 `tool-ok`로 시작함

## 문제 해결

<AccordionGroup>
  <Accordion title="curl /v1/models에 연결할 수 없음">
    ds4가 실행 중이 아니거나 `baseUrl`의 호스트/포트에 바인딩되지 않았습니다. `ds4-server`를 시작한 다음 다시 시도하세요.

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    구성된 `--ctx`가 OpenClaw 턴에 비해 너무 작습니다. `ds4-server --ctx`를 늘린 다음 `models.providers.ds4.models[].contextWindow`을 일치하도록 업데이트하세요. 도구가 포함된 전체 에이전트 턴에는 메시지 하나를 사용하는 직접 curl 요청보다 훨씬 많은 컨텍스트가 필요합니다.
  </Accordion>

  <Accordion title="Think Max가 활성화되지 않음">
    ds4는 `--ctx`가 최소 `393216`이고 요청이 `reasoning_effort: "max"`를 요구할 때만 Think Max를 사용합니다. 더 작은 컨텍스트에서는 높은 수준의 추론으로 대체됩니다.
  </Accordion>

  <Accordion title="첫 번째 요청이 느림">
    ds4에는 초기 Metal 상주 및 모델 워밍업 단계가 있습니다. OpenClaw가 필요할 때 서버를 시작하도록 하는 경우 `localService.readyTimeoutMs: 300000`을 설정하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="로컬 모델 서비스" href="/ko/gateway/local-model-services" icon="play">
    모델 요청 전에 필요할 때 로컬 모델 서버를 시작합니다.
  </Card>
  <Card title="로컬 모델" href="/ko/gateway/local-models" icon="server">
    로컬 모델 백엔드를 선택하고 운영합니다.
  </Card>
  <Card title="모델 제공자" href="/ko/concepts/model-providers" icon="layers">
    제공자 참조, 인증 및 장애 조치를 구성합니다.
  </Card>
  <Card title="DeepSeek" href="/ko/providers/deepseek" icon="brain">
    기본 DeepSeek 제공자 동작 및 사고 제어입니다.
  </Card>
</CardGroup>
