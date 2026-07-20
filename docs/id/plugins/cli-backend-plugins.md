---
read_when:
    - Anda sedang membangun plugin backend CLI AI lokal
    - Anda ingin mendaftarkan backend untuk referensi model seperti acme-cli/model
    - Anda perlu memetakan CLI pihak ketiga ke runner fallback teks OpenClaw
sidebarTitle: CLI backend plugins
summary: Buat plugin yang mendaftarkan backend CLI AI lokal
title: Membangun plugin backend CLI
x-i18n:
    generated_at: "2026-07-20T03:52:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 08edceae9afd133684094b6febc6ca9b0ab89ce1168474f0a4fabd15b5ac4200
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin backend CLI memungkinkan OpenClaw memanggil CLI AI lokal sebagai backend
inferensi teks. Backend muncul sebagai prefiks penyedia dalam referensi model:

```text
acme-cli/acme-large
```

Gunakan backend CLI ketika integrasi upstream sudah tersedia sebagai perintah
lokal, ketika CLI mengelola status login lokal, atau sebagai fallback ketika
penyedia API tidak tersedia.

<Info>
  Jika layanan upstream menyediakan API model HTTP biasa, buat
  [plugin penyedia](/id/plugins/sdk-provider-plugins) sebagai gantinya. Jika runtime
  upstream mengelola sesi agen lengkap, peristiwa alat, compaction, atau status
  tugas latar belakang, gunakan [harness agen](/id/plugins/sdk-agent-harness).
</Info>

## Yang dikelola plugin

Plugin backend CLI memiliki tiga kontrak:

| Kontrak              | File                   | Tujuan                                                    |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Entri paket          | `package.json`         | Mengarahkan OpenClaw ke modul runtime plugin              |
| Kepemilikan manifes  | `openclaw.plugin.json` | Mendeklarasikan id backend sebelum runtime dimuat         |
| Pendaftaran runtime  | `index.ts`             | Memanggil `api.registerCliBackend(...)` dengan default perintah |

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

    Paket yang dipublikasikan harus menyertakan file runtime JavaScript yang
    telah dibangun. Jika entri sumber Anda adalah `./src/index.ts`, tambahkan
    `openclaw.runtimeExtensions` yang menunjuk ke padanan JavaScript hasil pembangunan.
    Lihat [Titik masuk](/id/plugins/sdk-entrypoints).

  </Step>

  <Step title="Deklarasikan kepemilikan backend">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
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
    OpenClaw memuat otomatis plugin ketika konfigurasi atau pemilihan model
    menyebutkan `acme-cli/...`.

    `setup.cliBackends` adalah permukaan penyiapan berbasis deskriptor. Tambahkan
    ini ketika penemuan model, orientasi awal, atau status harus mengenali
    backend tanpa memuat runtime plugin. Gunakan `requiresRuntime: false` hanya ketika
    deskriptor statis tersebut memadai untuk penyiapan.

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
    `config` yang didaftarkan hanya merupakan default; konfigurasi
    pengguna di bawah `agents.defaults.cliBackends.acme-cli` digabungkan di atasnya saat runtime.

  </Step>
</Steps>

## Bentuk konfigurasi

`CliBackendConfig` menjelaskan cara OpenClaw meluncurkan dan mengurai CLI:

| Bidang                                                    | Penggunaan                                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | Nama biner atau jalur perintah absolut                                            |
| `args`                                                    | Argv dasar untuk eksekusi baru                                                    |
| `resumeArgs`                                              | Argv alternatif untuk sesi yang dilanjutkan; mendukung `{sessionId}`              |
| `output` / `resumeOutput`                                 | Pengurai: `json`, `jsonl`, atau `text`                                          |
| `jsonlDialect`                                            | Dialek peristiwa JSONL: `claude-stream-json` atau `gemini-stream-json`           |
| `liveSession`                                             | Mode proses CLI berumur panjang (`claude-stdio`)                                  |
| `input`                                                   | Transport prompt: `arg` atau `stdin`                                           |
| `maxPromptArgChars`                                       | Panjang maksimum prompt untuk mode `arg` sebelum beralih ke stdin            |
| `env` / `clearEnv`                                        | Variabel lingkungan tambahan yang akan disisipkan, atau nama yang akan dihapus sebelum peluncuran |
| `modelArg`                                                | Flag yang digunakan sebelum id model                                              |
| `modelAliases`                                            | Memetakan id model OpenClaw ke id asli CLI                                        |
| `sessionArg` / `sessionArgs`                              | Cara meneruskan id sesi                                                           |
| `sessionMode`                                             | `always`, `existing`, atau `none`                                                   |
| `sessionIdFields`                                         | Bidang JSON yang dibaca OpenClaw dari output CLI                                  |
| `systemPromptArg` / `systemPromptFileArg`                 | Transport prompt sistem                                                           |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transport penggantian konfigurasi untuk file prompt sistem (misalnya `-c`) |
| `systemPromptMode`                                        | `append` atau `replace`                                                             |
| `systemPromptWhen`                                        | `first`, `always`, atau `never`                                                     |
| `imageArg` / `imageMode`                                  | Flag jalur gambar dan cara meneruskan beberapa gambar (`repeat` atau `list`) |
| `imagePathScope`                                          | Lokasi file gambar yang disiapkan sebelum serah terima: `temp` atau `workspace` |
| `serialize`                                               | Menjaga urutan eksekusi pada backend yang sama                                    |
| `reseedFromRawTranscriptWhenUncompacted`                  | Mengaktifkan penyemaian ulang transkrip mentah terbatas sebelum compaction untuk pengaturan ulang sesi yang aman |
| `reliability.watchdog`                                    | Penyesuaian batas waktu tanpa output, terpisah untuk eksekusi baru dan yang dilanjutkan |

