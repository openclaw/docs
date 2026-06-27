---
read_when:
    - Mengubah perilaku obrolan grup atau gating mention
    - Membatasi mentionPatterns ke percakapan grup tertentu
sidebarTitle: Groups
summary: Perilaku obrolan grup di seluruh permukaan (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-06-27T17:09:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw memperlakukan chat grup secara konsisten di berbagai permukaan: Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

Untuk ruang yang selalu aktif dan seharusnya menyediakan konteks senyap kecuali agen secara eksplisit mengirim pesan yang terlihat, lihat [Peristiwa ruang ambient](/id/channels/ambient-room-events).

## Pengantar pemula (2 menit)

OpenClaw "hidup" di akun perpesanan milik Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah. Jika **Anda** berada di sebuah grup, OpenClaw dapat melihat grup itu dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan mention kecuali Anda secara eksplisit menonaktifkan gerbang mention.
- Balasan yang terlihat di grup/channel menggunakan alat `message` secara default.

Terjemahannya: pengirim yang ada dalam allowlist dapat memicu OpenClaw dengan menyebutnya.

<Note>
**TL;DR**

- **Akses DM** dikendalikan oleh `*.allowFrom`.
- **Akses grup** dikendalikan oleh `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
- **Pemicu balasan** dikendalikan oleh gerbang mention (`requireMention`, `/activation`).

</Note>

Alur cepat (yang terjadi pada pesan grup):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Balasan yang terlihat

Untuk permintaan grup/channel normal, OpenClaw secara default menggunakan `messages.groupChat.visibleReplies: "automatic"`. Teks akhir asisten diposting melalui jalur balasan terlihat lama kecuali Anda mengikutsertakan ruang ke output khusus alat pesan.

Gunakan `messages.groupChat.visibleReplies: "message_tool"` ketika ruang bersama harus membiarkan agen memutuskan kapan berbicara dengan memanggil `message(action=send)`. Ini paling cocok untuk ruang grup yang didukung model generasi terbaru yang andal menggunakan alat, seperti GPT 5.5. Jika model melewatkan alat itu dan mengembalikan teks akhir substantif, OpenClaw menjaga teks akhir itu tetap privat alih-alih mempostingnya ke ruang.

Gunakan `"automatic"` untuk model atau runtime yang lebih lemah yang tidak andal memahami pengiriman khusus alat. Dalam mode otomatis, teks akhir asisten agen adalah jalur balasan sumber yang terlihat, sehingga model yang tidak dapat secara konsisten memanggil `message(action=send)` tetap dapat menjawab secara normal.

Dalam mode otomatis, balasan akhir teks normal diposting langsung ke ruang. Jika balasan terlihat memerlukan berkas, gambar, atau lampiran lain, agen tetap dapat menggunakan `message(action=send)` untuk lampiran tersebut alih-alih mencoba memaksanya melalui balasan teks akhir.

Jika alat pesan tidak tersedia berdasarkan kebijakan alat aktif, OpenClaw melakukan fallback ke balasan terlihat otomatis alih-alih menekan respons secara diam-diam.
`openclaw doctor` memperingatkan ketidakcocokan ini.

Untuk chat langsung dan peristiwa sumber lainnya, gunakan `messages.visibleReplies: "message_tool"` untuk menerapkan perilaku balasan terlihat khusus alat yang sama secara global. Giliran langsung WebChat internal secara default memakai pengiriman balasan akhir otomatis agar Pi dan Codex menerima kontrak balasan terlihat yang sama. Atur `messages.visibleReplies: "message_tool"` untuk secara sengaja mewajibkan `message(action=send)` bagi output yang terlihat. `messages.groupChat.visibleReplies` tetap menjadi override yang lebih spesifik untuk ruang grup/channel.

Ini menggantikan pola lama yang memaksa model menjawab `NO_REPLY` untuk sebagian besar giliran mode mengintai. Dalam mode khusus alat, prompt tidak mendefinisikan kontrak `NO_REPLY`. Tidak melakukan apa pun yang terlihat berarti tidak memanggil alat pesan.

Binding percakapan milik Plugin adalah pengecualian. Setelah Plugin mengikat thread dan mengklaim giliran masuk, balasan yang dikembalikan Plugin adalah respons binding yang terlihat; balasan itu tidak memerlukan `message(action=send)`. Balasan tersebut adalah output runtime Plugin, bukan teks akhir model privat.

Indikator mengetik masih dikirim untuk permintaan grup langsung. Peristiwa ruang selalu aktif ambient, ketika diaktifkan, tetap ketat dan senyap kecuali agen memanggil alat pesan.

Sesi menekan ringkasan alat/progres yang verbose secara default. Gunakan `/verbose on`
untuk menampilkan ringkasan tersebut bagi sesi saat ini ketika debugging, dan
`/verbose off` untuk kembali ke perilaku hanya balasan akhir. Status verbose yang sama
berlaku di chat langsung, grup, channel, dan topik forum.

Untuk mengirim obrolan grup selalu aktif tanpa mention sebagai konteks ruang senyap alih-alih permintaan pengguna, gunakan [Peristiwa ruang ambient](/id/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Defaultnya adalah `unmentionedInbound: "user_request"`.

Pesan yang disebutkan, perintah, permintaan abort, dan DM tetap menjadi permintaan pengguna.

Untuk mewajibkan output yang terlihat melewati alat pesan untuk permintaan grup/channel:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Gateway memuat ulang konfigurasi `messages` secara hot-reload setelah berkas disimpan. Mulai ulang hanya
ketika pemantauan berkas atau pemuatan ulang konfigurasi dinonaktifkan dalam deployment.

Untuk mewajibkan output yang terlihat melewati alat pesan untuk setiap chat sumber:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Perintah slash native (Discord, Telegram, dan permukaan lain dengan dukungan perintah native) melewati `visibleReplies: "message_tool"` dan selalu membalas secara terlihat agar UI perintah native channel mendapatkan respons yang diharapkannya. Ini hanya berlaku untuk giliran perintah native yang divalidasi; perintah `/...` yang diketik sebagai teks dan giliran chat biasa tetap mengikuti default grup yang dikonfigurasi.

## Visibilitas konteks dan allowlist

Dua kontrol berbeda terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist khusus channel).
- **Visibilitas konteks**: konteks tambahan apa yang disuntikkan ke model (teks balasan, kutipan, riwayat thread, metadata yang diteruskan).

Secara default, OpenClaw memprioritaskan perilaku chat normal dan menjaga konteks sebagian besar seperti yang diterima. Ini berarti allowlist terutama menentukan siapa yang dapat memicu tindakan, bukan batas redaksi universal untuk setiap cuplikan yang dikutip atau historis.

<AccordionGroup>
  <Accordion title="Perilaku saat ini khusus channel">
    - Beberapa channel sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan di jalur tertentu (misalnya penyemaian thread Slack, pencarian balasan/thread Matrix).
    - Channel lain masih meneruskan konteks kutipan/balasan/terusan sebagaimana diterima.

  </Accordion>
  <Accordion title="Arah pengerasan (direncanakan)">
    - `contextVisibility: "all"` (default) mempertahankan perilaku saat ini sebagaimana diterima.
    - `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang ada dalam allowlist.
    - `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan eksplisit.

    Sampai model pengerasan ini diterapkan secara konsisten di semua channel, perkirakan adanya perbedaan berdasarkan permukaan.

  </Accordion>
</AccordionGroup>

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                       | Yang perlu diatur                                         |
| -------------------------------------------- | ---------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas pada @mention | `groups: { "*": { requireMention: true } }`                |
| Nonaktifkan semua balasan grup               | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                          | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"` )   |
| Hanya Anda yang dapat memicu di grup         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Gunakan kembali satu set pengirim tepercaya di seluruh channel | `groupAllowFrom: ["accessGroup:operators"]`                |

