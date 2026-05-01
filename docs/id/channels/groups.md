---
read_when:
    - Mengubah perilaku obrolan grup atau pembatasan penyebutan
sidebarTitle: Groups
summary: Perilaku obrolan grup di berbagai platform (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-05-01T09:22:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8580f98ab03c89770688102da776627d8ce18b7bd34c4a687009fd4aabb6213
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw memperlakukan chat grup secara konsisten di berbagai permukaan: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar pemula (2 menit)

OpenClaw "hidup" di akun perpesanan Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah. Jika **Anda** berada dalam suatu grup, OpenClaw dapat melihat grup itu dan merespons di sana.

Perilaku bawaan:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan mention kecuali Anda secara eksplisit menonaktifkan gerbang mention.
- Balasan akhir normal di grup/channel bersifat privat secara bawaan. Output ruang yang terlihat menggunakan alat `message`.

Artinya: pengirim dalam daftar izin dapat memicu OpenClaw dengan me-mention-nya.

<Note>
**TL;DR**

- **Akses DM** dikontrol oleh `*.allowFrom`.
- **Akses grup** dikontrol oleh `*.groupPolicy` + daftar izin (`*.groups`, `*.groupAllowFrom`).
- **Pemicu balasan** dikontrol oleh gerbang mention (`requireMention`, `/activation`).

</Note>

Alur cepat (apa yang terjadi pada pesan grup):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Balasan yang terlihat

Untuk ruang grup/channel, OpenClaw secara bawaan menggunakan `messages.groupChat.visibleReplies: "message_tool"`.
Artinya agen tetap memproses giliran dan dapat memperbarui memori/status sesi, tetapi jawaban akhir normalnya tidak otomatis diposting kembali ke ruang. Untuk berbicara secara terlihat, agen menggunakan `message(action=send)`.

Jika alat message tidak tersedia berdasarkan kebijakan alat aktif, OpenClaw akan
kembali ke balasan terlihat otomatis alih-alih membungkam respons secara diam-diam.
`openclaw doctor` memperingatkan tentang ketidaksesuaian ini.

Untuk chat langsung dan giliran sumber lain apa pun, gunakan `messages.visibleReplies: "message_tool"` untuk menerapkan perilaku balasan terlihat khusus alat yang sama secara global. `messages.groupChat.visibleReplies` tetap menjadi override yang lebih spesifik untuk ruang grup/channel.

Ini menggantikan pola lama yang memaksa model menjawab `NO_REPLY` untuk sebagian besar giliran mode mengintai. Dalam mode khusus alat, tidak melakukan apa pun yang terlihat cukup berarti tidak memanggil alat message.

Indikator mengetik tetap dikirim saat agen bekerja dalam mode khusus alat. Mode mengetik grup bawaan ditingkatkan dari "message" menjadi "instant" untuk giliran ini karena mungkin tidak pernah ada teks pesan asisten normal sebelum agen memutuskan apakah akan memanggil alat message. Konfigurasi mode mengetik eksplisit tetap menang.

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

Gateway memuat ulang konfigurasi `messages` secara hot-reload setelah file disimpan. Mulai ulang hanya
saat pemantauan file atau pemuatan ulang konfigurasi dinonaktifkan dalam deployment.

Untuk mewajibkan output terlihat melewati alat message untuk setiap chat sumber:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Perintah slash native (Discord, Telegram, dan permukaan lain dengan dukungan perintah native) melewati `visibleReplies: "message_tool"` dan selalu membalas secara terlihat agar UI perintah native channel mendapatkan respons yang diharapkannya. Ini hanya berlaku untuk giliran perintah native yang tervalidasi; perintah `/...` yang diketik sebagai teks dan giliran chat biasa tetap mengikuti bawaan grup yang dikonfigurasi.

## Visibilitas konteks dan daftar izin

Dua kontrol berbeda terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, daftar izin khusus channel).
- **Visibilitas konteks**: konteks tambahan apa yang disuntikkan ke model (teks balasan, kutipan, riwayat thread, metadata terusan).

Secara bawaan, OpenClaw memprioritaskan perilaku chat normal dan sebagian besar mempertahankan konteks seperti yang diterima. Artinya daftar izin terutama menentukan siapa yang dapat memicu tindakan, bukan batas redaksi universal untuk setiap cuplikan yang dikutip atau historis.

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - Beberapa channel sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan pada jalur tertentu (misalnya penanaman thread Slack, pencarian balasan/thread Matrix).
    - Channel lain masih meneruskan konteks kutipan/balasan/terusan sebagaimana diterima.

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - `contextVisibility: "all"` (bawaan) mempertahankan perilaku saat ini sebagaimana diterima.
    - `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim dalam daftar izin.
    - `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan eksplisit.

    Sampai model pengerasan ini diterapkan secara konsisten di seluruh channel, perkirakan ada perbedaan menurut permukaan.

  </Accordion>
