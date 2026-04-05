---
read_when:
    - OpenClaw'dan giden bir sesli arama başlatmak istiyorsunuz
    - voice-call plugin'ini yapılandırıyor veya geliştiriyorsunuz
summary: 'Voice Call plugin''i: Twilio/Telnyx/Plivo üzerinden giden + gelen aramalar (plugin kurulumu + yapılandırma + CLI)'
title: Voice Call Plugin'i
x-i18n:
    generated_at: "2026-04-05T14:03:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6d10c9fde6ce1f51637af285edc0c710e9cb7702231c0a91b527b721eaddc1
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (plugin)

OpenClaw için bir plugin aracılığıyla sesli aramalar. Giden bildirimleri ve
gelen ilkeleriyle çok turlu konuşmaları destekler.

Mevcut sağlayıcılar:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML aktarımı + GetInput konuşma)
- `mock` (geliştirme/ağ yok)

Hızlı zihinsel model:

- Plugin'i kurun
- Gateway'i yeniden başlatın
- `plugins.entries.voice-call.config` altında yapılandırın
- `openclaw voicecall ...` veya `voice_call` aracını kullanın

## Çalıştığı yer (yerel ve uzak)

Voice Call plugin'i **Gateway işleminin içinde** çalışır.

Uzak bir Gateway kullanıyorsanız, plugin'i **Gateway'i çalıştıran makinede**
kurup yapılandırın, sonra yüklenmesi için Gateway'i yeniden başlatın.

## Kurulum

### Seçenek A: npm'den kurulum (önerilir)

```bash
openclaw plugins install @openclaw/voice-call
```

Ardından Gateway'i yeniden başlatın.

### Seçenek B: yerel klasörden kurulum (geliştirme, kopyalama yok)

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
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx Mission Control Portal'dan Telnyx webhook açık anahtarı
            // (Base64 dizesi; TELNYX_PUBLIC_KEY üzerinden de ayarlanabilir).
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

          // Webhook güvenliği (tüneller/proxy'ler için önerilir)
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
            provider: "openai", // isteğe bağlı; ayarlanmazsa ilk kayıtlı gerçek zamanlı transkripsiyon sağlayıcısı
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

- Twilio/Telnyx, **genel olarak erişilebilir** bir webhook URL'si gerektirir.
- Plivo, **genel olarak erişilebilir** bir webhook URL'si gerektirir.
- `mock`, yerel bir geliştirme sağlayıcısıdır (ağ çağrısı yok).
- Eski yapılandırmalar hâlâ `provider: "log"`, `twilio.from` veya eski `streaming.*` OpenAI anahtarlarını kullanıyorsa, bunları yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- `skipSignatureVerification` true değilse Telnyx, `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
- `skipSignatureVerification` yalnızca yerel test içindir.
- ngrok ücretsiz katmanını kullanıyorsanız, `publicUrl` değerini tam ngrok URL'si olarak ayarlayın; imza doğrulaması her zaman zorunludur.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true`, yalnızca `tunnel.provider="ngrok"` ve `serve.bind` loopback olduğunda (ngrok yerel ajanı) geçersiz imzalara sahip Twilio webhook'larına izin verir. Yalnızca yerel geliştirme için kullanın.
- Ngrok ücretsiz katman URL'leri değişebilir veya araya giren davranış ekleyebilir; `publicUrl` kayarsa Twilio imzaları başarısız olur. Üretim için kararlı bir etki alanı veya Tailscale funnel tercih edin.
- Akış güvenliği varsayılanları:
  - `streaming.preStartTimeoutMs`, hiçbir zaman geçerli bir `start` çerçevesi göndermeyen soketleri kapatır.
