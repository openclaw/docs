---
read_when:
    - Anda ingin memeriksa atau mengedit satu leaf di dalam file workspace dari terminal
    - Anda membuat skrip terhadap status workspace dan memerlukan skema pengalamatan yang stabil serta tidak bergantung pada jenis.
    - Anda sedang memutuskan apakah akan mengaktifkan plugin `oc-path` opsional pada Gateway yang dihosting sendiri
summary: 'Bundled `oc-path` Plugin: menyertakan CLI `openclaw path` untuk skema pengalamatan file ruang kerja `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-06-27T17:50:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

Plugin `oc-path` bawaan menambahkan CLI [`openclaw path`](/id/cli/path) untuk skema
pengalamatan file ruang kerja `oc://`. Plugin ini dikirim di repo OpenClaw di bawah
`extensions/oc-path/`, tetapi bersifat opt-in — install/build membiarkannya dorman sampai Anda
mengaktifkannya.

Alamat `oc://` menunjuk ke satu daun (atau kumpulan daun wildcard) di dalam
file ruang kerja. Plugin saat ini memahami empat jenis file:

- **markdown** (`.md`, `.mdx`): frontmatter, bagian, item, field
- **jsonc** (`.jsonc`, `.json5`, `.json`): komentar dan pemformatan dipertahankan
- **jsonl** (`.jsonl`, `.ndjson`): record berorientasi baris
- **yaml** (`.yaml`, `.yml`, `.lobster`): node map/sequence/scalar melalui API dokumen
  YAML

Self-hoster dan ekstensi editor menggunakan CLI untuk membaca atau menulis satu daun
tanpa membuat skrip langsung terhadap SDK; agen dan hook memperlakukannya sebagai
substrat deterministik sehingga round-trip dengan fidelitas byte dan penjagaan sentinel
redaksi berlaku seragam di semua jenis.

## Mengapa mengaktifkannya

Aktifkan `oc-path` ketika Anda ingin skrip, hook, atau tooling agen lokal menunjuk
ke bagian tepat dari state ruang kerja tanpa menciptakan parser untuk setiap bentuk
file. Satu alamat `oc://` dapat menamai kunci frontmatter markdown, item bagian,
daun konfigurasi JSONC, field peristiwa JSONL, atau langkah workflow YAML.

Itu penting untuk workflow maintainer ketika perubahan harus kecil,
dapat diaudit, dan dapat diulang: periksa satu nilai, temukan record yang cocok, dry-run
penulisan, lalu terapkan hanya daun tersebut sambil membiarkan komentar, akhiran baris, dan
pemformatan di sekitarnya tetap utuh. Menjaga ini sebagai Plugin opt-in memberi power user
substrat pengalamatan tanpa memasukkan dependensi parser atau permukaan CLI ke
core untuk instalasi yang tidak pernah membutuhkannya.

Alasan umum untuk mengaktifkannya:

- **Otomasi lokal**: skrip shell dapat me-resolve atau memperbarui satu nilai ruang kerja
  dengan `openclaw path … --json` alih-alih membawa kode parsing markdown, JSONC,
  JSONL, dan YAML yang terpisah.
- **Edit yang terlihat agen**: agen dapat menampilkan diff dry-run untuk satu daun yang
  dialamatkan sebelum menulis, yang lebih mudah ditinjau daripada penulisan ulang file bebas.
- **Integrasi editor**: editor dapat memetakan `oc://AGENTS.md/tools/gh` ke
  node markdown dan nomor baris yang tepat tanpa menebak dari teks heading.
- **Diagnostik**: `emit` melakukan round-trip file melalui parser dan emitter, sehingga
  Anda dapat memeriksa apakah suatu jenis file stabil secara byte sebelum mengandalkan
  edit otomatis.

Contoh konkret:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Plugin ini sengaja bukan pemilik semantik tingkat lebih tinggi. Plugin memori
tetap memiliki penulisan memori, command konfigurasi tetap memiliki manajemen konfigurasi
penuh, dan logika LKG tetap memiliki restore/promosi. `oc-path` adalah lapisan sempit
pengalamatan dan operasi file yang mempertahankan byte yang dapat menjadi dasar
tool tingkat lebih tinggi tersebut.

