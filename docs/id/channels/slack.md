---
read_when:
    - Menyiapkan Slack atau men-debug mode soket, HTTP, atau relay Slack
summary: Penyiapan Slack dan perilaku runtime (Socket Mode, URL Permintaan HTTP, dan mode relay)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:12:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Siap produksi untuk DM dan channel melalui integrasi aplikasi Slack. Mode default adalah Socket Mode; HTTP Request URLs juga didukung. Mode relay ditujukan untuk deployment terkelola ketika router tepercaya memiliki ingress Slack.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM Slack default menggunakan mode pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku command native dan katalog command.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas-channel dan playbook perbaikan.
  </Card>
</CardGroup>

## Memilih Socket Mode atau HTTP Request URLs

Kedua transport siap produksi dan mencapai paritas fitur untuk perpesanan, slash commands, App Home, dan interaktivitas. Pilih berdasarkan bentuk deployment, bukan fitur.

| Hal                          | Socket Mode (default)                                                                                                                               | HTTP Request URLs                                                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| URL Gateway publik           | Tidak diperlukan                                                                                                                                     | Diperlukan (DNS, TLS, reverse proxy, atau tunnel)                                                                    |
| Jaringan outbound            | WSS outbound ke `wss-primary.slack.com` harus dapat dijangkau                                                                                        | Tidak ada WS outbound; hanya HTTPS inbound                                                                           |
| Token yang dibutuhkan        | Bot token + App-Level Token dengan `connections:write`                                                                                               | Bot token + Signing Secret                                                                                          |
| Laptop dev / di balik firewall | Berfungsi apa adanya                                                                                                                               | Membutuhkan tunnel publik (ngrok, Cloudflare Tunnel, Tailscale Funnel) atau Gateway staging                         |
| Penskalaan horizontal        | Satu sesi Socket Mode per aplikasi per host; beberapa Gateway membutuhkan aplikasi Slack terpisah                                                     | Handler POST tanpa state; beberapa replika Gateway dapat berbagi satu aplikasi di balik load balancer               |
| Multi-akun pada satu Gateway | Didukung; setiap akun membuka WS sendiri                                                                                                             | Didukung; setiap akun membutuhkan `webhookPath` unik (default `/slack/events`) agar registrasi tidak bertabrakan    |
| Transport slash command      | Dikirim melalui koneksi WS; `slash_commands[].url` diabaikan                                                                                         | Slack mengirim POST ke `slash_commands[].url`; field diperlukan agar command dikirim                                |
| Penandatanganan request      | Tidak digunakan (auth adalah App-Level Token)                                                                                                        | Slack menandatangani setiap request; OpenClaw memverifikasi dengan `signingSecret`                                  |
| Pemulihan saat koneksi putus | Reconnect otomatis Slack SDK diaktifkan; OpenClaw juga memulai ulang sesi Socket Mode yang gagal dengan backoff terbatas. Tuning transport pong-timeout berlaku. | Tidak ada koneksi persisten yang putus; retry dilakukan per-request dari Slack                                      |

<Note>
  **Pilih Socket Mode** untuk host Gateway tunggal, laptop dev, dan jaringan on-prem yang dapat menjangkau `*.slack.com` secara outbound tetapi tidak dapat menerima HTTPS inbound.

**Pilih HTTP Request URLs** saat menjalankan beberapa replika Gateway di balik load balancer, saat WSS outbound diblokir tetapi HTTPS inbound diizinkan, atau saat Anda sudah menghentikan Slack webhooks di reverse proxy.
</Note>

### Mode relay

Mode relay memisahkan ingress Slack dari gateway OpenClaw. Router tepercaya memiliki
satu koneksi Slack Socket Mode, memilih gateway tujuan, dan meneruskan event bertipe
melalui websocket terautentikasi. Gateway tetap menggunakan bot token-nya untuk
panggilan Slack Web API outbound.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

URL relay harus menggunakan `wss://` kecuali menargetkan localhost. Perlakukan bearer token dan
tabel rute router sebagai bagian dari batas otorisasi Slack: event yang dirutekan masuk ke
handler pesan Slack normal sebagai aktivasi terotorisasi. `slack_identity` yang disediakan router
dalam frame `hello` websocket dapat menetapkan username dan ikon outbound default; identitas
eksplisit yang diberikan pemanggil tetap menang. Koneksi relay melakukan reconnect dengan
timing backoff terbatas yang sama seperti Socket Mode dan menghapus identitas yang disediakan router setiap kali
terputus.

## Instal

Instal Slack sebelum mengonfigurasi channel:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` mendaftarkan dan mengaktifkan plugin. Plugin tetap tidak melakukan apa pun sampai Anda mengonfigurasi aplikasi Slack dan pengaturan channel di bawah. Lihat [Plugins](/id/tools/plugin) untuk perilaku plugin umum dan aturan instalasi.

## Setup cepat

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Recommended** cocok dengan set fitur lengkap plugin Slack: App Home, slash commands, file, reaction, pin, DM grup, serta pembacaan emoji/usergroup. Pilih **Minimal** ketika kebijakan workspace membatasi scope — ini mencakup DM, riwayat channel/grup, mention, dan slash commands tetapi menghapus file, reaction, pin, DM grup (`mpim:*`), `emoji:read`, dan `usergroups:read`. Lihat [Checklist manifest dan scope](#manifest-and-scope-checklist) untuk alasan per-scope dan opsi aditif seperti slash commands tambahan.
        </Note>

        Setelah Slack membuat aplikasi:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: tambahkan `connections:write`, simpan, salin App-Level Token.
        - **Install App -> Install to Workspace**: salin Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Setup SecretRef yang direkomendasikan:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
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
        Buka [api.slack.com/apps](https://api.slack.com/apps/new) → **Buat Aplikasi Baru** → **Dari manifes** → pilih workspace Anda → tempel salah satu manifes di bawah → ganti `https://gateway-host.example.com/slack/events` dengan URL Gateway publik Anda → **Berikutnya** → **Buat**.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Direkomendasikan** cocok dengan rangkaian fitur lengkap Plugin Slack; **Minimal** menghilangkan file, reaksi, pin, DM grup (`mpim:*`), `emoji:read`, dan `usergroups:read` untuk workspace yang ketat. Lihat [Daftar periksa manifes dan cakupan](#manifest-and-scope-checklist) untuk alasan per cakupan.
        </Note>

        <Info>
          Tiga kolom URL (`slash_commands[].url`, `event_subscriptions.request_url`, dan `interactivity.request_url` / `message_menu_options_url`) semuanya mengarah ke endpoint OpenClaw yang sama. Skema manifes Slack mengharuskannya diberi nama secara terpisah, tetapi OpenClaw merutekan berdasarkan jenis payload sehingga satu `webhookPath` (default `/slack/events`) sudah cukup. Perintah slash tanpa `slash_commands[].url` akan diam-diam tidak melakukan apa pun dalam mode HTTP.
        </Info>

        Setelah Slack membuat aplikasi:

        - **Informasi Dasar → Kredensial Aplikasi**: salin **Signing Secret** untuk verifikasi permintaan.
        - **Instal Aplikasi -> Instal ke Workspace**: salin Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Penyiapan SecretRef yang direkomendasikan:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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

        Berikan setiap akun `webhookPath` yang berbeda (default `/slack/events`) agar registrasi tidak bertabrakan.
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

