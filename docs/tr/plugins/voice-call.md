---
read_when:
    - OpenClaw'dan giden bir sesli arama yapmak istiyorsunuz
    - Sesli arama Plugin'ini yapılandırıyor veya geliştiriyorsunuz
    - Telefon görüşmelerinde gerçek zamanlı sese veya akışlı transkripsiyona ihtiyacınız var
sidebarTitle: Voice call
summary: Twilio, Telnyx veya Plivo aracılığıyla giden sesli aramalar yapın ve gelen sesli aramaları kabul edin; isteğe bağlı gerçek zamanlı ses ve akışlı transkripsiyon desteğiyle
title: Sesli arama Plugin'i
x-i18n:
    generated_at: "2026-07-12T12:06:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Bir plugin aracılığıyla OpenClaw için sesli aramalar: giden bildirimler, çok turlu
konuşmalar, tam çift yönlü gerçek zamanlı ses, akışlı transkripsiyon ve
izin listesi politikalarıyla gelen aramalar.

**Sağlayıcılar:** `mock` (geliştirme, ağ yok), `plivo` (Voice API + XML aktarımı +
GetInput konuşma), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
Voice Call plugini **Gateway işleminin içinde** çalışır. Uzak bir
Gateway kullanıyorsanız plugini Gateway'i çalıştıran makineye kurup
yapılandırın, ardından yüklenmesi için Gateway'i yeniden başlatın.
</Note>

## Hızlı başlangıç

