---
read_when:
    - Ses transkripsiyonunu veya medya işlemeyi değiştirme
summary: Gelen sesli mesajların/ses notlarının nasıl indirildiği, yazıya döküldüğü ve yanıtlara eklendiği
title: Ses ve sesli notlar
x-i18n:
    generated_at: "2026-07-12T12:26:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## Ne işe yarar

Ses anlama etkinleştirildiğinde (veya otomatik algılandığında) OpenClaw:

1. İlk ses ekini (yerel yol veya URL) bulur ve gerekirse indirir.
2. Her model girdisine göndermeden önce `maxBytes` sınırını uygular.
3. Uygun ilk model girdisini sırayla çalıştırır (sağlayıcı veya CLI); bir girdi başarısız olursa ya da atlanırsa (boyut/zaman aşımı), sonraki girdi denenir.
4. Başarı durumunda `Body` değerini bir `[Ses]` bloğuyla değiştirir ve `{{Transcript}}` değerini ayarlar.

Döküm başarıyla oluşturulduğunda, eğik çizgi komutlarının çalışmaya devam etmesi için `CommandBody`/`RawBody` değerleri de döküme ayarlanır. `--verbose` kullanıldığında günlükler, dökümün ne zaman çalıştığını ve gövdenin ne zaman değiştirildiğini gösterir.

## Otomatik algılama (varsayılan)

Modelleri yapılandırmadıysanız ve `tools.media.audio.enabled` değeri `false` değilse OpenClaw, aşağıdaki sırayla otomatik algılama yapar ve çalışan ilk seçenekte durur:

1. Sağlayıcısı ses anlamayı desteklediğinde **etkin yanıt modeli**.
2. **Yapılandırılmış sağlayıcı kimlik doğrulaması** — ses dökümünü destekleyen bir sağlayıcı için kimlik doğrulaması bulunan herhangi bir `models.providers.*` girdisi. Bu denetim yerel CLI'lerden önce yapılır; dolayısıyla yapılandırılmış bir API anahtarı, `PATH` üzerindeki yerel ikili dosyaya her zaman üstün gelir.
   Birden fazla sağlayıcı yapılandırıldığında öncelik sırası: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **Yerel CLI'ler** (yalnızca sağlayıcı kimlik doğrulaması çözümlenmediyse). OpenClaw sıralı bir geri dönüş listesi oluşturur:
   - Yalnızca mevcut süreçteki daha önceki bir model çağrısı Metal veya CUDA gözlemlediyse CPU varsayılanlarından önce `whisper-cli`
   - Varsayılan CPU sağlayıcısında `sherpa-onnx-offline` (`tokens.txt`, `encoder.onnx`, `decoder.onnx` ve `joiner.onnx` içeren `SHERPA_ONNX_MODEL_DIR` gerektirir)
   - Metal/CUDA yalnızca derleme açısından destekleniyorsa veya seçilen arka uç başka bir şekilde gözlemlenmemişse `whisper-cli`
   - Apple Silicon üzerinde `parakeet-mlx` (MLX desteklidir; cihaz kullanımı gözlemlenmemiş olarak kalır)
   - `whisper` (Python CLI; modelleri otomatik olarak indirir)

Kurulum/bağlantı kaynağı, çalıştırma kanıtı değil yetenek kanıtıdır. Tek başına hiçbir zaman bir adayı CPU sherpa'nın önüne taşımaz. OpenClaw, yalnızca bir arka ucu yoklamak için kurulum veya durum denetimleri sırasında model yüklemez.
Otomatik algılanan whisper.cpp, OpenClaw'ın üst kaynaktaki `using … backend` satırını kaydedebilmesi için normal model çalıştırma günlüklerini etkin tutar. Açık CLI girdileri, yapılandırılmış çıktı bayraklarını korur.

Medya anlama için Gemini CLI otomatik algılamasının yerini, görüntü/video için korumalı alanda çalışan Antigravity CLI (`agy`) geri dönüşü almıştır; ses, yukarıdaki yerel ikili dosyaların ötesinde bir CLI geri dönüşü kullanmaz.

Otomatik algılamayı devre dışı bırakmak için `tools.media.audio.enabled: false` ayarını yapın. Özelleştirmek için `tools.media.audio.models` ayarını yapın.

<Note>
İkili dosya algılama macOS/Linux/Windows genelinde mümkün olan en iyi çabayla gerçekleştirilir. CLI'nin `PATH` üzerinde olduğundan (`~` genişletilir) emin olun veya tam komut yoluyla açık bir CLI modeli ayarlayın.
</Note>

