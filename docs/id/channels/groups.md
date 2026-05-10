---
read_when:
    - Mengubah perilaku obrolan grup atau pembatasan berdasarkan sebutan
sidebarTitle: Groups
summary: Perilaku obrolan grup di berbagai platform (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-05-10T19:21:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a040df975829cd35f45577522ea2813fd98fd8babbb42663e502cedde088d89
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw memperlakukan chat grup secara konsisten di berbagai permukaan: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar pemula (2 menit)

OpenClaw "hidup" di akun pesan Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah. Jika **Anda** berada di sebuah grup, OpenClaw dapat melihat grup tersebut dan merespons di sana.

Perilaku bawaan:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan mention kecuali Anda secara eksplisit menonaktifkan gerbang mention.
- Balasan akhir normal di grup/channel bersifat privat secara bawaan. Keluaran room yang terlihat menggunakan tool `message`.

Artinya: pengirim yang masuk allowlist dapat memicu OpenClaw dengan me-mention-nya.

<Note>
**TL;DR**

- **Akses DM** dikontrol oleh `*.allowFrom`.
- **Akses grup** dikontrol oleh `*.groupPolicy` + allowlist (`*.groups`, `*.groupAllowFrom`).
- **Pemicu balasan** dikontrol oleh gerbang mention (`requireMention`, `/activation`).

</Note>

Alur cepat (yang terjadi pada pesan grup):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Balasan terlihat

Untuk room grup/channel, OpenClaw secara bawaan menggunakan `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` menulis nilai bawaan ini ke konfigurasi channel terkonfigurasi yang belum menyertakannya.
Artinya agent tetap memproses giliran dan dapat memperbarui status memori/sesi, tetapi jawaban akhir normalnya tidak otomatis diposting kembali ke room. Untuk berbicara secara terlihat, agent menggunakan `message(action=send)`.

Nilai bawaan ini bergantung pada model/runtime yang memanggil tool secara andal. Jika log menampilkan teks asisten tetapi `didSendViaMessagingTool: false`, model menjawab secara privat alih-alih memanggil tool message. Itu bukan kegagalan pengiriman Discord/Slack/Telegram. Gunakan model yang andal melakukan pemanggilan tool untuk sesi grup/channel, atau atur `messages.groupChat.visibleReplies: "automatic"` untuk memulihkan balasan akhir terlihat gaya lama.

Jika tool message tidak tersedia di bawah kebijakan tool aktif, OpenClaw kembali ke balasan terlihat otomatis alih-alih menyembunyikan respons secara diam-diam. `openclaw doctor` memperingatkan ketidakcocokan ini.

Untuk chat langsung dan giliran sumber lainnya, gunakan `messages.visibleReplies: "message_tool"` untuk menerapkan perilaku balasan terlihat khusus tool yang sama secara global. Harness juga dapat memilih ini sebagai nilai bawaan saat belum diatur; harness Codex melakukan ini untuk chat langsung mode Codex. `messages.groupChat.visibleReplies` tetap menjadi override yang lebih spesifik untuk room grup/channel.

Ini menggantikan pola lama yang memaksa model menjawab `NO_REPLY` untuk sebagian besar giliran mode lurk. Dalam mode khusus tool, tidak melakukan apa pun yang terlihat cukup berarti tidak memanggil tool message.

Indikator mengetik tetap dikirim saat agent bekerja dalam mode khusus tool. Mode mengetik grup bawaan ditingkatkan dari "message" menjadi "instant" untuk giliran ini karena mungkin tidak pernah ada teks pesan asisten normal sebelum agent memutuskan apakah akan memanggil tool message. Konfigurasi mode mengetik eksplisit tetap menang.

Untuk memulihkan balasan akhir otomatis gaya lama untuk room grup/channel:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway memuat ulang konfigurasi `messages` secara hot reload setelah file disimpan. Restart hanya diperlukan saat pemantauan file atau pemuatan ulang konfigurasi dinonaktifkan dalam deployment.

Untuk mengharuskan keluaran terlihat melalui tool message untuk setiap chat sumber:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Perintah slash native (Discord, Telegram, dan permukaan lain dengan dukungan perintah native) melewati `visibleReplies: "message_tool"` dan selalu membalas secara terlihat agar UI perintah native channel mendapatkan respons yang diharapkannya. Ini hanya berlaku untuk giliran perintah native yang tervalidasi; perintah `/...` yang diketik sebagai teks dan giliran chat biasa tetap mengikuti nilai bawaan grup yang dikonfigurasi.

## Visibilitas konteks dan allowlist

Dua kontrol berbeda terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agent (`groupPolicy`, `groups`, `groupAllowFrom`, allowlist khusus channel).
- **Visibilitas konteks**: konteks tambahan apa yang disuntikkan ke model (teks balasan, kutipan, riwayat thread, metadata terusan).

Secara bawaan, OpenClaw memprioritaskan perilaku chat normal dan mempertahankan konteks sebagian besar seperti yang diterima. Artinya allowlist terutama menentukan siapa yang dapat memicu tindakan, bukan batas redaksi universal untuk setiap kutipan atau cuplikan historis.

<AccordionGroup>
  <Accordion title="Perilaku saat ini bersifat khusus channel">
    - Beberapa channel sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan di jalur tertentu (misalnya penyemaian thread Slack, pencarian balasan/thread Matrix).
    - Channel lain masih meneruskan konteks kutipan/balasan/terusan seperti yang diterima.

  </Accordion>
  <Accordion title="Arah pengerasan (direncanakan)">
    - `contextVisibility: "all"` (bawaan) mempertahankan perilaku seperti diterima saat ini.
    - `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang masuk allowlist.
    - `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan eksplisit.

    Hingga model pengerasan ini diimplementasikan secara konsisten di seluruh channel, perkirakan adanya perbedaan per permukaan.

  </Accordion>
</AccordionGroup>

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                         | Yang harus diatur                                          |
| ---------------------------------------------- | ---------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas pada @mention | `groups: { "*": { requireMention: true } }`                |
| Nonaktifkan semua balasan grup                 | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                            | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"` )   |
| Hanya Anda yang dapat memicu di grup           | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Gunakan ulang satu set pengirim tepercaya di seluruh channel | `groupAllowFrom: ["accessGroup:operators"]`                |

Untuk allowlist pengirim yang dapat digunakan ulang, lihat [Grup akses](/id/channels/access-groups).

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (room/channel menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesinya sendiri.
- Chat langsung menggunakan sesi utama (atau per pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (satu agent)

Ya — ini bekerja baik jika traffic "pribadi" Anda adalah **DM** dan traffic "publik" Anda adalah **grup**.

Alasannya: dalam mode satu agent, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sementara grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap di host. Docker adalah backend bawaan jika Anda tidak memilih salah satu.

Ini memberi Anda satu "otak" agent (workspace + memori bersama), tetapi dua postur eksekusi:

- **DM**: tool penuh (host)
- **Grup**: sandbox + tool terbatas

<Note>
Jika Anda memerlukan workspace/persona yang benar-benar terpisah ("pribadi" dan "publik" tidak boleh pernah bercampur), gunakan agent kedua + binding. Lihat [Routing Multi-Agent](/id/concepts/multi-agent).
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
  <Tab title="Grup hanya melihat folder yang masuk allowlist">
    Ingin "grup hanya dapat melihat folder X" alih-alih "tanpa akses host"? Pertahankan `workspaceAccess: "none"` dan mount hanya path yang masuk allowlist ke dalam sandbox:

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

- Kunci konfigurasi dan nilai bawaan: [Konfigurasi Gateway](/id/gateway/config-agents#agentsdefaultssandbox)
- Debug alasan tool diblokir: [Sandbox vs Kebijakan Tool vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail bind mount: [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts)

## Label tampilan

- Label UI menggunakan `displayName` jika tersedia, diformat sebagai `<channel>:<token>`.
- `#room` dicadangkan untuk room/channel; chat grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`).

## Kebijakan grup

Kontrol cara pesan grup/room ditangani per channel:

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
| `"open"`      | Grup melewati allowlist; gerbang mention tetap berlaku.      |
| `"disabled"`  | Blokir semua pesan grup sepenuhnya.                          |
| `"allowlist"` | Hanya izinkan grup/room yang cocok dengan allowlist yang dikonfigurasi. |

<AccordionGroup>
  <Accordion title="Catatan per saluran">
    - `groupPolicy` terpisah dari pembatasan mention (yang memerlukan @mention).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
    - Signal: `groupAllowFrom` dapat mencocokkan id grup Signal masuk atau telepon/UUID pengirim.
    - Persetujuan pemasangan DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit ke daftar izin grup.
    - Discord: daftar izin menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: daftar izin menggunakan `channels.slack.channels`.
    - Matrix: daftar izin menggunakan `channels.matrix.groups`. Utamakan ID atau alias ruang; pencarian nama ruang yang telah diikuti bersifat best-effort, dan nama yang tidak terselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; daftar izin `users` per ruang juga didukung.
    - DM grup dikontrol secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Daftar izin Telegram dapat mencocokkan ID pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau nama pengguna (`"@alice"` atau `"alice"`); prefiks tidak peka huruf besar/kecil.
    - Defaultnya adalah `groupPolicy: "allowlist"`; jika daftar izin grup Anda kosong, pesan grup diblokir.
    - Keamanan runtime: ketika blok penyedia benar-benar tidak ada (`channels.<provider>` absen), kebijakan grup fallback ke mode fail-closed (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Model mental cepat (urutan evaluasi untuk pesan grup):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Daftar izin grup">
    Daftar izin grup (`*.groups`, `*.groupAllowFrom`, daftar izin khusus saluran).
  </Step>
  <Step title="Pembatasan mention">
    Pembatasan mention (`requireMention`, `/activation`).
  </Step>
</Steps>

## Pembatasan mention (default)

Pesan grup memerlukan mention kecuali ditimpa per grup. Default berada per subsistem di bawah `*.groups."*"`.

Membalas pesan bot dihitung sebagai mention implisit ketika saluran mendukung metadata balasan. Mengutip pesan bot juga dapat dihitung sebagai mention implisit pada saluran yang mengekspos metadata kutipan. Kasus bawaan saat ini mencakup Telegram, WhatsApp, Slack, Discord, Microsoft Teams, dan ZaloUser.

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
    - `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar/kecil; pola tidak valid dan bentuk pengulangan bertingkat yang tidak aman diabaikan.
    - Permukaan yang menyediakan mention eksplisit tetap lolos; pola adalah fallback.
    - Penimpaan per agen: `agents.list[].groupChat.mentionPatterns` (berguna ketika beberapa agen berbagi grup).
    - Pembatasan mention hanya diberlakukan ketika deteksi mention memungkinkan (mention native atau `mentionPatterns` dikonfigurasi).
    - Memasukkan grup atau pengirim ke daftar izin tidak menonaktifkan pembatasan mention; atur `requireMention` grup tersebut ke `false` ketika semua pesan harus memicu.
    - Konteks prompt obrolan grup membawa instruksi balasan senyap yang telah diselesaikan pada setiap giliran; file workspace tidak boleh menduplikasi mekanisme `NO_REPLY`.
    - Grup tempat balasan senyap diizinkan memperlakukan giliran model yang kosong bersih atau hanya berisi penalaran sebagai senyap, setara dengan `NO_REPLY`. Obrolan langsung melakukan hal yang sama hanya ketika balasan senyap langsung diizinkan secara eksplisit; jika tidak, balasan kosong tetap menjadi giliran agen yang gagal.
    - Default Discord berada di `channels.discord.guilds."*"` (dapat ditimpa per guild/saluran).
    - Konteks riwayat grup dibungkus secara seragam di seluruh saluran. Grup yang dibatasi mention mempertahankan pesan yang dilewati dan tertunda; grup yang selalu aktif juga dapat mempertahankan pesan ruang terbaru yang sudah diproses ketika saluran mendukungnya. Gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk penimpaan. Atur `0` untuk menonaktifkan.

  </Accordion>
</AccordionGroup>

## Pembatasan alat grup/saluran (opsional)

Beberapa konfigurasi saluran mendukung pembatasan alat yang tersedia **di dalam grup/ruang/saluran tertentu**.

- `tools`: izinkan/tolak alat untuk seluruh grup.
- `toolsBySender`: penimpaan per pengirim di dalam grup. Gunakan prefiks kunci eksplisit: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`. Kunci lama tanpa prefiks masih diterima dan dicocokkan sebagai `id:` saja.

Urutan resolusi (yang paling spesifik menang):

<Steps>
  <Step title="toolsBySender grup">
    Kecocokan `toolsBySender` grup/saluran.
  </Step>
  <Step title="tools grup">
    `tools` grup/saluran.
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
Pembatasan alat grup/saluran diterapkan selain kebijakan alat global/agen (penolakan tetap menang). Beberapa saluran menggunakan nesting yang berbeda untuk ruang/saluran (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Daftar izin grup

Ketika `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kuncinya bertindak sebagai daftar izin grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku mention default.

<Warning>
Kebingungan umum: persetujuan pemasangan DM tidak sama dengan otorisasi grup. Untuk saluran yang mendukung pemasangan DM, penyimpanan pemasangan hanya membuka kunci DM. Perintah grup tetap memerlukan otorisasi pengirim grup eksplisit dari daftar izin konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi yang didokumentasikan untuk saluran tersebut.
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

Pemilik grup dapat mengaktifkan atau menonaktifkan aktivasi per grup:

- `/activation mention`
- `/activation always`

Pemilik ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 milik bot sendiri ketika tidak diatur). Kirim perintah sebagai pesan mandiri. Permukaan lain saat ini mengabaikan `/activation`.

## Kolom konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil pembatasan mention)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Prompt sistem agen menyertakan intro grup pada giliran pertama sesi grup baru. Ini mengingatkan model untuk merespons seperti manusia, menghindari tabel Markdown, meminimalkan baris kosong dan mengikuti spasi obrolan normal, serta menghindari pengetikan urutan literal `\n`. Nama grup dan label peserta yang bersumber dari saluran dirender sebagai metadata tidak tepercaya berpagar, bukan instruksi sistem inline.

## Spesifik iMessage

- Utamakan `chat_id:<id>` saat merutekan atau memasukkan ke daftar izin.
- Daftar obrolan: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## Prompt sistem WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan prompt sistem WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, dan semantik penimpaan akun.

## Spesifik WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan mention).

## Terkait

- [Grup siaran](/id/channels/broadcast-groups)
- [Perutean saluran](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Pemasangan](/id/channels/pairing)
