---
read_when:
    - macOS/iOS/Android'de Konuşma modunu uygulama
    - Ses/TTS/kesme davranışını değiştirme
summary: 'Konuşma modu: yerel STT/TTS ve gerçek zamanlı ses üzerinden kesintisiz sesli konuşmalar'
title: Konuşma modu
x-i18n:
    generated_at: "2026-05-10T19:42:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

Talk modunun iki çalışma zamanı biçimi vardır:

- Yerel macOS/iOS/Android Talk, yerel konuşma tanıma, Gateway sohbeti ve `talk.speak` TTS kullanır. Düğümler `talk` yeteneğini ilan eder ve destekledikleri `talk.*` komutlarını bildirir.
- Tarayıcı Talk, istemciye ait `webrtc` ve `provider-websocket` oturumları için `talk.client.create`, ya da Gateway’e ait `gateway-relay` oturumları için `talk.session.create` kullanır. `managed-room`, Gateway devri ve telsiz konuşma odaları için ayrılmıştır.
- Yalnızca transkripsiyon yapan istemciler, yardımcı sesli yanıtı olmadan altyazı veya dikte gerektiğinde `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, ardından `talk.session.appendAudio`, `talk.session.cancelTurn` ve `talk.session.close` kullanır.

Yerel Talk kesintisiz bir sesli konuşma döngüsüdür:

1. Konuşmayı dinle
2. Transkripti etkin oturum üzerinden modele gönder
3. Yanıtı bekle
4. Yapılandırılmış Talk sağlayıcısı (`talk.speak`) üzerinden seslendir

Tarayıcı gerçek zamanlı Talk, sağlayıcı araç çağrılarını `talk.client.toolCall` üzerinden iletir; tarayıcı istemcileri gerçek zamanlı danışmalar için doğrudan `chat.send` çağırmaz.

Yalnızca transkripsiyon yapan Talk, gerçek zamanlı ve STT/TTS oturumlarıyla aynı ortak Talk olay zarfını yayar, ancak `mode: "transcription"` ve `brain: "none"` kullanır. Altyazılar, dikte ve yalnızca gözlem amaçlı konuşma yakalama içindir; tek seferlik yüklenen sesli notlar hâlâ medya/ses yolunu kullanır.

## Davranış (macOS)

- Talk modu etkinken **her zaman açık katman**.
- **Dinleme → Düşünme → Konuşma** aşama geçişleri.
- **Kısa duraklama** durumunda (sessizlik penceresi), mevcut transkript gönderilir.
- Yanıtlar **WebChat’e yazılır** (yazmakla aynı).
- **Konuşmada kesme** (varsayılan açık): kullanıcı yardımcı konuşurken konuşmaya başlarsa oynatmayı durdurur ve sonraki istem için kesinti zaman damgasını not ederiz.

## Yanıtlarda ses yönergeleri

Yardımcı, sesi kontrol etmek için yanıtının başına **tek bir JSON satırı** ekleyebilir:

```json
{ "voice": "<voice-id>", "once": true }
```

Kurallar:

- Yalnızca ilk boş olmayan satır.
- Bilinmeyen anahtarlar yok sayılır.
- `once: true` yalnızca geçerli yanıta uygulanır.
- `once` yoksa ses, Talk modu için yeni varsayılan olur.
- JSON satırı TTS oynatmadan önce çıkarılır.

Desteklenen anahtarlar:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Sıcak bir tonla konuş ve yanıtları kısa tut.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Varsayılanlar:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: ayarlanmadığında Talk, transkripti göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'te 900 ms`)
- `provider`: etkin Talk sağlayıcısını seçer. macOS-yerel oynatma yolları için `elevenlabs`, `mlx` veya `system` kullanın.
- `providers.<provider>.voiceId`: ElevenLabs için `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` değerine geri döner (veya API anahtarı kullanılabiliyorsa ilk ElevenLabs sesine).
- `providers.elevenlabs.modelId`: ayarlanmadığında varsayılan olarak `eleven_v3` olur.
- `providers.mlx.modelId`: ayarlanmadığında varsayılan olarak `mlx-community/Soprano-80M-bf16` olur.
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` değerine geri döner (veya varsa gateway kabuk profiline).
- `consultThinkingLevel`: gerçek zamanlı `openclaw_agent_consult` çağrılarının arkasındaki tam OpenClaw ajan çalıştırması için isteğe bağlı düşünme düzeyi geçersiz kılması.
- `consultFastMode`: gerçek zamanlı `openclaw_agent_consult` çağrıları için isteğe bağlı hızlı mod geçersiz kılması.
- `realtime.provider`: etkin tarayıcı/sunucu gerçek zamanlı ses sağlayıcısını seçer. WebRTC için `openai`, sağlayıcı WebSocket için `google` veya Gateway relay üzerinden yalnızca köprü sağlayıcısı kullanın.
- `realtime.providers.<provider>` sağlayıcıya ait gerçek zamanlı yapılandırmayı saklar. Tarayıcı yalnızca geçici veya kısıtlı oturum kimlik bilgilerini alır, asla standart API anahtarı almaz.
- `realtime.providers.openai.voice`: yerleşik OpenAI Realtime ses kimliği. Geçerli `gpt-realtime-2` sesleri `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` ve `cedar` değerleridir; en iyi kalite için `marin` ve `cedar` önerilir.
- `realtime.brain`: `agent-consult`, gerçek zamanlı araç çağrılarını Gateway politikası üzerinden yönlendirir; `direct-tools` yalnızca sahip uyumluluk davranışıdır; `none` transkripsiyon veya harici orkestrasyon içindir.
- `realtime.instructions`: OpenClaw’ın yerleşik gerçek zamanlı istemine sağlayıcıya dönük sistem yönergeleri ekler. Ses tarzı ve tonu için kullanın; OpenClaw varsayılan `openclaw_agent_consult` kılavuzunu korur.
- `talk.catalog`, birinci taraf Talk istemcilerinin desteklenmeyen kombinasyonlardan kaçınabilmesi için her sağlayıcının geçerli modlarını, aktarımlarını, brain stratejilerini, gerçek zamanlı ses biçimlerini ve yetenek bayraklarını açığa çıkarır.
- Akış transkripsiyon sağlayıcıları `talk.catalog.transcription` üzerinden keşfedilir. Geçerli Gateway relay, özel Talk transkripsiyon yapılandırma yüzeyi eklenene kadar Voice Call akış sağlayıcısı yapılandırmasını kullanır.
- `speechLocale`: iOS/macOS üzerinde cihaz içi Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği. Cihaz varsayılanını kullanmak için ayarlamayın.
- `outputFormat`: macOS/iOS üzerinde varsayılan olarak `pcm_44100`, Android üzerinde `pcm_24000` olur (MP3 akışını zorlamak için `mp3_*` ayarlayın)

## macOS kullanıcı arayüzü

- Menü çubuğu anahtarı: **Talk**
- Yapılandırma sekmesi: **Talk Mode** grubu (ses kimliği + kesme anahtarı)
- Katman:
  - **Dinleme**: bulut mikrofon düzeyiyle titreşir
  - **Düşünme**: batma animasyonu
  - **Konuşma**: yayılan halkalar
  - Buluta tıkla: konuşmayı durdur
  - X’e tıkla: Talk modundan çık

## Android kullanıcı arayüzü

- Ses sekmesi anahtarı: **Talk**
- Manuel **Mic** ve **Talk**, birbirini dışlayan çalışma zamanı yakalama modlarıdır.
- Uygulama ön plandan ayrıldığında veya kullanıcı Ses sekmesinden çıktığında Manuel Mic durur.
- Talk Mode kapatılana veya Android düğümünün bağlantısı kesilene kadar çalışmaya devam eder ve etkinken Android’in mikrofon foreground-service türünü kullanır.

## Notlar

- Konuşma + Mikrofon izinleri gerektirir.
- Yerel Talk etkin Gateway oturumunu kullanır ve yalnızca yanıt olayları kullanılamadığında geçmiş yoklamasına geri döner.
- Tarayıcı gerçek zamanlı Talk, sağlayıcıya ait tarayıcı oturumlarına `chat.send` açmak yerine `openclaw_agent_consult` için `talk.client.toolCall` kullanır.
- Yalnızca transkripsiyon yapan Talk, `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` ve `talk.session.close` kullanır; istemciler kısmi/son transkript güncellemeleri için `talk.event` aboneliği yapar.
- gateway, Talk oynatmayı etkin Talk sağlayıcısını kullanarak `talk.speak` üzerinden çözer. Android yalnızca bu RPC kullanılamadığında yerel sistem TTS’ye geri döner.
- macOS yerel MLX oynatma, varsa paketle gelen `openclaw-mlx-tts` yardımcısını veya `PATH` üzerindeki bir yürütülebilir dosyayı kullanır. Geliştirme sırasında özel yardımcı ikiliye işaret etmek için `OPENCLAW_MLX_TTS_BIN` ayarlayın.
- `eleven_v3` için `stability`, `0.0`, `0.5` veya `1.0` değerlerine doğrulanır; diğer modeller `0..1` kabul eder.
- `latency_tier` ayarlandığında `0..4` aralığına doğrulanır.
- Android, düşük gecikmeli AudioTrack akışı için `pcm_16000`, `pcm_22050`, `pcm_24000` ve `pcm_44100` çıktı biçimlerini destekler.

## İlgili

- [Voice wake](/tr/nodes/voicewake)
- [Ses ve sesli notlar](/tr/nodes/audio)
- [Medya anlama](/tr/nodes/media-understanding)
