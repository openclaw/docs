---
read_when:
    - Mengubah perilaku obrolan grup atau pembatasan penyebutan
sidebarTitle: Groups
summary: Perilaku obrolan grup pada berbagai antarmuka (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grup
x-i18n:
    generated_at: "2026-05-03T21:27:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fd4fcaa8335f1dc4b4b1a719d6654ab0c10530f74284269ed6205dd5f87c116
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw memperlakukan obrolan grup secara konsisten di semua permukaan: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Pengantar pemula (2 menit)

OpenClaw "hidup" di akun perpesanan Anda sendiri. Tidak ada pengguna bot WhatsApp terpisah. Jika **Anda** berada dalam sebuah grup, OpenClaw dapat melihat grup tersebut dan merespons di sana.

Perilaku default:

- Grup dibatasi (`groupPolicy: "allowlist"`).
- Balasan memerlukan penyebutan kecuali Anda secara eksplisit menonaktifkan pembatasan penyebutan.
- Balasan akhir normal di grup/kanal bersifat privat secara default. Output ruang yang terlihat menggunakan alat `message`.

Artinya: pengirim yang ada dalam daftar izin dapat memicu OpenClaw dengan menyebutnya.

<Note>
**Ringkasnya**

- **Akses DM** dikontrol oleh `*.allowFrom`.
- **Akses grup** dikontrol oleh `*.groupPolicy` + daftar izin (`*.groups`, `*.groupAllowFrom`).
- **Pemicu balasan** dikontrol oleh pembatasan penyebutan (`requireMention`, `/activation`).

</Note>

Alur cepat (yang terjadi pada pesan grup):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Balasan terlihat

Untuk ruang grup/kanal, OpenClaw secara default menggunakan `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` menuliskan default ini ke konfigurasi kanal yang dikonfigurasi tetapi belum memilikinya.
Ini berarti agen tetap memproses giliran dan dapat memperbarui status memori/sesi, tetapi jawaban akhir normalnya tidak otomatis diposting kembali ke ruang. Untuk berbicara secara terlihat, agen menggunakan `message(action=send)`.

Jika alat pesan tidak tersedia menurut kebijakan alat yang aktif, OpenClaw beralih
kembali ke balasan terlihat otomatis alih-alih menekan respons secara diam-diam.
`openclaw doctor` memperingatkan ketidakcocokan ini.

Untuk obrolan langsung dan giliran sumber lainnya, gunakan `messages.visibleReplies: "message_tool"` untuk menerapkan perilaku balasan terlihat khusus alat yang sama secara global. Harness juga dapat memilih ini sebagai default saat belum diatur; harness Codex melakukan ini untuk obrolan langsung mode Codex. `messages.groupChat.visibleReplies` tetap menjadi override yang lebih spesifik untuk ruang grup/kanal.

Ini menggantikan pola lama yang memaksa model menjawab `NO_REPLY` untuk sebagian besar giliran mode memantau. Dalam mode khusus alat, tidak melakukan apa pun yang terlihat berarti tidak memanggil alat pesan.

Indikator mengetik tetap dikirim saat agen bekerja dalam mode khusus alat. Mode mengetik grup default ditingkatkan dari "message" ke "instant" untuk giliran ini karena mungkin tidak pernah ada teks pesan asisten normal sebelum agen memutuskan apakah akan memanggil alat pesan. Konfigurasi mode mengetik eksplisit tetap diutamakan.

Untuk memulihkan balasan akhir otomatis lama bagi ruang grup/kanal:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway memuat ulang konfigurasi `messages` secara langsung setelah berkas disimpan. Mulai ulang hanya
ketika pemantauan berkas atau pemuatan ulang konfigurasi dinonaktifkan dalam deployment.

Untuk mewajibkan output terlihat melewati alat pesan untuk setiap obrolan sumber:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Perintah slash native (Discord, Telegram, dan permukaan lain dengan dukungan perintah native) melewati `visibleReplies: "message_tool"` dan selalu membalas secara terlihat agar UI perintah native kanal mendapatkan respons yang diharapkannya. Ini hanya berlaku untuk giliran perintah native yang tervalidasi; perintah `/...` yang diketik sebagai teks dan giliran obrolan biasa tetap mengikuti default grup yang dikonfigurasi.

## Visibilitas konteks dan daftar izin

Dua kontrol berbeda terlibat dalam keamanan grup:

- **Otorisasi pemicu**: siapa yang dapat memicu agen (`groupPolicy`, `groups`, `groupAllowFrom`, daftar izin khusus kanal).
- **Visibilitas konteks**: konteks tambahan apa yang disuntikkan ke model (teks balasan, kutipan, riwayat utas, metadata terusan).

Secara default, OpenClaw memprioritaskan perilaku obrolan normal dan mempertahankan konteks sebagian besar seperti yang diterima. Ini berarti daftar izin terutama menentukan siapa yang dapat memicu tindakan, bukan batas redaksi universal untuk setiap cuplikan yang dikutip atau historis.

<AccordionGroup>
  <Accordion title="Perilaku saat ini bergantung pada kanal">
    - Beberapa kanal sudah menerapkan pemfilteran berbasis pengirim untuk konteks tambahan di jalur tertentu (misalnya penyemaian utas Slack, pencarian balasan/utas Matrix).
    - Kanal lain masih meneruskan konteks kutipan/balasan/terusan sebagaimana diterima.

  </Accordion>
  <Accordion title="Arah penguatan (direncanakan)">
    - `contextVisibility: "all"` (default) mempertahankan perilaku saat ini sebagaimana diterima.
    - `contextVisibility: "allowlist"` memfilter konteks tambahan ke pengirim yang ada dalam daftar izin.
    - `contextVisibility: "allowlist_quote"` adalah `allowlist` ditambah satu pengecualian kutipan/balasan eksplisit.

    Hingga model penguatan ini diterapkan secara konsisten di seluruh kanal, harapkan perbedaan berdasarkan permukaan.

  </Accordion>
</AccordionGroup>

![Alur pesan grup](/images/groups-flow.svg)

Jika Anda ingin...

| Tujuan                                       | Yang perlu diatur                                         |
| -------------------------------------------- | ---------------------------------------------------------- |
| Izinkan semua grup tetapi hanya balas pada @penyebutan | `groups: { "*": { requireMention: true } }`                |
| Nonaktifkan semua balasan grup               | `groupPolicy: "disabled"`                                  |
| Hanya grup tertentu                          | `groups: { "<group-id>": { ... } }` (tanpa kunci `"*"` key) |
| Hanya Anda yang dapat memicu di grup         | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Gunakan ulang satu set pengirim tepercaya di seluruh kanal | `groupAllowFrom: ["accessGroup:operators"]`                |

Untuk daftar izin pengirim yang dapat digunakan ulang, lihat [Grup akses](/id/channels/access-groups).

## Kunci sesi

- Sesi grup menggunakan kunci sesi `agent:<agentId>:<channel>:group:<id>` (ruang/kanal menggunakan `agent:<agentId>:<channel>:channel:<id>`).
- Topik forum Telegram menambahkan `:topic:<threadId>` ke id grup sehingga setiap topik memiliki sesi sendiri.
- Obrolan langsung menggunakan sesi utama (atau per pengirim jika dikonfigurasi).
- Heartbeat dilewati untuk sesi grup.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Pola: DM pribadi + grup publik (satu agen)

Ya — ini berjalan baik jika lalu lintas "pribadi" Anda adalah **DM** dan lalu lintas "publik" Anda adalah **grup**.

Alasannya: dalam mode satu agen, DM biasanya masuk ke kunci sesi **utama** (`agent:main:main`), sedangkan grup selalu menggunakan kunci sesi **non-utama** (`agent:main:<channel>:group:<id>`). Jika Anda mengaktifkan sandboxing dengan `mode: "non-main"`, sesi grup tersebut berjalan di backend sandbox yang dikonfigurasi sementara sesi DM utama Anda tetap di host. Docker adalah backend default jika Anda tidak memilih salah satunya.

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
  <Tab title="Grup hanya melihat folder dalam daftar izin">
    Ingin "grup hanya dapat melihat folder X" alih-alih "tanpa akses host"? Pertahankan `workspaceAccess: "none"` dan mount hanya path yang ada dalam daftar izin ke dalam sandbox:

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
- `#room` dicadangkan untuk ruang/kanal; obrolan grup menggunakan `g-<slug>` (huruf kecil, spasi -> `-`, pertahankan `#@+._-`).

## Kebijakan grup

Kontrol bagaimana pesan grup/ruang ditangani per kanal:

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
  <Accordion title="Catatan per kanal">
    - `groupPolicy` terpisah dari pembatasan penyebutan (yang memerlukan @penyebutan).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: gunakan `groupAllowFrom` (fallback: `allowFrom` eksplisit).
    - Signal: `groupAllowFrom` dapat cocok dengan id grup Signal masuk atau nomor telepon/UUID pengirim.
    - Persetujuan pemasangan DM (entri penyimpanan `*-allowFrom`) hanya berlaku untuk akses DM; otorisasi pengirim grup tetap eksplisit pada daftar izin grup.
    - Discord: daftar izin menggunakan `channels.discord.guilds.<id>.channels`.
    - Slack: daftar izin menggunakan `channels.slack.channels`.
    - Matrix: daftar izin menggunakan `channels.matrix.groups`. Utamakan ID ruang atau alias; pencarian nama ruang yang sudah dimasuki bersifat upaya terbaik, dan nama yang tidak terselesaikan diabaikan saat runtime. Gunakan `channels.matrix.groupAllowFrom` untuk membatasi pengirim; daftar izin `users` per ruang juga didukung.
    - DM grup dikontrol secara terpisah (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Daftar izin Telegram dapat cocok dengan ID pengguna (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) atau nama pengguna (`"@alice"` atau `"alice"`); prefiks tidak peka huruf besar/kecil.
    - Default adalah `groupPolicy: "allowlist"`; jika daftar izin grup Anda kosong, pesan grup diblokir.
    - Keamanan runtime: ketika blok penyedia sepenuhnya tidak ada (`channels.<provider>` tidak ada), kebijakan grup beralih ke mode gagal-tertutup (biasanya `allowlist`) alih-alih mewarisi `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Model mental cepat (urutan evaluasi untuk pesan grup):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (terbuka/dinonaktifkan/allowlist).
  </Step>
  <Step title="Group allowlists">
    Allowlist grup (`*.groups`, `*.groupAllowFrom`, allowlist khusus kanal).
  </Step>
  <Step title="Mention gating">
    Gating sebutan (`requireMention`, `/activation`).
  </Step>
</Steps>

## Gating sebutan (bawaan)

Pesan grup memerlukan sebutan kecuali ditimpa per grup. Default berada per subsistem di bawah `*.groups."*"`.

Membalas pesan bot dihitung sebagai sebutan implisit ketika kanal mendukung metadata balasan. Mengutip pesan bot juga dapat dihitung sebagai sebutan implisit pada kanal yang mengekspos metadata kutipan. Kasus bawaan saat ini mencakup Telegram, WhatsApp, Slack, Discord, Microsoft Teams, dan ZaloUser.

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
  <Accordion title="Catatan gating sebutan">
    - `mentionPatterns` adalah pola regex aman yang tidak peka huruf besar-kecil; pola tidak valid dan bentuk pengulangan bersarang yang tidak aman diabaikan.
    - Permukaan yang menyediakan sebutan eksplisit tetap lolos; pola adalah fallback.
    - Timpa per agen: `agents.list[].groupChat.mentionPatterns` (berguna ketika beberapa agen berbagi satu grup).
    - Gating sebutan hanya diberlakukan ketika deteksi sebutan memungkinkan (sebutan native atau `mentionPatterns` dikonfigurasi).
    - Memasukkan grup atau pengirim ke allowlist tidak menonaktifkan gating sebutan; setel `requireMention` grup tersebut ke `false` ketika semua pesan harus memicu.
    - Konteks prompt obrolan grup membawa instruksi balasan senyap yang sudah diselesaikan di setiap giliran; file ruang kerja tidak boleh menggandakan mekanisme `NO_REPLY`.
    - Grup yang mengizinkan balasan senyap memperlakukan giliran model yang kosong bersih atau hanya penalaran sebagai senyap, setara dengan `NO_REPLY`. Obrolan langsung melakukan hal yang sama hanya ketika balasan senyap langsung diizinkan secara eksplisit; jika tidak, balasan kosong tetap menjadi giliran agen yang gagal.
    - Default Discord berada di `channels.discord.guilds."*"` (dapat ditimpa per guild/kanal).
    - Konteks riwayat grup dibungkus secara seragam lintas kanal dan bersifat **hanya tertunda** (pesan yang dilewati karena gating sebutan); gunakan `messages.groupChat.historyLimit` untuk default global dan `channels.<channel>.historyLimit` (atau `channels.<channel>.accounts.*.historyLimit`) untuk penimpaan. Setel `0` untuk menonaktifkan.

  </Accordion>
</AccordionGroup>

## Pembatasan alat grup/kanal (opsional)

Beberapa konfigurasi kanal mendukung pembatasan alat mana yang tersedia **di dalam grup/ruang/kanal tertentu**.

- `tools`: izinkan/tolak alat untuk seluruh grup.
- `toolsBySender`: penimpaan per pengirim di dalam grup. Gunakan prefiks kunci eksplisit: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, dan wildcard `"*"`. Kunci lama tanpa prefiks masih diterima dan dicocokkan sebagai `id:` saja.

Urutan resolusi (yang paling spesifik menang):

<Steps>
  <Step title="Group toolsBySender">
    Kecocokan `toolsBySender` grup/kanal.
  </Step>
  <Step title="Group tools">
    `tools` grup/kanal.
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
Pembatasan alat grup/kanal diterapkan sebagai tambahan terhadap kebijakan alat global/agen (penolakan tetap menang). Beberapa kanal menggunakan penyarangan berbeda untuk ruang/kanal (misalnya, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Allowlist grup

Ketika `channels.whatsapp.groups`, `channels.telegram.groups`, atau `channels.imessage.groups` dikonfigurasi, kuncinya bertindak sebagai allowlist grup. Gunakan `"*"` untuk mengizinkan semua grup sambil tetap menetapkan perilaku sebutan default.

<Warning>
Kebingungan umum: persetujuan pemasangan DM tidak sama dengan otorisasi grup. Untuk kanal yang mendukung pemasangan DM, penyimpanan pemasangan hanya membuka DM. Perintah grup tetap memerlukan otorisasi pengirim grup eksplisit dari allowlist konfigurasi seperti `groupAllowFrom` atau fallback konfigurasi terdokumentasi untuk kanal tersebut.
</Warning>

Niat umum (salin/tempel):

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
  <Tab title="Izinkan semua grup tetapi wajibkan sebutan">
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

Pemilik ditentukan oleh `channels.whatsapp.allowFrom` (atau E.164 milik bot sendiri ketika tidak disetel). Kirim perintah sebagai pesan mandiri. Permukaan lain saat ini mengabaikan `/activation`.

## Bidang konteks

Payload masuk grup menetapkan:

- `ChatType=group`
- `GroupSubject` (jika diketahui)
- `GroupMembers` (jika diketahui)
- `WasMentioned` (hasil gating sebutan)
- Topik forum Telegram juga menyertakan `MessageThreadId` dan `IsForum`.

Catatan khusus kanal:

- BlueBubbles dapat secara opsional memperkaya peserta grup macOS yang tidak bernama dari basis data Kontak lokal sebelum mengisi `GroupMembers`. Ini nonaktif secara default dan hanya berjalan setelah gating grup normal lolos.

Prompt sistem agen menyertakan intro grup pada giliran pertama sesi grup baru. Ini mengingatkan model untuk merespons seperti manusia, menghindari tabel Markdown, meminimalkan baris kosong dan mengikuti spasi obrolan normal, serta menghindari pengetikan urutan literal `\n`. Nama grup dan label peserta yang bersumber dari kanal dirender sebagai metadata tidak tepercaya berpagar, bukan instruksi sistem inline.

## Kekhususan iMessage

- Utamakan `chat_id:<id>` saat merutekan atau memasukkan ke allowlist.
- Daftar obrolan: `imsg chats --limit 20`.
- Balasan grup selalu kembali ke `chat_id` yang sama.

## Prompt sistem WhatsApp

Lihat [WhatsApp](/id/channels/whatsapp#system-prompts) untuk aturan prompt sistem WhatsApp kanonis, termasuk resolusi prompt grup dan langsung, perilaku wildcard, dan semantik penimpaan akun.

## Kekhususan WhatsApp

Lihat [Pesan grup](/id/channels/group-messages) untuk perilaku khusus WhatsApp (injeksi riwayat, detail penanganan sebutan).

## Terkait

- [Grup siaran](/id/channels/broadcast-groups)
- [Perutean kanal](/id/channels/channel-routing)
- [Pesan grup](/id/channels/group-messages)
- [Pemasangan](/id/channels/pairing)
