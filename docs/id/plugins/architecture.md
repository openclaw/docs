---
read_when:
    - Membangun atau men-debug plugin OpenClaw native
    - Memahami model kapabilitas plugin atau batas kepemilikan
    - Mengerjakan pipeline pemuatan plugin atau registry
    - Mengimplementasikan hook runtime penyedia atau plugin channel
sidebarTitle: Internals
summary: 'Internal plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-04-08T02:19:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c40ecf14e2a0b2b8d332027aed939cd61fb4289a489f4cd4c076c96d707d1138
    source_path: plugins/architecture.md
    workflow: 15
---

# Internal Plugin

<Info>
  Ini adalah **referensi arsitektur mendalam**. Untuk panduan praktis, lihat:
  - [Instal dan gunakan plugin](/id/tools/plugin) — panduan pengguna
  - [Memulai](/id/plugins/building-plugins) — tutorial plugin pertama
  - [Plugin Channel](/id/plugins/sdk-channel-plugins) — bangun channel pesan
  - [Plugin Penyedia](/id/plugins/sdk-provider-plugins) — bangun penyedia model
  - [Gambaran Umum SDK](/id/plugins/sdk-overview) — peta import dan API pendaftaran
</Info>

Halaman ini membahas arsitektur internal sistem plugin OpenClaw.

## Model kapabilitas publik

Kapabilitas adalah model **plugin native** publik di dalam OpenClaw. Setiap
plugin OpenClaw native mendaftar ke satu atau lebih jenis kapabilitas:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferensi teks         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Ucapan                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkripsi realtime   | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Suara realtime         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Pembuatan musik        | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pengambilan web        | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pencarian web          | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / pesan        | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, alat, atau
layanan adalah plugin **legacy hook-only**. Pola itu masih sepenuhnya didukung.

### Sikap kompatibilitas eksternal

Model kapabilitas sudah diterapkan di core dan digunakan oleh plugin
bundled/native saat ini, tetapi kompatibilitas plugin eksternal masih memerlukan standar
yang lebih ketat daripada “ini diekspor, berarti dibekukan.”

Panduan saat ini:

- **plugin eksternal yang sudah ada:** jaga integrasi berbasis hook tetap berfungsi; perlakukan
  ini sebagai dasar kompatibilitas
- **plugin bundled/native baru:** utamakan pendaftaran kapabilitas yang eksplisit daripada
  reach-in khusus vendor atau desain hook-only baru
- **plugin eksternal yang mengadopsi pendaftaran kapabilitas:** diperbolehkan, tetapi perlakukan
  permukaan helper khusus kapabilitas sebagai sesuatu yang masih berkembang kecuali dokumentasi secara eksplisit menandai sebuah kontrak sebagai stabil

Aturan praktis:

- API pendaftaran kapabilitas adalah arah yang dituju
- hook legacy tetap menjadi jalur paling aman dari kerusakan untuk plugin eksternal selama
  masa transisi
- subpath helper yang diekspor tidak semuanya setara; utamakan kontrak sempit yang terdokumentasi,
  bukan ekspor helper yang kebetulan ada

### Bentuk plugin

OpenClaw mengklasifikasikan setiap plugin yang dimuat ke dalam sebuah bentuk berdasarkan perilaku
pendaftarannya yang aktual (bukan hanya metadata statis):

- **plain-capability** -- mendaftarkan tepat satu jenis kapabilitas (misalnya
  plugin hanya-penyedia seperti `mistral`)
