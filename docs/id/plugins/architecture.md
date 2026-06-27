---
read_when:
    - Membangun atau men-debug Plugin OpenClaw native
    - Memahami model kapabilitas Plugin atau batas kepemilikan
    - Bekerja pada pipeline pemuatan Plugin atau registri
    - Mengimplementasikan hook runtime penyedia atau Plugin kanal
sidebarTitle: Internals
summary: 'Internal Plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Internal Plugin
x-i18n:
    generated_at: "2026-06-27T17:45:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

Ini adalah **referensi arsitektur mendalam** untuk sistem Plugin OpenClaw. Untuk panduan praktis, mulailah dengan salah satu halaman terfokus di bawah ini.

<CardGroup cols={2}>
  <Card title="Instal dan gunakan plugin" icon="plug" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menambahkan, mengaktifkan, dan memecahkan masalah plugin.
  </Card>
  <Card title="Membangun plugin" icon="rocket" href="/id/plugins/building-plugins">
    Tutorial plugin pertama dengan manifes kerja terkecil.
  </Card>
  <Card title="Plugin channel" icon="comments" href="/id/plugins/sdk-channel-plugins">
    Bangun Plugin channel pesan.
  </Card>
  <Card title="Plugin penyedia" icon="microchip" href="/id/plugins/sdk-provider-plugins">
    Bangun Plugin penyedia model.
  </Card>
  <Card title="Ringkasan SDK" icon="book" href="/id/plugins/sdk-overview">
    Referensi API peta impor dan registrasi.
  </Card>
</CardGroup>

## Model kapabilitas publik

Kapabilitas adalah model **Plugin native** publik di dalam OpenClaw. Setiap Plugin OpenClaw native mendaftar terhadap satu atau beberapa jenis kapabilitas:

| Kapabilitas             | Metode registrasi                              | Contoh plugin                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferensi teks         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Embedding              | `api.registerEmbeddingProvider(...)`             | Plugin vektor milik penyedia        |
| Ucapan                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkripsi realtime | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Suara realtime         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Pemahaman media    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Sumber transkrip     | `api.registerTranscriptSourceProvider(...)`      | `discord`                            |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Pembuatan musik       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Pembuatan video       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pengambilan web              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pencarian web             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / pesan    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Penemuan Gateway      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, alat, layanan penemuan, atau layanan latar belakang adalah Plugin **hanya hook legacy**. Pola itu masih didukung sepenuhnya.
</Note>

### Sikap kompatibilitas eksternal

Model kapabilitas sudah masuk ke core dan digunakan oleh plugin bundled/native saat ini, tetapi kompatibilitas plugin eksternal masih membutuhkan standar yang lebih ketat daripada "sudah diekspor, jadi sudah dibekukan."

| Situasi Plugin                                  | Panduan                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin eksternal yang ada                         | Pertahankan integrasi berbasis hook tetap berfungsi; ini adalah baseline kompatibilitas.                        |
| Plugin bundled/native baru                        | Lebih pilih registrasi kapabilitas eksplisit daripada reach-in khusus vendor atau desain baru yang hanya hook. |
| Plugin eksternal yang mengadopsi registrasi kapabilitas | Diizinkan, tetapi perlakukan surface helper khusus kapabilitas sebagai berkembang kecuali docs menandainya stabil. |

Registrasi kapabilitas adalah arah yang dituju. Hook legacy tetap menjadi jalur tanpa kerusakan yang paling aman untuk plugin eksternal selama transisi. Subpath helper yang diekspor tidak semuanya setara — pilih kontrak sempit yang terdokumentasi daripada ekspor helper insidental.

### Bentuk Plugin

OpenClaw mengklasifikasikan setiap plugin yang dimuat ke dalam bentuk berdasarkan perilaku registrasi aktualnya (bukan hanya metadata statis):

