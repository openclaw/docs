---
read_when:
    - Anda memerlukan signature tipe yang tepat dari defineToolPlugin, definePluginEntry, atau defineChannelPluginEntry
    - Anda ingin memahami mode pendaftaran (penuh vs penyiapan vs metadata CLI)
    - Anda sedang mencari opsi titik masuk
sidebarTitle: Entry Points
summary: Referensi untuk defineToolPlugin, definePluginEntry, defineChannelPluginEntry, dan defineSetupPluginEntry
title: Titik masuk Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 49c024020202b754bde9bfa3f2a880332f1a5b4b19b397e59ae83c2673871211
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Setiap Plugin mengekspor objek entri default. SDK menyediakan helper untuk
membuatnya.

Untuk Plugin yang terinstal, `package.json` harus mengarahkan pemuatan runtime ke
JavaScript hasil build bila tersedia:

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

`extensions` dan `setupEntry` tetap menjadi entri sumber yang valid untuk
pengembangan workspace dan checkout git. `runtimeExtensions` dan
`runtimeSetupEntry` lebih diutamakan saat OpenClaw memuat paket terinstal dan
memungkinkan paket npm menghindari kompilasi TypeScript saat runtime. Entri
runtime eksplisit wajib ada: `runtimeSetupEntry` memerlukan `setupEntry`, dan
artefak `runtimeExtensions` atau `runtimeSetupEntry` yang hilang akan menggagalkan
instalasi/discovery, bukan diam-diam kembali ke sumber. Jika paket terinstal
hanya mendeklarasikan entri sumber TypeScript, OpenClaw akan menggunakan peer
`dist/*.js` hasil build yang cocok bila ada, lalu kembali ke sumber TypeScript.

Semua path entri harus tetap berada di dalam direktori paket Plugin. Entri
runtime dan peer JavaScript hasil build yang diinferensi tidak membuat path
sumber `extensions` atau `setupEntry` yang keluar direktori menjadi valid.

<Tip>
  **Mencari panduan langkah demi langkah?** Lihat [Plugin Alat](/id/plugins/tool-plugins),
  [Plugin Channel](/id/plugins/sdk-channel-plugins), atau
  [Plugin Provider](/id/plugins/sdk-provider-plugins) untuk panduan bertahap.
</Tip>

## `defineToolPlugin`

**Impor:** `openclaw/plugin-sdk/tool-plugin`

Untuk Plugin sederhana yang hanya menambahkan alat agen. `defineToolPlugin`
menjaga sumber authoring tetap kecil, menginferensi tipe config dan parameter
alat dari skema TypeBox, membungkus nilai return biasa dalam format hasil-alat
OpenClaw, dan mengekspos metadata statis yang ditulis oleh `openclaw plugins build`
ke manifest Plugin.

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

- `configSchema` bersifat opsional. Jika dihilangkan, OpenClaw menggunakan skema
  objek kosong yang ketat dan manifest yang dihasilkan tetap menyertakan
  `configSchema`.
- `execute` mengembalikan string biasa atau nilai yang dapat diserialisasi ke
  JSON. Helper membungkusnya sebagai hasil alat teks dengan `details`.
- Nama alat bersifat statis. `openclaw plugins build` menurunkan
  `contracts.tools` dari alat yang dideklarasikan, sehingga penulis tidak perlu
  menduplikasi nama secara manual.
- Pemuatan runtime tetap ketat. Plugin terinstal tetap memerlukan
  `openclaw.plugin.json` dan `package.json` `openclaw.extensions`; OpenClaw
  tidak mengeksekusi kode Plugin untuk menginferensi data manifest yang hilang.

## `definePluginEntry`

**Impor:** `openclaw/plugin-sdk/plugin-entry`

Untuk Plugin provider, Plugin alat tingkat lanjut, Plugin hook, dan apa pun yang
**bukan** channel pesan.

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
| `id`           | `string`                                                         | Ya    | -                   |
| `name`         | `string`                                                         | Ya    | -                   |
| `description`  | `string`                                                         | Ya    | -                   |
| `kind`         | `string`                                                         | Tidak | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong  |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ya    | -                   |

- `id` harus cocok dengan manifest `openclaw.plugin.json` Anda.
- `kind` digunakan untuk slot eksklusif: `"memory"` atau `"context-engine"`.
- `configSchema` dapat berupa fungsi untuk evaluasi malas.
- OpenClaw me-resolve dan me-memoize skema tersebut pada akses pertama, sehingga
  pembangun skema yang mahal hanya berjalan sekali.

