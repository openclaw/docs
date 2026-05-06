---
read_when:
    - Mengonfigurasi pembaruan progres yang terlihat untuk giliran percakapan yang berjalan lama
    - Memilih antara mode streaming parsial, blok, dan progres
    - Menjelaskan cara OpenClaw memperbarui satu pesan saluran saat pekerjaan sedang berlangsung
    - Memecahkan masalah draf progres, pesan progres mandiri, atau mekanisme cadangan finalisasi
summary: 'Draf progres: satu pesan pekerjaan dalam proses yang terlihat dan diperbarui saat agen berjalan'
title: Draf kemajuan
x-i18n:
    generated_at: "2026-05-06T09:08:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b55c016dd7c8f719237d0cf2481e8259c99ac6dc9320c637eaea23c097e910
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Draf progres membuat giliran agen yang berjalan lama terasa hidup di chat tanpa mengubah
percakapan menjadi tumpukan balasan status sementara.

Saat draf progres diaktifkan, OpenClaw membuat satu pesan pekerjaan yang sedang berlangsung
yang terlihat hanya setelah giliran terbukti sedang melakukan pekerjaan nyata, memperbaruinya saat
agen membaca, merencanakan, memanggil alat, atau menunggu persetujuan, lalu mengubah draf itu
menjadi jawaban akhir saat channel dapat melakukannya dengan aman.

```text
Shelling...
📖 Read: from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Exec: run tests
```

Gunakan draf progres saat Anda menginginkan satu pesan status yang rapi selama pekerjaan yang
banyak memakai alat dan jawaban akhir saat giliran selesai.

## Mulai cepat

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

Itu biasanya cukup. OpenClaw akan memilih label satu kata otomatis, menunggu
hingga pekerjaan berlangsung setidaknya lima detik atau memunculkan peristiwa kerja kedua, menambahkan
baris progres ringkas saat pekerjaan berguna terjadi, dan menekan obrolan progres mandiri
duplikat untuk giliran tersebut.

## Yang dilihat pengguna

Draf progres memiliki dua bagian:

| Bagian         | Tujuan                                                                      |
| -------------- | --------------------------------------------------------------------------- |
| Label          | Judul pendek seperti `Thinking...` atau `Shelling...`.                      |
| Baris progres  | Pembaruan proses ringkas menggunakan label alat dan ikon yang sama dengan output verbose. |

Label muncul setelah agen memulai pekerjaan bermakna dan tetap sibuk selama
lima detik atau memunculkan peristiwa kerja kedua. Balasan teks biasa saja tidak
menampilkan draf progres. Baris progres ditambahkan hanya saat agen memunculkan pembaruan
pekerjaan yang berguna, misalnya `🛠️ Exec`, `🔎 Web Search`, atau `✍️ Write: to /tmp/file`.
Secara default, baris itu menggunakan mode penjelasan ringkas yang sama seperti `/verbose`; atur
`agents.defaults.toolProgressDetail: "raw"` saat debugging dan Anda juga menginginkan perintah/detail mentah
ditambahkan.
Jawaban akhir menggantikan draf bila memungkinkan; jika tidak,
OpenClaw mengirim jawaban akhir secara normal dan membersihkan atau berhenti memperbarui
draf sesuai transport channel.

## Pilih mode

`channels.<channel>.streaming.mode` mengontrol perilaku sedang-berjalan yang terlihat:

| Mode       | Paling cocok untuk               | Yang muncul di chat                               |
| ---------- | -------------------------------- | ------------------------------------------------- |
| `off`      | Channel yang senyap              | Hanya jawaban akhir.                              |
| `partial`  | Melihat teks jawaban muncul      | Satu draf yang diedit dengan teks jawaban terbaru. |
| `block`    | Potongan pratinjau jawaban yang lebih besar | Satu pratinjau yang diperbarui atau ditambahkan dalam potongan lebih besar. |
| `progress` | Giliran yang banyak memakai alat atau berjalan lama | Satu draf status, lalu jawaban akhir.             |

Pilih `progress` saat pengguna lebih peduli pada "apa yang sedang terjadi" daripada melihat
teks jawaban dialirkan token demi token.

Pilih `partial` saat jawaban itu sendiri adalah sinyal progres.

Pilih `block` saat Anda menginginkan pembaruan pratinjau draf dalam potongan teks yang lebih besar. Di
Discord dan Telegram, `streaming.mode: "block"` tetap berupa streaming pratinjau, bukan
pengiriman blok normal. Gunakan `streaming.block.enabled` atau
`blockStreaming` lama saat Anda menginginkan balasan blok normal.

## Konfigurasikan label

Label progres berada di bawah `channels.<channel>.streaming.progress`.

Label default adalah `auto`, yang memilih dari kumpulan label bawaan OpenClaw
satu-kata-dengan-elipsis:

```text
Thinking...
Shelling...
Scuttling...
Clawing...
Pinching...
Molting...
Bubbling...
Tiding...
Reefing...
Cracking...
Sifting...
Brining...
Nautiling...
Krilling...
Barnacling...
Lobstering...
Tidepooling...
Pearling...
Snapping...
Surfacing...
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

Sembunyikan label dan tampilkan hanya baris progres:

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

## Kontrol baris progres

Baris progres diaktifkan secara default dalam mode progres. Baris ini berasal dari peristiwa proses
nyata: alat dimulai, item diperbarui, rencana tugas, persetujuan, output perintah, ringkasan patch,
dan aktivitas agen serupa.

OpenClaw menggunakan pemformat yang sama untuk draf progres dan `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // explain | raw
    },
  },
}
```

`"explain"` adalah default dan menjaga draf tetap stabil dengan label ringkas seperti
`🛠️ Exec: check JS syntax for /tmp/app.js`. `"raw"` menambahkan perintah/detail
yang mendasarinya saat tersedia, yang berguna saat debugging tetapi lebih berisik di
chat.

Misalnya, perintah yang sama muncul berbeda tergantung pada mode detail:

| Mode      | Baris progres                                                       |
| --------- | -------------------------------------------------------------------- |
| `explain` | `🛠️ Exec: check JS syntax for /tmp/app.js`                           |
| `raw`     | `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Baris progres dipadatkan secara otomatis untuk mengurangi perubahan tata letak gelembung chat saat draf diedit.

