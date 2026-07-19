---
read_when:
    - Menyiapkan integrasi chat Twitch untuk OpenClaw
sidebarTitle: Twitch
summary: 'Bot chat Twitch: instalasi, kredensial, kontrol akses, penyegaran token'
title: Twitch
x-i18n:
    generated_at: "2026-07-19T04:46:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d827c742ded5fd0b071443dead27b975e2414419b0facb486d7f9c0c9800b060
    source_path: channels/twitch.md
    workflow: 16
---

Dukungan obrolan Twitch melalui antarmuka obrolan (IRC) Twitch menggunakan klien Twurple. OpenClaw masuk sebagai akun bot Twitch, bergabung ke satu channel per akun yang dikonfigurasi, dan membalas di channel tersebut.

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

`plugins install` mendaftarkan dan mengaktifkan plugin. Memilih Twitch saat `openclaw onboard` atau `openclaw channels add` akan menginstalnya sesuai kebutuhan. Gunakan nama paket tanpa tambahan untuk mengikuti rilis saat ini; sematkan versi persis hanya untuk instalasi yang dapat direproduksi. Memerlukan OpenClaw 2026.4.10 atau yang lebih baru.

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
    - Lingkungan: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (hanya akun default)
    - Atau konfigurasi: `channels.twitch.accessToken`

    Jika keduanya ditetapkan, konfigurasi diprioritaskan (variabel lingkungan hanya menjadi cadangan untuk akun default).

  </Step>
  <Step title="Mulai Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Tambahkan kontrol akses (`allowFrom` atau `allowedRoles`) untuk mencegah pengguna yang tidak berwenang memicu bot. `requireMention` memiliki nilai default `true`.
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
      channel: "yourchannel", // Obrolan channel Twitch yang akan dimasuki (wajib)
      allowFrom: ["123456789"], // (disarankan) Hanya ID pengguna Twitch Anda
    },
  },
}
```

## Apa ini

- Channel Twitch yang dimiliki oleh Gateway.
- Perutean deterministik: balasan selalu dikirim kembali ke channel Twitch asal pesan.
- Setiap channel yang dimasuki dipetakan ke kunci sesi grup terisolasi `agent:<agentId>:twitch:group:<channel>`.
- `username` adalah akun bot (yang melakukan autentikasi), sedangkan `channel` adalah ruang obrolan yang akan dimasuki. Satu entri akun bergabung ke tepat satu channel.
- Token berfungsi dengan atau tanpa prefiks `oauth:`; OpenClaw menormalisasi kedua bentuk tersebut (wizard penyiapan mengharapkan bentuk `oauth:`).

## Durabilitas pesan masuk

OpenClaw memasukkan setiap pesan obrolan Twitch yang diterima ke antrean secara persisten sebelum pengiriman normal. Pesan yang tertunda atau dapat dicoba ulang tetap tersedia setelah Gateway dimulai ulang, tetap diserialisasi untuk channel yang dikonfigurasi, dan menggunakan ID pesan Twitch untuk mencegah entri antrean duplikat selama catatan penyelesaian aktif atau yang dipertahankan masih ada.

Obrolan Twitch tidak memutar ulang `PRIVMSG` setelah klien menerimanya. Hal ini melindungi rentang kegagalan antara penerimaan lokal dan pengiriman, tetapi tidak dapat memulihkan pesan yang terlewat sebelum penerimaan persisten. Jika penambahan ke antrean gagal, OpenClaw mencatat kegagalan tersebut; penyambungan ulang tidak meminta Twitch mengirim ulang pesan itu.

## Penyegaran token (opsional)

Token dari [Twitch Token Generator](https://twitchtokengenerator.com/) tidak dapat disegarkan oleh OpenClaw—buat ulang ketika kedaluwarsa (token berlaku selama beberapa jam; tidak memerlukan pendaftaran aplikasi).

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

Jika keduanya ditetapkan, plugin menggunakan penyedia autentikasi dengan penyegaran yang memperbarui token sebelum kedaluwarsa dan mencatat setiap penyegaran. Tanpa `refreshToken`, plugin mencatat `token refresh disabled (no refresh token)`; tanpa `clientSecret`, plugin kembali menggunakan token statis (tanpa penyegaran).

## Dukungan multiakun

Gunakan `channels.twitch.accounts` dengan kredensial per akun. Lihat [Konfigurasi](/id/gateway/configuration) untuk pola bersama.

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
Setiap entri akun memerlukan `accessToken` tersendiri (variabel lingkungan hanya mencakup akun default). Satu akun bergabung ke tepat satu channel, sehingga bergabung ke dua channel memerlukan dua akun. `channels.twitch.defaultAccount` menentukan akun yang menjadi default.
</Note>

## Kontrol akses

`allowFrom` adalah daftar izin ketat berisi ID pengguna Twitch. Jika ditetapkan, `allowedRoles` diabaikan; biarkan `allowFrom` tidak ditetapkan untuk menggunakan akses berbasis peran.

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
    Secara default, `requireMention` adalah `true`. Untuk merespons semua pesan yang diizinkan:

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

Temukan ID Anda menggunakan [konverter nama pengguna ke ID](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Pemecahan masalah

Pertama, jalankan perintah diagnostik:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot tidak merespons pesan">
    - **Periksa kontrol akses:** Pastikan ID pengguna Anda ada di `allowFrom`, atau hapus sementara `allowFrom` dan tetapkan `allowedRoles: ["all"]` untuk melakukan pengujian.
    - **Periksa gerbang penyebutan:** Dengan `requireMention: true` (default), pesan harus menyebut nama pengguna bot dengan @mention.
    - **Pastikan bot berada di channel:** Bot hanya bergabung ke channel yang disebutkan dalam `channel`.

  </Accordion>
  <Accordion title="Masalah token">
    "Gagal terhubung" atau kesalahan autentikasi:

    - Pastikan `accessToken` adalah nilai token akses OAuth (prefiks `oauth:` bersifat opsional)
    - Pastikan token memiliki cakupan `chat:read` dan `chat:write`
    - Jika menggunakan penyegaran token, pastikan `clientSecret` dan `refreshToken` ditetapkan

  </Accordion>
  <Accordion title="Penyegaran token tidak berfungsi">
    Periksa log untuk peristiwa penyegaran:

    ```text
    Menggunakan sumber token lingkungan untuk mybot
    Token akses disegarkan untuk pengguna 123456 (kedaluwarsa dalam 14400s)
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
  Token akses OAuth dengan `chat:read` dan `chat:write` (konfigurasi atau lingkungan untuk akun default).
