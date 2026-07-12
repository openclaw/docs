---
read_when:
    - 로컬 SGLang 서버에서 OpenClaw를 실행하려는 경우
    - 자체 모델로 OpenAI 호환 `/v1` 엔드포인트를 사용하려는 경우
summary: SGLang으로 OpenClaw 실행하기(OpenAI 호환 자체 호스팅 서버)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T01:08:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang은 OpenAI 호환 HTTP API를 통해 오픈 웨이트 모델을 제공합니다. OpenClaw는 사용 가능한 모델을 자동 탐색하는 `openai-completions` 제공자 계열을 사용하여 SGLang에 연결합니다.

| 속성                      | 값                                                           |
| ------------------------- | ------------------------------------------------------------ |
| 제공자 ID                 | `sglang`                                                     |
| Plugin                    | 번들 제공, `enabledByDefault: true`                          |
| 인증 환경 변수            | `SGLANG_API_KEY`(서버에 인증이 없으면 비어 있지 않은 임의의 값) |
| 온보딩 플래그             | `--auth-choice sglang`                                       |
| API                       | OpenAI 호환(`openai-completions`)                            |
| 기본 베이스 URL           | `http://127.0.0.1:30000/v1`                                  |
| 기본 모델 자리표시자      | `sglang/Qwen/Qwen3-8B`                                       |
| 스트리밍 사용량           | 예(`supportsStreamingUsage: true`)                           |
| 가격 책정                 | 외부 무료로 표시됨(`modelPricing.external: false`)           |

OpenClaw는 `SGLANG_API_KEY`를 사용하여 옵트인하면 SGLang에서 사용 가능한 모델도 **자동 탐색**합니다. 사용자 지정 SGLang 베이스 URL도 구성하는 경우 검색을 동적으로 유지하려면 `agents.defaults.models`에서 `sglang/*`를 사용하세요. 아래의 [모델 탐색(암시적 제공자)](#model-discovery-implicit-provider)을 참조하세요.

## 시작하기

<Steps>
  <Step title="SGLang 시작">
    OpenAI 호환 서버로 SGLang을 실행합니다. 베이스 URL은
    `/v1` 엔드포인트(예: `/v1/models`, `/v1/chat/completions`)를 제공해야 합니다. SGLang은
    일반적으로 다음 주소에서 실행됩니다.

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="API 키 설정">
    서버에 인증이 구성되어 있지 않으면 어떤 값이든 사용할 수 있습니다.

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="온보딩 실행 또는 모델 직접 설정">
    ```bash
    openclaw onboard
    ```

    또는 모델을 수동으로 구성합니다.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## 모델 탐색(암시적 제공자)

`SGLANG_API_KEY`가 설정되어 있거나 인증 프로필이 존재하고 `models.providers.sglang`을
정의하지 **않은** 경우 OpenClaw는 다음을 쿼리합니다.

- `GET http://127.0.0.1:30000/v1/models`

그런 다음 반환된 ID를 모델 항목으로 변환합니다.

<Note>
`models.providers.sglang`을 명시적으로 설정하면 OpenClaw는 기본적으로 선언된
모델을 사용합니다. OpenClaw가 구성된 제공자의 `/models` 엔드포인트를 쿼리하고
공개된 모든 SGLang 모델을 포함하도록 하려면 `agents.defaults.models`에
`"sglang/*": {}`를 추가하세요.
</Note>

## 명시적 구성(수동 모델)

다음과 같은 경우 명시적 구성을 사용하세요.

- SGLang이 다른 호스트나 포트에서 실행되는 경우
- `contextWindow`/`maxTokens` 값을 고정하려는 경우
- 서버에 실제 API 키가 필요하거나 헤더를 제어하려는 경우

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "로컬 SGLang 모델",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 고급 구성

<AccordionGroup>
  <Accordion title="프록시 방식 동작">
    SGLang은 네이티브 OpenAI 엔드포인트가 아니라 프록시 방식의 OpenAI 호환
    `/v1` 백엔드로 처리됩니다.

    | 동작 | SGLang |
    |----------|--------|
    | OpenAI 전용 요청 형식 조정 | 적용되지 않음 |
    | `service_tier`, Responses `store`, 프롬프트 캐시 힌트 | 전송되지 않음 |
    | 추론 호환 페이로드 형식 조정 | 적용되지 않음 |
    | 숨겨진 출처 헤더(`originator`, `version`, `User-Agent`) | 사용자 지정 SGLang 베이스 URL에는 삽입되지 않음 |

  </Accordion>

  <Accordion title="문제 해결">
    **서버에 연결할 수 없음**

    서버가 실행 중이고 응답하는지 확인합니다.

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **인증 오류**

    요청이 인증 오류로 실패하면 서버 구성과 일치하는 실제 `SGLANG_API_KEY`를
    설정하거나 `models.providers.sglang` 아래에서 제공자를 명시적으로 구성하세요.

    <Tip>
    인증 없이 SGLang을 실행하는 경우 모델 탐색에 옵트인하려면
    `SGLANG_API_KEY`에 비어 있지 않은 값을 지정하는 것으로 충분합니다.
    </Tip>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    제공자 항목을 포함한 전체 구성 스키마입니다.
  </Card>
</CardGroup>