<Steps>
  <Step title="Plugini kurun">
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

    Güncel sürüm etiketini takip etmek için yalnızca paket adını kullanın. Tam bir
    sürümü yalnızca yeniden üretilebilir bir kurulum gerektiğinde sabitleyin. Ardından
    pluginin yüklenmesi için Gateway'i yeniden başlatın.

  </Step>
  <Step title="Sağlayıcıyı ve Webhook'u yapılandırın">
    Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın (aşağıdaki
    [Yapılandırma](#configuration) bölümüne bakın). En azından şunlar gereklidir: `provider`, sağlayıcı
    kimlik bilgileri, `fromNumber` ve genel erişime açık bir Webhook URL'si.
  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Pluginin etkinleştirilmesini, sağlayıcı kimlik bilgilerini, Webhook erişimini ve
    yalnızca bir ses modunun (`streaming` veya `realtime`) etkin olduğunu denetler.

  </Step>
  <Step title="Duman testi">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Her ikisi de varsayılan olarak deneme çalıştırmasıdır. Kısa bir giden
    bildirim araması yapmak için `--yes` ekleyin:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx ve Plivo için kurulumun **genel bir Webhook URL'sine** çözümlenmesi gerekir.
`publicUrl`, tünel URL'si, Tailscale URL'si veya sunma geri dönüşü
local loopback ya da özel ağ alanına çözümlenirse kurulum, operatör Webhook'larını alamayan
bir sağlayıcıyı başlatmak yerine başarısız olur.
</Warning>

## Yapılandırma

`enabled: true` olduğu hâlde seçilen sağlayıcının kimlik bilgileri eksikse Gateway
başlangıç sırasında eksik anahtarları içeren bir kurulum-tamamlanmadı uyarısı günlüğe kaydeder ve
çalışma zamanını başlatmaz. Komutlar, RPC çağrıları ve ajan araçları kullanıldıklarında
eksik yapılandırmayı tam olarak döndürmeye devam eder.

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
          provider: "twilio", // veya "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // veya Twilio için TWILIO_FROM_NUMBER
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, size nasıl yardımcı olabilirim?",
              responseSystemPrompt: "Kısa ve öz yanıt veren bir beyzbol kartı uzmanısınız.",
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
            // region: "ie1", // isteğe bağlı: us1 | ie1 | au1; varsayılan us1'dir
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Mission Control Portal'dan alınan Telnyx Webhook genel anahtarı
            // (Base64; TELNYX_PUBLIC_KEY aracılığıyla da ayarlanabilir).
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

          // Webhook güvenliği (tüneller/vekiller için önerilir)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Genel erişim (birini seçin)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* Akışlı transkripsiyon bölümüne bakın */ },
          realtime: { enabled: false /* Gerçek zamanlı sesli konuşmalar bölümüne bakın */ },
        },
      },
    },
  },
}
```

### Yapılandırma referansı

Yukarıda gösterilmeyen `plugins.entries.voice-call.config` altındaki üst düzey anahtarlar:

| Anahtar                         | Varsayılan   | Notlar                                                                                         |
| ------------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | Ana açma/kapatma anahtarı.                                                                     |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. Bkz. [Gelen aramalar](#inbound-calls).        |
| `allowFrom`                     | `[]`         | `inboundPolicy: "allowlist"` için E.164 izin listesi.                                          |
| `maxDurationSeconds`            | `300`        | Yanıtlanma durumundan bağımsız olarak uygulanan, arama başına kesin süre sınırı.                |
| `staleCallReaperSeconds`        | `120`        | Bkz. [Eski arama temizleyicisi](#stale-call-reaper). `0` bunu devre dışı bırakır.               |
| `silenceTimeoutMs`              | `800`        | Klasik (gerçek zamanlı olmayan) akış için konuşma sonu sessizlik algılama süresi.               |
| `transcriptTimeoutMs`           | `180000`     | Bir turdan vazgeçmeden önce arayanın transkripsiyonu için beklenecek azami süre.                |
| `ringTimeoutMs`                 | `30000`      | Giden aramalar için çalma zaman aşımı.                                                          |
| `maxConcurrentCalls`            | `1`          | Bu sınırı aşan giden aramalar reddedilir.                                                       |
| `outbound.notifyHangupDelaySec` | `3`          | Bildirim modunda otomatik kapatmadan önce TTS sonrasında beklenecek saniye sayısı.               |
| `skipSignatureVerification`     | `false`      | Yalnızca yerel testler içindir; üretimde asla etkinleştirmeyin.                                 |
| `store`                         | ayarlanmamış | Varsayılan `~/.openclaw/voice-calls` arama günlüğü yolunu geçersiz kılar.                       |
| `agentId`                       | `"main"`     | Yanıt üretimi ve oturum depolaması için kullanılan ajan.                                       |
| `responseModel`                 | ayarlanmamış | Klasik (gerçek zamanlı olmayan) yanıtlar için varsayılan modeli geçersiz kılar.                 |
| `responseSystemPrompt`          | oluşturulan  | Klasik yanıtlar için özel sistem istemi.                                                        |
| `responseTimeoutMs`             | `30000`      | Klasik yanıt üretimi için zaman aşımı (ms).                                                     |

Twilio varsayılan olarak US1 REST uç noktasını kullanır. Aramaları desteklenen
ABD dışı bir Bölgede işlemek için `twilio.region` değerini `ie1` veya `au1` olarak ayarlayın ve
o Bölgenin kimlik bilgilerini kullanın. Bkz.
[Twilio'nun ABD dışı REST API kılavuzu](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Sağlayıcı erişimi ve güvenlik notları">
    - Twilio, Telnyx ve Plivo'nun tümü **genel erişime açık** bir Webhook URL'si gerektirir.
    - `mock`, yerel bir geliştirme sağlayıcısıdır (ağ çağrısı yapmaz).
    - `skipSignatureVerification` doğru olmadığı sürece Telnyx, `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
    - `skipSignatureVerification` yalnızca yerel testler içindir.
    - Ücretsiz ngrok katmanında `publicUrl` değerini tam ngrok URL'sine ayarlayın; imza doğrulaması her zaman uygulanır.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`, geçersiz imzalı Twilio Webhook'larına **yalnızca** `tunnel.provider="ngrok"` olduğunda ve `serve.bind` local loopback olduğunda (ngrok yerel ajanı) izin verir. Yalnızca yerel geliştirme içindir.
    - Ücretsiz ngrok katmanı URL'leri değişebilir veya ara sayfa davranışı ekleyebilir; `publicUrl` değişirse Twilio imzaları başarısız olur. Üretimde kararlı bir alan adı veya Tailscale funnel tercih edin.

  </Accordion>
  <Accordion title="Akış bağlantısı sınırları">
    - `streaming.preStartTimeoutMs` (varsayılan `5000`), hiçbir zaman geçerli bir `start` çerçevesi göndermeyen soketleri kapatır.
    - `streaming.maxPendingConnections` (varsayılan `32`), kimliği doğrulanmamış başlangıç öncesi soketlerin toplamını sınırlar.
    - `streaming.maxPendingConnectionsPerIp` (varsayılan `4`), kaynak IP başına kimliği doğrulanmamış başlangıç öncesi soketleri sınırlar.
    - `streaming.maxConnections` (varsayılan `128`), tüm açık medya akışı soketlerini (bekleyen + etkin) sınırlar.

  </Accordion>
  <Accordion title="Eski yapılandırma geçişleri">
    Yapılandırma ayrıştırma, bu eski anahtarları otomatik olarak normalleştirir ve
    yerine geçen yolu belirten bir uyarı günlüğe kaydeder; uyumluluk katmanı gelecekteki bir
    sürümde (`2026.6.0`) kaldırılacaktır, bu nedenle kaydedilmiş yapılandırmayı
    standart şekle yeniden yazmak için `openclaw doctor --fix` komutunu çalıştırın:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` kaldırılmıştır (gerçek zamanlı bağlam artık oluşturulan ajan istemini kullanır)

  </Accordion>
</AccordionGroup>

## Oturum kapsamı

Voice Call varsayılan olarak `sessionScope: "per-phone"` kullanır; böylece
aynı arayandan gelen yinelenen aramalarda konuşma belleği korunur. Her operatör aramasının
yeni bir bağlamla başlaması gerektiğinde `sessionScope: "per-call"` olarak ayarlayın; örneğin
aynı telefon numarasının farklı toplantıları temsil edebileceği resepsiyon,
rezervasyon, IVR veya Google Meet köprüsü akışlarında.

Voice Call, oluşturulan oturum anahtarlarını yapılandırılan ajan ad alanı altında
(`agent:<agentId>:voice:*`) depolar. Açık ham entegrasyon anahtarları aynı
ad alanına çözümlenir: standart bir `agent:<configuredAgentId>:*` anahtarı bu
sahibi korur ve çekirdek `session.mainKey`/genel kapsam takma adlandırmasını uygular; yabancı veya
hatalı biçimlendirilmiş `agent:*` girdisi, yapılandırılan ajan altında opak bir anahtar olarak kapsamlandırılır;
`global` ve `unknown` genel işaretçiler olarak kalır.

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı arama sesi için tam çift yönlü gerçek zamanlı bir ses sağlayıcısı seçer.
Bu, sesi yalnızca gerçek zamanlı
transkripsiyon sağlayıcılarına ileten `streaming` seçeneğinden ayrıdır.

<Warning>
`realtime.enabled`, `streaming.enabled` ile birlikte kullanılamaz. Arama başına bir
ses modu seçin.
</Warning>

Güncel çalışma zamanı davranışı:

- `realtime.enabled`, Twilio ve Telnyx için desteklenir.
- `realtime.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call, kaydedilen ilk gerçek zamanlı ses sağlayıcısını kullanır.
- Birlikte gelen gerçek zamanlı ses sağlayıcıları: sağlayıcı Plugin'leri tarafından kaydedilen Google Gemini Live (`google`) ve OpenAI (`openai`).
- Sağlayıcıya ait ham yapılandırma `realtime.providers.<providerId>` altında bulunur.
- Voice Call, paylaşılan `openclaw_agent_consult` gerçek zamanlı aracını varsayılan olarak kullanıma sunar. Arayan kişi daha derin akıl yürütme, güncel bilgi veya standart OpenClaw araçlarını istediğinde gerçek zamanlı model bu aracı çağırabilir.
- `realtime.consultPolicy`, gerçek zamanlı modelin `openclaw_agent_consult` aracını ne zaman çağırması gerektiğine ilişkin isteğe bağlı yönlendirme ekler.
- `realtime.agentContext.enabled` varsayılan olarak kapalıdır. Etkinleştirildiğinde Voice Call, oturum kurulumu sırasında gerçek zamanlı sağlayıcı talimatlarına sınırlandırılmış bir ajan kimliği ve seçilen çalışma alanı dosyalarından oluşan bir kapsül ekler.
- `realtime.fastContext.enabled` varsayılan olarak kapalıdır. Etkinleştirildiğinde Voice Call, önce danışma sorusu için dizine alınmış bellek/oturum bağlamında arama yapar ve yalnızca `realtime.fastContext.fallbackToConsult` doğruysa tam danışma ajanına geri dönmeden önce bu parçaları `realtime.fastContext.timeoutMs` süresi içinde gerçek zamanlı modele döndürür.
- `realtime.provider` kaydedilmemiş bir sağlayıcıyı gösteriyorsa veya hiçbir gerçek zamanlı ses sağlayıcısı kaydedilmemişse Voice Call bir uyarı günlüğe kaydeder ve Plugin'in tamamını başarısız kılmak yerine gerçek zamanlı medyayı atlar.
- `realtime.enabled` doğru olduğunda `inboundPolicy`, `"disabled"` olmamalıdır; `validateProviderConfig` bu birleşimi reddeder.
- Danışma oturumu anahtarları, varsa depolanan çağrı oturumunu yeniden kullanır; ardından yapılandırılmış `sessionScope` değerine geri döner (varsayılan olarak `per-phone`, yalıtılmış çağrılar için `per-call`).

