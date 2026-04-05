---
read_when:
    - Membangun atau men-debug plugin native OpenClaw
    - Memahami model kapabilitas plugin atau batas kepemilikan
    - Mengerjakan pipeline pemuatan plugin atau registry
    - Mengimplementasikan hook runtime provider atau plugin channel
sidebarTitle: Internals
summary: 'Internal plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-04-05T14:08:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bc9d7261c3c7878d37140be77f210dd262d6c3edee2491ea534aa599e2800c0
    source_path: plugins/architecture.md
    workflow: 15
---

# Internal Plugin

<Info>
  Ini adalah **referensi arsitektur mendalam**. Untuk panduan praktis, lihat:
  - [Instal dan gunakan plugin](/tools/plugin) — panduan pengguna
  - [Memulai](/id/plugins/building-plugins) — tutorial plugin pertama
  - [Plugin Channel](/id/plugins/sdk-channel-plugins) — bangun channel perpesanan
  - [Plugin Provider](/id/plugins/sdk-provider-plugins) — bangun provider model
  - [Ikhtisar SDK](/id/plugins/sdk-overview) — peta impor dan API registrasi
</Info>

Halaman ini membahas arsitektur internal sistem plugin OpenClaw.

## Model kapabilitas publik

Kapabilitas adalah model **plugin native** publik di dalam OpenClaw. Setiap
plugin native OpenClaw mendaftar terhadap satu atau lebih tipe kapabilitas:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferensi teks         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Ucapan                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkripsi realtime   | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Suara realtime         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pengambilan web        | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pencarian web          | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / perpesanan   | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, tool, atau
layanan adalah plugin **legacy hook-only**. Pola itu masih sepenuhnya didukung.

### Sikap kompatibilitas eksternal

Model kapabilitas sudah ada di core dan digunakan oleh plugin bundled/native
hari ini, tetapi kompatibilitas plugin eksternal masih membutuhkan standar yang
lebih ketat daripada "ini diekspor, jadi ini dibekukan."

Panduan saat ini:

- **plugin eksternal yang sudah ada:** pertahankan integrasi berbasis hook agar
  tetap berfungsi; anggap ini sebagai baseline kompatibilitas
- **plugin bundled/native baru:** lebih pilih registrasi kapabilitas eksplisit
  daripada reach-in spesifik vendor atau desain hook-only baru
- **plugin eksternal yang mengadopsi registrasi kapabilitas:** diizinkan, tetapi
  perlakukan surface helper spesifik kapabilitas sebagai sesuatu yang masih
  berkembang kecuali dokumen secara eksplisit menandai suatu kontrak sebagai stabil

Aturan praktis:

- API registrasi kapabilitas adalah arah yang dituju
- hook legacy tetap menjadi jalur paling aman tanpa kerusakan bagi plugin eksternal selama transisi
- subpath helper yang diekspor tidak semuanya setara; pilih kontrak terdokumentasi yang sempit, bukan ekspor helper insidental

### Bentuk plugin

OpenClaw mengklasifikasikan setiap plugin yang dimuat ke dalam sebuah bentuk
berdasarkan perilaku registrasi aktualnya (bukan hanya metadata statis):

- **plain-capability** -- mendaftarkan tepat satu tipe kapabilitas (misalnya
  plugin provider saja seperti `mistral`)
