---
read_when:
    - Menyiapkan Slack atau men-debug mode soket/HTTP Slack
summary: Penyiapan Slack dan perilaku saat berjalan (Mode Soket + URL Permintaan HTTP)
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:44:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a8e1cbfd3d99bfc24d79b56ee762d1ab399402391b241ff40698249b0828008
    source_path: channels/slack.md
    workflow: 16
---

Siap produksi untuk DM dan channel melalui integrasi aplikasi Slack. Mode bawaan adalah Socket Mode; URL HTTP Request juga didukung.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM Slack secara bawaan menggunakan mode pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku command native dan katalog command.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas-channel dan playbook perbaikan.
  </Card>
</CardGroup>

## Memilih Socket Mode atau URL HTTP Request

Kedua transport siap produksi dan mencapai paritas fitur untuk olah pesan, slash command, App Home, dan interaktivitas. Pilih berdasarkan bentuk deployment, bukan fitur.

| Pertimbangan                 | Socket Mode (bawaan)                                                                 | URL HTTP Request                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| URL Gateway publik           | Tidak diperlukan                                                                     | Diperlukan (DNS, TLS, proxy balik atau tunnel)                                                                 |
| Jaringan keluar              | WSS keluar ke `wss-primary.slack.com` harus dapat dijangkau                          | Tidak ada WS keluar; hanya HTTPS masuk                                                                        |
| Token yang diperlukan        | Token bot (`xoxb-...`) + App-Level Token (`xapp-...`) dengan `connections:write`     | Token bot (`xoxb-...`) + Signing Secret                                                                        |
| Laptop dev / di balik firewall | Berfungsi apa adanya                                                               | Memerlukan tunnel publik (ngrok, Cloudflare Tunnel, Tailscale Funnel) atau Gateway staging                    |
| Penskalaan horizontal        | Satu sesi Socket Mode per aplikasi per host; beberapa Gateway memerlukan aplikasi Slack terpisah | Handler POST tanpa state; beberapa replika Gateway dapat berbagi satu aplikasi di balik load balancer |
| Multi-akun pada satu Gateway | Didukung; setiap akun membuka WS-nya sendiri                                         | Didukung; setiap akun memerlukan `webhookPath` unik (bawaan `/slack/events`) agar registrasi tidak bertabrakan |
| Transport slash command      | Dikirim melalui koneksi WS; `slash_commands[].url` diabaikan                         | Slack melakukan POST ke `slash_commands[].url`; field diperlukan agar command dikirim                         |
| Penandatanganan request      | Tidak digunakan (auth adalah App-Level Token)                                        | Slack menandatangani setiap request; OpenClaw memverifikasi dengan `signingSecret`                            |
| Pemulihan saat koneksi terputus | SDK Slack otomatis terhubung ulang; tuning transport pong-timeout Gateway berlaku | Tidak ada koneksi persisten yang bisa terputus; percobaan ulang dilakukan per request dari Slack              |

<Note>
  **Pilih Socket Mode** untuk host Gateway tunggal, laptop dev, dan jaringan on-prem yang dapat menjangkau `*.slack.com` keluar tetapi tidak dapat menerima HTTPS masuk.

**Pilih URL HTTP Request** saat menjalankan beberapa replika Gateway di balik load balancer, saat WSS keluar diblokir tetapi HTTPS masuk diizinkan, atau saat Anda sudah menghentikan Webhook Slack di proxy balik.
</Note>

