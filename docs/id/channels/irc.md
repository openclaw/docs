---
read_when:
    - Anda ingin menghubungkan OpenClaw ke channel IRC atau DM
    - Anda sedang mengonfigurasi daftar izin IRC, kebijakan grup, atau pembatasan penyebutan
summary: Penyiapan plugin IRC, kontrol akses, dan pemecahan masalah
title: IRC
x-i18n:
    generated_at: "2026-07-19T04:55:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 85c3da80b45d6611872ddbd10b3be4a5742b46e355e8bb554353a478f2a1702f
    source_path: channels/irc.md
    workflow: 16
---

Gunakan IRC ketika Anda menginginkan OpenClaw di kanal klasik (`#room`) dan pesan langsung.
Instal plugin IRC resmi, lalu konfigurasikan di bawah `channels.irc`.

## Mulai cepat

1. Instal plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Tetapkan setidaknya host, nick, dan kanal yang akan diikuti di `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. Mulai/mulai ulang Gateway:

```bash
openclaw gateway run
```

Utamakan server IRC privat untuk koordinasi bot. Jika Anda sengaja menggunakan jaringan IRC publik, pilihan umum mencakup Libera.Chat, OFTC, dan Snoonet. Hindari kanal publik yang mudah ditebak untuk lalu lintas kanal belakang bot atau swarm.

## Ketahanan pesan masuk

OpenClaw menulis setiap `PRIVMSG` IRC yang diterima ke antrean masuk durabelnya sebelum pemeriksaan kebijakan normal dan pengiriman agen. Pesan yang tertunda atau dapat dicoba ulang tetap tersedia setelah Gateway dimulai ulang dan tetap diserialkan per kanal atau rekan pesan langsung.

IRC tidak menyediakan ID pengiriman yang dapat diputar ulang atau mengirim ulang pesan yang terlewat oleh klien yang terputus. Oleh karena itu, OpenClaw menetapkan ID lokal yang stabil hanya dalam koneksi TCP saat ini. Antrean melindungi rentang waktu lokal dari penerimaan hingga pengiriman; antrean tidak dapat memulihkan pesan yang tidak pernah mencapai OpenClaw atau mendeduplikasi pengiriman ulang server antar-koneksi.

## Pengaturan koneksi

| Kunci                         | Bawaan                        | Catatan                                                     |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | tidak ada (wajib)             | Nama host server IRC                                        |
| `port`                        | `6697` dengan TLS, `6667` tanpa TLS | 1-65535                                                     |
| `tls`                         | `true`                        | Tetapkan `false` hanya jika sengaja menggunakan teks biasa |
| `nick`                        | tidak ada (wajib)             | Nick bot                                                    |
| `username`                    | nick, jika tidak `openclaw`    | Nama pengguna IRC                                           |
| `realname`                    | `OpenClaw`                    | Kolom realname/GECOS                                        |
| `password` / `passwordFile`   | tidak ada                     | Kata sandi server; berkas harus berupa berkas reguler        |
| `channels`                    | tidak ada                     | Kanal yang akan diikuti (`["#openclaw"]`)                 |
| `accounts` / `defaultAccount` | tidak ada                     | Penyiapan multiakun; variabel lingkungan hanya mengisi akun bawaan |

## Bawaan keamanan

- IRC menggunakan soket TCP/TLS mentah di luar perutean proksi penerusan yang dikelola operator OpenClaw. Dalam penerapan yang mengharuskan semua lalu lintas keluar melalui proksi penerusan tersebut, tetapkan `channels.irc.enabled=false` kecuali lalu lintas keluar IRC langsung disetujui secara eksplisit.
- `channels.irc.dmPolicy` secara bawaan adalah `"pairing"`: pengirim DM yang tidak dikenal memperoleh kode pemasangan yang Anda setujui dengan `openclaw pairing approve irc <code>`.
- `channels.irc.groupPolicy` secara bawaan adalah `"allowlist"`.
- Dengan `groupPolicy="allowlist"`, tetapkan `channels.irc.groups` untuk menentukan kanal yang diizinkan.
- Gunakan TLS (`channels.irc.tls=true`) kecuali Anda sengaja menerima transportasi teks biasa.

## Kontrol akses

Ada dua "gerbang" terpisah untuk kanal IRC:

1. **Akses kanal** (`groupPolicy` + `groups`): apakah bot menerima pesan dari suatu kanal atau tidak.
2. **Akses pengirim** (`groupAllowFrom` / `groups["#channel"].allowFrom` per kanal): siapa yang diizinkan memicu bot di dalam kanal tersebut.

Kunci konfigurasi:

- Daftar izin DM (akses pengirim DM): `channels.irc.allowFrom`
- Daftar izin pengirim grup (akses pengirim kanal): `channels.irc.groupAllowFrom`
- Kontrol per kanal (aturan kanal + pengirim + penyebutan): `channels.irc.groups["#channel"]` dengan `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills`, dan `systemPrompt`
- `channels.irc.groupPolicy="open"` mengizinkan kanal yang belum dikonfigurasi (**secara bawaan tetap dibatasi oleh penyebutan**)

Entri daftar izin sebaiknya menggunakan identitas pengirim yang stabil (`nick!user@host`).
Pencocokan nick tanpa awalan dapat berubah dan hanya diaktifkan ketika `channels.irc.dangerouslyAllowNameMatching: true`.

### Kendala umum: `allowFrom` untuk DM, bukan kanal

Jika Anda melihat log seperti:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...artinya pengirim tidak diizinkan untuk pesan **grup/kanal**. Perbaiki dengan salah satu cara berikut:

- menetapkan `channels.irc.groupAllowFrom` (global untuk semua kanal), atau
- menetapkan daftar izin pengirim per kanal: `channels.irc.groups["#channel"].allowFrom`

Contoh (izinkan siapa pun di `#openclaw` berbicara dengan bot):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Pemicu balasan (penyebutan)

