---
read_when:
    - Anda ingin menghubungkan bot Feishu/Lark
    - Anda sedang mengonfigurasi saluran Feishu
summary: Ikhtisar, fitur, dan konfigurasi bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-05-11T20:20:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4e43c65072d44cb5973a1ed09cb5336f18d100d0cb5b43c5e31f37aecff329
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark adalah platform kolaborasi serba ada tempat tim mengobrol, berbagi dokumen, mengelola kalender, dan menyelesaikan pekerjaan bersama.

**Status:** siap produksi untuk DM bot + chat grup. WebSocket adalah mode default; mode Webhook bersifat opsional.

---

## Mulai cepat

<Note>
Memerlukan OpenClaw 2026.4.25 atau lebih baru. Jalankan `openclaw --version` untuk memeriksa. Tingkatkan dengan `openclaw update`.
</Note>

<Steps>
  <Step title="Jalankan wizard penyiapan channel">
  ```bash
  openclaw channels login --channel feishu
  ```
  Pilih penyiapan manual untuk menempelkan App ID dan App Secret dari Feishu Open Platform, atau pilih penyiapan QR untuk membuat bot secara otomatis. Jika aplikasi seluler Feishu domestik tidak bereaksi terhadap kode QR, jalankan ulang penyiapan dan pilih penyiapan manual.
  </Step>
  
  <Step title="Setelah penyiapan selesai, mulai ulang gateway untuk menerapkan perubahan">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Kontrol akses

### Pesan langsung

Konfigurasikan `dmPolicy` untuk mengontrol siapa yang dapat mengirim DM ke bot:

- `"pairing"` - pengguna tidak dikenal menerima kode pairing; setujui melalui CLI
- `"allowlist"` - hanya pengguna yang tercantum di `allowFrom` yang dapat chat (default: hanya pemilik bot)
- `"open"` - izinkan DM publik hanya ketika `allowFrom` menyertakan `"*"`; dengan entri terbatas, hanya pengguna yang cocok yang dapat chat
- `"disabled"` - nonaktifkan semua DM

**Setujui permintaan pairing:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Chat grup

**Kebijakan grup** (`channels.feishu.groupPolicy`):

| Nilai         | Perilaku                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Merespons semua pesan di grup                                                                |
| `"allowlist"` | Hanya merespons grup dalam `groupAllowFrom` atau yang dikonfigurasi eksplisit di `groups.<chat_id>` |
| `"disabled"`  | Menonaktifkan semua pesan grup; entri eksplisit `groups.<chat_id>` tidak menimpa ini         |

Default: `allowlist`

**Persyaratan mention** (`channels.feishu.requireMention`):

