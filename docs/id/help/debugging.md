---
read_when:
    - Anda perlu memeriksa keluaran model mentah untuk kebocoran penalaran
    - Anda ingin menjalankan Gateway dalam mode watch saat melakukan iterasi
    - Anda memerlukan alur kerja debugging yang dapat diulang
summary: 'Alat debugging: mode watch, stream model mentah, dan pelacakan kebocoran penalaran'
title: Debugging
x-i18n:
    generated_at: "2026-06-27T17:35:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

Pembantu debugging untuk output streaming, terutama ketika penyedia mencampurkan penalaran ke dalam teks normal.

## Override debug runtime

Gunakan `/debug` di chat untuk menetapkan override konfigurasi **hanya runtime** (memori, bukan disk).
`/debug` dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.
Ini berguna saat Anda perlu mengubah pengaturan yang jarang dipakai tanpa mengedit `openclaw.json`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` menghapus semua override dan kembali ke konfigurasi di disk.

## Output trace sesi

Gunakan `/trace` ketika Anda ingin melihat baris trace/debug milik Plugin dalam satu sesi
tanpa mengaktifkan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Gunakan `/trace` untuk diagnostik Plugin seperti ringkasan debug Active Memory.
Tetap gunakan `/verbose` untuk output status/tool verbose normal, dan tetap gunakan
`/debug` untuk override konfigurasi hanya runtime.

## Trace siklus hidup Plugin

Gunakan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ketika perintah siklus hidup Plugin terasa lambat
dan Anda memerlukan pemecahan fase bawaan untuk metadata Plugin, discovery, registry,
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

Gunakan ini untuk investigasi siklus hidup Plugin sebelum menggunakan profiler CPU.
Jika perintah berjalan dari checkout sumber, sebaiknya ukur runtime hasil build
dengan `node dist/entry.js ...` setelah `pnpm build`; `pnpm openclaw ...`
juga mengukur overhead source-runner.

## Startup CLI dan profiling perintah

Gunakan benchmark startup yang sudah disertakan ketika sebuah perintah terasa lambat:

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

Untuk hambatan startup yang tampak seperti pekerjaan filesystem sinkron atau module-loader,
tambahkan flag trace I/O sinkron Node melalui source runner:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` membiarkan flag ini dinonaktifkan secara default untuk child
Gateway yang dipantau. Tetapkan `OPENCLAW_TRACE_SYNC_IO=1` ketika Anda secara eksplisit menginginkan
output trace I/O sinkron Node dalam mode watch.

## Mode watch Gateway

Untuk iterasi cepat, jalankan gateway di bawah file watcher:

```bash
pnpm gateway:watch
```

Secara default, ini memulai atau memulai ulang sesi tmux bernama
`openclaw-gateway-watch-main` (atau varian khusus profil/port seperti
`openclaw-gateway-watch-dev-19001`) dan otomatis attach dari terminal interaktif.
Shell non-interaktif, CI, dan panggilan exec agen tetap detached dan mencetak instruksi attach
sebagai gantinya. Attach secara manual bila diperlukan:

```bash
tmux attach -t openclaw-gateway-watch-main
```

Pane tmux menjalankan watcher mentah:

```bash
node scripts/watch-node.mjs gateway --force
```

Gunakan mode foreground ketika tmux tidak diinginkan:

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

Wrapper watch mengonsumsi `--benchmark` sebelum memanggil Gateway dan menulis
satu `.cpuprofile` V8 per keluarnya child Gateway di bawah
`.artifacts/gateway-watch-profiles/`. Hentikan atau mulai ulang gateway yang dipantau untuk
flush profil saat ini, lalu buka dengan Chrome DevTools atau Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Gunakan `--benchmark-dir <path>` ketika Anda ingin profil berada di tempat lain.
Gunakan `--benchmark-no-force` ketika Anda ingin child yang dibenchmark melewati
pembersihan port default `--force` dan cepat gagal jika port Gateway sudah digunakan.
Mode benchmark menekan spam trace sync-I/O secara default. Tetapkan
`OPENCLAW_TRACE_SYNC_IO=1` bersama `--benchmark` ketika Anda secara eksplisit menginginkan profil CPU
dan stack trace sync-I/O Node sekaligus. Dalam mode benchmark, blok trace tersebut
ditulis ke `gateway-watch-output.log` di bawah direktori benchmark dan
difilter dari pane terminal; log Gateway normal tetap terlihat.

Wrapper tmux membawa selector runtime non-rahasia umum seperti
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, dan `OPENCLAW_SKIP_CHANNELS` ke dalam pane. Letakkan
kredensial penyedia di profil/konfigurasi normal Anda, atau gunakan mode foreground mentah
untuk rahasia ephemeral sekali pakai.
Jika Gateway yang dipantau keluar saat startup, watcher menjalankan
`openclaw doctor --fix --non-interactive` sekali dan memulai ulang child Gateway.
Gunakan `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` ketika Anda menginginkan kegagalan startup asli
tanpa lintasan perbaikan khusus dev.
Pane tmux terkelola juga default ke log Gateway berwarna agar mudah dibaca;
tetapkan `FORCE_COLOR=0` saat memulai `pnpm gateway:watch` untuk menonaktifkan output ANSI.

Watcher memulai ulang pada file relevan-build di bawah `src/`, file sumber ekstensi,
metadata `package.json` dan `openclaw.plugin.json` ekstensi, `tsconfig.json`,
`package.json`, dan `tsdown.config.ts`. Perubahan metadata ekstensi memulai ulang
gateway tanpa memaksa rebuild `tsdown`; perubahan sumber dan konfigurasi tetap
membangun ulang `dist` terlebih dahulu.

