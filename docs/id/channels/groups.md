---
read_when:
    - Mengubah perilaku obrolan grup atau pembatasan berdasarkan penyebutan
    - Membatasi cakupan mentionPatterns ke percakapan grup tertentu
sidebarTitle: Groups
summary: Perilaku obrolan grup di berbagai platform (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-07-12T13:59:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw menerapkan aturan grup yang sama di semua kanal yang mendukung grup, termasuk Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, dan Zalo.

Untuk ruang yang selalu aktif dan seharusnya menyediakan konteks senyap kecuali agen secara eksplisit mengirim pesan yang terlihat, lihat [Peristiwa ruang ambien](/id/channels/ambient-room-events).

## Pengantar pemula (2 menit)

OpenClaw "berada" di akun perpesanan Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah: jika **Anda** berada dalam suatu grup, OpenClaw dapat melihat grup tersebut dan merespons di sana.

Perilaku bawaan:

- Grup dibatasi (`groupPolicy: "allowlist"`); pengirim grup diblokir hingga dimasukkan ke daftar izin.
- Balasan memerlukan penyebutan kecuali Anda menonaktifkan pembatasan penyebutan untuk suatu grup.
- Teks balasan akhir diposting ke ruang secara otomatis (`visibleReplies: "automatic"`).

Artinya: pengirim dalam daftar izin dapat memicu OpenClaw dengan menyebutnya.

<Note>
**Ringkasnya**

- **Akses pesan langsung** dikendalikan oleh `*.allowFrom`.
- **Akses grup** dikendalikan oleh `*.groupPolicy` + daftar izin (`*.groups`, `*.groupAllowFrom`).
- **Pemicu balasan** dikendalikan oleh pembatasan penyebutan (`requireMention`, `/activation`).

</Note>

Alur singkat (yang terjadi pada pesan grup):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Balasan yang terlihat

Untuk permintaan grup/kanal biasa, OpenClaw menggunakan `messages.groupChat.visibleReplies: "automatic"` secara bawaan: teks akhir asisten diposting ke ruang sebagai balasan yang terlihat.

Gunakan `messages.groupChat.visibleReplies: "message_tool"` jika ruang bersama harus memungkinkan agen memutuskan kapan berbicara dengan memanggil `message(action=send)`. Ini paling cocok dengan model yang andal dalam menggunakan alat (misalnya GPT-5.6 Sol). Jika model tidak menggunakan alat tersebut dan mengembalikan teks akhir yang substantif, OpenClaw menjaga teks itu tetap privat alih-alih mempostingnya ke ruang.

Gunakan `"automatic"` untuk model atau runtime yang tidak dapat mengikuti pengiriman khusus alat secara andal: teks akhir biasa diposting langsung ke ruang, dan agen tetap dapat memanggil `message(action=send)` untuk berkas, gambar, atau lampiran lain yang tidak dapat disertakan bersama teks akhir.

Jika alat pesan tidak tersedia berdasarkan kebijakan alat yang aktif, OpenClaw beralih ke balasan terlihat otomatis alih-alih menyembunyikan respons tanpa pemberitahuan. `openclaw doctor` memperingatkan tentang ketidaksesuaian ini.

Untuk percakapan langsung dan peristiwa sumber lainnya, `messages.visibleReplies: "message_tool"` menerapkan perilaku khusus alat yang sama secara global; `messages.groupChat.visibleReplies` tetap menjadi penggantian yang lebih spesifik untuk ruang grup/kanal. Giliran langsung WebChat internal secara bawaan menggunakan pengiriman balasan akhir otomatis agar Pi dan Codex menerima kontrak balasan terlihat yang sama.

Mode khusus alat menggantikan pola lama yang memaksa model menjawab `NO_REPLY` untuk sebagian besar giliran mode pengamatan pasif. Dalam mode khusus alat, prompt tidak menetapkan kontrak `NO_REPLY`; tidak melakukan tindakan yang terlihat berarti tidak memanggil alat pesan.

Pengikatan percakapan yang dimiliki Plugin merupakan pengecualian. Setelah sebuah Plugin mengikat suatu utas dan mengambil alih giliran masuk, balasan yang dikembalikan Plugin menjadi respons pengikatan yang terlihat; balasan tersebut tidak memerlukan `message(action=send)`. Balasan itu merupakan keluaran runtime Plugin, bukan teks akhir privat dari model.

Indikator pengetikan tetap dikirim untuk permintaan grup langsung. Peristiwa ruang selalu aktif yang bersifat ambien, jika diaktifkan, tetap ketat dan senyap kecuali agen memanggil alat pesan.

Sesi secara bawaan menyembunyikan ringkasan alat/progres yang terperinci. Gunakan `/verbose on` (atau `/verbose full`) untuk menampilkannya bagi sesi saat ini ketika melakukan debug, dan `/verbose off` untuk kembali ke perilaku yang hanya menampilkan balasan akhir. Status terperinci berlaku per sesi dan bekerja dengan cara yang sama dalam percakapan langsung, grup, kanal, dan topik forum.

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

Nilai bawaannya adalah `unmentionedInbound: "user_request"`. Pesan yang menyebut agen, perintah, permintaan pembatalan, dan pesan langsung tetap menjadi permintaan pengguna.

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

Giliran perintah mengabaikan `visibleReplies: "message_tool"` dan selalu membalas secara terlihat: perintah garis miring native (Discord, Telegram, dan permukaan lain yang mendukung perintah native) serta perintah teks `/...` yang diotorisasi sama-sama memposting respons ke percakapan sumber. Giliran teks `/...` yang tidak diotorisasi dalam grup tetap hanya menggunakan alat pesan; giliran percakapan biasa mengikuti nilai bawaan yang dikonfigurasi.

## Visibilitas konteks dan daftar izin

Dua kontrol berbeda terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, daftar izin khusus kanal).
- **Visibilitas konteks**: konteks tambahan apa yang dimasukkan ke model (teks balasan/kutipan, riwayat utas, metadata penerusan).

