---
read_when:
    - macOS/iOS/Android'de Konuşma modunu uygulama
    - Ses/TTS/kesme davranışını değiştirme
summary: 'Konuşma modu: yerel STT/TTS ve gerçek zamanlı ses üzerinden kesintisiz sesli sohbetler'
title: Konuşma modu
x-i18n:
    generated_at: "2026-05-06T09:21:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

Konuşma modunun iki çalışma zamanı biçimi vardır:

- Yerel macOS/iOS/Android Konuşma, yerel konuşma tanıma, Gateway sohbeti ve `talk.speak` TTS kullanır. Node'lar `talk` yeteneğini duyurur ve destekledikleri `talk.*` komutlarını bildirir.
- Tarayıcı Konuşması, istemciye ait `webrtc` ve `provider-websocket` oturumları için `talk.client.create` kullanır veya Gateway'e ait `gateway-relay` oturumları için `talk.session.create` kullanır. `managed-room`, Gateway devri ve bas-konuş odaları için ayrılmıştır.
- Yalnızca transkripsiyon istemcileri, yardımcı ses yanıtı olmadan altyazı veya dikte gerektiğinde `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, ardından `talk.session.appendAudio`, `talk.session.cancelTurn` ve `talk.session.close` kullanır.

Yerel Konuşma, sürekli bir sesli konuşma döngüsüdür:

1. Konuşmayı dinle
2. Transkripti etkin oturum üzerinden modele gönder
3. Yanıtı bekle
4. Yapılandırılmış Konuşma sağlayıcısı (`talk.speak`) üzerinden seslendir

Tarayıcı gerçek zamanlı Konuşması, sağlayıcı araç çağrılarını `talk.client.toolCall` üzerinden iletir; tarayıcı istemcileri gerçek zamanlı danışmalar için doğrudan `chat.send` çağırmaz.

Yalnızca transkripsiyon Konuşması, gerçek zamanlı ve STT/TTS oturumlarıyla aynı ortak Konuşma olay zarfını yayar, ancak `mode: "transcription"` ve `brain: "none"` kullanır. Altyazılar, dikte ve yalnızca gözlem amaçlı konuşma yakalama içindir; tek seferlik yüklenen sesli notlar hâlâ medya/ses yolunu kullanır.

## Davranış (macOS)

- Konuşma modu etkinken **her zaman açık katman**.
- **Dinleme → Düşünme → Konuşma** aşama geçişleri.
- **Kısa bir duraklamada** (sessizlik penceresi), mevcut transkript gönderilir.
- Yanıtlar **WebChat'e yazılır** (yazmakla aynı).
- **Konuşmayla kesme** (varsayılan açık): kullanıcı, yardımcı konuşurken konuşmaya başlarsa oynatmayı durdururuz ve sonraki istem için kesinti zaman damgasını not ederiz.

## Yanıtlardaki ses yönergeleri

Yardımcı, sesi kontrol etmek için yanıtının başına **tek bir JSON satırı** ekleyebilir:

```json
{ "voice": "<voice-id>", "once": true }
```

Kurallar:

- Yalnızca ilk boş olmayan satır.
- Bilinmeyen anahtarlar yok sayılır.
- `once: true` yalnızca geçerli yanıta uygulanır.
- `once` olmadan ses, Konuşma modu için yeni varsayılan olur.
- JSON satırı TTS oynatmasından önce kaldırılır.

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
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Varsayılanlar:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: ayarlanmamışsa Konuşma, transkripti göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)
- `provider`: etkin Konuşma sağlayıcısını seçer. macOS yerel oynatma yolları için `elevenlabs`, `mlx` veya `system` kullanın.
- `providers.<provider>.voiceId`: ElevenLabs için `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` değerine geri döner (veya API anahtarı kullanılabiliyorsa ilk ElevenLabs sesine).
- `providers.elevenlabs.modelId`: ayarlanmamışsa varsayılan olarak `eleven_v3` olur.
- `providers.mlx.modelId`: ayarlanmamışsa varsayılan olarak `mlx-community/Soprano-80M-bf16` olur.
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` değerine geri döner (veya varsa gateway kabuk profiline).
- `realtime.provider`: etkin tarayıcı/sunucu gerçek zamanlı ses sağlayıcısını seçer. WebRTC için `openai`, sağlayıcı WebSocket için `google` veya Gateway aktarması üzerinden yalnızca köprü sağlayıcısı kullanın.
- `realtime.providers.<provider>` sağlayıcıya ait gerçek zamanlı yapılandırmayı depolar. Tarayıcı yalnızca geçici veya kısıtlanmış oturum kimlik bilgilerini alır, hiçbir zaman standart API anahtarı almaz.
- `realtime.brain`: `agent-consult`, gerçek zamanlı araç çağrılarını Gateway ilkesi üzerinden yönlendirir; `direct-tools` yalnızca sahibine ait uyumluluk davranışıdır; `none` transkripsiyon veya harici orkestrasyon içindir.
- `talk.catalog`, birinci taraf Konuşma istemcilerinin desteklenmeyen kombinasyonlardan kaçınabilmesi için her sağlayıcının geçerli modlarını, aktarımlarını, beyin stratejilerini, gerçek zamanlı ses biçimlerini ve yetenek bayraklarını sunar.
- Akış transkripsiyonu sağlayıcıları `talk.catalog.transcription` üzerinden keşfedilir. Geçerli Gateway aktarması, özel Konuşma transkripsiyonu yapılandırma yüzeyi eklenene kadar Voice Call akış sağlayıcısı yapılandırmasını kullanır.
- `speechLocale`: iOS/macOS üzerinde cihaz üzeri Konuşma konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği. Cihaz varsayılanını kullanmak için ayarlanmamış bırakın.
- `outputFormat`: macOS/iOS üzerinde varsayılan olarak `pcm_44100`, Android üzerinde `pcm_24000` olur (MP3 akışını zorlamak için `mp3_*` ayarlayın)

