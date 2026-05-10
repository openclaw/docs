---
read_when:
    - Anda ingin memeriksa atau mengedit satu simpul daun di dalam file ruang kerja dari terminal
    - Anda menulis skrip terhadap status ruang kerja dan memerlukan skema pengalamatan yang stabil serta tidak bergantung pada jenis.
    - Anda sedang memutuskan apakah akan mengaktifkan Plugin `oc-path` opsional pada Gateway yang dihosting sendiri
summary: 'Plugin `oc-path` bawaan: menyertakan CLI `openclaw path` untuk skema pengalamatan file ruang kerja `oc://`'
title: OC Path Plugin
x-i18n:
    generated_at: "2026-05-10T19:45:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

Plugin `oc-path` bawaan menambahkan CLI [`openclaw path`](/id/cli/path) untuk skema
pengalamatan file-ruang kerja `oc://`. Plugin ini dikirim di repo OpenClaw di bawah
`extensions/oc-path/` tetapi bersifat opt-in — install/build membiarkannya tidak aktif sampai Anda
mengaktifkannya.

Alamat `oc://` menunjuk ke satu leaf (atau kumpulan leaf wildcard) di dalam
file ruang kerja. Saat ini plugin memahami tiga jenis file:

- **markdown** (`.md`, `.mdx`): frontmatter, section, item, field
- **jsonc** (`.jsonc`, `.json5`, `.json`): komentar dan pemformatan dipertahankan
- **jsonl** (`.jsonl`, `.ndjson`): record berorientasi baris

Self-hoster dan ekstensi editor menggunakan CLI untuk membaca atau menulis satu leaf
tanpa membuat skrip langsung terhadap SDK; agen dan hook memperlakukannya sebagai
substrat deterministik sehingga round-trip dengan fidelitas byte dan penjaga sentinel
redaksi berlaku seragam di semua jenis.

## Mengapa mengaktifkannya

Aktifkan `oc-path` saat Anda ingin skrip, hook, atau tooling agen lokal menunjuk
ke bagian state ruang kerja yang presisi tanpa menciptakan parser untuk tiap bentuk
file. Satu alamat `oc://` dapat menamai kunci frontmatter markdown, item section,
leaf konfigurasi JSONC, atau field event JSONL.

Itu penting untuk workflow maintainer ketika perubahan harus kecil,
dapat diaudit, dan dapat diulang: periksa satu nilai, temukan record yang cocok, jalankan dry-run
untuk penulisan, lalu terapkan hanya leaf tersebut sambil membiarkan komentar, line ending, dan
pemformatan di sekitarnya tetap apa adanya. Menjaga ini sebagai plugin opt-in memberi power user
substrat pengalamatan tanpa memasukkan dependensi parser atau surface CLI ke
core untuk install yang tidak pernah membutuhkannya.

Alasan umum untuk mengaktifkannya:

- **Otomasi lokal**: skrip shell dapat me-resolve atau memperbarui satu nilai ruang kerja
  dengan `openclaw path … --json` alih-alih membawa kode parsing markdown, JSONC,
  dan JSONL yang terpisah.
- **Edit yang terlihat agen**: agen dapat menampilkan diff dry-run untuk satu leaf
  beralamat sebelum menulis, yang lebih mudah ditinjau daripada penulisan ulang file bebas.
- **Integrasi editor**: editor dapat memetakan `oc://AGENTS.md/tools/gh` ke node
  markdown dan nomor baris yang tepat tanpa menebak dari teks heading.
- **Diagnostik**: `emit` melakukan round-trip file melalui parser dan emitter, sehingga
  Anda dapat memeriksa apakah suatu jenis file stabil secara byte sebelum mengandalkan edit
  otomatis.

