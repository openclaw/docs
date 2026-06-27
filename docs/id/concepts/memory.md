---
read_when:
    - Anda ingin memahami cara kerja memori
    - Anda ingin mengetahui file memori apa yang harus ditulis
summary: Bagaimana OpenClaw mengingat berbagai hal di seluruh sesi
title: Ikhtisar memori
x-i18n:
    generated_at: "2026-06-27T17:24:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ddcecfa3d902181583ab076f94a69ca323686c3544399dea2572863726dad2c
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw mengingat berbagai hal dengan menulis **file Markdown biasa** di
workspace agen Anda. Model hanya "mengingat" apa yang disimpan ke disk — tidak
ada status tersembunyi.

## Cara kerjanya

Agen Anda memiliki tiga file terkait memori:

- **`MEMORY.md`** — memori jangka panjang. Fakta, preferensi, dan keputusan
  yang tahan lama. Dimuat pada awal setiap sesi DM.
- **`memory/YYYY-MM-DD.md`** (atau **`memory/YYYY-MM-DD-<slug>.md`**) — catatan harian.
  Konteks dan observasi yang sedang berjalan. Catatan hari ini dan kemarin
  dimuat secara otomatis, dan varian berslug seperti yang ditulis oleh hook
  memori sesi bawaan pada `/new` atau `/reset` kini ikut diambil bersama file
  yang hanya berisi tanggal.
- **`DREAMS.md`** (opsional) — Buku Harian Dream dan ringkasan sweep dreaming
  untuk peninjauan manusia, termasuk entri pengisian balik historis yang
  berdasar.

File-file ini berada di workspace agen (default `~/.openclaw/workspace`).

## Apa ditempatkan di mana

`MEMORY.md` adalah lapisan yang ringkas dan terkurasi. Gunakan untuk fakta
tahan lama, preferensi, keputusan tetap, dan ringkasan pendek yang seharusnya
tersedia pada awal sesi privat utama. File ini tidak dimaksudkan sebagai
transkrip mentah, log harian, atau arsip lengkap.

File `memory/YYYY-MM-DD.md` adalah lapisan kerja. Gunakan untuk catatan harian
terperinci, observasi, ringkasan sesi, dan konteks mentah yang mungkin masih
berguna nanti. File-file ini diindeks untuk `memory_search` dan `memory_get`,
tetapi tidak disuntikkan ke prompt bootstrap normal pada setiap giliran.

Seiring waktu, agen diharapkan menyaring materi berguna dari catatan harian ke
dalam `MEMORY.md` dan menghapus entri jangka panjang yang usang. Instruksi
workspace yang dihasilkan dan alur heartbeat dapat melakukannya secara berkala;
Anda tidak perlu mengedit `MEMORY.md` secara manual untuk setiap detail yang
diingat.

Jika `MEMORY.md` melampaui anggaran file bootstrap, OpenClaw mempertahankan file
di disk tetap utuh tetapi memangkas salinan yang disuntikkan ke konteks model.
Anggap itu sebagai sinyal untuk memindahkan materi terperinci kembali ke
`memory/*.md`, hanya menyimpan ringkasan tahan lama di `MEMORY.md`, atau
menaikkan batas bootstrap jika Anda secara eksplisit ingin memakai lebih banyak
anggaran prompt. Gunakan `/context list`, `/context detail`, atau
`openclaw doctor` untuk melihat ukuran mentah vs yang disuntikkan serta status
pemangkasan.

<Tip>
Jika Anda ingin agen Anda mengingat sesuatu, cukup minta: "Ingat bahwa saya
lebih suka TypeScript." Agen akan menuliskannya ke file yang sesuai.
</Tip>

## Memori sensitif tindakan

Sebagian besar memori dapat ditulis sebagai catatan Markdown biasa. Namun
beberapa memori memengaruhi apa yang harus dilakukan agen nanti. Untuk itu,
catat kapan aman untuk bertindak berdasarkan catatan tersebut, bukan hanya
faktanya saja.

Catat batas tindakan tersebut ketika sebuah catatan melibatkan:

- persyaratan persetujuan atau izin,
- batasan sementara,
- handoff ke sesi, thread, atau orang lain,
- kondisi kedaluwarsa,
- waktu aman untuk bertindak,
- otoritas sumber atau pemilik,
- instruksi untuk menghindari tindakan yang menggoda.

Memori sensitif tindakan yang berguna menjelaskan:

- apa yang mengubah perilaku di masa depan,
- kapan atau dalam kondisi apa hal itu berlaku,
- kapan hal itu kedaluwarsa, atau apa yang membuka tindakan,
- apa yang harus dihindari agen,
- siapa sumber atau pemiliknya, jika itu memengaruhi kepercayaan atau otoritas.

Memori dapat mempertahankan konteks persetujuan, tetapi tidak menegakkan
kebijakan. Gunakan pengaturan persetujuan OpenClaw, sandboxing, dan tugas
terjadwal untuk kontrol operasional yang keras.

Contoh:

```md
The API migration is being designed in another session. Future turns should not edit the API implementation from this thread; use findings here only as design input until the migration plan lands.
```

Contoh lain:

```md
A report from an untrusted source needs review before promotion. Future turns should treat it as evidence only; do not store it as durable memory until a trusted reviewer confirms the contents.
```

Gunakan [komitmen](/id/concepts/commitments) untuk tindak lanjut tersimpulkan yang
berumur pendek. Gunakan [tugas terjadwal](/id/automation/cron-jobs) untuk pengingat
persis, pemeriksaan berwaktu, dan pekerjaan berulang. Memori tetap dapat
meringkas konteks tahan lama di sekitar salah satu jalur tersebut.

Ini bukan skema wajib untuk setiap memori. Fakta sederhana dapat tetap ringkas.
Gunakan batas sensitif tindakan ketika kehilangan konteks waktu, otoritas,
kedaluwarsa, atau aman untuk bertindak dapat membuat agen melakukan hal yang
salah nanti.

## Komitmen tersimpulkan

Beberapa tindak lanjut di masa depan bukan fakta tahan lama. Jika Anda
menyebutkan wawancara besok, memori yang berguna mungkin adalah "cek kabar
setelah wawancara," bukan "simpan ini selamanya di `MEMORY.md`."

[Komitmen](/id/concepts/commitments) bersifat opt-in, memori tindak lanjut berumur
pendek untuk kasus tersebut. OpenClaw menyimpulkannya dalam lintasan latar
belakang tersembunyi, membatasinya ke agen dan kanal yang sama, dan mengirimkan
check-in yang jatuh tempo melalui Heartbeat. Pengingat eksplisit tetap
menggunakan [tugas terjadwal](/id/automation/cron-jobs).

## Alat memori

Agen memiliki dua alat untuk bekerja dengan memori:

- **`memory_search`** — menemukan catatan relevan menggunakan pencarian
  semantik, bahkan ketika susunan katanya berbeda dari aslinya.
- **`memory_get`** — membaca file memori tertentu atau rentang baris.

Kedua alat disediakan oleh Plugin Active Memory (default: `memory-core`).

## Plugin pendamping Memory Wiki

Jika Anda ingin memori tahan lama berperilaku lebih seperti basis pengetahuan
yang dipelihara daripada sekadar catatan mentah, gunakan Plugin `memory-wiki`
bawaan.

`memory-wiki` mengompilasi pengetahuan tahan lama ke vault wiki dengan:

- struktur halaman deterministik
- klaim dan bukti terstruktur
- pelacakan kontradiksi dan kesegaran
- dasbor yang dihasilkan
- digest terkompilasi untuk konsumen agen/runtime
- alat native wiki seperti `wiki_search`, `wiki_get`, `wiki_apply`, dan `wiki_lint`

Plugin ini tidak menggantikan Plugin Active Memory. Plugin Active Memory tetap
memiliki recall, promosi, dan dreaming. `memory-wiki` menambahkan lapisan
pengetahuan kaya provenance di sampingnya.

Lihat [Memory Wiki](/id/plugins/memory-wiki).

## Pencarian memori

Ketika penyedia embedding dikonfigurasi, `memory_search` menggunakan
**pencarian hibrida** — menggabungkan kemiripan vektor (makna semantik) dengan
pencocokan kata kunci (istilah persis seperti ID dan simbol kode). Ini langsung
berfungsi setelah Anda memiliki kunci API untuk penyedia yang didukung.

<Info>
OpenClaw menggunakan embedding OpenAI secara default. Tetapkan
`agents.defaults.memorySearch.provider` secara eksplisit untuk menggunakan
Gemini, Voyage, Mistral, local, Ollama, Bedrock, GitHub Copilot, atau embedding
yang kompatibel dengan OpenAI.
</Info>

Untuk detail tentang cara kerja pencarian, opsi penyesuaian, dan penyiapan
penyedia, lihat [Pencarian memori](/id/concepts/memory-search).

## Backend memori

<CardGroup cols={3}>
<Card title="Bawaan (default)" icon="database" href="/id/concepts/memory-builtin">
Berbasis SQLite. Langsung berfungsi dengan pencarian kata kunci, kemiripan
vektor, dan pencarian hibrida. Tanpa dependensi tambahan.
</Card>
<Card title="QMD" icon="search" href="/id/concepts/memory-qmd">
Sidecar local-first dengan reranking, ekspansi kueri, dan kemampuan untuk
mengindeks direktori di luar workspace.
</Card>
<Card title="Honcho" icon="brain" href="/id/concepts/memory-honcho">
Memori lintas sesi native AI dengan pemodelan pengguna, pencarian semantik, dan
kesadaran multi-agen. Instalasi Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/id/plugins/memory-lancedb">
Memori bawaan berbasis LanceDB dengan embedding kompatibel OpenAI, auto-recall,
auto-capture, dan dukungan embedding Ollama lokal.
</Card>
</CardGroup>

