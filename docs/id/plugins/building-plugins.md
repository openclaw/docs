---
doc-schema-version: 1
read_when:
    - Anda ingin membuat Plugin OpenClaw baru
    - Anda memerlukan panduan mulai cepat untuk pengembangan plugin
    - Anda sedang memilih antara dokumentasi saluran, penyedia, backend CLI, alat, atau hook
sidebarTitle: Getting Started
summary: Buat plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun Plugin
x-i18n:
    generated_at: "2026-06-27T17:44:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins memperluas OpenClaw tanpa mengubah inti. Sebuah plugin dapat menambahkan
channel pesan, penyedia model, backend CLI lokal, alat agen, hook, penyedia media,
atau kapabilitas lain yang dimiliki plugin.

Anda tidak perlu menambahkan plugin eksternal ke repositori OpenClaw. Publikasikan
paket ke [ClawHub](/id/clawhub) dan pengguna memasangnya dengan:

```bash
openclaw plugins install clawhub:<package-name>
```

Spesifikasi paket polos masih dipasang dari npm selama peralihan peluncuran. Gunakan
prefiks `clawhub:` saat Anda menginginkan resolusi ClawHub.

## Persyaratan

- Gunakan Node 22.19 atau yang lebih baru dan package manager seperti `npm` atau `pnpm`.
- Pahami modul TypeScript ESM.
- Untuk pekerjaan plugin bawaan dalam repo, clone repositori dan jalankan `pnpm install`.
  Pengembangan plugin dari source-checkout hanya menggunakan pnpm karena OpenClaw memuat plugin
  bawaan dari paket workspace `extensions/*`.

## Pilih bentuk plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform pesan.
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
bentuk plugin berguna yang paling singkat dan menunjukkan paket, manifes, titik masuk, dan
bukti lokal.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
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
    hasil build. Lihat [titik masuk SDK](/id/plugins/sdk-entrypoints) untuk kontrak lengkap
    titik masuk.

    Setiap plugin memerlukan manifes, bahkan saat tidak memiliki konfigurasi. Alat runtime
    harus muncul di `contracts.tools` agar OpenClaw dapat menemukan kepemilikan tanpa
    memuat setiap runtime plugin secara eager. Tetapkan `activation.onStartup`
    secara sengaja. Contoh ini dimulai saat startup Gateway.

    Permukaan plugin yang dipercaya host juga dibatasi manifes dan memerlukan pengaktifan
    eksplisit untuk plugin yang dipasang. Jika plugin yang dipasang mendaftarkan
    `api.registerAgentToolResultMiddleware(...)`, deklarasikan setiap runtime target di
    `contracts.agentToolResultMiddleware`. Jika mendaftarkan
    `api.registerTrustedToolPolicy(...)`, deklarasikan setiap id kebijakan di
    `contracts.trustedToolPolicies`. Deklarasi ini menjaga inspeksi waktu pemasangan
    dan pendaftaran runtime tetap selaras.

    Untuk setiap field manifes, lihat [Manifes Plugin](/id/plugins/manifest).

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
    Untuk plugin yang dipasang atau eksternal, inspeksi runtime yang dimuat:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Jika plugin mendaftarkan perintah CLI, jalankan juga perintah tersebut. Misalnya,
    perintah demo sebaiknya memiliki bukti eksekusi seperti
    `openclaw demo-plugin ping`.

    Untuk plugin bawaan dalam repositori ini, OpenClaw menemukan paket plugin
    source-checkout dari workspace `extensions/*`. Jalankan pengujian tertarget
    terdekat:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

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

Alat dapat bersifat wajib atau opsional. Alat wajib selalu tersedia saat
plugin diaktifkan. Alat opsional memerlukan persetujuan pengguna.

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
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Alat opsional mengontrol apakah alat diekspos ke model. Gunakan
[permintaan izin plugin](/id/plugins/plugin-permission-requests) saat alat
atau hook harus meminta persetujuan setelah model memilihnya dan sebelum
aksi berjalan.

