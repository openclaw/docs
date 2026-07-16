---
read_when:
    - Mengubah perilaku obrolan grup atau pembatasan penyebutan
    - Membatasi cakupan mentionPatterns ke percakapan grup tertentu
sidebarTitle: Groups
summary: Perilaku obrolan grup di berbagai platform (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-07-16T17:48:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a708915ca9383d59b1bd2204b59a4df1de4caf677e68c9b7279f773275d67ee
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw menerapkan aturan grup yang sama di seluruh saluran yang mendukung grup, termasuk Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, dan Zalo.

Untuk ruang yang selalu aktif dan seharusnya menyediakan konteks senyap kecuali agen secara eksplisit mengirim pesan yang terlihat, lihat [Peristiwa ruang ambien](/id/channels/ambient-room-events).

## Pengantar untuk pemula (2 menit)

OpenClaw "berada" di akun perpesanan Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah: jika **Anda** berada dalam suatu grup, OpenClaw dapat melihat grup tersebut dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`); pengirim grup diblokir hingga dimasukkan ke daftar yang diizinkan.
- Balasan memerlukan penyebutan kecuali Anda menonaktifkan pembatasan penyebutan untuk suatu grup.
- Teks balasan akhir diposting ke ruang secara otomatis (`visibleReplies: "automatic"`).

Artinya: pengirim dalam daftar yang diizinkan dapat memicu OpenClaw dengan menyebutnya.

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
requireMention? ya -> disebut? tidak -> simpan hanya untuk konteks
penyebutan/balasan/perintah/DM -> permintaan pengguna
percakapan grup yang selalu aktif -> permintaan pengguna, atau peristiwa ruang jika dikonfigurasi
```

## Balasan yang terlihat

Untuk permintaan grup/saluran biasa, OpenClaw menggunakan `messages.groupChat.visibleReplies: "automatic"` secara default: teks akhir asisten diposting ke ruang sebagai balasan yang terlihat.

Gunakan `messages.groupChat.visibleReplies: "message_tool"` ketika ruang bersama harus memungkinkan agen memutuskan kapan berbicara dengan memanggil `message(action=send)`. Ini bekerja paling baik dengan model yang andal dalam menggunakan alat (misalnya GPT-5.6 Sol). Jika model tidak menggunakan alat dan mengembalikan teks akhir yang substantif, OpenClaw menjaga teks tersebut tetap privat alih-alih mempostingnya ke ruang.

Gunakan `"automatic"` untuk model atau runtime yang tidak mengikuti pengiriman khusus alat secara andal: teks akhir biasa diposting langsung ke ruang, dan agen tetap dapat memanggil `message(action=send)` untuk file, gambar, atau lampiran lain yang tidak dapat disertakan bersama teks akhir.

Jika alat pesan tidak tersedia berdasarkan kebijakan alat yang aktif, OpenClaw beralih ke balasan terlihat otomatis alih-alih menyembunyikan respons secara diam-diam. `openclaw doctor` memperingatkan tentang ketidakcocokan ini.

Untuk obrolan langsung dan peristiwa sumber lainnya, `messages.visibleReplies: "message_tool"` menerapkan perilaku khusus alat yang sama secara global; `messages.groupChat.visibleReplies` tetap menjadi penggantian yang lebih spesifik untuk ruang grup/saluran. Giliran langsung WebChat internal menggunakan pengiriman balasan akhir otomatis secara default agar Pi dan Codex menerima kontrak balasan terlihat yang sama.

Mode khusus alat menggantikan pola lama yang memaksa model menjawab `NO_REPLY` untuk sebagian besar giliran mode pengamat. Dalam mode khusus alat, prompt tidak menetapkan kontrak `NO_REPLY`; tidak melakukan apa pun yang terlihat berarti tidak memanggil alat pesan.

Pengikatan percakapan milik Plugin merupakan pengecualian. Setelah Plugin mengikat suatu utas dan mengambil alih giliran masuk, balasan yang dikembalikan Plugin menjadi respons pengikatan yang terlihat; balasan tersebut tidak memerlukan `message(action=send)`. Balasan tersebut merupakan keluaran runtime Plugin, bukan teks akhir model yang privat.

Indikator pengetikan tetap dikirim untuk permintaan grup langsung. Peristiwa ruang ambien yang selalu aktif, jika diaktifkan, tetap ketat dan senyap kecuali agen memanggil alat pesan.

Sesi menyembunyikan ringkasan alat/progres mendetail secara default. Gunakan `/verbose on` (atau `/verbose full`) untuk menampilkannya bagi sesi saat ini selama proses debug, dan `/verbose off` untuk kembali ke perilaku yang hanya menampilkan balasan akhir. Status mendetail berlaku per sesi dan bekerja dengan cara yang sama dalam obrolan langsung, grup, saluran, dan topik forum.

Untuk mengirim percakapan grup selalu aktif yang tidak menyebut agen sebagai konteks ruang senyap alih-alih permintaan pengguna, gunakan [Peristiwa ruang ambien](/id/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Default-nya adalah `unmentionedInbound: "user_request"`. Pesan yang menyebut agen, perintah, permintaan pembatalan, dan DM tetap menjadi permintaan pengguna.

Untuk mewajibkan keluaran yang terlihat dikirim melalui alat pesan bagi permintaan grup/saluran:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Untuk mewajibkannya bagi setiap obrolan sumber:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Gateway menerapkan perubahan konfigurasi `messages` tanpa perlu dimulai ulang setelah file disimpan. Mulai ulang hanya ketika pemuatan ulang konfigurasi dinonaktifkan (`gateway.reload.mode: "off"`).

Giliran perintah melewati `visibleReplies: "message_tool"` dan selalu membalas secara terlihat: perintah garis miring native (Discord, Telegram, dan permukaan lain yang mendukung perintah native) serta perintah teks `/...` yang diotorisasi, keduanya memposting respons ke obrolan sumber. Giliran teks `/...` yang tidak diotorisasi dalam grup tetap hanya menggunakan alat pesan; giliran obrolan biasa mengikuti default yang dikonfigurasi.

## Visibilitas konteks dan daftar yang diizinkan

Dua kontrol berbeda berperan dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, daftar yang diizinkan khusus saluran).
- **Visibilitas konteks**: konteks tambahan apa yang dimasukkan ke dalam model (teks balasan/kutipan, riwayat utas, metadata yang diteruskan).

Secara default, OpenClaw mempertahankan konteks sebagaimana diterima: daftar yang diizinkan menentukan siapa yang dapat memicu tindakan, bukan cuplikan kutipan atau riwayat apa yang dilihat model. Untuk turut memfilter konteks tambahan, atur `contextVisibility`:

| Mode                | Perilaku                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (default)   | Pertahankan konteks tambahan sebagaimana diterima.                                           |
| `"allowlist"`       | Hanya masukkan konteks riwayat/utas/kutipan/terusan dari pengirim dalam daftar yang diizinkan.     |
| `"allowlist_quote"` | `allowlist`, serta pertahankan pesan yang secara eksplisit dikutip/dibalas dari pengirim mana pun. |

Atur per saluran (`channels.<channel>.contextVisibility`), per akun (`channels.<channel>.accounts.<accountId>.contextVisibility`), atau secara global (`channels.defaults.contextVisibility`). Saluran yang mengambil konteks tambahan (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) menerapkan kebijakan tersebut saat menyusun konteks masuk; kombinasi kebijakan yang tidak dikenal akan gagal secara tertutup dan menghilangkan konteks tersebut.

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                         | Yang perlu diatur                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas saat @disebut | `groups: { "*": { requireMention: true } }`                |
| Nonaktifkan semua balasan grup                    | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                         | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"`)         |
| Hanya Anda yang dapat memicu dalam grup               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Gunakan kembali satu kumpulan pengirim tepercaya di seluruh saluran | `groupAllowFrom: ["accessGroup:operators"]`                |

Untuk daftar pengirim yang diizinkan dan dapat digunakan kembali, lihat [Grup akses](/id/channels/access-groups).

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (ruang/saluran menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke ID grup sehingga setiap topik memiliki sesinya sendiri.
- Obrolan langsung menggunakan sesi utama (atau sesi per pengirim jika `session.dmScope` dikonfigurasi).
- Heartbeat berjalan dalam sesi Heartbeat yang dikonfigurasi (default: sesi utama agen); sesi grup tidak menjalankan Heartbeat sendiri.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (satu agen)

Ya — ini bekerja dengan baik jika lalu lintas "pribadi" Anda berupa **DM** dan lalu lintas "publik" Anda berupa **grup**.

Alasannya: dalam mode satu agen, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sedangkan grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandbox dengan `mode: "non-main"`, sesi grup tersebut berjalan dalam backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap berjalan di host. Docker adalah backend default jika Anda tidak memilihnya.

Ini memberi Anda satu "otak" agen (ruang kerja + memori bersama), tetapi dua postur eksekusi:

- **DM**: alat lengkap (host)
- **Grup**: sandbox + alat terbatas

<Note>
Jika Anda memerlukan ruang kerja/persona yang benar-benar terpisah ("pribadi" dan "publik" tidak boleh bercampur), gunakan agen kedua + pengikatan. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM di host, grup dalam sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // grup/saluran bersifat non-utama -> masuk sandbox
            scope: "session", // isolasi terkuat (satu kontainer per grup/saluran)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Jika allow tidak kosong, semua yang lain diblokir (deny tetap berlaku).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Grup hanya melihat folder dalam daftar yang diizinkan">
    Ingin "grup hanya dapat melihat folder X" alih-alih "tanpa akses host"? Pertahankan `workspaceAccess: "none"` dan pasang hanya jalur dalam daftar yang diizinkan ke sandbox:

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
- `#room` dikhususkan untuk ruang/saluran; obrolan grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`). ID buram yang sangat panjang dipendekkan menjadi token stabil agar ID rute lengkap tidak terekspos di UI.

## Kebijakan grup

Kendalikan cara pesan grup/ruang ditangani per saluran:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // id pengguna Telegram numerik (penyiapan mengubah @username)
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
| `"open"`      | Grup melewati daftar izin; pembatasan berdasarkan sebutan tetap berlaku.      |
| `"disabled"`  | Blokir seluruh pesan grup sepenuhnya.                           |
| `"allowlist"` | Hanya izinkan grup/ruang yang cocok dengan daftar izin yang dikonfigurasi. |

<AccordionGroup>
  <Accordion title="Catatan per saluran">
    - `groupPolicy` terpisah dari pembatasan berdasarkan sebutan (yang memerlukan @sebutan).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (cadangan: `allowFrom` eksplisit).
    - Signal: `groupAllowFrom` dapat cocok dengan id grup Signal masuk atau telepon/UUID pengirim.
    - Persetujuan pemasangan DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap ditentukan secara eksplisit oleh daftar izin grup.
    - Discord: daftar izin menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: daftar izin menggunakan `channels.slack.channels`.
    - Matrix: daftar izin menggunakan `channels.matrix.groups`. Gunakan ID ruang (`!room:server`) atau alias (`#alias:server`); kunci nama ruang hanya cocok dengan `channels.matrix.dangerouslyAllowNameMatching: true`, dan entri yang tidak dapat diselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; daftar izin `users` per ruang juga didukung.
    - DM grup dikendalikan secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: daftar izin pengirim hanya menerima ID pengguna numerik (`"123456789"`; prefiks `telegram:`/`tg:` dihapus tanpa membedakan huruf besar-kecil). Entri `@username` tidak cocok saat runtime dan mencatat peringatan; penyiapan mengubah `@username` menjadi ID. ID obrolan negatif ditempatkan di bawah `channels.telegram.groups`, bukan dalam daftar izin pengirim.
    - Nilai default adalah `groupPolicy: "allowlist"`; jika daftar izin grup Anda kosong, pesan grup akan diblokir.
    - Keamanan runtime: ketika blok penyedia sama sekali tidak ada (`channels.<provider>` tidak ada), kebijakan grup ditutup secara aman ke `allowlist`, bukan mewarisi `channels.defaults.groupPolicy`, dan Gateway mencatat penggunaan cadangan satu kali per akun.

  </Accordion>
</AccordionGroup>

Model mental singkat (urutan evaluasi untuk pesan grup):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Daftar izin grup">
    Daftar izin grup (`*.groups`, `*.groupAllowFrom`, daftar izin khusus saluran).
  </Step>
  <Step title="Pembatasan berdasarkan sebutan">
    Pembatasan berdasarkan sebutan (`requireMention`, `/activation`).
  </Step>
</Steps>

## Pembatasan berdasarkan sebutan (default)

Pesan grup memerlukan sebutan kecuali ditimpa per grup. Nilai default berada di setiap subsistem di bawah `*.groups."*"`.

Membalas pesan bot dianggap sebagai sebutan implisit ketika saluran menyediakan metadata balasan; mengutip pesan bot juga dapat dianggap sebagai sebutan pada saluran yang menyediakan metadata kutipan. Kasus bawaan saat ini: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp, dan Zalo personal.

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

## Membatasi cakupan pola sebutan yang dikonfigurasi

`mentionPatterns` yang dikonfigurasi adalah pemicu cadangan regex. Gunakan ketika
platform tidak menyediakan sebutan bot native, atau ketika Anda ingin teks biasa seperti
`openclaw:` dianggap sebagai sebutan. Sebutan native platform bersifat terpisah:
ketika Discord, Slack, Telegram, Matrix, Signal, atau saluran lain dapat membuktikan bahwa pesan
secara eksplisit menyebut bot, sebutan native tersebut tetap memicu meskipun
pola regex yang dikonfigurasi ditolak.

Secara default, pola sebutan yang dikonfigurasi berlaku di semua tempat saat saluran meneruskan fakta penyedia dan percakapan ke deteksi sebutan. Agar pola yang luas tidak membangunkan agen di setiap grup, batasi cakupannya per saluran dengan `channels.<channel>.mentionPatterns`.

Gunakan `mode: "deny"` ketika pola sebutan regex harus dinonaktifkan secara default untuk suatu saluran, lalu aktifkan untuk ruang tertentu dengan `allowIn`:

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

Gunakan `mode: "allow"` default (atau hilangkan `mode`) ketika pola sebutan regex harus berlaku secara luas, lalu nonaktifkan di ruang yang ramai dengan `denyIn`:

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
| `mode: "allow"` | Pola sebutan regex diaktifkan kecuali ID percakapan berada dalam `denyIn`. Ini adalah nilai default.                    |
| `mode: "deny"`  | Pola sebutan regex dinonaktifkan kecuali ID percakapan berada dalam `allowIn`.                                       |
| `allowIn`       | ID percakapan tempat pola sebutan regex diaktifkan dalam mode penolakan.                                               |
| `denyIn`        | ID percakapan tempat pola sebutan regex dinonaktifkan. `denyIn` lebih diutamakan daripada `allowIn` jika keduanya mencakup ID yang sama. |

Kebijakan regex dengan cakupan yang didukung saat ini:

| Saluran  | ID yang digunakan dalam `allowIn` / `denyIn`                             |
| -------- | ------------------------------------------------------------ |
| Discord  | ID saluran Discord.                                         |
| Matrix   | ID ruang Matrix.                                             |
| Slack    | ID saluran Slack.                                           |
| Telegram | ID obrolan grup, atau `chatId:topic:threadId` untuk topik forum. |
| WhatsApp | ID percakapan WhatsApp seperti `123@g.us`.                |

Konfigurasi saluran tingkat akun dapat menetapkan kebijakan yang sama di bawah `channels.<channel>.accounts.<accountId>.mentionPatterns` ketika saluran tersebut mendukung beberapa akun. Kebijakan akun lebih diutamakan daripada kebijakan saluran tingkat teratas untuk akun tersebut.

<AccordionGroup>
  <Accordion title="Catatan pembatasan berdasarkan sebutan">
    - `mentionPatterns` adalah pola regex aman yang tidak membedakan huruf besar-kecil; pola yang tidak valid dan bentuk pengulangan bertingkat yang tidak aman diabaikan (dengan peringatan).
    - Prioritas pola: `agents.list[].groupChat.mentionPatterns` (berguna ketika beberapa agen berbagi satu grup) menimpa `messages.groupChat.mentionPatterns`; ketika keduanya tidak ditetapkan, pola diturunkan dari nama/emoji identitas agen.
    - Pembatasan berdasarkan sebutan hanya diberlakukan ketika deteksi sebutan dimungkinkan (sebutan native atau `mentionPatterns` dikonfigurasi).
    - Memasukkan grup atau pengirim ke daftar izin tidak menonaktifkan pembatasan berdasarkan sebutan; tetapkan `requireMention` grup tersebut ke `false` ketika semua pesan harus memicu.
    - Konteks prompt obrolan grup otomatis membawa instruksi balasan senyap yang telah diselesaikan pada setiap giliran; file ruang kerja tidak boleh menduplikasi mekanisme `NO_REPLY`.
    - Grup yang mengizinkan balasan senyap otomatis memperlakukan giliran model yang benar-benar kosong atau hanya berisi penalaran sebagai senyap, setara dengan `NO_REPLY`. Obrolan langsung tidak pernah menerima panduan `NO_REPLY`, dan balasan grup yang hanya menggunakan alat pesan tetap senyap dengan tidak memanggil `message(action=send)`.
    - Percakapan grup sekitar yang selalu aktif menggunakan semantik permintaan pengguna secara default. Tetapkan `messages.groupChat.unmentionedInbound: "room_event"` untuk mengirimkannya sebagai konteks senyap. Lihat [Peristiwa ruang sekitar](/id/channels/ambient-room-events) untuk contoh penyiapan.
    - Peristiwa ruang tidak disimpan sebagai permintaan pengguna palsu, dan teks asisten privat dari peristiwa ruang tanpa alat pesan tidak diputar ulang sebagai riwayat obrolan.
    - Nilai default Discord berada dalam `channels.discord.guilds."*"` (dapat ditimpa per guild/saluran).
    - Konteks riwayat grup dibungkus secara seragam di seluruh saluran. Grup dengan pembatasan berdasarkan sebutan menyimpan pesan tertunda yang dilewati; grup yang selalu aktif juga dapat menyimpan pesan ruang terbaru yang telah diproses ketika saluran mendukungnya. Gunakan `messages.groupChat.historyLimit` untuk nilai default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk penimpaan. Tetapkan `0` untuk menonaktifkan.

  </Accordion>
</AccordionGroup>

## Pembatasan alat grup/saluran (opsional)

Beberapa konfigurasi saluran mendukung pembatasan alat yang tersedia **di dalam grup/ruang/saluran tertentu**.

- `tools`: izinkan/tolak alat untuk seluruh grup (`allow`, `alsoAllow`, `deny`; penolakan lebih diutamakan).
- `toolsBySender`: penimpaan per pengirim di dalam grup. Gunakan prefiks kunci eksplisit: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`. ID saluran menggunakan ID saluran OpenClaw kanonis; alias seperti `teams` dinormalisasi menjadi `msteams`. Kunci lama tanpa prefiks masih diterima, hanya dicocokkan sebagai `id:`, dan mencatat peringatan penghentian penggunaan.

Urutan resolusi (yang paling spesifik lebih diutamakan):

<Steps>
  <Step title="toolsBySender grup">
    Kecocokan `toolsBySender` grup/saluran.
  </Step>
  <Step title="Alat grup">
    `tools` grup/saluran.
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
Pembatasan alat grup/saluran diterapkan sebagai tambahan atas kebijakan alat global/agen (penolakan tetap berlaku). Beberapa saluran menggunakan struktur bertingkat yang berbeda untuk ruang/saluran (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Daftar izin grup

Ketika `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kunci tersebut berfungsi sebagai daftar izin grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku penyebutan default.

<Warning>
Kebingungan umum: persetujuan pemasangan DM tidak sama dengan otorisasi grup. Untuk saluran yang mendukung pemasangan DM, penyimpanan pemasangan hanya membuka akses DM. Perintah grup tetap memerlukan otorisasi pengirim grup secara eksplisit dari daftar izin konfigurasi seperti `groupAllowFrom` atau konfigurasi cadangan yang didokumentasikan untuk saluran tersebut.
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

`/activation` adalah perintah inti yang dibatasi untuk pemilik dan hanya berlaku dalam obrolan grup. Pemilik berarti pengirim cocok dengan `commands.ownerAllowFrom`; daftar `allowFrom` saluran hanya mengontrol akses saluran biasa dan perintah. Mode yang disimpan menggantikan `requireMention` grup tersebut pada saluran yang menggunakannya (Google Chat, QQBot, Telegram, WhatsApp), dan pengantar prompt sistem grup mencerminkan mode aktif di semua tempat.

## Bidang konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil pembatasan berdasarkan penyebutan)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Prompt sistem agen menyertakan pengantar grup pada giliran pertama sesi grup baru (dan setelah `/activation` berubah). Pengantar tersebut mengingatkan model agar merespons seperti manusia, meminimalkan baris kosong dan mengikuti spasi obrolan normal, serta menghindari pengetikan urutan literal `\n`. Saluran yang mode tabelnya dinyatakan tidak mempertahankan tabel native atau mentah juga tidak menganjurkan tabel Markdown. Nama grup dan label peserta yang berasal dari saluran dirender sebagai metadata tidak tepercaya berpagar, bukan sebagai instruksi sistem sebaris.

## Kekhususan iMessage

- Utamakan `chat_id:<id>` saat melakukan perutean atau memasukkan ke daftar izin.
- Cantumkan obrolan: `imsg chats --limit 20`.
- Balasan grup selalu dikirim kembali ke `chat_id` yang sama.

## Prompt sistem WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan prompt sistem WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, serta semantik penggantian akun.

## Kekhususan WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan penyebutan).

## Terkait

- [Grup siaran](/id/channels/broadcast-groups)
- [Perutean saluran](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Pemasangan](/id/channels/pairing)
