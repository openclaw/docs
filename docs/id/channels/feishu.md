---
read_when:
    - Anda ingin menghubungkan bot Feishu/Lark
    - Anda sedang mengonfigurasi saluran Feishu
summary: Ikhtisar bot Feishu, fitur, dan konfigurasi
title: Feishu
x-i18n:
    generated_at: "2026-05-03T21:27:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16d8156d215d47fa6e7d810e3a70eb8e84176a681669c27de8f58320be83a7a0
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark adalah platform kolaborasi terpadu tempat tim mengobrol, berbagi dokumen, mengelola kalender, dan menyelesaikan pekerjaan bersama.

**Status:** siap produksi untuk DM bot + obrolan grup. WebSocket adalah mode default; mode webhook bersifat opsional.

---

## Mulai cepat

<Note>
Memerlukan OpenClaw 2026.4.25 atau yang lebih baru. Jalankan `openclaw --version` untuk memeriksa. Perbarui dengan `openclaw update`.
</Note>

<Steps>
  <Step title="Jalankan wizard penyiapan kanal">
  ```bash
  openclaw channels login --channel feishu
  ```
  Pindai kode QR dengan aplikasi seluler Feishu/Lark Anda untuk membuat bot Feishu/Lark secara otomatis.
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

- `"pairing"` — pengguna tidak dikenal menerima kode pairing; setujui melalui CLI
- `"allowlist"` — hanya pengguna yang tercantum di `allowFrom` yang dapat mengobrol (default: hanya pemilik bot)
- `"open"` — izinkan DM publik hanya ketika `allowFrom` menyertakan `"*"`; dengan entri yang membatasi, hanya pengguna yang cocok yang dapat mengobrol
- `"disabled"` — nonaktifkan semua DM

**Setujui permintaan pairing:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Obrolan grup

**Kebijakan grup** (`channels.feishu.groupPolicy`):

| Nilai         | Perilaku                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Merespons semua pesan di grup                                                                |
| `"allowlist"` | Hanya merespons grup di `groupAllowFrom` atau yang dikonfigurasi secara eksplisit di `groups.<chat_id>` |
| `"disabled"`  | Menonaktifkan semua pesan grup; entri eksplisit `groups.<chat_id>` tidak mengesampingkan ini |

Default: `allowlist`

**Persyaratan mention** (`channels.feishu.requireMention`):

