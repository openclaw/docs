---
read_when:
    - Mengubah perilaku obrolan grup atau pembatasan berdasarkan sebutan
    - Membatasi cakupan mentionPatterns ke percakapan grup tertentu
sidebarTitle: Groups
summary: Perilaku obrolan grup di berbagai platform (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-07-19T04:48:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f493f5737c147c097c666f1f13fb612232be6dc1ace51e910d437b02e960ec52
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw menerapkan aturan grup yang sama di seluruh kanal yang mendukung grup, termasuk Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, dan Zalo.

Untuk ruang yang selalu aktif dan seharusnya menyediakan konteks secara senyap kecuali agen secara eksplisit mengirim pesan yang terlihat, lihat [Peristiwa ruang ambien](/id/channels/ambient-room-events).

## Pengantar untuk pemula (2 menit)

OpenClaw "berada" di akun perpesanan Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah: jika **Anda** berada dalam suatu grup, OpenClaw dapat melihat grup tersebut dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`); pengirim grup diblokir hingga dimasukkan ke daftar yang diizinkan.
- Balasan memerlukan penyebutan kecuali Anda menonaktifkan pembatasan penyebutan untuk suatu grup.
- Teks balasan akhir diposting ke ruang secara otomatis (`visibleReplies: "automatic"`).

Artinya: pengirim yang tercantum dalam daftar yang diizinkan dapat memicu OpenClaw dengan menyebutnya.

<Note>
**Ringkasnya**

- **Akses DM** dikendalikan oleh `*.allowFrom`.
- **Akses grup** dikendalikan oleh `*.groupPolicy` + daftar yang diizinkan (`*.groups`, `*.groupAllowFrom`).
- **Pemicu balasan** dikendalikan oleh pembatasan penyebutan (`requireMention`, `/activation`).

</Note>

Alur singkat (yang terjadi pada pesan grup):

```text
groupPolicy? disabled -> abaikan
groupPolicy? allowlist -> grup diizinkan? tidak -> abaikan
requireMention? ya -> disebut? tidak -> simpan hanya sebagai konteks
penyebutan/balasan/perintah/DM -> permintaan pengguna
percakapan grup yang selalu aktif -> permintaan pengguna, atau peristiwa ruang jika dikonfigurasi
```

## Balasan yang terlihat

Untuk permintaan grup/kanal normal, OpenClaw menggunakan `messages.groupChat.visibleReplies: "automatic"` secara default: teks akhir asisten diposting ke ruang sebagai balasan yang terlihat.

Gunakan `messages.groupChat.visibleReplies: "message_tool"` jika ruang bersama seharusnya mengizinkan agen memutuskan kapan akan berbicara dengan memanggil `message(action=send)`. Cara ini paling cocok dengan model yang andal dalam menggunakan alat (misalnya GPT-5.6 Sol). Jika model tidak menggunakan alat tersebut dan mengembalikan teks akhir yang substantif, OpenClaw menyimpan teks itu secara privat alih-alih mempostingnya ke ruang.

Gunakan `"automatic"` untuk model atau runtime yang tidak dapat mengikuti pengiriman khusus alat secara andal: teks akhir normal diposting langsung ke ruang, dan agen tetap dapat memanggil `message(action=send)` untuk berkas, gambar, atau lampiran lain yang tidak dapat disertakan bersama teks akhir.

Jika alat pesan tidak tersedia berdasarkan kebijakan alat yang aktif, OpenClaw beralih ke balasan terlihat otomatis alih-alih menyembunyikan respons secara diam-diam. `openclaw doctor` memperingatkan tentang ketidakcocokan ini.

Untuk percakapan langsung dan peristiwa sumber lainnya, `messages.visibleReplies: "message_tool"` menerapkan perilaku khusus alat yang sama secara global; `messages.groupChat.visibleReplies` tetap menjadi penggantian yang lebih spesifik untuk ruang grup/kanal. Giliran langsung WebChat internal secara default menggunakan pengiriman balasan akhir otomatis agar Pi dan Codex menerima kontrak balasan terlihat yang sama.

Mode khusus alat menggantikan pola lama yang memaksa model menjawab `NO_REPLY` untuk sebagian besar giliran mode mengamati secara pasif. Dalam mode khusus alat, prompt tidak menentukan kontrak `NO_REPLY`; tidak melakukan apa pun yang terlihat cukup berarti tidak memanggil alat pesan.

Binding percakapan milik plugin merupakan pengecualian. Setelah plugin mengikat sebuah utas dan mengambil alih giliran masuk, balasan yang dikembalikan plugin menjadi respons binding yang terlihat; balasan tersebut tidak memerlukan `message(action=send)`. Balasan itu merupakan keluaran runtime plugin, bukan teks akhir model yang privat.

Indikator pengetikan tetap dikirim untuk permintaan grup langsung. Peristiwa ruang ambien yang selalu aktif, jika diaktifkan, tetap ketat dan senyap kecuali agen memanggil alat pesan.

Sesi menyembunyikan ringkasan alat/progres yang panjang secara default. Gunakan `/verbose on` (atau `/verbose full`) untuk menampilkannya bagi sesi saat ini ketika melakukan debug, dan `/verbose off` untuk kembali ke perilaku yang hanya menampilkan balasan akhir. Status panjang berlaku per sesi dan bekerja dengan cara yang sama dalam percakapan langsung, grup, kanal, dan topik forum.

Untuk mengirim percakapan grup yang selalu aktif dan tanpa penyebutan sebagai konteks ruang yang senyap, bukan sebagai permintaan pengguna, gunakan [Peristiwa ruang ambien](/id/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Default-nya adalah `unmentionedInbound: "user_request"`. Pesan dengan penyebutan, perintah, permintaan pembatalan, dan DM tetap menjadi permintaan pengguna.

Untuk mewajibkan keluaran yang terlihat melewati alat pesan bagi permintaan grup/kanal:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Untuk mewajibkannya bagi setiap percakapan sumber:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Gateway menerapkan perubahan konfigurasi `messages` tanpa perlu dimulai ulang setelah berkas disimpan. Mulai ulang hanya jika pemuatan ulang konfigurasi dinonaktifkan (`gateway.reload.mode: "off"`).

Giliran perintah melewati `visibleReplies: "message_tool"` dan selalu membalas secara terlihat: baik perintah garis miring native (Discord, Telegram, dan permukaan lain dengan dukungan perintah native) maupun perintah teks `/...` yang diotorisasi akan memposting responsnya ke percakapan sumber. Giliran teks `/...` yang tidak diotorisasi dalam grup tetap menggunakan mode khusus alat pesan; giliran percakapan biasa mengikuti default yang dikonfigurasi.

## Visibilitas konteks dan daftar yang diizinkan

Dua kontrol berbeda berperan dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, daftar yang diizinkan khusus kanal).
- **Visibilitas konteks**: konteks tambahan apa yang dimasukkan ke model (teks balasan/kutipan, riwayat utas, metadata penerusan).

Secara default, OpenClaw mempertahankan konteks sebagaimana diterima: daftar yang diizinkan menentukan siapa yang dapat memicu tindakan, bukan cuplikan kutipan atau riwayat apa yang dilihat model. Untuk turut memfilter konteks tambahan, atur `contextVisibility`:

| Mode                | Perilaku                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (default)   | Pertahankan konteks tambahan sebagaimana diterima.                                           |
| `"allowlist"`       | Hanya masukkan konteks riwayat/utas/kutipan/penerusan dari pengirim dalam daftar yang diizinkan.     |
| `"allowlist_quote"` | `allowlist`, serta pertahankan pesan yang dikutip atau dibalas secara eksplisit dari pengirim mana pun. |

Atur per kanal (`channels.<channel>.contextVisibility`), per akun (`channels.<channel>.accounts.<accountId>.contextVisibility`), atau secara global (`channels.defaults.contextVisibility`). Kanal yang mengambil konteks tambahan (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) menerapkan kebijakan tersebut saat membangun konteks masuk; kombinasi kebijakan yang tidak dikenal akan gagal secara tertutup dan menghilangkan konteks.

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                         | Pengaturan                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Izinkan semua grup, tetapi hanya balas saat @disebut | `groups: { "*": { requireMention: true } }`                |
| Nonaktifkan semua balasan grup                    | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                         | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"`)         |
| Hanya Anda yang dapat memicu dalam grup               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Gunakan kembali satu kumpulan pengirim tepercaya di seluruh kanal | `groupAllowFrom: ["accessGroup:operators"]`                |

