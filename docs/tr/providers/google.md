---
read_when:
    - Google Gemini modellerini OpenClaw ile kullanmak istiyorsunuz
    - API anahtarına veya OAuth kimlik doğrulama akışına ihtiyacınız var
summary: Google Gemini kurulumu (API anahtarı + OAuth, görüntü oluşturma, medya anlama, TTS, web araması)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-07T13:25:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9344307c0f20bf09d330ed82b8ffbd4dfa2592c869eb049c46191caa3ca141e
    source_path: providers/google.md
    workflow: 16
---

Google Plugin, Google AI Studio üzerinden Gemini modellerine erişim sağlamanın yanı sıra
Gemini Grounding aracılığıyla görsel üretimi, medya anlama (görsel/ses/video),
metinden konuşmaya ve web araması sağlar.

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- API: Google Gemini API
- Çalışma zamanı seçeneği: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  model referanslarını `google/*` olarak kanonik tutarken Gemini CLI OAuth'u yeniden kullanır.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı">
    **Şunun için en iyi:** Google AI Studio üzerinden standart Gemini API erişimi.

    <Steps>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Veya anahtarı doğrudan geçirin:

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
    `GEMINI_API_KEY` ve `GOOGLE_API_KEY` ortam değişkenlerinin ikisi de kabul edilir. Hangisi yapılandırılmışsa onu kullanın.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Şunun için en iyi:** Ayrı bir API anahtarı yerine PKCE OAuth aracılığıyla mevcut bir Gemini CLI oturum açmasını yeniden kullanmak.

    <Warning>
    `google-gemini-cli` sağlayıcısı resmi olmayan bir entegrasyondur. Bazı kullanıcılar
    OAuth'u bu şekilde kullanırken hesap kısıtlamaları bildirmektedir. Riski size ait olmak üzere kullanın.
    </Warning>

    <Steps>
      <Step title="Gemini CLI'yi yükleyin">
        Yerel `gemini` komutu `PATH` üzerinde kullanılabilir olmalıdır.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw, yaygın Windows/npm düzenleri dahil olmak üzere hem Homebrew kurulumlarını
        hem de global npm kurulumlarını destekler.
      </Step>
      <Step title="OAuth ile oturum açın">
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
    - Diğer ad: `gemini-cli`

    Gemini 3.1 Pro'nun Gemini API model kimliği `gemini-3.1-pro-preview` şeklindedir. OpenClaw, kolaylık için daha kısa `google/gemini-3.1-pro` değerini diğer ad olarak kabul eder ve sağlayıcı çağrılarından önce normalleştirir.

    **Ortam değişkenleri:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Veya `GEMINI_CLI_*` varyantları.)

    <Note>
    Gemini CLI OAuth istekleri oturum açtıktan sonra başarısız olursa gateway host üzerinde
    `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın ve yeniden deneyin.
    </Note>

    <Note>
    Oturum açma, tarayıcı akışı başlamadan önce başarısız olursa yerel `gemini`
    komutunun yüklü olduğundan ve `PATH` üzerinde bulunduğundan emin olun.
    </Note>

    `google-gemini-cli/*` model referansları eski uyumluluk diğer adlarıdır. Yeni
    yapılandırmalar, yerel Gemini CLI yürütmesi istediklerinde `google/*` model referanslarını ve `google-gemini-cli`
    çalışma zamanını kullanmalıdır.

  </Tab>
</Tabs>

## Yetenekler

| Yetenek                | Desteklenir                   |
| ---------------------- | ----------------------------- |
| Sohbet tamamlama       | Evet                          |
| Görsel üretimi         | Evet                          |
| Müzik üretimi          | Evet                          |
| Metinden konuşmaya     | Evet                          |
| Gerçek zamanlı ses     | Evet (Google Live API)        |
| Görsel anlama          | Evet                          |
| Ses transkripsiyonu    | Evet                          |
| Video anlama           | Evet                          |
| Web araması (Grounding) | Evet                         |
| Düşünme/akıl yürütme   | Evet (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 modelleri      | Evet                          |

## Web araması

Paketle gelen `gemini` web arama sağlayıcısı, Gemini Google Search grounding kullanır.
`plugins.entries.google.config.webSearch` altında ayrılmış bir arama anahtarı yapılandırın
veya `GEMINI_API_KEY` sonrasında `models.providers.google.apiKey` değerini yeniden kullanmasına izin verin:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Kimlik bilgisi önceliği, ayrılmış `webSearch.apiKey`, ardından `GEMINI_API_KEY`,
ardından `models.providers.google.apiKey` şeklindedir. `webSearch.baseUrl` isteğe bağlıdır ve
operatör proxy'leri veya uyumlu Gemini API uç noktaları için bulunur; atlandığında
Gemini web araması `models.providers.google.baseUrl` değerini yeniden kullanır. Sağlayıcıya özgü araç davranışı için
[Gemini araması](/tr/tools/gemini-search) bölümüne bakın.

<Tip>
Gemini 3 modelleri `thinkingBudget` yerine `thinkingLevel` kullanır. OpenClaw,
Gemini 3, Gemini 3.1 ve `gemini-*-latest` diğer ad akıl yürütme denetimlerini
`thinkingLevel` değerine eşler; böylece varsayılan/düşük gecikmeli çalıştırmalar devre dışı
`thinkingBudget` değerleri göndermez.

`/think adaptive`, sabit bir OpenClaw düzeyi seçmek yerine Google'ın dinamik düşünme semantiğini korur.
Gemini 3 ve Gemini 3.1, Google'ın düzeyi seçebilmesi için sabit bir `thinkingLevel` atlar;
Gemini 2.5 ise Google'ın dinamik sentineli olan
`thinkingBudget: -1` değerini gönderir.

Gemma 4 modelleri (örneğin `gemma-4-26b-a4b-it`) düşünme modunu destekler. OpenClaw,
Gemma 4 için `thinkingBudget` değerini desteklenen bir Google `thinkingLevel` değerine yeniden yazar.
Düşünmeyi `off` olarak ayarlamak, `MINIMAL` değerine eşlemek yerine düşünmenin devre dışı kalmasını korur.
</Tip>

## Görsel üretimi

Paketle gelen `google` görsel üretimi sağlayıcısı varsayılan olarak
`google/gemini-3.1-flash-image-preview` kullanır.

- `google/gemini-3-pro-image-preview` da desteklenir
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Görsel Üretimi](/tr/tools/image-generation) bölümüne bakın.
</Note>

## Video üretimi

Paketle gelen `google` Plugin, paylaşılan
`video_generate` aracı üzerinden video üretimini de kaydeder.

- Varsayılan video modeli: `google/veo-3.1-fast-generate-preview`
- Modlar: metinden videoya, görselden videoya ve tek video referans akışları
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Üretimi](/tr/tools/video-generation) bölümüne bakın.
</Note>

## Müzik üretimi

Paketle gelen `google` Plugin, paylaşılan
`music_generate` aracı üzerinden müzik üretimini de kaydeder.

- Varsayılan müzik modeli: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` da desteklenir
- İstem denetimleri: `lyrics` ve `instrumental`
- Çıktı biçimi: varsayılan olarak `mp3`, ayrıca `google/lyria-3-pro-preview` üzerinde `wav`
- Referans girdileri: en fazla 10 görsel
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Müzik Üretimi](/tr/tools/music-generation) bölümüne bakın.
</Note>

## Metinden konuşmaya

Paketle gelen `google` konuşma sağlayıcısı, Gemini API TTS yolunu
`gemini-3.1-flash-tts-preview` ile kullanır.

- Varsayılan ses: `Kore`
- Kimlik doğrulama: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- Çıktı: normal TTS ekleri için WAV, sesli not hedefleri için Opus, Talk/telefon için PCM
- Sesli not çıktısı: Google PCM, WAV olarak sarılır ve `ffmpeg` ile 48 kHz Opus biçimine dönüştürülür

Google'ın toplu Gemini TTS yolu, üretilen sesi tamamlanmış
`generateContent` yanıtında döndürür. En düşük gecikmeli konuşmalı görüşmeler için toplu
TTS yerine Gemini Live API tarafından desteklenen Google gerçek zamanlı ses sağlayıcısını kullanın.

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

Gemini API TTS, stil denetimi için doğal dil istemleri kullanır.
Konuşulan metinden önce yeniden kullanılabilir bir stil istemi eklemek için
`audioProfile` ayarlayın. İstem metniniz adlandırılmış bir konuşmacıya başvuruyorsa
`speakerName` ayarlayın.

Gemini API TTS ayrıca metinde `[whispers]` veya `[laughs]` gibi etkileyici köşeli parantezli ses etiketlerini kabul eder.
Etiketleri görünür sohbet yanıtının dışında tutarken TTS'ye göndermek için
bunları bir `[[tts:text]]...[[/tts:text]]`
bloğunun içine koyun:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API ile sınırlı bir Google Cloud Console API anahtarı bu
sağlayıcı için geçerlidir. Bu, ayrı Cloud Text-to-Speech API yolu değildir.
</Note>

## Gerçek zamanlı ses

Paketle gelen `google` Plugin, Voice Call ve Google Meet gibi arka uç ses köprüleri için
Gemini Live API tarafından desteklenen bir gerçek zamanlı ses sağlayıcısı kaydeder.

| Ayar                  | Yapılandırma yolu                                                   | Varsayılan                                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Ses                   | `...google.voice`                                                   | `Kore`                                                                                |
| Sıcaklık              | `...google.temperature`                                             | (ayarlanmamış)                                                                        |
| VAD başlangıç hassasiyeti | `...google.startSensitivity`                                        | (ayarlanmamış)                                                                        |
| VAD bitiş hassasiyeti | `...google.endSensitivity`                                          | (ayarlanmamış)                                                                        |
| Sessizlik süresi      | `...google.silenceDurationMs`                                       | (ayarlanmamış)                                                                        |
| Etkinlik işleme       | `...google.activityHandling`                                        | Google varsayılanı, `start-of-activity-interrupts`                                    |
| Tur kapsamı           | `...google.turnCoverage`                                            | Google varsayılanı, `only-activity`                                                   |
| Otomatik VAD'yi devre dışı bırak | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Oturum devam ettirme  | `...google.sessionResumption`                                       | `true`                                                                                |
| Bağlam sıkıştırma     | `...google.contextWindowCompression`                                | `true`                                                                                |
| API anahtarı          | `...google.apiKey`                                                  | `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY` değerine geri döner |

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
Google Live API, bir WebSocket üzerinden çift yönlü ses ve işlev çağrısı kullanır.
OpenClaw, telefon/Meet köprü sesini Gemini'nin PCM Live API akışına uyarlar ve
araç çağrılarını paylaşılan gerçek zamanlı ses sözleşmesinde tutar. Örnekleme değişikliklerine
ihtiyacınız olmadıkça `temperature` değerini ayarlanmamış bırakın; OpenClaw pozitif olmayan değerleri atlar
çünkü Google Live, `temperature: 0` için ses olmadan transkript döndürebilir.
Gemini API transkripsiyonu `languageCodes` olmadan etkinleştirilir; mevcut Google
SDK bu API yolunda dil kodu ipuçlarını reddeder.
</Note>

<Note>
Control UI Talk, kısıtlı tek kullanımlık belirteçlerle Google Live tarayıcı oturumlarını destekler.
Yalnızca arka uç gerçek zamanlı ses sağlayıcıları da, sağlayıcı kimlik bilgilerini Gateway üzerinde tutan genel
Gateway aktarma taşıması üzerinden çalışabilir.
</Note>

Bakımcı canlı doğrulaması için şunu çalıştırın:
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Google ayağı, Control UI Talk tarafından kullanılan aynı kısıtlı Live API belirteci şeklini üretir,
tarayıcı WebSocket uç noktasını açar, ilk kurulum yükünü gönderir
ve `setupComplete` için bekler.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Doğrudan Gemini önbelleği yeniden kullanımı">
    Doğrudan Gemini API çalıştırmaları (`api: "google-generative-ai"`) için OpenClaw,
    yapılandırılmış bir `cachedContent` tanıtıcısını Gemini isteklerine geçirir.

    - Model başına veya genel parametreleri
      `cachedContent` ya da eski `cached_content` ile yapılandırın
    - İkisi de mevcutsa, `cachedContent` önceliklidir
    - Örnek değer: `cachedContents/prebuilt-context`
    - Gemini önbellek isabeti kullanımı, yukarı akış `cachedContentTokenCount` değerinden
      OpenClaw `cacheRead` içine normalleştirilir

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
    - CLI `usage` alanını boş bıraktığında kullanım `stats` değerine geri döner.
    - `stats.cached`, OpenClaw `cacheRead` içine normalleştirilir.
    - `stats.input` eksikse, OpenClaw giriş belirteçlerini
      `stats.input_tokens - stats.cached` üzerinden türetir.

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa, `GEMINI_API_KEY`
    değerinin bu işlem için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Görüntü oluşturma" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Müzik oluşturma" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik aracı parametreleri ve sağlayıcı seçimi.
  </Card>
</CardGroup>
