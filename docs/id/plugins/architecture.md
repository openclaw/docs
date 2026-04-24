---
read_when:
    - Membangun atau men-debug plugin OpenClaw native
    - |-
      Memahami model kapabilitas plugin atau batas kepemilikan【อ่านข้อความเต็มanalysis to=final code=none  }),

      /final to=final code=none
    - Mengerjakan pipeline pemuatan atau registry plugin
    - Mengimplementasikan hook runtime provider atau plugin channel
sidebarTitle: Internals
summary: 'Internal plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal plugin
x-i18n:
    generated_at: "2026-04-24T09:18:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: d05891966669e599b1aa0165f20f913bfa82c22436356177436fba5d1be31e7b
    source_path: plugins/architecture.md
    workflow: 15
---

Ini adalah **referensi arsitektur mendalam** untuk sistem plugin OpenClaw. Untuk
panduan praktis, mulai dari salah satu halaman terfokus di bawah ini.

<CardGroup cols={2}>
  <Card title="Pasang dan gunakan plugin" icon="plug" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menambahkan, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Membangun plugin" icon="rocket" href="/id/plugins/building-plugins">
    Tutorial plugin pertama dengan manifest kerja terkecil.
  </Card>
  <Card title="Plugin channel" icon="comments" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin channel pesan.
  </Card>
  <Card title="Plugin provider" icon="microchip" href="/id/plugins/sdk-provider-plugins">
    Bangun plugin provider model.
  </Card>
  <Card title="Ikhtisar SDK" icon="book" href="/id/plugins/sdk-overview">
    Referensi import map dan API pendaftaran.
  </Card>
</CardGroup>

## Model kapabilitas publik

Kapabilitas adalah model **plugin native** publik di dalam OpenClaw. Setiap
plugin OpenClaw native mendaftar terhadap satu atau lebih tipe kapabilitas:

