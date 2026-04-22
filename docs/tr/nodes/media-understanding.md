---
read_when:
    - Medya anlamayı tasarlama veya yeniden düzenleme
    - Gelen ses/video/görsel ön işlemesini ayarlama
summary: Sağlayıcı + CLI geri dönüşleriyle gelen görsel/ses/video anlama (isteğe bağlı)
title: Medya Anlama
x-i18n:
    generated_at: "2026-04-22T04:23:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d80c9bcd965b521c3c782a76b9dd31eb6e6c635d8a1cc6895b6ccfaf5f9492e
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Medya Anlama - Gelen (2026-01-17)

OpenClaw, yanıt hattı çalışmadan önce **gelen medyayı** (görsel/ses/video) **özetleyebilir**. Yerel araçların veya sağlayıcı anahtarlarının kullanılabilir olduğunu otomatik algılar ve devre dışı bırakılabilir ya da özelleştirilebilir. Anlama kapalıysa modeller yine özgün dosyaları/URL'leri normal şekilde alır.

Sağlayıcıya özgü medya davranışı sağlayıcı plugin'leri tarafından kaydedilirken, OpenClaw
çekirdeği paylaşılan `tools.media` yapılandırmasının, geri dönüş sırasının ve yanıt hattı
entegrasyonunun sahibidir.

## Hedefler

- İsteğe bağlı: daha hızlı yönlendirme + daha iyi komut ayrıştırma için gelen medyayı kısa metne önceden sindirmek.
- Özgün medya teslimatını modele korumak (her zaman).
- **Sağlayıcı API'lerini** ve **CLI geri dönüşlerini** desteklemek.
- Sıralı geri dönüşle birden fazla modele izin vermek (hata/boyut/zaman aşımı).

## Yüksek düzey davranış

