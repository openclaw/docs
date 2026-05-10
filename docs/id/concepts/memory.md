---
read_when:
    - Anda ingin memahami cara kerja memori
    - Anda ingin mengetahui file memori apa yang harus ditulis
summary: Cara OpenClaw mengingat hal-hal lintas sesi
title: Ikhtisar memori
x-i18n:
    generated_at: "2026-05-10T19:31:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef7a67b06615897167d7aac8a9f52fe7df9eee86f5d8d1504291ec750e674833
    source_path: concepts/memory.md
    workflow: 16
---

OpenClaw mengingat berbagai hal dengan menulis **file Markdown biasa** di
workspace agen Anda. Model hanya "mengingat" apa yang disimpan ke disk — tidak ada
status tersembunyi.

## Cara kerjanya

Agen Anda memiliki tiga file terkait memori:

- **`MEMORY.md`** — memori jangka panjang. Fakta, preferensi, dan
  keputusan yang tahan lama. Dimuat pada awal setiap sesi DM.
- **`memory/YYYY-MM-DD.md`** — catatan harian. Konteks dan pengamatan yang sedang berjalan.
  Catatan hari ini dan kemarin dimuat otomatis.
- **`DREAMS.md`** (opsional) — Buku Harian Dream dan ringkasan sweep dreaming
  untuk tinjauan manusia, termasuk entri backfill historis yang berlandasan.

File-file ini berada di workspace agen (default `~/.openclaw/workspace`).

## Apa ditempatkan di mana

`MEMORY.md` adalah lapisan yang ringkas dan terkurasi. Gunakan untuk fakta yang tahan lama,
preferensi, keputusan tetap, dan ringkasan pendek yang harus tersedia pada
awal sesi privat utama. Ini tidak dimaksudkan sebagai transkrip mentah,
log harian, atau arsip lengkap.

File `memory/YYYY-MM-DD.md` adalah lapisan kerja. Gunakan untuk catatan harian
terperinci, pengamatan, ringkasan sesi, dan konteks mentah yang mungkin masih berguna
nanti. File-file ini diindeks untuk `memory_search` dan `memory_get`, tetapi tidak
disuntikkan ke prompt bootstrap normal pada setiap giliran.

Seiring waktu, agen diharapkan menyarikan materi berguna dari catatan harian
ke dalam `MEMORY.md` dan menghapus entri jangka panjang yang usang. Instruksi workspace
yang dihasilkan dan alur heartbeat dapat melakukannya secara berkala; Anda tidak perlu
mengedit `MEMORY.md` secara manual untuk setiap detail yang diingat.

Jika `MEMORY.md` tumbuh melewati anggaran file bootstrap, OpenClaw mempertahankan file
di disk secara utuh tetapi memotong salinan yang disuntikkan ke konteks model. Perlakukan itu sebagai
sinyal untuk memindahkan materi terperinci kembali ke `memory/*.md`, hanya menyimpan
ringkasan tahan lama di `MEMORY.md`, atau menaikkan batas bootstrap jika Anda secara eksplisit
ingin menggunakan lebih banyak anggaran prompt. Gunakan `/context list`, `/context detail`, atau
`openclaw doctor` untuk melihat ukuran mentah vs yang disuntikkan dan status pemotongan.

<Tip>
Jika Anda ingin agen Anda mengingat sesuatu, minta saja: "Ingat bahwa saya
lebih suka TypeScript." Agen akan menuliskannya ke file yang sesuai.
</Tip>

## Komitmen yang disimpulkan

Beberapa tindak lanjut di masa depan bukanlah fakta yang tahan lama. Jika Anda menyebut wawancara
besok, memori yang berguna mungkin adalah "cek lagi setelah wawancara," bukan "simpan
ini selamanya di `MEMORY.md`."

[Komitmen](/id/concepts/commitments) adalah memori tindak lanjut opt-in dan berumur pendek
untuk kasus tersebut. OpenClaw menyimpulkannya dalam lintasan latar belakang tersembunyi, membatasinya ke
agen dan channel yang sama, dan mengirimkan check-in yang jatuh tempo melalui heartbeat.
Pengingat eksplisit tetap menggunakan [tugas terjadwal](/id/automation/cron-jobs).

