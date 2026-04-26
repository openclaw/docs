---
read_when:
    - Menginstal atau mengonfigurasi harness acpx untuk Claude Code / Codex / Gemini CLI
    - Mengaktifkan bridge MCP plugin-tools atau OpenClaw-tools
    - Mengonfigurasi mode izin ACP
summary: 'Menyiapkan agen ACP: config harness acpx, penyiapan Plugin, izin'
title: Agen ACP — penyiapan
x-i18n:
    generated_at: "2026-04-26T11:39:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Untuk ikhtisar, runbook operator, dan konsep, lihat [Agen ACP](/id/tools/acp-agents).

Bagian di bawah ini membahas config harness acpx, penyiapan Plugin untuk bridge MCP, dan konfigurasi izin.

Gunakan halaman ini hanya saat Anda menyiapkan rute ACP/acpx. Untuk config runtime
app-server Codex native, gunakan [Harness Codex](/id/plugins/codex-harness). Untuk
API key OpenAI atau config provider model OAuth Codex, gunakan
[OpenAI](/id/providers/openai).

Codex memiliki dua rute OpenClaw:

| Rute                       | Config/perintah                                         | Halaman penyiapan                       |
| -------------------------- | ------------------------------------------------------- | --------------------------------------- |
| App-server Codex native    | `/codex ...`, `agentRuntime.id: "codex"`                | [Harness Codex](/id/plugins/codex-harness) |
| Adapter ACP Codex eksplisit | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Halaman ini                             |

Utamakan rute native kecuali Anda memang membutuhkan perilaku ACP/acpx secara eksplisit.

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

Saat OpenClaw menggunakan backend acpx, utamakan nilai-nilai ini untuk `agentId` kecuali config acpx Anda mendefinisikan alias agen kustom.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, timpa perintah agen `cursor` dalam config acpx Anda alih-alih mengubah default bawaannya.

Penggunaan CLI acpx langsung juga dapat menargetkan adapter arbitrer melalui `--agent <command>`, tetapi escape hatch mentah tersebut adalah fitur CLI acpx (bukan jalur `agentId` OpenClaw yang normal).

Kontrol model bergantung pada kapabilitas adapter. Ref model ACP Codex dinormalisasi oleh OpenClaw sebelum startup. Harness lain memerlukan ACP `models` plus
dukungan `session/set_model`; jika suatu harness tidak mengekspos kapabilitas ACP itu maupun flag model startup miliknya sendiri, OpenClaw/acpx tidak dapat memaksa pemilihan model.

## Config yang diperlukan

Baseline inti ACP:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Default true; atur false untuk menjeda dispatch ACP sambil tetap mempertahankan kontrol /acp.
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

Config thread binding bersifat khusus adapter channel. Contoh untuk Discord:

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

Jika spawn ACP dengan thread-bound tidak berfungsi, verifikasi flag fitur adapter terlebih dahulu:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Binding percakapan saat ini tidak memerlukan pembuatan child-thread. Binding tersebut memerlukan konteks percakapan aktif dan adapter channel yang mengekspos binding percakapan ACP.

Lihat [Referensi Config](/id/gateway/configuration-reference).

## Penyiapan Plugin untuk backend acpx

Instalasi baru mengirim Plugin runtime `acpx` bawaan dalam keadaan aktif secara default, sehingga ACP
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

### Config perintah dan versi acpx

Secara default, Plugin `acpx` bawaan mendaftarkan backend ACP tertanam tanpa
meluncurkan agen ACP selama startup Gateway. Jalankan `/acp doctor` untuk probe
live yang eksplisit. Atur `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` hanya saat Anda membutuhkan
Gateway untuk memprobe agen yang dikonfigurasi saat startup.

Timpa perintah atau versi dalam config Plugin:

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
- Path `command` kustom menonaktifkan auto-install lokal Plugin.

Lihat [Plugins](/id/tools/plugin).

### Instalasi dependensi otomatis

Saat Anda menginstal OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime acpx
(binary khusus platform) diinstal secara otomatis
melalui hook postinstall. Jika instalasi otomatis gagal, gateway tetap mulai
secara normal dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Bridge MCP plugin-tools

