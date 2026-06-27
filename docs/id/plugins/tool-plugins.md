---
read_when:
    - Anda ingin membuat Plugin OpenClaw sederhana yang hanya menambahkan alat agen
    - Anda ingin menggunakan defineToolPlugin alih-alih menulis metadata manifes plugin secara manual
    - Anda perlu membuat kerangka, menghasilkan, memvalidasi, menguji, atau menerbitkan Plugin khusus alat
sidebarTitle: Tool Plugins
summary: Bangun alat agen bertipe sederhana dengan defineToolPlugin dan openclaw plugins init/build/validate
title: Plugin alat
x-i18n:
    generated_at: "2026-06-27T18:01:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

Plugin alat menambahkan alat yang dapat dipanggil agen ke OpenClaw tanpa menambahkan channel,
penyedia model, hook, layanan, atau backend penyiapan. Gunakan `defineToolPlugin` saat
Plugin memiliki daftar alat tetap dan Anda ingin OpenClaw menghasilkan metadata manifest
yang membuat alat tersebut tetap dapat ditemukan tanpa memuat kode runtime.

Alur yang direkomendasikan adalah:

1. Scaffold paket dengan `openclaw plugins init`.
2. Tulis alat dengan `defineToolPlugin`.
3. Build JavaScript.
4. Hasilkan metadata `openclaw.plugin.json` dan `package.json` dengan
   `openclaw plugins build`.
5. Validasi metadata yang dihasilkan sebelum menerbitkan atau menginstal.

Untuk Plugin penyedia, channel, hook, layanan, atau kapabilitas campuran, mulai dengan
[Membangun Plugin](/id/plugins/building-plugins), [Plugin Channel](/id/plugins/sdk-channel-plugins),
atau [Plugin Penyedia](/id/plugins/sdk-provider-plugins) sebagai gantinya.

## Persyaratan

- Node >= 22.
- Output paket TypeScript ESM.
- `typebox` untuk skema konfigurasi dan parameter alat.
- `openclaw >=2026.5.17`, versi OpenClaw pertama yang mengekspor
  `openclaw/plugin-sdk/tool-plugin`.
- Root paket yang dapat mengirimkan `dist/`, `openclaw.plugin.json`, dan
  `package.json`.

Plugin yang dihasilkan mengimpor `typebox` saat runtime, jadi pertahankan `typebox` di
`dependencies`, bukan hanya `devDependencies`.

## Mulai cepat

Buat paket Plugin baru:

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

Scaffold membuat:

- `src/index.ts`: entri `defineToolPlugin` dengan alat `echo`.
- `src/index.test.ts`: pengujian metadata kecil.
- `tsconfig.json`: output TypeScript NodeNext ke `dist/`.
- `package.json`: skrip, dependensi runtime, dan
  `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: metadata manifest yang dihasilkan untuk alat awal.

Output validasi yang diharapkan:

```text
Plugin stock-quotes is valid.
```

## Tulis alat

`defineToolPlugin` menerima identitas Plugin, skema konfigurasi opsional, dan
daftar alat statis. Jenis parameter dan konfigurasi disimpulkan dari skema
TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

Nama alat adalah API stabil. Pilih nama yang unik, huruf kecil, dan
cukup spesifik untuk menghindari tabrakan dengan alat inti atau Plugin lain.

## Alat opsional dan factory

Tetapkan `optional: true` saat pengguna harus secara eksplisit mengizinkan alat
sebelum dikirim ke model:

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` menulis entri manifest `toolMetadata.<tool>.optional`
yang sesuai, sehingga OpenClaw dapat menemukan alat tanpa memuat kode runtime
Plugin.

Gunakan `factory` saat alat memerlukan konteks alat runtime sebelum dapat
dibuat. Factory menjaga metadata tetap statis sambil memungkinkan alat memilih
tidak aktif untuk run tertentu, memeriksa status sandbox, atau mengikat helper runtime.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

Factory tetap ditujukan untuk nama alat tetap. Gunakan `definePluginEntry` secara langsung saat
Plugin menghitung nama alat secara dinamis atau menggabungkan alat dengan hook,
layanan, penyedia, perintah, atau permukaan runtime lainnya.

## Nilai kembalian

`defineToolPlugin` membungkus nilai kembalian biasa ke dalam format hasil alat
OpenClaw:

- Kembalikan string saat model harus melihat teks persis tersebut.
- Kembalikan nilai yang kompatibel dengan JSON saat Anda ingin model melihat JSON terformat
  dan OpenClaw menyimpan nilai asli di `details`.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Gunakan alat factory saat Anda perlu mengembalikan `AgentToolResult` khusus atau menggunakan kembali
implementasi `api.registerTool` yang sudah ada. Gunakan `definePluginEntry` sebagai ganti
`defineToolPlugin` saat Anda memerlukan alat yang sepenuhnya dinamis atau kapabilitas
Plugin campuran.

## Konfigurasi

