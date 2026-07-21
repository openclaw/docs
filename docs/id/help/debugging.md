---
read_when:
    - Anda perlu memeriksa output mentah model untuk mendeteksi kebocoran penalaran
    - Anda ingin menjalankan Gateway dalam mode pantau saat melakukan iterasi
    - Anda memerlukan alur kerja debugging yang dapat diulang
summary: 'Alat debugging: mode pantau, aliran model mentah, dan pelacakan kebocoran penalaran'
title: Debugging
x-i18n:
    generated_at: "2026-07-21T12:43:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 651976deb52841711f6c29be0a36359d5d05ef0b0bd21bba6f89620b5b024487
    source_path: help/debugging.md
    workflow: 16
---

Pembantu debugging untuk output streaming, iterasi Gateway, dan pemrofilan startup.

## Penggantian debug runtime

`/debug` menetapkan penggantian konfigurasi **khusus runtime** (di memori, bukan di disk). Dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` menghapus semua penggantian dan kembali ke konfigurasi di disk.

## Output pelacakan sesi

`/trace` menampilkan baris pelacakan/debug milik plugin untuk satu sesi tanpa mengaktifkan mode verbose penuh. Gunakan untuk diagnostik plugin seperti ringkasan debug Active Memory; gunakan `/verbose` untuk output status/alat normal.

```text
/trace
/trace on
/trace off
```

## Pelacakan siklus hidup plugin

Tetapkan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` untuk melihat perincian fase demi fase dari metadata plugin, penemuan, registri, cerminan runtime, mutasi konfigurasi, dan pekerjaan penyegaran. Ditulis ke stderr agar output perintah JSON tetap dapat diurai.
Kegagalan pemuatan plugin menyertakan pelacakan tumpukannya saat pelacakan ini diaktifkan.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

Gunakan ini sebelum beralih ke profiler CPU. Dari checkout sumber, ukur runtime hasil build dengan `node dist/entry.js ...` setelah `pnpm build`; `pnpm openclaw ...` juga mengukur overhead runner sumber.

Untuk pengukuran waktu pemuatan modul sinkron, gunakan permukaan diagnostik bersama, bukan sakelar lingkungan terpisah khusus plugin:

```bash
OPENCLAW_DIAGNOSTICS=plugin.load-profile openclaw plugins list
```

## Pemrofilan startup dan perintah CLI

Benchmark startup yang disertakan dalam repositori:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Untuk pemrofilan sekali pakai melalui runner sumber normal, tetapkan `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Runner sumber menambahkan flag profil CPU Node dan menulis `.cpuprofile` untuk perintah tersebut. Gunakan ini sebelum menambahkan instrumentasi sementara ke kode perintah.

Untuk startup yang macet dan tampak seperti pekerjaan sistem berkas atau pemuat modul yang sinkron, tambahkan flag pelacakan I/O sinkron Node melalui runner sumber:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` membiarkan flag ini dinonaktifkan secara default untuk proses anak Gateway yang dipantau; tetapkan `OPENCLAW_TRACE_SYNC_IO=1` jika Anda juga menginginkan output pelacakan I/O sinkron dalam mode pantau.

## Mode pantau Gateway

```bash
pnpm gateway:watch
```

Secara default, ini memulai atau memulai ulang sesi tmux bernama `openclaw-gateway-watch-<profile>` (misalnya `openclaw-gateway-watch-main`), dengan sufiks port seperti `openclaw-gateway-watch-dev-19001` yang hanya ditambahkan ketika `OPENCLAW_GATEWAY_PORT` berbeda dari port default `18789`. Sesi otomatis dilampirkan dari terminal interaktif; shell noninteraktif, CI, dan panggilan eksekusi agen tetap terlepas dan sebagai gantinya mencetak petunjuk untuk melampirkannya:

```bash
tmux attach -t openclaw-gateway-watch-main
# Baca output terbaru tanpa melampirkan
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

Panel menggunakan `remain-on-exit` tmux, sehingga kegagalan startup tetap tersedia untuk dilampirkan atau ditangkap alih-alih menghapus sesi. Menjalankan ulang `pnpm gateway:watch` akan memunculkan kembali panel tersebut.

Panel tmux menjalankan pemantau mentah:

```bash
node scripts/watch-node.mjs gateway --force
```

Sebelum memantau port yang dikonfigurasi/default, pembungkus tmux menghentikan layanan Gateway terpasang milik profil aktif. Ini menyerahkan port kepada pemantau sumber tanpa launchd, systemd, atau Scheduled Task yang memunculkan ulang dan menggantikannya. Layanan tetap terpasang; pulihkan setelah sesi pantau dengan:

```bash
pnpm openclaw gateway start
```

Ketika `--port` atau `OPENCLAW_GATEWAY_PORT` eksplisit berbeda dari port efektif layanan terpasang, pembungkus membiarkan layanan tetap berjalan agar kedua Gateway dapat berjalan berdampingan.

Mode latar depan tanpa tmux:

```bash
pnpm gateway:watch:raw
# atau
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Mode mentah tidak mengelola layanan terpasang. Jalankan `pnpm openclaw gateway stop` terlebih dahulu ketika layanan menggunakan port yang sama.

Pertahankan pengelolaan tmux tetapi nonaktifkan pelampiran otomatis:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Profilkan waktu CPU Gateway yang dipantau saat men-debug titik panas startup/runtime:

```bash
pnpm gateway:watch --benchmark
```

Pembungkus pantau menggunakan `--benchmark` sebelum memanggil Gateway dan menulis satu `.cpuprofile` V8 untuk setiap proses anak Gateway yang keluar di bawah `.artifacts/gateway-watch-profiles/`. Hentikan atau mulai ulang Gateway yang dipantau untuk menyelesaikan profil saat ini, lalu buka dengan Chrome DevTools atau Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: tulis profil di tempat lain.
- `--benchmark-no-force`: lewati pembersihan port default `--force` dan langsung gagal jika port Gateway sudah digunakan.

Mode benchmark menekan spam pelacakan I/O sinkron secara default. Tetapkan `OPENCLAW_TRACE_SYNC_IO=1` bersama `--benchmark` untuk mendapatkan profil CPU dan pelacakan tumpukan I/O sinkron; dalam mode benchmark, blok pelacakan tersebut masuk ke `gateway-watch-output.log` di bawah direktori benchmark (disaring dari panel terminal), sementara log Gateway normal tetap terlihat.

Pembungkus tmux meneruskan pemilih runtime umum yang tidak rahasia ke panel, termasuk `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT`, dan `OPENCLAW_SKIP_CHANNELS`. Letakkan kredensial penyedia di profil/konfigurasi normal Anda, atau gunakan mode latar depan mentah untuk rahasia sementara sekali pakai.

Jika Gateway yang dipantau keluar selama startup, pemantau menjalankan `openclaw doctor --fix --non-interactive` satu kali dan memulai ulang proses anak Gateway. Tetapkan `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` untuk melihat kegagalan startup asli tanpa tahap perbaikan khusus pengembangan.

Panel tmux terkelola menggunakan log Gateway berwarna secara default; tetapkan `FORCE_COLOR=0` saat memulai `pnpm gateway:watch` untuk menonaktifkan output ANSI.

Pemantau memulai ulang saat file yang relevan dengan build di bawah `src/`, file sumber ekstensi, metadata `package.json` dan `openclaw.plugin.json` ekstensi, `tsconfig.json`, `package.json`, dan `tsdown.config.ts` berubah. Perubahan metadata ekstensi memulai ulang Gateway tanpa memaksa build ulang; perubahan sumber dan konfigurasi tetap membangun ulang `dist` terlebih dahulu.

Tambahkan flag CLI Gateway setelah `gateway:watch`, dan flag tersebut diteruskan pada setiap mulai ulang. Menjalankan ulang perintah pantau yang sama akan memunculkan kembali panel tmux bernama tersebut; pemantau mentah mempertahankan kunci pemantau tunggal agar induk pemantau duplikat diganti alih-alih menumpuk.

## Profil pengembangan + Gateway pengembangan (--dev)

Dua flag `--dev` yang **terpisah**:

- **`--dev` global (profil):** mengisolasi status di bawah `~/.openclaw-dev` dan menetapkan port Gateway default ke `19001` (port turunannya ikut bergeser).
- **`gateway --dev`:** memerintahkan Gateway untuk otomatis membuat konfigurasi + ruang kerja default jika belum ada (dan melewati bootstrap).

Alur yang disarankan (profil pengembangan + bootstrap pengembangan):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Tanpa instalasi global, jalankan CLI melalui `pnpm openclaw ...`.

