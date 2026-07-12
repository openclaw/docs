---
read_when:
    - Membangun atau men-debug plugin native OpenClaw
    - Memahami model kapabilitas plugin atau batas kepemilikan
    - Mengerjakan pipeline pemuatan plugin atau registri
    - Mengimplementasikan hook runtime penyedia atau plugin kanal
sidebarTitle: Internals
summary: 'Internal Plugin: model kapabilitas, kepemilikan, kontrak, alur pemuatan, dan pembantu runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-07-12T14:24:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Ini adalah **referensi arsitektur mendalam** untuk sistem Plugin OpenClaw. Untuk panduan praktis, mulailah dengan salah satu halaman khusus di bawah ini.

<CardGroup cols={2}>
  <Card title="Instal dan gunakan plugin" icon="plug" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menambahkan, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Membangun plugin" icon="rocket" href="/id/plugins/building-plugins">
    Tutorial Plugin pertama dengan manifes fungsional terkecil.
  </Card>
  <Card title="Plugin kanal" icon="comments" href="/id/plugins/sdk-channel-plugins">
    Bangun Plugin kanal perpesanan.
  </Card>
  <Card title="Plugin penyedia" icon="microchip" href="/id/plugins/sdk-provider-plugins">
    Bangun Plugin penyedia model.
  </Card>
  <Card title="Ikhtisar SDK" icon="book" href="/id/plugins/sdk-overview">
    Referensi peta impor dan API pendaftaran.
  </Card>
</CardGroup>

## Model kapabilitas publik

Kapabilitas adalah model **Plugin native** publik di dalam OpenClaw. Setiap Plugin OpenClaw native didaftarkan pada satu atau beberapa jenis kapabilitas:

| Kapabilitas              | Metode pendaftaran                               | Contoh plugin                   |
| ------------------------ | ------------------------------------------------ | ------------------------------- |
| Inferensi teks           | `api.registerProvider(...)`                      | `anthropic`, `openai`           |
| Backend inferensi CLI    | `api.registerCliBackend(...)`                    | `anthropic`, `openai`           |
| Embedding                | `api.registerEmbeddingProvider(...)`             | Plugin vektor milik penyedia    |
| Ucapan                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`       |
| Transkripsi waktu nyata  | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Suara waktu nyata        | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`              |
| Pemahaman media          | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`              |
| Sumber transkrip         | `api.registerTranscriptSourceProvider(...)`      | `discord`                       |
| Pembuatan gambar         | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`       |
| Pembuatan musik          | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`      |
| Pembuatan video          | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`         |
| Pengambilan web          | `api.registerWebFetchProvider(...)`              | `firecrawl`                     |
| Pencarian web            | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google`  |
| Kanal / perpesanan       | `api.registerChannel(...)`                       | `matrix`, `msteams`             |
| Penemuan Gateway         | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                       |

<Note>
Plugin yang tidak mendaftarkan kapabilitas apa pun, tetapi menyediakan hook, alat, layanan penemuan, atau layanan latar belakang adalah Plugin **lama khusus hook**. Pola tersebut masih didukung sepenuhnya.
</Note>

### Sikap terhadap kompatibilitas eksternal

Model kapabilitas telah tersedia di inti dan saat ini digunakan oleh Plugin bawaan/native, tetapi kompatibilitas Plugin eksternal masih memerlukan standar yang lebih ketat daripada "karena diekspor, maka sudah dibekukan."

| Situasi Plugin                                      | Panduan                                                                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Plugin eksternal yang sudah ada                     | Pertahankan agar integrasi berbasis hook tetap berfungsi; inilah garis dasar kompatibilitas.                               |
| Plugin bawaan/native baru                           | Utamakan pendaftaran kapabilitas eksplisit daripada akses internal khusus vendor atau desain baru yang hanya memakai hook. |
| Plugin eksternal yang mengadopsi pendaftaran kapabilitas | Diizinkan, tetapi anggap permukaan pembantu khusus kapabilitas masih berkembang kecuali dokumentasi menandainya stabil.    |

Pendaftaran kapabilitas adalah arah yang dituju. Hook lama tetap menjadi jalur paling aman tanpa kerusakan bagi Plugin eksternal selama transisi. Tidak semua subjalur pembantu yang diekspor memiliki kedudukan yang sama — utamakan kontrak terdokumentasi yang sempit daripada ekspor pembantu insidental.

### Bentuk Plugin

OpenClaw mengklasifikasikan setiap Plugin yang dimuat ke dalam suatu bentuk berdasarkan perilaku pendaftaran aktualnya (bukan hanya metadata statis):

<AccordionGroup>
  <Accordion title="plain-capability">
    Mendaftarkan tepat satu jenis kapabilitas (misalnya Plugin khusus penyedia seperti `arcee` atau `chutes`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Mendaftarkan beberapa jenis kapabilitas (misalnya `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan gambar).
  </Accordion>
  <Accordion title="hook-only">
    Hanya mendaftarkan hook (bertipe atau khusus), tanpa kapabilitas, alat, perintah, atau layanan.
  </Accordion>
  <Accordion title="non-capability">
    Mendaftarkan alat, perintah, layanan, atau rute, tetapi tanpa kapabilitas.
  </Accordion>
