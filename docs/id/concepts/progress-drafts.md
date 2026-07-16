---
read_when:
    - Mengonfigurasi pembaruan progres yang terlihat untuk giliran percakapan yang berjalan lama
    - Memilih antara mode streaming parsial, blok, dan progres
    - Menjelaskan cara OpenClaw memperbarui satu pesan saluran saat pekerjaan sedang berlangsung
    - Draf progres pemecahan masalah, pesan progres mandiri, atau mekanisme cadangan penyelesaian akhir
summary: 'Draf progres: satu pesan pekerjaan yang sedang berlangsung dan terlihat, yang diperbarui saat agen berjalan'
title: Draf kemajuan
x-i18n:
    generated_at: "2026-07-16T18:01:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ef66dd4d7a31c753f5faa0b88b83ec3760beecf3118cf8aae84f5e57652e809
    source_path: concepts/progress-drafts.md
    workflow: 16
---

Draf progres mengubah satu pesan kanal menjadi baris status langsung saat
agen bekerja, alih-alih tumpukan balasan sementara "masih bekerja". Tetapkan
`channels.<channel>.streaming.mode: "progress"` dan OpenClaw akan membuat
pesan setelah pekerjaan nyata dimulai, mengeditnya saat agen membaca, merencanakan, memanggil
alat, atau menunggu persetujuan, lalu mengubahnya menjadi jawaban akhir.

```text
Sedang bekerja...
📖 dari docs/concepts/progress-drafts.md
🔎 Pencarian Web: untuk "discord edit message"
🛠️ Bash: jalankan pengujian
```

<Note>
  Discord sudah menggunakan `streaming.mode: "progress"` secara default saat
  `channels.discord.streaming` tidak ditetapkan, sehingga draf progres
  muncul di sana tanpa konfigurasi apa pun. Setiap kanal lain menggunakan `partial`
  atau `off` secara default; lihat [Streaming dan pemotongan](/id/concepts/streaming#channel-mapping)
  untuk tabel default lengkap per kanal.
</Note>

## Mulai cepat

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

Default dari sini: penundaan awal selama 5 detik, baris progres ringkas saat
pekerjaan berguna berlangsung, dan penyembunyian pesan progres mandiri lama
untuk giliran tersebut. Draf baris alat mentah menggunakan
label satu kata otomatis; judul status menghilangkan judul berlebihan tersebut
kecuali Anda mengonfigurasinya secara eksplisit.

Halaman ini membahas pengalaman draf progres dan opsi konfigurasinya. Untuk
matriks lengkap mode streaming, catatan runtime per kanal, dan migrasi kunci
lama, lihat [Streaming dan pemotongan](/id/concepts/streaming).

## Yang dilihat pengguna

| Bagian          | Tujuan                                                                                  |
| --------------- | --------------------------------------------------------------------------------------- |
| Judul status    | Di Discord dan Telegram, preambul model; Discord menambahkan teks pengisi utilitas.     |
| Label           | Baris awal/status opsional seperti `Working`.                                  |
| Baris progres   | Pembaruan proses ringkas yang menggunakan ikon alat dan pemformat detail yang sama seperti `/verbose`. |

Untuk progres alat mentah, label muncul setelah agen memulai pekerjaan bermakna
dan tetap sibuk selama penundaan awal.
Label berada di bagian atas daftar baris progres yang terus bergulir, sehingga akan tergulir keluar setelah
cukup banyak baris pekerjaan konkret muncul. Judul status hanya menampilkan status
agen dalam bahasa biasa kecuali label dikonfigurasi secara eksplisit. Balasan yang
hanya berupa teks biasa tidak pernah menampilkan draf progres; baris hanya muncul untuk pembaruan pekerjaan nyata,
misalnya `🛠️ Bash: run tests`, `🔎 Web Search: for "discord edit message"`,
atau `✍️ Write: to /tmp/file`.

Jawaban akhir menggantikan draf di tempatnya jika kanal dapat melakukannya dengan aman;
jika tidak, OpenClaw mengirim jawaban akhir melalui pengiriman normal dan
membersihkan atau berhenti memperbarui draf (lihat [Finalisasi](#finalization)).

## Pilih mode

`channels.<channel>.streaming.mode` mengontrol perilaku yang terlihat selama proses berlangsung:

| Mode       | Paling cocok untuk                 | Yang muncul dalam obrolan                            |
| ---------- | ---------------------------------- | ---------------------------------------------------- |
| `off`      | Kanal yang tenang                   | Hanya jawaban akhir.                                 |
| `partial`  | Melihat teks jawaban muncul         | Satu draf yang diedit dengan teks jawaban terbaru.   |
| `block`    | Potongan pratinjau jawaban lebih besar | Satu pratinjau yang diperbarui atau ditambahkan dalam potongan lebih besar. |
| `progress` | Giliran sarat alat atau berjalan lama | Satu draf status, lalu jawaban akhir.                 |

Pilih `progress` ketika pengguna lebih peduli pada "apa yang sedang terjadi" daripada melihat
teks jawaban dialirkan token demi token; `partial` ketika teks jawaban itu sendiri menjadi
sinyal progres; `block` untuk potongan pratinjau yang lebih besar. Di Discord dan
Telegram, `streaming.mode: "block"` tetap merupakan streaming pratinjau, bukan
pengiriman balasan blok biasa — gunakan `streaming.block.enabled` untuk itu.

## Konfigurasikan label

Label progres berada di bawah `channels.<channel>.streaming.progress`. Label
baris alat mentah default adalah `"auto"`, yang menggunakan label bawaan sederhana `Working`.
Judul status menyembunyikan label implisit tersebut; tetapkan
`label: "auto"` secara eksplisit jika Anda juga menginginkan label di atasnya:

```text
Sedang bekerja
```

Gunakan label tetap:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "Menyelidiki",
        },
      },
    },
  },
}
```

Gunakan kumpulan label Anda sendiri (tetap dipilih secara acak/berdasarkan seed saat `label: "auto"`):

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          labels: ["Memeriksa", "Membaca", "Menguji", "Menyelesaikan"],
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

## Kontrol baris progres

Baris progres berasal dari peristiwa proses nyata: alat dimulai, pembaruan item, rencana
tugas, persetujuan, keluaran perintah, ringkasan patch, dan aktivitas agen serupa.
Baris ini diaktifkan secara default (`progress.toolProgress`, default `true`).

Alat juga dapat memancarkan progres bertipe saat satu panggilan masih berjalan. Dengan cara ini,
pengambilan atau pencarian yang lambat memperbarui draf yang terlihat sebelum alat
mengembalikan hasil akhirnya. Pembaruan progres merupakan hasil alat parsial dengan
konten model kosong dan metadata kanal publik yang eksplisit:

```json
{
  "content": [],
  "progress": {
    "text": "Mengambil konten halaman...",
    "visibility": "channel",
    "privacy": "public",
    "id": "web_fetch:fetching"
  }
}
```

OpenClaw hanya merender `progress.text` di UI progres kanal. Hasil
alat normal tetap tiba kemudian sebagai `content`/`details` dan merupakan satu-satunya bagian
yang dikembalikan ke model.

Saat menambahkan progres ke alat, pancarkan pesan singkat dan umum, lalu tunda
hingga operasi telah tertunda cukup lama agar berguna. `web_fetch`
melakukan hal ini dengan penundaan 5 detik:

```typescript
const clearProgressTimer = scheduleToolProgress(
  onUpdate,
  { text: "Mengambil konten halaman...", id: "web_fetch:fetching" },
  5_000,
  { signal },
);

