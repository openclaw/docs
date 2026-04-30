---
read_when:
    - OpenClaw üzerinden giden bir sesli arama yapmak istiyorsunuz
    - voice-call Plugin'ini yapılandırıyor veya geliştiriyorsunuz
    - Telefon sistemlerinde gerçek zamanlı sese veya akışlı transkripsiyona ihtiyacınız var
sidebarTitle: Voice call
summary: Twilio, Telnyx veya Plivo aracılığıyla giden sesli aramalar yapın ve gelen sesli aramaları kabul edin; isteğe bağlı gerçek zamanlı ses ve akış transkripsiyonu desteğiyle
title: Sesli arama Plugin'i
x-i18n:
    generated_at: "2026-04-30T09:38:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Bir Plugin aracılığıyla OpenClaw için sesli aramalar. Giden bildirimleri,
çok turlu konuşmaları, tam çift yönlü gerçek zamanlı sesi, akışlı
transkripsiyonu ve izin listesi politikalarıyla gelen aramaları destekler.

**Geçerli sağlayıcılar:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/ağ yok).

<Note>
Voice Call Plugin'i **Gateway sürecinin içinde** çalışır. Uzak bir
Gateway kullanıyorsanız, Plugin'i Gateway'i çalıştıran makineye kurup
yapılandırın, ardından yüklenmesi için Gateway'i yeniden başlatın.
</Note>

## Hızlı başlangıç

