---
read_when:
    - Ses transkripsiyonunu veya medya işlemeyi değiştirme
summary: Gelen seslerin/sesli notların nasıl indirildiği, yazıya döküldüğü ve yanıtlara eklendiği
title: Ses ve sesli notlar
x-i18n:
    generated_at: "2026-05-02T23:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91cd6951f80c6137061a7d4e82415b0872bc92c6d6ad136273a2e9ad7ec00ac1
    source_path: nodes/audio.md
    workflow: 16
---

# Ses / Sesli Notlar (2026-01-17)

## Çalışan özellikler

- **Medya anlama (ses)**: Ses anlama etkinleştirilmişse (veya otomatik algılanmışsa), OpenClaw:
  1. İlk ses ekini (yerel yol veya URL) bulur ve gerekirse indirir.
  2. Her model girdisine göndermeden önce `maxBytes` sınırını uygular.
  3. Sıradaki ilk uygun model girdisini çalıştırır (provider veya CLI).
  4. Başarısız olursa veya atlanırsa (boyut/zaman aşımı), sonraki girdiyi dener.
  5. Başarılı olduğunda, `Body` değerini bir `[Audio]` bloğuyla değiştirir ve `{{Transcript}}` değerini ayarlar.
- **Komut ayrıştırma**: Transkripsiyon başarılı olduğunda, eğik çizgi komutlarının çalışmaya devam etmesi için `CommandBody`/`RawBody` transkript olarak ayarlanır.
- **Ayrıntılı günlükleme**: `--verbose` modunda, transkripsiyonun ne zaman çalıştığını ve gövdeyi ne zaman değiştirdiğini günlüğe kaydederiz.
- **Kontrol arayüzü diktesi**: Sohbet oluşturucu, tarayıcıda kaydedilmiş bir mikrofon klibini `chat.transcribeAudio` öğesine gönderebilir. Bu Gateway RPC klibi geçici bir yerel dosyaya yazar, aynı ses transkripsiyonu işlem hattını çalıştırır, taslak metni tarayıcıya döndürür ve geçici dosyayı siler. Tek başına bir agent çalıştırması oluşturmaz.

## Otomatik algılama (varsayılan)

**Model yapılandırmazsanız** ve `tools.media.audio.enabled` değeri `false` olarak ayarlanmamışsa,
OpenClaw şu sırayla otomatik algılama yapar ve çalışan ilk seçenekte durur:

