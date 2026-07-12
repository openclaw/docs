---
read_when:
    - Mencari ikhtisar kemampuan media OpenClaw
    - Menentukan penyedia media yang akan dikonfigurasi
    - Memahami cara kerja pembuatan media asinkron
sidebarTitle: Media overview
summary: Sekilas tentang kemampuan gambar, video, musik, ucapan, dan pemahaman media
title: Ikhtisar media
x-i18n:
    generated_at: "2026-07-12T14:45:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw menghasilkan gambar, video, dan musik, memahami media masuk
(gambar, audio, video), serta mengucapkan balasan dengan lantang menggunakan teks-ke-ucapan. Semua
kemampuan media digerakkan oleh alat: agen memutuskan kapan menggunakannya berdasarkan
percakapan, dan setiap alat hanya muncul jika setidaknya satu penyedia pendukung
telah dikonfigurasi.

Ucapan langsung menggunakan kontrak sesi Talk, bukan jalur alat media sekali jalan.
Talk memiliki tiga mode: `realtime` bawaan penyedia, `stt-tts` lokal atau streaming,
dan `transcription` untuk menangkap ucapan dalam mode pengamatan saja. Mode-mode tersebut
berbagi katalog penyedia, amplop peristiwa, dan semantik pembatalan dengan
telepon, rapat, waktu nyata peramban, dan klien tekan-untuk-bicara bawaan.

## Kemampuan

<CardGroup cols={2}>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Buat dan edit gambar dari perintah teks atau gambar referensi melalui
    `image_generate`. Asinkron dalam sesi obrolan — berjalan di latar belakang dan
    mengirimkan hasil saat siap.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Teks-ke-video, gambar-ke-video, dan video-ke-video melalui `video_generate`.
    Asinkron — berjalan di latar belakang dan mengirimkan hasil saat siap.
  </Card>
  <Card title="Pembuatan musik" href="/id/tools/music-generation" icon="music">
    Hasilkan musik atau trek audio melalui `music_generate`. Asinkron dalam sesi
    obrolan pada siklus hidup tugas pembuatan media bersama.
  </Card>
  <Card title="Teks-ke-ucapan" href="/id/tools/tts" icon="microphone">
    Ubah balasan keluar menjadi audio ucapan melalui alat `tts` beserta
    konfigurasi `messages.tts`. Sinkron.
  </Card>
  <Card title="Pemahaman media" href="/id/nodes/media-understanding" icon="eye">
    Ringkas gambar, audio, dan video masuk menggunakan penyedia model
    berkemampuan visi dan plugin khusus pemahaman media.
  </Card>
  <Card title="Ucapan-ke-teks" href="/id/nodes/audio" icon="ear-listen">
    Transkripsikan pesan suara masuk melalui STT batch atau penyedia STT
    streaming Panggilan Suara.
  </Card>
</CardGroup>

## Matriks kemampuan penyedia

