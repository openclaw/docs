---
read_when:
    - Ses transkripsiyonu veya medya işlemeyi değiştirme
summary: Gelen ses/sesli notların nasıl indirildiği, yazıya döküldüğü ve yanıtlara enjekte edildiği
title: Ses ve sesli notlar
x-i18n:
    generated_at: "2026-04-24T09:17:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# Ses / Sesli Notlar (2026-01-17)

## Ne çalışıyor

- **Medya anlama (ses)**: Ses anlama etkinse (veya otomatik algılandıysa), OpenClaw:
  1. İlk ses ekini bulur (yerel yol veya URL) ve gerekirse indirir.
  2. Her model girdisine göndermeden önce `maxBytes` sınırını uygular.
  3. Sırayla ilk uygun model girdisini çalıştırır (sağlayıcı veya CLI).
  4. Başarısız olur veya atlanırsa (boyut/zaman aşımı), sonraki girdiyi dener.
  5. Başarılı olursa `Body` değerini bir `[Audio]` bloğuyla değiştirir ve `{{Transcript}}` ayarlar.
- **Komut ayrıştırma**: Yazıya döküm başarılı olduğunda slash komutlarının yine çalışması için `CommandBody`/`RawBody` yazıya döküme ayarlanır.
- **Ayrıntılı günlükleme**: `--verbose` modunda, yazıya dökümün ne zaman çalıştığını ve gövdeyi ne zaman değiştirdiğini günlüğe kaydederiz.

## Otomatik algılama (varsayılan)

**Model yapılandırmazsanız** ve `tools.media.audio.enabled` **`false`** olarak ayarlanmamışsa,
OpenClaw şu sırayla otomatik algılar ve çalışan ilk seçenekte durur:

