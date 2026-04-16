---
read_when:
    - OpenClaw ile Google Gemini modellerini kullanmak istiyorsunuz
    - API anahtarına veya OAuth kimlik doğrulama akışına ihtiyacınız var
summary: Google Gemini kurulumu (API anahtarı + OAuth, görüntü oluşturma, medya anlama, TTS, web araması)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-16T08:53:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2d62855f5e80efda758aad71bcaa95c38b1e41761fa1100d47a06c62881419
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Google Plugin, Google AI Studio üzerinden Gemini modellerine erişim sağlar; ayrıca
Gemini Grounding aracılığıyla görüntü oluşturma, medya anlama (görüntü/ses/video), metinden konuşma ve web aramayı da destekler.

- Sağlayıcı: `google`
- Kimlik doğrulama: `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- API: Google Gemini API
- Alternatif sağlayıcı: `google-gemini-cli` (OAuth)

## Başlarken

Tercih ettiğiniz kimlik doğrulama yöntemini seçin ve kurulum adımlarını izleyin.

<Tabs>
  <Tab title="API key">
    **Şunun için en iyisi:** Google AI Studio üzerinden standart Gemini API erişimi.

    <Steps>
      <Step title="Onboarding'i çalıştırın">
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
    `GEMINI_API_KEY` ve `GOOGLE_API_KEY` ortam değişkenlerinin ikisi de kabul edilir. Hâlihazırda yapılandırmış olduğunuz hangisiyse onu kullanın.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Şunun için en iyisi:** Ayrı bir API anahtarı yerine, PKCE OAuth üzerinden mevcut bir Gemini CLI oturumunu yeniden kullanmak.

    <Warning>
    `google-gemini-cli` sağlayıcısı resmî olmayan bir entegrasyondur. Bazı kullanıcılar
    OAuth'u bu şekilde kullanırken hesap kısıtlamaları bildiriyor. Riski size ait olmak üzere kullanın.
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

        OpenClaw, Homebrew kurulumlarını ve global npm kurulumlarını, yaygın
        Windows/npm düzenleri dahil olmak üzere destekler.
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
    Giriş yaptıktan sonra Gemini CLI OAuth istekleri başarısız olursa, gateway host'unda `GOOGLE_CLOUD_PROJECT` veya
    `GOOGLE_CLOUD_PROJECT_ID` ayarlayın ve yeniden deneyin.
    </Note>

    <Note>
    Tarayıcı akışı başlamadan önce giriş başarısız olursa, yerel `gemini`
    komutunun yüklü olduğundan ve `PATH` üzerinde bulunduğundan emin olun.
    </Note>

    Yalnızca OAuth kullanan `google-gemini-cli` sağlayıcısı ayrı bir metin çıkarımı
    yüzeyidir. Görüntü oluşturma, medya anlama ve Gemini Grounding ise
    `google` sağlayıcı kimliğinde kalır.

  </Tab>
</Tabs>

## Yetenekler

| Yetenek               | Destekleniyor     |
| --------------------- | ----------------- |
| Sohbet tamamlamaları  | Evet              |
| Görüntü oluşturma     | Evet              |
| Müzik oluşturma       | Evet              |
| Metinden konuşma      | Evet              |
| Görüntü anlama        | Evet              |
| Ses dökümü            | Evet              |
| Video anlama          | Evet              |
| Web araması (Grounding) | Evet            |
| Düşünme/muhakeme      | Evet (Gemini 3.1+) |
| Gemma 4 modelleri     | Evet              |

<Tip>
Gemma 4 modelleri (örneğin `gemma-4-26b-a4b-it`) thinking modunu destekler. OpenClaw,
Gemma 4 için `thinkingBudget` değerini desteklenen bir Google `thinkingLevel` değerine
yeniden yazar. Thinking ayarını `off` olarak belirlemek, bunu `MINIMAL` değerine
eşlemek yerine thinking'in kapalı kalmasını sağlar.
</Tip>

## Görüntü oluşturma

Birlikte gelen `google` görüntü oluşturma sağlayıcısı varsayılan olarak
`google/gemini-3.1-flash-image-preview` kullanır.

- Ayrıca `google/gemini-3-pro-image-preview` desteği de vardır
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve hata durumunda yedek davranışı için bkz. [Image Generation](/tr/tools/image-generation).
</Note>

## Video oluşturma

Birlikte gelen `google` Plugin, paylaşılan
`video_generate` aracı üzerinden video oluşturmayı da kaydeder.

- Varsayılan video modeli: `google/veo-3.1-fast-generate-preview`
- Modlar: text-to-video, image-to-video ve tek videolu referans akışları
- `aspectRatio`, `resolution` ve `audio` desteklenir
- Mevcut süre sınırı: **4 ila 8 saniye**

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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve hata durumunda yedek davranışı için bkz. [Video Generation](/tr/tools/video-generation).
</Note>

## Müzik oluşturma

Birlikte gelen `google` Plugin, paylaşılan
`music_generate` aracı üzerinden müzik oluşturmayı da kaydeder.

- Varsayılan müzik modeli: `google/lyria-3-clip-preview`
- Ayrıca `google/lyria-3-pro-preview` desteği de vardır
- İstem denetimleri: `lyrics` ve `instrumental`
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
Paylaşılan araç parametreleri, sağlayıcı seçimi ve hata durumunda yedek davranışı için bkz. [Music Generation](/tr/tools/music-generation).
</Note>

## Metinden konuşma

Birlikte gelen `google` konuşma sağlayıcısı, Gemini API TTS yolunu
`gemini-3.1-flash-tts-preview` ile kullanır.

- Varsayılan ses: `Kore`
- Kimlik doğrulama: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` veya `GOOGLE_API_KEY`
- Çıktı: normal TTS ekleri için WAV, Talk/telefoni için PCM
- Yerel sesli not çıktısı: API, Opus yerine PCM döndürdüğü için bu Gemini API yolunda desteklenmez

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

