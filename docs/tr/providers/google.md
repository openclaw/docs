---
read_when:
    - OpenClaw ile Google Gemini modellerini kullanmak istiyorsunuz
    - API anahtarına veya OAuth kimlik doğrulama akışına ihtiyacınız var
summary: Google Gemini kurulumu (API anahtarı + OAuth, görüntü oluşturma, medya anlama, TTS, web araması)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-30T09:40:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

Google Plugin'i, Google AI Studio üzerinden Gemini modellerine erişim, ayrıca
görüntü üretimi, medya anlama (görüntü/ses/video), metinden konuşmaya dönüştürme ve
Gemini Grounding aracılığıyla web araması sağlar.

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- API: Google Gemini API
- Çalışma zamanı seçeneği: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  model başvurularını `google/*` olarak kanonik tutarken Gemini CLI OAuth'u yeniden kullanır.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API key">
    **En uygun kullanım:** Google AI Studio üzerinden standart Gemini API erişimi.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Veya anahtarı doğrudan iletin:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` ve `GOOGLE_API_KEY` ortam değişkenlerinin ikisi de kabul edilir. Zaten yapılandırmış olduğunuz hangisiyse onu kullanın.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **En uygun kullanım:** ayrı bir API anahtarı yerine PKCE OAuth üzerinden mevcut bir Gemini CLI oturumunu yeniden kullanma.

    <Warning>
    `google-gemini-cli` sağlayıcısı resmi olmayan bir entegrasyondur. Bazı kullanıcılar
    OAuth'u bu şekilde kullanırken hesap kısıtlamaları bildirmektedir. Kullanım riski size aittir.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        Yerel `gemini` komutu `PATH` üzerinde kullanılabilir olmalıdır.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw, yaygın Windows/npm düzenleri dahil olmak üzere hem Homebrew kurulumlarını hem de global npm kurulumlarını destekler.
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Varsayılan model: `google/gemini-3.1-pro-preview`
    - Çalışma zamanı: `google-gemini-cli`
    - Diğer ad: `gemini-cli`

    Gemini 3.1 Pro'nun Gemini API model kimliği `gemini-3.1-pro-preview` şeklindedir. OpenClaw kolaylık için daha kısa `google/gemini-3.1-pro` adını kabul eder ve sağlayıcı çağrılarından önce bunu normalleştirir.

    **Ortam değişkenleri:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Veya `GEMINI_CLI_*` varyantları.)

    <Note>
    Gemini CLI OAuth istekleri oturum açtıktan sonra başarısız olursa Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya
    `GOOGLE_CLOUD_PROJECT_ID` ayarlayın ve yeniden deneyin.
    </Note>

    <Note>
    Tarayıcı akışı başlamadan önce oturum açma başarısız olursa yerel `gemini`
    komutunun kurulu olduğundan ve `PATH` üzerinde bulunduğundan emin olun.
    </Note>

    `google-gemini-cli/*` model başvuruları eski uyumluluk diğer adlarıdır. Yeni
    yapılandırmalar, yerel Gemini CLI yürütmesi istediklerinde `google/*` model başvurularını ve `google-gemini-cli`
    çalışma zamanını kullanmalıdır.

  </Tab>
</Tabs>

## Yetenekler

| Yetenek                | Desteklenir                  |
| ---------------------- | ---------------------------- |
| Sohbet tamamlamaları   | Evet                         |
| Görüntü üretimi        | Evet                         |
| Müzik üretimi          | Evet                         |
| Metinden konuşmaya     | Evet                         |
| Gerçek zamanlı ses     | Evet (Google Live API)       |
| Görüntü anlama         | Evet                         |
| Ses dökümü             | Evet                         |
| Video anlama           | Evet                         |
| Web araması (Grounding) | Evet                        |
| Düşünme/akıl yürütme   | Evet (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 modelleri      | Evet                         |

<Tip>
Gemini 3 modelleri `thinkingBudget` yerine `thinkingLevel` kullanır. OpenClaw,
Gemini 3, Gemini 3.1 ve `gemini-*-latest` diğer ad akıl yürütme denetimlerini
`thinkingLevel` ile eşler; böylece varsayılan/düşük gecikmeli çalıştırmalar devre dışı
`thinkingBudget` değerleri göndermez.

`/think adaptive`, sabit bir OpenClaw düzeyi seçmek yerine Google'ın dinamik düşünme semantiğini korur. Gemini 3 ve Gemini 3.1 sabit bir `thinkingLevel` kullanmaz; böylece
Google düzeyi seçebilir. Gemini 2.5 ise Google'ın dinamik sentinel değerini
`thinkingBudget: -1` olarak gönderir.

Gemma 4 modelleri (örneğin `gemma-4-26b-a4b-it`) düşünme modunu destekler. OpenClaw,
Gemma 4 için `thinkingBudget` değerini desteklenen bir Google `thinkingLevel` değerine dönüştürür.
Düşünmeyi `off` olarak ayarlamak, `MINIMAL` değerine eşlemek yerine düşünmenin devre dışı kalmasını korur.
</Tip>

## Görüntü üretimi

Birlikte gelen `google` görüntü üretimi sağlayıcısının varsayılanı
`google/gemini-3.1-flash-image-preview` şeklindedir.

- `google/gemini-3-pro-image-preview` de desteklenir
- Üretim: istek başına en fazla 4 görüntü
- Düzenleme modu: etkin, en fazla 5 giriş görüntüsü
- Geometri denetimleri: `size`, `aspectRatio` ve `resolution`

Google'ı varsayılan görüntü sağlayıcısı olarak kullanmak için:

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Görüntü Üretimi](/tr/tools/image-generation) bölümüne bakın.
</Note>

## Video üretimi

Birlikte gelen `google` Plugin'i, paylaşılan
`video_generate` aracı üzerinden video üretimini de kaydeder.

- Varsayılan video modeli: `google/veo-3.1-fast-generate-preview`
- Modlar: metinden videoya, görüntüden videoya ve tek videolu referans akışları
- `aspectRatio`, `resolution` ve `audio` desteklenir
- Geçerli süre sınırlaması: **4 ila 8 saniye**

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Video Üretimi](/tr/tools/video-generation) bölümüne bakın.
</Note>

## Müzik üretimi

Birlikte gelen `google` Plugin'i, paylaşılan
`music_generate` aracı üzerinden müzik üretimini de kaydeder.

- Varsayılan müzik modeli: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` de desteklenir
- Prompt denetimleri: `lyrics` ve `instrumental`
- Çıktı biçimi: varsayılan olarak `mp3`, ayrıca `google/lyria-3-pro-preview` üzerinde `wav`
- Referans girdileri: en fazla 10 görüntü
- Oturum destekli çalıştırmalar, `action: "status"` dahil olmak üzere paylaşılan görev/durum akışı üzerinden ayrılır

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Müzik Üretimi](/tr/tools/music-generation) bölümüne bakın.
</Note>

## Metinden konuşmaya

Birlikte gelen `google` konuşma sağlayıcısı, Gemini API TTS yolunu
`gemini-3.1-flash-tts-preview` ile kullanır.

- Varsayılan ses: `Kore`
- Kimlik doğrulama: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- Çıktı: normal TTS ekleri için WAV, sesli not hedefleri için Opus, Talk/telefon için PCM
- Sesli not çıktısı: Google PCM, WAV olarak sarılır ve `ffmpeg` ile 48 kHz Opus'a dönüştürülür

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
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS, stil denetimi için doğal dil prompt'u kullanır. Konuşulacak metinden önce
yeniden kullanılabilir bir stil prompt'u eklemek için `audioProfile` ayarlayın. Prompt metniniz adlandırılmış bir konuşmacıya atıfta bulunuyorsa
`speakerName` ayarlayın.

Gemini API TTS ayrıca metin içinde `[whispers]` veya `[laughs]` gibi anlatımlı köşeli parantez ses etiketlerini kabul eder. Etiketleri TTS'ye gönderirken görünür sohbet yanıtının dışında tutmak için
bunları bir `[[tts:text]]...[[/tts:text]]`
bloğunun içine koyun:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API ile sınırlandırılmış bir Google Cloud Console API anahtarı bu
sağlayıcı için geçerlidir. Bu, ayrı Cloud Text-to-Speech API yolu değildir.
</Note>

## Gerçek zamanlı ses

Birlikte gelen `google` Plugin'i, Voice Call ve Google Meet gibi arka uç ses köprüleri için
Gemini Live API destekli bir gerçek zamanlı ses sağlayıcısı kaydeder.

| Ayar                  | Yapılandırma yolu                                                 | Varsayılan                                                                            |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                     |
| Ses                   | `...google.voice`                                                 | `Kore`                                                                                |
| Sıcaklık              | `...google.temperature`                                           | (ayarlanmamış)                                                                        |
| VAD başlangıç hassasiyeti | `...google.startSensitivity`                                  | (ayarlanmamış)                                                                        |
| VAD bitiş hassasiyeti | `...google.endSensitivity`                                        | (ayarlanmamış)                                                                        |
| Sessizlik süresi      | `...google.silenceDurationMs`                                     | (ayarlanmamış)                                                                        |
| Etkinlik işleme       | `...google.activityHandling`                                      | Google varsayılanı, `start-of-activity-interrupts`                                   |
| Sıra kapsamı          | `...google.turnCoverage`                                          | Google varsayılanı, `only-activity`                                                   |
| Otomatik VAD'yi devre dışı bırak | `...google.automaticActivityDetectionDisabled`            | `false`                                                                               |
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
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
Google Live API, bir WebSocket üzerinden çift yönlü ses ve işlev çağırma kullanır.
OpenClaw, telefon/Meet köprü sesini Gemini'nin PCM Live API akışına uyarlar ve
araç çağrılarını paylaşılan gerçek zamanlı ses sözleşmesinde tutar. Örnekleme
değişikliklerine ihtiyaç duymadığınız sürece `temperature` değerini ayarlamayın;
OpenClaw pozitif olmayan değerleri atlar çünkü Google Live, `temperature: 0` için
ses olmadan dökümler döndürebilir. Gemini API dökümü `languageCodes` olmadan
etkinleştirilir; mevcut Google SDK bu API yolunda dil kodu ipuçlarını reddeder.
</Note>

<Note>
Control UI Talk, kısıtlı tek kullanımlık token'larla Google Live tarayıcı
oturumlarını destekler. Yalnızca arka uçta çalışan gerçek zamanlı ses
sağlayıcıları, sağlayıcı kimlik bilgilerini Gateway üzerinde tutan genel Gateway
aktarma taşıması üzerinden de çalışabilir.
</Note>

Bakımcı canlı doğrulaması için şunu çalıştırın:
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Google ayağı, Control UI Talk tarafından kullanılan aynı kısıtlı Live API token
şeklini üretir, tarayıcı WebSocket uç noktasını açar, başlangıç kurulum yükünü
gönderir ve `setupComplete` için bekler.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Doğrudan Gemini önbelleğini yeniden kullanma">
    Doğrudan Gemini API çalıştırmalarında (`api: "google-generative-ai"`),
    OpenClaw yapılandırılmış bir `cachedContent` tanıtıcısını Gemini isteklerine
    iletir.

    - Model başına veya genel parametreleri `cachedContent` ya da eski
      `cached_content` ile yapılandırın
    - İkisi de varsa `cachedContent` kazanır
    - Örnek değer: `cachedContents/prebuilt-context`
    - Gemini önbellek isabeti kullanımı, yukarı akış `cachedContentTokenCount`
      değerinden OpenClaw `cacheRead` olarak normalize edilir

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
    `google-gemini-cli` OAuth sağlayıcısını kullanırken OpenClaw, CLI JSON
    çıktısını şu şekilde normalize eder:

    - Yanıt metni CLI JSON `response` alanından gelir.
    - CLI `usage` değerini boş bıraktığında kullanım `stats` değerine geri döner.
    - `stats.cached`, OpenClaw `cacheRead` olarak normalize edilir.
    - `stats.input` eksikse OpenClaw, giriş token'larını
      `stats.input_tokens - stats.cached` değerinden türetir.

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `GEMINI_API_KEY`
    değerinin bu süreç tarafından kullanılabildiğinden emin olun (örneğin,
    `~/.openclaw/.env` içinde veya `env.shellEnv` üzerinden).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Görsel oluşturma" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görsel aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Müzik oluşturma" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik aracı parametreleri ve sağlayıcı seçimi.
  </Card>
</CardGroup>
