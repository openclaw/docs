---
read_when:
    - Anda sedang men-debug penolakan permintaan penyedia yang terkait dengan struktur transkrip
    - Anda mengubah logika sanitasi transkrip atau perbaikan pemanggilan alat
    - Anda sedang menyelidiki ketidakcocokan ID pemanggilan alat di berbagai penyedia
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus penyedia'
title: Kebersihan transkrip
x-i18n:
    generated_at: "2026-07-19T05:10:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7b64deba757d0eb3fd2cd177b6b16f4e071abbf8965a05ac087dddf086fdc920
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw menerapkan **perbaikan khusus penyedia** pada transkrip sebelum proses dijalankan
(saat membangun konteks model). Sebagian besar perbaikan ini merupakan penyesuaian **dalam memori** yang digunakan untuk
memenuhi persyaratan ketat penyedia. Proses perbaikan file sesi yang terpisah juga dapat
menulis ulang JSONL yang tersimpan sebelum sesi dimuat, tetapi hanya untuk
baris yang rusak atau giliran tersimpan yang bukan merupakan rekaman persisten yang valid.
Balasan asisten yang telah dikirim dipertahankan di disk; penghapusan prefill asisten
khusus penyedia hanya terjadi saat menyusun payload keluar.

Ketika perbaikan dilakukan, file asli ditulis ke saudara sementara
`*.bak-<pid>-<ts>` sebelum penggantian atomik, lalu dihapus setelah
penggantian berhasil. Cadangan hanya dipertahankan jika pembersihan itu sendiri gagal,
dan dalam kasus tersebut jalurnya dilaporkan kembali.

Cakupannya meliputi:

- Konteks prompt khusus runtime tetap berada di luar giliran transkrip yang terlihat oleh pengguna
- Sanitasi id panggilan alat
- Validasi input panggilan alat
- Perbaikan pemasangan hasil alat
- Validasi / pengurutan giliran
- Pembersihan tanda tangan pemikiran
- Pembersihan tanda tangan proses berpikir
- Sanitasi payload gambar
- Pembersihan blok teks kosong sebelum pemutaran ulang oleh penyedia
- Pembersihan giliran yang hanya berisi penalaran tidak lengkap dan mencapai batas panjang sebelum pemutaran ulang oleh penyedia
- Penandaan asal input pengguna (untuk prompt yang dirutekan antarsesi)
- Perbaikan giliran kesalahan asisten kosong untuk pemutaran ulang Bedrock Converse

Jika memerlukan detail penyimpanan transkrip, lihat
[Uraian mendalam pengelolaan sesi](/id/reference/session-management-compaction).

---

## Aturan global: konteks runtime bukan transkrip pengguna

Konteks runtime/sistem dapat ditambahkan ke prompt model untuk suatu giliran, tetapi konteks tersebut
bukan konten yang dibuat oleh pengguna akhir. OpenClaw menyimpan isi prompt terpisah
yang ditujukan untuk transkrip bagi balasan Gateway, tindak lanjut dalam antrean, ACP, CLI, dan proses
OpenClaw tertanam. Giliran pengguna terlihat yang disimpan menggunakan isi transkrip tersebut, bukan
prompt yang diperkaya runtime.

Untuk sesi lama yang telah menyimpan pembungkus runtime, permukaan riwayat Gateway
menerapkan proyeksi tampilan sebelum mengembalikan pesan ke klien WebChat,
TUI, REST, atau SSE.

---

## Tempat proses ini dijalankan

Seluruh kebersihan transkrip dipusatkan dalam runner tertanam:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, berdasarkan `provider`, `modelApi`, dan `modelId`)
- Penerapan sanitasi/perbaikan: `sanitizeSessionHistory` di
  `src/agents/embedded-agent-runner/replay-history.ts`

Terpisah dari kebersihan transkrip, file sesi diperbaiki (jika diperlukan)
sebelum dimuat:

- `repairSessionFileIfNeeded` di `src/agents/session-file-repair.ts`
- Dipanggil dari `src/agents/embedded-agent-runner/run/attempt.ts` dan
  `src/agents/embedded-agent-runner/compact.ts`

---

## Aturan global: sanitasi gambar

Payload gambar selalu disanitasi untuk mencegah penolakan dari sisi penyedia akibat
batas ukuran (memperkecil/mengompresi ulang gambar base64 yang terlalu besar). Hal ini juga membantu
mengendalikan tekanan token akibat gambar untuk model yang mendukung visi: dimensi maksimum yang lebih
rendah mengurangi penggunaan token, sedangkan dimensi yang lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi maksimum gambar dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx`
  (default: `1200`)
- Blok teks kosong dihapus saat proses ini menelusuri konten pemutaran ulang.
  Giliran asisten yang menjadi kosong dihapus dari salinan pemutaran ulang; giliran pengguna
  dan hasil alat yang menjadi kosong menerima placeholder konten yang dihilangkan
  dan tidak kosong.

---

## Aturan global: panggilan alat yang rusak

Blok panggilan alat asisten yang tidak memiliki `input` maupun `arguments` akan dihapus
sebelum konteks model dibangun. Hal ini mencegah penolakan penyedia akibat
panggilan alat yang tersimpan sebagian (misalnya, setelah kegagalan batas laju).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan di `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Aturan global: pemasangan hasil alat

