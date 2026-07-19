---
read_when:
    - Anda memerlukan signature tipe yang tepat dari defineToolPlugin, definePluginEntry, atau defineChannelPluginEntry
    - Anda ingin memahami mode pendaftaran (penuh vs penyiapan vs metadata CLI)
    - Anda sedang mencari opsi titik masuk
sidebarTitle: Entry Points
summary: Referensi untuk defineToolPlugin, definePluginEntry, defineChannelPluginEntry, dan defineSetupPluginEntry
title: Titik masuk Plugin
x-i18n:
    generated_at: "2026-07-19T05:30:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e64fe1d65531fea8f266aa23b73064daf2ed2c5c43af8bb08ea57e347fe566f4
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Setiap plugin mengekspor objek entri default. SDK menyediakan helper untuk
setiap bentuk entri: `defineToolPlugin`, `definePluginEntry`,
`defineChannelPluginEntry`, `defineSetupPluginEntry`.

<Tip>
  **Mencari panduan langkah demi langkah?** Lihat [Plugin Alat](/id/plugins/tool-plugins),
  [Plugin Kanal](/id/plugins/sdk-channel-plugins), atau
  [Plugin Penyedia](/id/plugins/sdk-provider-plugins) untuk panduan langkah demi langkah.
</Tip>

## Entri paket

Plugin yang terinstal mengarahkan kolom `package.json` `openclaw` ke entri sumber dan
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

- `extensions` dan `setupEntry` adalah entri sumber, yang digunakan untuk pengembangan
  workspace dan checkout git.
- `runtimeExtensions` dan `runtimeSetupEntry` lebih disarankan untuk paket yang
  terinstal: keduanya memungkinkan paket npm melewati kompilasi TypeScript saat runtime.
- `runtimeExtensions`, jika tersedia, harus cocok dengan `extensions` dalam panjang array
  (entri dipasangkan berdasarkan posisi). `runtimeSetupEntry` memerlukan `setupEntry`.
- Jika artefak `runtimeExtensions`/`runtimeSetupEntry` dideklarasikan tetapi
  tidak ada, instalasi/penemuan gagal dengan kesalahan pemaketan; OpenClaw tidak
  secara diam-diam kembali ke sumber. Fallback sumber (di bawah) hanya berlaku jika tidak ada
  entri runtime yang dideklarasikan sama sekali.
- Jika paket yang terinstal hanya mendeklarasikan entri sumber TypeScript, OpenClaw
  mencari pasangan `dist/*.js` hasil build yang cocok (atau `.mjs`/`.cjs`) dan menggunakannya;
  jika tidak, OpenClaw kembali ke sumber TypeScript.
- Semua jalur entri harus tetap berada di dalam direktori paket plugin. Entri
  runtime dan pasangan JS hasil build yang disimpulkan tidak membuat jalur sumber `extensions` atau
  `setupEntry` yang keluar dari direktori menjadi valid.

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
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          hasKey: Type.Boolean(),
        },
        { additionalProperties: false },
      ),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` bersifat opsional; jika dihilangkan, skema objek kosong yang ketat akan digunakan
  (manifes yang dihasilkan tetap menyertakan `configSchema`).
- `execute` mengembalikan string biasa atau nilai yang dapat diserialisasi sebagai JSON; helper
  membungkusnya sebagai hasil alat teks dengan `details` yang ditetapkan ke nilai hasil
  asli (yang belum diubah menjadi string).
- `outputSchema` secara opsional mendeskripsikan nilai `details` asli tersebut untuk Mode Kode
  dan Pencarian Alat. Pemanggilan katalog menolak skema yang tidak valid sebelum eksekusi
  dan memvalidasi nilai akhir sebelum mengembalikannya.
- Untuk hasil alat khusus, `openclaw/plugin-sdk/tool-results` mengekspor
  `textResult` dan `jsonResult`.
- Nama alat bersifat statis, sehingga `openclaw plugins build` memperoleh
  `contracts.tools` dari alat yang dideklarasikan tanpa menduplikasi nama secara manual.
- Pemuatan runtime tetap ketat: plugin yang terinstal masih memerlukan
  `openclaw.plugin.json` dan `package.json` `openclaw.extensions`. OpenClaw
  tidak pernah mengeksekusi kode plugin untuk menyimpulkan data manifes yang hilang.

## `definePluginEntry`

**Impor:** `openclaw/plugin-sdk/plugin-entry`

Untuk plugin penyedia, plugin alat tingkat lanjut, plugin hook, dan segala sesuatu yang
**bukan** kanal perpesanan.

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

| Kolom                     | Tipe                                                             | Wajib | Default             |
| ------------------------- | ---------------------------------------------------------------- | ----- | ------------------- |
| `id`                      | `string`                                                         | Ya    | -                   |
| `name`                    | `string`                                                         | Ya    | -                   |
| `description`             | `string`                                                         | Ya    | -                   |
| `kind`                    | `string` (tidak digunakan lagi, lihat di bawah)                  | Tidak | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | Tidak | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | Tidak | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | Tidak | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | Ya    | -                   |

- `id` harus cocok dengan manifes `openclaw.plugin.json` Anda.
- Katalog sesi eksternal menggunakan
  `openclaw/plugin-sdk/session-catalog` dan
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`.
  Core memiliki metode Gateway `sessions.catalog.*`; penyedia mengembalikan proyeksi host,
  sesi, dan transkrip yang dinormalisasi tanpa mendaftarkan RPC. Penyedia
  daftar harus memanggil callback opsional `onHost(host)` saat setiap host
  selesai; array host yang dikembalikan tetap wajib sebagai snapshot kompatibilitas
  akhir.
