---
read_when:
    - Medya anlamayı tasarlama veya yeniden düzenleme
    - Gelen ses/video/görüntü ön işlemesini ayarlama
sidebarTitle: Media understanding
summary: Gelen görüntü/ses/video anlama (isteğe bağlı), sağlayıcı + CLI fallback’leriyle
title: Medya anlama
x-i18n:
    generated_at: "2026-06-28T00:46:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw, yanıt işlem hattı çalışmadan önce **gelen medyayı özetleyebilir** (görsel/ses/video). Yerel araçlar veya sağlayıcı anahtarları kullanılabilir olduğunda otomatik algılar ve devre dışı bırakılabilir ya da özelleştirilebilir. Anlama kapalıysa modeller yine her zamanki gibi özgün dosyaları/URL'leri alır.

Tedarikçiye özgü medya davranışı tedarikçi Plugin'leri tarafından kaydedilirken, OpenClaw çekirdeği paylaşılan `tools.media` yapılandırmasına, yedekleme sırasına ve yanıt işlem hattı entegrasyonuna sahip olur.

## Hedefler

- İsteğe bağlı: daha hızlı yönlendirme + daha iyi komut ayrıştırma için gelen medyayı kısa metne önceden sindir.
- Özgün medya teslimini modele koru (her zaman).
- **sağlayıcı API'lerini** ve **CLI yedeklerini** destekle.
- Sıralı yedeklemeyle birden çok modele izin ver (hata/boyut/zaman aşımı).

## Üst düzey davranış