- **hybrid-capability** -- mendaftarkan beberapa jenis kapabilitas (misalnya
  `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan
  gambar)
- **hook-only** -- hanya mendaftarkan hook (typed atau custom), tanpa kapabilitas,
  alat, perintah, atau layanan
- **non-capability** -- mendaftarkan alat, perintah, layanan, atau rute tetapi tanpa
  kapabilitas

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin dan rincian
kapabilitasnya. Lihat [referensi CLI](/cli/plugins#inspect) untuk detail.

### Hook legacy

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk
plugin hook-only. Plugin nyata lama masih bergantung padanya.

Arah ke depan:

- tetap fungsional
- dokumentasikan sebagai legacy
- utamakan `before_model_resolve` untuk pekerjaan override model/penyedia
- utamakan `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`, Anda mungkin melihat
salah satu label ini:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfigurasi berhasil diurai dan plugin ter-resolve           |
| **compatibility advisory** | Plugin menggunakan pola yang didukung tetapi lebih lama (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated        |
| **hard error**             | Konfigurasi tidak valid atau plugin gagal dimuat                   |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak plugin Anda saat ini --
`hook-only` bersifat advisory, dan `before_agent_start` hanya memicu peringatan. Sinyal-sinyal ini
juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Gambaran umum arsitektur

Sistem plugin OpenClaw memiliki empat lapisan:

1. **Manifest + discovery**
   OpenClaw menemukan kandidat plugin dari path yang dikonfigurasi, root workspace,
   root ekstensi global, dan ekstensi bundled. Discovery membaca manifest native
   `openclaw.plugin.json` ditambah manifest bundle yang didukung terlebih dahulu.
2. **Enablement + validation**
   Core memutuskan apakah plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau
   dipilih untuk slot eksklusif seperti memori.
3. **Runtime loading**
   Plugin OpenClaw native dimuat in-process melalui jiti dan mendaftarkan
   kapabilitas ke registry pusat. Bundle yang kompatibel dinormalisasi menjadi
   catatan registry tanpa mengimpor kode runtime.
4. **Surface consumption**
   Bagian lain dari OpenClaw membaca registry untuk mengekspos alat, channel, setup
   penyedia, hook, rute HTTP, perintah CLI, dan layanan.

Khusus untuk CLI plugin, discovery perintah root dibagi menjadi dua fase:

- metadata saat parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI plugin yang sebenarnya dapat tetap lazy dan mendaftar pada pemanggilan pertama

Ini menjaga kode CLI milik plugin tetap berada di dalam plugin sambil tetap memungkinkan OpenClaw
mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- discovery + validasi konfigurasi harus bekerja dari **metadata manifest/schema**
  tanpa mengeksekusi kode plugin
- perilaku runtime native berasal dari jalur `register(api)` modul plugin

Pemisahan ini memungkinkan OpenClaw memvalidasi konfigurasi, menjelaskan plugin yang hilang/dinonaktifkan, dan
membangun petunjuk UI/schema sebelum runtime penuh aktif.

### Plugin channel dan alat message bersama

Plugin channel tidak perlu mendaftarkan alat send/edit/react terpisah untuk
aksi chat normal. OpenClaw mempertahankan satu alat `message` bersama di core, dan
plugin channel memiliki discovery dan eksekusi khusus channel di baliknya.

Batas saat ini adalah:

- core memiliki host alat `message` bersama, wiring prompt, pembukuan sesi/thread,
  dan dispatch eksekusi
- plugin channel memiliki discovery aksi berscope, discovery kapabilitas, dan fragmen schema
  khusus channel
- plugin channel memiliki grammar percakapan sesi khusus penyedia, seperti
  bagaimana id percakapan mengodekan id thread atau diwariskan dari percakapan induk
- plugin channel mengeksekusi aksi akhir melalui action adapter mereka

Untuk plugin channel, permukaan SDK-nya adalah
`ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan discovery terpadu
itu memungkinkan plugin mengembalikan aksi yang terlihat, kapabilitas, dan kontribusi
schema secara bersamaan agar bagian-bagian itu tidak saling menyimpang.

Core meneruskan scope runtime ke langkah discovery tersebut. Field penting meliputi:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` masuk yang tepercaya

Ini penting untuk plugin yang sensitif terhadap konteks. Sebuah channel dapat menyembunyikan atau mengekspos
aksi message berdasarkan akun aktif, room/thread/message saat ini, atau
identitas requester tepercaya tanpa hardcode branch khusus channel di
alat `message` core.

Inilah sebabnya perubahan routing embedded-runner masih merupakan pekerjaan plugin: runner bertanggung jawab
meneruskan identitas chat/sesi saat ini ke batas discovery plugin
agar alat `message` bersama mengekspos permukaan milik channel yang benar
untuk giliran saat ini.

Untuk helper eksekusi milik channel, plugin bundled sebaiknya mempertahankan runtime
eksekusi di dalam modul ekstensi milik mereka sendiri. Core tidak lagi memiliki runtime
aksi-message Discord, Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`.
Kami tidak menerbitkan subpath `plugin-sdk/*-action-runtime` terpisah, dan plugin
bundled sebaiknya mengimpor kode runtime lokal mereka sendiri langsung dari
modul milik ekstensi mereka.

Batas yang sama berlaku untuk seam SDK bernama penyedia secara umum: core tidak boleh
mengimpor convenience barrel khusus channel untuk Slack, Discord, Signal,
WhatsApp, atau ekstensi serupa. Jika core memerlukan suatu perilaku, gunakan
barrel `api.ts` / `runtime-api.ts` milik plugin bundled itu sendiri atau promosikan
kebutuhan tersebut ke kapabilitas generik yang sempit di SDK bersama.

Khusus untuk poll, ada dua jalur eksekusi:

- `outbound.sendPoll` adalah dasar bersama untuk channel yang cocok dengan model
  poll umum
- `actions.handleAction("poll")` adalah jalur yang diutamakan untuk semantik poll
  khusus channel atau parameter poll tambahan

Core sekarang menunda parsing poll bersama sampai setelah dispatch poll plugin menolak
aksi tersebut, sehingga handler poll milik plugin dapat menerima field poll
khusus channel tanpa terlebih dahulu diblokir oleh parser poll generik.

Lihat [Load pipeline](#load-pipeline) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan plugin native sebagai batas kepemilikan untuk sebuah **perusahaan** atau
sebuah **fitur**, bukan sebagai kumpulan integrasi tak terkait.

Artinya:

- plugin perusahaan biasanya harus memiliki semua permukaan OpenClaw-facing milik perusahaan itu
- plugin fitur biasanya harus memiliki permukaan fitur penuh yang diperkenalkannya
- channel harus mengonsumsi kapabilitas core bersama alih-alih mengimplementasikan ulang
  perilaku penyedia secara ad hoc

Contoh:

- plugin bundled `openai` memiliki perilaku model-provider OpenAI dan perilaku OpenAI
  speech + realtime-voice + media-understanding + image-generation
- plugin bundled `elevenlabs` memiliki perilaku speech ElevenLabs
- plugin bundled `microsoft` memiliki perilaku speech Microsoft
- plugin bundled `google` memiliki perilaku model-provider Google plus perilaku Google
  media-understanding + image-generation + web-search
- plugin bundled `firecrawl` memiliki perilaku web-fetch Firecrawl
- plugin bundled `minimax`, `mistral`, `moonshot`, dan `zai` memiliki backend
  media-understanding mereka
- plugin bundled `qwen` memiliki perilaku text-provider Qwen plus
  perilaku media-understanding dan video-generation
- plugin `voice-call` adalah plugin fitur: ia memiliki transport panggilan, alat,
  CLI, rute, dan bridging media-stream Twilio, tetapi ia mengonsumsi speech bersama
  plus kapabilitas realtime-transcription dan realtime-voice alih-alih
  mengimpor plugin vendor secara langsung

Kondisi akhir yang dituju adalah:

- OpenAI berada dalam satu plugin meskipun mencakup model teks, speech, gambar, dan
  video di masa depan
- vendor lain dapat melakukan hal yang sama untuk area permukaan mereka sendiri
- channel tidak peduli plugin vendor mana yang memiliki penyedia; mereka mengonsumsi
  kontrak kapabilitas bersama yang diekspos oleh core

Inilah perbedaan utamanya:

- **plugin** = batas kepemilikan
- **capability** = kontrak core yang dapat diimplementasikan atau dikonsumsi oleh beberapa plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama bukanlah
“penyedia mana yang harus meng-hardcode penanganan video?” Pertanyaan pertama adalah
“apa kontrak kapabilitas video core?” Setelah kontrak itu ada, plugin vendor
dapat mendaftar ke sana dan plugin channel/fitur dapat mengonsumsinya.

Jika kapabilitasnya belum ada, langkah yang benar biasanya adalah:

1. definisikan kapabilitas yang hilang di core
2. ekspos melalui API/runtime plugin dengan tipe yang jelas
3. hubungkan channel/fitur ke kapabilitas itu
4. biarkan plugin vendor mendaftarkan implementasinya

Ini menjaga kepemilikan tetap eksplisit sambil menghindari perilaku core yang bergantung pada
satu vendor atau jalur kode khusus plugin yang hanya sekali pakai.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan di mana kode seharusnya berada:

- **lapisan kapabilitas core**: orkestrasi bersama, kebijakan, fallback, aturan
  penggabungan konfigurasi, semantik pengiriman, dan kontrak bertipe
- **lapisan plugin vendor**: API khusus vendor, auth, katalog model, speech
  synthesis, pembuatan gambar, backend video di masa depan, endpoint penggunaan
- **lapisan plugin channel/fitur**: integrasi Slack/Discord/voice-call/dll.
  yang mengonsumsi kapabilitas core dan menyajikannya pada suatu permukaan

Misalnya, TTS mengikuti bentuk ini:

- core memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan pengiriman channel
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi synthesis
- `voice-call` mengonsumsi helper runtime TTS telephony

Pola yang sama sebaiknya diutamakan untuk kapabilitas di masa depan.

### Contoh plugin perusahaan multi-kapabilitas

Plugin perusahaan seharusnya terasa kohesif dari luar. Jika OpenClaw memiliki kontrak bersama
untuk model, speech, realtime transcription, realtime voice, media
understanding, image generation, video generation, web fetch, dan web search,
sebuah vendor dapat memiliki semua permukaannya di satu tempat:

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

Yang penting bukan nama helper yang persis sama. Bentuknya yang penting:

- satu plugin memiliki permukaan vendor
- core tetap memiliki kontrak kapabilitas
- channel dan plugin fitur mengonsumsi helper `api.runtime.*`, bukan kode vendor
- test kontrak dapat memastikan bahwa plugin telah mendaftarkan kapabilitas yang
  diklaimnya dimiliki

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu
kapabilitas bersama. Model kepemilikan yang sama juga berlaku di sana:

1. core mendefinisikan kontrak media-understanding
2. plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan
   `describeVideo` sesuai kebutuhan
3. channel dan plugin fitur mengonsumsi perilaku core bersama alih-alih
   terhubung langsung ke kode vendor

Ini menghindari asumsi video dari satu penyedia tertanam di core. Plugin memiliki
permukaan vendor; core memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak
kapabilitas bertipe dan helper runtime, dan plugin vendor mendaftarkan
implementasi `api.registerVideoGenerationProvider(...)` untuknya.

Butuh daftar periksa rollout yang konkret? Lihat
[Capability Cookbook](/id/plugins/architecture).

## Kontrak dan penegakan

Permukaan API plugin sengaja dibuat bertipe dan tersentralisasi di
`OpenClawPluginApi`. Kontrak itu mendefinisikan titik pendaftaran yang didukung dan
helper runtime yang dapat diandalkan oleh sebuah plugin.

Mengapa ini penting:

- penulis plugin mendapatkan satu standar internal yang stabil
- core dapat menolak kepemilikan ganda seperti dua plugin yang mendaftarkan provider id yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk pendaftaran yang salah bentuk
- test kontrak dapat menegakkan kepemilikan plugin bundled dan mencegah drift diam-diam

Ada dua lapisan penegakan:

1. **penegakan pendaftaran runtime**
   Registry plugin memvalidasi pendaftaran saat plugin dimuat. Contoh:
   provider id duplikat, speech provider id duplikat, dan pendaftaran yang salah bentuk
   menghasilkan diagnostik plugin alih-alih perilaku yang tidak terdefinisi.
2. **test kontrak**
   Plugin bundled ditangkap dalam contract registries selama test berjalan sehingga
   OpenClaw dapat menegaskan kepemilikan secara eksplisit. Saat ini ini digunakan untuk model
   provider, speech provider, web search provider, dan kepemilikan pendaftaran bundled.

Efek praktisnya adalah OpenClaw mengetahui, sejak awal, plugin mana yang memiliki permukaan yang mana.
Ini memungkinkan core dan channel menyusun integrasi dengan mulus karena kepemilikan
dinyatakan, bertipe, dan dapat diuji alih-alih implisit.

### Apa yang termasuk dalam sebuah kontrak

Kontrak plugin yang baik adalah:

- bertipe
- kecil
- spesifik kapabilitas
- dimiliki oleh core
- dapat digunakan ulang oleh banyak plugin
- dapat dikonsumsi oleh channel/fitur tanpa pengetahuan vendor

Kontrak plugin yang buruk adalah:

- kebijakan spesifik vendor yang tersembunyi di core
- escape hatch plugin sekali pakai yang melewati registry
- kode channel yang langsung menjangkau implementasi vendor
- objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau
  `api.runtime`

Jika ragu, naikkan tingkat abstraksinya: definisikan dulu kapabilitasnya, lalu
biarkan plugin masuk ke sana.

## Model eksekusi

Plugin OpenClaw native berjalan **in-process** dengan Gateway. Mereka tidak
disandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses yang sama dengan
kode core.

Implikasinya:

- plugin native dapat mendaftarkan alat, handler jaringan, hook, dan layanan
- bug plugin native dapat membuat gateway crash atau tidak stabil
- plugin native yang berbahaya setara dengan eksekusi kode arbitrer di dalam
  proses OpenClaw

Bundle yang kompatibel lebih aman secara default karena OpenClaw saat ini memperlakukan mereka
sebagai paket metadata/konten. Pada rilis saat ini, itu sebagian besar berarti
Skills yang dibundel.

Gunakan allowlist dan path instalasi/pemuatan yang eksplisit untuk plugin non-bundled.
Perlakukan plugin workspace sebagai kode saat pengembangan, bukan default produksi.

Untuk nama paket workspace plugin bundled, pertahankan plugin id terikat di nama npm:
`@openclaw/<id>` secara default, atau sufiks bertipe yang disetujui seperti
`-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` saat
paket memang sengaja mengekspos peran plugin yang lebih sempit.

Catatan kepercayaan penting:

- `plugins.allow` mempercayai **plugin ids**, bukan asal sumber.
- Plugin workspace dengan id yang sama seperti plugin bundled sengaja menimpa
  salinan bundled saat plugin workspace itu diaktifkan/masuk allowlist.
- Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix.

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan convenience implementasi.

Pertahankan pendaftaran kapabilitas tetap publik. Pangkas ekspor helper non-kontrak:

- subpath helper khusus plugin bundled
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper convenience spesifik vendor
- helper setup/onboarding yang merupakan detail implementasi

Beberapa subpath helper plugin bundled masih tetap ada di peta ekspor SDK yang dihasilkan
demi kompatibilitas dan pemeliharaan plugin bundled. Contoh saat ini termasuk
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan beberapa seam `plugin-sdk/matrix*`. Perlakukan itu sebagai
ekspor detail implementasi yang dicadangkan, bukan sebagai pola SDK yang direkomendasikan
untuk plugin pihak ketiga yang baru.

## Load pipeline

Saat startup, OpenClaw kira-kira melakukan ini:

1. menemukan root plugin kandidat
2. membaca manifest native atau bundle yang kompatibel dan metadata paket
3. menolak kandidat yang tidak aman
4. menormalkan konfigurasi plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan enablement untuk setiap kandidat
6. memuat modul native yang diaktifkan melalui jiti
7. memanggil hook native `register(api)` (atau `activate(api)` — alias legacy) dan mengumpulkan pendaftaran ke dalam registry plugin
8. mengekspos registry ke permukaan perintah/runtime

<Note>
`activate` adalah alias legacy untuk `register` — loader me-resolve mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin bundled menggunakan `register`; utamakan `register` untuk plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
saat entry keluar dari root plugin, path dapat ditulis oleh semua orang, atau kepemilikan path
terlihat mencurigakan untuk plugin non-bundled.

### Perilaku manifest-first

Manifest adalah sumber kebenaran control-plane. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan channel/Skills/schema konfigurasi yang dideklarasikan atau kapabilitas bundle
- memvalidasi `plugins.entries.<id>.config`
- menambah label/placeholder Control UI
- menampilkan metadata instalasi/katalog

Untuk plugin native, modul runtime adalah bagian data-plane. Ia mendaftarkan
perilaku aktual seperti hook, alat, perintah, atau alur penyedia.

### Apa yang di-cache loader

OpenClaw menyimpan cache in-process singkat untuk:

- hasil discovery
- data registry manifest
- registries plugin yang dimuat

Cache ini mengurangi startup yang meledak-ledak dan overhead perintah berulang. Aman
untuk dianggap sebagai cache performa jangka pendek, bukan persistensi.

Catatan performa:

- Atur `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` atau
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` untuk menonaktifkan cache ini.
- Sesuaikan jendela cache dengan `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` dan
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model registry

Plugin yang dimuat tidak langsung memutasi global core sembarang. Mereka mendaftar ke
registry plugin pusat.

Registry melacak:

- catatan plugin (identitas, sumber, asal, status, diagnostik)
- alat
- hook legacy dan typed hook
- channels
- providers
- gateway RPC handlers
- rute HTTP
- CLI registrars
- layanan latar belakang
- perintah milik plugin

Fitur core kemudian membaca dari registry itu alih-alih berbicara ke modul plugin
secara langsung. Ini menjaga pemuatan tetap searah:

- modul plugin -> pendaftaran registry
- runtime core -> konsumsi registry

Pemisahan ini penting untuk maintainability. Ini berarti sebagian besar permukaan core hanya
memerlukan satu titik integrasi: “baca registry”, bukan “buat special-case untuk setiap modul plugin”.

## Callback pengikatan percakapan

Plugin yang mengikat percakapan dapat bereaksi saat sebuah approval diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah sebuah
permintaan bind disetujui atau ditolak:

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
- `binding`: binding yang terselesaikan untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, sender id, dan
  metadata percakapan

Callback ini hanya untuk notifikasi. Ini tidak mengubah siapa yang diizinkan untuk mengikat
percakapan, dan berjalan setelah penanganan approval core selesai.

## Hook runtime penyedia

Plugin penyedia sekarang memiliki dua lapisan:

- metadata manifest: `providerAuthEnvVars` untuk lookup auth env penyedia yang murah
  sebelum runtime dimuat, `channelEnvVars` untuk lookup env/setup channel yang murah
  sebelum runtime dimuat, ditambah `providerAuthChoices` untuk label onboarding/auth-choice yang murah
  serta metadata flag CLI sebelum runtime dimuat
- hook saat konfigurasi: `catalog` / legacy `discovery` plus `applyConfigDefaults`
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

OpenClaw tetap memiliki loop agen generik, failover, penanganan transkrip, dan
kebijakan alat. Hook ini adalah permukaan ekstensi untuk perilaku khusus penyedia tanpa
memerlukan transport inferensi kustom penuh.

Gunakan manifest `providerAuthEnvVars` saat penyedia memiliki kredensial berbasis env
yang harus terlihat oleh jalur auth/status/model-picker generik tanpa memuat runtime plugin.
Gunakan manifest `providerAuthChoices` saat permukaan onboarding/auth-choice CLI
harus mengetahui choice id penyedia, label grup, dan wiring auth satu-flag sederhana
tanpa memuat runtime penyedia. Simpan runtime penyedia `envVars` untuk petunjuk
yang terlihat operator seperti label onboarding atau variabel setup
OAuth client-id/client-secret.

Gunakan manifest `channelEnvVars` saat sebuah channel memiliki auth atau setup berbasis env
yang harus terlihat oleh fallback shell-env generik, pemeriksaan config/status, atau prompt setup
tanpa memuat runtime channel.

### Urutan hook dan penggunaannya

Untuk plugin model/penyedia, OpenClaw memanggil hook dalam urutan kasar ini.
Kolom “When to use” adalah panduan keputusan cepat.

| #   | Hook                              | What it does                                                                                                   | When to use                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publikasikan config penyedia ke `models.providers` selama pembuatan `models.json`                                | Penyedia memiliki katalog atau default base URL                                                                                                |
| 2   | `applyConfigDefaults`             | Terapkan default config global milik penyedia selama materialisasi konfigurasi                                      | Default bergantung pada mode auth, env, atau semantik keluarga model penyedia                                                                       |
| --  | _(pencarian built-in model)_         | OpenClaw mencoba jalur registry/katalog normal terlebih dahulu                                                          | _(bukan hook plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Normalkan alias model-id legacy atau preview sebelum lookup                                                     | Penyedia memiliki pembersihan alias sebelum resolusi model kanonis                                                                               |
| 4   | `normalizeTransport`              | Normalkan `api` / `baseUrl` keluarga penyedia sebelum perakitan model generik                                      | Penyedia memiliki pembersihan transport untuk provider id kustom dalam keluarga transport yang sama                                                        |
| 5   | `normalizeConfig`                 | Normalkan `models.providers.<id>` sebelum resolusi runtime/penyedia                                           | Penyedia memerlukan pembersihan config yang sebaiknya berada bersama plugin; helper keluarga Google bundled juga menjadi backstop untuk entri config Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Terapkan penulisan ulang compat penggunaan streaming native ke penyedia config                                               | Penyedia memerlukan perbaikan metadata penggunaan streaming native yang dipicu endpoint                                                                        |
| 7   | `resolveConfigApiKey`             | Resolve auth env-marker untuk penyedia config sebelum runtime auth dimuat                                       | Penyedia memiliki resolusi API key env-marker milik penyedia; `amazon-bedrock` juga memiliki resolver env-marker AWS bawaan di sini                |
| 8   | `resolveSyntheticAuth`            | Tampilkan auth lokal/self-hosted atau berbasis config tanpa menyimpan plaintext                                   | Penyedia dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                               |
| 9   | `resolveExternalAuthProfiles`     | Overlay profil auth eksternal milik penyedia; default `persistence` adalah `runtime-only` untuk kredensial milik CLI/aplikasi | Penyedia memakai ulang kredensial auth eksternal tanpa menyimpan refresh token yang disalin                                                          |
| 10  | `shouldDeferSyntheticProfileAuth` | Turunkan placeholder profil sintetis yang tersimpan di bawah auth berbasis env/config                                      | Penyedia menyimpan profil placeholder sintetis yang tidak seharusnya menang dalam prioritas                                                               |
| 11  | `resolveDynamicModel`             | Fallback sinkron untuk model id milik penyedia yang belum ada di registry lokal                                       | Penyedia menerima model id upstream arbitrer                                                                                               |
| 12  | `prepareDynamicModel`             | Warm-up async, lalu `resolveDynamicModel` dijalankan lagi                                                           | Penyedia memerlukan metadata jaringan sebelum me-resolve id yang tidak dikenal                                                                                |
| 13  | `normalizeResolvedModel`          | Penulisan ulang akhir sebelum embedded runner menggunakan model yang sudah ter-resolve                                               | Penyedia memerlukan penulisan ulang transport tetapi tetap menggunakan transport core                                                                           |
| 14  | `contributeResolvedModelCompat`   | Kontribusikan flag compat untuk model vendor di balik transport kompatibel lain                                  | Penyedia mengenali modelnya sendiri pada transport proxy tanpa mengambil alih penyedia                                                     |
| 15  | `capabilities`                    | Metadata transkrip/tooling milik penyedia yang digunakan oleh logika core bersama                                           | Penyedia memerlukan keunikan transkrip/keluarga penyedia                                                                                            |
| 16  | `normalizeToolSchemas`            | Normalkan tool schema sebelum embedded runner melihatnya                                                    | Penyedia memerlukan pembersihan schema keluarga transport                                                                                              |
| 17  | `inspectToolSchemas`              | Tampilkan diagnostik schema milik penyedia setelah normalisasi                                                  | Penyedia menginginkan peringatan keyword tanpa mengajarkan aturan khusus penyedia ke core                                                               |
| 18  | `resolveReasoningOutputMode`      | Pilih kontrak output reasoning native vs bertag                                                              | Penyedia memerlukan output reasoning/akhir bertag alih-alih field native                                                                       |
| 19  | `prepareExtraParams`              | Normalisasi parameter request sebelum wrapper opsi stream generik                                              | Penyedia memerlukan parameter request default atau pembersihan param per penyedia                                                                         |
| 20  | `createStreamFn`                  | Gantikan sepenuhnya jalur stream normal dengan transport kustom                                                   | Penyedia memerlukan wire protocol kustom, bukan sekadar wrapper                                                                                   |
| 21  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                                              | Penyedia memerlukan wrapper compat header/body/model request tanpa transport kustom                                                        |
| 22  | `resolveTransportTurnState`       | Lampirkan header atau metadata transport per-turn native                                                           | Penyedia ingin transport generik mengirim identitas turn native penyedia                                                                     |
| 23  | `resolveWebSocketSessionPolicy`   | Lampirkan header WebSocket native atau kebijakan cool-down sesi                                                    | Penyedia ingin transport WS generik menyetel header sesi atau kebijakan fallback                                                             |
| 24  | `formatApiKey`                    | Formatter auth-profile: profil tersimpan menjadi string `apiKey` runtime                                     | Penyedia menyimpan metadata auth tambahan dan memerlukan bentuk token runtime kustom                                                                  |
| 25  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh                                  | Penyedia tidak cocok dengan penyegar `pi-ai` bersama                                                                                         |
| 26  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                                                  | Penyedia memerlukan panduan perbaikan auth milik penyedia setelah kegagalan refresh                                                                    |
| 27  | `matchesContextOverflowError`     | Matcher overflow context-window milik penyedia                                                                 | Penyedia memiliki error overflow mentah yang tidak akan terdeteksi heuristik generik                                                                              |
| 28  | `classifyFailoverReason`          | Klasifikasi alasan failover milik penyedia                                                                  | Penyedia dapat memetakan error API/transport mentah ke rate-limit/overload/dll                                                                        |
| 29  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk penyedia proxy/backhaul                                                               | Penyedia memerlukan gating TTL cache khusus proxy                                                                                              |
| 30  | `buildMissingAuthMessage`         | Pengganti pesan pemulihan missing-auth generik                                                      | Penyedia memerlukan petunjuk pemulihan missing-auth khusus penyedia                                                                               |
| 31  | `suppressBuiltInModel`            | Penekanan model upstream yang stale plus petunjuk error yang menghadap pengguna secara opsional                                          | Penyedia perlu menyembunyikan baris upstream yang stale atau menggantinya dengan petunjuk vendor                                                               |
| 32  | `augmentModelCatalog`             | Baris katalog sintetis/akhir ditambahkan setelah discovery                                                          | Penyedia memerlukan baris forward-compat sintetis di `models list` dan picker                                                                   |
| 33  | `isBinaryThinking`                | Toggle reasoning on/off untuk penyedia binary-thinking                                                          | Penyedia hanya mengekspos binary thinking hidup/mati                                                                                                |
| 34  | `supportsXHighThinking`           | Dukungan reasoning `xhigh` untuk model tertentu                                                                  | Penyedia menginginkan `xhigh` hanya pada subset model tertentu                                                                                           |
| 35  | `resolveDefaultThinkingLevel`     | Level `/think` default untuk keluarga model tertentu                                                             | Penyedia memiliki kebijakan `/think` default untuk keluarga model tertentu                                                                                    |
| 36  | `isModernModelRef`                | Matcher model modern untuk filter profil live dan seleksi smoke                                              | Penyedia memiliki pencocokan model pilihan live/smoke                                                                                           |
| 37  | `prepareRuntimeAuth`              | Tukarkan kredensial yang dikonfigurasi menjadi token/key runtime sebenarnya tepat sebelum inferensi                       | Penyedia memerlukan pertukaran token atau kredensial request berumur pendek                                                                           |
| 38  | `resolveUsageAuth`                | Resolve kredensial penggunaan/billing untuk `/usage` dan permukaan status terkait                                     | Penyedia memerlukan parsing token usage/quota kustom atau kredensial penggunaan yang berbeda                                                             |
| 39  | `fetchUsageSnapshot`              | Ambil dan normalkan snapshot penggunaan/quota khusus penyedia setelah auth ter-resolve                             | Penyedia memerlukan endpoint penggunaan atau parser payload khusus penyedia                                                                         |
| 40  | `createEmbeddingProvider`         | Bangun adapter embedding milik penyedia untuk memori/pencarian                                                     | Perilaku embedding memori seharusnya berada bersama plugin penyedia                                                                                  |
| 41  | `buildReplayPolicy`               | Kembalikan kebijakan replay yang mengontrol penanganan transkrip untuk penyedia                                        | Penyedia memerlukan kebijakan transkrip kustom (misalnya, pembuangan blok thinking)                                                             |
| 42  | `sanitizeReplayHistory`           | Tulis ulang riwayat replay setelah pembersihan transkrip generik                                                        | Penyedia memerlukan penulisan ulang replay khusus penyedia di luar helper compaction bersama                                                           |
| 43  | `validateReplayTurns`             | Validasi atau pembentukan ulang replay-turn akhir sebelum embedded runner                                           | Transport penyedia memerlukan validasi turn yang lebih ketat setelah sanitasi generik                                                                  |
| 44  | `onModelSelected`                 | Jalankan efek samping pasca-seleksi milik penyedia                                                                 | Penyedia memerlukan telemetry atau status milik penyedia saat sebuah model menjadi aktif                                                                |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` terlebih dahulu memeriksa
plugin penyedia yang cocok, lalu meneruskan ke plugin penyedia lain yang mampu menangani hook
sampai salah satunya benar-benar mengubah model id atau transport/config. Ini menjaga
shim alias/compat penyedia tetap berfungsi tanpa mengharuskan pemanggil mengetahui plugin
bundled mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook penyedia yang menulis ulang
entri config keluarga Google yang didukung, normalizer config Google bundled tetap menerapkan
pembersihan kompatibilitas tersebut.

Jika penyedia memerlukan wire protocol yang sepenuhnya kustom atau eksekutor request kustom,
itu adalah kelas ekstensi yang berbeda. Hook ini ditujukan untuk perilaku penyedia
yang tetap berjalan pada loop inferensi normal OpenClaw.

### Contoh penyedia

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
  dan `wrapStreamFn` karena ia memiliki forward-compat Claude 4.6,
  petunjuk keluarga penyedia, panduan perbaikan auth, integrasi endpoint penggunaan,
  kelayakan prompt-cache, default config yang sadar-auth, kebijakan thinking
  default/adaptif Claude, dan pembentukan stream khusus Anthropic untuk
  beta header, `/fast` / `serviceTier`, dan `context1m`.
- Helper stream khusus Claude milik Anthropic untuk saat ini tetap berada di
  seam `api.ts` / `contract-api.ts` publik milik plugin bundled itu sendiri. Permukaan
  paket itu mengekspor `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan builder wrapper
  Anthropic tingkat lebih rendah alih-alih memperlebar SDK generik di sekitar
  aturan beta-header satu penyedia.
- OpenAI menggunakan `resolveDynamicModel`, `normalizeResolvedModel`, dan
  `capabilities` plus `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, dan `isModernModelRef`
  karena ia memiliki forward-compat GPT-5.4, normalisasi langsung OpenAI
  `openai-completions` -> `openai-responses`, petunjuk auth yang sadar Codex,
  penekanan Spark, baris list OpenAI sintetis, dan kebijakan thinking /
  live-model GPT-5; keluarga stream `openai-responses-defaults` memiliki
  wrapper OpenAI Responses native bersama untuk attribution headers,
  `/fast`/`serviceTier`, text verbosity, pencarian web Codex native,
  pembentukan payload reasoning-compat, dan manajemen konteks Responses.
- OpenRouter menggunakan `catalog` plus `resolveDynamicModel` dan
  `prepareDynamicModel` karena penyedianya adalah pass-through dan dapat mengekspos
  model id baru sebelum katalog statis OpenClaw diperbarui; ia juga menggunakan
  `capabilities`, `wrapStreamFn`, dan `isCacheTtlEligible` untuk menjaga
  header request, metadata routing, patch reasoning, dan kebijakan prompt-cache khusus penyedia tetap keluar dari core. Kebijakan replay-nya berasal dari keluarga
  `passthrough-gemini`, sementara keluarga stream `openrouter-thinking`
  memiliki injeksi reasoning proxy dan skip untuk model yang tidak didukung / `auto`.
- GitHub Copilot menggunakan `catalog`, `auth`, `resolveDynamicModel`, dan
  `capabilities` plus `prepareRuntimeAuth` dan `fetchUsageSnapshot` karena ia
  membutuhkan login perangkat milik penyedia, perilaku fallback model, keunikan
  transkrip Claude, pertukaran token GitHub -> token Copilot, dan endpoint penggunaan milik penyedia.
- OpenAI Codex menggunakan `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, dan `augmentModelCatalog` plus
  `prepareExtraParams`, `resolveUsageAuth`, dan `fetchUsageSnapshot` karena ia
  masih berjalan pada transport OpenAI core tetapi memiliki normalisasi
  transport/base URL, kebijakan fallback refresh OAuth, pilihan transport default,
  baris katalog Codex sintetis, dan integrasi endpoint penggunaan ChatGPT; ia
  berbagi keluarga stream `openai-responses-defaults` yang sama dengan OpenAI langsung.
- Google AI Studio dan OAuth Gemini CLI menggunakan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, dan `isModernModelRef` karena keluarga replay
  `google-gemini` memiliki fallback forward-compat Gemini 3.1,
  validasi replay Gemini native, sanitasi replay bootstrap,
  mode output reasoning bertag, dan pencocokan model modern, sementara
  keluarga stream `google-thinking` memiliki normalisasi payload thinking Gemini;
  OAuth Gemini CLI juga menggunakan `formatApiKey`, `resolveUsageAuth`, dan
  `fetchUsageSnapshot` untuk format token, parsing token, dan wiring endpoint kuota.
- Anthropic Vertex menggunakan `buildReplayPolicy` melalui keluarga replay
  `anthropic-by-model` sehingga pembersihan replay khusus Claude tetap
  dibatasi ke id Claude alih-alih setiap transport `anthropic-messages`.
- Amazon Bedrock menggunakan `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, dan `resolveDefaultThinkingLevel` karena ia memiliki
  klasifikasi error throttle/not-ready/context-overflow khusus Bedrock
  untuk traffic Anthropic-on-Bedrock; kebijakan replay-nya masih berbagi guard
  khusus Claude `anthropic-by-model` yang sama.
- OpenRouter, Kilocode, Opencode, dan Opencode Go menggunakan `buildReplayPolicy`
  melalui keluarga replay `passthrough-gemini` karena mereka memproksikan model
  Gemini melalui transport yang kompatibel dengan OpenAI dan memerlukan
  sanitasi thought-signature Gemini tanpa validasi replay Gemini native atau
  penulisan ulang bootstrap.
- MiniMax menggunakan `buildReplayPolicy` melalui keluarga replay
  `hybrid-anthropic-openai` karena satu penyedia memiliki semantik
  anthrophic-message dan OpenAI-compatible sekaligus; ia menjaga pembuangan
  thinking-block khusus Claude pada sisi Anthropic sambil meng-override mode
  output reasoning kembali ke native, dan keluarga stream `minimax-fast-mode` memiliki
  penulisan ulang model fast-mode pada jalur stream bersama.
- Moonshot menggunakan `catalog` plus `wrapStreamFn` karena ia masih menggunakan
  transport OpenAI bersama tetapi memerlukan normalisasi payload thinking milik penyedia; keluarga stream `moonshot-thinking` memetakan config plus status `/think` ke payload binary thinking native miliknya.
- Kilocode menggunakan `catalog`, `capabilities`, `wrapStreamFn`, dan
  `isCacheTtlEligible` karena ia memerlukan header request milik penyedia,
  normalisasi payload reasoning, petunjuk transkrip Gemini, dan gating
  cache-TTL Anthropic; keluarga stream `kilocode-thinking` menjaga injeksi
  Kilo thinking tetap pada jalur stream proxy bersama sambil melewati `kilo/auto` dan
  model id proxy lain yang tidak mendukung payload reasoning eksplisit.
- Z.AI menggunakan `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, dan `fetchUsageSnapshot` karena ia memiliki fallback GLM-5,
  default `tool_stream`, UX binary thinking, pencocokan model modern, serta
  auth penggunaan + pengambilan kuota; keluarga stream `tool-stream-default-on` menjaga
  wrapper `tool_stream` default-on tetap keluar dari glue tulisan tangan per penyedia.
- xAI menggunakan `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, dan `isModernModelRef`
  karena ia memiliki normalisasi transport xAI Responses native, penulisan ulang alias
  Grok fast-mode, default `tool_stream`, pembersihan strict-tool / reasoning-payload,
  penggunaan ulang auth fallback untuk alat milik plugin, resolusi model Grok forward-compat,
  dan patch compat milik penyedia seperti profil tool-schema xAI,
  keyword schema yang tidak didukung, `web_search` native, dan decoding argumen
  tool-call entitas HTML.
- Mistral, OpenCode Zen, dan OpenCode Go hanya menggunakan `capabilities` untuk
  menjaga keunikan transkrip/tooling tetap keluar dari core.
- Penyedia bundled hanya-katalog seperti `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan `volcengine` menggunakan
  `catalog` saja.
- Qwen menggunakan `catalog` untuk text provider-nya plus pendaftaran bersama
  media-understanding dan video-generation untuk permukaan multimodalnya.
- MiniMax dan Xiaomi menggunakan `catalog` plus hook penggunaan karena perilaku `/usage`
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

- `textToSpeech` mengembalikan payload output TTS core normal untuk permukaan file/voice-note.
- Menggunakan konfigurasi core `messages.tts` dan pemilihan penyedia.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk penyedia.
- `listVoices` bersifat opsional per penyedia. Gunakan ini untuk voice picker atau alur setup milik vendor.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag personality untuk picker yang sadar penyedia.
- OpenAI dan ElevenLabs saat ini mendukung telephony. Microsoft tidak.

Plugin juga dapat mendaftarkan speech provider melalui `api.registerSpeechProvider(...)`.

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

- Simpan kebijakan TTS, fallback, dan pengiriman balasan di core.
- Gunakan speech provider untuk perilaku synthesis milik vendor.
- Input legacy Microsoft `edge` dinormalisasi ke provider id `microsoft`.
- Model kepemilikan yang diutamakan berorientasi perusahaan: satu plugin vendor dapat memiliki
  text, speech, image, dan penyedia media masa depan saat OpenClaw menambahkan kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, plugin mendaftarkan satu provider
media-understanding bertipe alih-alih kumpulan key/value generik:

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

- Simpan orkestrasi, fallback, config, dan wiring channel di core.
- Simpan perilaku vendor di plugin penyedia.
- Ekspansi aditif harus tetap bertipe: metode opsional baru, field hasil opsional baru, kapabilitas opsional baru.
- Pembuatan video sudah mengikuti pola yang sama:
  - core memiliki kontrak kapabilitas dan helper runtime
  - plugin vendor mendaftarkan `api.registerVideoGenerationProvider(...)`
  - plugin fitur/channel mengonsumsi `api.runtime.videoGeneration.*`

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
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah permukaan bersama yang diutamakan untuk
  pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio media-understanding core (`tools.media.audio`) dan urutan fallback penyedia.
- Mengembalikan `{ text: undefined }` ketika tidak ada output transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
- `api.runtime.stt.transcribeAudioFile(...)` tetap tersedia sebagai alias kompatibilitas.

Plugin juga dapat meluncurkan eksekusi subagent latar belakang melalui `api.runtime.subagent`:

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

- `provider` dan `model` adalah override per-eksekusi opsional, bukan perubahan sesi persisten.
- OpenClaw hanya menghormati field override tersebut untuk pemanggil tepercaya.
- Untuk eksekusi fallback milik plugin, operator harus ikut serta dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi plugin tepercaya ke target `provider/model` kanonis tertentu, atau `"*"` untuk mengizinkan target apa pun secara eksplisit.
- Eksekusi subagent plugin yang tidak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam fallback.

Untuk pencarian web, plugin dapat mengonsumsi helper runtime bersama alih-alih
menjangkau wiring alat agen:

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

Plugin juga dapat mendaftarkan web-search providers melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Simpan pemilihan penyedia, resolusi kredensial, dan semantik request bersama di core.
- Gunakan web-search providers untuk transport pencarian khusus vendor.
- `api.runtime.webSearch.*` adalah permukaan bersama yang diutamakan untuk plugin fitur/channel yang memerlukan perilaku pencarian tanpa bergantung pada wrapper alat agen.

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

- `generate(...)`: hasilkan gambar menggunakan rantai penyedia image-generation yang dikonfigurasi.
- `listProviders(...)`: daftar penyedia image-generation yang tersedia dan kapabilitasnya.

## Rute HTTP Gateway

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

Field rute:

- `path`: path rute di bawah server HTTP gateway.
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth gateway normal, atau `"plugin"` untuk auth/verifikasi webhook yang dikelola plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Memungkinkan plugin yang sama mengganti pendaftaran rute miliknya sendiri yang sudah ada.
- `handler`: kembalikan `true` saat rute menangani request.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan error pemuatan plugin. Gunakan `api.registerHttpRoute(...)`.
- Rute plugin harus mendeklarasikan `auth` secara eksplisit.
- Konflik `path + match` exact ditolak kecuali `replaceExisting: true`, dan satu plugin tidak dapat mengganti rute milik plugin lain.
- Rute yang tumpang tindih dengan level `auth` berbeda ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Rute `auth: "plugin"` **tidak** otomatis menerima runtime scope operator. Rute ini ditujukan untuk webhook/verifikasi signature yang dikelola plugin, bukan panggilan helper Gateway yang istimewa.
- Rute `auth: "gateway"` berjalan di dalam runtime scope request Gateway, tetapi scope itu sengaja konservatif:
  - bearer auth shared-secret (`gateway.auth.mode = "token"` / `"password"`) menjaga runtime scope rute plugin tetap terkunci pada `operator.write`, meskipun pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya yang membawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) hanya menghormati `x-openclaw-scopes` bila header itu hadir secara eksplisit
  - jika `x-openclaw-scopes` tidak ada pada request rute plugin yang membawa identitas tersebut, runtime scope akan fallback ke `operator.write`
- Aturan praktis: jangan mengasumsikan rute plugin dengan gateway-auth adalah permukaan admin implisit. Jika rute Anda memerlukan perilaku khusus admin, wajibkan mode auth yang membawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Path import Plugin SDK

Gunakan subpath SDK alih-alih import monolitik `openclaw/plugin-sdk` saat
menulis plugin:

- `openclaw/plugin-sdk/plugin-entry` untuk primitif pendaftaran plugin.
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
  `openclaw/plugin-sdk/webhook-ingress` untuk wiring
  setup/auth/reply/webhook bersama. `channel-inbound` adalah rumah bersama
  untuk debounce, mention matching, helper kebijakan mention masuk, formatting envelope, dan helper konteks envelope masuk.
  `channel-setup` adalah seam setup optional-install yang sempit.
  `setup-runtime` adalah permukaan setup yang aman untuk runtime yang digunakan oleh `setupEntry` /
  startup tertunda, termasuk adapter patch setup yang aman untuk import.
  `setup-adapter-runtime` adalah seam adapter setup akun yang sadar-env.
  `setup-tools` adalah seam helper CLI/archive/docs kecil (`formatCliCommand`,
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
  `telegram-command-config` adalah seam publik sempit untuk normalisasi/validasi perintah kustom Telegram dan tetap tersedia bahkan jika permukaan kontrak Telegram bundled sementara tidak tersedia.
  `text-runtime` adalah seam bersama text/markdown/logging, termasuk
  penghilangan teks yang terlihat oleh assistant, helper render/chunking markdown, helper redaction, helper directive-tag, dan utilitas safe-text.
- Seam channel khusus approval sebaiknya mengutamakan satu kontrak `approvalCapability` pada plugin. Core kemudian membaca auth approval, pengiriman, render, native-routing, dan perilaku lazy native-handler melalui satu kapabilitas itu alih-alih mencampur perilaku approval ke field plugin yang tidak terkait.
- `openclaw/plugin-sdk/channel-runtime` sudah deprecated dan tetap ada hanya sebagai shim kompatibilitas untuk plugin yang lebih lama. Kode baru sebaiknya mengimpor primitif generik yang lebih sempit, dan kode repo tidak boleh menambahkan import baru dari shim ini.
- Internal ekstensi bundled tetap privat. Plugin eksternal sebaiknya hanya menggunakan subpath `openclaw/plugin-sdk/*`. Kode core/test OpenClaw dapat menggunakan entry point publik repo di bawah root paket plugin seperti `index.js`, `api.js`, `runtime-api.js`, `setup-entry.js`, dan file bercakupan sempit seperti `login-qr-api.js`. Jangan pernah mengimpor `src/*` milik paket plugin dari core atau dari ekstensi lain.
- Pemisahan entry point repo:
  `<plugin-package-root>/api.js` adalah barrel helper/types,
  `<plugin-package-root>/runtime-api.js` adalah barrel khusus runtime,
  `<plugin-package-root>/index.js` adalah entry plugin bundled,
  dan `<plugin-package-root>/setup-entry.js` adalah entry plugin setup.
- Contoh penyedia bundled saat ini:
  - Anthropic menggunakan `api.js` / `contract-api.js` untuk helper stream Claude seperti
    `wrapAnthropicProviderStream`, helper beta-header, dan parsing `service_tier`.
  - OpenAI menggunakan `api.js` untuk builder penyedia, helper model default, dan
    builder penyedia realtime.
  - OpenRouter menggunakan `api.js` untuk builder penyedianya plus helper onboarding/config, sementara `register.runtime.js` masih dapat mengekspor ulang helper generik `plugin-sdk/provider-stream` untuk penggunaan lokal repo.
- Entry point publik yang dimuat facade mengutamakan snapshot config runtime aktif
  jika ada, lalu fallback ke file config ter-resolve di disk saat
  OpenClaw belum melayani snapshot runtime.
- Primitif bersama generik tetap menjadi kontrak SDK publik yang diutamakan. Satu set kompatibilitas kecil yang dicadangkan dari seam helper berlabel channel bundled masih ada. Perlakukan itu sebagai seam pemeliharaan bundled/kompatibilitas, bukan target import pihak ketiga yang baru; kontrak lintas-channel baru tetap harus ditempatkan pada subpath `plugin-sdk/*` generik atau barrel `api.js` / `runtime-api.js` lokal plugin.

Catatan kompatibilitas:

- Hindari barrel root `openclaw/plugin-sdk` untuk kode baru.
- Utamakan primitif stabil yang sempit terlebih dahulu. Subpath setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool yang lebih baru adalah kontrak yang dituju untuk pekerjaan plugin bundled dan eksternal yang baru.
  Parsing/matching target seharusnya berada di `openclaw/plugin-sdk/channel-targets`.
  Gate aksi message dan helper message-id reaction seharusnya berada di
  `openclaw/plugin-sdk/channel-actions`.
- Barrel helper khusus ekstensi bundled tidak stabil secara default. Jika sebuah
  helper hanya diperlukan oleh ekstensi bundled, simpan di balik seam
  `api.js` atau `runtime-api.js` lokal ekstensi itu alih-alih mempromosikannya ke
  `openclaw/plugin-sdk/<extension>`.
- Seam helper bersama yang baru harus generik, bukan berlabel channel. Parsing target bersama berada di `openclaw/plugin-sdk/channel-targets`; internal khusus channel tetap berada di balik seam `api.js` atau `runtime-api.js` lokal milik plugin yang bersangkutan.
- Subpath spesifik kapabilitas seperti `image-generation`,
  `media-understanding`, dan `speech` ada karena plugin bundled/native
  menggunakannya saat ini. Keberadaannya sendiri tidak otomatis berarti setiap helper yang diekspor adalah kontrak eksternal jangka panjang yang dibekukan.

## Schema alat message

Plugin sebaiknya memiliki kontribusi schema `describeMessageTool(...)` khusus channel.
Simpan field khusus penyedia di plugin, bukan di core bersama.

Untuk fragmen schema portabel bersama, gunakan ulang helper generik yang diekspor melalui
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` untuk payload gaya grid tombol
- `createMessageToolCardSchema()` untuk payload kartu terstruktur

Jika sebuah bentuk schema hanya masuk akal untuk satu penyedia, definisikan di source
plugin itu sendiri alih-alih mempromosikannya ke SDK bersama.

## Resolusi target channel

Plugin channel sebaiknya memiliki semantik target khusus channel. Simpan host
outbound bersama tetap generik dan gunakan permukaan messaging adapter untuk aturan penyedia:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target yang dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah sebuah
  input harus langsung melewati ke resolusi mirip-id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback plugin saat
  core memerlukan resolusi akhir milik penyedia setelah normalisasi atau setelah
  direktori gagal menemukan hasil.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi rute sesi
  khusus penyedia setelah target di-resolve.

Pemisahan yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang seharusnya terjadi sebelum
  mencari peer/grup.
- Gunakan `looksLikeId` untuk pemeriksaan “perlakukan ini sebagai id target eksplisit/native”.
- Gunakan `resolveTarget` untuk fallback normalisasi khusus penyedia, bukan untuk
  pencarian direktori yang luas.
- Simpan id native penyedia seperti chat id, thread id, JID, handle, dan room
  id di dalam nilai `target` atau parameter khusus penyedia, bukan di field SDK generik.

## Direktori berbasis konfigurasi

Plugin yang menurunkan entri direktori dari konfigurasi sebaiknya menyimpan logika itu di
plugin dan menggunakan ulang helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini saat sebuah channel memerlukan peer/grup berbasis konfigurasi seperti:

- peer DM yang digerakkan allowlist
- peta channel/grup yang dikonfigurasi
- fallback direktori statis yang dibatasi per akun

Helper bersama di `directory-runtime` hanya menangani operasi generik:

- pemfilteran query
- penerapan batas
- helper dedupe/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun khusus channel dan normalisasi id sebaiknya tetap berada di implementasi plugin.

## Katalog penyedia

Plugin penyedia dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama seperti yang ditulis OpenClaw ke dalam
`models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` saat plugin memiliki model id, default base URL, atau metadata model
yang digating oleh auth.

`catalog.order` mengontrol kapan katalog plugin digabung relatif terhadap
penyedia implisit bawaan OpenClaw:

- `simple`: penyedia API-key biasa atau yang digerakkan env
- `profile`: penyedia yang muncul saat profil auth ada
- `paired`: penyedia yang mensintesis beberapa entri provider terkait
- `late`: lintasan terakhir, setelah penyedia implisit lain

Penyedia yang lebih akhir menang pada tabrakan key, sehingga plugin dapat dengan sengaja
meng-override entri provider bawaan dengan provider id yang sama.

Kompatibilitas:

- `discovery` masih berfungsi sebagai alias legacy
- jika `catalog` dan `discovery` keduanya didaftarkan, OpenClaw menggunakan `catalog`

## Inspeksi channel read-only

Jika plugin Anda mendaftarkan sebuah channel, utamakan implementasi
`plugin.config.inspectAccount(cfg, accountId)` bersama `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah jalur runtime. Ia boleh mengasumsikan kredensial
  telah dimaterialisasi sepenuhnya dan dapat gagal cepat saat secret yang diperlukan tidak ada.
- Jalur perintah read-only seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur doctor/config
  repair tidak seharusnya perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Kembalikan hanya status akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial jika relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan ketersediaan read-only. Mengembalikan `tokenStatus: "available"` (dan field sumber yang cocok) sudah cukup untuk perintah bergaya status.
- Gunakan `configured_unavailable` saat kredensial dikonfigurasi melalui SecretRef tetapi tidak tersedia pada jalur perintah saat ini.

Ini memungkinkan perintah read-only melaporkan “dikonfigurasi tetapi tidak tersedia pada jalur perintah ini” alih-alih crash atau salah melaporkan akun sebagai tidak dikonfigurasi.

## Package pack

Direktori plugin dapat menyertakan `package.json` dengan `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Setiap entry menjadi plugin. Jika pack mencantumkan beberapa ekstensi, plugin id
menjadi `name/<fileBase>`.

Jika plugin Anda mengimpor dependency npm, instal dependency tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Guardrail keamanan: setiap entri `openclaw.extensions` harus tetap berada di dalam direktori plugin
setelah resolusi symlink. Entri yang keluar dari direktori paket akan
ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependency plugin dengan
`npm install --omit=dev --ignore-scripts` (tanpa lifecycle scripts, tanpa dev dependencies saat runtime). Pertahankan pohon dependency plugin tetap “pure JS/TS” dan hindari paket yang memerlukan build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul ringan khusus setup.
Saat OpenClaw memerlukan permukaan setup untuk plugin channel yang dinonaktifkan, atau
saat plugin channel diaktifkan tetapi belum dikonfigurasi, ia memuat `setupEntry`
alih-alih entry plugin penuh. Ini menjaga startup dan setup lebih ringan
saat entry plugin utama Anda juga memasang alat, hook, atau kode khusus runtime lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat memasukkan plugin channel ke jalur `setupEntry` yang sama selama fase
startup pra-listen gateway, bahkan ketika channel sudah dikonfigurasi.

Gunakan ini hanya saat `setupEntry` sepenuhnya mencakup permukaan startup yang harus ada
sebelum gateway mulai mendengarkan. Dalam praktiknya, itu berarti entry setup
harus mendaftarkan setiap kapabilitas milik channel yang dibutuhkan startup, seperti:

- pendaftaran channel itu sendiri
- setiap rute HTTP yang harus tersedia sebelum gateway mulai mendengarkan
- setiap metode gateway, alat, atau layanan yang harus ada selama jendela yang sama

Jika full entry Anda masih memiliki kapabilitas startup yang dibutuhkan, jangan aktifkan
flag ini. Pertahankan plugin pada perilaku default dan biarkan OpenClaw memuat
full entry saat startup.

Channel bundled juga dapat menerbitkan helper permukaan kontrak khusus setup yang
dapat dikonsultasikan core sebelum runtime channel penuh dimuat. Permukaan promotion setup saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan permukaan itu saat perlu mempromosikan konfigurasi channel legacy single-account
ke `channels.<id>.accounts.*` tanpa memuat full entry plugin.
Matrix adalah contoh bundled saat ini: ia hanya memindahkan key auth/bootstrap ke
akun yang dipromosikan bernama saat named accounts sudah ada, dan ia dapat mempertahankan
key default-account non-kanonis yang sudah dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adapter patch setup itu menjaga discovery permukaan kontrak bundled tetap lazy. Waktu
import tetap ringan; permukaan promotion dimuat hanya pada penggunaan pertama alih-alih
masuk kembali ke startup channel bundled saat import modul.

Saat permukaan startup itu mencakup metode gateway RPC, simpan pada
prefix khusus plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve
ke `operator.admin`, bahkan jika plugin meminta scope yang lebih sempit.

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
petunjuk instalasi melalui `openclaw.install`. Ini menjaga data katalog core tetap kosong dari data tetap.

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
      "blurb": "Chat self-hosted melalui webhook bot Nextcloud Talk.",
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

- `detailLabel`: label sekunder untuk permukaan katalog/status yang lebih kaya
- `docsLabel`: ganti teks tautan untuk tautan dokumentasi
- `preferOver`: plugin/channel id prioritas lebih rendah yang seharusnya dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan untuk permukaan seleksi
- `markdownCapable`: menandai channel sebagai mampu markdown untuk keputusan formatting outbound
- `exposure.configured`: sembunyikan channel dari permukaan daftar channel yang dikonfigurasi saat diatur ke `false`
- `exposure.setup`: sembunyikan channel dari picker setup/configure interaktif saat diatur ke `false`
- `exposure.docs`: tandai channel sebagai internal/private untuk permukaan navigasi docs
- `showConfigured` / `showInSetup`: alias legacy masih diterima demi kompatibilitas; utamakan `exposure`
- `quickstartAllowFrom`: ikutkan channel ke alur quickstart `allowFrom` standar
- `forceAccountBinding`: wajibkan account binding eksplisit bahkan saat hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: utamakan lookup sesi saat me-resolve target announce

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya, ekspor registry MPM).
Letakkan file JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau lebih file JSON (dipisahkan dengan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias legacy untuk key `"entries"`.

## Plugin engine konteks

Plugin engine konteks memiliki orkestrasi konteks sesi untuk ingest, assembly,
dan compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih engine aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini saat plugin Anda perlu mengganti atau memperluas pipeline konteks default
alih-alih hanya menambahkan pencarian memori atau hook.

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

Saat sebuah plugin memerlukan perilaku yang tidak cocok dengan API saat ini, jangan melewati
sistem plugin dengan reach-in privat. Tambahkan kapabilitas yang hilang.

Urutan yang direkomendasikan:

1. definisikan kontrak core
   Putuskan perilaku bersama apa yang harus dimiliki core: kebijakan, fallback, penggabungan config,
   lifecycle, semantik yang menghadap channel, dan bentuk helper runtime.
2. tambahkan permukaan pendaftaran/runtime plugin yang bertipe
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan permukaan kapabilitas bertipe
   yang paling kecil namun berguna.
3. hubungkan konsumen core + channel/fitur
   Channel dan plugin fitur seharusnya mengonsumsi kapabilitas baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas tersebut.
5. tambahkan cakupan kontrak
   Tambahkan test agar bentuk kepemilikan dan pendaftaran tetap eksplisit dari waktu ke waktu.

Inilah cara OpenClaw tetap opinionated tanpa menjadi hardcoded pada
sudut pandang satu penyedia. Lihat [Capability Cookbook](/id/plugins/architecture)
untuk daftar periksa file yang konkret dan contoh kerja.

### Daftar periksa kapabilitas

Saat Anda menambahkan kapabilitas baru, implementasinya biasanya harus menyentuh
permukaan ini secara bersamaan:

- jenis kontrak core di `src/<capability>/types.ts`
- runner/helper runtime core di `src/<capability>/runtime.ts`
- permukaan pendaftaran API plugin di `src/plugins/types.ts`
- wiring registry plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` saat plugin fitur/channel
  perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- assertion kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- docs operator/plugin di `docs/`

Jika salah satu permukaan itu hilang, biasanya itu merupakan tanda bahwa kapabilitasnya
belum sepenuhnya terintegrasi.

### Templat kapabilitas

Pola minimal:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Pola test kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Ini menjaga aturannya tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/channel mengonsumsi helper runtime
- test kontrak menjaga kepemilikan tetap eksplisit
