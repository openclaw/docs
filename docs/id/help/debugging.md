---
read_when:
    - Anda perlu memeriksa keluaran mentah model untuk kebocoran penalaran
    - Anda ingin menjalankan Gateway dalam mode watch saat melakukan iterasi
    - Anda memerlukan alur kerja penelusuran kesalahan yang dapat diulang
summary: 'Alat pemecahan masalah: mode pantau, aliran model mentah, dan penelusuran kebocoran penalaran'
title: Penelusuran Kesalahan
x-i18n:
    generated_at: "2026-05-03T21:33:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

Pembantu debugging untuk output streaming, terutama saat provider mencampurkan reasoning ke dalam teks normal.

## Override debug runtime

Gunakan `/debug` di chat untuk mengatur override konfigurasi **khusus runtime** (memori, bukan disk).
`/debug` dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.
Ini berguna saat Anda perlu mengaktifkan atau menonaktifkan pengaturan yang jarang digunakan tanpa mengedit `openclaw.json`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` menghapus semua override dan kembali ke konfigurasi di disk.

## Output jejak sesi

Gunakan `/trace` saat Anda ingin melihat baris trace/debug milik Plugin dalam satu sesi
tanpa mengaktifkan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Gunakan `/trace` untuk diagnostik Plugin seperti ringkasan debug Active Memory.
Tetap gunakan `/verbose` untuk output status/tool verbose normal, dan tetap gunakan
`/debug` untuk override konfigurasi khusus runtime.

## Jejak siklus hidup Plugin

Gunakan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` saat perintah siklus hidup Plugin terasa lambat
dan Anda memerlukan rincian fase bawaan untuk metadata Plugin, discovery, registry,
runtime mirror, mutasi konfigurasi, dan pekerjaan refresh. Trace ini bersifat opt-in dan menulis
ke stderr, sehingga output perintah JSON tetap dapat di-parse.

Contoh:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Contoh output:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Gunakan ini untuk investigasi siklus hidup Plugin sebelum memakai CPU profiler.
Jika perintah berjalan dari source checkout, sebaiknya ukur runtime hasil build
dengan `node dist/entry.js ...` setelah `pnpm build`; `pnpm openclaw ...`
juga mengukur overhead source-runner.

## Startup CLI dan profiling perintah

Gunakan benchmark startup yang sudah disertakan saat sebuah perintah terasa lambat:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Untuk profiling sekali pakai melalui source runner normal, atur
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Source runner menambahkan flag profil CPU Node dan menulis `.cpuprofile` untuk
perintah tersebut. Gunakan ini sebelum menambahkan instrumentasi sementara ke kode perintah.

## Mode watch Gateway

Untuk iterasi cepat, jalankan gateway di bawah file watcher:

```bash
pnpm gateway:watch
```

Secara default, ini memulai atau memulai ulang sesi tmux bernama
`openclaw-gateway-watch-main` (atau varian khusus profil/port seperti
`openclaw-gateway-watch-dev-19001`) dan otomatis attach dari terminal interaktif.
Shell noninteraktif, CI, dan panggilan exec agen tetap detached dan mencetak
instruksi attach sebagai gantinya. Attach secara manual saat diperlukan:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Panel tmux menjalankan watcher mentah:

```bash
node scripts/watch-node.mjs gateway --force
```

Gunakan mode foreground saat tmux tidak diinginkan:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Nonaktifkan auto-attach sambil tetap mempertahankan manajemen tmux:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilkan waktu CPU Gateway yang diawasi saat men-debug hotspot startup/runtime:

```bash
pnpm gateway:watch --benchmark
```

Wrapper watch mengonsumsi `--benchmark` sebelum memanggil Gateway dan menulis
satu `.cpuprofile` V8 per exit child Gateway di bawah
`.artifacts/gateway-watch-profiles/`. Hentikan atau mulai ulang gateway yang diawasi untuk
flush profil saat ini, lalu buka dengan Chrome DevTools atau Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Gunakan `--benchmark-dir <path>` saat Anda ingin profil berada di tempat lain.
Gunakan `--benchmark-no-force` saat Anda ingin child yang di-benchmark melewati
pembersihan port default `--force` dan gagal cepat jika port Gateway sudah
digunakan.

