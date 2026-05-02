---
read_when:
    - OpenClaw üzerinden giden bir sesli arama başlatmak istiyorsunuz
    - Sesli arama Plugin'ini yapılandırıyor veya geliştiriyorsunuz
    - Telefonide gerçek zamanlı sese veya akış halinde yazıya dökmeye ihtiyacınız var
sidebarTitle: Voice call
summary: Twilio, Telnyx veya Plivo aracılığıyla giden sesli aramalar yapın ve gelen sesli aramaları kabul edin; isteğe bağlı gerçek zamanlı ses ve akışlı transkripsiyon desteğiyle
title: Sesli arama Plugin'i
x-i18n:
    generated_at: "2026-05-02T22:21:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw için bir Plugin aracılığıyla sesli aramalar. Giden bildirimleri,
çok turlu konuşmaları, tam çift yönlü gerçek zamanlı sesi, akış halinde
transkripsiyonu ve izin listesi ilkeleriyle gelen aramaları destekler.

**Mevcut sağlayıcılar:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (geliştirme/ağ yok).

<Note>
Voice Call Plugin **Gateway sürecinin içinde** çalışır. Uzak bir Gateway
kullanıyorsanız Plugin'i Gateway'in çalıştığı makineye kurup yapılandırın,
ardından yüklenmesi için Gateway'i yeniden başlatın.
</Note>

## Hızlı başlangıç

