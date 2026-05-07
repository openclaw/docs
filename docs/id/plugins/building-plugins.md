---
read_when:
    - Anda ingin membuat Plugin OpenClaw baru
    - Anda memerlukan panduan mulai cepat untuk pengembangan Plugin
    - Anda sedang menambahkan saluran, penyedia, alat, atau kemampuan lainnya yang baru ke OpenClaw
sidebarTitle: Getting Started
summary: Buat Plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun Plugin
x-i18n:
    generated_at: "2026-05-07T13:22:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: saluran, penyedia model,
ucapan, transkripsi realtime, suara realtime, pemahaman media, pembuatan
gambar, pembuatan video, pengambilan web, pencarian web, alat agen, atau
kombinasi apa pun.

Anda tidak perlu menambahkan plugin Anda ke repositori OpenClaw. Publikasikan ke
[ClawHub](/id/tools/clawhub) dan pengguna memasangnya dengan
`openclaw plugins install clawhub:<package-name>`. Spesifikasi paket polos tetap
dipasang dari npm selama peralihan peluncuran.

## Prasyarat

- Node >= 22 dan manajer paket (npm atau pnpm)
- Familiaritas dengan TypeScript (ESM)
- Untuk plugin dalam repo: repositori sudah dikloning dan `pnpm install` sudah dijalankan. Pengembangan plugin dari checkout sumber hanya mendukung pnpm karena OpenClaw memuat plugin bawaan dari paket workspace `extensions/*`.

## Jenis plugin apa?

<CardGroup cols={3}>
  <Card title="Plugin saluran" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform perpesanan (Discord, IRC, dll.)
  </Card>
  <Card title="Plugin penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Tambahkan penyedia model (LLM, proxy, atau endpoint khusus)
  </Card>
  <Card title="Plugin backend CLI" icon="terminal" href="/id/plugins/cli-backend-plugins">
    Petakan CLI AI lokal ke runner fallback teks OpenClaw
  </Card>
  <Card title="Plugin alat / hook" icon="wrench" href="/id/plugins/hooks">
    Daftarkan alat agen, hook peristiwa, atau layanan - lanjutkan di bawah
  </Card>
</CardGroup>

Untuk plugin saluran yang tidak dijamin terpasang saat onboarding/penyiapan
berjalan, gunakan `createOptionalChannelSetupSurface(...)` dari
`openclaw/plugin-sdk/channel-setup`. Fungsi ini menghasilkan pasangan adapter
penyiapan + wizard yang mengiklankan persyaratan pemasangan dan gagal secara
tertutup pada penulisan konfigurasi nyata sampai plugin dipasang.

## Mulai cepat: plugin alat

Panduan ini membuat plugin minimal yang mendaftarkan alat agen. Plugin saluran
dan penyedia memiliki panduan khusus yang ditautkan di atas.

<Steps>
  <Step title="Buat paket dan manifest">
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

    Setiap plugin memerlukan manifest, bahkan tanpa konfigurasi. Alat yang
    didaftarkan saat runtime harus dicantumkan dalam `contracts.tools` agar
    OpenClaw dapat menemukan plugin pemilik tanpa memuat setiap runtime plugin.
    Plugin juga sebaiknya mendeklarasikan `activation.onStartup` secara
    sengaja. Contoh ini menetapkannya ke `true`. Lihat
    [Manifest](/id/plugins/manifest) untuk skema lengkap. Cuplikan publikasi ClawHub
    kanonis berada di `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` digunakan untuk plugin non-saluran. Untuk saluran,
    gunakan `defineChannelPluginEntry` - lihat [Plugin Saluran](/id/plugins/sdk-channel-plugins).
    Untuk opsi titik masuk lengkap, lihat [Titik Masuk](/id/plugins/sdk-entrypoints).

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

    **Plugin dalam repo:** tempatkan di bawah pohon workspace plugin bawaan - ditemukan otomatis.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Kemampuan plugin

Satu plugin dapat mendaftarkan berapa pun jumlah kemampuan melalui objek `api`:

| Kemampuan              | Metode pendaftaran                               | Panduan terperinci                                                            |
| ---------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| Inferensi teks (LLM)   | `api.registerProvider(...)`                      | [Plugin Penyedia](/id/plugins/sdk-provider-plugins)                              |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | [Plugin Backend CLI](/id/plugins/cli-backend-plugins)                            |
| Saluran / perpesanan   | `api.registerChannel(...)`                       | [Plugin Saluran](/id/plugins/sdk-channel-plugins)                                |
| Ucapan (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkripsi realtime   | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Suara realtime         | `api.registerRealtimeVoiceProvider(...)`         | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan musik        | `api.registerMusicGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pengambilan web        | `api.registerWebFetchProvider(...)`              | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pencarian web          | `api.registerWebSearchProvider(...)`             | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware hasil alat  | `api.registerAgentToolResultMiddleware(...)`     | [Ringkasan SDK](/id/plugins/sdk-overview#registration-api)                       |
| Alat agen              | `api.registerTool(...)`                          | Di bawah                                                                       |
| Perintah khusus        | `api.registerCommand(...)`                       | [Titik Masuk](/id/plugins/sdk-entrypoints)                                       |
| Hook plugin            | `api.on(...)`                                    | [Hook plugin](/id/plugins/hooks)                                                 |
| Hook peristiwa internal | `api.registerHook(...)`                         | [Titik Masuk](/id/plugins/sdk-entrypoints)                                       |
| Rute HTTP              | `api.registerHttpRoute(...)`                     | [Internal](/id/plugins/architecture-internals#gateway-http-routes)               |
| Subperintah CLI        | `api.registerCli(...)`                           | [Titik Masuk](/id/plugins/sdk-entrypoints)                                       |

Untuk API pendaftaran lengkap, lihat [Ringkasan SDK](/id/plugins/sdk-overview#registration-api).

Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)` saat
mereka memerlukan penulisan ulang hasil alat secara asinkron sebelum model
melihat output. Deklarasikan runtime target dalam
`contracts.agentToolResultMiddleware`, misalnya `["pi", "codex"]`. Ini adalah
seam plugin bawaan tepercaya; plugin eksternal sebaiknya menggunakan hook plugin
OpenClaw biasa kecuali OpenClaw menambahkan kebijakan kepercayaan eksplisit untuk
kemampuan ini.

Jika plugin Anda mendaftarkan metode RPC gateway khusus, pertahankan metode
tersebut pada prefiks khusus plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
diresolusikan ke `operator.admin`, bahkan jika plugin meminta cakupan yang lebih
sempit.

Semantik penjaga hook yang perlu diingat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `before_tool_call`: `{ requireApproval: true }` menjeda eksekusi agen dan meminta persetujuan pengguna melalui overlay persetujuan exec, tombol Telegram, interaksi Discord, atau perintah `/approve` di saluran mana pun.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` diperlakukan sebagai tidak ada keputusan.
- `message_received`: utamakan field bertipe `threadId` saat Anda memerlukan perutean thread/topik masuk. Pertahankan `metadata` untuk tambahan khusus saluran.
- `message_sending`: utamakan field perutean bertipe `replyToId` / `threadId` dibandingkan kunci metadata khusus saluran.

Perintah `/approve` menangani persetujuan exec dan plugin dengan fallback terbatas: ketika id persetujuan exec tidak ditemukan, OpenClaw mencoba ulang id yang sama melalui persetujuan plugin. Penerusan persetujuan plugin dapat dikonfigurasi secara independen melalui `approvals.plugin` dalam konfigurasi.

Jika plumbing persetujuan khusus perlu mendeteksi kasus fallback terbatas yang
sama, utamakan `isApprovalNotFoundError` dari `openclaw/plugin-sdk/error-runtime`
daripada mencocokkan string kedaluwarsa persetujuan secara manual.

Lihat [Hook plugin](/id/plugins/hooks) untuk contoh dan referensi hook.

## Mendaftarkan alat agen

Alat adalah fungsi bertipe yang dapat dipanggil LLM. Alat dapat bersifat wajib
(selalu tersedia) atau opsional (ikut serta oleh pengguna):

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

Setiap alat yang didaftarkan dengan `api.registerTool(...)` juga harus
dideklarasikan dalam manifest plugin:

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

OpenClaw menangkap dan menyimpan dalam cache deskriptor tervalidasi dari alat terdaftar,
sehingga Plugin tidak menduplikasi data `description` atau skema dalam manifest. Kontrak
manifest hanya mendeklarasikan kepemilikan dan penemuan; eksekusi tetap memanggil
implementasi alat terdaftar yang aktif.
Tetapkan `toolMetadata.<tool>.optional: true` untuk alat yang didaftarkan dengan
`api.registerTool(..., { optional: true })` agar OpenClaw dapat menghindari pemuatan
runtime Plugin tersebut sampai alat diizinkan secara eksplisit.

Pengguna mengaktifkan alat opsional dalam konfigurasi:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nama alat tidak boleh bentrok dengan alat inti (konflik dilewati)
- Alat dengan objek pendaftaran yang salah bentuk, termasuk `parameters` yang hilang, dilewati dan dilaporkan dalam diagnostik Plugin alih-alih merusak eksekusi agen
- Gunakan `optional: true` untuk alat dengan efek samping atau kebutuhan biner tambahan
- Pengguna dapat mengaktifkan semua alat dari sebuah Plugin dengan menambahkan id Plugin ke `tools.allow`

## Mendaftarkan perintah CLI

Plugin dapat menambahkan grup perintah root `openclaw` dengan `api.registerCli`. Sediakan
`descriptors` untuk setiap root perintah tingkat atas agar OpenClaw dapat menampilkan dan merutekan
perintah tanpa memuat setiap runtime Plugin secara dini.

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

Selalu impor dari jalur `openclaw/plugin-sdk/<subpath>` yang terfokus:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

Untuk referensi subpath lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview).

Di dalam Plugin Anda, gunakan file barrel lokal (`api.ts`, `runtime-api.ts`) untuk
impor internal - jangan pernah mengimpor Plugin Anda sendiri melalui jalur SDK-nya.

Untuk Plugin penyedia, simpan helper khusus penyedia di barrel root paket tersebut
kecuali seam-nya benar-benar generik. Contoh bawaan saat ini:

- Anthropic: wrapper stream Claude dan helper `service_tier` / beta
- OpenAI: builder penyedia, helper model default, penyedia realtime
- OpenRouter: builder penyedia plus helper onboarding/konfigurasi

Jika sebuah helper hanya berguna di dalam satu paket penyedia bawaan, simpan helper itu pada
seam root paket tersebut alih-alih mempromosikannya ke `openclaw/plugin-sdk/*`.

Beberapa seam helper `openclaw/plugin-sdk/<bundled-id>` yang dihasilkan masih ada untuk
pemeliharaan Plugin bawaan ketika seam tersebut memiliki penggunaan pemilik yang terlacak. Perlakukan itu sebagai
permukaan yang dicadangkan, bukan sebagai pola default untuk Plugin pihak ketiga baru.

## Daftar periksa pra-pengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifest **openclaw.plugin.json** ada dan valid</Check>
<Check>Titik masuk menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua impor menggunakan jalur `plugin-sdk/<subpath>` yang terfokus</Check>
<Check>Impor internal menggunakan modul lokal, bukan impor mandiri SDK</Check>
<Check>Pengujian lulus (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lulus (Plugin dalam repo)</Check>

## Pengujian rilis beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat mengaktifkan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji Plugin Anda terhadap tag beta segera setelah tag muncul. Jendela sebelum stabil biasanya hanya beberapa jam.
3. Posting di thread Plugin Anda di kanal Discord `plugin-forum` setelah pengujian dengan `all good` atau apa yang rusak. Jika Anda belum memiliki thread, buat satu.
4. Jika ada sesuatu yang rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Letakkan tautan issue di thread Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue di PR maupun thread Discord Anda. Kontributor tidak dapat memberi label pada PR, jadi judul adalah sinyal sisi PR untuk pemelihara dan otomasi. Blocker dengan PR akan digabungkan; blocker tanpa PR mungkin tetap dirilis. Pemelihara memantau thread ini selama pengujian beta.
6. Diam berarti hijau. Jika Anda melewatkan jendelanya, perbaikan Anda kemungkinan masuk pada siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Bangun Plugin kanal pesan
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Bangun Plugin penyedia model
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/id/plugins/cli-backend-plugins">
    Daftarkan backend CLI AI lokal
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/id/plugins/sdk-overview">
    Referensi peta impor dan API pendaftaran
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, pencarian, subagen melalui api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/id/plugins/sdk-testing">
    Utilitas dan pola pengujian
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/id/plugins/manifest">
    Referensi skema manifest lengkap
  </Card>
</CardGroup>

## Terkait

- [Arsitektur Plugin](/id/plugins/architecture) - pendalaman arsitektur internal
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi SDK Plugin
- [Manifest](/id/plugins/manifest) - format manifest Plugin
- [Channel Plugins](/id/plugins/sdk-channel-plugins) - membangun Plugin kanal
- [Provider Plugins](/id/plugins/sdk-provider-plugins) - membangun Plugin penyedia
