---
read_when:
    - Mengubah perilaku obrolan grup atau gating mention
summary: Perilaku obrolan grup di berbagai platform (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-04-24T08:57:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw memperlakukan obrolan grup secara konsisten di berbagai platform: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar pemula (2 menit)

OpenClaw “hidup” di akun pesan milik Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah.
Jika **Anda** berada di dalam grup, OpenClaw dapat melihat grup tersebut dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan mention kecuali Anda secara eksplisit menonaktifkan gating mention.

Artinya: pengirim yang ada di allowlist dapat memicu OpenClaw dengan menyebutnya.

> TL;DR
>
> - **Akses DM** dikendalikan oleh `*.allowFrom`.
> - **Akses grup** dikendalikan oleh `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
> - **Pemicu balasan** dikendalikan oleh gating mention (`requireMention`, `/activation`).

Alur cepat (apa yang terjadi pada pesan grup):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> grup diizinkan? tidak -> drop
requireMention? ya -> disebut? tidak -> simpan hanya untuk konteks
jika tidak -> balas
```

## Visibilitas konteks dan allowlist

Ada dua kontrol berbeda yang terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist khusus kanal).
- **Visibilitas konteks**: konteks tambahan apa yang disisipkan ke model (teks balasan, kutipan, riwayat thread, metadata terusan).

Secara default, OpenClaw memprioritaskan perilaku obrolan normal dan menjaga konteks sebagian besar tetap seperti yang diterima. Ini berarti allowlist terutama menentukan siapa yang dapat memicu tindakan, bukan batas redaksi universal untuk setiap kutipan atau cuplikan riwayat.

Perilaku saat ini bersifat khusus per kanal:

- Beberapa kanal sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan pada jalur tertentu (misalnya penyemaian thread Slack, pencarian balasan/thread Matrix).
- Kanal lain masih meneruskan konteks kutipan/balasan/terusan sebagaimana diterima.

Arah hardening (direncanakan):

