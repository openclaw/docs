---
read_when:
    - Mengubah perilaku obrolan grup atau pembatasan penyebutan
sidebarTitle: Groups
summary: Perilaku obrolan grup di seluruh permukaan (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-04-30T16:27:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw memperlakukan obrolan grup secara konsisten di seluruh permukaan: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar pemula (2 menit)

OpenClaw "hidup" di akun perpesanan Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah. Jika **Anda** berada dalam grup, OpenClaw dapat melihat grup tersebut dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan mention kecuali Anda secara eksplisit menonaktifkan pembatasan mention.
- Balasan akhir normal di grup/channel bersifat privat secara default. Keluaran ruang yang terlihat menggunakan tool `message`.

Artinya: pengirim yang ada dalam daftar izin dapat memicu OpenClaw dengan menyebutnya.

<Note>
**TL;DR**

- **Akses DM** dikontrol oleh `*.allowFrom`.
- **Akses grup** dikontrol oleh `*.groupPolicy` + daftar izin (`*.groups`, `*.groupAllowFrom`).
- **Pemicu balasan** dikontrol oleh pembatasan mention (`requireMention`, `/activation`).

</Note>

Alur cepat (apa yang terjadi pada pesan grup):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Balasan yang terlihat

Untuk ruang grup/channel, OpenClaw secara default menggunakan `messages.groupChat.visibleReplies: "message_tool"`.
Itu berarti agent tetap memproses giliran dan dapat memperbarui status memori/sesi, tetapi jawaban akhir normalnya tidak otomatis diposting kembali ke ruang. Untuk berbicara secara terlihat, agent menggunakan `message(action=send)`.

Untuk obrolan langsung dan giliran sumber lainnya, gunakan `messages.visibleReplies: "message_tool"` untuk menerapkan perilaku balasan terlihat yang hanya melalui tool secara global. `messages.groupChat.visibleReplies` tetap menjadi override yang lebih spesifik untuk ruang grup/channel.

Ini menggantikan pola lama yang memaksa model menjawab `NO_REPLY` untuk sebagian besar giliran mode intai. Dalam mode hanya tool, tidak melakukan apa pun yang terlihat berarti tidak memanggil tool message.

Indikator mengetik tetap dikirim saat agent bekerja dalam mode hanya tool. Mode mengetik grup default ditingkatkan dari "message" menjadi "instant" untuk giliran ini karena mungkin tidak pernah ada teks pesan assistant normal sebelum agent memutuskan apakah akan memanggil tool message. Konfigurasi mode mengetik eksplisit tetap berlaku lebih kuat.

Untuk memulihkan balasan akhir otomatis lama untuk ruang grup/channel:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway memuat ulang panas konfigurasi `messages` setelah file disimpan. Mulai ulang hanya
ketika pemantauan file atau pemuatan ulang konfigurasi dinonaktifkan dalam deployment.

Untuk mewajibkan keluaran terlihat melewati tool message untuk setiap obrolan sumber:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Perintah slash native (Discord, Telegram, dan permukaan lain dengan dukungan perintah native) melewati `visibleReplies: "message_tool"` dan selalu membalas secara terlihat agar UI perintah native channel mendapatkan respons yang diharapkan. Ini hanya berlaku untuk giliran perintah native yang tervalidasi; perintah `/...` yang diketik sebagai teks dan giliran obrolan biasa tetap mengikuti default grup yang dikonfigurasi.

## Visibilitas konteks dan daftar izin

Dua kontrol berbeda terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agent (`groupPolicy`, `groups`, `groupAllowFrom`, daftar izin khusus channel).
- **Visibilitas konteks**: konteks tambahan apa yang disuntikkan ke model (teks balasan, kutipan, riwayat thread, metadata terusan).

Secara default, OpenClaw memprioritaskan perilaku obrolan normal dan mempertahankan konteks sebagian besar seperti yang diterima. Ini berarti daftar izin terutama menentukan siapa yang dapat memicu tindakan, bukan batas redaksi universal untuk setiap cuplikan kutipan atau historis.

<AccordionGroup>
  <Accordion title="Perilaku saat ini spesifik per channel">
    - Beberapa channel sudah menerapkan penyaringan berbasis pengirim untuk konteks tambahan di jalur tertentu (misalnya penyemaian thread Slack, pencarian balasan/thread Matrix).
    - Channel lain masih meneruskan konteks kutipan/balasan/terusan seperti yang diterima.

  </Accordion>
  <Accordion title="Arah penguatan (direncanakan)">
    - `contextVisibility: "all"` (default) mempertahankan perilaku saat ini seperti yang diterima.
    - `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang ada dalam daftar izin.
    - `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan eksplisit.

    Sampai model penguatan ini diterapkan secara konsisten di seluruh channel, perkirakan adanya perbedaan berdasarkan permukaan.

  </Accordion>
</AccordionGroup>

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                         | Yang harus diatur                                         |
| ---------------------------------------------- | ---------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas pada @mentions | `groups: { "*": { requireMention: true } }`                |
| Nonaktifkan semua balasan grup                 | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                            | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"` )   |
| Hanya Anda yang dapat memicu di grup           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (ruang/channel menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesi sendiri.
- Obrolan langsung menggunakan sesi utama (atau per-pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (satu agent)

Ya — ini bekerja dengan baik jika trafik "pribadi" Anda adalah **DM** dan trafik "publik" Anda adalah **grup**.

Mengapa: dalam mode satu agent, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sementara grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap berada di host. Docker adalah backend default jika Anda tidak memilih salah satu.

Ini memberi Anda satu "otak" agent (workspace + memori bersama), tetapi dua postur eksekusi:

- **DM**: tool penuh (host)
- **Grup**: sandbox + tool terbatas

<Note>
Jika Anda memerlukan workspace/persona yang benar-benar terpisah ("pribadi" dan "publik" tidak boleh pernah bercampur), gunakan agent kedua + binding. Lihat [Routing Multi-Agent](/id/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM di host, grup disandbox">
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
  </Tab>
  <Tab title="Grup hanya melihat folder yang ada dalam daftar izin">
    Ingin "grup hanya dapat melihat folder X" alih-alih "tidak ada akses host"? Pertahankan `workspaceAccess: "none"` dan mount hanya path yang ada dalam daftar izin ke sandbox:

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
- Men-debug mengapa sebuah tool diblokir: [Sandbox vs Kebijakan Tool vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail bind mount: [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts)

## Label tampilan

- Label UI menggunakan `displayName` jika tersedia, diformat sebagai `<channel>:<token>`.
- `#room` dicadangkan untuk ruang/channel; obrolan grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`).

## Kebijakan grup

Kontrol bagaimana pesan grup/ruang ditangani per channel:

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
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Kebijakan     | Perilaku                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grup melewati daftar izin; pembatasan mention tetap berlaku. |
| `"disabled"`  | Blokir semua pesan grup sepenuhnya.                          |
| `"allowlist"` | Hanya izinkan grup/ruang yang cocok dengan daftar izin yang dikonfigurasi. |

<AccordionGroup>
  <Accordion title="Catatan per channel">
    - `groupPolicy` terpisah dari pembatasan mention (yang memerlukan @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
    - Signal: `groupAllowFrom` dapat mencocokkan id grup Signal masuk atau telepon/UUID pengirim.
    - Persetujuan pairing DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit ke daftar izin grup.
    - Discord: daftar izin menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: daftar izin menggunakan `channels.slack.channels`.
    - Matrix: daftar izin menggunakan `channels.matrix.groups`. Utamakan ID ruang atau alias; pencarian nama ruang yang sudah diikuti bersifat upaya terbaik, dan nama yang tidak terselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; daftar izin `users` per ruang juga didukung.
    - DM grup dikontrol secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Daftar izin Telegram dapat mencocokkan ID pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau nama pengguna (`"@alice"` atau `"alice"`); prefiks tidak peka huruf besar-kecil.
    - Default adalah `groupPolicy: "allowlist"`; jika daftar izin grup Anda kosong, pesan grup diblokir.
    - Keamanan runtime: ketika blok provider sepenuhnya tidak ada (`channels.<provider>` tidak ada), kebijakan grup kembali ke mode gagal-tertutup (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Model mental cepat (urutan evaluasi untuk pesan grup):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Daftar izin grup">
    Daftar izin grup (`*.groups`, `*.groupAllowFrom`, daftar izin khusus channel).
  </Step>
  <Step title="Pembatasan mention">
    Pembatasan mention (`requireMention`, `/activation`).
  </Step>
</Steps>

## Pembatasan mention (default)

Pesan grup memerlukan mention kecuali dioverride per grup. Default berada per subsistem di bawah `*.groups."*"`.

Membalas pesan bot dihitung sebagai mention implisit saat channel mendukung metadata balasan. Mengutip pesan bot juga dapat dihitung sebagai mention implisit pada channel yang mengekspos metadata kutipan. Kasus bawaan saat ini mencakup Telegram, WhatsApp, Slack, Discord, Microsoft Teams, dan ZaloUser.

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
  <Accordion title="Catatan gerbang mention">
    - `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar-kecil; pola yang tidak valid dan bentuk pengulangan bersarang yang tidak aman diabaikan.
    - Surface yang menyediakan mention eksplisit tetap lolos; pola adalah cadangan.
    - Override per agen: `agents.list[].groupChat.mentionPatterns` (berguna saat beberapa agen berbagi sebuah grup).
    - Gerbang mention hanya diterapkan saat deteksi mention memungkinkan (mention native atau `mentionPatterns` dikonfigurasi).
    - Memasukkan grup atau pengirim ke allowlist tidak menonaktifkan gerbang mention; atur `requireMention` grup tersebut ke `false` saat semua pesan harus memicu.
    - Konteks prompt chat grup membawa instruksi balasan diam yang sudah di-resolve setiap giliran; file workspace tidak boleh menduplikasi mekanik `NO_REPLY`.
    - Grup yang mengizinkan balasan diam memperlakukan giliran model yang kosong bersih atau hanya berisi penalaran sebagai diam, setara dengan `NO_REPLY`. Chat langsung melakukan hal yang sama hanya saat balasan diam langsung diizinkan secara eksplisit; jika tidak, balasan kosong tetap menjadi giliran agen yang gagal.
    - Default Discord berada di `channels.discord.guilds."*"` (dapat dioverride per guild/channel).
    - Konteks riwayat grup dibungkus secara seragam di seluruh channel dan **hanya pending** (pesan yang dilewati karena gerbang mention); gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk override. Atur `0` untuk menonaktifkan.

  </Accordion>
</AccordionGroup>

## Pembatasan tool grup/channel (opsional)

Beberapa konfigurasi channel mendukung pembatasan tool mana yang tersedia **di dalam grup/room/channel tertentu**.

- `tools`: izinkan/tolak tool untuk seluruh grup.
- `toolsBySender`: override per pengirim di dalam grup. Gunakan prefiks kunci eksplisit: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`. Kunci lama tanpa prefiks masih diterima dan dicocokkan sebagai `id:` saja.

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
Pembatasan tool grup/channel diterapkan selain kebijakan tool global/agen (penolakan tetap menang). Beberapa channel menggunakan nesting berbeda untuk room/channel (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlist grup

Saat `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kunci bertindak sebagai allowlist grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku mention default.

<Warning>
Kebingungan umum: persetujuan pairing DM tidak sama dengan otorisasi grup. Untuk channel yang mendukung pairing DM, penyimpanan pairing hanya membuka DM. Perintah grup tetap memerlukan otorisasi pengirim grup eksplisit dari allowlist konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi yang terdokumentasi untuk channel tersebut.
</Warning>

Intent umum (salin/tempel):

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

## Aktivasi (hanya owner)

Owner grup dapat mengaktifkan/menonaktifkan aktivasi per grup:

- `/activation mention`
- `/activation always`

Owner ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 mandiri bot saat tidak diatur). Kirim perintah sebagai pesan mandiri. Surface lain saat ini mengabaikan `/activation`.

## Field konteks

Payload masuk grup mengatur:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil gerbang mention)
- Topik forum Telegram juga mencakup `MessageThreadId` dan `IsForum`.

Catatan khusus channel:

- BlueBubbles dapat secara opsional memperkaya peserta grup macOS tanpa nama dari database Contacts lokal sebelum mengisi `GroupMembers`. Ini nonaktif secara default dan hanya berjalan setelah gerbang grup normal lolos.

Prompt sistem agen menyertakan intro grup pada giliran pertama sesi grup baru. Ini mengingatkan model untuk merespons seperti manusia, menghindari tabel Markdown, meminimalkan baris kosong dan mengikuti spasi chat normal, serta menghindari pengetikan urutan literal `\n`. Nama grup dan label peserta yang bersumber dari channel dirender sebagai metadata tidak tepercaya berpagar, bukan instruksi sistem inline.

## Detail khusus iMessage

- Utamakan `chat_id:<id>` saat merutekan atau memasukkan ke allowlist.
- Daftar chat: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## Prompt sistem WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan prompt sistem WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, dan semantik override akun.

## Detail khusus WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan mention).

## Terkait

- [Grup siaran](/id/channels/broadcast-groups)
- [Perutean channel](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Pairing](/id/channels/pairing)
