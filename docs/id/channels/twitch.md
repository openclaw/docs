---
read_when:
    - Menyiapkan integrasi obrolan Twitch untuk OpenClaw
summary: Konfigurasi dan penyiapan bot obrolan Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-24T08:59:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

Dukungan obrolan Twitch melalui koneksi IRC. OpenClaw terhubung sebagai pengguna Twitch (akun bot) untuk menerima dan mengirim pesan di channel.

## Plugin bawaan

Twitch disertakan sebagai Plugin bawaan dalam rilis OpenClaw saat ini, jadi build
terpaket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build yang lebih lama atau instalasi kustom yang tidak menyertakan Twitch, instal
secara manual:

Instal melalui CLI (registry npm):

```bash
openclaw plugins install @openclaw/twitch
```

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Detail: [Plugins](/id/tools/plugin)

## Penyiapan cepat (pemula)

1. Pastikan Plugin Twitch tersedia.
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya secara bawaan.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun Twitch khusus untuk bot (atau gunakan akun yang sudah ada).
3. Buat kredensial: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Pilih **Bot Token**
   - Verifikasi bahwa scope `chat:read` dan `chat:write` dipilih
   - Salin **Client ID** dan **Access Token**
4. Temukan ID pengguna Twitch Anda: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Konfigurasikan token:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (hanya akun default)
   - Atau konfigurasi: `channels.twitch.accessToken`
   - Jika keduanya disetel, konfigurasi diprioritaskan (fallback env hanya untuk akun default).
6. Jalankan Gateway.

**⚠️ Penting:** Tambahkan kontrol akses (`allowFrom` atau `allowedRoles`) untuk mencegah pengguna yang tidak berwenang memicu bot. `requireMention` default-nya adalah `true`.

Konfigurasi minimal:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Akun Twitch bot
      accessToken: "oauth:abc123...", // OAuth Access Token (atau gunakan env var OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID dari Token Generator
      channel: "vevisk", // Channel Twitch yang obrolannya akan dimasuki (wajib)
      allowFrom: ["123456789"], // (disarankan) Hanya ID pengguna Twitch Anda - dapatkan dari https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Apa ini

- Channel Twitch yang dimiliki Gateway.
- Routing deterministik: balasan selalu kembali ke Twitch.
- Setiap akun dipetakan ke session key terisolasi `agent:<agentId>:twitch:<accountName>`.
- `username` adalah akun bot (yang melakukan autentikasi), `channel` adalah ruang obrolan yang akan dimasuki.

## Penyiapan (terperinci)

### Buat kredensial

