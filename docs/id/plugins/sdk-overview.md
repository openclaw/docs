---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus digunakan untuk mengimpor
    - Anda menginginkan referensi untuk semua metode registrasi pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: Plugin SDK overview
summary: Peta impor, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar Plugin SDK
x-i18n:
    generated_at: "2026-05-02T09:29:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin adalah kontrak bertipe antara Plugin dan inti. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Note>
  Halaman ini ditujukan untuk penulis Plugin yang menggunakan `openclaw/plugin-sdk/*` di dalam
  OpenClaw. Untuk aplikasi eksternal, skrip, dasbor, pekerjaan CI, dan ekstensi IDE
  yang ingin menjalankan agen melalui Gateway, gunakan
  [OpenClaw App SDK](/id/concepts/openclaw-sdk) dan paket `@openclaw/sdk`
  sebagai gantinya.
</Note>

<Tip>
Mencari panduan cara penggunaan? Mulailah dengan [Membangun Plugin](/id/plugins/building-plugins), gunakan [Plugin kanal](/id/plugins/sdk-channel-plugins) untuk Plugin kanal, [Plugin penyedia](/id/plugins/sdk-provider-plugins) untuk Plugin penyedia, dan [Hook Plugin](/id/plugins/hooks) untuk Plugin hook alat atau siklus hidup.
</Tip>

## Konvensi impor

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah dependensi sirkular. Untuk helper entri/build khusus kanal,
utamakan `openclaw/plugin-sdk/channel-core`; pertahankan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

Untuk konfigurasi kanal, terbitkan JSON Schema milik kanal melalui
`openclaw.plugin.json#channelConfigs`. Subpath `plugin-sdk/channel-config-schema`
ditujukan untuk primitif skema bersama dan builder generik. Plugin bawaan OpenClaw
menggunakan `plugin-sdk/bundled-channel-config-schema` untuk skema kanal bawaan
yang dipertahankan. Ekspor kompatibilitas yang sudah tidak digunakan tetap ada di
`plugin-sdk/channel-config-schema-legacy`; tidak satu pun subpath skema bawaan
menjadi pola untuk Plugin baru.

<Warning>
  Jangan impor seam kemudahan bermerek penyedia atau kanal (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` mereka sendiri; konsumen inti harus menggunakan barrel lokal Plugin
  tersebut atau menambahkan kontrak SDK generik yang sempit saat kebutuhan benar-benar
  lintas kanal.

Sekumpulan kecil seam helper Plugin bawaan masih muncul di peta ekspor yang dihasilkan
ketika memiliki penggunaan pemilik yang dilacak. Seam tersebut hanya ada untuk
pemeliharaan Plugin bawaan dan bukan path impor yang direkomendasikan untuk Plugin
pihak ketiga baru.

`openclaw/plugin-sdk/discord` dan `openclaw/plugin-sdk/telegram-account` juga
dipertahankan sebagai fasad kompatibilitas yang sudah tidak digunakan untuk penggunaan
pemilik yang dilacak. Jangan salin path impor tersebut ke Plugin baru; gunakan helper
runtime yang diinjeksi dan subpath SDK kanal generik sebagai gantinya.
</Warning>

## Referensi subpath

SDK Plugin diekspos sebagai sekumpulan subpath sempit yang dikelompokkan berdasarkan area (entri
Plugin, kanal, penyedia, auth, runtime, kapabilitas, memori, dan helper
Plugin bawaan yang dicadangkan). Untuk katalog lengkap — dikelompokkan dan ditautkan — lihat
[Subpath SDK Plugin](/id/plugins/sdk-subpaths).

Daftar yang dihasilkan berisi 200+ subpath berada di `scripts/lib/plugin-sdk-entrypoints.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode
berikut:

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                     |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                  |
| `api.registerAgentHarness(...)`                  | Eksekutor agen tingkat rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal           |
| `api.registerChannel(...)`                       | Kanal pesan                           |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi real-time streaming       |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi suara real-time dupleks          |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video           |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                      |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                       |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                       |
| `api.registerWebFetchProvider(...)`              | Penyedia fetch / scrape web           |
| `api.registerWebSearchProvider(...)`             | Pencarian web                         |

### Alat dan perintah

| Metode                          | Yang didaftarkan                             |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Alat agen (wajib atau `{ optional: true }`) |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)             |