Secara bawaan, OpenClaw mempertahankan konteks sebagaimana diterima: daftar izin menentukan siapa yang dapat memicu tindakan, bukan cuplikan kutipan atau riwayat apa yang dapat dilihat model. Untuk turut memfilter konteks tambahan, atur `contextVisibility`:

| Mode                | Perilaku                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `"all"` (bawaan)    | Pertahankan konteks tambahan sebagaimana diterima.                                       |
| `"allowlist"`       | Hanya masukkan konteks riwayat/utas/kutipan/penerusan dari pengirim dalam daftar izin.   |
| `"allowlist_quote"` | Seperti `allowlist`, serta pertahankan pesan yang dikutip/dibalas secara eksplisit dari pengirim mana pun. |

Atur per kanal (`channels.<channel>.contextVisibility`), per akun (`channels.<channel>.accounts.<accountId>.contextVisibility`), atau secara global (`channels.defaults.contextVisibility`). Kanal yang mengambil konteks tambahan (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) menerapkan kebijakan tersebut saat membangun konteks masuk; kombinasi kebijakan yang tidak dikenal akan gagal secara tertutup dan menghilangkan konteks tersebut.

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                                       | Pengaturan yang digunakan                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Izinkan semua grup tetapi hanya balas saat disebut dengan @   | `groups: { "*": { requireMention: true } }`                  |
| Nonaktifkan semua balasan grup                               | `groupPolicy: "disabled"`                                    |
| Hanya grup tertentu                                          | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"`)      |
| Hanya Anda yang dapat memicu dalam grup                      | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`   |
| Gunakan kembali satu kumpulan pengirim tepercaya lintas kanal | `groupAllowFrom: ["accessGroup:operators"]`                  |

Untuk daftar izin pengirim yang dapat digunakan kembali, lihat [Grup akses](/id/channels/access-groups).

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (ruang/kanal menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke ID grup sehingga setiap topik memiliki sesinya sendiri.
- Percakapan langsung menggunakan sesi utama (atau sesi per pengirim jika `session.dmScope` dikonfigurasi).
- Heartbeat berjalan dalam sesi heartbeat yang dikonfigurasi (bawaan: sesi utama agen); sesi grup tidak menjalankan heartbeat sendiri.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: pesan langsung pribadi + grup publik (satu agen)

Ya — ini bekerja dengan baik jika lalu lintas "pribadi" Anda adalah **pesan langsung** dan lalu lintas "publik" Anda adalah **grup**.

Alasannya: dalam mode satu agen, pesan langsung biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sedangkan grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi, sementara sesi pesan langsung utama Anda tetap berjalan di host. Docker adalah backend bawaan jika Anda tidak memilih backend lain.

Dengan demikian, Anda memperoleh satu "otak" agen (ruang kerja + memori bersama), tetapi dua pola eksekusi:

- **Pesan langsung**: alat lengkap (host)
- **Grup**: sandbox + alat terbatas

<Note>
Jika Anda memerlukan ruang kerja/persona yang benar-benar terpisah ("pribadi" dan "publik" tidak boleh bercampur), gunakan agen kedua + pengikatan. Lihat [Perutean Multi-Agen](/id/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Pesan langsung di host, grup dalam sandbox">
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
    Ingin agar "grup hanya dapat melihat folder X" alih-alih "tidak ada akses host"? Pertahankan `workspaceAccess: "none"` dan pasang hanya jalur dalam daftar izin ke sandbox:

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
- Men-debug alasan suatu alat diblokir: [Sandbox vs Kebijakan Alat vs Ditingkatkan](/id/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detail pemasangan bind: [Sandboxing](/id/gateway/sandboxing#custom-bind-mounts)

## Label tampilan

- Label UI menggunakan `displayName` jika tersedia, dengan format `<channel>:<token>`.
- `#room` dikhususkan untuk ruang/kanal; percakapan grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`). ID buram yang sangat panjang dipersingkat menjadi token stabil agar ID rute lengkap tidak terekspos di UI.

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
      groupAllowFrom: ["123456789"], // numeric Telegram user id (setup resolves @username)
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

