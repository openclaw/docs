---
doc-schema-version: 1
read_when:
    - Anda ingin membuat plugin OpenClaw baru
    - Anda memerlukan panduan mulai cepat untuk pengembangan plugin
    - Anda sedang memilih antara dokumentasi channel, provider, backend CLI, tool, atau hook
sidebarTitle: Getting Started
summary: Buat plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun plugin
x-i18n:
    generated_at: "2026-07-19T05:00:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 673fb33c2b3f33344a8fdde15c3813b953aa32872ba7175229d35c6c353099a2
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin memperluas OpenClaw tanpa mengubah inti. Sebuah plugin dapat menambahkan saluran
perpesanan, penyedia model, backend CLI lokal, alat agen, hook, penyedia media,
atau kapabilitas lain yang dimiliki plugin.

Anda tidak perlu menambahkan plugin eksternal ke repositori OpenClaw. Publikasikan
paket ke [ClawHub](/id/clawhub), lalu pengguna menginstalnya dengan:

```bash
openclaw plugins install clawhub:<package-name>
```

Spesifikasi paket tanpa prefiks tetap diinstal dari npm selama peralihan peluncuran. Gunakan
prefiks `clawhub:` saat Anda menginginkan resolusi ClawHub.

## Persyaratan

- Node 22.22.3+, Node 24.15+, atau Node 25.9+, serta `npm` atau `pnpm`.
- Modul ESM TypeScript.
- Untuk pengerjaan plugin bawaan dalam repositori, klon repositori dan jalankan `pnpm install`.
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