<Steps>
  <Step title="Plugin'i yükleyin">
    <Tabs>
      <Tab title="npm'den">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Yerel klasörden (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    npm, OpenClaw'a ait paketi kullanımdan kaldırılmış olarak bildirirse bu paket sürümü
    daha eski bir harici paket serisindendir; daha yeni bir npm paketi yayımlanana kadar
    güncel paketlenmiş bir OpenClaw derlemesi veya yerel klasör yolunu kullanın.

    Ardından Plugin'in yüklenmesi için Gateway'i yeniden başlatın.

  </Step>
  <Step title="Sağlayıcıyı ve webhook'u yapılandırın">
    Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın (tam yapı için
    aşağıdaki [Yapılandırma](#configuration) bölümüne bakın). En az şunlar gerekir:
    `provider`, sağlayıcı kimlik bilgileri, `fromNumber` ve herkesçe erişilebilir
    bir webhook URL'si.
  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    openclaw voicecall setup
    ```

    Varsayılan çıktı sohbet günlüklerinde ve terminallerde okunabilir. Plugin'in
    etkinleştirilmesini, sağlayıcı kimlik bilgilerini, webhook erişimini ve yalnızca
    bir ses modunun (`streaming` veya `realtime`) etkin olduğunu denetler. Betikler için
    `--json` kullanın.

  </Step>
  <Step title="Smoke testi">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    İkisi de varsayılan olarak deneme çalıştırmasıdır. Kısa bir giden bildirim
    aramasını gerçekten başlatmak için `--yes` ekleyin:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx ve Plivo için kurulumun **herkesçe erişilebilir bir webhook URL'sine**
çözülmesi gerekir. `publicUrl`, tünel URL'si, Tailscale URL'si veya sunma geri dönüşü
loopback ya da özel ağ alanına çözümlenirse kurulum, taşıyıcı webhook'larını alamayacak
bir sağlayıcı başlatmak yerine başarısız olur.
</Warning>

## Yapılandırma

`enabled: true` ise ancak seçilen sağlayıcının kimlik bilgileri eksikse,
Gateway başlangıcı eksik anahtarlarla birlikte kurulum eksik uyarısı günlüğe yazar ve
çalışma zamanını başlatmayı atlar. Komutlar, RPC çağrıları ve ajan araçları
kullanıldığında yine de eksik sağlayıcı yapılandırmasını aynen döndürür.

<Note>
Voice-call kimlik bilgileri SecretRefs kabul eder. `plugins.entries.voice-call.config.twilio.authToken` ve `plugins.entries.voice-call.config.tts.providers.*.apiKey`, standart SecretRef yüzeyi üzerinden çözümlenir; bkz. [SecretRef kimlik bilgisi yüzeyi](/tr/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Sağlayıcı erişimi ve güvenlik notları">
    - Twilio, Telnyx ve Plivo'nun tümü **herkesçe erişilebilir** bir webhook URL'si gerektirir.
    - `mock`, yerel dev sağlayıcısıdır (ağ çağrısı yoktur).
    - Telnyx, `skipSignatureVerification` true olmadığı sürece `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
    - `skipSignatureVerification` yalnızca yerel test içindir.
    - ngrok ücretsiz katmanında `publicUrl` değerini tam ngrok URL'sine ayarlayın; imza doğrulama her zaman zorunlu tutulur.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`, geçersiz imzalı Twilio webhook'larına **yalnızca** `tunnel.provider="ngrok"` ve `serve.bind` loopback olduğunda izin verir (ngrok yerel ajanı). Yalnızca yerel dev.
    - Ngrok ücretsiz katman URL'leri değişebilir veya ara sayfa davranışı ekleyebilir; `publicUrl` kayarsa Twilio imzaları başarısız olur. Üretim: kararlı bir alan adı veya Tailscale funnel tercih edin.

  </Accordion>
  <Accordion title="Akış bağlantısı sınırları">
    - `streaming.preStartTimeoutMs`, hiçbir zaman geçerli bir `start` karesi göndermeyen soketleri kapatır.
    - `streaming.maxPendingConnections`, kimliği doğrulanmamış başlatma öncesi soketlerin toplamını sınırlar.
    - `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlatma öncesi soketleri sınırlar.
    - `streaming.maxConnections`, toplam açık medya akışı soketlerini sınırlar (bekleyen + etkin).

  </Accordion>
  <Accordion title="Eski yapılandırma geçişleri">
    `provider: "log"`, `twilio.from` veya eski
    `streaming.*` OpenAI anahtarlarını kullanan eski yapılandırmalar `openclaw doctor --fix`
    tarafından yeniden yazılır. Çalışma zamanı geri dönüşü eski voice-call anahtarlarını
    şimdilik hâlâ kabul eder, ancak yeniden yazma yolu `openclaw doctor --fix` ve
    uyumluluk shim'i geçicidir.

    Otomatik geçirilen akış anahtarları:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı arama sesi için tam çift yönlü bir gerçek zamanlı ses sağlayıcısı seçer.
Bu, sesi yalnızca gerçek zamanlı transkripsiyon sağlayıcılarına ileten `streaming`den ayrıdır.

<Warning>
`realtime.enabled`, `streaming.enabled` ile birleştirilemez. Arama başına bir
ses modu seçin.
</Warning>

Geçerli çalışma zamanı davranışı:

- `realtime.enabled`, Twilio Media Streams için desteklenir.
- `realtime.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call, kayıtlı ilk gerçek zamanlı ses sağlayıcısını kullanır.
- Birlikte gelen gerçek zamanlı ses sağlayıcıları: Google Gemini Live (`google`) ve OpenAI (`openai`), kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `realtime.providers.<providerId>` altında bulunur.
- Voice Call, paylaşılan `openclaw_agent_consult` gerçek zamanlı aracını varsayılan olarak sunar. Arayan daha derin akıl yürütme, güncel bilgi veya normal OpenClaw araçları istediğinde gerçek zamanlı model bunu çağırabilir.
- `realtime.provider` kayıtlı olmayan bir sağlayıcıyı gösterirse veya hiç gerçek zamanlı ses sağlayıcısı kayıtlı değilse Voice Call, tüm Plugin'i başarısız kılmak yerine bir uyarı günlüğe yazar ve gerçek zamanlı medyayı atlar.
- Danışma oturumu anahtarları, mevcut olduğunda var olan ses oturumunu yeniden kullanır; ardından arama sırasında takip danışma çağrılarının bağlamı koruması için arayan/aranan telefon numarasına geri döner.

### Araç politikası

`realtime.toolPolicy`, danışma çalıştırmasını denetler:

| Politika         | Davranış                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Danışma aracını sunar ve normal ajanı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar. |
| `owner`          | Danışma aracını sunar ve normal ajanın normal ajan araç politikasını kullanmasına izin verir.                                                      |
| `none`           | Danışma aracını sunmaz. Özel `realtime.tools` yine de gerçek zamanlı sağlayıcıya geçirilir.                               |

### Gerçek zamanlı sağlayıcı örnekleri

<Tabs>
  <Tab title="Google Gemini Live">
    Varsayılanlar: `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` veya `GOOGLE_GENERATIVE_AI_API_KEY` üzerinden API anahtarı; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; ses `Kore`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Sağlayıcıya özgü gerçek zamanlı ses seçenekleri için [Google sağlayıcısı](/tr/providers/google) ve
[OpenAI sağlayıcısı](/tr/providers/openai) bölümlerine bakın.

## Akışlı transkripsiyon

`streaming`, canlı arama sesi için gerçek zamanlı bir transkripsiyon sağlayıcısı seçer.

Geçerli çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call, kayıtlı ilk gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Birlikte gelen gerçek zamanlı transkripsiyon sağlayıcıları: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI (`xai`), kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `streaming.providers.<providerId>` altında bulunur.
- `streaming.provider` kayıtlı olmayan bir sağlayıcıyı gösterirse veya hiçbiri kayıtlı değilse Voice Call, tüm Plugin'i başarısız kılmak yerine bir uyarı günlüğe yazar ve medya akışını atlar.

### Akış sağlayıcı örnekleri

<Tabs>
  <Tab title="OpenAI">
    Varsayılanlar: API anahtarı `streaming.providers.openai.apiKey` veya
    `OPENAI_API_KEY`; model `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

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
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

  </Tab>
  <Tab title="xAI">
    Varsayılanlar: API anahtarı `streaming.providers.xai.apiKey` veya `XAI_API_KEY`;
    uç nokta `wss://api.x.ai/v1/stt`; kodlama `mulaw`; örnekleme hızı `8000`;
    `endpointingMs: 800`; `interimResults: true`.

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
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

  </Tab>
</Tabs>

## Çağrılar için TTS

Voice Call, çağrılarda akış konuşması için çekirdek `messages.tts` yapılandırmasını kullanır. Bunu Plugin yapılandırmasının altında **aynı şekille** geçersiz kılabilirsiniz; `messages.tts` ile derin birleştirme yapılır.

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

<Warning>
**Microsoft konuşma, sesli çağrılar için yoksayılır.** Telefon sesi PCM gerektirir;
mevcut Microsoft aktarımı telefon PCM çıktısını sunmaz.
</Warning>

Davranış notları:

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) `openclaw doctor --fix` tarafından onarılır; commit edilen yapılandırma `tts.providers.<provider>` kullanmalıdır.
- Çekirdek TTS, Twilio medya akışı etkinleştirildiğinde kullanılır; aksi halde çağrılar sağlayıcıya özgü seslere geri döner.
- Bir Twilio medya akışı zaten etkinse, Voice Call TwiML `<Say>` kullanımına geri dönmez. Bu durumda telefon TTS kullanılamıyorsa, oynatma isteği iki oynatma yolunu karıştırmak yerine başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya geri döndüğünde, Voice Call hata ayıklama için sağlayıcı zinciriyle (`from`, `to`, `attempts`) bir uyarı günlüğe yazar.
- Twilio araya girme veya akış sonlandırma bekleyen TTS kuyruğunu temizlediğinde, kuyruktaki oynatma istekleri oynatma tamamlanmasını bekleyen arayanları askıda bırakmak yerine sonuçlanır.

### TTS örnekleri

<Tabs>
  <Tab title="Core TTS only">
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
  </Tab>
  <Tab title="Override to ElevenLabs (calls only)">
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
  </Tab>
  <Tab title="OpenAI model override (deep-merge)">
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
  </Tab>
</Tabs>

## Gelen çağrılar

Gelen ilke varsayılan olarak `disabled` değerindedir. Gelen çağrıları etkinleştirmek için şunu ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` düşük güvence sağlayan bir arayan kimliği filtresidir. Plugin, sağlayıcı tarafından sağlanan `From` değerini normalleştirir ve `allowFrom` ile karşılaştırır. Webhook doğrulaması sağlayıcı teslimini ve yük bütünlüğünü doğrular, ancak PSTN/VoIP arayan numarası sahipliğini **kanıtlamaz**. `allowFrom` değerini güçlü arayan kimliği olarak değil, arayan kimliği filtreleme olarak ele alın.
</Warning>

Otomatik yanıtlar ajan sistemini kullanır. `responseModel`,
`responseSystemPrompt` ve `responseTimeoutMs` ile ayarlayın.

### Sözlü çıktı sözleşmesi

Otomatik yanıtlar için Voice Call, sistem istemine katı bir sözlü çıktı sözleşmesi ekler:

```text
{"spoken":"..."}
```

Voice Call konuşma metnini savunmalı biçimde çıkarır:

- Akıl yürütme/hata içeriği olarak işaretlenen yükleri yoksayar.
- Doğrudan JSON, çit içine alınmış JSON veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, sözlü oynatmanın arayana yönelik metne odaklanmasını sağlar ve planlama metninin sese sızmasını önler.

### Konuşma başlatma davranışı

Giden `conversation` çağrıları için ilk mesaj işleme canlı oynatma durumuna bağlıdır:

- Araya girme kuyruğu temizleme ve otomatik yanıt yalnızca ilk karşılama etkin olarak konuşulurken bastırılır.
- İlk oynatma başarısız olursa, çağrı `listening` durumuna döner ve ilk mesaj yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, akış bağlantısında ek gecikme olmadan başlar.
- Araya girme etkin oynatmayı iptal eder ve kuyrukta olan ancak henüz oynatılmayan Twilio TTS girişlerini temizler. Temizlenen girişler atlanmış olarak çözülür, böylece takip yanıt mantığı hiç oynatılmayacak sesi beklemeden devam edebilir.
- Gerçek zamanlı sesli konuşmalar, gerçek zamanlı akışın kendi açılış sırasını kullanır. Voice Call, bu ilk mesaj için eski bir `<Say>` TwiML güncellemesi göndermez, bu nedenle giden `<Connect><Stream>` oturumları bağlı kalır.

### Twilio akış bağlantı kesme toleransı

Bir Twilio medya akışının bağlantısı kesildiğinde, Voice Call çağrıyı otomatik sonlandırmadan önce **2000 ms** bekler:

- Akış bu süre içinde yeniden bağlanırsa, otomatik sonlandırma iptal edilir.
- Tolerans süresinden sonra hiçbir akış yeniden kaydolmazsa, takılı kalmış etkin çağrıları önlemek için çağrı sonlandırılır.

## Eski çağrı temizleyici

Hiçbir zaman terminal Webhook almayan çağrıları sonlandırmak için `staleCallReaperSeconds` kullanın (örneğin, hiç tamamlanmayan bildirim modu çağrıları). Varsayılan değer `0` (devre dışı) şeklindedir.

Önerilen aralıklar:

- **Üretim:** Bildirim tarzı akışlar için `120`–`300` saniye.
- Normal çağrıların tamamlanabilmesi için bu değeri **`maxDurationSeconds` değerinden yüksek** tutun. İyi bir başlangıç noktası `maxDurationSeconds + 30–60` saniyedir.

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

## Webhook güvenliği

Gateway önünde bir proxy veya tünel bulunduğunda, Plugin imza doğrulaması için genel URL'yi yeniden oluşturur. Bu seçenekler hangi iletilen başlıklara güvenileceğini denetler:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  İletme başlıklarından gelen ana makineleri izin listesine alır.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  İzin listesi olmadan iletilen başlıklara güvenir.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Yalnızca istek uzak IP'si listeyle eşleştiğinde iletilen başlıklara güvenir.
</ParamField>

Ek korumalar:

- Webhook **yeniden oynatma koruması** Twilio ve Plivo için etkindir. Yeniden oynatılan geçerli Webhook istekleri onaylanır ancak yan etkiler için atlanır.
- Twilio konuşma sıraları `<Gather>` geri çağrılarında sıra başına bir belirteç içerir, böylece eski/yeniden oynatılan konuşma geri çağrıları daha yeni bekleyen bir transkript sırasını karşılayamaz.
- Kimliği doğrulanmamış Webhook istekleri, sağlayıcının gerekli imza başlıkları eksik olduğunda gövde okumalarından önce reddedilir.
- voice-call Webhook'u, imza doğrulamasından önce paylaşılan ön kimlik doğrulama gövde profilini (64 KB / 5 saniye) ve IP başına eşzamanlı sınırı kullanır.

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

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency`, varsayılan voice-call depolama yolundan `calls.jsonl` dosyasını okur.
Farklı bir günlüğü göstermek için `--file <path>`, analizi son N kayıtla sınırlamak için `--last <n>` kullanın (varsayılan 200). Çıktı, sıra gecikmesi ve dinleme-bekleme süreleri için p50/p90/p99 içerir.

## Ajan aracı

Araç adı: `voice_call`.

| Eylem           | Bağımsız değişkenler      |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Bu repo `skills/voice-call/SKILL.md` konumunda eşleşen bir Skills belgesi sunar.

## Gateway RPC

| Yöntem              | Bağımsız değişkenler      |
| ------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## İlgili

- [Konuşma modu](/tr/nodes/talk)
- [Metinden konuşmaya](/tr/tools/tts)
- [Sesle uyandırma](/tr/nodes/voicewake)
