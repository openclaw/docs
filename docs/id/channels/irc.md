---
read_when:
    - Anda ingin menghubungkan OpenClaw ke channel atau DM IRC
    - Anda sedang mengonfigurasi allowlist IRC, kebijakan grup, atau gating mention
summary: Penyiapan plugin IRC, kontrol akses, dan pemecahan masalah
title: IRC
x-i18n:
    generated_at: "2026-04-24T08:58:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 15
---

Gunakan IRC saat Anda menginginkan OpenClaw di channel klasik (`#room`) dan pesan langsung.

IRC dikirim sebagai plugin bawaan, tetapi dikonfigurasi di config utama pada `channels.irc`.

## Mulai cepat

1. Aktifkan config IRC di `~/.openclaw/openclaw.json`.
2. Atur setidaknya:

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

Utamakan server IRC privat untuk koordinasi bot. Jika Anda sengaja menggunakan jaringan IRC publik, pilihan umum mencakup Libera.Chat, OFTC, dan Snoonet. Hindari channel publik yang mudah ditebak untuk lalu lintas bot atau backchannel swarm.

3. Mulai/mulai ulang gateway:

```bash
openclaw gateway run
```

## Default keamanan

- `channels.irc.dmPolicy` default ke `"pairing"`.
- `channels.irc.groupPolicy` default ke `"allowlist"`.
- Dengan `groupPolicy="allowlist"`, atur `channels.irc.groups` untuk menentukan channel yang diizinkan.
- Gunakan TLS (`channels.irc.tls=true`) kecuali Anda memang sengaja menerima transport plaintext.

## Kontrol akses

Ada dua “gerbang” terpisah untuk channel IRC:

1. **Akses channel** (`groupPolicy` + `groups`): apakah bot menerima pesan dari suatu channel sama sekali.
2. **Akses pengirim** (`groupAllowFrom` / per-channel `groups["#channel"].allowFrom`): siapa yang diizinkan memicu bot di dalam channel tersebut.

Kunci config:

- Allowlist DM (akses pengirim DM): `channels.irc.allowFrom`
- Allowlist pengirim grup (akses pengirim channel): `channels.irc.groupAllowFrom`
- Kontrol per channel (aturan channel + pengirim + mention): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` mengizinkan channel yang tidak dikonfigurasi (**tetap menggunakan gating mention secara default**)

Entri allowlist sebaiknya menggunakan identitas pengirim yang stabil (`nick!user@host`).
Pencocokan nick tanpa tambahan bersifat dapat berubah dan hanya diaktifkan saat `channels.irc.dangerouslyAllowNameMatching: true`.

### Hal yang sering menjebak: `allowFrom` untuk DM, bukan channel

Jika Anda melihat log seperti:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...artinya pengirim tidak diizinkan untuk pesan **grup/channel**. Perbaiki dengan salah satu cara berikut:

- mengatur `channels.irc.groupAllowFrom` (global untuk semua channel), atau
- mengatur allowlist pengirim per channel: `channels.irc.groups["#channel"].allowFrom`

Contoh (izinkan siapa pun di `#tuirc-dev` berbicara ke bot):

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

Meskipun sebuah channel diizinkan (melalui `groupPolicy` + `groups`) dan pengirim diizinkan, OpenClaw secara default menggunakan **gating mention** dalam konteks grup.

Itu berarti Anda mungkin melihat log seperti `drop channel … (missing-mention)` kecuali pesan menyertakan pola mention yang cocok dengan bot.

Agar bot membalas di channel IRC **tanpa perlu mention**, nonaktifkan gating mention untuk channel tersebut:

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

Atau untuk mengizinkan **semua** channel IRC (tanpa allowlist per channel) dan tetap membalas tanpa mention:

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
Untuk mengurangi risiko, batasi alat untuk channel tersebut.

### Alat yang sama untuk semua orang di channel

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

### Alat berbeda per pengirim (owner mendapat lebih banyak kuasa)

Gunakan `toolsBySender` untuk menerapkan kebijakan yang lebih ketat ke `"*"` dan kebijakan yang lebih longgar ke nick Anda:

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
- Kebijakan pengirim pertama yang cocok akan digunakan; `"*"` adalah fallback wildcard.

Untuk info lebih lanjut tentang akses grup vs gating mention (dan cara keduanya berinteraksi), lihat: [/channels/groups](/id/channels/groups).

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

Pendaftaran satu kali opsional saat tersambung:

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

`IRC_HOST` tidak dapat diatur dari workspace `.env`; lihat [File `.env` workspace](/id/gateway/security).

## Pemecahan masalah

- Jika bot tersambung tetapi tidak pernah membalas di channel, verifikasi `channels.irc.groups` **dan** apakah gating mention membuang pesan (`missing-mention`). Jika Anda ingin bot membalas tanpa ping, atur `requireMention:false` untuk channel tersebut.
- Jika login gagal, verifikasi ketersediaan nick dan kata sandi server.
- Jika TLS gagal di jaringan kustom, verifikasi pengaturan host/port dan sertifikat.

## Terkait

- [Ikhtisar Channels](/id/channels) — semua channel yang didukung
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing
- [Grup](/id/channels/groups) — perilaku chat grup dan gating mention
- [Perutean Channel](/id/channels/channel-routing) — perutean sesi untuk pesan
- [Keamanan](/id/gateway/security) — model akses dan hardening
