---
read_when:
    - Ses transkripsiyonunu veya medya işlemeyi değiştirme
summary: Gelen ses/sesli notların nasıl indirildiği, yazıya döküldüğü ve yanıtlara yerleştirildiği
title: Ses ve sesli notlar
x-i18n:
    generated_at: "2026-05-06T17:58:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: baa96453ce279d05933281eafe930e3573c5cbe694cec8704b1d064f4b0de242
    source_path: nodes/audio.md
    workflow: 16
---

## Çalışanlar

- **Medya anlama (ses)**: Ses anlama etkinleştirilmişse (veya otomatik algılanmışsa), OpenClaw:
  1. İlk ses ekini (yerel yol veya URL) bulur ve gerekirse indirir.
  2. Her model girdisine göndermeden önce `maxBytes` sınırını uygular.
  3. Sıradaki ilk uygun model girdisini çalıştırır (sağlayıcı veya CLI).
  4. Başarısız olursa veya atlanırsa (boyut/zaman aşımı), sonraki girdiyi dener.
  5. Başarılı olduğunda, `Body` değerini bir `[Audio]` bloğuyla değiştirir ve `{{Transcript}}` ayarlar.
- **Komut ayrıştırma**: Deşifre başarılı olduğunda, eğik çizgi komutlarının çalışmaya devam etmesi için `CommandBody`/`RawBody` deşifreye ayarlanır.
- **Ayrıntılı günlükleme**: `--verbose` modunda, deşifre çalıştığında ve gövdeyi değiştirdiğinde günlük kaydı tutarız.

## Otomatik algılama (varsayılan)

**Model yapılandırmazsanız** ve `tools.media.audio.enabled` **`false` olarak ayarlanmamışsa**,
OpenClaw bu sırayla otomatik algılama yapar ve çalışan ilk seçenekte durur:

