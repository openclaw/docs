---
read_when:
    - Anda ingin membuat Plugin OpenClaw baru
    - Anda memerlukan panduan mulai cepat untuk pengembangan Plugin
    - Anda sedang menambahkan saluran, penyedia, alat, atau kemampuan lain yang baru ke OpenClaw
sidebarTitle: Getting Started
summary: Buat Plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun Plugin
x-i18n:
    generated_at: "2026-04-30T10:00:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin memperluas OpenClaw dengan kemampuan baru: channel, penyedia model,
speech, transkripsi realtime, suara realtime, pemahaman media, pembuatan gambar,
pembuatan video, pengambilan web, pencarian web, alat agen, atau kombinasi apa pun.

Anda tidak perlu menambahkan plugin Anda ke repositori OpenClaw. Publikasikan ke
[ClawHub](/id/tools/clawhub) dan pengguna menginstalnya dengan
`openclaw plugins install <package-name>`. OpenClaw mencoba ClawHub terlebih dahulu dan
secara otomatis beralih ke npm untuk paket yang masih menggunakan distribusi npm.

## Prasyarat

- Node >= 22 dan manajer paket (npm atau pnpm)
- Keakraban dengan TypeScript (ESM)
- Untuk plugin dalam repo: repositori sudah dikloning dan `pnpm install` sudah dilakukan

## Jenis plugin apa?

<CardGroup cols={3}>
  <Card title="Plugin channel" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform pesan (Discord, IRC, dll.)
  </Card>
  <Card title="Plugin penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Tambahkan penyedia model (LLM, proxy, atau endpoint khusus)
  </Card>
  <Card title="Plugin alat / hook" icon="wrench" href="/id/plugins/hooks">
    Daftarkan alat agen, hook peristiwa, atau layanan — lanjutkan di bawah
  </Card>
</CardGroup>

Untuk plugin channel yang tidak dijamin terinstal saat onboarding/penyiapan
berjalan, gunakan `createOptionalChannelSetupSurface(...)` dari
`openclaw/plugin-sdk/channel-setup`. Ini menghasilkan pasangan adapter penyiapan + wizard
yang mengiklankan persyaratan instalasi dan gagal tertutup pada penulisan konfigurasi nyata
hingga plugin terinstal.

## Mulai cepat: plugin alat

Panduan ini membuat plugin minimal yang mendaftarkan alat agen. Plugin channel
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

    Setiap plugin memerlukan manifes, bahkan tanpa konfigurasi, dan setiap plugin harus
    mendeklarasikan `activation.onStartup` secara sengaja. Alat yang didaftarkan saat runtime membutuhkan
    impor saat startup, jadi contoh ini mengaturnya ke `true`. Lihat
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

    `definePluginEntry` ditujukan untuk plugin non-channel. Untuk channel, gunakan
    `defineChannelPluginEntry` — lihat [Plugin Channel](/id/plugins/sdk-channel-plugins).
    Untuk opsi titik masuk lengkap, lihat [Titik Masuk](/id/plugins/sdk-entrypoints).

  </Step>

  <Step title="Uji dan publikasikan">

    **Plugin eksternal:** validasi dan publikasikan dengan ClawHub, lalu instal:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw juga memeriksa ClawHub sebelum npm untuk spesifikasi paket polos seperti
    `@myorg/openclaw-my-plugin`; npm tetap menjadi fallback untuk paket yang
    belum bermigrasi ke ClawHub.

    **Plugin dalam repo:** tempatkan di bawah pohon workspace plugin bawaan — akan ditemukan otomatis.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Kemampuan plugin

Satu plugin dapat mendaftarkan sejumlah kemampuan melalui objek `api`:

| Kemampuan              | Metode pendaftaran                              | Panduan terperinci                                                            |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferensi teks (LLM)   | `api.registerProvider(...)`                      | [Plugin Penyedia](/id/plugins/sdk-provider-plugins)                               |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | [Backend CLI](/id/gateway/cli-backends)                                           |
| Channel / pesan        | `api.registerChannel(...)`                       | [Plugin Channel](/id/plugins/sdk-channel-plugins)                                 |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkripsi realtime   | `api.registerRealtimeTranscriptionProvider(...)` | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Suara realtime         | `api.registerRealtimeVoiceProvider(...)`         | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan musik        | `api.registerMusicGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`       | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pengambilan web        | `api.registerWebFetchProvider(...)`              | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pencarian web          | `api.registerWebSearchProvider(...)`             | [Plugin Penyedia](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Middleware hasil alat  | `api.registerAgentToolResultMiddleware(...)`     | [Ikhtisar SDK](/id/plugins/sdk-overview#registration-api)                         |
| Alat agen              | `api.registerTool(...)`                          | Di bawah                                                                       |
| Perintah khusus        | `api.registerCommand(...)`                       | [Titik Masuk](/id/plugins/sdk-entrypoints)                                        |
| Hook plugin            | `api.on(...)`                                    | [Hook plugin](/id/plugins/hooks)                                                  |
| Hook peristiwa internal | `api.registerHook(...)`                         | [Titik Masuk](/id/plugins/sdk-entrypoints)                                        |
| Rute HTTP              | `api.registerHttpRoute(...)`                     | [Internal](/id/plugins/architecture-internals#gateway-http-routes)                |
| Subperintah CLI        | `api.registerCli(...)`                           | [Titik Masuk](/id/plugins/sdk-entrypoints)                                        |

Untuk API pendaftaran lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview#registration-api).

Plugin bawaan dapat menggunakan `api.registerAgentToolResultMiddleware(...)` saat mereka
membutuhkan penulisan ulang hasil alat secara asinkron sebelum model melihat output. Deklarasikan
runtime yang ditargetkan di `contracts.agentToolResultMiddleware`, misalnya
`["pi", "codex"]`. Ini adalah seam plugin bawaan tepercaya; plugin eksternal
sebaiknya memilih hook plugin OpenClaw biasa kecuali OpenClaw menambahkan
kebijakan kepercayaan eksplisit untuk kemampuan ini.

Jika plugin Anda mendaftarkan metode RPC Gateway khusus, pertahankan pada
prefiks khusus plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu di-resolve ke
`operator.admin`, bahkan jika plugin meminta cakupan yang lebih sempit.

Semantik guard hook yang perlu diingat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` diperlakukan sebagai tanpa keputusan.
- `before_tool_call`: `{ requireApproval: true }` menjeda eksekusi agen dan meminta persetujuan pengguna melalui overlay persetujuan exec, tombol Telegram, interaksi Discord, atau perintah `/approve` di channel mana pun.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` diperlakukan sebagai tanpa keputusan.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` diperlakukan sebagai tanpa keputusan.
- `message_received`: utamakan bidang bertipe `threadId` saat Anda membutuhkan perutean thread/topik masuk. Pertahankan `metadata` untuk tambahan khusus channel.
- `message_sending`: utamakan bidang perutean bertipe `replyToId` / `threadId` dibandingkan kunci metadata khusus channel.

Perintah `/approve` menangani persetujuan exec dan plugin dengan fallback berbatas: saat id persetujuan exec tidak ditemukan, OpenClaw mencoba ulang id yang sama melalui persetujuan plugin. Penerusan persetujuan plugin dapat dikonfigurasi secara independen melalui `approvals.plugin` dalam konfigurasi.

Jika plumbing persetujuan khusus perlu mendeteksi kasus fallback berbatas yang sama,
utamakan `isApprovalNotFoundError` dari `openclaw/plugin-sdk/error-runtime`
alih-alih mencocokkan string kedaluwarsa persetujuan secara manual.

Lihat [Hook plugin](/id/plugins/hooks) untuk contoh dan referensi hook.

## Mendaftarkan alat agen

Alat adalah fungsi bertipe yang dapat dipanggil LLM. Alat bisa wajib (selalu
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

Pengguna mengaktifkan alat opsional dalam konfigurasi:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nama alat tidak boleh bentrok dengan alat inti (konflik dilewati)
- Alat dengan objek pendaftaran yang salah bentuk, termasuk `parameters` yang hilang, dilewati dan dilaporkan dalam diagnostik plugin alih-alih merusak jalannya agen
- Gunakan `optional: true` untuk alat dengan efek samping atau persyaratan biner tambahan
- Pengguna dapat mengaktifkan semua alat dari sebuah plugin dengan menambahkan id plugin ke `tools.allow`

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
impor internal — jangan pernah mengimpor plugin Anda sendiri melalui jalur SDK-nya.

Untuk plugin penyedia, simpan helper khusus penyedia di barrel root paket tersebut
kecuali seam tersebut benar-benar generik. Contoh bundled saat ini:

- Anthropic: wrapper stream Claude dan helper `service_tier` / beta
- OpenAI: builder penyedia, helper model default, penyedia realtime
- OpenRouter: builder penyedia plus helper onboarding/konfigurasi

Jika sebuah helper hanya berguna di dalam satu paket penyedia bundled, simpan helper itu pada
seam root paket tersebut alih-alih mempromosikannya ke `openclaw/plugin-sdk/*`.

Beberapa seam helper `openclaw/plugin-sdk/<bundled-id>` yang dihasilkan masih ada untuk
pemeliharaan plugin bundled ketika memiliki penggunaan pemilik yang dilacak. Perlakukan seam tersebut sebagai
permukaan cadangan, bukan sebagai pola default untuk plugin pihak ketiga baru.

## Daftar periksa sebelum pengiriman

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifes **openclaw.plugin.json** ada dan valid</Check>
<Check>Titik masuk menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua impor menggunakan jalur `plugin-sdk/<subpath>` yang terfokus</Check>
<Check>Impor internal menggunakan modul lokal, bukan impor mandiri SDK</Check>
<Check>Pengujian lulus (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lulus (plugin dalam repo)</Check>

## Pengujian rilis beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat mengaktifkan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta segera setelah muncul. Jendela waktu sebelum stabil biasanya hanya beberapa jam.
3. Posting di thread plugin Anda di channel Discord `plugin-forum` setelah pengujian dengan `all good` atau hal yang rusak. Jika Anda belum memiliki thread, buat satu.
4. Jika ada yang rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Cantumkan tautan issue di thread Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue tersebut di PR maupun thread Discord Anda. Kontributor tidak dapat memberi label pada PR, jadi judul adalah sinyal sisi PR untuk maintainer dan automasi. Blocker dengan PR akan digabungkan; blocker tanpa PR mungkin tetap dikirim. Maintainer memantau thread ini selama pengujian beta.
6. Diam berarti hijau. Jika Anda melewatkan jendela waktunya, perbaikan Anda kemungkinan masuk di siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Plugin Channel" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Bangun plugin channel pesan
  </Card>
  <Card title="Plugin Penyedia" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Bangun plugin penyedia model
  </Card>
  <Card title="Ikhtisar SDK" icon="book-open" href="/id/plugins/sdk-overview">
    Referensi peta impor dan API pendaftaran
  </Card>
  <Card title="Helper Runtime" icon="settings" href="/id/plugins/sdk-runtime">
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

- [Arsitektur Plugin](/id/plugins/architecture) — pendalaman arsitektur internal
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi SDK Plugin
- [Manifes](/id/plugins/manifest) — format manifes plugin
- [Plugin Channel](/id/plugins/sdk-channel-plugins) — membangun plugin channel
- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) — membangun plugin penyedia
