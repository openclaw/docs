---
read_when:
    - Medya anlamayı tasarlama veya yeniden düzenleme
    - Gelen ses/video/görsel ön işleme ayarlarını iyileştirme
summary: Gelen görsel/ses/video anlama (isteğe bağlı), sağlayıcı ve CLI geri dönüşleriyle birlikte
title: Medya anlama
x-i18n:
    generated_at: "2026-04-24T09:18:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9eb9449fbc1bed170bbef213aa43d71d4146edbc0dd626ef50af9e044a8e299
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Medya Anlama - Gelen (2026-01-17)

OpenClaw, yanıt işlem hattı çalışmadan önce **gelen medyayı özetleyebilir** (görsel/ses/video). Yerel araçlar veya sağlayıcı anahtarları mevcut olduğunda bunu otomatik algılar ve devre dışı bırakılabilir ya da özelleştirilebilir. Anlama kapalıysa modeller yine özgün dosyaları/URL'leri her zamanki gibi alır.

Sağlayıcıya özgü medya davranışı sağlayıcı Plugin'leri tarafından kaydedilirken, OpenClaw çekirdeği paylaşılan `tools.media` yapılandırmasına, geri dönüş sırasına ve yanıt işlem hattı entegrasyonuna sahiptir.

## Hedefler

- İsteğe bağlı: daha hızlı yönlendirme + daha iyi komut ayrıştırma için gelen medyayı önceden kısa metne indirgemek.
- Özgün medya teslimini modele her zaman korumak.
- **Sağlayıcı API'lerini** ve **CLI geri dönüşlerini** desteklemek.
- Sıralı geri dönüşe sahip birden çok modele izin vermek (hata/boyut/zaman aşımı).

## Yüksek düzey davranış

