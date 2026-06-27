---
read_when:
    - Mengonfigurasi pembaruan progres yang terlihat untuk giliran chat yang berjalan lama
    - Memilih antara mode streaming parsial, blok, dan progres
    - Menjelaskan cara OpenClaw memperbarui satu pesan saluran saat pekerjaan sedang berlangsung
    - Pemecahan masalah draf progres, pesan progres mandiri, atau fallback finalisasi
summary: 'Draf progres: satu pesan sedang dikerjakan yang terlihat dan diperbarui saat agen berjalan'
title: Draf kemajuan
x-i18n:
    generated_at: "2026-06-27T17:26:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7cc005ed39c2a4a6d887748c769c9d2bb9c133aeeda87b2c11bfe5360f364fdd
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Draf progres membuat giliran agen yang berjalan lama terasa hidup di chat tanpa mengubah
percakapan menjadi tumpukan balasan status sementara.

Ketika draf progres diaktifkan, OpenClaw membuat satu pesan pekerjaan yang sedang berjalan
yang terlihat hanya setelah giliran terbukti sedang melakukan pekerjaan nyata, memperbaruinya saat
agen membaca, merencanakan, memanggil alat, atau menunggu persetujuan, lalu mengubah draf itu
menjadi jawaban akhir saat saluran dapat melakukannya dengan aman.

```text
Shelling...
📖 from docs/concepts/progress-drafts.md
🔎 Web Search: for "discord edit message"
🛠️ Bash: run tests
```

Gunakan draf progres ketika Anda menginginkan satu pesan status yang rapi selama pekerjaan yang banyak memakai alat
dan jawaban akhir saat giliran selesai.

## Mulai cepat

Aktifkan draf progres per saluran dengan `streaming.mode: "progress"`:

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
hingga pekerjaan berlangsung setidaknya lima detik atau mengeluarkan peristiwa kerja kedua, menambahkan baris
progres ringkas selama pekerjaan berguna berlangsung, dan menekan obrolan progres mandiri yang duplikat
untuk giliran tersebut.

## Yang dilihat pengguna

Draf progres memiliki dua bagian:

| Bagian         | Tujuan                                                                                |
| -------------- | ------------------------------------------------------------------------------------- |
| Label          | Baris pembuka/status singkat seperti `Working` atau `Shelling`.                       |
| Baris progres  | Pembaruan eksekusi ringkas memakai ikon alat dan pemformat detail yang sama seperti keluaran verbose. |

Label muncul setelah agen memulai pekerjaan bermakna dan tetap sibuk
selama lima detik atau mengeluarkan peristiwa kerja kedua. Label menjadi bagian dari daftar baris progres
bergulir, sehingga status pembuka bergeser hilang setelah cukup banyak pekerjaan konkret muncul.
Balasan teks biasa saja tidak menampilkan draf progres. Baris progres ditambahkan
hanya ketika agen mengeluarkan pembaruan pekerjaan yang berguna, misalnya `🛠️ Bash: run tests`,
`🔎 Web Search: for "discord edit message"`, atau `✍️ Write: to /tmp/file`.
Secara default, baris tersebut menggunakan mode penjelasan ringkas yang sama seperti `/verbose`; atur
`agents.defaults.toolProgressDetail: "raw"` saat men-debug dan Anda juga menginginkan perintah/detail mentah
ditambahkan.
Jawaban akhir menggantikan draf jika memungkinkan; jika tidak,
OpenClaw mengirim jawaban akhir secara normal dan membersihkan atau berhenti memperbarui
draf sesuai transport saluran.

## Pilih mode

`channels.<channel>.streaming.mode` mengontrol perilaku pekerjaan yang sedang berjalan yang terlihat:

| Mode       | Paling cocok untuk                | Yang muncul di chat                               |
| ---------- | --------------------------------- | ------------------------------------------------- |
| `off`      | Saluran yang senyap               | Hanya jawaban akhir.                              |
| `partial`  | Melihat teks jawaban muncul       | Satu draf diedit dengan teks jawaban terbaru.     |
| `block`    | Potongan pratinjau jawaban lebih besar | Satu pratinjau diperbarui atau ditambahkan dalam potongan lebih besar. |
| `progress` | Giliran yang banyak memakai alat atau berjalan lama | Satu draf status, lalu jawaban akhir.             |