Contoh konkret:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Plugin ini sengaja bukan pemilik semantik tingkat lebih tinggi. Plugin
memori tetap memiliki penulisan memori, perintah konfigurasi tetap memiliki manajemen
konfigurasi penuh, dan logika LKG tetap memiliki restore/promosi. `oc-path` adalah lapisan
pengalamatan sempit dan operasi file yang mempertahankan byte yang dapat dibangun oleh tool
tingkat lebih tinggi tersebut.

## Tempat menjalankannya

Plugin berjalan **dalam proses di dalam CLI `openclaw`** pada host tempat Anda
memanggil perintah. Plugin ini tidak memerlukan Gateway yang sedang berjalan dan tidak membuka
socket jaringan apa pun — setiap verb adalah transformasi murni atas file yang Anda tunjuk.

Metadata plugin berada di `extensions/oc-path/openclaw.plugin.json`:

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

`onStartup: false` menjaga plugin tetap di luar hot path Gateway. `onCommands:
["path"]` memberi tahu CLI untuk memuat plugin secara lazy saat pertama kali Anda menjalankan
`openclaw path …`, sehingga install yang tidak pernah menggunakan verb tersebut tidak membayar biaya apa pun.

## Mengaktifkan

```bash
openclaw plugins enable oc-path
```

Restart Gateway (jika Anda menjalankannya) agar snapshot manifest mengambil state
baru. Pemanggilan `openclaw path` biasa langsung berfungsi pada host yang sama —
CLI memuat plugin sesuai kebutuhan.

Nonaktifkan dengan:

```bash
openclaw plugins disable oc-path
```

## Dependensi

Semua dependensi parser bersifat lokal plugin — mengaktifkan `oc-path` tidak menarik
paket baru ke runtime core:

| Dependensi     | Tujuan                                                              |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | Pengawatan subcommand untuk `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Parse JSONC + edit leaf dengan komentar dan trailing comma tetap dipertahankan. |
| `markdown-it`  | Tokenisasi Markdown untuk model section / item / field.             |

JSONL tetap dibuat sendiri — parsing berorientasi baris lebih sederhana daripada dependensi
apa pun, dan parse JSONC per baris sudah melalui `jsonc-parser`.

## Yang disediakannya

| Surface                        | Disediakan oleh                                         |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Parser / formatter `oc://`     | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Parse / emit / edit per jenis  | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| Universal resolve / find / set | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Penjaga sentinel redaksi       | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI adalah satu-satunya surface publik saat ini. Verb substrat bersifat privat untuk
plugin; konsumen menggunakan CLI (atau membangun plugin mereka sendiri terhadap SDK).

## Hubungan dengan plugin lain

- **`memory-*`**: penulisan memori berjalan melalui plugin memori, bukan `oc-path`.
  `oc-path` adalah substrat file generik; plugin memori melapiskan semantiknya sendiri
  di atasnya.
- **LKG**: `path` tidak tahu tentang restore konfigurasi Last-Known-Good. Jika suatu
  file dilacak LKG, panggilan `observe` berikutnya memutuskan apakah akan mempromosikan atau
  memulihkan; `set --batch` untuk multi-set atomik melalui lifecycle promosi/pemulihan LKG
  direncanakan bersama substrat pemulihan LKG.

## Keselamatan

`set` menulis byte mentah melalui jalur emit substrat, yang menerapkan penjaga
sentinel redaksi secara otomatis. Leaf yang membawa
`__OPENCLAW_REDACTED__` (verbatim atau sebagai substring) ditolak saat penulisan
dengan `OC_EMIT_SENTINEL`. CLI juga membersihkan sentinel literal dari output
manusia atau JSON apa pun yang dicetaknya, menggantinya dengan `[REDACTED]` sehingga tangkapan
terminal dan pipeline tidak pernah membocorkan marker tersebut.

## Terkait

- [Referensi CLI `openclaw path`](/id/cli/path)
- [Mengelola plugin](/id/plugins/manage-plugins)
- [Membangun plugin](/id/plugins/building-plugins)
