---
read_when:
    - macOS/iOS/Android'de Konuşma modunu uygulama
    - Ses/TTS/kesme davranışını değiştirme
summary: 'Konuşma modu: yerel STT/TTS ve gerçek zamanlı ses üzerinden kesintisiz konuşmalar'
title: Konuşma modu
x-i18n:
    generated_at: "2026-07-12T12:24:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Talk modu beş çalışma zamanı biçimini kapsar:

- **Yerel macOS/iOS/Android Talk**: yerel konuşma tanıma, Gateway sohbeti ve `talk.speak` TTS. Node'lar `talk` yeteneğini duyurur ve hangi `talk.*` komutlarını desteklediklerini bildirir.
- **iOS Talk (gerçek zamanlı)**: `webrtc` aktarımını seçen veya aktarımı belirtmeyen OpenAI gerçek zamanlı yapılandırmaları için istemci tarafından yönetilen WebRTC. Açıkça belirtilen `gateway-relay`, `provider-websocket` ve OpenAI dışı gerçek zamanlı yapılandırmalar Gateway tarafından yönetilen aktarıcıda kalır; gerçek zamanlı olmayan yapılandırmalar yerel konuşma döngüsünü kullanır.
- **Tarayıcı Talk**: istemci tarafından yönetilen `webrtc`/`provider-websocket` oturumları için `talk.client.create` veya Gateway tarafından yönetilen `gateway-relay` oturumları için `talk.session.create`. `managed-room`, Gateway devri ve bas-konuş odaları için ayrılmıştır.
- **Android Talk (gerçek zamanlı)**: `talk.realtime.mode: "realtime"` ve `talk.realtime.transport: "gateway-relay"` ile etkinleştirin. Aksi hâlde Android; yerel konuşma tanıma, Gateway sohbeti ve `talk.speak` kullanmaya devam eder.
- **Yalnızca transkripsiyon istemcileri**: Asistanın sesli yanıtı olmadan altyazı/dikte için `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, ardından `talk.session.appendAudio`, `talk.session.cancelTurn` ve `talk.session.close`. Tek seferde yüklenen sesli notlar yine [medya anlama](/tr/nodes/media-understanding) ses yolunu kullanır.

Yerel Talk sürekli bir döngüdür: konuşmayı dinler, transkripti etkin oturum üzerinden modele gönderir, yanıtı bekler ve ardından yapılandırılmış Talk sağlayıcısı (`talk.speak`) aracılığıyla seslendirir.

İstemci tarafından yönetilen gerçek zamanlı Talk, doğrudan `chat.send` çağırmak yerine sağlayıcı araç çağrılarını `talk.client.toolCall` üzerinden iletir. Gerçek zamanlı danışma etkin durumdayken istemciler, konuşulan girdiyi `status`, `steer`, `cancel` veya `followup` olarak sınıflandırmak için `talk.client.steer` ya da `talk.session.steer` çağırabilir. Kabul edilen yönlendirme, etkin gömülü çalıştırmanın kuyruğuna eklenir; reddedilen yönlendirme `no_active_run`, `not_streaming` veya `compacting` gibi bir neden döndürür.

Yalnızca transkripsiyon amaçlı Talk, gerçek zamanlı ve STT/TTS oturumlarıyla aynı Talk olay zarfını yayar ancak `mode: "transcription"` ve `brain: "none"` kullanır. Tüm Talk oturumları olayları `talk.event` kanalında yayınlar; istemciler kısmi/nihai transkript güncellemeleri (`transcript.delta`/`transcript.done`) ve diğer oturum telemetrisi için bu kanala abone olur.

## Davranış (macOS)

- Talk modu etkinken her zaman açık katman.
- **Dinleme &rarr; Düşünme &rarr; Konuşma** aşama geçişleri.
- Kısa bir duraklamada (sessizlik aralığı) mevcut transkript gönderilir.
- Yanıtlar WebChat'e yazılır (yazmayla aynı şekilde).
- **Konuşmayla kesme** (varsayılan olarak açık): kullanıcı, asistan konuşurken konuşursa oynatma durur ve kesinti zaman damgası bir sonraki istem için kaydedilir.

## Yanıtlardaki ses yönergeleri

Asistan, sesi denetlemek için yanıtın başına tek satırlık JSON ekleyebilir:

```json
{ "voice": "<voice-id>", "once": true }
```

Kurallar:

- Yalnızca boş olmayan ilk satır; JSON satırı TTS oynatımından önce kaldırılır.
- Bilinmeyen anahtarlar yok sayılır.
- `once: true` yalnızca mevcut yanıta uygulanır; bu olmadan ses, Talk modunun yeni varsayılanı olur.

Desteklenen anahtarlar: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (dakika başına sözcük), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

## Yapılandırma (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Sıcak bir üslupla konuş ve yanıtları kısa tut.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Anahtar                                  | Varsayılan                                 | Notlar                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Etkin Talk TTS sağlayıcısı. macOS'teki yerel oynatma yolları için `elevenlabs`, `mlx` veya `system` kullanın.                                                                                                                                                                                                               |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs, `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` değerlerine veya API anahtarıyla kullanılabilen ilk sese geri döner.                                                                                                                                                                                                     |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | `ELEVENLABS_API_KEY` değerine (veya mevcutsa Gateway kabuk profiline) geri döner.                                                                                                                                                                                                                                          |
| `speechLocale`                           | aygıt varsayılanı                          | iOS/macOS'te aygıt üzerinde Talk konuşma tanıma için BCP 47 yerel ayar kimliği.                                                                                                                                                                                                                                            |
| `silenceTimeoutMs`                       | macOS/Android için `700` ms, iOS için `900` ms | Talk transkripti göndermeden önceki duraklama aralığı.                                                                                                                                                                                                                                                                |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | macOS/iOS için `pcm_44100`, Android için `pcm_24000` | MP3 akışını zorlamak için `mp3_*` olarak ayarlayın.                                                                                                                                                                                                                                                         |
| `consultThinkingLevel`                   | ayarlanmamış                               | Gerçek zamanlı `openclaw_agent_consult` çağrılarının arkasındaki aracı çalıştırması için düşünme düzeyi geçersiz kılma değeri.                                                                                                                                                                                             |
| `consultFastMode`                        | ayarlanmamış                               | Gerçek zamanlı `openclaw_agent_consult` çağrıları için hızlı mod geçersiz kılma değeri.                                                                                                                                                                                                                                   |
| `realtime.provider`                      | -                                          | WebRTC için `openai`, sağlayıcı WebSocket'i için `google` veya Gateway aktarıcısı üzerinden yalnızca köprü işlevli bir sağlayıcı.                                                                                                                                                                                          |
| `realtime.providers.<id>`                | -                                          | Sağlayıcı tarafından yönetilen gerçek zamanlı yapılandırma. Tarayıcılar yalnızca geçici/kısıtlı oturum kimlik bilgilerini alır; hiçbir zaman standart bir API anahtarı almaz.                                                                                                                                                 |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | Yerleşik OpenAI Realtime ses kimliği (eski `voice` anahtarı hâlâ çalışır ancak kullanım dışıdır). Güncel `gpt-realtime-2.1` sesleri: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; en iyi kalite için `marin` ve `cedar` önerilir. |
| `realtime.transport`                     | -                                          | `webrtc`: iOS'te ve tarayıcıda istemci tarafından yönetilen OpenAI WebRTC. `provider-websocket`: tarayıcı tarafından yönetilir, iOS'te Gateway aktarıcısında kalır. `gateway-relay`: sağlayıcı sesini Gateway üzerinde tutar; Android gerçek zamanı yalnızca bu aktarımla kullanır.                                             |
| `realtime.brain`                         | -                                          | `agent-consult`, gerçek zamanlı araç çağrılarını Gateway politikası üzerinden yönlendirir; `direct-tools`, eski doğrudan araç uyumluluğu içindir; `none`, transkripsiyon/harici orkestrasyon içindir.                                                                                                                        |
| `realtime.consultRouting`                | -                                          | `provider-direct`, sağlayıcı `openclaw_agent_consult` çağrısını atladığında sağlayıcının doğrudan yanıtını korur; `force-agent-consult` ise kesinleşmiş kullanıcı transkriptlerini OpenClaw üzerinden yönlendirir.                                                                                                          |
| `realtime.instructions`                  | -                                          | Sağlayıcıya yönelik sistem talimatlarını OpenClaw'ın yerleşik gerçek zamanlı istemine ekler (ses stili/tonu); varsayılan `openclaw_agent_consult` yönlendirmesi korunur.                                                                                                                                                    |

`talk.catalog`, standart sağlayıcı kimliklerini ve kayıt defteri takma adlarını, her sağlayıcının geçerli modlarını/aktarımlarını/beyin stratejilerini/gerçek zamanlı ses biçimlerini/yetenek bayraklarını ve çalışma zamanında seçilen hazır olma sonucunu sunar. Birinci taraf Talk istemcileri, sağlayıcı takma adlarını yerel olarak yönetmek yerine bu kataloğu okumalıdır; grup hazır olma bilgisini içermeyen eski bir Gateway'i kesin olarak yapılandırılmamış değil, doğrulanmamış olarak değerlendirin. Akışlı transkripsiyon sağlayıcıları `talk.catalog.transcription` üzerinden keşfedilir; mevcut Gateway aktarımı, özel bir Talk transkripsiyon yapılandırma yüzeyi yayımlanana kadar Voice Call akış sağlayıcısı yapılandırmasını kullanır.

## macOS kullanıcı arayüzü

- Menü çubuğu geçişi: **Talk**
- Yapılandırma sekmesi: **Talk Modu** grubu (ses kimliği + kesme geçişi)
- Katman: Küre, evrensel konuşma dalga biçimini oluşturur (iOS, watchOS ve Android ile ortaktır). Dinleme sırasında canlı mikrofon seviyesi, Konuşma sırasında gerçek TTS oynatma zarfı izlenir; Düşünme sırasında hafifçe nefes alıp verir. Duraklatmak/devam ettirmek için küreye tıklayın, konuşmayı durdurmak için çift tıklayın, Talk modundan çıkmak için X'e tıklayın.

## Android kullanıcı arayüzü

- Ses sekmesi geçişi: **Talk**
- Manuel **Mikrofon** ve **Talk**, birbirini dışlayan yakalama modlarıdır.
- Manuel Mikrofon ve gerçek zamanlı Talk, bağlı bir Bluetooth Classic veya BLE kulaklık mikrofonunu tercih eder; bağlantı kesilirse uygulama başka bir kulaklık girişi ister veya varsayılan mikrofona geri döner ve yakalama durduğunda varsayılan tercihi yeniden etkinleştirir.
- Uygulama ön plandan ayrıldığında veya kullanıcı Ses sekmesinden çıktığında Manuel Mikrofon durur.
- Talk Modu, kapatılana veya Node bağlantısı kesilene kadar çalışmayı sürdürür ve etkin olduğu sürede Android'in mikrofon ön plan hizmeti türünü kullanır.
- Android, düşük gecikmeli `AudioTrack` akışı için `pcm_16000`, `pcm_22050`, `pcm_24000` ve `pcm_44100` çıkış biçimlerini destekler.

## Notlar

- Konuşma + Mikrofon izinleri gerektirir.
- Yerel Talk, etkin Gateway oturumunu kullanır ve yalnızca yanıt olayları kullanılamadığında geçmiş yoklamasına geri döner.
- Gateway, etkin Talk sağlayıcısını kullanarak Talk oynatmasını `talk.speak` üzerinden çözümler. Android, yalnızca bu RPC kullanılamadığında yerel sistem TTS'sine geri döner.
- macOS yerel MLX oynatması, mevcut olduğunda paketle birlikte gelen `openclaw-mlx-tts` yardımcısını veya `PATH` üzerindeki bir yürütülebilir dosyayı kullanır. Geliştirme sırasında özel bir yardımcı ikili dosyayı göstermek için `OPENCLAW_MLX_TTS_BIN` değişkenini ayarlayın.
- Ses yönergesi değer aralıkları (ElevenLabs): `stability`, `similarity` ve `style`, `0..1`; `speed`, `0.5..2`; `latency_tier` ise `0..4` aralığındaki değerleri kabul eder.

## İlgili konular

- [Sesle uyandırma](/tr/nodes/voicewake)
- [Ses ve sesli notlar](/tr/nodes/audio)
- [Medya anlama](/tr/nodes/media-understanding)
