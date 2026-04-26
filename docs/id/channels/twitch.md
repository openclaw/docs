---
read_when:
    - Menyiapkan integrasi chat Twitch untuk OpenClaw
sidebarTitle: Twitch
summary: Konfigurasi dan penyiapan bot chat Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

Dukungan chat Twitch melalui koneksi IRC. OpenClaw terhubung sebagai pengguna Twitch (akun bot) untuk menerima dan mengirim pesan di channel.

## Plugin bawaan

<Note>
Twitch dikirim sebagai Plugin bawaan dalam rilis OpenClaw saat ini, sehingga build paket normal tidak memerlukan instalasi terpisah.
</Note>

Jika Anda menggunakan build lama atau instalasi kustom yang tidak menyertakan Twitch, instal secara manual:

<Tabs>
  <Tab title="registry npm">
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

Detail: [Plugins](/id/tools/plugin)

## Penyiapan cepat (pemula)

<Steps>
  <Step title="Pastikan Plugin tersedia">
    Rilis OpenClaw terkemas saat ini sudah menyertakannya. Instalasi lama/kustom dapat menambahkannya secara manual dengan perintah di atas.
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
    Gunakan [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) untuk mengubah username menjadi ID pengguna Twitch.
  </Step>
  <Step title="Konfigurasikan token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (hanya akun default)
    - Atau config: `channels.twitch.accessToken`

    Jika keduanya diatur, config menjadi prioritas (fallback env hanya untuk akun default).

  </Step>
  <Step title="Mulai gateway">
    Mulai gateway dengan channel yang sudah dikonfigurasi.
  </Step>
</Steps>

<Warning>
Tambahkan kontrol akses (`allowFrom` atau `allowedRoles`) untuk mencegah pengguna yang tidak berwenang memicu bot. `requireMention` default-nya `true`.
</Warning>

Config minimal:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Akun Twitch bot
      accessToken: "oauth:abc123...", // OAuth Access Token (atau gunakan env var OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID dari Token Generator
      channel: "vevisk", // Chat channel Twitch yang akan dimasuki (wajib)
      allowFrom: ["123456789"], // (disarankan) Hanya ID pengguna Twitch Anda - dapatkan dari https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## Apa itu ini

- Channel Twitch yang dimiliki oleh Gateway.
- Routing deterministik: balasan selalu kembali ke Twitch.
- Setiap akun dipetakan ke session key terisolasi `agent:<agentId>:twitch:<accountName>`.
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
  <Tab title="Env var (hanya akun default)">
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

Jika env dan config keduanya diatur, config menjadi prioritas.

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

<Note>
**Mengapa ID pengguna?** Username dapat berubah, sehingga memungkinkan peniruan identitas. ID pengguna bersifat permanen.

Temukan ID pengguna Twitch Anda: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Ubah username Twitch Anda menjadi ID)
</Note>

## Refresh token (opsional)

Token dari [Twitch Token Generator](https://twitchtokengenerator.com/) tidak dapat di-refresh secara otomatis - buat ulang saat kedaluwarsa.

Untuk refresh token otomatis, buat aplikasi Twitch Anda sendiri di [Twitch Developer Console](https://dev.twitch.tv/console) dan tambahkan ke config:

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

Bot akan secara otomatis me-refresh token sebelum kedaluwarsa dan mencatat peristiwa refresh.

## Dukungan multi-akun

Gunakan `channels.twitch.accounts` dengan token per akun. Lihat [Configuration](/id/gateway/configuration) untuk pola bersama.

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

    `allowFrom` adalah allowlist yang ketat. Jika diatur, hanya ID pengguna tersebut yang diizinkan. Jika Anda menginginkan akses berbasis peran, biarkan `allowFrom` tidak diatur dan konfigurasikan `allowedRoles` sebagai gantinya.

  </Tab>
  <Tab title="Nonaktifkan persyaratan @mention">
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
    - **Periksa kontrol akses:** Pastikan ID pengguna Anda ada dalam `allowFrom`, atau hapus sementara `allowFrom` dan atur `allowedRoles: ["all"]` untuk pengujian.
    - **Periksa bahwa bot ada di channel:** Bot harus bergabung ke channel yang ditentukan dalam `channel`.
  </Accordion>
  <Accordion title="Masalah token">
    "Failed to connect" atau error autentikasi:

    - Pastikan `accessToken` adalah nilai OAuth access token (biasanya diawali dengan prefix `oauth:`)
    - Pastikan token memiliki scope `chat:read` dan `chat:write`
    - Jika menggunakan refresh token, pastikan `clientSecret` dan `refreshToken` diatur

  </Accordion>
  <Accordion title="Refresh token tidak berfungsi">
    Periksa log untuk peristiwa refresh:

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
  Username bot.
</ParamField>
<ParamField path="accessToken" type="string">
  OAuth access token dengan `chat:read` dan `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (dari Token Generator atau aplikasi Anda).
</ParamField>
<ParamField path="channel" type="string" required>
  Channel yang akan dimasuki.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Aktifkan akun ini.
</ParamField>
<ParamField path="clientSecret" type="string">
  Opsional: untuk refresh token otomatis.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opsional: untuk refresh token otomatis.
</ParamField>
<ParamField path="expiresIn" type="number">
  Masa berlaku token dalam detik.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Timestamp saat token diperoleh.
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
- `channels.twitch.username` - Username bot (config satu akun yang disederhanakan)
- `channels.twitch.accessToken` - OAuth access token (config satu akun yang disederhanakan)
- `channels.twitch.clientId` - Twitch Client ID (config satu akun yang disederhanakan)
- `channels.twitch.channel` - Channel yang akan dimasuki (config satu akun yang disederhanakan)
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

## Keamanan dan operasional

- **Perlakukan token seperti kata sandi** — Jangan pernah commit token ke git.
- **Gunakan refresh token otomatis** untuk bot yang berjalan lama.
- **Gunakan allowlist ID pengguna** alih-alih username untuk kontrol akses.
- **Pantau log** untuk peristiwa refresh token dan status koneksi.
- **Batasi scope token seminimal mungkin** — Hanya minta `chat:read` dan `chat:write`.
- **Jika macet**: Restart gateway setelah memastikan tidak ada proses lain yang memiliki sesi tersebut.

## Batasan

- **500 karakter** per pesan (dipecah otomatis pada batas kata).
- Markdown dihapus sebelum pemecahan.
- Tidak ada rate limiting (menggunakan rate limit bawaan Twitch).

## Terkait

- [Channel Routing](/id/channels/channel-routing) — routing sesi untuk pesan
- [Channels Overview](/id/channels) — semua channel yang didukung
- [Groups](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Security](/id/gateway/security) — model akses dan hardening
