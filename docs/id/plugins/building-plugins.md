---
doc-schema-version: 1
read_when:
    - Anda ingin membuat Plugin OpenClaw baru
    - Anda memerlukan panduan mulai cepat untuk pengembangan Plugin
    - Anda sedang memilih antara dokumentasi channel, provider, backend CLI, tool, atau hook
sidebarTitle: Getting Started
summary: Buat Plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun plugin
x-i18n:
    generated_at: "2026-07-04T15:36:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin memperluas OpenClaw tanpa mengubah core. Sebuah plugin dapat menambahkan
channel pesan, penyedia model, backend CLI lokal, alat agen, hook, penyedia media,
atau kapabilitas lain yang dimiliki plugin.

Anda tidak perlu menambahkan plugin eksternal ke repositori OpenClaw. Publikasikan
paket ke [ClawHub](/id/clawhub) dan pengguna memasangnya dengan:

```bash
openclaw plugins install clawhub:<package-name>
```

Spesifikasi paket polos tetap dipasang dari npm selama transisi peluncuran. Gunakan
prefiks `clawhub:` saat Anda menginginkan resolusi ClawHub.

## Persyaratan

- Gunakan Node 22.19+, Node 23.11+, atau Node 24+ dan manajer paket seperti `npm` atau `pnpm`.
- Pahami modul TypeScript ESM.
- Untuk pekerjaan plugin bawaan di dalam repo, clone repositori dan jalankan `pnpm install`.
  Pengembangan plugin dari checkout sumber hanya mendukung pnpm karena OpenClaw memuat plugin
  bawaan dari paket workspace `extensions/*`.

## Pilih bentuk plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform perpesanan.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Tambahkan penyedia model, media, pencarian, pengambilan, ucapan, atau realtime.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/id/plugins/cli-backend-plugins">
    Jalankan CLI AI lokal melalui fallback model OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/id/plugins/tool-plugins">
    Daftarkan alat agen.
  </Card>
</CardGroup>

## Mulai cepat

Bangun plugin alat minimal dengan mendaftarkan satu alat agen wajib. Ini adalah
bentuk plugin berguna yang paling singkat dan menunjukkan paket, manifest, entry point, dan
bukti lokal.

