---
read_when:
    - Google Gemini modellerini OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı veya OAuth auth akışına ihtiyacınız var
summary: Google Gemini kurulumu (API anahtarı + OAuth, görsel üretimi, medya anlama, TTS, web araması)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-26T11:39:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
    source_path: providers/google.md
    workflow: 15
---

Google Plugin’i, Google AI Studio üzerinden Gemini modellerine erişim sağlar; ayrıca
görsel üretimi, medya anlama (görsel/ses/video), metinden konuşma ve
Gemini Grounding üzerinden web araması da sunar.

- Sağlayıcı: `google`
- Auth: `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- API: Google Gemini API
- Çalışma zamanı seçeneği: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  Gemini CLI OAuth’ı yeniden kullanırken model başvurularını `google/*` olarak kanonik tutar.

## Başlangıç

Tercih ettiğiniz auth yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı">
    **En iyisi:** Google AI Studio üzerinden standart Gemini API erişimi.

    <Steps>
      <Step title="Onboarding çalıştırın">
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
      <Step title="Varsayılan model ayarlayın">
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
    `GEMINI_API_KEY` ve `GOOGLE_API_KEY` ortam değişkenlerinin ikisi de kabul edilir. Zaten hangisini yapılandırdıysanız onu kullanın.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **En iyisi:** ayrı bir API anahtarı yerine PKCE OAuth üzerinden mevcut bir Gemini CLI girişini yeniden kullanmak.

    <Warning>
    `google-gemini-cli` sağlayıcısı resmî olmayan bir entegrasyondur. Bazı kullanıcılar
    OAuth’u bu şekilde kullanırken hesap kısıtlamaları bildirmektedir. Riski size aittir.
    </Warning>

    <Steps>
      <Step title="Gemini CLI’yi kurun">
        Yerel `gemini` komutu `PATH` üzerinde mevcut olmalıdır.

        ```bash
        # Homebrew
        brew install gemini-cli

        # veya npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw hem Homebrew kurulumlarını hem global npm kurulumlarını,
        yaygın Windows/npm yerleşimleri dahil, destekler.
      </Step>
      <Step title="OAuth ile giriş yapın">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Modelin kullanılabilir olduğunu doğrulayın">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Varsayılan model: `google/gemini-3.1-pro-preview`
    - Çalışma zamanı: `google-gemini-cli`
    - Takma ad: `gemini-cli`

    **Ortam değişkenleri:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Veya `GEMINI_CLI_*` varyantları.)

    <Note>
    Girişten sonra Gemini CLI OAuth istekleri başarısız olursa, Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya
    `GOOGLE_CLOUD_PROJECT_ID` ayarlayın ve yeniden deneyin.
    </Note>

    <Note>
    Tarayıcı akışı başlamadan önce giriş başarısız olursa, yerel `gemini`
    komutunun kurulu ve `PATH` üzerinde olduğundan emin olun.
    </Note>

    `google-gemini-cli/*` model başvuruları eski uyumluluk takma adlarıdır. Yeni
    config’ler, yerel Gemini CLI yürütmesi istediklerinde `google/*` model başvurularını ve
    `google-gemini-cli` çalışma zamanını kullanmalıdır.

  </Tab>
</Tabs>

## Yetenekler

| Yetenek               | Destek durumu                  |
| --------------------- | ------------------------------ |
| Sohbet tamamlamaları  | Evet                           |
| Görsel üretimi        | Evet                           |
| Müzik üretimi         | Evet                           |
| Metinden konuşma      | Evet                           |
| Realtime ses          | Evet (Google Live API)         |
| Görsel anlama         | Evet                           |
| Ses dökümü            | Evet                           |
| Video anlama          | Evet                           |
| Web araması (Grounding) | Evet                         |
| Thinking/reasoning    | Evet (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 modelleri     | Evet                           |

<Tip>
Gemini 3 modelleri `thinkingBudget` yerine `thinkingLevel` kullanır. OpenClaw,
Gemini 3, Gemini 3.1 ve `gemini-*-latest` takma adlarının reasoning denetimlerini
`thinkingLevel` ile eşler; böylece varsayılan/düşük gecikmeli çalıştırmalar
devre dışı `thinkingBudget` değerleri göndermez.

`/think adaptive`, sabit bir OpenClaw seviyesi seçmek yerine Google’ın dinamik thinking davranışını korur. Gemini 3 ve Gemini 3.1 sabit bir `thinkingLevel` içermez;
Google seviyeyi kendisi seçebilir; Gemini 2.5 ise Google’ın dinamik sentinel değeri olan
`thinkingBudget: -1` gönderir.

Gemma 4 modelleri (örneğin `gemma-4-26b-a4b-it`) thinking modunu destekler. OpenClaw,
Gemma 4 için `thinkingBudget` değerini desteklenen bir Google `thinkingLevel` değerine yeniden yazar.
Thinking’i `off` olarak ayarlamak, bunu `MINIMAL`’a eşlemek yerine gerçekten devre dışı bırakılmış halde korur.
</Tip>

## Görsel üretimi

Paketlenmiş `google` görsel üretim sağlayıcısı varsayılan olarak
`google/gemini-3.1-flash-image-preview` kullanır.

- Ayrıca `google/gemini-3-pro-image-preview` de desteklenir
- Üretim: istek başına en fazla 4 görsel
- Düzenleme modu: etkin, en fazla 5 giriş görseli
- Geometri denetimleri: `size`, `aspectRatio` ve `resolution`

Google’ı varsayılan görsel sağlayıcısı yapmak için:

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Image Generation](/tr/tools/image-generation) sayfasına bakın.
</Note>

## Video üretimi

Paketlenmiş `google` Plugin’i ayrıca paylaşılan
`video_generate` aracı üzerinden video üretimini de kaydeder.

- Varsayılan video modeli: `google/veo-3.1-fast-generate-preview`
- Modlar: text-to-video, image-to-video ve tek video referans akışları
- `aspectRatio`, `resolution` ve `audio` destekler
- Geçerli süre sınırı: **4 ile 8 saniye**

Google’ı varsayılan video sağlayıcısı yapmak için:

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Video Generation](/tr/tools/video-generation) sayfasına bakın.
</Note>

## Müzik üretimi

Paketlenmiş `google` Plugin’i ayrıca paylaşılan
`music_generate` aracı üzerinden müzik üretimini de kaydeder.

- Varsayılan müzik modeli: `google/lyria-3-clip-preview`
- Ayrıca `google/lyria-3-pro-preview` de desteklenir
- İstem denetimleri: `lyrics` ve `instrumental`
- Çıktı biçimi: varsayılan olarak `mp3`, ayrıca `google/lyria-3-pro-preview` üzerinde `wav`
- Referans girdileri: en fazla 10 görsel
- Oturum destekli çalıştırmalar, `action: "status"` dahil paylaşılan görev/durum akışı üzerinden ayrılır

Google’ı varsayılan müzik sağlayıcısı yapmak için:

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Music Generation](/tr/tools/music-generation) sayfasına bakın.
</Note>

## Metinden konuşma

Paketlenmiş `google` konuşma sağlayıcısı, Gemini API TTS yolunu
`gemini-3.1-flash-tts-preview` ile kullanır.

- Varsayılan ses: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- Çıktı: normal TTS ekleri için WAV, sesli not hedefleri için Opus, Talk/telefon için PCM
- Sesli not çıktısı: Google PCM, WAV içine sarılır ve `ffmpeg` ile 48 kHz Opus’a dönüştürülür

Google’ı varsayılan TTS sağlayıcısı yapmak için:

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
          audioProfile: "Sakin bir tonla profesyonel konuş.",
        },
      },
    },
  },
}
```

Gemini API TTS, stil denetimi için doğal dil istemi kullanır. Konuşulan metinden önce
yeniden kullanılabilir bir stil istemi eklemek için `audioProfile` ayarlayın.
İstem metniniz adlandırılmış bir konuşmacıya atıfta bulunuyorsa `speakerName` ayarlayın.

Gemini API TTS ayrıca metin içinde `[whispers]` veya `[laughs]` gibi
ifade edici köşeli parantez ses etiketlerini de kabul eder. Etiketleri görünür sohbet yanıtının dışında tutup
TTS’ye göndermek için bunları `[[tts:text]]...[[/tts:text]]`
bloğu içine koyun:

```text
İşte temiz yanıt metni.

[[tts:text]][whispers] İşte konuşulan sürüm.[[/tts:text]]
```

<Note>
Yalnızca Gemini API ile kısıtlanmış bir Google Cloud Console API anahtarı bu
sağlayıcı için geçerlidir. Bu, ayrı Cloud Text-to-Speech API yolu değildir.
</Note>

## Realtime ses

Paketlenmiş `google` Plugin’i, Voice Call ve Google Meet gibi arka uç ses köprüleri için
Gemini Live API destekli bir realtime ses sağlayıcısı kaydeder.

| Ayar                  | Config yolu                                                          | Varsayılan                                                                             |
| --------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Ses                   | `...google.voice`                                                    | `Kore`                                                                                 |
| Temperature           | `...google.temperature`                                              | (ayarlanmamış)                                                                         |
| VAD başlangıç hassasiyeti | `...google.startSensitivity`                                     | (ayarlanmamış)                                                                         |
| VAD bitiş hassasiyeti | `...google.endSensitivity`                                           | (ayarlanmamış)                                                                         |
| Sessizlik süresi      | `...google.silenceDurationMs`                                        | (ayarlanmamış)                                                                         |
| API anahtarı          | `...google.apiKey`                                                   | `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY` değerlerine geri döner |

Örnek Voice Call realtime config’i:

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
Google Live API, bir WebSocket üzerinden çift yönlü ses ve function calling kullanır.
OpenClaw, telefon/Meet köprü sesini Gemini’nin PCM Live API akışına uyarlar ve
araç çağrılarını paylaşılan realtime ses sözleşmesi üzerinde tutar. Örnekleme değişikliği ihtiyacınız yoksa
`temperature` değerini boş bırakın; OpenClaw pozitif olmayan değerleri atlar,
çünkü Google Live `temperature: 0` için ses yerine transcript döndürebilir.
Gemini API transcription, `languageCodes` olmadan etkinleştirilir; mevcut Google
SDK bu API yolunda language-code ipuçlarını reddeder.
</Note>

<Note>
Control UI Talk tarayıcı oturumları hâlâ tarayıcı WebRTC oturum uygulaması olan bir realtime ses sağlayıcısı gerektirir. Bugün bu yol OpenAI Realtime’dır; Google sağlayıcısı arka uç realtime köprüleri içindir.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Doğrudan Gemini önbellek yeniden kullanımı">
    Doğrudan Gemini API çalıştırmaları için (`api: "google-generative-ai"`), OpenClaw
    yapılandırılmış bir `cachedContent` tanıtıcısını Gemini isteklerine geçirir.

    - Model başına veya genel parametreleri
      `cachedContent` ya da eski `cached_content` ile yapılandırın
    - İkisi de varsa `cachedContent` kazanır
    - Örnek değer: `cachedContents/prebuilt-context`
    - Gemini cache-hit kullanımı, upstream `cachedContentTokenCount`
      değerinden OpenClaw `cacheRead` olarak normalleştirilir

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
    CLI JSON çıktısını şu şekilde normalleştirir:

    - Yanıt metni CLI JSON `response` alanından gelir.
    - CLI `usage` alanını boş bıraktığında kullanım bilgisi `stats` alanından geri alınır.
    - `stats.cached`, OpenClaw `cacheRead` olarak normalleştirilir.
    - `stats.input` eksikse OpenClaw, giriş token’larını
      `stats.input_tokens - stats.cached` üzerinden türetir.

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa, `GEMINI_API_KEY`
    değerinin bu süreç için erişilebilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` üzerinden).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="Görsel üretimi" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video üretimi" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Müzik üretimi" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik aracı parametreleri ve sağlayıcı seçimi.
  </Card>
</CardGroup>