1. Gelen ekleri toplayın (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Etkin her yetenek için (görsel/ses/video), ilkeye göre ekleri seçin (varsayılan: **ilk**).
3. İlk uygun model girdisini seçin (boyut + yetenek + auth).
4. Bir model başarısız olursa veya medya çok büyükse **sonraki girdiye geri dönün**.
5. Başarılı olursa:
   - `Body`, `[Image]`, `[Audio]` veya `[Video]` bloğu olur.
   - Seste `{{Transcript}}` ayarlanır; komut ayrıştırma, varsa başlık metnini,
     yoksa transcript'i kullanır.
   - Başlıklar blok içinde `User text:` olarak korunur.

Anlama başarısız olursa veya devre dışıysa **yanıt akışı**, özgün gövde + eklerle devam eder.

## Yapılandırma genel bakışı

`tools.media`, **paylaşılan modelleri** artı yetenek başına geçersiz kılmaları destekler:

- `tools.media.models`: paylaşılan model listesi (`capabilities` ile sınırlandırın).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - varsayılanlar (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - sağlayıcı geçersiz kılmaları (`baseUrl`, `headers`, `providerOptions`)
  - `tools.media.audio.providerOptions.deepgram` üzerinden Deepgram ses seçenekleri
  - ses transcript yansıma denetimleri (`echoTranscript`, varsayılan `false`; `echoFormat`)
  - isteğe bağlı **yetenek başına `models` listesi** (paylaşılan modellerden önce tercih edilir)
  - `attachments` ilkesi (`mode`, `maxAttachments`, `prefer`)
  - `scope` (kanal/chatType/oturum anahtarı bazında isteğe bağlı sınırlandırma)
- `tools.media.concurrency`: en yüksek eşzamanlı yetenek çalıştırması (varsayılan **2**).

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
  type: "provider", // atlanırsa varsayılan
  provider: "openai",
  model: "gpt-5.5",
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

CLI şablonları ayrıca şunları kullanabilir:

- `{{MediaDir}}` (medya dosyasını içeren dizin)
- `{{OutputDir}}` (bu çalıştırma için oluşturulan geçici dizin)
- `{{OutputBase}}` (uzantısız geçici dosya temel yolu)

## Varsayılanlar ve sınırlar

Önerilen varsayılanlar:

- `maxChars`: görsel/video için **500** (kısa, komut dostu)
- `maxChars`: ses için **ayarsız** (sınır koymazsanız tam transcript)
- `maxBytes`:
  - görsel: **10MB**
  - ses: **20MB**
  - video: **50MB**

Kurallar:

- Medya `maxBytes` değerini aşarsa, o model atlanır ve **sonraki model denenir**.
- **1024 bayttan** küçük ses dosyaları boş/bozuk kabul edilir ve sağlayıcı/CLI transcript işleminden önce atlanır.
- Model `maxChars` değerinden fazla döndürürse çıktı kırpılır.
- `prompt` varsayılan olarak basit bir “Describe the {media}.” artı `maxChars` yönlendirmesi kullanır (yalnızca görsel/video).
- Etkin birincil görsel model zaten yerel olarak görsel desteği sunuyorsa OpenClaw,
  `[Image]` özet bloğunu atlar ve bunun yerine özgün görseli modele geçirir.
- Bir Gateway/WebChat birincil modeli yalnızca metinse, görsel ekleri
  ekin kaybolmaması için image aracı veya yapılandırılmış
  image modeli tarafından incelenebilen offload edilmiş `media://inbound/*` ref'leri olarak korunur.
- Açık `openclaw infer image describe --model <provider/model>` istekleri
  farklıdır: bunlar, `ollama/qwen2.5vl:7b` gibi
  Ollama ref'leri dahil, o görsel destekli sağlayıcı/modeli doğrudan çalıştırır.
- `<capability>.enabled: true` ancak hiçbir model yapılandırılmamışsa OpenClaw,
  sağlayıcısı yeteneği destekliyorsa **etkin yanıt modelini** dener.

### Medya anlamayı otomatik algılama (varsayılan)

`tools.media.<capability>.enabled`, açıkça `false` olarak ayarlanmadıysa ve
modeller yapılandırılmadıysa OpenClaw şu sırayla otomatik algılar ve **çalışan ilk
seçenekte durur**:

1. Sağlayıcısı yeteneği destekliyorsa **etkin yanıt modeli**.
2. **`agents.defaults.imageModel`** primary/fallback ref'leri (yalnızca görsel).
3. **Yerel CLI'ler** (yalnızca ses; kuruluysa)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` ile encoder/decoder/joiner/tokens gerektirir)
   - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` veya paketle gelen tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
4. **Gemini CLI** (`gemini`) `read_many_files` kullanarak
5. **Sağlayıcı auth**
   - Yeteneği destekleyen yapılandırılmış `models.providers.*` girdileri,
     paketle gelen geri dönüş sırasından önce denenir.
   - Görsel destekli bir modele sahip yalnızca görsel yapılandırma sağlayıcıları,
     paketle gelen bir satıcı Plugin'i olmasalar bile medya anlama için otomatik kaydolur.
   - Ollama görsel anlama, örneğin
     `agents.defaults.imageModel` veya
     `openclaw infer image describe --model ollama/<vision-model>` üzerinden açıkça seçildiğinde kullanılabilir.
   - Paketle gelen geri dönüş sırası:
     - Ses: OpenAI → Groq → xAI → Deepgram → Google → Mistral
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

Not: Binary algılama macOS/Linux/Windows genelinde en iyi çaba ile yapılır; CLI'nin `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yoluyla açık bir CLI modeli ayarlayın.

### Proxy ortam desteği (sağlayıcı modelleri)

Sağlayıcı tabanlı **ses** ve **video** medya anlama etkin olduğunda OpenClaw,
sağlayıcı HTTP çağrıları için standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Hiç proxy env değişkeni ayarlı değilse medya anlama doğrudan dış erişim kullanır.
Proxy değeri bozuksa OpenClaw bir uyarı kaydeder ve doğrudan
erişime geri döner.

## Yetenekler (isteğe bağlı)

`capabilities` ayarlarsanız girdi yalnızca o medya türleri için çalışır. Paylaşılan
listeler için OpenClaw varsayılanları çıkarabilir:

- `openai`, `anthropic`, `minimax`: **görsel**
- `minimax-portal`: **görsel**
- `moonshot`: **görsel + video**
- `openrouter`: **görsel**
- `google` (Gemini API): **görsel + ses + video**
- `qwen`: **görsel + video**
- `mistral`: **ses**
- `zai`: **görsel**
- `groq`: **ses**
- `xai`: **ses**
- `deepgram`: **ses**
- Görsel destekli modele sahip herhangi bir `models.providers.<id>.models[]` kataloğu:
  **görsel**

CLI girdileri için beklenmedik eşleşmeleri önlemek amacıyla **`capabilities` değerini açıkça ayarlayın**.
`capabilities` atlanırsa girdi, göründüğü liste için uygun kabul edilir.

## Sağlayıcı destek matrisi (OpenClaw entegrasyonları)

| Yetenek | Sağlayıcı entegrasyonu                                                                                                        | Notlar                                                                                                                                                                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Görsel  | OpenAI, OpenAI Codex OAuth, Codex uygulama sunucusu, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config sağlayıcıları | Satıcı Plugin'leri görsel desteğini kaydeder; `openai-codex/*` OAuth sağlayıcı tesisatını kullanır; `codex/*` sınırlı bir Codex uygulama sunucusu dönüşü kullanır; MiniMax ve MiniMax OAuth ikisi de `MiniMax-VL-01` kullanır; görsel destekli config sağlayıcıları otomatik kaydolur. |
| Ses     | OpenAI, Groq, Deepgram, Google, Mistral                                                                                       | Sağlayıcı transcript işlemi (Whisper/Deepgram/Gemini/Voxtral).                                                                                                                                                                                 |
| Video   | Google, Qwen, Moonshot                                                                                                        | Satıcı Plugin'leri üzerinden sağlayıcı video anlama; Qwen video anlama Standard DashScope uç noktalarını kullanır.                                                                                                                              |

MiniMax notu:

- `minimax` ve `minimax-portal` görsel anlama, Plugin sahipli
  `MiniMax-VL-01` medya sağlayıcısından gelir.
- Paketle gelen MiniMax metin kataloğu yine yalnızca metinle başlar; açık
  `models.providers.minimax` girdileri görsel destekli M2.7 sohbet ref'lerini somutlaştırır.

## Model seçimi rehberi

- Kalite ve güvenlik önemli olduğunda, her medya yeteneği için mevcut en güçlü en yeni nesil modeli tercih edin.
- Güvenilmeyen girdileri işleyen araç etkin aracılar için eski/daha zayıf medya modellerinden kaçının.
- Kullanılabilirlik için yetenek başına en az bir geri dönüş tutun (kalite modeli + daha hızlı/daha ucuz model).
- CLI geri dönüşleri (`whisper-cli`, `whisper`, `gemini`), sağlayıcı API'leri kullanılamadığında yararlıdır.
- `parakeet-mlx` notu: `--output-dir` ile OpenClaw, çıktı biçimi `txt` olduğunda (veya belirtilmediğinde) `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` dışındaki biçimler stdout'a geri döner.

## Ek ilkesi

Yetenek başına `attachments`, hangi eklerin işleneceğini denetler:

- `mode`: `first` (varsayılan) veya `all`
- `maxAttachments`: işlenecek en yüksek sayı (varsayılan **1**)
- `prefer`: `first`, `last`, `path`, `url`

`mode: "all"` olduğunda çıktılar `[Image 1/2]`, `[Audio 2/2]` vb. olarak etiketlenir.

Dosya eki çıkarma davranışı:

- Çıkarılan dosya metni, medya istemine
  eklenmeden önce **güvenilmeyen harici içerik** olarak sarılır.
- Enjekte edilen blok,
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` gibi açık sınır işaretleyicileri kullanır ve
  bir `Source: External` metadata satırı içerir.
- Bu ek çıkarma yolu, medya istemini şişirmemek için
  uzun `SECURITY NOTICE:` başlığını kasıtlı olarak atlar; sınır
  işaretleyicileri ve metadata yine de kalır.
- Bir dosyada çıkarılabilir metin yoksa OpenClaw `[No extractable text]` enjekte eder.
- Bir PDF bu yolda işlenmiş sayfa görsellerine geri dönerse medya istemi,
  bu ek çıkarma adımı işlenmiş PDF görsellerini değil metin bloklarını ilettiği için
  `[PDF content rendered to images; images not forwarded to model]`
  yer tutucusunu korur.

## Yapılandırma örnekleri

### 1) Paylaşılan model listesi + geçersiz kılmalar

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
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
          { provider: "openai", model: "gpt-5.5" },
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

Medya anlama çalıştığında `/status`, kısa bir özet satırı içerir:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Bu, yetenek başına sonuçları ve uygun olduğunda seçilen sağlayıcı/modeli gösterir.

## Notlar

- Anlama **en iyi çaba** esasına göredir. Hatalar yanıtları engellemez.
- Anlama devre dışı olsa bile ekler yine modellere geçirilir.
- Anlamanın nerede çalışacağını sınırlamak için `scope` kullanın (ör. yalnızca DM'lerde).

## İlgili belgeler

- [Yapılandırma](/tr/gateway/configuration)
- [Görsel ve Medya Desteği](/tr/nodes/images)
