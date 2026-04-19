---
read_when:
    - Google Gemini modellerini OpenClaw ile kullanmak istiyorsunuz
    - API anahtarı veya OAuth kimlik doğrulama akışına ihtiyacınız var
summary: Google Gemini kurulumu (API anahtarı + OAuth, görüntü oluşturma, medya anlama, TTS, web arama)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-19T01:11:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5e055b02cc51899e11836a882f1f981fedfa5c4dbe42261ac2f2eba5e4d707c
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Google Plugin, Google AI Studio üzerinden Gemini modellere erişim sağlar; ayrıca
Gemini Grounding aracılığıyla görüntü oluşturma, medya anlama (görüntü/ses/video), metinden konuşma ve web aramayı da destekler.

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternatif sağlayıcı: `google-gemini-cli` (OAuth)

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API key">
    **En uygunu:** Google AI Studio üzerinden standart Gemini API erişimi.

    <Steps>
      <Step title="Onboarding'i çalıştırın">
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
    `GEMINI_API_KEY` ve `GOOGLE_API_KEY` ortam değişkenlerinin ikisi de kabul edilir. Halihazırda yapılandırmış olduğunuzu kullanın.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **En uygunu:** Ayrı bir API anahtarı yerine mevcut bir Gemini CLI oturum açmasını PKCE OAuth ile yeniden kullanmak.

    <Warning>
    `google-gemini-cli` sağlayıcısı resmi olmayan bir entegrasyondur. Bazı kullanıcılar
    OAuth'u bu şekilde kullanırken hesap kısıtlamaları bildirmektedir. Riski size aittir.
    </Warning>

    <Steps>
      <Step title="Gemini CLI'yi yükleyin">
        Yerel `gemini` komutunun `PATH` üzerinde kullanılabilir olması gerekir.

        ```bash
        # Homebrew
        brew install gemini-cli

        # veya npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw hem Homebrew kurulumlarını hem de genel npm kurulumlarını destekler; buna
        yaygın Windows/npm düzenleri de dahildir.
      </Step>
      <Step title="OAuth ile oturum açın">
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
    - Diğer ad: `gemini-cli`

    **Ortam değişkenleri:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Veya `GEMINI_CLI_*` varyantları.)

    <Note>
    Giriş yaptıktan sonra Gemini CLI OAuth istekleri başarısız olursa, Gateway ana makinesinde `GOOGLE_CLOUD_PROJECT` veya
    `GOOGLE_CLOUD_PROJECT_ID` ayarlayın ve yeniden deneyin.
    </Note>

    <Note>
    Tarayıcı akışı başlamadan önce oturum açma başarısız olursa, yerel `gemini`
    komutunun kurulu ve `PATH` üzerinde olduğundan emin olun.
    </Note>

    Yalnızca OAuth kullanan `google-gemini-cli` sağlayıcısı, metin çıkarımı için ayrı
    bir yüzeydir. Görüntü oluşturma, medya anlama ve Gemini Grounding ise
    `google` sağlayıcı kimliğinde kalır.

  </Tab>
</Tabs>

## Yetenekler

| Yetenek                | Destek durumu                 |
| ---------------------- | ----------------------------- |
| Sohbet tamamlama       | Evet                          |
| Görüntü oluşturma      | Evet                          |
| Müzik oluşturma        | Evet                          |
| Metinden konuşma       | Evet                          |
| Görüntü anlama         | Evet                          |
| Ses transkripsiyonu    | Evet                          |
| Video anlama           | Evet                          |
| Web arama (Grounding)  | Evet                          |
| Thinking/reasoning     | Evet (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 modelleri      | Evet                          |

<Tip>
Gemini 3 modelleri `thinkingBudget` yerine `thinkingLevel` kullanır. OpenClaw,
varsayılan/düşük gecikmeli çalıştırmalarda devre dışı bırakılmış
`thinkingBudget` değerleri gönderilmesin diye Gemini 3, Gemini 3.1 ve
`gemini-*-latest` takma ad reasoning denetimlerini `thinkingLevel` ile eşler.

Gemma 4 modelleri (örneğin `gemma-4-26b-a4b-it`) thinking modunu destekler. OpenClaw,
`thinkingBudget` değerini Gemma 4 için desteklenen bir Google `thinkingLevel` değerine yeniden yazar.
Thinking'i `off` olarak ayarlamak, bunu `MINIMAL` değerine eşlemek yerine devre dışı bırakılmış halde korur.
</Tip>

## Görüntü oluşturma

Paketlenmiş `google` görüntü oluşturma sağlayıcısı varsayılan olarak
`google/gemini-3.1-flash-image-preview` kullanır.

- `google/gemini-3-pro-image-preview` da desteklenir
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Image Generation](/tr/tools/image-generation) bölümüne bakın.
</Note>

## Video oluşturma

Paketlenmiş `google` Plugin'i, paylaşılan
`video_generate` aracı üzerinden video oluşturmayı da kaydeder.

- Varsayılan video modeli: `google/veo-3.1-fast-generate-preview`
- Modlar: metinden videoya, görüntüden videoya ve tek-video referans akışları
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Video Generation](/tr/tools/video-generation) bölümüne bakın.
</Note>

## Müzik oluşturma

Paketlenmiş `google` Plugin'i, paylaşılan
`music_generate` aracı üzerinden müzik oluşturmayı da kaydeder.

- Varsayılan müzik modeli: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview` da desteklenir
- İstem denetimleri: `lyrics` ve `instrumental`
- Çıkış biçimi: varsayılan olarak `mp3`, ayrıca `google/lyria-3-pro-preview` için `wav`
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve yük devretme davranışı için [Music Generation](/tr/tools/music-generation) bölümüne bakın.
</Note>

