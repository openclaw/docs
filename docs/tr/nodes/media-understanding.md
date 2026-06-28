---
read_when:
    - Medya anlamayı tasarlama veya yeniden düzenleme
    - Gelen ses/video/görüntü ön işlemesini ayarlama
sidebarTitle: Media understanding
summary: Gelen görüntü/ses/video anlama (isteğe bağlı), sağlayıcı + CLI geri dönüşleriyle
title: Medya anlama
x-i18n:
    generated_at: "2026-06-28T05:07:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw, yanıt işlem hattı çalışmadan önce **gelen medyayı özetleyebilir** (görüntü/ses/video). Yerel araçlar veya sağlayıcı anahtarları kullanılabilir olduğunda bunu otomatik algılar ve devre dışı bırakılabilir ya da özelleştirilebilir. Anlama kapalıysa modeller yine her zamanki gibi özgün dosyaları/URL'leri alır.

Satıcıya özgü medya davranışı satıcı plugin'leri tarafından kaydedilirken, paylaşılan `tools.media` yapılandırması, geri dönüş sırası ve yanıt işlem hattı entegrasyonu OpenClaw çekirdeğine aittir.

## Hedefler

- İsteğe bağlı: Daha hızlı yönlendirme + daha iyi komut ayrıştırma için gelen medyayı önceden kısa metne indirgeme.
- Özgün medyanın modele teslimini koru (her zaman).
- **Sağlayıcı API'lerini** ve **CLI geri dönüşlerini** destekle.
- Sıralı geri dönüşle birden çok modele izin ver (hata/boyut/zaman aşımı).

## Üst düzey davranış

