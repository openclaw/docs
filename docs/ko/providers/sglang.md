---
read_when:
    - 로컬 SGLang 서버에 연결해 OpenClaw를 실행하려고 합니다
    - 자체 모델과 함께 OpenAI 호환 `/v1` 엔드포인트를 사용하려고 합니다
summary: OpenClaw를 SGLang(OpenAI 호환 자체 호스팅 서버)과 함께 실행하기
title: SGLang
x-i18n:
    generated_at: "2026-04-12T23:32:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0a2e50a499c3d25dcdc3af425fb023c6e3f19ed88f533ecf0eb8a2cb7ec8b0d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang는 **OpenAI 호환** HTTP API를 통해 오픈 소스 모델을 제공할 수 있습니다.
OpenClaw는 `openai-completions` API를 사용해 SGLang에 연결할 수 있습니다.

또한 `SGLANG_API_KEY`로 옵트인하고 명시적인 `models.providers.sglang` 항목을 정의하지 않으면, OpenClaw는 SGLang에서 사용 가능한 모델을 **자동 검색**할 수 있습니다(SGLang 서버에서 인증을 강제하지 않는다면 어떤 값이든 작동합니다).

## 시작하기

<Steps>
  <Step title="SGLang 시작">
    OpenAI 호환 서버로 SGLang를 실행하세요. base URL은 `/v1` 엔드포인트를 노출해야 합니다(예: `/v1/models`, `/v1/chat/completions`). SGLang는 보통 다음에서 실행됩니다:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="API 키 설정">
    서버에 인증이 구성되어 있지 않다면 어떤 값이든 동작합니다:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="온보딩 실행 또는 모델 직접 설정">
    ```bash
    openclaw onboard
    ```

    또는 모델을 수동으로 구성할 수 있습니다:

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

## 모델 검색(암시적 provider)

`SGLANG_API_KEY`가 설정되어 있거나(또는 인증 프로필이 존재하고), **`models.providers.sglang`을 정의하지 않은 경우**, OpenClaw는 다음을 조회합니다:

- `GET http://127.0.0.1:30000/v1/models`

그리고 반환된 ID를 모델 항목으로 변환합니다.

<Note>
`models.providers.sglang`을 명시적으로 설정하면 자동 검색은 건너뛰며, 모델을 수동으로 정의해야 합니다.
</Note>

## 명시적 구성(수동 모델)

다음과 같은 경우에는 명시적 구성을 사용하세요:

- SGLang가 다른 호스트/포트에서 실행되는 경우
- `contextWindow`/`maxTokens` 값을 고정하고 싶은 경우
- 서버에 실제 API 키가 필요하거나(또는 헤더를 제어하고 싶은 경우)

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
  <Accordion title="프록시 스타일 동작">
    SGLang는 기본 OpenAI 엔드포인트가 아니라 프록시 스타일 OpenAI 호환 `/v1` 백엔드로 취급됩니다.

    | 동작 | SGLang |
    |----------|--------|
    | OpenAI 전용 요청 셰이핑 | 적용되지 않음 |
    | `service_tier`, Responses `store`, 프롬프트 캐시 힌트 | 전송되지 않음 |
    | 추론 호환 페이로드 셰이핑 | 적용되지 않음 |
    | 숨겨진 귀속 헤더(`originator`, `version`, `User-Agent`) | 사용자 지정 SGLang base URL에는 주입되지 않음 |

  </Accordion>

  <Accordion title="문제 해결">
    **서버에 연결할 수 없음**

    서버가 실행 중이고 응답하는지 확인하세요:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **인증 오류**

    요청이 인증 오류로 실패하면 서버 구성과 일치하는 실제 `SGLANG_API_KEY`를 설정하거나, `models.providers.sglang` 아래에 provider를 명시적으로 구성하세요.

    <Tip>
    인증 없이 SGLang를 실행하는 경우, `SGLANG_API_KEY`에 비어 있지 않은 아무 값이나 넣으면 모델 검색에 옵트인하기에 충분합니다.
    </Tip>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, 장애 조치 동작 선택하기.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    provider 항목을 포함한 전체 config 스키마.
  </Card>
</CardGroup>
