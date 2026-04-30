---
read_when:
    - Mencari gambaran umum tentang kemampuan media OpenClaw
    - Menentukan penyedia media mana yang akan dikonfigurasi
    - Memahami cara kerja pembuatan media asinkron
sidebarTitle: Media overview
summary: Sekilas kemampuan gambar, video, musik, ucapan, dan pemahaman media
title: Ikhtisar media
x-i18n:
    generated_at: "2026-04-30T10:16:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw menghasilkan gambar, video, dan musik, memahami media masuk
(gambar, audio, video), dan mengucapkan balasan dengan text-to-speech. Semua
kemampuan media digerakkan oleh alat: agen memutuskan kapan menggunakannya
berdasarkan percakapan, dan setiap alat hanya muncul ketika setidaknya satu
penyedia pendukung telah dikonfigurasi.

## Kemampuan

<CardGroup cols={2}>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Buat dan edit gambar dari prompt teks atau gambar referensi melalui
    `image_generate`. Sinkron — selesai sebaris dengan balasan.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Teks-ke-video, gambar-ke-video, dan video-ke-video melalui `video_generate`.
    Asinkron — berjalan di latar belakang dan memposting hasilnya saat siap.
  </Card>
  <Card title="Pembuatan musik" href="/id/tools/music-generation" icon="music">
    Hasilkan musik atau trek audio melalui `music_generate`. Asinkron pada
    penyedia bersama; jalur alur kerja ComfyUI berjalan secara sinkron.
  </Card>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="microphone">
    Konversi balasan keluar menjadi audio ucapan melalui alat `tts` ditambah
    konfigurasi `messages.tts`. Sinkron.
  </Card>
  <Card title="Pemahaman media" href="/id/nodes/media-understanding" icon="eye">
    Ringkas gambar, audio, dan video masuk menggunakan penyedia model
    berkemampuan visi dan Plugin pemahaman media khusus.
  </Card>
  <Card title="Speech-to-text" href="/id/nodes/audio" icon="ear-listen">
    Transkripsikan pesan suara masuk melalui penyedia STT batch atau STT
    streaming Voice Call.
  </Card>
</CardGroup>

## Matriks kemampuan penyedia

| Penyedia    | Gambar | Video | Musik | TTS | STT | Suara realtime | Pemahaman media |
| ----------- | :----: | :---: | :---: | :-: | :-: | :-------------: | :-------------: |
| Alibaba     |        |   ✓   |       |     |     |                 |                 |
| BytePlus    |        |   ✓   |       |     |     |                 |                 |
| ComfyUI     |   ✓    |   ✓   |   ✓   |     |     |                 |                 |
| DeepInfra   |   ✓    |   ✓   |       |  ✓  |  ✓  |                 |        ✓        |
| Deepgram    |        |       |       |     |  ✓  |        ✓        |                 |
| ElevenLabs  |        |       |       |  ✓  |  ✓  |                 |                 |
| fal         |   ✓    |   ✓   |       |     |     |                 |                 |
| Google      |   ✓    |   ✓   |   ✓   |  ✓  |     |        ✓        |        ✓        |
| Gradium     |        |       |       |  ✓  |     |                 |                 |
| Local CLI   |        |       |       |  ✓  |     |                 |                 |
| Microsoft   |        |       |       |  ✓  |     |                 |                 |
| MiniMax     |   ✓    |   ✓   |   ✓   |  ✓  |     |                 |                 |
| Mistral     |        |       |       |     |  ✓  |                 |                 |
| OpenAI      |   ✓    |   ✓   |       |  ✓  |  ✓  |        ✓        |        ✓        |
| OpenRouter  |   ✓    |   ✓   |       |  ✓  |     |                 |        ✓        |
| Qwen        |        |   ✓   |       |     |     |                 |                 |
| Runway      |        |   ✓   |       |     |     |                 |                 |
| SenseAudio  |        |       |       |     |  ✓  |                 |                 |
| Together    |        |   ✓   |       |     |     |                 |                 |
| Vydra       |   ✓    |   ✓   |       |  ✓  |     |                 |                 |
| xAI         |   ✓    |   ✓   |       |  ✓  |  ✓  |                 |        ✓        |
| Xiaomi MiMo |   ✓    |       |       |  ✓  |     |                 |        ✓        |

