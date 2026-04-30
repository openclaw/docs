---
read_when:
    - Anda sedang melakukan debug terhadap penolakan permintaan penyedia yang terkait dengan struktur transkrip
    - Anda sedang mengubah sanitasi transkrip atau logika perbaikan panggilan alat.
    - Anda sedang menyelidiki ketidakcocokan ID panggilan alat di berbagai penyedia
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus penyedia'
title: Kebersihan transkrip
x-i18n:
    generated_at: "2026-04-30T10:11:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw menerapkan **perbaikan khusus penyedia** pada transkrip sebelum sebuah proses berjalan (membangun konteks model). Sebagian besar penyesuaian ini bersifat **dalam memori** dan digunakan untuk memenuhi persyaratan penyedia yang ketat. Proses perbaikan file sesi terpisah juga dapat menulis ulang JSONL tersimpan sebelum sesi dimuat, baik dengan membuang baris JSONL yang rusak maupun dengan memperbaiki giliran tersimpan yang valid secara sintaksis tetapi diketahui akan ditolak oleh
penyedia saat pemutaran ulang. Ketika perbaikan terjadi, file asli dicadangkan di samping
file sesi.

Cakupan mencakup:

- Konteks prompt khusus runtime tetap berada di luar giliran transkrip yang terlihat pengguna
- Sanitasi id panggilan alat
- Validasi input panggilan alat
- Perbaikan pemasangan hasil alat
- Validasi / pengurutan giliran
- Pembersihan tanda tangan pemikiran
- Pembersihan tanda tangan thinking
- Sanitasi payload gambar
- Pembersihan blok teks kosong sebelum pemutaran ulang penyedia
- Penandaan asal input pengguna (untuk prompt yang dirutekan antarsesi)
- Perbaikan giliran error asisten kosong untuk pemutaran ulang Bedrock Converse

Jika Anda membutuhkan detail penyimpanan transkrip, lihat:

- [Pembahasan mendalam manajemen sesi](/id/reference/session-management-compaction)

---

## Aturan global: konteks runtime bukan transkrip pengguna

Konteks runtime/sistem dapat ditambahkan ke prompt model untuk suatu giliran, tetapi itu
bukan konten yang dibuat oleh pengguna akhir. OpenClaw menyimpan isi prompt yang menghadap transkrip
secara terpisah untuk balasan Gateway, tindak lanjut antrean, ACP, CLI, dan proses Pi
tertanam. Giliran pengguna terlihat yang tersimpan menggunakan isi transkrip tersebut, bukan
prompt yang diperkaya runtime.

Untuk sesi lama yang sudah menyimpan pembungkus runtime, permukaan riwayat Gateway
menerapkan proyeksi tampilan sebelum mengembalikan pesan ke klien WebChat,
TUI, REST, atau SSE.

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

Payload gambar selalu disanitasi untuk mencegah penolakan di sisi penyedia akibat batas
ukuran (menurunkan skala/mengompresi ulang gambar base64 yang terlalu besar).

Ini juga membantu mengendalikan tekanan token akibat gambar untuk model yang mendukung vision.
Dimensi maksimum yang lebih rendah umumnya mengurangi penggunaan token; dimensi lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi gambar maksimum dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx` (default: `1200`).
- Blok teks kosong dihapus saat proses ini menelusuri konten pemutaran ulang. Giliran asisten
  yang menjadi kosong dibuang dari salinan pemutaran ulang; giliran pengguna dan hasil alat
  yang menjadi kosong menerima placeholder konten-terlewat yang tidak kosong.

---

## Aturan global: panggilan alat rusak

Blok panggilan alat asisten yang tidak memiliki `input` maupun `arguments` dibuang
sebelum konteks model dibangun. Ini mencegah penolakan penyedia dari panggilan alat
yang tersimpan sebagian (misalnya, setelah kegagalan batas laju).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan dalam `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

---

## Aturan global: asal input antarsesi

Saat agen mengirim prompt ke sesi lain melalui `sessions_send` (termasuk
langkah balasan/pengumuman antaragen), OpenClaw menyimpan giliran pengguna yang dibuat dengan:

- `message.provenance.kind = "inter_session"`

OpenClaw juga menambahkan penanda `[Pesan antarsesi ... isUser=false]`
pada giliran yang sama sebelum teks prompt yang dirutekan agar panggilan model aktif dapat membedakan
output sesi asing dari instruksi pengguna akhir eksternal. Penanda ini mencakup
sesi sumber, kanal, dan alat jika tersedia. Transkrip tetap menggunakan
`role: "user"` untuk kompatibilitas penyedia, tetapi teks terlihat dan metadata
asal sama-sama menandai giliran tersebut sebagai data antarsesi.

Saat konteks dibangun ulang, OpenClaw menerapkan penanda yang sama pada giliran pengguna
antarsesi lama yang hanya memiliki metadata asal.

---

