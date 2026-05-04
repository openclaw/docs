---
read_when:
    - OpenClaw üzerinden giden bir sesli arama yapmak istiyorsunuz
    - Sesli arama Plugin'ini yapılandırıyor veya geliştiriyorsunuz
    - Telefonide gerçek zamanlı sese veya akışlı transkripsiyona ihtiyacınız var
sidebarTitle: Voice call
summary: Twilio, Telnyx veya Plivo aracılığıyla giden sesli aramalar yapın ve gelen sesli aramaları kabul edin; isteğe bağlı gerçek zamanlı ses ve akışlı transkripsiyon desteğiyle
title: Sesli arama Plugin
x-i18n:
    generated_at: "2026-05-04T07:07:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec2c22dcc9073572963744685a432328787bcedb14025e0326c20d9d842f857
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw için Plugin aracılığıyla sesli aramalar. Giden bildirimleri,
çok turlu konuşmaları, tam çift yönlü gerçek zamanlı sesi, akışlı
transkripsiyonu ve izin listesi politikalarıyla gelen aramaları destekler.

**Mevcut sağlayıcılar:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (geliştirme/ağ yok).

<Note>
Voice Call Plugin'i **Gateway sürecinin içinde** çalışır. Uzak bir
Gateway kullanıyorsanız Plugin'i Gateway'i çalıştıran makineye kurup
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

    Mevcut resmi yayın etiketini izlemek için yalın paketi kullanın. Kesin
    bir sürümü yalnızca tekrarlanabilir bir kurulum gerektiğinde sabitleyin.

    Ardından Plugin'in yüklenmesi için Gateway'i yeniden başlatın.

  </Step>
  <Step title="Sağlayıcıyı ve Webhook'u yapılandırın">
    Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın (tam
    yapı için aşağıdaki [Yapılandırma](#configuration) bölümüne bakın). En az:
    `provider`, sağlayıcı kimlik bilgileri, `fromNumber` ve herkese açık
    erişilebilir bir Webhook URL'si gerekir.
  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    openclaw voicecall setup
    ```

    Varsayılan çıktı sohbet günlüklerinde ve terminallerde okunabilir. Plugin'in
    etkinleştirilmesini, sağlayıcı kimlik bilgilerini, Webhook erişilebilirliğini
    ve yalnızca bir ses modunun (`streaming` veya `realtime`) etkin olduğunu
    denetler. Betikler için `--json` kullanın.

  </Step>
  <Step title="Smoke testi">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    İkisi de varsayılan olarak deneme çalıştırmasıdır. Kısa bir giden bildirim
    araması gerçekten yapmak için `--yes` ekleyin:

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
Gateway başlatma işlemi eksik anahtarlarla birlikte kurulum eksik uyarısı
günlüğe yazar ve çalışma zamanını başlatmayı atlar. Komutlar, RPC çağrıları
ve aracı araçları kullanıldığında eksik sağlayıcı yapılandırmasının tam
halini yine döndürür.

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
    - ngrok ücretsiz katmanında `publicUrl` değerini tam ngrok URL'si olarak ayarlayın; imza doğrulaması her zaman uygulanır.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`, Twilio Webhook'larının geçersiz imzalarla çalışmasına **yalnızca** `tunnel.provider="ngrok"` olduğunda ve `serve.bind` loopback olduğunda (ngrok yerel aracısı) izin verir. Yalnızca yerel geliştirme içindir.
    - Ngrok ücretsiz katman URL'leri değişebilir veya ara sayfa davranışı ekleyebilir; `publicUrl` kayarsa Twilio imzaları başarısız olur. Üretim: kararlı bir etki alanı veya Tailscale funnel tercih edin.

  </Accordion>
  <Accordion title="Akış bağlantı sınırları">
    - `streaming.preStartTimeoutMs`, hiçbir zaman geçerli bir `start` frame'i göndermeyen soketleri kapatır.
    - `streaming.maxPendingConnections`, kimliği doğrulanmamış toplam başlatma öncesi soket sayısını sınırlar.
    - `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlatma öncesi soket sayısını sınırlar.
    - `streaming.maxConnections`, açık medya akışı soketlerinin toplamını sınırlar (bekleyen + etkin).

  </Accordion>
  <Accordion title="Eski yapılandırma geçişleri">
    `provider: "log"`, `twilio.from` veya eski `streaming.*` OpenAI anahtarlarını
    kullanan eski yapılandırmalar `openclaw doctor --fix` tarafından yeniden
    yazılır. Çalışma zamanı geri dönüşü şimdilik eski voice-call anahtarlarını
    kabul etmeyi sürdürür, ancak yeniden yazma yolu `openclaw doctor --fix`tir
    ve uyumluluk shim'i geçicidir.

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
aynı arayandan gelen tekrar aramalar konuşma belleğini korur. Her operatör
aramasının yeni bağlamla başlaması gerektiğinde, örneğin karşılama, rezervasyon,
IVR veya aynı telefon numarasının farklı toplantıları temsil edebileceği
Google Meet köprü akışlarında, `sessionScope: "per-call"` ayarlayın.

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı arama sesi için tam çift yönlü gerçek zamanlı ses sağlayıcısını
seçer. Yalnızca sesi gerçek zamanlı transkripsiyon sağlayıcılarına ileten
`streaming`den ayrıdır.

<Warning>
`realtime.enabled`, `streaming.enabled` ile birleştirilemez. Arama başına bir
ses modu seçin.
</Warning>

Mevcut çalışma zamanı davranışı:

- `realtime.enabled`, Twilio Media Streams için desteklenir.
- `realtime.provider` isteğe bağlıdır. Ayarlanmamışsa Voice Call ilk kayıtlı gerçek zamanlı ses sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı ses sağlayıcıları: Google Gemini Live (`google`) ve OpenAI (`openai`), kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `realtime.providers.<providerId>` altında bulunur.
- Voice Call, paylaşılan `openclaw_agent_consult` gerçek zamanlı aracını varsayılan olarak sunar. Gerçek zamanlı model, arayan daha derin akıl yürütme, güncel bilgi veya normal OpenClaw araçları istediğinde bunu çağırabilir.
- `realtime.fastContext.enabled` varsayılan olarak kapalıdır. Etkinleştirildiğinde Voice Call önce danışma sorusu için dizine alınmış bellek/oturum bağlamında arama yapar ve `realtime.fastContext.fallbackToConsult` true ise tam danışma aracısına geri dönmeden önce bu parçaları `realtime.fastContext.timeoutMs` içinde gerçek zamanlı modele döndürür.
- `realtime.provider` kayıtlı olmayan bir sağlayıcıyı işaret ederse veya hiçbir gerçek zamanlı ses sağlayıcısı kayıtlı değilse Voice Call bir uyarı günlüğe yazar ve tüm Plugin'i başarısız kılmak yerine gerçek zamanlı medyayı atlar.
- Danışma oturum anahtarları, varsa depolanan arama oturumunu yeniden kullanır, ardından yapılandırılmış `sessionScope` değerine geri döner (varsayılan olarak `per-phone` veya yalıtılmış aramalar için `per-call`).

### Araç politikası

`realtime.toolPolicy`, danışma çalıştırmasını kontrol eder:

| Politika         | Davranış                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Danışma aracını sunar ve normal aracı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar. |
| `owner`          | Danışma aracını sunar ve normal aracının olağan aracı araç politikasını kullanmasına izin verir.                                                      |
| `none`           | Danışma aracını sunmaz. Özel `realtime.tools` yine de gerçek zamanlı sağlayıcıya iletilir.                               |

### Gerçek zamanlı sağlayıcı örnekleri

<Tabs>
  <Tab title="Google Gemini Live">
    Varsayılanlar: API anahtarı `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` veya `GOOGLE_GENERATIVE_AI_API_KEY` üzerinden; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; ses `Kore`.
    `sessionResumption` ve `contextWindowCompression`, daha uzun ve yeniden
    bağlanabilir aramalar için varsayılan olarak açıktır. Telefon sesi üzerinde
    daha hızlı sıra alma davranışını ayarlamak için `silenceDurationMs`,
    `startSensitivity` ve `endSensitivity` kullanın.

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

[Google provider](/tr/providers/google) ve
[OpenAI provider](/tr/providers/openai) sayfalarına sağlayıcıya özgü gerçek zamanlı ses
seçenekleri için bakın.

## Akış transkripsiyonu

`streaming`, canlı çağrı sesi için gerçek zamanlı bir transkripsiyon sağlayıcısı seçer.

Geçerli çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmamışsa Voice Call ilk kayıtlı gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı transkripsiyon sağlayıcıları: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI (`xai`); bunlar kendi sağlayıcı plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `streaming.providers.<providerId>` altında bulunur.
- Twilio kabul edilmiş bir akış `start` mesajı gönderdikten sonra Voice Call akışı hemen kaydeder, sağlayıcı bağlanırken gelen medyayı transkripsiyon sağlayıcısı üzerinden kuyruğa alır ve ilk karşılamayı yalnızca gerçek zamanlı transkripsiyon hazır olduktan sonra başlatır.
- `streaming.provider` kayıtlı olmayan bir sağlayıcıyı işaret ederse veya hiç sağlayıcı kayıtlı değilse Voice Call bir uyarı günlüğe yazar ve tüm plugin'i başarısız yapmak yerine medya akışını atlar.

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

## Çağrılar için TTS

Voice Call, çağrılarda akış konuşması için temel `messages.tts` yapılandırmasını
kullanır. Bunu plugin yapılandırması altında **aynı biçimle** geçersiz
kılabilirsiniz; `messages.tts` ile derin birleştirme yapılır.

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
**Microsoft konuşması sesli çağrılar için yok sayılır.** Telefon sesi PCM gerektirir;
geçerli Microsoft aktarımı telefon PCM çıktısı sunmaz.
</Warning>

Davranış notları:

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) `openclaw doctor --fix` tarafından onarılır; kaydedilmiş yapılandırma `tts.providers.<provider>` kullanmalıdır.
- Twilio medya akışı etkinleştirildiğinde temel TTS kullanılır; aksi halde çağrılar sağlayıcıya özgü seslere geri döner.
- Bir Twilio medya akışı zaten etkinse Voice Call TwiML `<Say>` seçeneğine geri dönmez. Bu durumda telefon TTS kullanılamıyorsa, iki oynatma yolunu karıştırmak yerine oynatma isteği başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya geri döndüğünde Voice Call hata ayıklama için sağlayıcı zincirini (`from`, `to`, `attempts`) içeren bir uyarıyı günlüğe yazar.
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

## Gelen çağrılar

Gelen çağrı ilkesi varsayılan olarak `disabled` değerindedir. Gelen çağrıları etkinleştirmek için şunu ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` düşük güvence düzeyine sahip bir arayan kimliği filtresidir. Plugin, sağlayıcı tarafından sağlanan `From` değerini normalleştirir ve
`allowFrom` ile karşılaştırır. Webhook doğrulaması sağlayıcı teslimini ve
yük bütünlüğünü doğrular, ancak PSTN/VoIP arayan numarası sahipliğini
**kanıtlamaz**. `allowFrom` değerini güçlü arayan kimliği olarak değil,
arayan kimliği filtrelemesi olarak değerlendirin.
</Warning>

Otomatik yanıtlar aracı sistemini kullanır. `responseModel`,
`responseSystemPrompt` ve `responseTimeoutMs` ile ayarlayın.

### Numara başına yönlendirme

Bir Voice Call plugin'i birden fazla telefon numarası için çağrı aldığında
ve her numaranın farklı bir hat gibi davranması gerektiğinde `numbers` kullanın. Örneğin, bir
numara samimi bir kişisel asistan kullanırken başka bir numara iş
kişiliği, farklı bir yanıt aracısı ve farklı bir TTS sesi kullanabilir.

Rotalar sağlayıcı tarafından sağlanan aranan `To` numarasından seçilir. Anahtarlar
E.164 numaraları olmalıdır. Bir çağrı geldiğinde Voice Call eşleşen rotayı bir kez çözer,
eşleşen rotayı çağrı kaydında saklar ve bu etkin yapılandırmayı
karşılama, klasik otomatik yanıt yolu, gerçek zamanlı danışma yolu ve TTS
oynatımı için yeniden kullanır. Hiçbir rota eşleşmezse genel Voice Call yapılandırması kullanılır.
Giden çağrılar `numbers` kullanmaz; çağrıyı başlatırken giden hedefi, mesajı ve
oturumu açıkça geçirin.

Rota geçersiz kılmaları şu anda şunları destekler:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` rota değeri genel Voice Call `tts` yapılandırmasının üzerine derin birleştirilir, bu nedenle
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

### Konuşulan çıktı sözleşmesi

Otomatik yanıtlar için Voice Call sistem istemine katı bir konuşulan çıktı
sözleşmesi ekler:

```text
{"spoken":"..."}
```

Voice Call konuşma metnini savunmacı biçimde çıkarır:

- Akıl yürütme/hata içeriği olarak işaretlenmiş yükleri yok sayar.
- Doğrudan JSON, çit içine alınmış JSON veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, konuşma oynatımının arayana yönelik metne odaklanmasını sağlar ve
planlama metninin sese sızmasını önler.

### Konuşma başlatma davranışı

Giden `conversation` çağrıları için ilk mesaj işleme canlı oynatma durumuna bağlıdır:

- Araya girme kuyruğu temizleme ve otomatik yanıt yalnızca ilk karşılama etkin biçimde konuşulurken bastırılır.
- İlk oynatma başarısız olursa çağrı `listening` durumuna döner ve ilk mesaj yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, akış bağlantısında ek gecikme olmadan başlar.
- Araya girme etkin oynatmayı iptal eder ve kuyruğa alınmış ancak henüz oynatılmayan Twilio TTS girdilerini temizler. Temizlenen girdiler atlandı olarak çözümlenir, böylece takip yanıt mantığı asla oynatılmayacak sesi beklemeden devam edebilir.
- Gerçek zamanlı sesli konuşmalar, gerçek zamanlı akışın kendi açılış sırasını kullanır. Voice Call bu ilk mesaj için eski bir `<Say>` TwiML güncellemesi göndermez, böylece giden `<Connect><Stream>` oturumları bağlı kalır.

### Twilio akışı bağlantı kesme bekleme süresi

Bir Twilio medya akışının bağlantısı kesildiğinde Voice Call çağrıyı otomatik
sonlandırmadan önce **2000 ms** bekler:

- Akış bu pencere sırasında yeniden bağlanırsa otomatik sonlandırma iptal edilir.
- Bekleme süresinden sonra hiçbir akış yeniden kaydolmazsa takılı kalan etkin çağrıları önlemek için çağrı sonlandırılır.

## Eski çağrı temizleyici

Hiçbir zaman sonlandırıcı bir Webhook almayan çağrıları sonlandırmak için
`staleCallReaperSeconds` kullanın (örneğin, hiçbir zaman tamamlanmayan bildirim modu çağrıları).
Varsayılan değer `0`dır (devre dışı).

Önerilen aralıklar:

- **Üretim:** bildirim tarzı akışlar için `120`-`300` saniye.
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

Gateway önünde bir proxy veya tünel bulunduğunda plugin, imza doğrulaması için
genel URL'yi yeniden oluşturur. Bu seçenekler hangi iletilen üst bilgilerin
güvenilir olduğunu denetler:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  İletme üst bilgilerindeki izin verilen ana makine listesi.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  İletilen üst bilgilere izin listesi olmadan güven.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  İletilen üst bilgilere yalnızca istek uzak IP'si listeyle eşleştiğinde güven.
</ParamField>

Ek korumalar:

- Webhook **yeniden oynatma koruması** Twilio ve Plivo için etkindir. Yeniden oynatılan geçerli Webhook istekleri onaylanır ancak yan etkiler için atlanır.
- Twilio konuşma sıraları `<Gather>` geri çağrılarında sıra başına bir belirteç içerir, böylece eski/yeniden oynatılan konuşma geri çağrıları daha yeni bekleyen bir transkript sırasını karşılayamaz.
- Kimliği doğrulanmamış Webhook istekleri, sağlayıcının gerekli imza üst bilgileri eksik olduğunda gövde okumalarından önce reddedilir.
- voice-call Webhook'u, paylaşılan ön kimlik doğrulama gövde profilini (64 KB / 5 saniye) ve imza doğrulamasından önce IP başına eşzamanlı istek sınırını kullanır.

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

Gateway zaten çalışırken operasyonel `voicecall` komutları, CLI ikinci bir
webhook sunucusuna bağlanmasın diye Gateway'in sahip olduğu sesli arama çalışma
zamanına devreder. Ulaşılabilir bir Gateway yoksa komutlar bağımsız bir CLI
çalışma zamanına geri döner.

`latency`, varsayılan sesli arama depolama yolundan `calls.jsonl` dosyasını
okur. Farklı bir günlüğü göstermek için `--file <path>`, analizi son N kayıtla
sınırlamak için `--last <n>` kullanın (varsayılan 200). Çıktı, tur gecikmesi ve
dinleme-bekleme süreleri için p50/p90/p99 içerir.

## Agent aracı

Araç adı: `voice_call`.

| Eylem           | Bağımsız değişkenler                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Bu repo, `skills/voice-call/SKILL.md` konumunda eşleşen bir Skills belgesiyle
birlikte gelir.

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
aramaları, bağlantı sonrası rakamlara ihtiyaç duyuyorsa arama oluşturulduktan
sonra `voicecall.dtmf` kullanmalıdır.

## Sorun giderme

### Kurulum webhook açığa çıkarmasında başarısız oluyor

Kurulumu Gateway'i çalıştıran aynı ortamdan çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx` ve `plivo` için `webhook-exposure` yeşil olmalıdır.
Yapılandırılmış bir `publicUrl`, yerel veya özel ağ alanını gösterdiğinde yine
de başarısız olur, çünkü operatör bu adreslere geri arama yapamaz. `publicUrl`
olarak `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` veya `fd00::/8` kullanmayın.

Twilio bildirim modu giden aramaları, ilk `<Say>` TwiML'lerini doğrudan
create-call isteğinde gönderir; bu nedenle ilk konuşulan mesaj Twilio'nun
webhook TwiML'ini getirmesine bağlı değildir. Durum geri çağrıları, konuşma
aramaları, bağlantı öncesi DTMF, gerçek zamanlı akışlar ve bağlantı sonrası
arama denetimi için genel bir webhook yine de gereklidir.

Tek bir genel açığa çıkarma yolu kullanın:

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

`--yes` geçmediğiniz sürece `voicecall smoke` bir kuru çalıştırmadır.

### Sağlayıcı kimlik bilgileri başarısız oluyor

Seçilen sağlayıcıyı ve gerekli kimlik bilgisi alanlarını kontrol edin:

- Twilio: `twilio.accountSid`, `twilio.authToken` ve `fromNumber` ya da
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` ve `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` ve
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` ve `fromNumber`.

Kimlik bilgileri Gateway ana makinesinde bulunmalıdır. Yerel bir kabuk profilini
düzenlemek, zaten çalışan bir Gateway yeniden başlatılana veya ortamını yeniden
yükleyene kadar onu etkilemez.

### Aramalar başlıyor ancak sağlayıcı webhook'ları ulaşmıyor

Sağlayıcı konsolunun tam genel webhook URL'sini gösterdiğini doğrulayın:

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

- `publicUrl`, `serve.path` değerinden farklı bir yolu gösteriyor.
- Tünel URL'si Gateway başladıktan sonra değişti.
- Bir proxy isteği iletiyor ancak host/proto başlıklarını kaldırıyor veya yeniden yazıyor.
- Güvenlik duvarı veya DNS, genel ana makine adını Gateway dışında bir yere yönlendiriyor.
- Gateway, Voice Call Plugin etkinleştirilmeden yeniden başlatıldı.

Gateway'in önünde bir ters proxy veya tünel olduğunda,
`webhookSecurity.allowedHosts` değerini genel ana makine adına ayarlayın ya da
bilinen bir proxy adresi için `webhookSecurity.trustedProxyIPs` kullanın.
`webhookSecurity.trustForwardingHeaders` değerini yalnızca proxy sınırı sizin
kontrolünüz altındaysa kullanın.

### İmza doğrulaması başarısız oluyor

Sağlayıcı imzaları, OpenClaw'ın gelen istekten yeniden oluşturduğu genel URL'ye
göre kontrol edilir. İmzalar başarısız olursa:

- Sağlayıcı webhook URL'sinin şema, host ve yol dahil olmak üzere `publicUrl` ile tam olarak eşleştiğini doğrulayın.
- ngrok ücretsiz katman URL'leri için tünel ana makine adı değiştiğinde `publicUrl` değerini güncelleyin.
- Proxy'nin özgün host ve proto başlıklarını koruduğundan emin olun ya da `webhookSecurity.allowedHosts` yapılandırın.
- Yerel test dışında `skipSignatureVerification` etkinleştirmeyin.

### Google Meet Twilio katılımları başarısız oluyor

Google Meet, Twilio aramalı katılımları için bu Plugin'i kullanır. Önce Voice Call'u doğrulayın:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Ardından Google Meet aktarımını açıkça doğrulayın:

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call yeşilse ancak Meet katılımcısı hiç katılmıyorsa Meet aramalı katılım
numarasını, PIN'i ve `--dtmf-sequence` değerini kontrol edin. Telefon araması
sağlıklı olabilir, ancak toplantı hatalı bir DTMF dizisini reddediyor veya yok
sayıyor olabilir.

Google Meet, Meet DTMF dizisini ve giriş metnini `voicecall.start` öğesine
iletir. Twilio aramaları için Voice Call önce DTMF TwiML'ini sunar, webhook'a
geri yönlendirir, ardından kaydedilen girişin telefon katılımcısı toplantıya
katıldıktan sonra oluşturulması için gerçek zamanlı medya akışını açar.

Canlı aşama izleme için `openclaw logs --follow` kullanın. Sağlıklı bir Twilio
Meet katılımı şu sırayı günlüğe yazar:

- Google Meet, Twilio katılımını Voice Call'a devreder.
- Voice Call, bağlantı öncesi DTMF TwiML'ini depolar.
- Twilio başlangıç TwiML'i tüketilir ve gerçek zamanlı işleme öncesinde sunulur.
- Voice Call, Twilio araması için gerçek zamanlı TwiML sunar.
- Gerçek zamanlı köprü, başlangıç selamlaması kuyruğa alınmış olarak başlar.

`openclaw voicecall tail` kalıcı arama kayıtlarını yine de gösterir; arama
durumu ve transkriptler için kullanışlıdır, ancak her webhook/gerçek zamanlı
geçiş burada görünmez.

### Gerçek zamanlı aramada konuşma yok

Yalnızca bir ses modunun etkin olduğunu doğrulayın. `realtime.enabled` ve
`streaming.enabled` aynı anda true olamaz.

Gerçek zamanlı Twilio aramaları için ayrıca şunları doğrulayın:

- Gerçek zamanlı sağlayıcı Plugin yüklü ve kayıtlı.
- `realtime.provider` ayarlanmamış ya da kayıtlı bir sağlayıcıyı adlandırıyor.
- Sağlayıcı API anahtarı Gateway süreci tarafından kullanılabilir.
- `openclaw logs --follow`, gerçek zamanlı TwiML'in sunulduğunu, gerçek zamanlı köprünün başlatıldığını ve başlangıç selamlamasının kuyruğa alındığını gösteriyor.

## İlgili

- [Konuşma modu](/tr/nodes/talk)
- [Metinden konuşmaya](/tr/tools/tts)
- [Sesle uyandırma](/tr/nodes/voicewake)
