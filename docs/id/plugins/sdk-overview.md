---
read_when:
    - Anda perlu mengetahui dari subjalur SDK mana harus mengimpor
    - Anda ingin referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar SDK Plugin
x-i18n:
    generated_at: "2026-04-30T10:03:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin adalah kontrak bertipe antara Plugin dan core. Halaman ini adalah
referensi untuk **apa yang diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini ditujukan bagi penulis Plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [OpenClaw App SDK](/id/concepts/openclaw-sdk) dan paket `@openclaw/sdk`
  sebagai gantinya.
</Note>

<Tip>
Mencari panduan cara penggunaan? Mulailah dengan [Membangun Plugin](/id/plugins/building-plugins), gunakan [Plugin saluran](/id/plugins/sdk-channel-plugins) untuk Plugin saluran, [Plugin penyedia](/id/plugins/sdk-provider-plugins) untuk Plugin penyedia, dan [Hook Plugin](/id/plugins/hooks) untuk Plugin hook alat atau siklus hidup.
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah dependensi melingkar. Untuk helper entri/build khusus saluran,
utamakan `openclaw/plugin-sdk/channel-core`; gunakan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi saluran, publikasikan JSON Schema milik saluran melalui
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
ditujukan untuk primitif skema bersama dan builder generik. Plugin bawaan OpenClaw
menggunakan `plugin-sdk/bundled-channel-config-schema` untuk skema saluran bawaan
yang dipertahankan. Ekspor kompatibilitas yang tidak digunakan lagi tetap ada di
`plugin-sdk/channel-config-schema-legacy`; tidak satu pun subpath skema bawaan menjadi
pola untuk Plugin baru.

