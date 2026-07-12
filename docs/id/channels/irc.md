---
read_when:
    - Anda ingin menghubungkan OpenClaw ke kanal IRC atau pesan langsung
    - Anda sedang mengonfigurasi daftar izin IRC, kebijakan grup, atau pembatasan berdasarkan penyebutan
summary: Penyiapan plugin IRC, kontrol akses, dan pemecahan masalah
title: IRC
x-i18n:
    generated_at: "2026-07-12T13:56:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Gunakan IRC saat Anda ingin menjalankan OpenClaw di saluran klasik (`#room`) dan pesan langsung.
Instal Plugin IRC resmi, lalu konfigurasikan di bawah `channels.irc`.

## Mulai cepat

1. Instal Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Tetapkan setidaknya host, nama panggilan, dan saluran yang akan diikuti di `~/.openclaw/openclaw.json`:

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

Utamakan server IRC privat untuk koordinasi bot. Jika Anda sengaja menggunakan jaringan IRC publik, pilihan umum mencakup Libera.Chat, OFTC, dan Snoonet. Hindari saluran publik yang mudah ditebak untuk lalu lintas saluran belakang bot atau swarm.

## Pengaturan koneksi

| Kunci                         | Bawaan                        | Catatan                                                               |
| ----------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| `host`                        | tidak ada (wajib)             | Nama host server IRC                                                  |
| `port`                        | `6697` dengan TLS, `6667` biasa | 1-65535                                                             |
| `tls`                         | `true`                        | Tetapkan `false` hanya jika sengaja menggunakan teks biasa            |
| `nick`                        | tidak ada (wajib)             | Nama panggilan bot                                                    |
| `username`                    | nama panggilan, jika tidak `openclaw` | Nama pengguna IRC                                             |
| `realname`                    | `OpenClaw`                    | Kolom nama asli/GECOS                                                 |
| `password` / `passwordFile`   | tidak ada                     | Kata sandi server; berkas harus berupa berkas biasa                    |
| `channels`                    | tidak ada                     | Saluran yang akan diikuti (`["#openclaw"]`)                           |
| `accounts` / `defaultAccount` | tidak ada                     | Penyiapan multiakun; variabel lingkungan hanya mengisi akun bawaan    |

## Bawaan keamanan

- IRC menggunakan soket TCP/TLS mentah di luar perutean proksi penerusan yang dikelola operator OpenClaw. Dalam penerapan yang mengharuskan semua lalu lintas keluar melalui proksi penerusan tersebut, tetapkan `channels.irc.enabled=false` kecuali lalu lintas IRC langsung telah disetujui secara eksplisit.
- `channels.irc.dmPolicy` secara bawaan adalah `"pairing"`: pengirim pesan langsung yang tidak dikenal menerima kode pemasangan yang Anda setujui dengan `openclaw pairing approve irc <code>`.
- `channels.irc.groupPolicy` secara bawaan adalah `"allowlist"`.
- Dengan `groupPolicy="allowlist"`, tetapkan `channels.irc.groups` untuk menentukan saluran yang diizinkan.
- Gunakan TLS (`channels.irc.tls=true`) kecuali Anda sengaja menerima transmisi teks biasa.

## Kontrol akses

Ada dua "gerbang" terpisah untuk saluran IRC:

1. **Akses saluran** (`groupPolicy` + `groups`): apakah bot menerima pesan dari suatu saluran.
2. **Akses pengirim** (`groupAllowFrom` / `groups["#channel"].allowFrom` per saluran): siapa yang diizinkan memicu bot di dalam saluran tersebut.

Kunci konfigurasi:

- Daftar izin pesan langsung (akses pengirim pesan langsung): `channels.irc.allowFrom`
- Daftar izin pengirim grup (akses pengirim saluran): `channels.irc.groupAllowFrom`
- Kontrol per saluran (aturan saluran + pengirim + penyebutan): `channels.irc.groups["#channel"]` dengan `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills`, dan `systemPrompt`
- `channels.irc.groupPolicy="open"` mengizinkan saluran yang belum dikonfigurasi (**secara bawaan tetap memerlukan penyebutan**)