try {
  return await runToolWork();
} finally {
  clearProgressTimer();
}
```

Panggilan cepat tidak menampilkan baris progres; panggilan lama menampilkannya saat masih tertunda;
panggilan yang dibatalkan menghapus timer sebelum progres usang dapat muncul. Teks progres
merupakan kanal samping UI publik, sehingga tidak boleh memuat rahasia, argumen mentah,
konten yang diambil, keluaran perintah, atau teks halaman.

### Mode detail

OpenClaw menggunakan pemformat yang sama untuk draf progres dan `/verbose`:

```json5
{
  agents: {
    defaults: {
      toolProgressDetail: "explain", // jelaskan | mentah
    },
  },
}
```

`"explain"` adalah default dan menjaga kestabilan draf dengan label ringkas.
`"raw"` menambahkan perintah yang mendasarinya jika tersedia, yang berguna saat
melakukan debug tetapi lebih ramai dalam obrolan. Misalnya, panggilan `node --check /tmp/app.js`
dirender secara berbeda menurut mode:

| Mode      | Baris progres                                                    |
| --------- | ---------------------------------------------------------------- |
| `explain` | `🛠️ check js syntax for /tmp/app.js`                                     |
| `raw`     | `🛠️ check js syntax for /tmp/app.js · node --check /tmp/app.js`                                  |

### Teks perintah/exec

`streaming.progress.commandText` (default `"raw"`) mengontrol seberapa banyak detail perintah
yang ditampilkan di samping baris progres exec/bash, terlepas dari mode detail
di atas. Tetapkan ke `"status"` agar baris progres alat tetap terlihat sekaligus menyembunyikan
teks perintah sepenuhnya:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          commandText: "status",
        },
      },
    },
  },
}
```

### Jalur komentar

