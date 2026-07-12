---
read_when:
    - Anda ingin mengelola hook agen
    - Anda ingin memeriksa ketersediaan hook atau mengaktifkan hook ruang kerja
summary: Referensi CLI untuk `openclaw hooks` (hook agen)
title: Hook
x-i18n:
    generated_at: "2026-07-12T14:02:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33d1e343771971bdc17dcafdabc6c4fc893b3080897862475a148e5f3957796
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

Kelola hook agen (otomatisasi berbasis peristiwa untuk perintah seperti `/new`, `/reset`, dan startup Gateway). `openclaw hooks` tanpa argumen setara dengan `openclaw hooks list`.

Terkait: [Hook](/id/automation/hooks) - [Hook Plugin](/id/plugins/hooks)

## Mencantumkan hook

```bash
openclaw hooks list [--eligible] [--json] [-v|--verbose]
```

Mencantumkan hook yang ditemukan dari direktori ruang kerja, terkelola, tambahan, dan bawaan.

- `--eligible`: hanya hook yang persyaratannya terpenuhi.
- `--json`: keluaran terstruktur.
- `-v, --verbose`: sertakan kolom Missing yang berisi persyaratan yang belum terpenuhi.

```
Hook (4/5 siap)

Siap:
  🚀 boot-md ✓ - Jalankan BOOT.md saat startup Gateway
  📎 bootstrap-extra-files ✓ - Injeksi file bootstrap ruang kerja tambahan selama bootstrap agen
  📝 command-logger ✓ - Catat semua peristiwa perintah ke file audit terpusat
  💾 session-memory ✓ - Simpan konteks sesi ke memori saat perintah /new atau /reset diterbitkan
```

## Mendapatkan informasi hook

```bash
openclaw hooks info <name> [--json]
```

`<name>` adalah nama atau kunci hook (misalnya `session-memory`). Menampilkan sumber, jalur file/handler, beranda, peristiwa, dan status setiap persyaratan (biner, env, konfigurasi, OS).

## Memeriksa kelayakan

```bash
openclaw hooks check [--json]
```

Mencetak ringkasan jumlah siap/tidak siap; jika ada hook yang tidak siap, mencantumkan masing-masing beserta alasan pemblokirnya.

## Mengaktifkan hook

```bash
openclaw hooks enable <name>
```

Menambahkan/memperbarui `hooks.internal.entries.<name>.enabled = true` dalam konfigurasi dan juga mengaktifkan sakelar utama `hooks.internal.enabled` (Gateway tidak memuat handler hook internal apa pun hingga setidaknya satu dikonfigurasi). Gagal jika hook tidak ada, dikelola Plugin, atau tidak memenuhi syarat (persyaratan tidak lengkap).

Hook yang dikelola Plugin menampilkan `plugin:<id>` dalam `hooks list` dan tidak dapat diaktifkan/dinonaktifkan di sini; aktifkan atau nonaktifkan Plugin pemiliknya sebagai gantinya.

Mulai ulang Gateway setelah mengaktifkan (mulai ulang aplikasi bilah menu macOS, atau mulai ulang proses Gateway Anda dalam pengembangan) agar hook dimuat ulang.

## Menonaktifkan hook

```bash
openclaw hooks disable <name>
```

Menetapkan `hooks.internal.entries.<name>.enabled = false`. Mulai ulang Gateway setelahnya.

## Menginstal dan memperbarui paket hook

```bash
openclaw plugins install <package>        # npm secara default
openclaw plugins install npm:<package>    # hanya npm
openclaw plugins install <package> --pin  # sematkan versi yang diresolusi
openclaw plugins install <path>           # direktori atau arsip lokal
openclaw plugins install -l <path>        # tautkan direktori lokal alih-alih menyalinnya

openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins update --dry-run
```

Paket hook diinstal melalui penginstal/pembaruan Plugin terpadu; `openclaw hooks install` / `openclaw hooks update` masih berfungsi sebagai alias usang yang mencetak peringatan dan meneruskan ke perintah `plugins`.

- Spesifikasi npm hanya untuk registry: nama paket ditambah versi persis atau dist-tag opsional. Spesifikasi Git/URL/file dan rentang semver ditolak. Instalasi dependensi dijalankan secara lokal dalam proyek dengan `--ignore-scripts`.
- Spesifikasi tanpa versi dan `@latest` tetap berada di jalur stabil; jika npm meresolusi ke prarilis, OpenClaw berhenti dan meminta Anda untuk menyetujuinya secara eksplisit (`@beta`, `@rc`, atau versi prarilis persis).
- Arsip yang didukung: `.zip`, `.tgz`, `.tar.gz`, `.tar`.
- `-l, --link` menautkan direktori lokal alih-alih menyalinnya (menambahkannya ke `hooks.internal.load.extraDirs`); paket hook tertaut adalah hook terkelola dari direktori yang dikonfigurasi operator, bukan hook ruang kerja.
- `--pin` mencatat instalasi npm sebagai `name@version` persis yang diresolusi dalam `hooks.internal.installs`.
- Instalasi menyalin paket ke `~/.openclaw/hooks/<id>`, mengaktifkan hook-nya di bawah `hooks.internal.entries.*`, dan mencatat instalasi di bawah `hooks.internal.installs`.
- Jika hash integritas tersimpan tidak lagi cocok dengan artefak yang diambil, OpenClaw memperingatkan dan meminta konfirmasi sebelum melanjutkan; berikan `--yes` global untuk melewati konfirmasi (misalnya dalam CI).

## Hook bawaan

| Hook                  | Peristiwa                                         | Fungsinya                                                                                               |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| boot-md               | `gateway:startup`                                 | Menjalankan `BOOT.md` saat startup Gateway untuk setiap cakupan agen yang dikonfigurasi                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | Menginjeksi file bootstrap tambahan (misalnya `AGENTS.md`/`TOOLS.md` monorepo) selama bootstrap agen     |
| command-logger        | `command`                                         | Mencatat peristiwa perintah ke `~/.openclaw/logs/commands.log`                                          |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Mengirim pemberitahuan obrolan yang terlihat saat pemadatan sesi dimulai dan selesai                    |
| session-memory        | `command:new`, `command:reset`                    | Menyimpan konteks sesi ke memori saat `/new` atau `/reset`                                              |

Aktifkan hook bawaan apa pun dengan `openclaw hooks enable <hook-name>`. Detail lengkap, kunci konfigurasi, dan nilai default: [Hook bawaan](/id/automation/hooks#bundled-hooks).

### File log command-logger

```bash
tail -n 20 ~/.openclaw/logs/commands.log        # perintah terbaru
cat ~/.openclaw/logs/commands.log | jq .          # cetak dengan format yang mudah dibaca
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .   # filter berdasarkan tindakan
```

## Catatan

- `hooks list --json`, `info --json`, dan `check --json` menulis JSON terstruktur langsung ke stdout.

## Terkait

- [Referensi CLI](/id/cli)
- [Hook otomatisasi](/id/automation/hooks)
