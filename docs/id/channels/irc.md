---
read_when:
    - Anda ingin menghubungkan OpenClaw ke kanal IRC atau DM
    - Anda sedang mengonfigurasi daftar izin IRC, kebijakan grup, atau pembatasan penyebutan
summary: Penyiapan Plugin IRC, kontrol akses, dan pemecahan masalah
title: IRC
x-i18n:
    generated_at: "2026-06-27T17:10:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

Gunakan IRC saat Anda menginginkan OpenClaw di channel klasik (`#room`) dan pesan langsung.
Instal Plugin IRC resmi, lalu konfigurasikan di bawah `channels.irc`.

## Mulai cepat

1. Instal Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Aktifkan konfigurasi IRC di `~/.openclaw/openclaw.json`.
3. Tetapkan setidaknya:

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

Utamakan server IRC privat untuk koordinasi bot. Jika Anda sengaja menggunakan jaringan IRC publik, pilihan umum mencakup Libera.Chat, OFTC, dan Snoonet. Hindari channel publik yang mudah ditebak untuk lalu lintas backchannel bot atau swarm.

4. Mulai/jalankan ulang gateway:

```bash
openclaw gateway run
```

## Default keamanan

- IRC menggunakan soket TCP/TLS mentah di luar perutean forward proxy yang dikelola operator OpenClaw. Dalam deployment yang mewajibkan semua egress melalui forward proxy tersebut, tetapkan `channels.irc.enabled=false` kecuali egress IRC langsung disetujui secara eksplisit.
- `channels.irc.dmPolicy` default ke `"pairing"`.
- `channels.irc.groupPolicy` default ke `"allowlist"`.
- Dengan `groupPolicy="allowlist"`, tetapkan `channels.irc.groups` untuk mendefinisikan channel yang diizinkan.
- Gunakan TLS (`channels.irc.tls=true`) kecuali Anda sengaja menerima transport plaintext.

## Kontrol akses

Ada dua "gerbang" terpisah untuk channel IRC:

1. **Akses channel** (`groupPolicy` + `groups`): apakah bot menerima pesan dari sebuah channel sama sekali.
2. **Akses pengirim** (`groupAllowFrom` / per-channel `groups["#channel"].allowFrom`): siapa yang diizinkan memicu bot di dalam channel tersebut.

Kunci konfigurasi:

- Allowlist DM (akses pengirim DM): `channels.irc.allowFrom`
- Allowlist pengirim grup (akses pengirim channel): `channels.irc.groupAllowFrom`
- Kontrol per-channel (aturan channel + pengirim + mention): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` mengizinkan channel yang tidak dikonfigurasi (**tetap dibatasi mention secara default**)

Entri allowlist harus menggunakan identitas pengirim yang stabil (`nick!user@host`).
Pencocokan nick saja dapat berubah dan hanya diaktifkan saat `channels.irc.dangerouslyAllowNameMatching: true`.

### Kesalahan umum: `allowFrom` untuk DM, bukan channel

Jika Anda melihat log seperti:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...itu berarti pengirim tidak diizinkan untuk pesan **grup/channel**. Perbaiki dengan salah satu cara berikut:

- menetapkan `channels.irc.groupAllowFrom` (global untuk semua channel), atau
- menetapkan allowlist pengirim per-channel: `channels.irc.groups["#channel"].allowFrom`

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

Meskipun sebuah channel diizinkan (melalui `groupPolicy` + `groups`) dan pengirim diizinkan, OpenClaw secara default menggunakan **pembatasan mention** dalam konteks grup.

Artinya, Anda mungkin melihat log seperti `drop channel … (missing-mention)` kecuali pesan menyertakan pola mention yang cocok dengan bot.

Agar bot membalas di channel IRC **tanpa memerlukan mention**, nonaktifkan pembatasan mention untuk channel tersebut:

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

Atau untuk mengizinkan **semua** channel IRC (tanpa allowlist per-channel) dan tetap membalas tanpa mention:

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

## Catatan keamanan (direkomendasikan untuk channel publik)

Jika Anda mengizinkan `allowFrom: ["*"]` di channel publik, siapa pun dapat memberi prompt kepada bot.
Untuk mengurangi risiko, batasi tools untuk channel tersebut.

### Tools yang sama untuk semua orang di channel

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

### Tools berbeda per pengirim (pemilik mendapatkan kuasa lebih besar)

Gunakan `toolsBySender` untuk menerapkan kebijakan yang lebih ketat pada `"*"` dan yang lebih longgar pada nick Anda:

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

- Kunci `toolsBySender` harus menggunakan `id:` untuk nilai identitas pengirim IRC:
  `id:eigen` atau `id:eigen!~eigen@174.127.248.171` untuk pencocokan yang lebih kuat.
- Kunci lama tanpa prefiks masih diterima dan dicocokkan hanya sebagai `id:`.
- Kebijakan pengirim pertama yang cocok akan berlaku; `"*"` adalah fallback wildcard.

Untuk selengkapnya tentang akses grup vs pembatasan mention (dan bagaimana keduanya berinteraksi), lihat: [/channels/groups](/id/channels/groups).

## NickServ

Untuk mengidentifikasi dengan NickServ setelah tersambung:

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

Registrasi satu kali opsional saat tersambung:

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

Nonaktifkan `register` setelah nick terdaftar untuk menghindari upaya REGISTER berulang.

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

- Jika bot tersambung tetapi tidak pernah membalas di channel, verifikasi `channels.irc.groups` **dan** apakah pembatasan mention menjatuhkan pesan (`missing-mention`). Jika Anda ingin bot membalas tanpa ping, tetapkan `requireMention:false` untuk channel tersebut.
- Jika login gagal, verifikasi ketersediaan nick dan kata sandi server.
- Jika TLS gagal pada jaringan kustom, verifikasi host/port dan penyiapan sertifikat.

## Terkait

- [Ikhtisar Channel](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan pembatasan mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
