---
read_when:
    - Ses dökümü veya medya işlemeyi değiştirme
summary: Gelen ses/sesli notların nasıl indirildiği, döküldüğü ve yanıtlara nasıl eklendiği
title: Ses ve Sesli Notlar
x-i18n:
    generated_at: "2026-04-05T13:58:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd464df24268b1104c9bbdb6f424ba90747342b4c0f4d2e39d95055708cbd0ae
    source_path: nodes/audio.md
    workflow: 15
---

# Ses / Sesli Notlar (2026-01-17)

## Çalışanlar

- **Medya anlama (ses)**: Ses anlama etkinse (veya otomatik algılanıyorsa), OpenClaw:
  1. İlk ses ekini bulur (yerel yol veya URL) ve gerekirse indirir.
  2. Her model girdisine göndermeden önce `maxBytes` sınırını uygular.
  3. Sırayla ilk uygun model girdisini çalıştırır (sağlayıcı veya CLI).
  4. Başarısız olursa veya atlanırsa (boyut/zaman aşımı), bir sonraki girdiyi dener.
  5. Başarılı olursa `Body` değerini bir `[Audio]` bloğuyla değiştirir ve `{{Transcript}}` ayarlar.
- **Komut ayrıştırma**: Döküm başarılı olduğunda, slash komutlarının çalışmaya devam etmesi için `CommandBody`/`RawBody` döküm metnine ayarlanır.
- **Ayrıntılı günlükleme**: `--verbose` modunda döküm çalıştığında ve gövdeyi değiştirdiğinde günlük yazarız.

## Otomatik algılama (varsayılan)

**Model yapılandırmazsanız** ve `tools.media.audio.enabled` değeri **`false` olarak ayarlanmamışsa**,
OpenClaw şu sırayla otomatik algılama yapar ve çalışan ilk seçenekte durur:

1. Sağlayıcısı ses anlamayı destekliyorsa **etkin yanıt modeli**.
2. **Yerel CLI'lar** (kuruluysa)
   - `sherpa-onnx-offline` (`SHERPA_ONNX_MODEL_DIR` içinde encoder/decoder/joiner/tokens gerektirir)
   - `whisper-cli` (`whisper-cpp` içinden; `WHISPER_CPP_MODEL` veya paketlenmiş tiny modeli kullanır)
   - `whisper` (Python CLI; modelleri otomatik indirir)
3. `read_many_files` kullanan **Gemini CLI** (`gemini`)
4. **Sağlayıcı auth**
   - Sesi destekleyen yapılandırılmış `models.providers.*` girdileri önce denenir
   - Paketlenmiş fallback sırası: OpenAI → Groq → Deepgram → Google → Mistral

Otomatik algılamayı devre dışı bırakmak için `tools.media.audio.enabled: false` ayarlayın.
Özelleştirmek için `tools.media.audio.models` ayarlayın.
Not: İkili algılama macOS/Linux/Windows genelinde best-effort şeklindedir; CLI'nin `PATH` içinde olduğundan emin olun (`~` genişletilir) veya tam komut yoluna sahip açık bir CLI modeli ayarlayın.

## Yapılandırma örnekleri

### Sağlayıcı + CLI fallback (OpenAI + Whisper CLI)

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

### Dökümü sohbete yansıt (isteğe bağlı)

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

