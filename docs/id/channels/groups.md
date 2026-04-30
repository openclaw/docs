---
read_when:
    - Mengubah perilaku obrolan grup atau pembatasan penyebutan
sidebarTitle: Groups
summary: Perilaku obrolan grup di berbagai permukaan (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-04-30T09:33:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw memperlakukan obrolan grup secara konsisten di berbagai platform: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar pemula (2 menit)

OpenClaw "hidup" di akun perpesanan milik Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah. Jika **Anda** berada dalam sebuah grup, OpenClaw dapat melihat grup itu dan merespons di sana.

Perilaku bawaan:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan penyebutan kecuali Anda secara eksplisit menonaktifkan pembatasan penyebutan.
- Balasan akhir normal di grup/channel bersifat privat secara bawaan. Output ruang yang terlihat menggunakan alat `message`.

Artinya: pengirim yang ada di daftar izin dapat memicu OpenClaw dengan menyebutnya.

<Note>
**TL;DR**

- **Akses DM** dikendalikan oleh `*.allowFrom`.
- **Akses grup** dikendalikan oleh `*.groupPolicy` + daftar izin (`*.groups`, `*.groupAllowFrom`).
- **Pemicu balasan** dikendalikan oleh pembatasan penyebutan (`requireMention`, `/activation`).

</Note>

Alur cepat (yang terjadi pada pesan grup):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Balasan terlihat

Untuk ruang grup/channel, OpenClaw secara bawaan menggunakan `messages.groupChat.visibleReplies: "message_tool"`.
Artinya agen tetap memproses giliran tersebut dan dapat memperbarui status memori/sesi, tetapi jawaban akhir normalnya tidak otomatis diposting kembali ke ruang. Untuk berbicara secara terlihat, agen menggunakan `message(action=send)`.

Untuk obrolan langsung dan giliran dari sumber lainnya, gunakan `messages.visibleReplies: "message_tool"` untuk menerapkan perilaku balasan terlihat yang hanya melalui alat yang sama secara global. `messages.groupChat.visibleReplies` tetap menjadi override yang lebih spesifik untuk ruang grup/channel.

Ini menggantikan pola lama yang memaksa model menjawab `NO_REPLY` untuk sebagian besar giliran mode mengintai. Dalam mode hanya alat, tidak melakukan apa pun yang terlihat berarti tidak memanggil alat message.

Indikator pengetikan tetap dikirim saat agen bekerja dalam mode hanya alat. Mode pengetikan grup bawaan ditingkatkan dari "message" menjadi "instant" untuk giliran ini karena mungkin tidak pernah ada teks pesan asisten normal sebelum agen memutuskan apakah akan memanggil alat message. Konfigurasi mode pengetikan eksplisit tetap menang.

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

Untuk mewajibkan output terlihat melalui alat message untuk setiap obrolan sumber:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Perintah slash native (Discord, Telegram, dan platform lain dengan dukungan perintah native) melewati `visibleReplies: "message_tool"` dan selalu membalas secara terlihat agar UI perintah native channel mendapatkan respons yang diharapkan. Ini hanya berlaku untuk giliran perintah native yang tervalidasi; perintah `/...` yang diketik sebagai teks dan giliran obrolan biasa tetap mengikuti bawaan grup yang dikonfigurasi.

## Visibilitas konteks dan daftar izin

Dua kontrol berbeda terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, daftar izin khusus channel).
- **Visibilitas konteks**: konteks tambahan apa yang disuntikkan ke model (teks balasan, kutipan, riwayat utas, metadata terusan).

Secara bawaan, OpenClaw memprioritaskan perilaku obrolan normal dan sebagian besar mempertahankan konteks sebagaimana diterima. Artinya daftar izin terutama menentukan siapa yang dapat memicu tindakan, bukan batas redaksi universal untuk setiap cuplikan kutipan atau riwayat.

