---
read_when:
    - Ses transkripsiyonunu veya medya işlemeyi değiştirme
summary: Gelen seslerin/sesli notların nasıl indirildiği, yazıya döküldüğü ve yanıtlara dahil edildiği
title: Ses ve sesli notlar
x-i18n:
    generated_at: "2026-05-06T09:20:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520620da5a643bb8e17318d7304ae4be3bd2586b0866614ad741685de5b8ef05
    source_path: nodes/audio.md
    workflow: 16
---

# Ses / Sesli Notlar (2026-01-17)

## Çalışanlar

- **Medya anlama (ses)**: Ses anlama etkinse (veya otomatik algılanırsa), OpenClaw:
  1. İlk ses ekini (yerel yol veya URL) bulur ve gerekirse indirir.
  2. Her model girdisine göndermeden önce `maxBytes` sınırını uygular.
  3. Sıradaki ilk uygun model girdisini çalıştırır (sağlayıcı veya CLI).
  4. Başarısız olursa ya da atlanırsa (boyut/zaman aşımı), sonraki girdiyi dener.
  5. Başarılı olduğunda, `Body` değerini bir `[Audio]` bloğuyla değiştirir ve `{{Transcript}}` değerini ayarlar.
- **Komut ayrıştırma**: Transkripsiyon başarılı olduğunda, eğik çizgi komutlarının çalışmaya devam etmesi için `CommandBody`/`RawBody` transkripte ayarlanır.
- **Ayrıntılı günlükleme**: `--verbose` içinde, transkripsiyon çalıştığında ve gövdeyi değiştirdiğinde günlükleriz.

## Otomatik algılama (varsayılan)

**Modelleri yapılandırmazsanız** ve `tools.media.audio.enabled` değeri `false` olarak ayarlanmamışsa,
OpenClaw bu sırayla otomatik algılar ve ilk çalışan seçenekte durur:

1. **Etkin yanıt modeli**, sağlayıcısı ses anlamayı desteklediğinde.
2. **Yerel CLI'lar** (kuruluysa)
   - `sherpa-onnx-offline` (encoder/decoder/joiner/tokens ile `SHERPA_ONNX_MODEL_DIR` gerektirir)
   - `whisper-cli` (`whisper-cpp` içinden; `WHISPER_CPP_MODEL` veya paketlenen tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
3. `read_many_files` kullanan **Gemini CLI** (`gemini`)
4. **Sağlayıcı kimlik doğrulaması**
   - Sesi destekleyen yapılandırılmış `models.providers.*` girdileri önce denenir
   - Paketlenen yedek sıra: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Otomatik algılamayı devre dışı bırakmak için `tools.media.audio.enabled: false` ayarlayın.
Özelleştirmek için `tools.media.audio.models` ayarlayın.
Not: İkili dosya algılama macOS/Linux/Windows genelinde en iyi çaba esasına göredir; CLI'ın `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yoluyla açık bir CLI modeli ayarlayın.

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

### Kapsam geçidiyle yalnızca sağlayıcı

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

### Transkripti sohbete yansıt (isteğe bağlı)

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
- `provider: "deepgram"` kullanıldığında Deepgram, `DEEPGRAM_API_KEY` değerini alır.
- Deepgram kurulum ayrıntıları: [Deepgram (ses transkripsiyonu)](/tr/providers/deepgram).
- Mistral kurulum ayrıntıları: [Mistral](/tr/providers/mistral).
- `provider: "senseaudio"` kullanıldığında SenseAudio, `SENSEAUDIO_API_KEY` değerini alır.
- SenseAudio kurulum ayrıntıları: [SenseAudio](/tr/providers/senseaudio).
- Ses sağlayıcıları `tools.media.audio` üzerinden `baseUrl`, `headers` ve `providerOptions` değerlerini geçersiz kılabilir.
- Varsayılan boyut sınırı 20MB'dir (`tools.media.audio.maxBytes`). Aşırı büyük ses o model için atlanır ve sonraki girdi denenir.
- 1024 baytın altındaki çok küçük/boş ses dosyaları sağlayıcı/CLI transkripsiyonundan önce atlanır.
- Ses için varsayılan `maxChars` **ayarlanmamıştır** (tam transkript). Çıkışı kırpmak için `tools.media.audio.maxChars` veya girdi başına `maxChars` ayarlayın.
- OpenAI otomatik varsayılanı `gpt-4o-mini-transcribe` değeridir; daha yüksek doğruluk için `model: "gpt-4o-transcribe"` ayarlayın.
- Birden fazla sesli notu işlemek için `tools.media.audio.attachments` kullanın (`mode: "all"` + `maxAttachments`).
- Transkript şablonlarda `{{Transcript}}` olarak kullanılabilir.
- `tools.media.audio.echoTranscript` varsayılan olarak kapalıdır; ajan işlemeden önce transkript onayını kaynak sohbete geri göndermek için etkinleştirin.
- `tools.media.audio.echoFormat` yansıtma metnini özelleştirir (yer tutucu: `{transcript}`).
- CLI stdout sınırlandırılır (5MB); CLI çıktısını öz tutun.
- CLI `args`, yerel ses dosyası yolu için `{{MediaPath}}` kullanmalıdır. Eski `audio.transcription.command` yapılandırmalarındaki kullanımdan kaldırılmış `{input}` yer tutucularını taşımak için `openclaw doctor --fix` çalıştırın.

### Proxy ortam desteği

Sağlayıcı tabanlı ses transkripsiyonu standart dışa giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Proxy ortam değişkeni ayarlanmamışsa doğrudan çıkış kullanılır. Proxy yapılandırması hatalı biçimlendirilmişse OpenClaw bir uyarı günlüğe yazar ve doğrudan getirmeye geri döner.

## Gruplarda bahsetme algılama

Bir grup sohbeti için `requireMention: true` ayarlandığında, OpenClaw artık bahsetmeleri kontrol etmeden **önce** sesi transkribe eder. Bu, bahsetme içerdiklerinde sesli notların işlenebilmesini sağlar.

**Nasıl çalışır:**

1. Bir sesli mesajın metin gövdesi yoksa ve grup bahsetme gerektiriyorsa, OpenClaw bir "preflight" transkripsiyonu yapar.
2. Transkript bahsetme kalıpları için kontrol edilir (ör. `@BotName`, emoji tetikleyicileri).
3. Bir bahsetme bulunursa mesaj tam yanıt işlem hattından geçer.
4. Transkript bahsetme algılama için kullanılır, böylece sesli notlar bahsetme geçidinden geçebilir.

**Yedek davranış:**

- Preflight sırasında transkripsiyon başarısız olursa (zaman aşımı, API hatası vb.), mesaj yalnızca metin tabanlı bahsetme algılamasına göre işlenir.
- Bu, karma mesajların (metin + ses) hiçbir zaman yanlışlıkla düşürülmemesini sağlar.

**Telegram grubu/konusu başına kapsam dışı bırakma:**

- O grup için preflight transkript bahsetme kontrollerini atlamak üzere `channels.telegram.groups.<chatId>.disableAudioPreflight: true` ayarlayın.
- Konu başına geçersiz kılmak için `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` ayarlayın (atlamak için `true`, zorla etkinleştirmek için `false`).
- Varsayılan `false` değeridir (bahsetme geçitli koşullar eşleştiğinde preflight etkindir).

**Örnek:** Bir kullanıcı, `requireMention: true` olan bir Telegram grubunda "Hey @Claude, what's the weather?" diyen bir sesli not gönderir. Sesli not transkribe edilir, bahsetme algılanır ve ajan yanıt verir.

## Dikkat edilmesi gerekenler

- Kapsam kuralları ilk eşleşen kazanır ilkesini kullanır. `chatType`, `direct`, `group` veya `room` olarak normalleştirilir.
- CLI'ınızın 0 ile çıktığından ve düz metin yazdırdığından emin olun; JSON'un `jq -r .text` üzerinden işlenmesi gerekir.
- `parakeet-mlx` için, `--output-dir` geçirirseniz, `--output-format` `txt` olduğunda (veya atlandığında) OpenClaw `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` olmayan çıktı biçimleri stdout ayrıştırmasına geri döner.
- Yanıt kuyruğunu engellememek için zaman aşımlarını makul tutun (`timeoutSeconds`, varsayılan 60s).
- Preflight transkripsiyonu, bahsetme algılama için yalnızca **ilk** ses ekini işler. Ek sesler ana medya anlama aşamasında işlenir.

## İlgili

- [Medya anlama](/tr/nodes/media-understanding)
- [Konuşma modu](/tr/nodes/talk)
- [Sesle uyandırma](/tr/nodes/voicewake)
