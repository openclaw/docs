---
read_when:
    - Mencari gambaran umum tentang kemampuan media OpenClaw
    - Menentukan penyedia media yang akan dikonfigurasi
    - Memahami cara kerja pembuatan media asinkron
sidebarTitle: Media overview
summary: Sekilas kemampuan gambar, video, musik, ucapan, dan pemahaman media
title: Gambaran umum media
x-i18n:
    generated_at: "2026-05-06T09:31:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201d01244fc6a587b730ae3033de5990b2f01f63e6e40339c738c95040e085b3
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw menghasilkan gambar, video, dan musik, memahami media masuk
(gambar, audio, video), dan mengucapkan balasan dengan lantang melalui text-to-speech. Semua
kemampuan media digerakkan oleh alat: agen memutuskan kapan menggunakannya berdasarkan
percakapan, dan setiap alat hanya muncul ketika setidaknya satu penyedia pendukung
telah dikonfigurasi.

Ucapan langsung menggunakan kontrak sesi Talk, bukan jalur alat media satu kali pakai.
Talk memiliki tiga mode: `realtime` native penyedia, `stt-tts` lokal atau streaming,
dan `transcription` untuk penangkapan ucapan hanya-observasi. Mode-mode tersebut
berbagi katalog penyedia, amplop peristiwa, dan semantik pembatalan dengan
telefoni, rapat, realtime browser, dan klien push-to-talk native.

## Kemampuan

<CardGroup cols={2}>
  <Card title="Pembuatan gambar" href="/id/tools/image-generation" icon="image">
    Buat dan edit gambar dari prompt teks atau gambar referensi melalui
    `image_generate`. Sinkron — selesai inline bersama balasan.
  </Card>
  <Card title="Pembuatan video" href="/id/tools/video-generation" icon="video">
    Teks-ke-video, gambar-ke-video, dan video-ke-video melalui `video_generate`.
    Asinkron — berjalan di latar belakang dan memposting hasil saat siap.
  </Card>
  <Card title="Pembuatan musik" href="/id/tools/music-generation" icon="music">
    Hasilkan musik atau trek audio melalui `music_generate`. Asinkron pada penyedia
    bersama; jalur alur kerja ComfyUI berjalan secara sinkron.
  </Card>
  <Card title="Text-to-speech" href="/id/tools/tts" icon="microphone">
    Konversi balasan keluar menjadi audio lisan melalui alat `tts` plus
    konfigurasi `messages.tts`. Sinkron.
  </Card>
  <Card title="Pemahaman media" href="/id/nodes/media-understanding" icon="eye">
    Ringkas gambar, audio, dan video masuk menggunakan penyedia model
    berkemampuan visi serta Plugin khusus pemahaman media.
  </Card>
  <Card title="Speech-to-text" href="/id/nodes/audio" icon="ear-listen">
    Transkripsikan pesan suara masuk melalui STT batch atau penyedia STT streaming
    Panggilan Suara.
  </Card>
</CardGroup>

## Matriks kemampuan penyedia

| Penyedia    | Gambar | Video | Musik | TTS | STT | Suara realtime | Pemahaman media |
| ----------- | :----: | :---: | :---: | :-: | :-: | :-------------: | :--------------: |
| Alibaba     |        |   ✓   |       |     |     |                 |                  |
| BytePlus    |        |   ✓   |       |     |     |                 |                  |
| ComfyUI     |   ✓    |   ✓   |   ✓   |     |     |                 |                  |
| DeepInfra   |   ✓    |   ✓   |       |  ✓  |  ✓  |                 |        ✓         |
| Deepgram    |        |       |       |     |  ✓  |        ✓        |                  |
| ElevenLabs  |        |       |       |  ✓  |  ✓  |                 |                  |
| fal         |   ✓    |   ✓   |       |     |     |                 |                  |
| Google      |   ✓    |   ✓   |   ✓   |  ✓  |     |        ✓        |        ✓         |
| Gradium     |        |       |       |  ✓  |     |                 |                  |
| Local CLI   |        |       |       |  ✓  |     |                 |                  |
| Microsoft   |        |       |       |  ✓  |     |                 |                  |
| MiniMax     |   ✓    |   ✓   |   ✓   |  ✓  |     |                 |                  |
| Mistral     |        |       |       |     |  ✓  |                 |                  |
| OpenAI      |   ✓    |   ✓   |       |  ✓  |  ✓  |        ✓        |        ✓         |
| OpenRouter  |   ✓    |   ✓   |       |  ✓  |     |                 |        ✓         |
| Qwen        |        |   ✓   |       |     |     |                 |                  |
| Runway      |        |   ✓   |       |     |     |                 |                  |
| SenseAudio  |        |       |       |     |  ✓  |                 |                  |
| Together    |        |   ✓   |       |     |     |                 |                  |
| Vydra       |   ✓    |   ✓   |       |  ✓  |     |                 |                  |
| xAI         |   ✓    |   ✓   |       |  ✓  |  ✓  |                 |        ✓         |
| Xiaomi MiMo |   ✓    |       |       |  ✓  |     |                 |        ✓         |