## Penyesuaian transport Mode Socket

OpenClaw menetapkan timeout pong klien Slack SDK ke 15 detik secara default untuk Mode Socket. Timpa pengaturan transport hanya ketika Anda membutuhkan penyesuaian khusus workspace atau host:

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

Gunakan ini hanya untuk workspace Mode Socket yang mencatat timeout pong websocket Slack/ping server atau berjalan di host dengan kelaparan event loop yang diketahui. `clientPingTimeout` adalah waktu tunggu pong setelah SDK mengirim ping klien; `serverPingTimeout` adalah waktu tunggu untuk ping server Slack. Pesan dan event aplikasi tetap menjadi status aplikasi, bukan sinyal keaktifan transport.

Catatan:

- `socketMode` diabaikan dalam mode URL Permintaan HTTP.
- Pengaturan dasar `channels.slack.socketMode` berlaku untuk semua akun Slack kecuali ditimpa. Penimpaan per akun menggunakan `channels.slack.accounts.<accountId>.socketMode`; karena ini adalah penimpaan objek, sertakan setiap kolom penyesuaian socket yang Anda inginkan untuk akun tersebut.
- Hanya `clientPingTimeout` yang memiliki default OpenClaw (`15000`). `serverPingTimeout` dan `pingPongLoggingEnabled` diteruskan ke Slack SDK hanya ketika dikonfigurasi.
- Backoff restart Mode Socket dimulai sekitar 2 detik dan dibatasi sekitar 30 detik. Kegagalan start, start-wait, dan disconnect yang dapat dipulihkan akan dicoba ulang hingga channel berhenti. Error akun dan kredensial permanen seperti autentikasi tidak valid, token dicabut, atau cakupan hilang akan gagal cepat alih-alih mencoba ulang selamanya.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Tampilkan berbagai fitur yang memperluas default di atas.

