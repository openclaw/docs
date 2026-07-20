---
read_when:
    - Menginstal atau mengonfigurasi harness acpx untuk Claude Code / Codex / Gemini CLI
    - Mengaktifkan jembatan MCP plugin-tools atau OpenClaw-tools
    - Mengonfigurasi mode izin ACP
summary: 'Menyiapkan agen ACP: konfigurasi harness acpx, penyiapan plugin, izin'
title: Agen ACP — penyiapan
x-i18n:
    generated_at: "2026-07-20T04:01:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a1742373d9e65733a2f969422253c3b2c0aa33e0b4caa4d5ab769dc2cc5d97
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Untuk ikhtisar, runbook operator, dan konsep, lihat [agen ACP](/id/tools/acp-agents).

Halaman ini membahas konfigurasi harness acpx, penyiapan plugin untuk bridge MCP, dan konfigurasi izin.

Gunakan halaman ini hanya saat menyiapkan rute ACP/acpx. Untuk konfigurasi runtime app-server Codex native, gunakan [harness Codex](/id/plugins/codex-harness). Untuk kunci API OpenAI atau konfigurasi penyedia model OAuth Codex, gunakan [OpenAI](/id/providers/openai).

Codex memiliki dua rute OpenClaw:

| Rute                       | Konfigurasi/perintah                                    | Halaman penyiapan                       |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server Codex native    | `/codex ...`, referensi agen `openai/gpt-*`                | [Harness Codex](/id/plugins/codex-harness) |
| Adaptor ACP Codex eksplisit | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Halaman ini                             |

Utamakan rute native kecuali Anda secara eksplisit memerlukan perilaku ACP/acpx.

## Dukungan harness acpx (saat ini)

Alias harness acpx bawaan (dari dependensi `acpx` yang disematkan):

