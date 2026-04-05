---
read_when:
    - Mengubah perilaku obrolan grup atau gating mention
summary: Perilaku obrolan grup di berbagai surface (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-04-05T13:43:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39d066e0542b468c6f8b384b463e2316590ea09a00ecb2065053e1e2ce55bd5f
    source_path: channels/groups.md
    workflow: 15
---

# Grup

OpenClaw memperlakukan obrolan grup secara konsisten di berbagai surface: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar untuk pemula (2 menit)

OpenClaw “hidup” di akun pesan Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah.
Jika **Anda** berada di dalam grup, OpenClaw dapat melihat grup tersebut dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan mention kecuali Anda secara eksplisit menonaktifkan gating mention.

Artinya: pengirim yang ada dalam allowlist dapat memicu OpenClaw dengan menyebutnya.

> TL;DR
>
> - **Akses DM** dikendalikan oleh `*.allowFrom`.
> - **Akses grup** dikendalikan oleh `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
> - **Pemicu balasan** dikendalikan oleh gating mention (`requireMention`, `/activation`).

Alur singkat (apa yang terjadi pada pesan grup):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Visibilitas konteks dan allowlist

Dua kontrol yang berbeda terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist khusus channel).
- **Visibilitas konteks**: konteks tambahan apa yang disuntikkan ke model (teks balasan, kutipan, riwayat thread, metadata forward).

Secara default, OpenClaw memprioritaskan perilaku chat normal dan menjaga konteks sebagian besar tetap seperti diterima. Artinya, allowlist terutama menentukan siapa yang dapat memicu tindakan, bukan batas redaksi universal untuk setiap kutipan atau potongan riwayat.

Perilaku saat ini bersifat spesifik per channel:

- Beberapa channel sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan pada jalur tertentu (misalnya seeding thread Slack, lookup balasan/thread Matrix).
- Channel lain masih meneruskan konteks kutipan/balasan/forward sebagaimana diterima.

Arah hardening (direncanakan):

- `contextVisibility: "all"` (default) mempertahankan perilaku saat ini sebagaimana diterima.
- `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang ada dalam allowlist.
- `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan yang eksplisit.

Sampai model hardening ini diimplementasikan secara konsisten di seluruh channel, perkirakan akan ada perbedaan antar surface.

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                      | Yang harus disetel                                          |
| ------------------------------------------- | ----------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas pada @mention | `groups: { "*": { requireMention: true } }`         |
| Nonaktifkan semua balasan grup              | `groupPolicy: "disabled"`                                   |
| Hanya grup tertentu                         | `groups: { "<group-id>": { ... } }` (tanpa key `"*"` )      |
| Hanya Anda yang dapat memicu di grup        | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`  |

## Session key

- Sesi grup menggunakan session key `agent:<agentId>:<channel>:group:<id>` (room/channel menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesinya sendiri.
- Obrolan langsung menggunakan sesi utama (atau per pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (agen tunggal)

Ya — ini bekerja dengan baik jika trafik “pribadi” Anda adalah **DM** dan trafik “publik” Anda adalah **grup**.

Alasannya: dalam mode agen tunggal, DM biasanya masuk ke session key **utama** (`agent:main:main`), sementara grup selalu menggunakan session key **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di Docker sementara sesi DM utama Anda tetap berjalan di host.

Ini memberi Anda satu “otak” agen (workspace + memori bersama), tetapi dua postur eksekusi:

- **DM**: alat penuh (host)
- **Grup**: sandbox + alat terbatas (Docker)

> Jika Anda memerlukan workspace/persona yang benar-benar terpisah (“pribadi” dan “publik” sama sekali tidak boleh bercampur), gunakan agen kedua + binding. Lihat [Multi-Agent Routing](/concepts/multi-agent).

Contoh (DM di host, grup di-sandbox + alat khusus messaging):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

Ingin “grup hanya bisa melihat folder X” alih-alih “tidak ada akses host”? Pertahankan `workspaceAccess: "none"` dan mount hanya path yang ada dalam allowlist ke sandbox:

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

- Key konfigurasi dan default: [Konfigurasi Gateway](/gateway/configuration-reference#agentsdefaultssandbox)
- Men-debug mengapa suatu alat diblokir: [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail bind mount: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Label tampilan

- Label UI menggunakan `displayName` bila tersedia, diformat sebagai `<channel>:<token>`.
- `#room` dicadangkan untuk room/channel; obrolan grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`).

## Kebijakan grup

Kendalikan cara pesan grup/room ditangani per channel:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Kebijakan     | Perilaku                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grup melewati allowlist; gating mention tetap berlaku.       |
| `"disabled"`  | Blokir semua pesan grup sepenuhnya.                          |
| `"allowlist"` | Hanya izinkan grup/room yang cocok dengan allowlist yang dikonfigurasi. |

Catatan:

- `groupPolicy` terpisah dari gating mention (yang memerlukan @mention).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
- Persetujuan pairing DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit ke allowlist grup.
- Discord: allowlist menggunakan `channels.discord.guilds.<id>.channels`.
- Slack: allowlist menggunakan `channels.slack.channels`.
- Matrix: allowlist menggunakan `channels.matrix.groups`. Pilih room ID atau alias; lookup nama joined-room bersifat best-effort, dan nama yang tidak dapat diselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; allowlist `users` per room juga didukung.
- Group DM dikendalikan secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Allowlist Telegram dapat mencocokkan user ID (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau username (`"@alice"` atau `"alice"`); prefiks tidak peka huruf besar/kecil.
- Default adalah `groupPolicy: "allowlist"`; jika allowlist grup Anda kosong, pesan grup diblokir.
- Keamanan runtime: saat blok provider sama sekali tidak ada (`channels.<provider>` tidak ada), kebijakan grup fallback ke mode fail-closed (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

Model mental singkat (urutan evaluasi untuk pesan grup):

1. `groupPolicy` (open/disabled/allowlist)
2. allowlist grup (`*.groups`, `*.groupAllowFrom`, allowlist khusus channel)
3. gating mention (`requireMention`, `/activation`)

## Gating mention (default)

Pesan grup memerlukan mention kecuali ditimpa per grup. Default berada per subsistem di bawah `*.groups."*"`.

Membalas pesan bot dihitung sebagai mention implisit (saat channel mendukung metadata balasan). Ini berlaku untuk Telegram, WhatsApp, Slack, Discord, dan Microsoft Teams.

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

- `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar/kecil; pola yang tidak valid dan bentuk nested-repetition yang tidak aman akan diabaikan.
- Surface yang menyediakan mention eksplisit tetap lolos; pola hanyalah fallback.
- Override per agen: `agents.list[].groupChat.mentionPatterns` (berguna saat beberapa agen berbagi satu grup).
- Gating mention hanya diterapkan ketika deteksi mention memungkinkan (mention native atau `mentionPatterns` dikonfigurasi).
- Default Discord berada di `channels.discord.guilds."*"` (dapat ditimpa per guild/channel).
- Konteks riwayat grup dibungkus secara seragam di seluruh channel dan hanya **pending-only** (pesan yang dilewati karena gating mention); gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk override. Set `0` untuk menonaktifkan.

## Pembatasan alat grup/channel (opsional)

Beberapa config channel mendukung pembatasan alat mana yang tersedia **di dalam grup/room/channel tertentu**.

- `tools`: izinkan/tolak alat untuk seluruh grup.
- `toolsBySender`: override per pengirim di dalam grup.
  Gunakan prefiks key eksplisit:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`.
  Key lama tanpa prefiks masih diterima dan hanya dicocokkan sebagai `id:`.

Urutan resolusi (yang paling spesifik menang):

1. kecocokan `toolsBySender` grup/channel
2. `tools` grup/channel
3. kecocokan `toolsBySender` default (`"*"`)
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

- Pembatasan alat grup/channel diterapkan sebagai tambahan terhadap kebijakan alat global/agen (deny tetap menang).
- Beberapa channel menggunakan nesting yang berbeda untuk room/channel (misalnya Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Allowlist grup

Saat `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, key-nya bertindak sebagai allowlist grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap mengatur perilaku mention default.

Kebingungan umum: persetujuan pairing DM tidak sama dengan otorisasi grup.
Untuk channel yang mendukung pairing DM, penyimpanan pairing hanya membuka DM. Perintah grup tetap memerlukan otorisasi pengirim grup yang eksplisit dari allowlist config seperti `groupAllowFrom` atau fallback config terdokumentasi untuk channel tersebut.

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

## Aktivasi (khusus pemilik)

Pemilik grup dapat mengubah aktivasi per grup:

- `/activation mention`
- `/activation always`

Pemilik ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 milik bot sendiri jika tidak disetel). Kirim perintah sebagai pesan mandiri. Surface lain saat ini mengabaikan `/activation`.

## Field konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil gating mention)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Catatan khusus channel:

- BlueBubbles secara opsional dapat memperkaya peserta grup macOS tanpa nama dari database Kontak lokal sebelum mengisi `GroupMembers`. Ini nonaktif secara default dan hanya berjalan setelah gating grup normal lolos.

System prompt agen menyertakan pengantar grup pada giliran pertama dari sesi grup baru. Ini mengingatkan model agar merespons seperti manusia, menghindari tabel Markdown, dan menghindari mengetik urutan literal `\n`.

## Hal spesifik iMessage

- Pilih `chat_id:<id>` saat routing atau membuat allowlist.
- Daftar obrolan: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## Hal spesifik WhatsApp

Lihat [Pesan grup](/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan mention).
