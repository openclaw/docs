---
read_when:
    - Menginstal atau mengonfigurasi harness acpx untuk Claude Code / Codex / Gemini CLI
    - Mengaktifkan jembatan MCP plugin-tools atau OpenClaw-tools
    - Mengonfigurasi mode izin ACP
summary: 'Menyiapkan agen ACP: konfigurasi harness acpx, penyiapan plugin, izin'
title: Agen ACP — penyiapan
x-i18n:
    generated_at: "2026-07-12T14:42:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Untuk ikhtisar, panduan operasional operator, dan konsep, lihat [agen ACP](/id/tools/acp-agents).

Halaman ini membahas konfigurasi harness acpx, penyiapan plugin untuk jembatan MCP, dan konfigurasi izin.

Gunakan halaman ini hanya saat Anda menyiapkan rute ACP/acpx. Untuk konfigurasi runtime app-server Codex native, gunakan [harness Codex](/id/plugins/codex-harness). Untuk kunci API OpenAI atau konfigurasi penyedia model OAuth Codex, gunakan [OpenAI](/id/providers/openai).

Codex memiliki dua rute OpenClaw:

| Rute                       | Konfigurasi/perintah                                    | Halaman penyiapan                       |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server Codex native    | `/codex ...`, referensi agen `openai/gpt-*`            | [Harness Codex](/id/plugins/codex-harness) |
| Adaptor ACP Codex eksplisit | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Halaman ini                             |

Utamakan rute native kecuali Anda secara eksplisit memerlukan perilaku ACP/acpx.

## Dukungan harness acpx (saat ini)

Alias harness acpx bawaan (dari dependensi `acpx` yang versinya disematkan):

