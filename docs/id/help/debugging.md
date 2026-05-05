---
read_when:
    - Anda perlu memeriksa keluaran mentah model untuk mendeteksi kebocoran penalaran
    - Anda ingin menjalankan Gateway dalam mode pemantauan saat melakukan iterasi
    - Anda memerlukan alur kerja debugging yang dapat diulang
summary: 'Alat penelusuran kesalahan: mode pemantauan, aliran model mentah, dan pelacakan kebocoran penalaran'
title: Penelusuran Galat
x-i18n:
    generated_at: "2026-05-05T01:47:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

Pembantu debugging untuk keluaran streaming, terutama ketika provider mencampur reasoning ke dalam teks normal.

## Override debug runtime

Gunakan `/debug` di chat untuk menetapkan override konfigurasi **khusus runtime** (memori, bukan disk).
`/debug` dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.
Ini berguna saat Anda perlu mengaktifkan atau menonaktifkan pengaturan yang jarang dipakai tanpa mengedit `openclaw.json`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` menghapus semua override dan kembali ke konfigurasi di disk.

## Keluaran jejak sesi

Gunakan `/trace` saat Anda ingin melihat baris trace/debug milik Plugin dalam satu sesi
tanpa mengaktifkan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Gunakan `/trace` untuk diagnostik Plugin seperti ringkasan debug Active Memory.
Tetap gunakan `/verbose` untuk keluaran status/tool verbose normal, dan tetap gunakan
`/debug` untuk override konfigurasi khusus runtime.

## Jejak siklus hidup Plugin

Gunakan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` saat perintah siklus hidup Plugin terasa lambat
dan Anda membutuhkan pemecahan fase bawaan untuk metadata Plugin, discovery, registry,
runtime mirror, mutasi konfigurasi, dan pekerjaan refresh. Jejak ini bersifat opt-in dan menulis
ke stderr, sehingga keluaran perintah JSON tetap dapat di-parse.

Contoh:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Contoh keluaran:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Gunakan ini untuk investigasi siklus hidup Plugin sebelum memakai profiler CPU.
Jika perintah dijalankan dari checkout sumber, lebih baik ukur runtime hasil build
dengan `node dist/entry.js ...` setelah `pnpm build`; `pnpm openclaw ...`
juga mengukur overhead source-runner.

## Startup CLI dan profiling perintah

Gunakan benchmark startup yang sudah disertakan saat perintah terasa lambat:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Untuk profiling sekali pakai melalui source runner normal, tetapkan
`OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Source runner menambahkan flag profil CPU Node dan menulis `.cpuprofile` untuk
perintah tersebut. Gunakan ini sebelum menambahkan instrumentasi sementara ke kode perintah.

Untuk stall startup yang terlihat seperti pekerjaan filesystem sinkron atau module-loader,
tambahkan flag trace I/O sinkron Node melalui source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` mengaktifkan flag ini secara default untuk child Gateway yang dipantau.
Tetapkan `OPENCLAW_TRACE_SYNC_IO=0` untuk menekan keluaran trace I/O sinkron Node dalam mode watch.

## Mode watch Gateway

Untuk iterasi cepat, jalankan gateway di bawah file watcher:

```bash
pnpm gateway:watch
```

Secara default, ini memulai atau me-restart sesi tmux bernama
`openclaw-gateway-watch-main` (atau varian khusus profil/port seperti
`openclaw-gateway-watch-dev-19001`) dan auto-attach dari terminal interaktif.
Shell non-interaktif, CI, dan panggilan exec agent tetap detached dan mencetak
instruksi attach sebagai gantinya. Attach secara manual bila perlu:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Pane tmux menjalankan watcher mentah:

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

Profilkan waktu CPU Gateway yang dipantau saat men-debug hotspot startup/runtime:

```bash
pnpm gateway:watch --benchmark
```

