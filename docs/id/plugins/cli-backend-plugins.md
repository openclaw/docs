---
read_when:
    - Anda sedang membangun Plugin backend CLI AI lokal
    - Anda ingin mendaftarkan backend untuk referensi model seperti acme-cli/model
    - Anda perlu memetakan CLI pihak ketiga ke runner fallback teks OpenClaw
sidebarTitle: CLI backend plugins
summary: Buat plugin yang mendaftarkan backend CLI AI lokal
title: Membangun plugin backend CLI
x-i18n:
    generated_at: "2026-07-19T05:04:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5bce682ad5ea64c11e4447f51c0f6cb083a0f6f4b88864792b82d8ef89fa64f
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin backend CLI memungkinkan OpenClaw memanggil CLI AI lokal sebagai backend
inferensi teks. Backend muncul sebagai prefiks penyedia dalam referensi model:

```text
acme-cli/acme-large
```

Gunakan backend CLI ketika integrasi hulu sudah tersedia sebagai perintah lokal,
ketika CLI mengelola status login lokal, atau sebagai opsi cadangan ketika
penyedia API tidak tersedia.

<Info>
  Jika layanan hulu menyediakan API model HTTP biasa, buat
  [plugin penyedia](/id/plugins/sdk-provider-plugins) sebagai gantinya. Jika runtime
  hulu mengelola sesi agen lengkap, peristiwa alat, compaction, atau status tugas
  latar belakang, gunakan [harness agen](/id/plugins/sdk-agent-harness).
</Info>

## Yang dikelola plugin

Plugin backend CLI memiliki tiga kontrak:

| Kontrak              | File                   | Tujuan                                                    |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Entri paket          | `package.json`         | Mengarahkan OpenClaw ke modul runtime plugin              |
| Kepemilikan manifes  | `openclaw.plugin.json` | Mendeklarasikan id backend sebelum runtime dimuat         |
| Pendaftaran runtime  | `index.ts`             | Memanggil `api.registerCliBackend(...)` dengan nilai default perintah |

Manifes adalah metadata penemuan: manifes tidak mengeksekusi CLI atau
mendaftarkan perilaku runtime. Perilaku runtime dimulai ketika entri plugin
memanggil `api.registerCliBackend(...)`.

## Plugin backend minimal

