---
read_when:
    - Mencari ikhtisar kemampuan media OpenClaw
    - Menentukan penyedia media mana yang akan dikonfigurasi
    - Memahami cara kerja pembuatan media asinkron
sidebarTitle: Media overview
summary: Sekilas tentang kemampuan gambar, video, musik, ucapan, dan pemahaman media
title: Ikhtisar media
x-i18n:
    generated_at: "2026-06-27T18:19:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw menghasilkan gambar, video, dan musik, memahami media masuk
(gambar, audio, video), dan mengucapkan balasan dengan text-to-speech. Semua
kemampuan media digerakkan oleh tool: agen memutuskan kapan menggunakannya
berdasarkan percakapan, dan setiap tool hanya muncul ketika setidaknya satu
provider pendukung dikonfigurasi.

Ucapan langsung menggunakan kontrak sesi Talk, bukan jalur tool media sekali
jalan. Talk memiliki tiga mode: `realtime` native provider, `stt-tts` lokal
atau streaming, dan `transcription` untuk penangkapan ucapan hanya-observasi.
Mode-mode tersebut berbagi katalog provider, envelope peristiwa, dan semantik
pembatalan dengan telefoni, rapat, realtime browser, dan klien native
push-to-talk.

## Kemampuan

<CardGroup cols={2}>
  <Card title="Image generation" href="/id/tools/image-generation" icon="image">
    Buat dan edit gambar dari prompt teks atau gambar referensi melalui
    `image_generate`. Asinkron dalam sesi chat — berjalan di latar belakang dan
    memposting hasilnya saat siap.
  </Card>
  <Card title="Video generation" href="/id/tools/video-generation" icon="video">
    Teks-ke-video, gambar-ke-video, dan video-ke-video melalui `video_generate`.
    Asinkron — berjalan di latar belakang dan memposting hasilnya saat siap.
  </Card>
  <Card title="Music generation" href="/id/tools/music-generation" icon="music">
    Hasilkan musik atau trek audio melalui `music_generate`. Asinkron dalam sesi
    chat pada siklus hidup tugas pembuatan media bersama.
  </Card>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="microphone">
    Konversi balasan keluar menjadi audio lisan melalui tool `tts` plus
    konfigurasi `messages.tts`. Sinkron.
  </Card>
  <Card title="Media understanding" href="/id/nodes/media-understanding" icon="eye">
    Ringkas gambar, audio, dan video masuk menggunakan provider model yang
    mendukung vision dan plugin pemahaman media khusus.
  </Card>
  <Card title="Speech-to-text" href="/id/nodes/audio" icon="ear-listen">
    Transkripsikan pesan suara masuk melalui STT batch atau provider STT
    streaming Panggilan Suara.
  </Card>
</CardGroup>

## Matriks kemampuan provider

| Provider          | Gambar | Video | Musik | TTS | STT | Suara realtime | Pemahaman media |
| ----------------- | :----: | :---: | :---: | :-: | :-: | :------------: | :-------------: |
| Alibaba           |        |   ✓   |       |     |     |                |                 |
| BytePlus          |        |   ✓   |       |     |     |                |                 |
| ComfyUI           |   ✓    |   ✓   |   ✓   |     |     |                |                 |
| DeepInfra         |   ✓    |   ✓   |       |  ✓  |  ✓  |                |        ✓        |
| Deepgram          |        |       |       |     |  ✓  |       ✓        |                 |
| ElevenLabs        |        |       |       |  ✓  |  ✓  |                |                 |
| fal               |   ✓    |   ✓   |   ✓   |     |     |                |                 |
| Google            |   ✓    |   ✓   |   ✓   |  ✓  |     |       ✓        |        ✓        |
| Gradium           |        |       |       |  ✓  |     |                |                 |
| Local CLI         |        |       |       |  ✓  |     |                |                 |
| Microsoft         |        |       |       |  ✓  |     |                |                 |
| Microsoft Foundry |   ✓    |       |       |     |     |                |                 |
| MiniMax           |   ✓    |   ✓   |   ✓   |  ✓  |     |                |                 |
| Mistral           |        |       |       |     |  ✓  |                |                 |
| OpenAI            |   ✓    |   ✓   |       |  ✓  |  ✓  |       ✓        |        ✓        |
| OpenRouter        |   ✓    |   ✓   |   ✓   |  ✓  |  ✓  |                |        ✓        |
| Qwen              |        |   ✓   |       |     |     |                |                 |
| Runway            |        |   ✓   |       |     |     |                |                 |
| SenseAudio        |        |       |       |     |  ✓  |                |                 |
| Together          |        |   ✓   |       |     |     |                |                 |
| Vydra             |   ✓    |   ✓   |       |  ✓  |     |                |                 |
| xAI               |   ✓    |   ✓   |       |  ✓  |  ✓  |                |        ✓        |
| Xiaomi MiMo       |   ✓    |       |       |  ✓  |     |                |        ✓        |

