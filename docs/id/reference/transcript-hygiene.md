---
read_when:
    - Anda sedang memecahkan masalah penolakan permintaan penyedia yang terkait dengan struktur transkrip
    - Anda sedang mengubah logika sanitasi transkrip atau perbaikan panggilan alat
    - Anda sedang menyelidiki ketidakcocokan ID panggilan alat di berbagai penyedia
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus penyedia'
title: Kebersihan transkrip
x-i18n:
    generated_at: "2026-05-10T19:52:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw menerapkan **perbaikan khusus penyedia** pada transkrip sebelum sebuah proses dijalankan (membangun konteks model). Sebagian besar adalah penyesuaian **dalam memori** yang digunakan untuk memenuhi persyaratan ketat penyedia. Sebuah langkah perbaikan file sesi terpisah juga dapat menulis ulang JSONL tersimpan sebelum sesi dimuat, tetapi hanya untuk baris yang cacat atau giliran tersimpan yang merupakan rekaman tahan lama yang tidak valid. Balasan asisten yang telah dikirim dipertahankan di disk; penghapusan praisian asisten khusus penyedia hanya terjadi saat menyusun payload keluar. Ketika perbaikan terjadi, file asli dicadangkan berdampingan dengan file sesi.

Cakupan meliputi:

- Konteks prompt khusus runtime tetap berada di luar giliran transkrip yang terlihat oleh pengguna
- Sanitasi id panggilan alat
- Validasi input panggilan alat
- Perbaikan pemasangan hasil alat
- Validasi / pengurutan giliran
- Pembersihan tanda tangan pemikiran
- Pembersihan tanda tangan thinking
- Sanitasi payload gambar
- Pembersihan blok teks kosong sebelum pemutaran ulang penyedia
- Penandaan asal input pengguna (untuk prompt yang dirutekan antarsesi)
- Perbaikan giliran kesalahan asisten kosong untuk pemutaran ulang Bedrock Converse

Jika Anda memerlukan detail penyimpanan transkrip, lihat:

- [Pendalaman manajemen sesi](/id/reference/session-management-compaction)

---

## Aturan global: konteks runtime bukan transkrip pengguna

Konteks runtime/sistem dapat ditambahkan ke prompt model untuk sebuah giliran, tetapi itu
bukan konten yang ditulis oleh pengguna akhir. OpenClaw menyimpan isi prompt
terpisah yang menghadap transkrip untuk balasan Gateway, tindak lanjut antrean, ACP, CLI, dan proses Pi
tertanam. Giliran pengguna terlihat yang disimpan menggunakan isi transkrip tersebut, bukan
prompt yang diperkaya runtime.

Untuk sesi lama yang sudah mempertahankan pembungkus runtime, permukaan riwayat Gateway
menerapkan proyeksi tampilan sebelum mengembalikan pesan ke klien WebChat,
TUI, REST, atau SSE.

---

## Tempat ini berjalan

Seluruh higiene transkrip dipusatkan di runner tertanam:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
- Penerapan sanitasi/perbaikan: `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

Kebijakan menggunakan `provider`, `modelApi`, dan `modelId` untuk menentukan apa yang diterapkan.

Terpisah dari higiene transkrip, file sesi diperbaiki (jika diperlukan) sebelum dimuat:

- `repairSessionFileIfNeeded` di `src/agents/session-file-repair.ts`
- Dipanggil dari `run/attempt.ts` dan `compact.ts` (runner tertanam)

---

## Aturan global: sanitasi gambar

Payload gambar selalu disanitasi untuk mencegah penolakan di sisi penyedia akibat batas
ukuran (turunkan skala/kompres ulang gambar base64 yang terlalu besar).

Ini juga membantu mengendalikan tekanan token yang dipicu gambar untuk model yang mampu visi.
Dimensi maksimum yang lebih rendah umumnya mengurangi penggunaan token; dimensi yang lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi gambar maksimum dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx` (default: `1200`).
- Blok teks kosong dihapus saat langkah ini menelusuri konten pemutaran ulang. Giliran asisten
  yang menjadi kosong dihapus dari salinan pemutaran ulang; giliran pengguna dan hasil alat
  yang menjadi kosong menerima placeholder konten-dihilangkan yang tidak kosong.

