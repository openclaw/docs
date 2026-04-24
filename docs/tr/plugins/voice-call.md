---
read_when:
    - OpenClaw'dan giden bir sesli arama başlatmak istiyorsunuz
    - Voice Call Plugin'ini yapılandırıyor veya geliştiriyorsunuz
summary: 'Voice Call Plugin''i: Twilio/Telnyx/Plivo üzerinden giden + gelen aramalar (Plugin kurulumu + yapılandırma + CLI)'
title: Voice Call Plugin'i
x-i18n:
    generated_at: "2026-04-24T09:24:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

OpenClaw için Plugin üzerinden sesli aramalar. Giden bildirimleri ve
gelen ilkelerle çok turlu konuşmaları destekler.

Geçerli sağlayıcılar:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (geliştirme/ağ yok)

Hızlı zihinsel model:

- Plugin'i kur
- Gateway'i yeniden başlat
- `plugins.entries.voice-call.config` altında yapılandır
- `openclaw voicecall ...` veya `voice_call` aracını kullan

## Nerede çalışır (yerel ve uzak)

Voice Call Plugin'i **Gateway sürecinin içinde** çalışır.

Uzak bir Gateway kullanıyorsanız, Plugin'i **Gateway'i çalıştıran makinede**
kurun/yapılandırın, ardından yüklenmesi için Gateway'i yeniden başlatın.

## Kurulum

### Seçenek A: npm'den kur (önerilen)

```bash
openclaw plugins install @openclaw/voice-call
```

Ardından Gateway'i yeniden başlatın.

### Seçenek B: yerel klasörden kur (geliştirme, kopyalama yok)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Ardından Gateway'i yeniden başlatın.

