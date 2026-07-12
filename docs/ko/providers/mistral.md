---
read_when:
    - OpenClaw에서 Mistral 모델을 사용하려고 합니다
    - 음성 통화에 Voxtral 실시간 전사를 사용하려는 경우
    - Mistral API 키 온보딩 및 모델 참조가 필요합니다
summary: OpenClaw에서 Mistral 모델과 Voxtral 음성 변환 사용하기
title: Mistral
x-i18n:
    generated_at: "2026-07-12T01:07:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

번들 `mistral` Plugin은 네 가지 계약을 등록합니다. 채팅 완성, 미디어 이해(Voxtral 배치 음성 변환), Voice Call용 실시간 STT(Voxtral Realtime), 메모리 임베딩(`mistral-embed`)입니다.

| 속성             | 값                                          |
| ---------------- | ------------------------------------------- |
| 제공자 ID        | `mistral`                                   |
| Plugin           | 번들 제공, 기본적으로 활성화됨              |
| 인증 환경 변수   | `MISTRAL_API_KEY`                           |
| 온보딩 플래그    | `--auth-choice mistral-api-key`             |
| 직접 CLI 플래그  | `--mistral-api-key <key>`                   |
| API              | OpenAI 호환(`openai-completions`)           |
| 기본 URL         | `https://api.mistral.ai/v1`                 |
| 기본 모델        | `mistral/mistral-large-latest`              |
| 임베딩 모델      | `mistral-embed`                             |
| Voxtral 배치     | `voxtral-mini-latest`(오디오 음성 변환)     |
| Voxtral 실시간   | `voxtral-mini-transcribe-realtime-2602`     |

## 시작하기

<Steps>
  <Step title="API 키 가져오기">
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
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 기본 제공 LLM 카탈로그

| 모델 참조                        | 입력           | 컨텍스트 | 최대 출력  | 참고 사항                                             |
| -------------------------------- | -------------- | -------- | ---------- | ----------------------------------------------------- |
| `mistral/mistral-large-latest`   | 텍스트, 이미지 | 262,144  | 16,384     | 기본 모델                                             |
| `mistral/mistral-medium-2508`    | 텍스트, 이미지 | 262,144  | 8,192      | Mistral Medium 3.1                                    |
| `mistral/mistral-medium-3-5`     | 텍스트, 이미지 | 262,144  | 8,192      | Mistral Medium 3.5, 조정 가능한 추론                  |
| `mistral/mistral-small-latest`   | 텍스트, 이미지 | 262,144  | 16,384     | 최신 Mistral Small 4, 조정 가능한 `reasoning_effort` |
| `mistral/mistral-small-2603`     | 텍스트, 이미지 | 262,144  | 16,384     | 고정 버전 Mistral Small 4, 조정 가능한 `reasoning_effort` |
| `mistral/pixtral-large-latest`   | 텍스트, 이미지 | 128,000  | 32,768     | Pixtral                                               |
| `mistral/codestral-latest`       | 텍스트         | 256,000  | 4,096      | 코딩                                                  |
| `mistral/devstral-medium-latest` | 텍스트         | 262,144  | 32,768     | Devstral 2                                            |
| `mistral/magistral-small`        | 텍스트         | 128,000  | 40,000     | 추론 지원                                             |

구성을 변경하기 전에 번들 카탈로그 행을 확인합니다.

```bash
openclaw models list --all --provider mistral --plain
```

Gateway를 시작하지 않고 모델을 스모크 테스트합니다.

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## 오디오 음성 변환(Voxtral)

미디어 이해 파이프라인을 통한 배치 오디오 음성 변환에 Voxtral을 사용합니다.

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
미디어 음성 변환 경로는 `/v1/audio/transcriptions`를 사용합니다. Mistral의 기본 오디오 모델은 `voxtral-mini-latest`입니다.
</Tip>

## Voice Call 스트리밍 STT

번들 `mistral` Plugin은 Voxtral Realtime을 Voice Call 스트리밍 STT 제공자로 등록합니다.

| 설정        | 구성 경로                                                              | 기본값                                  |
| ----------- | ---------------------------------------------------------------------- | --------------------------------------- |
| API 키      | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | `MISTRAL_API_KEY`로 대체                |
| 모델        | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| 인코딩      | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| 샘플링 속도 | `...mistral.sampleRate`                                                | `8000`                                  |
| 목표 지연   | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

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
OpenClaw는 Voice Call이 Twilio 미디어 프레임을 직접 전달할 수 있도록 Mistral 실시간 STT의 기본값을 8kHz의 `pcm_mulaw`로 설정합니다. 업스트림 스트림이 이미 원시 PCM인 경우에만 `encoding: "pcm_s16le"`와 이에 맞는 `sampleRate`를 사용하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="조정 가능한 추론">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603`, `mistral/mistral-medium-3-5`는 Chat Completions API에서 `reasoning_effort`를 통해 [조정 가능한 추론](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable)을 지원합니다(`none`은 출력의 추가 사고를 최소화하고, `high`는 최종 답변 전에 전체 사고 추적을 표시합니다).

    OpenClaw는 세션의 **사고** 수준을 Mistral API에 다음과 같이 매핑합니다.

    | OpenClaw 사고 수준                                                    | Mistral `reasoning_effort` |
    | --------------------------------------------------------------------- | --------------------------- |
    | **꺼짐** / **최소**                                                   | `none`                      |
    | **낮음** / **중간** / **높음** / **매우 높음** / **적응형** / **최대** | `high`                     |

    <Warning>
    Medium 3.5 추론 모드와 `temperature: 0`을 함께 사용하지 마세요. Mistral HTTP API가 `reasoning_effort="high"`와 `temperature: 0`의 조합을 400 응답으로 거부하는 것으로 보고되었습니다. 낮은 온도를 설정하기 전에 온도를 설정하지 않은 상태로 두거나, 사고 수준을 꺼짐/최소로 설정하여 OpenClaw가 `reasoning_effort: "none"`을 전송하도록 하세요.
    </Warning>

    Medium 3.5 추론을 위한 모델 범위 구성 예시입니다.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    다른 번들 Mistral 카탈로그 모델은 이 매개변수를 사용하지 않습니다. Mistral의 기본 추론 우선 동작을 원한다면 계속해서 `magistral-*` 모델을 사용하세요.
    </Note>

  </Accordion>

  <Accordion title="메모리 임베딩">
    Mistral은 `/v1/embeddings`를 통해 메모리 임베딩을 제공할 수 있습니다(기본 모델: `mistral-embed`).

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="인증 및 기본 URL">
    - Mistral 인증은 `MISTRAL_API_KEY`를 사용합니다(Bearer 헤더).
    - 제공자 기본 URL은 `https://api.mistral.ai/v1`이며 표준 OpenAI 호환 채팅 완성 요청 형식을 허용합니다.
    - 온보딩 기본 모델은 `mistral/mistral-large-latest`입니다.
    - Mistral이 필요한 지역별 엔드포인트를 명시적으로 게시한 경우에만 `models.providers.mistral.baseUrl`에서 기본 URL을 재정의하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작 선택.
  </Card>
  <Card title="미디어 이해" href="/ko/nodes/media-understanding" icon="microphone">
    오디오 음성 변환 설정 및 제공자 선택.
  </Card>
</CardGroup>
