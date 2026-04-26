---
read_when:
    - Mengubah perilaku chat grup atau gating mention
sidebarTitle: Groups
summary: Perilaku chat grup di berbagai surface (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-04-26T11:23:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 837055b3cd044ebe3ef9aefe29e36f6471f48025d32169c43b9c5b04a8ac639c
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw menangani chat grup secara konsisten di berbagai surface: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar untuk pemula (2 menit)

OpenClaw "hidup" di akun pesan Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah. Jika **Anda** ada di dalam grup, OpenClaw dapat melihat grup itu dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan mention kecuali Anda secara eksplisit menonaktifkan gating mention.

Artinya: pengirim yang masuk allowlist dapat memicu OpenClaw dengan me-mention-nya.

<Note>
**Singkatnya**

- **Akses DM** dikendalikan oleh `*.allowFrom`.
- **Akses grup** dikendalikan oleh `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
- **Pemicu balasan** dikendalikan oleh gating mention (`requireMention`, `/activation`).
  </Note>

Alur cepat (apa yang terjadi pada pesan grup):

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

Secara default, OpenClaw memprioritaskan perilaku chat normal dan mempertahankan konteks sebagian besar sebagaimana diterima. Ini berarti allowlist terutama menentukan siapa yang dapat memicu tindakan, bukan batas redaksi universal untuk setiap kutipan atau cuplikan riwayat.

<AccordionGroup>
  <Accordion title="Perilaku saat ini bersifat khusus per channel">
    - Beberapa channel sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan di jalur tertentu (misalnya Slack thread seeding, lookup balasan/thread Matrix).
    - Channel lain masih meneruskan konteks kutipan/balasan/forward sebagaimana diterima.
  </Accordion>
  <Accordion title="Arah hardening (direncanakan)">
    - `contextVisibility: "all"` (default) mempertahankan perilaku saat ini sebagaimana diterima.
    - `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang masuk allowlist.
    - `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan eksplisit.

    Sampai model hardening ini diterapkan secara konsisten di semua channel, harapkan adanya perbedaan menurut surface.

  </Accordion>
</AccordionGroup>

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                       | Yang harus diatur                                         |
| -------------------------------------------- | --------------------------------------------------------- |
| Mengizinkan semua grup tetapi hanya membalas pada @mention | `groups: { "*": { requireMention: true } }`    |
| Menonaktifkan semua balasan grup             | `groupPolicy: "disabled"`                                 |
| Hanya grup tertentu                          | `groups: { "<group-id>": { ... } }` (tanpa key `"*"`)     |
| Hanya Anda yang bisa memicu di grup          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (room/channel menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesinya sendiri.
- Chat langsung menggunakan sesi utama (atau per-pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (agen tunggal)

Ya — ini bekerja dengan baik jika lalu lintas "pribadi" Anda adalah **DM** dan lalu lintas "publik" Anda adalah **grup**.

Alasannya: dalam mode agen tunggal, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sedangkan grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap berjalan di host. Docker adalah backend default jika Anda tidak memilihnya.

Ini memberi Anda satu "otak" agen (workspace + memori bersama), tetapi dua postur eksekusi:

- **DM**: tool penuh (host)
- **Grup**: sandbox + tool terbatas

<Note>
Jika Anda memerlukan workspace/persona yang benar-benar terpisah ("pribadi" dan "publik" sama sekali tidak boleh bercampur), gunakan agen kedua + bindings. Lihat [Multi-Agent Routing](/id/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM di host, grup di-sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // grup/channel adalah non-main -> di-sandbox
            scope: "session", // isolasi terkuat (satu container per grup/channel)
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
  </Tab>
  <Tab title="Grup hanya melihat folder yang masuk allowlist">
    Ingin "grup hanya dapat melihat folder X" alih-alih "tanpa akses host"? Pertahankan `workspaceAccess: "none"` dan mount hanya path yang masuk allowlist ke sandbox:

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

  </Tab>
</Tabs>

Terkait:

- Kunci konfigurasi dan default: [Konfigurasi Gateway](/id/gateway/config-agents#agentsdefaultssandbox)
- Men-debug mengapa sebuah tool diblokir: [Sandbox vs Tool Policy vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail bind mount: [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts)

## Label tampilan

- Label UI menggunakan `displayName` jika tersedia, diformat sebagai `<channel>:<token>`.
- `#room` dicadangkan untuk room/channel; chat grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`).

## Kebijakan grup

Kendalikan bagaimana pesan grup/room ditangani per channel:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // id pengguna Telegram numerik (wizard dapat me-resolve @username)
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

| Kebijakan      | Perilaku                                                     |
| -------------- | ------------------------------------------------------------ |
| `"open"`       | Grup melewati allowlist; gating mention tetap berlaku.       |
| `"disabled"`   | Blokir semua pesan grup sepenuhnya.                          |
| `"allowlist"`  | Hanya izinkan grup/room yang cocok dengan allowlist yang dikonfigurasi. |

<AccordionGroup>
  <Accordion title="Catatan per channel">
    - `groupPolicy` terpisah dari gating mention (yang memerlukan @mention).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
    - Persetujuan pairing DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit ke allowlist grup.
    - Discord: allowlist menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: allowlist menggunakan `channels.slack.channels`.
    - Matrix: allowlist menggunakan `channels.matrix.groups`. Pilih id room atau alias; lookup nama room yang di-join adalah best-effort, dan nama yang tidak dapat di-resolve diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; allowlist `users` per-room juga didukung.
    - Group DM dikendalikan secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Allowlist Telegram dapat mencocokkan id pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau username (`"@alice"` atau `"alice"`); prefix tidak peka huruf besar/kecil.
    - Default adalah `groupPolicy: "allowlist"`; jika allowlist grup Anda kosong, pesan grup diblokir.
    - Keamanan runtime: ketika blok provider sama sekali tidak ada (`channels.<provider>` tidak ada), kebijakan grup fallback ke mode fail-closed (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.
  </Accordion>
</AccordionGroup>

Model mental cepat (urutan evaluasi untuk pesan grup):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Allowlist grup">
    Allowlist grup (`*.groups`, `*.groupAllowFrom`, allowlist khusus channel).
  </Step>
  <Step title="Gating mention">
    Gating mention (`requireMention`, `/activation`).
  </Step>
</Steps>

## Gating mention (default)

Pesan grup memerlukan mention kecuali di-override per grup. Default berada per subsistem di bawah `*.groups."*"`.

Membalas pesan bot dihitung sebagai mention implisit ketika channel mendukung metadata balasan. Mengutip pesan bot juga dapat dihitung sebagai mention implisit pada channel yang mengekspos metadata kutipan. Kasus bawaan saat ini mencakup Telegram, WhatsApp, Slack, Discord, Microsoft Teams, dan ZaloUser.

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

<AccordionGroup>
  <Accordion title="Catatan gating mention">
    - `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar/kecil; pola yang tidak valid dan bentuk nested-repetition yang tidak aman diabaikan.
    - Surface yang menyediakan mention eksplisit tetap lolos; pola adalah fallback.
    - Override per agen: `agents.list[].groupChat.mentionPatterns` (berguna ketika beberapa agen berbagi satu grup).
    - Gating mention hanya diberlakukan ketika deteksi mention dimungkinkan (mention native atau `mentionPatterns` dikonfigurasi).
    - Grup tempat balasan senyap diizinkan memperlakukan giliran model yang benar-benar kosong atau hanya berisi reasoning sebagai senyap, setara dengan `NO_REPLY`. Chat langsung tetap memperlakukan balasan kosong sebagai giliran agen yang gagal.
    - Default Discord berada di `channels.discord.guilds."*"` (dapat dioverride per guild/channel).
    - Konteks riwayat grup dibungkus secara seragam di semua channel dan bersifat **pending-only** (pesan dilewati karena gating mention); gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk override. Tetapkan `0` untuk menonaktifkan.
  </Accordion>
</AccordionGroup>

## Pembatasan tool grup/channel (opsional)

Beberapa konfigurasi channel mendukung pembatasan tool yang tersedia **di dalam grup/room/channel tertentu**.

- `tools`: izinkan/tolak tool untuk seluruh grup.
- `toolsBySender`: override per-pengirim di dalam grup. Gunakan prefix key eksplisit: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`. Key lama tanpa prefix masih diterima dan dicocokkan hanya sebagai `id:`.

Urutan resolusi (yang paling spesifik menang):

<Steps>
  <Step title="Group toolsBySender">
    Kecocokan `toolsBySender` grup/channel.
  </Step>
  <Step title="Group tools">
    `tools` grup/channel.
  </Step>
  <Step title="Default toolsBySender">
    Kecocokan `toolsBySender` default (`"*"`).
  </Step>
  <Step title="Default tools">
    `tools` default (`"*"`).
  </Step>
</Steps>

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

<Note>
Pembatasan tool grup/channel diterapkan sebagai tambahan terhadap kebijakan tool global/agen (deny tetap menang). Beberapa channel menggunakan nesting yang berbeda untuk room/channel (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlist grup

Saat `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, key tersebut berfungsi sebagai allowlist grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku mention default.

<Warning>
Kebingungan yang umum: persetujuan pairing DM tidak sama dengan otorisasi grup. Untuk channel yang mendukung pairing DM, penyimpanan pairing hanya membuka DM. Perintah grup tetap memerlukan otorisasi pengirim grup eksplisit dari allowlist konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi yang didokumentasikan untuk channel tersebut.
</Warning>

Niat umum (copy/paste):

<Tabs>
  <Tab title="Nonaktifkan semua balasan grup">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Izinkan hanya grup tertentu (WhatsApp)">
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
  </Tab>
  <Tab title="Izinkan semua grup tetapi wajib mention">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Pemicu hanya owner (WhatsApp)">
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
  </Tab>
</Tabs>

## Aktivasi (khusus owner)

Owner grup dapat mengubah aktivasi per grup:

- `/activation mention`
- `/activation always`

Owner ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 milik bot sendiri jika tidak diatur). Kirim perintah sebagai pesan mandiri. Surface lain saat ini mengabaikan `/activation`.

## Field konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil gating mention)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Catatan khusus channel:

- BlueBubbles secara opsional dapat memperkaya peserta grup macOS yang tidak bernama dari database Contacts lokal sebelum mengisi `GroupMembers`. Ini nonaktif secara default dan hanya berjalan setelah gating grup normal lolos.

System prompt agen menyertakan pengantar grup pada giliran pertama sesi grup baru. Ini mengingatkan model untuk merespons seperti manusia, menghindari tabel Markdown, meminimalkan baris kosong dan mengikuti spasi chat normal, serta menghindari mengetik urutan literal `\n`. Nama grup dan label peserta yang berasal dari channel dirender sebagai metadata tidak tepercaya dalam fenced block, bukan sebagai instruksi sistem inline.

## Hal khusus iMessage

- Gunakan `chat_id:<id>` saat routing atau membuat allowlist.
- Daftar chat: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## System prompt WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan system prompt WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, serta semantik override akun.

## Hal khusus WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan mention).

## Terkait

- [Grup siaran](/id/channels/broadcast-groups)
- [Routing channel](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Pairing](/id/channels/pairing)
