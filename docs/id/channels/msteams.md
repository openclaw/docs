---
read_when:
    - Mengerjakan fitur channel Microsoft Teams
summary: Status dukungan bot Microsoft Teams, kapabilitas, dan konfigurasi
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-05T13:44:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99fc6e136893ec65dc85d3bc0c0d92134069a2f3b8cb4fcf66c14674399b3eaf
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "Tinggalkan semua harapan, hai kalian yang masuk ke sini."

Diperbarui: 2026-01-21

Status: teks + lampiran DM didukung; pengiriman file channel/grup memerlukan `sharePointSiteId` + izin Graph (lihat [Mengirim file di obrolan grup](#sending-files-in-group-chats)). Poll dikirim melalui Adaptive Cards. Aksi pesan mengekspos `upload-file` secara eksplisit untuk pengiriman yang mengutamakan file.

## Plugin bawaan

Microsoft Teams dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, jadi tidak diperlukan instalasi terpisah dalam build paket normal.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Teams bawaan, instal secara manual:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detail: [Plugins](/tools/plugin)

## Penyiapan cepat (pemula)

1. Pastikan plugin Microsoft Teams tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat **Azure Bot** (App ID + client secret + tenant ID).
3. Konfigurasikan OpenClaw dengan kredensial tersebut.
4. Ekspos `/api/messages` (default port 3978) melalui URL publik atau tunnel.
5. Instal paket aplikasi Teams dan jalankan gateway.

Config minimal:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Catatan: obrolan grup diblokir secara default (`channels.msteams.groupPolicy: "allowlist"`). Untuk mengizinkan balasan grup, atur `channels.msteams.groupAllowFrom` (atau gunakan `groupPolicy: "open"` untuk mengizinkan anggota mana pun, dengan gating mention).

## Tujuan

- Berbicara dengan OpenClaw melalui DM, obrolan grup, atau channel Teams.
- Menjaga perutean tetap deterministik: balasan selalu kembali ke channel asal kedatangannya.
- Default ke perilaku channel yang aman (mention diwajibkan kecuali dikonfigurasi lain).

## Penulisan config

Secara default, Microsoft Teams diizinkan menulis pembaruan config yang dipicu oleh `/config set|unset` (memerlukan `commands.config: true`).

Nonaktifkan dengan:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrol akses (DM + grup)

**Akses DM**

- Default: `channels.msteams.dmPolicy = "pairing"`. Pengirim yang tidak dikenal diabaikan sampai disetujui.
- `channels.msteams.allowFrom` sebaiknya menggunakan AAD object ID yang stabil.
- UPN/nama tampilan dapat berubah; pencocokan langsung dinonaktifkan secara default dan hanya diaktifkan dengan `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard dapat me-resolve nama ke ID melalui Microsoft Graph jika kredensial mengizinkan.

**Akses grup**

- Default: `channels.msteams.groupPolicy = "allowlist"` (diblokir kecuali Anda menambahkan `groupAllowFrom`). Gunakan `channels.defaults.groupPolicy` untuk menimpa default saat tidak disetel.
- `channels.msteams.groupAllowFrom` mengontrol pengirim mana yang dapat memicu di obrolan grup/channel (fallback ke `channels.msteams.allowFrom`).
- Set `groupPolicy: "open"` untuk mengizinkan anggota mana pun (tetap di-gate oleh mention secara default).
- Untuk mengizinkan **tanpa channel apa pun**, set `channels.msteams.groupPolicy: "disabled"`.

Contoh:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + allowlist channel**

- Lingkupi balasan grup/channel dengan mendaftarkan team dan channel di bawah `channels.msteams.teams`.
- Kunci sebaiknya menggunakan team ID yang stabil dan channel conversation ID.
- Saat `groupPolicy="allowlist"` dan allowlist teams tersedia, hanya team/channel yang terdaftar yang diterima (dengan gating mention).
- Wizard konfigurasi menerima entri `Team/Channel` dan menyimpannya untuk Anda.
- Saat startup, OpenClaw me-resolve nama team/channel dan nama allowlist pengguna ke ID (saat izin Graph mengizinkan)
  dan mencatat pemetaannya; nama team/channel yang tidak ter-resolve tetap disimpan seperti diketik tetapi diabaikan untuk perutean secara default kecuali `channels.msteams.dangerouslyAllowNameMatching: true` diaktifkan.

Contoh:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Cara kerjanya

1. Pastikan plugin Microsoft Teams tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat **Azure Bot** (App ID + secret + tenant ID).
3. Bangun **paket aplikasi Teams** yang merujuk ke bot dan menyertakan izin RSC di bawah ini.
4. Unggah/instal aplikasi Teams ke dalam team (atau cakupan personal untuk DM).
5. Konfigurasikan `msteams` di `~/.openclaw/openclaw.json` (atau env vars) dan jalankan gateway.
6. Gateway mendengarkan traffic webhook Bot Framework di `/api/messages` secara default.

## Penyiapan Azure Bot (Prasyarat)

Sebelum mengonfigurasi OpenClaw, Anda perlu membuat resource Azure Bot.

### Langkah 1: Buat Azure Bot

1. Buka [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Isi tab **Basics**:

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nama bot Anda, mis. `openclaw-msteams` (harus unik)      |
   | **Subscription**   | Pilih subscription Azure Anda                            |
   | **Resource group** | Buat baru atau gunakan yang sudah ada                    |
   | **Pricing tier**   | **Free** untuk dev/testing                               |
   | **Type of App**    | **Single Tenant** (disarankan - lihat catatan di bawah)  |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Pemberitahuan deprecation:** Pembuatan bot multi-tenant baru tidak lagi didukung setelah 2025-07-31. Gunakan **Single Tenant** untuk bot baru.

3. Klik **Review + create** → **Create** (tunggu ~1-2 menit)

### Langkah 2: Dapatkan Kredensial

1. Buka resource Azure Bot Anda → **Configuration**
2. Salin **Microsoft App ID** → ini adalah `appId` Anda
3. Klik **Manage Password** → buka App Registration
4. Di bawah **Certificates & secrets** → **New client secret** → salin **Value** → ini adalah `appPassword` Anda
5. Buka **Overview** → salin **Directory (tenant) ID** → ini adalah `tenantId` Anda

### Langkah 3: Konfigurasikan Messaging Endpoint

1. Di Azure Bot → **Configuration**
2. Set **Messaging endpoint** ke URL webhook Anda:
   - Produksi: `https://your-domain.com/api/messages`
   - Dev lokal: gunakan tunnel (lihat [Pengembangan Lokal](#local-development-tunneling) di bawah)

### Langkah 4: Aktifkan Channel Teams

1. Di Azure Bot → **Channels**
2. Klik **Microsoft Teams** → Configure → Save
3. Terima Terms of Service

## Pengembangan Lokal (Tunneling)

Teams tidak dapat menjangkau `localhost`. Gunakan tunnel untuk pengembangan lokal:

**Opsi A: ngrok**

```bash
ngrok http 3978
# Salin URL https, mis. https://abc123.ngrok.io
# Set messaging endpoint ke: https://abc123.ngrok.io/api/messages
```

**Opsi B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Gunakan URL Tailscale funnel Anda sebagai messaging endpoint
```

## Teams Developer Portal (Alternatif)

Alih-alih membuat ZIP manifest secara manual, Anda dapat menggunakan [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Klik **+ New app**
2. Isi info dasar (nama, deskripsi, info developer)
3. Buka **App features** → **Bot**
4. Pilih **Enter a bot ID manually** dan tempel Azure Bot App ID Anda
5. Centang scope: **Personal**, **Team**, **Group Chat**
6. Klik **Distribute** → **Download app package**
7. Di Teams: **Apps** → **Manage your apps** → **Upload a custom app** → pilih ZIP

Ini sering lebih mudah daripada mengedit manifest JSON secara manual.

## Menguji Bot

**Opsi A: Azure Web Chat (verifikasi webhook terlebih dahulu)**

1. Di Azure Portal → resource Azure Bot Anda → **Test in Web Chat**
2. Kirim pesan - Anda seharusnya melihat respons
3. Ini mengonfirmasi bahwa endpoint webhook Anda berfungsi sebelum penyiapan Teams

**Opsi B: Teams (setelah aplikasi diinstal)**

1. Instal aplikasi Teams (sideload atau katalog organisasi)
2. Temukan bot di Teams dan kirim DM
3. Periksa log gateway untuk aktivitas masuk

## Penyiapan (minimal hanya teks)

1. **Pastikan plugin Microsoft Teams tersedia**
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual:
     - Dari npm: `openclaw plugins install @openclaw/msteams`
     - Dari checkout lokal: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Registrasi bot**
   - Buat Azure Bot (lihat di atas) dan catat:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Manifest aplikasi Teams**
   - Sertakan entri `bot` dengan `botId = <App ID>`.
   - Scope: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (diperlukan untuk penanganan file dalam scope personal).
   - Tambahkan izin RSC (di bawah).
   - Buat ikon: `outline.png` (32x32) dan `color.png` (192x192).
   - Zip ketiga file menjadi satu: `manifest.json`, `outline.png`, `color.png`.

4. **Konfigurasikan OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Anda juga dapat menggunakan variabel lingkungan alih-alih kunci config:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **Endpoint bot**
   - Set Azure Bot Messaging Endpoint ke:
     - `https://<host>:3978/api/messages` (atau path/port pilihan Anda).

6. **Jalankan gateway**
   - Channel Teams dimulai secara otomatis saat plugin bawaan atau plugin yang diinstal manual tersedia dan config `msteams` ada beserta kredensialnya.

## Aksi info anggota

OpenClaw mengekspos aksi `member-info` berbasis Graph untuk Microsoft Teams sehingga agen dan otomatisasi dapat me-resolve detail anggota channel (nama tampilan, email, peran) langsung dari Microsoft Graph.

Persyaratan:

- Izin RSC `Member.Read.Group` (sudah ada dalam manifest yang direkomendasikan)
- Untuk lookup lintas-team: izin Graph Application `User.Read.All` dengan admin consent

Aksi ini di-gate oleh `channels.msteams.actions.memberInfo` (default: aktif saat kredensial Graph tersedia).

## Konteks riwayat

- `channels.msteams.historyLimit` mengontrol berapa banyak pesan channel/grup terbaru yang dibungkus ke dalam prompt.
- Fallback ke `messages.groupChat.historyLimit`. Set `0` untuk menonaktifkan (default 50).
- Riwayat thread yang diambil difilter oleh allowlist pengirim (`allowFrom` / `groupAllowFrom`), sehingga penanaman konteks thread hanya menyertakan pesan dari pengirim yang diizinkan.
- Konteks lampiran kutipan (`ReplyTo*` yang diturunkan dari HTML balasan Teams) saat ini diteruskan apa adanya.
- Dengan kata lain, allowlist mengatur siapa yang dapat memicu agen; hanya jalur konteks tambahan tertentu yang difilter saat ini.
- Riwayat DM dapat dibatasi dengan `channels.msteams.dmHistoryLimit` (giliran pengguna). Override per pengguna: `channels.msteams.dms["<user_id>"].historyLimit`.

## Izin RSC Teams saat ini (Manifest)

Berikut adalah **resourceSpecific permissions** yang sudah ada di manifest aplikasi Teams kami. Izin ini hanya berlaku di dalam team/chat tempat aplikasi diinstal.

**Untuk channel (scope team):**

- `ChannelMessage.Read.Group` (Application) - menerima semua teks pesan channel tanpa @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Untuk obrolan grup:**

- `ChatMessage.Read.Chat` (Application) - menerima semua pesan obrolan grup tanpa @mention

## Contoh Manifest Teams (disamarkan)

Contoh minimal yang valid dengan field yang diperlukan. Ganti ID dan URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Catatan penting manifest (field wajib)

- `bots[].botId` **harus** cocok dengan Azure Bot App ID.
- `webApplicationInfo.id` **harus** cocok dengan Azure Bot App ID.
- `bots[].scopes` harus menyertakan surface yang ingin Anda gunakan (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` diperlukan untuk penanganan file dalam scope personal.
- `authorization.permissions.resourceSpecific` harus menyertakan izin baca/kirim channel jika Anda ingin traffic channel.

### Memperbarui aplikasi yang sudah ada

Untuk memperbarui aplikasi Teams yang sudah terinstal (misalnya untuk menambahkan izin RSC):

1. Perbarui `manifest.json` Anda dengan setelan baru
2. **Naikkan field `version`** (mis. `1.0.0` → `1.1.0`)
3. **Zip ulang** manifest dengan ikon (`manifest.json`, `outline.png`, `color.png`)
4. Unggah ZIP baru:
   - **Opsi A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → temukan aplikasi Anda → Upload new version
   - **Opsi B (Sideload):** Di Teams → Apps → Manage your apps → Upload a custom app
5. **Untuk channel team:** instal ulang aplikasi di setiap team agar izin baru berlaku
6. **Keluar sepenuhnya lalu jalankan ulang Teams** (bukan hanya menutup jendela) untuk membersihkan metadata aplikasi yang di-cache

## Kapabilitas: hanya RSC vs Graph

### Dengan **hanya Teams RSC** (aplikasi terinstal, tanpa izin Microsoft Graph API)

Berfungsi:

- Membaca konten **teks** pesan channel.
- Mengirim konten **teks** pesan channel.
- Menerima lampiran file **personal (DM)**.

Tidak berfungsi:

- **Konten gambar atau file** channel/grup (payload hanya menyertakan stub HTML).
- Mengunduh lampiran yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan (di luar event webhook langsung).

### Dengan **Teams RSC + izin Microsoft Graph Application**

Menambahkan:

- Mengunduh hosted content (gambar yang ditempel ke pesan).
- Mengunduh lampiran file yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan channel/chat melalui Graph.

### RSC vs Graph API

| Kapabilitas             | Izin RSC              | Graph API                            |
| ----------------------- | --------------------- | ------------------------------------ |
| **Pesan real-time**     | Ya (melalui webhook)  | Tidak (hanya polling)                |
| **Pesan historis**      | Tidak                 | Ya (dapat mengambil riwayat)         |
| **Kompleksitas setup**  | Hanya manifest aplikasi | Memerlukan admin consent + alur token |
| **Berfungsi offline**   | Tidak (harus berjalan) | Ya (dapat melakukan query kapan saja) |

**Intinya:** RSC untuk mendengarkan secara real-time; Graph API untuk akses historis. Untuk mengejar pesan yang terlewat saat offline, Anda memerlukan Graph API dengan `ChannelMessage.Read.All` (memerlukan admin consent).

## Media + riwayat dengan Graph (diperlukan untuk channel)

Jika Anda memerlukan gambar/file di **channel** atau ingin mengambil **riwayat pesan**, Anda harus mengaktifkan izin Microsoft Graph dan memberikan admin consent.

1. Di Entra ID (Azure AD) **App Registration**, tambahkan Microsoft Graph **Application permissions**:
   - `ChannelMessage.Read.All` (lampiran channel + riwayat)
   - `Chat.Read.All` atau `ChatMessage.Read.All` (obrolan grup)
2. **Berikan admin consent** untuk tenant.
3. Naikkan **versi manifest** aplikasi Teams, unggah ulang, dan **instal ulang aplikasi di Teams**.
4. **Keluar sepenuhnya lalu jalankan ulang Teams** untuk membersihkan metadata aplikasi yang di-cache.

**Izin tambahan untuk mention pengguna:** Mention @pengguna berfungsi langsung untuk pengguna dalam percakapan. Namun, jika Anda ingin mencari dan me-mention pengguna secara dinamis yang **tidak berada dalam percakapan saat ini**, tambahkan izin `User.Read.All` (Application) dan berikan admin consent.

## Keterbatasan yang diketahui

### Timeout webhook

Teams mengirim pesan melalui webhook HTTP. Jika pemrosesan terlalu lama (misalnya respons LLM lambat), Anda mungkin melihat:

- Timeout gateway
- Teams mencoba ulang pesan (menyebabkan duplikasi)
- Balasan yang terlewat

OpenClaw menanganinya dengan mengembalikan respons dengan cepat dan mengirim balasan secara proaktif, tetapi respons yang sangat lambat masih dapat menyebabkan masalah.

### Pemformatan

Markdown Teams lebih terbatas daripada Slack atau Discord:

- Pemformatan dasar berfungsi: **tebal**, _miring_, `code`, tautan
- Markdown kompleks (tabel, daftar bertingkat) mungkin tidak dirender dengan benar
- Adaptive Cards didukung untuk poll dan pengiriman card arbitrer (lihat di bawah)

## Konfigurasi

Setelan utama (lihat `/gateway/configuration` untuk pola channel bersama):

- `channels.msteams.enabled`: aktifkan/nonaktifkan channel.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: kredensial bot.
- `channels.msteams.webhook.port` (default `3978`)
- `channels.msteams.webhook.path` (default `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing)
- `channels.msteams.allowFrom`: allowlist DM (AAD object ID direkomendasikan). Wizard me-resolve nama ke ID selama setup saat akses Graph tersedia.
- `channels.msteams.dangerouslyAllowNameMatching`: toggle break-glass untuk mengaktifkan kembali pencocokan UPN/nama tampilan yang bisa berubah dan perutean langsung nama team/channel.
- `channels.msteams.textChunkLimit`: ukuran chunk teks outbound.
- `channels.msteams.chunkMode`: `length` (default) atau `newline` untuk memisah berdasarkan baris kosong (batas paragraf) sebelum chunking berdasarkan panjang.
- `channels.msteams.mediaAllowHosts`: allowlist untuk host lampiran masuk (default ke domain Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist untuk melampirkan header Authorization pada percobaan ulang media (default ke host Graph + Bot Framework).
- `channels.msteams.requireMention`: wajibkan @mention di channel/grup (default true).
- `channels.msteams.replyStyle`: `thread | top-level` (lihat [Gaya Balasan](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per-team.
- `channels.msteams.teams.<teamId>.requireMention`: override per-team.
- `channels.msteams.teams.<teamId>.tools`: override kebijakan tool default per-team (`allow`/`deny`/`alsoAllow`) yang digunakan saat override channel tidak ada.
- `channels.msteams.teams.<teamId>.toolsBySender`: override kebijakan tool per-pengirim default per-team (`"*"` wildcard didukung).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per-channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per-channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: override kebijakan tool per-channel (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: override kebijakan tool per-pengirim per-channel (`"*"` wildcard didukung).
- Kunci `toolsBySender` sebaiknya menggunakan prefiks eksplisit:
  `id:`, `e164:`, `username:`, `name:` (kunci lama tanpa prefiks masih dipetakan hanya ke `id:`).
- `channels.msteams.actions.memberInfo`: aktifkan atau nonaktifkan aksi info anggota berbasis Graph (default: aktif saat kredensial Graph tersedia).
- `channels.msteams.sharePointSiteId`: SharePoint site ID untuk upload file di obrolan grup/channel (lihat [Mengirim file di obrolan grup](#sending-files-in-group-chats)).

## Perutean & Sesi

- Kunci sesi mengikuti format agen standar (lihat [/concepts/session](/concepts/session)):
  - Direct message berbagi sesi utama (`agent:<agentId>:<mainKey>`).
  - Pesan channel/grup menggunakan ID percakapan:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Gaya Balasan: Threads vs Posts

Teams baru-baru ini memperkenalkan dua gaya UI channel di atas model data dasar yang sama:

| Gaya                    | Deskripsi                                              | `replyStyle` yang direkomendasikan |
| ----------------------- | ------------------------------------------------------ | ---------------------------------- |
| **Posts** (klasik)      | Pesan muncul sebagai kartu dengan balasan ber-thread di bawahnya | `thread` (default)       |
| **Threads** (mirip Slack) | Pesan mengalir secara linear, lebih mirip Slack      | `top-level`                        |

**Masalahnya:** API Teams tidak mengekspos gaya UI channel yang digunakan. Jika Anda menggunakan `replyStyle` yang salah:

- `thread` di channel bergaya Threads → balasan muncul bertingkat secara janggal
- `top-level` di channel bergaya Posts → balasan muncul sebagai post top-level terpisah, bukan di dalam thread

**Solusi:** Konfigurasikan `replyStyle` per-channel berdasarkan cara channel disiapkan:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Lampiran & Gambar

**Keterbatasan saat ini:**

- **DM:** Gambar dan lampiran file berfungsi melalui API file bot Teams.
- **Channel/grup:** Lampiran berada di penyimpanan M365 (SharePoint/OneDrive). Payload webhook hanya menyertakan stub HTML, bukan byte file yang sebenarnya. **Izin Graph API diperlukan** untuk mengunduh lampiran channel.
- Untuk pengiriman eksplisit yang mengutamakan file, gunakan `action=upload-file` dengan `media` / `filePath` / `path`; `message` opsional menjadi teks/komentar pendamping, dan `filename` menimpa nama yang diunggah.

Tanpa izin Graph, pesan channel dengan gambar akan diterima sebagai teks saja (konten gambar tidak dapat diakses bot).
Secara default, OpenClaw hanya mengunduh media dari hostname Microsoft/Teams. Timpa dengan `channels.msteams.mediaAllowHosts` (gunakan `["*"]` untuk mengizinkan host mana pun).
Header Authorization hanya dilampirkan untuk host dalam `channels.msteams.mediaAuthAllowHosts` (default ke host Graph + Bot Framework). Jaga daftar ini tetap ketat (hindari suffix multi-tenant).

## Mengirim file di obrolan grup

Bot dapat mengirim file di DM menggunakan alur FileConsentCard (bawaan). Namun, **mengirim file di obrolan grup/channel** memerlukan setup tambahan:

| Konteks                  | Cara file dikirim                            | Setup yang diperlukan                              |
| ------------------------ | -------------------------------------------- | -------------------------------------------------- |
| **DM**                   | FileConsentCard → pengguna menerima → bot mengunggah | Langsung berfungsi                         |
| **Obrolan grup/channel** | Unggah ke SharePoint → bagikan tautan        | Memerlukan `sharePointSiteId` + izin Graph         |
| **Gambar (konteks apa pun)** | Inline berkode Base64                    | Langsung berfungsi                                 |

### Mengapa obrolan grup memerlukan SharePoint

Bot tidak memiliki drive OneDrive personal (endpoint Graph API `/me/drive` tidak berfungsi untuk identitas aplikasi). Untuk mengirim file di obrolan grup/channel, bot mengunggah ke **situs SharePoint** dan membuat tautan berbagi.

### Setup

1. **Tambahkan izin Graph API** di Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - unggah file ke SharePoint
   - `Chat.Read.All` (Application) - opsional, mengaktifkan tautan berbagi per-pengguna

2. **Berikan admin consent** untuk tenant.

3. **Dapatkan ID situs SharePoint Anda:**

   ```bash
   # Via Graph Explorer atau curl dengan token yang valid:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Contoh: untuk situs di "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Respons mencakup: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Konfigurasikan OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... config lain ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Perilaku berbagi

| Izin                                    | Perilaku berbagi                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` saja              | Tautan berbagi ke seluruh organisasi (siapa pun di org dapat mengakses) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Tautan berbagi per-pengguna (hanya anggota chat yang dapat mengakses)   |

Berbagi per-pengguna lebih aman karena hanya peserta chat yang dapat mengakses file. Jika izin `Chat.Read.All` tidak ada, bot fallback ke berbagi seluruh organisasi.

### Perilaku fallback

| Skenario                                          | Hasil                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| Obrolan grup + file + `sharePointSiteId` dikonfigurasi | Unggah ke SharePoint, kirim tautan berbagi     |
| Obrolan grup + file + tanpa `sharePointSiteId`    | Coba unggah ke OneDrive (mungkin gagal), kirim teks saja |
| Obrolan personal + file                           | Alur FileConsentCard (berfungsi tanpa SharePoint)  |
| Konteks apa pun + gambar                          | Inline berkode Base64 (berfungsi tanpa SharePoint) |

### Lokasi penyimpanan file

File yang diunggah disimpan di folder `/OpenClawShared/` di pustaka dokumen default situs SharePoint yang dikonfigurasi.

## Poll (Adaptive Cards)

OpenClaw mengirim poll Teams sebagai Adaptive Cards (tidak ada API poll Teams bawaan).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Suara dicatat oleh gateway di `~/.openclaw/msteams-polls.json`.
- Gateway harus tetap online untuk mencatat suara.
- Poll belum otomatis mem-posting ringkasan hasil (periksa file penyimpanan jika perlu).

## Adaptive Cards (arbitrer)

Kirim JSON Adaptive Card apa pun ke pengguna atau percakapan Teams menggunakan tool `message` atau CLI.

Parameter `card` menerima objek JSON Adaptive Card. Saat `card` disediakan, teks pesan bersifat opsional.

**Tool agen:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

Lihat [dokumentasi Adaptive Cards](https://adaptivecards.io/) untuk skema card dan contoh. Untuk detail format target, lihat [Format target](#target-formats) di bawah.

## Format target

Target MSTeams menggunakan prefiks untuk membedakan pengguna dan percakapan:

| Jenis target         | Format                           | Contoh                                              |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| Pengguna (berdasarkan ID) | `user:<aad-object-id>`      | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Pengguna (berdasarkan nama) | `user:<display-name>`     | `user:John Smith` (memerlukan Graph API)           |
| Grup/channel         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Grup/channel (mentah) | `<conversation-id>`             | `19:abc123...@thread.tacv2` (jika mengandung `@thread`) |

**Contoh CLI:**

```bash
# Kirim ke pengguna berdasarkan ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Kirim ke pengguna berdasarkan nama tampilan (memicu lookup Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Kirim ke obrolan grup atau channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Kirim Adaptive Card ke percakapan
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**Contoh tool agen:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  card: {
    type: "AdaptiveCard",
    version: "1.5",
    body: [{ type: "TextBlock", text: "Hello" }],
  },
}
```

Catatan: Tanpa prefiks `user:`, nama secara default di-resolve sebagai grup/team. Selalu gunakan `user:` saat menargetkan orang berdasarkan nama tampilan.

## Pesan proaktif

- Pesan proaktif hanya dimungkinkan **setelah** pengguna berinteraksi, karena saat itulah kami menyimpan referensi percakapan.
- Lihat `/gateway/configuration` untuk gating `dmPolicy` dan allowlist.

## ID Team dan Channel (Jebakan Umum)

Parameter kueri `groupId` di URL Teams **BUKAN** team ID yang digunakan untuk konfigurasi. Ekstrak ID dari path URL sebagai gantinya:

**URL Team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (URL-decode ini)
```

**URL Channel:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode ini)
```

**Untuk config:**

- Team ID = segmen path setelah `/team/` (URL-decoded, mis. `19:Bk4j...@thread.tacv2`)
- Channel ID = segmen path setelah `/channel/` (URL-decoded)
- **Abaikan** parameter kueri `groupId`

## Channel Privat

Bot memiliki dukungan terbatas di channel privat:

| Fitur                        | Channel Standar | Channel Privat        |
| ---------------------------- | --------------- | --------------------- |
| Instalasi bot                | Ya              | Terbatas              |
| Pesan real-time (webhook)    | Ya              | Mungkin tidak berfungsi |
| Izin RSC                     | Ya              | Dapat berperilaku berbeda |
| @mentions                    | Ya              | Jika bot dapat diakses |
| Riwayat Graph API            | Ya              | Ya (dengan izin)      |

**Solusi sementara jika channel privat tidak berfungsi:**

1. Gunakan channel standar untuk interaksi bot
2. Gunakan DM - pengguna selalu dapat mengirim pesan langsung ke bot
3. Gunakan Graph API untuk akses historis (memerlukan `ChannelMessage.Read.All`)

## Pemecahan masalah

### Masalah umum

- **Gambar tidak muncul di channel:** izin Graph atau admin consent belum ada. Instal ulang aplikasi Teams dan keluar/buka kembali Teams sepenuhnya.
- **Tidak ada respons di channel:** mention diwajibkan secara default; set `channels.msteams.requireMention=false` atau konfigurasikan per team/channel.
- **Ketidakcocokan versi (Teams masih menampilkan manifest lama):** hapus + tambahkan kembali aplikasi dan keluar sepenuhnya dari Teams untuk refresh.
- **401 Unauthorized dari webhook:** Wajar saat menguji manual tanpa Azure JWT - artinya endpoint dapat dijangkau tetapi autentikasi gagal. Gunakan Azure Web Chat untuk menguji dengan benar.

### Error upload manifest

- **"Icon file cannot be empty":** Manifest merujuk file ikon yang berukuran 0 byte. Buat ikon PNG yang valid (32x32 untuk `outline.png`, 192x192 untuk `color.png`).
- **"webApplicationInfo.Id already in use":** Aplikasi masih terinstal di team/chat lain. Temukan dan uninstall terlebih dahulu, atau tunggu 5-10 menit untuk propagasi.
- **"Something went wrong" saat upload:** Unggah melalui [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), lalu buka browser DevTools (F12) → tab Network, dan periksa body respons untuk error sebenarnya.
- **Sideload gagal:** Coba "Upload an app to your org's app catalog" alih-alih "Upload a custom app" - ini sering melewati pembatasan sideload.

### Izin RSC tidak berfungsi

1. Verifikasi `webApplicationInfo.id` cocok persis dengan App ID bot Anda
2. Unggah ulang aplikasi dan instal ulang di team/chat
3. Periksa apakah admin organisasi Anda memblokir izin RSC
4. Pastikan Anda menggunakan scope yang benar: `ChannelMessage.Read.Group` untuk teams, `ChatMessage.Read.Chat` untuk obrolan grup

## Referensi

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - panduan setup Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - membuat/mengelola aplikasi Teams
- [Skema manifest aplikasi Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Menerima pesan channel dengan RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referensi izin RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Penanganan file bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (channel/grup memerlukan Graph)
- [Pesan proaktif](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Terkait

- [Ringkasan Channel](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/channels/groups) — perilaku obrolan grup dan gating mention
- [Channel Routing](/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/gateway/security) — model akses dan hardening
