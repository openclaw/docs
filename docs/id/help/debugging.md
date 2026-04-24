---
read_when:
    - Anda perlu memeriksa output model mentah untuk kebocoran reasoning
    - Anda ingin menjalankan Gateway dalam mode watch saat beriterasi
    - Anda memerlukan alur kerja debugging yang dapat diulang
summary: 'Alat debugging: mode watch, stream model mentah, dan pelacakan kebocoran reasoning'
title: Debugging
x-i18n:
    generated_at: "2026-04-24T09:10:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d52070204e21cd7e5bff565fadab96fdeee0ad906c4c8601572761a096d9025
    source_path: help/debugging.md
    workflow: 15
---

Halaman ini membahas pembantu debugging untuk output streaming, terutama ketika
sebuah provider mencampurkan reasoning ke dalam teks normal.

## Override debug runtime

Gunakan `/debug` di chat untuk mengatur override konfigurasi **khusus runtime** (memori, bukan disk).
`/debug` nonaktif secara default; aktifkan dengan `commands.debug: true`.
Ini berguna saat Anda perlu mengaktifkan pengaturan yang jarang digunakan tanpa mengedit `openclaw.json`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` menghapus semua override dan kembali ke konfigurasi di disk.

## Output trace sesi

Gunakan `/trace` saat Anda ingin melihat baris trace/debug milik Plugin dalam satu sesi
tanpa menyalakan mode verbose penuh.

Contoh:

```text
/trace
/trace on
/trace off
```

Gunakan `/trace` untuk diagnostik Plugin seperti ringkasan debug Active Memory.
Tetap gunakan `/verbose` untuk output status/alat verbose normal, dan tetap gunakan
`/debug` untuk override konfigurasi khusus runtime.

## Timing debug CLI sementara

OpenClaw menyimpan `src/cli/debug-timing.ts` sebagai pembantu kecil untuk
investigasi lokal. Ini sengaja tidak dihubungkan ke startup CLI, perutean perintah,
atau perintah apa pun secara default. Gunakan hanya saat men-debug perintah yang lambat, lalu
hapus import dan span sebelum mendaratkan perubahan perilaku.

Gunakan ini ketika suatu perintah lambat dan Anda memerlukan rincian fase cepat sebelum
memutuskan apakah akan menggunakan profiler CPU atau memperbaiki subsistem tertentu.

### Tambahkan span sementara

Tambahkan pembantu di dekat kode yang sedang Anda investigasi. Misalnya, saat men-debug
`openclaw models list`, patch sementara di
`src/commands/models/list.list-command.ts` mungkin terlihat seperti ini:

```ts
// Hanya untuk debugging sementara. Hapus sebelum landing.
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
- Utamakan fase luas seperti `registry`, `auth_store`, atau `rows` daripada nama helper.
- Gunakan `time()` untuk pekerjaan sinkron dan `timeAsync()` untuk promise.
- Jaga stdout tetap bersih. Pembantu ini menulis ke stderr, sehingga output JSON perintah tetap dapat di-parse.
- Hapus import dan span sementara sebelum membuka PR perbaikan final.
- Sertakan output timing atau ringkasan singkat dalam issue atau PR yang menjelaskan optimasi tersebut.

### Jalankan dengan output yang mudah dibaca

Mode yang mudah dibaca paling baik untuk debugging langsung:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Contoh output dari investigasi sementara `models list`:

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

Temuan dari output ini:

| Fase                                     |      Waktu | Artinya                                                                                                   |
| ---------------------------------------- | ---------: | --------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | Pemuatan penyimpanan auth-profile adalah biaya terbesar dan harus diselidiki terlebih dahulu.            |
| `debug:models:list:ensure_models_json`   |       5.0s | Sinkronisasi `models.json` cukup mahal sehingga layak diperiksa untuk caching atau kondisi skip.         |
| `debug:models:list:load_model_registry`  |       5.9s | Konstruksi registry dan pekerjaan ketersediaan provider juga merupakan biaya yang bermakna.              |
| `debug:models:list:read_registry_models` |       2.4s | Membaca semua model registry tidak gratis dan mungkin penting untuk `--all`.                             |
| fase penambahan baris                    | 3.2s total | Membangun lima baris yang ditampilkan tetap memerlukan beberapa detik, jadi jalur pemfilteran layak diperiksa lebih dekat. |
| `debug:models:list:print_model_table`    |        0ms | Rendering bukan bottleneck.                                                                               |

