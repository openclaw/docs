---
read_when:
    - Anda ingin membaca atau menulis simpul daun di dalam file ruang kerja dari terminal
    - Anda membuat skrip terhadap status workspace dan menginginkan skema pengalamatan yang stabil serta tidak bergantung pada jenis
    - Anda sedang men-debug jalur `oc://` (validasi sintaksnya, lihat ke mana itu di-resolve)
summary: Referensi CLI untuk `openclaw path` (memeriksa dan mengedit file workspace melalui skema pengalamatan `oc://`)
title: Jalur
x-i18n:
    generated_at: "2026-06-27T17:20:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Akses shell yang disediakan Plugin ke substrat pengalamatan `oc://`: satu
skema path berbasis jenis untuk memeriksa dan mengedit file ruang kerja yang
dapat dialamati (markdown, jsonc, jsonl, yaml/yml/lobster). Pengelola
self-hosting, penulis Plugin, dan ekstensi editor menggunakannya untuk membaca,
menemukan, atau memperbarui lokasi sempit tanpa membuat parser per jenis file
secara manual.

CLI mencerminkan verba publik substrat:

- `resolve` bersifat konkret dan cocok tunggal.
- `find` adalah verba cocok jamak untuk wildcard, union, predikat, dan
  ekspansi posisional.
- `set` hanya menerima path konkret atau penanda penyisipan; pola wildcard
  ditolak sebelum penulisan.

`path` disediakan oleh Plugin opsional bawaan `oc-path`. Aktifkan sebelum
penggunaan pertama:

```bash
openclaw plugins enable oc-path
```

## Mengapa menggunakannya

State OpenClaw tersebar di markdown yang diedit manusia, konfigurasi JSONC
berkomentar, log JSONL append-only, dan file workflow/spesifikasi YAML. Skrip
shell, hook, dan agen sering membutuhkan satu nilai kecil dari file tersebut:
kunci frontmatter, pengaturan Plugin, field rekaman log, langkah YAML, atau
item bullet di bawah section bernama.

`openclaw path` memberi pemanggil tersebut alamat stabil alih-alih `grep`,
regex, atau parser sekali pakai untuk setiap jenis file. Path `oc://` yang sama
dapat divalidasi, di-resolve, dicari, disimulasikan, dan ditulis dari terminal,
sehingga automasi sempit lebih mudah ditinjau dan lebih aman diulang. Ini
sangat berguna ketika Anda ingin memperbarui satu leaf sambil mempertahankan
komentar, akhiran baris, dan pemformatan sekitar dari sisa file.

Gunakan ketika hal yang Anda inginkan memiliki alamat logis, tetapi bentuk file
fisiknya bervariasi:

- Sebuah hook ingin membaca satu pengaturan dari JSONC berkomentar tanpa
  kehilangan komentar saat menulis nilainya kembali.
- Skrip pemeliharaan ingin menemukan setiap field peristiwa yang cocok dalam log
  JSONL tanpa memuat seluruh log ke parser khusus.
- Ekstensi editor ingin melompat ke section markdown atau item bullet
  berdasarkan slug, lalu merender baris persis yang di-resolve.
- Agen ingin menyimulasikan edit ruang kerja kecil sebelum menerapkannya, dengan
  byte yang berubah terlihat dalam tinjauan.

Anda mungkin tidak memerlukan `openclaw path` untuk edit seluruh file biasa,
migrasi konfigurasi kaya, atau penulisan khusus memori. Itu sebaiknya
menggunakan perintah atau Plugin pemilik. `path` ditujukan untuk operasi file
kecil yang dapat dialamati ketika perintah terminal yang dapat diulang lebih
jelas daripada parser kustom lainnya.

## Cara penggunaannya

Baca satu nilai dari file konfigurasi yang diedit manusia:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Pratinjau penulisan tanpa menyentuh disk:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Temukan rekaman yang cocok dalam log JSONL append-only:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Alamatkan instruksi dalam markdown berdasarkan section dan item, bukan nomor
baris:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Validasi path di CI atau skrip preflight sebelum skrip membaca atau menulis:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Perintah tersebut dimaksudkan agar dapat disalin ke skrip shell. Gunakan
`--json` ketika pemanggil membutuhkan output terstruktur dan `--human` ketika
seseorang sedang memeriksa hasilnya.