Gemini API TTS, metin içinde `[whispers]` veya `[laughs]` gibi etkileyici köşeli parantez ses etiketlerini kabul eder.
Etiketleri görünür sohbet yanıtının dışında tutarken
TTS'ye göndermek için, bunları bir `[[tts:text]]...[[/tts:text]]` bloğunun içine yerleştirin:

```text
İşte temiz yanıt metni.

[[tts:text]][whispers] İşte konuşulan sürüm.[[/tts:text]]
```

<Note>
Gemini API ile sınırlandırılmış bir Google Cloud Console API anahtarı bu
sağlayıcı için geçerlidir. Bu, ayrı Cloud Text-to-Speech API yolu değildir.
</Note>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Doğrudan Gemini önbellek yeniden kullanımı">
    Doğrudan Gemini API çalıştırmalarında (`api: "google-generative-ai"`), OpenClaw
    yapılandırılmış bir `cachedContent` tanıtıcısını Gemini isteklerine iletir.

    - Model başına veya genel parametreleri `cachedContent` ya da eski
      `cached_content` ile yapılandırın
    - Her ikisi de varsa `cachedContent` öncelik kazanır
    - Örnek değer: `cachedContents/prebuilt-context`
    - Gemini önbellek isabeti kullanımı, üst akıştaki `cachedContentTokenCount` alanından
      OpenClaw `cacheRead` alanına normalize edilir

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

    - Yanıt metni, CLI JSON içindeki `response` alanından gelir.
    - CLI `usage` alanını boş bıraktığında kullanım bilgisi `stats` alanına geri düşer.
    - `stats.cached`, OpenClaw `cacheRead` alanına normalize edilir.
    - `stats.input` eksikse OpenClaw, giriş tokenlerini
      `stats.input_tokens - stats.cached` üzerinden türetir.

  </Accordion>

  <Accordion title="Ortam ve daemon kurulumu">
    Gateway bir daemon olarak çalışıyorsa (launchd/systemd), `GEMINI_API_KEY`
    değerinin bu süreç tarafından kullanılabildiğinden emin olun (örneğin `~/.openclaw/.env` içinde veya
    `env.shellEnv` aracılığıyla).
  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve hata durumunda yedek davranışını seçme.
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
