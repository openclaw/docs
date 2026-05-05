---
read_when:
    - Anda ingin mengelola hook agen
    - Anda ingin memeriksa ketersediaan hook atau mengaktifkan hook workspace
summary: Referensi CLI untuk `openclaw hooks` (hook agen)
title: Kait
x-i18n:
    generated_at: "2026-05-05T08:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e860d4a20a09526e804fa1aff8c983a75396fcd1e6e24f742252fdf1812f6b7
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Kelola hook agen (otomatisasi berbasis peristiwa untuk perintah seperti `/new`, `/reset`, dan startup Gateway).

Menjalankan `openclaw hooks` tanpa subperintah setara dengan `openclaw hooks list`.

Terkait:

- Hook: [Hook](/id/automation/hooks)
- Hook Plugin: [Hook Plugin](/id/plugins/hooks)

## Daftar semua hook

```bash
openclaw hooks list
```

Cantumkan semua hook yang ditemukan dari direktori workspace, terkelola, tambahan, dan bawaan.
Startup Gateway tidak memuat handler hook internal hingga setidaknya satu hook internal dikonfigurasi.

**Opsi:**

- `--eligible`: Tampilkan hanya hook yang memenuhi syarat (persyaratan terpenuhi)
- `--json`: Keluarkan sebagai JSON
- `-v, --verbose`: Tampilkan informasi mendetail termasuk persyaratan yang belum terpenuhi

**Contoh keluaran:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
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

## Dapatkan informasi hook

```bash
openclaw hooks info <name>
```

Tampilkan informasi mendetail tentang hook tertentu.

**Argumen:**

- `<name>`: Nama hook atau kunci hook (misalnya, `session-memory`)

**Opsi:**

- `--json`: Keluarkan sebagai JSON

**Contoh:**

```bash
openclaw hooks info session-memory
```

**Keluaran:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## Periksa kelayakan hook

```bash
openclaw hooks check
```

Tampilkan ringkasan status kelayakan hook (berapa banyak yang siap vs. tidak siap).

**Opsi:**

- `--json`: Keluarkan sebagai JSON

**Contoh keluaran:**

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

**Catatan:** Hook workspace dinonaktifkan secara default hingga diaktifkan di sini atau dalam konfigurasi. Hook yang dikelola oleh Plugin menampilkan `plugin:<id>` di `openclaw hooks list` dan tidak dapat diaktifkan/dinonaktifkan di sini. Aktifkan/nonaktifkan Plugin sebagai gantinya.

**Argumen:**

- `<name>`: Nama hook (misalnya, `session-memory`)

**Contoh:**

```bash
openclaw hooks enable session-memory
```

**Keluaran:**

```
✓ Enabled hook: 💾 session-memory
```

**Yang dilakukan:**

- Memeriksa apakah hook ada dan memenuhi syarat
- Memperbarui `hooks.internal.entries.<name>.enabled = true` dalam konfigurasi Anda
- Menyimpan konfigurasi ke disk

Jika hook berasal dari `<workspace>/hooks/`, langkah opt-in ini diperlukan sebelum
Gateway akan memuatnya.

**Setelah mengaktifkan:**

- Mulai ulang gateway agar hook dimuat ulang (mulai ulang aplikasi menu bar di macOS, atau mulai ulang proses gateway Anda dalam dev).

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

**Keluaran:**

```
⏸ Disabled hook: 📝 command-logger
```

**Setelah menonaktifkan:**

- Mulai ulang gateway agar hook dimuat ulang

## Catatan

- `openclaw hooks list --json`, `info --json`, dan `check --json` menulis JSON terstruktur langsung ke stdout.
- Hook yang dikelola Plugin tidak dapat diaktifkan atau dinonaktifkan di sini; aktifkan atau nonaktifkan Plugin pemiliknya sebagai gantinya.

## Instal paket hook

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Instal paket hook melalui penginstal plugins terpadu.

`openclaw hooks install` masih berfungsi sebagai alias kompatibilitas, tetapi mencetak
peringatan penghentian dan meneruskan ke `openclaw plugins install`.

Spesifikasi npm **hanya registry** (nama paket + **versi eksak** opsional atau
**dist-tag**). Spesifikasi Git/URL/file dan rentang semver ditolak. Instalasi dependensi
berjalan secara project-local dengan `--ignore-scripts` demi keamanan, bahkan ketika
shell Anda memiliki pengaturan instalasi npm global.

Spesifikasi polos dan `@latest` tetap berada di jalur stabil. Jika npm menyelesaikan salah satu dari
itu ke prerelease, OpenClaw berhenti dan meminta Anda untuk ikut serta secara eksplisit dengan
tag prerelease seperti `@beta`/`@rc` atau versi prerelease eksak.

**Yang dilakukan:**

- Menyalin paket hook ke `~/.openclaw/hooks/<id>`
- Mengaktifkan hook yang diinstal di `hooks.internal.entries.*`
- Mencatat instalasi di bawah `hooks.internal.installs`

**Opsi:**

- `-l, --link`: Tautkan direktori lokal alih-alih menyalin (menambahkannya ke `hooks.internal.load.extraDirs`)
- `--pin`: Catat instalasi npm sebagai `name@version` terselesaikan yang eksak di `hooks.internal.installs`

**Arsip yang didukung:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Contoh:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

Paket hook tertaut diperlakukan sebagai hook terkelola dari direktori yang dikonfigurasi operator,
bukan sebagai hook workspace.

## Perbarui paket hook

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Perbarui paket hook berbasis npm yang dilacak melalui pembaru plugins terpadu.

`openclaw hooks update` masih berfungsi sebagai alias kompatibilitas, tetapi mencetak
peringatan penghentian dan meneruskan ke `openclaw plugins update`.

**Opsi:**

- `--all`: Perbarui semua paket hook yang dilacak
- `--dry-run`: Tampilkan apa yang akan berubah tanpa menulis

Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah,
OpenClaw mencetak peringatan dan meminta konfirmasi sebelum melanjutkan. Gunakan
`--yes` global untuk melewati prompt dalam CI/proses noninteraktif.

## Hook bawaan

### session-memory

Menyimpan konteks sesi ke memori saat Anda mengeluarkan `/new` atau `/reset`.

**Aktifkan:**

```bash
openclaw hooks enable session-memory
```

**Keluaran:** `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md` secara default. Tetapkan `hooks.internal.entries.session-memory.llmSlug: true` untuk slug nama file yang dibuat model.

**Lihat:** [dokumentasi session-memory](/id/automation/hooks#session-memory)

### bootstrap-extra-files

Menyuntikkan file bootstrap tambahan (misalnya `AGENTS.md` / `TOOLS.md` lokal monorepo) selama `agent:bootstrap`.

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

**Keluaran:** `~/.openclaw/logs/commands.log`

**Lihat log:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
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

## Terkait

- [Referensi CLI](/id/cli)
- [Hook otomatisasi](/id/automation/hooks)