| Kebijakan     | Perilaku                                                                  |
| ------------- | ------------------------------------------------------------------------- |
| `"open"`      | Grup melewati daftar izin; pembatasan berdasarkan penyebutan tetap berlaku. |
| `"disabled"`  | Blokir seluruh pesan grup sepenuhnya.                                     |
| `"allowlist"` | Hanya izinkan grup/ruang yang cocok dengan daftar izin yang dikonfigurasi. |

<AccordionGroup>
  <Accordion title="Catatan per kanal">
    - `groupPolicy` terpisah dari pembatasan berdasarkan penyebutan (yang mengharuskan @penyebutan).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (cadangan: `allowFrom` eksplisit).
    - Signal: `groupAllowFrom` dapat cocok dengan ID grup Signal masuk atau nomor telepon/UUID pengirim.
    - Persetujuan pemasangan DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap harus dinyatakan secara eksplisit dalam daftar izin grup.
    - Discord: daftar izin menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: daftar izin menggunakan `channels.slack.channels`.
    - Matrix: daftar izin menggunakan `channels.matrix.groups`. Gunakan ID ruang (`!room:server`) atau alias (`#alias:server`); kunci nama ruang hanya cocok jika `channels.matrix.dangerouslyAllowNameMatching: true`, dan entri yang tidak dapat diuraikan akan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; daftar izin `users` per ruang juga didukung.
    - DM grup dikendalikan secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: daftar izin pengirim hanya menerima ID pengguna numerik (`"123456789"`; prefiks `telegram:`/`tg:` dihapus tanpa membedakan huruf besar-kecil). Entri `@username` tidak cocok saat runtime dan mencatat peringatan; penyiapan menguraikan `@username` menjadi ID. ID obrolan negatif harus berada di bawah `channels.telegram.groups`, bukan daftar izin pengirim.
    - Nilai bawaan adalah `groupPolicy: "allowlist"`; jika daftar izin grup Anda kosong, pesan grup akan diblokir.
    - Keamanan runtime: ketika blok penyedia sama sekali tidak ada (`channels.<provider>` tidak tersedia), kebijakan grup ditutup secara aman ke `allowlist`, bukan mewarisi `channels.defaults.groupPolicy`, dan Gateway mencatat penggunaan cadangan tersebut satu kali per akun.

  </Accordion>
</AccordionGroup>

Model mental singkat (urutan evaluasi untuk pesan grup):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Daftar izin grup">
    Daftar izin grup (`*.groups`, `*.groupAllowFrom`, daftar izin khusus kanal).
  </Step>
  <Step title="Pembatasan berdasarkan penyebutan">
    Pembatasan berdasarkan penyebutan (`requireMention`, `/activation`).
  </Step>
</Steps>

## Pembatasan berdasarkan penyebutan (bawaan)

Pesan grup memerlukan penyebutan kecuali ditimpa untuk grup tertentu. Nilai bawaan berada di setiap subsistem pada `*.groups."*"`.

Membalas pesan bot dihitung sebagai penyebutan implisit ketika kanal menyediakan metadata balasan; mengutip pesan bot juga dapat dihitung pada kanal yang menyediakan metadata kutipan. Kasus bawaan saat ini: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp, dan Zalo personal.

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

## Pola penyebutan yang dikonfigurasi berdasarkan cakupan

`mentionPatterns` yang dikonfigurasi merupakan pemicu cadangan regex. Gunakan pola ini ketika platform tidak menyediakan penyebutan bot asli, atau ketika teks biasa seperti `openclaw:` harus dihitung sebagai penyebutan. Penyebutan platform asli bersifat terpisah: ketika Discord, Slack, Telegram, Matrix, atau kanal lain dapat membuktikan bahwa pesan tersebut secara eksplisit menyebut bot, penyebutan asli itu tetap memicu meskipun pola regex yang dikonfigurasi ditolak.

