---
read_when:
    - 오디오 첨부 파일에 Deepgram speech-to-text를 사용하려고 합니다
    - 빠른 Deepgram 구성 예시가 필요합니다
summary: 인바운드 음성 노트를 위한 Deepgram 전사
title: Deepgram
x-i18n:
    generated_at: "2026-04-12T23:30:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 091523d6669e3d258f07c035ec756bd587299b6c7025520659232b1b2c1e21a5
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (오디오 전사)

Deepgram은 speech-to-text API입니다. OpenClaw에서는 `tools.media.audio`를 통한 **인바운드 오디오/음성 노트 전사**에 사용됩니다.

활성화되면 OpenClaw는 오디오 파일을 Deepgram에 업로드하고 전사문을 응답 파이프라인(`{{Transcript}}` + `[Audio]` 블록)에 주입합니다. 이는 **스트리밍이 아니며**,
사전 녹음 전사 엔드포인트를 사용합니다.

| 세부 정보    | 값                                                         |
| ------------ | ---------------------------------------------------------- |
| 웹사이트     | [deepgram.com](https://deepgram.com)                       |
| 문서         | [developers.deepgram.com](https://developers.deepgram.com) |
| 인증         | `DEEPGRAM_API_KEY`                                         |
| 기본 모델    | `nova-3`                                                   |

## 시작하기

<Steps>
  <Step title="API 키 설정">
    Deepgram API 키를 환경에 추가하세요:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="오디오 프로바이더 활성화">
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
  <Step title="음성 노트 전송">
    연결된 아무 채널에서나 오디오 메시지를 보내세요. OpenClaw가 Deepgram을 통해 이를 전사하고
    전사문을 응답 파이프라인에 주입합니다.
  </Step>
</Steps>

## 구성 옵션

| 옵션              | 경로                                                         | 설명                                  |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Deepgram 모델 id(기본값: `nova-3`)    |
| `language`        | `tools.media.audio.models[].language`                        | 언어 힌트(선택 사항)                  |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | 언어 감지 활성화(선택 사항)           |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | 문장 부호 활성화(선택 사항)           |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | 스마트 서식 활성화(선택 사항)         |

<Tabs>
  <Tab title="언어 힌트와 함께">
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
  <Tab title="Deepgram 옵션과 함께">
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

## 참고사항

<AccordionGroup>
  <Accordion title="인증">
    인증은 표준 프로바이더 인증 순서를 따릅니다. `DEEPGRAM_API_KEY`가
    가장 간단한 경로입니다.
  </Accordion>
  <Accordion title="프록시 및 사용자 지정 엔드포인트">
    프록시를 사용하는 경우 `tools.media.audio.baseUrl` 및
    `tools.media.audio.headers`로 엔드포인트 또는 헤더를 재정의하세요.
  </Accordion>
  <Accordion title="출력 동작">
    출력은 다른 프로바이더와 동일한 오디오 규칙(크기 제한, 타임아웃,
    전사문 주입)을 따릅니다.
  </Accordion>
</AccordionGroup>

<Note>
Deepgram 전사는 **사전 녹음 전용**입니다(실시간 스트리밍 아님). OpenClaw는
전체 오디오 파일을 업로드하고, 전체 전사문을 대화에 주입하기 전에
완료될 때까지 기다립니다.
</Note>

## 관련 문서

<CardGroup cols={2}>
  <Card title="미디어 도구" href="/tools/media" icon="photo-film">
    오디오, 이미지, 비디오 처리 파이프라인 개요.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    미디어 도구 설정을 포함한 전체 구성 참조.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계.
  </Card>
  <Card title="FAQ" href="/ko/help/faq" icon="circle-question">
    OpenClaw 설정에 관한 자주 묻는 질문.
  </Card>
</CardGroup>
