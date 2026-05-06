---
read_when:
    - Mengerjakan fitur saluran Microsoft Teams
summary: Status dukungan bot Microsoft Teams, kemampuan, dan konfigurasi
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-06T17:52:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: be669545bd692754fbee8b670b1b482c39399a3d26e06a7ae01230fdaee645fe
    source_path: channels/msteams.md
    workflow: 16
---

Status: lampiran teks + DM didukung; pengiriman file channel/grup memerlukan `sharePointSiteId` + izin Graph (lihat [Mengirim file dalam obrolan grup](#sending-files-in-group-chats)). Poll dikirim melalui Adaptive Cards. Tindakan pesan mengekspos `upload-file` eksplisit untuk pengiriman yang mengutamakan file.

## Plugin bawaan

Microsoft Teams dikirimkan sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi tidak diperlukan instalasi terpisah dalam build paket normal.

Jika Anda menggunakan build lama atau instalasi khusus yang mengecualikan Teams bawaan, instal paket npm secara langsung:

```bash
openclaw plugins install @openclaw/msteams
```

Gunakan paket polos untuk mengikuti tag rilis resmi saat ini. Sematkan versi persis hanya saat Anda memerlukan instalasi yang dapat direproduksi.

Checkout lokal (saat menjalankan dari repo git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) menangani pendaftaran bot, pembuatan manifes, dan pembuatan kredensial dalam satu perintah.

**1. Instal dan masuk**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI saat ini dalam pratinjau. Perintah dan flag dapat berubah antar-rilis.
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
`--allow-anonymous` diperlukan karena Teams tidak dapat mengautentikasi dengan devtunnels. Setiap permintaan bot yang masuk tetap divalidasi secara otomatis oleh Teams SDK.
</Note>

Alternatif: `ngrok http 3978` atau `tailscale funnel 3978` (tetapi URL ini dapat berubah di setiap sesi).

**3. Buat aplikasi**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Perintah tunggal ini:

- Membuat aplikasi Entra ID (Azure AD)
- Menghasilkan client secret
- Membangun dan mengunggah manifes aplikasi Teams (dengan ikon)
- Mendaftarkan bot (dikelola Teams secara default - tidak perlu langganan Azure)

Output akan menampilkan `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, dan **Teams App ID** - catat ini untuk langkah berikutnya. Ini juga menawarkan untuk menginstal aplikasi langsung di Teams.

**4. Konfigurasikan OpenClaw** menggunakan kredensial dari output:

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

`teams app create` akan meminta Anda menginstal aplikasi - pilih "Install in Teams". Jika Anda melewatkannya, Anda bisa mendapatkan tautannya nanti:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifikasi semuanya berfungsi**

```bash
teams app doctor <teamsAppId>
```

Ini menjalankan diagnostik di seluruh pendaftaran bot, konfigurasi aplikasi AAD, validitas manifes, dan penyiapan SSO.

Untuk deployment produksi, pertimbangkan menggunakan [autentikasi federasi](/id/channels/msteams#federated-authentication-certificate-plus-managed-identity) (sertifikat atau managed identity) alih-alih client secret.

<Note>
Obrolan grup diblokir secara default (`channels.msteams.groupPolicy: "allowlist"`). Untuk mengizinkan balasan grup, atur `channels.msteams.groupAllowFrom`, atau gunakan `groupPolicy: "open"` untuk mengizinkan anggota mana pun (dibatasi oleh mention).
</Note>

## Tujuan

- Berbicara dengan OpenClaw melalui DM Teams, obrolan grup, atau channel.
- Menjaga routing tetap deterministik: balasan selalu kembali ke channel tempat asalnya.
- Secara default menggunakan perilaku channel yang aman (mention diperlukan kecuali dikonfigurasi lain).

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
- Jangan mengandalkan pencocokan UPN/nama-tampilan untuk allowlist - keduanya dapat berubah. OpenClaw menonaktifkan pencocokan nama langsung secara default; aktifkan secara eksplisit dengan `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard dapat menyelesaikan nama menjadi ID melalui Microsoft Graph jika kredensial mengizinkan.

**Akses grup**

- Default: `channels.msteams.groupPolicy = "allowlist"` (diblokir kecuali Anda menambahkan `groupAllowFrom`). Gunakan `channels.defaults.groupPolicy` untuk menimpa default saat belum diatur.
- `channels.msteams.groupAllowFrom` mengontrol pengirim mana yang dapat memicu di obrolan grup/channel (fallback ke `channels.msteams.allowFrom`).
- Atur `groupPolicy: "open"` untuk mengizinkan anggota mana pun (tetap dibatasi oleh mention secara default).
- Untuk tidak mengizinkan **channel apa pun**, atur `channels.msteams.groupPolicy: "disabled"`.

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

- Batasi cakupan balasan grup/channel dengan mencantumkan tim dan channel di bawah `channels.msteams.teams`.
- Kunci sebaiknya menggunakan ID percakapan Teams yang stabil dari tautan Teams, bukan nama tampilan yang dapat berubah.
- Saat `groupPolicy="allowlist"` dan allowlist tim ada, hanya tim/channel yang tercantum yang diterima (dibatasi oleh mention).
- Wizard konfigurasi menerima entri `Team/Channel` dan menyimpannya untuk Anda.
- Saat startup, OpenClaw menyelesaikan nama allowlist tim/channel dan pengguna menjadi ID (jika izin Graph mengizinkan) dan mencatat pemetaannya; nama tim/channel yang belum terselesaikan dipertahankan sebagaimana diketik tetapi diabaikan untuk routing secara default kecuali `channels.msteams.dangerouslyAllowNameMatching: true` diaktifkan.

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

Jika tidak dapat menggunakan Teams CLI, Anda dapat menyiapkan bot secara manual melalui Azure Portal.

### Cara kerjanya

1. Pastikan Plugin Microsoft Teams tersedia (dibundel dalam rilis saat ini).
2. Buat **Azure Bot** (App ID + secret + tenant ID).
3. Bangun **paket aplikasi Teams** yang mereferensikan bot dan menyertakan izin RSC di bawah.
4. Unggah/instal aplikasi Teams ke tim (atau cakupan personal untuk DM).
5. Konfigurasikan `msteams` di `~/.openclaw/openclaw.json` (atau env vars) dan mulai Gateway.
6. Gateway mendengarkan traffic Webhook Bot Framework di `/api/messages` secara default.

### Langkah 1: Buat Azure Bot

1. Buka [Buat Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Isi tab **Basics**:

   | Kolom              | Nilai                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nama bot Anda, misalnya, `openclaw-msteams` (harus unik) |
   | **Subscription**   | Pilih langganan Azure Anda                               |
   | **Resource group** | Buat baru atau gunakan yang sudah ada                    |
   | **Pricing tier**   | **Free** untuk dev/pengujian                             |
   | **Type of App**    | **Single Tenant** (direkomendasikan - lihat catatan di bawah) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Pembuatan bot multi-tenant baru tidak digunakan lagi setelah 2025-07-31. Gunakan **Single Tenant** untuk bot baru.
</Warning>

3. Klik **Review + create** → **Create** (tunggu ~1-2 menit)

### Langkah 2: Dapatkan Kredensial

1. Buka resource Azure Bot Anda → **Configuration**
2. Salin **Microsoft App ID** → ini adalah `appId` Anda
3. Klik **Manage Password** → buka App Registration
4. Di bawah **Certificates & secrets** → **New client secret** → salin **Value** → ini adalah `appPassword` Anda
5. Buka **Overview** → salin **Directory (tenant) ID** → ini adalah `tenantId` Anda

### Langkah 3: Konfigurasikan Endpoint Messaging

1. Di Azure Bot → **Configuration**
2. Atur **Messaging endpoint** ke URL Webhook Anda:
   - Produksi: `https://your-domain.com/api/messages`
   - Dev lokal: Gunakan tunnel (lihat [Pengembangan Lokal](#local-development-tunneling) di bawah)

### Langkah 4: Aktifkan Channel Teams

1. Di Azure Bot → **Channels**
2. Klik **Microsoft Teams** → Konfigurasikan → Simpan
3. Terima Ketentuan Layanan

### Langkah 5: Bangun Manifes Aplikasi Teams

- Sertakan entri `bot` dengan `botId = <App ID>`.
- Cakupan: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (diperlukan untuk penanganan file cakupan personal).
- Tambahkan izin RSC (lihat [Izin RSC](#current-teams-rsc-permissions-manifest)).
- Buat ikon: `outline.png` (32x32) dan `color.png` (192x192).
- Zip ketiga file bersama-sama: `manifest.json`, `outline.png`, `color.png`.

### Langkah 6: Konfigurasikan OpenClaw

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

Channel Teams dimulai secara otomatis saat Plugin tersedia dan konfigurasi `msteams` ada dengan kredensial.

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

Gunakan Azure Managed Identity untuk autentikasi tanpa kata sandi. Ini ideal untuk deployment di infrastruktur Azure (AKS, App Service, Azure VM) yang memiliki managed identity.

**Cara kerjanya:**

1. Pod/VM bot memiliki managed identity (system-assigned atau user-assigned).
2. **Kredensial identitas federasi** menautkan managed identity ke pendaftaran aplikasi Entra ID.
3. Saat runtime, OpenClaw menggunakan `@azure/identity` untuk memperoleh token dari endpoint Azure IMDS (`169.254.169.254`).
4. Token diteruskan ke Teams SDK untuk autentikasi bot.

**Prasyarat:**

- Infrastruktur Azure dengan managed identity diaktifkan (AKS workload identity, App Service, VM)
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

**Variabel lingkungan:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (hanya untuk yang ditetapkan pengguna)

### Penyiapan Identitas Beban Kerja AKS

Untuk deployment AKS yang menggunakan identitas beban kerja:

1. **Aktifkan identitas beban kerja** pada kluster AKS Anda.
2. **Buat kredensial identitas federasi** pada pendaftaran aplikasi Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Beri anotasi pada akun layanan Kubernetes** dengan ID klien aplikasi:

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

5. **Pastikan akses jaringan** ke IMDS (`169.254.169.254`) - jika menggunakan NetworkPolicy, tambahkan aturan egress yang mengizinkan lalu lintas ke `169.254.169.254/32` pada port 80.

### Perbandingan jenis autentikasi

| Metode                 | Konfigurasi                                   | Kelebihan                                    | Kekurangan                                      |
| ---------------------- | -------------------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| **Rahasia klien**      | `appPassword`                                | Penyiapan sederhana                         | Rotasi rahasia diperlukan, kurang aman          |
| **Sertifikat**         | `authType: "federated"` + `certificatePath`  | Tidak ada rahasia bersama melalui jaringan  | Overhead pengelolaan sertifikat                 |
| **Identitas Terkelola** | `authType: "federated"` + `useManagedIdentity` | Tanpa kata sandi, tidak ada rahasia untuk dikelola | Infrastruktur Azure diperlukan              |

**Perilaku default:** Ketika `authType` tidak disetel, OpenClaw secara default menggunakan autentikasi rahasia klien. Konfigurasi yang sudah ada tetap berfungsi tanpa perubahan.

## Pengembangan lokal (tunneling)

Teams tidak dapat menjangkau `localhost`. Gunakan tunnel pengembangan persisten agar URL Anda tetap sama di seluruh sesi:

```bash
# Penyiapan sekali:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Setiap sesi pengembangan:
devtunnel host my-openclaw-bot
```

Alternatif: `ngrok http 3978` atau `tailscale funnel 3978` (URL dapat berubah pada setiap sesi).

Jika URL tunnel Anda berubah, perbarui endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Menguji Bot

**Jalankan diagnostik:**

```bash
teams app doctor <teamsAppId>
```

Memeriksa pendaftaran bot, aplikasi AAD, manifest, dan konfigurasi SSO dalam satu lintasan.

**Kirim pesan uji:**

1. Instal aplikasi Teams (gunakan tautan instal dari `teams app get <id> --install-link`)
2. Temukan bot di Teams dan kirim DM
3. Periksa log Gateway untuk aktivitas yang masuk

## Variabel lingkungan

Semua kunci konfigurasi dapat disetel melalui variabel lingkungan sebagai gantinya:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (opsional: `"secret"` atau `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federasi + sertifikat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opsional, tidak diperlukan untuk autentikasi)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federasi + identitas terkelola)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (hanya MI yang ditetapkan pengguna)

## Aksi info anggota

OpenClaw mengekspos aksi `member-info` yang didukung Graph untuk Microsoft Teams sehingga agen dan otomasi dapat menyelesaikan detail anggota kanal (nama tampilan, email, peran) langsung dari Microsoft Graph.

Persyaratan:

- Izin RSC `Member.Read.Group` (sudah ada dalam manifest yang direkomendasikan)
- Untuk pencarian lintas tim: izin Graph Application `User.Read.All` dengan persetujuan admin

Aksi ini dibatasi oleh `channels.msteams.actions.memberInfo` (default: aktif ketika kredensial Graph tersedia).

## Konteks riwayat

- `channels.msteams.historyLimit` mengontrol berapa banyak pesan kanal/grup terbaru yang dibungkus ke dalam prompt.
- Kembali ke `messages.groupChat.historyLimit`. Setel `0` untuk menonaktifkan (default 50).
- Riwayat utas yang diambil difilter berdasarkan daftar pengirim yang diizinkan (`allowFrom` / `groupAllowFrom`), sehingga pengisian awal konteks utas hanya mencakup pesan dari pengirim yang diizinkan.
- Konteks lampiran yang dikutip (`ReplyTo*` yang diturunkan dari HTML balasan Teams) saat ini diteruskan sebagaimana diterima.
- Dengan kata lain, daftar yang diizinkan membatasi siapa yang dapat memicu agen; hanya jalur konteks tambahan tertentu yang difilter saat ini.
- Riwayat DM dapat dibatasi dengan `channels.msteams.dmHistoryLimit` (giliran pengguna). Override per pengguna: `channels.msteams.dms["<user_id>"].historyLimit`.

## Izin RSC Teams saat ini (manifest)

Ini adalah **izin resourceSpecific yang sudah ada** dalam manifest aplikasi Teams kami. Izin ini hanya berlaku di dalam tim/chat tempat aplikasi diinstal.

**Untuk kanal (cakupan tim):**

- `ChannelMessage.Read.Group` (Application) - menerima semua pesan kanal tanpa @mention
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

## Contoh manifest Teams (disunting)

Contoh minimal dan valid dengan kolom yang diperlukan. Ganti ID dan URL.

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

### Catatan penting manifest (kolom wajib)

- `bots[].botId` **harus** cocok dengan ID Aplikasi Azure Bot.
- `webApplicationInfo.id` **harus** cocok dengan ID Aplikasi Azure Bot.
- `bots[].scopes` harus menyertakan permukaan yang akan Anda gunakan (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` diperlukan untuk penanganan file dalam cakupan personal.
- `authorization.permissions.resourceSpecific` harus menyertakan baca/kirim kanal jika Anda menginginkan lalu lintas kanal.

### Memperbarui aplikasi yang sudah ada

Untuk memperbarui aplikasi Teams yang sudah diinstal (misalnya, untuk menambahkan izin RSC):

```bash
# Unduh, edit, dan unggah ulang manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json secara lokal...
teams app manifest upload manifest.json <teamsAppId>
# Versi dinaikkan otomatis jika konten berubah
```

Setelah memperbarui, instal ulang aplikasi di setiap tim agar izin baru berlaku, dan **keluar sepenuhnya lalu jalankan ulang Teams** (bukan sekadar menutup jendela) untuk membersihkan metadata aplikasi yang di-cache.

<details>
<summary>Pembaruan manifest manual (tanpa CLI)</summary>

1. Perbarui `manifest.json` Anda dengan pengaturan baru
2. **Naikkan kolom `version`** (misalnya, `1.0.0` → `1.1.0`)
3. **Zip ulang** manifest bersama ikon (`manifest.json`, `outline.png`, `color.png`)
4. Unggah zip baru:
   - **Teams Admin Center:** Aplikasi Teams → Kelola aplikasi → temukan aplikasi Anda → Unggah versi baru
   - **Sideload:** Di Teams → Aplikasi → Kelola aplikasi Anda → Unggah aplikasi kustom

</details>

## Kapabilitas: hanya RSC vs Graph

### Dengan **hanya RSC Teams** (aplikasi diinstal, tanpa izin Graph API)

Berfungsi:

- Membaca konten **teks** pesan kanal.
- Mengirim konten **teks** pesan kanal.
- Menerima lampiran file **personal (DM)**.

TIDAK berfungsi:

- **Konten gambar atau file** kanal/grup (payload hanya menyertakan stub HTML).
- Mengunduh lampiran yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan (di luar peristiwa webhook langsung).

### Dengan **RSC Teams + izin Microsoft Graph Application**

Menambahkan:

- Mengunduh konten yang dihosting (gambar yang ditempel ke pesan).
- Mengunduh lampiran file yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan kanal/chat melalui Graph.

### RSC vs Graph API

| Kapabilitas            | Izin RSC             | Graph API                                 |
| ---------------------- | -------------------- | ----------------------------------------- |
| **Pesan real-time**    | Ya (melalui webhook) | Tidak (hanya polling)                     |
| **Pesan historis**     | Tidak                | Ya (dapat mengkueri riwayat)              |
| **Kompleksitas penyiapan** | Hanya manifest aplikasi | Memerlukan persetujuan admin + alur token |
| **Berfungsi offline**  | Tidak (harus berjalan) | Ya (kueri kapan saja)                   |

**Intinya:** RSC adalah untuk mendengarkan secara real-time; Graph API adalah untuk akses historis. Untuk mengejar pesan yang terlewat saat offline, Anda memerlukan Graph API dengan `ChannelMessage.Read.All` (memerlukan persetujuan admin).

## Media + riwayat yang didukung Graph (diperlukan untuk kanal)

Jika Anda membutuhkan gambar/file di **kanal** atau ingin mengambil **riwayat pesan**, Anda harus mengaktifkan izin Microsoft Graph dan memberikan persetujuan admin.

1. Di **Pendaftaran Aplikasi** Entra ID (Azure AD), tambahkan **izin Application** Microsoft Graph:
   - `ChannelMessage.Read.All` (lampiran kanal + riwayat)
   - `Chat.Read.All` atau `ChatMessage.Read.All` (chat grup)
2. **Berikan persetujuan admin** untuk tenant.
3. Naikkan **versi manifest** aplikasi Teams, unggah ulang, dan **instal ulang aplikasi di Teams**.
4. **Keluar sepenuhnya lalu jalankan ulang Teams** untuk membersihkan metadata aplikasi yang di-cache.

**Izin tambahan untuk mention pengguna:** @mention pengguna berfungsi langsung untuk pengguna dalam percakapan. Namun, jika Anda ingin mencari dan menyebut pengguna secara dinamis yang **tidak ada dalam percakapan saat ini**, tambahkan izin `User.Read.All` (Application) dan berikan persetujuan admin.

## Batasan yang diketahui

### Timeout Webhook

Teams mengirimkan pesan melalui Webhook HTTP. Jika pemrosesan terlalu lama (misalnya, respons LLM lambat), Anda mungkin melihat:

- Timeout Gateway
- Teams mencoba ulang pesan (menyebabkan duplikat)
- Balasan yang terbuang

OpenClaw menangani ini dengan kembali cepat dan mengirim balasan secara proaktif, tetapi respons yang sangat lambat masih dapat menyebabkan masalah.

### Pemformatan

Markdown Teams lebih terbatas daripada Slack atau Discord:

- Pemformatan dasar berfungsi: **tebal**, _miring_, `code`, tautan
- Markdown kompleks (tabel, daftar bertingkat) mungkin tidak dirender dengan benar
- Adaptive Cards didukung untuk polling dan pengiriman presentasi semantik (lihat di bawah)

## Konfigurasi

Pengaturan utama (lihat `/gateway/configuration` untuk pola saluran bersama):

- `channels.msteams.enabled`: aktifkan/nonaktifkan saluran.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: kredensial bot.
- `channels.msteams.webhook.port` (default `3978`)
- `channels.msteams.webhook.path` (default `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing)
- `channels.msteams.allowFrom`: daftar izin DM (ID objek AAD direkomendasikan). Wizard menyelesaikan nama menjadi ID selama penyiapan saat akses Graph tersedia.
- `channels.msteams.dangerouslyAllowNameMatching`: toggle darurat untuk mengaktifkan kembali pencocokan UPN/nama tampilan yang dapat berubah dan perutean langsung nama tim/saluran.
- `channels.msteams.textChunkLimit`: ukuran potongan teks keluar.
- `channels.msteams.chunkMode`: `length` (default) atau `newline` untuk memisahkan pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.msteams.mediaAllowHosts`: daftar izin untuk host lampiran masuk (default ke domain Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: daftar izin untuk melampirkan header Authorization saat percobaan ulang media (default ke host Graph + Bot Framework).
- `channels.msteams.requireMention`: wajibkan @mention di saluran/grup (default true).
- `channels.msteams.replyStyle`: `thread | top-level` (lihat [Gaya balasan](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per tim.
- `channels.msteams.teams.<teamId>.requireMention`: override per tim.
- `channels.msteams.teams.<teamId>.tools`: override kebijakan alat default per tim (`allow`/`deny`/`alsoAllow`) yang digunakan saat override saluran tidak ada.
- `channels.msteams.teams.<teamId>.toolsBySender`: override kebijakan alat default per tim per pengirim (wildcard `"*"` didukung).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per saluran.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per saluran.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: override kebijakan alat per saluran (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: override kebijakan alat per saluran per pengirim (wildcard `"*"` didukung).
- Kunci `toolsBySender` harus menggunakan prefiks eksplisit:
  `id:`, `e164:`, `username:`, `name:` (kunci lama tanpa prefiks tetap dipetakan hanya ke `id:`).
- `channels.msteams.actions.memberInfo`: aktifkan atau nonaktifkan aksi info anggota yang didukung Graph (default: aktif saat kredensial Graph tersedia).
- `channels.msteams.authType`: jenis autentikasi - `"secret"` (default) atau `"federated"`.
- `channels.msteams.certificatePath`: path ke file sertifikat PEM (autentikasi federated + sertifikat).
- `channels.msteams.certificateThumbprint`: thumbprint sertifikat (opsional, tidak diperlukan untuk autentikasi).
- `channels.msteams.useManagedIdentity`: aktifkan autentikasi identitas terkelola (mode federated).
- `channels.msteams.managedIdentityClientId`: ID klien untuk identitas terkelola yang ditetapkan pengguna.
- `channels.msteams.sharePointSiteId`: ID situs SharePoint untuk unggahan file di chat grup/saluran (lihat [Mengirim file di chat grup](#sending-files-in-group-chats)).

## Perutean dan sesi

- Kunci sesi mengikuti format agen standar (lihat [/concepts/session](/id/concepts/session)):
  - Pesan langsung berbagi sesi utama (`agent:<agentId>:<mainKey>`).
  - Pesan saluran/grup menggunakan id percakapan:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Gaya balasan: thread vs postingan

Teams baru-baru ini memperkenalkan dua gaya UI saluran di atas model data dasar yang sama:

| Gaya                     | Deskripsi                                                  | `replyStyle` yang direkomendasikan |
| ------------------------ | ---------------------------------------------------------- | ---------------------------------- |
| **Postingan** (klasik)   | Pesan muncul sebagai kartu dengan balasan ber-thread di bawahnya | `thread` (default)                 |
| **Thread** (mirip Slack) | Pesan mengalir secara linear, lebih seperti Slack          | `top-level`                        |

**Masalah:** Teams API tidak mengekspos gaya UI yang digunakan suatu saluran. Jika Anda menggunakan `replyStyle` yang salah:

- `thread` di saluran bergaya Thread → balasan muncul bersarang dengan canggung
- `top-level` di saluran bergaya Postingan → balasan muncul sebagai postingan tingkat atas terpisah, bukan di dalam thread

**Solusi:** Konfigurasikan `replyStyle` per saluran berdasarkan cara saluran disiapkan:

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

- **DM:** Gambar dan lampiran file berfungsi melalui Teams bot file APIs.
- **Saluran/grup:** Lampiran berada di penyimpanan M365 (SharePoint/OneDrive). Payload Webhook hanya menyertakan stub HTML, bukan byte file sebenarnya. **Izin Graph API diperlukan** untuk mengunduh lampiran saluran.
- Untuk pengiriman eksplisit yang mengutamakan file, gunakan `action=upload-file` dengan `media` / `filePath` / `path`; `message` opsional menjadi teks/komentar pendamping, dan `filename` menggantikan nama yang diunggah.

Tanpa izin Graph, pesan saluran dengan gambar akan diterima hanya sebagai teks (konten gambar tidak dapat diakses oleh bot).
Secara default, OpenClaw hanya mengunduh media dari hostname Microsoft/Teams. Override dengan `channels.msteams.mediaAllowHosts` (gunakan `["*"]` untuk mengizinkan host apa pun).
Header Authorization hanya dilampirkan untuk host dalam `channels.msteams.mediaAuthAllowHosts` (default ke host Graph + Bot Framework). Jaga daftar ini tetap ketat (hindari sufiks multi-tenant).

## Mengirim file di chat grup

Bot dapat mengirim file di DM menggunakan alur FileConsentCard (bawaan). Namun, **mengirim file di chat grup/saluran** memerlukan penyiapan tambahan:

| Konteks                 | Cara file dikirim                           | Penyiapan yang diperlukan                      |
| ----------------------- | ------------------------------------------- | ---------------------------------------------- |
| **DM**                  | FileConsentCard → pengguna menerima → bot mengunggah | Berfungsi langsung tanpa konfigurasi tambahan  |
| **Chat grup/saluran**   | Unggah ke SharePoint → bagikan tautan       | Memerlukan `sharePointSiteId` + izin Graph     |
| **Gambar (konteks apa pun)** | Inline berkode Base64                  | Berfungsi langsung tanpa konfigurasi tambahan  |

### Mengapa chat grup memerlukan SharePoint

Bot tidak memiliki drive OneDrive pribadi (endpoint Graph API `/me/drive` tidak berfungsi untuk identitas aplikasi). Untuk mengirim file di chat grup/saluran, bot mengunggah ke **situs SharePoint** dan membuat tautan berbagi.

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
| `Sites.ReadWrite.All` + `Chat.Read.All` | Tautan berbagi per pengguna (hanya anggota chat yang dapat mengakses) |

Berbagi per pengguna lebih aman karena hanya peserta chat yang dapat mengakses file. Jika izin `Chat.Read.All` tidak ada, bot kembali ke berbagi seluruh organisasi.

### Perilaku fallback

| Skenario                                         | Hasil                                              |
| ------------------------------------------------ | -------------------------------------------------- |
| Chat grup + file + `sharePointSiteId` dikonfigurasi | Unggah ke SharePoint, kirim tautan berbagi      |
| Chat grup + file + tanpa `sharePointSiteId`      | Coba unggah OneDrive (mungkin gagal), kirim teks saja |
| Chat pribadi + file                              | Alur FileConsentCard (berfungsi tanpa SharePoint) |
| Konteks apa pun + gambar                         | Inline berkode Base64 (berfungsi tanpa SharePoint) |

### Lokasi file tersimpan

File yang diunggah disimpan dalam folder `/OpenClawShared/` di pustaka dokumen default situs SharePoint yang dikonfigurasi.

## Polling (Adaptive Cards)

OpenClaw mengirim polling Teams sebagai Adaptive Cards (tidak ada API polling Teams native).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Suara dicatat oleh Gateway di `~/.openclaw/msteams-polls.json`.
- Gateway harus tetap online untuk mencatat suara.
- Polling belum otomatis memposting ringkasan hasil (periksa file penyimpanan jika diperlukan).

## Kartu presentasi

Kirim payload presentasi semantik ke pengguna atau percakapan Teams menggunakan alat `message` atau CLI. OpenClaw merendernya sebagai Teams Adaptive Cards dari kontrak presentasi generik.

Parameter `presentation` menerima blok semantik. Saat `presentation` disediakan, teks pesan bersifat opsional.

**Alat agen:**

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

| Jenis target        | Format                           | Contoh                                              |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Pengguna (berdasarkan ID) | `user:<aad-object-id>`      | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Pengguna (berdasarkan nama) | `user:<display-name>`    | `user:John Smith` (memerlukan Graph API)            |
| Grup/saluran        | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/saluran (raw)  | `<conversation-id>`              | `19:abc123...@thread.tacv2` (jika berisi `@thread`) |

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
Tanpa prefiks `user:`, nama secara default diselesaikan sebagai grup atau tim. Selalu gunakan `user:` saat menargetkan orang berdasarkan nama tampilan.
</Note>

## Pesan proaktif

- Pesan proaktif hanya dimungkinkan **setelah** pengguna berinteraksi, karena kami menyimpan referensi percakapan pada titik tersebut.
- Lihat `/gateway/configuration` untuk `dmPolicy` dan gating allowlist.

## ID Tim dan Saluran (Jebakan Umum)

Parameter kueri `groupId` di URL Teams **BUKAN** ID tim yang digunakan untuk konfigurasi. Ekstrak ID dari path URL sebagai gantinya:

**URL Tim:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL Saluran:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Untuk konfigurasi:**

- Kunci tim = segmen path setelah `/team/` (di-URL-decode, misalnya, `19:Bk4j...@thread.tacv2`; tenant lama mungkin menampilkan `@thread.skype`, yang juga valid)
- Kunci saluran = segmen path setelah `/channel/` (di-URL-decode)
- **Abaikan** parameter kueri `groupId` untuk routing OpenClaw. Itu adalah ID grup Microsoft Entra, bukan ID percakapan Bot Framework yang digunakan dalam aktivitas Teams masuk.

## Saluran privat

Bot memiliki dukungan terbatas di saluran privat:

| Fitur                        | Saluran Standar  | Saluran Privat        |
| ---------------------------- | ---------------- | --------------------- |
| Instalasi bot                | Ya               | Terbatas              |
| Pesan real-time (Webhook)    | Ya               | Mungkin tidak bekerja |
| Izin RSC                     | Ya               | Mungkin berperilaku berbeda |
| @mentions                    | Ya               | Jika bot dapat diakses |
| Riwayat Graph API            | Ya               | Ya (dengan izin)      |

**Solusi jika saluran privat tidak berfungsi:**

1. Gunakan saluran standar untuk interaksi bot
2. Gunakan DM - pengguna selalu dapat mengirim pesan langsung ke bot
3. Gunakan Graph API untuk akses historis (memerlukan `ChannelMessage.Read.All`)

## Pemecahan Masalah

### Masalah umum

- **Gambar tidak muncul di saluran:** Izin Graph atau persetujuan admin tidak ada. Instal ulang aplikasi Teams dan keluar sepenuhnya/buka kembali Teams.
- **Tidak ada respons di saluran:** mention diperlukan secara default; atur `channels.msteams.requireMention=false` atau konfigurasikan per tim/saluran.
- **Ketidakcocokan versi (Teams masih menampilkan manifes lama):** hapus + tambahkan ulang aplikasi dan keluar sepenuhnya dari Teams untuk memuat ulang.
- **401 Unauthorized dari Webhook:** Diharapkan saat menguji secara manual tanpa Azure JWT - berarti endpoint dapat dijangkau tetapi autentikasi gagal. Gunakan Azure Web Chat untuk menguji dengan benar.

### Kesalahan unggah manifes

- **"Icon file cannot be empty":** Manifes merujuk file ikon yang berukuran 0 byte. Buat ikon PNG yang valid (32x32 untuk `outline.png`, 192x192 untuk `color.png`).
- **"webApplicationInfo.Id already in use":** Aplikasi masih terinstal di tim/chat lain. Temukan dan hapus instalasinya terlebih dahulu, atau tunggu 5-10 menit untuk propagasi.
- **"Something went wrong" saat unggah:** Unggah melalui [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) sebagai gantinya, buka DevTools browser (F12) → tab Network, dan periksa isi respons untuk kesalahan sebenarnya.
- **Sideload gagal:** Coba "Upload an app to your org's app catalog" alih-alih "Upload a custom app" - ini sering melewati pembatasan sideload.

### Izin RSC tidak berfungsi

1. Verifikasi `webApplicationInfo.id` sama persis dengan App ID bot Anda
2. Unggah ulang aplikasi dan instal ulang di tim/chat
3. Periksa apakah admin organisasi Anda memblokir izin RSC
4. Konfirmasi Anda menggunakan cakupan yang tepat: `ChannelMessage.Read.Group` untuk tim, `ChatMessage.Read.Chat` untuk chat grup

## Referensi

- [Buat Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - panduan penyiapan Azure Bot
- [Portal Developer Teams](https://dev.teams.microsoft.com/apps) - buat/kelola aplikasi Teams
- [Skema manifes aplikasi Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Terima pesan saluran dengan RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referensi izin RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Penanganan file bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (saluran/grup memerlukan Graph)
- [Pesan proaktif](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI untuk manajemen bot

## Terkait

- [Ikhtisar Saluran](/id/channels) - semua saluran yang didukung
- [Pairing](/id/channels/pairing) - autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) - perilaku chat grup dan gating mention
- [Routing Saluran](/id/channels/channel-routing) - routing sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan hardening
