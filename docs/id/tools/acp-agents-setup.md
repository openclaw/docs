---
read_when:
    - Menginstal atau mengonfigurasi harness acpx untuk Claude Code / Codex / Gemini CLI
    - Mengaktifkan bridge MCP plugin-tools atau OpenClaw-tools
    - Mengonfigurasi mode izin ACP
summary: 'Menyiapkan agen ACP: konfigurasi harness acpx, penyiapan Plugin, izin'
title: Agen ACP — penyiapan
x-i18n:
    generated_at: "2026-04-24T09:28:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Untuk ikhtisar, runbook operator, dan konsep, lihat [Agen ACP](/id/tools/acp-agents).
Halaman ini membahas konfigurasi harness acpx, penyiapan Plugin untuk bridge MCP, dan
konfigurasi izin.

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

Saat OpenClaw menggunakan backend acpx, utamakan nilai-nilai ini untuk `agentId` kecuali konfigurasi acpx Anda mendefinisikan alias agen kustom.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, override perintah agen `cursor` di konfigurasi acpx Anda alih-alih mengubah default bawaannya.

Penggunaan CLI acpx langsung juga dapat menargetkan adaptor arbitrer melalui `--agent <command>`, tetapi escape hatch mentah itu adalah fitur CLI acpx (bukan jalur `agentId` OpenClaw yang normal).

## Konfigurasi yang diperlukan

Baseline ACP inti:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Default adalah true; setel false untuk menjeda dispatch ACP sambil mempertahankan kontrol /acp.
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

Konfigurasi pengikatan thread bersifat spesifik adaptor channel. Contoh untuk Discord:

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

Jika spawn ACP yang terikat thread tidak berfungsi, verifikasi terlebih dahulu feature flag adaptor:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Pengikatan percakapan saat ini tidak memerlukan pembuatan child-thread. Itu memerlukan konteks percakapan aktif dan adaptor channel yang mengekspos pengikatan percakapan ACP.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference).

## Penyiapan Plugin untuk backend acpx

Instalasi baru dikirim dengan Plugin runtime `acpx` bawaan yang aktif secara default, sehingga ACP
biasanya berfungsi tanpa langkah instalasi Plugin manual.

Mulai dengan:

```text
/acp doctor
```

Jika Anda menonaktifkan `acpx`, menolaknya melalui `plugins.allow` / `plugins.deny`, atau ingin
beralih ke checkout pengembangan lokal, gunakan jalur Plugin eksplisit:

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

Secara default, Plugin `acpx` bawaan menggunakan biner yang dipin secara lokal di Plugin (`node_modules/.bin/acpx` di dalam paket Plugin). Saat startup, backend didaftarkan sebagai belum siap dan pekerjaan latar belakang memverifikasi `acpx --version`; jika binernya hilang atau tidak cocok, ia menjalankan `npm install --omit=dev --no-save acpx@<pinned>` lalu memverifikasi ulang. Gateway tetap tidak memblokir sepanjang proses.

Override perintah atau versi di konfigurasi Plugin:

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
- `expectedVersion: "any"` menonaktifkan pencocokan versi yang ketat.
- Path `command` kustom menonaktifkan auto-install lokal Plugin.

Lihat [Plugins](/id/tools/plugin).

### Instalasi dependensi otomatis

Saat Anda menginstal OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime
acpx (biner spesifik platform) diinstal secara otomatis
melalui hook postinstall. Jika instalasi otomatis gagal, gateway tetap mulai
secara normal dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Bridge MCP alat Plugin

Secara default, sesi ACPX **tidak** mengekspos alat yang terdaftar oleh Plugin OpenClaw ke
harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code dapat memanggil
alat Plugin OpenClaw yang terinstal seperti memory recall/store, aktifkan bridge khusus ini:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Apa yang dilakukan ini:

- Menyisipkan server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap sesi ACPX.
- Mengekspos alat Plugin yang sudah didaftarkan oleh Plugin OpenClaw yang terinstal dan aktif.
- Menjaga fitur ini tetap eksplisit dan nonaktif secara default.

Catatan keamanan dan kepercayaan:

- Ini memperluas permukaan alat harness ACP.
- Agen ACP hanya mendapatkan akses ke alat Plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas kepercayaan yang sama seperti mengizinkan Plugin tersebut berjalan di
  OpenClaw itu sendiri.
- Tinjau Plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` kustom tetap berfungsi seperti sebelumnya. Bridge plugin-tools bawaan adalah
kemudahan tambahan yang opt-in, bukan pengganti konfigurasi server MCP generik.

### Bridge MCP alat OpenClaw

Secara default, sesi ACPX juga **tidak** mengekspos alat OpenClaw bawaan melalui
MCP. Aktifkan bridge alat inti terpisah saat agen ACP membutuhkan alat bawaan
tertentu seperti `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Apa yang dilakukan ini:

- Menyisipkan server MCP bawaan bernama `openclaw-tools` ke bootstrap sesi ACPX.
- Mengekspos alat OpenClaw bawaan tertentu. Server awal mengekspos `cron`.
- Menjaga eksposur alat inti tetap eksplisit dan nonaktif secara default.

### Konfigurasi timeout runtime

Plugin `acpx` bawaan secara default menetapkan timeout 120 detik untuk giliran runtime tersemat.
Ini memberi harness yang lebih lambat seperti Gemini CLI cukup waktu untuk menyelesaikan
startup dan inisialisasi ACP. Override jika host Anda memerlukan batas
runtime yang berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Mulai ulang gateway setelah mengubah nilai ini.

### Konfigurasi agen health probe

Plugin `acpx` bawaan mem-probe satu agen harness saat menentukan apakah backend runtime
tersemat siap. Default-nya adalah `codex`. Jika deployment Anda
menggunakan agen ACP default yang berbeda, setel agen probe ke id yang sama:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Mulai ulang gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan secara non-interaktif — tidak ada TTY untuk menyetujui atau menolak prompt izin penulisan file dan eksekusi shell. Plugin acpx menyediakan dua kunci konfigurasi yang mengendalikan cara izin ditangani:

Izin harness ACPX ini terpisah dari persetujuan exec OpenClaw dan terpisah dari flag bypass vendor backend CLI seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah sakelar break-glass tingkat harness untuk sesi ACP.

### `permissionMode`

Mengontrol operasi mana yang dapat dilakukan agen harness tanpa prompt.

| Nilai           | Perilaku                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Menyetujui otomatis semua penulisan file dan perintah shell.          |
| `approve-reads` | Menyetujui otomatis hanya pembacaan; penulisan dan exec memerlukan prompt. |
| `deny-all`      | Menolak semua prompt izin.                              |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi saat prompt izin seharusnya ditampilkan tetapi tidak ada TTY interaktif yang tersedia (yang selalu terjadi pada sesi ACP).

| Nilai  | Perilaku                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Batalkan sesi dengan `AcpRuntimeError`. **(default)**           |
| `deny` | Tolak izin secara diam-diam dan lanjutkan (degradasi yang anggun). |

### Konfigurasi

Setel melalui konfigurasi Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Mulai ulang gateway setelah mengubah nilai-nilai ini.

> **Penting:** OpenClaw saat ini secara default menggunakan `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, setiap penulisan atau exec yang memicu prompt izin dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jika Anda perlu membatasi izin, setel `nonInteractivePermissions` ke `deny` agar sesi mengalami degradasi yang anggun alih-alih crash.

## Terkait

- [Agen ACP](/id/tools/acp-agents) — ikhtisar, runbook operator, konsep
- [Sub-agen](/id/tools/subagents)
- [Perutean multi-agen](/id/concepts/multi-agent)