Wrapper watch memakai `--benchmark` sebelum memanggil Gateway dan menulis
satu `.cpuprofile` V8 per keluarnya child Gateway di bawah
`.artifacts/gateway-watch-profiles/`. Hentikan atau restart gateway yang dipantau untuk
mengosongkan profil saat ini, lalu buka dengan Chrome DevTools atau Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Gunakan `--benchmark-dir <path>` saat Anda ingin menyimpan profil di tempat lain.
Gunakan `--benchmark-no-force` saat Anda ingin child yang dibenchmark melewati
cleanup port `--force` default dan gagal cepat jika port Gateway sudah digunakan.
Mode benchmark menekan spam trace sync-I/O secara default. Tetapkan
`OPENCLAW_TRACE_SYNC_IO=1` dengan `--benchmark` saat Anda secara eksplisit menginginkan profil CPU
dan stack trace sync-I/O Node sekaligus. Dalam mode benchmark, blok trace tersebut
ditulis ke `gateway-watch-output.log` di bawah direktori benchmark dan
difilter dari pane terminal; log Gateway normal tetap terlihat.

Wrapper tmux membawa selector runtime non-rahasia yang umum seperti
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, dan `OPENCLAW_SKIP_CHANNELS` ke dalam pane. Letakkan
kredensial provider di profil/konfigurasi normal Anda, atau gunakan mode foreground mentah
untuk rahasia ephemeral sekali pakai.
Jika Gateway yang dipantau keluar saat startup, watcher menjalankan
`openclaw doctor --fix --non-interactive` sekali dan me-restart child Gateway.
Gunakan `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` saat Anda menginginkan kegagalan startup asli
tanpa pass perbaikan khusus dev.
Pane tmux terkelola juga default ke log Gateway berwarna agar mudah dibaca;
tetapkan `FORCE_COLOR=0` saat memulai `pnpm gateway:watch` untuk menonaktifkan keluaran ANSI.

Watcher me-restart pada file yang relevan dengan build di bawah `src/`, file sumber extension,
metadata `package.json` dan `openclaw.plugin.json` extension, `tsconfig.json`,
`package.json`, dan `tsdown.config.ts`. Perubahan metadata extension me-restart
gateway tanpa memaksa rebuild `tsdown`; perubahan sumber dan konfigurasi tetap
membangun ulang `dist` terlebih dahulu.

Tambahkan flag CLI gateway apa pun setelah `gateway:watch` dan flag tersebut akan diteruskan pada
setiap restart. Menjalankan ulang perintah watch yang sama akan respawn pane tmux bernama tersebut, dan
watcher mentah tetap menjaga single-watcher lock sehingga parent watcher duplikat
diganti alih-alih menumpuk.

## Profil dev + gateway dev (--dev)

Gunakan profil dev untuk mengisolasi state dan menjalankan setup aman yang dapat dibuang untuk
debugging. Ada **dua** flag `--dev`:

- **Global `--dev` (profil):** mengisolasi state di bawah `~/.openclaw-dev` dan
  menetapkan port gateway default ke `19001` (port turunan ikut bergeser).
- **`gateway --dev`: memberi tahu Gateway untuk membuat otomatis konfigurasi +
  workspace default** saat belum ada (dan melewati BOOTSTRAP.md).

Alur yang direkomendasikan (profil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Jika Anda belum memiliki instalasi global, jalankan CLI melalui `pnpm openclaw ...`.

Yang dilakukan ini:

1. **Isolasi profil** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas ikut bergeser)

2. **Bootstrap dev** (`gateway --dev`)
   - Menulis konfigurasi minimal jika belum ada (`gateway.mode=local`, bind loopback).
   - Menetapkan `agent.workspace` ke workspace dev.
   - Menetapkan `agent.skipBootstrap=true` (tanpa BOOTSTRAP.md).
   - Menyemai file workspace jika belum ada:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identitas default: **C3‑PO** (droid protokol).
   - Melewati provider channel dalam mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Alur reset (awal baru):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` adalah flag profil **global** dan dimakan oleh beberapa runner. Jika Anda perlu menuliskannya eksplisit, gunakan bentuk env var:

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

## Logging stream mentah (OpenClaw)

OpenClaw dapat mencatat **stream assistant mentah** sebelum filtering/formatting apa pun.
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

## Logging chunk mentah (pi-mono)

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

> Catatan: ini hanya dikeluarkan oleh proses yang menggunakan provider
> `openai-completions` milik pi-mono.

## Catatan keselamatan

- Log stream mentah dapat mencakup prompt lengkap, keluaran tool, dan data pengguna.
- Simpan log secara lokal dan hapus setelah debugging.
- Jika Anda membagikan log, bersihkan rahasia dan PII terlebih dahulu.

## Terkait

- [Pemecahan masalah](/id/help/troubleshooting)
- [FAQ](/id/help/faq)