## Lapisan wiki pengetahuan

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/id/plugins/memory-wiki">
Mengompilasi memori tahan lama ke vault wiki kaya provenance dengan klaim,
dasbor, mode bridge, dan alur kerja yang ramah Obsidian.
</Card>
</CardGroup>

## Flush memori otomatis

Sebelum [Compaction](/id/concepts/compaction) meringkas percakapan Anda, OpenClaw
menjalankan giliran senyap yang mengingatkan agen untuk menyimpan konteks penting
ke file memori. Ini aktif secara default — Anda tidak perlu mengonfigurasi apa
pun.

Untuk mempertahankan giliran housekeeping itu pada model lokal, tetapkan
override model flush memori yang persis:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

Override hanya berlaku untuk giliran flush memori dan tidak mewarisi rantai
fallback sesi aktif.

<Tip>
Flush memori mencegah kehilangan konteks selama Compaction. Jika agen Anda
memiliki fakta penting dalam percakapan yang belum ditulis ke file, fakta
tersebut akan disimpan secara otomatis sebelum ringkasan terjadi.
</Tip>

## Dreaming

Dreaming adalah lintasan konsolidasi latar belakang opsional untuk memori. Ini
mengumpulkan sinyal jangka pendek, memberi skor kandidat, dan hanya
mempromosikan item yang memenuhi syarat ke memori jangka panjang (`MEMORY.md`).

Ini dirancang untuk menjaga memori jangka panjang tetap tinggi sinyal:

- **Opt-in**: dinonaktifkan secara default.
- **Terjadwal**: ketika diaktifkan, `memory-core` mengelola otomatis satu tugas Cron
  berulang untuk sweep Dreaming penuh.
- **Berambang**: promosi harus melewati gerbang skor, frekuensi recall, dan
  keberagaman kueri.
- **Dapat ditinjau**: ringkasan fase dan entri buku harian ditulis ke `DREAMS.md`
  untuk peninjauan manusia.

Untuk perilaku fase, sinyal penilaian, dan detail Buku Harian Dream, lihat
[Dreaming](/id/concepts/dreaming).

## Pengisian balik berdasar dan promosi langsung

Sistem Dreaming kini memiliki dua jalur peninjauan yang berkaitan erat:

- **Dreaming langsung** bekerja dari penyimpanan Dreaming jangka pendek di bawah
  `memory/.dreams/` dan itulah yang digunakan fase mendalam normal saat
  memutuskan apa yang dapat lulus ke `MEMORY.md`.
- **Pengisian balik berdasar** membaca catatan historis `memory/YYYY-MM-DD.md`
  sebagai file hari mandiri dan menulis keluaran peninjauan terstruktur ke
  `DREAMS.md`.

Pengisian balik berdasar berguna ketika Anda ingin memutar ulang catatan lama
dan memeriksa apa yang dianggap sistem sebagai tahan lama tanpa mengedit
`MEMORY.md` secara manual.

Ketika Anda menggunakan:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

kandidat tahan lama yang berdasar tidak dipromosikan secara langsung. Kandidat
tersebut dipentaskan ke penyimpanan Dreaming jangka pendek yang sama yang sudah
digunakan fase mendalam normal. Artinya:

- `DREAMS.md` tetap menjadi permukaan peninjauan manusia.
- penyimpanan jangka pendek tetap menjadi permukaan pemeringkatan yang
  berhadapan dengan mesin.
- `MEMORY.md` tetap hanya ditulis oleh promosi mendalam.

Jika Anda memutuskan pemutaran ulang itu tidak berguna, Anda dapat menghapus
artefak yang dipentaskan tanpa menyentuh entri buku harian biasa atau status
recall normal:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Check index status and provider
openclaw memory search "query"  # Search from the command line
openclaw memory index --force   # Rebuild the index
```

## Bacaan lebih lanjut

- [Mesin memori bawaan](/id/concepts/memory-builtin): backend SQLite default.
- [Mesin memori QMD](/id/concepts/memory-qmd): sidecar local-first lanjutan.
- [Memori Honcho](/id/concepts/memory-honcho): memori lintas sesi native AI.
- [Memory LanceDB](/id/plugins/memory-lancedb): Plugin berbasis LanceDB dengan embedding kompatibel OpenAI.
- [Memory Wiki](/id/plugins/memory-wiki): vault pengetahuan terkompilasi dan alat native wiki.
- [Pencarian memori](/id/concepts/memory-search): pipeline pencarian, penyedia, dan penyesuaian.
- [Dreaming](/id/concepts/dreaming): promosi latar belakang dari recall jangka pendek ke memori jangka panjang.
- [Referensi konfigurasi memori](/id/reference/memory-config): semua kenop konfigurasi.
- [Compaction](/id/concepts/compaction): bagaimana Compaction berinteraksi dengan memori.

## Terkait

- [Active Memory](/id/concepts/active-memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Mesin memori bawaan](/id/concepts/memory-builtin)
- [Memori Honcho](/id/concepts/memory-honcho)
- [Memory LanceDB](/id/plugins/memory-lancedb)
- [Komitmen](/id/concepts/commitments)
