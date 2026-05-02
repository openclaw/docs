---
read_when:
    - Membangun atau men-debug Plugin OpenClaw native
    - Memahami model kapabilitas Plugin atau batas kepemilikan
    - Saat mengerjakan pipeline pemuatan Plugin atau registri
    - Mengimplementasikan hook runtime penyedia atau Plugin saluran
sidebarTitle: Internals
summary: 'Internal Plugin: model kapabilitas, kepemilikan, kontrak, pipeline pemuatan, dan helper runtime'
title: Bagian internal Plugin
x-i18n:
    generated_at: "2026-05-02T09:26:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

Ini adalah **referensi arsitektur mendalam** untuk sistem Plugin OpenClaw. Untuk panduan praktis, mulai dengan salah satu halaman terfokus di bawah ini.

<CardGroup cols={2}>
  <Card title="Instal dan gunakan Plugin" icon="plug" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menambahkan, mengaktifkan, dan memecahkan masalah Plugin.
  </Card>
  <Card title="Membangun Plugin" icon="rocket" href="/id/plugins/building-plugins">
    Tutorial Plugin pertama dengan manifes berfungsi paling kecil.
  </Card>
  <Card title="Plugin channel" icon="comments" href="/id/plugins/sdk-channel-plugins">
    Bangun Plugin channel perpesanan.
  </Card>
  <Card title="Plugin provider" icon="microchip" href="/id/plugins/sdk-provider-plugins">
    Bangun Plugin provider model.
  </Card>
  <Card title="Ikhtisar SDK" icon="book" href="/id/plugins/sdk-overview">
    Referensi peta impor dan API pendaftaran.
  </Card>
</CardGroup>

## Model kapabilitas publik

Kapabilitas adalah model **Plugin native** publik di dalam OpenClaw. Setiap Plugin OpenClaw native mendaftar terhadap satu atau beberapa tipe kapabilitas:

| Kapabilitas            | Metode pendaftaran                              | Contoh Plugin                        |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferensi teks         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Ucapan                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transkripsi realtime  | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Suara realtime         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Pembuatan musik        | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Pengambilan web        | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pencarian web          | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / perpesanan   | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Penemuan Gateway       | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, alat, layanan penemuan, atau layanan latar belakang adalah Plugin **legacy hook-only**. Pola itu masih didukung sepenuhnya.
</Note>

### Sikap kompatibilitas eksternal

Model kapabilitas sudah mendarat di core dan digunakan oleh Plugin bundled/native saat ini, tetapi kompatibilitas Plugin eksternal masih membutuhkan standar yang lebih ketat daripada "ini diekspor, jadi ini sudah dibekukan."

| Situasi Plugin                                   | Panduan                                                                                          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin eksternal yang sudah ada                   | Jaga agar integrasi berbasis hook tetap berfungsi; ini adalah baseline kompatibilitas.           |
| Plugin bundled/native baru                        | Lebih pilih pendaftaran kapabilitas eksplisit daripada akses masuk khusus vendor atau desain hook-only baru. |
| Plugin eksternal yang mengadopsi pendaftaran kapabilitas | Diizinkan, tetapi perlakukan permukaan helper khusus kapabilitas sebagai berkembang kecuali docs menandainya stabil. |

Pendaftaran kapabilitas adalah arah yang dituju. Hook legacy tetap menjadi jalur paling aman tanpa kerusakan bagi Plugin eksternal selama transisi. Subpath helper yang diekspor tidak semuanya setara — lebih pilih kontrak terdokumentasi yang sempit daripada ekspor helper insidental.

### Bentuk Plugin

OpenClaw mengklasifikasikan setiap Plugin yang dimuat ke dalam sebuah bentuk berdasarkan perilaku pendaftarannya yang sebenarnya (bukan hanya metadata statis):

