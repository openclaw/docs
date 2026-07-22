---
read_when:
    - Mengimplementasikan mode Bicara di macOS/iOS/Android
    - Mengubah perilaku suara/TTS/interupsi
summary: 'Mode bicara: percakapan suara berkelanjutan melalui STT/TTS lokal dan suara waktu nyata'
title: Mode bicara
x-i18n:
    generated_at: "2026-07-22T01:45:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b21319eee169ba898331f87279a2b2a5170441131a1e9cdc85c15b268d165e21
    source_path: nodes/talk.md
    workflow: 16
---

Mode Talk mencakup lima bentuk runtime:

- **Talk native macOS/iOS/Android**: pengenalan ucapan native, chat Gateway, dan TTS `talk.speak`. Pengenalan Apple Speech di macOS/iOS mungkin menggunakan layanan jaringan; perilaku Android bergantung pada layanan ucapan yang terinstal. Node mengiklankan kapabilitas `talk` dan menyatakan perintah `talk.*` yang didukung.
- **Talk iOS (waktu nyata)**: WebRTC yang dikelola klien untuk konfigurasi waktu nyata OpenAI yang memilih transportasi `webrtc` atau tidak menentukan transportasi. Konfigurasi waktu nyata `gateway-relay`, `provider-websocket`, dan non-OpenAI yang eksplisit tetap menggunakan relai yang dikelola Gateway; konfigurasi non-waktu-nyata menggunakan loop ucapan native.
- **Talk browser**: `talk.client.create` untuk sesi `webrtc`/`provider-websocket` yang dikelola klien, atau `talk.session.create` untuk sesi `gateway-relay` yang dikelola Gateway. `managed-room` dicadangkan untuk serah terima Gateway dan ruang walkie-talkie.
- **Talk Android (waktu nyata)**: ikut serta dengan `talk.realtime.mode: "realtime"` dan `talk.realtime.transport: "gateway-relay"`. Jika tidak, Android tetap menggunakan pengenalan ucapan native, chat Gateway, dan `talk.speak`.
- **Klien khusus transkripsi**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, lalu `talk.session.appendAudio`, `talk.session.cancelTurn`, dan `talk.session.close` untuk teks layar/dikte tanpa respons suara asisten. Catatan suara unggahan sekali pakai tetap menggunakan jalur audio [pemahaman media](/id/nodes/media-understanding).

Talk native adalah loop berkelanjutan: mendengarkan ucapan, mengirim transkrip ke model melalui sesi aktif, menunggu respons, lalu mengucapkannya melalui penyedia Talk yang dikonfigurasi (`talk.speak`).

Talk waktu nyata yang dikelola klien meneruskan panggilan alat penyedia melalui `talk.client.toolCall`, alih-alih memanggil `chat.send` secara langsung. Selama konsultasi waktu nyata aktif, klien dapat memanggil `talk.client.steer` atau `talk.session.steer` untuk mengklasifikasikan masukan lisan sebagai `status`, `steer`, `cancel`, atau `followup`. Pengarahan yang diterima dimasukkan ke antrean proses tersemat yang aktif; pengarahan yang ditolak mengembalikan alasan seperti `no_active_run`, `not_streaming`, atau `compacting`.

Ucapan pengguna dan asisten waktu nyata yang telah difinalisasi selalu ditambahkan secara langsung ke sesi agen aktif, sehingga giliran chat dan suara berikutnya berbagi satu riwayat. Transportasi yang dikelola klien melaporkan transkrip finalnya dengan ID entri yang stabil; sesi relai Gateway menambahkan peristiwa yang sama di sisi server. Sesi penyedia juga menerima konteks profil waktu nyata terbatas yang digunakan oleh suara Discord.

Proses konsultasi yang berasal dari suara memerlukan konfirmasi lisan baru yang persis sebelum tindakan berdampak besar, seperti mengirim pesan, mengendalikan node, tindakan browser/komputer, perubahan layanan, perintah shell destruktif, atau publikasi. Konfirmasi hanya berlaku untuk argumen alat yang persis diblokir dan digunakan satu kali; proses bersamaan yang tidak terkait tidak terpengaruh. Saat panggilan ditutup, OpenClaw dapat mengirim ringkasan singkat **Perubahan panggilan suara** untuk alat yang melakukan mutasi ke target pengiriman non-WebChat terakhir sesi.

