---
read_when:
    - Anda ingin menghubungkan bot Feishu/Lark
    - Anda sedang mengonfigurasi channel Feishu
summary: Ikhtisar, fitur, dan konfigurasi bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-05T13:43:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e39b6dfe3a3aa4ebbdb992975e570e4f1b5e79f3b400a555fc373a0d1889952
    source_path: channels/feishu.md
    workflow: 15
---

# Bot Feishu

Feishu (Lark) adalah platform obrolan tim yang digunakan perusahaan untuk perpesanan dan kolaborasi. Plugin ini menghubungkan OpenClaw ke bot Feishu/Lark menggunakan langganan peristiwa WebSocket milik platform, sehingga pesan dapat diterima tanpa mengekspos URL webhook publik.

---

## Plugin bawaan

Feishu sudah disertakan secara bawaan dalam rilis OpenClaw saat ini, sehingga tidak
memerlukan instalasi plugin terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan bundel
Feishu, instal secara manual:

```bash
openclaw plugins install @openclaw/feishu
```

---

## Mulai cepat

Ada dua cara untuk menambahkan channel Feishu:

### Metode 1: onboarding (direkomendasikan)

Jika Anda baru saja menginstal OpenClaw, jalankan onboarding:

```bash
openclaw onboard
```

Wizard akan memandu Anda melalui:

1. Membuat aplikasi Feishu dan mengumpulkan kredensial
2. Mengonfigurasi kredensial aplikasi di OpenClaw
3. Menjalankan gateway

✅ **Setelah konfigurasi**, periksa status gateway:

- `openclaw gateway status`
- `openclaw logs --follow`

### Metode 2: penyiapan CLI

Jika Anda sudah menyelesaikan instalasi awal, tambahkan channel melalui CLI:

```bash
openclaw channels add
```

Pilih **Feishu**, lalu masukkan App ID dan App Secret.

✅ **Setelah konfigurasi**, kelola gateway:

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## Langkah 1: Buat aplikasi Feishu

### 1. Buka Feishu Open Platform

