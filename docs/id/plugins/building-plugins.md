---
read_when:
    - Anda ingin membuat plugin OpenClaw baru
    - Anda memerlukan quick-start untuk pengembangan plugin
    - Anda sedang menambahkan channel, provider, alat, atau kemampuan lain yang baru ke OpenClaw
sidebarTitle: Getting Started
summary: Buat plugin OpenClaw pertama Anda dalam hitungan menit
title: Building Plugins
x-i18n:
    generated_at: "2026-04-05T14:01:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26e780d3f04270b79d1d8f8076d6c3c5031915043e78fb8174be921c6bdd60c9
    source_path: plugins/building-plugins.md
    workflow: 15
---

# Building Plugins

Plugins memperluas OpenClaw dengan kemampuan baru: channels, provider model,
speech, transkripsi realtime, suara realtime, pemahaman media, generasi gambar,
generasi video, web fetch, web search, alat agen, atau kombinasi apa pun.

Anda tidak perlu menambahkan plugin Anda ke repositori OpenClaw. Publikasikan ke
[ClawHub](/tools/clawhub) atau npm dan pengguna menginstalnya dengan
`openclaw plugins install <package-name>`. OpenClaw mencoba ClawHub terlebih dahulu dan
secara otomatis fallback ke npm.

## Prasyarat

- Node >= 22 dan package manager (npm atau pnpm)
- Familiar dengan TypeScript (ESM)
- Untuk plugin dalam repo: repositori sudah di-clone dan `pnpm install` sudah dijalankan

## Plugin jenis apa?

<CardGroup cols={3}>
  <Card title="Plugin channel" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Hubungkan OpenClaw ke platform perpesanan (Discord, IRC, dll.)
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/plugins/sdk-provider-plugins">
    Tambahkan provider model (LLM, proxy, atau endpoint kustom)
  </Card>
  <Card title="Plugin alat / hook" icon="wrench">
    Daftarkan alat agen, event hook, atau layanan — lanjutkan di bawah
  </Card>
</CardGroup>

Jika plugin channel bersifat opsional dan mungkin belum terinstal saat onboarding/penyiapan
berjalan, gunakan `createOptionalChannelSetupSurface(...)` dari
`openclaw/plugin-sdk/channel-setup`. Ini menghasilkan adapter penyiapan + pasangan wizard
yang mengiklankan kebutuhan instalasi dan gagal tertutup pada penulisan konfigurasi nyata
sampai plugin diinstal.

## Mulai cepat: plugin alat

Panduan ini membuat plugin minimal yang mendaftarkan alat agen. Plugin channel
dan provider memiliki panduan khusus yang ditautkan di atas.

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
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    Setiap plugin memerlukan manifest, bahkan tanpa konfigurasi. Lihat
    [Manifest](/plugins/manifest) untuk skema lengkap. Snippet publish ClawHub
    kanonis tersedia di `docs/snippets/plugin-publish/`.

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

    `definePluginEntry` digunakan untuk plugin non-channel. Untuk channel, gunakan
    `defineChannelPluginEntry` — lihat [Channel Plugins](/plugins/sdk-channel-plugins).
    Untuk opsi entry point lengkap, lihat [Entry Points](/plugins/sdk-entrypoints).

  </Step>

  <Step title="Uji dan publikasikan">

    **Plugin eksternal:** validasi dan publikasikan dengan ClawHub, lalu instal:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw juga memeriksa ClawHub sebelum npm untuk spesifikasi package biasa seperti
    `@myorg/openclaw-my-plugin`.

    **Plugin dalam repo:** tempatkan di bawah tree workspace plugin bawaan — akan ditemukan secara otomatis.

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Kemampuan plugin

Satu plugin dapat mendaftarkan sejumlah kemampuan apa pun melalui objek `api`:

| Capability             | Registration method                              | Detailed guide                                                                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Inferensi teks (LLM)   | `api.registerProvider(...)`                      | [Provider Plugins](/plugins/sdk-provider-plugins)                               |
| Backend inferensi CLI  | `api.registerCliBackend(...)`                    | [CLI Backends](/id/gateway/cli-backends)                                           |
| Channel / perpesanan   | `api.registerChannel(...)`                       | [Channel Plugins](/plugins/sdk-channel-plugins)                                 |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Transkripsi realtime   | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Suara realtime         | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Pemahaman media        | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generasi gambar        | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Generasi video         | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Alat agen              | `api.registerTool(...)`                          | Di bawah                                                                        |
| Perintah kustom        | `api.registerCommand(...)`                       | [Entry Points](/plugins/sdk-entrypoints)                                        |
| Event hook             | `api.registerHook(...)`                          | [Entry Points](/plugins/sdk-entrypoints)                                        |
| Rute HTTP              | `api.registerHttpRoute(...)`                     | [Internals](/plugins/architecture#gateway-http-routes)                          |
| Subperintah CLI        | `api.registerCli(...)`                           | [Entry Points](/plugins/sdk-entrypoints)                                        |

Untuk API registrasi lengkap, lihat [SDK Overview](/plugins/sdk-overview#registration-api).

Jika plugin Anda mendaftarkan metode RPC gateway kustom, letakkan pada
prefiks khusus plugin. Namespace admin inti (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap menjadi permukaan yang dicadangkan dan selalu resolve ke
`operator.admin`, bahkan jika plugin meminta cakupan yang lebih sempit.

Semantik guard hook yang perlu diingat:

- `before_tool_call`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_tool_call`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `before_tool_call`: `{ requireApproval: true }` menjeda eksekusi agen dan meminta persetujuan pengguna melalui overlay persetujuan exec, tombol Telegram, interaksi Discord, atau perintah `/approve` di channel mana pun.
- `before_install`: `{ block: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `before_install`: `{ block: false }` diperlakukan sebagai tidak ada keputusan.
- `message_sending`: `{ cancel: true }` bersifat terminal dan menghentikan handler berprioritas lebih rendah.
- `message_sending`: `{ cancel: false }` diperlakukan sebagai tidak ada keputusan.

Perintah `/approve` menangani persetujuan exec dan plugin dengan fallback terbatas: saat ID persetujuan exec tidak ditemukan, OpenClaw mencoba kembali ID yang sama melalui persetujuan plugin. Forwarding persetujuan plugin dapat dikonfigurasi secara independen melalui `approvals.plugin` dalam konfigurasi.

Jika plumbing persetujuan kustom perlu mendeteksi kasus fallback terbatas yang sama,
gunakan `isApprovalNotFoundError` dari `openclaw/plugin-sdk/error-runtime`
alih-alih mencocokkan string kedaluwarsa persetujuan secara manual.

Lihat [semantik keputusan hook SDK Overview](/plugins/sdk-overview#hook-decision-semantics) untuk detailnya.

## Mendaftarkan alat agen

Alat adalah fungsi bertipe yang dapat dipanggil oleh LLM. Alat dapat bersifat wajib (selalu
tersedia) atau opsional (opt-in pengguna):

```typescript
register(api) {
  // Alat wajib — selalu tersedia
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Alat opsional — pengguna harus menambahkan ke allowlist
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

- Nama alat tidak boleh bentrok dengan alat inti (konflik akan dilewati)
- Gunakan `optional: true` untuk alat dengan efek samping atau kebutuhan biner tambahan
- Pengguna dapat mengaktifkan semua alat dari sebuah plugin dengan menambahkan ID plugin ke `tools.allow`

## Konvensi import

Selalu impor dari path `openclaw/plugin-sdk/<subpath>` yang terfokus:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Salah: root monolitik (deprecated, akan dihapus)
import { ... } from "openclaw/plugin-sdk";
```

Untuk referensi subpath lengkap, lihat [SDK Overview](/plugins/sdk-overview).

Di dalam plugin Anda, gunakan file barrel lokal (`api.ts`, `runtime-api.ts`) untuk
import internal — jangan pernah mengimpor plugin Anda sendiri melalui path SDK-nya.

Untuk plugin provider, simpan helper khusus provider di barrel root package tersebut
kecuali jika seam-nya benar-benar generik. Contoh bawaan saat ini:

- Anthropic: wrapper stream Claude dan helper `service_tier` / beta
- OpenAI: builder provider, helper model default, provider realtime
- OpenRouter: builder provider plus helper onboarding/konfigurasi

Jika helper hanya berguna di dalam satu package provider bawaan, simpan di seam root package
tersebut alih-alih mempromosikannya ke `openclaw/plugin-sdk/*`.

Beberapa seam helper `openclaw/plugin-sdk/<bundled-id>` yang dihasilkan masih ada untuk
pemeliharaan dan kompatibilitas bundled-plugin, misalnya
`plugin-sdk/feishu-setup` atau `plugin-sdk/zalo-setup`. Perlakukan itu sebagai
permukaan yang dicadangkan, bukan sebagai pola default untuk plugin pihak ketiga yang baru.

## Checklist sebelum pengajuan

<Check>**package.json** memiliki metadata `openclaw` yang benar</Check>
<Check>Manifest **openclaw.plugin.json** ada dan valid</Check>
<Check>Entry point menggunakan `defineChannelPluginEntry` atau `definePluginEntry`</Check>
<Check>Semua import menggunakan path `plugin-sdk/<subpath>` yang terfokus</Check>
<Check>Import internal menggunakan modul lokal, bukan SDK self-import</Check>
<Check>Test lulus (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` lulus (plugin dalam repo)</Check>

## Pengujian Rilis Beta

1. Pantau tag rilis GitHub di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) dan berlangganan melalui `Watch` > `Releases`. Tag beta terlihat seperti `v2026.3.N-beta.1`. Anda juga dapat menyalakan notifikasi untuk akun X resmi OpenClaw [@openclaw](https://x.com/openclaw) untuk pengumuman rilis.
2. Uji plugin Anda terhadap tag beta segera setelah muncul. Jendela sebelum stable biasanya hanya beberapa jam.
3. Posting di thread plugin Anda di channel Discord `plugin-forum` setelah pengujian dengan `all good` atau apa yang rusak. Jika Anda belum memiliki thread, buat satu.
4. Jika ada yang rusak, buka atau perbarui issue berjudul `Beta blocker: <plugin-name> - <summary>` dan terapkan label `beta-blocker`. Letakkan tautan issue di thread Anda.
5. Buka PR ke `main` berjudul `fix(<plugin-id>): beta blocker - <summary>` dan tautkan issue tersebut di PR maupun thread Discord Anda. Kontributor tidak dapat memberi label pada PR, jadi judul adalah sinyal sisi-PR bagi maintainer dan otomasi. Blocker dengan PR akan digabung; blocker tanpa PR mungkin tetap dirilis. Maintainer memantau thread ini selama pengujian beta.
6. Diam berarti hijau. Jika Anda melewatkan jendelanya, perbaikan Anda kemungkinan masuk pada siklus berikutnya.

## Langkah berikutnya

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/plugins/sdk-channel-plugins">
    Bangun plugin channel perpesanan
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/plugins/sdk-provider-plugins">
    Bangun plugin provider model
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/plugins/sdk-overview">
    Peta import dan referensi API registrasi
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/plugins/sdk-runtime">
    TTS, pencarian, subagen melalui api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/plugins/sdk-testing">
    Utilitas dan pola pengujian
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/plugins/manifest">
    Referensi skema manifest lengkap
  </Card>
</CardGroup>

## Terkait

- [Plugin Architecture](/plugins/architecture) — pembahasan mendalam arsitektur internal
- [SDK Overview](/plugins/sdk-overview) — referensi Plugin SDK
- [Manifest](/plugins/manifest) — format manifest plugin
- [Channel Plugins](/plugins/sdk-channel-plugins) — membuat plugin channel
- [Provider Plugins](/plugins/sdk-provider-plugins) — membuat plugin provider
