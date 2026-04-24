---
read_when:
    - macOS/iOS/Android üzerinde Konuşma modunu uygulama
    - Ses/TTS/kesme davranışını değiştirme
summary: 'Talk modu: ElevenLabs TTS ile sürekli sesli konuşmalar'
title: Konuşma modu
x-i18n:
    generated_at: "2026-04-24T09:18:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

Konuşma modu, sürekli bir sesli konuşma döngüsüdür:

1. Konuşmayı dinle
2. Transkripti modele gönder (ana oturum, chat.send)
3. Yanıtı bekle
4. Yapılandırılmış Konuşma sağlayıcısı üzerinden seslendir (`talk.speak`)

## Davranış (macOS)

- Konuşma modu etkin olduğunda **her zaman açık yer paylaşımı**.
- **Dinleme → Düşünme → Konuşma** faz geçişleri.
- **Kısa bir duraklamada** (sessizlik penceresi), mevcut transkript gönderilir.
- Yanıtlar **WebChat'e yazılır** (yazmakla aynı şekilde).
- **Konuşmada kesme** (varsayılan açık): kullanıcı asistan konuşurken konuşmaya başlarsa oynatmayı durdururuz ve sonraki istem için kesme zaman damgasını not ederiz.

## Yanıtlardaki ses yönergeleri

Asistan, sesi denetlemek için yanıtının başına **tek bir JSON satırı** ekleyebilir:

```json
{ "voice": "<voice-id>", "once": true }
```

Kurallar:

- Yalnızca ilk boş olmayan satır.
- Bilinmeyen anahtarlar yok sayılır.
- `once: true` yalnızca geçerli yanıta uygulanır.
- `once` olmadan ses, Konuşma modu için yeni varsayılan olur.
- JSON satırı TTS oynatmasından önce çıkarılır.

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
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Varsayılanlar:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: ayarlanmadığında Konuşma, transkripti göndermeden önce platformun varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)
- `voiceId`: `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` değerine geri düşer (veya API anahtarı varsa ilk ElevenLabs sesi)
- `modelId`: ayarlanmadığında varsayılan `eleven_v3`
- `apiKey`: `ELEVENLABS_API_KEY` değerine geri düşer (veya varsa Gateway shell profili)
- `outputFormat`: varsayılan olarak macOS/iOS'ta `pcm_44100`, Android'de `pcm_24000` kullanır (MP3 akışını zorlamak için `mp3_*` ayarlayın)

## macOS UI

- Menü çubuğu anahtarı: **Talk**
- Yapılandırma sekmesi: **Talk Mode** grubu (ses kimliği + kesme anahtarı)
- Yer paylaşımı:
  - **Listening**: mikrofon düzeyiyle atımlayan bulut
  - **Thinking**: aşağı çöken animasyon
  - **Speaking**: yayılan halkalar
  - Buluta tıkla: konuşmayı durdur
  - X'e tıkla: Konuşma modundan çık

## Notlar

- Konuşma + Mikrofon izinleri gerektirir.
- `main` oturum anahtarına karşı `chat.send` kullanır.
- Gateway, Konuşma oynatmasını etkin Talk sağlayıcısını kullanarak `talk.speak` üzerinden çözümler. Android yalnızca bu RPC mevcut değilse yerel sistem TTS'ine geri düşer.
- `eleven_v3` için `stability`, `0.0`, `0.5` veya `1.0` olarak doğrulanır; diğer modeller `0..1` kabul eder.
- `latency_tier`, ayarlanmışsa `0..4` aralığında doğrulanır.
- Android, düşük gecikmeli AudioTrack akışı için `pcm_16000`, `pcm_22050`, `pcm_24000` ve `pcm_44100` çıktı biçimlerini destekler.

## İlgili

- [Sesle uyandırma](/tr/nodes/voicewake)
- [Ses ve sesli notlar](/tr/nodes/audio)
- [Medya anlama](/tr/nodes/media-understanding)