</ParamField>
<ParamField path="clientId" type="string" required>
  ID Klien Twitch (dari Token Generator atau aplikasi Anda). Opsional dalam skema, tetapi wajib untuk terhubung.
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
  Masa berlaku token dalam detik (pelacakan penyegaran).
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

- `channels.twitch.enabled` - Aktifkan/nonaktifkan permulaan channel
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - Konfigurasi akun tunggal yang disederhanakan (akun `default` implisit; diprioritaskan daripada `accounts.default`)
- `channels.twitch.accounts.<accountName>` - Konfigurasi multiakun (semua bidang akun di atas)
- `channels.twitch.defaultAccount` - Nama akun yang menjadi default
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
  message: "Halo Twitch!",
}
```

`to` bersifat opsional dan secara default menggunakan `channel` yang dikonfigurasi untuk akun.

## Keamanan dan operasi

- **Perlakukan token seperti kata sandi** - jangan pernah melakukan commit token ke git.
- **Gunakan penyegaran token otomatis** untuk bot yang berjalan dalam waktu lama.
- **Gunakan daftar izin ID pengguna** alih-alih nama pengguna untuk kontrol akses.
- **Pantau log** untuk peristiwa penyegaran token dan status koneksi.
- **Batasi cakupan token seminimal mungkin** - hanya minta `chat:read` dan `chat:write`.
- **Jika mengalami kendala**: mulai ulang Gateway setelah memastikan tidak ada proses lain yang memiliki sesi tersebut.

## Batas

- **500 karakter** per pesan; balasan yang lebih panjang dibagi pada batas kata.
- Markdown dihapus sebelum dikirim (obrolan Twitch berupa teks biasa; baris baru diubah menjadi spasi).
- OpenClaw tidak menambahkan pembatasan laju sendiri; klien obrolan Twurple menangani batas laju Twitch.

## Terkait

- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan sebutan
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
