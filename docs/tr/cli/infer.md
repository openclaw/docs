---
read_when:
    - '`openclaw infer` komutlarını ekleme veya değiştirme'
    - Kararlı arayüzsüz yetenek otomasyonu tasarlama
summary: Sağlayıcı destekli model, görüntü, ses, TTS, video, web ve gömme iş akışları için çıkarım öncelikli CLI
title: Çıkarım CLI
x-i18n:
    generated_at: "2026-04-30T09:12:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer`, sağlayıcı destekli çıkarım iş akışları için kanonik başsız yüzeydir.

Ham Gateway RPC adlarını veya ham aracı araç kimliklerini değil, bilerek yetenek ailelerini sunar.

## infer'ı bir beceriye dönüştürün

Bunu bir aracıya kopyalayıp yapıştırın:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

İyi bir infer tabanlı beceri şunları yapmalıdır:

- yaygın kullanıcı niyetlerini doğru infer alt komutuyla eşleştirmek
- kapsadığı iş akışları için birkaç kanonik infer örneği içermek
- örneklerde ve önerilerde `openclaw infer ...` kullanımını tercih etmek
- beceri gövdesi içinde tüm infer yüzeyini yeniden belgelendirmekten kaçınmak

Tipik infer odaklı beceri kapsamı:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Neden infer kullanılır?

`openclaw infer`, OpenClaw içindeki sağlayıcı destekli çıkarım görevleri için tek ve tutarlı bir CLI sağlar.

Avantajlar:

- Her arka uç için tek seferlik sarmalayıcılar kurmak yerine OpenClaw'da zaten yapılandırılmış sağlayıcıları ve modelleri kullanın.
- Model, görüntü, ses transkripsiyonu, TTS, video, web ve gömme iş akışlarını tek bir komut ağacı altında tutun.
- Betikler, otomasyon ve aracı odaklı iş akışları için kararlı bir `--json` çıktı biçimi kullanın.
- Görev temelde "çıkarım çalıştırmak" olduğunda birinci taraf OpenClaw yüzeyini tercih edin.
- Çoğu infer komutu için Gateway gerektirmeden normal yerel yolu kullanın.

Uçtan uca sağlayıcı kontrolleri için, daha düşük seviyeli sağlayıcı testleri yeşil olduğunda `openclaw infer ...` tercih edin. Sağlayıcı isteği yapılmadan önce yayımlanan CLI'yi, yapılandırma yüklemeyi, varsayılan aracı çözümlemesini, paketle gelen Plugin etkinleştirmesini, çalışma zamanı bağımlılığı onarımını ve paylaşılan yetenek çalışma zamanını çalıştırır.

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
    status
    enable
    disable
    set-provider

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

## Yaygın görevler

Bu tablo, yaygın çıkarım görevlerini karşılık gelen infer komutuyla eşleştirir.

