---
read_when:
    - Anda ingin memahami cara kerja memori
    - Anda ingin mengetahui file memori apa yang perlu ditulis
summary: Cara OpenClaw mengingat berbagai hal di antara sesi
title: Ikhtisar memori
x-i18n:
    generated_at: "2026-07-12T14:05:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c77d71dd6b1916b923fbf72c373f20128c4f604f96cc76150ea27e0f13a541f8
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw mengingat berbagai hal dengan menulis file Markdown biasa di workspace agen Anda
(bawaan `~/.openclaw/workspace`). Model hanya mengingat hal yang disimpan
ke disk; tidak ada status tersembunyi.

## Cara kerjanya

Agen Anda memiliki tiga file terkait memori:

- **`MEMORY.md`** — memori jangka panjang. Fakta, preferensi, dan keputusan
  yang bertahan lama. Dimuat pada awal sesi.
- **`memory/YYYY-MM-DD.md`** (atau `memory/YYYY-MM-DD-<slug>.md`) — catatan harian.
  Konteks berjalan dan pengamatan. Catatan bertanggal hari ini dan kemarin dimuat
  secara otomatis pada `/new` atau `/reset` tanpa argumen; varian dengan slug,
  seperti yang ditulis oleh hook memori sesi bawaan, turut dimuat bersama file
  yang hanya menggunakan tanggal.
- **`DREAMS.md`** (opsional) — Buku Harian Mimpi dan ringkasan penyisiran dreaming
  untuk ditinjau manusia, termasuk entri pengisian balik historis yang berlandaskan bukti.

<Tip>
Jika Anda ingin agen mengingat sesuatu, cukup minta: "Ingat bahwa saya
lebih menyukai TypeScript." Agen akan menulis catatan tersebut ke file yang sesuai.
</Tip>

## Penempatan informasi

`MEMORY.md` adalah lapisan ringkas yang dikurasi: fakta yang bertahan lama, preferensi,
keputusan tetap, dan ringkasan singkat yang harus tersedia pada awal
sesi. File ini bukan transkrip mentah, log harian, atau arsip lengkap.

File `memory/YYYY-MM-DD.md` adalah lapisan kerja: catatan harian terperinci,
pengamatan, ringkasan sesi, dan konteks mentah yang mungkin masih berguna
nantinya. File-file ini diindeks untuk `memory_search` dan `memory_get`, tetapi tidak
disisipkan ke prompt bootstrap pada setiap giliran.

Seiring waktu, agen menyaring materi yang berguna dari catatan harian ke dalam
`MEMORY.md` dan menghapus entri jangka panjang yang sudah tidak relevan. Instruksi
workspace yang dihasilkan dan alur heartbeat melakukan hal ini secara berkala; Anda tidak perlu
mengedit `MEMORY.md` secara manual untuk setiap detail.

Jika `MEMORY.md` melampaui anggaran file bootstrap, OpenClaw mempertahankan file
di disk secara utuh, tetapi memotong salinan yang disisipkan ke dalam konteks. Anggap hal itu
sebagai sinyal untuk memindahkan materi terperinci ke `memory/*.md`, hanya menyimpan
ringkasan yang bertahan lama di `MEMORY.md`, atau menaikkan batas bootstrap jika Anda ingin
menggunakan lebih banyak anggaran prompt. Gunakan `/context list`, `/context detail`, atau
`openclaw doctor` untuk melihat ukuran mentah dibandingkan ukuran yang disisipkan serta status pemotongan.

## Memori yang sensitif terhadap tindakan

Sebagian besar memori adalah catatan Markdown biasa. Beberapa memengaruhi tindakan yang harus
dilakukan agen nantinya; untuk memori tersebut, catat kapan informasi dalam catatan itu aman
untuk ditindaklanjuti, bukan hanya faktanya.

Catat batas tindakan tersebut saat sebuah catatan melibatkan:

- persyaratan persetujuan atau izin,
- batasan sementara,
- penyerahan kepada sesi, utas, atau orang lain,
- kondisi kedaluwarsa,
- waktu yang aman untuk bertindak,
- kewenangan sumber atau pemilik,
- instruksi untuk menghindari tindakan yang tampak menggiurkan.

Memori sensitif tindakan yang berguna menjelaskan:

- hal yang mengubah perilaku mendatang,
- kapan atau dalam kondisi apa hal itu berlaku,
- kapan hal itu kedaluwarsa, atau apa yang mengizinkan tindakan,
- tindakan yang harus dihindari agen,
- siapa sumber atau pemiliknya, jika hal itu memengaruhi kepercayaan atau kewenangan.

Memori dapat mempertahankan konteks persetujuan, tetapi tidak memberlakukan kebijakan. Gunakan
pengaturan persetujuan OpenClaw, sandboxing, dan tugas terjadwal untuk kontrol
operasional yang ketat.

Contoh:

```md
The API migration is being designed in another session. Future turns should
not edit the API implementation from this thread; use findings here only as
design input until the migration plan lands.
```

