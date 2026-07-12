---
read_when:
    - Anda ingin membaca atau menulis nilai paling akhir di dalam berkas ruang kerja melalui terminal
    - Anda membuat skrip yang mengakses status ruang kerja dan menginginkan skema pengalamatan yang stabil serta tidak bergantung pada jenisnya
    - Anda sedang men-debug jalur `oc://` (validasi sintaksnya, lihat jalur tersebut di-resolve menjadi apa)
summary: Referensi CLI untuk `openclaw path` (memeriksa dan mengedit berkas ruang kerja melalui skema pengalamatan `oc://`)
title: Jalur
x-i18n:
    generated_at: "2026-07-12T14:07:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Akses shell ke skema pengalamatan `oc://`: satu sintaks jalur yang didispatch berdasarkan jenis untuk memeriksa dan mengedit berkas ruang kerja yang dapat dialamatkan (markdown, jsonc, jsonl, yaml/yml/lobster). Pengelola hosting mandiri, pembuat plugin, dan ekstensi editor menggunakannya untuk membaca, menemukan, atau memperbarui lokasi spesifik tanpa harus membuat parser tersendiri untuk setiap jenis berkas.

`path` disediakan oleh plugin opsional bawaan `oc-path`. Aktifkan sebelum penggunaan pertama:

```bash
openclaw plugins enable oc-path
```

Verba CLI mencerminkan model pengalamatan:

- `resolve` bersifat konkret dan hanya menghasilkan satu kecocokan.
- `find` adalah verba untuk banyak kecocokan bagi wildcard, union, predikat, dan perluasan posisi.
- `set` hanya menerima jalur konkret atau penanda penyisipan; pola wildcard ditolak sebelum penulisan.
- `validate` mengurai jalur tanpa mengakses sistem berkas.
- `emit` melakukan perjalanan pulang-pergi berkas melalui penguraian + pengeluaran (diagnostik ketepatan bita).

## Mengapa menggunakannya

Status OpenClaw tersebar di markdown yang diedit manusia, konfigurasi JSONC berkomentar, log JSONL yang hanya dapat ditambahkan, serta berkas alur kerja/spesifikasi YAML. Skrip, hook, dan agen sering kali hanya memerlukan satu nilai kecil dari berkas-berkas tersebut: kunci frontmatter, pengaturan plugin, bidang catatan log, langkah YAML, atau butir daftar di bawah bagian bernama.

`openclaw path` memberi pemanggil tersebut alamat yang stabil, alih-alih grep, regex, atau parser sekali pakai untuk setiap jenis berkas. Jalur `oc://` yang sama dapat divalidasi, di-resolve, dicari, disimulasikan, dan ditulis dari terminal, sehingga automasi spesifik tetap dapat ditinjau dan dijalankan ulang. Bagian berkas lainnya dipertahankan, sehingga menulis satu leaf tidak mengganggu komentar, akhir baris, atau pemformatan di sekitarnya.

Gunakan saat sesuatu yang Anda inginkan memiliki alamat logis, tetapi bentuk berkasnya beragam:

- Hook membaca satu pengaturan dari JSONC berkomentar tanpa kehilangan komentar saat menuliskan kembali nilainya.
- Skrip pemeliharaan menemukan setiap bidang peristiwa yang cocok dalam log JSONL tanpa memuat seluruh log ke parser khusus.
- Editor berpindah ke bagian atau butir daftar markdown berdasarkan slug, lalu merender baris persis yang di-resolve.
- Agen menyimulasikan pengeditan kecil pada ruang kerja sebelum menerapkannya, dengan bita yang berubah terlihat dalam peninjauan.

Jangan gunakan `openclaw path` untuk pengeditan seluruh berkas biasa, migrasi konfigurasi yang kompleks, atau penulisan khusus memori; gunakan perintah atau plugin pemiliknya. `path` ditujukan untuk operasi berkas kecil yang dapat dialamatkan, ketika perintah terminal yang dapat diulang lebih baik daripada parser khusus lainnya.

