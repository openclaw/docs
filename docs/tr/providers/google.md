---
read_when:
    - OpenClaw ile Google Gemini modellerini kullanmak istiyorsunuz
    - API anahtarı veya OAuth kimlik doğrulama akışına ihtiyacınız var
summary: Google Gemini kurulumu (API anahtarı + OAuth, görsel üretimi, medya anlama, TTS, web arama)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T09:25:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e66c9dd637e26976659d04b9b7e2452e6881945dab6011970f9e1c5e4a9a685
    source_path: providers/google.md
    workflow: 15
---

Google Plugin'i, Gemini modellerine Google AI Studio üzerinden erişim sağlar; ayrıca
görsel üretimi, medya anlama (görsel/ses/video), metinden sese dönüştürme ve
Gemini Grounding üzerinden web aramayı da destekler.

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternatif sağlayıcı: `google-gemini-cli` (OAuth)

## Başlangıç

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı">
    **En uygun olduğu durum:** Google AI Studio üzerinden standart Gemini API erişimi.

    <Steps>
      <Step title="İlk kullanım akışını çalıştırın">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Veya anahtarı doğrudan verin:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Varsayılan bir model ayarlayın">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` ve `GOOGLE_API_KEY` ortam değişkenlerinin ikisi de kabul edilir. Zaten yapılandırmış olduğunuzu kullanın.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **En uygun olduğu durum:** Ayrı bir API anahtarı yerine mevcut Gemini CLI girişini PKCE OAuth ile yeniden kullanmak.

    <Warning>
    `google-gemini-cli` sağlayıcısı resmî olmayan bir entegrasyondur. Bazı kullanıcılar
    OAuth'u bu şekilde kullanırken hesap kısıtlamaları bildirmektedir. Riski size aittir.
    </Warning>

    <Steps>
      <Step title="Gemini CLI'yi kurun">
        Yerel `gemini` komutu `PATH` üzerinde kullanılabilir olmalıdır.

        ```bash
        # Homebrew
        brew install gemini-cli

        # veya npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw hem Homebrew kurulumlarını hem de global npm kurulumlarını destekler; buna
        yaygın Windows/npm düzenleri de dahildir.
      </Step>
      <Step title="OAuth ile giriş yapın">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Varsayılan model: `google-gemini-cli/gemini-3-flash-preview`
    - Takma ad: `gemini-cli`

    **Ortam değişkenleri:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Veya `GEMINI_CLI_*` varyantları.)

    <Note>
    Girişten sonra Gemini CLI OAuth istekleri başarısız olursa gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya
    `GOOGLE_CLOUD_PROJECT_ID` ayarlayın ve yeniden deneyin.
    </Note>

    <Note>
    Tarayıcı akışı başlamadan önce giriş başarısız olursa yerel `gemini`
    komutunun kurulu ve `PATH` üzerinde olduğundan emin olun.
    </Note>

    Yalnızca OAuth kullanan `google-gemini-cli` sağlayıcısı ayrı bir metin çıkarımı
    yüzeyidir. Görsel üretimi, medya anlama ve Gemini Grounding
    `google` sağlayıcı kimliği üzerinde kalır.

  </Tab>
</Tabs>

## Yetenekler

| Yetenek               | Destek durumu                 |
| --------------------- | ----------------------------- |
| Sohbet tamamlamaları  | Evet                          |
| Görsel üretimi        | Evet                          |
| Müzik üretimi         | Evet                          |
| Metinden sese dönüştürme | Evet                       |
| Gerçek zamanlı ses    | Evet (Google Live API)        |
| Görsel anlama         | Evet                          |
| Ses transkripsiyonu   | Evet                          |
| Video anlama          | Evet                          |
| Web arama (Grounding) | Evet                          |
| Thinking/reasoning    | Evet (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 modelleri     | Evet                          |

<Tip>
Gemini 3 modelleri `thinkingBudget` yerine `thinkingLevel` kullanır. OpenClaw,
varsayılan/düşük gecikmeli çalıştırmalarda devre dışı bırakılmış
`thinkingBudget` değerleri göndermemek için Gemini 3, Gemini 3.1 ve `gemini-*-latest`
takma ad akıl yürütme denetimlerini `thinkingLevel` değerine eşler.

Gemma 4 modelleri (örneğin `gemma-4-26b-a4b-it`) thinking modunu destekler. OpenClaw,
Gemma 4 için `thinkingBudget` değerini desteklenen bir Google `thinkingLevel` değerine yeniden yazar.
Thinking ayarını `off` yapmak, onu `MINIMAL` değerine eşlemek yerine thinking'in devre dışı kalmasını korur.
</Tip>

## Görsel üretimi

Paketlenmiş `google` görsel üretimi sağlayıcısının varsayılanı
`google/gemini-3.1-flash-image-preview` modelidir.

- Ayrıca `google/gemini-3-pro-image-preview` desteklenir
- Üretim: istek başına en fazla 4 görsel
- Düzenleme modu: etkin, en fazla 5 girdi görseli
- Geometri denetimleri: `size`, `aspectRatio` ve `resolution`

Google'ı varsayılan görsel sağlayıcısı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Görsel üretimi](/tr/tools/image-generation).
</Note>

## Video üretimi

Paketlenmiş `google` Plugin'i, paylaşılan
`video_generate` aracı üzerinden video üretimini de kaydeder.

- Varsayılan video modeli: `google/veo-3.1-fast-generate-preview`
- Modlar: metinden videoya, görselden videoya ve tek videolu referans akışları
- `aspectRatio`, `resolution` ve `audio` destekler
- Geçerli süre sınırı: **4 ila 8 saniye**

Google'ı varsayılan video sağlayıcısı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Video üretimi](/tr/tools/video-generation).
</Note>

## Müzik üretimi

Paketlenmiş `google` Plugin'i, paylaşılan
`music_generate` aracı üzerinden müzik üretimini de kaydeder.

- Varsayılan müzik modeli: `google/lyria-3-clip-preview`
- Ayrıca `google/lyria-3-pro-preview` desteklenir
- İstem denetimleri: `lyrics` ve `instrumental`
- Çıkış biçimi: varsayılan olarak `mp3`, ayrıca `google/lyria-3-pro-preview` üzerinde `wav`
- Referans girdileri: en fazla 10 görsel
- Oturum destekli çalıştırmalar, `action: "status"` dâhil paylaşılan görev/durum akışı üzerinden ayrılır

Google'ı varsayılan müzik sağlayıcısı olarak kullanmak için:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için bkz. [Müzik üretimi](/tr/tools/music-generation).
</Note>

## Metinden sese dönüştürme

Paketlenmiş `google` konuşma sağlayıcısı, Gemini API TTS yolunu
`gemini-3.1-flash-tts-preview` ile kullanır.

- Varsayılan ses: `Kore`
- Kimlik doğrulama: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- Çıkış: normal TTS ekleri için WAV, Talk/telefon için PCM
- Yerel sesli not çıktısı: desteklenmez; çünkü bu Gemini API yolu Opus yerine PCM döndürür

Google'ı varsayılan TTS sağlayıcısı olarak kullanmak için:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Gemini API TTS, metin içinde
`[whispers]` veya `[laughs]` gibi etkileyici köşeli parantez ses etiketlerini kabul eder. Etiketleri görünür sohbet yanıtının dışında tutup
TTS'ye göndermek için onları bir `[[tts:text]]...[[/tts:text]]` bloğunun içine koyun:

```text
İşte temiz yanıt metni.

