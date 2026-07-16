---
read_when:
    - Anda ingin memahami cara kerja memori
    - Anda ingin mengetahui file memori apa yang perlu ditulis
summary: Cara OpenClaw mengingat berbagai hal di antara sesi
title: Ikhtisar memori
x-i18n:
    generated_at: "2026-07-16T17:59:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22542c5df22f1602c89bae05760a5418224d8ee1f1a73679203dec9b2f091f2a
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw mengingat berbagai hal dengan menulis file Markdown biasa di ruang kerja
agen Anda (default `~/.openclaw/workspace`). Model hanya mengingat hal yang
disimpan ke disk; tidak ada status tersembunyi.

## Cara kerjanya

Agen Anda memiliki tiga file terkait memori:

- **`MEMORY.md`** — memori jangka panjang. Fakta, preferensi, dan
  keputusan yang tahan lama. Dimuat pada awal sesi.
- **`memory/YYYY-MM-DD.md`** (atau `memory/YYYY-MM-DD-<slug>.md`) — catatan harian.
  Konteks dan pengamatan yang terus berjalan. Catatan bertanggal hari ini dan kemarin dimuat
  secara otomatis pada `/new` atau `/reset` tanpa slug; varian dengan slug, seperti yang
  ditulis oleh hook memori sesi bawaan, diambil bersama dengan
  file yang hanya berisi tanggal.
- **`DREAMS.md`** (opsional) — Buku Harian Mimpi dan ringkasan penyisiran Dreaming untuk
  peninjauan manusia, termasuk entri pengisian ulang historis yang berlandaskan data.

<Tip>
Jika Anda ingin agen mengingat sesuatu, cukup minta: "Ingat bahwa saya
lebih memilih TypeScript." Agen akan menulis catatan tersebut ke file yang sesuai.
</Tip>

## Penempatan setiap jenis informasi

`MEMORY.md` adalah lapisan ringkas yang dikurasi: fakta, preferensi, keputusan tetap,
dan ringkasan singkat yang tahan lama serta harus tersedia pada awal
sesi. Ini bukan transkrip mentah, log harian, atau arsip lengkap.

File `memory/YYYY-MM-DD.md` adalah lapisan kerja: catatan harian terperinci,
pengamatan, ringkasan sesi, dan konteks mentah yang mungkin masih berguna
nanti. File tersebut diindeks untuk `memory_search` dan `memory_get`, tetapi tidak
disisipkan ke dalam prompt bootstrap pada setiap giliran.

Seiring waktu, agen menyaring materi yang berguna dari catatan harian ke dalam
`MEMORY.md` dan menghapus entri jangka panjang yang sudah usang. Instruksi ruang kerja
yang dihasilkan dan alur Heartbeat melakukan ini secara berkala; Anda tidak perlu
mengedit `MEMORY.md` secara manual untuk setiap detail.

Jika `MEMORY.md` melampaui anggaran file bootstrap, OpenClaw mempertahankan file
di disk tetap utuh, tetapi memotong salinan yang disisipkan ke dalam konteks. Anggap hal itu sebagai
sinyal untuk memindahkan materi terperinci ke `memory/*.md`, hanya menyimpan ringkasan
yang tahan lama di `MEMORY.md`, atau menaikkan batas bootstrap jika Anda ingin menggunakan lebih banyak
anggaran prompt. Gunakan `/context list`, `/context detail`, atau `openclaw doctor` untuk
melihat ukuran mentah dibandingkan ukuran yang disisipkan serta status pemotongan.

## Mengimpor dari asisten pengodean

Control UI dapat mengimpor memori lokal yang sudah ada dari Codex dan Claude Code.
Buka **Settings** → **Import Memory**, pilih agen tujuan, tinjau
file yang terdeteksi, lalu konfirmasikan impor. OpenClaw hanya menyalin memori Markdown:

- Codex: file gabungan `MEMORY.md` dan `memory_summary.md` di bawah
  `~/.codex/memories` (atau `CODEX_HOME/memories`). File rollout mentah dan transkrip
  tidak diimpor.
