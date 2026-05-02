---
read_when:
    - Anda ingin memahami Compaction otomatis dan /compact
    - Anda sedang men-debug sesi panjang yang mencapai batas konteks
summary: Cara OpenClaw merangkum percakapan panjang agar tetap dalam batas model
title: Compaction
x-i18n:
    generated_at: "2026-05-02T09:17:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f8e6f372508a0f5421654d3e2a694695eb8a7fda4e3928159bf8f08b2a2156b
    source_path: concepts/compaction.md
    workflow: 16
---

Setiap model memiliki jendela konteks: jumlah token maksimum yang dapat diprosesnya. Saat percakapan mendekati batas tersebut, OpenClaw **memadatkan** pesan lama menjadi ringkasan agar obrolan dapat berlanjut.

## Cara kerjanya

1. Giliran percakapan yang lebih lama diringkas menjadi entri ringkas.
2. Ringkasan disimpan dalam transkrip sesi.
3. Pesan terbaru tetap dipertahankan utuh.

Saat OpenClaw membagi riwayat menjadi potongan pemadatan, OpenClaw menjaga panggilan alat asisten tetap berpasangan dengan entri `toolResult` yang sesuai. Jika titik pemisahan berada di dalam blok alat, OpenClaw memindahkan batasnya agar pasangan tetap bersama dan ekor saat ini yang belum diringkas tetap dipertahankan.

Riwayat percakapan lengkap tetap ada di disk. Pemadatan hanya mengubah apa yang dilihat model pada giliran berikutnya.

## Pemadatan otomatis

Pemadatan otomatis aktif secara default. Ini berjalan saat sesi mendekati batas konteks, atau saat model mengembalikan kesalahan luapan konteks (dalam hal ini OpenClaw memadatkan lalu mencoba ulang).

Anda akan melihat:

- `🧹 Auto-compaction complete` dalam mode verbose.
- `/status` menampilkan `🧹 Compactions: <count>`.

<Info>
Sebelum memadatkan, OpenClaw secara otomatis mengingatkan agen untuk menyimpan catatan penting ke file [memori](/id/concepts/memory). Ini mencegah hilangnya konteks.
</Info>

<AccordionGroup>
  <Accordion title="Recognized overflow signatures">
    OpenClaw mendeteksi luapan konteks dari pola kesalahan penyedia berikut:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Pemadatan manual

Ketik `/compact` di obrolan apa pun untuk memaksa pemadatan. Tambahkan instruksi untuk memandu ringkasan:

```
/compact Focus on the API design decisions
```

Saat `agents.defaults.compaction.keepRecentTokens` diatur, pemadatan manual menghormati titik potong Pi tersebut dan mempertahankan ekor terbaru dalam konteks yang dibangun ulang. Tanpa anggaran simpan eksplisit, pemadatan manual bertindak sebagai checkpoint tegas dan berlanjut hanya dari ringkasan baru.

## Konfigurasi

Konfigurasikan pemadatan di bawah `agents.defaults.compaction` dalam `openclaw.json` Anda. Opsi yang paling umum tercantum di bawah; untuk referensi lengkap, lihat [Pendalaman manajemen sesi](/id/reference/session-management-compaction).

### Menggunakan model yang berbeda

Secara default, pemadatan menggunakan model utama agen. Atur `agents.defaults.compaction.model` untuk mendelegasikan peringkasan ke model yang lebih mampu atau terspesialisasi. Override menerima string `provider/model-id` apa pun:

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

Jika tidak diatur, pemadatan dimulai dengan model sesi aktif. Jika peringkasan gagal dengan kesalahan penyedia yang memenuhi syarat fallback model, OpenClaw mencoba ulang upaya pemadatan tersebut melalui rantai fallback model sesi yang ada. Pilihan fallback bersifat sementara dan tidak ditulis kembali ke status sesi. Override eksplisit `agents.defaults.compaction.model` tetap persis dan tidak mewarisi rantai fallback sesi.

### Preservasi pengenal

Peringkasan pemadatan mempertahankan pengenal opak secara default (`identifierPolicy: "strict"`). Override dengan `identifierPolicy: "off"` untuk menonaktifkan, atau `identifierPolicy: "custom"` ditambah `identifierInstructions` untuk panduan khusus.

### Penjaga byte transkrip aktif

Saat `agents.defaults.compaction.maxActiveTranscriptBytes` diatur, OpenClaw memicu pemadatan lokal normal sebelum sebuah run jika JSONL aktif mencapai ukuran tersebut. Ini berguna untuk sesi berjalan lama ketika manajemen konteks sisi penyedia dapat menjaga konteks model tetap sehat sementara transkrip lokal terus bertambah. Ini tidak membagi byte JSONL mentah; ini meminta pipeline pemadatan normal membuat ringkasan semantik.

