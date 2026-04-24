---
read_when:
    - Anda ingin menghubungkan bot Feishu/Lark
    - Anda sedang mengonfigurasi channel Feishu
summary: Ikhtisar, fitur, dan konfigurasi bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-24T08:57:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f68a03c457fb2be7654f298fbad759705983d9e673b7b7b950609694894bdcbc
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark adalah platform kolaborasi all-in-one tempat tim mengobrol, berbagi dokumen, mengelola kalender, dan menyelesaikan pekerjaan bersama.

**Status:** siap produksi untuk DM bot + obrolan grup. WebSocket adalah mode default; mode Webhook bersifat opsional.

---

## Mulai cepat

> **Memerlukan OpenClaw 2026.4.24 atau lebih baru.** Jalankan `openclaw --version` untuk memeriksa. Lakukan upgrade dengan `openclaw update`.

<Steps>
  <Step title="Jalankan wizard penyiapan channel">
  ```bash
  openclaw channels login --channel feishu
  ```
  Pindai kode QR dengan aplikasi seluler Feishu/Lark Anda untuk membuat bot Feishu/Lark secara otomatis.
  </Step>
  
  <Step title="Setelah penyiapan selesai, restart Gateway untuk menerapkan perubahan">
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
- `"open"` — izinkan semua pengguna
- `"disabled"` — nonaktifkan semua DM

**Setujui permintaan pairing:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Obrolan grup

**Kebijakan grup** (`channels.feishu.groupPolicy`):

| Value         | Perilaku                                    |
| ------------- | ------------------------------------------- |
| `"open"`      | Merespons semua pesan di grup               |
| `"allowlist"` | Hanya merespons grup di `groupAllowFrom`    |
| `"disabled"`  | Nonaktifkan semua pesan grup                |

Default: `allowlist`

**Persyaratan mention** (`channels.feishu.requireMention`):

- `true` — memerlukan @mention (default)
- `false` — merespons tanpa @mention
- Override per grup: `channels.feishu.groups.<chat_id>.requireMention`

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

### Izinkan semua grup, tetapi tetap memerlukan @mention

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
      // ID grup terlihat seperti: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Batasi pengirim dalam sebuah grup

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // open_id pengguna terlihat seperti: ou_xxx
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

Buka grup di Feishu/Lark, klik ikon menu di pojok kanan atas, lalu masuk ke **Settings**. ID grup (`chat_id`) tercantum di halaman pengaturan.

![Get Group ID](/images/feishu-get-group-id.png)

### ID pengguna (`open_id`, format: `ou_xxx`)

Jalankan Gateway, kirim DM ke bot, lalu periksa log:

```bash
openclaw logs --follow
```

Cari `open_id` di output log. Anda juga dapat memeriksa permintaan pairing yang tertunda:

```bash
openclaw pairing list feishu
```

---

## Perintah umum

| Command   | Deskripsi                      |
| --------- | ------------------------------ |
| `/status` | Tampilkan status bot           |
| `/reset`  | Reset sesi saat ini            |
| `/model`  | Tampilkan atau ganti model AI  |

> Feishu/Lark tidak mendukung menu slash command native, jadi kirim ini sebagai pesan teks biasa.

---

## Pemecahan masalah

### Bot tidak merespons di obrolan grup

1. Pastikan bot ditambahkan ke grup
2. Pastikan Anda me-@mention bot (wajib secara default)
3. Verifikasi `groupPolicy` tidak bernilai `"disabled"`
4. Periksa log: `openclaw logs --follow`

### Bot tidak menerima pesan

1. Pastikan bot dipublikasikan dan disetujui di Feishu Open Platform / Lark Developer
2. Pastikan langganan event mencakup `im.message.receive_v1`
3. Pastikan **persistent connection** (WebSocket) dipilih
4. Pastikan semua cakupan izin yang diperlukan telah diberikan
5. Pastikan Gateway berjalan: `openclaw gateway status`
6. Periksa log: `openclaw logs --follow`

### App Secret bocor

1. Reset App Secret di Feishu Open Platform / Lark Developer
2. Perbarui nilainya di konfigurasi Anda
3. Restart Gateway: `openclaw gateway restart`

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
          name: "Bot utama",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Bot cadangan",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` mengontrol akun mana yang digunakan ketika API keluar tidak menentukan `accountId`.

### Batas pesan

- `textChunkLimit` — ukuran chunk teks keluar (default: `2000` karakter)
- `mediaMaxMb` — batas upload/download media (default: `30` MB)

