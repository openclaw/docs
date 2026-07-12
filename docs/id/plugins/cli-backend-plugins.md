---
read_when:
    - Anda sedang membuat Plugin backend CLI AI lokal
    - Anda ingin mendaftarkan backend untuk referensi model seperti acme-cli/model
    - Anda perlu memetakan CLI pihak ketiga ke runner fallback teks OpenClaw
sidebarTitle: CLI backend plugins
summary: Buat plugin yang mendaftarkan backend CLI AI lokal
title: Membangun plugin backend CLI
x-i18n:
    generated_at: "2026-07-12T14:23:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin backend CLI memungkinkan OpenClaw memanggil CLI AI lokal sebagai backend inferensi teks. Backend muncul sebagai prefiks penyedia dalam referensi model:

```text
acme-cli/acme-large
```

Gunakan backend CLI ketika integrasi upstream sudah tersedia sebagai perintah lokal, ketika CLI mengelola status login lokal, atau sebagai fallback ketika penyedia API tidak tersedia.

<Info>
  Jika layanan upstream menyediakan API model HTTP biasa, buat
  [plugin penyedia](/id/plugins/sdk-provider-plugins) sebagai gantinya. Jika runtime upstream
  mengelola sesi agen lengkap, peristiwa alat, Compaction, atau status tugas
  latar belakang, gunakan [harness agen](/id/plugins/sdk-agent-harness).
</Info>

## Yang dikelola plugin

Plugin backend CLI memiliki tiga kontrak:

| Kontrak              | File                   | Tujuan                                                        |
| -------------------- | ---------------------- | ------------------------------------------------------------- |
| Entri paket          | `package.json`         | Mengarahkan OpenClaw ke modul runtime plugin                   |
| Kepemilikan manifes  | `openclaw.plugin.json` | Mendeklarasikan ID backend sebelum runtime dimuat              |
| Pendaftaran runtime  | `index.ts`             | Memanggil `api.registerCliBackend(...)` dengan nilai baku perintah |

Manifes merupakan metadata penemuan: manifes tidak menjalankan CLI atau mendaftarkan
perilaku runtime. Perilaku runtime dimulai ketika entri plugin memanggil
`api.registerCliBackend(...)`.

## Plugin backend minimal

<Steps>
  <Step title="Create package metadata">
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

    Paket yang dipublikasikan harus menyertakan file runtime JavaScript yang telah dibangun. Jika entri
    sumber Anda adalah `./src/index.ts`, tambahkan `openclaw.runtimeExtensions` yang menunjuk ke
    padanan JavaScript hasil pembangunan. Lihat [Titik entri](/id/plugins/sdk-entrypoints).

  </Step>

  <Step title="Declare backend ownership">
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

    `cliBackends` adalah daftar kepemilikan runtime; daftar ini memungkinkan OpenClaw memuat otomatis
    plugin ketika konfigurasi atau pemilihan model menyebutkan `acme-cli/...`.

    `setup.cliBackends` adalah permukaan penyiapan yang mengutamakan deskriptor. Tambahkan ini ketika
    penemuan model, orientasi awal, atau status harus mengenali backend
    tanpa memuat runtime plugin. Gunakan `requiresRuntime: false` hanya ketika
    deskriptor statis tersebut sudah mencukupi untuk penyiapan.

  </Step>

  <Step title="Register the backend">
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

    ID backend harus cocok dengan entri `cliBackends` dalam manifes.
    `config` yang didaftarkan hanyalah nilai baku; konfigurasi pengguna di bawah
    `agents.defaults.cliBackends.acme-cli` digabungkan menimpanya saat runtime.

  </Step>
</Steps>

## Bentuk konfigurasi

`CliBackendConfig` menjelaskan cara OpenClaw harus meluncurkan dan mengurai CLI:

| Bidang                                                    | Penggunaan                                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `command`                                                 | Nama biner atau jalur perintah absolut                                             |
| `args`                                                    | Argumen argv dasar untuk eksekusi baru                                             |
| `resumeArgs`                                              | Argumen argv alternatif untuk sesi yang dilanjutkan; mendukung `{sessionId}`       |
| `output` / `resumeOutput`                                 | Pengurai: `json`, `jsonl`, atau `text`                                             |
| `jsonlDialect`                                            | Dialek peristiwa JSONL: `claude-stream-json` atau `gemini-stream-json`             |
| `liveSession`                                             | Mode proses CLI berumur panjang (`claude-stdio`)                                   |
| `input`                                                   | Transportasi prompt: `arg` atau `stdin`                                            |
| `maxPromptArgChars`                                       | Panjang maksimum prompt untuk mode `arg` sebelum beralih ke stdin                  |
| `env` / `clearEnv`                                        | Variabel lingkungan tambahan yang disuntikkan, atau nama yang dihapus sebelum peluncuran |
| `modelArg`                                                | Flag yang digunakan sebelum ID model                                               |
| `modelAliases`                                            | Memetakan ID model OpenClaw ke ID asli CLI                                         |
| `sessionArg` / `sessionArgs`                              | Cara meneruskan ID sesi                                                            |
| `sessionMode`                                             | `always`, `existing`, atau `none`                                                  |
| `sessionIdFields`                                         | Bidang JSON yang dibaca OpenClaw dari keluaran CLI                                 |
| `systemPromptArg` / `systemPromptFileArg`                 | Transportasi prompt sistem                                                        |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Transportasi penggantian konfigurasi untuk file prompt sistem (misalnya `-c`)      |
| `systemPromptMode`                                        | `append` atau `replace`                                                            |
| `systemPromptWhen`                                        | `first`, `always`, atau `never`                                                    |
| `imageArg` / `imageMode`                                  | Flag jalur gambar dan cara meneruskan beberapa gambar (`repeat` atau `list`)       |
| `imagePathScope`                                          | Lokasi file gambar yang disiapkan sebelum diserahkan: `temp` atau `workspace`      |
| `serialize`                                               | Menjaga urutan eksekusi pada backend yang sama                                     |
| `reseedFromRawTranscriptWhenUncompacted`                  | Mengaktifkan pengisian ulang terbatas dari transkrip mentah sebelum Compaction untuk pengaturan ulang sesi yang aman |
| `reliability.outputLimits`                                | Jumlah maksimum karakter/baris JSONL mentah yang dipertahankan untuk satu giliran CLI langsung (backend sesi langsung) |
| `reliability.watchdog`                                    | Penyesuaian batas waktu tanpa keluaran, terpisah untuk eksekusi baru dan lanjutan  |

Utamakan konfigurasi statis terkecil yang sesuai dengan CLI. Tambahkan callback plugin
hanya untuk perilaku yang benar-benar menjadi tanggung jawab backend.

## Hook backend lanjutan

`CliBackendPlugin` juga dapat mendefinisikan:

| Hook                               | Penggunaan                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Menulis ulang konfigurasi pengguna lama setelah penggabungan                  |
| `resolveExecutionArgs(ctx)`        | Menambahkan flag dalam cakupan permintaan, seperti tingkat pemikiran atau isolasi pertanyaan sampingan |
| `prepareExecution(ctx)`            | Membuat jembatan autentikasi atau konfigurasi sementara sebelum peluncuran    |
| `transformSystemPrompt(ctx)`       | Menerapkan transformasi akhir prompt sistem khusus CLI                        |
| `textTransforms`                   | Penggantian prompt/keluaran dua arah                                          |
| `defaultAuthProfileId`             | Mengutamakan profil autentikasi OpenClaw tertentu                             |
| `authEpochMode`                    | Menentukan bagaimana perubahan autentikasi membatalkan sesi CLI tersimpan    |
| `nativeToolMode`                   | Mendeklarasikan apakah alat asli tidak tersedia, selalu aktif, atau dapat dipilih host |
| `sideQuestionToolMode`             | Mendeklarasikan alat asli yang dinonaktifkan untuk pertanyaan sampingan `/btw` |
| `bundleMcp` / `bundleMcpMode`      | Mengaktifkan jembatan alat MCP local loopback milik OpenClaw                  |
| `ownsNativeCompaction`             | Backend mengelola Compaction-nya sendiri - OpenClaw menangguhkannya           |
| `runtimeArtifact`                  | Membatasi peluncur skrip pada seluruh pohon paket bundelnya                   |

