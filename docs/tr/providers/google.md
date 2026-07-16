---
read_when:
    - OpenClaw ile Google Gemini modellerini kullanmak istiyorsunuz
    - API anahtarına veya OAuth kimlik doğrulama akışına ihtiyacınız var
summary: Google Gemini kurulumu (API anahtarı + OAuth, görüntü oluşturma, medya anlama, TTS, web araması)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-16T17:32:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

Google plugin'i; Google AI Studio üzerinden Gemini modellerine erişimin yanı sıra görüntü oluşturma, medya anlama (görüntü/ses/video), metinden konuşmaya dönüştürme ve Gemini Grounding aracılığıyla web araması sağlar.

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- API: Google Gemini API
- Çalışma zamanı seçeneği: `agentRuntime.id: "google-gemini-cli"`, model referanslarını `google/*` olarak standart biçimde tutarken Gemini CLI OAuth'u yeniden kullanır.

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API anahtarı">
    **En uygun olduğu durum:** Google AI Studio üzerinden standart Gemini API erişimi.

    <Steps>
      <Step title="Bir API anahtarı alın">
        [Google AI Studio](https://aistudio.google.com/apikey) üzerinden ücretsiz bir anahtar oluşturun.
      </Step>
      <Step title="İlk kurulumu çalıştırın">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Alternatif olarak anahtarı doğrudan iletin:

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
    `GEMINI_API_KEY` ve `GOOGLE_API_KEY` değerlerinin ikisi de kabul edilir. Daha önce yapılandırmış olduğunuz değeri kullanın.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **En uygun olduğu durum:** Ayrı bir API anahtarı kullanmak yerine Gemini CLI OAuth aracılığıyla Google hesabınızla oturum açma.

    <Warning>
    `google-gemini-cli` sağlayıcısı resmî olmayan bir entegrasyondur. Bazı kullanıcılar,
    OAuth'u bu şekilde kullanırken hesap kısıtlamalarıyla karşılaştıklarını bildirmektedir. Kullanım riski size aittir.
    </Warning>

    <Steps>
      <Step title="Gemini CLI'ı yükleyin">
        Yerel `gemini` komutu `PATH` üzerinde kullanılabilir olmalıdır.

        ```bash
        # Homebrew
        brew install gemini-cli

        # veya npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw; yaygın Windows/npm düzenleri dâhil olmak üzere hem Homebrew
        yüklemelerini hem de genel npm yüklemelerini destekler.
      </Step>
      <Step title="OAuth aracılığıyla oturum açın">
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

    Gemini 3.1 Pro'nun Gemini API model kimliği `gemini-3.1-pro-preview` değeridir. OpenClaw, kolaylık sağlaması için daha kısa olan `google/gemini-3.1-pro` değerini bir takma ad olarak kabul eder ve sağlayıcı çağrılarından önce bunu standart biçime dönüştürür.

    **Ortam değişkenleri:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Gemini CLI OAuth istekleri oturum açıldıktan sonra başarısız olursa Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya
    `GOOGLE_CLOUD_PROJECT_ID` değerini ayarlayıp yeniden deneyin.
    </Note>

    <Note>
    Tarayıcı akışı başlamadan önce oturum açma başarısız olursa yerel `gemini`
    komutunun yüklü ve `PATH` üzerinde olduğundan emin olun.
    </Note>

    İlk kurulumun otomatik algılama özelliği mevcut bir Gemini CLI oturumunu listeler ancak Gemini CLI'ın araçsız bir
    yoklama yöntemi bulunmadığı için bu oturumu asla otomatik olarak test etmez. Devam etmek için Gemini CLI
    OAuth'u veya bir Gemini API anahtarı seçin.

    `google-gemini-cli/*` model referansları eski uyumluluk takma adlarıdır. Yeni
    yapılandırmalarda yerel Gemini CLI yürütmesi istendiğinde `google-gemini-cli`
    çalışma zamanı ile birlikte `google/*` model referansları kullanılmalıdır.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview`, 2026-03-09 tarihinde kullanımdan kaldırıldı; bunun yerine `google/gemini-3.1-pro-preview` kullanın. Gemini API anahtarı kurulumunu (`openclaw onboard --auth-choice gemini-api-key` veya `openclaw models auth login --provider google`) yeniden çalıştırmak, eski bir yapılandırılmış varsayılanı geçerli modelle yeniden yazar.
</Note>

## Yetenekler

| Yetenek                     | Destekleniyor                  |
| --------------------------- | ------------------------------ |
| Sohbet tamamlama            | Evet                           |
| Görüntü oluşturma           | Evet                           |
| Müzik oluşturma             | Evet                           |
| Metinden konuşmaya dönüştürme | Evet                         |
| Gerçek zamanlı ses          | Evet (Google Live API)         |
| Görüntü anlama              | Evet                           |
| Ses transkripsiyonu         | Evet                           |
| Video anlama                | Evet                           |
| Web araması (Grounding)     | Evet                           |
| Düşünme/akıl yürütme        | Evet (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 modelleri           | Evet                           |

## Web araması

Paketle gelen `gemini` web araması sağlayıcısı, Gemini Google Search Grounding'i kullanır.
`plugins.entries.google.config.webSearch` altında özel bir arama anahtarı yapılandırın
veya `GEMINI_API_KEY` sonrasında `models.providers.google.apiKey` değerini yeniden kullanmasına izin verin:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // GEMINI_API_KEY veya models.providers.google.apiKey ayarlanmışsa isteğe bağlıdır
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // models.providers.google.baseUrl değerine geri döner
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

Kimlik bilgisi önceliği sırasıyla özel `webSearch.apiKey`, ardından `GEMINI_API_KEY`
ve son olarak `models.providers.google.apiKey` şeklindedir. `webSearch.baseUrl` isteğe bağlıdır ve
operatör proxy'leri veya uyumlu Gemini API uç noktaları için bulunur; belirtilmediğinde
Gemini web araması `models.providers.google.baseUrl` değerini yeniden kullanır. Sağlayıcıya özgü araç davranışı için
[Gemini araması](/tr/tools/gemini-search) bölümüne bakın.

<Tip>
Gemini 3 modelleri `thinkingBudget` yerine `thinkingLevel` kullanır. OpenClaw;
Gemini 3, Gemini 3.1 ve `gemini-*-latest` takma adı akıl yürütme denetimlerini
`thinkingLevel` ile eşler; böylece varsayılan/düşük gecikmeli çalıştırmalar devre dışı
`thinkingBudget` değerleri göndermez.

`/think adaptive`, sabit bir OpenClaw düzeyi seçmek yerine Google'ın dinamik düşünme semantiğini korur.
Gemini 3 ve Gemini 3.1, Google'ın düzeyi seçebilmesi için sabit bir `thinkingLevel` değerini göndermez;
Gemini 2.5 ise Google'ın dinamik belirteci olan `thinkingBudget: -1` değerini gönderir.

Gemma 4 modelleri (örneğin `gemma-4-26b-a4b-it`) düşünme modunu destekler. OpenClaw,
Gemma 4 için `thinkingBudget` değerini desteklenen bir Google `thinkingLevel` değerine dönüştürür.
Düşünmeyi `off` olarak ayarlamak, `MINIMAL` ile eşlemek yerine
düşünmenin devre dışı kalmasını korur.

Gemini 2.5 Pro yalnızca düşünme modunda çalışır ve açıkça belirtilen
`thinkingBudget: 0` değerini reddeder; OpenClaw bu değeri göndermek yerine
Gemini 2.5 Pro isteklerinden kaldırır.
</Tip>

## Görüntü oluşturma

Paketle gelen `google` görüntü oluşturma sağlayıcısının varsayılanı
`google/gemini-3.1-flash-image-preview` değeridir.

- Şunu da destekler: `google/gemini-3-pro-image-preview`
- Oluşturma: istek başına en fazla 4 görüntü
- Düzenleme modu: etkin, en fazla 5 girdi görüntüsü
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Görüntü Oluşturma](/tr/tools/image-generation) bölümüne bakın.
</Note>

## Video oluşturma

Paketle gelen `google` plugin'i, paylaşılan
`video_generate` aracı aracılığıyla video oluşturmayı da kaydeder.

- Varsayılan video modeli: `google/veo-3.1-fast-generate-preview`
- Modlar: metinden videoya, görüntüden videoya ve tek video referanslı akışlar
- `aspectRatio` (`16:9`, `9:16`) ve `resolution` (`720P`, `1080P`) desteklenir; ses çıkışı günümüzde Veo tarafından desteklenmemektedir
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Oluşturma](/tr/tools/video-generation) bölümüne bakın.
</Note>

## Müzik oluşturma

Paketle gelen `google` plugin'i, paylaşılan
`music_generate` aracı aracılığıyla müzik oluşturmayı da kaydeder.

- Varsayılan müzik modeli: `google/lyria-3-clip-preview`
- Şunu da destekler: `google/lyria-3-pro-preview`
- İstem denetimleri: `lyrics` ve `instrumental`
- Çıktı biçimi: varsayılan olarak `mp3`; ayrıca `google/lyria-3-pro-preview` üzerinde `wav`
- Referans girdileri: en fazla 10 görüntü
- Oturum destekli çalıştırmalar, `action: "status"` dâhil olmak üzere paylaşılan görev/durum akışı üzerinden ayrılır

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Müzik Oluşturma](/tr/tools/music-generation) bölümüne bakın.
</Note>

## Metinden konuşmaya dönüştürme

Paketle gelen `google` konuşma sağlayıcısı, `gemini-3.1-flash-tts-preview` ile
Gemini API TTS yolunu kullanır.

- Varsayılan ses: `Kore`
- Kimlik doğrulama: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- Çıktı: normal TTS ekleri için WAV, sesli not hedefleri için Opus, Talk/telefon için PCM
- Sesli not çıktısı: Google PCM, WAV olarak sarmalanır ve `ffmpeg` ile 48 kHz Opus'a dönüştürülür

Google'ın toplu Gemini TTS yolu, oluşturulan sesi tamamlanmış
`generateContent` yanıtında döndürür. En düşük gecikmeli sesli konuşmalar için toplu
TTS yerine Gemini Live API destekli Google gerçek zamanlı ses sağlayıcısını
kullanın.

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
          audioProfile: "Sakin bir tonla profesyonelce konuş.",
        },
      },
    },
  },
}
```

Gemini API TTS, stil denetimi için doğal dil istemlerini kullanır. Konuşulan metnin
önüne yeniden kullanılabilir bir stil istemi eklemek için `audioProfile` değerini ayarlayın. İstem
metniniz adlandırılmış bir konuşmacıya atıfta bulunuyorsa `speakerName` değerini ayarlayın.

Gemini API TTS ayrıca metinde `[whispers]` veya `[laughs]` gibi
ifade belirten köşeli parantezli ses etiketlerini kabul eder. Etiketleri TTS'ye gönderirken görünür sohbet
yanıtının dışında tutmak için bunları bir `[[tts:text]]...[[/tts:text]]`
bloğunun içine yerleştirin:

```text
Temiz yanıt metni burada yer alır.

[[tts:text]][whispers] Seslendirilen sürüm burada yer alır.[[/tts:text]]
```

<Note>
Gemini API ile sınırlandırılmış bir Google Cloud Console API anahtarı bu
sağlayıcı için geçerlidir. Bu, ayrı Cloud Text-to-Speech API yolu değildir.
</Note>

## Gerçek zamanlı ses

Paketle gelen `google` plugin'i; Voice Call ve Google Meet gibi arka uç ses köprüleri için
Gemini Live API destekli bir gerçek zamanlı ses sağlayıcısı kaydeder.

| Ayar                  | Yapılandırma yolu                                                   | Varsayılan                                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Model                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| Ses                   | `...google.voice`                                                   | `Kore`                                                                                |
| Sıcaklık              | `...google.temperature`                                             | (ayarlanmamış)                                                                        |
| VAD başlangıç hassasiyeti | `...google.startSensitivity`                                        | (ayarlanmamış)                                                                        |
| VAD bitiş hassasiyeti | `...google.endSensitivity`                                          | (ayarlanmamış)                                                                        |
| Sessizlik süresi      | `...google.silenceDurationMs`                                       | (ayarlanmamış)                                                                        |
| Etkinlik işleme       | `...google.activityHandling`                                        | Google varsayılanı, `start-of-activity-interrupts`                                    |
| Konuşma sırası kapsamı | `...google.turnCoverage`                                            | Google varsayılanı, `audio-activity-and-all-video`                                    |
| Otomatik VAD'yi devre dışı bırak | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Oturumu sürdürme      | `...google.sessionResumption`                                       | `true`                                                                                |
| Bağlam sıkıştırma     | `...google.contextWindowCompression`                                | `true`                                                                                |
| API anahtarı          | `...google.apiKey`                                                  | `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY` değerine geri döner |

Örnek gerçek zamanlı Sesli Arama yapılandırması:

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
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
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
Google Live API, WebSocket üzerinden çift yönlü ses ve işlev çağrısı kullanır.
OpenClaw, telefon/Meet köprü sesini Gemini'nin PCM Live API akışına uyarlar ve
araç çağrılarını paylaşılan gerçek zamanlı ses sözleşmesinde tutar. Örnekleme
değişikliklerine ihtiyacınız olmadığı sürece `temperature` ayarını yapmayın;
çünkü Google Live, `temperature: 0` için ses olmadan dökümler döndürebildiğinden
OpenClaw pozitif olmayan değerleri göndermez. Gemini API dökümü,
`languageCodes` olmadan etkinleştirilir; mevcut Google SDK bu API yolunda dil
kodu ipuçlarını reddeder.
</Note>

<Note>
Gemini 3.1 Live, gerçek zamanlı girdi üzerinden konuşma metnini kabul eder ve
sıralı işlev çağrısı kullanır. OpenClaw bu model için eski `NON_BLOCKING`,
işlev yanıtı zamanlaması ve duygusal diyalog alanlarını göndermez.
`thinkingLevel` tercih edin; yapılandırılmış pozitif `thinkingBudget`
değerleri desteklenen en yakın düzeye eşlenirken `-1`, Google'ın
varsayılanını korur. Bkz. [Gemini Live yetenek karşılaştırması](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Control UI Talk, kısıtlı tek kullanımlık belirteçlerle Google Live tarayıcı
oturumlarını destekler. Yalnızca arka uçta çalışan gerçek zamanlı ses
sağlayıcıları da sağlayıcı kimlik bilgilerini Gateway üzerinde tutan genel
Gateway aktarma taşıması üzerinden çalışabilir.
</Note>

Bakım sorumlularının canlı doğrulaması için
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` komutunu çalıştırın.
Duman testi ayrıca OpenAI arka uç/WebRTC yollarını da kapsar; Google ayağı,
Control UI Talk tarafından kullanılanla aynı kısıtlı Live API belirteç biçimini
oluşturur, tarayıcı WebSocket uç noktasını açar, ilk kurulum yükünü gönderir ve
`setupComplete` için bekler.

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Doğrudan Gemini önbelleğini yeniden kullanma">
    Doğrudan Gemini API çalıştırmalarında (`api: "google-generative-ai"`) OpenClaw,
    yapılandırılmış bir `cachedContent` tanıtıcısını Gemini isteklerine aktarır.

    - Model başına veya genel parametreleri `cachedContent` ya da eski
      `cached_content` ile yapılandırın
    - Daha özel bir kapsamdaki parametreler (genel yerine model düzeyi) her zaman önceliklidir.
      Aynı kapsamda iki anahtar da ayarlanmışsa `cached_content` önceliklidir.
      Beklenmedik sonuçlardan kaçınmak için kapsam başına yalnızca bir anahtar kullanın.
    - Örnek değer: `cachedContents/prebuilt-context`
    - Gemini önbellek isabeti kullanımı, yukarı akıştaki `cachedContentTokenCount` değerinden
      OpenClaw `cacheRead` değerine normalleştirilir

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
    `google-gemini-cli` OAuth sağlayıcısı kullanıldığında OpenClaw, varsayılan
    olarak Gemini CLI `stream-json` çıktısını kullanır ve kullanımı son
    `stats` yükünden normalleştirir. Eski `--output-format json` geçersiz
    kılmaları JSON ayrıştırıcısını kullanmaya devam eder.

    - Akışla iletilen yanıt metni, asistanın `message` olaylarından gelir.
    - Eski JSON çıktısında yanıt metni, CLI JSON `response` alanından gelir.
    - CLI, `usage` alanını boş bıraktığında kullanım `stats` değerine geri döner.
    - `stats.cached`, OpenClaw `cacheRead` değerine normalleştirilir.
    - `stats.input` eksikse OpenClaw, girdi belirteçlerini
      `stats.input_tokens - stats.cached` değerinden türetir.

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon (launchd/systemd) olarak çalışıyorsa `GEMINI_API_KEY`
    değerinin bu işlem tarafından kullanılabildiğinden emin olun (örneğin
    `~/.openclaw/.env` içinde veya `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

## İlgili içerikler

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
