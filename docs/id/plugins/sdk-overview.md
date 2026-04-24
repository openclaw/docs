---
read_when:
    - Anda perlu mengetahui subpath SDK mana yang harus diimpor dari sana
    - Anda menginginkan referensi untuk semua metode pendaftaran pada OpenClawPluginApi
    - Anda sedang mencari ekspor SDK tertentu
sidebarTitle: SDK overview
summary: Import map, referensi API pendaftaran, dan arsitektur SDK
title: Ikhtisar SDK Plugin
x-i18n:
    generated_at: "2026-04-24T09:20:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

SDK Plugin adalah kontrak bertipe antara Plugin dan inti. Halaman ini adalah
referensi untuk **apa yang harus diimpor** dan **apa yang dapat Anda daftarkan**.

<Tip>
  Mencari panduan how-to?

- Plugin pertama? Mulai dengan [Membangun Plugin](/id/plugins/building-plugins).
- Channel Plugin? Lihat [Channel plugins](/id/plugins/sdk-channel-plugins).
- Provider Plugin? Lihat [Provider plugins](/id/plugins/sdk-provider-plugins).
  </Tip>

## Konvensi import

Selalu impor dari subpath tertentu:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Setiap subpath adalah modul kecil yang mandiri. Ini menjaga startup tetap cepat dan
mencegah masalah circular dependency. Untuk helper entry/build khusus kanal,
utamakan `openclaw/plugin-sdk/channel-core`; simpan `openclaw/plugin-sdk/core` untuk
permukaan payung yang lebih luas dan helper bersama seperti
`buildChannelConfigSchema`.