Gunakan [Twitch Token Generator](https://twitchtokengenerator.com/):

- Pilih **Bot Token**
- Verifikasi bahwa scope `chat:read` dan `chat:write` dipilih
- Salin **Client ID** dan **Access Token**

Tidak perlu pendaftaran aplikasi manual. Token kedaluwarsa setelah beberapa jam.

### Konfigurasikan bot

**Env var (hanya akun default):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Atau konfigurasi:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

Jika env dan konfigurasi keduanya disetel, konfigurasi diprioritaskan.

### Kontrol akses (disarankan)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (disarankan) Hanya ID pengguna Twitch Anda
    },
  },
}
```

Pilih `allowFrom` untuk allowlist yang ketat. Gunakan `allowedRoles` sebagai gantinya jika Anda menginginkan akses berbasis peran.

**Peran yang tersedia:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Mengapa ID pengguna?** Username bisa berubah, sehingga memungkinkan peniruan identitas. ID pengguna bersifat permanen.

Temukan ID pengguna Twitch Anda: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Konversi username Twitch Anda menjadi ID)

## Refresh token (opsional)

Token dari [Twitch Token Generator](https://twitchtokengenerator.com/) tidak dapat di-refresh secara otomatis - buat ulang saat kedaluwarsa.

Untuk refresh token otomatis, buat aplikasi Twitch Anda sendiri di [Twitch Developer Console](https://dev.twitch.tv/console) dan tambahkan ke konfigurasi:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

Bot secara otomatis me-refresh token sebelum kedaluwarsa dan mencatat event refresh di log.

## Dukungan multi-akun

Gunakan `channels.twitch.accounts` dengan token per akun. Lihat [`gateway/configuration`](/id/gateway/configuration) untuk pola bersama.

Contoh (satu akun bot di dua channel):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**Catatan:** Setiap akun memerlukan tokennya sendiri (satu token per channel).

## Kontrol akses

### Pembatasan berbasis peran

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### Allowlist berdasarkan ID pengguna (paling aman)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### Akses berbasis peran (alternatif)

`allowFrom` adalah allowlist yang ketat. Saat disetel, hanya ID pengguna tersebut yang diizinkan.
Jika Anda menginginkan akses berbasis peran, biarkan `allowFrom` tidak disetel dan konfigurasikan `allowedRoles` sebagai gantinya:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### Nonaktifkan persyaratan @mention

Secara default, `requireMention` adalah `true`. Untuk menonaktifkannya dan merespons semua pesan:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## Pemecahan masalah

Pertama, jalankan perintah diagnostik:

```bash
openclaw doctor
openclaw channels status --probe
```

### Bot tidak merespons pesan

**Periksa kontrol akses:** Pastikan ID pengguna Anda ada di `allowFrom`, atau hapus sementara
`allowFrom` dan setel `allowedRoles: ["all"]` untuk menguji.

**Periksa bahwa bot ada di channel:** Bot harus bergabung ke channel yang ditentukan di `channel`.

### Masalah token

**"Failed to connect" atau error autentikasi:**

- Verifikasi bahwa `accessToken` adalah nilai OAuth access token (biasanya dimulai dengan prefiks `oauth:`)
- Periksa bahwa token memiliki scope `chat:read` dan `chat:write`
- Jika menggunakan refresh token, verifikasi bahwa `clientSecret` dan `refreshToken` telah disetel

### Refresh token tidak berfungsi

**Periksa log untuk event refresh:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Jika Anda melihat "token refresh disabled (no refresh token)":

- Pastikan `clientSecret` disediakan
- Pastikan `refreshToken` disediakan

## Konfigurasi

**Konfigurasi akun:**

- `username` - Username bot
- `accessToken` - OAuth access token dengan `chat:read` dan `chat:write`
- `clientId` - Twitch Client ID (dari Token Generator atau aplikasi Anda)
- `channel` - Channel yang akan dimasuki (wajib)
- `enabled` - Aktifkan akun ini (default: `true`)
- `clientSecret` - Opsional: Untuk refresh token otomatis
- `refreshToken` - Opsional: Untuk refresh token otomatis
- `expiresIn` - Masa berlaku token dalam detik
- `obtainmentTimestamp` - Stempel waktu saat token diperoleh
- `allowFrom` - Allowlist ID pengguna
- `allowedRoles` - Kontrol akses berbasis peran (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - Wajib @mention (default: `true`)

**Opsi provider:**

- `channels.twitch.enabled` - Aktifkan/nonaktifkan startup channel
- `channels.twitch.username` - Username bot (konfigurasi satu akun yang disederhanakan)
- `channels.twitch.accessToken` - OAuth access token (konfigurasi satu akun yang disederhanakan)
- `channels.twitch.clientId` - Twitch Client ID (konfigurasi satu akun yang disederhanakan)
- `channels.twitch.channel` - Channel yang akan dimasuki (konfigurasi satu akun yang disederhanakan)
- `channels.twitch.accounts.<accountName>` - Konfigurasi multi-akun (semua field akun di atas)

Contoh lengkap:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Aksi tool

Agen dapat memanggil `twitch` dengan aksi:

- `send` - Mengirim pesan ke sebuah channel

Contoh:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Keamanan & operasional

- **Perlakukan token seperti kata sandi** - Jangan pernah commit token ke git
- **Gunakan refresh token otomatis** untuk bot yang berjalan lama
- **Gunakan allowlist ID pengguna** alih-alih username untuk kontrol akses
- **Pantau log** untuk event refresh token dan status koneksi
- **Batasi scope token seminimal mungkin** - Hanya minta `chat:read` dan `chat:write`
- **Jika macet**: Restart Gateway setelah memastikan tidak ada proses lain yang memiliki sesi tersebut

## Batasan

- **500 karakter** per pesan (dipecah otomatis pada batas kata)
- Markdown dihapus sebelum pemecahan
- Tidak ada rate limiting (menggunakan rate limit bawaan Twitch)

## Terkait

- [Ikhtisar Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/id/channels/groups) — perilaku obrolan grup dan pembatasan mention
- [Routing Channel](/id/channels/channel-routing) — routing sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan keamanan
