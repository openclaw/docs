---
read_when:
    - Mengerjakan fitur saluran Microsoft Teams
summary: status dukungan bot Microsoft Teams, kapabilitas, dan konfigurasi
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-26T11:23:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

Status: teks + lampiran DM didukung; pengiriman file saluran/grup memerlukan `sharePointSiteId` + izin Graph (lihat [Mengirim file di obrolan grup](#sending-files-in-group-chats)). Poll dikirim melalui Adaptive Cards. Aksi pesan mengekspos `upload-file` yang eksplisit untuk pengiriman yang mengutamakan file.

## Plugin bawaan

Microsoft Teams dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi
tidak diperlukan instalasi terpisah dalam build paket normal.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Teams bawaan,
instal secara manual:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) menangani registrasi bot, pembuatan manifest, dan pembuatan kredensial dalam satu perintah.

**1. Instal dan login**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verifikasi Anda sudah login dan melihat info tenant Anda
```

> **Catatan:** Teams CLI saat ini masih dalam pratinjau. Perintah dan flag dapat berubah antar rilis.

**2. Mulai tunnel** (Teams tidak dapat menjangkau localhost)

Instal dan autentikasi devtunnel CLI jika Anda belum melakukannya ([panduan memulai](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Penyiapan satu kali (URL persisten antar sesi):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Setiap sesi pengembangan:
devtunnel host my-openclaw-bot
# Endpoint Anda: https://<tunnel-id>.devtunnels.ms/api/messages
```

> **Catatan:** `--allow-anonymous` diperlukan karena Teams tidak dapat mengautentikasi dengan devtunnels. Setiap permintaan bot masuk tetap divalidasi secara otomatis oleh SDK Teams.

Alternatif: `ngrok http 3978` atau `tailscale funnel 3978` (tetapi ini dapat mengubah URL setiap sesi).

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
- Mendaftarkan bot (dikelola Teams secara default — tidak memerlukan langganan Azure)

Output akan menampilkan `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`, dan **Teams App ID** — catat ini untuk langkah berikutnya. Perintah ini juga menawarkan untuk langsung menginstal aplikasi di Teams.

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

`teams app create` akan meminta Anda menginstal aplikasi — pilih "Install in Teams". Jika Anda melewatkannya, Anda dapat memperoleh tautannya nanti:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifikasi semuanya berfungsi**

```bash
teams app doctor <teamsAppId>
```

Ini menjalankan diagnostik pada registrasi bot, konfigurasi aplikasi AAD, validitas manifest, dan penyiapan SSO.

Untuk deployment produksi, pertimbangkan menggunakan [autentikasi federasi](#federated-authentication-certificate--managed-identity) (sertifikat atau managed identity) alih-alih client secret.

Catatan: obrolan grup diblokir secara default (`channels.msteams.groupPolicy: "allowlist"`). Untuk mengizinkan balasan grup, setel `channels.msteams.groupAllowFrom` (atau gunakan `groupPolicy: "open"` untuk mengizinkan anggota mana pun, dengan gating mention).

## Tujuan

- Berbicara dengan OpenClaw melalui DM Teams, obrolan grup, atau saluran.
- Menjaga perutean tetap deterministik: balasan selalu kembali ke saluran tempat asalnya.
- Default ke perilaku saluran yang aman (mention wajib kecuali dikonfigurasi lain).

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
- Jangan mengandalkan pencocokan UPN/nama tampilan untuk allowlist — nilainya dapat berubah. OpenClaw menonaktifkan pencocokan nama langsung secara default; aktifkan secara eksplisit dengan `channels.msteams.dangerouslyAllowNameMatching: true`.
- Wizard dapat menyelesaikan nama ke ID melalui Microsoft Graph jika kredensial mengizinkan.

**Akses grup**

- Default: `channels.msteams.groupPolicy = "allowlist"` (diblokir kecuali Anda menambahkan `groupAllowFrom`). Gunakan `channels.defaults.groupPolicy` untuk menimpa default saat tidak disetel.
- `channels.msteams.groupAllowFrom` mengontrol pengirim mana yang dapat memicu di obrolan grup/saluran (fallback ke `channels.msteams.allowFrom`).
- Setel `groupPolicy: "open"` untuk mengizinkan anggota mana pun (masih di-gate oleh mention secara default).
- Untuk mengizinkan **tidak ada saluran**, setel `channels.msteams.groupPolicy: "disabled"`.

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

**Allowlist Teams + saluran**

- Batasi balasan grup/saluran dengan mencantumkan teams dan saluran di bawah `channels.msteams.teams`.
- Kunci harus menggunakan team ID dan channel conversation ID yang stabil.
- Saat `groupPolicy="allowlist"` dan allowlist teams ada, hanya teams/saluran yang tercantum yang diterima (dengan gating mention).
- Wizard konfigurasi menerima entri `Team/Channel` dan menyimpannya untuk Anda.
- Saat startup, OpenClaw menyelesaikan nama team/channel dan nama pengguna di allowlist ke ID (jika izin Graph mengizinkan)
  dan mencatat pemetaannya; nama team/channel yang tidak terselesaikan tetap disimpan seperti diketik tetapi diabaikan untuk perutean secara default kecuali `channels.msteams.dangerouslyAllowNameMatching: true` diaktifkan.

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

1. Pastikan Plugin Microsoft Teams tersedia (dibundel dalam rilis saat ini).
2. Buat **Azure Bot** (App ID + secret + tenant ID).
3. Bangun **paket aplikasi Teams** yang merujuk ke bot dan menyertakan izin RSC di bawah ini.
4. Unggah/instal aplikasi Teams ke dalam sebuah team (atau scope personal untuk DM).
5. Konfigurasikan `msteams` di `~/.openclaw/openclaw.json` (atau variabel lingkungan) dan mulai gateway.
6. Gateway mendengarkan traffic webhook Bot Framework di `/api/messages` secara default.

### Langkah 1: Buat Azure Bot

1. Buka [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Isi tab **Basics**:

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nama bot Anda, misalnya `openclaw-msteams` (harus unik) |
   | **Subscription**   | Pilih langganan Azure Anda                               |
   | **Resource group** | Buat baru atau gunakan yang sudah ada                    |
   | **Pricing tier**   | **Free** untuk pengembangan/pengujian                    |
   | **Type of App**    | **Single Tenant** (disarankan - lihat catatan di bawah) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Pemberitahuan deprekasi:** Pembuatan bot multi-tenant baru dihentikan setelah 2025-07-31. Gunakan **Single Tenant** untuk bot baru.

3. Klik **Review + create** → **Create** (tunggu ~1-2 menit)

### Langkah 2: Dapatkan Kredensial

1. Buka resource Azure Bot Anda → **Configuration**
2. Salin **Microsoft App ID** → ini adalah `appId` Anda
3. Klik **Manage Password** → buka App Registration
4. Di **Certificates & secrets** → **New client secret** → salin **Value** → ini adalah `appPassword` Anda
5. Buka **Overview** → salin **Directory (tenant) ID** → ini adalah `tenantId` Anda

### Langkah 3: Konfigurasikan Endpoint Pesan

1. Di Azure Bot → **Configuration**
2. Setel **Messaging endpoint** ke URL webhook Anda:
   - Produksi: `https://your-domain.com/api/messages`
   - Pengembangan lokal: gunakan tunnel (lihat [Pengembangan Lokal](#local-development-tunneling) di bawah)

### Langkah 4: Aktifkan Saluran Teams

1. Di Azure Bot → **Channels**
2. Klik **Microsoft Teams** → Configure → Save
3. Terima Terms of Service

### Langkah 5: Bangun Manifest Aplikasi Teams

- Sertakan entri `bot` dengan `botId = <App ID>`.
- Scope: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (diperlukan untuk penanganan file scope personal).
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

Saluran Teams dimulai secara otomatis saat Plugin tersedia dan konfigurasi `msteams` ada beserta kredensialnya.

</details>

## Autentikasi Federasi (Sertifikat + Managed Identity)

> Ditambahkan pada 2026.3.24

Untuk deployment produksi, OpenClaw mendukung **autentikasi federasi** sebagai alternatif yang lebih aman dibanding client secret. Dua metode tersedia:

### Opsi A: Autentikasi berbasis sertifikat

Gunakan sertifikat PEM yang terdaftar pada app registration Entra ID Anda.

**Penyiapan:**

1. Hasilkan atau peroleh sertifikat (format PEM dengan private key).
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

**Variabel lingkungan:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opsi B: Azure Managed Identity

Gunakan Azure Managed Identity untuk autentikasi tanpa kata sandi. Ini ideal untuk deployment pada infrastruktur Azure (AKS, App Service, Azure VM) yang memiliki managed identity.

**Cara kerjanya:**

1. Pod/VM bot memiliki managed identity (system-assigned atau user-assigned).
2. **Federated identity credential** menghubungkan managed identity ke app registration Entra ID.
3. Saat runtime, OpenClaw menggunakan `@azure/identity` untuk memperoleh token dari endpoint Azure IMDS (`169.254.169.254`).
4. Token diteruskan ke SDK Teams untuk autentikasi bot.

**Prasyarat:**

- Infrastruktur Azure dengan managed identity aktif (AKS workload identity, App Service, VM)
- Federated identity credential dibuat pada app registration Entra ID
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

**Konfigurasi (user-assigned managed identity):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (hanya untuk user-assigned)

### Penyiapan AKS Workload Identity

Untuk deployment AKS yang menggunakan workload identity:

1. **Aktifkan workload identity** pada cluster AKS Anda.
2. **Buat federated identity credential** pada app registration Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Tambahkan anotasi pada service account Kubernetes** dengan app client ID:

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

5. **Pastikan akses jaringan** ke IMDS (`169.254.169.254`) — jika menggunakan NetworkPolicy, tambahkan aturan egress yang mengizinkan traffic ke `169.254.169.254/32` pada port 80.

### Perbandingan jenis autentikasi

| Method               | Config                                         | Kelebihan                          | Kekurangan                            |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Penyiapan sederhana                | Perlu rotasi secret, kurang aman      |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Tidak ada secret bersama di jaringan | Overhead pengelolaan sertifikat     |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Tanpa kata sandi, tidak ada secret untuk dikelola | Memerlukan infrastruktur Azure |

**Perilaku default:** Saat `authType` tidak disetel, OpenClaw secara default menggunakan autentikasi client secret. Konfigurasi yang ada tetap berfungsi tanpa perubahan.

## Pengembangan Lokal (Tunneling)

Teams tidak dapat menjangkau `localhost`. Gunakan dev tunnel persisten agar URL Anda tetap sama di seluruh sesi:

```bash
# Penyiapan satu kali:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Setiap sesi pengembangan:
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

Memeriksa registrasi bot, aplikasi AAD, manifest, dan konfigurasi SSO dalam satu kali proses.

**Kirim pesan uji:**

1. Instal aplikasi Teams (gunakan tautan instalasi dari `teams app get <id> --install-link`)
2. Temukan bot di Teams dan kirim DM
3. Periksa log gateway untuk aktivitas masuk

## Variabel lingkungan

Semua kunci konfigurasi juga dapat disetel melalui variabel lingkungan:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (opsional: `"secret"` atau `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + sertifikat)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opsional, tidak diperlukan untuk autentikasi)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (hanya untuk user-assigned MI)

## Aksi info anggota

OpenClaw mengekspos aksi `member-info` berbasis Graph untuk Microsoft Teams agar agent dan automasi dapat menyelesaikan detail anggota saluran (nama tampilan, email, peran) langsung dari Microsoft Graph.

Persyaratan:

- Izin RSC `Member.Read.Group` (sudah ada dalam manifest yang direkomendasikan)
- Untuk lookup lintas team: izin Aplikasi Graph `User.Read.All` dengan admin consent

Aksi ini di-gate oleh `channels.msteams.actions.memberInfo` (default: diaktifkan saat kredensial Graph tersedia).

## Konteks riwayat

- `channels.msteams.historyLimit` mengontrol berapa banyak pesan saluran/grup terbaru yang dibungkus ke dalam prompt.
- Fallback ke `messages.groupChat.historyLimit`. Setel `0` untuk menonaktifkan (default 50).
- Riwayat thread yang diambil difilter oleh allowlist pengirim (`allowFrom` / `groupAllowFrom`), sehingga penyemaian konteks thread hanya mencakup pesan dari pengirim yang diizinkan.
- Konteks lampiran kutipan (`ReplyTo*` yang berasal dari HTML balasan Teams) saat ini diteruskan sebagaimana diterima.
- Dengan kata lain, allowlist mengatur siapa yang dapat memicu agent; hanya jalur konteks tambahan tertentu yang difilter saat ini.
- Riwayat DM dapat dibatasi dengan `channels.msteams.dmHistoryLimit` (giliran pengguna). Override per pengguna: `channels.msteams.dms["<user_id>"].historyLimit`.

## Izin RSC Teams Saat Ini (Manifest)

Berikut adalah **resourceSpecific permissions** yang **sudah ada** dalam manifest aplikasi Teams kami. Izin ini hanya berlaku di dalam team/chat tempat aplikasi diinstal.

**Untuk saluran (scope team):**

- `ChannelMessage.Read.Group` (Application) - menerima semua pesan saluran tanpa @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Untuk obrolan grup:**

- `ChatMessage.Read.Chat` (Application) - menerima semua pesan obrolan grup tanpa @mention

Untuk menambahkan izin RSC melalui Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Contoh Manifest Teams (disunting)

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
- `bots[].scopes` harus mencakup surface yang ingin Anda gunakan (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` diperlukan untuk penanganan file dalam scope personal.
- `authorization.permissions.resourceSpecific` harus mencakup izin baca/kirim saluran jika Anda menginginkan traffic saluran.

### Memperbarui aplikasi yang sudah ada

Untuk memperbarui aplikasi Teams yang sudah diinstal (misalnya, untuk menambahkan izin RSC):

```bash
# Unduh, edit, dan unggah ulang manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json secara lokal...
teams app manifest upload manifest.json <teamsAppId>
# Versi dinaikkan otomatis jika konten berubah
```

Setelah diperbarui, instal ulang aplikasi di setiap team agar izin baru berlaku, dan **keluar sepenuhnya lalu jalankan ulang Teams** (bukan sekadar menutup jendela) untuk membersihkan metadata aplikasi yang tersimpan di cache.

<details>
<summary>Pembaruan manifest manual (tanpa CLI)</summary>

1. Perbarui `manifest.json` Anda dengan pengaturan baru
2. **Naikkan field `version`** (misalnya, `1.0.0` → `1.1.0`)
3. **Zip ulang** manifest dengan ikon (`manifest.json`, `outline.png`, `color.png`)
4. Unggah zip baru:
   - **Teams Admin Center:** Teams apps → Manage apps → temukan aplikasi Anda → Upload new version
   - **Sideload:** Di Teams → Apps → Manage your apps → Upload a custom app

</details>

## Kapabilitas: hanya RSC vs Graph

### Dengan **Teams RSC saja** (aplikasi terinstal, tanpa izin Microsoft Graph API)

Berfungsi:

- Membaca konten **teks** pesan saluran.
- Mengirim konten **teks** pesan saluran.
- Menerima lampiran file **personal (DM)**.

Tidak berfungsi:

- Konten **gambar atau file** saluran/grup (payload hanya menyertakan stub HTML).
- Mengunduh lampiran yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan (di luar event webhook live).

### Dengan **Teams RSC + izin Aplikasi Microsoft Graph**

Menambahkan:

- Mengunduh hosted contents (gambar yang ditempel ke dalam pesan).
- Mengunduh lampiran file yang disimpan di SharePoint/OneDrive.
- Membaca riwayat pesan saluran/chat melalui Graph.

### RSC vs Graph API

| Capability              | RSC Permissions       | Graph API                              |
| ----------------------- | --------------------- | -------------------------------------- |
| **Pesan real-time**     | Ya (melalui webhook)  | Tidak (hanya polling)                  |
| **Pesan historis**      | Tidak                 | Ya (dapat melakukan query riwayat)     |
| **Kompleksitas setup**  | Hanya manifest aplikasi | Memerlukan admin consent + alur token |
| **Berfungsi offline**   | Tidak (harus berjalan) | Ya (dapat query kapan saja)           |

**Intinya:** RSC untuk mendengarkan secara real-time; Graph API untuk akses historis. Untuk mengejar pesan yang terlewat saat offline, Anda memerlukan Graph API dengan `ChannelMessage.Read.All` (memerlukan admin consent).

## Media + riwayat dengan Graph (wajib untuk saluran)

Jika Anda memerlukan gambar/file di **saluran** atau ingin mengambil **riwayat pesan**, Anda harus mengaktifkan izin Microsoft Graph dan memberikan admin consent.

1. Di **App Registration** Entra ID (Azure AD), tambahkan izin **Aplikasi** Microsoft Graph:
   - `ChannelMessage.Read.All` (lampiran saluran + riwayat)
   - `Chat.Read.All` atau `ChatMessage.Read.All` (obrolan grup)
2. **Berikan admin consent** untuk tenant.
3. Naikkan **versi manifest** aplikasi Teams, unggah ulang, lalu **instal ulang aplikasi di Teams**.
4. **Keluar sepenuhnya lalu jalankan ulang Teams** untuk membersihkan metadata aplikasi yang tersimpan di cache.

**Izin tambahan untuk mention pengguna:** @mention pengguna berfungsi langsung untuk pengguna yang ada dalam percakapan. Namun, jika Anda ingin mencari dan me-mention pengguna yang **tidak berada dalam percakapan saat ini** secara dinamis, tambahkan izin Aplikasi `User.Read.All` dan berikan admin consent.

## Batasan yang Diketahui

### Timeout Webhook

Teams mengirimkan pesan melalui Webhook HTTP. Jika pemrosesan terlalu lama (misalnya, respons LLM lambat), Anda mungkin melihat:

- Timeout gateway
- Teams mencoba ulang pesan (menyebabkan duplikasi)
- Balasan yang hilang

OpenClaw menanganinya dengan mengembalikan respons cepat dan mengirim balasan secara proaktif, tetapi respons yang sangat lambat masih dapat menyebabkan masalah.

### Pemformatan

Markdown Teams lebih terbatas dibandingkan Slack atau Discord:

- Pemformatan dasar berfungsi: **tebal**, _miring_, `code`, tautan
- Markdown kompleks (tabel, daftar bertingkat) mungkin tidak dirender dengan benar
- Adaptive Cards didukung untuk poll dan pengiriman presentasi semantik (lihat di bawah)

## Konfigurasi

Pengaturan utama (lihat `/gateway/configuration` untuk pola saluran bersama):

- `channels.msteams.enabled`: aktifkan/nonaktifkan saluran.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: kredensial bot.
- `channels.msteams.webhook.port` (default `3978`)
- `channels.msteams.webhook.path` (default `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (default: pairing)
- `channels.msteams.allowFrom`: allowlist DM (AAD object ID direkomendasikan). Wizard menyelesaikan nama ke ID selama penyiapan saat akses Graph tersedia.
- `channels.msteams.dangerouslyAllowNameMatching`: toggle break-glass untuk mengaktifkan kembali pencocokan UPN/nama tampilan yang dapat berubah dan perutean langsung nama team/channel.
- `channels.msteams.textChunkLimit`: ukuran potongan teks keluar.
- `channels.msteams.chunkMode`: `length` (default) atau `newline` untuk membagi pada baris kosong (batas paragraf) sebelum pemotongan berdasarkan panjang.
- `channels.msteams.mediaAllowHosts`: allowlist untuk host lampiran masuk (default ke domain Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist untuk melampirkan header Authorization pada percobaan ulang media (default ke host Graph + Bot Framework).
- `channels.msteams.requireMention`: wajibkan @mention di saluran/grup (default true).
- `channels.msteams.replyStyle`: `thread | top-level` (lihat [Gaya Balasan](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: override per team.
- `channels.msteams.teams.<teamId>.requireMention`: override per team.
- `channels.msteams.teams.<teamId>.tools`: override kebijakan alat default per team (`allow`/`deny`/`alsoAllow`) yang digunakan saat override saluran tidak ada.
- `channels.msteams.teams.<teamId>.toolsBySender`: override kebijakan alat default per-pengirim per team (`"*"` wildcard didukung).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: override per saluran.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: override per saluran.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: override kebijakan alat per saluran (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: override kebijakan alat per-pengirim per saluran (`"*"` wildcard didukung).
- Kunci `toolsBySender` harus menggunakan prefiks eksplisit:
  `id:`, `e164:`, `username:`, `name:` (kunci lama tanpa prefiks tetap dipetakan hanya ke `id:`).
- `channels.msteams.actions.memberInfo`: aktifkan atau nonaktifkan aksi info anggota berbasis Graph (default: diaktifkan saat kredensial Graph tersedia).
- `channels.msteams.authType`: jenis autentikasi — `"secret"` (default) atau `"federated"`.
- `channels.msteams.certificatePath`: path ke file sertifikat PEM (federated + autentikasi sertifikat).
- `channels.msteams.certificateThumbprint`: thumbprint sertifikat (opsional, tidak diperlukan untuk autentikasi).
- `channels.msteams.useManagedIdentity`: aktifkan autentikasi managed identity (mode federated).
- `channels.msteams.managedIdentityClientId`: client ID untuk user-assigned managed identity.
- `channels.msteams.sharePointSiteId`: SharePoint site ID untuk unggahan file di obrolan grup/saluran (lihat [Mengirim file di obrolan grup](#sending-files-in-group-chats)).

## Perutean & Sesi

- Kunci sesi mengikuti format agent standar (lihat [/concepts/session](/id/concepts/session)):
  - Pesan langsung berbagi sesi utama (`agent:<agentId>:<mainKey>`).
  - Pesan saluran/grup menggunakan ID percakapan:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Gaya Balasan: Thread vs Post

Teams baru-baru ini memperkenalkan dua gaya UI saluran di atas model data dasar yang sama:

| Style                    | Deskripsi                                               | `replyStyle` yang direkomendasikan |
| ------------------------ | ------------------------------------------------------- | ---------------------------------- |
| **Posts** (klasik)       | Pesan muncul sebagai kartu dengan balasan thread di bawahnya | `thread` (default)            |
| **Threads** (mirip Slack) | Pesan mengalir secara linear, lebih mirip Slack        | `top-level`                        |

**Masalahnya:** Teams API tidak mengekspos gaya UI saluran yang digunakan. Jika Anda menggunakan `replyStyle` yang salah:

- `thread` di saluran gaya Threads → balasan muncul bertingkat secara janggal
- `top-level` di saluran gaya Posts → balasan muncul sebagai post tingkat atas terpisah, bukan dalam thread

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

## Lampiran & Gambar

**Batasan saat ini:**

- **DM:** Gambar dan lampiran file berfungsi melalui API file bot Teams.
- **Saluran/grup:** Lampiran berada di penyimpanan M365 (SharePoint/OneDrive). Payload webhook hanya menyertakan stub HTML, bukan byte file sebenarnya. **Izin Graph API diperlukan** untuk mengunduh lampiran saluran.
- Untuk pengiriman eksplisit yang mengutamakan file, gunakan `action=upload-file` dengan `media` / `filePath` / `path`; `message` opsional menjadi teks/komentar pendamping, dan `filename` menimpa nama unggahan.

Tanpa izin Graph, pesan saluran dengan gambar akan diterima sebagai teks saja (konten gambar tidak dapat diakses oleh bot).
Secara default, OpenClaw hanya mengunduh media dari hostname Microsoft/Teams. Override dengan `channels.msteams.mediaAllowHosts` (gunakan `["*"]` untuk mengizinkan host apa pun).
Header Authorization hanya dilampirkan untuk host dalam `channels.msteams.mediaAuthAllowHosts` (default ke host Graph + Bot Framework). Jaga daftar ini tetap ketat (hindari sufiks multi-tenant).

## Mengirim file di obrolan grup

Bot dapat mengirim file di DM menggunakan alur FileConsentCard (bawaan). Namun, **mengirim file di obrolan grup/saluran** memerlukan penyiapan tambahan:

| Context                  | Cara file dikirim                           | Penyiapan yang diperlukan                     |
| ------------------------ | ------------------------------------------- | --------------------------------------------- |
| **DM**                   | FileConsentCard → pengguna menerima → bot mengunggah | Langsung berfungsi                    |
| **Obrolan grup/saluran** | Unggah ke SharePoint → bagikan tautan       | Memerlukan `sharePointSiteId` + izin Graph    |
| **Gambar (konteks apa pun)** | Inline berkode Base64                  | Langsung berfungsi                            |

### Mengapa obrolan grup memerlukan SharePoint

Bot tidak memiliki drive OneDrive personal (endpoint Graph API `/me/drive` tidak berfungsi untuk identitas aplikasi). Untuk mengirim file di obrolan grup/saluran, bot mengunggah ke **situs SharePoint** dan membuat tautan berbagi.

### Penyiapan

1. **Tambahkan izin Graph API** di Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - unggah file ke SharePoint
   - `Chat.Read.All` (Application) - opsional, mengaktifkan tautan berbagi per pengguna

2. **Berikan admin consent** untuk tenant.

3. **Dapatkan SharePoint site ID Anda:**

   ```bash
   # Melalui Graph Explorer atau curl dengan token yang valid:
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

| Permission                              | Perilaku berbagi                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` saja              | Tautan berbagi untuk seluruh organisasi (siapa pun di org dapat mengakses) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Tautan berbagi per pengguna (hanya anggota chat yang dapat mengakses) |

Berbagi per pengguna lebih aman karena hanya peserta chat yang dapat mengakses file. Jika izin `Chat.Read.All` tidak ada, bot akan fallback ke berbagi untuk seluruh organisasi.

### Perilaku fallback

| Scenario                                          | Hasil                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| Obrolan grup + file + `sharePointSiteId` dikonfigurasi | Unggah ke SharePoint, kirim tautan berbagi    |
| Obrolan grup + file + tanpa `sharePointSiteId`    | Coba unggah OneDrive (mungkin gagal), kirim teks saja |
| Chat personal + file                              | Alur FileConsentCard (berfungsi tanpa SharePoint)  |
| Konteks apa pun + gambar                          | Inline berkode Base64 (berfungsi tanpa SharePoint) |

### Lokasi penyimpanan file

File yang diunggah disimpan dalam folder `/OpenClawShared/` di library dokumen default situs SharePoint yang dikonfigurasi.

## Poll (Adaptive Cards)

OpenClaw mengirim poll Teams sebagai Adaptive Cards (tidak ada poll API bawaan Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Vote direkam oleh gateway di `~/.openclaw/msteams-polls.json`.
- Gateway harus tetap online untuk merekam vote.
- Poll belum otomatis memposting ringkasan hasil (periksa file penyimpanan jika diperlukan).

## Kartu Presentasi

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

Target MSTeams menggunakan prefiks untuk membedakan pengguna dan percakapan:

| Target type         | Format                           | Contoh                                              |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Pengguna (berdasarkan ID) | `user:<aad-object-id>`     | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Pengguna (berdasarkan nama) | `user:<display-name>`   | `user:John Smith` (memerlukan Graph API)            |
| Grup/saluran        | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grup/saluran (mentah) | `<conversation-id>`            | `19:abc123...@thread.tacv2` (jika berisi `@thread`) |

**Contoh CLI:**

```bash
# Kirim ke pengguna berdasarkan ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Kirim ke pengguna berdasarkan nama tampilan (memicu lookup Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Kirim ke obrolan grup atau saluran
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Kirim kartu presentasi ke percakapan
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Contoh alat agent:**

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

Catatan: Tanpa prefiks `user:`, nama secara default akan diselesaikan sebagai grup/team. Selalu gunakan `user:` saat menargetkan orang berdasarkan nama tampilan.

## Pesan proaktif

- Pesan proaktif hanya dimungkinkan **setelah** pengguna berinteraksi, karena kami menyimpan referensi percakapan pada saat itu.
- Lihat `/gateway/configuration` untuk gating `dmPolicy` dan allowlist.

## ID Team dan Saluran (Hal yang Sering Menjebak)

Parameter query `groupId` dalam URL Teams **BUKAN** team ID yang digunakan untuk konfigurasi. Ekstrak ID dari path URL sebagai gantinya:

**URL Team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (URL-decode ini)
```

**URL Saluran:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode ini)
```

**Untuk konfigurasi:**

- Team ID = segmen path setelah `/team/` (di-URL-decode, misalnya `19:Bk4j...@thread.tacv2`)
- Channel ID = segmen path setelah `/channel/` (di-URL-decode)
- **Abaikan** parameter query `groupId`

## Saluran Privat

Bot memiliki dukungan terbatas di saluran privat:

| Feature                      | Saluran Standar   | Saluran Privat         |
| ---------------------------- | ----------------- | ---------------------- |
| Instalasi bot                | Ya                | Terbatas               |
| Pesan real-time (Webhook)    | Ya                | Mungkin tidak berfungsi |
| Izin RSC                     | Ya                | Mungkin berperilaku berbeda |
| @mention                     | Ya                | Jika bot dapat diakses |
| Riwayat Graph API            | Ya                | Ya (dengan izin)       |

**Solusi jika saluran privat tidak berfungsi:**

1. Gunakan saluran standar untuk interaksi bot
2. Gunakan DM - pengguna selalu dapat mengirim pesan langsung ke bot
3. Gunakan Graph API untuk akses historis (memerlukan `ChannelMessage.Read.All`)

## Pemecahan masalah

### Masalah umum

- **Gambar tidak muncul di saluran:** izin Graph atau admin consent belum ada. Instal ulang aplikasi Teams dan keluar/buka kembali Teams sepenuhnya.
- **Tidak ada respons di saluran:** mention diwajibkan secara default; setel `channels.msteams.requireMention=false` atau konfigurasi per team/saluran.
- **Ketidakcocokan versi (Teams masih menampilkan manifest lama):** hapus + tambahkan kembali aplikasi dan keluar sepenuhnya dari Teams untuk menyegarkan.
- **401 Unauthorized dari Webhook:** Diharapkan saat pengujian manual tanpa Azure JWT - artinya endpoint dapat dijangkau tetapi autentikasi gagal. Gunakan Azure Web Chat untuk menguji dengan benar.

### Error unggah manifest

- **"Icon file cannot be empty":** Manifest merujuk file ikon yang berukuran 0 byte. Buat ikon PNG yang valid (32x32 untuk `outline.png`, 192x192 untuk `color.png`).
- **"webApplicationInfo.Id already in use":** Aplikasi masih terinstal di team/chat lain. Temukan dan hapus instalasinya terlebih dahulu, atau tunggu 5-10 menit untuk propagasi.
- **"Something went wrong" saat unggah:** Unggah melalui [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com) sebagai gantinya, buka browser DevTools (F12) → tab Network, dan periksa body respons untuk error yang sebenarnya.
- **Sideload gagal:** Coba "Upload an app to your org's app catalog" alih-alih "Upload a custom app" - ini sering melewati pembatasan sideload.

### Izin RSC tidak berfungsi

1. Verifikasi `webApplicationInfo.id` sama persis dengan App ID bot Anda
2. Unggah ulang aplikasi dan instal ulang di team/chat
3. Periksa apakah admin org Anda memblokir izin RSC
4. Konfirmasikan Anda menggunakan scope yang benar: `ChannelMessage.Read.Group` untuk teams, `ChatMessage.Read.Chat` untuk obrolan grup

## Referensi

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - panduan penyiapan Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - membuat/mengelola aplikasi Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (saluran/grup memerlukan Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI untuk manajemen bot

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gating mention
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
