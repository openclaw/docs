---
read_when:
    - Anda sedang men-debug penolakan permintaan provider yang terkait dengan bentuk transkrip
    - Anda sedang mengubah sanitasi transkrip atau logika perbaikan tool-call
    - Anda sedang menyelidiki ketidakcocokan id tool-call di berbagai provider
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus provider'
title: Kebersihan transkrip
x-i18n:
    generated_at: "2026-04-26T11:38:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e380be2b011afca5fedf89579e702c6d221d42e777c23bd766c8df07ff05ed18
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Dokumen ini menjelaskan **perbaikan khusus provider** yang diterapkan pada transkrip sebelum eksekusi
(membangun konteks model). Sebagian besar dari ini adalah penyesuaian **in-memory** yang digunakan untuk memenuhi
persyaratan provider yang ketat. Pass perbaikan file sesi yang terpisah juga dapat menulis ulang
JSONL yang tersimpan sebelum sesi dimuat, baik dengan membuang baris JSONL yang malformed atau
dengan memperbaiki giliran yang disimpan yang valid secara sintaksis tetapi diketahui akan ditolak oleh
provider saat replay. Ketika perbaikan terjadi, file asli dibackup di samping file sesi.

Cakupan mencakup:

- Konteks prompt khusus runtime yang tidak masuk ke giliran transkrip yang terlihat pengguna
- Sanitasi id tool call
- Validasi input tool call
- Perbaikan pairing hasil tool
- Validasi / pengurutan giliran
- Pembersihan signature thought
- Pembersihan signature thinking
- Sanitasi payload gambar
- Penandaan provenance input pengguna (untuk prompt yang dirutekan antarsesi)
- Perbaikan giliran error asisten kosong untuk replay Bedrock Converse

Jika Anda memerlukan detail penyimpanan transkrip, lihat:

- [Pendalaman manajemen sesi](/id/reference/session-management-compaction)

---

## Aturan global: konteks runtime bukan transkrip pengguna

Konteks runtime/system dapat ditambahkan ke prompt model untuk suatu giliran, tetapi itu
bukan konten yang ditulis pengguna akhir. OpenClaw menyimpan isi prompt terpisah yang menghadap transkrip untuk balasan Gateway, tindak lanjut yang diantrikan, ACP, CLI, dan eksekusi Pi
tertanam. Giliran pengguna yang terlihat dan disimpan menggunakan isi transkrip tersebut alih-alih
prompt yang diperkaya runtime.

Untuk sesi lama yang sudah menyimpan wrapper runtime, surface riwayat Gateway
menerapkan proyeksi tampilan sebelum mengembalikan pesan ke klien WebChat,
TUI, REST, atau SSE.

---

## Di mana ini berjalan

Semua kebersihan transkrip dipusatkan di runner tertanam:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
- Penerapan sanitasi/perbaikan: `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

Kebijakan menggunakan `provider`, `modelApi`, dan `modelId` untuk memutuskan apa yang diterapkan.

Terpisah dari kebersihan transkrip, file sesi diperbaiki (jika perlu) sebelum dimuat:

- `repairSessionFileIfNeeded` di `src/agents/session-file-repair.ts`
- Dipanggil dari `run/attempt.ts` dan `compact.ts` (runner tertanam)

---

## Aturan global: sanitasi gambar

Payload gambar selalu disanitasi untuk mencegah penolakan sisi provider karena batas
ukuran (downscale/recompress gambar base64 yang terlalu besar).

Ini juga membantu mengendalikan tekanan token yang dipicu gambar untuk model yang mampu menangani vision.
Dimensi maksimum yang lebih rendah umumnya mengurangi penggunaan token; dimensi yang lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi gambar maksimum dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx` (default: `1200`).

---

## Aturan global: tool call malformed

