---
read_when:
    - Anda ingin memeriksa atau mengedit satu elemen terminal di dalam berkas ruang kerja dari terminal
    - Anda membuat skrip yang berinteraksi dengan status ruang kerja dan memerlukan skema pengalamatan stabil yang tidak bergantung pada jenisnya
    - Anda sedang memutuskan apakah akan mengaktifkan plugin `oc-path` opsional pada Gateway yang dihosting sendiri
summary: 'Plugin bawaan `oc-path`: menyertakan CLI `openclaw path` untuk skema pengalamatan berkas ruang kerja `oc://`'
title: Plugin OC Path
x-i18n:
    generated_at: "2026-07-12T14:26:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

Plugin bawaan `oc-path` menambahkan CLI [`openclaw path`](/id/cli/path) untuk
skema pengalamatan berkas ruang kerja `oc://`. Plugin ini disertakan dalam repo OpenClaw di
`extensions/oc-path/`, tetapi bersifat opsional: instalasi/build membiarkannya tidak aktif hingga Anda
mengaktifkannya.

Alamat `oc://` menunjuk ke satu simpul daun (atau sekumpulan simpul daun dengan wildcard) di dalam
berkas ruang kerja. Plugin ini memahami empat jenis berkas:

- **markdown** (`.md`): frontmatter, bagian, item, bidang
- **jsonc** (`.jsonc`, `.json`): komentar dan pemformatan dipertahankan
- **jsonl** (`.jsonl`, `.ndjson`): rekaman berorientasi baris
- **yaml** (`.yaml`, `.yml`, `.lobster`): simpul peta/urutan/skalar melalui API
  `Document` dari paket `yaml`

Pengelola hosting mandiri dan ekstensi editor menggunakan CLI untuk membaca atau menulis satu simpul daun
tanpa membuat skrip yang berinteraksi langsung dengan SDK; agen dan hook memperlakukannya sebagai
landasan deterministik sehingga perjalanan pulang-pergi dengan ketepatan byte dan perlindungan
sentinel redaksi diterapkan secara seragam pada semua jenis. Lihat
[referensi CLI](/id/cli/path) untuk tata bahasa lengkap, daftar flag per verba, dan
contoh lengkap untuk setiap jenis berkas; halaman ini membahas alasan dan cara mengaktifkan
plugin.

## Mengapa perlu mengaktifkannya

Aktifkan `oc-path` saat skrip, hook, atau alat agen lokal perlu menunjuk ke
bagian tertentu dari status ruang kerja tanpa parser khusus untuk setiap bentuk berkas. Satu
alamat `oc://` dapat menamai kunci frontmatter markdown, item bagian,
simpul daun konfigurasi JSONC, bidang peristiwa JSONL, atau langkah alur kerja YAML.

Hal ini penting untuk alur kerja pengelola ketika perubahan harus tetap kecil,
dapat diaudit, dan dapat diulang: periksa satu nilai, temukan rekaman yang cocok, lakukan uji coba
penulisan, lalu terapkan hanya pada simpul daun tersebut sambil membiarkan komentar, akhir baris, dan
pemformatan di sekitarnya tetap utuh.

Alasan umum untuk mengaktifkannya:

- **Otomatisasi lokal**: skrip shell menyelesaikan atau memperbarui satu nilai ruang kerja
  dengan `openclaw path … --json`, alih-alih membawa kode penguraian markdown, JSONC,
  JSONL, dan YAML yang terpisah.
- **Pengeditan yang terlihat oleh agen**: agen menampilkan diff uji coba untuk satu
  simpul daun yang dialamatkan sebelum menulis, yang lebih mudah ditinjau daripada penulisan ulang
  berkas secara bebas.
- **Integrasi editor**: editor memetakan `oc://AGENTS.md/tools/gh` ke
  simpul markdown dan nomor baris yang tepat tanpa menebak dari teks judul.
- **Diagnostik**: `emit` melakukan perjalanan pulang-pergi berkas melalui parser dan emitter,
  sehingga Anda dapat memeriksa apakah suatu jenis berkas stabil pada tingkat byte sebelum mengandalkan
  pengeditan otomatis.

