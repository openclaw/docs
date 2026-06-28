---
read_when:
    - Anda ingin mengelola hook agen
    - Anda ingin memeriksa ketersediaan hook atau mengaktifkan hook ruang kerja
summary: Referensi CLI untuk `openclaw hooks` (kait agen)
title: Kait
x-i18n:
    generated_at: "2026-05-06T17:53:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56dd1ef82458dde3280e2cdfb4f3835211726517416e90625d3272d128eb9e0e
    source_path: cli/hooks.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw hooks`

Kelola pengait agen (otomasi berbasis peristiwa untuk perintah seperti `/new`, `/reset`, dan startup Gateway).

Menjalankan `openclaw hooks` tanpa subperintah setara dengan `openclaw hooks list`.

Terkait:

- Pengait: [Pengait](/id/automation/hooks)
- Pengait Plugin: [Pengait Plugin](/id/plugins/hooks)

## Cantumkan semua pengait

```bash
openclaw hooks list
```

Cantumkan semua pengait yang ditemukan dari direktori workspace, terkelola, tambahan, dan bawaan.
Startup Gateway tidak memuat handler pengait internal hingga setidaknya satu pengait internal dikonfigurasi.

**Opsi:**

- `--eligible`: Tampilkan hanya pengait yang memenuhi syarat (persyaratan terpenuhi)
- `--json`: Keluarkan sebagai JSON
- `-v, --verbose`: Tampilkan informasi terperinci termasuk persyaratan yang belum terpenuhi

**Contoh output:**

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

Menampilkan persyaratan yang belum terpenuhi untuk pengait yang tidak memenuhi syarat.

**Contoh (JSON):**

```bash
openclaw hooks list --json
```

Mengembalikan JSON terstruktur untuk penggunaan terprogram.

## Dapatkan informasi pengait

```bash
openclaw hooks info <name>
```

Tampilkan informasi terperinci tentang pengait tertentu.

**Argumen:**

- `<name>`: Nama pengait atau kunci pengait (misalnya, `session-memory`)

**Opsi:**

- `--json`: Keluarkan sebagai JSON

**Contoh:**

```bash
openclaw hooks info session-memory
```

**Output:**

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

## Periksa kelayakan pengait

```bash
openclaw hooks check
```

Tampilkan ringkasan status kelayakan pengait (berapa banyak yang siap dibandingkan yang belum siap).

**Opsi:**

- `--json`: Keluarkan sebagai JSON

**Contoh output:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Aktifkan Pengait

```bash
openclaw hooks enable <name>
```

Aktifkan pengait tertentu dengan menambahkannya ke konfigurasi Anda (`~/.openclaw/openclaw.json` secara default).

**Catatan:** Pengait workspace dinonaktifkan secara default hingga diaktifkan di sini atau dalam konfigurasi. Pengait yang dikelola oleh plugin menampilkan `plugin:<id>` di `openclaw hooks list` dan tidak dapat diaktifkan/dinonaktifkan di sini. Aktifkan/nonaktifkan plugin-nya sebagai gantinya.

**Argumen:**

- `<name>`: Nama pengait (misalnya, `session-memory`)

**Contoh:**

```bash
openclaw hooks enable session-memory
```

**Output:**

```
✓ Enabled hook: 💾 session-memory
```

**Yang dilakukannya:**

- Memeriksa apakah pengait ada dan memenuhi syarat
- Memperbarui `hooks.internal.entries.<name>.enabled = true` dalam konfigurasi Anda
- Menyimpan konfigurasi ke disk

Jika pengait berasal dari `<workspace>/hooks/`, langkah opt-in ini diperlukan sebelum
Gateway akan memuatnya.

**Setelah mengaktifkan:**

- Mulai ulang gateway agar pengait dimuat ulang (mulai ulang aplikasi bilah menu di macOS, atau mulai ulang proses gateway Anda dalam dev).

## Nonaktifkan Pengait

```bash
openclaw hooks disable <name>
```

Nonaktifkan pengait tertentu dengan memperbarui konfigurasi Anda.

**Argumen:**

- `<name>`: Nama pengait (misalnya, `command-logger`)

**Contoh:**

```bash
openclaw hooks disable command-logger
```

**Output:**

```
⏸ Disabled hook: 📝 command-logger
```

**Setelah menonaktifkan:**

- Mulai ulang gateway agar pengait dimuat ulang

## Catatan

- `openclaw hooks list --json`, `info --json`, dan `check --json` menulis JSON terstruktur langsung ke stdout.
- Pengait yang dikelola Plugin tidak dapat diaktifkan atau dinonaktifkan di sini; aktifkan atau nonaktifkan plugin pemiliknya sebagai gantinya.

## Pasang paket pengait

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

Pasang paket pengait melalui pemasang plugin terpadu.

`openclaw hooks install` masih berfungsi sebagai alias kompatibilitas, tetapi mencetak
peringatan penghentian dan meneruskan ke `openclaw plugins install`.

Spesifikasi npm bersifat **hanya-registry** (nama paket + **versi persis** opsional atau
**dist-tag**). Spesifikasi Git/URL/file dan rentang semver ditolak. Pemasangan dependensi
berjalan lokal-proyek dengan `--ignore-scripts` demi keamanan, bahkan ketika
shell Anda memiliki pengaturan pemasangan npm global.

Spesifikasi polos dan `@latest` tetap berada di jalur stabil. Jika npm menyelesaikan salah satu dari
itu ke prarilis, OpenClaw berhenti dan meminta Anda ikut serta secara eksplisit dengan
tag prarilis seperti `@beta`/`@rc` atau versi prarilis persis.

**Yang dilakukannya:**

- Menyalin paket pengait ke `~/.openclaw/hooks/<id>`
- Mengaktifkan pengait yang dipasang di `hooks.internal.entries.*`
- Mencatat pemasangan di bawah `hooks.internal.installs`

**Opsi:**

- `-l, --link`: Tautkan direktori lokal alih-alih menyalin (menambahkannya ke `hooks.internal.load.extraDirs`)
- `--pin`: Catat pemasangan npm sebagai `name@version` hasil penyelesaian persis di `hooks.internal.installs`

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

Paket pengait tertaut diperlakukan sebagai pengait terkelola dari direktori yang
dikonfigurasi operator, bukan sebagai pengait workspace.

## Perbarui paket pengait

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Perbarui paket pengait berbasis npm yang dilacak melalui pembaru plugin terpadu.

`openclaw hooks update` masih berfungsi sebagai alias kompatibilitas, tetapi mencetak
peringatan penghentian dan meneruskan ke `openclaw plugins update`.

**Opsi:**

- `--all`: Perbarui semua paket pengait yang dilacak
- `--dry-run`: Tampilkan apa yang akan berubah tanpa menulis

Ketika hash integritas tersimpan ada dan hash artefak yang diambil berubah,
OpenClaw mencetak peringatan dan meminta konfirmasi sebelum melanjutkan. Gunakan
`--yes` global untuk melewati prompt dalam CI/proses noninteraktif.

## Pengait bawaan

### session-memory

Menyimpan konteks sesi ke memori saat Anda mengeluarkan `/new` atau `/reset`.

**Aktifkan:**

```bash
openclaw hooks enable session-memory
```

**Output:** `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md` secara default. Tetapkan `hooks.internal.entries.session-memory.llmSlug: true` untuk slug nama file yang dibuat model.

**Lihat:** [dokumentasi session-memory](/id/automation/hooks#session-memory)

### bootstrap-extra-files

Menyuntikkan file bootstrap tambahan (misalnya `AGENTS.md` / `TOOLS.md` lokal-monorepo) selama `agent:bootstrap`.

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
- [Pengait otomasi](/id/automation/hooks)