## `defineChannelPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Membungkus `definePluginEntry` dengan wiring khusus channel. Secara otomatis
memanggil `api.registerChannel({ plugin })`, mengekspos seam metadata CLI
root-help opsional, dan membatasi `registerFull` berdasarkan mode registrasi.

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
| `id`                  | `string`                                                         | Ya    | -                   |
| `name`                | `string`                                                         | Ya    | -                   |
| `description`         | `string`                                                         | Ya    | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Ya    | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Tidak | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Tidak | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Tidak | -                   |

- `setRuntime` dipanggil selama registrasi agar Anda dapat menyimpan referensi
  runtime (biasanya melalui `createPluginRuntimeStore`). Ini dilewati selama
  pengambilan metadata CLI.
- `registerCliMetadata` berjalan selama `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, dan
  `api.registrationMode === "full"`.
  Gunakan ini sebagai tempat kanonis untuk deskriptor CLI milik channel agar
  bantuan root tetap tidak mengaktifkan, snapshot discovery menyertakan metadata
  perintah statis, dan registrasi perintah CLI normal tetap kompatibel dengan
  pemuatan Plugin penuh.
- Registrasi discovery tidak mengaktifkan, bukan bebas impor. OpenClaw dapat
  mengevaluasi entri Plugin tepercaya dan modul Plugin channel untuk membangun
  snapshot, jadi pastikan impor tingkat atas bebas efek samping dan letakkan
  socket, klien, worker, dan layanan di balik path khusus `"full"`.
- `registerFull` hanya berjalan saat `api.registrationMode === "full"`. Ini
  dilewati selama pemuatan setup-only.
- Seperti `definePluginEntry`, `configSchema` dapat berupa factory malas dan
  OpenClaw me-memoize skema yang di-resolve pada akses pertama.
- Untuk perintah CLI root milik Plugin, utamakan `api.registerCli(..., { descriptors: [...] })`
  bila Anda ingin perintah tetap dimuat secara malas tanpa menghilang dari pohon
  parsing CLI root. Untuk perintah fitur paired-node, utamakan
  `api.registerNodeCliFeature(...)` agar perintah berada di bawah `openclaw nodes`.
  Untuk perintah Plugin bersarang lainnya, tambahkan `parentPath` dan daftarkan
  perintah pada objek `program` yang diteruskan ke registrar; OpenClaw
  me-resolve-nya ke perintah induk sebelum memanggil Plugin. Untuk Plugin
  channel, utamakan mendaftarkan deskriptor tersebut dari `registerCliMetadata(...)`
  dan jaga agar `registerFull(...)` berfokus pada pekerjaan khusus runtime.
- Jika `registerFull(...)` juga mendaftarkan metode RPC Gateway, pertahankan
  metode tersebut pada prefiks khusus Plugin. Namespace admin inti yang
  dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) selalu
  dipaksa menjadi `operator.admin`.

## `defineSetupPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Untuk file `setup-entry.ts` yang ringan. Mengembalikan hanya `{ plugin }` tanpa
wiring runtime atau CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw memuat ini alih-alih entri penuh saat channel dinonaktifkan, belum
dikonfigurasi, atau saat pemuatan tertunda diaktifkan. Lihat
[Setup dan Config](/id/plugins/sdk-setup#setup-entry) untuk kapan ini penting.

Dalam praktiknya, pasangkan `defineSetupPluginEntry(...)` dengan keluarga helper
setup yang sempit:

- `openclaw/plugin-sdk/setup-runtime` untuk helper setup yang aman-runtime seperti
  `createSetupTranslator`, adapter patch setup yang aman-impor, output lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan proxy setup terdelegasi
- `openclaw/plugin-sdk/channel-setup` untuk surface setup optional-install
- `openclaw/plugin-sdk/setup-tools` untuk helper CLI/arsip/dokumen setup/install

Simpan SDK berat, registrasi CLI, dan layanan runtime berumur panjang di entri
penuh.

Channel workspace bundel yang memisahkan surface setup dan runtime dapat
menggunakan `defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` sebagai gantinya. Kontrak tersebut
memungkinkan entri setup mempertahankan ekspor Plugin/secrets yang aman-setup
sekaligus tetap mengekspos setter runtime:

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
        /* setup-safe route */
      },
    });
  },
});
```

Gunakan kontrak bundel tersebut hanya saat flow setup benar-benar memerlukan
setter runtime ringan atau surface Gateway yang aman-setup sebelum entri channel
penuh dimuat. `registerSetupRuntime` hanya berjalan untuk pemuatan
`"setup-runtime"`; batasi pada route atau metode khusus config yang harus ada
sebelum aktivasi penuh tertunda.

## Mode registrasi

`api.registrationMode` memberi tahu Plugin Anda bagaimana ia dimuat:

| Mode              | Kapan                             | Apa yang didaftarkan                                                                                                      |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Startup Gateway normal            | Semuanya                                                                                                                  |
| `"discovery"`     | Penemuan kapabilitas baca-saja    | Pendaftaran saluran plus deskriptor CLI statis; kode entri dapat dimuat, tetapi lewati soket, pekerja, klien, dan layanan |
| `"setup-only"`    | Saluran dinonaktifkan/belum dikonfigurasi | Hanya pendaftaran saluran                                                                                          |
| `"setup-runtime"` | Alur penyiapan dengan runtime tersedia | Pendaftaran saluran plus hanya runtime ringan yang diperlukan sebelum entri penuh dimuat                              |
| `"cli-metadata"`  | Bantuan root / pengambilan metadata CLI | Hanya deskriptor CLI                                                                                                 |

`defineChannelPluginEntry` menangani pemisahan ini secara otomatis. Jika Anda menggunakan
`definePluginEntry` secara langsung untuk saluran, periksa mode sendiri:

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

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Mode penemuan membangun snapshot registri yang tidak mengaktifkan. Mode ini masih dapat mengevaluasi
entri plugin dan objek plugin saluran agar OpenClaw dapat mendaftarkan
kapabilitas saluran dan deskriptor CLI statis. Perlakukan evaluasi modul dalam penemuan sebagai
tepercaya tetapi ringan: tidak ada klien jaringan, subproses, listener, koneksi basis data,
pekerja latar belakang, pembacaan kredensial, atau efek samping runtime langsung lainnya
di level teratas.

Perlakukan `"setup-runtime"` sebagai jendela saat permukaan startup khusus penyiapan harus
ada tanpa masuk ulang ke runtime saluran bundel penuh. Kecocokan yang baik adalah
pendaftaran saluran, rute HTTP yang aman untuk penyiapan, metode gateway yang aman untuk penyiapan, dan
pembantu penyiapan yang didelegasikan. Layanan latar belakang yang berat, registrar CLI, dan
bootstrap SDK penyedia/klien tetap berada di `"full"`.

Khusus untuk registrar CLI:

- gunakan `descriptors` saat registrar memiliki satu atau beberapa perintah root dan Anda
  ingin OpenClaw memuat modul CLI nyata secara malas pada pemanggilan pertama
- pastikan deskriptor tersebut mencakup setiap root perintah level teratas yang diekspos oleh
  registrar
- batasi nama perintah deskriptor pada huruf, angka, tanda hubung, dan garis bawah,
  dimulai dengan huruf atau angka; OpenClaw menolak nama deskriptor di luar
  bentuk tersebut dan menghapus urutan kontrol terminal dari deskripsi sebelum
  merender bantuan
- gunakan `commands` saja hanya untuk jalur kompatibilitas eager

## Bentuk Plugin

OpenClaw mengklasifikasikan plugin yang dimuat berdasarkan perilaku pendaftarannya:

| Bentuk                | Deskripsi                                          |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Satu jenis kapabilitas (mis. hanya penyedia)       |
| **hybrid-capability** | Beberapa jenis kapabilitas (mis. penyedia + ucapan) |
| **hook-only**         | Hanya hook, tanpa kapabilitas                      |
| **non-capability**    | Alat/perintah/layanan tetapi tanpa kapabilitas     |

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk plugin.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) - API pendaftaran dan referensi subpath
- [Pembantu Runtime](/id/plugins/sdk-runtime) - `api.runtime` dan `createPluginRuntimeStore`
- [Penyiapan dan Konfigurasi](/id/plugins/sdk-setup) - manifes, entri penyiapan, pemuatan tertunda
- [Plugin Saluran](/id/plugins/sdk-channel-plugins) - membangun objek `ChannelPlugin`
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - pendaftaran penyedia dan hook
