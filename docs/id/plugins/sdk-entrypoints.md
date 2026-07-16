---
read_when:
    - Anda memerlukan signature tipe yang tepat dari defineToolPlugin, definePluginEntry, atau defineChannelPluginEntry
    - Anda ingin memahami mode pendaftaran (lengkap vs penyiapan vs metadata CLI)
    - Anda sedang mencari opsi titik masuk
sidebarTitle: Entry Points
summary: Referensi untuk defineToolPlugin, definePluginEntry, defineChannelPluginEntry, dan defineSetupPluginEntry
title: Titik masuk Plugin
x-i18n:
    generated_at: "2026-07-16T18:29:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Setiap plugin mengekspor objek entri default. SDK menyediakan pembantu untuk
setiap bentuk entri: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Mencari panduan langkah demi langkah?** Lihat [Plugin Alat](/id/plugins/tool-plugins),
  [Plugin Saluran](/id/plugins/sdk-channel-plugins), atau
  [Plugin Penyedia](/id/plugins/sdk-provider-plugins) untuk panduan langkah demi langkah.
</Tip>

## Entri paket

Plugin yang terinstal mengarahkan bidang `package.json` `openclaw` ke entri sumber dan
hasil build:

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

- `extensions` dan `setupEntry` adalah entri sumber, yang digunakan untuk pengembangan workspace dan
  checkout git.
- `runtimeExtensions` dan `runtimeSetupEntry` lebih diutamakan untuk paket yang
  terinstal: keduanya memungkinkan paket npm melewati kompilasi TypeScript saat runtime.
- `runtimeExtensions`, jika ada, harus cocok dengan `extensions` dalam panjang array
  (entri dipasangkan berdasarkan posisi). `runtimeSetupEntry` memerlukan `setupEntry`.
- Jika artefak `runtimeExtensions`/`runtimeSetupEntry` dideklarasikan tetapi
  tidak ada, instalasi/penemuan gagal dengan kesalahan pengemasan; OpenClaw tidak
  diam-diam kembali menggunakan sumber. Penggunaan sumber sebagai fallback (di bawah) hanya berlaku jika tidak ada
  entri runtime yang dideklarasikan sama sekali.
- Jika paket yang terinstal hanya mendeklarasikan entri sumber TypeScript, OpenClaw
  mencari pasangan hasil build `dist/*.js` (atau `.mjs`/`.cjs`) yang cocok dan menggunakannya;
  jika tidak, OpenClaw kembali menggunakan sumber TypeScript.
- Semua jalur entri harus tetap berada di dalam direktori paket plugin. Entri runtime
  dan pasangan JS hasil build yang disimpulkan tidak menjadikan jalur sumber `extensions` atau
  `setupEntry` yang keluar dari direktori sebagai valid.

## `defineToolPlugin`

**Impor:** `openclaw/plugin-sdk/tool-plugin`

