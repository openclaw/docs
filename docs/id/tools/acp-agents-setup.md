---
read_when:
    - Menginstal atau mengonfigurasi harness acpx untuk Claude Code / Codex / Gemini CLI
    - Mengaktifkan jembatan MCP plugin-tools atau OpenClaw-tools
    - Mengonfigurasi mode izin ACP
summary: 'Menyiapkan agen ACP: konfigurasi harness acpx, penyiapan plugin, izin'
title: Agen ACP — penyiapan
x-i18n:
    generated_at: "2026-07-16T18:37:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Untuk ikhtisar, runbook operator, dan konsep, lihat [agen ACP](/id/tools/acp-agents).

Halaman ini membahas konfigurasi harness acpx, penyiapan plugin untuk jembatan MCP, dan konfigurasi izin.

Gunakan halaman ini hanya saat Anda menyiapkan rute ACP/acpx. Untuk konfigurasi runtime app-server Codex
native, gunakan [harness Codex](/id/plugins/codex-harness). Untuk
kunci API OpenAI atau konfigurasi penyedia model OAuth Codex, gunakan
[OpenAI](/id/providers/openai).

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
| `openclaw`   | Jembatan ACP OpenClaw (`openclaw acp` native)                                                                     |
| `pi`         | [Agen Pengodean Pi](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [CLI Qoder](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [CLI Trae](https://docs.trae.cn/cli)                                                                            |

`factory-droid` dan `factorydroid` juga diresolusikan ke adaptor `droid` bawaan.

Saat OpenClaw menggunakan backend acpx, utamakan nilai-nilai ini untuk `agentId` kecuali konfigurasi acpx Anda mendefinisikan alias agen khusus.
Jika instalasi Cursor lokal Anda masih mengekspos ACP sebagai `agent acp`, timpa perintah agen `cursor` dalam konfigurasi acpx Anda alih-alih mengubah nilai default bawaan.

Penggunaan langsung CLI acpx juga dapat menargetkan adaptor apa pun melalui `--agent <command>`, tetapi jalan keluar mentah tersebut merupakan fitur CLI acpx (bukan jalur `agentId` OpenClaw yang normal).

Kontrol model bergantung pada kapabilitas adaptor. Referensi model ACP Codex
dinormalisasi oleh OpenClaw sebelum dimulai. Harness lain memerlukan `models` ACP serta
dukungan `session/set_model`; jika suatu harness tidak mengekspos kapabilitas ACP tersebut
maupun flag model saat mulainya sendiri, OpenClaw/acpx tidak dapat memaksakan pemilihan model.

## Konfigurasi wajib

Dasar ACP inti:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Nilai default adalah true; tetapkan false untuk menjeda pengiriman ACP sambil mempertahankan kontrol /acp.
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
    maxConcurrentSessions: 8,
    stream: {
      // Nilai default adalah coalesceIdleMs: 350, maxChunkChars: 1800; ditampilkan secara eksplisit di sini.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
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
        // Nilai default sudah true; ditampilkan secara eksplisit di sini.
        spawnSessions: true,
      },
    },
  },
}
```

Jika pemunculan ACP yang terikat ke utas tidak berfungsi, verifikasi flag fitur adaptor terlebih dahulu:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Pengikatan percakapan saat ini tidak memerlukan pembuatan utas turunan. Pengikatan ini memerlukan konteks percakapan aktif dan adaptor kanal yang mengekspos pengikatan percakapan ACP.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference).

## Penyiapan Plugin untuk backend acpx

Instalasi terpaket menggunakan plugin runtime `@openclaw/acpx` resmi untuk ACP.
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
kembali ke plugin terpaket, gunakan jalur paket eksplisit:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Instalasi ruang kerja lokal selama pengembangan:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Kemudian verifikasi kesehatan backend:

```text
/acp doctor
```

### Probe awal runtime acpx

Plugin `acpx` menyematkan runtime ACP secara langsung (tanpa biner `acpx` atau
versi terpisah yang perlu dikonfigurasi). Secara default, plugin ini mendaftarkan backend tertanam selama
Gateway dimulai dan menunggu probe awal sebelum sinyal `ready`
gateway. Tetapkan `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` atau
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` hanya untuk skrip atau lingkungan yang
secara sengaja mempertahankan probe awal dalam keadaan nonaktif. Jalankan `/acp doctor` untuk probe eksplisit
sesuai permintaan.

Timpa perintah agen ACP individual dengan argumen terstruktur saat suatu jalur
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
- `agents.<id>.args` bersifat opsional. Setiap item larik diberi tanda kutip shell sebelum OpenClaw meneruskannya melalui registri string perintah acpx saat ini.

Lihat [Plugin](/id/tools/plugin).

### Pengunduhan adaptor otomatis

`acpx` mengunduh adaptor ACP secara otomatis (misalnya jembatan ACP Claude dan Codex)
melalui `npx` saat pertama kali digunakan. Anda tidak perlu menginstal paket adaptor
secara manual, dan tidak ada langkah pascainstalasi terpisah untuk OpenClaw itu sendiri. Jika
pengunduhan atau pemunculan adaptor gagal, `/acp doctor` melaporkan kegagalan tersebut.

### Jembatan MCP alat Plugin

