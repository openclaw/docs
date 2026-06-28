---
read_when:
    - Medya anlamayı tasarlama veya yeniden düzenleme
    - Gelen ses/video/görüntü ön işlemeyi ayarlama
sidebarTitle: Media understanding
summary: Gelen görüntü/ses/video anlama (isteğe bağlı), sağlayıcı + CLI yedekleriyle
title: Medya anlama
x-i18n:
    generated_at: "2026-06-28T08:19:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw, yanıt işlem hattı çalışmadan önce **gelen medyayı özetleyebilir** (görüntü/ses/video). Yerel araçlar veya sağlayıcı anahtarları kullanılabilir olduğunda bunu otomatik algılar; devre dışı bırakılabilir veya özelleştirilebilir. Anlama kapalıysa modeller yine her zamanki gibi özgün dosyaları/URL'leri alır.

Satıcıya özgü medya davranışı satıcı Plugin'leri tarafından kaydedilirken OpenClaw çekirdeği paylaşılan `tools.media` yapılandırmasını, yedek sırasını ve yanıt işlem hattı entegrasyonunu yönetir.

## Hedefler

- İsteğe bağlı: daha hızlı yönlendirme + daha iyi komut ayrıştırma için gelen medyayı kısa metne önceden sindir.
- Özgün medya teslimini modele koru (her zaman).
- **sağlayıcı API'lerini** ve **CLI yedeklerini** destekle.
- Sıralı yedekle birden çok modele izin ver (hata/boyut/zaman aşımı).

## Üst düzey davranış

