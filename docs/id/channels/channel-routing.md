---
read_when:
    - Mengubah perutean saluran atau perilaku kotak masuk
summary: Aturan perutean per saluran (WhatsApp, Telegram, Discord, Slack) dan konteks bersama
title: Perutean kanal
x-i18n:
    generated_at: "2026-04-30T09:32:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43347048fcfd137cc3a0b2cfdc4cf36426fdcf9645f2d1a05ce9cf49688cf0d
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanal & perutean

OpenClaw merutekan balasan **kembali ke kanal tempat pesan berasal**. Model
tidak memilih kanal; perutean bersifat deterministik dan dikendalikan oleh
konfigurasi host.

## Istilah kunci

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, plus kanal Plugin. `webchat` adalah kanal UI WebChat internal dan bukan kanal keluar yang dapat dikonfigurasi.
- **AccountId**: instance akun per kanal (jika didukung).
- Akun default kanal opsional: `channels.<channel>.defaultAccount` memilih
  akun mana yang digunakan ketika jalur keluar tidak menentukan `accountId`.
  - Dalam penyiapan multi-akun, tetapkan default eksplisit (`defaultAccount` atau `accounts.default`) ketika dua akun atau lebih dikonfigurasi. Tanpanya, perutean fallback dapat memilih ID akun ternormalisasi pertama.
- **AgentId**: workspace + penyimpanan sesi yang terisolasi (“brain”).
- **SessionKey**: kunci bucket yang digunakan untuk menyimpan konteks dan mengendalikan konkurensi.

## Bentuk kunci sesi (contoh)

Pesan langsung secara default digabungkan ke sesi **main** agen:

- `agent:<agentId>:<mainKey>` (default: `agent:main:main`)

Bahkan ketika riwayat percakapan pesan langsung dibagikan dengan main, kebijakan sandbox dan
tool menggunakan kunci runtime direct-chat per akun turunan untuk DM eksternal
sehingga pesan yang berasal dari kanal tidak diperlakukan seperti run sesi main lokal.

Grup dan kanal tetap terisolasi per kanal:

- Grup: `agent:<agentId>:<channel>:group:<id>`
- Kanal/ruangan: `agent:<agentId>:<channel>:channel:<id>`

Thread:

- Thread Slack/Discord menambahkan `:thread:<threadId>` ke kunci dasar.
- Topik forum Telegram menyematkan `:topic:<topicId>` di kunci grup.

Contoh:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Penyematan rute DM main

Ketika `session.dmScope` adalah `main`, pesan langsung dapat berbagi satu sesi main.
Untuk mencegah `lastRoute` sesi ditimpa oleh DM non-pemilik,
OpenClaw menyimpulkan pemilik yang disematkan dari `allowFrom` ketika semua hal berikut benar:

- `allowFrom` memiliki tepat satu entri non-wildcard.
- Entri tersebut dapat dinormalisasi menjadi ID pengirim konkret untuk kanal itu.
- Pengirim DM masuk tidak cocok dengan pemilik yang disematkan tersebut.

Dalam kasus ketidakcocokan itu, OpenClaw tetap mencatat metadata sesi masuk, tetapi
melewati pembaruan `lastRoute` sesi main.

## Pencatatan masuk yang dijaga

Plugin kanal dapat menandai catatan sesi masuk sebagai `createIfMissing: false`
ketika jalur yang dijaga tidak boleh membuat sesi OpenClaw baru. Dalam mode itu,
OpenClaw dapat memperbarui metadata dan `lastRoute` untuk sesi yang sudah ada, tetapi
tidak membuat entri sesi khusus rute hanya karena sebuah pesan teramati.

## Aturan perutean (bagaimana agen dipilih)

Perutean memilih **satu agen** untuk setiap pesan masuk:

1. **Kecocokan peer persis** (`bindings` dengan `peer.kind` + `peer.id`).
2. **Kecocokan peer induk** (pewarisan thread).
3. **Kecocokan guild + role** (Discord) melalui `guildId` + `roles`.
4. **Kecocokan guild** (Discord) melalui `guildId`.
5. **Kecocokan tim** (Slack) melalui `teamId`.
6. **Kecocokan akun** (`accountId` pada kanal).
7. **Kecocokan kanal** (akun apa pun pada kanal itu, `accountId: "*"`).
8. **Agen default** (`agents.list[].default`, selain itu entri daftar pertama, fallback ke `main`).

Ketika sebuah binding menyertakan beberapa field kecocokan (`peer`, `guildId`, `teamId`, `roles`), **semua field yang disediakan harus cocok** agar binding tersebut berlaku.

Agen yang cocok menentukan workspace dan penyimpanan sesi mana yang digunakan.

## Grup siaran (menjalankan beberapa agen)

Grup siaran memungkinkan Anda menjalankan **beberapa agen** untuk peer yang sama **ketika OpenClaw biasanya akan membalas** (misalnya: di grup WhatsApp, setelah gating mention/aktivasi).

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

Lihat: [Grup Siaran](/id/channels/broadcast-groups).

## Ikhtisar konfigurasi

- `agents.list`: definisi agen bernama (workspace, model, dll.).
- `bindings`: memetakan kanal/akun/peer masuk ke agen.

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
- Transkrip JSONL berada berdampingan dengan penyimpanan

Anda dapat menimpa jalur penyimpanan melalui `session.store` dan templating `{agentId}`.

Penemuan sesi Gateway dan ACP juga memindai penyimpanan agen berbasis disk di bawah
root `agents/` default dan di bawah root `session.store` bertemplate. Penyimpanan yang ditemukan
harus tetap berada di dalam root agen yang di-resolve tersebut dan menggunakan file
`sessions.json` reguler. Symlink dan jalur di luar root diabaikan.

## Perilaku WebChat

WebChat terhubung ke **agen yang dipilih** dan secara default menggunakan sesi main agen.
Karena itu, WebChat memungkinkan Anda melihat konteks lintas kanal untuk agen tersebut
di satu tempat.

## Konteks balasan

Balasan masuk menyertakan:

- `ReplyToId`, `ReplyToBody`, dan `ReplyToSender` bila tersedia.
- Konteks kutipan ditambahkan ke `Body` sebagai blok `[Replying to ...]`.

Ini konsisten di seluruh kanal.

## Terkait

- [Grup](/id/channels/groups)
- [Grup siaran](/id/channels/broadcast-groups)
- [Penyandingan](/id/channels/pairing)
