---
read_when:
    - Anda ingin menghubungkan bot Yuanbao
    - Anda sedang mengonfigurasi kanal Yuanbao
summary: Ikhtisar, fitur, dan konfigurasi bot Yuanbao
title: Yuanbao
x-i18n:
    generated_at: "2026-05-06T09:04:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3830af0206854e500132edfc9340724fe97f90ca60fa23ce05202d96d9cacf04
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao adalah platform asisten AI Tencent. Plugin saluran OpenClaw
menghubungkan bot Yuanbao ke OpenClaw melalui WebSocket sehingga bot dapat berinteraksi dengan pengguna
melalui pesan langsung dan obrolan grup.

**Status:** siap produksi untuk DM bot + obrolan grup. WebSocket adalah satu-satunya mode koneksi yang didukung.

---

## Mulai cepat

> **Memerlukan OpenClaw 2026.4.10 atau lebih baru.** Jalankan `openclaw --version` untuk memeriksa. Tingkatkan dengan `openclaw update`.

<Steps>
  <Step title="Tambahkan saluran Yuanbao dengan kredensial Anda">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  Nilai `--token` menggunakan format `appKey:appSecret` yang dipisahkan titik dua. Anda dapat memperolehnya dari aplikasi Yuanbao dengan membuat robot di pengaturan aplikasi Anda.
  </Step>

  <Step title="Setelah penyiapan selesai, mulai ulang Gateway untuk menerapkan perubahan">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Penyiapan interaktif (alternatif)

Anda juga dapat menggunakan wizard interaktif:

```bash
openclaw channels login --channel yuanbao
```

Ikuti prompt untuk memasukkan App ID dan App Secret Anda.

---

## Kontrol akses

### Pesan langsung

Konfigurasikan `dmPolicy` untuk mengontrol siapa yang dapat mengirim DM ke bot:

- `"pairing"` - pengguna tidak dikenal menerima kode pairing; setujui melalui CLI
- `"allowlist"` - hanya pengguna yang tercantum di `allowFrom` yang dapat mengobrol
- `"open"` - izinkan semua pengguna (default)
- `"disabled"` - nonaktifkan semua DM

**Setujui permintaan pairing:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Obrolan grup

**Persyaratan penyebutan** (`channels.yuanbao.requireMention`):

- `true` - memerlukan @mention (default)
- `false` - merespons tanpa @mention

Membalas pesan bot dalam obrolan grup diperlakukan sebagai penyebutan implisit.

---

## Contoh konfigurasi

### Penyiapan dasar dengan kebijakan DM terbuka

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

### Batasi DM ke pengguna tertentu

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

### Nonaktifkan persyaratan @mention di grup

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Optimalkan pengiriman pesan keluar

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Sesuaikan strategi merge-text

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## Perintah umum

| Perintah   | Deskripsi                       |
| ---------- | ------------------------------- |
| `/help`    | Tampilkan perintah yang tersedia |
| `/status`  | Tampilkan status bot            |
| `/new`     | Mulai sesi baru                 |
| `/stop`    | Hentikan proses saat ini        |
| `/restart` | Mulai ulang OpenClaw            |
| `/compact` | Ringkas konteks sesi            |

> Yuanbao mendukung menu perintah slash native. Perintah disinkronkan ke platform secara otomatis saat Gateway dimulai.

---

## Pemecahan masalah

### Bot tidak merespons dalam obrolan grup

1. Pastikan bot ditambahkan ke grup
2. Pastikan Anda @mention bot (diwajibkan secara default)
3. Periksa log: `openclaw logs --follow`

### Bot tidak menerima pesan

1. Pastikan bot dibuat dan disetujui di aplikasi Yuanbao
2. Pastikan `appKey` dan `appSecret` dikonfigurasi dengan benar
3. Pastikan Gateway berjalan: `openclaw gateway status`
4. Periksa log: `openclaw logs --follow`

### Bot mengirim balasan kosong atau fallback

1. Periksa apakah model AI mengembalikan konten yang valid
2. Balasan fallback default adalah: "暂时无法解答，你可以换个问题问问我哦"
3. Sesuaikan melalui `channels.yuanbao.fallbackReply`

### App Secret bocor

1. Reset App Secret di YuanBao APP
2. Perbarui nilainya di konfigurasi Anda
3. Mulai ulang Gateway: `openclaw gateway restart`

---

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

`defaultAccount` mengontrol akun yang digunakan saat API keluar tidak menentukan `accountId`.

### Batas pesan

- `maxChars` - jumlah karakter maksimum pesan tunggal (default: `3000` karakter)
- `mediaMaxMb` - batas unggah/unduh media (default: `20` MB)
- `overflowPolicy` - perilaku saat pesan melebihi batas: `"split"` (default) atau `"stop"`