Untuk daftar pengirim yang diizinkan dan dapat digunakan kembali, lihat [Grup akses](/id/channels/access-groups).

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (ruang/kanal menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesinya sendiri.
- Percakapan langsung menggunakan sesi utama (atau sesi per pengirim jika `session.dmScope` dikonfigurasi).
- Heartbeat berjalan dalam sesi heartbeat yang dikonfigurasi (default: sesi utama agen); sesi grup tidak menjalankan heartbeat-nya sendiri.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (satu agen)

Ya — ini bekerja dengan baik jika lalu lintas "pribadi" Anda berupa **DM** dan lalu lintas "publik" Anda berupa **grup**.

Alasannya: dalam mode satu agen, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sedangkan grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandbox dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi, sedangkan sesi DM utama Anda tetap berjalan pada host. Docker adalah backend default jika Anda tidak memilih backend lain.

Dengan demikian, Anda memiliki satu "otak" agen (ruang kerja + memori bersama), tetapi dua pola eksekusi:

- **DM**: alat lengkap (host)
- **Grup**: sandbox + alat terbatas

<Note>
Jika Anda memerlukan ruang kerja/persona yang benar-benar terpisah ("pribadi" dan "publik" tidak boleh pernah bercampur), gunakan agen kedua + binding. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM di host, grup dalam sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // grup/kanal bersifat non-utama -> berada dalam sandbox
            scope: "session", // isolasi terkuat (satu kontainer per grup/kanal)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Jika allow tidak kosong, semua yang lain diblokir (deny tetap diutamakan).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Grup hanya melihat folder dalam daftar yang diizinkan">
    Ingin "grup hanya dapat melihat folder X", bukan "tidak ada akses host"? Pertahankan `workspaceAccess: "none"` dan pasang hanya jalur dalam daftar yang diizinkan ke dalam sandbox:

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
- Men-debug alasan alat diblokir: [Sandbox vs Kebijakan Alat vs Elevated](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail bind mount: [Sandbox](/id/gateway/sandboxing#custom-bind-mounts)

## Label tampilan

- Label UI menggunakan `displayName` jika tersedia, dengan format `<channel>:<token>`.
- `#room` dicadangkan untuk ruang/kanal; percakapan grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`). Id buram yang sangat panjang dipersingkat menjadi token stabil agar id rute lengkap tidak terekspos di UI.

## Kebijakan grup

Kendalikan cara pesan grup/ruang ditangani per kanal:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // id pengguna Telegram numerik (penyiapan menguraikan @username)
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
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
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

| Kebijakan        | Perilaku                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Grup melewati daftar yang diizinkan; pembatasan berdasarkan penyebutan tetap berlaku.      |
| `"disabled"`  | Blokir seluruh pesan grup sepenuhnya.                           |
| `"allowlist"` | Hanya izinkan grup/ruang yang cocok dengan daftar yang diizinkan dalam konfigurasi. |

<AccordionGroup>
  <Accordion title="Catatan per kanal">
    - `groupPolicy` terpisah dari pembatasan berdasarkan penyebutan (yang mewajibkan @penyebutan).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (cadangan: `allowFrom` eksplisit).
    - Signal: `groupAllowFrom` dapat mencocokkan id grup Signal masuk atau nomor telepon/UUID pengirim.
    - Persetujuan pemasangan DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap ditentukan secara eksplisit oleh daftar grup yang diizinkan.
    - Discord: daftar yang diizinkan menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: daftar yang diizinkan menggunakan `channels.slack.channels`.
    - Matrix: daftar yang diizinkan menggunakan `channels.matrix.groups`. Gunakan ID ruang (`!room:server`) atau alias (`#alias:server`); kunci nama ruang hanya cocok dengan `channels.matrix.dangerouslyAllowNameMatching: true`, dan entri yang tidak dapat diuraikan akan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; daftar yang diizinkan per ruang melalui `users` juga didukung.
    - DM grup dikendalikan secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: daftar pengirim yang diizinkan hanya menerima ID pengguna numerik (`"123456789"`; awalan `telegram:`/`tg:` dihapus tanpa membedakan huruf besar-kecil). Entri `@username` tidak cocok saat runtime dan mencatat peringatan; penyiapan menguraikan `@username` menjadi ID. ID obrolan negatif ditempatkan di bawah `channels.telegram.groups`, bukan dalam daftar pengirim yang diizinkan.
    - Nilai default adalah `groupPolicy: "allowlist"`; jika daftar grup yang diizinkan kosong, pesan grup akan diblokir.
    - Keamanan runtime: ketika blok penyedia sama sekali tidak ada (`channels.<provider>` tidak ada), kebijakan grup akan gagal secara tertutup ke `allowlist`, alih-alih mewarisi `channels.defaults.groupPolicy`, dan Gateway mencatat penggunaan cadangan tersebut satu kali per akun.

  </Accordion>
</AccordionGroup>

Model mental singkat (urutan evaluasi untuk pesan grup):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (terbuka/dinonaktifkan/daftar yang diizinkan).
  </Step>
  <Step title="Daftar grup yang diizinkan">
    Daftar grup yang diizinkan (`*.groups`, `*.groupAllowFrom`, daftar yang diizinkan khusus kanal).
  </Step>
  <Step title="Pembatasan berdasarkan penyebutan">
    Pembatasan berdasarkan penyebutan (`requireMention`, `/activation`).
  </Step>
</Steps>

## Pembatasan berdasarkan penyebutan (default)

Pesan grup memerlukan penyebutan kecuali ditimpa per grup. Nilai default berada per subsistem di bawah `*.groups."*"`.

Fakta penyebutan implisit yang didukung bersifat khusus kanal:

| Fakta                  | Penghasil bawaan saat ini                       |
| --------------------- | ------------------------------------------------ |
| Balasan kepada bot      | Discord, Microsoft Teams, QQBot, Slack, Telegram |
| Kutipan dari bot      | WhatsApp, Zalo personal                          |
| Bot bergabung ke utas | Mattermost, Slack, Tlon                          |

Setiap fakta secara default diaktifkan ketika kanal menghasilkannya. Atur bendera `implicitMentions` yang sesuai menjadi `false` agar fakta tersebut tidak lagi melewati pembatasan berdasarkan penyebutan; penyebutan eksplisit native tetap tidak terpengaruh. Bendera tidak berpengaruh pada kanal yang tidak menghasilkan fakta tersebut.

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

## Mencakup pola penyebutan yang dikonfigurasi

`mentionPatterns` yang dikonfigurasi merupakan pemicu regex cadangan. Gunakan ketika
platform tidak menyediakan penyebutan bot native, atau ketika Anda ingin teks biasa seperti
`openclaw:` dianggap sebagai penyebutan. Penyebutan platform native bersifat terpisah:
ketika Discord, Slack, Telegram, Matrix, Signal, atau kanal lain dapat membuktikan bahwa pesan
secara eksplisit menyebut bot, penyebutan native tersebut tetap memicu meskipun
pola regex yang dikonfigurasi ditolak.

Secara default, pola penyebutan yang dikonfigurasi berlaku di semua tempat kanal meneruskan fakta penyedia dan percakapan ke deteksi penyebutan. Agar pola luas tidak membangunkan agen di setiap grup, cakup pola tersebut per kanal dengan `channels.<channel>.mentionPatterns`.

Gunakan `mode: "deny"` ketika pola penyebutan regex harus dinonaktifkan secara default untuk suatu kanal, lalu aktifkan di ruang tertentu dengan `allowIn`:

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

Gunakan `mode: "allow"` default (atau hilangkan `mode`) ketika pola penyebutan regex harus berlaku secara luas, lalu nonaktifkan di ruang yang ramai dengan `denyIn`:

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

| Bidang           | Efek                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Pola penyebutan regex diaktifkan kecuali ID percakapan berada dalam `denyIn`. Ini adalah nilai default.                    |
| `mode: "deny"`  | Pola penyebutan regex dinonaktifkan kecuali ID percakapan berada dalam `allowIn`.                                       |
| `allowIn`       | ID percakapan tempat pola penyebutan regex diaktifkan dalam mode penolakan.                                               |
| `denyIn`        | ID percakapan tempat pola penyebutan regex dinonaktifkan. `denyIn` mengungguli `allowIn` jika keduanya mencakup ID yang sama. |

Kebijakan regex bercakupan yang didukung saat ini:

| Kanal  | ID yang digunakan dalam `allowIn` / `denyIn`                             |
| -------- | ------------------------------------------------------------ |
| Discord  | ID kanal Discord.                                         |
| Matrix   | ID ruang Matrix.                                             |
| Slack    | ID kanal Slack.                                           |
| Telegram | ID obrolan grup, atau `chatId:topic:threadId` untuk topik forum. |
| WhatsApp | ID percakapan WhatsApp seperti `123@g.us`.                |

Konfigurasi kanal tingkat akun dapat menetapkan kebijakan yang sama di bawah `channels.<channel>.accounts.<accountId>.mentionPatterns` ketika kanal tersebut mendukung beberapa akun. Kebijakan akun lebih diprioritaskan daripada kebijakan kanal tingkat atas untuk akun tersebut.

<AccordionGroup>
  <Accordion title="Catatan pembatasan berdasarkan penyebutan">
    - `mentionPatterns` merupakan pola regex aman yang tidak membedakan huruf besar-kecil; pola tidak valid dan bentuk pengulangan bersarang yang tidak aman akan diabaikan (dengan peringatan).
    - Prioritas pola: `agents.list[].groupChat.mentionPatterns` (berguna ketika beberapa agen berbagi grup) menimpa `messages.groupChat.mentionPatterns`; ketika keduanya tidak ditetapkan, pola diturunkan dari nama/emoji identitas agen.
    - Pembatasan berdasarkan penyebutan hanya diberlakukan ketika deteksi penyebutan dimungkinkan (penyebutan native atau `mentionPatterns` dikonfigurasi).
    - Mengizinkan grup atau pengirim tidak menonaktifkan pembatasan berdasarkan penyebutan; atur `requireMention` grup tersebut menjadi `false` ketika semua pesan harus memicu.
    - Konteks prompt obrolan grup otomatis membawa instruksi balasan diam yang telah diuraikan pada setiap giliran; file ruang kerja tidak boleh menduplikasi mekanisme `NO_REPLY`.
    - Grup yang mengizinkan balasan diam otomatis memperlakukan giliran model yang kosong bersih atau hanya berisi penalaran sebagai diam, setara dengan `NO_REPLY`. Obrolan langsung tidak pernah menerima panduan `NO_REPLY`, dan balasan grup yang hanya menggunakan alat pesan tetap diam dengan tidak memanggil `message(action=send)`.
    - Percakapan grup ambien yang selalu aktif menggunakan semantik permintaan pengguna secara default. Atur `messages.groupChat.unmentionedInbound: "room_event"` untuk mengirimkannya sebagai konteks diam. Lihat [Peristiwa ruang ambien](/id/channels/ambient-room-events) untuk contoh penyiapan.
    - Peristiwa ruang tidak disimpan sebagai permintaan pengguna palsu, dan teks asisten privat dari peristiwa ruang tanpa alat pesan tidak diputar ulang sebagai riwayat obrolan.
    - Nilai default Discord berada dalam `channels.discord.guilds."*"` (dapat ditimpa per guild/kanal).
    - Konteks riwayat grup dibungkus secara seragam di seluruh kanal. Grup dengan pembatasan berdasarkan penyebutan menyimpan pesan tertunda yang dilewati; grup yang selalu aktif juga dapat mempertahankan pesan ruang terbaru yang telah diproses ketika kanal mendukungnya. Gunakan `messages.groupChat.historyLimit` untuk nilai default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk penimpaan. Atur `0` untuk menonaktifkan.

  </Accordion>
</AccordionGroup>

## Pembatasan alat grup/kanal (opsional)

Beberapa konfigurasi kanal mendukung pembatasan alat yang tersedia **di dalam grup/ruang/kanal tertentu**.

- `tools`: izinkan/tolak alat untuk seluruh grup (`allow`, `alsoAllow`, `deny`; penolakan lebih diprioritaskan).
- `toolsBySender`: penimpaan per pengirim di dalam grup. Gunakan awalan kunci eksplisit: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan karakter pengganti `"*"`. ID kanal menggunakan ID kanal OpenClaw kanonis; alias seperti `teams` dinormalisasi menjadi `msteams`. Kunci lama tanpa awalan masih diterima, hanya dicocokkan sebagai `id:`, dan mencatat peringatan penghentian penggunaan.

Urutan resolusi (yang paling spesifik lebih diprioritaskan):

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
Pembatasan alat grup/saluran diterapkan sebagai tambahan pada kebijakan alat global/agen (penolakan tetap berlaku). Beberapa saluran menggunakan susunan berbeda untuk ruang/saluran (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Daftar izin grup

Saat `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kunci-kuncinya berfungsi sebagai daftar izin grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku penyebutan default.

<Warning>
Kekeliruan umum: persetujuan pemasangan DM tidak sama dengan otorisasi grup. Untuk saluran yang mendukung pemasangan DM, penyimpanan pemasangan hanya membuka akses DM. Perintah grup tetap memerlukan otorisasi pengirim grup secara eksplisit dari daftar izin konfigurasi seperti `groupAllowFrom` atau konfigurasi cadangan yang didokumentasikan untuk saluran tersebut.
</Warning>

Tujuan umum (salin/tempel):

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

Pemilik grup dapat mengalihkan aktivasi per grup dengan pesan mandiri:

- `/activation mention`
- `/activation always`

`/activation` adalah perintah inti yang dibatasi untuk pemilik dan hanya berlaku dalam percakapan grup. Pemilik berarti pengirim cocok dengan `commands.ownerAllowFrom`; daftar `allowFrom` saluran hanya mengendalikan akses saluran biasa dan akses perintah. Mode yang disimpan menggantikan `requireMention` grup tersebut pada saluran yang menggunakannya (Google Chat, QQBot, Telegram, WhatsApp), dan pengantar prompt sistem grup mencerminkan mode aktif di semua tempat.

## Bidang konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil pembatasan penyebutan)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Prompt sistem agen menyertakan pengantar grup pada giliran pertama sesi grup baru (dan setelah `/activation` berubah). Pengantar ini mengingatkan model agar merespons seperti manusia, meminimalkan baris kosong dan mengikuti spasi percakapan normal, serta menghindari pengetikan urutan literal `\n`. Saluran yang mode tabelnya dinyatakan tidak mempertahankan tabel asli atau mentah juga tidak menganjurkan tabel Markdown. Nama grup dan label peserta yang berasal dari saluran dirender sebagai metadata tidak tepercaya dalam blok berpagar, bukan sebagai instruksi sistem sebaris.

## Kekhususan iMessage

- Utamakan `chat_id:<id>` saat merutekan atau menyusun daftar izin.
- Cantumkan percakapan: `imsg chats --limit 20`.
- Balasan grup selalu dikirim kembali ke `chat_id` yang sama.

## Prompt sistem WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan prompt sistem WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, serta semantik penggantian akun.

## Kekhususan WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (penyisipan riwayat, detail penanganan penyebutan).

## Terkait

- [Grup siaran](/id/channels/broadcast-groups)
- [Perutean saluran](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Pemasangan](/id/channels/pairing)
