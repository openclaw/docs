---
read_when:
    - Giden yanıtlar için Azure Speech sentezi kullanmak istiyorsunuz
    - Azure Speech'ten yerel Ogg Opus sesli not çıktısına ihtiyacınız var
summary: OpenClaw yanıtları için Azure AI Speech metinden konuşmaya özelliği
title: Azure Konuşma
x-i18n:
    generated_at: "2026-07-12T12:38:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech, paketle birlikte sunulan bir Azure AI Speech metinden sese sağlayıcısıdır. OpenClaw,
SSML kullanarak Azure Speech REST API'sini doğrudan çağırır; standart yanıtlar
için MP3, sesli notlar için yerel Ogg/Opus ve Voice Call gibi telefon
kanalları için 8 kHz mulaw sentezler. İstek, sağlayıcının sahip olduğu
çıktı biçimini `X-Microsoft-OutputFormat` başlığı üzerinden gönderir.

| Ayrıntı                      | Değer                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Sağlayıcı kimliği            | `azure-speech` (takma ad: `azure`)                                                                             |
| Web sitesi                   | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Belgeler                     | [Speech REST metinden sese](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)  |
| Kimlik doğrulama             | `AZURE_SPEECH_KEY` ile `AZURE_SPEECH_REGION`                                                                   |
| Varsayılan ses               | `en-US-JennyNeural`                                                                                            |
| Varsayılan dosya çıktısı     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Varsayılan sesli not dosyası | `ogg-24khz-16bit-mono-opus`                                                                                    |

## Başlarken

<Steps>
  <Step title="Bir Azure Speech kaynağı oluşturun">
    Azure portalında bir Speech kaynağı oluşturun. Resource Management > Keys and Endpoint
    bölümündeki **KEY 1** değerini ve `eastus` gibi kaynak konumunu
    kopyalayın.

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
    Bağlı herhangi bir kanal üzerinden yanıt gönderin. OpenClaw, sesi
    Azure Speech ile sentezler ve standart ses için MP3, kanal bir sesli not
    beklediğinde ise Ogg/Opus olarak iletir.
  </Step>
</Steps>

## Yapılandırma seçenekleri

Tüm seçenekler `messages.tts.providers["azure-speech"]` altında bulunur.

| Seçenek                 | Açıklama                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `apiKey`                | Azure Speech kaynak anahtarı. Ayarlanmazsa `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` veya `SPEECH_KEY` kullanılır.   |
| `region`                | Azure Speech kaynak bölgesi. Ayarlanmazsa `AZURE_SPEECH_REGION` veya `SPEECH_REGION` kullanılır.                      |
| `endpoint`              | İsteğe bağlı Azure Speech uç noktası geçersiz kılma değeri. Ayarlanmazsa `AZURE_SPEECH_ENDPOINT` kullanılır.          |
| `baseUrl`               | İsteğe bağlı Azure Speech temel URL'si geçersiz kılma değeri.                                                         |
| `voice`                 | Azure sesinin ShortName değeri (varsayılan: `en-US-JennyNeural`). Eski takma ad: `voiceId`.                           |
| `lang`                  | SSML dil kodu (varsayılan: `en-US`).                                                                                  |
| `outputFormat`          | Ses dosyası çıktı biçimi (varsayılan: `audio-24khz-48kbitrate-mono-mp3`).                                             |
| `voiceNoteOutputFormat` | Sesli not çıktı biçimi (varsayılan: `ogg-24khz-16bit-mono-opus`).                                                     |
| `timeoutMs`             | Milisaniye cinsinden istek zaman aşımı geçersiz kılma değeri. Ayarlanmazsa genel `messages.tts.timeoutMs` kullanılır. |

`apiKey` ile birlikte `region`, `endpoint` veya `baseUrl` seçeneklerinden biri
ayarlandığında sağlayıcı yapılandırılmış kabul edilir. Ortam değişkenleri yalnızca
ayarlanmamış yapılandırma anahtarları için yedek olarak denetlenir.

## Notlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama">
    Azure Speech, Azure OpenAI anahtarı değil, bir Speech kaynak anahtarı kullanır. Anahtar
    `Ocp-Apim-Subscription-Key` olarak gönderilir; `endpoint` veya `baseUrl`
    sağlamadığınız sürece OpenClaw, `region` değerinden
    `https://<region>.tts.speech.microsoft.com` adresini türetir.
  </Accordion>
  <Accordion title="Ses adları">
    Azure Speech sesinin `ShortName` değerini kullanın; örneğin
    `en-US-JennyNeural`. Paketle birlikte sunulan sağlayıcı, aynı Speech kaynağı
    üzerinden sesleri listeleyebilir ve kullanımdan kaldırılmış, hizmetten çekilmiş
    veya devre dışı olarak işaretlenen sesleri filtreler.
  </Accordion>
  <Accordion title="Ses çıktıları">
    Azure; `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` ve `riff-24khz-16bit-mono-pcm` gibi çıktı
    biçimlerini kabul eder. OpenClaw, kanalların ek bir MP3 dönüştürmesi olmadan
    yerel ses baloncukları gönderebilmesi için `voice-note` hedeflerinde Ogg/Opus
    ister ve telefon hedeflerinde `raw-8khz-8bit-mono-mulaw` biçimini zorunlu kılar.
  </Accordion>
  <Accordion title="Takma ad">
    Mevcut yapılandırmalar için `azure` sağlayıcı takma adı kabul edilir ancak
    Azure OpenAI model sağlayıcılarıyla karışıklığı önlemek amacıyla yeni
    yapılandırmalarda `azure-speech` kullanılmalıdır.
  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Metinden sese" href="/tr/tools/tts" icon="waveform-lines">
    TTS'ye, sağlayıcılara ve `messages.tts` yapılandırmasına genel bakış.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    `messages.tts` ayarlarını da içeren eksiksiz yapılandırma başvurusu.
  </Card>
  <Card title="Sağlayıcılar" href="/tr/providers" icon="grid">
    Paketle birlikte sunulan tüm OpenClaw sağlayıcıları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
</CardGroup>
