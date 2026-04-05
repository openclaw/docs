---
read_when:
    - macOS/iOS/Android üzerinde Konuşma modu uygularken
    - Ses/TTS/kesme davranışını değiştirirken
summary: 'Konuşma modu: ElevenLabs TTS ile sürekli sesli konuşmalar'
title: Konuşma Modu
x-i18n:
    generated_at: "2026-04-05T13:58:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f10a3e9ee8fc2b4f7a89771d6e7b7373166a51ef9e9aa2d8c5ea67fc0729f9d
    source_path: nodes/talk.md
    workflow: 15
---

# Konuşma Modu

Konuşma modu, sürekli bir sesli konuşma döngüsüdür:

1. Konuşmayı dinle
2. Transkripti modele gönder (ana oturum, `chat.send`)
3. Yanıtı bekle
4. Bunu yapılandırılmış Konuşma sağlayıcısı üzerinden seslendir (`talk.speak`)

## Davranış (macOS)

- Konuşma modu etkinken **her zaman açık katman**.
- **Dinleme → Düşünme → Konuşma** aşama geçişleri.
- **Kısa bir duraklamada** (sessizlik penceresi), mevcut transkript gönderilir.
- Yanıtlar **WebChat'e yazılır** (yazıyormuşsunuz gibi aynı şekilde).
- **Konuşmada kesme** (varsayılan açık): kullanıcı, asistan konuşurken konuşmaya başlarsa oynatmayı durdururuz ve bir sonraki istem için kesme zaman damgasını not ederiz.

## Yanıtlardaki ses yönergeleri

Asistan, sesi denetlemek için yanıtını **tek bir JSON satırıyla** önekleyebilir:

```json
{ "voice": "<voice-id>", "once": true }
```

Kurallar:

- Yalnızca ilk boş olmayan satır.
- Bilinmeyen anahtarlar yok sayılır.
- `once: true` yalnızca mevcut yanıt için geçerlidir.
- `once` olmadan ses, Konuşma modu için yeni varsayılan olur.
- JSON satırı TTS oynatımından önce kaldırılır.

Desteklenen anahtarlar:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Config (`~/.openclaw/openclaw.json`)

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
- `silenceTimeoutMs`: ayarlanmadığında Konuşma, transkripti göndermeden önce platform varsayılan duraklama penceresini korur (`macOS ve Android'de 700 ms, iOS'ta 900 ms`)
- `voiceId`: `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` değerine geri düşer (veya API anahtarı varsa ilk ElevenLabs sesi)
- `modelId`: ayarlanmadığında varsayılan olarak `eleven_v3`
- `apiKey`: `ELEVENLABS_API_KEY` değerine geri düşer (veya varsa gateway kabuk profiline)
- `outputFormat`: varsayılan olarak macOS/iOS'ta `pcm_44100`, Android'de `pcm_24000` olur (MP3 akışını zorlamak için `mp3_*` ayarlayın)

## macOS UI

- Menü çubuğu anahtarı: **Konuş**
- Config sekmesi: **Konuşma Modu** grubu (ses kimliği + kesme anahtarı)
- Katman:
  - **Dinleme**: mikrofon düzeyiyle birlikte atımlı bulut
  - **Düşünme**: alçalan animasyon
  - **Konuşma**: yayılan halkalar
  - Buluta tıklayın: konuşmayı durdur
  - X'e tıklayın: Konuşma modundan çık

## Notlar

- Speech + Microphone izinleri gerektirir.
- `main` oturum anahtarına karşı `chat.send` kullanır.
- Gateway, etkin Konuşma sağlayıcısını kullanarak Konuşma oynatımını `talk.speak` üzerinden çözer. Android yalnızca bu RPC kullanılamadığında yerel sistem TTS'ine geri döner.
- `eleven_v3` için `stability`, `0.0`, `0.5` veya `1.0` olarak doğrulanır; diğer modeller `0..1` kabul eder.
- `latency_tier`, ayarlandığında `0..4` aralığında doğrulanır.
- Android, düşük gecikmeli AudioTrack akışı için `pcm_16000`, `pcm_22050`, `pcm_24000` ve `pcm_44100` çıktı biçimlerini destekler.