Pilih `progress` ketika pengguna lebih peduli pada "apa yang sedang terjadi" daripada melihat
teks jawaban mengalir token demi token.

Pilih `partial` ketika jawaban itu sendiri adalah sinyal progres.

Pilih `block` ketika Anda menginginkan pembaruan pratinjau draf dalam potongan teks yang lebih besar. Di
Discord dan Telegram, `streaming.mode: "block"` tetap merupakan streaming pratinjau, bukan
pengiriman blok normal. Gunakan `streaming.block.enabled` atau legacy
`blockStreaming` ketika Anda menginginkan balasan blok normal.

## Konfigurasi label

Label progres berada di bawah `channels.<channel>.streaming.progress`.

Label default adalah `auto`, yang memilih dari kumpulan label satu kata bawaan OpenClaw:

```text
Working
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

Baris progres diaktifkan secara default dalam mode progres. Baris ini berasal dari peristiwa eksekusi nyata:
awal alat, pembaruan item, rencana tugas, persetujuan, keluaran perintah, ringkasan patch,
dan aktivitas agen serupa.

Alat juga dapat mengeluarkan progres bertipe saat satu panggilan alat masih berjalan.
Begitulah pengambilan atau pencarian yang lambat dapat memperbarui draf yang terlihat sebelum alat
mengembalikan hasil akhirnya. Pembaruan progres adalah hasil alat parsial dengan
konten model kosong dan metadata saluran publik eksplisit:

```json
{
  "content": [],
  "progress": {
    "text": "Fetching page content...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw hanya merender `progress.text` di UI progres saluran. Hasil alat
normal tetap tiba nanti sebagai `content` dan `details`, dan merupakan
satu-satunya bagian yang dikembalikan ke model.

Saat menambahkan progres ke alat, gunakan pesan yang singkat dan generik serta tunda hingga
operasi telah tertunda cukup lama untuk berguna:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Fetching page content...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Pola ini berarti panggilan cepat tidak menampilkan baris progres, panggilan lama menampilkan satu baris
saat masih tertunda, dan panggilan yang dibatalkan membersihkan timer sebelum progres usang
dapat muncul. Teks progres adalah saluran samping UI publik, sehingga tidak boleh
menyertakan rahasia, argumen mentah, konten yang diambil, keluaran perintah, atau teks halaman.

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
`🛠️ check JS syntax for /tmp/app.js`. `"raw"` menambahkan
perintah/detail dasar bila tersedia, yang berguna saat debugging tetapi lebih berisik di
chat.

Sebagai contoh, perintah yang sama muncul berbeda tergantung pada mode detail:

| Mode      | Baris progres                                                 |
| --------- | ------------------------------------------------------------- |
| `explain` | `🛠️ check JS syntax for /tmp/app.js`                          |
| `raw`     | `🛠️ check JS syntax for /tmp/app.js, node --check /tmp/app.js` |

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

Baris progres dipadatkan secara otomatis untuk mengurangi pengaliran ulang gelembung chat saat draf diedit.

OpenClaw memotong baris progres yang panjang secara default agar pengeditan draf berulang tidak
terlipat berbeda pada setiap pembaruan. Anggaran default per baris adalah 120 karakter.
Prosa dipotong pada batas kata, sedangkan detail panjang seperti path atau perintah mentah
dipersingkat dengan elipsis tengah sehingga akhiran tetap terlihat.

Sesuaikan anggaran per baris:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          maxLineChars: 160,
        },
      },
    },
  },
}
```

Slack dapat merender baris progres sebagai field Block Kit terstruktur, bukan
satu badan teks:

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

Rendering kaya mempertahankan fallback teks biasa yang sama sehingga saluran dan klien yang
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

Dengan `toolProgress: false`, OpenClaw tetap menekan pesan
progres alat mandiri lama untuk giliran tersebut. Saluran tetap senyap secara visual hingga
jawaban akhir, kecuali label jika ada yang dikonfigurasi.

## Perilaku saluran

Setiap saluran menggunakan transport paling bersih yang didukungnya:

| Saluran         | Transport progres                       | Catatan                                                               |
| --------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Discord         | Kirim satu pesan, lalu edit.            | Teks akhir diedit di tempat saat muat dalam satu pesan pratinjau aman. |
| Matrix          | Kirim satu peristiwa, lalu edit.        | Konfigurasi streaming tingkat akun mengontrol draf tingkat akun.      |
| Microsoft Teams | Stream Teams native di chat pribadi.    | `streaming.mode: "block"` dipetakan ke pengiriman blok Teams.         |
| Slack           | Stream native atau posting draf yang dapat diedit. | Ketersediaan thread memengaruhi apakah streaming native dapat digunakan. |
| Telegram        | Kirim satu pesan, lalu edit.            | Draf lama yang terlihat dapat diganti agar timestamp akhir tetap berguna. |
| Mattermost      | Posting draf yang dapat diedit.         | Aktivitas alat dilipat ke posting bergaya draf yang sama.             |

Saluran tanpa dukungan edit yang aman biasanya fallback ke indikator mengetik atau
pengiriman hanya-final.

## Finalisasi

Saat jawaban akhir siap, OpenClaw mencoba menjaga chat tetap bersih:

- Jika draf dapat dengan aman menjadi jawaban akhir, OpenClaw mengeditnya di tempat.
- Jika saluran menggunakan streaming progres native, OpenClaw menyelesaikan stream tersebut
  saat transport native menerima teks akhir.
- Jika jawaban akhir memiliki media, prompt persetujuan, target balasan eksplisit,
  terlalu banyak potongan, atau edit/kirim yang gagal, OpenClaw mengirim jawaban akhir melalui
  jalur pengiriman saluran normal.

Jalur fallback ini disengaja. Lebih baik mengirim jawaban akhir baru daripada
kehilangan teks, salah menempatkan balasan dalam thread, atau menimpa draf dengan payload yang tidak dapat
direpresentasikan saluran secara aman.

## Pemecahan masalah

**Saya hanya melihat jawaban akhir.**

Periksa bahwa `channels.<channel>.streaming.mode` diatur ke `progress` untuk
akun atau saluran yang menangani pesan. Beberapa jalur grup atau balasan kutipan dapat
menonaktifkan pratinjau draf untuk suatu giliran ketika saluran tidak dapat mengedit pesan yang tepat
dengan aman.

**Saya melihat label tetapi tidak ada baris alat.**

Periksa `streaming.progress.toolProgress`. Jika nilainya `false`, OpenClaw mempertahankan
perilaku satu draf tetapi menyembunyikan baris progres alat dan tugas.

**Saya melihat pesan akhir baru, bukan draf yang diedit.**

Itu adalah fallback keselamatan. Ini dapat terjadi untuk balasan media, jawaban panjang,
target balasan eksplisit, draf Telegram lama, target thread Slack yang hilang,
pesan pratinjau yang dihapus, atau finalisasi stream native yang gagal.

**Saya masih melihat pesan progres mandiri.**

Mode progres menekan pesan progres alat mandiri default saat sebuah draf
aktif. Jika pesan mandiri masih muncul, pastikan giliran tersebut benar-benar
menggunakan mode progres dan bukan `streaming.mode: "off"` atau jalur saluran yang
tidak dapat membuat draf untuk pesan tersebut.

**Teams berperilaku berbeda dari Discord atau Telegram.**

Microsoft Teams menggunakan stream native dalam obrolan pribadi alih-alih transport pratinjau kirim-dan-edit generik. Teams juga memperlakukan `streaming.mode: "block"` sebagai pengiriman blok Teams karena tidak memiliki mode blok pratinjau draf yang sama seperti yang digunakan oleh Discord dan Telegram.

## Terkait

- [Streaming dan pemotongan](/id/concepts/streaming)
- [Pesan](/id/concepts/messages)
- [Konfigurasi channel](/id/gateway/config-channels)
- [Discord](/id/channels/discord)
- [Matrix](/id/channels/matrix)
- [Microsoft Teams](/id/channels/msteams)
- [Slack](/id/channels/slack)
- [Telegram](/id/channels/telegram)