</AccordionGroup>

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                       | Yang perlu diatur                                          |
| -------------------------------------------- | ---------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas pada @mentions | `groups: { "*": { requireMention: true } }`                |
| Nonaktifkan semua balasan grup               | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                          | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"` )   |
| Hanya Anda yang dapat memicu di grup         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (ruang/channel menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesinya sendiri.
- Chat langsung menggunakan sesi utama (atau per pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (agen tunggal)

Ya — ini bekerja dengan baik jika lalu lintas "pribadi" Anda adalah **DM** dan lalu lintas "publik" Anda adalah **grup**.

Alasannya: dalam mode agen tunggal, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sedangkan grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap di host. Docker adalah backend bawaan jika Anda tidak memilih salah satu.

Ini memberi Anda satu "otak" agen (workspace + memori bersama), tetapi dua postur eksekusi:

- **DM**: alat penuh (host)
- **Grup**: sandbox + alat terbatas

<Note>
Jika Anda memerlukan workspace/persona yang benar-benar terpisah ("pribadi" dan "publik" tidak boleh pernah bercampur), gunakan agen kedua + binding. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
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
  <Tab title="Groups see only an allowlisted folder">
    Ingin "grup hanya dapat melihat folder X" alih-alih "tanpa akses host"? Pertahankan `workspaceAccess: "none"` dan mount hanya path dalam daftar izin ke dalam sandbox:

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

- Kunci konfigurasi dan bawaan: [Konfigurasi Gateway](/id/gateway/config-agents#agentsdefaultssandbox)
- Men-debug mengapa sebuah alat diblokir: [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail bind mount: [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts)

## Label tampilan

- Label UI menggunakan `displayName` jika tersedia, diformat sebagai `<channel>:<token>`.
- `#room` dicadangkan untuk ruang/channel; chat grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`).

## Kebijakan grup

Kontrol cara pesan grup/ruang ditangani per channel:

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
| `"open"`      | Grup melewati daftar izin; gerbang mention tetap berlaku.    |
| `"disabled"`  | Blokir semua pesan grup sepenuhnya.                          |
| `"allowlist"` | Hanya izinkan grup/ruang yang cocok dengan daftar izin yang dikonfigurasi. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` terpisah dari gerbang mention (yang memerlukan @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
    - Signal: `groupAllowFrom` dapat mencocokkan id grup Signal masuk atau telepon/UUID pengirim.
    - Persetujuan pemasangan DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit pada daftar izin grup.
    - Discord: daftar izin menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: daftar izin menggunakan `channels.slack.channels`.
    - Matrix: daftar izin menggunakan `channels.matrix.groups`. Utamakan ID ruang atau alias; pencarian nama ruang yang sudah diikuti bersifat upaya terbaik, dan nama yang tidak terselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; daftar izin `users` per ruang juga didukung.
    - DM grup dikontrol secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Daftar izin Telegram dapat mencocokkan ID pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau nama pengguna (`"@alice"` atau `"alice"`); prefiks tidak peka huruf besar/kecil.
    - Bawaannya adalah `groupPolicy: "allowlist"`; jika daftar izin grup Anda kosong, pesan grup diblokir.
    - Keamanan runtime: saat blok penyedia sepenuhnya hilang (`channels.<provider>` tidak ada), kebijakan grup kembali ke mode gagal-tertutup (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

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
  <Step title="Pembatasan penyebutan">
    Pembatasan penyebutan (`requireMention`, `/activation`).
  </Step>
</Steps>

## Pembatasan penyebutan (bawaan)

Pesan grup memerlukan penyebutan kecuali ditimpa per grup. Nilai bawaan berada per subsistem di bawah `*.groups."*"`.

Membalas pesan bot dihitung sebagai penyebutan implisit saat channel mendukung metadata balasan. Mengutip pesan bot juga dapat dihitung sebagai penyebutan implisit pada channel yang mengekspos metadata kutipan. Kasus bawaan saat ini mencakup Telegram, WhatsApp, Slack, Discord, Microsoft Teams, dan ZaloUser.

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
  <Accordion title="Catatan pembatasan penyebutan">
    - `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar-kecil; pola yang tidak valid dan bentuk pengulangan bertingkat yang tidak aman diabaikan.
    - Permukaan yang menyediakan penyebutan eksplisit tetap lolos; pola adalah fallback.
    - Penimpaan per agen: `agents.list[].groupChat.mentionPatterns` (berguna saat beberapa agen berbagi grup).
    - Pembatasan penyebutan hanya diberlakukan saat deteksi penyebutan memungkinkan (penyebutan native atau `mentionPatterns` dikonfigurasi).
    - Memasukkan grup atau pengirim ke daftar izin tidak menonaktifkan pembatasan penyebutan; atur `requireMention` grup tersebut ke `false` saat semua pesan harus memicu.
    - Konteks prompt chat grup membawa instruksi balasan senyap yang sudah diselesaikan pada setiap giliran; file workspace tidak boleh menduplikasi mekanisme `NO_REPLY`.
    - Grup yang mengizinkan balasan senyap memperlakukan giliran model yang kosong bersih atau hanya berisi penalaran sebagai senyap, setara dengan `NO_REPLY`. Chat langsung melakukan hal yang sama hanya saat balasan senyap langsung diizinkan secara eksplisit; jika tidak, balasan kosong tetap menjadi giliran agen yang gagal.
    - Default Discord berada di `channels.discord.guilds."*"` (dapat ditimpa per guild/channel).
    - Konteks riwayat grup dibungkus secara seragam di seluruh channel dan **hanya tertunda** (pesan yang dilewati karena pembatasan penyebutan); gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk penimpaan. Atur `0` untuk menonaktifkan.

  </Accordion>
</AccordionGroup>

## Pembatasan alat grup/channel (opsional)

Beberapa konfigurasi channel mendukung pembatasan alat mana yang tersedia **di dalam grup/ruang/channel tertentu**.

- `tools`: izinkan/tolak alat untuk seluruh grup.
- `toolsBySender`: penimpaan per pengirim dalam grup. Gunakan prefiks kunci eksplisit: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`. Kunci lama tanpa prefiks masih diterima dan dicocokkan sebagai `id:` saja.

Urutan resolusi (yang paling spesifik menang):

<Steps>
  <Step title="toolsBySender grup">
    Kecocokan `toolsBySender` grup/channel.
  </Step>
  <Step title="tools grup">
    `tools` grup/channel.
  </Step>
  <Step title="toolsBySender default">
    Kecocokan `toolsBySender` default (`"*"`).
  </Step>
  <Step title="tools default">
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
Pembatasan alat grup/channel diterapkan selain kebijakan alat global/agen (tolak tetap menang). Beberapa channel menggunakan nesting berbeda untuk ruang/channel (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Daftar izin grup

Saat `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kuncinya bertindak sebagai daftar izin grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku penyebutan bawaan.

<Warning>
Kebingungan umum: persetujuan pemasangan DM tidak sama dengan otorisasi grup. Untuk channel yang mendukung pemasangan DM, penyimpanan pemasangan hanya membuka kunci DM. Perintah grup tetap memerlukan otorisasi pengirim grup eksplisit dari daftar izin konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi terdokumentasi untuk channel tersebut.
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
  <Tab title="Izinkan semua grup tetapi wajibkan penyebutan">
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

Pemilik ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 milik bot sendiri saat tidak diatur). Kirim perintah sebagai pesan mandiri. Permukaan lain saat ini mengabaikan `/activation`.

## Bidang konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil pembatasan penyebutan)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Catatan khusus channel:

- BlueBubbles dapat secara opsional memperkaya peserta grup macOS tanpa nama dari basis data Contacts lokal sebelum mengisi `GroupMembers`. Ini nonaktif secara default dan hanya berjalan setelah pembatasan grup normal lolos.

Prompt sistem agen menyertakan pengantar grup pada giliran pertama sesi grup baru. Ini mengingatkan model untuk merespons seperti manusia, menghindari tabel Markdown, meminimalkan baris kosong dan mengikuti spasi chat normal, serta menghindari pengetikan urutan literal `\n`. Nama grup dan label peserta yang bersumber dari channel dirender sebagai metadata tidak tepercaya yang berpagar, bukan instruksi sistem inline.

## Kekhususan iMessage

- Lebih pilih `chat_id:<id>` saat merutekan atau memasukkan ke daftar izin.
- Cantumkan chat: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## Prompt sistem WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan prompt sistem WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, serta semantik penimpaan akun.

## Kekhususan WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan penyebutan).

## Terkait

- [Grup siaran](/id/channels/broadcast-groups)
- [Perutean channel](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Pemasangan](/id/channels/pairing)
