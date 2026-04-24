---
read_when:
    - Anda sedang men-debug penolakan permintaan provider yang terkait dengan bentuk transkrip
    - Anda sedang mengubah logika sanitasi transkrip atau perbaikan tool-call
    - Anda sedang menyelidiki ketidakcocokan ID tool-call di berbagai provider
summary: 'Referensi: aturan sanitasi dan perbaikan transkrip khusus provider'
title: Kebersihan transkrip
x-i18n:
    generated_at: "2026-04-24T09:27:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c206186f2c4816775db0f2c4663f07f5a55831a8920d1d0261ff9998bd82efc0
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

# Kebersihan Transkrip (Perbaikan Khusus Provider)

Dokumen ini menjelaskan **perbaikan khusus provider** yang diterapkan pada transkrip sebelum sebuah eksekusi
(membangun konteks model). Ini adalah penyesuaian **dalam memori** yang digunakan untuk memenuhi
persyaratan provider yang ketat. Langkah kebersihan ini **tidak** menulis ulang transkrip JSONL yang tersimpan
di disk; namun, pass perbaikan file sesi yang terpisah dapat menulis ulang file JSONL yang malformed
dengan menghapus baris yang tidak valid sebelum sesi dimuat. Saat perbaikan terjadi, file asli
dicadangkan di samping file sesi.

Cakupan meliputi:

- Sanitasi ID tool call
- Validasi input tool call
- Perbaikan pasangan hasil alat
- Validasi / pengurutan giliran
- Pembersihan thought signature
- Sanitasi payload gambar
- Pemberian tag provenance input pengguna (untuk prompt yang dirutekan antar sesi)

Jika Anda memerlukan detail penyimpanan transkrip, lihat:

- [/reference/session-management-compaction](/id/reference/session-management-compaction)

---

## Tempat ini berjalan

Semua kebersihan transkrip dipusatkan di embedded runner:

- Pemilihan kebijakan: `src/agents/transcript-policy.ts`
- Penerapan sanitasi/perbaikan: `sanitizeSessionHistory` di `src/agents/pi-embedded-runner/replay-history.ts`

Kebijakan menggunakan `provider`, `modelApi`, dan `modelId` untuk memutuskan apa yang diterapkan.

Terpisah dari kebersihan transkrip, file sesi diperbaiki (jika perlu) sebelum dimuat:

- `repairSessionFileIfNeeded` di `src/agents/session-file-repair.ts`
- Dipanggil dari `run/attempt.ts` dan `compact.ts` (embedded runner)

---

## Aturan global: sanitasi gambar

Payload gambar selalu disanitasi untuk mencegah penolakan di sisi provider karena batas
ukuran (mengecilkan/mengompresi ulang gambar base64 yang terlalu besar).

Ini juga membantu mengendalikan tekanan token yang dipicu gambar untuk model yang mampu menangani vision.
Dimensi maksimum yang lebih rendah umumnya mengurangi penggunaan token; dimensi yang lebih tinggi mempertahankan detail.

Implementasi:

- `sanitizeSessionMessagesImages` di `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` di `src/agents/tool-images.ts`
- Sisi maksimum gambar dapat dikonfigurasi melalui `agents.defaults.imageMaxDimensionPx` (default: `1200`).

---

## Aturan global: tool call yang malformed

Blok tool-call asisten yang tidak memiliki `input` maupun `arguments` akan dihapus
sebelum konteks model dibangun. Ini mencegah penolakan provider akibat tool call
yang hanya tersimpan sebagian (misalnya setelah kegagalan rate limit).

Implementasi:

- `sanitizeToolCallInputs` di `src/agents/session-transcript-repair.ts`
- Diterapkan di `sanitizeSessionHistory` pada `src/agents/pi-embedded-runner/replay-history.ts`

---

## Aturan global: provenance input antar sesi

Saat agen mengirim prompt ke sesi lain melalui `sessions_send` (termasuk
langkah reply/announce antar agen), OpenClaw menyimpan giliran pengguna yang dibuat dengan:

- `message.provenance.kind = "inter_session"`

Metadata ini ditulis saat penambahan transkrip dan tidak mengubah role
(`role: "user"` tetap dipertahankan untuk kompatibilitas provider). Pembaca transkrip dapat menggunakan
ini agar tidak memperlakukan prompt internal yang dirutekan sebagai instruksi yang dibuat pengguna akhir.

Selama pembangunan ulang konteks, OpenClaw juga menambahkan marker pendek `[Inter-session message]`
ke awal giliran pengguna tersebut di dalam memori agar model dapat membedakannya dari
instruksi pengguna akhir eksternal.

---

## Matriks provider (perilaku saat ini)

**OpenAI / OpenAI Codex**

- Hanya sanitasi gambar.
- Hapus reasoning signature yatim (item reasoning mandiri tanpa blok konten setelahnya) untuk transkrip OpenAI Responses/Codex.
- Tidak ada sanitasi ID tool call.
- Tidak ada perbaikan pasangan hasil alat.
- Tidak ada validasi atau pengurutan ulang giliran.
- Tidak ada hasil alat sintetis.
- Tidak ada penghapusan thought signature.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitasi ID tool call: alfanumerik ketat.
- Perbaikan pasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (alternasi giliran gaya Gemini).
- Perbaikan pengurutan giliran Google (tambahkan bootstrap pengguna kecil jika riwayat dimulai dengan asisten).
- Antigravity Claude: normalkan thinking signature; hapus blok thinking tanpa signature.

**Anthropic / Minimax (kompatibel dengan Anthropic)**

- Perbaikan pasangan hasil alat dan hasil alat sintetis.
- Validasi giliran (gabungkan giliran pengguna yang berurutan untuk memenuhi alternasi ketat).

**Mistral (termasuk deteksi berbasis ID model)**

- Sanitasi ID tool call: strict9 (alfanumerik panjang 9).

**OpenRouter Gemini**

- Pembersihan thought signature: hapus nilai `thought_signature` yang bukan base64 (pertahankan base64).

**Yang lainnya**

- Hanya sanitasi gambar.

---

## Perilaku historis (sebelum 2026.1.22)

Sebelum rilis 2026.1.22, OpenClaw menerapkan beberapa lapisan kebersihan transkrip:

- Sebuah **ekstensi transcript-sanitize** berjalan pada setiap pembangunan konteks dan dapat:
  - Memperbaiki pasangan penggunaan/hasil alat.
  - Menyanitasi ID tool call (termasuk mode non-ketat yang mempertahankan `_`/`-`).
- Runner juga melakukan sanitasi khusus provider, yang menduplikasi pekerjaan.
- Mutasi tambahan terjadi di luar kebijakan provider, termasuk:
  - Menghapus tag `<final>` dari teks asisten sebelum penyimpanan.
  - Menghapus giliran error asisten yang kosong.
  - Memangkas konten asisten setelah tool call.

Kompleksitas ini menyebabkan regresi lintas-provider (terutama pasangan `call_id|fc_id`
pada `openai-responses`). Pembersihan 2026.1.22 menghapus ekstensi tersebut, memusatkan
logika di runner, dan menjadikan OpenAI **tanpa sentuhan** selain sanitasi gambar.

## Terkait

- [Manajemen sesi](/id/concepts/session)
- [Pemangkasan sesi](/id/concepts/session-pruning)
