---
read_when:
    - OpenClaw'dan giden bir sesli arama başlatmak istiyorsunuz
    - Sesli arama Plugin'ini yapılandırıyor veya geliştiriyorsunuz
    - Telefon sisteminde gerçek zamanlı ses veya akış transkripsiyonuna ihtiyacınız var
sidebarTitle: Voice call
summary: İsteğe bağlı gerçek zamanlı ses ve akış transkripsiyonu ile Twilio, Telnyx veya Plivo üzerinden giden aramalar yapın ve gelen aramaları kabul edin
title: Sesli arama Plugin'i
x-i18n:
    generated_at: "2026-04-26T11:38:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

OpenClaw için bir Plugin aracılığıyla sesli aramalar. Giden bildirimleri,
çok dönüşlü konuşmaları, tam çift yönlü gerçek zamanlı sesi, akış
transkripsiyonunu ve izin listesi ilkeleriyle gelen aramaları destekler.

**Geçerli sağlayıcılar:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (geliştirme/ağ yok).

<Note>
Voice Call Plugin'i **Gateway sürecinin içinde** çalışır. Uzak bir
Gateway kullanıyorsanız, Plugin'i Gateway'i çalıştıran makinede kurup
yapılandırın, sonra Plugin'in yüklenmesi için Gateway'i yeniden başlatın.
</Note>

## Hızlı başlangıç

