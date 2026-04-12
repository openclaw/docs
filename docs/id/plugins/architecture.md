---
read_when:
    - Membangun atau men-debug plugin OpenClaw native
    - Memahami model kapabilitas plugin atau batas kepemilikan
    - Mengerjakan pipeline pemuatan plugin atau registri
    - Menerapkan hook runtime provider atau plugin channel
sidebarTitle: Internals
summary: 'Internal plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-04-12T09:06:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f4f8e6bcb14358b3aaa698d03faf456bbeebc04a6d70d1ae6451b02ab17cf09
    source_path: plugins/architecture.md
    workflow: 15
---

# Internal Plugin

<Info>
  Ini adalah **referensi arsitektur mendalam**. Untuk panduan praktis, lihat:
  - [Instal dan gunakan plugin](/id/tools/plugin) — panduan pengguna
  - [Memulai](/id/plugins/building-plugins) — tutorial plugin pertama
  - [Plugin Channel](/id/plugins/sdk-channel-plugins) — membangun channel pesan
  - [Plugin Provider](/id/plugins/sdk-provider-plugins) — membangun provider model
  - [Ikhtisar SDK](/id/plugins/sdk-overview) — peta impor dan API registrasi
</Info>

Halaman ini membahas arsitektur internal sistem plugin OpenClaw.

## Model kapabilitas publik

Kapabilitas adalah model **plugin native** publik di dalam OpenClaw. Setiap
plugin native OpenClaw mendaftar terhadap satu atau lebih jenis kapabilitas:

| Kapabilitas           | Metode registrasi                               | Contoh plugin                       |
| --------------------- | ----------------------------------------------- | ----------------------------------- |
| Inferensi teks        | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| Backend inferensi CLI | `api.registerCliBackend(...)`                   | `openai`, `anthropic`               |
| Ucapan                | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Transkripsi realtime  | `api.registerRealtimeTranscriptionProvider(...)`| `openai`                            |
| Suara realtime        | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| Pemahaman media       | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                  |
| Pembuatan gambar      | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax`|
| Pembuatan musik       | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Pembuatan video       | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Pengambilan web       | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Pencarian web         | `api.registerWebSearchProvider(...)`            | `google`                            |
| Channel / pesan       | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |

Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, tool, atau
layanan adalah plugin **legacy hook-only**. Pola itu masih didukung sepenuhnya.

### Sikap kompatibilitas eksternal

Model kapabilitas sudah diterapkan di core dan digunakan oleh plugin
bundled/native saat ini, tetapi kompatibilitas plugin eksternal masih
memerlukan standar yang lebih ketat daripada "ini diekspor, berarti sudah
dibekukan."

Panduan saat ini:

- **plugin eksternal yang sudah ada:** pertahankan integrasi berbasis hook agar
  tetap berfungsi; anggap ini sebagai baseline kompatibilitas
- **plugin bundled/native baru:** utamakan registrasi kapabilitas yang eksplisit
  daripada akses vendor-spesifik atau desain hook-only baru
- **plugin eksternal yang mengadopsi registrasi kapabilitas:** diperbolehkan,
  tetapi anggap surface helper yang spesifik kapabilitas masih berkembang kecuali
  dokumentasi secara eksplisit menandai kontraknya sebagai stabil

Aturan praktis:

- API registrasi kapabilitas adalah arah yang dituju
- hook lama tetap menjadi jalur paling aman agar plugin eksternal tidak rusak
  selama transisi
- tidak semua subpath helper yang diekspor setara; pilih kontrak terdokumentasi
  yang sempit, bukan ekspor helper yang kebetulan tersedia

### Bentuk plugin

OpenClaw mengklasifikasikan setiap plugin yang dimuat ke dalam bentuk berdasarkan
perilaku registrasi aktualnya (bukan hanya metadata statis):

- **plain-capability** -- mendaftarkan tepat satu jenis kapabilitas (misalnya
  plugin provider-saja seperti `mistral`)
- **hybrid-capability** -- mendaftarkan beberapa jenis kapabilitas (misalnya
  `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan
  gambar)
- **hook-only** -- hanya mendaftarkan hook (typed atau custom), tanpa
  kapabilitas, tool, perintah, atau layanan
