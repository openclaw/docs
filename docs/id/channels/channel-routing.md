---
read_when:
    - Mengubah perutean saluran atau perilaku kotak masuk
summary: Aturan perutean per kanal (WhatsApp, Telegram, Discord, Slack) dan konteks bersama
title: Perutean saluran
x-i18n:
    generated_at: "2026-05-06T09:02:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92b14cf02b00312121bec2f0f8ec784f36364babd6085d684e71f425dd82715e
    source_path: channels/channel-routing.md
    workflow: 16
---

# Saluran & perutean

OpenClaw merutekan balasan **kembali ke saluran asal sebuah pesan**. Model
tidak memilih saluran; perutean bersifat deterministik dan dikendalikan oleh
konfigurasi host.

## Istilah kunci

- **Saluran**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, plus saluran Plugin. `webchat` adalah saluran UI WebChat internal dan bukan saluran keluar yang dapat dikonfigurasi.
- **AccountId**: instance akun per saluran (jika didukung).
- Akun default saluran opsional: `channels.<channel>.defaultAccount` memilih
  akun mana yang digunakan saat jalur keluar tidak menentukan `accountId`.
  - Dalam penyiapan multi-akun, tetapkan default eksplisit (`defaultAccount` atau `accounts.default`) saat dua akun atau lebih dikonfigurasi. Tanpanya, perutean fallback dapat memilih ID akun ternormalisasi pertama.
- **AgentId**: workspace terisolasi + penyimpanan sesi ("otak").
- **SessionKey**: kunci bucket yang digunakan untuk menyimpan konteks dan mengontrol konkurensi.

## Prefiks target keluar

Target keluar eksplisit dapat menyertakan prefiks penyedia, seperti `telegram:123` atau `tg:123`. Core memperlakukan prefiks tersebut sebagai petunjuk pemilihan saluran hanya ketika saluran yang dipilih adalah `last` atau belum terselesaikan, dan hanya ketika Plugin yang dimuat mengiklankan prefiks tersebut. Jika pemanggil sudah memilih saluran eksplisit, prefiks penyedia harus cocok dengan saluran tersebut; kombinasi lintas saluran seperti pengiriman WhatsApp ke `telegram:123` gagal sebelum normalisasi target khusus Plugin.

Prefiks jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap berada di dalam tata bahasa saluran yang dipilih. Prefiks tersebut tidak memilih penyedia dengan sendirinya.

## Bentuk kunci sesi (contoh)

Pesan langsung diciutkan ke sesi **utama** agen secara default:

- `agent:<agentId>:<mainKey>` (default: `agent:main:main`)

Bahkan ketika riwayat percakapan pesan langsung dibagikan dengan utama, kebijakan sandbox dan
tool menggunakan kunci runtime obrolan langsung per akun turunan untuk DM eksternal
agar pesan yang berasal dari saluran tidak diperlakukan seperti run sesi utama lokal.

Grup dan saluran tetap terisolasi per saluran:

- Grup: `agent:<agentId>:<channel>:group:<id>`
- Saluran/ruangan: `agent:<agentId>:<channel>:channel:<id>`

Thread:

- Thread Slack/Discord menambahkan `:thread:<threadId>` ke kunci dasar.
- Topik forum Telegram menyematkan `:topic:<topicId>` dalam kunci grup.

Contoh:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Penyematan rute DM utama

Ketika `session.dmScope` adalah `main`, pesan langsung dapat berbagi satu sesi utama.
Untuk mencegah `lastRoute` sesi ditimpa oleh DM non-pemilik,
OpenClaw menyimpulkan pemilik tersemat dari `allowFrom` ketika semua ini benar:

- `allowFrom` memiliki tepat satu entri non-wildcard.
- Entri tersebut dapat dinormalisasi menjadi ID pengirim konkret untuk saluran tersebut.
- Pengirim DM masuk tidak cocok dengan pemilik tersemat tersebut.

Dalam kasus ketidakcocokan tersebut, OpenClaw tetap mencatat metadata sesi masuk, tetapi
melewati pembaruan `lastRoute` sesi utama.

## Pencatatan masuk terlindungi

Plugin saluran dapat menandai catatan sesi masuk sebagai `createIfMissing: false`
ketika jalur terlindungi tidak boleh membuat sesi OpenClaw baru. Dalam mode tersebut,
OpenClaw dapat memperbarui metadata dan `lastRoute` untuk sesi yang ada, tetapi
tidak membuat entri sesi hanya-rute hanya karena sebuah pesan diamati.

## Aturan perutean (cara agen dipilih)

Perutean memilih **satu agen** untuk setiap pesan masuk:

1. **Kecocokan peer persis** (`bindings` dengan `peer.kind` + `peer.id`).
2. **Kecocokan peer induk** (pewarisan thread).
3. **Kecocokan guild + peran** (Discord) melalui `guildId` + `roles`.
4. **Kecocokan guild** (Discord) melalui `guildId`.
5. **Kecocokan tim** (Slack) melalui `teamId`.
6. **Kecocokan akun** (`accountId` pada saluran).
7. **Kecocokan saluran** (akun apa pun pada saluran tersebut, `accountId: "*"`).
8. **Agen default** (`agents.list[].default`, jika tidak ada entri daftar pertama, fallback ke `main`).

Ketika binding menyertakan beberapa bidang pencocokan (`peer`, `guildId`, `teamId`, `roles`), **semua bidang yang disediakan harus cocok** agar binding tersebut diterapkan.

Agen yang cocok menentukan workspace dan penyimpanan sesi mana yang digunakan.

## Grup broadcast (menjalankan beberapa agen)

Grup broadcast memungkinkan Anda menjalankan **beberapa agen** untuk peer yang sama **ketika OpenClaw biasanya akan membalas** (misalnya: di grup WhatsApp, setelah gating penyebutan/aktivasi).

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

Lihat: [Grup Broadcast](/id/channels/broadcast-groups).

## Ringkasan konfigurasi

- `agents.list`: definisi agen bernama (workspace, model, dll.).
- `bindings`: memetakan saluran/akun/peer masuk ke agen.

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

Anda dapat mengganti jalur penyimpanan melalui `session.store` dan templating `{agentId}`.

Penemuan sesi Gateway dan ACP juga memindai penyimpanan agen berbasis disk di bawah root
default `agents/` dan di bawah root `session.store` hasil template. Penyimpanan yang ditemukan
harus tetap berada di dalam root agen yang diselesaikan tersebut dan menggunakan file
`sessions.json` reguler. Symlink dan jalur di luar root diabaikan.

## Perilaku WebChat

WebChat terhubung ke **agen yang dipilih** dan secara default menggunakan sesi utama agen tersebut.
Karena itu, WebChat memungkinkan Anda melihat konteks lintas saluran untuk agen tersebut
di satu tempat.

## Konteks balasan

Balasan masuk menyertakan:

- `ReplyToId`, `ReplyToBody`, dan `ReplyToSender` jika tersedia.
- Konteks yang dikutip ditambahkan ke `Body` sebagai blok `[Replying to ...]`.

Ini konsisten di semua saluran.

## Terkait

- [Grup](/id/channels/groups)
- [Grup broadcast](/id/channels/broadcast-groups)
- [Pairing](/id/channels/pairing)
