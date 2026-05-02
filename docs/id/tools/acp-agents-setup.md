---
read_when:
    - Menginstal atau mengonfigurasi harness acpx untuk Claude Code / Codex / Gemini CLI
    - Mengaktifkan jembatan MCP plugin-tools atau OpenClaw-tools
    - Mengonfigurasi mode izin ACP
summary: 'Menyiapkan agen ACP: konfigurasi harness acpx, penyiapan Plugin, izin'
title: Agen ACP — penyiapan
x-i18n:
    generated_at: "2026-05-02T09:32:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Untuk ikhtisar, runbook operator, dan konsep, lihat [agen ACP](/id/tools/acp-agents).

Bagian di bawah mencakup konfigurasi harness acpx, penyiapan Plugin untuk jembatan MCP, dan konfigurasi izin.

Gunakan halaman ini hanya ketika Anda menyiapkan rute ACP/acpx. Untuk konfigurasi runtime app-server Codex native, gunakan [harness Codex](/id/plugins/codex-harness). Untuk kunci OpenAI API atau konfigurasi penyedia model OAuth Codex, gunakan [OpenAI](/id/providers/openai).

Codex memiliki dua rute OpenClaw:

| Rute                       | Konfigurasi/perintah                                   | Halaman penyiapan                      |
| -------------------------- | ------------------------------------------------------ | -------------------------------------- |
| App-server Codex native    | `/codex ...`, `agentRuntime.id: "codex"`               | [harness Codex](/id/plugins/codex-harness) |
| Adapter ACP Codex eksplisit | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Halaman ini                            |

Utamakan rute native kecuali Anda secara eksplisit memerlukan perilaku ACP/acpx.

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
- `pi`
- `qwen`

Ketika OpenClaw menggunakan backend acpx, utamakan nilai-nilai ini untuk `agentId` kecuali konfigurasi acpx Anda mendefinisikan alias agen kustom.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, timpa perintah agen `cursor` dalam konfigurasi acpx Anda alih-alih mengubah default bawaan.

Penggunaan CLI acpx langsung juga dapat menargetkan adapter arbitrer melalui `--agent <command>`, tetapi escape hatch mentah itu adalah fitur CLI acpx (bukan jalur `agentId` OpenClaw normal).

Kontrol model bergantung pada kapabilitas adapter. Referensi model ACP Codex dinormalisasi oleh OpenClaw sebelum startup. Harness lain memerlukan `models` ACP ditambah dukungan `session/set_model`; jika sebuah harness tidak mengekspos kapabilitas ACP itu maupun flag model startup miliknya sendiri, OpenClaw/acpx tidak dapat memaksakan pilihan model.

## Konfigurasi wajib

Baseline inti ACP:

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

Konfigurasi pengikatan thread bersifat spesifik untuk adapter saluran. Contoh untuk Discord:

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

Pengikatan percakapan saat ini tidak memerlukan pembuatan child-thread. Pengikatan ini memerlukan konteks percakapan aktif dan adapter saluran yang mengekspos pengikatan percakapan ACP.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference).

## Penyiapan Plugin untuk backend acpx

Instalasi terpaket menggunakan Plugin runtime `@openclaw/acpx` resmi untuk ACP.
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

Secara default, Plugin `acpx` mendaftarkan backend ACP tertanam tanpa menjalankan agen ACP saat startup Gateway. Jalankan `/acp doctor` untuk probe live eksplisit. Setel `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` hanya ketika Anda memerlukan Gateway untuk mem-probe agen yang dikonfigurasi saat startup.

Timpa perintah atau versi dalam konfigurasi Plugin:

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
- Jalur `command` kustom menonaktifkan auto-install lokal Plugin.

Lihat [Plugin](/id/tools/plugin).

### Instal dependensi otomatis

Ketika Anda menginstal OpenClaw secara global dengan `npm install -g openclaw`, dependensi runtime acpx (biner spesifik platform) diinstal otomatis melalui hook postinstall. Jika instal otomatis gagal, gateway tetap berjalan normal dan melaporkan dependensi yang hilang melalui `openclaw acp doctor`.

### Jembatan MCP alat Plugin