Yang dilakukan:

1. **Isolasi profil** (`--dev` global)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (port browser/canvas bergeser sesuai dengannya)

2. **Bootstrap pengembangan** (`gateway --dev`)
   - Menulis konfigurasi minimal jika belum ada (`gateway.mode=local`, mengikat ke loopback).
   - Menetapkan `agents.defaults.workspace` ke ruang kerja pengembangan dan `agents.defaults.skipBootstrap=true`.
   - Mengisi file ruang kerja jika belum ada: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identitas default: **C3-PO** (droid protokol).
   - `pnpm gateway:dev` juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` untuk melewati penyedia saluran.

Gateway pengembangan mengabaikan pemicu lingkungan saluran sekitar secara default, sehingga kredensial yang diwarisi dari shell Anda tidak menghubungkan instans pengembangan ke layanan saluran nyata. Konfigurasi `channels.<id>` eksplisit tetap berfungsi. Teruskan `--dev-ambient-channels` bersama `--dev` untuk memulihkan konfigurasi otomatis saluran sekitar pada eksekusi tersebut.

Alur pengaturan ulang (mulai dari awal):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` adalah flag profil **global** dan dihapus oleh beberapa runner. Jika perlu menuliskannya secara eksplisit, gunakan bentuk variabel lingkungan:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` menghapus konfigurasi, kredensial, sesi, dan ruang kerja pengembangan (dipindahkan ke tempat sampah, bukan dihapus secara permanen), lalu membuat ulang pengaturan pengembangan default.

<Tip>
Jika Gateway non-pengembangan sudah berjalan (launchd atau systemd), hentikan terlebih dahulu:

```bash
openclaw gateway stop
```

</Tip>

## Pencatatan stream mentah

OpenClaw dapat mencatat **stream asisten mentah** sebelum pemfilteran/pemformatan apa pun. Ini adalah cara terbaik untuk melihat apakah penalaran tiba sebagai delta teks biasa (atau sebagai blok pemikiran terpisah).

Aktifkan melalui CLI:

```bash
pnpm gateway:watch --raw-stream
```

Penggantian path opsional:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variabel lingkungan yang setara:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

File default: `~/.openclaw/logs/raw-stream.jsonl`

## Catatan keamanan

- Log stream mentah dapat menyertakan prompt lengkap, output alat, dan data pengguna.
- Simpan log secara lokal dan hapus setelah debugging.
- Jika Anda membagikan log, bersihkan rahasia dan PII terlebih dahulu.

## Debugging di VSCode

Peta sumber diperlukan karena build melakukan hash pada nama file yang dihasilkan. `launch.json` yang disertakan menargetkan layanan Gateway:

1. **Rebuild and Debug Gateway** - menghapus `/dist` dan membangun ulang dengan debugging diaktifkan sebelum memulai Gateway.
2. **Debug Gateway** - men-debug build yang ada tanpa menyentuh `/dist`.

### Penyiapan

1. Buka **Run and Debug** (Activity Bar, atau `Ctrl`+`Shift`+`D`).
2. Pilih **Rebuild and Debug Gateway** dan tekan **Start Debugging**.

Untuk mengelola siklus build/debug secara manual:

1. Aktifkan peta sumber di terminal:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Bangun ulang: `pnpm clean:dist && pnpm build`
3. Pilih **Debug Gateway** dan tekan **Start Debugging**.

Tetapkan breakpoint dalam file TypeScript `src/`; debugger memetakannya ke JavaScript hasil kompilasi melalui peta sumber.

### Catatan

- **Rebuild and Debug Gateway** menghapus `/dist` dan menjalankan `pnpm build` penuh dengan peta sumber pada setiap peluncuran.
- **Debug Gateway** dapat dimulai/dihentikan tanpa memengaruhi `/dist`, tetapi Anda mengelola siklus build di terminal terpisah.
- Edit `launch.json` `args` untuk men-debug subperintah CLI lainnya.
- Untuk menggunakan CLI hasil build bagi tugas lain (misalnya `dashboard --no-open` jika sesi debug Anda membuat token autentikasi baru), jalankan dari terminal lain: `node ./openclaw.mjs` atau alias seperti `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Terkait

- [Pemecahan masalah](/id/help/troubleshooting)
- [Tanya jawab umum](/id/help/faq)