<Steps>
  <Step title="Plugin'i kur">
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

    Mevcut resmi yayın etiketini izlemek için çıplak paketi kullanın. Tam
    bir sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

    Ardından Plugin'in yüklenmesi için Gateway'i yeniden başlatın.

  </Step>
  <Step title="Sağlayıcıyı ve Webhook'u yapılandır">
    Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın
    (tam yapı için aşağıdaki [Yapılandırma](#configuration) bölümüne bakın).
    En az şunlar gerekir: `provider`, sağlayıcı kimlik bilgileri,
    `fromNumber` ve herkese açık erişilebilir bir Webhook URL'si.
  </Step>
  <Step title="Kurulumu doğrula">
    ```bash
    openclaw voicecall setup
    ```

    Varsayılan çıktı sohbet günlüklerinde ve terminallerde okunabilir.
    Plugin'in etkinleştirilmesini, sağlayıcı kimlik bilgilerini, Webhook
    erişimini ve yalnızca bir ses modunun (`streaming` veya `realtime`)
    etkin olduğunu denetler. Betikler için `--json` kullanın.

  </Step>
  <Step title="Smoke testi">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Her ikisi de varsayılan olarak deneme çalıştırmasıdır. Kısa bir giden
    bildirim aramasını gerçekten başlatmak için `--yes` ekleyin:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx ve Plivo için kurulumun **herkese açık bir Webhook URL'sine**
çözümlenmesi gerekir. `publicUrl`, tünel URL'si, Tailscale URL'si veya serve
geri dönüşü loopback ya da özel ağ alanına çözümlenirse kurulum, operatör
Webhook'larını alamayacak bir sağlayıcıyı başlatmak yerine başarısız olur.
</Warning>

## Yapılandırma

`enabled: true` ise ancak seçilen sağlayıcının kimlik bilgileri eksikse,
Gateway başlatma günlükleri eksik anahtarlarla birlikte kurulum-eksik
uyarısı kaydeder ve runtime'ı başlatmayı atlar. Komutlar, RPC çağrıları ve
ajan araçları kullanıldığında yine de eksik sağlayıcı yapılandırmasını tam
olarak döndürür.

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
    - Twilio, Telnyx ve Plivo'nun tümü **herkese açık erişilebilir** bir Webhook URL'si gerektirir.
    - `mock`, yerel geliştirme sağlayıcısıdır (ağ çağrısı yoktur).
    - `skipSignatureVerification` true değilse Telnyx `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
    - `skipSignatureVerification` yalnızca yerel test içindir.
    - ngrok ücretsiz katmanında `publicUrl` değerini tam ngrok URL'sine ayarlayın; imza doğrulaması her zaman uygulanır.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`, yalnızca `tunnel.provider="ngrok"` olduğunda ve `serve.bind` loopback olduğunda (ngrok yerel ajanı) geçersiz imzalı Twilio Webhook'larına izin verir. Yalnızca yerel geliştirme içindir.
    - Ngrok ücretsiz katman URL'leri değişebilir veya ara sayfa davranışı ekleyebilir; `publicUrl` kayarsa Twilio imzaları başarısız olur. Üretim: kararlı bir alan adını veya Tailscale funnel'ını tercih edin.

  </Accordion>
  <Accordion title="Akış bağlantısı sınırları">
    - `streaming.preStartTimeoutMs`, hiçbir zaman geçerli bir `start` çerçevesi göndermeyen soketleri kapatır.
    - `streaming.maxPendingConnections`, toplam kimliği doğrulanmamış başlatma öncesi soketleri sınırlar.
    - `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlatma öncesi soketleri sınırlar.
    - `streaming.maxConnections`, toplam açık medya akışı soketlerini (bekleyen + etkin) sınırlar.

  </Accordion>
  <Accordion title="Eski yapılandırma geçişleri">
    `provider: "log"`, `twilio.from` veya eski `streaming.*` OpenAI anahtarlarını
    kullanan eski yapılandırmalar `openclaw doctor --fix` tarafından yeniden
    yazılır. Runtime geri dönüşü şimdilik eski voice-call anahtarlarını kabul
    etmeye devam eder, ancak yeniden yazma yolu `openclaw doctor --fix` ve
    uyumluluk uyarlama katmanı geçicidir.

    Otomatik geçirilen streaming anahtarları:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Oturum kapsamı

Varsayılan olarak Voice Call `sessionScope: "per-phone"` kullanır; böylece
aynı arayandan gelen tekrar aramalar konuşma belleğini korur. Her operatör
aramasının taze bağlamla başlaması gerektiğinde, örneğin resepsiyon,
rezervasyon, IVR veya aynı telefon numarasının farklı toplantıları temsil
edebileceği Google Meet köprü akışlarında `sessionScope: "per-call"` ayarlayın.

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı arama sesi için tam çift yönlü gerçek zamanlı ses
sağlayıcısını seçer. Bu, sesi yalnızca gerçek zamanlı transkripsiyon
sağlayıcılarına ileten `streaming`'den ayrıdır.

<Warning>
`realtime.enabled`, `streaming.enabled` ile birleştirilemez. Arama başına bir
ses modu seçin.
</Warning>

Mevcut runtime davranışı:

- `realtime.enabled`, Twilio Media Streams için desteklenir.
- `realtime.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call ilk kayıtlı gerçek zamanlı ses sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı ses sağlayıcıları: Google Gemini Live (`google`) ve OpenAI (`openai`), kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `realtime.providers.<providerId>` altında bulunur.
- Voice Call, paylaşılan `openclaw_agent_consult` gerçek zamanlı aracını varsayılan olarak sunar. Arayan daha derin akıl yürütme, güncel bilgi veya normal OpenClaw araçları istediğinde gerçek zamanlı model bunu çağırabilir.
- `realtime.fastContext.enabled` varsayılan olarak kapalıdır. Etkinleştirildiğinde Voice Call önce danışma sorusu için dizinlenmiş bellek/oturum bağlamında arama yapar ve tam danışma ajanına yalnızca `realtime.fastContext.fallbackToConsult` true ise geri dönmeden önce bu parçacıkları `realtime.fastContext.timeoutMs` içinde gerçek zamanlı modele döndürür.
- `realtime.provider` kayıtlı olmayan bir sağlayıcıyı gösteriyorsa veya hiçbir gerçek zamanlı ses sağlayıcısı kayıtlı değilse Voice Call bir uyarı günlüğe kaydeder ve tüm Plugin'i başarısız kılmak yerine gerçek zamanlı medyayı atlar.
- Danışma oturumu anahtarları mevcut olduğunda depolanan arama oturumunu yeniden kullanır, ardından yapılandırılmış `sessionScope` değerine geri döner (varsayılan olarak `per-phone` veya yalıtılmış aramalar için `per-call`).

### Araç ilkesi

`realtime.toolPolicy`, danışma çalıştırmasını kontrol eder:

| İlke             | Davranış                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Danışma aracını sunar ve normal ajanı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar. |
| `owner`          | Danışma aracını sunar ve normal ajanın normal ajan araç ilkesini kullanmasına izin verir.                                                      |
| `none`           | Danışma aracını sunmaz. Özel `realtime.tools` yine de gerçek zamanlı sağlayıcıya geçirilir.                               |

### Gerçek zamanlı sağlayıcı örnekleri

<Tabs>
  <Tab title="Google Gemini Live">
    Varsayılanlar: `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` veya `GOOGLE_GENERATIVE_AI_API_KEY` kaynaklı API anahtarı; model
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

Sağlayıcıya özgü gerçek zamanlı ses seçenekleri için
[Google sağlayıcısı](/tr/providers/google) ve
[OpenAI sağlayıcısı](/tr/providers/openai) bölümlerine bakın.

## Akış transkripsiyonu

`streaming`, canlı arama sesi için gerçek zamanlı transkripsiyon sağlayıcısını seçer.

Mevcut runtime davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call, ilk kayıtlı gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Birlikte gelen gerçek zamanlı transkripsiyon sağlayıcıları: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI (`xai`); bunlar kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `streaming.providers.<providerId>` altında bulunur.
- Twilio kabul edilmiş bir akış `start` iletisi gönderdikten sonra Voice Call akışı hemen kaydeder, sağlayıcı bağlanırken gelen medyayı transkripsiyon sağlayıcısı üzerinden kuyruğa alır ve ilk karşılamayı yalnızca gerçek zamanlı transkripsiyon hazır olduktan sonra başlatır.
- `streaming.provider` kayıtlı olmayan bir sağlayıcıyı gösterirse veya hiç sağlayıcı kayıtlı değilse Voice Call bir uyarı günlüğe yazar ve tüm Plugin'i başarısız kılmak yerine medya akışını atlar.

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

## Aramalar için TTS

Voice Call, aramalarda akış konuşması için çekirdek `messages.tts`
yapılandırmasını kullanır. Bunu Plugin yapılandırması altında
**aynı biçimle** geçersiz kılabilirsiniz; `messages.tts` ile derin birleştirme yapar.

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
**Microsoft speech sesli aramalar için yok sayılır.** Telefon sesi PCM gerektirir;
mevcut Microsoft aktarımı telefon PCM çıktısını açığa çıkarmaz.
</Warning>

Davranış notları:

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) `openclaw doctor --fix` tarafından onarılır; commit edilen yapılandırma `tts.providers.<provider>` kullanmalıdır.
- Twilio medya akışı etkinleştirildiğinde çekirdek TTS kullanılır; aksi halde aramalar sağlayıcıya özgü seslere geri döner.
- Bir Twilio medya akışı zaten etkinse Voice Call, TwiML `<Say>` seçeneğine geri dönmez. Bu durumda telefon TTS kullanılamıyorsa, oynatma isteği iki oynatma yolunu karıştırmak yerine başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya geri döndüğünde Voice Call, hata ayıklama için sağlayıcı zinciriyle (`from`, `to`, `attempts`) birlikte bir uyarı günlüğe yazar.
- Twilio barge-in veya akış kapatma bekleyen TTS kuyruğunu temizlediğinde, kuyruğa alınmış oynatma istekleri oynatma tamamlanmasını bekleyen arayanları askıda bırakmak yerine sonuçlanır.

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
`inboundPolicy: "allowlist"` düşük güvence düzeyinde bir arayan kimliği filtresidir. Plugin,
sağlayıcının sağladığı `From` değerini normalleştirir ve bunu
`allowFrom` ile karşılaştırır. Webhook doğrulaması sağlayıcı teslimini ve
yük bütünlüğünü kimlik doğrular, ancak PSTN/VoIP arayan numarası
sahipliğini **kanıtlamaz**. `allowFrom` değerini güçlü arayan
kimliği değil, arayan kimliği filtreleme olarak değerlendirin.
</Warning>

Otomatik yanıtlar ajan sistemini kullanır. `responseModel`,
`responseSystemPrompt` ve `responseTimeoutMs` ile ayarlayın.

### Numara Başına Yönlendirme

Tek bir Voice Call Plugin'i birden fazla telefon numarası için arama aldığında
ve her numaranın farklı bir hat gibi davranması gerektiğinde `numbers` kullanın.
Örneğin bir numara samimi bir kişisel asistan kullanırken başka bir numara
iş kişiliği, farklı bir yanıt ajanı ve farklı bir TTS sesi kullanabilir.

Rotalar, sağlayıcının sağladığı aranmış `To` numarasından seçilir. Anahtarlar
E.164 numaraları olmalıdır. Bir arama geldiğinde Voice Call eşleşen rotayı bir kez çözer,
eşleşen rotayı arama kaydında saklar ve karşılama, klasik otomatik yanıt yolu,
gerçek zamanlı danışma yolu ve TTS oynatma için bu etkili yapılandırmayı
yeniden kullanır. Hiçbir rota eşleşmezse genel Voice Call yapılandırması kullanılır.
Giden aramalar `numbers` kullanmaz; aramayı başlatırken giden hedefi, iletiyi ve
oturumu açıkça geçirin.

Rota geçersiz kılmaları şu anda şunları destekler:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` rota değeri, genel Voice Call `tts` yapılandırmasının üzerine derin birleştirilir; bu nedenle
genellikle yalnızca sağlayıcı sesini geçersiz kılabilirsiniz:

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

### Sesli çıktı sözleşmesi

Otomatik yanıtlar için Voice Call, sistem istemine katı bir sesli çıktı sözleşmesi ekler:

```text
{"spoken":"..."}
```

Voice Call konuşma metnini savunmalı biçimde çıkarır:

- Akıl yürütme/hata içeriği olarak işaretlenmiş yükleri yok sayar.
- Doğrudan JSON, çitlenmiş JSON veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, sesli oynatmanın arayana yönelik metne odaklanmasını sağlar ve
planlama metninin sese sızmasını önler.

### Konuşma başlatma davranışı

Giden `conversation` aramaları için ilk ileti işleme, canlı oynatma durumuna bağlıdır:

- Barge-in kuyruk temizleme ve otomatik yanıt yalnızca ilk karşılama etkin şekilde konuşulurken bastırılır.
- İlk oynatma başarısız olursa arama `listening` durumuna döner ve ilk ileti yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, akış bağlantısında ek gecikme olmadan başlar.
- Barge-in etkin oynatmayı iptal eder ve kuyruğa alınmış ancak henüz oynatılmayan Twilio TTS girdilerini temizler. Temizlenen girdiler atlanmış olarak çözümlenir; böylece takip yanıt mantığı hiç oynatılmayacak sesi beklemeden devam edebilir.
- Gerçek zamanlı sesli konuşmalar, gerçek zamanlı akışın kendi açılış turunu kullanır. Voice Call bu ilk ileti için eski `<Say>` TwiML güncellemesi göndermez; böylece giden `<Connect><Stream>` oturumları bağlı kalır.

### Twilio akış bağlantısı kesilme ek süresi

Bir Twilio medya akışının bağlantısı kesildiğinde Voice Call, aramayı otomatik sonlandırmadan önce
**2000 ms** bekler:

- Akış bu pencere içinde yeniden bağlanırsa otomatik sonlandırma iptal edilir.
- Ek süre sonrasında hiçbir akış yeniden kaydedilmezse takılı kalmış etkin aramaları önlemek için arama sonlandırılır.

## Eski arama temizleyici

Hiçbir zaman terminal Webhook almayan aramaları (örneğin hiç tamamlanmayan
bildirim modu aramaları) sonlandırmak için `staleCallReaperSeconds` kullanın.
Varsayılan değer `0` (devre dışı) şeklindedir.

Önerilen aralıklar:

- **Üretim:** bildirim tarzı akışlar için `120`-`300` saniye.
- Normal aramaların bitirebilmesi için bu değeri **`maxDurationSeconds` değerinden yüksek** tutun. İyi bir başlangıç noktası `maxDurationSeconds + 30–60` saniyedir.

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

Gateway önünde bir proxy veya tünel bulunduğunda Plugin,
imza doğrulaması için genel URL'yi yeniden oluşturur. Bu seçenekler,
hangi iletilen başlıkların güvenilir kabul edildiğini denetler:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  İletme başlıklarından gelen host'lar için allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  İletilen başlıklara allowlist olmadan güven.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  İletilen başlıklara yalnızca isteğin uzak IP'si listeyle eşleştiğinde güven.
</ParamField>

Ek korumalar:

- Webhook **yeniden oynatma koruması** Twilio ve Plivo için etkindir. Yeniden oynatılan geçerli Webhook istekleri onaylanır ancak yan etkiler için atlanır.
- Twilio konuşma turları `<Gather>` geri çağrılarında tur başına bir token içerir; böylece eski/yeniden oynatılmış konuşma geri çağrıları daha yeni bekleyen bir transkript turunu karşılayamaz.
- Kimliği doğrulanmamış Webhook istekleri, sağlayıcının gerekli imza başlıkları eksik olduğunda gövde okunmadan önce reddedilir.
- voice-call Webhook'u, paylaşılan ön kimlik doğrulama gövde profilini (64 KB / 5 saniye) ve imza doğrulaması öncesinde IP başına uçuşta istek sınırını kullanır.

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

Gateway zaten çalışıyorsa operasyonel `voicecall` komutları,
CLI'nin ikinci bir Webhook sunucusu bağlamaması için Gateway'e ait voice-call çalışma zamanına temsil edilir.
Hiçbir Gateway'e ulaşılamazsa komutlar bağımsız bir CLI çalışma zamanına geri döner.

`latency`, varsayılan sesli çağrı depolama yolundan `calls.jsonl` dosyasını okur.
Farklı bir günlüğe işaret etmek için `--file <path>`, analizi son N kayıtla
sınırlamak için `--last <n>` kullanın (varsayılan 200). Çıktı, dönüş gecikmesi
ve dinleme-bekleme süreleri için p50/p90/p99 değerlerini içerir.

## Aracı aracı

Araç adı: `voice_call`.

| Eylem           | Argümanlar                                |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Bu repo, `skills/voice-call/SKILL.md` konumunda eşleşen bir skill belgesiyle gelir.

## Gateway RPC

| Yöntem              | Argümanlar                                |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` yalnızca `mode: "conversation"` ile geçerlidir. Bildirim modu çağrıları,
bağlantı sonrası rakamlara ihtiyaç duyuyorsa çağrı oluştuktan sonra
`voicecall.dtmf` kullanmalıdır.

## Sorun giderme

### Kurulum Webhook dışa açılımında başarısız oluyor

Kurulumu Gateway’i çalıştıran aynı ortamdan çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx` ve `plivo` için `webhook-exposure` yeşil olmalıdır. Yapılandırılmış
bir `publicUrl`, yerel veya özel ağ alanına işaret ettiğinde yine de başarısız olur,
çünkü taşıyıcı bu adreslere geri çağrı yapamaz. `publicUrl` olarak
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` veya `fd00::/8` kullanmayın.

Twilio bildirim modu giden çağrıları, ilk `<Say>` TwiML içeriğini doğrudan
çağrı oluşturma isteğinde gönderir; bu yüzden ilk konuşulan mesaj Twilio’nun
Webhook TwiML getirmesine bağlı değildir. Durum geri çağrıları, konuşma çağrıları,
bağlantı öncesi DTMF, gerçek zamanlı akışlar ve bağlantı sonrası çağrı denetimi
için genel bir Webhook yine de gereklidir.

Tek bir genel dışa açılım yolu kullanın:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // veya
          tunnel: { provider: "ngrok" },
          // veya
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Yapılandırmayı değiştirdikten sonra Gateway’i yeniden başlatın veya yeniden yükleyin, ardından şunu çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`, `--yes` geçmediğiniz sürece bir deneme çalışmasıdır.

### Sağlayıcı kimlik bilgileri başarısız oluyor

Seçilen sağlayıcıyı ve gerekli kimlik bilgisi alanlarını kontrol edin:

- Twilio: `twilio.accountSid`, `twilio.authToken` ve `fromNumber`, veya
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` ve `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` ve
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` ve `fromNumber`.

Kimlik bilgileri Gateway ana makinesinde bulunmalıdır. Yerel bir kabuk profilini
düzenlemek, Gateway yeniden başlatılana veya ortamını yeniden yükleyene kadar
zaten çalışan bir Gateway’i etkilemez.

### Çağrılar başlıyor ancak sağlayıcı Webhook’ları gelmiyor

Sağlayıcı konsolunun tam genel Webhook URL’sini işaret ettiğini doğrulayın:

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
- Gateway başladıktan sonra tünel URL’si değişti.
- Bir proxy isteği iletiyor ancak host/proto başlıklarını çıkarıyor veya yeniden yazıyor.
- Güvenlik duvarı ya da DNS, genel ana makine adını Gateway dışında bir yere yönlendiriyor.
- Gateway, Voice Call plugin etkinleştirilmeden yeniden başlatıldı.

Gateway’in önünde bir ters proxy veya tünel olduğunda,
`webhookSecurity.allowedHosts` değerini genel ana makine adına ayarlayın ya da
bilinen bir proxy adresi için `webhookSecurity.trustedProxyIPs` kullanın.
`webhookSecurity.trustForwardingHeaders` değerini yalnızca proxy sınırı sizin
kontrolünüz altındaysa kullanın.

### İmza doğrulaması başarısız oluyor

Sağlayıcı imzaları, OpenClaw’un gelen istekten yeniden oluşturduğu genel URL’ye
karşı denetlenir. İmzalar başarısız olursa:

- Sağlayıcı Webhook URL’sinin şema, host ve yol dahil olmak üzere `publicUrl` ile birebir eşleştiğini doğrulayın.
- ngrok ücretsiz katman URL’leri için, tünel ana makine adı değiştiğinde `publicUrl` değerini güncelleyin.
- Proxy’nin özgün host ve proto başlıklarını koruduğundan emin olun veya
  `webhookSecurity.allowedHosts` yapılandırın.
- Yerel test dışında `skipSignatureVerification` etkinleştirmeyin.

### Google Meet Twilio katılımları başarısız oluyor

Google Meet, Twilio çevirmeli katılımları için bu plugin’i kullanır. Önce Voice Call’u doğrulayın:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Ardından Google Meet taşımasını açıkça doğrulayın:

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call yeşilse ancak Meet katılımcısı hiç katılmıyorsa, Meet çevirmeli
numarasını, PIN’i ve `--dtmf-sequence` değerini kontrol edin. Toplantı yanlış
bir DTMF dizisini reddederken veya yok sayarken telefon çağrısı sağlıklı olabilir.

Google Meet, Meet DTMF dizisini ve giriş metnini `voicecall.start` öğesine geçirir.
Twilio çağrıları için Voice Call önce DTMF TwiML sunar, Webhook’a geri yönlendirir,
ardından gerçek zamanlı medya akışını açar; böylece kaydedilen giriş, telefon
katılımcısı toplantıya katıldıktan sonra oluşturulur.

Canlı aşama izleri için `openclaw logs --follow` kullanın. Sağlıklı bir Twilio Meet
katılımı şu sırayı günlüğe yazar:

- Google Meet, Twilio katılımını Voice Call’a devreder.
- Voice Call, bağlantı öncesi DTMF TwiML saklar.
- Twilio ilk TwiML içeriği tüketilir ve gerçek zamanlı işlemden önce sunulur.
- Voice Call, Twilio çağrısı için gerçek zamanlı TwiML sunar.
- Gerçek zamanlı köprü, ilk selamlama sıraya alınmış olarak başlar.

`openclaw voicecall tail` kalıcı çağrı kayıtlarını göstermeye devam eder; çağrı
durumu ve dökümler için kullanışlıdır, ancak her Webhook/gerçek zamanlı geçiş
orada görünmez.

### Gerçek zamanlı çağrıda konuşma yok

Yalnızca bir ses modunun etkin olduğunu doğrulayın. `realtime.enabled` ve
`streaming.enabled` ikisi birden true olamaz.

Gerçek zamanlı Twilio çağrıları için ayrıca şunları doğrulayın:

- Bir gerçek zamanlı sağlayıcı plugin’i yüklenmiş ve kaydedilmiş.
- `realtime.provider` ayarlanmamış ya da kayıtlı bir sağlayıcıyı adlandırıyor.
- Sağlayıcı API anahtarı Gateway işlemi tarafından kullanılabilir.
- `openclaw logs --follow`, gerçek zamanlı TwiML sunulduğunu, gerçek zamanlı köprünün
  başladığını ve ilk selamlamanın sıraya alındığını gösteriyor.

## İlgili

- [Konuşma modu](/tr/nodes/talk)
- [Metinden konuşmaya](/tr/tools/tts)
- [Sesle uyandırma](/tr/nodes/voicewake)