<Steps>
  <Step title="Ekleri topla">
    Gelen ekleri topla (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Yetenek bazında seç">
    Etkin her yetenek için (görüntü/ses/video), ekleri ilkeye göre seç (varsayılan: **ilk**).
  </Step>
  <Step title="Model seç">
    Uygun ilk model girdisini seç (boyut + yetenek + kimlik doğrulama).
  </Step>
  <Step title="Başarısızlıkta geri dön">
    Bir model başarısız olursa veya medya çok büyükse, **sonraki girdiye geri dön**.
  </Step>
  <Step title="Başarı bloğunu uygula">
    Başarı durumunda:

    - `Body`, `[Image]`, `[Audio]` veya `[Video]` bloğuna dönüşür.
    - Ses `{{Transcript}}` değerini ayarlar; komut ayrıştırma varsa açıklama metnini, yoksa transkripti kullanır.
    - Açıklamalar blok içinde `User text:` olarak korunur.

  </Step>
</Steps>

Anlama başarısız olursa veya devre dışıysa **yanıt akışı**, özgün gövde + eklerle devam eder.

## Yapılandırma genel görünümü

`tools.media`, **paylaşılan modelleri** ve yetenek bazında geçersiz kılmaları destekler:

<AccordionGroup>
  <Accordion title="Üst düzey anahtarlar">
    - `tools.media.models`: paylaşılan model listesi (kapılamak için `capabilities` kullanın).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - varsayılanlar (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - sağlayıcı geçersiz kılmaları (`baseUrl`, `headers`, `providerOptions`)
      - `tools.media.audio.providerOptions.deepgram` üzerinden Deepgram ses seçenekleri
      - ses transkript yankısı denetimleri (`echoTranscript`, varsayılan `false`; `echoFormat`)
      - isteğe bağlı **yetenek bazında `models` listesi** (paylaşılan modellerden önce tercih edilir)
      - `attachments` ilkesi (`mode`, `maxAttachments`, `prefer`)
      - `scope` (kanal/chatType/oturum anahtarına göre isteğe bağlı kapılama)
    - `tools.media.concurrency`: en fazla eşzamanlı yetenek çalıştırması (varsayılan **2**).

  </Accordion>
</AccordionGroup>

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

<Tabs>
  <Tab title="Sağlayıcı girdisi">
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
    - `{{OutputDir}}` (bu çalıştırma için oluşturulan geçici dizin)
    - `{{OutputBase}}` (uzantısız geçici dosya taban yolu)

  </Tab>
</Tabs>

### Sağlayıcı kimlik bilgileri (`apiKey`)

Sağlayıcı medya anlama, normal model çağrılarıyla aynı sağlayıcı kimlik doğrulama çözümlemesini kullanır: kimlik doğrulama profilleri, ortam değişkenleri, ardından `models.providers.<providerId>.apiKey`.

`tools.media.*.models[]` girdileri satır içi `apiKey` alanını kabul etmez. Bir medya modeli girdisindeki `openai` veya `moonshot` gibi `provider` değeri, standart sağlayıcı kimlik doğrulama kaynaklarından biri üzerinden kullanılabilir kimlik bilgilerine sahip olmalıdır.

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

Profiller, ortam değişkenleri ve özel temel URL'ler dahil tam sağlayıcı kimlik doğrulama başvurusu için [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) sayfasına bakın.

## Varsayılanlar ve sınırlar

Önerilen varsayılanlar:

- `maxChars`: görüntü/video için **500** (kısa, komut dostu)
- `maxChars`: ses için **ayarlanmamış** (bir sınır belirlemediğiniz sürece tam transkript)
- `maxBytes`:
  - görüntü: **10 MB**
  - ses: **20 MB**
  - video: **50 MB**

<AccordionGroup>
  <Accordion title="Kurallar">
    - Medya `maxBytes` değerini aşarsa, o model atlanır ve **sonraki model denenir**.
    - **1024 bayttan** küçük ses dosyaları boş/bozuk kabul edilir ve sağlayıcı/CLI transkripsiyonundan önce atlanır; gelen yanıt bağlamı, ajanın notun çok küçük olduğunu bilmesi için belirleyici bir yer tutucu transkript alır.
    - Model `maxChars` değerinden fazlasını döndürürse çıktı kırpılır.
    - `prompt` varsayılan olarak basit "Describe the {media}." ifadesine ve `maxChars` rehberliğine ayarlanır (yalnızca görüntü/video).
    - Etkin birincil görüntü modeli zaten yerel olarak görmeyi destekliyorsa OpenClaw `[Image]` özet bloğunu atlar ve bunun yerine özgün görüntüyü modele geçirir.
    - Gateway/WebChat birincil modeli yalnızca metinse, görüntü ekleri dışa aktarılmış `media://inbound/*` ref'leri olarak korunur; böylece görüntü/PDF araçları veya yapılandırılmış görüntü modeli eki kaybetmek yerine hâlâ inceleyebilir.
    - Açık `openclaw infer image describe --model <provider/model>` istekleri farklıdır: `ollama/qwen2.5vl:7b` gibi Ollama ref'leri dahil olmak üzere, görüntü yetenekli o sağlayıcı/modeli doğrudan çalıştırırlar.
    - `<capability>.enabled: true` ancak hiçbir model yapılandırılmamışsa OpenClaw, sağlayıcısı yeteneği desteklediğinde **etkin yanıt modelini** dener.

  </Accordion>
</AccordionGroup>

### Medya anlamayı otomatik algıla (varsayılan)

`tools.media.<capability>.enabled`, `false` olarak **ayarlanmamışsa** ve model yapılandırmadıysanız OpenClaw bu sırayla otomatik algılar ve **ilk çalışan seçenekte durur**:

<Steps>
  <Step title="Etkin yanıt modeli">
    Sağlayıcısı yeteneği desteklediğinde etkin yanıt modeli.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` birincil/geri dönüş ref'leri (yalnızca görüntü).
    `provider/model` ref'lerini tercih edin. Çıplak ref'ler, yalnızca eşleşme benzersiz olduğunda yapılandırılmış görüntü yetenekli sağlayıcı model girdilerinden nitelenir.
  </Step>
  <Step title="Yerel CLI'lar (yalnızca ses)">
    Yerel CLI'lar (kuruluysa):

    - `sherpa-onnx-offline` (encoder/decoder/joiner/tokens ile `SHERPA_ONNX_MODEL_DIR` gerektirir)
    - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` veya paketlenmiş tiny modeli kullanır)
    - `whisper` (Python CLI; modelleri otomatik indirir)

  </Step>
  <Step title="Gemini CLI">
    `read_many_files` kullanan `gemini`.
  </Step>
  <Step title="Sağlayıcı kimlik doğrulaması">
    - Yeteneği destekleyen yapılandırılmış `models.providers.*` girdileri, paketlenmiş geri dönüş sırasından önce denenir.
    - Görüntü yetenekli bir modele sahip yalnızca görüntü yapılandırma sağlayıcıları, paketlenmiş satıcı plugin'i olmasalar bile medya anlama için otomatik kaydolur.
    - Ollama görüntü anlama, örneğin `agents.defaults.imageModel` veya `openclaw infer image describe --model ollama/<vision-model>` üzerinden açıkça seçildiğinde kullanılabilir.

    Paketlenmiş geri dönüş sırası:

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
İkili dosya algılama macOS/Linux/Windows genelinde en iyi çabayla yapılır; CLI'ın `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yoluyla açık bir CLI modeli ayarlayın.
</Note>

### Proxy ortam desteği (sağlayıcı modelleri)

Sağlayıcı tabanlı **ses** ve **video** medya anlama etkinleştirildiğinde OpenClaw, sağlayıcı HTTP çağrıları için standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Proxy ortam değişkenleri ayarlanmamışsa medya anlama doğrudan çıkışı kullanır. Proxy değeri hatalı biçimlendirilmişse OpenClaw bir uyarı günlüğe yazar ve doğrudan getirmeye geri döner.

## Yetenekler (isteğe bağlı)

`capabilities` ayarlarsanız, girdi yalnızca o medya türleri için çalışır. Paylaşılan listeler için OpenClaw varsayılanları çıkarabilir:

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

CLI girdileri için şaşırtıcı eşleşmelerden kaçınmak amacıyla **`capabilities` değerini açıkça ayarlayın**. `capabilities` değerini atlarsanız girdi, içinde bulunduğu liste için uygun olur.

## Sağlayıcı destek matrisi (OpenClaw entegrasyonları)

| Yetenek | Sağlayıcı entegrasyonu                                                                                                        | Notlar                                                                                                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Görüntü      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | Satıcı plugin'leri görüntü desteğini kaydeder; `openai/*`, API anahtarı veya Codex OAuth yönlendirmesini kullanabilir; `codex/*`, sınırlı bir Codex app-server turu kullanır; MiniMax ve MiniMax OAuth ikisi de `MiniMax-VL-01` kullanır; görüntü yetenekli yapılandırma sağlayıcıları otomatik kaydolur. |
| Ses      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Sağlayıcı transkripsiyonu (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                               |
| Video      | Google, Qwen, Moonshot                                                                                                       | Satıcı plugin'leri üzerinden sağlayıcı video anlama; Qwen video anlama Standard DashScope uç noktalarını kullanır.                                                                                                                                     |

<Note>
**MiniMax notu**

- `minimax`, `minimax-cn`, `minimax-portal` ve `minimax-portal-cn` görüntü anlama özelliği, Plugin'e ait `MiniMax-VL-01` medya sağlayıcısından gelir.
- Otomatik görüntü yönlendirme, eski MiniMax M2.x sohbet meta verileri görüntü girdisi iddia etse bile `MiniMax-VL-01` kullanmaya devam eder.

</Note>

## Model seçimi rehberi

- Kalite ve güvenlik önemli olduğunda, her medya yeteneği için mevcut en güçlü en yeni nesil modeli tercih edin.
- Güvenilmeyen girdileri işleyen araç etkinleştirilmiş ajanlar için daha eski/zayıf medya modellerinden kaçının.
- Erişilebilirlik için her yetenek başına en az bir yedek tutun (kaliteli model + daha hızlı/daha ucuz model).
- CLI yedekleri (`whisper-cli`, `whisper`, `gemini`), sağlayıcı API'leri kullanılamadığında işe yarar.
- `parakeet-mlx` notu: `--output-dir` ile, çıktı biçimi `txt` olduğunda (veya belirtilmediğinde) OpenClaw `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` olmayan biçimler stdout'a geri döner.

## Ek politikası

Yetenek başına `attachments`, hangi eklerin işleneceğini denetler:

<ParamField path="mode" type='"first" | "all"' default="first">
  İlk seçilen ekin mi yoksa tüm eklerin mi işleneceği.
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
    - Enjekte edilen blok, `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` gibi açık sınır işaretleyicileri kullanır ve bir `Source: External` meta veri satırı içerir.
    - Bu ek çıkarma yolu, medya istemini şişirmemek için uzun `SECURITY NOTICE:` başlığını bilerek atlar; sınır işaretleyicileri ve meta veriler yine de kalır.
    - Bir dosyada çıkarılabilir metin yoksa OpenClaw `[No extractable text]` enjekte eder.
    - Bir PDF bu yolda işlenmiş sayfa görüntülerine geri dönerse OpenClaw bu sayfa görüntülerini görsel yetenekli yanıt modellerine iletir ve dosya bloğunda `[PDF content rendered to images]` yer tutucusunu korur.

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

Bu, yetenek başına sonuçları ve uygulanabildiğinde seçilen sağlayıcı/modeli gösterir.

## Notlar

- Anlama **en iyi çaba esasına dayalıdır**. Hatalar yanıtları engellemez.
- Anlama devre dışı bırakıldığında bile ekler modellere iletilmeye devam eder.
- Anlamanın nerede çalışacağını sınırlamak için `scope` kullanın (ör. yalnızca doğrudan mesajlar).

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Görüntü ve medya desteği](/tr/nodes/images)