Kunjungi [Feishu Open Platform](https://open.feishu.cn/app) dan masuk.

Tenant Lark (global) harus menggunakan [https://open.larksuite.com/app](https://open.larksuite.com/app) dan menetapkan `domain: "lark"` di konfigurasi Feishu.

### 2. Buat aplikasi

1. Klik **Create enterprise app**
2. Isi nama + deskripsi aplikasi
3. Pilih ikon aplikasi

![Create enterprise app](/images/feishu-step2-create-app.png)

### 3. Salin kredensial

Dari **Credentials & Basic Info**, salin:

- **App ID** (format: `cli_xxx`)
- **App Secret**

❗ **Penting:** jaga kerahasiaan App Secret.

![Get credentials](/images/feishu-step3-credentials.png)

### 4. Konfigurasikan izin

Pada **Permissions**, klik **Batch import** dan tempel:

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](/images/feishu-step4-permissions.png)

### 5. Aktifkan kemampuan bot

Di **App Capability** > **Bot**:

1. Aktifkan kemampuan bot
2. Tetapkan nama bot

![Enable bot capability](/images/feishu-step5-bot-capability.png)

### 6. Konfigurasikan langganan peristiwa

⚠️ **Penting:** sebelum menetapkan langganan peristiwa, pastikan:

1. Anda sudah menjalankan `openclaw channels add` untuk Feishu
2. Gateway sedang berjalan (`openclaw gateway status`)

Di **Event Subscription**:

1. Pilih **Use long connection to receive events** (WebSocket)
2. Tambahkan peristiwa: `im.message.receive_v1`
3. (Opsional) Untuk alur kerja komentar Drive, tambahkan juga: `drive.notice.comment_add_v1`

⚠️ Jika gateway tidak berjalan, penyiapan long-connection mungkin gagal disimpan.

![Configure event subscription](/images/feishu-step6-event-subscription.png)

### 7. Publikasikan aplikasi

1. Buat versi di **Version Management & Release**
2. Kirim untuk peninjauan dan publikasikan
3. Tunggu persetujuan admin (aplikasi enterprise biasanya disetujui otomatis)

---

## Langkah 2: Konfigurasikan OpenClaw

### Konfigurasikan dengan wizard (direkomendasikan)

```bash
openclaw channels add
```

Pilih **Feishu** dan tempelkan App ID + App Secret Anda.

### Konfigurasikan melalui file konfigurasi

Edit `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "My AI assistant",
        },
      },
    },
  },
}
```

Jika Anda menggunakan `connectionMode: "webhook"`, tetapkan `verificationToken` dan `encryptKey`. Server webhook Feishu melakukan bind ke `127.0.0.1` secara default; tetapkan `webhookHost` hanya jika Anda memang sengaja memerlukan alamat bind yang berbeda.

#### Verification Token dan Encrypt Key (mode webhook)

Saat menggunakan mode webhook, tetapkan `channels.feishu.verificationToken` dan `channels.feishu.encryptKey` di konfigurasi Anda. Untuk mendapatkan nilainya:

1. Di Feishu Open Platform, buka aplikasi Anda
2. Buka **Development** → **Events & Callbacks** (开发配置 → 事件与回调)
3. Buka tab **Encryption** (加密策略)
4. Salin **Verification Token** dan **Encrypt Key**

Tangkapan layar di bawah ini menunjukkan tempat menemukan **Verification Token**. **Encrypt Key** tercantum di bagian **Encryption** yang sama.

![Verification Token location](/images/feishu-verification-token.png)

### Konfigurasikan melalui variabel lingkungan

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Domain Lark (global)

Jika tenant Anda berada di Lark (internasional), tetapkan domain ke `lark` (atau string domain lengkap). Anda dapat menetapkannya di `channels.feishu.domain` atau per akun (`channels.feishu.accounts.<id>.domain`).

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Flag optimasi kuota

Anda dapat mengurangi penggunaan API Feishu dengan dua flag opsional:

- `typingIndicator` (default `true`): saat `false`, lewati panggilan reaksi mengetik.
- `resolveSenderNames` (default `true`): saat `false`, lewati panggilan pencarian profil pengirim.

Tetapkan di level teratas atau per akun:

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## Langkah 3: Jalankan + uji

### 1. Jalankan gateway

```bash
openclaw gateway
```

### 2. Kirim pesan uji

Di Feishu, temukan bot Anda dan kirim pesan.

### 3. Setujui pairing

Secara default, bot membalas dengan kode pairing. Setujui:

```bash
openclaw pairing approve feishu <CODE>
```

Setelah disetujui, Anda dapat mengobrol seperti biasa.

---

## Ikhtisar

- **Channel bot Feishu**: bot Feishu yang dikelola oleh gateway
- **Routing deterministik**: balasan selalu kembali ke Feishu
- **Isolasi sesi**: DM berbagi satu sesi utama; grup diisolasi
- **Koneksi WebSocket**: long connection melalui SDK Feishu, tidak memerlukan URL publik

---

## Kontrol akses

### Pesan langsung

- **Default**: `dmPolicy: "pairing"` (pengguna yang tidak dikenal mendapatkan kode pairing)
- **Setujui pairing**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **Mode allowlist**: tetapkan `channels.feishu.allowFrom` dengan Open ID yang diizinkan

### Obrolan grup

**1. Kebijakan grup** (`channels.feishu.groupPolicy`):

- `"open"` = izinkan semua orang di grup
- `"allowlist"` = hanya izinkan `groupAllowFrom`
- `"disabled"` = nonaktifkan pesan grup

Default: `allowlist`

**2. Persyaratan mention** (`channels.feishu.requireMention`, dapat dioverride melalui `channels.feishu.groups.<chat_id>.requireMention`):

- `true` eksplisit = memerlukan @mention
- `false` eksplisit = merespons tanpa mention
- jika tidak ditetapkan dan `groupPolicy: "open"` = default ke `false`
- jika tidak ditetapkan dan `groupPolicy` bukan `"open"` = default ke `true`

---

## Contoh konfigurasi grup

### Izinkan semua grup, tanpa @mention wajib (default untuk grup terbuka)

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
      // Feishu group IDs (chat_id) look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Batasi pengirim mana yang dapat mengirim pesan dalam grup (allowlist pengirim)

Selain mengizinkan grup itu sendiri, **semua pesan** dalam grup tersebut dibatasi oleh sender `open_id`: hanya pengguna yang tercantum di `groups.<chat_id>.allowFrom` yang pesannya diproses; pesan dari anggota lain diabaikan (ini adalah pembatasan penuh di level pengirim, bukan hanya untuk perintah kontrol seperti /reset atau /new).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Feishu user IDs (open_id) look like: ou_xxx
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

### ID grup (chat_id)

ID grup terlihat seperti `oc_xxx`.

**Metode 1 (direkomendasikan)**

1. Jalankan gateway dan lakukan @mention pada bot di grup
2. Jalankan `openclaw logs --follow` dan cari `chat_id`

**Metode 2**

Gunakan debugger API Feishu untuk mencantumkan obrolan grup.

### ID pengguna (open_id)

ID pengguna terlihat seperti `ou_xxx`.

**Metode 1 (direkomendasikan)**

1. Jalankan gateway dan kirim DM ke bot
2. Jalankan `openclaw logs --follow` dan cari `open_id`

**Metode 2**

Periksa permintaan pairing untuk Open ID pengguna:

```bash
openclaw pairing list feishu
```

---

## Perintah umum

| Perintah  | Deskripsi              |
| --------- | ---------------------- |
| `/status` | Tampilkan status bot   |
| `/reset`  | Reset sesi             |
| `/model`  | Tampilkan/ganti model  |

> Catatan: Feishu belum mendukung menu perintah native, jadi perintah harus dikirim sebagai teks.

## Perintah manajemen gateway

| Perintah                   | Deskripsi                     |
| -------------------------- | ----------------------------- |
| `openclaw gateway status`  | Tampilkan status gateway      |
| `openclaw gateway install` | Instal/jalankan layanan gateway |
| `openclaw gateway stop`    | Hentikan layanan gateway      |
| `openclaw gateway restart` | Mulai ulang gateway           |
| `openclaw logs --follow`   | Ikuti log gateway             |

---

## Pemecahan masalah

### Bot tidak merespons di obrolan grup

1. Pastikan bot sudah ditambahkan ke grup
2. Pastikan Anda melakukan @mention pada bot (perilaku default)
3. Periksa `groupPolicy` tidak disetel ke `"disabled"`
4. Periksa log: `openclaw logs --follow`

### Bot tidak menerima pesan

1. Pastikan aplikasi sudah dipublikasikan dan disetujui
2. Pastikan langganan peristiwa menyertakan `im.message.receive_v1`
3. Pastikan **long connection** diaktifkan
4. Pastikan izin aplikasi sudah lengkap
5. Pastikan gateway sedang berjalan: `openclaw gateway status`
6. Periksa log: `openclaw logs --follow`

### Kebocoran App Secret

1. Reset App Secret di Feishu Open Platform
2. Perbarui App Secret di konfigurasi Anda
3. Mulai ulang gateway

### Kegagalan pengiriman pesan

1. Pastikan aplikasi memiliki izin `im:message:send_as_bot`
2. Pastikan aplikasi sudah dipublikasikan
3. Periksa log untuk error yang lebih rinci

---

## Konfigurasi lanjutan

### Banyak akun

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

`defaultAccount` mengontrol akun Feishu mana yang digunakan ketika API outbound tidak menentukan `accountId` secara eksplisit.

### Batas pesan

- `textChunkLimit`: ukuran potongan teks outbound (default: 2000 karakter)
- `mediaMaxMb`: batas upload/download media (default: 30MB)

### Streaming

Feishu mendukung balasan streaming melalui kartu interaktif. Saat diaktifkan, bot memperbarui kartu ketika menghasilkan teks.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default true)
      blockStreaming: true, // enable block-level streaming (default true)
    },
  },
}
```

Tetapkan `streaming: false` untuk menunggu balasan lengkap sebelum mengirim.

### Sesi ACP

Feishu mendukung ACP untuk:

- DM
- percakapan topik grup

ACP Feishu dikendalikan oleh perintah teks. Tidak ada menu slash-command native, jadi gunakan pesan `/acp ...` langsung di percakapan.

#### Binding ACP persisten

Gunakan binding ACP bertipe di level teratas untuk menautkan DM atau percakapan topik Feishu ke sesi ACP persisten.

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

#### Spawn ACP terikat thread dari obrolan

Di DM atau percakapan topik Feishu, Anda dapat membuat dan menautkan sesi ACP langsung di tempat:

```text
/acp spawn codex --thread here
```

Catatan:

- `--thread here` berfungsi untuk DM dan topik Feishu.
- Pesan lanjutan dalam DM/topik yang terikat dirutekan langsung ke sesi ACP tersebut.
- v1 tidak menargetkan obrolan grup umum tanpa topik.

### Routing multi-agent

Gunakan `bindings` untuk merutekan DM atau grup Feishu ke agen yang berbeda.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
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
- `match.peer.kind`: `"direct"` atau `"group"`
- `match.peer.id`: Open ID pengguna (`ou_xxx`) atau ID grup (`oc_xxx`)

Lihat [Dapatkan ID grup/pengguna](#get-groupuser-ids) untuk tips pencarian.

---

## Referensi konfigurasi

Konfigurasi lengkap: [Gateway configuration](/gateway/configuration)

Opsi utama:

| Pengaturan                                        | Deskripsi                               | Default          |
| ------------------------------------------------- | --------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Aktifkan/nonaktifkan channel            | `true`           |
| `channels.feishu.domain`                          | Domain API (`feishu` atau `lark`)       | `feishu`         |
| `channels.feishu.connectionMode`                  | Mode transport peristiwa                | `websocket`      |
| `channels.feishu.defaultAccount`                  | ID akun default untuk routing outbound  | `default`        |
| `channels.feishu.verificationToken`               | Wajib untuk mode webhook                | -                |
| `channels.feishu.encryptKey`                      | Wajib untuk mode webhook                | -                |
| `channels.feishu.webhookPath`                     | Path rute webhook                       | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Host bind webhook                       | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Port bind webhook                       | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                  | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                              | -                |
| `channels.feishu.accounts.<id>.domain`            | Override domain API per akun            | `feishu`         |
| `channels.feishu.dmPolicy`                        | Kebijakan DM                            | `pairing`        |
| `channels.feishu.allowFrom`                       | Allowlist DM (daftar `open_id`)         | -                |
| `channels.feishu.groupPolicy`                     | Kebijakan grup                          | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Allowlist grup                          | -                |
| `channels.feishu.requireMention`                  | Persyaratan @mention default            | conditional      |
| `channels.feishu.groups.<chat_id>.requireMention` | Override @mention wajib per grup        | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Aktifkan grup                           | `true`           |
| `channels.feishu.textChunkLimit`                  | Ukuran potongan pesan                   | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Batas ukuran media                      | `30`             |
| `channels.feishu.streaming`                       | Aktifkan output kartu streaming         | `true`           |
| `channels.feishu.blockStreaming`                  | Aktifkan streaming per blok             | `true`           |

---

## Referensi dmPolicy

| Nilai         | Perilaku                                                        |
| ------------- | --------------------------------------------------------------- |
| `"pairing"`   | **Default.** Pengguna tak dikenal mendapatkan kode pairing; harus disetujui |
| `"allowlist"` | Hanya pengguna di `allowFrom` yang dapat mengobrol              |
| `"open"`      | Izinkan semua pengguna (memerlukan `"*"` di `allowFrom`)        |
| `"disabled"`  | Nonaktifkan DM                                                  |

---

## Jenis pesan yang didukung

### Menerima

- ✅ Teks
- ✅ Rich text (post)
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Stiker

### Mengirim

- ✅ Teks
- ✅ Gambar
- ✅ File
- ✅ Audio
- ✅ Video/media
- ✅ Kartu interaktif
- ⚠️ Rich text (pemformatan gaya post dan kartu, bukan fitur authoring Feishu yang sewenang-wenang)

### Thread dan balasan

- ✅ Balasan inline
- ✅ Balasan topic-thread saat Feishu mengekspos `reply_in_thread`
- ✅ Balasan media tetap sadar thread saat membalas pesan thread/topik

## Komentar Drive

Feishu dapat memicu agen ketika seseorang menambahkan komentar pada dokumen Feishu Drive (Docs, Sheets,
dan lain-lain). Agen menerima teks komentar, konteks dokumen, dan thread komentar sehingga dapat
merespons di dalam thread atau melakukan edit dokumen.

Persyaratan:

- Berlangganan ke `drive.notice.comment_add_v1` di pengaturan langganan peristiwa aplikasi Feishu Anda
  (bersama `im.message.receive_v1` yang sudah ada)
- Tool Drive aktif secara default; nonaktifkan dengan `channels.feishu.tools.drive: false`

Tool `feishu_drive` mengekspos tindakan komentar berikut:

| Tindakan               | Deskripsi                              |
| ---------------------- | -------------------------------------- |
| `list_comments`        | Daftarkan komentar pada dokumen        |
| `list_comment_replies` | Daftarkan balasan dalam thread komentar |
| `add_comment`          | Tambahkan komentar tingkat atas baru   |
| `reply_comment`        | Balas thread komentar yang ada         |

Saat agen menangani peristiwa komentar Drive, agen menerima:

- teks komentar dan pengirim
- metadata dokumen (judul, jenis, URL)
- konteks thread komentar untuk balasan dalam thread

Setelah melakukan edit dokumen, agen diarahkan untuk menggunakan `feishu_drive.reply_comment` guna memberi tahu
pemberi komentar lalu mengeluarkan token senyap yang persis `NO_REPLY` / `no_reply` untuk
menghindari pengiriman duplikat.

## Permukaan tindakan runtime

Feishu saat ini mengekspos tindakan runtime berikut:

- `send`
- `read`
- `edit`
- `thread-reply`
- `pin`
- `list-pins`
- `unpin`
- `member-info`
- `channel-info`
- `channel-list`
- `react` dan `reactions` saat reaksi diaktifkan dalam konfigurasi
- tindakan komentar `feishu_drive`: `list_comments`, `list_comment_replies`, `add_comment`, `reply_comment`

## Terkait

- [Channels Overview](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Channel Routing](/channels/channel-routing) — routing sesi untuk pesan
- [Security](/gateway/security) — model akses dan penguatan
