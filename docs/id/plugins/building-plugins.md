---
read_when:
    - Anda ingin membuat Plugin OpenClaw baru
    - Anda memerlukan panduan mulai cepat untuk pengembangan Plugin
    - Anda sedang menambahkan kanal, provider, alat, atau kapabilitas lain baru ke OpenClaw
sidebarTitle: Getting Started
summary: Buat Plugin OpenClaw pertama Anda dalam hitungan menit
title: Membangun Plugin
x-i18n:
    generated_at: "2026-04-24T09:18:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

Plugin memperluas OpenClaw dengan kapabilitas baru: kanal, provider model,
speech, transkripsi realtime, voice realtime, pemahaman media, pembuatan gambar,
pembuatan video, web fetch, web search, alat agen, atau kombinasi apa pun.

Anda tidak perlu menambahkan Plugin Anda ke repositori OpenClaw. Publikasikan ke
[ClawHub](/id/tools/clawhub) atau npm dan pengguna memasangnya dengan
`openclaw plugins install <package-name>`. OpenClaw mencoba ClawHub terlebih dahulu dan
otomatis fallback ke npm.

## Prasyarat

- Node >= 22 dan package manager (npm atau pnpm)
- Familiar dengan TypeScript (ESM)
- Untuk Plugin di dalam repo: repositori sudah di-clone dan `pnpm install` sudah dijalankan

## Plugin seperti apa?

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform pesan (Discord, IRC, dll.)
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Tambahkan provider model (LLM, proxy, atau endpoint kustom)
  </Card>
  <Card title="Tool / hook plugin" icon="wrench">
    Daftarkan alat agen, hook peristiwa, atau layanan — lanjutkan di bawah
  </Card>
</CardGroup>

Untuk Channel Plugin yang tidak dijamin terpasang saat onboarding/setup
berjalan, gunakan `createOptionalChannelSetupSurface(...)` dari
`openclaw/plugin-sdk/channel-setup`. Fungsi ini menghasilkan pasangan adapter + wizard setup
yang mengiklankan kebutuhan instalasi dan gagal tertutup pada penulisan konfigurasi nyata
sampai Plugin terpasang.

## Mulai cepat: Tool Plugin

Panduan ini membuat Plugin minimal yang mendaftarkan alat agen. Channel
dan Provider Plugin memiliki panduan khusus yang ditautkan di atas.

<Steps>
  <Step title="Buat package dan manifest">
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
      "description": "Menambahkan alat kustom ke OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Setiap Plugin memerlukan manifest, bahkan tanpa konfigurasi. Lihat
    [Manifest](/id/plugins/manifest) untuk skema lengkap. Cuplikan publish ClawHub kanonis
    ada di `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Tulis titik masuk">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Menambahkan alat kustom ke OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Lakukan sesuatu",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` digunakan untuk Plugin non-kanal. Untuk kanal, gunakan
    `defineChannelPluginEntry` — lihat [Channel Plugins](/id/plugins/sdk-channel-plugins).
    Untuk opsi titik masuk lengkap, lihat [Entry Points](/id/plugins/sdk-entrypoints).

  </Step>

  <Step title="Uji dan publikasikan">

    **Plugin eksternal:** validasi dan publikasikan dengan ClawHub, lalu instal:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw juga memeriksa ClawHub sebelum npm untuk spec package polos seperti
    `@myorg/openclaw-my-plugin`.

    **Plugin di dalam repo:** tempatkan di bawah tree workspace Plugin bawaan — akan ditemukan otomatis.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Kapabilitas Plugin

Satu Plugin dapat mendaftarkan sejumlah kapabilitas melalui objek `api`:

| Kapabilitas            | Metode pendaftaran                              | Panduan terperinci                                                              |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| Inferensi teks (LLM)   | `api.registerProvider(...)`                     | [Provider Plugins](/id/plugins/sdk-provider-plugins)                               |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                   | [Backend CLI](/id/gateway/cli-backends)                                            |
| Kanal / pesan          | `api.registerChannel(...)`                      | [Channel Plugins](/id/plugins/sdk-channel-plugins)                                 |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`               | [Provider Plugins](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkripsi realtime   | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Voice realtime         | `api.registerRealtimeVoiceProvider(...)`        | [Provider Plugins](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`   | [Provider Plugins](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan gambar       | `api.registerImageGenerationProvider(...)`      | [Provider Plugins](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan musik        | `api.registerMusicGenerationProvider(...)`      | [Provider Plugins](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pembuatan video        | `api.registerVideoGenerationProvider(...)`      | [Provider Plugins](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`             | [Provider Plugins](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`            | [Provider Plugins](/id/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Ekstensi Pi tertanam   | `api.registerEmbeddedExtensionFactory(...)`     | [Ikhtisar SDK](/id/plugins/sdk-overview#registration-api)                          |
| Alat agen              | `api.registerTool(...)`                         | Di bawah                                                                        |
| Perintah kustom        | `api.registerCommand(...)`                      | [Entry Points](/id/plugins/sdk-entrypoints)                                        |
| Hook peristiwa         | `api.registerHook(...)`                         | [Entry Points](/id/plugins/sdk-entrypoints)                                        |
| Rute HTTP              | `api.registerHttpRoute(...)`                    | [Internals](/id/plugins/architecture-internals#gateway-http-routes)                |
| Subperintah CLI        | `api.registerCli(...)`                          | [Entry Points](/id/plugins/sdk-entrypoints)                                        |

Untuk API pendaftaran lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview#registration-api).

Gunakan `api.registerEmbeddedExtensionFactory(...)` ketika Plugin membutuhkan
hook embedded-runner native Pi seperti penulisan ulang `tool_result` async sebelum pesan hasil
alat final dipancarkan. Utamakan hook Plugin OpenClaw biasa ketika pekerjaan tersebut
tidak membutuhkan timing ekstensi Pi.

Jika Plugin Anda mendaftarkan metode RPC gateway kustom, pertahankan metode itu pada
prefix khusus Plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu diselesaikan ke
`operator.admin`, bahkan jika Plugin meminta cakupan yang lebih sempit.

Semantik guard hook yang perlu diingat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `before_tool_call`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `before_tool_call`: `{ requireApproval: true }` menjeda eksekusi agen dan meminta persetujuan pengguna melalui overlay persetujuan exec, tombol Telegram, interaksi Discord, atau perintah `/approve` di kanal apa pun.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `before_install`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler prioritas lebih rendah.
- `message_sending`: `{ cancel: false }` diperlakukan sebagai tidak ada keputusan.
- `message_received`: utamakan field `threadId` bertipe ketika Anda memerlukan perutean thread/topik masuk. Simpan `metadata` untuk tambahan khusus kanal.
- `message_sending`: utamakan field perutean bertipe `replyToId` / `threadId` dibanding kunci metadata khusus kanal.

Perintah `/approve` menangani persetujuan exec dan Plugin dengan fallback terbatas: ketika approval id exec tidak ditemukan, OpenClaw mencoba ulang id yang sama melalui persetujuan Plugin. Penerusan persetujuan Plugin dapat dikonfigurasi secara independen melalui `approvals.plugin` di konfigurasi.

Jika plumbing persetujuan kustom perlu mendeteksi kasus fallback terbatas yang sama,
utamakan `isApprovalNotFoundError` dari `openclaw/plugin-sdk/error-runtime`
daripada mencocokkan string kedaluwarsa persetujuan secara manual.

Lihat [Semantik keputusan hook Ikhtisar SDK](/id/plugins/sdk-overview#hook-decision-semantics) untuk detail.

## Mendaftarkan alat agen

Alat adalah fungsi bertipe yang dapat dipanggil LLM. Alat dapat bersifat required (selalu
tersedia) atau optional (pengguna harus opt-in):

```typescript
register(api) {
  // Alat required — selalu tersedia
  api.registerTool({
    name: "my_tool",
    description: "Lakukan sesuatu",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Alat optional — pengguna harus menambahkannya ke allowlist
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Jalankan alur kerja",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Pengguna mengaktifkan alat optional di konfigurasi:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Nama alat tidak boleh bentrok dengan alat inti (konflik akan dilewati)
- Gunakan `optional: true` untuk alat yang memiliki efek samping atau memerlukan biner tambahan
- Pengguna dapat mengaktifkan semua alat dari sebuah Plugin dengan menambahkan id Plugin ke `tools.allow`

## Konvensi import

Selalu impor dari path fokus `openclaw/plugin-sdk/<subpath>`:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Salah: root monolitik (deprecated, akan dihapus)
import { ... } from "openclaw/plugin-sdk";
```

Untuk referensi subpath lengkap, lihat [Ikhtisar SDK](/id/plugins/sdk-overview).

Di dalam Plugin Anda, gunakan file barrel lokal (`api.ts`, `runtime-api.ts`) untuk
import internal — jangan pernah mengimpor Plugin Anda sendiri melalui path SDK-nya.

Untuk Provider Plugin, pertahankan helper khusus provider di barrel root package tersebut kecuali seam-nya benar-benar generik. Contoh bawaan saat ini:

- Anthropic: pembungkus stream Claude dan helper `service_tier` / beta
- OpenAI: builder provider, helper model default, provider realtime
- OpenRouter: builder provider plus helper onboarding/konfigurasi

Jika sebuah helper hanya berguna di dalam satu package provider bawaan, pertahankan helper itu pada seam root package tersebut alih-alih mempromosikannya ke `openclaw/plugin-sdk/*`.

Beberapa seam helper `openclaw/plugin-sdk/<bundled-id>` yang dihasilkan masih ada untuk
pemeliharaan dan kompatibilitas Plugin bawaan, misalnya
`plugin-sdk/feishu-setup` atau `plugin-sdk/zalo-setup`. Perlakukan seam tersebut sebagai
permukaan yang dicadangkan, bukan pola default untuk Plugin pihak ketiga yang baru.

## Daftar periksa pra-pengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifest **openclaw.plugin.json** ada dan valid</Check>
<Check>Titik masuk menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua import menggunakan path fokus `plugin-sdk/<subpath>`</Check>
<Check>Import internal menggunakan modul lokal, bukan self-import SDK</Check>
<Check>Pengujian lulus (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lulus (Plugin di dalam repo)</Check>

## Pengujian Rilis Beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat menyalakan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji Plugin Anda terhadap tag beta segera setelah muncul. Jendela sebelum stable biasanya hanya beberapa jam.
3. Posting di thread Plugin Anda di kanal Discord `plugin-forum` setelah pengujian dengan `all good` atau apa yang rusak. Jika Anda belum memiliki thread, buat satu.
4. Jika ada yang rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Letakkan tautan issue di thread Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue itu di PR maupun di thread Discord Anda. Kontributor tidak dapat memberi label pada PR, jadi judul adalah sinyal sisi-PR untuk maintainer dan otomatisasi. Blocker yang memiliki PR akan di-merge; blocker tanpa PR mungkin tetap dikirim. Maintainer memantau thread ini selama pengujian beta.
6. Diam berarti hijau. Jika Anda melewatkan jendela ini, perbaikan Anda kemungkinan masuk pada siklus berikutnya.

## Langkah selanjutnya

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/id/plugins/sdk-channel-plugins">
    Bangun Channel Plugin untuk pesan
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/id/plugins/sdk-provider-plugins">
    Bangun Provider Plugin model
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/id/plugins/sdk-overview">
    Referensi import map dan API pendaftaran
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
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi SDK Plugin
- [Manifest](/id/plugins/manifest) — format manifest Plugin
- [Channel Plugins](/id/plugins/sdk-channel-plugins) — membangun Channel Plugin
- [Provider Plugins](/id/plugins/sdk-provider-plugins) — membangun Provider Plugin
