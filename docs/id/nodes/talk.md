---
read_when:
    - Mengimplementasikan mode Bicara di macOS/iOS/Android
    - Mengubah perilaku suara/TTS/interupsi
summary: 'Mode bicara: percakapan lisan berkelanjutan melalui STT/TTS lokal dan suara realtime'
title: Mode bicara
x-i18n:
    generated_at: "2026-07-03T09:58:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9c8cdb6ffef7575348e94b36cd73a0613c336d8e811d6ce46d7518ee7c34b14
    source_path: nodes/talk.md
    workflow: 16
---

Mode Bicara memiliki dua bentuk runtime:

- Bicara native macOS/iOS/Android menggunakan pengenalan suara lokal, chat Gateway, dan TTS `talk.speak`. Node mengiklankan kapabilitas `talk` dan mendeklarasikan perintah `talk.*` yang didukungnya.
- Bicara iOS menggunakan WebRTC milik klien untuk konfigurasi realtime OpenAI yang memilih `webrtc` atau tidak menyertakan transport. Konfigurasi realtime eksplisit `gateway-relay`, `provider-websocket`, dan non-OpenAI tetap berada pada relay milik Gateway; konfigurasi non-realtime menggunakan loop suara native.
- Bicara Browser menggunakan `talk.client.create` untuk sesi `webrtc` dan `provider-websocket` milik klien, atau `talk.session.create` untuk sesi `gateway-relay` milik Gateway. `managed-room` dicadangkan untuk handoff Gateway dan ruang walkie-talkie.
- Bicara Android dapat memilih sesi relay realtime milik Gateway dengan `talk.realtime.mode: "realtime"` dan `talk.realtime.transport: "gateway-relay"`. Jika tidak, ia tetap menggunakan pengenalan suara native, chat Gateway, dan `talk.speak`.
- Klien khusus transkripsi menggunakan `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, lalu `talk.session.appendAudio`, `talk.session.cancelTurn`, dan `talk.session.close` saat memerlukan caption atau dikte tanpa respons suara asisten.

Bicara native adalah loop percakapan suara berkelanjutan:

1. Dengarkan ucapan
2. Kirim transkrip ke model melalui sesi aktif
3. Tunggu respons
4. Ucapkan melalui penyedia Bicara yang dikonfigurasi (`talk.speak`)

Bicara realtime milik klien meneruskan panggilan tool penyedia melalui `talk.client.toolCall`; klien tersebut tidak memanggil `chat.send` secara langsung untuk konsultasi realtime.
Saat konsultasi realtime aktif, klien Bicara dapat menggunakan `talk.client.steer` atau
`talk.session.steer` untuk mengklasifikasikan input lisan sebagai `status`, `steer`, `cancel`, atau
`followup`. Pengarahan yang diterima diantrekan ke dalam run tertanam yang aktif; pengarahan yang ditolak
mengembalikan alasan terstruktur seperti `no_active_run`, `not_streaming`,
atau `compacting`.

Bicara khusus transkripsi memancarkan envelope peristiwa Bicara umum yang sama seperti sesi realtime dan STT/TTS, tetapi menggunakan `mode: "transcription"` dan `brain: "none"`. Ini ditujukan untuk caption, dikte, dan penangkapan suara hanya-observasi; catatan suara unggahan sekali jalan tetap menggunakan jalur media/audio.

## Perilaku (macOS)

- **Overlay selalu aktif** saat mode Bicara diaktifkan.
- Transisi fase **Mendengarkan → Berpikir → Berbicara**.
- Pada **jeda singkat** (jendela hening), transkrip saat ini dikirim.
- Balasan **ditulis ke WebChat** (sama seperti mengetik).
- **Interupsi saat ada ucapan** (aktif secara default): jika pengguna mulai berbicara saat asisten sedang berbicara, kami menghentikan pemutaran dan mencatat timestamp interupsi untuk prompt berikutnya.

## Direktif suara dalam balasan

Asisten dapat memberi prefiks balasannya dengan **satu baris JSON** untuk mengontrol suara:

```json
{ "voice": "<voice-id>", "once": true }
```

Aturan:

- Hanya baris non-kosong pertama.
- Kunci yang tidak dikenal diabaikan.
- `once: true` hanya berlaku untuk balasan saat ini.
- Tanpa `once`, suara menjadi default baru untuk mode Bicara.
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
- `silenceTimeoutMs`: saat tidak diatur, Bicara mempertahankan jendela jeda default platform sebelum mengirim transkrip (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: memilih penyedia Bicara aktif. Gunakan `elevenlabs`, `mlx`, atau `system` untuk jalur pemutaran lokal macOS.
- `providers.<provider>.voiceId`: fallback ke `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` untuk ElevenLabs (atau suara ElevenLabs pertama saat kunci API tersedia).
- `providers.elevenlabs.modelId`: default ke `eleven_v3` saat tidak diatur.
- `providers.mlx.modelId`: default ke `mlx-community/Soprano-80M-bf16` saat tidak diatur.
- `providers.elevenlabs.apiKey`: fallback ke `ELEVENLABS_API_KEY` (atau profil shell gateway jika tersedia).
- `consultThinkingLevel`: override tingkat berpikir opsional untuk run agen OpenClaw penuh di balik panggilan realtime `openclaw_agent_consult`.
- `consultFastMode`: override mode cepat opsional untuk panggilan realtime `openclaw_agent_consult`.
- `realtime.provider`: memilih penyedia suara realtime aktif. Gunakan `openai` untuk WebRTC, `google` untuk WebSocket penyedia, atau penyedia khusus bridge melalui relay Gateway.
- `realtime.providers.<provider>` menyimpan konfigurasi realtime milik penyedia. Browser hanya menerima kredensial sesi ephemeral atau terbatas, tidak pernah kunci API standar.
- `realtime.providers.openai.voice`: id suara OpenAI Realtime bawaan. Suara `gpt-realtime-2` saat ini adalah `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, dan `cedar`; `marin` dan `cedar` direkomendasikan untuk kualitas terbaik.
- `realtime.transport`: `webrtc` menggunakan WebRTC OpenAI milik klien di iOS dan di browser. `provider-websocket` dimiliki browser tetapi tetap berada pada relay Gateway di iOS. `gateway-relay` mempertahankan audio penyedia di Gateway; Android menggunakan realtime hanya untuk transport ini dan selain itu mempertahankan loop STT/TTS native-nya.
- `realtime.brain`: `agent-consult` merutekan panggilan tool realtime melalui kebijakan Gateway; `direct-tools` adalah perilaku kompatibilitas tool langsung lama; `none` ditujukan untuk transkripsi atau orkestrasi eksternal.
- `realtime.consultRouting`: `provider-direct` mempertahankan balasan langsung penyedia saat melewati `openclaw_agent_consult`; `force-agent-consult` membuat relay Gateway merutekan transkrip pengguna yang difinalisasi melalui OpenClaw sebagai gantinya.
- `realtime.instructions`: menambahkan instruksi sistem yang menghadap penyedia ke prompt realtime bawaan OpenClaw. Gunakan ini untuk gaya dan nada suara; OpenClaw mempertahankan panduan default `openclaw_agent_consult`.
- `talk.catalog` mengekspos id penyedia kanonis dan alias registry bersama mode, transport, strategi brain, format audio realtime, flag kapabilitas, dan hasil kesiapan yang dipilih runtime untuk tiap penyedia. Klien Bicara pihak pertama harus menggunakan katalog tersebut alih-alih mempertahankan alias penyedia secara lokal; Gateway lama yang tidak menyertakan kesiapan grup dianggap belum terverifikasi, bukan pasti belum dikonfigurasi.
- Penyedia transkripsi streaming ditemukan melalui `talk.catalog.transcription`. Relay Gateway saat ini menggunakan konfigurasi penyedia streaming Voice Call sampai permukaan konfigurasi transkripsi Bicara khusus ditambahkan.
- `speechLocale`: id lokal BCP 47 opsional untuk pengenalan suara Bicara di perangkat pada iOS/macOS. Biarkan tidak diatur untuk menggunakan default perangkat.
- `outputFormat`: default ke `pcm_44100` pada macOS/iOS dan `pcm_24000` pada Android (atur `mp3_*` untuk memaksa streaming MP3)

