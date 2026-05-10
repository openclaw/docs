---
read_when:
    - Google Gemini modellerini OpenClaw ile kullanmak istiyorsunuz
    - API anahtarına veya OAuth kimlik doğrulama akışına ihtiyacınız var
summary: Google Gemini kurulumu (API anahtarı + OAuth, görüntü oluşturma, medya anlama, TTS, web araması)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-10T19:51:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd61383edad3192577d37c9a706470828d59edd5a187ef4f3c30985afaf46167
    source_path: providers/google.md
    workflow: 16
---

Google Plugin, Google AI Studio üzerinden Gemini modellerine erişim sağlar; ayrıca
Gemini Grounding ile görüntü oluşturma, medya anlama (görüntü/ses/video),
metinden konuşmaya ve web araması sunar.

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- API: Google Gemini API
- Çalışma zamanı seçeneği: provider/model `agentRuntime.id: "google-gemini-cli"`
  model başvurularını `google/*` olarak kurallı tutarken Gemini CLI OAuth’u yeniden kullanır.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API key">
    **En uygun olduğu durum:** Google AI Studio üzerinden standart Gemini API erişimi.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Ya da anahtarı doğrudan iletin:

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
    `GEMINI_API_KEY` ve `GOOGLE_API_KEY` ortam değişkenlerinin ikisi de kabul edilir. Halihazırda hangisini yapılandırdıysanız onu kullanın.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **En uygun olduğu durum:** Ayrı bir API anahtarı yerine PKCE OAuth üzerinden mevcut bir Gemini CLI oturum açma bilgisini yeniden kullanma.

    <Warning>
    `google-gemini-cli` sağlayıcısı resmi olmayan bir entegrasyondur. Bazı kullanıcılar
    OAuth’u bu şekilde kullanırken hesap kısıtlamaları bildirmiştir. Kullanım riski size aittir.
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

        OpenClaw, yaygın Windows/npm yerleşimleri dahil olmak üzere hem Homebrew kurulumlarını hem de global npm kurulumlarını destekler.
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
    - Takma ad: `gemini-cli`

    Gemini 3.1 Pro’nun Gemini API model kimliği `gemini-3.1-pro-preview` şeklindedir. OpenClaw, kolaylık amaçlı takma ad olarak daha kısa `google/gemini-3.1-pro` değerini kabul eder ve sağlayıcı çağrılarından önce normalleştirir.

    **Ortam değişkenleri:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Veya `GEMINI_CLI_*` varyantları.)

    <Note>
    Gemini CLI OAuth istekleri oturum açmadan sonra başarısız olursa Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya
    `GOOGLE_CLOUD_PROJECT_ID` değerini ayarlayın ve yeniden deneyin.
    </Note>

    <Note>
    Oturum açma tarayıcı akışı başlamadan önce başarısız olursa yerel `gemini`
    komutunun kurulu ve `PATH` üzerinde olduğundan emin olun.
    </Note>

    `google-gemini-cli/*` model başvuruları eski uyumluluk takma adlarıdır. Yeni
    yapılandırmalar, yerel Gemini CLI yürütmesi istediklerinde `google/*` model başvurularını ve `google-gemini-cli`
    çalışma zamanını kullanmalıdır.

  </Tab>
</Tabs>

## Yetenekler

