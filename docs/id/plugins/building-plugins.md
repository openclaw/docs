---
read_when:
    - Anda ingin membuat Plugin OpenClaw baru
    - Anda memerlukan panduan mulai cepat untuk pengembangan Plugin
    - Anda sedang menambahkan saluran, penyedia, alat, atau kemampuan baru lainnya ke OpenClaw
sidebarTitle: Getting Started
summary: Buat Plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun Plugin
x-i18n:
    generated_at: "2026-05-02T20:47:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: kanal, penyedia model,
ucapan, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar,
pembuatan video, pengambilan web, pencarian web, alat agen, atau kombinasi apa pun.

Anda tidak perlu menambahkan Plugin Anda ke repositori OpenClaw. Publikasikan ke
[ClawHub](/id/tools/clawhub) dan pengguna menginstalnya dengan
`openclaw plugins install clawhub:<package-name>`. Spesifikasi paket polos masih
diinstal dari npm selama cutover peluncuran.

## Prasyarat

- Node >= 22 dan package manager (npm atau pnpm)
- Familiar dengan TypeScript (ESM)
- Untuk Plugin dalam repo: repositori sudah dikloning dan `pnpm install` sudah selesai. Pengembangan Plugin dari source
  checkout hanya pnpm karena OpenClaw memuat Plugin bawaan
  dari paket workspace `extensions/*`.

## Jenis Plugin apa?

<CardGroup cols={3}>
  <Card title="Plugin kanal" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform perpesanan (Discord, IRC, dll.)
  </Card>
  <Card title="Plugin penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Tambahkan penyedia model (LLM, proxy, atau endpoint kustom)
  </Card>
  <Card title="Plugin alat / hook" icon="wrench" href="/id/plugins/hooks">
    Daftarkan alat agen, hook peristiwa, atau layanan — lanjutkan di bawah
  </Card>
</CardGroup>

Untuk Plugin kanal yang tidak dijamin sudah terinstal saat onboarding/setup
berjalan, gunakan `createOptionalChannelSetupSurface(...)` dari
`openclaw/plugin-sdk/channel-setup`. Ini menghasilkan pasangan adapter setup + wizard
yang mengiklankan persyaratan instalasi dan gagal tertutup pada penulisan konfigurasi nyata
hingga Plugin terinstal.

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

    Setiap Plugin memerlukan manifes, bahkan tanpa konfigurasi. Alat yang didaftarkan saat runtime
    harus dicantumkan di `contracts.tools` agar OpenClaw dapat menemukan Plugin
    pemiliknya tanpa memuat setiap runtime Plugin. Plugin juga sebaiknya mendeklarasikan
    `activation.onStartup` secara sengaja. Contoh ini mengaturnya ke `true`. Lihat
    [Manifes](/id/plugins/manifest) untuk skema lengkap. Cuplikan publikasi ClawHub
    kanonis ada di `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` ditujukan untuk Plugin non-kanal. Untuk kanal, gunakan
    `defineChannelPluginEntry` — lihat [Plugin Kanal](/id/plugins/sdk-channel-plugins).
    Untuk opsi entry point lengkap, lihat [Entry Point](/id/plugins/sdk-entrypoints).

  </Step>

  <Step title="Uji dan publikasikan">

    **Plugin eksternal:** validasi dan publikasikan dengan ClawHub, lalu instal:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    Spesifikasi paket polos seperti `@myorg/openclaw-my-plugin` diinstal dari npm selama
    cutover peluncuran. Gunakan `clawhub:` saat Anda menginginkan resolusi ClawHub.

    **Plugin dalam repo:** tempatkan di bawah pohon workspace Plugin bawaan — ditemukan secara otomatis.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Kemampuan Plugin

Satu Plugin dapat mendaftarkan sejumlah kemampuan melalui objek `api`:

| Kemampuan              | Metode pendaftaran                              | Panduan terperinci                                                            |
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
| Hook Plugin            | `api.on(...)`                                    | [Hook Plugin](/id/plugins/hooks)                                                  |
| Hook peristiwa internal | `api.registerHook(...)`                          | [Entry Point](/id/plugins/sdk-entrypoints)                                        |
| Rute HTTP              | `api.registerHttpRoute(...)`                     | [Internal](/id/plugins/architecture-internals#gateway-http-routes)                |
| Subperintah CLI        | `api.registerCli(...)`                           | [Entry Point](/id/plugins/sdk-entrypoints)                                        |

Untuk API pendaftaran lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview#registration-api).

Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)` saat mereka
memerlukan penulisan ulang hasil alat secara asinkron sebelum model melihat output. Deklarasikan
runtime yang ditargetkan di `contracts.agentToolResultMiddleware`, misalnya
`["pi", "codex"]`. Ini adalah seam Plugin bawaan tepercaya; Plugin eksternal
sebaiknya memilih hook Plugin OpenClaw reguler kecuali OpenClaw menumbuhkan
kebijakan kepercayaan eksplisit untuk kemampuan ini.

Jika Plugin Anda mendaftarkan metode RPC gateway kustom, pertahankan metode tersebut pada
prefiks khusus Plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve ke
`operator.admin`, bahkan jika Plugin meminta cakupan yang lebih sempit.

Semantik guard hook yang perlu diingat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` diperlakukan sebagai tanpa keputusan.
- `before_tool_call`: `{ requireApproval: true }` menjeda eksekusi agen dan meminta persetujuan pengguna melalui overlay persetujuan exec, tombol Telegram, interaksi Discord, atau perintah `/approve` di kanal mana pun.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` diperlakukan sebagai tanpa keputusan.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` diperlakukan sebagai tanpa keputusan.
- `message_received`: pilih bidang bertipe `threadId` saat Anda memerlukan routing thread/topik masuk. Pertahankan `metadata` untuk tambahan khusus kanal.
- `message_sending`: pilih bidang routing bertipe `replyToId` / `threadId` dibandingkan kunci metadata khusus kanal.

