---
read_when:
    - Anda ingin membuat Plugin OpenClaw baru
    - Anda memerlukan panduan cepat untuk memulai pengembangan Plugin
    - Anda menambahkan saluran, penyedia, alat, atau kemampuan baru lainnya ke OpenClaw
sidebarTitle: Getting Started
summary: Buat Plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun Plugin
x-i18n:
    generated_at: "2026-05-06T09:21:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9718f8226a3586db06eae6715502edbd7a286f448e24cbef0a08f19a921c3a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kapabilitas baru: kanal, penyedia model,
ucapan, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar,
pembuatan video, pengambilan web, pencarian web, alat agen, atau kombinasi apa
pun.

Anda tidak perlu menambahkan Plugin Anda ke repositori OpenClaw. Publikasikan ke
[ClawHub](/id/tools/clawhub) dan pengguna memasang dengan
`openclaw plugins install clawhub:<package-name>`. Spesifikasi paket polos tetap
dipasang dari npm selama peralihan peluncuran.

## Prasyarat

- Node >= 22 dan manajer paket (npm atau pnpm)
- Familiar dengan TypeScript (ESM)
- Untuk Plugin dalam repo: repositori sudah dikloning dan `pnpm install` sudah selesai. Pengembangan Plugin checkout sumber hanya mendukung pnpm karena OpenClaw memuat Plugin bundel dari paket workspace `extensions/*`.

## Jenis Plugin apa?

<CardGroup cols={3}>
  <Card title="Plugin kanal" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform perpesanan (Discord, IRC, dll.)
  </Card>
  <Card title="Plugin penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Tambahkan penyedia model (LLM, proksi, atau endpoint kustom)
  </Card>
  <Card title="Plugin alat / kait" icon="wrench" href="/id/plugins/hooks">
    Daftarkan alat agen, kait peristiwa, atau layanan - lanjutkan di bawah
  </Card>
</CardGroup>

Untuk Plugin kanal yang tidak dijamin terpasang saat onboarding/penyiapan
berjalan, gunakan `createOptionalChannelSetupSurface(...)` dari
`openclaw/plugin-sdk/channel-setup`. Ini menghasilkan pasangan adaptor penyiapan + wizard
yang mengiklankan persyaratan pemasangan dan gagal secara tertutup pada penulisan konfigurasi nyata
hingga Plugin terpasang.

## Mulai cepat: Plugin alat

Panduan ini membuat Plugin minimal yang mendaftarkan alat agen. Plugin kanal
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
    harus dicantumkan dalam `contracts.tools` agar OpenClaw dapat menemukan
    Plugin pemilik tanpa memuat runtime setiap Plugin. Plugin juga sebaiknya mendeklarasikan
    `activation.onStartup` secara sengaja. Contoh ini menetapkannya ke `true`. Lihat
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

    `definePluginEntry` digunakan untuk Plugin non-kanal. Untuk kanal, gunakan
    `defineChannelPluginEntry` - lihat [Plugin Kanal](/id/plugins/sdk-channel-plugins).
    Untuk opsi entry point lengkap, lihat [Entry Point](/id/plugins/sdk-entrypoints).

  </Step>

  <Step title="Uji dan publikasikan">

    **Plugin eksternal:** validasi dan publikasikan dengan ClawHub, lalu pasang:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Spesifikasi paket polos seperti `@myorg/openclaw-my-plugin` dipasang dari npm selama
    peralihan peluncuran. Gunakan `clawhub:` saat Anda menginginkan resolusi ClawHub.

    **Plugin dalam repo:** letakkan di bawah pohon workspace Plugin bundel - ditemukan secara otomatis.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Kapabilitas Plugin

Satu Plugin dapat mendaftarkan sejumlah kapabilitas melalui objek `api`:

| Kapabilitas            | Metode pendaftaran                              | Panduan terperinci                                                             |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferensi teks (LLM)   | `api.registerProvider(...)`                      | [Plugin Penyedia](/id/plugins/sdk-provider-plugins)                               |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | [Backend CLI](/id/gateway/cli-backends)                                           |
| Kanal / perpesanan     | `api.registerChannel(...)`                       | [Plugin Kanal](/id/plugins/sdk-channel-plugins)                                   |
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
| Perintah kustom        | `api.registerCommand(...)`                       | [Entry Point](/id/plugins/sdk-entrypoints)                                        |
| Kait Plugin            | `api.on(...)`                                    | [Kait Plugin](/id/plugins/hooks)                                                  |
| Kait peristiwa internal | `api.registerHook(...)`                         | [Entry Point](/id/plugins/sdk-entrypoints)                                        |
| Rute HTTP              | `api.registerHttpRoute(...)`                     | [Internal](/id/plugins/architecture-internals#gateway-http-routes)                |
| Subperintah CLI        | `api.registerCli(...)`                           | [Entry Point](/id/plugins/sdk-entrypoints)                                        |

Untuk API pendaftaran lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview#registration-api).

Plugin bundel dapat menggunakan `api.registerAgentToolResultMiddleware(...)` saat mereka
membutuhkan penulisan ulang hasil alat secara async sebelum model melihat output. Deklarasikan
runtime target dalam `contracts.agentToolResultMiddleware`, misalnya
`["pi", "codex"]`. Ini adalah seam Plugin bundel tepercaya; Plugin eksternal
sebaiknya memilih kait Plugin OpenClaw biasa kecuali OpenClaw menumbuhkan
kebijakan kepercayaan eksplisit untuk kapabilitas ini.

Jika Plugin Anda mendaftarkan metode RPC gateway kustom, simpan metode tersebut pada prefiks
khusus Plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu diselesaikan ke
`operator.admin`, bahkan jika Plugin meminta cakupan yang lebih sempit.

Semantik guard kait yang perlu diingat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` diperlakukan sebagai tanpa keputusan.
- `before_tool_call`: `{ requireApproval: true }` menjeda eksekusi agen dan meminta persetujuan pengguna melalui overlay persetujuan exec, tombol Telegram, interaksi Discord, atau perintah `/approve` di kanal apa pun.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` diperlakukan sebagai tanpa keputusan.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` diperlakukan sebagai tanpa keputusan.
- `message_received`: utamakan bidang bertipe `threadId` saat Anda memerlukan perutean thread/topik masuk. Simpan `metadata` untuk tambahan khusus kanal.
- `message_sending`: utamakan bidang perutean bertipe `replyToId` / `threadId` daripada kunci metadata khusus kanal.

Perintah `/approve` menangani persetujuan exec dan Plugin dengan fallback terbatas: saat id persetujuan exec tidak ditemukan, OpenClaw mencoba ulang id yang sama melalui persetujuan Plugin. Penerusan persetujuan Plugin dapat dikonfigurasi secara independen melalui `approvals.plugin` dalam konfigurasi.

Jika plumbing persetujuan kustom perlu mendeteksi kasus fallback terbatas yang sama,
utamakan `isApprovalNotFoundError` dari `openclaw/plugin-sdk/error-runtime`
daripada mencocokkan string kedaluwarsa persetujuan secara manual.

Lihat [Kait Plugin](/id/plugins/hooks) untuk contoh dan referensi kait.

## Mendaftarkan alat agen

Alat adalah fungsi bertipe yang dapat dipanggil LLM. Alat dapat bersifat wajib (selalu
tersedia) atau opsional (pilihan pengguna):

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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

OpenClaw menangkap dan menyimpan cache descriptor tervalidasi dari tool terdaftar,
sehingga plugin tidak menduplikasi data `description` atau skema di manifest. Kontrak
manifest hanya mendeklarasikan kepemilikan dan discovery; eksekusi tetap memanggil
implementasi tool terdaftar yang live.
Tetapkan `toolMetadata.<tool>.optional: true` untuk tool yang didaftarkan dengan
`api.registerTool(..., { optional: true })` agar OpenClaw dapat menghindari pemuatan
runtime plugin tersebut sampai tool secara eksplisit dimasukkan ke allowlist.

Pengguna mengaktifkan tool opsional dalam config:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nama tool tidak boleh bentrok dengan tool core (konflik dilewati)
- Tool dengan objek pendaftaran yang tidak valid, termasuk `parameters` yang hilang, dilewati dan dilaporkan dalam diagnostik plugin alih-alih menggagalkan jalannya agent
- Gunakan `optional: true` untuk tool dengan efek samping atau persyaratan binary tambahan
- Pengguna dapat mengaktifkan semua tool dari sebuah plugin dengan menambahkan id plugin ke `tools.allow`

## Mendaftarkan perintah CLI

Plugin dapat menambahkan grup perintah root `openclaw` dengan `api.registerCli`. Sediakan
`descriptors` untuk setiap root perintah tingkat atas agar OpenClaw dapat menampilkan dan merutekan
perintah tanpa memuat setiap runtime plugin secara eager.

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

Setelah install, verifikasi pendaftaran runtime dan jalankan perintah:

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
impor internal - jangan pernah mengimpor plugin Anda sendiri melalui path SDK-nya.

Untuk provider plugin, simpan helper khusus provider dalam barrel package-root
tersebut kecuali seam benar-benar generik. Contoh bundled saat ini:

- Anthropic: wrapper stream Claude dan helper `service_tier` / beta
- OpenAI: builder provider, helper model default, provider realtime
- OpenRouter: builder provider serta helper onboarding/config

Jika sebuah helper hanya berguna di dalam satu paket provider bundled, simpan di seam
package-root tersebut alih-alih mempromosikannya ke `openclaw/plugin-sdk/*`.

Beberapa seam helper `openclaw/plugin-sdk/<bundled-id>` yang dihasilkan masih ada untuk
pemeliharaan bundled-plugin ketika memiliki penggunaan owner yang terlacak. Perlakukan itu sebagai
permukaan yang dicadangkan, bukan sebagai pola default untuk plugin pihak ketiga baru.

## Checklist prapengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifest **openclaw.plugin.json** ada dan valid</Check>
<Check>Entry point menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua impor menggunakan path `plugin-sdk/<subpath>` yang terfokus</Check>
<Check>Impor internal menggunakan modul lokal, bukan self-import SDK</Check>
<Check>Tes lulus (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lulus (plugin dalam repo)</Check>

## Pengujian rilis beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat mengaktifkan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta segera setelah muncul. Jendela sebelum stable biasanya hanya beberapa jam.
3. Posting di thread plugin Anda di kanal Discord `plugin-forum` setelah pengujian dengan `all good` atau apa yang rusak. Jika Anda belum memiliki thread, buat satu.
4. Jika ada yang rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Letakkan tautan issue di thread Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue di PR maupun thread Discord Anda. Kontributor tidak dapat memberi label PR, sehingga judul adalah sinyal sisi PR untuk maintainer dan automation. Blocker dengan PR akan digabung; blocker tanpa PR mungkin tetap dikirim. Maintainer memantau thread ini selama pengujian beta.
6. Diam berarti hijau. Jika Anda melewatkan jendela, fix Anda kemungkinan masuk pada siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Plugin Channel" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Buat plugin channel messaging
  </Card>
  <Card title="Plugin Provider" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Buat plugin provider model
  </Card>
  <Card title="Ikhtisar SDK" icon="book-open" href="/id/plugins/sdk-overview">
    Peta impor dan referensi API pendaftaran
  </Card>
  <Card title="Helper Runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, pencarian, subagent melalui api.runtime
  </Card>
  <Card title="Pengujian" icon="test-tubes" href="/id/plugins/sdk-testing">
    Utilitas dan pola pengujian
  </Card>
  <Card title="Manifest Plugin" icon="file-json" href="/id/plugins/manifest">
    Referensi skema manifest lengkap
  </Card>
</CardGroup>

## Terkait

- [Arsitektur Plugin](/id/plugins/architecture) - pendalaman arsitektur internal
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi SDK Plugin
- [Manifest](/id/plugins/manifest) - format manifest plugin
- [Plugin Channel](/id/plugins/sdk-channel-plugins) - membangun plugin channel
- [Plugin Provider](/id/plugins/sdk-provider-plugins) - membangun plugin provider
