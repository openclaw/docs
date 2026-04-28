---
read_when:
    - Medya anlamayı tasarlama veya yeniden düzenleme
    - Gelen ses/video/görsel ön işlemeyi ayarlama
sidebarTitle: Media understanding
summary: Gelen görsel/ses/video anlama (isteğe bağlı), sağlayıcı + CLI geri dönüşleriyle
title: Medya anlama
x-i18n:
    generated_at: "2026-04-26T11:35:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

OpenClaw, yanıt hattı çalışmadan önce **gelen medyayı özetleyebilir** (görsel/ses/video). Yerel araçlar veya sağlayıcı anahtarları mevcut olduğunda bunu otomatik algılar ve devre dışı bırakılabilir veya özelleştirilebilir. Anlama kapalıysa modeller her zamanki gibi yine özgün dosyaları/URL'leri alır.

Sağlayıcıya özgü medya davranışı sağlayıcı Plugin'leri tarafından kaydedilir; OpenClaw çekirdeği ise paylaşılan `tools.media` yapılandırmasının, geri dönüş sırasının ve yanıt hattı entegrasyonunun sahibidir.

## Hedefler

- İsteğe bağlı: daha hızlı yönlendirme + daha iyi komut ayrıştırma için gelen medyayı kısa metne önceden sindirmek.
- Özgün medya teslimatını modele korumak (her zaman).
- **Sağlayıcı API'lerini** ve **CLI geri dönüşlerini** desteklemek.
- Sıralı geri dönüşle birden çok modele izin vermek (hata/boyut/zaman aşımı).

## Üst düzey davranış