<AccordionGroup>
  <Accordion title="plain-capability">
    Mendaftarkan tepat satu jenis kapabilitas (misalnya plugin hanya penyedia seperti `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Mendaftarkan beberapa jenis kapabilitas (misalnya `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan gambar).
  </Accordion>
  <Accordion title="hook-only">
    Hanya mendaftarkan hook (bertipe atau kustom), tanpa kapabilitas, alat, perintah, atau layanan.
  </Accordion>
  <Accordion title="non-capability">
    Mendaftarkan alat, perintah, layanan, atau route tetapi tanpa kapabilitas.
  </Accordion>
</AccordionGroup>

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin dan rincian kapabilitasnya. Lihat [referensi CLI](/id/cli/plugins#inspect) untuk detail.

### Hook legacy

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk plugin hanya hook. Plugin dunia nyata legacy masih bergantung padanya.

Arah:

- pertahankan agar tetap berfungsi
- dokumentasikan sebagai legacy
- pilih `before_model_resolve` untuk pekerjaan override model/penyedia
- pilih `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata turun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`, Anda mungkin melihat salah satu label ini:

| Sinyal                     | Arti                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config diurai dengan baik dan plugin terselesaikan                       |
| **compatibility advisory** | Plugin menggunakan pola yang didukung tetapi lebih lama (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated        |
| **hard error**             | Config tidak valid atau plugin gagal dimuat                   |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak plugin Anda saat ini: `hook-only` bersifat advisori, dan `before_agent_start` hanya memicu peringatan. Sinyal ini juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Ringkasan arsitektur

Sistem Plugin OpenClaw memiliki empat lapisan:

<Steps>
  <Step title="Manifes + penemuan">
    OpenClaw menemukan kandidat plugin dari jalur yang dikonfigurasi, root workspace, root plugin global, dan plugin bundled. Penemuan membaca manifes native `openclaw.plugin.json` plus manifes bundle yang didukung terlebih dahulu.
  </Step>
  <Step title="Pengaktifan + validasi">
    Core memutuskan apakah plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau dipilih untuk slot eksklusif seperti memori.
  </Step>
  <Step title="Pemuatan runtime">
    Plugin OpenClaw native dimuat dalam proses dan mendaftarkan kapabilitas ke registry pusat. JavaScript berpaket dimuat melalui `require` native; TypeScript sumber lokal pihak ketiga adalah fallback darurat Jiti. Bundle yang kompatibel dinormalisasi menjadi record registry tanpa mengimpor kode runtime.
  </Step>
  <Step title="Konsumsi surface">
    Bagian lain OpenClaw membaca registry untuk mengekspos alat, channel, setup penyedia, hook, route HTTP, perintah CLI, dan layanan.
  </Step>
</Steps>

Khusus untuk CLI plugin, penemuan perintah root dibagi menjadi dua fase:

- metadata waktu parsing berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI plugin sebenarnya dapat tetap lazy dan mendaftar saat pemanggilan pertama

Itu menjaga kode CLI milik plugin tetap di dalam plugin sambil tetap memungkinkan OpenClaw mencadangkan nama perintah root sebelum parsing.

Batas desain penting:

- validasi manifes/config harus bekerja dari **metadata manifes/skema** tanpa mengeksekusi kode plugin
- penemuan kapabilitas native dapat memuat kode entri plugin tepercaya untuk membangun snapshot registry non-aktif
- perilaku runtime native berasal dari jalur `register(api)` modul plugin dengan `api.registrationMode === "full"`

Pemisahan itu memungkinkan OpenClaw memvalidasi config, menjelaskan plugin yang hilang/dinonaktifkan, dan membangun petunjuk UI/skema sebelum runtime penuh aktif.

### Snapshot metadata Plugin dan tabel lookup

Startup Gateway membangun satu `PluginMetadataSnapshot` untuk snapshot config saat ini. Snapshot ini hanya metadata: menyimpan indeks plugin terpasang, registry manifes, diagnostik manifes, peta pemilik, penormal id plugin, dan record manifes. Snapshot ini tidak menyimpan modul plugin yang dimuat, SDK penyedia, isi paket, atau ekspor runtime.

Validasi config yang sadar plugin, pengaktifan otomatis saat startup, dan bootstrap plugin Gateway menggunakan snapshot itu alih-alih membangun ulang metadata manifes/indeks secara terpisah. `PluginLookUpTable` diturunkan dari snapshot yang sama dan menambahkan rencana plugin startup untuk config runtime saat ini.

Setelah startup, Gateway mempertahankan snapshot metadata saat ini sebagai produk runtime yang dapat diganti. Penemuan penyedia runtime berulang dapat meminjam snapshot itu alih-alih merekonstruksi indeks terpasang dan registry manifes untuk setiap pass katalog penyedia. Snapshot dihapus atau diganti saat Gateway shutdown, perubahan config/inventaris plugin, dan penulisan indeks terpasang; pemanggil fallback ke jalur manifes/indeks dingin saat tidak ada snapshot saat ini yang kompatibel. Pemeriksaan kompatibilitas harus menyertakan root penemuan plugin seperti `plugins.load.paths` dan workspace agen default, karena plugin workspace adalah bagian dari cakupan metadata.

Snapshot dan tabel lookup menjaga keputusan startup berulang tetap di jalur cepat:

- kepemilikan channel
- startup channel tertunda
- id plugin startup
- kepemilikan penyedia dan backend CLI
- setup penyedia, alias perintah, penyedia katalog model, dan kepemilikan kontrak manifes
- validasi skema config plugin dan skema config channel
- keputusan pengaktifan otomatis saat startup

Batas keselamatan adalah penggantian snapshot, bukan mutasi. Bangun ulang snapshot saat config, inventaris plugin, record instalasi, atau kebijakan indeks persisten berubah. Jangan perlakukan ini sebagai registry global mutable yang luas, dan jangan simpan snapshot historis tanpa batas. Pemuatan plugin runtime tetap terpisah dari snapshot metadata sehingga state runtime usang tidak dapat disembunyikan di balik cache metadata.

Aturan cache didokumentasikan di [internal arsitektur Plugin](/id/plugins/architecture-internals#plugin-cache-boundary): metadata manifes dan penemuan selalu fresh kecuali pemanggil memegang snapshot, tabel lookup, atau registry manifes eksplisit untuk flow saat ini. Cache metadata tersembunyi dan TTL wall-clock bukan bagian dari pemuatan plugin. Hanya cache loader runtime, modul, dan artefak dependensi yang boleh bertahan setelah kode atau artefak terpasang benar-benar dimuat.

Beberapa pemanggil jalur dingin masih merekonstruksi registry manifes langsung dari indeks plugin terpasang yang persisten alih-alih menerima `PluginLookUpTable` Gateway. Jalur itu kini merekonstruksi registry sesuai kebutuhan; pilih meneruskan tabel lookup saat ini atau registry manifes eksplisit melalui flow runtime saat pemanggil sudah memilikinya.

### Perencanaan aktivasi

Perencanaan aktivasi adalah bagian dari control plane. Pemanggil dapat menanyakan plugin mana yang relevan untuk perintah, penyedia, channel, route, harness agen, atau kapabilitas konkret sebelum memuat registry runtime yang lebih luas.

Planner menjaga perilaku manifes saat ini tetap kompatibel:

- kolom `activation.*` adalah petunjuk perencana yang eksplisit
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, dan hook tetap menjadi fallback kepemilikan manifes
- API perencana khusus id tetap tersedia untuk caller yang sudah ada
- API rencana melaporkan label alasan sehingga diagnostik dapat membedakan petunjuk eksplisit dari fallback kepemilikan

<Warning>
Jangan perlakukan `activation` sebagai hook siklus hidup atau pengganti `register(...)`. Ini adalah metadata yang digunakan untuk mempersempit pemuatan. Utamakan kolom kepemilikan ketika kolom tersebut sudah menjelaskan relasinya; gunakan `activation` hanya untuk petunjuk perencana tambahan.
</Warning>

### Plugin kanal dan alat pesan bersama

Plugin kanal tidak perlu mendaftarkan alat kirim/edit/reaksi terpisah untuk aksi obrolan normal. OpenClaw mempertahankan satu alat `message` bersama di inti, dan Plugin kanal memiliki discovery serta eksekusi khusus kanal di baliknya.

Batas saat ini adalah:

- inti memiliki host alat `message` bersama, wiring prompt, pencatatan sesi/thread, dan dispatch eksekusi
- Plugin kanal memiliki discovery aksi terscoped, discovery kapabilitas, dan fragmen skema khusus kanal apa pun
- Plugin kanal memiliki tata bahasa percakapan sesi khusus penyedia, seperti bagaimana id percakapan mengodekan id thread atau mewarisi dari percakapan induk
- Plugin kanal menjalankan aksi akhir melalui adapter aksinya

Untuk Plugin kanal, permukaan SDK adalah `ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan discovery terpadu tersebut memungkinkan Plugin mengembalikan aksi yang terlihat, kapabilitas, dan kontribusi skemanya bersama-sama agar bagian-bagian itu tidak menyimpang.

Ketika param alat pesan khusus kanal membawa sumber media seperti path lokal atau URL media jarak jauh, Plugin juga harus mengembalikan `mediaSourceParams` dari `describeMessageTool(...)`. Inti menggunakan daftar eksplisit itu untuk menerapkan normalisasi path sandbox dan petunjuk akses media keluar tanpa meng-hardcode nama param milik Plugin. Utamakan map terscoped aksi di sana, bukan satu daftar datar selebar kanal, agar param media khusus profil tidak dinormalisasi pada aksi yang tidak terkait seperti `send`.

Inti meneruskan scope runtime ke langkah discovery tersebut. Kolom penting mencakup:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound tepercaya

Hal itu penting untuk Plugin yang sensitif konteks. Sebuah kanal dapat menyembunyikan atau mengekspos aksi pesan berdasarkan akun aktif, ruang/thread/pesan saat ini, atau identitas requester tepercaya tanpa meng-hardcode cabang khusus kanal di alat `message` inti.

Inilah mengapa perubahan routing embedded-runner tetap menjadi pekerjaan Plugin: runner bertanggung jawab meneruskan identitas obrolan/sesi saat ini ke batas discovery Plugin agar alat `message` bersama mengekspos permukaan milik kanal yang tepat untuk giliran saat ini.

Untuk helper eksekusi milik kanal, Plugin bawaan harus mempertahankan runtime eksekusi di dalam modul ekstensi mereka sendiri. Inti tidak lagi memiliki runtime aksi pesan Discord, Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`. Kami tidak menerbitkan subpath `plugin-sdk/*-action-runtime` terpisah, dan Plugin bawaan harus mengimpor kode runtime lokal mereka sendiri langsung dari modul milik ekstensi mereka.

Batas yang sama berlaku untuk seam SDK bernama penyedia secara umum: inti tidak boleh mengimpor barrel kemudahan khusus kanal untuk Slack, Discord, Signal, WhatsApp, atau ekstensi serupa. Jika inti membutuhkan suatu perilaku, konsumsi barrel `api.ts` / `runtime-api.ts` milik Plugin bawaan itu sendiri atau promosikan kebutuhan tersebut menjadi kapabilitas generik yang sempit di SDK bersama.

Plugin bawaan mengikuti aturan yang sama. `runtime-api.ts` milik Plugin bawaan tidak boleh mengekspor ulang facade bermerek `openclaw/plugin-sdk/<plugin-id>` miliknya sendiri. Facade bermerek tersebut tetap menjadi shim kompatibilitas untuk Plugin eksternal dan konsumen lama, tetapi Plugin bawaan harus menggunakan ekspor lokal plus subpath SDK generik yang sempit seperti `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, atau `openclaw/plugin-sdk/webhook-ingress`. Kode baru tidak boleh menambahkan facade SDK khusus plugin-id kecuali batas kompatibilitas untuk ekosistem eksternal yang sudah ada membutuhkannya.

Khusus untuk polling, ada dua path eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk kanal yang cocok dengan model polling umum
- `actions.handleAction("poll")` adalah path yang diutamakan untuk semantik polling khusus kanal atau parameter polling tambahan

Inti sekarang menunda parsing polling bersama sampai setelah dispatch polling Plugin menolak aksi, sehingga handler polling milik Plugin dapat menerima kolom polling khusus kanal tanpa dihalangi parser polling generik terlebih dahulu.

Lihat [Internal arsitektur Plugin](/id/plugins/architecture-internals) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan Plugin native sebagai batas kepemilikan untuk sebuah **perusahaan** atau sebuah **fitur**, bukan sebagai kumpulan integrasi yang tidak saling terkait.

Artinya:

- Plugin perusahaan biasanya harus memiliki semua permukaan yang menghadap OpenClaw untuk perusahaan tersebut
- Plugin fitur biasanya harus memiliki seluruh permukaan fitur yang diperkenalkannya
- kanal harus mengonsumsi kapabilitas inti bersama alih-alih mengimplementasikan ulang perilaku penyedia secara ad hoc

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` memiliki inferensi teks, wicara, suara realtime, pemahaman media, dan pembuatan gambar. `google` memiliki inferensi teks plus pemahaman media, pembuatan gambar, dan pencarian web. `qwen` memiliki inferensi teks plus pemahaman media dan pembuatan video.
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` dan `microsoft` memiliki wicara; `firecrawl` memiliki web-fetch; `minimax` / `mistral` / `moonshot` / `zai` memiliki backend pemahaman media.
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` memiliki transport panggilan, alat, CLI, route, dan bridging media-stream Twilio, tetapi mengonsumsi kapabilitas wicara bersama, transkripsi realtime, dan suara realtime alih-alih mengimpor Plugin vendor secara langsung.
  </Accordion>
</AccordionGroup>

Keadaan akhir yang dimaksudkan adalah:

- OpenAI hidup dalam satu Plugin meskipun mencakup model teks, wicara, gambar, dan video masa depan
- vendor lain dapat melakukan hal yang sama untuk area permukaannya sendiri
- kanal tidak peduli Plugin vendor mana yang memiliki penyedia; kanal mengonsumsi kontrak kapabilitas bersama yang diekspos oleh inti

Inilah pembedaan utamanya:

- **Plugin** = batas kepemilikan
- **kapabilitas** = kontrak inti yang dapat diimplementasikan atau dikonsumsi oleh beberapa Plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama bukan "penyedia mana yang harus meng-hardcode penanganan video?" Pertanyaan pertama adalah "apa kontrak kapabilitas video inti?" Setelah kontrak itu ada, Plugin vendor dapat mendaftar terhadapnya dan Plugin kanal/fitur dapat mengonsumsinya.

Jika kapabilitas belum ada, langkah yang tepat biasanya adalah:

<Steps>
  <Step title="Define the capability">
    Definisikan kapabilitas yang hilang di inti.
  </Step>
  <Step title="Expose through the SDK">
    Ekspos melalui API/runtime Plugin dengan cara yang bertipe.
  </Step>
  <Step title="Wire consumers">
    Hubungkan kanal/fitur terhadap kapabilitas tersebut.
  </Step>
  <Step title="Vendor implementations">
    Biarkan Plugin vendor mendaftarkan implementasi.
  </Step>
</Steps>

Ini menjaga kepemilikan tetap eksplisit sambil menghindari perilaku inti yang bergantung pada satu vendor atau path kode khusus Plugin sekali pakai.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan di mana kode berada:

<Tabs>
  <Tab title="Core capability layer">
    Orkestrasi bersama, kebijakan, fallback, aturan merge config, semantik pengiriman, dan kontrak bertipe.
  </Tab>
  <Tab title="Vendor plugin layer">
    API khusus vendor, auth, katalog model, sintesis wicara, pembuatan gambar, backend video masa depan, endpoint penggunaan.
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Integrasi Slack/Discord/voice-call/dll. yang mengonsumsi kapabilitas inti dan menyajikannya pada suatu permukaan.
  </Tab>
</Tabs>

Sebagai contoh, TTS mengikuti bentuk ini:

- inti memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan pengiriman kanal
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` mengonsumsi helper runtime TTS telepon

Pola yang sama harus diutamakan untuk kapabilitas masa depan.

### Contoh Plugin perusahaan multi-kapabilitas

Plugin perusahaan harus terasa kohesif dari luar. Jika OpenClaw memiliki kontrak bersama untuk model, wicara, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan video, fetch web, dan pencarian web, vendor dapat memiliki semua permukaannya di satu tempat:

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

- satu Plugin memiliki permukaan vendor
- inti tetap memiliki kontrak kapabilitas
- kanal dan Plugin fitur mengonsumsi helper `api.runtime.*`, bukan kode vendor
- pengujian kontrak dapat menegaskan bahwa Plugin mendaftarkan kapabilitas yang diklaimnya dimiliki

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu kapabilitas bersama. Model kepemilikan yang sama berlaku di sana:

<Steps>
  <Step title="Core defines the contract">
    Inti mendefinisikan kontrak pemahaman media.
  </Step>
  <Step title="Vendor plugins register">
    Plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan `describeVideo` sesuai kebutuhan.
  </Step>
  <Step title="Consumers use the shared behavior">
    Kanal dan Plugin fitur mengonsumsi perilaku inti bersama alih-alih menghubungkan langsung ke kode vendor.
  </Step>
</Steps>

Itu menghindari penanaman asumsi video satu penyedia ke dalam inti. Plugin memiliki permukaan vendor; inti memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: inti memiliki kontrak kapabilitas bertipe dan helper runtime, dan Plugin vendor mendaftarkan implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh checklist rollout konkret? Lihat [Capability Cookbook](/id/plugins/adding-capabilities).

## Kontrak dan penegakan

Permukaan API Plugin sengaja dibuat bertipe dan terpusat di `OpenClawPluginApi`. Kontrak itu mendefinisikan titik pendaftaran yang didukung dan helper runtime yang boleh diandalkan oleh Plugin.

Mengapa ini penting:

- penulis Plugin mendapatkan satu standar internal yang stabil
- inti dapat menolak kepemilikan duplikat seperti dua Plugin yang mendaftarkan id penyedia yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk pendaftaran yang malformed
- pengujian kontrak dapat menegakkan kepemilikan Plugin bawaan dan mencegah penyimpangan senyap

Ada dua lapisan penegakan:

<AccordionGroup>
  <Accordion title="Penegakan pendaftaran runtime">
    Registry plugin memvalidasi pendaftaran saat plugin dimuat. Contoh: id penyedia duplikat, id penyedia speech duplikat, dan pendaftaran yang tidak valid menghasilkan diagnostik plugin alih-alih perilaku yang tidak terdefinisi.
  </Accordion>
  <Accordion title="Pengujian kontrak">
    Plugin bawaan ditangkap dalam registry kontrak selama test run sehingga OpenClaw dapat menegaskan kepemilikan secara eksplisit. Saat ini ini digunakan untuk penyedia model, penyedia speech, penyedia pencarian web, dan kepemilikan pendaftaran bawaan.
  </Accordion>
</AccordionGroup>

Dampak praktisnya adalah OpenClaw mengetahui sejak awal plugin mana yang memiliki surface mana. Itu memungkinkan core dan channel tersusun mulus karena kepemilikan dideklarasikan, bertipe, dan dapat diuji, bukan implisit.

### Apa yang termasuk dalam kontrak

<Tabs>
  <Tab title="Kontrak yang baik">
    - bertipe
    - kecil
    - spesifik capability
    - dimiliki oleh core
    - dapat digunakan ulang oleh beberapa plugin
    - dapat dikonsumsi oleh channel/fitur tanpa pengetahuan vendor

  </Tab>
  <Tab title="Kontrak yang buruk">
    - kebijakan khusus vendor yang tersembunyi di core
    - escape hatch plugin sekali pakai yang melewati registry
    - kode channel yang langsung menjangkau implementasi vendor
    - objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau `api.runtime`

  </Tab>
</Tabs>

Jika ragu, naikkan tingkat abstraksi: definisikan capability terlebih dahulu, lalu biarkan plugin terhubung ke dalamnya.

## Model eksekusi

Plugin OpenClaw native berjalan **di dalam proses** bersama Gateway. Plugin tersebut tidak di-sandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses yang sama dengan kode core.

<Warning>
Implikasi plugin native: plugin dapat mendaftarkan tool, handler jaringan, hook, dan layanan; bug plugin dapat membuat gateway crash atau tidak stabil; dan plugin native berbahaya setara dengan eksekusi kode arbitrer di dalam proses OpenClaw.
</Warning>

Bundle yang kompatibel lebih aman secara default karena OpenClaw saat ini memperlakukannya sebagai paket metadata/konten. Dalam rilis saat ini, itu umumnya berarti Skills bawaan.

Gunakan allowlist dan jalur install/load eksplisit untuk plugin non-bawaan. Perlakukan plugin workspace sebagai kode waktu pengembangan, bukan default produksi.

Untuk nama paket workspace bawaan, pertahankan id plugin yang tertambat pada nama npm: `@openclaw/<id>` secara default, atau sufiks bertipe yang disetujui seperti `-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` ketika paket tersebut sengaja mengekspos peran plugin yang lebih sempit.

<Note>
**Catatan kepercayaan:** `plugins.allow` memercayai **id plugin**, bukan asal sumber. Plugin workspace dengan id yang sama dengan plugin bawaan secara sengaja membayangi salinan bawaan ketika plugin workspace tersebut diaktifkan/dimasukkan allowlist. Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix. Kepercayaan plugin bawaan diselesaikan dari snapshot sumber — manifest dan kode di disk saat load time — bukan dari metadata install. Catatan install yang rusak atau diganti tidak dapat secara diam-diam memperluas surface kepercayaan plugin bawaan melebihi apa yang diklaim sumber aktual.
</Note>

## Batas ekspor

OpenClaw mengekspor capability, bukan kemudahan implementasi.

Jaga pendaftaran capability tetap publik. Pangkas ekspor helper non-kontrak:

- subpath helper khusus plugin bawaan
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper kemudahan khusus vendor
- helper penyiapan/onboarding yang merupakan detail implementasi

Subpath helper plugin bawaan yang direservasi telah dipensiunkan dari peta ekspor SDK yang dihasilkan. Simpan helper khusus owner di dalam paket plugin pemilik; promosikan hanya perilaku host yang dapat digunakan ulang ke kontrak SDK generik seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.

## Internal dan referensi

Untuk pipeline load, model registry, hook runtime penyedia, rute HTTP Gateway, skema tool pesan, resolusi target channel, katalog penyedia, plugin mesin konteks, dan panduan untuk menambahkan capability baru, lihat [Internal arsitektur plugin](/id/plugins/architecture-internals).

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Manifest plugin](/id/plugins/manifest)
- [Penyiapan SDK plugin](/id/plugins/sdk-setup)
