---
read_when:
    - Menyiapkan integrasi chat Twitch untuk OpenClaw
summary: Konfigurasi dan penyiapan bot chat Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-05T13:44:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47af9fb6edb1f462c5919850ee9d05e500a1914ddd0d64a41608fbe960e77cd6
    source_path: channels/twitch.md
    workflow: 15
---

# Twitch

Dukungan chat Twitch melalui koneksi IRC. OpenClaw terhubung sebagai pengguna Twitch (akun bot) untuk menerima dan mengirim pesan di channel.

## Plugin bawaan

Twitch dikirim sebagai plugin bawaan di rilis OpenClaw saat ini, jadi build
paket normal tidak memerlukan instalasi terpisah.

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Twitch, instal
secara manual:

Instal melalui CLI (registry npm):

```bash
openclaw plugins install @openclaw/twitch
```

Checkout lokal (saat berjalan dari repo git):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Detail: [Plugins](/tools/plugin)

## Penyiapan cepat (pemula)

1. Pastikan plugin Twitch tersedia.
   - Rilis OpenClaw terpaket saat ini sudah menyertakannya.
   - Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
2. Buat akun Twitch khusus untuk bot (atau gunakan akun yang sudah ada).
3. Buat kredensial: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Pilih **Bot Token**
   - Pastikan scope `chat:read` dan `chat:write` dipilih
   - Salin **Client ID** dan **Access Token**
4. Temukan ID pengguna Twitch Anda: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Konfigurasikan token:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (hanya akun default)
   - Atau config: `channels.twitch.accessToken`
   - Jika keduanya ditetapkan, config lebih diutamakan (fallback env hanya untuk akun default).
6. Mulai gateway.

**⚠️ Penting:** Tambahkan kontrol akses (`allowFrom` atau `allowedRoles`) untuk mencegah pengguna yang tidak berwenang memicu bot. `requireMention` default ke `true`.

Config minimal:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Akun Twitch bot
      accessToken: "oauth:abc123...", // OAuth Access Token (atau gunakan env var OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID dari Token Generator
      channel: "vevisk", // Chat channel Twitch yang akan diikuti (wajib)
      allowFrom: ["123456789"], // (disarankan) Hanya ID pengguna Twitch Anda - dapatkan dari https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Apa ini

- Channel Twitch yang dimiliki oleh Gateway.
- Routing deterministik: balasan selalu kembali ke Twitch.
- Setiap akun dipetakan ke kunci sesi terisolasi `agent:<agentId>:twitch:<accountName>`.
- `username` adalah akun bot (yang melakukan autentikasi), `channel` adalah ruang chat yang akan diikuti.

## Penyiapan (detail)

### Buat kredensial

Gunakan [Twitch Token Generator](https://twitchtokengenerator.com/):

- Pilih **Bot Token**
- Pastikan scope `chat:read` dan `chat:write` dipilih
- Salin **Client ID** dan **Access Token**

Tidak perlu pendaftaran aplikasi manual. Token kedaluwarsa setelah beberapa jam.

### Konfigurasikan bot

**Env var (hanya akun default):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Atau config:**

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

Jika env dan config sama-sama ditetapkan, config lebih diutamakan.

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

Utamakan `allowFrom` untuk allowlist yang ketat. Gunakan `allowedRoles` jika Anda menginginkan akses berbasis peran.

**Peran yang tersedia:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Mengapa ID pengguna?** Nama pengguna dapat berubah, sehingga memungkinkan penyamaran. ID pengguna bersifat permanen.

Temukan ID pengguna Twitch Anda: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Konversi nama pengguna Twitch Anda ke ID)

## Penyegaran token (opsional)

