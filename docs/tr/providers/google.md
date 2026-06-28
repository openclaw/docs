---
read_when:
    - OpenClaw ile Google Gemini modellerini kullanmak istiyorsunuz
    - API anahtarına veya OAuth kimlik doğrulama akışına ihtiyacınız var
summary: Google Gemini kurulumu (API anahtarı + OAuth, görsel oluşturma, medya anlama, TTS, web araması)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-28T01:10:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

Google Plugin'i, Google AI Studio üzerinden Gemini modellerine erişimin yanı sıra
Gemini Grounding aracılığıyla görüntü oluşturma, medya anlama (görüntü/ses/video),
metinden konuşmaya ve web araması sağlar.

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- API: Google Gemini API
- Çalışma zamanı seçeneği: provider/model `agentRuntime.id: "google-gemini-cli"`
  model başvurularını `google/*` olarak kanonik tutarken Gemini CLI OAuth'u yeniden kullanır.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı">
    **En iyi kullanım:** Google AI Studio üzerinden standart Gemini API erişimi.

    <Steps>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Ya da anahtarı doğrudan geçirin:

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
    `GEMINI_API_KEY` ve `GOOGLE_API_KEY` ortam değişkenlerinin ikisi de kabul edilir. Hangisi zaten yapılandırılmışsa onu kullanın.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **En iyi kullanım:** ayrı bir API anahtarı yerine PKCE OAuth aracılığıyla mevcut bir Gemini CLI oturum açmasını yeniden kullanmak.

    <Warning>
    `google-gemini-cli` sağlayıcısı resmi olmayan bir entegrasyondur. Bazı kullanıcılar
    OAuth'u bu şekilde kullanırken hesap kısıtlamaları bildirmektedir. Kendi sorumluluğunuzda kullanın.
    </Warning>

    <Steps>
      <Step title="Gemini CLI'yi kurun">
        Yerel `gemini` komutu `PATH` üzerinde kullanılabilir olmalıdır.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw, yaygın Windows/npm düzenleri dahil hem Homebrew kurulumlarını hem de
        global npm kurulumlarını destekler.
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
    - Takma ad: `gemini-cli`

    Gemini 3.1 Pro'nun Gemini API model kimliği `gemini-3.1-pro-preview` şeklindedir. OpenClaw, kolaylık takma adı olarak daha kısa `google/gemini-3.1-pro` değerini kabul eder ve sağlayıcı çağrılarından önce normalleştirir.

    **Ortam değişkenleri:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Ya da `GEMINI_CLI_*` varyantları.)

    <Note>
    Gemini CLI OAuth istekleri oturum açtıktan sonra başarısız olursa Gateway
    konağında `GOOGLE_CLOUD_PROJECT` veya `GOOGLE_CLOUD_PROJECT_ID` ayarlayın ve yeniden deneyin.
    </Note>

    <Note>
    Oturum açma, tarayıcı akışı başlamadan önce başarısız olursa yerel `gemini`
    komutunun kurulu olduğundan ve `PATH` üzerinde bulunduğundan emin olun.
    </Note>

    `google-gemini-cli/*` model başvuruları eski uyumluluk takma adlarıdır. Yeni
    yapılandırmalar, yerel Gemini CLI yürütmesi istediklerinde `google/*` model
    başvurularını ve `google-gemini-cli` çalışma zamanını kullanmalıdır.

  </Tab>
</Tabs>

## Yetenekler

| Yetenek                | Desteklenir                   |
| ---------------------- | ----------------------------- |
| Sohbet tamamlama       | Evet                          |
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

Paketle gelen `gemini` web araması sağlayıcısı, Gemini Google Search grounding kullanır.
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

Kimlik bilgisi önceliği önce özel `webSearch.apiKey`, ardından `GEMINI_API_KEY`,
ardından `models.providers.google.apiKey` şeklindedir. `webSearch.baseUrl` isteğe bağlıdır ve
operatör proxy'leri veya uyumlu Gemini API uç noktaları için vardır; belirtilmediğinde
Gemini web araması `models.providers.google.baseUrl` değerini yeniden kullanır. Sağlayıcıya özgü araç davranışı için
[Gemini araması](/tr/tools/gemini-search) bölümüne bakın.

<Tip>
Gemini 3 modelleri `thinkingBudget` yerine `thinkingLevel` kullanır. OpenClaw,
Gemini 3, Gemini 3.1 ve `gemini-*-latest` takma adı akıl yürütme denetimlerini
`thinkingLevel` değerine eşler; böylece varsayılan/düşük gecikmeli çalıştırmalar devre dışı
`thinkingBudget` değerleri göndermez.