1. Sağlayıcısı ses anlamayı desteklediğinde **etkin yanıt modeli**.
2. **Yerel CLI'lar** (kuruluysa)
   - `sherpa-onnx-offline` (encoder/decoder/joiner/tokens içeren `SHERPA_ONNX_MODEL_DIR` gerektirir)
   - `whisper-cli` (`whisper-cpp` üzerinden; `WHISPER_CPP_MODEL` veya paketle gelen tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
3. `read_many_files` kullanan **Gemini CLI** (`gemini`)
4. **Sağlayıcı kimlik doğrulaması**
   - Ses destekleyen yapılandırılmış `models.providers.*` girdileri önce denenir
   - Paketle gelen yedek sıra: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Otomatik algılamayı devre dışı bırakmak için `tools.media.audio.enabled: false` ayarlayın.
Özelleştirmek için `tools.media.audio.models` ayarlayın.
Not: İkili dosya algılama macOS/Linux/Windows genelinde en iyi çaba esasına dayanır; CLI'ın `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yoluyla açık bir CLI modeli ayarlayın.

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

### Deşifreyi sohbete yankıla (isteğe bağlı)

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
- Deepgram kurulum ayrıntıları: [Deepgram (ses deşifresi)](/tr/providers/deepgram).
- Mistral kurulum ayrıntıları: [Mistral](/tr/providers/mistral).
- `provider: "senseaudio"` kullanıldığında SenseAudio `SENSEAUDIO_API_KEY` değerini alır.
- SenseAudio kurulum ayrıntıları: [SenseAudio](/tr/providers/senseaudio).
- Ses sağlayıcıları `tools.media.audio` üzerinden `baseUrl`, `headers` ve `providerOptions` değerlerini geçersiz kılabilir.
- Varsayılan boyut sınırı 20MB'dir (`tools.media.audio.maxBytes`). Büyük boyutlu ses ilgili model için atlanır ve sonraki girdi denenir.
- 1024 baytın altındaki küçük/boş ses dosyaları sağlayıcı/CLI deşifresinden önce atlanır.
- Ses için varsayılan `maxChars` **ayarlanmamıştır** (tam deşifre). Çıktıyı kırpmak için `tools.media.audio.maxChars` veya girdi başına `maxChars` ayarlayın.
- OpenAI otomatik varsayılanı `gpt-4o-mini-transcribe`; daha yüksek doğruluk için `model: "gpt-4o-transcribe"` ayarlayın.
- Birden fazla sesli notu işlemek için `tools.media.audio.attachments` kullanın (`mode: "all"` + `maxAttachments`).
- Deşifre şablonlarda `{{Transcript}}` olarak kullanılabilir.
- `tools.media.audio.echoTranscript` varsayılan olarak kapalıdır; agent işlemesinden önce deşifre onayını kaynak sohbete geri göndermek için etkinleştirin.
- `tools.media.audio.echoFormat` yankı metnini özelleştirir (yer tutucu: `{transcript}`).
- CLI stdout sınırlandırılmıştır (5MB); CLI çıktısını kısa tutun.
- CLI `args`, yerel ses dosyası yolu için `{{MediaPath}}` kullanmalıdır. Eski `audio.transcription.command` yapılandırmalarındaki kullanımdan kaldırılmış `{input}` yer tutucularını taşımak için `openclaw doctor --fix` çalıştırın.

### Proxy ortam desteği

Sağlayıcı tabanlı ses deşifresi standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Hiç proxy ortam değişkeni ayarlanmamışsa doğrudan çıkış kullanılır. Proxy yapılandırması hatalıysa, OpenClaw bir uyarı günlüğe yazar ve doğrudan getirmeye geri döner.

## Gruplarda bahsetme algılama

Bir grup sohbeti için `requireMention: true` ayarlandığında, OpenClaw artık bahsetmeleri kontrol etmeden **önce** sesi deşifre eder. Bu, sesli notlar bahsetme içerdiğinde bile işlenmelerini sağlar.

**Nasıl çalışır:**

1. Bir sesli mesajın metin gövdesi yoksa ve grup bahsetme gerektiriyorsa, OpenClaw bir "ön kontrol" deşifresi gerçekleştirir.
2. Deşifre bahsetme kalıpları için kontrol edilir (ör. `@BotName`, emoji tetikleyicileri).
3. Bir bahsetme bulunursa, mesaj tam yanıt işlem hattından geçer.
4. Sesli notların bahsetme geçidinden geçebilmesi için deşifre bahsetme algılamasında kullanılır.

**Yedek davranış:**

- Ön kontrol sırasında deşifre başarısız olursa (zaman aşımı, API hatası vb.), mesaj yalnızca metin tabanlı bahsetme algılamasına göre işlenir.
- Bu, karma mesajların (metin + ses) hiçbir zaman yanlışlıkla düşürülmemesini sağlar.

**Telegram grubu/konusu başına vazgeçme:**

- Bu grup için ön kontrol deşifre bahsetme kontrollerini atlamak üzere `channels.telegram.groups.<chatId>.disableAudioPreflight: true` ayarlayın.
- Konu başına geçersiz kılmak için `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` ayarlayın (atlamak için `true`, zorla etkinleştirmek için `false`).
- Varsayılan `false` değeridir (bahsetme geçitli koşullar eşleştiğinde ön kontrol etkindir).

**Örnek:** Bir kullanıcı `requireMention: true` olan bir Telegram grubunda "Hey @Claude, what's the weather?" diyen bir sesli not gönderir. Sesli not deşifre edilir, bahsetme algılanır ve agent yanıt verir.

## Dikkat edilmesi gerekenler

- Kapsam kurallarında ilk eşleşme kazanır. `chatType`, `direct`, `group` veya `room` olarak normalize edilir.
- CLI'ınızın 0 ile çıktığından ve düz metin yazdırdığından emin olun; JSON'un `jq -r .text` ile düzenlenmesi gerekir.
- `parakeet-mlx` için, `--output-dir` geçirirseniz `--output-format` `txt` olduğunda (veya belirtilmediğinde) OpenClaw `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` olmayan çıktı biçimleri stdout ayrıştırmasına geri döner.
- Yanıt kuyruğunu engellememek için zaman aşımlarını makul tutun (`timeoutSeconds`, varsayılan 60 sn).
- Ön kontrol deşifresi, bahsetme algılaması için yalnızca **ilk** ses ekini işler. Ek sesler ana medya anlama aşamasında işlenir.

## İlgili

- [Medya anlama](/tr/nodes/media-understanding)
- [Konuşma modu](/tr/nodes/talk)
- [Sesle uyandırma](/tr/nodes/voicewake)
