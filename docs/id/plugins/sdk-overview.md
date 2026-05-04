---
read_when:
    - Anda perlu mengetahui subjalur SDK mana yang harus digunakan untuk impor
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Gambaran umum Plugin SDK
x-i18n:
    generated_at: "2026-05-04T18:24:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin adalah kontrak bertipe antara Plugin dan inti. Halaman ini adalah
referensi untuk **apa yang perlu diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini untuk penulis Plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [SDK Aplikasi OpenClaw](/id/concepts/openclaw-sdk) dan paket `@openclaw/sdk`
  sebagai gantinya.
</Note>

<Tip>
Mencari panduan cara penggunaan? Mulailah dengan [Membangun Plugin](/id/plugins/building-plugins), gunakan [Plugin channel](/id/plugins/sdk-channel-plugins) untuk Plugin channel, [Plugin provider](/id/plugins/sdk-provider-plugins) untuk Plugin provider, dan [Hook Plugin](/id/plugins/hooks) untuk Plugin hook alat atau siklus hidup.
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah dependensi melingkar. Untuk helper entry/build khusus channel,
utamakan `openclaw/plugin-sdk/channel-core`; gunakan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi channel, publikasikan JSON Schema milik channel melalui
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
ditujukan untuk primitif skema bersama dan builder generik. Plugin bawaan OpenClaw
menggunakan `plugin-sdk/bundled-channel-config-schema` untuk skema channel bawaan
yang dipertahankan. Ekspor kompatibilitas yang tidak digunakan lagi tetap ada di
`plugin-sdk/channel-config-schema-legacy`; tidak satu pun subpath skema bawaan ini
menjadi pola untuk Plugin baru.

