---
read_when:
    - Anda ingin menghubungkan bot Yuanbao
    - Anda sedang mengonfigurasi kanal Yuanbao
summary: Ikhtisar, fitur, dan konfigurasi bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-07-12T14:02:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao adalah platform asisten AI milik Tencent. Plugin `openclaw-plugin-yuanbao` yang dikelola komunitas menghubungkan bot Yuanbao ke OpenClaw melalui WebSocket untuk pesan langsung dan obrolan grup.

**Status:** siap untuk produksi bagi DM bot dan obrolan grup. WebSocket adalah satu-satunya mode koneksi yang didukung. Plugin ini dikelola oleh tim Tencent Yuanbao sebagai entri katalog eksternal, bukan oleh inti OpenClaw; detail konfigurasi/perilaku di bawah ini (selain instalasi dan antarmuka CLI generik) berasal dari dokumentasi plugin itu sendiri dan belum diverifikasi terhadap kode sumber inti OpenClaw.

## Mulai cepat

Memerlukan OpenClaw 2026.4.10 atau yang lebih baru. Periksa dengan `openclaw --version`; tingkatkan dengan `openclaw update`.

<Steps>
  <Step title="Tambahkan kanal Yuanbao dengan kredensial Anda">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` menggunakan `appKey:appSecret` yang dipisahkan dengan titik dua. Dapatkan nilai ini dari aplikasi Yuanbao dengan membuat bot di pengaturan aplikasi Anda.
  </Step>

  <Step title="Mulai ulang Gateway untuk menerapkan perubahan">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Penyiapan interaktif (alternatif)

```bash
openclaw channels login --channel yuanbao
```

Ikuti petunjuk untuk memasukkan App ID dan App Secret Anda.

## Kontrol akses

### Pesan langsung

`channels.yuanbao.dm.policy`:

| Nilai            | Perilaku                                                        |
| ---------------- | --------------------------------------------------------------- |
| `open` (bawaan)  | Izinkan semua pengguna                                          |
| `pairing`        | Pengguna tidak dikenal mendapatkan kode pemasangan; setujui melalui CLI |
| `allowlist`      | Hanya pengguna dalam `allowFrom` yang dapat mengobrol           |
| `disabled`       | Nonaktifkan semua DM                                            |

Setujui permintaan pemasangan:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Obrolan grup

`channels.yuanbao.requireMention` (bawaan `true`): wajibkan @sebutan sebelum bot merespons dalam grup. Membalas pesan bot itu sendiri dianggap sebagai sebutan implisit.

## Contoh konfigurasi

Penyiapan dasar, kebijakan DM terbuka:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

Batasi DM untuk pengguna tertentu:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

Nonaktifkan persyaratan @sebutan dalam grup:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

Penyesuaian pengiriman keluar:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // tampung hingga jumlah karakter ini
      maxChars: 3000, // paksa pemisahan jika melebihi batas ini
      idleMs: 5000, // keluarkan otomatis setelah batas waktu tidak aktif (md)
    },
  },
}
```

Atur `outboundQueueStrategy: "immediate"` untuk mengirim setiap potongan tanpa penampungan.

## Perintah umum

| Perintah   | Deskripsi                       |
| ---------- | ------------------------------- |
| `/help`    | Tampilkan perintah yang tersedia |
| `/status`  | Tampilkan status bot            |
| `/new`     | Mulai sesi baru                 |
| `/stop`    | Hentikan proses saat ini        |
| `/restart` | Mulai ulang OpenClaw            |
| `/compact` | Padatkan konteks sesi           |

Yuanbao mendukung menu perintah garis miring native; perintah disinkronkan ke platform secara otomatis saat Gateway dimulai.

## Pemecahan masalah

**Bot tidak merespons dalam obrolan grup:**

1. Pastikan bot telah ditambahkan ke grup
2. Pastikan Anda @menyebut bot (diwajibkan secara bawaan)
3. Periksa log: `openclaw logs --follow`

**Bot tidak menerima pesan:**

1. Pastikan bot telah dibuat dan disetujui dalam aplikasi Yuanbao
2. Pastikan `appKey` dan `appSecret` dikonfigurasi dengan benar
3. Pastikan Gateway sedang berjalan: `openclaw gateway status`
4. Periksa log: `openclaw logs --follow`

**Bot mengirim balasan kosong atau balasan cadangan:**

1. Periksa apakah model AI mengembalikan konten yang valid
2. Balasan cadangan bawaan: "暂时无法解答，你可以换个问题问问我哦"
3. Sesuaikan dengan `channels.yuanbao.fallbackReply`

**App Secret bocor:**

1. Atur ulang App Secret dalam aplikasi Yuanbao
2. Perbarui nilainya dalam konfigurasi Anda
3. Mulai ulang Gateway: `openclaw gateway restart`

