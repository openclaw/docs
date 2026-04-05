---
read_when:
    - Anda ingin menghubungkan OpenClaw ke channel IRC atau DM
    - Anda sedang mengonfigurasi allowlist IRC, kebijakan grup, atau gating mention
summary: Penyiapan plugin IRC, kontrol akses, dan pemecahan masalah
title: IRC
x-i18n:
    generated_at: "2026-04-05T13:43:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: fceab2979db72116689c6c774d6736a8a2eee3559e3f3cf8969e673d317edd94
    source_path: channels/irc.md
    workflow: 15
---

# IRC

Gunakan IRC saat Anda ingin OpenClaw berada di channel klasik (`#room`) dan direct message.
IRC dikirim sebagai extension plugin, tetapi dikonfigurasi di config utama di bawah `channels.irc`.

## Mulai cepat

1. Aktifkan config IRC di `~/.openclaw/openclaw.json`.
2. Setidaknya atur:

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

3. Mulai/restart gateway:

```bash
openclaw gateway run
```

## Default keamanan

- `channels.irc.dmPolicy` default ke `"pairing"`.
- `channels.irc.groupPolicy` default ke `"allowlist"`.
- Dengan `groupPolicy="allowlist"`, atur `channels.irc.groups` untuk menentukan channel yang diizinkan.
- Gunakan TLS (`channels.irc.tls=true`) kecuali Anda memang sengaja menerima transport plaintext.

## Kontrol akses

Ada dua “gate” terpisah untuk channel IRC:

1. **Akses channel** (`groupPolicy` + `groups`): apakah bot menerima pesan dari suatu channel sama sekali.
2. **Akses pengirim** (`groupAllowFrom` / per-channel `groups["#channel"].allowFrom`): siapa yang diizinkan memicu bot di dalam channel tersebut.

Kunci config:

- Allowlist DM (akses pengirim DM): `channels.irc.allowFrom`
- Allowlist pengirim grup (akses pengirim channel): `channels.irc.groupAllowFrom`
- Kontrol per-channel (channel + pengirim + aturan mention): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` mengizinkan channel yang tidak dikonfigurasi (**tetap di-gate oleh mention secara default**)

Entri allowlist sebaiknya menggunakan identitas pengirim yang stabil (`nick!user@host`).
Pencocokan nick polos dapat berubah-ubah dan hanya diaktifkan saat `channels.irc.dangerouslyAllowNameMatching: true`.

### Jebakan umum: `allowFrom` untuk DM, bukan channel

Jika Anda melihat log seperti:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...artinya pengirim tidak diizinkan untuk pesan **grup/channel**. Perbaiki dengan salah satu cara berikut:

- mengatur `channels.irc.groupAllowFrom` (global untuk semua channel), atau
- mengatur allowlist pengirim per-channel: `channels.irc.groups["#channel"].allowFrom`

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

Walaupun suatu channel diizinkan (melalui `groupPolicy` + `groups`) dan pengirim diizinkan, OpenClaw secara default menggunakan **gating mention** dalam konteks grup.

Artinya Anda mungkin melihat log seperti `drop channel … (missing-mention)` kecuali pesan menyertakan pola mention yang cocok dengan bot.

Untuk membuat bot membalas di channel IRC **tanpa memerlukan mention**, nonaktifkan gating mention untuk channel tersebut:

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

## Catatan keamanan (disarankan untuk channel publik)

Jika Anda mengizinkan `allowFrom: ["*"]` di channel publik, siapa pun dapat memberi prompt ke bot.
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

### Tools berbeda per pengirim (pemilik mendapat lebih banyak kuasa)

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
- Kunci lama tanpa prefiks masih diterima dan hanya dicocokkan sebagai `id:`.
- Kebijakan pengirim pertama yang cocok akan menang; `"*"` adalah fallback wildcard.

Untuk informasi lebih lanjut tentang akses grup vs gating mention (dan bagaimana keduanya berinteraksi), lihat: [/channels/groups](/channels/groups).

## NickServ

Untuk mengidentifikasi diri ke NickServ setelah terhubung:

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

Registrasi satu kali opsional saat terhubung:

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

Nonaktifkan `register` setelah nick terdaftar agar tidak terjadi percobaan REGISTER berulang.

## Variabel lingkungan

Akun default mendukung:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (dipisahkan dengan koma)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## Pemecahan masalah

- Jika bot terhubung tetapi tidak pernah membalas di channel, verifikasi `channels.irc.groups` **dan** apakah gating mention membuang pesan (`missing-mention`). Jika Anda ingin bot membalas tanpa ping, set `requireMention:false` untuk channel tersebut.
- Jika login gagal, verifikasi ketersediaan nick dan kata sandi server.
- Jika TLS gagal pada jaringan kustom, verifikasi host/port dan penyiapan sertifikat.

## Terkait

- [Ringkasan Channel](/channels) — semua channel yang didukung
- [Pairing](/channels/pairing) — autentikasi DM dan alur pairing
- [Groups](/channels/groups) — perilaku obrolan grup dan gating mention
- [Channel Routing](/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/gateway/security) — model akses dan hardening
