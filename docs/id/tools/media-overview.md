---
read_when:
    - Mencari gambaran umum tentang kemampuan media OpenClaw
    - Menentukan penyedia media mana yang akan dikonfigurasi
    - Memahami cara kerja pembuatan media asinkron
sidebarTitle: Media overview
summary: Sekilas tentang kemampuan gambar, video, musik, ucapan, dan pemahaman media
title: Ikhtisar media
x-i18n:
    generated_at: "2026-05-12T08:46:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7ca89d058467968ee140cb3318fe8a1fb96d09fe7c59982efce36eb9b714591
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw menghasilkan gambar, video, dan musik, memahami media masuk
(gambar, audio, video), dan mengucapkan balasan dengan text-to-speech. Semua
kapabilitas media digerakkan oleh alat: agen memutuskan kapan menggunakannya berdasarkan
percakapan, dan setiap alat hanya muncul ketika setidaknya satu
penyedia pendukung dikonfigurasi.

Ucapan langsung menggunakan kontrak sesi Talk alih-alih jalur alat media sekali jalan.
Talk memiliki tiga mode: `realtime` asli penyedia, `stt-tts` lokal atau streaming,
dan `transcription` untuk penangkapan ucapan hanya-observasi. Mode-mode tersebut
berbagi katalog penyedia, amplop peristiwa, dan semantik pembatalan dengan
telefoni, rapat, realtime browser, dan klien push-to-talk native.

## Kapabilitas

<CardGroup cols={2}>
  <Card title="Image generation" href="/id/tools/image-generation" icon="image">
    Buat dan edit gambar dari prompt teks atau gambar referensi melalui
    `image_generate`. Sinkron — selesai sebaris dengan balasan.
  </Card>
  <Card title="Video generation" href="/id/tools/video-generation" icon="video">
    Teks-ke-video, gambar-ke-video, dan video-ke-video melalui `video_generate`.
    Asinkron — berjalan di latar belakang dan mengirimkan hasil saat siap.
  </Card>
  <Card title="Music generation" href="/id/tools/music-generation" icon="music">
    Hasilkan musik atau trek audio melalui `music_generate`. Asinkron pada
    penyedia bersama; jalur alur kerja ComfyUI berjalan secara sinkron.
  </Card>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="microphone">
    Konversi balasan keluar menjadi audio lisan melalui alat `tts` ditambah
    konfigurasi `messages.tts`. Sinkron.
  </Card>
  <Card title="Media understanding" href="/id/nodes/media-understanding" icon="eye">
    Ringkas gambar, audio, dan video masuk menggunakan penyedia model
    berkemampuan visi dan plugin pemahaman media khusus.
  </Card>
  <Card title="Speech-to-text" href="/id/nodes/audio" icon="ear-listen">
    Transkripsikan pesan suara masuk melalui STT batch atau penyedia STT
    streaming Voice Call.
  </Card>
</CardGroup>

## Matriks kapabilitas penyedia

| Penyedia    | Gambar | Video | Musik | TTS | STT | Suara realtime | Pemahaman media |
| ----------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba     |       |   ✓   |       |     |     |                |                     |
| BytePlus    |       |   ✓   |       |     |     |                |                     |
| ComfyUI     |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| DeepInfra   |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Deepgram    |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs  |       |       |       |  ✓  |  ✓  |                |                     |
| fal         |   ✓   |   ✓   |       |     |     |                |                     |
| Google      |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium     |       |       |       |  ✓  |     |                |                     |
| Local CLI   |       |       |       |  ✓  |     |                |                     |
| Microsoft   |       |       |       |  ✓  |     |                |                     |
| MiniMax     |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral     |       |       |       |     |  ✓  |                |                     |
| OpenAI      |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter  |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Qwen        |       |   ✓   |       |     |     |                |                     |
| Runway      |       |   ✓   |       |     |     |                |                     |
| SenseAudio  |       |       |       |     |  ✓  |                |                     |
| Together    |       |   ✓   |       |     |     |                |                     |
| Vydra       |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
Pemahaman media menggunakan model berkemampuan visi atau audio apa pun yang terdaftar
dalam konfigurasi penyedia Anda. Matriks di atas mencantumkan penyedia dengan dukungan
pemahaman media khusus; sebagian besar penyedia LLM multimodal (Anthropic, Google,
OpenAI, dll.) juga dapat memahami media masuk saat dikonfigurasi sebagai model
balasan aktif.
</Note>

