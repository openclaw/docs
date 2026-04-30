---
read_when:
    - Menginstal atau mengonfigurasi harness acpx untuk Claude Code / Codex / Gemini CLI
    - Mengaktifkan jembatan MCP plugin-tools atau OpenClaw-tools
    - Mengonfigurasi mode izin ACP
summary: 'Menyiapkan agen ACP: konfigurasi harness acpx, penyiapan Plugin, izin'
title: Agen ACP — penyiapan
x-i18n:
    generated_at: "2026-04-30T10:13:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Untuk ikhtisar, runbook operator, dan konsep, lihat [agen ACP](/id/tools/acp-agents).

Bagian di bawah mencakup konfigurasi harness acpx, penyiapan plugin untuk bridge MCP, dan konfigurasi izin.

Gunakan halaman ini hanya saat Anda menyiapkan rute ACP/acpx. Untuk konfigurasi runtime app-server Codex native, gunakan [harness Codex](/id/plugins/codex-harness). Untuk kunci OpenAI API atau konfigurasi penyedia model OAuth Codex, gunakan [OpenAI](/id/providers/openai).

Codex memiliki dua rute OpenClaw:

| Rute                       | Konfigurasi/perintah                                  | Halaman penyiapan                     |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server Codex native    | `/codex ...`, `agentRuntime.id: "codex"`               | [harness Codex](/id/plugins/codex-harness) |
| Adapter ACP Codex eksplisit | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Halaman ini                            |

Pilih rute native kecuali Anda secara eksplisit membutuhkan perilaku ACP/acpx.

## Dukungan harness acpx (saat ini)

Alias harness bawaan acpx saat ini:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Saat OpenClaw menggunakan backend acpx, pilih nilai ini untuk `agentId` kecuali konfigurasi acpx Anda mendefinisikan alias agen kustom.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, timpa perintah agen `cursor` dalam konfigurasi acpx Anda alih-alih mengubah default bawaan.

Penggunaan CLI acpx langsung juga dapat menargetkan adapter arbitrer melalui `--agent <command>`, tetapi escape hatch mentah itu adalah fitur CLI acpx (bukan jalur `agentId` OpenClaw yang normal).

Kontrol model bergantung pada kapabilitas adapter. Ref model ACP Codex dinormalisasi oleh OpenClaw sebelum startup. Harness lain membutuhkan ACP `models` plus dukungan `session/set_model`; jika sebuah harness tidak mengekspos kapabilitas ACP itu maupun flag model startup miliknya sendiri, OpenClaw/acpx tidak dapat memaksa pemilihan model.

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
      "pi",
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

Konfigurasi binding thread bersifat spesifik per adapter channel. Contoh untuk Discord:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

Jika spawn ACP yang terikat thread tidak berfungsi, verifikasi flag fitur adapter terlebih dahulu:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Binding percakapan saat ini tidak memerlukan pembuatan child-thread. Binding ini memerlukan konteks percakapan aktif dan adapter channel yang mengekspos binding percakapan ACP.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference).

## Penyiapan plugin untuk backend acpx

Instalasi baru mengirimkan plugin runtime `acpx` bawaan yang diaktifkan secara default, sehingga ACP biasanya berfungsi tanpa langkah instalasi plugin manual.

Mulai dengan:

```text
/acp doctor
```

Jika Anda menonaktifkan `acpx`, menolaknya melalui `plugins.allow` / `plugins.deny`, atau ingin beralih ke checkout pengembangan lokal, gunakan jalur plugin eksplisit:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalasi workspace lokal selama pengembangan:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Lalu verifikasi kesehatan backend:

```text
/acp doctor
```

### Konfigurasi perintah dan versi acpx

Secara default, plugin `acpx` bawaan mendaftarkan backend ACP tertanam tanpa men-spawn agen ACP selama startup Gateway. Jalankan `/acp doctor` untuk probe live eksplisit. Setel `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` hanya saat Anda membutuhkan Gateway untuk mem-probe agen yang dikonfigurasi saat startup.

Timpa perintah atau versi dalam konfigurasi plugin:

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

- `command` menerima path absolut, path relatif (di-resolve dari workspace OpenClaw), atau nama perintah.
- `expectedVersion: "any"` menonaktifkan pencocokan versi ketat.
- Path `command` kustom menonaktifkan auto-install lokal plugin.

Lihat [Plugin](/id/tools/plugin).

### Instalasi dependensi otomatis