<Steps>
  <Step title="Ekleri topla">
    Gelen ekleri topla (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Yetenek bazında seç">
    Etkinleştirilen her yetenek (görsel/ses/video) için ekleri ilkeye göre seç (varsayılan: **ilk**).
  </Step>
  <Step title="Model seç">
    İlk uygun model girdisini seç (boyut + yetenek + kimlik doğrulama).
  </Step>
  <Step title="Başarısızlıkta yedekle">
    Bir model başarısız olursa veya medya çok büyükse **sonraki girdiye geri dön**.
  </Step>
  <Step title="Başarı bloğunu uygula">
    Başarılı olduğunda:

    - `Body`, `[Image]`, `[Audio]` veya `[Video]` bloğu olur.
    - Ses `{{Transcript}}` değerini ayarlar; komut ayrıştırma varsa başlık metnini, yoksa transkripti kullanır.
    - Başlıklar bloğun içinde `User text:` olarak korunur.

  </Step>
</Steps>

Anlama başarısız olursa veya devre dışıysa **yanıt akışı devam eder**, özgün gövde + eklerle.

## Yapılandırma özeti

`tools.media`, yetenek başına geçersiz kılmalarla birlikte **paylaşılan modelleri** destekler:

<AccordionGroup>
  <Accordion title="Üst düzey anahtarlar">
    - `tools.media.models`: paylaşılan model listesi (geçitlemek için `capabilities` kullanın).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - varsayılanlar (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - sağlayıcı geçersiz kılmaları (`baseUrl`, `headers`, `providerOptions`)
      - `tools.media.audio.providerOptions.deepgram` üzerinden Deepgram ses seçenekleri
      - ses transkript yankısı denetimleri (`echoTranscript`, varsayılan `false`; `echoFormat`)
      - isteğe bağlı **yetenek başına `models` listesi** (paylaşılan modellerden önce tercih edilir)
      - `attachments` ilkesi (`mode`, `maxAttachments`, `prefer`)
      - `scope` (kanal/chatType/oturum anahtarına göre isteğe bağlı geçitleme)
    - `tools.media.concurrency`: en fazla eşzamanlı yetenek çalıştırması (varsayılan **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Model girdileri

Her `models[]` girdisi **sağlayıcı** veya **CLI** olabilir:

<Tabs>
  <Tab title="Sağlayıcı girdisi">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="CLI girdisi">
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

    CLI şablonları şunları da kullanabilir:

    - `{{MediaDir}}` (medya dosyasını içeren dizin)
    - `{{OutputDir}}` (bu çalışma için oluşturulan geçici dizin)
    - `{{OutputBase}}` (geçici dosya temel yolu, uzantısız)

  </Tab>
</Tabs>

### Sağlayıcı kimlik bilgileri (`apiKey`)

Sağlayıcı medya anlama, normal model çağrılarıyla aynı sağlayıcı kimlik doğrulama çözümlemesini kullanır: kimlik doğrulama profilleri, ortam değişkenleri, ardından `models.providers.<providerId>.apiKey`.

`tools.media.*.models[]` girdileri satır içi `apiKey` alanını kabul etmez. Bir medya modeli girdisindeki `provider` değeri, örneğin `openai` veya `moonshot`, standart sağlayıcı kimlik doğrulama kaynaklarından biri üzerinden kullanılabilir kimlik bilgilerine sahip olmalıdır.

Minimal örnek:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Profiller, ortam değişkenleri ve özel temel URL'ler dahil tam sağlayıcı kimlik doğrulama başvurusu için [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) bölümüne bakın.

## Varsayılanlar ve sınırlar

Önerilen varsayılanlar:

- `maxChars`: görsel/video için **500** (kısa, komut dostu)
- `maxChars`: ses için **ayarlanmamış** (bir sınır ayarlamadığınız sürece tam transkript)
- `maxBytes`:
  - görsel: **10MB**
  - ses: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Kurallar">
    - Medya `maxBytes` değerini aşarsa o model atlanır ve **sonraki model denenir**.
    - **1024 bayttan** küçük ses dosyaları boş/bozuk kabul edilir ve sağlayıcı/CLI transkripsiyonundan önce atlanır; gelen yanıt bağlamı, ajanın notun çok küçük olduğunu bilmesi için deterministik bir yer tutucu transkript alır.
    - Model `maxChars` değerinden fazlasını döndürürse çıktı kırpılır.
    - `prompt`, basit "Describe the {media}." metnine ek olarak `maxChars` kılavuzuna varsayılanlanır (yalnızca görsel/video).
    - Etkin birincil görsel modeli zaten yerel olarak görmeyi destekliyorsa OpenClaw, `[Image]` özet bloğunu atlar ve bunun yerine özgün görseli modele geçirir.
    - Bir Gateway/WebChat birincil modeli yalnızca metinse görsel ekleri, eki kaybetmek yerine görsel/PDF araçlarının veya yapılandırılmış görsel modelinin hâlâ inceleyebilmesi için dışa aktarılmış `media://inbound/*` referansları olarak korunur.
    - Açık `openclaw infer image describe --model <provider/model>` istekleri farklıdır: `ollama/qwen2.5vl:7b` gibi Ollama referansları dahil olmak üzere, o görsel yetenekli sağlayıcı/modeli doğrudan çalıştırırlar.
    - `<capability>.enabled: true` ise ancak hiçbir model yapılandırılmamışsa OpenClaw, sağlayıcısı yeteneği desteklediğinde **etkin yanıt modelini** dener.

  </Accordion>
</AccordionGroup>

### Medya anlamayı otomatik algıla (varsayılan)

`tools.media.<capability>.enabled`, `false` olarak ayarlanmamışsa ve model yapılandırmadıysanız OpenClaw bu sırayla otomatik algılar ve **ilk çalışan seçenekte durur**:

<Steps>
  <Step title="Etkin yanıt modeli">
    Sağlayıcısı yeteneği desteklediğinde etkin yanıt modeli.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` birincil/yedek referansları (yalnızca görsel).
    `provider/model` referanslarını tercih edin. Yalın referanslar, yalnızca eşleşme benzersiz olduğunda yapılandırılmış görsel yetenekli sağlayıcı model girdilerinden nitelenir.
  </Step>
  <Step title="Yerel CLI'ler (yalnızca ses)">
    Yerel CLI'ler (kuruluysa):

    - `sherpa-onnx-offline` (encoder/decoder/joiner/tokens ile `SHERPA_ONNX_MODEL_DIR` gerektirir)
    - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` veya paketli tiny modeli kullanır)
    - `whisper` (Python CLI; modelleri otomatik indirir)

  </Step>
  <Step title="Gemini CLI">
    `read_many_files` kullanan `gemini`.
  </Step>
  <Step title="Sağlayıcı kimlik doğrulaması">
    - Yetenek destekleyen yapılandırılmış `models.providers.*` girdileri, paketli yedek sırasından önce denenir.
    - Görsel yetenekli modeli olan yalnızca görsel yapılandırma sağlayıcıları, paketli tedarikçi Plugin'i olmasalar bile medya anlama için otomatik kaydedilir.
    - Ollama görsel anlama, örneğin `agents.defaults.imageModel` veya `openclaw infer image describe --model ollama/<vision-model>` üzerinden açıkça seçildiğinde kullanılabilir.

    Paketli yedek sırası:

    - Ses: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - Görsel: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Video: Google → Qwen → Moonshot

  </Step>
</Steps>

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

<Note>
İkili algılama macOS/Linux/Windows genelinde en iyi çaba esasına dayanır; CLI'nin `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yoluyla açık bir CLI modeli ayarlayın.
</Note>

### Proxy ortam desteği (sağlayıcı modelleri)

Sağlayıcı tabanlı **ses** ve **video** medya anlama etkinleştirildiğinde OpenClaw, sağlayıcı HTTP çağrıları için standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Hiçbir proxy ortam değişkeni ayarlanmamışsa medya anlama doğrudan çıkış kullanır. Proxy değeri hatalı biçimlendirilmişse OpenClaw bir uyarı kaydeder ve doğrudan getirmeye geri döner.

## Yetenekler (isteğe bağlı)

`capabilities` ayarlarsanız girdi yalnızca bu medya türleri için çalışır. Paylaşılan listeler için OpenClaw varsayılanları çıkarabilir:

- `openai`, `anthropic`, `minimax`: **görsel**
- `minimax-portal`: **görsel**
- `moonshot`: **görsel + video**
- `openrouter`: **görsel + ses**
- `google` (Gemini API): **görsel + ses + video**
- `qwen`: **görsel + video**
- `mistral`: **ses**
- `zai`: **görsel**
- `groq`: **ses**
- `xai`: **ses**
- `deepgram`: **ses**
- Görsel yetenekli modeli olan herhangi bir `models.providers.<id>.models[]` kataloğu: **görsel**

CLI girdileri için beklenmeyen eşleşmeleri önlemek üzere **`capabilities` değerini açıkça ayarlayın**. `capabilities` değerini atlarsanız girdi, içinde göründüğü liste için uygun olur.

## Sağlayıcı destek matrisi (OpenClaw entegrasyonları)

| Yetenek | Sağlayıcı entegrasyonu                                                                                                       | Notlar                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Görsel      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, yapılandırma sağlayıcıları | Tedarikçi Plugin'leri görsel desteğini kaydeder; `openai/*` API anahtarı veya Codex OAuth yönlendirmesi kullanabilir; `codex/*` sınırlı bir Codex app-server dönüşü kullanır; MiniMax ve MiniMax OAuth ikisi de `MiniMax-VL-01` kullanır; görsel yetenekli yapılandırma sağlayıcıları otomatik kaydedilir. |
| Ses      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Sağlayıcı transkripsiyonu (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                     |
| Video      | Google, Qwen, Moonshot                                                                                                       | Tedarikçi Plugin'leri üzerinden sağlayıcı video anlama; Qwen video anlama Standard DashScope uç noktalarını kullanır.                                                                                                                       |

<Note>
**MiniMax notu**

- `minimax`, `minimax-cn`, `minimax-portal` ve `minimax-portal-cn` görüntü anlama desteği, Plugin'e ait `MiniMax-VL-01` medya sağlayıcısından gelir.
- Otomatik görüntü yönlendirme, eski MiniMax M2.x sohbet meta verileri görüntü girişini desteklediğini iddia etse bile `MiniMax-VL-01` kullanmaya devam eder.

</Note>

## Model seçimi kılavuzu

- Kalite ve güvenlik önemli olduğunda, her medya yeteneği için mevcut en güçlü en yeni nesil modeli tercih edin.
- Güvenilmeyen girdileri işleyen araç etkin ajanlarda, daha eski/zayıf medya modellerinden kaçının.
- Erişilebilirlik için her yetenek başına en az bir geri dönüş seçeneği tutun (kalite modeli + daha hızlı/daha ucuz model).
- CLI geri dönüşleri (`whisper-cli`, `whisper`, `gemini`), sağlayıcı API'leri kullanılamadığında yararlıdır.
- `parakeet-mlx` notu: `--output-dir` ile, çıktı biçimi `txt` olduğunda (veya belirtilmediğinde) OpenClaw `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` olmayan biçimler stdout'a geri döner.

## Ek ilkesi

Yetenek başına `attachments`, hangi eklerin işleneceğini denetler:

<ParamField path="mode" type='"first" | "all"' default="first">
  İlk seçilen ekin mi yoksa tümünün mü işleneceği.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  İşlenen sayıyı sınırlar.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Aday ekler arasındaki seçim tercihi.
</ParamField>

`mode: "all"` olduğunda çıktılar `[Image 1/2]`, `[Audio 2/2]` vb. olarak etiketlenir.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - Çıkarılan dosya metni, medya istemine eklenmeden önce **güvenilmeyen harici içerik** olarak sarılır.
    - Enjekte edilen blok, `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` gibi açık sınır işaretleyicileri kullanır ve `Source: External` meta veri satırı içerir.
    - Bu ek çıkarma yolu, medya istemini gereksiz büyütmemek için uzun `SECURITY NOTICE:` afişini özellikle atlar; sınır işaretleyicileri ve meta veriler yine de kalır.
    - Bir dosyada çıkarılabilir metin yoksa OpenClaw `[No extractable text]` enjekte eder.
    - Bir PDF bu yolda işlenmiş sayfa görüntülerine geri dönerse medya istemi `[PDF content rendered to images; images not forwarded to model]` yer tutucusunu korur, çünkü bu ek çıkarma adımı işlenmiş PDF görüntülerini değil, metin bloklarını iletir.

  </Accordion>
</AccordionGroup>

## Yapılandırma örnekleri

<Tabs>
  <Tab title="Shared models + overrides">
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
  </Tab>
  <Tab title="Audio + video only">
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
  </Tab>
  <Tab title="Image-only">
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
  </Tab>
  <Tab title="Multi-modal single entry">
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
  </Tab>
</Tabs>

## Durum çıktısı

Medya anlama çalıştığında, `/status` kısa bir özet satırı içerir:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Bu, yetenek başına sonuçları ve geçerli olduğunda seçilen sağlayıcı/modeli gösterir.

## Notlar

- Anlama **en iyi çaba** esasına dayanır. Hatalar yanıtları engellemez.
- Anlama devre dışı olsa bile ekler modellere yine de iletilir.
- Anlamanın nerede çalışacağını sınırlamak için `scope` kullanın (örn. yalnızca DM'ler).

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Görüntü ve medya desteği](/tr/nodes/images)