<AccordionGroup>
  <Accordion title="Perilaku saat ini khusus per channel">
    - Beberapa channel sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan pada jalur tertentu (misalnya penanaman utas Slack, pencarian balasan/utas Matrix).
    - Channel lain masih meneruskan konteks kutipan/balasan/terusan sebagaimana diterima.

  </Accordion>
  <Accordion title="Arah pengerasan (direncanakan)">
    - `contextVisibility: "all"` (bawaan) mempertahankan perilaku saat ini sebagaimana diterima.
    - `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang ada di daftar izin.
    - `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan eksplisit.

    Sampai model pengerasan ini diterapkan secara konsisten di seluruh channel, perkirakan adanya perbedaan antar-platform.

  </Accordion>
</AccordionGroup>

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                       | Yang perlu diatur                                         |
| -------------------------------------------- | ---------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas pada penyebutan @ | `groups: { "*": { requireMention: true } }`                |
| Nonaktifkan semua balasan grup               | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                          | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"` )   |
| Hanya Anda yang dapat memicu di grup         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (ruang/channel menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesinya sendiri.
- Obrolan langsung menggunakan sesi utama (atau per-pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (satu agen)

Ya — ini bekerja baik jika lalu lintas "pribadi" Anda adalah **DM** dan lalu lintas "publik" Anda adalah **grup**.

Alasannya: dalam mode satu agen, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sedangkan grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap berada di host. Docker adalah backend bawaan jika Anda tidak memilih salah satu.

Ini memberi Anda satu "otak" agen (workspace + memori bersama), tetapi dua postur eksekusi:

- **DM**: alat penuh (host)
- **Grup**: sandbox + alat terbatas

<Note>
Jika Anda membutuhkan workspace/persona yang benar-benar terpisah ("pribadi" dan "publik" tidak boleh pernah bercampur), gunakan agen kedua + binding. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM di host, grup dalam sandbox">
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
  <Tab title="Grup hanya melihat folder yang ada di daftar izin">
    Ingin "grup hanya dapat melihat folder X" alih-alih "tidak ada akses host"? Pertahankan `workspaceAccess: "none"` dan mount hanya path yang ada di daftar izin ke dalam sandbox:

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
- Debugging alasan alat diblokir: [Sandbox vs Kebijakan Alat vs Ditinggikan](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail mount bind: [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts)

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

| Kebijakan     | Perilaku                                                    |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grup melewati daftar izin; pembatasan penyebutan tetap berlaku. |
| `"disabled"`  | Blokir semua pesan grup sepenuhnya.                         |
| `"allowlist"` | Hanya izinkan grup/ruang yang cocok dengan daftar izin yang dikonfigurasi. |

<AccordionGroup>
  <Accordion title="Catatan per channel">
    - `groupPolicy` terpisah dari pembatasan penyebutan (yang memerlukan penyebutan @).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
    - Persetujuan pemasangan DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit ke daftar izin grup.
    - Discord: daftar izin menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: daftar izin menggunakan `channels.slack.channels`.
    - Matrix: daftar izin menggunakan `channels.matrix.groups`. Utamakan ID ruang atau alias; pencarian nama ruang yang telah bergabung bersifat upaya terbaik, dan nama yang tidak terselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; daftar izin `users` per ruang juga didukung.
    - DM grup dikendalikan secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Daftar izin Telegram dapat cocok dengan ID pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau nama pengguna (`"@alice"` atau `"alice"`); prefiks tidak peka huruf besar/kecil.
    - Bawaannya adalah `groupPolicy: "allowlist"`; jika daftar izin grup Anda kosong, pesan grup diblokir.
    - Keamanan runtime: ketika blok penyedia sepenuhnya tidak ada (`channels.<provider>` tidak ada), kebijakan grup jatuh kembali ke mode gagal-tertutup (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

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

Pesan grup memerlukan penyebutan kecuali dioverride per grup. Bawaan berada per subsistem di bawah `*.groups."*"`.

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
  <Accordion title="Catatan pembatasan mention">
    - `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar-kecil; pola yang tidak valid dan bentuk pengulangan bersarang yang tidak aman diabaikan.
    - Permukaan yang menyediakan mention eksplisit tetap lolos; pola adalah fallback.
    - Override per agen: `agents.list[].groupChat.mentionPatterns` (berguna saat beberapa agen berbagi satu grup).
    - Pembatasan mention hanya diberlakukan saat deteksi mention memungkinkan (mention native atau `mentionPatterns` dikonfigurasi).
    - Konteks prompt obrolan grup membawa instruksi balasan senyap yang sudah diresolusikan di setiap giliran; file workspace tidak boleh menduplikasi mekanisme `NO_REPLY`.
    - Grup yang mengizinkan balasan senyap memperlakukan giliran model yang kosong bersih atau hanya berisi reasoning sebagai senyap, setara dengan `NO_REPLY`. Obrolan langsung melakukan hal yang sama hanya saat balasan senyap langsung diizinkan secara eksplisit; jika tidak, balasan kosong tetap dianggap sebagai giliran agen yang gagal.
    - Default Discord berada di `channels.discord.guilds."*"` (dapat dioverride per guild/channel).
    - Konteks riwayat grup dibungkus secara seragam di seluruh channel dan **hanya pending** (pesan yang dilewati karena pembatasan mention); gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk override. Atur `0` untuk menonaktifkan.

  </Accordion>
</AccordionGroup>

## Pembatasan tool grup/channel (opsional)

Beberapa konfigurasi channel mendukung pembatasan tool yang tersedia **di dalam grup/ruang/channel tertentu**.

- `tools`: izinkan/tolak tool untuk seluruh grup.
- `toolsBySender`: override per pengirim di dalam grup. Gunakan prefiks kunci eksplisit: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`. Kunci lama tanpa prefiks masih diterima dan hanya dicocokkan sebagai `id:`.

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
  <Step title="tool default">
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
Pembatasan tool grup/channel diterapkan selain kebijakan tool global/agen (deny tetap menang). Beberapa channel menggunakan nesting yang berbeda untuk ruang/channel (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlist grup

Saat `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kunci-kuncinya bertindak sebagai allowlist grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku mention default.

<Warning>
Kebingungan umum: persetujuan pairing DM tidak sama dengan otorisasi grup. Untuk channel yang mendukung pairing DM, penyimpanan pairing hanya membuka kunci DM. Perintah grup tetap memerlukan otorisasi pengirim grup eksplisit dari allowlist konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi terdokumentasi untuk channel tersebut.
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
  <Tab title="Pemicu khusus owner (WhatsApp)">
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

Owner grup dapat mengaktifkan/menonaktifkan aktivasi per grup:

- `/activation mention`
- `/activation always`

Owner ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 milik bot sendiri saat tidak diatur). Kirim perintah sebagai pesan mandiri. Permukaan lain saat ini mengabaikan `/activation`.

## Kolom konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil pembatasan mention)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Catatan khusus channel:

- BlueBubbles dapat secara opsional memperkaya peserta grup macOS tanpa nama dari basis data Contacts lokal sebelum mengisi `GroupMembers`. Ini nonaktif secara default dan hanya berjalan setelah pembatasan grup normal lolos.

Prompt sistem agen menyertakan intro grup pada giliran pertama dari sesi grup baru. Ini mengingatkan model untuk merespons seperti manusia, menghindari tabel Markdown, meminimalkan baris kosong dan mengikuti spasi obrolan normal, serta menghindari pengetikan urutan literal `\n`. Nama grup dan label peserta yang bersumber dari channel dirender sebagai metadata tidak tepercaya berpagar, bukan instruksi sistem inline.

## Spesifik iMessage

- Pilih `chat_id:<id>` saat merutekan atau memasukkan ke allowlist.
- Daftar obrolan: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## Prompt sistem WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan prompt sistem WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, dan semantik override akun.

## Spesifik WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan mention).

## Terkait

- [Grup siaran](/id/channels/broadcast-groups)
- [Perutean channel](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Pairing](/id/channels/pairing)