Bangun plugin alat minimal dengan mendaftarkan satu alat agen wajib. Ini adalah
bentuk plugin berguna yang paling ringkas dan mencakup paket, manifes, titik masuk, serta
verifikasi lokal.

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
    deklarasi eksplisit untuk plugin yang diinstal: `api.registerAgentToolResultMiddleware(...)`
    mengharuskan setiap runtime target dicantumkan dalam `contracts.agentToolResultMiddleware`,
    dan `api.registerTrustedToolPolicy(...)` mengharuskan setiap ID kebijakan tercantum dalam
    `contracts.trustedToolPolicies`. Deklarasi ini menjaga pemeriksaan saat instalasi
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
          outputSchema: Type.Object(
            { input: Type.String() },
            { additionalProperties: false },
          ),
          async execute(_id, params) {
            const details = { input: params.input };
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
              details,
            };
          },
        });
      },
    });
    ```

    Gunakan `definePluginEntry` untuk plugin non-saluran. Plugin saluran menggunakan
    `defineChannelPluginEntry` dari `openclaw/plugin-sdk/core` sebagai gantinya.

  </Step>

  <Step title="Uji runtime">
    Untuk plugin yang diinstal atau plugin eksternal, periksa runtime yang dimuat:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Jika plugin mendaftarkan perintah CLI, jalankan juga perintah tersebut dan konfirmasikan
    keluarannya, misalnya `openclaw demo-plugin ping`.

    Untuk plugin bawaan dalam repositori ini, OpenClaw menemukan paket plugin
    checkout sumber dari ruang kerja `extensions/*`. Jalankan pengujian tertarget
    terdekat:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Uji instalasi paket">
    Sebelum memublikasikan plugin yang siap dipaketkan, uji bentuk instalasi yang sama dengan yang
    akan diterima pengguna. Pertama, tambahkan langkah build, arahkan entri runtime seperti
    `openclaw.extensions` ke JavaScript hasil build seperti `./dist/index.js`, dan pastikan
    `npm pack` menyertakan keluaran `dist/` tersebut. Entri sumber TypeScript
    hanya untuk checkout sumber dan jalur pengembangan lokal.

    Kemudian kemas plugin dan instal tarball dengan `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` menggunakan proyek npm per-plugin yang dikelola OpenClaw, sehingga dapat menemukan
    kesalahan dependensi runtime yang mungkin tersembunyi dalam pengujian checkout sumber. Ini memverifikasi
    bentuk paket dan dependensi, bukan kepercayaan resmi yang ditautkan ke katalog.
    Impor runtime harus berada dalam `dependencies` atau `optionalDependencies`;
    dependensi yang hanya tersisa dalam `devDependencies` tidak akan diinstal untuk
    proyek runtime terkelola.

    Jangan gunakan instalasi arsip/jalur mentah sebagai verifikasi akhir untuk perilaku plugin
    resmi atau dengan hak istimewa. Sumber mentah berguna untuk debugging lokal, tetapi
    tidak memverifikasi jalur dependensi yang sama seperti instalasi npm atau ClawHub. Jika
    plugin Anda mengandalkan status plugin resmi tepercaya, tambahkan verifikasi kedua
    melalui instalasi resmi berbasis katalog atau jalur paket yang dipublikasikan yang
    mencatat kepercayaan resmi. Lihat
    [Resolusi dependensi plugin](/id/plugins/dependency-resolution) untuk
    detail akar instalasi dan kepemilikan dependensi.

  </Step>

  <Step title="Publikasikan">
    Validasi paket sebelum memublikasikannya:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Cuplikan paket ClawHub kanonis berada dalam `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Instal">
    Instal paket yang dipublikasikan melalui ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Mendaftarkan alat

Alat dapat bersifat wajib atau opsional. Alat wajib selalu tersedia ketika
plugin diaktifkan. Alat opsional memerlukan persetujuan eksplisit pengguna sebelum OpenClaw
memuat runtime plugin pemiliknya.

Factory alat menerima konteks runtime tepercaya, termasuk `deliveryContext`,
`nativeChannelId` untuk percakapan platform aktif jika tersedia, dan
`requesterSenderId`.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      outputSchema: Type.Object(
        { pipeline: Type.String() },
        { additionalProperties: false },
      ),
      async execute(_id, params) {
        return {
          content: [{ type: "text", text: params.pipeline }],
          details: { pipeline: params.pipeline },
        };
      },
    },
    { optional: true },
  );
}
```

`outputSchema` bersifat opsional. Ini menjelaskan nilai `details` terstruktur yang digunakan oleh
[Mode Kode](/tools/code-mode) dan [Pencarian Alat](/id/tools/tool-search). Panggilan katalog
menolak skema yang tidak valid sebelum eksekusi dan memvalidasi nilai akhir setelah
hook alat. Hilangkan untuk alat yang tidak memiliki hasil JSON stabil. Lihat
[Plugin alat](/id/plugins/tool-plugins#output-contracts) untuk kontrak lengkap.

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

Pengguna menyetujuinya dengan `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // atau ["my-plugin"] untuk setiap alat dari satu plugin
}
```

Alat opsional mengontrol apakah suatu alat diekspos kepada model. Gunakan
[permintaan izin plugin](/id/plugins/plugin-permission-requests) ketika suatu alat
atau hook harus meminta persetujuan setelah model memilihnya dan sebelum
tindakan dijalankan.

Gunakan alat opsional untuk efek samping, biner yang tidak umum, atau kapabilitas yang
tidak boleh diekspos secara default. Nama alat tidak boleh bertentangan dengan nama alat
inti; konflik dilewati dan dilaporkan dalam diagnostik plugin. Pendaftaran yang
tidak valid dilewati dan dilaporkan dengan cara yang sama: `name` tidak kosong yang
hilang, `execute` yang bukan fungsi, atau deskriptor alat tanpa objek `parameters`.

Factory alat menerima objek konteks yang disediakan runtime. Gunakan `ctx.activeModel`
ketika alat perlu mencatat, menampilkan, atau menyesuaikan diri dengan model aktif untuk giliran
saat ini; objek tersebut dapat menyertakan `provider`, `modelId`, dan `modelRef`. Perlakukan ini sebagai
metadata runtime informasional, bukan batas keamanan terhadap operator lokal,
kode plugin yang diinstal, atau runtime OpenClaw yang dimodifikasi. Alat lokal
sensitif tetap harus memerlukan persetujuan eksplisit dari plugin atau operator dan
gagal secara tertutup ketika metadata model aktif tidak tersedia atau tidak sesuai.

Manifes mendeklarasikan kepemilikan dan penemuan; eksekusi tetap memanggil
implementasi alat terdaftar yang aktif. Jaga `toolMetadata.<tool>.optional: true`
tetap selaras dengan `api.registerTool(..., { optional: true })` agar OpenClaw dapat menghindari
pemuatan runtime plugin tersebut hingga alat secara eksplisit dimasukkan ke daftar izin.

## Konvensi impor

Impor dari subjalur SDK yang terfokus:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Jangan mengimpor dari barrel akar yang telah usang:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Di dalam paket plugin Anda, gunakan berkas barrel lokal seperti `api.ts` dan
`runtime-api.ts` untuk impor internal. Jangan mengimpor plugin Anda sendiri melalui
jalur SDK. Pembantu khusus penyedia harus tetap berada dalam paket penyedia kecuali
seam tersebut benar-benar generik.

Metode RPC Gateway khusus merupakan titik masuk tingkat lanjut. Pertahankan metode tersebut pada
prefiks khusus plugin; namespace admin inti seperti `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, dan `update.*` tetap dicadangkan
dan diresolusikan ke `operator.admin`. Bridge
`openclaw/plugin-sdk/gateway-method-runtime` dicadangkan untuk rute HTTP plugin
yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Untuk peta impor lengkap, lihat [Ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Daftar periksa sebelum pengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifes **openclaw.plugin.json** tersedia dan valid</Check>
<Check>Titik masuk menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua impor menggunakan jalur `plugin-sdk/<subpath>` yang spesifik</Check>
<Check>Impor internal menggunakan modul lokal, bukan impor mandiri SDK</Check>
<Check>Pengujian berhasil (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` berhasil (plugin dalam repositori)</Check>

## Uji terhadap rilis beta

1. Pantau rilis [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). Tag beta tampak seperti `v2026.3.N-beta.1`. Anda juga dapat mengikuti [@openclaw](https://x.com/openclaw) di X untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta segera setelah tag tersebut muncul. Jangka waktu sebelum rilis stabil biasanya hanya beberapa jam.
3. Setelah pengujian, kirim pesan di utas plugin Anda dalam channel Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), dengan mencantumkan `all good` atau hal yang mengalami kerusakan. Buat utas jika Anda belum memilikinya.
4. Jika ada yang mengalami kerusakan, buka atau perbarui isu berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Tautkan isu tersebut dalam utas Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan isu tersebut dalam PR maupun utas Discord Anda. Kontributor tidak dapat memberi label pada PR, sehingga judul menjadi sinyal di sisi PR bagi pengelola dan otomatisasi. Penghambat yang memiliki PR akan digabungkan; penghambat tanpa PR mungkin tetap disertakan dalam rilis.
6. Tidak ada kabar berarti semuanya lancar. Melewatkan jangka waktu tersebut biasanya berarti perbaikan Anda akan disertakan dalam siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Plugin Channel" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin channel perpesanan
  </Card>
  <Card title="Plugin Penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Bangun plugin penyedia model
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
    Referensi skema manifes lengkap
  </Card>
</CardGroup>

## Terkait

- [Hook plugin](/id/plugins/hooks)
- [Arsitektur plugin](/id/plugins/architecture)