Perintah Plugin dapat mengatur `agentPromptGuidance` saat agen membutuhkan petunjuk
routing singkat milik perintah. Pertahankan teks tersebut tentang perintah itu sendiri; jangan tambahkan
kebijakan khusus penyedia atau Plugin ke builder prompt inti.

### Infrastruktur

| Metode                                         | Yang didaftarkan                       |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook peristiwa                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | Metode RPC Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Pengiklan penemuan Gateway lokal       |
| `api.registerCli(registrar, opts?)`            | Subperintah CLI                         |
| `api.registerService(service)`                 | Layanan latar belakang                  |
| `api.registerInteractiveHandler(registration)` | Handler interaktif                      |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware hasil-alat runtime           |
| `api.registerMemoryPromptSupplement(builder)`  | Bagian prompt aditif yang berdekatan dengan memori |
| `api.registerMemoryCorpusSupplement(adapter)`  | Korpus pencarian/baca memori aditif     |

### Hook host untuk Plugin alur kerja

Hook host adalah seam SDK untuk Plugin yang perlu berpartisipasi dalam siklus hidup
host, bukan hanya menambahkan penyedia, kanal, atau alat. Hook ini adalah
kontrak generik; Plan Mode dapat menggunakannya, begitu juga alur kerja persetujuan,
gerbang kebijakan workspace, monitor latar belakang, wizard penyiapan, dan Plugin pendamping UI.

| Metode                                                                   | Kontrak yang dimilikinya                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | State sesi milik Plugin yang kompatibel dengan JSON dan diproyeksikan melalui sesi Gateway                                                    |
| `api.enqueueNextTurnInjection(...)`                                      | Konteks durable exactly-once yang diinjeksi ke giliran agen berikutnya untuk satu sesi                                                    |
| `api.registerTrustedToolPolicy(...)`                                     | Kebijakan alat pra-Plugin bawaan/tepercaya yang dapat memblokir atau menulis ulang parameter alat                                                      |
| `api.registerToolMetadata(...)`                                          | Metadata tampilan katalog alat tanpa mengubah implementasi alat                                                            |
| `api.registerCommand(...)`                                               | Perintah Plugin berscope; hasil perintah dapat mengatur `continueAgent: true`; perintah native Discord mendukung `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Deskriptor kontribusi Control UI untuk permukaan sesi, alat, run, atau pengaturan                                                  |
| `api.registerRuntimeLifecycle(...)`                                      | Callback pembersihan untuk sumber daya runtime milik Plugin pada path reset/delete/reload                                                 |
| `api.registerAgentEventSubscription(...)`                                | Langganan peristiwa tersanitasi untuk state alur kerja dan monitor                                                                     |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | State scratch Plugin per-run yang dibersihkan pada siklus hidup run terminal                                                                    |
| `api.registerSessionSchedulerJob(...)`                                   | Rekaman pekerjaan penjadwal sesi milik Plugin dengan pembersihan deterministik                                                             |

Kontrak sengaja memisahkan otoritas:

- Plugin eksternal dapat memiliki ekstensi sesi, deskriptor UI, perintah, metadata alat, injeksi giliran berikutnya, dan hook normal.
- Kebijakan alat tepercaya berjalan sebelum hook `before_tool_call` biasa dan hanya untuk bawaan karena berpartisipasi dalam kebijakan keselamatan host.
- Kepemilikan perintah yang dicadangkan hanya untuk bawaan. Plugin eksternal harus menggunakan nama perintah atau alias mereka sendiri.
- `allowPromptInjection=false` menonaktifkan hook yang memutasi prompt termasuk
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  field prompt dari `before_agent_start` lama, dan
  `enqueueNextTurnInjection`.

Contoh konsumen non-Plan:

| Arketipe Plugin             | Hook yang digunakan                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Alur kerja persetujuan            | Ekstensi sesi, kelanjutan perintah, injeksi giliran berikutnya, deskriptor UI                                                            |
| Gerbang kebijakan anggaran/workspace | Kebijakan alat tepercaya, metadata alat, proyeksi sesi                                                                                 |
| Monitor siklus hidup latar belakang | Pembersihan siklus hidup runtime, langganan peristiwa agen, kepemilikan/pembersihan penjadwal sesi, kontribusi prompt Heartbeat, deskriptor UI |
| Wizard penyiapan atau onboarding   | Ekstensi sesi, perintah berscope, deskriptor Control UI                                                                              |

<Note>
  Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, meskipun Plugin mencoba menetapkan
  scope metode gateway yang lebih sempit. Utamakan prefiks khusus Plugin untuk
  metode milik Plugin.
</Note>

<Accordion title="Kapan menggunakan middleware hasil-alat">
  Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)` saat
  mereka perlu menulis ulang hasil alat setelah eksekusi dan sebelum runtime
  memasukkan hasil tersebut kembali ke model. Ini adalah seam tepercaya yang netral terhadap runtime
  untuk pereduksi output asinkron seperti tokenjuice.