`streaming.progress.commentary` (default `false`) menyisipkan narasi
komentar/preambul pra-alat model (💬, misalnya "Saya akan memeriksa... lalu
...") di antara baris alat dalam draf. Lihat
[Streaming dan pemotongan](/id/concepts/streaming#commentary-progress-lane) untuk
bentuk konfigurasi bersama di seluruh kanal.

Saat jalur komentar diaktifkan, preambul hanya dirender sebagai baris 💬 yang disisipkan
tersebut; judul status di bawah tidak menghalangi sehingga jalur mempertahankan
bentuk yang didokumentasikan.

### Judul status

Di Discord dan Telegram dalam mode progres, preambul pra-alat bertipe dari model
menjadi judul status draf setiap kali tersedia. Kanal lain dalam
mode progres mempertahankan perilaku status yang sudah ada. Judul ini aktif
secara default dan tidak melewati gerbang aktivitas normal untuk giliran singkat;
mengaktifkan `streaming.progress.commentary` menyerahkan preambul ke jalur
komentar yang disisipkan sebagai gantinya.

Di Discord, ketika model utilitas ditentukan untuk agen — [`utilityModel`](/id/gateway/config-agents#utilitymodel)
eksplisit, atau default model kecil yang dinyatakan oleh
penyedia utama (OpenAI → `gpt-5.6-luna`,
Anthropic → `claude-haiku-4-5`) — model tersebut menyediakan teks pengisi singkat dalam bahasa biasa
saat model tidak memancarkan preambul atau diam selama sekitar 20 detik
(judul Telegram saat ini hanya menggunakan preambul):

```text
Memperbarui model default dalam konfigurasi Anda, lalu memulai ulang gateway agar
perubahan diterapkan. Satu panggilan daftar agen gagal dan sedang dicoba ulang.
```

Narasi utilitas aktif secara default (`streaming.progress.narration`, default
`true`) dan tidak pernah beralih ke model utama sebagai fallback: narasi hanya berjalan dengan
`utilityModel` eksplisit atau default yang dinyatakan penyedia untuk penyedia
utama agen. Tetapkan `utilityModel: ""` untuk menonaktifkan perutean utilitas sepenuhnya. Baris alat
terus terakumulasi di bawahnya dan muncul kembali jika kedua sumber status berhenti. Pengeditan
draf tetap menunggu gerbang aktivitas normal dan perubahan
teks yang nyata, sehingga menghindari kilatan pada giliran cepat dan mengurangi frekuensi pengeditan di kanal
yang sibuk. Tetapkan `narration: false` untuk hanya menonaktifkan teks pengisi model utilitas; judul
preambul model tetap diaktifkan:

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          narration: false,
        },
      },
    },
  },
}
```

Input narasi dibatasi dan disunting: model utilitas menerima
teks permintaan masuk ditambah ringkasan alat ringkas dan tersunting yang sama dengan yang akan dirender
oleh draf — tidak pernah keluaran perintah mentah atau hasil alat. Dengan
`commandText: "status"`, input narasi juga menghilangkan teks perintah exec/bash,
sesuai dengan yang ditampilkan draf.

### Batas baris

Batasi jumlah baris yang tetap terlihat (default 8):

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

Baris progres dipadatkan secara otomatis untuk mengurangi perubahan tata letak gelembung obrolan saat
draf diedit, dan OpenClaw memotong baris panjang agar pengeditan draf berulang
tidak terbungkus secara berbeda pada setiap pembaruan. Batas default per baris adalah 120
karakter; prosa dipotong pada batas kata, sedangkan detail panjang seperti jalur atau
perintah mentah dipendekkan dengan elipsis di tengah agar sufiks tetap terlihat.

Sesuaikan batas per baris:

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

### Rendering kaya (Slack)

Slack dapat merender baris progres sebagai bidang Block Kit terstruktur alih-alih
teks biasa:

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

Rendering kaya selalu mengirim isi teks biasa yang sama bersama bidang Block Kit,
sehingga klien yang tidak dapat merender bentuk yang lebih kaya tetap menampilkan teks
progres ringkas.

### Sembunyikan baris alat/tugas

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

Dengan `toolProgress: false`, OpenClaw tetap menekan pesan progres alat mandiri yang lama
untuk giliran tersebut — saluran tetap terlihat tenang hingga
jawaban akhir, kecuali label jika dikonfigurasi.

## Perilaku saluran

| Saluran         | Transpor progres                         | Catatan                                                                                                                                                     |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Kirim satu pesan, lalu edit pesan tersebut. | Secara default menggunakan mode `progress`; jawaban akhir memuat tanda terima aktivitas `-#` dan draf status dihapus setelah jawaban terkirim. |
| Matrix          | Kirim satu peristiwa, lalu edit peristiwa tersebut. | Konfigurasi streaming tingkat akun mengontrol draf tingkat akun.                                                                                         |
| Microsoft Teams | Stream Teams native dalam obrolan pribadi. | `streaming.mode: "block"` dipetakan ke pengiriman blok Teams sebagai gantinya.                                                                                      |
| Slack           | Stream native atau kiriman draf yang dapat diedit. | Memerlukan target utas balasan; DM tingkat atas tanpa target tetap mendapatkan kiriman pratinjau draf dan pengeditan.                                    |
| Telegram        | Kirim satu pesan, lalu edit pesan tersebut. | Jika sebuah pesan masuk di antara draf progres dan jawaban, draf dikirim ulang di bawahnya (kirim-yang-baru-lalu-hapus-yang-lama), alih-alih membuat klien melompat saat menggulir. |
| Mattermost      | Kiriman draf yang dapat diedit.           | Mode `block` bergantian antara teks yang selesai dan kiriman aktivitas alat; mode lain menggabungkan aktivitas alat ke dalam kiriman bergaya draf yang sama. |