1. **Etkin yanıt modeli**, sağlayıcısı ses anlamayı destekliyorsa.
2. **Yerel CLI’ler** (kuruluysa)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` içinde encoder/decoder/joiner/tokens gerektirir)
   - `whisper-cli` (`whisper-cpp` içinden; `WHISPER_CPP_MODEL` veya paketlenmiş tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
3. `read_many_files` kullanan **Gemini CLI** (`gemini`)
4. **Sağlayıcı kimlik doğrulaması**
   - Sesi destekleyen yapılandırılmış `models.providers.*` girdileri önce denenir
   - Paketlenmiş geri dönüş sırası: OpenAI → Groq → Deepgram → Google → Mistral

Otomatik algılamayı devre dışı bırakmak için `tools.media.audio.enabled: false` ayarlayın.
Özelleştirmek için `tools.media.audio.models` ayarlayın.
Not: İkili dosya algılama macOS/Linux/Windows arasında en iyi çabayla yapılır; CLI’nin `PATH` üzerinde olduğundan emin olun (`~` genişletilir) veya tam komut yoluyla açık bir CLI modeli ayarlayın.

## Yapılandırma örnekleri

### Sağlayıcı + CLI geri dönüşü (OpenAI + Whisper CLI)

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

### Kapsam geçitlemeli yalnızca sağlayıcı

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

### Yazıya dökümü sohbete geri yansıt (katılımlı)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // varsayılan false
        echoFormat: '📝 "{transcript}"', // isteğe bağlı, {transcript} destekler
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
- Ses sağlayıcıları `baseUrl`, `headers` ve `providerOptions` değerlerini `tools.media.audio` aracılığıyla geçersiz kılabilir.
- Varsayılan boyut üst sınırı 20MB’dir (`tools.media.audio.maxBytes`). Aşırı büyük ses o model için atlanır ve sonraki girdi denenir.
- 1024 baytın altındaki çok küçük/boş ses dosyaları sağlayıcı/CLI transkripsiyonundan önce atlanır.
- Ses için varsayılan `maxChars` **ayarlanmamıştır** (tam yazıya döküm). Çıktıyı kırpmak için `tools.media.audio.maxChars` veya girdi başına `maxChars` ayarlayın.
- OpenAI otomatik varsayılanı `gpt-4o-mini-transcribe`’dır; daha yüksek doğruluk için `model: "gpt-4o-transcribe"` ayarlayın.
- Birden çok sesli notu işlemek için `tools.media.audio.attachments` kullanın (`mode: "all"` + `maxAttachments`).
- Yazıya döküm şablonlarda `{{Transcript}}` olarak kullanılabilir.
- `tools.media.audio.echoTranscript` varsayılan olarak kapalıdır; aracı işleme başlamadan önce yazıya döküm onayını özgün sohbete geri göndermek için bunu etkinleştirin.
- `tools.media.audio.echoFormat`, yankı metnini özelleştirir (yer tutucu: `{transcript}`).
- CLI stdout 5MB ile sınırlıdır; CLI çıktısını kısa tutun.

### Proxy ortamı desteği

Sağlayıcı tabanlı ses transkripsiyonu standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Proxy ortam değişkenleri ayarlanmamışsa doğrudan çıkış kullanılır. Proxy yapılandırması bozuksa OpenClaw bir uyarı günlüğe kaydeder ve doğrudan getirmeye geri düşer.

## Gruplarda bahsetme algılama

Bir grup sohbeti için `requireMention: true` ayarlandığında OpenClaw artık bahsetmeleri denetlemeden **önce** sesi yazıya döker. Bu, sesli notların bahsetme içerdiklerinde işlenmesine olanak tanır.

**Nasıl çalışır:**

1. Bir sesli mesajın metin gövdesi yoksa ve grup bahsetme gerektiriyorsa OpenClaw bir “preflight” yazıya dökümü gerçekleştirir.
2. Yazıya döküm bahsetme desenleri için kontrol edilir (ör. `@BotName`, emoji tetikleyicileri).
3. Bir bahsetme bulunursa mesaj tam yanıt işlem hattı boyunca devam eder.
4. Sesli notların bahsetme geçidini geçebilmesi için bahsetme algılamada yazıya döküm kullanılır.

**Geri dönüş davranışı:**

- Preflight sırasında yazıya döküm başarısız olursa (zaman aşımı, API hatası vb.), mesaj yalnızca metin tabanlı bahsetme algılamasına göre işlenir.
- Bu, karma mesajların (metin + ses) asla yanlışlıkla düşürülmemesini sağlar.

**Telegram grup/konu başına devre dışı bırakma:**

- O grup için preflight transkript bahsetme denetimlerini atlamak üzere `channels.telegram.groups.<chatId>.disableAudioPreflight: true` ayarlayın.
- Konu başına geçersiz kılmak için `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` ayarlayın (`true` atlar, `false` zorla etkinleştirir).
- Varsayılan `false`’tur (bahsetme geçitlemeli koşullar eşleştiğinde preflight etkindir).

**Örnek:** Bir kullanıcı `requireMention: true` olan bir Telegram grubunda “Hey @Claude, hava nasıl?” diyen bir sesli not gönderir. Sesli not yazıya dökülür, bahsetme algılanır ve aracı yanıt verir.

## Dikkat edilmesi gerekenler

- Kapsam kuralları ilk eşleşme kazanır mantığını kullanır. `chatType`, `direct`, `group` veya `room` olarak normalleştirilir.
- CLI’nin 0 ile çıktığından ve düz metin yazdırdığından emin olun; JSON’nin `jq -r .text` aracılığıyla işlenmesi gerekir.
- `parakeet-mlx` için `--output-dir` geçerseniz OpenClaw, `--output-format` `txt` olduğunda (veya çıkarıldığında) `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` dışındaki çıktı biçimleri stdout ayrıştırmasına geri düşer.
- Yanıt kuyruğunu engellememek için zaman aşımlarını makul tutun (`timeoutSeconds`, varsayılan 60 sn).
- Preflight transkripsiyonu bahsetme algılama için yalnızca **ilk** ses ekini işler. Ek sesler ana medya anlama aşamasında işlenir.

## İlgili

- [Medya anlama](/tr/nodes/media-understanding)
- [Konuşma modu](/tr/nodes/talk)
- [Sesle uyandırma](/tr/nodes/voicewake)
