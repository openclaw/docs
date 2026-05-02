---
read_when:
    - OpenClaw'dan giden bir sesli arama yapmak istiyorsunuz
    - voice-call Plugin'ini yapılandırıyor veya geliştiriyorsunuz
    - Telefon sistemlerinde gerçek zamanlı ses veya akışlı transkripsiyona ihtiyacınız var
sidebarTitle: Voice call
summary: Twilio, Telnyx veya Plivo üzerinden giden sesli aramalar yapın ve gelen sesli aramaları kabul edin; isteğe bağlı gerçek zamanlı ses ve akış transkripsiyonu ile
title: Sesli arama Plugin
x-i18n:
    generated_at: "2026-05-02T20:59:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw için bir Plugin aracılığıyla sesli aramalar. Giden bildirimleri,
çok turlu konuşmaları, tam çift yönlü gerçek zamanlı sesi, akışlı
transkripsiyonu ve izin listesi ilkeleriyle gelen aramaları destekler.

**Geçerli sağlayıcılar:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (geliştirme/ağ yok).

<Note>
Voice Call Plugin'i **Gateway işleminin içinde** çalışır. Uzak bir Gateway
kullanıyorsanız, Plugin'i Gateway'i çalıştıran makineye kurup yapılandırın,
ardından yüklenmesi için Gateway'i yeniden başlatın.
</Note>

## Hızlı başlangıç