`configSchema` bersifat opsional. Jika Anda menghilangkannya, OpenClaw menggunakan skema objek kosong
yang ketat dan manifest yang dihasilkan tetap menyertakan `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Saat Anda menyertakan `configSchema`, argumen `execute` kedua diketik dari
skema:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw membaca konfigurasi Plugin dari entri Plugin dalam konfigurasi Gateway. Jangan
melakukan hard-code secret di sumber atau dalam contoh dokumentasi. Gunakan konfigurasi, variabel
lingkungan, atau SecretRefs sesuai dengan model keamanan Plugin.

## Metadata yang dihasilkan

OpenClaw menemukan Plugin terinstal dari metadata dingin. OpenClaw harus dapat membaca
manifest Plugin sebelum mengimpor kode runtime Plugin. Karena itu, `defineToolPlugin`
mengekspos metadata statis, dan `openclaw plugins build` menulis metadata tersebut
ke dalam paket.

Jalankan generator setelah mengubah id, nama, deskripsi, skema konfigurasi,
aktivasi, atau nama alat Plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Untuk Plugin satu alat, manifest yang dihasilkan terlihat seperti ini:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` adalah kontrak penemuan yang penting. Ini memberi tahu OpenClaw Plugin mana
yang memiliki setiap alat tanpa memuat setiap runtime Plugin terinstal. Jika
manifest sudah usang, alat mungkin hilang dari penemuan atau Plugin yang salah
mungkin disalahkan atas kesalahan pendaftaran.

## Metadata paket

Untuk alur kerja Plugin alat sederhana, `openclaw plugins build` menyelaraskan
`package.json` dengan entri runtime tunggal yang dipilih:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Gunakan JavaScript yang sudah di-build seperti `./dist/index.js` untuk paket terinstal. Entri sumber
berguna dalam pengembangan workspace, tetapi paket yang diterbitkan tidak boleh
bergantung pada pemuatan runtime TypeScript.

## Validasi di CI

Gunakan `plugins build --check` untuk menggagalkan CI saat metadata yang dihasilkan sudah usang tanpa
menulis ulang file:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` memeriksa bahwa:

- `openclaw.plugin.json` ada dan lolos loader manifest normal.
- Entri saat ini mengekspor metadata `defineToolPlugin`.
- Bidang manifest yang dihasilkan cocok dengan metadata entri.
- `contracts.tools` cocok dengan nama alat yang dideklarasikan.
- `package.json` mengarahkan `openclaw.extensions` ke entri runtime yang dipilih.

## Instal dan periksa secara lokal

Dari checkout OpenClaw terpisah atau CLI terinstal, instal path paket:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Untuk smoke paket, pack terlebih dahulu dan instal tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Setelah instalasi, mulai atau mulai ulang Gateway dan minta agen menggunakan
alat. Jika Anda men-debug visibilitas alat, periksa runtime Plugin dan
katalog alat efektif sebelum mengubah kode.

## Terbitkan

Terbitkan melalui ClawHub saat paket siap:

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

Instal dengan locator ClawHub eksplisit:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Spesifikasi paket npm polos tetap didukung selama cutover peluncuran, tetapi ClawHub
adalah permukaan penemuan dan distribusi yang disukai untuk Plugin OpenClaw.

## Pemecahan masalah

### `plugin entry not found: ./dist/index.js`

File entri yang dipilih tidak ada. Jalankan `npm run build`, lalu jalankan ulang
`openclaw plugins build --entry ./dist/index.js` atau
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Entri tidak mengekspor nilai yang dibuat oleh `defineToolPlugin`. Periksa bahwa
ekspor default modul adalah hasil `defineToolPlugin(...)`, atau teruskan
entri yang benar dengan `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Manifest tidak lagi cocok dengan metadata entri. Jalankan:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Commit perubahan `openclaw.plugin.json` dan `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Metadata paket mengarah ke entri runtime yang berbeda. Jalankan
`openclaw plugins build --entry ./dist/index.js` agar generator menyelaraskan
metadata paket dengan entri yang ingin Anda kirimkan.

### `Cannot find package 'typebox'`

Plugin yang di-build mengimpor `typebox` saat runtime. Pertahankan `typebox` di
`dependencies`, instal ulang dependensi paket, build ulang, dan jalankan ulang validasi.

### Alat tidak muncul setelah instalasi

Periksa ini secara berurutan:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` memiliki `contracts.tools` dengan nama alat yang diharapkan.
4. `package.json` memiliki `openclaw.extensions: ["./dist/index.js"]`.
5. Gateway telah dimulai ulang atau dimuat ulang setelah menginstal Plugin.

## Lihat juga

- [Membangun Plugin](/id/plugins/building-plugins)
- [Titik masuk Plugin](/id/plugins/sdk-entrypoints)
- [Subpath SDK Plugin](/id/plugins/sdk-subpaths)
- [Manifest Plugin](/id/plugins/manifest)
- [CLI Plugin](/id/cli/plugins)
- [Penerbitan ClawHub](/id/clawhub/publishing)
