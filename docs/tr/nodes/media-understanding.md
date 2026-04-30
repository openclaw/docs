---
read_when:
    - Medya anlamayı tasarlama veya yeniden düzenleme
    - Gelen ses/video/görüntü ön işlemesini ayarlama
sidebarTitle: Media understanding
summary: Sağlayıcı + CLI yedekleriyle gelen görüntü/ses/video anlama (isteğe bağlı)
title: Medya anlama
x-i18n:
    generated_at: "2026-04-30T09:31:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw, yanıt hattı çalışmadan önce **gelen medyayı özetleyebilir** (görsel/ses/video). Yerel araçlar veya sağlayıcı anahtarları kullanılabilir olduğunda bunu otomatik algılar; devre dışı bırakılabilir veya özelleştirilebilir. Anlama kapalıysa modeller, özgün dosyaları/URL'leri her zamanki gibi almaya devam eder.

Tedarikçiye özgü medya davranışı tedarikçi Plugin'leri tarafından kaydedilir; OpenClaw çekirdeği ise paylaşılan `tools.media` yapılandırmasını, yedek sırasını ve yanıt hattı entegrasyonunu yönetir.

## Hedefler

- İsteğe bağlı: daha hızlı yönlendirme + daha iyi komut ayrıştırma için gelen medyayı kısa metne önceden sindir.
- Özgün medya teslimini modele koru (her zaman).
- **sağlayıcı API'lerini** ve **CLI yedeklerini** destekle.
- Sıralı yedekli birden fazla modele izin ver (hata/boyut/zaman aşımı).

## Üst düzey davranış