<Note>
Pemahaman media menggunakan model berkemampuan visi atau berkemampuan audio apa pun yang terdaftar
dalam konfigurasi penyedia Anda. Matriks di atas mencantumkan penyedia dengan dukungan
pemahaman media khusus; sebagian besar penyedia LLM multimodal (Anthropic, Google,
OpenAI, dll.) juga dapat memahami media masuk ketika dikonfigurasi sebagai model
balasan aktif.
</Note>

## Asinkron vs sinkron

| Kemampuan       | Mode      | Alasan                                                            |
| --------------- | --------- | ----------------------------------------------------------------- |
| Gambar          | Sinkron   | Respons penyedia kembali dalam hitungan detik; selesai sebaris dengan balasan. |
| Text-to-speech  | Sinkron   | Respons penyedia kembali dalam hitungan detik; dilampirkan ke audio balasan. |
| Video           | Asinkron  | Pemrosesan penyedia memerlukan 30 dtk hingga beberapa menit.      |
| Musik (bersama) | Asinkron  | Karakteristik pemrosesan penyedia sama seperti video.             |
| Musik (ComfyUI) | Sinkron   | Alur kerja lokal berjalan sebaris terhadap server ComfyUI yang dikonfigurasi. |

Untuk alat asinkron, OpenClaw mengirimkan permintaan ke penyedia, segera mengembalikan
id tugas, dan melacak pekerjaan di ledger tugas. Agen terus merespons pesan lain
selama pekerjaan berjalan. Ketika penyedia selesai, OpenClaw membangunkan agen agar
dapat memposting media yang sudah selesai kembali ke saluran asli.

## Speech-to-text dan Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio, dan xAI semuanya dapat mentranskripsikan
audio masuk melalui jalur batch `tools.media.audio` ketika dikonfigurasi.
Plugin saluran yang melakukan preflight catatan suara untuk gating sebutan atau penguraian
perintah menandai lampiran yang ditranskripsikan pada konteks masuk, sehingga pass
pemahaman media bersama menggunakan kembali transkrip itu alih-alih membuat panggilan
STT kedua untuk audio yang sama.

Deepgram, ElevenLabs, Mistral, OpenAI, dan xAI juga mendaftarkan penyedia STT
streaming Voice Call, sehingga audio telepon langsung dapat diteruskan ke vendor yang dipilih
tanpa menunggu rekaman selesai.

## Pemetaan penyedia (cara vendor terbagi di berbagai permukaan)

<AccordionGroup>
  <Accordion title="Google">
    Permukaan gambar, video, musik, TTS batch, suara realtime backend, dan
    pemahaman media.
  </Accordion>
  <Accordion title="OpenAI">
    Permukaan gambar, video, TTS batch, STT batch, STT streaming Voice Call, suara
    realtime backend, dan embedding memori.
  </Accordion>
  <Accordion title="DeepInfra">
    Routing chat/model, pembuatan/pengeditan gambar, teks-ke-video, TTS batch,
    STT batch, pemahaman media gambar, dan permukaan embedding memori.
    Model rerank/klasifikasi/deteksi-objek native DeepInfra tidak
    didaftarkan hingga OpenClaw memiliki kontrak penyedia khusus untuk
    kategori tersebut.
  </Accordion>
  <Accordion title="xAI">
    Gambar, video, pencarian, eksekusi kode, TTS batch, STT batch, dan STT streaming Voice
    Call. Suara xAI Realtime adalah kemampuan upstream tetapi belum
    didaftarkan di OpenClaw hingga kontrak suara realtime bersama dapat
    merepresentasikannya.
  </Accordion>
</AccordionGroup>

## Terkait

- [Pembuatan gambar](/id/tools/image-generation)
- [Pembuatan video](/id/tools/video-generation)
- [Pembuatan musik](/id/tools/music-generation)
- [Text-to-speech](/id/tools/tts)
- [Pemahaman media](/id/nodes/media-understanding)
- [Node audio](/id/nodes/audio)