## Asinkron vs sinkron

| Kapabilitas      | Mode         | Alasan                                                                                                  |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Gambar           | Sinkron      | Respons penyedia kembali dalam hitungan detik; selesai sebaris dengan balasan.                                   |
| Teks-ke-ucapan   | Sinkron      | Respons penyedia kembali dalam hitungan detik; dilampirkan ke audio balasan.                                   |
| Video            | Asinkron     | Pemrosesan penyedia membutuhkan 30 dtk hingga beberapa menit; antrean lambat dapat berjalan hingga batas waktu yang dikonfigurasi. |
| Musik (bersama)  | Asinkron     | Karakteristik pemrosesan penyedia sama seperti video.                                                    |
| Musik (ComfyUI)  | Sinkron      | Alur kerja lokal berjalan sebaris terhadap server ComfyUI yang dikonfigurasi.                                    |

Untuk alat asinkron, OpenClaw mengirimkan permintaan ke penyedia, segera mengembalikan id
tugas, dan melacak pekerjaan dalam buku besar tugas. Agen terus
merespons pesan lain sementara pekerjaan berjalan. Ketika penyedia selesai,
OpenClaw membangunkan agen dengan jalur media yang dihasilkan agar agen dapat memberi tahu
pengguna dan, bila diwajibkan oleh kebijakan pengiriman sumber, meneruskan hasil melalui
alat pesan. Untuk rute grup/saluran khusus alat pesan, OpenClaw memperlakukan
bukti pengiriman alat pesan yang hilang sebagai upaya penyelesaian yang gagal dan mengirimkan
fallback media yang dihasilkan langsung ke saluran asli.

## Ucapan-ke-teks dan Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio, dan xAI semuanya dapat mentranskripsikan
audio masuk melalui jalur batch `tools.media.audio` saat dikonfigurasi.
Plugin saluran yang melakukan preflight pada catatan suara untuk gating penyebutan atau
penguraian perintah menandai lampiran yang ditranskripsikan pada konteks masuk, sehingga
lintasan pemahaman media bersama menggunakan kembali transkrip tersebut alih-alih membuat panggilan
STT kedua untuk audio yang sama.

Deepgram, ElevenLabs, Mistral, OpenAI, dan xAI juga mendaftarkan penyedia STT
streaming Voice Call, sehingga audio telepon langsung dapat diteruskan ke vendor
terpilih tanpa menunggu rekaman selesai.

Untuk percakapan pengguna langsung, gunakan [mode Talk](/id/nodes/talk). Lampiran audio batch
tetap berada di jalur media; realtime browser, push-to-talk native,
telefoni, dan audio rapat harus menggunakan peristiwa Talk dan katalog bercakupan sesi
yang dikembalikan oleh Gateway.

## Pemetaan penyedia (cara vendor dibagi di berbagai permukaan)

<AccordionGroup>
  <Accordion title="Google">
    Permukaan gambar, video, musik, TTS batch, suara realtime backend, dan
    pemahaman media.
  </Accordion>
  <Accordion title="OpenAI">
    Permukaan gambar, video, TTS batch, STT batch, STT streaming Voice Call,
    suara realtime backend, dan penyematan memori.
  </Accordion>
  <Accordion title="DeepInfra">
    Perutean chat/model, pembuatan/pengeditan gambar, teks-ke-video, TTS batch,
    STT batch, pemahaman media gambar, dan permukaan penyematan memori.
    Model rerank/klasifikasi/deteksi-objek native DeepInfra tidak
    didaftarkan sampai OpenClaw memiliki kontrak penyedia khusus untuk kategori
    tersebut.
  </Accordion>
  <Accordion title="xAI">
    Gambar, video, pencarian, eksekusi kode, TTS batch, STT batch, dan STT
    streaming Voice Call. Suara Realtime xAI adalah kapabilitas upstream tetapi
    tidak didaftarkan di OpenClaw sampai kontrak suara-realtime bersama dapat
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