Secara bawaan, pola penyebutan yang dikonfigurasi berlaku di setiap tempat kanal meneruskan fakta penyedia dan percakapan ke deteksi penyebutan. Agar pola luas tidak membangunkan agen di setiap grup, batasi cakupannya per kanal dengan `channels.<channel>.mentionPatterns`.

Gunakan `mode: "deny"` ketika pola penyebutan regex harus dinonaktifkan secara bawaan untuk suatu kanal, lalu aktifkan untuk ruang tertentu dengan `allowIn`:

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

Gunakan `mode: "allow"` bawaan (atau hilangkan `mode`) ketika pola penyebutan regex harus diterapkan secara luas, lalu nonaktifkan di ruang yang ramai dengan `denyIn`:

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

| Bidang          | Efek                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Pola penyebutan regex diaktifkan kecuali ID percakapan terdapat dalam `denyIn`. Ini adalah nilai bawaan.                            |
| `mode: "deny"`  | Pola penyebutan regex dinonaktifkan kecuali ID percakapan terdapat dalam `allowIn`.                                                 |
| `allowIn`       | ID percakapan tempat pola penyebutan regex diaktifkan dalam mode penolakan.                                                         |
| `denyIn`        | ID percakapan tempat pola penyebutan regex dinonaktifkan. `denyIn` mengalahkan `allowIn` jika keduanya memuat ID yang sama.         |

Kebijakan regex dengan cakupan yang didukung saat ini:

| Kanal    | ID yang digunakan dalam `allowIn` / `denyIn`                         |
| -------- | -------------------------------------------------------------------- |
| Discord  | ID kanal Discord.                                                    |
| Matrix   | ID ruang Matrix.                                                     |
| Slack    | ID kanal Slack.                                                      |
| Telegram | ID obrolan grup, atau `chatId:topic:threadId` untuk topik forum.     |
| WhatsApp | ID percakapan WhatsApp seperti `123@g.us`.                           |

Konfigurasi kanal tingkat akun dapat menetapkan kebijakan yang sama di bawah `channels.<channel>.accounts.<accountId>.mentionPatterns` ketika kanal tersebut mendukung beberapa akun. Kebijakan akun lebih diutamakan daripada kebijakan kanal tingkat atas untuk akun tersebut.

<AccordionGroup>
  <Accordion title="Catatan pembatasan berdasarkan penyebutan">
    - `mentionPatterns` adalah pola regex aman yang tidak membedakan huruf besar-kecil; pola yang tidak valid dan bentuk pengulangan bertumpuk yang tidak aman akan diabaikan (dengan peringatan).
    - Prioritas pola: `agents.list[].groupChat.mentionPatterns` (berguna ketika beberapa agen berbagi grup) menimpa `messages.groupChat.mentionPatterns`; ketika keduanya tidak ditetapkan, pola diturunkan dari nama/emoji identitas agen.
    - Pembatasan berdasarkan penyebutan hanya diberlakukan ketika deteksi penyebutan memungkinkan (penyebutan asli atau `mentionPatterns` telah dikonfigurasi).
    - Memasukkan grup atau pengirim ke daftar izin tidak menonaktifkan pembatasan berdasarkan penyebutan; tetapkan `requireMention` grup tersebut ke `false` ketika semua pesan harus memicu.
    - Konteks perintah obrolan grup otomatis membawa instruksi balasan senyap yang telah diuraikan pada setiap giliran; berkas ruang kerja tidak boleh menduplikasi mekanisme `NO_REPLY`.
    - Grup yang mengizinkan balasan senyap otomatis memperlakukan giliran model yang benar-benar kosong atau hanya berisi penalaran sebagai senyap, setara dengan `NO_REPLY`. Obrolan langsung tidak pernah menerima panduan `NO_REPLY`, dan balasan grup yang hanya menggunakan alat pesan tetap senyap dengan tidak memanggil `message(action=send)`.
    - Percakapan grup ambien yang selalu aktif menggunakan semantik permintaan pengguna secara bawaan. Tetapkan `messages.groupChat.unmentionedInbound: "room_event"` untuk mengirimkannya sebagai konteks senyap. Lihat [Peristiwa ruang ambien](/id/channels/ambient-room-events) untuk contoh penyiapan.
    - Peristiwa ruang tidak disimpan sebagai permintaan pengguna palsu, dan teks asisten privat dari peristiwa ruang tanpa alat pesan tidak diputar ulang sebagai riwayat obrolan.
    - Nilai bawaan Discord berada di `channels.discord.guilds."*"` (dapat ditimpa per guild/kanal).
    - Konteks riwayat grup dibungkus secara seragam di seluruh kanal. Grup dengan pembatasan berdasarkan penyebutan menyimpan pesan tertunda yang dilewati; grup yang selalu aktif juga dapat mempertahankan pesan ruang terbaru yang telah diproses jika kanal mendukungnya. Gunakan `messages.groupChat.historyLimit` sebagai nilai bawaan global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk penimpaan. Tetapkan `0` untuk menonaktifkannya.

  </Accordion>