## Matriks penyedia (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Buang tanda tangan reasoning yatim (item reasoning mandiri tanpa blok konten berikutnya) untuk transkrip OpenAI Responses/Codex, dan buang reasoning OpenAI yang dapat diputar ulang setelah peralihan rute model.
- Pertahankan payload item reasoning OpenAI Responses yang dapat diputar ulang, termasuk item ringkasan kosong terenkripsi, sehingga pemutaran ulang manual/WebSocket tetap memasangkan status `rs_*` yang diperlukan dengan item output asisten.
- Tidak ada sanitasi id panggilan alat.
- Perbaikan pemasangan hasil alat dapat memindahkan output nyata yang cocok dan menyintesis output bergaya Codex `aborted` untuk panggilan alat yang hilang.
- Tidak ada validasi atau pengurutan ulang giliran.
- Output alat rumpun OpenAI Responses yang hilang disintesis sebagai `aborted` agar sesuai dengan normalisasi pemutaran ulang Codex.
- Tidak ada penghapusan tanda tangan pemikiran.

**Gemma 4 yang kompatibel dengan OpenAI**

- Blok thinking/reasoning historis asisten dihapus sebelum pemutaran ulang agar server Gemma 4 lokal
  yang kompatibel dengan OpenAI tidak menerima konten reasoning dari giliran sebelumnya.
- Kelanjutan panggilan alat pada giliran yang sama saat ini mempertahankan blok reasoning asisten
  yang melekat pada panggilan alat sampai hasil alat diputar ulang.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi id panggilan alat: alfanumerik ketat.
- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (pergantian giliran bergaya Gemini).
- Perbaikan pengurutan giliran Google (tambahkan bootstrap pengguna kecil jika riwayat dimulai dengan asisten).
- Antigravity Claude: normalkan tanda tangan thinking; buang blok thinking tanpa tanda tangan.

**Anthropic / Minimax (kompatibel dengan Anthropic)**

- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (gabungkan giliran pengguna berturut-turut untuk memenuhi pergantian ketat).
- Giliran prefill asisten di akhir dihapus dari payload Anthropic Messages
  keluar saat thinking diaktifkan, termasuk rute Cloudflare AI Gateway.
- Blok thinking dengan tanda tangan pemutaran ulang yang hilang, kosong, atau blank dihapus
  sebelum konversi penyedia. Jika itu mengosongkan giliran asisten, OpenClaw mempertahankan
  bentuk giliran dengan teks reasoning-terlewat yang tidak kosong.
- Giliran asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan
  teks reasoning-terlewat yang tidak kosong agar adapter penyedia tidak membuang giliran
  pemutaran ulang.

**Amazon Bedrock (Converse API)**

- Giliran error stream asisten kosong diperbaiki menjadi blok teks fallback yang tidak kosong
  sebelum pemutaran ulang. Bedrock Converse menolak pesan asisten dengan `content: []`, sehingga
  giliran asisten tersimpan dengan `stopReason: "error"` dan konten kosong juga
  diperbaiki di disk sebelum dimuat.
- Giliran error stream asisten yang hanya berisi blok teks blank dibuang
  dari salinan pemutaran ulang dalam memori alih-alih memutar ulang blok blank yang tidak valid.
- Blok thinking Claude dengan tanda tangan pemutaran ulang yang hilang, kosong, atau blank
  dihapus sebelum pemutaran ulang Converse. Jika itu mengosongkan giliran asisten, OpenClaw
  mempertahankan bentuk giliran dengan teks reasoning-terlewat yang tidak kosong.
- Giliran asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan
  teks reasoning-terlewat yang tidak kosong agar pemutaran ulang Converse mempertahankan bentuk giliran ketat.
- Pemutaran ulang memfilter giliran asisten delivery-mirror OpenClaw dan yang disuntikkan gateway.
- Sanitasi gambar diterapkan melalui aturan global.

**Mistral (termasuk deteksi berbasis id model)**

- Sanitasi id panggilan alat: strict9 (alfanumerik panjang 9).

**OpenRouter Gemini**

- Pembersihan tanda tangan pemikiran: hapus nilai `thought_signature` non-base64 (pertahankan base64).

**Lainnya**

- Hanya sanitasi gambar.

---

## Perilaku historis (pra-2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapisan kebersihan transkrip:

- Sebuah **ekstensi transcript-sanitize** berjalan pada setiap pembangunan konteks dan dapat:
  - Memperbaiki pemasangan penggunaan/hasil alat.
  - Meny sanitasi id panggilan alat (termasuk mode tidak ketat yang mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus penyedia, yang menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan penyedia, termasuk:
  - Menghapus tag `<final>` dari teks asisten sebelum persistensi.
  - Membuang giliran error asisten kosong.
  - Memangkas konten asisten setelah panggilan alat.

Kompleksitas ini menyebabkan regresi lintas penyedia (terutama pemasangan `openai-responses`
`call_id|fc_id`). Pembersihan 2026.1.22 menghapus ekstensi tersebut, memusatkan
logika di runner, dan membuat OpenAI **tanpa sentuhan** selain sanitasi gambar.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