## Yapılandırma

Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // veya "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // veya Twilio için TWILIO_FROM_NUMBER
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx Mission Control Portal'dan alınan Telnyx webhook genel anahtarı
            // (Base64 dizesi; TELNYX_PUBLIC_KEY ile de ayarlanabilir).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook sunucusu
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook güvenliği (tüneller/proxy'ler için önerilen)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Genel erişim (birini seçin)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // isteğe bağlı; ayarlı değilse ilk kayıtlı gerçek zamanlı transcription sağlayıcısı
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // OPENAI_API_KEY ayarlıysa isteğe bağlı
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

Notlar:

- Twilio/Telnyx **genel olarak erişilebilir** bir Webhook URL'si gerektirir.
- Plivo **genel olarak erişilebilir** bir Webhook URL'si gerektirir.
- `mock`, yerel geliştirme sağlayıcısıdır (ağ çağrısı yok).
- Eski yapılandırmalar hâlâ `provider: "log"`, `twilio.from` veya eski `streaming.*` OpenAI anahtarlarını kullanıyorsa, bunları yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- `skipSignatureVerification` true olmadığı sürece Telnyx, `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
- `skipSignatureVerification` yalnızca yerel test içindir.
- Ngrok ücretsiz katmanını kullanıyorsanız `publicUrl` değerini tam ngrok URL'si olarak ayarlayın; imza doğrulaması her zaman zorlanır.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true`, yalnızca `tunnel.provider="ngrok"` ve `serve.bind` loopback olduğunda (ngrok yerel ajanı) geçersiz imzalara sahip Twilio Webhook'larına izin verir. Yalnızca yerel geliştirme için kullanın.
- Ngrok ücretsiz katman URL'leri değişebilir veya ara ekran davranışı ekleyebilir; `publicUrl` kayarsa Twilio imzaları başarısız olur. Üretim için kararlı bir alan adı veya Tailscale Funnel tercih edin.
- Akış güvenliği varsayılanları:
  - `streaming.preStartTimeoutMs`, hiçbir zaman geçerli bir `start` çerçevesi göndermeyen soketleri kapatır.
- `streaming.maxPendingConnections`, toplam kimliği doğrulanmamış başlangıç öncesi soket sayısını sınırlar.
- `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlangıç öncesi soket sayısını sınırlar.
- `streaming.maxConnections`, toplam açık medya akışı soketlerini (bekleyen + etkin) sınırlar.
- Çalışma zamanı geri dönüşü şimdilik bu eski voice-call anahtarlarını kabul etmeye devam eder, ancak yeniden yazma yolu `openclaw doctor --fix`'tir ve uyumluluk katmanı geçicidir.

## Akış halinde transcription

`streaming`, canlı çağrı sesi için bir gerçek zamanlı transcription sağlayıcısı seçer.

Geçerli çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlı değilse Voice Call ilk
  kayıtlı gerçek zamanlı transcription sağlayıcısını kullanır.
- Paketlenmiş gerçek zamanlı transcription sağlayıcıları arasında Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI
  (`xai`) bulunur; bunlar kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `streaming.providers.<providerId>` altında yaşar.
- `streaming.provider` kayıtlı olmayan bir sağlayıcıyı işaret ederse veya hiç gerçek zamanlı
  transcription sağlayıcısı kayıtlı değilse, Voice Call tüm Plugin'i başarısız kılmak yerine
  bir uyarı günlüğe kaydeder ve medya akışını atlar.

OpenAI akış halinde transcription varsayılanları:

- API anahtarı: `streaming.providers.openai.apiKey` veya `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

xAI akış halinde transcription varsayılanları:

- API anahtarı: `streaming.providers.xai.apiKey` veya `XAI_API_KEY`
- uç nokta: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Örnek:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // OPENAI_API_KEY ayarlıysa isteğe bağlı
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Bunun yerine xAI kullanın:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // XAI_API_KEY ayarlıysa isteğe bağlı
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Eski anahtarlar hâlâ `openclaw doctor --fix` tarafından otomatik taşınır:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Eski çağrı temizleyicisi

Hiçbir zaman sonlandırıcı bir Webhook almayan çağrıları
(örneğin hiç tamamlanmayan notify modu çağrıları) bitirmek için `staleCallReaperSeconds` kullanın. Varsayılan `0`
(devre dışı).

Önerilen aralıklar:

- **Üretim:** notify tarzı akışlar için `120`–`300` saniye.
- Normal çağrıların
  tamamlanabilmesi için bu değeri **`maxDurationSeconds` değerinden daha yüksek** tutun. İyi bir başlangıç noktası `maxDurationSeconds + 30–60` saniyedir.

Örnek:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook Güvenliği

Bir proxy veya tünel Gateway'in önünde durduğunda Plugin,
imza doğrulaması için genel URL'yi yeniden oluşturur. Bu seçenekler hangi yönlendirilmiş
başlıkların güvenilir olduğunu kontrol eder.

`webhookSecurity.allowedHosts`, yönlendirme başlıklarından gelen host'ları izin listesine alır.

`webhookSecurity.trustForwardingHeaders`, izin listesi olmadan yönlendirilmiş başlıklara güvenir.

`webhookSecurity.trustedProxyIPs`, yalnızca istek
uzak IP'si listedekilerle eşleştiğinde yönlendirilmiş başlıklara güvenir.

Webhook tekrar oynatma koruması Twilio ve Plivo için etkindir. Tekrar oynatılan geçerli Webhook
istekleri onaylanır ama yan etkiler için atlanır.

Twilio konuşma turları, `<Gather>` geri çağrılarında tur başına bir belirteç içerir; böylece
eski/tekrar oynatılmış konuşma geri çağrıları daha yeni bir bekleyen döküm turunu karşılayamaz.

Kimliği doğrulanmamış Webhook istekleri, sağlayıcının gerekli imza başlıkları eksikse
gövde okunmadan önce reddedilir.

Voice Call Webhook'u, imza doğrulamasından önce paylaşılan ön-auth gövde profilini (64 KB / 5 saniye)
ve IP başına uçuş halindeki istek üst sınırını kullanır.

Kararlı bir genel host ile örnek:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## Aramalar için TTS

Voice Call, çağrılarda
akışlı konuşma için çekirdek `messages.tts` yapılandırmasını kullanır. Bunu Plugin yapılandırması altında
**aynı şekille** geçersiz kılabilirsiniz — `messages.tts` ile derinlemesine birleştirilir.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Notlar:

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) yükleme sırasında otomatik olarak `tts.providers.<provider>` şekline taşınır. Commit edilmiş yapılandırmada `providers` şeklini tercih edin.
- **Microsoft speech, sesli aramalar için yok sayılır** (telefon sesi PCM gerektirir; mevcut Microsoft taşıması telefon PCM çıktısı açığa çıkarmaz).
- Twilio medya akışı etkinse çekirdek TTS kullanılır; aksi halde aramalar sağlayıcıya özgü yerel seslere geri döner.
- Bir Twilio medya akışı zaten etkinken Voice Call, TwiML `<Say>` yoluna geri dönmez. Bu durumda telefon TTS kullanılamıyorsa iki oynatma yolunu karıştırmak yerine oynatma isteği başarısız olur.
- Telefon TTS ikincil sağlayıcıya geri döndüğünde Voice Call, hata ayıklama için sağlayıcı zinciri (`from`, `to`, `attempts`) ile bir uyarı günlüğe kaydeder.