- `streaming.maxPendingConnections`, kimliği doğrulanmamış başlatma öncesi toplam soket sayısını sınırlar.
- `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlatma öncesi soket sayısını sınırlar.
- `streaming.maxConnections`, toplam açık medya akışı soketlerini sınırlar (bekleyen + etkin).
- Çalışma zamanı yedeği şimdilik bu eski voice-call anahtarlarını kabul etmeye devam eder, ancak yeniden yazma yolu `openclaw doctor --fix` komutudur ve uyumluluk katmanı geçicidir.

## Akış transkripsiyonu

`streaming`, canlı arama sesi için bir gerçek zamanlı transkripsiyon sağlayıcısı seçer.

Geçerli çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call ilk
  kayıtlı gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Bugün paketlenmiş sağlayıcı, paketlenmiş `openai`
  plugin'i tarafından kaydedilen OpenAI'dir.
- Sağlayıcıya ait ham yapılandırma `streaming.providers.<providerId>` altında bulunur.
- `streaming.provider`, kayıtlı olmayan bir sağlayıcıyı işaret ediyorsa veya hiç gerçek zamanlı
  transkripsiyon sağlayıcısı kayıtlı değilse, Voice Call bir uyarı günlüğe kaydeder ve
  tüm plugin'i başarısız kılmak yerine medya akışını atlar.

OpenAI akış transkripsiyonu varsayılanları:

- API anahtarı: `streaming.providers.openai.apiKey` veya `OPENAI_API_KEY`
- model: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

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

Eski anahtarlar hâlâ `openclaw doctor --fix` tarafından otomatik taşınır:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Eski çağrı temizleyicisi

Hiçbir zaman son durum webhook'u almayan çağrıları
(örneğin, asla tamamlanmayan notify modu çağrıları) sonlandırmak için `staleCallReaperSeconds` kullanın. Varsayılan `0`'dır
(devre dışı).

Önerilen aralıklar:

- **Üretim:** notify tarzı akışlar için `120`–`300` saniye.
- Normal çağrıların
  bitebilmesi için bu değeri **`maxDurationSeconds` değerinden büyük** tutun. İyi bir başlangıç noktası `maxDurationSeconds + 30–60` saniyedir.

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

Bir proxy veya tünel Gateway'in önünde bulunduğunda plugin, imza doğrulaması için
genel URL'yi yeniden oluşturur. Bu seçenekler hangi yönlendirilmiş
üstbilgilerin güvenilir olduğunu denetler.

`webhookSecurity.allowedHosts`, yönlendirme üstbilgilerindeki ana makineler için izin listesi uygular.

`webhookSecurity.trustForwardingHeaders`, yönlendirme üstbilgilerine izin listesi olmadan güvenir.

`webhookSecurity.trustedProxyIPs`, yalnızca isteğin
uzak IP'si listedekilerle eşleştiğinde yönlendirme üstbilgilerine güvenir.

Webhook tekrar oynatma koruması Twilio ve Plivo için etkindir. Yeniden oynatılan geçerli webhook
istekleri onaylanır ancak yan etkiler için atlanır.

Twilio konuşma turları, `<Gather>` geri çağrılarında tur başına bir belirteç içerir; böylece
eski/yeniden oynatılmış konuşma geri çağrıları daha yeni bekleyen bir transkript turunu karşılayamaz.

Kimliği doğrulanmamış webhook istekleri, sağlayıcının gerekli imza üstbilgileri eksik olduğunda
gövde okunmadan önce reddedilir.

voice-call webhook'u, imza doğrulamasından önce paylaşılan ön-kimlik doğrulama gövde profilini (64 KB / 5 saniye)
ve IP başına işlemde üst sınırını kullanır.

Kararlı bir genel ana makineyle örnek:

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

Voice Call, aramalarda akış konuşması için çekirdek `messages.tts` yapılandırmasını kullanır.
Bunu plugin yapılandırması altında **aynı biçimle**
geçersiz kılabilirsiniz — `messages.tts` ile derinlemesine birleştirilir.

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

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) yükleme sırasında otomatik olarak `tts.providers.<provider>` biçimine taşınır. Kaydedilmiş yapılandırmada `providers` biçimini tercih edin.
- **Microsoft speech, sesli aramalar için yok sayılır** (telefon sesinin PCM olması gerekir; mevcut Microsoft taşıması telefon PCM çıkışını açığa çıkarmaz).
- Twilio medya akışı etkin olduğunda çekirdek TTS kullanılır; aksi halde aramalar sağlayıcının yerel seslerine geri döner.
- Bir Twilio medya akışı zaten etkinse Voice Call, TwiML `<Say>` kullanımına geri dönmez. Telefon TTS bu durumda kullanılamıyorsa, iki oynatma yolunu karıştırmak yerine oynatma isteği başarısız olur.
- Telefon TTS ikinci bir sağlayıcıya geri düştüğünde Voice Call, hata ayıklama için sağlayıcı zinciriyle (`from`, `to`, `attempts`) bir uyarı günlüğe kaydeder.

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

Yalnızca aramalar için ElevenLabs'e geçersiz kılın (çekirdek varsayılanı diğer yerlerde koruyun):

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

Yalnızca aramalar için OpenAI modelini geçersiz kılın (derinlemesine birleştirme örneği):

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

Gelen ilke varsayılan olarak `disabled` durumundadır. Gelen aramaları etkinleştirmek için şunu ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Merhaba! Nasıl yardımcı olabilirim?",
}
```

