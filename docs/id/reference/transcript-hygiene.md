---
read_when:
    - Anda sedang mendiagnosis penolakan permintaan penyedia yang terkait dengan struktur transkrip
    - Anda sedang mengubah sanitasi transkrip atau logika perbaikan pemanggilan alat
    - Anda sedang menyelidiki ketidaksesuaian ID tool-call di berbagai penyedia
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus penyedia'
title: Kebersihan transkrip
x-i18n:
    generated_at: "2026-05-02T09:32:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw menerapkan **perbaikan khusus penyedia** pada transkrip sebelum eksekusi (membangun konteks model). Sebagian besar adalah penyesuaian **dalam memori** yang digunakan untuk memenuhi persyaratan penyedia yang ketat. Pass perbaikan file sesi terpisah juga dapat menulis ulang JSONL tersimpan sebelum sesi dimuat, baik dengan membuang baris JSONL yang cacat maupun dengan memperbaiki giliran tersimpan yang valid secara sintaksis tetapi diketahui ditolak oleh
penyedia saat replay. Ketika perbaikan terjadi, file asli dicadangkan di samping
file sesi.

Cakupan meliputi:

- Konteks prompt yang hanya untuk runtime tetap berada di luar giliran transkrip yang terlihat oleh pengguna
- Sanitasi id pemanggilan tool
- Validasi input pemanggilan tool
- Perbaikan pemasangan hasil tool
- Validasi / pengurutan giliran
- Pembersihan tanda tangan pikiran
- Pembersihan tanda tangan thinking
- Sanitasi payload gambar
- Pembersihan blok teks kosong sebelum replay penyedia
- Penandaan asal input pengguna (untuk prompt yang dirutekan antar-sesi)
- Perbaikan giliran error asisten kosong untuk replay Bedrock Converse

Jika Anda membutuhkan detail penyimpanan transkrip, lihat:

- [Pendalaman manajemen sesi](/id/reference/session-management-compaction)

---

## Aturan global: konteks runtime bukan transkrip pengguna

Konteks runtime/sistem dapat ditambahkan ke prompt model untuk suatu giliran, tetapi itu
bukan konten yang ditulis oleh pengguna akhir. OpenClaw menyimpan badan prompt
yang menghadap transkrip secara terpisah untuk balasan Gateway, tindak lanjut antrean, ACP, CLI, dan eksekusi Pi
tersemat. Giliran pengguna terlihat yang disimpan menggunakan badan transkrip tersebut, bukan
prompt yang diperkaya runtime.

Untuk sesi lama yang sudah menyimpan pembungkus runtime, permukaan riwayat Gateway
menerapkan proyeksi tampilan sebelum mengembalikan pesan ke WebChat,
TUI, REST, atau klien SSE.

---

## Di mana ini berjalan

Semua kebersihan transkrip dipusatkan di runner tersemat:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
- Penerapan sanitasi/perbaikan: `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

Kebijakan menggunakan `provider`, `modelApi`, dan `modelId` untuk memutuskan apa yang akan diterapkan.

Terpisah dari kebersihan transkrip, file sesi diperbaiki (jika diperlukan) sebelum dimuat:

- `repairSessionFileIfNeeded` di `src/agents/session-file-repair.ts`
- Dipanggil dari `run/attempt.ts` dan `compact.ts` (runner tersemat)

---

## Aturan global: sanitasi gambar

Payload gambar selalu disanitasi untuk mencegah penolakan di sisi penyedia akibat batas
ukuran (menurunkan skala/mengompresi ulang gambar base64 yang terlalu besar).

Ini juga membantu mengontrol tekanan token yang didorong gambar untuk model berkemampuan vision.
Dimensi maksimum yang lebih rendah umumnya mengurangi penggunaan token; dimensi yang lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi gambar maksimum dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx` (default: `1200`).
- Blok teks kosong dihapus saat pass ini menelusuri konten replay. Giliran asisten
  yang menjadi kosong dibuang dari salinan replay; giliran pengguna dan hasil tool
  yang menjadi kosong menerima placeholder konten-yang-dihilangkan yang tidak kosong.

---

## Aturan global: pemanggilan tool yang cacat

