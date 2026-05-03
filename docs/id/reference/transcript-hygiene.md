---
read_when:
    - Anda sedang mendiagnosis penolakan permintaan penyedia yang terkait dengan struktur transkrip
    - Anda sedang mengubah sanitasi transkrip atau logika perbaikan panggilan alat
    - Anda sedang menyelidiki ketidakcocokan ID panggilan alat di berbagai penyedia
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus penyedia'
title: Kebersihan transkrip
x-i18n:
    generated_at: "2026-05-03T09:22:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw menerapkan **perbaikan khusus penyedia** pada transkrip sebelum eksekusi (membangun konteks model). Sebagian besar perbaikan ini adalah penyesuaian **dalam memori** yang digunakan untuk memenuhi persyaratan penyedia yang ketat. Pass perbaikan file sesi terpisah juga dapat menulis ulang JSONL yang tersimpan sebelum sesi dimuat, tetapi hanya untuk baris yang rusak atau giliran tersimpan yang bukan rekaman tahan lama yang valid. Balasan asisten yang telah dikirim dipertahankan di disk; penghapusan praisi asisten khusus penyedia hanya terjadi saat menyusun payload keluar. Saat perbaikan terjadi, file asli dicadangkan di samping file sesi.

Cakupan meliputi:

- Konteks prompt khusus waktu berjalan tetap berada di luar giliran transkrip yang terlihat oleh pengguna
- Sanitasi id panggilan alat
- Validasi input panggilan alat
- Perbaikan pemasangan hasil alat
- Validasi / pengurutan giliran
- Pembersihan tanda tangan pemikiran
- Pembersihan tanda tangan thinking
- Sanitasi payload gambar
- Pembersihan blok teks kosong sebelum pemutaran ulang penyedia
- Penandaan asal input pengguna (untuk prompt yang dirutekan antar-sesi)
- Perbaikan giliran kesalahan asisten kosong untuk pemutaran ulang Bedrock Converse

Jika Anda memerlukan detail penyimpanan transkrip, lihat:

- [Pendalaman manajemen sesi](/id/reference/session-management-compaction)

---

## Aturan global: konteks waktu berjalan bukan transkrip pengguna

Konteks waktu berjalan/sistem dapat ditambahkan ke prompt model untuk suatu giliran, tetapi itu bukan konten yang ditulis oleh pengguna akhir. OpenClaw mempertahankan badan prompt terpisah yang menghadap transkrip untuk balasan Gateway, tindak lanjut dalam antrean, ACP, CLI, dan eksekusi Pi tertanam. Giliran pengguna terlihat yang tersimpan menggunakan badan transkrip tersebut, bukan prompt yang diperkaya waktu berjalan.

Untuk sesi lama yang sudah menyimpan pembungkus waktu berjalan, permukaan riwayat Gateway menerapkan proyeksi tampilan sebelum mengembalikan pesan ke klien WebChat, TUI, REST, atau SSE.

---

## Tempat ini berjalan

Semua kebersihan transkrip dipusatkan di runner tertanam:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
- Penerapan sanitasi/perbaikan: `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

Kebijakan menggunakan `provider`, `modelApi`, dan `modelId` untuk memutuskan apa yang akan diterapkan.

Terpisah dari kebersihan transkrip, file sesi diperbaiki (jika diperlukan) sebelum dimuat:

- `repairSessionFileIfNeeded` di `src/agents/session-file-repair.ts`
- Dipanggil dari `run/attempt.ts` dan `compact.ts` (runner tertanam)

---

## Aturan global: sanitasi gambar

Payload gambar selalu disanitasi untuk mencegah penolakan di sisi penyedia akibat batas ukuran (mengecilkan/mengompresi ulang gambar base64 yang terlalu besar).

Ini juga membantu mengendalikan tekanan token berbasis gambar untuk model yang mendukung visi. Dimensi maksimum yang lebih rendah umumnya mengurangi penggunaan token; dimensi yang lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi gambar maksimum dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx` (bawaan: `1200`).
- Blok teks kosong dihapus saat pass ini menelusuri konten pemutaran ulang. Giliran asisten yang menjadi kosong dihapus dari salinan pemutaran ulang; giliran pengguna dan hasil alat yang menjadi kosong menerima placeholder konten-dihilangkan yang tidak kosong.

---

## Aturan global: panggilan alat rusak