Pertahankan kepemilikan hook ini pada penyedia. Jangan menambahkan cabang khusus CLI ke inti ketika
hook backend dapat mengekspresikan perilaku tersebut.

`runtimeArtifact` dimiliki plugin dan tidak dapat ditimpa oleh pengguna. Nilai ini diperiksa
hanya ketika satu giliran inferensi langsung membuat atau memvalidasi ulang otoritas penyiapan terverifikasi;
eksekusi CLI normal tidak memerlukannya. Backend tanpa deklarasi ini tidak dapat
membuat otoritas penyiapan CLI terverifikasi. Deklarasi `bundled-package-tree` menyebutkan
pemilik `package.json` yang tepat dan mewajibkan titik entri paket menjadi
perintahnya. OpenClaw melakukan hash terhadap seluruh pohon paket terpasang yang dibatasi, termasuk
dependensi bertingkat, dan menolak secara tertutup symlink yang mengalihkan,
peluncur di luar paket yang dideklarasikan, deklarasi dependensi eksternal
yang diwajibkan, pohon yang terlalu besar, dan skrip yang tidak dikenal. Deklarasikan ini hanya ketika
pohon tersebut memuat implementasi inferensi lengkap; integrasi alat opsional
tidak membuat graf implementasi eksternal menjadi aman.

Jika backend yang sama juga menyertakan executable asli mandiri, cantumkan
nama dasar kanonisnya dalam `nativeExecutableNames`. Perintah asli lainnya tetap
tidak terverifikasi meskipun pengguna menimpa perintah backend.

`ctx.executionMode` bernilai `"agent"` untuk giliran normal dan `"side-question"` untuk
panggilan `/btw` sementara. Gunakan ini ketika CLI memerlukan flag sekali jalan yang berbeda,
seperti menonaktifkan alat native, persistensi sesi, atau perilaku melanjutkan sesi untuk
BTW. Jika backend biasanya memiliki `nativeToolMode: "always-on"` tetapi argv
pertanyaan sampingnya secara andal menonaktifkan alat tersebut, tetapkan juga
`sideQuestionToolMode: "disabled"`; jika tidak, OpenClaw akan gagal secara tertutup ketika BTW
memerlukan eksekusi CLI tanpa alat.

Tetapkan `nativeToolMode: "selectable"` hanya jika `resolveExecutionArgs` dapat menonaktifkan
setiap alat native backend untuk satu eksekusi. Untuk eksekusi terbatas tersebut,
`ctx.toolAvailability.native` adalah tuple kosong dan
`ctx.toolAvailability.mcp` adalah daftar izin MCP terisolasi host yang persis. Hook tersebut
harus mengganti flag alat yang berkonflik dan mengembalikan argv yang memberlakukan kedua nilai;
OpenClaw memanggilnya sekali dengan argv baru atau lanjutan final dan gagal secara tertutup ketika
backend tidak dapat memberlakukan pembatasan. Nama MCP dalam konteks ini aman
untuk disetujui otomatis hanya karena host telah membatasi konfigurasi MCP yang dihasilkan
ke server dan alat tersebut.

### `ownsNativeCompaction`: tidak menggunakan Compaction OpenClaw

Jika backend Anda menjalankan agen yang memadatkan transkripnya **sendiri**, tetapkan
`ownsNativeCompaction: true` agar peringkas pengaman OpenClaw tidak pernah dijalankan
terhadap sesinya—siklus hidup Compaction CLI tidak melakukan apa pun dan
giliran berlanjut. `claude-cli` mendeklarasikannya karena Claude Code melakukan Compaction
secara internal tanpa endpoint harness. Sesi harness native seperti Codex
tetap diarahkan ke endpoint Compaction harness masing-masing.

