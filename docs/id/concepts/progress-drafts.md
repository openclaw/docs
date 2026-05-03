---
read_when:
    - Mengonfigurasi pembaruan progres yang terlihat untuk giliran obrolan yang berjalan lama
    - Memilih antara mode streaming parsial, blok, dan progres
    - Menjelaskan bagaimana OpenClaw memperbarui satu pesan saluran saat pekerjaan sedang berlangsung
    - Pemecahan masalah draf progres, pesan progres mandiri, atau mekanisme cadangan finalisasi
summary: 'Draf progres: satu pesan pekerjaan yang sedang berlangsung yang terlihat dan diperbarui saat agen berjalan'
title: Draf progres
x-i18n:
    generated_at: "2026-05-03T21:30:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0fc0dff38232228b49872d66f4498f065675cdd3abf3a0f4003cb34fcbb7de8c
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Draf progres membuat giliran agen yang berjalan lama terasa hidup dalam chat tanpa mengubah percakapan menjadi tumpukan balasan status sementara.

Saat draf progres diaktifkan, OpenClaw membuat satu pesan pekerjaan-berjalan yang terlihat, memperbaruinya saat agen membaca, merencanakan, memanggil alat, atau menunggu persetujuan, lalu mengubah draf tersebut menjadi jawaban akhir saat channel dapat melakukannya dengan aman.

```text
Shelling
- reading recent channel context
- checking matching issues
- preparing reply
```

Gunakan draf progres saat Anda menginginkan satu pesan status yang rapi selama pekerjaan yang intensif alat dan jawaban akhir saat giliran selesai.

## Mulai Cepat

Aktifkan draf progres per channel dengan `streaming.mode: "progress"`:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
      },
    },
  },
}
```

Biasanya itu sudah cukup. OpenClaw akan memilih label satu kata otomatis, menambahkan baris progres ringkas saat pekerjaan berguna berlangsung, dan menekan percakapan progres mandiri yang duplikat untuk giliran tersebut.

## Yang Dilihat Pengguna

Draf progres memiliki dua bagian:

| Bagian         | Tujuan                                                               |
| -------------- | -------------------------------------------------------------------- |
| Label          | Judul singkat seperti `Thinking` atau `Shelling`.                    |
| Baris progres  | Pembaruan eksekusi ringkas seperti panggilan alat, langkah tugas, atau persetujuan. |

Label muncul segera saat agen mulai membalas. Baris progres hanya ditambahkan saat agen memancarkan pembaruan pekerjaan yang berguna. Jawaban akhir menggantikan draf jika memungkinkan; jika tidak, OpenClaw mengirim jawaban akhir seperti biasa dan membersihkan atau berhenti memperbarui draf sesuai transport channel.

## Pilih Mode

`channels.<channel>.streaming.mode` mengontrol perilaku pekerjaan-berjalan yang terlihat:

| Mode       | Paling cocok untuk                         | Yang muncul di chat                                      |
| ---------- | ------------------------------------------ | -------------------------------------------------------- |
| `off`      | Channel yang tenang                        | Hanya jawaban akhir.                                     |
| `partial`  | Melihat teks jawaban muncul                | Satu draf yang diedit dengan teks jawaban terbaru.       |
| `block`    | Potongan pratinjau jawaban yang lebih besar | Satu pratinjau diperbarui atau ditambahkan dalam potongan yang lebih besar. |
| `progress` | Giliran yang intensif alat atau berjalan lama | Satu draf status, lalu jawaban akhir.                    |

Pilih `progress` saat pengguna lebih peduli pada "apa yang sedang terjadi" daripada melihat teks jawaban mengalir token demi token.

Pilih `partial` saat jawaban itu sendiri adalah sinyal progres.

Pilih `block` saat Anda menginginkan pembaruan pratinjau draf dalam potongan teks yang lebih besar. Di Discord dan Telegram, `streaming.mode: "block"` tetap merupakan streaming pratinjau, bukan pengiriman blok normal. Gunakan `streaming.block.enabled` atau `blockStreaming` lama saat Anda menginginkan balasan blok normal.

## Konfigurasi Label

Label progres berada di bawah `channels.<channel>.streaming.progress`.

Label default adalah `auto`, yang memilih dari kumpulan label satu kata bawaan OpenClaw:

```text
Thinking
Shelling
Scuttling
Clawing
Pinching
Molting
Bubbling
Tiding
Reefing
Cracking
Sifting
Brining
Nautiling
Krilling
Barnacling
Lobstering
Tidepooling
Pearling
Snapping
Surfacing
```

Gunakan label tetap:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Investigating",
        },
      },
    },
  },
}
```

Gunakan kumpulan label otomatis Anda sendiri:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Checking", "Reading", "Testing", "Finishing"],
        },
      },
    },
  },
}
```

Sembunyikan label dan hanya tampilkan baris progres:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: false,
        },
      },
    },
  },
}
```

## Kontrol Baris Progres

