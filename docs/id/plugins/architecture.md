---
read_when:
    - Membangun atau men-debug plugin native OpenClaw
    - Memahami model kapabilitas Plugin atau batas kepemilikan
    - Mengerjakan pipeline pemuatan Plugin atau registri
    - Mengimplementasikan hook runtime penyedia atau plugin kanal
sidebarTitle: Internals
summary: 'Internal Plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-07-20T03:54:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 28910ea251a40dd0840726f9f6f6aa65d3bf33b385b0cc61748f14b5ce4c0ee9
    source_path: plugins/architecture.md
    workflow: 16
---

Ini adalah **referensi arsitektur mendalam** untuk sistem plugin OpenClaw. Untuk panduan praktis, mulailah dengan salah satu halaman yang berfokus pada topik tertentu di bawah ini.

<CardGroup cols={2}>
  <Card title="Menginstal dan menggunakan plugin" icon="plug" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menambahkan, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Membangun plugin" icon="rocket" href="/id/plugins/building-plugins">
    Tutorial plugin pertama dengan manifes fungsional terkecil.
  </Card>
  <Card title="Plugin saluran" icon="comments" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin saluran perpesanan.
  </Card>
  <Card title="Plugin penyedia" icon="microchip" href="/id/plugins/sdk-provider-plugins">
    Bangun plugin penyedia model.
  </Card>
  <Card title="Ikhtisar SDK" icon="book" href="/id/plugins/sdk-overview">
    Referensi peta impor dan API pendaftaran.
  </Card>
</CardGroup>

## Model kapabilitas publik

Kapabilitas adalah model **plugin native** publik di dalam OpenClaw. Setiap plugin native OpenClaw mendaftar pada satu atau beberapa jenis kapabilitas:

| Kapabilitas            | Metode pendaftaran                              | Contoh plugin                   |
| ---------------------- | ------------------------------------------------ | ------------------------------ |
| Inferensi teks         | `api.registerProvider(...)`                      | `anthropic`, `openai`          |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | `anthropic`, `openai`          |
| Embedding              | `api.registerEmbeddingProvider(...)`             | Plugin vektor milik penyedia   |
| Ucapan                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`      |
| Transkripsi waktu nyata | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Suara waktu nyata      | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`             |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`             |
| Sumber transkrip       | `api.registerTranscriptSourceProvider(...)`      | `discord`                      |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`      |
| Pembuatan musik        | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`     |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`        |
| Pengambilan web        | `api.registerWebFetchProvider(...)`              | `firecrawl`                    |
| Pencarian web          | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google` |
| Saluran / perpesanan   | `api.registerChannel(...)`                       | `matrix`, `msteams`            |
| Penemuan Gateway       | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                      |

<Note>
Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, alat, layanan penemuan, atau layanan latar belakang adalah plugin **lama khusus hook**. Pola tersebut masih didukung sepenuhnya.
</Note>

### Sikap terhadap kompatibilitas eksternal

Model kapabilitas telah diterapkan di inti dan digunakan oleh plugin bawaan/native saat ini, tetapi kompatibilitas plugin eksternal masih membutuhkan standar yang lebih ketat daripada "sudah diekspor, maka sudah dibekukan."

| Situasi plugin                                   | Panduan                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin eksternal yang sudah ada                   | Pertahankan agar integrasi berbasis hook tetap berfungsi; ini adalah dasar kompatibilitas.       |
| Plugin bawaan/native baru                         | Utamakan pendaftaran kapabilitas eksplisit daripada akses khusus vendor atau desain baru khusus hook. |
| Plugin eksternal yang mengadopsi pendaftaran kapabilitas | Diizinkan, tetapi perlakukan permukaan pembantu khusus kapabilitas sebagai sesuatu yang masih berkembang kecuali dokumentasi menandainya stabil. |

Pendaftaran kapabilitas adalah arah yang dituju. Hook lama tetap menjadi jalur teraman tanpa kerusakan bagi plugin eksternal selama transisi. Tidak semua subjalur pembantu yang diekspor setara — utamakan kontrak sempit yang terdokumentasi daripada ekspor pembantu insidental.

### Bentuk plugin

OpenClaw mengklasifikasikan setiap plugin yang dimuat ke dalam suatu bentuk berdasarkan perilaku pendaftaran aktualnya (bukan hanya metadata statis):

<AccordionGroup>
  <Accordion title="kapabilitas-tunggal">
    Mendaftarkan tepat satu jenis kapabilitas (misalnya plugin khusus penyedia seperti `arcee` atau `chutes`).
  </Accordion>
  <Accordion title="kapabilitas-hibrida">
    Mendaftarkan beberapa jenis kapabilitas (misalnya `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan gambar).
  </Accordion>
  <Accordion title="khusus-hook">
    Hanya mendaftarkan hook (bertipe atau kustom), tanpa kapabilitas, alat, perintah, atau layanan.
  </Accordion>
  <Accordion title="non-kapabilitas">
    Mendaftarkan alat, perintah, layanan, atau rute, tetapi tanpa kapabilitas.
  </Accordion>
