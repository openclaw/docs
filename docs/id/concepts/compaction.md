---
read_when:
    - Anda ingin memahami Compaction otomatis dan /compact
    - Anda sedang men-debug sesi panjang yang mencapai batas konteks
summary: Cara OpenClaw meringkas percakapan panjang agar tetap dalam batas model
title: Compaction
x-i18n:
    generated_at: "2026-06-27T17:23:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

Setiap model memiliki jendela konteks: jumlah token maksimum yang dapat diprosesnya. Saat sebuah percakapan mendekati batas itu, OpenClaw melakukan **Compaction** pada pesan lama menjadi ringkasan agar chat dapat berlanjut.

## Cara kerjanya

1. Giliran percakapan lama diringkas menjadi entri ringkas.
2. Ringkasan disimpan dalam transkrip sesi.
3. Pesan terbaru dipertahankan utuh.

Saat OpenClaw membagi riwayat menjadi potongan Compaction, panggilan tool asisten tetap dipasangkan dengan entri `toolResult` yang sesuai. Jika titik pemisahan jatuh di dalam blok tool, OpenClaw memindahkan batasnya agar pasangan tersebut tetap bersama dan ekor saat ini yang belum diringkas tetap dipertahankan.

Riwayat percakapan lengkap tetap ada di disk. Compaction hanya mengubah apa yang dilihat model pada giliran berikutnya.

## Auto-compaction

Auto-compaction aktif secara default. Ini berjalan saat sesi mendekati batas konteks, atau saat model mengembalikan error luapan konteks (dalam hal ini OpenClaw melakukan Compaction dan mencoba ulang).

Anda akan melihat:

- `embedded run auto-compaction start` / `complete` di log Gateway normal.
- `🧹 Auto-compaction complete` dalam mode verbose.
- `/status` menampilkan `🧹 Compactions: <count>`.

<Info>
Sebelum melakukan Compaction, OpenClaw secara otomatis mengingatkan agen untuk menyimpan catatan penting ke file [memori](/id/concepts/memory). Ini mencegah hilangnya konteks.
</Info>

<AccordionGroup>
  <Accordion title="Recognized overflow signatures">
    OpenClaw mendeteksi luapan konteks dari pola error penyedia berikut:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction manual

Ketik `/compact` di chat mana pun untuk memaksa Compaction. Tambahkan instruksi untuk memandu ringkasan:

```
/compact Focus on the API design decisions
```

Saat `agents.defaults.compaction.keepRecentTokens` diatur, Compaction manual menghormati titik potong OpenClaw tersebut dan mempertahankan ekor terbaru dalam konteks yang dibangun ulang. Tanpa anggaran simpan eksplisit, Compaction manual berperilaku sebagai checkpoint keras dan berlanjut hanya dari ringkasan baru.

## Konfigurasi

Konfigurasikan Compaction di bawah `agents.defaults.compaction` dalam `openclaw.json` Anda. Kenop yang paling umum tercantum di bawah; untuk referensi lengkap, lihat [Pendalaman manajemen sesi](/id/reference/session-management-compaction).

### Menggunakan model lain

Secara default, Compaction menggunakan model utama agen. Atur `agents.defaults.compaction.model` untuk mendelegasikan peringkasan ke model yang lebih mampu atau terspesialisasi. Override menerima string `provider/model-id` atau alias polos yang dikonfigurasi di bawah `agents.defaults.models`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Alias polos yang dikonfigurasi di-resolve ke penyedia dan model kanonisnya sebelum Compaction dimulai. Jika nilai polos cocok dengan alias dan ID model literal yang dikonfigurasi, ID model literal menang. Nilai polos yang tidak cocok tetap menjadi ID model pada penyedia aktif.

Ini juga berfungsi dengan model lokal, misalnya model Ollama kedua yang dikhususkan untuk peringkasan:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Saat tidak diatur, Compaction dimulai dengan model sesi aktif. Jika peringkasan gagal dengan error penyedia yang memenuhi syarat untuk fallback model, OpenClaw mencoba ulang upaya Compaction tersebut melalui rantai fallback model yang sudah ada pada sesi. Pilihan fallback bersifat sementara dan tidak ditulis kembali ke status sesi. Override eksplisit `agents.defaults.compaction.model` tetap persis dan tidak mewarisi rantai fallback sesi.

### Preservasi pengenal

Peringkasan Compaction mempertahankan pengenal buram secara default (`identifierPolicy: "strict"`). Override dengan `identifierPolicy: "off"` untuk menonaktifkan, atau `identifierPolicy: "custom"` plus `identifierInstructions` untuk panduan khusus.

### Pelindung byte transkrip aktif

