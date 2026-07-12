---
read_when:
    - Mengimplementasikan mode Bicara di macOS/iOS/Android
    - Mengubah perilaku suara/TTS/interupsi
summary: 'Mode bicara: percakapan suara berkelanjutan melalui STT/TTS lokal dan suara waktu nyata'
title: Mode bicara
x-i18n:
    generated_at: "2026-07-12T14:19:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

Mode Talk mencakup lima bentuk runtime:

- **Talk native macOS/iOS/Android**: pengenalan ucapan lokal, percakapan Gateway, dan TTS `talk.speak`. Node mengiklankan kapabilitas `talk` dan menyatakan perintah `talk.*` yang didukung.
- **Talk iOS (waktu nyata)**: WebRTC yang dikelola klien untuk konfigurasi waktu nyata OpenAI yang memilih transportasi `webrtc` atau tidak menentukan transportasi. Konfigurasi waktu nyata `gateway-relay`, `provider-websocket`, dan non-OpenAI yang ditentukan secara eksplisit tetap menggunakan relai yang dikelola Gateway; konfigurasi non-waktu nyata menggunakan loop ucapan native.
- **Talk peramban**: `talk.client.create` untuk sesi `webrtc`/`provider-websocket` yang dikelola klien, atau `talk.session.create` untuk sesi `gateway-relay` yang dikelola Gateway. `managed-room` dikhususkan untuk serah-terima Gateway dan ruang walkie-talkie.
- **Talk Android (waktu nyata)**: aktifkan dengan `talk.realtime.mode: "realtime"` dan `talk.realtime.transport: "gateway-relay"`. Jika tidak, Android tetap menggunakan pengenalan ucapan native, percakapan Gateway, dan `talk.speak`.
- **Klien khusus transkripsi**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, lalu `talk.session.appendAudio`, `talk.session.cancelTurn`, dan `talk.session.close` untuk takarir/dikte tanpa respons suara asisten. Catatan suara unggahan sekali jalan tetap menggunakan jalur audio [pemahaman media](/id/nodes/media-understanding).

Talk native adalah loop berkelanjutan: mendengarkan ucapan, mengirim transkrip ke model melalui sesi aktif, menunggu respons, lalu mengucapkannya melalui penyedia Talk yang dikonfigurasi (`talk.speak`).

Talk waktu nyata yang dikelola klien meneruskan pemanggilan alat penyedia melalui `talk.client.toolCall`, bukan memanggil `chat.send` secara langsung. Saat konsultasi waktu nyata aktif, klien dapat memanggil `talk.client.steer` atau `talk.session.steer` untuk mengklasifikasikan masukan lisan sebagai `status`, `steer`, `cancel`, atau `followup`. Pengarahan yang diterima dimasukkan ke antrean proses tertanam yang aktif; pengarahan yang ditolak mengembalikan alasan seperti `no_active_run`, `not_streaming`, atau `compacting`.

Talk khusus transkripsi memancarkan amplop peristiwa Talk yang sama seperti sesi waktu nyata dan STT/TTS, tetapi menggunakan `mode: "transcription"` dan `brain: "none"`. Semua sesi Talk menyiarkan peristiwa pada kanal `talk.event`; klien berlangganan kanal tersebut untuk pembaruan transkrip parsial/final (`transcript.delta`/`transcript.done`) dan telemetri sesi lainnya.

## Perilaku (macOS)

- Lapisan atas selalu aktif selama mode Talk diaktifkan.
- Transisi fase **Mendengarkan &rarr; Berpikir &rarr; Berbicara**.
- Saat terjadi jeda singkat (jendela keheningan), transkrip saat ini dikirim.
- Balasan ditulis ke WebChat (sama seperti mengetik).
- **Interupsi saat ada ucapan** (aktif secara default): jika pengguna berbicara saat asisten sedang berbicara, pemutaran berhenti dan stempel waktu interupsi dicatat untuk prompt berikutnya.

## Direktif suara dalam balasan

Asisten dapat mengawali balasan dengan satu baris JSON untuk mengendalikan suara:

```json
{ "voice": "<voice-id>", "once": true }
```

Aturan:

- Hanya baris pertama yang tidak kosong; baris JSON dihapus sebelum pemutaran TTS.
- Kunci yang tidak dikenal diabaikan.
- `once: true` hanya berlaku untuk balasan saat ini; tanpa nilai tersebut, suara menjadi default baru mode Talk.

Kunci yang didukung: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
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

