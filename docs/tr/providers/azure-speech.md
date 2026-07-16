---
read_when:
    - Giden yanıtlar için Azure Speech sentezi kullanmak istiyorsunuz
    - Azure Speech'ten yerel Ogg Opus sesli not çıktısına ihtiyacınız var
summary: OpenClaw yanıtları için Azure AI Speech metinden konuşmaya dönüştürme özelliği
title: Azure Konuşma Hizmeti
x-i18n:
    generated_at: "2026-07-16T17:32:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech, paketle birlikte sunulan bir Azure AI Speech metinden konuşmaya sağlayıcısıdır. OpenClaw,
Azure Speech REST API'sini SSML ile doğrudan çağırarak standart yanıtlar için
MP3, sesli notlar için yerel Ogg/Opus ve Voice Call gibi telefon kanalları için
8 kHz mulaw sentezler. İstek, sağlayıcıya ait çıkış biçimini
`X-Microsoft-OutputFormat` üstbilgisi aracılığıyla gönderir.

| Ayrıntı                | Değer                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| Sağlayıcı kimliği      | `azure-speech` (diğer ad: `azure`)                                                             |
| Web sitesi             | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Belgeler               | [Speech REST metinden konuşmaya](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Kimlik doğrulama       | `AZURE_SPEECH_KEY` ve `AZURE_SPEECH_REGION`                                                                      |
| Varsayılan ses         | `en-US-JennyNeural`                                                                                            |
| Varsayılan dosya çıkışı | `audio-24khz-48kbitrate-mono-mp3`                                                                                           |
| Varsayılan sesli not dosyası | `ogg-24khz-16bit-mono-opus`                                                                                     |

## Başlarken

<Steps>
  <Step title="Azure Speech kaynağı oluşturun">
    Azure portalında bir Speech kaynağı oluşturun. Resource Management > Keys and Endpoint
    bölümünden **KEY 1** değerini ve `eastus` gibi kaynak konumunu
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
    beklediğinde ise Ogg/Opus iletir.
  </Step>
</Steps>

## Yapılandırma seçenekleri

Tüm seçenekler `messages.tts.providers["azure-speech"]` altında bulunur.

| Seçenek                 | Açıklama                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`      | Azure Speech kaynak anahtarı. `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` veya `SPEECH_KEY` değerine geri döner. |
| `region`      | Azure Speech kaynak bölgesi. `AZURE_SPEECH_REGION` veya `SPEECH_REGION` değerine geri döner.          |
| `endpoint`      | İsteğe bağlı Azure Speech uç noktası geçersiz kılma değeri. Güvenilir `AZURE_SPEECH_ENDPOINT` değerine geri döner. |
| `baseUrl`      | İsteğe bağlı Azure Speech temel URL geçersiz kılma değeri.                                            |
| `voice`      | Azure ses ShortName değeri (varsayılan `en-US-JennyNeural`). Eski diğer ad: `voiceId`.        |
| `lang`      | SSML dil kodu (varsayılan `en-US`).                                                        |
| `outputFormat`      | Ses dosyası çıkış biçimi (varsayılan `audio-24khz-48kbitrate-mono-mp3`).                                             |
| `voiceNoteOutputFormat`      | Sesli not çıkış biçimi (varsayılan `ogg-24khz-16bit-mono-opus`).                                               |
| `timeoutMs`      | Milisaniye cinsinden istek zaman aşımı geçersiz kılma değeri. Genel `messages.tts.timeoutMs` değerine geri döner. |

`apiKey` ile birlikte `region`, `endpoint` veya
`baseUrl` değerlerinden biri ayarlandığında sağlayıcı yapılandırılmış kabul edilir.
Ortam değişkenleri yalnızca ayarlanmamış bırakılan yapılandırma anahtarları için geri dönüş
olarak denetlenir. Çalışma alanı `.env` dosyaları
`AZURE_SPEECH_ENDPOINT` değerini ayarlayamaz; uç nokta yönlendirmesi için işlem ortamını,
genel çalışma zamanı dotenv'ini veya açık yapılandırmayı kullanın.

## Notlar

<AccordionGroup>
  <Accordion title="Kimlik doğrulama">
    Azure Speech, Azure OpenAI anahtarı değil, Speech kaynak anahtarı kullanır. Anahtar
    `Ocp-Apim-Subscription-Key` olarak gönderilir; `endpoint` veya
    `baseUrl` sağlamadığınız sürece OpenClaw, `https://<region>.tts.speech.microsoft.com`
    değerini `region` değerinden türetir.
  </Accordion>
  <Accordion title="Ses adları">
    Azure Speech sesinin `ShortName` değerini kullanın; örneğin
    `en-US-JennyNeural`. Paketle birlikte sunulan sağlayıcı, aynı Speech kaynağı
    üzerinden sesleri listeleyebilir ve kullanımdan kaldırılmış, sonlandırılmış
    veya devre dışı olarak işaretlenen sesleri filtreler.
  </Accordion>
  <Accordion title="Ses çıkışları">
    Azure; `audio-24khz-48kbitrate-mono-mp3`, `ogg-24khz-16bit-mono-opus` ve
    `riff-24khz-16bit-mono-pcm` gibi çıkış biçimlerini kabul eder. OpenClaw,
    kanalların ek bir MP3 dönüştürmesi olmadan yerel ses balonları gönderebilmesi
    için `voice-note` hedeflerinde Ogg/Opus ister ve telefon hedeflerinde
    `raw-8khz-8bit-mono-mulaw` biçimini zorunlu kılar.
  </Accordion>
  <Accordion title="Diğer ad">
    `azure`, mevcut yapılandırma için sağlayıcı diğer adı olarak kabul edilir;
    ancak Azure OpenAI model sağlayıcılarıyla karışıklığı önlemek için yeni yapılandırmada
    `azure-speech` kullanılmalıdır.
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Metinden konuşmaya" href="/tr/tools/tts" icon="waveform-lines">
    TTS genel bakışı, sağlayıcılar ve `messages.tts` yapılandırması.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    `messages.tts` ayarlarını da içeren eksiksiz yapılandırma referansı.
  </Card>
  <Card title="Sağlayıcılar" href="/tr/providers" icon="grid">
    Paketle birlikte sunulan tüm OpenClaw sağlayıcıları.
  </Card>
  <Card title="Sorun giderme" href="/tr/help/troubleshooting" icon="wrench">
    Yaygın sorunlar ve hata ayıklama adımları.
  </Card>
</CardGroup>