## Alat memori

Agen memiliki dua alat untuk bekerja dengan memori:

- **`memory_search`** — menemukan catatan yang relevan menggunakan pencarian semantik, bahkan saat
  susunan katanya berbeda dari aslinya.
- **`memory_get`** — membaca file memori atau rentang baris tertentu.

Kedua alat disediakan oleh Plugin memori aktif (default: `memory-core`).

## Plugin pendamping Memory Wiki

Jika Anda ingin memori tahan lama berperilaku lebih seperti basis pengetahuan yang dipelihara daripada
sekadar catatan mentah, gunakan Plugin `memory-wiki` bawaan.

`memory-wiki` mengompilasi pengetahuan tahan lama ke dalam vault wiki dengan:

- struktur halaman deterministik
- klaim dan bukti terstruktur
- pelacakan kontradiksi dan kesegaran
- dashboard yang dihasilkan
- digest terkompilasi untuk konsumen agen/runtime
- alat native wiki seperti `wiki_search`, `wiki_get`, `wiki_apply`, dan `wiki_lint`

Ini tidak menggantikan Plugin memori aktif. Plugin memori aktif tetap
memiliki recall, promosi, dan dreaming. `memory-wiki` menambahkan
lapisan pengetahuan kaya provenance di sampingnya.

Lihat [Memory Wiki](/id/plugins/memory-wiki).

## Pencarian memori

Saat penyedia embedding dikonfigurasi, `memory_search` menggunakan **pencarian hibrida**
— menggabungkan kemiripan vektor (makna semantik) dengan pencocokan kata kunci
(istilah tepat seperti ID dan simbol kode). Ini langsung berfungsi setelah Anda memiliki
kunci API untuk penyedia yang didukung.

<Info>
OpenClaw mendeteksi otomatis penyedia embedding Anda dari kunci API yang tersedia. Jika Anda
memiliki kunci OpenAI, Gemini, Voyage, atau Mistral yang dikonfigurasi, pencarian memori
diaktifkan otomatis.
</Info>

Untuk detail tentang cara kerja pencarian, opsi penyetelan, dan penyiapan penyedia, lihat
[Pencarian memori](/id/concepts/memory-search).

## Backend memori

<CardGroup cols={3}>
<Card title="Bawaan (default)" icon="database" href="/id/concepts/memory-builtin">
Berbasis SQLite. Langsung berfungsi dengan pencarian kata kunci, kemiripan vektor, dan
pencarian hibrida. Tidak ada dependensi tambahan.
</Card>
<Card title="QMD" icon="search" href="/id/concepts/memory-qmd">
Sidecar local-first dengan reranking, ekspansi kueri, dan kemampuan untuk mengindeks
direktori di luar workspace.
</Card>
<Card title="Honcho" icon="brain" href="/id/concepts/memory-honcho">
Memori lintas sesi AI-native dengan pemodelan pengguna, pencarian semantik, dan
kesadaran multi-agen. Instalasi Plugin.
</Card>
<Card title="LanceDB" icon="layers" href="/id/plugins/memory-lancedb">
Memori bawaan yang didukung LanceDB dengan embedding kompatibel OpenAI, auto-recall,
auto-capture, dan dukungan embedding Ollama lokal.
</Card>
</CardGroup>

## Lapisan wiki pengetahuan

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/id/plugins/memory-wiki">
Mengompilasi memori tahan lama ke dalam vault wiki kaya provenance dengan klaim,
dashboard, mode bridge, dan workflow yang ramah Obsidian.
</Card>
</CardGroup>

## Flush memori otomatis

Sebelum [Compaction](/id/concepts/compaction) meringkas percakapan Anda, OpenClaw
menjalankan giliran senyap yang mengingatkan agen untuk menyimpan konteks penting ke file
memori. Ini aktif secara default — Anda tidak perlu mengonfigurasi apa pun.

Untuk menjaga giliran housekeeping tersebut pada model lokal, tetapkan override model memory-flush
yang tepat:

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

Override hanya berlaku untuk giliran memory-flush dan tidak mewarisi
rantai fallback sesi aktif.