[[tts:text]][whispers] İşte seslendirilen sürüm.[[/tts:text]]
```

<Note>
Gemini API ile sınırlanmış bir Google Cloud Console API anahtarı bu
sağlayıcı için geçerlidir. Bu, ayrı Cloud Text-to-Speech API yolu değildir.
</Note>

## Gerçek zamanlı ses

Paketlenmiş `google` Plugin'i, Voice Call ve Google Meet gibi arka uç ses köprüleri için
Gemini Live API destekli bir gerçek zamanlı ses sağlayıcısı kaydeder.

| Ayar                  | Yapılandırma yolu                                                 | Varsayılan                                                                            |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                    |
| Ses                   | `...google.voice`                                                 | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                           | (ayarlanmamış)                                                                        |
| VAD başlatma hassasiyeti | `...google.startSensitivity`                                   | (ayarlanmamış)                                                                        |
| VAD bitirme hassasiyeti | `...google.endSensitivity`                                      | (ayarlanmamış)                                                                        |
| Sessizlik süresi      | `...google.silenceDurationMs`                                     | (ayarlanmamış)                                                                        |
| API anahtarı          | `...google.apiKey`                                                | `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY` değerlerine geri döner |

Örnek Voice Call gerçek zamanlı yapılandırması:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
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
Google Live API, bir WebSocket üzerinden çift yönlü ses ve fonksiyon çağrısı kullanır.
OpenClaw, telefon/Meet köprü sesini Gemini'nin PCM Live API akışına uyarlar ve
araç çağrılarını paylaşılan gerçek zamanlı ses sözleşmesi üzerinde tutar. Örnekleme değişikliklerine ihtiyacınız yoksa `temperature`
ayarsız bırakın; OpenClaw pozitif olmayan değerleri atlar,
çünkü Google Live `temperature: 0` için ses olmadan transcript döndürebilir.
Gemini API transkripsiyonu `languageCodes` olmadan etkinleştirilir; mevcut Google
SDK'sı bu API yolunda dil kodu ipuçlarını reddeder.
</Note>

<Note>
Control UI Talk tarayıcı oturumları hâlâ
tarayıcı WebRTC oturum uygulamasına sahip bir gerçek zamanlı ses sağlayıcısı gerektirir. Bugün bu yol OpenAI Realtime'dır; Google
sağlayıcısı arka uç gerçek zamanlı köprüler içindir.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Doğrudan Gemini önbellek yeniden kullanımı">
    Doğrudan Gemini API çalıştırmaları için (`api: "google-generative-ai"`), OpenClaw
    yapılandırılmış bir `cachedContent` tanıtıcısını Gemini isteklerine iletir.

    - Model başına veya genel parametreleri
      `cachedContent` veya eski `cached_content` ile yapılandırın
    - İkisi de varsa `cachedContent` kazanır
    - Örnek değer: `cachedContents/prebuilt-context`
    - Gemini önbellek isabeti kullanımı, yukarı akıştaki `cachedContentTokenCount`
      değerinden OpenClaw `cacheRead` içine normalize edilir

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini CLI JSON kullanım notları">
    `google-gemini-cli` OAuth sağlayıcısını kullanırken OpenClaw,
    CLI JSON çıktısını şu şekilde normalize eder:

    - Yanıt metni, CLI JSON `response` alanından gelir.
    - CLI `usage` alanını boş bıraktığında kullanım, `stats` alanına geri döner.
    - `stats.cached`, OpenClaw `cacheRead` içine normalize edilir.
    - `stats.input` eksikse OpenClaw girdi token'larını
      `stats.input_tokens - stats.cached` değerinden türetir.

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `GEMINI_API_KEY`
    değerinin bu işlem için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcı seçimi, model ref'leri ve failover davranışı.
  </Card>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video araç parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik araç parametreleri ve sağlayıcı seçimi.
  </Card>
</CardGroup>
