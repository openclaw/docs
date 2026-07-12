---
doc-schema-version: 1
read_when:
    - Anda ingin membuat plugin OpenClaw baru
    - Anda memerlukan panduan memulai cepat untuk pengembangan plugin
    - Anda sedang memilih antara dokumentasi saluran, penyedia, backend CLI, alat, atau hook
sidebarTitle: Getting Started
summary: Buat plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun plugin
x-i18n:
    generated_at: "2026-07-12T14:22:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin memperluas OpenClaw tanpa mengubah inti. Plugin dapat menambahkan saluran
perpesanan, penyedia model, backend CLI lokal, alat agen, hook, penyedia media,
atau kapabilitas lain yang dimiliki plugin.

Anda tidak perlu menambahkan plugin eksternal ke repositori OpenClaw. Publikasikan
paket ke [ClawHub](/clawhub), lalu pengguna dapat memasangnya dengan:

```bash
openclaw plugins install clawhub:<package-name>
```

Spesifikasi paket tanpa awalan tetap dipasang dari npm selama transisi peluncuran. Gunakan
awalan `clawhub:` saat Anda menginginkan resolusi ClawHub.

## Persyaratan

- Node 22.19+, Node 23.11+, atau Node 24+, serta `npm` atau `pnpm`.
- Modul ESM TypeScript.
- Untuk pekerjaan plugin bawaan dalam repositori, klon repositori dan jalankan `pnpm install`.
  Pengembangan plugin dari checkout sumber hanya mendukung pnpm karena OpenClaw menemukan
  plugin bawaan dari paket ruang kerja `extensions/*`.

## Pilih bentuk plugin

<CardGroup cols={2}>
  <Card title="Plugin saluran" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform perpesanan.
  </Card>
  <Card title="Plugin penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Tambahkan penyedia model, media, pencarian, pengambilan, suara, atau waktu nyata.
  </Card>
  <Card title="Plugin backend CLI" icon="terminal" href="/id/plugins/cli-backend-plugins">
    Jalankan CLI AI lokal melalui fallback model OpenClaw.
  </Card>
  <Card title="Plugin alat" icon="wrench" href="/id/plugins/tool-plugins">
    Daftarkan alat agen.
  </Card>
</CardGroup>

## Mulai cepat

Buat plugin alat minimal dengan mendaftarkan satu alat agen wajib. Ini adalah
bentuk plugin berguna yang paling ringkas dan mencakup paket, manifes, titik masuk, serta
bukti lokal.