### Araç politikası

`realtime.toolPolicy`, danışma çalışmasını denetler:

| Politika         | Davranış                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Danışma aracını kullanıma sunar ve standart ajanı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` araçlarıyla sınırlar. |
| `owner`          | Danışma aracını kullanıma sunar ve standart ajanın normal ajan aracı politikasını kullanmasına izin verir.                                            |
| `none`           | Danışma aracını kullanıma sunmaz. Özel `realtime.tools` yine de gerçek zamanlı sağlayıcıya aktarılır.                                                  |

`realtime.consultPolicy` yalnızca gerçek zamanlı model talimatlarını denetler:

| Politika      | Yönlendirme                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `auto`        | Varsayılan istemi korur ve danışma aracının ne zaman çağrılacağına sağlayıcının karar vermesine izin verir.       |
| `substantive` | Basit konuşma bağlantılarını doğrudan yanıtlar; olgular, bellek, araçlar veya bağlam için yanıtlamadan önce danışır. |
| `always`      | İçerikli her yanıttan önce danışır.                                                                               |

### Ajan ses bağlamı

Ses köprüsünün, sıradan konuşma sıralarında tam bir ajan danışma gidiş dönüşünün
maliyetine katlanmadan yapılandırılmış OpenClaw ajanı gibi konuşması gerektiğinde
`realtime.agentContext` özelliğini etkinleştirin. Bağlam kapsülü, gerçek zamanlı
oturum oluşturulurken bir kez eklenir; bu nedenle konuşma sırası başına gecikme
eklemez. `openclaw_agent_consult` çağrıları yine de tam OpenClaw ajanını çalıştırır
ve araç çalışmaları, güncel bilgiler, bellek aramaları veya çalışma alanı durumu
için kullanılmalıdır.

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
    Varsayılanlar: `realtime.providers.google.apiKey`, `GEMINI_API_KEY`
    veya `GOOGLE_API_KEY` kaynağından API anahtarı; `gemini-3.1-flash-live-preview`
    modeli; `Kore` sesi. Daha uzun ve yeniden bağlanılabilir çağrılar için
    `sessionResumption` ve `contextWindowCompression` varsayılan olarak açıktır.
    Telefon sesi üzerinden daha hızlı konuşma sırası geçişlerini ayarlamak için
    `silenceDurationMs`, `startSensitivity` ve `endSensitivity` kullanın.

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
                instructions: "Kısa konuş. Daha derin araçları kullanmadan önce openclaw_agent_consult aracını çağır.",
                toolPolicy: "safe-read-only",
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-3.1-flash-live-preview",
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

Sağlayıcıya özgü gerçek zamanlı ses seçenekleri için
[Google sağlayıcısı](/tr/providers/google) ve
[OpenAI sağlayıcısı](/tr/providers/openai) sayfalarına bakın.

## Akışlı yazıya dökme

`streaming`, canlı çağrı sesi için gerçek zamanlı bir yazıya dökme sağlayıcısı seçer.

Geçerli çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call, kaydedilen ilk gerçek zamanlı yazıya dökme sağlayıcısını kullanır.
- Birlikte gelen gerçek zamanlı yazıya dökme sağlayıcıları: sağlayıcı Plugin'leri tarafından kaydedilen Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI (`xai`).
- Sağlayıcıya ait ham yapılandırma `streaming.providers.<providerId>` altında bulunur.
- Twilio, kabul edilen bir akış `start` iletisi gönderdikten sonra Voice Call akışı hemen kaydeder, sağlayıcı bağlanırken gelen medyayı yazıya dökme sağlayıcısı üzerinden kuyruğa alır ve ilk karşılamayı yalnızca gerçek zamanlı yazıya dökme hazır olduğunda başlatır.
- `streaming.provider` kaydedilmemiş bir sağlayıcıyı gösteriyorsa veya hiçbir sağlayıcı kaydedilmemişse Voice Call bir uyarı günlüğe kaydeder ve Plugin'in tamamını başarısız kılmak yerine medya akışını atlar.

### Akış sağlayıcısı örnekleri

<Tabs>
  <Tab title="OpenAI">
    Varsayılanlar: `streaming.providers.openai.apiKey` veya
    `OPENAI_API_KEY` API anahtarı; `gpt-4o-transcribe` modeli;
    `silenceDurationMs: 800`; `vadThreshold: 0.5`.

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
                    apiKey: "sk-...", // OPENAI_API_KEY ayarlanmışsa isteğe bağlıdır
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
    Varsayılanlar: `streaming.providers.xai.apiKey` veya `XAI_API_KEY` API anahtarı
    (ikisi de ayarlanmamışsa bir xAI OAuth kimlik doğrulama profiline geri döner);
    `wss://api.x.ai/v1/stt` uç noktası; `mulaw` kodlaması; `8000` örnekleme hızı;
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
                    apiKey: "${XAI_API_KEY}", // XAI_API_KEY ayarlanmışsa isteğe bağlıdır
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

