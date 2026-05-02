---
read_when:
    - Anda perlu memeriksa keluaran mentah model untuk kebocoran penalaran
    - Anda ingin menjalankan Gateway dalam mode pemantauan saat melakukan iterasi
    - Anda memerlukan alur kerja penelusuran bug yang dapat diulang
summary: 'Alat pengawakutuan: mode pemantauan, aliran model mentah, dan pelacakan kebocoran penalaran'
title: Pengawakutuan
x-i18n:
    generated_at: "2026-05-02T20:46:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

Pembantu debugging untuk keluaran streaming, terutama saat penyedia mencampurkan penalaran ke dalam teks normal.

## Override debug runtime

Gunakan `/debug` di chat untuk menetapkan override konfigurasi **khusus runtime** (memori, bukan disk).
`/debug` dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.
Ini berguna saat Anda perlu mengalihkan pengaturan yang jarang digunakan tanpa mengedit `openclaw.json`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` menghapus semua override dan kembali ke konfigurasi di disk.

## Keluaran trace sesi

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

## Trace siklus hidup Plugin

Gunakan `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` saat perintah siklus hidup Plugin terasa lambat
dan Anda memerlukan uraian fase bawaan untuk metadata Plugin, discovery, registry,
mirror runtime, mutasi konfigurasi, dan pekerjaan refresh. Trace bersifat opt-in dan menulis
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

Gunakan ini untuk investigasi siklus hidup Plugin sebelum beralih ke profiler CPU.
Jika perintah dijalankan dari checkout sumber, lebih baik ukur runtime hasil build
dengan `node dist/entry.js ...` setelah `pnpm build`; `pnpm openclaw ...`
juga mengukur overhead source-runner.

## Timing debug CLI sementara

OpenClaw menyimpan `src/cli/debug-timing.ts` sebagai pembantu kecil untuk investigasi
lokal. Ini sengaja tidak disambungkan ke startup CLI, routing perintah,
atau perintah apa pun secara default. Gunakan hanya saat men-debug perintah yang lambat, lalu
hapus import dan span sebelum mendaratkan perubahan perilaku.

Gunakan ini saat sebuah perintah lambat dan Anda memerlukan uraian fase cepat sebelum
memutuskan apakah akan menggunakan profiler CPU atau memperbaiki subsistem tertentu.

### Tambahkan span sementara

Tambahkan pembantu di dekat kode yang Anda investigasi. Misalnya, saat men-debug
`openclaw models list`, patch sementara di
`src/commands/models/list.list-command.ts` mungkin terlihat seperti ini:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Panduan:

- Awali nama fase sementara dengan `debug:`.
- Tambahkan hanya beberapa span di sekitar bagian yang diduga lambat.
- Lebih baik gunakan fase luas seperti `registry`, `auth_store`, atau `rows` daripada nama
  pembantu.
- Gunakan `time()` untuk pekerjaan sinkron dan `timeAsync()` untuk promise.
- Jaga stdout tetap bersih. Pembantu menulis ke stderr, sehingga keluaran JSON perintah tetap
  dapat di-parse.
- Hapus import dan span sementara sebelum membuka PR perbaikan final.
- Sertakan keluaran timing atau ringkasan singkat di issue atau PR yang menjelaskan
  optimasi.

### Jalankan dengan keluaran yang mudah dibaca

Mode mudah dibaca paling baik untuk debugging langsung:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Contoh keluaran dari investigasi sementara `models list`:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Temuan dari keluaran ini:

| Fase                                     |       Waktu | Artinya                                                                                                |
| ---------------------------------------- | ----------: | ------------------------------------------------------------------------------------------------------ |
| `debug:models:list:auth_store`           |       20.3s | Pemuatan penyimpanan auth-profile adalah biaya terbesar dan perlu diinvestigasi terlebih dahulu.       |
| `debug:models:list:ensure_models_json`   |        5.0s | Sinkronisasi `models.json` cukup mahal untuk diperiksa terkait caching atau kondisi skip.              |
| `debug:models:list:load_model_registry`  |        5.9s | Konstruksi registry dan pekerjaan ketersediaan penyedia juga merupakan biaya yang berarti.             |
| `debug:models:list:read_registry_models` |        2.4s | Membaca semua model registry tidak gratis dan mungkin penting untuk `--all`.                           |
| fase penambahan baris                    | total 3.2s  | Membangun lima baris yang ditampilkan masih memakan beberapa detik, jadi jalur filtering perlu ditinjau lebih dekat. |
| `debug:models:list:print_model_table`    |         0ms | Rendering bukan bottleneck.                                                                            |

Temuan tersebut cukup untuk memandu patch berikutnya tanpa menyimpan kode timing di
jalur produksi.

### Jalankan dengan keluaran JSON

Gunakan mode JSON saat Anda ingin menyimpan atau membandingkan data timing:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Setiap baris stderr adalah satu objek JSON:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Bersihkan sebelum mendaratkan

Sebelum membuka PR final:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Perintah tersebut seharusnya tidak mengembalikan call site instrumentasi sementara kecuali PR
secara eksplisit menambahkan permukaan diagnostik permanen. Untuk perbaikan performa
normal, pertahankan hanya perubahan perilaku, pengujian, dan catatan singkat dengan bukti
timing.

Untuk hotspot CPU yang lebih dalam, gunakan profiling Node (`--cpu-prof`) atau profiler
eksternal alih-alih menambahkan lebih banyak wrapper timing.

## Mode watch Gateway

Untuk iterasi cepat, jalankan Gateway di bawah file watcher:

```bash
pnpm gateway:watch
```

Secara default, ini memulai atau me-restart sesi tmux bernama
`openclaw-gateway-watch-main` (atau varian khusus profil/port seperti
`openclaw-gateway-watch-dev-19001`) dan auto-attach dari terminal interaktif.
Shell noninteraktif, CI, dan panggilan exec agen tetap detached dan mencetak instruksi attach
sebagai gantinya. Attach secara manual saat diperlukan:

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

Profilkan waktu CPU Gateway yang di-watch saat men-debug hotspot startup/runtime:

```bash
pnpm gateway:watch --benchmark
```

Wrapper watch mengonsumsi `--benchmark` sebelum memanggil Gateway dan menulis
satu `.cpuprofile` V8 per keluarnya child Gateway di bawah
`.artifacts/gateway-watch-profiles/`. Hentikan atau restart gateway yang di-watch untuk
mem-flush profil saat ini, lalu buka dengan Chrome DevTools atau Speedscope:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Gunakan `--benchmark-dir <path>` saat Anda ingin profil berada di tempat lain.

Wrapper tmux membawa selector runtime nonrahasia umum seperti
`OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT`, dan `OPENCLAW_SKIP_CHANNELS` ke dalam pane. Letakkan
kredensial penyedia di profil/konfigurasi normal Anda, atau gunakan mode foreground mentah
untuk rahasia sekali pakai yang sementara.
Pane tmux terkelola juga secara default memakai log Gateway berwarna agar mudah dibaca;
tetapkan `FORCE_COLOR=0` saat memulai `pnpm gateway:watch` untuk menonaktifkan keluaran ANSI.

Watcher me-restart pada file yang relevan untuk build di bawah `src/`, file sumber Plugin,
metadata `package.json` dan `openclaw.plugin.json` Plugin, `tsconfig.json`,
`package.json`, dan `tsdown.config.ts`. Perubahan metadata Plugin me-restart
gateway tanpa memaksa rebuild `tsdown`; perubahan sumber dan konfigurasi tetap
membangun ulang `dist` terlebih dahulu.

Tambahkan flag CLI gateway apa pun setelah `gateway:watch` dan flag tersebut akan diteruskan pada
setiap restart. Menjalankan ulang perintah watch yang sama akan respawn pane tmux bernama, dan
watcher mentah tetap mempertahankan lock single-watcher-nya sehingga parent watcher duplikat
diganti alih-alih menumpuk.

## Profil dev + gateway dev (--dev)

Gunakan profil dev untuk mengisolasi state dan menyiapkan lingkungan aman yang dapat dibuang untuk
debugging. Ada **dua** flag `--dev`:

- **Global `--dev` (profil):** mengisolasi state di bawah `~/.openclaw-dev` dan
  menetapkan port gateway default ke `19001` (port turunan ikut bergeser).
- **`gateway --dev`: memberi tahu Gateway untuk otomatis membuat konfigurasi default +
  workspace** saat belum ada (dan melewati BOOTSTRAP.md).

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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas bergeser sesuai itu)

2. **Bootstrap dev** (`gateway --dev`)
   - Menulis konfigurasi minimal jika belum ada (`gateway.mode=local`, bind loopback).
   - Menetapkan `agent.workspace` ke workspace dev.
   - Menetapkan `agent.skipBootstrap=true` (tanpa BOOTSTRAP.md).
   - Mengisi file workspace jika belum ada:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identitas default: **C3‑PO** (droid protokol).
   - Melewati penyedia channel dalam mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Alur reset (mulai baru):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` adalah flag profil **global** dan dapat tertangkap oleh beberapa runner. Jika Anda perlu menuliskannya secara eksplisit, gunakan bentuk variabel lingkungan:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` menghapus konfigurasi, kredensial, sesi, dan workspace dev (menggunakan
`trash`, bukan `rm`), lalu membuat ulang pengaturan dev default.

<Tip>
Jika gateway non-dev sudah berjalan (launchd atau systemd), hentikan terlebih dahulu:

```bash
openclaw gateway stop
```

</Tip>

## Logging stream mentah (OpenClaw)

OpenClaw dapat mencatat **stream asisten mentah** sebelum pemfilteran/pemformatan apa pun.
Ini adalah cara terbaik untuk melihat apakah penalaran masuk sebagai delta teks biasa
(atau sebagai blok berpikir terpisah).

Aktifkan melalui CLI:

```bash
pnpm gateway:watch --raw-stream
```

Override jalur opsional:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Variabel lingkungan yang ekuivalen:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

File default:

`~/.openclaw/logs/raw-stream.jsonl`

## Logging chunk mentah (pi-mono)

Untuk menangkap **chunk kompatibel OpenAI mentah** sebelum diurai menjadi blok,
pi-mono menyediakan logger terpisah:

```bash
PI_RAW_STREAM=1
```

Jalur opsional:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

File default:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Catatan: ini hanya dikeluarkan oleh proses yang menggunakan penyedia
> `openai-completions` pi-mono.

## Catatan keamanan

- Log stream mentah dapat mencakup prompt lengkap, output alat, dan data pengguna.
- Simpan log secara lokal dan hapus setelah debugging.
- Jika Anda membagikan log, bersihkan rahasia dan PII terlebih dahulu.

## Terkait

- [Pemecahan masalah](/id/help/troubleshooting)
- [FAQ](/id/help/faq)