Saat Anda menginstal OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime acpx (biner spesifik platform) diinstal secara otomatis melalui hook postinstall. Jika instalasi otomatis gagal, gateway tetap berjalan normal dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Bridge MCP alat plugin

Secara default, sesi ACPX **tidak** mengekspos alat yang didaftarkan plugin OpenClaw ke harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code memanggil alat plugin OpenClaw yang terinstal seperti recall/store memori, aktifkan bridge khusus:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Yang dilakukan ini:

- Menginjeksikan server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap sesi ACPX.
- Mengekspos alat plugin yang sudah didaftarkan oleh plugin OpenClaw yang terinstal dan aktif.
- Menjaga fitur ini eksplisit dan nonaktif secara default.

Catatan keamanan dan kepercayaan:

- Ini memperluas permukaan alat harness ACP.
- Agen ACP hanya mendapat akses ke alat plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas kepercayaan yang sama seperti mengizinkan plugin tersebut dieksekusi di OpenClaw itu sendiri.
- Tinjau plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` kustom tetap bekerja seperti sebelumnya. Bridge plugin-tools bawaan adalah kemudahan opt-in tambahan, bukan pengganti konfigurasi server MCP generik.

### Bridge MCP alat OpenClaw

Secara default, sesi ACPX juga **tidak** mengekspos alat bawaan OpenClaw melalui MCP. Aktifkan bridge core-tools terpisah saat agen ACP membutuhkan alat bawaan tertentu seperti `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Yang dilakukan ini:

- Menginjeksikan server MCP bawaan bernama `openclaw-tools` ke bootstrap sesi ACPX.
- Mengekspos alat bawaan OpenClaw tertentu. Server awal mengekspos `cron`.
- Menjaga eksposur alat inti eksplisit dan nonaktif secara default.

### Konfigurasi timeout runtime

Plugin `acpx` bawaan menetapkan default giliran runtime tertanam ke timeout 120 detik. Ini memberi harness yang lebih lambat seperti Gemini CLI cukup waktu untuk menyelesaikan startup dan inisialisasi ACP. Timpa jika host Anda membutuhkan batas runtime berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Mulai ulang gateway setelah mengubah nilai ini.

### Konfigurasi agen probe kesehatan

Saat `/acp doctor` atau probe startup opt-in memeriksa backend, plugin `acpx` bawaan mem-probe satu agen harness. Jika `acp.allowedAgents` disetel, default-nya adalah agen pertama yang diizinkan; jika tidak, default-nya adalah `codex`. Jika deployment Anda membutuhkan agen ACP berbeda untuk pemeriksaan kesehatan, setel agen probe secara eksplisit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Mulai ulang gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan non-interaktif — tidak ada TTY untuk menyetujui atau menolak prompt izin file-write dan shell-exec. Plugin acpx menyediakan dua kunci konfigurasi yang mengontrol cara izin ditangani:

Izin harness ACPX ini terpisah dari persetujuan exec OpenClaw dan terpisah dari flag bypass vendor backend CLI seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah sakelar break-glass level harness untuk sesi ACP.

### `permissionMode`

Mengontrol operasi mana yang dapat dilakukan agen harness tanpa prompt.

| Nilai           | Perilaku                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Menyetujui otomatis semua penulisan file dan perintah shell. |
| `approve-reads` | Menyetujui otomatis hanya pembacaan; penulisan dan exec memerlukan prompt. |
| `deny-all`      | Menolak semua prompt izin.                                |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi saat prompt izin akan ditampilkan tetapi tidak ada TTY interaktif yang tersedia (yang selalu terjadi untuk sesi ACP).

| Nilai  | Perilaku                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Membatalkan sesi dengan `AcpRuntimeError`. **(default)**          |
| `deny` | Menolak izin secara diam-diam dan melanjutkan (degradasi anggun). |

### Konfigurasi

Setel melalui konfigurasi plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Mulai ulang gateway setelah mengubah nilai ini.

<Warning>
Default OpenClaw adalah `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, penulisan atau exec apa pun yang memicu prompt izin dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Jika Anda perlu membatasi izin, setel `nonInteractivePermissions` ke `deny` agar sesi terdegradasi secara anggun alih-alih crash.
</Warning>

## Terkait

- [agen ACP](/id/tools/acp-agents) — ikhtisar, runbook operator, konsep
- [Sub-agen](/id/tools/subagents)
- [Routing multi-agen](/id/concepts/multi-agent)
