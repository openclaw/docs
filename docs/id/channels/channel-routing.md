---
read_when:
    - Mengubah perutean saluran atau perilaku kotak masuk
summary: Aturan perutean per saluran (WhatsApp, Telegram, Discord, Slack) dan konteks bersama
title: Perutean saluran
x-i18n:
    generated_at: "2026-07-16T17:48:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4836671840e8c7919e7def8140d4a54fdeea17ddbe8c7a348ab5a23ff8b4213c
    source_path: channels/channel-routing.md
    workflow: 16
---

# Saluran & perutean

OpenClaw merutekan balasan **kembali ke saluran asal pesan**. Model
tidak memilih saluran; perutean bersifat deterministik dan dikendalikan oleh
konfigurasi host.

## Istilah utama

- **Saluran**: plugin saluran bawaan seperti `discord`, `googlechat`, `imessage`, `irc`, `line`, `signal`, `slack`, `telegram`, atau `whatsapp`, serta saluran plugin yang telah diinstal. `webchat` adalah saluran UI WebChat internal dan bukan saluran keluar yang dapat dikonfigurasi.
- **AccountId**: instans akun per saluran (jika didukung).
- Akun default saluran opsional: `channels.<channel>.defaultAccount` memilih
  akun yang digunakan ketika jalur keluar tidak menentukan `accountId`.
  - Dalam penyiapan multiakun, tetapkan default secara eksplisit (`defaultAccount` atau akun bernama `default`) ketika dua akun atau lebih dikonfigurasi. Tanpanya, perutean fallback dapat memilih ID akun pertama yang telah dinormalisasi.
- **AgentId**: ruang kerja + penyimpanan sesi yang terisolasi ("otak").
- **SessionKey**: kunci bucket yang digunakan untuk menyimpan konteks dan mengendalikan konkurensi.

## Prefiks target keluar

Target keluar eksplisit dapat menyertakan prefiks penyedia, seperti `telegram:123` atau `tg:123`. Inti memperlakukan prefiks tersebut sebagai petunjuk pemilihan saluran hanya ketika saluran yang dipilih adalah `last` atau belum terselesaikan, dan hanya ketika plugin yang dimuat mengiklankan prefiks tersebut. Jika pemanggil telah memilih saluran secara eksplisit, prefiks penyedia harus cocok dengan saluran tersebut; kombinasi lintas saluran seperti pengiriman WhatsApp ke `telegram:123` akan gagal sebelum normalisasi target khusus plugin.

Prefiks jenis target dan layanan seperti `channel:<id>`, `user:<id>`, `room:<id>`, `thread:<id>`, `imessage:<handle>`, dan `sms:<number>` tetap berada dalam tata bahasa saluran yang dipilih. Prefiks tersebut tidak memilih penyedia dengan sendirinya.

## Bentuk kunci sesi (contoh)

Pesan langsung secara default digabungkan ke sesi **utama** agen:

- `agent:<agentId>:<mainKey>` (default: `agent:main:main`)

`session.dmScope` mengendalikan penggabungan DM: `main` (default) menggunakan bersama satu sesi
utama, sedangkan `per-peer`, `per-channel-peer`, dan `per-account-channel-peer`
mempertahankan DM dalam sesi terpisah. Pengikatan rute dapat mengganti cakupan untuk
peer yang cocok melalui `bindings[].session.dmScope`.

Meskipun riwayat percakapan pesan langsung digunakan bersama dengan sesi utama, kebijakan
sandbox dan alat menggunakan kunci runtime percakapan langsung per akun yang diturunkan untuk DM eksternal
agar pesan yang berasal dari saluran tidak diperlakukan seperti eksekusi sesi utama lokal.

Grup dan saluran tetap terisolasi per saluran:

- Grup: `agent:<agentId>:<channel>:group:<id>`
- Saluran/ruang: `agent:<agentId>:<channel>:channel:<id>`

Utas:

- Utas Slack/Discord menambahkan `:thread:<threadId>` ke kunci dasar.
- Topik forum Telegram menyematkan `:topic:<topicId>` dalam kunci grup.

Contoh:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## Penyematan rute DM utama

Ketika `session.dmScope` adalah `main`, pesan langsung dapat menggunakan bersama satu sesi utama.
Untuk mencegah `lastRoute` sesi ditimpa oleh DM yang bukan dari pemilik,
OpenClaw menyimpulkan pemilik yang disematkan dari `allowFrom` ketika semua kondisi berikut terpenuhi:

- `allowFrom` memiliki tepat satu entri non-wildcard.
- Entri tersebut dapat dinormalisasi menjadi ID pengirim konkret untuk saluran tersebut.
- Pengirim DM masuk tidak cocok dengan pemilik yang disematkan tersebut.

Dalam kasus ketidakcocokan tersebut, OpenClaw tetap mencatat metadata sesi masuk, tetapi
melewati pembaruan `lastRoute` sesi utama.

## Pencatatan masuk yang dijaga

Plugin saluran dapat menandai catatan sesi masuk sebagai `createIfMissing: false`
ketika jalur yang dijaga tidak boleh membuat sesi OpenClaw baru. Dalam mode tersebut,
OpenClaw dapat memperbarui metadata dan `lastRoute` untuk sesi yang sudah ada, tetapi
tidak membuat entri sesi khusus rute hanya karena sebuah pesan diamati.

## Aturan perutean (cara memilih agen)

Perutean memilih **satu agen** untuk setiap pesan masuk:

1. **Kecocokan peer persis** (`bindings` dengan `peer.kind` + `peer.id`).
2. **Kecocokan peer induk** (pewarisan utas).
3. **Kecocokan wildcard peer** (`peer.id: "*"` untuk suatu jenis peer).
4. **Kecocokan guild + peran** (Discord) melalui `guildId` + `roles`.
5. **Kecocokan guild** (Discord) melalui `guildId`.
6. **Kecocokan tim** (Slack) melalui `teamId`.
7. **Kecocokan akun** (`accountId` pada saluran).
8. **Kecocokan saluran** (akun apa pun pada saluran tersebut, `accountId: "*"`).
9. **Agen default** (`agents.list[].default`, jika tidak ada gunakan entri daftar pertama, dengan fallback ke `main`).

Ketika suatu pengikatan menyertakan beberapa bidang pencocokan (`peer`, `guildId`, `teamId`, `roles`), **semua bidang yang diberikan harus cocok** agar pengikatan tersebut diterapkan.

Agen yang cocok menentukan ruang kerja dan penyimpanan sesi yang digunakan.

## Grup siaran (menjalankan beberapa agen)

Grup siaran memungkinkan Anda menjalankan **beberapa agen** untuk peer yang sama **ketika OpenClaw biasanya akan membalas** (misalnya: dalam grup WhatsApp, setelah gerbang penyebutan/aktivasi).

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

- `agents.list`: definisi agen bernama (ruang kerja, model, dll.).
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

Baris sesi runtime berada dalam basis data SQLite setiap agen di bawah direktori
status (default `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Instalasi lama mungkin memiliki file JSONL transkrip legasi dan penyimpanan baris
`sessions.json` di bawah `~/.openclaw/agents/<agentId>/sessions/`. Saat Gateway dimulai dan
`openclaw doctor --fix` mengimpor baris/riwayat legasi aktif ke SQLite
secara otomatis. Gunakan `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` dan urutan validasi
[Doctor](/id/cli/doctor#session-sqlite-migration) ketika Anda memerlukan
bukti migrasi eksplisit.
Anda masih dapat memilih jalur penyimpanan legasi melalui templating `session.store` dan `{agentId}`
untuk alur kerja migrasi dan pemeliharaan luring.

Penemuan sesi Gateway dan ACP juga memindai penyimpanan agen berbasis disk di bawah
root default `agents/` dan di bawah root `session.store` bertemplat. Penyimpanan yang ditemukan
harus tetap berada di dalam root agen yang telah diselesaikan tersebut dan menggunakan file legasi
`sessions.json` biasa. Symlink dan jalur di luar root diabaikan.

## Perilaku WebChat

WebChat terhubung ke **agen yang dipilih** dan secara default menggunakan sesi utama
agen. Karena itu, WebChat memungkinkan Anda melihat konteks lintas saluran untuk
agen tersebut di satu tempat.

## Konteks balasan

Balasan masuk menyertakan:

- `ReplyToId`, `ReplyToBody`, dan `ReplyToSender` jika tersedia.
- Konteks yang dikutip ditambahkan ke `Body` sebagai blok `[Replying to ...]`.

Perilaku ini konsisten di semua saluran.

## Terkait

- [Grup](/id/channels/groups)
- [Grup siaran](/id/channels/broadcast-groups)
- [Pemasangan](/id/channels/pairing)