**Deklarasikan hanya jika semua hal berikut terpenuhi**, atau sesi tertunda
yang melebihi anggaran dapat tetap melebihi anggaran atau menjadi kedaluwarsa (OpenClaw tidak lagi
menyelamatkannya):

- backend secara andal melakukan Compaction atau membatasi transkripnya sendiri saat mendekati
  jendelanya;
- backend mempertahankan sesi yang dapat dilanjutkan agar status hasil Compaction bertahan antar-giliran
  (misalnya `--resume` / `--session-id`);
- sesi tersebut bukan sesi Compaction harness native—sesi dengan `agentHarnessId` yang cocok
  diarahkan ke endpoint harness.

## Jembatan alat MCP

Backend CLI tidak menerima alat OpenClaw secara default. Jika CLI dapat menggunakan
konfigurasi MCP, aktifkan secara eksplisit:

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
| `claude-config-file`     | CLI yang menerima berkas konfigurasi MCP                          |
| `codex-config-overrides` | CLI yang menerima penggantian konfigurasi pada argv               |
| `gemini-system-settings` | CLI yang membaca pengaturan MCP dari direktori pengaturan sistemnya |

Aktifkan jembatan hanya jika CLI benar-benar dapat menggunakannya. Jika CLI memiliki
lapisan alat bawaan sendiri yang tidak dapat dinonaktifkan, tetapkan `nativeToolMode:
"always-on"` agar OpenClaw dapat gagal secara tertutup ketika pemanggil mengharuskan tidak adanya alat
native. Jika CLI dapat menonaktifkan setiap alat native per eksekusi, gunakan `"selectable"` dengan
kontrak `resolveExecutionArgs` di atas.

## Konfigurasi pengguna

Pengguna dapat mengganti default backend apa pun:

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

Dokumentasikan penggantian minimum yang kemungkinan diperlukan pengguna—biasanya hanya
`command` ketika biner berada di luar `PATH`.

## Verifikasi

Untuk Plugin yang dibundel, tambahkan pengujian terfokus pada builder dan registrasi
penyiapan, lalu jalankan jalur pengujian tertarget Plugin tersebut:

```bash
pnpm test extensions/acme-cli
```

Untuk Plugin lokal atau terinstal, verifikasi penemuan dan satu eksekusi model nyata:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Jika backend mendukung gambar atau MCP, tambahkan uji asap langsung yang membuktikan jalur
tersebut dengan CLI nyata. Jangan mengandalkan pemeriksaan statis untuk perilaku prompt, gambar,
MCP, atau pelanjutan sesi.

## Daftar periksa

<Check>`package.json` memiliki `openclaw.extensions` dan entri runtime hasil build untuk paket yang dipublikasikan</Check>
<Check>`openclaw.plugin.json` mendeklarasikan `cliBackends` dan `activation.onStartup` yang disengaja</Check>
<Check>`setup.cliBackends` tersedia ketika penyiapan/penemuan model harus dapat melihat backend dalam keadaan dingin</Check>
<Check>`api.registerCliBackend(...)` menggunakan id backend yang sama dengan manifes</Check>
<Check>Penggantian pengguna di bawah `agents.defaults.cliBackends.<id>` tetap diutamakan</Check>
<Check>Pengaturan sesi, prompt sistem, gambar, dan parser keluaran sesuai dengan kontrak CLI nyata</Check>
<Check>Pengujian tertarget dan setidaknya satu uji asap CLI langsung membuktikan jalur backend</Check>

## Terkait

- [Backend CLI](/id/gateway/cli-backends) - konfigurasi pengguna dan perilaku runtime
- [Membangun Plugin](/id/plugins/building-plugins) - dasar-dasar paket dan manifes
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview) - referensi API registrasi
- [Manifes Plugin](/id/plugins/manifest) - `cliBackends` dan deskriptor penyiapan
- [Harness agen](/id/plugins/sdk-agent-harness) - runtime agen eksternal lengkap