<Steps>
  <Step title="Create package metadata">
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

    Plugin eksternal yang dipublikasikan sebaiknya mengarahkan entri runtime ke file JavaScript
    hasil build. Lihat [entry point SDK](/id/plugins/sdk-entrypoints) untuk kontrak entry
    point lengkap.

    Setiap plugin membutuhkan manifest, bahkan ketika tidak memiliki config. Alat runtime
    harus muncul di `contracts.tools` agar OpenClaw dapat menemukan kepemilikan tanpa
    memuat setiap runtime plugin secara bersemangat. Atur `activation.onStartup`
    secara sengaja. Contoh ini dimulai saat startup Gateway.

    Surface plugin tepercaya host juga dibatasi manifest dan memerlukan pengaktifan
    eksplisit untuk plugin yang dipasang. Jika plugin yang dipasang mendaftarkan
    `api.registerAgentToolResultMiddleware(...)`, deklarasikan setiap target runtime di
    `contracts.agentToolResultMiddleware`. Jika mendaftarkan
    `api.registerTrustedToolPolicy(...)`, deklarasikan setiap id kebijakan di
    `contracts.trustedToolPolicies`. Deklarasi ini menjaga inspeksi saat pemasangan
    dan pendaftaran runtime tetap selaras.

    Untuk setiap field manifest, lihat [Manifest plugin](/id/plugins/manifest).

  </Step>

  <Step title="Register the tool">
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

    Gunakan `definePluginEntry` untuk plugin non-channel. Plugin channel menggunakan
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Untuk plugin yang dipasang atau plugin eksternal, inspeksi runtime yang dimuat:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Jika plugin mendaftarkan perintah CLI, jalankan juga perintah tersebut. Misalnya,
    perintah demo sebaiknya memiliki bukti eksekusi seperti
    `openclaw demo-plugin ping`.

    Untuk plugin bawaan dalam repositori ini, OpenClaw menemukan paket plugin
    checkout sumber dari workspace `extensions/*`. Jalankan pengujian tertarget
    terdekat:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    Sebelum memublikasikan plugin yang siap dipaketkan, uji bentuk pemasangan yang sama dengan
    yang akan diterima pengguna. Pertama tambahkan langkah build, arahkan entri runtime seperti
    `openclaw.extensions` ke JavaScript hasil build seperti `./dist/index.js`, dan pastikan
    `npm pack` menyertakan output `dist/` tersebut. Entri sumber TypeScript hanya
    untuk checkout sumber dan jalur pengembangan lokal.

    Lalu paketkan plugin dan pasang tarball dengan `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` menggunakan proyek npm per-plugin terkelola milik OpenClaw, sehingga menangkap
    kesalahan dependensi runtime yang dapat tersembunyi oleh pengujian checkout sumber. Ini membuktikan
    bentuk paket dan dependensi, bukan kepercayaan resmi yang tertaut katalog.
    Impor runtime harus berada di `dependencies` atau `optionalDependencies`;
    dependensi yang hanya tersisa di `devDependencies` tidak akan dipasang untuk proyek
    runtime terkelola.

    Jangan gunakan pemasangan arsip/path mentah sebagai bukti akhir untuk perilaku plugin resmi atau
    dengan hak istimewa. Sumber mentah berguna untuk debugging lokal, tetapi
    tidak membuktikan jalur dependensi yang sama seperti pemasangan npm atau ClawHub. Jika
    plugin Anda bergantung pada status plugin resmi tepercaya, tambahkan bukti kedua
    melalui pemasangan resmi berbasis katalog atau jalur paket yang dipublikasikan yang
    mencatat kepercayaan resmi. Lihat
    [Resolusi dependensi plugin](/id/plugins/dependency-resolution) untuk detail
    root pemasangan dan kepemilikan dependensi.

  </Step>

  <Step title="Publish">
    Validasi paket sebelum memublikasikan:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Cuplikan ClawHub kanonis berada di `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Install">
    Pasang paket yang dipublikasikan melalui ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Mendaftarkan alat

Alat dapat bersifat wajib atau opsional. Alat wajib selalu tersedia ketika
plugin diaktifkan. Alat opsional memerlukan opt-in pengguna.

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
manifest plugin:

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

Pengguna opt in dengan `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Alat opsional mengontrol apakah alat diekspos ke model. Gunakan
[permintaan izin plugin](/id/plugins/plugin-permission-requests) ketika alat
atau hook harus meminta persetujuan setelah model memilihnya dan sebelum
aksi berjalan.

Gunakan alat opsional untuk efek samping, binary yang tidak biasa, atau kapabilitas yang
sebaiknya tidak diekspos secara default. Nama alat tidak boleh bentrok dengan alat core;
konflik dilewati dan dilaporkan dalam diagnostik plugin. Pendaftaran yang salah bentuk,
termasuk deskriptor alat tanpa `parameters`, dilewati dan dilaporkan dengan
cara yang sama. Alat terdaftar adalah fungsi bertipe yang dapat dipanggil model
setelah pemeriksaan kebijakan dan allowlist lolos.

Factory alat menerima objek konteks yang disediakan runtime. Gunakan `ctx.activeModel`
ketika alat perlu mencatat log, menampilkan, atau beradaptasi dengan model aktif untuk
turn saat ini. Objek dapat menyertakan `provider`, `modelId`, dan `modelRef`. Perlakukan sebagai
metadata runtime informasional, bukan sebagai batas keamanan terhadap operator lokal,
kode plugin yang dipasang, atau runtime OpenClaw yang dimodifikasi. Alat lokal sensitif
tetap harus memerlukan opt-in plugin atau operator yang eksplisit dan gagal tertutup
ketika metadata model aktif hilang atau tidak sesuai.