<Steps>
  <Step title="Plugin'i kurun">
    <Tabs>
      <Tab title="npm'den">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Yerel klasörden (geliştirme)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    npm, OpenClaw'a ait paketi kullanımdan kaldırılmış olarak bildirirse, bu paket sürümü
    daha eski bir harici paket hattındandır; daha yeni bir npm paketi yayımlanana kadar
    güncel paketlenmiş bir OpenClaw derlemesi veya yerel klasör yolunu kullanın.

    Sonrasında Plugin'in yüklenmesi için Gateway'i yeniden başlatın.

  </Step>
  <Step title="Sağlayıcıyı ve webhook'u yapılandırın">
    Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın (tam yapı için
    aşağıdaki [Yapılandırma](#configuration) bölümüne bakın). En azından:
    `provider`, sağlayıcı kimlik bilgileri, `fromNumber` ve herkese açık olarak
    erişilebilir bir webhook URL'si gerekir.
  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    openclaw voicecall setup
    ```

    Varsayılan çıktı sohbet günlüklerinde ve terminallerde okunabilir. Plugin'in etkinleştirilmesini,
    sağlayıcı kimlik bilgilerini, webhook erişimini ve yalnızca bir ses modunun
    (`streaming` veya `realtime`) etkin olduğunu kontrol eder. Betikler için
    `--json` kullanın.

  </Step>
  <Step title="Duman testi">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    İkisi de varsayılan olarak kuru çalıştırmadır. Gerçekten kısa bir giden
    bildirim araması yapmak için `--yes` ekleyin:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx ve Plivo için kurulumun **herkese açık webhook URL'sine** çözümlenmesi gerekir.
`publicUrl`, tünel URL'si, Tailscale URL'si veya serve yedek yolu
loopback ya da özel ağ alanına çözümlenirse, kurulum taşıyıcı webhook'larını
alamayacak bir sağlayıcıyı başlatmak yerine başarısız olur.
</Warning>

## Yapılandırma

`enabled: true` ise ancak seçilen sağlayıcının kimlik bilgileri eksikse,
Gateway başlangıcı eksik anahtarlarla birlikte kurulum-tamamlanmadı uyarısı kaydeder ve
çalışma zamanını başlatmayı atlar. Komutlar, RPC çağrıları ve aracı araçları
kullanıldığında yine eksik sağlayıcı yapılandırmasını aynen döndürür.

<Note>
Voice-call kimlik bilgileri SecretRef'leri kabul eder. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` ve `plugins.entries.voice-call.config.tts.providers.*.apiKey` standart SecretRef yüzeyi üzerinden çözümlenir; bkz. [SecretRef kimlik bilgisi yüzeyi](/tr/reference/secretref-credential-surface).
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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

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
    - Twilio, Telnyx ve Plivo'nun tümü **herkese açık erişilebilir** bir webhook URL'si gerektirir.
    - `mock` yerel geliştirme sağlayıcısıdır (ağ çağrısı yoktur).
    - Telnyx, `skipSignatureVerification` true olmadığı sürece `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
    - `skipSignatureVerification` yalnızca yerel test içindir.
    - ngrok ücretsiz katmanında `publicUrl` değerini tam ngrok URL'sine ayarlayın; imza doğrulaması her zaman uygulanır.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`, yalnızca `tunnel.provider="ngrok"` ve `serve.bind` loopback olduğunda (ngrok yerel aracı) geçersiz imzalı Twilio webhook'larına izin verir. Yalnızca yerel geliştirme içindir.
    - Ngrok ücretsiz katman URL'leri değişebilir veya ara sayfa davranışı ekleyebilir; `publicUrl` kayarsa Twilio imzaları başarısız olur. Üretim: kararlı bir alan adı veya Tailscale funnel tercih edin.

  </Accordion>
  <Accordion title="Akış bağlantısı sınırları">
    - `streaming.preStartTimeoutMs`, hiçbir zaman geçerli bir `start` karesi göndermeyen soketleri kapatır.
    - `streaming.maxPendingConnections`, toplam kimliği doğrulanmamış başlatma öncesi soketleri sınırlar.
    - `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlatma öncesi soketleri sınırlar.
    - `streaming.maxConnections`, toplam açık medya akışı soketlerini sınırlar (beklemede + etkin).

  </Accordion>
  <Accordion title="Eski yapılandırma geçişleri">
    `provider: "log"`, `twilio.from` veya eski
    `streaming.*` OpenAI anahtarlarını kullanan eski yapılandırmalar `openclaw doctor --fix`
    tarafından yeniden yazılır. Çalışma zamanı yedek yolu şimdilik eski voice-call anahtarlarını
    kabul etmeye devam eder, ancak yeniden yazma yolu `openclaw doctor --fix` ve uyumluluk ara katmanı
    geçicidir.

    Otomatik geçirilen akış anahtarları:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Oturum kapsamı

Varsayılan olarak Voice Call, aynı arayanın tekrar aramalarında konuşma belleğinin korunması için
`sessionScope: "per-phone"` kullanır. Her taşıyıcı aramasının taze bağlamla başlaması gerektiğinde,
örneğin resepsiyon, rezervasyon, IVR veya aynı telefon numarasının
farklı toplantıları temsil edebileceği Google Meet köprüsü akışlarında
`sessionScope: "per-call"` ayarlayın.

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı arama sesi için tam çift yönlü gerçek zamanlı bir ses sağlayıcısı seçer.
Yalnızca sesi gerçek zamanlı transkripsiyon sağlayıcılarına ileten `streaming`den ayrıdır.

<Warning>
`realtime.enabled`, `streaming.enabled` ile birlikte kullanılamaz. Her arama için bir
ses modu seçin.
</Warning>

Geçerli çalışma zamanı davranışı:

- `realtime.enabled`, Twilio Media Streams için desteklenir.
- `realtime.provider` isteğe bağlıdır. Ayarlanmamışsa Voice Call ilk kayıtlı gerçek zamanlı ses sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı ses sağlayıcıları: Google Gemini Live (`google`) ve OpenAI (`openai`); bunlar kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `realtime.providers.<providerId>` altında bulunur.
- Voice Call, paylaşılan `openclaw_agent_consult` gerçek zamanlı aracını varsayılan olarak sunar. Gerçek zamanlı model, arayan daha derin akıl yürütme, güncel bilgi veya normal OpenClaw araçları istediğinde bunu çağırabilir.
- `realtime.fastContext.enabled` varsayılan olarak kapalıdır. Etkinleştirildiğinde Voice Call önce danışma sorusu için indekslenmiş bellek/oturum bağlamında arama yapar ve yalnızca `realtime.fastContext.fallbackToConsult` true ise tam danışma aracısına geri dönmeden önce bu parçaları `realtime.fastContext.timeoutMs` içinde gerçek zamanlı modele döndürür.
- `realtime.provider` kayıtlı olmayan bir sağlayıcıyı gösterirse veya hiçbir gerçek zamanlı ses sağlayıcısı kayıtlı değilse, Voice Call tüm Plugin'i başarısız yapmak yerine bir uyarı kaydeder ve gerçek zamanlı medyayı atlar.
- Danışma oturumu anahtarları, kullanılabilir olduğunda depolanan arama oturumunu yeniden kullanır, ardından yapılandırılmış `sessionScope` değerine geri döner (varsayılan olarak `per-phone` veya yalıtılmış aramalar için `per-call`).

### Araç ilkesi

`realtime.toolPolicy` danışma çalıştırmasını kontrol eder:

| İlke             | Davranış                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Danışma aracını sunar ve normal aracıyı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar. |
| `owner`          | Danışma aracını sunar ve normal aracının olağan aracı araç ilkesini kullanmasına izin verir.                                                      |
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

- `streaming.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call, ilk kayıtlı gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Birlikte gelen gerçek zamanlı transkripsiyon sağlayıcıları: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI (`xai`); bunlar sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcının sahip olduğu ham yapılandırma `streaming.providers.<providerId>` altında bulunur.
- Twilio kabul edilen bir akış `start` iletisi gönderdikten sonra Voice Call akışı hemen kaydeder, sağlayıcı bağlanırken gelen medyayı transkripsiyon sağlayıcısı üzerinden kuyruğa alır ve ilk selamlamayı yalnızca gerçek zamanlı transkripsiyon hazır olduktan sonra başlatır.
- `streaming.provider` kayıtlı olmayan bir sağlayıcıyı gösteriyorsa veya hiçbiri kayıtlı değilse Voice Call bir uyarı günlüğe yazar ve tüm Plugin'i başarısız kılmak yerine medya akışını atlar.

### Akış sağlayıcısı örnekleri

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
    endpoint `wss://api.x.ai/v1/stt`; kodlama `mulaw`; örnekleme hızı `8000`;
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

## Aramalar için TTS

Voice Call, aramalarda akışlı konuşma için çekirdek `messages.tts`
yapılandırmasını kullanır. Bunu Plugin yapılandırması altında **aynı
şekille** geçersiz kılabilirsiniz; `messages.tts` ile derin birleştirme yapılır.

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
**Microsoft konuşma, sesli aramalar için yok sayılır.** Telefon sesi PCM gerektirir;
mevcut Microsoft aktarımı telefon PCM çıktısını açığa çıkarmaz.
</Warning>

Davranış notları:

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) `openclaw doctor --fix` tarafından onarılır; commit edilen yapılandırma `tts.providers.<provider>` kullanmalıdır.
- Twilio medya akışı etkinleştirildiğinde çekirdek TTS kullanılır; aksi halde aramalar sağlayıcıya özgü seslere geri döner.
- Bir Twilio medya akışı zaten etkinse Voice Call TwiML `<Say>` öğesine geri dönmez. Bu durumda telefon TTS kullanılamıyorsa oynatma isteği iki oynatma yolunu karıştırmak yerine başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya geri döndüğünde Voice Call hata ayıklama için sağlayıcı zincirini (`from`, `to`, `attempts`) içeren bir uyarı günlüğe yazar.
- Twilio araya girme veya akış sonlandırma bekleyen TTS kuyruğunu temizlediğinde, kuyruğa alınmış oynatma istekleri oynatma tamamlanmasını bekleyen arayanları askıda bırakmak yerine sonuçlanır.

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

## Gelen aramalar

Gelen arama ilkesi varsayılan olarak `disabled` değerindedir. Gelen aramaları etkinleştirmek için şunu ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` düşük güvence düzeyinde bir arayan kimliği süzgecidir.
Plugin, sağlayıcının verdiği `From` değerini normalleştirir ve bunu
`allowFrom` ile karşılaştırır. Webhook doğrulaması sağlayıcı teslimini ve
yük bütünlüğünü doğrular, ancak PSTN/VoIP arayan numarası sahipliğini
**kanıtlamaz**. `allowFrom` değerini güçlü arayan kimliği değil, arayan kimliği
filtrelemesi olarak değerlendirin.
</Warning>

Otomatik yanıtlar aracı sistemini kullanır. `responseModel`,
`responseSystemPrompt` ve `responseTimeoutMs` ile ayarlayın.

### Numara başına yönlendirme

Bir Voice Call Plugin'i birden fazla telefon numarası için arama aldığında ve
her numaranın farklı bir hat gibi davranması gerektiğinde `numbers` kullanın.
Örneğin bir numara gündelik bir kişisel asistan kullanırken başka bir numara
iş kişiliği, farklı bir yanıt aracı ve farklı bir TTS sesi kullanabilir.

Rotalar, sağlayıcının verdiği çevrilen `To` numarasından seçilir. Anahtarlar
E.164 numaraları olmalıdır. Bir arama geldiğinde Voice Call eşleşen rotayı bir kez
çözer, eşleşen rotayı arama kaydında saklar ve bu etkin yapılandırmayı
selamlama, klasik otomatik yanıt yolu, gerçek zamanlı danışma yolu ve TTS
oynatma için yeniden kullanır. Hiçbir rota eşleşmezse genel Voice Call
yapılandırması kullanılır. Giden aramalar `numbers` kullanmaz; aramayı başlatırken
giden hedefi, iletiyi ve oturumu açıkça iletin.

Rota geçersiz kılmaları şu anda şunları destekler:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` rota değeri genel Voice Call `tts` yapılandırmasının üzerine derin
birleştirilir, bu yüzden genellikle yalnızca sağlayıcı sesini geçersiz
kılabilirsiniz:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### Sözlü çıktı sözleşmesi

Otomatik yanıtlar için Voice Call sistem istemine katı bir sözlü çıktı
sözleşmesi ekler:

```text
{"spoken":"..."}
```

Voice Call konuşma metnini savunmacı biçimde çıkarır:

- Akıl yürütme/hata içeriği olarak işaretlenen yükleri yok sayar.
- Doğrudan JSON, çitle çevrili JSON veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, sözlü oynatmayı arayana yönelik metne odaklı tutar ve planlama metninin
sese sızmasını önler.

### Konuşma başlangıç davranışı

Giden `conversation` aramaları için ilk ileti işleme canlı oynatma durumuna
bağlıdır:

- Araya girme kuyruk temizliği ve otomatik yanıt yalnızca ilk selamlama aktif olarak konuşulurken bastırılır.
- İlk oynatma başarısız olursa arama `listening` durumuna döner ve ilk ileti yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, akış bağlandığında ek gecikme olmadan başlar.
- Araya girme aktif oynatmayı iptal eder ve kuyruğa alınmış ama henüz oynatılmayan Twilio TTS girdilerini temizler. Temizlenen girdiler atlandı olarak çözümlenir; böylece takip yanıt mantığı asla çalmayacak sesi beklemeden devam edebilir.
- Gerçek zamanlı sesli konuşmalar, gerçek zamanlı akışın kendi açılış sırasını kullanır. Voice Call bu ilk ileti için eski bir `<Say>` TwiML güncellemesi göndermez; böylece giden `<Connect><Stream>` oturumları bağlı kalır.

### Twilio akış bağlantı kesme ek süresi

Bir Twilio medya akışının bağlantısı kesildiğinde Voice Call aramayı otomatik
sonlandırmadan önce **2000 ms** bekler:

- Akış bu süre içinde yeniden bağlanırsa otomatik sonlandırma iptal edilir.
- Ek sürenin ardından hiçbir akış yeniden kaydolmazsa takılı aktif aramaları önlemek için arama sonlandırılır.

## Eski arama temizleyici

Terminal Webhook hiç almayan aramaları sonlandırmak için `staleCallReaperSeconds`
kullanın (örneğin hiç tamamlanmayan bildirim modu aramaları). Varsayılan değer
`0`dır (devre dışı).

Önerilen aralıklar:

- **Üretim:** Bildirim tarzı akışlar için `120`-`300` saniye.
- Normal aramaların tamamlanabilmesi için bu değeri **`maxDurationSeconds` değerinden yüksek** tutun. İyi bir başlangıç noktası `maxDurationSeconds + 30-60` saniyedir.

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

Gateway'in önünde bir proxy veya tünel olduğunda Plugin imza doğrulaması için
genel URL'yi yeniden oluşturur. Bu seçenekler hangi yönlendirilen başlıkların
güvenilir kabul edileceğini denetler:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Yönlendirme başlıklarından gelen hostlara izin ver.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  İzin listesi olmadan yönlendirilen başlıklara güven.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Yalnızca isteğin uzak IP'si listeyle eşleştiğinde yönlendirilen başlıklara güven.
</ParamField>

Ek korumalar:

- Webhook **yeniden oynatma koruması** Twilio ve Plivo için etkindir. Yeniden oynatılan geçerli Webhook istekleri onaylanır, ancak yan etkiler için atlanır.
- Twilio konuşma sıraları `<Gather>` geri çağrılarında sıra başına bir token içerir; böylece eski/yeniden oynatılan konuşma geri çağrıları daha yeni bekleyen bir transkript sırasını karşılayamaz.
- Kimliği doğrulanmamış Webhook istekleri, sağlayıcının gerekli imza başlıkları eksik olduğunda gövde okumalarından önce reddedilir.
- voice-call Webhook'u, paylaşılan ön kimlik doğrulama gövde profilini (64 KB / 5 saniye) ve imza doğrulamasından önce IP başına uçuşta istek sınırını kullanır.

Sabit genel host içeren örnek:

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

Gateway zaten çalışıyorsa operasyonel `voicecall` komutları Gateway'in sahip
olduğu voice-call çalışma zamanına devreder; böylece CLI ikinci bir Webhook
sunucusu bağlamaz. Hiçbir Gateway'e erişilemiyorsa komutlar bağımsız bir CLI
çalışma zamanına geri döner.

`latency`, varsayılan sesli arama depolama yolundan `calls.jsonl` dosyasını okur.
Farklı bir günlüğe işaret etmek için `--file <path>`, analizi son N kayıtla
sınırlamak için `--last <n>` kullanın (varsayılan 200). Çıktı, dönüş gecikmesi
ve dinleme-bekleme süreleri için p50/p90/p99 içerir.

## Ajan aracı

Araç adı: `voice_call`.

| Eylem           | Argümanlar                                 |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Bu repo, `skills/voice-call/SKILL.md` konumunda eşleşen bir yetenek belgesiyle gelir.

## Gateway RPC

| Yöntem              | Argümanlar                                 |
| ------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` yalnızca `mode: "conversation"` ile geçerlidir. Bildirim modu
aramaları, bağlantı sonrası rakamlara ihtiyaç duyuyorsa arama oluşturulduktan
sonra `voicecall.dtmf` kullanmalıdır.

## Sorun giderme

### Kurulum Webhook erişimini başaramıyor

Kurulumu Gateway’i çalıştıran aynı ortamdan çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx` ve `plivo` için `webhook-exposure` yeşil olmalıdır.
Yapılandırılmış bir `publicUrl`, yerel veya özel ağ alanına işaret ettiğinde
yine de başarısız olur, çünkü operatör bu adreslere geri arama yapamaz.
`publicUrl` olarak `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`,
`172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` veya
`fd00::/8` kullanmayın.

Twilio bildirim modu giden aramaları, ilk `<Say>` TwiML öğesini doğrudan
arama oluşturma isteğinde gönderir; bu nedenle ilk konuşulan mesaj, Twilio’nun
Webhook TwiML getirmesine bağlı değildir. Durum geri çağrıları, konuşma
aramaları, bağlantı öncesi DTMF, gerçek zamanlı akışlar ve bağlantı sonrası
arama denetimi için herkese açık bir Webhook yine de gereklidir.

Tek bir herkese açık erişim yolu kullanın:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Yapılandırmayı değiştirdikten sonra Gateway’i yeniden başlatın veya yeniden
yükleyin, ardından şunu çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`, `--yes` iletmediğiniz sürece bir kuru çalıştırmadır.

### Sağlayıcı kimlik bilgileri başarısız oluyor

Seçilen sağlayıcıyı ve gerekli kimlik bilgisi alanlarını kontrol edin:

- Twilio: `twilio.accountSid`, `twilio.authToken` ve `fromNumber`, veya
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` ve `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` ve
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` ve `fromNumber`.

Kimlik bilgileri Gateway ana makinesinde mevcut olmalıdır. Yerel bir kabuk
profilini düzenlemek, Gateway yeniden başlatılana veya ortamını yeniden
yükleyene kadar halihazırda çalışan Gateway’i etkilemez.

### Aramalar başlıyor ancak sağlayıcı Webhook’ları gelmiyor

Sağlayıcı konsolunun tam herkese açık Webhook URL’sine işaret ettiğini doğrulayın:

```text
https://voice.example.com/voice/webhook
```

Ardından çalışma zamanı durumunu inceleyin:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Yaygın nedenler:

- `publicUrl`, `serve.path` değerinden farklı bir yola işaret ediyor.
- Tünel URL’si Gateway başladıktan sonra değişti.
- Bir proxy isteği iletiyor ancak host/proto üstbilgilerini kaldırıyor veya yeniden yazıyor.
- Güvenlik duvarı ya da DNS, herkese açık ana makine adını Gateway dışında bir yere yönlendiriyor.
- Gateway, Voice Call Plugin etkinleştirilmeden yeniden başlatıldı.

Gateway’in önünde ters proxy veya tünel olduğunda, `webhookSecurity.allowedHosts`
değerini herkese açık ana makine adına ayarlayın ya da bilinen bir proxy adresi
için `webhookSecurity.trustedProxyIPs` kullanın. `webhookSecurity.trustForwardingHeaders`
değerini yalnızca proxy sınırı sizin denetiminizdeyse kullanın.

### İmza doğrulaması başarısız oluyor

Sağlayıcı imzaları, OpenClaw’un gelen istekten yeniden oluşturduğu herkese açık
URL’ye göre kontrol edilir. İmzalar başarısız olursa:

- Sağlayıcı Webhook URL’sinin şema, ana makine ve yol dahil olmak üzere
  `publicUrl` ile tam olarak eşleştiğini doğrulayın.
- ngrok ücretsiz katman URL’leri için tünel ana makine adı değiştiğinde `publicUrl`
  değerini güncelleyin.
- Proxy’nin özgün host ve proto üstbilgilerini koruduğundan emin olun veya
  `webhookSecurity.allowedHosts` yapılandırın.
- Yerel testler dışında `skipSignatureVerification` etkinleştirmeyin.

### Google Meet Twilio katılımları başarısız oluyor

Google Meet, Twilio arayarak katılımları için bu Plugin’i kullanır. Önce Voice Call’u doğrulayın:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Ardından Google Meet aktarımını açıkça doğrulayın:

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call yeşilse ancak Meet katılımcısı hiç katılmıyorsa Meet arama numarasını,
PIN’i ve `--dtmf-sequence` değerini kontrol edin. Telefon araması sağlıklı
olabilir, ancak toplantı yanlış bir DTMF dizisini reddediyor veya yok sayıyor olabilir.

Google Meet, Meet DTMF dizisini ve giriş metnini `voicecall.start` öğesine iletir.
Twilio aramaları için Voice Call önce DTMF TwiML sunar, Webhook’a geri yönlendirir,
ardından gerçek zamanlı medya akışını açar; böylece kaydedilen giriş, telefon
katılımcısı toplantıya katıldıktan sonra oluşturulur.

Canlı aşama izini görmek için `openclaw logs --follow` kullanın. Sağlıklı bir
Twilio Meet katılımı şu sırayla günlüğe kaydedilir:

- Google Meet, Twilio katılımını Voice Call’a devreder.
- Voice Call, bağlantı öncesi DTMF TwiML depolar.
- Twilio ilk TwiML, gerçek zamanlı işleme başlamadan önce tüketilir ve sunulur.
- Voice Call, Twilio araması için gerçek zamanlı TwiML sunar.
- Gerçek zamanlı köprü, ilk selamlama kuyruğa alınmış halde başlar.

`openclaw voicecall tail` kalıcı arama kayıtlarını yine gösterir; arama durumu
ve dökümler için kullanışlıdır, ancak her Webhook/gerçek zamanlı geçiş burada
görünmez.

### Gerçek zamanlı aramada konuşma yok

Yalnızca tek bir ses modunun etkin olduğunu doğrulayın. `realtime.enabled` ve
`streaming.enabled` aynı anda true olamaz.

Gerçek zamanlı Twilio aramaları için şunları da doğrulayın:

- Bir gerçek zamanlı sağlayıcı Plugin’i yüklendi ve kaydedildi.
- `realtime.provider` ayarlanmamış veya kayıtlı bir sağlayıcıyı adlandırıyor.
- Sağlayıcı API anahtarı Gateway işlemi tarafından kullanılabilir durumda.
- `openclaw logs --follow`, gerçek zamanlı TwiML sunulduğunu, gerçek zamanlı
  köprünün başladığını ve ilk selamlamanın kuyruğa alındığını gösteriyor.

## İlgili

- [Konuşma modu](/tr/nodes/talk)
- [Metinden sese](/tr/tools/tts)
- [Sesle uyandırma](/tr/nodes/voicewake)
