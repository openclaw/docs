---
read_when:
    - Ses transkripsiyonunu veya medya işlemeyi değiştirme
summary: Gelen ses/sesli notların indirilmesi, metne dökülmesi ve yanıtlara eklenmesi
title: Ses ve sesli notlar
x-i18n:
    generated_at: "2026-06-28T00:45:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90e66cf76537b090afdcd3a7791b40107ae51d6be89c84fcb14c034e38df875e
    source_path: nodes/audio.md
    workflow: 16
---

## Neler çalışır

- **Medya anlama (ses)**: Ses anlama etkinleştirilmişse (veya otomatik algılanmışsa), OpenClaw:
  1. İlk ses ekini (yerel yol veya URL) bulur ve gerekirse indirir.
  2. Her model girdisine göndermeden önce `maxBytes` sınırını uygular.
  3. Sıradaki ilk uygun model girdisini çalıştırır (sağlayıcı veya CLI).
  4. Başarısız olursa veya atlanırsa (boyut/zaman aşımı), sonraki girdiyi dener.
  5. Başarılı olduğunda, `Body` değerini bir `[Audio]` bloğuyla değiştirir ve `{{Transcript}}` değerini ayarlar.
- **Komut ayrıştırma**: Transkripsiyon başarılı olduğunda, eğik çizgi komutlarının çalışmaya devam etmesi için `CommandBody`/`RawBody` transkripte ayarlanır.
- **Ayrıntılı günlükleme**: `--verbose` kullanıldığında, transkripsiyon çalıştığında ve gövdeyi değiştirdiğinde günlük kaydı yaparız.

## Otomatik algılama (varsayılan)

**Model yapılandırmazsanız** ve `tools.media.audio.enabled` değeri `false` olarak ayarlanmamışsa,
OpenClaw aşağıdaki sırayla otomatik algılama yapar ve ilk çalışan seçenekte durur:

