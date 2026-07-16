---
read_when:
    - Anda ingin memahami Compaction otomatis dan /compact
    - Anda sedang men-debug sesi panjang yang mencapai batas konteks
summary: Cara OpenClaw merangkum percakapan panjang agar tetap berada dalam batas model
title: Compaction
x-i18n:
    generated_at: "2026-07-16T18:03:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

Setiap model memiliki jendela konteks: jumlah maksimum token yang dapat diprosesnya. Saat percakapan mendekati batas tersebut, OpenClaw **meringkas** pesan-pesan lama menjadi sebuah ringkasan agar obrolan dapat dilanjutkan.

## Cara kerjanya

1. Giliran percakapan lama dirangkum menjadi entri yang ringkas.
2. Ringkasan disimpan dalam transkrip sesi.
3. Pesan terbaru dipertahankan secara utuh.

OpenClaw menjaga agar panggilan alat asisten tetap berpasangan dengan entri `toolResult` yang sesuai saat memilih titik pemisahan Compaction. Jika titik tersebut berada di dalam blok alat, OpenClaw memindahkan batas agar pasangan tetap bersama dan bagian akhir saat ini yang belum dirangkum tetap dipertahankan.

Riwayat percakapan lengkap tetap tersimpan di disk. Compaction hanya mengubah apa yang dilihat model pada giliran berikutnya.

<Note>
Konfigurasi baru menetapkan `agents.defaults.compaction.mode` secara default ke `"safeguard"` (pagar pengaman yang lebih ketat, audit kualitas ringkasan). Tetapkan `mode: "default"` secara eksplisit untuk menonaktifkannya.
</Note>

## Compaction otomatis

Compaction otomatis aktif secara default. Proses ini berjalan ketika sesi mendekati batas konteks, atau ketika model mengembalikan kesalahan kelebihan konteks (dalam hal ini OpenClaw melakukan Compaction dan mencoba kembali).

Anda akan melihat:

- `embedded run auto-compaction start` / `complete` dalam log Gateway normal.
- `🧹 Auto-compaction complete` dalam mode verbose.
- `/status` yang menampilkan `🧹 Compactions: <count>`.

<Info>
Sebelum melakukan Compaction, OpenClaw secara otomatis mengingatkan agen untuk menyimpan catatan penting ke berkas [memori](/id/concepts/memory). Ini mencegah hilangnya konteks.
</Info>

<AccordionGroup>
  <Accordion title="Pola kesalahan kelebihan konteks yang dikenali OpenClaw">
    OpenClaw mencocokkan puluhan string kesalahan kelebihan konteks khusus penyedia (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter, dan lainnya). Contoh umum:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction manual

Ketik `/compact` dalam obrolan apa pun untuk memaksa Compaction. Tambahkan instruksi untuk mengarahkan ringkasan:

```text
/compact Fokus pada keputusan desain API
```

Ketika `agents.defaults.compaction.keepRecentTokens` ditetapkan (default: 20,000), Compaction manual mematuhi titik pemotongan tersebut dan mempertahankan bagian akhir terbaru dalam konteks yang dibangun ulang. Tanpa anggaran penyimpanan eksplisit, Compaction manual bertindak sebagai titik pemeriksaan keras dan dilanjutkan hanya dari ringkasan baru.

## Konfigurasi

Konfigurasikan Compaction pada `agents.defaults.compaction` di `openclaw.json` Anda. Opsi yang paling umum tercantum di bawah ini; untuk referensi lengkap, lihat [Pembahasan mendalam tentang pengelolaan sesi](/id/reference/session-management-compaction).

### Menggunakan model lain

Secara default, Compaction menggunakan model utama agen. Tetapkan `agents.defaults.compaction.model` untuk mendelegasikan peringkasan kepada model yang lebih mumpuni atau terspesialisasi. Penggantian ini menerima string `provider/model-id` atau alias tanpa awalan yang dikonfigurasi dalam `agents.defaults.models`:

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

Alias tanpa awalan yang dikonfigurasi diuraikan menjadi penyedia dan model kanonisnya sebelum Compaction dimulai. Jika nilai tanpa awalan cocok dengan alias sekaligus ID model literal yang dikonfigurasi, ID model literal akan diprioritaskan. Nilai tanpa awalan yang tidak cocok tetap menjadi ID model pada penyedia aktif.

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

Jika tidak ditetapkan, Compaction dimulai dengan model sesi aktif. Jika peringkasan gagal akibat kesalahan penyedia yang memenuhi syarat untuk fallback model, OpenClaw mencoba kembali upaya Compaction tersebut melalui rantai fallback model sesi yang ada. Pilihan fallback bersifat sementara dan tidak ditulis kembali ke status sesi. Penggantian `agents.defaults.compaction.model` yang eksplisit tetap persis dan tidak mewarisi rantai fallback sesi.

### Pemertahanan pengidentifikasi

Peringkasan Compaction mempertahankan pengidentifikasi opak secara default (`identifierPolicy: "strict"`). Ganti dengan `identifierPolicy: "off"` untuk menonaktifkannya, atau `identifierPolicy: "custom"` beserta `identifierInstructions` untuk panduan khusus.

### Pengaman ukuran byte transkrip aktif

