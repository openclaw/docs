---
read_when:
    - Membangun atau men-debug Plugin OpenClaw native
    - Memahami model kapabilitas Plugin atau batas kepemilikan
    - Mengerjakan pipeline pemuatan Plugin atau registri
    - Mengimplementasikan hook runtime penyedia atau plugin kanal
sidebarTitle: Internals
summary: 'Bagian internal Plugin: model kapabilitas, kepemilikan, kontrak, alur pemuatan, dan pembantu waktu jalan'
title: Bagian internal Plugin
x-i18n:
    generated_at: "2026-04-30T10:00:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

Ini adalah **referensi arsitektur mendalam** untuk sistem Plugin OpenClaw. Untuk panduan praktis, mulai dengan salah satu halaman terfokus di bawah ini.

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/id/tools/plugin">
    Panduan pengguna akhir untuk menambahkan, mengaktifkan, dan memecahkan masalah Plugin.
  </Card>
  <Card title="Building plugins" icon="rocket" href="/id/plugins/building-plugins">
    Tutorial Plugin pertama dengan manifest kerja paling kecil.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/id/plugins/sdk-channel-plugins">
    Bangun Plugin kanal pesan.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/id/plugins/sdk-provider-plugins">
    Bangun Plugin penyedia model.
  </Card>
  <Card title="SDK overview" icon="book" href="/id/plugins/sdk-overview">
    Referensi peta impor dan API pendaftaran.
  </Card>
</CardGroup>

## Model kapabilitas publik

Kapabilitas adalah model **Plugin native** publik di dalam OpenClaw. Setiap Plugin OpenClaw native mendaftar terhadap satu atau beberapa jenis kapabilitas:

| Kapabilitas            | Metode pendaftaran                              | Contoh Plugin                         |
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
| Kanal / pesan          | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Penemuan Gateway       | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Plugin yang mendaftarkan nol kapabilitas tetapi menyediakan hook, alat, layanan penemuan, atau layanan latar belakang adalah Plugin **legacy hook-only**. Pola itu masih didukung sepenuhnya.
</Note>

### Sikap kompatibilitas eksternal

Model kapabilitas telah mendarat di core dan digunakan oleh Plugin bundel/native saat ini, tetapi kompatibilitas Plugin eksternal masih membutuhkan standar yang lebih ketat daripada "itu diekspor, jadi itu beku."

| Situasi Plugin                                   | Panduan                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin eksternal yang sudah ada                  | Pertahankan integrasi berbasis hook tetap berfungsi; ini adalah baseline kompatibilitas.         |
| Plugin bundel/native baru                        | Utamakan pendaftaran kapabilitas eksplisit daripada reach-in khusus vendor atau desain baru yang hanya berbasis hook. |
| Plugin eksternal yang mengadopsi pendaftaran kapabilitas | Diizinkan, tetapi anggap permukaan helper khusus kapabilitas masih berkembang kecuali dokumentasi menandainya stabil. |

Pendaftaran kapabilitas adalah arah yang dituju. Hook legacy tetap menjadi jalur paling aman tanpa kerusakan bagi Plugin eksternal selama transisi. Subpath helper yang diekspor tidak semuanya setara — utamakan kontrak terdokumentasi yang sempit daripada ekspor helper insidental.

### Bentuk Plugin

OpenClaw mengklasifikasikan setiap Plugin yang dimuat ke dalam sebuah bentuk berdasarkan perilaku pendaftaran aktualnya (bukan hanya metadata statis):

