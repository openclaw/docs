---
read_when:
    - Anda memerlukan tanda tangan tipe yang tepat untuk definePluginEntry atau defineChannelPluginEntry
    - Anda ingin memahami mode pendaftaran (penuh vs penyiapan vs metadata CLI)
    - Anda sedang mencari opsi titik masuk
sidebarTitle: Entry Points
summary: Referensi untuk definePluginEntry, defineChannelPluginEntry, dan defineSetupPluginEntry
title: Titik masuk Plugin
x-i18n:
    generated_at: "2026-05-06T09:22:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 296fded1572c4f95cc6c2eb8a7069a310ec05cce673003f81e86a916708cc85c
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

Setiap Plugin mengekspor objek entri default. SDK menyediakan tiga helper untuk
membuatnya.

Untuk Plugin yang terpasang, `package.json` sebaiknya mengarahkan pemuatan runtime
ke JavaScript hasil build saat tersedia:

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

`extensions` dan `setupEntry` tetap valid sebagai entri sumber untuk pengembangan
workspace dan checkout git. `runtimeExtensions` dan `runtimeSetupEntry` lebih
disukai ketika OpenClaw memuat paket terpasang dan memungkinkan paket npm
menghindari kompilasi TypeScript saat runtime. Entri runtime eksplisit diperlukan:
`runtimeSetupEntry` memerlukan `setupEntry`, dan artefak `runtimeExtensions` atau
`runtimeSetupEntry` yang hilang akan menggagalkan instalasi/discovery alih-alih
diam-diam kembali ke sumber. Jika paket terpasang hanya mendeklarasikan entri
sumber TypeScript, OpenClaw akan menggunakan rekan `dist/*.js` hasil build yang
cocok saat ada, lalu kembali ke sumber TypeScript.

Semua path entri harus tetap berada di dalam direktori paket Plugin. Entri runtime
dan rekan JavaScript hasil build yang diinferensikan tidak membuat path sumber
`extensions` atau `setupEntry` yang keluar dari paket menjadi valid.

<Tip>
  **Mencari panduan langkah demi langkah?** Lihat [Plugin Saluran](/id/plugins/sdk-channel-plugins)
  atau [Plugin Penyedia](/id/plugins/sdk-provider-plugins) untuk panduan bertahap.
</Tip>

## `definePluginEntry`

**Impor:** `openclaw/plugin-sdk/plugin-entry`

Untuk Plugin penyedia, Plugin alat, Plugin hook, dan apa pun yang **bukan**
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

| Bidang         | Tipe                                                             | Wajib | Default             |
| -------------- | ---------------------------------------------------------------- | ----- | ------------------- |
| `id`           | `string`                                                         | Ya    | -                   |
| `name`         | `string`                                                         | Ya    | -                   |
| `description`  | `string`                                                         | Ya    | -                   |
| `kind`         | `string`                                                         | Tidak | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong  |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Ya    | -                   |

- `id` harus cocok dengan manifes `openclaw.plugin.json` Anda.
- `kind` digunakan untuk slot eksklusif: `"memory"` atau `"context-engine"`.
- `configSchema` dapat berupa fungsi untuk evaluasi malas.
- OpenClaw menyelesaikan dan melakukan memoization skema tersebut pada akses pertama, sehingga builder skema
  yang mahal hanya berjalan sekali.

## `defineChannelPluginEntry`

**Impor:** `openclaw/plugin-sdk/channel-core`

Membungkus `definePluginEntry` dengan wiring khusus saluran. Secara otomatis memanggil
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
| `id`                  | `string`                                                         | Ya    | -                   |
| `name`                | `string`                                                         | Ya    | -                   |
| `description`         | `string`                                                         | Ya    | -                   |
| `plugin`              | `ChannelPlugin`                                                  | Ya    | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Tidak | Skema objek kosong  |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Tidak | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Tidak | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Tidak | -                   |

- `setRuntime` dipanggil selama pendaftaran agar Anda dapat menyimpan referensi runtime
  (biasanya melalui `createPluginRuntimeStore`). Ini dilewati selama penangkapan metadata CLI.
- `registerCliMetadata` berjalan selama `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"`, dan
  `api.registrationMode === "full"`.
  Gunakan ini sebagai tempat kanonis untuk deskriptor CLI milik saluran agar bantuan root
  tetap tidak mengaktifkan, snapshot discovery menyertakan metadata perintah statis, dan
  pendaftaran perintah CLI normal tetap kompatibel dengan pemuatan Plugin penuh.
- Pendaftaran discovery bersifat tidak mengaktifkan, bukan bebas impor. OpenClaw dapat
  mengevaluasi entri Plugin tepercaya dan modul Plugin saluran untuk membangun
  snapshot, jadi jaga impor tingkat-atas bebas efek samping dan letakkan socket,
  klien, worker, dan layanan di balik path khusus `"full"`.
- `registerFull` hanya berjalan ketika `api.registrationMode === "full"`. Ini dilewati
  selama pemuatan khusus setup.
- Seperti `definePluginEntry`, `configSchema` dapat berupa factory malas dan OpenClaw
  melakukan memoization skema yang terselesaikan pada akses pertama.
- Untuk perintah CLI root milik Plugin, lebih pilih `api.registerCli(..., { descriptors: [...] })`
  ketika Anda ingin perintah tetap dimuat secara malas tanpa menghilang dari
  pohon parse CLI root. Untuk Plugin saluran, lebih pilih mendaftarkan deskriptor tersebut
  dari `registerCliMetadata(...)` dan jaga `registerFull(...)` tetap berfokus pada pekerjaan khusus runtime.