- `true` — memerlukan @mention (default)
- `false` — merespons tanpa @mention
- Override per grup: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` dan `@_all` khusus siaran tidak diperlakukan sebagai mention bot. Pesan yang menyebut `@all` dan bot secara langsung tetap dihitung sebagai mention bot.

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

### Izinkan semua grup, tetap memerlukan @mention

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

Dalam mode `allowlist`, Anda juga dapat mengizinkan grup dengan menambahkan entri eksplisit `groups.<chat_id>`. Entri eksplisit tidak mengesampingkan `groupPolicy: "disabled"`. Default wildcard di bawah `groups.*` mengonfigurasi grup yang cocok, tetapi tidak mengizinkan grup dengan sendirinya.

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

| Perintah  | Deskripsi                    |
| --------- | ---------------------------- |
| `/status` | Tampilkan status bot         |
| `/reset`  | Reset sesi saat ini          |
| `/model`  | Tampilkan atau ganti model AI |

<Note>
Feishu/Lark tidak mendukung menu perintah slash native, jadi kirim ini sebagai pesan teks biasa.
</Note>

---

## Pemecahan masalah

### Bot tidak merespons di obrolan grup

1. Pastikan bot ditambahkan ke grup
2. Pastikan Anda @mention bot (diperlukan secara default)
3. Verifikasi `groupPolicy` bukan `"disabled"`
4. Periksa log: `openclaw logs --follow`

### Bot tidak menerima pesan

1. Pastikan bot sudah dipublikasikan dan disetujui di Feishu Open Platform / Lark Developer
2. Pastikan langganan event menyertakan `im.message.receive_v1`
3. Pastikan **koneksi persisten** (WebSocket) dipilih
4. Pastikan semua cakupan izin yang diperlukan sudah diberikan
5. Pastikan gateway berjalan: `openclaw gateway status`
6. Periksa log: `openclaw logs --follow`

### App Secret bocor

1. Reset App Secret di Feishu Open Platform / Lark Developer
2. Perbarui nilainya dalam konfigurasi Anda
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
`accounts.<id>.tts` menggunakan bentuk yang sama dengan `messages.tts` dan melakukan deep-merge di atas konfigurasi TTS
global, sehingga penyiapan Feishu multi-bot dapat menyimpan kredensial penyedia
bersama secara global sambil hanya meng-override suara, model, persona, atau mode otomatis
per akun.

### Batas pesan

- `textChunkLimit` — ukuran potongan teks keluar (default: `2000` karakter)
- `mediaMaxMb` — batas unggah/unduh media (default: `30` MB)

### Streaming

Feishu/Lark mendukung balasan streaming melalui kartu interaktif. Ketika diaktifkan, bot memperbarui kartu secara real time saat menghasilkan teks.

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

Atur `streaming: false` untuk mengirim balasan lengkap dalam satu pesan. `blockStreaming` nonaktif secara default; aktifkan hanya ketika Anda ingin blok asisten yang sudah selesai dikirim sebelum balasan akhir.

### Optimalisasi kuota

Kurangi jumlah panggilan API Feishu/Lark dengan dua flag opsional:

- `typingIndicator` (default `true`): atur `false` untuk melewati panggilan reaksi mengetik
- `resolveSenderNames` (default `true`): atur `false` untuk melewati pencarian profil pengirim

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

Feishu/Lark mendukung ACP untuk DM dan pesan thread grup. ACP Feishu/Lark digerakkan oleh perintah teks — tidak ada menu perintah slash native, jadi gunakan pesan `/acp ...` langsung dalam percakapan.

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

`--thread here` berfungsi untuk DM dan pesan thread Feishu/Lark. Pesan lanjutan dalam percakapan yang terikat akan dirutekan langsung ke sesi ACP tersebut.

### Routing multi-agen

Gunakan `bindings` untuk merutekan DM atau grup Feishu/Lark ke agen yang berbeda.

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

| Pengaturan                                       | Deskripsi                                                                         | Default          |
| ------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Aktifkan/nonaktifkan saluran                                                      | `true`           |
| `channels.feishu.domain`                          | Domain API (`feishu` atau `lark`)                                                 | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport peristiwa (`websocket` atau `webhook`)                                  | `websocket`      |
| `channels.feishu.defaultAccount`                  | Akun default untuk perutean keluar                                                | `default`        |
| `channels.feishu.verificationToken`               | Diperlukan untuk mode Webhook                                                     | —                |
| `channels.feishu.encryptKey`                      | Diperlukan untuk mode Webhook                                                     | —                |
| `channels.feishu.webhookPath`                     | Jalur rute Webhook                                                                | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host pengikatan Webhook                                                           | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port pengikatan Webhook                                                           | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | ID aplikasi                                                                       | —                |
| `channels.feishu.accounts.<id>.appSecret`         | Rahasia aplikasi                                                                  | —                |
| `channels.feishu.accounts.<id>.domain`            | Penggantian domain per akun                                                       | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Penggantian TTS per akun                                                          | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | Kebijakan DM                                                                      | `allowlist`      |
| `channels.feishu.allowFrom`                       | Daftar izinkan DM (daftar open_id)                                                | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Kebijakan grup                                                                    | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Daftar izinkan grup                                                               | —                |
| `channels.feishu.requireMention`                  | Wajibkan @mention di grup                                                         | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Penggantian @mention per grup; ID eksplisit juga mengizinkan grup dalam mode daftar izinkan | diwariskan       |
| `channels.feishu.groups.<chat_id>.enabled`        | Aktifkan/nonaktifkan grup tertentu                                                | `true`           |
| `channels.feishu.textChunkLimit`                  | Ukuran potongan pesan                                                             | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Batas ukuran media                                                                | `30`             |
| `channels.feishu.streaming`                       | Keluaran kartu streaming                                                          | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming balasan blok yang selesai                                               | `false`          |
| `channels.feishu.typingIndicator`                 | Kirim reaksi mengetik                                                             | `true`           |
| `channels.feishu.resolveSenderNames`              | Selesaikan nama tampilan pengirim                                                 | `true`           |

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

Pesan audio masuk Feishu/Lark dinormalisasi sebagai placeholder media, bukan JSON `file_key` mentah. Saat `tools.media.audio` dikonfigurasi, OpenClaw mengunduh sumber daya catatan suara dan menjalankan transkripsi audio bersama sebelum giliran agen, sehingga agen menerima transkrip ucapan. Jika Feishu menyertakan teks transkrip langsung di payload audio, teks tersebut digunakan tanpa panggilan ASR lain. Tanpa penyedia transkripsi audio, agen tetap menerima placeholder `<media:audio>` beserta lampiran yang disimpan, bukan payload sumber daya Feishu mentah.

### Kirim

- ✅ Teks
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Kartu interaktif (termasuk pembaruan streaming)
- ⚠️ Teks kaya (pemformatan gaya post; tidak mendukung kemampuan penulisan Feishu/Lark penuh)

Gelembung audio native Feishu/Lark menggunakan jenis pesan Feishu `audio` dan memerlukan media unggahan Ogg/Opus (`file_type: "opus"`). Media `.opus` dan `.ogg` yang sudah ada dikirim langsung sebagai audio native. MP3/WAV/M4A dan format lain yang kemungkinan audio ditranskode ke Ogg/Opus 48kHz dengan `ffmpeg` hanya saat balasan meminta pengiriman suara (`audioAsVoice` / alat pesan `asVoice`, termasuk balasan catatan suara TTS). Lampiran MP3 biasa tetap menjadi file reguler. Jika `ffmpeg` tidak ada atau konversi gagal, OpenClaw kembali ke lampiran file dan mencatat alasannya.

### Utas dan balasan

- ✅ Balasan inline
- ✅ Balasan utas
- ✅ Balasan media tetap sadar utas saat membalas pesan utas

Untuk `groupSessionScope: "group_topic"` dan `"group_topic_sender"`, grup topik native Feishu/Lark menggunakan peristiwa `thread_id` (`omt_*`) sebagai kunci sesi topik kanonis. Balasan grup normal yang diubah OpenClaw menjadi utas tetap menggunakan ID pesan akar balasan (`om_*`) sehingga giliran pertama dan giliran lanjutan tetap berada dalam sesi yang sama.

---

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Penyandingan](/id/channels/pairing) — autentikasi DM dan alur penyandingan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gerbang mention
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan pengerasan