Secara default, sesi ACPX **tidak** mengekspos alat yang didaftarkan oleh plugin OpenClaw ke
harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code memanggil alat plugin
OpenClaw yang terinstal, seperti pengambilan/penyimpanan memori, aktifkan jembatan khusus:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Yang dilakukan fitur ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-plugin-tools` ke dalam proses
  bootstrap sesi ACPX.
- Mengekspos alat plugin yang sudah didaftarkan oleh plugin OpenClaw yang terinstal dan
  aktif.
- Meneruskan identitas sesi ACP aktif ke factory alat plugin, sehingga
  alat dengan cakupan agen tetap berada dalam namespace agen tersebut.
- Menjaga fitur tetap eksplisit dan secara default nonaktif.

Catatan keamanan dan kepercayaan:

- Hal ini memperluas permukaan alat harness ACP.
- Agen ACP hanya memperoleh akses ke alat plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas kepercayaan yang sama seperti mengizinkan plugin tersebut dieksekusi di
  OpenClaw itu sendiri.
- Tinjau plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` khusus tetap berfungsi seperti sebelumnya. Jembatan alat plugin bawaan merupakan
kemudahan tambahan yang harus diaktifkan secara eksplisit, bukan pengganti konfigurasi server MCP generik.

### Jembatan MCP alat OpenClaw

Secara default, sesi ACPX juga **tidak** mengekspos alat bawaan OpenClaw melalui
MCP. Aktifkan jembatan alat inti terpisah saat agen ACP memerlukan alat
bawaan tertentu seperti `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Yang dilakukan fitur ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-tools` ke dalam proses
  bootstrap sesi ACPX.
- Mengekspos alat bawaan OpenClaw tertentu. Server awal mengekspos `cron`.
- Menjaga eksposur alat inti tetap eksplisit dan secara default nonaktif.

### Konfigurasi batas waktu operasi runtime

Plugin `acpx` memberikan waktu 120
detik secara default untuk operasi permulaan dan kontrol runtime tertanam. Ini memberi harness yang lebih lambat seperti CLI Gemini cukup waktu
untuk menyelesaikan permulaan dan inisialisasi ACP. Timpa nilai ini jika host Anda memerlukan
batas operasi yang berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Giliran runtime menggunakan batas waktu agen/eksekusi OpenClaw, termasuk `/acp timeout`.
`sessions_spawn` tidak menerima penimpaan batas waktu per panggilan; jalur operatornya
adalah `agents.defaults.subagents.runTimeoutSeconds`. Mulai ulang gateway setelah
mengubah `timeoutSeconds`.

### Konfigurasi agen probe kesehatan

Saat `/acp doctor` atau probe awal memeriksa backend, plugin `acpx`
yang dibundel memeriksa satu agen harness. Jika `acp.allowedAgents` ditetapkan, nilai defaultnya adalah
agen pertama yang diizinkan; jika tidak, nilai defaultnya adalah `codex`. Jika deployment Anda
memerlukan agen ACP lain untuk pemeriksaan kesehatan, tetapkan agen probe secara eksplisit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Mulai ulang gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan secara noninteraktif — tidak ada TTY untuk menyetujui atau menolak permintaan izin penulisan file dan eksekusi shell. Plugin acpx menyediakan dua kunci konfigurasi yang mengontrol cara izin ditangani:

Izin harness ACPX ini terpisah dari persetujuan eksekusi OpenClaw dan terpisah dari flag pengabaian vendor backend CLI seperti Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` adalah sakelar darurat tingkat harness untuk sesi ACP.

Untuk perbandingan yang lebih luas antara OpenClaw `tools.exec.mode`, persetujuan Codex Guardian,
dan izin harness ACPX, lihat
[Mode izin](/id/tools/permission-modes).

### `permissionMode`

Mengontrol operasi yang dapat dilakukan agen harness tanpa meminta persetujuan.

| Nilai           | Perilaku                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Setujui otomatis semua penulisan file dan perintah shell.          |
| `approve-reads` | Setujui otomatis hanya pembacaan; penulisan dan eksekusi memerlukan permintaan persetujuan. |
| `deny-all`      | Tolak semua permintaan izin.                              |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi ketika permintaan izin seharusnya ditampilkan, tetapi tidak tersedia TTY interaktif (yang selalu berlaku untuk sesi ACP).

| Nilai  | Perilaku                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Batalkan sesi dengan `PermissionPromptUnavailableError`. **(default)** |
| `deny` | Tolak izin secara diam-diam dan lanjutkan (degradasi secara bertahap).        |

### Konfigurasi

Tetapkan melalui konfigurasi Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Mulai ulang Gateway setelah mengubah nilai-nilai ini.

<Warning>
OpenClaw secara default menggunakan `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP noninteraktif, setiap penulisan atau eksekusi yang memicu permintaan izin dapat gagal dengan `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Jika perlu membatasi izin, tetapkan `nonInteractivePermissions` ke `deny` agar sesi mengalami degradasi secara bertahap alih-alih mengalami crash.
</Warning>

## Terkait

- [Agen ACP](/id/tools/acp-agents) — ikhtisar, panduan operasional operator, konsep
- [Subagen](/id/tools/subagents)
- [Perutean multiagen](/id/concepts/multi-agent)