<Warning>
  Jangan impor seam kemudahan bermerek provider atau kanal (misalnya
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Plugin bawaan menyusun subpath SDK generik di dalam barrel `api.ts` /
  `runtime-api.ts` milik mereka sendiri; konsumen inti sebaiknya menggunakan barrel lokal Plugin
  tersebut atau menambahkan kontrak SDK generik sempit ketika kebutuhannya benar-benar
  lintas kanal.

Sekumpulan kecil seam helper Plugin bawaan (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*`, dan sejenisnya) masih muncul di
generated export map. Seam tersebut ada hanya untuk pemeliharaan Plugin bawaan dan
bukan path import yang disarankan untuk Plugin pihak ketiga baru.
</Warning>

## Referensi subpath

SDK Plugin diekspos sebagai sekumpulan subpath sempit yang dikelompokkan per area (entri Plugin, kanal, provider, auth, runtime, kapabilitas, memori, dan helper Plugin bawaan yang dicadangkan). Untuk katalog lengkap — dikelompokkan dan ditautkan — lihat
[Subpath SDK Plugin](/id/plugins/sdk-subpaths).

Daftar 200+ subpath yang dihasilkan ada di `scripts/lib/plugin-sdk-entrypoints.json`.

## API pendaftaran

Callback `register(api)` menerima objek `OpenClawPluginApi` dengan metode-metode
berikut:

### Pendaftaran kapabilitas

| Metode                                           | Yang didaftarkan                     |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Inferensi teks (LLM)                 |
| `api.registerAgentHarness(...)`                  | Executor agen tingkat rendah eksperimental |
| `api.registerCliBackend(...)`                    | Backend inferensi CLI lokal          |
| `api.registerChannel(...)`                       | Kanal pesan                          |
| `api.registerSpeechProvider(...)`                | Sintesis text-to-speech / STT        |
| `api.registerRealtimeTranscriptionProvider(...)` | Transkripsi realtime streaming       |
| `api.registerRealtimeVoiceProvider(...)`         | Sesi voice realtime dupleks          |
| `api.registerMediaUnderstandingProvider(...)`    | Analisis gambar/audio/video          |
| `api.registerImageGenerationProvider(...)`       | Pembuatan gambar                     |
| `api.registerMusicGenerationProvider(...)`       | Pembuatan musik                      |
| `api.registerVideoGenerationProvider(...)`       | Pembuatan video                      |
| `api.registerWebFetchProvider(...)`              | Provider web fetch / scrape          |
| `api.registerWebSearchProvider(...)`             | Pencarian web                        |

### Alat dan perintah

| Metode                          | Yang didaftarkan                              |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Alat agen (required atau `{ optional: true }`) |
| `api.registerCommand(def)`      | Perintah kustom (melewati LLM)                |

### Infrastruktur

| Metode                                          | Yang didaftarkan                        |
| ----------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook peristiwa                          |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP Gateway                   |
| `api.registerGatewayMethod(name, handler)`      | Metode RPC Gateway                      |
| `api.registerGatewayDiscoveryService(service)`  | Pengiklan discovery Gateway lokal       |
| `api.registerCli(registrar, opts?)`             | Subperintah CLI                         |
| `api.registerService(service)`                  | Layanan latar belakang                  |
| `api.registerInteractiveHandler(registration)`  | Handler interaktif                      |
| `api.registerEmbeddedExtensionFactory(factory)` | Pabrik ekstensi embedded-runner Pi      |
| `api.registerMemoryPromptSupplement(builder)`   | Bagian prompt aditif yang berdekatan dengan memori |
| `api.registerMemoryCorpusSupplement(adapter)`   | Korpus pencarian/baca memori aditif     |

<Note>
  Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) selalu tetap `operator.admin`, bahkan jika Plugin mencoba menetapkan
  cakupan metode gateway yang lebih sempit. Utamakan prefix khusus Plugin untuk
  metode milik Plugin.
</Note>

<Accordion title="Kapan menggunakan registerEmbeddedExtensionFactory">
  Gunakan `api.registerEmbeddedExtensionFactory(...)` ketika Plugin membutuhkan
  timing peristiwa native Pi selama eksekusi tertanam OpenClaw — misalnya penulisan ulang
  `tool_result` async yang harus terjadi sebelum pesan hasil alat final dipancarkan.

Saat ini ini adalah seam Plugin bawaan: hanya Plugin bawaan yang boleh mendaftarkannya,
dan Plugin tersebut harus mendeklarasikan `contracts.embeddedExtensionFactories: ["pi"]` di
`openclaw.plugin.json`. Pertahankan hook Plugin OpenClaw normal untuk segala sesuatu yang
tidak memerlukan seam tingkat lebih rendah itu.
</Accordion>

### Pendaftaran discovery Gateway

`api.registerGatewayDiscoveryService(...)` memungkinkan Plugin mengiklankan
Gateway aktif pada transport discovery lokal seperti mDNS/Bonjour. OpenClaw memanggil
layanan ini selama startup Gateway ketika discovery lokal diaktifkan, meneruskan
port Gateway saat ini dan data petunjuk TXT non-secret, lalu memanggil handler `stop` yang dikembalikan selama shutdown Gateway.

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

Plugin discovery Gateway tidak boleh memperlakukan nilai TXT yang diiklankan sebagai secret atau
autentikasi. Discovery adalah petunjuk perutean; auth Gateway dan TLS pinning tetap
memiliki kepercayaan.

### Metadata pendaftaran CLI

`api.registerCli(registrar, opts?)` menerima dua jenis metadata tingkat atas:

- `commands`: root perintah eksplisit yang dimiliki registrar
- `descriptors`: descriptor perintah saat parse yang digunakan untuk bantuan CLI root,
  perutean, dan pendaftaran CLI Plugin secara lazy

Jika Anda ingin perintah Plugin tetap lazy-loaded di jalur CLI root normal,
berikan `descriptors` yang mencakup setiap root perintah tingkat atas yang diekspos
oleh registrar tersebut.

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
        description: "Kelola akun Matrix, verifikasi, perangkat, dan state profil",
        hasSubcommands: true,
      },
    ],
  },
);
```

Gunakan `commands` sendiri hanya jika Anda tidak memerlukan pendaftaran CLI root secara lazy.
Jalur kompatibilitas eager itu tetap didukung, tetapi jalur tersebut tidak memasang
placeholder yang didukung descriptor untuk lazy loading saat parse.

### Pendaftaran backend CLI

`api.registerCliBackend(...)` memungkinkan Plugin memiliki konfigurasi default untuk backend
AI CLI lokal seperti `codex-cli`.

- `id` backend menjadi prefix provider dalam referensi model seperti `codex-cli/gpt-5`.
- `config` backend menggunakan bentuk yang sama seperti `agents.defaults.cliBackends.<id>`.
- Konfigurasi pengguna tetap menang. OpenClaw menggabungkan `agents.defaults.cliBackends.<id>` di atas
  default Plugin sebelum menjalankan CLI.
- Gunakan `normalizeConfig` ketika backend membutuhkan penulisan ulang kompatibilitas setelah penggabungan
  (misalnya menormalisasi bentuk flag lama).

### Slot eksklusif

| Metode                                     | Yang didaftarkan                                                                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Engine konteks (satu aktif pada satu waktu). Callback `assemble()` menerima `availableTools` dan `citationsMode` agar engine dapat menyesuaikan tambahan prompt. |
| `api.registerMemoryCapability(capability)` | Kapabilitas memori terpadu                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Builder bagian prompt memori                                                                                                                              |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver rencana flush memori                                                                                                                             |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime memori                                                                                                                                     |

### Adapter embedding memori

| Metode                                         | Yang didaftarkan                             |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embedding memori untuk Plugin aktif  |

- `registerMemoryCapability` adalah API Plugin memori eksklusif yang disarankan.
- `registerMemoryCapability` juga dapat mengekspos `publicArtifacts.listArtifacts(...)`
  sehingga Plugin pendamping dapat mengonsumsi artefak memori yang diekspor melalui
  `openclaw/plugin-sdk/memory-host-core` alih-alih menjangkau tata letak privat
  Plugin memori tertentu.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan`, dan
  `registerMemoryRuntime` adalah API Plugin memori eksklusif yang kompatibel dengan legacy.
- `registerMemoryEmbeddingProvider` memungkinkan Plugin memori aktif mendaftarkan satu
  atau lebih id adapter embedding (misalnya `openai`, `gemini`, atau id kustom yang didefinisikan Plugin).
- Konfigurasi pengguna seperti `agents.defaults.memorySearch.provider` dan
  `agents.defaults.memorySearch.fallback` diselesaikan terhadap id adapter yang terdaftar tersebut.

### Peristiwa dan siklus hidup

| Metode                                       | Yang dilakukan              |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Hook siklus hidup bertipe   |
| `api.onConversationBindingResolved(handler)` | Callback binding percakapan |

### Semantik keputusan hook

- `before_tool_call`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler prioritas lebih rendah dilewati.
- `before_tool_call`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `before_install`: mengembalikan `{ block: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler prioritas lebih rendah dilewati.
- `before_install`: mengembalikan `{ block: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `block`), bukan sebagai override.
- `reply_dispatch`: mengembalikan `{ handled: true, ... }` bersifat terminal. Setelah handler mana pun mengklaim dispatch, handler prioritas lebih rendah dan jalur dispatch model default dilewati.
- `message_sending`: mengembalikan `{ cancel: true }` bersifat terminal. Setelah handler mana pun menetapkannya, handler prioritas lebih rendah dilewati.
- `message_sending`: mengembalikan `{ cancel: false }` diperlakukan sebagai tidak ada keputusan (sama seperti menghilangkan `cancel`), bukan sebagai override.
- `message_received`: gunakan field `threadId` bertipe ketika Anda memerlukan perutean thread/topik masuk. Simpan `metadata` untuk tambahan khusus kanal.
- `message_sending`: gunakan field perutean bertipe `replyToId` / `threadId` sebelum fallback ke `metadata` khusus kanal.
- `gateway_start`: gunakan `ctx.config`, `ctx.workspaceDir`, dan `ctx.getCron?.()` untuk state startup milik gateway alih-alih mengandalkan hook internal `gateway:startup`.

### Field objek API

| Field                    | Tipe                      | Deskripsi                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Id Plugin                                                                                  |
| `api.name`               | `string`                  | Nama tampilan                                                                              |
| `api.version`            | `string?`                 | Versi Plugin (opsional)                                                                    |
| `api.description`        | `string?`                 | Deskripsi Plugin (opsional)                                                                |
| `api.source`             | `string`                  | Path sumber Plugin                                                                         |
| `api.rootDir`            | `string?`                 | Direktori root Plugin (opsional)                                                           |
| `api.config`             | `OpenClawConfig`          | Snapshot konfigurasi saat ini (snapshot runtime in-memory aktif bila tersedia)             |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfigurasi khusus Plugin dari `plugins.entries.<id>.config`                               |
| `api.runtime`            | `PluginRuntime`           | [Runtime Helpers](/id/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | Logger bercakupan (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan pra-entri penuh |
| `api.resolvePath(input)` | `(string) => string`      | Menyelesaikan path relatif terhadap root Plugin                                            |

## Konvensi modul internal

Di dalam Plugin Anda, gunakan file barrel lokal untuk import internal:

```
my-plugin/
  api.ts            # Ekspor publik untuk konsumen eksternal
  runtime-api.ts    # Ekspor runtime internal saja
  index.ts          # Titik masuk Plugin
  setup-entry.ts    # Entri ringan hanya untuk setup (opsional)
```

<Warning>
  Jangan pernah mengimpor Plugin Anda sendiri melalui `openclaw/plugin-sdk/<your-plugin>`
  dari kode produksi. Arahkan import internal melalui `./api.ts` atau
  `./runtime-api.ts`. Path SDK hanya untuk kontrak eksternal.
</Warning>

Permukaan publik Plugin bawaan yang dimuat melalui facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts`, dan file entri publik serupa) lebih memilih
snapshot konfigurasi runtime aktif ketika OpenClaw sudah berjalan. Jika snapshot runtime
belum ada, permukaan itu fallback ke file konfigurasi di disk yang telah diselesaikan.

Provider Plugin dapat mengekspos barrel kontrak lokal-Plugin yang sempit ketika sebuah
helper memang sengaja khusus provider dan belum pantas berada di subpath SDK generik.
Contoh bawaan:

- **Anthropic**: seam publik `api.ts` / `contract-api.ts` untuk helper
  beta-header Claude dan stream `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` mengekspor builder provider,
  helper model default, dan builder provider realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` mengekspor builder provider
  plus helper onboarding/konfigurasi.

<Warning>
  Kode produksi ekstensi juga sebaiknya menghindari import `openclaw/plugin-sdk/<other-plugin>`.
  Jika sebuah helper benar-benar dibagikan, promosikan helper itu ke subpath SDK netral
  seperti `openclaw/plugin-sdk/speech`, `.../provider-model-shared`, atau permukaan
  berorientasi kapabilitas lainnya alih-alih menghubungkan dua Plugin secara langsung.
</Warning>

## Terkait

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/id/plugins/sdk-entrypoints">
    Opsi `definePluginEntry` dan `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/id/plugins/sdk-runtime">
    Referensi lengkap namespace `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/id/plugins/sdk-setup">
    Packaging, manifest, dan skema konfigurasi.
  </Card>
  <Card title="Testing" icon="vial" href="/id/plugins/sdk-testing">
    Utilitas pengujian dan aturan lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/id/plugins/sdk-migration">
    Migrasi dari permukaan yang deprecated.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/id/plugins/architecture">
    Arsitektur mendalam dan model kapabilitas.
  </Card>
</CardGroup>