## macOS kullanıcı arayüzü

- Menü çubuğu geçişi: **Konuşma**
- Yapılandırma sekmesi: **Konuşma Modu** grubu (ses kimliği + kesme geçişi)
- Katman:
  - **Dinleme**: bulut mikrofon seviyesiyle titreşir
  - **Düşünme**: alçalma animasyonu
  - **Konuşma**: yayılan halkalar
  - Buluta tıkla: konuşmayı durdur
  - X'e tıkla: Konuşma modundan çık

## Android kullanıcı arayüzü

- Ses sekmesi geçişi: **Konuşma**
- Manuel **Mikrofon** ve **Konuşma**, birbirini dışlayan çalışma zamanı yakalama modlarıdır.
- Manuel Mikrofon, uygulama ön plandan ayrıldığında veya kullanıcı Ses sekmesinden ayrıldığında durur.
- Konuşma Modu, kapatılana veya Android Node bağlantısı kesilene kadar çalışmaya devam eder ve etkin durumdayken Android'in mikrofon foreground-service türünü kullanır.

## Notlar

- Konuşma + Mikrofon izinleri gerektirir.
- Yerel Konuşma etkin Gateway oturumunu kullanır ve yalnızca yanıt olayları kullanılamadığında geçmiş yoklamasına geri döner.
- Tarayıcı gerçek zamanlı Konuşması, sağlayıcıya ait tarayıcı oturumlarına `chat.send` açmak yerine `openclaw_agent_consult` için `talk.client.toolCall` kullanır.
- Yalnızca transkripsiyon Konuşması `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` ve `talk.session.close` kullanır; istemciler kısmi/son transkript güncellemeleri için `talk.event` öğesine abone olur.
- Gateway, etkin Konuşma sağlayıcısını kullanarak Konuşma oynatmasını `talk.speak` üzerinden çözer. Android yalnızca bu RPC kullanılamadığında yerel sistem TTS'ye geri döner.
- macOS yerel MLX oynatması, mevcutsa paketlenmiş `openclaw-mlx-tts` yardımcısını veya `PATH` üzerinde bir yürütülebilir dosyayı kullanır. Geliştirme sırasında özel bir yardımcı ikili dosyaya işaret etmek için `OPENCLAW_MLX_TTS_BIN` ayarlayın.
- `eleven_v3` için `stability`, `0.0`, `0.5` veya `1.0` olarak doğrulanır; diğer modeller `0..1` kabul eder.
- `latency_tier` ayarlandığında `0..4` olarak doğrulanır.
- Android, düşük gecikmeli AudioTrack akışı için `pcm_16000`, `pcm_22050`, `pcm_24000` ve `pcm_44100` çıktı biçimlerini destekler.

## İlgili

- [Sesle uyandırma](/tr/nodes/voicewake)
- [Ses ve sesli notlar](/tr/nodes/audio)
- [Medya anlama](/tr/nodes/media-understanding)
