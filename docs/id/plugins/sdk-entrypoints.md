---
read_when:
    - Anda memerlukan tanda tangan tipe yang tepat dari `definePluginEntry` atau `defineChannelPluginEntry`
    - Anda ingin memahami mode pendaftaran (penuh vs penyiapan vs metadata CLI)
    - Anda sedang mencari opsi titik masuk
sidebarTitle: Entry Points
summary: Referensi untuk definePluginEntry, defineChannelPluginEntry, dan defineSetupPluginEntry
title: Titik Masuk Plugin
x-i18n:
    generated_at: "2026-04-15T19:41:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: aabca25bc9b8ff1b5bb4852bafe83640ffeba006ea6b6a8eff4e2c37a10f1fe4
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Titik Masuk Plugin

Setiap plugin mengekspor objek entry default. SDK menyediakan tiga helper untuk
membuatnya.

<Tip>
  **Mencari panduan langkah demi langkah?** Lihat [Plugin Channel](/id/plugins/sdk-channel-plugins)
  atau [Plugin Provider](/id/plugins/sdk-provider-plugins) untuk panduan langkah demi langkah.
</Tip>

## `definePluginEntry`

**Impor:** `openclaw/plugin-sdk/plugin-entry`

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

| Bidang         | Tipe                                                             | Wajib | Default             |
| -------------- | ---------------------------------------------------------------- | ----- | ------------------- |
| `id`           | `string`                                                         | Ya    | —                   |
| `name`         | `string`                                                         | Ya    | —                   |
| `description`  | `string`                                                         | Ya    | —                   |
| `kind`         | `string`                                                         | Tidak | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong  |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ya    | —                   |

- `id` harus cocok dengan manifes `openclaw.plugin.json` Anda.
- `kind` digunakan untuk slot eksklusif: `"memory"` atau `"context-engine"`.
- `configSchema` dapat berupa fungsi untuk evaluasi malas.
- OpenClaw me-resolve dan menyimpan schema tersebut pada akses pertama, jadi pembuat schema
  yang mahal hanya dijalankan sekali.

## `defineChannelPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Membungkus `definePluginEntry` dengan wiring khusus channel. Secara otomatis memanggil
`api.registerChannel({ plugin })`, mengekspos seam metadata CLI bantuan-root opsional,
dan membatasi `registerFull` berdasarkan mode pendaftaran.

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

| Bidang                | Tipe                                                             | Wajib | Default             |
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
- `registerCliMetadata` berjalan selama `api.registrationMode === "cli-metadata"`
  dan `api.registrationMode === "full"`.
  Gunakan ini sebagai tempat kanonis untuk deskriptor CLI milik channel agar bantuan root
  tetap tidak mengaktifkan apa pun, sambil menjaga pendaftaran perintah CLI normal tetap kompatibel
  dengan pemuatan plugin penuh.
- `registerFull` hanya berjalan saat `api.registrationMode === "full"`. Ini dilewati
  selama pemuatan setup-only.
- Seperti `definePluginEntry`, `configSchema` dapat berupa factory malas dan OpenClaw
  menyimpan schema yang telah di-resolve pada akses pertama.
- Untuk perintah CLI root milik plugin, gunakan `api.registerCli(..., { descriptors: [...] })`
  jika Anda ingin perintah tetap dimuat secara malas tanpa menghilang dari
  pohon parse CLI root. Untuk plugin channel, sebaiknya daftarkan deskriptor tersebut
  dari `registerCliMetadata(...)` dan biarkan `registerFull(...)` tetap fokus pada pekerjaan khusus runtime.
- Jika `registerFull(...)` juga mendaftarkan metode Gateway RPC, tetap gunakan
  prefiks khusus plugin. Namespace admin inti yang dicadangkan (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) selalu dipaksa menjadi
  `operator.admin`.

