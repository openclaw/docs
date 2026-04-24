---
read_when:
    - Anda memerlukan exact type signature dari definePluginEntry atau defineChannelPluginEntry
    - Anda ingin memahami mode pendaftaran (penuh vs setup vs metadata CLI)
    - Anda sedang mencari opsi titik masuk
sidebarTitle: Entry Points
summary: Referensi untuk definePluginEntry, defineChannelPluginEntry, dan defineSetupPluginEntry
title: Titik masuk plugin
x-i18n:
    generated_at: "2026-04-24T09:19:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 517559e16416cbf9d152a0ca2e09f57de92ff65277fec768cbaf38d9de62e051
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Setiap plugin mengekspor objek entry default. SDK menyediakan tiga helper untuk
membuatnya.

Untuk plugin yang terpasang, `package.json` sebaiknya mengarahkan pemuatan runtime ke
JavaScript hasil build jika tersedia:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` dan `setupEntry` tetap valid sebagai entri source untuk pengembangan workspace dan git
checkout. `runtimeExtensions` dan `runtimeSetupEntry` diprioritaskan
saat OpenClaw memuat paket yang terpasang dan memungkinkan paket npm menghindari kompilasi TypeScript saat runtime. Jika paket yang terpasang hanya mendeklarasikan entri source
TypeScript, OpenClaw akan menggunakan peer `dist/*.js` hasil build yang sesuai bila ada,
lalu menggunakan fallback ke source TypeScript.

Semua path entry harus tetap berada di dalam direktori paket plugin. Entri runtime
dan peer JavaScript hasil build yang disimpulkan tidak membuat path source `extensions` atau
`setupEntry` yang keluar dari direktori menjadi valid.

<Tip>
  **Mencari walkthrough?** Lihat [Plugin Channel](/id/plugins/sdk-channel-plugins)
  atau [Plugin Provider](/id/plugins/sdk-provider-plugins) untuk panduan langkah demi langkah.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Untuk plugin provider, plugin alat, plugin hook, dan apa pun yang **bukan**
channel pesan.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Field          | Tipe                                                             | Wajib | Default             |
| -------------- | ---------------------------------------------------------------- | ----- | ------------------- |
| `id`           | `string`                                                         | Ya    | —                   |
| `name`         | `string`                                                         | Ya    | —                   |
| `description`  | `string`                                                         | Ya    | —                   |
| `kind`         | `string`                                                         | Tidak | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong  |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ya    | —                   |

- `id` harus cocok dengan manifest `openclaw.plugin.json` Anda.
- `kind` digunakan untuk slot eksklusif: `"memory"` atau `"context-engine"`.
- `configSchema` dapat berupa fungsi untuk evaluasi lazy.
- OpenClaw me-resolve dan mememoisasi skema tersebut pada akses pertama, sehingga builder skema yang mahal hanya berjalan sekali.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Membungkus `definePluginEntry` dengan wiring khusus channel. Secara otomatis memanggil
`api.registerChannel({ plugin })`, mengekspos seam metadata CLI root-help opsional, dan melakukan gating `registerFull` berdasarkan mode pendaftaran.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Field                 | Tipe                                                             | Wajib | Default             |
| --------------------- | ---------------------------------------------------------------- | ----- | ------------------- |
| `id`                  | `string`                                                         | Ya    | —                   |
| `name`                | `string`                                                         | Ya    | —                   |
| `description`         | `string`                                                         | Ya    | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Ya    | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Tidak | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Tidak | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Tidak | —                   |

- `setRuntime` dipanggil selama pendaftaran sehingga Anda dapat menyimpan referensi runtime
  (biasanya melalui `createPluginRuntimeStore`). Ini dilewati selama pengambilan metadata CLI.
- `registerCliMetadata` berjalan saat `api.registrationMode === "cli-metadata"`
  dan saat `api.registrationMode === "full"`.
  Gunakan ini sebagai tempat kanonis untuk descriptor CLI milik channel agar root help
  tetap non-activating sementara pendaftaran perintah CLI normal tetap kompatibel
  dengan pemuatan plugin penuh.
- `registerFull` hanya berjalan saat `api.registrationMode === "full"`. Ini dilewati
  selama pemuatan setup-only.
- Seperti `definePluginEntry`, `configSchema` dapat berupa factory lazy dan OpenClaw
  mememoisasi skema yang telah di-resolve pada akses pertama.
- Untuk perintah CLI root milik plugin, utamakan `api.registerCli(..., { descriptors: [...] })`
  saat Anda ingin perintah tetap lazy-loaded tanpa menghilang dari
  parse tree CLI root. Untuk plugin channel, utamakan pendaftaran descriptor tersebut
  dari `registerCliMetadata(...)` dan biarkan `registerFull(...)` fokus pada pekerjaan yang hanya untuk runtime.
- Jika `registerFull(...)` juga mendaftarkan method RPC gateway, pertahankan method itu pada
  prefiks khusus plugin. Namespace admin inti yang dicadangkan (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) selalu dipaksa ke
  `operator.admin`.

## `defineSetupPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Untuk file `setup-entry.ts` yang ringan. Mengembalikan hanya `{ plugin }` tanpa
wiring runtime atau CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw memuat ini alih-alih entry penuh saat channel dinonaktifkan,
belum dikonfigurasi, atau saat pemuatan tertunda diaktifkan. Lihat
[Setup and Config](/id/plugins/sdk-setup#setup-entry) untuk memahami kapan ini penting.

Dalam praktiknya, pasangkan `defineSetupPluginEntry(...)` dengan keluarga helper setup yang sempit:

- `openclaw/plugin-sdk/setup-runtime` untuk helper setup yang aman saat runtime seperti
  adapter patch setup yang aman diimpor, output lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan proxy setup terdelegasi
- `openclaw/plugin-sdk/channel-setup` untuk surface setup/install opsional
- `openclaw/plugin-sdk/setup-tools` untuk helper setup/install CLI/archive/docs

Pertahankan SDK yang berat, pendaftaran CLI, dan layanan runtime yang berjalan lama di entry penuh.

Channel workspace bawaan yang membagi surface setup dan runtime dapat menggunakan
`defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` sebagai gantinya. Kontrak itu memungkinkan
entry setup menyimpan ekspor plugin/secrets yang aman untuk setup sambil tetap mengekspos
runtime setter:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

Gunakan kontrak bawaan itu hanya saat alur setup benar-benar memerlukan runtime
setter ringan sebelum entry channel penuh dimuat.

## Mode pendaftaran

`api.registrationMode` memberi tahu plugin Anda bagaimana plugin dimuat:

| Mode              | Kapan                              | Apa yang harus didaftarkan                                                             |
| ----------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `"full"`          | Startup gateway normal             | Semuanya                                                                               |
| `"setup-only"`    | Channel dinonaktifkan/belum dikonfigurasi | Hanya pendaftaran channel                                                           |
| `"setup-runtime"` | Alur setup dengan runtime tersedia | Pendaftaran channel plus hanya runtime ringan yang dibutuhkan sebelum entry penuh dimuat |
| `"cli-metadata"`  | Root help / pengambilan metadata CLI | Hanya descriptor CLI                                                                 |

`defineChannelPluginEntry` menangani pemisahan ini secara otomatis. Jika Anda menggunakan
`definePluginEntry` langsung untuk channel, periksa mode sendiri:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Pendaftaran runtime-only yang berat
  api.registerService(/* ... */);
}
```

Perlakukan `"setup-runtime"` sebagai jendela saat surface startup setup-only harus
ada tanpa masuk kembali ke runtime channel bawaan penuh. Yang cocok di sini adalah
pendaftaran channel, route HTTP yang aman untuk setup, method gateway yang aman untuk setup, dan
helper setup terdelegasi. Background service yang berat, registrar CLI, dan bootstrap SDK provider/klien tetap berada di `"full"`.

Khusus untuk registrar CLI:

- gunakan `descriptors` saat registrar memiliki satu atau lebih perintah root dan Anda
  ingin OpenClaw melakukan lazy-load modul CLI yang sebenarnya pada pemanggilan pertama
- pastikan descriptor tersebut mencakup setiap root perintah tingkat atas yang diekspos oleh registrar
- gunakan `commands` saja hanya untuk jalur kompatibilitas eager

## Bentuk plugin

OpenClaw mengklasifikasikan plugin yang dimuat berdasarkan perilaku pendaftarannya:

| Bentuk                | Deskripsi                                         |
| --------------------- | ------------------------------------------------- |
| **plain-capability**  | Satu tipe kapabilitas (mis. hanya provider)       |
| **hybrid-capability** | Beberapa tipe kapabilitas (mis. provider + speech) |
| **hook-only**         | Hanya hook, tanpa kapabilitas                     |
| **non-capability**    | Alat/perintah/layanan tetapi tanpa kapabilitas    |

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi API pendaftaran dan subpath
- [Helper Runtime](/id/plugins/sdk-runtime) — `api.runtime` dan `createPluginRuntimeStore`
- [Setup and Config](/id/plugins/sdk-setup) — manifest, setup entry, pemuatan tertunda
- [Plugin Channel](/id/plugins/sdk-channel-plugins) — membangun objek `ChannelPlugin`
- [Plugin Provider](/id/plugins/sdk-provider-plugins) — pendaftaran provider dan hook