Talk khusus transkripsi memancarkan amplop peristiwa Talk yang sama seperti sesi waktu nyata dan STT/TTS, tetapi menggunakan `mode: "transcription"` dan `brain: "none"`. Semua sesi Talk menyiarkan peristiwa pada saluran `talk.event`; klien berlangganan saluran tersebut untuk pembaruan transkrip parsial/final (`transcript.delta`/`transcript.done`) dan telemetri sesi lainnya.

Talk Video browser tersedia untuk sesi WebRTC OpenAI Realtime dan WebSocket penyedia Google Live. OpenAI menerima satu JPEG terbatas saat
`describe_view` meminta konteks visual; OpenAI tidak menerima trek
kamera berkelanjutan. Google Live menerima bingkai JPEG terbatas secara langsung dari
browser hingga satu bingkai per detik, sementara `describe_view` melaporkan
status streaming kamera. Dalam kedua kasus tersebut, bingkai kamera melewati Gateway, dan
menghentikan Talk akan melepaskan trek kamera dan mikrofon.

## Perilaku (macOS)

- Overlay selalu aktif selama mode Talk diaktifkan.
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
- `once: true` hanya berlaku untuk balasan saat ini; tanpanya, suara tersebut menjadi default mode Talk yang baru.

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
      instructions: "Bicaralah dengan hangat dan berikan jawaban singkat.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Kunci                                    | Default                                    | Catatan                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Penyedia TTS Active Talk. Gunakan `elevenlabs`, `mlx`, atau `system` untuk jalur pemutaran lokal macOS.                                                                                                                                                                             |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs beralih ke `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`, atau suara pertama yang tersedia dengan kunci API.                                                                                                                                                             |
| `speechLocale`                           | default perangkat                             | Lokal BCP 47 untuk pengenalan ucapan native Android, iOS, dan macOS. Apple Speech dapat menggunakan layanan jaringan; Android juga meneruskan komponen bahasa ke transkripsi input waktu nyata.                                                                                  |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | Beralih ke `ELEVENLABS_API_KEY` (atau profil shell Gateway jika tersedia).                                                                                                                                                                                                |
| `silenceTimeoutMs`                       | `700` md macOS/Android, `900` md iOS       | Jendela jeda sebelum Talk mengirim transkrip.                                                                                                                                                                                                                             |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | `pcm_44100` macOS/iOS, `pcm_24000` Android | Tetapkan `mp3_*` untuk memaksakan streaming MP3.                                                                                                                                                                                                                                        |
| `consultThinkingLevel`                   | tidak ditetapkan                                      | Penggantian tingkat pemikiran untuk proses agen di balik panggilan `openclaw_agent_consult` waktu nyata.                                                                                                                                                                                  |
| `consultFastMode`                        | tidak ditetapkan                                      | Penggantian mode cepat untuk panggilan `openclaw_agent_consult` waktu nyata.                                                                                                                                                                                                            |
| `realtime.provider`                      | -                                          | `openai` untuk WebRTC, `google` untuk WebSocket penyedia, atau penyedia khusus jembatan melalui relai Gateway.                                                                                                                                                                     |
| `realtime.providers.<id>`                | -                                          | Konfigurasi waktu nyata milik penyedia. Browser hanya menerima kredensial sesi sementara/terbatas, tidak pernah kunci API standar.                                                                                                                                                 |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | ID suara OpenAI Realtime bawaan (kunci `voice` yang lebih lama masih berfungsi, tetapi sudah tidak digunakan). Suara `gpt-realtime-2.1` saat ini: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; `marin` dan `cedar` direkomendasikan untuk kualitas terbaik. |
| `realtime.transport`                     | -                                          | `webrtc`: OpenAI WebRTC milik klien di iOS dan browser. `provider-websocket`: milik browser, tetap menggunakan relai Gateway di iOS. `gateway-relay`: mempertahankan audio penyedia di Gateway; Android hanya menggunakan waktu nyata dengan transportasi ini.                                  |
| `realtime.brain`                         | -                                          | `agent-consult` merutekan panggilan alat waktu nyata melalui kebijakan Gateway; `direct-tools` merupakan kompatibilitas alat langsung lama; `none` ditujukan untuk transkripsi/orkestrasi eksternal.                                                                                                 |
| `realtime.consultRouting`                | -                                          | `provider-direct` mempertahankan balasan langsung penyedia ketika melewati `openclaw_agent_consult`; `force-agent-consult` merutekan transkrip pengguna yang telah diselesaikan melalui OpenClaw sebagai gantinya.                                                                                          |
| `realtime.instructions`                  | -                                          | Menambahkan instruksi sistem yang ditujukan kepada penyedia ke prompt waktu nyata bawaan OpenClaw (gaya/nada suara); panduan default `openclaw_agent_consult` tetap berlaku.                                                                                                                |

