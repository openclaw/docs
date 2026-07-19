---
read_when:
    - Anda perlu memeriksa output mentah model untuk mendeteksi kebocoran penalaran
    - Anda ingin menjalankan Gateway dalam mode watch sambil melakukan iterasi
    - Anda memerlukan alur kerja debugging yang dapat diulang
summary: 'Alat debugging: mode pemantauan, aliran model mentah, dan pelacakan kebocoran penalaran'
title: Debugging
x-i18n:
    generated_at: "2026-07-19T04:57:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc06b15958dc4a7607a9bce98794e61d82bba42fd943419cd00ca8bceef0b7c4
    source_path: help/debugging.md
    workflow: 16
---

Pembantu debugging untuk output streaming, iterasi Gateway, dan pembuatan profil startup.

## Penggantian debug runtime

`/debug` menetapkan penggantian konfigurasi **khusus runtime** (memori, bukan disk). Dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` menghapus semua penggantian dan kembali ke konfigurasi pada disk.

## Output pelacakan sesi

`/trace` menampilkan baris pelacakan/debug milik plugin untuk satu sesi tanpa mengaktifkan mode verbose penuh. Gunakan untuk diagnostik plugin seperti ringkasan debug Active Memory; gunakan `/verbose` untuk output status/alat normal.

```text
/trace
/trace on
/trace off
```

## Pelacakan siklus hidup plugin

Tetapkan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` untuk perincian tahap demi tahap atas metadata plugin, penemuan, registri, cerminan runtime, mutasi konfigurasi, dan pekerjaan penyegaran. Menulis ke stderr sehingga output perintah JSON tetap dapat diurai.
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

Untuk pengaturan waktu pemuatan modul sinkron, gunakan permukaan diagnostik bersama, bukan sakelar lingkungan terpisah yang khusus untuk plugin:

```bash
OPENCLAW_DIAGNOSTICS=plugin.load-profile openclaw plugins list
```

## Pembuatan profil startup dan perintah CLI

Tolok ukur startup yang disimpan dalam repositori:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Untuk pembuatan profil sekali pakai melalui runner sumber normal, tetapkan `OPENCLAW_RUN_NODE_CPU_PROF_DIR`:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Runner sumber menambahkan flag profil CPU Node dan menulis `.cpuprofile` untuk perintah tersebut. Gunakan ini sebelum menambahkan instrumentasi sementara ke kode perintah.

Untuk kemacetan startup yang tampak seperti pekerjaan sistem berkas sinkron atau pemuat modul, tambahkan flag pelacakan I/O sinkron Node melalui runner sumber:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch` membiarkan flag ini dinonaktifkan secara default untuk proses anak Gateway yang dipantau; tetapkan `OPENCLAW_TRACE_SYNC_IO=1` jika Anda juga menginginkan output pelacakan I/O sinkron dalam mode pemantauan.

## Mode pemantauan Gateway

```bash
pnpm gateway:watch
```

Secara default, perintah ini memulai atau memulai ulang sesi tmux bernama `openclaw-gateway-watch-<profile>` (misalnya `openclaw-gateway-watch-main`), dengan sufiks port seperti `openclaw-gateway-watch-dev-19001` yang ditambahkan hanya ketika `OPENCLAW_GATEWAY_PORT` berbeda dari port default `18789`. Perintah ini otomatis terhubung dari terminal interaktif; shell noninteraktif, CI, dan panggilan eksekusi agen tetap terlepas dan sebagai gantinya mencetak petunjuk untuk terhubung:

```bash
tmux attach -t openclaw-gateway-watch-main
# Baca output terbaru tanpa terhubung
tmux capture-pane -ep -t openclaw-gateway-watch-main -S -200
```

Panel menggunakan `remain-on-exit` tmux sehingga kegagalan startup tetap tersedia untuk dihubungkan atau ditangkap, alih-alih menghapus sesi. Menjalankan ulang `pnpm gateway:watch` akan membuat ulang panel tersebut.

Panel tmux menjalankan pemantau mentah:

```bash
node scripts/watch-node.mjs gateway --force
```

Sebelum memantau port yang dikonfigurasi/default, pembungkus tmux menghentikan layanan Gateway terinstal milik profil aktif. Tindakan ini menyerahkan port kepada pemantau sumber tanpa launchd, systemd, atau Scheduled Task yang memulai ulang dan menggantikannya. Layanan tetap terinstal; pulihkan setelah sesi pemantauan dengan:

```bash
pnpm openclaw gateway start
```

Jika `--port` atau `OPENCLAW_GATEWAY_PORT` eksplisit berbeda dari port efektif layanan terinstal, pembungkus membiarkan layanan tetap berjalan agar kedua Gateway dapat berjalan berdampingan.

Mode latar depan tanpa tmux:

```bash
pnpm gateway:watch:raw
# atau
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

Mode mentah tidak mengelola layanan terinstal. Jalankan `pnpm openclaw gateway stop` terlebih dahulu jika layanan tersebut menggunakan port yang sama.

Pertahankan pengelolaan tmux tetapi nonaktifkan koneksi otomatis:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Buat profil waktu CPU Gateway yang dipantau saat men-debug titik panas startup/runtime:

```bash
pnpm gateway:watch --benchmark
```

Pembungkus pemantauan menggunakan `--benchmark` sebelum menjalankan Gateway dan menulis satu `.cpuprofile` V8 untuk setiap proses anak Gateway yang keluar di bawah `.artifacts/gateway-watch-profiles/`. Hentikan atau mulai ulang gateway yang dipantau untuk menulis profil saat ini, lalu buka dengan Chrome DevTools atau Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: tulis profil di tempat lain.
- `--benchmark-no-force`: lewati pembersihan port default `--force` dan segera gagal jika port Gateway sudah digunakan.