1. Provider'ı ses anlamayı desteklediğinde **etkin yanıt modeli**.
2. **Yerel CLI'lar** (kuruluysa)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` içinde encoder/decoder/joiner/tokens gerektirir)
   - `whisper-cli` (`whisper-cpp` içinden; `WHISPER_CPP_MODEL` veya paketlenmiş tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
3. `read_many_files` kullanan **Gemini CLI** (`gemini`)
4. **Provider kimlik doğrulaması**
   - Ses destekleyen yapılandırılmış `models.providers.*` girdileri önce denenir
   - Paketlenmiş yedek sıralama: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Otomatik algılamayı devre dışı bırakmak için `tools.media.audio.enabled: false` ayarlayın.
Özelleştirmek için `tools.media.audio.models` ayarlayın.
Not: İkili dosya algılama macOS/Linux/Windows genelinde en iyi çaba yaklaşımıyla yapılır; CLI'ın `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yoluyla açık bir CLI modeli ayarlayın.

## Yapılandırma örnekleri

### Provider + CLI yedeği (OpenAI + Whisper CLI)

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

### Kapsam geçidiyle yalnızca provider

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

### Yalnızca provider (Deepgram)

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

### Yalnızca provider (Mistral Voxtral)

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

### Yalnızca provider (SenseAudio)

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

### Transkripti sohbete yansıtma (isteğe bağlı)

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

- Provider kimlik doğrulaması standart model kimlik doğrulama sırasını izler (auth profilleri, env değişkenleri, `models.providers.*.apiKey`).
- Groq kurulum ayrıntıları: [Groq](/tr/providers/groq).
- `provider: "deepgram"` kullanıldığında Deepgram `DEEPGRAM_API_KEY` değerini alır.
- Deepgram kurulum ayrıntıları: [Deepgram (ses transkripsiyonu)](/tr/providers/deepgram).
- Mistral kurulum ayrıntıları: [Mistral](/tr/providers/mistral).
- `provider: "senseaudio"` kullanıldığında SenseAudio `SENSEAUDIO_API_KEY` değerini alır.
- SenseAudio kurulum ayrıntıları: [SenseAudio](/tr/providers/senseaudio).
- Ses provider'ları `tools.media.audio` üzerinden `baseUrl`, `headers` ve `providerOptions` değerlerini geçersiz kılabilir.
- Varsayılan boyut sınırı 20MB'dir (`tools.media.audio.maxBytes`). Aşırı büyük ses dosyası o model için atlanır ve sonraki girdi denenir.
- 1024 baytın altındaki çok küçük/boş ses dosyaları provider/CLI transkripsiyonundan önce atlanır.
- Ses için varsayılan `maxChars` **ayarlanmamıştır** (tam transkript). Çıktıyı kırpmak için `tools.media.audio.maxChars` veya girdi başına `maxChars` ayarlayın.
- OpenAI otomatik varsayılanı `gpt-4o-mini-transcribe`; daha yüksek doğruluk için `model: "gpt-4o-transcribe"` ayarlayın.
- Birden fazla sesli notu işlemek için `tools.media.audio.attachments` kullanın (`mode: "all"` + `maxAttachments`).
- Transkript, şablonlarda `{{Transcript}}` olarak kullanılabilir.
- `tools.media.audio.echoTranscript` varsayılan olarak kapalıdır; agent işleme başlamadan önce transkript onayını kaynak sohbete göndermek için etkinleştirin.
- `tools.media.audio.echoFormat` yansıtma metnini özelleştirir (yer tutucu: `{transcript}`).
- CLI stdout sınırlandırılmıştır (5MB); CLI çıktısını kısa tutun.
- CLI `args`, yerel ses dosyası yolu için `{{MediaPath}}` kullanmalıdır. Eski `audio.transcription.command` yapılandırmalarındaki kullanımdan kaldırılmış `{input}` yer tutucularını taşımak için `openclaw doctor --fix` çalıştırın.

### Proxy ortam desteği

Provider tabanlı ses transkripsiyonu standart giden proxy env değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Proxy env değişkeni ayarlanmamışsa doğrudan çıkış kullanılır. Proxy yapılandırması hatalı biçimlendirilmişse OpenClaw bir uyarı günlüğe kaydeder ve doğrudan fetch'e geri döner.

## Gruplarda bahsetme algılama

Bir grup sohbeti için `requireMention: true` ayarlandığında, OpenClaw artık bahsetmeleri denetlemeden **önce** sesi transkribe eder. Bu, sesli notların bahsetme içerdiklerinde bile işlenebilmesini sağlar.

**Nasıl çalışır:**

1. Bir sesli mesajın metin gövdesi yoksa ve grup bahsetme gerektiriyorsa OpenClaw bir "preflight" transkripsiyonu gerçekleştirir.
2. Transkript bahsetme desenleri için denetlenir (ör. `@BotName`, emoji tetikleyicileri).
3. Bir bahsetme bulunursa mesaj tam yanıt işlem hattından geçer.
4. Sesli notların bahsetme geçidini geçebilmesi için transkript bahsetme algılamasında kullanılır.

**Yedek davranış:**

- Preflight sırasında transkripsiyon başarısız olursa (zaman aşımı, API hatası vb.), mesaj yalnızca metin tabanlı bahsetme algılamasına göre işlenir.
- Bu, karma mesajların (metin + ses) hiçbir zaman yanlışlıkla düşürülmemesini sağlar.

**Telegram grubu/konusu başına devre dışı bırakma:**

- Bu grup için preflight transkript bahsetme denetimlerini atlamak üzere `channels.telegram.groups.<chatId>.disableAudioPreflight: true` ayarlayın.
- Konu başına geçersiz kılmak için `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` ayarlayın (`true` atlamak için, `false` zorla etkinleştirmek için).
- Varsayılan `false` değeridir (bahsetme geçitli koşullar eşleştiğinde preflight etkindir).

**Örnek:** Bir kullanıcı, `requireMention: true` ayarlı bir Telegram grubunda "Hey @Claude, what's the weather?" diyen bir sesli not gönderir. Sesli not transkribe edilir, bahsetme algılanır ve agent yanıt verir.

## Dikkat edilmesi gerekenler

- Kapsam kurallarında ilk eşleşme kazanır. `chatType`, `direct`, `group` veya `room` olarak normalleştirilir.
- CLI'ınızın 0 çıkış koduyla çıktığından ve düz metin yazdırdığından emin olun; JSON'un `jq -r .text` ile işlenmesi gerekir.
- `parakeet-mlx` için `--output-dir` geçirirseniz, `--output-format` `txt` olduğunda (veya atlandığında) OpenClaw `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` olmayan çıktı biçimleri stdout ayrıştırmaya geri döner.
- Yanıt kuyruğunu engellememek için zaman aşımlarını makul tutun (`timeoutSeconds`, varsayılan 60s).
- Preflight transkripsiyonu, bahsetme algılaması için yalnızca **ilk** ses ekini işler. Ek sesler ana medya anlama aşamasında işlenir.

## İlgili

- [Medya anlama](/tr/nodes/media-understanding)
- [Konuşma modu](/tr/nodes/talk)
- [Sesle uyandırma](/tr/nodes/voicewake)