Gunakan alat opsional untuk efek samping, binary yang tidak biasa, atau kapabilitas yang
sebaiknya tidak diekspos secara default. Nama alat tidak boleh bentrok dengan alat inti;
bentrok akan dilewati dan dilaporkan dalam diagnostik plugin. Pendaftaran yang salah bentuk,
termasuk deskriptor alat tanpa `parameters`, dilewati dan
dilaporkan dengan cara yang sama. Alat terdaftar adalah fungsi bertipe yang dapat dipanggil
model setelah pemeriksaan kebijakan dan allowlist lolos.

Factory alat menerima objek konteks yang disediakan runtime. Gunakan `ctx.activeModel`
saat alat perlu mencatat, menampilkan, atau beradaptasi dengan model aktif untuk turn
saat ini. Objek dapat mencakup `provider`, `modelId`, dan `modelRef`. Perlakukan sebagai
metadata runtime informasional, bukan sebagai batas keamanan terhadap operator lokal,
kode plugin yang dipasang, atau runtime OpenClaw yang dimodifikasi. Alat lokal sensitif
tetap harus memerlukan opt-in plugin atau operator yang eksplisit dan gagal tertutup
saat metadata model aktif hilang atau tidak sesuai.

Manifes mendeklarasikan kepemilikan dan penemuan; eksekusi tetap memanggil implementasi
alat terdaftar yang live. Jaga `toolMetadata.<tool>.optional: true`
selaras dengan `api.registerTool(..., { optional: true })` agar OpenClaw dapat menghindari
pemuatan runtime plugin tersebut hingga alat di-allowlist secara eksplisit.

## Konvensi impor

Impor dari subpath SDK yang terfokus:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Jangan impor dari root barrel yang deprecated:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Di dalam paket plugin Anda, gunakan file barrel lokal seperti `api.ts` dan
`runtime-api.ts` untuk impor internal. Jangan impor plugin Anda sendiri melalui
path SDK. Helper khusus penyedia sebaiknya tetap berada di paket penyedia kecuali
batasnya benar-benar generik.

Metode RPC Gateway kustom adalah titik masuk lanjutan. Pertahankan pada
prefiks khusus plugin; namespace admin inti seperti `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*`, dan `update.*` tetap dicadangkan
dan diselesaikan ke `operator.admin`. Bridge
`openclaw/plugin-sdk/gateway-method-runtime` dicadangkan untuk rute HTTP plugin
yang mendeklarasikan `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Untuk peta impor lengkap, lihat [ikhtisar SDK Plugin](/id/plugins/sdk-overview).

## Checklist pra-pengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifes **openclaw.plugin.json** ada dan valid</Check>
<Check>Titik masuk menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua impor menggunakan path `plugin-sdk/<subpath>` yang terfokus</Check>
<Check>Impor internal menggunakan modul lokal, bukan self-import SDK</Check>
<Check>Pengujian lolos (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lolos (plugin dalam repo)</Check>

## Uji terhadap rilis beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat mengaktifkan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta segera setelah muncul. Jendela sebelum stabil biasanya hanya beberapa jam.
3. Posting di thread plugin Anda di channel Discord `plugin-forum` setelah pengujian dengan `all good` atau hal yang rusak. Jika belum memiliki thread, buat satu.
4. Jika ada yang rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Letakkan tautan issue di thread Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue di PR dan thread Discord Anda. Kontributor tidak dapat memberi label pada PR, jadi judul adalah sinyal sisi PR untuk maintainer dan otomatisasi. Blocker dengan PR akan digabungkan; blocker tanpa PR mungkin tetap dikirim. Maintainer memantau thread ini selama pengujian beta.
6. Diam berarti hijau. Jika Anda melewatkan jendela, perbaikan Anda kemungkinan masuk pada siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin channel pesan
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Bangun plugin penyedia model
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/id/plugins/cli-backend-plugins">
    Daftarkan backend CLI AI lokal
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/id/plugins/sdk-overview">
    Peta impor dan referensi API pendaftaran
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, pencarian, subagen melalui api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/id/plugins/sdk-testing">
    Utilitas dan pola pengujian
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/id/plugins/manifest">
    Referensi skema manifes lengkap
  </Card>
</CardGroup>

## Terkait

- [Hook plugin](/id/plugins/hooks)
- [Arsitektur plugin](/id/plugins/architecture)
