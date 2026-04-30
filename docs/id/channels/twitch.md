---
read_when:
    - Menyiapkan integrasi obrolan Twitch untuk OpenClaw
sidebarTitle: Twitch
summary: Konfigurasi dan penyiapan bot chat Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-30T09:36:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

Dukungan chat Twitch melalui koneksi IRC. OpenClaw terhubung sebagai pengguna Twitch (akun bot) untuk menerima dan mengirim pesan di channel.

## Plugin yang dibundel

<Note>
Twitch dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, sehingga build paket normal tidak memerlukan instalasi terpisah.
</Note>

Jika Anda menggunakan build lama atau instalasi kustom yang mengecualikan Twitch, instal paket npm saat ini saat sudah dipublikasikan:

<Tabs>
  <Tab title="registri npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Checkout lokal">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Jika npm melaporkan paket milik OpenClaw sebagai usang, gunakan build
OpenClaw paket saat ini atau path checkout lokal hingga paket npm yang lebih baru
dipublikasikan.

Detail: [Plugins](/id/tools/plugin)

## Penyiapan cepat (pemula)

<Steps>
  <Step title="Pastikan Plugin tersedia">
    Rilis OpenClaw paket saat ini sudah membundelkannya. Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
  </Step>
  <Step title="Buat akun bot Twitch">
    Buat akun Twitch khusus untuk bot (atau gunakan akun yang sudah ada).
  </Step>
  <Step title="Buat kredensial">
    Gunakan [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Pilih **Bot Token**
    - Pastikan scope `chat:read` dan `chat:write` dipilih
    - Salin **Client ID** dan **Access Token**

  </Step>
  <Step title="Temukan ID pengguna Twitch Anda">
    Gunakan [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) untuk mengonversi nama pengguna menjadi ID pengguna Twitch.
  </Step>
  <Step title="Konfigurasikan token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (hanya akun default)
    - Atau config: `channels.twitch.accessToken`

    Jika keduanya disetel, config diprioritaskan (fallback env hanya untuk akun default).

  </Step>
  <Step title="Mulai Gateway">
    Mulai Gateway dengan channel yang dikonfigurasi.
  </Step>
</Steps>

<Warning>
Tambahkan kontrol akses (`allowFrom` atau `allowedRoles`) untuk mencegah pengguna tidak sah memicu bot. `requireMention` default-nya `true`.
</Warning>

Config minimal:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Apa ini

- Channel Twitch yang dimiliki oleh Gateway.
- Perutean deterministik: balasan selalu kembali ke Twitch.
- Setiap akun dipetakan ke kunci sesi terisolasi `agent:<agentId>:twitch:<accountName>`.
- `username` adalah akun bot (yang melakukan autentikasi), `channel` adalah ruang chat yang akan dimasuki.

## Penyiapan (terperinci)

### Buat kredensial

Gunakan [Twitch Token Generator](https://twitchtokengenerator.com/):

- Pilih **Bot Token**
- Pastikan scope `chat:read` dan `chat:write` dipilih
- Salin **Client ID** dan **Access Token**

<Note>
Tidak perlu pendaftaran aplikasi manual. Token kedaluwarsa setelah beberapa jam.
</Note>

### Konfigurasikan bot

<Tabs>
  <Tab title="Var env (hanya akun default)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
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
  </Tab>
</Tabs>

Jika env dan config sama-sama disetel, config diprioritaskan.

### Kontrol akses (direkomendasikan)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Lebih pilih `allowFrom` untuk allowlist ketat. Gunakan `allowedRoles` sebagai gantinya jika Anda menginginkan akses berbasis peran.

**Peran yang tersedia:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Mengapa ID pengguna?** Nama pengguna dapat berubah, sehingga memungkinkan penyamaran. ID pengguna bersifat permanen.

Temukan ID pengguna Twitch Anda: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Konversi nama pengguna Twitch Anda menjadi ID)
</Note>

## Penyegaran token (opsional)

Token dari [Twitch Token Generator](https://twitchtokengenerator.com/) tidak dapat disegarkan secara otomatis - buat ulang saat kedaluwarsa.

Untuk penyegaran token otomatis, buat aplikasi Twitch Anda sendiri di [Twitch Developer Console](https://dev.twitch.tv/console) dan tambahkan ke config:

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

Gunakan `channels.twitch.accounts` dengan token per akun. Lihat [Konfigurasi](/id/gateway/configuration) untuk pola bersama.

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

<Note>
Setiap akun memerlukan tokennya sendiri (satu token per channel).
</Note>

## Kontrol akses

<Tabs>
  <Tab title="Allowlist ID pengguna (paling aman)">
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
  </Tab>
  <Tab title="Berbasis peran">
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

    `allowFrom` adalah allowlist ketat. Saat disetel, hanya ID pengguna tersebut yang diizinkan. Jika Anda menginginkan akses berbasis peran, biarkan `allowFrom` tidak disetel dan konfigurasikan `allowedRoles` sebagai gantinya.

  </Tab>
  <Tab title="Nonaktifkan persyaratan @mention">
    Secara default, `requireMention` adalah `true`. Untuk menonaktifkan dan merespons semua pesan:

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

  </Tab>
</Tabs>

## Pemecahan masalah

Pertama, jalankan perintah diagnostik:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot tidak merespons pesan">
    - **Periksa kontrol akses:** Pastikan ID pengguna Anda ada di `allowFrom`, atau hapus sementara `allowFrom` dan setel `allowedRoles: ["all"]` untuk menguji.
    - **Periksa bot ada di channel:** Bot harus masuk ke channel yang ditentukan dalam `channel`.

  </Accordion>
  <Accordion title="Masalah token">
    "Gagal terhubung" atau error autentikasi:

    - Pastikan `accessToken` adalah nilai token akses OAuth (biasanya diawali dengan prefiks `oauth:`)
    - Periksa token memiliki scope `chat:read` dan `chat:write`
    - Jika menggunakan penyegaran token, pastikan `clientSecret` dan `refreshToken` disetel

  </Accordion>
  <Accordion title="Penyegaran token tidak berfungsi">
    Periksa log untuk event penyegaran:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Jika Anda melihat "token refresh disabled (no refresh token)":

    - Pastikan `clientSecret` disediakan
    - Pastikan `refreshToken` disediakan

  </Accordion>
</AccordionGroup>

## Config

### Config akun

<ParamField path="username" type="string">
  Nama pengguna bot.
</ParamField>
<ParamField path="accessToken" type="string">
  Token akses OAuth dengan `chat:read` dan `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Client ID Twitch (dari Token Generator atau aplikasi Anda).
</ParamField>
<ParamField path="channel" type="string" required>
  Channel yang akan dimasuki.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Aktifkan akun ini.
</ParamField>
<ParamField path="clientSecret" type="string">
  Opsional: untuk penyegaran token otomatis.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opsional: untuk penyegaran token otomatis.
</ParamField>
<ParamField path="expiresIn" type="number">
  Kedaluwarsa token dalam detik.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Timestamp token diperoleh.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Allowlist ID pengguna.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Kontrol akses berbasis peran.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Wajibkan @mention.
</ParamField>

### Opsi provider

- `channels.twitch.enabled` - Aktifkan/nonaktifkan startup channel
- `channels.twitch.username` - Nama pengguna bot (config akun tunggal yang disederhanakan)
- `channels.twitch.accessToken` - Token akses OAuth (config akun tunggal yang disederhanakan)
- `channels.twitch.clientId` - Client ID Twitch (config akun tunggal yang disederhanakan)
- `channels.twitch.channel` - Channel yang akan dimasuki (config akun tunggal yang disederhanakan)
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

## Tindakan alat

Agen dapat memanggil `twitch` dengan tindakan:

- `send` - Kirim pesan ke channel

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

## Keamanan dan operasi

- **Perlakukan token seperti kata sandi** — Jangan pernah commit token ke git.
- **Gunakan penyegaran token otomatis** untuk bot yang berjalan lama.
- **Gunakan allowlist ID pengguna** alih-alih nama pengguna untuk kontrol akses.
- **Pantau log** untuk event penyegaran token dan status koneksi.
- **Batasi scope token seminimal mungkin** — Hanya minta `chat:read` dan `chat:write`.
- **Jika macet**: Mulai ulang Gateway setelah memastikan tidak ada proses lain yang memiliki sesi.

## Batasan

- **500 karakter** per pesan (dipecah otomatis pada batas kata).
- Markdown dihapus sebelum pemecahan.
- Tidak ada pembatasan laju (menggunakan batas laju bawaan Twitch).

## Terkait

- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Grup](/id/channels/groups) — perilaku chat grup dan gating mention
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Keamanan](/id/gateway/security) — model akses dan hardening