## Konfigurasi lanjutan

### Beberapa akun

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` mengatur akun yang digunakan ketika API keluar tidak menentukan `accountId`.

### Batas pesan

- `maxChars`: jumlah karakter maksimum untuk satu pesan (bawaan `3000`)
- `mediaMaxMb`: batas unggah/unduh media (bawaan `20` MB)
- `overflowPolicy`: perilaku ketika pesan melebihi batas, `"split"` (bawaan) atau `"stop"`

### Streaming

Yuanbao mendukung keluaran streaming tingkat blok; bot mengirim teks dalam potongan saat teks dihasilkan.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // streaming blok diaktifkan (bawaan)
    },
  },
}
```

Atur `disableBlockStreaming: true` untuk mengirim balasan lengkap dalam satu pesan.

### Konteks riwayat obrolan grup

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // bawaan: 100, atur 0 untuk menonaktifkan
    },
  },
}
```

Mengatur jumlah pesan historis yang disertakan dalam konteks AI untuk obrolan grup.

### Mode balas-ke

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (bawaan: "first")
    },
  },
}
```

| Nilai   | Perilaku                                                        |
| ------- | --------------------------------------------------------------- |
| `off`   | Tanpa balasan kutipan                                           |
| `first` | Kutip hanya balasan pertama untuk setiap pesan masuk (bawaan)   |
| `all`   | Kutip setiap balasan                                            |

### Penyisipan petunjuk Markdown

Secara bawaan, bot menyisipkan instruksi prompt sistem untuk mencegah model membungkus seluruh balasan dalam blok kode markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // bawaan: true
    },
  },
}
```

### Mode debug

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

Mengaktifkan keluaran log tanpa sanitasi untuk ID bot yang tercantum.

### Perutean multiagen

Gunakan `bindings` untuk merutekan DM atau grup Yuanbao ke agen yang berbeda:

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (DM) atau `"group"` (obrolan grup)
- `match.peer.id`: ID pengguna atau kode grup

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi Gateway](/id/gateway/configuration)

| Pengaturan                                 | Deskripsi                                                   | Bawaan                                 |
| ------------------------------------------ | ----------------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Aktifkan/nonaktifkan kanal                                  | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Akun bawaan untuk perutean keluar                           | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (penandatanganan + pembuatan tiket)                 | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (penandatanganan)                                | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | Token yang telah ditandatangani (melewati penandatanganan tiket otomatis) | -                         |
| `channels.yuanbao.accounts.<id>.name`      | Nama tampilan akun                                          | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Aktifkan/nonaktifkan akun tertentu                          | `true`                                 |
| `channels.yuanbao.dm.policy`               | Kebijakan DM                                                | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | Daftar izin DM (daftar ID pengguna)                         | -                                      |
| `channels.yuanbao.requireMention`          | Wajibkan @sebutan dalam grup                                | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Penanganan pesan panjang (`split` atau `stop`)              | `split`                                |
| `channels.yuanbao.replyToMode`             | Strategi balas-ke grup (`off`, `first`, `all`)              | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Strategi keluar (`merge-text` atau `immediate`)             | `merge-text`                           |
| `channels.yuanbao.minChars`                | Gabung-teks: karakter minimum untuk memicu pengiriman       | `2800`                                 |
| `channels.yuanbao.maxChars`                | Gabung-teks: karakter maksimum per pesan                    | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Gabung-teks: batas waktu tidak aktif sebelum dikeluarkan otomatis (md) | `5000`                    |
| `channels.yuanbao.mediaMaxMb`              | Batas ukuran media (MB)                                     | `20`                                   |
| `channels.yuanbao.historyLimit`            | Entri konteks riwayat obrolan grup                          | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Nonaktifkan keluaran streaming tingkat blok                 | `false`                                |
| `channels.yuanbao.fallbackReply`           | Balasan cadangan ketika model tidak mengembalikan konten    | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Sisipkan instruksi antipembungkusan markdown                | `true`                                 |
| `channels.yuanbao.debugBotIds`             | ID bot daftar izin debug (log tanpa sanitasi)               | `[]`                                   |

## Jenis pesan yang didukung

**Terima:** teks, gambar, berkas, audio/suara, video, stiker/emoji khusus, elemen khusus (kartu tautan).

**Kirim:** teks (markdown), gambar, berkas, audio, video, stiker.

**Utas dan balasan:** balasan kutipan (dapat dikonfigurasi melalui `replyToMode`); balasan utas tidak didukung oleh platform.

## Terkait

- [Ikhtisar Kanal](/id/channels) - semua kanal yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku obrolan grup dan pembatasan berdasarkan sebutan
- [Perutean Kanal](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan penguatan
