---
read_when:
    - Membangun atau men-debug Plugin OpenClaw native
    - Memahami model kapabilitas Plugin atau batas ownership
    - Mengerjakan pipeline pemuatan Plugin atau registry
    - Mengimplementasikan hook runtime provider atau Plugin channel
sidebarTitle: Internals
summary: 'Internal Plugin: model kapabilitas, ownership, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:34:17Z"
  model: gpt-5.4
  provider: openai
  source_hash: 16664d284a8bfbfcb9914bb012d1f36dfdd60406636d6bf4b011f76e886cb518
  source_path: plugins/architecture.md
  workflow: 15
---

Ini adalah **referensi arsitektur mendalam** untuk sistem Plugin OpenClaw. Untuk panduan praktis, mulai dari salah satu halaman terfokus di bawah ini.

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menambahkan, mengaktifkan, dan men-debug Plugin.
  </Card>
  <Card title="Building plugins" icon="rocket" href="/id/plugins/building-plugins">
    Tutorial Plugin pertama dengan manifest kerja terkecil.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/id/plugins/sdk-channel-plugins">
    Bangun Plugin channel pesan.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/id/plugins/sdk-provider-plugins">
    Bangun Plugin provider model.
  </Card>
  <Card title="SDK overview" icon="book" href="/id/plugins/sdk-overview">
    Referensi peta impor dan API pendaftaran.
  </Card>
</CardGroup>

## Model kapabilitas publik

Kapabilitas adalah model **Plugin native** publik di dalam OpenClaw. Setiap Plugin native OpenClaw mendaftar terhadap satu atau lebih jenis kapabilitas:

| Kapabilitas           | Metode pendaftaran                               | Contoh Plugin                        |
| --------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferensi teks        | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend inferensi CLI | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Ucapan                | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkripsi realtime  | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Suara realtime        | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Pemahaman media       | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Pembuatan gambar      | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Pembuatan musik       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Pembuatan video       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web fetch             | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pencarian web         | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / pesan       | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Discovery Gateway     | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, tool, layanan discovery, atau layanan latar belakang adalah Plugin **hook-only lama**. Pola itu masih sepenuhnya didukung.
</Note>

### Sikap kompatibilitas eksternal

Model kapabilitas sudah masuk ke core dan digunakan oleh Plugin bawaan/native saat ini, tetapi kompatibilitas Plugin eksternal masih memerlukan batas yang lebih ketat daripada "kalau diekspor, berarti dibekukan."

| Situasi Plugin                                   | Panduan                                                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Plugin eksternal yang sudah ada                  | Pertahankan integrasi berbasis hook tetap berfungsi; ini adalah baseline kompatibilitas.         |
| Plugin bawaan/native baru                        | Pilih pendaftaran kapabilitas eksplisit daripada reach-in khusus vendor atau desain hook-only baru. |
| Plugin eksternal yang mengadopsi pendaftaran kapabilitas | Diizinkan, tetapi perlakukan surface helper khusus kapabilitas sebagai sesuatu yang berkembang kecuali dokumentasi menandainya stabil. |

Pendaftaran kapabilitas adalah arah yang dimaksudkan. Hook lama tetap menjadi jalur teraman tanpa risiko kerusakan untuk Plugin eksternal selama masa transisi. Subpath helper yang diekspor tidak semuanya setara — pilih kontrak sempit yang terdokumentasi daripada ekspor helper yang kebetulan ada.

### Bentuk Plugin

OpenClaw mengklasifikasikan setiap Plugin yang dimuat ke dalam suatu bentuk berdasarkan perilaku pendaftaran nyatanya (bukan hanya metadata statis):

<AccordionGroup>
  <Accordion title="plain-capability">
    Mendaftarkan tepat satu jenis kapabilitas (misalnya Plugin khusus provider seperti `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Mendaftarkan beberapa jenis kapabilitas (misalnya `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan gambar).
  </Accordion>
  <Accordion title="hook-only">
    Hanya mendaftarkan hook (typed atau custom), tanpa kapabilitas, tool, perintah, atau layanan.
  </Accordion>
  <Accordion title="non-capability">
    Mendaftarkan tool, perintah, layanan, atau route tetapi tanpa kapabilitas.
  </Accordion>