Hasil alat dipasangkan dengan kemunculan panggilan alat dalam setiap giliran asisten sebelum
ID panggilan khusus penyedia ditulis ulang. ID yang dihasilkan penyedia dapat berulang pada giliran
berikutnya, sehingga hasil yang berdekatan dengan panggilan berulang tetap dipasangkan dengan kemunculan tersebut. Hasil
yang berpindah hanya dipindahkan jika tepat satu kemunculan yang belum terselesaikan dapat memilikinya; hasil tambahan
yang ambigu dihapus dan kemunculan yang hilang menerima hasil kesalahan sintetis.

Implementasi: `sanitizeToolUseResultPairing` di
`src/agents/session-transcript-repair.ts`

---

## Aturan global: giliran yang hanya berisi penalaran tidak lengkap

Giliran asisten yang mencapai batas output penyedia dan hanya berisi konten proses berpikir atau
proses berpikir yang disamarkan akan dihilangkan dari salinan pemutaran ulang dalam memori. Giliran
tersebut berisi status penyedia yang tidak lengkap dan mungkin membawa sebagian tanda tangan proses berpikir.

Giliran batas panjang yang kosong tetap tidak berubah, demikian juga giliran batas panjang dengan teks yang terlihat,
panggilan alat, atau blok konten yang tidak dikenal. Transkrip yang tersimpan tidak ditulis ulang.

Implementasi: `normalizeAssistantReplayContent` di
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Aturan global: asal input antarsesi

Ketika agen mengirimkan prompt ke sesi lain melalui `sessions_send`
(termasuk langkah balasan/pengumuman antaragen), OpenClaw menyimpan
giliran pengguna yang dibuat dengan `message.provenance.kind = "inter_session"`.

OpenClaw juga menambahkan penanda `[Inter-session message] ... isUser=false` pada giliran yang sama
sebelum teks prompt yang dirutekan agar panggilan model aktif dapat
membedakan output sesi asing dari instruksi eksternal pengguna akhir. Penanda ini
mencakup sesi sumber, saluran, dan alat jika tersedia. Transkrip tetap menggunakan
`role: "user"` untuk kompatibilitas penyedia, tetapi teks yang terlihat dan metadata
asal sama-sama menandai giliran tersebut sebagai data antarsesi.

Saat konteks dibangun ulang, OpenClaw menerapkan penanda yang sama pada giliran pengguna antarsesi
lama yang tersimpan dan hanya memiliki metadata asal.

---

## Matriks penyedia (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Hapus tanda tangan penalaran yatim (item penalaran mandiri tanpa
  blok konten setelahnya) untuk transkrip OpenAI Responses/Codex, serta hapus
  penalaran OpenAI yang dapat diputar ulang setelah peralihan rute model.
- Pertahankan payload item penalaran OpenAI Responses yang dapat diputar ulang, termasuk
  item ringkasan kosong terenkripsi, agar pemutaran ulang manual/WebSocket mempertahankan status
  `rs_*` yang diperlukan tetap dipasangkan dengan item output asisten.
- ChatGPT Codex Responses native mengikuti kesetaraan protokol Codex dengan memutar ulang
  payload penalaran/pesan/fungsi Responses sebelumnya tanpa ID item
  sebelumnya sambil mempertahankan `prompt_cache_key` sesi.
- Pemutaran ulang keluarga OpenAI Responses mempertahankan pasangan penalaran model yang sama
  `call_*|fc_*` yang kanonis, tetapi secara deterministik menormalkan id item `call_id`/panggilan fungsi
  yang rusak atau terlalu panjang sebelum konversi payload pi-ai.
- Perbaikan pemasangan hasil alat dapat memindahkan output nyata yang cocok dan menyintesis
  output `aborted` bergaya Codex untuk panggilan alat yang hilang.
- Tidak ada validasi atau pengurutan ulang giliran; tidak ada penghapusan tanda tangan pemikiran.

**Chat Completions yang kompatibel dengan OpenAI**

- Blok proses berpikir/penalaran asisten historis dihapus sebelum pemutaran ulang
  agar server lokal dan proksi yang kompatibel dengan OpenAI tidak menerima
  bidang penalaran giliran sebelumnya seperti `reasoning` atau `reasoning_content`.
- Kelanjutan panggilan alat pada giliran yang sama saat ini mempertahankan blok penalaran asisten
  tetap terpasang pada panggilan alat hingga hasil alat selesai diputar ulang.
- Entri model khusus/dihosting sendiri dengan `reasoning: true` mempertahankan metadata
  penalaran yang diputar ulang.
- Pengecualian milik penyedia dapat memilih untuk tidak menerapkannya ketika protokol mereka memerlukan
  metadata penalaran yang diputar ulang.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi id panggilan alat: alfanumerik ketat.
- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (pergantian giliran bergaya Gemini).
- Perbaikan urutan giliran Google (tambahkan bootstrap pengguna kecil di awal jika riwayat
  dimulai dengan asisten).