<Warning>
  Jangan impor seam kemudahan bermerek provider atau channel (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` milik mereka sendiri; konsumen inti harus menggunakan barrel lokal Plugin tersebut
  atau menambahkan kontrak SDK generik yang sempit ketika kebutuhan benar-benar
  lintas-channel.

Sekumpulan kecil seam helper Plugin bawaan masih muncul di peta ekspor yang dihasilkan
ketika seam tersebut memiliki penggunaan pemilik yang terlacak. Seam tersebut ada hanya untuk pemeliharaan
Plugin bawaan dan tidak direkomendasikan sebagai path impor untuk Plugin pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account` juga
dipertahankan sebagai facade kompatibilitas yang tidak digunakan lagi untuk penggunaan pemilik yang terlacak. Jangan
menyalin path impor tersebut ke Plugin baru; gunakan helper runtime yang diinjeksi dan
subpath SDK channel generik sebagai gantinya.
</Warning>

## Referensi subpath

SDK Plugin diekspos sebagai sekumpulan subpath sempit yang dikelompokkan menurut area (entry Plugin,
channel, provider, auth, runtime, capability, memory, dan helper
Plugin bawaan yang dicadangkan). Untuk katalog lengkap — dikelompokkan dan ditautkan — lihat
[Subpath SDK Plugin](/id/plugins/sdk-subpaths).

Daftar 200+ subpath yang dihasilkan berada di `scripts/lib/plugin-sdk-entrypoints.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode berikut:

### Pendaftaran capability

| Metode                                           | Yang didaftarkan                       |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                   |
| `api.registerAgentHarness(...)`                  | Eksekutor agen level rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal            |
| `api.registerChannel(...)`                       | Channel pesan                          |
| `api.registerSpeechProvider(...)`                | Sintesis teks-ke-ucapan / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming         |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara realtime dupleks            |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video            |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                       |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                        |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                        |
| `api.registerWebFetchProvider(...)`              | Provider pengambilan / scrape web      |
| `api.registerWebSearchProvider(...)`             | Pencarian web                          |

### Alat dan perintah

| Metode                         | Yang didaftarkan                                  |
| ------------------------------ | ------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Alat agen (wajib atau `{ optional: true }`)       |
| `api.registerCommand(def)`     | Perintah kustom (melewati LLM)                    |

Perintah Plugin dapat menetapkan `agentPromptGuidance` ketika agen membutuhkan petunjuk routing singkat
milik perintah. Pertahankan teks itu tentang perintah itu sendiri; jangan tambahkan
kebijakan khusus provider atau Plugin ke builder prompt inti.

### Infrastruktur

| Metode                                         | Yang didaftarkan                         |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook event                               |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                    |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway                       |
| `api.registerGatewayDiscoveryService(service)` | Pengiklan discovery Gateway lokal        |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                          |
| `api.registerService(service)`                 | Layanan latar belakang                   |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                       |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware hasil alat runtime            |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt tambahan yang berdekatan dengan memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memory tambahan    |

### Hook host untuk Plugin workflow

Hook host adalah seam SDK untuk Plugin yang perlu berpartisipasi dalam siklus hidup host
alih-alih hanya menambahkan provider, channel, atau alat. Hook ini adalah
kontrak generik; Plan Mode dapat menggunakannya, begitu juga workflow persetujuan,
gate kebijakan workspace, monitor latar belakang, wizard setup, dan Plugin pendamping UI.

| Metode                                                                   | Kontrak yang dimilikinya                                                                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | State sesi milik Plugin yang kompatibel dengan JSON dan diproyeksikan melalui sesi Gateway                                          |
| `api.enqueueNextTurnInjection(...)`                                      | Konteks exactly-once yang tahan lama, diinjeksi ke giliran agen berikutnya untuk satu sesi                                          |
| `api.registerTrustedToolPolicy(...)`                                     | Kebijakan alat pra-Plugin bawaan/tepercaya yang dapat memblokir atau menulis ulang params alat                                     |
| `api.registerToolMetadata(...)`                                          | Metadata tampilan katalog alat tanpa mengubah implementasi alat                                                                     |
| `api.registerCommand(...)`                                               | Perintah Plugin berscope; hasil perintah dapat menetapkan `continueAgent: true`; perintah native Discord mendukung `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Descriptor kontribusi Control UI untuk permukaan sesi, alat, run, atau pengaturan                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | Callback cleanup untuk resource runtime milik Plugin pada path reset/delete/reload                                                  |
| `api.registerAgentEventSubscription(...)`                                | Langganan event yang disanitasi untuk state workflow dan monitor                                                                    |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | State scratch Plugin per-run yang dibersihkan pada siklus hidup run terminal                                                       |
| `api.registerSessionSchedulerJob(...)`                                   | Record pekerjaan scheduler sesi milik Plugin dengan cleanup deterministik                                                          |

Kontrak ini sengaja membagi otoritas:

- Plugin eksternal dapat memiliki ekstensi sesi, descriptor UI, perintah, metadata alat,
  injeksi giliran berikutnya, dan hook normal.
- Kebijakan alat tepercaya berjalan sebelum hook `before_tool_call` biasa dan
  hanya untuk bawaan karena berpartisipasi dalam kebijakan keamanan host.
- Kepemilikan perintah yang dicadangkan hanya untuk bawaan. Plugin eksternal harus menggunakan
  nama perintah atau alias mereka sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang mengubah prompt termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  field prompt dari `before_agent_start` legacy, dan
  `enqueueNextTurnInjection`.

Contoh konsumen non-Plan:

| Arketipe Plugin              | Hook yang digunakan                                                                                                                 |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Workflow persetujuan         | Ekstensi sesi, kelanjutan perintah, injeksi giliran berikutnya, descriptor UI                                                       |
| Gate kebijakan anggaran/workspace | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                           |
| Monitor siklus hidup latar belakang | Cleanup siklus hidup runtime, langganan event agen, kepemilikan/cleanup scheduler sesi, kontribusi prompt Heartbeat, descriptor UI |
| Wizard setup atau onboarding | Ekstensi sesi, perintah berscope, descriptor Control UI                                                                             |

<Note>
  Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, meskipun Plugin mencoba menetapkan
  scope metode Gateway yang lebih sempit. Utamakan prefiks khusus Plugin untuk
  metode milik Plugin.
</Note>

<Accordion title="Kapan menggunakan middleware hasil alat">
  Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)` ketika
  mereka perlu menulis ulang hasil alat setelah eksekusi dan sebelum runtime
  memasukkan hasil tersebut kembali ke model. Ini adalah seam tepercaya yang netral terhadap runtime
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
service selama startup Gateway ketika discovery lokal diaktifkan, meneruskan
port Gateway saat ini dan data petunjuk TXT non-rahasia, lalu memanggil handler
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

Plugin discovery Gateway tidak boleh memperlakukan nilai TXT yang diiklankan sebagai rahasia atau
autentikasi. Discovery adalah petunjuk perutean; autentikasi Gateway dan penyematan TLS tetap
memiliki kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata tingkat atas:

- `commands`: root perintah eksplisit yang dimiliki oleh registrar
- `descriptors`: deskriptor perintah waktu parse yang digunakan untuk bantuan CLI root,
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

Gunakan `commands` saja hanya ketika Anda tidak memerlukan pendaftaran CLI root secara lazy.
Jalur kompatibilitas eager itu tetap didukung, tetapi tidak memasang
placeholder berbasis deskriptor untuk pemuatan lazy waktu parse.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan Plugin memiliki config default untuk backend
CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefiks provider dalam referensi model seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama dengan `agents.defaults.cliBackends.<id>`.
- Config pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default Plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalisasi bentuk flag lama).
- Gunakan `resolveExecutionArgs` untuk penulisan ulang argv bercakupan permintaan yang termasuk dalam
  dialek CLI, seperti memetakan tingkat berpikir OpenClaw ke flag upaya native.

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` sehingga mesin dapat menyesuaikan penambahan prompt. |
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
  sehingga Plugin pendamping dapat mengonsumsi artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih mengakses layout privat
  Plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API Plugin memori eksklusif yang kompatibel dengan legacy.
