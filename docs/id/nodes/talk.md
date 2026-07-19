---
read_when:
    - Mengimplementasikan mode Bicara di macOS/iOS/Android
    - Mengubah perilaku suara/TTS/interupsi
summary: 'Mode bicara: percakapan suara berkelanjutan melalui STT/TTS lokal dan suara waktu nyata'
title: Mode bicara
x-i18n:
    generated_at: "2026-07-19T16:38:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1cb76789212054ce782703b9a456f5e809c0a45d1af5665445b17fcba4fd8f93
    source_path: nodes/talk.md
    workflow: 16
---

Mode Talk mencakup lima bentuk runtime:

- **Talk native macOS/iOS/Android**: pengenalan ucapan lokal, percakapan Gateway, dan TTS `talk.speak`. Node mengiklankan kapabilitas `talk` dan menyatakan perintah `talk.*` yang didukung.
- **Talk iOS (waktu nyata)**: WebRTC yang dikelola klien untuk konfigurasi waktu nyata OpenAI yang memilih transportasi `webrtc` atau tidak menentukan transportasi. Konfigurasi `gateway-relay`, `provider-websocket`, dan konfigurasi waktu nyata non-OpenAI yang eksplisit tetap menggunakan relai yang dikelola Gateway; konfigurasi non-waktu nyata menggunakan loop ucapan native.
- **Talk browser**: `talk.client.create` untuk sesi `webrtc`/`provider-websocket` yang dikelola klien, atau `talk.session.create` untuk sesi `gateway-relay` yang dikelola Gateway. `managed-room` dicadangkan untuk serah terima Gateway dan ruang walkie-talkie.
- **Talk Android (waktu nyata)**: ikut serta dengan `talk.realtime.mode: "realtime"` dan `talk.realtime.transport: "gateway-relay"`. Jika tidak, Android tetap menggunakan pengenalan ucapan native, percakapan Gateway, dan `talk.speak`.
- **Klien khusus transkripsi**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, lalu `talk.session.appendAudio`, `talk.session.cancelTurn`, dan `talk.session.close` untuk takarir/dikte tanpa respons suara asisten. Catatan suara unggahan sekali jalan tetap menggunakan jalur audio [pemahaman media](/id/nodes/media-understanding).

Talk native adalah loop berkelanjutan: mendengarkan ucapan, mengirim transkrip ke model melalui sesi aktif, menunggu respons, lalu mengucapkannya melalui penyedia Talk yang dikonfigurasi (`talk.speak`).

Talk waktu nyata yang dikelola klien meneruskan panggilan alat penyedia melalui `talk.client.toolCall`, alih-alih memanggil `chat.send` secara langsung. Saat konsultasi waktu nyata aktif, klien dapat memanggil `talk.client.steer` atau `talk.session.steer` untuk mengklasifikasikan masukan lisan sebagai `status`, `steer`, `cancel`, atau `followup`. Pengarahan yang diterima dimasukkan ke antrean proses tertanam yang aktif; pengarahan yang ditolak mengembalikan alasan seperti `no_active_run`, `not_streaming`, atau `compacting`.

Ucapan pengguna dan asisten waktu nyata yang telah difinalisasi selalu ditambahkan secara langsung ke sesi agen aktif, sehingga giliran percakapan dan suara berikutnya berbagi satu riwayat. Transportasi yang dikelola klien melaporkan transkrip final dengan ID entri yang stabil; sesi relai Gateway menambahkan peristiwa yang sama di sisi server. Sesi penyedia juga menerima konteks profil waktu nyata terbatas yang digunakan oleh suara Discord.

Proses konsultasi yang berasal dari suara memerlukan konfirmasi lisan baru dan persis sebelum tindakan berdampak tinggi, seperti mengirim pesan, mengontrol Node, tindakan browser/komputer, perubahan layanan, perintah shell destruktif, atau publikasi. Konfirmasi hanya berlaku untuk argumen alat yang diblokir secara persis dan digunakan satu kali; proses bersamaan yang tidak terkait tetap tidak terpengaruh. Saat panggilan ditutup, OpenClaw dapat mengirim ringkasan padat **Perubahan panggilan suara** untuk alat yang melakukan mutasi ke target pengiriman non-WebChat terakhir milik sesi.

Talk khusus transkripsi memancarkan selubung peristiwa Talk yang sama seperti sesi waktu nyata dan STT/TTS, tetapi menggunakan `mode: "transcription"` dan `brain: "none"`. Semua sesi Talk menyiarkan peristiwa pada saluran `talk.event`; klien berlangganan saluran tersebut untuk pembaruan transkrip parsial/final (`transcript.delta`/`transcript.done`) dan telemetri sesi lainnya.