Blok tool-call asisten yang tidak memiliki `input` maupun `arguments` akan dibuang
sebelum konteks model dibangun. Ini mencegah penolakan provider dari tool call yang disimpan secara parsial (misalnya, setelah kegagalan rate limit).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan dalam `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

---

## Aturan global: provenance input antarsesi

Saat agen mengirim prompt ke sesi lain melalui `sessions_send` (termasuk
langkah reply/announce antaragen), OpenClaw menyimpan giliran pengguna yang dibuat dengan:

- `message.provenance.kind = "inter_session"`

Metadata ini ditulis saat append transkrip dan tidak mengubah role
(`role: "user"` tetap untuk kompatibilitas provider). Pembaca transkrip dapat menggunakan
ini untuk menghindari memperlakukan prompt internal yang dirutekan sebagai instruksi yang ditulis pengguna akhir.

Selama pembangunan ulang konteks, OpenClaw juga menambahkan marker singkat `[Inter-session message]`
ke giliran pengguna tersebut secara in-memory agar model dapat membedakannya dari
instruksi pengguna akhir eksternal.

---

## Matriks provider (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Buang reasoning signature yatim (item reasoning mandiri tanpa blok konten berikutnya) untuk transkrip OpenAI Responses/Codex, dan buang reasoning OpenAI yang dapat direplay setelah pergantian rute model.
- Tidak ada sanitasi id tool call.
- Perbaikan pairing hasil tool dapat memindahkan output nyata yang cocok dan mensintesis output `aborted` bergaya Codex untuk tool call yang hilang.
- Tidak ada validasi atau pengurutan ulang giliran.
- Output tool keluarga OpenAI Responses yang hilang disintesis sebagai `aborted` agar sesuai dengan normalisasi replay Codex.
- Tidak ada penghapusan thought signature.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi id tool call: alfanumerik ketat.
- Perbaikan pairing hasil tool dan hasil tool sintetis.
- Validasi giliran (pergantian giliran bergaya Gemini).
- Perbaikan pengurutan giliran Google (menambahkan bootstrap pengguna kecil jika riwayat dimulai dengan asisten).
- Antigravity Claude: normalisasi thinking signature; buang blok thinking tanpa signature.

**Anthropic / Minimax (kompatibel dengan Anthropic)**

- Perbaikan pairing hasil tool dan hasil tool sintetis.
- Validasi giliran (gabungkan giliran pengguna berurutan untuk memenuhi pergantian ketat).
- Blok thinking dengan replay signature yang hilang, kosong, atau blank dihapus
  sebelum konversi provider. Jika itu mengosongkan giliran asisten, OpenClaw mempertahankan
  bentuk giliran dengan teks non-empty omitted-reasoning.
- Giliran asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan
  teks non-empty omitted-reasoning agar adapter provider tidak membuang giliran replay.

**Amazon Bedrock (Converse API)**

- Giliran stream-error asisten kosong diperbaiki menjadi blok teks fallback non-empty
  sebelum replay. Bedrock Converse menolak pesan asisten dengan `content: []`, sehingga
  giliran asisten yang disimpan dengan `stopReason: "error"` dan konten kosong juga diperbaiki di disk sebelum dimuat.
- Blok thinking Claude dengan replay signature yang hilang, kosong, atau blank dihapus
  sebelum replay Converse. Jika itu mengosongkan giliran asisten, OpenClaw mempertahankan
  bentuk giliran dengan teks non-empty omitted-reasoning.
- Giliran asisten lama yang hanya berisi thinking dan harus dihapus diganti dengan
  teks non-empty omitted-reasoning sehingga replay Converse mempertahankan bentuk giliran yang ketat.
- Replay memfilter giliran asisten mirror-delivery OpenClaw dan yang disuntikkan gateway.
- Sanitasi gambar berlaku melalui aturan global.

**Mistral (termasuk deteksi berbasis model-id)**

- Sanitasi id tool call: strict9 (alfanumerik panjang 9).

**OpenRouter Gemini**

- Pembersihan thought signature: hapus nilai `thought_signature` yang bukan base64 (pertahankan yang base64).

**Semua yang lain**

- Hanya sanitasi gambar.

---

## Perilaku historis (pra-2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapisan kebersihan transkrip:

- Sebuah **ekstensi transcript-sanitize** berjalan pada setiap pembangunan konteks dan dapat:
  - Memperbaiki pairing tool use/result.
  - Menyanitasi id tool call (termasuk mode non-ketat yang mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus provider, yang menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan provider, termasuk:
  - Menghapus tag `<final>` dari teks asisten sebelum disimpan.
  - Membuang giliran error asisten kosong.
  - Memangkas konten asisten setelah tool call.

Kompleksitas ini menyebabkan regresi lintas-provider (terutama pairing `call_id|fc_id`
`openai-responses`). Pembersihan 2026.1.22 menghapus ekstensi tersebut, memusatkan
logika di runner, dan menjadikan OpenAI **tanpa sentuhan** selain sanitasi gambar.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