## Tempat menjalankannya

Plugin berjalan **di dalam proses CLI `openclaw`** pada host tempat Anda
memanggil command. Ini tidak membutuhkan Gateway yang sedang berjalan dan tidak membuka
socket jaringan apa pun — setiap verb adalah transformasi murni atas file yang Anda tunjuk.

Metadata Plugin berada di `extensions/oc-path/openclaw.plugin.json`:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` menjaga Plugin tetap di luar hot path Gateway. `onCommands:
["path"]` memberi tahu CLI untuk memuat Plugin secara lazy pertama kali Anda menjalankan
`openclaw path …`, sehingga instalasi yang tidak pernah menggunakan verb tersebut tidak membayar biaya apa pun.

## Aktifkan

```bash
openclaw plugins enable oc-path
```

Mulai ulang Gateway (jika Anda menjalankannya) agar snapshot manifest menangkap state
baru. Pemanggilan `openclaw path` polos langsung berfungsi di host yang sama —
CLI memuat Plugin sesuai permintaan.

Nonaktifkan dengan:

```bash
openclaw plugins disable oc-path
```

## Dependensi

Semua dependensi parser bersifat lokal Plugin — mengaktifkan `oc-path` tidak menarik
paket baru ke runtime core:

| Dependensi     | Tujuan                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Wiring subcommand untuk `resolve`, `find`, `set`, `validate`, `emit`.  |
| `jsonc-parser` | Parse JSONC + edit daun dengan komentar dan koma akhir tetap terjaga.  |
| `markdown-it`  | Tokenisasi Markdown untuk model bagian / item / field.                 |
| `yaml`         | Parse / emit / edit `Document` YAML dengan komentar dan gaya flow tetap terjaga. |

JSONL tetap dibuat manual — parsing berorientasi baris lebih sederhana daripada
dependensi apa pun, dan parse JSONC per baris sudah melalui `jsonc-parser`.

## Yang disediakannya

| Permukaan                      | Disediakan oleh                                          |
| ------------------------------ | -------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                 |
| Parser / formatter `oc://`     | `extensions/oc-path/src/oc-path/oc-path.ts`              |
| Parse / emit / edit per jenis  | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`   |
| Resolve / find / set universal | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts`  |
| Penjaga sentinel redaksi       | `extensions/oc-path/src/oc-path/sentinel.ts`             |

CLI adalah satu-satunya permukaan publik saat ini. Verb substrat bersifat privat untuk
Plugin; konsumen menggunakan CLI (atau membangun Plugin mereka sendiri terhadap SDK).

## Hubungan dengan Plugin lain

- **`memory-*`**: penulisan memori berjalan melalui Plugin memori, bukan `oc-path`.
  `oc-path` adalah substrat file generik; Plugin memori menambahkan semantiknya sendiri
  di atasnya.
- **LKG**: `path` tidak mengetahui restore konfigurasi Last-Known-Good. Jika
  file dilacak LKG, panggilan `observe` berikutnya memutuskan apakah akan mempromosikan atau
  memulihkan; `set --batch` untuk multi-set atomik melalui siklus hidup promosi/pemulihan
  LKG direncanakan bersama substrat pemulihan LKG.

## Keamanan

`set` menulis byte mentah melalui jalur emit substrat, yang menerapkan
penjaga sentinel redaksi secara otomatis. Daun yang membawa
`__OPENCLAW_REDACTED__` (secara verbatim atau sebagai substring) ditolak saat penulisan
dengan `OC_EMIT_SENTINEL`. CLI juga membersihkan sentinel literal dari output
manusia atau JSON apa pun yang dicetaknya, menggantinya dengan `[REDACTED]` sehingga tangkapan
terminal dan pipeline tidak pernah membocorkan marker tersebut.

## Terkait

- [Referensi CLI `openclaw path`](/id/cli/path)
- [Mengelola Plugin](/id/plugins/manage-plugins)
- [Membangun Plugin](/id/plugins/building-plugins)