1. Sağlayıcısı ses anlamayı desteklediğinde **etkin yanıt modeli**.
2. **Yerel CLI'ler** (kuruluysa)
   - `sherpa-onnx-offline` (encoder/decoder/joiner/tokens içeren `SHERPA_ONNX_MODEL_DIR` gerektirir)
   - `whisper-cli` (`whisper-cpp` içinden; `WHISPER_CPP_MODEL` veya birlikte gelen tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
3. **Sağlayıcı kimlik doğrulaması**
   - Önce sesi destekleyen yapılandırılmış `models.providers.*` girdileri denenir
   - Sağlayıcı yedek sırası: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

2026-05-22 itibarıyla, medya anlama için Gemini CLI otomatik algılaması artık desteklenmemektedir. Google, Gemini CLI kullanıcılarını Antigravity CLI'ye geçiriyor; ses için yerel veya sağlayıcı transkripsiyonu kullanılmalı, görüntü/video CLI yedeği ise Antigravity CLI'ye (`agy`) taşınmalıdır.

Otomatik algılamayı devre dışı bırakmak için `tools.media.audio.enabled: false` ayarlayın.
Özelleştirmek için `tools.media.audio.models` ayarlayın.
Not: İkili dosya algılama macOS/Linux/Windows genelinde en iyi çaba esasına dayanır; CLI'nin `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yolu olan açık bir CLI modeli ayarlayın.

## Yapılandırma örnekleri

### Sağlayıcı + CLI yedeği (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Kapsam denetimiyle yalnızca sağlayıcı

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Yalnızca sağlayıcı (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Yalnızca sağlayıcı (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Yalnızca sağlayıcı (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Transkripti sohbete geri gönderme (isteğe bağlı)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Notlar ve sınırlar

- Sağlayıcı kimlik doğrulaması standart model kimlik doğrulama sırasını izler (kimlik doğrulama profilleri, ortam değişkenleri, `models.providers.*.apiKey`).
- Groq kurulum ayrıntıları: [Groq](/tr/providers/groq).
- `provider: "deepgram"` kullanıldığında Deepgram `DEEPGRAM_API_KEY` değerini alır.
- Deepgram kurulum ayrıntıları: [Deepgram (ses transkripsiyonu)](/tr/providers/deepgram).
- Mistral kurulum ayrıntıları: [Mistral](/tr/providers/mistral).
- `provider: "senseaudio"` kullanıldığında SenseAudio `SENSEAUDIO_API_KEY` değerini alır.
- SenseAudio kurulum ayrıntıları: [SenseAudio](/tr/providers/senseaudio).
- Ses sağlayıcıları `tools.media.audio` üzerinden `baseUrl`, `headers` ve `providerOptions` değerlerini geçersiz kılabilir.
- Varsayılan boyut sınırı 20 MB'dir (`tools.media.audio.maxBytes`). Fazla büyük ses, o model için atlanır ve sonraki girdi denenir.
- 1024 baytın altındaki küçük/boş ses dosyaları, sağlayıcı/CLI transkripsiyonundan önce atlanır.
- Ses için varsayılan `maxChars` **ayarlanmamıştır** (tam transkript). Çıktıyı kırpmak için `tools.media.audio.maxChars` veya girdi başına `maxChars` ayarlayın.
- OpenAI otomatik varsayılanı `gpt-4o-mini-transcribe` değeridir; daha yüksek doğruluk için `model: "gpt-4o-transcribe"` ayarlayın.
- Birden fazla sesli notu işlemek için `tools.media.audio.attachments` kullanın (`mode: "all"` + `maxAttachments`).
- Transkript şablonlarda `{{Transcript}}` olarak kullanılabilir.
- `tools.media.audio.echoTranscript` varsayılan olarak kapalıdır; aracı işlemeden önce transkript onayını kaynak sohbete geri göndermek için etkinleştirin.
- `tools.media.audio.echoFormat` geri gönderilen metni özelleştirir (yer tutucu: `{transcript}`).
- CLI stdout sınırlandırılmıştır (5 MB); CLI çıktısını kısa tutun.
- CLI `args`, yerel ses dosyası yolu için `{{MediaPath}}` kullanmalıdır. Eski `audio.transcription.command` yapılandırmalarındaki kullanımdan kaldırılmış `{input}` yer tutucularını geçirmek için `openclaw doctor --fix` çalıştırın.

### Proxy ortam desteği

Sağlayıcı tabanlı ses transkripsiyonu standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Hiçbir proxy ortam değişkeni ayarlanmamışsa doğrudan çıkış kullanılır. Proxy yapılandırması hatalı biçimlendirilmişse OpenClaw bir uyarı günlüğe yazar ve doğrudan fetch'e geri döner.

## Gruplarda bahsetme algılama

Bir grup sohbeti için `requireMention: true` ayarlandığında, OpenClaw artık bahsetmeleri denetlemeden **önce** sesi transkribe eder. Bu, sesli notlar bahsetme içerdiğinde bile işlenmelerini sağlar.

**Nasıl çalışır:**

1. Bir sesli mesajın metin gövdesi yoksa ve grup bahsetme gerektiriyorsa, OpenClaw bir "ön denetim" transkripsiyonu gerçekleştirir.
2. Transkript bahsetme kalıpları için denetlenir (ör. `@BotName`, emoji tetikleyicileri).
3. Bir bahsetme bulunursa, mesaj tam yanıt işlem hattından geçer.
4. Transkript, sesli notların bahsetme koşulunu geçebilmesi için bahsetme algılamada kullanılır.

**Yedek davranış:**

- Ön denetim sırasında transkripsiyon başarısız olursa (zaman aşımı, API hatası vb.), mesaj yalnızca metne dayalı bahsetme algılamasına göre işlenir.
- Bu, karma mesajların (metin + ses) asla yanlışlıkla düşürülmemesini sağlar.

**Telegram grubu/konusu başına kapsam dışı bırakma:**

- O grup için ön denetim transkript bahsetme denetimlerini atlamak üzere `channels.telegram.groups.<chatId>.disableAudioPreflight: true` ayarlayın.
- Konu başına geçersiz kılmak için `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` ayarlayın (atlamak için `true`, zorla etkinleştirmek için `false`).
- Varsayılan `false` değeridir (bahsetme koşullu durumlar eşleştiğinde ön denetim etkindir).

**Örnek:** Bir kullanıcı, `requireMention: true` olan bir Telegram grubunda "Hey @Claude, what's the weather?" diyen bir sesli not gönderir. Sesli not transkribe edilir, bahsetme algılanır ve aracı yanıt verir.

## Dikkat edilmesi gerekenler

- Kapsam kuralları ilk eşleşme kazanır mantığını kullanır. `chatType`, `direct`, `group` veya `room` olarak normalize edilir.
- CLI'nizin 0 ile çıktığından ve düz metin yazdırdığından emin olun; JSON'un `jq -r .text` ile düzenlenmesi gerekir.
- `parakeet-mlx` için `--output-dir` geçirirseniz, `--output-format` değeri `txt` olduğunda (veya atlandığında) OpenClaw `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` dışı çıktı biçimleri stdout ayrıştırmasına geri döner.
- Yanıt kuyruğunu engellememek için zaman aşımlarını makul tutun (`timeoutSeconds`, varsayılan 60 sn).
- Ön denetim transkripsiyonu, bahsetme algılama için yalnızca **ilk** ses ekini işler. Ek sesler ana medya anlama aşamasında işlenir.

## İlgili

- [Medya anlama](/tr/nodes/media-understanding)
- [Konuşma modu](/tr/nodes/talk)
- [Sesle uyandırma](/tr/nodes/voicewake)