Secara default, sesi ACPX **tidak** mengekspos alat yang didaftarkan Plugin OpenClaw ke harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code memanggil alat Plugin OpenClaw yang terinstal seperti pengingatan/penyimpanan memori, aktifkan jembatan khusus:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-plugin-tools` ke bootstrap sesi ACPX.
- Mengekspos alat Plugin yang sudah didaftarkan oleh Plugin OpenClaw yang terinstal dan aktif.
- Menjaga fitur tetap eksplisit dan default-nonaktif.

Catatan keamanan dan kepercayaan:

- Ini memperluas permukaan alat harness ACP.
- Agen ACP mendapatkan akses hanya ke alat Plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas kepercayaan yang sama seperti mengizinkan Plugin tersebut berjalan di OpenClaw itu sendiri.
- Tinjau Plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` kustom tetap berfungsi seperti sebelumnya. Jembatan alat Plugin bawaan adalah kemudahan opt-in tambahan, bukan pengganti konfigurasi server MCP generik.

### Jembatan MCP alat OpenClaw

Secara default, sesi ACPX juga **tidak** mengekspos alat bawaan OpenClaw melalui MCP. Aktifkan jembatan alat inti terpisah ketika agen ACP memerlukan alat bawaan tertentu seperti `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Yang dilakukan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-tools` ke bootstrap sesi ACPX.
- Mengekspos alat bawaan OpenClaw tertentu. Server awal mengekspos `cron`.
- Menjaga eksposur alat inti tetap eksplisit dan default-nonaktif.

### Konfigurasi timeout runtime

Plugin `acpx` secara default memberi timeout 120 detik untuk giliran runtime tertanam. Ini memberi harness yang lebih lambat seperti CLI Gemini cukup waktu untuk menyelesaikan startup dan inisialisasi ACP. Timpa jika host Anda memerlukan batas runtime berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Mulai ulang gateway setelah mengubah nilai ini.

### Konfigurasi agen probe kesehatan

Ketika `/acp doctor` atau probe startup opt-in memeriksa backend, Plugin `acpx` bawaan mem-probe satu agen harness. Jika `acp.allowedAgents` disetel, default-nya adalah agen pertama yang diizinkan; jika tidak, default-nya adalah `codex`. Jika deployment Anda memerlukan agen ACP berbeda untuk pemeriksaan kesehatan, setel agen probe secara eksplisit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Mulai ulang gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan non-interaktif — tidak ada TTY untuk menyetujui atau menolak prompt izin penulisan file dan eksekusi shell. Plugin acpx menyediakan dua kunci konfigurasi yang mengontrol cara izin ditangani:

Izin harness ACPX ini terpisah dari persetujuan exec OpenClaw dan terpisah dari flag bypass vendor backend CLI seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah switch break-glass tingkat harness untuk sesi ACP.

### `permissionMode`

Mengontrol operasi mana yang dapat dilakukan agen harness tanpa prompt.

| Nilai           | Perilaku                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Setujui otomatis semua penulisan file dan perintah shell. |
| `approve-reads` | Setujui otomatis hanya pembacaan; penulisan dan exec memerlukan prompt. |
| `deny-all`      | Tolak semua prompt izin.                                  |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi ketika prompt izin akan ditampilkan tetapi tidak ada TTY interaktif yang tersedia (yang selalu terjadi untuk sesi ACP).

| Nilai  | Perilaku                                                         |
| ------ | ---------------------------------------------------------------- |
| `fail` | Batalkan sesi dengan `AcpRuntimeError`. **(default)**            |
| `deny` | Tolak izin secara diam-diam dan lanjutkan (degradasi secara halus). |

### Konfigurasi

Setel melalui konfigurasi Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Mulai ulang gateway setelah mengubah nilai-nilai ini.

<Warning>
OpenClaw secara default menggunakan `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP non-interaktif, setiap penulisan atau exec yang memicu prompt izin dapat gagal dengan `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Jika Anda perlu membatasi izin, setel `nonInteractivePermissions` ke `deny` agar sesi terdegradasi secara halus alih-alih crash.
</Warning>

## Terkait

- [agen ACP](/id/tools/acp-agents) — ikhtisar, runbook operator, konsep
- [Sub-agen](/id/tools/subagents)
- [Routing multi-agen](/id/concepts/multi-agent)
