---
read_when:
    - Anda ingin memahami Compaction otomatis dan /compact
    - Anda sedang men-debug sesi panjang yang mencapai batas konteks
summary: Bagaimana OpenClaw merangkum percakapan panjang agar tetap dalam batas model
title: Compaction
x-i18n:
    generated_at: "2026-04-24T09:03:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b88a757b19a7c040599a0a7901d8596001ffff148f7f6e861a3cc783100393f7
    source_path: concepts/compaction.md
    workflow: 15
---

Setiap model memiliki jendela konteks -- jumlah token maksimum yang dapat diprosesnya.
Saat percakapan mendekati batas itu, OpenClaw melakukan **Compaction** pada pesan lama
menjadi ringkasan agar chat dapat terus berlanjut.

## Cara kerjanya

1. Giliran percakapan yang lebih lama diringkas menjadi entri ringkas.
2. Ringkasan disimpan dalam transkrip sesi.
3. Pesan terbaru tetap dipertahankan utuh.

Saat OpenClaw membagi riwayat ke dalam potongan Compaction, OpenClaw menjaga agar pemanggilan tool
asisten tetap dipasangkan dengan entri `toolResult` yang cocok. Jika titik pemisahan jatuh
di dalam blok tool, OpenClaw menggeser batasnya agar pasangan itu tetap bersama dan
ekor saat ini yang belum diringkas tetap dipertahankan.

Riwayat percakapan lengkap tetap tersimpan di disk. Compaction hanya mengubah apa yang
dilihat model pada giliran berikutnya.

## Compaction otomatis

Compaction otomatis aktif secara default. Ini berjalan saat sesi mendekati batas konteks,
atau saat model mengembalikan error context-overflow (dalam hal ini
OpenClaw melakukan Compaction lalu mencoba lagi). Tanda overflow yang umum meliputi
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, dan `ollama error: context length
exceeded`.

<Info>
Sebelum melakukan Compaction, OpenClaw secara otomatis mengingatkan agen untuk menyimpan catatan penting
ke file [memory](/id/concepts/memory). Ini mencegah hilangnya konteks.
</Info>

Gunakan pengaturan `agents.defaults.compaction` di `openclaw.json` Anda untuk mengonfigurasi perilaku Compaction (mode, token target, dll.).
Peringkasan Compaction mempertahankan identifier opak secara default (`identifierPolicy: "strict"`). Anda dapat menimpanya dengan `identifierPolicy: "off"` atau memberikan teks kustom dengan `identifierPolicy: "custom"` dan `identifierInstructions`.

Anda dapat secara opsional menentukan model yang berbeda untuk peringkasan Compaction melalui `agents.defaults.compaction.model`. Ini berguna saat model utama Anda adalah model lokal atau kecil dan Anda ingin ringkasan Compaction dihasilkan oleh model yang lebih mampu. Override ini menerima string `provider/model-id` apa pun:

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

Ini juga berfungsi dengan model lokal, misalnya model Ollama kedua yang dikhususkan untuk peringkasan atau spesialis Compaction yang telah di-fine-tune:

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

Jika tidak disetel, Compaction menggunakan model utama agen.

## Provider Compaction yang dapat dipasang

Plugin dapat mendaftarkan provider Compaction kustom melalui `registerCompactionProvider()` pada API plugin. Saat provider didaftarkan dan dikonfigurasi, OpenClaw mendelegasikan peringkasan kepadanya alih-alih ke pipeline LLM bawaan.

Untuk menggunakan provider yang terdaftar, setel id provider di konfigurasi Anda:

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

Menyetel `provider` secara otomatis memaksa `mode: "safeguard"`. Provider menerima instruksi Compaction dan kebijakan pelestarian identifier yang sama seperti jalur bawaan, dan OpenClaw tetap mempertahankan konteks sufiks giliran terbaru dan giliran terpisah setelah output provider. Jika provider gagal atau mengembalikan hasil kosong, OpenClaw kembali ke peringkasan LLM bawaan.

## Compaction otomatis (default aktif)

Saat sesi mendekati atau melampaui jendela konteks model, OpenClaw memicu Compaction otomatis dan dapat mencoba ulang permintaan asli menggunakan konteks yang telah dikompaksi.

Anda akan melihat:

- `🧹 Auto-compaction complete` dalam mode verbose
- `/status` menampilkan `🧹 Compactions: <count>`

Sebelum Compaction, OpenClaw dapat menjalankan giliran **memory flush** senyap untuk menyimpan
catatan yang tahan lama ke disk. Lihat [Memory](/id/concepts/memory) untuk detail dan konfigurasi.

## Compaction manual

Ketik `/compact` di chat mana pun untuk memaksa Compaction. Tambahkan instruksi untuk mengarahkan
ringkasan:

```
/compact Focus on the API design decisions
```

## Menggunakan model yang berbeda

Secara default, Compaction menggunakan model utama agen Anda. Anda dapat menggunakan model yang lebih
mampu untuk ringkasan yang lebih baik:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Notifikasi Compaction

Secara default, Compaction berjalan secara senyap. Untuk menampilkan notifikasi singkat saat Compaction
dimulai dan selesai, aktifkan `notifyUser`:

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

Saat diaktifkan, pengguna melihat pesan status singkat di sekitar setiap proses Compaction
(misalnya, "Memadatkan konteks..." dan "Compaction selesai").

## Compaction vs pruning

|                  | Compaction                  | Pruning                           |
| ---------------- | --------------------------- | --------------------------------- |
| **Apa fungsinya** | Merangkum percakapan lama  | Memangkas hasil tool lama         |
| **Disimpan?**    | Ya (dalam transkrip sesi)   | Tidak (hanya dalam memori, per permintaan) |
| **Cakupan**      | Seluruh percakapan          | Hanya hasil tool                  |

[Session pruning](/id/concepts/session-pruning) adalah pelengkap yang lebih ringan yang
memangkas output tool tanpa merangkum.

## Pemecahan masalah

**Terlalu sering melakukan Compaction?** Jendela konteks model mungkin kecil, atau output tool
mungkin besar. Coba aktifkan
[session pruning](/id/concepts/session-pruning).

**Konteks terasa basi setelah Compaction?** Gunakan `/compact Focus on <topic>` untuk
mengarahkan ringkasan, atau aktifkan [memory flush](/id/concepts/memory) agar catatan
tetap bertahan.

**Perlu mulai dari awal?** `/new` memulai sesi baru tanpa melakukan Compaction.

Untuk konfigurasi lanjutan (reserve tokens, pelestarian identifier, engine
konteks kustom, Compaction sisi server OpenAI), lihat
[Session Management Deep Dive](/id/reference/session-management-compaction).

## Terkait

- [Session](/id/concepts/session) — pengelolaan dan siklus hidup sesi
- [Session Pruning](/id/concepts/session-pruning) — memangkas hasil tool
- [Context](/id/concepts/context) — bagaimana konteks dibangun untuk giliran agen
- [Hooks](/id/automation/hooks) — Hooks siklus hidup Compaction (`before_compaction`, `after_compaction`)
