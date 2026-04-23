---
read_when:
    - 오디오 첨부 파일에 Deepgram 음성-텍스트 변환을 사용하려고 합니다.
    - Voice Call용 Deepgram 스트리밍 전사를 사용하려고 합니다.
    - 빠른 Deepgram config 예시가 필요합니다.
summary: 수신 음성 메모용 Deepgram 전사
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T14:06:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b05f0f436a723c6e7697612afa0f8cb7e2b84a722d4ec12fae9c0bece945407
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (오디오 전사)

Deepgram은 음성-텍스트 변환 API입니다. OpenClaw에서는
`tools.media.audio`를 통한 수신 오디오/음성 메모 전사와
`plugins.entries.voice-call.config.streaming`을 통한 Voice Call
스트리밍 STT에 사용됩니다.

배치 전사의 경우 OpenClaw는 전체 오디오 파일을 Deepgram에 업로드하고
전사문을 응답 파이프라인(`{{Transcript}}` +
`[Audio]` 블록)에 주입합니다. Voice Call 스트리밍의 경우 OpenClaw는 실시간 G.711
u-law 프레임을 Deepgram의 WebSocket `listen` 엔드포인트로 전달하고, Deepgram이 반환하는 대로 부분 또는
최종 전사문을 내보냅니다.

| 세부 정보     | 값                                                         |
| ------------- | ---------------------------------------------------------- |
| 웹사이트      | [deepgram.com](https://deepgram.com)                       |
| 문서          | [developers.deepgram.com](https://developers.deepgram.com) |
| 인증          | `DEEPGRAM_API_KEY`                                         |
| 기본 모델     | `nova-3`                                                   |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    환경에 Deepgram API 키를 추가하세요:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="오디오 provider 활성화">
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
    연결된 아무 채널에서나 오디오 메시지를 보내세요. OpenClaw가 이를
    Deepgram으로 전사하고 전사문을 응답 파이프라인에 주입합니다.
  </Step>
</Steps>

## 구성 옵션

| 옵션              | 경로                                                         | 설명                                  |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Deepgram 모델 id(기본값: `nova-3`)    |
| `language`        | `tools.media.audio.models[].language`                        | 언어 힌트(선택 사항)                  |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | 언어 감지 활성화(선택 사항)           |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | 문장 부호 활성화(선택 사항)           |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | 스마트 포맷 활성화(선택 사항)         |

<Tabs>
  <Tab title="언어 힌트 포함">
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
  <Tab title="Deepgram 옵션 포함">
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

번들된 `deepgram` plugin은 Voice Call plugin용 실시간 전사 provider도 등록합니다.

| 설정              | config 경로                                                            | 기본값                           |
| ----------------- | ---------------------------------------------------------------------- | -------------------------------- |
| API 키            | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | `DEEPGRAM_API_KEY`로 폴백        |
| 모델              | `...deepgram.model`                                                     | `nova-3`                         |
| 언어              | `...deepgram.language`                                                  | (설정 안 됨)                     |
| 인코딩            | `...deepgram.encoding`                                                  | `mulaw`                          |
| 샘플 레이트       | `...deepgram.sampleRate`                                                | `8000`                           |
| 엔드포인팅        | `...deepgram.endpointingMs`                                             | `800`                            |
| 중간 결과         | `...deepgram.interimResults`                                            | `true`                           |

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
Voice Call은 전화 오디오를 8 kHz G.711 u-law로 수신합니다. Deepgram
스트리밍 provider는 기본적으로 `encoding: "mulaw"`와 `sampleRate: 8000`을 사용하므로
Twilio 미디어 프레임을 직접 전달할 수 있습니다.
</Note>

## 참고

<AccordionGroup>
  <Accordion title="인증">
    인증은 표준 provider 인증 순서를 따릅니다. 가장 간단한 경로는 `DEEPGRAM_API_KEY`입니다.
  </Accordion>
  <Accordion title="프록시 및 사용자 정의 엔드포인트">
    프록시를 사용할 때는 `tools.media.audio.baseUrl`과
    `tools.media.audio.headers`로 엔드포인트 또는 헤더를 재정의하세요.
  </Accordion>
  <Accordion title="출력 동작">
    출력은 다른 provider와 동일한 오디오 규칙을 따릅니다(크기 제한, 타임아웃,
    전사문 주입).
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="미디어 도구" href="/ko/tools/media-overview" icon="photo-film">
    오디오, 이미지, 비디오 처리 파이프라인 개요.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    미디어 도구 설정을 포함한 전체 config 참조.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 및 디버깅 단계.
  </Card>
  <Card title="FAQ" href="/ko/help/faq" icon="circle-question">
    OpenClaw 설정에 대한 자주 묻는 질문.
  </Card>
</CardGroup>