OpenClaw memotong baris progres yang panjang secara default agar pengeditan draf berulang tidak
membungkus secara berbeda pada setiap pembaruan. Prefiks tetap mudah dibaca, dan detail panjang
seperti path atau perintah mentah dipersingkat dengan elipsis.

Slack dapat merender baris progres sebagai field Block Kit terstruktur alih-alih
satu isi teks:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          render: "rich",
        },
      },
    },
  },
}
```

Rendering kaya mempertahankan fallback teks biasa yang sama sehingga channel dan klien yang
tidak mendukung bentuk yang lebih kaya tetap dapat menampilkan teks progres ringkas.

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

Dengan `toolProgress: false`, OpenClaw tetap menekan pesan progres alat mandiri
yang lebih lama untuk giliran tersebut. Channel tetap senyap secara visual hingga
jawaban akhir, kecuali label jika ada yang dikonfigurasi.

## Perilaku channel

Setiap channel menggunakan transport paling bersih yang didukungnya:

| Channel         | Transport progres                      | Catatan                                                               |
| --------------- | -------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Kirim satu pesan, lalu edit pesan itu. | Teks akhir diedit di tempat saat muat dalam satu pesan pratinjau aman. |
| Matrix          | Kirim satu peristiwa, lalu edit peristiwa itu. | Konfigurasi streaming tingkat akun mengontrol draf tingkat akun.       |
| Microsoft Teams | Stream Teams native di chat pribadi.   | `streaming.mode: "block"` dipetakan ke pengiriman blok Teams.          |
| Slack           | Stream native atau posting draf yang dapat diedit. | Ketersediaan thread memengaruhi apakah streaming native dapat digunakan. |
| Telegram        | Kirim satu pesan, lalu edit pesan itu. | Draf lama yang terlihat dapat diganti agar timestamp akhir tetap berguna. |
| Mattermost      | Posting draf yang dapat diedit.        | Aktivitas alat dilipat ke posting bergaya draf yang sama.              |

Channel tanpa dukungan edit yang aman biasanya fallback ke indikator mengetik atau
pengiriman hanya akhir.

## Finalisasi

Saat jawaban akhir siap, OpenClaw mencoba menjaga chat tetap bersih:

- Jika draf dapat dengan aman menjadi jawaban akhir, OpenClaw mengeditnya di tempat.
- Jika channel menggunakan streaming progres native, OpenClaw memfinalisasi stream tersebut
  saat transport native menerima teks akhir.
- Jika jawaban akhir memiliki media, prompt persetujuan, target balasan eksplisit,
  terlalu banyak potongan, atau edit/kirim gagal, OpenClaw mengirim jawaban akhir melalui
  jalur pengiriman channel normal.

Jalur fallback disengaja. Lebih baik mengirim jawaban akhir baru daripada
kehilangan teks, salah menempatkan balasan dalam thread, atau menimpa draf dengan payload yang tidak dapat
direpresentasikan channel dengan aman.

## Pemecahan masalah

**Saya hanya melihat jawaban akhir.**

Periksa bahwa `channels.<channel>.streaming.mode` diatur ke `progress` untuk
akun atau channel yang menangani pesan. Beberapa jalur grup atau balasan kutipan dapat
menonaktifkan pratinjau draf untuk satu giliran saat channel tidak dapat mengedit pesan yang tepat
dengan aman.

**Saya melihat label tetapi tidak ada baris alat.**

Periksa `streaming.progress.toolProgress`. Jika nilainya `false`, OpenClaw mempertahankan
perilaku satu draf tetapi menyembunyikan baris progres alat dan tugas.

**Saya melihat pesan akhir baru alih-alih draf yang diedit.**

Itu adalah fallback keselamatan. Ini dapat terjadi untuk balasan media, jawaban panjang,
target balasan eksplisit, draf Telegram lama, target thread Slack yang hilang,
pesan pratinjau yang dihapus, atau finalisasi stream native yang gagal.

**Saya masih melihat pesan progres mandiri.**

Mode progres menekan pesan progres alat mandiri default saat draf
aktif. Jika pesan mandiri masih muncul, verifikasi bahwa giliran tersebut benar-benar
menggunakan mode progres dan bukan `streaming.mode: "off"` atau jalur channel yang
tidak dapat membuat draf untuk pesan tersebut.

**Teams berperilaku berbeda dari Discord atau Telegram.**

Microsoft Teams menggunakan stream native di chat pribadi alih-alih transport pratinjau
kirim-dan-edit generik. Teams juga memperlakukan `streaming.mode: "block"` sebagai
pengiriman blok Teams karena tidak memiliki mode blok pratinjau draf yang sama
seperti yang digunakan Discord dan Telegram.

## Terkait

- [Streaming dan pemotongan](/id/concepts/streaming)
- [Pesan](/id/concepts/messages)
- [Konfigurasi channel](/id/gateway/config-channels)
- [Discord](/id/channels/discord)
- [Matrix](/id/channels/matrix)
- [Microsoft Teams](/id/channels/msteams)
- [Slack](/id/channels/slack)
- [Telegram](/id/channels/telegram)
