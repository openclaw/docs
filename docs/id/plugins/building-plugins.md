---
read_when:
    - Anda ingin membuat Plugin OpenClaw baru
    - Anda memerlukan panduan mulai cepat untuk pengembangan Plugin
    - Anda menambahkan saluran, penyedia, alat, atau kemampuan baru lainnya ke OpenClaw
sidebarTitle: Getting Started
summary: Buat plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun Plugin
x-i18n:
    generated_at: "2026-05-04T07:06:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kapabilitas baru: channel, penyedia model,
ucapan, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar,
pembuatan video, web fetch, web search, alat agen, atau kombinasi apa pun.

Anda tidak perlu menambahkan Plugin Anda ke repositori OpenClaw. Publikasikan ke
[ClawHub](/id/tools/clawhub) dan pengguna menginstalnya dengan
`openclaw plugins install clawhub:<package-name>`. Spesifikasi paket bare tetap
diinstal dari npm selama launch cutover.

## Prasyarat

- Node >= 22 dan package manager (npm atau pnpm)
- Familiar dengan TypeScript (ESM)
- Untuk Plugin dalam repo: repositori sudah di-clone dan `pnpm install` selesai. Pengembangan Plugin
  source checkout hanya menggunakan pnpm karena OpenClaw memuat Plugin bawaan
  dari paket workspace `extensions/*`.

## Jenis Plugin apa?

<CardGroup cols={3}>
  <Card title="Plugin channel" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform pesan (Discord, IRC, dll.)
  </Card>
  <Card title="Plugin penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Tambahkan penyedia model (LLM, proxy, atau endpoint kustom)
  </Card>
  <Card title="Plugin alat / hook" icon="wrench" href="/id/plugins/hooks">
    Daftarkan alat agen, hook peristiwa, atau layanan — lanjutkan di bawah
  </Card>
</CardGroup>

Untuk Plugin channel yang tidak dijamin terinstal saat onboarding/setup
berjalan, gunakan `createOptionalChannelSetupSurface(...)` dari
`openclaw/plugin-sdk/channel-setup`. Ini menghasilkan pasangan adaptor setup + wizard
yang mengiklankan persyaratan instalasi dan gagal tertutup pada penulisan konfigurasi nyata
hingga Plugin terinstal.

## Mulai cepat: Plugin alat