</AccordionGroup>

## Pembatasan alat grup/kanal (opsional)

Beberapa konfigurasi kanal mendukung pembatasan alat yang tersedia **di dalam grup/ruang/kanal tertentu**.

- `tools`: izinkan/tolak alat untuk seluruh grup (`allow`, `alsoAllow`, `deny`; penolakan menang).
- `toolsBySender`: penimpaan per pengirim di dalam grup. Gunakan prefiks kunci eksplisit: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan karakter pengganti `"*"`. ID kanal menggunakan ID kanal OpenClaw kanonis; alias seperti `teams` dinormalisasi menjadi `msteams`. Kunci lama tanpa prefiks masih diterima, hanya dicocokkan sebagai `id:`, dan mencatat peringatan penghentian penggunaan.

Urutan resolusi (yang paling spesifik menang):

<Steps>
  <Step title="toolsBySender grup">
    Kecocokan `toolsBySender` grup/kanal.
  </Step>
  <Step title="Alat grup">
    `tools` grup/kanal.
  </Step>
  <Step title="toolsBySender bawaan">
    Kecocokan `toolsBySender` bawaan (`"*"`).
  </Step>
  <Step title="Alat bawaan">
    `tools` bawaan (`"*"`).
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
Pembatasan alat grup/kanal diterapkan sebagai tambahan terhadap kebijakan alat global/agen (penolakan tetap menang). Beberapa kanal menggunakan struktur bersarang yang berbeda untuk ruang/kanal (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Daftar izin grup

Ketika `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kuncinya berfungsi sebagai daftar izin grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku penyebutan bawaan.

<Warning>
Kebingungan umum: persetujuan pemasangan DM tidak sama dengan otorisasi grup. Untuk kanal yang mendukung pemasangan DM, penyimpanan pemasangan hanya membuka akses DM. Perintah grup tetap memerlukan otorisasi pengirim grup secara eksplisit dari daftar izin konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi yang didokumentasikan untuk kanal tersebut.
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

Pemilik grup dapat mengubah aktivasi per grup dengan pesan mandiri:

- `/activation mention`
- `/activation always`

`/activation` adalah perintah inti yang dibatasi untuk pemilik dan hanya berlaku dalam obrolan grup. Pemilik berarti pengirim cocok dengan `allowFrom` / `commands.ownerAllowFrom` kanal (jika tidak ada daftar izin yang dikonfigurasi, ID akun itu sendiri dianggap sebagai pemilik). Mode yang tersimpan menggantikan `requireMention` grup tersebut pada kanal yang menggunakannya (Google Chat, QQBot, Telegram, WhatsApp), dan pengantar perintah sistem grup mencerminkan mode aktif di semua kanal.

## Bidang konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil pembatasan berdasarkan penyebutan)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Perintah sistem agen menyertakan pengantar grup pada giliran pertama sesi grup baru (dan setelah perubahan `/activation`). Pengantar ini mengingatkan model agar merespons seperti manusia, meminimalkan baris kosong dan mengikuti spasi obrolan normal, serta menghindari pengetikan urutan `\n` secara harfiah. Grup selain Telegram juga tidak menganjurkan tabel Markdown; panduan teks kaya Telegram berasal dari perintah kanal Telegram. Nama grup dan label peserta yang berasal dari kanal dirender sebagai metadata tak tepercaya berpagar, bukan sebagai instruksi sistem sebaris.

## Kekhususan iMessage

- Utamakan `chat_id:<id>` saat merutekan atau memasukkan ke daftar izin.
- Cantumkan obrolan: `imsg chats --limit 20`.
- Balasan grup selalu dikirim kembali ke `chat_id` yang sama.

## Perintah sistem WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan perintah sistem WhatsApp yang kanonis, termasuk resolusi perintah grup dan langsung, perilaku wildcard, serta semantik penggantian akun.

## Kekhususan WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (penyisipan riwayat, detail penanganan penyebutan).

## Terkait

- [Grup siaran](/id/channels/broadcast-groups)
- [Perutean kanal](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Pemasangan](/id/channels/pairing)