| Yetenek                | Desteklenir                   |
| ---------------------- | ----------------------------- |
| Sohbet tamamlamaları   | Evet                          |
| Görüntü oluşturma      | Evet                          |
| Müzik oluşturma        | Evet                          |
| Metinden konuşmaya     | Evet                          |
| Gerçek zamanlı ses     | Evet (Google Live API)        |
| Görüntü anlama         | Evet                          |
| Ses transkripsiyonu    | Evet                          |
| Video anlama           | Evet                          |
| Web araması (Grounding) | Evet                         |
| Düşünme/akıl yürütme   | Evet (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 modelleri      | Evet                          |

## Web araması

Birlikte gelen `gemini` web araması sağlayıcısı, Gemini Google Search grounding kullanır.
`plugins.entries.google.config.webSearch` altında özel bir arama anahtarı yapılandırın
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

Kimlik bilgisi önceliği sırasıyla özel `webSearch.apiKey`, ardından `GEMINI_API_KEY`,
ardından `models.providers.google.apiKey` şeklindedir. `webSearch.baseUrl` isteğe bağlıdır ve
operatör proxy’leri veya uyumlu Gemini API uç noktaları için bulunur; atlandığında
Gemini web araması `models.providers.google.baseUrl` değerini yeniden kullanır. Sağlayıcıya özgü araç davranışı için
[Gemini araması](/tr/tools/gemini-search) sayfasına bakın.

<Tip>
Gemini 3 modelleri `thinkingBudget` yerine `thinkingLevel` kullanır. OpenClaw,
varsayılan/düşük gecikmeli çalıştırmaların devre dışı `thinkingBudget` değerleri göndermemesi için
Gemini 3, Gemini 3.1 ve `gemini-*-latest` takma ad akıl yürütme denetimlerini
`thinkingLevel` değerine eşler.

`/think adaptive`, sabit bir OpenClaw seviyesi seçmek yerine Google’ın dinamik düşünme semantiğini korur. Gemini 3 ve Gemini 3.1, Google’ın seviyeyi seçebilmesi için
sabit bir `thinkingLevel` değerini atlar; Gemini 2.5 ise Google’ın dinamik işaretçisi olan
`thinkingBudget: -1` değerini gönderir.

Gemma 4 modelleri (örneğin `gemma-4-26b-a4b-it`) düşünme modunu destekler. OpenClaw,
Gemma 4 için `thinkingBudget` değerini desteklenen bir Google `thinkingLevel` değerine yeniden yazar.
Düşünmeyi `off` olarak ayarlamak, `MINIMAL` değerine eşlemek yerine düşünmenin devre dışı kalmasını korur.
</Tip>

## Görüntü oluşturma

Birlikte gelen `google` görüntü oluşturma sağlayıcısı varsayılan olarak
`google/gemini-3.1-flash-image-preview` kullanır.

- `google/gemini-3-pro-image-preview` de desteklenir
- Oluşturma: istek başına en fazla 4 görüntü
- Düzenleme modu: etkin, en fazla 5 giriş görüntüsü
- Geometri denetimleri: `size`, `aspectRatio` ve `resolution`

Google’ı varsayılan görüntü sağlayıcısı olarak kullanmak için:

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
Ortak araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Görüntü Oluşturma](/tr/tools/image-generation) sayfasına bakın.
</Note>

## Video oluşturma

Birlikte gelen `google` Plugin, paylaşılan
`video_generate` aracı üzerinden video oluşturmayı da kaydeder.

- Varsayılan video modeli: `google/veo-3.1-fast-generate-preview`
- Modlar: metinden videoya, görüntüden videoya ve tek video referans akışları
- `aspectRatio`, `resolution` ve `audio` destekler
- Geçerli süre sınırı: **4 ila 8 saniye**

Google’ı varsayılan video sağlayıcısı olarak kullanmak için:

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
Ortak araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Oluşturma](/tr/tools/video-generation) sayfasına bakın.
</Note>

## Müzik oluşturma

Birlikte gelen `google` Plugin, paylaşılan
`music_generate` aracı üzerinden müzik oluşturmayı da kaydeder.