<Warning>
Penjaga byte memerlukan `truncateAfterCompaction: true`. Tanpa rotasi transkrip, file aktif tidak akan menyusut dan penjaga tetap tidak aktif.
</Warning>

### Transkrip penerus

Saat `agents.defaults.compaction.truncateAfterCompaction` diaktifkan, OpenClaw tidak menulis ulang transkrip yang ada di tempat. OpenClaw membuat transkrip penerus aktif baru dari ringkasan pemadatan, status yang dipertahankan, dan ekor yang belum diringkas, lalu menyimpan JSONL sebelumnya sebagai sumber checkpoint arsip.
Transkrip penerus juga membuang giliran pengguna panjang yang merupakan duplikat persis dan tiba
dalam jendela coba ulang yang singkat, sehingga badai coba ulang kanal tidak terbawa ke
transkrip aktif berikutnya setelah pemadatan.

Checkpoint pra-pemadatan dipertahankan hanya selama tetap berada di bawah batas ukuran
checkpoint OpenClaw; transkrip aktif yang terlalu besar tetap dipadatkan, tetapi OpenClaw
melewati snapshot debug besar alih-alih menggandakan penggunaan disk.

### Pemberitahuan pemadatan

Secara default, pemadatan berjalan diam-diam. Atur `notifyUser` untuk menampilkan pesan status singkat saat pemadatan dimulai dan selesai:

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

Sebelum pemadatan, OpenClaw dapat menjalankan giliran **flush memori diam-diam** untuk menyimpan catatan tahan lama ke disk. Atur `agents.defaults.compaction.memoryFlush.model` saat giliran pemeliharaan ini harus menggunakan model lokal alih-alih model percakapan aktif:

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

Override model flush memori bersifat persis dan tidak mewarisi rantai fallback sesi aktif. Lihat [Memori](/id/concepts/memory) untuk detail dan konfigurasi.

## Penyedia pemadatan yang dapat dipasang

Plugin dapat mendaftarkan penyedia pemadatan khusus melalui `registerCompactionProvider()` pada API Plugin. Saat penyedia terdaftar dan dikonfigurasi, OpenClaw mendelegasikan peringkasan kepadanya alih-alih menggunakan pipeline LLM bawaan.

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

Mengatur `provider` secara otomatis memaksa `mode: "safeguard"`. Penyedia menerima instruksi pemadatan dan kebijakan preservasi pengenal yang sama seperti jalur bawaan, dan OpenClaw tetap mempertahankan konteks sufiks giliran terbaru dan giliran terpisah setelah keluaran penyedia.

<Note>
Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw kembali ke peringkasan LLM bawaan.
</Note>

## Pemadatan vs pemangkasan

|                  | Pemadatan                     | Pemangkasan                      |
| ---------------- | ----------------------------- | -------------------------------- |
| **Apa fungsinya** | Meringkas percakapan lama     | Memangkas hasil alat lama        |
| **Disimpan?**    | Ya (dalam transkrip sesi)     | Tidak (hanya dalam memori, per permintaan) |
| **Cakupan**      | Seluruh percakapan            | Hanya hasil alat                 |

[Pemangkasan sesi](/id/concepts/session-pruning) adalah pelengkap yang lebih ringan yang memangkas keluaran alat tanpa meringkas.

## Pemecahan masalah

**Terlalu sering memadatkan?** Jendela konteks model mungkin kecil, atau keluaran alat mungkin besar. Coba aktifkan [pemangkasan sesi](/id/concepts/session-pruning).

**Konteks terasa basi setelah pemadatan?** Gunakan `/compact Focus on <topic>` untuk memandu ringkasan, atau aktifkan [flush memori](/id/concepts/memory) agar catatan tetap bertahan.

**Perlu mulai dari awal?** `/new` memulai sesi baru tanpa memadatkan.

Untuk konfigurasi lanjutan (token cadangan, preservasi pengenal, mesin konteks khusus, pemadatan sisi server OpenAI), lihat [Pendalaman manajemen sesi](/id/reference/session-management-compaction).

## Terkait

- [Sesi](/id/concepts/session): manajemen sesi dan siklus hidup.
- [Pemangkasan sesi](/id/concepts/session-pruning): memangkas hasil alat.
- [Konteks](/id/concepts/context): cara konteks dibangun untuk giliran agen.
- [Hooks](/id/automation/hooks): hook siklus hidup pemadatan (`before_compaction`, `after_compaction`).
