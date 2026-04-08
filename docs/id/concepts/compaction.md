---
read_when:
    - Anda ingin memahami pemadatan otomatis dan /compact
    - Anda sedang men-debug sesi panjang yang mencapai batas konteks
summary: Bagaimana OpenClaw meringkas percakapan panjang agar tetap berada dalam batas model
title: Compaction
x-i18n:
    generated_at: "2026-04-08T02:14:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6590b82a8c3a9c310998d653459ca4d8612495703ca0a8d8d306d7643142fd1
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

Setiap model memiliki jendela konteks -- jumlah maksimum token yang dapat diprosesnya.
Saat percakapan mendekati batas tersebut, OpenClaw **memadatkan** pesan-pesan lama
menjadi ringkasan agar chat dapat terus berlanjut.

## Cara kerjanya

1. Giliran percakapan yang lebih lama diringkas menjadi entri padat.
2. Ringkasan disimpan dalam transkrip sesi.
3. Pesan-pesan terbaru tetap dipertahankan utuh.

Saat OpenClaw membagi riwayat menjadi potongan pemadatan, OpenClaw menjaga agar
pemanggilan tool oleh asisten tetap dipasangkan dengan entri `toolResult` yang sesuai. Jika titik pemisahan jatuh
di dalam blok tool, OpenClaw memindahkan batasnya agar pasangan tersebut tetap bersama dan
ekor saat ini yang belum diringkas tetap dipertahankan.

Riwayat percakapan lengkap tetap tersimpan di disk. Pemadatan hanya mengubah apa yang
dilihat model pada giliran berikutnya.

## Pemadatan otomatis

Pemadatan otomatis aktif secara default. Ini berjalan saat sesi mendekati batas
konteks, atau saat model mengembalikan error luapan konteks (dalam hal ini
OpenClaw memadatkan dan mencoba lagi). Tanda tangan luapan yang umum mencakup
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, dan `ollama error: context length
exceeded`.

<Info>
Sebelum memadatkan, OpenClaw secara otomatis mengingatkan agen untuk menyimpan
catatan penting ke file [memory](/id/concepts/memory). Ini mencegah hilangnya konteks.
</Info>

Gunakan pengaturan `agents.defaults.compaction` di `openclaw.json` Anda untuk mengonfigurasi perilaku pemadatan (mode, token target, dan sebagainya).
Ringkasan pemadatan mempertahankan pengenal buram secara default (`identifierPolicy: "strict"`). Anda dapat menggantinya dengan `identifierPolicy: "off"` atau memberikan teks kustom dengan `identifierPolicy: "custom"` dan `identifierInstructions`.

Anda juga dapat menentukan model yang berbeda untuk peringkasan pemadatan melalui `agents.defaults.compaction.model`. Ini berguna ketika model utama Anda adalah model lokal atau kecil dan Anda ingin ringkasan pemadatan dihasilkan oleh model yang lebih mampu. Override ini menerima string `provider/model-id` apa pun:

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

Ini juga berfungsi dengan model lokal, misalnya model Ollama kedua yang didedikasikan untuk peringkasan atau spesialis pemadatan yang telah di-fine-tune:

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

Jika tidak disetel, pemadatan menggunakan model utama agen.

## Penyedia pemadatan yang dapat dipasang

Plugins dapat mendaftarkan penyedia pemadatan kustom melalui `registerCompactionProvider()` pada API plugin. Saat penyedia terdaftar dan dikonfigurasi, OpenClaw mendelegasikan peringkasan kepadanya alih-alih menggunakan pipeline LLM bawaan.

Untuk menggunakan penyedia yang terdaftar, setel id penyedia di konfigurasi Anda:

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

Menyetel `provider` secara otomatis memaksa `mode: "safeguard"`. Penyedia menerima instruksi pemadatan dan kebijakan pelestarian pengenal yang sama seperti jalur bawaan, dan OpenClaw tetap mempertahankan konteks sufiks giliran terbaru dan giliran terpisah setelah output penyedia. Jika penyedia gagal atau mengembalikan hasil kosong, OpenClaw kembali ke peringkasan LLM bawaan.

## Pemadatan otomatis (aktif secara default)

Saat sesi mendekati atau melampaui jendela konteks model, OpenClaw memicu pemadatan otomatis dan dapat mencoba lagi permintaan asli dengan menggunakan konteks yang telah dipadatkan.

Anda akan melihat:

- `🧹 Auto-compaction complete` dalam mode verbose
- `/status` menampilkan `🧹 Compactions: <count>`

Sebelum pemadatan, OpenClaw dapat menjalankan giliran **silent memory flush** untuk menyimpan
catatan tahan lama ke disk. Lihat [Memory](/id/concepts/memory) untuk detail dan konfigurasi.

## Pemadatan manual

Ketik `/compact` di chat mana pun untuk memaksa pemadatan. Tambahkan instruksi untuk memandu
ringkasan:

```
/compact Focus on the API design decisions
```

## Menggunakan model yang berbeda

Secara default, pemadatan menggunakan model utama agen Anda. Anda dapat menggunakan model yang lebih
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

## Pemberitahuan mulai pemadatan

Secara default, pemadatan berjalan tanpa pemberitahuan. Untuk menampilkan pemberitahuan singkat saat pemadatan
dimulai, aktifkan `notifyUser`:

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

Jika diaktifkan, pengguna akan melihat pesan singkat (misalnya, "Memadatkan
konteks...") pada awal setiap proses pemadatan.

## Pemadatan vs pemangkasan

|                  | Compaction                    | Pemangkasan                      |
| ---------------- | ----------------------------- | -------------------------------- |
| **Apa yang dilakukan** | Merangkum percakapan lama     | Memangkas hasil tool lama        |
| **Disimpan?**       | Ya (dalam transkrip sesi)   | Tidak (hanya di memori, per permintaan) |
| **Cakupan**        | Seluruh percakapan           | Hanya hasil tool                 |

[Pemangkasan sesi](/id/concepts/session-pruning) adalah pelengkap yang lebih ringan
yang memangkas output tool tanpa merangkum.

## Pemecahan masalah

**Terlalu sering memadatkan?** Jendela konteks model mungkin kecil, atau output tool
mungkin besar. Coba aktifkan
[pemangkasan sesi](/id/concepts/session-pruning).

**Konteks terasa usang setelah pemadatan?** Gunakan `/compact Focus on <topic>` untuk
memandu ringkasan, atau aktifkan [memory flush](/id/concepts/memory) agar catatan
tetap tersimpan.

**Butuh mulai dari awal?** `/new` memulai sesi baru tanpa melakukan pemadatan.

Untuk konfigurasi lanjutan (cadangan token, pelestarian pengenal, engine konteks kustom, pemadatan sisi server OpenAI), lihat
[Pendalaman Manajemen Sesi](/id/reference/session-management-compaction).

## Terkait

- [Sesi](/id/concepts/session) — manajemen dan siklus hidup sesi
- [Pemangkasan Sesi](/id/concepts/session-pruning) — memangkas hasil tool
- [Konteks](/id/concepts/context) — bagaimana konteks dibangun untuk giliran agen
- [Hooks](/id/automation/hooks) — hook siklus hidup pemadatan (before_compaction, after_compaction)