## Cara kerjanya

`openclaw path` melakukan empat hal:

1. Mengurai alamat `oc://` menjadi slot: file, section, item, field, dan
   session opsional.
2. Memilih adapter jenis file dari ekstensi target (`.md`, `.jsonc`,
   `.jsonl`, `.yaml`, `.yml`, `.lobster`, dan alias terkait).
3. Meresolusi slot terhadap AST jenis file tersebut: heading/item markdown,
   kunci objek/indeks array JSONC, rekaman baris JSONL, atau node map/sequence
   YAML.
4. Untuk `set`, menghasilkan byte yang diedit melalui adapter yang sama agar
   bagian file yang tidak disentuh tetap mempertahankan komentar, akhiran baris,
   dan pemformatan di sekitarnya jika jenis file mendukungnya.

`resolve` dan `set` memerlukan satu target konkret. `find` adalah kata kerja
eksploratif: ia memperluas wildcard, union, predikat, dan ordinal menjadi
kecocokan konkret yang dapat Anda periksa sebelum memilih satu untuk ditulis.

## Subperintah

| Subperintah             | Tujuan                                                                       |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Mencetak kecocokan konkret pada path (atau "tidak ditemukan").               |
| `find <pattern>`        | Mengenumerasi kecocokan untuk path wildcard / union / predikat.              |
| `set <oc-path> <value>` | Menulis leaf atau target penyisipan pada path konkret. Mendukung `--dry-run`. |
| `validate <oc-path>`    | Hanya mengurai; mencetak uraian struktural (file / section / item / field).  |
| `emit <file>`           | Round-trip file melalui `parseXxx` + `emitXxx` (diagnostik fidelitas byte).  |

## Flag global

| Flag            | Tujuan                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Meresolusi slot file terhadap direktori ini (default: `process.cwd()`).  |
| `--file <path>` | Menimpa path hasil resolusi slot file (akses absolut).                   |
| `--json`        | Memaksa output JSON (default saat stdout bukan TTY).                     |
| `--human`       | Memaksa output manusiawi (default saat stdout adalah TTY).               |
| `--dry-run`     | (hanya pada `set`) mencetak byte yang akan ditulis tanpa menulis.        |
| `--diff`        | (dengan `set --dry-run`) mencetak diff terpadu alih-alih byte lengkap.   |

## Sintaks `oc://`

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Aturan slot: `field` memerlukan `item`, dan `item` memerlukan `section`. Di
keempat slot:

- **Segmen berkutip** — `"a/b.c"` tetap melewati pemisah `/` dan `.`.
  Konten bersifat byte-literal; `"` dan `\` tidak diizinkan di dalam kutip.
  Slot file juga sadar kutip: `oc://"skills/email-drafter"/Tools/$last`
  memperlakukan `skills/email-drafter` sebagai satu path file.
- **Predikat** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Operasi numerik mengharuskan kedua sisi dapat dikonversi menjadi angka finite.
- **Union** — `{a,b,c}` cocok dengan salah satu alternatif.
- **Wildcard** — `*` (satu sub-segmen) dan `**` (nol-atau-lebih,
  rekursif). `find` menerima ini; `resolve` dan `set` menolaknya karena
  ambigu.
- **Posisional** — `$first` / `$last` meresolusi ke indeks pertama / terakhir atau
  kunci yang dideklarasikan.
- **Ordinal** — `#N` untuk kecocokan ke-N menurut urutan dokumen.
- **Penanda penyisipan** — `+`, `+key`, `+nnn` untuk penyisipan berkunci /
  berindeks (gunakan dengan `set`).
- **Cakupan session** — `?session=cron-daily` dll. Ortogonal terhadap
  penyarangan slot. Nilai session bersifat mentah, tidak di-decode persen; nilainya tidak boleh berisi
  karakter kontrol atau delimiter query yang dicadangkan (`?`, `&`, `%`).

