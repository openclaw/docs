---
read_when:
    - Anda memerlukan tanda tangan tipe yang tepat dari definePluginEntry atau defineChannelPluginEntry
    - Anda ingin memahami mode pendaftaran (full vs setup vs metadata CLI)
    - Anda sedang mencari opsi titik masuk
sidebarTitle: Entry Points
summary: Referensi untuk definePluginEntry, defineChannelPluginEntry, dan defineSetupPluginEntry
title: Titik masuk Plugin
x-i18n:
    generated_at: "2026-05-02T09:28:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: a29e7e12c38fb579bb78a0e1e753edafc43298c2795504969c3477c849a5d74d
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Setiap plugin mengekspor objek entri default. SDK menyediakan tiga helper untuk
membuatnya.

Untuk plugin yang diinstal, `package.json` harus mengarahkan pemuatan runtime ke
JavaScript hasil build saat tersedia:

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
`runtimeSetupEntry` lebih disukai saat OpenClaw memuat paket yang diinstal dan
memungkinkan paket npm menghindari kompilasi TypeScript saat runtime. Entri
runtime eksplisit wajib ada: `runtimeSetupEntry` memerlukan `setupEntry`, dan
artefak `runtimeExtensions` atau `runtimeSetupEntry` yang hilang akan menggagalkan
instalasi/penemuan alih-alih diam-diam kembali ke sumber. Jika sebuah paket yang
diinstal hanya mendeklarasikan entri sumber TypeScript, OpenClaw akan menggunakan
peer `dist/*.js` hasil build yang cocok saat ada, lalu kembali ke sumber TypeScript.

Semua path entri harus tetap berada di dalam direktori paket plugin. Entri runtime
dan peer JavaScript hasil build yang disimpulkan tidak membuat path sumber
`extensions` atau `setupEntry` yang keluar direktori menjadi valid.

<Tip>
  **Mencari panduan langkah demi langkah?** Lihat [Plugin Saluran](/id/plugins/sdk-channel-plugins)
  atau [Plugin Penyedia](/id/plugins/sdk-provider-plugins) untuk panduan bertahap.
</Tip>

## `definePluginEntry`

**Impor:** `openclaw/plugin-sdk/plugin-entry`

Untuk plugin penyedia, plugin alat, plugin hook, dan apa pun yang **bukan**
saluran perpesanan.

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

| Kolom          | Tipe                                                             | Wajib | Default             |
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
- OpenClaw menyelesaikan dan melakukan memoize skema tersebut pada akses pertama,
  sehingga pembuat skema yang mahal hanya berjalan sekali.

## `defineChannelPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Membungkus `definePluginEntry` dengan wiring khusus saluran. Secara otomatis
memanggil `api.registerChannel({ plugin })`, mengekspos seam metadata CLI
bantuan root opsional, dan membatasi `registerFull` berdasarkan mode registrasi.

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

| Kolom                 | Tipe                                                             | Wajib | Default            |
| --------------------- | ---------------------------------------------------------------- | ----- | ------------------ |
| `id`                  | `string`                                                         | Ya    | —                  |
| `name`                | `string`                                                         | Ya    | —                  |
| `description`         | `string`                                                         | Ya    | —                  |
| `plugin`              | `ChannelPlugin`                                                  | Ya    | —                  |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Tidak | —                  |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Tidak | —                  |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Tidak | —                  |

- `setRuntime` dipanggil selama registrasi agar Anda dapat menyimpan referensi
  runtime (biasanya melalui `createPluginRuntimeStore`). Ini dilewati selama
  pengambilan metadata CLI.