<Warning>
  Jangan impor seam kemudahan bermerek penyedia atau saluran (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` mereka sendiri; konsumen core sebaiknya menggunakan barrel lokal
  Plugin tersebut atau menambahkan kontrak SDK generik yang sempit ketika kebutuhannya benar-benar
  lintas saluran.

Sejumlah kecil seam helper Plugin bawaan masih muncul di peta ekspor yang dihasilkan
ketika memiliki penggunaan pemilik yang terlacak. Seam tersebut hanya ada untuk
pemeliharaan Plugin bawaan dan tidak direkomendasikan sebagai path impor untuk
Plugin pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account` juga
dipertahankan sebagai facade kompatibilitas yang tidak digunakan lagi untuk penggunaan pemilik yang terlacak. Jangan
menyalin path impor tersebut ke Plugin baru; gunakan helper runtime yang diinjeksi dan
subpath SDK saluran generik sebagai gantinya.
</Warning>

## Referensi subpath

SDK Plugin diekspos sebagai kumpulan subpath sempit yang dikelompokkan berdasarkan area (entri Plugin,
saluran, penyedia, auth, runtime, kapabilitas, memori, dan helper
Plugin bawaan yang dicadangkan). Untuk katalog lengkap — dikelompokkan dan ditautkan — lihat
[Subpath SDK Plugin](/id/plugins/sdk-subpaths).

Daftar yang dihasilkan berisi 200+ subpath berada di `scripts/lib/plugin-sdk-entrypoints.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode-metode
berikut:

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                       |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                   |
| `api.registerAgentHarness(...)`                  | Eksekutor agen tingkat rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal            |
| `api.registerChannel(...)`                       | Saluran pesan                          |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming         |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks            |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video            |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                       |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                        |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                        |
| `api.registerWebFetchProvider(...)`              | Penyedia web fetch / scrape            |
| `api.registerWebSearchProvider(...)`             | Pencarian web                          |

### Alat dan perintah

| Metode                         | Yang didaftarkan                              |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Alat agen (wajib atau `{ optional: true }`)   |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)                |

Perintah Plugin dapat mengatur `agentPromptGuidance` ketika agen memerlukan petunjuk routing singkat
milik perintah. Jaga teks tersebut tetap tentang perintah itu sendiri; jangan tambahkan
kebijakan khusus penyedia atau Plugin ke builder prompt core.

### Infrastruktur

| Metode                                         | Yang didaftarkan                         |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook peristiwa                            |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                     |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway                        |
| `api.registerGatewayDiscoveryService(service)` | Pengiklan discovery Gateway lokal         |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                           |
| `api.registerService(service)`                 | Layanan latar belakang                    |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                        |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware hasil alat runtime             |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt tambahan yang berdekatan dengan memori |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memori tambahan     |

### Hook host untuk Plugin alur kerja

Hook host adalah seam SDK untuk Plugin yang perlu berpartisipasi dalam siklus hidup host
alih-alih hanya menambahkan penyedia, saluran, atau alat. Hook ini adalah
kontrak generik; Mode Rencana dapat menggunakannya, begitu juga alur kerja persetujuan,
gerbang kebijakan workspace, monitor latar belakang, wizard penyiapan, dan Plugin pendamping UI.

| Metode                                                                   | Kontrak yang dimilikinya                                                            |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | State sesi kompatibel JSON milik Plugin yang diproyeksikan melalui sesi Gateway      |
| `api.enqueueNextTurnInjection(...)`                                      | Konteks tahan lama exactly-once yang diinjeksi ke giliran agen berikutnya untuk satu sesi |
| `api.registerTrustedToolPolicy(...)`                                     | Kebijakan alat pra-Plugin bawaan/tepercaya yang dapat memblokir atau menulis ulang param alat |
| `api.registerToolMetadata(...)`                                          | Metadata tampilan katalog alat tanpa mengubah implementasi alat                     |
| `api.registerCommand(...)`                                               | Perintah Plugin terskopes; hasil perintah dapat mengatur `continueAgent: true`       |
| `api.registerControlUiDescriptor(...)`                                   | Deskriptor kontribusi Control UI untuk permukaan sesi, alat, run, atau pengaturan   |
| `api.registerRuntimeLifecycle(...)`                                      | Callback pembersihan untuk resource runtime milik Plugin pada path reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Langganan peristiwa yang disanitasi untuk state alur kerja dan monitor              |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | State scratch Plugin per run yang dibersihkan pada siklus hidup run terminal        |
| `api.registerSessionSchedulerJob(...)`                                   | Catatan pekerjaan scheduler sesi milik Plugin dengan pembersihan deterministik      |

Kontrak ini sengaja memisahkan otoritas:

- Plugin eksternal dapat memiliki ekstensi sesi, deskriptor UI, perintah, metadata alat,
  injeksi giliran berikutnya, dan hook normal.
- Kebijakan alat tepercaya berjalan sebelum hook `before_tool_call` biasa dan bersifat
  hanya bawaan karena berpartisipasi dalam kebijakan keamanan host.
- Kepemilikan perintah yang dicadangkan bersifat hanya bawaan. Plugin eksternal sebaiknya menggunakan
  nama perintah atau alias mereka sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang memutasi prompt termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  field prompt dari `before_agent_start` lama, dan
  `enqueueNextTurnInjection`.

Contoh konsumen non-Rencana:

| Arketipe Plugin             | Hook yang digunakan                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Alur kerja persetujuan      | Ekstensi sesi, kelanjutan perintah, injeksi giliran berikutnya, deskriptor UI                                                        |
| Gerbang kebijakan anggaran/workspace | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                        |
| Monitor siklus hidup latar belakang | Pembersihan siklus hidup runtime, langganan peristiwa agen, kepemilikan/pembersihan scheduler sesi, kontribusi prompt heartbeat, deskriptor UI |
| Wizard penyiapan atau onboarding | Ekstensi sesi, perintah terskopes, deskriptor Control UI                                                                         |

<Note>
  Namespace admin core yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, bahkan jika Plugin mencoba menetapkan
  scope metode gateway yang lebih sempit. Utamakan prefiks khusus Plugin untuk
  metode milik Plugin.
</Note>

<Accordion title="Kapan menggunakan middleware hasil alat">
  Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)` ketika
  mereka perlu menulis ulang hasil alat setelah eksekusi dan sebelum runtime
  memasukkan hasil tersebut kembali ke model. Ini adalah seam tepercaya yang netral runtime
  untuk reducer output asinkron seperti tokenjuice.

Plugin bawaan harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk setiap
runtime yang ditargetkan, misalnya `["pi", "codex"]`. Plugin eksternal
tidak dapat mendaftarkan middleware ini; gunakan hook Plugin OpenClaw normal untuk pekerjaan
yang tidak membutuhkan timing hasil alat pra-model. Path pendaftaran factory ekstensi tertanam
khusus Pi yang lama telah dihapus.
</Accordion>

### Pendaftaran discovery Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan Plugin mengiklankan Gateway aktif
pada transport discovery lokal seperti mDNS/Bonjour. OpenClaw memanggil
layanan tersebut selama startup Gateway ketika discovery lokal diaktifkan, meneruskan
port Gateway saat ini dan data petunjuk TXT non-rahasia, serta memanggil handler
`stop` yang dikembalikan selama shutdown Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Plugin penemuan Gateway tidak boleh memperlakukan nilai TXT yang diiklankan sebagai rahasia atau
autentikasi. Penemuan adalah petunjuk perutean; autentikasi Gateway dan penyematan TLS tetap
menjadi pemilik kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata tingkat atas:

- `commands`: root perintah eksplisit yang dimiliki oleh registrar
- `descriptors`: deskriptor perintah waktu parsing yang digunakan untuk bantuan CLI root,
  perutean, dan pendaftaran CLI Plugin secara lazy

Jika Anda ingin perintah Plugin tetap dimuat secara lazy di jalur CLI root normal,
sediakan `descriptors` yang mencakup setiap root perintah tingkat atas yang diekspos oleh
registrar tersebut.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` saja hanya ketika Anda tidak memerlukan pendaftaran CLI root yang lazy.
Jalur kompatibilitas eager tersebut tetap didukung, tetapi tidak memasang
placeholder berbasis deskriptor untuk pemuatan lazy saat waktu parsing.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan Plugin memiliki konfigurasi default untuk backend
CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi awalan penyedia dalam ref model seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default Plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalkan bentuk flag lama).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` agar mesin dapat menyesuaikan tambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memori                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                                                                                                                                    |

### Adapter embedding memori

| Metode                                         | Yang didaftarkan                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk Plugin aktif |

- `registerMemoryCapability` adalah API Plugin memori eksklusif yang disarankan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  agar Plugin pendamping dapat memakai artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih masuk ke tata letak privat
  Plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API Plugin memori eksklusif yang kompatibel dengan legacy.
- `MemoryFlushPlan.model` dapat menyematkan giliran flush ke referensi `provider/model`
  yang persis, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai fallback aktif.
- `registerMemoryEmbeddingProvider` memungkinkan Plugin memori aktif mendaftarkan satu
  atau beberapa id adapter embedding (misalnya `openai`, `gemini`, atau id khusus
  yang ditentukan Plugin).
- Konfigurasi pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diselesaikan terhadap id adapter yang terdaftar tersebut.

### Peristiwa dan siklus hidup

| Metode                                       | Yang dilakukan                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe          |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan |

Lihat [Hook Plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan semantik guard.

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.
- `message_received`: gunakan bidang bertipe `threadId` ketika Anda memerlukan perutean thread/topik masuk. Simpan `metadata` untuk ekstra khusus channel.
- `message_sending`: gunakan bidang perutean bertipe `replyToId` / `threadId` sebelum fallback ke `metadata` khusus channel.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status startup milik Gateway alih-alih bergantung pada hook internal `gateway:startup`.
- `cron_changed`: amati perubahan siklus hidup Cron milik Gateway. Gunakan `event.job?.state?.nextRunAtMs` dan `ctx.getCron?.()` saat menyinkronkan penjadwal bangun eksternal, dan pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

### Bidang objek API

| Bidang                    | Tipe                      | Deskripsi                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id Plugin                                                                                   |
| `api.name`               | `string`                  | Nama tampilan                                                                                |
| `api.version`            | `string?`                 | Versi Plugin (opsional)                                                                   |
| `api.description`        | `string?`                 | Deskripsi Plugin (opsional)                                                               |
| `api.source`             | `string`                  | Jalur sumber Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root Plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori aktif saat tersedia)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus Plugin dari `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger tercakup (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Menyelesaikan jalur relatif terhadap root Plugin                                                        |

## Konvensi modul internal

Di dalam Plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Jangan pernah mengimpor Plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanyalah kontrak eksternal.
</Warning>

Permukaan publik Plugin bawaan yang dimuat facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) mengutamakan
snapshot konfigurasi runtime aktif ketika OpenClaw sudah berjalan. Jika belum ada snapshot
runtime, permukaan tersebut fallback ke file konfigurasi yang diselesaikan di disk.
Facade Plugin bawaan terpaket harus dimuat melalui loader facade Plugin
OpenClaw; impor langsung dari `dist/extensions/...` melewati mirror dependensi runtime bertahap
yang digunakan instalasi terpaket untuk dependensi milik Plugin.

Plugin penyedia dapat mengekspos barrel kontrak lokal Plugin yang sempit ketika
helper sengaja khusus penyedia dan belum termasuk dalam subpath SDK generik.
Contoh bawaan:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper stream Claude
  beta-header dan `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor builder penyedia,
  helper model default, dan builder penyedia realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor builder penyedia
  beserta helper onboarding/konfigurasi.

<Warning>
  Kode produksi ekstensi juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar dibagikan, promosikan ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  berorientasi kapabilitas lainnya alih-alih menggandengkan dua Plugin.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/id/plugins/sdk-runtime">
    Referensi namespace lengkap `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/id/plugins/sdk-setup">
    Pemaketan, manifes, dan skema konfigurasi.
  </Card>
  <Card title="Testing" icon="vial" href="/id/plugins/sdk-testing">
    Utilitas pengujian dan aturan lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/id/plugins/sdk-migration">
    Bermigrasi dari permukaan yang tidak digunakan lagi.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/id/plugins/architecture">
    Arsitektur mendalam dan model kapabilitas.
  </Card>
</CardGroup>