- Sağlayıcı auth'u standart model auth sırasını izler (auth profilleri, env değişkenleri, `models.providers.*.apiKey`).
- Groq kurulum ayrıntıları: [Groq](/providers/groq).
- `provider: "deepgram"` kullanıldığında Deepgram `DEEPGRAM_API_KEY` değerini alır.
- Deepgram kurulum ayrıntıları: [Deepgram (ses dökümü)](/providers/deepgram).
- Mistral kurulum ayrıntıları: [Mistral](/providers/mistral).
- Ses sağlayıcıları `tools.media.audio` üzerinden `baseUrl`, `headers` ve `providerOptions` değerlerini geçersiz kılabilir.
- Varsayılan boyut sınırı 20MB'dir (`tools.media.audio.maxBytes`). Büyük boyutlu ses bu model için atlanır ve sonraki girdi denenir.
- 1024 bayttan küçük çok küçük/boş ses dosyaları sağlayıcı/CLI dökümünden önce atlanır.
- Ses için varsayılan `maxChars` **ayarsızdır** (tam döküm). Çıktıyı kırpmak için `tools.media.audio.maxChars` veya girdi başına `maxChars` ayarlayın.
- OpenAI otomatik varsayılanı `gpt-4o-mini-transcribe` şeklindedir; daha yüksek doğruluk için `model: "gpt-4o-transcribe"` ayarlayın.
- Birden fazla sesli notu işlemek için `tools.media.audio.attachments` kullanın (`mode: "all"` + `maxAttachments`).
- Döküm şablonlara `{{Transcript}}` olarak sunulur.
- `tools.media.audio.echoTranscript` varsayılan olarak kapalıdır; döküm onayını ajan işlemeden önce kaynak sohbete geri göndermek için bunu etkinleştirin.
- `tools.media.audio.echoFormat`, yansıtılan metni özelleştirir (yer tutucu: `{transcript}`).
- CLI stdout sınırı 5MB'dir; CLI çıktısını kısa tutun.

### Proxy ortam desteği

Sağlayıcı tabanlı ses dökümü standart giden proxy env değişkenlerini dikkate alır:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Hiç proxy env değişkeni ayarlı değilse doğrudan çıkış kullanılır. Proxy yapılandırması hatalı biçimlendirilmişse OpenClaw bir uyarı günlüğe yazar ve doğrudan fetch'e geri döner.

## Gruplarda mention algılama

Bir grup sohbeti için `requireMention: true` ayarlandığında OpenClaw artık mention kontrolü yapmadan **önce** sesi döküyor. Bu, mention içerdiğinde sesli notların da işlenmesini sağlar.

**Nasıl çalışır:**

1. Bir sesli mesajın metin gövdesi yoksa ve grup mention gerektiriyorsa OpenClaw bir “preflight” dökümü yapar.
2. Döküm, mention desenleri açısından denetlenir (ör. `@BotName`, emoji tetikleyicileri).
3. Bir mention bulunursa mesaj tam yanıt işlem hattısına devam eder.
4. Döküm mention algılama için kullanılır; böylece sesli notlar mention geçidini aşabilir.

**Fallback davranışı:**

- Preflight sırasında döküm başarısız olursa (zaman aşımı, API hatası vb.), mesaj yalnızca metin tabanlı mention algılamasına göre işlenir.
- Bu, karma mesajların (metin + ses) hiçbir zaman yanlışlıkla düşürülmemesini sağlar.

**Telegram grup/konu başına devre dışı bırakma:**

- O grup için preflight döküm mention denetimlerini atlamak üzere `channels.telegram.groups.<chatId>.disableAudioPreflight: true` ayarlayın.
- Konu başına geçersiz kılmak için `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` ayarlayın (`true` atlar, `false` zorla etkinleştirir).
- Varsayılan `false`'dur (mention geçitli koşullar eşleştiğinde preflight etkindir).

**Örnek:** Bir kullanıcı `requireMention: true` ayarlı bir Telegram grubunda "Hey @Claude, hava nasıl?" diyen bir sesli not gönderir. Sesli not dökülür, mention algılanır ve ajan yanıt verir.

## Dikkat edilmesi gerekenler

- Kapsam kuralları ilk eşleşme kazanır mantığıyla çalışır. `chatType`, `direct`, `group` veya `room` olarak normalize edilir.
- CLI'nizin 0 ile çıktığından ve düz metin yazdırdığından emin olun; JSON çıktısı `jq -r .text` ile işlenmelidir.
- `parakeet-mlx` için `--output-dir` geçirirseniz OpenClaw, `--output-format` `txt` olduğunda (veya atlandığında) `<output-dir>/<media-basename>.txt` dosyasını okur; `txt` dışındaki çıktı biçimleri stdout ayrıştırmasına geri döner.
- Yanıt kuyruğunu engellememek için zaman aşımlarını makul tutun (`timeoutSeconds`, varsayılan 60 sn).
- Preflight dökümü mention algılama için yalnızca **ilk** ses ekini işler. Ek sesler ana medya anlama aşamasında işlenir.