Entri daftar izin sebaiknya menggunakan identitas pengirim yang stabil (`nick!user@host`).
Pencocokan nama panggilan saja dapat berubah dan hanya diaktifkan jika `channels.irc.dangerouslyAllowNameMatching: true`.

### Kendala umum: `allowFrom` untuk pesan langsung, bukan saluran

Jika Anda melihat log seperti:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...artinya pengirim tidak diizinkan untuk pesan **grup/saluran**. Perbaiki dengan salah satu cara berikut:

- menetapkan `channels.irc.groupAllowFrom` (berlaku global untuk semua saluran), atau
- menetapkan daftar izin pengirim per saluran: `channels.irc.groups["#channel"].allowFrom`

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

Meskipun suatu saluran diizinkan (melalui `groupPolicy` + `groups`) dan pengirim diizinkan, secara bawaan OpenClaw menerapkan **gerbang penyebutan** dalam konteks grup. Bot dianggap disebutkan ketika pesan berisi nama panggilan bot yang terhubung atau cocok dengan pola penyebutan yang Anda konfigurasikan.

Artinya, Anda mungkin melihat log seperti `drop channel … (missing-mention)` kecuali pesan menyertakan pola penyebutan yang cocok dengan bot.

Agar bot membalas di saluran IRC **tanpa memerlukan penyebutan**, nonaktifkan gerbang penyebutan untuk saluran tersebut:

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

Atau, untuk mengizinkan **semua** saluran IRC (tanpa daftar izin per saluran) dan tetap membalas tanpa penyebutan:

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

## Catatan keamanan (disarankan untuk saluran publik)

Jika Anda mengizinkan `allowFrom: ["*"]` di saluran publik, siapa pun dapat memberikan perintah kepada bot.
Untuk mengurangi risiko, batasi alat untuk saluran tersebut.

### Alat yang sama untuk semua orang di saluran

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

Gunakan `toolsBySender` untuk menerapkan kebijakan yang lebih ketat pada `"*"` dan kebijakan yang lebih longgar pada nama panggilan Anda:

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

- Kunci `toolsBySender` sebaiknya menggunakan prefiks eksplisit (`channel:`, `id:`, `e164:`, `username:`, `name:`). Untuk IRC, gunakan `id:` dengan nilai identitas pengirim: `id:alice` atau `id:alice!~alice@203.0.113.7` untuk pencocokan yang lebih kuat.
- Kunci lama tanpa prefiks masih diterima, hanya dicocokkan sebagai `id:`, dan menghasilkan peringatan penghentian penggunaan.
- Kebijakan pengirim pertama yang cocok akan digunakan; `"*"` adalah pengganti umum.

Untuk informasi selengkapnya tentang akses grup dibandingkan dengan gerbang penyebutan (dan cara keduanya berinteraksi), lihat: [/channels/groups](/id/channels/groups).

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

Identifikasi NickServ dijalankan secara bawaan setiap kali kata sandi ditetapkan (`enabled` hanya perlu diatur ke `false` untuk menonaktifkannya). `service` secara bawaan adalah `NickServ`; `passwordFile` merupakan alternatif untuk `password` sebaris.

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

Nonaktifkan `register` setelah nama panggilan terdaftar untuk menghindari upaya REGISTER berulang.

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

- Jika bot terhubung tetapi tidak pernah membalas di saluran, periksa `channels.irc.groups` **dan** apakah gerbang penyebutan membuang pesan (`missing-mention`). Jika Anda ingin bot membalas tanpa panggilan, tetapkan `requireMention:false` untuk saluran tersebut.
- Jika proses masuk gagal, periksa ketersediaan nama panggilan dan kata sandi server.
- Jika TLS gagal di jaringan khusus, periksa host/port dan penyiapan sertifikat.

## Terkait

- [Ikhtisar saluran](/id/channels) — semua saluran yang didukung
- [Pemasangan](/id/channels/pairing) — autentikasi pesan langsung dan alur pemasangan
- [Grup](/id/channels/groups) — perilaku obrolan grup dan gerbang penyebutan
- [Perutean saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan penguatan