### Streaming

Yuanbao mendukung output streaming tingkat blok. Saat diaktifkan, bot mengirim teks dalam potongan saat dihasilkan.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Tetapkan `disableBlockStreaming: true` untuk mengirim balasan lengkap dalam satu pesan.

### Konteks riwayat obrolan grup

Kontrol jumlah pesan historis yang disertakan dalam konteks AI untuk obrolan grup:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Mode reply-to

Kontrol cara bot mengutip pesan saat membalas di obrolan grup:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Nilai     | Perilaku                                                  |
| --------- | --------------------------------------------------------- |
| `"off"`   | Tidak ada balasan kutipan                                 |
| `"first"` | Kutip hanya balasan pertama per pesan masuk (default)     |
| `"all"`   | Kutip setiap balasan                                      |

### Injeksi petunjuk Markdown

Secara default, bot menyisipkan instruksi dalam prompt sistem untuk mencegah model AI membungkus seluruh balasan dalam blok kode markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Mode debug

Aktifkan output log tanpa sanitasi untuk ID bot tertentu:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Routing multi-agen

Gunakan `bindings` untuk merutekan DM atau grup Yuanbao ke agen yang berbeda.

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

Kolom routing:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (DM) atau `"group"` (obrolan grup)
- `match.peer.id`: ID pengguna atau kode grup

---

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi Gateway](/id/gateway/configuration)

| Pengaturan                                | Deskripsi                                           | Default                                |
| ----------------------------------------- | --------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                | Aktifkan/nonaktifkan saluran                        | `true`                                 |
| `channels.yuanbao.defaultAccount`         | Akun default untuk routing keluar                   | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`   | App Key (digunakan untuk penandatanganan dan pembuatan ticket) | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (digunakan untuk penandatanganan)        | -                                      |
| `channels.yuanbao.accounts.<id>.token`    | Token pra-tanda tangan (melewati penandatanganan ticket otomatis) | -                                      |
| `channels.yuanbao.accounts.<id>.name`     | Nama tampilan akun                                  | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`  | Aktifkan/nonaktifkan akun tertentu                  | `true`                                 |
| `channels.yuanbao.dm.policy`              | Kebijakan DM                                        | `open`                                 |
| `channels.yuanbao.dm.allowFrom`           | Allowlist DM (daftar ID pengguna)                   | -                                      |
| `channels.yuanbao.requireMention`         | Wajibkan @mention di grup                           | `true`                                 |
| `channels.yuanbao.overflowPolicy`         | Penanganan pesan panjang (`split` atau `stop`)      | `split`                                |
| `channels.yuanbao.replyToMode`            | Strategi reply-to grup (`off`, `first`, `all`)      | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`  | Strategi keluar (`merge-text` atau `immediate`)     | `merge-text`                           |
| `channels.yuanbao.minChars`               | Merge-text: karakter min untuk memicu pengiriman    | `2800`                                 |
| `channels.yuanbao.maxChars`               | Merge-text: karakter maks per pesan                 | `3000`                                 |
| `channels.yuanbao.idleMs`                 | Merge-text: batas waktu idle sebelum auto-flush (ms) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`             | Batas ukuran media (MB)                             | `20`                                   |
| `channels.yuanbao.historyLimit`           | Entri konteks riwayat obrolan grup                  | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`  | Nonaktifkan output streaming tingkat blok           | `false`                                |
| `channels.yuanbao.fallbackReply`          | Balasan fallback saat AI tidak mengembalikan konten | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`    | Sisipkan instruksi anti-pembungkusan markdown       | `true`                                 |
| `channels.yuanbao.debugBotIds`            | ID bot allowlist debug (log tanpa sanitasi)         | `[]`                                   |

---

## Jenis pesan yang didukung

### Terima

- ✅ Teks
- ✅ Gambar
- ✅ File
- ✅ Audio / Suara
- ✅ Video
- ✅ Stiker / Emoji khusus
- ✅ Elemen khusus (kartu tautan, dll.)

### Kirim

- ✅ Teks (dengan dukungan markdown)
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video
- ✅ Stiker

### Thread dan balasan

- ✅ Balasan kutipan (dapat dikonfigurasi melalui `replyToMode`)
- ❌ Balasan thread (tidak didukung oleh platform)

---

## Terkait

- [Ikhtisar Saluran](/id/channels) - semua saluran yang didukung
- [Pairing](/id/channels/pairing) - autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) - perilaku obrolan grup dan gating penyebutan
- [Routing Saluran](/id/channels/channel-routing) - routing sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan hardening