<Steps>
  <Step title="Buat metadata paket">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    Plugin eksternal yang dipublikasikan harus mengarahkan entri runtime ke berkas JavaScript
    hasil build. Lihat [Titik masuk SDK](/id/plugins/sdk-entrypoints) untuk kontrak titik
    masuk lengkap.

    Setiap plugin memerlukan manifes, bahkan tanpa konfigurasi. Alat runtime harus
    tercantum dalam `contracts.tools` agar OpenClaw dapat menemukan kepemilikan tanpa
    memuat setiap runtime plugin secara dini. Tetapkan `activation.onStartup`
    secara sengaja; contoh ini dimuat saat Gateway dimulai.

    Permukaan plugin yang dipercaya host juga dibatasi oleh manifes dan memerlukan
    deklarasi eksplisit untuk plugin terpasang: `api.registerAgentToolResultMiddleware(...)`
    memerlukan setiap runtime target dicantumkan dalam `contracts.agentToolResultMiddleware`,
    dan `api.registerTrustedToolPolicy(...)` memerlukan setiap ID kebijakan dalam
    `contracts.trustedToolPolicies`. Deklarasi ini menjaga pemeriksaan saat pemasangan
    tetap selaras dengan pendaftaran runtime.

    Untuk setiap bidang manifes, lihat [Manifes plugin](/id/plugins/manifest).

  </Step>

  <Step title="Daftarkan alat">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Gunakan `definePluginEntry` untuk plugin non-saluran. Sebagai gantinya, plugin saluran menggunakan
    `defineChannelPluginEntry` dari `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Uji runtime">
    Untuk plugin terpasang atau eksternal, periksa runtime yang dimuat:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Jika plugin mendaftarkan perintah CLI, jalankan juga perintah tersebut dan konfirmasikan
    keluarannya, misalnya `openclaw demo-plugin ping`.

    Untuk plugin bawaan dalam repositori ini, OpenClaw menemukan paket plugin dari
    checkout sumber melalui ruang kerja `extensions/*`. Jalankan pengujian tertarget
    yang paling relevan:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Uji pemasangan paket">
    Sebelum memublikasikan plugin yang siap dipaketkan, uji bentuk pemasangan yang sama seperti yang akan
    diperoleh pengguna. Pertama, tambahkan langkah build, arahkan entri runtime seperti
    `openclaw.extensions` ke JavaScript hasil build seperti `./dist/index.js`, dan pastikan
    `npm pack` menyertakan keluaran `dist/` tersebut. Entri sumber TypeScript hanya
    ditujukan untuk checkout sumber dan jalur pengembangan lokal.

    Kemudian kemas plugin dan pasang tarball dengan `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` menggunakan proyek npm per plugin yang dikelola OpenClaw sehingga dapat menemukan
    kesalahan dependensi runtime yang mungkin tersembunyi dalam pengujian checkout sumber. Ini membuktikan
    bentuk paket dan dependensi, bukan kepercayaan resmi yang ditautkan katalog.
    Impor runtime harus berada dalam `dependencies` atau `optionalDependencies`;
    dependensi yang hanya tersisa dalam `devDependencies` tidak akan dipasang untuk
    proyek runtime terkelola.

    Jangan gunakan pemasangan arsip/jalur mentah sebagai bukti akhir untuk perilaku plugin
    resmi atau berprivilese. Sumber mentah berguna untuk pengawakutuan lokal, tetapi
    tidak membuktikan jalur dependensi yang sama seperti pemasangan npm atau ClawHub. Jika
    plugin Anda bergantung pada status plugin resmi tepercaya, tambahkan bukti kedua
    melalui pemasangan resmi berbasis katalog atau jalur paket yang dipublikasikan yang
    mencatat kepercayaan resmi. Lihat
    [Resolusi dependensi plugin](/id/plugins/dependency-resolution) untuk
    detail akar pemasangan dan kepemilikan dependensi.

  </Step>

  <Step title="Publikasikan">
    Validasi paket sebelum memublikasikannya:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Cuplikan paket ClawHub kanonis berada dalam `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Pasang">
    Pasang paket yang telah dipublikasikan melalui ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Mendaftarkan alat

Alat dapat bersifat wajib atau opsional. Alat wajib selalu tersedia saat
plugin diaktifkan. Alat opsional memerlukan persetujuan eksplisit pengguna sebelum OpenClaw
memuat runtime plugin pemiliknya.

Factory alat menerima konteks runtime tepercaya, termasuk `deliveryContext`,
`nativeChannelId` untuk percakapan platform aktif jika tersedia, serta
`requesterSenderId`.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Setiap alat yang didaftarkan dengan `api.registerTool(...)` juga harus dideklarasikan dalam
manifes plugin:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Pengguna ikut serta dengan `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Alat opsional mengendalikan apakah suatu alat diekspos ke model. Gunakan
[permintaan izin plugin](/id/plugins/plugin-permission-requests) ketika alat
atau hook harus meminta persetujuan setelah model memilihnya dan sebelum
tindakan dijalankan.

Gunakan alat opsional untuk efek samping, biner yang tidak lazim, atau kapabilitas yang
tidak boleh diekspos secara default. Nama alat tidak boleh bertentangan dengan nama alat
inti; konflik dilewati dan dilaporkan dalam diagnostik plugin. Pendaftaran
yang cacat dilewati dan dilaporkan dengan cara yang sama: `name` tidak ada atau kosong,
`execute` bukan fungsi, atau deskriptor alat tanpa objek `parameters`.

Factory alat menerima objek konteks yang disediakan runtime. Gunakan `ctx.activeModel`
saat alat perlu mencatat, menampilkan, atau menyesuaikan diri dengan model aktif untuk giliran
saat ini; objek tersebut dapat mencakup `provider`, `modelId`, dan `modelRef`. Perlakukan
objek itu sebagai metadata runtime informasional, bukan batas keamanan terhadap operator
lokal, kode plugin terpasang, atau runtime OpenClaw yang dimodifikasi. Alat lokal
sensitif tetap harus memerlukan persetujuan eksplisit plugin atau operator dan
gagal secara tertutup ketika metadata model aktif tidak ada atau tidak sesuai.

Manifes mendeklarasikan kepemilikan dan penemuan; eksekusi tetap memanggil implementasi
alat terdaftar yang aktif. Jaga `toolMetadata.<tool>.optional: true`
tetap selaras dengan `api.registerTool(..., { optional: true })` agar OpenClaw dapat menghindari
pemuatan runtime plugin tersebut hingga alat secara eksplisit dimasukkan ke daftar izin.

## Konvensi impor

Impor dari subjalur SDK yang spesifik:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Jangan mengimpor dari barrel akar yang sudah tidak digunakan:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Di dalam paket plugin Anda, gunakan berkas barrel lokal seperti `api.ts` dan
`runtime-api.ts` untuk impor internal. Jangan mengimpor plugin Anda sendiri melalui
jalur SDK. Pembantu khusus penyedia harus tetap berada dalam paket penyedia kecuali
batas antarmukanya benar-benar generik.

Metode RPC Gateway khusus merupakan titik masuk lanjutan. Pertahankan metode tersebut pada
awalan khusus plugin; namespace admin inti seperti `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, dan `update.*` tetap dicadangkan
dan diresolusikan ke `operator.admin`. Jembatan
`openclaw/plugin-sdk/gateway-method-runtime` dicadangkan untuk rute HTTP plugin
yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Untuk peta impor lengkap, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Daftar periksa sebelum pengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifes **openclaw.plugin.json** tersedia dan valid</Check>
<Check>Titik masuk menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua impor menggunakan jalur `plugin-sdk/<subpath>` yang spesifik</Check>
<Check>Impor internal menggunakan modul lokal, bukan impor mandiri SDK</Check>
<Check>Pengujian lulus (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lulus (plugin dalam repositori)</Check>

## Uji terhadap rilis beta

1. Pantau rilis [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Tag beta tampak seperti `v2026.3.N-beta.1`. Anda juga dapat mengikuti [@openclaw](https://x.com/openclaw) di X untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta segera setelah tag tersebut muncul. Jangka waktu sebelum rilis stabil biasanya hanya beberapa jam.
3. Setelah pengujian, kirim pesan di utas plugin Anda pada kanal Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), dengan menyatakan `all good` atau menjelaskan apa yang bermasalah. Buat utas jika Anda belum memilikinya.
4. Jika terjadi masalah, buka atau perbarui isu berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Tautkan isu tersebut di utas Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan isu tersebut di PR serta utas Discord Anda. Kontributor tidak dapat memberi label pada PR, sehingga judul tersebut menjadi sinyal di sisi PR bagi pengelola dan otomatisasi. Pemblokir yang memiliki PR akan digabungkan; pemblokir tanpa PR mungkin tetap disertakan dalam rilis.
6. Tidak adanya laporan berarti semuanya berjalan baik. Melewatkan jangka waktu tersebut biasanya berarti perbaikan Anda akan dimasukkan pada siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Plugin Kanal" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Buat plugin kanal perpesanan
  </Card>
  <Card title="Plugin Penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Buat plugin penyedia model
  </Card>
  <Card title="Plugin Backend CLI" icon="terminal" href="/id/plugins/cli-backend-plugins">
    Daftarkan backend CLI AI lokal
  </Card>
  <Card title="Ikhtisar SDK" icon="book-open" href="/id/plugins/sdk-overview">
    Referensi peta impor dan API pendaftaran
  </Card>
  <Card title="Pembantu Runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, pencarian, subagen melalui api.runtime
  </Card>
  <Card title="Pengujian" icon="test-tubes" href="/id/plugins/sdk-testing">
    Utilitas dan pola pengujian
  </Card>
  <Card title="Manifes Plugin" icon="file-json" href="/id/plugins/manifest">
    Referensi lengkap skema manifes
  </Card>
</CardGroup>

## Terkait

- [Hook plugin](/id/plugins/hooks)
- [Arsitektur plugin](/id/plugins/architecture)
