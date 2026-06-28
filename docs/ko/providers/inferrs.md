---
read_when:
    - 로컬 inferrs 서버를 대상으로 OpenClaw를 실행하려는 경우
    - inferrs를 통해 Gemma 또는 다른 모델을 제공하고 있습니다
    - inferrs에는 정확한 OpenClaw 호환성 플래그가 필요합니다
summary: inferrs(OpenAI 호환 로컬 서버)를 통해 OpenClaw 실행하기
title: 추론함
x-i18n:
    generated_at: "2026-05-10T19:49:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
    postprocess_version: locale-links-v1
---

[inferrs](https://github.com/ericcurtin/inferrs)는 OpenAI 호환 `/v1` API 뒤에서 로컬 모델을 제공할 수 있습니다. OpenClaw는 범용 `openai-completions` 경로를 통해 `inferrs`와 함께 작동합니다.

| 속성               | 값                                                                 |
| ------------------ | ------------------------------------------------------------------ |
| 제공자 ID          | `inferrs`(사용자 지정; `models.providers.inferrs` 아래에서 구성)   |
| Plugin             | 없음 — `inferrs`는 번들 OpenClaw 제공자 plugin이 아닙니다          |
| 인증 환경 변수     | 선택 사항. inferrs 서버에 인증이 없으면 어떤 값이든 작동합니다     |
| API                | OpenAI 호환(`openai-completions`)                                  |
| 권장 기본 URL      | `http://127.0.0.1:8080/v1`(또는 inferrs 서버가 있는 위치)          |

<Note>
  현재 `inferrs`는 전용 OpenClaw 제공자 plugin이 아니라 사용자 지정 자체 호스팅 OpenAI 호환 백엔드로 다루는 것이 가장 좋습니다. 온보딩 선택 플래그가 아니라 `models.providers.inferrs`를 통해 구성합니다. 자동 검색 기능이 있는 실제 번들 plugin이 필요하면 [SGLang](/ko/providers/sglang) 또는 [vLLM](/ko/providers/vllm)을 참조하세요.
</Note>

## 시작하기

<Steps>
  <Step title="모델로 inferrs 시작">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="서버에 연결할 수 있는지 확인">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="OpenClaw 제공자 항목 추가">
    명시적 제공자 항목을 추가하고 기본 모델이 이를 가리키도록 설정합니다. 아래 전체 구성 예시를 참조하세요.
  </Step>
</Steps>

## 전체 구성 예시

이 예시는 로컬 `inferrs` 서버에서 Gemma 4를 사용합니다.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## 온디맨드 시작

`inferrs/...` 모델이 선택된 경우에만 OpenClaw가 Inferrs를 시작할 수도 있습니다.
같은 제공자 항목에 `localService`를 추가하세요.

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command`는 절대 경로여야 합니다. Gateway 호스트에서 `which inferrs`를 사용하고
그 경로를 구성에 넣으세요. 전체 필드 참조는
[로컬 모델 서비스](/ko/gateway/local-model-services)를 참조하세요.

## 고급 구성

<AccordionGroup>
  <Accordion title="requiresStringContent가 중요한 이유">
    일부 `inferrs` Chat Completions 경로는 구조화된 콘텐츠 부분 배열이 아니라 문자열
    `messages[].content`만 허용합니다.

    <Warning>
    OpenClaw 실행이 다음과 같은 오류로 실패하는 경우:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    모델 항목에 `compat.requiresStringContent: true`를 설정하세요.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw는 요청을 보내기 전에 순수 텍스트 콘텐츠 부분을 일반 문자열로 평탄화합니다.

  </Accordion>

  <Accordion title="Gemma 및 도구 스키마 주의 사항">
    일부 현재 `inferrs` + Gemma 조합은 작은 직접
    `/v1/chat/completions` 요청은 허용하지만 전체 OpenClaw 에이전트 런타임
    턴에서는 여전히 실패합니다.

    이 경우 먼저 다음을 시도하세요.

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    그러면 해당 모델에 대한 OpenClaw의 도구 스키마 표면이 비활성화되어 더 엄격한 로컬 백엔드의 프롬프트
    부담을 줄일 수 있습니다.

    아주 작은 직접 요청은 여전히 작동하지만 일반 OpenClaw 에이전트 턴이 계속
    `inferrs` 내부에서 충돌한다면, 남은 문제는 보통 OpenClaw의 전송 계층이 아니라 업스트림 모델/서버
    동작입니다.

  </Accordion>

  <Accordion title="수동 스모크 테스트">
    구성이 완료되면 두 계층을 모두 테스트하세요.

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    첫 번째 명령은 작동하지만 두 번째 명령이 실패하면 아래 문제 해결 섹션을 확인하세요.

  </Accordion>

  <Accordion title="프록시 스타일 동작">
    `inferrs`는 네이티브 OpenAI 엔드포인트가 아니라 프록시 스타일 OpenAI 호환 `/v1` 백엔드로 처리됩니다.

    - 네이티브 OpenAI 전용 요청 형성은 여기에 적용되지 않습니다
    - `service_tier`, Responses `store`, 프롬프트 캐시 힌트, OpenAI 추론 호환 페이로드 형성이 없습니다
    - 숨겨진 OpenClaw 출처 표시 헤더(`originator`, `version`, `User-Agent`)는 사용자 지정 `inferrs` 기본 URL에 주입되지 않습니다

  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="curl /v1/models 실패">
    `inferrs`가 실행 중이 아니거나, 연결할 수 없거나, 예상한
    호스트/포트에 바인딩되어 있지 않습니다. 서버가 시작되어 구성한 주소에서
    수신 중인지 확인하세요.
  </Accordion>

  <Accordion title="messages[].content에 문자열이 필요함">
    모델 항목에 `compat.requiresStringContent: true`를 설정하세요. 자세한 내용은 위의
    `requiresStringContent` 섹션을 참조하세요.
  </Accordion>

  <Accordion title="직접 /v1/chat/completions 호출은 통과하지만 openclaw infer model run은 실패함">
    도구 스키마 표면을 비활성화하려면 `compat.supportsTools: false` 설정을 시도하세요.
    위의 Gemma 도구 스키마 주의 사항을 참조하세요.
  </Accordion>

  <Accordion title="더 큰 에이전트 턴에서 inferrs가 여전히 충돌함">
    OpenClaw에서 더 이상 스키마 오류가 발생하지 않지만 `inferrs`가 더 큰
    에이전트 턴에서 여전히 충돌한다면, 이를 업스트림 `inferrs` 또는 모델 제한으로 간주하세요. 프롬프트
    부담을 줄이거나 다른 로컬 백엔드 또는 모델로 전환하세요.
  </Accordion>
</AccordionGroup>

<Tip>
일반적인 도움말은 [문제 해결](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq)를 참조하세요.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="로컬 모델" href="/ko/gateway/local-models" icon="server">
    로컬 모델 서버에 대해 OpenClaw 실행.
  </Card>
  <Card title="로컬 모델 서비스" href="/ko/gateway/local-model-services" icon="play">
    구성된 제공자를 위해 필요할 때 로컬 모델 서버 시작.
  </Card>
  <Card title="Gateway 문제 해결" href="/ko/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    프로브는 통과하지만 에이전트 실행에서 실패하는 로컬 OpenAI 호환 백엔드 디버깅.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 제공자, 모델 참조, 장애 조치 동작 개요.
  </Card>
</CardGroup>
