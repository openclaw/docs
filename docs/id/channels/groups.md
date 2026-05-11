---
read_when:
    - Mengubah perilaku obrolan grup atau pembatasan penyebutan
sidebarTitle: Groups
summary: Perilaku obrolan grup di berbagai permukaan (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-05-11T20:20:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw memperlakukan obrolan grup secara konsisten di berbagai permukaan: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar pemula (2 menit)

OpenClaw "hidup" di akun perpesanan Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah. Jika **Anda** berada dalam sebuah grup, OpenClaw dapat melihat grup itu dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan sebutan kecuali Anda menonaktifkan gating sebutan secara eksplisit.
- Balasan akhir normal di grup/saluran bersifat privat secara default. Keluaran ruang yang terlihat menggunakan alat `message`.

Terjemahan: pengirim yang masuk daftar izin dapat memicu OpenClaw dengan menyebutnya.

<Note>
**TL;DR**

- **Akses DM** dikontrol oleh `*.allowFrom`.
- **Akses grup** dikontrol oleh `*.groupPolicy` + daftar izin (`*.groups`, `*.groupAllowFrom`).
- **Pemicu balasan** dikontrol oleh gating sebutan (`requireMention`, `/activation`).

</Note>

Alur cepat (yang terjadi pada pesan grup):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Balasan yang terlihat

Untuk ruang grup/saluran, OpenClaw menggunakan default `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` menulis default ini ke konfigurasi saluran yang dikonfigurasi yang belum mencantumkannya.
Artinya agen tetap memproses giliran dan dapat memperbarui status memori/sesi, tetapi jawaban akhir normalnya tidak otomatis dikirim kembali ke ruang. Untuk berbicara secara terlihat, agen menggunakan `message(action=send)`.

Default ini bergantung pada model/runtime yang andal memanggil alat. Jika log menunjukkan
teks asisten tetapi `didSendViaMessagingTool: false`, model menjawab
secara privat alih-alih memanggil alat pesan. Itu bukan kegagalan pengiriman
Discord/Slack/Telegram. Gunakan model yang andal memanggil alat untuk
sesi grup/saluran, atau atur
`messages.groupChat.visibleReplies: "automatic"` untuk memulihkan balasan akhir
terlihat warisan.

Jika alat pesan tidak tersedia berdasarkan kebijakan alat aktif, OpenClaw kembali
ke balasan terlihat otomatis alih-alih menekan respons secara diam-diam.
`openclaw doctor` memperingatkan ketidakcocokan ini.

Untuk obrolan langsung dan giliran sumber lain apa pun, gunakan `messages.visibleReplies: "message_tool"` untuk menerapkan perilaku balasan terlihat hanya-alat yang sama secara global. Harness juga dapat memilih ini sebagai default yang belum diatur; harness Codex melakukan ini untuk obrolan langsung mode Codex. `messages.groupChat.visibleReplies` tetap menjadi override yang lebih spesifik untuk ruang grup/saluran.

Ini menggantikan pola lama yang memaksa model menjawab `NO_REPLY` untuk sebagian besar giliran mode mengamati. Dalam mode hanya-alat, tidak melakukan apa pun yang terlihat berarti tidak memanggil alat pesan.

Indikator mengetik tetap dikirim saat agen bekerja dalam mode hanya-alat. Mode mengetik grup default ditingkatkan dari "message" menjadi "instant" untuk giliran ini karena mungkin tidak pernah ada teks pesan asisten normal sebelum agen memutuskan apakah akan memanggil alat pesan. Konfigurasi mode mengetik eksplisit tetap menang.

Untuk memulihkan balasan akhir otomatis warisan untuk ruang grup/saluran:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway memuat ulang konfigurasi `messages` secara hot-reload setelah file disimpan. Mulai ulang hanya
ketika pemantauan file atau pemuatan ulang konfigurasi dinonaktifkan dalam deployment.

Untuk mengharuskan keluaran terlihat melewati alat pesan untuk setiap obrolan sumber:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Perintah slash native (Discord, Telegram, dan permukaan lain dengan dukungan perintah native) melewati `visibleReplies: "message_tool"` dan selalu membalas secara terlihat agar UI perintah native saluran mendapatkan respons yang diharapkan. Ini hanya berlaku untuk giliran perintah native yang tervalidasi; perintah `/...` yang diketik sebagai teks dan giliran obrolan biasa tetap mengikuti default grup yang dikonfigurasi.

## Visibilitas konteks dan daftar izin

Ada dua kontrol berbeda yang terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, daftar izin khusus saluran).
- **Visibilitas konteks**: konteks tambahan apa yang disuntikkan ke model (teks balasan, kutipan, riwayat utas, metadata terusan).

Secara default, OpenClaw memprioritaskan perilaku obrolan normal dan mempertahankan konteks sebagian besar sebagaimana diterima. Artinya daftar izin terutama menentukan siapa yang dapat memicu tindakan, bukan batas redaksi universal untuk setiap kutipan atau cuplikan historis.

