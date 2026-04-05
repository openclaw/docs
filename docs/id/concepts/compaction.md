---
read_when:
    - Anda ingin memahami pemadatan otomatis dan /compact
    - Anda sedang men-debug sesi panjang yang mencapai batas konteks
summary: Cara OpenClaw merangkum percakapan panjang agar tetap berada dalam batas model
title: Compaction
x-i18n:
    generated_at: "2026-04-05T13:50:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c6dbd6ebdcd5f918805aafdc153925efef3e130faa3fab3c630832e938219fc
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

Setiap model memiliki jendela konteks -- jumlah token maksimum yang dapat diprosesnya.
Saat percakapan mendekati batas itu, OpenClaw **memadatkan** pesan-pesan lama
menjadi ringkasan agar chat dapat terus berlanjut.

## Cara kerjanya

1. Giliran percakapan yang lebih lama dirangkum menjadi entri ringkas.
2. Ringkasan disimpan dalam transkrip sesi.
3. Pesan terbaru tetap dipertahankan utuh.

Saat OpenClaw membagi riwayat menjadi potongan pemadatan, OpenClaw menjaga agar
pemanggilan tool oleh asisten tetap dipasangkan dengan entri `toolResult` yang sesuai. Jika titik pemisahan jatuh
di dalam blok tool, OpenClaw menggeser batasnya agar pasangan itu tetap bersama dan
bagian ekor saat ini yang belum dirangkum tetap dipertahankan.

Seluruh riwayat percakapan tetap tersimpan di disk. Pemadatan hanya mengubah apa yang
dilihat model pada giliran berikutnya.

## Pemadatan otomatis

Pemadatan otomatis aktif secara default. Fitur ini berjalan saat sesi mendekati batas
konteks, atau saat model mengembalikan kesalahan luapan konteks (dalam hal ini
OpenClaw memadatkan dan mencoba lagi). Tanda tangan luapan yang umum meliputi
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, dan `ollama error: context length
exceeded`.

<Info>
Sebelum memadatkan, OpenClaw secara otomatis mengingatkan agen untuk menyimpan catatan penting
ke file [memory](/concepts/memory). Ini mencegah hilangnya konteks.
</Info>

## Pemadatan manual

Ketik `/compact` di chat mana pun untuk memaksa pemadatan. Tambahkan instruksi untuk memandu
ringkasan:

```
/compact Focus on the API design decisions
```

## Menggunakan model yang berbeda

Secara default, pemadatan menggunakan model utama agen Anda. Anda dapat menggunakan model yang lebih
mumpuni untuk ringkasan yang lebih baik:

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

## Pemberitahuan awal pemadatan

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

Saat diaktifkan, pengguna akan melihat pesan singkat (misalnya, "Compacting
context...") pada awal setiap proses pemadatan.

## Pemadatan vs pemangkasan

|                  | Compaction                    | Pemangkasan                      |
| ---------------- | ----------------------------- | -------------------------------- |
| **Apa yang dilakukannya** | Merangkum percakapan lama      | Memangkas hasil tool lama        |
| **Disimpan?**       | Ya (dalam transkrip sesi)   | Tidak (hanya di memori, per permintaan) |
| **Cakupan**        | Seluruh percakapan           | Hanya hasil tool                 |

[Session pruning](/concepts/session-pruning) adalah pelengkap yang lebih ringan
yang memangkas output tool tanpa merangkum.

## Pemecahan masalah

**Terlalu sering memadatkan?** Jendela konteks model mungkin kecil, atau output tool
mungkin besar. Coba aktifkan
[session pruning](/concepts/session-pruning).

**Konteks terasa usang setelah pemadatan?** Gunakan `/compact Focus on <topic>` untuk
memandu ringkasan, atau aktifkan [memory flush](/concepts/memory) agar catatan
tetap tersimpan.

**Perlu mulai dari awal?** `/new` memulai sesi baru tanpa memadatkan.

Untuk konfigurasi lanjutan (token cadangan, preservasi pengenal, mesin konteks kustom, pemadatan sisi server OpenAI), lihat
[Pendalaman Manajemen Sesi](/reference/session-management-compaction).

## Terkait

- [Session](/concepts/session) — manajemen dan siklus hidup sesi
- [Session Pruning](/concepts/session-pruning) — memangkas hasil tool
- [Context](/concepts/context) — cara konteks dibangun untuk giliran agen
- [Hooks](/id/automation/hooks) — hook siklus hidup pemadatan (before_compaction, after_compaction)