- `true` - wajib @mention (default)
- `false` - respons tanpa @mention
- Override per grup: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` dan `@_all` yang hanya untuk broadcast tidak dianggap sebagai mention bot. Pesan yang menyebut `@all` sekaligus bot secara langsung tetap dihitung sebagai mention bot.

---

## Contoh konfigurasi grup

### Izinkan semua grup, tanpa perlu @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Izinkan semua grup, tetap wajib @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Izinkan hanya grup tertentu

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

Dalam mode `allowlist`, Anda juga dapat mengizinkan grup dengan menambahkan entri eksplisit `groups.<chat_id>`. Entri eksplisit tidak menimpa `groupPolicy: "disabled"`. Default wildcard di bawah `groups.*` mengonfigurasi grup yang cocok, tetapi tidak mengizinkan grup dengan sendirinya.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Batasi pengirim dalam grup

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Dapatkan ID grup/pengguna

### ID grup (`chat_id`, format: `oc_xxx`)

Buka grup di Feishu/Lark, klik ikon menu di sudut kanan atas, lalu buka **Settings**. ID grup (`chat_id`) tercantum di halaman pengaturan.

![Dapatkan ID Grup](/images/feishu-get-group-id.png)

### ID pengguna (`open_id`, format: `ou_xxx`)

Mulai gateway, kirim DM ke bot, lalu periksa log:

```bash
openclaw logs --follow
```

Cari `open_id` dalam output log. Anda juga dapat memeriksa permintaan pairing yang tertunda:

```bash
openclaw pairing list feishu
```

---

## Perintah umum

| Perintah  | Deskripsi                   |
| --------- | --------------------------- |
| `/status` | Tampilkan status bot        |
| `/reset`  | Reset sesi saat ini         |
| `/model`  | Tampilkan atau ganti model AI |

<Note>
Feishu/Lark tidak mendukung menu slash-command native, jadi kirim ini sebagai pesan teks biasa.
</Note>

---

## Pemecahan masalah

### Bot tidak merespons di chat grup

1. Pastikan bot ditambahkan ke grup
2. Pastikan Anda @mention bot (wajib secara default)
3. Verifikasi `groupPolicy` bukan `"disabled"`
4. Periksa log: `openclaw logs --follow`

### Bot tidak menerima pesan

1. Pastikan bot sudah dipublikasikan dan disetujui di Feishu Open Platform / Lark Developer
2. Pastikan langganan event menyertakan `im.message.receive_v1`
3. Pastikan **persistent connection** (WebSocket) dipilih
4. Pastikan semua cakupan izin yang diperlukan diberikan
5. Pastikan gateway berjalan: `openclaw gateway status`
6. Periksa log: `openclaw logs --follow`

### Penyiapan QR tidak bereaksi di aplikasi seluler Feishu

1. Jalankan ulang penyiapan: `openclaw channels login --channel feishu`
2. Pilih penyiapan manual
3. Di Feishu Open Platform, buat aplikasi self-built dan salin App ID serta App Secret-nya
4. Tempel kredensial tersebut ke wizard penyiapan

### App Secret bocor

1. Reset App Secret di Feishu Open Platform / Lark Developer
2. Perbarui nilai dalam konfigurasi Anda
3. Mulai ulang gateway: `openclaw gateway restart`

---

## Konfigurasi lanjutan

### Beberapa akun

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` mengontrol akun mana yang digunakan ketika API keluar tidak menentukan `accountId`.
`accounts.<id>.tts` menggunakan bentuk yang sama seperti `messages.tts` dan melakukan deep-merge di atas
konfigurasi TTS global, sehingga penyiapan Feishu multi-bot dapat menyimpan kredensial penyedia
bersama secara global sambil hanya meng-override suara, model, persona, atau mode otomatis
per akun.

### Batas pesan

- `textChunkLimit` - ukuran potongan teks keluar (default: `2000` karakter)
- `mediaMaxMb` - batas unggah/unduh media (default: `30` MB)

### Streaming

Feishu/Lark mendukung balasan streaming melalui kartu interaktif. Saat diaktifkan, bot memperbarui kartu secara real time ketika menghasilkan teks.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Atur `streaming: false` untuk mengirim balasan lengkap dalam satu pesan. `blockStreaming` nonaktif secara default; aktifkan hanya ketika Anda ingin blok assistant yang sudah selesai dikirim sebelum balasan final.

### Optimalisasi kuota

Kurangi jumlah panggilan API Feishu/Lark dengan dua flag opsional:

- `typingIndicator` (default `true`): atur `false` untuk melewati panggilan reaksi mengetik
- `resolveSenderNames` (default `true`): atur `false` untuk melewati lookup profil pengirim

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Sesi ACP

Feishu/Lark mendukung ACP untuk DM dan pesan thread grup. ACP Feishu/Lark dikendalikan oleh perintah teks - tidak ada menu slash-command native, jadi gunakan pesan `/acp ...` langsung dalam percakapan.

#### Binding ACP persisten

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Spawn ACP dari chat