- `registerCliMetadata` berjalan selama `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, dan
  `api.registrationMode === "full"`.
  Gunakan ini sebagai tempat kanonis untuk deskriptor CLI milik saluran agar
  bantuan root tetap tidak mengaktifkan, snapshot penemuan menyertakan metadata
  perintah statis, dan registrasi perintah CLI normal tetap kompatibel dengan
  pemuatan plugin penuh.
- Registrasi penemuan bersifat tidak mengaktifkan, bukan bebas impor. OpenClaw
  dapat mengevaluasi entri plugin tepercaya dan modul plugin saluran untuk
  membuat snapshot, jadi jaga impor tingkat atas bebas efek samping dan letakkan
  socket, klien, worker, dan layanan di belakang path khusus `"full"`.
- `registerFull` hanya berjalan saat `api.registrationMode === "full"`. Ini
  dilewati selama pemuatan khusus setup.
- Seperti `definePluginEntry`, `configSchema` dapat berupa factory malas dan
  OpenClaw melakukan memoize skema yang terselesaikan pada akses pertama.
- Untuk perintah CLI root milik plugin, pilih `api.registerCli(..., { descriptors: [...] })`
  saat Anda ingin perintah tetap dimuat secara malas tanpa menghilang dari
  pohon parse CLI root. Untuk plugin saluran, pilih mendaftarkan deskriptor
  tersebut dari `registerCliMetadata(...)` dan jaga `registerFull(...)` tetap
  berfokus pada pekerjaan khusus runtime.
- Jika `registerFull(...)` juga mendaftarkan metode RPC Gateway, pertahankan
  pada prefiks khusus plugin. Namespace admin inti yang dicadangkan (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) selalu dipaksa menjadi
  `operator.admin`.

## `defineSetupPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Untuk file ringan `setup-entry.ts`. Mengembalikan hanya `{ plugin }` tanpa
wiring runtime atau CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw memuat ini alih-alih entri penuh saat sebuah saluran dinonaktifkan,
belum dikonfigurasi, atau saat pemuatan tertunda diaktifkan. Lihat
[Setup dan Konfigurasi](/id/plugins/sdk-setup#setup-entry) untuk kapan ini penting.

Dalam praktiknya, pasangkan `defineSetupPluginEntry(...)` dengan keluarga helper
setup yang sempit:

- `openclaw/plugin-sdk/setup-runtime` untuk helper setup yang aman bagi runtime
  seperti adapter patch setup yang aman impor, output catatan pencarian,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan proxy setup terdelegasi
- `openclaw/plugin-sdk/channel-setup` untuk permukaan setup instalasi opsional
- `openclaw/plugin-sdk/setup-tools` untuk helper setup/instalasi CLI/arsip/dokumen

Simpan SDK berat, registrasi CLI, dan layanan runtime berumur panjang di entri
penuh.

Saluran workspace bawaan yang memisahkan permukaan setup dan runtime dapat
menggunakan `defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` sebagai gantinya. Kontrak tersebut
memungkinkan entri setup mempertahankan ekspor plugin/rahasia yang aman untuk
setup sambil tetap mengekspos setter runtime:

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

Gunakan kontrak bawaan tersebut hanya saat alur setup benar-benar memerlukan
setter runtime ringan sebelum entri saluran penuh dimuat.

## Mode registrasi

`api.registrationMode` memberi tahu plugin Anda bagaimana ia dimuat:

| Mode              | Kapan                             | Apa yang didaftarkan                                                                                                      |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Startup gateway normal            | Semuanya                                                                                                                  |
| `"discovery"`     | Penemuan kapabilitas baca-saja    | Registrasi saluran plus deskriptor CLI statis; kode entri dapat dimuat, tetapi lewati socket, worker, klien, dan layanan |
| `"setup-only"`    | Saluran dinonaktifkan/belum dikonfigurasi | Registrasi saluran saja                                                                                             |
| `"setup-runtime"` | Alur setup dengan runtime tersedia | Registrasi saluran plus hanya runtime ringan yang diperlukan sebelum entri penuh dimuat                                 |
| `"cli-metadata"`  | Bantuan root / pengambilan metadata CLI | Deskriptor CLI saja                                                                                                  |

`defineChannelPluginEntry` menangani pemisahan ini secara otomatis. Jika Anda
menggunakan `definePluginEntry` langsung untuk sebuah saluran, periksa mode
sendiri:

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

Mode penemuan membuat snapshot registry yang tidak mengaktifkan. Ini masih dapat
mengevaluasi entri plugin dan objek plugin saluran agar OpenClaw dapat
mendaftarkan kapabilitas saluran dan deskriptor CLI statis. Perlakukan evaluasi
modul dalam penemuan sebagai tepercaya tetapi ringan: tidak ada klien jaringan,
subproses, listener, koneksi basis data, worker latar belakang, pembacaan
kredensial, atau efek samping runtime langsung lainnya di tingkat atas.

Perlakukan `"setup-runtime"` sebagai jendela ketika permukaan startup khusus
setup harus ada tanpa masuk kembali ke runtime saluran bawaan penuh. Kecocokan
yang baik meliputi registrasi saluran, route HTTP yang aman untuk setup, metode
Gateway yang aman untuk setup, dan helper setup terdelegasi. Layanan latar
belakang berat, registrar CLI, dan bootstrap SDK penyedia/klien tetap berada di
`"full"`.

Khusus untuk registrar CLI:

- gunakan `descriptors` saat registrar memiliki satu atau beberapa perintah root
  dan Anda ingin OpenClaw memuat modul CLI sebenarnya secara malas pada pemanggilan
  pertama
- pastikan deskriptor tersebut mencakup setiap root perintah tingkat atas yang
  diekspos oleh registrar
- jaga nama perintah deskriptor hanya berisi huruf, angka, tanda hubung, dan
  garis bawah, dimulai dengan huruf atau angka; OpenClaw menolak nama deskriptor
  di luar bentuk tersebut dan menghapus rangkaian kontrol terminal dari deskripsi
  sebelum merender bantuan
- gunakan `commands` saja hanya untuk path kompatibilitas eager

## Bentuk plugin

OpenClaw mengklasifikasikan plugin yang dimuat berdasarkan perilaku pendaftarannya:

| Bentuk                | Deskripsi                                          |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Satu jenis kapabilitas (mis. hanya penyedia)       |
| **hybrid-capability** | Beberapa jenis kapabilitas (mis. penyedia + ucapan) |
| **hook-only**         | Hanya hook, tanpa kapabilitas                      |
| **non-capability**    | Alat/perintah/layanan tetapi tanpa kapabilitas     |

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk sebuah plugin.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) — API pendaftaran dan referensi subpath
- [Helper Runtime](/id/plugins/sdk-runtime) — `api.runtime` dan `createPluginRuntimeStore`
- [Penyiapan dan Konfigurasi](/id/plugins/sdk-setup) — manifes, entri penyiapan, pemuatan tertunda
- [Plugin Kanal](/id/plugins/sdk-channel-plugins) — membangun objek `ChannelPlugin`
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) — pendaftaran penyedia dan hook
