---
read_when:
    - Anda ingin mengelola hook agen
    - Anda ingin memeriksa ketersediaan hook atau mengaktifkan hook workspace
summary: Referensi CLI untuk `openclaw hooks` (hook agen)
title: Hook
x-i18n:
    generated_at: "2026-04-24T09:01:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84f209e90a5679b889112fc03e22ea94f486ded9db25b5238c0366283695a5b9
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Kelola hook agen (otomasi berbasis peristiwa untuk perintah seperti `/new`, `/reset`, dan startup gateway).

Menjalankan `openclaw hooks` tanpa subperintah setara dengan `openclaw hooks list`.

Terkait:

- Hook: [Hook](/id/automation/hooks)
- Hook plugin: [Hook plugin](/id/plugins/architecture-internals#provider-runtime-hooks)

## Daftar Semua Hook

```bash
openclaw hooks list
```

Daftarkan semua hook yang ditemukan dari direktori workspace, managed, extra, dan bawaan.
Startup gateway tidak memuat handler hook internal sampai setidaknya satu hook internal dikonfigurasi.

**Opsi:**

- `--eligible`: Tampilkan hanya hook yang memenuhi syarat (persyaratan terpenuhi)
- `--json`: Keluarkan sebagai JSON
- `-v, --verbose`: Tampilkan informasi detail termasuk persyaratan yang belum terpenuhi

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

Tampilkan informasi detail tentang hook tertentu.

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
  Sumber: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Halaman utama: https://docs.openclaw.ai/automation/hooks#session-memory
  Peristiwa: command:new, command:reset

Persyaratan:
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
Status Hook

Total hook: 4
Siap: 4
Tidak siap: 0
```

## Aktifkan Hook

```bash
openclaw hooks enable <name>
```

Aktifkan hook tertentu dengan menambahkannya ke config Anda (default `~/.openclaw/openclaw.json`).

**Catatan:** Hook workspace dinonaktifkan secara default sampai diaktifkan di sini atau di config. Hook yang dikelola oleh plugin menampilkan `plugin:<id>` di `openclaw hooks list` dan tidak dapat diaktifkan/dinonaktifkan di sini. Aktifkan/nonaktifkan plugin sebagai gantinya.

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
- Memperbarui `hooks.internal.entries.<name>.enabled = true` di config Anda
- Menyimpan config ke disk

Jika hook berasal dari `<workspace>/hooks/`, langkah opt-in ini diperlukan sebelum
Gateway akan memuatnya.

**Setelah mengaktifkan:**

- Mulai ulang gateway agar hook dimuat ulang (restart aplikasi menu bar di macOS, atau restart proses gateway Anda dalam dev).

## Nonaktifkan Hook

```bash
openclaw hooks disable <name>
```

Nonaktifkan hook tertentu dengan memperbarui config Anda.

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

**Setelah menonaktifkan:**

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

Instal paket hook melalui installer plugin terpadu.

`openclaw hooks install` masih berfungsi sebagai alias kompatibilitas, tetapi mencetak
peringatan deprecation dan meneruskan ke `openclaw plugins install`.

Spesifikasi npm bersifat **khusus registry** (nama paket + **versi exact** opsional atau
**dist-tag**). Spesifikasi Git/URL/file dan rentang semver ditolak. Instalasi dependensi dijalankan dengan `--ignore-scripts` demi keamanan.

Spesifikasi kosong dan `@latest` tetap berada di jalur stabil. Jika npm menyelesaikan salah satunya ke prerelease, OpenClaw akan berhenti dan meminta Anda opt in secara eksplisit dengan
tag prerelease seperti `@beta`/`@rc` atau versi prerelease exact.

**Yang dilakukan:**

- Menyalin paket hook ke `~/.openclaw/hooks/<id>`
- Mengaktifkan hook yang diinstal di `hooks.internal.entries.*`
- Mencatat instalasi di bawah `hooks.internal.installs`

**Opsi:**

- `-l, --link`: Tautkan direktori lokal alih-alih menyalin (menambahkannya ke `hooks.internal.load.extraDirs`)
- `--pin`: Catat instalasi npm sebagai `name@version` exact yang telah diselesaikan di `hooks.internal.installs`

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

Perbarui paket hook berbasis npm yang dilacak melalui updater plugin terpadu.

`openclaw hooks update` masih berfungsi sebagai alias kompatibilitas, tetapi mencetak
peringatan deprecation dan meneruskan ke `openclaw plugins update`.

**Opsi:**

- `--all`: Perbarui semua paket hook yang dilacak
- `--dry-run`: Tampilkan apa yang akan berubah tanpa menulis

Saat hash integritas tersimpan ada dan hash artefak yang diambil berubah,
OpenClaw mencetak peringatan dan meminta konfirmasi sebelum melanjutkan. Gunakan
`--yes` global untuk melewati prompt pada eksekusi CI/non-interaktif.

## Hook Bawaan

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

Menjalankan `BOOT.md` saat gateway dimulai (setelah saluran dimulai).

**Peristiwa**: `gateway:startup`

**Aktifkan**:

```bash
openclaw hooks enable boot-md
```

**Lihat:** [dokumentasi boot-md](/id/automation/hooks#boot-md)

## Terkait

- [Referensi CLI](/id/cli)
- [Hook otomasi](/id/automation/hooks)
