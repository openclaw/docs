---
read_when:
    - Mengimplementasikan mode Bicara di macOS/iOS/Android
    - Mengubah perilaku suara/TTS/interupsi
summary: 'Mode bicara: percakapan suara berkelanjutan di seluruh STT/TTS lokal dan suara waktu nyata'
title: Mode bicara
x-i18n:
    generated_at: "2026-05-06T09:18:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

Mode Talk memiliki dua bentuk runtime:

- Talk native macOS/iOS/Android menggunakan pengenalan suara lokal, chat Gateway, dan TTS `talk.speak`. Node mengiklankan kapabilitas `talk` dan mendeklarasikan perintah `talk.*` yang didukung.
- Talk browser menggunakan `talk.client.create` untuk sesi `webrtc` dan `provider-websocket` yang dimiliki klien, atau `talk.session.create` untuk sesi `gateway-relay` yang dimiliki Gateway. `managed-room` dicadangkan untuk handoff Gateway dan ruang walkie-talkie.
- Klien khusus transkripsi menggunakan `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, lalu `talk.session.appendAudio`, `talk.session.cancelTurn`, dan `talk.session.close` saat membutuhkan caption atau dikte tanpa respons suara asisten.

Talk native adalah loop percakapan suara berkelanjutan:

1. Dengarkan ucapan
2. Kirim transkrip ke model melalui sesi aktif
3. Tunggu respons
4. Ucapkan melalui penyedia Talk yang dikonfigurasi (`talk.speak`)

Talk realtime browser meneruskan pemanggilan tool penyedia melalui `talk.client.toolCall`; klien browser tidak memanggil `chat.send` secara langsung untuk konsultasi realtime.

Talk khusus transkripsi memancarkan envelope peristiwa Talk umum yang sama seperti sesi realtime dan STT/TTS, tetapi menggunakan `mode: "transcription"` dan `brain: "none"`. Ini ditujukan untuk caption, dikte, dan penangkapan ucapan hanya-observasi; catatan suara unggahan sekali pakai tetap menggunakan jalur media/audio.

## Perilaku (macOS)

- **Overlay selalu aktif** saat mode Talk diaktifkan.
- Transisi fase **Mendengarkan → Berpikir → Berbicara**.
- Pada **jeda singkat** (jendela hening), transkrip saat ini dikirim.
- Balasan **ditulis ke WebChat** (sama seperti mengetik).
- **Interupsi saat ada ucapan** (aktif secara default): jika pengguna mulai berbicara saat asisten sedang berbicara, kami menghentikan pemutaran dan mencatat timestamp interupsi untuk prompt berikutnya.

## Direktif suara dalam balasan

Asisten dapat memberi prefix balasannya dengan **satu baris JSON** untuk mengontrol suara:

```json
{ "voice": "<voice-id>", "once": true }
```

Aturan:

- Hanya baris tidak kosong pertama.
- Kunci yang tidak dikenal diabaikan.
- `once: true` hanya berlaku untuk balasan saat ini.
- Tanpa `once`, suara menjadi default baru untuk mode Talk.
- Baris JSON dihapus sebelum pemutaran TTS.

Kunci yang didukung:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Konfigurasi (`~/.openclaw/openclaw.json`)

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

Default:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: saat tidak disetel, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: memilih penyedia Talk aktif. Gunakan `elevenlabs`, `mlx`, atau `system` untuk jalur pemutaran lokal macOS.
- `providers.<provider>.voiceId`: fallback ke `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` untuk ElevenLabs (atau suara ElevenLabs pertama saat kunci API tersedia).
- `providers.elevenlabs.modelId`: default ke `eleven_v3` saat tidak disetel.
- `providers.mlx.modelId`: default ke `mlx-community/Soprano-80M-bf16` saat tidak disetel.
- `providers.elevenlabs.apiKey`: fallback ke `ELEVENLABS_API_KEY` (atau profil shell gateway jika tersedia).
- `realtime.provider`: memilih penyedia suara realtime browser/server aktif. Gunakan `openai` untuk WebRTC, `google` untuk WebSocket penyedia, atau penyedia khusus bridge melalui relay Gateway.
- `realtime.providers.<provider>` menyimpan konfigurasi realtime yang dimiliki penyedia. Browser hanya menerima kredensial sesi ephemeral atau terbatas, tidak pernah kunci API standar.
- `realtime.brain`: `agent-consult` merutekan pemanggilan tool realtime melalui kebijakan Gateway; `direct-tools` adalah perilaku kompatibilitas khusus pemilik; `none` untuk transkripsi atau orkestrasi eksternal.
- `talk.catalog` mengekspos mode valid, transport, strategi brain, format audio realtime, dan flag kapabilitas setiap penyedia sehingga klien Talk pihak pertama dapat menghindari kombinasi yang tidak didukung.
- Penyedia transkripsi streaming ditemukan melalui `talk.catalog.transcription`. Relay Gateway saat ini menggunakan konfigurasi penyedia streaming Voice Call sampai permukaan konfigurasi transkripsi Talk khusus ditambahkan.
- `speechLocale`: id lokal BCP 47 opsional untuk pengenalan ucapan Talk di perangkat pada iOS/macOS. Biarkan tidak disetel untuk menggunakan default perangkat.
- `outputFormat`: default ke `pcm_44100` pada macOS/iOS dan `pcm_24000` pada Android (setel `mp3_*` untuk memaksa streaming MP3)

## UI macOS

- Toggle bilah menu: **Talk**
- Tab konfigurasi: grup **Mode Talk** (id suara + toggle interupsi)
- Overlay:
  - **Mendengarkan**: cloud berdenyut mengikuti level mikrofon
  - **Berpikir**: animasi tenggelam
  - **Berbicara**: cincin yang memancar
  - Klik cloud: hentikan berbicara
  - Klik X: keluar dari mode Talk

## UI Android

- Toggle tab Suara: **Talk**
- **Mikrofon** manual dan **Talk** adalah mode penangkapan runtime yang saling eksklusif.
- Mikrofon manual berhenti saat aplikasi meninggalkan foreground atau pengguna meninggalkan tab Suara.
- Mode Talk tetap berjalan sampai dinonaktifkan atau node Android terputus, dan menggunakan tipe foreground-service mikrofon Android saat aktif.

## Catatan

- Memerlukan izin Ucapan + Mikrofon.
- Talk native menggunakan sesi Gateway aktif dan hanya fallback ke polling riwayat saat peristiwa respons tidak tersedia.
- Talk realtime browser menggunakan `talk.client.toolCall` untuk `openclaw_agent_consult`, bukan mengekspos `chat.send` ke sesi browser yang dimiliki penyedia.
- Talk khusus transkripsi menggunakan `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn`, dan `talk.session.close`; klien berlangganan ke `talk.event` untuk pembaruan transkrip sebagian/final.
- Gateway menyelesaikan pemutaran Talk melalui `talk.speak` menggunakan penyedia Talk aktif. Android fallback ke TTS sistem lokal hanya saat RPC tersebut tidak tersedia.
- Pemutaran MLX lokal macOS menggunakan helper `openclaw-mlx-tts` yang dibundel saat tersedia, atau executable di `PATH`. Setel `OPENCLAW_MLX_TTS_BIN` untuk menunjuk ke biner helper kustom selama pengembangan.
- `stability` untuk `eleven_v3` divalidasi ke `0.0`, `0.5`, atau `1.0`; model lain menerima `0..1`.
- `latency_tier` divalidasi ke `0..4` saat disetel.
- Android mendukung format output `pcm_16000`, `pcm_22050`, `pcm_24000`, dan `pcm_44100` untuk streaming AudioTrack latensi rendah.

## Terkait

- [Voice wake](/id/nodes/voicewake)
- [Audio dan catatan suara](/id/nodes/audio)
- [Pemahaman media](/id/nodes/media-understanding)