Plugin bawaan harus mendeklarasikan `contracts.agentToolResultMiddleware` untuk setiap
runtime target, misalnya `["pi", "codex"]`. Plugin eksternal
tidak dapat mendaftarkan middleware ini; pertahankan hook Plugin OpenClaw normal untuk pekerjaan
yang tidak memerlukan timing hasil-alat pra-model. Path pendaftaran factory ekstensi tertanam
khusus Pi yang lama telah dihapus.
</Accordion>

### Pendaftaran penemuan Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan plugin mengiklankan Gateway aktif
pada transport penemuan lokal seperti mDNS/Bonjour. OpenClaw memanggil
layanan selama startup Gateway ketika penemuan lokal diaktifkan, meneruskan
port Gateway saat ini dan data petunjuk TXT non-rahasia, serta memanggil
handler `stop` yang dikembalikan selama shutdown Gateway.

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

Plugin penemuan Gateway tidak boleh memperlakukan nilai TXT yang diiklankan
sebagai rahasia atau autentikasi. Penemuan adalah petunjuk perutean; autentikasi
Gateway dan pinning TLS tetap memiliki kepercayaan.

### Metadata registrasi CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata tingkat atas:

- `commands`: root perintah eksplisit yang dimiliki oleh registrar
- `descriptors`: deskriptor perintah waktu-parse yang digunakan untuk bantuan
  root CLI, perutean, dan registrasi CLI plugin secara malas

Jika Anda ingin perintah plugin tetap dimuat secara malas di jalur root CLI normal,
sediakan `descriptors` yang mencakup setiap root perintah tingkat atas yang
diekspos oleh registrar tersebut.

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

Gunakan `commands` saja hanya ketika Anda tidak memerlukan registrasi root CLI
secara malas. Jalur kompatibilitas eager tersebut tetap didukung, tetapi tidak
memasang placeholder berbasis deskriptor untuk pemuatan malas waktu-parse.

### Registrasi backend CLI

`api.registerCliBackend(...)` memungkinkan plugin memiliki konfigurasi default
untuk backend CLI AI lokal seperti `codex-cli`.