| Kapabilitas           | Metode pendaftaran                             | Contoh plugin                        |
| --------------------- | ---------------------------------------------- | ------------------------------------ |
| Inferensi teks        | `api.registerProvider(...)`                    | `openai`, `anthropic`                |
| Backend inferensi CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                |
| Speech                | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`            |
| Transkripsi realtime  | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| Suara realtime        | `api.registerRealtimeVoiceProvider(...)`       | `openai`                             |
| Pemahaman media       | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| Pembuatan gambar      | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Pembuatan musik       | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                  |
| Pembuatan video       | `api.registerVideoGenerationProvider(...)`     | `qwen`                               |
| Web fetch             | `api.registerWebFetchProvider(...)`            | `firecrawl`                          |
| Web search            | `api.registerWebSearchProvider(...)`           | `google`                             |
| Channel / pesan       | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |
| Discovery Gateway     | `api.registerGatewayDiscoveryService(...)`     | `bonjour`                            |

Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, alat, layanan discovery, atau background service adalah plugin **legacy hook-only**. Pola itu
masih didukung sepenuhnya.

### Sikap kompatibilitas eksternal

Model kapabilitas sudah masuk ke inti dan digunakan oleh plugin native/bawaan
saat ini, tetapi kompatibilitas plugin eksternal masih memerlukan standar yang lebih ketat daripada "ini diekspor, berarti dibekukan."

| Situasi plugin                                   | Panduan                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Plugin eksternal yang sudah ada                  | Pertahankan integrasi berbasis hook tetap berfungsi; ini adalah baseline kompatibilitas.          |
| Plugin native/bawaan baru                        | Utamakan pendaftaran kapabilitas eksplisit dibanding reach-in khusus vendor atau desain hook-only baru. |
| Plugin eksternal yang mengadopsi pendaftaran kapabilitas | Diizinkan, tetapi perlakukan surface helper khusus kapabilitas sebagai sesuatu yang masih berkembang kecuali dokumen menandainya stabil. |

Pendaftaran kapabilitas adalah arah yang dimaksudkan. Hook lama tetap menjadi
jalur paling aman tanpa pemutusan untuk plugin eksternal selama transisi. Subpath helper yang diekspor tidak semuanya setara — utamakan kontrak terdokumentasi yang sempit dibanding ekspor helper insidental.

### Bentuk plugin

OpenClaw mengklasifikasikan setiap plugin yang dimuat ke dalam bentuk berdasarkan perilaku
pendaftaran aktualnya (bukan hanya metadata statis):

- **plain-capability**: mendaftarkan tepat satu tipe kapabilitas (misalnya plugin
  hanya-provider seperti `mistral`).
- **hybrid-capability**: mendaftarkan beberapa tipe kapabilitas (misalnya
  `openai` memiliki inferensi teks, speech, pemahaman media, dan pembuatan
  gambar).
- **hook-only**: hanya mendaftarkan hook (typed atau custom), tanpa kapabilitas,
  alat, perintah, atau layanan.
- **non-capability**: mendaftarkan alat, perintah, layanan, atau route tetapi tidak ada
  kapabilitas.

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin dan rincian
kapabilitasnya. Lihat [referensi CLI](/id/cli/plugins#inspect) untuk detail.

### Hook lama

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk
plugin hook-only. Plugin nyata lama masih bergantung padanya.

Arah:

- pertahankan agar tetap berfungsi
- dokumentasikan sebagai lama
- utamakan `before_model_resolve` untuk pekerjaan override model/provider
- utamakan `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata turun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`, Anda mungkin melihat
salah satu label berikut:

| Sinyal                     | Arti                                                       |
| -------------------------- | ---------------------------------------------------------- |
| **config valid**           | Config berhasil di-parse dan plugin berhasil di-resolve    |
| **compatibility advisory** | Plugin menggunakan pola yang didukung tetapi lebih lama (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah usang  |
| **hard error**             | Config tidak valid atau plugin gagal dimuat                |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak plugin Anda hari ini:
`hook-only` bersifat advisory, dan `before_agent_start` hanya memicu peringatan. Sinyal-sinyal ini juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Ikhtisar arsitektur

Sistem plugin OpenClaw memiliki empat lapisan:

1. **Manifest + discovery**
   OpenClaw menemukan plugin kandidat dari path yang dikonfigurasi, root workspace,
   root plugin global, dan plugin bawaan. Discovery membaca
   manifest native `openclaw.plugin.json` plus manifest bundle yang didukung terlebih dahulu.
2. **Enablement + validation**
   Inti memutuskan apakah plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau
   dipilih untuk slot eksklusif seperti memori.
3. **Runtime loading**
   Plugin OpenClaw native dimuat in-process melalui jiti dan mendaftarkan
   kapabilitas ke registry pusat. Bundle yang kompatibel dinormalisasi menjadi
   catatan registry tanpa mengimpor kode runtime.
4. **Surface consumption**
   Sisa OpenClaw membaca registry untuk mengekspos alat, channel, penyiapan provider,
   hook, route HTTP, perintah CLI, dan layanan.

Khusus untuk CLI plugin, discovery perintah root dibagi dalam dua fase:

- metadata saat parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI plugin yang sebenarnya dapat tetap lazy dan mendaftar pada pemanggilan pertama

Itu menjaga kode CLI milik plugin tetap berada di dalam plugin sambil tetap memungkinkan OpenClaw
mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- discovery + validasi config seharusnya bekerja dari metadata **manifest/schema**
  tanpa mengeksekusi kode plugin
- perilaku runtime native berasal dari path `register(api)` modul plugin

Pemisahan itu memungkinkan OpenClaw memvalidasi config, menjelaskan plugin yang
hilang/dinonaktifkan, dan membangun petunjuk UI/schema sebelum runtime penuh aktif.

### Perencanaan aktivasi

Perencanaan aktivasi adalah bagian dari control plane. Pemanggil dapat bertanya plugin
mana yang relevan untuk perintah konkret, provider, channel, route, harness agen, atau
kapabilitas sebelum memuat registry runtime yang lebih luas.

Planner menjaga perilaku manifest saat ini tetap kompatibel:

- field `activation.*` adalah petunjuk planner eksplisit
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools`, dan hook tetap menjadi fallback kepemilikan manifest
- API planner yang hanya-id tetap tersedia untuk pemanggil yang ada
- API plan melaporkan label alasan sehingga diagnostik dapat membedakan petunjuk eksplisit dari fallback kepemilikan

Jangan perlakukan `activation` sebagai hook siklus hidup atau pengganti
`register(...)`. `activation` adalah metadata yang digunakan untuk mempersempit pemuatan. Utamakan field kepemilikan
ketika field-field tersebut sudah menjelaskan hubungan; gunakan `activation` hanya untuk petunjuk planner tambahan.

### Plugin channel dan alat message bersama

Plugin channel tidak perlu mendaftarkan alat kirim/edit/react terpisah untuk
aksi chat normal. OpenClaw mempertahankan satu alat `message` bersama di inti, dan
plugin channel memiliki discovery dan eksekusi khusus channel di baliknya.

Batas saat ini adalah:

- inti memiliki host alat `message` bersama, prompt wiring, pembukuan sesi/thread,
  dan dispatch eksekusi
