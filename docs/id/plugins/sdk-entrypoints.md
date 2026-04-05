---
read_when:
    - Anda memerlukan signature tipe yang tepat dari definePluginEntry atau defineChannelPluginEntry
    - Anda ingin memahami mode pendaftaran (full vs setup vs metadata CLI)
    - Anda sedang mencari opsi titik entri
sidebarTitle: Entry Points
summary: Referensi untuk definePluginEntry, defineChannelPluginEntry, dan defineSetupPluginEntry
title: Titik Entri Plugin
x-i18n:
    generated_at: "2026-04-05T14:02:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 799dbfe71e681dd8ba929a7a631dfe745c3c5c69530126fea2f9c137b120f51f
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Titik Entri Plugin

Setiap plugin mengekspor objek entri default. SDK menyediakan tiga helper untuk
membuatnya.

<Tip>
  **Mencari panduan langkah demi langkah?** Lihat [Channel Plugins](/plugins/sdk-channel-plugins)
  atau [Provider Plugins](/plugins/sdk-provider-plugins) untuk panduan langkah demi langkah.
</Tip>

## `definePluginEntry`

**Import:** `openclaw/plugin-sdk/plugin-entry`

Untuk plugin provider, plugin tool, plugin hook, dan apa pun yang **bukan**
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

| Field          | Type                                                             | Required | Default             |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | Ya       | —                   |
| `name`         | `string`                                                         | Ya       | —                   |
| `description`  | `string`                                                         | Ya       | —                   |
| `kind`         | `string`                                                         | Tidak    | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak    | Skema objek kosong  |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ya       | —                   |

- `id` harus cocok dengan manifest `openclaw.plugin.json` Anda.
- `kind` untuk slot eksklusif: `"memory"` atau `"context-engine"`.
- `configSchema` dapat berupa fungsi untuk evaluasi lazy.
- OpenClaw me-resolve dan memoize skema itu saat akses pertama, sehingga pembuat skema
  yang mahal hanya berjalan sekali.

## `defineChannelPluginEntry`

**Import:** `openclaw/plugin-sdk/channel-core`

Membungkus `definePluginEntry` dengan wiring khusus channel. Secara otomatis memanggil
`api.registerChannel({ plugin })`, mengekspos seam metadata CLI bantuan root opsional,
dan mengatur `registerFull` berdasarkan mode pendaftaran.

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

| Field                 | Type                                                             | Required | Default             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Ya       | —                   |
| `name`                | `string`                                                         | Ya       | —                   |
| `description`         | `string`                                                         | Ya       | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Ya       | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak    | Skema objek kosong  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Tidak    | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Tidak    | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Tidak    | —                   |

- `setRuntime` dipanggil selama pendaftaran sehingga Anda dapat menyimpan referensi runtime
  (biasanya melalui `createPluginRuntimeStore`). Ini dilewati selama pengambilan
  metadata CLI.
- `registerCliMetadata` berjalan selama `api.registrationMode === "cli-metadata"`
  maupun `api.registrationMode === "full"`.
  Gunakan ini sebagai tempat kanonis untuk descriptor CLI milik channel agar bantuan root
  tetap non-activating sementara pendaftaran perintah CLI normal tetap kompatibel
  dengan pemuatan plugin penuh.
- `registerFull` hanya berjalan saat `api.registrationMode === "full"`. Ini dilewati
  selama pemuatan setup-only.
- Seperti `definePluginEntry`, `configSchema` dapat berupa factory lazy dan OpenClaw
  memoize skema yang telah di-resolve saat akses pertama.
- Untuk perintah CLI root milik plugin, pilih `api.registerCli(..., { descriptors: [...] })`
  saat Anda ingin perintah tetap lazy-loaded tanpa menghilang dari
  parse tree CLI root. Untuk plugin channel, sebaiknya daftarkan descriptor itu
  dari `registerCliMetadata(...)` dan pertahankan `registerFull(...)` tetap fokus pada pekerjaan runtime saja.
