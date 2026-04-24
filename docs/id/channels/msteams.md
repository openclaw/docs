---
read_when:
    - Mengerjakan fitur channel Microsoft Teams
summary: Status dukungan, kapabilitas, dan konfigurasi bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T08:58:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

Pesan teks dan lampiran DM didukung; pengiriman file ke channel dan grup memerlukan `sharePointSiteId` + izin Graph (lihat [Mengirim file di chat grup](#sending-files-in-group-chats)). Poll dikirim melalui Adaptive Cards. Aksi pesan menampilkan `upload-file` yang eksplisit untuk pengiriman yang mengutamakan file.

## Plugin bawaan

Microsoft Teams tersedia sebagai Plugin bawaan di rilis OpenClaw saat ini, jadi tidak
memerlukan instalasi terpisah dalam build paket normal.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Teams bawaan,
instal secara manual:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detail: [Plugins](/id/tools/plugin)

## Penyiapan cepat (pemula)

1. Pastikan Plugin Microsoft Teams tersedia.
   - Rilis OpenClaw paket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat **Azure Bot** (App ID + client secret + tenant ID).
3. Konfigurasikan OpenClaw dengan kredensial tersebut.
4. Ekspos `/api/messages` (port 3978 secara default) melalui URL publik atau tunnel.
5. Instal paket aplikasi Teams dan mulai Gateway.

Konfigurasi minimal (client secret):

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

Untuk deployment produksi, pertimbangkan penggunaan [autentikasi federasi](#federated-authentication) (sertifikat atau managed identity) alih-alih client secret.

Catatan: chat grup diblokir secara default (`channels.msteams.groupPolicy: "allowlist"`). Untuk mengizinkan balasan grup, setel `channels.msteams.groupAllowFrom` (atau gunakan `groupPolicy: "open"` untuk mengizinkan anggota mana pun, dengan pembatasan mention).

## Penulisan konfigurasi

Secara default, Microsoft Teams diizinkan menulis pembaruan konfigurasi yang dipicu oleh `/config set|unset` (memerlukan `commands.config: true`).

Nonaktifkan dengan:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrol akses (DM + grup)

**Akses DM**

- Default: `channels.msteams.dmPolicy = "pairing"`. Pengirim yang tidak dikenal diabaikan sampai disetujui.
- `channels.msteams.allowFrom` harus menggunakan AAD object ID yang stabil.
- Jangan mengandalkan pencocokan UPN/display-name untuk allowlist — nilainya bisa berubah. OpenClaw menonaktifkan pencocokan nama langsung secara default; aktifkan secara eksplisit dengan `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard dapat menyelesaikan nama ke ID melalui Microsoft Graph jika kredensial mengizinkan.

**Akses grup**

- Default: `channels.msteams.groupPolicy = "allowlist"` (diblokir kecuali Anda menambahkan `groupAllowFrom`). Gunakan `channels.defaults.groupPolicy` untuk mengganti default saat tidak disetel.
- `channels.msteams.groupAllowFrom` mengontrol pengirim mana yang dapat memicu di chat grup/channel (fallback ke `channels.msteams.allowFrom`).
- Setel `groupPolicy: "open"` untuk mengizinkan anggota mana pun (tetap dibatasi mention secara default).
- Untuk tidak mengizinkan **channel apa pun**, setel `channels.msteams.groupPolicy: "disabled"`.

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

- Cakup balasan grup/channel dengan mencantumkan teams dan channels di bawah `channels.msteams.teams`.
- Key sebaiknya menggunakan team ID dan channel conversation ID yang stabil.
- Saat `groupPolicy="allowlist"` dan allowlist teams tersedia, hanya teams/channels yang tercantum yang diterima (dengan pembatasan mention).
- Wizard konfigurasi menerima entri `Team/Channel` dan menyimpannya untuk Anda.
- Saat startup, OpenClaw menyelesaikan nama team/channel dan user allowlist ke ID (saat izin Graph mengizinkan)
  dan mencatat pemetaannya; nama team/channel yang tidak terselesaikan tetap disimpan seperti diketik tetapi diabaikan untuk routing secara default kecuali `channels.msteams.dangerouslyAllowNameMatching: true` diaktifkan.

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

## Penyiapan Azure Bot

Sebelum mengonfigurasi OpenClaw, buat resource Azure Bot dan simpan kredensialnya.

<Steps>
  <Step title="Buat Azure Bot">
    Buka [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) dan isi tab **Basics**:

    | Field              | Value                                                    |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | Nama bot Anda, mis. `openclaw-msteams` (harus unik)      |
    | **Subscription**   | Langganan Azure Anda                                     |
    | **Resource group** | Buat baru atau gunakan yang sudah ada                    |
    | **Pricing tier**   | **Free** untuk dev/testing                               |
    | **Type of App**    | **Single Tenant** (disarankan)                           |
    | **Creation type**  | **Create new Microsoft App ID**                          |

    <Note>
    Bot multi-tenant baru dihentikan setelah 2025-07-31. Gunakan **Single Tenant** untuk bot baru.
    </Note>

    Klik **Review + create** → **Create** (tunggu ~1-2 menit).

  </Step>

  <Step title="Simpan kredensial">
    Dari resource Azure Bot → **Configuration**:

    - salin **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → salin nilainya → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Konfigurasikan endpoint pesan">
    Azure Bot → **Configuration** → setel **Messaging endpoint**:

    - Produksi: `https://your-domain.com/api/messages`
    - Dev lokal: gunakan tunnel (lihat [Pengembangan lokal](#local-development-tunneling))

  </Step>

  <Step title="Aktifkan channel Teams">
    Azure Bot → **Channels** → klik **Microsoft Teams** → Configure → Save. Terima Terms of Service.
  </Step>
</Steps>

## Autentikasi federasi

> Ditambahkan pada 2026.3.24

Untuk deployment produksi, OpenClaw mendukung **autentikasi federasi** sebagai alternatif yang lebih aman dibandingkan client secret. Tersedia dua metode:

### Opsi A: Autentikasi berbasis sertifikat

Gunakan sertifikat PEM yang terdaftar pada registrasi aplikasi Entra ID Anda.

**Penyiapan:**

1. Buat atau dapatkan sertifikat (format PEM dengan private key).
2. Di Entra ID → App Registration → **Certificates & secrets** → **Certificates** → unggah sertifikat publik.

**Konfigurasi:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Variabel env:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opsi B: Azure Managed Identity

Gunakan Azure Managed Identity untuk autentikasi tanpa kata sandi. Ini ideal untuk deployment di infrastruktur Azure (AKS, App Service, Azure VM) saat managed identity tersedia.

**Cara kerjanya:**

1. Pod/VM bot memiliki managed identity (system-assigned atau user-assigned).
2. **Federated identity credential** menghubungkan managed identity ke registrasi aplikasi Entra ID.
3. Saat runtime, OpenClaw menggunakan `@azure/identity` untuk memperoleh token dari endpoint Azure IMDS (`169.254.169.254`).
4. Token diteruskan ke SDK Teams untuk autentikasi bot.

**Prasyarat:**

- Infrastruktur Azure dengan managed identity aktif (AKS workload identity, App Service, VM)
- Federated identity credential dibuat pada registrasi aplikasi Entra ID
- Akses jaringan ke IMDS (`169.254.169.254:80`) dari pod/VM

**Konfigurasi (managed identity system-assigned):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Konfigurasi (managed identity user-assigned):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Variabel env:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (hanya untuk user-assigned)

### Penyiapan workload identity AKS

Untuk deployment AKS yang menggunakan workload identity:

1. **Aktifkan workload identity** pada cluster AKS Anda.
2. **Buat federated identity credential** pada registrasi aplikasi Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Tambahkan anotasi pada Kubernetes service account** dengan app client ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Tambahkan label pada pod** untuk injeksi workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Pastikan akses jaringan** ke IMDS (`169.254.169.254`) — jika menggunakan NetworkPolicy, tambahkan aturan egress yang mengizinkan lalu lintas ke `169.254.169.254/32` pada port 80.

### Perbandingan jenis autentikasi

| Method               | Config                                         | Pros                               | Cons                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Penyiapan sederhana                | Perlu rotasi secret, kurang aman      |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Tidak ada secret bersama di jaringan | Overhead pengelolaan sertifikat     |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Tanpa kata sandi, tanpa secret untuk dikelola | Memerlukan infrastruktur Azure |

**Perilaku default:** Saat `authType` tidak disetel, OpenClaw secara default menggunakan autentikasi client secret. Konfigurasi yang sudah ada tetap berfungsi tanpa perubahan.

## Pengembangan lokal (tunneling)

Teams tidak dapat menjangkau `localhost`. Gunakan tunnel untuk pengembangan lokal:

**Opsi A: ngrok**

```bash
ngrok http 3978
# Salin URL https, mis., https://abc123.ngrok.io
# Setel messaging endpoint ke: https://abc123.ngrok.io/api/messages
```

**Opsi B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Gunakan URL funnel Tailscale Anda sebagai messaging endpoint
```

## Teams Developer Portal (alternatif)

Alih-alih membuat ZIP manifest secara manual, Anda dapat menggunakan [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Klik **+ New app**
2. Isi informasi dasar (nama, deskripsi, informasi pengembang)
3. Buka **App features** → **Bot**
4. Pilih **Enter a bot ID manually** lalu tempel Azure Bot App ID Anda
5. Centang cakupan: **Personal**, **Team**, **Group Chat**
6. Klik **Distribute** → **Download app package**
7. Di Teams: **Apps** → **Manage your apps** → **Upload a custom app** → pilih ZIP

Ini sering kali lebih mudah daripada mengedit manifest JSON secara manual.

## Menguji bot

**Opsi A: Azure Web Chat (verifikasi Webhook terlebih dahulu)**

1. Di Azure Portal → resource Azure Bot Anda → **Test in Web Chat**
2. Kirim pesan - Anda seharusnya melihat respons
3. Ini mengonfirmasi endpoint Webhook Anda berfungsi sebelum penyiapan Teams

**Opsi B: Teams (setelah aplikasi diinstal)**

1. Instal aplikasi Teams (sideload atau katalog organisasi)
2. Temukan bot di Teams dan kirim DM
3. Periksa log Gateway untuk aktivitas masuk

<Accordion title="Override variabel environment">

Semua key konfigurasi bot/autentikasi juga dapat disetel melalui variabel env:

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (`"secret"` atau `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` (federated + sertifikat)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (federated + managed identity; client ID hanya untuk user-assigned)

</Accordion>

## Aksi info anggota

OpenClaw menyediakan aksi `member-info` yang didukung Graph untuk Microsoft Teams sehingga agen dan automasi dapat menyelesaikan detail anggota channel (nama tampilan, email, peran) langsung dari Microsoft Graph.

Persyaratan:

- Izin RSC `Member.Read.Group` (sudah ada dalam manifest yang direkomendasikan)
- Untuk lookup lintas tim: izin Aplikasi Graph `User.Read.All` dengan persetujuan admin

Aksi ini dikendalikan oleh `channels.msteams.actions.memberInfo` (default: aktif saat kredensial Graph tersedia).

## Konteks riwayat

- `channels.msteams.historyLimit` mengontrol berapa banyak pesan channel/grup terbaru yang dibungkus ke dalam prompt.
- Fallback ke `messages.groupChat.historyLimit`. Setel `0` untuk menonaktifkan (default 50).
- Riwayat thread yang diambil difilter berdasarkan allowlist pengirim (`allowFrom` / `groupAllowFrom`), sehingga penyemaian konteks thread hanya menyertakan pesan dari pengirim yang diizinkan.
- Konteks lampiran kutipan (`ReplyTo*` yang diturunkan dari HTML balasan Teams) saat ini diteruskan sebagaimana diterima.
- Dengan kata lain, allowlist mengendalikan siapa yang dapat memicu agen; hanya jalur konteks tambahan tertentu yang saat ini difilter.
- Riwayat DM dapat dibatasi dengan `channels.msteams.dmHistoryLimit` (giliran pengguna). Override per pengguna: `channels.msteams.dms["<user_id>"].historyLimit`.

## Izin RSC Teams saat ini

Ini adalah **izin resourceSpecific yang sudah ada** di manifest aplikasi Teams kami. Izin ini hanya berlaku di dalam tim/chat tempat aplikasi diinstal.

**Untuk channel (cakupan tim):**

- `ChannelMessage.Read.Group` (Application) - menerima semua pesan channel tanpa @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Untuk chat grup:**

- `ChatMessage.Read.Chat` (Application) - menerima semua pesan chat grup tanpa @mention

## Contoh manifest Teams

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

### Catatan manifest (field wajib)

- `bots[].botId` **harus** cocok dengan Azure Bot App ID.
- `webApplicationInfo.id` **harus** cocok dengan Azure Bot App ID.
- `bots[].scopes` harus menyertakan permukaan yang ingin Anda gunakan (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` diperlukan untuk penanganan file dalam cakupan personal.
- `authorization.permissions.resourceSpecific` harus menyertakan izin baca/kirim channel jika Anda menginginkan lalu lintas channel.

### Memperbarui aplikasi yang sudah ada

Untuk memperbarui aplikasi Teams yang sudah diinstal (misalnya, untuk menambahkan izin RSC):

1. Perbarui `manifest.json` Anda dengan pengaturan baru
2. **Naikkan field `version`** (mis. `1.0.0` → `1.1.0`)
3. **Zip ulang** manifest beserta ikon (`manifest.json`, `outline.png`, `color.png`)
4. Unggah zip baru:
   - **Opsi A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → temukan aplikasi Anda → Upload new version
   - **Opsi B (Sideload):** Di Teams → Apps → Manage your apps → Upload a custom app
5. **Untuk channel tim:** instal ulang aplikasi di setiap tim agar izin baru berlaku
6. **Tutup sepenuhnya dan buka kembali Teams** (bukan hanya menutup jendela) untuk membersihkan metadata aplikasi yang di-cache

## Kapabilitas: hanya RSC vs Graph

### Hanya Teams RSC (tanpa izin API Graph)

Berfungsi:

- Membaca konten **teks** pesan channel.
- Mengirim konten **teks** pesan channel.
- Menerima lampiran file **personal (DM)**.

Tidak berfungsi:

- **Gambar atau isi file** channel/grup (payload hanya menyertakan stub HTML).
- Mengunduh lampiran yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan (di luar peristiwa Webhook langsung).

### Teams RSC ditambah izin aplikasi Microsoft Graph

Menambahkan:

- Mengunduh konten yang di-hosting (gambar yang ditempel dalam pesan).
- Mengunduh lampiran file yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan channel/chat melalui Graph.

### RSC vs Graph API

| Capability              | RSC Permissions      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Real-time messages**  | Ya (melalui Webhook) | Tidak (hanya polling)               |
| **Historical messages** | Tidak                | Ya (dapat melakukan query riwayat)  |
| **Setup complexity**    | Hanya manifest aplikasi | Memerlukan persetujuan admin + alur token |
| **Works offline**       | Tidak (harus berjalan) | Ya (dapat query kapan saja)       |

**Intinya:** RSC untuk mendengarkan secara real-time; Graph API untuk akses historis. Untuk mengejar pesan yang terlewat saat offline, Anda memerlukan Graph API dengan `ChannelMessage.Read.All` (memerlukan persetujuan admin).

## Media + riwayat dengan Graph aktif (diperlukan untuk channel)

Jika Anda memerlukan gambar/file di **channel** atau ingin mengambil **riwayat pesan**, Anda harus mengaktifkan izin Microsoft Graph dan memberikan persetujuan admin.

1. Di **App Registration** Entra ID (Azure AD), tambahkan **izin Aplikasi** Microsoft Graph:
   - `ChannelMessage.Read.All` (lampiran channel + riwayat)
   - `Chat.Read.All` atau `ChatMessage.Read.All` (chat grup)
2. **Berikan persetujuan admin** untuk tenant.
3. Naikkan **versi manifest** aplikasi Teams, unggah ulang, dan **instal ulang aplikasi di Teams**.
4. **Tutup sepenuhnya dan buka kembali Teams** untuk membersihkan metadata aplikasi yang di-cache.

**Izin tambahan untuk mention pengguna:** @mention pengguna berfungsi langsung untuk pengguna di percakapan tersebut. Namun, jika Anda ingin mencari dan me-mention pengguna secara dinamis yang **tidak ada di percakapan saat ini**, tambahkan izin `User.Read.All` (Application) dan berikan persetujuan admin.

## Batasan yang diketahui

### Timeout Webhook

Teams mengirim pesan melalui Webhook HTTP. Jika pemrosesan terlalu lama (misalnya, respons LLM lambat), Anda dapat melihat:

- Timeout Gateway
- Teams mencoba ulang pesan (menyebabkan duplikat)
- Balasan terbuang

OpenClaw menanganinya dengan mengembalikan respons cepat dan mengirim balasan secara proaktif, tetapi respons yang sangat lambat masih dapat menimbulkan masalah.

### Pemformatan

Markdown Teams lebih terbatas dibanding Slack atau Discord:

- Pemformatan dasar berfungsi: **tebal**, _miring_, `code`, tautan
- Markdown kompleks (tabel, daftar bertingkat) mungkin tidak dirender dengan benar
- Adaptive Cards didukung untuk poll dan pengiriman presentasi semantik (lihat di bawah)

## Konfigurasi

Pengaturan yang dikelompokkan (lihat `/gateway/configuration` untuk pola channel bersama).

<AccordionGroup>
  <Accordion title="Core dan Webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: kredensial bot
    - `channels.msteams.webhook.port` (default `3978`)
    - `channels.msteams.webhook.path` (default `/api/messages`)
  </Accordion>

  <Accordion title="Autentikasi">
    - `authType`: `"secret"` (default) atau `"federated"`
    - `certificatePath`, `certificateThumbprint`: autentikasi federated + sertifikat (thumbprint opsional)
    - `useManagedIdentity`, `managedIdentityClientId`: autentikasi federated + managed identity
  </Accordion>

  <Accordion title="Kontrol akses">
    - `dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing)
    - `allowFrom`: allowlist DM, sebaiknya gunakan AAD object ID; wizard menyelesaikan nama saat akses Graph tersedia
    - `dangerouslyAllowNameMatching`: opsi darurat untuk UPN/display-name yang dapat berubah dan routing nama team/channel
    - `requireMention`: wajibkan @mention di channel/grup (default `true`)
  </Accordion>

  <Accordion title="Override tim dan channel">
    Semua ini menimpa default tingkat atas:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: default kebijakan tool per tim
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    Key `toolsBySender` menerima prefiks `id:`, `e164:`, `username:`, `name:` (key tanpa prefiks dipetakan ke `id:`). `"*"` adalah wildcard.

  </Accordion>

  <Accordion title="Pengiriman, media, dan aksi">
    - `textChunkLimit`: ukuran potongan teks keluar
    - `chunkMode`: `length` (default) atau `newline` (pisah pada batas paragraf sebelum berdasarkan panjang)
    - `mediaAllowHosts`: allowlist host lampiran masuk (default ke domain Microsoft/Teams)
    - `mediaAuthAllowHosts`: host yang dapat menerima header Authorization saat retry (default ke Graph + Bot Framework)
    - `replyStyle`: `thread | top-level` (lihat [Gaya balasan](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: aktif/nonaktifkan aksi info anggota yang didukung Graph (default aktif saat Graph tersedia)
    - `sharePointSiteId`: diperlukan untuk unggah file di chat grup/channel (lihat [Mengirim file di chat grup](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## Routing dan sesi

- Session key mengikuti format agen standar (lihat [/concepts/session](/id/concepts/session)):
  - Pesan langsung berbagi sesi utama (`agent:<agentId>:<mainKey>`).
  - Pesan channel/grup menggunakan conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Gaya balasan: thread vs postingan

Teams baru-baru ini memperkenalkan dua gaya UI channel di atas model data dasar yang sama:

| Style                    | Description                                               | `replyStyle` yang direkomendasikan |
| ------------------------ | --------------------------------------------------------- | ---------------------------------- |
| **Posts** (klasik)       | Pesan tampil sebagai kartu dengan balasan ber-thread di bawahnya | `thread` (default)           |
| **Threads** (mirip Slack) | Pesan mengalir secara linear, lebih mirip Slack          | `top-level`                        |

**Masalahnya:** API Teams tidak mengekspos gaya UI channel yang digunakan. Jika Anda menggunakan `replyStyle` yang salah:

- `thread` di channel bergaya Threads → balasan muncul bertingkat dengan canggung
- `top-level` di channel bergaya Posts → balalan muncul sebagai postingan tingkat atas terpisah, bukan di dalam thread

**Solusi:** Konfigurasikan `replyStyle` per channel berdasarkan cara channel tersebut disetel:

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

## Lampiran dan gambar

**Batasan saat ini:**

- **DM:** Gambar dan lampiran file berfungsi melalui API file bot Teams.
- **Channels/grup:** Lampiran berada di penyimpanan M365 (SharePoint/OneDrive). Payload Webhook hanya menyertakan stub HTML, bukan byte file sebenarnya. **Izin Graph API diperlukan** untuk mengunduh lampiran channel.
- Untuk pengiriman eksplisit yang mengutamakan file, gunakan `action=upload-file` dengan `media` / `filePath` / `path`; `message` opsional menjadi teks/komentar pendamping, dan `filename` menimpa nama unggahan.

Tanpa izin Graph, pesan channel dengan gambar akan diterima sebagai teks saja (konten gambar tidak dapat diakses oleh bot).
Secara default, OpenClaw hanya mengunduh media dari hostname Microsoft/Teams. Timpa dengan `channels.msteams.mediaAllowHosts` (gunakan `["*"]` untuk mengizinkan host apa pun).
Header Authorization hanya dilampirkan untuk host di `channels.msteams.mediaAuthAllowHosts` (default ke host Graph + Bot Framework). Jaga daftar ini tetap ketat (hindari sufiks multi-tenant).

## Mengirim file di chat grup

Bot dapat mengirim file di DM menggunakan alur FileConsentCard (bawaan). Namun, **mengirim file di chat grup/channel** memerlukan penyiapan tambahan:

| Context                  | How files are sent                           | Setup needed                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → pengguna menyetujui → bot mengunggah | Berfungsi langsung                      |
| **Group chats/channels** | Unggah ke SharePoint → bagikan tautan        | Memerlukan `sharePointSiteId` + izin Graph      |
| **Images (any context)** | Inline berkode base64                        | Berfungsi langsung                              |

### Mengapa chat grup memerlukan SharePoint

Bot tidak memiliki drive OneDrive pribadi (endpoint Graph API `/me/drive` tidak berfungsi untuk identitas aplikasi). Untuk mengirim file di chat grup/channel, bot mengunggah ke **situs SharePoint** dan membuat tautan berbagi.

### Penyiapan

1. **Tambahkan izin Graph API** di Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - unggah file ke SharePoint
   - `Chat.Read.All` (Application) - opsional, mengaktifkan tautan berbagi per pengguna

2. **Berikan persetujuan admin** untuk tenant.

3. **Dapatkan SharePoint site ID Anda:**

   ```bash
   # Via Graph Explorer atau curl dengan token yang valid:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Contoh: untuk situs di "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Respons menyertakan: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Konfigurasikan OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... konfigurasi lain ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Perilaku berbagi

| Permission                              | Sharing behavior                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` saja              | Tautan berbagi tingkat organisasi (siapa pun di org dapat mengakses) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Tautan berbagi per pengguna (hanya anggota chat yang dapat mengakses) |

Berbagi per pengguna lebih aman karena hanya peserta chat yang dapat mengakses file. Jika izin `Chat.Read.All` tidak ada, bot akan fallback ke berbagi tingkat organisasi.

### Perilaku fallback

| Scenario                                          | Result                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat grup + file + `sharePointSiteId` dikonfigurasi | Unggah ke SharePoint, kirim tautan berbagi       |
| Chat grup + file + tanpa `sharePointSiteId`         | Coba unggah OneDrive (mungkin gagal), kirim teks saja |
| Chat personal + file                                | Alur FileConsentCard (berfungsi tanpa SharePoint) |
| Konteks apa pun + gambar                            | Inline berkode base64 (berfungsi tanpa SharePoint) |

### Lokasi penyimpanan file

File yang diunggah disimpan di folder `/OpenClawShared/` dalam pustaka dokumen default situs SharePoint yang dikonfigurasi.

## Poll (adaptive cards)

OpenClaw mengirim poll Teams sebagai Adaptive Cards (tidak ada API poll Teams bawaan).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Suara direkam oleh Gateway di `~/.openclaw/msteams-polls.json`.
- Gateway harus tetap online untuk merekam suara.
- Poll belum otomatis memposting ringkasan hasil (periksa file penyimpanan jika diperlukan).

## Kartu presentasi

Kirim payload presentasi semantik ke pengguna atau percakapan Teams menggunakan tool `message` atau CLI. OpenClaw merendernya sebagai Teams Adaptive Cards dari kontrak presentasi generik.

Parameter `presentation` menerima blok semantik. Saat `presentation` disediakan, teks pesan bersifat opsional.

**Tool agen:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Untuk detail format target, lihat [Format target](#target-formats) di bawah.

## Format target

Target MSTeams menggunakan prefiks untuk membedakan pengguna dan percakapan:

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Pengguna (berdasarkan ID) | `user:<aad-object-id>`     | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Pengguna (berdasarkan nama) | `user:<display-name>`   | `user:John Smith` (memerlukan Graph API)            |
| Grup/channel       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/channel (mentah) | `<conversation-id>`            | `19:abc123...@thread.tacv2` (jika berisi `@thread`) |

**Contoh CLI:**

```bash
# Kirim ke pengguna berdasarkan ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Kirim ke pengguna berdasarkan display name (memicu lookup Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Kirim ke chat grup atau channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Kirim kartu presentasi ke percakapan
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
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
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Catatan: Tanpa prefiks `user:`, nama secara default dianggap sebagai resolusi grup/tim. Selalu gunakan `user:` saat menargetkan orang berdasarkan display name.

## Pesan proaktif

- Pesan proaktif hanya dimungkinkan **setelah** pengguna berinteraksi, karena saat itu kami menyimpan referensi percakapan.
- Lihat `/gateway/configuration` untuk `dmPolicy` dan pembatasan allowlist.

## ID tim dan channel

Parameter query `groupId` di URL Teams **BUKAN** team ID yang digunakan untuk konfigurasi. Ekstrak ID dari path URL:

**URL tim:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (URL-decode ini)
```

**URL channel:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode ini)
```

**Untuk konfigurasi:**

- Team ID = segmen path setelah `/team/` (hasil URL-decoded, misalnya `19:Bk4j...@thread.tacv2`)
- Channel ID = segmen path setelah `/channel/` (hasil URL-decoded)
- **Abaikan** parameter query `groupId`

## Channel privat

Bot memiliki dukungan terbatas di channel privat:

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| Instalasi bot                | Ya                | Terbatas               |
| Pesan real-time (Webhook)    | Ya                | Mungkin tidak berfungsi |
| Izin RSC                     | Ya                | Mungkin berperilaku berbeda |
| @mentions                    | Ya                | Jika bot dapat diakses |
| Riwayat Graph API            | Ya                | Ya (dengan izin)       |

**Solusi sementara jika channel privat tidak berfungsi:**

1. Gunakan channel standar untuk interaksi bot
2. Gunakan DM - pengguna selalu dapat mengirim pesan langsung ke bot
3. Gunakan Graph API untuk akses historis (memerlukan `ChannelMessage.Read.All`)

## Pemecahan masalah

### Masalah umum

- **Gambar tidak muncul di channel:** izin Graph atau persetujuan admin tidak ada. Instal ulang aplikasi Teams dan tutup/buka kembali Teams sepenuhnya.
- **Tidak ada respons di channel:** mention diwajibkan secara default; setel `channels.msteams.requireMention=false` atau konfigurasikan per tim/channel.
- **Version mismatch (Teams masih menampilkan manifest lama):** hapus + tambahkan kembali aplikasi dan tutup Teams sepenuhnya untuk menyegarkan.
- **401 Unauthorized dari Webhook:** wajar saat menguji secara manual tanpa Azure JWT - berarti endpoint dapat dijangkau tetapi autentikasi gagal. Gunakan Azure Web Chat untuk pengujian yang benar.

### Error unggah manifest

- **"Icon file cannot be empty":** Manifest mereferensikan file ikon yang berukuran 0 byte. Buat ikon PNG yang valid (32x32 untuk `outline.png`, 192x192 untuk `color.png`).
- **"webApplicationInfo.Id already in use":** Aplikasi masih terinstal di tim/chat lain. Temukan dan hapus instalasinya terlebih dahulu, atau tunggu 5-10 menit untuk propagasi.
- **"Something went wrong" saat unggah:** Unggah melalui [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) sebagai gantinya, buka browser DevTools (F12) → tab Network, lalu periksa body respons untuk error sebenarnya.
- **Sideload gagal:** Coba "Upload an app to your org's app catalog" alih-alih "Upload a custom app" - ini sering melewati pembatasan sideload.

### Izin RSC tidak berfungsi

1. Verifikasi `webApplicationInfo.id` cocok persis dengan App ID bot Anda
2. Unggah ulang aplikasi dan instal ulang di tim/chat
3. Periksa apakah admin organisasi Anda memblokir izin RSC
4. Pastikan Anda menggunakan scope yang benar: `ChannelMessage.Read.Group` untuk tim, `ChatMessage.Read.Chat` untuk chat grup

## Referensi

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - panduan penyiapan Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - membuat/mengelola aplikasi Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (channel/grup memerlukan Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Terkait

<CardGroup cols={2}>
  <Card title="Ikhtisar Channels" icon="list" href="/id/channels">
    Semua channel yang didukung.
  </Card>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Autentikasi DM dan alur pairing.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku chat grup dan pembatasan mention.
  </Card>
  <Card title="Perutean Channel" icon="route" href="/id/channels/channel-routing">
    Perutean sesi untuk pesan.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model akses dan penguatan.
  </Card>
</CardGroup>