- `id` backend menjadi prefiks provider dalam referensi model seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend memerlukan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalkan bentuk flag lama).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Mesin konteks (satu aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` agar mesin dapat menyesuaikan tambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                               |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memori                                                                                                                            |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                                                                                                                                   |

### Adapter embedding memori

| Metode                                         | Yang didaftarkan                              |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk plugin aktif   |

- `registerMemoryCapability` adalah API plugin memori eksklusif yang disarankan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  agar plugin pendamping dapat memakai artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih masuk ke tata letak privat
  plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API plugin memori eksklusif yang kompatibel dengan legacy.
- `MemoryFlushPlan.model` dapat menyematkan giliran flush ke referensi
  `provider/model` yang persis, seperti `ollama/qwen3:8b`, tanpa mewarisi rantai
  fallback aktif.
- `registerMemoryEmbeddingProvider` memungkinkan plugin memori aktif mendaftarkan satu
  atau beberapa id adapter embedding (misalnya `openai`, `gemini`, atau id kustom
  yang ditentukan plugin).
- Konfigurasi pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diselesaikan terhadap id adapter yang
  terdaftar tersebut.

### Peristiwa dan siklus hidup

| Metode                                       | Yang dilakukan                |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe     |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan   |

Lihat [Hook plugin](/id/plugins/hooks) untuk contoh, nama hook umum, dan semantik guard.

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun mengaturnya, handler dengan prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun mengaturnya, handler dengan prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler dengan prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun mengaturnya, handler dengan prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tanpa keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.
- `message_received`: gunakan field bertipe `threadId` saat Anda memerlukan perutean thread/topik masuk. Pertahankan `metadata` untuk tambahan khusus channel.
- `message_sending`: gunakan field perutean bertipe `replyToId` / `threadId` sebelum fallback ke `metadata` khusus channel.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk state startup milik gateway alih-alih bergantung pada hook internal `gateway:startup`.
- `cron_changed`: amati perubahan siklus hidup cron milik gateway. Gunakan `event.job?.state?.nextRunAtMs` dan `ctx.getCron?.()` saat menyinkronkan penjadwal bangun eksternal, dan pertahankan OpenClaw sebagai sumber kebenaran untuk pemeriksaan jatuh tempo dan eksekusi.

### Field objek API

| Field                    | Tipe                      | Deskripsi                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Id plugin                                                                                  |
| `api.name`               | `string`                  | Nama tampilan                                                                              |
| `api.version`            | `string?`                 | Versi plugin (opsional)                                                                    |
| `api.description`        | `string?`                 | Deskripsi plugin (opsional)                                                                |
| `api.source`             | `string`                  | Jalur sumber plugin                                                                        |
| `api.rootDir`            | `string?`                 | Direktori root plugin (opsional)                                                           |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime dalam memori aktif bila tersedia)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus plugin dari `plugins.entries.<id>.config`                               |
| `api.runtime`            | `PluginRuntime`           | [Helper runtime](/id/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger berscope (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode muat saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Selesaikan jalur relatif terhadap root plugin                                              |

## Konvensi modul internal

Di dalam plugin Anda, gunakan file barrel lokal untuk impor internal:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Jangan pernah mengimpor plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan impor internal melalui `./api.ts` atau
  `./runtime-api.ts`. Jalur SDK hanya kontrak eksternal.
</Warning>

Permukaan publik plugin bawaan yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) lebih memilih
snapshot konfigurasi runtime aktif ketika OpenClaw sudah berjalan. Jika belum ada
snapshot runtime, permukaan tersebut fallback ke file konfigurasi yang diselesaikan di disk.
Facade plugin bawaan dalam paket harus dimuat melalui loader facade plugin
OpenClaw; impor langsung dari `dist/extensions/...` melewati pemeriksaan manifest
dan sidecar runtime yang digunakan instalasi paket untuk kode milik plugin.

Plugin provider dapat mengekspos barrel kontrak lokal plugin yang sempit ketika
helper memang khusus provider dan belum termasuk dalam subpath SDK generik.
Contoh bawaan:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper stream
  beta-header Claude dan `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor builder provider,
  helper model default, dan builder provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor builder provider
  plus helper onboarding/konfigurasi.

<Warning>
  Kode produksi ekstensi juga harus menghindari impor `openclaw/plugin-sdk/<other-plugin>`.
  Jika helper benar-benar dibagikan, promosikan helper tersebut ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  berorientasi kapabilitas lain alih-alih mengikat dua plugin menjadi satu.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Titik masuk" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Pembantu waktu eksekusi" icon="gears" href="/id/plugins/sdk-runtime">
    Referensi namespace `api.runtime` lengkap.
  </Card>
  <Card title="Penyiapan dan konfigurasi" icon="sliders" href="/id/plugins/sdk-setup">
    Pengemasan, manifes, dan skema konfigurasi.
  </Card>
  <Card title="Pengujian" icon="vial" href="/id/plugins/sdk-testing">
    Utilitas pengujian dan aturan lint.
  </Card>
  <Card title="Migrasi SDK" icon="arrows-turn-right" href="/id/plugins/sdk-migration">
    Bermigrasi dari permukaan yang sudah tidak digunakan.
  </Card>
  <Card title="Internal Plugin" icon="diagram-project" href="/id/plugins/architecture">
    Arsitektur mendalam dan model kapabilitas.
  </Card>
</CardGroup>