## Cara menggunakannya

Baca satu nilai dari berkas konfigurasi yang diedit manusia:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Pratinjau penulisan tanpa menyentuh disk:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Temukan catatan yang cocok dalam log JSONL yang hanya dapat ditambahkan:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Alamatkan instruksi dalam markdown berdasarkan bagian dan butir, bukan berdasarkan nomor baris:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Validasi jalur dalam CI atau skrip pemeriksaan awal sebelum skrip membaca atau menulis:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Perintah-perintah ini dirancang agar dapat disalin ke skrip shell. Gunakan `--json` saat pemanggil memerlukan keluaran terstruktur dan `--human` saat seseorang memeriksa hasilnya.

## Cara kerjanya

1. Mengurai alamat `oc://` menjadi slot: berkas, bagian, butir, bidang, dan kueri sesi opsional.
2. Memilih adaptor jenis berkas berdasarkan ekstensi target (`.md`, `.jsonc`, `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Me-resolve slot terhadap struktur jenis berkas tersebut: judul/butir markdown, kunci objek/indeks larik JSONC, catatan baris JSONL, atau simpul peta/urutan YAML.
4. Untuk `set`, menghasilkan bita yang diedit melalui adaptor yang sama agar bagian berkas yang tidak disentuh tetap mempertahankan komentar, akhir baris, dan pemformatan di sekitarnya jika didukung oleh jenis tersebut.

`resolve` dan `set` memerlukan satu target konkret. `find` adalah verba eksploratif: verba ini memperluas wildcard, union, predikat, dan ordinal menjadi kecocokan konkret yang dapat Anda periksa sebelum memilih satu untuk ditulis.

## Subperintah

| Subperintah             | Tujuan                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Cetak kecocokan konkret pada jalur (atau "tidak ditemukan").                             |
| `find <pattern>`        | Enumerasikan kecocokan untuk jalur wildcard / union / predikat.                          |
| `set <oc-path> <value>` | Tulis leaf atau target penyisipan pada jalur konkret. Mendukung `--dry-run`.              |
| `validate <oc-path>`    | Hanya mengurai; cetak rincian struktural (berkas / bagian / butir / bidang).              |
| `emit <file>`           | Lakukan perjalanan pulang-pergi berkas melalui penguraian + pengeluaran (diagnostik ketepatan bita). |

## Flag global

| Flag            | Berlaku untuk                     | Tujuan                                                                                 |
| --------------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit`  | Resolve slot berkas terhadap direktori ini (bawaan: `process.cwd()`).                   |
| `--file <path>` | `resolve`, `find`, `set`, `emit`  | Timpa jalur hasil resolve slot berkas (akses absolut).                                  |
| `--json`        | semua                             | Paksa keluaran JSON (bawaan saat stdout bukan TTY).                                     |
| `--human`       | semua                             | Paksa keluaran yang mudah dibaca manusia (bawaan saat stdout adalah TTY).               |
| `--value-json`  | `set`                             | Urai `<value>` sebagai JSON untuk penggantian leaf JSON/JSONC/JSONL.                    |
| `--dry-run`     | `set`                             | Cetak bita yang akan ditulis tanpa melakukan penulisan.                                 |
| `--diff`        | `set` (memerlukan `--dry-run`)    | Cetak diff terpadu alih-alih seluruh bita.                                              |

`validate` hanya menerima `--json` / `--human`; perintah ini tidak mengakses sistem berkas, sehingga `--cwd` dan `--file` tidak berlaku.

## Sintaks `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Aturan slot: `field` memerlukan `item`, dan `item` memerlukan `section`. Di keempat slot:

- **Segmen bertanda kutip** — `"a/b.c"` tidak terpengaruh oleh pemisah `/` dan `.`. Kontennya bersifat literal-bita; `"` dan `\` tidak diizinkan di dalam tanda kutip. Slot berkas juga memahami tanda kutip: `oc://"skills/email-drafter"/Tools/$last` memperlakukan `skills/email-drafter` sebagai satu jalur berkas.
- **Predikat** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`. Operator numerik mengharuskan kedua sisi dapat dikonversi menjadi bilangan terbatas.
- **Union** — `{a,b,c}` cocok dengan alternatif mana pun.
- **Wildcard** — `*` (satu subsegmen) dan `**` (nol atau lebih, rekursif). `find` menerimanya; `resolve` dan `set` menolaknya karena ambigu.
- **Posisional** — `$first` / `$last` di-resolve menjadi indeks atau kunci yang dideklarasikan pertama / terakhir.
- **Ordinal** — `#N` untuk kecocokan ke-N berdasarkan urutan dokumen.
- **Penanda penyisipan** — `+`, `+key`, `+nnn` untuk penyisipan berdasarkan kunci / indeks (gunakan dengan `set`).
- **Cakupan sesi** — `?session=cron-daily` dan sebagainya. Independen dari penyarangan slot. Nilai sesi bersifat mentah, tidak didekode persen; nilai tersebut tidak boleh berisi karakter kontrol atau pembatas kueri yang dicadangkan (`?`, `&`, `%`).

Karakter yang dicadangkan (`?`, `&`, `%`) di luar segmen bertanda kutip, predikat, atau union ditolak. Karakter kontrol (U+0000-U+001F, U+007F) ditolak di mana pun, termasuk dalam nilai kueri `session`.

`formatOcPath(parseOcPath(path)) === path` dijamin untuk jalur kanonis. Parameter kueri nonkanonis diabaikan, kecuali nilai `session=` pertama yang tidak kosong.

Batas ketat: panjang jalur dibatasi hingga 4096 bita, paling banyak 4 slot (berkas/bagian/butir/bidang), paling banyak 64 subsegmen bertitik per slot, dan paling banyak 256 tingkat penelusuran bertingkat untuk jalur JSON dalam. Secara terpisah, setiap masukan berkas JSONC/JSON yang melebihi 16 MiB ditolak dengan diagnostik penguraian alih-alih diurai, untuk semua verba yang memuat berkas tersebut.

## Pengalamatan berdasarkan jenis berkas

| Jenis         | Ekstensi berkas              | Model pengalamatan                                                                                         |
| ------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                        | Bagian H2 berdasarkan slug, butir daftar berdasarkan slug atau `#N`, frontmatter melalui `[frontmatter]`. |
| JSONC/JSON    | `.jsonc`, `.json`            | Kunci objek dan indeks larik; titik memisahkan subsegmen bertingkat kecuali jika diberi tanda kutip.       |
| JSONL         | `.jsonl`, `.ndjson`          | Alamat baris tingkat atas (`L1`, `L2`, `$first`, `$last`), lalu penelusuran bergaya JSONC di dalam baris.  |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`  | Kunci peta dan indeks urutan; komentar dan gaya alir ditangani oleh API dokumen YAML.                       |

`resolve` mengembalikan kecocokan terstruktur: `root`, `node`, `leaf`, atau `insertion-point`, dengan nomor baris berbasis 1. Nilai leaf disajikan sebagai teks ditambah `leafType`, sehingga pembuat plugin dapat merender pratinjau tanpa bergantung pada bentuk AST masing-masing jenis.

## Kontrak mutasi

`set` menulis satu target konkret:

- Nilai frontmatter markdown dan bidang butir `- key: value` merupakan leaf string. Penyisipan markdown menambahkan bagian, kunci frontmatter, atau butir bagian dan merender bentuk markdown kanonis untuk berkas yang diubah. Isi bagian tidak dapat ditulis secara keseluruhan melalui `set`.
- Penulisan leaf JSONC mengonversi nilai string ke jenis leaf yang ada (`string`, `number` terbatas, `true`/`false`, atau `null`). Gunakan `--value-json` saat penggantian leaf JSONC/JSON/JSONL harus mengurai `<value>` sebagai JSON dan dapat mengubah bentuk, seperti mengganti bentuk singkat referensi rahasia berupa string dengan objek. Penyisipan objek dan larik JSONC mengurai `<value>` sebagai JSON dan menggunakan jalur pengeditan `jsonc-parser` untuk penulisan leaf biasa, dengan mempertahankan komentar dan pemformatan di sekitarnya.
- Penulisan leaf JSONL mengonversi nilai seperti JSONC di dalam baris. Penggantian seluruh baris dan penambahan mengurai `<value>` sebagai JSON. JSONL yang dirender mempertahankan konvensi akhir baris LF/CRLF yang dominan pada berkas (berdasarkan mayoritas seluruh baris baru dalam berkas, sehingga berkas yang sebagian besar menggunakan CRLF tetap menggunakan CRLF meskipun terdapat beberapa LF yang menyimpang).
- Penulisan leaf YAML mengonversi nilai ke jenis skalar yang ada (`string`, `number` terbatas, `true`/`false`, atau `null`). Penyisipan YAML menggunakan API dokumen paket `yaml` bawaan untuk pembaruan peta/urutan. Dokumen YAML yang rusak dan memiliki kesalahan parser ditolak sebelum mutasi dengan `parse-error`.

Gunakan `--dry-run` sebelum penulisan yang terlihat oleh pengguna jika bita persisnya penting. Pengeditan JSONC dan YAML menambal dokumen yang ada (melalui `jsonc-parser` atau API dokumen `yaml`), sehingga bita yang tidak disentuh biasanya tetap dipertahankan; markdown membangun ulang berkas dari struktur hasil penguraiannya pada setiap pengeditan, yang dapat menormalkan pemformatan insidental di luar leaf yang diubah. Tambahkan `--diff` jika Anda menginginkan pratinjau sebagai tambalan sebelum/sesudah yang terfokus, bukan seluruh berkas hasil render.

## Contoh

```bash
# Validasi jalur (tanpa akses sistem berkas)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Baca leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Pencarian wildcard
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Simulasikan penulisan
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Simulasikan penulisan sebagai diff terpadu
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Terapkan penulisan
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Perjalanan pulang-pergi dengan ketepatan bita (diagnostik)
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

## Resep berdasarkan jenis berkas

Lima verba yang sama dapat digunakan untuk semua jenis; skema pengalamatan memilih penangan berdasarkan ekstensi berkas.

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

Predikat `[frontmatter]` mengalamatkan blok frontmatter YAML; `tools`
mencocokkan judul `## Tools` melalui slug, dan daun item mempertahankan bentuk
slug meskipun sumber menggunakan garis bawah (`send_email` menjadi `send-email`).

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

Pengeditan JSONC dilakukan melalui `jsonc-parser`, sehingga komentar dan spasi
tetap dipertahankan setelah operasi `set`. Jalankan terlebih dahulu dengan
`--dry-run` untuk memeriksa bita sebelum menerapkan perubahan. Berkas `.json`
menggunakan adaptor dan jalur pengeditan yang sama seperti `.jsonc`.

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

Setiap baris merupakan satu rekaman. Alamatkan berdasarkan predikat
(`[event=action]`) jika Anda tidak mengetahui nomor barisnya, atau berdasarkan
segmen kanonis `LN` jika Anda mengetahuinya. Berkas `.ndjson` menggunakan
adaptor yang sama seperti `.jsonl`.

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

YAML menggunakan API `Document` dari paket `yaml`, bukan pengurai buatan
sendiri, sehingga proses penguraian/pemancaran bolak-balik biasa mempertahankan
komentar dan bentuk penulisan, sementara path yang dihasilkan menggunakan model
kunci-peta / indeks-urutan yang sama seperti JSONC. Adaptor yang sama menangani
berkas `.yaml`, `.yml`, dan `.lobster`.

## Referensi subperintah

### `resolve <oc-path>`

Membaca satu daun atau simpul. Karakter pengganti ditolak—gunakan `find` untuk
itu. Keluar dengan kode `0` jika ditemukan kecocokan, `1` jika tidak ditemukan
kecocokan tanpa galat, dan `2` jika terjadi galat penguraian atau pola ditolak.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Mencantumkan setiap kecocokan untuk pola karakter pengganti / predikat /
gabungan. Keluar dengan kode `0` jika terdapat setidaknya satu kecocokan, dan
`1` jika tidak ada. Karakter pengganti pada slot berkas ditolak dengan
`OC_PATH_FILE_WILDCARD_UNSUPPORTED`—berikan berkas konkret (pencocokan pola
multi-berkas merupakan fitur lanjutan).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Menulis sebuah daun. Gunakan bersama `--dry-run` untuk melihat pratinjau bita
yang akan ditulis tanpa menyentuh berkas. Tambahkan `--diff` untuk pratinjau
diff terpadu. Keluar dengan kode `0` jika penulisan berhasil, `1` jika substrat
menolak (misalnya, pemicu pelindung sentinel), dan `2` jika terjadi galat
penguraian.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Penanda penyisipan `+key` membuat anak bernama tersebut jika belum ada; `+nnn`
dan `+` saja masing-masing digunakan untuk penyisipan berdasarkan indeks dan
penambahan di akhir.

### `validate <oc-path>`

Pemeriksaan penguraian saja. Tidak ada akses sistem berkas. Berguna ketika Anda
ingin memastikan path templat memiliki bentuk yang benar sebelum mengganti
variabel, atau ketika Anda memerlukan rincian struktural untuk penelusuran
galat:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Keluar dengan kode `0` jika valid, `1` jika tidak valid (dengan `code` dan
`message` terstruktur), dan `2` jika terjadi galat argumen.

### `emit <file>`

Memproses berkas secara bolak-balik melalui pengurai dan pemancar khusus
jenisnya. Keluarannya seharusnya identik secara bita dengan masukan pada berkas
yang valid; perbedaan menunjukkan bug pengurai atau pemicu sentinel. Berguna
untuk menelusuri perilaku substrat pada masukan dunia nyata.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Kode keluar

| Kode | Arti                                                                                  |
| ---- | ------------------------------------------------------------------------------------- |
| `0`  | Berhasil. (`resolve` / `find`: setidaknya satu kecocokan. `set`: penulisan berhasil.) |
| `1`  | Tidak ada kecocokan, atau `set` ditolak oleh substrat (tanpa galat tingkat sistem).   |
| `2`  | Galat argumen atau penguraian.                                                        |

## Mode keluaran

`openclaw path` mengenali TTY: keluaran yang mudah dibaca manusia pada terminal,
dan JSON ketika stdout disalurkan atau dialihkan. `--json` dan `--human`
mengesampingkan deteksi otomatis.

## Catatan

- `set` menulis bita melalui jalur pemancaran substrat, yang secara otomatis
  menerapkan pelindung sentinel penyuntingan. Daun yang memuat
  `__OPENCLAW_REDACTED__` (secara persis atau sebagai substring) ditolak saat
  penulisan.
- Penguraian JSONC dan pengeditan daun menggunakan dependensi `jsonc-parser`
  lokal Plugin, sehingga komentar dan pemformatan tetap dipertahankan pada
  penulisan daun biasa, alih-alih melewati jalur pengurai/perender ulang buatan
  sendiri.
- `path` tidak mengetahui pelacakan atau pemulihan konfigurasi terakhir yang
  diketahui baik (LKG); siklus hidup tersebut dimiliki di tempat lain. Jika
  berkas yang Anda edit melalui `path` juga dilacak oleh LKG, pembacaan
  konfigurasi berikutnya menentukan apakah berkas tersebut dipromosikan atau
  dipulihkan; perlakukan pengeditan `path` sama seperti penulisan langsung
  lainnya ke berkas tersebut.

## Terkait

- [Referensi CLI](/id/cli)
