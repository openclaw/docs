---
read_when:
    - '`openclaw infer` komutlarını ekleme veya değiştirme'
    - Kararlı başsız yetenek otomasyonu tasarlama
summary: Sağlayıcı destekli model, görüntü, ses, TTS, video, web ve gömme iş akışları için çıkarım öncelikli CLI
title: Çıkarım CLI
x-i18n:
    generated_at: "2026-07-01T08:23:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb63996dd1364bffba58d4b132849ac4157fb612555c009da795c963142f9368
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer`, sağlayıcı destekli çıkarım iş akışları için standart başsız yüzeydir.

Bilinçli olarak ham gateway RPC adlarını veya ham agent araç kimliklerini değil, yetenek ailelerini sunar.

## infer'ı bir skill'e dönüştürme

Bunu bir agent'a kopyalayıp yapıştırın:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

İyi bir infer tabanlı skill şunları yapmalıdır:

- yaygın kullanıcı amaçlarını doğru infer alt komutuyla eşleştirmeli
- kapsadığı iş akışları için birkaç standart infer örneği içermeli
- örneklerde ve önerilerde `openclaw infer ...` kullanımını tercih etmeli
- skill gövdesi içinde tüm infer yüzeyini yeniden belgelemekten kaçınmalı

Tipik infer odaklı skill kapsamı:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Neden infer kullanılır

`openclaw infer`, OpenClaw içinde sağlayıcı destekli çıkarım görevleri için tutarlı tek bir CLI sağlar.

Faydaları:

- Her arka uç için tek seferlik sarmalayıcılar bağlamak yerine OpenClaw'da zaten yapılandırılmış sağlayıcıları ve modelleri kullanın.
- Model, görüntü, ses transkripsiyonu, TTS, video, web ve embedding iş akışlarını tek bir komut ağacı altında tutun.
- Betikler, otomasyon ve agent güdümlü iş akışları için kararlı bir `--json` çıktı biçimi kullanın.
- Görev temelde "çıkarım çalıştırmak" olduğunda birinci taraf OpenClaw yüzeyini tercih edin.
- Çoğu infer komutu için gateway gerektirmeden normal yerel yolu kullanın.

Uçtan uca sağlayıcı kontrolleri için, daha düşük düzey sağlayıcı testleri yeşil olduktan sonra `openclaw infer ...` tercih edin. Sağlayıcı isteği yapılmadan önce yayımlanan CLI'yi, yapılandırma yüklemeyi, varsayılan agent çözümlemesini, paketli Plugin etkinleştirmeyi ve paylaşılan yetenek çalışma zamanını çalıştırır.

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

| Görev                         | Komut                                                                                         | Notlar                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Metin/model prompt'u çalıştır | `openclaw infer model run --prompt "..." --json`                                              | Varsayılan olarak normal yerel yolu kullanır          |
| Görseller üzerinde model prompt'u çalıştır | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | Birden çok görsel girdisi için `--file` tekrar edin   |
| Görsel oluştur                | `openclaw infer image generate --prompt "..." --json`                                         | Mevcut bir dosyadan başlarken `image edit` kullanın   |
| Görsel dosyasını veya URL'yi açıkla | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model`, görüntü yetenekli bir `<provider/model>` olmalıdır |
| Sesi yazıya dök               | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model`, `<provider/model>` olmalıdır               |
| Konuşma sentezle              | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` gateway odaklıdır                        |
| Video oluştur                 | `openclaw infer video generate --prompt "..." --json`                                         | `--resolution` gibi sağlayıcı ipuçlarını destekler    |
| Video dosyasını açıkla        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model`, `<provider/model>` olmalıdır               |
| Web'de ara                    | `openclaw infer web search --query "..." --json`                                              |                                                       |
| Web sayfası getir             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| Embedding oluştur             | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## Davranış

- `openclaw infer ...`, bu iş akışları için birincil CLI yüzeyidir.
- Çıktı başka bir komut veya betik tarafından tüketilecekse `--json` kullanın.
- Belirli bir arka uç gerektiğinde `--provider` veya `--model provider/model` kullanın.
- Çalıştırmayı ham tutarken tek seferlik düşünme/akıl yürütme düzeyi (`off`, `minimal`, `low`, `medium`, `high`, `adaptive`, `xhigh` veya `max`) geçirmek için `model run --thinking <level>` kullanın.
- `image describe`, `audio transcribe` ve `video describe` için `--model`, `<provider/model>` biçimini kullanmalıdır.
- `image describe` için `--file`, yerel yolları ve HTTP(S) görsel URL'lerini kabul eder. Uzak URL'ler normal medya getirme SSRF politikasını kullanır.
- `image describe` için açık bir `--model`, önce ilgili sağlayıcı/modeli çalıştırır, ardından model çağrısı başarısız olduğunda yapılandırılmış `agents.defaults.imageModel.fallbacks` seçeneklerini dener. Eksik dosyalar veya desteklenmeyen URL'ler gibi girdi hazırlama hataları, fallback denemelerinden önce başarısız olur. Model kataloğunda veya sağlayıcı yapılandırmasında model görüntü yetenekli olmalıdır. `codex/<model>`, sınırlı bir Codex app-server görüntü anlama turu çalıştırır; `openai/<model>`, API anahtarı veya ChatGPT/Codex OAuth kimlik doğrulamasıyla OpenAI sağlayıcı yolunu kullanır.
- Durumsuz yürütme komutları varsayılan olarak yerele ayarlanır.
- Gateway tarafından yönetilen durum komutları varsayılan olarak gateway'e ayarlanır.
- Normal yerel yol, gateway'in çalışıyor olmasını gerektirmez.
- Yerel `model run`, yalın bir tek seferlik sağlayıcı tamamlama işlemidir. Yapılandırılmış agent modelini ve kimlik doğrulamayı çözümler, ancak sohbet agent turu başlatmaz, araç yüklemez veya paketli MCP sunucularını açmaz.
- `model run --file`, görsel dosyalarını kabul eder, MIME türlerini algılar ve sağlanan prompt ile birlikte seçilen modele gönderir. Birden çok görsel için `--file` tekrar edin.
- `model run --file`, görsel olmayan girdileri reddeder. Ses dosyaları için `infer audio transcribe`, video dosyaları için `infer video describe` kullanın.
- `model run --gateway`, Gateway yönlendirmesini, kayıtlı kimlik doğrulamayı, sağlayıcı seçimini ve gömülü çalışma zamanını çalıştırır, ancak yine de ham model probu olarak çalışır: sağlanan prompt'u ve varsa görsel eklerini önceki oturum transkripti, bootstrap/AGENTS bağlamı, context-engine derlemesi, araçlar veya paketli MCP sunucuları olmadan gönderir.
- `model run --gateway --model <provider/model>`, istek Gateway'den tek seferlik bir sağlayıcı/model override çalıştırmasını istediği için güvenilir bir operatör gateway kimlik bilgisi gerektirir.
- Yerel `model run --thinking`, yalın sağlayıcı tamamlama yolunu kullanır; `adaptive` ve `max` gibi sağlayıcıya özgü düzeyler, en yakın taşınabilir basit tamamlama düzeyine eşlenir.

## Model

Sağlayıcı destekli metin çıkarımı ve model/sağlayıcı incelemesi için `model` kullanın.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Gateway'i başlatmadan veya tam agent araç yüzeyini yüklemeden belirli bir sağlayıcıyı smoke test etmek için tam `<provider/model>` referanslarını kullanın:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

Notlar:

- Yerel `model run`, sağlayıcı/model/kimlik doğrulama sağlığı için en dar CLI smoke testidir çünkü Codex olmayan sağlayıcılar için yalnızca sağlanan prompt'u seçilen modele gönderir.
- Yerel `model run --model <provider/model>`, ilgili sağlayıcı yapılandırmaya yazılmadan önce `models list --all` içinden tam paketli statik katalog satırlarını kullanabilir. Sağlayıcı kimlik doğrulaması yine de gereklidir; eksik kimlik bilgileri `Unknown model` olarak değil, kimlik doğrulama hataları olarak başarısız olur.
- Mistral Medium 3.5 akıl yürütme probları için sıcaklığı ayarlanmamış/varsayılan bırakın. Mistral, `reasoning_effort="high"` ile `temperature: 0` birleşimini reddeder; varsayılan sıcaklıkla veya `0.7` gibi sıfır olmayan bir reasoning-mode değeriyle `mistral/mistral-medium-3-5` kullanın.
- Codex Responses yerel probları dar istisnadır: OpenClaw, taşımanın gerekli `instructions` alanını doldurabilmesi için tam agent bağlamı, araçlar, bellek veya oturum transkripti eklemeden en düşük düzeyde bir sistem talimatı ekler.
- Yerel `model run --file`, bu yalın yolu korur ve görsel içeriği doğrudan tek kullanıcı iletisine ekler. PNG, JPEG ve WebP gibi yaygın görsel dosyaları, MIME türleri `image/*` olarak algılandığında çalışır; desteklenmeyen veya tanınmayan dosyalar sağlayıcı çağrılmadan önce başarısız olur.
- Seçilen çok modlu metin modelini doğrudan test etmek istediğinizde `model run --file` en uygunudur. OpenClaw'ın görüntü anlama sağlayıcı seçimini ve varsayılan görüntü modeli yönlendirmesini istediğinizde `infer image describe` kullanın.
- Seçilen model görsel girdisini desteklemelidir; yalnızca metin modelleri isteği sağlayıcı katmanında reddedebilir.
- `model run --prompt`, boşluk dışı metin içermelidir; boş prompt'lar yerel sağlayıcılar veya Gateway çağrılmadan önce reddedilir.
- Sağlayıcı metin çıktısı döndürmediğinde yerel `model run` sıfır olmayan kodla çıkar; böylece erişilemeyen yerel sağlayıcılar ve boş tamamlamalar başarılı prob gibi görünmez.
- Model girdisini ham tutarken Gateway yönlendirmesini, agent çalışma zamanı kurulumunu veya Gateway tarafından yönetilen sağlayıcı durumunu test etmeniz gerektiğinde `model run --gateway` kullanın. Tam agent bağlamı, araçlar, bellek ve oturum transkripti istediğinizde `openclaw agent` veya sohbet yüzeylerini kullanın.
- `model auth login`, `model auth logout` ve `model auth status`, kayıtlı sağlayıcı kimlik doğrulama durumunu yönetir.

## Görsel

Oluşturma, düzenleme ve açıklama için `image` kullanın.

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

- Mevcut girdi dosyalarından başlarken `image edit` kullanın.
- Referans görsel düzenlemelerinde geometri ipuçlarını destekleyen sağlayıcılar/modeller için
  `image edit` ile `--size`, `--aspect-ratio` veya `--resolution` kullanın.
- Şeffaf arka planlı OpenAI PNG çıktısı için `--model openai/gpt-image-1.5` ile
  `--output-format png --background transparent` kullanın;
  `--openai-background`, OpenAI'ye özgü bir takma ad olarak kullanılabilir durumda kalır. Arka plan desteği
  bildirmeyen sağlayıcılar ipucunu yok sayılan bir geçersiz kılma olarak raporlar.
- OpenAI dahil, görsel kalitesi ipuçlarını destekleyen sağlayıcılar için
  `--quality low|medium|high|auto` kullanın. OpenAI ayrıca
  sağlayıcıya özgü moderasyon ipucu için `--openai-moderation low|auto` kabul eder.
- Hangi paketli görsel sağlayıcılarının keşfedilebilir, yapılandırılmış ve seçili olduğunu
  ve her sağlayıcının hangi üretim/düzenleme yeteneklerini sunduğunu doğrulamak için
  `image providers --json` kullanın.
- Görsel üretimi değişiklikleri için en dar canlı CLI smoke testi olarak
  `image generate --model <provider/model> --json` kullanın. Örnek:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON yanıtı `ok`, `provider`, `model`, `attempts` ve yazılan
  çıktı yollarını raporlar. `--output` ayarlandığında, son uzantı
  sağlayıcının döndürdüğü MIME türünü izleyebilir.

- `image describe` ve `image describe-many` için görme modeline OCR, karşılaştırma, UI incelemesi veya kısa başlıklandırma gibi göreve özel bir talimat vermek üzere `--prompt` kullanın.
- Yavaş yerel görme modelleri veya soğuk Ollama başlangıçları ile `--timeout-ms` kullanın.
- `image describe` için `--model`, görsel destekli bir `<provider/model>` olmalıdır.
  Ayarlandığında, OpenClaw önce bu açık modeli dener ve model çağrısı başarısız olursa
  yapılandırılmış görsel modeli yedeklerine geçer.
- Yerel Ollama görme modelleri için önce modeli çekin ve `OLLAMA_API_KEY` değerini herhangi bir yer tutucu değere, örneğin `ollama-local`, ayarlayın. Bkz. [Ollama](/tr/providers/ollama#vision-and-image-description).

## Ses

Dosya transkripsiyonu için `audio` kullanın.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Notlar:

- `audio transcribe`, gerçek zamanlı oturum yönetimi için değil dosya transkripsiyonu içindir.
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

- `tts status`, Gateway tarafından yönetilen TTS durumunu yansıttığı için varsayılan olarak gateway kullanır.
- TTS davranışını incelemek ve yapılandırmak için `tts providers`, `tts voices` ve `tts set-provider` kullanın.

## Video

Üretim ve açıklama için `video` kullanın.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

Notlar:

- `video generate`, `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` ve `--timeout-ms` kabul eder ve bunları video üretimi çalışma zamanına iletir.
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

## Embedding

Vektör oluşturma ve embedding sağlayıcı incelemesi için `embedding` kullanın.

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

Üretilen medya komutlarında `outputs`, OpenClaw tarafından yazılan dosyaları içerir. Otomasyon için insan tarafından okunabilir stdout'u ayrıştırmak yerine
bu dizideki `path`, `mimeType`, `size` ve medyaya özgü boyutları kullanın.

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

## Notlar

- `openclaw capability ...`, `openclaw infer ...` için bir takma addır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Modeller](/tr/concepts/models)
