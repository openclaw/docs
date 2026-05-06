---
read_when:
    - Anda ingin menghubungkan bot Feishu/Lark
    - Anda sedang mengonfigurasi saluran Feishu
summary: Gambaran umum bot Feishu, fitur, dan konfigurasi
title: Feishu
x-i18n:
    generated_at: "2026-05-06T09:02:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2498c3b800563105c00345426a70a95914486633a07894cd74dbe487b167a6f4
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark adalah platform kolaborasi terpadu tempat tim dapat mengobrol, berbagi dokumen, mengelola kalender, dan menyelesaikan pekerjaan bersama.

**Status:** siap produksi untuk DM bot + obrolan grup. WebSocket adalah mode bawaan; mode Webhook bersifat opsional.

---

## Mulai cepat

<Note>
Memerlukan OpenClaw 2026.4.25 atau yang lebih baru. Jalankan `openclaw --version` untuk memeriksa. Tingkatkan dengan `openclaw update`.
</Note>

<Steps>
  <Step title="Jalankan wizard penyiapan channel">
  ```bash
  openclaw channels login --channel feishu
  ```
  Pindai kode QR dengan aplikasi seluler Feishu/Lark Anda untuk membuat bot Feishu/Lark secara otomatis.
  </Step>
  
  <Step title="Setelah penyiapan selesai, mulai ulang Gateway untuk menerapkan perubahan">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Kontrol akses

### Pesan langsung

Konfigurasikan `dmPolicy` untuk mengontrol siapa yang dapat mengirim DM ke bot:

- `"pairing"` - pengguna tidak dikenal menerima kode pemasangan; setujui melalui CLI
- `"allowlist"` - hanya pengguna yang tercantum di `allowFrom` yang dapat mengobrol (bawaan: hanya pemilik bot)
- `"open"` - izinkan DM publik hanya ketika `allowFrom` menyertakan `"*"`; dengan entri terbatas, hanya pengguna yang cocok yang dapat mengobrol
- `"disabled"` - nonaktifkan semua DM

**Setujui permintaan pemasangan:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Obrolan grup

**Kebijakan grup** (`channels.feishu.groupPolicy`):

| Nilai         | Perilaku                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Merespons semua pesan dalam grup                                                            |
| `"allowlist"` | Hanya merespons grup dalam `groupAllowFrom` atau yang dikonfigurasi secara eksplisit di bawah `groups.<chat_id>` |
| `"disabled"`  | Menonaktifkan semua pesan grup; entri eksplisit `groups.<chat_id>` tidak mengganti ini         |

Bawaan: `allowlist`

**Persyaratan mention** (`channels.feishu.requireMention`):

- `true` - memerlukan @mention (bawaan)
- `false` - merespons tanpa @mention
- Override per grup: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` dan `@_all` yang hanya untuk broadcast tidak diperlakukan sebagai mention bot. Pesan yang menyebut `@all` dan bot secara langsung tetap dihitung sebagai mention bot.

---

## Contoh konfigurasi grup

### Izinkan semua grup, tidak perlu @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Izinkan semua grup, tetap perlu @mention

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

### Hanya izinkan grup tertentu

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

Dalam mode `allowlist`, Anda juga dapat mengizinkan grup dengan menambahkan entri eksplisit `groups.<chat_id>`. Entri eksplisit tidak mengganti `groupPolicy: "disabled"`. Bawaan wildcard di bawah `groups.*` mengonfigurasi grup yang cocok, tetapi tidak mengizinkan grup dengan sendirinya.

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

Buka grup di Feishu/Lark, klik ikon menu di sudut kanan atas, lalu buka **Pengaturan**. ID grup (`chat_id`) tercantum di halaman pengaturan.

![Dapatkan ID Grup](/images/feishu-get-group-id.png)

### ID pengguna (`open_id`, format: `ou_xxx`)

Jalankan Gateway, kirim DM ke bot, lalu periksa log:

```bash
openclaw logs --follow
```

Cari `open_id` dalam output log. Anda juga dapat memeriksa permintaan pemasangan yang tertunda:

```bash
openclaw pairing list feishu
```

---

## Perintah umum

| Perintah   | Deskripsi                 |
| --------- | --------------------------- |
| `/status` | Menampilkan status bot             |
| `/reset`  | Mengatur ulang sesi saat ini   |
| `/model`  | Menampilkan atau mengganti model AI |

<Note>
Feishu/Lark tidak mendukung menu perintah slash native, jadi kirimkan ini sebagai pesan teks biasa.
</Note>

---

## Pemecahan masalah

### Bot tidak merespons dalam obrolan grup

1. Pastikan bot telah ditambahkan ke grup
2. Pastikan Anda @mention bot (diperlukan secara bawaan)
3. Verifikasi `groupPolicy` bukan `"disabled"`
4. Periksa log: `openclaw logs --follow`

### Bot tidak menerima pesan

1. Pastikan bot sudah dipublikasikan dan disetujui di Feishu Open Platform / Lark Developer
2. Pastikan langganan event menyertakan `im.message.receive_v1`
3. Pastikan **koneksi persisten** (WebSocket) dipilih
4. Pastikan semua cakupan izin yang diperlukan telah diberikan
5. Pastikan Gateway berjalan: `openclaw gateway status`
6. Periksa log: `openclaw logs --follow`

### App Secret bocor

1. Atur ulang App Secret di Feishu Open Platform / Lark Developer
2. Perbarui nilai dalam konfigurasi Anda
3. Mulai ulang Gateway: `openclaw gateway restart`

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
konfigurasi TTS global, sehingga penyiapan multi-bot Feishu dapat menyimpan kredensial
penyedia bersama secara global sambil hanya mengganti voice, model, persona, atau mode otomatis
per akun.

### Batas pesan

- `textChunkLimit` - ukuran potongan teks keluar (bawaan: `2000` karakter)
- `mediaMaxMb` - batas unggah/unduh media (bawaan: `30` MB)

### Streaming

Feishu/Lark mendukung balasan streaming melalui kartu interaktif. Saat diaktifkan, bot memperbarui kartu secara real time saat menghasilkan teks.

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

Atur `streaming: false` untuk mengirim balasan lengkap dalam satu pesan. `blockStreaming` nonaktif secara bawaan; aktifkan hanya ketika Anda ingin blok asisten yang selesai dikirim sebelum balasan akhir.

### Optimisasi kuota

Kurangi jumlah panggilan API Feishu/Lark dengan dua flag opsional:

- `typingIndicator` (bawaan `true`): atur `false` untuk melewati panggilan reaksi mengetik
- `resolveSenderNames` (bawaan `true`): atur `false` untuk melewati pencarian profil pengirim

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

Feishu/Lark mendukung ACP untuk DM dan pesan thread grup. ACP Feishu/Lark digerakkan oleh perintah teks - tidak ada menu perintah slash native, jadi gunakan pesan `/acp ...` langsung dalam percakapan.

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

#### Spawn ACP dari obrolan

Dalam DM atau thread Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` berfungsi untuk DM dan pesan thread Feishu/Lark. Pesan tindak lanjut dalam percakapan yang terikat dirutekan langsung ke sesi ACP tersebut.

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