Temuan tersebut sudah cukup untuk memandu patch berikutnya tanpa menyimpan kode timing di
jalur produksi.

### Jalankan dengan output JSON

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

### Bersihkan sebelum landing

Sebelum membuka PR final:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

Perintah tersebut seharusnya tidak mengembalikan situs pemanggilan instrumentasi sementara kecuali PR
secara eksplisit menambahkan permukaan diagnostik permanen. Untuk perbaikan performa normal,
pertahankan hanya perubahan perilaku, pengujian, dan catatan singkat dengan bukti timing.

Untuk hotspot CPU yang lebih dalam, gunakan profiling Node (`--cpu-prof`) atau profiler
eksternal alih-alih menambahkan lebih banyak wrapper timing.

## Mode watch Gateway

Untuk iterasi cepat, jalankan gateway di bawah file watcher:

```bash
pnpm gateway:watch
```

Ini dipetakan ke:

```bash
node scripts/watch-node.mjs gateway --force
```

Watcher melakukan restart pada file yang relevan dengan build di bawah `src/`, file source ekstensi,
metadata ekstensi `package.json` dan `openclaw.plugin.json`, `tsconfig.json`,
`package.json`, dan `tsdown.config.ts`. Perubahan metadata ekstensi me-restart
gateway tanpa memaksa rebuild `tsdown`; perubahan source dan konfigurasi tetap
membangun ulang `dist` terlebih dahulu.

Tambahkan flag CLI gateway apa pun setelah `gateway:watch` dan flag tersebut akan diteruskan pada
setiap restart. Menjalankan ulang perintah watch yang sama untuk set repo/flag yang sama sekarang
menggantikan watcher lama alih-alih meninggalkan parent watcher duplikat.

## Profil dev + gateway dev (`--dev`)

Gunakan profil dev untuk mengisolasi state dan memunculkan penyiapan yang aman dan sekali pakai untuk
debugging. Ada **dua** flag `--dev`:

- **Global `--dev` (profil):** mengisolasi state di bawah `~/.openclaw-dev` dan
  mengatur port default gateway ke `19001` (port turunan ikut bergeser).
- **`gateway --dev`: memberi tahu Gateway untuk membuat otomatis konfigurasi + workspace default**
  saat belum ada (dan melewati `BOOTSTRAP.md`).

Alur yang disarankan (profil dev + bootstrap dev):

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
   - Mengatur `agent.workspace` ke workspace dev.
   - Mengatur `agent.skipBootstrap=true` (tanpa `BOOTSTRAP.md`).
   - Menyemai file workspace jika belum ada:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identitas default: **C3‑PO** (droid protokol).
   - Melewati provider kanal dalam mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Alur reset (mulai segar):

```bash
pnpm gateway:dev:reset
```

Catatan: `--dev` adalah flag profil **global** dan akan termakan oleh beberapa runner.
Jika Anda perlu menuliskannya secara eksplisit, gunakan bentuk env var:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset` menghapus konfigurasi, kredensial, sesi, dan workspace dev (menggunakan
`trash`, bukan `rm`), lalu membuat ulang penyiapan dev default.

Tip: jika gateway non-dev sudah berjalan (launchd/systemd), hentikan terlebih dahulu:

```bash
openclaw gateway stop
```

## Logging stream mentah (OpenClaw)

OpenClaw dapat mencatat **stream asisten mentah** sebelum pemfilteran/pemformatan apa pun.
Ini adalah cara terbaik untuk melihat apakah reasoning tiba sebagai delta teks biasa
(atau sebagai blok thinking terpisah).

Aktifkan melalui CLI:

```bash
pnpm gateway:watch --raw-stream
```

Override path opsional:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Env var yang setara:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

File default:

`~/.openclaw/logs/raw-stream.jsonl`

## Logging chunk mentah (pi-mono)

Untuk menangkap **chunk OpenAI-compat mentah** sebelum diurai menjadi blok,
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

- Log stream mentah dapat mencakup prompt penuh, output alat, dan data pengguna.
- Simpan log secara lokal dan hapus setelah debugging.
- Jika Anda membagikan log, bersihkan secret dan PII terlebih dahulu.

## Terkait

- [Pemecahan masalah](/id/help/troubleshooting)
- [FAQ](/id/help/faq)