Tambahkan flag CLI gateway apa pun setelah `gateway:watch` dan flag tersebut akan diteruskan pada
setiap restart. Menjalankan ulang perintah watch yang sama respawn pane tmux bernama tersebut, dan
watcher mentah tetap mempertahankan lock single-watcher sehingga parent watcher duplikat
diganti alih-alih menumpuk.

## Profil dev + gateway dev (--dev)

Gunakan profil dev untuk mengisolasi state dan menjalankan setup aman yang sekali pakai untuk
debugging. Ada **dua** flag `--dev`:

- **`--dev` global (profil):** mengisolasi state di bawah `~/.openclaw-dev` dan
  menetapkan default port gateway ke `19001` (port turunan bergeser bersamanya).
- **`gateway --dev`: memberi tahu Gateway untuk otomatis membuat konfigurasi +
  workspace default** saat belum ada (dan melewati BOOTSTRAP.md).

Alur yang direkomendasikan (profil dev + bootstrap dev):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Jika Anda belum memiliki instalasi global, jalankan CLI melalui `pnpm openclaw ...`.

Apa yang dilakukan ini:

1. **Isolasi profil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas bergeser sesuai itu)

2. **Bootstrap dev** (`gateway --dev`)
   - Menulis konfigurasi minimal jika belum ada (`gateway.mode=local`, bind loopback).
   - Menetapkan `agent.workspace` ke workspace dev.
   - Menetapkan `agent.skipBootstrap=true` (tanpa BOOTSTRAP.md).
   - Mengisi file workspace jika belum ada:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identitas default: **C3-PO** (droid protokol).
   - Melewati penyedia channel dalam mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Alur reset (mulai baru):

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

OpenClaw dapat mencatat **stream asisten mentah** sebelum filtering/formatting apa pun.
Ini adalah cara terbaik untuk melihat apakah penalaran datang sebagai delta teks biasa
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

## Logging chunk mentah kompatibel OpenAI

Untuk menangkap **chunk mentah kompatibel OpenAI** sebelum di-parse menjadi blok,
aktifkan logger transport:

```bash
OPENCLAW_RAW_STREAM=1
```

Path opsional:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

File default:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## Catatan keamanan

- Log stream mentah dapat mencakup prompt lengkap, output tool, dan data pengguna.
- Simpan log secara lokal dan hapus setelah debugging.
- Jika Anda membagikan log, bersihkan rahasia dan PII terlebih dahulu.

## Debugging di VSCode

Source map diperlukan untuk mengaktifkan debugging di IDE berbasis VSCode karena banyak file yang dihasilkan berakhir dengan nama hash sebagai bagian dari proses build. Konfigurasi `launch.json` yang disertakan menargetkan layanan Gateway, tetapi dapat cepat disesuaikan untuk tujuan lain:

1. **Rebuild and Debug Gateway** - Men-debug layanan Gateway setelah membuat build baru
2. **Debug Gateway** - Men-debug layanan Gateway dari build yang sudah ada

### Setup

Konfigurasi default **Rebuild and Debug Gateway** sudah lengkap, konfigurasi ini akan otomatis menghapus folder `/dist` dan membangun ulang proyek dengan debugging diaktifkan:

1. Buka panel **Run and Debug** dari Activity Bar atau tekan `Ctrl`+`Shift`+`D`
2. Di IDE, pastikan **Rebuild and Debug Gateway** dipilih di dropdown konfigurasi lalu tekan tombol **Start Debugging**

Sebagai alternatif - jika Anda lebih suka mengelola proses build dan debug secara manual:

1. Buka terminal dan aktifkan source map:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Di terminal yang sama, bangun ulang proyek: `pnpm clean:dist && pnpm build`
3. Di IDE, pilih opsi **Debug Gateway** di dropdown konfigurasi **Run and Debug** lalu tekan tombol **Start Debugging**

Sekarang Anda dapat menetapkan breakpoint di file sumber TypeScript Anda (direktori `src/`) dan debugger akan memetakan breakpoint dengan benar ke JavaScript hasil kompilasi melalui source map. Anda akan dapat memeriksa variabel, melangkah melalui kode, dan memeriksa call stack seperti yang diharapkan.

### Catatan

- Jika menggunakan opsi **"Rebuild and Debug Gateway"** - setiap kali debugger diluncurkan, opsi ini akan sepenuhnya menghapus folder `/dist` dan menjalankan `pnpm build` penuh dengan source map diaktifkan sebelum memulai Gateway
- Jika menggunakan opsi **"Debug Gateway"** - sesi debug dapat dimulai dan dihentikan kapan saja tanpa memengaruhi folder `/dist`, tetapi Anda harus menggunakan proses terminal terpisah untuk mengaktifkan debugging sekaligus mengelola siklus build
- Ubah pengaturan `launch.json` untuk `args` agar dapat men-debug bagian lain dari proyek
- Jika Anda perlu menggunakan CLI OpenClaw hasil build untuk tugas lain (misalnya `dashboard --no-open` jika sesi debug Anda memunculkan token auth baru), Anda dapat menjalankannya di terminal lain sebagai `node ./openclaw.mjs` atau membuat alias shell seperti `alias openclaw-build="node $(pwd)/openclaw.mjs"`

## Terkait

- [Pemecahan masalah](/id/help/troubleshooting)
- [FAQ](/id/help/faq)