<Note>
Pemahaman media menggunakan model berkemampuan visi atau audio apa pun yang terdaftar
dalam konfigurasi penyedia Anda. Matriks di atas mencantumkan penyedia dengan dukungan
khusus pemahaman media; sebagian besar penyedia LLM multimodal (Anthropic, Google,
OpenAI, dll.) juga dapat memahami media masuk ketika dikonfigurasi sebagai model
balasan aktif.
</Note>

## Asinkron vs sinkron

| Kemampuan       | Mode      | Alasan                                                                                              |
| --------------- | --------- | --------------------------------------------------------------------------------------------------- |
| Gambar          | Sinkron   | Respons penyedia kembali dalam hitungan detik; selesai inline bersama balasan.                      |
| Text-to-speech  | Sinkron   | Respons penyedia kembali dalam hitungan detik; dilampirkan ke audio balasan.                        |
| Video           | Asinkron  | Pemrosesan penyedia memerlukan 30 dtk hingga beberapa menit; antrean lambat dapat berjalan hingga timeout yang dikonfigurasi. |
| Musik (bersama) | Asinkron  | Karakteristik pemrosesan penyedia yang sama seperti video.                                          |
| Musik (ComfyUI) | Sinkron   | Alur kerja lokal berjalan inline terhadap server ComfyUI yang dikonfigurasi.                        |

Untuk alat asinkron, OpenClaw mengirimkan permintaan ke penyedia, segera mengembalikan
id tugas, dan melacak pekerjaan dalam buku besar tugas. Agen terus merespons
pesan lain saat pekerjaan berjalan. Ketika penyedia selesai, OpenClaw membangunkan
agen dengan path media yang dihasilkan agar agen dapat memberi tahu pengguna dan,
ketika diwajibkan oleh kebijakan pengiriman sumber, meneruskan hasil melalui
alat pesan. Untuk rute grup/saluran khusus alat pesan, OpenClaw memperlakukan
bukti pengiriman alat pesan yang hilang sebagai upaya penyelesaian yang gagal dan mengirim
fallback media yang dihasilkan langsung ke saluran asli.

## Speech-to-text dan Panggilan Suara

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio, dan xAI semuanya dapat mentranskripsikan
audio masuk melalui jalur batch `tools.media.audio` ketika dikonfigurasi.
Plugin saluran yang melakukan preflight catatan suara untuk gating mention atau parsing
perintah menandai lampiran yang ditranskripsikan pada konteks masuk, sehingga pass
pemahaman media bersama menggunakan kembali transkrip tersebut alih-alih membuat panggilan
STT kedua untuk audio yang sama.

Deepgram, ElevenLabs, Mistral, OpenAI, dan xAI juga mendaftarkan penyedia STT streaming
Panggilan Suara, sehingga audio telepon langsung dapat diteruskan ke vendor yang dipilih
tanpa menunggu rekaman selesai.

Untuk percakapan pengguna langsung, prioritaskan [mode Talk](/id/nodes/talk). Lampiran audio
batch tetap berada di jalur media; realtime browser, push-to-talk native,
telefoni, dan audio rapat harus menggunakan peristiwa Talk dan katalog
bercakupan sesi yang dikembalikan oleh Gateway.

## Pemetaan penyedia (cara vendor terbagi di berbagai permukaan)

<AccordionGroup>
  <Accordion title="Google">
    Permukaan gambar, video, musik, TTS batch, suara realtime backend, dan
    pemahaman media.
  </Accordion>
  <Accordion title="OpenAI">
    Permukaan gambar, video, TTS batch, STT batch, STT streaming Panggilan Suara,
    suara realtime backend, dan embedding memori.
  </Accordion>
  <Accordion title="DeepInfra">
    Permukaan routing chat/model, pembuatan/pengeditan gambar, teks-ke-video, TTS batch,
    STT batch, pemahaman media gambar, dan embedding memori.
    Model rerank/klasifikasi/deteksi objek native DeepInfra tidak
    didaftarkan sampai OpenClaw memiliki kontrak penyedia khusus untuk kategori
    tersebut.
  </Accordion>
  <Accordion title="xAI">
    Gambar, video, pencarian, eksekusi kode, TTS batch, STT batch, dan STT streaming
    Panggilan Suara. Suara xAI Realtime adalah kemampuan upstream tetapi
    tidak didaftarkan di OpenClaw sampai kontrak suara realtime bersama dapat
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
- [Mode Talk](/id/nodes/talk)
