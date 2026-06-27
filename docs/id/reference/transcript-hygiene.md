---
read_when:
    - Anda sedang men-debug penolakan permintaan penyedia yang terkait dengan bentuk transkrip
    - Anda mengubah sanitasi transkrip atau logika perbaikan pemanggilan tool
    - Anda sedang menyelidiki ketidakcocokan id pemanggilan alat di berbagai provider
summary: 'Referensi: aturan sanitasi transkrip dan perbaikan khusus penyedia'
title: Kebersihan transkrip
x-i18n:
    generated_at: "2026-06-27T18:12:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw menerapkan **perbaikan khusus provider** ke transkrip sebelum sebuah run (membangun konteks model). Sebagian besar adalah penyesuaian **dalam memori** yang digunakan untuk memenuhi persyaratan provider yang ketat. Pass perbaikan file sesi terpisah juga dapat menulis ulang JSONL tersimpan sebelum sesi dimuat, tetapi hanya untuk baris yang cacat atau turn tersimpan yang merupakan record tahan lama yang tidak valid. Balasan assistant yang telah dikirim dipertahankan di disk; penghapusan assistant-prefill khusus provider hanya terjadi saat menyusun payload keluar. Ketika perbaikan terjadi, file asli ditulis ke sibling sementara `*.bak-<pid>-<ts>` sebelum penggantian atomik dan dihapus setelah penggantian berhasil; backup hanya dipertahankan jika cleanup itu sendiri gagal (dalam hal ini path dilaporkan kembali).

Cakupan meliputi:

- Konteks prompt khusus runtime yang tetap berada di luar turn transkrip yang terlihat oleh pengguna
- Sanitasi id tool call
- Validasi input tool call
- Perbaikan pemasangan hasil tool
- Validasi / pengurutan turn
- Cleanup tanda tangan thought
- Cleanup tanda tangan thinking
- Sanitasi payload gambar
- Cleanup blok teks kosong sebelum replay provider
- Cleanup turn panjang khusus reasoning yang tidak lengkap sebelum replay provider
- Penandaan asal input pengguna (untuk prompt yang dirutekan antar-sesi)
- Perbaikan turn error assistant kosong untuk replay Bedrock Converse

Jika Anda membutuhkan detail penyimpanan transkrip, lihat:

- [Pendalaman manajemen sesi](/id/reference/session-management-compaction)

---

## Aturan global: konteks runtime bukan transkrip pengguna

Konteks runtime/sistem dapat ditambahkan ke prompt model untuk sebuah turn, tetapi itu
bukan konten yang ditulis oleh pengguna akhir. OpenClaw mempertahankan body prompt
terpisah yang menghadap transkrip untuk balasan Gateway, followup yang diantrekan, ACP, CLI, dan run OpenClaw
tertanam. Turn pengguna terlihat yang tersimpan menggunakan body transkrip tersebut, bukan
prompt yang diperkaya runtime.

Untuk sesi lama yang sudah menyimpan wrapper runtime, permukaan riwayat Gateway
menerapkan proyeksi tampilan sebelum mengembalikan pesan ke klien WebChat,
TUI, REST, atau SSE.

---

## Tempat ini berjalan

Semua hygiene transkrip dipusatkan di runner tertanam:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
- Penerapan sanitasi/perbaikan: `sanitizeSessionHistory` di `src/agents/embedded-agent-runner/replay-history.ts`

Kebijakan menggunakan `provider`, `modelApi`, dan `modelId` untuk memutuskan apa yang diterapkan.

Terpisah dari hygiene transkrip, file sesi diperbaiki (jika diperlukan) sebelum dimuat:

- `repairSessionFileIfNeeded` di `src/agents/session-file-repair.ts`
- Dipanggil dari `run/attempt.ts` dan `compact.ts` (runner tertanam)

---

## Aturan global: sanitasi gambar

Payload gambar selalu disanitasi untuk mencegah penolakan di sisi provider karena batas
ukuran (downscale/recompress gambar base64 yang terlalu besar).

