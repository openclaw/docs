---
read_when:
    - macOS/iOS/Android üzerinde Talk modunu uygulama
    - Ses/TTS/kesme davranışını değiştirme
summary: 'Konuşma modu: yerel STT/TTS ve gerçek zamanlı ses üzerinden kesintisiz konuşma sohbetleri'
title: Konuşma modu
x-i18n:
    generated_at: "2026-06-28T00:46:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

Talk modunun iki çalışma zamanı biçimi vardır:

- Yerel macOS/iOS/Android Talk; yerel konuşma tanıma, Gateway sohbeti ve `talk.speak` TTS kullanır. Düğümler `talk` yeteneğini duyurur ve destekledikleri `talk.*` komutlarını bildirir.
- Tarayıcı Talk, istemcinin sahip olduğu `webrtc` ve `provider-websocket` oturumları için `talk.client.create` kullanır veya Gateway'in sahip olduğu `gateway-relay` oturumları için `talk.session.create` kullanır. `managed-room`, Gateway devri ve bas-konuş odaları için ayrılmıştır.
- Android Talk, `talk.realtime.mode: "realtime"` ve `talk.realtime.transport: "gateway-relay"` ile Gateway'in sahip olduğu gerçek zamanlı aktarma oturumlarına katılabilir. Aksi takdirde yerel konuşma tanıma, Gateway sohbeti ve `talk.speak` üzerinde kalır.
- Yalnızca transkripsiyon istemcileri, asistan sesli yanıtı olmadan altyazı veya dikte gerektiğinde `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, ardından `talk.session.appendAudio`, `talk.session.cancelTurn` ve `talk.session.close` kullanır.

Yerel Talk, sürekli bir sesli konuşma döngüsüdür:

1. Konuşmayı dinle
2. Transkripti etkin oturum üzerinden modele gönder
3. Yanıtı bekle
4. Yapılandırılan Talk sağlayıcısı (`talk.speak`) aracılığıyla seslendir

Tarayıcı gerçek zamanlı Talk, sağlayıcı araç çağrılarını `talk.client.toolCall` üzerinden iletir; tarayıcı istemcileri gerçek zamanlı danışmalar için doğrudan `chat.send` çağırmaz.
Gerçek zamanlı bir danışma etkinken, Talk istemcileri konuşulan girdiyi `status`, `steer`, `cancel` veya
`followup` olarak sınıflandırmak için `talk.client.steer` ya da
`talk.session.steer` kullanabilir. Kabul edilen yönlendirme etkin gömülü çalıştırmaya kuyruğa alınır; reddedilen
yönlendirme `no_active_run`, `not_streaming` veya
`compacting` gibi yapılandırılmış bir neden döndürür.

Yalnızca transkripsiyon Talk, gerçek zamanlı ve STT/TTS oturumlarıyla aynı ortak Talk olay zarfını yayar, ancak `mode: "transcription"` ve `brain: "none"` kullanır. Altyazılar, dikte ve yalnızca gözlem amaçlı konuşma yakalama içindir; tek seferlik yüklenen sesli notlar hâlâ medya/ses yolunu kullanır.

## Davranış (macOS)

- Talk modu etkinken **her zaman açık katman**.
- **Dinleme → Düşünme → Konuşma** aşama geçişleri.
- **Kısa duraklamada** (sessizlik penceresi), mevcut transkript gönderilir.
- Yanıtlar **WebChat'e yazılır** (yazmakla aynı).
- **Konuşmada kesinti** (varsayılan açık): kullanıcı asistan konuşurken konuşmaya başlarsa oynatmayı durdururuz ve sonraki istem için kesinti zaman damgasını not ederiz.

## Yanıtlarda ses yönergeleri

Asistan, sesi kontrol etmek için yanıtının başına **tek bir JSON satırı** ekleyebilir:

```json
{ "voice": "<voice-id>", "once": true }
```

Kurallar:

- Yalnızca ilk boş olmayan satır.
- Bilinmeyen anahtarlar yok sayılır.
- `once: true` yalnızca mevcut yanıta uygulanır.
- `once` olmadan ses, Talk modu için yeni varsayılan olur.
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
- `silenceTimeoutMs`: ayarlanmamışsa Talk, transkripti göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)
- `provider`: etkin Talk sağlayıcısını seçer. macOS yerel oynatma yolları için `elevenlabs`, `mlx` veya `system` kullanın.
- `providers.<provider>.voiceId`: ElevenLabs için `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` değerlerine geri döner (veya API anahtarı varsa ilk ElevenLabs sesine).
- `providers.elevenlabs.modelId`: ayarlanmamışsa varsayılan olarak `eleven_v3` olur.
- `providers.mlx.modelId`: ayarlanmamışsa varsayılan olarak `mlx-community/Soprano-80M-bf16` olur.
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` değerine geri döner (veya varsa Gateway kabuk profiline).
- `consultThinkingLevel`: gerçek zamanlı `openclaw_agent_consult` çağrılarının arkasındaki tam OpenClaw ajan çalıştırması için isteğe bağlı düşünme düzeyi geçersiz kılması.
- `consultFastMode`: gerçek zamanlı `openclaw_agent_consult` çağrıları için isteğe bağlı hızlı mod geçersiz kılması.
- `realtime.provider`: etkin tarayıcı/sunucu gerçek zamanlı ses sağlayıcısını seçer. WebRTC için `openai`, sağlayıcı WebSocket'i için `google` veya Gateway aktarması üzerinden yalnızca köprü sağlayıcısı kullanın.
- `realtime.providers.<provider>` sağlayıcının sahip olduğu gerçek zamanlı yapılandırmayı saklar. Tarayıcı yalnızca geçici veya kısıtlanmış oturum kimlik bilgilerini alır, hiçbir zaman standart API anahtarı almaz.
- `realtime.providers.openai.voice`: yerleşik OpenAI Realtime ses kimliği. Mevcut `gpt-realtime-2` sesleri `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` ve `cedar` değerleridir; en iyi kalite için `marin` ve `cedar` önerilir.
- `realtime.transport`: `webrtc` ve `provider-websocket` tarayıcı gerçek zamanlı aktarımlarıdır. Android yalnızca bu `gateway-relay` olduğunda gerçek zamanlı aktarma kullanır; aksi takdirde Android Talk kendi yerel STT/TTS döngüsünü kullanır.
- `realtime.brain`: `agent-consult` gerçek zamanlı araç çağrılarını Gateway ilkesi üzerinden yönlendirir; `direct-tools` eski doğrudan araç uyumluluğu davranışıdır; `none` transkripsiyon veya harici orkestrasyon içindir.
- `realtime.consultRouting`: `provider-direct`, sağlayıcı `openclaw_agent_consult` atladığında sağlayıcının doğrudan yanıtını korur; `force-agent-consult`, Gateway aktarmasının kesinleşmiş kullanıcı transkriptlerini bunun yerine OpenClaw üzerinden yönlendirmesini sağlar.
- `realtime.instructions`: sağlayıcıya dönük sistem talimatlarını OpenClaw'ın yerleşik gerçek zamanlı istemine ekler. Ses tarzı ve tonu için kullanın; OpenClaw varsayılan `openclaw_agent_consult` rehberliğini korur.
- `talk.catalog`, birinci taraf Talk istemcilerinin desteklenmeyen kombinasyonlardan kaçınabilmesi için her sağlayıcının geçerli modlarını, aktarımlarını, beyin stratejilerini, gerçek zamanlı ses biçimlerini ve yetenek bayraklarını sunar.
- Akışlı transkripsiyon sağlayıcıları `talk.catalog.transcription` üzerinden keşfedilir. Mevcut Gateway aktarması, özel Talk transkripsiyon yapılandırma yüzeyi eklenene kadar Voice Call akış sağlayıcısı yapılandırmasını kullanır.
- `speechLocale`: iOS/macOS üzerinde cihaz içi Talk konuşma tanıma için isteğe bağlı BCP 47 yerel ayar kimliği. Cihaz varsayılanını kullanmak için ayarlamadan bırakın.
- `outputFormat`: macOS/iOS üzerinde varsayılan olarak `pcm_44100`, Android üzerinde `pcm_24000` olur (MP3 akışını zorlamak için `mp3_*` ayarlayın)