</AccordionGroup>

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk dan perincian kapabilitas suatu Plugin. Lihat [referensi CLI](/id/cli/plugins#inspect) untuk detailnya.

### Hook lama

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas bagi Plugin khusus hook. Plugin lama di dunia nyata masih bergantung padanya.

Arah:

- pertahankan agar tetap berfungsi
- dokumentasikan sebagai fitur lama
- utamakan `before_model_resolve` untuk pekerjaan penggantian model/penyedia
- utamakan `before_prompt_build` untuk pekerjaan perubahan prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all`, dan `openclaw plugins doctor` menampilkan pemberitahuan kompatibilitas berikut:

| Sinyal                                     | Arti                                                                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **konfigurasi valid**                      | Konfigurasi berhasil diurai dan Plugin berhasil ditemukan                                                                         |
| **khusus hook** (info)                     | Plugin hanya mendaftarkan hook; jalur ini didukung, tetapi belum dimigrasikan ke pendaftaran kapabilitas                          |
| **`before_agent_start` lama** (peringatan) | Plugin menggunakan hook `before_agent_start` yang tidak digunakan lagi sebagai pengganti `before_model_resolve`/`before_prompt_build` |
| **API embedding memori yang tidak digunakan lagi** (peringatan) | Plugin nonbawaan menggunakan API penyedia embedding khusus memori yang lama, bukan `registerEmbeddingProvider` |
| **kesalahan fatal**                        | Konfigurasi tidak valid atau Plugin gagal dimuat                                                                                   |

Tidak satu pun sinyal saran/peringatan tersebut merusak Plugin Anda saat ini. Sinyal ini juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Ikhtisar arsitektur

Sistem Plugin OpenClaw memiliki empat lapisan:

<Steps>
  <Step title="Manifes + penemuan">
    OpenClaw menemukan kandidat Plugin dari jalur yang dikonfigurasi, akar ruang kerja, akar Plugin global, dan Plugin bawaan. Penemuan terlebih dahulu membaca manifes `openclaw.plugin.json` native serta manifes bundel yang didukung.
  </Step>
  <Step title="Pengaktifan + validasi">
    Inti menentukan apakah Plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau dipilih untuk slot eksklusif seperti memori.
  </Step>
  <Step title="Pemuatan runtime">
    Plugin OpenClaw native dimuat dalam proses dan mendaftarkan kapabilitas ke registri pusat. JavaScript yang dikemas dimuat melalui `require` native; kode sumber TypeScript lokal pihak ketiga menggunakan Jiti sebagai fallback darurat. Bundel yang kompatibel dinormalisasi menjadi rekaman registri tanpa mengimpor kode runtime.
  </Step>
  <Step title="Konsumsi permukaan">
    Bagian lain OpenClaw membaca registri untuk mengekspos alat, kanal, penyiapan penyedia, hook, rute HTTP, perintah CLI, dan layanan.
  </Step>
</Steps>

Khusus untuk CLI Plugin, penemuan perintah akar dibagi menjadi dua fase:

- metadata saat penguraian berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI Plugin yang sebenarnya dapat tetap dimuat secara lambat dan didaftarkan saat pemanggilan pertama

Hal tersebut mempertahankan kode CLI milik Plugin di dalam Plugin, sekaligus tetap memungkinkan OpenClaw mencadangkan nama perintah akar sebelum penguraian.

Batas desain yang penting:

- validasi manifes/konfigurasi harus bekerja berdasarkan **metadata manifes/skema** tanpa menjalankan kode Plugin
- penemuan kapabilitas native dapat memuat kode entri Plugin tepercaya untuk membangun snapshot registri yang tidak mengaktifkan apa pun
- perilaku runtime native berasal dari jalur `register(api)` modul Plugin dengan `api.registrationMode === "full"`

Pemisahan tersebut memungkinkan OpenClaw memvalidasi konfigurasi, menjelaskan Plugin yang hilang/dinonaktifkan, dan membangun petunjuk UI/skema sebelum runtime penuh aktif.

### Snapshot metadata Plugin dan tabel pencarian

Saat dimulai, Gateway membangun satu `PluginMetadataSnapshot` untuk snapshot konfigurasi saat ini. Snapshot ini hanya berisi metadata: menyimpan indeks Plugin yang terinstal, registri manifes, diagnostik manifes, peta pemilik, penormal ID Plugin, dan rekaman manifes. Snapshot ini tidak menyimpan modul Plugin yang dimuat, SDK penyedia, isi paket, atau ekspor runtime.

Validasi konfigurasi yang memahami Plugin, pengaktifan otomatis saat dimulai, dan bootstrap Plugin Gateway menggunakan snapshot tersebut daripada membangun ulang metadata manifes/indeks secara terpisah. `PluginLookUpTable` diturunkan dari snapshot yang sama dan menambahkan rencana Plugin awal untuk konfigurasi runtime saat ini.

Setelah dimulai, Gateway mempertahankan snapshot metadata saat ini sebagai produk runtime yang dapat diganti. Penemuan penyedia runtime berulang dapat meminjam snapshot tersebut daripada merekonstruksi indeks yang terinstal dan registri manifes untuk setiap proses katalog penyedia. Snapshot dihapus atau diganti saat Gateway dimatikan, ketika konfigurasi/inventaris Plugin berubah, dan ketika indeks yang terinstal ditulis; pemanggil kembali menggunakan jalur manifes/indeks dingin ketika tidak ada snapshot saat ini yang kompatibel. Pemeriksaan kompatibilitas harus mencakup akar penemuan Plugin seperti `plugins.load.paths` dan ruang kerja agen default, karena Plugin ruang kerja merupakan bagian dari cakupan metadata.

Snapshot dan tabel pencarian mempertahankan keputusan awal yang berulang pada jalur cepat:

- kepemilikan kanal
- penundaan dimulainya kanal
- ID Plugin awal
- kepemilikan penyedia dan backend CLI
- kepemilikan penyedia penyiapan, alias perintah, penyedia katalog model, dan kontrak manifes
- validasi skema konfigurasi Plugin dan skema konfigurasi kanal
- keputusan pengaktifan otomatis saat dimulai

Batas keamanannya adalah penggantian snapshot, bukan mutasi. Bangun ulang snapshot ketika konfigurasi, inventaris Plugin, rekaman instalasi, atau kebijakan indeks persisten berubah. Jangan memperlakukannya sebagai registri global luas yang dapat dimutasi, dan jangan menyimpan snapshot historis tanpa batas. Pemuatan Plugin runtime tetap terpisah dari snapshot metadata agar keadaan runtime yang sudah usang tidak dapat disembunyikan di balik cache metadata.

Aturan cache didokumentasikan dalam [Internal arsitektur Plugin](/id/plugins/architecture-internals#plugin-cache-boundary): metadata manifes dan penemuan selalu mutakhir kecuali pemanggil menyimpan snapshot, tabel pencarian, atau registri manifes eksplisit untuk alur saat ini. Cache metadata tersembunyi dan TTL berdasarkan waktu dinding bukan bagian dari pemuatan Plugin. Hanya cache pemuat runtime, modul, dan artefak dependensi yang boleh bertahan setelah kode atau artefak yang terinstal benar-benar dimuat.

Beberapa pemanggil jalur dingin masih merekonstruksi registri manifes secara langsung dari indeks Plugin terinstal yang dipersistenkan, alih-alih menerima `PluginLookUpTable` Gateway. Jalur tersebut kini merekonstruksi registri sesuai permintaan; utamakan meneruskan tabel pencarian saat ini atau registri manifes eksplisit melalui alur runtime ketika pemanggil sudah memilikinya.

### Perencanaan aktivasi

Perencanaan aktivasi merupakan bagian dari bidang kontrol. Pemanggil dapat menanyakan Plugin mana yang relevan dengan perintah, penyedia, saluran, rute, kerangka agen, atau kapabilitas tertentu sebelum memuat registri runtime yang lebih luas.

Perencana menjaga kompatibilitas perilaku manifes saat ini:

- bidang `activation.*` adalah petunjuk eksplisit bagi perencana
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, dan hook tetap menjadi fallback kepemilikan manifes
- API perencana khusus ID tetap tersedia bagi pemanggil yang sudah ada
- API rencana melaporkan label alasan agar diagnostik dapat membedakan petunjuk eksplisit dari fallback kepemilikan

<Warning>
Jangan perlakukan `activation` sebagai hook siklus hidup atau pengganti `register(...)`. Ini adalah metadata yang digunakan untuk mempersempit pemuatan. Utamakan bidang kepemilikan jika bidang tersebut sudah menjelaskan hubungannya; gunakan `activation` hanya untuk petunjuk tambahan bagi perencana.
</Warning>

### Plugin saluran dan alat pesan bersama

Plugin saluran tidak perlu mendaftarkan alat kirim/edit/reaksi terpisah untuk tindakan obrolan normal. OpenClaw mempertahankan satu alat `message` bersama di inti, sementara Plugin saluran memiliki penemuan dan eksekusi khusus saluran di baliknya.

Batas saat ini adalah:

- inti memiliki host alat `message` bersama, pengawatan prompt, pencatatan sesi/utas, dan pengiriman eksekusi
- Plugin saluran memiliki penemuan tindakan terbatas, penemuan kapabilitas, dan setiap fragmen skema khusus saluran
- Plugin saluran memiliki tata bahasa percakapan sesi khusus penyedia, seperti cara ID percakapan mengodekan ID utas atau mewarisinya dari percakapan induk
- Plugin saluran menjalankan tindakan akhir melalui adaptor tindakannya

Untuk Plugin saluran, permukaan SDK-nya adalah `ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan penemuan terpadu tersebut memungkinkan Plugin mengembalikan tindakan yang terlihat, kapabilitas, dan kontribusi skemanya secara bersamaan agar bagian-bagian tersebut tidak menyimpang satu sama lain.

Saat parameter alat pesan khusus saluran membawa sumber media seperti jalur lokal atau URL media jarak jauh, Plugin juga harus mengembalikan `mediaSourceParams` dari `describeMessageTool(...)`. Inti menggunakan daftar eksplisit tersebut untuk menerapkan normalisasi jalur sandbox dan petunjuk akses media keluar tanpa menanamkan nama parameter milik Plugin secara langsung. Utamakan peta yang dibatasi per tindakan di sana, bukan satu daftar datar untuk seluruh saluran, agar parameter media khusus profil tidak dinormalisasi pada tindakan yang tidak terkait seperti `send`.

Inti meneruskan cakupan runtime ke langkah penemuan tersebut. Bidang penting meliputi:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` masuk yang tepercaya

Hal ini penting bagi Plugin yang peka terhadap konteks. Saluran dapat menyembunyikan atau menampilkan tindakan pesan berdasarkan akun aktif, ruang/utas/pesan saat ini, atau identitas peminta tepercaya tanpa menanamkan percabangan khusus saluran secara langsung dalam alat `message` inti.

Inilah alasan perubahan perutean runner tertanam tetap merupakan pekerjaan Plugin: runner bertanggung jawab meneruskan identitas obrolan/sesi saat ini ke batas penemuan Plugin agar alat `message` bersama menampilkan permukaan milik saluran yang tepat untuk giliran saat ini.

Untuk pembantu eksekusi milik saluran, Plugin bawaan harus mempertahankan runtime eksekusi di dalam modul Plugin-nya sendiri. Inti tidak lagi memiliki runtime tindakan pesan Discord, Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`. Kami tidak menerbitkan subjalur `plugin-sdk/*-action-runtime` terpisah, dan Plugin bawaan harus mengimpor kode runtime lokalnya sendiri secara langsung dari modul milik Plugin-nya.

Batas yang sama berlaku untuk celah SDK bernama penyedia secara umum: inti tidak boleh mengimpor barrel kemudahan khusus saluran untuk Discord, Signal, Slack, WhatsApp, atau Plugin serupa. Jika inti memerlukan suatu perilaku, gunakan barrel `api.ts` / `runtime-api.ts` milik Plugin bawaan itu sendiri atau tingkatkan kebutuhan tersebut menjadi kapabilitas generik yang sempit di SDK bersama.

Plugin bawaan mengikuti aturan yang sama. `runtime-api.ts` milik Plugin bawaan tidak boleh mengekspor ulang fasad bermereknya sendiri, yaitu `openclaw/plugin-sdk/<plugin-id>`. Fasad bermerek tersebut tetap menjadi shim kompatibilitas bagi Plugin eksternal dan konsumen lama, tetapi Plugin bawaan harus menggunakan ekspor lokal beserta subjalur SDK generik yang sempit seperti `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, atau `openclaw/plugin-sdk/webhook-ingress`. Kode baru tidak boleh menambahkan fasad SDK khusus ID Plugin kecuali batas kompatibilitas untuk ekosistem eksternal yang sudah ada mengharuskannya.

Khusus untuk jajak pendapat, terdapat dua jalur eksekusi:

- `outbound.sendPoll` adalah dasar bersama bagi saluran yang sesuai dengan model jajak pendapat umum
- `actions.handleAction("poll")` adalah jalur yang diutamakan untuk semantik jajak pendapat khusus saluran atau parameter jajak pendapat tambahan

Inti kini menunda penguraian jajak pendapat bersama hingga setelah pengiriman jajak pendapat Plugin menolak tindakan tersebut, sehingga penangan jajak pendapat milik Plugin dapat menerima bidang jajak pendapat khusus saluran tanpa terlebih dahulu diblokir oleh pengurai jajak pendapat generik.

Lihat [Internal arsitektur Plugin](/id/plugins/architecture-internals) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan Plugin natif sebagai batas kepemilikan untuk sebuah **perusahaan** atau **fitur**, bukan sebagai kumpulan integrasi yang tidak berkaitan.

Artinya:

- Plugin perusahaan biasanya harus memiliki semua permukaan perusahaan tersebut yang berhadapan dengan OpenClaw
- Plugin fitur biasanya harus memiliki seluruh permukaan fitur yang diperkenalkannya
- saluran harus menggunakan kapabilitas inti bersama alih-alih mengimplementasikan ulang perilaku penyedia secara ad hoc

<AccordionGroup>
  <Accordion title="Vendor multikapabilitas">
    `google` memiliki inferensi teks, backend CLI, embedding, ucapan, suara waktu nyata, pemahaman media, pembuatan gambar/musik/video, dan pencarian web. `openai` memiliki inferensi teks, embedding, ucapan, transkripsi waktu nyata, suara waktu nyata, pemahaman media, serta pembuatan gambar/video. `minimax` memiliki inferensi teks beserta pemahaman media, ucapan, pembuatan gambar/musik/video, dan pencarian web.
  </Accordion>
  <Accordion title="Vendor kapabilitas tunggal">
    `arcee` dan `chutes` hanya memiliki inferensi teks; `microsoft` hanya memiliki ucapan. Plugin vendor dapat tetap sesempit ini hingga perlu mencakup lebih banyak permukaan vendor tersebut.
  </Accordion>
  <Accordion title="Plugin fitur">
    `voice-call` memiliki transportasi panggilan, alat, CLI, rute, dan penjembatanan aliran media Twilio, tetapi menggunakan kapabilitas ucapan, transkripsi waktu nyata, dan suara waktu nyata bersama alih-alih mengimpor Plugin vendor secara langsung.
  </Accordion>
</AccordionGroup>

Keadaan akhir yang dituju adalah:

- permukaan vendor yang berhadapan dengan OpenClaw berada dalam satu Plugin meskipun mencakup model teks, ucapan, gambar, dan video
- vendor lain dapat melakukan hal yang sama untuk area permukaan mereka sendiri
- saluran tidak perlu mengetahui Plugin vendor mana yang memiliki penyedia; saluran menggunakan kontrak kapabilitas bersama yang diekspos oleh inti

Inilah perbedaan utamanya:

- **Plugin** = batas kepemilikan
- **kapabilitas** = kontrak inti yang dapat diimplementasikan atau digunakan oleh beberapa Plugin

Jadi, jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama bukanlah "penyedia mana yang harus menanamkan penanganan video secara langsung?" Pertanyaan pertama adalah "apa kontrak kapabilitas video inti?" Setelah kontrak tersebut tersedia, Plugin vendor dapat mendaftar terhadapnya dan Plugin saluran/fitur dapat menggunakannya.

Jika kapabilitas tersebut belum tersedia, langkah yang tepat biasanya adalah:

<Steps>
  <Step title="Definisikan kapabilitas">
    Definisikan kapabilitas yang belum tersedia di inti.
  </Step>
  <Step title="Ekspos melalui SDK">
    Ekspos kapabilitas tersebut melalui API/runtime Plugin dengan tipe yang jelas.
  </Step>
  <Step title="Hubungkan konsumen">
    Hubungkan saluran/fitur ke kapabilitas tersebut.
  </Step>
  <Step title="Implementasi vendor">
    Izinkan Plugin vendor mendaftarkan implementasi.
  </Step>
</Steps>

Hal ini menjaga kepemilikan tetap eksplisit sekaligus menghindari perilaku inti yang bergantung pada satu vendor atau jalur kode khusus Plugin sekali pakai.

### Pelapisan kapabilitas

Gunakan model mental ini saat menentukan lokasi kode:

<Tabs>
  <Tab title="Lapisan kapabilitas inti">
    Orkestrasi bersama, kebijakan, fallback, aturan penggabungan konfigurasi, semantik pengiriman, dan kontrak bertipe.
  </Tab>
  <Tab title="Lapisan Plugin vendor">
    API khusus vendor, autentikasi, katalog model, sintesis ucapan, pembuatan gambar, backend video, titik akhir penggunaan.
  </Tab>
  <Tab title="Lapisan Plugin saluran/fitur">
    Integrasi Discord/Slack/voice-call/dan sebagainya yang menggunakan kapabilitas inti dan menyajikannya pada suatu permukaan.
  </Tab>
</Tabs>

Sebagai contoh, TTS mengikuti bentuk ini:

- inti memiliki kebijakan TTS pada waktu balasan, urutan fallback, preferensi, dan pengiriman saluran
- `elevenlabs`, `google`, `microsoft`, dan `openai` memiliki implementasi sintesis
- `voice-call` menggunakan pembantu runtime TTS telepon

Pola yang sama harus diutamakan untuk kapabilitas mendatang.

### Contoh Plugin perusahaan multikapabilitas

Plugin perusahaan harus terasa kohesif dari luar. Jika OpenClaw memiliki kontrak bersama untuk model, ucapan, transkripsi waktu nyata, suara waktu nyata, pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, dan pencarian web, vendor dapat memiliki semua permukaannya di satu tempat:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Yang penting bukanlah nama pembantu yang persis. Bentuknya yang penting:

- satu Plugin memiliki permukaan vendor
- inti tetap memiliki kontrak kapabilitas
- saluran dan Plugin fitur menggunakan pembantu `api.runtime.*`, bukan kode vendor
- pengujian kontrak dapat menegaskan bahwa Plugin mendaftarkan kapabilitas yang diklaim sebagai miliknya

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu kapabilitas bersama. Model kepemilikan yang sama berlaku di sana:

<Steps>
  <Step title="Inti mendefinisikan kontrak">
    Inti mendefinisikan kontrak pemahaman media.
  </Step>
  <Step title="Plugin vendor mendaftar">
    Plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan `describeVideo` sebagaimana berlaku.
  </Step>
  <Step title="Konsumen menggunakan perilaku bersama">
    Saluran dan Plugin fitur menggunakan perilaku inti bersama alih-alih terhubung langsung ke kode vendor.
  </Step>
</Steps>

Hal ini menghindari penanaman asumsi video milik satu penyedia ke dalam inti. Plugin memiliki permukaan vendor; inti memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: inti memiliki kontrak kapabilitas bertipe dan pembantu runtime, sementara Plugin vendor mendaftarkan implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Memerlukan daftar periksa peluncuran yang konkret? Lihat [Panduan Praktis Kapabilitas](/id/plugins/adding-capabilities).

## Kontrak dan penegakan

Permukaan API plugin sengaja dibuat bertipe dan dipusatkan di `OpenClawPluginApi`. Kontrak tersebut menentukan titik pendaftaran yang didukung dan pembantu runtime yang dapat diandalkan oleh plugin.

Mengapa ini penting:

- pembuat plugin mendapatkan satu standar internal yang stabil
- inti dapat menolak kepemilikan ganda, seperti dua plugin yang mendaftarkan id penyedia yang sama
- proses awal dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk pendaftaran yang tidak valid
- pengujian kontrak dapat menegakkan kepemilikan plugin bawaan dan mencegah penyimpangan tersembunyi

Ada dua lapisan penegakan:

<AccordionGroup>
  <Accordion title="Penegakan pendaftaran runtime">
    Registri plugin memvalidasi pendaftaran saat plugin dimuat. Contohnya: id penyedia ganda, id penyedia ucapan ganda, dan pendaftaran yang tidak valid menghasilkan diagnostik plugin alih-alih perilaku yang tidak terdefinisi.
  </Accordion>
  <Accordion title="Pengujian kontrak">
    Plugin bawaan direkam dalam registri kontrak selama pengujian dijalankan agar OpenClaw dapat memastikan kepemilikan secara eksplisit. Saat ini, mekanisme tersebut digunakan untuk penyedia model, penyedia ucapan, penyedia pencarian web, dan kepemilikan pendaftaran bawaan.
  </Accordion>
</AccordionGroup>

Dampak praktisnya adalah OpenClaw mengetahui sejak awal plugin mana yang memiliki permukaan tertentu. Hal ini memungkinkan inti dan kanal berpadu dengan lancar karena kepemilikan dideklarasikan, diberi tipe, dan dapat diuji, bukan tersirat.

### Hal yang termasuk dalam kontrak

<Tabs>
  <Tab title="Kontrak yang baik">
    - bertipe
    - kecil
    - khusus untuk kapabilitas
    - dimiliki oleh inti
    - dapat digunakan kembali oleh beberapa plugin
    - dapat digunakan oleh kanal/fitur tanpa pengetahuan tentang vendor

  </Tab>
  <Tab title="Kontrak yang buruk">
    - kebijakan khusus vendor yang disembunyikan dalam inti
    - jalur pintas plugin sekali pakai yang melewati registri
    - kode kanal yang mengakses langsung implementasi vendor
    - objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau `api.runtime`

  </Tab>
</Tabs>

Jika ragu, naikkan tingkat abstraksinya: tentukan kapabilitas terlebih dahulu, lalu biarkan plugin terhubung dengannya.

## Model eksekusi

Plugin native OpenClaw berjalan **dalam proses** bersama Gateway. Plugin tersebut tidak berada dalam sandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses yang sama dengan kode inti.

<Warning>
Implikasi plugin native: plugin dapat mendaftarkan alat, penangan jaringan, hook, dan layanan; bug plugin dapat membuat Gateway berhenti atau tidak stabil; dan plugin native berbahaya setara dengan eksekusi kode arbitrer di dalam proses OpenClaw.
</Warning>

Bundel yang kompatibel secara default lebih aman karena OpenClaw saat ini memperlakukannya sebagai paket metadata/konten. Dalam rilis saat ini, hal tersebut terutama berarti Skills yang dibundel.

Gunakan daftar izin dan jalur instalasi/pemuatan eksplisit untuk plugin nonbawaan. Perlakukan plugin ruang kerja sebagai kode untuk masa pengembangan, bukan sebagai nilai default produksi.

Untuk nama paket ruang kerja bawaan, pertahankan id plugin agar berpatokan pada nama npm: secara default `@openclaw/<id>`, atau akhiran bertipe yang disetujui seperti `-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` ketika paket tersebut sengaja mengekspos peran plugin yang lebih sempit.

<Note>
**Catatan kepercayaan:** `plugins.allow` memercayai **id plugin**, bukan asal sumber. Plugin ruang kerja dengan id yang sama seperti plugin bawaan sengaja menggantikan salinan bawaan ketika plugin ruang kerja tersebut diaktifkan/dimasukkan ke daftar izin. Hal ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan perbaikan cepat. Kepercayaan terhadap plugin bawaan ditentukan dari snapshot sumber — manifes dan kode pada disk saat pemuatan — bukan dari metadata instalasi. Catatan instalasi yang rusak atau diganti tidak dapat secara diam-diam memperluas permukaan kepercayaan plugin bawaan melampaui apa yang dinyatakan oleh sumber aktual.
</Note>

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan kemudahan implementasi.

Pertahankan pendaftaran kapabilitas sebagai API publik. Pangkas ekspor pembantu yang bukan bagian dari kontrak:

- subjalur pembantu khusus plugin bawaan
- subjalur pengaturan runtime yang tidak ditujukan sebagai API publik
- pembantu kemudahan khusus vendor
- pembantu penyiapan/orientasi awal yang merupakan detail implementasi

Subjalur pembantu khusus plugin bawaan yang dicadangkan telah dihentikan dari peta ekspor SDK yang dihasilkan. Pertahankan pembantu khusus pemilik di dalam paket plugin pemiliknya; promosikan hanya perilaku host yang dapat digunakan kembali ke kontrak SDK generik seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.

## Internal dan referensi

Untuk alur pemuatan, model registri, hook runtime penyedia, rute HTTP Gateway, skema alat pesan, resolusi target kanal, katalog penyedia, plugin mesin konteks, dan panduan menambahkan kapabilitas baru, lihat [Internal arsitektur plugin](/id/plugins/architecture-internals).

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Manifes plugin](/id/plugins/manifest)
- [Penyiapan SDK plugin](/id/plugins/sdk-setup)
