---
read_when:
    - '`openclaw infer` komutları ekleme veya değiştirme'
    - Kararlı headless yetenek otomasyonu tasarlama
summary: Sağlayıcı destekli model, görsel, ses, TTS, video, web ve embedding iş akışları için çıkarım öncelikli CLI
title: Inference CLI
x-i18n:
    generated_at: "2026-04-26T11:26:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer`, sağlayıcı destekli çıkarım iş akışları için kanonik headless yüzeydir.

Kasıtlı olarak ham gateway RPC adlarını ve ham agent tool kimliklerini değil, yetenek ailelerini açığa çıkarır.

## Infer'ü bir Skills haline getirin

Bunu bir agent'a kopyalayıp yapıştırın:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Infer tabanlı iyi bir beceri şunları yapmalıdır:

- yaygın kullanıcı niyetlerini doğru infer alt komutuna eşlemek
- kapsadığı iş akışları için birkaç kanonik infer örneği içermek
- örneklerde ve önerilerde `openclaw infer ...` kullanmayı tercih etmek
- tüm infer yüzeyini beceri gövdesi içinde yeniden belgelendirmekten kaçınmak

Tipik infer odaklı beceri kapsamı:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Neden infer kullanılır

`openclaw infer`, OpenClaw içindeki sağlayıcı destekli çıkarım görevleri için tek ve tutarlı bir CLI sağlar.

Avantajlar:

- Her backend için tek seferlik wrapper'lar bağlamak yerine, OpenClaw içinde zaten yapılandırılmış sağlayıcıları ve modelleri kullanın.
- Model, görsel, ses transkripsiyonu, TTS, video, web ve embedding iş akışlarını tek bir komut ağacı altında tutun.
- Betikler, otomasyon ve agent tabanlı iş akışları için kararlı bir `--json` çıktı biçimi kullanın.
- Görev özünde "çıkarım çalıştır" ise birinci taraf bir OpenClaw yüzeyini tercih edin.
- Çoğu infer komutu için gateway gerektirmeden normal yerel yolu kullanın.

Uçtan uca sağlayıcı denetimleri için, alt düzey sağlayıcı testleri yeşil olduğunda `openclaw infer ...` tercih edin. Bu; sağlayıcı isteği yapılmadan önce yayımlanmış CLI'yi, config yüklemeyi, varsayılan agent çözümlemesini, paketlenmiş Plugin etkinleştirmesini, çalışma zamanı bağımlılığı onarımını ve paylaşılan yetenek çalışma zamanını sınar.

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

Bu tablo, yaygın çıkarım görevlerini karşılık gelen infer komutuyla eşler.

| Görev                   | Komut                                                                 | Notlar                                                  |
| ----------------------- | --------------------------------------------------------------------- | ------------------------------------------------------- |
| Metin/model istemi çalıştır | `openclaw infer model run --prompt "..." --json`                      | Varsayılan olarak normal yerel yolu kullanır            |
| Görsel oluştur          | `openclaw infer image generate --prompt "..." --json`                 | Mevcut bir dosyadan başlıyorsanız `image edit` kullanın |
| Bir görsel dosyasını açıkla | `openclaw infer image describe --file ./image.png --json`             | `--model`, görsel destekli bir `<provider/model>` olmalıdır |
| Sesi transkribe et      | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model`, `<provider/model>` olmalıdır                 |
| Konuşma sentezle        | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status`, gateway odaklıdır                         |
| Video oluştur           | `openclaw infer video generate --prompt "..." --json`                 | `--resolution` gibi sağlayıcı ipuçlarını destekler      |
| Bir video dosyasını açıkla | `openclaw infer video describe --file ./clip.mp4 --json`              | `--model`, `<provider/model>` olmalıdır                 |
| Web'de ara              | `openclaw infer web search --query "..." --json`                      |                                                         |
| Bir web sayfasını getir | `openclaw infer web fetch --url https://example.com --json`           |                                                         |
| Embedding oluştur       | `openclaw infer embedding create --text "..." --json`                 |                                                         |

## Davranış

