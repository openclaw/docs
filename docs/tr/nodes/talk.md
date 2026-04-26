---
read_when:
    - Talk modunu macOS/iOS/Android üzerinde uygulama
    - Ses/TTS/kesme davranışını değiştirme
summary: 'Konuşma modu: yapılandırılmış TTS sağlayıcılarıyla sürekli sesli konuşmalar'
title: Konuşma modu
x-i18n:
    generated_at: "2026-04-26T11:35:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

Konuşma modu, sürekli bir sesli konuşma döngüsüdür:

1. Konuşmayı dinle
2. Transkripti modele gönder (ana oturum, chat.send)
3. Yanıtı bekle
4. Yapılandırılmış Konuşma sağlayıcısı üzerinden seslendir (`talk.speak`)

## Davranış (macOS)

- Konuşma modu etkinken **her zaman açık katman**.
- **Dinleme → Düşünme → Konuşma** aşama geçişleri.
- **Kısa bir duraklamada** (sessizlik penceresi), mevcut transkript gönderilir.
- Yanıtlar **WebChat'e yazılır** (yazı yazar gibi aynı şekilde).
- **Konuşmada kesme** (varsayılan açık): kullanıcı, asistan konuşurken konuşmaya başlarsa oynatmayı durdururuz ve sonraki istem için kesinti zaman damgasını not ederiz.

## Yanıtlardaki ses yönergeleri

Asistan, sesi kontrol etmek için yanıtının başına **tek bir JSON satırı** ekleyebilir:

```json
{ "voice": "<voice-id>", "once": true }
```

Kurallar:

- Yalnızca ilk boş olmayan satır.
- Bilinmeyen anahtarlar yok sayılır.
- `once: true` yalnızca mevcut yanıta uygulanır.
- `once` olmadan ses, Konuşma modu için yeni varsayılan olur.
- JSON satırı, TTS oynatımından önce çıkarılır.

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
  },
}
```

Varsayılanlar:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: ayarlanmadığında Konuşma, transkripti göndermeden önce platform varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)
- `provider`: etkin Konuşma sağlayıcısını seçer. macOS yerel oynatma yolları için `elevenlabs`, `mlx` veya `system` kullanın.
- `providers.<provider>.voiceId`: ElevenLabs için `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` değerine geri döner (veya API anahtarı mevcut olduğunda ilk ElevenLabs sesi).
- `providers.elevenlabs.modelId`: ayarlanmadığında varsayılan `eleven_v3` olur.
- `providers.mlx.modelId`: ayarlanmadığında varsayılan `mlx-community/Soprano-80M-bf16` olur.
- `providers.elevenlabs.apiKey`: `ELEVENLABS_API_KEY` değerine geri döner (veya varsa Gateway shell profiline).
- `speechLocale`: iOS/macOS üzerinde cihaz içi Konuşma konuşma tanıma için isteğe bağlı BCP 47 yerel kimliği. Cihaz varsayılanını kullanmak için boş bırakın.
- `outputFormat`: varsayılan olarak macOS/iOS'ta `pcm_44100`, Android'de `pcm_24000` kullanılır (MP3 akışını zorlamak için `mp3_*` ayarlayın)

## macOS kullanıcı arayüzü

- Menü çubuğu düğmesi: **Talk**
- Yapılandırma sekmesi: **Talk Mode** grubu (ses kimliği + kesme düğmesi)
- Katman:
  - **Listening**: bulut mikrofon seviyesiyle nabız gibi atar
  - **Thinking**: çökme animasyonu
  - **Speaking**: yayılan halkalar
  - Buluta tıklayın: konuşmayı durdur
  - X'e tıklayın: Konuşma modundan çık

## Android kullanıcı arayüzü

- Ses sekmesi düğmesi: **Talk**
- Manuel **Mic** ve **Talk**, çalışma zamanında birbirini dışlayan yakalama modlarıdır.
- Manuel Mic, uygulama ön plandan çıktığında veya kullanıcı Ses sekmesinden ayrıldığında durur.
- Konuşma Modu, kapatılana veya Android Node bağlantısı kesilene kadar çalışmaya devam eder ve etkinken Android'in mikrofon foreground-service türünü kullanır.

## Notlar

- Speech + Microphone izinleri gerektirir.
- `main` oturum anahtarına karşı `chat.send` kullanır.
- Gateway, etkin Konuşma sağlayıcısını kullanarak Konuşma oynatımını `talk.speak` üzerinden çözümler. Android, yalnızca bu RPC kullanılamadığında yerel sistem TTS'sine geri döner.
- macOS yerel MLX oynatımı, varsa paketlenmiş `openclaw-mlx-tts` yardımcısını veya `PATH` üzerindeki bir yürütülebilir dosyayı kullanır. Geliştirme sırasında özel bir yardımcı ikili dosyasına işaret etmek için `OPENCLAW_MLX_TTS_BIN` ayarlayın.
- `eleven_v3` için `stability`, `0.0`, `0.5` veya `1.0` olarak doğrulanır; diğer modeller `0..1` kabul eder.
- `latency_tier`, ayarlandığında `0..4` olarak doğrulanır.
- Android, düşük gecikmeli AudioTrack akışı için `pcm_16000`, `pcm_22050`, `pcm_24000` ve `pcm_44100` çıktı biçimlerini destekler.

## İlgili

- [Sesle uyandırma](/tr/nodes/voicewake)
- [Ses ve sesli notlar](/tr/nodes/audio)
- [Medya anlama](/tr/nodes/media-understanding)