<Steps>
  <Step title="Ekleri topla">
    Gelen ekleri topla (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Yetenek başına seç">
    Etkin her yetenek için (görsel/ses/video), ilkeye göre ekleri seç (varsayılan: **ilk**).
  </Step>
  <Step title="Model seç">
    Uygun ilk model girdisini seç (boyut + yetenek + auth).
  </Step>
  <Step title="Başarısızlıkta geri dön">
    Bir model başarısız olursa veya medya çok büyükse **sonraki girdiye geri dön**.
  </Step>
  <Step title="Başarı bloğunu uygula">
    Başarılı olursa:

    - `Body`, `[Image]`, `[Audio]` veya `[Video]` bloğu olur.
    - Ses, `{{Transcript}}` ayarlar; komut ayrıştırma, varsa başlık metnini, yoksa dökümü kullanır.
    - Başlıklar blok içinde `User text:` olarak korunur.

  </Step>
</Steps>

Anlama başarısız olursa veya devre dışıysa, **yanıt akışı** özgün gövde + eklerle devam eder.

## Yapılandırma genel bakışı

`tools.media`, **paylaşılan modelleri** ve yetenek başına geçersiz kılmaları destekler:

<AccordionGroup>
  <Accordion title="Üst düzey anahtarlar">
    - `tools.media.models`: paylaşılan model listesi (`capabilities` ile geçit kurun).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - varsayılanlar (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - sağlayıcı geçersiz kılmaları (`baseUrl`, `headers`, `providerOptions`)
      - `tools.media.audio.providerOptions.deepgram` üzerinden Deepgram ses seçenekleri
      - ses dökümü yankı denetimleri (`echoTranscript`, varsayılan `false`; `echoFormat`)
      - isteğe bağlı **yetenek başına `models` listesi** (paylaşılan modellerden önce tercih edilir)
      - `attachments` ilkesi (`mode`, `maxAttachments`, `prefer`)
      - `scope` (kanal/sohbet türü/oturum anahtarına göre isteğe bağlı geçitleme)
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
      prompt: "Görseli <= 500 karakterle açıkla.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // isteğe bağlı, çok kipli girdiler için kullanılır
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
        "{{MediaPath}} adresindeki medyayı oku ve <= {{MaxChars}} karakterle açıkla.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    CLI şablonları ayrıca şunları da kullanabilir:

    - `{{MediaDir}}` (medya dosyasını içeren dizin)
    - `{{OutputDir}}` (bu çalışma için oluşturulan scratch dizini)
    - `{{OutputBase}}` (scratch dosya temel yolu, uzantısız)

  </Tab>
</Tabs>

## Varsayılanlar ve sınırlar

Önerilen varsayılanlar:

- `maxChars`: görsel/video için **500** (kısa, komut dostu)
- `maxChars`: ses için **ayarsız** (siz sınır koymazsanız tam döküm)
- `maxBytes`:
  - görsel: **10MB**
  - ses: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Kurallar">
    - Medya `maxBytes` değerini aşarsa, o model atlanır ve **sonraki model denenir**.
    - **1024 bayttan** küçük ses dosyaları boş/bozuk sayılır ve sağlayıcı/CLI dökümünden önce atlanır; gelen yanıt bağlamı, notun çok küçük olduğunu ajanın bilmesi için deterministik bir yer tutucu döküm alır.
    - Model `maxChars` değerinden fazla döndürürse çıktı kısaltılır.
    - `prompt`, basit "Describe the {media}." artı `maxChars` rehberliğine varsayılan döner (yalnızca görsel/video).
    - Etkin birincil görsel modeli zaten yerel olarak görmeyi destekliyorsa, OpenClaw `[Image]` özet bloğunu atlar ve özgün görseli doğrudan modele geçirir.
    - Bir Gateway/WebChat birincil modeli yalnızca metinse, görsel ekler kaybolmak yerine görsel/PDF araçlarının veya yapılandırılmış görsel modelinin bunları yine inceleyebilmesi için offloaded `media://inbound/*` başvuruları olarak korunur.
    - Açık `openclaw infer image describe --model <provider/model>` istekleri farklıdır: bunlar Ollama başvuruları (`ollama/qwen2.5vl:7b` gibi) dahil, o görsel yetenekli sağlayıcı/modeli doğrudan çalıştırır.
    - `<capability>.enabled: true` ama hiçbir model yapılandırılmamışsa, OpenClaw sağlayıcısı bu yeteneği desteklediğinde **etkin yanıt modelini** dener.
  </Accordion>
</AccordionGroup>

### Medya anlamayı otomatik algılama (varsayılan)

`tools.media.<capability>.enabled`, açıkça `false` olarak ayarlanmamışsa ve modeller yapılandırmadıysanız, OpenClaw bu sırada otomatik algılar ve **çalışan ilk seçenekte durur**:

<Steps>
  <Step title="Etkin yanıt modeli">
    Sağlayıcısı bu yeteneği desteklediğinde etkin yanıt modeli.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` birincil/geri dönüş başvuruları (yalnızca görsel).
  </Step>
  <Step title="Yerel CLI'ler (yalnızca ses)">
    Yerel CLI'ler (kuruluysa):

    - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` ile encoder/decoder/joiner/tokens gerektirir)
    - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` veya paketlenmiş tiny modeli kullanır)
    - `whisper` (Python CLI; modelleri otomatik indirir)

  </Step>
  <Step title="Gemini CLI">
    `read_many_files` kullanan `gemini`.
  </Step>
  <Step title="Sağlayıcı auth">
    - Yeteneği destekleyen yapılandırılmış `models.providers.*` girdileri, paketlenmiş geri dönüş sırasından önce denenir.
    - Görsel yetenekli modele sahip yalnızca görsel yapılandırma sağlayıcıları, paketlenmiş satıcı Plugin'i olmasalar bile medya anlama için otomatik kaydolur.
    - Ollama görsel anlama, örneğin `agents.defaults.imageModel` veya `openclaw infer image describe --model ollama/<vision-model>` ile açıkça seçildiğinde kullanılabilir.

    Paketlenmiş geri dönüş sırası:

    - Ses: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
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
İkili dosya algılama macOS/Linux/Windows genelinde en iyi çaba düzeyindedir; CLI'nin `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yolu içeren açık bir CLI modeli ayarlayın.
</Note>

### Proxy ortam desteği (sağlayıcı modelleri)

Sağlayıcı tabanlı **ses** ve **video** medya anlama etkin olduğunda, OpenClaw sağlayıcı HTTP çağrıları için standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Hiç proxy ortam değişkeni ayarlanmamışsa medya anlama doğrudan çıkış kullanır. Proxy değeri bozuksa OpenClaw bir uyarı kaydeder ve doğrudan get işlemine geri döner.

## Yetenekler (isteğe bağlı)

`capabilities` ayarlarsanız, girdi yalnızca o medya türleri için çalışır. Paylaşılan listeler için OpenClaw varsayılanları çıkarabilir:

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
- Görsel yetenekli modele sahip herhangi bir `models.providers.<id>.models[]` kataloğu: **görsel**

CLI girdileri için şaşırtıcı eşleşmelerden kaçınmak adına **`capabilities` değerini açıkça ayarlayın**. `capabilities` değerini atlarsanız, girdi göründüğü liste için uygun olur.

## Sağlayıcı destek matrisi (OpenClaw entegrasyonları)

| Yetenek | Sağlayıcı entegrasyonu                                                                                                      | Notlar                                                                                                                                                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Görsel  | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, yapılandırma sağlayıcıları | Satıcı Plugin'leri görsel desteğini kaydeder; `openai-codex/*` OAuth sağlayıcı altyapısını kullanır; `codex/*` sınırlı bir Codex app-server turu kullanır; MiniMax ve MiniMax OAuth ikisi de `MiniMax-VL-01` kullanır; görsel yetenekli yapılandırma sağlayıcıları otomatik kaydolur. |
| Ses     | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                        | Sağlayıcı dökümü (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                             |
| Video   | Google, Qwen, Moonshot                                                                                                      | Satıcı Plugin'leri üzerinden sağlayıcı video anlama; Qwen video anlama Standard DashScope uç noktalarını kullanır.                                                                                                                         |

<Note>
**MiniMax notu**

- `minimax` ve `minimax-portal` görsel anlaması, Plugin sahipli `MiniMax-VL-01` medya sağlayıcısından gelir.
- Paketlenmiş MiniMax metin kataloğu yine yalnızca metinle başlar; açık `models.providers.minimax` girdileri görsel yetenekli M2.7 chat başvurularını somutlaştırır.
</Note>

## Model seçme rehberi

- Kalite ve güvenlik önemliyse her medya yeteneği için mevcut en güçlü yeni nesil modeli tercih edin.
- Güvenilmeyen girdiler işleyen araç etkin ajanlar için eski/zayıf medya modellerinden kaçının.
- Kullanılabilirlik için her yetenekte en az bir geri dönüş bulundurun (kaliteli model + daha hızlı/ucuz model).
- CLI geri dönüşleri (`whisper-cli`, `whisper`, `gemini`), sağlayıcı API'leri kullanılamadığında yararlıdır.
- `parakeet-mlx` notu: `--output-dir` ile OpenClaw, çıktı biçimi `txt` olduğunda (veya belirtilmediğinde) `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` dışındaki biçimler stdout'a geri döner.

## Ek ilkesi

Yetenek başına `attachments`, hangi eklerin işleneceğini denetler:

<ParamField path="mode" type='"first" | "all"' default="first">
  İlk seçilen ekin mi yoksa hepsinin mi işleneceği.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  İşlenecek en fazla ek sayısını sınırlar.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Aday ekler arasındaki seçim tercihi.
</ParamField>

`mode: "all"` olduğunda çıktılar `[Image 1/2]`, `[Audio 2/2]` vb. olarak etiketlenir.

<AccordionGroup>
  <Accordion title="Dosya eki çıkarma davranışı">
    - Çıkarılan dosya metni, medya istemine eklenmeden önce **güvenilmeyen harici içerik** olarak sarılır.
    - Enjekte edilen blok, `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` gibi açık sınır işaretleri kullanır ve `Source: External` meta veri satırı içerir.
    - Bu ek çıkarma yolu, medya istemini şişirmemek için uzun `SECURITY NOTICE:` afişini kasıtlı olarak atlar; sınır işaretleri ve meta veriler yine kalır.
    - Bir dosyanın çıkarılabilir metni yoksa OpenClaw `[No extractable text]` enjekte eder.
    - Bir PDF bu yolda işlenmiş sayfa görsellerine geri dönerse, medya istemi `[PDF content rendered to images; images not forwarded to model]` yer tutucusunu korur çünkü bu ek çıkarma adımı işlenmiş PDF görsellerini değil, metin bloklarını iletir.
  </Accordion>
</AccordionGroup>

## Yapılandırma örnekleri

<Tabs>
  <Tab title="Paylaşılan modeller + geçersiz kılmalar">
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
                "{{MediaPath}} adresindeki medyayı oku ve <= {{MaxChars}} karakterle açıkla.",
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
  <Tab title="Yalnızca ses + video">
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
                  "{{MediaPath}} adresindeki medyayı oku ve <= {{MaxChars}} karakterle açıkla.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Yalnızca görsel">
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
                  "{{MediaPath}} adresindeki medyayı oku ve <= {{MaxChars}} karakterle açıkla.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Çok kipli tek girdi">
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

Bu, yetenek başına sonuçları ve uygulanabildiğinde seçilen sağlayıcı/modeli gösterir.

## Notlar

- Anlama **en iyi çaba** düzeyindedir. Hatalar yanıtları engellemez.
- Anlama devre dışı olsa bile ekler yine modellere geçirilir.
- Anlamanın nerede çalışacağını sınırlamak için `scope` kullanın (ör. yalnızca DM'lerde).

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Görsel ve medya desteği](/tr/nodes/images)
