---
read_when:
    - OpenClaw'dan giden bir sesli arama yapmak istiyorsunuz
    - Sesli arama Plugin'ini yapılandırıyor veya geliştiriyorsunuz
    - Telefon altyapısında gerçek zamanlı sese veya akış halinde transkripsiyona ihtiyacınız var
sidebarTitle: Voice call
summary: Twilio, Telnyx veya Plivo üzerinden giden sesli aramalar yapın ve gelen sesli aramaları kabul edin; isteğe bağlı gerçek zamanlı ses ve akışlı transkripsiyon desteğiyle
title: Sesli arama Plugin
x-i18n:
    generated_at: "2026-05-01T09:03:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6334e5418e0fb530fc5d372ee1ada06ba987ce86bbf70746ee4ffe4c3ed4844e
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw için bir Plugin aracılığıyla sesli aramalar. Giden bildirimleri,
çok turlu konuşmaları, tam çift yönlü gerçek zamanlı sesi, akış
transkripsiyonunu ve izin listesi politikalarıyla gelen aramaları destekler.

**Mevcut sağlayıcılar:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML aktarımı + GetInput
konuşma), `mock` (geliştirme/ağ yok).

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
      <Tab title="Yerel bir klasörden (geliştirme)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    npm, OpenClaw'a ait paketi kullanımdan kaldırılmış olarak bildirirse, bu paket sürümü
    daha eski bir harici paket serisindendir; daha yeni bir npm paketi yayımlanana kadar
    güncel paketlenmiş bir OpenClaw derlemesi veya yerel klasör yolu kullanın.

    Ardından Plugin'in yüklenmesi için Gateway'i yeniden başlatın.

  </Step>
  <Step title="Sağlayıcıyı ve Webhook'u yapılandırın">
    Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın (tam yapı için
    aşağıdaki [Yapılandırma](#configuration) bölümüne bakın). En az şunlar gerekir:
    `provider`, sağlayıcı kimlik bilgileri, `fromNumber` ve herkese açık olarak
    erişilebilen bir Webhook URL'si.
  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    openclaw voicecall setup
    ```

    Varsayılan çıktı sohbet günlüklerinde ve terminallerde okunabilir. Plugin'in
    etkinleştirilmesini, sağlayıcı kimlik bilgilerini, Webhook erişimini ve yalnızca
    bir ses modunun (`streaming` veya `realtime`) etkin olduğunu denetler. Betikler için
    `--json` kullanın.

  </Step>
  <Step title="Duman testi">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    İkisi de varsayılan olarak deneme çalıştırmasıdır. Kısa bir giden bildirim
    araması gerçekten başlatmak için `--yes` ekleyin:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx ve Plivo için kurulumun **herkese açık bir Webhook URL'sine**
çözümlenmesi gerekir. `publicUrl`, tünel URL'si, Tailscale URL'si veya sunum
geri dönüşü loopback ya da özel ağ alanına çözümlenirse kurulum, operatör
Webhook'larını alamayacak bir sağlayıcıyı başlatmak yerine başarısız olur.
</Warning>

## Yapılandırma

`enabled: true` ise ancak seçili sağlayıcıda kimlik bilgileri eksikse,
Gateway başlangıcı eksik anahtarlarla birlikte setup-incomplete uyarısı günlüğe yazar ve
çalışma zamanını başlatmayı atlar. Komutlar, RPC çağrıları ve agent araçları
kullanıldığında eksik sağlayıcı yapılandırmasını yine tam olarak döndürür.

<Note>
Voice-call kimlik bilgileri SecretRef kabul eder. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` ve `plugins.entries.voice-call.config.tts.providers.*.apiKey` standart SecretRef yüzeyi üzerinden çözümlenir; bkz. [SecretRef kimlik bilgisi yüzeyi](/tr/reference/secretref-credential-surface).
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
    - Twilio, Telnyx ve Plivo'nun tamamı **herkese açık olarak erişilebilen** bir Webhook URL'si gerektirir.
    - `mock` yerel bir geliştirme sağlayıcısıdır (ağ çağrısı yok).
    - `skipSignatureVerification` true değilse Telnyx `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
    - `skipSignatureVerification` yalnızca yerel test içindir.
    - ngrok ücretsiz katmanında `publicUrl` değerini tam ngrok URL'sine ayarlayın; imza doğrulaması her zaman uygulanır.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`, Twilio Webhook'larına geçersiz imzalarla **yalnızca** `tunnel.provider="ngrok"` olduğunda ve `serve.bind` loopback olduğunda (ngrok yerel aracısı) izin verir. Yalnızca yerel geliştirme içindir.
    - Ngrok ücretsiz katman URL'leri değişebilir veya ara sayfa davranışı ekleyebilir; `publicUrl` saparsa Twilio imzaları başarısız olur. Üretim: kararlı bir etki alanı veya Tailscale funnel tercih edin.

  </Accordion>
  <Accordion title="Akış bağlantısı sınırları">
    - `streaming.preStartTimeoutMs`, hiçbir zaman geçerli bir `start` çerçevesi göndermeyen soketleri kapatır.
    - `streaming.maxPendingConnections`, toplam kimliği doğrulanmamış başlatma öncesi soket sayısını sınırlar.
    - `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlatma öncesi soketleri sınırlar.
    - `streaming.maxConnections`, toplam açık medya akışı soketlerini (bekleyen + etkin) sınırlar.

  </Accordion>
  <Accordion title="Eski yapılandırma geçişleri">
    `provider: "log"`, `twilio.from` veya eski
    `streaming.*` OpenAI anahtarlarını kullanan eski yapılandırmalar `openclaw doctor --fix`
    tarafından yeniden yazılır. Çalışma zamanı geri dönüşü şimdilik eski voice-call anahtarlarını
    kabul etmeye devam eder, ancak yeniden yazma yolu `openclaw doctor --fix` komutudur ve uyumluluk katmanı
    geçicidir.

    Otomatik geçirilmiş akış anahtarları:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı arama sesi için tam çift yönlü gerçek zamanlı bir ses sağlayıcısı seçer.
Yalnızca sesi gerçek zamanlı transkripsiyon sağlayıcılarına ileten `streaming`den ayrıdır.

<Warning>
`realtime.enabled`, `streaming.enabled` ile birlikte kullanılamaz. Arama başına bir
ses modu seçin.
</Warning>

Mevcut çalışma zamanı davranışı:

- `realtime.enabled`, Twilio Media Streams için desteklenir.
- `realtime.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call, ilk kayıtlı gerçek zamanlı ses sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı ses sağlayıcıları: Google Gemini Live (`google`) ve OpenAI (`openai`), kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `realtime.providers.<providerId>` altında bulunur.
- Voice Call, paylaşılan `openclaw_agent_consult` gerçek zamanlı aracını varsayılan olarak kullanıma sunar. Gerçek zamanlı model, arayan daha derin akıl yürütme, güncel bilgi veya normal OpenClaw araçları istediğinde bunu çağırabilir.
- `realtime.fastContext.enabled` varsayılan olarak kapalıdır. Etkinleştirildiğinde Voice Call önce danışma sorusu için indekslenmiş bellek/oturum bağlamında arama yapar ve tam danışma agent'ına yalnızca `realtime.fastContext.fallbackToConsult` true ise geri dönmeden önce bu parçaları `realtime.fastContext.timeoutMs` içinde gerçek zamanlı modele döndürür.
- `realtime.provider` kayıtlı olmayan bir sağlayıcıyı gösteriyorsa veya hiçbir gerçek zamanlı ses sağlayıcısı kayıtlı değilse Voice Call, tüm Plugin'i başarısız yapmak yerine bir uyarı günlüğe yazar ve gerçek zamanlı medyayı atlar.
- Danışma oturumu anahtarları mevcut olduğunda var olan ses oturumunu yeniden kullanır, ardından takip danışma çağrılarının arama sırasında bağlamı koruması için arayan/aranan telefon numarasına geri döner.

### Araç politikası

`realtime.toolPolicy`, danışma çalıştırmasını denetler:

| Politika         | Davranış                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Danışma aracını kullanıma sunar ve normal agent'ı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar. |
| `owner`          | Danışma aracını kullanıma sunar ve normal agent'ın normal agent araç politikasını kullanmasına izin verir.                                |
| `none`           | Danışma aracını kullanıma sunmaz. Özel `realtime.tools` yine de gerçek zamanlı sağlayıcıya geçirilir.                                     |

### Gerçek zamanlı sağlayıcı örnekleri

<Tabs>
  <Tab title="Google Gemini Live">
    Varsayılanlar: API anahtarı `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` veya `GOOGLE_GENERATIVE_AI_API_KEY` içinden; model
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

`streaming`, canlı arama sesi için gerçek zamanlı bir transkripsiyon sağlayıcısı seçer.

Mevcut çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call, kayıtlı ilk gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Paketle gelen gerçek zamanlı transkripsiyon sağlayıcıları: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI (`xai`); bunlar kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcının sahibi olduğu ham yapılandırma `streaming.providers.<providerId>` altında bulunur.
- Twilio kabul edilen bir akış `start` mesajı gönderdikten sonra Voice Call akışı hemen kaydeder, sağlayıcı bağlanırken gelen medyayı transkripsiyon sağlayıcısı üzerinden kuyruğa alır ve ilk selamlamayı yalnızca gerçek zamanlı transkripsiyon hazır olduktan sonra başlatır.
- `streaming.provider` kayıtlı olmayan bir sağlayıcıyı gösteriyorsa veya hiç sağlayıcı kayıtlı değilse Voice Call bir uyarı günlüğe yazar ve tüm Plugin'i başarısız yapmak yerine medya akışını atlar.

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
yapılandırmasını kullanır. Bunu Plugin yapılandırması altında **aynı şekille**
geçersiz kılabilirsiniz; `messages.tts` ile derin birleştirme yapılır.

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
**Microsoft speech, sesli aramalar için yok sayılır.** Telefon sesinin PCM'ye ihtiyacı vardır;
mevcut Microsoft taşıması telefon PCM çıktısını sunmaz.
</Warning>

Davranış notları:

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) `openclaw doctor --fix` tarafından onarılır; commit edilmiş yapılandırma `tts.providers.<provider>` kullanmalıdır.
- Twilio medya akışı etkinleştirildiğinde çekirdek TTS kullanılır; aksi halde aramalar sağlayıcıya özgü seslere geri döner.
- Bir Twilio medya akışı zaten etkinse Voice Call, TwiML `<Say>` seçeneğine geri dönmez. Bu durumda telefon TTS kullanılamıyorsa oynatma isteği iki oynatma yolunu karıştırmak yerine başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya geri döndüğünde Voice Call, hata ayıklama için sağlayıcı zinciriyle (`from`, `to`, `attempts`) birlikte bir uyarı günlüğe yazar.
- Twilio araya girme veya akış sökümü bekleyen TTS kuyruğunu temizlediğinde, kuyruğa alınmış oynatma istekleri arayanları oynatma tamamlanmasını bekler durumda bırakmak yerine sonuçlanır.

### TTS örnekleri

<Tabs>
  <Tab title="Yalnızca çekirdek TTS">
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
  <Tab title="ElevenLabs'e geçersiz kıl (yalnızca aramalar)">
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
  <Tab title="OpenAI model geçersiz kılması (derin birleştirme)">
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
`inboundPolicy: "allowlist"` düşük güvenceli bir arayan kimliği filtresidir.
Plugin, sağlayıcı tarafından sağlanan `From` değerini normalleştirir ve bunu
`allowFrom` ile karşılaştırır. Webhook doğrulaması sağlayıcı teslimini ve
yük bütünlüğünü doğrular, ancak PSTN/VoIP arayan numarası sahipliğini
**kanıtlamaz**. `allowFrom` değerini güçlü arayan kimliği olarak değil,
arayan kimliği filtrelemesi olarak değerlendirin.
</Warning>

Otomatik yanıtlar aracı sistemini kullanır. `responseModel`,
`responseSystemPrompt` ve `responseTimeoutMs` ile ayarlayın.

### Konuşulan çıktı sözleşmesi

Otomatik yanıtlar için Voice Call, sistem istemine katı bir konuşulan çıktı
sözleşmesi ekler:

```text
{"spoken":"..."}
```

Voice Call konuşma metnini savunmalı biçimde çıkarır:

- Akıl yürütme/hata içeriği olarak işaretlenmiş yükleri yok sayar.
- Doğrudan JSON'u, çit içine alınmış JSON'u veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve muhtemel planlama/meta giriş paragraflarını kaldırır.

Bu, konuşulan oynatmanın arayana dönük metne odaklanmasını sağlar ve
planlama metninin sese sızmasını önler.

### Konuşma başlatma davranışı

Giden `conversation` aramaları için ilk mesaj işleme canlı oynatma durumuna bağlıdır:

- Araya girme kuyruğu temizleme ve otomatik yanıt yalnızca ilk selamlama aktif olarak konuşulurken bastırılır.
- İlk oynatma başarısız olursa arama `listening` durumuna döner ve ilk mesaj yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, akış bağlantısında ek gecikme olmadan başlar.
- Araya girme aktif oynatmayı iptal eder ve kuyruğa alınmış ancak henüz oynatılmayan Twilio TTS girişlerini temizler. Temizlenen girişler atlanmış olarak çözümlenir; böylece takip yanıt mantığı, hiç oynatılmayacak sesi beklemeden devam edebilir.
- Gerçek zamanlı sesli konuşmalar, gerçek zamanlı akışın kendi açılış sırasını kullanır. Voice Call bu ilk mesaj için eski bir `<Say>` TwiML güncellemesi göndermez; bu nedenle giden `<Connect><Stream>` oturumları bağlı kalır.

### Twilio akış bağlantısı kesilme ek süresi

Bir Twilio medya akışının bağlantısı kesildiğinde Voice Call, aramayı
otomatik sonlandırmadan önce **2000 ms** bekler:

- Akış bu pencere sırasında yeniden bağlanırsa otomatik sonlandırma iptal edilir.
- Ek süreden sonra hiçbir akış yeniden kaydolmazsa takılı kalan aktif aramaları önlemek için arama sonlandırılır.

## Bayat arama temizleyici

Hiçbir terminal Webhook almayan aramaları (örneğin hiç tamamlanmayan bildirim modu
aramaları) sonlandırmak için `staleCallReaperSeconds` kullanın. Varsayılan
`0` değeridir (devre dışı).

Önerilen aralıklar:

- **Production:** Bildirim tarzı akışlar için `120`-`300` saniye.
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

Gateway'in önünde bir proxy veya tünel bulunduğunda Plugin, imza doğrulaması
için genel URL'yi yeniden oluşturur. Bu seçenekler hangi yönlendirilmiş
başlıkların güvenilir olduğunu denetler:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Yönlendirme başlıklarından gelen konaklara izin listesi uygula.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Yönlendirilmiş başlıklara izin listesi olmadan güven.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Yalnızca isteğin uzak IP'si listeyle eşleştiğinde yönlendirilmiş başlıklara güven.
</ParamField>

Ek korumalar:

- Webhook **yeniden oynatma koruması** Twilio ve Plivo için etkindir. Yeniden oynatılan geçerli Webhook istekleri onaylanır ancak yan etkiler için atlanır.
- Twilio konuşma turları, `<Gather>` geri çağrılarında tur başına bir belirteç içerir; böylece bayat/yeniden oynatılmış konuşma geri çağrıları daha yeni bekleyen bir transkript turunu karşılayamaz.
- Sağlayıcının gerekli imza başlıkları eksik olduğunda kimliği doğrulanmamış Webhook istekleri gövde okumalarından önce reddedilir.
- voice-call Webhook'u, imza doğrulamasından önce paylaşılan ön kimlik doğrulama gövde profilini (64 KB / 5 saniye) ve IP başına uçuşta sınırını kullanır.

Kararlı bir genel konakla örnek:

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

Gateway zaten çalışırken operasyonel `voicecall` komutları, CLI'ın ikinci bir
Webhook sunucusu bağlamaması için Gateway'in sahibi olduğu voice-call çalışma
zamanına devreder. Erişilebilir bir Gateway yoksa komutlar bağımsız CLI çalışma
zamanına geri döner.

`latency`, varsayılan voice-call depolama yolundan `calls.jsonl` dosyasını okur.
Farklı bir günlüğü işaret etmek için `--file <path>`, analizi son N kayıtla
(varsayılan 200) sınırlamak için `--last <n>` kullanın. Çıktı, tur gecikmesi ve
dinleme-bekleme süreleri için p50/p90/p99 içerir.

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

Bu repo `skills/voice-call/SKILL.md` konumunda eşleşen bir skill dokümanı gönderir.

## Gateway RPC

| Yöntem               | Argümanlar                                |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` yalnızca `mode: "conversation"` ile geçerlidir. Bildirim modu aramaları
bağlantı sonrası rakamlara ihtiyaç duyuyorsa arama oluştuktan sonra
`voicecall.dtmf` kullanmalıdır.

## Sorun giderme

### Kurulum Webhook yayınını başarısız yapıyor

Kurulumu Gateway'i çalıştıran aynı ortamdan çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx` ve `plivo` için `webhook-exposure` yeşil olmalıdır.
Yapılandırılmış bir `publicUrl`, yerel veya özel ağ alanını işaret ettiğinde
yine de başarısız olur, çünkü taşıyıcı bu adreslere geri çağrı yapamaz.
`publicUrl` olarak `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`,
`172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` veya
`fd00::/8` kullanmayın.

Bir genel erişim yolu kullanın:

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

`voicecall smoke`, `--yes` iletmediğiniz sürece bir deneme çalıştırmasıdır.

### Sağlayıcı kimlik bilgileri başarısız oluyor

Seçili sağlayıcıyı ve gerekli kimlik bilgisi alanlarını kontrol edin:

- Twilio: `twilio.accountSid`, `twilio.authToken` ve `fromNumber`, veya
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` ve `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` ve
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` ve `fromNumber`.

Kimlik bilgileri Gateway ana makinesinde bulunmalıdır. Yerel bir kabuk profilini
düzenlemek, halihazırda çalışan bir Gateway yeniden başlatılana veya ortamını
yeniden yükleyene kadar onu etkilemez.

### Çağrılar başlıyor ancak sağlayıcı Webhook'ları ulaşmıyor

Sağlayıcı konsolunun tam genel Webhook URL'sini işaret ettiğini doğrulayın:

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

- `publicUrl`, `serve.path` değerinden farklı bir yolu işaret eder.
- Gateway başladıktan sonra tünel URL'si değişmiştir.
- Bir proxy isteği iletir ancak host/proto üst bilgilerini kaldırır veya yeniden yazar.
- Güvenlik duvarı veya DNS, genel ana makine adını Gateway dışında bir yere yönlendirir.
- Gateway, Voice Call Plugin etkinleştirilmeden yeniden başlatılmıştır.

Gateway'in önünde bir ters proxy veya tünel olduğunda,
`webhookSecurity.allowedHosts` değerini genel ana makine adına ayarlayın veya
bilinen bir proxy adresi için `webhookSecurity.trustedProxyIPs` kullanın.
`webhookSecurity.trustForwardingHeaders` değerini yalnızca proxy sınırı sizin
kontrolünüz altındaysa kullanın.

### İmza doğrulaması başarısız oluyor

Sağlayıcı imzaları, OpenClaw'ın gelen istekten yeniden oluşturduğu genel URL'ye
göre kontrol edilir. İmzalar başarısız olursa:

- Sağlayıcı Webhook URL'sinin şema, ana makine ve yol dahil olmak üzere
  `publicUrl` ile tam olarak eşleştiğini doğrulayın.
- Ücretsiz ngrok katmanı URL'leri için tünel ana makine adı değiştiğinde
  `publicUrl` değerini güncelleyin.
- Proxy'nin özgün host ve proto üst bilgilerini koruduğundan emin olun veya
  `webhookSecurity.allowedHosts` yapılandırın.
- Yerel test dışında `skipSignatureVerification` etkinleştirmeyin.

### Google Meet Twilio katılımları başarısız oluyor

Google Meet, Twilio aramayla katılımlar için bu Plugin'i kullanır. Önce Voice Call'u doğrulayın:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Ardından Google Meet taşımasını açıkça doğrulayın:

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call yeşilse ancak Meet katılımcısı hiç katılmıyorsa Meet aramayla katılım
numarasını, PIN'i ve `--dtmf-sequence` değerini kontrol edin. Telefon çağrısı
sağlıklı olabilir, ancak toplantı hatalı bir DTMF dizisini reddedebilir veya
yok sayabilir.

Google Meet, Meet DTMF dizisini ve giriş metnini `voicecall.start` öğesine
iletir. Twilio çağrıları için Voice Call önce DTMF TwiML'i sunar, Webhook'a
geri yönlendirir, ardından gerçek zamanlı medya akışını açar; böylece kaydedilen
giriş, telefon katılımcısı toplantıya katıldıktan sonra oluşturulur.

Canlı aşama izi için `openclaw logs --follow` kullanın. Sağlıklı bir Twilio Meet
katılımı bu sırayı günlüğe kaydeder:

- Google Meet, Twilio katılımını Voice Call'a devreder.
- Voice Call, bağlantı öncesi DTMF TwiML'ini depolar.
- Twilio başlangıç TwiML'i gerçek zamanlı işlemden önce tüketilir ve sunulur.
- Voice Call, Twilio çağrısı için gerçek zamanlı TwiML sunar.
- Gerçek zamanlı köprü, ilk selamlama kuyruğa alınmış şekilde başlar.

`openclaw voicecall tail` kalıcı çağrı kayıtlarını yine de gösterir; çağrı
durumu ve transkriptler için kullanışlıdır, ancak her Webhook/gerçek zamanlı
geçiş orada görünmez.

### Gerçek zamanlı çağrıda konuşma yok

Yalnızca bir ses modunun etkin olduğunu doğrulayın. `realtime.enabled` ve
`streaming.enabled` aynı anda true olamaz.

Gerçek zamanlı Twilio çağrıları için ayrıca şunları doğrulayın:

- Bir gerçek zamanlı sağlayıcı Plugin yüklü ve kaydedilmiş.
- `realtime.provider` ayarlanmamış ya da kayıtlı bir sağlayıcının adını veriyor.
- Sağlayıcı API anahtarı Gateway süreci için kullanılabilir.
- `openclaw logs --follow`, gerçek zamanlı TwiML'in sunulduğunu, gerçek zamanlı
  köprünün başladığını ve ilk selamlamanın kuyruğa alındığını gösteriyor.

## İlgili

- [Konuşma modu](/tr/nodes/talk)
- [Metinden konuşmaya](/tr/tools/tts)
- [Sesle uyandırma](/tr/nodes/voicewake)
