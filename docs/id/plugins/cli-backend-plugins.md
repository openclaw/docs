---
read_when:
    - Anda sedang membangun Plugin backend CLI AI lokal
    - Anda ingin mendaftarkan backend untuk ref model seperti acme-cli/model
    - Anda perlu memetakan CLI pihak ketiga ke runner fallback teks OpenClaw
sidebarTitle: CLI backend plugins
summary: Buat Plugin yang mendaftarkan backend CLI AI lokal
title: Membangun plugin backend CLI
x-i18n:
    generated_at: "2026-06-27T17:44:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin backend CLI memungkinkan OpenClaw memanggil CLI AI lokal sebagai backend
inferensi teks. Backend muncul sebagai prefiks provider dalam ref model:

```text
acme-cli/acme-large
```

Gunakan backend CLI ketika integrasi upstream sudah diekspos sebagai perintah
lokal, ketika CLI memiliki status login lokal, atau ketika CLI berguna sebagai
fallback jika provider API tidak tersedia.

<Info>
  Jika layanan upstream mengekspos API model HTTP biasa, tulis
  [Plugin provider](/id/plugins/sdk-provider-plugins) sebagai gantinya. Jika runtime
  upstream memiliki sesi agen lengkap, peristiwa tool, Compaction, atau status
  tugas latar belakang, gunakan [harness agen](/id/plugins/sdk-agent-harness).
</Info>

## Yang dimiliki Plugin

Plugin backend CLI memiliki tiga kontrak:

| Kontrak              | File                   | Tujuan                                                    |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Entri paket          | `package.json`         | Mengarahkan OpenClaw ke modul runtime Plugin              |
| Kepemilikan manifest | `openclaw.plugin.json` | Mendeklarasikan id backend sebelum runtime dimuat         |
| Registrasi runtime   | `index.ts`             | Memanggil `api.registerCliBackend(...)` dengan default perintah |

Manifest adalah metadata discovery. Manifest tidak mengeksekusi CLI dan tidak
mendaftarkan perilaku runtime. Perilaku runtime dimulai ketika entri Plugin
memanggil `api.registerCliBackend(...)`.

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

    Paket yang dipublikasikan harus menyertakan file runtime JavaScript yang
    sudah dibangun. Jika entri sumber Anda adalah `./src/index.ts`, tambahkan
    `openclaw.runtimeExtensions` yang menunjuk ke peer JavaScript hasil build.
    Lihat [Titik entri](/id/plugins/sdk-entrypoints).

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

    `cliBackends` adalah daftar kepemilikan runtime. Ini memungkinkan OpenClaw
    memuat Plugin secara otomatis ketika konfigurasi atau pemilihan model
    menyebut `acme-cli/...`.

    `setup.cliBackends` adalah permukaan setup berbasis descriptor terlebih
    dahulu. Tambahkan ini ketika discovery model, onboarding, atau status perlu
    mengenali backend tanpa memuat runtime Plugin. Gunakan `requiresRuntime:
    false` hanya ketika descriptor statis tersebut cukup untuk setup.

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

    Id backend harus cocok dengan entri `cliBackends` di manifest. `config` yang
    didaftarkan hanyalah default; konfigurasi pengguna di bawah
    `agents.defaults.cliBackends.acme-cli` digabungkan di atasnya saat runtime.

  </Step>
</Steps>

## Bentuk konfigurasi

`CliBackendConfig` menjelaskan bagaimana OpenClaw harus meluncurkan dan
mengurai CLI:

| Field                                     | Use                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Nama binary atau path perintah absolut                      |
| `args`                                    | argv dasar untuk run baru                                   |
| `resumeArgs`                              | argv alternatif untuk sesi yang dilanjutkan; mendukung `{sessionId}` |
| `output` / `resumeOutput`                 | Parser: `json`, `jsonl`, atau `text`                        |
| `input`                                   | Transport prompt: `arg` atau `stdin`                        |
| `modelArg`                                | Flag yang digunakan sebelum id model                        |
| `modelAliases`                            | Memetakan id model OpenClaw ke id native CLI                |
| `sessionArg` / `sessionArgs`              | Cara meneruskan id sesi                                     |
| `sessionMode`                             | `always`, `existing`, atau `none`                           |
| `sessionIdFields`                         | Field JSON yang dibaca OpenClaw dari output CLI             |
| `systemPromptArg` / `systemPromptFileArg` | Transport system prompt                                     |
| `systemPromptWhen`                        | `first`, `always`, atau `never`                             |
| `imageArg` / `imageMode`                  | Dukungan path gambar                                        |
| `serialize`                               | Menjaga run backend yang sama tetap berurutan               |
| `reliability.watchdog`                    | Penyetelan timeout tanpa output                             |

Pilih konfigurasi statis terkecil yang cocok dengan CLI. Tambahkan callback
Plugin hanya untuk perilaku yang benar-benar menjadi milik backend.

## Hook backend lanjutan

`CliBackendPlugin` juga dapat mendefinisikan:

| Hook                               | Use                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Menulis ulang konfigurasi pengguna lama setelah penggabungan                |
| `resolveExecutionArgs(ctx)`        | Menambahkan flag berbasis request seperti effort berpikir atau isolasi pertanyaan sampingan |
| `prepareExecution(ctx)`            | Membuat bridge autentikasi atau konfigurasi sementara sebelum peluncuran    |
| `transformSystemPrompt(ctx)`       | Menerapkan transformasi system prompt khusus CLI terakhir                   |
| `textTransforms`                   | Penggantian prompt/output dua arah                                          |
| `defaultAuthProfileId`             | Mengutamakan profil autentikasi OpenClaw tertentu                           |
| `authEpochMode`                    | Menentukan bagaimana perubahan autentikasi membatalkan sesi CLI tersimpan   |
| `nativeToolMode`                   | Mendeklarasikan apakah CLI memiliki tool native yang selalu aktif           |
| `sideQuestionToolMode`             | Mendeklarasikan tool native yang dinonaktifkan untuk pertanyaan sampingan `/btw` |
| `bundleMcp` / `bundleMcpMode`      | Ikut menggunakan bridge tool MCP local loopback milik OpenClaw              |
| `ownsNativeCompaction`             | Backend memiliki Compaction sendiri - OpenClaw menundanya                   |

