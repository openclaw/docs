---
read_when:
    - Anda sedang membangun Plugin backend CLI AI lokal
    - Anda ingin mendaftarkan backend untuk referensi model seperti acme-cli/model
    - Anda perlu memetakan CLI pihak ketiga ke pelaksana cadangan teks OpenClaw
sidebarTitle: CLI backend plugins
summary: Buat Plugin yang mendaftarkan layanan belakang CLI AI lokal
title: Membangun Plugin backend CLI
x-i18n:
    generated_at: "2026-05-07T13:22:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

Plugin backend CLI memungkinkan OpenClaw memanggil CLI AI lokal sebagai backend
inferensi teks. Backend muncul sebagai prefiks penyedia dalam referensi model:

```text
acme-cli/acme-large
```

Gunakan backend CLI ketika integrasi upstream sudah diekspos sebagai perintah
lokal, ketika CLI memiliki status login lokal, atau ketika CLI berguna sebagai
fallback jika penyedia API tidak tersedia.

<Info>
  Jika layanan upstream mengekspos API model HTTP biasa, tulis
  [Plugin penyedia](/id/plugins/sdk-provider-plugins) sebagai gantinya. Jika runtime
  upstream memiliki sesi agen lengkap, peristiwa alat, compaction, atau status
  tugas latar belakang, gunakan [harness agen](/id/plugins/sdk-agent-harness).
</Info>

## Yang dimiliki Plugin

Plugin backend CLI memiliki tiga kontrak:

| Kontrak              | File                   | Tujuan                                                    |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Entri paket          | `package.json`         | Mengarahkan OpenClaw ke modul runtime Plugin              |
| Kepemilikan manifest | `openclaw.plugin.json` | Mendeklarasikan id backend sebelum runtime dimuat         |
| Pendaftaran runtime  | `index.ts`             | Memanggil `api.registerCliBackend(...)` dengan default perintah |

Manifest adalah metadata penemuan. Manifest tidak menjalankan CLI dan tidak
mendaftarkan perilaku runtime. Perilaku runtime dimulai saat entri Plugin
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
    sudah dibangun. Jika entri sumber Anda adalah `./src/index.ts`, tambahkan
    `openclaw.runtimeExtensions` yang menunjuk ke peer JavaScript yang sudah
    dibangun. Lihat [Titik entri](/id/plugins/sdk-entrypoints).

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

    `cliBackends` adalah daftar kepemilikan runtime. Ini memungkinkan OpenClaw
    memuat Plugin secara otomatis ketika konfigurasi atau pemilihan model
    menyebut `acme-cli/...`.

    `setup.cliBackends` adalah permukaan setup berbasis deskriptor terlebih
    dahulu. Tambahkan ini ketika penemuan model, onboarding, atau status harus
    mengenali backend tanpa memuat runtime Plugin. Gunakan `requiresRuntime:
    false` hanya ketika deskriptor statis tersebut cukup untuk setup.

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

    Id backend harus cocok dengan entri `cliBackends` manifest. `config` yang
    didaftarkan hanya default; konfigurasi pengguna di bawah
    `agents.defaults.cliBackends.acme-cli` digabungkan di atasnya saat runtime.

  </Step>
</Steps>

## Bentuk konfigurasi

`CliBackendConfig` menjelaskan bagaimana OpenClaw harus meluncurkan dan
mengurai CLI:

| Bidang                                    | Penggunaan                                                 |
| ----------------------------------------- | ---------------------------------------------------------- |
| `command`                                 | Nama biner atau path perintah absolut                      |
| `args`                                    | argv dasar untuk eksekusi baru                             |
| `resumeArgs`                              | argv alternatif untuk sesi yang dilanjutkan; mendukung `{sessionId}` |
| `output` / `resumeOutput`                 | Parser: `json`, `jsonl`, atau `text`                       |
| `input`                                   | Transport prompt: `arg` atau `stdin`                       |
| `modelArg`                                | Flag yang digunakan sebelum id model                       |
| `modelAliases`                            | Memetakan id model OpenClaw ke id native CLI               |
| `sessionArg` / `sessionArgs`              | Cara meneruskan id sesi                                    |
| `sessionMode`                             | `always`, `existing`, atau `none`                          |
| `sessionIdFields`                         | Bidang JSON yang dibaca OpenClaw dari output CLI           |
| `systemPromptArg` / `systemPromptFileArg` | Transport prompt sistem                                    |
| `systemPromptWhen`                        | `first`, `always`, atau `never`                            |
| `imageArg` / `imageMode`                  | Dukungan path gambar                                       |
| `serialize`                               | Menjaga eksekusi backend yang sama tetap berurutan         |
| `reliability.watchdog`                    | Penyesuaian timeout tanpa output                           |

