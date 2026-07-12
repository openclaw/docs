---
read_when:
    - 발신 응답에 Azure Speech 음성 합성을 사용하려는 경우
    - Azure Speech에서 네이티브 Ogg Opus 음성 메모 출력을 사용해야 합니다
summary: OpenClaw 응답을 위한 Azure AI Speech 텍스트 음성 변환
title: Azure 음성 서비스
x-i18n:
    generated_at: "2026-07-12T15:38:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech는 번들로 제공되는 Azure AI Speech 텍스트 음성 변환 제공자입니다. OpenClaw는
SSML을 사용하여 Azure Speech REST API를 직접 호출하며, 일반 응답에는 MP3를,
음성 메모에는 네이티브 Ogg/Opus를, Voice Call과 같은 전화 통신 채널에는
8 kHz mulaw를 합성합니다. 요청은 제공자가 소유한 출력 형식을
`X-Microsoft-OutputFormat` 헤더를 통해 전송합니다.

| 세부 정보               | 값                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| 제공자 ID               | `azure-speech`(별칭: `azure`)                                                                                  |
| 웹사이트                | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| 문서                    | [Speech REST 텍스트 음성 변환](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| 인증                    | `AZURE_SPEECH_KEY` 및 `AZURE_SPEECH_REGION`                                                                    |
| 기본 음성               | `en-US-JennyNeural`                                                                                            |
| 기본 파일 출력          | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| 기본 음성 메모 파일     | `ogg-24khz-16bit-mono-opus`                                                                                    |

## 시작하기

<Steps>
  <Step title="Azure Speech 리소스 만들기">
    Azure 포털에서 Speech 리소스를 만듭니다. Resource Management > Keys and Endpoint에서
    **KEY 1**을 복사하고, `eastus`와 같은 리소스 위치를 복사합니다.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="messages.tts에서 Azure Speech 선택하기">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="메시지 보내기">
    연결된 채널을 통해 응답을 보냅니다. OpenClaw는 Azure Speech로 오디오를 합성하여
    일반 오디오에는 MP3를 전달하고, 채널에서 음성 메모를 요구하는 경우에는
    Ogg/Opus를 전달합니다.
  </Step>
</Steps>

## 구성 옵션

모든 옵션은 `messages.tts.providers["azure-speech"]` 아래에 있습니다.

| 옵션                    | 설명                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | Azure Speech 리소스 키입니다. `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` 또는 `SPEECH_KEY`를 대체 값으로 사용합니다. |
| `region`                | Azure Speech 리소스 리전입니다. `AZURE_SPEECH_REGION` 또는 `SPEECH_REGION`을 대체 값으로 사용합니다.                 |
| `endpoint`              | 선택적 Azure Speech 엔드포인트 재정의입니다. `AZURE_SPEECH_ENDPOINT`를 대체 값으로 사용합니다.                       |
| `baseUrl`               | 선택적 Azure Speech 기본 URL 재정의입니다.                                                              |
| `voice`                 | Azure 음성 ShortName입니다(기본값: `en-US-JennyNeural`). 레거시 별칭: `voiceId`.                         |
| `lang`                  | SSML 언어 코드입니다(기본값: `en-US`).                                                                 |
| `outputFormat`          | 오디오 파일 출력 형식입니다(기본값: `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | 음성 메모 출력 형식입니다(기본값: `ogg-24khz-16bit-mono-opus`).                                       |
| `timeoutMs`             | 요청 제한 시간을 밀리초 단위로 재정의합니다. 전역 `messages.tts.timeoutMs`를 대체 값으로 사용합니다.          |

`apiKey`와 함께 `region`, `endpoint` 또는 `baseUrl` 중 하나가 설정되면
제공자가 구성된 것으로 간주합니다. 환경 변수는 설정되지 않은 구성 키에 대한
대체 값으로만 확인합니다.

## 참고 사항

<AccordionGroup>
  <Accordion title="인증">
    Azure Speech는 Azure OpenAI 키가 아니라 Speech 리소스 키를 사용합니다. 키는
    `Ocp-Apim-Subscription-Key`로 전송되며, `endpoint` 또는 `baseUrl`을 제공하지 않으면
    OpenClaw는 `region`에서 `https://<region>.tts.speech.microsoft.com`을 도출합니다.
  </Accordion>
  <Accordion title="음성 이름">
    `en-US-JennyNeural`과 같은 Azure Speech 음성의 `ShortName` 값을 사용합니다.
    번들 제공자는 동일한 Speech 리소스를 통해 음성 목록을 조회할 수 있으며,
    더 이상 사용되지 않거나 폐기되었거나 비활성화된 것으로 표시된 음성을 제외합니다.
  </Accordion>
  <Accordion title="오디오 출력">
    Azure는 `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus`, `riff-24khz-16bit-mono-pcm`과 같은 출력 형식을
    허용합니다. OpenClaw는 채널에서 별도의 MP3 변환 없이 네이티브 음성 말풍선을
    전송할 수 있도록 `voice-note` 대상에 Ogg/Opus를 요청하며, 전화 통신 대상에는
    `raw-8khz-8bit-mono-mulaw`를 강제로 사용합니다.
  </Accordion>
  <Accordion title="별칭">
    기존 구성에서는 `azure`가 제공자 별칭으로 허용되지만, Azure OpenAI 모델 제공자와의
    혼동을 피하려면 새 구성에서 `azure-speech`를 사용해야 합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="텍스트 음성 변환" href="/ko/tools/tts" icon="waveform-lines">
    TTS 개요, 제공자 및 `messages.tts` 구성입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    `messages.tts` 설정을 포함한 전체 구성 참조입니다.
  </Card>
  <Card title="제공자" href="/ko/providers" icon="grid">
    번들로 제공되는 모든 OpenClaw 제공자입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계입니다.
  </Card>
</CardGroup>
