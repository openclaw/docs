---
read_when:
    - Anda ingin membuat plugin OpenClaw sederhana yang hanya menambahkan alat agen
    - Anda ingin menggunakan defineToolPlugin alih-alih menulis metadata manifes plugin secara manual
    - Anda perlu membuat kerangka, menghasilkan, memvalidasi, menguji, atau memublikasikan plugin khusus alat saja
sidebarTitle: Tool Plugins
summary: Bangun alat agen bertipe sederhana dengan defineToolPlugin dan openclaw plugins init/build/validate
title: Plugin alat
x-i18n:
    generated_at: "2026-07-19T05:32:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6363ccc810e969e1efa2aa0b4208f27244f01db196713fc2dc25cf106b86429
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` membangun plugin yang hanya menambahkan alat yang dapat dipanggil agen: tanpa
channel, penyedia model, hook, layanan, atau backend penyiapan. Ini menghasilkan
metadata manifes yang dibutuhkan OpenClaw untuk menemukan alat tanpa memuat kode
runtime plugin.

Untuk plugin penyedia, channel, hook, layanan, atau berkemampuan campuran, mulailah dengan
[Membangun plugin](/id/plugins/building-plugins), [Plugin Channel](/id/plugins/sdk-channel-plugins),
atau [Plugin Penyedia](/id/plugins/sdk-provider-plugins).

## Persyaratan

- Node 22.22.3+, Node 24.15+, atau Node 25.9+.
- Keluaran paket ESM TypeScript.
- `typebox` dalam `dependencies` (bukan hanya `devDependencies` - plugin yang dihasilkan
  mengimpornya saat runtime).
- `openclaw >=2026.5.17`, versi pertama yang mengekspor
  `openclaw/plugin-sdk/tool-plugin`.
- Root paket yang menyertakan `dist/`, `openclaw.plugin.json`, dan
  `package.json`.

## Mulai cepat

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` membuat kerangka:

| File                   | Tujuan                                                            |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | Entri `defineToolPlugin` dengan satu alat `echo`                  |
| `src/index.test.ts`    | Pengujian metadata yang memeriksa daftar alat                     |
| `tsconfig.json`        | Keluaran TypeScript NodeNext ke `dist/`                            |
| `vitest.config.ts`     | Konfigurasi Vitest untuk `src/**/*.test.ts`                       |
| `package.json`         | Skrip, dependensi runtime, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Metadata manifes yang dihasilkan untuk alat awal                  |

`npm run plugin:build` menjalankan `npm run build` (tsc), lalu
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
membangun ulang dan menjalankan `openclaw plugins validate --entry ./dist/index.js`.
Validasi yang berhasil menampilkan:

```text
Plugin stock-quotes valid.
```

Opsi `openclaw plugins init <id>`:

| Flag                 | Default            | Efek                                   |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | Direktori keluaran                     |
| `--name <name>`      | `<id>` dalam title case | Nama tampilan                          |
| `--type <type>`      | `tool`             | Jenis kerangka: `tool` atau `provider` |
| `--force`            | nonaktif           | Timpa direktori keluaran yang sudah ada |

## Menulis alat

`defineToolPlugin` menerima identitas plugin, skema konfigurasi opsional, dan
daftar alat statis. Jenis parameter dan konfigurasi diinferensikan dari
skema TypeBox.

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
      outputSchema: Type.Object(
        {
          symbol: Type.String(),
          configured: Type.Boolean(),
          baseUrl: Type.String(),
        },
        { additionalProperties: false },
      ),
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

Nama alat adalah API yang stabil. Pilih nama yang unik, menggunakan huruf kecil, dan
cukup spesifik untuk menghindari benturan dengan alat inti atau plugin lain.

## Alat opsional dan berbasis factory

Tetapkan `optional: true` saat pengguna harus secara eksplisit memasukkan alat ke daftar yang diizinkan sebelum
alat tersebut dikirim ke model. `openclaw plugins build` menulis entri manifes
`toolMetadata.<tool>.optional` yang sesuai, sehingga OpenClaw dapat mengetahui bahwa
alat tersebut opsional tanpa memuat kode runtime plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Gunakan `factory` saat alat membutuhkan konteks alat runtime sebelum dapat
dibuat—untuk tidak menyertakannya dalam proses tertentu, memeriksa status sandbox, atau mengikat
helper runtime. Metadata tetap statis meskipun alat konkretnya dibuat
saat runtime.

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