- Claude Code: file Markdown dari setiap direktori memori otomatis proyek di bawah
  `~/.claude/projects/*/memory`, ditambah
  `autoMemoryDirectory` yang dikonfigurasi pengguna jika ada. Instruksi proyek, sesi, pengaturan,
  dan kredensial tidak termasuk dalam tindakan yang hanya menangani memori ini.

File yang diimpor tetap terpisah di bawah `memory/imports/codex/` dan
`memory/imports/claude-code/` dalam ruang kerja agen yang dipilih. File tersebut diindeks
untuk `memory_search` dan tersedia melalui `memory_get`; file tersebut tidak digabungkan ke dalam
`MEMORY.md` bootstrap agen. File sumber dibiarkan tidak berubah.

Pratinjau menandai konflik tujuan. Aktifkan **Replace existing imports** untuk
mengganti file tersebut; penerapan membuat cadangan sebelum impor yang telah diverifikasi dan mempertahankan
salinan per item dari file yang ditimpa dalam laporan migrasi.

## Memori yang sensitif terhadap tindakan

Sebagian besar memori merupakan catatan Markdown biasa. Sebagian memengaruhi hal yang harus
dilakukan agen nanti; untuk hal tersebut, catat kapan aman untuk bertindak berdasarkan catatan itu, bukan hanya
faktanya.

Catat batas tindakan tersebut jika sebuah catatan melibatkan:

- persyaratan persetujuan atau izin,
- batasan sementara,
- serah terima ke sesi, utas, atau orang lain,
- kondisi kedaluwarsa,
- waktu yang aman untuk bertindak,
- otoritas sumber atau pemilik,
- instruksi untuk menghindari tindakan yang menggiurkan.

Memori sensitif tindakan yang berguna menjelaskan dengan jelas:

- apa yang mengubah perilaku di masa mendatang,
- kapan atau dalam kondisi apa hal itu berlaku,
- kapan hal itu kedaluwarsa, atau apa yang membuka izin untuk bertindak,
- apa yang harus dihindari agen,
- siapa sumber atau pemiliknya, jika hal itu memengaruhi kepercayaan atau otoritas.

Memori dapat mempertahankan konteks persetujuan, tetapi tidak menegakkan kebijakan. Gunakan
pengaturan persetujuan OpenClaw, sandboxing, dan tugas terjadwal untuk kontrol
operasional yang ketat.

Contoh:

```md
Migrasi API sedang dirancang dalam sesi lain. Giliran mendatang tidak boleh
mengedit implementasi API dari utas ini; gunakan temuan di sini hanya sebagai
masukan desain hingga rencana migrasi diterapkan.
```

Contoh lain:

```md
Laporan dari sumber yang tidak tepercaya perlu ditinjau sebelum dipromosikan. Giliran mendatang
harus memperlakukannya hanya sebagai bukti; jangan menyimpannya sebagai memori yang tahan lama hingga
peninjau tepercaya mengonfirmasi isinya.
```

Ini bukan skema wajib untuk setiap memori; fakta sederhana dapat tetap ringkas.
Gunakan batas sensitif tindakan jika hilangnya konteks waktu, otoritas, kedaluwarsa, atau
keamanan untuk bertindak dapat menyebabkan agen melakukan hal yang salah di kemudian hari.

Gunakan [komitmen](/id/concepts/commitments) untuk tindak lanjut yang disimpulkan dan berumur pendek.
Gunakan [tugas terjadwal](/id/automation/cron-jobs) untuk pengingat yang tepat, pemeriksaan berjangka waktu,
dan pekerjaan berulang. Memori tetap dapat merangkum konteks tahan lama di sekitar
kedua jalur tersebut.

## Komitmen yang disimpulkan

Sebagian tindak lanjut di masa mendatang bukanlah fakta yang tahan lama. Jika Anda menyebutkan wawancara
besok, memori yang berguna mungkin berupa "tanyakan kabar setelah wawancara", bukan "simpan
ini selamanya di `MEMORY.md`."