- Antigravity Claude: normalkan tanda tangan proses berpikir; hapus blok proses berpikir
  tanpa tanda tangan.

**Anthropic / Minimax (kompatibel dengan Anthropic)**

- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (gabungkan giliran pengguna berturut-turut untuk memenuhi
  pergantian yang ketat).
- Giliran prefill asisten di akhir dihapus dari payload Anthropic
  Messages keluar saat proses berpikir diaktifkan, termasuk rute Cloudflare AI
  Gateway.
- Tanda tangan proses berpikir asisten sebelum Compaction dihapus sebelum pemutaran ulang
  oleh penyedia ketika sesi telah mengalami Compaction. Tanda tangan proses berpikir
  terikat secara kriptografis pada awalan percakapan saat dibuat;
  setelah Compaction, awalan berubah (konten yang diringkas menggantikan konten
  asli), sehingga memutar ulang tanda tangan asli menyebabkan Anthropic
  menolak permintaan dengan "Invalid signature in thinking block". Teks
  proses berpikir dipertahankan sebagai blok tanpa tanda tangan, lalu ditangani oleh
  aturan di bawah ini.
- Blok proses berpikir dengan tanda tangan pemutaran ulang yang hilang, kosong, atau hanya berisi spasi
  dihapus sebelum konversi penyedia. Jika hal itu mengosongkan giliran asisten,
  OpenClaw mempertahankan bentuk giliran dengan teks penalaran-dihilangkan yang tidak kosong.
- Giliran asisten lama yang hanya berisi proses berpikir dan harus dihapus diganti
  dengan teks penalaran-dihilangkan yang tidak kosong agar adaptor penyedia tidak menghapus
  giliran pemutaran ulang.

**Amazon Bedrock (Converse API)**

- Giliran kesalahan stream asisten yang kosong diperbaiki menjadi blok teks fallback
  yang tidak kosong sebelum pemutaran ulang. Bedrock Converse menolak pesan asisten
  dengan `content: []`, sehingga giliran asisten tersimpan dengan `stopReason:
"error"` dan konten kosong juga diperbaiki di disk sebelum dimuat.
- Giliran kesalahan stream asisten yang hanya berisi blok teks kosong dihapus dari
  salinan pemutaran ulang dalam memori alih-alih memutar ulang blok kosong yang tidak valid.
- Tanda tangan proses berpikir asisten sebelum Compaction dihapus sebelum pemutaran ulang Converse
  ketika sesi telah mengalami Compaction, dengan alasan yang sama seperti
  Anthropic di atas.
- Blok proses berpikir Claude dengan tanda tangan pemutaran ulang yang hilang, kosong, atau hanya berisi spasi
  dihapus sebelum pemutaran ulang Converse. Jika hal itu mengosongkan giliran asisten,
  OpenClaw mempertahankan bentuk giliran dengan teks penalaran-dihilangkan yang tidak kosong.
- Giliran asisten lama yang hanya berisi proses berpikir dan harus dihapus diganti
  dengan teks penalaran-dihilangkan yang tidak kosong agar pemutaran ulang Converse mempertahankan
  bentuk giliran yang ketat.
- Pemutaran ulang memfilter giliran asisten cermin-pengiriman OpenClaw dan yang disuntikkan
  Gateway.
- Sanitasi gambar diterapkan melalui aturan global.

**Mistral (termasuk deteksi berdasarkan id model)**

- Sanitasi id panggilan alat: strict9 (alfanumerik, panjang 9).

**OpenRouter Gemini**

- Pembersihan tanda tangan pemikiran: hapus nilai `thought_signature` non-base64
  (pertahankan base64).

**OpenRouter Anthropic**

- Giliran prefill asisten di akhir dihapus dari payload model Anthropic
  yang kompatibel dengan OpenAI dan telah diverifikasi di OpenRouter ketika penalaran diaktifkan,
  selaras dengan perilaku pemutaran ulang langsung Anthropic dan Cloudflare Anthropic.

**Yang lainnya**

- Hanya sanitasi gambar.

---

## Perilaku historis (sebelum 2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapisan kebersihan
transkrip:

- Sebuah **ekstensi transcript-sanitize** dijalankan pada setiap penyusunan konteks dan dapat:
  - Memperbaiki pemasangan penggunaan/hasil alat.
  - Membersihkan id panggilan alat (termasuk mode nonketat yang mempertahankan
    `_`/`-`).
- Runner juga melakukan pembersihan khusus penyedia, yang
  menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan penyedia, termasuk
  menghapus tag `<final>` dari teks asisten sebelum persistensi, membuang
  giliran kesalahan asisten yang kosong, dan memangkas konten asisten setelah
  panggilan alat.

Kompleksitas ini menyebabkan regresi lintas penyedia (terutama
pemasangan `openai-responses` `call_id|fc_id`). Pembersihan 2026.1.22 menghapus
ekstensi tersebut, memusatkan logika di runner, dan menjadikan OpenAI **tanpa perubahan**
selain pembersihan gambar.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