Manifest mendeklarasikan kepemilikan dan discovery; eksekusi tetap memanggil implementasi alat
terdaftar yang aktif. Jaga `toolMetadata.<tool>.optional: true`
tetap selaras dengan `api.registerTool(..., { optional: true })` agar OpenClaw dapat menghindari
memuat runtime plugin tersebut sampai alat secara eksplisit masuk allowlist.

## Konvensi impor

Impor dari subpath SDK yang terfokus:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Jangan impor dari barrel root yang sudah deprecated:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Di dalam paket plugin Anda, gunakan file barrel lokal seperti `api.ts` dan
`runtime-api.ts` untuk impor internal. Jangan impor plugin Anda sendiri melalui
path SDK. Helper khusus penyedia sebaiknya tetap berada di paket penyedia kecuali
seam tersebut benar-benar generik.

Metode RPC Gateway kustom adalah entry point lanjutan. Pertahankan pada
prefiks khusus plugin; namespace admin core seperti `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, dan `update.*` tetap dicadangkan
dan di-resolve ke `operator.admin`. Bridge
`openclaw/plugin-sdk/gateway-method-runtime` dicadangkan untuk route HTTP plugin
yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Untuk peta impor lengkap, lihat [Gambaran umum SDK plugin](/id/plugins/sdk-overview).

## Checklist pra-pengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifest **openclaw.plugin.json** ada dan valid</Check>
<Check>Entry point menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua impor menggunakan path `plugin-sdk/<subpath>` yang terfokus</Check>
<Check>Impor internal menggunakan modul lokal, bukan self-import SDK</Check>
<Check>Pengujian lolos (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lolos (plugin dalam repo)</Check>

## Uji terhadap rilis beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat mengaktifkan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta segera setelah tag tersebut muncul. Jendela waktu sebelum stable biasanya hanya beberapa jam.
3. Posting di thread plugin Anda di kanal Discord `plugin-forum` setelah pengujian dengan `all good` atau hal yang rusak. Jika Anda belum memiliki thread, buat satu.
4. Jika ada yang rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Letakkan tautan issue di thread Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue tersebut di PR dan thread Discord Anda. Kontributor tidak dapat memberi label pada PR, jadi judul adalah sinyal sisi PR untuk maintainer dan otomasi. Blocker dengan PR akan digabungkan; blocker tanpa PR mungkin tetap dikirimkan. Maintainer memantau thread ini selama pengujian beta.
6. Diam berarti hijau. Jika Anda melewatkan jendela waktu, perbaikan Anda kemungkinan masuk pada siklus berikutnya.

## Langkah Berikutnya

<CardGroup cols={2}>
  <Card title="Plugin Kanal" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin kanal perpesanan
  </Card>
  <Card title="Plugin Penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Bangun plugin penyedia model
  </Card>
  <Card title="Plugin Backend CLI" icon="terminal" href="/id/plugins/cli-backend-plugins">
    Daftarkan backend CLI AI lokal
  </Card>
  <Card title="Ikhtisar SDK" icon="book-open" href="/id/plugins/sdk-overview">
    Referensi API import map dan pendaftaran
  </Card>
  <Card title="Pembantu Runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, pencarian, subagent melalui api.runtime
  </Card>
  <Card title="Pengujian" icon="test-tubes" href="/id/plugins/sdk-testing">
    Utilitas dan pola pengujian
  </Card>
  <Card title="Manifes Plugin" icon="file-json" href="/id/plugins/manifest">
    Referensi skema manifes lengkap
  </Card>
</CardGroup>

## Terkait

- [Hook Plugin](/id/plugins/hooks)
- [Arsitektur Plugin](/id/plugins/architecture)
