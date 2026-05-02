---
read_when:
    - OpenClaw üzerinden giden bir sesli arama yapmak istiyorsunuz
    - Sesli arama Plugin'ini yapılandırıyor veya geliştiriyorsunuz
    - Telefon sistemlerinde gerçek zamanlı ses veya akışlı transkripsiyon gerekir
sidebarTitle: Voice call
summary: Twilio, Telnyx veya Plivo aracılığıyla giden sesli aramalar yapın ve gelen sesli aramaları kabul edin; isteğe bağlı gerçek zamanlı ses ve akışlı transkripsiyon desteğiyle
title: Sesli arama Plugin
x-i18n:
    generated_at: "2026-05-02T09:03:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc27646aca94c88d50d42838e166ac81eba3373154797cbb564e9c2eab0533fa
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw için bir Plugin aracılığıyla sesli aramalar. Giden bildirimleri,
çok turlu konuşmaları, tam çift yönlü gerçek zamanlı sesi, akışlı
transkripsiyonu ve izin listesi ilkeleriyle gelen aramaları destekler.

**Mevcut sağlayıcılar:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (geliştirme/ağ yok).

<Note>
Voice Call Plugin’i **Gateway işleminin içinde** çalışır. Uzak bir
Gateway kullanıyorsanız Plugin’i Gateway’i çalıştıran makineye kurup
yapılandırın, ardından yüklenmesi için Gateway’i yeniden başlatın.
</Note>

## Hızlı başlangıç