## UI macOS

- Toggle bilah menu: **Bicara**
- Tab konfigurasi: grup **Mode Bicara** (id suara + toggle interupsi)
- Overlay:
  - **Mendengarkan**: cloud berdenyut mengikuti level mikrofon
  - **Berpikir**: animasi tenggelam
  - **Berbicara**: cincin yang memancar
  - Klik cloud: berhenti berbicara
  - Klik X: keluar dari mode Bicara

## UI Android

- Toggle tab Suara: **Bicara**
- **Mikrofon** dan **Bicara** manual adalah mode penangkapan runtime yang saling eksklusif.
- Mikrofon manual dan Bicara realtime memprioritaskan mikrofon headset Bluetooth Classic atau BLE yang terhubung. Jika terputus, aplikasi meminta input headset lain atau membiarkan Android menggunakan mikrofon default; menghentikan penangkapan memulihkan preferensi mikrofon default.
- Mikrofon manual berhenti saat aplikasi keluar dari foreground atau pengguna meninggalkan tab Suara.
- Mode Bicara tetap berjalan sampai dimatikan atau node Android terputus, dan menggunakan tipe layanan foreground mikrofon Android saat aktif.

## Catatan

- Memerlukan izin Ucapan + Mikrofon.
- Bicara native menggunakan sesi Gateway aktif dan hanya fallback ke polling riwayat saat peristiwa respons tidak tersedia.
- Bicara realtime milik klien menggunakan `talk.client.toolCall` untuk `openclaw_agent_consult` alih-alih mengekspos `chat.send` ke sesi milik penyedia.
- Bicara khusus transkripsi menggunakan `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn`, dan `talk.session.close`; klien berlangganan `talk.event` untuk pembaruan transkrip parsial/final.
- Gateway menyelesaikan pemutaran Bicara melalui `talk.speak` menggunakan penyedia Bicara aktif. Android fallback ke TTS sistem lokal hanya saat RPC tersebut tidak tersedia.
- Pemutaran MLX lokal macOS menggunakan helper `openclaw-mlx-tts` bawaan saat ada, atau executable pada `PATH`. Atur `OPENCLAW_MLX_TTS_BIN` agar menunjuk ke biner helper khusus selama pengembangan.
- `stability` untuk `eleven_v3` divalidasi ke `0.0`, `0.5`, atau `1.0`; model lain menerima `0..1`.
- `latency_tier` divalidasi ke `0..4` saat diatur.
- Android mendukung format output `pcm_16000`, `pcm_22050`, `pcm_24000`, dan `pcm_44100` untuk streaming AudioTrack latensi rendah.

## Terkait

- [Bangun suara](/id/nodes/voicewake)
- [Audio dan catatan suara](/id/nodes/audio)
- [Pemahaman media](/id/nodes/media-understanding)
