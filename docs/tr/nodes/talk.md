---
read_when:
    - macOS/iOS/Android üzerinde Konuşma modunu uygulama
    - Ses/TTS/kesme davranışını değiştirme
summary: 'Konuşma modu: yerel STT/TTS ve gerçek zamanlı ses üzerinden sürekli konuşma sohbetleri'
title: Konuşma modu
x-i18n:
    generated_at: "2026-07-03T09:53:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

Talk modunun iki çalışma zamanı biçimi vardır:

- Yerel macOS/iOS/Android Talk, yerel konuşma tanıma, Gateway sohbeti ve `talk.speak` TTS kullanır. Düğümler `talk` yeteneğini duyurur ve destekledikleri `talk.*` komutlarını bildirir.
- iOS Talk, `webrtc` seçen veya aktarımı atlayan OpenAI gerçek zamanlı yapılandırmaları için istemciye ait WebRTC kullanır. Açık `gateway-relay`, `provider-websocket` ve OpenAI dışı gerçek zamanlı yapılandırmalar Gateway'e ait rölede kalır; gerçek zamanlı olmayan yapılandırmalar yerel konuşma döngüsünü kullanır.
- Tarayıcı Talk, istemciye ait `webrtc` ve `provider-websocket` oturumları için `talk.client.create`, Gateway'e ait `gateway-relay` oturumları için ise `talk.session.create` kullanır. `managed-room`, Gateway devri ve bas-konuş odaları için ayrılmıştır.
- Android Talk, `talk.realtime.mode: "realtime"` ve `talk.realtime.transport: "gateway-relay"` ile Gateway'e ait gerçek zamanlı röle oturumlarını seçebilir. Aksi halde yerel konuşma tanıma, Gateway sohbeti ve `talk.speak` üzerinde kalır.
- Yalnızca transkripsiyon istemcileri, yardımcı sesli yanıt olmadan altyazı veya dikteye ihtiyaç duyduklarında `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, ardından `talk.session.appendAudio`, `talk.session.cancelTurn` ve `talk.session.close` kullanır.

Yerel Talk, sürekli bir sesli konuşma döngüsüdür:

1. Konuşmayı dinle
2. Transkripti etkin oturum üzerinden modele gönder
3. Yanıtı bekle
4. Yapılandırılmış Talk sağlayıcısı (`talk.speak`) üzerinden seslendir

İstemciye ait gerçek zamanlı Talk, sağlayıcı araç çağrılarını `talk.client.toolCall` üzerinden iletir; bu istemciler gerçek zamanlı danışmalar için doğrudan `chat.send` çağırmaz.
Gerçek zamanlı bir danışma etkinken Talk istemcileri, konuşulan girdiyi `status`, `steer`, `cancel` veya
`followup` olarak sınıflandırmak için `talk.client.steer` ya da
`talk.session.steer` kullanabilir. Kabul edilen yönlendirme etkin gömülü çalıştırmaya kuyruğa alınır; reddedilen
yönlendirme `no_active_run`, `not_streaming` veya
`compacting` gibi yapılandırılmış bir neden döndürür.

Yalnızca transkripsiyon Talk, gerçek zamanlı ve STT/TTS oturumlarıyla aynı ortak Talk olay zarfını yayar, ancak `mode: "transcription"` ve `brain: "none"` kullanır. Altyazılar, dikte ve yalnızca gözlem amaçlı konuşma yakalama içindir; tek seferlik yüklenen sesli notlar hâlâ medya/ses yolunu kullanır.

## Davranış (macOS)

- Talk modu etkinken **her zaman açık bindirme**.
- **Dinliyor → Düşünüyor → Konuşuyor** aşama geçişleri.
- **Kısa duraklamada** (sessizlik penceresi), geçerli transkript gönderilir.
- Yanıtlar **WebChat'e yazılır** (yazmakla aynı).
- **Konuşmayla kesinti** (varsayılan olarak açık): Kullanıcı, yardımcı konuşurken konuşmaya başlarsa oynatmayı durdurur ve sonraki istem için kesinti zaman damgasını not ederiz.

## Yanıtlarda ses yönergeleri

Yardımcı, sesi denetlemek için yanıtının başına **tek bir JSON satırı** ekleyebilir:

```json
{ "voice": "<voice-id>", "once": true }
```

Kurallar:

- Yalnızca ilk boş olmayan satır.
- Bilinmeyen anahtarlar yok sayılır.
- `once: true` yalnızca geçerli yanıta uygulanır.
- `once` olmadan, ses Talk modu için yeni varsayılan olur.
- JSON satırı TTS oynatmadan önce kaldırılır.

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
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Varsayılanlar:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: ayarlanmadığında Talk, transkripti göndermeden önce platformun varsayılan duraklama penceresini korur (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: etkin Talk sağlayıcısını seçer. macOS yerel oynatma yolları için `elevenlabs`, `mlx` veya `system` kullanın.
- `providers.<provider>.voiceId`: ElevenLabs için `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` değerine geri döner (veya API anahtarı kullanılabiliyorsa ilk ElevenLabs sesi).
- `providers.elevenlabs.modelId`: ayarlanmadığında varsayılan olarak `eleven_v3` olur.
- `providers.mlx.modelId`: ayarlanmadığında varsayılan olarak `mlx-community/Soprano-80M-bf16` olur.
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` değerine geri döner (veya varsa Gateway kabuk profiline).
- `consultThinkingLevel`: gerçek zamanlı `openclaw_agent_consult` çağrılarının arkasındaki tam OpenClaw ajan çalıştırması için isteğe bağlı düşünme seviyesi geçersiz kılması.
- `consultFastMode`: gerçek zamanlı `openclaw_agent_consult` çağrıları için isteğe bağlı hızlı mod geçersiz kılması.
- `realtime.provider`: etkin gerçek zamanlı ses sağlayıcısını seçer. WebRTC için `openai`, sağlayıcı WebSocket için `google` veya Gateway rölesi üzerinden yalnızca köprü sağlayıcısı kullanın.
- `realtime.providers.<provider>` sağlayıcıya ait gerçek zamanlı yapılandırmayı saklar. Tarayıcı yalnızca geçici veya kısıtlı oturum kimlik bilgilerini alır, hiçbir zaman standart bir API anahtarı almaz.
- `realtime.providers.openai.voice`: yerleşik OpenAI Realtime ses kimliği. Geçerli `gpt-realtime-2` sesleri `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` ve `cedar`; en iyi kalite için `marin` ve `cedar` önerilir.
- `realtime.transport`: `webrtc`, iOS'ta ve tarayıcıda istemciye ait OpenAI WebRTC kullanır. `provider-websocket` tarayıcıya aittir ancak iOS'ta Gateway rölesinde kalır. `gateway-relay` sağlayıcı sesini Gateway üzerinde tutar; Android gerçek zamanı yalnızca bu aktarım için kullanır ve aksi halde yerel STT/TTS döngüsünü korur.
- `realtime.brain`: `agent-consult` gerçek zamanlı araç çağrılarını Gateway ilkesi üzerinden yönlendirir; `direct-tools` eski doğrudan araç uyumluluk davranışıdır; `none` transkripsiyon veya harici orkestrasyon içindir.
- `realtime.consultRouting`: `provider-direct`, sağlayıcı `openclaw_agent_consult` öğesini atladığında sağlayıcının doğrudan yanıtını korur; `force-agent-consult` Gateway rölesinin sonlandırılmış kullanıcı transkriptlerini bunun yerine OpenClaw üzerinden yönlendirmesini sağlar.
- `realtime.instructions`: sağlayıcıya yönelik sistem yönergelerini OpenClaw'ın yerleşik gerçek zamanlı istemine ekler. Ses stili ve tonu için kullanın; OpenClaw varsayılan `openclaw_agent_consult` kılavuzunu korur.
- `talk.catalog`, her sağlayıcının geçerli modları, aktarımları, beyin stratejileri, gerçek zamanlı ses biçimleri, yetenek bayrakları ve çalışma zamanında seçilen hazır olma sonucunun yanında kanonik sağlayıcı kimliklerini ve kayıt defteri takma adlarını gösterir. Birinci taraf Talk istemcileri, sağlayıcı takma adlarını yerel olarak tutmak yerine bu kataloğu kullanmalıdır; grup hazır olma bilgisini atlayan eski bir Gateway kesin olarak yapılandırılmamış değil, doğrulanmamış sayılır.
- Akış transkripsiyonu sağlayıcıları `talk.catalog.transcription` üzerinden keşfedilir. Geçerli Gateway rölesi, ayrılmış Talk transkripsiyon yapılandırma yüzeyi eklenene kadar Voice Call akış sağlayıcısı yapılandırmasını kullanır.
- `speechLocale`: iOS/macOS üzerinde cihaz içi Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği. Cihaz varsayılanını kullanmak için ayarlanmadan bırakın.
- `outputFormat`: macOS/iOS üzerinde varsayılan olarak `pcm_44100`, Android üzerinde `pcm_24000` olur (MP3 akışını zorlamak için `mp3_*` ayarlayın)