<AccordionGroup>
  <Accordion title="Perilaku saat ini bersifat khusus saluran">
    - Beberapa saluran sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan di jalur tertentu (misalnya penyemaian utas Slack, pencarian balasan/utas Matrix).
    - Saluran lain masih meneruskan konteks kutipan/balasan/terusan sebagaimana diterima.

  </Accordion>
  <Accordion title="Arah pengerasan (direncanakan)">
    - `contextVisibility: "all"` (default) mempertahankan perilaku saat ini sebagaimana diterima.
    - `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang masuk daftar izin.
    - `contextVisibility: "allowlist_quote"` adalah `allowlist` plus satu pengecualian kutipan/balasan eksplisit.

    Hingga model pengerasan ini diimplementasikan secara konsisten di seluruh saluran, perkirakan adanya perbedaan antarpermukaan.

  </Accordion>
</AccordionGroup>

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                         | Yang perlu diatur                                           |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas pada @sebutan | `groups: { "*": { requireMention: true } }`                |
| Nonaktifkan semua balasan grup                 | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                            | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"` )   |
| Hanya Anda yang dapat memicu di grup           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Gunakan ulang satu set pengirim tepercaya di seluruh saluran | `groupAllowFrom: ["accessGroup:operators"]`                |

Untuk daftar izin pengirim yang dapat digunakan ulang, lihat [Grup akses](/id/channels/access-groups).

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (ruang/saluran menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesinya sendiri.
- Obrolan langsung menggunakan sesi utama (atau per-pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (satu agen)

Ya — ini bekerja dengan baik jika lalu lintas "pribadi" Anda adalah **DM** dan lalu lintas "publik" Anda adalah **grup**.

Mengapa: dalam mode satu agen, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sementara grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap di host. Docker adalah backend default jika Anda tidak memilih salah satu.

Ini memberi Anda satu "otak" agen (workspace + memori bersama), tetapi dua postur eksekusi:

- **DM**: alat penuh (host)
- **Grup**: sandbox + alat terbatas

<Note>
Jika Anda membutuhkan workspace/persona yang benar-benar terpisah ("pribadi" dan "publik" tidak boleh pernah bercampur), gunakan agen kedua + binding. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent).
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
  <Tab title="Grup hanya melihat folder yang masuk daftar izin">
    Ingin "grup hanya dapat melihat folder X" alih-alih "tidak ada akses host"? Pertahankan `workspaceAccess: "none"` dan mount hanya path yang masuk daftar izin ke dalam sandbox:

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

- Label UI menggunakan `displayName` jika tersedia, diformat sebagai `<channel>:<token>`.
- `#room` dicadangkan untuk ruang/saluran; obrolan grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`).

## Kebijakan grup

Kontrol bagaimana pesan grup/ruang ditangani per saluran:

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
| `"open"`      | Grup melewati daftar izin; gating sebutan tetap berlaku.     |
| `"disabled"`  | Blokir semua pesan grup sepenuhnya.                          |
| `"allowlist"` | Hanya izinkan grup/ruang yang cocok dengan daftar izin yang dikonfigurasi. |

<AccordionGroup>
  <Accordion title="Catatan per kanal">
    - `groupPolicy` terpisah dari pembatasan mention (yang memerlukan @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
    - Signal: `groupAllowFrom` dapat cocok dengan id grup Signal masuk atau telepon/UUID pengirim.
    - Persetujuan penyandingan DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit pada allowlist grup.
    - Discord: allowlist menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: allowlist menggunakan `channels.slack.channels`.
    - Matrix: allowlist menggunakan `channels.matrix.groups`. Utamakan ID ruang atau alias; pencarian nama ruang yang sudah digabung bersifat upaya terbaik, dan nama yang tidak terselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; allowlist `users` per ruang juga didukung.
    - DM grup dikendalikan secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Allowlist Telegram dapat cocok dengan ID pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau nama pengguna (`"@alice"` atau `"alice"`); prefiks tidak peka huruf besar/kecil.
    - Default-nya adalah `groupPolicy: "allowlist"`; jika allowlist grup Anda kosong, pesan grup diblokir.
    - Keamanan runtime: ketika blok penyedia benar-benar tidak ada (`channels.<provider>` tidak ada), kebijakan grup fallback ke mode gagal-tertutup (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Model mental cepat (urutan evaluasi untuk pesan grup):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Allowlist grup">
    Allowlist grup (`*.groups`, `*.groupAllowFrom`, allowlist khusus kanal).
  </Step>
  <Step title="Pembatasan mention">
    Pembatasan mention (`requireMention`, `/activation`).
  </Step>
</Steps>

## Pembatasan mention (default)

Pesan grup memerlukan mention kecuali ditimpa per grup. Default berada per subsistem di bawah `*.groups."*"`.

Membalas pesan bot dihitung sebagai mention implisit ketika kanal mendukung metadata balasan. Mengutip pesan bot juga dapat dihitung sebagai mention implisit pada kanal yang mengekspos metadata kutipan. Kasus bawaan saat ini mencakup Telegram, WhatsApp, Slack, Discord, Microsoft Teams, dan ZaloUser.

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
  <Accordion title="Catatan pembatasan mention">
    - `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar/kecil; pola yang tidak valid dan bentuk pengulangan bersarang yang tidak aman diabaikan.
    - Permukaan yang menyediakan mention eksplisit tetap lolos; pola adalah fallback.
    - Timpa per agen: `agents.list[].groupChat.mentionPatterns` (berguna ketika beberapa agen berbagi satu grup).
    - Pembatasan mention hanya diberlakukan ketika deteksi mention memungkinkan (mention native atau `mentionPatterns` dikonfigurasi).
    - Menambahkan grup atau pengirim ke allowlist tidak menonaktifkan pembatasan mention; setel `requireMention` grup tersebut ke `false` ketika semua pesan harus memicu respons.
    - Konteks prompt chat grup membawa instruksi balasan senyap yang terselesaikan pada setiap giliran; file workspace tidak boleh menduplikasi mekanisme `NO_REPLY`.
    - Grup yang mengizinkan balasan senyap memperlakukan giliran model yang kosong bersih atau hanya berisi penalaran sebagai senyap, setara dengan `NO_REPLY`. Chat langsung melakukan hal yang sama hanya ketika balasan senyap langsung diizinkan secara eksplisit; jika tidak, balasan kosong tetap menjadi giliran agen yang gagal.
    - Default Discord berada di `channels.discord.guilds."*"` (dapat ditimpa per guild/kanal).
    - Konteks riwayat grup dibungkus secara seragam di seluruh kanal. Grup dengan pembatasan mention menyimpan pesan terlewat yang tertunda; grup yang selalu aktif juga dapat mempertahankan pesan ruang terbaru yang sudah diproses ketika kanal mendukungnya. Gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk penimpaan. Setel `0` untuk menonaktifkan.

  </Accordion>
</AccordionGroup>

## Pembatasan alat grup/kanal (opsional)

Beberapa konfigurasi kanal mendukung pembatasan alat mana yang tersedia **di dalam grup/ruang/kanal tertentu**.

- `tools`: izinkan/tolak alat untuk seluruh grup.
- `toolsBySender`: penimpaan per pengirim di dalam grup. Gunakan prefiks kunci eksplisit: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`. ID kanal menggunakan ID kanal OpenClaw kanonis; alias seperti `teams` dinormalisasi menjadi `msteams`. Kunci lama tanpa prefiks masih diterima dan dicocokkan hanya sebagai `id:`.

Urutan resolusi (yang paling spesifik menang):

<Steps>
  <Step title="toolsBySender grup">
    Kecocokan `toolsBySender` grup/kanal.
  </Step>
  <Step title="Alat grup">
    `tools` grup/kanal.
  </Step>
  <Step title="toolsBySender default">
    Kecocokan `toolsBySender` default (`"*"`).
  </Step>
  <Step title="Alat default">
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
Pembatasan alat grup/kanal diterapkan selain kebijakan alat global/agen (penolakan tetap menang). Beberapa kanal menggunakan susunan bersarang yang berbeda untuk ruang/kanal (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlist grup

Ketika `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kuncinya bertindak sebagai allowlist grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku mention default.

<Warning>
Kebingungan umum: persetujuan penyandingan DM tidak sama dengan otorisasi grup. Untuk kanal yang mendukung penyandingan DM, penyimpanan penyandingan hanya membuka DM. Perintah grup tetap memerlukan otorisasi pengirim grup eksplisit dari allowlist konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi terdokumentasi untuk kanal tersebut.
</Warning>

Maksud umum (salin/tempel):

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
  <Tab title="Izinkan semua grup tetapi wajibkan mention">
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
  <Tab title="Pemicu hanya pemilik (WhatsApp)">
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

Pemilik grup dapat mengalihkan aktivasi per grup:

- `/activation mention`
- `/activation always`

Pemilik ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 bot sendiri ketika tidak disetel). Kirim perintah sebagai pesan mandiri. Permukaan lain saat ini mengabaikan `/activation`.

## Bidang konteks

Payload masuk grup menyetel:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil pembatasan mention)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Prompt sistem agen menyertakan intro grup pada giliran pertama sesi grup baru. Ini mengingatkan model untuk merespons seperti manusia, menghindari tabel Markdown, meminimalkan baris kosong dan mengikuti spasi chat normal, serta menghindari pengetikan urutan literal `\n`. Nama grup dan label peserta yang bersumber dari kanal dirender sebagai metadata tidak tepercaya berpagar, bukan instruksi sistem inline.

## Kekhususan iMessage

- Utamakan `chat_id:<id>` saat merutekan atau membuat allowlist.
- Cantumkan chat: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## Prompt sistem WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan prompt sistem WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, dan semantik penimpaan akun.

## Kekhususan WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan mention).

## Terkait

- [Grup siaran](/id/channels/broadcast-groups)
- [Perutean kanal](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Penyandingan](/id/channels/pairing)