Mode tolok ukur menekan spam pelacakan I/O sinkron secara default. Tetapkan `OPENCLAW_TRACE_SYNC_IO=1` dengan `--benchmark` untuk mendapatkan profil CPU dan pelacakan tumpukan I/O sinkron; dalam mode tolok ukur, blok pelacakan tersebut masuk ke `gateway-watch-output.log` di bawah direktori tolok ukur (difilter dari panel terminal), sementara log Gateway normal tetap terlihat.

Pembungkus tmux meneruskan pemilih runtime umum yang bukan rahasia ke dalam panel, termasuk `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT`, dan `OPENCLAW_SKIP_CHANNELS`. Simpan kredensial penyedia dalam profil/konfigurasi normal Anda, atau gunakan mode latar depan mentah untuk rahasia sementara sekali pakai.

Jika Gateway yang dipantau keluar selama startup, pemantau menjalankan `openclaw doctor --fix --non-interactive` sekali dan memulai ulang proses anak Gateway. Tetapkan `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` untuk melihat kegagalan startup asli tanpa tahap perbaikan khusus pengembangan.

Panel tmux terkelola secara default menggunakan log Gateway berwarna; tetapkan `FORCE_COLOR=0` saat memulai `pnpm gateway:watch` untuk menonaktifkan output ANSI.

Pemantau memulai ulang saat ada perubahan pada berkas terkait build di bawah `src/`, berkas sumber ekstensi, metadata `package.json` dan `openclaw.plugin.json` ekstensi, `tsconfig.json`, `package.json`, dan `tsdown.config.ts`. Perubahan metadata ekstensi memulai ulang gateway tanpa memaksakan build ulang; perubahan sumber dan konfigurasi masih membangun ulang `dist` terlebih dahulu.

Tambahkan flag CLI gateway setelah `gateway:watch` dan flag tersebut akan diteruskan pada setiap mulai ulang. Menjalankan ulang perintah pemantauan yang sama akan membuat ulang panel tmux bernama; pemantau mentah mempertahankan kunci pemantau tunggal sehingga induk pemantau duplikat diganti, bukan menumpuk.

## Profil pengembangan + gateway pengembangan (--dev)

Dua flag `--dev` yang **terpisah**:

- **`--dev` global (profil):** mengisolasi status di bawah `~/.openclaw-dev` dan menetapkan port gateway default ke `19001` (port turunan ikut bergeser).
- **`gateway --dev`:** menginstruksikan Gateway untuk otomatis membuat konfigurasi + ruang kerja default saat tidak ada (dan melewati bootstrap).

Alur yang direkomendasikan (profil pengembangan + bootstrap pengembangan):

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
   - `OPENCLAW_GATEWAY_PORT=19001` (port browser/kanvas bergeser menyesuaikan)

2. **Bootstrap pengembangan** (`gateway --dev`)
   - Menulis konfigurasi minimal jika tidak ada (`gateway.mode=local`, bind loopback).
   - Menetapkan `agents.defaults.workspace` ke ruang kerja pengembangan dan `agents.defaults.skipBootstrap=true`.
   - Mengisi berkas ruang kerja jika tidak ada: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Identitas default: **C3-PO** (droid protokol).
   - `pnpm gateway:dev` juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` untuk melewati penyedia saluran.

Alur reset (mulai dari awal):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` adalah flag profil **global** dan digunakan oleh beberapa runner. Jika perlu menuliskannya secara eksplisit, gunakan bentuk variabel lingkungan:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` menghapus konfigurasi, kredensial, sesi, dan ruang kerja pengembangan (dipindahkan ke sampah, bukan dihapus), lalu membuat ulang penyiapan pengembangan default.

<Tip>
Jika gateway non-pengembangan sudah berjalan (launchd atau systemd), hentikan terlebih dahulu:

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

Penggantian jalur opsional:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variabel lingkungan yang setara:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Berkas default: `~/.openclaw/logs/raw-stream.jsonl`

## Catatan keamanan

- Log stream mentah dapat menyertakan prompt lengkap, output alat, dan data pengguna.
- Simpan log secara lokal dan hapus setelah proses debugging.
- Jika Anda membagikan log, bersihkan rahasia dan PII terlebih dahulu.

## Debugging di VSCode

Peta sumber diperlukan karena build memberi hash pada nama berkas yang dihasilkan. `launch.json` yang disertakan menargetkan layanan Gateway:

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

Tetapkan breakpoint dalam berkas TypeScript `src/`; debugger memetakannya ke JavaScript hasil kompilasi melalui peta sumber.

### Catatan

- **Rebuild and Debug Gateway** menghapus `/dist` dan menjalankan `pnpm build` penuh dengan peta sumber pada setiap peluncuran.
- **Debug Gateway** dapat dimulai/dihentikan tanpa memengaruhi `/dist`, tetapi Anda mengelola siklus build dalam terminal terpisah.
- Edit `launch.json` `args` untuk men-debug subperintah CLI lainnya.
- Untuk menggunakan CLI hasil build bagi tugas lain (misalnya `dashboard --no-open` jika sesi debug Anda membuat token autentikasi baru), jalankan dari terminal lain: `node ./openclaw.mjs` atau alias seperti `alias openclaw-build="node $(pwd)/openclaw.mjs"`.

## Terkait

- [Pemecahan masalah](/id/help/troubleshooting)
- [Tanya Jawab Umum](/id/help/faq)