- `contextVisibility: "all"` (default) mempertahankan perilaku saat ini sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang ada di allowlist.
- `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan eksplisit.

Sampai model hardening ini diterapkan secara konsisten di semua kanal, perkirakan akan ada perbedaan antar platform.

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                       | Yang perlu diatur                                          |
| -------------------------------------------- | ---------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas pada @mention | `groups: { "*": { requireMention: true } }`         |
| Nonaktifkan semua balasan grup               | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                          | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"`)    |
| Hanya Anda yang dapat memicu di grup         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (room/kanal menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke ID grup sehingga setiap topik memiliki sesinya sendiri.
- Obrolan langsung menggunakan sesi utama (atau per-pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (agen tunggal)

Ya — ini bekerja dengan baik jika lalu lintas “pribadi” Anda adalah **DM** dan lalu lintas “publik” Anda adalah **grup**.

Mengapa: dalam mode agen tunggal, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sedangkan grup selalu menggunakan kunci sesi **non-main** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap berjalan di host. Docker adalah backend default jika Anda tidak memilihnya.

Ini memberi Anda satu “otak” agen (workspace + memori bersama), tetapi dua postur eksekusi:

- **DM**: alat penuh (host)
- **Grup**: sandbox + alat terbatas

> Jika Anda membutuhkan workspace/persona yang benar-benar terpisah (“pribadi” dan “publik” tidak boleh pernah tercampur), gunakan agen kedua + bindings. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent).

Contoh (DM di host, grup di-sandbox + alat pesan saja):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // grup/kanal adalah non-main -> di-sandbox
        scope: "session", // isolasi terkuat (satu container per grup/kanal)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Jika allow tidak kosong, semua yang lain diblokir (deny tetap menang).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Ingin “grup hanya bisa melihat folder X” alih-alih “tidak ada akses host”? Pertahankan `workspaceAccess: "none"` dan mount hanya path yang ada di allowlist ke dalam sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Terkait:

- Kunci konfigurasi dan default: [Konfigurasi Gateway](/id/gateway/config-agents#agentsdefaultssandbox)
- Men-debug mengapa alat diblokir: [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail bind mount: [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts)

## Label tampilan

- Label UI menggunakan `displayName` jika tersedia, diformat sebagai `<channel>:<token>`.
- `#room` dicadangkan untuk room/kanal; obrolan grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`).

## Kebijakan grup

Kendalikan bagaimana pesan grup/room ditangani per kanal:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // ID pengguna Telegram numerik (wizard dapat menyelesaikan @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Kebijakan    | Perilaku                                                     |
| ------------ | ------------------------------------------------------------ |
| `"open"`     | Grup melewati allowlist; gating mention tetap berlaku.       |
| `"disabled"` | Blokir semua pesan grup sepenuhnya.                          |
| `"allowlist"` | Hanya izinkan grup/room yang cocok dengan allowlist yang dikonfigurasi. |

Catatan:

- `groupPolicy` terpisah dari gating mention (yang memerlukan @mention).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
- Persetujuan pairing DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap harus eksplisit melalui allowlist grup.
- Discord: allowlist menggunakan `channels.discord.guilds.<id>.channels`.
- Slack: allowlist menggunakan `channels.slack.channels`.
- Matrix: allowlist menggunakan `channels.matrix.groups`. Utamakan ID room atau alias; pencarian nama room yang diikuti bersifat best-effort, dan nama yang tidak dapat diselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; allowlist `users` per-room juga didukung.
- DM grup dikendalikan secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Allowlist Telegram dapat mencocokkan ID pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau username (`"@alice"` atau `"alice"`); prefix tidak peka huruf besar/kecil.
- Default adalah `groupPolicy: "allowlist"`; jika allowlist grup Anda kosong, pesan grup diblokir.
- Keamanan runtime: ketika blok provider sama sekali tidak ada (`channels.<provider>` tidak ada), kebijakan grup fallback ke mode fail-closed (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

Model mental cepat (urutan evaluasi untuk pesan grup):

1. `groupPolicy` (open/disabled/allowlist)
2. allowlist grup (`*.groups`, `*.groupAllowFrom`, allowlist khusus kanal)
3. gating mention (`requireMention`, `/activation`)

## Gating mention (default)

Pesan grup memerlukan mention kecuali dioverride per grup. Default berada per subsistem di bawah `*.groups."*"`.

Membalas pesan bot dihitung sebagai mention implisit ketika kanal
mendukung metadata balasan. Mengutip pesan bot juga dapat dihitung sebagai mention
implisit pada kanal yang mengekspos metadata kutipan. Kasus bawaan saat ini mencakup
Telegram, WhatsApp, Slack, Discord, Microsoft Teams, dan ZaloUser.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Catatan:

- `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar/kecil; pola yang tidak valid dan bentuk pengulangan bersarang yang tidak aman akan diabaikan.
- Platform yang menyediakan mention eksplisit tetap lolos; pola adalah fallback.
- Override per agen: `agents.list[].groupChat.mentionPatterns` (berguna saat beberapa agen berbagi satu grup).
- Gating mention hanya ditegakkan ketika deteksi mention dimungkinkan (mention native atau `mentionPatterns` dikonfigurasi).
- Default Discord berada di `channels.discord.guilds."*"` (dapat dioverride per guild/kanal).
- Konteks riwayat grup dibungkus secara seragam di semua kanal dan **hanya pending** (pesan yang dilewati karena gating mention); gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk override. Atur `0` untuk menonaktifkan.

## Pembatasan alat grup/kanal (opsional)

Beberapa konfigurasi kanal mendukung pembatasan alat yang tersedia **di dalam grup/room/kanal tertentu**.

- `tools`: izinkan/tolak alat untuk seluruh grup.
- `toolsBySender`: override per pengirim di dalam grup.
  Gunakan prefix kunci eksplisit:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`.
  Kunci lama tanpa prefix masih diterima dan dicocokkan hanya sebagai `id:`.

Urutan resolusi (yang paling spesifik menang):

1. kecocokan `toolsBySender` grup/kanal
2. `tools` grup/kanal
3. kecocokan `toolsBySender` default (`"*"` )
4. `tools` default (`"*"`)

Contoh (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Catatan:

- Pembatasan alat grup/kanal diterapkan sebagai tambahan terhadap kebijakan alat global/agen (deny tetap menang).
- Beberapa kanal menggunakan nesting berbeda untuk room/kanal (misalnya Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Allowlist grup

Saat `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kunci-kuncinya bertindak sebagai allowlist grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku mention default.

Kebingungan umum: persetujuan pairing DM tidak sama dengan otorisasi grup.
Untuk kanal yang mendukung pairing DM, penyimpanan pairing hanya membuka DM. Perintah grup tetap memerlukan otorisasi pengirim grup yang eksplisit dari allowlist konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi terdokumentasi untuk kanal tersebut.

Maksud umum (salin/tempel):

1. Nonaktifkan semua balasan grup

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Izinkan hanya grup tertentu (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Izinkan semua grup tetapi wajib mention (eksplisit)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Hanya pemilik yang dapat memicu di grup (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Activation (khusus pemilik)

Pemilik grup dapat mengubah activation per grup:

- `/activation mention`
- `/activation always`

Pemilik ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 milik bot sendiri jika tidak diatur). Kirim perintah sebagai pesan mandiri. Platform lain saat ini mengabaikan `/activation`.

## Bidang konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil gating mention)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Catatan khusus kanal:

- BlueBubbles secara opsional dapat memperkaya peserta grup macOS yang tidak bernama dari database Kontak lokal sebelum mengisi `GroupMembers`. Ini nonaktif secara default dan hanya berjalan setelah gating grup normal lolos.

System prompt agen menyertakan pengantar grup pada giliran pertama sesi grup baru. Ini mengingatkan model untuk merespons seperti manusia, menghindari tabel Markdown, meminimalkan baris kosong dan mengikuti spasi obrolan normal, serta menghindari mengetik urutan literal `\n`. Nama grup dan label peserta yang berasal dari kanal dirender sebagai metadata tidak tepercaya berpagar, bukan instruksi sistem inline.

## Hal khusus iMessage

- Utamakan `chat_id:<id>` saat merutekan atau membuat allowlist.
- Daftar obrolan: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## System prompt WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan system prompt WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, dan semantik override akun.

## Hal khusus WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan mention).

## Terkait

- [Pesan grup](/id/channels/group-messages)
- [Grup siaran](/id/channels/broadcast-groups)
- [Perutean kanal](/id/channels/channel-routing)
- [Pairing](/id/channels/pairing)
