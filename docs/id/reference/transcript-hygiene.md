---
read_when:
    - Anda sedang men-debug penolakan permintaan penyedia yang terkait dengan struktur transkrip
    - Anda sedang mengubah logika sanitasi transkrip atau perbaikan pemanggilan alat
    - Anda sedang menyelidiki ketidakcocokan ID pemanggilan alat di berbagai penyedia
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus penyedia'
title: Kebersihan transkrip
x-i18n:
    generated_at: "2026-07-12T14:40:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw menerapkan **perbaikan khusus penyedia** pada transkrip sebelum eksekusi
(membangun konteks model). Sebagian besar perbaikan ini merupakan penyesuaian
**dalam memori** yang digunakan untuk memenuhi persyaratan ketat penyedia.
Proses perbaikan berkas sesi yang terpisah juga dapat menulis ulang JSONL yang
tersimpan sebelum sesi dimuat, tetapi hanya untuk baris yang rusak atau giliran
tersimpan yang bukan merupakan rekaman persisten yang valid. Balasan asisten
yang telah dikirim dipertahankan di disk; penghapusan praisi asisten khusus
penyedia hanya terjadi saat menyusun muatan keluar.

Ketika perbaikan dilakukan, berkas asli ditulis ke berkas sementara sejajar
`*.bak-<pid>-<ts>` sebelum penggantian atomik, lalu dihapus setelah penggantian
berhasil. Cadangan hanya dipertahankan jika pembersihannya sendiri gagal; dalam
kasus tersebut, jalurnya dilaporkan kembali.

Cakupannya meliputi:

- Menjaga konteks prompt khusus runtime agar tidak masuk ke giliran transkrip yang terlihat oleh pengguna
- Sanitasi id panggilan alat
- Validasi input panggilan alat
- Perbaikan pemasangan hasil alat
- Validasi / pengurutan giliran
- Pembersihan tanda tangan pemikiran
- Pembersihan tanda tangan proses berpikir
- Sanitasi muatan gambar
- Pembersihan blok teks kosong sebelum pemutaran ulang ke penyedia
- Pembersihan giliran terputus yang hanya berisi penalaran akibat batas panjang sebelum pemutaran ulang ke penyedia
- Penandaan asal input pengguna (untuk prompt yang dirutekan antarsesi)
- Perbaikan giliran kesalahan asisten kosong untuk pemutaran ulang Bedrock Converse

Jika Anda memerlukan detail penyimpanan transkrip, lihat
[Uraian mendalam pengelolaan sesi](/id/reference/session-management-compaction).

---

## Aturan global: konteks runtime bukan transkrip pengguna

Konteks runtime/sistem dapat ditambahkan ke prompt model untuk suatu giliran,
tetapi konteks tersebut bukan konten yang ditulis oleh pengguna akhir.
OpenClaw menyimpan isi prompt terpisah yang ditujukan untuk transkrip bagi
balasan Gateway, tindak lanjut dalam antrean, ACP, CLI, dan eksekusi OpenClaw
tertanam. Giliran pengguna terlihat yang tersimpan menggunakan isi transkrip
tersebut, bukan prompt yang diperkaya dengan konteks runtime.

Untuk sesi lama yang telah menyimpan pembungkus runtime, permukaan riwayat
Gateway menerapkan proyeksi tampilan sebelum mengembalikan pesan kepada klien
WebChat, TUI, REST, atau SSE.

---

## Tempat proses ini dijalankan

Seluruh kebersihan transkrip dipusatkan dalam runner tertanam:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, berdasarkan `provider`, `modelApi`, dan `modelId`)
- Penerapan sanitasi/perbaikan: `sanitizeSessionHistory` dalam
  `src/agents/embedded-agent-runner/replay-history.ts`

Terpisah dari kebersihan transkrip, berkas sesi diperbaiki (jika diperlukan)
sebelum dimuat:

- `repairSessionFileIfNeeded` dalam `src/agents/session-file-repair.ts`
- Dipanggil dari `src/agents/embedded-agent-runner/run/attempt.ts` dan
  `src/agents/embedded-agent-runner/compact.ts`

---

## Aturan global: sanitasi gambar

Muatan gambar selalu disanitasi untuk mencegah penolakan dari sisi penyedia
akibat batas ukuran (menurunkan skala/mengompresi ulang gambar base64 yang
terlalu besar). Hal ini juga membantu mengendalikan tekanan token akibat
gambar untuk model yang mendukung penglihatan: dimensi maksimum yang lebih
rendah mengurangi penggunaan token, sedangkan dimensi yang lebih tinggi
mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` dalam
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` dalam `src/agents/tool-images.ts`
- Sisi maksimum gambar dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx`
  (bawaan: `1200`)
- Blok teks kosong dihapus saat proses ini menelusuri konten pemutaran ulang.
  Giliran asisten yang menjadi kosong dihapus dari salinan pemutaran ulang;
  giliran pengguna dan hasil alat yang menjadi kosong menerima placeholder
  konten-dihilangkan yang tidak kosong.

---

## Aturan global: panggilan alat yang rusak

Blok panggilan alat asisten yang tidak memiliki `input` maupun `arguments`
dihapus sebelum konteks model dibangun. Hal ini mencegah penolakan penyedia
akibat panggilan alat yang tersimpan sebagian (misalnya setelah kegagalan
karena batas laju).

Implementasi:

- `sanitizeToolCallInputs` dalam `src/agents/session-transcript-repair.ts`
- Diterapkan dalam `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Aturan global: giliran tidak lengkap yang hanya berisi penalaran