Untuk plugin yang hanya menambahkan alat agen. Menjaga sumber tetap ringkas, menyimpulkan tipe konfigurasi
dan parameter alat dari skema TypeBox, membungkus nilai hasil biasa dalam
format hasil alat OpenClaw, serta mengekspos metadata statis yang
ditulis oleh `openclaw plugins build` ke dalam manifes plugin (`contracts.tools`,
`configSchema`).

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` bersifat opsional; jika dihilangkan, skema objek kosong yang ketat akan digunakan
  (manifes yang dihasilkan tetap menyertakan `configSchema`).
- `execute` mengembalikan string biasa atau nilai yang dapat diserialisasi sebagai JSON; pembantu
  membungkusnya sebagai hasil alat teks dengan `details` yang ditetapkan ke nilai hasil asli
  (yang belum diubah menjadi string).
- Untuk hasil alat khusus, `openclaw/plugin-sdk/tool-results` mengekspor
  `textResult` dan `jsonResult`.
- Nama alat bersifat statis, sehingga `openclaw plugins build` memperoleh
  `contracts.tools` dari alat yang dideklarasikan tanpa menduplikasi nama secara manual.
- Pemuatan runtime tetap ketat: plugin yang terinstal masih memerlukan
  `openclaw.plugin.json` dan `package.json` `openclaw.extensions`. OpenClaw
  tidak pernah mengeksekusi kode plugin untuk menyimpulkan data manifes yang tidak ada.

## `definePluginEntry`

**Impor:** `openclaw/plugin-sdk/plugin-entry`

Untuk plugin penyedia, plugin alat tingkat lanjut, plugin hook, dan segala sesuatu yang
**bukan** saluran perpesanan.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| Bidang                    | Tipe                                                             | Wajib    | Default             |
| ------------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                      | `string`                                                         | Ya       | -                   |
| `name`                    | `string`                                                         | Ya       | -                   |
| `description`             | `string`                                                         | Ya       | -                   |
| `kind`                    | `string` (tidak digunakan lagi, lihat di bawah)                  | Tidak    | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak    | Skema objek kosong  |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Tidak    | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Tidak    | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Tidak    | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Ya       | -                   |

- `id` harus cocok dengan manifes `openclaw.plugin.json` Anda.
- Katalog sesi eksternal menggunakan
  `openclaw/plugin-sdk/session-catalog` dan
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Inti memiliki metode Gateway `sessions.catalog.*`; penyedia mengembalikan proyeksi host,
  sesi, dan transkrip yang dinormalisasi tanpa mendaftarkan RPC.
- `kind` tidak digunakan lagi: deklarasikan slot eksklusif (`"memory"` atau
  `"context-engine"`) dalam bidang `kind` pada manifes `openclaw.plugin.json`
  sebagai gantinya. `kind` pada entri runtime tetap tersedia hanya sebagai fallback kompatibilitas untuk
  plugin lama.
- `configSchema` dapat berupa fungsi untuk evaluasi malas. OpenClaw me-resolve dan
  menyimpan skema dalam memo pada akses pertama, sehingga pembuat skema yang mahal hanya dijalankan
  sekali.
- Deskriptor `nodeHostCommands` dapat mendefinisikan `isAvailable({ config, env })`.
  Mengembalikan `false` akan menghilangkan perintah tersebut beserta kapabilitasnya dari deklarasi Gateway
  Node tanpa antarmuka. OpenClaw mengevaluasinya berdasarkan konfigurasi startup lokal Node;
  handler perintah tetap harus memvalidasi ketersediaan saat
  dipanggil.

## `defineChannelPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Membungkus `definePluginEntry` dengan pengabelan khusus saluran: secara otomatis
memanggil `api.registerChannel({ plugin })`, mengekspos seam metadata CLI bantuan root
opsional, dan membatasi `registerFull` berdasarkan mode pendaftaran.

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

| Bidang                | Tipe                                                             | Wajib    | Default             |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | Ya       | -                   |
| `name`                | `string`                                                         | Ya       | -                   |
| `description`         | `string`                                                         | Ya       | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Ya       | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak    | Skema objek kosong  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Tidak    | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Tidak    | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Tidak    | -                   |

