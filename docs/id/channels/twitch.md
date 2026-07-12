---
read_when:
    - Menyiapkan integrasi obrolan Twitch untuk OpenClaw
sidebarTitle: Twitch
summary: 'Bot obrolan Twitch: instalasi, kredensial, kontrol akses, penyegaran token'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T14:01:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Dukungan obrolan Twitch melalui antarmuka obrolan (IRC) Twitch dengan klien Twurple. OpenClaw masuk sebagai akun bot Twitch, bergabung dengan satu kanal untuk setiap akun yang dikonfigurasi, dan membalas di kanal tersebut.

## Instalasi

Twitch disediakan sebagai plugin resmi; plugin ini bukan bagian dari instalasi inti.

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

`plugins install` mendaftarkan dan mengaktifkan plugin. Memilih Twitch saat menjalankan `openclaw onboard` atau `openclaw channels add` akan menginstalnya sesuai kebutuhan. Gunakan nama paket tanpa versi untuk mengikuti rilis saat ini; sematkan versi tertentu hanya untuk instalasi yang dapat direproduksi. Memerlukan OpenClaw 2026.4.10 atau yang lebih baru.

Detail: [Plugin](/id/tools/plugin)

## Penyiapan cepat

<Steps>
  <Step title="Instal plugin">
    Lihat [Instalasi](#install) di atas.
  </Step>
  <Step title="Buat akun bot Twitch">
    Buat akun Twitch khusus untuk bot (atau gunakan akun yang sudah ada).
  </Step>
  <Step title="Buat kredensial">
    Gunakan [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Pilih **Bot Token**
    - Pastikan cakupan `chat:read` dan `chat:write` dipilih
    - Salin **Client ID** dan **Access Token**

  </Step>
  <Step title="Temukan ID pengguna Twitch Anda">
    Gunakan [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) untuk mengonversi nama pengguna menjadi ID pengguna Twitch.
  </Step>
  <Step title="Konfigurasikan token">
    - Variabel lingkungan: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (hanya akun bawaan)
    - Atau konfigurasi: `channels.twitch.accessToken`

    Jika keduanya ditetapkan, konfigurasi diprioritaskan (variabel lingkungan hanya menjadi fallback untuk akun bawaan).

  </Step>
  <Step title="Mulai Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Tambahkan kontrol akses (`allowFrom` atau `allowedRoles`) untuk mencegah pengguna tanpa otorisasi memicu bot. Nilai bawaan `requireMention` adalah `true`.
</Warning>

Konfigurasi minimal:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Akun Twitch bot (melakukan autentikasi)
      accessToken: "oauth:abc123...", // Token akses OAuth (atau gunakan variabel lingkungan OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // ID klien dari Token Generator
      channel: "yourchannel", // Obrolan kanal Twitch yang akan dimasuki (wajib)
      allowFrom: ["123456789"], // (disarankan) Hanya ID pengguna Twitch Anda
    },
  },
}
```

## Apa itu

- Kanal Twitch yang dimiliki oleh Gateway.
- Perutean deterministik: balasan selalu dikirim kembali ke kanal Twitch asal pesan.
- Setiap kanal yang dimasuki dipetakan ke kunci sesi grup terisolasi `agent:<agentId>:twitch:group:<channel>`.
- `username` adalah akun bot (yang melakukan autentikasi), sedangkan `channel` adalah ruang obrolan yang akan dimasuki. Setiap entri akun bergabung dengan tepat satu kanal.
- Token berfungsi dengan atau tanpa prefiks `oauth:`; OpenClaw menormalisasi keduanya (wizard penyiapan mengharapkan bentuk `oauth:`).

## Penyegaran token (opsional)

Token dari [Twitch Token Generator](https://twitchtokengenerator.com/) tidak dapat disegarkan oleh OpenClaw—buat ulang setelah kedaluwarsa (token bertahan beberapa jam; pendaftaran aplikasi tidak diperlukan).

Untuk penyegaran otomatis, buat aplikasi Anda sendiri di [Twitch Developer Console](https://dev.twitch.tv/console), lalu tambahkan:

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

Jika keduanya ditetapkan, plugin menggunakan penyedia autentikasi dengan penyegaran yang memperbarui token sebelum kedaluwarsa dan mencatat setiap penyegaran. Tanpa `refreshToken`, plugin mencatat `token refresh disabled (no refresh token)`; tanpa `clientSecret`, plugin menggunakan fallback berupa token statis (tanpa penyegaran).

## Dukungan multiakun

Gunakan `channels.twitch.accounts` dengan kredensial per akun. Lihat [Konfigurasi](/id/gateway/configuration) untuk pola bersama.

Contoh (satu akun bot di dua kanal):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "yourchannel",
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
Setiap entri akun memerlukan `accessToken` tersendiri (variabel lingkungan hanya mencakup akun bawaan). Satu akun bergabung dengan tepat satu kanal, sehingga bergabung dengan dua kanal berarti memerlukan dua akun. `channels.twitch.defaultAccount` memilih akun yang menjadi bawaan.
</Note>

## Kontrol akses

`allowFrom` adalah daftar izin wajib berisi ID pengguna Twitch. Jika ditetapkan, `allowedRoles` diabaikan; jangan tetapkan `allowFrom` untuk menggunakan akses berbasis peran.

**Peran yang tersedia:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Daftar izin ID pengguna (paling aman)">
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
  </Tab>
  <Tab title="Nonaktifkan persyaratan @mention">
    Secara bawaan, `requireMention` bernilai `true`. Untuk merespons semua pesan yang diizinkan:

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

<Note>
**Mengapa ID pengguna?** Nama pengguna dapat berubah sehingga memungkinkan penyamaran. ID pengguna bersifat permanen.

Temukan ID Anda dengan [pengonversi nama pengguna ke ID](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Pemecahan masalah

Pertama, jalankan perintah diagnostik:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot tidak merespons pesan">
    - **Periksa kontrol akses:** Pastikan ID pengguna Anda tercantum dalam `allowFrom`, atau hapus `allowFrom` untuk sementara dan tetapkan `allowedRoles: ["all"]` untuk menguji.
    - **Periksa gerbang penyebutan:** Dengan `requireMention: true` (bawaan), pesan harus menyebut nama pengguna bot menggunakan @mention.
    - **Periksa apakah bot berada di kanal:** Bot hanya bergabung dengan kanal yang disebutkan dalam `channel`.

  </Accordion>
  <Accordion title="Masalah token">
    Kesalahan "Failed to connect" atau autentikasi:

    - Pastikan `accessToken` adalah nilai token akses OAuth (prefiks `oauth:` bersifat opsional)
    - Pastikan token memiliki cakupan `chat:read` dan `chat:write`
    - Jika menggunakan penyegaran token, pastikan `clientSecret` dan `refreshToken` ditetapkan

  </Accordion>
  <Accordion title="Penyegaran token tidak berfungsi">
    Periksa log untuk peristiwa penyegaran:

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Jika Anda melihat `token refresh disabled (no refresh token)`:

    - Pastikan `clientSecret` disediakan
    - Pastikan `refreshToken` disediakan

  </Accordion>
</AccordionGroup>

## Konfigurasi

### Konfigurasi akun

<ParamField path="username" type="string" required>
  Nama pengguna bot (akun yang melakukan autentikasi).
</ParamField>
<ParamField path="accessToken" type="string" required>
  Token akses OAuth dengan `chat:read` dan `chat:write` (konfigurasi atau variabel lingkungan untuk akun bawaan).
</ParamField>
<ParamField path="clientId" type="string" required>
  ID Klien Twitch (dari Token Generator atau aplikasi Anda). Opsional dalam skema, tetapi wajib untuk terhubung.
</ParamField>
<ParamField path="channel" type="string" required>
  Kanal yang akan dimasuki.
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
  Masa kedaluwarsa token dalam detik (pelacakan penyegaran).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Stempel waktu saat token diperoleh (pelacakan penyegaran).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Daftar izin ID pengguna. Jika ditetapkan, peran diabaikan.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Kontrol akses berbasis peran.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Wajibkan @mention untuk memicu bot.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Penggantian prefiks respons keluar untuk akun ini.
</ParamField>

### Opsi penyedia

- `channels.twitch.enabled` - Aktifkan/nonaktifkan pemulaian kanal
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - Konfigurasi satu akun yang disederhanakan (akun `default` implisit; diprioritaskan daripada `accounts.default`)
- `channels.twitch.accounts.<accountName>` - Konfigurasi multiakun (semua bidang akun di atas)
- `channels.twitch.defaultAccount` - Nama akun yang menjadi bawaan
- `channels.twitch.markdown.tables` - Mode perenderan tabel Markdown (`off` | `bullets` | `code` | `block`)

Contoh lengkap:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Tindakan alat

Agen dapat mengirim pesan Twitch melalui tindakan `send` pada alat pesan:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to` bersifat opsional dan nilai bawaannya adalah `channel` yang dikonfigurasi untuk akun.

## Keamanan dan operasi

- **Perlakukan token seperti kata sandi**—jangan pernah melakukan commit token ke git.
- **Gunakan penyegaran token otomatis** untuk bot yang berjalan lama.
- **Gunakan daftar izin ID pengguna** alih-alih nama pengguna untuk kontrol akses.
- **Pantau log** untuk peristiwa penyegaran token dan status koneksi.
- **Batasi cakupan token seminimal mungkin**—hanya minta `chat:read` dan `chat:write`.
- **Jika mengalami kendala**: mulai ulang Gateway setelah memastikan tidak ada proses lain yang memiliki sesi tersebut.

## Batasan

- **500 karakter** per pesan; balasan yang lebih panjang dipecah pada batas kata.
- Markdown dihapus sebelum pengiriman (obrolan Twitch berupa teks biasa; baris baru menjadi spasi).
- OpenClaw tidak menambahkan pembatasan laju sendiri; klien obrolan Twurple menangani batas laju Twitch.

## Terkait

- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gerbang penyebutan
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