Giliran asisten yang mencapai batas keluaran penyedia dan hanya berisi konten
pemikiran atau pemikiran yang disamarkan dihilangkan dari salinan pemutaran
ulang dalam memori. Giliran tersebut memuat status penyedia yang tidak lengkap
dan mungkin membawa tanda tangan pemikiran parsial.

Giliran kosong akibat batas panjang tetap tidak berubah, begitu pula giliran
akibat batas panjang yang memiliki teks terlihat, panggilan alat, atau blok
konten yang tidak dikenal. Transkrip tersimpan tidak ditulis ulang.

Implementasi: `normalizeAssistantReplayContent` dalam
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Aturan global: asal input antarsesi

Ketika agen mengirimkan prompt ke sesi lain melalui `sessions_send`
(termasuk langkah balasan/pengumuman antaragen), OpenClaw menyimpan giliran
pengguna yang dibuat dengan `message.provenance.kind = "inter_session"`.

OpenClaw juga menambahkan penanda `[Inter-session message] ... isUser=false`
pada awal giliran yang sama sebelum teks prompt yang dirutekan agar panggilan
model aktif dapat membedakan keluaran sesi lain dari instruksi pengguna akhir
eksternal. Penanda ini menyertakan sesi sumber, kanal, dan alat jika tersedia.
Transkrip tetap menggunakan `role: "user"` untuk kompatibilitas penyedia,
tetapi teks yang terlihat dan metadata asal sama-sama menandai giliran tersebut
sebagai data antarsesi.

Selama pembangunan ulang konteks, OpenClaw menerapkan penanda yang sama pada
giliran pengguna antarsesi lama yang tersimpan dan hanya memiliki metadata
asal.

---

## Matriks penyedia (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Hapus tanda tangan penalaran yatim (item penalaran mandiri tanpa blok konten
  berikutnya) untuk transkrip OpenAI Responses/Codex, serta hapus penalaran
  OpenAI yang dapat diputar ulang setelah peralihan rute model.
- Pertahankan muatan item penalaran OpenAI Responses yang dapat diputar ulang,
  termasuk item ringkasan kosong terenkripsi, agar pemutaran ulang
  manual/WebSocket tetap memasangkan status `rs_*` yang diwajibkan dengan item
  keluaran asisten.
- Native ChatGPT Codex Responses mengikuti kesetaraan protokol Codex dengan
  memutar ulang muatan penalaran/pesan/fungsi Responses sebelumnya tanpa id
  item sebelumnya, sambil mempertahankan `prompt_cache_key` sesi.
- Pemutaran ulang keluarga OpenAI Responses mempertahankan pasangan penalaran
  model-yang-sama `call_*|fc_*` yang kanonis, tetapi secara deterministik
  menormalkan `call_id`/id item panggilan fungsi yang rusak atau terlalu
  panjang sebelum konversi muatan pi-ai.
- Perbaikan pemasangan hasil alat dapat memindahkan keluaran nyata yang cocok
  dan menyintesis keluaran `aborted` bergaya Codex untuk panggilan alat yang
  tidak memiliki hasil.
- Tidak ada validasi atau pengurutan ulang giliran; tidak ada penghapusan tanda
  tangan pemikiran.

**Chat Completions yang kompatibel dengan OpenAI**

- Blok pemikiran/penalaran asisten historis dihapus sebelum pemutaran ulang
  agar server lokal dan server bergaya proksi yang kompatibel dengan OpenAI
  tidak menerima bidang penalaran giliran sebelumnya seperti `reasoning` atau
  `reasoning_content`.
- Kelanjutan panggilan alat dalam giliran yang sama saat ini mempertahankan
  blok penalaran asisten yang terlampir pada panggilan alat sampai hasil alat
  diputar ulang.
- Entri model khusus/dihosting sendiri dengan `reasoning: true` mempertahankan
  metadata penalaran yang diputar ulang.
- Pengecualian milik penyedia dapat memilih untuk tidak menerapkannya ketika
  protokol mereka memerlukan metadata penalaran yang diputar ulang.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi id panggilan alat: alfanumerik ketat.
- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (pergantian giliran bergaya Gemini).
- Perbaikan pengurutan giliran Google (tambahkan bootstrap pengguna kecil di
  awal jika riwayat dimulai dengan asisten).
- Antigravity Claude: normalkan tanda tangan pemikiran; hapus blok pemikiran
  tanpa tanda tangan.