<Note>
Tabel ini mencakup plugin khusus pembuatan media, TTS, dan STT. Banyak
penyedia model obrolan (Anthropic, Google, OpenAI, dan lainnya) juga memahami
media masuk melalui model balasan mereka; lihat daftar lengkap penyedia di
[Pemahaman media](/id/nodes/media-understanding#provider-support-matrix).
</Note>

| Penyedia          | Gambar | Video | Musik | TTS | STT | Suara waktu nyata | Pemahaman media |
| ----------------- | :----: | :---: | :---: | :-: | :-: | :---------------: | :--------------: |
| Alibaba           |        |   ✓   |       |     |     |                   |                  |
| Azure Speech      |        |       |       |  ✓  |     |                   |                  |
| BytePlus          |        |   ✓   |       |     |     |                   |                  |
| ComfyUI           |   ✓    |   ✓   |   ✓   |     |     |                   |                  |
| Deepgram          |        |       |       |     |  ✓  |                   |                  |
| DeepInfra         |   ✓    |   ✓   |       |  ✓  |  ✓  |                   |        ✓         |
| ElevenLabs        |        |       |       |  ✓  |  ✓  |                   |                  |
| fal               |   ✓    |   ✓   |   ✓   |     |     |                   |                  |
| Google            |   ✓    |   ✓   |   ✓   |  ✓  |  ✓  |         ✓         |        ✓         |
| Gradium           |        |       |       |  ✓  |     |                   |                  |
| Inworld           |        |       |       |  ✓  |     |                   |                  |
| LiteLLM           |   ✓    |       |       |     |     |                   |                  |
| CLI Lokal         |        |       |       |  ✓  |     |                   |                  |
| Microsoft         |        |       |       |  ✓  |     |                   |                  |
| Microsoft Foundry |   ✓    |       |       |     |     |                   |                  |
| MiniMax           |   ✓    |   ✓   |   ✓   |  ✓  |     |                   |                  |
| Mistral           |        |       |       |     |  ✓  |                   |                  |
| OpenAI            |   ✓    |   ✓   |       |  ✓  |  ✓  |         ✓         |        ✓         |
| OpenRouter        |   ✓    |   ✓   |   ✓   |  ✓  |  ✓  |                   |        ✓         |
| PixVerse          |        |   ✓   |       |     |     |                   |                  |
| Qwen              |        |   ✓   |       |     |     |                   |        ✓         |
| Runway            |        |   ✓   |       |     |     |                   |                  |
| SenseAudio        |        |       |       |     |  ✓  |                   |                  |
| Together          |        |   ✓   |       |     |     |                   |                  |
| Volcengine        |        |       |       |  ✓  |     |                   |                  |
| Vydra             |   ✓    |   ✓   |       |  ✓  |     |                   |                  |
| xAI               |   ✓    |   ✓   |       |  ✓  |  ✓  |                   |        ✓         |
| Xiaomi MiMo       |        |       |       |  ✓  |     |                   |                  |

<Note>
**Suara waktu nyata** di sini berarti komunikasi waktu nyata dua arah bawaan penyedia (mode
`realtime` Talk, misalnya Gemini Live atau OpenAI Realtime API) — saat ini hanya Google
dan OpenAI yang mendaftarkannya. Deepgram, ElevenLabs, Mistral, OpenAI, dan xAI
secara terpisah mendaftarkan STT streaming Panggilan Suara (audio-ke-teks satu arah); lihat
[Ucapan-ke-teks dan Panggilan Suara](#speech-to-text-and-voice-call) di bawah.
Suara waktu nyata xAI adalah kemampuan hulu, tetapi belum didaftarkan di
OpenClaw hingga kontrak suara waktu nyata bersama dapat merepresentasikannya.
</Note>

## Asinkron dibandingkan sinkron

| Kemampuan       | Mode      | Alasan                                                                                                              |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| Gambar          | Asinkron  | Pemrosesan penyedia dapat berlangsung lebih lama daripada satu giliran obrolan; lampiran yang dihasilkan menggunakan jalur penyelesaian bersama. |
| Teks-ke-ucapan  | Sinkron   | Respons penyedia kembali dalam hitungan detik; dilampirkan ke audio balasan.                                         |
| Video           | Asinkron  | Pemrosesan penyedia memerlukan 30 dtk hingga beberapa menit; antrean lambat dapat berjalan hingga batas waktu yang dikonfigurasi. |
| Musik           | Asinkron  | Memiliki karakteristik pemrosesan penyedia yang sama seperti video.                                                  |

Untuk alat asinkron, OpenClaw mengirimkan permintaan kepada penyedia, segera mengembalikan
ID tugas, dan melacak pekerjaan tersebut dalam buku besar tugas. Agen terus
merespons pesan lain selama pekerjaan berjalan. Ketika penyedia selesai,
OpenClaw membangunkan agen dengan jalur media yang dihasilkan agar agen dapat memberi tahu
pengguna melalui mode balasan terlihat normal sesi: pengiriman balasan akhir otomatis
jika dikonfigurasi, atau `message(action="send")` jika sesi mewajibkan
alat pesan. Jika sesi peminta tidak aktif atau pembangkitan aktifnya
gagal, dan sebagian media yang dihasilkan masih tidak ada dalam balasan penyelesaian,
OpenClaw mengirimkan fallback langsung idempoten yang hanya berisi media yang belum terkirim. Media
yang telah dikirimkan oleh balasan penyelesaian tidak dikirim lagi.

## Ucapan-ke-teks dan Panggilan Suara

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio, dan xAI semuanya dapat mentranskripsikan audio masuk melalui jalur batch
`tools.media.audio` jika dikonfigurasi. Plugin saluran yang melakukan pemeriksaan awal terhadap
catatan suara untuk penyaringan penyebutan atau penguraian perintah menandai lampiran yang telah
ditranskripsikan pada konteks masuk, sehingga proses pemahaman media bersama
menggunakan kembali transkrip tersebut alih-alih melakukan panggilan STT kedua untuk audio yang sama.

Deepgram, ElevenLabs, Mistral, OpenAI, dan xAI juga mendaftarkan penyedia STT
streaming Panggilan Suara, sehingga audio telepon langsung dapat diteruskan ke vendor yang dipilih
tanpa menunggu rekaman selesai.

Untuk percakapan pengguna secara langsung, utamakan [mode Talk](/id/nodes/talk). Lampiran audio
batch tetap berada pada jalur media; waktu nyata peramban, tekan-untuk-bicara bawaan,
telepon, dan audio rapat harus menggunakan peristiwa Talk dan katalog dalam cakupan sesi
yang dikembalikan oleh Gateway.

## Pemetaan penyedia (cara vendor dibagi di berbagai permukaan)

<AccordionGroup>
  <Accordion title="Google">
    Permukaan gambar, video, musik, TTS batch, STT batch, suara waktu nyata backend, dan
    pemahaman media.
  </Accordion>
  <Accordion title="OpenAI">
    Permukaan gambar, video, TTS batch, STT batch, STT streaming Panggilan Suara, suara
    waktu nyata backend, dan embedding memori.
  </Accordion>
  <Accordion title="DeepInfra">
    Permukaan perutean obrolan/model, pembuatan/penyuntingan gambar, teks-ke-video, TTS batch,
    STT batch, pemahaman media gambar, dan embedding memori.
    DeepInfra juga menyediakan pemeringkatan ulang, klasifikasi, deteksi objek, dan
    jenis model bawaan lainnya; OpenClaw belum memiliki kontrak penyedia untuk
    kategori tersebut, sehingga plugin ini tidak mendaftarkannya.
  </Accordion>
  <Accordion title="xAI">
    Gambar, video, pencarian, eksekusi kode, TTS batch, STT batch, dan STT
    streaming Panggilan Suara. Suara waktu nyata xAI adalah kemampuan hulu, tetapi
    belum didaftarkan di OpenClaw hingga kontrak suara waktu nyata bersama dapat
    merepresentasikannya.
  </Accordion>
</AccordionGroup>

## Terkait

- [Pembuatan gambar](/id/tools/image-generation)
- [Pembuatan video](/id/tools/video-generation)
- [Pembuatan musik](/id/tools/music-generation)
- [Teks-ke-ucapan](/id/tools/tts)
- [Pemahaman media](/id/nodes/media-understanding)
- [Node audio](/id/nodes/audio)
- [Mode Talk](/id/nodes/talk)