## `defineSetupPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Untuk file `setup-entry.ts` yang ringan. Hanya mengembalikan `{ plugin }` tanpa
wiring runtime atau CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw memuat ini alih-alih entry penuh ketika sebuah channel dinonaktifkan,
belum dikonfigurasi, atau saat deferred loading diaktifkan. Lihat
[Setup dan Config](/id/plugins/sdk-setup#setup-entry) untuk memahami kapan ini penting.

Dalam praktiknya, pasangkan `defineSetupPluginEntry(...)` dengan keluarga helper setup
yang sempit:

- `openclaw/plugin-sdk/setup-runtime` untuk helper setup yang aman untuk runtime seperti
  adapter patch setup yang aman diimpor, output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan proxy setup terdelegasi
- `openclaw/plugin-sdk/channel-setup` untuk permukaan setup optional-install
- `openclaw/plugin-sdk/setup-tools` untuk helper CLI/setup/install/archive/docs

Simpan SDK yang berat, pendaftaran CLI, dan layanan runtime berumur panjang di entry
penuh.

Channel workspace bawaan yang membagi permukaan setup dan runtime dapat menggunakan
`defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` sebagai gantinya. Kontrak itu memungkinkan
entry setup tetap menyimpan ekspor plugin/secrets yang aman untuk setup sambil tetap mengekspos
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

Gunakan kontrak bundled itu hanya ketika alur setup benar-benar memerlukan runtime setter
yang ringan sebelum entry channel penuh dimuat.

## Mode pendaftaran

`api.registrationMode` memberi tahu plugin Anda bagaimana plugin tersebut dimuat:

| Mode              | Kapan                            | Yang didaftarkan                                                                        |
| ----------------- | -------------------------------- | --------------------------------------------------------------------------------------- |
| `"full"`          | Startup Gateway normal           | Semuanya                                                                               |
| `"setup-only"`    | Channel dinonaktifkan/belum dikonfigurasi | Hanya pendaftaran channel                                                      |
| `"setup-runtime"` | Alur setup dengan runtime tersedia | Pendaftaran channel ditambah hanya runtime ringan yang diperlukan sebelum entry penuh dimuat |
| `"cli-metadata"`  | Bantuan root / pengambilan metadata CLI | Hanya deskriptor CLI                                                              |

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

  // Pendaftaran khusus runtime yang berat
  api.registerService(/* ... */);
}
```

Perlakukan `"setup-runtime"` sebagai jendela ketika permukaan startup khusus setup harus
ada tanpa masuk kembali ke runtime channel bundled penuh. Yang cocok di sini adalah
pendaftaran channel, rute HTTP yang aman untuk setup, metode Gateway yang aman untuk setup, dan
helper setup terdelegasi. Layanan latar belakang yang berat, registrar CLI, dan bootstrap SDK
provider/klien tetap harus berada di `"full"`.

Untuk registrar CLI secara khusus:

- gunakan `descriptors` ketika registrar memiliki satu atau lebih perintah root dan Anda
  ingin OpenClaw memuat modul CLI yang sebenarnya secara malas pada pemanggilan pertama
- pastikan deskriptor tersebut mencakup setiap root perintah tingkat atas yang diekspos oleh
  registrar
- gunakan `commands` saja hanya untuk jalur kompatibilitas eager

## Bentuk plugin

OpenClaw mengklasifikasikan plugin yang dimuat berdasarkan perilaku pendaftarannya:

| Bentuk                | Deskripsi                                          |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Satu jenis capability (mis. hanya provider)        |
| **hybrid-capability** | Beberapa jenis capability (mis. provider + speech) |
| **hook-only**         | Hanya hook, tanpa capability                       |
| **non-capability**    | Tool/perintah/layanan tetapi tanpa capability      |

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk sebuah plugin.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) — API pendaftaran dan referensi subpath
- [Helper Runtime](/id/plugins/sdk-runtime) — `api.runtime` dan `createPluginRuntimeStore`
- [Setup dan Config](/id/plugins/sdk-setup) — manifes, setup entry, deferred loading
- [Plugin Channel](/id/plugins/sdk-channel-plugins) — membangun objek `ChannelPlugin`
- [Plugin Provider](/id/plugins/sdk-provider-plugins) — pendaftaran provider dan hook
