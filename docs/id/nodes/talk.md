---
read_when:
    - Menerapkan mode Bicara di macOS/iOS/Android
    - Mengubah perilaku suara/TTS/interupsi
summary: 'Mode bicara: percakapan suara berkelanjutan melalui STT/TTS lokal dan suara real-time'
title: Mode bicara
x-i18n:
    generated_at: "2026-05-10T19:41:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 28e5feae8af8ff89472dfb73c44c590b2f7fab3c0ca335b67603c7fd9d50dfe7
    source_path: nodes/talk.md
    workflow: 16
---

Mode Talk memiliki dua bentuk runtime:

- Talk macOS/iOS/Android native menggunakan pengenalan suara lokal, chat Gateway, dan TTS `talk.speak`. Node mengiklankan kapabilitas `talk` dan mendeklarasikan perintah `talk.*` yang didukung.
- Talk browser menggunakan `talk.client.create` untuk sesi `webrtc` dan `provider-websocket` yang dimiliki klien, atau `talk.session.create` untuk sesi `gateway-relay` yang dimiliki Gateway. `managed-room` dicadangkan untuk handoff Gateway dan ruang walkie-talkie.
- Klien khusus transkripsi menggunakan `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, lalu `talk.session.appendAudio`, `talk.session.cancelTurn`, dan `talk.session.close` ketika mereka membutuhkan teks layar atau dikte tanpa respons suara asisten.

Talk native adalah loop percakapan suara berkelanjutan:

1. Mendengarkan ucapan
2. Mengirim transkrip ke model melalui sesi aktif
3. Menunggu respons
4. Mengucapkannya melalui penyedia Talk yang dikonfigurasi (`talk.speak`)

Talk realtime browser meneruskan panggilan tool penyedia melalui `talk.client.toolCall`; klien browser tidak memanggil `chat.send` secara langsung untuk konsultasi realtime.

Talk khusus transkripsi memancarkan amplop event Talk umum yang sama seperti sesi realtime dan STT/TTS, tetapi menggunakan `mode: "transcription"` dan `brain: "none"`. Ini ditujukan untuk teks layar, dikte, dan tangkapan suara hanya-observasi; catatan suara unggahan sekali jalan tetap menggunakan jalur media/audio.

## Perilaku (macOS)

- **Overlay selalu aktif** saat mode Talk diaktifkan.
- Transisi fase **Mendengarkan → Berpikir → Berbicara**.
- Saat ada **jeda singkat** (jendela hening), transkrip saat ini dikirim.
- Balasan **ditulis ke WebChat** (sama seperti mengetik).
- **Interupsi saat ada ucapan** (aktif secara default): jika pengguna mulai berbicara saat asisten sedang berbicara, kami menghentikan pemutaran dan mencatat timestamp interupsi untuk prompt berikutnya.

## Direktif suara dalam balasan

Asisten dapat mengawali balasannya dengan **satu baris JSON** untuk mengontrol suara:

```json
{ "voice": "<voice-id>", "once": true }
```

Aturan:

- Hanya baris pertama yang tidak kosong.
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

Default:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: saat tidak diatur, Talk mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: memilih penyedia Talk aktif. Gunakan `elevenlabs`, `mlx`, atau `system` untuk jalur pemutaran lokal macOS.
- `providers.<provider>.voiceId`: fallback ke `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` untuk ElevenLabs (atau suara ElevenLabs pertama saat kunci API tersedia).
- `providers.elevenlabs.modelId`: default ke `eleven_v3` saat tidak diatur.
- `providers.mlx.modelId`: default ke `mlx-community/Soprano-80M-bf16` saat tidak diatur.
- `providers.elevenlabs.apiKey`: fallback ke `ELEVENLABS_API_KEY` (atau profil shell Gateway jika tersedia).
- `consultThinkingLevel`: override tingkat berpikir opsional untuk jalannya agen OpenClaw penuh di balik panggilan realtime `openclaw_agent_consult`.
- `consultFastMode`: override mode cepat opsional untuk panggilan realtime `openclaw_agent_consult`.
- `realtime.provider`: memilih penyedia suara realtime browser/server aktif. Gunakan `openai` untuk WebRTC, `google` untuk WebSocket penyedia, atau penyedia khusus bridge melalui relay Gateway.
- `realtime.providers.<provider>` menyimpan konfigurasi realtime yang dimiliki penyedia. Browser hanya menerima kredensial sesi ephemeral atau terbatas, tidak pernah kunci API standar.
- `realtime.providers.openai.voice`: id suara OpenAI Realtime bawaan. Suara `gpt-realtime-2` saat ini adalah `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, dan `cedar`; `marin` dan `cedar` direkomendasikan untuk kualitas terbaik.
- `realtime.brain`: `agent-consult` merutekan panggilan tool realtime melalui kebijakan Gateway; `direct-tools` adalah perilaku kompatibilitas khusus pemilik; `none` untuk transkripsi atau orkestrasi eksternal.
- `realtime.instructions`: menambahkan instruksi sistem yang menghadap penyedia ke prompt realtime bawaan OpenClaw. Gunakan ini untuk gaya dan nada suara; OpenClaw mempertahankan panduan default `openclaw_agent_consult`.
- `talk.catalog` mengekspos mode valid, transport, strategi brain, format audio realtime, dan flag kapabilitas setiap penyedia agar klien Talk pihak pertama dapat menghindari kombinasi yang tidak didukung.
- Penyedia transkripsi streaming ditemukan melalui `talk.catalog.transcription`. Relay Gateway saat ini menggunakan konfigurasi penyedia streaming Voice Call hingga permukaan konfigurasi transkripsi Talk khusus ditambahkan.
- `speechLocale`: id locale BCP 47 opsional untuk pengenalan suara Talk di perangkat pada iOS/macOS. Biarkan tidak diatur untuk menggunakan default perangkat.
- `outputFormat`: default ke `pcm_44100` di macOS/iOS dan `pcm_24000` di Android (atur `mp3_*` untuk memaksa streaming MP3)

