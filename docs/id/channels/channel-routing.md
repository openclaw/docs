---
read_when:
    - Mengubah perutean kanal atau perilaku kotak masuk
summary: Aturan perutean per kanal (WhatsApp, Telegram, Discord, Slack) dan konteks bersama
title: Perutean kanal
x-i18n:
    generated_at: "2026-04-24T08:57:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb87a774bb094af15524702c2c4fd17cf0b41fe27ac0943d1008523a43d5553b
    source_path: channels/channel-routing.md
    workflow: 15
---

# Kanal & perutean

OpenClaw merutekan balasan **kembali ke kanal asal pesan**. Model
tidak memilih kanal; perutean bersifat deterministik dan dikendalikan oleh
konfigurasi host.

## Istilah kunci

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, ditambah kanal Plugin. `webchat` adalah kanal UI WebChat internal dan bukan kanal outbound yang dapat dikonfigurasi.
- **AccountId**: instance akun per kanal (jika didukung).
- Akun default kanal opsional: `channels.<channel>.defaultAccount` memilih
  akun mana yang digunakan saat jalur outbound tidak menentukan `accountId`.
  - Dalam penyiapan multi-akun, tetapkan default eksplisit (`defaultAccount` atau `accounts.default`) saat dua atau lebih akun dikonfigurasi. Tanpanya, fallback routing dapat memilih ID akun ternormalisasi pertama.
- **AgentId**: workspace + penyimpanan sesi terisolasi (“otak”).
- **SessionKey**: kunci bucket yang digunakan untuk menyimpan konteks dan mengendalikan konkurensi.

## Bentuk kunci sesi (contoh)

Pesan langsung diciutkan ke sesi **utama** agen secara default:

- `agent:<agentId>:<mainKey>` (default: `agent:main:main`)

Bahkan saat riwayat percakapan pesan langsung dibagikan dengan sesi utama, sandbox dan
kebijakan alat menggunakan kunci runtime obrolan langsung per-akun turunan untuk DM eksternal
agar pesan yang berasal dari kanal tidak diperlakukan seperti eksekusi sesi utama lokal.

Grup dan kanal tetap terisolasi per kanal:

- Grup: `agent:<agentId>:<channel>:group:<id>`
- Kanal/room: `agent:<agentId>:<channel>:channel:<id>`

Thread:

- Thread Slack/Discord menambahkan `:thread:<threadId>` ke kunci dasar.
- Topik forum Telegram menyematkan `:topic:<topicId>` di kunci grup.

Contoh:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Penyematan rute DM utama

Saat `session.dmScope` adalah `main`, pesan langsung dapat berbagi satu sesi utama.
Untuk mencegah `lastRoute` sesi ditimpa oleh DM non-pemilik,
OpenClaw menyimpulkan pemilik yang disematkan dari `allowFrom` ketika semua kondisi berikut terpenuhi:

- `allowFrom` memiliki tepat satu entri non-wildcard.
- Entri tersebut dapat dinormalisasi menjadi ID pengirim konkret untuk kanal tersebut.
- Pengirim DM masuk tidak cocok dengan pemilik yang disematkan itu.

Dalam kasus ketidakcocokan tersebut, OpenClaw tetap mencatat metadata sesi masuk, tetapi
melewati pembaruan `lastRoute` sesi utama.

## Aturan perutean (bagaimana agen dipilih)

Perutean memilih **satu agen** untuk setiap pesan masuk:

1. **Kecocokan peer persis** (`bindings` dengan `peer.kind` + `peer.id`).
2. **Kecocokan peer induk** (pewarisan thread).
3. **Kecocokan guild + peran** (Discord) melalui `guildId` + `roles`.
4. **Kecocokan guild** (Discord) melalui `guildId`.
5. **Kecocokan team** (Slack) melalui `teamId`.
6. **Kecocokan akun** (`accountId` pada kanal).
7. **Kecocokan kanal** (akun mana pun pada kanal tersebut, `accountId: "*"`).
8. **Agen default** (`agents.list[].default`, jika tidak maka entri daftar pertama, fallback ke `main`).

Saat sebuah binding menyertakan beberapa field kecocokan (`peer`, `guildId`, `teamId`, `roles`), **semua field yang diberikan harus cocok** agar binding tersebut berlaku.

Agen yang cocok menentukan workspace dan penyimpanan sesi mana yang digunakan.

## Grup siaran (menjalankan beberapa agen)

Grup siaran memungkinkan Anda menjalankan **beberapa agen** untuk peer yang sama **saat OpenClaw biasanya akan membalas** (misalnya: di grup WhatsApp, setelah mention/activation gating).

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

Lihat: [Grup siaran](/id/channels/broadcast-groups).

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
- Transkrip JSONL berada di samping penyimpanan

Anda dapat mengganti path penyimpanan melalui `session.store` dan templating `{agentId}`.

Penemuan sesi Gateway dan ACP juga memindai penyimpanan agen berbasis disk di bawah
root `agents/` default dan di bawah root `session.store` bertemplate. Penyimpanan yang ditemukan
harus tetap berada di dalam root agen hasil resolusi tersebut dan menggunakan file
`sessions.json` biasa. Symlink dan path di luar root diabaikan.

## Perilaku WebChat

WebChat terpasang ke **agen yang dipilih** dan default ke sesi utama
agen. Karena itu, WebChat memungkinkan Anda melihat konteks lintas kanal untuk
agen tersebut di satu tempat.

## Konteks balasan

Balasan masuk menyertakan:

- `ReplyToId`, `ReplyToBody`, dan `ReplyToSender` jika tersedia.
- Konteks kutipan ditambahkan ke `Body` sebagai blok `[Replying to ...]`.

Ini konsisten di seluruh kanal.

## Terkait

- [Grup](/id/channels/groups)
- [Grup siaran](/id/channels/broadcast-groups)
- [Pairing](/id/channels/pairing)