Factory tetap mendeklarasikan nama alat tetap di awal. Gunakan `definePluginEntry`
secara langsung saat plugin menghitung nama alat secara dinamis atau menggabungkan alat
dengan hook, layanan, penyedia, atau perintah.

## Nilai kembalian

`defineToolPlugin` membungkus nilai kembalian biasa ke dalam format hasil alat
OpenClaw:

- Kembalikan string saat model harus melihat teks persis tersebut.
- Kembalikan nilai yang kompatibel dengan JSON saat Anda ingin model melihat JSON terformat
  dan OpenClaw mempertahankan nilai asli dalam `details`.

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

Gunakan alat factory saat Anda membutuhkan `AgentToolResult` khusus atau ingin menggunakan kembali
implementasi `api.registerTool` yang sudah ada.

## Kontrak keluaran

Tambahkan `outputSchema` saat alat mengembalikan data stabil yang kompatibel dengan JSON. Ini menjelaskan
nilai asli yang disimpan dalam `AgentToolResult.details`, bukan teks terformat
dalam `content`:

```typescript
tool({
  name: "shipment_list",
  description: "List shipments.",
  parameters: Type.Object({
    buyer: Type.Optional(Type.String()),
  }),
  outputSchema: Type.Array(
    Type.Object(
      {
        id: Type.String(),
        buyer: Type.String(),
        paid: Type.Boolean(),
        tons: Type.Number(),
      },
      { additionalProperties: false },
    ),
  ),
  execute: ({ buyer }) => listShipments(buyer),
});
```

[Mode Kode](/tools/code-mode) dan [Pencarian Alat](/id/tools/tool-search) mengubah
skema ini menjadi petunjuk keluaran bergaya TypeScript yang terbatas. Hal ini memungkinkan model memanggil dan
mentransformasikan hasil yang diketahui dalam satu program, alih-alih menggunakan giliran model lain
untuk mengamati bentuknya.

OpenClaw mengompilasi skema sebelum menjalankan panggilan katalog, lalu memvalidasi
nilai akhir `details` setelah hook alat sebelum mengembalikannya melalui bridge.
Skema yang tidak valid tidak dapat menjalankan alat; ketidakcocokan hasil menyebabkan panggilan yang telah selesai
gagal. Sertakan setiap varian hasil yang tidak melempar error, termasuk varian error
terstruktur, atau hilangkan skema saat hasilnya tidak stabil. Jangan menaruh rahasia
atau nilai sensitif dalam deskripsi skema karena metadata keluaran tepercaya dapat
terlihat oleh model.
Gunakan `{ additionalProperties: false }` pada lapisan objek saat Anda menginginkan petunjuk keluaran ringkas
yang lengkap; skema terbuka atau terpotong tetap tersedia melalui
`tools.describe(...)`, tetapi tidak ditampilkan sebagai kontrak indeks cepat yang lengkap.

Alat factory mendeklarasikan `outputSchema` pada `AnyAgentTool` konkret yang
dikembalikannya. Deklarasi statis `tool({ factory })` tidak menerima
skema keluaran terpisah karena dapat menyimpang dari alat runtime.

## Konfigurasi

