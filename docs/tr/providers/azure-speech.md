---
read_when:
    - Giden yanıtlar için Azure Speech sentezi istiyorsunuz
    - Azure Speech’ten yerel Ogg Opus sesli not çıktısına ihtiyacınız var
summary: OpenClaw yanıtları için Azure AI Speech metinden sese
title: Azure Speech
x-i18n:
    generated_at: "2026-06-28T01:08:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech, bir Azure AI Speech metinden konuşmaya sağlayıcısıdır. OpenClaw içinde
giden yanıt sesini varsayılan olarak MP3, ses notları için yerel Ogg/Opus ve
Voice Call gibi telefon kanalları için 8 kHz mulaw ses olarak sentezler.

OpenClaw, Azure Speech REST API'sini SSML ile doğrudan kullanır ve
sağlayıcının sahip olduğu çıktı biçimini `X-Microsoft-OutputFormat` üzerinden gönderir.

| Ayrıntı                 | Değer                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Web sitesi              | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Belgeler                | [Speech REST metinden konuşmaya](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Kimlik doğrulama        | `AZURE_SPEECH_KEY` artı `AZURE_SPEECH_REGION`                                                                  |
| Varsayılan ses          | `en-US-JennyNeural`                                                                                            |
| Varsayılan dosya çıktısı | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Varsayılan ses notu dosyası | `ogg-24khz-16bit-mono-opus`                                                                                    |

## Başlarken

<Steps>
  <Step title="Create an Azure Speech resource">
    Azure portalında bir Speech kaynağı oluşturun. Resource Management > Keys
    and Endpoint bölümünden **KEY 1** değerini kopyalayın ve `eastus` gibi
    kaynak konumunu kopyalayın.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Select Azure Speech in messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Send a message">
    Bağlı herhangi bir kanal üzerinden yanıt gönderin. OpenClaw sesi Azure Speech
    ile sentezler ve standart ses için MP3 ya da kanal bir ses notu beklediğinde
    Ogg/Opus iletir.
  </Step>
</Steps>

## Yapılandırma seçenekleri

| Seçenek                 | Yol                                                         | Açıklama                                                                                              |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Azure Speech kaynak anahtarı. `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` veya `SPEECH_KEY` değerine geri döner. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Azure Speech kaynak bölgesi. `AZURE_SPEECH_REGION` veya `SPEECH_REGION` değerine geri döner.          |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | İsteğe bağlı Azure Speech uç noktası/temel URL geçersiz kılması.                                      |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | İsteğe bağlı Azure Speech temel URL geçersiz kılması.                                                 |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | Azure ses ShortName değeri (varsayılan `en-US-JennyNeural`). Eski takma ad: `voice`.                  |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | SSML dil kodu (varsayılan `en-US`).                                                                  |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Ses dosyası çıktı biçimi (varsayılan `audio-24khz-48kbitrate-mono-mp3`).                              |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Ses notu çıktı biçimi (varsayılan `ogg-24khz-16bit-mono-opus`).                                       |

## Notlar

<AccordionGroup>
  <Accordion title="Authentication">
    Azure Speech bir Speech kaynak anahtarı kullanır, Azure OpenAI anahtarı
    kullanmaz. Anahtar `Ocp-Apim-Subscription-Key` olarak gönderilir; OpenClaw,
    `endpoint` veya `baseUrl` sağlamadığınız sürece `region` değerinden
    `https://<region>.tts.speech.microsoft.com` adresini türetir.
  </Accordion>
  <Accordion title="Voice names">
    Azure Speech ses `ShortName` değerini kullanın; örneğin
    `en-US-JennyNeural`. Birlikte gelen sağlayıcı, aynı Speech kaynağı üzerinden
    sesleri listeleyebilir ve kullanım dışı ya da emekliye ayrılmış olarak
    işaretlenen sesleri filtreler.
  </Accordion>
  <Accordion title="Audio outputs">
    Azure, `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` ve `riff-24khz-16bit-mono-pcm` gibi çıktı
    biçimlerini kabul eder. OpenClaw, kanalların ek MP3 dönüştürmesi olmadan
    yerel ses baloncukları gönderebilmesi için `voice-note` hedeflerinde
    Ogg/Opus ister.
  </Accordion>
  <Accordion title="Alias">
    `azure`, mevcut PR'lar ve kullanıcı yapılandırması için sağlayıcı takma adı
    olarak kabul edilir; ancak yeni yapılandırma, Azure OpenAI model
    sağlayıcılarıyla karışıklığı önlemek için `azure-speech` kullanmalıdır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/tr/tools/tts" icon="waveform-lines">
    TTS genel bakışı, sağlayıcılar ve `messages.tts` yapılandırması.
  </Card>
  <Card title="Configuration" href="/tr/gateway/configuration" icon="gear">
    `messages.tts` ayarları dahil tam yapılandırma başvurusu.
  </Card>
  <Card title="Providers" href="/tr/providers" icon="grid">
    Birlikte gelen tüm OpenClaw sağlayıcıları.
  </Card>
  <Card title="Troubleshooting" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
</CardGroup>