Manifes default mengaktifkan tab **Beranda** Slack App Home dan berlangganan ke `app_home_opened`. Saat anggota workspace membuka tab Beranda, OpenClaw menerbitkan tampilan Beranda default yang aman dengan `views.publish`; tidak ada payload percakapan atau konfigurasi privat yang disertakan. Tab **Pesan** tetap diaktifkan untuk DM Slack. Manifes juga mengaktifkan utas asisten Slack dengan `features.assistant_view`, `assistant:write`, `assistant_thread_started`, dan `assistant_thread_context_changed`; utas asisten dirutekan ke sesi utas OpenClaw tersendiri dan menjaga konteks utas yang disediakan Slack tetap tersedia bagi agen.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Beberapa [perintah slash native](#commands-and-slash-behavior) dapat digunakan sebagai pengganti satu perintah yang dikonfigurasi, dengan beberapa nuansa:

    - Gunakan `/agentstatus` sebagai pengganti `/status` karena perintah `/status` dicadangkan.
    - Tidak lebih dari 25 perintah slash dapat tersedia sekaligus.

    Ganti bagian `features.slash_commands` yang ada dengan subset dari [perintah yang tersedia](/id/tools/slash-commands#command-list):

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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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
        Gunakan daftar `slash_commands` yang sama seperti Socket Mode di atas, dan tambahkan `"url": "https://gateway-host.example.com/slack/events"` ke setiap entri. Contoh:

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
  <Accordion title="Optional authorship scopes (write operations)">
    Tambahkan cakupan bot `chat:write.customize` jika Anda ingin pesan keluar menggunakan identitas agen aktif (nama pengguna dan ikon kustom), bukan identitas aplikasi Slack default.

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

- `botToken` + `appToken` wajib untuk Socket Mode.
- Mode HTTP memerlukan `botToken` + `signingSecret`.
- Mode relay memerlukan `botToken` serta `relay.url`, `relay.authToken`, dan `relay.gatewayId`; mode ini tidak menggunakan token aplikasi atau signing secret.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken`, dan `userToken` menerima string teks biasa
  atau objek SecretRef.
- Token konfigurasi menimpa fallback env.
- Fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` hanya berlaku untuk akun default.
- `userToken` hanya melalui konfigurasi (tanpa fallback env) dan default ke perilaku hanya-baca (`userTokenReadOnly: true`).

Perilaku snapshot status:

- Inspeksi akun Slack melacak kolom `*Source` dan `*Status` per kredensial
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status adalah `available`, `configured_unavailable`, atau `missing`.
- `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef
  atau sumber rahasia non-inline lainnya, tetapi jalur perintah/runtime saat ini
  tidak dapat menyelesaikan nilai aktualnya.
- Dalam mode HTTP, `signingSecretStatus` disertakan; dalam Socket Mode,
  pasangan wajibnya adalah `botTokenStatus` + `appTokenStatus`.

<Tip>
Untuk aksi/pembacaan direktori, token pengguna dapat diprioritaskan saat dikonfigurasi. Untuk penulisan, token bot tetap diprioritaskan; penulisan dengan token pengguna hanya diizinkan saat `userTokenReadOnly: false` dan token bot tidak tersedia.
</Tip>

## Aksi dan gate

Aksi Slack dikendalikan oleh `channels.slack.actions.*`.

Grup aksi yang tersedia dalam tooling Slack saat ini:

| Grup       | Default      |
| ---------- | ------------ |
| messages   | diaktifkan   |
| reactions  | diaktifkan   |
| pins       | diaktifkan   |
| memberInfo | diaktifkan   |
| emojiList  | diaktifkan   |

Aksi pesan Slack saat ini mencakup `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, dan `emoji-list`. `download-file` menerima ID file Slack yang ditampilkan dalam placeholder file masuk dan mengembalikan pratinjau gambar untuk gambar atau metadata file lokal untuk jenis file lainnya.

## Kontrol akses dan perutean

  <Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` mengontrol akses DM. `channels.slack.allowFrom` adalah daftar izin DM kanonis.

    - `pairing` (default)
    - `allowlist`
    - `open` (mengharuskan `channels.slack.allowFrom` menyertakan `"*"`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (default true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (lama)
    - `dm.groupEnabled` (DM grup default false)
    - `dm.groupChannels` (daftar izin MPIM opsional)

    Presedensi multi-akun:

    - `channels.slack.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Akun bernama mewarisi `channels.slack.allowFrom` ketika `allowFrom` miliknya sendiri belum disetel.
    - Akun bernama tidak mewarisi `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` dan `channels.slack.dm.allowFrom` lama masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` jika dapat melakukannya tanpa mengubah akses.

    Pemasangan di DM menggunakan `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` mengontrol penanganan saluran:

    - `open`
    - `allowlist`
    - `disabled`

    Daftar izin saluran berada di bawah `channels.slack.channels` dan **harus menggunakan ID saluran Slack yang stabil** (misalnya `C12345678`) sebagai kunci konfigurasi.

    Catatan runtime: jika `channels.slack` sepenuhnya tidak ada (penyiapan hanya env), runtime akan kembali ke `groupPolicy="allowlist"` dan mencatat peringatan (meskipun `channels.defaults.groupPolicy` disetel).

    Resolusi nama/ID:

    - entri daftar izin saluran dan entri daftar izin DM diselesaikan saat startup ketika akses token memungkinkan
    - entri nama saluran yang tidak terselesaikan dipertahankan seperti yang dikonfigurasi tetapi diabaikan untuk perutean secara default
    - otorisasi masuk dan perutean saluran mengutamakan ID secara default; pencocokan langsung nama pengguna/slug memerlukan `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Kunci berbasis nama (`#channel-name` atau `channel-name`) **tidak** cocok di bawah `groupPolicy: "allowlist"`. Pencarian saluran mengutamakan ID secara default, sehingga kunci berbasis nama tidak akan pernah berhasil dirutekan dan semua pesan di saluran itu akan diblokir secara diam-diam. Ini berbeda dari `groupPolicy: "open"`, yang tidak memerlukan kunci saluran untuk perutean dan kunci berbasis nama tampak berfungsi.

    Selalu gunakan ID saluran Slack sebagai kunci. Untuk menemukannya: klik kanan saluran di Slack → **Copy link** — ID (`C...`) muncul di akhir URL.

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

    Salah (diblokir secara diam-diam di bawah `groupPolicy: "allowlist"`):

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

  <Tab title="Mentions and channel users">
    Pesan saluran dibatasi oleh penyebutan secara default.

    Sumber penyebutan:

    - penyebutan aplikasi eksplisit (`<@botId>`)
    - penyebutan grup pengguna Slack (`<!subteam^S...>`) ketika pengguna bot adalah anggota grup pengguna tersebut; memerlukan `usergroups:read`
    - pola regex penyebutan (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku thread balasan-ke-bot implisit (dinonaktifkan ketika `thread.requireExplicitMention` adalah `true`)

    Kontrol per saluran (`channels.slack.channels.<id>`; nama hanya melalui resolusi startup atau `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (daftar izin)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format kunci `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, atau wildcard `"*"`
      (kunci lama tanpa prefiks masih dipetakan ke `id:` saja)

    `allowBots` bersifat konservatif untuk channel dan channel privat: pesan room yang dibuat bot diterima hanya ketika bot pengirim secara eksplisit tercantum dalam allowlist `users` room tersebut, atau ketika setidaknya satu ID pemilik Slack eksplisit dari `channels.slack.allowFrom` saat ini menjadi anggota room. Wildcard dan entri pemilik nama tampilan tidak memenuhi kehadiran pemilik. Kehadiran pemilik menggunakan `conversations.members` Slack; pastikan aplikasi memiliki cakupan baca yang sesuai untuk jenis room (`channels:read` untuk channel publik, `groups:read` untuk channel privat). Jika pencarian anggota gagal, OpenClaw membuang pesan room yang dibuat bot.

    Pesan Slack yang dibuat bot dan diterima menggunakan [perlindungan loop bot](/id/channels/bot-loop-protection) bersama. Konfigurasikan `channels.defaults.botLoopProtection` untuk anggaran default, lalu timpa dengan `channels.slack.botLoopProtection` atau `channels.slack.channels.<id>.botLoopProtection` ketika workspace atau channel membutuhkan batas yang berbeda.

  </Tab>
</Tabs>

## Thread, sesi, dan tag balasan

- DM dirutekan sebagai `direct`; channel sebagai `channel`; MPIM sebagai `group`.
- Pengikatan rute Slack menerima ID peer mentah plus bentuk target Slack seperti `channel:C12345678`, `user:U12345678`, dan `<@U12345678>`.
- Dengan default `session.dmScope=main`, DM Slack diciutkan ke sesi utama agen.
- Sesi channel: `agent:<agentId>:slack:channel:<channelId>`.
- Pesan channel level atas biasa tetap berada di sesi per channel, bahkan ketika `replyToMode` bukan `off`.
- Balasan thread Slack menggunakan `thread_ts` induk Slack untuk sufiks sesi (`:thread:<threadTs>`), bahkan ketika thread balasan keluar dinonaktifkan dengan `replyToMode="off"`.
- OpenClaw menanamkan root channel level atas yang memenuhi syarat ke dalam `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` ketika root tersebut diharapkan memulai thread Slack yang terlihat, sehingga root dan balasan thread berikutnya berbagi satu sesi OpenClaw. Ini berlaku untuk event `app_mention`, kecocokan bot eksplisit atau pola penyebutan terkonfigurasi, dan channel `requireMention: false` dengan `replyToMode` non-`off`.
- Default `channels.slack.thread.historyScope` adalah `thread`; default `thread.inheritParent` adalah `false`.
- `channels.slack.thread.initialHistoryLimit` mengontrol berapa banyak pesan thread yang sudah ada yang diambil ketika sesi thread baru dimulai (default `20`; setel `0` untuk menonaktifkan).
- `channels.slack.thread.requireExplicitMention` (default `false`): ketika `true`, menekan penyebutan thread implisit sehingga bot hanya merespons penyebutan `@bot` eksplisit di dalam thread, bahkan ketika bot sudah berpartisipasi dalam thread tersebut. Tanpa ini, balasan dalam thread yang diikuti bot melewati gerbang `requireMention`.

Kontrol thread balasan:

- `channels.slack.replyToMode`: `off|first|all|batched` (default `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback lama untuk chat langsung: `channels.slack.dm.replyToMode`

Tag balasan manual didukung:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Untuk balasan thread Slack eksplisit dari alat `message`, setel `replyBroadcast: true` dengan `action: "send"` dan `threadId` atau `replyTo` untuk meminta Slack juga menyiarkan balasan thread ke channel induk. Ini dipetakan ke flag `reply_broadcast` `chat.postMessage` Slack dan hanya didukung untuk pengiriman teks atau Block Kit, bukan unggahan media.

Ketika panggilan alat `message` berjalan di dalam thread Slack dan menargetkan channel yang sama, OpenClaw biasanya mewarisi thread Slack saat ini sesuai `replyToMode`. Setel `topLevel: true` pada `action: "send"` atau `action: "upload-file"` untuk memaksa pesan channel induk baru sebagai gantinya. `threadId: null` diterima sebagai opt-out level atas yang sama.

<Note>
`replyToMode="off"` menonaktifkan thread balasan Slack keluar, termasuk tag `[[reply_to_*]]` eksplisit. Ini tidak meratakan sesi thread Slack masuk: pesan yang sudah diposting di dalam thread Slack tetap dirutekan ke sesi `:thread:<threadTs>`. Ini berbeda dari Telegram, tempat tag eksplisit tetap dihormati dalam mode `"off"`. Thread Slack menyembunyikan pesan dari channel sementara balasan Telegram tetap terlihat sebaris.
</Note>

## Reaksi ack

`ackReaction` mengirim emoji pengakuan saat OpenClaw memproses pesan masuk. `ackReactionScope` menentukan _kapan_ emoji itu benar-benar dikirim.

### Emoji (`ackReaction`)

Urutan resolusi:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen (`agents.list[].identity.emoji`, atau `"eyes"` / 👀)

Catatan:

- Slack mengharapkan shortcode (misalnya `"eyes"`).
- Gunakan `""` untuk menonaktifkan reaksi untuk akun Slack atau secara global.

### Cakupan (`messages.ackReactionScope`)

Provider Slack membaca cakupan dari `messages.ackReactionScope` (default `"group-mentions"`). Saat ini tidak ada penimpaan level akun Slack atau level channel Slack; nilainya bersifat global untuk Gateway.

Nilai:

- `"all"`: bereaksi di DM dan grup.
- `"direct"`: bereaksi hanya di DM.
- `"group-all"`: bereaksi pada setiap pesan grup (tanpa DM).
- `"group-mentions"` (default): bereaksi di grup, tetapi hanya ketika bot disebut (atau di mentionable grup yang ikut serta). **DM dikecualikan.**
- `"off"` / `"none"`: jangan pernah bereaksi.

<Note>
Cakupan default (`"group-mentions"`) tidak memicu reaksi ack di pesan langsung. Untuk melihat `ackReaction` terkonfigurasi (misalnya `"eyes"`) pada DM Slack masuk, setel `messages.ackReactionScope` ke `"direct"` atau `"all"`. `messages.ackReactionScope` dibaca saat startup provider Slack, sehingga restart gateway diperlukan agar perubahan berlaku.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // bereaksi di DM dan grup
  },
}
```

## Streaming teks

`channels.slack.streaming` mengontrol perilaku pratinjau langsung:

- `off`: nonaktifkan streaming pratinjau langsung.
- `partial` (default): ganti teks pratinjau dengan output parsial terbaru.
- `block`: tambahkan pembaruan pratinjau dalam potongan.
- `progress`: tampilkan teks status progres saat menghasilkan, lalu kirim teks final.
- `streaming.preview.toolProgress`: ketika pratinjau draf aktif, rutekan pembaruan alat/progres ke pesan pratinjau yang sama yang diedit (default: `true`). Setel `false` untuk mempertahankan pesan alat/progres terpisah.
- `streaming.preview.commandText` / `streaming.progress.commandText`: setel ke `status` untuk mempertahankan baris progres alat yang ringkas sambil menyembunyikan teks command/exec mentah (default: `raw`).

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

Kartu tugas progres native Slack bersifat opt-in untuk mode progres. Setel `channels.slack.streaming.progress.nativeTaskCards` ke `true` dengan `channels.slack.streaming.mode="progress"` untuk mengirim kartu rencana/tugas native Slack saat pekerjaan berjalan, lalu memperbarui kartu tugas yang sama saat selesai. Tanpa flag ini, mode progres mempertahankan perilaku pratinjau draf portabel.

- Thread balasan harus tersedia agar streaming teks native dan status thread asisten Slack muncul. Pemilihan thread tetap mengikuti `replyToMode`.
- Root channel, chat grup, dan DM level atas masih dapat menggunakan pratinjau draf normal ketika streaming native tidak tersedia atau tidak ada thread balasan.
- DM Slack level atas tetap di luar thread secara default, sehingga tidak menampilkan pratinjau stream/status native bergaya thread milik Slack; OpenClaw memposting dan mengedit pratinjau draf di DM sebagai gantinya.
- Media dan payload non-teks fallback ke pengiriman normal.
- Final media/error membatalkan edit pratinjau tertunda; final teks/blok yang memenuhi syarat hanya di-flush ketika dapat mengedit pratinjau di tempat.
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

Ikut serta dalam kartu tugas progres native Slack:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Kunci lama:

- `channels.slack.streamMode` (`replace | status_final | append`) adalah alias runtime lama untuk `channels.slack.streaming.mode`.
- boolean `channels.slack.streaming` adalah alias runtime lama untuk `channels.slack.streaming.mode` dan `channels.slack.streaming.nativeTransport`.
- `channels.slack.nativeStreaming` lama adalah alias runtime untuk `channels.slack.streaming.nativeTransport`.
- Jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi streaming Slack tersimpan ke kunci kanonis.

## Fallback reaksi mengetik

`typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat OpenClaw memproses balasan, lalu menghapusnya ketika run selesai. Ini paling berguna di luar balasan thread, yang menggunakan indikator status default "sedang mengetik...".

Urutan resolusi:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Catatan:

- Slack mengharapkan shortcode (misalnya `"hourglass_flowing_sand"`).
- Reaksi bersifat best-effort dan pembersihan dicoba secara otomatis setelah jalur balasan atau kegagalan selesai.

## Media, pemotongan, dan pengiriman

<AccordionGroup>
  <Accordion title="Lampiran masuk">
    Lampiran file Slack diunduh dari URL privat yang dihosting Slack (alur permintaan terautentikasi token) dan ditulis ke penyimpanan media ketika pengambilan berhasil dan batas ukuran mengizinkan. Placeholder file menyertakan `fileId` Slack sehingga agen dapat mengambil file asli dengan `download-file`.

    Unduhan menggunakan timeout idle dan total yang dibatasi. Jika pengambilan file Slack macet atau gagal, OpenClaw tetap memproses pesan dan fallback ke placeholder file.

    Batas ukuran runtime masuk default ke `20MB` kecuali ditimpa oleh `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Teks dan file keluar">
    - potongan teks menggunakan `channels.slack.textChunkLimit` (default 4000)
    - `channels.slack.chunkMode="newline"` mengaktifkan pemisahan yang mengutamakan paragraf
    - pengiriman file menggunakan API unggah Slack dan dapat menyertakan balasan thread (`thread_ts`)
    - batas media keluar mengikuti `channels.slack.mediaMaxMb` ketika dikonfigurasi; jika tidak, pengiriman channel menggunakan default jenis MIME dari pipeline media

  </Accordion>

  <Accordion title="Target pengiriman">
    Target eksplisit yang disukai:

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

Perintah native memerlukan [pengaturan manifes tambahan](#additional-manifest-settings) di aplikasi Slack Anda dan diaktifkan dengan `channels.slack.commands.native: true` atau `commands.native: true` di konfigurasi global sebagai gantinya.

- Mode otomatis perintah native **nonaktif** untuk Slack sehingga `commands.native: "auto"` tidak mengaktifkan perintah native Slack.

```txt
/help
```

Menu argumen native menggunakan strategi rendering adaptif yang menampilkan modal konfirmasi sebelum mengirimkan nilai opsi yang dipilih:

- hingga 5 opsi: blok tombol
- 6-100 opsi: menu pilih statis
- lebih dari 100 opsi: pilih eksternal dengan pemfilteran opsi asinkron ketika handler opsi interaktivitas tersedia
- batas Slack terlampaui: nilai opsi yang dikodekan fallback ke tombol

```txt
/think
```

Sesi slash menggunakan kunci terisolasi seperti `agent:<agentId>:slack:slash:<userId>` dan tetap merutekan eksekusi perintah ke sesi percakapan target menggunakan `CommandTargetSessionKey`.

## Balasan interaktif

Slack dapat merender kontrol balasan interaktif yang dibuat agen, tetapi fitur ini dinonaktifkan secara default.
Untuk output agen, CLI, dan Plugin baru, utamakan tombol
`presentation` bersama atau blok pilihan. Keduanya menggunakan jalur interaksi Slack
yang sama sekaligus menurun fungsinya di saluran lain.

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

Saat diaktifkan, agen masih dapat memancarkan direktif balasan khusus Slack yang tidak digunakan lagi:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Direktif ini dikompilasi menjadi Slack Block Kit dan merutekan klik atau pilihan
kembali melalui jalur peristiwa interaksi Slack yang sudah ada. Pertahankan untuk prompt lama
dan jalan keluar khusus Slack; gunakan presentasi bersama untuk kontrol portabel
baru.

API kompilator direktif juga tidak digunakan lagi untuk kode produsen baru:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Gunakan payload `presentation` dan `buildSlackPresentationBlocks(...)` untuk kontrol
baru yang dirender Slack.

Catatan:

- Ini adalah UI lama khusus Slack. Saluran lain tidak menerjemahkan direktif Slack Block
  Kit menjadi sistem tombol mereka sendiri.
- Nilai callback interaktif adalah token buram yang dihasilkan OpenClaw, bukan nilai mentah yang dibuat agen.
- Jika blok interaktif yang dihasilkan akan melampaui batas Slack Block Kit, OpenClaw kembali ke balasan teks asli alih-alih mengirim payload blok yang tidak valid.

### Pengiriman modal milik Plugin

Plugin Slack yang mendaftarkan handler interaktif juga dapat menerima peristiwa siklus hidup modal
`view_submission` dan `view_closed` sebelum OpenClaw memadatkan
payload untuk peristiwa sistem yang terlihat agen. Gunakan salah satu pola perutean
ini saat membuka modal Slack:

- Atur `callback_id` ke `openclaw:<namespace>:<payload>`.
- Atau pertahankan `callback_id` yang ada dan letakkan `pluginInteractiveData:
"<namespace>:<payload>"` dalam `private_metadata` modal.

Handler menerima `ctx.interaction.kind` sebagai `view_submission` atau
`view_closed`, `inputs` yang dinormalisasi, dan objek mentah penuh `stateValues` dari
Slack. Perutean hanya callback-id cukup untuk memanggil handler Plugin; sertakan
field perutean pengguna/sesi `private_metadata` modal yang ada saat
modal juga harus menghasilkan peristiwa sistem yang terlihat agen. Agen menerima
peristiwa sistem `Slack interaction: ...` yang ringkas dan disunting. Jika handler mengembalikan
`systemEvent.summary`, `systemEvent.reference`, atau `systemEvent.data`, field
tersebut disertakan dalam peristiwa ringkas itu sehingga agen dapat merujuk
penyimpanan milik Plugin tanpa melihat payload formulir lengkap.

## Persetujuan native di Slack

Slack dapat bertindak sebagai klien persetujuan native dengan tombol dan interaksi interaktif, alih-alih kembali ke UI Web atau terminal.

- Persetujuan exec dan Plugin dapat dirender sebagai prompt Slack-native Block Kit.
- `channels.slack.execApprovals.*` tetap menjadi konfigurasi pengaktifan klien persetujuan exec native dan perutean DM/saluran.
- DM persetujuan exec menggunakan `channels.slack.execApprovals.approvers` atau `commands.ownerAllowFrom`.
- Persetujuan Plugin menggunakan tombol Slack-native saat Slack diaktifkan sebagai klien persetujuan native untuk sesi asal, atau saat `approvals.plugin` merutekan ke sesi Slack asal atau target Slack.
- DM persetujuan Plugin menggunakan pemberi persetujuan Plugin Slack dari `channels.slack.allowFrom`, `allowFrom` akun bernama, atau rute default akun.
- Otorisasi pemberi persetujuan tetap diberlakukan: pemberi persetujuan khusus exec tidak dapat menyetujui permintaan Plugin kecuali mereka juga merupakan pemberi persetujuan Plugin.

Ini menggunakan permukaan tombol persetujuan bersama yang sama seperti saluran lain. Saat `interactivity` diaktifkan di pengaturan aplikasi Slack Anda, prompt persetujuan dirender sebagai tombol Block Kit langsung dalam percakapan.
Saat tombol tersebut ada, tombol itu adalah UX persetujuan utama; OpenClaw
sebaiknya hanya menyertakan perintah manual `/approve` saat hasil alat menyatakan persetujuan chat
tidak tersedia atau persetujuan manual adalah satu-satunya jalur.

Jalur konfigurasi:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opsional; kembali ke `commands.ownerAllowFrom` bila memungkinkan)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `agentFilter`, `sessionFilter`

Slack mengaktifkan otomatis persetujuan exec native saat `enabled` tidak diatur atau `"auto"` dan setidaknya satu
pemberi persetujuan exec berhasil di-resolve. Slack juga dapat menangani persetujuan Plugin native melalui jalur klien native
ini saat pemberi persetujuan Plugin Slack berhasil di-resolve dan permintaan cocok dengan filter klien native. Atur
`enabled: false` untuk menonaktifkan Slack sebagai klien persetujuan native secara eksplisit. Atur `enabled: true` untuk
memaksa persetujuan native aktif saat pemberi persetujuan berhasil di-resolve. Menonaktifkan persetujuan exec Slack tidak menonaktifkan
pengiriman persetujuan Plugin Slack native yang diaktifkan melalui `approvals.plugin`; pengiriman persetujuan Plugin
menggunakan pemberi persetujuan Plugin Slack sebagai gantinya.

Perilaku default tanpa konfigurasi persetujuan exec Slack eksplisit:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Konfigurasi Slack-native eksplisit hanya diperlukan saat Anda ingin menimpa pemberi persetujuan, menambahkan filter, atau
memilih pengiriman ke chat asal:

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

Penerusan `approvals.exec` bersama bersifat terpisah. Gunakan hanya saat prompt persetujuan exec juga harus
dirutekan ke chat lain atau target out-of-band eksplisit. Penerusan `approvals.plugin` bersama juga
terpisah; pengiriman native Slack menekan fallback itu hanya saat Slack dapat menangani permintaan persetujuan Plugin
secara native.

`/approve` dalam chat yang sama juga berfungsi di saluran Slack dan DM yang sudah mendukung perintah. Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk model penerusan persetujuan lengkap.

## Peristiwa dan perilaku operasional

- Edit/hapus pesan dipetakan ke peristiwa sistem.
- Siaran thread (balasan thread "Juga kirim ke saluran") diproses sebagai pesan pengguna normal.
- Peristiwa tambah/hapus reaksi dipetakan ke peristiwa sistem.
- Peristiwa anggota bergabung/keluar, saluran dibuat/diubah nama, dan tambah/hapus pin dipetakan ke peristiwa sistem.
- `channel_id_changed` dapat memigrasikan kunci konfigurasi saluran saat `configWrites` diaktifkan.
- Metadata topik/tujuan saluran diperlakukan sebagai konteks tidak tepercaya dan dapat disuntikkan ke konteks perutean.
- Pengisian awal konteks pembuka thread dan riwayat thread awal difilter oleh allowlist pengirim yang dikonfigurasi bila berlaku.
- Aksi blok, shortcut, dan interaksi modal memancarkan peristiwa sistem `Slack interaction: ...` terstruktur dengan field payload kaya:
  - aksi blok: nilai yang dipilih, label, nilai pemilih, dan metadata `workflow_*`
  - shortcut global: metadata callback dan aktor, dirutekan ke sesi langsung aktor
  - shortcut pesan: konteks callback, aktor, saluran, thread, dan pesan terpilih
  - peristiwa modal `view_submission` dan `view_closed` dengan metadata saluran yang dirutekan dan input formulir

Definisikan shortcut global atau pesan dalam konfigurasi aplikasi Slack Anda dan gunakan ID callback tidak kosong apa pun. OpenClaw mengakui payload shortcut yang cocok, menerapkan kebijakan pengirim DM/saluran yang sama seperti interaksi Slack lain, dan mengantrekan peristiwa yang disanitasi untuk sesi agen yang dirutekan. ID pemicu dan URL respons disunting dari konteks agen.

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Slack](/id/gateway/config-channels#slack).

<Accordion title="Field Slack bernilai tinggi">

- mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- akses DM: `dm.enabled`, `dmPolicy`, `allowFrom` (lama: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- toggle kompatibilitas: `dangerouslyAllowNameMatching` (break-glass; biarkan nonaktif kecuali diperlukan)
- akses saluran: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- threading/riwayat: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- unfurl: `unfurlLinks` (default: `false`), `unfurlMedia` untuk kontrol pratinjau tautan/media `chat.postMessage`; atur `unfurlLinks: true` untuk memilih kembali ke pratinjau tautan
- ops/fitur: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada balasan di saluran">
    Periksa, secara berurutan:

    - `groupPolicy`
    - allowlist saluran (`channels.slack.channels`) — **kunci harus berupa ID saluran** (`C12345678`), bukan nama (`#channel-name`). Kunci berbasis nama gagal diam-diam di bawah `groupPolicy: "allowlist"` karena perutean saluran secara default mengutamakan ID. Untuk menemukan ID: klik kanan saluran di Slack → **Copy link** — nilai `C...` di akhir URL adalah ID saluran.
    - `requireMention`
    - allowlist `users` per saluran
    - `messages.groupChat.visibleReplies`: permintaan grup/saluran normal default ke `"automatic"`. Jika Anda memilih `"message_tool"` dan log menampilkan teks asisten tanpa panggilan `message(action=send)`, model melewatkan jalur alat pesan yang terlihat. Teks akhir tetap privat dalam mode ini; periksa log verbose gateway untuk metadata payload yang ditekan, atau atur ke `"automatic"` jika Anda ingin setiap balasan akhir asisten normal diposting melalui jalur lama.
    - `messages.groupChat.unmentionedInbound`: jika nilainya `"room_event"`, percakapan saluran yang diizinkan tanpa mention adalah konteks sekitar dan tetap senyap kecuali agen memanggil alat `message`. Lihat [Peristiwa ruang sekitar](/id/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - `channels.slack.dmPolicy` (atau `channels.slack.dm.policy` lama)
    - persetujuan pairing / entri allowlist (`dmPolicy: "open"` tetap memerlukan `channels.slack.allowFrom: ["*"]`)
    - DM grup menggunakan penanganan MPIM; aktifkan `channels.slack.dm.groupEnabled` dan, jika dikonfigurasi, sertakan MPIM dalam `channels.slack.dm.groupChannels`
    - Peristiwa DM Slack Assistant: log verbose yang menyebutkan `drop message_changed`
      biasanya berarti Slack mengirim peristiwa thread Assistant yang diedit tanpa
      pengirim manusia yang dapat dipulihkan dalam metadata pesan

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket mode tidak tersambung">
    Validasi token bot + aplikasi dan pengaktifan Socket Mode di pengaturan aplikasi Slack.
    App-Level Token memerlukan `connections:write`, dan Bot User OAuth Token
    bot token harus milik aplikasi/ruang kerja Slack yang sama dengan token aplikasi.

    Jika `openclaw channels status --probe --json` menampilkan `botTokenStatus` atau
    `appTokenStatus: "configured_unavailable"`, akun Slack
    telah dikonfigurasi tetapi runtime saat ini tidak dapat me-resolve nilai berbasis SecretRef.

    Log seperti `slack socket mode failed to start; retry ...` adalah kegagalan
    mulai yang dapat dipulihkan. Scope yang hilang, token yang dicabut, dan autentikasi tidak valid akan gagal cepat
    sebagai gantinya. Log `slack token mismatch ...` berarti token bot dan token aplikasi
    tampaknya milik aplikasi Slack yang berbeda; perbaiki kredensial aplikasi Slack.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Validasi:

    - signing secret
    - jalur webhook
    - URL Permintaan Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` unik per akun HTTP
    - URL publik mengakhiri TLS dan meneruskan permintaan ke jalur Gateway
    - jalur `request_url` aplikasi Slack sama persis dengan `channels.slack.webhookPath` (default `/slack/events`)

    Jika `signingSecretStatus: "configured_unavailable"` muncul dalam snapshot
    akun, akun HTTP sudah dikonfigurasi tetapi runtime saat ini tidak dapat
    menyelesaikan signing secret yang didukung SecretRef.

    Log berulang `slack: webhook path ... already registered` berarti dua akun HTTP
    menggunakan `webhookPath` yang sama; berikan setiap akun jalur yang berbeda.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Verifikasi apakah yang Anda maksud adalah:

    - mode perintah native (`channels.slack.commands.native: true`) dengan perintah slash yang sesuai terdaftar di Slack
    - atau mode perintah slash tunggal (`channels.slack.slashCommand.enabled: true`)

    Slack tidak membuat atau menghapus perintah slash secara otomatis. `commands.native: "auto"` tidak mengaktifkan perintah native Slack; gunakan `true` dan buat perintah yang sesuai di aplikasi Slack. Dalam mode HTTP, setiap perintah slash Slack harus menyertakan URL Gateway. Dalam Socket Mode, payload perintah tiba melalui websocket dan Slack mengabaikan `slash_commands[].url`.

    Periksa juga `commands.useAccessGroups`, otorisasi DM, allowlist channel,
    dan allowlist `users` per channel. Slack mengembalikan error ephemeral untuk
    pengirim perintah slash yang diblokir, termasuk:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referensi vision lampiran

Slack dapat melampirkan media yang diunduh ke giliran agen ketika unduhan file Slack berhasil dan batas ukuran mengizinkan. File gambar dapat diteruskan melalui jalur pemahaman media atau langsung ke model balasan yang mendukung vision; file lain dipertahankan sebagai konteks file yang dapat diunduh, bukan diperlakukan sebagai input gambar.

### Jenis media yang didukung

| Jenis media                    | Sumber               | Perilaku saat ini                                                               | Catatan                                                                    |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Gambar JPEG / PNG / GIF / WebP | URL file Slack       | Diunduh dan dilampirkan ke giliran untuk penanganan yang mendukung vision        | Batas per file: `channels.slack.mediaMaxMb` (default 20 MB)               |
| File PDF                       | URL file Slack       | Diunduh dan diekspos sebagai konteks file untuk alat seperti `download-file` atau `pdf` | Inbound Slack tidak mengonversi PDF menjadi input image-vision secara otomatis |
| File lain                      | URL file Slack       | Diunduh jika memungkinkan dan diekspos sebagai konteks file                       | File biner tidak diperlakukan sebagai input gambar                         |
| Balasan thread                 | File pemulai thread  | File pesan root dapat dihidrasi sebagai konteks ketika balasan tidak memiliki media langsung | Pemulai hanya file menggunakan placeholder lampiran                        |
| Pesan multi-gambar             | Beberapa file Slack  | Setiap file dievaluasi secara independen                                         | Pemrosesan Slack dibatasi hingga delapan file per pesan                    |

### Pipeline inbound

Ketika pesan Slack dengan lampiran file tiba:

1. OpenClaw mengunduh file dari URL privat Slack menggunakan token bot.
2. File ditulis ke penyimpanan media saat berhasil.
3. Jalur media yang diunduh dan jenis konten ditambahkan ke konteks inbound.
4. Jalur model/alat yang mendukung gambar dapat menggunakan lampiran gambar dari konteks tersebut.
5. File non-gambar tetap tersedia sebagai metadata file atau referensi media untuk alat yang dapat menanganinya.

### Pewarisan lampiran root thread

Ketika pesan tiba dalam thread (memiliki induk `thread_ts`):

- Jika balasan itu sendiri tidak memiliki media langsung dan pesan root yang disertakan memiliki file, Slack dapat menghidrasi file root sebagai konteks pemulai thread.
- Lampiran balasan langsung lebih diprioritaskan daripada lampiran pesan root.
- Pesan root yang hanya memiliki file dan tanpa teks direpresentasikan dengan placeholder lampiran sehingga fallback tetap dapat menyertakan filenya.

### Penanganan multi-lampiran

Ketika satu pesan Slack berisi beberapa lampiran file:

- Setiap lampiran diproses secara independen melalui pipeline media.
- Referensi media yang diunduh digabungkan ke dalam konteks pesan.
- Urutan pemrosesan mengikuti urutan file Slack dalam payload event.
- Kegagalan dalam unduhan satu lampiran tidak memblokir lampiran lainnya.

### Batas ukuran, unduhan, dan model

- **Batas ukuran**: Default 20 MB per file. Dapat dikonfigurasi melalui `channels.slack.mediaMaxMb`.
- **Kegagalan unduhan**: File yang tidak dapat disajikan Slack, URL kedaluwarsa, file yang tidak dapat diakses, file terlalu besar, dan respons HTML autentikasi/login Slack dilewati alih-alih dilaporkan sebagai format yang tidak didukung.
- **Model vision**: Analisis gambar menggunakan model balasan aktif ketika model tersebut mendukung vision, atau model gambar yang dikonfigurasi di `agents.defaults.imageModel`.

### Batasan yang diketahui

| Skenario                              | Perilaku saat ini                                                             | Solusi sementara                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| URL file Slack kedaluwarsa            | File dilewati; tidak ada error yang ditampilkan                               | Unggah ulang file di Slack                                                 |
| Model vision belum dikonfigurasi      | Lampiran gambar disimpan sebagai referensi media, tetapi tidak dianalisis sebagai gambar | Konfigurasikan `agents.defaults.imageModel` atau gunakan model balasan yang mendukung vision |
| Gambar sangat besar (> 20 MB secara default) | Dilewati sesuai batas ukuran                                                  | Tingkatkan `channels.slack.mediaMaxMb` jika Slack mengizinkan              |
| Lampiran yang diteruskan/dibagikan    | Teks dan media gambar/file yang dihosting Slack bersifat upaya terbaik        | Bagikan ulang langsung di thread OpenClaw                                  |
| Lampiran PDF                          | Disimpan sebagai konteks file/media, tidak otomatis dirutekan melalui image vision | Gunakan `download-file` untuk metadata file atau alat `pdf` untuk analisis PDF |

### Dokumentasi terkait

- [Pipeline pemahaman media](/id/nodes/media-understanding)
- [Alat PDF](/id/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Pengaktifan vision lampiran Slack
- Uji regresi: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Verifikasi live: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Terkait

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Slack ke gateway.
  </Card>
  <Card title="Groups" icon="users" href="/id/channels/groups">
    Perilaku channel dan DM grup.
  </Card>
  <Card title="Channel routing" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan inbound ke agen.
  </Card>
  <Card title="Security" icon="shield" href="/id/gateway/security">
    Model ancaman dan hardening.
  </Card>
  <Card title="Configuration" icon="sliders" href="/id/gateway/configuration">
    Tata letak konfigurasi dan prioritas.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Katalog dan perilaku perintah.
  </Card>
</CardGroup>
