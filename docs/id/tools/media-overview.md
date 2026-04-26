---
read_when:
    - Mencari ikhtisar kapabilitas media OpenClaw
    - Menentukan penyedia media yang akan dikonfigurasi
    - Memahami cara kerja generasi media asinkron
sidebarTitle: Media overview
summary: Kapabilitas gambar, video, musik, ucapan, dan pemahaman media secara sekilas
title: Ikhtisar media
x-i18n:
    generated_at: "2026-04-26T11:40:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70be8062c01f57bf53ab08aad4f1561e3958adc94e478224821d722fd500e09f
    source_path: tools/media-overview.md
    workflow: 15
---

OpenClaw menghasilkan gambar, video, dan musik, memahami media masuk
(gambar, audio, video), dan mengucapkan balasan dengan text-to-speech. Semua
kapabilitas media digerakkan oleh tool: agen memutuskan kapan menggunakannya berdasarkan
percakapan, dan setiap tool hanya muncul saat setidaknya satu penyedia
pendukung dikonfigurasi.

## Kapabilitas

<CardGroup cols={2}>
  <Card title="Generasi gambar" href="/id/tools/image-generation" icon="image">
    Buat dan edit gambar dari prompt teks atau gambar referensi melalui
    `image_generate`. Sinkron — selesai sejalan dengan balasan.
  </Card>
  <Card title="Generasi video" href="/id/tools/video-generation" icon="video">
    Teks-ke-video, gambar-ke-video, dan video-ke-video melalui `video_generate`.
    Asinkron — berjalan di latar belakang dan memposting hasilnya saat siap.
  </Card>
  <Card title="Generasi musik" href="/id/tools/music-generation" icon="music">
    Hasilkan musik atau trek audio melalui `music_generate`. Asinkron pada
    penyedia bersama; jalur workflow ComfyUI berjalan secara sinkron.
  </Card>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="microphone">
    Ubah balasan keluar menjadi audio ujaran melalui tool `tts` ditambah
    konfigurasi `messages.tts`. Sinkron.
  </Card>
  <Card title="Pemahaman media" href="/id/nodes/media-understanding" icon="eye">
    Ringkas gambar, audio, dan video masuk menggunakan penyedia model
    berkemampuan vision dan plugin pemahaman media khusus.
  </Card>
  <Card title="Speech-to-text" href="/id/nodes/audio" icon="ear-listen">
    Transkripsikan pesan suara masuk melalui penyedia STT batch atau
    Voice Call streaming STT.
  </Card>
</CardGroup>

## Matriks kapabilitas penyedia

| Penyedia    | Gambar | Video | Musik | TTS | STT | Suara realtime | Pemahaman media |
| ----------- | :----: | :---: | :---: | :-: | :-: | :------------: | :-------------: |
| Alibaba     |        |   ✓   |       |     |     |                |                 |
| BytePlus    |        |   ✓   |       |     |     |                |                 |
| ComfyUI     |   ✓    |   ✓   |   ✓   |     |     |                |                 |
| Deepgram    |        |       |       |     |  ✓  |       ✓        |                 |
| ElevenLabs  |        |       |       |  ✓  |  ✓  |                |                 |
| fal         |   ✓    |   ✓   |       |     |     |                |                 |
| Google      |   ✓    |   ✓   |   ✓   |  ✓  |     |       ✓        |        ✓        |
| Gradium     |        |       |       |  ✓  |     |                |                 |
| Local CLI   |        |       |       |  ✓  |     |                |                 |
| Microsoft   |        |       |       |  ✓  |     |                |                 |
| MiniMax     |   ✓    |   ✓   |   ✓   |  ✓  |     |                |                 |
| Mistral     |        |       |       |     |  ✓  |                |                 |
| OpenAI      |   ✓    |   ✓   |       |  ✓  |  ✓  |       ✓        |        ✓        |
| Qwen        |        |   ✓   |       |     |     |                |                 |
| Runway      |        |   ✓   |       |     |     |                |                 |
| SenseAudio  |        |       |       |     |  ✓  |                |                 |
| Together    |        |   ✓   |       |     |     |                |                 |
| Vydra       |   ✓    |   ✓   |       |  ✓  |     |                |                 |
| xAI         |   ✓    |   ✓   |       |  ✓  |  ✓  |                |        ✓        |
| Xiaomi MiMo |   ✓    |       |       |  ✓  |     |                |        ✓        |