Panduan ini membuat Plugin minimal yang mendaftarkan alat agen. Plugin channel
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

    Setiap Plugin memerlukan manifes, bahkan tanpa konfigurasi. Alat yang didaftarkan runtime
    harus tercantum di `contracts.tools` agar OpenClaw dapat menemukan
    Plugin pemiliknya tanpa memuat setiap runtime Plugin. Plugin juga sebaiknya mendeklarasikan
    `activation.onStartup` secara sengaja. Contoh ini mengaturnya ke `true`. Lihat
    [Manifes](/id/plugins/manifest) untuk skema lengkap. Cuplikan publikasi ClawHub kanonis
    berada di `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Tulis entry point">

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

    `definePluginEntry` ditujukan untuk Plugin non-channel. Untuk channel, gunakan
    `defineChannelPluginEntry` — lihat [Plugin Channel](/id/plugins/sdk-channel-plugins).
    Untuk opsi entry point lengkap, lihat [Entry Point](/id/plugins/sdk-entrypoints).

  </Step>

  <Step title="Uji dan publikasikan">

    **Plugin eksternal:** validasi dan publikasikan dengan ClawHub, lalu instal:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Spesifikasi paket bare seperti `@myorg/openclaw-my-plugin` diinstal dari npm selama
    launch cutover. Gunakan `clawhub:` saat Anda menginginkan resolusi ClawHub.

    **Plugin dalam repo:** tempatkan di bawah pohon workspace Plugin bawaan — ditemukan secara otomatis.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Kapabilitas Plugin

Satu Plugin dapat mendaftarkan sejumlah kapabilitas melalui objek `api`:

| Kapabilitas            | Metode pendaftaran                               | Panduan terperinci                                                            |
| ---------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Inferensi teks (LLM)   | `api.registerProvider(...)`                      | [Plugin Penyedia](/id/plugins/sdk-provider-plugins)                              |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | [Backend CLI](/id/gateway/cli-backends)                                          |
| Channel / pesan        | `api.registerChannel(...)`                       | [Plugin Channel](/id/plugins/sdk-channel-plugins)                                |
| Ucapan (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkripsi realtime   | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Suara realtime         | `api.registerRealtimeVoiceProvider(...)`         | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan musik        | `api.registerMusicGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware hasil alat  | `api.registerAgentToolResultMiddleware(...)`     | [Ringkasan SDK](/id/plugins/sdk-overview#registration-api)                       |
| Alat agen              | `api.registerTool(...)`                          | Di bawah                                                                      |
| Perintah kustom        | `api.registerCommand(...)`                       | [Entry Point](/id/plugins/sdk-entrypoints)                                       |
| Hook Plugin            | `api.on(...)`                                    | [Hook Plugin](/id/plugins/hooks)                                                 |
| Hook peristiwa internal | `api.registerHook(...)`                         | [Entry Point](/id/plugins/sdk-entrypoints)                                       |
| Rute HTTP              | `api.registerHttpRoute(...)`                     | [Internal](/id/plugins/architecture-internals#gateway-http-routes)               |
| Subperintah CLI        | `api.registerCli(...)`                           | [Entry Point](/id/plugins/sdk-entrypoints)                                       |

Untuk API pendaftaran lengkap, lihat [Ringkasan SDK](/id/plugins/sdk-overview#registration-api).

Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)` ketika
perlu penulisan ulang hasil alat secara async sebelum model melihat output. Deklarasikan
runtime yang ditargetkan di `contracts.agentToolResultMiddleware`, misalnya
`["pi", "codex"]`. Ini adalah seam Plugin bawaan tepercaya; Plugin eksternal
sebaiknya memilih hook Plugin OpenClaw biasa kecuali OpenClaw menambahkan
kebijakan kepercayaan eksplisit untuk kapabilitas ini.

Jika Plugin Anda mendaftarkan metode RPC Gateway kustom, pertahankan pada
prefiks khusus Plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu resolve ke
`operator.admin`, bahkan jika Plugin meminta cakupan yang lebih sempit.

Semantik penjaga hook yang perlu diingat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `before_tool_call`: `{ requireApproval: true }` menjeda eksekusi agen dan meminta persetujuan pengguna melalui overlay persetujuan exec, tombol Telegram, interaksi Discord, atau perintah `/approve` di channel mana pun.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` diperlakukan sebagai tidak ada keputusan.
- `message_received`: pilih field bertipe `threadId` saat Anda memerlukan routing thread/topik masuk. Pertahankan `metadata` untuk tambahan khusus channel.
- `message_sending`: pilih field routing bertipe `replyToId` / `threadId` daripada kunci metadata khusus channel.

Perintah `/approve` menangani persetujuan exec dan Plugin dengan fallback berbatas: saat id persetujuan exec tidak ditemukan, OpenClaw mencoba ulang id yang sama melalui persetujuan Plugin. Penerusan persetujuan Plugin dapat dikonfigurasi secara independen melalui `approvals.plugin` dalam konfigurasi.

Jika plumbing persetujuan kustom perlu mendeteksi kasus fallback berbatas yang sama,
pilih `isApprovalNotFoundError` dari `openclaw/plugin-sdk/error-runtime`
daripada mencocokkan string kedaluwarsa persetujuan secara manual.

Lihat [Hook Plugin](/id/plugins/hooks) untuk contoh dan referensi hook.

## Mendaftarkan alat agen

Alat adalah fungsi bertipe yang dapat dipanggil LLM. Alat dapat bersifat wajib (selalu
tersedia) atau opsional (opt-in pengguna):

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
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw menangkap dan menyimpan dalam cache descriptor tervalidasi dari alat yang terdaftar,
sehingga plugin tidak menduplikasi data `description` atau skema dalam manifes. Kontrak
manifes hanya mendeklarasikan kepemilikan dan penemuan; eksekusi tetap memanggil
implementasi alat terdaftar yang aktif.
Tetapkan `toolMetadata.<tool>.optional: true` untuk alat yang didaftarkan dengan
`api.registerTool(..., { optional: true })` agar OpenClaw dapat menghindari pemuatan
runtime plugin tersebut sampai alat secara eksplisit dimasukkan ke allowlist.

Pengguna mengaktifkan alat opsional dalam config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nama alat tidak boleh bentrok dengan alat inti (konflik akan dilewati)
- Alat dengan objek pendaftaran yang tidak valid, termasuk `parameters` yang hilang, akan dilewati dan dilaporkan dalam diagnostik plugin alih-alih merusak eksekusi agen
- Gunakan `optional: true` untuk alat dengan efek samping atau persyaratan biner tambahan
- Pengguna dapat mengaktifkan semua alat dari sebuah plugin dengan menambahkan id plugin ke `tools.allow`

## Mendaftarkan perintah CLI

Plugin dapat menambahkan grup perintah root `openclaw` dengan `api.registerCli`. Sediakan
`descriptors` untuk setiap root perintah tingkat atas agar OpenClaw dapat menampilkan dan merutekan
perintah tanpa memuat runtime setiap plugin secara dini.

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

Untuk referensi subpath lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview).

Di dalam plugin Anda, gunakan file barrel lokal (`api.ts`, `runtime-api.ts`) untuk
impor internal — jangan pernah mengimpor plugin Anda sendiri melalui path SDK-nya.

Untuk plugin penyedia, pertahankan helper khusus penyedia di barrel root paket
tersebut kecuali seam benar-benar generik. Contoh bawaan saat ini:

- Anthropic: wrapper stream Claude dan helper `service_tier` / beta
- OpenAI: builder penyedia, helper model default, penyedia realtime
- OpenRouter: builder penyedia plus helper onboarding/config

Jika sebuah helper hanya berguna di dalam satu paket penyedia bawaan, pertahankan di seam
root paket tersebut alih-alih mempromosikannya ke `openclaw/plugin-sdk/*`.

Beberapa seam helper `openclaw/plugin-sdk/<bundled-id>` yang dihasilkan masih ada untuk
pemeliharaan plugin bawaan ketika memiliki penggunaan pemilik yang terlacak. Perlakukan itu sebagai
surface yang dicadangkan, bukan sebagai pola default untuk plugin pihak ketiga baru.

## Daftar periksa pra-pengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifes **openclaw.plugin.json** ada dan valid</Check>
<Check>Titik masuk menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua impor menggunakan path `plugin-sdk/<subpath>` yang terfokus</Check>
<Check>Impor internal menggunakan modul lokal, bukan impor mandiri SDK</Check>
<Check>Pengujian lulus (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lulus (plugin dalam repo)</Check>

## Pengujian rilis beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat mengaktifkan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta segera setelah tag tersebut muncul. Jendela sebelum stabil biasanya hanya beberapa jam.
3. Posting di thread plugin Anda di channel Discord `plugin-forum` setelah pengujian dengan `all good` atau apa yang rusak. Jika Anda belum memiliki thread, buat satu.
4. Jika sesuatu rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Taruh tautan issue di thread Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue di PR maupun thread Discord Anda. Kontributor tidak dapat memberi label pada PR, jadi judul adalah sinyal sisi PR untuk maintainer dan otomatisasi. Blocker dengan PR akan digabungkan; blocker tanpa PR mungkin tetap dikirim. Maintainer memantau thread ini selama pengujian beta.
6. Diam berarti hijau. Jika Anda melewatkan jendela, perbaikan Anda kemungkinan masuk pada siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin channel pesan
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Bangun plugin penyedia model
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

- [Arsitektur Plugin](/id/plugins/architecture) — pembahasan mendalam arsitektur internal
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi SDK Plugin
- [Manifes](/id/plugins/manifest) — format manifes plugin
- [Plugin Channel](/id/plugins/sdk-channel-plugins) — membangun plugin channel
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) — membangun plugin penyedia
