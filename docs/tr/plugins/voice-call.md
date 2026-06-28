---
read_when:
    - OpenClaw'dan giden bir sesli arama yapmak istiyorsunuz
    - voice-call Plugin'ini yapılandırıyor veya geliştiriyorsunuz
    - Telefonide gerçek zamanlı ses veya akışlı transkripsiyona ihtiyacınız var
sidebarTitle: Voice call
summary: Twilio, Telnyx veya Plivo aracılığıyla giden sesli aramalar yapın ve gelen sesli aramaları kabul edin; isteğe bağlı olarak gerçek zamanlı ses ve akış transkripsiyonu kullanın
title: Sesli arama Plugin
x-i18n:
    generated_at: "2026-06-28T01:07:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw için bir Plugin üzerinden sesli aramalar. Giden bildirimleri,
çok turlu konuşmaları, tam çift yönlü gerçek zamanlı sesi, akışlı
transkripsiyonu ve izin listesi ilkelerine sahip gelen aramaları destekler.

**Geçerli sağlayıcılar:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (geliştirme/ağ yok).

<Note>
Voice Call Plugin'i **Gateway işleminin içinde** çalışır. Uzak bir
Gateway kullanıyorsanız, Plugin'i Gateway'in çalıştığı makineye
yükleyip yapılandırın, ardından yüklenmesi için Gateway'i yeniden başlatın.
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
      <Tab title="Yerel klasörden (geliştirme)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Geçerli resmi sürüm etiketini takip etmek için sade paketi kullanın.
    Tam sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

    Ardından Plugin'in yüklenmesi için Gateway'i yeniden başlatın.

  </Step>
  <Step title="Sağlayıcıyı ve Webhook'u yapılandırın">
    Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın
    (tam yapı için aşağıdaki [Yapılandırma](#configuration) bölümüne bakın).
    En azından şunlar gerekir: `provider`, sağlayıcı kimlik bilgileri,
    `fromNumber` ve herkese açık şekilde erişilebilir bir Webhook URL'si.
  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    openclaw voicecall setup
    ```

    Varsayılan çıktı sohbet günlüklerinde ve terminallerde okunabilir.
    Plugin'in etkinleştirilmesini, sağlayıcı kimlik bilgilerini, Webhook
    erişilebilirliğini ve yalnızca bir ses modunun (`streaming` veya
    `realtime`) etkin olduğunu denetler. Betikler için `--json` kullanın.

  </Step>
  <Step title="Duman testi">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    İkisi de varsayılan olarak kuru çalıştırmadır. Kısa bir giden bildirim
    araması gerçekten başlatmak için `--yes` ekleyin:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx ve Plivo için kurulumun **herkese açık Webhook URL'sine**
çözümlenmesi gerekir. `publicUrl`, tünel URL'si, Tailscale URL'si veya sunma
yedek yolu loopback'e ya da özel ağ alanına çözümlenirse, kurulum taşıyıcı
Webhook'larını alamayacak bir sağlayıcıyı başlatmak yerine başarısız olur.
</Warning>

## Yapılandırma

`enabled: true` ise ancak seçili sağlayıcıda kimlik bilgileri eksikse,
Gateway başlatma sırasında eksik anahtarlarla birlikte kurulum-tamamlanmadı
uyarısı günlüğe yazılır ve çalışma zamanının başlatılması atlanır. Komutlar,
RPC çağrıları ve ajan araçları kullanıldığında yine de eksik sağlayıcı
yapılandırmasını aynen döndürür.

<Note>
Voice-call kimlik bilgileri SecretRefs kabul eder. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` ve `plugins.entries.voice-call.config.tts.providers.*.apiKey` standart SecretRef yüzeyi üzerinden çözümlenir; bkz. [SecretRef kimlik bilgisi yüzeyi](/tr/reference/secretref-credential-surface).
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
                  openai: { speakerVoice: "alloy" },
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
    - Twilio, Telnyx ve Plivo'nun tümü **herkese açık şekilde erişilebilir** bir Webhook URL'si gerektirir.
    - `mock`, yerel geliştirme sağlayıcısıdır (ağ çağrısı yoktur).
    - Telnyx, `skipSignatureVerification` true değilse `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
    - `skipSignatureVerification` yalnızca yerel test içindir.
    - ngrok ücretsiz katmanında `publicUrl` değerini tam ngrok URL'sine ayarlayın; imza doğrulama her zaman uygulanır.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`, Twilio Webhook'larının geçersiz imzalarla çalışmasına **yalnızca** `tunnel.provider="ngrok"` ve `serve.bind` loopback olduğunda (ngrok yerel ajanı) izin verir. Yalnızca yerel geliştirme içindir.
    - Ngrok ücretsiz katman URL'leri değişebilir veya ara sayfa davranışı ekleyebilir; `publicUrl` kayarsa Twilio imzaları başarısız olur. Üretimde: kararlı bir alan adı veya Tailscale funnel tercih edin.

  </Accordion>
  <Accordion title="Akış bağlantısı sınırları">
    - `streaming.preStartTimeoutMs`, hiçbir zaman geçerli bir `start` çerçevesi göndermeyen soketleri kapatır.
    - `streaming.maxPendingConnections`, kimliği doğrulanmamış toplam başlatma öncesi soketleri sınırlar.
    - `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlatma öncesi soketleri sınırlar.
    - `streaming.maxConnections`, toplam açık medya akışı soketlerini sınırlar (bekleyen + etkin).

  </Accordion>
  <Accordion title="Eski yapılandırma geçişleri">
    `provider: "log"`, `twilio.from` veya eski `streaming.*` OpenAI
    anahtarlarını kullanan eski yapılandırmalar `openclaw doctor --fix`
    tarafından yeniden yazılır. Çalışma zamanı yedek yolu eski voice-call
    anahtarlarını şimdilik hâlâ kabul eder, ancak yeniden yazma yolu
    `openclaw doctor --fix` şeklindedir ve uyumluluk shim'i geçicidir.

    Otomatik geçirilen akış anahtarları:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Oturum kapsamı

Varsayılan olarak Voice Call, aynı arayanın tekrarlanan aramalarında konuşma
belleğinin korunması için `sessionScope: "per-phone"` kullanır. Her taşıyıcı
aramasının yeni bağlamla başlaması gerektiğinde `sessionScope: "per-call"`
ayarlayın; örneğin resepsiyon, rezervasyon, IVR veya aynı telefon numarasının
farklı toplantıları temsil edebileceği Google Meet köprü akışları.

Voice Call, oluşturulan oturum anahtarlarını yapılandırılmış ajan ad alanı
altında (`agent:<agentId>:voice:*`) saklar; böylece arama belleği yeniden
başlatmalardan sonra Gateway oturum anahtarı kanonikleştirmesinden sağ çıkar.
Ham açık entegrasyon anahtarları aynı ajan ad alanını kullanır. Kanonik bir
`agent:<configuredAgentId>:*` anahtarı bu sahibi korur ve ana takma adları
çekirdek `session.mainKey` ile genel kapsama uyar. Yabancı veya hatalı biçimli
`agent:*` girdisi, yapılandırılmış ajan altında opak bir anahtar olarak
kapsamlandırılır; `global` ve `unknown` genel sentinel olarak kalır. Gateway
başlatması, yolun tek bir sahibi kanıtladığı varsayılan veya `{agentId}` şablonlu
depolardaki eski ham anahtarları yükseltir. Sabit özel depolarda, belirsiz eski
satırlar sahibi seçmek için yeterli bilgi içermediğinden dokunulmadan kalır;
yeni aramalar kanonik ajan kapsamlı geçmişi kullanır.

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı arama sesi için tam çift yönlü bir gerçek zamanlı ses
sağlayıcısı seçer. Yalnızca sesi gerçek zamanlı transkripsiyon sağlayıcılarına
ileten `streaming` modundan ayrıdır.

<Warning>
`realtime.enabled`, `streaming.enabled` ile birlikte kullanılamaz. Arama başına
bir ses modu seçin.
</Warning>

Geçerli çalışma zamanı davranışı:

- `realtime.enabled`, Twilio Media Streams için desteklenir.
- `realtime.provider` isteğe bağlıdır. Ayarlanmamışsa Voice Call ilk kayıtlı gerçek zamanlı ses sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı ses sağlayıcıları: Google Gemini Live (`google`) ve OpenAI (`openai`); bunlar kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `realtime.providers.<providerId>` altında bulunur.
- Voice Call, paylaşılan `openclaw_agent_consult` gerçek zamanlı aracını varsayılan olarak sunar. Gerçek zamanlı model, arayan daha derin akıl yürütme, güncel bilgi veya normal OpenClaw araçları istediğinde bunu çağırabilir.
- `realtime.consultPolicy`, gerçek zamanlı modelin `openclaw_agent_consult` çağırması gereken durumlar için isteğe bağlı olarak yönlendirme ekler.
- `realtime.agentContext.enabled` varsayılan olarak kapalıdır. Etkinleştirildiğinde Voice Call, oturum kurulumu sırasında gerçek zamanlı sağlayıcı talimatlarına sınırlı bir ajan kimliği ve seçili çalışma alanı dosyası kapsülü enjekte eder.
- `realtime.fastContext.enabled` varsayılan olarak kapalıdır. Etkinleştirildiğinde Voice Call önce danışma sorusu için dizinlenmiş bellek/oturum bağlamında arama yapar ve tam danışma ajanına yalnızca `realtime.fastContext.fallbackToConsult` true ise geri dönmeden önce bu parçaları `realtime.fastContext.timeoutMs` içinde gerçek zamanlı modele döndürür.
- `realtime.provider` kayıtlı olmayan bir sağlayıcıyı gösterirse veya hiç gerçek zamanlı ses sağlayıcısı kayıtlı değilse Voice Call bir uyarı günlüğe yazar ve tüm Plugin'i başarısız kılmak yerine gerçek zamanlı medyayı atlar.
- Danışma oturum anahtarları, mevcut olduğunda saklanan arama oturumunu yeniden kullanır; ardından yapılandırılmış `sessionScope` değerine geri döner (varsayılan olarak `per-phone`, yalıtılmış aramalar için `per-call`).

### Araç ilkesi

`realtime.toolPolicy`, danışma çalıştırmasını denetler:

| İlke             | Davranış                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Danışma aracını sunar ve normal ajanı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar. |
| `owner`          | Danışma aracını sunar ve normal ajanın olağan ajan araç ilkesini kullanmasına izin verir.                                                      |
| `none`           | Danışma aracını sunmaz. Özel `realtime.tools` yine de gerçek zamanlı sağlayıcıya aktarılır.                               |

`realtime.consultPolicy` yalnızca gerçek zamanlı model talimatlarını denetler:

| İlke          | Yönlendirme                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Varsayılan istemi korur ve danışma aracını ne zaman çağıracağına sağlayıcının karar vermesine izin verir.              |
| `substantive` | Basit konuşma bağlayıcılarını doğrudan yanıtlar; olgular, bellek, araçlar veya bağlam öncesinde danışır. |
| `always`      | Her anlamlı yanıttan önce danışır.                                                        |

### Ajan ses bağlamı

Sıradan turlarda tam bir agent danışma gidiş dönüşü maliyeti ödemeden ses köprüsünün yapılandırılmış OpenClaw agent gibi duyulması gerektiğinde `realtime.agentContext` ayarını etkinleştirin. Bağlam kapsülü, gerçek zamanlı oturum oluşturulduğunda bir kez eklenir; bu nedenle tur başına gecikme eklemez. `openclaw_agent_consult` çağrıları yine de tam OpenClaw agent çalıştırır ve araç işleri, güncel bilgiler, bellek aramaları veya çalışma alanı durumu için kullanılmalıdır.

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
    `GEMINI_API_KEY` veya `GOOGLE_GENERATIVE_AI_API_KEY` içinden API anahtarı; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; ses `Kore`.
    Daha uzun, yeniden bağlanabilir çağrılar için `sessionResumption` ve
    `contextWindowCompression` varsayılan olarak açıktır. Telefon sesinde daha hızlı sıra alma ayarı yapmak için `silenceDurationMs`, `startSensitivity` ve
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
                    speakerVoice: "Kore",
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
[OpenAI sağlayıcısı](/tr/providers/openai) bölümlerine bakın.

## Akışlı yazıya dökme

`streaming`, canlı çağrı sesi için bir gerçek zamanlı yazıya dökme sağlayıcısı seçer.

Geçerli çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call, kayıtlı ilk gerçek zamanlı yazıya dökme sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı yazıya dökme sağlayıcıları: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI (`xai`); bunlar kendi sağlayıcı Pluginleri tarafından kaydedilir.
- Sağlayıcının sahip olduğu ham yapılandırma `streaming.providers.<providerId>` altında bulunur.
- Twilio kabul edilmiş bir akış `start` iletisi gönderdikten sonra Voice Call akışı hemen kaydeder, sağlayıcı bağlanırken gelen medyayı yazıya dökme sağlayıcısı üzerinden sıraya alır ve ilk selamlamayı yalnızca gerçek zamanlı yazıya dökme hazır olduktan sonra başlatır.
- `streaming.provider` kayıtlı olmayan bir sağlayıcıyı işaret ederse veya hiç sağlayıcı kayıtlı değilse Voice Call bir uyarı günlüğe yazar ve tüm Pluginin başarısız olması yerine medya akışını atlar.

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

Voice Call, çağrılarda akışlı konuşma için çekirdek `messages.tts` yapılandırmasını kullanır. Plugin yapılandırması altında **aynı şekille** geçersiz kılabilirsiniz — `messages.tts` ile derin birleştirme yapar.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft konuşma, sesli çağrılar için yok sayılır.** Telefon sesi PCM gerektirir;
geçerli Microsoft aktarımı telefon PCM çıktısını sunmaz.
</Warning>

Davranış notları:

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) `openclaw doctor --fix` tarafından onarılır; commitleyen yapılandırma `tts.providers.<provider>` kullanmalıdır.
- Twilio medya akışı etkin olduğunda çekirdek TTS kullanılır; aksi durumda çağrılar sağlayıcıya özgü seslere geri döner.
- Bir Twilio medya akışı zaten etkinse Voice Call, TwiML `<Say>` öğesine geri dönmez. Bu durumda telefon TTS kullanılamıyorsa çalma isteği iki çalma yolunu karıştırmak yerine başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya geri döndüğünde Voice Call, hata ayıklama için sağlayıcı zinciriyle (`from`, `to`, `attempts`) birlikte bir uyarı günlüğe yazar.
- Twilio araya girme veya akış sonlandırma bekleyen TTS kuyruğunu temizlediğinde, kuyruğa alınmış çalma istekleri, çalmanın tamamlanmasını bekleyen arayanları askıda bırakmak yerine sonuçlanır.

### TTS örnekleri

<Tabs>
  <Tab title="Core TTS only">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
                speakerVoice: "marin",
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

Gelen çağrı politikası varsayılan olarak `disabled` değerindedir. Gelen çağrıları etkinleştirmek için şunu ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` düşük güvence düzeyinde bir arayan kimliği filtresidir. Plugin, sağlayıcı tarafından sağlanan `From` değerini normalleştirir ve
`allowFrom` ile karşılaştırır. Webhook doğrulaması sağlayıcı teslimini ve
yük bütünlüğünü doğrular, ancak PSTN/VoIP arayan numarası sahipliğini **kanıtlamaz**. `allowFrom` değerini güçlü arayan kimliği olarak değil, arayan kimliği filtrelemesi olarak ele alın.
</Warning>

Otomatik yanıtlar agent sistemini kullanır. `responseModel`,
`responseSystemPrompt` ve `responseTimeoutMs` ile ayarlayın.

### Numara başına yönlendirme

Bir Voice Call Plugini birden fazla telefon numarası için çağrı aldığında ve her numaranın farklı bir hat gibi davranması gerektiğinde `numbers` kullanın. Örneğin bir numara gündelik bir kişisel asistan kullanırken başka bir numara bir iş kişiliği, farklı bir yanıt agent ve farklı bir TTS sesi kullanabilir.

Rotalar, sağlayıcı tarafından sağlanan çevrilen `To` numarasından seçilir. Anahtarlar E.164 numaraları olmalıdır. Bir çağrı geldiğinde Voice Call eşleşen rotayı bir kez çözer, eşleşen rotayı çağrı kaydında saklar ve selamlama, klasik otomatik yanıt yolu, gerçek zamanlı danışma yolu ve TTS çalması için bu etkili yapılandırmayı yeniden kullanır. Hiçbir rota eşleşmezse genel Voice Call yapılandırması kullanılır.
Giden çağrılar `numbers` kullanmaz; çağrıyı başlatırken giden hedefi, iletiyi ve
oturumu açıkça iletin.

Rota geçersiz kılmaları şu anda şunları destekler:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` rota değeri, genel Voice Call `tts` yapılandırmasının üzerine derin birleştirme yapar; bu nedenle genellikle yalnızca sağlayıcı sesini geçersiz kılabilirsiniz:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Sözlü çıktı sözleşmesi

Otomatik yanıtlar için Voice Call, sistem istemine katı bir sözlü çıktı sözleşmesi ekler:

```text
{"spoken":"..."}
```

Voice Call konuşma metnini savunmacı şekilde çıkarır:

- Akıl yürütme/hata içeriği olarak işaretlenen yükleri yok sayar.
- Doğrudan JSON, çitle çevrili JSON veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, sözlü çalmayı arayana yönelik metne odaklı tutar ve planlama metninin sese sızmasını önler.

### Konuşma başlatma davranışı

Giden `conversation` çağrıları için ilk ileti işleme, canlı çalma durumuna bağlıdır:

- Araya girme kuyruğu temizleme ve otomatik yanıt yalnızca ilk selamlama etkin olarak konuşurken bastırılır.
- İlk çalma başarısız olursa çağrı `listening` durumuna döner ve ilk ileti yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk çalma, akış bağlantısında ek gecikme olmadan başlar.
- Araya girme etkin çalmayı iptal eder ve kuyruğa alınmış ancak henüz çalmayan Twilio TTS girdilerini temizler. Temizlenen girdiler atlandı olarak çözülür; böylece takip yanıt mantığı asla çalmayacak sesi beklemeden devam edebilir.
- Gerçek zamanlı sesli konuşmalar, gerçek zamanlı akışın kendi açılış turunu kullanır. Voice Call bu ilk ileti için eski bir `<Say>` TwiML güncellemesi göndermez; böylece giden `<Connect><Stream>` oturumları bağlı kalır.

### Twilio akış bağlantısı kesilme toleransı

Bir Twilio medya akışının bağlantısı kesildiğinde Voice Call, çağrıyı otomatik
sonlandırmadan önce **2000 ms** bekler:

- Akış bu pencere içinde yeniden bağlanırsa otomatik sonlandırma iptal edilir.
- Yetkisiz süre sonrasında hiçbir akış yeniden kaydolmazsa, takılı kalmış etkin çağrıları önlemek için çağrı sonlandırılır.

## Eski çağrı temizleyicisi

Hiçbir zaman sonlandırıcı Webhook almayan çağrıları sonlandırmak için
`staleCallReaperSeconds` kullanın (örneğin, hiç tamamlanmayan bildirim modu
çağrıları). Varsayılan değer `0` (devre dışı) şeklindedir.

Önerilen aralıklar:

- **Üretim:** Bildirim tarzı akışlar için `120`-`300` saniye.
- Normal çağrıların tamamlanabilmesi için bu değeri **`maxDurationSeconds` değerinden yüksek** tutun. İyi bir başlangıç noktası `maxDurationSeconds + 30-60` saniyedir.

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

Gateway önünde bir proxy veya tünel bulunduğunda, plugin imza doğrulaması için
genel URL'yi yeniden oluşturur. Bu seçenekler hangi iletilen üst bilgilerin
güvenilir olduğunu denetler:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  İletme üst bilgilerinden gelen host adlarına izin ver.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  İzin listesi olmadan iletilen üst bilgilere güven.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  İletilen üst bilgilere yalnızca istek uzak IP'si listeyle eşleştiğinde güven.
</ParamField>

Ek korumalar:

- Twilio ve Plivo için Webhook **yeniden oynatma koruması** etkindir. Yeniden oynatılan geçerli Webhook istekleri onaylanır ancak yan etkiler için atlanır.
- Twilio konuşma turları, `<Gather>` geri çağrılarında tur başına bir belirteç içerir; böylece eski/yeniden oynatılmış konuşma geri çağrıları daha yeni bekleyen bir transkript turunu karşılayamaz.
- Kimliği doğrulanmamış Webhook istekleri, sağlayıcının gerekli imza üst bilgileri eksikse gövde okunmadan önce reddedilir.
- voice-call Webhook'u, paylaşılan kimlik doğrulama öncesi gövde profilini (64 KB / 5 saniye) ve imza doğrulamasından önce IP başına uçuşta istek sınırını kullanır.

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

Gateway zaten çalışırken, operasyonel `voicecall` komutları Gateway'e ait
voice-call çalışma zamanına devredilir; böylece CLI ikinci bir Webhook
sunucusuna bağlanmaz. Erişilebilir bir Gateway yoksa komutlar bağımsız bir CLI
çalışma zamanına geri döner.

`latency`, varsayılan voice-call depolama yolundan `calls.jsonl` dosyasını okur.
Farklı bir günlüğe işaret etmek için `--file <path>`, analizi son N kayıtla
sınırlamak için `--last <n>` kullanın (varsayılan 200). Çıktı, tur gecikmesi ve
dinleme bekleme süreleri için p50/p90/p99 içerir.

## Ajan aracı

Araç adı: `voice_call`.

| Eylem           | Bağımsız değişkenler                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

voice-call plugin'i eşleşen bir ajan becerisiyle gönderilir.

## Gateway RPC

| Yöntem               | Bağımsız değişkenler                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` yalnızca `mode: "conversation"` ile geçerlidir. Bildirim modu
çağrıları, bağlantı sonrası rakamlara ihtiyaç duyuyorsa çağrı oluştuktan sonra
`voicecall.dtmf` kullanmalıdır.

## Sorun giderme

### Kurulum Webhook erişimini başaramıyor

Kurulumu Gateway'i çalıştıran aynı ortamdan çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx` ve `plivo` için `webhook-exposure` yeşil olmalıdır.
Yapılandırılmış bir `publicUrl`, yerel veya özel ağ alanını gösterdiğinde yine
de başarısız olur; çünkü operatör bu adreslere geri çağrı yapamaz. `publicUrl`
olarak `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` veya `fd00::/8` kullanmayın.

Twilio bildirim modu giden çağrıları, ilk `<Say>` TwiML'lerini doğrudan
create-call isteğinde gönderir; bu nedenle ilk sesli mesaj Twilio'nun Webhook
TwiML'ini getirmesine bağlı değildir. Durum geri çağrıları, konuşma çağrıları,
bağlantı öncesi DTMF, gerçek zamanlı akışlar ve bağlantı sonrası çağrı denetimi
için genel bir Webhook yine de gereklidir.

Tek bir genel erişim yolu kullanın:

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

Yapılandırmayı değiştirdikten sonra Gateway'i yeniden başlatın veya yeniden
yükleyin, ardından şunu çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`, `--yes` iletmediğiniz sürece bir kuru çalıştırmadır.

### Sağlayıcı kimlik bilgileri başarısız oluyor

Seçilen sağlayıcıyı ve gerekli kimlik bilgisi alanlarını denetleyin:

- Twilio: `twilio.accountSid`, `twilio.authToken` ve `fromNumber` ya da
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` ve `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` ve
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` ve `fromNumber`.

Kimlik bilgileri Gateway host'unda bulunmalıdır. Yerel bir kabuk profilini
düzenlemek, zaten çalışan bir Gateway yeniden başlatılana veya ortamını yeniden
yükleyene kadar onu etkilemez.

### Çağrılar başlıyor ancak sağlayıcı Webhook'ları gelmiyor

Sağlayıcı konsolunun tam genel Webhook URL'sini gösterdiğini doğrulayın:

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

- `publicUrl`, `serve.path` değerinden farklı bir yolu gösterir.
- Tünel URL'si Gateway başladıktan sonra değişmiştir.
- Bir proxy isteği iletir ancak host/proto üst bilgilerini kaldırır veya yeniden yazar.
- Güvenlik duvarı ya da DNS, genel host adını Gateway dışında bir yere yönlendirir.
- Gateway, Voice Call plugin'i etkinleştirilmeden yeniden başlatılmıştır.

Gateway önünde ters proxy veya tünel olduğunda, `webhookSecurity.allowedHosts`
değerini genel host adına ayarlayın veya bilinen bir proxy adresi için
`webhookSecurity.trustedProxyIPs` kullanın.
`webhookSecurity.trustForwardingHeaders` değerini yalnızca proxy sınırı sizin
denetiminiz altındaysa kullanın.

### İmza doğrulaması başarısız oluyor

Sağlayıcı imzaları, OpenClaw'ın gelen istekten yeniden oluşturduğu genel URL'ye
göre denetlenir. İmzalar başarısız olursa:

- Sağlayıcı Webhook URL'sinin şema, host ve yol dahil `publicUrl` ile tam olarak eşleştiğini doğrulayın.
- ngrok ücretsiz katman URL'leri için, tünel host adı değiştiğinde `publicUrl` değerini güncelleyin.
- Proxy'nin özgün host ve proto üst bilgilerini koruduğundan emin olun veya `webhookSecurity.allowedHosts` yapılandırın.
- Yerel test dışında `skipSignatureVerification` etkinleştirmeyin.

### Google Meet Twilio katılımları başarısız oluyor

Google Meet, Twilio aramalı katılımlar için bu plugin'i kullanır. Önce Voice
Call'u doğrulayın:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Ardından Google Meet aktarımını açıkça doğrulayın:

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call yeşilse ancak Meet katılımcısı hiç katılmıyorsa Meet arama
numarasını, PIN'i ve `--dtmf-sequence` değerini denetleyin. Telefon çağrısı
sağlıklı olabilir, ancak toplantı yanlış bir DTMF dizisini reddedebilir veya
yok sayabilir.

Google Meet, Twilio telefon bacağını bağlantı öncesi DTMF dizisiyle
`voicecall.start` üzerinden başlatır. PIN'den türetilen diziler, başta Twilio
bekleme rakamları olarak Google Meet plugin'inin `voiceCall.dtmfDelayMs`
değerini içerir. Meet aramalı katılım istemleri geç gelebileceği için
varsayılan değer 12 saniyedir. Voice Call daha sonra tanıtım selamlaması
istenmeden önce gerçek zamanlı işleme geri yönlendirir.

Canlı aşama izlemesi için `openclaw logs --follow` kullanın. Sağlıklı bir
Twilio Meet katılımı şu sırayı günlüğe yazar:

- Google Meet, Twilio katılımını Voice Call'a devreder.
- Voice Call, bağlantı öncesi DTMF TwiML'ini depolar.
- Twilio başlangıç TwiML'i gerçek zamanlı işleme geçmeden önce tüketilir ve sunulur.
- Voice Call, Twilio çağrısı için gerçek zamanlı TwiML sunar.
- Google Meet, DTMF sonrası gecikmeden sonra `voicecall.speak` ile tanıtım konuşması ister.

`openclaw voicecall tail` kalıcı çağrı kayıtlarını göstermeye devam eder; çağrı
durumu ve transkriptler için yararlıdır, ancak her Webhook/gerçek zamanlı geçiş
orada görünmez.

### Gerçek zamanlı çağrıda konuşma yok

Yalnızca bir ses modunun etkin olduğunu doğrulayın. `realtime.enabled` ve
`streaming.enabled` aynı anda true olamaz.

Gerçek zamanlı Twilio çağrıları için ayrıca şunları doğrulayın:

- Bir gerçek zamanlı sağlayıcı plugin'i yüklü ve kayıtlıdır.
- `realtime.provider` ayarlanmamıştır veya kayıtlı bir sağlayıcıyı adlandırır.
- Sağlayıcı API anahtarı Gateway süreci tarafından kullanılabilir durumdadır.
- `openclaw logs --follow`, gerçek zamanlı TwiML'in sunulduğunu, gerçek zamanlı köprünün
  başlatıldığını ve ilk selamlamanın kuyruğa alındığını gösterir.

## İlgili

- [Konuşma modu](/tr/nodes/talk)
- [Metinden konuşmaya](/tr/tools/tts)
- [Sesle uyandırma](/tr/nodes/voicewake)
