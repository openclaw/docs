---
read_when:
    - Mengerjakan fitur saluran Microsoft Teams
summary: Status dukungan, kemampuan, dan konfigurasi bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T17:11:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

Status: teks + lampiran DM didukung; pengiriman file channel/grup memerlukan `sharePointSiteId` + izin Graph (lihat [Mengirim file di chat grup](#sending-files-in-group-chats)). Poll dikirim melalui Adaptive Cards. Tindakan pesan mengekspos `upload-file` eksplisit untuk pengiriman yang mengutamakan file.

## Plugin bawaan

Microsoft Teams dikirim sebagai plugin bawaan dalam rilis OpenClaw saat ini, sehingga tidak diperlukan instalasi terpisah dalam build paket normal.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Teams bawaan, instal paket npm secara langsung:

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
`--allow-anonymous` diperlukan karena Teams tidak dapat melakukan autentikasi dengan devtunnels. Setiap permintaan bot yang masuk tetap divalidasi secara otomatis oleh Teams SDK.
</Note>

Alternatif: `ngrok http 3978` atau `tailscale funnel 3978` (tetapi ini dapat mengubah URL setiap sesi).

**3. Buat aplikasi**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Perintah tunggal ini:

- Membuat aplikasi Entra ID (Azure AD)
- Membuat client secret
- Membangun dan mengunggah manifes aplikasi Teams (dengan ikon)
- Mendaftarkan bot (dikelola Teams secara default - tidak memerlukan langganan Azure)

Output akan menampilkan `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, dan **Teams App ID** - catat ini untuk langkah berikutnya. Output juga menawarkan untuk menginstal aplikasi langsung di Teams.

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

`teams app create` akan meminta Anda menginstal aplikasi - pilih "Instal di Teams". Jika Anda melewatkannya, Anda dapat memperoleh tautan nanti:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifikasi semuanya berfungsi**

```bash
teams app doctor <teamsAppId>
```

Ini menjalankan diagnostik pada pendaftaran bot, konfigurasi aplikasi AAD, validitas manifes, dan penyiapan SSO.

Untuk deployment produksi, pertimbangkan menggunakan [autentikasi federasi](/id/channels/msteams#federated-authentication-certificate-plus-managed-identity) (sertifikat atau identitas terkelola) alih-alih client secret.

<Note>
Chat grup diblokir secara default (`channels.msteams.groupPolicy: "allowlist"`). Untuk mengizinkan balasan grup, tetapkan `channels.msteams.groupAllowFrom`, atau gunakan `groupPolicy: "open"` untuk mengizinkan anggota mana pun (dengan gerbang mention).
</Note>

## Tujuan

- Berbicara dengan OpenClaw melalui DM Teams, chat grup, atau channel.
- Menjaga routing tetap deterministik: balasan selalu kembali ke channel asalnya.
- Menggunakan perilaku channel yang aman secara default (mention diperlukan kecuali dikonfigurasi sebaliknya).

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

- Default: `channels.msteams.dmPolicy = "pairing"`. Pengirim tidak dikenal diabaikan hingga disetujui.
- `channels.msteams.allowFrom` harus menggunakan ID objek AAD yang stabil atau grup akses pengirim statis seperti `accessGroup:core-team`.
- Jangan mengandalkan pencocokan UPN/nama tampilan untuk allowlist - keduanya dapat berubah. OpenClaw menonaktifkan pencocokan nama langsung secara default; ikut serta secara eksplisit dengan `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard dapat menyelesaikan nama menjadi ID melalui Microsoft Graph saat kredensial mengizinkan.

**Akses grup**

- Default: `channels.msteams.groupPolicy = "allowlist"` (diblokir kecuali Anda menambahkan `groupAllowFrom`). Gunakan `channels.defaults.groupPolicy` untuk menimpa default saat tidak ditetapkan.
- `channels.msteams.groupAllowFrom` mengontrol pengirim atau grup akses pengirim statis mana yang dapat memicu di chat/channel grup (fallback ke `channels.msteams.allowFrom`).
- Tetapkan `groupPolicy: "open"` untuk mengizinkan anggota mana pun (tetap dengan gerbang mention secara default).
- Untuk tidak mengizinkan **channel apa pun**, tetapkan `channels.msteams.groupPolicy: "disabled"`.

Contoh:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + allowlist channel**

- Batasi cakupan balasan grup/channel dengan mencantumkan teams dan channel di bawah `channels.msteams.teams`.
- Kunci harus menggunakan ID percakapan Teams yang stabil dari tautan Teams, bukan nama tampilan yang dapat berubah.
- Saat `groupPolicy="allowlist"` dan allowlist teams ada, hanya teams/channel yang tercantum yang diterima (dengan gerbang mention).
- Wizard konfigurasi menerima entri `Team/Channel` dan menyimpannya untuk Anda.
- Saat startup, OpenClaw menyelesaikan nama allowlist team/channel dan pengguna menjadi ID (saat izin Graph mengizinkan)
  dan mencatat pemetaannya; nama team/channel yang tidak terselesaikan dipertahankan sebagaimana diketik tetapi diabaikan untuk routing secara default kecuali `channels.msteams.dangerouslyAllowNameMatching: true` diaktifkan.

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

1. Pastikan plugin Microsoft Teams tersedia (bawaan dalam rilis saat ini).
2. Buat **Azure Bot** (App ID + secret + tenant ID).
3. Bangun **paket aplikasi Teams** yang mereferensikan bot dan menyertakan izin RSC di bawah.
4. Unggah/instal aplikasi Teams ke dalam team (atau cakupan pribadi untuk DM).
5. Konfigurasikan `msteams` di `~/.openclaw/openclaw.json` (atau env vars) dan mulai gateway.
6. Gateway mendengarkan lalu lintas Webhook Bot Framework di `/api/messages` secara default.

### Langkah 1: Buat Azure Bot

1. Buka [Buat Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Isi tab **Basics**:

   | Bidang             | Nilai                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nama bot Anda, mis., `openclaw-msteams` (harus unik)     |
   | **Subscription**   | Pilih langganan Azure Anda                               |
   | **Resource group** | Buat baru atau gunakan yang sudah ada                    |
   | **Pricing tier**   | **Free** untuk dev/pengujian                             |
   | **Type of App**    | **Single Tenant** (direkomendasikan - lihat catatan di bawah) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Pembuatan bot multi-tenant baru dihentikan setelah 2025-07-31. Gunakan **Single Tenant** untuk bot baru.
</Warning>

3. Klik **Review + create** → **Create** (tunggu ~1-2 menit)

### Langkah 2: Dapatkan Kredensial

1. Buka sumber daya Azure Bot Anda → **Configuration**
2. Salin **Microsoft App ID** → ini adalah `appId` Anda
3. Klik **Manage Password** → buka App Registration
4. Di bawah **Certificates & secrets** → **New client secret** → salin **Value** → ini adalah `appPassword` Anda
5. Buka **Overview** → salin **Directory (tenant) ID** → ini adalah `tenantId` Anda

### Langkah 3: Konfigurasikan Endpoint Perpesanan

1. Di Azure Bot → **Configuration**
2. Tetapkan **Messaging endpoint** ke URL Webhook Anda:
   - Produksi: `https://your-domain.com/api/messages`
   - Dev lokal: Gunakan tunnel (lihat [Pengembangan Lokal](#local-development-tunneling) di bawah)

### Langkah 4: Aktifkan Channel Teams

1. Di Azure Bot → **Channels**
2. Klik **Microsoft Teams** → Configure → Save
3. Terima Terms of Service

### Langkah 5: Bangun Manifes Aplikasi Teams

- Sertakan entri `bot` dengan `botId = <App ID>`.
- Cakupan: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (diperlukan untuk penanganan file cakupan pribadi).
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

Channel Teams dimulai secara otomatis saat plugin tersedia dan konfigurasi `msteams` ada dengan kredensial.

</details>

## Autentikasi federasi (sertifikat plus identitas terkelola)

> Ditambahkan pada 2026.4.11

Untuk deployment produksi, OpenClaw mendukung **autentikasi federasi** sebagai alternatif yang lebih aman daripada client secret. Dua metode tersedia:

### Opsi A: Autentikasi berbasis sertifikat

Gunakan sertifikat PEM yang terdaftar dengan pendaftaran aplikasi Entra ID Anda.

**Penyiapan:**

1. Buat atau peroleh sertifikat (format PEM dengan kunci privat).
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

Gunakan Azure Managed Identity untuk autentikasi tanpa kata sandi. Ini ideal untuk deployment pada infrastruktur Azure (AKS, App Service, Azure VM) saat identitas terkelola tersedia.

**Cara kerjanya:**

1. Pod/VM bot memiliki identitas terkelola (ditetapkan sistem atau ditetapkan pengguna).
2. **Kredensial identitas federasi** menautkan identitas terkelola ke pendaftaran aplikasi Entra ID.
3. Saat runtime, OpenClaw menggunakan `@azure/identity` untuk memperoleh token dari endpoint Azure IMDS (`169.254.169.254`).
4. Token diteruskan ke Teams SDK untuk autentikasi bot.

**Prasyarat:**

- Infrastruktur Azure dengan identitas terkelola diaktifkan (identitas beban kerja AKS, App Service, VM)
- Kredensial identitas federasi dibuat pada pendaftaran aplikasi Entra ID
- Akses jaringan ke IMDS (`169.254.169.254:80`) dari pod/VM

**Konfigurasi (identitas terkelola yang ditetapkan sistem):**

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

**Konfigurasi (managed identity yang ditetapkan pengguna):**

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

### Penyiapan AKS Workload Identity

Untuk deployment AKS yang menggunakan workload identity:

1. **Aktifkan workload identity** pada klaster AKS Anda.
2. **Buat kredensial identitas federated** pada pendaftaran aplikasi Entra ID:

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

4. **Beri label pada pod** untuk injeksi workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Pastikan akses jaringan** ke IMDS (`169.254.169.254`) - jika menggunakan NetworkPolicy, tambahkan aturan egress yang mengizinkan lalu lintas ke `169.254.169.254/32` pada port 80.

### Perbandingan jenis autentikasi

| Metode               | Konfigurasi                                    | Kelebihan                          | Kekurangan                                      |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ----------------------------------------------- |
| **Client secret**    | `appPassword`                                  | Penyiapan sederhana                | Rotasi secret wajib, kurang aman                |
| **Sertifikat**       | `authType: "federated"` + `certificatePath`    | Tidak ada shared secret via jaringan | Overhead pengelolaan sertifikat               |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Tanpa kata sandi, tidak ada secret untuk dikelola | Infrastruktur Azure diperlukan       |

**Perilaku default:** Saat `authType` tidak diatur, OpenClaw menggunakan autentikasi client secret secara default. Konfigurasi yang sudah ada tetap berfungsi tanpa perubahan.

## Pengembangan lokal (tunneling)

Teams tidak dapat menjangkau `localhost`. Gunakan dev tunnel persisten agar URL Anda tetap sama di seluruh sesi:

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

Memeriksa pendaftaran bot, aplikasi AAD, manifest, dan konfigurasi SSO dalam satu kali proses.

**Kirim pesan uji:**

1. Instal aplikasi Teams (gunakan tautan instal dari `teams app get <id> --install-link`)
2. Temukan bot di Teams dan kirim DM
3. Periksa log gateway untuk aktivitas masuk

## Variabel lingkungan

Semua kunci konfigurasi dapat diatur melalui variabel lingkungan sebagai gantinya:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (opsional: `"secret"` atau `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + sertifikat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opsional, tidak diperlukan untuk autentikasi)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (hanya MI yang ditetapkan pengguna)

## Aksi info anggota

OpenClaw mengekspos aksi `member-info` yang didukung Graph untuk Microsoft Teams sehingga agent dan otomasi dapat menyelesaikan detail anggota channel (nama tampilan, email, peran) langsung dari Microsoft Graph.

Persyaratan:

- Izin RSC `Member.Read.Group` (sudah ada dalam manifest yang direkomendasikan)
- Untuk pencarian lintas tim: izin Graph Application `User.Read.All` dengan persetujuan admin

Aksi ini dibatasi oleh `channels.msteams.actions.memberInfo` (default: aktif saat kredensial Graph tersedia).

## Konteks riwayat

- `channels.msteams.historyLimit` mengontrol berapa banyak pesan channel/grup terbaru yang dibungkus ke dalam prompt.
- Fallback ke `messages.groupChat.historyLimit`. Atur `0` untuk menonaktifkan (default 50).
- Riwayat thread yang diambil difilter berdasarkan allowlist pengirim (`allowFrom` / `groupAllowFrom`), sehingga pengisian awal konteks thread hanya menyertakan pesan dari pengirim yang diizinkan.
- Konteks lampiran yang dikutip (`ReplyTo*` yang berasal dari HTML balasan Teams) saat ini diteruskan sebagaimana diterima.
- Dengan kata lain, allowlist membatasi siapa yang dapat memicu agent; hanya jalur konteks tambahan tertentu yang difilter saat ini.
- Riwayat DM dapat dibatasi dengan `channels.msteams.dmHistoryLimit` (giliran pengguna). Override per pengguna: `channels.msteams.dms["<user_id>"].historyLimit`.

## Izin RSC Teams saat ini (manifest)

Ini adalah **izin resourceSpecific yang sudah ada** dalam manifest aplikasi Teams kami. Izin ini hanya berlaku di dalam tim/chat tempat aplikasi diinstal.

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

Untuk menambahkan izin RSC melalui Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Contoh manifest Teams (disamarkan)

Contoh minimal dan valid dengan field yang diperlukan. Ganti ID dan URL.

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
- `bots[].scopes` harus menyertakan surface yang Anda rencanakan untuk digunakan (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` diperlukan untuk penanganan file dalam cakupan personal.
- `authorization.permissions.resourceSpecific` harus menyertakan baca/kirim channel jika Anda menginginkan lalu lintas channel.

### Memperbarui aplikasi yang sudah ada

Untuk memperbarui aplikasi Teams yang sudah diinstal (misalnya, untuk menambahkan izin RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Setelah memperbarui, instal ulang aplikasi di setiap tim agar izin baru berlaku, dan **keluar sepenuhnya lalu jalankan ulang Teams** (bukan hanya menutup jendela) untuk membersihkan metadata aplikasi yang tersimpan di cache.

<details>
<summary>Pembaruan manifest manual (tanpa CLI)</summary>

1. Perbarui `manifest.json` Anda dengan pengaturan baru
2. **Naikkan field `version`** (misalnya, `1.0.0` → `1.1.0`)
3. **Zip ulang** manifest dengan ikon (`manifest.json`, `outline.png`, `color.png`)
4. Unggah zip baru:
   - **Teams Admin Center:** Aplikasi Teams → Kelola aplikasi → temukan aplikasi Anda → Unggah versi baru
   - **Sideload:** Di Teams → Aplikasi → Kelola aplikasi Anda → Unggah aplikasi kustom

</details>

## Kemampuan: hanya RSC vs Graph

### Dengan **hanya Teams RSC** (aplikasi terinstal, tanpa izin Graph API)

Berfungsi:

- Membaca konten **teks** pesan channel.
- Mengirim konten **teks** pesan channel.
- Menerima lampiran file **personal (DM)**.

Tidak berfungsi:

- **Isi gambar atau file** channel/grup (payload hanya menyertakan stub HTML).
- Mengunduh lampiran yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan (di luar peristiwa webhook langsung).

### Dengan **Teams RSC + izin Microsoft Graph Application**

Menambahkan:

- Mengunduh konten yang di-host (gambar yang ditempel ke pesan).
- Mengunduh lampiran file yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan channel/chat melalui Graph.

### RSC vs Graph API

| Kemampuan               | Izin RSC             | Graph API                              |
| ----------------------- | -------------------- | -------------------------------------- |
| **Pesan real-time**     | Ya (via webhook)     | Tidak (hanya polling)                  |
| **Pesan historis**      | Tidak                | Ya (dapat mengkueri riwayat)           |
| **Kompleksitas penyiapan** | Hanya manifest aplikasi | Memerlukan persetujuan admin + alur token |
| **Berfungsi offline**   | Tidak (harus berjalan) | Ya (kueri kapan saja)                |

**Intinya:** RSC digunakan untuk mendengarkan secara real-time; Graph API digunakan untuk akses historis. Untuk mengejar pesan yang terlewat saat offline, Anda memerlukan Graph API dengan `ChannelMessage.Read.All` (memerlukan persetujuan admin).

## Media + riwayat yang didukung Graph (diperlukan untuk channel)

Jika Anda memerlukan gambar/file di **channel** atau ingin mengambil **riwayat pesan**, Anda harus mengaktifkan izin Microsoft Graph dan memberikan persetujuan admin.

1. Di **App Registration** Entra ID (Azure AD), tambahkan **izin Application** Microsoft Graph:
   - `ChannelMessage.Read.All` (lampiran channel + riwayat)
   - `Chat.Read.All` atau `ChatMessage.Read.All` (chat grup)
2. **Berikan persetujuan admin** untuk tenant.
3. Naikkan **versi manifest** aplikasi Teams, unggah ulang, dan **instal ulang aplikasi di Teams**.
4. **Keluar sepenuhnya lalu jalankan ulang Teams** untuk membersihkan metadata aplikasi yang tersimpan di cache.

**Izin tambahan untuk mention pengguna:** @mention pengguna berfungsi langsung untuk pengguna dalam percakapan. Namun, jika Anda ingin mencari dan mention pengguna secara dinamis yang **tidak berada dalam percakapan saat ini**, tambahkan izin `User.Read.All` (Application) dan berikan persetujuan admin.

## Batasan yang diketahui

### Timeout webhook

Teams mengirim pesan melalui webhook HTTP. Jika pemrosesan terlalu lama (misalnya, respons LLM lambat), Anda mungkin melihat:

- Timeout Gateway
- Teams mencoba ulang pesan (menyebabkan duplikat)
- Balasan yang gagal dikirim

OpenClaw menangani ini dengan mengembalikan respons dengan cepat dan mengirim balasan secara proaktif, tetapi respons yang sangat lambat masih dapat menyebabkan masalah.

### Dukungan cloud Teams dan URL layanan

Jalur Teams yang didukung SDK ini telah divalidasi secara live untuk cloud publik Microsoft Teams.

Balasan masuk menggunakan konteks turn Teams SDK yang masuk. Operasi proaktif di luar konteks - pengiriman, pengeditan, penghapusan, kartu, polling, pesan persetujuan file, dan balasan antrean yang berjalan lama - menggunakan `serviceUrl` referensi percakapan yang tersimpan. Cloud publik secara default menggunakan lingkungan cloud publik Teams SDK dan mengizinkan referensi tersimpan pada host Teams Connector publik: `https://smba.trafficmanager.net/`.

Cloud publik adalah default. Anda tidak perlu menetapkan `channels.msteams.cloud` atau `channels.msteams.serviceUrl` untuk bot cloud publik normal.

Untuk cloud Teams non-publik, tetapkan `cloud` dan batas proaktif yang cocok saat Microsoft menerbitkannya:

- `channels.msteams.cloud` memilih preset cloud Teams SDK untuk autentikasi, validasi JWT, layanan token, dan cakupan Graph.
- `channels.msteams.serviceUrl` memilih batas endpoint Bot Connector yang digunakan untuk memvalidasi referensi percakapan tersimpan sebelum pengiriman, pengeditan, penghapusan, kartu, polling, pesan persetujuan file, dan balasan antrean yang berjalan lama secara proaktif. Ini wajib untuk cloud SDK USGov dan DoD. Untuk China/21Vianet, OpenClaw menggunakan preset SDK `China` dan hanya menerima URL layanan tersimpan/terkonfigurasi pada host kanal Azure China Bot Framework.

Microsoft menerbitkan endpoint Bot Connector proaktif global di bagian [Buat percakapan](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) pada dokumentasi pesan proaktif Teams. Gunakan `serviceUrl` aktivitas masuk saat tersedia; jika Anda memerlukan endpoint proaktif global, gunakan tabel Microsoft.

| Lingkungan Teams | Konfigurasi OpenClaw                                      | `serviceUrl` proaktif                             |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Publik            | tidak diperlukan konfigurasi cloud/serviceUrl               | `https://smba.trafficmanager.net/teams`            |
| GCC               | tetapkan `serviceUrl`; tidak ada preset cloud Teams SDK terpisah | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | gunakan `serviceUrl` aktivitas masuk               |

Contoh untuk GCC, ketika Microsoft mendokumentasikan URL layanan proaktif terpisah tetapi Teams SDK tidak mengekspos preset cloud GCC terpisah:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

Contoh untuk GCC High:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` dibatasi hanya untuk host Microsoft Teams Bot Connector yang didukung. Saat URL layanan dikonfigurasi, OpenClaw memeriksa bahwa `serviceUrl` percakapan tersimpan menggunakan host yang sama sebelum pengiriman, pengeditan, penghapusan, kartu, polling, atau balasan antrean yang berjalan lama secara proaktif dijalankan. Dengan konfigurasi cloud publik default, OpenClaw gagal tertutup jika percakapan tersimpan mengarah ke luar host Teams Connector publik. Terima pesan baru dari percakapan setelah mengubah pengaturan cloud/URL layanan agar referensi percakapan tersimpan tetap mutakhir.

China/21Vianet tidak memiliki URL `smba` proaktif global terpisah dalam tabel endpoint proaktif Teams milik Microsoft. Konfigurasikan `cloud: "China"` agar Teams SDK menggunakan endpoint autentikasi, token, dan JWT Azure China. Pengiriman proaktif kemudian memerlukan referensi percakapan tersimpan dari aktivitas China Teams yang masuk, atau URL layanan yang dikonfigurasi secara eksplisit, pada batas kanal Azure China Bot Framework (`*.botframework.azure.cn`). Pembantu Teams yang didukung Graph saat ini dinonaktifkan untuk `cloud: "China"` hingga OpenClaw merutekan permintaan Graph melalui endpoint Azure China Graph.

### Pemformatan

Markdown Teams lebih terbatas daripada Slack atau Discord:

- Pemformatan dasar berfungsi: **tebal**, _miring_, `code`, tautan
- Markdown kompleks (tabel, daftar bersarang) mungkin tidak dirender dengan benar
- Adaptive Cards didukung untuk polling dan pengiriman presentasi semantik (lihat di bawah)

## Konfigurasi

Pengaturan utama (lihat `/gateway/configuration` untuk pola kanal bersama):

- `channels.msteams.enabled`: aktifkan/nonaktifkan kanal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: kredensial bot.
- `channels.msteams.cloud`: lingkungan cloud Teams SDK (`Public`, `USGov`, `USGovDoD`, atau `China`; default `Public`). Tetapkan ini dengan `serviceUrl` untuk cloud SDK USGov/DoD; China menggunakan preset SDK dan referensi percakapan Azure China Bot Framework tersimpan, dengan pembantu yang didukung Graph dinonaktifkan hingga perutean Azure China Graph diimplementasikan.
- `channels.msteams.serviceUrl`: batas URL layanan Bot Connector untuk operasi proaktif SDK. Cloud publik menggunakan default SDK; tetapkan ini untuk GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High, atau DoD. China menerima host kanal Azure China Bot Framework saat referensi percakapan tersimpan berasal dari Teams yang dioperasikan oleh 21Vianet.
- `channels.msteams.webhook.port` (default `3978`)
- `channels.msteams.webhook.path` (default `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing)
- `channels.msteams.allowFrom`: daftar izin DM (ID objek AAD direkomendasikan). Wizard menyelesaikan nama menjadi ID selama penyiapan saat akses Graph tersedia.
- `channels.msteams.dangerouslyAllowNameMatching`: toggle break-glass untuk mengaktifkan kembali pencocokan UPN/nama tampilan yang dapat berubah dan perutean nama tim/kanal langsung.
- `channels.msteams.textChunkLimit`: ukuran potongan teks keluar.
- `channels.msteams.chunkMode`: `length` (default) atau `newline` untuk memecah pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.msteams.mediaAllowHosts`: daftar izin untuk host lampiran masuk (default ke domain Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: daftar izin untuk menyertakan header Authorization pada percobaan ulang media (default ke host Graph + Bot Framework).
- `channels.msteams.requireMention`: wajibkan @mention di kanal/grup (default true).
- `channels.msteams.replyStyle`: `thread | top-level` (lihat [Gaya Balasan](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per tim.
- `channels.msteams.teams.<teamId>.requireMention`: override per tim.
- `channels.msteams.teams.<teamId>.tools`: override kebijakan alat default per tim (`allow`/`deny`/`alsoAllow`) yang digunakan saat override kanal tidak ada.
- `channels.msteams.teams.<teamId>.toolsBySender`: override kebijakan alat default per tim per pengirim (wildcard `"*"` didukung).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: override kebijakan alat per kanal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: override kebijakan alat per kanal per pengirim (wildcard `"*"` didukung).
- Kunci `toolsBySender` sebaiknya menggunakan prefiks eksplisit:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (kunci lama tanpa prefiks masih hanya dipetakan ke `id:`).
- `channels.msteams.actions.memberInfo`: aktifkan atau nonaktifkan aksi info anggota yang didukung Graph (default: aktif saat kredensial Graph tersedia).
- `channels.msteams.authType`: tipe autentikasi - `"secret"` (default) atau `"federated"`.
- `channels.msteams.certificatePath`: jalur ke file sertifikat PEM (autentikasi federated + sertifikat).
- `channels.msteams.certificateThumbprint`: thumbprint sertifikat (opsional, tidak diperlukan untuk autentikasi).
- `channels.msteams.useManagedIdentity`: aktifkan autentikasi managed identity (mode federated).
- `channels.msteams.managedIdentityClientId`: ID klien untuk managed identity yang ditetapkan pengguna.
- `channels.msteams.sharePointSiteId`: ID situs SharePoint untuk unggahan file di obrolan grup/kanal (lihat [Mengirim file di obrolan grup](#sending-files-in-group-chats)).

## Perutean dan sesi

- Kunci sesi mengikuti format agen standar (lihat [/concepts/session](/id/concepts/session)):
  - Pesan langsung berbagi sesi utama (`agent:<agentId>:<mainKey>`).
  - Pesan kanal/grup menggunakan id percakapan:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Gaya balasan: utas vs postingan

Teams baru-baru ini memperkenalkan dua gaya UI kanal di atas model data dasar yang sama:

| Gaya                     | Deskripsi                                                 | `replyStyle` yang direkomendasikan |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Postingan** (klasik)   | Pesan muncul sebagai kartu dengan balasan berutas di bawahnya | `thread` (default)       |
| **Utas** (mirip Slack)   | Pesan mengalir secara linear, lebih mirip Slack           | `top-level`              |

**Masalahnya:** API Teams tidak mengekspos gaya UI mana yang digunakan sebuah kanal. Jika Anda menggunakan `replyStyle` yang salah:

- `thread` di kanal bergaya Utas → balasan tampak bersarang secara canggung
- `top-level` di kanal bergaya Postingan → balasan muncul sebagai postingan tingkat atas terpisah, bukan di dalam utas

**Solusi:** Konfigurasikan `replyStyle` per kanal berdasarkan cara kanal disiapkan:

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

### Prioritas resolusi

Saat bot mengirim balasan ke kanal, `replyStyle` diselesaikan dari override yang paling spesifik hingga default. Nilai pertama yang bukan `undefined` akan menang:

1. **Per kanal** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Per tim** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** — `channels.msteams.replyStyle`
4. **Default implisit** — diturunkan dari `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Jika Anda menetapkan `requireMention: false` secara global tanpa `replyStyle` eksplisit, mention di kanal bergaya Postingan akan muncul sebagai postingan tingkat atas meskipun pesan masuk adalah balasan utas. Tetapkan `replyStyle: "thread"` pada tingkat global, tim, atau kanal untuk menghindari kejutan.

### Pelestarian konteks utas

Saat `replyStyle: "thread"` berlaku dan bot di-@mention dari dalam utas kanal, OpenClaw melampirkan kembali akar utas asli ke referensi percakapan keluar (`19:…@thread.tacv2;messageid=<root>`) agar balasan mendarat di dalam utas yang sama. Ini berlaku untuk pengiriman live (dalam turn) dan pengiriman proaktif yang dibuat setelah konteks turn Bot Framework kedaluwarsa (misalnya, agen yang berjalan lama, balasan panggilan alat yang diantrekan melalui `mcp__openclaw__message`).

Akar utas diambil dari `threadId` yang tersimpan pada referensi percakapan. Referensi tersimpan yang lebih lama dan dibuat sebelum `threadId` akan fallback ke `activityId` (aktivitas masuk apa pun yang terakhir menginisialisasi percakapan), sehingga deployment yang ada tetap berfungsi tanpa seed ulang.

Ketika `replyStyle: "top-level"` berlaku, inbound channel-thread sengaja dijawab sebagai posting tingkat atas baru — tidak ada sufiks utas yang dilampirkan. Ini adalah perilaku yang benar untuk kanal bergaya Threads; jika Anda melihat posting tingkat atas ketika Anda mengharapkan balasan berutas, `replyStyle` Anda salah diatur untuk kanal tersebut.

## Lampiran dan gambar

**Batasan saat ini:**

- **DM:** Gambar dan lampiran file berfungsi melalui API file bot Teams.
- **Kanal/grup:** Lampiran berada di penyimpanan M365 (SharePoint/OneDrive). Payload Webhook hanya menyertakan stub HTML, bukan byte file sebenarnya. **Izin Graph API diperlukan** untuk mengunduh lampiran kanal.
- Untuk pengiriman eksplisit yang mengutamakan file, gunakan `action=upload-file` dengan `media` / `filePath` / `path`; `message` opsional menjadi teks/komentar pendamping, dan `filename` mengganti nama yang diunggah.

Tanpa izin Graph, pesan kanal dengan gambar akan diterima sebagai teks saja (konten gambar tidak dapat diakses oleh bot).
Secara default, OpenClaw hanya mengunduh media dari nama host Microsoft/Teams. Timpa dengan `channels.msteams.mediaAllowHosts` (gunakan `["*"]` untuk mengizinkan host apa pun).
Header otorisasi hanya dilampirkan untuk host di `channels.msteams.mediaAuthAllowHosts` (defaultnya host Graph + Bot Framework). Jaga daftar ini tetap ketat (hindari sufiks multi-tenant).

## Mengirim file dalam obrolan grup

Bot dapat mengirim file di DM menggunakan alur FileConsentCard (bawaan). Namun, **mengirim file dalam obrolan grup/kanal** memerlukan penyiapan tambahan:

| Konteks                  | Cara file dikirim                           | Penyiapan yang diperlukan                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → pengguna menerima → bot mengunggah | Langsung berfungsi                            |
| **Obrolan grup/kanal** | Unggah ke SharePoint → bagikan tautan            | Memerlukan `sharePointSiteId` + izin Graph |
| **Gambar (konteks apa pun)** | Inline berkode Base64                        | Langsung berfungsi                            |

### Mengapa obrolan grup memerlukan SharePoint

Bot tidak memiliki drive OneDrive pribadi (endpoint Graph API `/me/drive` tidak berfungsi untuk identitas aplikasi). Untuk mengirim file dalam obrolan grup/kanal, bot mengunggah ke **situs SharePoint** dan membuat tautan berbagi.

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

| Izin                              | Perilaku berbagi                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` saja              | Tautan berbagi seluruh organisasi (siapa pun di org dapat mengakses) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Tautan berbagi per pengguna (hanya anggota obrolan yang dapat mengakses)      |

Berbagi per pengguna lebih aman karena hanya peserta obrolan yang dapat mengakses file. Jika izin `Chat.Read.All` tidak ada, bot kembali ke berbagi seluruh organisasi.

### Perilaku cadangan

| Skenario                                          | Hasil                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Obrolan grup + file + `sharePointSiteId` dikonfigurasi | Unggah ke SharePoint, kirim tautan berbagi            |
| Obrolan grup + file + tanpa `sharePointSiteId`         | Coba unggah OneDrive (mungkin gagal), kirim teks saja |
| Obrolan pribadi + file                              | Alur FileConsentCard (berfungsi tanpa SharePoint)    |
| Konteks apa pun + gambar                               | Inline berkode Base64 (berfungsi tanpa SharePoint)   |

### Lokasi penyimpanan file

File yang diunggah disimpan dalam folder `/OpenClawShared/` di pustaka dokumen default situs SharePoint yang dikonfigurasi.

## Polling (Adaptive Cards)

OpenClaw mengirim polling Teams sebagai Adaptive Cards (tidak ada API polling Teams native).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Suara dicatat oleh Gateway di SQLite status Plugin OpenClaw di bawah `state/openclaw.sqlite`.
- File `msteams-polls.json` yang sudah ada diimpor oleh `openclaw doctor --fix`, bukan oleh Plugin yang berjalan.
- Gateway harus tetap online untuk mencatat suara.
- Polling belum otomatis memposting ringkasan hasil, dan belum ada CLI hasil polling yang didukung.

## Kartu presentasi

Kirim payload presentasi semantik ke pengguna atau percakapan Teams menggunakan alat `message`, CLI, atau pengiriman balasan normal. OpenClaw merendernya sebagai Teams Adaptive Cards dari kontrak presentasi generik.

Parameter `presentation` menerima blok semantik. Ketika `presentation` disediakan, teks pesan bersifat opsional. Tombol dirender sebagai tindakan kirim Adaptive Card atau URL. Menu pilih belum native di renderer Teams, jadi OpenClaw menurunkannya menjadi teks yang dapat dibaca sebelum pengiriman.

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

Target MSTeams menggunakan prefiks untuk membedakan antara pengguna dan percakapan:

| Jenis target         | Format                           | Contoh                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Pengguna (berdasarkan ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Pengguna (berdasarkan nama)      | `user:<display-name>`            | `user:John Smith` (memerlukan Graph API)              |
| Grup/kanal       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/kanal (mentah) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (jika berisi `@thread`) |

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
Tanpa prefiks `user:`, nama default ke resolusi grup atau tim. Selalu gunakan `user:` saat menargetkan orang berdasarkan nama tampilan.
</Note>

## Pesan proaktif

- Pesan proaktif hanya mungkin **setelah** pengguna berinteraksi, karena kami menyimpan referensi percakapan pada titik itu.
- Lihat `/gateway/configuration` untuk `dmPolicy` dan gating allowlist.

## ID Tim dan Kanal (Jebakan Umum)

Parameter kueri `groupId` dalam URL Teams **BUKAN** ID tim yang digunakan untuk konfigurasi. Ekstrak ID dari path URL sebagai gantinya:

**URL tim:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL kanal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Untuk konfigurasi:**

- Kunci tim = segmen path setelah `/team/` (di-decode dari URL, misalnya, `19:Bk4j...@thread.tacv2`; tenant lama mungkin menampilkan `@thread.skype`, yang juga valid)
- Kunci kanal = segmen path setelah `/channel/` (di-decode dari URL)
- **Abaikan** parameter kueri `groupId` untuk perutean OpenClaw. Itu adalah ID grup Microsoft Entra, bukan ID percakapan Bot Framework yang digunakan dalam aktivitas Teams masuk.

## Kanal pribadi

Bot memiliki dukungan terbatas di kanal pribadi:

| Fitur                      | Kanal Standar | Kanal Pribadi       |
| ---------------------------- | ----------------- | ---------------------- |
| Instalasi bot             | Ya               | Terbatas                |
| Pesan real-time (Webhook) | Ya               | Mungkin tidak berfungsi           |
| Izin RSC              | Ya               | Mungkin berperilaku berbeda |
| @mention                    | Ya               | Jika bot dapat diakses   |
| Riwayat Graph API            | Ya               | Ya (dengan izin) |

**Solusi sementara jika kanal pribadi tidak berfungsi:**

1. Gunakan kanal standar untuk interaksi bot
2. Gunakan DM - pengguna selalu dapat mengirim pesan langsung ke bot
3. Gunakan Graph API untuk akses historis (memerlukan `ChannelMessage.Read.All`)

## Pemecahan masalah

### Masalah umum

- **Gambar tidak muncul di kanal:** Izin Graph atau persetujuan admin tidak ada. Instal ulang aplikasi Teams dan keluar sepenuhnya/buka ulang Teams.
- **Tidak ada respons di kanal:** mention diperlukan secara default; atur `channels.msteams.requireMention=false` atau konfigurasikan per tim/kanal.
- **Ketidakcocokan versi (Teams masih menampilkan manifes lama):** hapus + tambahkan ulang aplikasi dan keluar sepenuhnya dari Teams untuk menyegarkan.
- **401 Unauthorized dari Webhook:** Diharapkan saat menguji secara manual tanpa Azure JWT - berarti endpoint dapat dijangkau tetapi autentikasi gagal. Gunakan Azure Web Chat untuk menguji dengan benar.

### Kesalahan unggah manifes

- **"Icon file cannot be empty":** Manifes mereferensikan file ikon yang berukuran 0 byte. Buat ikon PNG yang valid (32x32 untuk `outline.png`, 192x192 untuk `color.png`).
- **"webApplicationInfo.Id already in use":** Aplikasi masih terinstal di tim/obrolan lain. Temukan dan hapus instalasinya terlebih dahulu, atau tunggu 5-10 menit untuk propagasi.
- **"Something went wrong" saat mengunggah:** Unggah melalui [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) sebagai gantinya, buka DevTools browser (F12) → tab Network, dan periksa isi respons untuk kesalahan sebenarnya.
- **Sideload gagal:** Coba "Upload an app to your org's app catalog" alih-alih "Upload a custom app" - ini sering melewati pembatasan sideload.

### Izin RSC tidak berfungsi

1. Verifikasi `webApplicationInfo.id` sama persis dengan App ID bot Anda
2. Unggah ulang aplikasi dan instal ulang di tim/chat
3. Periksa apakah admin organisasi Anda telah memblokir izin RSC
4. Konfirmasi bahwa Anda menggunakan cakupan yang tepat: `ChannelMessage.Read.Group` untuk tim, `ChatMessage.Read.Chat` untuk obrolan grup

## Referensi

- [Buat Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - panduan penyiapan Azure Bot
- [Portal Pengembang Teams](https://dev.teams.microsoft.com/apps) - buat/kelola aplikasi Teams
- [Skema manifes aplikasi Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Terima pesan channel dengan RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referensi izin RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Penanganan file bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (channel/grup memerlukan Graph)
- [Pesan proaktif](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams untuk pengelolaan bot

## Terkait

- [Ikhtisar Channel](/id/channels) - semua channel yang didukung
- [Penyandingan](/id/channels/pairing) - autentikasi DM dan alur penyandingan
- [Grup](/id/channels/groups) - perilaku obrolan grup dan pembatasan mention
- [Perutean Channel](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan hardening