Untuk allowlist pengirim yang dapat digunakan kembali, lihat [Grup akses](/id/channels/access-groups).

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (ruang/channel menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesinya sendiri.
- Chat langsung menggunakan sesi utama (atau per pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (satu agen)

Ya — ini bekerja baik jika traffic "pribadi" Anda adalah **DM** dan traffic "publik" Anda adalah **grup**.

Alasannya: dalam mode satu agen, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sedangkan grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap berada di host. Docker adalah backend default jika Anda tidak memilih salah satu.

Ini memberi Anda satu "otak" agen (workspace + memori bersama), tetapi dua postur eksekusi:

- **DM**: alat penuh (host)
- **Grup**: sandbox + alat terbatas

<Note>
Jika Anda membutuhkan workspace/persona yang benar-benar terpisah ("pribadi" dan "publik" tidak boleh pernah bercampur), gunakan agen kedua + binding. Lihat [Routing Multi-Agen](/id/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM di host, grup di-sandbox">
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
  <Tab title="Grup hanya melihat folder yang ada dalam allowlist">
    Ingin "grup hanya dapat melihat folder X" alih-alih "tanpa akses host"? Pertahankan `workspaceAccess: "none"` dan mount hanya path yang ada dalam allowlist ke dalam sandbox:

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
- Men-debug mengapa alat diblokir: [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail bind mount: [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts)

## Label tampilan

- Label UI menggunakan `displayName` bila tersedia, diformat sebagai `<channel>:<token>`.
- `#room` dicadangkan untuk ruang/channel; chat grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`).

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
      groupAllowFrom: ["123456789"], // id pengguna Telegram numerik (wizard dapat menyelesaikan @username)
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

| Kebijakan     | Perilaku                                                            |
| ------------- | ------------------------------------------------------------------- |
| `"open"`      | Grup melewati allowlist; mention-gating tetap berlaku.              |
| `"disabled"`  | Blokir semua pesan grup sepenuhnya.                                 |
| `"allowlist"` | Hanya izinkan grup/ruang yang cocok dengan allowlist terkonfigurasi. |

<AccordionGroup>
  <Accordion title="Catatan per-channel">
    - `groupPolicy` terpisah dari mention-gating (yang memerlukan @mention).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
    - Signal: `groupAllowFrom` dapat cocok dengan id grup Signal masuk atau telepon/UUID pengirim.
    - Persetujuan pemasangan DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit ke allowlist grup.
    - Discord: allowlist menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: allowlist menggunakan `channels.slack.channels`.
    - Matrix: allowlist menggunakan `channels.matrix.groups`. Utamakan ID ruang atau alias; pencarian nama ruang yang sudah diikuti bersifat upaya terbaik, dan nama yang tidak terselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; allowlist `users` per ruang juga didukung.
    - DM grup dikontrol secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Allowlist Telegram dapat cocok dengan ID pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau nama pengguna (`"@alice"` atau `"alice"`); prefiks tidak peka huruf besar-kecil.
    - Default adalah `groupPolicy: "allowlist"`; jika allowlist grup Anda kosong, pesan grup diblokir.
    - Keamanan runtime: ketika blok penyedia benar-benar tidak ada (`channels.<provider>` tidak ada), kebijakan grup kembali ke mode fail-closed (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

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
  <Step title="Mention gating">
    Mention gating (`requireMention`, `/activation`).
  </Step>
</Steps>

## Mention gating (default)

Pesan grup memerlukan mention kecuali ditimpa per grup. Default berada per subsistem di bawah `*.groups."*"`.

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

## Cakupan pola mention terkonfigurasi

`mentionPatterns` terkonfigurasi adalah pemicu fallback regex. Gunakan ini ketika
platform tidak mengekspos mention bot native, atau ketika Anda ingin teks biasa
seperti `openclaw:` dihitung sebagai mention. Mention platform native terpisah:
ketika Discord, Slack, Telegram, Matrix, atau channel lain dapat membuktikan pesan
secara eksplisit menyebut bot, mention native tersebut tetap memicu meskipun
pola regex terkonfigurasi ditolak.

Secara default, pola mention terkonfigurasi berlaku di semua tempat ketika channel meneruskan
fakta penyedia dan percakapan ke deteksi mention. Untuk mencegah pola luas
membangunkan agen di setiap grup, cakupkan per channel dengan
`channels.<channel>.mentionPatterns`.

Gunakan `mode: "deny"` ketika pola mention regex harus nonaktif secara default untuk sebuah
channel, lalu ikutkan ruang tertentu dengan `allowIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

Gunakan `mode: "allow"` default (atau hilangkan `mode`) ketika pola mention regex
harus berlaku secara luas, lalu nonaktifkan di ruang yang bising dengan `denyIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

Resolusi kebijakan:

| Bidang          | Efek                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Pola mention regex diaktifkan kecuali ID percakapan ada di `denyIn`. Ini adalah default.                                         |
| `mode: "deny"`  | Pola mention regex dinonaktifkan kecuali ID percakapan ada di `allowIn`.                                                         |
| `allowIn`       | ID percakapan tempat pola mention regex diaktifkan dalam mode deny.                                                              |
| `denyIn`        | ID percakapan tempat pola mention regex dinonaktifkan. `denyIn` menang atas `allowIn` jika keduanya menyertakan ID yang sama.    |

Kebijakan regex bercakupan yang didukung saat ini:

| Channel  | ID yang digunakan di `allowIn` / `denyIn`                            |
| -------- | -------------------------------------------------------------------- |
| Discord  | ID channel Discord.                                                  |
| Matrix   | ID ruang Matrix.                                                     |
| Slack    | ID channel Slack.                                                    |
| Telegram | ID chat grup, atau `chatId:topic:threadId` untuk topik forum.        |
| WhatsApp | ID percakapan WhatsApp seperti `123@g.us`.                           |

Konfigurasi channel tingkat akun dapat menetapkan kebijakan yang sama di bawah
`channels.<channel>.accounts.<accountId>.mentionPatterns` ketika channel tersebut
mendukung banyak akun. Kebijakan akun didahulukan atas kebijakan channel tingkat atas
untuk akun tersebut.

<AccordionGroup>
  <Accordion title="Catatan mention gating">
    - `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar-kecil; pola tidak valid dan bentuk pengulangan bersarang yang tidak aman diabaikan.
    - Surface yang menyediakan mention eksplisit tetap lolos; pola regex terkonfigurasi adalah fallback.
    - `channels.<channel>.mentionPatterns.mode: "deny"` menonaktifkan pola mention terkonfigurasi secara default untuk channel tersebut; aktifkan kembali percakapan terpilih dengan `allowIn`.
    - `channels.<channel>.mentionPatterns.denyIn` menonaktifkan pola mention terkonfigurasi untuk ID percakapan tertentu sementara @mention platform native tetap lolos.
    - Override per agen: `agents.list[].groupChat.mentionPatterns` (berguna ketika beberapa agen berbagi grup).
    - Mention gating hanya diberlakukan ketika deteksi mention memungkinkan (mention native atau `mentionPatterns` dikonfigurasi).
    - Memasukkan grup atau pengirim ke allowlist tidak menonaktifkan mention gating; setel `requireMention` grup tersebut ke `false` ketika semua pesan harus memicu.
    - Konteks prompt chat grup otomatis membawa instruksi balasan senyap yang telah diselesaikan di setiap giliran; file workspace tidak boleh menduplikasi mekanik `NO_REPLY`.
    - Grup tempat balasan senyap otomatis diizinkan memperlakukan giliran model yang kosong bersih atau hanya penalaran sebagai senyap, setara dengan `NO_REPLY`. Chat langsung tidak pernah menerima panduan `NO_REPLY`, dan balasan grup hanya message-tool tetap senyap dengan tidak memanggil `message(action=send)`.
    - Obrolan grup ambient yang selalu aktif menggunakan semantik permintaan pengguna secara default. Setel `messages.groupChat.unmentionedInbound: "room_event"` untuk mengirimkannya sebagai konteks senyap sebagai gantinya. Lihat [Peristiwa ruang ambient](/id/channels/ambient-room-events) untuk contoh penyiapan.
    - Peristiwa ruang tidak disimpan sebagai permintaan pengguna palsu, dan teks asisten privat dari peristiwa ruang tanpa message-tool tidak diputar ulang sebagai riwayat chat.
    - Default Discord berada di `channels.discord.guilds."*"` (dapat ditimpa per guild/channel).
    - Konteks riwayat grup dibungkus seragam di seluruh channel. Grup dengan mention-gating menyimpan pesan terlewati yang tertunda; grup selalu aktif juga dapat menyimpan pesan ruang terbaru yang sudah diproses ketika channel mendukungnya. Gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk override. Setel `0` untuk menonaktifkan.

  </Accordion>
</AccordionGroup>

## Pembatasan tool grup/channel (opsional)

Beberapa konfigurasi channel mendukung pembatasan tool mana yang tersedia **di dalam grup/ruang/channel tertentu**.

- `tools`: izinkan/tolak tool untuk seluruh grup.
- `toolsBySender`: override per pengirim di dalam grup. Gunakan prefiks kunci eksplisit: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`. ID channel menggunakan ID channel kanonis OpenClaw; alias seperti `teams` dinormalisasi menjadi `msteams`. Kunci lama tanpa prefiks masih diterima dan dicocokkan hanya sebagai `id:`.

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
Pembatasan tool grup/channel diterapkan selain kebijakan tool global/agen (deny tetap menang). Beberapa channel menggunakan nesting berbeda untuk ruang/channel (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlist grup

Ketika `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kuncinya bertindak sebagai allowlist grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku mention default.

<Warning>
Kebingungan umum: persetujuan pemasangan DM tidak sama dengan otorisasi grup. Untuk channel yang mendukung pemasangan DM, penyimpanan pemasangan hanya membuka DM. Perintah grup tetap memerlukan otorisasi pengirim grup yang eksplisit dari allowlist konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi terdokumentasi untuk channel tersebut.
</Warning>

Intent umum (salin/tempel):

<Tabs>
  <Tab title="Disable all group replies">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Allow only specific groups (WhatsApp)">
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
  <Tab title="Allow all groups but require mention">
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
  <Tab title="Owner-only triggers (WhatsApp)">
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

## Aktivasi (hanya pemilik)

Pemilik grup dapat mengaktifkan atau menonaktifkan aktivasi per grup:

- `/activation mention`
- `/activation always`

Pemilik ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 milik bot sendiri saat tidak diatur). Kirim perintah sebagai pesan tersendiri. Permukaan lain saat ini mengabaikan `/activation`.

## Bidang konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil gating penyebutan)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Prompt sistem agen menyertakan intro grup pada giliran pertama sesi grup baru. Prompt ini mengingatkan model untuk merespons seperti manusia, meminimalkan baris kosong dan mengikuti spasi chat normal, serta menghindari mengetik urutan literal `\n`. Grup non-Telegram juga tidak menganjurkan tabel Markdown; panduan rich-text Telegram berasal dari prompt channel Telegram. Nama grup dan label peserta yang bersumber dari channel dirender sebagai metadata tidak tepercaya berpagar, bukan instruksi sistem inline.

## Kekhususan iMessage

- Utamakan `chat_id:<id>` saat merutekan atau memasukkan ke allowlist.
- Daftar chat: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## Prompt sistem WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan prompt sistem WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, serta semantik override akun.

## Kekhususan WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan penyebutan).

## Terkait

- [Grup siaran](/id/channels/broadcast-groups)
- [Perutean channel](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Pemasangan](/id/channels/pairing)