## macOS kullanıcı arayüzü

- Menü çubuğu anahtarı: **Talk**
- Yapılandırma sekmesi: **Talk Modu** grubu (ses kimliği + kesinti anahtarı)
- Katman:
  - **Dinleme**: bulut mikrofon düzeyiyle nabız gibi atar
  - **Düşünme**: batma animasyonu
  - **Konuşma**: yayılan halkalar
  - Buluta tıkla: konuşmayı durdur
  - X'e tıkla: Talk modundan çık

## Android kullanıcı arayüzü

- Ses sekmesi anahtarı: **Talk**
- Manuel **Mic** ve **Talk**, karşılıklı dışlayıcı çalışma zamanı yakalama modlarıdır.
- Uygulama ön plandan ayrıldığında veya kullanıcı Ses sekmesinden ayrıldığında Manuel Mic durur.
- Talk Modu kapatılana veya Android düğümü bağlantıyı kesene kadar çalışmaya devam eder ve etkinken Android'in mikrofon ön plan hizmeti türünü kullanır.

## Notlar

- Konuşma + Mikrofon izinleri gerekir.
- Yerel Talk, etkin Gateway oturumunu kullanır ve yalnızca yanıt olayları kullanılamadığında geçmiş yoklamasına geri döner.
- Tarayıcı gerçek zamanlı Talk, sağlayıcının sahip olduğu tarayıcı oturumlarına `chat.send` açmak yerine `openclaw_agent_consult` için `talk.client.toolCall` kullanır.
- Yalnızca transkripsiyon Talk; `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` ve `talk.session.close` kullanır; istemciler kısmi/son transkript güncellemeleri için `talk.event` aboneliği yapar.
- Gateway, etkin Talk sağlayıcısını kullanarak Talk oynatmayı `talk.speak` üzerinden çözer. Android yalnızca bu RPC kullanılamadığında yerel sistem TTS'ye geri döner.
- macOS yerel MLX oynatma, varsa paketlenmiş `openclaw-mlx-tts` yardımcısını veya `PATH` üzerindeki bir yürütülebilir dosyayı kullanır. Geliştirme sırasında özel bir yardımcı ikiliye işaret etmek için `OPENCLAW_MLX_TTS_BIN` ayarlayın.
- `eleven_v3` için `stability`, `0.0`, `0.5` veya `1.0` olarak doğrulanır; diğer modeller `0..1` kabul eder.
- `latency_tier` ayarlandığında `0..4` olarak doğrulanır.
- Android, düşük gecikmeli AudioTrack akışı için `pcm_16000`, `pcm_22050`, `pcm_24000` ve `pcm_44100` çıktı biçimlerini destekler.

## İlgili

- [Sesle uyandırma](/tr/nodes/voicewake)
- [Ses ve sesli notlar](/tr/nodes/audio)
- [Medya anlama](/tr/nodes/media-understanding)