```bash
# Apakah plugin GitHub diaktifkan dalam konfigurasi ini?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Nama pemanggilan alat apa saja yang muncul dalam log sesi ini?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Byte apa yang akan ditulis oleh pengeditan konfigurasi kecil ini?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` sengaja tidak menjadi pemilik semantik tingkat tinggi. Plugin
memori tetap memiliki penulisan memori, perintah konfigurasi tetap memiliki pengelolaan konfigurasi
penuh, dan pemulihan konfigurasi terakhir yang diketahui baik (LKG) tetap memiliki
pemulihan/promosi. `oc-path` adalah lapisan operasi berkas sempit untuk pengalamatan dan pemeliharaan
byte yang dapat menjadi dasar bagi alat tingkat tinggi tersebut.

## Tempat menjalankannya

Plugin berjalan **dalam proses di dalam CLI `openclaw`** pada host tempat Anda
menjalankan perintah. Plugin ini tidak memerlukan Gateway yang sedang berjalan dan tidak membuka
soket jaringan apa pun; setiap verba merupakan transformasi murni terhadap berkas yang Anda tunjuk.

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

`onStartup: false` mencegah plugin masuk ke jalur mulai Gateway.
`commandAliases` dan `activation.onCommands` memberi tahu CLI untuk memuat plugin
secara malas saat pertama kali Anda menjalankan `openclaw path …`, sehingga instalasi yang tidak pernah menggunakan
verba tersebut tidak menanggung biaya apa pun.

## Mengaktifkan

```bash
openclaw plugins enable oc-path
```

Mulai ulang Gateway (jika Anda menjalankannya) agar snapshot manifes mengambil status
baru. Pemanggilan langsung `openclaw path` langsung berfungsi pada host yang sama;
CLI memuat plugin sesuai kebutuhan.

Nonaktifkan dengan:

```bash
openclaw plugins disable oc-path
```

## Dependensi

Semua dependensi parser bersifat lokal pada plugin; mengaktifkan `oc-path` tidak memasukkan
paket baru ke runtime inti:

| Dependensi     | Tujuan                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Pengkabelan subperintah untuk `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | Penguraian JSONC dan pengeditan simpul daun dengan mempertahankan komentar dan koma di akhir. |
| `markdown-it`  | Tokenisasi Markdown untuk model bagian / item / bidang.                |
| `yaml`         | Penguraian / emisi / pengeditan `Document` YAML dengan mempertahankan komentar dan gaya alur. |

JSONL tetap dibuat secara manual: penguraian berorientasi baris lebih sederhana daripada
dependensi apa pun, dan penguraian per baris sudah melalui `jsonc-parser`.

## Yang disediakan

| Permukaan                      | Disediakan oleh                                          |
| ------------------------------ | -------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                 |
| Parser / pemformat `oc://`     | `extensions/oc-path/src/oc-path/oc-path.ts`              |
| Penguraian / emisi / pengeditan per jenis | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Penyelesaian / pencarian / penetapan universal | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Perlindungan sentinel redaksi  | `extensions/oc-path/src/oc-path/sentinel.ts`             |

CLI adalah satu-satunya permukaan publik saat ini. Verba landasan bersifat privat bagi
plugin; konsumen menggunakan CLI (atau membuat plugin mereka sendiri terhadap
SDK).

## Hubungan dengan plugin lain

- **`memory-*`**: penulisan memori dilakukan melalui plugin memori, bukan
  `oc-path`. `oc-path` adalah landasan berkas generik; plugin memori melapiskan
  semantiknya sendiri di atasnya.
- **LKG**: `path` tidak mengetahui pemulihan konfigurasi terakhir yang diketahui baik. Jika
  berkas yang Anda edit melalui `path` juga dilacak LKG, siklus pengamatan konfigurasi
  berikutnya menentukan apakah akan mempromosikan atau memulihkannya; perlakukan pengeditan `path`
  sama seperti penulisan langsung lainnya ke berkas tersebut.

## Keamanan

`set` menulis byte mentah melalui jalur emisi landasan, yang menerapkan
perlindungan sentinel redaksi secara otomatis. Simpul daun yang membawa
`__OPENCLAW_REDACTED__` (secara verbatim atau sebagai substring) ditolak saat penulisan
dengan `OC_EMIT_SENTINEL`. CLI juga menghapus sentinel literal dari setiap
keluaran manusia atau JSON yang dicetaknya, menggantinya dengan `[REDACTED]` agar tangkapan
terminal dan pipeline tidak pernah membocorkan penanda tersebut.

## Terkait

- [Referensi CLI `openclaw path`](/id/cli/path)
- [Mengelola plugin](/id/plugins/manage-plugins)
- [Membangun plugin](/id/plugins/building-plugins)