Voice Call, çağrılarda akışlı konuşma için çekirdeğin `messages.tts`
yapılandırmasını kullanır. Plugin yapılandırması altında **aynı yapıyla** bu
yapılandırmayı geçersiz kılabilirsiniz; `messages.tts` ile derinlemesine
birleştirilir.

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
**Microsoft konuşma sağlayıcısı sesli çağrılar için yok sayılır.** Telefon
sentezi, telefon hedefli çıkış uygulayan bir sağlayıcı gerektirir; Microsoft
konuşma sağlayıcısı bunu uygulamadığından çağrılarda atlanır ve bunun yerine
geri dönüş zincirindeki diğer sağlayıcılar denenir.
</Warning>

Davranış notları:

- Plugin yapılandırmasındaki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`), `openclaw doctor --fix` tarafından onarılır; kaydedilen yapılandırma `tts.providers.<provider>` kullanmalıdır.
- Twilio medya akışı etkinleştirildiğinde çekirdek TTS kullanılır; aksi takdirde çağrılar sağlayıcıya özgü seslere geri döner.
- Bir Twilio medya akışı zaten etkinse Voice Call, TwiML `<Say>` yöntemine geri dönmez. Bu durumda telefon TTS kullanılamıyorsa oynatma isteği, iki oynatma yolunu karıştırmak yerine başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya geri döndüğünde Voice Call, hata ayıklama için sağlayıcı zincirini (`from`, `to`, `attempts`) içeren bir uyarı günlüğe kaydeder.
- Twilio söz kesme veya akış kapatma işlemi bekleyen TTS kuyruğunu temizlediğinde, kuyruğa alınmış oynatma istekleri oynatmanın tamamlanmasını bekleyen arayanları askıda bırakmak yerine sonuçlandırılır.

### TTS örnekleri

<Tabs>
  <Tab title="Yalnızca çekirdek TTS">
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
  <Tab title="ElevenLabs ile geçersiz kılma (yalnızca çağrılar)">
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
  <Tab title="OpenAI modelini geçersiz kılma (derinlemesine birleştirme)">
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

Gelen çağrı politikası varsayılan olarak `disabled` değerindedir. Gelen çağrıları etkinleştirmek için şunları ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Merhaba! Nasıl yardımcı olabilirim?",
}
```

