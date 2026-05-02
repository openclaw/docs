---
read_when:
    - Mengubah perilaku obrolan grup atau pembatasan penyebutan
sidebarTitle: Groups
summary: Perilaku obrolan grup di berbagai permukaan (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-05-02T09:12:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cc33dbbcf5504cae5caa003b7427d99f5c1a2d7c850dedd5d1f58a2fe44fa04
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw memperlakukan obrolan grup secara konsisten di berbagai permukaan: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar pemula (2 menit)

OpenClaw "hidup" di akun perpesanan Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah. Jika **Anda** berada di sebuah grup, OpenClaw dapat melihat grup tersebut dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan mention kecuali Anda secara eksplisit menonaktifkan pembatasan mention.
- Balasan final normal di grup/channel bersifat privat secara default. Output ruang yang terlihat menggunakan alat `message`.

Terjemahannya: pengirim dalam daftar izin dapat memicu OpenClaw dengan me-mention-nya.

<Note>
**TL;DR**

- **Akses DM** dikontrol oleh `*.allowFrom`.
- **Akses grup** dikontrol oleh `*.groupPolicy` + daftar izin (`*.groups`, `*.groupAllowFrom`).
- **Pemicu balasan** dikontrol oleh pembatasan mention (`requireMention`, `/activation`).

</Note>

Alur cepat (yang terjadi pada pesan grup):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Balasan yang terlihat

Untuk ruang grup/channel, default OpenClaw adalah `messages.groupChat.visibleReplies: "message_tool"`.
Artinya agen tetap memproses giliran tersebut dan dapat memperbarui status memori/sesi, tetapi jawaban final normalnya tidak otomatis diposting kembali ke ruang. Untuk berbicara secara terlihat, agen menggunakan `message(action=send)`.

Jika alat pesan tidak tersedia di bawah kebijakan alat aktif, OpenClaw akan
kembali ke balasan terlihat otomatis alih-alih menekan respons secara diam-diam.
`openclaw doctor` memperingatkan tentang ketidakcocokan ini.

Untuk obrolan langsung dan giliran sumber lainnya, gunakan `messages.visibleReplies: "message_tool"` untuk menerapkan perilaku balasan terlihat yang hanya melalui alat secara global. Harness juga dapat memilih ini sebagai default saat tidak disetel; harness Codex melakukan ini untuk obrolan langsung mode Codex. `messages.groupChat.visibleReplies` tetap menjadi override yang lebih spesifik untuk ruang grup/channel.

Ini menggantikan pola lama yang memaksa model menjawab `NO_REPLY` untuk sebagian besar giliran mode mengamati. Dalam mode hanya alat, tidak melakukan apa pun yang terlihat berarti tidak memanggil alat pesan.

Indikator mengetik tetap dikirim saat agen bekerja dalam mode hanya alat. Mode mengetik grup default ditingkatkan dari "message" menjadi "instant" untuk giliran ini karena mungkin tidak pernah ada teks pesan asisten normal sebelum agen memutuskan apakah akan memanggil alat pesan. Konfigurasi mode mengetik eksplisit tetap diutamakan.

Untuk memulihkan balasan final otomatis lama untuk ruang grup/channel:

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

Untuk mewajibkan output terlihat melewati alat pesan untuk setiap obrolan sumber:

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

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, daftar izin khusus channel).
- **Visibilitas konteks**: konteks tambahan apa yang disuntikkan ke model (teks balasan, kutipan, riwayat thread, metadata yang diteruskan).

Secara default, OpenClaw memprioritaskan perilaku obrolan normal dan mempertahankan konteks sebagian besar sebagaimana diterima. Ini berarti daftar izin terutama menentukan siapa yang dapat memicu tindakan, bukan batas redaksi universal untuk setiap kutipan atau cuplikan historis.

<AccordionGroup>
  <Accordion title="Perilaku saat ini khusus untuk setiap channel">
    - Beberapa channel sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan di jalur tertentu (misalnya penyemaian thread Slack, pencarian balasan/thread Matrix).
    - Channel lain masih meneruskan konteks kutipan/balasan/terusan sebagaimana diterima.

  </Accordion>
  <Accordion title="Arah penguatan (direncanakan)">
    - `contextVisibility: "all"` (default) mempertahankan perilaku saat ini sebagaimana diterima.
    - `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim dalam daftar izin.
    - `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan eksplisit.

    Sampai model penguatan ini diimplementasikan secara konsisten di seluruh channel, perkirakan adanya perbedaan berdasarkan permukaan.

  </Accordion>
