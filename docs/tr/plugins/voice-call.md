---
read_when:
    - OpenClaw'dan giden bir sesli arama yapmak istiyorsunuz
    - Sesli arama Plugin'ini yapılandırıyor veya geliştiriyorsunuz
    - Telefonide gerçek zamanlı sese veya akışlı transkripsiyona ihtiyacınız var
sidebarTitle: Voice call
summary: Twilio, Telnyx veya Plivo aracılığıyla giden sesli aramalar yapın ve gelen sesli aramaları kabul edin; isteğe bağlı gerçek zamanlı ses ve akışlı transkripsiyon desteğiyle
title: Sesli arama Plugin'i
x-i18n:
    generated_at: "2026-05-10T19:50:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94e3942b8330ebf2014f1899267f69f8a135859cfa1002ae390244a4f89883d6
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw için bir Plugin aracılığıyla sesli aramalar. Giden bildirimleri,
çok turlu konuşmaları, tam çift yönlü gerçek zamanlı sesi, akış
transkripsiyonunu ve izin listesi politikalarıyla gelen aramaları destekler.

**Geçerli sağlayıcılar:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (geliştirme/ağ yok).

<Note>
Voice Call Plugin'i **Gateway sürecinin içinde** çalışır. Uzak bir
Gateway kullanıyorsanız, Plugin'i Gateway'i çalıştıran makineye kurup
yapılandırın, ardından yüklenmesi için Gateway'i yeniden başlatın.
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

    Geçerli resmi sürüm etiketini izlemek için yalın paketi kullanın.
    Tam sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

    Ardından Plugin'in yüklenmesi için Gateway'i yeniden başlatın.

  </Step>
  <Step title="Sağlayıcıyı ve Webhook'u yapılandırın">
    Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın
    (tam yapı için aşağıdaki [Yapılandırma](#configuration) bölümüne bakın).
    En azından şunlar gerekir: `provider`, sağlayıcı kimlik bilgileri,
    `fromNumber` ve herkese açık erişilebilen bir Webhook URL'si.
  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    openclaw voicecall setup
    ```

    Varsayılan çıktı sohbet günlüklerinde ve terminallerde okunabilir
    biçimdedir. Plugin'in etkinleştirilmesini, sağlayıcı kimlik bilgilerini,
    Webhook erişilebilirliğini ve yalnızca bir ses modunun (`streaming` veya
    `realtime`) etkin olduğunu denetler. Betikler için `--json` kullanın.

  </Step>
  <Step title="Duman testi">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Varsayılan olarak ikisi de kuru çalıştırmadır. Kısa bir giden bildirim
    aramasını gerçekten yapmak için `--yes` ekleyin:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx ve Plivo için kurulumun **herkese açık bir Webhook URL'sine**
çözümlenmesi gerekir. `publicUrl`, tünel URL'si, Tailscale URL'si veya
sunma yedeği local loopback'e ya da özel ağ alanına çözümlenirse, kurulum
operatör Webhook'larını alamayacak bir sağlayıcı başlatmak yerine başarısız olur.
</Warning>

## Yapılandırma

`enabled: true` ise ancak seçili sağlayıcının kimlik bilgileri eksikse,
Gateway başlangıcı eksik anahtarlarla birlikte kurulum-tamamlanmadı uyarısı
günlüğe yazar ve çalışma zamanını başlatmayı atlar. Komutlar, RPC çağrıları ve
aracı araçları kullanıldığında eksik sağlayıcı yapılandırmasını yine de tam
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
    - Twilio, Telnyx ve Plivo'nun tümü **herkese açık erişilebilen** bir Webhook URL'si gerektirir.
    - `mock`, yerel geliştirme sağlayıcısıdır (ağ çağrısı yoktur).
    - Telnyx, `skipSignatureVerification` true olmadığı sürece `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
    - `skipSignatureVerification` yalnızca yerel test içindir.
    - ngrok ücretsiz katmanında `publicUrl` değerini tam ngrok URL'sine ayarlayın; imza doğrulaması her zaman uygulanır.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`, Twilio Webhook'larına geçersiz imzalarla **yalnızca** `tunnel.provider="ngrok"` ve `serve.bind` local loopback olduğunda izin verir (ngrok yerel aracısı). Yalnızca yerel geliştirme içindir.
    - Ngrok ücretsiz katman URL'leri değişebilir veya ara sayfa davranışı ekleyebilir; `publicUrl` saparsa Twilio imzaları başarısız olur. Üretim: kararlı bir alan adı veya Tailscale funnel tercih edin.

  </Accordion>
  <Accordion title="Akış bağlantısı sınırları">
    - `streaming.preStartTimeoutMs`, hiçbir zaman geçerli bir `start` çerçevesi göndermeyen soketleri kapatır.
    - `streaming.maxPendingConnections`, toplam kimliği doğrulanmamış başlatma öncesi soket sayısını sınırlar.
    - `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlatma öncesi soket sayısını sınırlar.
    - `streaming.maxConnections`, toplam açık ortam akışı soket sayısını sınırlar (bekleyen + etkin).

  </Accordion>
  <Accordion title="Eski yapılandırma geçişleri">
    `provider: "log"`, `twilio.from` veya eski `streaming.*` OpenAI
    anahtarlarını kullanan eski yapılandırmalar `openclaw doctor --fix`
    tarafından yeniden yazılır. Çalışma zamanı yedeği şimdilik eski voice-call
    anahtarlarını hâlâ kabul eder, ancak yeniden yazma yolu `openclaw doctor --fix`
    ve uyumluluk katmanı geçicidir.

    Otomatik geçirilen akış anahtarları:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Oturum kapsamı

Varsayılan olarak Voice Call `sessionScope: "per-phone"` kullanır; böylece
aynı arayandan tekrarlanan aramalar konuşma belleğini korur. Her operatör
aramasının yeni bağlamla başlaması gerektiğinde `sessionScope: "per-call"`
ayarlayın; örneğin resepsiyon, rezervasyon, IVR veya aynı telefon numarasının
farklı toplantıları temsil edebileceği Google Meet köprü akışları.

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı arama sesi için tam çift yönlü gerçek zamanlı ses sağlayıcısını
seçer. Yalnızca sesi gerçek zamanlı transkripsiyon sağlayıcılarına ileten
`streaming`den ayrıdır.

<Warning>
`realtime.enabled`, `streaming.enabled` ile birlikte kullanılamaz. Her arama
için bir ses modu seçin.
</Warning>

Geçerli çalışma zamanı davranışı:

- `realtime.enabled`, Twilio Media Streams için desteklenir.
- `realtime.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call ilk kayıtlı gerçek zamanlı ses sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı ses sağlayıcıları: Google Gemini Live (`google`) ve OpenAI (`openai`), kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `realtime.providers.<providerId>` altında bulunur.
- Voice Call, paylaşılan `openclaw_agent_consult` gerçek zamanlı aracını varsayılan olarak sunar. Arayan daha derin akıl yürütme, güncel bilgi veya normal OpenClaw araçları istediğinde gerçek zamanlı model bunu çağırabilir.
- `realtime.consultPolicy`, gerçek zamanlı modelin `openclaw_agent_consult` çağırması gereken durumlar için isteğe bağlı olarak rehberlik ekler.
- `realtime.agentContext.enabled` varsayılan olarak kapalıdır. Etkinleştirildiğinde Voice Call, sınırlı bir aracı kimliğini, sistem istemi geçersiz kılmasını ve seçili çalışma alanı dosyası kapsülünü oturum kurulumunda gerçek zamanlı sağlayıcı yönergelerine enjekte eder.
- `realtime.fastContext.enabled` varsayılan olarak kapalıdır. Etkinleştirildiğinde Voice Call önce danışma sorusu için dizine alınmış bellek/oturum bağlamında arama yapar ve `realtime.fastContext.fallbackToConsult` true ise tam danışma aracısına geri dönmeden önce bu parçaları `realtime.fastContext.timeoutMs` içinde gerçek zamanlı modele döndürür.
- `realtime.provider` kayıtlı olmayan bir sağlayıcıya işaret ederse veya hiç gerçek zamanlı ses sağlayıcısı kayıtlı değilse, Voice Call tüm Plugin'i başarısız kılmak yerine bir uyarı günlüğe yazar ve gerçek zamanlı ortamı atlar.
- Danışma oturumu anahtarları, varsa depolanan arama oturumunu yeniden kullanır, ardından yapılandırılmış `sessionScope` değerine geri döner (varsayılan olarak `per-phone`, yalıtılmış aramalar için `per-call`).

### Araç politikası

`realtime.toolPolicy`, danışma çalıştırmasını denetler:

| Politika         | Davranış                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Danışma aracını sunar ve normal aracıyı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar. |
| `owner`          | Danışma aracını sunar ve normal aracının olağan aracı araç politikasını kullanmasına izin verir.                                      |
| `none`           | Danışma aracını sunmaz. Özel `realtime.tools` yine de gerçek zamanlı sağlayıcıya geçirilir.                                           |

`realtime.consultPolicy` yalnızca gerçek zamanlı model yönergelerini denetler:

| Politika      | Rehberlik                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Varsayılan istemi korur ve danışma aracını ne zaman çağıracağına sağlayıcının karar vermesine izin verir. |
| `substantive` | Basit konuşma bağlayıcılarını doğrudan yanıtlar ve olgular, bellek, araçlar veya bağlamdan önce danışır. |
| `always`      | Her önemli yanıttan önce danışır.                                                              |

### Aracı ses bağlamı

Ses köprüsünün, sıradan turlarda tam bir aracı-danışma gidiş dönüşü ödemeden
yapılandırılmış OpenClaw aracısı gibi konuşması gerektiğinde
`realtime.agentContext` öğesini etkinleştirin. Bağlam kapsülü, gerçek zamanlı
oturum oluşturulduğunda bir kez eklenir, bu nedenle tur başına gecikme
eklemez. `openclaw_agent_consult` çağrıları yine de tam OpenClaw aracısını
çalıştırır ve araç çalışması, güncel bilgi, bellek aramaları veya çalışma
alanı durumu için kullanılmalıdır.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeSystemPrompt: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Gerçek zamanlı sağlayıcı örnekleri

<Tabs>
  <Tab title="Google Gemini Live">
    Varsayılanlar: `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` veya `GOOGLE_GENERATIVE_AI_API_KEY` üzerinden API anahtarı; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; ses `Kore`.
    `sessionResumption` ve `contextWindowCompression`, daha uzun ve
    yeniden bağlanabilir çağrılar için varsayılan olarak açıktır. Telefon sesi üzerinde
    daha hızlı söz sırası geçişini ayarlamak için `silenceDurationMs`, `startSensitivity` ve
    `endSensitivity` kullanın.

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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
[OpenAI sağlayıcısı](/tr/providers/openai) sayfalarına bakın.

## Akış transkripsiyonu

`streaming`, canlı çağrı sesi için gerçek zamanlı bir transkripsiyon sağlayıcısı seçer.

Geçerli çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmadıysa Voice Call, kayıtlı ilk gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Paketlenen gerçek zamanlı transkripsiyon sağlayıcıları: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI (`xai`); bunlar kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `streaming.providers.<providerId>` altında bulunur.
- Twilio kabul edilmiş bir akış `start` iletisi gönderdikten sonra Voice Call akışı hemen kaydeder, sağlayıcı bağlanırken gelen medyayı transkripsiyon sağlayıcısı üzerinden kuyruğa alır ve ilk selamlamayı yalnızca gerçek zamanlı transkripsiyon hazır olduktan sonra başlatır.
- `streaming.provider` kayıtlı olmayan bir sağlayıcıyı gösterirse veya kayıtlı sağlayıcı yoksa Voice Call bir uyarı günlüğe yazar ve tüm Plugin'i başarısız kılmak yerine medya akışını atlar.

### Akış sağlayıcısı örnekleri

<Tabs>
  <Tab title="OpenAI">
    Varsayılanlar: `streaming.providers.openai.apiKey` veya
    `OPENAI_API_KEY` API anahtarı; model `gpt-4o-transcribe`; `silenceDurationMs: 800`;
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
    Varsayılanlar: `streaming.providers.xai.apiKey` veya `XAI_API_KEY` API anahtarı;
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

Voice Call, çağrılarda akış konuşması için çekirdek `messages.tts`
yapılandırmasını kullanır. Bunu Plugin yapılandırması altında
**aynı şekille** geçersiz kılabilirsiniz; `messages.tts` ile derin birleştirilir.

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
geçerli Microsoft taşıması telefon PCM çıktısını açığa çıkarmaz.
</Warning>

Davranış notları:

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) `openclaw doctor --fix` tarafından onarılır; işlenen yapılandırma `tts.providers.<provider>` kullanmalıdır.
- Twilio medya akışı etkinleştirildiğinde çekirdek TTS kullanılır; aksi halde çağrılar sağlayıcıya özgü seslere geri döner.
- Bir Twilio medya akışı zaten etkinse Voice Call, TwiML `<Say>` seçeneğine geri dönmez. Telefon TTS'i bu durumda kullanılamıyorsa oynatma isteği iki oynatma yolunu karıştırmak yerine başarısız olur.
- Telefon TTS'i ikincil bir sağlayıcıya geri döndüğünde Voice Call, hata ayıklama için sağlayıcı zinciriyle (`from`, `to`, `attempts`) birlikte bir uyarı günlüğe yazar.
- Twilio araya girme veya akış kapatma bekleyen TTS kuyruğunu temizlediğinde, kuyruğa alınmış oynatma istekleri arayanları oynatma tamamlanmasını bekler halde bırakmak yerine sonuçlanır.

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

Gelen çağrı politikası varsayılan olarak `disabled` olur. Gelen çağrıları etkinleştirmek için şunu ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` düşük güvence düzeyinde bir arayan kimliği elemesidir.
Plugin, sağlayıcının sağladığı `From` değerini normalleştirir ve bunu
`allowFrom` ile karşılaştırır. Webhook doğrulaması sağlayıcı teslimini ve
yük bütünlüğünü doğrular, ancak PSTN/VoIP arayan numarası sahipliğini
**kanıtlamaz**. `allowFrom` değerini güçlü arayan kimliği değil, arayan kimliği filtreleme olarak değerlendirin.
</Warning>

Otomatik yanıtlar ajan sistemini kullanır. `responseModel`,
`responseSystemPrompt` ve `responseTimeoutMs` ile ayarlayın.

### Numara Başına Yönlendirme

Bir Voice Call Plugin'i birden çok telefon numarası için çağrı aldığında ve her
numaranın farklı bir hat gibi davranması gerektiğinde `numbers` kullanın. Örneğin, bir
numara gündelik bir kişisel asistan kullanırken bir diğeri iş
personası, farklı bir yanıt ajanı ve farklı bir TTS sesi kullanabilir.

Rotalar, sağlayıcının sağladığı çevrilen `To` numarasından seçilir. Anahtarlar
E.164 numaraları olmalıdır. Bir çağrı geldiğinde Voice Call eşleşen rotayı bir kez çözer,
eşleşen rotayı çağrı kaydında saklar ve selamlama, klasik otomatik yanıt yolu,
gerçek zamanlı danışma yolu ve TTS oynatması için bu etkin yapılandırmayı
yeniden kullanır. Hiçbir rota eşleşmezse global Voice Call yapılandırması kullanılır.
Giden çağrılar `numbers` kullanmaz; çağrıyı başlatırken giden hedefi, iletiyi ve
oturumu açıkça geçirin.

Rota geçersiz kılmaları şu anda şunları destekler:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` rota değeri, global Voice Call `tts` yapılandırmasının üzerine derin birleştirilir; bu nedenle
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

### Konuşma çıktısı sözleşmesi

Otomatik yanıtlar için Voice Call, sistem istemine katı bir konuşma çıktısı sözleşmesi ekler:

```text
{"spoken":"..."}
```

Voice Call konuşma metnini savunmalı biçimde çıkarır:

- Akıl yürütme/hata içeriği olarak işaretlenmiş yükleri yoksayar.
- Doğrudan JSON'u, kod bloğuna alınmış JSON'u veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve muhtemel planlama/meta giriş paragraflarını kaldırır.

Bu, konuşma oynatmasını arayana yönelik metne odaklı tutar ve
planlama metninin sese sızmasını önler.

### Konuşma başlatma davranışı

Giden `conversation` çağrıları için ilk ileti işleme, canlı oynatma durumuna bağlıdır:

- Araya girme kuyruk temizliği ve otomatik yanıt yalnızca ilk selamlama aktif olarak konuşulurken bastırılır.
- İlk oynatma başarısız olursa çağrı `listening` durumuna döner ve ilk ileti yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, akış bağlandığında ek gecikme olmadan başlar.
- Araya girme aktif oynatmayı iptal eder ve kuyruğa alınmış ancak henüz oynatılmayan Twilio TTS girdilerini temizler. Temizlenen girdiler atlandı olarak sonuçlanır; böylece takip eden yanıt mantığı, asla oynatılmayacak sesi beklemeden devam edebilir.
- Gerçek zamanlı sesli konuşmalar, gerçek zamanlı akışın kendi açılış sırasını kullanır. Voice Call, bu ilk ileti için eski bir `<Say>` TwiML güncellemesi **göndermez**; böylece giden `<Connect><Stream>` oturumları bağlı kalır.

### Twilio akışı bağlantı kesme ek süresi

Bir Twilio medya akışının bağlantısı kesildiğinde Voice Call, çağrıyı
otomatik sonlandırmadan önce **2000 ms** bekler:

- Akış bu süre içinde yeniden bağlanırsa otomatik sonlandırma iptal edilir.
- Ek süre sonrasında hiçbir akış yeniden kaydolmazsa takılı kalan aktif çağrıları önlemek için çağrı sonlandırılır.

## Eski çağrı temizleyicisi

Sonlandırıcı Webhook hiç almayan çağrıları (örneğin, hiç tamamlanmayan bildirim modu çağrıları)
sonlandırmak için `staleCallReaperSeconds` kullanın. Varsayılan
`0` değeridir (devre dışı).

Önerilen aralıklar:

- **Üretim:** bildirim tarzı akışlar için `120`-`300` saniye.
- Normal çağrıların tamamlanabilmesi için bu değeri **`maxDurationSeconds` değerinden daha yüksek** tutun. İyi bir başlangıç noktası `maxDurationSeconds + 30-60` saniyedir.

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

Gateway'in önünde bir proxy veya tünel bulunduğunda Plugin,
imza doğrulaması için genel URL'yi yeniden oluşturur. Bu seçenekler
hangi yönlendirilmiş başlıklara güvenileceğini denetler:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Yönlendirme başlıklarından gelen host'ları izin listesine alır.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Yönlendirilmiş başlıklara izin listesi olmadan güvenir.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Yönlendirilmiş başlıklara yalnızca isteğin uzak IP'si listeyle eşleştiğinde güvenir.
</ParamField>

Ek korumalar:

- Webhook **yeniden oynatma koruması** Twilio ve Plivo için etkindir. Yeniden oynatılan geçerli Webhook istekleri onaylanır ancak yan etkiler için atlanır.
- Twilio konuşma turları, `<Gather>` geri çağrılarında her tur için bir token içerir; böylece eski/yeniden oynatılan konuşma geri çağrıları daha yeni bekleyen bir transkript turunu karşılayamaz.
- Kimliği doğrulanmamış Webhook istekleri, sağlayıcının gerekli imza başlıkları eksik olduğunda gövde okunmadan önce reddedilir.
- Voice Call Webhook'u, imza doğrulamasından önce paylaşılan ön kimlik doğrulama gövde profilini (64 KB / 5 saniye) ve IP başına uçuşta olan istek sınırını kullanır.

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

Gateway zaten çalışırken, operasyonel `voicecall` komutları Gateway'in sahip olduğu
voice-call çalışma zamanına devredilir; böylece CLI ikinci bir
Webhook sunucusu bağlamaz. Erişilebilir bir Gateway yoksa komutlar bağımsız bir
CLI çalışma zamanına geri döner.

`latency`, varsayılan voice-call depolama yolundan `calls.jsonl` dosyasını okur.
Farklı bir günlüğe işaret etmek için `--file <path>`, analizi son N kayıtla
(varsayılan 200) sınırlamak için `--last <n>` kullanın. Çıktı, tur gecikmesi ve
dinleme-bekleme süreleri için p50/p90/p99 değerlerini içerir.

## Aracı aracı

Araç adı: `voice_call`.

| Eylem           | Argümanlar                                 |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Bu repo, `skills/voice-call/SKILL.md` konumunda eşleşen bir skill belgesiyle gelir.

## Gateway RPC

| Yöntem               | Argümanlar                                 |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` yalnızca `mode: "conversation"` ile geçerlidir. Bildirim modu çağrıları,
bağlantı sonrası rakamlara ihtiyaç duyuyorsa çağrı var olduktan sonra
`voicecall.dtmf` kullanmalıdır.

## Sorun giderme

### Kurulum Webhook dışa açımında başarısız oluyor

Kurulumu Gateway'i çalıştıran aynı ortamdan çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx` ve `plivo` için `webhook-exposure` yeşil olmalıdır.
Yapılandırılmış bir `publicUrl`, yerel veya özel ağ alanına işaret ettiğinde
yine de başarısız olur; çünkü operatör bu adreslere geri çağrı yapamaz. `publicUrl`
olarak `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` veya `fd00::/8` kullanmayın.

Twilio bildirim modu giden çağrıları, ilk `<Say>` TwiML öğesini doğrudan
çağrı oluşturma isteğinde gönderir; bu nedenle ilk konuşulan mesaj Twilio'nun
Webhook TwiML almasına bağlı değildir. Genel bir Webhook; durum geri çağrıları,
konuşma çağrıları, bağlantı öncesi DTMF, gerçek zamanlı akışlar ve bağlantı
sonrası çağrı denetimi için yine de gereklidir.

Tek bir genel dışa açma yolu kullanın:

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

Yapılandırmayı değiştirdikten sonra Gateway'i yeniden başlatın veya yeniden yükleyin, ardından şunu çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`, `--yes` iletmediğiniz sürece kuru çalıştırmadır.

### Sağlayıcı kimlik bilgileri başarısız oluyor

Seçilen sağlayıcıyı ve gerekli kimlik bilgisi alanlarını kontrol edin:

- Twilio: `twilio.accountSid`, `twilio.authToken` ve `fromNumber` veya
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` ve `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` ve
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` ve `fromNumber`.

Kimlik bilgileri Gateway host'unda mevcut olmalıdır. Yerel bir kabuk profilini
düzenlemek, zaten çalışmakta olan bir Gateway'i yeniden başlatılana veya ortamı
yeniden yüklenene kadar etkilemez.

### Çağrılar başlıyor ancak sağlayıcı Webhook'ları gelmiyor

Sağlayıcı konsolunun tam genel Webhook URL'sine işaret ettiğini doğrulayın:

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
- Tünel URL'si Gateway başladıktan sonra değişti.
- Bir proxy isteği yönlendiriyor ancak host/proto başlıklarını kaldırıyor veya yeniden yazıyor.
- Güvenlik duvarı veya DNS, genel host adını Gateway dışında bir yere yönlendiriyor.
- Gateway, Voice Call Plugin etkinleştirilmeden yeniden başlatıldı.

Gateway'in önünde bir ters proxy veya tünel bulunduğunda,
`webhookSecurity.allowedHosts` değerini genel host adına ayarlayın veya bilinen
bir proxy adresi için `webhookSecurity.trustedProxyIPs` kullanın.
`webhookSecurity.trustForwardingHeaders` değerini yalnızca proxy sınırı sizin
denetiminiz altındaysa kullanın.

### İmza doğrulaması başarısız oluyor

Sağlayıcı imzaları, OpenClaw'ın gelen istekten yeniden oluşturduğu genel URL'ye
göre kontrol edilir. İmzalar başarısız olursa:

- Sağlayıcı Webhook URL'sinin şema, host ve yol dahil `publicUrl` ile tam olarak eşleştiğini doğrulayın.
- ngrok ücretsiz katman URL'leri için tünel host adı değiştiğinde `publicUrl` değerini güncelleyin.
- Proxy'nin özgün host ve proto başlıklarını koruduğundan emin olun veya
  `webhookSecurity.allowedHosts` yapılandırın.
- Yerel test dışında `skipSignatureVerification` etkinleştirmeyin.

### Google Meet Twilio katılımları başarısız oluyor

Google Meet, Twilio çevirmeli katılımları için bu Plugin'i kullanır. Önce Voice Call'u doğrulayın:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Ardından Google Meet taşımasını açıkça doğrulayın:

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call yeşilse ancak Meet katılımcısı hiç katılmıyorsa Meet
çevirmeli katılım numarasını, PIN'i ve `--dtmf-sequence` değerini kontrol edin.
Telefon çağrısı sağlıklı olabilir ancak toplantı hatalı bir DTMF dizisini
reddediyor veya yok sayıyor olabilir.

Google Meet, Twilio telefon bacağını bağlantı öncesi DTMF dizisiyle
`voicecall.start` üzerinden başlatır. PIN'den türetilen diziler, başta Twilio
bekleme rakamları olarak Google Meet Plugin'inin `voiceCall.dtmfDelayMs` değerini
içerir. Varsayılan değer 12 saniyedir; çünkü Meet çevirmeli katılım istemleri
geç gelebilir. Voice Call, giriş selamlaması istenmeden önce gerçek zamanlı
işlemeye geri yönlendirir.

Canlı aşama izini görmek için `openclaw logs --follow` kullanın. Sağlıklı bir
Twilio Meet katılımı günlüklerde şu sırayı gösterir:

- Google Meet, Twilio katılımını Voice Call'a devreder.
- Voice Call, bağlantı öncesi DTMF TwiML'ini depolar.
- Twilio ilk TwiML'i tüketilir ve gerçek zamanlı işlemden önce sunulur.
- Voice Call, Twilio çağrısı için gerçek zamanlı TwiML sunar.
- Google Meet, DTMF sonrası gecikmeden sonra `voicecall.speak` ile giriş konuşması ister.

`openclaw voicecall tail` kalıcı çağrı kayıtlarını göstermeye devam eder; çağrı
durumu ve transkriptler için yararlıdır, ancak her Webhook/gerçek zamanlı geçiş
orada görünmez.

### Gerçek zamanlı çağrıda konuşma yok

Yalnızca bir ses modunun etkin olduğunu doğrulayın. `realtime.enabled` ve
`streaming.enabled` aynı anda true olamaz.

Gerçek zamanlı Twilio çağrıları için şunları da doğrulayın:

- Gerçek zamanlı sağlayıcı Plugin'i yüklü ve kayıtlı.
- `realtime.provider` ayarlanmamış veya kayıtlı bir sağlayıcıyı adlandırıyor.
- Sağlayıcı API anahtarı Gateway süreci tarafından kullanılabilir durumda.
- `openclaw logs --follow`; gerçek zamanlı TwiML'in sunulduğunu, gerçek zamanlı köprünün
  başlatıldığını ve ilk selamlamanın kuyruğa alındığını gösteriyor.

## İlgili

- [Konuşma modu](/tr/nodes/talk)
- [Metinden konuşmaya](/tr/tools/tts)
- [Sesle uyandırma](/tr/nodes/voicewake)
