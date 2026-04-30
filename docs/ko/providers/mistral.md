---
read_when:
    - OpenClaw에서 Mistral 모델을 사용하려는 경우
    - 음성 통화에 Voxtral 실시간 전사를 사용하려는 경우
    - Mistral API 키 온보딩 및 모델 참조가 필요합니다
summary: OpenClaw에서 Mistral 모델과 Voxtral 전사 사용
title: Mistral
x-i18n:
    generated_at: "2026-04-30T06:47:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw는 텍스트/이미지 모델 라우팅(`mistral/...`)과 미디어 이해에서 Voxtral을 통한
오디오 전사 모두에 Mistral을 지원합니다.
Mistral은 메모리 임베딩(`memorySearch.provider = "mistral"`)에도 사용할 수 있습니다.

- 제공자: `mistral`
- 인증: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [Mistral Console](https://console.mistral.ai/)에서 API 키를 생성합니다.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    또는 키를 직접 전달합니다.

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
  <Step title="모델을 사용할 수 있는지 확인">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 내장 LLM 카탈로그

OpenClaw는 현재 이 번들 Mistral 카탈로그를 제공합니다.

| 모델 참조                       | 입력        | 컨텍스트 | 최대 출력 | 참고                                                            |
| -------------------------------- | ----------- | ------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | 텍스트, 이미지 | 262,144 | 16,384     | 기본 모델                                                    |
| `mistral/mistral-medium-2508`    | 텍스트, 이미지 | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | 텍스트, 이미지 | 128,000 | 16,384     | Mistral Small 4; API `reasoning_effort`를 통한 조정 가능한 추론 |
| `mistral/pixtral-large-latest`   | 텍스트, 이미지 | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | 텍스트        | 256,000 | 4,096      | 코딩                                                           |
| `mistral/devstral-medium-latest` | 텍스트        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | 텍스트        | 128,000 | 40,000     | 추론 활성화                                                |

## 오디오 전사(Voxtral)

미디어 이해 파이프라인을 통해 배치 오디오 전사에 Voxtral을 사용합니다.

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
미디어 전사 경로는 `/v1/audio/transcriptions`를 사용합니다. Mistral의 기본 오디오 모델은 `voxtral-mini-latest`입니다.
</Tip>

## Voice Call 스트리밍 STT

번들 `mistral` Plugin은 Voxtral Realtime을 Voice Call
스트리밍 STT 제공자로 등록합니다.

| 설정      | 구성 경로                                                            | 기본값                                 |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API 키      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY`로 폴백         |
| 모델        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| 인코딩     | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| 샘플 레이트  | `...mistral.sampleRate`                                                | `8000`                                  |
| 대상 지연 | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw는 기본적으로 Mistral 실시간 STT를 8 kHz의 `pcm_mulaw`로 설정하여 Voice Call이
Twilio 미디어 프레임을 직접 전달할 수 있게 합니다. 업스트림 스트림이 이미 원시 PCM인 경우에만
`encoding: "pcm_s16le"`와 일치하는 `sampleRate`를 사용하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="조정 가능한 추론(mistral-small-latest)">
    `mistral/mistral-small-latest`는 Mistral Small 4에 매핑되며, Chat Completions API에서 `reasoning_effort`를 통해 [조정 가능한 추론](https://docs.mistral.ai/capabilities/reasoning/adjustable)을 지원합니다(`none`은 출력의 추가 사고를 최소화하고, `high`는 최종 답변 전에 전체 사고 추적을 표시합니다).

    OpenClaw는 세션 **thinking** 수준을 Mistral의 API에 매핑합니다.

    | OpenClaw thinking 수준                          | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    다른 번들 Mistral 카탈로그 모델은 이 매개변수를 사용하지 않습니다. Mistral의 기본 추론 우선 동작을 원할 때는 `magistral-*` 모델을 계속 사용하세요.
    </Note>

  </Accordion>

  <Accordion title="메모리 임베딩">
    Mistral은 `/v1/embeddings`를 통해 메모리 임베딩을 제공할 수 있습니다(기본 모델: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="인증 및 기본 URL">
    - Mistral 인증은 `MISTRAL_API_KEY`를 사용합니다.
    - 제공자 기본 URL은 기본적으로 `https://api.mistral.ai/v1`입니다.
    - 온보딩 기본 모델은 `mistral/mistral-large-latest`입니다.
    - Z.AI는 API 키와 함께 Bearer 인증을 사용합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="미디어 이해" href="/ko/nodes/media-understanding" icon="microphone">
    오디오 전사 설정 및 제공자 선택.
  </Card>
</CardGroup>
