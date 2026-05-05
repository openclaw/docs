---
read_when:
    - Anda sedang men-debug penolakan permintaan penyedia yang terkait dengan bentuk transkrip
    - Anda sedang mengubah sanitasi transkrip atau logika perbaikan panggilan alat
    - Anda sedang menyelidiki ketidakcocokan ID pemanggilan alat di berbagai penyedia
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus penyedia'
title: Kebersihan transkrip
x-i18n:
    generated_at: "2026-05-05T01:49:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw menerapkan **perbaikan khusus penyedia** pada transkrip sebelum sebuah run (membangun konteks model). Sebagian besar adalah penyesuaian **dalam memori** yang digunakan untuk memenuhi persyaratan penyedia yang ketat. Pass perbaikan file sesi terpisah juga dapat menulis ulang JSONL yang tersimpan sebelum sesi dimuat, tetapi hanya untuk baris yang cacat atau turn tersimpan yang merupakan rekaman tahan lama yang tidak valid. Balasan asisten yang terkirim dipertahankan di disk; penghapusan prefill asisten khusus penyedia hanya terjadi saat membangun payload keluar. Saat perbaikan terjadi, file asli dicadangkan di samping file sesi.

Cakupan meliputi:

- Konteks prompt hanya-runtime yang tetap berada di luar turn transkrip yang terlihat oleh pengguna
- Sanitasi id panggilan alat
- Validasi input panggilan alat
- Perbaikan pemasangan hasil alat
- Validasi / pengurutan turn
- Pembersihan tanda tangan thought
- Pembersihan tanda tangan thinking
- Sanitasi payload gambar
- Pembersihan blok teks kosong sebelum replay penyedia
- Penandaan asal input pengguna (untuk prompt yang dirutekan antarsesi)
- Perbaikan turn error asisten kosong untuk replay Bedrock Converse

Jika Anda membutuhkan detail penyimpanan transkrip, lihat:

- [Pendalaman manajemen sesi](/id/reference/session-management-compaction)

---

## Aturan global: konteks runtime bukan transkrip pengguna

Konteks runtime/sistem dapat ditambahkan ke prompt model untuk sebuah turn, tetapi itu
bukan konten yang dibuat oleh pengguna akhir. OpenClaw mempertahankan badan prompt
terpisah yang menghadap transkrip untuk balasan Gateway, followup antrean, ACP, CLI, dan run Pi
tertanam. Turn pengguna terlihat yang tersimpan menggunakan badan transkrip itu, bukan
prompt yang diperkaya runtime.

Untuk sesi lama yang sudah menyimpan wrapper runtime, permukaan riwayat Gateway
menerapkan proyeksi tampilan sebelum mengembalikan pesan ke klien WebChat,
TUI, REST, atau SSE.

---

## Tempat ini berjalan

Semua kebersihan transkrip dipusatkan di runner tertanam:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
- Aplikasi sanitasi/perbaikan: `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

Kebijakan menggunakan `provider`, `modelApi`, dan `modelId` untuk memutuskan apa yang diterapkan.

Terpisah dari kebersihan transkrip, file sesi diperbaiki (jika diperlukan) sebelum dimuat:

- `repairSessionFileIfNeeded` di `src/agents/session-file-repair.ts`
- Dipanggil dari `run/attempt.ts` dan `compact.ts` (runner tertanam)

---

## Aturan global: sanitasi gambar

Payload gambar selalu disanitasi untuk mencegah penolakan di sisi penyedia akibat batas
ukuran (downscale/recompress gambar base64 yang terlalu besar).

Ini juga membantu mengendalikan tekanan token yang dipicu gambar untuk model berkemampuan vision.
Dimensi maksimum yang lebih rendah umumnya mengurangi penggunaan token; dimensi yang lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi gambar maksimum dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx` (default: `1200`).
- Blok teks kosong dihapus saat pass ini menelusuri konten replay. Turn asisten
  yang menjadi kosong dihapus dari salinan replay; turn pengguna dan hasil alat
  yang menjadi kosong menerima placeholder konten-yang-dihilangkan yang tidak kosong.

---

## Aturan global: panggilan alat cacat

