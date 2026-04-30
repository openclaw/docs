---
read_when:
    - Mengerjakan fitur saluran Microsoft Teams
summary: Status dukungan, kapabilitas, dan konfigurasi bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-30T09:34:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2c8cd13a72941a18d609b1f7263d9b9ed3284873f9b1483975ca1356b543979
    source_path: channels/msteams.md
    workflow: 16
---

Status: teks + lampiran DM didukung; pengiriman file channel/grup memerlukan `sharePointSiteId` + izin Graph (lihat [Mengirim file dalam obrolan grup](#sending-files-in-group-chats)). Polling dikirim melalui Adaptive Cards. Tindakan pesan mengekspos `upload-file` eksplisit untuk pengiriman yang mengutamakan file.

## Plugin bawaan

Microsoft Teams dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, sehingga tidak ada
instalasi terpisah yang diperlukan dalam build paket normal.

Jika Anda memakai build lama atau instalasi khusus yang mengecualikan Teams bawaan,
instal paket npm saat ini ketika sudah dipublikasikan:

```bash
openclaw plugins install @openclaw/msteams
```

Jika npm melaporkan paket milik OpenClaw sebagai deprecated, gunakan build
OpenClaw paket saat ini atau jalur checkout lokal hingga paket npm yang lebih baru
dipublikasikan.

Checkout lokal (saat menjalankan dari repo git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) menangani pendaftaran bot, pembuatan manifest, dan pembuatan kredensial dalam satu perintah.

**1. Instal dan masuk**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI saat ini masih dalam preview. Perintah dan flag dapat berubah antar-rilis.
</Note>

**2. Mulai tunnel** (Teams tidak dapat menjangkau localhost)

Instal dan autentikasi devtunnel CLI jika belum ([panduan memulai](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` diperlukan karena Teams tidak dapat melakukan autentikasi dengan devtunnels. Setiap permintaan bot yang masuk tetap divalidasi secara otomatis oleh Teams SDK.
</Note>

Alternatif: `ngrok http 3978` atau `tailscale funnel 3978` (tetapi ini dapat mengubah URL pada setiap sesi).

**3. Buat aplikasi**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Perintah tunggal ini:

- Membuat aplikasi Entra ID (Azure AD)
- Menghasilkan client secret
- Membangun dan mengunggah manifest aplikasi Teams (dengan ikon)
- Mendaftarkan bot (dikelola Teams secara default — langganan Azure tidak diperlukan)

Output akan menampilkan `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, dan **Teams App ID** — catat ini untuk langkah berikutnya. Perintah ini juga menawarkan untuk menginstal aplikasi langsung di Teams.

**4. Konfigurasi OpenClaw** menggunakan kredensial dari output:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Atau gunakan variabel lingkungan secara langsung: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Instal aplikasi di Teams**

`teams app create` akan meminta Anda menginstal aplikasi — pilih "Instal di Teams". Jika Anda melewatinya, Anda dapat memperoleh tautannya nanti:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifikasi semuanya berfungsi**

```bash
teams app doctor <teamsAppId>
```

Ini menjalankan diagnostik untuk pendaftaran bot, konfigurasi aplikasi AAD, validitas manifest, dan penyiapan SSO.

Untuk deployment produksi, pertimbangkan menggunakan [autentikasi federasi](/id/channels/msteams#federated-authentication-certificate-plus-managed-identity) (sertifikat atau managed identity) alih-alih client secret.

<Note>
Obrolan grup diblokir secara default (`channels.msteams.groupPolicy: "allowlist"`). Untuk mengizinkan balasan grup, tetapkan `channels.msteams.groupAllowFrom`, atau gunakan `groupPolicy: "open"` untuk mengizinkan anggota mana pun (dibatasi mention).
</Note>

## Tujuan

- Berbicara dengan OpenClaw melalui DM Teams, obrolan grup, atau channel.
- Menjaga routing tetap deterministik: balasan selalu kembali ke channel tempat pesan masuk.
- Secara default menggunakan perilaku channel yang aman (mention diperlukan kecuali dikonfigurasi sebaliknya).

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

- Default: `channels.msteams.dmPolicy = "pairing"`. Pengirim yang tidak dikenal diabaikan hingga disetujui.
- `channels.msteams.allowFrom` sebaiknya menggunakan ID objek AAD yang stabil.
- Jangan mengandalkan pencocokan UPN/nama tampilan untuk allowlist — keduanya dapat berubah. OpenClaw menonaktifkan pencocokan nama langsung secara default; ikut serta secara eksplisit dengan `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard dapat menyelesaikan nama menjadi ID melalui Microsoft Graph ketika kredensial mengizinkan.

**Akses grup**

- Default: `channels.msteams.groupPolicy = "allowlist"` (diblokir kecuali Anda menambahkan `groupAllowFrom`). Gunakan `channels.defaults.groupPolicy` untuk mengganti default ketika belum ditetapkan.
- `channels.msteams.groupAllowFrom` mengontrol pengirim mana yang dapat memicu di obrolan grup/channel (fallback ke `channels.msteams.allowFrom`).
- Tetapkan `groupPolicy: "open"` untuk mengizinkan anggota mana pun (tetap dibatasi mention secara default).
- Untuk tidak mengizinkan **channel apa pun**, tetapkan `channels.msteams.groupPolicy: "disabled"`.

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

**Allowlist Teams + channel**

- Batasi cakupan balasan grup/channel dengan mencantumkan teams dan channel di bawah `channels.msteams.teams`.
- Key sebaiknya menggunakan ID percakapan Teams yang stabil dari tautan Teams, bukan nama tampilan yang dapat berubah.
- Ketika `groupPolicy="allowlist"` dan allowlist teams ada, hanya teams/channel yang tercantum yang diterima (dibatasi mention).
- Wizard konfigurasi menerima entri `Team/Channel` dan menyimpannya untuk Anda.
- Saat startup, OpenClaw menyelesaikan nama allowlist team/channel dan pengguna menjadi ID (ketika izin Graph mengizinkan)
  dan mencatat pemetaannya; nama team/channel yang tidak terselesaikan dipertahankan seperti yang diketik tetapi diabaikan untuk routing secara default kecuali `channels.msteams.dangerouslyAllowNameMatching: true` diaktifkan.

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

<details>
<summary><strong>Penyiapan manual (tanpa Teams CLI)</strong></summary>

Jika Anda tidak dapat menggunakan Teams CLI, Anda dapat menyiapkan bot secara manual melalui Azure Portal.

### Cara kerjanya

1. Pastikan plugin Microsoft Teams tersedia (dibundel dalam rilis saat ini).
2. Buat **Azure Bot** (App ID + secret + tenant ID).
3. Bangun **paket aplikasi Teams** yang mereferensikan bot dan menyertakan izin RSC di bawah.
4. Unggah/instal aplikasi Teams ke dalam team (atau cakupan personal untuk DM).
5. Konfigurasi `msteams` di `~/.openclaw/openclaw.json` (atau env vars) dan mulai Gateway.
6. Gateway mendengarkan traffic Webhook Bot Framework di `/api/messages` secara default.

### Langkah 1: Buat Azure Bot

1. Buka [Buat Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Isi tab **Dasar**:

   | Bidang             | Nilai                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nama bot Anda, misalnya, `openclaw-msteams` (harus unik) |
   | **Subscription**   | Pilih langganan Azure Anda                               |
   | **Resource group** | Buat baru atau gunakan yang sudah ada                    |
   | **Pricing tier**   | **Gratis** untuk dev/pengujian                           |
   | **Type of App**    | **Single Tenant** (direkomendasikan - lihat catatan di bawah) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Pembuatan bot multi-tenant baru dihentikan setelah 2025-07-31. Gunakan **Single Tenant** untuk bot baru.
</Warning>

3. Klik **Review + create** → **Create** (tunggu ~1-2 menit)

### Langkah 2: Dapatkan Kredensial

1. Buka resource Azure Bot Anda → **Configuration**
2. Salin **Microsoft App ID** → ini adalah `appId` Anda
3. Klik **Manage Password** → buka App Registration
4. Di bawah **Certificates & secrets** → **New client secret** → salin **Value** → ini adalah `appPassword` Anda
5. Buka **Overview** → salin **Directory (tenant) ID** → ini adalah `tenantId` Anda

### Langkah 3: Konfigurasi Endpoint Pesan

1. Di Azure Bot → **Configuration**
2. Tetapkan **Messaging endpoint** ke URL Webhook Anda:
   - Produksi: `https://your-domain.com/api/messages`
   - Dev lokal: Gunakan tunnel (lihat [Pengembangan Lokal](#local-development-tunneling) di bawah)

### Langkah 4: Aktifkan Channel Teams

1. Di Azure Bot → **Channels**
2. Klik **Microsoft Teams** → Konfigurasi → Simpan
3. Terima Ketentuan Layanan

### Langkah 5: Bangun Manifest Aplikasi Teams

- Sertakan entri `bot` dengan `botId = <App ID>`.
- Cakupan: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (diperlukan untuk penanganan file cakupan personal).
- Tambahkan izin RSC (lihat [Izin RSC](#current-teams-rsc-permissions-manifest)).
- Buat ikon: `outline.png` (32x32) dan `color.png` (192x192).
- Zip ketiga file bersama-sama: `manifest.json`, `outline.png`, `color.png`.

### Langkah 6: Konfigurasi OpenClaw

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

Variabel lingkungan: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Langkah 7: Jalankan Gateway

Channel Teams dimulai otomatis ketika plugin tersedia dan konfigurasi `msteams` ada dengan kredensial.

</details>

## Autentikasi federasi (sertifikat plus managed identity)

> Ditambahkan pada 2026.4.11

Untuk deployment produksi, OpenClaw mendukung **autentikasi federasi** sebagai alternatif yang lebih aman untuk client secret. Tersedia dua metode:

### Opsi A: Autentikasi berbasis sertifikat

Gunakan sertifikat PEM yang terdaftar dengan pendaftaran aplikasi Entra ID Anda.

**Penyiapan:**

1. Buat atau dapatkan sertifikat (format PEM dengan private key).
2. Di Entra ID → App Registration → **Certificates & secrets** → **Certificates** → Unggah sertifikat publik.

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

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opsi B: Azure Managed Identity

Gunakan Azure Managed Identity untuk autentikasi tanpa kata sandi. Ini ideal untuk deployment pada infrastruktur Azure (AKS, App Service, Azure VMs) tempat managed identity tersedia.

**Cara kerjanya:**

1. Pod/VM bot memiliki managed identity (system-assigned atau user-assigned).
2. **Kredensial identitas federasi** menautkan managed identity ke pendaftaran aplikasi Entra ID.
3. Saat runtime, OpenClaw menggunakan `@azure/identity` untuk memperoleh token dari endpoint Azure IMDS (`169.254.169.254`).
4. Token diteruskan ke Teams SDK untuk autentikasi bot.

**Prasyarat:**

- Infrastruktur Azure dengan managed identity diaktifkan (identitas workload AKS, App Service, VM)
- Kredensial identitas federasi dibuat pada pendaftaran aplikasi Entra ID
- Akses jaringan ke IMDS (`169.254.169.254:80`) dari pod/VM

**Konfigurasi (system-assigned managed identity):**

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

**Konfigurasi (identitas terkelola yang ditetapkan pengguna):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (hanya untuk yang ditetapkan pengguna)

### Penyiapan Identitas Beban Kerja AKS

Untuk deployment AKS yang menggunakan identitas beban kerja:

1. **Aktifkan identitas beban kerja** pada klaster AKS Anda.
2. **Buat kredensial identitas federasi** pada pendaftaran aplikasi Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Anotasikan akun layanan Kubernetes** dengan ID klien aplikasi:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Beri label pada pod** untuk injeksi identitas beban kerja:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Pastikan akses jaringan** ke IMDS (`169.254.169.254`) — jika menggunakan NetworkPolicy, tambahkan aturan egress yang mengizinkan lalu lintas ke `169.254.169.254/32` pada port 80.

### Perbandingan jenis autentikasi

| Metode                   | Konfigurasi                                    | Kelebihan                                | Kekurangan                                      |
| ------------------------ | ---------------------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| **Rahasia klien**        | `appPassword`                                  | Penyiapan sederhana                      | Rotasi rahasia diperlukan, kurang aman          |
| **Sertifikat**           | `authType: "federated"` + `certificatePath`    | Tidak ada rahasia bersama melalui jaringan | Overhead pengelolaan sertifikat               |
| **Identitas Terkelola**  | `authType: "federated"` + `useManagedIdentity` | Tanpa kata sandi, tidak ada rahasia untuk dikelola | Infrastruktur Azure diperlukan        |

**Perilaku default:** Ketika `authType` tidak diatur, OpenClaw secara default menggunakan autentikasi rahasia klien. Konfigurasi yang ada tetap berfungsi tanpa perubahan.

## Pengembangan lokal (tunneling)

Teams tidak dapat menjangkau `localhost`. Gunakan tunnel dev persisten agar URL Anda tetap sama di seluruh sesi:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternatif: `ngrok http 3978` atau `tailscale funnel 3978` (URL dapat berubah setiap sesi).

Jika URL tunnel Anda berubah, perbarui endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Menguji Bot

**Jalankan diagnostik:**

```bash
teams app doctor <teamsAppId>
```

Memeriksa pendaftaran bot, aplikasi AAD, manifes, dan konfigurasi SSO dalam satu proses.

**Kirim pesan uji:**

1. Instal aplikasi Teams (gunakan tautan instal dari `teams app get <id> --install-link`)
2. Temukan bot di Teams dan kirim DM
3. Periksa log Gateway untuk aktivitas masuk

## Variabel lingkungan

Semua kunci konfigurasi juga dapat diatur melalui variabel lingkungan:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (opsional: `"secret"` atau `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federasi + sertifikat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opsional, tidak diperlukan untuk autentikasi)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federasi + identitas terkelola)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (hanya MI yang ditetapkan pengguna)

## Aksi info anggota

OpenClaw mengekspos aksi `member-info` yang didukung Graph untuk Microsoft Teams agar agen dan otomasi dapat me-resolve detail anggota saluran (nama tampilan, email, peran) langsung dari Microsoft Graph.

Persyaratan:

- Izin RSC `Member.Read.Group` (sudah ada dalam manifes yang direkomendasikan)
- Untuk pencarian lintas tim: izin Aplikasi Graph `User.Read.All` dengan persetujuan admin

Aksi ini dikendalikan oleh `channels.msteams.actions.memberInfo` (default: aktif ketika kredensial Graph tersedia).

## Konteks riwayat

- `channels.msteams.historyLimit` mengontrol berapa banyak pesan saluran/grup terbaru yang dibungkus ke dalam prompt.
- Fallback ke `messages.groupChat.historyLimit`. Atur `0` untuk menonaktifkan (default 50).
- Riwayat thread yang diambil difilter berdasarkan allowlist pengirim (`allowFrom` / `groupAllowFrom`), sehingga pengisian konteks thread hanya menyertakan pesan dari pengirim yang diizinkan.
- Konteks lampiran yang dikutip (`ReplyTo*` yang diturunkan dari HTML balasan Teams) saat ini diteruskan sebagaimana diterima.
- Dengan kata lain, allowlist mengatur siapa yang dapat memicu agen; hanya jalur konteks tambahan tertentu yang difilter saat ini.
- Riwayat DM dapat dibatasi dengan `channels.msteams.dmHistoryLimit` (giliran pengguna). Override per pengguna: `channels.msteams.dms["<user_id>"].historyLimit`.

## Izin RSC Teams saat ini (manifes)

Ini adalah **izin resourceSpecific yang ada** dalam manifes aplikasi Teams kami. Izin ini hanya berlaku di dalam tim/chat tempat aplikasi diinstal.

**Untuk saluran (cakupan tim):**

- `ChannelMessage.Read.Group` (Application) - menerima semua pesan saluran tanpa @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Untuk chat grup:**

- `ChatMessage.Read.Chat` (Application) - menerima semua pesan chat grup tanpa @mention

Untuk menambahkan izin RSC melalui Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Contoh manifes Teams (disunting)

Contoh minimal yang valid dengan bidang yang diperlukan. Ganti ID dan URL.

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

### Catatan manifes (bidang wajib)

- `bots[].botId` **harus** cocok dengan ID Aplikasi Azure Bot.
- `webApplicationInfo.id` **harus** cocok dengan ID Aplikasi Azure Bot.
- `bots[].scopes` harus menyertakan permukaan yang ingin Anda gunakan (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` diperlukan untuk penanganan file dalam cakupan personal.
- `authorization.permissions.resourceSpecific` harus menyertakan baca/kirim saluran jika Anda menginginkan lalu lintas saluran.

### Memperbarui aplikasi yang ada

Untuk memperbarui aplikasi Teams yang sudah diinstal (misalnya, untuk menambahkan izin RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Setelah memperbarui, instal ulang aplikasi di setiap tim agar izin baru berlaku, dan **keluar sepenuhnya lalu jalankan ulang Teams** (bukan hanya menutup jendela) untuk menghapus metadata aplikasi yang di-cache.

<details>
<summary>Pembaruan manifes manual (tanpa CLI)</summary>

1. Perbarui `manifest.json` Anda dengan pengaturan baru
2. **Naikkan bidang `version`** (misalnya, `1.0.0` → `1.1.0`)
3. **Zip ulang** manifes bersama ikon (`manifest.json`, `outline.png`, `color.png`)
4. Unggah zip baru:
   - **Teams Admin Center:** Aplikasi Teams → Kelola aplikasi → temukan aplikasi Anda → Unggah versi baru
   - **Sideload:** Di Teams → Aplikasi → Kelola aplikasi Anda → Unggah aplikasi kustom

</details>

## Kapabilitas: hanya RSC vs Graph

### Dengan **hanya Teams RSC** (aplikasi terinstal, tanpa izin Graph API)

Berfungsi:

- Membaca konten **teks** pesan saluran.
- Mengirim konten **teks** pesan saluran.
- Menerima lampiran file **personal (DM)**.

Tidak berfungsi:

- **Konten gambar atau file** saluran/grup (payload hanya menyertakan stub HTML).
- Mengunduh lampiran yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan (di luar event Webhook langsung).

### Dengan **Teams RSC + izin Aplikasi Microsoft Graph**

Menambahkan:

- Mengunduh konten yang di-host (gambar yang ditempel ke pesan).
- Mengunduh lampiran file yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan saluran/chat melalui Graph.

### RSC vs Graph API

| Kapabilitas            | Izin RSC             | Graph API                              |
| ---------------------- | -------------------- | -------------------------------------- |
| **Pesan real-time**    | Ya (melalui Webhook) | Tidak (hanya polling)                  |
| **Pesan historis**     | Tidak                | Ya (dapat mengueri riwayat)            |
| **Kompleksitas setup** | Hanya manifes aplikasi | Memerlukan persetujuan admin + alur token |
| **Berfungsi offline**  | Tidak (harus berjalan) | Ya (kueri kapan saja)                |

**Intinya:** RSC digunakan untuk mendengarkan real-time; Graph API digunakan untuk akses historis. Untuk mengejar pesan yang terlewat saat offline, Anda memerlukan Graph API dengan `ChannelMessage.Read.All` (memerlukan persetujuan admin).

## Media + riwayat yang didukung Graph (diperlukan untuk saluran)

Jika Anda memerlukan gambar/file di **saluran** atau ingin mengambil **riwayat pesan**, Anda harus mengaktifkan izin Microsoft Graph dan memberikan persetujuan admin.

1. Di **Pendaftaran Aplikasi** Entra ID (Azure AD), tambahkan **izin Aplikasi** Microsoft Graph:
   - `ChannelMessage.Read.All` (lampiran saluran + riwayat)
   - `Chat.Read.All` atau `ChatMessage.Read.All` (chat grup)
2. **Berikan persetujuan admin** untuk tenant.
3. Naikkan **versi manifes** aplikasi Teams, unggah ulang, dan **instal ulang aplikasi di Teams**.
4. **Keluar sepenuhnya lalu jalankan ulang Teams** untuk menghapus metadata aplikasi yang di-cache.

**Izin tambahan untuk mention pengguna:** @mention pengguna langsung berfungsi untuk pengguna dalam percakapan. Namun, jika Anda ingin mencari dan menyebut pengguna secara dinamis yang **tidak berada dalam percakapan saat ini**, tambahkan izin `User.Read.All` (Application) dan berikan persetujuan admin.

## Batasan yang diketahui

### Timeout Webhook

Teams mengirim pesan melalui Webhook HTTP. Jika pemrosesan memakan waktu terlalu lama (misalnya, respons LLM yang lambat), Anda mungkin melihat:

- Timeout Gateway
- Teams mencoba ulang pesan (menyebabkan duplikat)
- Balasan yang terbuang

OpenClaw menangani ini dengan kembali dengan cepat dan mengirim balasan secara proaktif, tetapi respons yang sangat lambat masih dapat menyebabkan masalah.

### Pemformatan

Markdown Teams lebih terbatas daripada Slack atau Discord:

- Pemformatan dasar berfungsi: **tebal**, _miring_, `code`, tautan
- Markdown kompleks (tabel, daftar bersarang) mungkin tidak dirender dengan benar
- Adaptive Cards didukung untuk polling dan pengiriman presentasi semantik (lihat di bawah)

## Konfigurasi

Pengaturan utama (lihat `/gateway/configuration` untuk pola channel bersama):

- `channels.msteams.enabled`: aktifkan/nonaktifkan channel.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: kredensial bot.
- `channels.msteams.webhook.port` (default `3978`)
- `channels.msteams.webhook.path` (default `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing)
- `channels.msteams.allowFrom`: allowlist DM (ID objek AAD direkomendasikan). Wizard menyelesaikan nama menjadi ID selama penyiapan saat akses Graph tersedia.
- `channels.msteams.dangerouslyAllowNameMatching`: toggle darurat untuk mengaktifkan kembali pencocokan UPN/nama tampilan yang dapat berubah dan perutean langsung nama tim/channel.
- `channels.msteams.textChunkLimit`: ukuran potongan teks keluar.
- `channels.msteams.chunkMode`: `length` (default) atau `newline` untuk membagi pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.msteams.mediaAllowHosts`: allowlist untuk host lampiran masuk (default ke domain Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist untuk melampirkan header Authorization pada percobaan ulang media (default ke host Graph + Bot Framework).
- `channels.msteams.requireMention`: wajibkan @mention di channel/grup (default true).
- `channels.msteams.replyStyle`: `thread | top-level` (lihat [Gaya Balasan](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per tim.
- `channels.msteams.teams.<teamId>.requireMention`: override per tim.
- `channels.msteams.teams.<teamId>.tools`: override kebijakan alat default per tim (`allow`/`deny`/`alsoAllow`) yang digunakan saat override channel tidak ada.
- `channels.msteams.teams.<teamId>.toolsBySender`: override kebijakan alat default per pengirim per tim (wildcard `"*"` didukung).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per channel.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: override kebijakan alat per channel (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: override kebijakan alat per pengirim per channel (wildcard `"*"` didukung).
- Kunci `toolsBySender` harus menggunakan prefiks eksplisit:
  `id:`, `e164:`, `username:`, `name:` (kunci lama tanpa prefiks tetap dipetakan hanya ke `id:`).
- `channels.msteams.actions.memberInfo`: aktifkan atau nonaktifkan aksi info anggota yang didukung Graph (default: aktif saat kredensial Graph tersedia).
- `channels.msteams.authType`: jenis autentikasi — `"secret"` (default) atau `"federated"`.
- `channels.msteams.certificatePath`: jalur ke file sertifikat PEM (federated + autentikasi sertifikat).
- `channels.msteams.certificateThumbprint`: thumbprint sertifikat (opsional, tidak diperlukan untuk autentikasi).
- `channels.msteams.useManagedIdentity`: aktifkan autentikasi identitas terkelola (mode federated).
- `channels.msteams.managedIdentityClientId`: ID klien untuk identitas terkelola yang ditetapkan pengguna.
- `channels.msteams.sharePointSiteId`: ID situs SharePoint untuk unggahan file di obrolan grup/channel (lihat [Mengirim file di obrolan grup](#sending-files-in-group-chats)).

## Perutean & Sesi

- Kunci sesi mengikuti format agent standar (lihat [/concepts/session](/id/concepts/session)):
  - Pesan langsung berbagi sesi utama (`agent:<agentId>:<mainKey>`).
  - Pesan channel/grup menggunakan ID percakapan:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Gaya balasan: utas vs postingan

Teams baru-baru ini memperkenalkan dua gaya UI channel di atas model data dasar yang sama:

| Gaya                     | Deskripsi                                                 | `replyStyle` yang direkomendasikan |
| ------------------------ | --------------------------------------------------------- | ---------------------------------- |
| **Postingan** (klasik)   | Pesan muncul sebagai kartu dengan balasan berutas di bawahnya | `thread` (default)                 |
| **Utas** (mirip Slack)   | Pesan mengalir secara linear, lebih mirip Slack           | `top-level`                        |

**Masalahnya:** API Teams tidak mengekspos gaya UI mana yang digunakan suatu channel. Jika Anda menggunakan `replyStyle` yang salah:

- `thread` di channel bergaya Utas → balasan tampak bersarang dengan janggal
- `top-level` di channel bergaya Postingan → balasan muncul sebagai postingan tingkat atas terpisah, bukan di dalam utas

**Solusi:** Konfigurasikan `replyStyle` per channel berdasarkan cara channel disiapkan:

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

**Batasan saat ini:**

- **DM:** Gambar dan lampiran file berfungsi melalui API file bot Teams.
- **Channel/grup:** Lampiran berada di penyimpanan M365 (SharePoint/OneDrive). Payload Webhook hanya menyertakan stub HTML, bukan byte file yang sebenarnya. **Izin Graph API diperlukan** untuk mengunduh lampiran channel.
- Untuk pengiriman eksplisit yang mengutamakan file, gunakan `action=upload-file` dengan `media` / `filePath` / `path`; `message` opsional menjadi teks/komentar pendamping, dan `filename` mengganti nama yang diunggah.

Tanpa izin Graph, pesan channel dengan gambar akan diterima sebagai teks saja (konten gambar tidak dapat diakses oleh bot).
Secara default, OpenClaw hanya mengunduh media dari hostname Microsoft/Teams. Override dengan `channels.msteams.mediaAllowHosts` (gunakan `["*"]` untuk mengizinkan host apa pun).
Header Authorization hanya dilampirkan untuk host di `channels.msteams.mediaAuthAllowHosts` (default ke host Graph + Bot Framework). Jaga daftar ini tetap ketat (hindari sufiks multi-tenant).

## Mengirim file di obrolan grup

Bot dapat mengirim file di DM menggunakan alur FileConsentCard (bawaan). Namun, **mengirim file di obrolan grup/channel** memerlukan penyiapan tambahan:

| Konteks                  | Cara file dikirim                            | Penyiapan yang diperlukan                         |
| ------------------------ | -------------------------------------------- | ------------------------------------------------- |
| **DM**                   | FileConsentCard → pengguna menerima → bot mengunggah | Langsung berfungsi                         |
| **Obrolan grup/channel** | Unggah ke SharePoint → bagikan tautan        | Memerlukan `sharePointSiteId` + izin Graph        |
| **Gambar (konteks apa pun)** | Inline berenkode Base64                  | Langsung berfungsi                                |

### Mengapa obrolan grup memerlukan SharePoint

Bot tidak memiliki drive OneDrive pribadi (endpoint Graph API `/me/drive` tidak berfungsi untuk identitas aplikasi). Untuk mengirim file di obrolan grup/channel, bot mengunggah ke **situs SharePoint** dan membuat tautan berbagi.

### Penyiapan

1. **Tambahkan izin Graph API** di Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - unggah file ke SharePoint
   - `Chat.Read.All` (Application) - opsional, mengaktifkan tautan berbagi per pengguna

2. **Berikan persetujuan admin** untuk tenant.

3. **Dapatkan ID situs SharePoint Anda:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Konfigurasikan OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Perilaku berbagi

| Izin                                    | Perilaku berbagi                                         |
| --------------------------------------- | -------------------------------------------------------- |
| Hanya `Sites.ReadWrite.All`             | Tautan berbagi seluruh organisasi (siapa pun di org dapat mengakses) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Tautan berbagi per pengguna (hanya anggota obrolan yang dapat mengakses) |

Berbagi per pengguna lebih aman karena hanya peserta obrolan yang dapat mengakses file. Jika izin `Chat.Read.All` tidak ada, bot beralih ke berbagi seluruh organisasi.

### Perilaku fallback

| Skenario                                         | Hasil                                              |
| ------------------------------------------------ | -------------------------------------------------- |
| Obrolan grup + file + `sharePointSiteId` dikonfigurasi | Unggah ke SharePoint, kirim tautan berbagi   |
| Obrolan grup + file + tanpa `sharePointSiteId`   | Coba unggah OneDrive (mungkin gagal), kirim teks saja |
| Obrolan personal + file                          | Alur FileConsentCard (berfungsi tanpa SharePoint) |
| Konteks apa pun + gambar                         | Inline berenkode Base64 (berfungsi tanpa SharePoint) |

### Lokasi penyimpanan file

File yang diunggah disimpan dalam folder `/OpenClawShared/` di pustaka dokumen default situs SharePoint yang dikonfigurasi.

## Polling (Adaptive Cards)

OpenClaw mengirim polling Teams sebagai Adaptive Cards (tidak ada API polling Teams native).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Suara dicatat oleh Gateway di `~/.openclaw/msteams-polls.json`.
- Gateway harus tetap online untuk mencatat suara.
- Polling belum memposting ringkasan hasil secara otomatis (periksa file penyimpanan jika diperlukan).

## Kartu presentasi

Kirim payload presentasi semantik ke pengguna atau percakapan Teams menggunakan alat `message` atau CLI. OpenClaw merendernya sebagai Teams Adaptive Cards dari kontrak presentasi generik.

Parameter `presentation` menerima blok semantik. Saat `presentation` disediakan, teks pesan bersifat opsional.

**Alat agent:**

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

Target MSTeams menggunakan prefiks untuk membedakan antara pengguna dan percakapan:

| Jenis target        | Format                           | Contoh                                              |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Pengguna (berdasarkan ID) | `user:<aad-object-id>`      | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Pengguna (berdasarkan nama) | `user:<display-name>`    | `user:John Smith` (memerlukan Graph API)            |
| Grup/channel        | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/channel (mentah) | `<conversation-id>`            | `19:abc123...@thread.tacv2` (jika berisi `@thread`) |

**Contoh CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Contoh alat agen:**

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

<Note>
Tanpa prefiks `user:`, nama secara default diresolusikan sebagai grup atau tim. Selalu gunakan `user:` saat menargetkan orang berdasarkan nama tampilan.
</Note>

## Pengiriman pesan proaktif

- Pesan proaktif hanya dimungkinkan **setelah** pengguna berinteraksi, karena kami menyimpan referensi percakapan pada saat itu.
- Lihat `/gateway/configuration` untuk `dmPolicy` dan pembatasan allowlist.

## ID Tim dan Channel (Kesalahan Umum)

Parameter kueri `groupId` dalam URL Teams **BUKAN** ID tim yang digunakan untuk konfigurasi. Ambil ID dari path URL sebagai gantinya:

**URL Tim:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID percakapan tim (URL-decode ini)
```

**URL Channel:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID channel (URL-decode ini)
```

**Untuk konfigurasi:**

- Kunci tim = segmen path setelah `/team/` (di-URL-decode, mis., `19:Bk4j...@thread.tacv2`; tenant lama mungkin menampilkan `@thread.skype`, yang juga valid)
- Kunci channel = segmen path setelah `/channel/` (di-URL-decode)
- **Abaikan** parameter kueri `groupId` untuk perutean OpenClaw. Itu adalah ID grup Microsoft Entra, bukan ID percakapan Bot Framework yang digunakan dalam aktivitas Teams yang masuk.

## Channel privat

Bot memiliki dukungan terbatas di channel privat:

| Fitur                        | Channel Standar  | Channel Privat             |
| ---------------------------- | ---------------- | -------------------------- |
| Instalasi bot                | Ya               | Terbatas                   |
| Pesan real-time (Webhook)    | Ya               | Mungkin tidak berfungsi    |
| Izin RSC                     | Ya               | Mungkin berperilaku berbeda |
| @mention                     | Ya               | Jika bot dapat diakses     |
| Riwayat Graph API            | Ya               | Ya (dengan izin)           |

**Solusi sementara jika channel privat tidak berfungsi:**

1. Gunakan channel standar untuk interaksi bot
2. Gunakan DM - pengguna selalu dapat mengirim pesan langsung ke bot
3. Gunakan Graph API untuk akses historis (memerlukan `ChannelMessage.Read.All`)

## Pemecahan masalah

### Masalah umum

- **Gambar tidak muncul di channel:** Izin Graph atau persetujuan admin tidak ada. Instal ulang aplikasi Teams dan tutup sepenuhnya/buka kembali Teams.
- **Tidak ada respons di channel:** mention diwajibkan secara default; atur `channels.msteams.requireMention=false` atau konfigurasikan per tim/channel.
- **Ketidakcocokan versi (Teams masih menampilkan manifest lama):** hapus + tambahkan ulang aplikasi dan tutup Teams sepenuhnya untuk menyegarkan.
- **401 Unauthorized dari Webhook:** Sesuai perkiraan saat menguji secara manual tanpa Azure JWT - berarti endpoint dapat dijangkau tetapi autentikasi gagal. Gunakan Azure Web Chat untuk menguji dengan benar.

### Kesalahan unggahan manifest

- **"Icon file cannot be empty":** Manifest merujuk file ikon yang berukuran 0 byte. Buat ikon PNG yang valid (32x32 untuk `outline.png`, 192x192 untuk `color.png`).
- **"webApplicationInfo.Id already in use":** Aplikasi masih terinstal di tim/chat lain. Temukan dan hapus instalasinya terlebih dahulu, atau tunggu 5-10 menit untuk propagasi.
- **"Something went wrong" saat mengunggah:** Unggah melalui [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) sebagai gantinya, buka DevTools browser (F12) → tab Network, dan periksa isi respons untuk kesalahan sebenarnya.
- **Sideload gagal:** Coba "Upload an app to your org's app catalog" alih-alih "Upload a custom app" - ini sering melewati pembatasan sideload.

### Izin RSC tidak berfungsi

1. Verifikasi `webApplicationInfo.id` sama persis dengan App ID bot Anda
2. Unggah ulang aplikasi dan instal ulang di tim/chat
3. Periksa apakah admin organisasi Anda telah memblokir izin RSC
4. Konfirmasi bahwa Anda menggunakan scope yang benar: `ChannelMessage.Read.Group` untuk tim, `ChatMessage.Read.Chat` untuk chat grup

## Referensi

- [Buat Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - panduan penyiapan Azure Bot
- [Portal Pengembang Teams](https://dev.teams.microsoft.com/apps) - buat/kelola aplikasi Teams
- [Skema manifest aplikasi Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Terima pesan channel dengan RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referensi izin RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Penanganan file bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (channel/grup memerlukan Graph)
- [Pengiriman pesan proaktif](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI untuk manajemen bot

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