<Steps>
  <Step title="Ekleri topla">
    Gelen ekleri topla (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Yetenek başına seç">
    Etkinleştirilmiş her yetenek (görüntü/ses/video) için ekleri ilkeye göre seç (varsayılan: **ilk**).
  </Step>
  <Step title="Model seç">
    İlk uygun model girdisini seç (boyut + yetenek + kimlik doğrulama).
  </Step>
  <Step title="Hata durumunda yedeğe geç">
    Bir model başarısız olursa veya medya çok büyükse **sonraki girdiye geç**.
  </Step>
  <Step title="Başarı bloğunu uygula">
    Başarı durumunda:

    - `Body`, `[Image]`, `[Audio]` veya `[Video]` bloğu olur.
    - Ses `{{Transcript}}` ayarlar; komut ayrıştırma varsa açıklama metnini, yoksa transkripti kullanır.
    - Açıklamalar blok içinde `User text:` olarak korunur.

  </Step>
</Steps>

Anlama başarısız olursa veya devre dışıysa **yanıt akışı**, özgün gövde + eklerle devam eder.

## Yapılandırmaya genel bakış

`tools.media`, yetenek başına geçersiz kılmaların yanında **paylaşılan modelleri** destekler:

<AccordionGroup>
  <Accordion title="Üst düzey anahtarlar">
    - `tools.media.models`: paylaşılan model listesi (sınırlamak için `capabilities` kullanın).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - varsayılanlar (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - sağlayıcı geçersiz kılmaları (`baseUrl`, `headers`, `providerOptions`)
      - `tools.media.audio.providerOptions.deepgram` üzerinden Deepgram ses seçenekleri
      - ses transkripti yankı kontrolleri (`echoTranscript`, varsayılan `false`; `echoFormat`)
      - isteğe bağlı **yetenek başına `models` listesi** (paylaşılan modellerden önce tercih edilir)
      - `attachments` ilkesi (`mode`, `maxAttachments`, `prefer`)
      - `scope` (kanal/chatType/oturum anahtarına göre isteğe bağlı sınırlama)
    - `tools.media.concurrency`: eşzamanlı en fazla yetenek çalıştırması (varsayılan **2**).

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
    - `{{OutputBase}}` (geçici dosya temel yolu, uzantı yok)

  </Tab>
</Tabs>

### Sağlayıcı kimlik bilgileri (`apiKey`)

Sağlayıcı medya anlaması, normal model çağrılarıyla aynı sağlayıcı kimlik doğrulama çözümlemesini kullanır: kimlik doğrulama profilleri, ortam değişkenleri, ardından `models.providers.<providerId>.apiKey`.

`tools.media.*.models[]` girdileri satır içi `apiKey` alanını kabul etmez. Bir medya model girdisindeki `openai` veya `moonshot` gibi `provider` değerinin standart sağlayıcı kimlik doğrulama kaynaklarından biri üzerinden kullanılabilir kimlik bilgilerine sahip olması gerekir.

En küçük örnek:

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

Profiller, ortam değişkenleri ve özel temel URL'ler dahil tam sağlayıcı kimlik doğrulama başvurusu için bkz. [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools).

## Varsayılanlar ve sınırlar

Önerilen varsayılanlar:

- `maxChars`: görüntü/video için **500** (kısa, komut dostu)
- `maxChars`: ses için **ayarlanmamış** (sınır koymadığınız sürece tam transkript)
- `maxBytes`:
  - görüntü: **10MB**
  - ses: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Kurallar">
    - Medya `maxBytes` değerini aşarsa o model atlanır ve **sonraki model denenir**.
    - **1024 bayttan** küçük ses dosyaları boş/bozuk kabul edilir ve sağlayıcı/CLI transkripsiyonundan önce atlanır; gelen yanıt bağlamı, ajanın notun çok küçük olduğunu bilmesi için deterministik bir yer tutucu transkript alır.
    - Model `maxChars` değerinden fazlasını döndürürse çıktı kırpılır.
    - `prompt` varsayılanı, basit "Describe the {media}." ile `maxChars` yönlendirmesidir (yalnızca görüntü/video).
    - Etkin birincil görüntü modeli zaten yerel olarak görüntü yeteneğini destekliyorsa OpenClaw `[Image]` özet bloğunu atlar ve bunun yerine özgün görüntüyü modele geçirir.
    - Gateway/WebChat birincil modeli yalnızca metinse görüntü ekleri, ekin kaybolması yerine görüntü/PDF araçları veya yapılandırılmış görüntü modelinin bunları inceleyebilmesi için dışa aktarılmış `media://inbound/*` başvuruları olarak korunur.
    - Açık `openclaw infer image describe --model <provider/model>` istekleri farklıdır: `ollama/qwen2.5vl:7b` gibi Ollama başvuruları dahil olmak üzere belirtilen görüntü yetenekli sağlayıcı/modeli doğrudan çalıştırır.
    - `<capability>.enabled: true` ama model yapılandırılmamışsa OpenClaw, sağlayıcısı yeteneği desteklediğinde **etkin yanıt modelini** dener.

  </Accordion>
</AccordionGroup>

### Medya anlamayı otomatik algıla (varsayılan)

`tools.media.<capability>.enabled`, `false` olarak ayarlanmamışsa ve model yapılandırmadıysanız OpenClaw bu sırayla otomatik algılar ve **ilk çalışan seçenekte durur**:

<Steps>
  <Step title="Etkin yanıt modeli">
    Sağlayıcısı yeteneği desteklediğinde etkin yanıt modeli.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` birincil/yedek başvuruları (yalnızca görüntü).
    `provider/model` başvurularını tercih edin. Çıplak başvurular yalnızca eşleşme benzersiz olduğunda yapılandırılmış görüntü yetenekli sağlayıcı model girdilerinden nitelendirilir.
  </Step>
  <Step title="Yerel CLI'lar (yalnızca ses)">
    Yerel CLI'lar (kuruluysa):

    - `sherpa-onnx-offline` (encoder/decoder/joiner/tokens ile `SHERPA_ONNX_MODEL_DIR` gerektirir)
    - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` veya paketlenen tiny modeli kullanır)
    - `whisper` (Python CLI; modelleri otomatik indirir)

  </Step>
  <Step title="Gemini CLI">
    `read_many_files` kullanan `gemini`.
  </Step>
  <Step title="Sağlayıcı kimlik doğrulaması">
    - Yeteneği destekleyen yapılandırılmış `models.providers.*` girdileri, paketlenen yedek sırasından önce denenir.
    - Görüntü yetenekli modele sahip yalnızca görüntü yapılandırma sağlayıcıları, paketlenen bir satıcı Plugin'i olmasalar bile medya anlama için otomatik kaydolur.
    - Ollama görüntü anlaması, örneğin `agents.defaults.imageModel` veya `openclaw infer image describe --model ollama/<vision-model>` üzerinden açıkça seçildiğinde kullanılabilir.

    Paketlenen yedek sırası:

    - Ses: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - Görüntü: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
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
İkili dosya algılama macOS/Linux/Windows genelinde en iyi çabayla yapılır; CLI'ın `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yolu ile açık bir CLI modeli ayarlayın.
</Note>

### Proxy ortam desteği (sağlayıcı modelleri)

Sağlayıcı tabanlı **ses** ve **video** medya anlaması etkinleştirildiğinde OpenClaw, sağlayıcı HTTP çağrıları için standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Proxy ortam değişkeni ayarlanmamışsa medya anlaması doğrudan çıkış kullanır. Proxy değeri hatalı biçimlendirilmişse OpenClaw bir uyarı günlüğe yazar ve doğrudan getirmeye geri döner.

## Yetenekler (isteğe bağlı)

`capabilities` ayarlarsanız girdi yalnızca bu medya türleri için çalışır. Paylaşılan listeler için OpenClaw varsayılanları çıkarabilir:

- `openai`, `anthropic`, `minimax`: **görüntü**
- `minimax-portal`: **görüntü**
- `moonshot`: **görüntü + video**
- `openrouter`: **görüntü + ses**
- `google` (Gemini API): **görüntü + ses + video**
- `qwen`: **görüntü + video**
- `mistral`: **ses**
- `zai`: **görüntü**
- `groq`: **ses**
- `xai`: **ses**
- `deepgram`: **ses**
- Görüntü yetenekli modele sahip herhangi bir `models.providers.<id>.models[]` kataloğu: **görüntü**

CLI girdileri için şaşırtıcı eşleşmelerden kaçınmak üzere **`capabilities` değerini açıkça ayarlayın**. `capabilities` değerini atlarsanız girdi, göründüğü liste için uygun olur.

## Sağlayıcı destek matrisi (OpenClaw entegrasyonları)

| Yetenek | Sağlayıcı entegrasyonu                                                                                                      | Notlar                                                                                                                                                                                                                                      |
| ------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Görüntü | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, yapılandırma sağlayıcıları | Satıcı Plugin'leri görüntü desteğini kaydeder; `openai/*` API anahtarı veya Codex OAuth yönlendirmesi kullanabilir; `codex/*` sınırlı bir Codex app-server turu kullanır; MiniMax ve MiniMax OAuth ikisi de `MiniMax-VL-01` kullanır; görüntü yetenekli yapılandırma sağlayıcıları otomatik kaydolur. |
| Ses     | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                          | Sağlayıcı transkripsiyonu (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                     |
| Video   | Google, Qwen, Moonshot                                                                                                    | Satıcı Plugin'leri üzerinden sağlayıcı video anlaması; Qwen video anlaması Standard DashScope uç noktalarını kullanır.                                                                                                                       |

<Note>
**MiniMax notu**

- `minimax`, `minimax-cn`, `minimax-portal` ve `minimax-portal-cn` görsel anlama özelliği, Plugin'e ait `MiniMax-VL-01` medya sağlayıcısından gelir.
- Otomatik görsel yönlendirme, eski MiniMax M2.x sohbet meta verileri görsel girdisi olduğunu iddia etse bile `MiniMax-VL-01` kullanmaya devam eder.

</Note>

## Model seçimi rehberi

- Kalite ve güvenlik önemli olduğunda her medya yeteneği için kullanılabilir en güçlü en yeni nesil modeli tercih edin.
- Güvenilmeyen girdileri işleyen araç etkin ajanlar için daha eski/zayıf medya modellerinden kaçının.
- Erişilebilirlik için yetenek başına en az bir yedek tutun (kaliteli model + daha hızlı/daha ucuz model).
- Sağlayıcı API'leri kullanılamadığında CLI yedekleri (`whisper-cli`, `whisper`, `gemini`) yararlıdır.
- `parakeet-mlx` notu: `--output-dir` ile, çıktı biçimi `txt` olduğunda (veya belirtilmediğinde) OpenClaw `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` olmayan biçimler stdout'a geri döner.

## Ek ilkesi

Yetenek başına `attachments`, hangi eklerin işleneceğini denetler:

<ParamField path="mode" type='"first" | "all"' default="first">
  İlk seçilen ekin mi yoksa tümünün mü işleneceği.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  İşlenecek sayıyı sınırlar.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Aday ekler arasındaki seçim tercihi.
</ParamField>

`mode: "all"` olduğunda çıktılar `[Image 1/2]`, `[Audio 2/2]` vb. olarak etiketlenir.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - Çıkarılan dosya metni, medya istemine eklenmeden önce **güvenilmeyen harici içerik** olarak sarmalanır.
    - Enjekte edilen blok, `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` gibi açık sınır işaretçileri kullanır ve bir `Source: External` meta veri satırı içerir.
    - Bu ek çıkarma yolu, medya istemini şişirmemek için uzun `SECURITY NOTICE:` başlığını bilinçli olarak atlar; sınır işaretçileri ve meta veriler yine de kalır.
    - Bir dosyada çıkarılabilir metin yoksa OpenClaw `[No extractable text]` enjekte eder.
    - Bir PDF bu yolda işlenmiş sayfa görsellerine geri dönerse OpenClaw bu sayfa görsellerini görme yetenekli yanıt modellerine iletir ve dosya bloğunda `[PDF content rendered to images]` yer tutucusunu tutar.

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

Medya anlama çalıştığında `/status` kısa bir özet satırı içerir:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Bu, yetenek başına sonuçları ve varsa seçilen sağlayıcı/modeli gösterir.

## Notlar

- Anlama **en iyi çaba** esaslıdır. Hatalar yanıtları engellemez.
- Anlama devre dışı olduğunda bile ekler modellere iletilmeye devam eder.
- Anlamanın nerede çalışacağını sınırlamak için `scope` kullanın (örn. yalnızca DM'ler).

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Görsel ve medya desteği](/tr/nodes/images)