<Steps>
  <Step title="Plugin’i yükleyin">
    <Tabs>
      <Tab title="npm’den">
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

    npm, OpenClaw’a ait paketi kullanımdan kaldırılmış olarak bildirirse bu paket sürümü
    daha eski bir harici paket serisindendir; daha yeni bir npm paketi yayımlanana kadar
    güncel paketlenmiş bir OpenClaw derlemesi veya yerel klasör yolunu kullanın.

    Ardından Plugin’in yüklenmesi için Gateway’i yeniden başlatın.

  </Step>
  <Step title="Sağlayıcıyı ve Webhook’u yapılandırın">
    Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın (tam yapı için aşağıdaki
    [Yapılandırma](#configuration) bölümüne bakın). En azından şunlar gerekir:
    `provider`, sağlayıcı kimlik bilgileri, `fromNumber` ve herkese açık olarak
    erişilebilir bir Webhook URL’si.
  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    openclaw voicecall setup
    ```

    Varsayılan çıktı sohbet günlüklerinde ve terminallerde okunabilir. Plugin’in
    etkinleştirilmesini, sağlayıcı kimlik bilgilerini, Webhook erişimini ve
    yalnızca bir ses modunun (`streaming` veya `realtime`) etkin olduğunu denetler.
    Betikler için `--json` kullanın.

  </Step>
  <Step title="Duman testi">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    İkisi de varsayılan olarak kuru çalıştırmadır. Gerçekten kısa bir
    giden bildirim araması yapmak için `--yes` ekleyin:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx ve Plivo için kurulum bir **herkese açık Webhook URL’sine**
çözümlenmelidir. `publicUrl`, tünel URL’si, Tailscale URL’si veya sunma
geri dönüşü loopback ya da özel ağ alanına çözümlenirse kurulum, operatör
Webhook’larını alamayacak bir sağlayıcıyı başlatmak yerine başarısız olur.
</Warning>

## Yapılandırma

`enabled: true` ise ancak seçili sağlayıcının kimlik bilgileri eksikse
Gateway başlatma sırasında eksik anahtarlarla birlikte kurulumun tamamlanmadığına
dair bir uyarı günlüğe yazar ve çalışma zamanını başlatmayı atlar. Komutlar,
RPC çağrıları ve ajan araçları kullanıldığında yine de eksik sağlayıcı
yapılandırmasını tam olarak döndürür.

<Note>
Sesli arama kimlik bilgileri SecretRef kabul eder. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` ve `plugins.entries.voice-call.config.tts.providers.*.apiKey` standart SecretRef yüzeyi üzerinden çözümlenir; bkz. [SecretRef kimlik bilgisi yüzeyi](/tr/reference/secretref-credential-surface).
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
    - Twilio, Telnyx ve Plivo’nun tümü **herkese açık olarak erişilebilir** bir Webhook URL’si gerektirir.
    - `mock`, yerel geliştirme sağlayıcısıdır (ağ çağrısı yok).
    - `skipSignatureVerification` true olmadığı sürece Telnyx `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
    - `skipSignatureVerification` yalnızca yerel test içindir.
    - ngrok ücretsiz katmanında `publicUrl` değerini tam ngrok URL’sine ayarlayın; imza doğrulaması her zaman uygulanır.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`, geçersiz imzalı Twilio Webhook’larına **yalnızca** `tunnel.provider="ngrok"` ve `serve.bind` loopback olduğunda (ngrok yerel ajanı) izin verir. Yalnızca yerel geliştirme içindir.
    - Ngrok ücretsiz katman URL’leri değişebilir veya ara sayfa davranışı ekleyebilir; `publicUrl` saparsa Twilio imzaları başarısız olur. Üretim: kararlı bir alan adı veya Tailscale funnel tercih edin.

  </Accordion>
  <Accordion title="Akış bağlantısı sınırları">
    - `streaming.preStartTimeoutMs`, hiçbir zaman geçerli bir `start` çerçevesi göndermeyen soketleri kapatır.
    - `streaming.maxPendingConnections`, toplam kimliği doğrulanmamış başlatma öncesi soketleri sınırlar.
    - `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlatma öncesi soketleri sınırlar.
    - `streaming.maxConnections`, toplam açık medya akışı soketlerini sınırlar (bekleyen + etkin).

  </Accordion>
  <Accordion title="Eski yapılandırma geçişleri">
    `provider: "log"`, `twilio.from` veya eski `streaming.*` OpenAI anahtarlarını
    kullanan eski yapılandırmalar `openclaw doctor --fix` tarafından yeniden yazılır.
    Çalışma zamanı geri dönüşü şimdilik eski voice-call anahtarlarını kabul etmeye
    devam eder, ancak yeniden yazma yolu `openclaw doctor --fix`tir ve uyumluluk
    katmanı geçicidir.

    Otomatik geçirilen akış anahtarları:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Oturum kapsamı

Varsayılan olarak Voice Call `sessionScope: "per-phone"` kullanır; böylece aynı
arayandan gelen tekrar aramalar konuşma belleğini korur. Her operatör aramasının
taze bağlamla başlaması gerektiğinde, örneğin resepsiyon, rezervasyon, IVR veya
aynı telefon numarasının farklı toplantıları temsil edebileceği Google Meet köprü
akışlarında `sessionScope: "per-call"` ayarlayın.

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı arama sesi için tam çift yönlü bir gerçek zamanlı ses sağlayıcısı
seçer. Yalnızca sesi gerçek zamanlı transkripsiyon sağlayıcılarına ileten
`streaming`den ayrıdır.

<Warning>
`realtime.enabled`, `streaming.enabled` ile birlikte kullanılamaz. Arama başına
bir ses modu seçin.
</Warning>

Mevcut çalışma zamanı davranışı:

- `realtime.enabled`, Twilio Media Streams için desteklenir.
- `realtime.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call ilk kayıtlı gerçek zamanlı ses sağlayıcısını kullanır.
- Paketli gerçek zamanlı ses sağlayıcıları: Google Gemini Live (`google`) ve OpenAI (`openai`), kendi sağlayıcı Plugin’leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `realtime.providers.<providerId>` altında bulunur.
- Voice Call varsayılan olarak paylaşılan `openclaw_agent_consult` gerçek zamanlı aracını açığa çıkarır. Arayan daha derin akıl yürütme, güncel bilgi veya normal OpenClaw araçları istediğinde gerçek zamanlı model bunu çağırabilir.
- `realtime.fastContext.enabled` varsayılan olarak kapalıdır. Etkinleştirildiğinde Voice Call önce danışma sorusu için indekslenmiş bellek/oturum bağlamında arama yapar ve yalnızca `realtime.fastContext.fallbackToConsult` true ise tam danışma ajanına geri düşmeden önce bu parçaları `realtime.fastContext.timeoutMs` içinde gerçek zamanlı modele döndürür.
- `realtime.provider` kayıtlı olmayan bir sağlayıcıyı gösteriyorsa veya hiç gerçek zamanlı ses sağlayıcısı kayıtlı değilse Voice Call tüm Plugin’i başarısız kılmak yerine bir uyarı günlüğe yazar ve gerçek zamanlı medyayı atlar.
- Danışma oturumu anahtarları mevcut olduğunda saklanan arama oturumunu yeniden kullanır, ardından yapılandırılan `sessionScope` değerine geri düşer (varsayılan olarak `per-phone` veya yalıtılmış aramalar için `per-call`).

### Araç ilkesi

`realtime.toolPolicy`, danışma çalıştırmasını denetler:

| İlke             | Davranış                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Danışma aracını açığa çıkarır ve normal ajanı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar. |
| `owner`          | Danışma aracını açığa çıkarır ve normal ajanın normal ajan araç ilkesini kullanmasına izin verir.                                         |
| `none`           | Danışma aracını açığa çıkarmaz. Özel `realtime.tools` yine de gerçek zamanlı sağlayıcıya geçirilir.                                      |

### Gerçek zamanlı sağlayıcı örnekleri

<Tabs>
  <Tab title="Google Gemini Live">
    Varsayılanlar: API anahtarı `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` veya `GOOGLE_GENERATIVE_AI_API_KEY` üzerinden alınır; model
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

Sağlayıcıya özel gerçek zamanlı ses seçenekleri için
[Google sağlayıcısı](/tr/providers/google) ve
[OpenAI sağlayıcısı](/tr/providers/openai) bölümlerine bakın.

## Akışlı transkripsiyon

`streaming`, canlı arama sesi için gerçek zamanlı bir transkripsiyon sağlayıcısı seçer.

Mevcut çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmamışsa, Sesli Arama ilk kayıtlı gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Birlikte gelen gerçek zamanlı transkripsiyon sağlayıcıları: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI (`xai`); bunlar kendi sağlayıcı Plugin'leri tarafından kaydedilir.
- Sağlayıcıya ait ham yapılandırma `streaming.providers.<providerId>` altında bulunur.
- Twilio kabul edilmiş bir akış `start` iletisi gönderdikten sonra, Sesli Arama akışı hemen kaydeder, sağlayıcı bağlanırken gelen medyayı transkripsiyon sağlayıcısı üzerinden kuyruğa alır ve ilk karşılamayı yalnızca gerçek zamanlı transkripsiyon hazır olduktan sonra başlatır.
- `streaming.provider` kayıtlı olmayan bir sağlayıcıyı gösteriyorsa veya hiç sağlayıcı kayıtlı değilse, Sesli Arama bir uyarı günlüğe yazar ve tüm Plugin'i başarısız kılmak yerine medya akışını atlar.

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

Sesli Arama, aramalarda akış konuşması için çekirdek `messages.tts`
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
**Microsoft speech sesli aramalar için yok sayılır.** Telefon sesi PCM gerektirir;
geçerli Microsoft aktarımı telefon PCM çıktısını sunmaz.
</Warning>

Davranış notları:

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) `openclaw doctor --fix` tarafından onarılır; commit edilmiş yapılandırma `tts.providers.<provider>` kullanmalıdır.
- Twilio medya akışı etkinleştirildiğinde çekirdek TTS kullanılır; aksi takdirde aramalar sağlayıcıya özgü seslere geri döner.
- Bir Twilio medya akışı zaten etkinse, Sesli Arama TwiML `<Say>` seçeneğine geri dönmez. Telefon TTS bu durumdayken kullanılamıyorsa, oynatma isteği iki oynatma yolunu karıştırmak yerine başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya geri döndüğünde, Sesli Arama hata ayıklama için sağlayıcı zinciriyle (`from`, `to`, `attempts`) bir uyarı günlüğe yazar.
- Twilio barge-in veya akış sonlandırma bekleyen TTS kuyruğunu temizlediğinde, kuyruğa alınmış oynatma istekleri, arayanları oynatma tamamlanmasını bekler halde bırakmak yerine sonuçlanır.

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
`inboundPolicy: "allowlist"` düşük güvenilirlikli bir arayan kimliği filtresidir. Plugin,
sağlayıcının verdiği `From` değerini normalleştirir ve `allowFrom` ile karşılaştırır.
Webhook doğrulaması sağlayıcı teslimini ve yük bütünlüğünü doğrular, ancak PSTN/VoIP
arayan numarası sahipliğini **kanıtlamaz**. `allowFrom` değerini güçlü arayan
kimliği olarak değil, arayan kimliği filtreleme olarak değerlendirin.
</Warning>

Otomatik yanıtlar aracı sistemini kullanır. `responseModel`,
`responseSystemPrompt` ve `responseTimeoutMs` ile ayarlayın.

### Konuşulan çıktı sözleşmesi

Otomatik yanıtlar için Sesli Arama, sistem istemine katı bir konuşulan çıktı sözleşmesi ekler:

```text
{"spoken":"..."}
```

Sesli Arama konuşma metnini savunmacı biçimde çıkarır:

- Muhakeme/hata içeriği olarak işaretlenmiş yükleri yok sayar.
- Doğrudan JSON, çit içine alınmış JSON veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, konuşulan oynatmanın arayana yönelik metne odaklanmasını sağlar ve
planlama metninin sese sızmasını önler.

### Konuşma başlatma davranışı

Giden `conversation` aramaları için ilk ileti işleme, canlı oynatma durumuna bağlıdır:

- Barge-in kuyruk temizleme ve otomatik yanıt yalnızca ilk karşılama etkin olarak konuşulurken bastırılır.
- İlk oynatma başarısız olursa, arama `listening` durumuna döner ve ilk ileti yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, akış bağlantısında ek gecikme olmadan başlar.
- Barge-in etkin oynatmayı iptal eder ve kuyruğa alınmış ancak henüz oynatılmayan Twilio TTS girdilerini temizler. Temizlenen girdiler atlanmış olarak çözülür; böylece takip yanıtı mantığı hiç oynatılmayacak sesi beklemeden devam edebilir.
- Gerçek zamanlı sesli konuşmalar, gerçek zamanlı akışın kendi açılış turunu kullanır. Sesli Arama bu ilk ileti için eski `<Say>` TwiML güncellemesi göndermez; böylece giden `<Connect><Stream>` oturumları bağlı kalır.

### Twilio akış bağlantı kesme bekleme süresi

Bir Twilio medya akışının bağlantısı kesildiğinde, Sesli Arama aramayı otomatik sonlandırmadan önce **2000 ms** bekler:

- Akış bu aralıkta yeniden bağlanırsa, otomatik sonlandırma iptal edilir.
- Bekleme süresinden sonra hiçbir akış yeniden kaydolmazsa, takılı kalan etkin aramaları önlemek için arama sonlandırılır.

## Bayat arama temizleyici

Terminal Webhook hiç almayan aramaları sonlandırmak için `staleCallReaperSeconds`
kullanın (örneğin, hiç tamamlanmayan bildirim modu aramaları). Varsayılan
`0` değeridir (devre dışı).

Önerilen aralıklar:

- **Üretim:** bildirim tarzı akışlar için `120`-`300` saniye.
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

Gateway önünde bir proxy veya tünel bulunduğunda, Plugin imza doğrulaması için
genel URL'yi yeniden oluşturur. Bu seçenekler hangi yönlendirilmiş başlıklara
güvenileceğini denetler:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Yönlendirme başlıklarından gelen ana makineler için izin listesi.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Yönlendirilmiş başlıklara izin listesi olmadan güven.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Yalnızca isteğin uzak IP'si listeyle eşleştiğinde yönlendirilmiş başlıklara güven.
</ParamField>

Ek korumalar:

- Webhook **yeniden oynatma koruması** Twilio ve Plivo için etkindir. Yeniden oynatılan geçerli Webhook istekleri onaylanır ancak yan etkiler için atlanır.
- Twilio konuşma turları, `<Gather>` geri çağrılarında tur başına bir token içerir; böylece bayat/yeniden oynatılmış konuşma geri çağrıları daha yeni bekleyen transkript turunu karşılayamaz.
- Kimliği doğrulanmamış Webhook istekleri, sağlayıcının gerekli imza başlıkları eksik olduğunda gövde okumalarından önce reddedilir.
- voice-call Webhook'u, paylaşılan ön kimlik doğrulama gövde profilini (64 KB / 5 saniye) ve imza doğrulamasından önce IP başına uçuşta istek sınırını kullanır.

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

Gateway zaten çalışıyorken, operasyonel `voicecall` komutları Gateway'e ait
voice-call çalışma zamanına devredilir; böylece CLI ikinci bir Webhook
sunucusu bağlamaz. Erişilebilir bir Gateway yoksa, komutlar bağımsız bir
CLI çalışma zamanına geri döner.

`latency`, varsayılan voice-call depolama yolundan `calls.jsonl` okur.
Farklı bir günlüğü göstermek için `--file <path>` ve analizi son N kayıtla
sınırlamak için `--last <n>` kullanın (varsayılan 200). Çıktı, tur gecikmesi
ve dinleme-bekleme süreleri için p50/p90/p99 içerir.

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

Bu repo `skills/voice-call/SKILL.md` konumunda eşleşen bir skill belgesiyle gelir.

## Gateway RPC

| Yöntem               | Argümanlar                                 |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` yalnızca `mode: "conversation"` ile geçerlidir. Bildirim modu
aramaları, bağlantı sonrası rakamlara ihtiyaç duyarsa arama oluşturulduktan
sonra `voicecall.dtmf` kullanmalıdır.

## Sorun giderme

### Kurulum Webhook açığa çıkarmada başarısız oluyor

Kurulumu Gateway’i çalıştıran aynı ortamdan çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx` ve `plivo` için `webhook-exposure` yeşil olmalıdır. Yapılandırılmış bir `publicUrl`, yerel veya özel ağ alanını işaret ettiğinde yine başarısız olur; çünkü operatör bu adreslere geri çağrı yapamaz. `publicUrl` olarak `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` veya `fd00::/8` kullanmayın.

Twilio notify-mode giden çağrıları, ilk `<Say>` TwiML içeriğini doğrudan create-call isteğinde gönderir; bu nedenle ilk sesli mesaj, Twilio’nun Webhook TwiML’ini getirmesine bağlı değildir. Durum geri çağrıları, konuşma çağrıları, bağlantı öncesi DTMF, gerçek zamanlı akışlar ve bağlantı sonrası çağrı denetimi için herkese açık bir Webhook yine de gereklidir.

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

Yapılandırmayı değiştirdikten sonra Gateway’i yeniden başlatın veya yeniden yükleyin, ardından şunu çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`, `--yes` iletmediğiniz sürece kuru çalıştırmadır.

### Sağlayıcı kimlik bilgileri başarısız oluyor

Seçili sağlayıcıyı ve gerekli kimlik bilgisi alanlarını kontrol edin:

- Twilio: `twilio.accountSid`, `twilio.authToken` ve `fromNumber` veya `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` ve `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` ve `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` ve `fromNumber`.

Kimlik bilgileri Gateway ana makinesinde bulunmalıdır. Yerel bir kabuk profilini düzenlemek, zaten çalışan bir Gateway’i yeniden başlatılana veya ortamı yeniden yüklenene kadar etkilemez.

### Çağrılar başlıyor ancak sağlayıcı Webhook’ları gelmiyor

Sağlayıcı konsolunun tam herkese açık Webhook URL’sini işaret ettiğini doğrulayın:

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

- `publicUrl`, `serve.path` değerinden farklı bir yolu işaret ediyor.
- Gateway başladıktan sonra tünel URL’si değişti.
- Bir proxy isteği iletiyor ancak host/proto başlıklarını kaldırıyor veya yeniden yazıyor.
- Güvenlik duvarı ya da DNS, herkese açık ana makine adını Gateway dışında bir yere yönlendiriyor.
- Gateway, Voice Call Plugin etkinleştirilmeden yeniden başlatıldı.

Gateway’in önünde ters proxy veya tünel olduğunda, `webhookSecurity.allowedHosts` değerini herkese açık ana makine adına ayarlayın ya da bilinen bir proxy adresi için `webhookSecurity.trustedProxyIPs` kullanın. `webhookSecurity.trustForwardingHeaders` değerini yalnızca proxy sınırı sizin denetiminizde olduğunda kullanın.

### İmza doğrulaması başarısız oluyor

Sağlayıcı imzaları, OpenClaw’ın gelen istekten yeniden oluşturduğu herkese açık URL’ye göre kontrol edilir. İmzalar başarısız olursa:

- Sağlayıcı Webhook URL’sinin şema, ana makine ve yol dahil olmak üzere `publicUrl` ile tam olarak eşleştiğini doğrulayın.
- ngrok ücretsiz katman URL’leri için, tünel ana makine adı değiştiğinde `publicUrl` değerini güncelleyin.
- Proxy’nin özgün host ve proto başlıklarını koruduğundan emin olun veya `webhookSecurity.allowedHosts` yapılandırın.
- Yerel test dışında `skipSignatureVerification` etkinleştirmeyin.

### Google Meet Twilio katılımları başarısız oluyor

Google Meet, Twilio aramalı katılımları için bu Plugin’i kullanır. Önce Voice Call’ı doğrulayın:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Ardından Google Meet aktarımını açıkça doğrulayın:

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call yeşilse ancak Meet katılımcısı hiç katılmıyorsa Meet arama numarasını, PIN’i ve `--dtmf-sequence` değerini kontrol edin. Telefon çağrısı sağlıklı olabilir, ancak toplantı yanlış bir DTMF dizisini reddedebilir veya yok sayabilir.

Google Meet, Meet DTMF dizisini ve giriş metnini `voicecall.start` değerine iletir. Twilio çağrılarında Voice Call önce DTMF TwiML’ini sunar, Webhook’a geri yönlendirir, ardından gerçek zamanlı medya akışını açar; böylece kaydedilen giriş, telefon katılımcısı toplantıya katıldıktan sonra oluşturulur.

Canlı aşama izlemesi için `openclaw logs --follow` kullanın. Sağlıklı bir Twilio Meet katılımı şu sırayı günlüğe kaydeder:

- Google Meet, Twilio katılımını Voice Call’a devreder.
- Voice Call, bağlantı öncesi DTMF TwiML’ini saklar.
- Twilio ilk TwiML’i tüketilir ve gerçek zamanlı işlemden önce sunulur.
- Voice Call, Twilio çağrısı için gerçek zamanlı TwiML sunar.
- Gerçek zamanlı köprü, ilk karşılama kuyruğa alınmış olarak başlar.

`openclaw voicecall tail` kalıcı çağrı kayıtlarını göstermeye devam eder; çağrı durumu ve dökümler için kullanışlıdır, ancak her Webhook/gerçek zamanlı geçiş burada görünmez.

### Gerçek zamanlı çağrıda konuşma yok

Yalnızca bir ses modunun etkin olduğunu doğrulayın. `realtime.enabled` ve `streaming.enabled` aynı anda true olamaz.

Gerçek zamanlı Twilio çağrıları için ayrıca şunları doğrulayın:

- Bir gerçek zamanlı sağlayıcı Plugin’i yüklü ve kayıtlı.
- `realtime.provider` ayarlanmamış veya kayıtlı bir sağlayıcıyı adlandırıyor.
- Sağlayıcı API anahtarı Gateway işlemi tarafından kullanılabilir.
- `openclaw logs --follow`, gerçek zamanlı TwiML’in sunulduğunu, gerçek zamanlı köprünün başlatıldığını ve ilk karşılamanın kuyruğa alındığını gösteriyor.

## İlgili

- [Konuşma modu](/tr/nodes/talk)
- [Metinden sese](/tr/tools/tts)
- [Sesle uyandırma](/tr/nodes/voicewake)