Karakter yang dicadangkan (`?`, `&`, `%`) di luar segmen berkutip, predikat,
atau union ditolak. Karakter kontrol (U+0000-U+001F, U+007F) ditolak
di mana pun, termasuk nilai query `session`.

`formatOcPath(parseOcPath(path)) === path` dijamin untuk path kanonis.
Parameter query non-kanonis diabaikan kecuali nilai `session=` pertama yang
tidak kosong.

## Pengalamatan berdasarkan jenis file

| Jenis             | Model pengalamatan                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | Section H2 berdasarkan slug, item bullet berdasarkan slug atau `#N`, frontmatter melalui `[frontmatter]`. |
| JSONC/JSON        | Kunci objek dan indeks array; titik memisahkan sub-segmen bertingkat kecuali dikutip.               |
| JSONL             | Alamat baris tingkat atas (`L1`, `L2`, `$first`, `$last`), lalu penurunan gaya JSONC di dalam baris. |
| YAML/YML/.lobster | Kunci map dan indeks sequence; komentar dan gaya flow ditangani oleh API dokumen YAML.              |

`resolve` mengembalikan kecocokan terstruktur: `root`, `node`, `leaf`, atau
`insertion-point`, dengan nomor baris berbasis 1. Nilai leaf ditampilkan sebagai teks
plus `leafType` agar penulis plugin dapat merender pratinjau tanpa bergantung pada
bentuk AST per jenis.

## Kontrak mutasi

`set` menulis satu target konkret:

- Nilai frontmatter Markdown dan field item `- key: value` adalah leaf string.
  Penyisipan Markdown menambahkan section, kunci frontmatter, atau item section dan
  merender bentuk markdown kanonis untuk file yang berubah.
- Penulisan leaf JSONC mengonversi nilai string ke jenis leaf yang ada
  (`string`, `number` finite, `true`/`false`, atau `null`). Gunakan `--value-json`
  saat penggantian leaf JSONC/JSON/JSONL harus mengurai `<value>` sebagai JSON dan
  dapat mengubah bentuk, seperti mengganti shorthand SecretRef string dengan
  objek. Penyisipan objek dan array JSONC mengurai `<value>` sebagai JSON dan menggunakan
  jalur edit `jsonc-parser` untuk penulisan leaf biasa, mempertahankan komentar dan
  pemformatan di sekitarnya.
- Penulisan leaf JSONL mengonversi seperti JSONC di dalam satu baris. Penggantian
  seluruh baris dan append mengurai `<value>` sebagai JSON. JSONL yang dirender mempertahankan
  konvensi akhiran baris LF/CRLF dominan file.
- Penulisan leaf YAML mengonversi ke jenis scalar yang ada (`string`, `number`
  finite, `true`/`false`, atau `null`). Penyisipan YAML menggunakan API dokumen
  paket `yaml` yang dibundel untuk pembaruan map/sequence. Dokumen YAML yang
  rusak dengan error parser ditolak sebelum mutasi dengan `parse-error`.

Gunakan `--dry-run` sebelum penulisan yang terlihat pengguna saat byte persisnya penting. Substrat
mempertahankan output identik byte untuk round-trip parse/emit, tetapi
mutasi dapat mengkanoniskan wilayah atau file yang diedit tergantung jenisnya.
Tambahkan `--diff` saat Anda menginginkan pratinjau sebagai patch sebelum/sesudah yang terfokus
alih-alih file lengkap yang dirender.

## Contoh

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

Contoh tata bahasa lainnya:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Resep berdasarkan jenis file

Lima verba yang sama bekerja di berbagai jenis; skema pengalamatan melakukan dispatch berdasarkan ekstensi file. Contoh di bawah menggunakan fixture dari deskripsi PR.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