Talk Video browser tersedia untuk sesi WebRTC OpenAI Realtime dan WebSocket penyedia Google Live. OpenAI menerima satu JPEG terbatas ketika
`describe_view` meminta konteks visual; OpenAI tidak menerima trek kamera
berkelanjutan. Google Live menerima bingkai JPEG terbatas secara langsung dari
browser hingga satu bingkai per detik, sementara `describe_view` melaporkan
status aliran kamera. Dalam kedua kasus, bingkai kamera melewati Gateway tanpa
diproses, dan menghentikan Talk akan melepaskan trek kamera dan mikrofon.

## Perilaku (macOS)

- Overlay selalu aktif saat mode Talk diaktifkan.
- Transisi fase **Mendengarkan &rarr; Berpikir &rarr; Berbicara**.
- Saat jeda singkat (jendela keheningan), transkrip saat ini dikirim.
- Balasan ditulis ke WebChat (sama seperti mengetik).
- **Interupsi saat ada ucapan** (aktif secara default): jika pengguna berbicara saat asisten sedang berbicara, pemutaran berhenti dan stempel waktu interupsi dicatat untuk prompt berikutnya.

## Direktif suara dalam balasan

Asisten dapat mengawali balasan dengan satu baris JSON untuk mengontrol suara:

```json
{ "voice": "<voice-id>", "once": true }
```

Aturan:

- Hanya baris pertama yang tidak kosong; baris JSON dihapus sebelum pemutaran TTS.
- Kunci yang tidak dikenal diabaikan.
- `once: true` hanya berlaku untuk balasan saat ini; tanpa kunci tersebut, suara menjadi default baru mode Talk.

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

| Kunci                                    | Bawaan                                    | Catatan                                                                                                                                                                                                                                                                     |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Penyedia TTS Active Talk. Gunakan `elevenlabs`, `mlx`, atau `system` untuk jalur pemutaran lokal macOS.                                                                                                                                                                             |
| `providers.<id>.voiceId`                 | -                                          | ElevenLabs menggunakan `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` sebagai fallback, atau suara pertama yang tersedia dengan kunci API.                                                                                                                                                             |
| `speechLocale`                           | bawaan perangkat                           | Lokal BCP 47 untuk pengenalan ucapan Android, iOS, dan macOS. Android juga meneruskan komponen bahasa ke transkripsi input waktu nyata.                                                                                                                                |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                            |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                            |
| `providers.elevenlabs.apiKey`            | -                                          | Menggunakan `ELEVENLABS_API_KEY` sebagai fallback (atau profil shell Gateway jika tersedia).                                                                                                                                                                                                |
| `speechLocale`                           | bawaan perangkat                           | ID lokal BCP 47 untuk pengenalan ucapan Talk pada perangkat di iOS/macOS.                                                                                                                                                                                                       |
| `silenceTimeoutMs`                       | `700` md macOS/Android, `900` md iOS       | Jeda sebelum Talk mengirim transkrip.                                                                                                                                                                                                                             |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                            |
| `outputFormat`                           | `pcm_44100` macOS/iOS, `pcm_24000` Android | Atur `mp3_*` untuk memaksakan streaming MP3.                                                                                                                                                                                                                                        |
| `consultThinkingLevel`                   | tidak diatur                               | Penimpaan tingkat pemikiran untuk eksekusi agen di balik panggilan `openclaw_agent_consult` waktu nyata.                                                                                                                                                                                  |
| `consultFastMode`                        | tidak diatur                               | Penimpaan mode cepat untuk panggilan `openclaw_agent_consult` waktu nyata.                                                                                                                                                                                                            |
| `realtime.provider`                      | -                                          | `openai` untuk WebRTC, `google` untuk WebSocket penyedia, atau penyedia khusus jembatan melalui relai Gateway.                                                                                                                                                                     |
| `realtime.providers.<id>`                | -                                          | Konfigurasi waktu nyata milik penyedia. Browser hanya menerima kredensial sesi sementara/terbatas, tidak pernah kunci API standar.                                                                                                                                                 |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | ID suara OpenAI Realtime bawaan (kunci `voice` yang lebih lama masih berfungsi, tetapi sudah tidak digunakan lagi). Suara `gpt-realtime-2.1` saat ini: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; `marin` dan `cedar` direkomendasikan untuk kualitas terbaik. |
| `realtime.transport`                     | -                                          | `webrtc`: OpenAI WebRTC milik klien di iOS dan browser. `provider-websocket`: milik browser, tetap menggunakan relai Gateway di iOS. `gateway-relay`: mempertahankan audio penyedia di Gateway; Android hanya menggunakan waktu nyata dengan transportasi ini.                                  |
| `realtime.brain`                         | -                                          | `agent-consult` merutekan panggilan alat waktu nyata melalui kebijakan Gateway; `direct-tools` adalah kompatibilitas alat langsung lama; `none` digunakan untuk transkripsi/orkestrasi eksternal.                                                                                                 |
| `realtime.consultRouting`                | -                                          | `provider-direct` mempertahankan balasan langsung penyedia ketika melewati `openclaw_agent_consult`; sebagai gantinya, `force-agent-consult` merutekan transkrip pengguna yang telah difinalisasi melalui OpenClaw.                                                                                          |
| `realtime.instructions`                  | -                                          | Menambahkan instruksi sistem untuk penyedia ke prompt waktu nyata bawaan OpenClaw (gaya/nada suara); panduan bawaan `openclaw_agent_consult` tetap berlaku.                                                                                                                |