`configSchema` bersifat opsional. Hilangkan dan OpenClaw akan menerapkan skema objek kosong
yang ketat; manifes yang dihasilkan tetap menyertakan `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Dengan `configSchema`, argumen `execute` kedua diberi tipe berdasarkan skema tersebut:

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

OpenClaw membaca konfigurasi plugin dari entri plugin dalam konfigurasi Gateway. Jangan
menanamkan rahasia langsung dalam sumber atau contoh dokumentasi; gunakan konfigurasi, variabel
lingkungan, atau SecretRef sesuai model keamanan plugin.

## Metadata yang dihasilkan

OpenClaw harus membaca manifes plugin sebelum mengimpor kode runtime plugin.
`defineToolPlugin` menyediakan metadata statis untuk hal ini, dan
`openclaw plugins build` menuliskannya ke dalam paket. Jalankan ulang generator setelah
mengubah id, nama, deskripsi, skema konfigurasi, aktivasi, atau nama alat
plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Manifes yang dihasilkan untuk plugin dengan satu alat:

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

`contracts.tools` adalah kontrak penemuan yang penting: kontrak ini memberi tahu OpenClaw
plugin mana yang memiliki setiap alat tanpa memuat runtime setiap plugin yang terpasang. Manifes
yang usang berarti alat dapat hilang dari penemuan, atau error pendaftaran
dituduhkan kepada plugin yang salah.

## Metadata paket

`openclaw plugins build` juga menyelaraskan `package.json` dengan entri runtime
yang dipilih:

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

Sertakan JavaScript yang telah dibangun (`./dist/index.js`), bukan entri sumber TypeScript.
Entri sumber hanya berfungsi untuk pengembangan lokal dalam workspace.

## Memvalidasi dalam CI

`plugins build --check` gagal tanpa menulis ulang file ketika metadata yang dihasilkan
sudah usang:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` memeriksa bahwa:

- `openclaw.plugin.json` ada dan lolos pemuat manifes normal.
- Entri saat ini mengekspor metadata `defineToolPlugin`.
- Bidang manifes yang dihasilkan cocok dengan metadata entri.
- `contracts.tools` cocok dengan nama alat yang dideklarasikan.
- `package.json` mengarahkan `openclaw.extensions` ke entri runtime yang dipilih.

## Menginstal dan memeriksa secara lokal

Dari checkout OpenClaw terpisah atau CLI yang terinstal, instal jalur paket:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Untuk pengujian singkat paket, kemas terlebih dahulu dan instal tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Setelah menginstal, mulai ulang atau muat ulang Gateway dan minta agen menggunakan
alat tersebut. Jika alat tidak terlihat, periksa runtime plugin dan katalog
alat yang berlaku sebelum mengubah kode (lihat [Pemecahan masalah](#troubleshooting)).

## Publikasi

Publikasikan melalui ClawHub setelah paket siap. `clawhub package publish`
menerima sumber: folder lokal, repo GitHub (`owner/repo[@ref]`), atau
URL tarball.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Instal dengan pencari lokasi ClawHub eksplisit:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Spesifikasi paket npm tanpa awalan tetap diinstal dari npm selama transisi peluncuran, tetapi
ClawHub merupakan sarana penemuan dan distribusi yang diutamakan untuk plugin
OpenClaw. Lihat [Publikasi ClawHub](/id/clawhub/publishing) untuk cakupan pemilik dan
review rilis.

## Pemecahan masalah

### `plugin entry not found: ./dist/index.js`

File entri yang dipilih tidak ada. Jalankan `npm run build`, lalu jalankan kembali
`openclaw plugins build --entry ./dist/index.js` atau
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Entri tersebut tidak mengekspor nilai yang dibuat oleh `defineToolPlugin`. Pastikan
ekspor default modul adalah hasil `defineToolPlugin(...)`, atau teruskan
entri yang benar dengan `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Manifes tidak lagi cocok dengan metadata entri. Jalankan:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Commit perubahan pada `openclaw.plugin.json` dan `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

Metadata paket mengarah ke entri runtime yang berbeda. Jalankan
`openclaw plugins build --entry ./dist/index.js` agar generator menyelaraskan
metadata paket dengan entri yang ingin Anda rilis.

### `Cannot find package 'typebox'`

Plugin yang telah dibangun mengimpor `typebox` saat runtime. Pertahankan di `dependencies`,
instal ulang, bangun ulang, dan jalankan kembali validasi.

### Alat tidak muncul setelah instalasi

Periksa hal-hal berikut secara berurutan:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` memiliki `contracts.tools` dengan nama alat yang diharapkan.
4. `package.json` memiliki `openclaw.extensions: ["./dist/index.js"]`.
5. Gateway telah dimulai ulang atau dimuat ulang setelah menginstal plugin.

## Lihat juga

- [Membangun plugin](/id/plugins/building-plugins)
- [Titik entri plugin](/id/plugins/sdk-entrypoints)
- [Subjalur SDK Plugin](/id/plugins/sdk-subpaths)
- [Manifes plugin](/id/plugins/manifest)
- [CLI plugin](/id/cli/plugins)
- [Publikasi ClawHub](/id/clawhub/publishing)