<Warning>
`inboundPolicy: "allowlist"`, düşük güvence düzeyine sahip bir arayan kimliği filtresidir. Plugin,
sağlayıcı tarafından iletilen `From` değerini normalleştirir ve `allowFrom` ile karşılaştırır.
Webhook doğrulaması, sağlayıcı teslimatının kimliğini ve yükün bütünlüğünü doğrular,
ancak PSTN/VoIP arayan numarasının sahipliğini **kanıtlamaz**. `allowFrom`
değerini güçlü bir arayan kimliği doğrulaması olarak değil, arayan kimliği filtrelemesi olarak değerlendirin.
</Warning>

Otomatik yanıtlar agent sistemini kullanır. `responseModel`,
`responseSystemPrompt` ve `responseTimeoutMs` ile ayarlayın.

### Numara başına yönlendirme

Tek bir Voice Call Plugin'i birden fazla telefon numarasına gelen çağrıları
alıyorsa ve her numaranın farklı bir hat gibi davranması gerekiyorsa `numbers`
kullanın. Örneğin bir numara gündelik bir kişisel asistan kullanırken başka
bir numara kurumsal bir persona, farklı bir yanıt agent'ı ve farklı bir TTS sesi
kullanabilir.

Rotalar, sağlayıcı tarafından iletilen ve aranan `To` numarasına göre seçilir.
Anahtarlar E.164 numaraları olmalıdır. Bir çağrı geldiğinde Voice Call eşleşen
rotayı bir kez çözümler, eşleşen rotayı çağrı kaydında saklar ve karşılama,
klasik otomatik yanıt yolu, gerçek zamanlı danışma yolu ve TTS oynatma için bu
etkin yapılandırmayı yeniden kullanır. Hiçbir rota eşleşmezse genel Voice Call
yapılandırması kullanılır. Giden çağrılar `numbers` kullanmaz; çağrıyı başlatırken
giden hedefi, mesajı ve oturumu açıkça iletin.

Rota geçersiz kılmaları şu anda şunları destekler:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

Rota `tts` değeri, genel Voice Call `tts` yapılandırmasının üzerine derin
birleştirme uygular; bu nedenle genellikle yalnızca sağlayıcı sesini geçersiz
kılabilirsiniz:

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

### Sesli çıktı sözleşmesi

Voice Call, otomatik yanıtlar için sistem istemine `{"spoken":"..."}` biçiminde
bir JSON yanıtı gerektiren katı bir sesli çıktı sözleşmesi ekler. Voice Call,
konuşma metnini korumacı bir şekilde ayıklar:

- Akıl yürütme/hata içeriği olarak işaretlenen yükleri yok sayar.
- Doğrudan JSON'u, kod çiti içindeki JSON'u veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve muhtemel planlama/meta giriş paragraflarını kaldırır.

