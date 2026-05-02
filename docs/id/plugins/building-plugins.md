---
read_when:
    - Anda ingin membuat Plugin OpenClaw baru
    - Anda memerlukan panduan mulai cepat untuk pengembangan Plugin
    - Anda sedang menambahkan saluran, penyedia, alat, atau kemampuan lain yang baru ke OpenClaw
sidebarTitle: Getting Started
summary: Buat Plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun plugin
x-i18n:
    generated_at: "2026-05-02T09:26:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf85c1c1c1f6ae6752f7fb8d842a420bffac6ebaf4d64803fb8bb8ab9f6f83c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: saluran, penyedia model,
ucapan, transkripsi realtime, suara realtime, pemahaman media, pembuatan
gambar, pembuatan video, pengambilan web, pencarian web, alat agen, atau
kombinasi apa pun.

Anda tidak perlu menambahkan Plugin Anda ke repositori OpenClaw. Publikasikan ke
[ClawHub](/id/tools/clawhub) dan pengguna memasangnya dengan
`openclaw plugins install <package-name>`. OpenClaw mencoba ClawHub terlebih dahulu dan
secara otomatis kembali ke npm untuk paket yang masih menggunakan distribusi npm.

## Prasyarat

- Node >= 22 dan pengelola paket (npm atau pnpm)
- Familiar dengan TypeScript (ESM)
- Untuk Plugin dalam repo: repositori sudah dikloning dan `pnpm install` selesai. Pengembangan Plugin
  dari checkout sumber hanya mendukung pnpm karena OpenClaw memuat Plugin bawaan
  dari paket workspace `extensions/*`.

## Jenis Plugin apa?

<CardGroup cols={3}>
  <Card title="Plugin saluran" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform perpesanan (Discord, IRC, dll.)
  </Card>
  <Card title="Plugin penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Tambahkan penyedia model (LLM, proxy, atau endpoint kustom)
  </Card>
  <Card title="Plugin alat / hook" icon="wrench" href="/id/plugins/hooks">
    Daftarkan alat agen, hook peristiwa, atau layanan — lanjutkan di bawah
  </Card>
</CardGroup>

Untuk Plugin saluran yang tidak dijamin sudah terpasang saat onboarding/setup
berjalan, gunakan `createOptionalChannelSetupSurface(...)` dari
`openclaw/plugin-sdk/channel-setup`. Ini menghasilkan pasangan adaptor setup + wizard
yang mengiklankan persyaratan pemasangan dan gagal tertutup pada penulisan konfigurasi nyata
sampai Plugin terpasang.

## Mulai cepat: Plugin alat

Panduan ini membuat Plugin minimal yang mendaftarkan alat agen. Plugin saluran
dan penyedia memiliki panduan khusus yang ditautkan di atas.

<Steps>
  <Step title="Buat paket dan manifes">
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

    Setiap Plugin membutuhkan manifes, bahkan tanpa konfigurasi. Alat yang didaftarkan saat runtime
    harus dicantumkan di `contracts.tools` agar OpenClaw dapat menemukan Plugin
    pemilik tanpa memuat setiap runtime Plugin. Plugin juga sebaiknya mendeklarasikan
    `activation.onStartup` secara sengaja. Contoh ini menetapkannya ke `true`. Lihat
    [Manifes](/id/plugins/manifest) untuk skema lengkap. Cuplikan publikasi ClawHub kanonis
    berada di `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Tulis titik masuk">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` digunakan untuk Plugin non-saluran. Untuk saluran, gunakan
    `defineChannelPluginEntry` — lihat [Plugin Saluran](/id/plugins/sdk-channel-plugins).
    Untuk opsi titik masuk lengkap, lihat [Titik Masuk](/id/plugins/sdk-entrypoints).

  </Step>

  <Step title="Uji dan publikasikan">

    **Plugin eksternal:** validasi dan publikasikan dengan ClawHub, lalu pasang:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw juga memeriksa ClawHub sebelum npm untuk spesifikasi paket polos seperti
    `@myorg/openclaw-my-plugin`; npm tetap menjadi fallback untuk paket yang
    belum bermigrasi ke ClawHub.

    **Plugin dalam repo:** tempatkan di bawah pohon workspace Plugin bawaan — ditemukan secara otomatis.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Kemampuan Plugin

Satu Plugin dapat mendaftarkan sejumlah kemampuan melalui objek `api`:

| Kemampuan              | Metode pendaftaran                               | Panduan detail                                                                 |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Inferensi teks (LLM)   | `api.registerProvider(...)`                      | [Plugin Penyedia](/id/plugins/sdk-provider-plugins)                               |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | [Backend CLI](/id/gateway/cli-backends)                                           |
| Saluran / perpesanan   | `api.registerChannel(...)`                       | [Plugin Saluran](/id/plugins/sdk-channel-plugins)                                 |
| Ucapan (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkripsi realtime   | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Suara realtime         | `api.registerRealtimeVoiceProvider(...)`         | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan musik        | `api.registerMusicGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pengambilan web        | `api.registerWebFetchProvider(...)`              | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pencarian web          | `api.registerWebSearchProvider(...)`             | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware hasil alat  | `api.registerAgentToolResultMiddleware(...)`     | [Ikhtisar SDK](/id/plugins/sdk-overview#registration-api)                         |
| Alat agen              | `api.registerTool(...)`                          | Di bawah                                                                        |
| Perintah kustom        | `api.registerCommand(...)`                       | [Titik Masuk](/id/plugins/sdk-entrypoints)                                        |
| Hook Plugin            | `api.on(...)`                                    | [Hook Plugin](/id/plugins/hooks)                                                  |
| Hook peristiwa internal | `api.registerHook(...)`                         | [Titik Masuk](/id/plugins/sdk-entrypoints)                                        |
| Rute HTTP              | `api.registerHttpRoute(...)`                     | [Internal](/id/plugins/architecture-internals#gateway-http-routes)                |
| Subperintah CLI        | `api.registerCli(...)`                           | [Titik Masuk](/id/plugins/sdk-entrypoints)                                        |

Untuk API pendaftaran lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview#registration-api).

Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)` saat mereka
memerlukan penulisan ulang hasil alat secara asinkron sebelum model melihat output. Deklarasikan
runtime yang ditargetkan di `contracts.agentToolResultMiddleware`, misalnya
`["pi", "codex"]`. Ini adalah seam Plugin bawaan tepercaya; Plugin eksternal
sebaiknya menggunakan hook Plugin OpenClaw reguler kecuali OpenClaw mengembangkan
kebijakan kepercayaan eksplisit untuk kemampuan ini.

Jika Plugin Anda mendaftarkan metode RPC Gateway kustom, pertahankan pada
prefiks khusus Plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu diresolusikan ke
`operator.admin`, bahkan jika sebuah Plugin meminta cakupan yang lebih sempit.

Semantik penjaga hook yang perlu diingat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` diperlakukan sebagai tanpa keputusan.
- `before_tool_call`: `{ requireApproval: true }` menjeda eksekusi agen dan meminta persetujuan pengguna melalui overlay persetujuan exec, tombol Telegram, interaksi Discord, atau perintah `/approve` di saluran mana pun.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` diperlakukan sebagai tanpa keputusan.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` diperlakukan sebagai tanpa keputusan.
- `message_received`: utamakan bidang bertipe `threadId` saat Anda memerlukan perutean thread/topik masuk. Pertahankan `metadata` untuk tambahan khusus saluran.
- `message_sending`: utamakan bidang perutean bertipe `replyToId` / `threadId` daripada kunci metadata khusus saluran.

Perintah `/approve` menangani persetujuan exec dan Plugin dengan fallback terbatas: ketika id persetujuan exec tidak ditemukan, OpenClaw mencoba ulang id yang sama melalui persetujuan Plugin. Penerusan persetujuan Plugin dapat dikonfigurasi secara independen melalui `approvals.plugin` dalam konfigurasi.

Jika plumbing persetujuan kustom perlu mendeteksi kasus fallback terbatas yang sama,
utamakan `isApprovalNotFoundError` dari `openclaw/plugin-sdk/error-runtime`
daripada mencocokkan string kedaluwarsa persetujuan secara manual.

Lihat [Hook Plugin](/id/plugins/hooks) untuk contoh dan referensi hook.

## Mendaftarkan alat agen

Alat adalah fungsi bertipe yang dapat dipanggil LLM. Alat dapat bersifat wajib (selalu
tersedia) atau opsional (pengguna ikut serta):

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
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
manifes Plugin:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

Pengguna mengaktifkan alat opsional dalam konfigurasi:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nama tool tidak boleh bentrok dengan tool inti (konflik dilewati)
- Tool dengan objek pendaftaran yang salah bentuk, termasuk `parameters` yang hilang, dilewati dan dilaporkan dalam diagnostik plugin alih-alih merusak proses agent
- Gunakan `optional: true` untuk tool dengan efek samping atau kebutuhan biner tambahan
- Pengguna dapat mengaktifkan semua tool dari sebuah plugin dengan menambahkan id plugin ke `tools.allow`

## Mendaftarkan perintah CLI

Plugin dapat menambahkan grup perintah root `openclaw` dengan `api.registerCli`. Sediakan
`descriptors` untuk setiap root perintah tingkat atas agar OpenClaw dapat menampilkan dan merutekan
perintah tanpa memuat setiap runtime plugin lebih awal.

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

Setelah instalasi, verifikasi pendaftaran runtime dan jalankan perintah:

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## Konvensi impor

Selalu impor dari path `openclaw/plugin-sdk/<subpath>` yang terfokus:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Untuk referensi lengkap subpath, lihat [Ikhtisar SDK](/id/plugins/sdk-overview).

Di dalam plugin Anda, gunakan file barrel lokal (`api.ts`, `runtime-api.ts`) untuk
impor internal — jangan pernah mengimpor plugin Anda sendiri melalui path SDK-nya.

Untuk plugin penyedia, simpan helper khusus penyedia di barrel package-root tersebut
kecuali seam tersebut benar-benar generik. Contoh bawaan saat ini:

- Anthropic: wrapper stream Claude dan helper `service_tier` / beta
- OpenAI: builder penyedia, helper model default, penyedia realtime
- OpenRouter: builder penyedia plus helper onboarding/konfigurasi

Jika sebuah helper hanya berguna di dalam satu paket penyedia bawaan, simpan helper itu pada
seam package-root tersebut alih-alih mempromosikannya ke `openclaw/plugin-sdk/*`.

Beberapa seam helper `openclaw/plugin-sdk/<bundled-id>` yang dihasilkan masih ada untuk
pemeliharaan plugin bawaan ketika seam tersebut memiliki penggunaan owner yang dilacak. Perlakukan seam tersebut sebagai
surface yang dicadangkan, bukan sebagai pola default untuk plugin pihak ketiga baru.

## Daftar periksa pra-pengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifest **openclaw.plugin.json** ada dan valid</Check>
<Check>Entry point menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua impor menggunakan path `plugin-sdk/<subpath>` yang terfokus</Check>
<Check>Impor internal menggunakan modul lokal, bukan impor mandiri SDK</Check>
<Check>Test lulus (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lulus (plugin dalam repo)</Check>

## Pengujian rilis beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat mengaktifkan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta segera setelah tag itu muncul. Jendela waktu sebelum stabil biasanya hanya beberapa jam.
3. Posting di thread plugin Anda di channel Discord `plugin-forum` setelah pengujian dengan `all good` atau apa yang rusak. Jika Anda belum memiliki thread, buat satu.
4. Jika ada yang rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Letakkan tautan issue di thread Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue di PR serta thread Discord Anda. Kontributor tidak dapat memberi label pada PR, jadi judul adalah sinyal sisi PR untuk maintainer dan otomasi. Blocker dengan PR akan digabungkan; blocker tanpa PR mungkin tetap dikirim. Maintainer memantau thread ini selama pengujian beta.
6. Diam berarti hijau. Jika Anda melewatkan jendela waktu, perbaikan Anda kemungkinan masuk di siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Plugin Channel" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin channel pesan
  </Card>
  <Card title="Plugin Penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Bangun plugin penyedia model
  </Card>
  <Card title="Ikhtisar SDK" icon="book-open" href="/id/plugins/sdk-overview">
    Peta impor dan referensi API pendaftaran
  </Card>
  <Card title="Helper Runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, pencarian, subagent melalui api.runtime
  </Card>
  <Card title="Pengujian" icon="test-tubes" href="/id/plugins/sdk-testing">
    Utilitas dan pola test
  </Card>
  <Card title="Manifest Plugin" icon="file-json" href="/id/plugins/manifest">
    Referensi lengkap skema manifest
  </Card>
</CardGroup>

## Terkait

- [Arsitektur Plugin](/id/plugins/architecture) — pendalaman arsitektur internal
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi Plugin SDK
- [Manifest](/id/plugins/manifest) — format manifest plugin
- [Plugin Channel](/id/plugins/sdk-channel-plugins) — membangun plugin channel
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) — membangun plugin penyedia
