---
read_when:
    - Menyiapkan Slack atau memecahkan masalah mode soket/HTTP Slack
summary: Penyiapan Slack dan perilaku saat berjalan (Mode Soket + URL Permintaan HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-11T20:21:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34e740fd5cb0ca936edce1843316cde17570d77778bdf4fc761cad77c51ee9cf
    source_path: channels/slack.md
    workflow: 16
---

Siap produksi untuk DM dan kanal melalui integrasi aplikasi Slack. Mode default adalah Socket Mode; HTTP Request URLs juga didukung.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    DM Slack secara default menggunakan mode pemasangan.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah kanal" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas kanal dan playbook perbaikan.
  </Card>
</CardGroup>

## Memilih Socket Mode atau HTTP Request URLs

Kedua transport siap produksi dan mencapai paritas fitur untuk perpesanan, perintah slash, App Home, dan interaktivitas. Pilih berdasarkan bentuk deployment, bukan fitur.

| Pertimbangan                 | Socket Mode (default)                                                               | HTTP Request URLs                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| URL Gateway publik           | Tidak diperlukan                                                                     | Diperlukan (DNS, TLS, reverse proxy atau tunnel)                                                                  |
| Jaringan keluar              | WSS keluar ke `wss-primary.slack.com` harus dapat dijangkau                          | Tidak ada WS keluar; hanya HTTPS masuk                                                                            |
| Token yang diperlukan        | Token bot (`xoxb-...`) + App-Level Token (`xapp-...`) dengan `connections:write`     | Token bot (`xoxb-...`) + Signing Secret                                                                           |
| Laptop dev / di balik firewall | Berfungsi apa adanya                                                               | Memerlukan tunnel publik (ngrok, Cloudflare Tunnel, Tailscale Funnel) atau Gateway staging                        |
| Penskalaan horizontal        | Satu sesi Socket Mode per aplikasi per host; beberapa Gateway memerlukan aplikasi Slack terpisah | Handler POST stateless; beberapa replika Gateway dapat berbagi satu aplikasi di balik load balancer       |
| Multi-akun pada satu Gateway | Didukung; setiap akun membuka WS-nya sendiri                                         | Didukung; setiap akun memerlukan `webhookPath` unik (default `/slack/events`) agar registrasi tidak bertabrakan   |
| Transport perintah slash     | Dikirim melalui koneksi WS; `slash_commands[].url` diabaikan                         | Slack mengirim POST ke `slash_commands[].url`; field ini diperlukan agar perintah dikirim                         |
| Penandatanganan request      | Tidak digunakan (auth adalah App-Level Token)                                        | Slack menandatangani setiap request; OpenClaw memverifikasi dengan `signingSecret`                                |
| Pemulihan saat koneksi terputus | Slack SDK otomatis menyambung ulang; tuning transport pong-timeout gateway berlaku | Tidak ada koneksi persisten yang dapat terputus; retry dilakukan per request dari Slack                           |

<Note>
  **Pilih Socket Mode** untuk host Gateway tunggal, laptop dev, dan jaringan on-prem yang dapat menjangkau `*.slack.com` keluar tetapi tidak dapat menerima HTTPS masuk.

**Pilih HTTP Request URLs** saat menjalankan beberapa replika Gateway di balik load balancer, ketika WSS keluar diblokir tetapi HTTPS masuk diizinkan, atau ketika Anda sudah menghentikan webhook Slack di reverse proxy.
</Note>

## Penyiapan cepat

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Buat aplikasi Slack baru">
        Buka [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → pilih workspace Anda → tempel salah satu manifest di bawah → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
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

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** cocok dengan rangkaian fitur lengkap Plugin Slack bawaan: App Home, perintah slash, file, reaction, pin, DM grup, dan pembacaan emoji/usergroup. Pilih **Minimal** ketika kebijakan workspace membatasi scope — ini mencakup DM, riwayat kanal/grup, mention, dan perintah slash tetapi menghapus file, reaction, pin, DM grup (`mpim:*`), `emoji:read`, dan `usergroups:read`. Lihat [Checklist manifest dan scope](#manifest-and-scope-checklist) untuk alasan per scope dan opsi aditif seperti perintah slash tambahan.
        </Note>

        Setelah Slack membuat aplikasi:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: tambahkan `connections:write`, simpan, salin nilai `xapp-...`.
        - **Install App → Install to Workspace**: salin `xoxb-...` Bot User OAuth Token.

      </Step>

      <Step title="Konfigurasi OpenClaw">

        Penyiapan SecretRef yang direkomendasikan:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
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
        Buka [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → pilih workspace Anda → tempel salah satu manifest di bawah → ganti `https://gateway-host.example.com/slack/events` dengan URL Gateway publik Anda → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
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

```json Minimal
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **Direkomendasikan** cocok dengan rangkaian fitur lengkap Plugin Slack bawaan; **Minimal** menghilangkan file, reaksi, pin, DM grup (`mpim:*`), `emoji:read`, dan `usergroups:read` untuk workspace yang ketat. Lihat [Daftar periksa manifes dan cakupan](#manifest-and-scope-checklist) untuk alasan per cakupan.
        </Note>

        <Info>
          Ketiga bidang URL (`slash_commands[].url`, `event_subscriptions.request_url`, dan `interactivity.request_url` / `message_menu_options_url`) semuanya mengarah ke endpoint OpenClaw yang sama. Skema manifes Slack mengharuskannya diberi nama secara terpisah, tetapi OpenClaw merutekan berdasarkan jenis payload sehingga satu `webhookPath` (default `/slack/events`) sudah cukup. Perintah slash tanpa `slash_commands[].url` akan diam-diam tidak melakukan apa pun dalam mode HTTP.
        </Info>

        Setelah Slack membuat aplikasi:

        - **Basic Information → App Credentials**: salin **Signing Secret** untuk verifikasi permintaan.
        - **Install App → Install to Workspace**: salin Token OAuth Pengguna Bot `xoxb-...`.

      </Step>

      <Step title="Configure OpenClaw">

        Penyiapan SecretRef yang direkomendasikan:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Gunakan path Webhook unik untuk HTTP multi-akun

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

## Penyetelan transport Mode Socket

OpenClaw mengatur batas waktu pong klien SDK Slack menjadi 15 detik secara default untuk Mode Socket. Timpa pengaturan transport hanya saat Anda membutuhkan penyetelan khusus workspace atau host:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Gunakan ini hanya untuk workspace Mode Socket yang mencatat batas waktu pong websocket Slack/server-ping atau berjalan pada host dengan kelaparan event-loop yang diketahui. `clientPingTimeout` adalah waktu tunggu pong setelah SDK mengirim ping klien; `serverPingTimeout` adalah waktu tunggu untuk ping server Slack. Pesan dan peristiwa aplikasi tetap merupakan status aplikasi, bukan sinyal keaktifan transport.

## Daftar periksa manifes dan cakupan

Manifes aplikasi Slack dasar sama untuk Mode Socket dan URL Permintaan HTTP. Hanya blok `settings` (dan `url` perintah slash) yang berbeda.

Manifes dasar (default Mode Socket):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
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

Untuk **mode URL Permintaan HTTP**, ganti `settings` dengan varian HTTP dan tambahkan `url` ke setiap perintah slash. URL publik wajib:

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
        "app_home_opened",
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

### Pengaturan manifes tambahan

Munculkan fitur berbeda yang memperluas default di atas.

Manifes default mengaktifkan tab **Home** Slack App Home dan berlangganan `app_home_opened`. Saat anggota workspace membuka tab Home, OpenClaw menerbitkan tampilan Home default yang aman dengan `views.publish`; tidak ada payload percakapan atau konfigurasi privat yang disertakan. Tab **Messages** tetap diaktifkan untuk DM Slack.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Beberapa [perintah slash native](#commands-and-slash-behavior) dapat digunakan alih-alih satu perintah yang dikonfigurasi dengan nuansa:

    - Gunakan `/agentstatus` alih-alih `/status` karena perintah `/status` dicadangkan.
    - Tidak lebih dari 25 perintah slash dapat disediakan sekaligus.

    Ganti bagian `features.slash_commands` yang ada dengan subset [perintah yang tersedia](/id/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
{
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
      "description": "List providers/models",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
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
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Gunakan daftar `slash_commands` yang sama seperti Mode Socket di atas, dan tambahkan `"url": "https://gateway-host.example.com/slack/events"` ke setiap entri. Contoh:

```json
{
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
  ]
}
```

        Ulangi nilai `url` tersebut pada setiap perintah dalam daftar.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Cakupan kepengarangan opsional (operasi tulis)">
    Tambahkan cakupan bot `chat:write.customize` jika Anda ingin pesan keluar menggunakan identitas agen aktif (nama pengguna dan ikon kustom) alih-alih identitas aplikasi Slack default.

    Jika Anda menggunakan ikon emoji, Slack mengharapkan sintaks `:emoji_name:`.

  </Accordion>
  <Accordion title="Cakupan token pengguna opsional (operasi baca)">
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
- `userToken` (`xoxp-...`) hanya konfigurasi (tanpa fallback env) dan default-nya adalah perilaku baca saja (`userTokenReadOnly: true`).

Perilaku snapshot status:

- Inspeksi akun Slack melacak kolom `*Source` dan `*Status`
  per kredensial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status adalah `available`, `configured_unavailable`, atau `missing`.
- `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef
  atau sumber rahasia non-inline lain, tetapi jalur perintah/runtime saat ini
  tidak dapat menyelesaikan nilai sebenarnya.
- Dalam mode HTTP, `signingSecretStatus` disertakan; dalam Socket Mode,
  pasangan yang diperlukan adalah `botTokenStatus` + `appTokenStatus`.

<Tip>
Untuk aksi/pembacaan direktori, token pengguna dapat diprioritaskan saat dikonfigurasi. Untuk penulisan, token bot tetap diprioritaskan; penulisan token pengguna hanya diizinkan ketika `userTokenReadOnly: false` dan token bot tidak tersedia.
</Tip>

## Aksi dan gerbang

Aksi Slack dikontrol oleh `channels.slack.actions.*`.

Grup aksi yang tersedia di tooling Slack saat ini:

| Grup       | Default |
| ---------- | ------- |
| messages   | aktif   |
| reactions  | aktif   |
| pins       | aktif   |
| memberInfo | aktif   |
| emojiList  | aktif   |

Aksi pesan Slack saat ini mencakup `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, dan `emoji-list`. `download-file` menerima ID file Slack yang ditampilkan di placeholder file masuk dan mengembalikan pratinjau gambar untuk gambar atau metadata file lokal untuk jenis file lain.

## Kontrol akses dan routing

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.slack.dmPolicy` mengontrol akses DM. `channels.slack.allowFrom` adalah allowlist DM kanonis.

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.slack.allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (default true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (DM grup default false)
    - `dm.groupChannels` (allowlist MPIM opsional)

    Presedensi multi-akun:

    - `channels.slack.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Akun bernama mewarisi `channels.slack.allowFrom` ketika `allowFrom` miliknya sendiri tidak disetel.
    - Akun bernama tidak mewarisi `channels.slack.accounts.default.allowFrom`.

    Legacy `channels.slack.dm.policy` dan `channels.slack.dm.allowFrom` masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` ketika dapat melakukannya tanpa mengubah akses.

    Pairing di DM menggunakan `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kebijakan channel">
    `channels.slack.groupPolicy` mengontrol penanganan channel:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist channel berada di bawah `channels.slack.channels` dan **harus menggunakan ID channel Slack yang stabil** (misalnya `C12345678`) sebagai kunci konfigurasi.

    Catatan runtime: jika `channels.slack` benar-benar tidak ada (setup hanya env), runtime melakukan fallback ke `groupPolicy="allowlist"` dan mencatat peringatan (bahkan jika `channels.defaults.groupPolicy` disetel).

    Resolusi nama/ID:

    - entri allowlist channel dan entri allowlist DM diselesaikan saat startup ketika akses token memungkinkan
    - entri nama channel yang tidak terselesaikan dipertahankan sesuai konfigurasi tetapi diabaikan untuk routing secara default
    - otorisasi masuk dan routing channel secara default mengutamakan ID; pencocokan nama pengguna/slug langsung memerlukan `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Kunci berbasis nama (`#channel-name` atau `channel-name`) **tidak** cocok di bawah `groupPolicy: "allowlist"`. Pencarian channel secara default mengutamakan ID, sehingga kunci berbasis nama tidak akan pernah berhasil dirutekan dan semua pesan di channel tersebut akan diblokir diam-diam. Ini berbeda dari `groupPolicy: "open"`, tempat kunci channel tidak diperlukan untuk routing dan kunci berbasis nama tampak berfungsi.

    Selalu gunakan ID channel Slack sebagai kunci. Untuk menemukannya: klik kanan channel di Slack → **Copy link** — ID (`C...`) muncul di akhir URL.

    Benar:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    Salah (diblokir diam-diam di bawah `groupPolicy: "allowlist"`):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mention dan pengguna channel">
    Pesan channel secara default digerbangi mention.

    Sumber mention:

    - mention aplikasi eksplisit (`<@botId>`)
    - mention grup pengguna Slack (`<!subteam^S...>`) ketika pengguna bot adalah anggota grup pengguna tersebut; memerlukan `usergroups:read`
    - pola regex mention (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku thread balas-ke-bot implisit (dinonaktifkan ketika `thread.requireExplicitMention` adalah `true`)

    Kontrol per channel (`channels.slack.channels.<id>`; nama hanya melalui resolusi startup atau `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format kunci `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, atau wildcard `"*"`
      (kunci legacy tanpa prefiks tetap hanya dipetakan ke `id:`)

    `allowBots` bersifat konservatif untuk channel dan channel privat: pesan ruang yang dibuat bot hanya diterima ketika bot pengirim tercantum secara eksplisit dalam allowlist `users` ruang tersebut, atau ketika setidaknya satu ID pemilik Slack eksplisit dari `channels.slack.allowFrom` saat ini merupakan anggota ruang. Wildcard dan entri pemilik berbasis nama tampilan tidak memenuhi kehadiran pemilik. Kehadiran pemilik menggunakan Slack `conversations.members`; pastikan aplikasi memiliki cakupan baca yang sesuai untuk jenis ruang (`channels:read` untuk channel publik, `groups:read` untuk channel privat). Jika pencarian anggota gagal, OpenClaw membuang pesan ruang yang dibuat bot.

  </Tab>
</Tabs>

## Thread, sesi, dan tag balasan

- DM dirutekan sebagai `direct`; channel sebagai `channel`; MPIM sebagai `group`.
- Binding rute Slack menerima ID peer mentah plus bentuk target Slack seperti `channel:C12345678`, `user:U12345678`, dan `<@U12345678>`.
- Dengan default `session.dmScope=main`, DM Slack diciutkan ke sesi utama agen.
- Sesi channel: `agent:<agentId>:slack:channel:<channelId>`.
- Balasan thread dapat membuat suffix sesi thread (`:thread:<threadTs>`) jika berlaku.
- Di channel tempat OpenClaw menangani pesan tingkat atas tanpa memerlukan mention eksplisit, `replyToMode` non-`off` merutekan setiap root yang ditangani ke `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` sehingga thread Slack yang terlihat dipetakan ke satu sesi OpenClaw sejak giliran pertama.
- Default `channels.slack.thread.historyScope` adalah `thread`; default `thread.inheritParent` adalah `false`.
- `channels.slack.thread.initialHistoryLimit` mengontrol berapa banyak pesan thread yang sudah ada yang diambil ketika sesi thread baru dimulai (default `20`; setel `0` untuk menonaktifkan).
- `channels.slack.thread.requireExplicitMention` (default `false`): ketika `true`, menekan mention thread implisit sehingga bot hanya merespons mention `@bot` eksplisit di dalam thread, bahkan ketika bot sudah berpartisipasi dalam thread. Tanpa ini, balasan dalam thread yang diikuti bot melewati gating `requireMention`.

Kontrol threading balasan:

- `channels.slack.replyToMode`: `off|first|all|batched` (default `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy untuk chat langsung: `channels.slack.dm.replyToMode`

Tag balasan manual didukung:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Untuk balasan thread Slack eksplisit dari tool `message`, setel `replyBroadcast: true` dengan `action: "send"` dan `threadId` atau `replyTo` untuk meminta Slack juga menyiarkan balasan thread ke channel induk. Ini dipetakan ke flag `reply_broadcast` `chat.postMessage` milik Slack dan hanya didukung untuk pengiriman teks atau Block Kit, bukan upload media.

Ketika panggilan tool `message` berjalan di dalam thread Slack dan menargetkan channel yang sama, OpenClaw biasanya mewarisi thread Slack saat ini sesuai dengan `replyToMode`. Setel `topLevel: true` pada `action: "send"` atau `action: "upload-file"` untuk memaksa pesan channel induk baru. `threadId: null` diterima sebagai opt-out tingkat atas yang sama.

<Note>
`replyToMode="off"` menonaktifkan **semua** threading balasan di Slack, termasuk tag `[[reply_to_*]]` eksplisit. Ini berbeda dari Telegram, tempat tag eksplisit tetap dihormati dalam mode `"off"`. Thread Slack menyembunyikan pesan dari channel sementara balasan Telegram tetap terlihat inline.
</Note>

## Reaksi ack

`ackReaction` mengirim emoji pengakuan saat OpenClaw memproses pesan masuk.

Urutan resolusi:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada "👀")

Catatan:

- Slack mengharapkan shortcode (misalnya `"eyes"`).
- Gunakan `""` untuk menonaktifkan reaksi bagi akun Slack atau secara global.

## Streaming teks

`channels.slack.streaming` mengontrol perilaku pratinjau live:

- `off`: nonaktifkan streaming pratinjau live.
- `partial` (default): ganti teks pratinjau dengan output parsial terbaru.
- `block`: tambahkan pembaruan pratinjau yang dipecah menjadi chunk.
- `progress`: tampilkan teks status progres saat menghasilkan, lalu kirim teks final.
- `streaming.preview.toolProgress`: ketika pratinjau draf aktif, rutekan pembaruan tool/progres ke pesan pratinjau yang diedit yang sama (default: `true`). Setel `false` untuk mempertahankan pesan tool/progres terpisah.
- `streaming.preview.commandText` / `streaming.progress.commandText`: setel ke `status` untuk mempertahankan baris progres tool yang ringkas sambil menyembunyikan teks perintah/exec mentah (default: `raw`).

Sembunyikan teks perintah/exec mentah sambil mempertahankan baris progres ringkas:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` mengontrol streaming teks native Slack ketika `channels.slack.streaming.mode` adalah `partial` (default: `true`).

- Thread balasan harus tersedia agar streaming teks native dan status thread asisten Slack muncul. Pemilihan thread tetap mengikuti `replyToMode`.
- Root kanal, obrolan grup, dan DM tingkat atas tetap dapat menggunakan pratinjau draf normal saat streaming native tidak tersedia atau tidak ada thread balasan.
- DM Slack tingkat atas tetap di luar thread secara default, sehingga tidak menampilkan pratinjau stream/status native bergaya thread Slack; OpenClaw memposting dan mengedit pratinjau draf di DM sebagai gantinya.
- Media dan payload non-teks kembali ke pengiriman normal.
- Final media/error membatalkan pengeditan pratinjau tertunda; final teks/blok yang memenuhi syarat hanya di-flush saat dapat mengedit pratinjau di tempat.
- Jika streaming gagal di tengah balasan, OpenClaw kembali ke pengiriman normal untuk payload yang tersisa.

Gunakan pratinjau draf sebagai pengganti streaming teks native Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) adalah alias runtime legacy untuk `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` adalah alias runtime legacy untuk `channels.slack.streaming.mode` dan `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` legacy adalah alias runtime untuk `channels.slack.streaming.nativeTransport`.
- Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi streaming Slack yang tersimpan ke kunci kanonis.

## Fallback reaksi mengetik

`typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat OpenClaw sedang memproses balasan, lalu menghapusnya saat run selesai. Ini paling berguna di luar balasan thread, yang menggunakan indikator status default "sedang mengetik...".

Urutan resolusi:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Catatan:

- Slack mengharapkan shortcode (misalnya `"hourglass_flowing_sand"`).
- Reaksi bersifat best-effort dan pembersihan dicoba secara otomatis setelah jalur balasan atau kegagalan selesai.

## Media, chunking, dan pengiriman

<AccordionGroup>
  <Accordion title="Lampiran masuk">
    Lampiran file Slack diunduh dari URL privat yang di-host Slack (alur permintaan terautentikasi token) dan ditulis ke penyimpanan media saat pengambilan berhasil dan batas ukuran mengizinkan. Placeholder file menyertakan `fileId` Slack agar agen dapat mengambil file asli dengan `download-file`.

    Unduhan menggunakan timeout idle dan total yang dibatasi. Jika pengambilan file Slack macet atau gagal, OpenClaw tetap memproses pesan dan kembali ke placeholder file.

    Batas ukuran masuk runtime default adalah `20MB` kecuali ditimpa oleh `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Teks dan file keluar">
    - chunk teks menggunakan `channels.slack.textChunkLimit` (default 4000)
    - `channels.slack.chunkMode="newline"` mengaktifkan pemisahan dengan paragraf sebagai prioritas
    - pengiriman file menggunakan API unggah Slack dan dapat menyertakan balasan thread (`thread_ts`)
    - batas media keluar mengikuti `channels.slack.mediaMaxMb` saat dikonfigurasi; jika tidak, pengiriman kanal menggunakan default jenis MIME dari pipeline media

  </Accordion>

  <Accordion title="Target pengiriman">
    Target eksplisit yang direkomendasikan:

    - `user:<id>` untuk DM
    - `channel:<id>` untuk kanal

    DM Slack yang hanya berisi teks/blok dapat memposting langsung ke ID pengguna; unggahan file dan pengiriman ber-thread membuka DM melalui API percakapan Slack terlebih dahulu karena jalur tersebut memerlukan ID percakapan konkret.

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

Perintah native memerlukan [pengaturan manifest tambahan](#additional-manifest-settings) di aplikasi Slack Anda dan diaktifkan dengan `channels.slack.commands.native: true` atau `commands.native: true` di konfigurasi global sebagai gantinya.

- Mode otomatis perintah native **mati** untuk Slack sehingga `commands.native: "auto"` tidak mengaktifkan perintah native Slack.

```txt
/help
```

Menu argumen native menggunakan strategi rendering adaptif yang menampilkan modal konfirmasi sebelum mengirim nilai opsi yang dipilih:

- hingga 5 opsi: blok tombol
- 6-100 opsi: menu pilih statis
- lebih dari 100 opsi: pilih eksternal dengan pemfilteran opsi async saat handler opsi interaktivitas tersedia
- batas Slack terlampaui: nilai opsi yang dienkode kembali ke tombol

```txt
/think
```

Sesi slash menggunakan kunci terisolasi seperti `agent:<agentId>:slack:slash:<userId>` dan tetap merutekan eksekusi perintah ke sesi percakapan target menggunakan `CommandTargetSessionKey`.

## Balasan interaktif

Slack dapat merender kontrol balasan interaktif yang ditulis agen, tetapi fitur ini dinonaktifkan secara default.

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

Saat diaktifkan, agen dapat memancarkan direktif balasan khusus Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Direktif ini dikompilasi menjadi Slack Block Kit dan merutekan klik atau pilihan kembali melalui jalur event interaksi Slack yang sudah ada.

Catatan:

- Ini adalah UI khusus Slack. Kanal lain tidak menerjemahkan direktif Slack Block Kit ke sistem tombol mereka sendiri.
- Nilai callback interaktif adalah token buram yang dibuat OpenClaw, bukan nilai mentah yang ditulis agen.
- Jika blok interaktif yang dibuat akan melampaui batas Slack Block Kit, OpenClaw kembali ke balasan teks asli alih-alih mengirim payload blok yang tidak valid.

## Persetujuan exec di Slack

Slack dapat bertindak sebagai klien persetujuan native dengan tombol dan interaksi interaktif, alih-alih kembali ke UI Web atau terminal.

- Persetujuan exec menggunakan `channels.slack.execApprovals.*` untuk perutean DM/kanal native.
- Persetujuan Plugin tetap dapat diselesaikan melalui permukaan tombol native Slack yang sama saat permintaan sudah masuk ke Slack dan jenis id persetujuan adalah `plugin:`.
- Otorisasi pemberi persetujuan tetap diberlakukan: hanya pengguna yang diidentifikasi sebagai pemberi persetujuan yang dapat menyetujui atau menolak permintaan melalui Slack.

Ini menggunakan permukaan tombol persetujuan bersama yang sama seperti kanal lain. Saat `interactivity` diaktifkan di pengaturan aplikasi Slack Anda, prompt persetujuan dirender sebagai tombol Block Kit langsung di percakapan.
Saat tombol tersebut tersedia, tombol itu adalah UX persetujuan utama; OpenClaw
hanya boleh menyertakan perintah `/approve` manual saat hasil alat mengatakan persetujuan chat
tidak tersedia atau persetujuan manual adalah satu-satunya jalur.

Path konfigurasi:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opsional; kembali ke `commands.ownerAllowFrom` saat memungkinkan)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `agentFilter`, `sessionFilter`

Slack secara otomatis mengaktifkan persetujuan exec native saat `enabled` tidak disetel atau `"auto"` dan setidaknya satu
pemberi persetujuan berhasil di-resolve. Setel `enabled: false` untuk menonaktifkan Slack sebagai klien persetujuan native secara eksplisit.
Setel `enabled: true` untuk memaksa persetujuan native aktif saat pemberi persetujuan berhasil di-resolve.

Perilaku default tanpa konfigurasi persetujuan exec Slack eksplisit:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Konfigurasi native Slack eksplisit hanya diperlukan saat Anda ingin menimpa pemberi persetujuan, menambahkan filter, atau
ikut menggunakan pengiriman chat asal:

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

Penerusan `approvals.exec` bersama terpisah. Gunakan hanya saat prompt persetujuan exec juga harus
dirutekan ke chat lain atau target out-of-band eksplisit. Penerusan `approvals.plugin` bersama juga
terpisah; tombol native Slack tetap dapat menyelesaikan persetujuan Plugin saat permintaan tersebut sudah masuk
ke Slack.

`/approve` dalam chat yang sama juga berfungsi di kanal Slack dan DM yang sudah mendukung perintah. Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk model penerusan persetujuan lengkap.

## Event dan perilaku operasional

- Pengeditan/penghapusan pesan dipetakan menjadi event sistem.
- Siaran thread (balasan thread "Kirim juga ke kanal") diproses sebagai pesan pengguna normal.
- Event tambah/hapus reaksi dipetakan menjadi event sistem.
- Event anggota bergabung/keluar, kanal dibuat/diganti nama, dan pin ditambah/dihapus dipetakan menjadi event sistem.
- `channel_id_changed` dapat memigrasikan kunci konfigurasi kanal saat `configWrites` diaktifkan.
- Metadata topik/tujuan kanal diperlakukan sebagai konteks tidak tepercaya dan dapat disuntikkan ke konteks perutean.
- Starter thread dan seeding konteks riwayat thread awal difilter oleh allowlist pengirim yang dikonfigurasi saat berlaku.
- Tindakan blok dan interaksi modal memancarkan event sistem `Slack interaction: ...` terstruktur dengan field payload kaya:
  - tindakan blok: nilai yang dipilih, label, nilai picker, dan metadata `workflow_*`
  - event modal `view_submission` dan `view_closed` dengan metadata kanal yang dirutekan dan input formulir

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Slack](/id/gateway/config-channels#slack).

<Accordion title="Field Slack bernilai tinggi">

- mode/autentikasi: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- akses DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle kompatibilitas: `dangerouslyAllowNameMatching` (break-glass; tetap nonaktif kecuali diperlukan)
- akses kanal: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/riwayat: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurl: `unfurlLinks`, `unfurlMedia` untuk kontrol pratinjau tautan/media `chat.postMessage`
- ops/fitur: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada balasan di kanal">
    Periksa, secara berurutan:

    - `groupPolicy`
    - allowlist kanal (`channels.slack.channels`) — **kunci harus berupa ID kanal** (`C12345678`), bukan nama (`#channel-name`). Kunci berbasis nama gagal diam-diam di bawah `groupPolicy: "allowlist"` karena perutean kanal secara default mengutamakan ID. Untuk menemukan ID: klik kanan kanal di Slack → **Salin tautan** — nilai `C...` di akhir URL adalah ID kanal.
    - `requireMention`
    - allowlist `users` per kanal

    Perintah berguna:

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
    - Event DM Slack Assistant: log verbose yang menyebut `drop message_changed`
      biasanya berarti Slack mengirim event thread Assistant yang diedit tanpa
      pengirim manusia yang dapat dipulihkan dalam metadata pesan

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode tidak terhubung">
    Validasi token bot + app dan pengaktifan Socket Mode di pengaturan aplikasi Slack.

    Jika `openclaw channels status --probe --json` menampilkan `botTokenStatus` atau
    `appTokenStatus: "configured_unavailable"`, akun Slack sudah
    dikonfigurasi tetapi runtime saat ini tidak dapat me-resolve nilai yang
    didukung SecretRef.

  </Accordion>

  <Accordion title="Mode HTTP tidak menerima peristiwa">
    Validasi:

    - rahasia penandatanganan
    - jalur webhook
    - URL Permintaan Slack (Peristiwa + Interaktivitas + Perintah Slash)
    - `webhookPath` unik per akun HTTP

    Jika `signingSecretStatus: "configured_unavailable"` muncul di snapshot akun, akun HTTP sudah dikonfigurasi tetapi runtime saat ini tidak dapat menyelesaikan rahasia penandatanganan yang didukung SecretRef.

  </Accordion>

  <Accordion title="Perintah native/slash tidak berjalan">
    Verifikasi apakah yang Anda maksud adalah:

    - mode perintah native (`channels.slack.commands.native: true`) dengan perintah slash yang sesuai terdaftar di Slack
    - atau mode perintah slash tunggal (`channels.slack.slashCommand.enabled: true`)

    Periksa juga `commands.useAccessGroups` serta daftar izin channel/pengguna.

  </Accordion>
</AccordionGroup>

## Referensi visi lampiran

Slack dapat melampirkan media yang diunduh ke giliran agen saat unduhan file Slack berhasil dan batas ukuran mengizinkan. File gambar dapat diteruskan melalui jalur pemahaman media atau langsung ke model balasan yang mendukung visi; file lain dipertahankan sebagai konteks file yang dapat diunduh, bukan diperlakukan sebagai input gambar.

### Jenis media yang didukung

| Jenis media                    | Sumber               | Perilaku saat ini                                                                 | Catatan                                                                   |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Gambar JPEG / PNG / GIF / WebP | URL file Slack       | Diunduh dan dilampirkan ke giliran untuk penanganan yang mendukung visi           | Batas per file: `channels.slack.mediaMaxMb` (default 20 MB)               |
| File PDF                       | URL file Slack       | Diunduh dan diekspos sebagai konteks file untuk alat seperti `download-file` atau `pdf` | Inbound Slack tidak mengonversi PDF menjadi input visi gambar secara otomatis |
| File lain                      | URL file Slack       | Diunduh jika memungkinkan dan diekspos sebagai konteks file                       | File biner tidak diperlakukan sebagai input gambar                        |
| Balasan thread                 | File pemulai thread  | File pesan root dapat dihidrasi sebagai konteks saat balasan tidak memiliki media langsung | Pemulai yang hanya berisi file menggunakan placeholder lampiran            |
| Pesan multi-gambar             | Beberapa file Slack  | Setiap file dievaluasi secara independen                                          | Pemrosesan Slack dibatasi hingga delapan file per pesan                   |

### Pipeline inbound

Saat pesan Slack dengan lampiran file tiba:

1. OpenClaw mengunduh file dari URL privat Slack menggunakan token bot (`xoxb-...`).
2. File ditulis ke penyimpanan media jika berhasil.
3. Jalur media yang diunduh dan jenis konten ditambahkan ke konteks inbound.
4. Jalur model/alat yang mendukung gambar dapat menggunakan lampiran gambar dari konteks tersebut.
5. File non-gambar tetap tersedia sebagai metadata file atau referensi media untuk alat yang dapat menanganinya.

### Pewarisan lampiran root thread

Saat pesan tiba dalam thread (memiliki induk `thread_ts`):

- Jika balasan itu sendiri tidak memiliki media langsung dan pesan root yang disertakan memiliki file, Slack dapat menghidrasi file root sebagai konteks pemulai thread.
- Lampiran balasan langsung lebih diutamakan daripada lampiran pesan root.
- Pesan root yang hanya memiliki file dan tanpa teks direpresentasikan dengan placeholder lampiran sehingga fallback tetap dapat menyertakan filenya.

### Penanganan multi-lampiran

Saat satu pesan Slack berisi beberapa lampiran file:

- Setiap lampiran diproses secara independen melalui pipeline media.
- Referensi media yang diunduh digabungkan ke dalam konteks pesan.
- Urutan pemrosesan mengikuti urutan file Slack dalam payload peristiwa.
- Kegagalan unduhan satu lampiran tidak memblokir lampiran lain.

### Batas ukuran, unduhan, dan model

- **Batas ukuran**: Default 20 MB per file. Dapat dikonfigurasi melalui `channels.slack.mediaMaxMb`.
- **Kegagalan unduhan**: File yang tidak dapat disajikan oleh Slack, URL kedaluwarsa, file yang tidak dapat diakses, file yang terlalu besar, dan respons HTML auth/login Slack dilewati alih-alih dilaporkan sebagai format yang tidak didukung.
- **Model visi**: Analisis gambar menggunakan model balasan aktif saat model tersebut mendukung visi, atau model gambar yang dikonfigurasi di `agents.defaults.imageModel`.

### Batasan yang diketahui

| Skenario                               | Perilaku saat ini                                                           | Solusi sementara                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL file Slack kedaluwarsa             | File dilewati; tidak ada kesalahan yang ditampilkan                         | Unggah ulang file di Slack                                                 |
| Model visi tidak dikonfigurasi         | Lampiran gambar disimpan sebagai referensi media, tetapi tidak dianalisis sebagai gambar | Konfigurasikan `agents.defaults.imageModel` atau gunakan model balasan yang mendukung visi |
| Gambar sangat besar (> 20 MB secara default) | Dilewati sesuai batas ukuran                                                | Tingkatkan `channels.slack.mediaMaxMb` jika Slack mengizinkan              |
| Lampiran yang diteruskan/dibagikan     | Teks dan media gambar/file yang dihosting Slack bersifat upaya terbaik      | Bagikan ulang langsung di thread OpenClaw                                  |
| Lampiran PDF                           | Disimpan sebagai konteks file/media, tidak otomatis dirutekan melalui visi gambar | Gunakan `download-file` untuk metadata file atau alat `pdf` untuk analisis PDF |

### Dokumentasi terkait

- [Pipeline pemahaman media](/id/nodes/media-understanding)
- [Alat PDF](/id/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — pengaktifan visi lampiran Slack
- Uji regresi: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verifikasi langsung: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Terkait

<CardGroup cols={2}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Slack ke gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku channel dan DM grup.
  </Card>
  <Card title="Perutean channel" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan inbound ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan hardening.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Tata letak dan presedensi konfigurasi.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Katalog dan perilaku perintah.
  </Card>
</CardGroup>