---

## Aturan global: panggilan alat cacat

Blok panggilan alat asisten yang kehilangan `input` dan `arguments` sekaligus dihapus
sebelum konteks model dibangun. Ini mencegah penolakan penyedia dari panggilan alat yang
tersimpan sebagian (misalnya, setelah kegagalan batas laju).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan di `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

---

## Aturan global: asal input antarsesi

Ketika agen mengirim prompt ke sesi lain melalui `sessions_send` (termasuk
langkah balas/umumkan antargen), OpenClaw mempertahankan giliran pengguna yang dibuat dengan:

- `message.provenance.kind = "inter_session"`

OpenClaw juga menambahkan penanda `[Inter-session message ... isUser=false]`
pada giliran yang sama sebelum teks prompt yang dirutekan sehingga panggilan model aktif dapat membedakan
keluaran sesi asing dari instruksi pengguna akhir eksternal. Penanda ini menyertakan
sesi sumber, kanal, dan alat jika tersedia. Transkrip tetap menggunakan
`role: "user"` untuk kompatibilitas penyedia, tetapi teks terlihat dan metadata
asal keduanya menandai giliran sebagai data antarsesi.

Selama pembangunan ulang konteks, OpenClaw menerapkan penanda yang sama pada giliran pengguna
antarsesi tersimpan yang lebih lama yang hanya memiliki metadata asal.

---

## Matriks penyedia (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Sanitasi gambar saja.
- Hapus tanda tangan reasoning yatim (item reasoning mandiri tanpa blok konten berikutnya) untuk transkrip OpenAI Responses/Codex, dan hapus reasoning OpenAI yang dapat diputar ulang setelah peralihan rute model.
- Pertahankan payload item reasoning OpenAI Responses yang dapat diputar ulang, termasuk item ringkasan kosong terenkripsi, sehingga pemutaran ulang manual/WebSocket tetap memasangkan status `rs_*` yang diperlukan dengan item keluaran asisten.
- Native ChatGPT Codex Responses mengikuti paritas kabel Codex dengan memutar ulang payload Responses reasoning/message/function sebelumnya tanpa ID item sebelumnya sambil mempertahankan `prompt_cache_key` sesi.
- Tidak ada sanitasi id panggilan alat.
- Perbaikan pemasangan hasil alat dapat memindahkan keluaran nyata yang cocok dan mensintesis keluaran bergaya Codex `aborted` untuk panggilan alat yang hilang.
- Tidak ada validasi atau pengurutan ulang giliran.
- Keluaran alat keluarga OpenAI Responses yang hilang disintesis sebagai `aborted` agar sesuai dengan normalisasi pemutaran ulang Codex.
- Tidak ada penghapusan tanda tangan pemikiran.

**OpenAI-compatible Chat Completions**

- Blok thinking/reasoning asisten historis dihapus sebelum pemutaran ulang sehingga
  server lokal dan bergaya proxy yang kompatibel dengan OpenAI tidak menerima field reasoning
  giliran sebelumnya seperti `reasoning` atau `reasoning_content`.
- Kelanjutan panggilan alat pada giliran yang sama saat ini mempertahankan blok reasoning asisten
  yang terlampir pada panggilan alat hingga hasil alat telah diputar ulang.
- Pengecualian yang dimiliki penyedia dapat memilih keluar ketika protokol kabelnya memerlukan
  metadata reasoning yang diputar ulang.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi id panggilan alat: alfanumerik ketat.
- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (pergiliran gaya Gemini).
- Perbaikan pengurutan giliran Google (tambahkan bootstrap pengguna kecil jika riwayat dimulai dengan asisten).
- Antigravity Claude: normalkan tanda tangan thinking; hapus blok thinking tanpa tanda tangan.

**Anthropic / Minimax (kompatibel dengan Anthropic)**

- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (gabungkan giliran pengguna berurutan untuk memenuhi pergiliran ketat).
- Giliran praisian asisten di akhir dihapus dari payload Anthropic Messages
  keluar saat thinking diaktifkan, termasuk rute Cloudflare AI Gateway.
- Blok thinking dengan tanda tangan pemutaran ulang yang hilang, kosong, atau kosong-putih dihapus
  sebelum konversi penyedia. Jika itu mengosongkan giliran asisten, OpenClaw mempertahankan
  bentuk giliran dengan teks reasoning-dihilangkan yang tidak kosong.
- Giliran asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan
  teks reasoning-dihilangkan yang tidak kosong agar adaptor penyedia tidak menghapus giliran
  pemutaran ulang.

**Amazon Bedrock (Converse API)**

- Giliran kesalahan stream asisten kosong diperbaiki menjadi blok teks fallback yang tidak kosong
  sebelum pemutaran ulang. Bedrock Converse menolak pesan asisten dengan `content: []`, sehingga
  giliran asisten tersimpan dengan `stopReason: "error"` dan konten kosong juga
  diperbaiki di disk sebelum dimuat.
- Giliran kesalahan stream asisten yang hanya berisi blok teks kosong-putih dihapus
  dari salinan pemutaran ulang dalam memori alih-alih memutar ulang blok kosong-putih yang tidak valid.
- Blok thinking Claude dengan tanda tangan pemutaran ulang yang hilang, kosong, atau kosong-putih
  dihapus sebelum pemutaran ulang Converse. Jika itu mengosongkan giliran asisten, OpenClaw
  mempertahankan bentuk giliran dengan teks reasoning-dihilangkan yang tidak kosong.
- Giliran asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan
  teks reasoning-dihilangkan yang tidak kosong sehingga pemutaran ulang Converse mempertahankan bentuk giliran ketat.
- Pemutaran ulang memfilter giliran asisten cermin-pengiriman OpenClaw dan yang disisipkan gateway.
- Sanitasi gambar berlaku melalui aturan global.

**Mistral (termasuk deteksi berbasis id model)**

- Sanitasi id panggilan alat: strict9 (alfanumerik panjang 9).

**OpenRouter Gemini**

- Pembersihan tanda tangan pemikiran: hapus nilai `thought_signature` non-base64 (pertahankan base64).

**OpenRouter Anthropic**

- Giliran praisian asisten di akhir dihapus dari payload model Anthropic kompatibel OpenAI
  OpenRouter terverifikasi saat reasoning diaktifkan, sesuai dengan perilaku pemutaran ulang
  Anthropic langsung dan Cloudflare Anthropic.

**Lainnya**

- Sanitasi gambar saja.

---

## Perilaku historis (sebelum 2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapisan higiene transkrip:

- Sebuah **ekstensi sanitasi-transkrip** berjalan pada setiap pembangunan konteks dan dapat:
  - Memperbaiki pemasangan penggunaan/hasil alat.
  - Menyantitasi id panggilan alat (termasuk mode tidak ketat yang mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus penyedia, yang menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan penyedia, termasuk:
  - Menghapus tag `<final>` dari teks asisten sebelum persistensi.
  - Menghapus giliran kesalahan asisten kosong.
  - Memangkas konten asisten setelah panggilan alat.

Kompleksitas ini menyebabkan regresi lintas penyedia (terutama pemasangan `openai-responses`
`call_id|fc_id`). Pembersihan 2026.1.22 menghapus ekstensi, memusatkan
logika di runner, dan membuat OpenAI **tidak disentuh** selain sanitasi gambar.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
