---
read_when:
    - Medya anlamayı tasarlama veya yeniden düzenleme
    - Gelen ses/video/görüntü ön işleme ayarlarını düzenleme
sidebarTitle: Media understanding
summary: Sağlayıcı + CLI yedekleriyle gelen görüntü/ses/video anlama (isteğe bağlı)
title: Medya anlama
x-i18n:
    generated_at: "2026-07-12T12:26:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw, yanıt işlem hattı çalışmadan önce gelen medyayı (görüntü/ses/video) özetleyebilir; böylece komut ayrıştırma ve yönlendirme, ham baytlar yerine kısa metin üzerinden çalışır. Anlama özelliği yerel araçları veya sağlayıcı anahtarlarını otomatik olarak algılar; ayrıca açık modeller de yapılandırabilirsiniz. Özgün medya her zaman her zamanki gibi modele iletilir; anlama başarısız olduğunda veya devre dışı bırakıldığında yanıt akışı değişmeden devam eder.

Sağlayıcı Plugin'leri yetenek meta verilerini (hangi sağlayıcının hangi medya türünü desteklediği, varsayılan model, öncelik) kaydeder. OpenClaw çekirdeği, paylaşılan `tools.media` yapılandırmasını, geri dönüş sırasını ve yanıt işlem hattı entegrasyonunu yönetir.

## Nasıl çalışır?

<Steps>
  <Step title="Ekleri topla">
    Gelen ekleri (`MediaPaths`, `MediaUrls`, `MediaTypes`) toplayın.
  </Step>
  <Step title="Yetenek başına seç">
    Etkinleştirilmiş her yetenek (görüntü/ses/video) için ekleri `attachments` politikasına göre seçin (varsayılan: yalnızca ilk ek).
  </Step>
  <Step title="Bir model seç">
    Uygun ilk model girdisini seçin (boyut + yetenek + kullanılabilir kimlik doğrulama).
  </Step>
  <Step title="Başarısızlıkta geri dön">
    Bir model hata verirse, zaman aşımına uğrarsa veya medya `maxBytes` sınırını aşarsa sonraki girdiyi deneyin.
  </Step>
  <Step title="Başarı durumunda uygula">
    `Body`, bir `[Görüntü]`, `[Ses]` veya `[Video]` bloğuna dönüşür. Ses ayrıca `{{Transcript}}` değerini ayarlar; komut ayrıştırma, varsa açıklama metnini, aksi takdirde transkripti kullanır. Açıklamalar blok içinde `Kullanıcı metni:` olarak korunur.
  </Step>
</Steps>

## Yapılandırma

`tools.media`, paylaşılan bir model listesinin yanı sıra yetenek başına geçersiz kılmaları içerir:

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

Yetenek başına (`image`/`audio`/`video`) anahtarlar:

| Anahtar                                         | Tür       | Varsayılan                                           | Notlar                                                                                       |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | otomatik (`false` devre dışı bırakır)                | Bu yetenek için otomatik algılamayı kapatmak üzere `false` olarak ayarlayın                   |
| `models`                                        | dizi      | yok                                                  | Paylaşılan `tools.media.models` listesinden önce tercih edilir                               |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ maxChars yönlendirmesi) | Varsayılan olarak yalnızca görüntü/video                                                      |
| `maxChars`                                      | `number`  | `500` (görüntü/video), ayarlanmamış (ses)            | Model daha fazlasını döndürürse çıktı kırpılır                                                |
| `maxBytes`                                      | `number`  | görüntü `10485760`, ses `20971520`, video `52428800` | Boyut sınırını aşan medyada sonraki modele geçilir                                            |
| `timeoutSeconds`                                | `number`  | `60` (görüntü/ses), `120` (video)                    |                                                                                              |
| `language`                                      | `string`  | ayarlanmamış                                         | Ses transkripsiyonu ipucu                                                                    |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | Sağlayıcı isteği geçersiz kılmaları; bkz. [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) |
| `attachments`                                   | nesne     | `{ mode: "first", maxAttachments: 1 }`               | Bkz. [Ek politikası](#attachment-policy)                                                      |
| `scope`                                         | nesne     | ayarlanmamış                                         | Kanal/chatType/keyPrefix temelinde sınırlandırır                                              |
| `echoTranscript`                                | `boolean` | `false`                                              | Yalnızca ses: temsilci işlemesinden önce transkripti sohbete geri yansıtır                    |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | Yalnızca ses: `{transcript}` yer tutucusu                                                     |

Deepgram'e özgü seçenekler `providerOptions.deepgram` altında yer alır (üst düzey `deepgram: { detectLanguage, punctuate, smartFormat }` alanı kullanımdan kaldırılmıştır ancak hâlâ okunur).

### Model girdileri

Her `models[]` girdisi bir **sağlayıcı** girdisi (varsayılan) veya bir **CLI** girdisidir:

<Tabs>
  <Tab title="Sağlayıcı girdisi">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, for multi-modal shared entries
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

    CLI şablonları ayrıca `{{MediaDir}}` (medya dosyasını içeren dizin), `{{OutputDir}}` (bu çalıştırma için oluşturulan geçici dizin) ve `{{OutputBase}}` (geçici dosyanın uzantısız temel yolu) değerlerini kullanabilir.

  </Tab>
</Tabs>

### Sağlayıcı kimlik bilgileri

Sağlayıcı tabanlı medya anlama, normal model çağrılarıyla aynı kimlik doğrulama çözümlemesini kullanır: kimlik doğrulama profilleri, ortam değişkenleri ve ardından `models.providers.<providerId>.apiKey`. `tools.media.*.models[]` girdileri satır içi `apiKey` alanını kabul etmez.

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

Profiller, ortam değişkenleri ve özel temel URL'ler için [Araçlar ve özel sağlayıcılar](/tr/gateway/config-tools) bölümüne bakın.

## Kurallar ve davranış

- `maxBytes` sınırını aşan medyada bu model atlanır ve sonraki model denenir.
- 1024 bayttan küçük ses dosyaları boş/bozuk olarak değerlendirilir ve transkripsiyondan önce atlanır; temsilci bunun yerine deterministik bir yer tutucu transkript alır.
- Etkin birincil görüntü modeli zaten görsel algıyı yerel olarak destekliyorsa OpenClaw, `[Görüntü]` özet bloğunu atlar ve özgün görüntüyü doğrudan modele iletir. MiniMax bir istisnadır: eski MiniMax M2.x sohbet meta verileri görüntü girdisi desteklediğini belirtse bile `minimax`, `minimax-cn`, `minimax-portal` ve `minimax-portal-cn`, görüntü anlamayı her zaman Plugin'in yönettiği `MiniMax-VL-01` medya sağlayıcısı üzerinden yönlendirir (yalnızca `MiniMax-M3` ve sonraki sürümler yerel görsel algı yeteneğine sahip kabul edilir).
- Bir Gateway/WebChat birincil modeli yalnızca metin destekliyorsa görüntü ekleri, görüntü/PDF araçlarının veya yapılandırılmış bir görüntü modelinin eki kaybetmek yerine yine de inceleyebilmesi için dışarı aktarılan `media://inbound/*` başvuruları olarak korunur.
- Açık `openclaw infer image describe --file <path> --model <provider/model>` (takma ad: `openclaw capability image describe`) komutu, `models.providers.ollama.models[]` altında eşleşen görüntü yetenekli bir model yapılandırıldığında `ollama/qwen2.5vl:7b` gibi Ollama başvuruları da dahil olmak üzere bu görüntü yetenekli sağlayıcıyı/modeli doğrudan çalıştırır.
- `<capability>.enabled`, `false` değilse ancak hiçbir model yapılandırılmamışsa OpenClaw, sağlayıcısı bu yeteneği desteklediğinde etkin yanıt modelini dener.

### Otomatik algılama (varsayılan)

`tools.media.<capability>.enabled`, `false` değilse ve hiçbir model yapılandırılmamışsa OpenClaw aşağıdakileri sırayla dener ve çalışan ilk seçenekte durur:

<Steps>
  <Step title="Yapılandırılmış görüntü modeli (yalnızca görüntü)">
    Etkin yanıt modeli zaten görsel algıyı yerel olarak desteklemiyorsa `agents.defaults.imageModel` birincil/geri dönüş başvuruları kullanılır. `provider/model` başvurularını tercih edin; çıplak başvurular yalnızca eşleşme benzersiz olduğunda yapılandırılmış görüntü yetenekli sağlayıcı model girdilerinden nitelenir.
  </Step>
  <Step title="Etkin yanıt modeli">
    Sağlayıcısı yeteneği desteklediğinde etkin yanıt modeli kullanılır.
  </Step>
  <Step title="Sağlayıcı kimlik doğrulaması (yalnızca ses, yerel CLI'lardan önce)">
    Sesi destekleyen yapılandırılmış `models.providers.*` girdileri yerel CLI'lardan önce denenir. Paketlenmiş sağlayıcı öncelik sırası (eşitlikler sağlayıcı kimliğine göre alfabetik olarak çözülür): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="Yerel CLI'lar (yalnızca ses)">
    Hazır yerel ikili dosyalar sıralı bir geri dönüş listesine dönüşür:
    - Yalnızca geçerli süreçteki daha önceki bir model çağrısı Metal veya CUDA gözlemlediyse önce `whisper-cli`
    - CPU varsayılanlı `sherpa-onnx-offline` (`tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx` içeren `SHERPA_ONNX_MODEL_DIR` gerektirir)
    - Hızlandırma yalnızca derleme düzeyinde mümkünse veya gözlemlenmemişse `whisper-cli`
    - Apple Silicon'da `parakeet-mlx` (MLX yetenekli, aygıt kullanımı gözlemlenmemiş)
    - `whisper` (Python CLI; varsayılan olarak `turbo` modelini kullanır, otomatik indirir)

    Arka uç yetenek incelemesi önbelleğe alınır ve bir model yüklemez. Derleme yeteneği, istenen arka uç bayrakları ve gerçek bir çağrıdan gözlemlenen arka uç ayrı tutulur. Otomatik algılanan whisper.cpp, üst sistemin seçilen arka uç satırının kaydedilebilmesi için model çalıştırma günlüklerini etkin bırakır. Açık CLI girdileri yapılandırılmış sıralarını, arka uç bayraklarını ve çıktı bayraklarını korur.

  </Step>
  <Step title="Sağlayıcı kimlik doğrulaması (görüntü/video)">
    Yeteneği destekleyen yapılandırılmış `models.providers.*` girdileri, paketlenmiş geri dönüş sırasından önce denenir. Görüntü yetenekli bir modele sahip yalnızca görüntü yapılandırma sağlayıcıları, paketlenmiş bir sağlayıcı Plugin'i olmasalar bile medya anlama için otomatik olarak kaydedilir.

    Paketlenmiş sağlayıcı öncelik sırası (eşitlikler sağlayıcı kimliğine göre alfabetik olarak çözülür):
    - Görüntü: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - Video: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="Antigravity CLI (yalnızca görüntü/video)">
    İlk kurulu `agy` veya `antigravity` ikili dosyası (`OPENCLAW_ANTIGRAVITY_CLI` ile geçersiz kılınabilir), medyanın dizinine karşı korumalı alanda çalıştırılır.
  </Step>
</Steps>

Bir yetenek için otomatik algılamayı devre dışı bırakmak üzere:

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
İkili dosya algılama macOS/Linux/Windows genelinde en iyi çabayla gerçekleştirilir; CLI'ın `PATH` üzerinde olduğundan (`~` genişletilir) emin olun veya tam komut yoluna sahip açık bir CLI model girdisi ayarlayın.
</Note>

### Proxy desteği (ses/video sağlayıcı çağrıları)

Sağlayıcı tabanlı **ses** ve **video** anlama, `NO_PROXY`/`no_proxy` atlama kuralları dahil standart giden proxy ortam değişkenlerine uyar: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY`, `https_proxy`, `http_proxy`, `all_proxy`. Küçük harfli değişkenler büyük harfli değişkenlerden önceliklidir. Hiçbiri ayarlanmamışsa medya anlama doğrudan çıkış kullanır; proxy değeri hatalı biçimlendirilmişse OpenClaw bir uyarı kaydeder ve doğrudan getirmeye geri döner. Görüntü anlama bu proxy yolundan geçmez.

## Yetenekler

Belirli medya türleriyle sınırlamak için bir `models[]` girdisinde `capabilities` değerini ayarlayın. Paylaşılan listelerde OpenClaw, paketlenmiş sağlayıcı başına varsayılanları çıkarır:

| Sağlayıcı                                                                 | Yetenekler           |
| ------------------------------------------------------------------------ | -------------------- |
| `openai`, `anthropic`, `minimax`                                         | görüntü              |
| `minimax-portal`                                                         | görüntü              |
| `moonshot`                                                               | görüntü + video      |
| `openrouter`                                                             | görüntü + ses        |
| `google` (Gemini API)                                                    | görüntü + ses + video |
| `qwen`                                                                   | görüntü + video      |
| `deepinfra`                                                              | görüntü + ses        |
| `mistral`                                                                | ses                  |
| `zai`                                                                    | görüntü              |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | ses                  |
| Görüntü destekli bir model içeren herhangi bir `models.providers.<id>.models[]` kataloğu | görüntü              |

CLI girdilerinde beklenmedik eşleşmeleri önlemek için `capabilities` değerini açıkça ayarlayın; belirtilmezse girdi, yer aldığı her yetenek listesi için uygun kabul edilir.

## Sağlayıcı destek matrisi

| Yetenek | Sağlayıcılar                                                                                                                                               | Notlar                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Görüntü      | Anthropic, Codex app-server, Deepinfra, Google, MiniMax, MiniMax Portal, Moonshot, OpenAI, OpenAI Codex OAuth, OpenRouter, Qwen, Z.AI, yapılandırma sağlayıcıları | Üretici Plugin'leri görüntü desteğini kaydeder; `openai/*`, API anahtarı veya Codex OAuth yönlendirmesini kullanabilir; `codex/*`, sınırlı bir Codex app-server turu kullanır; görüntü destekli yapılandırma sağlayıcıları otomatik olarak kaydedilir. |
| Ses      | Deepgram, Deepinfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter, SenseAudio, xAI                                                             | Sağlayıcı transkripsiyonu (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                     |
| Video      | Google, Moonshot, Qwen                                                                                                                                  | Üretici Plugin'leri aracılığıyla sağlayıcı video anlama desteği; Qwen video anlama, standart DashScope uç noktalarını kullanır.                                                                        |

<Note>
**MiniMax notu**: Eski MiniMax M2.x sohbet meta verileri görüntü girdisini desteklediğini iddia etse bile `minimax`, `minimax-cn`, `minimax-portal` ve `minimax-portal-cn` görüntü anlama özelliği her zaman Plugin'e ait `MiniMax-VL-01` medya sağlayıcısından gelir.
</Note>

## Model seçimi rehberi

- Kalite ve güvenliğin önemli olduğu durumlarda her medya yeteneği için mevcut neslin en güçlü modelini tercih edin.
- Güvenilmeyen girdileri işleyen araç destekli ajanlarda eski veya daha zayıf medya modellerinden kaçının.
- Kullanılabilirlik için her yetenek başına en az bir yedek tutun (kaliteli model + daha hızlı/ucuz model).
- CLI yedekleri (`whisper-cli`, `whisper`, `gemini`), sağlayıcı API'leri kullanılamadığında yardımcı olur.
- Bilinen dosya çıktısı kipleri belirleyicidir: çıkarıldığı varsayılan transkript dosyasının boş veya eksik olması, CLI ilerleme çıktısına geri dönmek yerine hiçbir transkript üretilmemesine neden olur.
- `parakeet-mlx`: `--output-dir` ve varsayılan `{filename}` çıktı şablonuyla birlikte `--output-format txt` (veya `all`) kullanın. Üst kaynaklı `PARAKEET_OUTPUT_FORMAT` ve `PARAKEET_OUTPUT_TEMPLATE` ortam değişkenleri de dikkate alınır. OpenClaw, `<output-dir>/<media-basename>.txt` dosyasını okur; varsayılan `srt` biçimi, diğer biçimler ve özel çıktı şablonları stdout'u kullanmaya devam eder.

## Ek politikası

Yetenek başına `attachments`, hangi eklerin işleneceğini denetler:

<ParamField path="mode" type='"first" | "all"' default="first">
  Yalnızca seçilen ilk eki veya tüm ekleri işleyin.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  İşlenecek eklerin sayısını sınırlayın.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Aday ekler arasındaki seçim tercihi.
</ParamField>

`mode: "all"` olduğunda çıktılar `[Görüntü 1/2]`, `[Ses 2/2]` vb. biçiminde etiketlenir.

### Dosya eki ayıklama

- Ayıklanan dosya metni, medya istemine eklenmeden önce güvenilmeyen harici içerik olarak sarmalanır; bunun için `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` gibi sınır işaretleri ve bir `Source: External` meta veri satırı kullanılır.
- Bu yol, medya istemini kısa tutmak için uzun `SECURITY NOTICE:` başlığını kasıtlı olarak atlar; sınır işaretleri ve meta veriler yine uygulanır.
- Ayıklanabilir metni olmayan bir dosya `[Ayıklanabilir metin yok]` sonucunu alır.
- Bir PDF, oluşturulmuş sayfa görüntülerine geri dönerse OpenClaw bu görüntüleri görme yetenekli yanıt modellerine iletir ve dosya bloğunda `[PDF içeriği görüntülere dönüştürüldü]` yer tutucusunu korur.

## Yapılandırma örnekleri

<Tabs>
  <Tab title="Paylaşılan modeller + geçersiz kılmalar">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
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
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
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

Medya anlama çalıştığında `/status`, yetenek başına bir özet satırı içerir:

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

Ön kontrol envanteri için `openclaw capability audio providers` komutunu çalıştırın. Yerel satırlar; yerel yedek seçimini, genel sağlayıcı seçiminden ve hazırlık durumundan ayrı olarak gösterir ve yetenekli/istenen/gözlemlenen arka uç alanlarını ayrı tutar. Aynı yerel seçim, bilgilendirici bir doctor bulgusu olarak da kullanılabilir:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## Notlar

- Anlama, mümkün olan en iyi çabayla gerçekleştirilir. Hatalar yanıtları engellemez.
- Anlama devre dışı bırakılmış olsa bile ekler modellere iletilmeye devam eder.
- Anlamanın nerede çalışacağını sınırlamak için `scope` kullanın (örneğin yalnızca doğrudan mesajlarda).

## İlgili

- [Yapılandırma](/tr/gateway/configuration)
- [Görüntü ve medya desteği](/tr/nodes/images)