Bu, sesli oynatmanın arayana yönelik metne odaklanmasını sağlar ve planlama
metninin sese sızmasını önler.

### Görüşme başlatma davranışı

Giden `conversation` çağrılarında ilk mesajın işlenmesi, canlı oynatma
durumuna bağlıdır:

- Araya girme kuyruğunu temizleme ve otomatik yanıt yalnızca ilk karşılama aktif olarak seslendirilirken engellenir.
- İlk oynatma başarısız olursa çağrı `listening` durumuna döner ve ilk mesaj yeniden denenmek üzere kuyrukta kalır.
- Twilio akışı için ilk oynatma, ek gecikme olmadan akış bağlantısı kurulduğunda başlar.
- Araya girme, etkin oynatmayı iptal eder ve kuyruğa alınmış ancak henüz oynatılmamış Twilio TTS girdilerini temizler. Temizlenen girdiler atlandı olarak çözümlenir; böylece sonraki yanıt mantığı, hiçbir zaman oynatılmayacak sesi beklemeden devam edebilir.
- Gerçek zamanlı sesli görüşmeler, gerçek zamanlı akışın kendi açılış turunu kullanır. Voice Call, bu ilk mesaj için eski bir `<Say>` TwiML güncellemesi göndermez; böylece giden `<Connect><Stream>` oturumları bağlı kalır.

### Twilio akış bağlantısı kesilme ek süresi

Bir Twilio medya akışının bağlantısı kesildiğinde Voice Call, çağrıyı otomatik
olarak sonlandırmadan önce **2000 ms** bekler:

- Akış bu süre içinde yeniden bağlanırsa otomatik sonlandırma iptal edilir.
- Ek süre sona erdikten sonra hiçbir akış yeniden kaydolmazsa etkin çağrıların takılı kalmasını önlemek için çağrı sonlandırılır.

## Eski çağrıları temizleme

Hiç yanıtlanmayan ve hiçbir zaman canlı görüşme durumuna ulaşmayan çağrıları
sonlandırmak için `staleCallReaperSeconds` (varsayılan **120**) kullanın;
örneğin sağlayıcının hiçbir zaman sonlandırıcı bir Webhook iletmediği bildirim
modu çağrıları. Devre dışı bırakmak için `0` olarak ayarlayın.

Temizleyici her 30 saniyede bir çalışır ve yalnızca `answeredAt` zaman damgası
olmayan ve hâlihazırda sonlandırılmış ya da canlı (`speaking`/`listening`)
durumda bulunmayan çağrıları sonlandırır. Bu nedenle yanıtlanmış görüşmeler bu
zamanlayıcı tarafından hiçbir zaman temizlenmez; `maxDurationSeconds`
(varsayılan 300), çok uzun süren yanıtlanmış çağrıları sonlandıran ayrı sınırdır.

Operatörlerin çalma/yanıtlama Webhook'larını iletmesinin yavaş olabileceği
bildirim tarzı akışlarda, yavaş ancak normal çağrıların erken temizlenmemesi
için `staleCallReaperSeconds` değerini varsayılanın üzerine çıkarın;
`120`-`300` saniye makul bir üretim aralığıdır.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Webhook güvenliği

Gateway'in önünde bir proxy veya tünel bulunduğunda Plugin, imza doğrulaması
için herkese açık URL'yi yeniden oluşturur. Bu seçenekler, hangi yönlendirilmiş
üstbilgilere güvenileceğini denetler:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Yönlendirme üstbilgilerinden gelen izin verilen ana bilgisayarlar listesi.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  İzin verilenler listesi olmadan yönlendirilmiş üstbilgilere güvenin.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Yalnızca isteğin uzak IP'si listedeki bir değerle eşleştiğinde yönlendirilmiş üstbilgilere güvenin.
</ParamField>

Ek korumalar:

- Webhook **yeniden oynatma koruması** Twilio, Telnyx ve Plivo için etkindir. Yeniden oynatılan geçerli Webhook istekleri onaylanır ancak yan etkiler açısından atlanır.
- Twilio görüşme turları, `<Gather>` geri çağırmalarında tur başına bir belirteç içerir; böylece eski/yeniden oynatılan konuşma geri çağırmaları daha yeni bir bekleyen transkript turunu karşılayamaz.
- Sağlayıcının gerekli imza üstbilgileri eksik olduğunda, kimliği doğrulanmamış Webhook istekleri gövde okunmadan önce reddedilir.
- Voice Call Webhook'u, imza doğrulamasından önce paylaşılan kimlik doğrulama öncesi gövde okuma profilini (en fazla 64 KB gövde, 5 saniyelik okuma zaman aşımı) ve anahtar başına devam eden istek sınırını (varsayılan olarak anahtar başına eşzamanlı 8 istek) kullanır.