Contoh lain:

```md
A report from an untrusted source needs review before promotion. Future turns
should treat it as evidence only; do not store it as durable memory until a
trusted reviewer confirms the contents.
```

Ini bukan skema wajib untuk setiap memori; fakta sederhana dapat tetap ringkas.
Gunakan batas sensitif tindakan ketika hilangnya konteks waktu, kewenangan, kedaluwarsa, atau
keamanan untuk bertindak dapat menyebabkan agen melakukan tindakan yang salah nantinya.

Gunakan [komitmen](/id/concepts/commitments) untuk tindak lanjut berumur pendek yang disimpulkan.
Gunakan [tugas terjadwal](/id/automation/cron-jobs) untuk pengingat tepat waktu, pemeriksaan terjadwal,
dan pekerjaan berulang. Memori tetap dapat merangkum konteks yang bertahan lama di sekitar
kedua jalur tersebut.

## Komitmen yang disimpulkan

Beberapa tindak lanjut mendatang bukanlah fakta yang bertahan lama. Jika Anda menyebutkan wawancara
besok, memori yang berguna mungkin berupa "tanyakan kabar setelah wawancara", bukan "simpan
ini selamanya di `MEMORY.md`."

[Komitmen](/id/concepts/commitments) adalah memori tindak lanjut opsional dan berumur pendek
untuk kasus tersebut. OpenClaw menyimpulkannya melalui proses latar belakang tersembunyi,
membatasi cakupannya pada agen dan saluran yang sama, serta mengirimkan tindak lanjut yang jatuh tempo melalui
heartbeat. Pengingat eksplisit tetap menggunakan [tugas terjadwal](/id/automation/cron-jobs).

## Alat memori

Agen memiliki dua alat untuk bekerja dengan memori:

- **`memory_search`** — menemukan catatan yang relevan menggunakan pencarian semantik, bahkan ketika
  susunan katanya berbeda dari aslinya.
- **`memory_get`** — membaca file memori atau rentang baris tertentu.

Kedua alat disediakan oleh Plugin memori aktif (bawaan: `memory-core`).

## Pencarian memori

Saat penyedia embedding dikonfigurasi, `memory_search` menggunakan pencarian hibrida:
kemiripan vektor (makna semantik) yang digabungkan dengan pencocokan kata kunci (istilah persis
seperti ID dan simbol kode). Fitur ini langsung berfungsi dengan kunci API
untuk penyedia mana pun yang didukung.

<Info>
OpenClaw menggunakan embedding OpenAI secara bawaan. Atur
`agents.defaults.memorySearch.provider` secara eksplisit untuk menggunakan Gemini, Voyage,
Mistral, Bedrock, DeepInfra, GGUF lokal, Ollama, LM Studio, GitHub Copilot, atau
endpoint generik yang kompatibel dengan OpenAI.
</Info>

Lihat [Pencarian memori](/id/concepts/memory-search) untuk mengetahui cara kerja pencarian, opsi
penyesuaian, dan penyiapan penyedia.

## Backend memori

<CardGroup cols={3}>
<Card title="Bawaan (default)" icon="database" href="/id/concepts/memory-builtin">
Berbasis SQLite. Langsung berfungsi dengan pencarian kata kunci, kemiripan vektor, dan
pencarian hibrida. Tidak memerlukan dependensi tambahan.
</Card>
<Card title="QMD" icon="search" href="/id/concepts/memory-qmd">
Sidecar yang mengutamakan lokal dengan pemeringkatan ulang, perluasan kueri, dan kemampuan untuk mengindeks
direktori di luar workspace.
</Card>
<Card title="Honcho" icon="brain" href="/id/concepts/memory-honcho">
Memori lintas sesi berbasis AI dengan pemodelan pengguna, pencarian semantik, dan
kesadaran multiagen. Memerlukan pemasangan Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/id/plugins/memory-lancedb">
Memori berbasis LanceDB dengan embedding yang kompatibel dengan OpenAI, pemanggilan kembali otomatis,
perekaman otomatis, dan dukungan embedding Ollama lokal. Memerlukan pemasangan Plugin.
</Card>
</CardGroup>

## Lapisan wiki pengetahuan