- Varsayılan müzik modeli: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` de desteklenir
- İstem denetimleri: `lyrics` ve `instrumental`
- Çıktı biçimi: varsayılan olarak `mp3`, ayrıca `google/lyria-3-pro-preview` üzerinde `wav`
- Referans girişleri: en fazla 10 görüntü
- Oturum destekli çalıştırmalar, `action: "status"` dahil olmak üzere paylaşılan görev/durum akışı üzerinden ayrılır

Google’ı varsayılan müzik sağlayıcısı olarak kullanmak için:

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
Ortak araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Müzik Oluşturma](/tr/tools/music-generation) sayfasına bakın.
</Note>

## Metinden konuşmaya

Birlikte gelen `google` konuşma sağlayıcısı, Gemini API TTS yolunu
`gemini-3.1-flash-tts-preview` ile kullanır.

- Varsayılan ses: `Kore`
- Kimlik doğrulama: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- Çıktı: normal TTS ekleri için WAV, sesli not hedefleri için Opus, Talk/telefon için PCM
- Sesli not çıktısı: Google PCM, WAV olarak sarılır ve `ffmpeg` ile 48 kHz Opus’a dönüştürülür

Google’ın toplu Gemini TTS yolu, oluşturulan sesi tamamlanmış
`generateContent` yanıtında döndürür. En düşük gecikmeli konuşmalı sohbetler için toplu
TTS yerine Gemini Live API destekli Google gerçek zamanlı ses sağlayıcısını kullanın.

Google’ı varsayılan TTS sağlayıcısı olarak kullanmak için:

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

Gemini API TTS, stil denetimi için doğal dil istemleri kullanır. Konuşulacak metnin önüne yeniden kullanılabilir bir stil istemi eklemek için
`audioProfile` değerini ayarlayın. İstem metniniz adlandırılmış bir konuşmacıya atıfta bulunuyorsa
`speakerName` değerini ayarlayın.

Gemini API TTS ayrıca metinde `[whispers]` veya `[laughs]` gibi etkileyici köşeli parantez ses etiketlerini kabul eder. Etiketleri görünür sohbet yanıtından uzak tutarken
TTS’ye göndermek için bunları bir `[[tts:text]]...[[/tts:text]]`
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

Birlikte gelen `google` Plugin, Voice Call ve Google Meet gibi arka uç ses köprüleri için
Gemini Live API destekli bir gerçek zamanlı ses sağlayıcısı kaydeder.

| Ayar                  | Yapılandırma yolu                                                   | Varsayılan                                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Ses                   | `...google.voice`                                                   | `Kore`                                                                                |
| Sıcaklık              | `...google.temperature`                                             | (ayarlanmamış)                                                                        |
| VAD başlangıç duyarlılığı | `...google.startSensitivity`                                        | (ayarlanmamış)                                                                        |
| VAD bitiş duyarlılığı | `...google.endSensitivity`                                          | (ayarlanmamış)                                                                        |
| Sessizlik süresi      | `...google.silenceDurationMs`                                       | (ayarlanmamış)                                                                        |
| Etkinlik işleme       | `...google.activityHandling`                                        | Google varsayılanı, `start-of-activity-interrupts`                                    |
| Tur kapsamı           | `...google.turnCoverage`                                            | Google varsayılanı, `only-activity`                                                   |
| Otomatik VAD'ı devre dışı bırak | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Oturum sürdürme       | `...google.sessionResumption`                                       | `true`                                                                                |
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
araç çağrılarını paylaşılan gerçek zamanlı ses sözleşmesinde tutar. Örnekleme
değişikliklerine ihtiyacınız olmadıkça `temperature` değerini ayarlamayın; OpenClaw
pozitif olmayan değerleri atlar, çünkü Google Live `temperature: 0` için ses
olmadan dökümler döndürebilir. Gemini API dökümü `languageCodes` olmadan
etkinleştirilir; mevcut Google SDK'sı bu API yolunda dil kodu ipuçlarını reddeder.
</Note>

<Note>
Control UI Talk, kısıtlanmış tek kullanımlık token'larla Google Live tarayıcı
oturumlarını destekler. Yalnızca arka uçta çalışan gerçek zamanlı ses sağlayıcıları
da genel Gateway aktarma taşıması üzerinden çalışabilir; bu, sağlayıcı kimlik
bilgilerini Gateway üzerinde tutar.
</Note>

Bakımcı canlı doğrulaması için şunu çalıştırın:
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Smoke testi OpenAI arka uç/WebRTC yollarını da kapsar; Google ayağı, Control UI
Talk tarafından kullanılan aynı kısıtlanmış Live API token biçimini üretir,
tarayıcı WebSocket uç noktasını açar, ilk kurulum yükünü gönderir ve
`setupComplete` için bekler.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    Doğrudan Gemini API çalıştırmaları (`api: "google-generative-ai"`) için OpenClaw,
    yapılandırılmış bir `cachedContent` tanıtıcısını Gemini isteklerine iletir.

    - Model başına veya genel parametreleri `cachedContent` ya da eski
      `cached_content` ile yapılandırın
    - İkisi de varsa `cachedContent` kazanır
    - Örnek değer: `cachedContents/prebuilt-context`
    - Gemini önbellek isabeti kullanımı, üst kaynak `cachedContentTokenCount`
      üzerinden OpenClaw `cacheRead` değerine normalleştirilir

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

  <Accordion title="Gemini CLI JSON usage notes">
    `google-gemini-cli` OAuth sağlayıcısı kullanılırken OpenClaw,
    CLI JSON çıktısını şu şekilde normalleştirir:

    - Yanıt metni CLI JSON `response` alanından gelir.
    - CLI `usage` değerini boş bıraktığında kullanım `stats` değerine geri döner.
    - `stats.cached`, OpenClaw `cacheRead` değerine normalleştirilir.
    - `stats.input` eksikse OpenClaw, giriş token'larını
      `stats.input_tokens - stats.cached` değerinden türetir.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `GEMINI_API_KEY`
    değerinin bu süreç için kullanılabilir olduğundan emin olun (örneğin,
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="Image generation" href="/tr/tools/image-generation" icon="image">
    Paylaşılan görüntü aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Music generation" href="/tr/tools/music-generation" icon="music">
    Paylaşılan müzik aracı parametreleri ve sağlayıcı seçimi.
  </Card>
</CardGroup>
