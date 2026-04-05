---
read_when:
    - Medya anlamayı tasarlıyor veya yeniden düzenliyorsunuz
    - Gelen ses/video/görsel ön işlemeyi ayarlıyorsunuz
summary: Provider + CLI fallback’leri ile gelen görsel/ses/video anlama (isteğe bağlı)
title: Media Understanding
x-i18n:
    generated_at: "2026-04-05T13:59:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe36bd42250d48d12f4ff549e8644afa7be8e42ee51f8aff4f21f81b7ff060f4
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Media Understanding - Gelen (2026-01-17)

OpenClaw, yanıt işlem hattı çalışmadan önce **gelen medyayı** (görsel/ses/video) **özetleyebilir**. Yerel araçların veya provider anahtarlarının kullanılabilir olduğunu otomatik algılar ve devre dışı bırakılabilir ya da özelleştirilebilir. Anlama kapalıysa modeller her zamanki gibi özgün dosyaları/URL’leri almaya devam eder.

Vendor’a özgü medya davranışı vendor plugin’leri tarafından kaydedilirken, OpenClaw
çekirdeği paylaşılan `tools.media` yapılandırmasına, fallback sırasına ve yanıt işlem hattı
entegrasyonuna sahip olur.

## Hedefler

- İsteğe bağlı: daha hızlı yönlendirme ve daha iyi komut ayrıştırma için gelen medyayı kısa metne önceden indirgemek.
- Özgün medya teslimini modele korumak (her zaman).
- **Provider API’lerini** ve **CLI fallback’lerini** desteklemek.
- Sıralı fallback ile birden çok modele izin vermek (hata/boyut/zaman aşımı).

## Üst düzey davranış