- Jika `registerFull(...)` juga mendaftarkan metode RPC gateway, simpan di
  prefiks khusus plugin. Namespace admin core yang dicadangkan (`config.*`,
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

OpenClaw memuat ini alih-alih entri penuh saat channel dinonaktifkan,
belum dikonfigurasi, atau saat deferred loading diaktifkan. Lihat
[Setup and Config](/plugins/sdk-setup#setup-entry) untuk mengetahui kapan ini penting.

Dalam praktiknya, pasangkan `defineSetupPluginEntry(...)` dengan keluarga helper setup
yang sempit:

- `openclaw/plugin-sdk/setup-runtime` untuk helper setup yang aman untuk runtime seperti
  adapter patch setup yang aman untuk import, output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan proxy setup yang didelegasikan
- `openclaw/plugin-sdk/channel-setup` untuk surface setup opsional-install
- `openclaw/plugin-sdk/setup-tools` untuk helper CLI/archive/docs setup/install

Simpan SDK berat, pendaftaran CLI, dan layanan runtime jangka panjang di entri
penuh.

## Mode pendaftaran

`api.registrationMode` memberi tahu plugin Anda bagaimana plugin dimuat:

| Mode              | Kapan                              | Yang harus didaftarkan                                                             |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| `"full"`          | Startup gateway normal             | Semua                                                                              |
| `"setup-only"`    | Channel dinonaktifkan/belum dikonfigurasi | Hanya pendaftaran channel                                                         |
| `"setup-runtime"` | Alur setup dengan runtime tersedia | Pendaftaran channel plus hanya runtime ringan yang dibutuhkan sebelum entri penuh dimuat |
| `"cli-metadata"`  | Bantuan root / pengambilan metadata CLI | Hanya descriptor CLI                                                              |

`defineChannelPluginEntry` menangani pemisahan ini secara otomatis. Jika Anda menggunakan
`definePluginEntry` langsung untuk sebuah channel, periksa mode sendiri:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Pendaftaran berat yang hanya untuk runtime
  api.registerService(/* ... */);
}
```

Perlakukan `"setup-runtime"` sebagai jendela saat surface startup setup-only harus
ada tanpa masuk kembali ke runtime channel bawaan penuh. Yang cocok
meliputi pendaftaran channel, rute HTTP yang aman untuk setup, metode gateway yang aman untuk setup, dan
helper setup yang didelegasikan. Layanan latar belakang berat, registrar CLI, dan
bootstrap SDK provider/client tetap berada di `"full"`.

Khusus untuk registrar CLI:

- gunakan `descriptors` saat registrar memiliki satu atau lebih perintah root dan Anda
  ingin OpenClaw melakukan lazy-load pada modul CLI nyata saat pertama kali dipanggil
- pastikan descriptor tersebut mencakup setiap root perintah tingkat atas yang diekspos oleh
  registrar
- gunakan `commands` saja hanya untuk jalur kompatibilitas eager

## Bentuk plugin

OpenClaw mengklasifikasikan plugin yang dimuat berdasarkan perilaku pendaftarannya:

| Shape                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Satu jenis capability (misalnya hanya provider)    |
| **hybrid-capability** | Beberapa jenis capability (misalnya provider + speech) |
| **hook-only**         | Hanya hook, tanpa capability                       |
| **non-capability**    | Tools/commands/services tetapi tanpa capability    |

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk sebuah plugin.

## Terkait

- [SDK Overview](/plugins/sdk-overview) — API pendaftaran dan referensi subpath
- [Runtime Helpers](/plugins/sdk-runtime) — `api.runtime` dan `createPluginRuntimeStore`
- [Setup and Config](/plugins/sdk-setup) — manifest, setup entry, deferred loading
- [Channel Plugins](/plugins/sdk-channel-plugins) — membangun objek `ChannelPlugin`
- [Provider Plugins](/plugins/sdk-provider-plugins) — pendaftaran provider dan hook