## UI macOS

- Toggle bilah menu: **Talk**
- Tab konfigurasi: grup **Mode Talk** (id suara + toggle interupsi)
- Overlay:
  - **Mendengarkan**: awan berdenyut sesuai level mikrofon
  - **Berpikir**: animasi tenggelam
  - **Berbicara**: cincin memancar
  - Klik awan: hentikan berbicara
  - Klik X: keluar dari mode Talk

## UI Android

- Toggle tab suara: **Talk**
- **Mic** manual dan **Talk** adalah mode tangkapan runtime yang saling eksklusif.
- Mic manual berhenti saat aplikasi meninggalkan foreground atau pengguna meninggalkan tab Suara.
- Mode Talk terus berjalan hingga dimatikan atau node Android terputus, dan menggunakan tipe foreground-service mikrofon Android saat aktif.

## Catatan

- Memerlukan izin Speech + Microphone.
- Talk native menggunakan sesi Gateway aktif dan hanya fallback ke polling riwayat saat event respons tidak tersedia.
- Talk realtime browser menggunakan `talk.client.toolCall` untuk `openclaw_agent_consult`, alih-alih mengekspos `chat.send` ke sesi browser yang dimiliki penyedia.
- Talk khusus transkripsi menggunakan `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn`, dan `talk.session.close`; klien berlangganan ke `talk.event` untuk pembaruan transkrip parsial/final.
- Gateway menyelesaikan pemutaran Talk melalui `talk.speak` menggunakan penyedia Talk aktif. Android fallback ke TTS sistem lokal hanya saat RPC tersebut tidak tersedia.
- Pemutaran MLX lokal macOS menggunakan helper `openclaw-mlx-tts` bawaan saat ada, atau executable pada `PATH`. Atur `OPENCLAW_MLX_TTS_BIN` agar menunjuk ke binary helper kustom selama pengembangan.
- `stability` untuk `eleven_v3` divalidasi ke `0.0`, `0.5`, atau `1.0`; model lain menerima `0..1`.
- `latency_tier` divalidasi ke `0..4` saat diatur.
- Android mendukung format output `pcm_16000`, `pcm_22050`, `pcm_24000`, dan `pcm_44100` untuk streaming AudioTrack latensi rendah.

## Terkait

- [Wake suara](/id/nodes/voicewake)
- [Audio dan catatan suara](/id/nodes/audio)
- [Pemahaman media](/id/nodes/media-understanding)
