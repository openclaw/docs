---
read_when:
    - Anda sedang men-debug penolakan permintaan provider yang terkait dengan bentuk transkrip
    - Anda sedang mengubah sanitasi transkrip atau logika perbaikan tool-call
    - Anda sedang menyelidiki ketidakcocokan ID tool-call antar provider
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus provider'
title: Higiene Transkrip
x-i18n:
    generated_at: "2026-04-05T14:05:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 217afafb693cf89651e8fa361252f7b5c197feb98d20be4697a83e6dedc0ec3f
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Higiene Transkrip (Perbaikan Provider)

Dokumen ini menjelaskan **perbaikan khusus provider** yang diterapkan pada transkrip sebelum eksekusi
(membangun konteks model). Ini adalah penyesuaian **di dalam memori** yang digunakan untuk memenuhi
persyaratan provider yang ketat. Langkah higiene ini **tidak** menulis ulang transkrip JSONL yang disimpan
di disk; namun, pass perbaikan file sesi yang terpisah dapat menulis ulang file JSONL yang tidak valid
dengan membuang baris yang tidak valid sebelum sesi dimuat. Saat perbaikan terjadi, file asli
dicadangkan di samping file sesi.

Cakupannya meliputi:

- Sanitasi ID tool call
- Validasi input tool call
- Perbaikan pemasangan hasil tool
- Validasi / pengurutan giliran
- Pembersihan signature thought
- Sanitasi payload gambar
- Penandaan provenance input pengguna (untuk prompt yang dirutekan antar sesi)

Jika Anda memerlukan detail penyimpanan transkrip, lihat:

- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## Tempat ini berjalan

Semua higiene transkrip dipusatkan di embedded runner:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
- Penerapan sanitasi/perbaikan: `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/google.ts`

Kebijakan ini menggunakan `provider`, `modelApi`, dan `modelId` untuk memutuskan apa yang diterapkan.

Terpisah dari higiene transkrip, file sesi diperbaiki (jika diperlukan) sebelum dimuat:

- `repairSessionFileIfNeeded` di `src/agents/session-file-repair.ts`
- Dipanggil dari `run/attempt.ts` dan `compact.ts` (embedded runner)

---

## Aturan global: sanitasi gambar

Payload gambar selalu disanitasi untuk mencegah penolakan di sisi provider karena batas
ukuran (perkecil/kompres ulang gambar base64 yang terlalu besar).

Ini juga membantu mengendalikan tekanan token yang didorong oleh gambar untuk model yang mendukung vision.
Dimensi maksimum yang lebih rendah umumnya mengurangi penggunaan token; dimensi yang lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi maksimum gambar dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx` (default: `1200`).

---

## Aturan global: tool call yang malformed

Blok tool-call asisten yang tidak memiliki `input` maupun `arguments` dibuang
sebelum konteks model dibangun. Ini mencegah penolakan provider dari tool call
yang tersimpan sebagian (misalnya, setelah kegagalan rate limit).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan di `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/google.ts`

---

## Aturan global: provenance input antar sesi

Saat agen mengirim prompt ke sesi lain melalui `sessions_send` (termasuk
langkah reply/announce agen-ke-agen), OpenClaw menyimpan giliran pengguna yang dibuat dengan:

- `message.provenance.kind = "inter_session"`

Metadata ini ditulis pada saat append transkrip dan tidak mengubah role
(`role: "user"` tetap untuk kompatibilitas provider). Pembaca transkrip dapat menggunakan
ini untuk menghindari menganggap prompt internal yang dirutekan sebagai instruksi yang ditulis pengguna akhir.

Selama pembangunan ulang konteks, OpenClaw juga menambahkan marker singkat `[Inter-session message]`
di awal giliran pengguna tersebut di dalam memori agar model dapat membedakannya dari
instruksi pengguna akhir eksternal.

---

## Matriks provider (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Buang reasoning signature yatim piatu (item reasoning mandiri tanpa blok content berikutnya) untuk transkrip OpenAI Responses/Codex.
- Tidak ada sanitasi ID tool call.
- Tidak ada perbaikan pemasangan hasil tool.
- Tidak ada validasi atau pengurutan ulang giliran.
- Tidak ada hasil tool sintetis.
- Tidak ada penghapusan thought signature.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi ID tool call: alfanumerik ketat.
- Perbaikan pemasangan hasil tool dan hasil tool sintetis.
- Validasi giliran (pergantian giliran gaya Gemini).
- Perbaikan pengurutan giliran Google (tambahkan bootstrap pengguna kecil jika riwayat dimulai dengan asisten).
- Antigravity Claude: normalkan thinking signature; buang blok thinking tanpa signature.

**Anthropic / Minimax (kompatibel Anthropic)**

- Perbaikan pemasangan hasil tool dan hasil tool sintetis.
- Validasi giliran (gabungkan giliran pengguna yang berurutan untuk memenuhi pergantian yang ketat).

**Mistral (termasuk deteksi berbasis model-id)**

- Sanitasi ID tool call: strict9 (alfanumerik panjang 9).

**OpenRouter Gemini**

- Pembersihan thought signature: hapus nilai `thought_signature` yang bukan base64 (pertahankan yang base64).

**Semua yang lain**

- Hanya sanitasi gambar.

---

## Perilaku historis (sebelum 2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapisan higiene transkrip:

- Sebuah **ekstensi transcript-sanitize** berjalan pada setiap pembangunan konteks dan dapat:
  - Memperbaiki pemasangan penggunaan/hasil tool.
  - Menyanitasi ID tool call (termasuk mode non-ketat yang mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus provider, yang menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan provider, termasuk:
  - Menghapus tag `<final>` dari teks asisten sebelum penyimpanan.
  - Membuang giliran error asisten yang kosong.
  - Memangkas content asisten setelah tool call.

Kompleksitas ini menyebabkan regresi lintas provider (terutama pemasangan `openai-responses`
`call_id|fc_id`). Pembersihan 2026.1.22 menghapus ekstensi tersebut, memusatkan
logika di runner, dan menjadikan OpenAI **tanpa sentuhan** di luar sanitasi gambar.