Blok panggilan alat asisten yang tidak memiliki `input` maupun `arguments` dihapus sebelum konteks model dibangun. Ini mencegah penolakan penyedia dari panggilan alat yang tersimpan sebagian (misalnya, setelah kegagalan batas laju).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan di `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

---

## Aturan global: asal input antar-sesi

Saat agen mengirim prompt ke sesi lain melalui `sessions_send` (termasuk langkah balasan/pengumuman antar-agen), OpenClaw menyimpan giliran pengguna yang dibuat dengan:

- `message.provenance.kind = "inter_session"`

OpenClaw juga menambahkan marker `[Inter-session message ... isUser=false]` pada giliran yang sama sebelum teks prompt yang dirutekan agar panggilan model aktif dapat membedakan output sesi asing dari instruksi pengguna akhir eksternal. Marker ini mencakup sesi sumber, channel, dan alat bila tersedia. Transkrip tetap menggunakan `role: "user"` untuk kompatibilitas penyedia, tetapi teks terlihat dan metadata asal sama-sama menandai giliran sebagai data antar-sesi.

Selama pembangunan ulang konteks, OpenClaw menerapkan marker yang sama pada giliran pengguna antar-sesi lama yang tersimpan dan hanya memiliki metadata asal.

---

## Matriks penyedia (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Hapus tanda tangan penalaran yatim (item penalaran mandiri tanpa blok konten berikutnya) untuk transkrip OpenAI Responses/Codex, dan hapus penalaran OpenAI yang dapat diputar ulang setelah pengalihan rute model.
- Pertahankan payload item penalaran OpenAI Responses yang dapat diputar ulang, termasuk item ringkasan kosong terenkripsi, agar pemutaran ulang manual/WebSocket mempertahankan status `rs_*` yang diperlukan tetap berpasangan dengan item output asisten.
- Tidak ada sanitasi id panggilan alat.
- Perbaikan pemasangan hasil alat dapat memindahkan output nyata yang cocok dan mensintesis output bergaya Codex `aborted` untuk panggilan alat yang hilang.
- Tidak ada validasi atau pengurutan ulang giliran.
- Output alat keluarga OpenAI Responses yang hilang disintesis sebagai `aborted` agar sesuai dengan normalisasi pemutaran ulang Codex.
- Tidak ada penghapusan tanda tangan pemikiran.

**Gemma 4 kompatibel OpenAI**

- Blok thinking/penalaran asisten historis dihapus sebelum pemutaran ulang agar server Gemma 4 lokal yang kompatibel OpenAI tidak menerima konten penalaran dari giliran sebelumnya.
- Kelanjutan panggilan alat pada giliran yang sama saat ini mempertahankan blok penalaran asisten yang terlampir pada panggilan alat hingga hasil alat telah diputar ulang.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi id panggilan alat: alfanumerik ketat.
- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (pergantian giliran bergaya Gemini).
- Perbaikan pengurutan giliran Google (tambahkan bootstrap pengguna kecil jika riwayat dimulai dengan asisten).
- Antigravity Claude: normalisasi tanda tangan thinking; hapus blok thinking tanpa tanda tangan.

**Anthropic / Minimax (kompatibel Anthropic)**

- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (gabungkan giliran pengguna berurutan untuk memenuhi pergantian ketat).
- Giliran praisi asisten di akhir dihapus dari payload Anthropic Messages keluar saat thinking diaktifkan, termasuk rute Cloudflare AI Gateway.
- Blok thinking dengan tanda tangan pemutaran ulang yang hilang, kosong, atau hanya spasi dihapus sebelum konversi penyedia. Jika itu membuat giliran asisten kosong, OpenClaw mempertahankan bentuk giliran dengan teks penalaran-dihilangkan yang tidak kosong.
- Giliran asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan teks penalaran-dihilangkan yang tidak kosong agar adaptor penyedia tidak menghapus giliran pemutaran ulang.

**Amazon Bedrock (Converse API)**

- Giliran kesalahan stream asisten kosong diperbaiki menjadi blok teks fallback yang tidak kosong sebelum pemutaran ulang. Bedrock Converse menolak pesan asisten dengan `content: []`, sehingga giliran asisten tersimpan dengan `stopReason: "error"` dan konten kosong juga diperbaiki di disk sebelum dimuat.
- Giliran kesalahan stream asisten yang hanya berisi blok teks kosong dihapus dari salinan pemutaran ulang dalam memori, bukan memutar ulang blok kosong yang tidak valid.
- Blok thinking Claude dengan tanda tangan pemutaran ulang yang hilang, kosong, atau hanya spasi dihapus sebelum pemutaran ulang Converse. Jika itu membuat giliran asisten kosong, OpenClaw mempertahankan bentuk giliran dengan teks penalaran-dihilangkan yang tidak kosong.
- Giliran asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan teks penalaran-dihilangkan yang tidak kosong agar pemutaran ulang Converse mempertahankan bentuk giliran ketat.
- Pemutaran ulang memfilter giliran asisten cermin-pengiriman OpenClaw dan yang disisipkan Gateway.
- Sanitasi gambar diterapkan melalui aturan global.

**Mistral (termasuk deteksi berbasis id model)**

- Sanitasi id panggilan alat: strict9 (alfanumerik panjang 9).

**OpenRouter Gemini**

- Pembersihan tanda tangan pemikiran: hapus nilai `thought_signature` non-base64 (pertahankan base64).

**OpenRouter Anthropic**

- Giliran praisi asisten di akhir dihapus dari payload model Anthropic kompatibel OpenAI yang terverifikasi di OpenRouter saat penalaran diaktifkan, sesuai dengan perilaku pemutaran ulang Anthropic langsung dan Cloudflare Anthropic.

**Semua yang lain**

- Hanya sanitasi gambar.

---

## Perilaku historis (pra-2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapis kebersihan transkrip:

- **Ekstensi sanitasi transkrip** berjalan pada setiap pembangunan konteks dan dapat:
  - Memperbaiki pemasangan penggunaan/hasil alat.
  - Menyantasi id panggilan alat (termasuk mode tidak ketat yang mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus penyedia, yang menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan penyedia, termasuk:
  - Menghapus tag `<final>` dari teks asisten sebelum persistensi.
  - Menghapus giliran kesalahan asisten kosong.
  - Memangkas konten asisten setelah panggilan alat.

Kompleksitas ini menyebabkan regresi lintas penyedia (terutama pemasangan `call_id|fc_id` `openai-responses`). Pembersihan 2026.1.22 menghapus ekstensi tersebut, memusatkan logika di runner, dan membuat OpenAI **tanpa sentuhan** selain sanitasi gambar.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