Dalam DM atau thread Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` berfungsi untuk DM dan pesan thread Feishu/Lark. Pesan lanjutan dalam percakapan yang terikat dirutekan langsung ke sesi ACP tersebut.

### Routing multi-agent

Gunakan `bindings` untuk merutekan DM atau grup Feishu/Lark ke agent yang berbeda.

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
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Field routing:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) atau `"group"` (chat grup)
- `match.peer.id`: Open ID pengguna (`ou_xxx`) atau ID grup (`oc_xxx`)

Lihat [Dapatkan ID grup/pengguna](#get-groupuser-ids) untuk tips lookup.

---

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi Gateway](/id/gateway/configuration)

| Pengaturan                                       | Deskripsi                                                                        | Default          |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Aktifkan/nonaktifkan channel                                                     | `true`           |
| `channels.feishu.domain`                          | Domain API (`feishu` atau `lark`)                                                | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport peristiwa (`websocket` atau `webhook`)                                 | `websocket`      |
| `channels.feishu.defaultAccount`                  | Akun default untuk perutean keluar                                               | `default`        |
| `channels.feishu.verificationToken`               | Wajib untuk mode webhook                                                         | -                |
| `channels.feishu.encryptKey`                      | Wajib untuk mode webhook                                                         | -                |
| `channels.feishu.webhookPath`                     | Jalur rute webhook                                                               | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host bind webhook                                                                | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port bind webhook                                                                | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID aplikasi                                                                      | -                |
| `channels.feishu.accounts.<id>.appSecret`         | Rahasia aplikasi                                                                 | -                |
| `channels.feishu.accounts.<id>.domain`            | Override domain per akun                                                         | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Override TTS per akun                                                            | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Kebijakan DM                                                                     | `allowlist`      |
| `channels.feishu.allowFrom`                       | Daftar allowlist DM (daftar open_id)                                             | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Kebijakan grup                                                                   | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Daftar allowlist grup                                                            | -                |
| `channels.feishu.requireMention`                  | Wajibkan @mention di grup                                                        | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Override @mention per grup; ID eksplisit juga mengizinkan grup dalam mode allowlist | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Aktifkan/nonaktifkan grup tertentu                                               | `true`           |
| `channels.feishu.textChunkLimit`                  | Ukuran potongan pesan                                                            | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Batas ukuran media                                                               | `30`             |
| `channels.feishu.streaming`                       | Output kartu streaming                                                           | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming balasan blok selesai                                                   | `false`          |
| `channels.feishu.typingIndicator`                 | Kirim reaksi mengetik                                                            | `true`           |
| `channels.feishu.resolveSenderNames`              | Resolve nama tampilan pengirim                                                   | `true`           |

---

## Jenis pesan yang didukung

### Terima

- ✅ Teks
- ✅ Teks kaya (post)
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Stiker

Pesan audio Feishu/Lark yang masuk dinormalisasi sebagai placeholder media, bukan
JSON `file_key` mentah. Saat `tools.media.audio` dikonfigurasi, OpenClaw
mengunduh resource catatan suara dan menjalankan transkripsi audio bersama sebelum
giliran agen, sehingga agen menerima transkrip ucapan. Jika Feishu menyertakan
teks transkrip langsung dalam payload audio, teks tersebut digunakan tanpa
panggilan ASR lain. Tanpa penyedia transkripsi audio, agen tetap menerima
placeholder `<media:audio>` plus lampiran yang disimpan, bukan payload resource
Feishu mentah.

### Kirim

- ✅ Teks
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Kartu interaktif (termasuk pembaruan streaming)
- ⚠️ Teks kaya (pemformatan bergaya post; tidak mendukung kemampuan penulisan Feishu/Lark penuh)

Bubble audio native Feishu/Lark menggunakan jenis pesan `audio` Feishu dan memerlukan
media unggahan Ogg/Opus (`file_type: "opus"`). Media `.opus` dan `.ogg` yang sudah ada
dikirim langsung sebagai audio native. MP3/WAV/M4A dan format lain yang kemungkinan audio
ditranskode ke Ogg/Opus 48kHz dengan `ffmpeg` hanya ketika balasan meminta pengiriman suara
(`audioAsVoice` / message tool `asVoice`, termasuk balasan catatan suara TTS).
Lampiran MP3 biasa tetap menjadi file reguler. Jika `ffmpeg` tidak tersedia atau
konversi gagal, OpenClaw beralih ke lampiran file dan mencatat alasannya di log.

### Thread dan balasan

- ✅ Balasan inline
- ✅ Balasan thread
- ✅ Balasan media tetap sadar thread saat membalas pesan thread

Untuk `groupSessionScope: "group_topic"` dan `"group_topic_sender"`, grup topik
native Feishu/Lark menggunakan `thread_id` peristiwa (`omt_*`) sebagai kunci sesi
topik kanonis. Jika peristiwa pembuka topik native tidak menyertakan `thread_id`, OpenClaw
menghidrasinya dari Feishu sebelum merutekan giliran. Balasan grup normal yang
diubah OpenClaw menjadi thread tetap menggunakan ID pesan root balasan (`om_*`) sehingga
giliran pertama dan giliran lanjutan tetap berada dalam sesi yang sama.

---

## Terkait

- [Ringkasan Channel](/id/channels) - semua channel yang didukung
- [Pairing](/id/channels/pairing) - autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) - perilaku chat grup dan gating mention
- [Perutean Channel](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan pengerasan