`talk.catalog` menyediakan ID penyedia kanonis dan alias registri, mode/transportasi/strategi otak/format audio waktu nyata/flag kemampuan yang valid untuk setiap penyedia, serta hasil kesiapan yang dipilih saat runtime. Klien Talk pihak pertama harus membaca katalog tersebut alih-alih memelihara alias penyedia secara lokal; anggap Gateway lama yang tidak menyertakan kesiapan grup sebagai belum diverifikasi, bukan pasti belum dikonfigurasi. Penyedia transkripsi streaming ditemukan melalui `talk.catalog.transcription`; relai Gateway saat ini menggunakan konfigurasi penyedia streaming Voice Call hingga permukaan konfigurasi transkripsi Talk khusus dirilis.

## UI macOS

- Tombol menu bar: **Talk**
- Tab konfigurasi: grup **Talk Mode** (ID suara + tombol interupsi)
- Overlay: orb merender bentuk gelombang Talk universal (digunakan bersama dengan iOS, watchOS, dan Android). Mendengarkan mengikuti level mikrofon langsung, Berbicara mengikuti amplop pemutaran TTS aktual, Berpikir berdenyut lembut. Klik orb untuk menjeda/melanjutkan, klik dua kali untuk berhenti berbicara, klik X untuk keluar dari mode Talk.

## UI Android

- Navigasi utama Android adalah **Home**, **Chat**, dan **Settings**. Input suara
  berada di penyusun Chat, bukan pada tab Voice terpisah.
- Ketuk mikrofon penyusun untuk dikte di perangkat. Tekan lama untuk merekam
  lampiran catatan suara. Mulai Talk berkelanjutan dari bentuk gelombang Talk.
- Dikte, perekaman catatan suara, dan Talk adalah jalur mikrofon yang saling
  eksklusif; memulai salah satunya akan menghentikan atau memblokir yang lain.
- Talk waktu nyata mengutamakan mikrofon headset Bluetooth Classic atau BLE
  yang terhubung; jika koneksi terputus, aplikasi meminta input headset lain atau
  beralih ke mikrofon default, lalu memulihkan preferensi default setelah
  pengambilan audio berhenti.
- Dikte dan perekaman catatan suara berhenti ketika aplikasi meninggalkan latar depan atau
  pengguna meninggalkan Chat.
- Talk Mode terus berjalan hingga dinonaktifkan atau Node terputus, dengan menggunakan tipe layanan latar depan mikrofon Android saat aktif.
- Android mendukung format output `pcm_16000`, `pcm_22050`, `pcm_24000`, dan `pcm_44100` untuk streaming `AudioTrack` berlatensi rendah.

## Catatan

- Memerlukan izin Ucapan + Mikrofon.
- Talk native menggunakan sesi Gateway aktif dan hanya beralih ke polling riwayat ketika peristiwa respons tidak tersedia.
- Gateway menentukan pemutaran Talk melalui `talk.speak` menggunakan penyedia Talk aktif. Android hanya beralih ke TTS sistem lokal ketika RPC tersebut tidak tersedia.
- Pemutaran MLX lokal macOS menggunakan pembantu `openclaw-mlx-tts` yang disertakan jika tersedia, atau berkas yang dapat dieksekusi di `PATH`. Tetapkan `OPENCLAW_MLX_TTS_BIN` agar menunjuk ke biner pembantu khusus selama pengembangan.
- Rentang nilai direktif suara (ElevenLabs): `stability`, `similarity`, dan `style` menerima `0..1`; `speed` menerima `0.5..2`; `latency_tier` menerima `0..4`.

## Terkait

- [Pengaktifan suara](/id/nodes/voicewake)
- [Audio dan catatan suara](/id/nodes/audio)
- [Pemahaman media](/id/nodes/media-understanding)