Saluran tanpa dukungan pengeditan yang aman kembali menggunakan indikator sedang mengetik atau
pengiriman hanya-jawaban-akhir. Lihat [Streaming dan pemotongan](/id/concepts/streaming) untuk
rincian lengkap perilaku runtime per saluran.

## Finalisasi

Saat jawaban akhir siap, OpenClaw berupaya menjaga obrolan tetap rapi:

- Dalam mode `progress` di Discord, jawaban akhir dikirim sebagai pesan baru
  dengan tanda terima aktivitas `-#` kecil yang ditambahkan (misalnya
  `-# 🧠 2 thoughts · 🛠️ 5 tool calls · ⏱️ 12s`), dan draf status
  dihapus setelah jawaban tersebut terkirim. Saluran yang sibuk tidak menyisakan log alat
  tanpa pasangan di atas balasan; jawaban akhir yang berisi kesalahan mempertahankan draf sebagai catatan yang terlihat untuk
  giliran yang gagal.
- Jika draf dapat dengan aman menjadi jawaban akhir (mode `partial`/`block`),
  OpenClaw mengeditnya di tempat.
- Jika saluran menggunakan streaming progres native, OpenClaw memfinalisasi
  stream tersebut saat transpor native menerima teks akhir.
- Jika tidak (media, perintah persetujuan, target balasan eksplisit, terlalu banyak
  potongan, atau kegagalan edit/kirim), OpenClaw mengirim jawaban akhir melalui
  jalur pengiriman saluran normal, alih-alih menimpa draf.

Fallback ini disengaja: mengirim jawaban akhir baru lebih baik daripada kehilangan teks,
salah menempatkan balasan dalam utas, atau menimpa draf dengan payload yang tidak dapat
direpresentasikan secara aman oleh saluran.

## Pemecahan masalah

**Saya hanya melihat jawaban akhir.**

Pastikan `channels.<channel>.streaming.mode` bernilai `progress` untuk akun
atau saluran yang menangani pesan. Beberapa jalur grup atau balasan-kutipan menonaktifkan
pratinjau draf untuk suatu giliran ketika saluran tidak dapat mengedit pesan yang tepat
secara aman.

**Saya melihat label, tetapi tidak ada baris alat.**

Periksa `streaming.progress.toolProgress`. Jika nilainya `false`, OpenClaw mempertahankan
perilaku draf tunggal, tetapi menyembunyikan baris progres alat dan tugas.

**Saya melihat pesan akhir baru, bukan draf yang diedit.**

Itulah fallback keamanan yang dijelaskan dalam [Finalisasi](#finalization). Hal ini dapat
terjadi pada balasan media, jawaban panjang, target balasan eksplisit, draf Telegram
lama, target utas Slack yang tidak ada, pesan pratinjau yang dihapus, atau kegagalan
finalisasi stream native.

**Saya masih melihat pesan progres mandiri.**

Mode progres menekan pesan progres alat mandiri default setiap kali
draf aktif. Jika pesan mandiri masih muncul, pastikan giliran tersebut
benar-benar menggunakan mode `progress`, bukan `streaming.mode: "off"` atau jalur
saluran yang tidak dapat membuat draf untuk pesan tersebut.

**Teams berperilaku berbeda dari Discord atau Telegram.**

Microsoft Teams menggunakan stream native dalam obrolan pribadi, bukan transpor
pratinjau kirim-dan-edit generik, dan memetakan `streaming.mode: "block"` ke
pengiriman blok Teams karena tidak memiliki mode blok pratinjau draf seperti Discord dan
Telegram.

## Terkait

- [Streaming dan pemotongan](/id/concepts/streaming)
- [Pesan](/id/concepts/messages)
- [Konfigurasi saluran](/id/gateway/config-channels)
- [Discord](/id/channels/discord)
- [Matrix](/id/channels/matrix)
- [Microsoft Teams](/id/channels/msteams)
- [Slack](/id/channels/slack)
- [Telegram](/id/channels/telegram)
- [Mattermost](/id/channels/mattermost)