| Alias        | Membungkus                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [CLI Codex](https://codex.openai.com)                                                                           |
| `copilot`    | [CLI GitHub Copilot](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [CLI Cursor](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [CLI Gemini](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [CLI iFlow](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [CLI Kimi](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [CLI Kiro](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | Bridge ACP OpenClaw (`openclaw acp` native)                                                                     |
| `pi`         | [Agen Pengodean Pi](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [CLI Qoder](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [CLI Trae](https://docs.trae.cn/cli)                                                                            |

`factory-droid` dan `factorydroid` juga diresolusikan ke adaptor `droid` bawaan.

Saat OpenClaw menggunakan backend acpx, utamakan nilai-nilai ini untuk `agentId` kecuali konfigurasi acpx Anda mendefinisikan alias agen khusus.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, timpa perintah agen `cursor` dalam konfigurasi acpx Anda alih-alih mengubah nilai bawaan.

Penggunaan langsung CLI acpx juga dapat menargetkan adaptor apa pun melalui `--agent <command>`, tetapi jalur keluar mentah tersebut merupakan fitur CLI acpx (bukan jalur `agentId` OpenClaw yang normal).

Kontrol model bergantung pada kapabilitas adaptor. Referensi model ACP Codex
dinormalisasi oleh OpenClaw sebelum dimulai. Harness lain memerlukan `models` ACP beserta
dukungan `session/set_model`; jika harness tidak mengekspos kapabilitas ACP tersebut
maupun flag model startup-nya sendiri, OpenClaw/acpx tidak dapat memaksakan pemilihan model.

## Konfigurasi wajib

Baseline ACP inti:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Nilai bawaan true; atur ke false untuk menjeda pengiriman ACP sambil mempertahankan kontrol /acp.
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
      "qwen",
    ],
    stream: {
      deliveryMode: "live",
    },
  },
}
```

Konfigurasi pengikatan utas bersifat khusus untuk adaptor kanal. Contoh untuk Discord:

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
        // Nilai bawannya sudah true; ditampilkan secara eksplisit di sini.
        spawnSessions: true,
      },
    },
  },
}
```

Jika pemunculan ACP yang terikat utas tidak berfungsi, periksa flag fitur adaptor terlebih dahulu:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Pengikatan percakapan saat ini tidak memerlukan pembuatan utas turunan. Pengikatan tersebut memerlukan konteks percakapan aktif dan adaptor kanal yang mengekspos pengikatan percakapan ACP.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference).

## Penyiapan plugin untuk backend acpx

Instalasi terpaket menggunakan plugin runtime resmi `@openclaw/acpx` untuk ACP.
Instal dan aktifkan plugin tersebut sebelum menggunakan sesi harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkout sumber juga dapat menggunakan plugin ruang kerja lokal setelah `pnpm install`.

Mulai dengan:

```text
/acp doctor
```

Jika Anda menonaktifkan `acpx`, menolaknya melalui `plugins.allow` / `plugins.deny`, atau ingin
beralih kembali ke plugin terpaket, gunakan jalur paket eksplisit:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalasi ruang kerja lokal selama pengembangan:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Kemudian periksa kesehatan backend:

```text
/acp doctor
```

### Probe startup runtime acpx

Plugin `acpx` menyematkan runtime ACP secara langsung (tanpa biner atau
versi `acpx` terpisah yang perlu dikonfigurasi). Secara default, plugin ini mendaftarkan backend tertanam selama
startup Gateway dan menunggu probe startup sebelum sinyal `ready`
gateway. Atur `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` atau
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` hanya untuk skrip atau lingkungan yang
secara sengaja mempertahankan probe startup tetap dinonaktifkan. Jalankan `/acp doctor` untuk probe
eksplisit sesuai permintaan.

Timpa perintah agen ACP individual dengan argumen terstruktur ketika suatu jalur
atau nilai flag harus tetap menjadi satu token argv:

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

- `agents.<id>.command` adalah berkas yang dapat dieksekusi atau string perintah yang sudah ada untuk agen ACP tersebut.
- `agents.<id>.args` bersifat opsional. Setiap item array diberi tanda kutip shell sebelum OpenClaw meneruskannya melalui registri string perintah acpx saat ini.

Lihat [Plugin](/id/tools/plugin).

### Pengunduhan adaptor otomatis

`acpx` mengunduh adaptor ACP secara otomatis (misalnya bridge ACP Claude dan Codex)
melalui `npx` saat pertama kali digunakan. Anda tidak perlu menginstal paket adaptor
secara manual, dan tidak ada langkah postinstall terpisah untuk OpenClaw itu sendiri. Jika
pengunduhan atau pemunculan adaptor gagal, `/acp doctor` melaporkan kegagalan tersebut.

### Bridge MCP alat plugin

Secara default, sesi ACPX **tidak** mengekspos alat yang didaftarkan oleh plugin OpenClaw ke
harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code memanggil alat plugin
OpenClaw yang terinstal, seperti pengambilan/penyimpanan memori, aktifkan bridge khusus:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Tindakan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-plugin-tools` ke dalam bootstrap
  sesi ACPX.
- Mengekspos alat plugin yang telah didaftarkan oleh plugin OpenClaw yang terinstal
  dan diaktifkan.
- Meneruskan identitas sesi ACP aktif ke factory alat plugin, sehingga
  alat dengan cakupan agen tetap berada dalam namespace agen tersebut.
- Mempertahankan fitur ini sebagai fitur eksplisit dan nonaktif secara default.

Catatan keamanan dan kepercayaan:

- Ini memperluas permukaan alat harness ACP.
- Agen ACP hanya mendapatkan akses ke alat plugin yang telah aktif di gateway.
- Perlakukan ini sebagai batas kepercayaan yang sama seperti mengizinkan plugin tersebut dieksekusi di
  OpenClaw itu sendiri.
- Tinjau plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` khusus tetap berfungsi seperti sebelumnya. Bridge alat plugin bawaan merupakan
kemudahan tambahan yang dapat diaktifkan, bukan pengganti konfigurasi server MCP generik.

### Bridge MCP alat OpenClaw

Secara default, sesi ACPX juga **tidak** mengekspos alat bawaan OpenClaw melalui
MCP. Aktifkan bridge alat inti terpisah ketika agen ACP memerlukan alat bawaan
terpilih seperti `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Tindakan ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-tools` ke dalam bootstrap
  sesi ACPX.
- Mengekspos alat bawaan OpenClaw terpilih. Server awal mengekspos `cron`.
- Mempertahankan eksposur alat inti sebagai fitur eksplisit dan nonaktif secara default.

### Konfigurasi batas waktu operasi runtime

Plugin `acpx` secara default memberikan waktu 120
detik untuk operasi startup dan kontrol runtime tertanam. Hal ini memberi harness yang lebih lambat seperti CLI Gemini cukup waktu
untuk menyelesaikan startup dan inisialisasi ACP. Timpa nilai tersebut jika host Anda memerlukan
batas operasi yang berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Giliran runtime menggunakan batas waktu agen/proses OpenClaw, termasuk `/acp timeout`.
`sessions_spawn` tidak menerima penggantian batas waktu per panggilan; jalur operatornya
adalah `agents.defaults.subagents.runTimeoutSeconds`. Mulai ulang gateway setelah
mengubah `timeoutSeconds`.

### Konfigurasi agen probe kesehatan

Saat `/acp doctor` atau probe startup memeriksa backend, plugin `acpx`
yang dibundel memeriksa satu agen harness. Jika `acp.allowedAgents` diatur, nilai bawaannya adalah
agen pertama yang diizinkan; jika tidak, nilai bawaannya adalah `codex`. Jika deployment Anda
memerlukan agen ACP yang berbeda untuk pemeriksaan kesehatan, atur agen probe secara eksplisit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Mulai ulang gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan secara noninteraktif — tidak ada TTY untuk menyetujui atau menolak prompt izin penulisan berkas dan eksekusi shell. Plugin acpx menyediakan dua kunci konfigurasi yang mengontrol cara izin ditangani:

Izin harness ACPX ini terpisah dari persetujuan eksekusi OpenClaw dan terpisah dari flag bypass vendor backend CLI seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah sakelar darurat tingkat harness untuk sesi ACP.

Untuk perbandingan yang lebih luas antara OpenClaw `tools.exec.mode`, persetujuan Codex Guardian,
dan izin harness ACPX, lihat
[Mode izin](/id/tools/permission-modes).

### `permissionMode`

Mengontrol operasi yang dapat dilakukan agen harness tanpa meminta konfirmasi.

| Nilai           | Perilaku                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Menyetujui otomatis semua penulisan file dan perintah shell.          |
| `approve-reads` | Menyetujui otomatis hanya pembacaan; penulisan dan eksekusi memerlukan konfirmasi. |
| `deny-all`      | Menolak semua permintaan izin.                              |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi ketika permintaan izin seharusnya ditampilkan, tetapi TTY interaktif tidak tersedia (yang selalu terjadi untuk sesi ACP).

| Nilai  | Perilaku                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Menghentikan sesi dengan `PermissionPromptUnavailableError`. **(bawaan)** |
| `deny` | Menolak izin secara diam-diam dan melanjutkan (degradasi secara anggun).        |

### Konfigurasi

Atur melalui konfigurasi Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Mulai ulang Gateway setelah mengubah nilai-nilai ini.

<Warning>
OpenClaw secara bawaan menggunakan `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP noninteraktif, setiap penulisan atau eksekusi yang memicu permintaan izin dapat gagal dengan `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Jika Anda perlu membatasi izin, atur `nonInteractivePermissions` ke `deny` agar sesi mengalami degradasi secara anggun alih-alih mengalami crash.
</Warning>

## Terkait

- [Agen ACP](/id/tools/acp-agents) — ringkasan, panduan operasional operator, konsep
- [Subagen](/id/tools/subagents)
- [Perutean multiagen](/id/concepts/multi-agent)