- plugin channel memiliki discovery action yang dibatasi, discovery kapabilitas, dan fragment skema khusus channel
- plugin channel memiliki grammar percakapan sesi khusus provider, seperti
  bagaimana conversation id mengodekan thread id atau mewarisi dari parent conversation
- plugin channel mengeksekusi action final melalui action adapter mereka

Untuk plugin channel, surface SDK-nya adalah
`ChannelMessageActionAdapter.describeMessageTool(...)`. Pemanggilan discovery terpadu itu memungkinkan plugin mengembalikan action yang terlihat, kapabilitas, dan kontribusi skema
secara bersama sehingga bagian-bagian itu tidak saling menyimpang.

Ketika param alat message khusus channel membawa sumber media seperti path lokal atau URL media remote, plugin juga harus mengembalikan
`mediaSourceParams` dari `describeMessageTool(...)`. Inti menggunakan daftar eksplisit itu untuk menerapkan normalisasi path sandbox dan petunjuk akses media keluar
tanpa melakukan hardcode nama param milik plugin.
Utamakan peta yang dibatasi action di sana, bukan satu daftar datar untuk seluruh channel, sehingga param media yang hanya untuk profile tidak dinormalisasi pada action yang tidak terkait seperti
`send`.

Inti meneruskan cakupan runtime ke langkah discovery itu. Field penting mencakup:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` masuk tepercaya

Ini penting untuk plugin yang peka konteks. Sebuah channel dapat menyembunyikan atau mengekspos
action message berdasarkan akun aktif, room/thread/message saat ini, atau identitas peminta tepercaya tanpa melakukan hardcode cabang khusus channel di alat `message` inti.

Inilah sebabnya perubahan perutean embedded-runner tetap merupakan pekerjaan plugin: runner bertanggung jawab meneruskan identitas chat/sesi saat ini ke batas discovery plugin sehingga alat `message` bersama mengekspos surface milik channel yang tepat untuk giliran saat ini.

Untuk helper eksekusi milik channel, plugin bawaan sebaiknya mempertahankan runtime eksekusi
di dalam modul extension mereka sendiri. Inti tidak lagi memiliki runtime message-action Discord,
Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`.
Kami tidak memublikasikan subpath `plugin-sdk/*-action-runtime` terpisah, dan plugin bawaan
sebaiknya mengimpor kode runtime lokal mereka sendiri langsung dari modul
milik extension mereka.

Batas yang sama berlaku untuk seam SDK bernama-provider secara umum: inti seharusnya
tidak mengimpor convenience barrel khusus channel untuk Slack, Discord, Signal,
WhatsApp, atau extension serupa. Jika inti membutuhkan suatu perilaku, inti harus
mengonsumsi barrel `api.ts` / `runtime-api.ts` milik plugin bawaan itu sendiri atau
menaikkan kebutuhan itu menjadi kapabilitas generik sempit di SDK bersama.

Khusus untuk poll, ada dua jalur eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk channel yang cocok dengan
  model poll umum
- `actions.handleAction("poll")` adalah jalur yang diutamakan untuk semantik
  poll khusus channel atau parameter poll tambahan

Inti kini menunda parsing poll bersama sampai setelah dispatch poll plugin menolak
action tersebut, sehingga handler poll milik plugin dapat menerima field poll khusus channel tanpa diblokir lebih dulu oleh parser poll generik.

Lihat [internal arsitektur plugin](/id/plugins/architecture-internals) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan plugin native sebagai batas kepemilikan untuk sebuah **perusahaan** atau sebuah
**fitur**, bukan sebagai kumpulan integrasi tak terkait.

Artinya:

- plugin perusahaan biasanya sebaiknya memiliki semua surface OpenClaw yang
  menghadap perusahaan tersebut
- plugin fitur biasanya sebaiknya memiliki seluruh surface fitur yang diperkenalkannya
- channel sebaiknya mengonsumsi kapabilitas inti bersama alih-alih mengimplementasikan ulang
  perilaku provider secara ad hoc

<Accordion title="Contoh pola kepemilikan di seluruh plugin bawaan">
  - **Vendor multi-kapabilitas**: `openai` memiliki inferensi teks, speech, realtime
    voice, pemahaman media, dan pembuatan gambar. `google` memiliki inferensi teks
    plus pemahaman media, pembuatan gambar, dan web search.
    `qwen` memiliki inferensi teks plus pemahaman media dan pembuatan video.
  - **Vendor satu kapabilitas**: `elevenlabs` dan `microsoft` memiliki speech;
    `firecrawl` memiliki web-fetch; `minimax` / `mistral` / `moonshot` / `zai` memiliki
    backend pemahaman media.
  - **Plugin fitur**: `voice-call` memiliki transport panggilan, alat, CLI, route,
    dan bridging media-stream Twilio, tetapi mengonsumsi kapabilitas speech, realtime
    transcription, dan realtime voice bersama alih-alih mengimpor plugin vendor secara langsung.
