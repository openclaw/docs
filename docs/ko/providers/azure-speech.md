---
read_when:
    - 아웃바운드 응답에 Azure Speech synthesis를 사용하려고 합니다
    - Azure Speech에서 네이티브 Ogg Opus 음성 노트 출력이 필요합니다
summary: OpenClaw 응답용 Azure AI Speech 텍스트 음성 변환
title: Azure Speech
x-i18n:
    generated_at: "2026-04-26T11:37:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 15
---

Azure Speech는 Azure AI Speech 텍스트 음성 변환 provider입니다. OpenClaw에서는
기본적으로 아웃바운드 응답 오디오를 MP3로 합성하고, 음성 노트에는 네이티브 Ogg/Opus를,
Voice Call과 같은 전화 채널에는 8 kHz mulaw 오디오를 사용합니다.

OpenClaw는 SSML과 함께 Azure Speech REST API를 직접 사용하며,
provider 소유의 출력 형식을 `X-Microsoft-OutputFormat`을 통해 전송합니다.

| 세부 정보 | 값 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| 웹사이트 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech) |
| 문서 | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| 인증 | `AZURE_SPEECH_KEY` 및 `AZURE_SPEECH_REGION` |
| 기본 음성 | `en-US-JennyNeural` |
| 기본 파일 출력 | `audio-24khz-48kbitrate-mono-mp3` |
| 기본 음성 노트 파일 | `ogg-24khz-16bit-mono-opus` |

## 시작하기

<Steps>
  <Step title="Azure Speech 리소스 만들기">
    Azure 포털에서 Speech 리소스를 만듭니다. Resource Management > Keys and Endpoint에서 **KEY 1**을 복사하고,
    `eastus`와 같은 리소스 위치도 복사합니다.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="messages.tts에서 Azure Speech 선택">
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
    연결된 아무 채널에서나 응답을 보냅니다. OpenClaw가 Azure Speech로 오디오를 합성하고
    일반 오디오에는 MP3를, 채널이 음성 노트를 기대하는 경우에는 Ogg/Opus를 전달합니다.
  </Step>
</Steps>

## 구성 옵션

| 옵션 | 경로 | 설명 |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey` | `messages.tts.providers.azure-speech.apiKey` | Azure Speech 리소스 키입니다. `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, 또는 `SPEECH_KEY`로 대체됩니다. |
| `region` | `messages.tts.providers.azure-speech.region` | Azure Speech 리소스 리전입니다. `AZURE_SPEECH_REGION` 또는 `SPEECH_REGION`으로 대체됩니다. |
| `endpoint` | `messages.tts.providers.azure-speech.endpoint` | 선택 사항인 Azure Speech 엔드포인트/기본 URL 재정의입니다. |
| `baseUrl` | `messages.tts.providers.azure-speech.baseUrl` | 선택 사항인 Azure Speech 기본 URL 재정의입니다. |
| `voice` | `messages.tts.providers.azure-speech.voice` | Azure 음성 ShortName 값입니다(기본값 `en-US-JennyNeural`). |
| `lang` | `messages.tts.providers.azure-speech.lang` | SSML 언어 코드입니다(기본값 `en-US`). |
| `outputFormat` | `messages.tts.providers.azure-speech.outputFormat` | 오디오 파일 출력 형식입니다(기본값 `audio-24khz-48kbitrate-mono-mp3`). |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | 음성 노트 출력 형식입니다(기본값 `ogg-24khz-16bit-mono-opus`). |

## 참고 사항

<AccordionGroup>
  <Accordion title="인증">
    Azure Speech는 Azure OpenAI 키가 아니라 Speech 리소스 키를 사용합니다. 이 키는
    `Ocp-Apim-Subscription-Key`로 전송되며, OpenClaw는
    `endpoint` 또는 `baseUrl`을 제공하지 않으면 `region`에서
    `https://<region>.tts.speech.microsoft.com`를 도출합니다.
  </Accordion>
  <Accordion title="음성 이름">
    예를 들어 `en-US-JennyNeural`과 같은 Azure Speech 음성의 `ShortName` 값을 사용하세요.
    번들된 provider는 동일한 Speech 리소스를 통해 음성 목록을 가져올 수 있으며,
    deprecated 또는 retired로 표시된 음성은 필터링합니다.
  </Accordion>
  <Accordion title="오디오 출력">
    Azure는 `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus`, `riff-24khz-16bit-mono-pcm`과 같은 출력 형식을 지원합니다. OpenClaw는
    `voice-note` 대상에 대해 Ogg/Opus를 요청하므로 채널이 추가 MP3 변환 없이
    네이티브 음성 버블을 보낼 수 있습니다.
  </Accordion>
  <Accordion title="별칭">
    기존 PR과 사용자 구성에서는 provider 별칭으로 `azure`도 허용되지만,
    Azure OpenAI 모델 provider와의 혼동을 피하려면 새 구성에서는 `azure-speech`를 사용해야 합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="텍스트 음성 변환" href="/ko/tools/tts" icon="waveform-lines">
    TTS 개요, provider, 그리고 `messages.tts` 구성.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    `messages.tts` 설정을 포함한 전체 구성 참조.
  </Card>
  <Card title="Providers" href="/ko/providers" icon="grid">
    번들된 모든 OpenClaw provider.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 디버깅 단계.
  </Card>
</CardGroup>
