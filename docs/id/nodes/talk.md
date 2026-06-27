---
read_when:
    - Mengimplementasikan mode Bicara di macOS/iOS/Android
    - Mengubah perilaku suara/TTS/interupsi
summary: 'Mode bicara: percakapan suara berkelanjutan melalui STT/TTS lokal dan suara real-time'
title: Mode bicara
x-i18n:
    generated_at: "2026-06-27T17:40:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

Mode Talk memiliki dua bentuk runtime:

- Talk native macOS/iOS/Android menggunakan pengenalan suara lokal, chat Gateway, dan TTS `talk.speak`. Node mengiklankan kemampuan `talk` dan mendeklarasikan perintah `talk.*` yang mereka dukung.
- Talk Browser menggunakan `talk.client.create` untuk sesi `webrtc` dan `provider-websocket` yang dimiliki klien, atau `talk.session.create` untuk sesi `gateway-relay` yang dimiliki Gateway. `managed-room` dicadangkan untuk handoff Gateway dan ruang walkie-talkie.
- Talk Android dapat memilih sesi relay real-time yang dimiliki Gateway dengan `talk.realtime.mode: "realtime"` dan `talk.realtime.transport: "gateway-relay"`. Jika tidak, ia tetap menggunakan pengenalan suara native, chat Gateway, dan `talk.speak`.
- Klien khusus transkripsi menggunakan `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, lalu `talk.session.appendAudio`, `talk.session.cancelTurn`, dan `talk.session.close` saat mereka memerlukan teks atau dikte tanpa respons suara asisten.

Talk native adalah loop percakapan suara berkelanjutan:

1. Dengarkan ucapan
2. Kirim transkrip ke model melalui sesi aktif
3. Tunggu respons
4. Ucapkan melalui penyedia Talk yang dikonfigurasi (`talk.speak`)

Talk real-time browser meneruskan panggilan alat penyedia melalui `talk.client.toolCall`; klien browser tidak memanggil `chat.send` secara langsung untuk konsultasi real-time.
Saat konsultasi real-time aktif, klien Talk dapat menggunakan `talk.client.steer` atau
`talk.session.steer` untuk mengklasifikasikan input lisan sebagai `status`, `steer`, `cancel`, atau
`followup`. Steering yang diterima diantrekan ke dalam run tersemat aktif; steering yang ditolak
mengembalikan alasan terstruktur seperti `no_active_run`, `not_streaming`,
atau `compacting`.

Talk khusus transkripsi memancarkan envelope peristiwa Talk umum yang sama seperti sesi real-time dan STT/TTS, tetapi menggunakan `mode: "transcription"` dan `brain: "none"`. Ini ditujukan untuk teks, dikte, dan penangkapan ucapan hanya-observasi; catatan suara unggahan sekali pakai tetap menggunakan jalur media/audio.

## Perilaku (macOS)

- **Overlay selalu aktif** saat mode Talk diaktifkan.
- Transisi fase **Mendengarkan → Berpikir → Berbicara**.
- Pada **jeda singkat** (jendela hening), transkrip saat ini dikirim.
- Balasan **ditulis ke WebChat** (sama seperti mengetik).
- **Interupsi saat berbicara** (aktif secara default): jika pengguna mulai berbicara saat asisten sedang berbicara, kami menghentikan pemutaran dan mencatat timestamp interupsi untuk prompt berikutnya.

## Direktif suara dalam balasan

Asisten dapat mengawali balasannya dengan **satu baris JSON** untuk mengontrol suara:

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
- `providers.elevenlabs.apiKey`: fallback ke `ELEVENLABS_API_KEY` (atau profil shell gateway jika tersedia).
- `consultThinkingLevel`: override tingkat berpikir opsional untuk run agen OpenClaw penuh di balik panggilan `openclaw_agent_consult` real-time.
- `consultFastMode`: override mode cepat opsional untuk panggilan `openclaw_agent_consult` real-time.
- `realtime.provider`: memilih penyedia suara real-time browser/server yang aktif. Gunakan `openai` untuk WebRTC, `google` untuk WebSocket penyedia, atau penyedia khusus bridge melalui relay Gateway.
- `realtime.providers.<provider>` menyimpan konfigurasi real-time milik penyedia. Browser hanya menerima kredensial sesi sementara atau terbatas, tidak pernah kunci API standar.
- `realtime.providers.openai.voice`: id suara OpenAI Realtime bawaan. Suara `gpt-realtime-2` saat ini adalah `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, dan `cedar`; `marin` dan `cedar` direkomendasikan untuk kualitas terbaik.
- `realtime.transport`: `webrtc` dan `provider-websocket` adalah transport real-time browser. Android menggunakan relay real-time hanya saat nilainya `gateway-relay`; jika tidak, Talk Android menggunakan loop STT/TTS native-nya.
- `realtime.brain`: `agent-consult` merutekan panggilan alat real-time melalui kebijakan Gateway; `direct-tools` adalah perilaku kompatibilitas alat langsung lama; `none` ditujukan untuk transkripsi atau orkestrasi eksternal.
- `realtime.consultRouting`: `provider-direct` mempertahankan balasan langsung penyedia saat ia melewati `openclaw_agent_consult`; `force-agent-consult` membuat relay Gateway merutekan transkrip pengguna yang telah difinalkan melalui OpenClaw sebagai gantinya.
- `realtime.instructions`: menambahkan instruksi sistem yang menghadap penyedia ke prompt real-time bawaan OpenClaw. Gunakan ini untuk gaya dan nada suara; OpenClaw mempertahankan panduan default `openclaw_agent_consult`.
- `talk.catalog` mengekspos mode valid, transport, strategi brain, format audio real-time, dan flag kemampuan setiap penyedia agar klien Talk pihak pertama dapat menghindari kombinasi yang tidak didukung.
- Penyedia transkripsi streaming ditemukan melalui `talk.catalog.transcription`. Relay Gateway saat ini menggunakan konfigurasi penyedia streaming Voice Call hingga permukaan konfigurasi transkripsi Talk khusus ditambahkan.
- `speechLocale`: id lokal BCP 47 opsional untuk pengenalan suara Talk pada perangkat di iOS/macOS. Biarkan tidak diatur untuk menggunakan default perangkat.
- `outputFormat`: default ke `pcm_44100` di macOS/iOS dan `pcm_24000` di Android (atur `mp3_*` untuk memaksa streaming MP3)