### Streaming

Feishu/Lark mendukung balasan streaming melalui kartu interaktif. Saat diaktifkan, bot memperbarui kartu secara real time saat menghasilkan teks.

```json5
{
  channels: {
    feishu: {
      streaming: true, // aktifkan output kartu streaming (default: true)
      blockStreaming: true, // aktifkan streaming tingkat blok (default: true)
    },
  },
}
```

Setel `streaming: false` untuk mengirim balasan lengkap dalam satu pesan.

### Optimasi kuota

Kurangi jumlah panggilan API Feishu/Lark dengan dua flag opsional:

- `typingIndicator` (default `true`): setel ke `false` untuk melewati panggilan reaksi mengetik
- `resolveSenderNames` (default `true`): setel ke `false` untuk melewati lookup profil pengirim

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

Feishu/Lark mendukung ACP untuk DM dan pesan thread grup. ACP Feishu/Lark digerakkan oleh perintah teks — tidak ada menu slash command native, jadi gunakan pesan `/acp ...` langsung di percakapan.

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

Di DM atau thread Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` berfungsi untuk DM dan pesan thread Feishu/Lark. Pesan lanjutan di percakapan yang terikat akan diarahkan langsung ke sesi ACP tersebut.

### Routing multi-agen

Gunakan `bindings` untuk mengarahkan DM atau grup Feishu/Lark ke agen yang berbeda.

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
- `match.peer.kind`: `"direct"` (DM) atau `"group"` (obrolan grup)
- `match.peer.id`: Open ID pengguna (`ou_xxx`) atau ID grup (`oc_xxx`)

Lihat [Dapatkan ID grup/pengguna](#get-groupuser-ids) untuk tips lookup.

---

## Referensi konfigurasi

Konfigurasi lengkap: [Konfigurasi Gateway](/id/gateway/configuration)

| Setting                                           | Deskripsi                                 | Default          |
| ------------------------------------------------- | ----------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Aktifkan/nonaktifkan channel              | `true`           |
| `channels.feishu.domain`                          | Domain API (`feishu` atau `lark`)         | `feishu`         |
| `channels.feishu.connectionMode`                  | Transport event (`websocket` atau `webhook`) | `websocket`   |
| `channels.feishu.defaultAccount`                  | Akun default untuk routing keluar         | `default`        |
| `channels.feishu.verificationToken`               | Diperlukan untuk mode Webhook             | —                |
| `channels.feishu.encryptKey`                      | Diperlukan untuk mode Webhook             | —                |
| `channels.feishu.webhookPath`                     | Path rute Webhook                         | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host bind Webhook                         | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port bind Webhook                         | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                    | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                | —                |
| `channels.feishu.accounts.<id>.domain`            | Override domain per akun                  | `feishu`         |
| `channels.feishu.dmPolicy`                        | Kebijakan DM                              | `allowlist`      |
| `channels.feishu.allowFrom`                       | Allowlist DM (daftar `open_id`)           | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Kebijakan grup                            | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Allowlist grup                            | —                |
| `channels.feishu.requireMention`                  | Wajib @mention di grup                    | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Override @mention per grup                | diwarisi         |
| `channels.feishu.groups.<chat_id>.enabled`        | Aktifkan/nonaktifkan grup tertentu        | `true`           |
| `channels.feishu.textChunkLimit`                  | Ukuran chunk pesan                        | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Batas ukuran media                        | `30`             |
| `channels.feishu.streaming`                       | Output kartu streaming                    | `true`           |
| `channels.feishu.blockStreaming`                  | Streaming tingkat blok                    | `true`           |
| `channels.feishu.typingIndicator`                 | Kirim reaksi mengetik                     | `true`           |
| `channels.feishu.resolveSenderNames`              | Resolve nama tampilan pengirim            | `true`           |

---

## Jenis pesan yang didukung

### Terima

- ✅ Teks
- ✅ Rich text (post)
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Stiker

### Kirim

- ✅ Teks
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Kartu interaktif (termasuk pembaruan streaming)
- ⚠️ Rich text (pemformatan gaya post; tidak mendukung seluruh kemampuan authoring Feishu/Lark)

### Thread dan balasan

- ✅ Balasan inline
- ✅ Balasan thread
- ✅ Balasan media tetap sadar thread saat membalas pesan thread

---

## Terkait

- [Ikhtisar Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan keamanan