Predikat `[frontmatter]` mengalamatkan blok frontmatter YAML; `tools` mencocokkan heading `## Tools` melalui slug, dan leaf item mempertahankan bentuk slug-nya meskipun sumber memakai garis bawah (`send_email` → `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

Edit JSONC melewati `jsonc-parser`, sehingga komentar dan whitespace tetap bertahan setelah `set`. Jalankan dengan `--dry-run` lebih dulu untuk memeriksa byte sebelum melakukan commit.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Setiap baris adalah sebuah record. Alamatkan dengan predikat (`[event=action]`) saat Anda tidak mengetahui nomor barisnya, atau dengan segmen kanonis `LN` saat Anda mengetahuinya.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML menggunakan API `Document` dari paket `yaml`, bukan parser buatan sendiri, sehingga round-trip parse/emit biasa mempertahankan komentar dan bentuk penulisan sementara path yang di-resolve menggunakan model map-key / sequence-index yang sama seperti JSONC. Adapter yang sama menangani file `.yaml`, `.yml`, dan `.lobster`.

## Referensi subperintah

### `resolve <oc-path>`

Baca satu leaf atau node. Wildcard ditolak — gunakan `find` untuk itu. Keluar dengan `0` pada kecocokan, `1` pada miss yang bersih, `2` pada error parse atau pola yang ditolak.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Enumerasi setiap kecocokan untuk pola wildcard / predikat / union. Keluar dengan `0` jika ada setidaknya satu kecocokan, `1` jika nol. Wildcard slot file ditolak dengan `OC_PATH_FILE_WILDCARD_UNSUPPORTED` — berikan file konkret (globbing multi-file adalah fitur lanjutan).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Tulis sebuah leaf. Pasangkan dengan `--dry-run` untuk meninjau byte yang akan ditulis tanpa menyentuh file. Tambahkan `--diff` untuk pratinjau unified diff. Keluar dengan `0` pada penulisan yang berhasil, `1` jika substrate menolak (misalnya, sentinel guard terkena), `2` pada error parse.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Marker penyisipan `+key` membuat child bernama jika belum ada; `+nnn` dan `+` polos masing-masing berfungsi untuk penyisipan berindeks dan append.

### `validate <oc-path>`

Pemeriksaan parse saja. Tidak ada akses filesystem. Berguna saat Anda ingin memastikan path template sudah berbentuk benar sebelum mengganti variabel, atau saat Anda menginginkan uraian struktural untuk debugging:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Keluar dengan `0` saat valid, `1` saat tidak valid (dengan `code` dan `message` terstruktur), `2` pada error argumen.

### `emit <file>`

Round-trip file melalui parser dan emitter per jenis. Output seharusnya identik byte demi byte dengan input pada file yang sehat — perbedaan menunjukkan bug parser atau sentinel yang terkena. Berguna untuk debugging perilaku substrate pada input dunia nyata.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Kode keluar

| Kode | Makna                                                                      |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Berhasil. (`resolve` / `find`: setidaknya satu kecocokan. `set`: penulisan berhasil.) |
| `1`  | Tidak ada kecocokan, atau `set` ditolak oleh substrate (tanpa error tingkat sistem). |
| `2`  | Error argumen atau parse.                                                  |

## Mode keluaran

`openclaw path` sadar TTY: output yang dapat dibaca manusia di terminal, JSON saat stdout di-pipe atau dialihkan. `--json` dan `--human` menimpa deteksi otomatis.

## Catatan

- `set` menulis byte melalui path emit substrate, yang menerapkan guard sentinel redaksi secara otomatis. Leaf yang membawa `__OPENCLAW_REDACTED__` (verbatim atau sebagai substring) ditolak pada waktu tulis.
- Parsing JSONC dan edit leaf menggunakan dependensi `jsonc-parser` lokal Plugin, sehingga komentar dan pemformatan dipertahankan pada penulisan leaf biasa alih-alih melewati path parser/render ulang buatan sendiri.
- `path` tidak mengetahui LKG. Jika file dilacak LKG, panggilan observe berikutnya memutuskan apakah akan promote / recover. `set --batch` untuk multi-set atomik melalui siklus hidup promote/recover LKG direncanakan bersama substrate pemulihan LKG.

## Terkait

- [Referensi CLI](/id/cli)