- **non-capability** -- mendaftarkan tool, perintah, layanan, atau route tetapi
  tidak ada kapabilitas

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin dan rincian
kapabilitasnya. Lihat [referensi CLI](/cli/plugins#inspect) untuk detailnya.

### Hook lama

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk
plugin hook-only. Plugin lama yang nyata masih bergantung padanya.

Arah ke depan:

- pertahankan agar tetap berfungsi
- dokumentasikan sebagai legacy
- utamakan `before_model_resolve` untuk pekerjaan override model/provider
- utamakan `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan
  keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`,
Anda mungkin melihat salah satu label berikut:

| Sinyal                     | Arti                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfigurasi berhasil diparsing dan plugin berhasil di-resolve |
| **compatibility advisory** | Plugin menggunakan pola yang didukung tetapi lebih lama (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated |
| **hard error**             | Konfigurasi tidak valid atau plugin gagal dimuat             |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak plugin Anda saat
ini -- `hook-only` bersifat advisori, dan `before_agent_start` hanya memicu
peringatan. Sinyal ini juga muncul di `openclaw status --all` dan
`openclaw plugins doctor`.

## Ikhtisar arsitektur

Sistem plugin OpenClaw memiliki empat lapisan:

1. **Manifest + discovery**
   OpenClaw menemukan kandidat plugin dari path yang dikonfigurasi, root
   workspace, root ekstensi global, dan ekstensi bundled. Discovery membaca
   manifest native `openclaw.plugin.json` serta manifest bundle yang didukung
   terlebih dahulu.
2. **Enablement + validation**
   Core memutuskan apakah plugin yang ditemukan diaktifkan, dinonaktifkan,
   diblokir, atau dipilih untuk slot eksklusif seperti memori.
3. **Runtime loading**
   Plugin native OpenClaw dimuat in-process melalui jiti dan mendaftarkan
   kapabilitas ke registri pusat. Bundle yang kompatibel dinormalisasi menjadi
   record registri tanpa mengimpor kode runtime.
4. **Surface consumption**
   Bagian lain dari OpenClaw membaca registri untuk mengekspos tool, channel,
   setup provider, hook, route HTTP, perintah CLI, dan layanan.

Khusus untuk CLI plugin, discovery perintah root dibagi menjadi dua fase:

- metadata saat parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI plugin yang sebenarnya bisa tetap lazy dan mendaftar saat pertama
  kali dipanggil

Itu menjaga kode CLI milik plugin tetap berada di dalam plugin sekaligus
membiarkan OpenClaw mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- discovery + validasi config harus bekerja dari **metadata manifest/schema**
  tanpa mengeksekusi kode plugin
- perilaku runtime native berasal dari path `register(api)` milik modul plugin

Pemisahan ini memungkinkan OpenClaw memvalidasi config, menjelaskan plugin yang
hilang/dinonaktifkan, dan membangun petunjuk UI/schema sebelum runtime penuh
aktif.

### Plugin channel dan tool pesan bersama

Plugin channel tidak perlu mendaftarkan tool kirim/edit/react terpisah untuk
aksi chat normal. OpenClaw mempertahankan satu tool `message` bersama di core,
dan plugin channel memiliki discovery dan eksekusi yang spesifik channel di
baliknya.

Batas saat ini adalah:

- core memiliki host tool `message` bersama, wiring prompt, pembukuan sesi/thread,
  dan dispatch eksekusi
- plugin channel memiliki discovery aksi terlingkup, discovery kapabilitas, dan
  fragmen schema apa pun yang spesifik channel
- plugin channel memiliki tata bahasa percakapan sesi yang spesifik provider,
  seperti bagaimana ID percakapan mengenkode ID thread atau mewarisi dari
  percakapan induk
- plugin channel mengeksekusi aksi akhir melalui adapter aksi mereka

Untuk plugin channel, surface SDK-nya adalah
`ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan discovery yang
terpadu itu memungkinkan plugin mengembalikan aksi yang terlihat, kapabilitas,
dan kontribusi schema secara bersamaan agar bagian-bagian itu tidak saling
menyimpang.

Core meneruskan scope runtime ke langkah discovery tersebut. Field penting
meliputi:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound tepercaya

Ini penting untuk plugin yang sensitif terhadap konteks. Sebuah channel dapat
menyembunyikan atau mengekspos aksi pesan berdasarkan akun aktif, room/thread/pesan
saat ini, atau identitas peminta tepercaya tanpa melakukan hardcode percabangan
spesifik channel di tool `message` core.

Inilah alasan perubahan routing embedded-runner tetap merupakan pekerjaan plugin:
runner bertanggung jawab meneruskan identitas chat/sesi saat ini ke batas
discovery plugin sehingga tool `message` bersama mengekspos surface milik
channel yang tepat untuk giliran saat ini.

Untuk helper eksekusi yang dimiliki channel, plugin bundled harus menjaga runtime
eksekusi tetap berada di dalam modul ekstensi mereka sendiri. Core tidak lagi
memiliki runtime message-action Discord, Slack, Telegram, atau WhatsApp di bawah
`src/agents/tools`. Kami tidak menerbitkan subpath `plugin-sdk/*-action-runtime`
terpisah, dan plugin bundled harus mengimpor kode runtime lokal mereka sendiri
langsung dari modul milik ekstensi mereka.

Batas yang sama berlaku untuk seam SDK bernama provider secara umum: core tidak
boleh mengimpor barrel kemudahan yang spesifik channel untuk ekstensi Slack,
Discord, Signal, WhatsApp, atau yang serupa. Jika core memerlukan suatu perilaku,
gunakan barrel `api.ts` / `runtime-api.ts` milik plugin bundled tersebut atau
promosikan kebutuhan itu menjadi kapabilitas generik yang sempit di SDK bersama.

Khusus untuk polling, ada dua path eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk channel yang sesuai dengan
  model polling umum
- `actions.handleAction("poll")` adalah path yang diutamakan untuk semantik
  polling spesifik channel atau parameter polling tambahan

Core sekarang menunda parsing polling bersama sampai setelah dispatch polling
plugin menolak aksi tersebut, sehingga handler polling milik plugin dapat
menerima field polling spesifik channel tanpa terlebih dahulu dihalangi oleh
parser polling generik.

Lihat [Pipeline pemuatan](#load-pipeline) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan plugin native sebagai batas kepemilikan untuk sebuah
**perusahaan** atau sebuah **fitur**, bukan sebagai kumpulan integrasi yang
tidak saling terkait.

Artinya:

- plugin perusahaan biasanya harus memiliki semua surface OpenClaw yang
  berhadapan dengan perusahaan tersebut
- plugin fitur biasanya harus memiliki surface fitur penuh yang diperkenalkannya
- channel harus menggunakan kapabilitas core bersama alih-alih mengimplementasikan
  ulang perilaku provider secara ad hoc

Contoh:

- plugin bundled `openai` memiliki perilaku provider model OpenAI dan perilaku
  OpenAI untuk ucapan + suara realtime + pemahaman media + pembuatan gambar
- plugin bundled `elevenlabs` memiliki perilaku ucapan ElevenLabs
- plugin bundled `microsoft` memiliki perilaku ucapan Microsoft
- plugin bundled `google` memiliki perilaku provider model Google serta perilaku
  Google untuk pemahaman media + pembuatan gambar + pencarian web
- plugin bundled `firecrawl` memiliki perilaku pengambilan web Firecrawl
- plugin bundled `minimax`, `mistral`, `moonshot`, dan `zai` memiliki backend
  pemahaman media mereka
- plugin bundled `qwen` memiliki perilaku provider teks Qwen serta perilaku
  pemahaman media dan pembuatan video
- plugin `voice-call` adalah plugin fitur: plugin ini memiliki transport panggilan,
  tool, CLI, route, dan bridging media-stream Twilio, tetapi menggunakan
  kapabilitas ucapan bersama serta transkripsi realtime dan suara realtime
  alih-alih mengimpor langsung plugin vendor

Kondisi akhir yang dituju adalah:

- OpenAI berada dalam satu plugin meskipun mencakup model teks, ucapan, gambar, dan
  video di masa depan
- vendor lain dapat melakukan hal yang sama untuk area surface miliknya sendiri
- channel tidak peduli plugin vendor mana yang memiliki provider; channel menggunakan
  kontrak kapabilitas bersama yang diekspos oleh core

Ini adalah perbedaan kuncinya:

- **plugin** = batas kepemilikan
- **kapabilitas** = kontrak core yang dapat diimplementasikan atau digunakan oleh beberapa plugin

Jadi, jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama
bukanlah "provider mana yang harus melakukan hardcode penanganan video?" Pertanyaan
pertama adalah "apa kontrak kapabilitas video di core?" Setelah kontrak itu ada,
plugin vendor dapat mendaftar terhadapnya dan plugin channel/fitur dapat
menggunakannya.

Jika kapabilitasnya belum ada, langkah yang tepat biasanya adalah:

1. definisikan kapabilitas yang belum ada di core
2. ekspos melalui API/runtime plugin dengan cara yang bertipe
3. hubungkan channel/fitur ke kapabilitas tersebut
4. biarkan plugin vendor mendaftarkan implementasinya

Ini membuat kepemilikan tetap eksplisit sambil menghindari perilaku core yang
bergantung pada satu vendor atau path kode spesifik plugin yang sekali pakai.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan di mana kode harus ditempatkan:

- **lapisan kapabilitas core**: orkestrasi bersama, kebijakan, fallback, aturan
  penggabungan config, semantik pengiriman, dan kontrak bertipe
- **lapisan plugin vendor**: API khusus vendor, autentikasi, katalog model, sintesis ucapan,
  pembuatan gambar, backend video di masa depan, endpoint penggunaan
- **lapisan plugin channel/fitur**: integrasi Slack/Discord/voice-call/dll.
  yang menggunakan kapabilitas core dan menyajikannya pada suatu surface

Misalnya, TTS mengikuti bentuk ini:

- core memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan pengiriman channel
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` menggunakan helper runtime TTS teleponi

Pola yang sama sebaiknya diutamakan untuk kapabilitas di masa depan.

### Contoh plugin perusahaan multi-kapabilitas

Plugin perusahaan harus terasa kohesif dari luar. Jika OpenClaw memiliki
kontrak bersama untuk model, ucapan, transkripsi realtime, suara realtime, pemahaman
media, pembuatan gambar, pembuatan video, pengambilan web, dan pencarian web,
sebuah vendor dapat memiliki semua surface-nya di satu tempat:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

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
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
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

Yang penting bukan nama helper persisnya. Bentuknya yang penting:

- satu plugin memiliki surface vendor
- core tetap memiliki kontrak kapabilitas
- channel dan plugin fitur menggunakan helper `api.runtime.*`, bukan kode vendor
- tes kontrak dapat memastikan bahwa plugin mendaftarkan kapabilitas yang
  diklaim dimilikinya

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu
kapabilitas bersama. Model kepemilikan yang sama berlaku di sana:

1. core mendefinisikan kontrak media-understanding
2. plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan
   `describeVideo` sesuai kebutuhan
3. channel dan plugin fitur menggunakan perilaku core bersama alih-alih
   menghubungkan langsung ke kode vendor

Ini menghindari asumsi video milik satu provider tertanam di core. Plugin
memiliki surface vendor; core memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak
kapabilitas bertipe dan helper runtime, dan plugin vendor mendaftarkan
implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh checklist rollout yang konkret? Lihat
[Capability Cookbook](/id/plugins/architecture).

## Kontrak dan penegakan

Surface API plugin sengaja dibuat bertipe dan dipusatkan di
`OpenClawPluginApi`. Kontrak itu mendefinisikan titik registrasi yang didukung dan
helper runtime yang boleh diandalkan oleh sebuah plugin.

Mengapa ini penting:

- penulis plugin mendapatkan satu standar internal yang stabil
- core dapat menolak kepemilikan ganda seperti dua plugin yang mendaftarkan id provider yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk registrasi yang salah format
- tes kontrak dapat menegakkan kepemilikan plugin bundled dan mencegah penyimpangan diam-diam

Ada dua lapisan penegakan:

1. **penegakan registrasi runtime**
   Registri plugin memvalidasi registrasi saat plugin dimuat. Contoh:
   id provider duplikat, id provider ucapan duplikat, dan registrasi yang salah format
   menghasilkan diagnostik plugin alih-alih perilaku tak terdefinisi.
2. **tes kontrak**
   Plugin bundled ditangkap dalam registri kontrak selama test run sehingga
   OpenClaw dapat menegaskan kepemilikan secara eksplisit. Saat ini ini digunakan untuk
   provider model, provider ucapan, provider pencarian web, dan kepemilikan registrasi bundled.

Efek praktisnya adalah OpenClaw mengetahui, sejak awal, plugin mana yang
memiliki surface mana. Itu memungkinkan core dan channel berkomposisi dengan
mulus karena kepemilikan dinyatakan, bertipe, dan dapat diuji, bukan implisit.

### Apa yang termasuk dalam sebuah kontrak

Kontrak plugin yang baik bersifat:

- bertipe
- kecil
- spesifik kapabilitas
- dimiliki oleh core
- dapat digunakan ulang oleh beberapa plugin
- dapat digunakan oleh channel/fitur tanpa pengetahuan vendor

Kontrak plugin yang buruk bersifat:

- kebijakan spesifik vendor yang tersembunyi di core
- jalur pintas plugin sekali pakai yang melewati registri
- kode channel yang langsung menjangkau implementasi vendor
- objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau
  `api.runtime`

Jika ragu, naikkan tingkat abstraksinya: definisikan kapabilitasnya dulu, lalu
biarkan plugin terhubung ke sana.

## Model eksekusi

Plugin native OpenClaw berjalan **in-process** dengan Gateway. Plugin ini tidak
disandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses
yang sama dengan kode core.

Implikasinya:

- plugin native dapat mendaftarkan tool, network handler, hook, dan layanan
- bug pada plugin native dapat membuat gateway crash atau tidak stabil
- plugin native yang berbahaya setara dengan eksekusi kode arbitrer di dalam
  proses OpenClaw

Bundle yang kompatibel lebih aman secara default karena OpenClaw saat ini
memperlakukan mereka sebagai paket metadata/konten. Dalam rilis saat ini, itu
terutama berarti Skills yang dibundel.

Gunakan allowlist dan path install/load yang eksplisit untuk plugin yang tidak dibundel.
Perlakukan plugin workspace sebagai kode waktu pengembangan, bukan default produksi.

Untuk nama paket workspace yang dibundel, pertahankan id plugin tertanam dalam
nama npm: `@openclaw/<id>` secara default, atau sufiks bertipe yang disetujui seperti
`-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` ketika
paket tersebut memang sengaja mengekspos peran plugin yang lebih sempit.

Catatan kepercayaan penting:

- `plugins.allow` memercayai **id plugin**, bukan provenance sumber.
- Plugin workspace dengan id yang sama seperti plugin bundled dengan sengaja membayangi
  salinan bundled ketika plugin workspace itu diaktifkan/masuk allowlist.
- Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix.

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan kemudahan implementasi.

Pertahankan registrasi kapabilitas tetap publik. Pangkas ekspor helper non-kontrak:

- subpath helper yang spesifik plugin bundled
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper kemudahan spesifik vendor
- helper setup/onboarding yang merupakan detail implementasi

Beberapa subpath helper plugin bundled masih tetap ada dalam peta ekspor SDK
yang dihasilkan untuk kompatibilitas dan pemeliharaan plugin bundled. Contoh saat ini mencakup
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan beberapa seam `plugin-sdk/matrix*`. Perlakukan itu sebagai
ekspor detail implementasi yang dicadangkan, bukan sebagai pola SDK yang
direkomendasikan untuk plugin pihak ketiga baru.

## Pipeline pemuatan

Saat startup, OpenClaw secara garis besar melakukan ini:

1. menemukan root plugin kandidat
2. membaca manifest native atau bundle yang kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalkan config plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan enablement untuk setiap kandidat
6. memuat modul native yang diaktifkan melalui jiti
7. memanggil hook native `register(api)` (atau `activate(api)` — alias lama) dan mengumpulkan registrasi ke dalam registri plugin
8. mengekspos registri ke surface perintah/runtime

<Note>
`activate` adalah alias lama untuk `register` — loader me-resolve mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin bundled menggunakan `register`; utamakan `register` untuk plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
ketika entry keluar dari root plugin, path dapat ditulis oleh semua orang, atau
kepemilikan path terlihat mencurigakan untuk plugin yang tidak dibundel.

### Perilaku manifest-first

Manifest adalah sumber kebenaran control plane. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan channel/Skills/schema config yang dideklarasikan atau kapabilitas bundle
- memvalidasi `plugins.entries.<id>.config`
- menambah label/placeholder Control UI
- menampilkan metadata install/katalog
- mempertahankan descriptor aktivasi dan setup yang ringan tanpa memuat runtime plugin

Untuk plugin native, modul runtime adalah bagian data plane. Modul ini mendaftarkan
perilaku aktual seperti hook, tool, perintah, atau alur provider.

Blok `activation` dan `setup` manifest yang opsional tetap berada di control plane.
Keduanya adalah descriptor metadata-only untuk perencanaan aktivasi dan discovery setup;
keduanya tidak menggantikan registrasi runtime, `register(...)`, atau `setupEntry`.
Konsumen aktivasi pertama sekarang menggunakan petunjuk perintah manifest untuk mempersempit
pemuatan plugin CLI ketika perintah utama diketahui, alih-alih selalu memuat setiap
plugin yang mampu CLI sejak awal.

Discovery setup sekarang lebih mengutamakan id milik descriptor seperti
`setup.providers` dan `setup.cliBackends` untuk mempersempit plugin kandidat sebelum fallback ke
`setup-api` untuk plugin yang masih memerlukan hook runtime saat setup. Jika lebih dari
satu plugin yang ditemukan mengklaim id provider setup atau backend CLI yang sama setelah dinormalisasi,
pencarian setup menolak pemilik yang ambigu itu alih-alih bergantung pada urutan discovery.

### Apa yang dicache oleh loader

OpenClaw menyimpan cache in-process jangka pendek untuk:

- hasil discovery
- data registri manifest
- registri plugin yang dimuat

Cache ini mengurangi lonjakan startup dan overhead perintah berulang. Cache ini aman
untuk dianggap sebagai cache performa berumur pendek, bukan persistensi.

Catatan performa:

- Setel `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` atau
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` untuk menonaktifkan cache ini.
- Sesuaikan jendela cache dengan `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` dan
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model registri

Plugin yang dimuat tidak langsung memodifikasi global core acak. Mereka mendaftar ke
registri plugin pusat.

Registri melacak:

- record plugin (identitas, sumber, asal, status, diagnostik)
- tool
- hook lama dan hook bertipe
- channel
- provider
- handler RPC gateway
- route HTTP
- registrar CLI
- layanan latar belakang
- perintah milik plugin

Fitur core kemudian membaca dari registri tersebut alih-alih berbicara langsung
dengan modul plugin. Ini menjaga alur pemuatan tetap satu arah:

- modul plugin -> registrasi registri
- runtime core -> konsumsi registri

Pemisahan ini penting untuk kemudahan pemeliharaan. Artinya sebagian besar
surface core hanya memerlukan satu titik integrasi: "baca registri", bukan
"buat kasus khusus untuk setiap modul plugin".

## Callback pengikatan percakapan

Plugin yang mengikat percakapan dapat bereaksi saat sebuah persetujuan
diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah
permintaan pengikatan disetujui atau ditolak:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Field payload callback:

- `status`: `"approved"` atau `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, atau `"deny"`
- `binding`: pengikatan yang sudah di-resolve untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, id pengirim, dan
  metadata percakapan

Callback ini hanya untuk notifikasi. Ini tidak mengubah siapa yang diizinkan
untuk mengikat percakapan, dan callback ini berjalan setelah penanganan
persetujuan core selesai.

## Hook runtime provider

Plugin provider sekarang memiliki dua lapisan:

- metadata manifest: `providerAuthEnvVars` untuk lookup auth env provider yang ringan
  sebelum runtime dimuat, `providerAuthAliases` untuk varian provider yang berbagi
  auth, `channelEnvVars` untuk lookup env/setup channel yang ringan sebelum runtime
  dimuat, serta `providerAuthChoices` untuk label onboarding/pilihan auth yang ringan dan
  metadata flag CLI sebelum runtime dimuat
- hook saat waktu config: `catalog` / `discovery` lama serta `applyConfigDefaults`
- hook runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw tetap memiliki loop agent generik, failover, penanganan transkrip, dan
kebijakan tool. Hook ini adalah surface ekstensi untuk perilaku spesifik provider tanpa
memerlukan transport inferensi kustom sepenuhnya.

Gunakan manifest `providerAuthEnvVars` saat provider memiliki kredensial berbasis env
yang perlu terlihat oleh path auth/status/model-picker generik tanpa memuat runtime plugin.
Gunakan manifest `providerAuthAliases` saat satu id provider harus menggunakan kembali env var,
profil auth, auth berbasis config, dan pilihan onboarding API key milik id provider lain.
Gunakan manifest `providerAuthChoices` saat surface CLI onboarding/pilihan auth
perlu mengetahui id pilihan provider, label grup, dan wiring auth satu-flag sederhana
tanpa memuat runtime provider. Pertahankan `envVars` runtime provider untuk petunjuk
yang berhadapan dengan operator seperti label onboarding atau
variabel setup OAuth client-id/client-secret.

Gunakan manifest `channelEnvVars` saat sebuah channel memiliki auth atau setup berbasis env
yang perlu terlihat oleh fallback shell-env generik, pemeriksaan config/status, atau prompt setup
tanpa memuat runtime channel.

### Urutan dan penggunaan hook

Untuk plugin model/provider, OpenClaw memanggil hook dalam urutan kasar berikut.
Kolom "Kapan digunakan" adalah panduan keputusan cepat.

| #   | Hook                              | Fungsinya                                                                                                      | Kapan digunakan                                                                                                                             |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Mempublikasikan config provider ke `models.providers` selama pembuatan `models.json`                          | Provider memiliki katalog atau default base URL                                                                                             |
| 2   | `applyConfigDefaults`             | Menerapkan default config global milik provider selama materialisasi config                                    | Default bergantung pada mode auth, env, atau semantik keluarga model provider                                                              |
| --  | _(lookup model bawaan)_           | OpenClaw mencoba path registri/katalog normal terlebih dahulu                                                 | _(bukan hook plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Menormalkan alias model-id lama atau preview sebelum lookup                                                    | Provider memiliki pembersihan alias sebelum resolusi model kanonis                                                                          |
| 4   | `normalizeTransport`              | Menormalkan `api` / `baseUrl` keluarga provider sebelum perakitan model generik                               | Provider memiliki pembersihan transport untuk id provider kustom dalam keluarga transport yang sama                                         |
| 5   | `normalizeConfig`                 | Menormalkan `models.providers.<id>` sebelum resolusi runtime/provider                                          | Provider memerlukan pembersihan config yang seharusnya berada bersama plugin; helper keluarga Google yang dibundel juga menjadi penopang entri config Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompatibilitas native streaming-usage pada provider config                          | Provider memerlukan perbaikan metadata native streaming usage yang didorong endpoint                                                       |
| 7   | `resolveConfigApiKey`             | Me-resolve auth env-marker untuk provider config sebelum pemuatan auth runtime                                 | Provider memiliki resolusi API key env-marker milik provider; `amazon-bedrock` juga memiliki resolver env-marker AWS bawaan di sini       |
| 8   | `resolveSyntheticAuth`            | Menampilkan auth lokal/self-hosted atau berbasis config tanpa menyimpan plaintext                              | Provider dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                         |
| 9   | `resolveExternalAuthProfiles`     | Menimpa profil auth eksternal milik provider; `persistence` default adalah `runtime-only` untuk kredensial milik CLI/app | Provider menggunakan kembali kredensial auth eksternal tanpa menyimpan refresh token yang disalin                                         |
| 10  | `shouldDeferSyntheticProfileAuth` | Menurunkan prioritas placeholder profil sintetis yang tersimpan di bawah auth berbasis env/config              | Provider menyimpan profil placeholder sintetis yang seharusnya tidak menang prioritas                                                      |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk model id milik provider yang belum ada di registri lokal                                | Provider menerima model id upstream arbitrer                                                                                                |
| 12  | `prepareDynamicModel`             | Warm-up asinkron, lalu `resolveDynamicModel` dijalankan lagi                                                   | Provider memerlukan metadata jaringan sebelum me-resolve id yang tidak dikenal                                                             |
| 13  | `normalizeResolvedModel`          | Penulisan ulang final sebelum embedded runner menggunakan model yang sudah di-resolve                          | Provider memerlukan penulisan ulang transport tetapi tetap menggunakan transport core                                                       |
| 14  | `contributeResolvedModelCompat`   | Menambahkan flag kompatibilitas untuk model vendor di balik transport kompatibel lain                          | Provider mengenali modelnya sendiri pada transport proksi tanpa mengambil alih provider                                                    |
| 15  | `capabilities`                    | Metadata transkrip/tooling milik provider yang digunakan oleh logika core bersama                              | Provider memerlukan kekhasan transkrip/keluarga provider                                                                                   |
| 16  | `normalizeToolSchemas`            | Menormalkan schema tool sebelum embedded runner melihatnya                                                     | Provider memerlukan pembersihan schema keluarga transport                                                                                  |
| 17  | `inspectToolSchemas`              | Menampilkan diagnostik schema milik provider setelah normalisasi                                               | Provider menginginkan peringatan keyword tanpa mengajarkan aturan spesifik provider ke core                                               |
| 18  | `resolveReasoningOutputMode`      | Memilih kontrak output reasoning native vs bertag                                                              | Provider memerlukan output reasoning/final bertag alih-alih field native                                                                   |
| 19  | `prepareExtraParams`              | Normalisasi parameter request sebelum wrapper opsi stream generik                                              | Provider memerlukan parameter request default atau pembersihan parameter per-provider                                                      |
| 20  | `createStreamFn`                  | Sepenuhnya mengganti path stream normal dengan transport kustom                                                | Provider memerlukan protokol wire kustom, bukan sekadar wrapper                                                                            |
| 21  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Provider memerlukan wrapper kompatibilitas header/body/model request tanpa transport kustom                                                |
| 22  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport native per-turn                                                     | Provider ingin transport generik mengirim identitas turn native provider                                                                   |
| 23  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan cool-down sesi                                              | Provider ingin transport WS generik menyetel header sesi atau kebijakan fallback                                                           |
| 24  | `formatApiKey`                    | Formatter auth-profile: profil yang disimpan menjadi string `apiKey` runtime                                   | Provider menyimpan metadata auth tambahan dan memerlukan bentuk token runtime kustom                                                       |
| 25  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                          | Provider tidak cocok dengan refresher `pi-ai` bersama                                                                                      |
| 26  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                   | Provider memerlukan panduan perbaikan auth milik provider setelah refresh gagal                                                            |
| 27  | `matchesContextOverflowError`     | Matcher overflow context-window milik provider                                                                 | Provider memiliki error overflow mentah yang akan terlewat oleh heuristik generik                                                          |
| 28  | `classifyFailoverReason`          | Klasifikasi alasan failover milik provider                                                                     | Provider dapat memetakan error API/transport mentah ke rate-limit/overload/dll.                                                           |
| 29  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk provider proxy/backhaul                                                           | Provider memerlukan gating cache TTL yang spesifik proksi                                                                                  |
| 30  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan missing-auth generik                                                                 | Provider memerlukan petunjuk pemulihan missing-auth yang spesifik provider                                                                 |
| 31  | `suppressBuiltInModel`            | Penekanan model upstream usang ditambah petunjuk error opsional yang terlihat oleh pengguna                    | Provider perlu menyembunyikan baris upstream usang atau menggantinya dengan petunjuk vendor                                                |
| 32  | `augmentModelCatalog`             | Baris katalog sintetis/final yang ditambahkan setelah discovery                                                | Provider memerlukan baris forward-compat sintetis dalam `models list` dan picker                                                           |
| 33  | `isBinaryThinking`                | Toggle reasoning aktif/nonaktif untuk provider binary-thinking                                                 | Provider hanya mengekspos binary thinking aktif/nonaktif                                                                                    |
| 34  | `supportsXHighThinking`           | Dukungan reasoning `xhigh` untuk model tertentu                                                                | Provider ingin `xhigh` hanya pada subset model tertentu                                                                                     |
| 35  | `resolveDefaultThinkingLevel`     | Level `/think` default untuk keluarga model tertentu                                                           | Provider memiliki kebijakan `/think` default untuk sebuah keluarga model                                                                   |
| 36  | `isModernModelRef`                | Matcher model modern untuk filter live profile dan pemilihan smoke                                             | Provider memiliki pencocokan preferred-model live/smoke                                                                                    |
| 37  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/key runtime aktual tepat sebelum inferensi                | Provider memerlukan pertukaran token atau kredensial request berumur pendek                                                                |
| 38  | `resolveUsageAuth`                | Me-resolve kredensial usage/billing untuk `/usage` dan surface status terkait                                  | Provider memerlukan parsing token usage/kuota kustom atau kredensial usage yang berbeda                                                    |
| 39  | `fetchUsageSnapshot`              | Mengambil dan menormalkan snapshot usage/kuota spesifik provider setelah auth di-resolve                       | Provider memerlukan endpoint usage atau parser payload yang spesifik provider                                                               |
| 40  | `createEmbeddingProvider`         | Membangun adapter embedding milik provider untuk memori/pencarian                                              | Perilaku embedding memori harus berada bersama plugin provider                                                                              |
| 41  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengontrol penanganan transkrip untuk provider                             | Provider memerlukan kebijakan transkrip kustom (misalnya, penghapusan blok thinking)                                                       |
| 42  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                             | Provider memerlukan penulisan ulang replay spesifik provider di luar helper pemadatan bersama                                              |
| 43  | `validateReplayTurns`             | Validasi atau pembentukan ulang replay-turn final sebelum embedded runner                                      | Transport provider memerlukan validasi turn yang lebih ketat setelah sanitasi generik                                                      |
| 44  | `onModelSelected`                 | Menjalankan efek samping pascapemilihan milik provider                                                         | Provider memerlukan telemetri atau state milik provider saat sebuah model menjadi aktif                                                    |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` pertama-tama memeriksa
plugin provider yang cocok, lalu meneruskan ke plugin provider lain yang mampu hook
sampai salah satunya benar-benar mengubah model id atau transport/config. Ini menjaga
shim provider alias/compat tetap berfungsi tanpa mengharuskan pemanggil mengetahui plugin
bundled mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook provider yang
menulis ulang entri config keluarga Google yang didukung, normalizer config Google yang
dibundel tetap menerapkan pembersihan kompatibilitas tersebut.

Jika provider memerlukan protokol wire yang sepenuhnya kustom atau eksekutor request
kustom, itu adalah kelas ekstensi yang berbeda. Hook ini ditujukan untuk perilaku provider
yang tetap berjalan pada loop inferensi normal OpenClaw.

### Contoh provider

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Contoh bawaan

- Anthropic menggunakan `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  dan `wrapStreamFn` karena plugin ini memiliki forward-compat Claude 4.6,
  petunjuk keluarga provider, panduan perbaikan auth, integrasi endpoint usage,
  kelayakan prompt-cache, default config yang sadar auth, kebijakan thinking
  default/adaptif Claude, dan pembentukan stream spesifik Anthropic untuk
  header beta, `/fast` / `serviceTier`, dan `context1m`.
- Helper stream spesifik Claude milik Anthropic untuk saat ini tetap berada di
  seam publik `api.ts` / `contract-api.ts` milik plugin bundled itu sendiri. Surface paket
  tersebut mengekspor `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan builder wrapper
  Anthropic tingkat rendah alih-alih memperlebar SDK generik di sekitar aturan
  beta-header milik satu provider.
- OpenAI menggunakan `resolveDynamicModel`, `normalizeResolvedModel`, dan
  `capabilities` serta `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, dan `isModernModelRef`
  karena plugin ini memiliki forward-compat GPT-5.4, normalisasi langsung OpenAI
  `openai-completions` -> `openai-responses`, petunjuk auth yang sadar Codex,
  penekanan Spark, baris daftar OpenAI sintetis, dan kebijakan thinking /
  live-model GPT-5; keluarga stream `openai-responses-defaults` memiliki
  wrapper OpenAI Responses native bersama untuk header atribusi,
  `/fast`/`serviceTier`, verbositas teks, pencarian web Codex native,
  pembentukan payload reasoning-compat, dan manajemen konteks Responses.
- OpenRouter menggunakan `catalog` serta `resolveDynamicModel` dan
  `prepareDynamicModel` karena provider ini bersifat pass-through dan dapat mengekspos
  model id baru sebelum katalog statis OpenClaw diperbarui; plugin ini juga menggunakan
  `capabilities`, `wrapStreamFn`, dan `isCacheTtlEligible` agar
  header request spesifik provider, metadata routing, patch reasoning, dan
  kebijakan prompt-cache tidak masuk ke core. Kebijakan replay-nya berasal dari
  keluarga `passthrough-gemini`, sedangkan keluarga stream `openrouter-thinking`
  memiliki injeksi reasoning proxy dan skip model yang tidak didukung / `auto`.
- GitHub Copilot menggunakan `catalog`, `auth`, `resolveDynamicModel`, dan
  `capabilities` serta `prepareRuntimeAuth` dan `fetchUsageSnapshot` karena
  memerlukan login perangkat milik provider, perilaku fallback model, kekhasan
  transkrip Claude, pertukaran token GitHub -> token Copilot, dan endpoint usage milik provider.
- OpenAI Codex menggunakan `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, dan `augmentModelCatalog` serta
  `prepareExtraParams`, `resolveUsageAuth`, dan `fetchUsageSnapshot` karena plugin ini
  masih berjalan pada transport OpenAI core tetapi memiliki normalisasi
  transport/base URL, kebijakan fallback refresh OAuth, pilihan transport default,
  baris katalog Codex sintetis, dan integrasi endpoint usage ChatGPT; plugin ini
  berbagi keluarga stream `openai-responses-defaults` yang sama dengan OpenAI langsung.
- Google AI Studio dan Gemini CLI OAuth menggunakan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, dan `isModernModelRef` karena keluarga replay
  `google-gemini` memiliki fallback forward-compat Gemini 3.1,
  validasi replay Gemini native, sanitasi replay bootstrap, mode output reasoning
  bertag, dan pencocokan model modern, sementara keluarga stream
  `google-thinking` memiliki normalisasi payload thinking Gemini;
  Gemini CLI OAuth juga menggunakan `formatApiKey`, `resolveUsageAuth`, dan
  `fetchUsageSnapshot` untuk formatting token, parsing token, dan wiring endpoint kuota.
- Anthropic Vertex menggunakan `buildReplayPolicy` melalui keluarga replay
  `anthropic-by-model` sehingga pembersihan replay spesifik Claude tetap
  terlingkup pada id Claude, bukan setiap transport `anthropic-messages`.
- Amazon Bedrock menggunakan `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, dan `resolveDefaultThinkingLevel` karena plugin ini memiliki
  klasifikasi error spesifik Bedrock untuk throttle/not-ready/context-overflow
  pada trafik Anthropic-on-Bedrock; kebijakan replay-nya tetap menggunakan
  guard khusus Claude `anthropic-by-model` yang sama.
- OpenRouter, Kilocode, Opencode, dan Opencode Go menggunakan `buildReplayPolicy`
  melalui keluarga replay `passthrough-gemini` karena mereka memproksikan model
  Gemini melalui transport yang kompatibel dengan OpenAI dan memerlukan
  sanitasi thought-signature Gemini tanpa validasi replay Gemini native atau
  penulisan ulang bootstrap.
- MiniMax menggunakan `buildReplayPolicy` melalui keluarga replay
  `hybrid-anthropic-openai` karena satu provider memiliki semantik
  Anthropic-message dan OpenAI-compatible sekaligus; plugin ini mempertahankan
  penghapusan thinking-block khusus Claude di sisi Anthropic sambil menimpa mode
  output reasoning kembali ke native, dan keluarga stream `minimax-fast-mode` memiliki
  penulisan ulang model fast-mode pada path stream bersama.
- Moonshot menggunakan `catalog` serta `wrapStreamFn` karena plugin ini masih menggunakan
  transport OpenAI bersama tetapi memerlukan normalisasi payload thinking milik provider; keluarga stream
  `moonshot-thinking` memetakan config serta state `/think` ke payload binary thinking native-nya.
- Kilocode menggunakan `catalog`, `capabilities`, `wrapStreamFn`, dan
  `isCacheTtlEligible` karena memerlukan header request milik provider,
  normalisasi payload reasoning, petunjuk transkrip Gemini, dan gating
  cache-TTL Anthropic; keluarga stream `kilocode-thinking` menjaga injeksi
  thinking Kilo pada path stream proxy bersama sambil melewati `kilo/auto` dan
  model id proxy lain yang tidak mendukung payload reasoning eksplisit.
- Z.AI menggunakan `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, dan `fetchUsageSnapshot` karena plugin ini memiliki fallback GLM-5,
  default `tool_stream`, UX binary thinking, pencocokan model modern, serta
  auth usage + pengambilan kuota; keluarga stream `tool-stream-default-on` menjaga wrapper
  `tool_stream` yang aktif secara default tetap berada di luar glue tulisan tangan per-provider.
- xAI menggunakan `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, dan `isModernModelRef`
  karena plugin ini memiliki normalisasi transport xAI Responses native, penulisan ulang alias
  Grok fast-mode, default `tool_stream`, pembersihan strict-tool / payload reasoning,
  penggunaan kembali auth fallback untuk tool milik plugin, resolusi model Grok
  forward-compat, dan patch compat milik provider seperti profil tool-schema xAI,
  keyword schema yang tidak didukung, `web_search` native, dan decoding argumen
  tool-call entitas HTML.
- Mistral, OpenCode Zen, dan OpenCode Go hanya menggunakan `capabilities` untuk
  menjaga kekhasan transkrip/tooling tetap berada di luar core.
- Provider bundled yang hanya katalog seperti `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan `volcengine` hanya menggunakan
  `catalog`.
- Qwen menggunakan `catalog` untuk provider teksnya serta registrasi media-understanding
  dan video-generation bersama untuk surface multimodalnya.
- MiniMax dan Xiaomi menggunakan `catalog` serta hook usage karena perilaku `/usage`
  mereka dimiliki plugin meskipun inferensi tetap berjalan melalui transport bersama.

## Helper runtime

Plugin dapat mengakses helper core tertentu melalui `api.runtime`. Untuk TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Catatan:

- `textToSpeech` mengembalikan payload output TTS core normal untuk surface file/voice-note.
- Menggunakan konfigurasi core `messages.tts` dan pemilihan provider.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk provider.
- `listVoices` bersifat opsional per provider. Gunakan untuk voice picker atau alur setup milik vendor.
- Daftar suara dapat mencakup metadata yang lebih kaya seperti locale, gender, dan tag personality untuk picker yang sadar provider.
- OpenAI dan ElevenLabs saat ini mendukung teleponi. Microsoft tidak.

Plugin juga dapat mendaftarkan provider ucapan melalui `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Catatan:

- Pertahankan kebijakan TTS, fallback, dan pengiriman balasan di core.
- Gunakan provider ucapan untuk perilaku sintesis milik vendor.
- Input `edge` Microsoft lama dinormalkan ke id provider `microsoft`.
- Model kepemilikan yang diutamakan berorientasi perusahaan: satu plugin vendor dapat memiliki
  provider teks, ucapan, gambar, dan media masa depan ketika OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, plugin mendaftarkan satu provider
media-understanding bertipe alih-alih bag key/value generik:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Catatan:

- Pertahankan orkestrasi, fallback, config, dan wiring channel di core.
- Pertahankan perilaku vendor di plugin provider.
- Ekspansi aditif harus tetap bertipe: metode opsional baru, field hasil
  opsional baru, kapabilitas opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - core memiliki kontrak kapabilitas dan helper runtime
  - plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - plugin fitur/channel menggunakan `api.runtime.videoGeneration.*`

Untuk helper runtime media-understanding, plugin dapat memanggil:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Untuk transkripsi audio, plugin dapat menggunakan runtime media-understanding
atau alias STT yang lebih lama:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opsional ketika MIME tidak dapat diinferensikan dengan andal:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah surface bersama yang diutamakan untuk
  pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio media-understanding core (`tools.media.audio`) dan urutan fallback provider.
- Mengembalikan `{ text: undefined }` ketika tidak ada output transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap tersedia sebagai alias kompatibilitas.

Plugin juga dapat menjalankan subagent latar belakang melalui `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Catatan:

- `provider` dan `model` adalah override per-run yang opsional, bukan perubahan sesi yang persisten.
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk run fallback milik plugin, operator harus memberikan opt-in dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi plugin tepercaya ke target `provider/model` kanonis tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Run subagent plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam melakukan fallback.

Untuk pencarian web, plugin dapat menggunakan helper runtime bersama alih-alih
menjangkau wiring tool agent:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin juga dapat mendaftarkan provider pencarian web melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Pertahankan pemilihan provider, resolusi kredensial, dan semantik request bersama di core.
- Gunakan provider pencarian web untuk transport pencarian spesifik vendor.
- `api.runtime.webSearch.*` adalah surface bersama yang diutamakan untuk plugin fitur/channel yang memerlukan perilaku pencarian tanpa bergantung pada wrapper tool agent.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: membuat gambar menggunakan rantai provider pembuatan gambar yang dikonfigurasi.
- `listProviders(...)`: menampilkan provider pembuatan gambar yang tersedia dan kapabilitasnya.

## Route HTTP Gateway

Plugin dapat mengekspos endpoint HTTP dengan `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Field route:

- `path`: path route di bawah server HTTP gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth gateway normal, atau `"plugin"` untuk auth terkelola plugin/verifikasi webhook.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Mengizinkan plugin yang sama mengganti registrasi route miliknya sendiri yang sudah ada.
- `handler`: kembalikan `true` ketika route menangani request.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan error saat pemuatan plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Route plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` yang identik ditolak kecuali `replaceExisting: true`, dan satu plugin tidak dapat mengganti route milik plugin lain.
- Route yang saling tumpang tindih dengan level `auth` yang berbeda akan ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Route `auth: "plugin"` **tidak** otomatis menerima runtime scope operator. Route ini ditujukan untuk webhook/verifikasi signature yang dikelola plugin, bukan pemanggilan helper Gateway berhak istimewa.
- Route `auth: "gateway"` berjalan di dalam runtime scope request Gateway, tetapi scope tersebut sengaja dibuat konservatif:
  - auth bearer shared-secret (`gateway.auth.mode = "token"` / `"password"`) menjaga runtime scope route plugin tetap dipatok ke `operator.write`, meskipun pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya yang membawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) hanya menghormati `x-openclaw-scopes` ketika header tersebut memang ada secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada request route plugin yang membawa identitas tersebut, runtime scope akan fallback ke `operator.write`
- Aturan praktis: jangan berasumsi bahwa route plugin dengan auth gateway adalah surface admin implisit. Jika route Anda memerlukan perilaku khusus admin, wajibkan mode auth yang membawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Path impor Plugin SDK

Gunakan subpath SDK alih-alih impor monolitik `openclaw/plugin-sdk` saat
menulis plugin:

- `openclaw/plugin-sdk/plugin-entry` untuk primitif registrasi plugin.
- `openclaw/plugin-sdk/core` untuk kontrak generik bersama yang menghadap plugin.
- `openclaw/plugin-sdk/config-schema` untuk ekspor schema Zod root `openclaw.json`
  (`OpenClawSchema`).
- Primitif channel stabil seperti `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input`, dan
  `openclaw/plugin-sdk/webhook-ingress` untuk wiring setup/auth/balasan/webhook
  bersama. `channel-inbound` adalah rumah bersama untuk debounce, mention matching,
  helper kebijakan mention inbound, formatting envelope, dan helper konteks
  envelope inbound.
  `channel-setup` adalah seam setup narrow optional-install.
  `setup-runtime` adalah surface setup yang aman untuk runtime yang digunakan oleh `setupEntry` /
  startup tertunda, termasuk adapter patch setup yang aman untuk impor.
  `setup-adapter-runtime` adalah seam adapter account-setup yang sadar env.
  `setup-tools` adalah seam helper CLI/arsip/dokumen kecil (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subpath domain seperti `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store`, dan
  `openclaw/plugin-sdk/directory-runtime` untuk helper runtime/config bersama.
  `telegram-command-config` adalah seam publik sempit untuk normalisasi/validasi custom command Telegram dan tetap tersedia meskipun
  surface kontrak Telegram bundled untuk sementara tidak tersedia.
  `text-runtime` adalah seam teks/markdown/logging bersama, termasuk
  penghapusan teks yang terlihat oleh asisten, helper render/chunking markdown, helper redaksi,
  helper directive-tag, dan utilitas safe-text.
- Seam channel yang spesifik approval sebaiknya memilih satu kontrak `approvalCapability`
  pada plugin. Core kemudian membaca auth approval, pengiriman, render,
  native-routing, dan perilaku lazy native-handler melalui satu kapabilitas itu
  alih-alih mencampurkan perilaku approval ke field plugin yang tidak terkait.
- `openclaw/plugin-sdk/channel-runtime` sudah deprecated dan tetap ada hanya sebagai
  shim kompatibilitas untuk plugin yang lebih lama. Kode baru harus mengimpor primitif
  generik yang lebih sempit, dan kode repo tidak boleh menambahkan impor baru dari
  shim tersebut.
- Internal ekstensi bundled tetap privat. Plugin eksternal sebaiknya hanya menggunakan
  subpath `openclaw/plugin-sdk/*`. Kode core/test OpenClaw dapat menggunakan titik masuk publik repo
  di bawah root paket plugin seperti `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, dan file yang terlingkup sempit seperti
  `login-qr-api.js`. Jangan pernah mengimpor `src/*` milik paket plugin dari core atau dari
  ekstensi lain.
- Pemisahan titik masuk repo:
  `<plugin-package-root>/api.js` adalah barrel helper/types,
  `<plugin-package-root>/runtime-api.js` adalah barrel khusus runtime,
  `<plugin-package-root>/index.js` adalah entri plugin bundled,
  dan `<plugin-package-root>/setup-entry.js` adalah entri plugin setup.
- Contoh provider bundled saat ini:
  - Anthropic menggunakan `api.js` / `contract-api.js` untuk helper stream Claude seperti
    `wrapAnthropicProviderStream`, helper beta-header, dan parsing `service_tier`.
  - OpenAI menggunakan `api.js` untuk builder provider, helper default-model, dan
    builder provider realtime.
  - OpenRouter menggunakan `api.js` untuk builder provider serta helper onboarding/config,
    sementara `register.runtime.js` masih dapat mengekspor ulang helper
    `plugin-sdk/provider-stream` generik untuk penggunaan lokal repo.
- Titik masuk publik yang dimuat melalui facade mengutamakan snapshot config runtime aktif
  ketika tersedia, lalu fallback ke file config yang sudah di-resolve di disk saat
  OpenClaw belum menyajikan snapshot runtime.
- Primitif bersama generik tetap menjadi kontrak publik SDK yang diutamakan. Sejumlah kecil
  seam helper bermerek channel dari bundled yang dicadangkan untuk kompatibilitas masih ada.
  Perlakukan itu sebagai seam pemeliharaan bundled/kompatibilitas, bukan target impor pihak ketiga baru;
  kontrak lintas channel baru tetap harus ditempatkan pada subpath `plugin-sdk/*` generik atau barrel
  `api.js` / `runtime-api.js` lokal plugin.

Catatan kompatibilitas:

- Hindari barrel root `openclaw/plugin-sdk` untuk kode baru.
- Utamakan primitif stabil yang sempit terlebih dahulu. Subpath setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool yang lebih baru adalah kontrak yang dituju untuk pekerjaan
  plugin bundled dan eksternal yang baru.
  Parsing/matching target harus ditempatkan pada `openclaw/plugin-sdk/channel-targets`.
  Gerbang aksi pesan dan helper message-id reaksi harus ditempatkan pada
  `openclaw/plugin-sdk/channel-actions`.
- Barrel helper yang spesifik untuk ekstensi bundled tidak stabil secara default. Jika sebuah
  helper hanya diperlukan oleh ekstensi bundled, simpan helper itu di balik seam
  `api.js` atau `runtime-api.js` lokal milik ekstensi tersebut alih-alih mempromosikannya ke
  `openclaw/plugin-sdk/<extension>`.
- Seam helper bersama yang baru harus generik, bukan bermerek channel. Parsing target
  bersama harus ditempatkan pada `openclaw/plugin-sdk/channel-targets`; internal
  spesifik channel tetap berada di balik seam `api.js` atau `runtime-api.js` lokal milik plugin tersebut.
- Subpath spesifik kapabilitas seperti `image-generation`,
  `media-understanding`, dan `speech` ada karena plugin bundled/native
  menggunakannya saat ini. Keberadaannya sendiri tidak otomatis berarti setiap helper yang diekspor adalah
  kontrak eksternal jangka panjang yang dibekukan.

## Schema tool pesan

Plugin harus memiliki kontribusi schema `describeMessageTool(...)` yang spesifik channel.
Pertahankan field spesifik provider di dalam plugin, bukan di core bersama.

Untuk fragmen schema portabel bersama, gunakan kembali helper generik yang diekspor melalui
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` untuk payload bergaya grid tombol
- `createMessageToolCardSchema()` untuk payload kartu terstruktur

Jika suatu bentuk schema hanya masuk akal untuk satu provider, definisikan di source
plugin itu sendiri alih-alih mempromosikannya ke SDK bersama.

## Resolusi target channel

Plugin channel harus memiliki semantik target yang spesifik channel. Pertahankan host
outbound bersama tetap generik dan gunakan surface adapter messaging untuk aturan provider:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target yang sudah dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah sebuah
  input harus langsung melewati resolusi mirip-id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback plugin ketika
  core memerlukan resolusi akhir milik provider setelah normalisasi atau setelah
  direktori tidak menemukan hasil.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi route sesi
  yang spesifik provider setelah target di-resolve.

Pembagian yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  mencari peer/group.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target explicit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi spesifik provider, bukan untuk
  pencarian direktori yang luas.
- Simpan id native provider seperti chat id, thread id, JID, handle, dan room
  id di dalam nilai `target` atau parameter spesifik provider, bukan di field SDK generik.

## Direktori berbasis config

Plugin yang menurunkan entri direktori dari config harus menyimpan logika tersebut di
plugin dan menggunakan kembali helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini ketika sebuah channel memerlukan peer/group berbasis config seperti:

- peer DM berbasis allowlist
- peta channel/group yang dikonfigurasi
- fallback direktori statis yang terlingkup akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran query
- penerapan limit
- helper deduping/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun dan normalisasi id yang spesifik channel harus tetap berada di
implementasi plugin.

## Katalog provider

Plugin provider dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama seperti yang ditulis OpenClaw ke dalam
`models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` ketika plugin memiliki model id spesifik provider, default base URL,
atau metadata model yang dijaga oleh auth.

`catalog.order` mengontrol kapan katalog plugin digabung relatif terhadap
provider implisit bawaan OpenClaw:

- `simple`: provider biasa berbasis API key atau env
- `profile`: provider yang muncul ketika profil auth ada
- `paired`: provider yang mensintesis beberapa entri provider terkait
- `late`: pass terakhir, setelah provider implisit lainnya

Provider yang lebih akhir menang pada tabrakan key, sehingga plugin dapat dengan sengaja
menimpa entri provider bawaan dengan provider id yang sama.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias lama
- jika `catalog` dan `discovery` sama-sama terdaftar, OpenClaw menggunakan `catalog`

## Inspeksi channel read-only

Jika plugin Anda mendaftarkan sebuah channel, utamakan implementasi
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah path runtime. Path ini boleh berasumsi bahwa kredensial
  telah sepenuhnya dimaterialisasi dan dapat gagal cepat ketika secret yang diperlukan tidak ada.
- Path perintah read-only seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur
  perbaikan doctor/config tidak seharusnya perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Hanya kembalikan state akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial jika relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan read-only. Mengembalikan `tokenStatus: "available"` (dan field sumber
  yang sesuai) sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` ketika sebuah kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia pada path perintah saat ini.

Ini memungkinkan perintah read-only melaporkan "configured but unavailable in this command
path" alih-alih crash atau salah melaporkan akun sebagai tidak dikonfigurasi.

## Package pack

Sebuah direktori plugin dapat menyertakan `package.json` dengan `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Setiap entri menjadi sebuah plugin. Jika pack mencantumkan beberapa ekstensi, plugin id
menjadi `name/<fileBase>`.

Jika plugin Anda mengimpor dependensi npm, instal dependensi tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori plugin
setelah resolusi symlink. Entri yang keluar dari direktori paket akan
ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependensi plugin dengan
`npm install --omit=dev --ignore-scripts` (tanpa lifecycle script, tanpa dependensi dev saat runtime). Jaga agar tree dependensi plugin
tetap "pure JS/TS" dan hindari paket yang memerlukan build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus setup.
Ketika OpenClaw memerlukan surface setup untuk plugin channel yang dinonaktifkan, atau
ketika plugin channel diaktifkan tetapi masih belum dikonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entri plugin penuh. Ini menjaga startup dan setup tetap lebih ringan
ketika entri plugin utama Anda juga memasang tool, hook, atau kode khusus runtime lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat mengikutsertakan plugin channel ke path `setupEntry` yang sama selama fase startup
sebelum listen pada gateway, bahkan ketika channel sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup surface startup yang harus ada
sebelum gateway mulai listen. Dalam praktiknya, itu berarti entri setup
harus mendaftarkan setiap kapabilitas milik channel yang dibutuhkan startup, seperti:

- registrasi channel itu sendiri
- route HTTP apa pun yang harus tersedia sebelum gateway mulai listen
- method gateway, tool, atau layanan apa pun yang harus ada selama jendela yang sama

Jika entri penuh Anda masih memiliki kapabilitas startup yang diperlukan, jangan aktifkan
flag ini. Pertahankan plugin pada perilaku default dan biarkan OpenClaw memuat entri penuh selama startup.

Channel bundled juga dapat menerbitkan helper surface kontrak khusus setup yang dapat
dikonsultasikan core sebelum runtime channel penuh dimuat. Surface promosi setup saat ini
adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan surface tersebut ketika perlu mempromosikan config channel
single-account lama ke `channels.<id>.accounts.*` tanpa memuat entri plugin penuh.
Matrix adalah contoh bundled saat ini: plugin ini hanya memindahkan key auth/bootstrap ke akun hasil promosi
bernama ketika akun bernama sudah ada, dan plugin ini dapat mempertahankan key default-account non-kanonis
yang sudah dikonfigurasi alih-alih selalu membuat `accounts.default`.

Adapter patch setup tersebut menjaga discovery surface kontrak bundled tetap lazy. Waktu impor tetap ringan; surface promosi hanya dimuat saat pertama kali digunakan alih-alih memasuki kembali startup channel bundled pada saat impor modul.

Ketika surface startup tersebut menyertakan method RPC gateway, pertahankan method tersebut pada
prefiks spesifik plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve
ke `operator.admin`, bahkan jika sebuah plugin meminta scope yang lebih sempit.

Contoh:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadata katalog channel

Plugin channel dapat mengiklankan metadata setup/discovery melalui `openclaw.channel` dan
petunjuk instalasi melalui `openclaw.install`. Ini menjaga data katalog core tetap kosong dari data spesifik.

Contoh:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat self-hosted melalui bot webhook Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Field `openclaw.channel` yang berguna di luar contoh minimal:

- `detailLabel`: label sekunder untuk surface katalog/status yang lebih kaya
- `docsLabel`: timpa teks tautan untuk tautan dokumen
- `preferOver`: id plugin/channel prioritas lebih rendah yang harus dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan surface pemilihan
- `markdownCapable`: menandai channel sebagai mampu markdown untuk keputusan formatting outbound
- `exposure.configured`: sembunyikan channel dari surface daftar channel yang dikonfigurasi saat disetel ke `false`
- `exposure.setup`: sembunyikan channel dari picker setup/configure interaktif saat disetel ke `false`
- `exposure.docs`: tandai channel sebagai internal/private untuk surface navigasi dokumen
- `showConfigured` / `showInSetup`: alias lama yang masih diterima untuk kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: ikutsertakan channel ke alur `allowFrom` quickstart standar
- `forceAccountBinding`: wajibkan pengikatan akun eksplisit bahkan ketika hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: utamakan lookup sesi saat me-resolve target announce

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya, ekspor registri MPM).
Letakkan file JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau lebih file JSON (dipisahkan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias lama untuk key `"entries"`.

## Plugin context engine

Plugin context engine memiliki orkestrasi konteks sesi untuk ingest, assembly,
dan compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih engine aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini ketika plugin Anda perlu mengganti atau memperluas pipeline konteks
default alih-alih hanya menambahkan pencarian memori atau hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Jika engine Anda **tidak** memiliki algoritme compaction, tetap implementasikan `compact()`
dan delegasikan secara eksplisit:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Menambahkan kapabilitas baru

Ketika sebuah plugin memerlukan perilaku yang tidak cocok dengan API saat ini, jangan
melewati sistem plugin dengan akses privat langsung. Tambahkan kapabilitas yang belum ada.

Urutan yang direkomendasikan:

1. definisikan kontrak core
   Tentukan perilaku bersama apa yang harus dimiliki core: kebijakan, fallback, penggabungan config,
   siklus hidup, semantik yang menghadap channel, dan bentuk helper runtime.
2. tambahkan surface registrasi/runtime plugin yang bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan surface kapabilitas bertipe
   terkecil yang berguna.
3. hubungkan konsumen core + channel/fitur
   Channel dan plugin fitur harus menggunakan kapabilitas baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas tersebut.
5. tambahkan cakupan kontrak
   Tambahkan test agar kepemilikan dan bentuk registrasi tetap eksplisit seiring waktu.

Inilah cara OpenClaw tetap opinionated tanpa menjadi hardcoded pada satu
sudut pandang provider. Lihat [Capability Cookbook](/id/plugins/architecture)
untuk checklist file konkret dan contoh yang dikerjakan.

### Checklist kapabilitas

Saat Anda menambahkan kapabilitas baru, implementasinya biasanya harus menyentuh
surface ini secara bersamaan:

- tipe kontrak core di `src/<capability>/types.ts`
- runner/helper runtime core di `src/<capability>/runtime.ts`
- surface registrasi API plugin di `src/plugins/types.ts`
- wiring registri plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` ketika plugin fitur/channel
  perlu menggunakannya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumen operator/plugin di `docs/`

Jika salah satu surface tersebut tidak ada, biasanya itu pertanda bahwa kapabilitasnya
belum sepenuhnya terintegrasi.

### Template kapabilitas

Pola minimal:

```ts
// kontrak core
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime bersama untuk plugin fitur/channel
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Pola tes kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Itu menjaga aturannya tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/channel menggunakan helper runtime
- tes kontrak menjaga kepemilikan tetap eksplisit