</AccordionGroup>

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk dan perincian kapabilitas suatu plugin. Lihat [referensi CLI](/id/cli/plugins#inspect) untuk detailnya.

### Sinyal kompatibilitas

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all`, dan `openclaw plugins doctor` menampilkan pemberitahuan kompatibilitas berikut:

| Sinyal                                     | Arti                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **konfigurasi valid**                      | Konfigurasi berhasil diurai dan plugin dapat ditemukan                                                      |
| **khusus-hook** (info)                     | Plugin hanya mendaftarkan hook; jalur yang didukung, tetapi belum dimigrasikan ke pendaftaran kapabilitas    |
| **API embedding memori yang tidak digunakan lagi** (peringatan) | Plugin non-bawaan menggunakan API penyedia embedding khusus memori yang lama, bukan `registerEmbeddingProvider` |
| **galat fatal**                            | Konfigurasi tidak valid atau plugin gagal dimuat                                                            |

Tidak satu pun sinyal anjuran/peringatan tersebut merusak plugin Anda saat ini. Sinyal ini juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Ikhtisar arsitektur

Sistem plugin OpenClaw memiliki empat lapisan:

<Steps>
  <Step title="Manifes + penemuan">
    OpenClaw menemukan kandidat plugin dari jalur yang dikonfigurasi, root ruang kerja, root plugin global, dan plugin bawaan. Penemuan terlebih dahulu membaca manifes native `openclaw.plugin.json` beserta manifes bundel yang didukung.
  </Step>
  <Step title="Pengaktifan + validasi">
    Inti menentukan apakah plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau dipilih untuk slot eksklusif seperti memori.
  </Step>
  <Step title="Pemuatan runtime">
    Plugin native OpenClaw dimuat dalam proses dan mendaftarkan kapabilitas ke registri pusat. JavaScript terpaket dimuat melalui `require` native; TypeScript sumber lokal pihak ketiga adalah fallback Jiti darurat. Bundel yang kompatibel dinormalisasi menjadi catatan registri tanpa mengimpor kode runtime.
  </Step>
  <Step title="Konsumsi permukaan">
    Bagian OpenClaw lainnya membaca registri untuk mengekspos alat, saluran, penyiapan penyedia, hook, rute HTTP, perintah CLI, dan layanan.
  </Step>
</Steps>

Khusus untuk CLI plugin, penemuan perintah root dibagi menjadi dua fase:

- metadata waktu penguraian berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI plugin yang sebenarnya dapat tetap dimuat secara malas dan mendaftar saat pemanggilan pertama

Hal itu mempertahankan kode CLI milik plugin di dalam plugin sambil tetap memungkinkan OpenClaw mencadangkan nama perintah root sebelum penguraian.

Batas desain yang penting:

- validasi manifes/konfigurasi harus berfungsi dari **metadata manifes/skema** tanpa mengeksekusi kode plugin
- penemuan kapabilitas native dapat memuat kode entri plugin tepercaya untuk membangun snapshot registri yang tidak mengaktifkan
- perilaku runtime native berasal dari jalur `register(api)` modul plugin dengan `api.registrationMode === "full"`

Pemisahan tersebut memungkinkan OpenClaw memvalidasi konfigurasi, menjelaskan plugin yang hilang/dinonaktifkan, serta membangun petunjuk UI/skema sebelum runtime lengkap aktif.

### Snapshot metadata plugin dan tabel pencarian

Saat dimulai, Gateway membangun satu `PluginMetadataSnapshot` untuk snapshot konfigurasi saat ini. Snapshot tersebut hanya berisi metadata: snapshot menyimpan indeks plugin yang terinstal, registri manifes, diagnostik manifes, peta pemilik, penormal id plugin, dan catatan manifes. Snapshot tersebut tidak menyimpan modul plugin yang dimuat, SDK penyedia, isi paket, atau ekspor runtime.

Validasi konfigurasi yang memahami plugin, pengaktifan otomatis saat mulai, dan bootstrap plugin Gateway menggunakan snapshot tersebut, alih-alih membangun ulang metadata manifes/indeks secara terpisah. `PluginLookUpTable` diturunkan dari snapshot yang sama dan menambahkan rencana plugin awal untuk konfigurasi runtime saat ini.

Setelah dimulai, Gateway mempertahankan snapshot metadata saat ini sebagai produk runtime yang dapat diganti. Penemuan penyedia runtime berulang dapat meminjam snapshot tersebut alih-alih merekonstruksi indeks yang terinstal dan registri manifes untuk setiap lintasan katalog penyedia. Snapshot dihapus atau diganti saat Gateway dimatikan, ketika konfigurasi/inventaris plugin berubah, dan ketika indeks yang terinstal ditulis; pemanggil kembali ke jalur manifes/indeks dingin jika tidak ada snapshot saat ini yang kompatibel. Pemeriksaan kompatibilitas harus mencakup root penemuan plugin seperti `plugins.load.paths` dan ruang kerja agen default, karena plugin ruang kerja merupakan bagian dari cakupan metadata.

Snapshot dan tabel pencarian mempertahankan keputusan awal berulang pada jalur cepat:

- kepemilikan saluran
- permulaan saluran yang ditangguhkan
- id plugin awal
- kepemilikan penyedia dan backend CLI
- kepemilikan penyedia penyiapan, alias perintah, penyedia katalog model, dan kontrak manifes
- validasi skema konfigurasi plugin dan skema konfigurasi saluran
- keputusan pengaktifan otomatis saat mulai

Batas keamanannya adalah penggantian snapshot, bukan mutasi. Bangun ulang snapshot ketika konfigurasi, inventaris plugin, catatan instalasi, atau kebijakan indeks persisten berubah. Jangan memperlakukannya sebagai registri global luas yang dapat dimutasi, dan jangan menyimpan snapshot historis tanpa batas. Pemuatan plugin runtime tetap terpisah dari snapshot metadata agar status runtime yang kedaluwarsa tidak dapat disembunyikan di balik cache metadata.

Aturan cache didokumentasikan dalam [Internal arsitektur plugin](/id/plugins/architecture-internals#plugin-cache-boundary): metadata manifes dan penemuan selalu baru kecuali pemanggil memegang snapshot, tabel pencarian, atau registri manifes eksplisit untuk alur saat ini. Cache metadata tersembunyi dan TTL berbasis waktu dinding bukan bagian dari pemuatan plugin. Hanya cache pemuat runtime, modul, dan artefak dependensi yang boleh tetap ada setelah kode atau artefak terinstal benar-benar dimuat.

Beberapa pemanggil jalur dingin masih merekonstruksi registri manifes secara langsung dari indeks plugin terinstal yang persisten, alih-alih menerima `PluginLookUpTable` Gateway. Jalur tersebut kini merekonstruksi registri sesuai permintaan; utamakan penerusan tabel pencarian saat ini atau registri manifes eksplisit melalui alur runtime jika pemanggil sudah memilikinya.

### Perencanaan aktivasi

Perencanaan aktivasi merupakan bagian dari bidang kontrol. Pemanggil dapat menanyakan plugin mana yang relevan untuk perintah, penyedia, saluran, rute, harness agen, atau kapabilitas tertentu sebelum memuat registri runtime yang lebih luas.

Perencana mempertahankan kompatibilitas perilaku manifes saat ini:

- bidang `activation.*` adalah petunjuk perencana eksplisit
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, dan hook tetap menjadi fallback kepemilikan manifes
- API perencana khusus id tetap tersedia bagi pemanggil yang ada
- API rencana melaporkan label alasan agar diagnostik dapat membedakan petunjuk eksplisit dari fallback kepemilikan

<Warning>
Jangan perlakukan `activation` sebagai hook siklus hidup atau pengganti `register(...)`. Ini adalah metadata yang digunakan untuk mempersempit pemuatan. Utamakan bidang kepemilikan jika sudah menjelaskan hubungan tersebut; gunakan `activation` hanya untuk petunjuk perencana tambahan.
</Warning>

### Plugin saluran dan alat pesan bersama

Plugin saluran tidak perlu mendaftarkan alat kirim/edit/reaksi terpisah untuk tindakan obrolan biasa. OpenClaw mempertahankan satu alat `message` bersama di inti, sedangkan plugin saluran memiliki penemuan dan eksekusi khusus saluran di baliknya.

Batas saat ini adalah:

- inti memiliki host alat `message` bersama, pengawatan prompt, pencatatan sesi/utas, dan pengiriman eksekusi
- plugin saluran memiliki penemuan tindakan terbatas, penemuan kapabilitas, dan setiap fragmen skema khusus saluran
- plugin saluran memiliki tata bahasa percakapan sesi khusus penyedia, seperti cara id percakapan mengodekan id utas atau diwariskan dari percakapan induk
- plugin saluran mengeksekusi tindakan akhir melalui adaptor tindakannya

Untuk plugin saluran, permukaan SDK-nya adalah `ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan penemuan terpadu tersebut memungkinkan plugin mengembalikan tindakan, kapabilitas, dan kontribusi skema yang terlihat secara bersamaan agar bagian-bagian tersebut tidak menyimpang satu sama lain.

Nama tindakan pesan menggunakan kosakata tertutup yang sengaja dimiliki inti agar setiap transportasi dapat merender setiap tindakan. Plugin menambahkan nama tindakan melalui PR inti; pendaftaran saat runtime sengaja tidak didukung.

Saat parameter alat pesan khusus saluran membawa sumber media seperti jalur lokal atau URL media jarak jauh, plugin juga harus mengembalikan `mediaSourceParams` dari `describeMessageTool(...)`. Inti menggunakan daftar eksplisit tersebut untuk menerapkan normalisasi jalur sandbox dan petunjuk akses media keluar tanpa mengodekan nama parameter milik plugin secara permanen. Utamakan peta yang dicakup per tindakan di sana, bukan satu daftar datar untuk seluruh saluran, agar parameter media khusus profil tidak dinormalisasi pada tindakan yang tidak terkait seperti `send`.

Inti meneruskan cakupan runtime ke langkah penemuan tersebut. Bidang penting meliputi:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` masuk tepercaya

Hal tersebut penting bagi plugin yang peka terhadap konteks. Sebuah saluran dapat menyembunyikan atau menampilkan tindakan pesan berdasarkan akun aktif, ruang/utas/pesan saat ini, atau identitas pemohon tepercaya tanpa mengodekan cabang khusus saluran secara permanen dalam alat `message` inti.

Inilah alasan perubahan perutean runner tertanam tetap merupakan pekerjaan plugin: runner bertanggung jawab meneruskan identitas obrolan/sesi saat ini ke batas penemuan plugin agar alat `message` bersama menampilkan permukaan milik saluran yang tepat untuk giliran saat ini.

Untuk pembantu eksekusi milik saluran, plugin terbundel harus menyimpan runtime eksekusi di dalam modul pluginnya sendiri. Inti tidak lagi memiliki runtime tindakan pesan Discord, Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`. Kami tidak memublikasikan subjalur `plugin-sdk/*-action-runtime` terpisah, dan plugin terbundel harus mengimpor kode runtime lokalnya sendiri secara langsung dari modul milik plugin tersebut.

Batas yang sama berlaku bagi seam SDK bernama penyedia secara umum: inti tidak boleh mengimpor barrel praktis khusus saluran untuk Discord, Signal, Slack, WhatsApp, atau plugin serupa. Jika inti memerlukan suatu perilaku, gunakan barrel `api.ts` / `runtime-api.ts` milik plugin terbundel itu sendiri atau promosikan kebutuhan tersebut menjadi kapabilitas generik sempit dalam SDK bersama.

Plugin terbundel mengikuti aturan yang sama. `runtime-api.ts` milik plugin terbundel tidak boleh mengekspor ulang fasad `openclaw/plugin-sdk/<plugin-id>` bermereknya sendiri. Fasad bermerek tersebut tetap menjadi shim kompatibilitas bagi plugin eksternal dan konsumen lama, tetapi plugin terbundel harus menggunakan ekspor lokal ditambah subjalur SDK generik sempit seperti `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, atau `openclaw/plugin-sdk/webhook-ingress`. Kode baru tidak boleh menambahkan fasad SDK khusus id plugin kecuali batas kompatibilitas untuk ekosistem eksternal yang sudah ada memerlukannya.

Khusus untuk jajak pendapat, terdapat dua jalur eksekusi:

- `outbound.sendPoll` adalah dasar bersama bagi saluran yang sesuai dengan model jajak pendapat umum
- `actions.handleAction("poll")` adalah jalur yang diutamakan untuk semantik jajak pendapat khusus saluran atau parameter jajak pendapat tambahan

Inti kini menunda penguraian jajak pendapat bersama hingga setelah pengiriman jajak pendapat plugin menolak tindakan tersebut, sehingga pengendali jajak pendapat milik plugin dapat menerima bidang jajak pendapat khusus saluran tanpa terlebih dahulu diblokir oleh pengurai jajak pendapat generik.

Lihat [internal arsitektur Plugin](/id/plugins/architecture-internals) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan plugin native sebagai batas kepemilikan bagi sebuah **perusahaan** atau **fitur**, bukan sebagai kumpulan integrasi yang tidak saling terkait.

Artinya:

- plugin perusahaan biasanya harus memiliki seluruh permukaan perusahaan tersebut yang menghadap OpenClaw
- plugin fitur biasanya harus memiliki seluruh permukaan fitur yang diperkenalkannya
- saluran harus menggunakan kapabilitas inti bersama alih-alih mengimplementasikan ulang perilaku penyedia secara ad hoc

<AccordionGroup>
  <Accordion title="Multi-kapabilitas vendor">
    `google` memiliki inferensi teks, backend CLI, embedding, ujaran, suara realtime, pemahaman media, pembuatan gambar/musik/video, dan pencarian web. `openai` memiliki inferensi teks, embedding, ujaran, transkripsi realtime, suara realtime, pemahaman media, serta pembuatan gambar/video. `minimax` memiliki inferensi teks ditambah pemahaman media, ujaran, pembuatan gambar/musik/video, dan pencarian web.
  </Accordion>
  <Accordion title="Kapabilitas tunggal vendor">
    `arcee` dan `chutes` hanya memiliki inferensi teks; `microsoft` hanya memiliki ujaran. Plugin vendor dapat tetap sesempit ini hingga perlu mencakup lebih banyak permukaan vendor tersebut.
  </Accordion>
  <Accordion title="Plugin fitur">
    `voice-call` memiliki transportasi panggilan, alat, CLI, rute, dan penghubungan stream media Twilio, tetapi menggunakan kapabilitas ujaran, transkripsi realtime, dan suara realtime bersama alih-alih mengimpor plugin vendor secara langsung.
  </Accordion>
</AccordionGroup>

Kondisi akhir yang dimaksud adalah:

- permukaan vendor yang menghadap OpenClaw berada dalam satu plugin meskipun mencakup model teks, ujaran, gambar, dan video
- vendor lain dapat melakukan hal yang sama untuk area permukaannya sendiri
- saluran tidak memedulikan plugin vendor mana yang memiliki penyedia; saluran menggunakan kontrak kapabilitas bersama yang diekspos oleh inti

Inilah perbedaan utamanya:

- **plugin** = batas kepemilikan
- **kapabilitas** = kontrak inti yang dapat diimplementasikan atau digunakan oleh beberapa plugin

Jadi, jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama bukanlah "penyedia mana yang harus mengodekan penanganan video secara permanen?" Pertanyaan pertama adalah "apa kontrak kapabilitas video inti?" Setelah kontrak tersebut tersedia, plugin vendor dapat mendaftar terhadapnya dan plugin saluran/fitur dapat menggunakannya.

Jika kapabilitas tersebut belum tersedia, langkah yang tepat biasanya adalah:

<Steps>
  <Step title="Tentukan kapabilitas">
    Tentukan kapabilitas yang belum tersedia di inti.
  </Step>
  <Step title="Ekspos melalui SDK">
    Ekspos kapabilitas tersebut melalui API/runtime plugin dengan cara bertipe.
  </Step>
  <Step title="Hubungkan konsumen">
    Hubungkan saluran/fitur dengan kapabilitas tersebut.
  </Step>
  <Step title="Implementasi vendor">
    Biarkan plugin vendor mendaftarkan implementasi.
  </Step>
</Steps>

Hal ini menjaga kepemilikan tetap eksplisit sekaligus menghindari perilaku inti yang bergantung pada satu vendor atau jalur kode khusus plugin sekali pakai.

### Pelapisan kapabilitas

Gunakan model mental ini saat menentukan tempat kode seharusnya berada:

<Tabs>
  <Tab title="Lapisan kapabilitas inti">
    Orkestrasi bersama, kebijakan, fallback, aturan penggabungan konfigurasi, semantik pengiriman, dan kontrak bertipe.
  </Tab>
  <Tab title="Lapisan plugin vendor">
    API khusus vendor, autentikasi, katalog model, sintesis ujaran, pembuatan gambar, backend video, endpoint penggunaan.
  </Tab>
  <Tab title="Lapisan plugin saluran/fitur">
    Integrasi Discord/Slack/panggilan suara/dll. yang menggunakan kapabilitas inti dan menyajikannya pada suatu permukaan.
  </Tab>
</Tabs>

Sebagai contoh, TTS mengikuti bentuk ini:

- inti memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan pengiriman saluran
- `elevenlabs`, `google`, `microsoft`, dan `openai` memiliki implementasi sintesis
- `voice-call` menggunakan pembantu runtime TTS telefoni

Pola yang sama harus diutamakan untuk kapabilitas mendatang.

### Contoh plugin perusahaan multi-kapabilitas

Plugin perusahaan harus terasa kohesif dari luar. Jika OpenClaw memiliki kontrak bersama untuk model, ujaran, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, dan pencarian web, sebuah vendor dapat memiliki seluruh permukaannya di satu tempat:

```ts
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { exampleAiMedia } from "./exampleai-media.js";

export default definePluginEntry({
  id: "exampleai",
  name: "ExampleAI",
  description: "Model dan kapabilitas media ExampleAI.",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // hook autentikasi/katalog model/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // konfigurasi ujaran vendor — implementasikan antarmuka SpeechProviderPlugin secara langsung
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      describeImage: (req) => exampleAiMedia.describeImage(req),
      transcribeAudio: (req) => exampleAiMedia.transcribeAudio(req),
      describeVideo: (req) => exampleAiMedia.describeVideo(req),
    });

    api.registerWebSearchProvider({
      id: "exampleai-search",
      createTool() {
        // Kembalikan alat pencarian web milik vendor.
      },
    });
  },
});
```

Yang penting bukanlah nama pembantu yang tepat. Bentuknya yang penting:

- satu plugin memiliki permukaan vendor
- inti tetap memiliki kontrak kapabilitas
- penerjemahan permintaan penyedia dan pembantu HTTP tetap berada di plugin vendor
- saluran dan plugin fitur menggunakan pembantu `api.runtime.*`, bukan kode vendor
- pengujian kontrak dapat memastikan bahwa plugin mendaftarkan kapabilitas yang diklaim dimilikinya

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu kapabilitas bersama. Model kepemilikan yang sama berlaku di sana:

<Steps>
  <Step title="Inti menentukan kontrak">
    Inti menentukan kontrak pemahaman media.
  </Step>
  <Step title="Plugin vendor mendaftar">
    Plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan `describeVideo` sebagaimana berlaku.
  </Step>
  <Step title="Konsumen menggunakan perilaku bersama">
    Saluran dan plugin fitur menggunakan perilaku inti bersama alih-alih terhubung langsung ke kode vendor.
  </Step>
</Steps>

Hal tersebut menghindari penanaman asumsi video satu penyedia ke dalam inti. Plugin memiliki permukaan vendor; inti memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak kapabilitas bertipe dan pembantu runtime, sementara plugin vendor mendaftarkan implementasi `api.registerVideoGenerationProvider(...)` terhadap kontrak tersebut.

Memerlukan daftar periksa peluncuran yang konkret? Lihat [Buku Panduan Kapabilitas](/id/plugins/adding-capabilities).

## Kontrak dan penegakan

Permukaan API plugin sengaja dibuat bertipe dan dipusatkan di `OpenClawPluginApi`. Kontrak tersebut menentukan titik pendaftaran yang didukung dan pembantu runtime yang dapat diandalkan oleh plugin.

Mengapa hal ini penting:

- penulis plugin mendapatkan satu standar internal yang stabil
- core dapat menolak kepemilikan duplikat, seperti dua plugin yang mendaftarkan id penyedia yang sama
- proses awal dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk pendaftaran yang tidak valid
- pengujian kontrak dapat menegakkan kepemilikan plugin bawaan dan mencegah penyimpangan tanpa peringatan

Terdapat dua lapisan penegakan:

<AccordionGroup>
  <Accordion title="Penegakan pendaftaran runtime">
    Registri plugin memvalidasi pendaftaran saat plugin dimuat. Contohnya: id penyedia duplikat, id penyedia suara duplikat, dan pendaftaran yang tidak valid menghasilkan diagnostik plugin alih-alih perilaku yang tidak terdefinisi.
  </Accordion>
  <Accordion title="Pengujian kontrak">
    Plugin bawaan dicatat dalam registri kontrak selama pengujian sehingga OpenClaw dapat memverifikasi kepemilikan secara eksplisit. Saat ini, mekanisme ini digunakan untuk penyedia model, penyedia suara, penyedia pencarian web, dan kepemilikan pendaftaran bawaan.
  </Accordion>
</AccordionGroup>

Dampak praktisnya adalah OpenClaw mengetahui sejak awal plugin mana yang memiliki setiap permukaan. Hal ini memungkinkan core dan kanal berintegrasi dengan lancar karena kepemilikan dideklarasikan, bertipe, dan dapat diuji, bukan tersirat.

### Apa yang termasuk dalam kontrak

<Tabs>
  <Tab title="Kontrak yang baik">
    - bertipe
    - kecil
    - khusus untuk kapabilitas
    - dimiliki oleh core
    - dapat digunakan kembali oleh beberapa plugin
    - dapat digunakan oleh kanal/fitur tanpa pengetahuan khusus tentang vendor

  </Tab>
  <Tab title="Kontrak yang buruk">
    - kebijakan khusus vendor yang disembunyikan di core
    - jalan keluar plugin sekali pakai yang melewati registri
    - kode kanal yang mengakses langsung implementasi vendor
    - objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau `api.runtime`

  </Tab>
</Tabs>

Jika ragu, naikkan tingkat abstraksinya: tentukan kapabilitas terlebih dahulu, lalu biarkan plugin terhubung dengannya.

## Model eksekusi

Plugin OpenClaw native berjalan **dalam proses** bersama Gateway. Plugin tersebut tidak berada dalam sandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses yang sama dengan kode core.

<Warning>
Implikasi plugin native: plugin dapat mendaftarkan alat, penangan jaringan, hook, dan layanan; bug plugin dapat menyebabkan gateway mengalami crash atau menjadi tidak stabil; dan plugin native berbahaya setara dengan eksekusi kode arbitrer di dalam proses OpenClaw.
</Warning>

Bundel yang kompatibel secara default lebih aman karena OpenClaw saat ini memperlakukannya sebagai paket metadata/konten. Dalam rilis saat ini, hal tersebut terutama berarti Skills yang dibundel.

Gunakan daftar izin dan jalur instalasi/pemuatan eksplisit untuk plugin yang tidak dibundel. Perlakukan plugin ruang kerja sebagai kode untuk masa pengembangan, bukan sebagai nilai default produksi.

Untuk nama paket ruang kerja bawaan, pertahankan id plugin agar tetap berakar pada nama npm: `@openclaw/<id>` secara default, atau akhiran bertipe yang disetujui seperti `-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` ketika paket tersebut sengaja mengekspos peran plugin yang lebih sempit.

<Note>
**Catatan kepercayaan:** `plugins.allow` memercayai **id plugin**, bukan asal-usul sumber. Plugin ruang kerja dengan id yang sama seperti plugin bawaan secara sengaja menggantikan salinan bawaan ketika plugin ruang kerja tersebut diaktifkan/dimasukkan ke daftar izin. Hal ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix. Kepercayaan terhadap plugin bawaan ditentukan dari snapshot sumber — manifes dan kode pada disk saat pemuatan — bukan dari metadata instalasi. Catatan instalasi yang rusak atau diganti tidak dapat secara diam-diam memperluas permukaan kepercayaan plugin bawaan melampaui apa yang diklaim oleh sumber sebenarnya.
</Note>

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan kemudahan implementasi.

Pertahankan pendaftaran kapabilitas sebagai API publik. Pangkas ekspor pembantu yang bukan bagian kontrak:

- subjalur pembantu khusus plugin bawaan
- subjalur mekanisme runtime yang tidak dimaksudkan sebagai API publik
- pembantu kemudahan khusus vendor
- pembantu penyiapan/orientasi yang merupakan detail implementasi

Subjalur pembantu plugin bawaan yang dicadangkan telah dihentikan dari peta ekspor SDK yang dihasilkan. Simpan pembantu khusus pemilik di dalam paket plugin pemiliknya; promosikan hanya perilaku host yang dapat digunakan kembali ke kontrak SDK generik seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan kapabilitas API plugin yang diinjeksi.

## Internal dan referensi

Untuk pipeline pemuatan, model registri, hook runtime penyedia, rute HTTP Gateway, skema alat pesan, resolusi target kanal, katalog penyedia, plugin mesin konteks, dan panduan menambahkan kapabilitas baru, lihat [Internal arsitektur plugin](/id/plugins/architecture-internals).

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Manifes plugin](/id/plugins/manifest)
- [Penyiapan SDK plugin](/id/plugins/sdk-setup)