Ketika `agents.defaults.compaction.maxActiveTranscriptBytes` ditetapkan, OpenClaw
memicu Compaction lokal normal sebelum eksekusi jika riwayat transkrip mencapai
ukuran tersebut. Ini berguna untuk sesi yang berjalan lama ketika pengelolaan
konteks di sisi penyedia dapat menjaga konteks model tetap sehat sementara
riwayat transkrip yang dipertahankan terus bertambah. Pengaman ini tidak membagi
byte mentah; pengaman ini meminta alur Compaction normal untuk membuat ringkasan
semantik.

<Warning>
Pengaman byte berlaku pada riwayat transkrip SQLite aktif. Artefak titik
pemeriksaan JSONL lama bukan target Compaction aktif.
</Warning>

### Transkrip penerus

Ketika `agents.defaults.compaction.truncateAfterCompaction` diaktifkan, OpenClaw tidak menulis ulang transkrip yang ada secara langsung. OpenClaw membuat transkrip penerus aktif baru dari ringkasan Compaction, status yang dipertahankan, dan bagian akhir yang belum dirangkum, lalu mencatat metadata titik pemeriksaan yang mengarahkan alur percabangan/pemulihan ke penerus yang telah diringkas tersebut.
Transkrip penerus juga menghapus giliran panjang pengguna yang merupakan duplikat persis dan tiba
dalam jendela percobaan ulang yang singkat, sehingga lonjakan percobaan ulang kanal tidak terbawa ke
transkrip aktif berikutnya setelah Compaction.

OpenClaw tidak lagi menulis salinan `.checkpoint.*.jsonl` terpisah untuk
Compaction baru. Berkas titik pemeriksaan lama yang ada tetap dapat digunakan selama masih dirujuk
dan akan dibersihkan oleh pembersihan sesi normal.

### Notifikasi Compaction

Secara default, Compaction berjalan secara diam-diam. Tetapkan `notifyUser` untuk menampilkan pesan status singkat saat Compaction dimulai dan selesai, serta menampilkan notifikasi penurunan kualitas ketika pengosongan memori pra-Compaction kehabisan kesempatan tetapi balasan tetap dilanjutkan:

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

### Pengosongan memori

Sebelum Compaction, OpenClaw dapat menjalankan giliran **pengosongan memori diam-diam** untuk menyimpan catatan persisten ke disk. Tetapkan `agents.defaults.compaction.memoryFlush.model` jika giliran pemeliharaan ini harus menggunakan model lokal alih-alih model percakapan aktif:

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

Penggantian model pengosongan memori bersifat persis dan tidak mewarisi rantai fallback sesi aktif. Lihat [Memori](/id/concepts/memory) untuk detail dan konfigurasi.

## Penyedia Compaction yang dapat dipasang

Plugin dapat mendaftarkan penyedia Compaction khusus melalui `registerCompactionProvider()` pada API Plugin. Ketika penyedia didaftarkan dan dikonfigurasi, OpenClaw mendelegasikan peringkasan kepadanya sebagai pengganti alur LLM bawaan.

Untuk menggunakan penyedia yang terdaftar, tetapkan ID-nya dalam konfigurasi Anda:

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

Menetapkan `provider` secara otomatis memaksa `mode: "safeguard"`. Penyedia menerima instruksi Compaction dan kebijakan pemertahanan pengidentifikasi yang sama dengan jalur bawaan, dan OpenClaw tetap mempertahankan konteks akhiran giliran terbaru dan giliran terpisah setelah keluaran penyedia.

<Note>
Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw kembali menggunakan peringkasan LLM bawaan.
</Note>

## Compaction vs pemangkasan

|                  | Compaction                         | Pemangkasan                              |
| ---------------- | ---------------------------------- | ---------------------------------------- |
| **Fungsinya**    | Merangkum percakapan lama          | Memangkas hasil alat lama                |
| **Disimpan?**    | Ya (dalam transkrip sesi)          | Tidak (hanya dalam memori, per permintaan) |
| **Cakupan**      | Seluruh percakapan                 | Hanya hasil alat                         |

[Pemangkasan sesi](/id/concepts/session-pruning) adalah pelengkap yang lebih ringan dan memangkas keluaran alat tanpa meringkasnya.

## Pemecahan masalah

**Terlalu sering melakukan Compaction?** Jendela konteks model mungkin kecil, atau keluaran alat mungkin besar. Coba aktifkan [pemangkasan sesi](/id/concepts/session-pruning).

**Konteks terasa usang setelah Compaction?** Gunakan `/compact Focus on <topic>` untuk mengarahkan ringkasan, atau aktifkan [pengosongan memori](/id/concepts/memory) agar catatan tetap bertahan.

**Memerlukan awal yang bersih?** `/new` memulai sesi baru tanpa melakukan Compaction.

Untuk konfigurasi lanjutan (token cadangan, pemertahanan pengidentifikasi, mesin konteks khusus, Compaction sisi server OpenAI), lihat [Pembahasan mendalam tentang pengelolaan sesi](/id/reference/session-management-compaction).

## Terkait

- [Sesi](/id/concepts/session): pengelolaan dan siklus hidup sesi.
- [Pemangkasan sesi](/id/concepts/session-pruning): memangkas hasil alat.
- [Konteks](/id/concepts/context): cara konteks dibangun untuk giliran agen.
- [Hook](/id/automation/hooks): hook siklus hidup Compaction (`before_compaction`, `after_compaction`).