`/think adaptive`, sabit bir OpenClaw düzeyi seçmek yerine Google'ın dinamik düşünme semantiğini korur.
Gemini 3 ve Gemini 3.1 sabit bir `thinkingLevel` göndermez, böylece
Google düzeyi seçebilir; Gemini 2.5 Google'ın dinamik sentinel değerini gönderir:
`thinkingBudget: -1`.

Gemma 4 modelleri (örneğin `gemma-4-26b-a4b-it`) düşünme modunu destekler. OpenClaw,
Gemma 4 için `thinkingBudget` değerini desteklenen bir Google `thinkingLevel` değerine yeniden yazar.
Düşünmeyi `off` olarak ayarlamak, `MINIMAL` değerine eşlemek yerine düşünmenin devre dışı kalmasını korur.
</Tip>

## Görüntü oluşturma

Paketle gelen `google` görüntü oluşturma sağlayıcısının varsayılanı
`google/gemini-3.1-flash-image-preview` değeridir.

- `google/gemini-3-pro-image-preview` değerini de destekler
- Oluşturma: istek başına en fazla 4 görüntü
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Görüntü Oluşturma](/tr/tools/image-generation) bölümüne bakın.
</Note>

## Video oluşturma

Paketle gelen `google` Plugin'i, paylaşılan
`video_generate` aracı üzerinden video oluşturmayı da kaydeder.

- Varsayılan video modeli: `google/veo-3.1-fast-generate-preview`
- Modlar: metinden videoya, görüntüden videoya ve tek videolu referans akışları
- `aspectRatio` (`16:9`, `9:16`) ve `resolution` (`720P`, `1080P`) destekler; ses çıktısı bugün Veo tarafından desteklenmez
- Desteklenen süreler: **4, 6 veya 8 saniye** (diğer değerler izin verilen en yakın değere yuvarlanır)

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.
</Note>

## Müzik oluşturma

Paketle gelen `google` Plugin'i, paylaşılan
`music_generate` aracı üzerinden müzik oluşturmayı da kaydeder.