<Steps>
  <Step title="Plugin'i kurun">
    <Tabs>
      <Tab title="npm'den (önerilen)">
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

    Sonrasında Plugin'in yüklenmesi için Gateway'i yeniden başlatın.

  </Step>
  <Step title="Sağlayıcıyı ve Webhook'u yapılandırın">
    Yapılandırmayı `plugins.entries.voice-call.config` altında ayarlayın
    (tam şekil için aşağıdaki [Configuration](#configuration) bölümüne bakın).
    En azından şunlar gerekir:
    `provider`, sağlayıcı kimlik bilgileri, `fromNumber` ve herkese
    açık şekilde erişilebilen bir Webhook URL'si.
  </Step>
  <Step title="Kurulumu doğrulayın">
    ```bash
    openclaw voicecall setup
    ```

    Varsayılan çıktı sohbet günlüklerinde ve terminallerde okunabilir.
    Plugin etkinleştirmesini, sağlayıcı kimlik bilgilerini, Webhook
    erişimini ve yalnızca bir ses modunun (`streaming` veya `realtime`)
    etkin olduğunu kontrol eder. Betikler için `--json` kullanın.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Her ikisi de varsayılan olarak kuru çalıştırmadır. Kısa bir giden
    bildirim aramasını gerçekten başlatmak için `--yes` ekleyin:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx ve Plivo için kurulumun **herkese açık bir Webhook URL'sine**
çözülmesi gerekir.
`publicUrl`, tünel URL'si, Tailscale URL'si veya sunma geri dönüşü
loopback'e ya da özel ağ alanına çözülürse, kurulum taşıyıcı Webhook'larını
alamayan bir sağlayıcıyı başlatmak yerine başarısız olur.
</Warning>

## Yapılandırma

`enabled: true` ise ancak seçilen sağlayıcı için kimlik bilgileri yoksa,
Gateway başlangıcı eksik anahtarları içeren kurulumu tamamlanmamış bir uyarı
günlüğe yazar ve çalışma zamanını başlatmayı atlar. Komutlar, RPC çağrıları
ve ajan araçları kullanıldığında yine de tam olarak eksik sağlayıcı
yapılandırmasını döndürür.

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

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Mission Control Portal'dan Telnyx Webhook herkese açık anahtarı
            // (Base64; TELNYX_PUBLIC_KEY ile de ayarlanabilir).
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

          // Herkese açık sunum (birini seçin)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* Akış transkripsiyonu bölümüne bakın */ },
          realtime: { enabled: false /* Gerçek zamanlı ses bölümüne bakın */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Sağlayıcı sunumu ve güvenlik notları">
    - Twilio, Telnyx ve Plivo'nun tümü **herkese açık şekilde erişilebilir** bir Webhook URL'si gerektirir.
    - `mock`, yerel bir geliştirme sağlayıcısıdır (ağ çağrısı yoktur).
    - Telnyx, `skipSignatureVerification` true değilse `telnyx.publicKey` (veya `TELNYX_PUBLIC_KEY`) gerektirir.
    - `skipSignatureVerification` yalnızca yerel testler içindir.
    - ngrok ücretsiz katmanda `publicUrl` değerini tam ngrok URL'si olarak ayarlayın; imza doğrulaması her zaman zorunludur.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`, Twilio Webhook'larına **yalnızca** `tunnel.provider="ngrok"` ve `serve.bind` loopback olduğunda (ngrok yerel aracısı) geçersiz imzalarla izin verir. Yalnızca yerel geliştirme içindir.
    - Ngrok ücretsiz katman URL'leri değişebilir veya araya giren davranış ekleyebilir; `publicUrl` kayarsa Twilio imzaları başarısız olur. Üretimde kararlı bir alan adı veya bir Tailscale funnel tercih edin.

  </Accordion>
  <Accordion title="Akış bağlantı sınırları">
    - `streaming.preStartTimeoutMs`, geçerli bir `start` çerçevesi hiç göndermeyen soketleri kapatır.
    - `streaming.maxPendingConnections`, kimliği doğrulanmamış başlangıç öncesi toplam soket sayısını sınırlar.
    - `streaming.maxPendingConnectionsPerIp`, kaynak IP başına kimliği doğrulanmamış başlangıç öncesi soketleri sınırlar.
    - `streaming.maxConnections`, toplam açık medya akışı soketi sayısını (bekleyen + etkin) sınırlar.

  </Accordion>
  <Accordion title="Eski yapılandırma geçişleri">
    `provider: "log"`, `twilio.from` veya eski
    `streaming.*` OpenAI anahtarlarını kullanan daha eski yapılandırmalar,
    `openclaw doctor --fix` tarafından yeniden yazılır.
    Çalışma zamanı geri dönüşü şimdilik eski voice-call anahtarlarını kabul etmeye devam eder,
    ancak yeniden yazma yolu `openclaw doctor --fix` komutudur ve uyumluluk katmanı
    geçicidir.

    Otomatik geçirilen akış anahtarları:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Gerçek zamanlı sesli konuşmalar

`realtime`, canlı arama sesi için tam çift yönlü bir gerçek zamanlı ses
sağlayıcısı seçer. Bu, sesi yalnızca gerçek zamanlı transkripsiyon
sağlayıcılarına ileten `streaming` seçeneğinden ayrıdır.

<Warning>
`realtime.enabled`, `streaming.enabled` ile birlikte kullanılamaz.
Arama başına bir ses modu seçin.
</Warning>

Geçerli çalışma zamanı davranışı:

- `realtime.enabled`, Twilio Media Streams için desteklenir.
- `realtime.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call, kaydedilmiş ilk gerçek zamanlı ses sağlayıcısını kullanır.
- Paketlenmiş gerçek zamanlı ses sağlayıcıları: sağlayıcı Plugin'leri tarafından kaydedilen Google Gemini Live (`google`) ve OpenAI (`openai`).
- Sağlayıcıya ait ham yapılandırma `realtime.providers.<providerId>` altında yer alır.
- Voice Call, paylaşılan `openclaw_agent_consult` gerçek zamanlı aracını varsayılan olarak sunar. Arayan kişi daha derin akıl yürütme, güncel bilgi veya normal OpenClaw araçları istediğinde gerçek zamanlı model bunu çağırabilir.
- `realtime.provider` kaydedilmemiş bir sağlayıcıyı işaret ediyorsa veya hiç gerçek zamanlı ses sağlayıcısı kaydedilmemişse, Voice Call bir uyarı günlüğe yazar ve tüm Plugin'i başarısız yapmak yerine gerçek zamanlı medyayı atlar.
- Consult oturum anahtarları, mümkün olduğunda mevcut ses oturumunu yeniden kullanır; ardından arama sırasında takip consult çağrılarının bağlamı koruması için arayan/aranan telefon numarasına geri döner.

### Araç ilkesi

`realtime.toolPolicy`, consult çalıştırmasını denetler:

| İlke             | Davranış                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Consult aracını sunar ve normal ajanı `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` ve `memory_get` ile sınırlar. |
| `owner`          | Consult aracını sunar ve normal ajanın olağan ajan araç ilkesini kullanmasına izin verir.                                              |
| `none`           | Consult aracını sunmaz. Özel `realtime.tools` yine de gerçek zamanlı sağlayıcıya iletilir.                                             |

### Gerçek zamanlı sağlayıcı örnekleri

<Tabs>
  <Tab title="Google Gemini Live">
    Varsayılanlar: API anahtarı `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` veya `GOOGLE_GENERATIVE_AI_API_KEY`; model
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
                instructions: "Kısa konuş. Daha derin araçları kullanmadan önce openclaw_agent_consult çağır.",
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
[Google provider](/tr/providers/google) ve
[OpenAI provider](/tr/providers/openai) belgelerine bakın.

## Akış transkripsiyonu

`streaming`, canlı arama sesi için bir gerçek zamanlı transkripsiyon
sağlayıcısı seçer.

Geçerli çalışma zamanı davranışı:

- `streaming.provider` isteğe bağlıdır. Ayarlanmazsa Voice Call, kaydedilmiş ilk gerçek zamanlı transkripsiyon sağlayıcısını kullanır.
- Paketlenmiş gerçek zamanlı transkripsiyon sağlayıcıları: sağlayıcı Plugin'leri tarafından kaydedilen Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) ve xAI (`xai`).
- Sağlayıcıya ait ham yapılandırma `streaming.providers.<providerId>` altında yer alır.
- `streaming.provider` kaydedilmemiş bir sağlayıcıyı işaret ediyorsa veya hiçbiri kaydedilmemişse, Voice Call bir uyarı günlüğe yazar ve tüm Plugin'i başarısız yapmak yerine medya akışını atlar.

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
                    apiKey: "${XAI_API_KEY}", // XAI_API_KEY ayarlıysa isteğe bağlı
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
**aynı şekille** geçersiz kılabilirsiniz — `messages.tts` ile derinlemesine birleştirilir.

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
mevcut Microsoft aktarımı telefon için PCM çıktısını sunmaz.
</Warning>

Davranış notları:

- Plugin yapılandırması içindeki eski `tts.<provider>` anahtarları (`openai`, `elevenlabs`, `microsoft`, `edge`) `openclaw doctor --fix` ile onarılır; kaydedilmiş yapılandırma `tts.providers.<provider>` kullanmalıdır.
- Twilio medya akışı etkin olduğunda çekirdek TTS kullanılır; aksi halde aramalar sağlayıcının yerel seslerine geri döner.
- Bir Twilio medya akışı zaten etkinse, Voice Call `TwiML <Say>` kullanımına geri dönmez. Bu durumda telefon TTS kullanılamıyorsa, oynatma isteği iki oynatma yolunu karıştırmak yerine başarısız olur.
- Telefon TTS ikincil bir sağlayıcıya geri düştüğünde, Voice Call hata ayıklama için sağlayıcı zinciriyle (`from`, `to`, `attempts`) birlikte bir uyarı günlüğe yazar.
- Twilio barge-in veya akış sonlandırma bekleyen TTS kuyruğunu temizlediğinde, kuyruktaki oynatma istekleri arayanların oynatma tamamlanmasını bekleyip takılı kalması yerine sonuçlanır.

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
  <Tab title="ElevenLabs ile geçersiz kıl (yalnızca aramalar)">
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

Gelen arama ilkesi varsayılan olarak `disabled` durumundadır. Gelen aramaları etkinleştirmek için şunu ayarlayın:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Merhaba! Nasıl yardımcı olabilirim?",
}
```

<Warning>
`inboundPolicy: "allowlist"` düşük güvenceli bir arayan kimliği
elemesidir. Plugin, sağlayıcının verdiği `From` değerini normalize eder ve
bunu `allowFrom` ile karşılaştırır. Webhook doğrulaması sağlayıcı teslimini ve
yük bütünlüğünü doğrular, ancak PSTN/VoIP arayan numara
sahipliğini **kanıtlamaz**. `allowFrom` değerini güçlü arayan kimliği değil,
arayan kimliği filtrelemesi olarak değerlendirin.
</Warning>

Otomatik yanıtlar ajan sistemini kullanır. `responseModel`,
`responseSystemPrompt` ve `responseTimeoutMs` ile ayar yapın.

### Sesli çıktı sözleşmesi

Otomatik yanıtlar için Voice Call, sistem istemine katı bir sesli çıktı
sözleşmesi ekler:

```text
{"spoken":"..."}
```

Voice Call konuşma metnini savunmacı şekilde çıkarır:

- Akıl yürütme/hata içeriği olarak işaretlenmiş yükleri yok sayar.
- Doğrudan JSON, çitlenmiş JSON veya satır içi `"spoken"` anahtarlarını ayrıştırır.
- Düz metne geri döner ve olası planlama/meta giriş paragraflarını kaldırır.

Bu, sesli oynatmanın arayana dönük metne odaklanmasını sağlar ve
planlama metninin sese sızmasını önler.

### Konuşma başlatma davranışı

Giden `conversation` aramaları için ilk mesaj işleme, canlı
oynatma durumuna bağlıdır:

- Barge-in kuyruk temizleme ve otomatik yanıt yalnızca ilk karşılama aktif olarak konuşulurken bastırılır.
- İlk oynatma başarısız olursa arama `listening` durumuna döner ve ilk mesaj yeniden deneme için kuyrukta kalır.
- Twilio akışı için ilk oynatma, ek gecikme olmadan akış bağlantısında başlar.
- Barge-in etkin oynatmayı durdurur ve kuyruktaki ancak henüz oynatılmayan Twilio TTS girdilerini temizler. Temizlenen girdiler atlandı olarak çözülür, böylece takip yanıt mantığı asla çalınmayacak sesi beklemeden devam edebilir.
- Gerçek zamanlı sesli konuşmalar, gerçek zamanlı akışın kendi açılış dönüşünü kullanır. Voice Call, bu ilk mesaj için eski `<Say>` TwiML güncellemesi göndermez; böylece giden `<Connect><Stream>` oturumları bağlı kalır.

### Twilio akış bağlantı kesilme toleransı

Bir Twilio medya akışının bağlantısı kesildiğinde Voice Call, aramayı
otomatik sonlandırmadan önce **2000 ms** bekler:

- Akış bu pencere sırasında yeniden bağlanırsa otomatik sonlandırma iptal edilir.
- Tolerans süresinden sonra hiçbir akış yeniden kaydolmazsa, takılı etkin aramaları önlemek için arama sonlandırılır.

## Eski arama temizleyicisi

Hiçbir terminal Webhook'u almayan aramaları sonlandırmak için
`staleCallReaperSeconds` kullanın (örneğin, hiç tamamlanmayan
bildirim modlu aramalar). Varsayılan değer `0`'dır (devre dışı).

Önerilen aralıklar:

- **Üretim:** bildirim tarzı akışlar için `120`–`300` saniye.
- Normal aramaların bitmesini sağlamak için bu değeri **`maxDurationSeconds` değerinden yüksek** tutun. İyi bir başlangıç noktası `maxDurationSeconds + 30–60` saniyedir.

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

Bir proxy veya tünel Gateway'in önünde durduğunda, Plugin
imza doğrulaması için herkese açık URL'yi yeniden oluşturur. Bu seçenekler,
hangi iletilmiş başlıklara güvenileceğini denetler:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  İletme başlıklarındaki ana makineleri izin listesine alın.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  İzin listesi olmadan iletilmiş başlıklara güvenin.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  İstek uzak IP'si listedekilerle eşleştiğinde yalnızca iletilmiş başlıklara güvenin.
</ParamField>

Ek korumalar:

- Webhook **tekrar oynatma koruması** Twilio ve Plivo için etkindir. Yeniden oynatılmış geçerli Webhook istekleri onaylanır ama yan etkiler için atlanır.
- Twilio konuşma dönüşleri `<Gather>` geri çağrılarında dönüş başına bir token içerir; bu nedenle eski/yeniden oynatılmış konuşma geri çağrıları daha yeni bekleyen bir transkript dönüşünü karşılayamaz.
- Kimliği doğrulanmamış Webhook istekleri, sağlayıcının gerekli imza başlıkları eksikse gövde okunmadan önce reddedilir.
- voice-call Webhook'u, imza doğrulamasından önce paylaşılan ön kimlik doğrulama gövde profilini (64 KB / 5 saniye) ve IP başına işlemde üst sınırı kullanır.

Kararlı bir herkese açık ana makine ile örnek:

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
openclaw voicecall call --to "+15555550123" --message "OpenClaw'dan merhaba"
openclaw voicecall start --to "+15555550123"   # call için takma ad
openclaw voicecall continue --call-id <id> --message "Sorunuz var mı?"
openclaw voicecall speak --call-id <id> --message "Bir dakika"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # günlüklerden dönüş gecikmesini özetle
openclaw voicecall expose --mode funnel
```

`latency`, varsayılan voice-call depolama yolundaki `calls.jsonl` dosyasını okur.
Farklı bir günlüğü göstermek için `--file <path>`, analizi son N kayda
sınırlandırmak için `--last <n>` kullanın (varsayılan 200). Çıktı, dönüş
gecikmesi ve dinleme-bekleme süreleri için p50/p90/p99 değerlerini içerir.

## Ajan aracı

Araç adı: `voice_call`.

| Eylem           | Argümanlar               |
| ---------------- | ------------------------ |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Bu repo, `skills/voice-call/SKILL.md` içinde eşleşen bir Skills belgesi sunar.

## Gateway RPC

| Yöntem               | Argümanlar               |
| -------------------- | ------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## İlgili

- [Talk mode](/tr/nodes/talk)
- [Text-to-speech](/tr/tools/tts)
- [Voice wake](/tr/nodes/voicewake)