## UI macOS

- Toggle bilah menu: **Talk**
- Tab konfigurasi: grup **Mode Talk** (id suara + toggle interupsi)
- Overlay:
  - **Mendengarkan**: cloud berdenyut mengikuti level mikrofon
  - **Berpikir**: animasi turun
  - **Berbicara**: cincin memancar
  - Klik cloud: berhenti berbicara
  - Klik X: keluar dari mode Talk

## UI Android

- Toggle tab Suara: **Talk**
- **Mic** manual dan **Talk** adalah mode penangkapan runtime yang saling eksklusif.
- Mic manual berhenti saat aplikasi meninggalkan foreground atau pengguna meninggalkan tab Suara.
- Mode Talk tetap berjalan hingga dimatikan atau Node Android terputus, dan menggunakan tipe foreground-service mikrofon Android saat aktif.

## Catatan

- Memerlukan izin Ucapan + Mikrofon.
- Talk native menggunakan sesi Gateway aktif dan hanya fallback ke polling riwayat saat peristiwa respons tidak tersedia.
- Talk real-time browser menggunakan `talk.client.toolCall` untuk `openclaw_agent_consult`, alih-alih mengekspos `chat.send` ke sesi browser milik penyedia.
- Talk khusus transkripsi menggunakan `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn`, dan `talk.session.close`; klien berlangganan ke `talk.event` untuk pembaruan transkrip parsial/final.
- Gateway menyelesaikan pemutaran Talk melalui `talk.speak` menggunakan penyedia Talk aktif. Android fallback ke TTS sistem lokal hanya saat RPC tersebut tidak tersedia.
- Pemutaran MLX lokal macOS menggunakan helper `openclaw-mlx-tts` bawaan saat tersedia, atau executable di `PATH`. Atur `OPENCLAW_MLX_TTS_BIN` agar mengarah ke binary helper kustom selama pengembangan.
- `stability` untuk `eleven_v3` divalidasi ke `0.0`, `0.5`, atau `1.0`; model lain menerima `0..1`.
- `latency_tier` divalidasi ke `0..4` saat diatur.
- Android mendukung format output `pcm_16000`, `pcm_22050`, `pcm_24000`, dan `pcm_44100` untuk streaming AudioTrack latensi rendah.

## Terkait

- [Voice wake](/id/nodes/voicewake)
- [Audio dan catatan suara](/id/nodes/audio)
- [Pemahaman media](/id/nodes/media-understanding)