Utamakan konfigurasi statis terkecil yang sesuai dengan CLI. Tambahkan callback
plugin hanya untuk perilaku yang benar-benar merupakan tanggung jawab backend.

## Hook backend lanjutan

`CliBackendPlugin` juga dapat mendefinisikan:

| Hook                               | Penggunaan                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Menulis ulang konfigurasi pengguna lama setelah penggabungan                |
| `resolveExecutionArgs(ctx)`        | Menambahkan flag cakupan permintaan seperti intensitas penalaran atau isolasi pertanyaan sampingan |
| `prepareExecution(ctx)`            | Membuat jembatan autentikasi, konfigurasi, atau lingkungan sementara sebelum peluncuran |
| `transformSystemPrompt(ctx)`       | Menerapkan transformasi akhir prompt sistem khusus CLI                     |
| `textTransforms`                   | Penggantian prompt/output dua arah                                           |
| `defaultAuthProfileId`             | Mengutamakan profil autentikasi OpenClaw tertentu                            |
| `authEpochMode`                    | Menentukan cara perubahan autentikasi membatalkan sesi CLI yang tersimpan   |
| `nativeToolMode`                   | Mendeklarasikan apakah alat native tidak tersedia, selalu aktif, atau dapat dipilih host |
| `sideQuestionToolMode`             | Mendeklarasikan alat native yang dinonaktifkan untuk pertanyaan sampingan `/btw` |
| `bundleMcp` / `bundleMcpMode`      | Mengaktifkan jembatan alat MCP loopback OpenClaw                            |
| `ownsNativeCompaction`             | Backend mengelola compaction sendiri—OpenClaw menangguhkannya                |
| `subscriptionAuthDispatch`         | Eksekusi tertanam yang diaktifkan dengan kredensial langganan dijalankan melalui backend ini |
| `runtimeArtifact`                  | Membatasi peluncur skrip pada seluruh struktur paket bawaannya               |

Pertahankan kepemilikan hook ini pada penyedia. Jangan tambahkan cabang khusus
CLI ke inti ketika hook backend dapat mengekspresikan perilaku tersebut.

`prepareExecution(ctx)` menerima `ctx.contextTokenBudget`, batas token efektif yang dipilih
untuk eksekusi. Backend yang mengelola compaction native dapat memetakan
anggaran tersebut ke kontrak peluncuran khusus CLI mereka.

`runtimeArtifact` dimiliki oleh plugin dan tidak dapat ditimpa oleh pengguna. Ini diperiksa
hanya ketika giliran inferensi langsung membuat atau memvalidasi ulang otoritas penyiapan terverifikasi;
eksekusi CLI normal tidak memerlukannya. Backend tanpa deklarasi ini tidak dapat
membuat otoritas penyiapan CLI terverifikasi. Deklarasi `bundled-package-tree` menyebutkan
pemilik `package.json` yang tepat dan mengharuskan titik masuk paket menjadi
perintah tersebut. OpenClaw melakukan hash pada keseluruhan pohon paket terinstal yang dibatasi, termasuk
dependensi bertingkat, dan gagal secara tertutup untuk symlink yang mengalihkan,
peluncur di luar paket yang dideklarasikan, deklarasi dependensi eksternal
yang diwajibkan, pohon yang terlalu besar, dan skrip yang tidak dikenal. Deklarasikan ini hanya ketika
pohon tersebut berisi implementasi inferensi lengkap; integrasi alat opsional
tidak membuat graf implementasi eksternal menjadi aman.

Jika backend yang sama juga menyediakan executable native mandiri, cantumkan
nama dasar kanonisnya di `nativeExecutableNames`. Perintah native lainnya tetap
tidak terverifikasi meskipun pengguna menimpa perintah backend.

`ctx.executionMode` adalah `"agent"` untuk giliran normal dan `"side-question"` untuk
panggilan `/btw` sementara. Gunakan ini ketika CLI memerlukan flag sekali jalan yang berbeda,
seperti menonaktifkan alat native, persistensi sesi, atau perilaku melanjutkan untuk
BTW. Jika backend biasanya memiliki `nativeToolMode: "always-on"`, tetapi argv
pertanyaan sampingannya secara andal menonaktifkan alat tersebut, tetapkan juga
`sideQuestionToolMode: "disabled"`; jika tidak, OpenClaw gagal secara tertutup ketika BTW
memerlukan eksekusi CLI tanpa alat.