- Jika `registerFull(...)` juga mendaftarkan metode RPC Gateway, pertahankan metode tersebut pada
  prefix khusus Plugin. Namespace admin inti yang dicadangkan (`config.*`,
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

OpenClaw memuat ini sebagai pengganti entri penuh ketika saluran dinonaktifkan,
belum dikonfigurasi, atau ketika pemuatan tertunda diaktifkan. Lihat
[Setup dan Konfigurasi](/id/plugins/sdk-setup#setup-entry) untuk kapan ini penting.

Dalam praktiknya, pasangkan `defineSetupPluginEntry(...)` dengan keluarga helper setup
yang sempit:

- `openclaw/plugin-sdk/setup-runtime` untuk helper setup yang aman runtime seperti
  adaptor patch setup yang aman diimpor, output catatan pencarian,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan proxy setup yang didelegasikan
- `openclaw/plugin-sdk/channel-setup` untuk permukaan setup instalasi opsional
- `openclaw/plugin-sdk/setup-tools` untuk helper CLI/arsip/dokumen setup/instalasi

Simpan SDK berat, pendaftaran CLI, dan layanan runtime berumur panjang di entri
penuh.

Saluran workspace bawaan yang memisahkan permukaan setup dan runtime dapat menggunakan
`defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` sebagai gantinya. Kontrak tersebut memungkinkan
entri setup mempertahankan ekspor Plugin/secret yang aman untuk setup sekaligus tetap mengekspos
setter runtime:

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

Gunakan kontrak bawaan tersebut hanya ketika alur setup benar-benar membutuhkan setter runtime
ringan sebelum entri saluran penuh dimuat.

## Mode pendaftaran

`api.registrationMode` memberi tahu Plugin Anda bagaimana ia dimuat:

| Mode              | Kapan                             | Apa yang didaftarkan                                                                                                    |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | Startup Gateway normal            | Semuanya                                                                                                                |
| `"discovery"`     | Discovery kapabilitas baca-saja   | Pendaftaran saluran plus deskriptor CLI statis; kode entri dapat dimuat, tetapi lewati socket, worker, klien, dan layanan |
| `"setup-only"`    | Saluran dinonaktifkan/belum dikonfigurasi | Hanya pendaftaran saluran                                                                                         |
| `"setup-runtime"` | Alur setup dengan runtime tersedia | Pendaftaran saluran plus hanya runtime ringan yang diperlukan sebelum entri penuh dimuat                               |
| `"cli-metadata"`  | Bantuan root / penangkapan metadata CLI | Hanya deskriptor CLI                                                                                              |

`defineChannelPluginEntry` menangani pemisahan ini secara otomatis. Jika Anda menggunakan
`definePluginEntry` langsung untuk saluran, periksa mode sendiri:

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

Mode discovery membangun snapshot registry yang tidak mengaktifkan. Ini mungkin tetap mengevaluasi
entri Plugin dan objek Plugin saluran agar OpenClaw dapat mendaftarkan kapabilitas
saluran dan deskriptor CLI statis. Perlakukan evaluasi modul dalam discovery sebagai
tepercaya tetapi ringan: tidak ada klien jaringan, subproses, listener, koneksi database,
worker latar belakang, pembacaan kredensial, atau efek samping runtime langsung lainnya
di tingkat atas.

Perlakukan `"setup-runtime"` sebagai jendela tempat permukaan startup khusus setup harus
ada tanpa masuk ulang ke runtime saluran bawaan penuh. Kecocokan yang baik adalah
pendaftaran saluran, route HTTP yang aman untuk setup, metode Gateway yang aman untuk setup, dan
helper setup yang didelegasikan. Layanan latar belakang berat, registrar CLI, dan
bootstrap SDK penyedia/klien tetap berada di `"full"`.

Khusus untuk registrar CLI:

- gunakan `descriptors` ketika registrar memiliki satu atau beberapa perintah root dan Anda
  ingin OpenClaw memuat modul CLI asli secara malas pada pemanggilan pertama
- pastikan deskriptor tersebut mencakup setiap root perintah tingkat atas yang diekspos oleh
  registrar
- jaga nama perintah deskriptor hanya berisi huruf, angka, tanda hubung, dan garis bawah,
  dimulai dengan huruf atau angka; OpenClaw menolak nama deskriptor di luar
  bentuk tersebut dan menghapus urutan kontrol terminal dari deskripsi sebelum
  merender bantuan
- gunakan `commands` saja hanya untuk path kompatibilitas eager

## Bentuk Plugin

OpenClaw mengklasifikasikan Plugin yang dimuat berdasarkan perilaku pendaftarannya:

| Bentuk                | Deskripsi                                          |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Satu jenis kapabilitas (mis. hanya provider)       |
| **hybrid-capability** | Beberapa jenis kapabilitas (mis. provider + speech) |
| **hook-only**         | Hanya hook, tanpa kapabilitas                      |
| **non-capability**    | Tools/perintah/layanan tetapi tanpa kapabilitas    |

Gunakan `openclaw plugins inspect <id>` untuk melihat bentuk sebuah Plugin.

## Terkait

- [Ikhtisar SDK](/id/plugins/sdk-overview) - API pendaftaran dan referensi subpath
- [Helper Runtime](/id/plugins/sdk-runtime) - `api.runtime` dan `createPluginRuntimeStore`
- [Penyiapan dan Konfigurasi](/id/plugins/sdk-setup) - manifes, entri penyiapan, pemuatan tertunda
- [Plugin Channel](/id/plugins/sdk-channel-plugins) - membangun objek `ChannelPlugin`
- [Plugin Provider](/id/plugins/sdk-provider-plugins) - pendaftaran provider dan hook