<Tip>
Flush memori mencegah kehilangan konteks selama Compaction. Jika agen Anda memiliki
fakta penting dalam percakapan yang belum ditulis ke file, fakta tersebut
akan disimpan otomatis sebelum ringkasan terjadi.
</Tip>

## Dreaming

Dreaming adalah lintasan konsolidasi latar belakang opsional untuk memori. Ini mengumpulkan
sinyal jangka pendek, memberi skor kandidat, dan hanya mempromosikan item yang memenuhi syarat ke
memori jangka panjang (`MEMORY.md`).

Ini dirancang untuk menjaga memori jangka panjang tetap bernilai tinggi:

- **Opt-in**: dinonaktifkan secara default.
- **Terjadwal**: saat diaktifkan, `memory-core` mengelola otomatis satu tugas cron berulang
  untuk sweep dreaming penuh.
- **Berambang**: promosi harus melewati gerbang skor, frekuensi recall, dan
  keragaman kueri.
- **Dapat ditinjau**: ringkasan fase dan entri buku harian ditulis ke `DREAMS.md`
  untuk tinjauan manusia.

Untuk perilaku fase, sinyal penskoran, dan detail Buku Harian Dream, lihat
[Dreaming](/id/concepts/dreaming).

## Backfill berlandasan dan promosi live

Sistem dreaming sekarang memiliki dua lane tinjauan yang terkait erat:

- **Dreaming live** bekerja dari penyimpanan dreaming jangka pendek di bawah
  `memory/.dreams/` dan itulah yang digunakan fase deep normal saat memutuskan apa
  yang dapat lulus ke `MEMORY.md`.
- **Backfill berlandasan** membaca catatan historis `memory/YYYY-MM-DD.md` sebagai
  file hari mandiri dan menulis keluaran tinjauan terstruktur ke `DREAMS.md`.

Backfill berlandasan berguna saat Anda ingin memutar ulang catatan lama dan memeriksa apa
yang menurut sistem tahan lama tanpa mengedit `MEMORY.md` secara manual.

Saat Anda menggunakan:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

kandidat tahan lama yang berlandasan tidak dipromosikan secara langsung. Kandidat tersebut di-stage ke dalam
penyimpanan dreaming jangka pendek yang sama yang sudah digunakan fase deep normal. Itu
berarti:

- `DREAMS.md` tetap menjadi permukaan tinjauan manusia.
- penyimpanan jangka pendek tetap menjadi permukaan pemeringkatan yang menghadap mesin.
- `MEMORY.md` tetap hanya ditulis oleh promosi deep.

Jika Anda memutuskan pemutaran ulang tidak berguna, Anda dapat menghapus artefak yang di-stage
tanpa menyentuh entri buku harian biasa atau status recall normal:

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

- [Mesin memori bawaan](/id/concepts/memory-builtin): backend SQLite default.
- [Mesin memori QMD](/id/concepts/memory-qmd): sidecar local-first tingkat lanjut.
- [Memori Honcho](/id/concepts/memory-honcho): memori lintas sesi AI-native.
- [Memory LanceDB](/id/plugins/memory-lancedb): Plugin yang didukung LanceDB dengan embedding kompatibel OpenAI.
- [Memory Wiki](/id/plugins/memory-wiki): vault pengetahuan terkompilasi dan alat native wiki.
- [Pencarian memori](/id/concepts/memory-search): pipeline pencarian, penyedia, dan penyetelan.
- [Dreaming](/id/concepts/dreaming): promosi latar belakang dari recall jangka pendek ke memori jangka panjang.
- [Referensi konfigurasi memori](/id/reference/memory-config): semua kenop konfigurasi.
- [Compaction](/id/concepts/compaction): bagaimana Compaction berinteraksi dengan memori.

## Terkait

- [Active memory](/id/concepts/active-memory)
- [Pencarian memori](/id/concepts/memory-search)
- [Mesin memori bawaan](/id/concepts/memory-builtin)
- [Memori Honcho](/id/concepts/memory-honcho)
- [Memory LanceDB](/id/plugins/memory-lancedb)
- [Komitmen](/id/concepts/commitments)