Pilih konfigurasi statis terkecil yang cocok dengan CLI. Tambahkan callback
Plugin hanya untuk perilaku yang benar-benar menjadi milik backend.

## Hook backend lanjutan

`CliBackendPlugin` juga dapat mendefinisikan:

| Hook                               | Penggunaan                                               |
| ---------------------------------- | -------------------------------------------------------- |
| `normalizeConfig(config, context)` | Menulis ulang konfigurasi pengguna lama setelah merge    |
| `resolveExecutionArgs(ctx)`        | Menambahkan flag berlingkup permintaan seperti effort berpikir |
| `prepareExecution(ctx)`            | Membuat jembatan autentikasi atau konfigurasi sementara sebelum peluncuran |
| `transformSystemPrompt(ctx)`       | Menerapkan transformasi prompt sistem akhir yang spesifik CLI |
| `textTransforms`                   | Penggantian prompt/output dua arah                       |
| `defaultAuthProfileId`             | Memilih profil autentikasi OpenClaw tertentu             |
| `authEpochMode`                    | Menentukan bagaimana perubahan autentikasi membatalkan sesi CLI tersimpan |
| `nativeToolMode`                   | Mendeklarasikan apakah CLI memiliki alat native yang selalu aktif |
| `bundleMcp` / `bundleMcpMode`      | Mengikutsertakan jembatan alat MCP loopback OpenClaw     |

Jaga agar hook ini tetap dimiliki penyedia. Jangan menambahkan cabang spesifik
CLI ke core ketika hook backend dapat mengekspresikan perilaku tersebut.

## Jembatan alat MCP

Backend CLI tidak menerima alat OpenClaw secara default. Jika CLI dapat
mengonsumsi konfigurasi MCP, ikut sertakan secara eksplisit:

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

Mode jembatan yang didukung adalah:

| Mode                     | Penggunaan                                                       |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI yang menerima file konfigurasi MCP                           |
| `codex-config-overrides` | CLI yang menerima override konfigurasi pada argv                 |
| `gemini-system-settings` | CLI yang membaca pengaturan MCP dari direktori pengaturan sistemnya |

Aktifkan jembatan hanya ketika CLI benar-benar dapat mengonsumsinya. Jika CLI
memiliki lapisan alat bawaan sendiri yang tidak dapat dinonaktifkan, tetapkan
`nativeToolMode: "always-on"` agar OpenClaw dapat gagal secara tertutup ketika
pemanggil mensyaratkan tidak ada alat native.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Dokumentasikan override minimum yang kemungkinan dibutuhkan pengguna. Biasanya
itu hanya `command` ketika biner berada di luar `PATH`.

## Verifikasi

Untuk Plugin yang dibundel, tambahkan pengujian terfokus di sekitar builder dan
pendaftaran setup, lalu jalankan lane pengujian tertarget milik Plugin:

```bash
pnpm test extensions/acme-cli
```

Untuk Plugin lokal atau terpasang, verifikasi penemuan dan satu eksekusi model
nyata:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Jika backend mendukung gambar atau MCP, tambahkan smoke langsung yang
membuktikan path tersebut dengan CLI nyata. Jangan mengandalkan inspeksi statis
untuk perilaku prompt, gambar, MCP, atau lanjutkan-sesi.

## Checklist

<Check>`package.json` memiliki `openclaw.extensions` dan entri runtime yang sudah dibangun untuk paket yang dipublikasikan</Check>
<Check>`openclaw.plugin.json` mendeklarasikan `cliBackends` dan `activation.onStartup` yang disengaja</Check>
<Check>`setup.cliBackends` hadir ketika setup/penemuan model harus melihat backend dalam keadaan dingin</Check>
<Check>`api.registerCliBackend(...)` menggunakan id backend yang sama dengan manifest</Check>
<Check>Override pengguna di bawah `agents.defaults.cliBackends.<id>` tetap menang</Check>
<Check>Pengaturan sesi, prompt sistem, gambar, dan parser output cocok dengan kontrak CLI nyata</Check>
<Check>Pengujian tertarget dan setidaknya satu smoke CLI langsung membuktikan path backend</Check>

## Terkait

- [Backend CLI](/id/gateway/cli-backends) - konfigurasi pengguna dan perilaku runtime
- [Membangun Plugin](/id/plugins/building-plugins) - dasar paket dan manifest
- [Gambaran umum SDK Plugin](/id/plugins/sdk-overview) - referensi API pendaftaran
- [Manifest Plugin](/id/plugins/manifest) - `cliBackends` dan deskriptor setup
- [Harness agen](/id/plugins/sdk-agent-harness) - runtime agen eksternal penuh
