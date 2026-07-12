---
read_when:
    - '`openclaw infer` komutlarını ekleme veya değiştirme'
    - Kararlı gözetimsiz yetenek otomasyonu tasarlama
summary: Sağlayıcı destekli model, görüntü, ses, TTS, video, web ve gömme iş akışları için önce çıkarım yapan CLI
title: Çıkarım CLI'si
x-i18n:
    generated_at: "2026-07-12T12:09:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer`, sağlayıcı destekli çıkarım için standart başsız arayüzdür. Ham Gateway RPC adlarını veya ajan aracı kimliklerini değil, yetenek ailelerini (`model`, `image`, `audio`, `tts`, `video`, `web`, `embedding`) sunar. `openclaw capability ...`, aynı komut ağacının diğer adıdır.

Tek seferlik bir sağlayıcı sarmalayıcısı yerine bunu tercih etme nedenleri:

- OpenClaw'da önceden yapılandırılmış sağlayıcıları ve modelleri yeniden kullanır.
- Betikler ve ajan güdümlü otomasyon için kararlı bir `--json` zarfı sağlar (bkz. [JSON çıktısı](#json-output)).
- Çoğu alt komut için Gateway olmadan normal yerel yolu çalıştırır.
- Uçtan uca sağlayıcı denetimlerinde; sağlayıcı isteği gönderilmeden önce yayımlanan CLI'ı, yapılandırma yüklemeyi, varsayılan ajan çözümlemesini, paketlenmiş Plugin etkinleştirmesini ve paylaşılan yetenek çalışma zamanını sınar.

## infer'ı bir skill'e dönüştürme

Bunu kopyalayıp bir ajana yapıştırın:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

İyi bir infer tabanlı skill, yaygın kullanıcı amaçlarını doğru alt komutla eşleştirir, her iş akışı için birkaç standart örnek içerir, daha düşük seviyeli alternatifler yerine `openclaw infer ...` kullanımını tercih eder ve skill gövdesinde infer arayüzünün tamamını yeniden belgelemez.

## Komut ağacı

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    personas
    status
    enable
    disable
    set-provider
    set-persona

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

`infer list` / `infer inspect --name <capability>`, bu ağacı veri olarak gösterir (yetenek kimliği, aktarımlar, açıklama).

## Yaygın görevler

| Görev                                | Komut                                                                                         | Notlar                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Metin/model istemi çalıştırma        | `openclaw infer model run --prompt "..." --json`                                              | Varsayılan olarak yerel                                      |
| Görseller üzerinde model istemi çalıştırma | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Birden fazla görsel için `--file` seçeneğini yineleyin        |
| Görsel oluşturma                     | `openclaw infer image generate --prompt "..." --json`                                         | Mevcut bir dosyadan başlarken `image edit` kullanın           |
| Görsel dosyasını veya URL'sini açıklama | `openclaw infer image describe --file ./image.png --prompt "..." --json`                    | `--model`, görsel destekli bir `<provider/model>` olmalıdır   |
| Ses yazıya dökme                     | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model`, `<provider/model>` olmalıdır                       |
| Konuşma sentezleme                   | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` yalnızca Gateway üzerinden çalışır               |
| Video oluşturma                      | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution` gibi sağlayıcı ipuçlarını destekler            |
| Video dosyasını açıklama             | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model`, `<provider/model>` olmalıdır                       |
| Web'de arama                         | `openclaw infer web search --query "..." --json`                                              |                                                              |
| Web sayfası getirme                  | `openclaw infer web fetch --url https://example.com --json`                                   |                                                              |
| Gömme vektörleri oluşturma           | `openclaw infer embedding create --text "..." --json`                                         |                                                              |

## Davranış

- Çıktı başka bir komuta veya betiğe aktarılacaksa `--json`, aksi hâlde metin çıktısı kullanın.
- Belirli bir arka ucu sabitlemek için `--provider` veya `--model provider/model` kullanın.
- Tek seferlik düşünme/akıl yürütme geçersiz kılması için `model run --thinking <level>` kullanın: `off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` veya `max`.
- `image describe`, `audio transcribe` ve `video describe` için `--model`, `<provider/model>` biçiminde olmalıdır.
- `image describe` için `--file`, yerel yolları ve HTTP(S) URL'lerini kabul eder; uzak URL'ler normal medya getirme SSRF politikasından geçer.
- Durumsuz yürütme komutları (`model run`, `image *`, `audio *`, `video *`, `web *`, `embedding *`) varsayılan olarak yerelde çalışır. Gateway tarafından yönetilen durum komutları (`tts status`) varsayılan olarak Gateway'de çalışır.
- Yerel yol hiçbir zaman Gateway'in çalışıyor olmasını gerektirmez.
- Yerel `model run`, yalın ve tek seferlik bir sağlayıcı tamamlamasıdır: yapılandırılmış ajan modelini ve kimlik doğrulamayı çözümler ancak sohbet ajanı turu başlatmaz, araçları yüklemez veya paketlenmiş MCP sunucularını açmaz.
- `model run --file`, isteme görsel dosyaları (otomatik algılanan MIME türüyle) ekler; birden fazla görsel için `--file` seçeneğini yineleyin. Görsel olmayan dosyalar reddedilir; bunun yerine `infer audio transcribe` veya `infer video describe` kullanın.
- `model run --gateway`, Gateway yönlendirmesini, kaydedilmiş kimlik doğrulamayı, sağlayıcı seçimini ve gömülü çalışma zamanını sınar ancak ham model yoklaması olarak kalır: önceki oturum dökümü, başlangıç/AGENTS bağlamı, araçlar veya paketlenmiş MCP sunucuları yoktur.
- `model run --gateway --model <provider/model>`, Gateway'den tek seferlik bir sağlayıcı/model geçersiz kılması çalıştırmasını istediği için güvenilir operatör Gateway kimlik bilgisi gerektirir.

## Model

Metin çıkarımı ve model/sağlayıcı incelemesi.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

Gateway'i başlatmadan veya ajan aracı arayüzünü yüklemeden tek bir sağlayıcıyı hızlıca sınamak için `--local` ile tam `<provider/model>` başvurularını kullanın:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Notlar:

- Yerel `model run`, sağlayıcı/model/kimlik doğrulama durumuna yönelik en dar kapsamlı CLI hızlı sınamasıdır: ChatGPT-Codex dışındaki sağlayıcılara yalnızca verilen istemi gönderir.
- Yerel `model run --model <provider/model>`, sağlayıcı yapılandırmaya yazılmadan önce tam paketlenmiş statik katalog satırlarını (`openclaw models list --all` komutunun gösterdiği satırların aynısını) çözümleyebilir. Sağlayıcı kimlik doğrulaması yine gereklidir; eksik kimlik bilgileri `Unknown model` olarak değil, kimlik doğrulama hatası olarak başarısız olur.
- Mistral Medium 3.5 akıl yürütme yoklamalarında sıcaklığı ayarlamadan/varsayılan değerde bırakın. Mistral, `temperature: 0` ile `reasoning_effort="high"` değerini reddeder; varsayılan sıcaklığı veya `0.7` gibi sıfırdan farklı bir değeri kullanın.
- OpenAI ChatGPT/Codex OAuth (`openai-chatgpt-responses` API) yerel yoklamaları, aktarımın zorunlu `instructions` alanını doldurabilmesi için asgari bir sistem talimatı ekler; tam ajan bağlamı, araçlar, bellek veya oturum dökümü eklenmez.
- `model run --file`, görsel içeriğini doğrudan tek kullanıcı iletisine ekler. MIME türü `image/*` olarak algılandığında yaygın biçimler (PNG, JPEG, WebP) çalışır; desteklenmeyen veya tanınmayan dosyalar sağlayıcı çağrılmadan önce başarısız olur. Doğrudan çok kipli model yoklaması yerine OpenClaw'ın görsel modeli yönlendirmesini ve geri dönüşlerini kullanmak istediğinizde `infer image describe` kullanın.
- Seçilen model görsel girdisini desteklemelidir; yalnızca metin destekleyen modeller isteği sağlayıcı katmanında reddedebilir.
- `model run --prompt`, boşluk dışı metin içermelidir; boş istemler herhangi bir sağlayıcı veya Gateway çağrısından önce reddedilir.
- Sağlayıcı metin çıktısı döndürmediğinde yerel `model run` sıfırdan farklı bir kodla çıkar; böylece erişilemeyen sağlayıcılar ve boş tamamlamalar başarılı yoklamalar gibi görünmez.
- Model girdisini ham tutarken Gateway yönlendirmesini veya ajan çalışma zamanı kurulumunu sınamak için `model run --gateway` kullanın. Tam ajan bağlamı, araçlar, bellek ve oturum dökümü için `openclaw agent` veya bir sohbet arayüzü kullanın.
- `--thinking adaptive`, tamamlama çalışma zamanı düzeyi `medium` ile eşleşir; `--thinking max`, yerel en yüksek çabayı destekleyen OpenAI modellerinde `max`, diğerlerinde `xhigh` ile eşleşir.
- `model auth login`, `model auth logout` ve `model auth status`, kaydedilmiş sağlayıcı kimlik doğrulama durumunu yönetir.

## Görsel

Oluşturma, düzenleme ve açıklama.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Notlar:

- Mevcut girdi dosyalarından başlarken `image edit` kullanın; `--size`, `--aspect-ratio` veya `--resolution`, bunları destekleyen sağlayıcılarda/modellerde geometri ipuçları ekler.
- `--model openai/gpt-image-1.5` ile `--output-format png --background transparent`, şeffaf arka planlı OpenAI PNG çıktısı verir; `--openai-background`, aynı ipucu için OpenAI'ye özgü bir diğer addır. Arka plan desteği bildirmeyen sağlayıcılar bunu yok sayılan bir geçersiz kılma olarak raporlar ([JSON zarfındaki](#json-output) `ignoredOverrides` alanına bakın).
- `--quality low|medium|high|auto`, OpenAI dâhil olmak üzere görüntü kalitesi ipuçlarını destekleyen sağlayıcılarda çalışır. OpenAI ayrıca `--openai-moderation low|auto` seçeneğini de kabul eder.
- `image providers --json`, hangi paketlenmiş görüntü sağlayıcılarının keşfedilebilir, yapılandırılmış ve seçili olduğunu ve her birinin hangi üretme/düzenleme yeteneklerini sunduğunu listeler.
- `image generate --model <provider/model> --json`, görüntü üretme değişiklikleri için en dar kapsamlı canlı duman testidir:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  Yanıt; `ok`, `provider`, `model`, `attempts` alanlarını ve yazılan çıktı yollarını bildirir. `--output` ayarlandığında son uzantı, sağlayıcının döndürdüğü MIME türüne göre belirlenebilir.

- `image describe` ve `image describe-many` için göreve özgü bir talimat (OCR, karşılaştırma, kullanıcı arayüzü incelemesi, kısa açıklama oluşturma) vermek üzere `--prompt` kullanın.
- Yavaş yerel görüntü modelleri veya Ollama'nın soğuk başlatmaları için `--timeout-ms` kullanın.
- `image describe` için açıkça belirtilen bir `--model` (görüntü yetenekli bir `<provider/model>` olmalıdır) önce çalıştırılır; bu çağrı başarısız olursa yapılandırılmış `agents.defaults.imageModel.fallbacks` denenir. Girdi hazırlama hataları (eksik dosya, desteklenmeyen URL) herhangi bir geri dönüş denemesinden önce başarısız olur ve model kataloğunda veya sağlayıcı yapılandırmasında modelin görüntü yetenekli olması gerekir.
- Yerel Ollama görüntü modelleri için önce modeli indirin ve `OLLAMA_API_KEY` değerini herhangi bir yer tutucu değere, örneğin `ollama-local` olarak ayarlayın. Bkz. [Ollama](/tr/providers/ollama#vision-and-image-description).

## Ses

Dosya transkripsiyonu (gerçek zamanlı oturum yönetimi değil).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

`--model`, `<provider/model>` biçiminde olmalıdır.

## TTS

Konuşma sentezi ve TTS sağlayıcı/persona durumu.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

Notlar:

- `tts status` yalnızca `--gateway` seçeneğini destekler (Gateway tarafından yönetilen TTS durumunu yansıtır).
- TTS davranışını incelemek ve yapılandırmak için `tts providers`, `tts voices`, `tts personas`, `tts set-provider` ve `tts set-persona` komutlarını kullanın.

## Video

Üretme ve açıklama.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Notlar:

- `video generate`; `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` ve `--timeout-ms` seçeneklerini kabul eder ve bunları video üretme çalışma zamanına iletir.
- `video describe` için `--model`, `<provider/model>` biçiminde olmalıdır.

## Web

Arama ve getirme.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

`web providers`, arama ve getirme için kullanılabilir, yapılandırılmış ve seçili sağlayıcıları listeler.

## Gömme

Vektör oluşturma ve gömme sağlayıcısını inceleme.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON çıktısı

Infer komutları, JSON çıktısını ortak bir zarf altında normalleştirir:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Kararlı üst düzey alanlar:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (uygun olduğunda istekle gönderilen görüntü ekleri)
- `outputs`
- `ignoredOverrides` (uygun olduğunda bir sağlayıcının desteklemediği ipucu anahtarları)
- `error`

Üretilen medya komutlarında `outputs`, OpenClaw tarafından yazılan dosyaları içerir. Otomasyon için insanlar tarafından okunabilir standart çıktıyı ayrıştırmak yerine bu dizideki `path`, `mimeType`, `size` alanlarını ve medyaya özgü boyutları kullanın.

## Yaygın tuzaklar

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## İlgili konular

- [CLI referansı](/tr/cli)
- [Modeller](/tr/concepts/models)