### Daha fazla örnek

Yalnızca çekirdek TTS kullanın (geçersiz kılma yok):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Yalnızca çağrılar için ElevenLabs'a geçersiz kılın (çekirdek varsayılanı başka yerde koruyun):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Yalnızca çağrılar için OpenAI modelini geçersiz kılın (derin birleştirme örneği):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Gelen aramalar

Gelen ilkesi varsayılan olarak `disabled` durumundadır. Gelen aramaları etkinleştirmek için şunu ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"`, düşük güvenceye sahip bir arayan numarası ekranıdır. Plugin,
sağlayıcının verdiği `From` değerini normalize eder ve `allowFrom` ile karşılaştırır.
Webhook doğrulaması sağlayıcı teslimatını ve payload bütünlüğünü doğrular, ancak
PSTN/VoIP arayan numara sahipliğini kanıtlamaz. `allowFrom` değerini güçlü arayan kimliği olarak değil,
arayan numarası filtrelemesi olarak değerlendirin.

Otomatik yanıtlar aracı sistemini kullanır. Şunlarla ayarlayın:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Konuşulan çıktı sözleşmesi

Otomatik yanıtlar için Voice Call, sistem istemine katı bir konuşulan çıktı sözleşmesi ekler:

- `{"spoken":"..."}`

Voice Call sonra konuşma metnini savunmacı şekilde çıkarır:

- Muhakeme/hata içeriği olarak işaretlenmiş payload'ları yok sayar.
- Doğrudan JSON, çitlenmiş JSON veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, konuşulan oynatmanın arayan kullanıcıya dönük metne odaklı kalmasını sağlar ve planlama metninin sese sızmasını önler.

### Konuşma başlangıç davranışı

Giden `conversation` çağrıları için ilk mesaj işleme, canlı oynatma durumuna bağlıdır:

- Araya girme kuyruk temizleme ve otomatik yanıt, yalnızca ilk selamlama aktif olarak konuşurken bastırılır.
- İlk oynatma başarısız olursa, çağrı `listening` durumuna döner ve ilk mesaj yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, ekstra gecikme olmadan akış bağlantısında başlar.

### Twilio akış bağlantı kesilmesi ek süresi

Bir Twilio medya akışının bağlantısı kesildiğinde, Voice Call çağrıyı otomatik sonlandırmadan önce `2000ms` bekler:

- Akış bu pencere içinde yeniden bağlanırsa, otomatik sonlandırma iptal edilir.
- Ek süre bittikten sonra hiçbir akış yeniden kaydedilmezse, takılı kalan etkin çağrıları önlemek için çağrı sonlandırılır.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call için takma ad
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # günlüklerden tur gecikmesini özetle
openclaw voicecall expose --mode funnel
```

`latency`, varsayılan voice-call depolama yolundaki `calls.jsonl` dosyasını okur.
Farklı bir günlüğü işaret etmek için `--file <path>`, analizi son N kayıtla sınırlandırmak için
`--last <n>` kullanın (varsayılan 200). Çıktı, tur gecikmesi ve dinleme-bekleme süreleri için
p50/p90/p99 değerlerini içerir.

## Aracı aracı

Araç adı: `voice_call`

Eylemler:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Bu depo, `skills/voice-call/SKILL.md` konumunda eşleşen bir skill belgesi içerir.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## İlgili

- [Metinden konuşmaya](/tr/tools/tts)
- [Talk mode](/tr/nodes/talk)
- [Voice wake](/tr/nodes/voicewake)