`inboundPolicy: "allowlist"`, düşük güvence düzeyine sahip bir arayan kimliği ekranıdır. Plugin,
sağlayıcı tarafından verilen `From` değerini normalleştirir ve `allowFrom` ile karşılaştırır.
Webhook doğrulaması sağlayıcı teslimini ve yük bütünlüğünü doğrular, ancak
PSTN/VoIP arayan numara sahipliğini kanıtlamaz. `allowFrom` değerini güçlü arayan kimliği yerine
arayan kimliği filtreleme olarak değerlendirin.

Otomatik yanıtlar ajan sistemini kullanır. Şunlarla ince ayar yapın:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Sesli çıktı sözleşmesi

Otomatik yanıtlar için Voice Call, sistem istemine sıkı bir sesli çıktı sözleşmesi ekler:

- `{"spoken":"..."}`

Voice Call ardından konuşma metnini savunmacı şekilde çıkarır:

- Akıl yürütme/hata içeriği olarak işaretlenmiş yükleri yok sayar.
- Doğrudan JSON, çitlenmiş JSON veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, sesli oynatmanın arayan kişiye dönük metne odaklanmasını sağlar ve planlama metninin sese sızmasını önler.

### Konuşma başlangıç davranışı

Giden `conversation` çağrıları için ilk mesaj işleme, canlı oynatma durumuna bağlıdır:

- Araya girme kuyruğu temizleme ve otomatik yanıt, yalnızca ilk selamlama etkin olarak konuşulurken bastırılır.
- İlk oynatma başarısız olursa çağrı `listening` durumuna döner ve ilk mesaj yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, ek gecikme olmadan akış bağlandığında başlar.

### Twilio akış bağlantı kesilmesi toleransı

Bir Twilio medya akışı bağlantısı kesildiğinde Voice Call, çağrıyı otomatik sonlandırmadan önce `2000ms` bekler:

- Akış bu pencere sırasında yeniden bağlanırsa otomatik sonlandırma iptal edilir.
- Tolerans süresinden sonra hiçbir akış yeniden kaydedilmezse, takılı kalmış etkin çağrıları önlemek için çağrı sonlandırılır.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call için takma ad
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # günlüklerden tur gecikmesini özetler
openclaw voicecall expose --mode funnel
```

`latency`, varsayılan voice-call depolama yolundan `calls.jsonl` dosyasını okur. Farklı bir günlüğü işaret etmek için
`--file <path>`, analizi son N kayıta sınırlandırmak için `--last <n>` kullanın
(varsayılan 200). Çıktı, tur gecikmesi ve dinleme-bekleme süreleri için
p50/p90/p99 değerlerini içerir.

## Ajan aracı

Araç adı: `voice_call`

Eylemler:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `end_call` (callId)
- `get_status` (callId)

Bu repo, `skills/voice-call/SKILL.md` konumunda eşleşen bir Skills belgesi gönderir.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
