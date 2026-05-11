---
read_when:
    - Anda ingin memahami Compaction otomatis dan /compact
    - Anda sedang men-debug sesi panjang yang mencapai batas konteks
summary: Bagaimana OpenClaw meringkas percakapan panjang agar tetap berada dalam batas model
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:26:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

Setiap model memiliki jendela konteks: jumlah maksimum token yang dapat diprosesnya. Ketika percakapan mendekati batas tersebut, OpenClaw **memadatkan** pesan lama menjadi ringkasan agar chat dapat berlanjut.

## Cara kerjanya

1. Giliran percakapan lama diringkas menjadi entri ringkas.
2. Ringkasan disimpan dalam transkrip sesi.
3. Pesan terbaru tetap dipertahankan utuh.

Ketika OpenClaw membagi riwayat menjadi chunk compaction, OpenClaw menjaga pemanggilan alat asisten tetap berpasangan dengan entri `toolResult` yang cocok. Jika titik pemisahan berada di dalam blok alat, OpenClaw memindahkan batas agar pasangan tetap bersama dan ekor terbaru yang belum diringkas tetap dipertahankan.

Riwayat percakapan lengkap tetap berada di disk. Compaction hanya mengubah apa yang dilihat model pada giliran berikutnya.

## Auto-compaction

Auto-compaction aktif secara default. Ini berjalan ketika sesi mendekati batas konteks, atau ketika model mengembalikan error context-overflow (dalam kasus tersebut OpenClaw melakukan compaction dan mencoba ulang).

Anda akan melihat:

- `embedded run auto-compaction start` / `complete` di log Gateway normal.
- `🧹 Auto-compaction complete` dalam mode verbose.
- `/status` menampilkan `🧹 Compactions: <count>`.

<Info>
Sebelum melakukan compaction, OpenClaw secara otomatis mengingatkan agen untuk menyimpan catatan penting ke file [memori](/id/concepts/memory). Ini mencegah kehilangan konteks.
</Info>

<AccordionGroup>
  <Accordion title="Tanda overflow yang dikenali">
    OpenClaw mendeteksi context overflow dari pola error provider berikut:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction manual

Ketik `/compact` di chat mana pun untuk memaksa compaction. Tambahkan instruksi untuk memandu ringkasan:

```
/compact Focus on the API design decisions
```

Ketika `agents.defaults.compaction.keepRecentTokens` diatur, compaction manual mengikuti titik potong Pi tersebut dan mempertahankan ekor terbaru dalam konteks yang dibangun ulang. Tanpa anggaran simpan eksplisit, compaction manual berperilaku sebagai checkpoint keras dan berlanjut hanya dari ringkasan baru.

## Konfigurasi

Konfigurasikan compaction di bawah `agents.defaults.compaction` dalam `openclaw.json` Anda. Pengaturan yang paling umum tercantum di bawah; untuk referensi lengkap, lihat [Pendalaman manajemen sesi](/id/reference/session-management-compaction).

### Menggunakan model berbeda

Secara default, compaction menggunakan model utama agen. Atur `agents.defaults.compaction.model` untuk mendelegasikan peringkasan ke model yang lebih mampu atau lebih terspesialisasi. Override menerima string `provider/model-id` apa pun:

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

Ketika tidak diatur, compaction dimulai dengan model sesi aktif. Jika peringkasan gagal dengan error provider yang memenuhi syarat untuk fallback model, OpenClaw mencoba ulang upaya compaction tersebut melalui rantai fallback model yang sudah ada pada sesi. Pilihan fallback bersifat sementara dan tidak ditulis kembali ke status sesi. Override eksplisit `agents.defaults.compaction.model` tetap persis dan tidak mewarisi rantai fallback sesi.

### Pelestarian identifier

Peringkasan compaction mempertahankan identifier buram secara default (`identifierPolicy: "strict"`). Override dengan `identifierPolicy: "off"` untuk menonaktifkan, atau `identifierPolicy: "custom"` plus `identifierInstructions` untuk panduan khusus.

### Penjaga byte transkrip aktif

Ketika `agents.defaults.compaction.maxActiveTranscriptBytes` diatur, OpenClaw memicu compaction lokal normal sebelum run jika JSONL aktif mencapai ukuran tersebut. Ini berguna untuk sesi jangka panjang ketika manajemen konteks sisi provider dapat menjaga konteks model tetap sehat sementara transkrip lokal terus bertambah. Ini tidak membagi byte JSONL mentah; ini meminta pipeline compaction normal untuk membuat ringkasan semantik.