Baris progres diaktifkan secara default dalam mode progres. Baris tersebut berasal dari peristiwa eksekusi nyata: awal alat, pembaruan item, rencana tugas, persetujuan, keluaran perintah, ringkasan patch, dan aktivitas agen serupa.

Batasi jumlah baris yang tetap terlihat:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLines: 4,
        },
      },
    },
  },
}
```

Pertahankan satu draf progres tetapi sembunyikan baris alat dan tugas:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          toolProgress: false,
        },
      },
    },
  },
}
```

Dengan `toolProgress: false`, OpenClaw tetap menekan pesan progres alat mandiri lama untuk giliran tersebut. Channel tetap tenang secara visual hingga jawaban akhir, kecuali label jika ada yang dikonfigurasi.

## Perilaku Channel

Setiap channel menggunakan transport paling bersih yang didukungnya:

| Channel         | Transport progres                     | Catatan                                                                 |
| --------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| Discord         | Kirim satu pesan, lalu edit pesan itu. | Teks akhir diedit di tempat saat muat dalam satu pesan pratinjau aman. |
| Matrix          | Kirim satu peristiwa, lalu edit peristiwa itu. | Konfigurasi streaming tingkat akun mengontrol draf tingkat akun. |
| Microsoft Teams | Stream Teams native dalam chat personal. | `streaming.mode: "block"` dipetakan ke pengiriman blok Teams.          |
| Slack           | Stream native atau posting draf yang dapat diedit. | Ketersediaan thread memengaruhi apakah streaming native dapat digunakan. |
| Telegram        | Kirim satu pesan, lalu edit pesan itu. | Draf lama yang terlihat dapat diganti agar stempel waktu akhir tetap berguna. |
| Mattermost      | Posting draf yang dapat diedit.       | Aktivitas alat digabungkan ke posting bergaya draf yang sama.           |

Channel tanpa dukungan edit yang aman biasanya kembali ke indikator mengetik atau pengiriman hanya-akhir.

## Finalisasi

Saat jawaban akhir siap, OpenClaw mencoba menjaga chat tetap bersih:

- Jika draf dapat dengan aman menjadi jawaban akhir, OpenClaw mengeditnya di tempat.
- Jika channel menggunakan streaming progres native, OpenClaw memfinalisasi stream tersebut saat transport native menerima teks akhir.
- Jika jawaban akhir memiliki media, prompt persetujuan, target balasan eksplisit, terlalu banyak potongan, atau edit/kirim yang gagal, OpenClaw mengirim jawaban akhir melalui jalur pengiriman channel normal.

Jalur fallback ini disengaja. Lebih baik mengirim jawaban akhir baru daripada kehilangan teks, salah menempatkan thread balasan, atau menimpa draf dengan payload yang tidak dapat direpresentasikan channel secara aman.

## Pemecahan Masalah

**Saya hanya melihat jawaban akhir.**

Periksa bahwa `channels.<channel>.streaming.mode` diatur ke `progress` untuk akun atau channel yang menangani pesan. Beberapa jalur grup atau balasan kutipan dapat menonaktifkan pratinjau draf untuk suatu giliran saat channel tidak dapat mengedit pesan yang tepat dengan aman.

**Saya melihat label tetapi tidak ada baris alat.**

Periksa `streaming.progress.toolProgress`. Jika nilainya `false`, OpenClaw mempertahankan perilaku satu draf tetapi menyembunyikan baris progres alat dan tugas.

**Saya melihat pesan akhir baru alih-alih draf yang diedit.**

Itu adalah fallback keselamatan. Ini dapat terjadi untuk balasan media, jawaban panjang, target balasan eksplisit, draf Telegram lama, target thread Slack yang hilang, pesan pratinjau yang dihapus, atau finalisasi stream native yang gagal.

**Saya masih melihat pesan progres mandiri.**

Mode progres menekan pesan progres alat mandiri default saat draf aktif. Jika pesan mandiri masih muncul, verifikasi bahwa giliran tersebut benar-benar menggunakan mode progres dan bukan `streaming.mode: "off"` atau jalur channel yang tidak dapat membuat draf untuk pesan tersebut.

**Teams berperilaku berbeda dari Discord atau Telegram.**

Microsoft Teams menggunakan stream native dalam chat personal alih-alih transport pratinjau kirim-dan-edit generik. Teams juga memperlakukan `streaming.mode: "block"` sebagai pengiriman blok Teams karena tidak memiliki mode blok pratinjau draf yang sama seperti yang digunakan Discord dan Telegram.

## Terkait

- [Streaming dan pemotongan](/id/concepts/streaming)
- [Pesan](/id/concepts/messages)
- [Konfigurasi channel](/id/gateway/config-channels)
- [Discord](/id/channels/discord)
- [Matrix](/id/channels/matrix)
- [Microsoft Teams](/id/channels/msteams)
- [Slack](/id/channels/slack)
- [Telegram](/id/channels/telegram)