Tetapkan `nativeToolMode: "selectable"` hanya ketika `resolveExecutionArgs` dapat menonaktifkan
setiap alat native backend untuk satu eksekusi. Untuk eksekusi terbatas tersebut,
`ctx.toolAvailability.native` adalah tuple kosong dan
`ctx.toolAvailability.mcp` adalah daftar izin MCP terisolasi-host yang tepat. Hook tersebut
harus mengganti flag alat yang berkonflik dan mengembalikan argv yang memberlakukan kedua nilai;
OpenClaw memanggilnya sekali dengan argv baru atau lanjutkan final dan gagal secara tertutup ketika
backend tidak dapat memberlakukan pembatasan tersebut. Nama MCP dalam konteks ini aman
untuk disetujui otomatis hanya karena host telah membatasi konfigurasi MCP yang dihasilkan
ke server dan alat tersebut.

### `ownsNativeCompaction`: memilih keluar dari compaction OpenClaw

Jika backend Anda menjalankan agen yang memadatkan transkripnya **sendiri**, tetapkan
`ownsNativeCompaction: true` agar peringkas pengaman OpenClaw tidak pernah dijalankan
terhadap sesinya—siklus hidup compaction CLI mengembalikan tanpa operasi dan
giliran berlanjut. `claude-cli` mendeklarasikannya karena Claude Code melakukan compaction
secara internal tanpa endpoint harness. Sesi harness native seperti Codex
tetap diarahkan ke endpoint compaction harness-nya.

**Deklarasikan hanya ketika semua ketentuan berikut terpenuhi**, atau sesi tertunda
yang melampaui anggaran dapat tetap melampaui anggaran atau menjadi kedaluwarsa (OpenClaw tidak lagi
menyelamatkannya):

- backend secara andal melakukan compaction atau membatasi transkripnya sendiri ketika mendekati
  jendelanya;
- backend mempertahankan sesi yang dapat dilanjutkan agar status yang telah dipadatkan bertahan antar-giliran
  (misalnya `--resume` / `--session-id`);
- backend bukan sesi compaction harness native—sesi yang cocok dengan `agentHarnessId`
  akan diarahkan ke endpoint harness.

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
| `codex-config-overrides` | CLI yang menerima penimpaan konfigurasi pada argv                 |
| `gemini-system-settings` | CLI yang membaca pengaturan MCP dari direktori pengaturan sistemnya |

Aktifkan jembatan hanya ketika CLI benar-benar dapat menggunakannya. Jika CLI memiliki
lapisan alat bawaannya sendiri yang tidak dapat dinonaktifkan, tetapkan `nativeToolMode:
"always-on"` agar OpenClaw dapat gagal secara tertutup ketika pemanggil mengharuskan tidak ada alat
native. Jika CLI dapat menonaktifkan setiap alat native per eksekusi, gunakan `"selectable"` dengan
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

Dokumentasikan penimpaan minimum yang kemungkinan diperlukan pengguna—biasanya hanya
`command` ketika biner berada di luar `PATH`.

## Verifikasi

Untuk plugin terbundel, tambahkan pengujian terfokus di sekitar builder dan registrasi
penyiapan, lalu jalankan jalur pengujian tertarget plugin:

```bash
pnpm test extensions/acme-cli
```

Untuk plugin lokal atau terinstal, verifikasi penemuan dan satu eksekusi model nyata:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "balas persis: backend ok" --model acme-cli/acme-large
```

Jika backend mendukung gambar atau MCP, tambahkan smoke test langsung yang membuktikan jalur
tersebut dengan CLI nyata. Jangan mengandalkan pemeriksaan statis untuk perilaku prompt, gambar,
MCP, atau pelanjutan sesi.

## Daftar periksa

<Check>`package.json` memiliki `openclaw.extensions` dan entri runtime hasil build untuk paket yang dipublikasikan</Check>
<Check>`openclaw.plugin.json` mendeklarasikan `cliBackends` dan `activation.onStartup` yang disengaja</Check>
<Check>`setup.cliBackends` tersedia ketika penyiapan/penemuan model harus melihat backend dalam keadaan dingin</Check>
<Check>`api.registerCliBackend(...)` menggunakan id backend yang sama dengan manifes</Check>
<Check>Penimpaan pengguna di bawah `agents.defaults.cliBackends.<id>` tetap diutamakan</Check>
<Check>Pengaturan sesi, prompt sistem, gambar, dan parser output sesuai dengan kontrak CLI nyata</Check>
<Check>Pengujian tertarget dan setidaknya satu smoke test CLI langsung membuktikan jalur backend</Check>

## Terkait

- [Backend CLI](/id/gateway/cli-backends) - konfigurasi pengguna dan perilaku runtime
- [Membangun plugin](/id/plugins/building-plugins) - dasar-dasar paket dan manifes
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview) - referensi API registrasi
- [Manifes plugin](/id/plugins/manifest) - `cliBackends` dan deskriptor penyiapan
- [Harness agen](/id/plugins/sdk-agent-harness) - runtime agen eksternal lengkap