- `kind` tidak digunakan lagi: deklarasikan slot eksklusif (`"memory"` atau
  `"context-engine"`) dalam kolom `kind` pada manifes `openclaw.plugin.json`
  sebagai gantinya. `kind` pada entri runtime tetap ada hanya sebagai fallback kompatibilitas untuk
  plugin lama.
- `configSchema` dapat berupa fungsi untuk evaluasi lambat. OpenClaw menyelesaikan dan
  menyimpan skema dalam memo pada akses pertama, sehingga pembuat skema yang mahal hanya dijalankan
  sekali.
- Deskriptor `nodeHostCommands` dapat mendefinisikan `isAvailable({ config, env })`.
  Mengembalikan `false` akan menghilangkan perintah tersebut dan kapabilitasnya dari deklarasi Gateway
  milik node headless. OpenClaw mengevaluasinya berdasarkan konfigurasi startup lokal
  node; handler perintah tetap harus memvalidasi ketersediaan saat
  dipanggil.

## `defineChannelPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Membungkus `definePluginEntry` dengan pengkabelan khusus kanal: secara otomatis
memanggil `api.registerChannel({ plugin })`, mengekspos seam metadata CLI
bantuan root opsional, dan membatasi `registerFull` berdasarkan mode pendaftaran.

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

| Kolom                 | Tipe                                                             | Wajib | Default             |
| --------------------- | ---------------------------------------------------------------- | ----- | ------------------- |
| `id`                  | `string`                                                         | Ya    | -                   |
| `name`                | `string`                                                         | Ya    | -                   |
| `description`         | `string`                                                         | Ya    | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Ya    | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Tidak | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Tidak | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Tidak | -                   |