| Görev                         | Komut                                                                                       | Notlar                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Metin/model istemi çalıştır      | `openclaw infer model run --prompt "..." --json`                                              | Varsayılan olarak normal yerel yolu kullanır                 |
| Görüntüler üzerinde model istemi çalıştır | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Birden çok görüntü girdisi için `--file` öğesini yineleyin             |
| Görüntü oluştur            | `openclaw infer image generate --prompt "..." --json`                                         | Mevcut bir dosyadan başlarken `image edit` kullanın  |
| Bir görüntü dosyasını açıklayın       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` görüntü destekli bir `<provider/model>` olmalıdır |
| Sesi transkribe et             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` `<provider/model>` olmalıdır                  |
| Konuşma sentezle            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` Gateway odaklıdır                      |
| Video oluştur             | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution` gibi sağlayıcı ipuçlarını destekler        |
| Bir video dosyasını açıklayın        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` `<provider/model>` olmalıdır                  |
| Web'de ara               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Bir web sayfası getir             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Gömme oluştur            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Davranış

- `openclaw infer ...`, bu iş akışları için birincil CLI yüzeyidir.
- Çıktı başka bir komut veya betik tarafından tüketilecekse `--json` kullanın.
- Belirli bir arka uç gerekiyorsa `--provider` veya `--model provider/model` kullanın.
- `image describe`, `audio transcribe` ve `video describe` için `--model`, `<provider/model>` biçimini kullanmalıdır.
- `image describe` için açık bir `--model`, ilgili sağlayıcıyı/modeli doğrudan çalıştırır. Model, model kataloğunda veya sağlayıcı yapılandırmasında görüntü destekli olmalıdır. `codex/<model>`, sınırlı bir Codex uygulama sunucusu görüntü anlama turu çalıştırır; `openai-codex/<model>`, OpenAI Codex OAuth sağlayıcı yolunu kullanır.
- Durumsuz yürütme komutları varsayılan olarak yereldir.
- Gateway tarafından yönetilen durum komutları varsayılan olarak Gateway kullanır.
- Normal yerel yol, Gateway'in çalışıyor olmasını gerektirmez.
- Yerel `model run`, yalın bir tek seferlik sağlayıcı tamamlama işlemidir. Yapılandırılmış aracı modelini ve kimlik doğrulamayı çözer, ancak bir sohbet aracısı turu başlatmaz, araçları yüklemez veya paketle gelen MCP sunucularını açmaz.
- `model run --file`, görüntü dosyalarını kabul eder, MIME türlerini algılar ve sağlanan istemle birlikte seçilen modele gönderir. Birden çok görüntü için `--file` öğesini yineleyin.
- `model run --file`, görüntü dışı girdileri reddeder. Ses dosyaları için `infer audio transcribe`, video dosyaları için `infer video describe` kullanın.
- `model run --gateway`, Gateway yönlendirmesini, kaydedilmiş kimlik doğrulamayı, sağlayıcı seçimini ve gömülü çalışma zamanını çalıştırır, ancak yine de ham bir model yoklaması olarak çalışır: sağlanan istemi ve görüntü eklerini önceki oturum dökümü, bootstrap/AGENTS bağlamı, bağlam motoru derlemesi, araçlar veya paketle gelen MCP sunucuları olmadan gönderir.
- `model run --gateway --model <provider/model>`, istek Gateway'den tek seferlik sağlayıcı/model geçersiz kılması çalıştırmasını istediği için güvenilir operatör Gateway kimlik bilgisi gerektirir.

## Model

Sağlayıcı destekli metin çıkarımı ve model/sağlayıcı incelemesi için `model` kullanın.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Gateway'i başlatmadan veya tam aracı araç yüzeyini yüklemeden belirli bir sağlayıcıyı duman testinden geçirmek için tam `<provider/model>` başvuruları kullanın:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Notlar:

- Yerel `model run`, sağlayıcı/model/kimlik doğrulama sağlığı için en dar CLI duman testidir, çünkü seçilen modele yalnızca sağlanan istemi gönderir.
- Yerel `model run --file`, bu yalın yolu korur ve görüntü içeriğini doğrudan tek kullanıcı iletisine ekler. PNG, JPEG ve WebP gibi yaygın görüntü dosyaları, MIME türleri `image/*` olarak algılandığında çalışır; desteklenmeyen veya tanınmayan dosyalar sağlayıcı çağrılmadan önce başarısız olur.
- `model run --file`, seçilen çok modlu metin modelini doğrudan test etmek istediğinizde en uygunudur. OpenClaw'un görüntü anlama sağlayıcı seçimini ve varsayılan görüntü modeli yönlendirmesini istediğinizde `infer image describe` kullanın.
- Seçilen model görüntü girdisini desteklemelidir; yalnızca metin modelleri isteği sağlayıcı katmanında reddedebilir.
- `model run --prompt`, boşluk dışı metin içermelidir; boş istemler yerel sağlayıcılar veya Gateway çağrılmadan önce reddedilir.
- Yerel `model run`, sağlayıcı metin çıktısı döndürmediğinde sıfır olmayan kodla çıkar; böylece erişilemeyen yerel sağlayıcılar ve boş tamamlamalar başarılı yoklamalar gibi görünmez.
- Model girdisini ham tutarken Gateway yönlendirmesini, aracı çalışma zamanı kurulumunu veya Gateway tarafından yönetilen sağlayıcı durumunu test etmeniz gerektiğinde `model run --gateway` kullanın. Tam aracı bağlamını, araçları, belleği ve oturum dökümünü istediğinizde `openclaw agent` veya sohbet yüzeylerini kullanın.
- `model auth login`, `model auth logout` ve `model auth status`, kaydedilmiş sağlayıcı kimlik doğrulama durumunu yönetir.

## Görüntü

Oluşturma, düzenleme ve açıklama için `image` kullanın.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

Notlar:

- Mevcut girdi dosyalarından başlarken `image edit` kullanın.
- Referans görüntü düzenlemelerinde geometri ipuçlarını destekleyen sağlayıcılar/modeller için `image edit` ile `--size`, `--aspect-ratio` veya `--resolution` kullanın.
- Saydam arka planlı OpenAI PNG çıktısı için `--model openai/gpt-image-1.5` ile `--output-format png --background transparent` kullanın; `--openai-background`, OpenAI'ye özgü bir diğer ad olarak kullanılabilir kalır. Arka plan desteği bildirmeyen sağlayıcılar, ipucunu yok sayılan bir geçersiz kılma olarak raporlar.
- Paketle gelen hangi görüntü sağlayıcılarının keşfedilebilir, yapılandırılmış ve seçilmiş olduğunu ve her sağlayıcının hangi oluşturma/düzenleme yeteneklerini sunduğunu doğrulamak için `image providers --json` kullanın.
- Görüntü oluşturma değişiklikleri için en dar canlı CLI duman testi olarak `image generate --model <provider/model> --json` kullanın. Örnek:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON yanıtı `ok`, `provider`, `model`, `attempts` ve yazılan çıktı
  yollarını bildirir. `--output` ayarlandığında, son uzantı sağlayıcının
  döndürdüğü MIME türünü izleyebilir.

- `image describe` ve `image describe-many` için, görsel modele OCR, karşılaştırma, UI incelemesi veya kısa başlık oluşturma gibi göreve özgü bir talimat vermek üzere `--prompt` kullanın.
- Yavaş yerel görsel modellerle veya soğuk Ollama başlatmalarında `--timeout-ms` kullanın.
- `image describe` için `--model`, görüntü destekli bir `<provider/model>` olmalıdır.
- Yerel Ollama görsel modelleri için önce modeli çekin ve `OLLAMA_API_KEY` değerini herhangi bir yer tutucu değere, örneğin `ollama-local`, ayarlayın. Bkz. [Ollama](/tr/providers/ollama#vision-and-image-description).

## Ses

Dosya transkripsiyonu için `audio` kullanın.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Notlar:

- `audio transcribe`, gerçek zamanlı oturum yönetimi için değil, dosya transkripsiyonu içindir.
- `--model`, `<provider/model>` olmalıdır.

## TTS

Konuşma sentezi ve TTS sağlayıcı durumu için `tts` kullanın.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Notlar:

- `tts status`, Gateway tarafından yönetilen TTS durumunu yansıttığı için varsayılan olarak Gateway kullanır.
- TTS davranışını incelemek ve yapılandırmak için `tts providers`, `tts voices` ve `tts set-provider` kullanın.

## Video

Oluşturma ve açıklama için `video` kullanın.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Notlar:

- `video generate`, `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` ve `--timeout-ms` kabul eder ve bunları video oluşturma çalışma zamanına iletir.
- `video describe` için `--model`, `<provider/model>` olmalıdır.

## Web

Arama ve getirme iş akışları için `web` kullanın.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Notlar:

- Kullanılabilir, yapılandırılmış ve seçili sağlayıcıları incelemek için `web providers` kullanın.

## Gömme

Vektör oluşturma ve gömme sağlayıcı incelemesi için `embedding` kullanın.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON çıktısı

Infer komutları JSON çıktısını paylaşılan bir zarf altında normalleştirir:

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

Üst düzey alanlar kararlıdır:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Oluşturulan medya komutları için `outputs`, OpenClaw tarafından yazılan dosyaları içerir. Otomasyon için insan tarafından okunabilir stdout’u ayrıştırmak yerine bu dizideki `path`, `mimeType`, `size` ve medyaya özgü tüm boyutları kullanın.

## Yaygın hatalar

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

## Notlar

- `openclaw capability ...`, `openclaw infer ...` için bir takma addır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Modeller](/tr/concepts/models)
