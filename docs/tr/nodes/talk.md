---
read_when:
    - macOS/iOS/Android'de Konuşma modunu uygulama
    - Ses/TTS/kesme davranışını değiştirme
summary: 'Konuşma modu: yerel STT/TTS ve gerçek zamanlı ses üzerinden kesintisiz konuşma sohbetleri'
title: Konuşma modu
x-i18n:
    generated_at: "2026-07-02T22:44:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

Konuşma modunun iki çalışma zamanı biçimi vardır:

- Yerel macOS/iOS/Android Konuşma; yerel konuşma tanıma, Gateway sohbeti ve `talk.speak` TTS kullanır. Düğümler `talk` yeteneğini duyurur ve destekledikleri `talk.*` komutlarını bildirir.
- iOS Konuşma, `webrtc` seçen veya aktarımı atlayan OpenAI gerçek zamanlı yapılandırmaları için istemciye ait WebRTC kullanır. Açık `gateway-relay`, `provider-websocket` ve OpenAI dışı gerçek zamanlı yapılandırmalar Gateway'e ait rölede kalır; gerçek zamanlı olmayan yapılandırmalar yerel konuşma döngüsünü kullanır.
- Tarayıcı Konuşma, istemciye ait `webrtc` ve `provider-websocket` oturumları için `talk.client.create`, Gateway'e ait `gateway-relay` oturumları için `talk.session.create` kullanır. `managed-room`, Gateway devri ve telsiz odaları için ayrılmıştır.
- Android Konuşma, `talk.realtime.mode: "realtime"` ve `talk.realtime.transport: "gateway-relay"` ile Gateway'e ait gerçek zamanlı röle oturumlarına katılabilir. Aksi halde yerel konuşma tanıma, Gateway sohbeti ve `talk.speak` üzerinde kalır.
- Yalnızca transkripsiyon istemcileri, asistan sesli yanıtı olmadan altyazı veya dikte gerektiğinde `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, ardından `talk.session.appendAudio`, `talk.session.cancelTurn` ve `talk.session.close` kullanır.

Yerel Konuşma sürekli bir sesli konuşma döngüsüdür:

1. Konuşmayı dinle
2. Transkripti etkin oturum üzerinden modele gönder
3. Yanıtı bekle
4. Yapılandırılmış Konuşma sağlayıcısı (`talk.speak`) üzerinden seslendir

İstemciye ait gerçek zamanlı Konuşma, sağlayıcı araç çağrılarını `talk.client.toolCall` üzerinden iletir; bu istemciler gerçek zamanlı danışmalar için doğrudan `chat.send` çağırmaz.
Gerçek zamanlı bir danışma etkinken, Konuşma istemcileri sözlü girdiyi `status`, `steer`, `cancel` veya
`followup` olarak sınıflandırmak için `talk.client.steer` ya da
`talk.session.steer` kullanabilir. Kabul edilen yönlendirme etkin gömülü çalıştırmaya kuyruğa alınır; reddedilen
yönlendirme `no_active_run`, `not_streaming` veya
`compacting` gibi yapılandırılmış bir neden döndürür.

Yalnızca transkripsiyon Konuşma, gerçek zamanlı ve STT/TTS oturumlarıyla aynı ortak Konuşma olay zarfını yayar, ancak `mode: "transcription"` ve `brain: "none"` kullanır. Altyazılar, dikte ve yalnızca gözlem amaçlı konuşma yakalama içindir; tek seferlik yüklenen sesli notlar yine medya/ses yolunu kullanır.

## Davranış (macOS)

- Konuşma modu etkinken **her zaman açık katman**.
- **Dinliyor → Düşünüyor → Konuşuyor** aşama geçişleri.
- **Kısa duraklamada** (sessizlik penceresi), geçerli transkript gönderilir.
- Yanıtlar **WebChat'e yazılır** (yazmakla aynı).
- **Konuşmada kesme** (varsayılan açık): kullanıcı asistan konuşurken konuşmaya başlarsa, oynatmayı durdurur ve sonraki istem için kesme zaman damgasını not ederiz.

## Yanıtlarda ses yönergeleri

Asistan, sesi denetlemek için yanıtının başına **tek bir JSON satırı** ekleyebilir:

```json
{ "voice": "<voice-id>", "once": true }
```

Kurallar:

- Yalnızca ilk boş olmayan satır.
- Bilinmeyen anahtarlar yok sayılır.
- `once: true` yalnızca geçerli yanıta uygulanır.
- `once` olmadan, ses Konuşma modu için yeni varsayılan olur.
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
- `silenceTimeoutMs`: ayarlanmadığında, Konuşma transkripti göndermeden önce platform varsayılan duraklama penceresini korur (`macOS ve Android üzerinde 700 ms, iOS üzerinde 900 ms`)
- `provider`: etkin Konuşma sağlayıcısını seçer. macOS-yerel oynatma yolları için `elevenlabs`, `mlx` veya `system` kullanın.
- `providers.<provider>.voiceId`: ElevenLabs için `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` değerine geri döner (veya API anahtarı mevcutsa ilk ElevenLabs sesine).
- `providers.elevenlabs.modelId`: ayarlanmadığında varsayılan olarak `eleven_v3` olur.
- `providers.mlx.modelId`: ayarlanmadığında varsayılan olarak `mlx-community/Soprano-80M-bf16` olur.
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` değerine geri döner (veya mevcutsa gateway kabuk profiline).
- `consultThinkingLevel`: gerçek zamanlı `openclaw_agent_consult` çağrılarının arkasındaki tam OpenClaw ajan çalıştırması için isteğe bağlı düşünme düzeyi geçersiz kılması.
- `consultFastMode`: gerçek zamanlı `openclaw_agent_consult` çağrıları için isteğe bağlı hızlı mod geçersiz kılması.
- `realtime.provider`: etkin gerçek zamanlı ses sağlayıcısını seçer. WebRTC için `openai`, sağlayıcı WebSocket için `google` veya Gateway rölesi üzerinden yalnızca köprü sağlayıcısı kullanın.
- `realtime.providers.<provider>` sağlayıcıya ait gerçek zamanlı yapılandırmayı saklar. Tarayıcı yalnızca geçici veya kısıtlanmış oturum kimlik bilgilerini alır, asla standart bir API anahtarı almaz.
- `realtime.providers.openai.voice`: yerleşik OpenAI Realtime ses kimliği. Geçerli `gpt-realtime-2` sesleri `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` ve `cedar` değerleridir; en iyi kalite için `marin` ve `cedar` önerilir.
- `realtime.transport`: `webrtc`, iOS'ta ve tarayıcıda istemciye ait OpenAI WebRTC kullanır. `provider-websocket` tarayıcıya aittir ancak iOS'ta Gateway rölesinde kalır. `gateway-relay` sağlayıcı sesini Gateway üzerinde tutar; Android gerçek zamanlıyı yalnızca bu aktarım için kullanır ve aksi halde yerel STT/TTS döngüsünü korur.
- `realtime.brain`: `agent-consult`, gerçek zamanlı araç çağrılarını Gateway politikası üzerinden yönlendirir; `direct-tools` eski doğrudan araç uyumluluğu davranışıdır; `none` transkripsiyon veya harici orkestrasyon içindir.
- `realtime.consultRouting`: `provider-direct`, sağlayıcı `openclaw_agent_consult` atladığında sağlayıcının doğrudan yanıtını korur; `force-agent-consult`, Gateway rölesinin sonlandırılmış kullanıcı transkriptlerini bunun yerine OpenClaw üzerinden yönlendirmesini sağlar.
- `realtime.instructions`: OpenClaw'ın yerleşik gerçek zamanlı istemine sağlayıcıya yönelik sistem yönergeleri ekler. Ses stili ve tonu için kullanın; OpenClaw varsayılan `openclaw_agent_consult` rehberliğini korur.
- `talk.catalog`, birinci taraf Konuşma istemcilerinin desteklenmeyen kombinasyonlardan kaçınabilmesi için her sağlayıcının geçerli modlarını, aktarımlarını, beyin stratejilerini, gerçek zamanlı ses biçimlerini ve yetenek bayraklarını gösterir.
- Akış transkripsiyon sağlayıcıları `talk.catalog.transcription` üzerinden keşfedilir. Geçerli Gateway rölesi, özel Konuşma transkripsiyon yapılandırma yüzeyi eklenene kadar Voice Call akış sağlayıcı yapılandırmasını kullanır.
- `speechLocale`: iOS/macOS üzerinde cihaz içi Konuşma konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği. Cihaz varsayılanını kullanmak için ayarlamayın.
- `outputFormat`: macOS/iOS üzerinde varsayılan olarak `pcm_44100`, Android üzerinde `pcm_24000` olur (MP3 akışını zorlamak için `mp3_*` ayarlayın)