**Anthropic / Minimax (kompatibel dengan Anthropic)**

- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (gabungkan giliran pengguna yang berurutan untuk memenuhi
  pergantian ketat).
- Giliran praisi asisten di akhir dihapus dari muatan Anthropic Messages yang
  keluar saat pemikiran diaktifkan, termasuk rute Cloudflare AI Gateway.
- Tanda tangan pemikiran asisten sebelum Compaction dihapus sebelum pemutaran
  ulang ke penyedia jika suatu sesi telah mengalami Compaction. Tanda tangan
  pemikiran terikat secara kriptografis pada awalan percakapan saat dibuat;
  setelah Compaction, awalan berubah (konten yang diringkas menggantikan
  konten asli), sehingga memutar ulang tanda tangan asli menyebabkan Anthropic
  menolak permintaan dengan "Invalid signature in thinking block". Teks
  pemikiran dipertahankan sebagai blok tanpa tanda tangan, lalu ditangani oleh
  aturan di bawah.
- Blok pemikiran dengan tanda tangan pemutaran ulang yang tidak ada, kosong,
  atau hanya berisi spasi dihapus sebelum konversi penyedia. Jika hal tersebut
  mengosongkan giliran asisten, OpenClaw mempertahankan bentuk giliran dengan
  teks penalaran-dihilangkan yang tidak kosong.
- Giliran asisten lama yang hanya berisi pemikiran dan harus dihapus diganti
  dengan teks penalaran-dihilangkan yang tidak kosong agar adaptor penyedia
  tidak menghapus giliran pemutaran ulang.

**Amazon Bedrock (Converse API)**

- Giliran kesalahan aliran asisten yang kosong diperbaiki menjadi blok teks
  pengganti yang tidak kosong sebelum pemutaran ulang. Bedrock Converse
  menolak pesan asisten dengan `content: []`, sehingga giliran asisten
  tersimpan dengan `stopReason: "error"` dan konten kosong juga diperbaiki di
  disk sebelum dimuat.
- Giliran kesalahan aliran asisten yang hanya memiliki blok teks kosong
  dihapus dari salinan pemutaran ulang dalam memori, alih-alih memutar ulang
  blok kosong yang tidak valid.
- Tanda tangan pemikiran asisten sebelum Compaction dihapus sebelum pemutaran
  ulang Converse jika suatu sesi telah mengalami Compaction, dengan alasan
  yang sama seperti Anthropic di atas.
- Blok pemikiran Claude dengan tanda tangan pemutaran ulang yang tidak ada,
  kosong, atau hanya berisi spasi dihapus sebelum pemutaran ulang Converse.
  Jika hal tersebut mengosongkan giliran asisten, OpenClaw mempertahankan
  bentuk giliran dengan teks penalaran-dihilangkan yang tidak kosong.
- Giliran asisten lama yang hanya berisi pemikiran dan harus dihapus diganti
  dengan teks penalaran-dihilangkan yang tidak kosong agar pemutaran ulang
  Converse mempertahankan bentuk giliran yang ketat.
- Pemutaran ulang menyaring giliran asisten cerminan-pengiriman OpenClaw dan
  giliran asisten yang disisipkan Gateway.
- Sanitasi gambar diterapkan melalui aturan global.

**Mistral (termasuk deteksi berdasarkan id model)**

- Sanitasi id panggilan alat: strict9 (alfanumerik, panjang 9).

**OpenRouter Gemini**

- Pembersihan tanda tangan pemikiran: hapus nilai `thought_signature` non-base64
  (pertahankan base64).

**OpenRouter Anthropic**

- Giliran praisi asisten di akhir dihapus dari muatan model Anthropic yang
  kompatibel dengan OpenAI dan telah diverifikasi pada OpenRouter saat
  penalaran diaktifkan, sesuai dengan perilaku pemutaran ulang Anthropic
  langsung dan Cloudflare Anthropic.

**Semua lainnya**

- Hanya sanitasi gambar.

---

## Perilaku historis (sebelum 2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapisan kebersihan
transkrip:

- Sebuah **ekstensi sanitasi transkrip** dijalankan pada setiap pembangunan
  konteks dan dapat:
  - Memperbaiki pemasangan penggunaan/hasil alat.
  - Menyanitasi id panggilan alat (termasuk mode tidak ketat yang
    mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus penyedia, yang menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan penyedia, termasuk menghapus tag
  `<final>` dari teks asisten sebelum penyimpanan, menghapus giliran kesalahan
  asisten kosong, dan memangkas konten asisten setelah panggilan alat.

Kompleksitas ini menyebabkan regresi lintas penyedia (terutama pemasangan
`call_id|fc_id` pada `openai-responses`). Pembersihan 2026.1.22 menghapus
ekstensi tersebut, memusatkan logika dalam runner, dan membuat OpenAI **tidak
disentuh** selain sanitasi gambar.

## Terkait

- [Pengelolaan sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
