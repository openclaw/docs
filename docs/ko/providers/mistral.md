---
read_when:
    - OpenClaw에서 Mistral 모델을 사용하고 싶습니다.
    - Mistral API 키 온보딩과 모델 ref가 필요합니다.
summary: OpenClaw에서 Mistral 모델과 Voxtral 전사를 사용하기
title: Mistral
x-i18n:
    generated_at: "2026-04-21T13:37:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e87d04e3d45c04280c90821b1addd87dd612191249836747fba27cde48b9890f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw는 텍스트/이미지 모델 라우팅(`mistral/...`)과 미디어 이해의 Voxtral 오디오 전사 모두에 대해 Mistral을 지원합니다.
Mistral은 메모리 임베딩에도 사용할 수 있습니다(`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- 인증: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [Mistral Console](https://console.mistral.ai/)에서 API 키를 생성하세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    또는 키를 직접 전달하세요:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="기본 모델 설정">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 내장 LLM 카탈로그

OpenClaw는 현재 다음 번들된 Mistral 카탈로그를 제공합니다:

| Model ref                        | 입력        | 컨텍스트 | 최대 출력 | 참고                                                             |
| -------------------------------- | ----------- | -------- | --------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | 텍스트, 이미지 | 262,144  | 16,384    | 기본 모델                                                        |
| `mistral/mistral-medium-2508`    | 텍스트, 이미지 | 262,144  | 8,192     | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | 텍스트, 이미지 | 128,000  | 16,384    | Mistral Small 4; API `reasoning_effort` 를 통한 조정 가능한 reasoning |
| `mistral/pixtral-large-latest`   | 텍스트, 이미지 | 128,000  | 32,768    | Pixtral                                                          |
| `mistral/codestral-latest`       | 텍스트       | 256,000  | 4,096     | 코딩                                                             |
| `mistral/devstral-medium-latest` | 텍스트       | 262,144  | 32,768    | Devstral 2                                                       |
| `mistral/magistral-small`        | 텍스트       | 128,000  | 40,000    | reasoning 지원                                                   |

## 오디오 전사(Voxtral)

미디어 이해 파이프라인을 통해 오디오 전사에 Voxtral을 사용하세요.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
미디어 전사 경로는 `/v1/audio/transcriptions` 를 사용합니다. Mistral의 기본 오디오 모델은 `voxtral-mini-latest` 입니다.
</Tip>

## 고급 구성

<AccordionGroup>
  <Accordion title="조정 가능한 reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` 는 Mistral Small 4에 매핑되며, Chat Completions API에서 `reasoning_effort` 를 통해 [조정 가능한 reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) 을 지원합니다(`none` 은 출력에서 추가 사고를 최소화하고, `high` 는 최종 답변 전에 전체 사고 추적을 표시합니다).

    OpenClaw는 세션 **thinking** 수준을 Mistral API에 다음과 같이 매핑합니다:

    | OpenClaw thinking level                          | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    다른 번들된 Mistral 카탈로그 모델은 이 파라미터를 사용하지 않습니다. Mistral의 기본 reasoning 우선 동작을 원한다면 계속 `magistral-*` 모델을 사용하세요.
    </Note>

  </Accordion>

  <Accordion title="메모리 임베딩">
    Mistral은 `/v1/embeddings` 를 통해 메모리 임베딩을 제공할 수 있습니다(기본 모델: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="인증 및 base URL">
    - Mistral 인증은 `MISTRAL_API_KEY` 를 사용합니다.
    - Provider base URL 기본값은 `https://api.mistral.ai/v1` 입니다.
    - 온보딩 기본 모델은 `mistral/mistral-large-latest` 입니다.
    - Z.AI는 API 키와 함께 Bearer 인증을 사용합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, model ref, 장애 조치 동작 선택.
  </Card>
  <Card title="미디어 이해" href="/tools/media-understanding" icon="microphone">
    오디오 전사 설정 및 provider 선택.
  </Card>
</CardGroup>