## macOS kullanıcı arayüzü

- Menü çubuğu anahtarı: **Konuşma**
- Yapılandırma sekmesi: **Konuşma Modu** grubu (ses kimliği + kesme anahtarı)
- Katman:
  - **Dinliyor**: bulut mikrofon düzeyiyle nabız gibi atar
  - **Düşünüyor**: batma animasyonu
  - **Konuşuyor**: yayılan halkalar
  - Buluta tıkla: konuşmayı durdur
  - X'e tıkla: Konuşma modundan çık

## Android kullanıcı arayüzü

- Ses sekmesi anahtarı: **Konuşma**
- Manuel **Mikrofon** ve **Konuşma**, birbirini dışlayan çalışma zamanı yakalama modlarıdır.
- Uygulama ön plandan ayrıldığında veya kullanıcı Ses sekmesinden çıktığında manuel Mikrofon durur.
- Konuşma Modu kapatılana veya Android düğümü bağlantıyı kesene kadar çalışmaya devam eder ve etkinken Android'in mikrofon ön plan hizmeti türünü kullanır.

## Notlar

- Konuşma + Mikrofon izinleri gerektirir.
- Yerel Konuşma etkin Gateway oturumunu kullanır ve yalnızca yanıt olayları kullanılamadığında geçmiş yoklamasına geri döner.
- İstemciye ait gerçek zamanlı Konuşma, sağlayıcıya ait oturumlara `chat.send` açmak yerine `openclaw_agent_consult` için `talk.client.toolCall` kullanır.
- Yalnızca transkripsiyon Konuşma `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` ve `talk.session.close` kullanır; istemciler kısmi/son transkript güncellemeleri için `talk.event` öğesine abone olur.
- Gateway, etkin Konuşma sağlayıcısını kullanarak Konuşma oynatmayı `talk.speak` üzerinden çözümler. Android yalnızca bu RPC kullanılamadığında yerel sistem TTS'ye geri döner.
- macOS yerel MLX oynatma, mevcut olduğunda paketlenmiş `openclaw-mlx-tts` yardımcısını veya `PATH` üzerindeki bir yürütülebilir dosyayı kullanır. Geliştirme sırasında özel bir yardımcı ikili dosyaya işaret etmek için `OPENCLAW_MLX_TTS_BIN` ayarlayın.
- `eleven_v3` için `stability`, `0.0`, `0.5` veya `1.0` olarak doğrulanır; diğer modeller `0..1` kabul eder.
- `latency_tier` ayarlandığında `0..4` olarak doğrulanır.
- Android, düşük gecikmeli AudioTrack akışı için `pcm_16000`, `pcm_22050`, `pcm_24000` ve `pcm_44100` çıktı biçimlerini destekler.

## İlgili

- [Sesle uyandırma](/tr/nodes/voicewake)
- [Ses ve sesli notlar](/tr/nodes/audio)
- [Medya anlama](/tr/nodes/media-understanding)