## macOS kullanıcı arayüzü

- Menü çubuğu anahtarı: **Talk**
- Yapılandırma sekmesi: **Talk Modu** grubu (ses kimliği + kesinti anahtarı)
- Bindirme:
  - **Dinliyor**: bulut mikrofon seviyesiyle titreşir
  - **Düşünüyor**: batma animasyonu
  - **Konuşuyor**: yayılan halkalar
  - Buluta tıkla: konuşmayı durdur
  - X'e tıkla: Talk modundan çık

## Android kullanıcı arayüzü

- Ses sekmesi anahtarı: **Talk**
- Manuel **Mikrofon** ve **Talk**, karşılıklı dışlayan çalışma zamanı yakalama modlarıdır.
- Manuel Mikrofon ve gerçek zamanlı Talk, bağlı bir Bluetooth Classic veya BLE kulaklık mikrofonunu tercih eder. Bağlantısı kesilirse uygulama başka bir kulaklık girişi ister veya Android'in varsayılan mikrofonu kullanmasına izin verir; yakalamayı durdurmak varsayılan mikrofon tercihini geri yükler.
- Uygulama ön plandan ayrıldığında veya kullanıcı Ses sekmesinden çıktığında Manuel Mikrofon durur.
- Talk Modu kapatılana veya Android düğümünün bağlantısı kesilene kadar çalışmaya devam eder ve etkinken Android'in mikrofon ön plan hizmeti türünü kullanır.