Wrapper tmux membawa selector runtime nonrahasia umum seperti
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, dan `OPENCLAW_SKIP_CHANNELS` ke dalam panel. Letakkan
kredensial provider di profil/konfigurasi normal Anda, atau gunakan mode foreground mentah
untuk secret sementara sekali pakai.
Jika Gateway yang diawasi keluar saat startup, watcher menjalankan
`openclaw doctor --fix --non-interactive` sekali dan memulai ulang child Gateway.
Gunakan `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` saat Anda menginginkan kegagalan startup
asli tanpa pass perbaikan khusus dev.
Panel tmux terkelola juga default-nya menggunakan log Gateway berwarna agar mudah dibaca;
atur `FORCE_COLOR=0` saat memulai `pnpm gateway:watch` untuk menonaktifkan output ANSI.

Watcher memulai ulang saat ada file relevan-build di bawah `src/`, file sumber extension,
metadata `package.json` dan `openclaw.plugin.json` extension, `tsconfig.json`,
`package.json`, dan `tsdown.config.ts`. Perubahan metadata extension memulai ulang
gateway tanpa memaksa rebuild `tsdown`; perubahan sumber dan konfigurasi tetap
membangun ulang `dist` terlebih dahulu.

Tambahkan flag CLI gateway apa pun setelah `gateway:watch` dan flag tersebut akan diteruskan pada
setiap restart. Menjalankan ulang perintah watch yang sama akan respawn panel tmux bernama, dan
watcher mentah tetap mempertahankan kunci single-watcher sehingga parent watcher duplikat
diganti, bukan menumpuk.

## Profil dev + Gateway dev (--dev)

Gunakan profil dev untuk mengisolasi state dan menjalankan setup yang aman dan dapat dibuang untuk
debugging. Ada **dua** flag `--dev`:

- **`--dev` global (profil):** mengisolasi state di bawah `~/.openclaw-dev` dan
  default port gateway ke `19001` (port turunan bergeser bersamanya).
- **`gateway --dev`: memberi tahu Gateway untuk otomatis membuat konfigurasi +
  workspace default** saat belum ada (dan melewati BOOTSTRAP.md).

Alur yang direkomendasikan (profil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Jika Anda belum memiliki instalasi global, jalankan CLI melalui `pnpm openclaw ...`.

Yang dilakukan ini:

1. **Isolasi profil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas bergeser sesuai itu)

2. **Bootstrap dev** (`gateway --dev`)
   - Menulis konfigurasi minimal jika belum ada (`gateway.mode=local`, bind loopback).
   - Mengatur `agent.workspace` ke workspace dev.
   - Mengatur `agent.skipBootstrap=true` (tanpa BOOTSTRAP.md).
   - Menanam file workspace jika belum ada:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identitas default: **C3‑PO** (droid protokol).
   - Melewati provider channel dalam mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Alur reset (mulai baru):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` adalah flag profil **global** dan dimakan oleh beberapa runner. Jika Anda perlu menuliskannya secara eksplisit, gunakan bentuk env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` menghapus konfigurasi, kredensial, sesi, dan workspace dev (menggunakan
`trash`, bukan `rm`), lalu membuat ulang setup dev default.

<Tip>
Jika gateway non-dev sudah berjalan (launchd atau systemd), hentikan terlebih dahulu:

```bash
openclaw gateway stop
```

</Tip>

## Pencatatan stream mentah (OpenClaw)

OpenClaw dapat mencatat **stream assistant mentah** sebelum pemfilteran/pemformatan apa pun.
Ini adalah cara terbaik untuk melihat apakah reasoning datang sebagai delta teks biasa
(atau sebagai blok thinking terpisah).

Aktifkan melalui CLI:

```bash
pnpm gateway:watch --raw-stream
```

Override path opsional:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Env var ekuivalen:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

File default:

`~/.openclaw/logs/raw-stream.jsonl`

## Pencatatan chunk mentah (pi-mono)

Untuk menangkap **chunk kompatibel OpenAI mentah** sebelum di-parse menjadi blok,
pi-mono mengekspos logger terpisah:

```bash
PI_RAW_STREAM=1
```

Path opsional:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

File default:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Catatan: ini hanya dipancarkan oleh proses yang menggunakan provider
> `openai-completions` milik pi-mono.

## Catatan keamanan

- Log stream mentah dapat menyertakan prompt lengkap, output tool, dan data pengguna.
- Simpan log secara lokal dan hapus setelah debugging.
- Jika Anda membagikan log, bersihkan secret dan PII terlebih dahulu.

## Terkait

- [Pemecahan masalah](/id/help/troubleshooting)
- [FAQ](/id/help/faq)