Kararlı bir herkese açık ana bilgisayar örneği:

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

Gateway zaten çalışıyorsa operasyonel `voicecall` komutları, CLI'ın ikinci bir
Webhook sunucusunu bağlamaması için işlemleri Gateway'in sahip olduğu Voice Call
çalışma zamanına devreder. Erişilebilir bir Gateway yoksa komutlar bağımsız bir
CLI çalışma zamanına geri döner.

`latency`, varsayılan Voice Call depolama yolundaki `calls.jsonl` dosyasını
okur. Farklı bir günlüğü göstermek için `--file <path>`, analizi son N kayıtla
sınırlamak için `--last <n>` kullanın (varsayılan 200). Çıktı, tur gecikmesi ve
dinleme bekleme süreleri için minimum/maksimum/ortalama, p50 ve p95 değerlerini
içerir.

## Agent aracı

Araç adı: `voice_call`.

| Eylem           | Bağımsız değişkenler                        |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Voice Call Plugin'i, eşleşen bir agent becerisiyle birlikte sunulur.

## Gateway RPC

| Yöntem                      | Bağımsız değişkenler                                             | Notlar                                                                                       |
| --------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | `to` belirtilmediğinde `toNumber` yapılandırmasına geri döner.                               |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | `initiate` ile aynıdır ancak bağlantı öncesi `dtmfSequence` değerini de kabul eder.           |
| `voicecall.continue`        | `callId`, `message`                                              | Tur çözümlenene kadar engeller; transkripti döndürür.                                        |
| `voicecall.continue.start`  | `callId`, `message`                                              | Eşzamansız değişken: hemen bir `operationId` döndürür.                                       |
| `voicecall.continue.result` | `operationId`                                                    | Bekleyen bir `voicecall.continue.start` işleminin sonucu için yoklama yapar.                 |
| `voicecall.speak`           | `callId`, `message`                                              | Beklemeden konuşur; `realtime.enabled` olduğunda gerçek zamanlı köprüyü kullanır.             |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                                              |
| `voicecall.end`             | `callId`                                                         |                                                                                              |
| `voicecall.status`          | `callId?`                                                        | Tüm etkin çağrıları listelemek için `callId` değerini belirtmeyin.                            |

`dtmfSequence` yalnızca `mode: "conversation"` ile geçerlidir; bağlantı sonrası
rakamlara ihtiyaç duyan bildirim modu çağrıları, çağrı oluşturulduktan sonra
`voicecall.dtmf` kullanmalıdır.

## Sorun giderme

### Kurulumda Webhook erişimi başarısız oluyor

