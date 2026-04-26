---
read_when:
    - Giden yanıtlar için Azure Speech sentezi istiyorsunuz
    - Azure Speech'ten yerel Ogg Opus sesli not çıktısına ihtiyacınız var
summary: OpenClaw yanıtları için Azure AI Speech text-to-speech
title: Azure Speech
x-i18n:
    generated_at: "2026-04-26T11:38:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 15
---

Azure Speech, bir Azure AI Speech text-to-speech sağlayıcısıdır. OpenClaw içinde
giden yanıt sesini varsayılan olarak MP3, sesli notlar için yerel Ogg/Opus
ve Voice Call gibi telefon kanalları için 8 kHz mulaw ses olarak sentezler.

OpenClaw, Azure Speech REST API'sini doğrudan SSML ile kullanır ve
sağlayıcı sahipli çıktı biçimini `X-Microsoft-OutputFormat` üzerinden gönderir.

| Ayrıntı                 | Değer                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Website                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                   |
| Dokümanlar              | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Kimlik doğrulama        | `AZURE_SPEECH_KEY` artı `AZURE_SPEECH_REGION`                                                                    |
| Varsayılan ses          | `en-US-JennyNeural`                                                                                              |
| Varsayılan dosya çıktısı | `audio-24khz-48kbitrate-mono-mp3`                                                                                |
| Varsayılan sesli not dosyası | `ogg-24khz-16bit-mono-opus`                                                                                 |

## Başlarken

<Steps>
  <Step title="Bir Azure Speech kaynağı oluşturun">
    Azure portalında bir Speech kaynağı oluşturun. Resource Management > Keys and Endpoint bölümünden **KEY 1** değerini kopyalayın ve `eastus` gibi kaynak konumunu da kopyalayın.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="messages.tts içinde Azure Speech'i seçin">
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
  <Step title="Bir mesaj gönderin">
    Bağlı herhangi bir kanal üzerinden bir yanıt gönderin. OpenClaw sesi
    Azure Speech ile sentezler ve standart ses için MP3, kanal
    sesli not beklediğinde ise Ogg/Opus teslim eder.
  </Step>
</Steps>

## Yapılandırma seçenekleri

| Seçenek                 | Yol                                                         | Açıklama                                                                                                  |
| ----------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Azure Speech kaynak anahtarı. `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` veya `SPEECH_KEY` değerlerine fallback yapar. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Azure Speech kaynak bölgesi. `AZURE_SPEECH_REGION` veya `SPEECH_REGION` değerlerine fallback yapar.      |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | İsteğe bağlı Azure Speech uç noktası/base URL geçersiz kılması.                                           |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | İsteğe bağlı Azure Speech base URL geçersiz kılması.                                                      |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | Azure ses `ShortName` değeri (varsayılan `en-US-JennyNeural`).                                            |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | SSML dil kodu (varsayılan `en-US`).                                                                       |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Ses dosyası çıktı biçimi (varsayılan `audio-24khz-48kbitrate-mono-mp3`).                                  |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Sesli not çıktı biçimi (varsayılan `ogg-24khz-16bit-mono-opus`).                                          |

## Notlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama">
    Azure Speech, Azure OpenAI anahtarı değil, bir Speech kaynak anahtarı kullanır. Anahtar
    `Ocp-Apim-Subscription-Key` olarak gönderilir; OpenClaw, siz
    `endpoint` veya `baseUrl` sağlamadığınız sürece `region` değerinden
    `https://<region>.tts.speech.microsoft.com` türetir.
  </Accordion>
  <Accordion title="Ses adları">
    Azure Speech ses `ShortName` değerini kullanın; örneğin
    `en-US-JennyNeural`. Paketlenmiş sağlayıcı sesleri aynı Speech kaynağı üzerinden listeleyebilir
    ve kullanımdan kaldırılmış veya emekliye ayrılmış olarak işaretlenen sesleri filtreler.
  </Accordion>
  <Accordion title="Ses çıktıları">
    Azure; `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` ve `riff-24khz-16bit-mono-pcm` gibi çıktı biçimlerini kabul eder. OpenClaw,
    `voice-note` hedefleri için Ogg/Opus ister; böylece kanallar ekstra MP3 dönüştürmesi olmadan
    yerel ses baloncukları gönderebilir.
  </Accordion>
  <Accordion title="Takma ad">
    `azure`, mevcut PR'ler ve kullanıcı config'i için sağlayıcı takma adı olarak kabul edilir,
    ancak yeni config, Azure
    OpenAI model sağlayıcılarıyla karışıklığı önlemek için `azure-speech` kullanmalıdır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/tr/tools/tts" icon="waveform-lines">
    TTS genel bakışı, sağlayıcılar ve `messages.tts` config'i.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    `messages.tts` ayarları dahil tam config referansı.
  </Card>
  <Card title="Sağlayıcılar" href="/tr/providers" icon="grid">
    Tüm paketlenmiş OpenClaw sağlayıcıları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
</CardGroup>
