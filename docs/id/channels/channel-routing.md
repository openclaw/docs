---
read_when:
    - Mengubah perutean saluran atau perilaku kotak masuk
summary: Aturan perutean untuk setiap saluran (WhatsApp, Telegram, Discord, Slack) dan konteks bersama
title: Perutean saluran
x-i18n:
    generated_at: "2026-05-02T09:12:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a752696e70d2c13d3ab1c9cedd41442e0d8aee6d78b3a069b53dd2b262174da
    source_path: channels/channel-routing.md
    workflow: 16
---

# Kanal & routing

OpenClaw merutekan balasan **kembali ke kanal tempat pesan berasal**. Model
tidak memilih kanal; routing bersifat deterministik dan dikendalikan oleh
konfigurasi host.

## Istilah kunci

- **Kanal**: `telegram`, `whatsapp`, `discord`, `irc`, `googlechat`, `slack`, `signal`, `imessage`, `line`, plus kanal Plugin. `webchat` adalah kanal UI WebChat internal dan bukan kanal outbound yang dapat dikonfigurasi.
- **AccountId**: instans akun per kanal (jika didukung).
- Akun default kanal opsional: `channels.<channel>.defaultAccount` memilih
  akun mana yang digunakan ketika jalur outbound tidak menentukan `accountId`.
  - Dalam setup multi-akun, tetapkan default eksplisit (`defaultAccount` atau `accounts.default`) ketika dua akun atau lebih dikonfigurasi. Tanpa itu, routing fallback dapat memilih ID akun ternormalisasi pertama.
- **AgentId**: workspace terisolasi + penyimpanan sesi (“otak”).
- **SessionKey**: kunci bucket yang digunakan untuk menyimpan konteks dan mengontrol konkurensi.

## Prefiks target outbound

Target outbound eksplisit dapat menyertakan prefiks penyedia, seperti `telegram:123` atau `tg:123`. Core memperlakukan prefiks tersebut sebagai petunjuk pemilihan kanal hanya ketika kanal yang dipilih adalah `last` atau belum terselesaikan, dan hanya ketika Plugin yang dimuat mengiklankan prefiks tersebut. Jika pemanggil sudah memilih kanal eksplisit, prefiks penyedia harus cocok dengan kanal tersebut; kombinasi lintas kanal seperti pengiriman WhatsApp ke `telegram:123` gagal sebelum normalisasi target khusus Plugin.

Prefiks jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap berada di dalam tata bahasa kanal yang dipilih. Prefiks tersebut tidak memilih penyedia dengan sendirinya.

## Bentuk kunci sesi (contoh)

Pesan langsung diciutkan ke sesi **main** agen secara default:

- `agent:<agentId>:<mainKey>` (default: `agent:main:main`)

Bahkan ketika riwayat percakapan pesan langsung dibagikan dengan main, kebijakan sandbox dan
alat menggunakan kunci runtime percakapan langsung per akun turunan untuk DM eksternal
agar pesan yang berasal dari kanal tidak diperlakukan seperti eksekusi sesi main lokal.

Grup dan kanal tetap terisolasi per kanal:

- Grup: `agent:<agentId>:<channel>:group:<id>`
- Kanal/ruang: `agent:<agentId>:<channel>:channel:<id>`

Thread:

- Thread Slack/Discord menambahkan `:thread:<threadId>` ke kunci dasar.
- Topik forum Telegram menyematkan `:topic:<topicId>` di kunci grup.

Contoh:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Penyematan rute DM main

Ketika `session.dmScope` adalah `main`, pesan langsung dapat berbagi satu sesi main.
Untuk mencegah `lastRoute` sesi ditimpa oleh DM bukan pemilik,
OpenClaw menyimpulkan pemilik yang disematkan dari `allowFrom` ketika semua kondisi ini benar:

- `allowFrom` memiliki tepat satu entri non-wildcard.
- Entri tersebut dapat dinormalisasi menjadi ID pengirim konkret untuk kanal tersebut.
- Pengirim DM inbound tidak cocok dengan pemilik yang disematkan tersebut.

Dalam kasus ketidakcocokan itu, OpenClaw tetap mencatat metadata sesi inbound, tetapi
melewati pembaruan `lastRoute` sesi main.

## Pencatatan inbound terlindungi

Plugin kanal dapat menandai catatan sesi inbound sebagai `createIfMissing: false`
ketika jalur terlindungi tidak boleh membuat sesi OpenClaw baru. Dalam mode itu,
OpenClaw dapat memperbarui metadata dan `lastRoute` untuk sesi yang sudah ada, tetapi
tidak membuat entri sesi khusus rute hanya karena sebuah pesan diamati.

## Aturan routing (cara agen dipilih)

Routing memilih **satu agen** untuk setiap pesan inbound:

1. **Kecocokan peer tepat** (`bindings` dengan `peer.kind` + `peer.id`).
2. **Kecocokan peer induk** (pewarisan thread).
3. **Kecocokan guild + peran** (Discord) melalui `guildId` + `roles`.
4. **Kecocokan guild** (Discord) melalui `guildId`.
5. **Kecocokan tim** (Slack) melalui `teamId`.
6. **Kecocokan akun** (`accountId` pada kanal).
7. **Kecocokan kanal** (akun apa pun pada kanal tersebut, `accountId: "*"`).
8. **Agen default** (`agents.list[].default`, jika tidak ada entri daftar pertama, fallback ke `main`).

Ketika sebuah binding menyertakan beberapa bidang kecocokan (`peer`, `guildId`, `teamId`, `roles`), **semua bidang yang diberikan harus cocok** agar binding tersebut berlaku.

Agen yang cocok menentukan workspace dan penyimpanan sesi mana yang digunakan.

## Grup siaran (menjalankan beberapa agen)

Grup siaran memungkinkan Anda menjalankan **beberapa agen** untuk peer yang sama **ketika OpenClaw biasanya akan membalas** (misalnya: di grup WhatsApp, setelah gating sebutan/aktivasi).

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

## Ringkasan konfigurasi

- `agents.list`: definisi agen bernama (workspace, model, dll.).
- `bindings`: memetakan kanal/akun/peer inbound ke agen.

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

Penyimpanan sesi berada di bawah direktori status (default `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrip JSONL berada berdampingan dengan penyimpanan

Anda dapat mengganti jalur penyimpanan melalui `session.store` dan templating `{agentId}`.

Penemuan sesi Gateway dan ACP juga memindai penyimpanan agen berbasis disk di bawah
root default `agents/` dan di bawah root `session.store` bertemplat. Penyimpanan yang ditemukan
harus tetap berada di dalam root agen terselesaikan tersebut dan menggunakan berkas
`sessions.json` reguler. Symlink dan jalur di luar root diabaikan.

## Perilaku WebChat

WebChat terhubung ke **agen yang dipilih** dan default ke sesi main agen tersebut.
Karena itu, WebChat memungkinkan Anda melihat konteks lintas kanal untuk agen tersebut
di satu tempat.

## Konteks balasan

Balasan inbound menyertakan:

- `ReplyToId`, `ReplyToBody`, dan `ReplyToSender` ketika tersedia.
- Konteks kutipan ditambahkan ke `Body` sebagai blok `[Replying to ...]`.

Ini konsisten di seluruh kanal.

## Terkait

- [Grup](/id/channels/groups)
- [Grup siaran](/id/channels/broadcast-groups)
- [Penyandingan](/id/channels/pairing)