`talk.catalog` mengekspos ID penyedia kanonis dan alias registri, mode/transportasi/strategi otak/format audio waktu nyata/flag kemampuan yang valid untuk setiap penyedia, serta hasil kesiapan yang dipilih runtime. Klien Talk pihak pertama harus membaca katalog tersebut alih-alih memelihara alias penyedia secara lokal; perlakukan Gateway lama yang tidak menyertakan kesiapan grup sebagai belum terverifikasi, bukan dipastikan belum dikonfigurasi. Penyedia transkripsi streaming ditemukan melalui `talk.catalog.transcription`; relai Gateway saat ini menggunakan konfigurasi penyedia streaming Voice Call hingga permukaan konfigurasi transkripsi Talk khusus dirilis.

## UI macOS

- Pengalih bilah menu: **Talk**
- Tab konfigurasi: grup **Talk Mode** (ID suara + pengalih interupsi)
- Overlay: bola menampilkan bentuk gelombang bicara universal (digunakan bersama iOS, watchOS, dan Android). Saat mendengarkan, tampilannya mengikuti level mikrofon langsung; saat berbicara, tampilannya mengikuti envelope pemutaran TTS aktual; saat berpikir, tampilannya berdenyut lembut. Klik bola untuk menjeda/melanjutkan, klik dua kali untuk berhenti berbicara, klik X untuk keluar dari mode Talk.

## UI Android

- Navigasi utama Android adalah **Home**, **Chat**, dan **Settings**. Input suara
  berada di penyusun Chat, bukan di tab Voice terpisah.
- Ketuk mikrofon penyusun untuk dikte pada perangkat. Tekan lama untuk merekam
  lampiran catatan suara. Mulai Talk berkelanjutan dari bentuk gelombang Talk.
- Dikte, perekaman catatan suara, dan Talk merupakan jalur mikrofon yang saling
  eksklusif; memulai salah satunya akan menghentikan atau memblokir yang lain.
- Talk waktu nyata mengutamakan mikrofon headset Bluetooth Classic atau BLE yang
  terhubung; jika koneksi terputus, aplikasi meminta input headset lain atau
  menggunakan mikrofon bawaan sebagai fallback, lalu memulihkan preferensi bawaan setelah
  perekaman berhenti.
- Dikte dan perekaman catatan suara berhenti ketika aplikasi tidak lagi berada di latar depan atau
  pengguna meninggalkan Chat.
- Talk Mode terus berjalan hingga dinonaktifkan atau Node terputus, menggunakan jenis layanan latar depan mikrofon Android selama aktif.
- Android mendukung format output `pcm_16000`, `pcm_22050`, `pcm_24000`, dan `pcm_44100` untuk streaming `AudioTrack` berlatensi rendah.

## Catatan

- Memerlukan izin Ucapan + Mikrofon.
- Talk native menggunakan sesi Gateway aktif dan hanya menggunakan polling riwayat sebagai fallback ketika peristiwa respons tidak tersedia.
- Gateway menyelesaikan pemutaran Talk melalui `talk.speak` menggunakan penyedia Talk aktif. Android menggunakan TTS sistem lokal sebagai fallback hanya ketika RPC tersebut tidak tersedia.
- Pemutaran MLX lokal macOS menggunakan pembantu `openclaw-mlx-tts` yang disertakan jika tersedia, atau executable di `PATH`. Atur `OPENCLAW_MLX_TTS_BIN` agar menunjuk ke biner pembantu khusus selama pengembangan.
- Rentang nilai direktif suara (ElevenLabs): `stability`, `similarity`, dan `style` menerima `0..1`; `speed` menerima `0.5..2`; `latency_tier` menerima `0..4`.

## Terkait

- [Pengaktifan suara](/id/nodes/voicewake)
- [Audio dan catatan suara](/id/nodes/audio)
- [Pemahaman media](/id/nodes/media-understanding)