- `openclaw infer ...`, bu iş akışları için birincil CLI yüzeyidir.
- Çıktı başka bir komut veya betik tarafından tüketilecekse `--json` kullanın.
- Belirli bir backend gerektiğinde `--provider` veya `--model provider/model` kullanın.
- `image describe`, `audio transcribe` ve `video describe` için `--model`, `<provider/model>` biçimini kullanmalıdır.
- `image describe` için açık bir `--model`, doğrudan o sağlayıcı/modeli çalıştırır. Model, model kataloğunda veya sağlayıcı config'inde görsel destekli olmalıdır. `codex/<model>`, sınırlı bir Codex app-server görsel anlama turu çalıştırır; `openai-codex/<model>` ise OpenAI Codex OAuth sağlayıcı yolunu kullanır.
- Durumsuz yürütme komutları varsayılan olarak yereldir.
- Gateway tarafından yönetilen durum komutları varsayılan olarak gateway kullanır.
- Normal yerel yol, gateway'in çalışmasını gerektirmez.
- `model run` tek seferliktir. Hem yerel hem de `--gateway` yürütmede, bu komut için agent çalışma zamanı üzerinden açılan MCP sunucuları yanıttan sonra emekliye ayrılır; böylece tekrarlanan betik çağrıları stdio MCP alt süreçlerini canlı tutmaz.

## Model

Sağlayıcı destekli metin çıkarımı ve model/sağlayıcı incelemesi için `model` kullanın.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Notlar:

- `model run`, sağlayıcı/model geçersiz kılmalarının normal agent yürütmesi gibi davranması için agent çalışma zamanını yeniden kullanır.
- `model run` headless otomasyon için tasarlandığından, komut bittiğinde oturum başına paketlenmiş MCP çalışma zamanlarını korumaz.
- `model auth login`, `model auth logout` ve `model auth status`, kaydedilmiş sağlayıcı kimlik doğrulama durumunu yönetir.

## Görsel

Oluşturma, düzenleme ve açıklama için `image` kullanın.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Notlar:

- Mevcut girdi dosyalarından başlıyorsanız `image edit` kullanın.
- Başvuru görseli düzenlemelerinde geometri ipuçlarını destekleyen sağlayıcılar/modeller için `image edit` ile `--size`, `--aspect-ratio` veya `--resolution` kullanın.
- Saydam arka planlı OpenAI PNG çıktısı için `--model openai/gpt-image-1.5` ile `--output-format png --background transparent` kullanın; `--openai-background`, OpenAI'ye özel bir takma ad olarak kullanılmaya devam eder. Arka plan desteği bildirmeyen sağlayıcılar, bu ipucunu yok sayılan bir geçersiz kılma olarak raporlar.
- Hangi paketlenmiş görsel sağlayıcıların keşfedilebilir, yapılandırılmış, seçilmiş olduğunu ve her sağlayıcının hangi oluşturma/düzenleme yeteneklerini sunduğunu doğrulamak için `image providers --json` kullanın.
- Görsel oluşturma değişiklikleri için en dar kapsamlı canlı CLI smoke testi olarak `image generate --model <provider/model> --json` kullanın. Örnek:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON yanıtı `ok`, `provider`, `model`, `attempts` ve yazılan çıktı yollarını bildirir. `--output` ayarlandığında son uzantı sağlayıcının döndürdüğü MIME türünü izleyebilir.

- `image describe` için `--model`, görsel destekli bir `<provider/model>` olmalıdır.
- Yerel Ollama vision modelleri için önce modeli çekin ve `OLLAMA_API_KEY` değerini örneğin `ollama-local` gibi herhangi bir yer tutucu değer olarak ayarlayın. Bkz. [Ollama](/tr/providers/ollama#vision-and-image-description).

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

- `tts status`, gateway tarafından yönetilen TTS durumunu yansıttığı için varsayılan olarak gateway kullanır.
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

- Kullanılabilir, yapılandırılmış ve seçilmiş sağlayıcıları incelemek için `web providers` kullanın.

## Embedding

Vektör oluşturma ve embedding sağlayıcı incelemesi için `embedding` kullanın.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON çıktısı

Infer komutları, JSON çıktısını paylaşılan bir zarf altında normalize eder:

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

Oluşturulan medya komutları için `outputs`, OpenClaw tarafından yazılan dosyaları içerir. Otomasyon için insan tarafından okunabilir stdout'u ayrıştırmak yerine bu dizideki `path`, `mimeType`, `size` ve medyaya özgü boyutları kullanın.

## Yaygın hatalar

```bash
# Kötü
openclaw infer media image generate --prompt "friendly lobster"

# İyi
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Kötü
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# İyi
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Notlar

- `openclaw capability ...`, `openclaw infer ...` için bir takma addır.

## İlgili

- [CLI referansı](/tr/cli)
- [Modeller](/tr/concepts/models)