<Note>
Pemahaman media menggunakan model berkemampuan vision atau audio apa pun yang terdaftar
dalam konfigurasi penyedia Anda. Matriks di atas mencantumkan penyedia dengan dukungan
pemahaman media khusus; sebagian besar penyedia LLM multimodal (Anthropic, Google,
OpenAI, dll.) juga dapat memahami media masuk saat dikonfigurasi sebagai
model balasan aktif.
</Note>

## Asinkron vs sinkron

| Kapabilitas    | Mode        | Alasan                                                             |
| -------------- | ----------- | ------------------------------------------------------------------ |
| Gambar         | Sinkron     | Respons penyedia kembali dalam hitungan detik; selesai sejalan dengan balasan. |
| Text-to-speech | Sinkron     | Respons penyedia kembali dalam hitungan detik; dilampirkan ke audio balasan. |
| Video          | Asinkron    | Pemrosesan penyedia memerlukan 30 dtk hingga beberapa menit.      |
| Musik (bersama)  | Asinkron  | Karakteristik pemrosesan penyedia sama seperti video.              |
| Musik (ComfyUI) | Sinkron    | Workflow lokal berjalan sejalan terhadap server ComfyUI yang dikonfigurasi. |

Untuk tool asinkron, OpenClaw mengirim permintaan ke penyedia, segera mengembalikan
id tugas, dan melacak job dalam task ledger. Agen tetap melanjutkan
membalas pesan lain saat job berjalan. Ketika penyedia selesai,
OpenClaw membangunkan agen agar dapat memposting media yang sudah selesai kembali ke
kanal asal.

## Speech-to-text dan Voice Call

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio, dan xAI semuanya dapat mentranskripsikan
audio masuk melalui jalur batch `tools.media.audio` saat dikonfigurasi.
Plugin kanal yang melakukan preflight pada voice note untuk mention gating atau
parsing perintah menandai lampiran yang ditranskripsikan pada konteks masuk, sehingga pass
pemahaman media bersama menggunakan ulang transkrip tersebut alih-alih membuat panggilan
STT kedua untuk audio yang sama.

Deepgram, ElevenLabs, Mistral, OpenAI, dan xAI juga mendaftarkan penyedia
Voice Call streaming STT, sehingga audio telepon langsung dapat diteruskan ke vendor
yang dipilih tanpa menunggu rekaman selesai.

## Pemetaan penyedia (bagaimana vendor dibagi di berbagai permukaan)

<AccordionGroup>
  <Accordion title="Google">
    Permukaan gambar, video, musik, TTS batch, suara realtime backend, dan
    pemahaman media.
  </Accordion>
  <Accordion title="OpenAI">
    Permukaan gambar, video, TTS batch, STT batch, Voice Call streaming STT, suara
    realtime backend, dan memory-embedding.
  </Accordion>
  <Accordion title="xAI">
    Gambar, video, pencarian, eksekusi kode, TTS batch, STT batch, dan Voice
    Call streaming STT. Suara xAI Realtime adalah kapabilitas upstream tetapi
    belum didaftarkan di OpenClaw sampai kontrak shared realtime-voice dapat
    merepresentasikannya.
  </Accordion>
</AccordionGroup>

## Terkait

- [Generasi gambar](/id/tools/image-generation)
- [Generasi video](/id/tools/video-generation)
- [Generasi musik](/id/tools/music-generation)
- [Text-to-speech](/id/tools/tts)
- [Pemahaman media](/id/nodes/media-understanding)
- [Node audio](/id/nodes/audio)
