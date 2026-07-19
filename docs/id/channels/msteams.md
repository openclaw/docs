---
read_when:
    - Mengerjakan fitur saluran Microsoft Teams
summary: Status dukungan, kemampuan, dan konfigurasi bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-19T04:44:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a4cf686da27e28b58f7afaad8cc837dbddb93219cde0c37285f9f6895f6fb8c
    source_path: channels/msteams.md
    workflow: 16
---

Status: lampiran teks + DM didukung; pengiriman file kanal/grup memerlukan `sharePointSiteId` + izin Graph (lihat [Mengirim file dalam obrolan grup](#sending-files-in-group-chats)). Polling dikirim melalui Adaptive Cards. Tindakan pesan menyediakan `upload-file` eksplisit untuk pengiriman yang mengutamakan file.

## Plugin bawaan

Microsoft Teams disertakan sebagai plugin bawaan dalam rilis OpenClaw saat ini; instalasi terpisah tidak diperlukan dalam build paket normal.

Pada build lama atau instalasi khusus yang tidak menyertakan Teams bawaan, instal paket npm secara langsung:

```bash
openclaw plugins install @openclaw/msteams
```

Gunakan paket tanpa versi untuk mengikuti tag rilis resmi saat ini. Sematkan versi persis hanya jika Anda memerlukan instalasi yang dapat direproduksi.

Checkout lokal (dijalankan dari repositori git):

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
teams status   # verifikasi bahwa Anda sudah masuk dan lihat info tenant Anda
```

<Note>
CLI Teams saat ini masih dalam tahap pratinjau. Perintah dan flag dapat berubah antar-rilis.
</Note>

**2. Mulai tunnel** (Teams tidak dapat menjangkau localhost)

Instal dan autentikasi CLI devtunnel jika diperlukan ([panduan memulai](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Penyiapan satu kali (URL persisten antar-sesi):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Setiap sesi pengembangan:
devtunnel host my-openclaw-bot
# Endpoint Anda: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` diperlukan karena Teams tidak dapat melakukan autentikasi dengan devtunnels. Setiap permintaan bot yang masuk tetap divalidasi oleh SDK Teams.
</Note>

Alternatif: `ngrok http 3978` atau `tailscale funnel 3978` (URL dapat berubah setiap sesi).

**3. Buat aplikasi**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Ini membuat aplikasi Entra ID (Azure AD), menghasilkan rahasia klien, membangun dan mengunggah manifes aplikasi Teams (dengan ikon), serta mendaftarkan bot yang dikelola Teams (tidak memerlukan langganan Azure). Output mencakup `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, dan **ID Aplikasi Teams**; output tersebut juga menawarkan untuk menginstal aplikasi langsung di Teams.

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

`teams app create` meminta Anda menginstal aplikasi; pilih "Install in Teams". Untuk mendapatkan tautan instalasi nanti:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifikasi semuanya berfungsi**

```bash
teams app doctor <teamsAppId>
```

Menjalankan diagnostik pada pendaftaran bot, konfigurasi aplikasi AAD, validitas manifes, dan penyiapan SSO.

Untuk produksi, pertimbangkan [autentikasi terfederasi](#federated-authentication-certificate-plus-managed-identity) (sertifikat atau identitas terkelola) sebagai pengganti rahasia klien.

<Note>
Obrolan grup diblokir secara default (`channels.msteams.groupPolicy: "allowlist"`). Untuk mengizinkan balasan grup, atur `channels.msteams.groupAllowFrom`, atau gunakan `groupPolicy: "open"` untuk mengizinkan anggota mana pun (tetap memerlukan penyebutan).
</Note>

## Tujuan

- Berkomunikasi dengan OpenClaw melalui DM, obrolan grup, atau kanal Teams.
- Menjaga perutean tetap deterministik: balasan selalu kembali ke kanal asalnya.
- Menggunakan perilaku kanal yang aman secara default (penyebutan diwajibkan kecuali dikonfigurasi lain).

## Penulisan konfigurasi

Secara default, Microsoft Teams dapat menulis pembaruan konfigurasi yang dipicu oleh `/config set|unset` (memerlukan `commands.config: true`).

Nonaktifkan dengan:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Kontrol akses (DM + grup)

**Akses DM**

- Default: `channels.msteams.dmPolicy = "pairing"`. Pengirim yang tidak dikenal diabaikan hingga disetujui.
- `channels.msteams.allowFrom` harus menggunakan ID objek AAD yang stabil atau grup akses pengirim statis seperti `accessGroup:core-team`.
- Jangan mengandalkan pencocokan UPN/nama tampilan untuk daftar izin; nilai tersebut dapat berubah. OpenClaw menonaktifkan pencocokan nama langsung secara default; aktifkan dengan `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard dapat mengubah nama menjadi ID melalui Microsoft Graph jika kredensial mengizinkannya.

**Akses grup**

- Default: `channels.msteams.groupPolicy = "allowlist"` (diblokir kecuali Anda menambahkan `groupAllowFrom`). `channels.defaults.groupPolicy` dapat menggantikan default bersama saat `channels.msteams.groupPolicy` tidak diatur.
- `channels.msteams.groupAllowFrom` mengontrol pengirim atau grup akses pengirim statis mana yang dapat memicu respons dalam obrolan grup/kanal (menggunakan `channels.msteams.allowFrom` sebagai cadangan).
- Atur `groupPolicy: "open"` untuk mengizinkan anggota mana pun (secara default tetap memerlukan penyebutan).
- Untuk memblokir **semua** kanal, atur `channels.msteams.groupPolicy: "disabled"`.

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

**Daftar izin tim + kanal**

- Batasi balasan grup/kanal dengan mencantumkan tim dan kanal di bawah `channels.msteams.teams`.
- Gunakan ID percakapan Teams yang stabil dari tautan Teams sebagai kunci, bukan nama tampilan yang dapat berubah (lihat [ID Tim dan Kanal](#team-and-channel-ids-common-gotcha)).
- Jika `groupPolicy="allowlist"` dan daftar izin tim tersedia, hanya tim/kanal yang tercantum yang diterima (memerlukan penyebutan).
- Wizard konfigurasi menerima entri `Team/Channel` dan menyimpannya untuk Anda.
- Saat dimulai, OpenClaw mengubah nama tim/kanal dan nama daftar izin pengguna menjadi ID (jika izin Graph memungkinkan) dan mencatat pemetaannya. Nama yang tidak dapat ditemukan tetap disimpan sebagaimana diketik, tetapi diabaikan untuk perutean kecuali `channels.msteams.dangerouslyAllowNameMatching: true` diatur.

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
<summary><strong>Penyiapan manual (tanpa CLI Teams)</strong></summary>

### Cara kerjanya

1. Pastikan plugin Microsoft Teams tersedia (bawaan dalam rilis saat ini).
2. Buat **Azure Bot** (ID Aplikasi + rahasia + ID tenant).
3. Buat **paket aplikasi Teams** yang merujuk ke bot, termasuk izin RSC di bawah ini.
4. Unggah/instal aplikasi Teams ke dalam tim (atau cakupan pribadi untuk DM).
5. Konfigurasikan `msteams` dalam `~/.openclaw/openclaw.json` (atau variabel lingkungan) dan mulai gateway.
6. Gateway secara default mendengarkan lalu lintas Webhook Bot Framework pada `/api/messages`.

### Langkah 1: Buat Azure Bot

1. Buka [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Isi tab **Basics**:

   | Bidang             | Nilai                                                      |
   | ------------------ | ---------------------------------------------------------- |
   | **Bot handle**     | Nama bot Anda, misalnya `openclaw-msteams` (harus unik)    |
   | **Subscription**   | Pilih langganan Azure Anda                                 |
   | **Resource group** | Buat baru atau gunakan yang sudah ada                      |
   | **Pricing tier**   | **Free** untuk pengembangan/pengujian                      |
   | **Type of App**    | **Single Tenant** (disarankan; lihat catatan di bawah)      |
   | **Creation type**  | **Create new Microsoft App ID**                            |

<Warning>
Pembuatan bot multi-tenant baru tidak lagi didukung setelah 2025-07-31. Gunakan **Single Tenant** untuk bot baru.
</Warning>

3. Klik **Review + create**, lalu **Create** (~1-2 menit).

### Langkah 2: Dapatkan kredensial

1. Sumber daya Azure Bot → **Configuration** → salin **Microsoft App ID** (`appId` Anda).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → salin **Value** (`appPassword` Anda).
3. **Overview** → salin **Directory (tenant) ID** (`tenantId` Anda).

### Langkah 3: Konfigurasikan endpoint olahpesan

1. Azure Bot → **Configuration**.
2. Atur **Messaging endpoint**:
   - Produksi: `https://your-domain.com/api/messages`
   - Pengembangan lokal: gunakan tunnel (lihat [Pengembangan lokal](#local-development-tunneling))

### Langkah 4: Aktifkan kanal Teams

1. Azure Bot → **Channels**.
2. Klik **Microsoft Teams** → Configure → Save.
3. Terima Terms of Service.

### Langkah 5: Buat manifes aplikasi Teams

- Sertakan entri `bot` dengan `botId = <App ID>`.
- Cakupan: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (diperlukan untuk penanganan file dalam cakupan pribadi).
- Tambahkan izin RSC (lihat [Izin RSC](#current-teams-rsc-permissions-manifest)).
- Buat ikon: `outline.png` (32x32) dan `color.png` (192x192).
- Zip `manifest.json`, `outline.png`, dan `color.png` bersama-sama.

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

### Langkah 7: Jalankan gateway

Kanal Teams dimulai secara otomatis saat plugin tersedia dan konfigurasi `msteams` memiliki kredensial.

</details>

## Autentikasi terfederasi (sertifikat ditambah identitas terkelola)

Untuk produksi, OpenClaw mendukung **autentikasi terfederasi** sebagai alternatif rahasia klien melalui `channels.msteams.authType: "federated"`. Tersedia dua metode:

### Opsi A: Autentikasi berbasis sertifikat

Gunakan sertifikat PEM yang terdaftar pada pendaftaran aplikasi Entra ID Anda.

**Penyiapan:**

1. Buat atau dapatkan sertifikat (format PEM dengan kunci privat).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → unggah sertifikat publik.

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

**Variabel lingkungan:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opsi B: Azure Managed Identity

Gunakan Azure Managed Identity untuk autentikasi tanpa kata sandi pada infrastruktur Azure (AKS, App Service, Azure VM).

**Cara kerjanya:**

1. Pod/VM bot memiliki identitas terkelola (ditetapkan sistem atau ditetapkan pengguna).
2. Kredensial identitas terfederasi menautkan identitas terkelola ke pendaftaran aplikasi Entra ID.
3. Saat runtime, OpenClaw menggunakan `@azure/identity` untuk memperoleh token dari endpoint Azure IMDS.
4. Token diteruskan ke SDK Teams untuk autentikasi bot.

**Prasyarat:**

- Infrastruktur Azure dengan identitas terkelola yang diaktifkan (identitas beban kerja AKS, App Service, VM).
- Kredensial identitas terfederasi dibuat pada pendaftaran aplikasi Entra ID.
- Akses jaringan ke IMDS (`169.254.169.254:80`) dari pod/VM.

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

**Konfigurasi (identitas terkelola yang ditetapkan pengguna):** tambahkan `managedIdentityClientId: "<MI_CLIENT_ID>"` ke blok di atas.

**Variabel lingkungan:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (hanya yang ditetapkan pengguna)

### Penyiapan Identitas Beban Kerja AKS

Untuk deployment AKS yang menggunakan identitas beban kerja:

1. **Aktifkan identitas beban kerja** pada klaster AKS Anda.
2. **Buat kredensial identitas terfederasi** pada pendaftaran aplikasi Entra ID:

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

5. **Izinkan akses jaringan** ke IMDS (`169.254.169.254`): jika menggunakan NetworkPolicy, tambahkan aturan keluar untuk `169.254.169.254/32` pada port 80.

### Perbandingan jenis autentikasi

| Metode                  | Konfigurasi                                    | Kelebihan                              | Kekurangan                                         |
| ----------------------- | ---------------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| **Rahasia klien**       | `appPassword`                             | Penyiapan sederhana                    | Rotasi rahasia diperlukan, kurang aman             |
| **Sertifikat**          | `authType: "federated"` + `certificatePath`       | Tidak ada rahasia bersama melalui jaringan | Beban tambahan pengelolaan sertifikat          |
| **Identitas Terkelola** | `authType: "federated"` + `useManagedIdentity`       | Tanpa kata sandi, tidak ada rahasia yang perlu dikelola | Infrastruktur Azure diperlukan         |

`certificateThumbprint` dapat ditetapkan bersama `certificatePath`, tetapi saat ini tidak dibaca oleh jalur autentikasi; nilai tersebut diterima hanya untuk kompatibilitas mendatang.

**Default:** ketika `authType` tidak ditetapkan, OpenClaw menggunakan autentikasi rahasia klien (`appPassword`). Konfigurasi yang sudah ada tetap berfungsi tanpa perubahan.

## Pengembangan lokal (tunneling)

Teams tidak dapat menjangkau `localhost`. Gunakan tunnel pengembangan persisten agar URL tetap stabil di seluruh sesi:

```bash
# Penyiapan satu kali:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Setiap sesi pengembangan:
devtunnel host my-openclaw-bot
```

Alternatif: `ngrok http 3978` atau `tailscale funnel 3978` (URL dapat berubah pada setiap sesi).

Jika URL tunnel berubah, perbarui endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Menguji bot

**Jalankan diagnostik:**

```bash
teams app doctor <teamsAppId>
```

Memeriksa pendaftaran bot, aplikasi AAD, manifes, dan konfigurasi SSO dalam satu kali proses.

**Kirim pesan pengujian:**

1. Instal aplikasi Teams (tautan instalasi dari `teams app get <id> --install-link`).
2. Temukan bot di Teams dan kirim DM.
3. Periksa log Gateway untuk aktivitas masuk.

## Variabel lingkungan

Kunci konfigurasi terkait autentikasi ini dapat ditetapkan melalui variabel lingkungan sebagai pengganti `openclaw.json` (kunci konfigurasi lainnya, seperti `groupPolicy` atau `historyLimit`, hanya dapat ditetapkan melalui konfigurasi):

| Variabel lingkungan                  | Kunci konfigurasi          | Catatan                                  |
| ------------------------------------ | -------------------------- | ---------------------------------------- |
| `MSTEAMS_APP_ID`                   | `appId`         |                                          |
| `MSTEAMS_APP_PASSWORD`                   | `appPassword`         |                                          |
| `MSTEAMS_TENANT_ID`                   | `tenantId`         |                                          |
| `MSTEAMS_AUTH_TYPE`                   | `authType`         | `"secret"` atau `"federated"` |
| `MSTEAMS_CERTIFICATE_PATH`                   | `certificatePath`         | terfederasi + sertifikat                 |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`                   | `certificateThumbprint`         | diterima, tidak diwajibkan untuk autentikasi |
| `MSTEAMS_USE_MANAGED_IDENTITY`                   | `useManagedIdentity`         | terfederasi + identitas terkelola        |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`                   | `managedIdentityClientId`         | hanya identitas terkelola yang ditetapkan pengguna |

## Tindakan informasi anggota

OpenClaw menyediakan tindakan `member-info` berbasis Graph untuk Microsoft Teams agar agen dan otomatisasi dapat memperoleh detail daftar anggota terverifikasi untuk percakapan yang dikonfigurasi.

Persyaratan:

- Izin RSC `ChannelSettings.Read.Group` dan `TeamMember.Read.Group` (sudah tersedia dalam manifes yang direkomendasikan).

Tindakan ini tersedia setiap kali kredensial Graph dikonfigurasi; tidak ada tombol aktif/nonaktif `channels.msteams.actions.memberInfo` terpisah.
Pencarian saluran standar mengembalikan identitas daftar anggota tim yang cocok, nama tampilan, email, dan peran.
Dalam DM atau obrolan grup saat ini, tindakan tersebut dapat mengembalikan ID pengguna stabil milik pengirim tepercaya.
Pencarian anggota saluran privat/bersama dan obrolan selain yang sedang aktif memerlukan izin daftar anggota tambahan
dan ditolak oleh baseline izin default.

## Konteks riwayat

- `channels.msteams.historyLimit` mengontrol jumlah pesan saluran/grup terbaru yang disertakan dalam prompt. Beralih ke `messages.groupChat.historyLimit` jika tidak tersedia, lalu menggunakan default 50. Tetapkan `0` untuk menonaktifkannya.
- Riwayat utas yang diambil difilter berdasarkan daftar pengirim yang diizinkan (`allowFrom` / `groupAllowFrom`), sehingga pengisian awal konteks utas hanya menyertakan pesan dari pengirim yang diizinkan.
- Konteks lampiran kutipan (yang diurai dari HTML skema Balasan Skype dalam lampiran milik balasan itu sendiri) diteruskan tanpa filter; saat ini hanya pengisian awal riwayat utas yang menerapkan filter daftar pengirim yang diizinkan.
- Riwayat DM dapat dibatasi dengan `channels.msteams.dmHistoryLimit` (giliran pengguna). Penggantian per pengguna: `channels.msteams.dms["<user_id>"].historyLimit`.

## Izin RSC Teams saat ini (manifes)

Berikut adalah **izin resourceSpecific yang sudah ada** dalam manifes aplikasi Teams kami. Izin tersebut hanya berlaku di dalam tim/obrolan tempat aplikasi diinstal.

**Untuk saluran (cakupan tim):**

- `ChannelMessage.Read.Group` (Application) - menerima semua pesan saluran tanpa @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Untuk obrolan grup:**

- `ChatMessage.Read.Chat` (Application) - menerima semua pesan obrolan grup tanpa @mention

Tambahkan izin RSC melalui CLI Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Contoh manifes Teams (disunting)

Contoh minimal dan valid dengan kolom yang diwajibkan. Ganti ID dan URL.

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

### Catatan penting manifes (kolom wajib)

- `bots[].botId` **harus** cocok dengan ID Aplikasi Azure Bot.
- `webApplicationInfo.id` **harus** cocok dengan ID Aplikasi Azure Bot.
- `bots[].scopes` harus menyertakan permukaan yang akan digunakan (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` diwajibkan untuk penanganan file dalam cakupan personal.
- `authorization.permissions.resourceSpecific` harus menyertakan pembacaan/pengiriman saluran untuk lalu lintas saluran.

### Memperbarui aplikasi yang sudah ada

```bash
# Unduh, edit, dan unggah kembali manifes
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json secara lokal...
teams app manifest upload manifest.json <teamsAppId>
# Versi dinaikkan secara otomatis jika konten berubah
```

Setelah memperbarui, instal ulang aplikasi di setiap tim, lalu **keluar sepenuhnya dan jalankan ulang Teams** (bukan sekadar menutup jendela) untuk menghapus metadata aplikasi yang di-cache.

<details>
<summary>Pembaruan manifes secara manual (tanpa CLI)</summary>

1. Perbarui `manifest.json` dengan pengaturan baru.
2. **Naikkan kolom `version`** (misalnya, `1.0.0` → `1.1.0`).
3. **Buat ulang file zip** manifes beserta ikon (`manifest.json`, `outline.png`, `color.png`).
4. Unggah file zip baru:
   - **Teams Admin Center:** Teams apps → Manage apps → temukan aplikasi Anda → Upload new version.
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Kemampuan: hanya RSC vs Graph

### Dengan **hanya RSC Teams** (aplikasi diinstal, tanpa izin API Graph)

Berfungsi:

- Membaca konten **teks** pesan saluran.
- Mengirim konten **teks** pesan saluran.
- Menerima lampiran file **personal (DM)**.

TIDAK berfungsi:

- **Konten gambar atau file** saluran/grup (payload hanya menyertakan stub HTML).
- Mengunduh lampiran yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan di luar peristiwa Webhook langsung.

### Dengan **RSC Teams + izin Aplikasi Microsoft Graph**

Menambahkan:

- Mengunduh konten yang di-host (gambar yang ditempelkan ke dalam pesan).
- Mengunduh lampiran file yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan saluran/obrolan melalui Graph.

### RSC vs API Graph

| Kemampuan                  | Izin RSC                | Graph API                                  |
| -------------------------- | ----------------------- | ------------------------------------------ |
| **Pesan waktu nyata**      | Ya (melalui webhook)    | Tidak (hanya polling)                      |
| **Pesan historis**         | Tidak                   | Ya (dapat mengueri riwayat)                |
| **Kompleksitas penyiapan** | Hanya manifes aplikasi  | Memerlukan persetujuan admin + alur token  |
| **Berfungsi secara luring** | Tidak (harus berjalan) | Ya (dapat mengueri kapan saja)             |

**Intinya:** RSC digunakan untuk mendengarkan secara waktu nyata; Graph API digunakan untuk akses historis. Untuk mengambil pesan yang terlewat saat luring, Anda memerlukan Graph API dengan `ChannelMessage.Read.All` (memerlukan persetujuan admin).

## Media + riwayat yang didukung Graph

Aktifkan hanya izin aplikasi Microsoft Graph yang diperlukan untuk cakupan dan data Teams yang Anda gunakan:

1. Entra ID (Azure AD) **App Registration** → tambahkan **Application permissions** Graph:
   - `ChannelMessage.Read.All` untuk lampiran kanal dan riwayat kanal.
   - `Chat.Read.All` untuk lampiran obrolan grup dan riwayat obrolan grup.
   - `Files.Read.All` ketika byte lampiran harus diunduh dari penyimpanan SharePoint/OneDrive; penyiapan khusus riwayat tidak memerlukannya.
2. **Grant admin consent** untuk tenant.
3. Naikkan **versi manifes** aplikasi Teams, unggah ulang, dan **instal ulang aplikasi di Teams**.
4. **Tutup Teams sepenuhnya dan jalankan ulang** untuk menghapus metadata aplikasi yang di-cache.

### Pemulihan file kanal/grup (`graphMediaFallback`)

Teams dapat menghapus penanda file dari aktivitas HTML yang dikirim ke bot. Dalam kasus tersebut, aktivitas Bot Framework tidak dapat dibedakan dari pesan HTML biasa; referensi lampiran lengkap hanya tersedia pada salinan pesan di Graph.

Aktifkan fallback setelah memberikan izin di atas:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Ini hanya berlaku untuk kanal dan obrolan grup. Ini menambahkan satu pencarian pesan Graph setiap kali aktivitas HTML tidak menghasilkan media yang dapat diunduh langsung, termasuk pesan biasa atau pesan yang hanya berisi penyebutan. Nilai default-nya adalah `false` agar instalasi yang ada tidak otomatis mengalami lalu lintas Graph tambahan atau kesalahan izin.

**Penyebutan pengguna:** @mention langsung berfungsi untuk pengguna yang sudah berada dalam percakapan. Untuk mencari dan menyebut pengguna secara dinamis yang **tidak berada dalam percakapan saat ini**, tambahkan izin `User.Read.All` (Application) dan berikan persetujuan admin.

## Batasan yang diketahui

### Batas waktu webhook

Teams mengirimkan pesan melalui webhook HTTP. OpenClaw menerapkan batas waktu server HTTP tetap pada listener webhook tersebut: 30 detik tanpa aktivitas, total permintaan 30 detik, dan 15 detik untuk menerima header. Media masuk opsional dan pengayaan konteks memiliki anggaran bersama 10 detik. SDK kembali setelah aktivitas mentah ditambahkan secara persisten; giliran agen diproses secara independen dan membalas secara proaktif. Jika penanganan permintaan atau penerimaan persisten melewati jendela transportasi, Teams dapat mencoba kembali aktivitas tersebut, dan tombstone ingress menolak ID peristiwa yang berulang.

### Dukungan cloud Teams dan URL layanan

Jalur Teams yang didukung SDK ini telah divalidasi secara langsung untuk cloud publik Microsoft Teams.

Balasan masuk menggunakan konteks giliran Teams SDK dari aktivitas yang masuk. Operasi proaktif di luar konteks—pengiriman, pengeditan, penghapusan, kartu, polling, pesan persetujuan file, dan balasan berdurasi panjang yang diantrekan—menggunakan referensi percakapan tersimpan `serviceUrl`. Cloud publik secara default menggunakan lingkungan cloud publik Teams SDK dan mengizinkan referensi tersimpan pada host Teams Connector publik: `https://smba.trafficmanager.net/`.

Cloud publik adalah default. Anda tidak perlu menetapkan `channels.msteams.cloud` atau `channels.msteams.serviceUrl` untuk bot cloud publik normal.

Untuk cloud Teams nonpublik, tetapkan `cloud` dan batas proaktif yang sesuai ketika Microsoft memublikasikannya:

- `channels.msteams.cloud` memilih preset cloud Teams SDK untuk autentikasi, validasi JWT, layanan token, dan cakupan Graph.
- `channels.msteams.serviceUrl` memilih batas endpoint Bot Connector yang digunakan untuk memvalidasi referensi percakapan tersimpan sebelum pengiriman, pengeditan, penghapusan, kartu, polling, pesan persetujuan file, dan balasan berdurasi panjang yang diantrekan secara proaktif. Ini diwajibkan untuk cloud SDK USGov dan DoD. Untuk China/21Vianet, OpenClaw menggunakan preset SDK `China` dan hanya menerima URL layanan tersimpan/terkonfigurasi pada host kanal Azure China Bot Framework.

Microsoft memublikasikan endpoint Bot Connector proaktif global dalam bagian [Membuat percakapan](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) pada dokumentasi perpesanan proaktif Teams. Gunakan `serviceUrl` dari aktivitas masuk jika tersedia; jika tidak, gunakan tabel Microsoft di bawah ini.

| Lingkungan Teams | Konfigurasi OpenClaw                                         | `serviceUrl` proaktif                          |
| ---------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| Public           | tidak memerlukan konfigurasi cloud/serviceUrl                | `https://smba.trafficmanager.net/teams`                                   |
| GCC              | tetapkan `serviceUrl`; tidak ada preset cloud Teams SDK terpisah | `https://smba.infra.gcc.teams.microsoft.com/teams`                          |
| GCC High         | `cloud: "USGov"` + `serviceUrl`                     | `https://smba.infra.gov.teams.microsoft.us/teams`                                   |
| DoD              | `cloud: "USGovDoD"` + `serviceUrl`                     | `https://smba.infra.dod.teams.microsoft.us/teams`                                   |
| China/21Vianet   | `cloud: "China"`                                           | gunakan `serviceUrl` dari aktivitas masuk      |

Contoh untuk GCC, tempat Microsoft mendokumentasikan URL layanan proaktif terpisah tetapi Teams SDK tidak menyediakan preset cloud GCC terpisah:

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

`channels.msteams.serviceUrl` dibatasi pada host Microsoft Teams Bot Connector yang didukung. Ketika URL layanan dikonfigurasi, OpenClaw memeriksa bahwa `serviceUrl` percakapan tersimpan menggunakan host yang sama sebelum pengiriman, pengeditan, penghapusan, kartu, polling, atau balasan berdurasi panjang yang diantrekan secara proaktif dijalankan. Dengan konfigurasi cloud publik default, OpenClaw menutup akses jika percakapan tersimpan mengarah ke luar host Teams Connector publik. Terima pesan baru dari percakapan setelah mengubah pengaturan cloud/URL layanan agar referensi percakapan tersimpan tetap mutakhir.

China/21Vianet tidak memiliki URL `smba` proaktif global terpisah dalam tabel endpoint proaktif Teams milik Microsoft. Konfigurasikan `cloud: "China"` agar Teams SDK menggunakan endpoint autentikasi, token, dan JWT Azure China. Pengiriman proaktif kemudian memerlukan referensi percakapan tersimpan dari aktivitas China Teams yang masuk, atau URL layanan yang dikonfigurasi secara eksplisit, pada batas kanal Azure China Bot Framework (`*.botframework.azure.cn`). Pembantu Teams yang didukung Graph dinonaktifkan untuk `cloud: "China"` hingga OpenClaw merutekan permintaan Graph melalui endpoint Azure China Graph.

### Pemformatan

Markdown Teams lebih terbatas daripada Slack atau Discord:

- Pemformatan dasar berfungsi: **tebal**, _miring_, `code`, tautan.
- Markdown kompleks (tabel, daftar bertingkat) mungkin tidak dirender dengan benar.
- Adaptive Cards didukung untuk polling dan pengiriman presentasi semantik (lihat di bawah).

## Konfigurasi

Pengaturan utama (lihat [/gateway/configuration](/id/gateway/configuration) untuk pola kanal bersama):

- `channels.msteams.enabled`: aktifkan/nonaktifkan kanal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: kredensial bot.
- `channels.msteams.cloud`: lingkungan cloud SDK Teams (`Public`, `USGov`, `USGovDoD`, atau `China`; default `Public`). Atur dengan `serviceUrl` untuk cloud SDK USGov/DoD; Tiongkok menggunakan preset SDK dan referensi percakapan Azure China Bot Framework yang tersimpan, dengan pembantu berbasis Graph dinonaktifkan hingga perutean Azure China Graph tersedia.
- `channels.msteams.serviceUrl`: batas URL layanan Bot Connector untuk operasi proaktif SDK. Cloud publik menggunakan default SDK; atur untuk GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High, atau DoD. Tiongkok menerima host kanal Azure China Bot Framework jika referensi percakapan yang tersimpan berasal dari Teams yang dioperasikan oleh 21Vianet.
- `channels.msteams.webhook.port` (default `3978`).
- `channels.msteams.webhook.path` (default `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (default `pairing`).
- `channels.msteams.allowFrom`: daftar izin DM (ID objek AAD disarankan). Wizard mengubah nama menjadi ID selama penyiapan jika akses Graph tersedia.
- `channels.msteams.dangerouslyAllowNameMatching`: pengalih darurat untuk mengaktifkan kembali pencocokan UPN/nama tampilan yang dapat berubah dan perutean langsung berdasarkan nama tim/kanal.
- `channels.msteams.textChunkLimit`: ukuran potongan teks keluar dalam karakter (default `4000`, dan dibatasi keras hingga `4000` tanpa memandang nilai konfigurasi yang lebih tinggi).
- `channels.msteams.streaming.chunkMode`: `length` (default) atau `newline` untuk memisahkan pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.msteams.mediaAllowHosts`: daftar izin host lampiran masuk (default-nya domain Microsoft/Teams: Graph, SharePoint/OneDrive, Teams CDN, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: daftar izin untuk melampirkan header Authorization saat mencoba ulang media (default-nya host Graph + Bot Framework).
- `channels.msteams.graphMediaFallback`: ikut menggunakan pencarian pesan Graph saat HTML kanal/grup tidak memuat penanda berkas (default `false`; lihat [Pemulihan berkas kanal/grup](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: penggantian batas ukuran media per kanal dalam MB. Menggunakan `agents.defaults.mediaMaxMb` jika tidak diatur.
- `channels.msteams.requireMention`: wajibkan @mention di kanal/grup (default `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (lihat [Gaya balasan](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: penggantian per tim.
- `channels.msteams.teams.<teamId>.requireMention`: penggantian per tim.
- `channels.msteams.teams.<teamId>.tools`: penggantian kebijakan alat default per tim (`allow`/`deny`/`alsoAllow`) yang digunakan jika penggantian kanal tidak ada.
- `channels.msteams.teams.<teamId>.toolsBySender`: penggantian kebijakan alat default per tim dan per pengirim (karakter pengganti `"*"` didukung).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: penggantian per kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: penggantian per kanal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: penggantian kebijakan alat per kanal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: penggantian kebijakan alat per kanal dan per pengirim (karakter pengganti `"*"` didukung).
- Kunci `toolsBySender` harus menggunakan prefiks eksplisit: `channel:`, `id:`, `e164:`, `username:`, `name:` (kunci lama tanpa prefiks tetap hanya dipetakan ke `id:`).
- `channels.msteams.authType`: jenis autentikasi - `"secret"` (default) atau `"federated"`.
- `channels.msteams.certificatePath`: jalur ke berkas sertifikat PEM (autentikasi federasi + sertifikat).
- `channels.msteams.certificateThumbprint`: sidik jari sertifikat; diterima, tidak diwajibkan untuk autentikasi.
- `channels.msteams.useManagedIdentity`: aktifkan autentikasi identitas terkelola (mode federasi).
- `channels.msteams.managedIdentityClientId`: ID klien untuk identitas terkelola yang ditetapkan pengguna.
- `channels.msteams.sharePointSiteId`: ID situs SharePoint untuk pengunggahan berkas di obrolan grup/kanal (lihat [Mengirim berkas dalam obrolan grup](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Adaptive Card sambutan yang ditampilkan pada kontak DM/grup pertama, beserta tombol prompt yang disarankan.
- `channels.msteams.responsePrefix`: teks yang ditambahkan sebagai prefiks pada balasan keluar.
- `channels.msteams.feedbackEnabled` (default `true`), `channels.msteams.feedbackReflection` (default `true`), `channels.msteams.feedbackReflectionCooldownMs`: umpan balik jempol naik/turun pada balasan dan tindak lanjut refleksi atas umpan balik negatif.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: koneksi OAuth Bot Framework dan cakupan Graph yang didelegasikan untuk alur berbasis SSO; `sso.enabled: true` memerlukan `sso.connectionName`.

## Perutean dan sesi

- Kunci sesi mengikuti format agen standar (lihat [/concepts/session](/id/concepts/session)):
  - Pesan langsung berbagi sesi utama (`agent:<agentId>:<mainKey>`).
  - Pesan kanal/grup menggunakan ID percakapan:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Gaya balasan: utas vs postingan

Teams memiliki dua gaya UI kanal di atas model data dasar yang sama:

| Gaya                     | Deskripsi                                                  | `replyStyle` yang disarankan |
| ------------------------ | ---------------------------------------------------------- | ------------------------ |
| **Posts** (klasik)       | Pesan muncul sebagai kartu dengan balasan berutas di bawahnya | `thread` (default)       |
| **Threads** (seperti Slack) | Pesan mengalir secara linear, lebih menyerupai Slack    | `top-level`              |

**Masalahnya:** API Teams tidak menampilkan gaya UI yang digunakan kanal. Jika menggunakan `replyStyle` yang salah:

- `thread` dalam kanal bergaya Threads → balasan tampak bertumpuk secara canggung.
- `top-level` dalam kanal bergaya Posts → balasan muncul sebagai postingan tingkat teratas terpisah, bukan di dalam utas.

**Solusi:** konfigurasikan `replyStyle` per kanal berdasarkan penyiapan kanal:

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

Saat bot mengirim balasan ke kanal, `replyStyle` diresolusikan dari penggantian yang paling spesifik hingga default. Nilai pertama yang bukan `undefined` akan digunakan:

1. **Per kanal** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Per tim** - `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** - `channels.msteams.replyStyle`
4. **Default implisit** - diturunkan dari `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Jika Anda mengatur `requireMention: false` secara global tanpa `replyStyle` yang eksplisit, mention dalam kanal bergaya Posts akan muncul sebagai postingan tingkat teratas meskipun pesan masuk merupakan balasan utas. Tetapkan `replyStyle: "thread"` di tingkat global, tim, atau kanal untuk menghindari hasil yang tidak terduga.

Untuk pengiriman proaktif ke percakapan kanal yang tersimpan (balasan panggilan alat dalam antrean, agen yang berjalan lama), resolusi tim/kanal yang sama berlaku; obrolan grup dan percakapan pribadi (DM) selalu diresolusikan menjadi `top-level` untuk pengiriman proaktif tanpa memandang `replyStyle`.

### Pemeliharaan konteks utas

Saat `replyStyle: "thread"` berlaku dan bot di-@mention dari dalam utas kanal, OpenClaw melampirkan kembali akar utas asli ke referensi percakapan keluar (`19:...@thread.tacv2;messageid=<root>`) agar balasan masuk ke utas yang sama. Ini berlaku baik untuk pengiriman langsung (dalam giliran) maupun pengiriman proaktif yang dilakukan setelah konteks giliran Bot Framework kedaluwarsa (misalnya, agen yang berjalan lama, balasan panggilan alat dalam antrean melalui `mcp__openclaw__message`).

Akar utas diambil dari `threadId` yang tersimpan pada referensi percakapan. Referensi tersimpan lama yang dibuat sebelum `threadId` akan menggunakan `activityId` sebagai cadangan (aktivitas masuk apa pun yang terakhir menginisialisasi percakapan), sehingga penerapan yang ada tetap berfungsi tanpa inisialisasi ulang.

Saat `replyStyle: "top-level"` berlaku, pesan masuk dari utas kanal secara sengaja dijawab sebagai postingan tingkat teratas baru; tidak ada sufiks utas yang dilampirkan. Ini benar untuk kanal bergaya Threads; postingan tingkat teratas ketika balasan berutas diharapkan berarti `replyStyle` diatur secara keliru untuk kanal tersebut.

## Lampiran dan gambar

**Batasan saat ini:**

- **DM:** gambar dan lampiran berkas berfungsi melalui API berkas bot Teams.
- **Kanal/grup:** lampiran berada di penyimpanan M365 (SharePoint/OneDrive). Payload Webhook hanya menyertakan stub HTML, bukan byte berkas sebenarnya. **Izin Graph API diperlukan** untuk mengunduh lampiran kanal.
- Untuk pengiriman yang mengutamakan berkas secara eksplisit, gunakan `action=upload-file` dengan `media` / `filePath` / `path`; `message` opsional menjadi teks/komentar pendamping, dan `filename` (atau `title`) mengganti nama yang diunggah.

Tanpa izin Graph, pesan kanal dengan gambar diterima sebagai teks saja (konten gambar tidak dapat diakses bot).
Secara default, OpenClaw hanya mengunduh media dari nama host Microsoft/Teams. Ganti dengan `channels.msteams.mediaAllowHosts` (gunakan `["*"]` untuk mengizinkan semua host).
Header Authorization hanya dilampirkan untuk host dalam `channels.msteams.mediaAuthAllowHosts` (default-nya host Graph + Bot Framework). Pertahankan daftar ini agar tetap ketat (hindari sufiks multi-tenant).

## Mengirim berkas dalam obrolan grup

Bot dapat mengirim berkas dalam DM menggunakan alur FileConsentCard bawaan. **Mengirim berkas dalam obrolan grup/kanal** memerlukan penyiapan tambahan:

| Konteks                  | Cara berkas dikirim                           | Penyiapan yang diperlukan                       |
| ------------------------ | --------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → pengguna menerima → bot mengunggah | Langsung berfungsi tanpa penyiapan tambahan |
| **Obrolan grup/kanal**   | Unggah ke SharePoint → kartu berkas native    | Memerlukan `sharePointSiteId` + izin Graph      |
| **Gambar (konteks apa pun)** | Inline dengan pengodean Base64             | Langsung berfungsi tanpa penyiapan tambahan      |

### Mengapa obrolan grup memerlukan SharePoint

Bot menggunakan identitas aplikasi, sedangkan sumber daya `/me` milik Microsoft Graph [memerlukan pengguna yang telah masuk](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Untuk mengirim berkas dalam obrolan grup/kanal, bot mengunggahnya ke **situs SharePoint** dan membuat tautan berbagi.

### Penyiapan

1. **Tambahkan izin Graph API** di Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - unggah berkas ke SharePoint.
   - `ChatMember.Read.All` (Application) - izin seluruh tenant dengan hak akses paling rendah untuk pengiriman berkas dalam obrolan grup. `Chat.Read.All` juga berfungsi dan sudah mencakup hal ini saat riwayat obrolan grup diaktifkan. Sebagai alternatif per obrolan, gunakan [izin persetujuan khusus sumber daya](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`.
2. **Berikan persetujuan admin** untuk tenant.
3. **Dapatkan ID situs SharePoint Anda:**

   ```bash
   # Melalui Graph Explorer atau curl dengan token yang valid:
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
         // ... konfigurasi lainnya ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Perilaku berbagi

| Konteks dan izin                                                        | Perilaku berbagi                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Saluran + `Sites.ReadWrite.All`                                           | Tautan berbagi seluruh organisasi (siapa pun dalam organisasi dapat mengakses) |
| Obrolan grup + `Sites.ReadWrite.All` + izin baca anggota obrolan yang didukung | Tautan berbagi per pengguna (hanya anggota obrolan yang dapat mengakses) |
| Obrolan grup tanpa izin baca anggota obrolan yang didukung              | Pengiriman gagal secara tertutup                                    |

Berbagi per pengguna lebih aman karena hanya peserta obrolan yang dapat mengakses file tersebut. OpenClaw memerlukan pencarian anggota yang berhasil untuk obrolan grup; batas waktu, kegagalan transportasi, hasil kosong, dan penolakan Graph API menggagalkan pengiriman alih-alih memperluas akses ke seluruh organisasi.

### Perilaku fallback

| Skenario                                                         | Hasil                                                   |
| ---------------------------------------------------------------- | ------------------------------------------------------- |
| Obrolan grup + file + izin SharePoint dan anggota dikonfigurasi  | Unggah ke SharePoint, kirim kartu file native           |
| Obrolan grup + file + izin SharePoint atau anggota tidak tersedia | Gagal dengan kesalahan konfigurasi yang dapat ditindaklanjuti |
| Saluran + file + `sharePointSiteId` dikonfigurasi                | Unggah ke SharePoint, kirim kartu file native           |
| Obrolan pribadi + file                                           | Alur FileConsentCard (berfungsi tanpa SharePoint)       |
| Konteks apa pun + gambar                                         | Inline berkode Base64 (berfungsi tanpa SharePoint)      |

### Lokasi penyimpanan file

File yang diunggah disimpan dalam folder `/OpenClawShared/` di pustaka dokumen default situs SharePoint yang dikonfigurasi.

## Polling (Adaptive Cards)

OpenClaw mengirim polling Teams sebagai Adaptive Cards (tidak ada API polling native Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Suara dicatat oleh Gateway dalam SQLite status Plugin OpenClaw di `state/openclaw.sqlite`.
- File `msteams-polls.json` yang sudah ada diimpor oleh `openclaw doctor --fix`, bukan oleh Plugin yang sedang berjalan.
- Gateway harus tetap online untuk mencatat suara.
- Polling tidak memposting ringkasan hasil secara otomatis, dan belum ada CLI hasil polling.

## Kartu presentasi

Kirim payload presentasi semantik kepada pengguna atau percakapan Teams menggunakan alat `message`, CLI, atau pengiriman balasan biasa. OpenClaw merendernya sebagai Adaptive Cards Teams dari kontrak presentasi generik.

Parameter `presentation` menerima blok semantik. Saat `presentation` diberikan, teks pesan bersifat opsional. Tombol dirender sebagai tindakan pengiriman atau URL Adaptive Card. Menu pilihan tidak tersedia secara native dalam perender Teams, sehingga OpenClaw menurunkannya menjadi teks yang mudah dibaca sebelum dikirim.

**Alat agen:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Halo",
    blocks: [{ type: "text", text: "Halo!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Halo","blocks":[{"type":"text","text":"Halo!"}]}'
```

Untuk detail format target, lihat [Format target](#target-formats) di bawah.

## Format target

Target MSTeams menggunakan prefiks untuk membedakan pengguna dan percakapan:

| Jenis target         | Format                           | Contoh                                                                                                |
| -------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Pengguna (berdasarkan ID) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                                                    |
| Pengguna (berdasarkan nama) | `user:<display-name>`          | `user:John Smith` (memerlukan Graph API)                                                             |
| Grup/saluran         | `conversation:<conversation-id>`               | `conversation:19:abc123...@thread.tacv2`                                                                                    |
| Grup/saluran (mentah) | `<conversation-id>`              | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces`, atau ID Bot Framework `a:`/`8:orgid:`/`29:` tanpa prefiks |

**Contoh CLI:**

```bash
# Kirim kepada pengguna berdasarkan ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Halo"

# Kirim kepada pengguna berdasarkan nama tampilan (memicu pencarian Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Halo"

# Kirim ke obrolan grup atau saluran
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Halo"

# Kirim kartu presentasi ke percakapan
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Halo","blocks":[{"type":"text","text":"Halo"}]}'
```

**Contoh alat agen:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Halo!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Halo",
    blocks: [{ type: "text", text: "Halo" }],
  },
}
```

<Note>
Tanpa prefiks `user:`, nama secara default akan diresolusi sebagai grup atau tim. Selalu gunakan `user:` saat menargetkan orang berdasarkan nama tampilan.
</Note>

## Pesan proaktif

- Pesan proaktif hanya dapat dikirim **setelah** pengguna berinteraksi, karena OpenClaw menyimpan referensi percakapan pada saat tersebut.
- Lihat [/gateway/configuration](/id/gateway/configuration) untuk `dmPolicy` dan pembatasan daftar izin.

## ID Tim dan Saluran (Kesalahan Umum)

Parameter kueri `groupId` dalam URL Teams **BUKAN** ID tim yang digunakan untuk konfigurasi. Ekstrak ID dari jalur URL sebagai gantinya:

**URL tim:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID percakapan tim (dekode URL ini)
```

**URL saluran:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID saluran (dekode URL ini)
```

**Untuk konfigurasi:**

- Kunci tim = segmen jalur setelah `/team/` (setelah dekode URL, misalnya `19:Bk4j...@thread.tacv2`; tenant lama mungkin menampilkan `@thread.skype`, yang juga valid).
- Kunci saluran = segmen jalur setelah `/channel/` (setelah dekode URL).
- **Abaikan** parameter kueri `groupId` untuk perutean OpenClaw. Parameter tersebut adalah ID grup Microsoft Entra, bukan ID percakapan Bot Framework yang digunakan dalam aktivitas Teams masuk.

## Saluran privat

Bot memiliki dukungan terbatas di saluran privat:

| Fitur                        | Saluran standar   | Saluran privat                |
| ---------------------------- | ----------------- | ----------------------------- |
| Instalasi bot                | Ya                | Terbatas                      |
| Pesan waktu nyata (Webhook)  | Ya                | Mungkin tidak berfungsi       |
| Izin RSC                     | Ya                | Mungkin berperilaku berbeda   |
| @mention                     | Ya                | Jika bot dapat diakses        |
| Riwayat Graph API            | Ya                | Ya (dengan izin)              |

**Solusi sementara jika saluran privat tidak berfungsi:**

1. Gunakan saluran standar untuk interaksi dengan bot.
2. Gunakan DM; pengguna selalu dapat mengirim pesan langsung kepada bot.
3. Gunakan Graph API untuk akses historis (memerlukan `ChannelMessage.Read.All`).

## Pemecahan masalah

### Masalah umum

- **Gambar tidak muncul di saluran:** izin Graph atau persetujuan admin tidak tersedia. Instal ulang aplikasi Teams, lalu tutup sepenuhnya dan buka kembali Teams.
- **Tidak ada respons di saluran:** mention diperlukan secara default; atur `channels.msteams.requireMention=false` atau konfigurasikan per tim/saluran.
- **Ketidakcocokan versi (Teams masih menampilkan manifes lama):** hapus lalu tambahkan kembali aplikasi dan tutup sepenuhnya Teams untuk menyegarkannya.
- **401 Unauthorized dari Webhook:** kondisi ini diperkirakan saat menguji secara manual tanpa JWT Azure; artinya endpoint dapat dijangkau, tetapi autentikasi gagal. Gunakan Azure Web Chat untuk menguji dengan benar.

### Kesalahan pengunggahan manifes

- **"Icon file cannot be empty":** manifes merujuk pada file ikon berukuran 0 byte. Buat ikon PNG yang valid (32x32 untuk `outline.png`, 192x192 untuk `color.png`).
- **"webApplicationInfo.Id already in use":** aplikasi masih terinstal di tim/obrolan lain. Temukan dan hapus instalasinya terlebih dahulu, atau tunggu 5-10 menit agar perubahan diterapkan.
- **"Something went wrong" saat mengunggah:** unggah melalui [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), buka DevTools browser (F12) → tab Network, lalu periksa isi respons untuk menemukan kesalahan sebenarnya.
- **Sideload gagal:** coba "Upload an app to your org's app catalog" alih-alih "Upload a custom app"; cara ini sering melewati pembatasan sideload.

### Izin RSC tidak berfungsi

1. Pastikan `webApplicationInfo.id` sama persis dengan App ID bot Anda.
2. Unggah ulang aplikasi dan instal kembali di tim/obrolan.
3. Periksa apakah admin organisasi Anda telah memblokir izin RSC.
4. Pastikan Anda menggunakan cakupan yang tepat: `ChannelMessage.Read.Group` untuk tim, `ChatMessage.Read.Chat` untuk obrolan grup.

## Referensi

- [Buat Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - panduan penyiapan Azure Bot
- [Portal Pengembang Teams](https://dev.teams.microsoft.com/apps) - membuat/mengelola aplikasi Teams
- [Skema manifes aplikasi Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Menerima pesan saluran dengan RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referensi izin RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Penanganan file bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (saluran/grup memerlukan Graph)
- [Pesan proaktif](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams untuk pengelolaan bot

## Terkait

- [Ikhtisar Kanal](/id/channels) - semua kanal yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Perutean Kanal](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan penguatan keamanan