Token dari [Twitch Token Generator](https://twitchtokengenerator.com/) tidak dapat disegarkan secara otomatis - buat ulang saat kedaluwarsa.

Untuk penyegaran token otomatis, buat aplikasi Twitch Anda sendiri di [Twitch Developer Console](https://dev.twitch.tv/console) lalu tambahkan ke config:

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

Bot secara otomatis menyegarkan token sebelum kedaluwarsa dan mencatat event penyegaran.

## Dukungan multi-akun

Gunakan `channels.twitch.accounts` dengan token per akun. Lihat [`gateway/configuration`](/gateway/configuration) untuk pola bersama.

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

### Allowlist berdasarkan ID Pengguna (paling aman)

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

`allowFrom` adalah allowlist yang ketat. Jika ditetapkan, hanya ID pengguna tersebut yang diizinkan.
Jika Anda menginginkan akses berbasis peran, biarkan `allowFrom` tidak ditetapkan dan konfigurasi `allowedRoles` sebagai gantinya:

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

## Troubleshooting

Pertama, jalankan perintah diagnostik:

```bash
openclaw doctor
openclaw channels status --probe
```

### Bot tidak merespons pesan

**Periksa kontrol akses:** Pastikan ID pengguna Anda ada di `allowFrom`, atau hapus sementara
`allowFrom` dan tetapkan `allowedRoles: ["all"]` untuk pengujian.

**Periksa apakah bot ada di channel:** Bot harus bergabung ke channel yang ditentukan di `channel`.

### Masalah token

**"Failed to connect" atau error autentikasi:**

- Pastikan `accessToken` adalah nilai token akses OAuth (biasanya diawali prefiks `oauth:`)
- Pastikan token memiliki scope `chat:read` dan `chat:write`
- Jika menggunakan penyegaran token, pastikan `clientSecret` dan `refreshToken` ditetapkan

### Penyegaran token tidak berfungsi

**Periksa log untuk event penyegaran:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Jika Anda melihat "token refresh disabled (no refresh token)":

- Pastikan `clientSecret` disediakan
- Pastikan `refreshToken` disediakan

## Config

**Config akun:**

- `username` - Nama pengguna bot
- `accessToken` - Token akses OAuth dengan `chat:read` dan `chat:write`
- `clientId` - Twitch Client ID (dari Token Generator atau aplikasi Anda)
- `channel` - Channel yang akan diikuti (wajib)
- `enabled` - Aktifkan akun ini (default: `true`)
- `clientSecret` - Opsional: Untuk penyegaran token otomatis
- `refreshToken` - Opsional: Untuk penyegaran token otomatis
- `expiresIn` - Masa berlaku token dalam detik
- `obtainmentTimestamp` - Stempel waktu saat token diperoleh
- `allowFrom` - Allowlist ID pengguna
- `allowedRoles` - Kontrol akses berbasis peran (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - Wajibkan @mention (default: `true`)

**Opsi penyedia:**

- `channels.twitch.enabled` - Aktifkan/nonaktifkan startup channel
- `channels.twitch.username` - Nama pengguna bot (config satu akun yang disederhanakan)
- `channels.twitch.accessToken` - Token akses OAuth (config satu akun yang disederhanakan)
- `channels.twitch.clientId` - Twitch Client ID (config satu akun yang disederhanakan)
- `channels.twitch.channel` - Channel yang akan diikuti (config satu akun yang disederhanakan)
- `channels.twitch.accounts.<accountName>` - Config multi-akun (semua field akun di atas)

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

- `send` - Mengirim pesan ke channel

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

## Keamanan & operasi

- **Perlakukan token seperti kata sandi** - Jangan pernah mengomit token ke git
- **Gunakan penyegaran token otomatis** untuk bot yang berjalan lama
- **Gunakan allowlist ID pengguna** alih-alih nama pengguna untuk kontrol akses
- **Pantau log** untuk event penyegaran token dan status koneksi
- **Batasi scope token seminimal mungkin** - Hanya minta `chat:read` dan `chat:write`
- **Jika buntu**: Mulai ulang gateway setelah memastikan tidak ada proses lain yang memiliki sesi

## Batasan

- **500 karakter** per pesan (dipotong otomatis di batas kata)
- Markdown dihapus sebelum pemotongan
- Tidak ada pembatasan laju (menggunakan batas laju bawaan Twitch)

## Terkait

- [Channels Overview](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/channels/groups) — perilaku group chat dan pembatasan mention
- [Channel Routing](/channels/channel-routing) — routing sesi untuk pesan
- [Security](/gateway/security) — model akses dan hardening
