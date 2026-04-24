---
read_when:
    - Menyiapkan Slack atau men-debug mode socket/HTTP Slack
summary: Penyiapan dan perilaku runtime Slack (Socket Mode + URL Permintaan HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-24T08:59:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 906a4fcf00a51f4a9b8410f982abe1f068687b5aa9847a4894f489e57fa9e4dd
    source_path: channels/slack.md
    workflow: 15
---

Siap produksi untuk DM dan kanal melalui integrasi aplikasi Slack. Mode default adalah Socket Mode; URL Permintaan HTTP juga didukung.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM Slack secara default menggunakan mode pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas kanal dan playbook perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Di pengaturan aplikasi Slack tekan tombol **[Create New App](https://api.slack.com/apps/new)**:

        - pilih **from a manifest** dan pilih workspace untuk aplikasi Anda
        - tempel [manifest contoh](#manifest-and-scope-checklist) dari bawah lalu lanjutkan untuk membuat
        - buat **App-Level Token** (`xapp-...`) dengan `connections:write`
        - instal aplikasi lalu salin **Bot Token** (`xoxb-...`) yang ditampilkan
      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Fallback env (hanya akun default):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        Di pengaturan aplikasi Slack tekan tombol **[Create New App](https://api.slack.com/apps/new)**:

        - pilih **from a manifest** dan pilih workspace untuk aplikasi Anda
        - tempel [manifest contoh](#manifest-and-scope-checklist) lalu perbarui URL sebelum membuat
        - simpan **Signing Secret** untuk verifikasi permintaan
        - instal aplikasi lalu salin **Bot Token** (`xoxb-...`) yang ditampilkan

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

        <Note>
        Gunakan path webhook unik untuk HTTP multi-akun

        Berikan setiap akun `webhookPath` yang berbeda (default `/slack/events`) agar pendaftaran tidak bertabrakan.
        </Note>

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Daftar periksa manifest dan cakupan

Manifest dasar aplikasi Slack sama untuk Socket Mode dan URL Permintaan HTTP. Hanya blok `settings` (dan `url` perintah slash) yang berbeda.

Manifest dasar (Socket Mode default):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Untuk mode **HTTP Request URLs**, ganti `settings` dengan varian HTTP dan tambahkan `url` ke setiap perintah slash. URL publik diperlukan:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* sama seperti Socket Mode */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Pengaturan manifest tambahan

Menampilkan fitur berbeda yang memperluas default di atas.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Beberapa [native slash commands](#commands-and-slash-behavior) dapat digunakan sebagai pengganti satu perintah yang dikonfigurasi dengan beberapa nuansa:

    - Gunakan `/agentstatus` alih-alih `/status` karena perintah `/status` dicadangkan.
    - Tidak lebih dari 25 perintah slash dapat disediakan sekaligus.

    Ganti bagian `features.slash_commands` yang ada dengan subset dari [perintah yang tersedia](/id/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models or add a model",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all] | add <provider> <modelId>"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Gunakan daftar `slash_commands` yang sama seperti Socket Mode di atas, dan tambahkan `"url": "https://gateway-host.example.com/slack/events"` ke setiap entri. Contoh:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...ulangi untuk setiap perintah dengan nilai `url` yang sama
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    Tambahkan cakupan bot `chat:write.customize` jika Anda ingin pesan keluar menggunakan identitas agen aktif (nama pengguna dan ikon kustom) alih-alih identitas aplikasi Slack default.

    Jika Anda menggunakan ikon emoji, Slack mengharapkan sintaks `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    Jika Anda mengonfigurasi `channels.slack.userToken`, cakupan baca yang umum adalah:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (jika Anda bergantung pada pembacaan pencarian Slack)

  </Accordion>
</AccordionGroup>

## Model token

- `botToken` + `appToken` diperlukan untuk Socket Mode.
- Mode HTTP memerlukan `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima string
  plaintext atau objek SecretRef.
- Token konfigurasi mengesampingkan fallback env.
- Fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` hanya berlaku untuk akun default.
- `userToken` (`xoxp-...`) hanya konfigurasi (tanpa fallback env) dan default ke perilaku hanya-baca (`userTokenReadOnly: true`).

Perilaku snapshot status:

- Pemeriksaan akun Slack melacak field `*Source` dan `*Status`
  per kredensial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status adalah `available`, `configured_unavailable`, atau `missing`.
- `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef
  atau sumber secret non-inline lain, tetapi jalur perintah/runtime saat ini
  tidak dapat menyelesaikan nilai sebenarnya.
- Dalam mode HTTP, `signingSecretStatus` disertakan; dalam Socket Mode,
  pasangan yang diperlukan adalah `botTokenStatus` + `appTokenStatus`.

<Tip>
Untuk tindakan/pembacaan direktori, user token dapat diprioritaskan jika dikonfigurasi. Untuk penulisan, bot token tetap diprioritaskan; penulisan dengan user token hanya diizinkan ketika `userTokenReadOnly: false` dan bot token tidak tersedia.
</Tip>

## Tindakan dan gate

Tindakan Slack dikendalikan oleh `channels.slack.actions.*`.

Grup tindakan yang tersedia dalam tooling Slack saat ini:

| Grup      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Tindakan pesan Slack saat ini mencakup `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, dan `emoji-list`.

## Kontrol akses dan perutean

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` mengendalikan akses DM (legacy: `channels.slack.dm.policy`):

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.slack.allowFrom` untuk menyertakan `"*"`; legacy: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (default true)
    - `channels.slack.allowFrom` (disarankan)
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (DM grup default false)
    - `dm.groupChannels` (allowlist MPIM opsional)

    Prioritas multi-akun:

    - `channels.slack.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Akun bernama mewarisi `channels.slack.allowFrom` saat `allowFrom` miliknya sendiri tidak diatur.
    - Akun bernama tidak mewarisi `channels.slack.accounts.default.allowFrom`.

    Pairing di DM menggunakan `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` mengendalikan penanganan kanal:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist kanal berada di bawah `channels.slack.channels` dan sebaiknya menggunakan ID kanal yang stabil.

    Catatan runtime: jika `channels.slack` sama sekali tidak ada (penyiapan hanya-env), runtime fallback ke `groupPolicy="allowlist"` dan mencatat peringatan (bahkan jika `channels.defaults.groupPolicy` diatur).

    Resolusi nama/ID:

    - entri allowlist kanal dan entri allowlist DM diselesaikan saat startup ketika akses token memungkinkan
    - entri nama kanal yang tidak dapat diselesaikan tetap disimpan sebagaimana dikonfigurasi tetapi diabaikan untuk perutean secara default
    - otorisasi masuk dan perutean kanal default-nya ID-first; pencocokan username/slug langsung memerlukan `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions and channel users">
    Pesan kanal menggunakan gating mention secara default.

    Sumber mention:

    - mention aplikasi eksplisit (`<@botId>`)
    - pola regex mention (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku thread balas-ke-bot implisit (dinonaktifkan ketika `thread.requireExplicitMention` adalah `true`)

    Kontrol per kanal (`channels.slack.channels.<id>`; nama hanya melalui resolusi startup atau `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format kunci `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, atau wildcard `"*"`
      (kunci lama tanpa prefix masih dipetakan hanya ke `id:`)

  </Tab>
</Tabs>

## Threading, sesi, dan tag balasan

- DM dirutekan sebagai `direct`; kanal sebagai `channel`; MPIM sebagai `group`.
- Dengan default `session.dmScope=main`, DM Slack diciutkan ke sesi utama agen.
- Sesi kanal: `agent:<agentId>:slack:channel:<channelId>`.
- Balasan thread dapat membuat sufiks sesi thread (`:thread:<threadTs>`) jika berlaku.
- Default `channels.slack.thread.historyScope` adalah `thread`; default `thread.inheritParent` adalah `false`.
- `channels.slack.thread.initialHistoryLimit` mengendalikan berapa banyak pesan thread yang sudah ada diambil saat sesi thread baru dimulai (default `20`; atur `0` untuk menonaktifkan).
- `channels.slack.thread.requireExplicitMention` (default `false`): ketika `true`, mention thread implisit ditekan sehingga bot hanya merespons mention `@bot` eksplisit di dalam thread, bahkan ketika bot sudah berpartisipasi di thread tersebut. Tanpa ini, balasan dalam thread yang diikuti bot melewati gating `requireMention`.

Kontrol threading balasan:

- `channels.slack.replyToMode`: `off|first|all|batched` (default `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy untuk obrolan langsung: `channels.slack.dm.replyToMode`

Tag balasan manual didukung:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Catatan: `replyToMode="off"` menonaktifkan **semua** threading balasan di Slack, termasuk tag `[[reply_to_*]]` eksplisit. Ini berbeda dari Telegram, di mana tag eksplisit tetap dihormati dalam mode `"off"` — thread Slack menyembunyikan pesan dari kanal sementara balasan Telegram tetap terlihat inline.

## Reaksi ack

`ackReaction` mengirim emoji pengakuan saat OpenClaw sedang memproses pesan masuk.

Urutan resolusi:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak `"👀"`)

Catatan:

- Slack mengharapkan shortcode (misalnya `"eyes"`).
- Gunakan `""` untuk menonaktifkan reaksi untuk akun Slack atau secara global.

## Streaming teks

`channels.slack.streaming` mengendalikan perilaku pratinjau langsung:

- `off`: nonaktifkan streaming pratinjau langsung.
- `partial` (default): ganti teks pratinjau dengan output parsial terbaru.
- `block`: tambahkan pembaruan pratinjau bertahap.
- `progress`: tampilkan teks status progres saat menghasilkan, lalu kirim teks final.
- `streaming.preview.toolProgress`: saat pratinjau draf aktif, rutekan pembaruan alat/progres ke pesan pratinjau yang sama yang diedit (default: `true`). Atur `false` agar pesan alat/progres tetap terpisah.

`channels.slack.streaming.nativeTransport` mengendalikan streaming teks native Slack saat `channels.slack.streaming.mode` adalah `partial` (default: `true`).

- Thread balasan harus tersedia agar streaming teks native dan status thread asisten Slack dapat muncul. Pemilihan thread tetap mengikuti `replyToMode`.
- Root obrolan kanal dan grup masih dapat menggunakan pratinjau draf normal saat streaming native tidak tersedia.
- DM Slack tingkat atas default-nya tetap di luar thread, sehingga tidak menampilkan pratinjau bergaya thread; gunakan balasan thread atau `typingReaction` jika Anda ingin progres terlihat di sana.
- Payload media dan non-teks fallback ke pengiriman normal.
- Final media/error membatalkan edit pratinjau yang tertunda; final teks/blok yang memenuhi syarat hanya di-flush saat dapat mengedit pratinjau di tempat.
- Jika streaming gagal di tengah balasan, OpenClaw fallback ke pengiriman normal untuk payload yang tersisa.

Gunakan pratinjau draf alih-alih streaming teks native Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Kunci legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) dimigrasikan otomatis ke `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` dimigrasikan otomatis ke `channels.slack.streaming.mode` dan `channels.slack.streaming.nativeTransport`.
- legacy `channels.slack.nativeStreaming` dimigrasikan otomatis ke `channels.slack.streaming.nativeTransport`.

## Fallback reaksi mengetik

`typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat OpenClaw sedang memproses balasan, lalu menghapusnya ketika eksekusi selesai. Ini paling berguna di luar balasan thread, yang menggunakan indikator status default "is typing...".

Urutan resolusi:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Catatan:

- Slack mengharapkan shortcode (misalnya `"hourglass_flowing_sand"`).
- Reaksi ini bersifat best-effort dan pembersihan dicoba secara otomatis setelah balasan atau jalur kegagalan selesai.

## Media, pemotongan, dan pengiriman

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Lampiran file Slack diunduh dari URL privat yang di-host Slack (alur permintaan yang diautentikasi token) dan ditulis ke penyimpanan media saat pengambilan berhasil dan batas ukuran mengizinkan.

    Batas ukuran masuk runtime default adalah `20MB` kecuali dioverride oleh `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - potongan teks menggunakan `channels.slack.textChunkLimit` (default 4000)
    - `channels.slack.chunkMode="newline"` mengaktifkan pemisahan dengan prioritas paragraf
    - pengiriman file menggunakan API upload Slack dan dapat menyertakan balasan thread (`thread_ts`)
    - batas media keluar mengikuti `channels.slack.mediaMaxMb` jika dikonfigurasi; jika tidak, pengiriman kanal menggunakan default jenis MIME dari pipeline media
  </Accordion>

  <Accordion title="Delivery targets">
    Target eksplisit yang disarankan:

    - `user:<id>` untuk DM
    - `channel:<id>` untuk kanal

    DM Slack dibuka melalui API percakapan Slack saat mengirim ke target pengguna.

  </Accordion>
</AccordionGroup>

## Perintah dan perilaku slash

Perintah slash muncul di Slack sebagai satu perintah yang dikonfigurasi atau beberapa perintah native. Konfigurasikan `channels.slack.slashCommand` untuk mengubah default perintah:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Perintah native memerlukan [pengaturan manifest tambahan](#additional-manifest-settings) di aplikasi Slack Anda dan diaktifkan dengan `channels.slack.commands.native: true` atau `commands.native: true` pada konfigurasi global.

- Mode otomatis perintah native **off** untuk Slack sehingga `commands.native: "auto"` tidak mengaktifkan perintah native Slack.

```txt
/help
```

Menu argumen native menggunakan strategi rendering adaptif yang menampilkan modal konfirmasi sebelum mengirim nilai opsi yang dipilih:

- hingga 5 opsi: blok tombol
- 6-100 opsi: menu select statis
- lebih dari 100 opsi: select eksternal dengan pemfilteran opsi async saat handler opsi interaktivitas tersedia
- melebihi batas Slack: nilai opsi yang dienkode fallback ke tombol

```txt
/think
```

Sesi slash menggunakan kunci terisolasi seperti `agent:<agentId>:slack:slash:<userId>` dan tetap merutekan eksekusi perintah ke sesi percakapan target menggunakan `CommandTargetSessionKey`.

## Balasan interaktif

Slack dapat merender kontrol balasan interaktif yang ditulis agen, tetapi fitur ini nonaktif secara default.

Aktifkan secara global:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Atau aktifkan hanya untuk satu akun Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Saat diaktifkan, agen dapat mengeluarkan directive balasan khusus Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Directive ini dikompilasi menjadi Slack Block Kit dan merutekan klik atau pilihan kembali melalui jalur peristiwa interaksi Slack yang ada.

Catatan:

- Ini adalah UI khusus Slack. Kanal lain tidak menerjemahkan directive Slack Block Kit ke sistem tombol mereka sendiri.
- Nilai callback interaktif adalah token opaque buatan OpenClaw, bukan nilai mentah yang ditulis agen.
- Jika blok interaktif yang dihasilkan akan melebihi batas Slack Block Kit, OpenClaw fallback ke balasan teks asli alih-alih mengirim payload blocks yang tidak valid.

## Persetujuan exec di Slack

Slack dapat bertindak sebagai klien persetujuan native dengan tombol dan interaksi interaktif, alih-alih fallback ke UI Web atau terminal.

- Persetujuan exec menggunakan `channels.slack.execApprovals.*` untuk perutean native DM/kanal.
- Persetujuan Plugin masih dapat diselesaikan melalui permukaan tombol native Slack yang sama saat permintaan sudah masuk ke Slack dan jenis approval id adalah `plugin:`.
- Otorisasi approver tetap ditegakkan: hanya pengguna yang diidentifikasi sebagai approver yang dapat menyetujui atau menolak permintaan melalui Slack.

Ini menggunakan permukaan tombol persetujuan bersama yang sama seperti kanal lain. Saat `interactivity` diaktifkan di pengaturan aplikasi Slack Anda, prompt persetujuan dirender sebagai tombol Block Kit langsung di percakapan.
Ketika tombol tersebut ada, itu menjadi UX persetujuan utama; OpenClaw
seharusnya hanya menyertakan perintah `/approve` manual ketika hasil alat mengatakan persetujuan obrolan tidak tersedia atau persetujuan manual adalah satu-satunya jalur.

Path konfigurasi:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opsional; fallback ke `commands.ownerAllowFrom` jika memungkinkan)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `agentFilter`, `sessionFilter`

Slack otomatis mengaktifkan persetujuan exec native saat `enabled` tidak diatur atau `"auto"` dan setidaknya satu
approver berhasil diselesaikan. Atur `enabled: false` untuk menonaktifkan Slack sebagai klien persetujuan native secara eksplisit.
Atur `enabled: true` untuk memaksa persetujuan native aktif saat approver berhasil diselesaikan.

Perilaku default tanpa konfigurasi persetujuan exec Slack eksplisit:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Konfigurasi native Slack eksplisit hanya diperlukan saat Anda ingin mengganti approver, menambahkan filter, atau
mengaktifkan pengiriman ke origin-chat:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Penerusan bersama `approvals.exec` bersifat terpisah. Gunakan hanya ketika prompt persetujuan exec juga harus
dirutekan ke obrolan lain atau target out-of-band eksplisit. Penerusan bersama `approvals.plugin` juga
terpisah; tombol native Slack tetap dapat menyelesaikan persetujuan Plugin ketika permintaan tersebut sudah masuk
ke Slack.

`/approve` di obrolan yang sama juga berfungsi di kanal dan DM Slack yang sudah mendukung perintah. Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk model penerusan persetujuan lengkap.

## Peristiwa dan perilaku operasional

- Edit/hapus pesan/siaran thread dipetakan menjadi peristiwa sistem.
- Peristiwa tambah/hapus reaksi dipetakan menjadi peristiwa sistem.
- Peristiwa anggota masuk/keluar, kanal dibuat/diubah namanya, dan tambah/hapus pin dipetakan menjadi peristiwa sistem.
- `channel_id_changed` dapat memigrasikan kunci konfigurasi kanal saat `configWrites` diaktifkan.
- Metadata topik/tujuan kanal diperlakukan sebagai konteks tidak tepercaya dan dapat disisipkan ke konteks perutean.
- Pemula thread dan penyemaian konteks riwayat thread awal difilter oleh allowlist pengirim yang dikonfigurasi jika berlaku.
- Tindakan blok dan interaksi modal memunculkan peristiwa sistem terstruktur `Slack interaction: ...` dengan field payload kaya:
  - tindakan blok: nilai terpilih, label, nilai picker, dan metadata `workflow_*`
  - peristiwa modal `view_submission` dan `view_closed` dengan metadata kanal yang dirutekan dan input formulir

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Slack](/id/gateway/config-channels#slack).

<Accordion title="Field Slack dengan sinyal tinggi">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- akses DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle kompatibilitas: `dangerouslyAllowNameMatching` (break-glass; biarkan nonaktif kecuali diperlukan)
- akses kanal: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/riwayat: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- operasi/fitur: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="No replies in channels">
    Periksa, secara berurutan:

    - `groupPolicy`
    - allowlist kanal (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` per kanal

    Perintah yang berguna:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM messages ignored">
    Periksa:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (atau legacy `channels.slack.dm.policy`)
    - persetujuan pairing / entri allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode not connecting">
    Validasi token bot + aplikasi dan pengaktifan Socket Mode di pengaturan aplikasi Slack.

    Jika `openclaw channels status --probe --json` menampilkan `botTokenStatus` atau
    `appTokenStatus: "configured_unavailable"`, akun Slack tersebut
    dikonfigurasi tetapi runtime saat ini tidak dapat menyelesaikan nilai
    yang didukung SecretRef.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Validasi:

    - signing secret
    - path webhook
    - URL Permintaan Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` unik per akun HTTP

    Jika `signingSecretStatus: "configured_unavailable"` muncul di snapshot
    akun, akun HTTP tersebut dikonfigurasi tetapi runtime saat ini tidak dapat
    menyelesaikan signing secret yang didukung SecretRef.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Verifikasi apakah yang Anda maksud adalah:

    - mode perintah native (`channels.slack.commands.native: true`) dengan perintah slash yang cocok terdaftar di Slack
    - atau mode perintah slash tunggal (`channels.slack.slashCommand.enabled: true`)

    Periksa juga `commands.useAccessGroups` dan allowlist kanal/pengguna.

  </Accordion>
</AccordionGroup>

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pair pengguna Slack ke gateway.
  </Card>
  <Card title="Groups" icon="users" href="/id/channels/groups">
    Perilaku kanal dan DM grup.
  </Card>
  <Card title="Channel routing" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Security" icon="shield" href="/id/gateway/security">
    Model ancaman dan hardening.
  </Card>
  <Card title="Configuration" icon="sliders" href="/id/gateway/configuration">
    Tata letak dan prioritas konfigurasi.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Katalog dan perilaku perintah.
  </Card>
</CardGroup>