- `MemoryFlushPlan.model` dapat menyematkan giliran flush ke referensi `provider/model`
  persis, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai fallback aktif.
- `registerMemoryEmbeddingProvider` memungkinkan Plugin memori aktif mendaftarkan satu
  atau lebih id adapter embedding (misalnya `openai`, `gemini`, atau id kustom
  yang ditentukan Plugin).
- Config pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diselesaikan terhadap id adapter
  yang terdaftar tersebut.

### Event dan siklus hidup

| Metode                                       | Yang dilakukan                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe          |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan |

Lihat [Hook Plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan semantik guard.

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun mengaturnya, handler berprioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun mengaturnya, handler berprioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler berprioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun mengaturnya, handler berprioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.
- `message_received`: gunakan field bertipe `threadId` ketika Anda memerlukan perutean thread/topik masuk. Simpan `metadata` untuk tambahan khusus channel.
- `message_sending`: gunakan field perutean bertipe `replyToId` / `threadId` sebelum fallback ke `metadata` khusus channel.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk status startup milik Gateway alih-alih bergantung pada hook internal `gateway:startup`.
- `cron_changed`: amati perubahan siklus hidup Cron milik Gateway. Gunakan `event.job?.state?.nextRunAtMs` dan `ctx.getCron?.()` saat menyinkronkan scheduler bangun eksternal, dan pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

### Field objek API

| Field                    | Tipe                      | Deskripsi                                                                                 |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id Plugin                                                                                   |
| `api.name`               | `string`                  | Nama tampilan                                                                                |
| `api.version`            | `string?`                 | Versi Plugin (opsional)                                                                   |
| `api.description`        | `string?`                 | Deskripsi Plugin (opsional)                                                               |
| `api.source`             | `string`                  | Jalur sumber Plugin                                                                          |
| `api.rootDir`            | `string?`                 | Direktori root Plugin (opsional)                                                            |
| `api.config`             | `OpenClawConfig`          | Snapshot config saat ini (snapshot runtime in-memory aktif jika tersedia)                  |
| `api.pluginConfig`       | `Record<string, unknown>` | Config khusus Plugin dari `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger bercakupan (`debug`, `info`, `warn`, `error`)                                            |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Selesaikan jalur relatif terhadap root Plugin                                                        |

## Konvensi modul internal

Di dalam Plugin Anda, gunakan file barrel lokal untuk import internal:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Jangan pernah mengimpor Plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Rutekan import internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanyalah kontrak eksternal.
</Warning>

Permukaan publik Plugin bundled yang dimuat facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) lebih memilih
snapshot config runtime aktif ketika OpenClaw sudah berjalan. Jika belum ada snapshot
runtime, permukaan tersebut fallback ke file config yang diselesaikan di disk.
Facade Plugin bundled yang dikemas harus dimuat melalui loader facade Plugin
OpenClaw; import langsung dari `dist/extensions/...` melewati pemeriksaan manifest
dan runtime sidecar yang digunakan instalasi terkemas untuk kode milik Plugin.

Plugin provider dapat mengekspos barrel kontrak lokal Plugin yang sempit ketika
helper sengaja khusus provider dan belum cocok masuk ke subpath SDK generik.
Contoh bundled:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk header beta Claude
  dan helper stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor builder provider,
  helper model default, dan builder provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor builder provider
  beserta helper onboarding/config.

<Warning>
  Kode produksi extension juga sebaiknya menghindari import `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar digunakan bersama, promosikan ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  berorientasi kapabilitas lain alih-alih menggandengkan dua Plugin.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Titik masuk" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Helper runtime" icon="gears" href="/id/plugins/sdk-runtime">
    Referensi namespace `api.runtime` lengkap.
  </Card>
  <Card title="Penyiapan dan konfigurasi" icon="sliders" href="/id/plugins/sdk-setup">
    Pemaketan, manifes, dan skema konfigurasi.
  </Card>
  <Card title="Pengujian" icon="vial" href="/id/plugins/sdk-testing">
    Utilitas pengujian dan aturan lint.
  </Card>
  <Card title="Migrasi SDK" icon="arrows-turn-right" href="/id/plugins/sdk-migration">
    Bermigrasi dari antarmuka yang sudah tidak digunakan.
  </Card>
  <Card title="Internal Plugin" icon="diagram-project" href="/id/plugins/architecture">
    Arsitektur mendalam dan model kapabilitas.
  </Card>
</CardGroup>