Ini juga membantu mengendalikan tekanan token yang dipicu gambar untuk model yang mendukung vision.
Dimensi maksimum yang lebih rendah umumnya mengurangi penggunaan token; dimensi yang lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi gambar maksimum dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx` (default: `1200`).
- Blok teks kosong dihapus saat pass ini menelusuri konten replay. Turn assistant
  yang menjadi kosong dihapus dari salinan replay; turn pengguna dan hasil tool
  yang menjadi kosong menerima placeholder konten yang dihilangkan yang tidak kosong.

---

## Aturan global: tool call cacat

Blok tool-call assistant yang tidak memiliki `input` maupun `arguments` dihapus
sebelum konteks model dibangun. Ini mencegah penolakan provider dari tool call yang
tersimpan sebagian (misalnya, setelah kegagalan rate limit).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan di `sanitizeSessionHistory` di `src/agents/embedded-agent-runner/replay-history.ts`

---

## Aturan global: turn khusus reasoning yang tidak lengkap

Turn assistant yang mencapai batas output provider hanya dengan konten thinking atau
redacted-thinking dihilangkan dari salinan replay dalam memori. Turn seperti itu
berisi state provider yang tidak lengkap dan dapat membawa tanda tangan thinking parsial.

Turn panjang kosong tetap tidak berubah, begitu pula turn panjang dengan teks terlihat, tool
call, atau blok konten yang tidak dikenal. Transkrip tersimpan tidak ditulis ulang.

Implementasi:

- `normalizeAssistantReplayContent` di `src/agents/embedded-agent-runner/replay-history.ts`

---

## Aturan global: asal input antar-sesi

Ketika agent mengirim prompt ke sesi lain melalui `sessions_send` (termasuk
langkah balas/umumkan agent-ke-agent), OpenClaw menyimpan turn pengguna yang dibuat dengan:

- `message.provenance.kind = "inter_session"`

OpenClaw juga menambahkan marker `[Inter-session message ... isUser=false]`
pada turn yang sama sebelum teks prompt yang dirutekan, sehingga pemanggilan model aktif dapat membedakan
output sesi asing dari instruksi pengguna akhir eksternal. Marker ini menyertakan
sesi sumber, channel, dan tool jika tersedia. Transkrip tetap menggunakan
`role: "user"` untuk kompatibilitas provider, tetapi teks terlihat dan metadata
asal sama-sama menandai turn tersebut sebagai data antar-sesi.

Selama pembangunan ulang konteks, OpenClaw menerapkan marker yang sama ke turn pengguna
antar-sesi lama yang tersimpan yang hanya memiliki metadata asal.

---

## Matriks provider (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Hapus tanda tangan reasoning yatim (item reasoning mandiri tanpa blok konten berikutnya) untuk transkrip OpenAI Responses/Codex, dan hapus reasoning OpenAI yang dapat diputar ulang setelah perpindahan rute model.
- Pertahankan payload item reasoning OpenAI Responses yang dapat diputar ulang, termasuk item ringkasan kosong terenkripsi, sehingga replay manual/WebSocket mempertahankan state `rs_*` yang diperlukan tetap berpasangan dengan item output assistant.
- Native ChatGPT Codex Responses mengikuti paritas wire Codex dengan memutar ulang payload reasoning/message/function Responses sebelumnya tanpa ID item sebelumnya sambil mempertahankan `prompt_cache_key` sesi.
- Replay keluarga OpenAI Responses mempertahankan pasangan reasoning model-sama kanonis `call_*|fc_*`, tetapi secara deterministik menormalkan `call_id` / id item function-call yang cacat atau terlalu panjang sebelum konversi payload pi-ai.
- Perbaikan pemasangan hasil tool dapat memindahkan output cocok yang sebenarnya dan mensintesis output `aborted` gaya Codex untuk tool call yang hilang.
- Tidak ada validasi atau pengurutan ulang turn.
- Output tool keluarga OpenAI Responses yang hilang disintesis sebagai `aborted` agar cocok dengan normalisasi replay Codex.
- Tidak ada penghapusan tanda tangan thought.

**Chat Completions yang kompatibel dengan OpenAI**

- Blok thinking/reasoning assistant historis dihapus sebelum replay sehingga
  server lokal dan proxy-style yang kompatibel dengan OpenAI tidak menerima field reasoning
  turn sebelumnya seperti `reasoning` atau `reasoning_content`.
- Kelanjutan tool-call turn-sama saat ini mempertahankan blok reasoning assistant
  yang terpasang ke tool call sampai hasil tool telah diputar ulang.
- Entri model kustom/self-hosted dengan `reasoning: true` mempertahankan
  metadata reasoning yang diputar ulang.
- Pengecualian milik provider dapat memilih keluar saat protokol wire mereka membutuhkan
  metadata reasoning yang diputar ulang.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi id tool call: alfanumerik ketat.
- Perbaikan pemasangan hasil tool dan hasil tool sintetis.
- Validasi turn (alternasi turn gaya Gemini).
- Fixup pengurutan turn Google (tambahkan bootstrap pengguna kecil jika riwayat dimulai dengan assistant).
- Antigravity Claude: normalkan tanda tangan thinking; hapus blok thinking tanpa tanda tangan.

**Anthropic / Minimax (kompatibel dengan Anthropic)**

- Perbaikan pemasangan hasil tool dan hasil tool sintetis.
- Validasi turn (gabungkan turn pengguna berurutan untuk memenuhi alternasi ketat).
- Turn prefill assistant di akhir dihapus dari payload Anthropic Messages
  keluar ketika thinking diaktifkan, termasuk rute Cloudflare AI Gateway.
- Tanda tangan thinking assistant pra-Compaction dihapus sebelum replay provider
  ketika sesi telah di-compact. Tanda tangan thinking terikat secara kriptografis
  ke prefiks percakapan pada waktu pembuatan; setelah Compaction, prefiks berubah
  (konten yang diringkas diganti oleh ringkasan Compaction), sehingga memutar ulang
  tanda tangan asli menyebabkan Anthropic menolak request dengan "Invalid signature in thinking block".
  Teks thinking dipertahankan sebagai blok tanpa tanda tangan dan kemudian ditangani oleh aturan di bawah.
- Blok thinking dengan tanda tangan replay yang hilang, kosong, atau blank dihapus
  sebelum konversi provider. Jika itu mengosongkan turn assistant, OpenClaw mempertahankan
  bentuk turn dengan teks omitted-reasoning yang tidak kosong.
- Turn assistant thinking-only lama yang harus dihapus diganti dengan
  teks omitted-reasoning yang tidak kosong sehingga adapter provider tidak menghapus turn
  replay.

**Amazon Bedrock (Converse API)**

- Turn stream-error assistant kosong diperbaiki menjadi blok teks fallback yang tidak kosong
  sebelum replay. Bedrock Converse menolak pesan assistant dengan `content: []`, sehingga
  turn assistant tersimpan dengan `stopReason: "error"` dan konten kosong juga
  diperbaiki di disk sebelum dimuat.
- Turn stream-error assistant yang hanya berisi blok teks blank dihapus
  dari salinan replay dalam memori alih-alih memutar ulang blok blank yang tidak valid.
- Tanda tangan thinking assistant pra-Compaction dihapus sebelum replay Converse
  ketika sesi telah di-compact, karena alasan yang sama seperti Anthropic
  di atas.
- Blok thinking Claude dengan tanda tangan replay yang hilang, kosong, atau blank
  dihapus sebelum replay Converse. Jika itu mengosongkan turn assistant, OpenClaw
  mempertahankan bentuk turn dengan teks omitted-reasoning yang tidak kosong.
- Turn assistant thinking-only lama yang harus dihapus diganti dengan
  teks omitted-reasoning yang tidak kosong sehingga replay Converse mempertahankan bentuk turn yang ketat.
- Replay memfilter turn assistant delivery-mirror OpenClaw dan yang diinjeksi gateway.
- Sanitasi gambar berlaku melalui aturan global.

**Mistral (termasuk deteksi berbasis model-id)**

- Sanitasi id tool call: strict9 (alfanumerik panjang 9).

**OpenRouter Gemini**

- Cleanup tanda tangan thought: hapus nilai `thought_signature` non-base64 (pertahankan base64).

**OpenRouter Anthropic**

- Turn prefill assistant di akhir dihapus dari payload model Anthropic
  terverifikasi OpenRouter yang kompatibel dengan OpenAI ketika reasoning diaktifkan, mencocokkan
  perilaku replay Anthropic langsung dan Cloudflare Anthropic.

**Lainnya**

- Hanya sanitasi gambar.

---

## Perilaku historis (pra-2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapisan hygiene transkrip:

- Sebuah **ekstensi transcript-sanitize** berjalan pada setiap pembangunan konteks dan dapat:
  - Memperbaiki pemasangan tool use/result.
  - Menyantitasi id tool call (termasuk mode non-ketat yang mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus provider, yang menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan provider, termasuk:
  - Menghapus tag `<final>` dari teks assistant sebelum persistensi.
  - Menghapus turn error assistant kosong.
  - Memangkas konten assistant setelah tool call.

Kompleksitas ini menyebabkan regresi lintas-provider (terutama pemasangan `call_id|fc_id`
`openai-responses`). Cleanup 2026.1.22 menghapus ekstensi, memusatkan
logika di runner, dan membuat OpenAI **tanpa sentuhan** di luar sanitasi gambar.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