Saat `agents.defaults.compaction.maxActiveTranscriptBytes` diatur, OpenClaw memicu Compaction lokal normal sebelum sebuah run jika JSONL aktif mencapai ukuran tersebut. Ini berguna untuk sesi yang berjalan lama ketika manajemen konteks sisi penyedia dapat menjaga konteks model tetap sehat sementara transkrip lokal terus bertambah. Ini tidak memecah byte JSONL mentah; ini meminta pipeline Compaction normal untuk membuat ringkasan semantik.

<Warning>
Pelindung byte memerlukan `truncateAfterCompaction: true`. Tanpa rotasi transkrip, file aktif tidak akan mengecil dan pelindung tetap tidak aktif.
</Warning>

### Transkrip penerus

Saat `agents.defaults.compaction.truncateAfterCompaction` diaktifkan, OpenClaw tidak menulis ulang transkrip yang ada di tempat. OpenClaw membuat transkrip penerus aktif baru dari ringkasan Compaction, status yang dipertahankan, dan ekor yang belum diringkas, lalu mencatat metadata checkpoint yang mengarahkan alur branch/restore ke penerus yang telah dipadatkan itu.
Transkrip penerus juga menghapus giliran panjang pengguna yang merupakan duplikat persis dan tiba
di dalam jendela coba ulang singkat, sehingga badai coba ulang channel tidak dibawa ke
transkrip aktif berikutnya setelah Compaction.

OpenClaw tidak lagi menulis salinan `.checkpoint.*.jsonl` terpisah untuk
Compaction baru. File checkpoint legacy yang sudah ada masih dapat digunakan selama direferensikan
dan dipangkas oleh pembersihan sesi normal.

### Pemberitahuan Compaction

Secara default, Compaction berjalan diam-diam. Atur `notifyUser` untuk menampilkan pesan status singkat saat Compaction dimulai dan selesai:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### Flush memori

Sebelum Compaction, OpenClaw dapat menjalankan giliran **flush memori senyap** untuk menyimpan catatan tahan lama ke disk. Atur `agents.defaults.compaction.memoryFlush.model` saat giliran housekeeping ini harus menggunakan model lokal alih-alih model percakapan aktif:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

Override model memory-flush bersifat persis dan tidak mewarisi rantai fallback sesi aktif. Lihat [Memori](/id/concepts/memory) untuk detail dan konfigurasi.

## Penyedia Compaction yang dapat dipasang

Plugin dapat mendaftarkan penyedia Compaction khusus melalui `registerCompactionProvider()` pada API Plugin. Saat penyedia terdaftar dan dikonfigurasi, OpenClaw mendelegasikan peringkasan kepadanya alih-alih menggunakan pipeline LLM bawaan.

Untuk menggunakan penyedia terdaftar, atur id-nya dalam konfigurasi Anda:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Mengatur `provider` otomatis memaksa `mode: "safeguard"`. Penyedia menerima instruksi Compaction dan kebijakan preservasi pengenal yang sama dengan jalur bawaan, dan OpenClaw tetap mempertahankan konteks sufiks giliran terbaru dan giliran terpisah setelah output penyedia.

<Note>
Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw kembali ke peringkasan LLM bawaan.
</Note>

## Compaction vs pemangkasan

|                  | Compaction                    | Pemangkasan                          |
| ---------------- | ----------------------------- | ------------------------------------ |
| **Apa yang dilakukan** | Meringkas percakapan lama | Memangkas hasil tool lama            |
| **Disimpan?**    | Ya (dalam transkrip sesi)     | Tidak (hanya dalam memori, per permintaan) |
| **Cakupan**      | Seluruh percakapan            | Hanya hasil tool                     |

[Pemangkasan sesi](/id/concepts/session-pruning) adalah pelengkap yang lebih ringan yang memangkas output tool tanpa meringkas.

## Pemecahan masalah

**Terlalu sering melakukan Compaction?** Jendela konteks model mungkin kecil, atau output tool mungkin besar. Coba aktifkan [pemangkasan sesi](/id/concepts/session-pruning).

**Konteks terasa usang setelah Compaction?** Gunakan `/compact Focus on <topic>` untuk memandu ringkasan, atau aktifkan [flush memori](/id/concepts/memory) agar catatan tetap bertahan.

**Butuh awal yang bersih?** `/new` memulai sesi baru tanpa melakukan Compaction.

Untuk konfigurasi lanjutan (token cadangan, preservasi pengenal, mesin konteks khusus, Compaction sisi server OpenAI), lihat [Pendalaman manajemen sesi](/id/reference/session-management-compaction).

## Terkait

- [Sesi](/id/concepts/session): manajemen dan siklus hidup sesi.
- [Pemangkasan sesi](/id/concepts/session-pruning): memangkas hasil tool.
- [Konteks](/id/concepts/context): bagaimana konteks dibangun untuk giliran agen.
- [Hooks](/id/automation/hooks): hook siklus hidup Compaction (`before_compaction`, `after_compaction`).