<AccordionGroup>
  <Accordion title="plain-capability">
    Mendaftarkan tepat satu jenis kapabilitas (misalnya Plugin khusus penyedia seperti `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Mendaftarkan beberapa jenis kapabilitas (misalnya `openai` memiliki inferensi teks, ucapan, pemahaman media, dan pembuatan gambar).
  </Accordion>
  <Accordion title="hook-only">
    Hanya mendaftarkan hook (bertipe atau kustom), tanpa kapabilitas, alat, perintah, atau layanan.
  </Accordion>
  <Accordion title="non-capability">
    Mendaftarkan alat, perintah, layanan, atau rute tetapi tanpa kapabilitas.
  </Accordion>
</AccordionGroup>

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk Plugin dan rincian kapabilitasnya. Lihat [referensi CLI](/id/cli/plugins#inspect) untuk detail.

### Hook legacy

Hook `before_agent_start` tetap didukung sebagai jalur kompatibilitas untuk Plugin yang hanya berbasis hook. Plugin dunia nyata legacy masih bergantung padanya.

Arah:

- pertahankan agar tetap berfungsi
- dokumentasikan sebagai legacy
- utamakan `before_model_resolve` untuk pekerjaan override model/penyedia
- utamakan `before_prompt_build` untuk pekerjaan mutasi prompt
- hapus hanya setelah penggunaan nyata menurun dan cakupan fixture membuktikan keamanan migrasi

### Sinyal kompatibilitas

Saat menjalankan `openclaw doctor` atau `openclaw plugins inspect <id>`, Anda mungkin melihat salah satu label berikut:

| Sinyal                     | Arti                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfigurasi diparse dengan baik dan Plugin terselesaikan     |
| **compatibility advisory** | Plugin menggunakan pola yang didukung tetapi lebih lama (mis. `hook-only`) |
| **legacy warning**         | Plugin menggunakan `before_agent_start`, yang sudah deprecated |
| **hard error**             | Konfigurasi tidak valid atau Plugin gagal dimuat             |

Baik `hook-only` maupun `before_agent_start` tidak akan merusak Plugin Anda saat ini: `hook-only` bersifat advisory, dan `before_agent_start` hanya memicu peringatan. Sinyal ini juga muncul di `openclaw status --all` dan `openclaw plugins doctor`.

## Ikhtisar arsitektur

Sistem Plugin OpenClaw memiliki empat lapisan:

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw menemukan kandidat Plugin dari path yang dikonfigurasi, root workspace, root Plugin global, dan Plugin bundel. Penemuan membaca manifest native `openclaw.plugin.json` plus manifest bundel yang didukung terlebih dahulu.
  </Step>
  <Step title="Enablement + validation">
    Core memutuskan apakah Plugin yang ditemukan diaktifkan, dinonaktifkan, diblokir, atau dipilih untuk slot eksklusif seperti memori.
  </Step>
  <Step title="Runtime loading">
    Plugin OpenClaw native dimuat in-process melalui jiti dan mendaftarkan kapabilitas ke registry pusat. Bundel yang kompatibel dinormalisasi menjadi record registry tanpa mengimpor kode runtime.
  </Step>
  <Step title="Surface consumption">
    Bagian OpenClaw lainnya membaca registry untuk mengekspos alat, kanal, penyiapan penyedia, hook, rute HTTP, perintah CLI, dan layanan.
  </Step>
</Steps>

Khusus untuk CLI Plugin, penemuan perintah root dibagi menjadi dua fase:

- metadata waktu parse berasal dari `registerCli(..., { descriptors: [...] })`
- modul CLI Plugin yang sebenarnya dapat tetap lazy dan mendaftar saat pemanggilan pertama

Itu menjaga kode CLI milik Plugin tetap di dalam Plugin sambil tetap memungkinkan OpenClaw mencadangkan nama perintah root sebelum parsing.

Batas desain yang penting:

- validasi manifest/konfigurasi harus berfungsi dari **metadata manifest/schema** tanpa mengeksekusi kode Plugin
- penemuan kapabilitas native dapat memuat kode entri Plugin tepercaya untuk membangun snapshot registry non-aktif
- perilaku runtime native berasal dari jalur `register(api)` modul Plugin dengan `api.registrationMode === "full"`

Pemisahan itu memungkinkan OpenClaw memvalidasi konfigurasi, menjelaskan Plugin yang hilang/dinonaktifkan, dan membangun petunjuk UI/schema sebelum runtime penuh aktif.

### Snapshot metadata Plugin dan tabel lookup

Startup Gateway membangun satu `PluginMetadataSnapshot` untuk snapshot konfigurasi saat ini. Snapshot ini hanya metadata: menyimpan indeks Plugin terpasang, registry manifest, diagnostik manifest, peta pemilik, normalizer id Plugin, dan record manifest. Snapshot tidak menyimpan modul Plugin yang dimuat, SDK penyedia, isi paket, atau ekspor runtime.

Validasi konfigurasi yang sadar Plugin, auto-enable startup, dan bootstrap Plugin Gateway mengonsumsi snapshot itu alih-alih membangun ulang metadata manifest/indeks secara independen. `PluginLookUpTable` diturunkan dari snapshot yang sama dan menambahkan rencana Plugin startup untuk konfigurasi runtime saat ini.

Setelah startup, Gateway mempertahankan snapshot metadata saat ini sebagai produk runtime yang dapat diganti. Penemuan penyedia runtime berulang dapat meminjam snapshot itu alih-alih merekonstruksi indeks terpasang dan registry manifest untuk setiap pass katalog penyedia. Snapshot dibersihkan atau diganti saat Gateway shutdown, perubahan konfigurasi/inventaris Plugin, dan penulisan indeks terpasang; caller kembali ke jalur manifest/indeks dingin saat tidak ada snapshot saat ini yang kompatibel. Pemeriksaan kompatibilitas harus menyertakan root penemuan Plugin seperti `plugins.load.paths` dan workspace agen default, karena Plugin workspace adalah bagian dari cakupan metadata.

Snapshot dan tabel lookup mempertahankan keputusan startup berulang di jalur cepat:

- kepemilikan kanal
- startup kanal tertunda
- id Plugin startup
- kepemilikan penyedia dan backend CLI
- kepemilikan penyedia setup, alias perintah, penyedia katalog model, dan kontrak manifest
- validasi schema konfigurasi Plugin dan schema konfigurasi kanal
- keputusan auto-enable startup

Batas keamanannya adalah penggantian snapshot, bukan mutasi. Bangun ulang snapshot saat konfigurasi, inventaris Plugin, record instalasi, atau kebijakan indeks persisten berubah. Jangan perlakukan ini sebagai registry global mutable yang luas, dan jangan simpan snapshot historis tanpa batas. Pemuatan Plugin runtime tetap terpisah dari snapshot metadata sehingga state runtime usang tidak dapat disembunyikan di balik cache metadata.

Aturan cache didokumentasikan di [internal arsitektur Plugin](/id/plugins/architecture-internals#plugin-cache-boundary): metadata manifest dan penemuan segar kecuali caller memegang snapshot eksplisit, tabel lookup, atau registry manifest untuk flow saat ini. Cache metadata tersembunyi dan TTL wall-clock bukan bagian dari pemuatan Plugin. Hanya cache loader runtime, modul, dan artefak dependensi yang boleh bertahan setelah kode atau artefak terpasang benar-benar dimuat.

Beberapa caller jalur dingin masih merekonstruksi registry manifest langsung dari indeks Plugin terpasang yang dipersistenkan alih-alih menerima `PluginLookUpTable` Gateway. Jalur itu sekarang merekonstruksi registry sesuai permintaan; utamakan meneruskan tabel lookup saat ini atau registry manifest eksplisit melalui flow runtime saat caller sudah memilikinya.

### Perencanaan aktivasi

Perencanaan aktivasi adalah bagian dari control plane. Caller dapat menanyakan Plugin mana yang relevan untuk perintah, penyedia, kanal, rute, harness agen, atau kapabilitas konkret sebelum memuat registry runtime yang lebih luas.

Planner mempertahankan perilaku manifest saat ini tetap kompatibel:

- field `activation.*` adalah petunjuk planner eksplisit
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, dan hook tetap menjadi fallback kepemilikan manifest
- API planner khusus id tetap tersedia bagi caller yang sudah ada
- API rencana melaporkan label alasan sehingga diagnostik dapat membedakan petunjuk eksplisit dari fallback kepemilikan

<Warning>
Jangan perlakukan `activation` sebagai hook siklus hidup atau pengganti untuk `register(...)`. Ini adalah metadata yang digunakan untuk mempersempit pemuatan. Utamakan bidang kepemilikan ketika bidang tersebut sudah menggambarkan relasinya; gunakan `activation` hanya untuk petunjuk perencana tambahan.
</Warning>

### Plugin kanal dan alat pesan bersama

Plugin kanal tidak perlu mendaftarkan alat kirim/edit/reaksi terpisah untuk tindakan chat normal. OpenClaw mempertahankan satu alat `message` bersama di inti, dan Plugin kanal memiliki penemuan serta eksekusi khusus kanal di belakangnya.

Batas saat ini adalah:

- inti memiliki host alat `message` bersama, pengkabelan prompt, pembukuan sesi/thread, dan dispatch eksekusi
- Plugin kanal memiliki penemuan tindakan terskup, penemuan kapabilitas, dan fragmen skema khusus kanal apa pun
- Plugin kanal memiliki tata bahasa percakapan sesi khusus penyedia, seperti bagaimana id percakapan mengodekan id thread atau mewarisi dari percakapan induk
- Plugin kanal mengeksekusi tindakan akhir melalui adapter tindakannya

Untuk Plugin kanal, permukaan SDK adalah `ChannelMessageActionAdapter.describeMessageTool(...)`. Panggilan penemuan terpadu itu memungkinkan Plugin mengembalikan tindakan yang terlihat, kapabilitas, dan kontribusi skema secara bersama-sama agar bagian-bagian tersebut tidak menyimpang.

Ketika parameter alat pesan khusus kanal membawa sumber media seperti path lokal atau URL media jarak jauh, Plugin juga harus mengembalikan `mediaSourceParams` dari `describeMessageTool(...)`. Inti menggunakan daftar eksplisit itu untuk menerapkan normalisasi path sandbox dan petunjuk akses media keluar tanpa meng-hardcode nama parameter milik Plugin. Utamakan peta berskup tindakan di sana, bukan satu daftar datar selebar kanal, agar parameter media khusus profil tidak dinormalisasi pada tindakan yang tidak terkait seperti `send`.

Inti meneruskan cakupan runtime ke langkah penemuan itu. Bidang penting mencakup:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound tepercaya

Ini penting untuk Plugin yang sensitif konteks. Sebuah kanal dapat menyembunyikan atau mengekspos tindakan pesan berdasarkan akun aktif, ruang/thread/pesan saat ini, atau identitas peminta tepercaya tanpa meng-hardcode cabang khusus kanal di alat `message` inti.

Inilah mengapa perubahan perutean runner tertanam tetap merupakan pekerjaan Plugin: runner bertanggung jawab meneruskan identitas chat/sesi saat ini ke batas penemuan Plugin agar alat `message` bersama mengekspos permukaan milik kanal yang tepat untuk giliran saat ini.

Untuk helper eksekusi milik kanal, Plugin bawaan harus mempertahankan runtime eksekusi di dalam modul ekstensi mereka sendiri. Inti tidak lagi memiliki runtime tindakan pesan Discord, Slack, Telegram, atau WhatsApp di bawah `src/agents/tools`. Kami tidak menerbitkan subpath `plugin-sdk/*-action-runtime` terpisah, dan Plugin bawaan harus mengimpor kode runtime lokal mereka sendiri langsung dari modul milik ekstensi mereka.

Batas yang sama berlaku untuk seam SDK bernama penyedia secara umum: inti tidak boleh mengimpor barrel kemudahan khusus kanal untuk Slack, Discord, Signal, WhatsApp, atau ekstensi serupa. Jika inti membutuhkan suatu perilaku, konsumsi barrel `api.ts` / `runtime-api.ts` milik Plugin bawaan itu sendiri atau promosikan kebutuhan tersebut menjadi kapabilitas generik sempit di SDK bersama.

Plugin bawaan mengikuti aturan yang sama. `runtime-api.ts` milik Plugin bawaan tidak boleh mengekspor ulang facade `openclaw/plugin-sdk/<plugin-id>` bermerek miliknya sendiri. Facade bermerek tersebut tetap menjadi shim kompatibilitas untuk Plugin eksternal dan konsumen lama, tetapi Plugin bawaan harus menggunakan ekspor lokal ditambah subpath SDK generik yang sempit seperti `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store`, atau `openclaw/plugin-sdk/webhook-ingress`. Kode baru tidak boleh menambahkan facade SDK khusus id Plugin kecuali batas kompatibilitas untuk ekosistem eksternal yang sudah ada memerlukannya.

Khusus untuk polling, ada dua jalur eksekusi:

- `outbound.sendPoll` adalah baseline bersama untuk kanal yang cocok dengan model polling umum
- `actions.handleAction("poll")` adalah jalur yang diutamakan untuk semantik polling khusus kanal atau parameter polling tambahan

Inti sekarang menunda parsing polling bersama sampai setelah dispatch polling Plugin menolak tindakan, sehingga handler polling milik Plugin dapat menerima bidang polling khusus kanal tanpa terlebih dahulu diblokir oleh parser polling generik.

Lihat [Internal arsitektur Plugin](/id/plugins/architecture-internals) untuk urutan startup lengkap.

## Model kepemilikan kapabilitas

OpenClaw memperlakukan Plugin native sebagai batas kepemilikan untuk sebuah **perusahaan** atau sebuah **fitur**, bukan sebagai kumpulan integrasi yang tidak terkait.

Artinya:

- Plugin perusahaan biasanya harus memiliki semua permukaan perusahaan tersebut yang menghadap OpenClaw
- Plugin fitur biasanya harus memiliki seluruh permukaan fitur yang diperkenalkannya
- kanal harus mengonsumsi kapabilitas inti bersama alih-alih mengimplementasikan ulang perilaku penyedia secara ad hoc

<AccordionGroup>
  <Accordion title="Multi-kapabilitas vendor">
    `openai` memiliki inferensi teks, ucapan, suara realtime, pemahaman media, dan pembuatan gambar. `google` memiliki inferensi teks ditambah pemahaman media, pembuatan gambar, dan pencarian web. `qwen` memiliki inferensi teks ditambah pemahaman media dan pembuatan video.
  </Accordion>
  <Accordion title="Kapabilitas tunggal vendor">
    `elevenlabs` dan `microsoft` memiliki ucapan; `firecrawl` memiliki pengambilan web; `minimax` / `mistral` / `moonshot` / `zai` memiliki backend pemahaman media.
  </Accordion>
  <Accordion title="Plugin fitur">
    `voice-call` memiliki transport panggilan, alat, CLI, rute, dan bridging media-stream Twilio, tetapi mengonsumsi kapabilitas ucapan bersama, transkripsi realtime, dan suara realtime alih-alih mengimpor Plugin vendor secara langsung.
  </Accordion>
</AccordionGroup>

Keadaan akhir yang dimaksud adalah:

- OpenAI berada dalam satu Plugin meskipun mencakup model teks, ucapan, gambar, dan video masa depan
- vendor lain dapat melakukan hal yang sama untuk area permukaannya sendiri
- kanal tidak peduli Plugin vendor mana yang memiliki penyedia; kanal mengonsumsi kontrak kapabilitas bersama yang diekspos oleh inti

Ini perbedaan utamanya:

- **Plugin** = batas kepemilikan
- **kapabilitas** = kontrak inti yang dapat diimplementasikan atau dikonsumsi oleh beberapa Plugin

Jadi jika OpenClaw menambahkan domain baru seperti video, pertanyaan pertamanya bukan "penyedia mana yang harus meng-hardcode penanganan video?" Pertanyaan pertamanya adalah "apa kontrak kapabilitas video inti?" Setelah kontrak itu ada, Plugin vendor dapat mendaftar terhadapnya dan Plugin kanal/fitur dapat mengonsumsinya.

Jika kapabilitas belum ada, langkah yang tepat biasanya:

<Steps>
  <Step title="Definisikan kapabilitas">
    Definisikan kapabilitas yang hilang di inti.
  </Step>
  <Step title="Ekspos melalui SDK">
    Ekspos melalui API/runtime Plugin dengan cara bertipe.
  </Step>
  <Step title="Kabelkan konsumen">
    Kabelkan kanal/fitur terhadap kapabilitas tersebut.
  </Step>
  <Step title="Implementasi vendor">
    Biarkan Plugin vendor mendaftarkan implementasi.
  </Step>
</Steps>

Ini menjaga kepemilikan tetap eksplisit sambil menghindari perilaku inti yang bergantung pada satu vendor atau jalur kode khusus Plugin sekali pakai.

### Pelapisan kapabilitas

Gunakan model mental ini saat memutuskan di mana kode berada:

<Tabs>
  <Tab title="Lapisan kapabilitas inti">
    Orkestrasi bersama, kebijakan, fallback, aturan penggabungan konfigurasi, semantik pengiriman, dan kontrak bertipe.
  </Tab>
  <Tab title="Lapisan Plugin vendor">
    API khusus vendor, autentikasi, katalog model, sintesis ucapan, pembuatan gambar, backend video masa depan, endpoint penggunaan.
  </Tab>
  <Tab title="Lapisan Plugin kanal/fitur">
    Integrasi Slack/Discord/voice-call/dll. yang mengonsumsi kapabilitas inti dan menyajikannya pada suatu permukaan.
  </Tab>
</Tabs>

Sebagai contoh, TTS mengikuti bentuk ini:

- inti memiliki kebijakan TTS saat balasan, urutan fallback, preferensi, dan pengiriman kanal
- `openai`, `elevenlabs`, dan `microsoft` memiliki implementasi sintesis
- `voice-call` mengonsumsi helper runtime TTS teleponi

Pola yang sama harus diutamakan untuk kapabilitas masa depan.

### Contoh Plugin perusahaan multi-kapabilitas

Plugin perusahaan harus terasa kohesif dari luar. Jika OpenClaw memiliki kontrak bersama untuk model, ucapan, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar, pembuatan video, pengambilan web, dan pencarian web, vendor dapat memiliki semua permukaannya di satu tempat:

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
- tes kontrak dapat menegaskan bahwa Plugin mendaftarkan kapabilitas yang diklaim dimilikinya

### Contoh kapabilitas: pemahaman video

OpenClaw sudah memperlakukan pemahaman gambar/audio/video sebagai satu kapabilitas bersama. Model kepemilikan yang sama berlaku di sana:

<Steps>
  <Step title="Inti mendefinisikan kontrak">
    Inti mendefinisikan kontrak pemahaman media.
  </Step>
  <Step title="Plugin vendor mendaftar">
    Plugin vendor mendaftarkan `describeImage`, `transcribeAudio`, dan `describeVideo` sesuai kebutuhan.
  </Step>
  <Step title="Konsumen menggunakan perilaku bersama">
    Kanal dan Plugin fitur mengonsumsi perilaku inti bersama alih-alih menghubungkan langsung ke kode vendor.
  </Step>
</Steps>

Itu menghindari memasukkan asumsi video satu penyedia ke dalam inti. Plugin memiliki permukaan vendor; inti memiliki kontrak kapabilitas dan perilaku fallback.

Pembuatan video sudah menggunakan urutan yang sama: inti memiliki kontrak kapabilitas bertipe dan helper runtime, dan Plugin vendor mendaftarkan implementasi `api.registerVideoGenerationProvider(...)` terhadapnya.

Butuh checklist rollout konkret? Lihat [Cookbook Kapabilitas](/id/plugins/architecture).

## Kontrak dan penegakan

Permukaan API Plugin sengaja dibuat bertipe dan terpusat di `OpenClawPluginApi`. Kontrak itu mendefinisikan titik pendaftaran yang didukung dan helper runtime yang boleh diandalkan oleh Plugin.

Mengapa ini penting:

- penulis Plugin mendapatkan satu standar internal yang stabil
- inti dapat menolak kepemilikan duplikat seperti dua Plugin yang mendaftarkan id penyedia yang sama
- startup dapat menampilkan diagnostik yang dapat ditindaklanjuti untuk pendaftaran yang salah bentuk
- tes kontrak dapat menegakkan kepemilikan Plugin bawaan dan mencegah penyimpangan diam-diam

Ada dua lapisan penegakan:

<AccordionGroup>
  <Accordion title="Penegakan pendaftaran runtime">
    Registri plugin memvalidasi pendaftaran saat plugin dimuat. Contoh: id penyedia duplikat, id penyedia ucapan duplikat, dan pendaftaran yang tidak valid menghasilkan diagnostik plugin, bukan perilaku yang tidak terdefinisi.
  </Accordion>
  <Accordion title="Pengujian kontrak">
    Plugin bawaan ditangkap dalam registri kontrak selama pengujian berjalan sehingga OpenClaw dapat menegaskan kepemilikan secara eksplisit. Saat ini ini digunakan untuk penyedia model, penyedia ucapan, penyedia pencarian web, dan kepemilikan pendaftaran bawaan.
  </Accordion>
</AccordionGroup>

Efek praktisnya adalah OpenClaw mengetahui sejak awal plugin mana yang memiliki permukaan mana. Itu memungkinkan core dan saluran tersusun dengan mulus karena kepemilikan dideklarasikan, diketik, dan dapat diuji, bukan implisit.

### Apa yang termasuk dalam kontrak

<Tabs>
  <Tab title="Kontrak yang baik">
    - bertipe
    - kecil
    - spesifik kemampuan
    - dimiliki oleh core
    - dapat digunakan ulang oleh beberapa plugin
    - dapat digunakan oleh saluran/fitur tanpa pengetahuan vendor

  </Tab>
  <Tab title="Kontrak yang buruk">
    - kebijakan khusus vendor yang tersembunyi di core
    - jalur keluar plugin sekali pakai yang melewati registri
    - kode saluran yang langsung menjangkau implementasi vendor
    - objek runtime ad hoc yang bukan bagian dari `OpenClawPluginApi` atau `api.runtime`

  </Tab>
</Tabs>

Jika ragu, naikkan tingkat abstraksi: definisikan kemampuannya terlebih dahulu, lalu biarkan plugin terhubung ke dalamnya.

## Model eksekusi

Plugin OpenClaw native berjalan **dalam proses** bersama Gateway. Plugin tersebut tidak di-sandbox. Plugin native yang dimuat memiliki batas kepercayaan tingkat proses yang sama seperti kode core.

<Warning>
Implikasi plugin native: plugin dapat mendaftarkan alat, penangan jaringan, hook, dan layanan; bug plugin dapat membuat gateway crash atau tidak stabil; dan plugin native berbahaya setara dengan eksekusi kode arbitrer di dalam proses OpenClaw.
</Warning>

Bundle yang kompatibel lebih aman secara default karena OpenClaw saat ini memperlakukannya sebagai paket metadata/konten. Dalam rilis saat ini, itu sebagian besar berarti Skills bawaan.

Gunakan allowlist dan jalur instalasi/pemuatan eksplisit untuk plugin non-bawaan. Perlakukan plugin workspace sebagai kode waktu pengembangan, bukan default produksi.

Untuk nama paket workspace bawaan, pertahankan id plugin yang berjangkar pada nama npm: `@openclaw/<id>` secara default, atau akhiran bertipe yang disetujui seperti `-provider`, `-plugin`, `-speech`, `-sandbox`, atau `-media-understanding` ketika paket tersebut sengaja mengekspos peran plugin yang lebih sempit.

<Note>
**Catatan kepercayaan:** `plugins.allow` memercayai **id plugin**, bukan asal sumber. Plugin workspace dengan id yang sama seperti plugin bawaan sengaja membayangi salinan bawaan ketika plugin workspace tersebut diaktifkan/di-allowlist. Ini normal dan berguna untuk pengembangan lokal, pengujian patch, dan hotfix. Kepercayaan plugin bawaan diselesaikan dari snapshot sumber — manifest dan kode di disk pada waktu pemuatan — bukan dari metadata instalasi. Catatan instalasi yang rusak atau diganti tidak dapat secara diam-diam memperluas permukaan kepercayaan plugin bawaan melampaui apa yang diklaim sumber sebenarnya.
</Note>

## Batas ekspor

OpenClaw mengekspor kemampuan, bukan kemudahan implementasi.

Biarkan pendaftaran kemampuan tetap publik. Pangkas ekspor helper non-kontrak:

- subpath helper khusus plugin bawaan
- subpath plumbing runtime yang tidak dimaksudkan sebagai API publik
- helper kemudahan khusus vendor
- helper penyiapan/onboarding yang merupakan detail implementasi

Subpath helper plugin bawaan yang dicadangkan telah dipensiunkan dari peta ekspor SDK yang dihasilkan. Simpan helper khusus pemilik di dalam paket plugin pemiliknya; promosikan hanya perilaku host yang dapat digunakan ulang ke kontrak SDK generik seperti `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, dan `plugin-sdk/plugin-config-runtime`.

## Internal dan referensi

Untuk pipeline pemuatan, model registri, hook runtime penyedia, rute HTTP Gateway, skema alat pesan, resolusi target saluran, katalog penyedia, plugin mesin konteks, dan panduan menambahkan kemampuan baru, lihat [Internal arsitektur plugin](/id/plugins/architecture-internals).

## Terkait

- [Membangun plugin](/id/plugins/building-plugins)
- [Manifest plugin](/id/plugins/manifest)
- [Penyiapan SDK plugin](/id/plugins/sdk-setup)