</AccordionGroup>

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk Plugin dan rincian kapabilitasnya. Lihat [Referensi CLI](/id/cli/plugins#inspect) untuk detailnya.

### Hook lama

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk Plugin hook-only. Plugin nyata lama masih bergantung padanya.

Arah ke depan:

- tetap buat ia berfungsi
- dokumentasikan sebagai lama
- pilih `before_model_resolve` untuk pekerjaan override model/provider
- pilih `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`, Anda mungkin melihat salah satu label ini:

| Sinyal                     | Arti                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config ter-parse dengan baik dan Plugin ter-resolve          |
| **compatibility advisory** | Plugin menggunakan pola yang didukung tetapi lebih lama (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated |
| **hard error**             | Config tidak valid atau Plugin gagal dimuat                  |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak Plugin Anda saat ini: `hook-only` hanya bersifat advisory, dan `before_agent_start` hanya memicu peringatan. Sinyal ini juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Gambaran umum arsitektur

Sistem Plugin OpenClaw memiliki empat lapisan:

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw menemukan kandidat Plugin dari path yang dikonfigurasi, root workspace, root Plugin global, dan Plugin bawaan. Discovery membaca manifest native `openclaw.plugin.json` ditambah manifest bundle yang didukung terlebih dahulu.
  </Step>
  <Step title="Enablement + validation">
    Core memutuskan apakah Plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau dipilih untuk slot eksklusif seperti memori.
  </Step>
  <Step title="Runtime loading">
    Plugin native OpenClaw dimuat in-process melalui jiti dan mendaftarkan kapabilitas ke registry pusat. Bundle yang kompatibel dinormalisasi ke record registry tanpa mengimpor kode runtime.
  </Step>
  <Step title="Surface consumption">
    Bagian lain dari OpenClaw membaca registry untuk mengekspos tool, channel, penyiapan provider, hook, route HTTP, perintah CLI, dan layanan.
  </Step>
</Steps>

Khusus untuk CLI Plugin, discovery perintah root dibagi menjadi dua fase:

- metadata saat parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI Plugin yang sebenarnya dapat tetap lazy dan mendaftar saat pemanggilan pertama

Itu menjaga kode CLI milik Plugin tetap berada di dalam Plugin sambil tetap memungkinkan OpenClaw mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- validasi manifest/config harus bekerja dari **metadata manifest/schema** tanpa mengeksekusi kode Plugin
- discovery kapabilitas native dapat memuat kode entri Plugin tepercaya untuk membangun snapshot registry yang tidak mengaktifkan
- perilaku runtime native berasal dari jalur `register(api)` milik modul Plugin dengan `api.registrationMode === "full"`

Pemisahan itu memungkinkan OpenClaw memvalidasi config, menjelaskan Plugin yang hilang/dinonaktifkan, dan membangun petunjuk UI/schema sebelum runtime penuh aktif.

### Perencanaan aktivasi

Perencanaan aktivasi adalah bagian dari control plane. Pemanggil dapat menanyakan Plugin mana yang relevan untuk perintah konkret, provider, channel, route, harness agen, atau kapabilitas sebelum memuat registry runtime yang lebih luas.

Planner menjaga perilaku manifest saat ini tetap kompatibel:

- field `activation.*` adalah petunjuk planner eksplisit
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, dan hook tetap menjadi fallback ownership manifest
- API planner khusus-id tetap tersedia untuk pemanggil yang ada
- API plan melaporkan label reason sehingga diagnostik dapat membedakan petunjuk eksplisit dari fallback ownership

<Warning>
Jangan perlakukan `activation` sebagai hook lifecycle atau pengganti `register(...)`. Ini adalah metadata yang digunakan untuk mempersempit pemuatan. Pilih field ownership ketika field itu sudah menggambarkan hubungan tersebut; gunakan `activation` hanya untuk petunjuk planner tambahan.
</Warning>

### Plugin channel dan tool pesan bersama

Plugin channel tidak perlu mendaftarkan tool kirim/edit/react terpisah untuk aksi chat normal. OpenClaw mempertahankan satu tool `message` bersama di core, dan Plugin channel memiliki discovery serta eksekusi khusus channel di baliknya.

Batas saat ini adalah:

- core memiliki host tool `message` bersama, wiring prompt, pembukuan sesi/thread, dan dispatch eksekusi
- Plugin channel memiliki discovery aksi yang dicakup, discovery kapabilitas, dan fragmen schema khusus channel apa pun
- Plugin channel memiliki grammar percakapan sesi khusus provider, seperti bagaimana ID percakapan mengenkode ID thread atau mewarisi dari percakapan induk
- Plugin channel mengeksekusi aksi final melalui adapter aksinya

Untuk Plugin channel, surface SDK-nya adalah `ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan discovery terpadu itu memungkinkan Plugin mengembalikan aksi yang terlihat, kapabilitas, dan kontribusi schema secara bersamaan agar bagian-bagian itu tidak saling melenceng.

Saat param tool pesan khusus channel membawa sumber media seperti path lokal atau URL media remote, Plugin juga harus mengembalikan `mediaSourceParams` dari `describeMessageTool(...)`. Core menggunakan daftar eksplisit itu untuk menerapkan normalisasi path sandbox dan petunjuk akses media keluar tanpa meng-hardcode nama param milik Plugin. Pilih peta yang dicakup per aksi di sana, bukan satu daftar datar per channel, sehingga param media khusus profil tidak dinormalisasi pada aksi yang tidak terkait seperti `send`.

Core meneruskan cakupan runtime ke langkah discovery itu. Field penting meliputi:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` masuk tepercaya

Ini penting untuk Plugin yang peka konteks. Sebuah channel dapat menyembunyikan atau mengekspos aksi pesan berdasarkan akun aktif, room/thread/pesan saat ini, atau identitas peminta tepercaya tanpa meng-hardcode cabang khusus channel di tool `message` milik core.

Inilah mengapa perubahan routing embedded-runner tetap merupakan pekerjaan Plugin: runner bertanggung jawab untuk meneruskan identitas chat/sesi saat ini ke batas discovery Plugin sehingga tool `message` bersama mengekspos surface milik channel yang benar untuk giliran saat ini.

Untuk helper eksekusi milik channel, Plugin bawaan harus menjaga runtime eksekusi tetap di dalam modul extension miliknya sendiri. Core tidak lagi memiliki runtime aksi pesan Discord, Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`. Kami tidak menerbitkan subpath `plugin-sdk/*-action-runtime` terpisah, dan Plugin bawaan harus mengimpor kode runtime lokal mereka sendiri langsung dari modul milik extension mereka.

Batas yang sama juga berlaku untuk seam SDK bernama provider secara umum: core tidak boleh mengimpor barrel kemudahan khusus channel untuk extension Slack, Discord, Signal, WhatsApp, atau yang serupa. Jika core memerlukan suatu perilaku, konsumsi barrel `api.ts` / `runtime-api.ts` milik Plugin bawaan itu sendiri atau angkat kebutuhan itu menjadi kapabilitas generik yang sempit di SDK bersama.

Khusus untuk poll, ada dua jalur eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk channel yang cocok dengan model poll umum
- `actions.handleAction("poll")` adalah jalur yang diutamakan untuk semantik poll khusus channel atau parameter poll tambahan

Core sekarang menunda parsing poll bersama sampai setelah dispatch poll Plugin menolak aksi tersebut, sehingga handler poll milik Plugin dapat menerima field poll khusus channel tanpa diblokir lebih dulu oleh parser poll generik.

Lihat [Plugin architecture internals](/id/plugins/architecture-internals) untuk urutan startup lengkap.

## Model ownership kapabilitas

OpenClaw memperlakukan Plugin native sebagai batas ownership untuk **perusahaan** atau **fitur**, bukan sebagai kumpulan integrasi tak terkait.

Artinya:

- sebuah Plugin perusahaan biasanya harus memiliki semua surface OpenClaw-facing milik perusahaan itu
- sebuah Plugin fitur biasanya harus memiliki seluruh surface fitur yang diperkenalkannya
- channel harus mengonsumsi kapabilitas core bersama alih-alih mengimplementasikan ulang perilaku provider secara ad hoc

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` memiliki inferensi teks, ucapan, suara realtime, pemahaman media, dan pembuatan gambar. `google` memiliki inferensi teks plus pemahaman media, pembuatan gambar, dan pencarian web. `qwen` memiliki inferensi teks plus pemahaman media dan pembuatan video.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` dan `microsoft` memiliki ucapan; `firecrawl` memiliki web-fetch; `minimax` / `mistral` / `moonshot` / `zai` memiliki backend pemahaman media.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` memiliki transport panggilan, tool, CLI, route, dan bridging media-stream Twilio, tetapi mengonsumsi kapabilitas ucapan bersama, transkripsi realtime, dan suara realtime alih-alih mengimpor Plugin vendor secara langsung.
  </Accordion>
</AccordionGroup>

Keadaan akhir yang dimaksud adalah:

- OpenAI berada di satu Plugin meskipun mencakup model teks, ucapan, gambar, dan video di masa depan
- vendor lain dapat melakukan hal yang sama untuk area surface miliknya sendiri
- channel tidak peduli Plugin vendor mana yang memiliki provider; mereka mengonsumsi kontrak kapabilitas bersama yang diekspos oleh core

Inilah perbedaan kuncinya:

- **plugin** = batas ownership
- **capability** = kontrak core yang dapat diimplementasikan atau dikonsumsi oleh banyak Plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama bukan "provider mana yang harus meng-hardcode penanganan video?" Pertanyaan pertama adalah "apa kontrak kapabilitas video di core?" Setelah kontrak itu ada, Plugin vendor dapat mendaftar terhadapnya dan Plugin channel/fitur dapat mengonsumsinya.

Jika kapabilitas itu belum ada, langkah yang benar biasanya:

<Steps>
  <Step title="Define the capability">
    Definisikan kapabilitas yang hilang di core.
  </Step>
  <Step title="Expose through the SDK">
    Ekspos kapabilitas itu melalui API/runtime Plugin secara typed.
  </Step>
  <Step title="Wire consumers">
    Hubungkan channel/fitur ke kapabilitas itu.
  </Step>
  <Step title="Vendor implementations">
    Biarkan Plugin vendor mendaftarkan implementasinya.
  </Step>
</Steps>

Ini menjaga ownership tetap eksplisit sambil menghindari perilaku core yang bergantung pada satu vendor atau satu jalur kode khusus Plugin.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan di mana kode seharusnya berada:

<Tabs>
  <Tab title="Lapisan kapabilitas core">
    Orkestrasi bersama, kebijakan, fallback, aturan merge config, semantik pengiriman, dan kontrak typed.
  </Tab>
  <Tab title="Lapisan Plugin vendor">
    API khusus vendor, auth, katalog model, sintesis ucapan, pembuatan gambar, backend video di masa depan, endpoint penggunaan.
  </Tab>
  <Tab title="Lapisan Plugin channel/fitur">
    Integrasi Slack/Discord/voice-call/dll. yang mengonsumsi kapabilitas core dan menyajikannya pada suatu surface.
  </Tab>
</Tabs>

Misalnya, TTS mengikuti bentuk ini:

- core memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan pengiriman channel
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` mengonsumsi helper runtime TTS telephony

Pola yang sama sebaiknya dipilih untuk kapabilitas di masa depan.

### Contoh Plugin perusahaan multi-kapabilitas

Plugin perusahaan harus terasa kohesif dari luar. Jika OpenClaw memiliki kontrak bersama untuk model, ucapan, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan video, web fetch, dan pencarian web, vendor dapat memiliki semua surface-nya di satu tempat:

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
      // config ucapan vendor — implementasikan interface SpeechProviderPlugin secara langsung
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
        // logika kredensial + fetch
      }),
    );
  },
};

export default plugin;
```

Yang penting bukan nama helper yang persis. Bentuknya yang penting:

- satu Plugin memiliki surface vendor
- core tetap memiliki kontrak kapabilitas
- channel dan Plugin fitur mengonsumsi helper `api.runtime.*`, bukan kode vendor
- pengujian kontrak dapat memastikan bahwa Plugin mendaftarkan kapabilitas yang diklaim dimilikinya

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu kapabilitas bersama. Model ownership yang sama berlaku di sana:

<Steps>
  <Step title="Core defines the contract">
    Core mendefinisikan kontrak pemahaman media.
  </Step>
  <Step title="Vendor plugins register">
    Plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan `describeVideo` sesuai kebutuhan.
  </Step>
  <Step title="Consumers use the shared behavior">
    Channel dan Plugin fitur mengonsumsi perilaku core bersama alih-alih melakukan wiring langsung ke kode vendor.
  </Step>
</Steps>

Ini menghindari asumsi video dari satu provider tertanam di core. Plugin memiliki surface vendor; core memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak kapabilitas typed dan helper runtime, dan Plugin vendor mendaftarkan implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh checklist rollout konkret? Lihat [Capability Cookbook](/id/plugins/architecture).

## Kontrak dan penegakan

Surface API Plugin sengaja dibuat typed dan terpusat di `OpenClawPluginApi`. Kontrak itu mendefinisikan titik pendaftaran yang didukung dan helper runtime yang boleh diandalkan oleh sebuah Plugin.

Mengapa ini penting:

- penulis Plugin mendapatkan satu standar internal yang stabil
- core dapat menolak ownership ganda seperti dua Plugin yang mendaftarkan provider id yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk pendaftaran yang malformed
- pengujian kontrak dapat menegakkan ownership Plugin bawaan dan mencegah drift diam-diam

Ada dua lapisan penegakan:

<AccordionGroup>
  <Accordion title="Penegakan pendaftaran runtime">
    Registry Plugin memvalidasi pendaftaran saat Plugin dimuat. Contoh: duplicate provider id, duplicate speech provider id, dan pendaftaran malformed menghasilkan diagnostik Plugin alih-alih perilaku yang tidak terdefinisi.
  </Accordion>
  <Accordion title="Pengujian kontrak">
    Plugin bawaan ditangkap dalam registry kontrak selama pengujian berlangsung sehingga OpenClaw dapat menegaskan ownership secara eksplisit. Saat ini ini digunakan untuk model provider, speech provider, web search provider, dan ownership pendaftaran bawaan.
  </Accordion>
</AccordionGroup>

Efek praktisnya adalah OpenClaw mengetahui sejak awal Plugin mana yang memiliki surface mana. Itu memungkinkan core dan channel menyusun diri secara mulus karena ownership dinyatakan, typed, dan dapat diuji alih-alih implisit.

### Apa yang termasuk dalam kontrak

<Tabs>
  <Tab title="Kontrak yang baik">
    Typed, kecil, khusus kapabilitas, dimiliki oleh core, dapat digunakan ulang oleh banyak Plugin, dan dapat dikonsumsi oleh channel atau fitur tanpa pengetahuan vendor.
  </Tab>
  <Tab title="Kontrak yang buruk">
    Kebijakan khusus vendor yang tersembunyi di core, jalur escape khusus Plugin sekali pakai yang melewati registry, kode channel yang langsung menjangkau implementasi vendor, atau objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau `api.runtime`.
  </Tab>
</Tabs>

Jika ragu, naikkan tingkat abstraksinya: definisikan dulu kapabilitasnya, lalu biarkan Plugin masuk ke sana.

## Model eksekusi

Plugin native OpenClaw berjalan **in-process** bersama Gateway. Mereka tidak di-sandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses yang sama dengan kode core.

<Warning>
Implikasi:

Plugin native dapat mendaftarkan tool, network handler, hook, dan layanan. Bug pada Plugin native dapat membuat gateway crash atau tidak stabil. Plugin native yang berbahaya setara dengan eksekusi kode arbitrer di dalam proses OpenClaw.
</Warning>

Bundle yang kompatibel lebih aman secara default karena OpenClaw saat ini memperlakukannya sebagai paket metadata/konten. Dalam rilis saat ini, itu terutama berarti Skills bawaan.

Gunakan allowlist dan path instalasi/pemuatan eksplisit untuk Plugin non-bawaan. Perlakukan Plugin workspace sebagai kode waktu pengembangan, bukan default produksi.

Untuk nama package workspace bawaan, pertahankan id Plugin tetap berjangkar pada nama npm: `@openclaw/<id>` secara default, atau suffix typed yang disetujui seperti `-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` ketika package memang mengekspos peran Plugin yang lebih sempit.

<Note>
**Catatan kepercayaan:**

`plugins.allow` mempercayai **id Plugin**, bukan asal provenance sumber. Plugin workspace dengan id yang sama seperti Plugin bawaan secara sengaja membayangi salinan bawaan ketika Plugin workspace itu diaktifkan atau masuk allowlist. Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix. Kepercayaan Plugin bawaan di-resolve dari snapshot source, yaitu manifest dan kode di disk saat waktu pemuatan, bukan dari metadata instalasi. Catatan instalasi yang rusak atau diganti tidak dapat secara diam-diam memperluas surface kepercayaan Plugin bawaan melebihi apa yang diklaim oleh source sebenarnya.
</Note>

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan kemudahan implementasi.

Pertahankan pendaftaran kapabilitas tetap publik. Pangkas ekspor helper non-kontrak:

- subpath helper khusus Plugin bawaan
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper kemudahan khusus vendor
- helper setup/onboarding yang merupakan detail implementasi

Beberapa subpath helper Plugin bawaan masih tetap ada di peta ekspor SDK yang dihasilkan demi kompatibilitas dan pemeliharaan Plugin bawaan. Contoh saat ini mencakup `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, dan beberapa seam `plugin-sdk/matrix*`. Perlakukan itu sebagai ekspor detail implementasi yang dicadangkan, bukan sebagai pola SDK yang direkomendasikan untuk Plugin pihak ketiga baru.

## Internal dan referensi

Untuk pipeline pemuatan, model registry, hook runtime provider, route HTTP Gateway, schema tool pesan, resolusi target channel, katalog provider, Plugin engine konteks, dan panduan menambahkan kapabilitas baru, lihat [Plugin architecture internals](/id/plugins/architecture-internals).

## Terkait

- [Building plugins](/id/plugins/building-plugins)
- [Plugin manifest](/id/plugins/manifest)
- [Plugin SDK setup](/id/plugins/sdk-setup)