Pertahankan hook ini sebagai milik provider. Jangan menambahkan cabang khusus
CLI ke core ketika hook backend dapat mengekspresikan perilaku tersebut.

`ctx.executionMode` bernilai `"agent"` untuk giliran normal dan
`"side-question"` untuk panggilan `/btw` sementara. Gunakan ini ketika CLI
memerlukan flag sekali pakai yang berbeda, seperti menonaktifkan tool native,
persistensi sesi, atau perilaku resume untuk BTW. Jika backend biasanya memiliki
`nativeToolMode: "always-on"` tetapi argv pertanyaan sampingannya secara andal
menonaktifkan tool tersebut, tetapkan juga `sideQuestionToolMode: "disabled"`;
jika tidak, OpenClaw akan gagal tertutup ketika BTW memerlukan run CLI tanpa
tool.

### `ownsNativeCompaction`: memilih keluar dari Compaction OpenClaw

Jika backend Anda menjalankan agen yang memadatkan transkripnya **sendiri**,
tetapkan `ownsNativeCompaction: true` agar summarizer pengaman OpenClaw tidak
pernah berjalan terhadap sesinya - siklus hidup Compaction CLI mengembalikan
no-op dan giliran berlanjut. `claude-cli` mendeklarasikannya karena Claude Code
melakukan Compaction secara internal tanpa endpoint harness. Sesi native-harness
seperti Codex tetap diarahkan ke endpoint Compaction harness-nya.

**Deklarasikan hanya ketika semua hal berikut berlaku**, atau sesi tertunda yang
melebihi anggaran dapat tetap melebihi anggaran / menjadi usang (OpenClaw tidak
lagi menyelamatkannya):

- backend secara andal melakukan Compaction atau membatasi transkripnya sendiri saat mendekati jendelanya;
- backend mempertahankan sesi yang dapat dilanjutkan agar status yang telah dipadatkan bertahan lintas giliran
  (mis. `--resume` / `--session-id`);
- ini bukan sesi Compaction native-harness - sesi yang cocok dengan `agentHarnessId`
  diarahkan ke endpoint harness sebagai gantinya.

## Bridge tool MCP

Backend CLI tidak menerima tool OpenClaw secara default. Jika CLI dapat
mengonsumsi konfigurasi MCP, aktifkan secara eksplisit:

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

Mode bridge yang didukung adalah:

| Mode                     | Use                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI yang menerima file konfigurasi MCP                           |
| `codex-config-overrides` | CLI yang menerima override konfigurasi pada argv                 |
| `gemini-system-settings` | CLI yang membaca pengaturan MCP dari direktori pengaturan sistemnya |

Aktifkan bridge hanya ketika CLI benar-benar dapat mengonsumsinya. Jika CLI
memiliki lapisan tool bawaan sendiri yang tidak dapat dinonaktifkan, tetapkan
`nativeToolMode: "always-on"` agar OpenClaw dapat gagal tertutup ketika pemanggil
memerlukan tanpa tool native.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Dokumentasikan override minimum yang kemungkinan dibutuhkan pengguna. Biasanya
hanya `command` ketika binary berada di luar `PATH`.

## Verifikasi

Untuk Plugin bawaan, tambahkan pengujian terfokus pada builder dan registrasi
setup, lalu jalankan lane pengujian yang ditargetkan untuk Plugin tersebut:

```bash
pnpm test extensions/acme-cli
```

Untuk Plugin lokal atau terinstal, verifikasi discovery dan satu eksekusi model nyata:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Jika backend mendukung gambar atau MCP, tambahkan smoke langsung yang membuktikan jalur tersebut
dengan CLI nyata. Jangan mengandalkan inspeksi statis untuk perilaku prompt, gambar, MCP, atau
resume sesi.

## Checklist

<Check>`package.json` memiliki `openclaw.extensions` dan entri runtime yang dibangun untuk paket yang dipublikasikan</Check>
<Check>`openclaw.plugin.json` mendeklarasikan `cliBackends` dan `activation.onStartup` yang disengaja</Check>
<Check>`setup.cliBackends` ada ketika setup/discovery model harus melihat backend dalam kondisi cold</Check>
<Check>`api.registerCliBackend(...)` menggunakan id backend yang sama dengan manifest</Check>
<Check>Override pengguna di bawah `agents.defaults.cliBackends.<id>` tetap menang</Check>
<Check>Pengaturan sesi, system prompt, gambar, dan parser output cocok dengan kontrak CLI nyata</Check>
<Check>Pengujian yang ditargetkan dan setidaknya satu smoke CLI langsung membuktikan jalur backend</Check>

## Terkait

- [Backend CLI](/id/gateway/cli-backends) - konfigurasi pengguna dan perilaku runtime
- [Membangun Plugin](/id/plugins/building-plugins) - dasar-dasar paket dan manifest
- [Ikhtisar SDK Plugin](/id/plugins/sdk-overview) - referensi API registrasi
- [Manifest Plugin](/id/plugins/manifest) - `cliBackends` dan deskriptor setup
- [Harness agen](/id/plugins/sdk-agent-harness) - runtime agen eksternal lengkap