</Accordion>

Keadaan akhir yang dimaksud adalah:

- OpenAI hidup dalam satu plugin meskipun mencakup model teks, speech, gambar, dan
  video di masa depan
- vendor lain dapat melakukan hal yang sama untuk area surface miliknya sendiri
- channel tidak peduli plugin vendor mana yang memiliki provider; channel mengonsumsi
  kontrak kapabilitas bersama yang diekspos oleh inti

Inilah perbedaan utamanya:

- **plugin** = batas kepemilikan
- **kapabilitas** = kontrak inti yang dapat diimplementasikan atau dikonsumsi oleh beberapa plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama
bukanlah "provider mana yang seharusnya melakukan hardcode penanganan video?" Pertanyaan pertama adalah "apa kontrak kapabilitas video di inti?" Setelah kontrak itu ada, plugin vendor
dapat mendaftar terhadapnya dan plugin channel/fitur dapat mengonsumsinya.

Jika kapabilitas itu belum ada, langkah yang benar biasanya adalah:

1. definisikan kapabilitas yang belum ada di inti
2. ekspos melalui API/runtime plugin secara typed
3. hubungkan channel/fitur terhadap kapabilitas itu
4. biarkan plugin vendor mendaftarkan implementasi

Ini menjaga kepemilikan tetap eksplisit sambil menghindari perilaku inti yang bergantung pada
satu vendor atau jalur kode khusus plugin sekali pakai.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan tempat suatu kode harus berada:

- **lapisan kapabilitas inti**: orkestrasi bersama, kebijakan, fallback, aturan
  penggabungan config, semantik pengiriman, dan kontrak typed
- **lapisan plugin vendor**: API khusus vendor, auth, katalog model, sintesis speech,
  pembuatan gambar, backend video masa depan, endpoint penggunaan
- **lapisan plugin channel/fitur**: integrasi Slack/Discord/voice-call/dll.
  yang mengonsumsi kapabilitas inti dan menampilkannya pada suatu surface

Contohnya, TTS mengikuti bentuk ini:

- inti memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan pengiriman channel
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` mengonsumsi helper runtime TTS telephony

Pola yang sama sebaiknya diutamakan untuk kapabilitas di masa depan.

### Contoh plugin perusahaan multi-kapabilitas

Plugin perusahaan seharusnya terasa kohesif dari luar. Jika OpenClaw memiliki
kontrak bersama untuk model, speech, realtime transcription, realtime voice, pemahaman
media, pembuatan gambar, pembuatan video, web fetch, dan web search,
vendor dapat memiliki semua surface-nya di satu tempat:

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
      // config speech vendor — implementasikan interface SpeechProviderPlugin secara langsung
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
        // logika credential + fetch
      }),
    );
  },
};

export default plugin;
```

Yang penting bukan nama helper yang persis. Bentuknya yang penting:

- satu plugin memiliki surface vendor
- inti tetap memiliki kontrak kapabilitas
- channel dan plugin fitur mengonsumsi helper `api.runtime.*`, bukan kode vendor
- contract test dapat menegaskan bahwa plugin mendaftarkan kapabilitas yang
  diklaim dimilikinya

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu kapabilitas
bersama. Model kepemilikan yang sama berlaku di sana:

1. inti mendefinisikan kontrak pemahaman media
2. plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan
   `describeVideo` jika berlaku
3. channel dan plugin fitur mengonsumsi perilaku inti bersama alih-alih
   terhubung langsung ke kode vendor

Ini menghindari menanamkan asumsi video satu provider ke inti. Plugin memiliki
surface vendor; inti memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: inti memiliki kontrak
kapabilitas typed dan helper runtime, dan plugin vendor mendaftarkan
implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh checklist rollout yang konkret? Lihat
[Capability Cookbook](/id/plugins/architecture).

## Kontrak dan penegakan

Surface API plugin sengaja dibuat typed dan dipusatkan di
`OpenClawPluginApi`. Kontrak itu mendefinisikan titik pendaftaran yang didukung dan
helper runtime yang boleh diandalkan oleh plugin.

Mengapa ini penting:

- penulis plugin mendapatkan satu standar internal yang stabil
- inti dapat menolak kepemilikan ganda seperti dua plugin yang mendaftarkan provider id yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk pendaftaran yang salah bentuk
- contract test dapat menegakkan kepemilikan plugin bawaan dan mencegah drift diam-diam