<Steps>
  <Step title="Buat metadata paket">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
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
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    Paket yang dipublikasikan harus menyertakan file runtime JavaScript hasil
    build. Jika entri sumber Anda adalah `./src/index.ts`, tambahkan
    `openclaw.runtimeExtensions` yang menunjuk ke padanan JavaScript hasil build. Lihat
    [Titik entri](/id/plugins/sdk-entrypoints).

  </Step>

  <Step title="Deklarasikan kepemilikan backend">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Jalankan CLI AI lokal Acme melalui OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` adalah daftar kepemilikan runtime; daftar ini memungkinkan
    OpenClaw memuat plugin secara otomatis ketika konfigurasi atau pemilihan model
    menyebutkan `acme-cli/...`.

    `setup.cliBackends` adalah permukaan penyiapan yang mengutamakan deskriptor.
    Tambahkan ketika penemuan model, orientasi awal, atau status harus mengenali
    backend tanpa memuat runtime plugin. Gunakan `requiresRuntime: false` hanya ketika
    deskriptor statis tersebut sudah memadai untuk penyiapan.

  </Step>

  <Step title="Daftarkan backend">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    Id backend harus cocok dengan entri manifes `cliBackends`. Nilai
    `config` yang didaftarkan hanyalah nilai default; konfigurasi
    pengguna di bawah `agents.defaults.cliBackends.acme-cli` digabungkan di atasnya saat runtime.

  </Step>
</Steps>

## Bentuk konfigurasi

`CliBackendConfig` menjelaskan cara OpenClaw harus menjalankan dan mengurai CLI:

| Bidang                                                    | Kegunaan                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | Nama biner atau path perintah absolut                                             |
| `args`                                                    | Argumen dasar untuk eksekusi baru                                                 |
| `resumeArgs`                                              | Argumen alternatif untuk sesi yang dilanjutkan; mendukung `{sessionId}`           |
| `output` / `resumeOutput`                                 | Pengurai: `json`, `jsonl`, atau `text`                                           |
| `jsonlDialect`                                            | Dialek peristiwa JSONL: `claude-stream-json` atau `gemini-stream-json`            |
| `liveSession`                                             | Mode proses CLI berumur panjang (`claude-stdio`)                                  |
| `input`                                                   | Transportasi prompt: `arg` atau `stdin`                                           |
| `maxPromptArgChars`                                       | Panjang maksimum prompt untuk mode `arg` sebelum beralih ke stdin            |
| `env` / `clearEnv`                                        | Variabel lingkungan tambahan yang akan disisipkan, atau nama yang akan dihapus sebelum peluncuran |
| `modelArg`                                                | Flag yang digunakan sebelum id model                                              |
| `modelAliases`                                            | Memetakan id model OpenClaw ke id asli CLI                                        |
| `sessionArg` / `sessionArgs`                              | Cara meneruskan id sesi                                                           |
| `sessionMode`                                             | `always`, `existing`, atau `none`                                                   |
| `sessionIdFields`                                         | Bidang JSON yang dibaca OpenClaw dari keluaran CLI                                |
| `systemPromptArg` / `systemPromptFileArg`                 | Transportasi prompt sistem                                                        |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transportasi penggantian konfigurasi untuk file prompt sistem (misalnya `-c`) |
| `systemPromptMode`                                        | `append` atau `replace`                                                             |
| `systemPromptWhen`                                        | `first`, `always`, atau `never`                                                     |
| `imageArg` / `imageMode`                                  | Flag path gambar dan cara meneruskan beberapa gambar (`repeat` atau `list`)         |
| `imagePathScope`                                          | Lokasi file gambar bertahap sebelum serah terima: `temp` atau `workspace`          |
| `serialize`                                               | Menjaga urutan eksekusi dengan backend yang sama                                  |
| `reseedFromRawTranscriptWhenUncompacted`                  | Mengaktifkan penyemaian ulang transkrip mentah terbatas sebelum compaction untuk pengaturan ulang sesi yang aman |
| `reliability.outputLimits`                                | Jumlah maksimum karakter/baris JSONL mentah yang dipertahankan untuk satu giliran CLI aktif (backend sesi aktif) |
| `reliability.watchdog`                                    | Penyesuaian batas waktu tanpa keluaran, terpisah untuk eksekusi baru dan yang dilanjutkan |

Pilih konfigurasi statis terkecil yang sesuai dengan CLI. Tambahkan callback
plugin hanya untuk perilaku yang benar-benar merupakan tanggung jawab backend.

## Hook backend lanjutan

`CliBackendPlugin` juga dapat mendefinisikan:

| Hook                               | Kegunaan                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Menulis ulang konfigurasi pengguna lama setelah penggabungan                  |
| `resolveExecutionArgs(ctx)`        | Menambahkan flag dalam cakupan permintaan seperti tingkat upaya berpikir atau isolasi pertanyaan sampingan |
| `prepareExecution(ctx)`            | Membuat jembatan autentikasi, konfigurasi, atau lingkungan sementara sebelum peluncuran |
| `transformSystemPrompt(ctx)`       | Menerapkan transformasi akhir prompt sistem khusus CLI                        |
| `textTransforms`                   | Penggantian prompt/keluaran dua arah                                          |
| `defaultAuthProfileId`             | Memprioritaskan profil autentikasi OpenClaw tertentu                          |
| `authEpochMode`                    | Menentukan cara perubahan autentikasi membatalkan sesi CLI yang tersimpan     |
| `nativeToolMode`                   | Menyatakan apakah alat asli tidak tersedia, selalu aktif, atau dapat dipilih host |
| `sideQuestionToolMode`             | Menyatakan alat asli yang dinonaktifkan untuk pertanyaan sampingan `/btw` |
| `bundleMcp` / `bundleMcpMode`      | Mengaktifkan jembatan alat MCP loopback milik OpenClaw                        |
| `ownsNativeCompaction`             | Backend mengelola compaction-nya sendiri — OpenClaw menangguhkannya           |
| `subscriptionAuthDispatch`         | Eksekusi tersemat yang diaktifkan dengan kredensial langganan dijalankan melalui backend ini |
| `runtimeArtifact`                  | Membatasi peluncur skrip ke seluruh struktur pohon paket bawaannya            |

Pertahankan kepemilikan hook ini pada penyedia. Jangan tambahkan cabang khusus
CLI ke inti ketika hook backend dapat merepresentasikan perilaku tersebut.

`prepareExecution(ctx)` menerima `ctx.contextTokenBudget`, yaitu batas token efektif
yang dipilih untuk eksekusi. Backend yang mengelola compaction asli dapat
memetakan anggaran tersebut ke kontrak peluncuran khusus CLI masing-masing.

`runtimeArtifact` dimiliki oleh plugin dan tidak dapat ditimpa oleh pengguna. Ini diperiksa
hanya ketika giliran inferensi langsung membuat atau memvalidasi ulang otoritas penyiapan terverifikasi;
operasi CLI normal tidak memerlukannya. Backend tanpa deklarasi ini tidak dapat
membuat otoritas penyiapan CLI terverifikasi. Deklarasi `bundled-package-tree` menyebutkan
pemilik `package.json` yang tepat dan mengharuskan titik masuk paket menjadi
perintah tersebut. OpenClaw melakukan hash terhadap pohon paket terinstal lengkap yang dibatasi, termasuk
dependensi bertingkat, dan gagal secara tertutup untuk symlink yang mengalihkan,
peluncur di luar paket yang dideklarasikan, deklarasi dependensi eksternal
yang diwajibkan, pohon yang terlalu besar, dan skrip yang tidak dikenal. Deklarasikan ini hanya ketika
pohon tersebut memuat implementasi inferensi lengkap; integrasi alat opsional
tidak membuat graf implementasi eksternal aman.

Jika backend yang sama juga menyertakan executable native mandiri, cantumkan
nama dasar kanonisnya di `nativeExecutableNames`. Perintah native lainnya tetap
tidak terverifikasi bahkan ketika pengguna menimpa perintah backend.

`ctx.executionMode` adalah `"agent"` untuk giliran normal dan `"side-question"` untuk
panggilan `/btw` sementara. Gunakan ini ketika CLI memerlukan flag sekali jalan yang berbeda,
seperti menonaktifkan alat native, persistensi sesi, atau perilaku melanjutkan untuk
BTW. Jika backend biasanya memiliki `nativeToolMode: "always-on"` tetapi
argv pertanyaan sampingnya menonaktifkan alat tersebut secara andal, tetapkan juga
`sideQuestionToolMode: "disabled"`; jika tidak, OpenClaw gagal secara tertutup ketika BTW
memerlukan operasi CLI tanpa alat.

Tetapkan `nativeToolMode: "selectable"` hanya ketika `resolveExecutionArgs` dapat menonaktifkan
setiap alat native backend untuk satu operasi. Untuk operasi terbatas tersebut,
`ctx.toolAvailability.native` adalah tuple kosong dan
`ctx.toolAvailability.mcp` adalah daftar izin MCP terisolasi-host yang tepat. Hook tersebut
harus mengganti flag alat yang bertentangan dan mengembalikan argv yang memberlakukan kedua nilai;
OpenClaw memanggilnya sekali dengan argv baru atau lanjutan yang final dan gagal secara tertutup ketika
backend tidak dapat memberlakukan pembatasan. Nama MCP dalam konteks ini aman
untuk disetujui otomatis hanya karena host telah membatasi konfigurasi MCP
yang dihasilkan pada server dan alat tersebut.

### `ownsNativeCompaction`: memilih keluar dari compaction OpenClaw

Jika backend Anda menjalankan agen yang memadatkan transkripnya **sendiri**, tetapkan
`ownsNativeCompaction: true` agar peringkas pengaman OpenClaw tidak pernah berjalan
terhadap sesinya - siklus hidup compaction CLI mengembalikan tanpa operasi dan
giliran dilanjutkan. `claude-cli` mendeklarasikannya karena Claude Code melakukan compaction
secara internal tanpa titik akhir harness. Sesi native-harness seperti Codex
tetap dirutekan ke titik akhir compaction harness masing-masing.

**Deklarasikan hanya ketika semua hal berikut terpenuhi**, atau sesi tertunda
yang melampaui anggaran dapat tetap melampaui anggaran atau menjadi kedaluwarsa (OpenClaw tidak lagi
menyelamatkannya):

- backend secara andal memadatkan atau membatasi transkripnya sendiri ketika mendekati
  jendelanya;
- backend mempertahankan sesi yang dapat dilanjutkan agar status yang telah dipadatkan bertahan antargiliran
  (misalnya `--resume` / `--session-id`);
- backend bukan sesi compaction native-harness - sesi yang cocok dengan `agentHarnessId`
  dirutekan ke titik akhir harness sebagai gantinya.

## Jembatan alat MCP

Backend CLI tidak menerima alat OpenClaw secara default. Jika CLI dapat menggunakan
konfigurasi MCP, ikut serta secara eksplisit:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

Mode jembatan yang didukung:

| Mode                     | Penggunaan                                                        |
| ------------------------ | ----------------------------------------------------------------- |
| `claude-config-file`     | CLI yang menerima file konfigurasi MCP                            |
| `codex-config-overrides` | CLI yang menerima penimpaan konfigurasi pada argv                  |
| `gemini-system-settings` | CLI yang membaca pengaturan MCP dari direktori pengaturan sistemnya |

Aktifkan jembatan hanya ketika CLI benar-benar dapat menggunakannya. Jika CLI memiliki
lapisan alat bawaan sendiri yang tidak dapat dinonaktifkan, tetapkan `nativeToolMode:
"always-on"` agar OpenClaw dapat gagal secara tertutup ketika pemanggil mengharuskan tidak ada alat
native. Jika CLI dapat menonaktifkan setiap alat native per operasi, gunakan `"selectable"` dengan
kontrak `resolveExecutionArgs` di atas.

## Konfigurasi pengguna

Pengguna dapat menimpa default backend apa pun:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Dokumentasikan penimpaan minimum yang kemungkinan diperlukan pengguna - biasanya hanya
`command` ketika biner berada di luar `PATH`.

## Verifikasi

Untuk plugin yang dibundel, tambahkan pengujian terfokus di sekitar builder dan registrasi
penyiapan, lalu jalankan jalur pengujian tertarget milik plugin:

```bash
pnpm test extensions/acme-cli
```

Untuk plugin lokal atau terinstal, verifikasi penemuan dan satu operasi model nyata:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Jika backend mendukung gambar atau MCP, tambahkan smoke test langsung yang membuktikan jalur
tersebut dengan CLI nyata. Jangan mengandalkan inspeksi statis untuk perilaku prompt, gambar,
MCP, atau pelanjutan sesi.

## Daftar periksa

<Check>`package.json` memiliki `openclaw.extensions` dan entri runtime yang telah dibangun untuk paket yang dipublikasikan</Check>
<Check>`openclaw.plugin.json` mendeklarasikan `cliBackends` dan `activation.onStartup` yang disengaja</Check>
<Check>`setup.cliBackends` tersedia ketika penyiapan/penemuan model harus melihat backend dalam keadaan dingin</Check>
<Check>`api.registerCliBackend(...)` menggunakan id backend yang sama dengan manifes</Check>
<Check>Penimpaan pengguna di bawah `agents.defaults.cliBackends.<id>` tetap berlaku</Check>
<Check>Pengaturan sesi, prompt sistem, gambar, dan pengurai keluaran sesuai dengan kontrak CLI nyata</Check>
<Check>Pengujian tertarget dan setidaknya satu smoke test CLI langsung membuktikan jalur backend</Check>

## Terkait

- [Backend CLI](/id/gateway/cli-backends) - konfigurasi pengguna dan perilaku runtime
- [Membangun plugin](/id/plugins/building-plugins) - dasar-dasar paket dan manifes
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview) - referensi API registrasi
- [Manifes plugin](/id/plugins/manifest) - `cliBackends` dan deskriptor penyiapan
- [Harness agen](/id/plugins/sdk-agent-harness) - runtime agen eksternal lengkap