Ses dökümü oluşturmadan yerel seçimi inceleyin:

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Sağlayıcı envanteri, yerel geri dönüş kazananını genel sağlayıcı seçiminden ayrı olarak ve desteklenen, istenen ve gözlemlenen arka uç alanlarıyla birlikte bildirir. Döküm çalıştıktan sonra `/status`, medya satırında istenen veya gözlemlenen arka ucu bildirir. Açık `tools.media.audio.models` CLI girdileri otomatik seçimi yine atlar; sherpa için `--provider=cuda` veya whisper.cpp için `--no-gpu`/`--device` gibi arka uca özgü bayraklarını kullanın.

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
          { provider: "openai", model: "gpt-4o-transcribe" },
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
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
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

### Dökümü sohbete geri gönderme (isteğe bağlı)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // varsayılan değer false
        echoFormat: '📝 "{transcript}"', // isteğe bağlı, {transcript} destekler
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Notlar ve sınırlar

- Sağlayıcı kimlik doğrulaması, standart model kimlik doğrulama sırasını izler (kimlik doğrulama profilleri, ortam değişkenleri, `models.providers.*.apiKey`).
- Groq kurulum ayrıntıları: [Groq](/tr/providers/groq).
- `provider: "deepgram"` kullanıldığında Deepgram, `DEEPGRAM_API_KEY` değerini alır. Kurulum ayrıntıları: [Deepgram](/tr/providers/deepgram).
- Mistral kurulum ayrıntıları: [Mistral](/tr/providers/mistral).
- `provider: "senseaudio"` kullanıldığında SenseAudio, `SENSEAUDIO_API_KEY` değerini alır. Kurulum ayrıntıları: [SenseAudio](/tr/providers/senseaudio).
- Ses sağlayıcıları, `tools.media.audio` aracılığıyla `baseUrl`, `headers` ve `providerOptions` değerlerini geçersiz kılabilir.
- Varsayılan boyut sınırı 20 MB'dir (`tools.media.audio.maxBytes`). Sınırı aşan ses, ilgili model için atlanır ve sonraki girdi denenir.
- 1024 bayttan küçük ses dosyaları, sağlayıcı/CLI dökümünden önce atlanır.
- Ses için varsayılan `maxChars` değeri **ayarlanmamıştır** (tam döküm). Çıktıyı kırpmak için `tools.media.audio.maxChars` veya girdi başına bir `maxChars` ayarlayın.
- OpenAI otomatik algılama varsayılanı `gpt-4o-transcribe` modelidir; daha ucuz/hızlı bir seçenek için `model: "gpt-4o-mini-transcribe"` ayarını yapın.
- Birden fazla sesli notu işlemek için `tools.media.audio.attachments` kullanın (`mode: "all"` ve `maxAttachments`; varsayılan 1).
- Döküm, şablonlarda `{{Transcript}}` olarak kullanılabilir.
- `tools.media.audio.echoTranscript` varsayılan olarak kapalıdır; ajan işlemesinden önce kaynak sohbete bir döküm onayı göndermek için etkinleştirin.
- `tools.media.audio.echoFormat`, geri gönderilen metni özelleştirir (yer tutucu: `{transcript}`; varsayılan `📝 "{transcript}"`).
- CLI standart çıktısı 5 MB ile sınırlıdır; CLI çıktısını kısa tutun.
- CLI `args`, yerel ses dosyası yolu için `{{MediaPath}}` kullanmalıdır. Eski `audio.transcription.command` yapılandırmalarındaki kullanım dışı `{input}` yer tutucularını taşımak için `openclaw doctor --fix` çalıştırın (kullanımdan kaldırılmış anahtar: `audio.transcription`; yerine `tools.media.audio.models` getirilmiştir).
- `tools.media.concurrency`, medya görevlerini sınırlar; bir GPU zamanlayıcısı değildir.

### Kalıcı yerel STT

Otomatik algılanan yerel STT, istek başına süreç şeklinde çalışmaya devam eder. OpenClaw şu anda kalıcı bir whisper.cpp sunucusunu yönetmez; çünkü standart Homebrew `whisper-cpp` paketi bu sunucuyu devre dışı bırakırken üst kaynak örneğinde yapılandırılmış, sınırlı bir kabul kuyruğu yoktur. Plugin tarafından yönetilen kalıcı bir yaşam döngüsünün güvenle etkinleştirilebilmesi için sağlık/başlangıç denetimi, modelin bellekte tutulması, sınırlı kuyruklama, iptal/zaman aşımı, yalnızca local loopback üzerinden kimlik doğrulamasız çalışma ve bulut geri dönüşü olmayan, bakımı sürdürülen paketlenmiş bir çalışan gerekir.