<AccordionGroup>
  <Accordion title="plain-capability">
    Mendaftarkan tepat satu tipe kapabilitas (misalnya Plugin khusus provider seperti `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Mendaftarkan beberapa tipe kapabilitas (misalnya `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan gambar).
  </Accordion>
  <Accordion title="hook-only">
    Hanya mendaftarkan hook (bertipe atau kustom), tanpa kapabilitas, alat, perintah, atau layanan.
  </Accordion>
  <Accordion title="non-capability">
    Mendaftarkan alat, perintah, layanan, atau route tetapi tanpa kapabilitas.
  </Accordion>
</AccordionGroup>

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk Plugin dan perincian kapabilitasnya. Lihat [referensi CLI](/id/cli/plugins#inspect) untuk detail.

### Hook legacy

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk Plugin hook-only. Plugin dunia nyata legacy masih bergantung padanya.

Arah:

- tetap membuatnya berfungsi
- dokumentasikan sebagai legacy
- lebih pilih `before_model_resolve` untuk pekerjaan override model/provider
- lebih pilih `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

Saat Anda menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`, Anda mungkin melihat salah satu label ini:

| Sinyal                     | Makna                                                        |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config berhasil di-parse dan Plugin terselesaikan            |
| **compatibility advisory** | Plugin menggunakan pola yang didukung tetapi lebih lama (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated |
| **hard error**             | Config tidak valid atau Plugin gagal dimuat                  |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak Plugin Anda hari ini: `hook-only` bersifat nasihat, dan `before_agent_start` hanya memicu peringatan. Sinyal ini juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Ikhtisar arsitektur

Sistem Plugin OpenClaw memiliki empat lapisan:

<Steps>
  <Step title="Manifes + penemuan">
    OpenClaw menemukan kandidat Plugin dari path yang dikonfigurasi, root workspace, root Plugin global, dan Plugin bundled. Penemuan membaca manifes native `openclaw.plugin.json` plus manifes bundle yang didukung terlebih dahulu.
  </Step>
  <Step title="Pengaktifan + validasi">
    Core memutuskan apakah Plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau dipilih untuk slot eksklusif seperti memori.
  </Step>
  <Step title="Pemuatan runtime">
    Plugin OpenClaw native dimuat dalam proses dan mendaftarkan kapabilitas ke registry pusat. JavaScript terpaket dimuat melalui `require` native; TypeScript source lokal pihak ketiga adalah fallback darurat Jiti. Bundle kompatibel dinormalisasi menjadi record registry tanpa mengimpor kode runtime.
  </Step>
  <Step title="Konsumsi permukaan">
    Bagian lain OpenClaw membaca registry untuk mengekspos alat, channel, penyiapan provider, hook, route HTTP, perintah CLI, dan layanan.
  </Step>
</Steps>

Khusus untuk CLI Plugin, penemuan perintah root dibagi menjadi dua fase:

- metadata waktu parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI Plugin yang sebenarnya dapat tetap lazy dan mendaftar pada pemanggilan pertama

Itu menjaga kode CLI milik Plugin tetap di dalam Plugin sambil tetap memungkinkan OpenClaw mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- validasi manifes/config harus berfungsi dari **metadata manifes/skema** tanpa mengeksekusi kode Plugin
- penemuan kapabilitas native dapat memuat kode entri Plugin tepercaya untuk membangun snapshot registry yang tidak mengaktifkan
- perilaku runtime native berasal dari jalur `register(api)` modul Plugin dengan `api.registrationMode === "full"`

Pemisahan itu memungkinkan OpenClaw memvalidasi config, menjelaskan Plugin yang hilang/dinonaktifkan, dan membangun petunjuk UI/skema sebelum runtime penuh aktif.

### Snapshot metadata Plugin dan tabel lookup

Startup Gateway membangun satu `PluginMetadataSnapshot` untuk snapshot config saat ini. Snapshot ini hanya metadata: ia menyimpan indeks Plugin terinstal, registry manifes, diagnostik manifes, peta pemilik, penormal id Plugin, dan record manifes. Ia tidak menyimpan modul Plugin yang dimuat, SDK provider, isi package, atau ekspor runtime.

Validasi config yang sadar Plugin, auto-enable startup, dan bootstrap Plugin Gateway memakai snapshot itu alih-alih membangun ulang metadata manifes/indeks secara independen. `PluginLookUpTable` diturunkan dari snapshot yang sama dan menambahkan rencana Plugin startup untuk config runtime saat ini.

Setelah startup, Gateway mempertahankan snapshot metadata saat ini sebagai produk runtime yang dapat diganti. Penemuan provider runtime berulang dapat meminjam snapshot itu alih-alih merekonstruksi indeks terinstal dan registry manifes untuk setiap pass katalog provider. Snapshot dibersihkan atau diganti saat Gateway shutdown, perubahan config/inventaris Plugin, dan penulisan indeks terinstal; pemanggil fallback ke jalur manifes/indeks dingin saat tidak ada snapshot saat ini yang kompatibel. Pemeriksaan kompatibilitas harus menyertakan root penemuan Plugin seperti `plugins.load.paths` dan workspace agent default, karena Plugin workspace adalah bagian dari cakupan metadata.

Snapshot dan tabel lookup menjaga keputusan startup berulang tetap berada di jalur cepat:

- kepemilikan channel
- startup channel tertunda
- id Plugin startup
- kepemilikan provider dan backend CLI
- kepemilikan penyiapan provider, alias perintah, provider katalog model, dan kontrak manifes
- validasi skema config Plugin dan skema config channel
- keputusan auto-enable startup

Batas keamanannya adalah penggantian snapshot, bukan mutasi. Bangun ulang snapshot saat config, inventaris Plugin, record instalasi, atau kebijakan indeks persisten berubah. Jangan perlakukan ini sebagai registry global mutable yang luas, dan jangan simpan snapshot historis tanpa batas. Pemuatan Plugin runtime tetap terpisah dari snapshot metadata sehingga state runtime usang tidak dapat disembunyikan di balik cache metadata.

Aturan cache didokumentasikan di [internal arsitektur Plugin](/id/plugins/architecture-internals#plugin-cache-boundary): metadata manifes dan penemuan selalu segar kecuali pemanggil memegang snapshot, tabel lookup, atau registry manifes eksplisit untuk alur saat ini. Cache metadata tersembunyi dan TTL berbasis jam dinding bukan bagian dari pemuatan Plugin. Hanya cache loader runtime, modul, dan artefak dependensi yang boleh bertahan setelah kode atau artefak terinstal benar-benar dimuat.

Beberapa pemanggil jalur dingin masih merekonstruksi registry manifes langsung dari indeks Plugin terinstal persisten alih-alih menerima `PluginLookUpTable` Gateway. Jalur itu kini merekonstruksi registry sesuai permintaan; lebih pilih meneruskan tabel lookup saat ini atau registry manifes eksplisit melalui alur runtime saat pemanggil sudah memilikinya.

### Perencanaan aktivasi

Perencanaan aktivasi adalah bagian dari control plane. Pemanggil dapat menanyakan Plugin mana yang relevan untuk perintah, provider, channel, route, harness agent, atau kapabilitas konkret sebelum memuat registry runtime yang lebih luas.

Planner menjaga perilaku manifes saat ini tetap kompatibel:

- field `activation.*` adalah petunjuk planner eksplisit
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, dan hook tetap menjadi fallback kepemilikan manifes
- API planner khusus id tetap tersedia untuk pemanggil yang sudah ada
- API plan melaporkan label alasan sehingga diagnostik dapat membedakan petunjuk eksplisit dari fallback kepemilikan

<Warning>
Jangan perlakukan `activation` sebagai hook siklus hidup atau pengganti untuk `register(...)`. Ini adalah metadata yang digunakan untuk mempersempit pemuatan. Utamakan bidang kepemilikan saat bidang tersebut sudah mendeskripsikan relasinya; gunakan `activation` hanya untuk petunjuk planner tambahan.
</Warning>

### Plugin kanal dan alat pesan bersama

Plugin kanal tidak perlu mendaftarkan alat send/edit/react terpisah untuk tindakan chat normal. OpenClaw menyimpan satu alat `message` bersama di core, dan Plugin kanal memiliki penemuan serta eksekusi khusus kanal di baliknya.

Batas saat ini adalah:

- core memiliki host alat `message` bersama, pengkabelan prompt, pembukuan sesi/thread, dan dispatch eksekusi
- Plugin kanal memiliki penemuan tindakan berlingkup, penemuan capability, dan fragmen skema khusus kanal apa pun
- Plugin kanal memiliki tata bahasa percakapan sesi khusus penyedia, seperti bagaimana id percakapan mengodekan id thread atau mewarisi dari percakapan induk
- Plugin kanal menjalankan tindakan akhir melalui adapter tindakannya

Untuk Plugin kanal, permukaan SDK adalah `ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan penemuan terpadu itu memungkinkan Plugin mengembalikan tindakan yang terlihat, capability, dan kontribusi skema bersama-sama sehingga bagian-bagian tersebut tidak menyimpang satu sama lain.

Saat param alat pesan khusus kanal membawa sumber media seperti path lokal atau URL media jarak jauh, Plugin juga harus mengembalikan `mediaSourceParams` dari `describeMessageTool(...)`. Core menggunakan daftar eksplisit itu untuk menerapkan normalisasi path sandbox dan petunjuk akses media keluar tanpa melakukan hardcode nama param milik Plugin. Utamakan peta berlingkup tindakan di sana, bukan satu daftar datar untuk seluruh kanal, agar param media khusus profil tidak dinormalisasi pada tindakan yang tidak terkait seperti `send`.

Core meneruskan lingkup runtime ke langkah penemuan itu. Bidang penting meliputi:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound tepercaya

Hal itu penting untuk Plugin yang peka konteks. Sebuah kanal dapat menyembunyikan atau mengekspos tindakan pesan berdasarkan akun aktif, ruang/thread/pesan saat ini, atau identitas peminta tepercaya tanpa melakukan hardcode cabang khusus kanal di alat `message` core.

Inilah mengapa perubahan routing embedded-runner tetap merupakan pekerjaan Plugin: runner bertanggung jawab meneruskan identitas chat/sesi saat ini ke batas penemuan Plugin sehingga alat `message` bersama mengekspos permukaan milik kanal yang tepat untuk giliran saat ini.

Untuk helper eksekusi milik kanal, Plugin bawaan harus menjaga runtime eksekusi tetap berada di dalam modul extension mereka sendiri. Core tidak lagi memiliki runtime tindakan pesan Discord, Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`. Kami tidak menerbitkan subpath `plugin-sdk/*-action-runtime` terpisah, dan Plugin bawaan harus mengimpor kode runtime lokal mereka sendiri langsung dari modul milik extension mereka.

Batas yang sama berlaku untuk seam SDK bernama penyedia secara umum: core tidak boleh mengimpor barrel kemudahan khusus kanal untuk Slack, Discord, Signal, WhatsApp, atau extension serupa. Jika core membutuhkan sebuah perilaku, core harus memakai barrel `api.ts` / `runtime-api.ts` milik Plugin bawaan itu sendiri atau mempromosikan kebutuhan tersebut menjadi capability generik sempit di SDK bersama.

Plugin bawaan mengikuti aturan yang sama. `runtime-api.ts` milik Plugin bawaan tidak boleh mengekspor ulang facade bermerek `openclaw/plugin-sdk/<plugin-id>` miliknya sendiri. Facade bermerek tersebut tetap menjadi shim kompatibilitas untuk Plugin eksternal dan konsumen lama, tetapi Plugin bawaan harus menggunakan ekspor lokal ditambah subpath SDK generik sempit seperti `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, atau `openclaw/plugin-sdk/webhook-ingress`. Kode baru tidak boleh menambahkan facade SDK khusus id Plugin kecuali batas kompatibilitas untuk ekosistem eksternal yang sudah ada membutuhkannya.

Khusus untuk polling, ada dua path eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk kanal yang cocok dengan model polling umum
- `actions.handleAction("poll")` adalah path yang diutamakan untuk semantik polling khusus kanal atau parameter polling tambahan

Core sekarang menunda parsing polling bersama hingga setelah dispatch polling Plugin menolak tindakan tersebut, sehingga handler polling milik Plugin dapat menerima bidang polling khusus kanal tanpa terlebih dahulu diblokir oleh parser polling generik.

Lihat [Internal arsitektur Plugin](/id/plugins/architecture-internals) untuk urutan startup lengkap.

## Model kepemilikan capability

OpenClaw memperlakukan Plugin native sebagai batas kepemilikan untuk sebuah **perusahaan** atau **fitur**, bukan sebagai kumpulan integrasi yang tidak saling terkait.

Artinya:

- Plugin perusahaan biasanya harus memiliki semua permukaan perusahaan tersebut yang menghadap OpenClaw
- Plugin fitur biasanya harus memiliki seluruh permukaan fitur yang diperkenalkannya
- kanal harus memakai capability core bersama, bukan mengimplementasikan ulang perilaku penyedia secara ad hoc

<AccordionGroup>
  <Accordion title="Multi-capability vendor">
    `openai` memiliki inferensi teks, speech, suara realtime, pemahaman media, dan pembuatan gambar. `google` memiliki inferensi teks plus pemahaman media, pembuatan gambar, dan pencarian web. `qwen` memiliki inferensi teks plus pemahaman media dan pembuatan video.
  </Accordion>
  <Accordion title="Capability tunggal vendor">
    `elevenlabs` dan `microsoft` memiliki speech; `firecrawl` memiliki web-fetch; `minimax` / `mistral` / `moonshot` / `zai` memiliki backend pemahaman media.
  </Accordion>
  <Accordion title="Plugin fitur">
    `voice-call` memiliki transport panggilan, alat, CLI, route, dan bridging media-stream Twilio, tetapi memakai capability speech, transkripsi realtime, dan suara realtime bersama alih-alih mengimpor Plugin vendor secara langsung.
  </Accordion>
</AccordionGroup>

Keadaan akhir yang dimaksud adalah:

- OpenAI berada dalam satu Plugin meskipun mencakup model teks, speech, gambar, dan video mendatang
- vendor lain dapat melakukan hal yang sama untuk area permukaannya sendiri
- kanal tidak peduli Plugin vendor mana yang memiliki penyedia; kanal memakai kontrak capability bersama yang diekspos oleh core

Inilah perbedaan utamanya:

- **Plugin** = batas kepemilikan
- **capability** = kontrak core yang dapat diimplementasikan atau dipakai oleh beberapa Plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertama bukan "penyedia mana yang harus melakukan hardcode penanganan video?" Pertanyaan pertama adalah "apa kontrak capability video core?" Setelah kontrak itu ada, Plugin vendor dapat mendaftar terhadapnya dan Plugin kanal/fitur dapat memakainya.

Jika capability tersebut belum ada, langkah yang tepat biasanya:

<Steps>
  <Step title="Tentukan capability">
    Tentukan capability yang hilang di core.
  </Step>
  <Step title="Ekspos melalui SDK">
    Ekspos melalui API/runtime Plugin dengan cara yang bertipe.
  </Step>
  <Step title="Kabelkan konsumen">
    Kabelkan kanal/fitur terhadap capability tersebut.
  </Step>
  <Step title="Implementasi vendor">
    Biarkan Plugin vendor mendaftarkan implementasi.
  </Step>
</Steps>

Ini menjaga kepemilikan tetap eksplisit sekaligus menghindari perilaku core yang bergantung pada satu vendor atau path kode sekali pakai khusus Plugin.

### Pelapisan capability

Gunakan model mental ini saat memutuskan di mana kode berada:

<Tabs>
  <Tab title="Lapisan capability core">
    Orkestrasi bersama, kebijakan, fallback, aturan merge config, semantik pengiriman, dan kontrak bertipe.
  </Tab>
  <Tab title="Lapisan Plugin vendor">
    API khusus vendor, auth, katalog model, sintesis speech, pembuatan gambar, backend video mendatang, endpoint penggunaan.
  </Tab>
  <Tab title="Lapisan Plugin kanal/fitur">
    Integrasi Slack/Discord/voice-call/dll. yang memakai capability core dan menyajikannya pada sebuah permukaan.
  </Tab>
</Tabs>

Misalnya, TTS mengikuti bentuk ini:

- core memiliki kebijakan TTS saat membalas, urutan fallback, preferensi, dan pengiriman kanal
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` memakai helper runtime TTS telefoni

Pola yang sama harus diutamakan untuk capability mendatang.

### Contoh Plugin perusahaan multi-capability

Plugin perusahaan harus terasa kohesif dari luar. Jika OpenClaw memiliki kontrak bersama untuk model, speech, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan video, fetch web, dan pencarian web, vendor dapat memiliki semua permukaannya di satu tempat:

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
- core tetap memiliki kontrak capability
- kanal dan Plugin fitur memakai helper `api.runtime.*`, bukan kode vendor
- pengujian kontrak dapat menegaskan bahwa Plugin mendaftarkan capability yang diklaimnya dimiliki

### Contoh capability: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu capability bersama. Model kepemilikan yang sama berlaku di sana:

<Steps>
  <Step title="Core mendefinisikan kontrak">
    Core mendefinisikan kontrak pemahaman media.
  </Step>
  <Step title="Plugin vendor mendaftar">
    Plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan `describeVideo` sesuai kebutuhan.
  </Step>
  <Step title="Konsumen memakai perilaku bersama">
    Kanal dan Plugin fitur memakai perilaku core bersama alih-alih menghubungkan langsung ke kode vendor.
  </Step>
</Steps>

Itu menghindari memasukkan asumsi video satu penyedia ke dalam core. Plugin memiliki permukaan vendor; core memiliki kontrak capability dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: core memiliki kontrak capability bertipe dan helper runtime, dan Plugin vendor mendaftarkan implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh checklist rollout konkret? Lihat [Cookbook Capability](/id/plugins/architecture).

## Kontrak dan penegakan

Permukaan API Plugin sengaja dibuat bertipe dan terpusat di `OpenClawPluginApi`. Kontrak itu mendefinisikan titik pendaftaran yang didukung dan helper runtime yang boleh diandalkan oleh Plugin.

Mengapa ini penting:

- penulis Plugin mendapatkan satu standar internal yang stabil
- core dapat menolak kepemilikan duplikat seperti dua Plugin yang mendaftarkan id penyedia yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk pendaftaran yang salah bentuk
- pengujian kontrak dapat menegakkan kepemilikan Plugin bawaan dan mencegah drift diam-diam

Ada dua lapisan penegakan:

<AccordionGroup>
  <Accordion title="Penegakan registrasi runtime">
    Registri plugin memvalidasi pendaftaran saat plugin dimuat. Contoh: id penyedia duplikat, id penyedia ucapan duplikat, dan pendaftaran yang tidak valid menghasilkan diagnostik plugin, bukan perilaku yang tidak terdefinisi.
  </Accordion>
  <Accordion title="Pengujian kontrak">
    Plugin bawaan ditangkap dalam registri kontrak selama pengujian berjalan sehingga OpenClaw dapat menegaskan kepemilikan secara eksplisit. Saat ini ini digunakan untuk penyedia model, penyedia ucapan, penyedia pencarian web, dan kepemilikan pendaftaran bawaan.
  </Accordion>
</AccordionGroup>

Efek praktisnya adalah OpenClaw mengetahui sejak awal plugin mana yang memiliki permukaan mana. Ini memungkinkan core dan channel tersusun dengan lancar karena kepemilikan dideklarasikan, bertipe, dan dapat diuji, bukan implisit.

### Apa yang termasuk dalam kontrak

<Tabs>
  <Tab title="Kontrak yang baik">
    - bertipe
    - kecil
    - spesifik untuk kapabilitas
    - dimiliki oleh core
    - dapat digunakan kembali oleh beberapa plugin
    - dapat dikonsumsi oleh channel/fitur tanpa pengetahuan vendor

  </Tab>
  <Tab title="Kontrak yang buruk">
    - kebijakan spesifik vendor yang tersembunyi di core
    - celah khusus sekali pakai untuk plugin yang melewati registri
    - kode channel yang langsung mengakses implementasi vendor
    - objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau `api.runtime`

  </Tab>
</Tabs>

Jika ragu, naikkan tingkat abstraksinya: definisikan kapabilitas terlebih dahulu, lalu biarkan plugin terhubung ke dalamnya.

## Model eksekusi

Plugin native OpenClaw berjalan **dalam proses** bersama Gateway. Plugin tersebut tidak di-sandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses yang sama dengan kode core.

<Warning>
Implikasi plugin native: plugin dapat mendaftarkan alat, handler jaringan, hook, dan layanan; bug plugin dapat membuat gateway crash atau tidak stabil; dan plugin native berbahaya setara dengan eksekusi kode arbitrer di dalam proses OpenClaw.
</Warning>

Bundel yang kompatibel lebih aman secara default karena OpenClaw saat ini memperlakukannya sebagai paket metadata/konten. Dalam rilis saat ini, itu sebagian besar berarti Skills bawaan.

Gunakan allowlist dan jalur instal/muat eksplisit untuk plugin non-bawaan. Perlakukan plugin workspace sebagai kode waktu pengembangan, bukan default produksi.

Untuk nama paket workspace bawaan, pertahankan id plugin tertambat pada nama npm: `@openclaw/<id>` secara default, atau suffix bertipe yang disetujui seperti `-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` ketika paket tersebut sengaja mengekspos peran plugin yang lebih sempit.

<Note>
**Catatan kepercayaan:** `plugins.allow` mempercayai **id plugin**, bukan asal sumber. Plugin workspace dengan id yang sama seperti plugin bawaan secara sengaja membayangi salinan bawaan ketika plugin workspace tersebut diaktifkan/di-allowlist. Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix. Kepercayaan plugin bawaan diselesaikan dari snapshot sumber — manifest dan kode di disk saat waktu muat — bukan dari metadata instalasi. Catatan instalasi yang rusak atau diganti tidak dapat secara diam-diam memperluas permukaan kepercayaan plugin bawaan melampaui yang diklaim oleh sumber aktualnya.
</Note>

## Batas ekspor

OpenClaw mengekspor kapabilitas, bukan kemudahan implementasi.

Pertahankan pendaftaran kapabilitas tetap publik. Pangkas ekspor helper non-kontrak:

- subpath helper spesifik plugin bawaan
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper kemudahan spesifik vendor
- helper penyiapan/onboarding yang merupakan detail implementasi

Subpath helper plugin bawaan yang dicadangkan telah dihentikan dari peta ekspor SDK yang dihasilkan. Pertahankan helper spesifik pemilik di dalam paket plugin pemiliknya; promosikan hanya perilaku host yang dapat digunakan kembali ke kontrak SDK generik seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.

## Internal dan referensi

Untuk pipeline pemuatan, model registri, hook runtime penyedia, rute HTTP Gateway, skema alat pesan, resolusi target channel, katalog penyedia, plugin mesin konteks, dan panduan untuk menambahkan kapabilitas baru, lihat [Internal arsitektur Plugin](/id/plugins/architecture-internals).

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Manifest Plugin](/id/plugins/manifest)
- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