[Komitmen](/id/concepts/commitments) adalah memori tindak lanjut
berumur pendek yang bersifat opsional untuk kasus tersebut. OpenClaw menyimpulkannya melalui proses latar belakang tersembunyi,
membatasi cakupannya ke agen dan saluran yang sama, serta mengirimkan tindak lanjut yang jatuh tempo melalui
Heartbeat. Pengingat eksplisit tetap menggunakan [tugas terjadwal](/id/automation/cron-jobs).

## Alat memori

Agen memiliki dua alat untuk bekerja dengan memori:

- **`memory_search`** — menemukan catatan yang relevan menggunakan pencarian semantik, bahkan ketika
  susunan katanya berbeda dari aslinya.
- **`memory_get`** — membaca file memori atau rentang baris tertentu.

Kedua alat disediakan oleh Plugin memori aktif (default: `memory-core`).

## Pencarian memori

Jika penyedia embedding dikonfigurasi, `memory_search` menggunakan pencarian hibrida:
kemiripan vektor (makna semantik) yang digabungkan dengan pencocokan kata kunci (istilah persis
seperti ID dan simbol kode). Fitur ini langsung berfungsi dengan kunci API
untuk penyedia apa pun yang didukung.

<Info>
OpenClaw menggunakan embedding OpenAI secara default. Atur
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
Sidecar yang mengutamakan penggunaan lokal dengan pemeringkatan ulang, perluasan kueri, dan kemampuan untuk mengindeks
direktori di luar ruang kerja.
</Card>
<Card title="Honcho" icon="brain" href="/id/concepts/memory-honcho">
Memori lintas sesi yang dirancang khusus untuk AI dengan pemodelan pengguna, pencarian semantik, dan
kesadaran multiagen. Instalasi Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/id/plugins/memory-lancedb">
Memori berbasis LanceDB dengan embedding yang kompatibel dengan OpenAI, pemanggilan ulang otomatis,
penangkapan otomatis, dan dukungan embedding Ollama lokal. Instalasi Plugin.
</Card>
</CardGroup>

## Lapisan wiki pengetahuan

Jika Anda ingin memori yang tahan lama berperilaku lebih seperti basis pengetahuan yang dipelihara
daripada catatan mentah, gunakan Plugin bawaan `memory-wiki`. Plugin ini mengompilasi pengetahuan
yang tahan lama menjadi vault wiki dengan struktur halaman deterministik, klaim dan bukti
terstruktur, pelacakan kontradiksi dan kebaruan, dasbor yang dihasilkan,
digest terkompilasi, dan alat khusus wiki (`wiki_status`,
`wiki_search`, `wiki_get`, `wiki_apply`, `wiki_lint`).

`memory-wiki` tidak menggantikan Plugin memori aktif; Plugin memori aktif
tetap menangani pemanggilan ulang, promosi, dan Dreaming. `memory-wiki` menambahkan
lapisan pengetahuan kaya asal-usul di sampingnya.

<CardGroup cols={1}>
<Card title="Wiki Memori" icon="book" href="/id/plugins/memory-wiki">
Mengompilasi memori yang tahan lama menjadi vault wiki kaya asal-usul dengan klaim,
dasbor, mode jembatan, dan alur kerja yang ramah Obsidian.
</Card>
</CardGroup>

## Pembuangan memori otomatis

Sebelum [Compaction](/id/concepts/compaction) merangkum percakapan Anda,
OpenClaw menjalankan giliran senyap yang mengingatkan agen untuk menyimpan konteks penting
ke file memori. Fitur ini aktif secara default; atur
`agents.defaults.compaction.memoryFlush.enabled: false` untuk menonaktifkannya.

Agar giliran pemeliharaan tersebut tetap menggunakan model lokal, tetapkan penggantian persis yang
hanya berlaku untuk giliran pembuangan memori (penggantian ini tidak mewarisi rantai fallback model
sesi aktif):

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
Pembuangan memori mencegah hilangnya konteks selama Compaction. Jika agen Anda memiliki
fakta penting dalam percakapan yang belum ditulis ke file, fakta tersebut
disimpan secara otomatis sebelum proses perangkuman berlangsung.
</Tip>

