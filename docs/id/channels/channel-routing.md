---
read_when:
    - Mengubah perutean channel atau perilaku inbox
summary: Aturan perutean per channel (WhatsApp, Telegram, Discord, Slack) dan konteks bersama
title: Perutean Channel
x-i18n:
    generated_at: "2026-04-05T13:42:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63916c4dd0af5fc9bbd12581a9eb15fea14a380c5ade09323ca0c237db61e537
    source_path: channels/channel-routing.md
    workflow: 15
---

# Channel & perutean

OpenClaw merutekan balasan **kembali ke channel asal pesan**. Model tidak memilih channel; perutean bersifat deterministik dan dikendalikan oleh konfigurasi host.

## Istilah utama

- **Channel**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, ditambah extension channel. `webchat` adalah channel UI WebChat internal dan bukan channel outbound yang dapat dikonfigurasi.
- **AccountId**: instance akun per channel (jika didukung).
- Akun default channel opsional: `channels.<channel>.defaultAccount` memilih akun mana yang digunakan saat jalur outbound tidak menentukan `accountId`.
  - Dalam pengaturan multi-akun, tetapkan default eksplisit (`defaultAccount` atau `accounts.default`) saat dua atau lebih akun dikonfigurasi. Tanpanya, perutean fallback dapat memilih ID akun ternormalisasi pertama.
- **AgentId**: penyimpanan workspace + sesi yang terisolasi (“otak”).
- **SessionKey**: kunci bucket yang digunakan untuk menyimpan konteks dan mengendalikan konkurensi.

## Bentuk kunci sesi (contoh)

Pesan langsung disatukan ke sesi **utama** agen:

- `agent:<agentId>:<mainKey>` (default: `agent:main:main`)

Grup dan channel tetap terisolasi per channel:

- Grup: `agent:<agentId>:<channel>:group:<id>`
- Channel/room: `agent:<agentId>:<channel>:channel:<id>`

Thread:

- Thread Slack/Discord menambahkan `:thread:<threadId>` ke kunci dasar.
- Topik forum Telegram menyematkan `:topic:<topicId>` dalam kunci grup.

Contoh:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Penyematan rute DM utama

Saat `session.dmScope` adalah `main`, pesan langsung dapat berbagi satu sesi utama.
Untuk mencegah `lastRoute` sesi ditimpa oleh DM non-pemilik, OpenClaw menyimpulkan pemilik yang disematkan dari `allowFrom` jika semua kondisi berikut benar:

- `allowFrom` memiliki tepat satu entri non-wildcard.
- Entri tersebut dapat dinormalisasi menjadi ID pengirim konkret untuk channel itu.
- Pengirim DM masuk tidak cocok dengan pemilik yang disematkan itu.

Dalam kasus ketidakcocokan tersebut, OpenClaw tetap merekam metadata sesi masuk, tetapi melewati pembaruan `lastRoute` sesi utama.

## Aturan perutean (cara agen dipilih)

Perutean memilih **satu agen** untuk setiap pesan masuk:

1. **Kecocokan peer persis** (`bindings` dengan `peer.kind` + `peer.id`).
2. **Kecocokan peer induk** (pewarisan thread).
3. **Kecocokan guild + roles** (Discord) melalui `guildId` + `roles`.
4. **Kecocokan guild** (Discord) melalui `guildId`.
5. **Kecocokan team** (Slack) melalui `teamId`.
6. **Kecocokan akun** (`accountId` pada channel).
7. **Kecocokan channel** (akun apa pun pada channel tersebut, `accountId: "*"`).
8. **Agen default** (`agents.list[].default`, jika tidak maka entri daftar pertama, fallback ke `main`).

Saat sebuah binding menyertakan beberapa field kecocokan (`peer`, `guildId`, `teamId`, `roles`), **semua field yang disediakan harus cocok** agar binding tersebut berlaku.

Agen yang cocok menentukan workspace dan penyimpanan sesi mana yang digunakan.

## Grup broadcast (menjalankan beberapa agen)

Grup broadcast memungkinkan Anda menjalankan **beberapa agen** untuk peer yang sama **saat OpenClaw biasanya akan membalas** (misalnya: di grup WhatsApp, setelah penyebutan/activation gating).

Konfigurasi:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

Lihat: [Grup Broadcast](/channels/broadcast-groups).

## Gambaran umum konfigurasi

- `agents.list`: definisi agen bernama (workspace, model, dll.).
- `bindings`: memetakan channel/akun/peer masuk ke agen.

Contoh:

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Penyimpanan sesi

Penyimpanan sesi berada di bawah direktori state (default `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip JSONL berada di lokasi yang sama dengan penyimpanan

Anda dapat menimpa jalur penyimpanan melalui `session.store` dan templating `{agentId}`.

Penemuan sesi Gateway dan ACP juga memindai penyimpanan agen berbasis disk di bawah root `agents/` default dan di bawah root `session.store` bertemplat. Penyimpanan yang ditemukan harus tetap berada di dalam root agen yang telah di-resolve tersebut dan menggunakan file `sessions.json` biasa. Symlink dan jalur di luar root diabaikan.

## Perilaku WebChat

WebChat terpasang ke **agen yang dipilih** dan default ke sesi utama agen. Karena itu, WebChat memungkinkan Anda melihat konteks lintas-channel untuk agen tersebut di satu tempat.

## Konteks balasan

Balasan masuk mencakup:

- `ReplyToId`, `ReplyToBody`, dan `ReplyToSender` jika tersedia.
- Konteks kutipan ditambahkan ke `Body` sebagai blok `[Replying to ...]`.

Ini konsisten di semua channel.