<Warning>
Penjaga byte memerlukan `truncateAfterCompaction: true`. Tanpa rotasi transkrip, file aktif tidak akan mengecil dan penjaga tetap tidak aktif.
</Warning>

### Transkrip penerus

Ketika `agents.defaults.compaction.truncateAfterCompaction` diaktifkan, OpenClaw tidak menulis ulang transkrip yang ada di tempat. OpenClaw membuat transkrip penerus aktif baru dari ringkasan compaction, status yang dipertahankan, dan ekor yang belum diringkas, lalu menyimpan JSONL sebelumnya sebagai sumber checkpoint yang diarsipkan.
Transkrip penerus juga menghapus giliran pengguna panjang duplikat persis yang tiba
di dalam jendela percobaan ulang singkat, sehingga badai percobaan ulang channel tidak dibawa ke
transkrip aktif berikutnya setelah compaction.

Checkpoint pra-compaction dipertahankan hanya selama tetap di bawah batas ukuran
checkpoint OpenClaw; transkrip aktif yang terlalu besar tetap dicompact, tetapi OpenClaw
melewati snapshot debug besar alih-alih menggandakan penggunaan disk.

### Pemberitahuan compaction

Secara default, compaction berjalan secara diam-diam. Atur `notifyUser` untuk menampilkan pesan status singkat saat compaction dimulai dan selesai:

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

Sebelum compaction, OpenClaw dapat menjalankan giliran **flush memori senyap** untuk menyimpan catatan tahan lama ke disk. Atur `agents.defaults.compaction.memoryFlush.model` ketika giliran housekeeping ini harus menggunakan model lokal alih-alih model percakapan aktif:

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

## Provider compaction yang dapat dipasang

Plugin dapat mendaftarkan provider compaction khusus melalui `registerCompactionProvider()` pada API plugin. Ketika provider terdaftar dan dikonfigurasi, OpenClaw mendelegasikan peringkasan kepadanya alih-alih menggunakan pipeline LLM bawaan.

Untuk menggunakan provider terdaftar, atur id-nya dalam konfigurasi Anda:

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

Mengatur `provider` secara otomatis memaksa `mode: "safeguard"`. Provider menerima instruksi compaction dan kebijakan pelestarian identifier yang sama seperti jalur bawaan, dan OpenClaw tetap mempertahankan konteks suffix giliran terbaru dan giliran terpisah setelah output provider.

<Note>
Jika provider gagal atau mengembalikan hasil kosong, OpenClaw fallback ke peringkasan LLM bawaan.
</Note>

## Compaction vs pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Apa fungsinya** | Meringkas percakapan lama | Memangkas hasil alat lama           |
| **Disimpan?**       | Ya (dalam transkrip sesi)   | Tidak (hanya dalam memori, per request) |
| **Cakupan**        | Seluruh percakapan           | Hanya hasil alat                |

[Pruning sesi](/id/concepts/session-pruning) adalah pelengkap yang lebih ringan yang memangkas output alat tanpa meringkas.

## Pemecahan masalah

**Compaction terlalu sering?** Jendela konteks model mungkin kecil, atau output alat mungkin besar. Coba aktifkan [pruning sesi](/id/concepts/session-pruning).

**Konteks terasa basi setelah compaction?** Gunakan `/compact Focus on <topic>` untuk memandu ringkasan, atau aktifkan [flush memori](/id/concepts/memory) agar catatan tetap bertahan.

**Butuh awal yang bersih?** `/new` memulai sesi baru tanpa compaction.

Untuk konfigurasi lanjutan (token cadangan, pelestarian identifier, mesin konteks khusus, compaction sisi server OpenAI), lihat [Pendalaman manajemen sesi](/id/reference/session-management-compaction).

## Terkait

- [Sesi](/id/concepts/session): manajemen dan siklus hidup sesi.
- [Pruning sesi](/id/concepts/session-pruning): memangkas hasil alat.
- [Konteks](/id/concepts/context): cara konteks dibangun untuk giliran agen.
- [Hooks](/id/automation/hooks): hook siklus hidup compaction (`before_compaction`, `after_compaction`).
