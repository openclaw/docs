---
read_when:
    - Anda ingin memahami Compaction otomatis dan /compact
    - Anda sedang men-debug sesi panjang yang mencapai batas konteks
summary: Cara OpenClaw merangkum percakapan panjang agar tetap berada dalam batas model
title: Compaction
x-i18n:
    generated_at: "2026-04-30T09:42:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

Setiap model memiliki jendela konteks: jumlah token maksimum yang dapat diprosesnya. Saat percakapan mendekati batas tersebut, OpenClaw **melakukan Compaction** pada pesan-pesan lama menjadi ringkasan agar chat dapat berlanjut.

## Cara kerjanya

1. Giliran percakapan yang lebih lama diringkas menjadi entri ringkas.
2. Ringkasan disimpan dalam transkrip sesi.
3. Pesan terbaru tetap dipertahankan utuh.

Saat OpenClaw membagi riwayat menjadi potongan Compaction, OpenClaw menjaga panggilan alat dari asisten tetap berpasangan dengan entri `toolResult` yang sesuai. Jika titik pemisahan berada di dalam blok alat, OpenClaw memindahkan batasnya agar pasangan tetap bersama dan ekor terkini yang belum diringkas tetap dipertahankan.

Riwayat percakapan lengkap tetap berada di disk. Compaction hanya mengubah apa yang dilihat model pada giliran berikutnya.

## Compaction otomatis

Compaction otomatis aktif secara default. Ini berjalan saat sesi mendekati batas konteks, atau saat model mengembalikan galat luapan konteks (dalam hal ini OpenClaw melakukan Compaction dan mencoba lagi).

Anda akan melihat:

- `🧹 Auto-compaction complete` dalam mode verbose.
- `/status` menampilkan `🧹 Compactions: <count>`.

<Info>
Sebelum melakukan Compaction, OpenClaw secara otomatis mengingatkan agen untuk menyimpan catatan penting ke berkas [memory](/id/concepts/memory). Ini mencegah kehilangan konteks.
</Info>

<AccordionGroup>
  <Accordion title="Tanda luapan yang dikenali">
    OpenClaw mendeteksi luapan konteks dari pola galat penyedia berikut:

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

Saat `agents.defaults.compaction.keepRecentTokens` diatur, Compaction manual menghormati titik potong Pi tersebut dan mempertahankan ekor terbaru dalam konteks yang dibangun ulang. Tanpa anggaran simpan yang eksplisit, Compaction manual berperilaku sebagai checkpoint keras dan berlanjut hanya dari ringkasan baru.

## Konfigurasi

Konfigurasikan Compaction di bawah `agents.defaults.compaction` dalam `openclaw.json` Anda. Pengaturan yang paling umum tercantum di bawah; untuk referensi lengkap, lihat [Pembahasan mendalam manajemen sesi](/id/reference/session-management-compaction).

### Menggunakan model berbeda

Secara default, Compaction menggunakan model utama agen. Atur `agents.defaults.compaction.model` untuk mendelegasikan peringkasan ke model yang lebih mampu atau lebih terspesialisasi. Override menerima string `provider/model-id` apa pun:

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

Ini juga berfungsi dengan model lokal, misalnya model Ollama kedua yang didedikasikan untuk peringkasan:

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

Jika tidak diatur, Compaction menggunakan model utama agen.

### Pelestarian pengidentifikasi

Peringkasan Compaction mempertahankan pengidentifikasi buram secara default (`identifierPolicy: "strict"`). Override dengan `identifierPolicy: "off"` untuk menonaktifkan, atau `identifierPolicy: "custom"` ditambah `identifierInstructions` untuk panduan khusus.

### Pelindung byte transkrip aktif

Saat `agents.defaults.compaction.maxActiveTranscriptBytes` diatur, OpenClaw memicu Compaction lokal normal sebelum suatu proses berjalan jika JSONL aktif mencapai ukuran tersebut. Ini berguna untuk sesi yang berjalan lama, ketika manajemen konteks di sisi penyedia dapat menjaga konteks model tetap sehat sementara transkrip lokal terus bertambah. Ini tidak membagi byte JSONL mentah; ini meminta pipeline Compaction normal untuk membuat ringkasan semantik.

