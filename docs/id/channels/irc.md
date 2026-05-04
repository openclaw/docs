---
read_when:
    - Anda ingin menghubungkan OpenClaw ke kanal IRC atau pesan langsung
    - Anda sedang mengonfigurasi daftar izin IRC, kebijakan grup, atau pembatasan penyebutan
summary: Penyiapan Plugin IRC, kontrol akses, dan pemecahan masalah
title: IRC
x-i18n:
    generated_at: "2026-05-04T02:21:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43c3098fe49a5e7405443df73e1bf752a579460dc0b2070c3d07f43b512bb555
    source_path: channels/irc.md
    workflow: 16
---

Gunakan IRC saat Anda menginginkan OpenClaw di saluran klasik (`#room`) dan pesan langsung.
IRC disertakan sebagai Plugin bawaan, tetapi dikonfigurasi di konfigurasi utama di bawah `channels.irc`.

## Mulai cepat

1. Aktifkan konfigurasi IRC di `~/.openclaw/openclaw.json`.
2. Tetapkan setidaknya:

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

Utamakan server IRC privat untuk koordinasi bot. Jika Anda sengaja menggunakan jaringan IRC publik, pilihan umum mencakup Libera.Chat, OFTC, dan Snoonet. Hindari saluran publik yang mudah ditebak untuk lalu lintas backchannel bot atau swarm.

3. Mulai/jalankan ulang Gateway:

```bash
openclaw gateway run
```

## Default keamanan

- IRC menggunakan soket TCP/TLS mentah di luar perutean forward proxy yang dikelola operator OpenClaw. Dalam deployment yang mewajibkan semua egress melalui forward proxy tersebut, tetapkan `channels.irc.enabled=false` kecuali egress IRC langsung disetujui secara eksplisit.
- `channels.irc.dmPolicy` default ke `"pairing"`.
- `channels.irc.groupPolicy` default ke `"allowlist"`.
- Dengan `groupPolicy="allowlist"`, tetapkan `channels.irc.groups` untuk menentukan saluran yang diizinkan.
- Gunakan TLS (`channels.irc.tls=true`) kecuali Anda sengaja menerima transport plaintext.

## Kontrol akses

Ada dua “gerbang” terpisah untuk saluran IRC:

1. **Akses saluran** (`groupPolicy` + `groups`): apakah bot menerima pesan dari suatu saluran sama sekali.
2. **Akses pengirim** (`groupAllowFrom` / per-saluran `groups["#channel"].allowFrom`): siapa yang diizinkan memicu bot di dalam saluran tersebut.

Kunci konfigurasi:

- Allowlist DM (akses pengirim DM): `channels.irc.allowFrom`
- Allowlist pengirim grup (akses pengirim saluran): `channels.irc.groupAllowFrom`
- Kontrol per-saluran (aturan saluran + pengirim + mention): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` mengizinkan saluran yang belum dikonfigurasi (**tetap dibatasi mention secara default**)

Entri allowlist sebaiknya menggunakan identitas pengirim yang stabil (`nick!user@host`).
Pencocokan nick polos dapat berubah dan hanya diaktifkan saat `channels.irc.dangerouslyAllowNameMatching: true`.

### Kekeliruan umum: `allowFrom` untuk DM, bukan saluran

Jika Anda melihat log seperti:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…itu berarti pengirim tidak diizinkan untuk pesan **grup/saluran**. Perbaiki dengan salah satu cara berikut:

- menetapkan `channels.irc.groupAllowFrom` (global untuk semua saluran), atau
- menetapkan allowlist pengirim per-saluran: `channels.irc.groups["#channel"].allowFrom`

Contoh (izinkan siapa pun di `#tuirc-dev` berbicara dengan bot):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Pemicu balasan (mention)

Meskipun saluran diizinkan (melalui `groupPolicy` + `groups`) dan pengirim diizinkan, OpenClaw secara default menggunakan **pembatasan mention** dalam konteks grup.

Artinya, Anda mungkin melihat log seperti `drop channel … (missing-mention)` kecuali pesan menyertakan pola mention yang cocok dengan bot.

Agar bot membalas di saluran IRC **tanpa memerlukan mention**, nonaktifkan pembatasan mention untuk saluran tersebut:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Atau untuk mengizinkan **semua** saluran IRC (tanpa allowlist per-saluran) dan tetap membalas tanpa mention:

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

Jika Anda mengizinkan `allowFrom: ["*"]` di saluran publik, siapa pun dapat memberi prompt ke bot.
Untuk mengurangi risiko, batasi alat untuk saluran tersebut.

### Alat yang sama untuk semua orang di saluran

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
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

### Alat berbeda per pengirim (pemilik mendapat lebih banyak kuasa)

Gunakan `toolsBySender` untuk menerapkan kebijakan yang lebih ketat ke `"*"` dan yang lebih longgar ke nick Anda:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
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

- Kunci `toolsBySender` sebaiknya menggunakan `id:` untuk nilai identitas pengirim IRC:
  `id:eigen` atau `id:eigen!~eigen@174.127.248.171` untuk pencocokan yang lebih kuat.
- Kunci lama tanpa prefiks masih diterima dan dicocokkan hanya sebagai `id:`.
- Kebijakan pengirim pertama yang cocok akan berlaku; `"*"` adalah fallback wildcard.

Untuk informasi lebih lanjut tentang akses grup vs pembatasan mention (dan bagaimana keduanya berinteraksi), lihat: [/channels/groups](/id/channels/groups).

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

Pendaftaran satu kali opsional saat terhubung:

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

Akun default mendukung:

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

`IRC_HOST` tidak dapat ditetapkan dari `.env` workspace; lihat [File `.env` workspace](/id/gateway/security).

## Pemecahan masalah

- Jika bot terhubung tetapi tidak pernah membalas di saluran, verifikasi `channels.irc.groups` **dan** apakah pembatasan mention menggugurkan pesan (`missing-mention`). Jika Anda ingin bot membalas tanpa ping, tetapkan `requireMention:false` untuk saluran tersebut.
- Jika login gagal, verifikasi ketersediaan nick dan kata sandi server.
- Jika TLS gagal pada jaringan kustom, verifikasi host/port dan penyiapan sertifikat.

## Terkait

- [Ikhtisar Saluran](/id/channels) — semua saluran yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Perutean Saluran](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