Secara default, sesi ACPX **tidak** mengekspos tools yang didaftarkan Plugin OpenClaw ke
harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code dapat memanggil
tools Plugin OpenClaw yang terinstal seperti memory recall/store, aktifkan bridge khusus:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Apa yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap sesi ACPX.
- Mengekspos tools Plugin yang sudah didaftarkan oleh Plugins OpenClaw yang terinstal dan aktif.
- Menjaga fitur ini tetap eksplisit dan nonaktif secara default.

Catatan keamanan dan trust:

- Ini memperluas surface tool harness ACP.
- Agen ACP hanya mendapatkan akses ke tools Plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas trust yang sama seperti membiarkan Plugins tersebut dieksekusi di
  OpenClaw sendiri.
- Tinjau Plugins yang terinstal sebelum mengaktifkannya.

`mcpServers` kustom tetap berfungsi seperti sebelumnya. Bridge plugin-tools bawaan adalah
kemudahan tambahan yang sifatnya opt-in, bukan pengganti config server MCP generik.

### Bridge MCP OpenClaw-tools

Secara default, sesi ACPX juga **tidak** mengekspos tools bawaan OpenClaw melalui
MCP. Aktifkan bridge core-tools terpisah saat agen ACP memerlukan tools bawaan
tertentu seperti `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Apa yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-tools` ke bootstrap sesi ACPX.
- Mengekspos tools bawaan OpenClaw tertentu. Server awal mengekspos `cron`.
- Menjaga eksposur core-tool tetap eksplisit dan nonaktif secara default.

### Config timeout runtime

Plugin `acpx` bawaan secara default membatasi giliran runtime tertanam ke
120 detik. Ini memberi harness yang lebih lambat seperti Gemini CLI cukup waktu untuk menyelesaikan
startup dan inisialisasi ACP. Timpa jika host Anda memerlukan batas
runtime yang berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Restart gateway setelah mengubah nilai ini.

### Config agen probe kesehatan

Saat `/acp doctor` atau probe startup opt-in memeriksa backend, Plugin
`acpx` bawaan memprobe satu agen harness. Jika `acp.allowedAgents` diatur, default-nya
adalah agen pertama yang diizinkan; jika tidak, default-nya `codex`. Jika deployment Anda
memerlukan agen ACP yang berbeda untuk pemeriksaan kesehatan, atur agen probe
secara eksplisit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Restart gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan secara non-interaktif — tidak ada TTY untuk menyetujui atau menolak prompt izin penulisan file dan eksekusi shell. Plugin acpx menyediakan dua key config yang mengontrol bagaimana izin ditangani:

Izin harness ACPX ini terpisah dari approvals exec OpenClaw dan terpisah dari flag bypass vendor backend CLI seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah switch break-glass tingkat harness untuk sesi ACP.

### `permissionMode`

Mengontrol operasi mana yang dapat dilakukan agen harness tanpa prompt.

| Nilai            | Perilaku                                                  |
| ---------------- | --------------------------------------------------------- |
| `approve-all`    | Setujui otomatis semua penulisan file dan perintah shell. |
| `approve-reads`  | Setujui otomatis hanya pembacaan; penulisan dan exec memerlukan prompt. |
| `deny-all`       | Tolak semua prompt izin.                                  |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi saat prompt izin seharusnya ditampilkan tetapi tidak ada TTY interaktif yang tersedia (yang selalu menjadi kasus untuk sesi ACP).

| Nilai | Perilaku                                                        |
| ----- | ---------------------------------------------------------------- |
| `fail` | Batalkan sesi dengan `AcpRuntimeError`. **(default)**           |
| `deny` | Tolak izin secara diam-diam dan lanjutkan (degradasi yang mulus). |

### Config

Atur melalui config Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Restart gateway setelah mengubah nilai ini.

> **Penting:** OpenClaw saat ini default ke `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, setiap penulisan atau exec yang memicu prompt izin dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Jika Anda perlu membatasi izin, atur `nonInteractivePermissions` ke `deny` agar sesi mengalami degradasi secara mulus alih-alih crash.

## Terkait

- [Agen ACP](/id/tools/acp-agents) — ikhtisar, runbook operator, konsep
- [Sub-agen](/id/tools/subagents)
- [Routing multi-agen](/id/concepts/multi-agent)
