---
read_when:
    - Anda ingin mengelola hook agen
    - Anda ingin memeriksa ketersediaan hook atau mengaktifkan hook workspace
summary: Referensi CLI untuk `openclaw hooks` (hook agen)
title: hook
x-i18n:
    generated_at: "2026-04-05T13:49:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dc9144e9844e9c3cdef2514098eb170543746fcc55ca5a1cc746c12d80209e7
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Kelola hook agen (otomatisasi berbasis peristiwa untuk perintah seperti `/new`, `/reset`, dan startup gateway).

Menjalankan `openclaw hooks` tanpa subperintah setara dengan `openclaw hooks list`.

Terkait:

- Hook: [Hooks](/id/automation/hooks)
- Hook plugin: [Plugin hooks](/plugins/architecture#provider-runtime-hooks)

## Daftar Semua Hook

```bash
openclaw hooks list
```

Daftarkan semua hook yang ditemukan dari direktori workspace, managed, extra, dan bundled.

**Opsi:**

- `--eligible`: Tampilkan hanya hook yang memenuhi syarat
- `--json`: Keluarkan sebagai JSON
- `-v, --verbose`: Tampilkan informasi terperinci termasuk persyaratan yang belum terpenuhi

**Contoh output:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Jalankan BOOT.md saat startup gateway
  📎 bootstrap-extra-files ✓ - Sisipkan file bootstrap workspace tambahan selama bootstrap agen
  📝 command-logger ✓ - Catat semua peristiwa perintah ke file audit terpusat
  💾 session-memory ✓ - Simpan konteks sesi ke memori saat perintah /new atau /reset dijalankan
```

**Contoh (verbose):**

```bash
openclaw hooks list --verbose
```

Menampilkan persyaratan yang belum terpenuhi untuk hook yang tidak memenuhi syarat.

**Contoh (JSON):**

```bash
openclaw hooks list --json
```

Mengembalikan JSON terstruktur untuk penggunaan terprogram.

## Dapatkan Informasi Hook

```bash
openclaw hooks info <name>
```

Tampilkan informasi terperinci tentang hook tertentu.

**Argumen:**

- `<name>`: Nama hook atau kunci hook (misalnya, `session-memory`)

**Opsi:**

- `--json`: Keluarkan sebagai JSON

**Contoh:**

```bash
openclaw hooks info session-memory
```

**Output:**

```
💾 session-memory ✓ Siap

Simpan konteks sesi ke memori saat perintah /new atau /reset dijalankan

Detail:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Periksa Kelayakan Hook

```bash
openclaw hooks check
```

Tampilkan ringkasan status kelayakan hook (berapa banyak yang siap vs. tidak siap).

**Opsi:**

- `--json`: Keluarkan sebagai JSON

**Contoh output:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Aktifkan Hook

```bash
openclaw hooks enable <name>
```

Aktifkan hook tertentu dengan menambahkannya ke konfigurasi Anda (`~/.openclaw/openclaw.json` secara default).

**Catatan:** Hook workspace dinonaktifkan secara default sampai diaktifkan di sini atau di konfigurasi. Hook yang dikelola oleh plugin menampilkan `plugin:<id>` di `openclaw hooks list` dan tidak dapat diaktifkan/dinonaktifkan di sini. Aktifkan/nonaktifkan plugin sebagai gantinya.

**Argumen:**

- `<name>`: Nama hook (misalnya, `session-memory`)

**Contoh:**

```bash
openclaw hooks enable session-memory
```

**Output:**

```
✓ Hook diaktifkan: 💾 session-memory
```

**Yang dilakukan:**

- Memeriksa apakah hook ada dan memenuhi syarat
- Memperbarui `hooks.internal.entries.<name>.enabled = true` di konfigurasi Anda
- Menyimpan konfigurasi ke disk

Jika hook berasal dari `<workspace>/hooks/`, langkah opt-in ini wajib dilakukan sebelum
Gateway akan memuatnya.

**Setelah diaktifkan:**

- Mulai ulang gateway agar hook dimuat ulang (mulai ulang app bilah menu di macOS, atau mulai ulang proses gateway Anda dalam dev).

## Nonaktifkan Hook

```bash
openclaw hooks disable <name>
```

Nonaktifkan hook tertentu dengan memperbarui konfigurasi Anda.

**Argumen:**

- `<name>`: Nama hook (misalnya, `command-logger`)

**Contoh:**

```bash
openclaw hooks disable command-logger
```

**Output:**

```
⏸ Hook dinonaktifkan: 📝 command-logger
```

**Setelah dinonaktifkan:**

- Mulai ulang gateway agar hook dimuat ulang

## Catatan

- `openclaw hooks list --json`, `info --json`, dan `check --json` menulis JSON terstruktur langsung ke stdout.
- Hook yang dikelola plugin tidak dapat diaktifkan atau dinonaktifkan di sini; aktifkan atau nonaktifkan plugin pemiliknya sebagai gantinya.

## Instal Paket Hook

```bash
openclaw plugins install <package>        # ClawHub terlebih dahulu, lalu npm
openclaw plugins install <package> --pin  # sematkan versi
openclaw plugins install <path>           # path lokal
```

Instal paket hook melalui penginstal plugin terpadu.

`openclaw hooks install` masih berfungsi sebagai alias kompatibilitas, tetapi menampilkan
peringatan deprecation dan meneruskan ke `openclaw plugins install`.

Spesifikasi npm bersifat **khusus registri** (nama paket + **versi exact** opsional atau
**dist-tag**). Spesifikasi Git/URL/file dan rentang semver ditolak. Penginstalan
dependensi dijalankan dengan `--ignore-scripts` demi keamanan.

Spesifikasi polos dan `@latest` tetap berada di jalur stabil. Jika npm menyelesaikan salah satu dari
itu ke versi prerelease, OpenClaw berhenti dan meminta Anda untuk melakukan opt-in secara eksplisit dengan
tag prerelease seperti `@beta`/`@rc` atau versi prerelease exact.

**Yang dilakukan:**

- Menyalin paket hook ke `~/.openclaw/hooks/<id>`
- Mengaktifkan hook yang diinstal di `hooks.internal.entries.*`
- Mencatat penginstalan di `hooks.internal.installs`

**Opsi:**

- `-l, --link`: Tautkan direktori lokal alih-alih menyalin (menambahkannya ke `hooks.internal.load.extraDirs`)
- `--pin`: Catat penginstalan npm sebagai `name@version` exact yang telah diselesaikan di `hooks.internal.installs`

**Arsip yang didukung:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Contoh:**

```bash
# Direktori lokal
openclaw plugins install ./my-hook-pack

# Arsip lokal
openclaw plugins install ./my-hook-pack.zip

# Paket NPM
openclaw plugins install @openclaw/my-hook-pack

# Tautkan direktori lokal tanpa menyalin
openclaw plugins install -l ./my-hook-pack
```

Paket hook yang ditautkan diperlakukan sebagai hook managed dari
direktori yang dikonfigurasi operator, bukan sebagai hook workspace.

## Perbarui Paket Hook

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Perbarui paket hook berbasis npm yang dilacak melalui pembaru plugin terpadu.

`openclaw hooks update` masih berfungsi sebagai alias kompatibilitas, tetapi menampilkan
peringatan deprecation dan meneruskan ke `openclaw plugins update`.

**Opsi:**

- `--all`: Perbarui semua paket hook yang dilacak
- `--dry-run`: Tampilkan apa yang akan berubah tanpa menulis

Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah,
OpenClaw menampilkan peringatan dan meminta konfirmasi sebelum melanjutkan. Gunakan
`--yes` global untuk melewati prompt dalam menjalankan CI/non-interaktif.

## Hook Bundled

### session-memory

Menyimpan konteks sesi ke memori saat Anda menjalankan `/new` atau `/reset`.

**Aktifkan:**

```bash
openclaw hooks enable session-memory
```

**Output:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Lihat:** [dokumentasi session-memory](/id/automation/hooks#session-memory)

### bootstrap-extra-files

Menyisipkan file bootstrap tambahan (misalnya `AGENTS.md` / `TOOLS.md` lokal monorepo) selama `agent:bootstrap`.

**Aktifkan:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Lihat:** [dokumentasi bootstrap-extra-files](/id/automation/hooks#bootstrap-extra-files)

### command-logger

Mencatat semua peristiwa perintah ke file audit terpusat.

**Aktifkan:**

```bash
openclaw hooks enable command-logger
```

**Output:** `~/.openclaw/logs/commands.log`

**Lihat log:**

```bash
# Perintah terbaru
tail -n 20 ~/.openclaw/logs/commands.log

# Cetak rapi
cat ~/.openclaw/logs/commands.log | jq .

# Filter berdasarkan aksi
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Lihat:** [dokumentasi command-logger](/id/automation/hooks#command-logger)

### boot-md

Menjalankan `BOOT.md` saat gateway dimulai (setelah channel dimulai).

**Peristiwa**: `gateway:startup`

**Aktifkan**:

```bash
openclaw hooks enable boot-md
```

**Lihat:** [dokumentasi boot-md](/id/automation/hooks#boot-md)