## Metinden konuşma

Paketlenmiş `google` konuşma sağlayıcısı, Gemini API TTS yolunu
`gemini-3.1-flash-tts-preview` ile kullanır.

- Varsayılan ses: `Kore`
- Kimlik doğrulama: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- Çıkış: normal TTS ekleri için WAV, Talk/telefon için PCM
- Yerel sesli not çıktısı: API Opus yerine PCM döndürdüğü için bu Gemini API yolunda desteklenmez

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

Gemini API TTS, metin içinde `[whispers]` veya `[laughs]` gibi ifade odaklı köşeli parantezli ses etiketlerini kabul eder.
Etiketleri görünür sohbet yanıtının dışında tutup
TTS'e göndermek için bunları bir `[[tts:text]]...[[/tts:text]]` bloğu içine yerleştirin:

```text
İşte temiz yanıt metni.

[[tts:text]][whispers] İşte seslendirilen sürüm.[[/tts:text]]
```

<Note>
Gemini API ile sınırlandırılmış bir Google Cloud Console API anahtarı bu
sağlayıcı için geçerlidir. Bu, ayrı Cloud Text-to-Speech API yolu değildir.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Doğrudan Gemini önbellek yeniden kullanımı">
    Doğrudan Gemini API çalıştırmaları için (`api: "google-generative-ai"`), OpenClaw
    yapılandırılmış bir `cachedContent` tanıtıcısını Gemini isteklerine iletir.

    - Model bazında veya genel parametreleri
      `cachedContent` ya da eski `cached_content` ile yapılandırın
    - Her ikisi de varsa `cachedContent` önceliklidir
    - Örnek değer: `cachedContents/prebuilt-context`
    - Gemini önbellek isabeti kullanımı, üst akıştaki `cachedContentTokenCount` değerinden
      OpenClaw `cacheRead` içine normalize edilir

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
    `google-gemini-cli` OAuth sağlayıcısını kullanırken, OpenClaw
    CLI JSON çıktısını şu şekilde normalize eder:

    - Yanıt metni CLI JSON `response` alanından gelir.
    - CLI `usage` alanını boş bırakırsa kullanım bilgisi `stats` alanına geri döner.
    - `stats.cached`, OpenClaw `cacheRead` içine normalize edilir.
    - `stats.input` eksikse OpenClaw giriş tokenlarını
      `stats.input_tokens - stats.cached` üzerinden türetir.

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `GEMINI_API_KEY`
    değerinin bu süreç için kullanılabilir olduğundan emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
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
