---
read_when:
    - Mencari gambaran umum tentang kemampuan media OpenClaw
    - Menentukan penyedia media mana yang akan dikonfigurasi
    - Memahami cara kerja pembuatan media asinkron
sidebarTitle: Media overview
summary: Sekilas tentang kemampuan gambar, video, musik, ucapan, dan pemahaman media
title: Ikhtisar media
x-i18n:
    generated_at: "2026-05-05T06:18:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw menghasilkan gambar, video, dan musik, memahami media masuk
(gambar, audio, video), dan mengucapkan balasan dengan lantang menggunakan text-to-speech. Semua
kemampuan media digerakkan oleh alat: agen memutuskan kapan menggunakannya berdasarkan
percakapan, dan setiap alat hanya muncul ketika setidaknya satu penyedia pendukung
telah dikonfigurasi.

## Kemampuan

<CardGroup cols={2}>
  <Card title="Image generation" href="/id/tools/image-generation" icon="image">
    Buat dan edit gambar dari prompt teks atau gambar referensi melalui
    `image_generate`. Sinkron — selesai sebaris dengan balasan.
  </Card>
  <Card title="Video generation" href="/id/tools/video-generation" icon="video">
    Text-to-video, image-to-video, dan video-to-video melalui `video_generate`.
    Asinkron — berjalan di latar belakang dan memposting hasil saat siap.
  </Card>
  <Card title="Music generation" href="/id/tools/music-generation" icon="music">
    Hasilkan musik atau trek audio melalui `music_generate`. Asinkron pada penyedia
    bersama; jalur alur kerja ComfyUI berjalan secara sinkron.
  </Card>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="microphone">
    Konversi balasan keluar menjadi audio lisan melalui alat `tts` plus
    konfigurasi `messages.tts`. Sinkron.
  </Card>
  <Card title="Media understanding" href="/id/nodes/media-understanding" icon="eye">
    Ringkas gambar, audio, dan video masuk menggunakan penyedia model
    berkemampuan visi dan Plugin pemahaman media khusus.
  </Card>
  <Card title="Speech-to-text" href="/id/nodes/audio" icon="ear-listen">
    Transkripsikan pesan suara masuk melalui penyedia STT batch atau STT streaming
    Voice Call.
  </Card>
</CardGroup>

## Matriks kemampuan penyedia

| Penyedia    | Gambar | Video | Musik | TTS | STT | Suara waktu nyata | Pemahaman media |
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
| OpenRouter  |   ✓   |   ✓   |       |  ✓  |     |                |          ✓          |
| Qwen        |       |   ✓   |       |     |     |                |                     |
| Runway      |       |   ✓   |       |     |     |                |                     |
| SenseAudio  |       |       |       |     |  ✓  |                |                     |
| Together    |       |   ✓   |       |     |     |                |                     |
| Vydra       |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
Pemahaman media menggunakan model berkemampuan visi atau berkemampuan audio apa pun yang terdaftar
dalam konfigurasi penyedia Anda. Matriks di atas mencantumkan penyedia dengan dukungan
pemahaman media khusus; sebagian besar penyedia LLM multimodal (Anthropic, Google,
OpenAI, dll.) juga dapat memahami media masuk saat dikonfigurasi sebagai model
balasan aktif.
</Note>

## Asinkron vs sinkron

| Kemampuan      | Mode         | Alasan                                                                                                  |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| Gambar           | Sinkron  | Respons penyedia kembali dalam hitungan detik; selesai sebaris dengan balasan.                                   |
| Text-to-speech  | Sinkron  | Respons penyedia kembali dalam hitungan detik; dilampirkan ke audio balasan.                                   |
| Video           | Asinkron | Pemrosesan penyedia membutuhkan 30 detik hingga beberapa menit; antrean lambat dapat berjalan hingga batas waktu yang dikonfigurasi. |
| Musik (bersama)  | Asinkron | Karakteristik pemrosesan penyedia yang sama seperti video.                                                    |
| Musik (ComfyUI) | Sinkron  | Alur kerja lokal berjalan sebaris terhadap server ComfyUI yang dikonfigurasi.                                    |

Untuk alat asinkron, OpenClaw mengirimkan permintaan ke penyedia, segera mengembalikan id
tugas, dan melacak pekerjaan di ledger tugas. Agen terus
merespons pesan lain saat pekerjaan berjalan. Ketika penyedia selesai,
OpenClaw membangunkan agen dengan jalur media yang dihasilkan agar dapat memberi tahu
pengguna dan, saat diwajibkan oleh kebijakan pengiriman sumber, meneruskan hasil melalui
alat pesan. Untuk rute grup/saluran khusus alat pesan, OpenClaw memperlakukan
bukti pengiriman alat pesan yang hilang sebagai percobaan penyelesaian yang gagal dan mengirim
fallback media yang dihasilkan langsung ke saluran asli.

## Speech-to-text dan Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio, dan xAI semuanya dapat mentranskripsikan
audio masuk melalui jalur batch `tools.media.audio` saat dikonfigurasi.
Plugin saluran yang melakukan preflight catatan suara untuk gating mention atau parsing
perintah menandai lampiran yang ditranskripsikan pada konteks masuk, sehingga proses
pemahaman media bersama menggunakan kembali transkrip tersebut alih-alih membuat panggilan
STT kedua untuk audio yang sama.

Deepgram, ElevenLabs, Mistral, OpenAI, dan xAI juga mendaftarkan penyedia STT streaming
Voice Call, sehingga audio telepon langsung dapat diteruskan ke vendor yang dipilih
tanpa menunggu rekaman selesai.

## Pemetaan penyedia (bagaimana vendor terbagi di berbagai permukaan)

<AccordionGroup>
  <Accordion title="Google">
    Permukaan gambar, video, musik, TTS batch, suara waktu nyata backend, dan
    pemahaman media.
  </Accordion>
  <Accordion title="OpenAI">
    Permukaan gambar, video, TTS batch, STT batch, STT streaming Voice Call, suara
    waktu nyata backend, dan penyematan memori.
  </Accordion>
  <Accordion title="DeepInfra">
    Permukaan routing chat/model, pembuatan/pengeditan gambar, text-to-video, TTS batch,
    STT batch, pemahaman media gambar, dan penyematan memori.
    Model rerank/klasifikasi/deteksi objek native DeepInfra tidak
    didaftarkan hingga OpenClaw memiliki kontrak penyedia khusus untuk
    kategori tersebut.
  </Accordion>
  <Accordion title="xAI">
    Gambar, video, pencarian, eksekusi kode, TTS batch, STT batch, dan STT streaming Voice
    Call. Suara waktu nyata xAI adalah kemampuan upstream tetapi
    tidak didaftarkan di OpenClaw hingga kontrak suara waktu nyata bersama dapat
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