Jika Anda ingin memori yang bertahan lama berfungsi lebih seperti basis pengetahuan yang dipelihara
daripada catatan mentah, gunakan Plugin `memory-wiki` bawaan. Plugin ini mengompilasi pengetahuan
yang bertahan lama menjadi vault wiki dengan struktur halaman deterministik, klaim dan bukti
terstruktur, pelacakan kontradiksi dan kebaruan, dasbor yang dihasilkan,
ringkasan terkompilasi, serta alat bawaan wiki (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` tidak menggantikan Plugin memori aktif; Plugin memori aktif
tetap mengelola pemanggilan kembali, promosi, dan dreaming. `memory-wiki` menambahkan
lapisan pengetahuan yang kaya akan asal-usul di sampingnya.

<CardGroup cols={1}>
<Card title="Wiki Memori" icon="book" href="/id/plugins/memory-wiki">
Mengompilasi memori yang bertahan lama menjadi vault wiki yang kaya akan asal-usul, dengan klaim,
dasbor, mode jembatan, dan alur kerja yang ramah Obsidian.
</Card>
</CardGroup>

## Pengosongan memori otomatis

Sebelum [Compaction](/id/concepts/compaction) meringkas percakapan Anda,
OpenClaw menjalankan giliran senyap yang mengingatkan agen untuk menyimpan konteks penting
ke file memori. Fitur ini aktif secara bawaan; atur
`agents.defaults.compaction.memoryFlush.enabled: false` untuk menonaktifkannya.

Untuk mempertahankan giliran pemeliharaan tersebut pada model lokal, tetapkan penggantian persis yang
hanya berlaku untuk giliran pengosongan memori (pengaturan ini tidak mewarisi rantai fallback
model sesi aktif):

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

<Tip>
Pengosongan memori mencegah hilangnya konteks selama Compaction. Jika agen Anda memiliki
fakta penting dalam percakapan yang belum ditulis ke file, fakta tersebut
disimpan secara otomatis sebelum peringkasan berlangsung.
</Tip>

## Dreaming

Dreaming adalah proses konsolidasi latar belakang opsional untuk memori. Proses ini mengumpulkan
sinyal pemanggilan kembali jangka pendek, memberi skor pada kandidat, dan hanya mempromosikan item
yang memenuhi syarat ke memori jangka panjang (`MEMORY.md`):

- **Opsional**: dinonaktifkan secara bawaan.
- **Terjadwal**: saat diaktifkan, `memory-core` secara otomatis mengelola satu pekerjaan Cron
  berulang untuk penyisiran dreaming penuh.
- **Berambang batas**: promosi harus melewati gerbang skor, frekuensi pemanggilan kembali, dan
  keragaman kueri.
- **Dapat ditinjau**: ringkasan fase dan entri buku harian ditulis ke
  `DREAMS.md` untuk ditinjau manusia.

Lihat [Dreaming](/id/concepts/dreaming) untuk perilaku fase, sinyal penilaian, dan
detail Buku Harian Mimpi.

## Pengisian balik berlandaskan bukti dan promosi langsung

Sistem dreaming memiliki dua jalur peninjauan yang berkaitan:

- **Dreaming langsung** bekerja dari penyimpanan dreaming jangka pendek di
  `memory/.dreams/` dan digunakan oleh fase mendalam normal untuk menentukan hal yang
  dipromosikan ke `MEMORY.md`.
- **Pengisian balik berlandaskan bukti** membaca catatan historis `memory/YYYY-MM-DD.md` sebagai
  file harian mandiri dan menulis keluaran peninjauan terstruktur ke `DREAMS.md`.

Pengisian balik berlandaskan bukti berguna untuk memutar ulang catatan lama dan memeriksa hal yang
dianggap sistem layak bertahan lama, tanpa mengedit `MEMORY.md` secara manual.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Flag `--stage-short-term` menempatkan kandidat yang bertahan lama dan berlandaskan bukti ke penyimpanan
dreaming jangka pendek yang sama dengan yang telah digunakan oleh fase mendalam normal; flag ini tidak
mempromosikannya secara langsung. Dengan demikian:

- `DREAMS.md` tetap menjadi permukaan peninjauan manusia.
- Penyimpanan jangka pendek tetap menjadi permukaan pemeringkatan untuk mesin.
- `MEMORY.md` tetap hanya ditulis oleh promosi mendalam.

Untuk membatalkan pemutaran ulang tanpa menyentuh entri buku harian biasa atau status
pemanggilan kembali normal:

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

- [Pencarian memori](/id/concepts/memory-search): alur pencarian, penyedia, dan penyesuaian.
- [Mesin memori bawaan](/id/concepts/memory-builtin): backend SQLite bawaan.
- [Mesin memori QMD](/id/concepts/memory-qmd): sidecar lanjutan yang mengutamakan lokal.
- [Memori Honcho](/id/concepts/memory-honcho): memori lintas sesi berbasis AI.
- [Memori LanceDB](/id/plugins/memory-lancedb): Plugin berbasis LanceDB dengan embedding yang kompatibel dengan OpenAI.
- [Wiki Memori](/id/plugins/memory-wiki): vault pengetahuan terkompilasi dan alat bawaan wiki.
- [Dreaming](/id/concepts/dreaming): promosi latar belakang dari pemanggilan kembali jangka pendek ke memori jangka panjang.
- [Referensi konfigurasi memori](/id/reference/memory-config): semua opsi konfigurasi.
- [Compaction](/id/concepts/compaction): cara Compaction berinteraksi dengan memori.
- [Active Memory](/id/concepts/active-memory): memori subagen untuk sesi obrolan interaktif.
