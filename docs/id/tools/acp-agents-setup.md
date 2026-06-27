---
read_when:
    - Menginstal atau mengonfigurasi harness acpx untuk Claude Code / Codex / Gemini CLI
    - Mengaktifkan jembatan MCP plugin-tools atau OpenClaw-tools
    - Mengonfigurasi mode izin ACP
summary: 'Menyiapkan agen ACP: konfigurasi harness acpx, penyiapan plugin, izin'
title: Agen ACP — penyiapan
x-i18n:
    generated_at: "2026-06-27T18:15:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Untuk ikhtisar, runbook operator, dan konsep, lihat [agen ACP](/id/tools/acp-agents).

Bagian di bawah ini mencakup konfigurasi harness acpx, penyiapan Plugin untuk jembatan MCP, dan konfigurasi izin.

Gunakan halaman ini hanya saat Anda menyiapkan rute ACP/acpx. Untuk konfigurasi runtime app-server Codex native, gunakan [harness Codex](/id/plugins/codex-harness). Untuk kunci API OpenAI atau konfigurasi penyedia model OAuth Codex, gunakan
[OpenAI](/id/providers/openai).

Codex memiliki dua rute OpenClaw:

| Rute                       | Konfig/perintah                                        | Halaman penyiapan                      |
| -------------------------- | ------------------------------------------------------ | -------------------------------------- |
| App-server Codex native    | `/codex ...`, `openai/gpt-*` agent refs                | [harness Codex](/id/plugins/codex-harness) |
| Adapter ACP Codex eksplisit | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Halaman ini                            |

Pilih rute native kecuali Anda secara eksplisit membutuhkan perilaku ACP/acpx.

## Dukungan harness acpx (saat ini)

Alias harness bawaan acpx saat ini:

- `claude`
- `codex`
- `copilot`
- `cursor` (CLI Cursor: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `qwen`

Saat OpenClaw menggunakan backend acpx, pilih nilai-nilai ini untuk `agentId` kecuali konfigurasi acpx Anda mendefinisikan alias agen khusus.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, timpa perintah agen `cursor` di konfigurasi acpx Anda, bukan mengubah default bawaan.

Penggunaan CLI acpx langsung juga dapat menargetkan adapter sembarang melalui `--agent <command>`, tetapi escape hatch mentah tersebut adalah fitur CLI acpx (bukan jalur `agentId` OpenClaw normal).

Kontrol model bergantung pada kapabilitas adapter. Ref model ACP Codex dinormalisasi oleh OpenClaw sebelum startup. Harness lain membutuhkan ACP `models` plus dukungan `session/set_model`; jika sebuah harness tidak mengekspos kapabilitas ACP itu maupun flag model startup miliknya sendiri, OpenClaw/acpx tidak dapat memaksa pilihan model.

## Konfigurasi wajib

Baseline ACP inti:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "openclaw",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

Konfigurasi pengikatan thread spesifik untuk adapter kanal. Contoh untuk Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnSessions: true,
      },
    },
  },
}
```

Jika spawn ACP yang terikat thread tidak berfungsi, verifikasi flag fitur adapter terlebih dahulu:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Pengikatan percakapan saat ini tidak memerlukan pembuatan thread anak. Pengikatan tersebut memerlukan konteks percakapan aktif dan adapter kanal yang mengekspos pengikatan percakapan ACP.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference).

## Penyiapan Plugin untuk backend acpx

Instalasi terpaket menggunakan Plugin runtime resmi `@openclaw/acpx` untuk ACP.
Instal dan aktifkan sebelum menggunakan sesi harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkout sumber juga dapat menggunakan Plugin workspace lokal setelah `pnpm install`.

Mulai dengan:

```text
/acp doctor
```

Jika Anda menonaktifkan `acpx`, menolaknya melalui `plugins.allow` / `plugins.deny`, atau ingin beralih kembali ke Plugin terpaket, gunakan jalur paket eksplisit:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instal workspace lokal selama pengembangan:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Lalu verifikasi kesehatan backend:

```text
/acp doctor
```

### Konfigurasi perintah dan versi acpx

Secara default, Plugin `acpx` mendaftarkan backend ACP tertanam selama startup Gateway dan menunggu probe startup runtime tertanam sebelum sinyal `ready` gateway.
Setel `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` atau
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` hanya untuk skrip atau lingkungan yang sengaja menonaktifkan probe startup. Jalankan `/acp doctor` untuk probe eksplisit sesuai permintaan.

Timpa perintah atau versi di konfigurasi Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` menerima jalur absolut, jalur relatif (di-resolve dari workspace OpenClaw), atau nama perintah.
- `expectedVersion: "any"` menonaktifkan pencocokan versi ketat.
- Jalur `command` khusus menonaktifkan instal otomatis lokal Plugin.

Timpa perintah agen ACP individual dengan argumen terstruktur saat jalur atau nilai flag harus tetap menjadi satu token argv:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` adalah executable atau string perintah yang ada untuk agen ACP tersebut.
- `agents.<id>.args` bersifat opsional. Setiap item array diberi kutipan shell sebelum OpenClaw meneruskannya melalui registry string perintah acpx saat ini.