Kurulumu Gateway'i çalıştıran ortamdan çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx` ve `plivo` için `webhook-exposure` yeşil olmalıdır.
Yapılandırılmış bir `publicUrl`, yerel veya özel ağ alanını gösteriyorsa yine
başarısız olur; çünkü operatör bu adreslere geri çağrı yapamaz.
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` veya diğer operatör düzeyi NAT
aralıklarını `publicUrl` olarak kullanmayın.

Twilio bildirim modu giden çağrıları, ilk `<Say>` TwiML'lerini doğrudan çağrı
oluşturma isteğinde gönderir; bu nedenle ilk sesli mesaj, Twilio'nun Webhook
TwiML'ini getirmesine bağlı değildir. Durum geri çağırmaları, görüşme çağrıları,
bağlantı öncesi DTMF, gerçek zamanlı akışlar ve bağlantı sonrası çağrı denetimi
için herkese açık bir Webhook yine de gereklidir.

Herkese açık erişim yollarından birini kullanın:

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
yükleyin, ardından şunları çalıştırın:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`--yes` iletmediğiniz sürece `voicecall smoke` bir deneme çalıştırmasıdır.

### Sağlayıcı kimlik bilgileri başarısız oluyor

Seçili sağlayıcıyı ve gerekli kimlik bilgisi alanlarını kontrol edin:

- Twilio: `twilio.accountSid`, `twilio.authToken` ve `fromNumber` ya da
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` ve `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` ve
  `fromNumber` ya da `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` ve
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` ve `fromNumber` ya da
  `PLIVO_AUTH_ID` ve `PLIVO_AUTH_TOKEN`.

Kimlik bilgilerinin Gateway ana makinesinde bulunması gerekir. Yerel bir kabuk profilini
düzenlemek, çalışan bir Gateway yeniden başlatılana veya ortamı yeniden yüklenene
kadar onu etkilemez.

### Aramalar başlıyor ancak sağlayıcı Webhook'ları ulaşmıyor

Sağlayıcı konsolunun tam olarak herkese açık Webhook URL'sine yönlendirildiğini doğrulayın:

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
- Tünel URL'si Gateway başlatıldıktan sonra değişti.
- Bir proxy isteği iletiyor ancak ana makine/protokol üstbilgilerini kaldırıyor veya yeniden yazıyor.
- Güvenlik duvarı veya DNS, herkese açık ana makine adını Gateway dışında bir yere yönlendiriyor.
- Gateway, Sesli Arama Plugin'i etkinleştirilmeden yeniden başlatıldı.

Gateway'in önünde bir ters proxy veya tünel bulunduğunda,
`webhookSecurity.allowedHosts` değerini herkese açık ana makine adına ayarlayın ya da
bilinen bir proxy adresi için `webhookSecurity.trustedProxyIPs` kullanın.
`webhookSecurity.trustForwardingHeaders` seçeneğini yalnızca proxy sınırı
denetiminiz altındaysa kullanın.

### İmza doğrulaması başarısız oluyor

Sağlayıcı imzaları, OpenClaw'ın gelen istekten yeniden oluşturduğu herkese açık URL'ye
göre denetlenir. İmzalar başarısız olursa:

- Sağlayıcı Webhook URL'sinin şema, ana makine ve yol dâhil olmak üzere `publicUrl` ile tam olarak eşleştiğini doğrulayın.
- Ücretsiz katmandaki ngrok URL'lerinde, tünel ana makine adı değiştiğinde `publicUrl` değerini güncelleyin.
- Proxy'nin özgün ana makine ve protokol üstbilgilerini koruduğundan emin olun ya da `webhookSecurity.allowedHosts` seçeneğini yapılandırın.
- Yerel testler dışında `skipSignatureVerification` seçeneğini etkinleştirmeyin.

### Google Meet Twilio katılımları başarısız oluyor

Google Meet, Twilio telefonla katılımları için bu Plugin'i kullanır. Önce Sesli
Arama'yı doğrulayın:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Ardından Google Meet aktarımını açıkça doğrulayın:

```bash
openclaw googlemeet setup --transport twilio
```

Sesli Arama sorunsuz çalışıyor ancak Meet katılımcısı hiç katılmıyorsa Meet
telefonla katılım numarasını, PIN'i ve `--dtmf-sequence` değerini denetleyin. Toplantı
yanlış bir DTMF dizisini reddederken veya yok sayarken telefon araması sağlıklı
olabilir.

Google Meet, ön bağlantı DTMF dizisiyle `voicecall.start` üzerinden Twilio telefon
ayağını başlatır. PIN'den türetilen diziler, Meet telefonla katılım istemleri geç
gelebileceğinden Google Meet Plugin'inin `voiceCall.dtmfDelayMs` değerini
(varsayılan **12000 ms**) başta gelen Twilio bekleme basamakları olarak içerir. Sesli
Arama daha sonra giriş selamlaması istenmeden önce yeniden gerçek zamanlı işlemeye
yönlendirir.

Canlı aşama izini görüntülemek için `openclaw logs --follow` kullanın. Sağlıklı bir
Twilio Meet katılımı günlüklerde şu sırayla görünür:

- Google Meet, Twilio katılımını Sesli Arama'ya devreder.
- Sesli Arama, ön bağlantı DTMF TwiML'ini depolar.
- Twilio'nun ilk TwiML'i gerçek zamanlı işlemeden önce tüketilir ve sunulur.
- Sesli Arama, Twilio araması için gerçek zamanlı TwiML sunar.
- Google Meet, DTMF sonrası gecikmenin ardından `voicecall.speak` ile giriş konuşmasını ister.

`openclaw voicecall tail` kalıcı arama kayıtlarını göstermeye devam eder; arama
durumu ve dökümler için kullanışlıdır ancak her Webhook/gerçek zamanlı geçiş
burada görünmez.

### Gerçek zamanlı aramada konuşma sesi yok

Yalnızca bir ses modunun etkin olduğunu doğrulayın: `realtime.enabled` ve
`streaming.enabled` değerlerinin ikisi birden true olamaz.

Gerçek zamanlı Twilio/Telnyx aramaları için ayrıca şunları doğrulayın:

- Bir gerçek zamanlı sağlayıcı Plugin'i yüklenmiş ve kaydedilmiş.
- `realtime.provider` ayarlanmamış veya kayıtlı bir sağlayıcının adını belirtiyor.
- Sağlayıcı API anahtarı Gateway işlemi tarafından kullanılabiliyor.
- `openclaw logs --follow`, gerçek zamanlı TwiML'in sunulduğunu, gerçek zamanlı köprünün başlatıldığını ve ilk selamlamanın kuyruğa alındığını gösteriyor.

## İlgili

- [Konuşma modu](/tr/nodes/talk)
- [Metinden konuşmaya](/tr/tools/tts)
- [Sesle uyandırma](/tr/nodes/voicewake)