<Note>
Pemahaman media menggunakan model apa pun yang mendukung vision atau audio yang
terdaftar dalam konfigurasi provider Anda. Matriks di atas mencantumkan
provider dengan dukungan pemahaman media khusus; sebagian besar provider LLM
multimodal (Anthropic, Google, OpenAI, dll.) juga dapat memahami media masuk
ketika dikonfigurasi sebagai model balasan aktif.
</Note>

## Asinkron vs sinkron

| Kemampuan      | Mode      | Alasan                                                                                               |
| -------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| Gambar         | Asinkron  | Pemrosesan provider dapat melampaui giliran chat; lampiran yang dihasilkan menggunakan jalur penyelesaian bersama. |
| Text-to-speech | Sinkron   | Respons provider kembali dalam hitungan detik; dilampirkan ke audio balasan.                         |
| Video          | Asinkron  | Pemrosesan provider memerlukan 30 detik hingga beberapa menit; antrean lambat dapat berjalan hingga timeout yang dikonfigurasi. |
| Musik          | Asinkron  | Karakteristik pemrosesan provider sama seperti video.                                                |

Untuk tool asinkron, OpenClaw mengirimkan permintaan ke provider, segera
mengembalikan id tugas, dan melacak job dalam ledger tugas. Agen terus
menanggapi pesan lain selama job berjalan. Ketika provider selesai, OpenClaw
membangunkan agen dengan path media yang dihasilkan agar agen dapat memberi
tahu pengguna melalui mode balasan-terlihat normal sesi: pengiriman balasan
final otomatis ketika dikonfigurasi, atau `message(action="send")` ketika sesi
memerlukan tool pesan. Jika sesi peminta tidak aktif atau wake aktifnya gagal,
dan sebagian media yang dihasilkan masih hilang dari balasan penyelesaian,
OpenClaw mengirim fallback langsung idempotent hanya dengan media yang hilang.
Media yang sudah dikirim oleh balasan penyelesaian tidak diposting lagi.

## Speech-to-text dan Panggilan Suara

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio, dan xAI semuanya dapat mentranskripsikan
audio masuk melalui jalur batch `tools.media.audio` ketika dikonfigurasi.
Plugin channel yang melakukan preflight catatan suara untuk gating mention atau
parsing perintah menandai lampiran yang ditranskripsi pada konteks masuk,
sehingga pass pemahaman media bersama menggunakan ulang transkrip tersebut
alih-alih membuat panggilan STT kedua untuk audio yang sama.

Deepgram, ElevenLabs, Mistral, OpenAI, dan xAI juga mendaftarkan provider STT
streaming Panggilan Suara, sehingga audio telepon langsung dapat diteruskan ke
vendor yang dipilih tanpa menunggu rekaman selesai.

Untuk percakapan pengguna langsung, pilih [mode Talk](/id/nodes/talk). Lampiran
audio batch tetap berada pada jalur media; realtime browser, push-to-talk
native, telefoni, dan audio rapat harus menggunakan peristiwa Talk dan katalog
bercakupan sesi yang dikembalikan oleh Gateway.

## Pemetaan provider (cara vendor terbagi di berbagai surface)

<AccordionGroup>
  <Accordion title="Google">
    Surface gambar, video, musik, TTS batch, suara realtime backend, dan
    pemahaman media.
  </Accordion>
  <Accordion title="OpenAI">
    Surface gambar, video, TTS batch, STT batch, STT streaming Panggilan Suara,
    suara realtime backend, dan embedding memori.
  </Accordion>
  <Accordion title="DeepInfra">
    Surface routing chat/model, pembuatan/pengeditan gambar, teks-ke-video,
    TTS batch, STT batch, pemahaman media gambar, dan embedding memori.
    Model rerank/klasifikasi/deteksi-objek native DeepInfra tidak didaftarkan
    sampai OpenClaw memiliki kontrak provider khusus untuk kategori tersebut.
  </Accordion>
  <Accordion title="xAI">
    Gambar, video, pencarian, eksekusi kode, TTS batch, STT batch, dan STT
    streaming Panggilan Suara. Suara Realtime xAI adalah kemampuan upstream
    tetapi tidak didaftarkan di OpenClaw sampai kontrak suara-realtime bersama
    dapat merepresentasikannya.
  </Accordion>
</AccordionGroup>

## Terkait

- [Pembuatan gambar](/id/tools/image-generation)
- [Pembuatan video](/id/tools/video-generation)
- [Pembuatan musik](/id/tools/music-generation)
- [Text-to-speech](/id/tools/tts)
- [Pemahaman media](/id/nodes/media-understanding)
- [Node audio](/id/nodes/audio)
- [Mode Talk](/id/nodes/talk)