Kolom routing:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) atau `"group"` (obrolan grup)
- `match.peer.id`: Open ID pengguna (`ou_xxx`) atau ID grup (`oc_xxx`)

Lihat [Dapatkan ID grup/pengguna](#get-groupuser-ids) untuk tips pencarian.

---

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi Gateway](/id/gateway/configuration)

| Pengaturan                                       | Deskripsi                                                                        | Bawaan           |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Aktifkan/nonaktifkan channel                                                     | `true`           |
| `channels.feishu.domain`                          | Domain API (`feishu` atau `lark`)                                                | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport peristiwa (`websocket` atau `webhook`)                                 | `websocket`      |
| `channels.feishu.defaultAccount`                  | Akun bawaan untuk perutean keluar                                                | `default`        |
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
| `channels.feishu.allowFrom`                       | Allowlist DM (daftar open_id)                                                    | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Kebijakan grup                                                                   | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Allowlist grup                                                                   | -                |
| `channels.feishu.requireMention`                  | Wajibkan @mention dalam grup                                                     | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Override @mention per grup; ID eksplisit juga mengizinkan grup dalam mode allowlist | diwarisi         |
| `channels.feishu.groups.<chat_id>.enabled`        | Aktifkan/nonaktifkan grup tertentu                                               | `true`           |
| `channels.feishu.textChunkLimit`                  | Ukuran potongan pesan                                                            | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Batas ukuran media                                                               | `30`             |
| `channels.feishu.streaming`                       | Output kartu streaming                                                           | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming balasan blok yang selesai                                              | `false`          |
| `channels.feishu.typingIndicator`                 | Kirim reaksi mengetik                                                            | `true`           |
| `channels.feishu.resolveSenderNames`              | Resolusi nama tampilan pengirim                                                  | `true`           |

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

Pesan audio masuk Feishu/Lark dinormalisasi sebagai placeholder media, bukan
JSON `file_key` mentah. Ketika `tools.media.audio` dikonfigurasi, OpenClaw
mengunduh sumber daya catatan suara dan menjalankan transkripsi audio bersama sebelum
giliran agen, sehingga agen menerima transkrip lisan. Jika Feishu menyertakan
teks transkrip langsung dalam payload audio, teks tersebut digunakan tanpa
panggilan ASR lain. Tanpa penyedia transkripsi audio, agen tetap menerima
placeholder `<media:audio>` beserta lampiran tersimpan, bukan payload sumber daya
Feishu mentah.

### Kirim

- ✅ Teks
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Kartu interaktif (termasuk pembaruan streaming)
- ⚠️ Teks kaya (pemformatan gaya post; tidak mendukung kemampuan authoring Feishu/Lark penuh)

Gelembung audio native Feishu/Lark menggunakan jenis pesan `audio` Feishu dan memerlukan
media unggahan Ogg/Opus (`file_type: "opus"`). Media `.opus` dan `.ogg` yang ada
dikirim langsung sebagai audio native. MP3/WAV/M4A dan format lain yang kemungkinan audio
ditranskode ke Ogg/Opus 48kHz dengan `ffmpeg` hanya ketika balasan meminta pengiriman suara
(`audioAsVoice` / alat pesan `asVoice`, termasuk balasan catatan suara TTS).
Lampiran MP3 biasa tetap menjadi file reguler. Jika `ffmpeg` tidak ada atau
konversi gagal, OpenClaw kembali ke lampiran file dan mencatat alasannya.

### Thread dan balasan

- ✅ Balasan inline
- ✅ Balasan thread
- ✅ Balasan media tetap sadar thread saat membalas pesan thread

Untuk `groupSessionScope: "group_topic"` dan `"group_topic_sender"`, grup topik
native Feishu/Lark menggunakan `thread_id` peristiwa (`omt_*`) sebagai kunci sesi
topik kanonis. Jika peristiwa pemula topik native menghilangkan `thread_id`, OpenClaw
menghidrasinya dari Feishu sebelum merutekan giliran. Balasan grup normal yang
diubah OpenClaw menjadi thread tetap menggunakan ID pesan akar balasan (`om_*`) sehingga
giliran pertama dan giliran lanjutan tetap berada dalam sesi yang sama.

---

## Terkait

- [Ikhtisar Channel](/id/channels) - semua channel yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku chat grup dan gating mention
- [Perutean Channel](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan hardening
