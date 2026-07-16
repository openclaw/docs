---
read_when:
    - Mengerjakan fitur saluran Microsoft Teams
summary: Status, kemampuan, dan konfigurasi bot Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T17:51:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

Status: teks + lampiran DM didukung; pengiriman file ke saluran/grup memerlukan `sharePointSiteId` + izin Graph (lihat [Mengirim file dalam obrolan grup](#sending-files-in-group-chats)). Jajak pendapat dikirim melalui Adaptive Cards. Tindakan pesan menyediakan `upload-file` eksplisit untuk pengiriman yang mendahulukan file.

## Plugin bawaan

Microsoft Teams disertakan sebagai Plugin bawaan dalam rilis OpenClaw saat ini; instalasi terpisah tidak diperlukan dalam build paket normal.

Pada build lama atau instalasi khusus yang mengecualikan Teams bawaan, instal paket npm secara langsung:

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
teams status   # verifikasi bahwa Anda telah masuk dan lihat informasi tenant Anda
```

<Note>
CLI Teams saat ini masih dalam tahap pratinjau. Perintah dan flag dapat berubah antar-rilis.
</Note>

**2. Mulai tunnel** (Teams tidak dapat menjangkau localhost)

Instal dan autentikasi CLI devtunnel jika diperlukan ([panduan memulai](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Penyiapan satu kali (URL persisten di seluruh sesi):
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

Ini membuat aplikasi Entra ID (Azure AD), menghasilkan rahasia klien, membangun dan mengunggah manifes aplikasi Teams (beserta ikon), serta mendaftarkan bot yang dikelola Teams (tidak memerlukan langganan Azure). Output mencakup `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, dan **ID Aplikasi Teams**; output juga menawarkan pemasangan aplikasi secara langsung di Teams.

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

**6. Verifikasi bahwa semuanya berfungsi**

```bash
teams app doctor <teamsAppId>
```

Menjalankan diagnostik terhadap pendaftaran bot, konfigurasi aplikasi AAD, validitas manifes, dan penyiapan SSO.

Untuk produksi, pertimbangkan [autentikasi terfederasi](#federated-authentication-certificate-plus-managed-identity) (sertifikat atau identitas terkelola) sebagai pengganti rahasia klien.

<Note>
Obrolan grup diblokir secara default (`channels.msteams.groupPolicy: "allowlist"`). Untuk mengizinkan balasan grup, tetapkan `channels.msteams.groupAllowFrom`, atau gunakan `groupPolicy: "open"` untuk mengizinkan anggota mana pun (dengan persyaratan penyebutan).
</Note>

## Tujuan

- Berkomunikasi dengan OpenClaw melalui DM, obrolan grup, atau saluran Teams.
- Menjaga perutean tetap deterministik: balasan selalu dikirim kembali ke saluran asalnya.
- Menggunakan perilaku saluran yang aman secara default (penyebutan diwajibkan kecuali dikonfigurasi sebaliknya).

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
- `channels.msteams.allowFrom` sebaiknya menggunakan ID objek AAD yang stabil atau grup akses pengirim statis seperti `accessGroup:core-team`.
- Jangan mengandalkan pencocokan UPN/nama tampilan untuk daftar yang diizinkan; nilai tersebut dapat berubah. OpenClaw menonaktifkan pencocokan nama langsung secara default; aktifkan secara eksplisit dengan `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard dapat mencocokkan nama dengan ID melalui Microsoft Graph jika kredensial mengizinkannya.

**Akses grup**

- Default: `channels.msteams.groupPolicy = "allowlist"` (diblokir kecuali Anda menambahkan `groupAllowFrom`). `channels.defaults.groupPolicy` dapat menggantikan default bersama saat `channels.msteams.groupPolicy` tidak ditetapkan.
- `channels.msteams.groupAllowFrom` mengontrol pengirim atau grup akses pengirim statis mana yang dapat memicu tindakan dalam obrolan grup/saluran (menggunakan `channels.msteams.allowFrom` sebagai fallback).
- Tetapkan `groupPolicy: "open"` untuk mengizinkan anggota mana pun (secara default tetap memerlukan penyebutan).
- Untuk memblokir **semua** saluran, tetapkan `channels.msteams.groupPolicy: "disabled"`.

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

**Daftar tim + saluran yang diizinkan**

- Batasi cakupan balasan grup/saluran dengan mencantumkan tim dan saluran di bawah `channels.msteams.teams`.
- Gunakan ID percakapan Teams yang stabil dari tautan Teams sebagai kunci, bukan nama tampilan yang dapat berubah (lihat [ID Tim dan Saluran](#team-and-channel-ids-common-gotcha)).
- Saat `groupPolicy="allowlist"` dan daftar tim yang diizinkan tersedia, hanya tim/saluran yang tercantum yang diterima (dengan persyaratan penyebutan).
- Wizard konfigurasi menerima entri `Team/Channel` dan menyimpannya untuk Anda.
- Saat dimulai, OpenClaw mencocokkan nama tim/saluran dan nama dalam daftar pengguna yang diizinkan dengan ID (jika izin Graph memungkinkan) dan mencatat pemetaannya. Nama yang tidak dapat dicocokkan dipertahankan sebagaimana diketik, tetapi diabaikan untuk perutean kecuali `channels.msteams.dangerouslyAllowNameMatching: true` ditetapkan.

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

1. Pastikan Plugin Microsoft Teams tersedia (disertakan dalam rilis saat ini).
2. Buat **Azure Bot** (ID Aplikasi + rahasia + ID tenant).
3. Bangun **paket aplikasi Teams** yang merujuk ke bot, termasuk izin RSC di bawah ini.
4. Unggah/instal aplikasi Teams ke dalam tim (atau cakupan personal untuk DM).
5. Konfigurasikan `msteams` di `~/.openclaw/openclaw.json` (atau variabel lingkungan) dan mulai gateway.
6. Gateway mendengarkan lalu lintas Webhook Bot Framework pada `/api/messages` secara default.

### Langkah 1: Buat Azure Bot

1. Buka [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Isi tab **Basics**:

   | Bidang             | Nilai                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nama bot Anda, misalnya `openclaw-msteams` (harus unik) |
   | **Subscription**   | Pilih langganan Azure Anda                               |
   | **Resource group** | Buat baru atau gunakan yang sudah ada                    |
   | **Pricing tier**   | **Free** untuk pengembangan/pengujian                    |
   | **Type of App**    | **Single Tenant** (disarankan; lihat catatan di bawah)   |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Pembuatan bot multi-tenant baru tidak digunakan lagi setelah 2025-07-31. Gunakan **Single Tenant** untuk bot baru.
</Warning>

3. Klik **Review + create**, lalu **Create** (~1-2 menit).

### Langkah 2: Dapatkan kredensial

1. Sumber daya Azure Bot → **Configuration** → salin **Microsoft App ID** (`appId` Anda).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → salin **Value** (`appPassword` Anda).
3. **Overview** → salin **Directory (tenant) ID** (`tenantId` Anda).

### Langkah 3: Konfigurasikan endpoint perpesanan

1. Azure Bot → **Configuration**.
2. Tetapkan **Messaging endpoint**:
   - Produksi: `https://your-domain.com/api/messages`
   - Pengembangan lokal: gunakan tunnel (lihat [Pengembangan lokal](#local-development-tunneling))

### Langkah 4: Aktifkan saluran Teams

1. Azure Bot → **Channels**.
2. Klik **Microsoft Teams** → Configure → Save.
3. Setujui Terms of Service.

### Langkah 5: Bangun manifes aplikasi Teams

- Sertakan entri `bot` dengan `botId = <App ID>`.
- Cakupan: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (diperlukan untuk penanganan file dalam cakupan personal).
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

Saluran Teams dimulai secara otomatis saat Plugin tersedia dan konfigurasi `msteams` memiliki kredensial.

</details>

## Autentikasi terfederasi (sertifikat serta identitas terkelola)

Untuk produksi, OpenClaw mendukung **autentikasi terfederasi** sebagai alternatif rahasia klien, melalui `channels.msteams.authType: "federated"`. Terdapat dua metode:

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

1. Pod/VM bot memiliki identitas terkelola (ditetapkan sistem atau pengguna).
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

Untuk penerapan AKS yang menggunakan identitas beban kerja:

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

| Metode                  | Konfigurasi                                    | Kelebihan                                  | Kekurangan                                           |
| ----------------------- | ---------------------------------------------- | ------------------------------------------ | ---------------------------------------------------- |
| **Rahasia klien**       | `appPassword`                             | Penyiapan sederhana                        | Rotasi rahasia diperlukan, kurang aman               |
| **Sertifikat**          | `authType: "federated"` + `certificatePath`       | Tidak ada rahasia bersama melalui jaringan | Beban tambahan pengelolaan sertifikat                |
| **Identitas Terkelola** | `authType: "federated"` + `useManagedIdentity`       | Tanpa kata sandi, tidak ada rahasia dikelola | Infrastruktur Azure diperlukan                      |

`certificateThumbprint` dapat ditetapkan bersama `certificatePath`, tetapi saat ini tidak dibaca oleh jalur autentikasi; nilai tersebut diterima hanya untuk kompatibilitas mendatang.

**Default:** ketika `authType` tidak ditetapkan, OpenClaw menggunakan autentikasi rahasia klien (`appPassword`). Konfigurasi yang ada tetap berfungsi tanpa perubahan.

## Pengembangan lokal (penerowongan)

Teams tidak dapat menjangkau `localhost`. Gunakan terowongan pengembangan persisten agar URL tetap stabil di seluruh sesi:

```bash
# Penyiapan satu kali:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Setiap sesi pengembangan:
devtunnel host my-openclaw-bot
```

Alternatif: `ngrok http 3978` atau `tailscale funnel 3978` (URL dapat berubah pada setiap sesi).

Jika URL terowongan berubah, perbarui titik akhir:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Menguji bot

**Jalankan diagnostik:**

```bash
teams app doctor <teamsAppId>
```

Memeriksa pendaftaran bot, aplikasi AAD, manifes, dan konfigurasi SSO sekaligus.

**Kirim pesan uji:**

1. Instal aplikasi Teams (tautan instalasi dari `teams app get <id> --install-link`).
2. Temukan bot di Teams dan kirim DM.
3. Periksa log Gateway untuk aktivitas masuk.

## Variabel lingkungan

Kunci konfigurasi terkait autentikasi ini dapat ditetapkan melalui variabel lingkungan sebagai pengganti `openclaw.json` (kunci konfigurasi lain, seperti `groupPolicy` atau `historyLimit`, hanya dapat ditetapkan melalui konfigurasi):

| Variabel lingkungan                  | Kunci konfigurasi          | Catatan                              |
| ------------------------------------ | -------------------------- | ------------------------------------ |
| `MSTEAMS_APP_ID`                   | `appId`         |                                      |
| `MSTEAMS_APP_PASSWORD`                   | `appPassword`         |                                      |
| `MSTEAMS_TENANT_ID`                   | `tenantId`         |                                      |
| `MSTEAMS_AUTH_TYPE`                   | `authType`         | `"secret"` atau `"federated"` |
| `MSTEAMS_CERTIFICATE_PATH`                   | `certificatePath`         | terfederasi + sertifikat             |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`                   | `certificateThumbprint`         | diterima, tidak diwajibkan untuk autentikasi |
| `MSTEAMS_USE_MANAGED_IDENTITY`                   | `useManagedIdentity`         | terfederasi + identitas terkelola    |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`                   | `managedIdentityClientId`         | hanya identitas terkelola yang ditetapkan pengguna |

## Tindakan informasi anggota

OpenClaw menyediakan tindakan `member-info` yang didukung Graph untuk Microsoft Teams sehingga agen dan otomatisasi dapat menemukan detail daftar anggota terverifikasi untuk percakapan yang dikonfigurasi.

Persyaratan:

- Izin RSC `ChannelSettings.Read.Group` dan `TeamMember.Read.Group` (sudah ada dalam manifes yang direkomendasikan).

Tindakan tersedia setiap kali kredensial Graph dikonfigurasi; tidak ada tombol alih `channels.msteams.actions.memberInfo` terpisah.
Pencarian kanal standar mengembalikan identitas daftar anggota tim yang cocok, nama tampilan, email, dan peran.
Dalam DM atau obrolan grup saat ini, tindakan dapat mengembalikan ID pengguna stabil milik pengirim tepercaya.
Pencarian anggota kanal privat/bersama dan obrolan yang bukan obrolan saat ini memerlukan izin daftar anggota tambahan
dan ditolak oleh garis dasar izin default.

## Konteks riwayat

- `channels.msteams.historyLimit` mengontrol jumlah pesan kanal/grup terbaru yang dibungkus ke dalam prompt. Beralih ke `messages.groupChat.historyLimit` jika tidak tersedia, lalu menggunakan default 50. Tetapkan `0` untuk menonaktifkannya.
- Riwayat utas yang diambil difilter berdasarkan daftar pengirim yang diizinkan (`allowFrom` / `groupAllowFrom`), sehingga penyemaian konteks utas hanya menyertakan pesan dari pengirim yang diizinkan.
- Konteks lampiran yang dikutip (diurai dari HTML skema Skype Reply dalam lampiran balasan itu sendiri) diteruskan tanpa filter; saat ini hanya penyemaian riwayat utas yang menerapkan filter daftar pengirim yang diizinkan.
- Riwayat DM dapat dibatasi dengan `channels.msteams.dmHistoryLimit` (giliran pengguna). Penimpaan per pengguna: `channels.msteams.dms["<user_id>"].historyLimit`.

## Izin RSC Teams saat ini (manifes)

Berikut adalah **izin resourceSpecific yang ada** dalam manifes aplikasi Teams kami. Izin tersebut hanya berlaku di dalam tim/obrolan tempat aplikasi diinstal.

**Untuk kanal (cakupan tim):**

- `ChannelMessage.Read.Group` (Aplikasi) - menerima semua pesan kanal tanpa @mention
- `ChannelMessage.Send.Group` (Aplikasi)
- `Member.Read.Group` (Aplikasi)
- `Owner.Read.Group` (Aplikasi)
- `ChannelSettings.Read.Group` (Aplikasi)
- `TeamMember.Read.Group` (Aplikasi)
- `TeamSettings.Read.Group` (Aplikasi)

**Untuk obrolan grup:**

- `ChatMessage.Read.Chat` (Aplikasi) - menerima semua pesan obrolan grup tanpa @mention

Tambahkan izin RSC melalui CLI Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Contoh manifes Teams (disunting)

Contoh minimal yang valid dengan bidang yang diwajibkan. Ganti ID dan URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Organisasi Anda",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw di Teams", full: "OpenClaw di Teams" },
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

### Catatan penting manifes (bidang wajib)

- `bots[].botId` **harus** cocok dengan ID Aplikasi Azure Bot.
- `webApplicationInfo.id` **harus** cocok dengan ID Aplikasi Azure Bot.
- `bots[].scopes` harus menyertakan permukaan yang akan Anda gunakan (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` diperlukan untuk penanganan berkas dalam cakupan pribadi.
- `authorization.permissions.resourceSpecific` harus menyertakan baca/kirim kanal untuk lalu lintas kanal.

### Memperbarui aplikasi yang ada

```bash
# Unduh, edit, dan unggah ulang manifes
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json secara lokal...
teams app manifest upload manifest.json <teamsAppId>
# Versi dinaikkan otomatis jika konten berubah
```

Setelah memperbarui, instal ulang aplikasi di setiap tim, lalu **tutup sepenuhnya dan luncurkan ulang Teams** (bukan hanya menutup jendela) untuk menghapus metadata aplikasi yang tersimpan dalam cache.

<details>
<summary>Pembaruan manifes secara manual (tanpa CLI)</summary>

1. Perbarui `manifest.json` dengan pengaturan baru.
2. **Naikkan nilai bidang `version`** (misalnya, `1.0.0` → `1.1.0`).
3. **Zip ulang** manifes beserta ikon (`manifest.json`, `outline.png`, `color.png`).
4. Unggah berkas zip baru:
   - **Teams Admin Center:** Teams apps → Manage apps → temukan aplikasi Anda → Upload new version.
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Kemampuan: hanya RSC vs Graph

### Dengan **hanya RSC Teams** (aplikasi diinstal, tanpa izin Graph API)

Berfungsi:

- Membaca konten **teks** pesan kanal.
- Mengirim konten **teks** pesan kanal.
- Menerima lampiran berkas **pribadi (DM)**.

TIDAK berfungsi:

- **Konten gambar atau berkas** kanal/grup (payload hanya menyertakan stub HTML).
- Mengunduh lampiran yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan selain peristiwa Webhook langsung.

### Dengan **RSC Teams + izin Aplikasi Microsoft Graph**

Menambahkan:

- Mengunduh konten yang dihosting (gambar yang ditempelkan ke pesan).
- Mengunduh lampiran berkas yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan kanal/obrolan melalui Graph.

### RSC vs Graph API

| Kemampuan                   | Izin RSC                  | Graph API                                  |
| --------------------------- | ------------------------- | ------------------------------------------ |
| **Pesan waktu nyata**       | Ya (melalui webhook)      | Tidak (hanya polling)                      |
| **Pesan historis**          | Tidak                     | Ya (dapat mengkueri riwayat)               |
| **Kompleksitas penyiapan**  | Hanya manifes aplikasi    | Memerlukan persetujuan admin + alur token  |
| **Berfungsi saat offline**  | Tidak (harus tetap aktif) | Ya (dapat mengkueri kapan saja)            |

**Kesimpulan:** RSC digunakan untuk pemantauan waktu nyata; Graph API digunakan untuk akses historis. Untuk mengambil pesan yang terlewat saat offline, diperlukan Graph API dengan `ChannelMessage.Read.All` (memerlukan persetujuan admin).

## Media + riwayat yang didukung Graph

Aktifkan hanya izin aplikasi Microsoft Graph yang diperlukan untuk cakupan Teams dan data yang digunakan:

1. Entra ID (Azure AD) **App Registration** → tambahkan **Application permissions** Graph:
   - `ChannelMessage.Read.All` untuk lampiran saluran dan riwayat saluran.
   - `Chat.Read.All` untuk lampiran obrolan grup dan riwayat obrolan grup.
   - `Files.Read.All` ketika byte lampiran harus diunduh dari penyimpanan SharePoint/OneDrive; penyiapan khusus riwayat tidak memerlukannya.
2. **Grant admin consent** untuk tenant.
3. Naikkan **versi manifes** aplikasi Teams, unggah ulang, dan **instal ulang aplikasi di Teams**.
4. **Tutup sepenuhnya dan jalankan kembali Teams** untuk menghapus metadata aplikasi yang di-cache.

### Pemulihan file saluran/grup (`graphMediaFallback`)

Teams dapat menghapus penanda file dari aktivitas HTML yang dikirimkan ke bot. Dalam kasus tersebut, aktivitas Bot Framework tidak dapat dibedakan dari pesan HTML biasa; referensi lampiran lengkap hanya tersedia pada salinan pesan di Graph.

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

Ini hanya berlaku untuk saluran dan obrolan grup. Fitur ini menambahkan satu pencarian pesan Graph setiap kali aktivitas HTML tidak menghasilkan media yang dapat diunduh secara langsung, termasuk pesan biasa atau pesan yang hanya berisi sebutan. Nilai defaultnya adalah `false` agar instalasi yang sudah ada tidak secara otomatis menghasilkan lalu lintas Graph tambahan atau kesalahan izin.

**Sebutan pengguna:** @sebutan langsung berfungsi untuk pengguna yang sudah ada dalam percakapan. Untuk mencari dan menyebut secara dinamis pengguna yang **tidak ada dalam percakapan saat ini**, tambahkan izin `User.Read.All` (Application) dan berikan persetujuan admin.

## Keterbatasan yang diketahui

### Batas waktu webhook

Teams mengirimkan pesan melalui webhook HTTP. OpenClaw menerapkan batas waktu server HTTP tetap pada pemroses webhook tersebut: 30 detik tanpa aktivitas, total permintaan 30 detik, dan 15 detik untuk menerima header. Media masuk opsional dan pengayaan konteks memiliki anggaran bersama 10 detik, tetapi SDK Teams tetap menunggu giliran agen sebelum mengembalikan respons webhook. Jika keseluruhan giliran melebihi jendela percobaan ulang Teams, hal berikut mungkin terjadi:

- Teams mencoba mengirim ulang pesan (menyebabkan duplikasi).
- Balasan tidak terkirim.

Balasan dikirim secara proaktif setelah agen merespons, tetapi eksekusi agen yang lambat masih dapat memicu percobaan ulang atau duplikasi di sisi Teams.

### Dukungan cloud Teams dan URL layanan

Jalur Teams berbasis SDK ini divalidasi secara langsung untuk cloud publik Microsoft Teams.

Balasan masuk menggunakan konteks giliran SDK Teams yang masuk. Operasi proaktif di luar konteks—pengiriman, pengeditan, penghapusan, kartu, jajak pendapat, pesan persetujuan file, dan balasan berdurasi panjang dalam antrean—menggunakan referensi percakapan tersimpan `serviceUrl`. Cloud publik secara default menggunakan lingkungan cloud publik SDK Teams dan mengizinkan referensi tersimpan pada host Teams Connector publik: `https://smba.trafficmanager.net/`.

Cloud publik adalah nilai default. `channels.msteams.cloud` atau `channels.msteams.serviceUrl` tidak perlu ditetapkan untuk bot cloud publik biasa.

Untuk cloud Teams nonpublik, tetapkan `cloud` dan batas proaktif yang sesuai ketika Microsoft menyediakannya:

- `channels.msteams.cloud` memilih preset cloud SDK Teams untuk autentikasi, validasi JWT, layanan token, dan cakupan Graph.
- `channels.msteams.serviceUrl` memilih batas titik akhir Bot Connector yang digunakan untuk memvalidasi referensi percakapan tersimpan sebelum pengiriman, pengeditan, penghapusan, kartu, jajak pendapat, pesan persetujuan file, dan balasan berdurasi panjang dalam antrean secara proaktif. Ini diperlukan untuk cloud SDK USGov dan DoD. Untuk China/21Vianet, OpenClaw menggunakan preset SDK `China` dan hanya menerima URL layanan tersimpan/terkonfigurasi pada host saluran Azure China Bot Framework.

Microsoft menerbitkan titik akhir Bot Connector proaktif global dalam bagian [Membuat percakapan](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) pada dokumentasi perpesanan proaktif Teams. Gunakan `serviceUrl` dari aktivitas masuk jika tersedia; jika tidak, gunakan tabel Microsoft di bawah ini.

| Lingkungan Teams | Konfigurasi OpenClaw                                             | `serviceUrl` proaktif                             |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| Publik           | tidak memerlukan konfigurasi cloud/serviceUrl                    | `https://smba.trafficmanager.net/teams`                                      |
| GCC              | tetapkan `serviceUrl`; tidak ada preset cloud SDK Teams terpisah | `https://smba.infra.gcc.teams.microsoft.com/teams`                                 |
| GCC High         | `cloud: "USGov"` + `serviceUrl`                          | `https://smba.infra.gov.teams.microsoft.us/teams`                                      |
| DoD              | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`                                      |
| China/21Vianet   | `cloud: "China"`                                               | gunakan `serviceUrl` dari aktivitas masuk         |

Contoh untuk GCC, ketika Microsoft mendokumentasikan URL layanan proaktif terpisah tetapi SDK Teams tidak menyediakan preset cloud GCC terpisah:

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

`channels.msteams.serviceUrl` dibatasi pada host Microsoft Teams Bot Connector yang didukung. Saat URL layanan dikonfigurasi, OpenClaw memeriksa bahwa `serviceUrl` percakapan tersimpan menggunakan host yang sama sebelum pengiriman, pengeditan, penghapusan, kartu, jajak pendapat, atau balasan berdurasi panjang dalam antrean secara proaktif dijalankan. Dengan konfigurasi cloud publik default, OpenClaw gagal secara tertutup jika percakapan tersimpan mengarah ke luar host Teams Connector publik. Terima pesan baru dari percakapan setelah mengubah pengaturan cloud/URL layanan agar referensi percakapan tersimpan tetap mutakhir.

China/21Vianet tidak memiliki URL `smba` proaktif global terpisah dalam tabel titik akhir proaktif Teams milik Microsoft. Konfigurasikan `cloud: "China"` agar SDK Teams menggunakan titik akhir autentikasi, token, dan JWT Azure China. Pengiriman proaktif kemudian memerlukan referensi percakapan tersimpan dari aktivitas Teams China yang masuk, atau URL layanan yang dikonfigurasi secara eksplisit, pada batas saluran Azure China Bot Framework (`*.botframework.azure.cn`). Pembantu Teams berbasis Graph dinonaktifkan untuk `cloud: "China"` hingga OpenClaw merutekan permintaan Graph melalui titik akhir Graph Azure China.

### Pemformatan

Markdown Teams lebih terbatas daripada Slack atau Discord:

- Pemformatan dasar berfungsi: **tebal**, _miring_, `code`, tautan.
- Markdown kompleks (tabel, daftar bertingkat) mungkin tidak dirender dengan benar.
- Adaptive Cards didukung untuk jajak pendapat dan pengiriman presentasi semantik (lihat di bawah).

## Konfigurasi

Pengaturan utama (lihat [/gateway/configuration](/id/gateway/configuration) untuk pola saluran bersama):

- `channels.msteams.enabled`: aktifkan/nonaktifkan saluran.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: kredensial bot.
- `channels.msteams.cloud`: lingkungan cloud SDK Teams (`Public`, `USGov`, `USGovDoD`, atau `China`; default `Public`). Atur dengan `serviceUrl` untuk cloud SDK USGov/DoD; Tiongkok menggunakan preset SDK dan referensi percakapan Azure China Bot Framework yang tersimpan, dengan pembantu berbasis Graph dinonaktifkan hingga perutean Azure China Graph tersedia.
- `channels.msteams.serviceUrl`: batas URL layanan Bot Connector untuk operasi proaktif SDK. Cloud publik menggunakan default SDK; atur untuk GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High, atau DoD. Tiongkok menerima host saluran Azure China Bot Framework ketika referensi percakapan yang tersimpan berasal dari Teams yang dioperasikan oleh 21Vianet.
- `channels.msteams.webhook.port` (default `3978`).
- `channels.msteams.webhook.path` (default `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (default `pairing`).
- `channels.msteams.allowFrom`: daftar izin DM (ID objek AAD disarankan). Wizard mengubah nama menjadi ID selama penyiapan ketika akses Graph tersedia.
- `channels.msteams.dangerouslyAllowNameMatching`: sakelar darurat untuk mengaktifkan kembali pencocokan UPN/nama tampilan yang dapat berubah dan perutean langsung berdasarkan nama tim/saluran.
- `channels.msteams.textChunkLimit`: ukuran potongan teks keluar dalam karakter (default `4000`, dan dibatasi secara mutlak pada `4000` terlepas dari nilai konfigurasi yang lebih tinggi).
- `channels.msteams.streaming.chunkMode`: `length` (default) atau `newline` untuk membagi pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.msteams.mediaAllowHosts`: daftar izin host lampiran masuk (default-nya domain Microsoft/Teams: Graph, SharePoint/OneDrive, Teams CDN, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: daftar izin untuk menyertakan header Authorization pada percobaan ulang media (default-nya host Graph + Bot Framework).
- `channels.msteams.graphMediaFallback`: ikut menggunakan pencarian pesan Graph ketika HTML saluran/grup tidak menyertakan penanda file (default `false`; lihat [Pemulihan file saluran/grup](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: penggantian batas ukuran media per saluran dalam MB. Kembali menggunakan `agents.defaults.mediaMaxMb` jika tidak diatur.
- `channels.msteams.requireMention`: wajibkan @mention di saluran/grup (default `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (lihat [Gaya balasan](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: penggantian per tim.
- `channels.msteams.teams.<teamId>.requireMention`: penggantian per tim.
- `channels.msteams.teams.<teamId>.tools`: penggantian kebijakan alat default per tim (`allow`/`deny`/`alsoAllow`) yang digunakan ketika penggantian saluran tidak ada.
- `channels.msteams.teams.<teamId>.toolsBySender`: penggantian kebijakan alat default per tim per pengirim (wildcard `"*"` didukung).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: penggantian per saluran.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: penggantian per saluran.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: penggantian kebijakan alat per saluran (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: penggantian kebijakan alat per saluran per pengirim (wildcard `"*"` didukung).
- Kunci `toolsBySender` harus menggunakan prefiks eksplisit: `channel:`, `id:`, `e164:`, `username:`, `name:` (kunci lama tanpa prefiks tetap hanya dipetakan ke `id:`).
- `channels.msteams.authType`: jenis autentikasi - `"secret"` (default) atau `"federated"`.
- `channels.msteams.certificatePath`: jalur ke file sertifikat PEM (autentikasi federasi + sertifikat).
- `channels.msteams.certificateThumbprint`: thumbprint sertifikat; diterima, tidak diwajibkan untuk autentikasi.
- `channels.msteams.useManagedIdentity`: aktifkan autentikasi identitas terkelola (mode federasi).
- `channels.msteams.managedIdentityClientId`: ID klien untuk identitas terkelola yang ditetapkan pengguna.
- `channels.msteams.sharePointSiteId`: ID situs SharePoint untuk unggahan file di obrolan grup/saluran (lihat [Mengirim file dalam obrolan grup](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Adaptive Card sambutan yang ditampilkan saat kontak DM/grup pertama, serta tombol prompt yang disarankan.
- `channels.msteams.responsePrefix`: teks yang ditambahkan sebagai prefiks pada balasan keluar.
- `channels.msteams.feedbackEnabled` (default `true`), `channels.msteams.feedbackReflection` (default `true`), `channels.msteams.feedbackReflectionCooldownMs`: umpan balik jempol naik/turun pada balasan dan tindak lanjut refleksi untuk umpan balik negatif.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: koneksi OAuth Bot Framework dan cakupan Graph yang didelegasikan untuk alur berbasis SSO; `sso.enabled: true` memerlukan `sso.connectionName`.

## Perutean dan sesi

- Kunci sesi mengikuti format agen standar (lihat [/concepts/session](/id/concepts/session)):
  - Pesan langsung berbagi sesi utama (`agent:<agentId>:<mainKey>`).
  - Pesan saluran/grup menggunakan ID percakapan:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Gaya balasan: utas vs kiriman

Teams memiliki dua gaya UI saluran di atas model data dasar yang sama:

| Gaya                     | Deskripsi                                                     | `replyStyle` yang disarankan |
| ------------------------ | ------------------------------------------------------------- | ------------------------ |
| **Kiriman** (klasik)     | Pesan tampil sebagai kartu dengan balasan berutas di bawahnya | `thread` (default)       |
| **Utas** (seperti Slack) | Pesan mengalir secara linear, lebih menyerupai Slack          | `top-level`              |

**Masalahnya:** API Teams tidak mengungkap gaya UI yang digunakan suatu saluran. Jika Anda menggunakan `replyStyle` yang salah:

- `thread` di saluran bergaya Utas → balasan tampak bertingkat secara canggung.
- `top-level` di saluran bergaya Kiriman → balasan tampak sebagai kiriman tingkat atas terpisah, bukan di dalam utas.

**Solusi:** konfigurasikan `replyStyle` per saluran berdasarkan cara saluran disiapkan:

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

Saat bot mengirim balasan ke saluran, `replyStyle` diresolusikan dari penggantian yang paling spesifik hingga default. Nilai pertama yang bukan `undefined` digunakan:

1. **Per saluran** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Per tim** - `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** - `channels.msteams.replyStyle`
4. **Default implisit** - diturunkan dari `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Jika Anda mengatur `requireMention: false` secara global tanpa `replyStyle` yang eksplisit, mention di saluran bergaya Kiriman muncul sebagai kiriman tingkat atas meskipun pesan masuk merupakan balasan utas. Tetapkan `replyStyle: "thread"` di tingkat global, tim, atau saluran untuk menghindari hasil yang tidak terduga.

Untuk pengiriman proaktif ke percakapan saluran yang tersimpan (balasan panggilan alat yang diantrekan, agen yang berjalan lama), resolusi tim/saluran yang sama berlaku; obrolan grup dan percakapan pribadi (DM) selalu diresolusikan menjadi `top-level` untuk pengiriman proaktif terlepas dari `replyStyle`.

### Pemeliharaan konteks utas

Ketika `replyStyle: "thread"` berlaku dan bot di-@mention dari dalam utas saluran, OpenClaw melampirkan kembali akar utas asli ke referensi percakapan keluar (`19:...@thread.tacv2;messageid=<root>`) agar balasan masuk ke utas yang sama. Ini berlaku untuk pengiriman langsung (dalam giliran) maupun pengiriman proaktif yang dilakukan setelah konteks giliran Bot Framework kedaluwarsa (misalnya, agen yang berjalan lama, balasan panggilan alat yang diantrekan melalui `mcp__openclaw__message`).

Akar utas diambil dari `threadId` yang tersimpan pada referensi percakapan. Referensi lama yang tersimpan sebelum adanya `threadId` kembali menggunakan `activityId` (aktivitas masuk apa pun yang terakhir kali menginisialisasi percakapan), sehingga deployment yang ada tetap berfungsi tanpa inisialisasi ulang.

Ketika `replyStyle: "top-level"` berlaku, pesan masuk dari utas saluran sengaja dijawab sebagai kiriman tingkat atas baru; tidak ada sufiks utas yang dilampirkan. Ini benar untuk saluran bergaya Utas; kiriman tingkat atas ketika Anda mengharapkan balasan berutas berarti `replyStyle` diatur secara keliru untuk saluran tersebut.

## Lampiran dan gambar

**Batasan saat ini:**

- **DM:** gambar dan lampiran file berfungsi melalui API file bot Teams.
- **Saluran/grup:** lampiran berada di penyimpanan M365 (SharePoint/OneDrive). Payload Webhook hanya menyertakan stub HTML, bukan byte file sebenarnya. **Izin Graph API diwajibkan** untuk mengunduh lampiran saluran.
- Untuk pengiriman eksplisit yang mengutamakan file, gunakan `action=upload-file` dengan `media` / `filePath` / `path`; `message` opsional menjadi teks/komentar pendamping, dan `filename` (atau `title`) mengganti nama file yang diunggah.

Tanpa izin Graph, pesan saluran dengan gambar diterima sebagai teks saja (konten gambar tidak dapat diakses oleh bot).
Secara default, OpenClaw hanya mengunduh media dari nama host Microsoft/Teams. Ganti dengan `channels.msteams.mediaAllowHosts` (gunakan `["*"]` untuk mengizinkan semua host).
Header Authorization hanya disertakan untuk host dalam `channels.msteams.mediaAuthAllowHosts` (default-nya host Graph + Bot Framework). Pertahankan daftar ini secara ketat (hindari sufiks multi-tenant).

## Mengirim file dalam obrolan grup

Bot dapat mengirim file dalam DM menggunakan alur FileConsentCard bawaan. **Mengirim file dalam obrolan grup/saluran** memerlukan penyiapan tambahan:

| Konteks                  | Cara file dikirim                              | Penyiapan yang diperlukan                         |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------- |
| **DM**                   | FileConsentCard → pengguna menerima → bot mengunggah | Langsung berfungsi                                |
| **Obrolan grup/saluran** | Unggah ke SharePoint → kartu file native        | Memerlukan `sharePointSiteId` + izin Graph        |
| **Gambar (konteks apa pun)** | Inline yang dikodekan dengan Base64         | Langsung berfungsi                                |

### Mengapa obrolan grup memerlukan SharePoint

Bot menggunakan identitas aplikasi, sedangkan sumber daya `/me` Microsoft Graph [memerlukan pengguna yang sudah masuk](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Untuk mengirim file dalam obrolan grup/saluran, bot mengunggahnya ke **situs SharePoint** dan membuat tautan berbagi.

### Penyiapan

1. **Tambahkan izin Graph API** di Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - unggah file ke SharePoint.
   - `ChatMember.Read.All` (Application) - izin tingkat tenant dengan hak istimewa paling rendah untuk pengiriman file obrolan grup. `Chat.Read.All` juga berfungsi dan sudah mencakup ini ketika riwayat obrolan grup diaktifkan. Sebagai alternatif per obrolan, gunakan [izin persetujuan khusus sumber daya](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`.
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

| Konteks dan izin                                                        | Perilaku berbagi                                               |
| ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| Saluran + `Sites.ReadWrite.All`                                            | Tautan berbagi untuk seluruh organisasi (siapa pun di organisasi dapat mengakses) |
| Obrolan grup + `Sites.ReadWrite.All` + izin baca anggota obrolan yang didukung | Tautan berbagi per pengguna (hanya anggota obrolan yang dapat mengakses) |
| Obrolan grup tanpa izin baca anggota obrolan yang didukung               | Pengiriman gagal secara tertutup                               |

Berbagi per pengguna lebih aman karena hanya peserta obrolan yang dapat mengakses file. OpenClaw memerlukan pencarian anggota yang berhasil untuk obrolan grup; batas waktu, kegagalan transportasi, hasil kosong, dan penolakan Graph API akan menggagalkan pengiriman alih-alih memperluas akses ke seluruh organisasi.

### Perilaku fallback

| Skenario                                                          | Hasil                                             |
| ----------------------------------------------------------------- | ------------------------------------------------- |
| Obrolan grup + file + izin SharePoint dan anggota dikonfigurasi   | Unggah ke SharePoint, kirim kartu file native     |
| Obrolan grup + file + izin SharePoint atau anggota tidak tersedia | Gagal dengan kesalahan konfigurasi yang dapat ditindaklanjuti |
| Saluran + file + `sharePointSiteId` dikonfigurasi                 | Unggah ke SharePoint, kirim kartu file native     |
| Obrolan pribadi + file                                            | Alur FileConsentCard (berfungsi tanpa SharePoint) |
| Konteks apa pun + gambar                                          | Inline berkode Base64 (berfungsi tanpa SharePoint) |

### Lokasi penyimpanan file

File yang diunggah disimpan dalam folder `/OpenClawShared/` di pustaka dokumen default situs SharePoint yang dikonfigurasi.

## Jajak pendapat (Adaptive Cards)

OpenClaw mengirim jajak pendapat Teams sebagai Adaptive Cards (tidak ada API jajak pendapat native Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Suara dicatat oleh Gateway dalam SQLite status Plugin OpenClaw di bawah `state/openclaw.sqlite`.
- File `msteams-polls.json` yang sudah ada diimpor oleh `openclaw doctor --fix`, bukan oleh Plugin yang sedang berjalan.
- Gateway harus tetap online untuk mencatat suara.
- Jajak pendapat tidak memposting ringkasan hasil secara otomatis, dan belum ada CLI hasil jajak pendapat.

## Kartu presentasi

Kirim payload presentasi semantik kepada pengguna atau percakapan Teams menggunakan alat `message`, CLI, atau pengiriman balasan biasa. OpenClaw merendernya sebagai Teams Adaptive Cards dari kontrak presentasi generik.

Parameter `presentation` menerima blok semantik. Saat `presentation` diberikan, teks pesan bersifat opsional. Tombol dirender sebagai tindakan kirim atau URL Adaptive Card. Menu pilihan tidak tersedia secara native dalam perender Teams, sehingga OpenClaw menurunkannya menjadi teks yang mudah dibaca sebelum pengiriman.

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

| Jenis target        | Format                           | Contoh                                                                                                  |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Pengguna (berdasarkan ID) | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                                                      |
| Pengguna (berdasarkan nama) | `user:<display-name>`          | `user:John Smith` (memerlukan Graph API)                                                               |
| Grup/saluran        | `conversation:<conversation-id>`               | `conversation:19:abc123...@thread.tacv2`                                                                                      |
| Grup/saluran (mentah) | `<conversation-id>`             | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces`, atau id Bot Framework `a:`/`8:orgid:`/`29:` tanpa prefiks |

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
Tanpa prefiks `user:`, nama secara default diresolusi sebagai grup atau tim. Selalu gunakan `user:` saat menargetkan orang berdasarkan nama tampilan.
</Note>

## Pesan proaktif

- Pesan proaktif hanya dapat dikirim **setelah** pengguna berinteraksi karena OpenClaw menyimpan referensi percakapan pada saat itu.
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

- Kunci tim = segmen jalur setelah `/team/` (setelah didekode dari URL, misalnya `19:Bk4j...@thread.tacv2`; tenant lama mungkin menampilkan `@thread.skype`, yang juga valid).
- Kunci saluran = segmen jalur setelah `/channel/` (setelah didekode dari URL).
- **Abaikan** parameter kueri `groupId` untuk perutean OpenClaw. Parameter tersebut merupakan ID grup Microsoft Entra, bukan ID percakapan Bot Framework yang digunakan dalam aktivitas Teams masuk.

## Saluran privat

Bot memiliki dukungan terbatas di saluran privat:

| Fitur                        | Saluran standar | Saluran privat             |
| ---------------------------- | --------------- | -------------------------- |
| Instalasi bot                | Ya              | Terbatas                   |
| Pesan waktu nyata (Webhook)  | Ya              | Mungkin tidak berfungsi    |
| Izin RSC                     | Ya              | Mungkin berperilaku berbeda |
| @mention                     | Ya              | Jika bot dapat diakses     |
| Riwayat Graph API            | Ya              | Ya (dengan izin)           |

**Solusi sementara jika saluran privat tidak berfungsi:**

1. Gunakan saluran standar untuk interaksi dengan bot.
2. Gunakan DM; pengguna selalu dapat mengirim pesan langsung kepada bot.
3. Gunakan Graph API untuk akses historis (memerlukan `ChannelMessage.Read.All`).

## Pemecahan masalah

### Masalah umum

- **Gambar tidak muncul di saluran:** izin Graph atau persetujuan admin tidak tersedia. Instal ulang aplikasi Teams, lalu tutup sepenuhnya dan buka kembali Teams.
- **Tidak ada respons di saluran:** mention diperlukan secara default; tetapkan `channels.msteams.requireMention=false` atau konfigurasikan per tim/saluran.
- **Ketidakcocokan versi (Teams masih menampilkan manifes lama):** hapus dan tambahkan kembali aplikasi, lalu tutup sepenuhnya Teams untuk menyegarkannya.
- **401 Unauthorized dari Webhook:** ini wajar saat menguji secara manual tanpa JWT Azure; artinya endpoint dapat dijangkau, tetapi autentikasi gagal. Gunakan Azure Web Chat untuk melakukan pengujian dengan benar.

### Kesalahan pengunggahan manifes

- **"Icon file cannot be empty":** manifes merujuk ke file ikon berukuran 0 byte. Buat ikon PNG yang valid (32x32 untuk `outline.png`, 192x192 untuk `color.png`).
- **"webApplicationInfo.Id already in use":** aplikasi masih terinstal di tim/obrolan lain. Temukan dan hapus instalasinya terlebih dahulu, atau tunggu 5-10 menit hingga perubahan diterapkan.
- **"Something went wrong" saat mengunggah:** unggah melalui [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) sebagai gantinya, buka DevTools browser (F12) → tab Network, lalu periksa isi respons untuk melihat kesalahan sebenarnya.
- **Sideload gagal:** coba "Upload an app to your org's app catalog", bukan "Upload a custom app"; ini sering melewati pembatasan sideload.

### Izin RSC tidak berfungsi

1. Verifikasikan bahwa `webApplicationInfo.id` sama persis dengan App ID bot Anda.
2. Unggah ulang aplikasi dan instal kembali di tim/obrolan.
3. Periksa apakah admin organisasi Anda telah memblokir izin RSC.
4. Pastikan Anda menggunakan cakupan yang benar: `ChannelMessage.Read.Group` untuk tim, `ChatMessage.Read.Chat` untuk obrolan grup.

## Referensi

- [Buat Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - panduan penyiapan Azure Bot
- [Portal Pengembang Teams](https://dev.teams.microsoft.com/apps) - buat/kelola aplikasi Teams
- [Skema manifes aplikasi Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Terima pesan saluran dengan RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referensi izin RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Penanganan file bot Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (saluran/grup memerlukan Graph)
- [Pesan proaktif](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI Teams untuk pengelolaan bot

## Terkait

- [Ikhtisar Saluran](/id/channels) - semua saluran yang didukung
- [Pemasangan](/id/channels/pairing) - autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) - perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Perutean Saluran](/id/channels/channel-routing) - perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) - model akses dan penguatan keamanan