Blok panggilan alat asisten yang tidak memiliki `input` maupun `arguments` dihapus
sebelum konteks model dibangun. Ini mencegah penolakan penyedia dari panggilan alat yang
tersimpan sebagian (misalnya, setelah kegagalan batas laju).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan di `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

---

## Aturan global: asal input antarsesi

Saat agen mengirim prompt ke sesi lain melalui `sessions_send` (termasuk
langkah balasan/pengumuman agen-ke-agen), OpenClaw menyimpan turn pengguna yang dibuat dengan:

- `message.provenance.kind = "inter_session"`

OpenClaw juga menambahkan marker `[Inter-session message ... isUser=false]`
pada turn yang sama sebelum teks prompt yang dirutekan sehingga panggilan model aktif dapat membedakan
output sesi asing dari instruksi pengguna akhir eksternal. Marker ini mencakup
sesi sumber, kanal, dan alat jika tersedia. Transkrip tetap menggunakan
`role: "user"` untuk kompatibilitas penyedia, tetapi teks terlihat dan metadata
asal sama-sama menandai turn sebagai data antarsesi.

Selama pembangunan ulang konteks, OpenClaw menerapkan marker yang sama pada turn pengguna
antarsesi lama yang tersimpan dan hanya memiliki metadata asal.

---

## Matriks penyedia (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Hapus tanda tangan reasoning yatim (item reasoning mandiri tanpa blok konten berikutnya) untuk transkrip OpenAI Responses/Codex, dan hapus reasoning OpenAI yang dapat direplay setelah pergantian rute model.
- Pertahankan payload item reasoning OpenAI Responses yang dapat direplay, termasuk item ringkasan-kosong terenkripsi, agar replay manual/WebSocket tetap menjaga status `rs_*` yang diperlukan berpasangan dengan item output asisten.
- Native ChatGPT Codex Responses mengikuti paritas wire Codex dengan mereplay payload reasoning/message/function Responses sebelumnya tanpa ID item sebelumnya sambil mempertahankan `prompt_cache_key` sesi.
- Tidak ada sanitasi id panggilan alat.
- Perbaikan pemasangan hasil alat dapat memindahkan output nyata yang cocok dan menyintesis output bergaya Codex `aborted` untuk panggilan alat yang hilang.
- Tidak ada validasi atau pengurutan ulang turn.
- Output alat keluarga OpenAI Responses yang hilang disintesis sebagai `aborted` agar sesuai dengan normalisasi replay Codex.
- Tidak ada penghapusan tanda tangan thought.

**Gemma 4 kompatibel OpenAI**

- Blok thinking/reasoning asisten historis dihapus sebelum replay agar server Gemma 4
  lokal yang kompatibel OpenAI tidak menerima konten reasoning turn sebelumnya.
- Kelanjutan panggilan alat pada turn yang sama saat ini mempertahankan blok reasoning asisten
  yang melekat pada panggilan alat sampai hasil alat telah direplay.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi id panggilan alat: alfanumerik ketat.
- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi turn (alternasi turn bergaya Gemini).
- Perbaikan pengurutan turn Google (menambahkan bootstrap pengguna kecil jika riwayat dimulai dengan asisten).
- Antigravity Claude: normalkan tanda tangan thinking; hapus blok thinking yang tidak bertanda tangan.

**Anthropic / Minimax (kompatibel Anthropic)**

- Perbaikan pemasangan hasil alat dan hasil alat sintetis.
- Validasi turn (gabungkan turn pengguna berurutan untuk memenuhi alternasi ketat).
- Turn prefill asisten di akhir dihapus dari payload Anthropic Messages
  keluar saat thinking diaktifkan, termasuk rute Cloudflare AI Gateway.
- Blok thinking dengan tanda tangan replay yang hilang, kosong, atau blank dihapus
  sebelum konversi penyedia. Jika itu mengosongkan turn asisten, OpenClaw mempertahankan
  bentuk turn dengan teks reasoning-yang-dihilangkan yang tidak kosong.
- Turn asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan
  teks reasoning-yang-dihilangkan yang tidak kosong agar adapter penyedia tidak menghapus turn
  replay.

**Amazon Bedrock (Converse API)**

- Turn error-stream asisten kosong diperbaiki menjadi blok teks fallback yang tidak kosong
  sebelum replay. Bedrock Converse menolak pesan asisten dengan `content: []`, sehingga
  turn asisten tersimpan dengan `stopReason: "error"` dan konten kosong juga
  diperbaiki di disk sebelum dimuat.
- Turn error-stream asisten yang hanya berisi blok teks kosong dihapus
  dari salinan replay dalam memori alih-alih mereplay blok kosong yang tidak valid.
- Blok thinking Claude dengan tanda tangan replay yang hilang, kosong, atau blank
  dihapus sebelum replay Converse. Jika itu mengosongkan turn asisten, OpenClaw
  mempertahankan bentuk turn dengan teks reasoning-yang-dihilangkan yang tidak kosong.
- Turn asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan
  teks reasoning-yang-dihilangkan yang tidak kosong agar replay Converse menjaga bentuk turn yang ketat.
- Replay memfilter turn asisten delivery-mirror OpenClaw dan yang diinjeksi gateway.
- Sanitasi gambar berlaku melalui aturan global.

**Mistral (termasuk deteksi berbasis model-id)**

- Sanitasi id panggilan alat: strict9 (alfanumerik panjang 9).

**OpenRouter Gemini**

- Pembersihan tanda tangan thought: hapus nilai `thought_signature` non-base64 (pertahankan base64).

**OpenRouter Anthropic**

- Turn prefill asisten di akhir dihapus dari payload model Anthropic kompatibel OpenAI
  OpenRouter terverifikasi saat reasoning diaktifkan, sesuai dengan
  perilaku replay Anthropic langsung dan Cloudflare Anthropic.

**Semua lainnya**

- Hanya sanitasi gambar.

---

## Perilaku historis (pra-2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapisan kebersihan transkrip:

- **Plugin transcript-sanitize** berjalan pada setiap pembangunan konteks dan dapat:
  - Memperbaiki pemasangan penggunaan/hasil alat.
  - Menyantitasi id panggilan alat (termasuk mode tidak ketat yang mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus penyedia, yang menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan penyedia, termasuk:
  - Menghapus tag `<final>` dari teks asisten sebelum persistensi.
  - Menghapus turn error asisten kosong.
  - Memangkas konten asisten setelah panggilan alat.

Kompleksitas ini menyebabkan regresi lintas penyedia (terutama pemasangan `openai-responses`
`call_id|fc_id`). Pembersihan 2026.1.22 menghapus Plugin tersebut, memusatkan
logika di runner, dan menjadikan OpenAI **tanpa-sentuh** di luar sanitasi gambar.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
