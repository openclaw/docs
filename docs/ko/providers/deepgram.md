---
read_when:
    - 오디오 첨부 파일에 Deepgram 음성-텍스트 변환을 사용하려는 경우
    - Voice Call에 Deepgram 스트리밍 음성 변환을 사용하려고 합니다
    - 간단한 Deepgram 구성 예제가 필요합니다
summary: 수신 음성 메모를 위한 Deepgram 음성 변환
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T15:35:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram은 음성을 텍스트로 변환하는 API입니다. OpenClaw은 `tools.media.audio`를 통한
수신 오디오/음성 메모 변환과 `plugins.entries.voice-call.config.streaming`을 통한
Voice Call 스트리밍 STT에 이를 사용합니다.

일괄 변환은 전체 오디오 파일을 Deepgram에 업로드하고 변환문을 응답 파이프라인에
삽입합니다(`{{Transcript}}` + `[Audio]` 블록). Voice Call 스트리밍은 실시간 G.711
u-law 프레임을 Deepgram의 WebSocket `listen` 엔드포인트로 전달하고, Deepgram에서
부분/최종 변환문이 반환되는 대로 이를 내보냅니다.

| 세부 정보     | 값                                                         |
| ------------- | ---------------------------------------------------------- |
| 웹사이트      | [deepgram.com](https://deepgram.com)                       |
| 문서          | [developers.deepgram.com](https://developers.deepgram.com) |
| 인증          | `DEEPGRAM_API_KEY`                                         |
| 기본 모델     | `nova-3`                                                   |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="오디오 제공자 활성화">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="음성 메모 보내기">
    연결된 채널을 통해 오디오 메시지를 보내십시오. OpenClaw은 Deepgram을 통해 이를
    변환하고 변환문을 응답 파이프라인에 삽입합니다.
  </Step>
</Steps>

## 구성 옵션

| 옵션       | 경로                                  | 설명                                  |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Deepgram 모델 ID(기본값: `nova-3`)    |
| `language` | `tools.media.audio.models[].language` | 언어 힌트(선택 사항)                  |

`providerOptions.deepgram`은 추가 쿼리 매개변수를 Deepgram `/listen` 요청에
직접 병합하므로 Deepgram에서 지원하는 모든 매개변수 이름을 사용할 수 있습니다
(예: `detect_language`, `punctuate`, `smart_format`).

<Tabs>
  <Tab title="언어 힌트 사용">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Deepgram 옵션 사용">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Voice Call 스트리밍 STT

번들로 제공되는 `deepgram` plugin은 Voice Call plugin용 실시간 변환 제공자도
등록합니다.

| 설정          | 구성 경로                                                                | 기본값                            |
| ------------- | ------------------------------------------------------------------------ | --------------------------------- |
| API 키        | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey`  | `DEEPGRAM_API_KEY`로 대체         |
| 모델          | `...deepgram.model`                                                      | `nova-3`                          |
| 언어          | `...deepgram.language`                                                   | (설정되지 않음)                   |
| 인코딩        | `...deepgram.encoding`                                                   | `mulaw`                           |
| 샘플 레이트   | `...deepgram.sampleRate`                                                 | `8000`                            |
| 엔드포인팅    | `...deepgram.endpointingMs`                                              | `800`                             |
| 중간 결과     | `...deepgram.interimResults`                                             | `true`                            |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
Voice Call은 전화 오디오를 8 kHz G.711 u-law 형식으로 수신합니다. Deepgram
스트리밍 제공자의 기본값은 `encoding: "mulaw"` 및 `sampleRate: 8000`이므로
Twilio 미디어 프레임을 직접 전달할 수 있습니다.
</Note>

## 참고 사항

<AccordionGroup>
  <Accordion title="인증">
    인증은 표준 제공자 인증 순서를 따릅니다. `DEEPGRAM_API_KEY`를 사용하는 것이
    가장 간단합니다.
  </Accordion>
  <Accordion title="프록시 및 사용자 지정 엔드포인트">
    프록시를 사용할 때는 `tools.media.audio.baseUrl` 및
    `tools.media.audio.headers`로 엔드포인트나 헤더를 재정의하십시오.
  </Accordion>
  <Accordion title="출력 동작">
    출력은 다른 제공자와 동일한 오디오 규칙(크기 제한, 시간 제한, 변환문 삽입)을
    따릅니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="미디어 도구" href="/ko/tools/media-overview" icon="photo-film">
    오디오, 이미지 및 동영상 처리 파이프라인의 개요입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    미디어 도구 설정을 포함한 전체 구성 참조입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계입니다.
  </Card>
  <Card title="FAQ" href="/ko/help/faq" icon="circle-question">
    OpenClaw 설정에 관해 자주 묻는 질문입니다.
  </Card>
</CardGroup>