Meskipun suatu kanal diizinkan (melalui `groupPolicy` + `groups`) dan pengirim diizinkan, OpenClaw secara bawaan menerapkan **pembatasan berdasarkan penyebutan** dalam konteks grup. Bot dianggap disebut ketika pesan memuat nick bot yang terhubung atau cocok dengan pola penyebutan yang Anda konfigurasi.

Artinya, Anda mungkin melihat log seperti `drop channel … (missing-mention)` kecuali pesan menyertakan pola penyebutan yang cocok dengan bot.

Agar bot membalas di kanal IRC **tanpa memerlukan penyebutan**, nonaktifkan pembatasan berdasarkan penyebutan untuk kanal tersebut:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Atau, untuk mengizinkan **semua** kanal IRC (tanpa daftar izin per kanal) dan tetap membalas tanpa penyebutan:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Catatan keamanan (disarankan untuk kanal publik)

Jika Anda mengizinkan `allowFrom: ["*"]` di kanal publik, siapa pun dapat memberi prompt kepada bot.
Untuk mengurangi risiko, batasi alat untuk kanal tersebut.

### Alat yang sama untuk semua orang di kanal

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Alat berbeda per pengirim (pemilik mendapat kewenangan lebih besar)

Gunakan `toolsBySender` untuk menerapkan kebijakan yang lebih ketat pada `"*"` dan kebijakan yang lebih longgar pada nick Anda:

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Catatan:

- Kunci `toolsBySender` sebaiknya menggunakan awalan eksplisit (`channel:`, `id:`, `e164:`, `username:`, `name:`). Untuk IRC, gunakan `id:` dengan nilai identitas pengirim: `id:alice` atau `id:alice!~alice@203.0.113.7` untuk pencocokan yang lebih kuat.
- Kunci lama tanpa awalan masih diterima, hanya dicocokkan sebagai `id:`, dan memunculkan peringatan penghentian dukungan.
- Kebijakan pengirim pertama yang cocok akan digunakan; `"*"` adalah fallback karakter pengganti.

Untuk informasi selengkapnya tentang akses grup dibandingkan pembatasan berdasarkan penyebutan (dan cara keduanya berinteraksi), lihat: [/channels/groups](/id/channels/groups).

## NickServ

Untuk mengidentifikasi diri dengan NickServ setelah terhubung:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Identifikasi NickServ dijalankan secara bawaan setiap kali kata sandi ditetapkan (`enabled` hanya perlu bernilai `false` untuk menonaktifkannya). `service` secara bawaan adalah `NickServ`; `passwordFile` merupakan alternatif untuk `password` sebaris.

Pendaftaran satu kali opsional saat terhubung (`register: true` memerlukan `registerEmail`):

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Nonaktifkan `register` setelah nick terdaftar untuk menghindari percobaan REGISTER berulang.

## Variabel lingkungan

Akun bawaan mendukung:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (dipisahkan koma)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` tidak dapat ditetapkan dari `.env` ruang kerja; lihat [Berkas `.env` ruang kerja](/id/gateway/security).

## Pemecahan masalah

- Jika bot terhubung tetapi tidak pernah membalas di kanal, periksa `channels.irc.groups` **dan** apakah pembatasan berdasarkan penyebutan membuang pesan (`missing-mention`). Jika Anda ingin bot membalas tanpa ping, tetapkan `requireMention:false` untuk kanal tersebut.
- Jika proses masuk gagal, periksa ketersediaan nick dan kata sandi server.
- Jika TLS gagal pada jaringan khusus, periksa host/port dan penyiapan sertifikat.

## Terkait

- [Ikhtisar Kanal](/id/channels) — semua kanal yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan pembatasan berdasarkan penyebutan
- [Perutean Kanal](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