1. Gelen ekleri topla (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Etkin her yetenek için (görsel/ses/video), ilkeye göre ekleri seç (varsayılan: **ilk**).
3. Uygun ilk model girdisini seç (boyut + yetenek + auth).
4. Bir model başarısız olursa veya medya çok büyükse, **sonraki girdiye geri dön**.
5. Başarılı olursa:
   - `Body`, `[Image]`, `[Audio]` veya `[Video]` bloğu olur.
   - Ses, `{{Transcript}}` ayarlar; varsa komut ayrıştırma altyazı metnini,
     yoksa transkripti kullanır.
   - Altyazılar blok içinde `User text:` olarak korunur.

Anlama başarısız olursa veya devre dışıysa, **yanıt akışı** özgün gövde + eklerle **devam eder**.

## Yapılandırma genel bakış

`tools.media`, **paylaşılan modelleri** ve yetenek başına geçersiz kılmaları destekler:

- `tools.media.models`: paylaşılan model listesi (`capabilities` ile geçitle).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - varsayılanlar (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - sağlayıcı geçersiz kılmaları (`baseUrl`, `headers`, `providerOptions`)
  - `tools.media.audio.providerOptions.deepgram` üzerinden Deepgram ses seçenekleri
  - ses transkript yankılama denetimleri (`echoTranscript`, varsayılan `false`; `echoFormat`)
  - isteğe bağlı yetenek başına **`models` listesi** (paylaşılan modellerden önce tercih edilir)
  - `attachments` ilkesi (`mode`, `maxAttachments`, `prefer`)
  - `scope` (kanal/chatType/session key ile isteğe bağlı geçitleme)
- `tools.media.concurrency`: eşzamanlı en fazla yetenek çalıştırması (varsayılan **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* paylaşılan liste */
      ],
      image: {
        /* isteğe bağlı geçersiz kılmalar */
      },
      audio: {
        /* isteğe bağlı geçersiz kılmalar */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* isteğe bağlı geçersiz kılmalar */
      },
    },
  },
}
```

### Model girdileri

Her `models[]` girdisi **sağlayıcı** veya **CLI** olabilir:

```json5
{
  type: "provider", // belirtilmezse varsayılan
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // isteğe bağlı, çok kipli girdiler için kullanılır
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI şablonları ayrıca şunları da kullanabilir:

- `{{MediaDir}}` (medya dosyasını içeren dizin)
- `{{OutputDir}}` (bu çalışma için oluşturulan geçici dizin)
- `{{OutputBase}}` (uzantısız geçici dosya taban yolu)

## Varsayılanlar ve sınırlar

Önerilen varsayılanlar:

- `maxChars`: görsel/video için **500** (kısa, komut dostu)
- `maxChars`: ses için **ayarsız** (bir sınır koymadığınız sürece tam transkript)
- `maxBytes`:
  - görsel: **10MB**
  - ses: **20MB**
  - video: **50MB**

Kurallar:

- Medya `maxBytes` değerini aşarsa, o model atlanır ve **sonraki model denenir**.
- **1024 bayttan** küçük ses dosyaları boş/bozuk kabul edilir ve sağlayıcı/CLI transkripsiyonundan önce atlanır.
- Model `maxChars` değerinden fazla döndürürse çıktı kırpılır.
- `prompt`, basit bir “Describe the {media}.” artı `maxChars` yönlendirmesine varsayılan döner (yalnızca görsel/video).
- Etkin birincil görsel modeli zaten yerel olarak vision destekliyorsa, OpenClaw
  `[Image]` özet bloğunu atlar ve bunun yerine özgün görseli modele geçirir.
- Açık `openclaw infer image describe --model <provider/model>` istekleri
  farklıdır: bunlar o görsel yetenekli sağlayıcı/modeli doğrudan çalıştırır; buna
  `ollama/qwen2.5vl:7b` gibi Ollama başvuruları da dahildir.
- `<capability>.enabled: true` ama hiçbir model yapılandırılmamışsa, OpenClaw
  sağlayıcısı yeteneği desteklediğinde **etkin yanıt modelini** dener.

### Medya anlamayı otomatik algılama (varsayılan)

`tools.media.<capability>.enabled`, **`false`** olarak ayarlanmadıysa ve siz
model yapılandırmadıysanız, OpenClaw bu sırayla otomatik algılar ve **çalışan ilk
seçenekte durur**:

1. Sağlayıcısı yeteneği desteklediğinde **etkin yanıt modeli**.
2. **`agents.defaults.imageModel`** birincil/geri dönüş başvuruları (yalnızca görsel).
3. **Yerel CLI'ler** (yalnızca ses; kuruluysa)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` gerektirir; encoder/decoder/joiner/tokens ile)
   - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` veya paketle gelen tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
4. `read_many_files` kullanan **Gemini CLI** (`gemini`)
5. **Sağlayıcı auth**
   - Yeteneği destekleyen yapılandırılmış `models.providers.*` girdileri,
     paketle gelen geri dönüş sırasından önce denenir.
   - Görsel yetenekli model içeren yalnızca görsel yapılandırma sağlayıcıları,
     paketle gelen sağlayıcı plugin'i olmasalar bile medya anlama için otomatik kaydolur.
   - Ollama görsel anlama, açıkça seçildiğinde kullanılabilir; örneğin
     `agents.defaults.imageModel` üzerinden veya
     `openclaw infer image describe --model ollama/<vision-model>` ile.
   - Paketle gelen geri dönüş sırası:
     - Ses: OpenAI → Groq → Deepgram → Google → Mistral
     - Görsel: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Video: Google → Qwen → Moonshot

Otomatik algılamayı devre dışı bırakmak için şunu ayarlayın:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

Not: İkili dosya algılama macOS/Linux/Windows genelinde en iyi çaba esaslıdır; CLI'nin `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yolu ile açık bir CLI modeli ayarlayın.

### Proxy ortam desteği (sağlayıcı modelleri)

Sağlayıcı tabanlı **ses** ve **video** medya anlama etkin olduğunda, OpenClaw
sağlayıcı HTTP çağrıları için standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Hiçbir proxy ortam değişkeni ayarlı değilse, medya anlama doğrudan çıkış kullanır.
Proxy değeri hatalı biçimlendirilmişse, OpenClaw bir uyarı günlüğe kaydeder ve doğrudan
almaya geri döner.

## Yetenekler (isteğe bağlı)

`capabilities` ayarlarsanız, girdi yalnızca bu medya türleri için çalışır. Paylaşılan
listelerde OpenClaw varsayılanları çıkarabilir:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**
- Görsel yetenekli model içeren herhangi bir `models.providers.<id>.models[]` kataloğu:
  **image**

CLI girdileri için, şaşırtıcı eşleşmeleri önlemek adına **`capabilities` değerini açıkça ayarlayın**.
`capabilities` değerini atarsanız, girdi göründüğü liste için uygundur.

## Sağlayıcı destek matrisi (OpenClaw entegrasyonları)

| Yetenek | Sağlayıcı entegrasyonu                                                               | Notlar                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Görsel  | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, yapılandırma sağlayıcıları | Sağlayıcı plugin'leri görsel desteğini kaydeder; MiniMax ve MiniMax OAuth ikisi de `MiniMax-VL-01` kullanır; görsel yetenekli yapılandırma sağlayıcıları otomatik kaydolur. |
| Ses     | OpenAI, Groq, Deepgram, Google, Mistral                                              | Sağlayıcı transkripsiyonu (Whisper/Deepgram/Gemini/Voxtral).                                                                              |
| Video   | Google, Qwen, Moonshot                                                               | Sağlayıcı plugin'leri üzerinden sağlayıcı video anlama; Qwen video anlama Standard DashScope uç noktalarını kullanır.                  |

MiniMax notu:

- `minimax` ve `minimax-portal` görsel anlama, plugin'in sahip olduğu
  `MiniMax-VL-01` medya sağlayıcısından gelir.
- Paketle gelen MiniMax metin kataloğu yine yalnızca metin olarak başlar; açık
  `models.providers.minimax` girdileri görsel yetenekli M2.7 sohbet başvurularını somutlaştırır.

## Model seçimi rehberi

- Kalite ve güvenlik önemli olduğunda, her medya yeteneği için kullanılabilen en güçlü yeni nesil modeli tercih edin.
- Güvenilmeyen girdilerle çalışan, araç etkin ajanlar için daha eski/zayıf medya modellerinden kaçının.
- Kullanılabilirlik için yetenek başına en az bir geri dönüş tutun (kaliteli model + daha hızlı/ucuz model).
- CLI geri dönüşleri (`whisper-cli`, `whisper`, `gemini`), sağlayıcı API'leri kullanılamadığında yararlıdır.
- `parakeet-mlx` notu: `--output-dir` ile OpenClaw, çıktı biçimi `txt` olduğunda (veya belirtilmediğinde) `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` dışı biçimler stdout'a geri döner.

## Ek ilkesi

Yetenek başına `attachments`, hangi eklerin işleneceğini kontrol eder:

- `mode`: `first` (varsayılan) veya `all`
- `maxAttachments`: işlenecek en fazla sayı (varsayılan **1**)
- `prefer`: `first`, `last`, `path`, `url`

`mode: "all"` olduğunda çıktılar `[Image 1/2]`, `[Audio 2/2]` vb. olarak etiketlenir.

Dosya eki çıkarma davranışı:

- Çıkarılan dosya metni, medya prompt'una eklenmeden önce **güvenilmeyen harici içerik** olarak sarılır.
- Enjekte edilen blok, şöyle açık sınır işaretleyicileri kullanır:
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` ve bir
  `Source: External` meta veri satırı içerir.
- Bu ek çıkarma yolu, medya prompt'unu şişirmemek için bilerek uzun
  `SECURITY NOTICE:` başlığını atlar; sınır işaretleyicileri ve meta veriler
  yine korunur.
- Bir dosyanın çıkarılabilir metni yoksa, OpenClaw `[No extractable text]` enjekte eder.
- Bir PDF bu yolda işlenmiş sayfa görsellerine geri düşerse, medya prompt'u
  `[PDF content rendered to images; images not forwarded to model]`
  yer tutucusunu korur çünkü bu ek çıkarma adımı işlenmiş PDF görsellerini değil,
  metin bloklarını iletir.

## Yapılandırma örnekleri

### 1) Paylaşılan model listesi + geçersiz kılmalar

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
        {
          provider: "google",
          model: "gemini-3-flash-preview",
          capabilities: ["image", "audio", "video"],
        },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
          ],
          capabilities: ["image", "video"],
        },
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 },
      },
      video: {
        maxChars: 500,
      },
    },
  },
}
```

### 2) Yalnızca Ses + Video (görsel kapalı)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
          },
        ],
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 3) İsteğe bağlı görsel anlama

```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.4-mini" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
            ],
          },
        ],
      },
    },
  },
}
```

### 4) Çok kipli tek girdi (açık yeteneklerle)

```json5
{
  tools: {
    media: {
      image: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      audio: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
      video: {
        models: [
          {
            provider: "google",
            model: "gemini-3.1-pro-preview",
            capabilities: ["image", "video", "audio"],
          },
        ],
      },
    },
  },
}
```

## Durum çıktısı

Medya anlama çalıştığında, `/status` kısa bir özet satırı içerir:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Bu, yetenek başına sonuçları ve uygun olduğunda seçilen sağlayıcı/modeli gösterir.

## Notlar

- Anlama **en iyi çaba esaslıdır**. Hatalar yanıtları engellemez.
- Ekler, anlama devre dışı olduğunda bile modellere yine geçirilir.
- Anlamanın nerede çalışacağını sınırlamak için `scope` kullanın (örneğin yalnızca DM'lerde).

## İlgili belgeler

- [Configuration](/tr/gateway/configuration)
- [Image & Media Support](/tr/nodes/images)