<Steps>
  <Step title="Ekleri topla">
    Gelen ekleri topla (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Yetenek başına seç">
    Etkinleştirilmiş her yetenek için (görsel/ses/video), ekleri ilkeye göre seç (varsayılan: **ilk**).
  </Step>
  <Step title="Model seç">
    Uygun ilk model girdisini seç (boyut + yetenek + kimlik doğrulama).
  </Step>
  <Step title="Hata durumunda yedeğe geç">
    Bir model başarısız olursa veya medya çok büyükse, **sonraki girdiye geç**.
  </Step>
  <Step title="Başarı bloğunu uygula">
    Başarı durumunda:

    - `Body`, `[Image]`, `[Audio]` veya `[Video]` bloğu olur.
    - Ses `{{Transcript}}` değerini ayarlar; komut ayrıştırma, varsa açıklama metnini, yoksa dökümü kullanır.
    - Açıklamalar blok içinde `User text:` olarak korunur.

  </Step>
</Steps>

Anlama başarısız olursa veya devre dışıysa **yanıt akışı devam eder**; özgün gövde + ekler korunur.

## Yapılandırma özeti

`tools.media`, **paylaşılan modelleri** ve yetenek başına geçersiz kılmaları destekler:

<AccordionGroup>
  <Accordion title="Üst düzey anahtarlar">
    - `tools.media.models`: paylaşılan model listesi (sınırlamak için `capabilities` kullanın).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - varsayılanlar (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - sağlayıcı geçersiz kılmaları (`baseUrl`, `headers`, `providerOptions`)
      - `tools.media.audio.providerOptions.deepgram` üzerinden Deepgram ses seçenekleri
      - ses dökümü yankı denetimleri (`echoTranscript`, varsayılan `false`; `echoFormat`)
      - isteğe bağlı **yetenek başına `models` listesi** (paylaşılan modellerden önce tercih edilir)
      - `attachments` ilkesi (`mode`, `maxAttachments`, `prefer`)
      - `scope` (kanal/chatType/oturum anahtarına göre isteğe bağlı sınırlama)
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
    - `{{OutputDir}}` (bu çalıştırma için oluşturulan geçici dizin)
    - `{{OutputBase}}` (geçici dosya taban yolu, uzantısız)

  </Tab>
</Tabs>

## Varsayılanlar ve sınırlar

Önerilen varsayılanlar:

- `maxChars`: görsel/video için **500** (kısa, komut dostu)
- `maxChars`: ses için **ayarlanmamış** (sınır koymadığınız sürece tam döküm)
- `maxBytes`:
  - görsel: **10MB**
  - ses: **20MB**
  - video: **50MB**

<AccordionGroup>
  <Accordion title="Kurallar">
    - Medya `maxBytes` değerini aşarsa bu model atlanır ve **sonraki model denenir**.
    - **1024 bayttan** küçük ses dosyaları boş/bozuk kabul edilir ve sağlayıcı/CLI dökümünden önce atlanır; gelen yanıt bağlamı, ajanın notun çok küçük olduğunu bilmesi için deterministik bir yer tutucu döküm alır.
    - Model `maxChars` değerinden fazlasını döndürürse çıktı kırpılır.
    - `prompt` varsayılanı basit "Describe the {media}." ifadesi artı `maxChars` yönlendirmesidir (yalnızca görsel/video).
    - Etkin birincil görsel modeli zaten vision desteğini yerel olarak sağlıyorsa OpenClaw, `[Image]` özet bloğunu atlar ve bunun yerine özgün görseli modele geçirir.
    - Bir Gateway/WebChat birincil modeli yalnızca metinse, görsel ekleri, görsel/PDF araçlarının veya yapılandırılmış görsel modelinin eki kaybetmek yerine hâlâ inceleyebilmesi için dışarı aktarılmış `media://inbound/*` başvuruları olarak korunur.
    - Açık `openclaw infer image describe --model <provider/model>` istekleri farklıdır: `ollama/qwen2.5vl:7b` gibi Ollama başvuruları dahil olmak üzere, görsel yetenekli o sağlayıcı/modeli doğrudan çalıştırırlar.
    - `<capability>.enabled: true` ise ancak hiç model yapılandırılmamışsa OpenClaw, sağlayıcısı yeteneği desteklediğinde **etkin yanıt modelini** dener.

  </Accordion>
</AccordionGroup>

### Medya anlamayı otomatik algıla (varsayılan)

`tools.media.<capability>.enabled` **`false` olarak ayarlanmamışsa** ve model yapılandırmadıysanız OpenClaw şu sırayla otomatik algılar ve **ilk çalışan seçenekte durur**:

<Steps>
  <Step title="Etkin yanıt modeli">
    Sağlayıcısı yeteneği desteklediğinde etkin yanıt modeli.
  </Step>
  <Step title="agents.defaults.imageModel">
    `agents.defaults.imageModel` birincil/yedek başvuruları (yalnızca görsel).
    `provider/model` başvurularını tercih edin. Yalın başvurular, yalnızca eşleşme benzersiz olduğunda yapılandırılmış görsel yetenekli sağlayıcı model girdilerinden nitelenir.
  </Step>
  <Step title="Yerel CLI'ler (yalnızca ses)">
    Yerel CLI'ler (kuruluysa):

    - `sherpa-onnx-offline` (encoder/decoder/joiner/tokens ile `SHERPA_ONNX_MODEL_DIR` gerektirir)
    - `whisper-cli` (`whisper-cpp`; `WHISPER_CPP_MODEL` veya paketle gelen tiny modeli kullanır)
    - `whisper` (Python CLI; modelleri otomatik indirir)

  </Step>
  <Step title="Gemini CLI">
    `read_many_files` kullanan `gemini`.
  </Step>
  <Step title="Sağlayıcı kimlik doğrulaması">
    - Yeteneği destekleyen yapılandırılmış `models.providers.*` girdileri, paketle gelen yedek sırasından önce denenir.
    - Görsel yetenekli bir modele sahip yalnızca görsel yapılandırma sağlayıcıları, paketle gelen bir tedarikçi Plugin'i olmasalar bile medya anlama için otomatik kaydedilir.
    - Ollama görsel anlama, örneğin `agents.defaults.imageModel` veya `openclaw infer image describe --model ollama/<vision-model>` üzerinden açıkça seçildiğinde kullanılabilir.

    Paketle gelen yedek sırası:

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
İkili algılama macOS/Linux/Windows genelinde en iyi çaba ilkesine dayanır; CLI'nin `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yoluyla açık bir CLI modeli ayarlayın.
</Note>

### Proxy ortam desteği (sağlayıcı modelleri)

Sağlayıcı tabanlı **ses** ve **video** medya anlama etkinleştirildiğinde OpenClaw, sağlayıcı HTTP çağrıları için standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Proxy ortam değişkenleri ayarlı değilse medya anlama doğrudan çıkış kullanır. Proxy değeri hatalı biçimlendirilmişse OpenClaw bir uyarı günlüğe yazar ve doğrudan getirmeye geri döner.

## Yetenekler (isteğe bağlı)

`capabilities` ayarlarsanız girdi yalnızca bu medya türleri için çalışır. Paylaşılan listelerde OpenClaw varsayılanları çıkarabilir:

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
- Görsel yetenekli bir modele sahip herhangi bir `models.providers.<id>.models[]` kataloğu: **görsel**

CLI girdileri için şaşırtıcı eşleşmeleri önlemek üzere **`capabilities` değerini açıkça ayarlayın**. `capabilities` değerini atlarsanız girdi, içinde yer aldığı liste için uygundur.

## Sağlayıcı destek matrisi (OpenClaw entegrasyonları)

| Yetenek | Sağlayıcı entegrasyonu                                                                                                       | Notlar                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Görsel      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, yapılandırma sağlayıcıları | Tedarikçi Plugin'leri görsel desteğini kaydeder; `openai-codex/*` OAuth sağlayıcı tesisatını kullanır; `codex/*` sınırlı bir Codex app-server turu kullanır; MiniMax ve MiniMax OAuth ikisi de `MiniMax-VL-01` kullanır; görsel yetenekli yapılandırma sağlayıcıları otomatik kaydedilir. |
| Ses      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Sağlayıcı dökümü (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                    |
| Video      | Google, Qwen, Moonshot                                                                                                       | Tedarikçi Plugin'leri üzerinden sağlayıcı video anlama; Qwen video anlama Standard DashScope uç noktalarını kullanır.                                                                                                                        |

<Note>
**MiniMax notu**

- `minimax` ve `minimax-portal` görsel anlama, Plugin'e ait `MiniMax-VL-01` medya sağlayıcısından gelir.
- Paketle gelen MiniMax metin kataloğu hâlâ yalnızca metin olarak başlar; açık `models.providers.minimax` girdileri görsel yetenekli M2.7 sohbet başvurularını somutlaştırır.

</Note>

## Model seçimi kılavuzu

- Kalite ve güvenlik önemli olduğunda her medya yeteneği için kullanılabilir en güçlü en yeni nesil modeli tercih edin.
- Güvenilmeyen girdileri işleyen araç etkin ajanlar için daha eski/zayıf medya modellerinden kaçının.
- Erişilebilirlik için her yetenek başına en az bir yedek tutun (kalite modeli + daha hızlı/daha ucuz model).
- CLI yedekleri (`whisper-cli`, `whisper`, `gemini`), sağlayıcı API'leri kullanılamadığında yararlıdır.
- `parakeet-mlx` notu: `--output-dir` ile OpenClaw, çıktı biçimi `txt` olduğunda (veya belirtilmediğinde) `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` olmayan biçimler stdout'a geri döner.

## Ek ilkesi

Yetenek başına `attachments`, hangi eklerin işleneceğini denetler:

<ParamField path="mode" type='"first" | "all"' default="first">
  İlk seçilen eki mi yoksa tümünü mü işleyeceği.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  İşlenecek sayıyı sınırlar.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Aday ekler arasındaki seçim tercihi.
</ParamField>

`mode: "all"` olduğunda çıktılar `[Image 1/2]`, `[Audio 2/2]` vb. olarak etiketlenir.

<AccordionGroup>
  <Accordion title="Dosya eki çıkarma davranışı">
    - Çıkarılan dosya metni, medya istemine eklenmeden önce **güvenilmeyen harici içerik** olarak sarmalanır.
    - Enjekte edilen blok, `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` gibi açık sınır işaretleyicileri kullanır ve bir `Source: External` meta veri satırı içerir.
    - Bu ek çıkarma yolu, medya isteminin gereksiz yere büyümesini önlemek için uzun `SECURITY NOTICE:` başlığını özellikle dışarıda bırakır; sınır işaretleyicileri ve meta veriler yine de kalır.
    - Bir dosyada çıkarılabilir metin yoksa OpenClaw `[No extractable text]` enjekte eder.
    - Bir PDF bu yolda işlenmiş sayfa görüntülerine geri düşerse, medya istemi `[PDF content rendered to images; images not forwarded to model]` yer tutucusunu korur; çünkü bu ek çıkarma adımı işlenmiş PDF görüntülerini değil, metin bloklarını iletir.

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
  <Tab title="Yalnızca görüntü">
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
  <Tab title="Çok modlu tek giriş">
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

Bu, yetenek başına sonuçları ve geçerliyse seçilen sağlayıcıyı/modeli gösterir.

## Notlar

- Anlama **en iyi çaba** esasına göredir. Hatalar yanıtları engellemez.
- Anlama devre dışı olduğunda bile ekler yine de modellere geçirilir.
- Anlamanın nerede çalışacağını sınırlamak için `scope` kullanın (ör. yalnızca DM'ler).

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Görüntü ve medya desteği](/tr/nodes/images)