Ada dua lapisan penegakan:

1. **penegakan pendaftaran runtime**
   Registry plugin memvalidasi pendaftaran saat plugin dimuat. Contoh:
   provider id duplikat, speech provider id duplikat, dan pendaftaran yang salah bentuk menghasilkan diagnostik plugin alih-alih perilaku yang tidak terdefinisi.
2. **contract test**
   Plugin bawaan ditangkap dalam registry kontrak selama run test sehingga
   OpenClaw dapat menegaskan kepemilikan secara eksplisit. Saat ini hal ini digunakan untuk model
   provider, speech provider, web search provider, dan kepemilikan pendaftaran bawaan.

Efek praktisnya adalah OpenClaw mengetahui, sejak awal, plugin mana yang memiliki surface mana.
Itu memungkinkan inti dan channel tersusun mulus karena kepemilikan
dideklarasikan, typed, dan dapat diuji alih-alih implisit.

### Apa yang termasuk dalam kontrak

Kontrak plugin yang baik adalah:

- typed
- kecil
- spesifik kapabilitas
- dimiliki oleh inti
- dapat digunakan kembali oleh beberapa plugin
- dapat dikonsumsi oleh channel/fitur tanpa pengetahuan vendor

Kontrak plugin yang buruk adalah:

- kebijakan khusus vendor yang disembunyikan di inti
- jalur keluar plugin sekali pakai yang melewati registry
- kode channel yang langsung menjangkau implementasi vendor
- objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau
  `api.runtime`

Jika ragu, naikkan tingkat abstraksinya: definisikan kapabilitasnya terlebih dahulu, lalu
biarkan plugin masuk ke dalamnya.

## Model eksekusi

Plugin OpenClaw native berjalan **in-process** bersama Gateway. Plugin ini tidak
di-sandbox. Plugin native yang dimuat memiliki batas kepercayaan setingkat proses yang sama dengan
kode inti.

Implikasi:

- plugin native dapat mendaftarkan alat, network handler, hook, dan layanan
- bug plugin native dapat merusak atau membuat gateway tidak stabil
- plugin native yang berbahaya setara dengan eksekusi kode arbitrer di dalam
  proses OpenClaw

Bundle yang kompatibel lebih aman secara default karena OpenClaw saat ini memperlakukannya
sebagai metadata/content pack. Dalam rilis saat ini, itu sebagian besar berarti
Skills bawaan.

Gunakan allowlist dan path install/load eksplisit untuk plugin yang bukan bawaan.
Perlakukan plugin workspace sebagai kode saat pengembangan, bukan default produksi.

Untuk nama paket workspace bawaan, pertahankan id plugin tetap tertambat pada nama npm:
`@openclaw/<id>` secara default, atau sufiks typed yang disetujui seperti
`-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` ketika
paket tersebut sengaja mengekspos peran plugin yang lebih sempit.

Catatan kepercayaan penting:

- `plugins.allow` mempercayai **id plugin**, bukan provenance sumber.
- Plugin workspace dengan id yang sama seperti plugin bawaan sengaja membayangi
  salinan bawaan ketika plugin workspace itu diaktifkan/masuk allowlist.
- Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix.
- Kepercayaan plugin bawaan di-resolve dari snapshot sumber — manifest dan
  kode di disk saat dimuat — bukan dari metadata instalasi. Catatan instalasi
  yang rusak atau diganti tidak dapat secara diam-diam memperluas surface kepercayaan plugin bawaan
  melampaui apa yang diklaim oleh sumber sebenarnya.

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan kemudahan implementasi.

Pertahankan pendaftaran kapabilitas tetap publik. Pangkas ekspor helper non-kontrak:

- subpath helper khusus plugin bawaan
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper kenyamanan khusus vendor
- helper penyiapan/onboarding yang merupakan detail implementasi

Beberapa subpath helper plugin bawaan masih tetap ada di generated SDK export
map untuk kompatibilitas dan pemeliharaan plugin bawaan. Contoh saat ini mencakup
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, dan beberapa seam `plugin-sdk/matrix*`. Perlakukan itu sebagai ekspor detail implementasi yang dicadangkan, bukan sebagai pola SDK yang direkomendasikan untuk
plugin pihak ketiga baru.

## Internal dan referensi

Untuk pipeline pemuatan, model registry, hook runtime provider, route HTTP Gateway,
skema alat message, resolusi target channel, katalog provider,
plugin context engine, dan panduan menambahkan kapabilitas baru, lihat
[internal arsitektur plugin](/id/plugins/architecture-internals).

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Manifest Plugin](/id/plugins/manifest)