## Penyiapan cepat

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
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
          **Direkomendasikan** cocok dengan set fitur lengkap Plugin Slack bawaan: App Home, slash command, file, reaksi, pin, DM grup, serta pembacaan emoji/usergroup. Pilih **Minimal** saat kebijakan workspace membatasi scope — ini mencakup DM, riwayat channel/grup, mention, dan slash command tetapi mengecualikan file, reaksi, pin, DM grup (`mpim:*`), `emoji:read`, dan `usergroups:read`. Lihat [Checklist manifest dan scope](#manifest-and-scope-checklist) untuk alasan per-scope dan opsi tambahan seperti slash command ekstra.
        </Note>

        Setelah Slack membuat aplikasi:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: tambahkan `connections:write`, simpan, salin nilai `xapp-...`.
        - **Install App → Install to Workspace**: salin Bot User OAuth Token `xoxb-...`.

      </Step>

      <Step title="Configure OpenClaw">

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

        Fallback env (hanya akun bawaan):

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
          **Direkomendasikan** cocok dengan set fitur lengkap Plugin Slack bawaan; **Minimal** menghapus file, reaksi, pin, group-DM (`mpim:*`), `emoji:read`, dan `usergroups:read` untuk workspace yang restriktif. Lihat [Daftar periksa manifes dan cakupan](#manifest-and-scope-checklist) untuk alasan per cakupan.
        </Note>

        <Info>
          Tiga kolom URL (`slash_commands[].url`, `event_subscriptions.request_url`, dan `interactivity.request_url` / `message_menu_options_url`) semuanya mengarah ke endpoint OpenClaw yang sama. Skema manifes Slack mengharuskan semuanya diberi nama secara terpisah, tetapi OpenClaw merutekan berdasarkan jenis payload sehingga satu `webhookPath` (default `/slack/events`) sudah cukup. Perintah slash tanpa `slash_commands[].url` akan diam-diam tidak melakukan apa pun dalam mode HTTP.
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
        Gunakan jalur Webhook unik untuk HTTP multi-akun

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

OpenClaw menetapkan timeout pong klien SDK Slack ke 15 detik secara default untuk Mode Socket. Timpa pengaturan transport hanya saat Anda memerlukan penyetelan khusus workspace atau host:

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

Gunakan ini hanya untuk workspace Mode Socket yang mencatat timeout pong websocket/ping-server Slack atau berjalan pada host dengan kelaparan event-loop yang diketahui. `clientPingTimeout` adalah waktu tunggu pong setelah SDK mengirim ping klien; `serverPingTimeout` adalah waktu tunggu untuk ping server Slack. Pesan dan peristiwa aplikasi tetap merupakan status aplikasi, bukan sinyal keaktifan transport.

## Daftar periksa manifes dan cakupan

Manifes dasar aplikasi Slack sama untuk Mode Socket dan URL Permintaan HTTP. Hanya blok `settings` (dan `url` perintah slash) yang berbeda.

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

Untuk **mode URL Permintaan HTTP**, ganti `settings` dengan varian HTTP dan tambahkan `url` ke setiap perintah slash. URL publik diperlukan:

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

Tampilkan fitur berbeda yang memperluas default di atas.

Manifes default mengaktifkan tab **Home** di Slack App Home dan berlangganan `app_home_opened`. Saat anggota workspace membuka tab Home, OpenClaw menerbitkan tampilan Home default yang aman dengan `views.publish`; tidak ada payload percakapan atau konfigurasi privat yang disertakan. Tab **Messages** tetap diaktifkan untuk DM Slack.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Beberapa [perintah slash native](#commands-and-slash-behavior) dapat digunakan sebagai pengganti satu perintah terkonfigurasi dengan nuansa berikut:

    - Gunakan `/agentstatus` alih-alih `/status` karena perintah `/status` dicadangkan.
    - Tidak lebih dari 25 perintah slash dapat tersedia sekaligus.

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
    Tambahkan cakupan bot `chat:write.customize` jika Anda ingin pesan keluar menggunakan identitas agen aktif (nama pengguna dan ikon kustom), bukan identitas aplikasi Slack default.

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
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima string teks biasa
  atau objek SecretRef.
- Token konfigurasi menimpa fallback env.
- Fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` hanya berlaku untuk akun default.
- `userToken` (`xoxp-...`) hanya dapat dikonfigurasi melalui config (tanpa fallback env) dan secara default menggunakan perilaku hanya-baca (`userTokenReadOnly: true`).

Perilaku snapshot status:

- Inspeksi akun Slack melacak bidang `*Source` dan `*Status`
  per kredensial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status adalah `available`, `configured_unavailable`, atau `missing`.
- `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef
  atau sumber rahasia non-inline lainnya, tetapi jalur perintah/runtime saat ini
  tidak dapat menyelesaikan nilai aktualnya.
- Dalam mode HTTP, `signingSecretStatus` disertakan; dalam Socket Mode,
  pasangan yang diperlukan adalah `botTokenStatus` + `appTokenStatus`.

<Tip>
Untuk tindakan/pembacaan direktori, token pengguna dapat diprioritaskan saat dikonfigurasi. Untuk penulisan, token bot tetap diprioritaskan; penulisan dengan token pengguna hanya diizinkan saat `userTokenReadOnly: false` dan token bot tidak tersedia.
</Tip>

## Tindakan dan gate

Tindakan Slack dikontrol oleh `channels.slack.actions.*`.

Grup tindakan yang tersedia dalam tooling Slack saat ini:

| Grup       | Default |
| ---------- | ------- |
| messages   | diaktifkan |
| reactions  | diaktifkan |
| pins       | diaktifkan |
| memberInfo | diaktifkan |
| emojiList  | diaktifkan |

Tindakan pesan Slack saat ini mencakup `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, dan `emoji-list`. `download-file` menerima ID file Slack yang ditampilkan dalam placeholder file masuk dan mengembalikan pratinjau gambar untuk gambar atau metadata file lokal untuk jenis file lainnya.

## Kontrol akses dan perutean

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
    - Akun bernama mewarisi `channels.slack.allowFrom` saat `allowFrom` miliknya tidak disetel.
    - Akun bernama tidak mewarisi `channels.slack.accounts.default.allowFrom`.

    Legacy `channels.slack.dm.policy` dan `channels.slack.dm.allowFrom` tetap dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` saat dapat melakukannya tanpa mengubah akses.

    Pairing di DM menggunakan `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kebijakan channel">
    `channels.slack.groupPolicy` mengontrol penanganan channel:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist channel berada di bawah `channels.slack.channels` dan **harus menggunakan ID channel Slack yang stabil** (misalnya `C12345678`) sebagai kunci config.

    Catatan runtime: jika `channels.slack` sepenuhnya tidak ada (setup hanya-env), runtime kembali ke `groupPolicy="allowlist"` dan mencatat peringatan (meskipun `channels.defaults.groupPolicy` disetel).

    Resolusi nama/ID:

    - entri allowlist channel dan entri allowlist DM diselesaikan saat startup ketika akses token mengizinkan
    - entri nama channel yang belum terselesaikan dipertahankan sesuai konfigurasi tetapi secara default diabaikan untuk perutean
    - otorisasi masuk dan perutean channel secara default mengutamakan ID; pencocokan langsung nama pengguna/slug memerlukan `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Kunci berbasis nama (`#channel-name` atau `channel-name`) **tidak** cocok di bawah `groupPolicy: "allowlist"`. Lookup channel secara default mengutamakan ID, sehingga kunci berbasis nama tidak akan pernah berhasil dirutekan dan semua pesan di channel tersebut akan diblokir secara diam-diam. Ini berbeda dari `groupPolicy: "open"`, yang tidak memerlukan kunci channel untuk perutean dan kunci berbasis nama tampak berfungsi.

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

  <Tab title="Mention dan pengguna saluran">
    Pesan saluran secara default digating oleh mention.

    Sumber mention:

    - mention aplikasi eksplisit (`<@botId>`)
    - mention grup pengguna Slack (`<!subteam^S...>`) ketika pengguna bot adalah anggota grup pengguna tersebut; memerlukan `usergroups:read`
    - pola regex mention (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku thread balasan-ke-bot implisit (dinonaktifkan ketika `thread.requireExplicitMention` adalah `true`)

    Kontrol per saluran (`channels.slack.channels.<id>`; nama hanya melalui resolusi startup atau `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format kunci `toolsBySender`: wildcard `id:`, `e164:`, `username:`, `name:`, atau `"*"`
      (kunci lama tanpa prefiks tetap dipetakan hanya ke `id:`)

    `allowBots` bersifat konservatif untuk saluran dan saluran pribadi: pesan ruang yang ditulis bot diterima hanya ketika bot pengirim dicantumkan secara eksplisit dalam allowlist `users` ruang tersebut, atau ketika setidaknya satu ID pemilik Slack eksplisit dari `channels.slack.allowFrom` saat ini adalah anggota ruang. Wildcard dan entri pemilik nama tampilan tidak memenuhi keberadaan pemilik. Keberadaan pemilik menggunakan `conversations.members` Slack; pastikan aplikasi memiliki cakupan baca yang sesuai untuk jenis ruang (`channels:read` untuk saluran publik, `groups:read` untuk saluran pribadi). Jika pencarian anggota gagal, OpenClaw menjatuhkan pesan ruang yang ditulis bot.

  </Tab>
</Tabs>

## Threading, sesi, dan tag balasan

- DM dirutekan sebagai `direct`; saluran sebagai `channel`; MPIM sebagai `group`.
- Binding rute Slack menerima ID peer mentah serta bentuk target Slack seperti `channel:C12345678`, `user:U12345678`, dan `<@U12345678>`.
- Dengan default `session.dmScope=main`, DM Slack diciutkan ke sesi utama agen.
- Sesi saluran: `agent:<agentId>:slack:channel:<channelId>`.
- Balasan thread dapat membuat sufiks sesi thread (`:thread:<threadTs>`) saat berlaku.
- Default `channels.slack.thread.historyScope` adalah `thread`; default `thread.inheritParent` adalah `false`.
- `channels.slack.thread.initialHistoryLimit` mengontrol berapa banyak pesan thread yang sudah ada yang diambil ketika sesi thread baru dimulai (default `20`; atur `0` untuk menonaktifkan).
- `channels.slack.thread.requireExplicitMention` (default `false`): ketika `true`, menekan mention thread implisit sehingga bot hanya merespons mention `@bot` eksplisit di dalam thread, bahkan ketika bot sudah berpartisipasi dalam thread. Tanpa ini, balasan dalam thread yang diikuti bot melewati gating `requireMention`.

Kontrol threading balasan:

- `channels.slack.replyToMode`: `off|first|all|batched` (default `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback lama untuk chat langsung: `channels.slack.dm.replyToMode`

Tag balasan manual didukung:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` menonaktifkan **semua** threading balasan di Slack, termasuk tag `[[reply_to_*]]` eksplisit. Ini berbeda dari Telegram, tempat tag eksplisit tetap dihormati dalam mode `"off"`. Thread Slack menyembunyikan pesan dari saluran sementara balasan Telegram tetap terlihat inline.
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
- Gunakan `""` untuk menonaktifkan reaksi untuk akun Slack atau secara global.

## Streaming teks

`channels.slack.streaming` mengontrol perilaku pratinjau langsung:

- `off`: nonaktifkan streaming pratinjau langsung.
- `partial` (default): ganti teks pratinjau dengan output parsial terbaru.
- `block`: tambahkan pembaruan pratinjau yang dipecah menjadi chunk.
- `progress`: tampilkan teks status progres saat menghasilkan, lalu kirim teks final.
- `streaming.preview.toolProgress`: ketika pratinjau draf aktif, rutekan pembaruan alat/progres ke pesan pratinjau editan yang sama (default: `true`). Atur `false` untuk mempertahankan pesan alat/progres terpisah.
- `streaming.preview.commandText` / `streaming.progress.commandText`: atur ke `status` untuk mempertahankan baris progres alat yang ringkas sambil menyembunyikan teks command/exec mentah (default: `raw`).

Sembunyikan teks command/exec mentah sambil mempertahankan baris progres ringkas:

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
- Saluran, chat grup, dan root DM level atas masih dapat menggunakan pratinjau draf normal ketika streaming native tidak tersedia atau tidak ada thread balasan.
- DM Slack level atas tetap berada di luar thread secara default, sehingga tidak menampilkan pratinjau stream/status native bergaya thread Slack; OpenClaw memposting dan mengedit pratinjau draf di DM sebagai gantinya.
- Media dan payload non-teks fallback ke pengiriman normal.
- Final media/error membatalkan edit pratinjau tertunda; final teks/blok yang memenuhi syarat di-flush hanya ketika dapat mengedit pratinjau di tempat.
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

Kunci lama:

- `channels.slack.streamMode` (`replace | status_final | append`) dimigrasikan otomatis ke `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` dimigrasikan otomatis ke `channels.slack.streaming.mode` dan `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` lama dimigrasikan otomatis ke `channels.slack.streaming.nativeTransport`.

## Fallback reaksi mengetik

`typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat OpenClaw sedang memproses balasan, lalu menghapusnya saat proses selesai. Ini paling berguna di luar balasan thread, yang menggunakan indikator status default "is typing...".

Urutan resolusi:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Catatan:

- Slack mengharapkan shortcode (misalnya `"hourglass_flowing_sand"`).
- Reaksi bersifat upaya terbaik dan pembersihan dicoba secara otomatis setelah jalur balasan atau kegagalan selesai.

## Media, pemotongan, dan pengiriman

<AccordionGroup>
  <Accordion title="Lampiran masuk">
    Lampiran file Slack diunduh dari URL privat yang dihosting Slack (alur permintaan terautentikasi token) dan ditulis ke penyimpanan media saat pengambilan berhasil dan batas ukuran mengizinkan. Placeholder file menyertakan `fileId` Slack agar agen dapat mengambil file asli dengan `download-file`.

    Unduhan menggunakan batas waktu idle dan total yang dibatasi. Jika pengambilan file Slack macet atau gagal, OpenClaw tetap memproses pesan dan fallback ke placeholder file.

    Batas ukuran masuk runtime default adalah `20MB` kecuali ditimpa oleh `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Teks dan file keluar">
    - potongan teks menggunakan `channels.slack.textChunkLimit` (default 4000)
    - `channels.slack.chunkMode="newline"` mengaktifkan pemisahan yang mengutamakan paragraf
    - pengiriman file menggunakan API unggahan Slack dan dapat menyertakan balasan thread (`thread_ts`)
    - batas media keluar mengikuti `channels.slack.mediaMaxMb` saat dikonfigurasi; jika tidak, pengiriman channel menggunakan default jenis MIME dari pipeline media

  </Accordion>

  <Accordion title="Target pengiriman">
    Target eksplisit yang disarankan:

    - `user:<id>` untuk DM
    - `channel:<id>` untuk channel

    DM Slack khusus teks/blok dapat memposting langsung ke ID pengguna; unggahan file dan pengiriman ber-thread membuka DM melalui API percakapan Slack terlebih dahulu karena jalur tersebut memerlukan ID percakapan konkret.

  </Accordion>
</AccordionGroup>

## Perintah dan perilaku slash

Perintah slash muncul di Slack sebagai satu perintah terkonfigurasi atau beberapa perintah native. Konfigurasikan `channels.slack.slashCommand` untuk mengubah default perintah:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Perintah native memerlukan [pengaturan manifes tambahan](#additional-manifest-settings) di aplikasi Slack Anda dan sebagai gantinya diaktifkan dengan `channels.slack.commands.native: true` atau `commands.native: true` dalam konfigurasi global.

- Mode otomatis perintah native **mati** untuk Slack sehingga `commands.native: "auto"` tidak mengaktifkan perintah native Slack.

```txt
/help
```

Menu argumen native menggunakan strategi perenderan adaptif yang menampilkan modal konfirmasi sebelum mengirim nilai opsi yang dipilih:

- hingga 5 opsi: blok tombol
- 6-100 opsi: menu static select
- lebih dari 100 opsi: external select dengan pemfilteran opsi async saat handler opsi interaktivitas tersedia
- batas Slack terlampaui: nilai opsi terenkode fallback ke tombol

```txt
/think
```

Sesi slash menggunakan kunci terisolasi seperti `agent:<agentId>:slack:slash:<userId>` dan tetap merutekan eksekusi perintah ke sesi percakapan target menggunakan `CommandTargetSessionKey`.

## Balasan interaktif

Slack dapat merender kontrol balasan interaktif yang dibuat agen, tetapi fitur ini dinonaktifkan secara default.

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

Direktif ini dikompilasi menjadi Slack Block Kit dan merutekan klik atau pilihan kembali melalui jalur peristiwa interaksi Slack yang sudah ada.

Catatan:

- Ini adalah UI khusus Slack. Channel lain tidak menerjemahkan direktif Slack Block Kit ke sistem tombol mereka sendiri.
- Nilai callback interaktif adalah token buram yang dihasilkan OpenClaw, bukan nilai mentah yang dibuat agen.
- Jika blok interaktif yang dihasilkan akan melampaui batas Slack Block Kit, OpenClaw fallback ke balasan teks asli alih-alih mengirim payload blok yang tidak valid.

## Persetujuan exec di Slack

Slack dapat bertindak sebagai klien persetujuan native dengan tombol dan interaksi interaktif, alih-alih fallback ke UI Web atau terminal.

- Persetujuan exec menggunakan `channels.slack.execApprovals.*` untuk perutean DM/channel native.
- Persetujuan Plugin tetap dapat diselesaikan melalui permukaan tombol native Slack yang sama saat permintaan sudah masuk di Slack dan jenis id persetujuan adalah `plugin:`.
- Otorisasi pemberi persetujuan tetap diberlakukan: hanya pengguna yang diidentifikasi sebagai pemberi persetujuan yang dapat menyetujui atau menolak permintaan melalui Slack.

Ini menggunakan permukaan tombol persetujuan bersama yang sama seperti channel lain. Saat `interactivity` diaktifkan di pengaturan aplikasi Slack Anda, prompt persetujuan dirender sebagai tombol Block Kit langsung di percakapan.
Saat tombol tersebut ada, tombol itu adalah UX persetujuan utama; OpenClaw
sebaiknya hanya menyertakan perintah manual `/approve` saat hasil tool mengatakan persetujuan
chat tidak tersedia atau persetujuan manual adalah satu-satunya jalur.

Jalur konfigurasi:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opsional; fallback ke `commands.ownerAllowFrom` saat memungkinkan)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `agentFilter`, `sessionFilter`

Slack secara otomatis mengaktifkan persetujuan exec native saat `enabled` tidak disetel atau `"auto"` dan setidaknya satu
pemberi persetujuan terselesaikan. Setel `enabled: false` untuk menonaktifkan Slack sebagai klien persetujuan native secara eksplisit.
Setel `enabled: true` untuk memaksa persetujuan native aktif saat pemberi persetujuan terselesaikan.

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
di Slack.

`/approve` dalam chat yang sama juga berfungsi di channel Slack dan DM yang sudah mendukung perintah. Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk model penerusan persetujuan lengkap.

## Peristiwa dan perilaku operasional

- Edit/hapus pesan dipetakan menjadi peristiwa sistem.
- Broadcast thread (balasan thread "Also send to channel") diproses sebagai pesan pengguna normal.
- Peristiwa tambah/hapus reaksi dipetakan menjadi peristiwa sistem.
- Peristiwa anggota bergabung/keluar, channel dibuat/diubah nama, dan pin tambah/hapus dipetakan menjadi peristiwa sistem.
- `channel_id_changed` dapat memigrasikan kunci konfigurasi channel saat `configWrites` diaktifkan.
- Metadata topik/tujuan channel diperlakukan sebagai konteks tidak tepercaya dan dapat disuntikkan ke konteks perutean.
- Starter thread dan penyemaian konteks riwayat thread awal difilter oleh allowlist pengirim yang dikonfigurasi saat berlaku.
- Tindakan blok dan interaksi modal memancarkan peristiwa sistem `Slack interaction: ...` terstruktur dengan bidang payload kaya:
  - tindakan blok: nilai yang dipilih, label, nilai pemilih, dan metadata `workflow_*`
  - peristiwa modal `view_submission` dan `view_closed` dengan metadata channel yang dirutekan dan input formulir

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Slack](/id/gateway/config-channels#slack).

<Accordion title="Bidang Slack bersinyal tinggi">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- akses DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle kompatibilitas: `dangerouslyAllowNameMatching` (break-glass; tetap matikan kecuali diperlukan)
- akses channel: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/riwayat: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- ops/fitur: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada balasan di channel">
    Periksa, secara berurutan:

    - `groupPolicy`
    - allowlist channel (`channels.slack.channels`) — **kunci harus berupa ID channel** (`C12345678`), bukan nama (`#channel-name`). Kunci berbasis nama gagal diam-diam di bawah `groupPolicy: "allowlist"` karena perutean channel secara default mengutamakan ID. Untuk menemukan ID: klik kanan channel di Slack → **Copy link** — nilai `C...` di akhir URL adalah ID channel.
    - `requireMention`
    - allowlist `users` per channel

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
    - peristiwa DM Slack Assistant: log verbose yang menyebut `drop message_changed`
      biasanya berarti Slack mengirim peristiwa thread Assistant yang diedit tanpa
      pengirim manusia yang dapat dipulihkan dalam metadata pesan

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode tidak tersambung">
    Validasi token bot + aplikasi dan pengaktifan Socket Mode di pengaturan aplikasi Slack.

    Jika `openclaw channels status --probe --json` menampilkan `botTokenStatus` atau
    `appTokenStatus: "configured_unavailable"`, akun Slack
    terkonfigurasi tetapi runtime saat ini tidak dapat menyelesaikan nilai yang didukung SecretRef.

  </Accordion>

  <Accordion title="Mode HTTP tidak menerima peristiwa">
    Validasi:

    - signing secret
    - jalur Webhook
    - URL Permintaan Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` unik per akun HTTP

    Jika `signingSecretStatus: "configured_unavailable"` muncul di snapshot akun,
    akun HTTP terkonfigurasi tetapi runtime saat ini tidak dapat
    menyelesaikan signing secret yang didukung SecretRef.

  </Accordion>

  <Accordion title="Perintah native/slash tidak berjalan">
    Verifikasi apakah yang Anda maksud adalah:

    - mode perintah native (`channels.slack.commands.native: true`) dengan perintah slash yang cocok terdaftar di Slack
    - atau mode satu perintah slash (`channels.slack.slashCommand.enabled: true`)

    Periksa juga `commands.useAccessGroups` dan allowlist channel/pengguna.

  </Accordion>
</AccordionGroup>

## Referensi vision lampiran

Slack dapat melampirkan media yang diunduh ke giliran agen saat unduhan file Slack berhasil dan batas ukuran mengizinkan. File gambar dapat diteruskan melalui jalur pemahaman media atau langsung ke model balasan berkemampuan vision; file lain dipertahankan sebagai konteks file yang dapat diunduh, bukan diperlakukan sebagai input gambar.

### Jenis media yang didukung

| Jenis media                    | Sumber               | Perilaku saat ini                                                                | Catatan                                                                   |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Gambar JPEG / PNG / GIF / WebP | URL file Slack       | Diunduh dan dilampirkan ke giliran untuk penanganan yang mendukung vision        | Batas per file: `channels.slack.mediaMaxMb` (default 20 MB)              |
| File PDF                       | URL file Slack       | Diunduh dan diekspos sebagai konteks file untuk tool seperti `download-file` atau `pdf` | Inbound Slack tidak mengonversi PDF menjadi input image-vision secara otomatis |
| File lain                      | URL file Slack       | Diunduh jika memungkinkan dan diekspos sebagai konteks file                      | File biner tidak diperlakukan sebagai input gambar                        |
| Balasan thread                 | File pembuka thread  | File pesan root dapat dihidrasi sebagai konteks ketika balasan tidak memiliki media langsung | Pembuka yang hanya berisi file menggunakan placeholder lampiran           |
| Pesan multi-gambar             | Beberapa file Slack  | Setiap file dievaluasi secara independen                                         | Pemrosesan Slack dibatasi hingga delapan file per pesan                   |

### Pipeline inbound

Ketika pesan Slack dengan lampiran file tiba:

1. OpenClaw mengunduh file dari URL privat Slack menggunakan token bot (`xoxb-...`).
2. File ditulis ke penyimpanan media jika berhasil.
3. Jalur media yang diunduh dan tipe konten ditambahkan ke konteks inbound.
4. Jalur model/tool yang mendukung gambar dapat menggunakan lampiran gambar dari konteks tersebut.
5. File non-gambar tetap tersedia sebagai metadata file atau referensi media untuk tool yang dapat menanganinya.

### Pewarisan lampiran root thread

Ketika pesan tiba di thread (memiliki induk `thread_ts`):

- Jika balasan itu sendiri tidak memiliki media langsung dan pesan root yang disertakan memiliki file, Slack dapat menghidrasi file root sebagai konteks pembuka thread.
- Lampiran balasan langsung diprioritaskan dibanding lampiran pesan root.
- Pesan root yang hanya memiliki file dan tanpa teks direpresentasikan dengan placeholder lampiran sehingga fallback tetap dapat menyertakan filenya.

### Penanganan multi-lampiran

Ketika satu pesan Slack berisi beberapa lampiran file:

- Setiap lampiran diproses secara independen melalui pipeline media.
- Referensi media yang diunduh digabungkan ke dalam konteks pesan.
- Urutan pemrosesan mengikuti urutan file Slack dalam payload event.
- Kegagalan dalam pengunduhan satu lampiran tidak memblokir lampiran lain.

### Batas ukuran, pengunduhan, dan model

- **Batas ukuran**: Default 20 MB per file. Dapat dikonfigurasi melalui `channels.slack.mediaMaxMb`.
- **Kegagalan pengunduhan**: File yang tidak dapat disajikan Slack, URL kedaluwarsa, file yang tidak dapat diakses, file terlalu besar, dan respons HTML autentikasi/login Slack dilewati alih-alih dilaporkan sebagai format yang tidak didukung.
- **Model vision**: Analisis gambar menggunakan model balasan aktif ketika mendukung vision, atau model gambar yang dikonfigurasi di `agents.defaults.imageModel`.

### Batas yang diketahui

| Skenario                               | Perilaku saat ini                                                            | Solusi sementara                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL file Slack kedaluwarsa             | File dilewati; tidak ada error yang ditampilkan                              | Unggah ulang file di Slack                                                |
| Model vision tidak dikonfigurasi       | Lampiran gambar disimpan sebagai referensi media, tetapi tidak dianalisis sebagai gambar | Konfigurasikan `agents.defaults.imageModel` atau gunakan model balasan yang mendukung vision |
| Gambar sangat besar (> 20 MB secara default) | Dilewati sesuai batas ukuran                                             | Tingkatkan `channels.slack.mediaMaxMb` jika Slack mengizinkan             |
| Lampiran yang diteruskan/dibagikan     | Teks dan media gambar/file yang di-host Slack bersifat best-effort           | Bagikan ulang langsung di thread OpenClaw                                 |
| Lampiran PDF                           | Disimpan sebagai konteks file/media, tidak otomatis dirutekan melalui image vision | Gunakan `download-file` untuk metadata file atau tool `pdf` untuk analisis PDF |

### Dokumentasi terkait

- [Pipeline pemahaman media](/id/nodes/media-understanding)
- [Tool PDF](/id/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — pengaktifan vision lampiran Slack
- Uji regresi: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verifikasi live: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Terkait

<CardGroup cols={2}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Slack ke Gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku channel dan DM grup.
  </Card>
  <Card title="Perutean channel" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan inbound ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan pengerasan.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Tata letak konfigurasi dan presedensi.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Katalog dan perilaku perintah.
  </Card>
</CardGroup>