Lihat [Plugin](/id/tools/plugin).

### Instal dependensi otomatis

Saat Anda menginstal OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime acpx (biner spesifik platform) diinstal otomatis melalui hook postinstall. Jika instal otomatis gagal, gateway tetap berjalan normal dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Jembatan MCP alat Plugin

Secara default, sesi ACPX **tidak** mengekspos alat yang didaftarkan Plugin OpenClaw ke harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code memanggil alat Plugin OpenClaw yang terinstal seperti recall/store memori, aktifkan jembatan khusus:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap sesi ACPX.
- Mengekspos alat Plugin yang sudah didaftarkan oleh Plugin OpenClaw yang terinstal dan aktif.
- Menjaga fitur ini eksplisit dan nonaktif secara default.

Catatan keamanan dan kepercayaan:

- Ini memperluas permukaan alat harness ACP.
- Agen ACP hanya mendapatkan akses ke alat Plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas kepercayaan yang sama seperti membiarkan Plugin tersebut berjalan di OpenClaw sendiri.
- Tinjau Plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` khusus tetap bekerja seperti sebelumnya. Jembatan alat Plugin bawaan adalah kenyamanan opt-in tambahan, bukan pengganti konfigurasi server MCP generik.

### Jembatan MCP alat OpenClaw

Secara default, sesi ACPX juga **tidak** mengekspos alat bawaan OpenClaw melalui MCP. Aktifkan jembatan alat inti terpisah saat agen ACP membutuhkan alat bawaan tertentu seperti `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-tools` ke bootstrap sesi ACPX.
- Mengekspos alat bawaan OpenClaw tertentu. Server awal mengekspos `cron`.
- Menjaga eksposur alat inti eksplisit dan nonaktif secara default.

### Konfigurasi timeout operasi runtime

Plugin `acpx` memberi startup runtime tertanam dan operasi kontrol 120 detik secara default. Ini memberi harness yang lebih lambat seperti Gemini CLI cukup waktu untuk menyelesaikan startup dan inisialisasi ACP. Timpa jika host Anda membutuhkan batas operasi berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Turn runtime menggunakan timeout agen/run OpenClaw, termasuk `/acp timeout`.
`sessions_spawn` tidak menerima penimpaan timeout per panggilan. Restart gateway setelah mengubah nilai ini.

### Konfigurasi agen probe kesehatan

Saat `/acp doctor` atau probe startup memeriksa backend, Plugin `acpx` bawaan mem-probe satu agen harness. Jika `acp.allowedAgents` disetel, default-nya adalah agen pertama yang diizinkan; jika tidak, default-nya adalah `codex`. Jika deployment Anda membutuhkan agen ACP berbeda untuk pemeriksaan kesehatan, setel agen probe secara eksplisit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Restart gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan non-interaktif — tidak ada TUI untuk menyetujui atau menolak prompt izin penulisan file dan eksekusi shell. Plugin acpx menyediakan dua kunci konfigurasi yang mengontrol bagaimana izin ditangani:

Izin harness ACPX ini terpisah dari persetujuan exec OpenClaw dan terpisah dari flag bypass vendor backend CLI seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah switch break-glass tingkat harness untuk sesi ACP.

Untuk perbandingan yang lebih luas antara OpenClaw `tools.exec.mode`, persetujuan Codex Guardian, dan izin harness ACPX, lihat
[Mode izin](/id/tools/permission-modes).

### `permissionMode`

Mengontrol operasi mana yang dapat dilakukan agen harness tanpa prompt.

| Nilai           | Perilaku                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Setujui otomatis semua penulisan file dan perintah shell. |
| `approve-reads` | Setujui otomatis hanya pembacaan; penulisan dan exec memerlukan prompt. |
| `deny-all`      | Tolak semua prompt izin.                                  |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi saat prompt izin akan ditampilkan tetapi tidak ada TUI interaktif yang tersedia (yang selalu terjadi untuk sesi ACP).

| Nilai  | Perilaku                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Batalkan sesi dengan `AcpRuntimeError`. **(default)**             |
| `deny` | Tolak izin secara diam-diam dan lanjutkan (degradasi mulus).      |

### Konfigurasi

Setel melalui konfigurasi Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Restart gateway setelah mengubah nilai-nilai ini.

<Warning>
Default OpenClaw adalah `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, penulisan atau exec apa pun yang memicu prompt izin dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Jika Anda perlu membatasi izin, setel `nonInteractivePermissions` ke `deny` agar sesi terdegradasi dengan mulus alih-alih crash.
</Warning>

## Terkait

- [agen ACP](/id/tools/acp-agents) — ikhtisar, runbook operator, konsep
- [Sub-agen](/id/tools/subagents)
- [Perutean multi-agen](/id/concepts/multi-agent)