1. Gelen ekleri topla (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Etkin her yetenek için (görsel/ses/video) ilkeye göre ekleri seç (varsayılan: **ilk**).
3. İlk uygun model girdisini seç (boyut + yetenek + auth).
4. Bir model başarısız olursa veya medya çok büyükse, **sonraki girdiye fallback yap**.
5. Başarılı olursa:
   - `Body`, `[Image]`, `[Audio]` veya `[Video]` bloğu olur.
   - Ses, `{{Transcript}}` ayarlar; komut ayrıştırma, varsa altyazı metnini,
     yoksa transkripti kullanır.
   - Altyazılar blok içinde `User text:` olarak korunur.

Anlama başarısız olursa veya devre dışıysa, **yanıt akışı** özgün gövde + eklerle devam eder.

## Yapılandırmaya genel bakış

`tools.media`, **paylaşılan modelleri** ve yetenek başına geçersiz kılmaları destekler:

- `tools.media.models`: paylaşılan model listesi (`capabilities` ile kapılamak için kullanın).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - varsayılanlar (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - provider geçersiz kılmaları (`baseUrl`, `headers`, `providerOptions`)
  - `tools.media.audio.providerOptions.deepgram` üzerinden Deepgram ses seçenekleri
  - ses transcript yankı denetimleri (`echoTranscript`, varsayılan `false`; `echoFormat`)
  - isteğe bağlı **yetenek başına `models` listesi** (paylaşılan modellerden önce tercih edilir)
  - `attachments` ilkesi (`mode`, `maxAttachments`, `prefer`)
  - `scope` (kanal/chatType/session key bazında isteğe bağlı kapılama)
- `tools.media.concurrency`: eşzamanlı en yüksek yetenek çalıştırması (varsayılan **2**).

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

Her `models[]` girdisi **provider** veya **CLI** olabilir:

```json5
{
  type: "provider", // atlanırsa varsayılan
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // isteğe bağlı, çok modlu girdiler için kullanılır
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
- `{{OutputDir}}` (bu çalıştırma için oluşturulan scratch dizini)
- `{{OutputBase}}` (uzantısız scratch dosya taban yolu)

## Varsayılanlar ve sınırlar

Önerilen varsayılanlar:

- `maxChars`: görsel/video için **500** (kısa, komut dostu)
- `maxChars`: ses için **ayarsız** (siz sınır koymazsanız tam transcript)
- `maxBytes`:
  - görsel: **10MB**
  - ses: **20MB**
  - video: **50MB**

Kurallar:

- Medya `maxBytes` değerini aşarsa o model atlanır ve **sonraki model denenir**.
- **1024 bayt** altındaki ses dosyaları boş/bozulmuş kabul edilir ve provider/CLI transcription öncesinde atlanır.
- Model `maxChars` değerinden fazla döndürürse çıktı kırpılır.
- `prompt`, basit bir “Describe the {media}.” varsayılanını ve `maxChars` yönlendirmesini kullanır (yalnızca görsel/video).
- Etkin birincil image modeli zaten vision desteğine sahipse OpenClaw,
  `[Image]` özet bloğunu atlar ve özgün görseli doğrudan modele geçirir.
- `<capability>.enabled: true` ama yapılandırılmış model yoksa OpenClaw,
  provider’ı o yeteneği desteklediğinde **etkin yanıt modelini** dener.

### Medya anlamayı otomatik algılama (varsayılan)

`tools.media.<capability>.enabled` açıkça `false` yapılmamışsa ve siz
model yapılandırmadıysanız, OpenClaw şu sırayla otomatik algılar ve **ilk
çalışan seçenekte durur**:

1. Provider’ı yeteneği destekliyorsa **etkin yanıt modeli**.
2. **`agents.defaults.imageModel`** primary/fallback referansları (yalnızca görsel).
3. **Yerel CLI’ler** (yalnızca ses; kuruluysa)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` gerekir; encoder/decoder/joiner/tokens ile)
   - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` veya paketlenmiş tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
4. `read_many_files` kullanan **Gemini CLI** (`gemini`)
5. **Provider auth**
   - Yeteneği destekleyen yapılandırılmış `models.providers.*` girdileri,
     paketlenmiş fallback sırasından önce denenir.
   - Görsel yetenekli modele sahip yalnızca görsel config provider’ları,
     paketlenmiş vendor plugin’i olmasalar bile medya anlama için otomatik kaydolur.
   - Paketlenmiş fallback sırası:
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

Not: İkili algılama macOS/Linux/Windows genelinde en iyi çabayla yapılır; CLI’nin `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yoluyla açık bir CLI modeli ayarlayın.

### Proxy ortam desteği (provider modelleri)

Provider tabanlı **ses** ve **video** medya anlama etkin olduğunda OpenClaw,
provider HTTP çağrıları için standart giden proxy ortam değişkenlerine uyar:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Hiç proxy env değişkeni ayarlı değilse medya anlama doğrudan çıkış kullanır.
Proxy değeri hatalı biçimlendirilmişse OpenClaw bir uyarı günlüğe yazar ve doğrudan
erişime fallback yapar.

## Yetenekler (isteğe bağlı)

`capabilities` ayarlarsanız girdi yalnızca bu medya türleri için çalışır. Paylaşılan
listelerde OpenClaw varsayılanları çıkarabilir:

- `openai`, `anthropic`, `minimax`: **görsel**
- `minimax-portal`: **görsel**
- `moonshot`: **görsel + video**
- `openrouter`: **görsel**
- `google` (Gemini API): **görsel + ses + video**
- `qwen`: **görsel + video**
- `mistral`: **ses**
- `zai`: **görsel**
- `groq`: **ses**
- `deepgram`: **ses**
- Görsel yetenekli model içeren herhangi bir `models.providers.<id>.models[]` kataloğu:
  **görsel**

CLI girdileri için şaşırtıcı eşleşmeleri önlemek adına **`capabilities` değerini açıkça ayarlayın**.
`capabilities` değerini atlarsanız girdi, bulunduğu liste için uygundur.

## Provider destek matrisi (OpenClaw entegrasyonları)

| Yetenek | Provider entegrasyonu                                                              | Notlar                                                                                                                                       |
| ------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Görsel  | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config provider’ları | Vendor plugin’leri görsel desteği kaydeder; MiniMax ve MiniMax OAuth ikisi de `MiniMax-VL-01` kullanır; görsel yetenekli config provider’ları otomatik kaydolur. |
| Ses     | OpenAI, Groq, Deepgram, Google, Mistral                                             | Provider transcription (Whisper/Deepgram/Gemini/Voxtral).                                                                                   |
| Video   | Google, Qwen, Moonshot                                                              | Vendor plugin’leri üzerinden provider video anlama; Qwen video anlama Standard DashScope uç noktalarını kullanır.                           |

MiniMax notu:

- `minimax` ve `minimax-portal` görsel anlama, plugin’e ait
  `MiniMax-VL-01` medya provider’ından gelir.
- Paketlenmiş MiniMax metin kataloğu yine de yalnızca metin olarak başlar; açık
  `models.providers.minimax` girdileri görsel yetenekli M2.7 sohbet referanslarını somutlaştırır.

## Model seçme rehberliği

- Kalite ve güvenlik önemli olduğunda her medya yeteneği için mevcut en güçlü son nesil modeli tercih edin.
- Güvenilmeyen girdileri işleyen araç etkin agent’lar için eski/zayıf medya modellerinden kaçının.
- Kullanılabilirlik için yetenek başına en az bir fallback tutun (kalite modeli + daha hızlı/ucuz model).
- Provider API’leri kullanılamadığında CLI fallback’leri (`whisper-cli`, `whisper`, `gemini`) yararlıdır.
- `parakeet-mlx` notu: `--output-dir` ile OpenClaw, çıktı biçimi `txt` olduğunda (veya belirtilmediğinde) `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` dışı biçimler stdout’a fallback yapar.

## Ek ilkesi

Yetenek başına `attachments`, hangi eklerin işlendiğini denetler:

- `mode`: `first` (varsayılan) veya `all`
- `maxAttachments`: işlenecek en yüksek sayı (varsayılan **1**)
- `prefer`: `first`, `last`, `path`, `url`

`mode: "all"` olduğunda çıktılar `[Image 1/2]`, `[Audio 2/2]` vb. olarak etiketlenir.

Dosya eki çıkarma davranışı:

- Çıkarılan dosya metni, medya prompt’una eklenmeden önce **güvenilmeyen dış içerik** olarak sarılır.
- Eklenen blok, açık sınır işaretleyicileri kullanır; örneğin
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` ve bir
  `Source: External` meta veri satırı içerir.
- Bu ek çıkarma yolu, medya prompt’unu şişirmemek için uzun
  `SECURITY NOTICE:` başlığını bilerek atlar; sınır
  işaretleyicileri ve meta veriler yine korunur.
- Bir dosyada çıkarılabilir metin yoksa OpenClaw `[No extractable text]` ekler.
- Bir PDF bu yolda işlenmiş sayfa görsellerine fallback yaparsa, medya prompt’u
  `[PDF content rendered to images; images not forwarded to model]`
  placeholder’ını korur; çünkü bu ek çıkarma adımı işlenmiş PDF görsellerini değil metin bloklarını iletir.

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

### 2) Yalnızca ses + video (görsel kapalı)

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

### 4) Çok modlu tek girdi (açık yetenekler)

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

Medya anlama çalıştığında `/status` kısa bir özet satırı içerir:

```
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Bu, yetenek başına sonuçları ve uygunsa seçilen provider/modeli gösterir.

## Notlar

- Anlama **best-effort** çalışır. Hatalar yanıtları engellemez.
- Anlama devre dışı olsa bile ekler yine modellere geçirilir.
- Anlamanın nerede çalışacağını sınırlamak için `scope` kullanın (ör. yalnızca DM’ler).

## İlgili belgeler

- [Configuration](/gateway/configuration)
- [Image & Media Support](/nodes/images)
