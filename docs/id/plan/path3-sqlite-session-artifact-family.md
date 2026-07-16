---
read_when:
    - Anda sedang mengimplementasikan clawdbot-d63.2 / clawdbot-04b
    - Anda menangani retensi, pengaturan ulang, penghapusan sesi SQLite, atau pengarsipan akibat penghapusan agen
    - Anda perlu membedakan kelompok artefak era SQLite dari berkas pendamping JSONL lama
summary: Rencana jalur 3 untuk mengarsipkan semua artefak transkrip SQLite yang terkait dengan suatu sesi
title: Keluarga artefak sesi SQLite Jalur 3
x-i18n:
    generated_at: "2026-07-16T18:16:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Keluarga Artefak Sesi SQLite Jalur 3

Catatan ini membatasi cakupan `clawdbot-d63.2`, sementara `clawdbot-d63.1` menangani helper arsip
reset/penghapusan yang tumpang tindih di `src/config/sessions/session-accessor.sqlite.ts`.
File implementasi sedang memiliki perubahan belum disimpan selama proses ini, sehingga artefak ini mencatat
kontrak dan titik patch yang tepat tanpa berlomba dengan pekerja sejawat.

## Keluarga otoritatif

Setelah peralihan ke SQLite, transkrip sesi aktif merupakan baris SQLite. Keluarga
arsip suatu sesi adalah:

- Baris `transcript_events`, `transcript_event_identities`, dan `sessions`
  untuk `sessionId` saat ini milik entri tersebut.
- Kumpulan baris transkrip SQLite yang sama untuk setiap `sessionId` yang dirujuk oleh
  `entry.compactionCheckpoints[*].preCompaction.sessionId`.
- Kumpulan baris transkrip SQLite yang sama untuk setiap `sessionId` yang dirujuk oleh
  `entry.compactionCheckpoints[*].postCompaction.sessionId`.
- Kumpulan baris transkrip SQLite yang sama untuk setiap `sessionId` dalam
  `entry.usageFamilySessionIds`.

Arsipkan hanya baris yang tidak lagi dirujuk oleh baris
`session_entries` mana pun yang tersisa atau oleh metadata Compaction atau keluarga penggunaan
milik entri mana pun yang tersisa. Hal ini mempertahankan status cabang/pemulihan titik pemeriksaan dan rekapitulasi penggunaan hingga
referensi aktif terakhir hilang.

## Artefak nonkeluarga setelah peralihan

Varian file transkrip topik yang dihasilkan dan sidecar trajektori bukan merupakan
status runtime SQLite aktif. Keduanya adalah artefak file lama:

- Varian topik seperti `<sessionId>-topic-<thread>.jsonl` hanya ada untuk
  format transkrip berbasis file. SQLite menggunakan ID sesi kanonis beserta
  metadata pengiriman `session_routes`/entri sebagai pengganti file JSONL per topik.
- Sidecar trajektori seperti `.trajectory.jsonl` dan `.trajectory-path.json`
  dinamai berdasarkan jalur `sessionFile` JSONL yang sebenarnya. Nilai `sessionFile` SQLite adalah
  penanda `sqlite:<agentId>:<sessionId>:<storePath>` dan bukan nama file
  sidecar.
- Pembaca tingkat arsip harus tetap membaca file JSONL lama yang telah diarsipkan, tetapi
  retensi runtime tidak boleh memindai direktori sesi aktif atau membuka kembali file transkrip
  JSONL untuk sesi SQLite.

Impor Doctor tetap menjadi pemilik migrasi untuk file JSONL utama lama dan
sidecar trajektori yang berdekatan dengannya. Retensi SQLite runtime tidak boleh menambahkan
pengimpor kedua atau fallback file.

## Titik patch

Perluas helper arsip SQLite yang diperkenalkan oleh `clawdbot-d63.1`, alih-alih
menambahkan jalur paralel.

1. Tambahkan pengumpul lokal di dekat `deleteSqliteSessionStateIfUnreferenced`:
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - Sertakan `entry.sessionId`, ID sesi sebelum/sesudah titik pemeriksaan, dan
     `usageFamilySessionIds`.
   - Filter string kosong dan hapus duplikasi secara deterministik.

2. Tambahkan pengumpul referensi untuk penyimpanan setelah penghapusan:
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - Iterasikan `session_entries` saat ini, uraikan setiap `entry_json`, dan kumpulkan
     ID keluarga yang sama dari setiap entri yang tersisa.

3. Ubah pemanggil reset/penghapusan/pemeliharaan yang saat ini mengarsipkan satu
   `sessionId` yang dihapus agar meneruskan seluruh keluarga entri yang dihapus.

4. Untuk setiap ID keluarga, arsipkan baris transkrip SQLite dengan alasan dari pemanggil
   (`reset` atau `deleted`), lalu hapus baris `sessions` hanya jika
   ID keluarga tidak terdapat dalam kumpulan referensi setelah penghapusan.

5. Pertahankan pemusatan penghapusan peristiwa transkrip melalui jalur pembersihan
   baris sesi SQLite yang ada. Jangan menambahkan pembacaan JSONL aktif.

## Pengujian terfokus

Tambahkan pengujian khusus SQLite ke `src/config/sessions/session-accessor.conformance.test.ts`
atau pengujian siklus hidup sejawat setelah `clawdbot-d63.1` melakukan commit:

- Menghapus entri dengan transkrip sebelum Compaction akan mengarsipkan sesi saat ini
  dan sesi sebelum Compaction, lalu menghapus kedua kumpulan baris SQLite.
- Menghapus salah satu dari dua entri yang berbagi sesi sebelum Compaction tidak mengarsipkan
  apa pun untuk sesi bersama tersebut hingga entri terakhir yang merujuknya
  dihapus.
- Menghapus entri dengan `usageFamilySessionIds` akan mengarsipkan baris transkrip SQLite
  pendahulu ketika tidak ada entri lain yang merujuk keluarga penggunaan tersebut.
- Kunci sesi berbentuk topik dengan penanda SQLite tidak menyebabkan pembacaan
  JSONL topik yang dihasilkan atau pencarian sidecar apa pun.

Pembuktian terfokus harus menggunakan:

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

Jika pengujian akhir berada di `store.session-lifecycle-mutation.test.ts`, jalankan
file tersebut secara eksplisit dengan wrapper yang sama. Gate `pnpm` yang luas harus tetap dijalankan di
Crabbox/Testbox untuk worktree Codex ini.