## Notlar

- Konuşma + Mikrofon izinleri gerektirir.
- Yerel Talk etkin Gateway oturumunu kullanır ve yalnızca yanıt olayları kullanılamadığında geçmiş yoklamasına geri döner.
- İstemciye ait gerçek zamanlı Talk, sağlayıcıya ait oturumlara `chat.send` sunmak yerine `openclaw_agent_consult` için `talk.client.toolCall` kullanır.
- Yalnızca transkripsiyon Talk, `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` ve `talk.session.close` kullanır; istemciler kısmi/son transkript güncellemeleri için `talk.event` öğesine abone olur.
- Gateway, etkin Talk sağlayıcısını kullanarak Talk oynatmasını `talk.speak` üzerinden çözümler. Android, yalnızca bu RPC kullanılamadığında yerel sistem TTS'ye geri döner.
- macOS yerel MLX oynatması, varsa paketlenmiş `openclaw-mlx-tts` yardımcısını veya `PATH` üzerinde bir yürütülebilir dosyayı kullanır. Geliştirme sırasında özel bir yardımcı ikili dosyaya işaret etmek için `OPENCLAW_MLX_TTS_BIN` ayarlayın.
- `eleven_v3` için `stability`, `0.0`, `0.5` veya `1.0` olarak doğrulanır; diğer modeller `0..1` kabul eder.
- `latency_tier` ayarlandığında `0..4` olarak doğrulanır.
- Android, düşük gecikmeli AudioTrack akışı için `pcm_16000`, `pcm_22050`, `pcm_24000` ve `pcm_44100` çıkış biçimlerini destekler.

## İlgili

- [Sesle uyandırma](/tr/nodes/voicewake)
- [Ses ve sesli notlar](/tr/nodes/audio)
- [Medya anlama](/tr/nodes/media-understanding)
