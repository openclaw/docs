---
read_when:
    - Menyiapkan Slack atau men-debug mode socket/HTTP Slack
summary: Penyiapan Slack dan perilaku runtime (Socket Mode + URL Permintaan HTTP)
title: Slack
x-i18n:
    generated_at: "2026-04-21T17:45:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30b372a3ae10b7b649532181306e42792aca76b41422516e9633eb79f73f009
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: siap produksi untuk DM + channel melalui integrasi aplikasi Slack. Mode default adalah Socket Mode; URL Permintaan HTTP juga didukung.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM Slack secara default menggunakan mode pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas-channel dan playbook perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Buat aplikasi Slack baru">
        Di pengaturan aplikasi Slack, tekan tombol **[Create New App](https://api.slack.com/apps/new)**:

        - pilih **from a manifest** dan pilih workspace untuk aplikasi Anda
        - tempel [contoh manifest](#manifest-and-scope-checklist) dari bawah lalu lanjutkan untuk membuat
        - hasilkan **App-Level Token** (`xapp-...`) dengan `connections:write`
        - instal aplikasi lalu salin **Bot Token** (`xoxb-...`) yang ditampilkan
      </Step>

      <Step title="Konfigurasikan OpenClaw">

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

      <Step title="Mulai gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Buat aplikasi Slack baru">
        Di pengaturan aplikasi Slack, tekan tombol **[Create New App](https://api.slack.com/apps/new)**:

        - pilih **from a manifest** dan pilih workspace untuk aplikasi Anda
        - tempel [contoh manifest](#manifest-and-scope-checklist) lalu perbarui URL sebelum membuat
        - simpan **Signing Secret** untuk verifikasi permintaan
        - instal aplikasi lalu salin **Bot Token** (`xoxb-...`) yang ditampilkan

      </Step>

      <Step title="Konfigurasikan OpenClaw">

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
        Gunakan jalur webhook unik untuk HTTP multi-akun

        Beri setiap akun `webhookPath` yang berbeda (default `/slack/events`) agar pendaftaran tidak bertabrakan.
        </Note>

      </Step>

      <Step title="Mulai gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Daftar periksa manifest dan scope

<Tabs>
  <Tab title="Socket Mode (default)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Konektor Slack untuk OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Kirim pesan ke OpenClaw",
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

  </Tab>

  <Tab title="HTTP Request URLs">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Konektor Slack untuk OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Kirim pesan ke OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### Pengaturan manifest tambahan

Tampilkan fitur berbeda yang memperluas default di atas.

<AccordionGroup>
  <Accordion title="Slash command native opsional">

    Beberapa [slash command native](#commands-and-slash-behavior) dapat digunakan sebagai pengganti satu perintah yang dikonfigurasi, dengan beberapa nuansa:

    - Gunakan `/agentstatus` alih-alih `/status` karena perintah `/status` dicadangkan.
    - Tidak lebih dari 25 slash command dapat disediakan sekaligus.

    Ganti bagian `features.slash_commands` yang ada dengan subset dari [perintah yang tersedia](/id/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Mulai sesi baru",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Setel ulang sesi saat ini"
      },
      {
        "command": "/compact",
        "description": "Compact konteks sesi",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Hentikan run saat ini"
      },
      {
        "command": "/session",
        "description": "Kelola kedaluwarsa pengikatan thread",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Atur level pemikiran",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Alihkan output verbose",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Tampilkan atau atur mode cepat",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Alihkan visibilitas reasoning",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Alihkan mode elevated",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Tampilkan atau atur default exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Tampilkan atau atur model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "Daftarkan provider atau model untuk provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Tampilkan ringkasan bantuan singkat"
      },
      {
        "command": "/commands",
        "description": "Tampilkan katalog perintah yang dihasilkan"
      },
      {
        "command": "/tools",
        "description": "Tampilkan yang dapat digunakan agent saat ini",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Tampilkan status runtime, termasuk penggunaan/kuota provider saat tersedia"
      },
      {
        "command": "/tasks",
        "description": "Daftarkan task latar belakang aktif/terbaru untuk sesi saat ini"
      },
      {
        "command": "/context",
        "description": "Jelaskan bagaimana konteks disusun",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Tampilkan identitas pengirim Anda"
      },
      {
        "command": "/skill",
        "description": "Jalankan Skills berdasarkan nama",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ajukan pertanyaan sampingan tanpa mengubah konteks sesi",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Kendalikan footer penggunaan atau tampilkan ringkasan biaya",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Mulai sesi baru",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Setel ulang sesi saat ini",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Compact konteks sesi",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Hentikan run saat ini",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Kelola kedaluwarsa pengikatan thread",
        "usage_hint": "idle <duration|off> or max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Atur level pemikiran",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Alihkan output verbose",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Tampilkan atau atur mode cepat",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Alihkan visibilitas reasoning",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Alihkan mode elevated",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Tampilkan atau atur default exec",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Tampilkan atau atur model",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Daftarkan provider atau model untuk suatu provider",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Tampilkan ringkasan bantuan singkat",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Tampilkan katalog perintah yang dihasilkan",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Tampilkan yang dapat digunakan agent saat ini",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Tampilkan status runtime, termasuk penggunaan/kuota provider saat tersedia",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Daftarkan task latar belakang aktif/terbaru untuk sesi saat ini",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Jelaskan bagaimana konteks disusun",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Tampilkan identitas pengirim Anda",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Jalankan Skills berdasarkan nama",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Ajukan pertanyaan sampingan tanpa mengubah konteks sesi",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Kendalikan footer penggunaan atau tampilkan ringkasan biaya",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Scope penulisan atribusi opsional (operasi tulis)">
    Tambahkan bot scope `chat:write.customize` jika Anda ingin pesan keluar menggunakan identitas agent aktif (nama pengguna dan ikon kustom) alih-alih identitas default aplikasi Slack.

    Jika Anda menggunakan ikon emoji, Slack mengharapkan sintaks `:emoji_name:`.
  </Accordion>
  <Accordion title="Scope user-token opsional (operasi baca)">
    Jika Anda mengonfigurasi `channels.slack.userToken`, scope baca yang umum adalah:

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

- `botToken` + `appToken` wajib untuk Socket Mode.
- Mode HTTP memerlukan `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima string plaintext
  atau objek SecretRef.
- Token konfigurasi mengesampingkan fallback env.
- Fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` hanya berlaku untuk akun default.
- `userToken` (`xoxp-...`) hanya untuk config (tanpa fallback env) dan default ke perilaku hanya-baca (`userTokenReadOnly: true`).

Perilaku snapshot status:

- Inspeksi akun Slack melacak field `*Source` dan `*Status` per kredensial
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status adalah `available`, `configured_unavailable`, atau `missing`.
- `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef
  atau sumber secret non-inline lainnya, tetapi jalur perintah/runtime saat ini
  tidak dapat menyelesaikan nilai aktual.
- Dalam mode HTTP, `signingSecretStatus` disertakan; dalam Socket Mode,
  pasangan yang diperlukan adalah `botTokenStatus` + `appTokenStatus`.

<Tip>
Untuk tindakan/pembacaan direktori, user token dapat diprioritaskan saat dikonfigurasi. Untuk penulisan, bot token tetap diprioritaskan; penulisan dengan user token hanya diizinkan saat `userTokenReadOnly: false` dan bot token tidak tersedia.
</Tip>

## Tindakan dan gate

Tindakan Slack dikendalikan oleh `channels.slack.actions.*`.

Grup tindakan yang tersedia dalam tooling Slack saat ini:

| Group      | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Tindakan pesan Slack saat ini mencakup `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, dan `emoji-list`.

## Kontrol akses dan routing

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.slack.dmPolicy` mengendalikan akses DM (legacy: `channels.slack.dm.policy`):

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.slack.allowFrom` untuk menyertakan `"*"`; legacy: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (default true)
    - `channels.slack.allowFrom` (lebih disukai)
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (default DM grup false)
    - `dm.groupChannels` (allowlist MPIM opsional)

    Prioritas multi-akun:

    - `channels.slack.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Akun bernama mewarisi `channels.slack.allowFrom` ketika `allowFrom` milik mereka sendiri tidak disetel.
    - Akun bernama tidak mewarisi `channels.slack.accounts.default.allowFrom`.

    Pairing di DM menggunakan `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kebijakan channel">
    `channels.slack.groupPolicy` mengendalikan penanganan channel:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist channel berada di bawah `channels.slack.channels` dan harus menggunakan ID channel yang stabil.

    Catatan runtime: jika `channels.slack` sepenuhnya tidak ada (penyiapan hanya-env), runtime fallback ke `groupPolicy="allowlist"` dan mencatat peringatan (bahkan jika `channels.defaults.groupPolicy` disetel).

    Resolusi nama/ID:

    - entri allowlist channel dan entri allowlist DM di-resolve saat startup ketika akses token mengizinkan
    - entri nama channel yang tidak ter-resolve tetap disimpan sebagaimana dikonfigurasi tetapi secara default diabaikan untuk routing
    - otorisasi masuk dan routing channel secara default mengutamakan ID; pencocokan langsung nama pengguna/slug memerlukan `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mention dan pengguna channel">
    Pesan channel secara default digate oleh mention.

    Sumber mention:

    - mention aplikasi eksplisit (`<@botId>`)
    - pola regex mention (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku implisit thread balasan-ke-bot (dinonaktifkan saat `thread.requireExplicitMention` adalah `true`)

    Kontrol per-channel (`channels.slack.channels.<id>`; nama hanya melalui resolusi startup atau `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format key `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, atau wildcard `"*"`
      (key legacy tanpa prefiks tetap dipetakan hanya ke `id:`)

  </Tab>
</Tabs>

## Threading, sesi, dan tag balasan

- DM dirutekan sebagai `direct`; channel sebagai `channel`; MPIM sebagai `group`.
- Dengan default `session.dmScope=main`, DM Slack digabungkan ke sesi utama agent.
- Sesi channel: `agent:<agentId>:slack:channel:<channelId>`.
- Balasan thread dapat membuat sufiks sesi thread (`:thread:<threadTs>`) bila berlaku.
- Default `channels.slack.thread.historyScope` adalah `thread`; default `thread.inheritParent` adalah `false`.
- `channels.slack.thread.initialHistoryLimit` mengendalikan berapa banyak pesan thread yang sudah ada diambil saat sesi thread baru dimulai (default `20`; setel `0` untuk menonaktifkan).
- `channels.slack.thread.requireExplicitMention` (default `false`): saat `true`, mention thread implisit disupresi sehingga bot hanya merespons mention `@bot` eksplisit di dalam thread, bahkan ketika bot sudah berpartisipasi dalam thread tersebut. Tanpa ini, balasan dalam thread yang diikuti bot melewati gate `requireMention`.

Kontrol threading balasan:

- `channels.slack.replyToMode`: `off|first|all|batched` (default `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy untuk chat langsung: `channels.slack.dm.replyToMode`

Tag balasan manual didukung:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Catatan: `replyToMode="off"` menonaktifkan **semua** threading balasan di Slack, termasuk tag `[[reply_to_*]]` eksplisit. Ini berbeda dari Telegram, yang masih menghormati tag eksplisit dalam mode `"off"`. Perbedaan ini mencerminkan model threading platform: thread Slack menyembunyikan pesan dari channel, sedangkan balasan Telegram tetap terlihat dalam alur chat utama.

## Reaksi ack

`ackReaction` mengirim emoji pengakuan saat OpenClaw sedang memproses pesan masuk.

Urutan resolusi:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agent (`agents.list[].identity.emoji`, jika tidak `"👀"`)

Catatan:

- Slack mengharapkan shortcode (misalnya `"eyes"`).
- Gunakan `""` untuk menonaktifkan reaksi bagi akun Slack atau secara global.

## Streaming teks

`channels.slack.streaming` mengendalikan perilaku pratinjau langsung:

- `off`: nonaktifkan streaming pratinjau langsung.
- `partial` (default): ganti teks pratinjau dengan output parsial terbaru.
- `block`: tambahkan pembaruan pratinjau yang dipotong per chunk.
- `progress`: tampilkan teks status progres saat menghasilkan, lalu kirim teks final.
- `streaming.preview.toolProgress`: saat pratinjau draf aktif, rutekan pembaruan tool/progres ke pesan pratinjau hasil edit yang sama (default: `true`). Setel `false` untuk mempertahankan pesan tool/progres terpisah.

`channels.slack.streaming.nativeTransport` mengendalikan streaming teks native Slack saat `channels.slack.streaming.mode` adalah `partial` (default: `true`).

- Thread balasan harus tersedia agar streaming teks native dan status thread assistant Slack dapat muncul. Pemilihan thread tetap mengikuti `replyToMode`.
- Root channel dan chat grup tetap dapat menggunakan pratinjau draf normal saat streaming native tidak tersedia.
- DM Slack tingkat atas secara default tetap di luar thread, sehingga tidak menampilkan pratinjau bergaya thread; gunakan balasan thread atau `typingReaction` jika Anda ingin progres terlihat di sana.
- Payload media dan non-teks fallback ke pengiriman normal.
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

Key legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) dimigrasikan otomatis ke `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` dimigrasikan otomatis ke `channels.slack.streaming.mode` dan `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` legacy dimigrasikan otomatis ke `channels.slack.streaming.nativeTransport`.

## Fallback reaksi mengetik

`typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat OpenClaw sedang memproses balasan, lalu menghapusnya saat run selesai. Ini paling berguna di luar balasan thread, yang menggunakan indikator status default "is typing...".

Urutan resolusi:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Catatan:

- Slack mengharapkan shortcode (misalnya `"hourglass_flowing_sand"`).
- Reaksi ini bersifat best-effort dan pembersihan dicoba secara otomatis setelah jalur balasan atau kegagalan selesai.

## Media, chunking, dan pengiriman

<AccordionGroup>
  <Accordion title="Lampiran masuk">
    Lampiran file Slack diunduh dari URL privat yang di-host Slack (alur permintaan terautentikasi token) dan ditulis ke penyimpanan media saat pengambilan berhasil dan batas ukuran mengizinkan.

    Batas ukuran masuk runtime default adalah `20MB` kecuali dioverride oleh `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Teks dan file keluar">
    - chunk teks menggunakan `channels.slack.textChunkLimit` (default 4000)
    - `channels.slack.chunkMode="newline"` mengaktifkan pemisahan yang mengutamakan paragraf
    - pengiriman file menggunakan API upload Slack dan dapat menyertakan balasan thread (`thread_ts`)
    - batas media keluar mengikuti `channels.slack.mediaMaxMb` saat dikonfigurasi; jika tidak, pengiriman channel menggunakan default jenis MIME dari pipeline media
  </Accordion>

  <Accordion title="Target pengiriman">
    Target eksplisit yang disarankan:

    - `user:<id>` untuk DM
    - `channel:<id>` untuk channel

    DM Slack dibuka melalui API percakapan Slack saat mengirim ke target pengguna.

  </Accordion>
</AccordionGroup>

## Perintah dan perilaku slash

Slash command muncul di Slack sebagai satu perintah yang dikonfigurasi atau beberapa perintah native. Konfigurasikan `channels.slack.slashCommand` untuk mengubah default perintah:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Perintah native memerlukan [pengaturan manifest tambahan](#additional-manifest-settings) di aplikasi Slack Anda dan diaktifkan dengan `channels.slack.commands.native: true` atau `commands.native: true` dalam konfigurasi global sebagai gantinya.

- Mode otomatis perintah native adalah **off** untuk Slack sehingga `commands.native: "auto"` tidak mengaktifkan perintah native Slack.

```txt
/help
```

Menu argumen native menggunakan strategi rendering adaptif yang menampilkan modal konfirmasi sebelum mengirim nilai opsi yang dipilih:

- hingga 5 opsi: blok tombol
- 6-100 opsi: menu pilih statis
- lebih dari 100 opsi: pilihan eksternal dengan pemfilteran opsi async saat handler opsi interaktivitas tersedia
- melebihi batas Slack: nilai opsi yang dienkode fallback ke tombol

```txt
/think
```

Sesi slash menggunakan key terisolasi seperti `agent:<agentId>:slack:slash:<userId>` dan tetap merutekan eksekusi perintah ke sesi percakapan target menggunakan `CommandTargetSessionKey`.

## Balasan interaktif

Slack dapat merender kontrol balasan interaktif yang dibuat agent, tetapi fitur ini dinonaktifkan secara default.

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

Saat diaktifkan, agent dapat menghasilkan direktif balasan khusus Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Direktif ini dikompilasi menjadi Slack Block Kit dan merutekan klik atau pilihan kembali melalui jalur event interaksi Slack yang ada.

Catatan:

- Ini adalah UI khusus Slack. Channel lain tidak menerjemahkan direktif Slack Block Kit ke sistem tombol mereka sendiri.
- Nilai callback interaktif adalah token buram yang dihasilkan OpenClaw, bukan nilai mentah yang dibuat agent.
- Jika blok interaktif yang dihasilkan akan melebihi batas Slack Block Kit, OpenClaw fallback ke balasan teks asli alih-alih mengirim payload blocks yang tidak valid.

## Persetujuan exec di Slack

Slack dapat bertindak sebagai klien persetujuan native dengan tombol dan interaksi interaktif, alih-alih fallback ke UI Web atau terminal.

- Persetujuan exec menggunakan `channels.slack.execApprovals.*` untuk routing DM/channel native.
- Persetujuan Plugin masih dapat di-resolve melalui permukaan tombol native Slack yang sama saat permintaan sudah masuk ke Slack dan jenis id persetujuannya adalah `plugin:`.
- Otorisasi approver tetap diterapkan: hanya pengguna yang diidentifikasi sebagai approver yang dapat menyetujui atau menolak permintaan melalui Slack.

Ini menggunakan permukaan tombol persetujuan bersama yang sama seperti channel lainnya. Saat `interactivity` diaktifkan di pengaturan aplikasi Slack Anda, prompt persetujuan dirender sebagai tombol Block Kit langsung di percakapan.
Saat tombol tersebut ada, itu menjadi UX persetujuan utama; OpenClaw
hanya boleh menyertakan perintah `/approve` manual ketika hasil tool mengatakan persetujuan chat
tidak tersedia atau persetujuan manual adalah satu-satunya jalur.

Jalur config:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opsional; fallback ke `commands.ownerAllowFrom` bila memungkinkan)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `agentFilter`, `sessionFilter`

Slack otomatis mengaktifkan persetujuan exec native saat `enabled` tidak disetel atau `"auto"` dan setidaknya satu
approver berhasil di-resolve. Setel `enabled: false` untuk menonaktifkan Slack secara eksplisit sebagai klien persetujuan native.
Setel `enabled: true` untuk memaksa persetujuan native aktif saat approver berhasil di-resolve.

Perilaku default tanpa config persetujuan exec Slack eksplisit:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Config native Slack eksplisit hanya diperlukan saat Anda ingin mengoverride approver, menambahkan filter, atau
memilih pengiriman origin-chat:

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

Penerusan bersama `approvals.exec` bersifat terpisah. Gunakan ini hanya ketika prompt persetujuan exec juga harus
dirutekan ke chat lain atau target out-of-band eksplisit. Penerusan bersama `approvals.plugin` juga
terpisah; tombol native Slack masih dapat me-resolve persetujuan plugin ketika permintaan tersebut sudah masuk
ke Slack.

`/approve` di chat yang sama juga berfungsi di channel dan DM Slack yang sudah mendukung perintah. Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk model penerusan persetujuan lengkap.

## Event dan perilaku operasional

- Edit/hapus pesan/siaran thread dipetakan ke event sistem.
- Event tambah/hapus reaksi dipetakan ke event sistem.
- Event anggota bergabung/keluar, channel dibuat/diubah namanya, dan tambah/hapus pin dipetakan ke event sistem.
- `channel_id_changed` dapat memigrasikan key config channel saat `configWrites` diaktifkan.
- Metadata topik/tujuan channel diperlakukan sebagai konteks tak tepercaya dan dapat diinjeksi ke konteks routing.
- Starter thread dan penyemaian konteks riwayat thread awal difilter oleh allowlist pengirim yang dikonfigurasi bila berlaku.
- Tindakan blok dan interaksi modal menghasilkan event sistem terstruktur `Slack interaction: ...` dengan field payload kaya:
  - tindakan blok: nilai yang dipilih, label, nilai picker, dan metadata `workflow_*`
  - event modal `view_submission` dan `view_closed` dengan metadata channel terarah dan input formulir

## Pointer referensi konfigurasi

Referensi utama:

- [Referensi konfigurasi - Slack](/id/gateway/configuration-reference#slack)

  Field Slack dengan sinyal tinggi:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - akses DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - toggle kompatibilitas: `dangerouslyAllowNameMatching` (break-glass; biarkan nonaktif kecuali diperlukan)
  - akses channel: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/riwayat: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - operasi/fitur: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada balasan di channel">
    Periksa, secara berurutan:

    - `groupPolicy`
    - allowlist channel (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` per-channel

    Perintah yang berguna:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Pesan DM diabaikan">
    Periksa:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (atau legacy `channels.slack.dm.policy`)
    - persetujuan pairing / entri allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Mode socket tidak terhubung">
    Validasi token bot + app dan pengaktifan Socket Mode di pengaturan aplikasi Slack.

    Jika `openclaw channels status --probe --json` menampilkan `botTokenStatus` atau
    `appTokenStatus: "configured_unavailable"`, akun Slack tersebut
    telah dikonfigurasi tetapi runtime saat ini tidak dapat me-resolve nilai
    yang didukung SecretRef.

  </Accordion>

  <Accordion title="Mode HTTP tidak menerima event">
    Validasi:

    - signing secret
    - jalur webhook
    - URL Permintaan Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` unik per akun HTTP

    Jika `signingSecretStatus: "configured_unavailable"` muncul dalam snapshot
    akun, akun HTTP tersebut telah dikonfigurasi tetapi runtime saat ini tidak dapat
    me-resolve signing secret yang didukung SecretRef.

  </Accordion>

  <Accordion title="Perintah native/slash tidak berjalan">
    Verifikasi apakah yang Anda maksud adalah:

    - mode perintah native (`channels.slack.commands.native: true`) dengan slash command yang sesuai terdaftar di Slack
    - atau mode satu slash command (`channels.slack.slashCommand.enabled: true`)

    Periksa juga `commands.useAccessGroups` dan allowlist channel/pengguna.

  </Accordion>
</AccordionGroup>

## Terkait

- [Pairing](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Keamanan](/id/gateway/security)
- [Routing channel](/id/channels/channel-routing)
- [Pemecahan masalah](/id/channels/troubleshooting)
- [Konfigurasi](/id/gateway/configuration)
- [Slash commands](/id/tools/slash-commands)