</AccordionGroup>

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                       | Yang perlu disetel                                        |
| -------------------------------------------- | ---------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas pada @mentions | `groups: { "*": { requireMention: true } }`                |
| Nonaktifkan semua balasan grup               | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                          | `groups: { "<group-id>": { ... } }` (tanpa key `"*"` )     |
| Hanya Anda yang dapat memicu di grup         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Gunakan kembali satu set pengirim tepercaya di berbagai channel | `groupAllowFrom: ["accessGroup:operators"]`                |

Untuk daftar izin pengirim yang dapat digunakan kembali, lihat [Grup akses](/id/channels/access-groups).

## Key sesi

- Sesi grup menggunakan key sesi `agent:<agentId>:<channel>:group:<id>` (ruang/channel menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesinya sendiri.
- Obrolan langsung menggunakan sesi utama (atau per pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (satu agen)

Ya — ini berfungsi baik jika lalu lintas "pribadi" Anda adalah **DM** dan lalu lintas "publik" Anda adalah **grup**.

Alasannya: dalam mode satu agen, DM biasanya masuk ke key sesi **utama** (`agent:main:main`), sementara grup selalu menggunakan key sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap di host. Docker adalah backend default jika Anda tidak memilih salah satu.

Ini memberi Anda satu "otak" agen (workspace + memori bersama), tetapi dua postur eksekusi:

- **DM**: alat penuh (host)
- **Grup**: sandbox + alat terbatas

<Note>
Jika Anda membutuhkan workspace/persona yang benar-benar terpisah ("pribadi" dan "publik" tidak boleh pernah tercampur), gunakan agen kedua + binding. Lihat [Routing Multi-Agen](/id/concepts/multi-agent).
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
  <Tab title="Grup hanya melihat folder dalam daftar izin">
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

- Key konfigurasi dan default: [Konfigurasi Gateway](/id/gateway/config-agents#agentsdefaultssandbox)
- Men-debug mengapa suatu alat diblokir: [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail bind mount: [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts)

## Label tampilan

- Label UI menggunakan `displayName` jika tersedia, diformat sebagai `<channel>:<token>`.
- `#room` dicadangkan untuk ruang/channel; obrolan grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`).

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

| Kebijakan     | Perilaku                                                    |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grup melewati daftar izin; pembatasan mention tetap berlaku. |
| `"disabled"`  | Blokir semua pesan grup sepenuhnya.                          |
| `"allowlist"` | Hanya izinkan grup/ruang yang cocok dengan daftar izin yang dikonfigurasi. |

<AccordionGroup>
  <Accordion title="Catatan per channel">
    - `groupPolicy` terpisah dari pembatasan mention (yang memerlukan @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
    - Signal: `groupAllowFrom` dapat cocok dengan id grup Signal masuk atau telepon/UUID pengirim.
    - Persetujuan pemasangan DM (entri store `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit pada daftar izin grup.
    - Discord: daftar izin menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: daftar izin menggunakan `channels.slack.channels`.
    - Matrix: daftar izin menggunakan `channels.matrix.groups`. Lebih disarankan memakai ID ruang atau alias; pencarian nama ruang yang sudah bergabung bersifat upaya terbaik, dan nama yang tidak terselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; daftar izin `users` per ruang juga didukung.
    - DM grup dikontrol secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Daftar izin Telegram dapat cocok dengan ID pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau username (`"@alice"` atau `"alice"`); prefiks tidak peka huruf besar/kecil.
    - Default adalah `groupPolicy: "allowlist"`; jika daftar izin grup Anda kosong, pesan grup diblokir.
    - Keamanan runtime: ketika blok provider sepenuhnya tidak ada (`channels.<provider>` tidak ada), kebijakan grup kembali ke mode gagal-tertutup (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Model mental cepat (urutan evaluasi untuk pesan grup):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (terbuka/dinonaktifkan/daftar izin).
  </Step>
  <Step title="Daftar izin grup">
    Daftar izin grup (`*.groups`, `*.groupAllowFrom`, daftar izin khusus channel).
  </Step>
  <Step title="Pembatasan mention">
    Pembatasan mention (`requireMention`, `/activation`).
  </Step>
</Steps>

## Pembatasan mention (default)

Pesan grup memerlukan mention kecuali diganti per grup. Default berada per subsistem di bawah `*.groups."*"`.

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
  <Accordion title="Catatan pembatasan mention">
    - `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar/kecil; pola tidak valid dan bentuk pengulangan bersarang yang tidak aman diabaikan.
    - Permukaan yang menyediakan mention eksplisit tetap lolos; pola adalah cadangan.
    - Override per agen: `agents.list[].groupChat.mentionPatterns` (berguna ketika beberapa agen berbagi satu grup).
    - Pembatasan mention hanya diberlakukan ketika deteksi mention dimungkinkan (mention native atau `mentionPatterns` dikonfigurasi).
    - Memasukkan grup atau pengirim ke daftar izin tidak menonaktifkan pembatasan mention; atur `requireMention` grup tersebut ke `false` ketika semua pesan harus memicu respons.
    - Konteks prompt chat grup membawa instruksi balasan senyap yang terselesaikan di setiap giliran; file workspace tidak boleh menduplikasi mekanisme `NO_REPLY`.
    - Grup yang mengizinkan balasan senyap memperlakukan giliran model yang kosong bersih atau hanya berisi penalaran sebagai senyap, setara dengan `NO_REPLY`. Chat langsung melakukan hal yang sama hanya ketika balasan senyap langsung diizinkan secara eksplisit; jika tidak, balasan kosong tetap menjadi giliran agen yang gagal.
    - Default Discord berada di `channels.discord.guilds."*"` (dapat di-override per guild/channel).
    - Konteks riwayat grup dibungkus seragam di semua channel dan **hanya pending** (pesan yang dilewati karena pembatasan mention); gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk override. Atur `0` untuk menonaktifkan.

  </Accordion>
</AccordionGroup>

## Pembatasan alat grup/channel (opsional)

Beberapa konfigurasi channel mendukung pembatasan alat mana yang tersedia **di dalam grup/ruang/channel tertentu**.

- `tools`: mengizinkan/menolak alat untuk seluruh grup.
- `toolsBySender`: override per pengirim di dalam grup. Gunakan prefiks kunci eksplisit: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`. Kunci lama tanpa prefiks masih diterima dan hanya dicocokkan sebagai `id:`.

Urutan resolusi (yang paling spesifik menang):

<Steps>
  <Step title="toolsBySender grup">
    Kecocokan `toolsBySender` grup/channel.
  </Step>
  <Step title="Alat grup">
    `tools` grup/channel.
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
Pembatasan alat grup/channel diterapkan selain kebijakan alat global/agen (penolakan tetap menang). Beberapa channel menggunakan penyarangan yang berbeda untuk ruang/channel (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Daftar izin grup

Ketika `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kuncinya bertindak sebagai daftar izin grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku mention default.

<Warning>
Kebingungan umum: persetujuan penyandingan DM tidak sama dengan otorisasi grup. Untuk channel yang mendukung penyandingan DM, penyimpanan penyandingan hanya membuka DM. Perintah grup tetap memerlukan otorisasi pengirim grup eksplisit dari daftar izin konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi terdokumentasi untuk channel tersebut.
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
  <Tab title="Pemicu khusus pemilik (WhatsApp)">
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

## Aktivasi (khusus pemilik)

Pemilik grup dapat mengaktifkan/menonaktifkan aktivasi per grup:

- `/activation mention`
- `/activation always`

Pemilik ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 milik bot sendiri jika tidak disetel). Kirim perintah sebagai pesan tersendiri. Permukaan lain saat ini mengabaikan `/activation`.

## Bidang konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil pembatasan mention)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Catatan khusus channel:

- BlueBubbles dapat secara opsional memperkaya peserta grup macOS yang tidak bernama dari basis data Kontak lokal sebelum mengisi `GroupMembers`. Ini nonaktif secara default dan hanya berjalan setelah pembatasan grup normal lolos.

Prompt sistem agen menyertakan pengantar grup pada giliran pertama sesi grup baru. Prompt ini mengingatkan model untuk merespons seperti manusia, menghindari tabel Markdown, meminimalkan baris kosong dan mengikuti spasi chat normal, serta menghindari pengetikan urutan literal `\n`. Nama grup dan label peserta yang bersumber dari channel dirender sebagai metadata tidak tepercaya berpagar, bukan instruksi sistem inline.

## Detail khusus iMessage

- Utamakan `chat_id:<id>` saat merutekan atau memasukkan ke daftar izin.
- Cantumkan chat: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## Prompt sistem WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan prompt sistem WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, serta semantik override akun.

## Detail khusus WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan mention).

## Terkait

- [Grup broadcast](/id/channels/broadcast-groups)
- [Perutean channel](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Penyandingan](/id/channels/pairing)