| Alias        | Membungkus                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | Jembatan ACP OpenClaw (`openclaw acp` native)                                                                   |
| `pi`         | [Agen Pemrograman Pi](https://github.com/mariozechner/pi)                                                       |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` dan `factorydroid` juga diresolusikan ke adaptor `droid` bawaan.

Saat OpenClaw menggunakan backend acpx, utamakan nilai-nilai ini untuk `agentId`, kecuali konfigurasi acpx Anda mendefinisikan alias agen khusus.
Jika instalasi Cursor lokal Anda masih menyediakan ACP sebagai `agent acp`, timpa perintah agen `cursor` dalam konfigurasi acpx Anda alih-alih mengubah nilai default bawaan.

Penggunaan CLI acpx secara langsung juga dapat menargetkan adaptor arbitrer melalui `--agent <command>`, tetapi mekanisme akses langsung tersebut merupakan fitur CLI acpx (bukan jalur `agentId` OpenClaw yang normal).

Kontrol model bergantung pada kemampuan adaptor. Referensi model ACP Codex dinormalisasi oleh OpenClaw sebelum dimulai. Harness lain memerlukan dukungan `models` ACP beserta `session/set_model`; jika suatu harness tidak menyediakan kemampuan ACP tersebut maupun flag model saat dimulai miliknya sendiri, OpenClaw/acpx tidak dapat memaksakan pemilihan model.

## Konfigurasi wajib

Dasar ACP inti:

```json5
{
  acp: {
    enabled: true,
    // Opsional. Nilai default adalah true; atur ke false untuk menjeda pengiriman ACP sambil mempertahankan kontrol /acp.
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

Jika pembuatan ACP yang terikat utas tidak berfungsi, verifikasi flag fitur adaptor terlebih dahulu:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Pengikatan percakapan saat ini tidak memerlukan pembuatan utas turunan. Pengikatan ini memerlukan konteks percakapan aktif dan adaptor kanal yang menyediakan pengikatan percakapan ACP.

Lihat [Referensi Konfigurasi](/id/gateway/configuration-reference).

## Penyiapan Plugin untuk backend acpx

Instalasi dalam paket menggunakan Plugin runtime resmi `@openclaw/acpx` untuk ACP.
Instal dan aktifkan sebelum menggunakan sesi harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Checkout sumber juga dapat menggunakan Plugin ruang kerja lokal setelah `pnpm install`.

Mulai dengan:

```text
/acp doctor
```

Jika Anda menonaktifkan `acpx`, menolaknya melalui `plugins.allow` / `plugins.deny`, atau ingin beralih kembali ke Plugin dalam paket, gunakan jalur paket eksplisit:

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

### Probe permulaan runtime acpx

Plugin `acpx` menyematkan runtime ACP secara langsung (tanpa biner atau versi `acpx` terpisah yang perlu dikonfigurasi). Secara default, Plugin tersebut mendaftarkan backend tertanam selama permulaan Gateway dan menunggu probe permulaan sebelum sinyal `ready` gateway. Atur `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` atau `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` hanya untuk skrip atau lingkungan yang sengaja menonaktifkan probe permulaan. Jalankan `/acp doctor` untuk probe eksplisit sesuai permintaan.

Timpa perintah agen ACP individual dengan argumen terstruktur saat suatu jalur atau nilai flag harus tetap menjadi satu token argv:

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

`acpx` secara otomatis mengunduh adaptor ACP (misalnya jembatan ACP Claude dan Codex) melalui `npx` saat pertama kali digunakan. Anda tidak perlu menginstal paket adaptor secara manual, dan tidak ada langkah pascainstalasi terpisah untuk OpenClaw itu sendiri. Jika pengunduhan atau pembuatan proses adaptor gagal, `/acp doctor` melaporkan kegagalan tersebut.

### Jembatan MCP alat Plugin

Secara default, sesi ACPX **tidak** menyediakan alat yang didaftarkan Plugin OpenClaw kepada harness ACP.

Jika Anda ingin agen ACP seperti Codex atau Claude Code memanggil alat Plugin OpenClaw yang terinstal, seperti pengambilan/penyimpanan memori, aktifkan jembatan khusus:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Fungsi konfigurasi ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-plugin-tools` ke proses bootstrap sesi ACPX.
- Menyediakan alat Plugin yang sudah didaftarkan oleh Plugin OpenClaw yang terinstal dan aktif.
- Menjaga fitur tetap eksplisit dan nonaktif secara default.

Catatan keamanan dan kepercayaan:

- Ini memperluas cakupan alat harness ACP.
- Agen ACP hanya memperoleh akses ke alat Plugin yang sudah aktif di gateway.
- Perlakukan ini sebagai batas kepercayaan yang sama dengan mengizinkan Plugin tersebut berjalan di OpenClaw itu sendiri.
- Tinjau Plugin yang terinstal sebelum mengaktifkannya.

`mcpServers` khusus tetap berfungsi seperti sebelumnya. Jembatan alat Plugin bawaan merupakan kemudahan tambahan yang perlu diaktifkan secara eksplisit, bukan pengganti konfigurasi server MCP generik.

### Jembatan MCP alat OpenClaw

Secara default, sesi ACPX juga **tidak** menyediakan alat bawaan OpenClaw melalui MCP. Aktifkan jembatan alat inti yang terpisah saat agen ACP memerlukan alat bawaan tertentu seperti `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Fungsi konfigurasi ini:

- Menyuntikkan server MCP bawaan bernama `openclaw-tools` ke proses bootstrap sesi ACPX.
- Menyediakan alat bawaan OpenClaw tertentu. Server awal menyediakan `cron`.
- Menjaga penyediaan alat inti tetap eksplisit dan nonaktif secara default.

### Konfigurasi batas waktu operasi runtime

Plugin `acpx` memberikan waktu 120 detik secara default untuk operasi permulaan dan kontrol runtime tertanam. Ini memberikan cukup waktu bagi harness yang lebih lambat seperti Gemini CLI untuk menyelesaikan permulaan dan inisialisasi ACP. Timpa nilai tersebut jika host Anda memerlukan batas operasi yang berbeda:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Giliran runtime menggunakan batas waktu agen/proses OpenClaw, termasuk `/acp timeout`.
`sessions_spawn` tidak menerima penimpaan batas waktu per panggilan; jalur operatornya adalah `agents.defaults.subagents.runTimeoutSeconds`. Mulai ulang gateway setelah mengubah `timeoutSeconds`.

### Konfigurasi agen probe kesehatan

Saat `/acp doctor` atau probe permulaan memeriksa backend, Plugin `acpx` yang disertakan memeriksa satu agen harness. Jika `acp.allowedAgents` diatur, nilai defaultnya adalah agen pertama yang diizinkan; jika tidak, nilai defaultnya adalah `codex`. Jika penerapan Anda memerlukan agen ACP yang berbeda untuk pemeriksaan kesehatan, atur agen probe secara eksplisit:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Mulai ulang gateway setelah mengubah nilai ini.

## Konfigurasi izin

Sesi ACP berjalan secara noninteraktif—tidak ada TTY untuk menyetujui atau menolak permintaan izin penulisan berkas dan eksekusi shell. Plugin acpx menyediakan dua kunci konfigurasi yang mengontrol cara penanganan izin:

Izin harness ACPX ini terpisah dari persetujuan eksekusi OpenClaw dan terpisah dari flag penerobosan vendor backend CLI seperti `--permission-mode bypassPermissions` milik Claude CLI. `approve-all` ACPX adalah sakelar darurat tingkat harness untuk sesi ACP.

Untuk perbandingan lebih luas antara `tools.exec.mode` OpenClaw, persetujuan Codex Guardian, dan izin harness ACPX, lihat [Mode izin](/id/tools/permission-modes).

### `permissionMode`

Mengontrol operasi yang dapat dilakukan agen harness tanpa meminta konfirmasi.

| Nilai           | Perilaku                                                                  |
| --------------- | ------------------------------------------------------------------------- |
| `approve-all`   | Menyetujui otomatis semua penulisan file dan perintah shell.              |
| `approve-reads` | Menyetujui otomatis hanya pembacaan; penulisan dan eksekusi memerlukan konfirmasi. |
| `deny-all`      | Menolak semua permintaan izin.                                            |

### `nonInteractivePermissions`

Mengontrol apa yang terjadi ketika permintaan izin seharusnya ditampilkan tetapi TTY interaktif tidak tersedia (yang selalu terjadi pada sesi ACP).

| Nilai  | Perilaku                                                                       |
| ------ | ------------------------------------------------------------------------------ |
| `fail` | Membatalkan sesi dengan `PermissionPromptUnavailableError`. **(bawaan)**       |
| `deny` | Menolak izin secara diam-diam dan melanjutkan (degradasi secara anggun).       |

### Konfigurasi

Atur melalui konfigurasi Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Mulai ulang Gateway setelah mengubah nilai-nilai ini.

<Warning>
OpenClaw secara bawaan menggunakan `permissionMode=approve-reads` dan `nonInteractivePermissions=fail`. Dalam sesi ACP noninteraktif, setiap penulisan atau eksekusi yang memicu permintaan izin dapat gagal dengan `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Jika Anda perlu membatasi izin, atur `nonInteractivePermissions` ke `deny` agar sesi mengalami degradasi secara anggun alih-alih berhenti akibat galat.
</Warning>

## Terkait

- [Agen ACP](/id/tools/acp-agents) — ikhtisar, panduan operasional, konsep
- [Subagen](/id/tools/subagents)
- [Perutean multiagen](/id/concepts/multi-agent)