Perintah `/approve` menangani persetujuan exec dan Plugin dengan fallback terbatas: saat id persetujuan exec tidak ditemukan, OpenClaw mencoba ulang id yang sama melalui persetujuan Plugin. Penerusan persetujuan Plugin dapat dikonfigurasi secara independen melalui `approvals.plugin` di konfigurasi.

Jika plumbing persetujuan kustom perlu mendeteksi kasus fallback terbatas yang sama,
pilih `isApprovalNotFoundError` dari `openclaw/plugin-sdk/error-runtime`
daripada mencocokkan string kedaluwarsa persetujuan secara manual.

Lihat [Hook Plugin](/id/plugins/hooks) untuk contoh dan referensi hook.

## Mendaftarkan alat agen

Alat adalah fungsi bertipe yang dapat dipanggil oleh LLM. Alat dapat bersifat wajib (selalu
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
  }
}
```

OpenClaw menangkap dan menyimpan cache deskriptor tervalidasi dari alat yang didaftarkan,
sehingga Plugin tidak menduplikasi `description` atau data skema dalam manifes. Kontrak
manifes hanya mendeklarasikan kepemilikan dan penemuan; eksekusi tetap memanggil
implementasi alat terdaftar yang live.

Pengguna mengaktifkan alat opsional dalam konfigurasi:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nama alat tidak boleh bertabrakan dengan alat inti (konflik dilewati)
- Alat dengan objek pendaftaran yang salah bentuk, termasuk `parameters` yang hilang, dilewati dan dilaporkan di diagnostik plugin alih-alih merusak jalannya agen
- Gunakan `optional: true` untuk alat dengan efek samping atau kebutuhan biner tambahan
- Pengguna dapat mengaktifkan semua alat dari sebuah plugin dengan menambahkan id plugin ke `tools.allow`

## Mendaftarkan perintah CLI

Plugin dapat menambahkan grup perintah root `openclaw` dengan `api.registerCli`. Sediakan
`descriptors` untuk setiap root perintah tingkat teratas agar OpenClaw dapat menampilkan dan merutekan
perintah tanpa memuat setiap runtime plugin secara dini.

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

Untuk referensi subjalur lengkap, lihat [Gambaran Umum SDK](/id/plugins/sdk-overview).

Di dalam plugin Anda, gunakan file barrel lokal (`api.ts`, `runtime-api.ts`) untuk
impor internal — jangan pernah mengimpor plugin Anda sendiri melalui jalur SDK-nya.

Untuk plugin penyedia, simpan helper khusus penyedia di barrel root paket tersebut
kecuali seam tersebut benar-benar generik. Contoh bawaan saat ini:

- Anthropic: wrapper stream Claude dan helper `service_tier` / beta
- OpenAI: builder penyedia, helper model default, penyedia realtime
- OpenRouter: builder penyedia serta helper onboarding/konfigurasi

Jika sebuah helper hanya berguna di dalam satu paket penyedia bawaan, pertahankan helper itu pada
seam root paket tersebut alih-alih mempromosikannya ke `openclaw/plugin-sdk/*`.

Beberapa seam helper `openclaw/plugin-sdk/<bundled-id>` yang dihasilkan masih ada untuk
pemeliharaan plugin bawaan ketika seam tersebut memiliki penggunaan pemilik yang terlacak. Anggap seam tersebut sebagai
permukaan yang dicadangkan, bukan sebagai pola default untuk plugin pihak ketiga baru.

## Daftar periksa prapengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifest **openclaw.plugin.json** ada dan valid</Check>
<Check>Titik masuk menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua impor menggunakan jalur `plugin-sdk/<subpath>` yang terfokus</Check>
<Check>Impor internal menggunakan modul lokal, bukan impor mandiri SDK</Check>
<Check>Tes lulus (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lulus (plugin dalam repo)</Check>

## Pengujian rilis beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat mengaktifkan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta begitu tag tersebut muncul. Jendela waktu sebelum stabil biasanya hanya beberapa jam.
3. Posting di utas plugin Anda di kanal Discord `plugin-forum` setelah pengujian dengan `all good` atau hal yang rusak. Jika Anda belum memiliki utas, buat satu.
4. Jika ada yang rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Masukkan tautan issue di utas Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue tersebut di PR dan utas Discord Anda. Kontributor tidak dapat memberi label PR, jadi judul adalah sinyal sisi PR untuk maintainer dan otomasi. Blocker dengan PR akan digabungkan; blocker tanpa PR mungkin tetap dikirim. Maintainer memantau utas ini selama pengujian beta.
6. Diam berarti hijau. Jika Anda melewatkan jendela waktunya, perbaikan Anda kemungkinan masuk di siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin kanal pesan
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
    Referensi skema manifest lengkap
  </Card>
</CardGroup>

## Terkait

- [Arsitektur Plugin](/id/plugins/architecture) — pendalaman arsitektur internal
- [Gambaran Umum SDK](/id/plugins/sdk-overview) — referensi SDK Plugin
- [Manifest](/id/plugins/manifest) — format manifest plugin
- [Plugin Kanal](/id/plugins/sdk-channel-plugins) — membangun plugin kanal
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) — membangun plugin penyedia
