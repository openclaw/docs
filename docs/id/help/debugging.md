---
read_when:
    - Anda perlu memeriksa output model mentah untuk kebocoran penalaran
    - Anda ingin menjalankan Gateway dalam mode watch saat melakukan iterasi
    - Anda memerlukan alur kerja debugging yang dapat diulang
summary: 'Alat debugging: mode watch, stream model mentah, dan pelacakan kebocoran penalaran'
title: Debugging
x-i18n:
    generated_at: "2026-04-05T13:56:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: f90d944ecc2e846ca0b26a162126ceefb3a3c6cf065c99b731359ec79d4289e3
    source_path: help/debugging.md
    workflow: 15
---

# Debugging

Halaman ini membahas helper debugging untuk output streaming, terutama saat provider mencampurkan penalaran ke dalam teks normal.

## Override debug runtime

Gunakan `/debug` di chat untuk menetapkan override konfigurasi **khusus runtime** (memori, bukan disk).
`/debug` dinonaktifkan secara default; aktifkan dengan `commands.debug: true`.
Ini berguna saat Anda perlu mengaktifkan atau menonaktifkan pengaturan yang jarang digunakan tanpa mengedit `openclaw.json`.

Contoh:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` menghapus semua override dan mengembalikan ke konfigurasi di disk.

## Mode watch Gateway

Untuk iterasi cepat, jalankan gateway di bawah file watcher:

```bash
pnpm gateway:watch
```

Ini dipetakan ke:

```bash
node scripts/watch-node.mjs gateway --force
```

Watcher akan memulai ulang saat ada file yang relevan terhadap build di bawah `src/`, file sumber extension,
metadata extension `package.json` dan `openclaw.plugin.json`, `tsconfig.json`,
`package.json`, dan `tsdown.config.ts`. Perubahan metadata extension akan memulai ulang
gateway tanpa memaksa rebuild `tsdown`; perubahan sumber dan konfigurasi tetap akan
membangun ulang `dist` terlebih dahulu.

Tambahkan flag CLI gateway apa pun setelah `gateway:watch` dan flag tersebut akan diteruskan pada
setiap restart.

## Profil dev + gateway dev (--dev)

Gunakan profil dev untuk mengisolasi state dan menyiapkan lingkungan yang aman serta mudah dibuang untuk
debugging. Ada **dua** flag `--dev`:

- **`--dev` global (profil):** mengisolasi state di bawah `~/.openclaw-dev` dan
  secara default menetapkan port gateway ke `19001` (port turunan ikut bergeser).
- **`gateway --dev`: memberi tahu Gateway untuk otomatis membuat config default +
  workspace** jika belum ada (dan melewati BOOTSTRAP.md).

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
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas ikut bergeser sesuai itu)

2. **Bootstrap dev** (`gateway --dev`)
   - Menulis konfigurasi minimal jika belum ada (`gateway.mode=local`, bind loopback).
   - Menetapkan `agent.workspace` ke workspace dev.
   - Menetapkan `agent.skipBootstrap=true` (tanpa BOOTSTRAP.md).
   - Mengisi file workspace jika belum ada:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Identitas default: **C3‑PO** (droid protokol).
   - Melewati provider channel dalam mode dev (`OPENCLAW_SKIP_CHANNELS=1`).

Alur reset (mulai dari awal):

```bash
pnpm gateway:dev:reset
```

Catatan: `--dev` adalah flag profil **global** dan dapat tertelan oleh beberapa runner.
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

Env var yang setara:

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

Path opsional:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

File default:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Catatan: ini hanya dihasilkan oleh proses yang menggunakan provider
> `openai-completions` milik pi-mono.

## Catatan keamanan

- Log stream mentah dapat mencakup prompt lengkap, output tool, dan data pengguna.
- Simpan log secara lokal dan hapus setelah debugging selesai.
- Jika Anda membagikan log, hapus rahasia dan PII terlebih dahulu.