Blok pemanggilan tool asisten yang tidak memiliki `input` maupun `arguments` dibuang
sebelum konteks model dibangun. Ini mencegah penolakan penyedia dari pemanggilan tool yang
tersimpan sebagian (misalnya, setelah kegagalan batas laju).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan di `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

---

## Aturan global: asal input antar-sesi

Ketika agen mengirim prompt ke sesi lain melalui `sessions_send` (termasuk
langkah balasan/pengumuman agen-ke-agen), OpenClaw menyimpan giliran pengguna yang dibuat dengan:

- `message.provenance.kind = "inter_session"`

OpenClaw juga menambahkan penanda `[Inter-session message ... isUser=false]`
pada giliran yang sama sebelum teks prompt yang dirutekan agar panggilan model aktif dapat membedakan
output sesi asing dari instruksi pengguna akhir eksternal. Penanda ini menyertakan
sesi sumber, kanal, dan tool jika tersedia. Transkrip tetap menggunakan
`role: "user"` untuk kompatibilitas penyedia, tetapi teks yang terlihat dan metadata
asal sama-sama menandai giliran sebagai data antar-sesi.

Selama pembangunan ulang konteks, OpenClaw menerapkan penanda yang sama pada
giliran pengguna antar-sesi tersimpan yang lebih lama yang hanya memiliki metadata asal.

---

## Matriks penyedia (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Buang tanda tangan reasoning yatim (item reasoning mandiri tanpa blok konten berikutnya) untuk transkrip OpenAI Responses/Codex, dan buang reasoning OpenAI yang dapat direplay setelah peralihan rute model.
- Pertahankan payload item reasoning OpenAI Responses yang dapat direplay, termasuk item ringkasan kosong terenkripsi, agar replay manual/WebSocket tetap memasangkan status `rs_*` yang diperlukan dengan item output asisten.
- Tidak ada sanitasi id pemanggilan tool.
- Perbaikan pemasangan hasil tool dapat memindahkan output nyata yang cocok dan menyintesis output `aborted` bergaya Codex untuk pemanggilan tool yang hilang.
- Tidak ada validasi atau pengurutan ulang giliran.
- Output tool keluarga OpenAI Responses yang hilang disintesis sebagai `aborted` agar cocok dengan normalisasi replay Codex.
- Tidak ada penghapusan tanda tangan pikiran.

**OpenAI-compatible Gemma 4**

- Blok thinking/reasoning asisten historis dihapus sebelum replay agar server Gemma 4
  yang kompatibel OpenAI lokal tidak menerima konten reasoning giliran sebelumnya.
- Kelanjutan pemanggilan tool giliran yang sama saat ini mempertahankan blok reasoning asisten
  yang melekat pada pemanggilan tool hingga hasil tool telah direplay.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi id pemanggilan tool: alfanumerik ketat.
- Perbaikan pemasangan hasil tool dan hasil tool sintetis.
- Validasi giliran (pergantian giliran gaya Gemini).
- Perbaikan pengurutan giliran Google (tambahkan bootstrap pengguna kecil jika riwayat dimulai dengan asisten).
- Antigravity Claude: normalkan tanda tangan thinking; buang blok thinking tanpa tanda tangan.

**Anthropic / Minimax (kompatibel Anthropic)**

- Perbaikan pemasangan hasil tool dan hasil tool sintetis.
- Validasi giliran (gabungkan giliran pengguna berurutan untuk memenuhi pergantian ketat).
- Giliran prefill asisten di akhir dihapus dari payload Anthropic Messages
  keluar ketika thinking diaktifkan, termasuk rute Cloudflare AI Gateway.
- Blok thinking dengan tanda tangan replay yang hilang, kosong, atau kosong putih dihapus
  sebelum konversi penyedia. Jika itu mengosongkan giliran asisten, OpenClaw mempertahankan
  bentuk giliran dengan teks reasoning-yang-dihilangkan yang tidak kosong.
- Giliran asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan
  teks reasoning-yang-dihilangkan yang tidak kosong agar adapter penyedia tidak membuang giliran
  replay.

**Amazon Bedrock (Converse API)**

- Giliran error stream asisten kosong diperbaiki menjadi blok teks fallback yang tidak kosong
  sebelum replay. Bedrock Converse menolak pesan asisten dengan `content: []`, sehingga
  giliran asisten tersimpan dengan `stopReason: "error"` dan konten kosong juga
  diperbaiki di disk sebelum dimuat.
- Giliran error stream asisten yang hanya berisi blok teks kosong dibuang
  dari salinan replay dalam memori alih-alih mereplay blok kosong yang tidak valid.
- Blok thinking Claude dengan tanda tangan replay yang hilang, kosong, atau kosong putih
  dihapus sebelum replay Converse. Jika itu mengosongkan giliran asisten, OpenClaw
  mempertahankan bentuk giliran dengan teks reasoning-yang-dihilangkan yang tidak kosong.
- Giliran asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan
  teks reasoning-yang-dihilangkan yang tidak kosong agar replay Converse mempertahankan bentuk giliran yang ketat.
- Replay memfilter giliran asisten cermin-pengiriman OpenClaw dan yang diinjeksi gateway.
- Sanitasi gambar diterapkan melalui aturan global.

**Mistral (termasuk deteksi berbasis model-id)**

- Sanitasi id pemanggilan tool: strict9 (alfanumerik panjang 9).

**OpenRouter Gemini**

- Pembersihan tanda tangan pikiran: hapus nilai `thought_signature` non-base64 (pertahankan base64).

**OpenRouter Anthropic**

- Giliran prefill asisten di akhir dihapus dari payload model Anthropic
  kompatibel OpenAI OpenRouter yang terverifikasi ketika reasoning diaktifkan, sesuai
  dengan perilaku replay Anthropic langsung dan Cloudflare Anthropic.

**Yang lainnya**

- Hanya sanitasi gambar.

---

## Perilaku historis (pra-2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapis kebersihan transkrip:

- **Plugin transcript-sanitize** berjalan pada setiap pembangunan konteks dan dapat:
  - Memperbaiki pemasangan penggunaan/hasil tool.
  - Menyantitasi id pemanggilan tool (termasuk mode tidak ketat yang mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus penyedia, yang menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan penyedia, termasuk:
  - Menghapus tag `<final>` dari teks asisten sebelum persistensi.
  - Membuang giliran error asisten kosong.
  - Memangkas konten asisten setelah pemanggilan tool.

Kompleksitas ini menyebabkan regresi lintas penyedia (terutama pemasangan
`call_id|fc_id` `openai-responses`). Pembersihan 2026.1.22 menghapus Plugin, memusatkan
logika di runner, dan membuat OpenAI **tanpa-sentuh** selain sanitasi gambar.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