Callback dijalankan sesuai mode pendaftaran (tabel lengkap di bagian
[Mode pendaftaran](#registration-mode)):

- `setRuntime` dijalankan dalam setiap mode kecuali `"cli-metadata"` dan
  `"tool-discovery"`. Simpan referensi runtime di sini, biasanya melalui
  `createPluginRuntimeStore`.
- `registerCliMetadata` dijalankan untuk `"cli-metadata"`, `"discovery"`, dan
  `"full"`. Gunakan ini sebagai tempat kanonis bagi deskriptor CLI milik saluran
  agar bantuan root tetap tidak mengaktifkan apa pun, snapshot penemuan menyertakan metadata
  perintah statis, dan pendaftaran CLI normal tetap kompatibel dengan pemuatan
  plugin penuh.
- `registerFull` hanya dijalankan untuk `"full"` dan `"tool-discovery"`. Untuk
  `"tool-discovery"`, ini dijalankan _sebagai pengganti_ pendaftaran saluran: OpenClaw
  sepenuhnya melewati `registerChannel`/`setRuntime` dan hanya memanggil
  `registerFull`, sehingga setiap pendaftaran penyedia/alat yang diperlukan saluran Anda untuk
  penemuan atau eksekusi alat mandiri harus berada di sana, bukan di balik
  penyiapan saluran normal.
- Pendaftaran penemuan tidak mengaktifkan apa pun, tetapi bukan berarti bebas impor: OpenClaw dapat
  mengevaluasi entri plugin tepercaya dan modul plugin saluran untuk membangun
  snapshot. Pastikan impor tingkat atas bebas efek samping dan tempatkan soket,
  klien, worker, dan layanan di balik jalur khusus `"full"`.
- Seperti `definePluginEntry`, `configSchema` dapat berupa factory malas; OpenClaw
  menyimpan skema yang telah di-resolve dalam memo pada akses pertama.

Pendaftaran CLI:

- Gunakan `api.registerCli(..., { descriptors: [...] })` untuk perintah
  CLI root milik plugin yang ingin dimuat secara malas tanpa menghilang dari pohon
  penguraian CLI root. Nama deskriptor harus cocok dengan huruf, angka, tanda hubung, dan
  garis bawah, serta dimulai dengan huruf atau angka; OpenClaw menolak bentuk lain
  dan menghapus urutan kontrol terminal dari deskripsi sebelum
  merender bantuan. Cakup setiap root perintah tingkat atas yang diekspos registrar.
  `commands` saja tetap menggunakan jalur kompatibilitas eager.
- Gunakan `api.registerNodeCliFeature(...)` untuk perintah fitur Node berpasangan agar
  ditempatkan di bawah `openclaw nodes` (setara dengan
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Untuk perintah plugin bertingkat lainnya, tambahkan `parentPath` dan daftarkan perintah
  pada objek `program` yang diteruskan ke registrar; OpenClaw me-resolve-nya menjadi
  perintah induk sebelum memanggil plugin.
- Untuk plugin saluran, daftarkan deskriptor CLI dari `registerCliMetadata`
  dan pertahankan fokus `registerFull` hanya pada pekerjaan runtime.
- Jika `registerFull` juga mendaftarkan metode RPC Gateway, pertahankan metode tersebut pada
  prefiks khusus plugin. Namespace admin inti yang dicadangkan (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) selalu dipaksa menjadi
  `operator.admin`.

## `defineSetupPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Untuk file `setup-entry.ts` yang ringan. Hanya mengembalikan `{ plugin }` tanpa
pengabelan runtime atau CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw memuat ini sebagai pengganti entri lengkap ketika suatu channel dinonaktifkan,
belum dikonfigurasi, atau ketika pemuatan tertunda diaktifkan. Lihat
[Penyiapan dan Konfigurasi](/id/plugins/sdk-setup#setup-entry) untuk mengetahui kapan hal ini penting.

Pasangkan `defineSetupPluginEntry(...)` dengan kelompok pembantu penyiapan yang spesifik:

| Impor                               | Digunakan untuk                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw/plugin-sdk/setup-runtime` | Pembantu penyiapan yang aman untuk runtime: `createSetupTranslator`, adaptor patch penyiapan yang aman untuk impor, keluaran catatan pencarian, `promptResolvedAllowFrom`, `splitSetupEntries`, proksi penyiapan yang didelegasikan |
| `openclaw/plugin-sdk/channel-setup` | Permukaan penyiapan instalasi opsional                                                                                                                                               |
| `openclaw/plugin-sdk/setup-tools`   | Pembantu CLI penyiapan/instalasi, arsip, dan dokumentasi                                                                                                                             |

Pertahankan SDK berat, pendaftaran CLI, dan layanan runtime berumur panjang di
entri lengkap.

Channel ruang kerja bawaan yang memisahkan permukaan penyiapan dan runtime dapat menggunakan
`defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` sebagai gantinya. Ini memungkinkan entri penyiapan
mempertahankan ekspor plugin/rahasia yang aman untuk penyiapan sekaligus tetap mengekspos penyetel runtime:

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
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* rute yang aman untuk penyiapan */
      },
    });
  },
});
```

Gunakan ini hanya ketika alur penyiapan benar-benar memerlukan penyetel runtime ringan atau
permukaan Gateway yang aman untuk penyiapan sebelum entri channel lengkap dimuat.
`registerSetupRuntime` hanya berjalan untuk pemuatan `"setup-runtime"`; batasi
pada rute atau metode khusus konfigurasi yang harus tersedia sebelum
aktivasi lengkap yang tertunda.

## Mode pendaftaran

`api.registrationMode` memberi tahu plugin Anda cara plugin tersebut dimuat:

| Mode               | Kapan                                              | Yang perlu didaftarkan                                                                                                      |
| ------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Startup Gateway normal                             | Semuanya                                                                                                                    |
| `"discovery"`      | Penemuan kapabilitas hanya-baca                    | Pendaftaran channel beserta deskriptor CLI statis; kode entri dapat dimuat, tetapi lewati soket, worker, klien, dan layanan |
| `"tool-discovery"` | Pemuatan terbatas untuk mencantumkan atau menjalankan alat plugin tertentu | Hanya pendaftaran kapabilitas/alat; tanpa aktivasi channel                                                                  |
| `"setup-only"`     | Channel dinonaktifkan/belum dikonfigurasi          | Hanya pendaftaran channel                                                                                                   |
| `"setup-runtime"`  | Alur penyiapan dengan runtime tersedia             | Pendaftaran channel beserta hanya runtime ringan yang diperlukan sebelum entri lengkap dimuat                              |
| `"cli-metadata"`   | Pengambilan bantuan root/metadata CLI              | Hanya deskriptor CLI                                                                                                        |

`defineChannelPluginEntry` menangani pemisahan ini secara otomatis. Jika Anda menggunakan
`definePluginEntry` secara langsung untuk suatu channel, periksa sendiri modenya dan ingat bahwa
`"tool-discovery"` melewati pendaftaran channel:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  if (api.registrationMode === "tool-discovery") {
    // Daftarkan permukaan khusus kapabilitas (penyedia/alat), tanpa channel.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Pendaftaran berat khusus runtime
  api.registerService(/* ... */);
}
```

Layanan berumur panjang dapat memancarkan peristiwa invalidasi atau siklus hidup kecil melalui
konteks layanannya:

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw memberi namespace ini sebagai `plugin.<plugin-id>.changed`. Nama peristiwa berupa satu
segmen huruf kecil, payload harus berupa JSON terbatas, dan cakupannya harus
`operator.read`, `operator.write`, atau `operator.admin`. Pemancar hanya tersedia
selama masa hidup layanan dan dicabut setelah penghentian atau kegagalan startup. Utamakan
payload versi atau invalidasi daripada rekaman lengkap agar klien yang berwenang membaca ulang
status kanonis melalui metode Gateway terbatas milik plugin.

Mode penemuan membangun snapshot registri tanpa aktivasi. Mode ini masih dapat
mengevaluasi entri plugin dan objek plugin channel agar OpenClaw dapat
mendaftarkan kapabilitas channel dan deskriptor CLI statis. Perlakukan evaluasi modul
dalam penemuan sebagai tepercaya tetapi ringan: tanpa klien jaringan,
subproses, listener, koneksi basis data, worker latar belakang,
pembacaan kredensial, atau efek samping runtime aktif lainnya pada tingkat teratas.

Perlakukan `"setup-runtime"` sebagai jendela tempat permukaan startup khusus penyiapan harus
tersedia tanpa memasuki ulang runtime channel bawaan lengkap. Yang cocok mencakup
pendaftaran channel, rute HTTP yang aman untuk penyiapan, metode Gateway yang aman untuk penyiapan,
dan pembantu penyiapan yang didelegasikan. Layanan latar belakang berat, pendaftar CLI, dan
bootstrap SDK penyedia/klien tetap berada di `"full"`.

## Bentuk plugin

OpenClaw mengklasifikasikan plugin yang dimuat berdasarkan perilaku pendaftarannya:

| Bentuk                | Deskripsi                                          |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Satu jenis kapabilitas (misalnya hanya penyedia)   |
| **hybrid-capability** | Beberapa jenis kapabilitas (misalnya penyedia + ucapan) |
| **hook-only**         | Hanya hook, tanpa kapabilitas                       |
| **non-capability**    | Alat/perintah/layanan tetapi tanpa kapabilitas      |

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) - API pendaftaran dan referensi subpath
- [Pembantu Runtime](/id/plugins/sdk-runtime) - `api.runtime` dan `createPluginRuntimeStore`
- [Penyiapan dan Konfigurasi](/id/plugins/sdk-setup) - manifes, entri penyiapan, pemuatan tertunda
- [Plugin Channel](/id/plugins/sdk-channel-plugins) - membangun objek `ChannelPlugin`
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - pendaftaran penyedia dan hook