- Varsayılan müzik modeli: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` değerini de destekler
- Prompt denetimleri: `lyrics` ve `instrumental`
- Çıktı biçimi: varsayılan olarak `mp3`, ayrıca `google/lyria-3-pro-preview` üzerinde `wav`
- Referans girişleri: en fazla 10 görüntü
- Oturum destekli çalıştırmalar, `action: "status"` dahil paylaşılan görev/durum akışı üzerinden ayrılır

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve failover davranışı için [Müzik Oluşturma](/tr/tools/music-generation) bölümüne bakın.
</Note>

## Metinden konuşmaya

Paketle gelen `google` konuşma sağlayıcısı, Gemini API TTS yolunu
`gemini-3.1-flash-tts-preview` ile kullanır.

- Varsayılan ses: `Kore`
- Kimlik doğrulama: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- Çıktı: normal TTS ekleri için WAV, sesli not hedefleri için Opus, Talk/telefon için PCM
- Sesli not çıktısı: Google PCM, WAV olarak sarılır ve `ffmpeg` ile 48 kHz Opus'a dönüştürülür

Google'ın toplu Gemini TTS yolu, oluşturulan sesi tamamlanmış
`generateContent` yanıtında döndürür. En düşük gecikmeli sözlü konuşmalar için toplu
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
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS, stil denetimi için doğal dil prompt'u kullanır.
Konuşulan metinden önce yeniden kullanılabilir bir stil prompt'u eklemek için
`audioProfile` ayarlayın. Prompt metniniz adlandırılmış bir konuşmacıya atıfta bulunuyorsa
`speakerName` ayarlayın.

Gemini API TTS ayrıca metinde `[whispers]` veya `[laughs]` gibi ifade edici köşeli parantez ses etiketlerini kabul eder.
Etiketleri görünür sohbet yanıtının dışında tutarken TTS'e göndermek için bunları
bir `[[tts:text]]...[[/tts:text]]` bloğunun içine koyun:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API ile sınırlandırılmış bir Google Cloud Console API anahtarı bu sağlayıcı için geçerlidir.
Bu, ayrı Cloud Text-to-Speech API yolu değildir.
</Note>

## Gerçek zamanlı ses

Paketle gelen `google` Plugin'i, Voice Call ve Google Meet gibi arka uç ses köprüleri için
Gemini Live API tarafından desteklenen bir gerçek zamanlı ses sağlayıcısı kaydeder.

| Ayar                         | Yapılandırma yolu                                                   | Varsayılan                                                                            |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                        | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Ses                          | `...google.voice`                                                   | `Kore`                                                                                |
| Sıcaklık                     | `...google.temperature`                                             | (ayarlanmamış)                                                                        |
| VAD başlangıç hassasiyeti    | `...google.startSensitivity`                                        | (ayarlanmamış)                                                                        |
| VAD bitiş hassasiyeti        | `...google.endSensitivity`                                          | (ayarlanmamış)                                                                        |
| Sessizlik süresi             | `...google.silenceDurationMs`                                       | (ayarlanmamış)                                                                        |
| Etkinlik işleme              | `...google.activityHandling`                                        | Google varsayılanı, `start-of-activity-interrupts`                                    |
| Tur kapsamı                  | `...google.turnCoverage`                                            | Google varsayılanı, `only-activity`                                                   |
| Otomatik VAD'yi devre dışı bırak | `...google.automaticActivityDetectionDisabled`                  | `false`                                                                               |
| Oturum sürdürme              | `...google.sessionResumption`                                       | `true`                                                                                |
| Bağlam sıkıştırma            | `...google.contextWindowCompression`                                | `true`                                                                                |
| API anahtarı                 | `...google.apiKey`                                                  | `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY` değerine geri döner |

Voice Call realtime yapılandırma örneği:

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
                speakerVoice: "Kore",
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
Google Live API, çift yönlü ses ve WebSocket üzerinden işlev çağırma kullanır.
OpenClaw, telefon/Meet köprüsü sesini Gemini'nin PCM Live API akışına uyarlar ve
araç çağrılarını paylaşılan realtime ses sözleşmesinde tutar. Örnekleme değişikliklerine
ihtiyacınız yoksa `temperature` değerini ayarlanmamış bırakın; OpenClaw pozitif olmayan değerleri
atlar çünkü Google Live, `temperature: 0` için ses olmadan transkript döndürebilir.
Gemini API transkripsiyonu `languageCodes` olmadan etkinleştirilir; mevcut Google
SDK, bu API yolunda dil kodu ipuçlarını reddeder.
</Note>

<Note>
Control UI Talk, sınırlı tek kullanımlık token'larla Google Live tarayıcı oturumlarını destekler.
Yalnızca backend realtime ses sağlayıcıları, sağlayıcı kimlik bilgilerini Gateway üzerinde tutan
genel Gateway relay taşıması üzerinden de çalışabilir.
</Note>

Bakımcı canlı doğrulaması için şunu çalıştırın:
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Smoke testi OpenAI backend/WebRTC yollarını da kapsar; Google ayağı, Control UI Talk tarafından kullanılan
aynı sınırlı Live API token biçimini üretir, tarayıcı WebSocket uç noktasını açar,
ilk kurulum yükünü gönderir ve `setupComplete` bekler.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Doğrudan Gemini önbellek yeniden kullanımı">
    Doğrudan Gemini API çalıştırmaları (`api: "google-generative-ai"`) için OpenClaw,
    yapılandırılmış bir `cachedContent` tanıtıcısını Gemini isteklerine iletir.

    - Model başına veya genel parametreleri `cachedContent` ya da eski `cached_content`
      ile yapılandırın
    - İkisi de varsa `cachedContent` kazanır
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

  <Accordion title="Gemini CLI kullanım notları">
    `google-gemini-cli` OAuth sağlayıcısı kullanılırken OpenClaw, varsayılan olarak Gemini
    CLI `stream-json` çıktısını kullanır ve kullanımı son `stats` yükünden normalleştirir.
    Eski `--output-format json` geçersiz kılmaları yine JSON ayrıştırıcısını kullanır.

    - Akışlı yanıt metni assistant `message` olaylarından gelir.
    - Eski JSON çıktısı için yanıt metni CLI JSON `response` alanından gelir.
    - CLI `usage` değerini boş bıraktığında kullanım `stats` değerine geri döner.
    - `stats.cached`, OpenClaw `cacheRead` içine normalleştirilir.
    - `stats.input` eksikse OpenClaw, giriş token'larını
      `stats.input_tokens - stats.cached` değerinden türetir.

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `GEMINI_API_KEY`
    değerinin bu işlem için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env`
    içinde veya `env.shellEnv` üzerinden).
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