| Kunci                                    | Default                                    | Catatan                                                                                                                                                                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider`                               | -                                          | Penyedia TTS Talk yang aktif. Gunakan `elevenlabs`, `mlx`, atau `system` untuk jalur pemutaran lokal macOS.                                                                                                                                                                                |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs beralih ke `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`, atau suara pertama yang tersedia dengan kunci API.                                                                                                                                                                           |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | Beralih ke `ELEVENLABS_API_KEY` (atau profil shell Gateway jika tersedia).                                                                                                                                                                                                                  |
| `speechLocale`                           | default perangkat                          | ID locale BCP 47 untuk pengenalan ucapan Talk pada perangkat di iOS/macOS.                                                                                                                                                                                                                  |
| `silenceTimeoutMs`                       | `700` md macOS/Android, `900` md iOS       | Jendela jeda sebelum Talk mengirim transkrip.                                                                                                                                                                                                                                               |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | `pcm_44100` macOS/iOS, `pcm_24000` Android | Tetapkan `mp3_*` untuk memaksakan streaming MP3.                                                                                                                                                                                                                                            |
| `consultThinkingLevel`                   | tidak ditetapkan                           | Penggantian tingkat pemikiran untuk proses agen di balik pemanggilan waktu nyata `openclaw_agent_consult`.                                                                                                                                                                                 |
| `consultFastMode`                        | tidak ditetapkan                           | Penggantian mode cepat untuk pemanggilan waktu nyata `openclaw_agent_consult`.                                                                                                                                                                                                              |
| `realtime.provider`                      | -                                          | `openai` untuk WebRTC, `google` untuk WebSocket penyedia, atau penyedia khusus jembatan melalui relai Gateway.                                                                                                                                                                              |
| `realtime.providers.<id>`                | -                                          | Konfigurasi waktu nyata yang dikelola penyedia. Peramban hanya menerima kredensial sesi sementara/terbatas, tidak pernah kunci API standar.                                                                                                                                                  |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | ID suara bawaan OpenAI Realtime (kunci `voice` yang lebih lama masih berfungsi tetapi sudah tidak disarankan). Suara `gpt-realtime-2.1` saat ini: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; `marin` dan `cedar` direkomendasikan untuk kualitas terbaik. |
| `realtime.transport`                     | -                                          | `webrtc`: WebRTC OpenAI yang dikelola klien di iOS dan peramban. `provider-websocket`: dikelola peramban, tetap menggunakan relai Gateway di iOS. `gateway-relay`: mempertahankan audio penyedia di Gateway; Android hanya menggunakan waktu nyata dengan transportasi ini.                       |
| `realtime.brain`                         | -                                          | `agent-consult` merutekan pemanggilan alat waktu nyata melalui kebijakan Gateway; `direct-tools` adalah kompatibilitas alat langsung lama; `none` ditujukan untuk transkripsi/orkestrasi eksternal.                                                                                           |
| `realtime.consultRouting`                | -                                          | `provider-direct` mempertahankan balasan langsung penyedia saat melewati `openclaw_agent_consult`; `force-agent-consult` merutekan transkrip pengguna yang telah difinalisasi melalui OpenClaw sebagai gantinya.                                                                              |
| `realtime.instructions`                  | -                                          | Menambahkan instruksi sistem yang ditujukan kepada penyedia ke prompt waktu nyata bawaan OpenClaw (gaya/nada suara); panduan default `openclaw_agent_consult` tetap dipertahankan.                                                                                                           |

`talk.catalog` mengekspos id penyedia kanonis dan alias registri, mode/transpor/strategi otak/format audio waktu nyata/penanda kemampuan yang valid untuk setiap penyedia, serta hasil kesiapan yang dipilih saat runtime. Klien Talk pihak pertama harus membaca katalog tersebut alih-alih memelihara alias penyedia secara lokal; perlakukan Gateway lama yang tidak menyertakan kesiapan grup sebagai belum terverifikasi, bukan dipastikan belum dikonfigurasi. Penyedia transkripsi streaming ditemukan melalui `talk.catalog.transcription`; relai Gateway saat ini menggunakan konfigurasi penyedia streaming Voice Call hingga permukaan konfigurasi transkripsi Talk khusus dirilis.

## UI macOS

- Tombol bilah menu: **Talk**
- Tab konfigurasi: grup **Talk Mode** (id suara + tombol interupsi)
- Overlay: bola menampilkan bentuk gelombang bicara universal (digunakan bersama dengan iOS, watchOS, dan Android). Saat mendengarkan, bentuk gelombang mengikuti level mikrofon langsung; saat berbicara, bentuk gelombang mengikuti amplop pemutaran TTS yang sebenarnya; saat berpikir, bentuk gelombang berdenyut lembut. Klik bola untuk menjeda/melanjutkan, klik dua kali untuk berhenti berbicara, klik X untuk keluar dari mode Talk.

## UI Android

- Tombol tab suara: **Talk**
- **Mic** dan **Talk** manual adalah mode perekaman yang saling eksklusif.
- Mic manual dan Talk waktu nyata memprioritaskan mikrofon headset Bluetooth Classic atau BLE yang terhubung; jika koneksi terputus, aplikasi meminta input headset lain atau beralih ke mikrofon default, lalu memulihkan preferensi default setelah perekaman berhenti.
- Mic manual berhenti ketika aplikasi meninggalkan latar depan atau pengguna meninggalkan tab suara.
- Mode Talk terus berjalan hingga dinonaktifkan atau Node terputus, dengan menggunakan jenis layanan latar depan mikrofon Android selama aktif.
- Android mendukung format keluaran `pcm_16000`, `pcm_22050`, `pcm_24000`, dan `pcm_44100` untuk streaming `AudioTrack` berlatensi rendah.

## Catatan

- Memerlukan izin Ucapan + Mikrofon.
- Talk native menggunakan sesi Gateway aktif dan hanya beralih ke polling riwayat ketika peristiwa respons tidak tersedia.
- Gateway menyelesaikan pemutaran Talk melalui `talk.speak` menggunakan penyedia Talk aktif. Android hanya beralih ke TTS sistem lokal ketika RPC tersebut tidak tersedia.
- Pemutaran MLX lokal macOS menggunakan pembantu `openclaw-mlx-tts` yang disertakan jika tersedia, atau berkas yang dapat dieksekusi di `PATH`. Atur `OPENCLAW_MLX_TTS_BIN` agar menunjuk ke biner pembantu khusus selama pengembangan.
- Rentang nilai direktif suara (ElevenLabs): `stability`, `similarity`, dan `style` menerima `0..1`; `speed` menerima `0.5..2`; `latency_tier` menerima `0..4`.

## Terkait

- [Pengaktifan suara](/id/nodes/voicewake)
- [Catatan audio dan suara](/id/nodes/audio)
- [Pemahaman media](/id/nodes/media-understanding)