### Proxy ortamı desteği

Sağlayıcı tabanlı ses dökümü, undici'nin `EnvHttpProxyAgent` semantiğine uygun olarak standart giden proxy ortam değişkenlerini dikkate alır:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Küçük harfli değişkenler büyük harflilere göre önceliklidir; `NO_PROXY`/`no_proxy` girdileri (ana makine adları, `*.suffix` veya `host:port`) proxy'yi atlar. Hiçbir proxy ortam değişkeni ayarlanmamışsa doğrudan çıkış kullanılır. Proxy kurulumu başarısız olursa (hatalı biçimlendirilmiş URL), OpenClaw bir uyarı günlüğe kaydeder ve doğrudan getirmeye geri döner.

## Gruplarda bahsetme algılama

Ses ön denetimini destekleyen kanallarda, bir grup sohbeti için `requireMention: true` ayarlandığında OpenClaw, bahsetmeleri denetlemeden **önce** sesin dökümünü oluşturur. Bu sayede altyazısız bir sesli not, dökümü yapılandırılmış bir bahsetme kalıbı içerdiğinde bahsetme geçidini aşabilir. Kanala özgü belgeler, bunun yerine yazılı bir bahsetme gerektiren aktarımları açıklar.

**Nasıl çalışır:**

1. Bir sesli mesajın metin gövdesi yoksa ve grup bahsetmeleri gerektiriyorsa OpenClaw, ilk ses eki için ön denetim dökümü gerçekleştirir.
2. Döküm, bahsetme kalıpları (örneğin `@BotName`, emoji tetikleyicileri) açısından denetlenir.
3. Bir bahsetme bulunursa mesaj, tam yanıt işlem hattından geçmeye devam eder.

**Geri dönüş davranışı:** Ön denetim dökümü başarısız olursa (zaman aşımı, API hatası vb.), karma mesajların (metin + ses) hiçbir zaman düşürülmemesi için mesaj yalnızca metne dayalı bahsetme algılamasına geri döner.

**Telegram grubu/konusu başına devre dışı bırakma:**

- İlgili grup için ön denetim dökümündeki bahsetme denetimlerini atlamak üzere `channels.telegram.groups.<chatId>.disableAudioPreflight: true` ayarını yapın.
- Konu başına geçersiz kılmak için `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` ayarını yapın (atlamak için `true`, zorla etkinleştirmek için `false`).
- Varsayılan değer `false` değeridir (bahsetme geçitli koşullar eşleştiğinde ön denetim etkindir).

**Örnek:** Bir kullanıcı, `requireMention: true` ayarlı bir Telegram grubunda "Hey @Claude, hava nasıl?" diyen bir sesli not gönderir. Sesli notun dökümü oluşturulur, bahsetme algılanır ve ajan yanıt verir.

## Dikkat edilmesi gerekenler

- Kapsam kurallarında ilk eşleşme kazanır; `chatType`, `direct`, `group` veya `channel` değerlerinden birine normalleştirilir.
- CLI'nizin 0 koduyla çıktığından ve düz metin yazdırdığından emin olun; JSON çıktısının `jq -r .text` aracılığıyla işlenmesi gerekir.
- Bilinen dosya çıktı modları belirleyicidir: çıkarımla belirlenen döküm dosyasının boş veya eksik olması, CLI ilerleme çıktısına geri dönmek yerine hiç döküm üretmez.
- `parakeet-mlx` için `--output-dir` ve varsayılan `{filename}` çıktı şablonuyla birlikte `--output-format txt` (veya `all`) kullanın. Üst kaynaktaki `PARAKEET_OUTPUT_FORMAT` ve `PARAKEET_OUTPUT_TEMPLATE` ortam değişkenleri de dikkate alınır. OpenClaw, `<output-dir>/<media-basename>.txt` dosyasını okur; varsayılan `srt` biçimi, diğer biçimler ve özel çıktı şablonları standart çıktıyı kullanmaya devam eder.
- Yanıt kuyruğunun engellenmesini önlemek için zaman aşımlarını makul tutun (`timeoutSeconds`, varsayılan 60 sn).
- Ön denetim dökümü, bahsetme algılaması için yalnızca **ilk** ses ekini işler. Ek ses ekleri, ana medya anlama aşamasında işlenir.

## İlgili konular

- [Medya anlama](/tr/nodes/media-understanding)
- [Konuşma modu](/tr/nodes/talk)
- [Sesle uyandırma](/tr/nodes/voicewake)