- **hybrid-capability** -- mendaftarkan beberapa tipe kapabilitas (misalnya
  `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan
  gambar)
- **hook-only** -- hanya mendaftarkan hook (typed atau custom), tanpa
  kapabilitas, tool, command, atau layanan
- **non-capability** -- mendaftarkan tool, command, layanan, atau route tetapi
  tidak memiliki kapabilitas

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin dan rincian
kapabilitasnya. Lihat [referensi CLI](/cli/plugins#inspect) untuk detail.

### Hook legacy

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk
plugin hook-only. Plugin legacy di dunia nyata masih bergantung padanya.

Arah:

- tetap pertahankan agar berfungsi
- dokumentasikan sebagai legacy
- pilih `before_model_resolve` untuk pekerjaan override model/provider
- pilih `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`,
Anda mungkin melihat salah satu label berikut:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfigurasi diparse dengan baik dan plugin ter-resolve       |
| **compatibility advisory** | Plugin menggunakan pola lama-yang-masih-didukung (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated |
| **hard error**             | Konfigurasi tidak valid atau plugin gagal dimuat             |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak plugin Anda saat ini --
`hook-only` bersifat advisory, dan `before_agent_start` hanya memicu peringatan. Sinyal-sinyal ini juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Ikhtisar arsitektur

Sistem plugin OpenClaw memiliki empat lapisan:

1. **Manifest + discovery**
   OpenClaw menemukan kandidat plugin dari path yang dikonfigurasi, root workspace,
   root extension global, dan extension bundled. Discovery membaca manifest native
   `openclaw.plugin.json` serta manifest bundle yang didukung terlebih dahulu.
2. **Enablement + validasi**
   Core memutuskan apakah plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau
   dipilih untuk slot eksklusif seperti memory.
3. **Pemuatan runtime**
   Plugin native OpenClaw dimuat in-process melalui jiti dan mendaftarkan
   kapabilitas ke registry pusat. Bundle yang kompatibel dinormalisasi menjadi
   record registry tanpa mengimpor kode runtime.
4. **Konsumsi surface**
   Bagian lain dari OpenClaw membaca registry untuk mengekspos tool, channel, setup provider,
   hook, route HTTP, command CLI, dan layanan.

Khusus untuk CLI plugin, discovery command root dibagi menjadi dua fase:

- metadata waktu parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI plugin yang sebenarnya bisa tetap lazy dan mendaftar pada pemanggilan pertama

Itu membuat kode CLI milik plugin tetap berada di dalam plugin sambil tetap
membiarkan OpenClaw mencadangkan nama command root sebelum parsing.

Batas desain yang penting:

- discovery + validasi config harus bekerja dari **metadata manifest/schema**
  tanpa mengeksekusi kode plugin
- perilaku runtime native berasal dari path `register(api)` modul plugin

Pemisahan itu memungkinkan OpenClaw memvalidasi config, menjelaskan plugin yang
hilang/dinonaktifkan, dan membangun petunjuk UI/schema sebelum runtime penuh aktif.

### Plugin channel dan tool pesan bersama

Plugin channel tidak perlu mendaftarkan tool kirim/edit/reaksi terpisah untuk
aksi chat normal. OpenClaw mempertahankan satu tool `message` bersama di core,
dan plugin channel memiliki discovery serta eksekusi spesifik channel di baliknya.

Batas saat ini adalah:

- core memiliki host tool `message` bersama, wiring prompt, pencatatan sesi/thread,
  dan dispatch eksekusi
- plugin channel memiliki scoped action discovery, capability discovery, serta fragmen schema spesifik channel
- plugin channel memiliki tata bahasa percakapan sesi spesifik provider, seperti
  bagaimana id percakapan mengenkode id thread atau mewarisi dari percakapan induk
- plugin channel mengeksekusi aksi akhir melalui adapter action mereka

Untuk plugin channel, surface SDK-nya adalah
`ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan discovery yang
terpadu itu memungkinkan plugin mengembalikan aksi yang terlihat, kapabilitas,
dan kontribusi schema secara bersamaan agar bagian-bagian itu tidak saling drift.

Core meneruskan scope runtime ke langkah discovery tersebut. Field penting meliputi:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound tepercaya

Ini penting untuk plugin yang sensitif terhadap konteks. Sebuah channel dapat
menyembunyikan atau mengekspos aksi pesan berdasarkan akun aktif, room/thread/pesan saat ini, atau
identitas requester tepercaya tanpa meng-hardcode branch spesifik channel di
tool `message` core.

Inilah alasan perubahan routing embedded-runner masih merupakan pekerjaan plugin:
runner bertanggung jawab meneruskan identitas chat/sesi saat ini ke batas
discovery plugin agar tool `message` bersama mengekspos surface milik channel
yang benar untuk giliran saat ini.

Untuk helper eksekusi milik channel, plugin bundled sebaiknya menyimpan runtime
eksekusi di dalam modul extension mereka sendiri. Core tidak lagi memiliki runtime
message-action Discord, Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`.
Kami tidak mempublikasikan subpath `plugin-sdk/*-action-runtime` terpisah, dan plugin bundled
sebaiknya mengimpor kode runtime lokal mereka sendiri langsung dari modul
milik extension mereka.

Batas yang sama berlaku untuk seam SDK bernama provider secara umum: core tidak
boleh mengimpor convenience barrel spesifik channel untuk Slack, Discord, Signal,
WhatsApp, atau extension serupa. Jika core memerlukan suatu perilaku, konsumsi
barrel `api.ts` / `runtime-api.ts` milik plugin bundled itu sendiri atau promosikan kebutuhan
tersebut menjadi kapabilitas generik yang sempit di SDK bersama.

Khusus untuk poll, ada dua jalur eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk channel yang cocok dengan model
  poll umum
- `actions.handleAction("poll")` adalah jalur yang disukai untuk semantik poll spesifik channel atau parameter poll tambahan

Core sekarang menunda parsing poll bersama sampai setelah dispatch poll plugin
menolak aksi tersebut, sehingga handler poll milik plugin dapat menerima field
poll spesifik channel tanpa diblokir lebih dulu oleh parser poll generik.

Lihat [Pipeline pemuatan](#load-pipeline) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan plugin native sebagai batas kepemilikan untuk sebuah **company** atau
sebuah **fitur**, bukan sebagai kumpulan integrasi yang tidak terkait.

Artinya:

- plugin company biasanya sebaiknya memiliki semua
  surface OpenClaw yang menghadap company tersebut
- plugin fitur biasanya sebaiknya memiliki seluruh surface fitur yang diperkenalkannya
- channel sebaiknya mengonsumsi kapabilitas core bersama alih-alih mengimplementasikan ulang perilaku provider secara ad hoc

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
- plugin `voice-call` adalah plugin fitur: plugin ini memiliki transport panggilan, tool,
  CLI, route, dan jembatan media-stream Twilio, tetapi mengonsumsi kapabilitas speech bersama
  plus realtime-transcription dan realtime-voice alih-alih
  mengimpor plugin vendor secara langsung

Kondisi akhir yang dituju adalah:

- OpenAI berada dalam satu plugin meskipun mencakup model teks, speech, gambar, dan
  video di masa mendatang
- vendor lain dapat melakukan hal yang sama untuk surface area miliknya sendiri
- channel tidak peduli plugin vendor mana yang memiliki provider; mereka mengonsumsi
  kontrak kapabilitas bersama yang diekspos oleh core

Inilah pembedaan kuncinya:

- **plugin** = batas kepemilikan
- **capability** = kontrak core yang dapat diimplementasikan atau dikonsumsi oleh beberapa plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama
bukanlah "provider mana yang harus meng-hardcode penanganan video?" Pertanyaan
pertama adalah "apa kontrak kapabilitas video inti?" Setelah kontrak itu ada,
plugin vendor dapat mendaftar terhadapnya dan plugin channel/fitur dapat
mengonsumsinya.

Jika kapabilitas itu belum ada, langkah yang biasanya tepat adalah:

1. definisikan kapabilitas yang hilang di core
2. ekspos melalui API/runtime plugin secara typed
3. hubungkan channel/fitur terhadap kapabilitas itu
4. biarkan plugin vendor mendaftarkan implementasi

Ini menjaga kepemilikan tetap eksplisit sambil menghindari perilaku core yang
bergantung pada satu vendor atau satu path kode spesifik plugin.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan di mana kode harus ditempatkan:

- **lapisan kapabilitas core**: orkestrasi bersama, kebijakan, fallback, aturan
  penggabungan config, semantik pengiriman, dan kontrak typed
- **lapisan plugin vendor**: API spesifik vendor, auth, katalog model, sintesis speech,
  pembuatan gambar, backend video di masa mendatang, endpoint usage
- **lapisan plugin channel/fitur**: integrasi Slack/Discord/voice-call/dll.
  yang mengonsumsi kapabilitas core dan menyajikannya pada suatu surface

Sebagai contoh, TTS mengikuti bentuk ini:

- core memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan pengiriman channel
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` mengonsumsi helper runtime TTS telephony

Pola yang sama sebaiknya dipilih untuk kapabilitas di masa mendatang.

### Contoh plugin company multi-kapabilitas

Sebuah plugin company harus terasa kohesif dari luar. Jika OpenClaw memiliki
kontrak bersama untuk model, speech, transkripsi realtime, suara realtime, pemahaman media,
pembuatan gambar, pembuatan video, pengambilan web, dan pencarian web,
seorang vendor dapat memiliki semua surface miliknya di satu tempat:

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

- satu plugin memiliki surface vendor
- core tetap memiliki kontrak kapabilitas
- channel dan plugin fitur mengonsumsi helper `api.runtime.*`, bukan kode vendor
- pengujian kontrak dapat menegaskan bahwa plugin mendaftarkan kapabilitas yang
  diklaim dimilikinya

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu
kapabilitas bersama. Model kepemilikan yang sama berlaku di sana:

1. core mendefinisikan kontrak media-understanding
2. plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan
   `describeVideo` sesuai kebutuhan
3. channel dan plugin fitur mengonsumsi perilaku core bersama alih-alih
   terhubung langsung ke kode vendor

Ini menghindari penanaman asumsi video dari satu provider ke dalam core. Plugin
memiliki surface vendor; core memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak
kapabilitas typed dan helper runtime, dan plugin vendor mendaftarkan
implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh daftar periksa rollout yang konkret? Lihat
[Capability Cookbook](/tools/capability-cookbook).

## Kontrak dan penegakan

Surface API plugin sengaja dibuat typed dan dipusatkan di
`OpenClawPluginApi`. Kontrak itu mendefinisikan titik registrasi yang didukung
dan helper runtime yang dapat diandalkan oleh sebuah plugin.

Mengapa ini penting:

- penulis plugin mendapatkan satu standar internal yang stabil
- core dapat menolak kepemilikan ganda seperti dua plugin yang mendaftarkan provider id yang sama
- startup dapat memunculkan diagnostik yang dapat ditindaklanjuti untuk registrasi yang malformed
- pengujian kontrak dapat menegakkan kepemilikan plugin bundled dan mencegah drift diam-diam

Ada dua lapisan penegakan:

1. **penegakan registrasi runtime**
   Registry plugin memvalidasi registrasi saat plugin dimuat. Contoh:
   provider id duplikat, speech provider id duplikat, dan registrasi
   yang malformed menghasilkan diagnostik plugin alih-alih perilaku tak terdefinisi.
2. **pengujian kontrak**
   Plugin bundled ditangkap dalam registry kontrak selama pengujian berjalan sehingga
   OpenClaw dapat menegaskan kepemilikan secara eksplisit. Saat ini ini digunakan untuk model
   provider, speech provider, web search provider, dan kepemilikan registrasi bundled.

Efek praktisnya adalah OpenClaw mengetahui, sejak awal, plugin mana yang memiliki
surface mana. Itu membuat core dan channel dapat tersusun mulus karena
kepemilikan dinyatakan, typed, dan dapat diuji, bukan implisit.

### Apa yang termasuk dalam kontrak

Kontrak plugin yang baik adalah:

- typed
- kecil
- spesifik kapabilitas
- dimiliki oleh core
- dapat digunakan ulang oleh beberapa plugin
- dapat dikonsumsi oleh channel/fitur tanpa pengetahuan vendor

Kontrak plugin yang buruk adalah:

- kebijakan spesifik vendor yang disembunyikan di core
- escape hatch plugin satu kali yang melewati registry
- kode channel yang menjangkau langsung ke implementasi vendor
- objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau
  `api.runtime`

Jika ragu, naikkan level abstraksinya: definisikan kapabilitas terlebih dahulu,
lalu biarkan plugin terhubung ke sana.

## Model eksekusi

Plugin native OpenClaw berjalan **in-process** bersama Gateway. Mereka tidak
di-sandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses
yang sama dengan kode core.

Implikasinya:

- plugin native dapat mendaftarkan tool, network handler, hook, dan layanan
- bug pada plugin native dapat membuat gateway crash atau tidak stabil
- plugin native yang berbahaya setara dengan eksekusi kode arbitrer di dalam
  proses OpenClaw

Bundle yang kompatibel lebih aman secara default karena OpenClaw saat ini
memperlakukan mereka sebagai paket metadata/konten. Dalam rilis saat ini, itu
terutama berarti Skills bundled.

Gunakan allowlist dan path instalasi/pemuatan eksplisit untuk plugin non-bundled.
Perlakukan plugin workspace sebagai kode waktu pengembangan, bukan default produksi.

Untuk nama package workspace bundled, jaga agar plugin id tetap melekat pada nama
npm: `@openclaw/<id>` secara default, atau suffix typed yang disetujui seperti
`-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` ketika
package dengan sengaja mengekspos peran plugin yang lebih sempit.

Catatan kepercayaan penting:

- `plugins.allow` mempercayai **plugin id**, bukan provenance sumber.
- Plugin workspace dengan id yang sama seperti plugin bundled sengaja membayangi
  salinan bundled ketika plugin workspace tersebut diaktifkan/di-allowlist.
- Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix.

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan convenience implementasi.

Pertahankan registrasi kapabilitas tetap publik. Pangkas ekspor helper non-kontrak:

- subpath helper spesifik plugin bundled
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper convenience spesifik vendor
- helper setup/onboarding yang merupakan detail implementasi

Beberapa subpath helper plugin bundled masih tetap ada di peta ekspor SDK yang
dihasilkan untuk kompatibilitas dan pemeliharaan plugin bundled. Contoh saat ini
mencakup `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan beberapa seam `plugin-sdk/matrix*`. Perlakukan ini sebagai
ekspor detail implementasi yang dicadangkan, bukan sebagai pola SDK yang direkomendasikan untuk
plugin pihak ketiga baru.

## Pipeline pemuatan

Saat startup, OpenClaw kira-kira melakukan ini:

1. menemukan root plugin kandidat
2. membaca manifest native atau bundle kompatibel serta metadata package
3. menolak kandidat yang tidak aman
4. menormalisasi config plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. memutuskan enablement untuk setiap kandidat
6. memuat modul native yang diaktifkan melalui jiti
7. memanggil hook native `register(api)` (atau `activate(api)` — alias legacy) dan mengumpulkan registrasi ke dalam registry plugin
8. mengekspos registry ke surface command/runtime

<Note>
`activate` adalah alias legacy untuk `register` — loader meresolve mana pun yang ada (`def.register ?? def.activate`) dan memanggilnya pada titik yang sama. Semua plugin bundled menggunakan `register`; pilih `register` untuk plugin baru.
</Note>

Gerbang keamanan terjadi **sebelum** eksekusi runtime. Kandidat diblokir
ketika entry keluar dari root plugin, path dapat ditulis dunia, atau kepemilikan path
terlihat mencurigakan untuk plugin non-bundled.

### Perilaku manifest-first

Manifest adalah sumber kebenaran control-plane. OpenClaw menggunakannya untuk:

- mengidentifikasi plugin
- menemukan deklarasi channel/skills/schema config atau kapabilitas bundle
- memvalidasi `plugins.entries.<id>.config`
- menambah label/placeholder UI Control
- menampilkan metadata instalasi/katalog

Untuk plugin native, modul runtime adalah bagian data-plane. Modul ini mendaftarkan
perilaku aktual seperti hook, tool, command, atau alur provider.

### Apa yang di-cache oleh loader

OpenClaw menyimpan cache in-process jangka pendek untuk:

- hasil discovery
- data registry manifest
- registry plugin yang dimuat

Cache ini mengurangi startup yang meledak-ledak dan overhead command berulang. Cache ini aman
untuk dipahami sebagai cache performa berumur pendek, bukan persistensi.

Catatan performa:

- Setel `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` atau
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` untuk menonaktifkan cache ini.
- Sesuaikan jendela cache dengan `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` dan
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Model registry

Plugin yang dimuat tidak langsung memodifikasi global core acak. Mereka mendaftar ke sebuah
registry plugin pusat.

Registry melacak:

- record plugin (identitas, sumber, origin, status, diagnostik)
- tool
- hook legacy dan hook typed
- channel
- provider
- handler RPC gateway
- route HTTP
- registrar CLI
- layanan latar belakang
- command milik plugin

Fitur core kemudian membaca dari registry itu alih-alih berbicara langsung
dengan modul plugin. Ini menjaga pemuatan tetap satu arah:

- modul plugin -> registrasi registry
- runtime core -> konsumsi registry

Pemisahan itu penting untuk maintainability. Ini berarti sebagian besar surface core hanya
memerlukan satu titik integrasi: "baca registry", bukan "buat special-case untuk setiap
modul plugin".

## Callback pengikatan percakapan

Plugin yang mengikat percakapan dapat bereaksi saat sebuah persetujuan diselesaikan.

Gunakan `api.onConversationBindingResolved(...)` untuk menerima callback setelah permintaan bind
disetujui atau ditolak:

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
- `binding`: binding yang ter-resolve untuk permintaan yang disetujui
- `request`: ringkasan permintaan asli, petunjuk detach, sender id, dan
  metadata percakapan

Callback ini hanya untuk notifikasi. Callback ini tidak mengubah siapa yang
diizinkan mengikat percakapan, dan dijalankan setelah penanganan persetujuan core selesai.

## Hook runtime provider

Plugin provider sekarang memiliki dua lapisan:

- metadata manifest: `providerAuthEnvVars` untuk lookup auth env murah sebelum
  runtime dimuat, plus `providerAuthChoices` untuk label onboarding/pilihan auth murah
  dan metadata flag CLI sebelum runtime dimuat
- hook waktu konfigurasi: `catalog` / legacy `discovery` plus `applyConfigDefaults`
- hook runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
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
kebijakan tool. Hook-hook ini adalah surface extension untuk perilaku spesifik provider tanpa
memerlukan transport inferensi kustom penuh.

Gunakan manifest `providerAuthEnvVars` saat provider memiliki kredensial berbasis env
yang harus terlihat oleh jalur auth/status/model-picker generik tanpa memuat runtime plugin.
Gunakan manifest `providerAuthChoices` saat surface CLI onboarding/pilihan auth
perlu mengetahui choice id provider, label grup, dan wiring auth satu-flag sederhana
tanpa memuat runtime provider. Pertahankan runtime provider `envVars` untuk petunjuk
yang menghadap operator seperti label onboarding atau variabel setup
OAuth client-id/client-secret.

### Urutan hook dan penggunaan

Untuk plugin model/provider, OpenClaw memanggil hook dalam urutan kasar berikut.
Kolom "When to use" adalah panduan keputusan cepat.

| #   | Hook                              | What it does                                                                             | When to use                                                                                                                                 |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Mempublikasikan config provider ke `models.providers` selama generasi `models.json`          | Provider memiliki katalog atau default base URL                                                                                                |
| 2   | `applyConfigDefaults`             | Menerapkan default config global milik provider selama materialisasi config                | Default bergantung pada mode auth, env, atau semantik keluarga model provider                                                                       |
| --  | _(pencarian model bawaan)_        | OpenClaw mencoba jalur registry/katalog normal terlebih dahulu                                    | _(bukan hook plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Menormalisasi alias model-id legacy atau preview sebelum lookup                               | Provider memiliki pembersihan alias sebelum resolusi model kanonis                                                                               |
| 4   | `normalizeTransport`              | Menormalisasi `api` / `baseUrl` keluarga provider sebelum perakitan model generik                | Provider memiliki pembersihan transport untuk provider id kustom dalam keluarga transport yang sama                                                        |
| 5   | `normalizeConfig`                 | Menormalisasi `models.providers.<id>` sebelum resolusi runtime/provider                     | Provider memerlukan pembersihan config yang seharusnya berada bersama plugin; helper keluarga Google bundled juga menjadi backstop untuk entri config Google yang didukung |
| 6   | `applyNativeStreamingUsageCompat` | Menerapkan penulisan ulang kompatibilitas streaming-usage native ke provider config                         | Provider memerlukan perbaikan metadata native streaming usage berbasis endpoint                                                                        |
| 7   | `resolveConfigApiKey`             | Meresolve auth penanda env untuk provider config sebelum pemuatan auth runtime                 | Provider memiliki resolusi API key penanda env milik provider; `amazon-bedrock` juga memiliki resolver penanda env AWS bawaan di sini                |
| 8   | `resolveSyntheticAuth`            | Menampilkan auth lokal/self-hosted atau berbasis config tanpa mempersistenkan plaintext             | Provider dapat beroperasi dengan penanda kredensial sintetis/lokal                                                                               |
| 9   | `shouldDeferSyntheticProfileAuth` | Menurunkan prioritas placeholder profil sintetis yang tersimpan di bawah auth berbasis env/config                | Provider menyimpan profil placeholder sintetis yang seharusnya tidak menang dalam prioritas                                                               |
| 10  | `resolveDynamicModel`             | Fallback sinkron untuk model id milik provider yang belum ada di registry lokal                 | Provider menerima model id upstream arbitrer                                                                                               |
| 11  | `prepareDynamicModel`             | Warm-up async, lalu `resolveDynamicModel` dijalankan lagi                                     | Provider memerlukan metadata jaringan sebelum meresolve id yang tidak dikenal                                                                                |
| 12  | `normalizeResolvedModel`          | Penulisan ulang akhir sebelum embedded runner menggunakan model yang ter-resolve                         | Provider memerlukan penulisan ulang transport tetapi masih menggunakan transport core                                                                           |
| 13  | `contributeResolvedModelCompat`   | Menyumbangkan flag kompatibilitas untuk model vendor di balik transport kompatibel lain            | Provider mengenali modelnya sendiri pada transport proxy tanpa mengambil alih provider                                                     |
| 14  | `capabilities`                    | Metadata transkrip/tooling milik provider yang digunakan oleh logika core bersama                     | Provider memerlukan keunikan transkrip/keluarga provider                                                                                            |
| 15  | `normalizeToolSchemas`            | Menormalisasi schema tool sebelum embedded runner melihatnya                              | Provider memerlukan pembersihan schema keluarga transport                                                                                              |
| 16  | `inspectToolSchemas`              | Menampilkan diagnostik schema milik provider setelah normalisasi                            | Provider ingin peringatan keyword tanpa mengajarkan aturan spesifik provider ke core                                                               |
| 17  | `resolveReasoningOutputMode`      | Memilih kontrak keluaran reasoning native vs bertag                                        | Provider memerlukan reasoning/final output bertag alih-alih field native                                                                       |
| 18  | `prepareExtraParams`              | Normalisasi parameter request sebelum wrapper opsi stream generik                        | Provider memerlukan parameter request default atau pembersihan parameter per-provider                                                                         |
| 19  | `createStreamFn`                  | Sepenuhnya mengganti jalur stream normal dengan transport kustom                             | Provider memerlukan wire protocol kustom, bukan sekadar wrapper                                                                                   |
| 20  | `wrapStreamFn`                    | Wrapper stream setelah wrapper generik diterapkan                                        | Provider memerlukan wrapper header/body/model kompatibilitas request tanpa transport kustom                                                        |
| 21  | `resolveTransportTurnState`       | Melampirkan header atau metadata transport per-turn native                                     | Provider ingin transport generik mengirim identitas turn native provider                                                                     |
| 22  | `resolveWebSocketSessionPolicy`   | Melampirkan header WebSocket native atau kebijakan cool-down sesi                              | Provider ingin transport WS generik menyetel header sesi atau kebijakan fallback                                                             |
| 23  | `formatApiKey`                    | Formatter profil auth: profil tersimpan menjadi string `apiKey` runtime               | Provider menyimpan metadata auth tambahan dan memerlukan bentuk token runtime kustom                                                                  |
| 24  | `refreshOAuth`                    | Override refresh OAuth untuk endpoint refresh kustom atau kebijakan kegagalan refresh            | Provider tidak cocok dengan refresher `pi-ai` bersama                                                                                         |
| 25  | `buildAuthDoctorHint`             | Petunjuk perbaikan yang ditambahkan saat refresh OAuth gagal                                            | Provider memerlukan panduan perbaikan auth milik provider setelah kegagalan refresh                                                                    |
| 26  | `matchesContextOverflowError`     | Matcher overflow context-window milik provider                                           | Provider memiliki error overflow mentah yang tidak terdeteksi oleh heuristik generik                                                                              |
| 27  | `classifyFailoverReason`          | Klasifikasi alasan failover milik provider                                            | Provider dapat memetakan error API/transport mentah ke rate-limit/overload/dll                                                                        |
| 28  | `isCacheTtlEligible`              | Kebijakan prompt-cache untuk provider proxy/backhaul                                         | Provider memerlukan gating TTL cache spesifik proxy                                                                                              |
| 29  | `buildMissingAuthMessage`         | Pengganti untuk pesan pemulihan missing-auth generik                                | Provider memerlukan petunjuk pemulihan missing-auth spesifik provider                                                                               |
| 30  | `suppressBuiltInModel`            | Penekanan model upstream usang plus petunjuk error opsional yang menghadap pengguna                    | Provider perlu menyembunyikan baris upstream usang atau menggantinya dengan petunjuk vendor                                                               |
| 31  | `augmentModelCatalog`             | Baris katalog sintetis/akhir ditambahkan setelah discovery                                    | Provider memerlukan baris forward-compat sintetis di `models list` dan picker                                                                   |
| 32  | `isBinaryThinking`                | Toggle reasoning on/off untuk provider binary-thinking                                    | Provider hanya mengekspos binary thinking on/off                                                                                                |
| 33  | `supportsXHighThinking`           | Dukungan reasoning `xhigh` untuk model terpilih                                            | Provider ingin `xhigh` hanya pada subset model                                                                                           |
| 34  | `resolveDefaultThinkingLevel`     | Level `/think` default untuk keluarga model tertentu                                       | Provider memiliki kebijakan `/think` default untuk keluarga model                                                                                    |
| 35  | `isModernModelRef`                | Matcher model-modern untuk filter profil live dan pemilihan smoke                        | Provider memiliki pencocokan model pilihan live/smoke                                                                                           |
| 36  | `prepareRuntimeAuth`              | Menukar kredensial yang dikonfigurasi menjadi token/key runtime aktual tepat sebelum inferensi | Provider memerlukan pertukaran token atau kredensial request berumur pendek                                                                           |
| 37  | `resolveUsageAuth`                | Meresolve kredensial usage/billing untuk `/usage` dan surface status terkait               | Provider memerlukan parsing token usage/kuota kustom atau kredensial usage yang berbeda                                                             |
| 38  | `fetchUsageSnapshot`              | Mengambil dan menormalisasi snapshot usage/kuota spesifik provider setelah auth di-resolve       | Provider memerlukan endpoint usage atau parser payload spesifik provider                                                                         |
| 39  | `createEmbeddingProvider`         | Membangun adapter embedding milik provider untuk memory/search                               | Perilaku embedding memory seharusnya berada bersama plugin provider                                                                                  |
| 40  | `buildReplayPolicy`               | Mengembalikan kebijakan replay yang mengendalikan penanganan transkrip untuk provider                  | Provider memerlukan kebijakan transkrip kustom (misalnya penghapusan blok thinking)                                                             |
| 41  | `sanitizeReplayHistory`           | Menulis ulang riwayat replay setelah pembersihan transkrip generik                                  | Provider memerlukan penulisan ulang replay spesifik provider di luar helper pemadatan bersama                                                           |
| 42  | `validateReplayTurns`             | Validasi atau pembentukan ulang replay-turn akhir sebelum embedded runner                     | Transport provider memerlukan validasi turn yang lebih ketat setelah sanitasi generik                                                                  |
| 43  | `onModelSelected`                 | Menjalankan efek samping pasca-pemilihan milik provider                                           | Provider memerlukan telemetri atau state milik provider saat sebuah model menjadi aktif                                                                |

`normalizeModelId`, `normalizeTransport`, dan `normalizeConfig` terlebih dahulu
memeriksa plugin provider yang cocok, lalu fallback ke plugin provider lain yang
mampu menggunakan hook sampai salah satunya benar-benar mengubah model id atau
transport/config. Ini menjaga shim provider alias/kompatibilitas tetap berfungsi
tanpa mengharuskan pemanggil mengetahui plugin bundled mana yang memiliki penulisan ulang tersebut. Jika tidak ada hook provider yang menulis ulang entri config keluarga
Google yang didukung, normalizer config Google bundled tetap menerapkan pembersihan kompatibilitas itu.

Jika provider memerlukan wire protocol yang sepenuhnya kustom atau executor request
kustom, itu adalah kelas extension yang berbeda. Hook-hook ini ditujukan untuk
perilaku provider yang tetap berjalan pada loop inferensi normal OpenClaw.

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
  dan `wrapStreamFn` karena memiliki forward-compat Claude 4.6,
  petunjuk keluarga provider, panduan perbaikan auth, integrasi endpoint usage,
  eligibility prompt-cache, default config yang sadar auth, kebijakan thinking
  default/adaptif Claude, serta pembentukan stream spesifik Anthropic untuk
  beta header, `/fast` / `serviceTier`, dan `context1m`.
- Helper stream spesifik Claude milik Anthropic untuk saat ini tetap berada di
  seam `api.ts` / `contract-api.ts` publik milik plugin bundled itu sendiri. Surface package
  itu mengekspor `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, dan builder wrapper
  Anthropic tingkat rendah alih-alih memperlebar SDK generik di sekitar aturan
  beta-header satu provider.
- OpenAI menggunakan `resolveDynamicModel`, `normalizeResolvedModel`, dan
  `capabilities` plus `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking`, dan `isModernModelRef`
  karena memiliki forward-compat GPT-5.4, normalisasi langsung OpenAI
  `openai-completions` -> `openai-responses`, petunjuk auth yang sadar Codex,
  penekanan Spark, baris daftar OpenAI sintetis, dan kebijakan thinking /
  live-model GPT-5; keluarga stream `openai-responses-defaults` memiliki wrapper
  OpenAI Responses native bersama untuk header atribusi,
  `/fast`/`serviceTier`, text verbosity, native Codex web search,
  pembentukan payload reasoning-compat, dan manajemen konteks Responses.
- OpenRouter menggunakan `catalog` plus `resolveDynamicModel` dan
  `prepareDynamicModel` karena provider bersifat pass-through dan mungkin mengekspos
  model id baru sebelum katalog statis OpenClaw diperbarui; provider ini juga menggunakan
  `capabilities`, `wrapStreamFn`, dan `isCacheTtlEligible` agar
  header request spesifik provider, metadata routing, patch reasoning, dan
  kebijakan prompt-cache tetap berada di luar core. Kebijakan replay-nya berasal dari
  keluarga `passthrough-gemini`, sedangkan keluarga stream `openrouter-thinking`
  memiliki injection reasoning proxy dan skip untuk model yang tidak didukung / `auto`.
- GitHub Copilot menggunakan `catalog`, `auth`, `resolveDynamicModel`, dan
  `capabilities` plus `prepareRuntimeAuth` dan `fetchUsageSnapshot` karena
  memerlukan device login milik provider, perilaku fallback model, keunikan transkrip Claude,
  pertukaran token GitHub -> token Copilot, dan endpoint usage milik provider.
- OpenAI Codex menggunakan `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth`, dan `augmentModelCatalog` plus
  `prepareExtraParams`, `resolveUsageAuth`, dan `fetchUsageSnapshot` karena
  masih berjalan di transport OpenAI core tetapi memiliki normalisasi
  transport/base URL, kebijakan fallback refresh OAuth, pilihan transport default,
  baris katalog Codex sintetis, dan integrasi endpoint usage ChatGPT; provider ini
  berbagi keluarga stream `openai-responses-defaults` yang sama dengan OpenAI langsung.
- Google AI Studio dan Gemini CLI OAuth menggunakan `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn`, dan `isModernModelRef` karena
  keluarga replay `google-gemini` memiliki fallback forward-compat Gemini 3.1,
  validasi replay Gemini native, sanitasi replay bootstrap, mode keluaran reasoning bertag, dan pencocokan modern-model, sedangkan
  keluarga stream `google-thinking` memiliki normalisasi payload thinking Gemini;
  Gemini CLI OAuth juga menggunakan `formatApiKey`, `resolveUsageAuth`, dan
  `fetchUsageSnapshot` untuk pemformatan token, parsing token, dan
  wiring endpoint kuota.
- Anthropic Vertex menggunakan `buildReplayPolicy` melalui keluarga replay
  `anthropic-by-model` sehingga pembersihan replay spesifik Claude tetap
  terbatas pada id Claude alih-alih setiap transport `anthropic-messages`.
- Amazon Bedrock menggunakan `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason`, dan `resolveDefaultThinkingLevel` karena memiliki
  klasifikasi error throttle/not-ready/context-overflow spesifik Bedrock
  untuk trafik Anthropic-on-Bedrock; kebijakan replay-nya tetap berbagi guard
  `anthropic-by-model` khusus Claude yang sama.
- OpenRouter, Kilocode, Opencode, dan Opencode Go menggunakan `buildReplayPolicy`
  melalui keluarga replay `passthrough-gemini` karena mereka mem-proxy model
  Gemini melalui transport yang kompatibel dengan OpenAI dan memerlukan
  sanitasi thought-signature Gemini tanpa validasi replay Gemini native atau
  penulisan ulang bootstrap.
- MiniMax menggunakan `buildReplayPolicy` melalui keluarga replay
  `hybrid-anthropic-openai` karena satu provider memiliki semantik pesan
  Anthropic dan kompatibel OpenAI sekaligus; provider ini mempertahankan
  penghapusan thinking-block khusus Claude di sisi Anthropic sambil mengoverride mode keluaran reasoning kembali ke native, dan keluarga stream `minimax-fast-mode` memiliki
  penulisan ulang model fast-mode pada jalur stream bersama.
- Moonshot menggunakan `catalog` plus `wrapStreamFn` karena masih menggunakan transport
  OpenAI bersama tetapi memerlukan normalisasi payload thinking milik provider; keluarga
  stream `moonshot-thinking` memetakan config plus status `/think` ke payload
  binary thinking native-nya.
- Kilocode menggunakan `catalog`, `capabilities`, `wrapStreamFn`, dan
  `isCacheTtlEligible` karena memerlukan header request milik provider,
  normalisasi payload reasoning, petunjuk transkrip Gemini, dan gating
  cache-TTL Anthropic; keluarga stream `kilocode-thinking` mempertahankan injection
  thinking Kilo pada jalur stream proxy bersama sambil melewati `kilo/auto` dan
  model id proxy lain yang tidak mendukung payload reasoning eksplisit.
- Z.AI menggunakan `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth`, dan `fetchUsageSnapshot` karena memiliki fallback GLM-5,
  default `tool_stream`, UX binary thinking, pencocokan modern-model, serta
  auth usage + pengambilan kuota; keluarga stream `tool-stream-default-on`
  menjaga wrapper `tool_stream` default-on tetap di luar glue tulisan tangan per-provider.
- xAI menggunakan `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel`, dan `isModernModelRef`
  karena memiliki normalisasi transport xAI Responses native, penulisan ulang alias
  Grok fast-mode, default `tool_stream`, pembersihan strict-tool / reasoning-payload,
  penggunaan ulang auth fallback untuk tool milik plugin, resolusi model Grok
  forward-compat, dan patch kompatibilitas milik provider seperti profil
  tool-schema xAI, unsupported schema keywords, native `web_search`, dan
  decoding argumen tool-call entitas HTML.
- Mistral, OpenCode Zen, dan OpenCode Go hanya menggunakan `capabilities` untuk
  menjaga keunikan transkrip/tooling tetap di luar core.
- Provider bundled katalog-saja seperti `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway`, dan `volcengine` menggunakan
  `catalog` saja.
- Qwen menggunakan `catalog` untuk provider teksnya plus registrasi
  media-understanding dan video-generation bersama untuk surface multimodalnya.
- MiniMax dan Xiaomi menggunakan `catalog` plus usage hooks karena perilaku
  `/usage` mereka dimiliki plugin meskipun inferensi masih berjalan melalui
  transport bersama.

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

- `textToSpeech` mengembalikan payload keluaran TTS core normal untuk surface file/voice-note.
- Menggunakan konfigurasi core `messages.tts` dan pemilihan provider.
- Mengembalikan buffer audio PCM + sample rate. Plugin harus melakukan resample/encode untuk provider.
- `listVoices` bersifat opsional per provider. Gunakan untuk voice picker atau alur setup milik vendor.
- Daftar suara dapat menyertakan metadata yang lebih kaya seperti locale, gender, dan tag kepribadian untuk picker yang sadar provider.
- OpenAI dan ElevenLabs mendukung telephony saat ini. Microsoft tidak.

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

- Pertahankan kebijakan TTS, fallback, dan pengiriman balasan di core.
- Gunakan speech provider untuk perilaku sintesis milik vendor.
- Input `edge` legacy Microsoft dinormalisasi menjadi provider id `microsoft`.
- Model kepemilikan yang disukai berorientasi pada company: satu plugin vendor dapat memiliki
  provider teks, speech, gambar, dan media di masa depan saat OpenClaw menambahkan
  kontrak kapabilitas tersebut.

Untuk pemahaman gambar/audio/video, plugin mendaftarkan satu provider
media-understanding typed alih-alih bag key/value generik:

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
- Ekspansi aditif harus tetap typed: metode opsional baru, field hasil opsional baru, kapabilitas opsional baru.
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
atau alias STT lama:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Catatan:

- `api.runtime.mediaUnderstanding.*` adalah surface bersama yang disukai untuk
  pemahaman gambar/audio/video.
- Menggunakan konfigurasi audio media-understanding core (`tools.media.audio`) dan urutan fallback provider.
- Mengembalikan `{ text: undefined }` ketika tidak ada keluaran transkripsi yang dihasilkan (misalnya input dilewati/tidak didukung).
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
- Untuk eksekusi fallback milik plugin, operator harus memilih opt-in dengan `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Gunakan `plugins.entries.<id>.subagent.allowedModels` untuk membatasi plugin tepercaya ke target kanonis `provider/model` tertentu, atau `"*"` untuk secara eksplisit mengizinkan target apa pun.
- Eksekusi subagent plugin tak tepercaya tetap berfungsi, tetapi permintaan override ditolak alih-alih diam-diam fallback.

Untuk pencarian web, plugin dapat mengonsumsi helper runtime bersama alih-alih
menjangkau wiring tool agen:

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

Plugin juga dapat mendaftarkan web-search provider melalui
`api.registerWebSearchProvider(...)`.

Catatan:

- Pertahankan pemilihan provider, resolusi kredensial, dan semantik request bersama di core.
- Gunakan web-search provider untuk transport pencarian spesifik vendor.
- `api.runtime.webSearch.*` adalah surface bersama yang disukai untuk plugin fitur/channel yang memerlukan perilaku pencarian tanpa bergantung pada wrapper tool agen.

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

- `generate(...)`: buat gambar menggunakan rantai provider image-generation yang dikonfigurasi.
- `listProviders(...)`: daftar provider image-generation yang tersedia dan kapabilitasnya.

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
- `auth`: wajib. Gunakan `"gateway"` untuk mewajibkan auth gateway normal, atau `"plugin"` untuk auth/verifikasi webhook yang dikelola plugin.
- `match`: opsional. `"exact"` (default) atau `"prefix"`.
- `replaceExisting`: opsional. Memungkinkan plugin yang sama mengganti registrasi route miliknya yang sudah ada.
- `handler`: kembalikan `true` ketika route menangani request.

Catatan:

- `api.registerHttpHandler(...)` telah dihapus dan akan menyebabkan error pemuatan plugin. Gunakan `api.registerHttpRoute(...)` sebagai gantinya.
- Route plugin harus menyatakan `auth` secara eksplisit.
- Konflik `path + match` exact ditolak kecuali `replaceExisting: true`, dan satu plugin tidak dapat mengganti route plugin lain.
- Route yang tumpang tindih dengan level `auth` berbeda akan ditolak. Pertahankan rantai fallthrough `exact`/`prefix` hanya pada level auth yang sama.
- Route `auth: "plugin"` **tidak** menerima scope runtime operator secara otomatis. Route ini ditujukan untuk webhook/verifikasi signature yang dikelola plugin, bukan panggilan helper Gateway yang memiliki privilese.
- Route `auth: "gateway"` berjalan di dalam runtime scope request Gateway, tetapi scope itu sengaja konservatif:
  - shared-secret bearer auth (`gateway.auth.mode = "token"` / `"password"`) mempertahankan scope runtime route plugin pada `operator.write`, bahkan jika pemanggil mengirim `x-openclaw-scopes`
  - mode HTTP tepercaya yang membawa identitas (misalnya `trusted-proxy` atau `gateway.auth.mode = "none"` pada ingress privat) menghormati `x-openclaw-scopes` hanya ketika header itu secara eksplisit ada
  - jika `x-openclaw-scopes` tidak ada pada request route plugin yang membawa identitas tersebut, scope runtime fallback ke `operator.write`
- Aturan praktis: jangan berasumsi bahwa route plugin dengan auth gateway adalah surface admin implisit. Jika route Anda memerlukan perilaku admin-only, wajibkan mode auth yang membawa identitas dan dokumentasikan kontrak header `x-openclaw-scopes` yang eksplisit.

## Path impor Plugin SDK

Gunakan subpath SDK alih-alih impor monolitik `openclaw/plugin-sdk` saat
menulis plugin:

- `openclaw/plugin-sdk/plugin-entry` untuk primitif registrasi plugin.
- `openclaw/plugin-sdk/core` untuk kontrak umum bersama yang menghadap plugin.
- `openclaw/plugin-sdk/config-schema` untuk ekspor skema Zod root `openclaw.json`
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
  `openclaw/plugin-sdk/webhook-ingress` untuk wiring setup/auth/reply/webhook bersama.
  `channel-inbound` adalah rumah bersama untuk debounce, pencocokan mention,
  pemformatan envelope, dan helper konteks envelope inbound.
  `channel-setup` adalah seam setup opsional-install yang sempit.
  `setup-runtime` adalah surface setup yang aman untuk runtime yang digunakan oleh `setupEntry` /
  startup yang ditunda, termasuk adapter patch setup yang aman untuk impor.
  `setup-adapter-runtime` adalah seam adapter setup akun yang sadar env.
  `setup-tools` adalah seam helper kecil untuk CLI/arsip/dokumen (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subpath domain seperti `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
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
  `telegram-command-config` adalah seam publik sempit untuk normalisasi/validasi
  custom command Telegram dan tetap tersedia meskipun surface kontrak Telegram bundled
  sementara tidak tersedia.
  `text-runtime` adalah seam bersama untuk teks/markdown/logging, termasuk
  penghilangan teks yang terlihat oleh asisten, helper render/chunking markdown, helper redaksi,
  helper directive-tag, dan utilitas safe-text.
- Seam channel spesifik persetujuan sebaiknya memilih satu kontrak `approvalCapability`
  pada plugin. Core kemudian membaca auth persetujuan, pengiriman, render, dan
  perilaku native-routing melalui satu kapabilitas itu alih-alih mencampur
  perilaku persetujuan ke field plugin yang tidak terkait.
- `openclaw/plugin-sdk/channel-runtime` sudah deprecated dan hanya tersisa sebagai
  shim kompatibilitas untuk plugin lama. Kode baru sebaiknya mengimpor primitif generik yang lebih sempit sebagai gantinya, dan kode repo tidak boleh menambah impor baru terhadap shim tersebut.
- Internal extension bundled tetap privat. Plugin eksternal sebaiknya hanya menggunakan
  subpath `openclaw/plugin-sdk/*`. Kode core/test OpenClaw dapat menggunakan entry point publik repo di bawah root package plugin seperti `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js`, dan file yang cakupannya sempit seperti
  `login-qr-api.js`. Jangan pernah mengimpor `src/*` package plugin dari core atau dari
  extension lain.
- Pembagian entry point repo:
  `<plugin-package-root>/api.js` adalah barrel helper/types,
  `<plugin-package-root>/runtime-api.js` adalah barrel runtime-only,
  `<plugin-package-root>/index.js` adalah entry plugin bundled,
  dan `<plugin-package-root>/setup-entry.js` adalah entry plugin setup.
- Contoh provider bundled saat ini:
  - Anthropic menggunakan `api.js` / `contract-api.js` untuk helper stream Claude seperti
    `wrapAnthropicProviderStream`, helper beta-header, dan parsing `service_tier`.
  - OpenAI menggunakan `api.js` untuk builder provider, helper model default, dan builder provider realtime.
  - OpenRouter menggunakan `api.js` untuk builder provider plus helper onboarding/config,
    sedangkan `register.runtime.js` masih dapat mengekspor ulang helper generik
    `plugin-sdk/provider-stream` untuk penggunaan lokal repo.
- Entry point publik yang dimuat melalui facade lebih memilih snapshot config runtime aktif
  ketika ada, lalu fallback ke file config ter-resolve di disk ketika
  OpenClaw belum melayani snapshot runtime.
- Primitif generik bersama tetap menjadi kontrak SDK publik yang disukai. Sebagian kecil
  seam helper bermerek channel bundled yang dicadangkan untuk kompatibilitas masih ada.
  Perlakukan itu sebagai seam pemeliharaan/kompatibilitas bundled, bukan target impor pihak ketiga baru;
  kontrak lintas-channel baru tetap sebaiknya berada pada subpath generik `plugin-sdk/*` atau barrel plugin-local `api.js` /
  `runtime-api.js`.

Catatan kompatibilitas:

- Hindari barrel root `openclaw/plugin-sdk` untuk kode baru.
- Lebih pilih primitif stabil yang sempit terlebih dahulu. Subpath setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool yang lebih baru adalah kontrak yang dituju untuk pekerjaan plugin bundled dan eksternal baru.
  Parsing/pencocokan target berada pada `openclaw/plugin-sdk/channel-targets`.
  Gate action pesan dan helper message-id reaksi berada pada
  `openclaw/plugin-sdk/channel-actions`.
- Barrel helper spesifik extension bundled tidak stabil secara default. Jika sebuah
  helper hanya diperlukan oleh extension bundled, simpan di balik seam lokal
  `api.js` atau `runtime-api.js` milik extension itu alih-alih mempromosikannya ke
  `openclaw/plugin-sdk/<extension>`.
- Seam helper bersama yang baru sebaiknya generik, bukan bermerek channel. Parsing target bersama
  berada pada `openclaw/plugin-sdk/channel-targets`; internal spesifik channel
  tetap berada di balik seam lokal `api.js` atau `runtime-api.js` milik plugin.
- Subpath spesifik kapabilitas seperti `image-generation`,
  `media-understanding`, dan `speech` ada karena plugin bundled/native menggunakannya
  hari ini. Keberadaannya tidak dengan sendirinya berarti setiap helper yang diekspor adalah
  kontrak eksternal jangka panjang yang dibekukan.

## Skema tool pesan

Plugin sebaiknya memiliki kontribusi schema `describeMessageTool(...)` spesifik channel.
Pertahankan field spesifik provider di plugin, bukan di core bersama.

Untuk fragmen schema portabel bersama, gunakan ulang helper generik yang diekspor melalui
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` untuk payload gaya grid tombol
- `createMessageToolCardSchema()` untuk payload kartu terstruktur

Jika bentuk schema hanya masuk akal untuk satu provider, definisikan di source
milik plugin itu sendiri alih-alih mempromosikannya ke SDK bersama.

## Resolusi target channel

Plugin channel sebaiknya memiliki semantik target spesifik channel. Pertahankan host
outbound bersama tetap generik dan gunakan surface adapter perpesanan untuk aturan provider:

- `messaging.inferTargetChatType({ to })` memutuskan apakah target yang dinormalisasi
  harus diperlakukan sebagai `direct`, `group`, atau `channel` sebelum lookup direktori.
- `messaging.targetResolver.looksLikeId(raw, normalized)` memberi tahu core apakah sebuah
  input harus langsung menuju resolusi yang mirip id alih-alih pencarian direktori.
- `messaging.targetResolver.resolveTarget(...)` adalah fallback plugin ketika
  core memerlukan resolusi akhir milik provider setelah normalisasi atau setelah direktori tidak menemukan hasil.
- `messaging.resolveOutboundSessionRoute(...)` memiliki konstruksi route sesi spesifik provider setelah target ter-resolve.

Pembagian yang direkomendasikan:

- Gunakan `inferTargetChatType` untuk keputusan kategori yang harus terjadi sebelum
  pencarian peer/group.
- Gunakan `looksLikeId` untuk pemeriksaan "perlakukan ini sebagai id target eksplisit/native".
- Gunakan `resolveTarget` untuk fallback normalisasi spesifik provider, bukan untuk
  pencarian direktori luas.
- Simpan id native provider seperti chat id, thread id, JID, handle, dan room
  id di dalam nilai `target` atau parameter spesifik provider, bukan di field SDK generik.

## Direktori berbasis config

Plugin yang menurunkan entri direktori dari config harus menyimpan logika itu di
plugin dan menggunakan ulang helper bersama dari
`openclaw/plugin-sdk/directory-runtime`.

Gunakan ini saat sebuah channel memerlukan peer/group berbasis config seperti:

- peer DM berbasis allowlist
- peta channel/group yang dikonfigurasi
- fallback direktori statis dengan scope akun

Helper bersama dalam `directory-runtime` hanya menangani operasi generik:

- filtering query
- penerapan limit
- helper deduping/normalisasi
- membangun `ChannelDirectoryEntry[]`

Inspeksi akun spesifik channel dan normalisasi id sebaiknya tetap berada dalam
implementasi plugin.

## Katalog provider

Plugin provider dapat mendefinisikan katalog model untuk inferensi dengan
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` mengembalikan bentuk yang sama yang ditulis OpenClaw ke dalam
`models.providers`:

- `{ provider }` untuk satu entri provider
- `{ providers }` untuk beberapa entri provider

Gunakan `catalog` ketika plugin memiliki model id spesifik provider, default base URL,
atau metadata model yang bergantung pada auth.

`catalog.order` mengontrol kapan katalog plugin digabung relatif terhadap provider
implisit bawaan OpenClaw:

- `simple`: provider berbasis API key atau env biasa
- `profile`: provider yang muncul ketika profil auth ada
- `paired`: provider yang mensintesis beberapa entri provider terkait
- `late`: pass terakhir, setelah provider implisit lain

Provider yang lebih akhir menang pada key collision, sehingga plugin dapat
sengaja mengganti entri provider bawaan dengan provider id yang sama.

Kompatibilitas:

- `discovery` tetap berfungsi sebagai alias legacy
- jika `catalog` dan `discovery` sama-sama didaftarkan, OpenClaw menggunakan `catalog`

## Inspeksi channel baca-saja

Jika plugin Anda mendaftarkan channel, pilih implementasi
`plugin.config.inspectAccount(cfg, accountId)` di samping `resolveAccount(...)`.

Mengapa:

- `resolveAccount(...)` adalah jalur runtime. Jalur ini boleh mengasumsikan kredensial
  sudah sepenuhnya termaterialisasi dan dapat gagal cepat saat secret yang diperlukan tidak ada.
- Jalur command baca-saja seperti `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, dan alur doctor/perbaikan config
  seharusnya tidak perlu mematerialisasi kredensial runtime hanya untuk
  mendeskripsikan konfigurasi.

Perilaku `inspectAccount(...)` yang direkomendasikan:

- Kembalikan hanya status akun yang deskriptif.
- Pertahankan `enabled` dan `configured`.
- Sertakan field sumber/status kredensial bila relevan, seperti:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Anda tidak perlu mengembalikan nilai token mentah hanya untuk melaporkan
  ketersediaan baca-saja. Mengembalikan `tokenStatus: "available"` (dan field sumber yang cocok) sudah cukup untuk command bergaya status.
- Gunakan `configured_unavailable` ketika sebuah kredensial dikonfigurasi melalui SecretRef tetapi
  tidak tersedia pada jalur command saat ini.

Ini memungkinkan command baca-saja melaporkan "configured but unavailable in this command
path" alih-alih crash atau salah melaporkan akun sebagai tidak dikonfigurasi.

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

Setiap entry menjadi sebuah plugin. Jika pack mencantumkan beberapa extension, plugin id
menjadi `name/<fileBase>`.

Jika plugin Anda mengimpor dependency npm, instal dependency tersebut di direktori itu agar
`node_modules` tersedia (`npm install` / `pnpm install`).

Guardrail keamanan: setiap entry `openclaw.extensions` harus tetap berada di dalam direktori plugin
setelah resolusi symlink. Entry yang keluar dari direktori package akan
ditolak.

Catatan keamanan: `openclaw plugins install` menginstal dependency plugin dengan
`npm install --omit=dev --ignore-scripts` (tanpa lifecycle script, tanpa dependency dev saat runtime). Pertahankan pohon dependency plugin tetap "pure JS/TS" dan hindari package yang memerlukan build `postinstall`.

Opsional: `openclaw.setupEntry` dapat menunjuk ke modul setup-only yang ringan.
Saat OpenClaw memerlukan surface setup untuk plugin channel yang dinonaktifkan, atau
saat plugin channel diaktifkan tetapi masih belum terkonfigurasi, OpenClaw memuat `setupEntry`
alih-alih entry plugin penuh. Ini membuat startup dan setup lebih ringan
ketika entry plugin utama Anda juga me-wiring tool, hook, atau kode
runtime-only lainnya.

Opsional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
dapat memilih sebuah plugin channel untuk menggunakan jalur `setupEntry` yang sama selama
fase startup pre-listen gateway, bahkan ketika channel sudah dikonfigurasi.

Gunakan ini hanya ketika `setupEntry` sepenuhnya mencakup surface startup yang harus ada
sebelum gateway mulai mendengarkan. Dalam praktiknya, itu berarti entry setup
harus mendaftarkan setiap kapabilitas milik channel yang dibutuhkan startup, seperti:

- registrasi channel itu sendiri
- setiap route HTTP yang harus tersedia sebelum gateway mulai mendengarkan
- setiap method gateway, tool, atau layanan yang harus ada selama jendela yang sama

Jika entry penuh Anda masih memiliki kapabilitas startup yang diperlukan, jangan aktifkan
flag ini. Pertahankan plugin pada perilaku default dan biarkan OpenClaw memuat entry
penuh selama startup.

Channel bundled juga dapat memublikasikan helper contract-surface khusus setup yang dapat
dikonsultasikan core sebelum runtime channel penuh dimuat. Surface promosi setup saat ini adalah:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core menggunakan surface itu ketika perlu mempromosikan config channel single-account lama
ke `channels.<id>.accounts.*` tanpa memuat entry plugin penuh.
Matrix adalah contoh bundled saat ini: plugin ini hanya memindahkan key auth/bootstrap ke
akun promoted bernama saat akun bernama sudah ada, dan dapat mempertahankan
key default-account non-kanonis yang sudah dikonfigurasi alih-alih selalu membuat
`accounts.default`.

Adapter patch setup tersebut menjaga discovery contract-surface bundled tetap lazy. Waktu impor tetap ringan; surface promosi hanya dimuat saat pertama kali digunakan alih-alih
masuk kembali ke startup channel bundled pada saat impor modul.

Saat surface startup tersebut mencakup method RPC gateway, simpan pada
prefix spesifik plugin. Namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu ter-resolve
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
petunjuk instalasi melalui `openclaw.install`. Ini menjaga data katalog core bebas data keras.

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
- `docsLabel`: override teks tautan untuk tautan dokumen
- `preferOver`: id plugin/channel prioritas lebih rendah yang seharusnya dikalahkan oleh entri katalog ini
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: kontrol salinan surface pemilihan
- `markdownCapable`: menandai channel sebagai mampu markdown untuk keputusan pemformatan outbound
- `showConfigured`: sembunyikan channel dari surface daftar channel terkonfigurasi ketika disetel ke `false`
- `quickstartAllowFrom`: memilih channel ini untuk alur `allowFrom` quickstart standar
- `forceAccountBinding`: wajibkan pengikatan akun eksplisit bahkan ketika hanya ada satu akun
- `preferSessionLookupForAnnounceTarget`: pilih lookup sesi saat meresolve target announce

OpenClaw juga dapat menggabungkan **katalog channel eksternal** (misalnya ekspor
registry MPM). Letakkan file JSON di salah satu lokasi berikut:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Atau arahkan `OPENCLAW_PLUGIN_CATALOG_PATHS` (atau `OPENCLAW_MPM_CATALOG_PATHS`) ke
satu atau lebih file JSON (dipisahkan dengan koma/titik koma/`PATH`). Setiap file harus
berisi `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Parser juga menerima `"packages"` atau `"plugins"` sebagai alias legacy untuk key `"entries"`.

## Plugin context engine

Plugin context engine memiliki orkestrasi konteks sesi untuk ingest, assembly,
dan compaction. Daftarkan dari plugin Anda dengan
`api.registerContextEngine(id, factory)`, lalu pilih engine aktif dengan
`plugins.slots.contextEngine`.

Gunakan ini saat plugin Anda perlu mengganti atau memperluas pipeline konteks default
alih-alih hanya menambahkan pencarian memory atau hook.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Jika engine Anda **tidak** memiliki algoritma compaction, tetap implementasikan `compact()`
dan delegasikan secara eksplisit:

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

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
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Menambahkan kapabilitas baru

Ketika sebuah plugin memerlukan perilaku yang tidak cocok dengan API saat ini, jangan melewati
sistem plugin dengan reach-in privat. Tambahkan kapabilitas yang hilang.

Urutan yang direkomendasikan:

1. definisikan kontrak core
   Putuskan perilaku bersama apa yang seharusnya dimiliki core: kebijakan, fallback, penggabungan config,
   lifecycle, semantik yang menghadap channel, dan bentuk helper runtime.
2. tambahkan surface registrasi/runtime plugin yang typed
   Perluas `OpenClawPluginApi` dan/atau `api.runtime` dengan surface kapabilitas typed
   paling kecil yang berguna.
3. hubungkan konsumen core + channel/fitur
   Channel dan plugin fitur sebaiknya mengonsumsi kapabilitas baru melalui core,
   bukan dengan mengimpor implementasi vendor secara langsung.
4. daftarkan implementasi vendor
   Plugin vendor kemudian mendaftarkan backend mereka terhadap kapabilitas tersebut.
5. tambahkan cakupan kontrak
   Tambahkan pengujian agar kepemilikan dan bentuk registrasi tetap eksplisit seiring waktu.

Begitulah OpenClaw tetap opinionated tanpa menjadi ter-hardcode pada satu
sudut pandang provider. Lihat [Capability Cookbook](/tools/capability-cookbook)
untuk daftar periksa file yang konkret dan contoh yang dikerjakan.

### Daftar periksa kapabilitas

Ketika Anda menambahkan kapabilitas baru, implementasi biasanya harus menyentuh
surface-surface ini secara bersama:

- tipe kontrak core di `src/<capability>/types.ts`
- helper runner/runtime core di `src/<capability>/runtime.ts`
- surface registrasi API plugin di `src/plugins/types.ts`
- wiring registry plugin di `src/plugins/registry.ts`
- eksposur runtime plugin di `src/plugins/runtime/*` ketika plugin fitur/channel
  perlu mengonsumsinya
- helper capture/test di `src/test-utils/plugin-registration.ts`
- asersi kepemilikan/kontrak di `src/plugins/contracts/registry.ts`
- dokumen operator/plugin di `docs/`

Jika salah satu surface itu tidak ada, biasanya itu adalah tanda bahwa kapabilitas tersebut
belum terintegrasi sepenuhnya.

### Template kapabilitas

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

Pola pengujian kontrak:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Ini menjaga aturannya tetap sederhana:

- core memiliki kontrak kapabilitas + orkestrasi
- plugin vendor memiliki implementasi vendor
- plugin fitur/channel mengonsumsi helper runtime
- pengujian kontrak menjaga kepemilikan tetap eksplisit