Callback dijalankan untuk setiap mode pendaftaran (tabel lengkap di bagian
[Mode pendaftaran](#registration-mode)):

- `setRuntime` dijalankan dalam setiap mode kecuali `"cli-metadata"` dan
  `"tool-discovery"`. Simpan referensi runtime di sini, biasanya melalui
  `createPluginRuntimeStore`.
- `registerCliMetadata` dijalankan untuk `"cli-metadata"`, `"discovery"`, dan
  `"full"`. Gunakan sebagai tempat kanonis untuk deskriptor CLI milik kanal
  agar bantuan root tetap tidak mengaktifkan plugin, snapshot penemuan menyertakan metadata
  perintah statis, dan pendaftaran CLI normal tetap kompatibel dengan pemuatan
  plugin lengkap.
- `registerFull` hanya dijalankan untuk `"full"` dan `"tool-discovery"`. Untuk
  `"tool-discovery"`, callback ini dijalankan _sebagai pengganti_ pendaftaran kanal: OpenClaw
  sepenuhnya melewati `registerChannel`/`setRuntime` dan hanya memanggil
  `registerFull`, sehingga pendaftaran penyedia/alat apa pun yang diperlukan kanal Anda untuk
  penemuan atau eksekusi alat mandiri harus berada di sana, bukan di balik penyiapan
  kanal normal.
- Pendaftaran penemuan tidak mengaktifkan plugin, tetapi bukan berarti tanpa impor: OpenClaw dapat
  mengevaluasi entri plugin tepercaya dan modul plugin kanal untuk membangun
  snapshot. Pastikan impor tingkat atas bebas efek samping dan tempatkan soket,
  klien, worker, serta layanan di balik jalur khusus `"full"`.
- Seperti `definePluginEntry`, `configSchema` dapat berupa factory lambat; OpenClaw
  menyimpan skema yang telah diselesaikan dalam memo pada akses pertama.

Pendaftaran CLI:

- Gunakan `api.registerCli(..., { descriptors: [...] })` untuk perintah
  CLI root milik plugin yang ingin dimuat secara lazy tanpa menghilang dari pohon
  penguraian CLI root. Nama deskriptor harus cocok dengan huruf, angka, tanda hubung, dan
  garis bawah, serta diawali dengan huruf atau angka; OpenClaw menolak bentuk
  lain dan menghapus urutan kontrol terminal dari deskripsi sebelum
  merender bantuan. Cakup setiap root perintah tingkat atas yang diekspos registrar.
  `commands` saja tetap berada pada jalur kompatibilitas eager.
- Gunakan `api.registerNodeCliFeature(...)` untuk perintah fitur Node berpasangan agar
  ditempatkan di bawah `openclaw nodes` (setara dengan
  `registerCli(registrar, { parentPath: ["nodes"], ... })`).
- Untuk perintah plugin bertingkat lainnya, tambahkan `parentPath` dan daftarkan perintah
  pada objek `program` yang diteruskan ke registrar; OpenClaw menyelesaikannya menjadi
  perintah induk sebelum memanggil plugin.
- Untuk plugin kanal, daftarkan deskriptor CLI dari `registerCliMetadata`
  dan pertahankan fokus `registerFull` hanya pada pekerjaan runtime.
- Jika `registerFull` juga mendaftarkan metode RPC Gateway, pertahankan metode tersebut pada
  prefiks khusus plugin. Namespace admin inti yang dicadangkan (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) selalu dipaksa menjadi
  `operator.admin`.

## `defineSetupPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Untuk berkas `setup-entry.ts` yang ringan. Hanya mengembalikan `{ plugin }` tanpa
pengkabelan runtime atau CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw memuat ini sebagai pengganti entri lengkap saat kanal dinonaktifkan,
belum dikonfigurasi, atau saat pemuatan tertunda diaktifkan. Lihat
[Penyiapan dan Konfigurasi](/id/plugins/sdk-setup#setup-entry) untuk mengetahui kapan hal ini penting.

Pasangkan `defineSetupPluginEntry(...)` dengan kelompok helper penyiapan yang terbatas:

| Impor                               | Digunakan untuk                                                                                                                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | Helper penyiapan yang aman untuk runtime: `createSetupTranslator`, adaptor patch penyiapan yang aman untuk impor, keluaran catatan pencarian, `promptResolvedAllowFrom`, `splitSetupEntries`, proksi penyiapan yang didelegasikan |
| `openclaw/plugin-sdk/channel-setup` | Permukaan penyiapan instalasi opsional                                                                                                                                              |
| `openclaw/plugin-sdk/setup-tools`   | Helper CLI penyiapan/instalasi, arsip, dan dokumentasi                                                                                                                              |

Pertahankan SDK berat, pendaftaran CLI, dan layanan runtime berumur panjang di
entri lengkap.

Kanal workspace bawaan yang memisahkan permukaan penyiapan dan runtime dapat menggunakan
`defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` sebagai gantinya. Ini memungkinkan entri
penyiapan mempertahankan ekspor plugin/rahasia yang aman untuk penyiapan sambil tetap mengekspos setter
runtime:

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

Gunakan ini hanya saat alur penyiapan benar-benar memerlukan setter runtime ringan atau
permukaan Gateway yang aman untuk penyiapan sebelum entri kanal lengkap dimuat.
`registerSetupRuntime` hanya berjalan untuk pemuatan `"setup-runtime"`; batasi
pada rute atau metode khusus konfigurasi yang harus tersedia sebelum aktivasi
lengkap tertunda.

## Mode pendaftaran

`api.registrationMode` memberi tahu plugin Anda bagaimana plugin tersebut dimuat:

| Mode               | Kapan                                              | Yang harus didaftarkan                                                                                                                   |
| ------------------ | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Startup Gateway normal                             | Semuanya                                                                                                                                 |
| `"discovery"`      | Penemuan kapabilitas hanya-baca                    | Pendaftaran kanal ditambah deskriptor CLI statis; kode entri boleh dimuat, tetapi lewati soket, worker, klien, dan layanan                 |
| `"tool-discovery"` | Pemuatan terbatas untuk mencantumkan atau menjalankan alat plugin tertentu | Hanya pendaftaran kapabilitas/alat; tanpa aktivasi kanal                                                                                  |
| `"setup-only"`     | Kanal dinonaktifkan/belum dikonfigurasi             | Hanya pendaftaran kanal                                                                                                                   |
| `"setup-runtime"`  | Alur penyiapan dengan runtime tersedia             | Pendaftaran kanal ditambah hanya runtime ringan yang diperlukan sebelum entri lengkap dimuat                                             |
| `"cli-metadata"`   | Bantuan root / pengambilan metadata CLI             | Hanya deskriptor CLI                                                                                                                      |

`defineChannelPluginEntry` menangani pemisahan ini secara otomatis. Jika Anda menggunakan
`definePluginEntry` secara langsung untuk sebuah kanal, periksa sendiri mode tersebut dan ingat
bahwa `"tool-discovery"` melewati pendaftaran kanal:

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
    // Daftarkan permukaan khusus kapabilitas (penyedia/alat), tanpa kanal.
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

OpenClaw memberi namespace ini sebagai `plugin.<plugin-id>.changed`. Nama peristiwa terdiri atas satu
segmen huruf kecil, payload harus berupa JSON terbatas, dan cakupannya harus
`operator.read`, `operator.write`, atau `operator.admin`. Pemancar hanya tersedia
selama masa aktif layanan dan dicabut setelah berhenti atau gagal dimulai. Utamakan
payload versi atau invalidasi daripada rekaman lengkap agar klien yang berwenang membaca ulang
status kanonis melalui metode Gateway terbatas milik plugin.

Mode penemuan membuat snapshot registri tanpa aktivasi. Mode ini tetap dapat
mengevaluasi entri plugin dan objek plugin kanal agar OpenClaw dapat
mendaftarkan kapabilitas kanal dan deskriptor CLI statis. Perlakukan evaluasi modul
dalam penemuan sebagai tepercaya tetapi ringan: tanpa klien jaringan,
subproses, listener, koneksi basis data, worker latar belakang,
pembacaan kredensial, atau efek samping runtime aktif lainnya pada tingkat teratas.

Perlakukan `"setup-runtime"` sebagai jendela tempat permukaan startup khusus penyiapan harus
tersedia tanpa memasuki kembali runtime kanal bawaan lengkap. Yang sesuai mencakup
pendaftaran kanal, rute HTTP yang aman untuk penyiapan, metode Gateway yang aman untuk penyiapan,
dan helper penyiapan yang didelegasikan. Layanan latar belakang berat, registrar CLI, dan
bootstrap SDK penyedia/klien tetap berada di `"full"`.

## Bentuk plugin

OpenClaw mengklasifikasikan plugin yang dimuat berdasarkan perilaku pendaftarannya:

| Bentuk                | Deskripsi                                          |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Satu jenis kapabilitas (misalnya hanya penyedia)   |
| **hybrid-capability** | Beberapa jenis kapabilitas (misalnya penyedia + suara) |
| **hook-only**         | Hanya hook, tanpa kapabilitas                      |
| **non-capability**    | Alat/perintah/layanan tetapi tanpa kapabilitas     |

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) - API pendaftaran dan referensi subjalur
- [Helper Runtime](/id/plugins/sdk-runtime) - `api.runtime` dan `createPluginRuntimeStore`
- [Penyiapan dan Konfigurasi](/id/plugins/sdk-setup) - manifes, entri penyiapan, pemuatan tertunda
- [Plugin Kanal](/id/plugins/sdk-channel-plugins) - membangun objek `ChannelPlugin`
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - pendaftaran penyedia dan hook