<Warning>
Pelindung byte memerlukan `truncateAfterCompaction: true`. Tanpa rotasi transkrip, berkas aktif tidak akan menyusut dan pelindung tetap tidak aktif.
</Warning>

### Transkrip penerus

Saat `agents.defaults.compaction.truncateAfterCompaction` diaktifkan, OpenClaw tidak menulis ulang transkrip yang ada di tempat. OpenClaw membuat transkrip penerus aktif baru dari ringkasan Compaction, state yang dipertahankan, dan ekor yang belum diringkas, lalu menyimpan JSONL sebelumnya sebagai sumber checkpoint yang diarsipkan.
Transkrip penerus juga membuang giliran pengguna panjang yang merupakan duplikat persis dan tiba
di dalam jendela percobaan ulang singkat, sehingga badai percobaan ulang kanal tidak dibawa ke
transkrip aktif berikutnya setelah Compaction.

Checkpoint pra-Compaction dipertahankan hanya selama tetap berada di bawah batas ukuran
checkpoint OpenClaw; transkrip aktif yang terlalu besar tetap di-compact, tetapi OpenClaw
melewati snapshot debug besar alih-alih menggandakan penggunaan disk.

### Pemberitahuan Compaction

Secara default, Compaction berjalan tanpa suara. Atur `notifyUser` untuk menampilkan pesan status singkat saat Compaction dimulai dan selesai:

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

Override model flush memori bersifat persis dan tidak mewarisi rantai fallback sesi aktif. Lihat [Memory](/id/concepts/memory) untuk detail dan konfigurasi.

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

Mengatur `provider` secara otomatis memaksa `mode: "safeguard"`. Penyedia menerima instruksi Compaction dan kebijakan pelestarian pengidentifikasi yang sama seperti jalur bawaan, dan OpenClaw tetap mempertahankan konteks sufiks giliran terbaru dan giliran terpisah setelah keluaran penyedia.

<Note>
Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw kembali menggunakan peringkasan LLM bawaan.
</Note>

## Compaction vs pemangkasan

|                  | Compaction                         | Pemangkasan                         |
| ---------------- | ---------------------------------- | ----------------------------------- |
| **Apa fungsinya** | Meringkas percakapan lama          | Memangkas hasil alat lama           |
| **Disimpan?**    | Ya (dalam transkrip sesi)          | Tidak (hanya dalam memori, per permintaan) |
| **Cakupan**      | Seluruh percakapan                 | Hanya hasil alat                    |

[Pemangkasan sesi](/id/concepts/session-pruning) adalah pelengkap yang lebih ringan yang memangkas keluaran alat tanpa meringkas.

## Pemecahan masalah

**Terlalu sering melakukan Compaction?** Jendela konteks model mungkin kecil, atau keluaran alat mungkin besar. Coba aktifkan [pemangkasan sesi](/id/concepts/session-pruning).

**Konteks terasa usang setelah Compaction?** Gunakan `/compact Focus on <topic>` untuk memandu ringkasan, atau aktifkan [flush memori](/id/concepts/memory) agar catatan tetap bertahan.

**Perlu mulai bersih?** `/new` memulai sesi baru tanpa melakukan Compaction.

Untuk konfigurasi lanjutan (token cadangan, pelestarian pengidentifikasi, mesin konteks khusus, Compaction sisi server OpenAI), lihat [Pembahasan mendalam manajemen sesi](/id/reference/session-management-compaction).

## Terkait

- [Sesi](/id/concepts/session): manajemen dan siklus hidup sesi.
- [Pemangkasan sesi](/id/concepts/session-pruning): memangkas hasil alat.
- [Konteks](/id/concepts/context): bagaimana konteks dibangun untuk giliran agen.
- [Hooks](/id/automation/hooks): hook siklus hidup Compaction (`before_compaction`, `after_compaction`).
