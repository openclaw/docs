---
read_when:
    - Mengerjakan fitur saluran Microsoft Teams
summary: Status dukungan bot Microsoft Teams, kemampuan, dan konfigurasi
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-10T19:22:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: f41c148e7ea0c2d0bde257d7af3ba0dc990f20110c08df3bb8c4d3f84e8563e0
    source_path: channels/msteams.md
    workflow: 16
---

Status: teks + lampiran DM didukung; pengiriman file channel/grup memerlukan `sharePointSiteId` + izin Graph (lihat [Mengirim file dalam obrolan grup](#sending-files-in-group-chats)). Poll dikirim melalui Adaptive Cards. Tindakan pesan mengekspos `upload-file` eksplisit untuk pengiriman yang mengutamakan file.

## Plugin bawaan

Microsoft Teams dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, sehingga tidak
diperlukan instalasi terpisah dalam build paket normal.

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Teams bawaan,
instal paket npm secara langsung:

```bash
openclaw plugins install @openclaw/msteams
```

Gunakan paket polos untuk mengikuti tag rilis resmi saat ini. Sematkan versi
persis hanya saat Anda memerlukan instalasi yang dapat direproduksi.

Checkout lokal (saat menjalankan dari repo git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detail: [Plugins](/id/tools/plugin)

## Penyiapan cepat

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) menangani pendaftaran bot, pembuatan manifes, dan pembuatan kredensial dalam satu perintah.

**1. Instal dan masuk**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI saat ini dalam pratinjau. Perintah dan flag dapat berubah antar rilis.
</Note>

**2. Mulai tunnel** (Teams tidak dapat menjangkau localhost)

Instal dan autentikasi devtunnel CLI jika Anda belum melakukannya ([panduan memulai](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

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
- Membuat rahasia klien
- Membangun dan mengunggah manifes aplikasi Teams (dengan ikon)
- Mendaftarkan bot (dikelola Teams secara default - tidak perlu langganan Azure)

Output akan menampilkan `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, dan **Teams App ID** - catat ini untuk langkah berikutnya. Output juga menawarkan untuk menginstal aplikasi di Teams secara langsung.

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

`teams app create` akan meminta Anda menginstal aplikasi - pilih "Instal di Teams". Jika Anda melewatinya, Anda dapat memperoleh tautannya nanti:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifikasi semuanya berfungsi**

```bash
teams app doctor <teamsAppId>
```

Ini menjalankan diagnostik pada pendaftaran bot, konfigurasi aplikasi AAD, validitas manifes, dan penyiapan SSO.

Untuk deployment produksi, pertimbangkan menggunakan [autentikasi federasi](/id/channels/msteams#federated-authentication-certificate-plus-managed-identity) (sertifikat atau identitas terkelola) alih-alih rahasia klien.

<Note>
Obrolan grup diblokir secara default (`channels.msteams.groupPolicy: "allowlist"`). Untuk mengizinkan balasan grup, tetapkan `channels.msteams.groupAllowFrom`, atau gunakan `groupPolicy: "open"` untuk mengizinkan anggota mana pun (dibatasi mention).
</Note>

## Tujuan

- Berbicara dengan OpenClaw melalui DM Teams, obrolan grup, atau channel.
- Menjaga perutean deterministik: balasan selalu kembali ke channel tempat pesan itu datang.
- Menggunakan perilaku channel aman secara default (mention diperlukan kecuali dikonfigurasi sebaliknya).

## Penulisan konfigurasi

Secara default, Microsoft Teams diizinkan untuk menulis pembaruan konfigurasi yang dipicu oleh `/config set|unset` (memerlukan `commands.config: true`).

Nonaktifkan dengan:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrol akses (DM + grup)

**Akses DM**

- Default: `channels.msteams.dmPolicy = "pairing"`. Pengirim tidak dikenal diabaikan sampai disetujui.
- `channels.msteams.allowFrom` harus menggunakan ID objek AAD yang stabil atau grup akses pengirim statis seperti `accessGroup:core-team`.
- Jangan mengandalkan pencocokan UPN/nama tampilan untuk allowlist - nilai tersebut dapat berubah. OpenClaw menonaktifkan pencocokan nama langsung secara default; ikut serta secara eksplisit dengan `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard dapat menyelesaikan nama menjadi ID melalui Microsoft Graph saat kredensial mengizinkan.

**Akses grup**

- Default: `channels.msteams.groupPolicy = "allowlist"` (diblokir kecuali Anda menambahkan `groupAllowFrom`). Gunakan `channels.defaults.groupPolicy` untuk menimpa default saat tidak ditetapkan.
- `channels.msteams.groupAllowFrom` mengontrol pengirim atau grup akses pengirim statis mana yang dapat memicu di obrolan grup/channel (fallback ke `channels.msteams.allowFrom`).
- Tetapkan `groupPolicy: "open"` untuk mengizinkan anggota mana pun (tetap dibatasi mention secara default).
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

**Allowlist Teams + channel**

- Cakup balasan grup/channel dengan mencantumkan tim dan channel di bawah `channels.msteams.teams`.
- Kunci harus menggunakan ID percakapan Teams yang stabil dari tautan Teams, bukan nama tampilan yang dapat berubah.
- Saat `groupPolicy="allowlist"` dan allowlist tim tersedia, hanya tim/channel yang tercantum yang diterima (dibatasi mention).
- Wizard konfigurasi menerima entri `Team/Channel` dan menyimpannya untuk Anda.
- Saat startup, OpenClaw menyelesaikan nama allowlist tim/channel dan pengguna menjadi ID (saat izin Graph mengizinkan)
  dan mencatat pemetaan; nama tim/channel yang belum terselesaikan dipertahankan seperti yang diketik tetapi diabaikan untuk perutean secara default kecuali `channels.msteams.dangerouslyAllowNameMatching: true` diaktifkan.

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

1. Pastikan Plugin Microsoft Teams tersedia (bawaan dalam rilis saat ini).
2. Buat **Azure Bot** (App ID + rahasia + tenant ID).
3. Buat **paket aplikasi Teams** yang mereferensikan bot dan menyertakan izin RSC di bawah.
4. Unggah/instal aplikasi Teams ke dalam tim (atau lingkup pribadi untuk DM).
5. Konfigurasi `msteams` di `~/.openclaw/openclaw.json` (atau env vars) dan mulai Gateway.
6. Gateway mendengarkan lalu lintas Webhook Bot Framework pada `/api/messages` secara default.

### Langkah 1: Buat Azure Bot

1. Buka [Buat Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Isi tab **Basics**:

   | Bidang             | Nilai                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nama bot Anda, misalnya, `openclaw-msteams` (harus unik) |
   | **Subscription**   | Pilih langganan Azure Anda                               |
   | **Resource group** | Buat baru atau gunakan yang sudah ada                    |
   | **Pricing tier**   | **Free** untuk dev/pengujian                             |
   | **Type of App**    | **Single Tenant** (direkomendasikan - lihat catatan di bawah) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Pembuatan bot multi-tenant baru dihentikan setelah 2025-07-31. Gunakan **Single Tenant** untuk bot baru.
</Warning>

3. Klik **Review + create** → **Create** (tunggu ~1-2 menit)

### Langkah 2: Dapatkan kredensial

1. Buka sumber daya Azure Bot Anda → **Configuration**
2. Salin **Microsoft App ID** → ini adalah `appId` Anda
3. Klik **Manage Password** → buka App Registration
4. Di bawah **Certificates & secrets** → **New client secret** → salin **Value** → ini adalah `appPassword` Anda
5. Buka **Overview** → salin **Directory (tenant) ID** → ini adalah `tenantId` Anda

### Langkah 3: Konfigurasi endpoint olah pesan

1. Di Azure Bot → **Configuration**
2. Tetapkan **Messaging endpoint** ke URL Webhook Anda:
   - Produksi: `https://your-domain.com/api/messages`
   - Dev lokal: Gunakan tunnel (lihat [Pengembangan Lokal](#local-development-tunneling) di bawah)

### Langkah 4: Aktifkan channel Teams

1. Di Azure Bot → **Channels**
2. Klik **Microsoft Teams** → Configure → Save
3. Terima Terms of Service

### Langkah 5: Buat manifes aplikasi Teams

- Sertakan entri `bot` dengan `botId = <App ID>`.
- Lingkup: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (diperlukan untuk penanganan file lingkup pribadi).
- Tambahkan izin RSC (lihat [Izin RSC](#current-teams-rsc-permissions-manifest)).
- Buat ikon: `outline.png` (32x32) dan `color.png` (192x192).
- Zip ketiga file bersama: `manifest.json`, `outline.png`, `color.png`.

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

Channel Teams dimulai secara otomatis saat Plugin tersedia dan konfigurasi `msteams` ada dengan kredensial.

</details>

## Autentikasi federasi (sertifikat plus identitas terkelola)

> Ditambahkan pada 2026.4.11

Untuk deployment produksi, OpenClaw mendukung **autentikasi federasi** sebagai alternatif yang lebih aman untuk rahasia klien. Dua metode tersedia:

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

Gunakan Azure Managed Identity untuk autentikasi tanpa kata sandi. Ini ideal untuk deployment pada infrastruktur Azure (AKS, App Service, Azure VMs) tempat identitas terkelola tersedia.

**Cara kerjanya:**

1. Pod/VM bot memiliki identitas terkelola (ditetapkan sistem atau ditetapkan pengguna).
2. **Kredensial identitas federasi** menautkan identitas terkelola ke pendaftaran aplikasi Entra ID.
3. Saat runtime, OpenClaw menggunakan `@azure/identity` untuk memperoleh token dari endpoint Azure IMDS (`169.254.169.254`).
4. Token diteruskan ke Teams SDK untuk autentikasi bot.

**Prasyarat:**

- Infrastruktur Azure dengan identitas terkelola diaktifkan (identitas workload AKS, App Service, VM)
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

### Penyiapan Identitas Workload AKS

Untuk deployment AKS yang menggunakan identitas workload:

1. **Aktifkan identitas workload** pada kluster AKS Anda.
2. **Buat kredensial identitas terfederasi** pada pendaftaran aplikasi Entra ID:

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

4. **Beri label pada pod** untuk injeksi identitas workload:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Pastikan akses jaringan** ke IMDS (`169.254.169.254`) - jika menggunakan NetworkPolicy, tambahkan aturan egress yang mengizinkan lalu lintas ke `169.254.169.254/32` pada port 80.

### Perbandingan jenis autentikasi

| Metode | Konfigurasi | Kelebihan | Kekurangan |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Rahasia klien** | `appPassword` | Penyiapan sederhana | Rotasi rahasia diperlukan, kurang aman |
| **Sertifikat** | `authType: "federated"` + `certificatePath` | Tidak ada rahasia bersama melalui jaringan | Beban pengelolaan sertifikat |
| **Identitas Terkelola** | `authType: "federated"` + `useManagedIdentity` | Tanpa kata sandi, tidak ada rahasia yang perlu dikelola | Infrastruktur Azure diperlukan |

**Perilaku default:** Saat `authType` tidak ditetapkan, OpenClaw menggunakan autentikasi rahasia klien secara default. Konfigurasi yang sudah ada tetap berfungsi tanpa perubahan.

## Pengembangan lokal (tunneling)

Teams tidak dapat menjangkau `localhost`. Gunakan tunnel dev persisten agar URL Anda tetap sama di seluruh sesi:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
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

Memeriksa pendaftaran bot, aplikasi AAD, manifes, dan konfigurasi SSO dalam satu proses.

**Kirim pesan uji:**

1. Instal aplikasi Teams (gunakan tautan instal dari `teams app get <id> --install-link`)
2. Temukan bot di Teams dan kirim DM
3. Periksa log Gateway untuk aktivitas masuk

## Variabel lingkungan

Semua kunci konfigurasi juga dapat ditetapkan melalui variabel lingkungan:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (opsional: `"secret"` atau `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (terfederasi + sertifikat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opsional, tidak diperlukan untuk autentikasi)
- `MSTEAMS_USE_MANAGED_IDENTITY` (terfederasi + identitas terkelola)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (khusus MI yang ditetapkan pengguna)

## Aksi info anggota

OpenClaw mengekspos aksi `member-info` yang didukung Graph untuk Microsoft Teams agar agen dan automasi dapat menyelesaikan detail anggota kanal (nama tampilan, email, peran) langsung dari Microsoft Graph.

Persyaratan:

- Izin RSC `Member.Read.Group` (sudah ada dalam manifes yang direkomendasikan)
- Untuk pencarian lintas tim: izin Aplikasi Graph `User.Read.All` dengan persetujuan admin

Aksi ini dibatasi oleh `channels.msteams.actions.memberInfo` (default: aktif saat kredensial Graph tersedia).

## Konteks riwayat

- `channels.msteams.historyLimit` mengontrol berapa banyak pesan kanal/grup terbaru yang dibungkus ke dalam prompt.
- Jatuh balik ke `messages.groupChat.historyLimit`. Tetapkan `0` untuk menonaktifkan (default 50).
- Riwayat thread yang diambil difilter berdasarkan allowlist pengirim (`allowFrom` / `groupAllowFrom`), sehingga penyemaian konteks thread hanya menyertakan pesan dari pengirim yang diizinkan.
- Konteks lampiran yang dikutip (`ReplyTo*` yang diturunkan dari HTML balasan Teams) saat ini diteruskan sebagaimana diterima.
- Dengan kata lain, allowlist membatasi siapa yang dapat memicu agen; hanya jalur konteks tambahan tertentu yang difilter saat ini.
- Riwayat DM dapat dibatasi dengan `channels.msteams.dmHistoryLimit` (giliran pengguna). Override per pengguna: `channels.msteams.dms["<user_id>"].historyLimit`.

## Izin RSC Teams saat ini (manifes)

Berikut adalah **izin resourceSpecific yang sudah ada** dalam manifes aplikasi Teams kami. Izin ini hanya berlaku di dalam tim/chat tempat aplikasi diinstal.

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

## Contoh manifes Teams (disunting)

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

### Catatan manifes (kolom wajib)

- `bots[].botId` **harus** cocok dengan ID Aplikasi Azure Bot.
- `webApplicationInfo.id` **harus** cocok dengan ID Aplikasi Azure Bot.
- `bots[].scopes` harus menyertakan permukaan yang akan Anda gunakan (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` diperlukan untuk penanganan file dalam cakupan personal.
- `authorization.permissions.resourceSpecific` harus menyertakan baca/kirim kanal jika Anda menginginkan lalu lintas kanal.

### Memperbarui aplikasi yang sudah ada

Untuk memperbarui aplikasi Teams yang sudah diinstal (misalnya, untuk menambahkan izin RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Setelah memperbarui, instal ulang aplikasi di setiap tim agar izin baru berlaku, dan **keluar sepenuhnya lalu jalankan ulang Teams** (bukan hanya menutup jendela) untuk membersihkan metadata aplikasi yang di-cache.

<details>
<summary>Pembaruan manifes manual (tanpa CLI)</summary>

1. Perbarui `manifest.json` Anda dengan pengaturan baru
2. **Naikkan kolom `version`** (misalnya, `1.0.0` → `1.1.0`)
3. **Zip ulang** manifes dengan ikon (`manifest.json`, `outline.png`, `color.png`)
4. Unggah zip baru:
   - **Teams Admin Center:** Aplikasi Teams → Kelola aplikasi → temukan aplikasi Anda → Unggah versi baru
   - **Sideload:** Di Teams → Aplikasi → Kelola aplikasi Anda → Unggah aplikasi kustom

</details>

## Kemampuan: hanya RSC vs Graph

### Dengan **hanya Teams RSC** (aplikasi terinstal, tanpa izin Graph API)

Berfungsi:

- Membaca konten **teks** pesan kanal.
- Mengirim konten **teks** pesan kanal.
- Menerima lampiran file **personal (DM)**.

Tidak berfungsi:

- **Konten gambar atau file** kanal/grup (payload hanya menyertakan stub HTML).
- Mengunduh lampiran yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan (di luar peristiwa Webhook langsung).

### Dengan **Teams RSC + izin Aplikasi Microsoft Graph**

Menambahkan:

- Mengunduh konten yang di-host (gambar yang ditempelkan ke pesan).
- Mengunduh lampiran file yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan kanal/chat melalui Graph.

### RSC vs Graph API

| Kemampuan | Izin RSC | Graph API |
| ----------------------- | -------------------- | ----------------------------------- |
| **Pesan waktu nyata** | Ya (melalui Webhook) | Tidak (hanya polling) |
| **Pesan historis** | Tidak | Ya (dapat mengueri riwayat) |
| **Kompleksitas penyiapan** | Hanya manifes aplikasi | Memerlukan persetujuan admin + alur token |
| **Berfungsi offline** | Tidak (harus berjalan) | Ya (kueri kapan saja) |

**Intinya:** RSC untuk mendengarkan secara waktu nyata; Graph API untuk akses historis. Untuk mengejar pesan yang terlewat saat offline, Anda memerlukan Graph API dengan `ChannelMessage.Read.All` (memerlukan persetujuan admin).

## Media + riwayat yang diaktifkan Graph (diperlukan untuk kanal)

Jika Anda memerlukan gambar/file di **kanal** atau ingin mengambil **riwayat pesan**, Anda harus mengaktifkan izin Microsoft Graph dan memberikan persetujuan admin.

1. Di **Pendaftaran Aplikasi** Entra ID (Azure AD), tambahkan **izin Aplikasi** Microsoft Graph:
   - `ChannelMessage.Read.All` (lampiran kanal + riwayat)
   - `Chat.Read.All` atau `ChatMessage.Read.All` (chat grup)
2. **Berikan persetujuan admin** untuk penyewa.
3. Naikkan **versi manifes** aplikasi Teams, unggah ulang, dan **instal ulang aplikasi di Teams**.
4. **Keluar sepenuhnya lalu jalankan ulang Teams** untuk membersihkan metadata aplikasi yang di-cache.

**Izin tambahan untuk mention pengguna:** @mention pengguna berfungsi langsung untuk pengguna dalam percakapan. Namun, jika Anda ingin mencari dan menyebut pengguna secara dinamis yang **tidak berada dalam percakapan saat ini**, tambahkan izin `User.Read.All` (Application) dan berikan persetujuan admin.

## Keterbatasan yang diketahui

### Timeout Webhook

Teams mengirimkan pesan melalui Webhook HTTP. Jika pemrosesan terlalu lama (misalnya, respons LLM lambat), Anda mungkin melihat:

- Timeout Gateway
- Teams mencoba ulang pesan (menyebabkan duplikat)
- Balasan yang terlewat

OpenClaw menangani ini dengan kembali cepat dan mengirim balasan secara proaktif, tetapi respons yang sangat lambat masih dapat menyebabkan masalah.

### Pemformatan

Markdown Teams lebih terbatas dibandingkan Slack atau Discord:

- Pemformatan dasar berfungsi: **tebal**, _miring_, `code`, tautan
- Markdown kompleks (tabel, daftar bersarang) mungkin tidak dirender dengan benar
- Adaptive Cards didukung untuk polling dan pengiriman presentasi semantik (lihat di bawah)

## Konfigurasi

Pengaturan utama (lihat `/gateway/configuration` untuk pola kanal bersama):

- `channels.msteams.enabled`: aktifkan/nonaktifkan kanal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: kredensial bot.
- `channels.msteams.webhook.port` (default `3978`)
- `channels.msteams.webhook.path` (default `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing)
- `channels.msteams.allowFrom`: allowlist DM (ID objek AAD direkomendasikan). Wizard menyelesaikan nama menjadi ID selama penyiapan saat akses Graph tersedia.
- `channels.msteams.dangerouslyAllowNameMatching`: toggle darurat untuk mengaktifkan kembali pencocokan UPN/nama tampilan yang dapat berubah dan perutean langsung nama tim/kanal.
- `channels.msteams.textChunkLimit`: ukuran potongan teks keluar.
- `channels.msteams.chunkMode`: `length` (default) atau `newline` untuk memecah pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.msteams.mediaAllowHosts`: allowlist untuk host lampiran masuk (default ke domain Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist untuk melampirkan header Authorization pada percobaan ulang media (default ke host Graph + Bot Framework).
- `channels.msteams.requireMention`: wajibkan @mention di kanal/grup (default true).
- `channels.msteams.replyStyle`: `thread | top-level` (lihat [Gaya Balasan](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: penggantian per tim.
- `channels.msteams.teams.<teamId>.requireMention`: penggantian per tim.
- `channels.msteams.teams.<teamId>.tools`: penggantian kebijakan alat default per tim (`allow`/`deny`/`alsoAllow`) yang digunakan saat penggantian kanal tidak ada.
- `channels.msteams.teams.<teamId>.toolsBySender`: penggantian kebijakan alat default per tim per pengirim (wildcard `"*"` didukung).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: penggantian per kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: penggantian per kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: penggantian kebijakan alat per kanal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: penggantian kebijakan alat per kanal per pengirim (wildcard `"*"` didukung).
- Kunci `toolsBySender` harus menggunakan prefiks eksplisit:
  `id:`, `e164:`, `username:`, `name:` (kunci lama tanpa prefiks masih dipetakan hanya ke `id:`).
- `channels.msteams.actions.memberInfo`: aktifkan atau nonaktifkan aksi info anggota yang didukung Graph (default: aktif saat kredensial Graph tersedia).
- `channels.msteams.authType`: jenis autentikasi - `"secret"` (default) atau `"federated"`.
- `channels.msteams.certificatePath`: jalur ke file sertifikat PEM (autentikasi federated + sertifikat).
- `channels.msteams.certificateThumbprint`: thumbprint sertifikat (opsional, tidak diperlukan untuk autentikasi).
- `channels.msteams.useManagedIdentity`: aktifkan autentikasi managed identity (mode federated).
- `channels.msteams.managedIdentityClientId`: ID klien untuk managed identity yang ditetapkan pengguna.
- `channels.msteams.sharePointSiteId`: ID situs SharePoint untuk unggahan file di obrolan grup/kanal (lihat [Mengirim file di obrolan grup](#sending-files-in-group-chats)).

## Perutean dan sesi

- Kunci sesi mengikuti format agen standar (lihat [/concepts/session](/id/concepts/session)):
  - Pesan langsung berbagi sesi utama (`agent:<agentId>:<mainKey>`).
  - Pesan kanal/grup menggunakan ID percakapan:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Gaya balasan: thread vs postingan

Teams baru-baru ini memperkenalkan dua gaya UI kanal di atas model data dasar yang sama:

| Gaya                     | Deskripsi                                                 | `replyStyle` yang direkomendasikan |
| ------------------------ | --------------------------------------------------------- | ---------------------------------- |
| **Posts** (klasik)       | Pesan muncul sebagai kartu dengan balasan ber-thread di bawahnya | `thread` (default)                 |
| **Threads** (mirip Slack) | Pesan mengalir secara linear, lebih mirip Slack          | `top-level`                        |

**Masalahnya:** API Teams tidak mengekspos gaya UI yang digunakan sebuah kanal. Jika Anda menggunakan `replyStyle` yang salah:

- `thread` di kanal bergaya Threads → balasan muncul tersarang dengan canggung
- `top-level` di kanal bergaya Posts → balasan muncul sebagai postingan tingkat atas terpisah, bukan di dalam thread

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

Saat bot mengirim balasan ke kanal, `replyStyle` diselesaikan dari penggantian yang paling spesifik turun ke default. Nilai non-`undefined` pertama yang menang:

1. **Per kanal** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Per tim** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** — `channels.msteams.replyStyle`
4. **Default implisit** — diturunkan dari `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Jika Anda menetapkan `requireMention: false` secara global tanpa `replyStyle` eksplisit, mention di kanal bergaya Posts akan muncul sebagai postingan tingkat atas bahkan saat pesan masuk adalah balasan thread. Tetapkan `replyStyle: "thread"` pada tingkat global, tim, atau kanal untuk menghindari kejutan.

### Pelestarian konteks thread

Saat `replyStyle: "thread"` berlaku dan bot di-@mention dari dalam thread kanal, OpenClaw melampirkan kembali akar thread asli ke referensi percakapan keluar (`19:…@thread.tacv2;messageid=<root>`) sehingga balasan masuk ke thread yang sama. Ini berlaku untuk pengiriman live (dalam giliran) maupun pengiriman proaktif yang dibuat setelah konteks giliran Bot Framework kedaluwarsa (misalnya, agen yang berjalan lama, balasan tool-call yang diantrekan melalui `mcp__openclaw__message`).

Akar thread diambil dari `threadId` yang tersimpan pada referensi percakapan. Referensi tersimpan yang lebih lama sebelum `threadId` menggunakan fallback ke `activityId` (aktivitas masuk apa pun yang terakhir menyemai percakapan), sehingga deployment yang sudah ada tetap berfungsi tanpa penyemaian ulang.

Saat `replyStyle: "top-level"` berlaku, pesan masuk thread-kanal secara sengaja dijawab sebagai postingan tingkat atas baru — tidak ada sufiks thread yang dilampirkan. Ini adalah perilaku yang benar untuk kanal bergaya Threads; jika Anda melihat postingan tingkat atas padahal mengharapkan balasan ber-thread, `replyStyle` Anda salah diatur untuk kanal tersebut.

## Lampiran dan gambar

**Batasan saat ini:**

- **DM:** Gambar dan lampiran file berfungsi melalui API file bot Teams.
- **Kanal/grup:** Lampiran berada di penyimpanan M365 (SharePoint/OneDrive). Payload Webhook hanya menyertakan stub HTML, bukan byte file aktual. **Izin Graph API diperlukan** untuk mengunduh lampiran kanal.
- Untuk pengiriman eksplisit yang mengutamakan file, gunakan `action=upload-file` dengan `media` / `filePath` / `path`; `message` opsional menjadi teks/komentar pendamping, dan `filename` mengganti nama unggahan.

Tanpa izin Graph, pesan kanal dengan gambar akan diterima hanya sebagai teks (konten gambar tidak dapat diakses oleh bot).
Secara default, OpenClaw hanya mengunduh media dari hostname Microsoft/Teams. Ganti dengan `channels.msteams.mediaAllowHosts` (gunakan `["*"]` untuk mengizinkan host apa pun).
Header Authorization hanya dilampirkan untuk host dalam `channels.msteams.mediaAuthAllowHosts` (default ke host Graph + Bot Framework). Jaga daftar ini tetap ketat (hindari sufiks multi-tenant).

## Mengirim file di obrolan grup

Bot dapat mengirim file di DM menggunakan alur FileConsentCard (bawaan). Namun, **mengirim file di obrolan grup/kanal** memerlukan penyiapan tambahan:

| Konteks                  | Cara file dikirim                              | Penyiapan yang diperlukan                         |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------- |
| **DM**                   | FileConsentCard → pengguna menerima → bot mengunggah | Berfungsi langsung tanpa konfigurasi tambahan     |
| **Obrolan grup/kanal**   | Unggah ke SharePoint → bagikan tautan          | Memerlukan `sharePointSiteId` + izin Graph        |
| **Gambar (konteks apa pun)** | Inline berkode Base64                      | Berfungsi langsung tanpa konfigurasi tambahan     |

### Mengapa obrolan grup memerlukan SharePoint

Bot tidak memiliki drive OneDrive pribadi (endpoint Graph API `/me/drive` tidak berfungsi untuk identitas aplikasi). Untuk mengirim file di obrolan grup/kanal, bot mengunggah ke **situs SharePoint** dan membuat tautan berbagi.

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
| Hanya `Sites.ReadWrite.All`             | Tautan berbagi seluruh organisasi (siapa pun dalam organisasi dapat mengakses) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Tautan berbagi per pengguna (hanya anggota obrolan yang dapat mengakses) |

Berbagi per pengguna lebih aman karena hanya peserta obrolan yang dapat mengakses file. Jika izin `Chat.Read.All` tidak ada, bot menggunakan fallback ke berbagi seluruh organisasi.

### Perilaku fallback

| Skenario                                          | Hasil                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| Obrolan grup + file + `sharePointSiteId` dikonfigurasi | Unggah ke SharePoint, kirim tautan berbagi     |
| Obrolan grup + file + tanpa `sharePointSiteId`    | Coba unggah OneDrive (mungkin gagal), kirim teks saja |
| Obrolan pribadi + file                            | Alur FileConsentCard (berfungsi tanpa SharePoint) |
| Konteks apa pun + gambar                          | Inline berkode Base64 (berfungsi tanpa SharePoint) |

### Lokasi file tersimpan

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
| Pengguna (berdasarkan ID) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Pengguna (berdasarkan nama) | `user:<display-name>`            | `user:John Smith` (memerlukan Graph API)            |
| Grup/saluran        | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/saluran (mentah) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (jika berisi `@thread`) |

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

## Pengiriman pesan proaktif

- Pesan proaktif hanya dapat dilakukan **setelah** pengguna berinteraksi, karena kami menyimpan referensi percakapan pada saat itu.
- Lihat `/gateway/configuration` untuk `dmPolicy` dan pembatasan allowlist.

## ID Tim dan Saluran (Kesalahan Umum)

Parameter kueri `groupId` dalam URL Teams **BUKAN** ID tim yang digunakan untuk konfigurasi. Ekstrak ID dari path URL sebagai gantinya:

**URL tim:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL saluran:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Untuk konfigurasi:**

- Kunci tim = segmen path setelah `/team/` (di-decode dari URL, misalnya, `19:Bk4j...@thread.tacv2`; tenant lama mungkin menampilkan `@thread.skype`, yang juga valid)
- Kunci saluran = segmen path setelah `/channel/` (di-decode dari URL)
- **Abaikan** parameter kueri `groupId` untuk perutean OpenClaw. Itu adalah ID grup Microsoft Entra, bukan ID percakapan Bot Framework yang digunakan dalam aktivitas Teams masuk.

## Saluran privat

Bot memiliki dukungan terbatas di saluran privat:

| Fitur                        | Saluran Standar | Saluran Privat        |
| ---------------------------- | --------------- | --------------------- |
| Instalasi bot                | Ya              | Terbatas              |
| Pesan waktu nyata (Webhook)  | Ya              | Mungkin tidak berfungsi |
| Izin RSC                     | Ya              | Dapat berperilaku berbeda |
| @mention                     | Ya              | Jika bot dapat diakses |
| Riwayat Graph API            | Ya              | Ya (dengan izin)      |

**Solusi sementara jika saluran privat tidak berfungsi:**

1. Gunakan saluran standar untuk interaksi bot
2. Gunakan DM - pengguna selalu dapat mengirim pesan langsung ke bot
3. Gunakan Graph API untuk akses historis (memerlukan `ChannelMessage.Read.All`)

## Pemecahan masalah

### Masalah umum

- **Gambar tidak muncul di saluran:** Izin Graph atau persetujuan admin tidak ada. Instal ulang aplikasi Teams dan tutup sepenuhnya/buka kembali Teams.
- **Tidak ada respons di saluran:** mention diwajibkan secara default; atur `channels.msteams.requireMention=false` atau konfigurasikan per tim/saluran.
- **Ketidakcocokan versi (Teams masih menampilkan manifest lama):** hapus + tambahkan kembali aplikasi dan tutup Teams sepenuhnya untuk menyegarkan.
- **401 Unauthorized dari Webhook:** Diharapkan saat menguji secara manual tanpa Azure JWT - berarti endpoint dapat dijangkau tetapi autentikasi gagal. Gunakan Azure Web Chat untuk menguji dengan benar.

### Kesalahan unggah manifest

- **"Icon file cannot be empty":** Manifest mereferensikan file ikon yang berukuran 0 byte. Buat ikon PNG yang valid (32x32 untuk `outline.png`, 192x192 untuk `color.png`).
- **"webApplicationInfo.Id already in use":** Aplikasi masih terpasang di tim/chat lain. Temukan dan hapus instalasinya terlebih dahulu, atau tunggu 5-10 menit untuk propagasi.
- **"Something went wrong" saat mengunggah:** Unggah melalui [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) sebagai gantinya, buka DevTools browser (F12) → tab Network, dan periksa isi respons untuk kesalahan sebenarnya.
- **Sideload gagal:** Coba "Upload an app to your org's app catalog" alih-alih "Upload a custom app" - ini sering melewati pembatasan sideload.

### Izin RSC tidak berfungsi

1. Verifikasi `webApplicationInfo.id` sama persis dengan App ID bot Anda
2. Unggah ulang aplikasi dan instal ulang di tim/chat
3. Periksa apakah admin organisasi Anda memblokir izin RSC
4. Konfirmasikan bahwa Anda menggunakan cakupan yang tepat: `ChannelMessage.Read.Group` untuk tim, `ChatMessage.Read.Chat` untuk chat grup

## Referensi

- [Buat Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - panduan penyiapan Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - buat/kelola aplikasi Teams
- [Skema manifest aplikasi Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Terima pesan saluran dengan RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referensi izin RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Penanganan file bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (saluran/grup memerlukan Graph)
- [Pengiriman pesan proaktif](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams untuk manajemen bot

## Terkait

- [Ikhtisar Saluran](/id/channels) - semua saluran yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku chat grup dan pembatasan mention
- [Perutean Saluran](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan pengerasan