## Dreaming

Dreaming adalah proses konsolidasi latar belakang opsional untuk memori. Proses ini mengumpulkan
sinyal pemanggilan ulang jangka pendek, memberi skor pada kandidat, dan hanya mempromosikan item yang
memenuhi syarat ke memori jangka panjang (`MEMORY.md`):

- **Opsional**: dinonaktifkan secara default.
- **Terjadwal**: jika diaktifkan, `memory-core` mengelola otomatis satu tugas Cron
  berulang untuk penyisiran Dreaming penuh.
- **Berambang batas**: promosi harus melewati gerbang skor, frekuensi pemanggilan ulang, dan
  keragaman kueri.
- **Dapat ditinjau**: ringkasan fase dan entri buku harian ditulis ke
  `DREAMS.md` untuk peninjauan manusia.

Lihat [Dreaming](/id/concepts/dreaming) untuk perilaku fase, sinyal penilaian, dan
detail Buku Harian Mimpi.

## Pengisian ulang berlandaskan data dan promosi langsung

Sistem Dreaming memiliki dua jalur peninjauan yang berkaitan:

- **Dreaming langsung** bekerja dari penyimpanan Dreaming jangka pendek di bawah
  `memory/.dreams/` dan digunakan oleh fase mendalam normal untuk memutuskan apa yang
  naik ke `MEMORY.md`.
- **Pengisian ulang berlandaskan data** membaca catatan historis `memory/YYYY-MM-DD.md` sebagai
  file harian mandiri dan menulis keluaran peninjauan terstruktur ke dalam `DREAMS.md`.

Pengisian ulang berlandaskan data berguna untuk memutar ulang catatan lama dan memeriksa hal yang
dianggap tahan lama oleh sistem, tanpa mengedit `MEMORY.md` secara manual.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Flag `--stage-short-term` menempatkan kandidat tahan lama yang berlandaskan data ke dalam
penyimpanan Dreaming jangka pendek yang sama dengan yang sudah digunakan oleh fase mendalam normal; flag ini tidak
mempromosikannya secara langsung. Dengan demikian:

- `DREAMS.md` tetap menjadi permukaan peninjauan manusia.
- Penyimpanan jangka pendek tetap menjadi permukaan pemeringkatan untuk mesin.
- `MEMORY.md` tetap hanya ditulis oleh promosi mendalam.

Untuk membatalkan pemutaran ulang tanpa menyentuh entri buku harian biasa atau status pemanggilan ulang
normal:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Periksa status indeks dan penyedia
openclaw memory search "query"  # Cari dari baris perintah
openclaw memory index --force   # Bangun ulang indeks
```

## Bacaan lebih lanjut

- [Pencarian memori](/id/concepts/memory-search): pipeline pencarian, penyedia, dan penyetelan.
- [Mesin memori bawaan](/id/concepts/memory-builtin): backend SQLite default.
- [Mesin memori QMD](/id/concepts/memory-qmd): sidecar lokal-utama tingkat lanjut.
- [Memori Honcho](/id/concepts/memory-honcho): memori lintas sesi berbasis AI.
- [Memory LanceDB](/id/plugins/memory-lancedb): Plugin berbasis LanceDB dengan embedding yang kompatibel dengan OpenAI.
- [Memory Wiki](/id/plugins/memory-wiki): brankas pengetahuan terkompilasi dan alat asli wiki.
- [Dreaming](/id/concepts/dreaming): promosi latar belakang dari pengingatan jangka pendek ke memori jangka panjang.
- [Referensi konfigurasi memori](/id/reference/memory-config): semua opsi konfigurasi.
- [Compaction](/id/concepts/compaction): cara Compaction berinteraksi dengan memori.
- [Active Memory](/id/concepts/active-memory): memori subagen untuk sesi obrolan interaktif.
