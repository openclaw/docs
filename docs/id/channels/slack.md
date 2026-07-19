---
read_when:
    - Menyiapkan Slack atau men-debug mode soket, HTTP, atau relai Slack
summary: Penyiapan Slack dan perilaku runtime (Socket Mode, URL Permintaan HTTP, dan mode relai)
title: Slack
x-i18n:
    generated_at: "2026-07-19T16:36:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99fa9375bba29f3f333bc626b58db945c2f2bcd8b7f8c3365fabd3089415adc2
    source_path: channels/slack.md
    workflow: 16
---

Dukungan Slack mencakup DM dan saluran melalui integrasi aplikasi Slack. Transportasi default adalah Socket Mode; HTTP Request URLs juga didukung. Mode relay ditujukan untuk deployment terkelola tempat router tepercaya menangani ingress Slack.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    DM Slack secara default menggunakan mode pemasangan.
  </Card>
  <Card title="Perintah slash" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah saluran" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas saluran dan panduan perbaikan.
  </Card>
</CardGroup>

## Memilih transportasi

Socket Mode dan HTTP Request URLs memiliki kesetaraan fitur untuk perpesanan, perintah slash, App Home, dan interaktivitas. Pilih berdasarkan bentuk deployment, bukan fitur.

| Pertimbangan                 | Socket Mode (default)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL Gateway publik           | Tidak diperlukan                                                                                                                                     | Diperlukan (DNS, TLS, proxy balik, atau tunnel)                                                                |
| Jaringan keluar              | WSS keluar ke `wss-primary.slack.com` harus dapat dijangkau                                                                                               | Tidak ada WS keluar; hanya HTTPS masuk                                                                         |
| Token yang diperlukan        | Identitas bot: token bot + App-Level Token dengan `connections:write`; identitas pengguna: token pengguna + App-Level Token                           | Identitas bot: token bot + Signing Secret; identitas pengguna: token pengguna + Signing Secret                 |
| Laptop pengembangan / di balik firewall | Berfungsi tanpa perubahan                                                                                                                 | Memerlukan tunnel publik (ngrok, Cloudflare Tunnel, Tailscale Funnel) atau Gateway staging                     |
| Penskalaan horizontal        | Satu sesi Socket Mode per aplikasi per host; beberapa Gateway memerlukan aplikasi Slack terpisah                                                     | Handler POST tanpa status; beberapa replika Gateway dapat berbagi satu aplikasi di belakang penyeimbang beban  |
| Multiakun pada satu Gateway  | Didukung; setiap akun membuka WS-nya sendiri                                                                                                         | Didukung; setiap akun memerlukan `webhookPath` unik (default `/slack/events`) agar pendaftaran tidak bertabrakan |
| Transportasi perintah slash  | Dikirim melalui koneksi WS; `slash_commands[].url` diabaikan                                                                                             | Slack mengirim POST ke `slash_commands[].url`; bidang ini diperlukan agar perintah dapat didispatch                |
| Penandatanganan permintaan   | Tidak digunakan (autentikasi menggunakan App-Level Token)                                                                                            | Slack menandatangani setiap permintaan; OpenClaw memverifikasinya dengan `signingSecret`                    |
| Pemulihan saat koneksi terputus | Penyambungan ulang otomatis Slack SDK diaktifkan; OpenClaw juga memulai ulang sesi Socket Mode yang gagal dengan backoff terbatas. Penyesuaian transportasi batas waktu pong berlaku. | Tidak ada koneksi persisten yang dapat terputus; percobaan ulang dilakukan per permintaan oleh Slack           |

<Note>
  **Pilih Socket Mode** untuk host dengan satu Gateway, laptop pengembangan, dan jaringan lokal yang dapat menjangkau `*.slack.com` melalui koneksi keluar tetapi tidak dapat menerima HTTPS masuk.

**Pilih HTTP Request URLs** saat menjalankan beberapa replika Gateway di belakang penyeimbang beban, ketika WSS keluar diblokir tetapi HTTPS masuk diizinkan, atau ketika webhook Slack sudah diterminasi pada proxy balik.
</Note>

<Warning>
  Slack dapat mempertahankan beberapa koneksi Socket Mode untuk satu aplikasi dan dapat mengirimkan setiap payload ke koneksi mana pun. Oleh karena itu, Gateway OpenClaw terpisah yang berbagi aplikasi Slack memerlukan konfigurasi perutean dan otorisasi yang setara. Jika tidak, gunakan aplikasi Slack terpisah untuk setiap Gateway, satu ingress relay, atau HTTP Request URLs di belakang penyeimbang beban. Lihat [Menggunakan Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Mode relay

Mode relay memisahkan ingress Slack dari Gateway OpenClaw. Router tepercaya menangani satu-satunya koneksi Slack Socket Mode, memilih Gateway tujuan, dan meneruskan peristiwa bertipe melalui websocket terautentikasi. Gateway tetap menggunakan token bot-nya sendiri untuk panggilan Slack Web API keluar.

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

URL relay harus menggunakan `wss://` kecuali jika menargetkan localhost. Perlakukan token bearer dan tabel rute router sebagai bagian dari batas otorisasi Slack: peristiwa yang dirutekan memasuki handler pesan Slack normal sebagai aktivasi yang diotorisasi. `slack_identity` yang disediakan router dalam frame websocket `hello` dapat menetapkan nama pengguna dan ikon keluar default; identitas eksplisit yang diberikan oleh pemanggil tetap diutamakan. Koneksi relay tersambung kembali dengan pengaturan waktu backoff terbatas yang sama seperti Socket Mode dan menghapus identitas yang disediakan router setiap kali koneksi terputus.

### Instalasi seluruh organisasi Enterprise Grid

Satu akun Slack dapat menerima pesan dari setiap ruang kerja yang tercakup dalam
instalasi seluruh organisasi Enterprise Grid. Pilih Socket Mode langsung atau HTTP
Request URLs; mode relay tidak didukung untuk akun enterprise. Kedua
manifes dengan hak akses minimum di bawah ini hanya mengaktifkan jalur peristiwa V1 `message` dan `app_mention`,
balasan langsung, dan reaksi status yang dimiliki listener.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Konektor Slack untuk OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Minta Enterprise Grid Org Admin atau Org Owner menyetujui aplikasi, menginstalnya pada
tingkat organisasi, dan memilih ruang kerja yang dicakup oleh instalasi.
Pastikan aplikasi tersedia di setiap ruang kerja yang dituju sebelum memulai
OpenClaw. Buat token tingkat aplikasi dengan `connections:write` untuk Socket Mode,
lalu salin token bot dari instalasi organisasi. Konfigurasikan akun yang
menggunakan token bot yang diinstal organisasi:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URLs

Gunakan mode HTTP ketika Gateway memiliki endpoint HTTPS publik dan tidak membuka
koneksi Socket Mode. Ganti URL contoh dengan URL publik Gateway
`webhookPath` (default `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Konektor Slack untuk OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Minta Enterprise Grid Org Admin atau Org Owner menyetujui aplikasi, menginstalnya pada
tingkat organisasi, dan memilih ruang kerja yang dicakup oleh instalasi.
Setelah Slack memverifikasi Request URL, salin token bot instalasi organisasi dan
**Basic Information -> App Credentials -> Signing Secret** milik aplikasi. Konfigurasikan
akun enterprise dengan jalur Request URL yang sama:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

Saat dimulai, OpenClaw memverifikasi `enterpriseOrgInstall` dengan `auth.test` Slack.
Token yang diinstal organisasi tanpa flag tersebut, atau token ruang kerja dengan flag tersebut,
menyebabkan proses startup gagal. Slack tetap menjadi sumber kebenaran untuk ruang kerja mana yang telah
memberikan izin instalasi; OpenClaw kemudian menerapkan kebijakan saluran, pengguna,
DM, dan sebutan yang dikonfigurasi pada setiap peristiwa yang dikirimkan. Enterprise V1 menolak semua
peristiwa `message` dan `app_mention` yang dibuat bot sebelum dispatch, terlepas dari
`allowBots`, karena instalasi organisasi tidak menyediakan identitas bot yang stabil dan
memenuhi syarat ruang kerja untuk mencegah loop.

Dukungan enterprise sengaja dibatasi pada Socket Mode langsung atau peristiwa HTTP
`message` dan `app_mention` beserta balasan langsungnya. Mode relay,
perintah slash, interaksi, App Home, listener peristiwa reaksi, pin, alat tindakan Slack,
persetujuan native Slack, binding, pengiriman antrean atau terjadwal,
dan pengiriman proaktif tidak tersedia untuk akun enterprise. Reaksi
konfirmasi, pengetikan, dan status keluar didukung melalui klien Slack
yang dimiliki listener dan memerlukan `reactions:write`; notifikasi reaksi
masuk dan alat tindakan reaksi tetap tidak tersedia.

Balasan langsung menggunakan kembali perilaku pengiriman Slack standar untuk potongan,
media, metadata, fallback identitas, unfurl, dan tanda terima, tetapi hanya selama
klien tervalidasi milik listener tetap berada dalam giliran peristiwa aktif. Antrean
pengiriman dalam memori dan catatan partisipasi utas dipartisi berdasarkan workspace
peristiwa tersebut; klien itu sendiri tidak pernah diserialisasi atau dipersistenkan.

Kunci kebijakan channel dan entri `dm.groupChannels` harus menggunakan ID channel Slack stabil mentah atau
bentuk `channel:<id>`. OpenClaw menormalkan kedua bentuk tersebut menjadi ID channel mentah untuk
pencocokan runtime; prefiks `slack:`, `group:`, dan `mpim:` menyebabkan startup gagal.
Entri kebijakan pengguna harus menggunakan ID pengguna Slack yang stabil; nama, slug, nama tampilan,
dan alamat email menyebabkan startup gagal. ID harus menggunakan prefiks dan isi huruf besar kanonis
Slack (misalnya, `C0123456789` atau `U0123456789`); bentuk huruf kecil dan
bentuk pendek yang menyerupainya menyebabkan startup gagal. Akun Enterprise tidak dapat mengaktifkan
`dangerouslyAllowNameMatching`. Akun Enterprise dapat menetapkan
`mentionPatterns.mode` global, tetapi `mentionPatterns.allowIn` dan
`mentionPatterns.denyIn` menyebabkan startup gagal karena ID channel Slack tanpa kualifikasi tidak
memiliki kualifikasi workspace dan dapat digunakan kembali di beberapa workspace. Instalasi workspace
mempertahankan perilaku pola penyebutan tercakup yang sudah ada. Setiap workspace yang diterima
mendapat identitas perutean, sesi, transkrip, deduplikasi, riwayat, dan cache terpisah
meskipun ID Slack tumpang tindih. Dalam aliran `message`, pesan pengguna biasa
dan peristiwa `file_share` yang dibuat pengguna didukung; subtipe pesan lainnya
ditolak sebelum otorisasi atau penanganan peristiwa sistem.

DM Enterprise harus dinonaktifkan (`dm.enabled=false` atau
`dmPolicy="disabled"`) atau dibuka secara eksplisit dengan `dmPolicy="open"` dan
`allowFrom` akun efektif yang memuat literal `"*"`. Daftar izin kosong
atau ID khusus pengguna tanpa `"*"` menyebabkan startup gagal. Penyandingan dan
daftar izin DM per pengguna ditolak karena ID pengguna Slack tidak
memiliki kualifikasi workspace dalam penyimpanan otorisasi tersebut. Kebijakan channel dan pengirim
tetap berlaku pada pesan channel.

## Instalasi

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` mendaftarkan dan mengaktifkan plugin. Plugin ini tidak melakukan apa pun hingga Anda mengonfigurasi aplikasi Slack dan pengaturan channel di bawah. Lihat [Plugin](/id/tools/plugin) untuk aturan umum instalasi plugin.

## Penyiapan cepat

Manifes di bagian ini membuat instalasi yang tercakup pada workspace. Untuk
instalasi organisasi Enterprise Grid, gunakan
[manifes dan alur kerja seluruh organisasi](#enterprise-grid-org-wide-installs) khusus sebagai gantinya.

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Buat aplikasi Slack baru">
        Buka [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → pilih workspace Anda → tempel salah satu manifes di bawah → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Konektor Slack untuk OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw menghubungkan utas asisten Slack ke agen OpenClaw.",
      "suggested_prompts": [
        { "title": "Apa yang dapat Anda lakukan?", "message": "Apa yang dapat Anda bantu?" },
        {
          "title": "Ringkas channel ini",
          "message": "Ringkas aktivitas terbaru di channel ini."
        },
        { "title": "Buat draf balasan", "message": "Bantu saya membuat draf balasan." }
      ]
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
    "description": "Konektor Slack untuk OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw menghubungkan utas asisten Slack ke agen OpenClaw.",
      "suggested_prompts": [
        { "title": "Apa yang dapat Anda lakukan?", "message": "Apa yang dapat Anda bantu?" },
        {
          "title": "Ringkas channel ini",
          "message": "Ringkas aktivitas terbaru di channel ini."
        },
        { "title": "Buat draf balasan", "message": "Bantu saya membuat draf balasan." }
      ]
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
          **Direkomendasikan** cocok dengan rangkaian fitur lengkap plugin Slack: App Home, perintah garis miring, file, reaksi, pin, DM grup, serta pembacaan emoji/grup pengguna. Pilih **Minimal** ketika kebijakan workspace membatasi cakupan — opsi ini mencakup DM, riwayat channel/grup, penyebutan, dan perintah garis miring, tetapi tidak menyertakan file, reaksi, pin, DM grup (`mpim:*`), `emoji:read`, dan `usergroups:read`. Lihat [Daftar periksa manifes dan cakupan](#manifest-and-scope-checklist) untuk alasan setiap cakupan dan opsi tambahan seperti perintah garis miring tambahan.
        </Note>

        Setelah Slack membuat aplikasi:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: tambahkan `connections:write`, simpan, lalu salin App-Level Token.
        - **Install App -> Install to Workspace**: salin Bot User OAuth Token.

      </Step>

      <Step title="Konfigurasikan OpenClaw">

        Penyiapan SecretRef yang direkomendasikan:

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

      <Step title="Mulai Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Buat aplikasi Slack baru">
        Buka [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → pilih workspace Anda → tempel salah satu manifes di bawah → ganti `https://gateway-host.example.com/slack/events` dengan URL Gateway publik Anda → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Konektor Slack untuk OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw menghubungkan utas asisten Slack ke agen OpenClaw.",
      "suggested_prompts": [
        { "title": "Apa yang dapat Anda lakukan?", "message": "Apa yang dapat Anda bantu?" },
        {
          "title": "Ringkas channel ini",
          "message": "Ringkas aktivitas terbaru di channel ini."
        },
        { "title": "Buat draf balasan", "message": "Bantu saya membuat draf balasan." }
      ]
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
    "description": "Konektor Slack untuk OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw menghubungkan utas asisten Slack ke agen OpenClaw.",
      "suggested_prompts": [
        { "title": "Apa yang dapat Anda lakukan?", "message": "Apa yang dapat Anda bantu?" },
        {
          "title": "Ringkas kanal ini",
          "message": "Ringkas aktivitas terbaru di kanal ini."
        },
        { "title": "Buat draf balasan", "message": "Bantu saya membuat draf balasan." }
      ]
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
          **Direkomendasikan** cocok dengan rangkaian fitur lengkap plugin Slack; **Minimal** menghilangkan file, reaksi, sematan, DM grup (`mpim:*`), `emoji:read`, dan `usergroups:read` untuk ruang kerja yang dibatasi. Lihat [Daftar periksa manifes dan cakupan](#manifest-and-scope-checklist) untuk alasan tiap cakupan.
        </Note>

        <Info>
          Ketiga bidang URL (`slash_commands[].url`, `event_subscriptions.request_url`, dan `interactivity.request_url` / `message_menu_options_url`) semuanya mengarah ke endpoint OpenClaw yang sama. Skema manifes Slack mengharuskannya diberi nama secara terpisah, tetapi OpenClaw merutekan berdasarkan jenis payload sehingga satu `webhookPath` (bawaan `/slack/events`) sudah cukup. Perintah garis miring tanpa `slash_commands[].url` diam-diam tidak melakukan apa pun dalam mode HTTP.
        </Info>

        Setelah Slack membuat aplikasi:

        - **Basic Information → App Credentials**: salin **Signing Secret** untuk verifikasi permintaan.
        - **Install App -> Install to Workspace**: salin Bot User OAuth Token.

      </Step>

      <Step title="Konfigurasikan OpenClaw">

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
        Gunakan jalur webhook unik untuk HTTP multiakun

        Berikan setiap akun `webhookPath` yang berbeda (bawaan `/slack/events`) agar pendaftaran tidak bertabrakan.
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

## Identitas pengguna (kirim sebagai orang sungguhan)

Identitas pengguna memungkinkan OpenClaw membaca dan mengirim sebagai manusia yang mengotorisasi aplikasi Slack. `userToken` adalah identitas yang bertindak; aplikasi Slack pendamping membawa lalu lintas Events API melalui Socket Mode atau HTTP Request URL. Aplikasi pendamping tidak memerlukan pengguna bot atau token bot.

Siapkan aplikasi pendamping sebagai berikut:

1. Di bawah **OAuth & Permissions -> User Token Scopes**, tambahkan izin dengan cakupan pengguna berikut:

   - riwayat: `channels:history`, `groups:history`, `im:history`, `mpim:history`
   - pencarian percakapan: `channels:read`, `groups:read`, `im:read`, `mpim:read`
   - orang: `users:read`
   - pengiriman: `chat:write` (pesan dikirim sebagai pengguna yang mengotorisasi)
   - membuka DM: `im:write`, `mpim:write`

2. Di bawah **Event Subscriptions -> Subscribe to events on behalf of users**, tambahkan peristiwa pengguna berikut. Jangan hanya menambahkannya ke daftar peristiwa bot:

   - `message.channels`
   - `message.groups`
   - `message.im`
   - `message.mpim`

3. Pilih satu transport peristiwa:

   - **Socket Mode:** aktifkan Socket Mode dan buat token tingkat aplikasi dengan `connections:write`. Konfigurasikan sebagai `appToken`.
   - **HTTP Request URL:** arahkan Event Subscriptions ke endpoint Slack OpenClaw publik dan salin **Basic Information -> App Credentials -> Signing Secret**. Konfigurasikan sebagai `signingSecret`.

4. Instal atau instal ulang aplikasi, otorisasi sebagai manusia yang dimaksud, lalu salin token OAuth pengguna yang dihasilkan ke `userToken`.

Konfigurasi Socket Mode:

```json5
{
  channels: {
    slack: {
      identity: "user",
      userToken: "<xoxp>",
      appToken: "<xapp>",
    },
  },
}
```

Konfigurasi HTTP Request URL:

```json5
{
  channels: {
    slack: {
      identity: "user",
      mode: "http",
      userToken: "<xoxp>",
      signingSecret: "<signing-secret>",
      webhookPath: "/slack/events",
    },
  },
}
```

<Warning>
  DM dan DM grup hanya berfungsi melalui langganan peristiwa dengan cakupan pengguna di atas. Bot tidak dapat bergabung ke DM 1:1 manusia atau dimasukkan ke DM grup yang sudah ada. Aplikasi pendamping adalah infrastruktur tak terlihat: anggota Slack lain melihat pesan dari manusia yang mengotorisasi, bukan dari bot OpenClaw.
</Warning>

OpenClaw secara otomatis membuang peristiwa pesan dengan cakupan pengguna yang ditulis oleh identitas manusia yang telah ditentukan, sehingga pesan yang dikirimnya tidak memicu balasan kepada diri sendiri.

## Penyesuaian transport Socket Mode

OpenClaw menetapkan batas waktu pong klien Slack SDK menjadi 15 detik secara bawaan untuk Socket Mode. Timpa pengaturan transport hanya jika Anda memerlukan penyesuaian khusus ruang kerja atau host:

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

Gunakan ini hanya untuk ruang kerja Socket Mode yang mencatat batas waktu pong websocket/ping server Slack atau berjalan pada host yang diketahui mengalami kelaparan loop peristiwa. `clientPingTimeout` adalah waktu tunggu pong setelah SDK mengirim ping klien; `serverPingTimeout` adalah waktu tunggu untuk ping server Slack. Pesan dan peristiwa aplikasi tetap merupakan status aplikasi, bukan sinyal keaktifan transport.

Catatan:

- `socketMode` diabaikan dalam mode HTTP Request URL.
- Pengaturan dasar `channels.slack.socketMode` berlaku untuk semua akun Slack kecuali ditimpa. Penimpaan per akun menggunakan `channels.slack.accounts.<accountId>.socketMode`; karena ini adalah penimpaan objek, sertakan setiap bidang penyesuaian soket yang Anda inginkan untuk akun tersebut.
- Hanya `clientPingTimeout` yang memiliki bawaan OpenClaw (`15000`). `serverPingTimeout` dan `pingPongLoggingEnabled` diteruskan ke Slack SDK hanya jika dikonfigurasi.
- Backoff mulai ulang Socket Mode dimulai sekitar 2 detik dan dibatasi sekitar 30 detik. Kegagalan pemulaian, penantian pemulaian, dan pemutusan yang dapat dipulihkan dicoba ulang hingga kanal berhenti. Kesalahan akun dan kredensial permanen seperti autentikasi tidak valid, token dicabut, atau cakupan tidak tersedia akan gagal dengan cepat, alih-alih terus mencoba ulang tanpa batas.

## Daftar periksa manifes dan cakupan

Manifes dasar aplikasi Slack sama untuk Socket Mode dan HTTP Request URL. Hanya blok `settings` (dan `url` perintah garis miring) yang berbeda.

Manifes dasar (bawaan Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Konektor Slack untuk OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw menghubungkan utas asisten Slack ke agen OpenClaw.",
      "suggested_prompts": [
        { "title": "Apa yang dapat Anda lakukan?", "message": "Apa yang dapat Anda bantu?" },
        {
          "title": "Ringkas kanal ini",
          "message": "Ringkas aktivitas terbaru di kanal ini."
        },
        { "title": "Buat draf balasan", "message": "Bantu saya membuat draf balasan." }
      ]
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

Untuk **mode HTTP Request URL**, ganti `settings` dengan varian HTTP dan tambahkan `url` ke setiap perintah garis miring. URL publik diperlukan:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Kirim pesan ke OpenClaw",
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

Tampilkan berbagai fitur yang memperluas bawaan di atas.

Manifes default mengaktifkan tab **Home** pada Slack App Home dan berlangganan ke `app_home_opened`. Saat anggota ruang kerja membuka tab Home, OpenClaw menerbitkan tampilan Home default yang aman dengan `views.publish`; tidak ada payload percakapan atau konfigurasi privat yang disertakan. Saat mode satu perintah garis miring diaktifkan, petunjuk perintah menggunakan `channels.slack.slashCommand.name`; instalasi yang menggunakan perintah native atau tanpa perintah garis miring tidak menyertakan petunjuk tersebut. Tab **Messages** tetap diaktifkan untuk DM Slack. Manifes tersebut juga mengaktifkan utas asisten Slack dengan `features.assistant_view`, `assistant:write`, `assistant_thread_started`, dan `assistant_thread_context_changed`; utas asisten diarahkan ke sesi utas OpenClaw tersendiri dan mempertahankan konteks utas yang disediakan Slack agar tersedia bagi agen.

<AccordionGroup>
  <Accordion title="Perintah garis miring native opsional">

    Beberapa [perintah garis miring native](#commands-and-slash-behavior) dapat digunakan sebagai pengganti satu perintah yang dikonfigurasi, dengan beberapa catatan:

    - Gunakan `/agentstatus`, bukan `/status`, karena perintah `/status` dicadangkan.
    - Tidak lebih dari 25 perintah garis miring dapat didaftarkan pada satu aplikasi Slack sekaligus (batas platform Slack).

    OpenClaw mendaftarkan handler untuk perintah native yang diaktifkan, tetapi entri manifes Slack tetap dikelola oleh administrator dan tidak disinkronkan saat runtime. Tambahkan `/login` ke manifes secara manual; contoh di bawah menyertakannya sebagai pengganti alias opsional `/side` agar jumlahnya tetap 25 perintah. `/login` dapat ditampilkan di mana saja, tetapi hanya menerbitkan kode pemasangan di percakapan privat atau UI Web.

    Ganti bagian `features.slash_commands` yang ada dengan subset dari [perintah yang tersedia](/id/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Mulai sesi baru",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Atur ulang sesi saat ini"
    },
    {
      "command": "/compact",
      "description": "Padatkan konteks sesi",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Hentikan proses saat ini"
    },
    {
      "command": "/session",
      "description": "Kelola masa berlaku pengikatan utas",
      "usage_hint": "tidak aktif <duration|off> atau usia maksimum <duration|off>"
    },
    {
      "command": "/think",
      "description": "Tetapkan tingkat pemikiran",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Aktifkan atau nonaktifkan output mendetail",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Tampilkan atau tetapkan mode cepat",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Aktifkan atau nonaktifkan visibilitas penalaran",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Aktifkan atau nonaktifkan mode dengan hak akses tinggi",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Tampilkan atau tetapkan default eksekusi",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Setujui atau tolak permintaan persetujuan yang tertunda",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Tampilkan atau tetapkan model",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Cantumkan penyedia/model",
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
      "description": "Tampilkan apa yang dapat digunakan agen saat ini",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Tampilkan status runtime, termasuk penggunaan/kuota penyedia jika tersedia"
    },
    {
      "command": "/tasks",
      "description": "Cantumkan tugas latar belakang aktif/terbaru untuk sesi saat ini"
    },
    {
      "command": "/context",
      "description": "Jelaskan cara konteks disusun",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Tampilkan identitas pengirim Anda"
    },
    {
      "command": "/skill",
      "description": "Jalankan skill berdasarkan nama",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Ajukan pertanyaan sampingan tanpa mengubah konteks sesi",
      "usage_hint": "<question>"
    },
    {
      "command": "/login",
      "description": "Pasangkan login Codex",
      "usage_hint": "[codex|openai]"
    },
    {
      "command": "/usage",
      "description": "Kendalikan catatan kaki penggunaan atau tampilkan ringkasan biaya",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="URL Permintaan HTTP">
        Gunakan daftar `slash_commands` yang sama seperti Socket Mode di atas, lalu tambahkan `"url": "https://gateway-host.example.com/slack/events"` ke setiap entri. Contoh:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Mulai sesi baru",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Tampilkan ringkasan bantuan singkat",
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
    Tambahkan cakupan bot `chat:write.customize` jika Anda ingin pesan keluar menggunakan identitas agen aktif (nama pengguna dan ikon khusus), bukan identitas aplikasi Slack default.

    Jika menggunakan ikon emoji, Slack mengharapkan sintaks `:emoji_name:`.

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

- Identitas bot (default) memerlukan `botToken` + `appToken` untuk Socket Mode, atau `botToken` + `signingSecret` untuk mode HTTP.
- Identitas pengguna memerlukan `userToken` + `appToken` untuk Socket Mode, atau `userToken` + `signingSecret` untuk mode HTTP. Identitas ini tidak menggunakan token bot.
- Mode relay memerlukan `botToken` beserta `relay.url`, `relay.authToken`, dan `relay.gatewayId`; mode ini tidak menggunakan token aplikasi atau rahasia penandatanganan.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken`, dan `userToken` menerima string teks biasa
  atau objek SecretRef.
- Token konfigurasi menggantikan fallback env.
- Fallback env `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, dan `SLACK_USER_TOKEN` masing-masing hanya berlaku untuk akun default.
- `userToken` secara default berperilaku hanya-baca (`userTokenReadOnly: true`).

Perilaku snapshot status:

- Pemeriksaan akun Slack melacak kolom `*Source` dan `*Status` per kredensial
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Statusnya adalah `available`, `configured_unavailable`, atau `missing`.
- `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef
  atau sumber rahasia non-inline lainnya, tetapi jalur perintah/runtime saat ini
  tidak dapat menyelesaikan nilai sebenarnya.
- Dalam mode HTTP, `signingSecretStatus` disertakan. Socket Mode menggunakan
  `botTokenStatus` + `appTokenStatus` untuk identitas bot dan
  `userTokenStatus` + `appTokenStatus` untuk identitas pengguna.

<Tip>
Untuk identitas bot, tindakan dan pembacaan direktori dapat mengutamakan token pengguna opsional; operasi tulis tetap menggunakan token bot kecuali `userTokenReadOnly: false` mengizinkan fallback. Untuk `identity: "user"`, operasi baca dan tulis selalu menggunakan `userToken`.
</Tip>

## Tindakan dan gerbang

Tindakan Slack dikendalikan oleh `channels.slack.actions.*`.

Grup tindakan yang tersedia dalam peralatan Slack saat ini:

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

    Prioritas multiakun:

    - `channels.slack.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Akun bernama mewarisi `channels.slack.allowFrom` saat `allowFrom` miliknya tidak ditetapkan.
    - Akun bernama tidak mewarisi `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` dan `channels.slack.dm.allowFrom` lama masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` jika dapat dilakukan tanpa mengubah akses.

    Pemasangan di DM menggunakan `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kebijakan kanal">
    `channels.slack.groupPolicy` mengontrol penanganan kanal:

    - `open`
    - `allowlist`
    - `disabled`

    Daftar izin kanal berada di bawah `channels.slack.channels` dan **harus menggunakan ID kanal Slack yang stabil** (misalnya `C12345678`) sebagai kunci konfigurasi.

    Catatan runtime: jika `channels.slack` sama sekali tidak ada (penyiapan hanya dengan env), runtime melakukan fallback ke `groupPolicy="allowlist"` dan mencatat peringatan (meskipun `channels.defaults.groupPolicy` ditetapkan).

    Resolusi nama/ID:

    - entri daftar izin kanal dan entri daftar izin DM diselesaikan saat startup jika akses token mengizinkan
    - entri nama kanal yang tidak terselesaikan dipertahankan sesuai konfigurasi, tetapi secara default diabaikan untuk perutean
    - otorisasi masuk dan perutean kanal secara default mengutamakan ID; pencocokan nama pengguna/slug secara langsung memerlukan `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Kunci berbasis nama (`#channel-name` atau `channel-name`) **tidak** cocok saat menggunakan `groupPolicy: "allowlist"`. Pencarian kanal secara default mengutamakan ID, sehingga kunci berbasis nama tidak akan pernah berhasil dirutekan dan semua pesan di kanal tersebut akan diblokir tanpa pemberitahuan. Hal ini berbeda dari `groupPolicy: "open"`, yang tidak mengharuskan kunci kanal untuk perutean sehingga kunci berbasis nama tampak berfungsi.

    Selalu gunakan ID saluran Slack sebagai kunci. Untuk menemukannya: klik kanan saluran di Slack → **Copy link** — ID (`C...`) muncul di akhir URL.

    Benar:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
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
            "#eng-my-channel": { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Sebutan dan pengguna saluran">
    Pesan saluran secara default dibatasi oleh sebutan.

    Sumber sebutan:

    - sebutan aplikasi eksplisit (`<@botId>`)
    - sebutan grup pengguna Slack (`<!subteam^S...>`) ketika pengguna bot adalah anggota grup pengguna tersebut; memerlukan `usergroups:read`
    - pola regex sebutan (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - balasan terhadap pesan Slack milik bot sendiri (`implicitMentions.replyToBot`)
    - tindak lanjut dalam utas yang pernah diikuti bot (`implicitMentions.threadParticipation`)

    Kontrol per saluran (`channels.slack.channels.<id>`; nama hanya melalui resolusi saat startup atau `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; menggantikan mode balasan tingkat akun/jenis obrolan untuk saluran ini)
    - `users` (daftar yang diizinkan)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format kunci `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, atau wildcard `"*"`
      (kunci lama tanpa prefiks tetap hanya dipetakan ke `id:`)

    `ignoreOtherMentions` (default `false`) mengabaikan pesan saluran yang menyebut pengguna atau grup pengguna lain, tetapi tidak menyebut bot ini. DM dan DM grup (MPIM) tidak terpengaruh. Filter memerlukan ID pengguna bot yang berhasil diresolusi dari `auth.test`; jika identitas tersebut tidak tersedia (misalnya identitas yang hanya menggunakan token pengguna), pembatas akan terbuka saat gagal dan pesan diteruskan tanpa perubahan.

    `allowBots` bersifat konservatif untuk saluran dan saluran privat: pesan ruang yang dibuat bot hanya diterima ketika bot pengirim tercantum secara eksplisit dalam daftar yang diizinkan `users` milik ruang tersebut, atau ketika setidaknya satu ID pemilik Slack eksplisit dari `channels.slack.allowFrom` saat ini merupakan anggota ruang. Wildcard dan entri pemilik berupa nama tampilan tidak memenuhi keberadaan pemilik. Keberadaan pemilik menggunakan `conversations.members` Slack; pastikan aplikasi memiliki cakupan baca yang sesuai untuk jenis ruang tersebut (`channels:read` untuk saluran publik, `groups:read` untuk saluran privat). Jika pencarian anggota gagal, OpenClaw mengabaikan pesan ruang yang dibuat bot.

    Pesan Slack buatan bot yang diterima menggunakan [perlindungan loop bot](/id/channels/bot-loop-protection) bersama. Konfigurasikan `channels.defaults.botLoopProtection` untuk anggaran default, lalu ganti dengan `channels.slack.botLoopProtection` atau `channels.slack.channels.<id>.botLoopProtection` ketika ruang kerja atau saluran memerlukan batas berbeda.

  </Tab>
</Tabs>

## Utas, sesi, dan tag balasan

- DM dirutekan sebagai `direct`; saluran sebagai `channel`; MPIM sebagai `group`.
- Pengikatan rute Slack menerima ID peer mentah serta bentuk target Slack seperti `channel:C12345678`, `user:U12345678`, dan `<@U12345678>`.
- Dengan `session.dmScope=main` default, DM Slack digabungkan ke sesi utama agen.
- Sesi saluran: `agent:<agentId>:slack:channel:<channelId>`.
- Pesan saluran tingkat teratas biasa tetap berada dalam sesi per saluran, bahkan ketika `replyToMode` bukan `off`.
- Balasan utas Slack menggunakan `thread_ts` Slack induk untuk sufiks sesi (`:thread:<threadTs>`), bahkan ketika pengutasan balasan keluar dinonaktifkan dengan `replyToMode="off"`.
- OpenClaw memasukkan akar saluran tingkat teratas yang memenuhi syarat ke `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` ketika akar tersebut diperkirakan akan memulai utas Slack yang terlihat, sehingga akar dan balasan utas berikutnya berbagi satu sesi OpenClaw. Ini berlaku untuk peristiwa `app_mention`, kecocokan sebutan bot eksplisit atau pola sebutan yang dikonfigurasi, serta saluran `requireMention: false` dengan `replyToMode` non-`off`.
- Default `channels.slack.thread.historyScope` adalah `thread`; default `thread.inheritParent` adalah `false`.
- `channels.slack.thread.initialHistoryLimit` mengontrol jumlah pesan utas yang sudah ada yang diambil ketika sesi utas baru dimulai (default `20`; atur ke `0` untuk menonaktifkan).
- `channels.slack.implicitMentions.replyToBot` mengontrol apakah balasan terhadap pesan bot sendiri melewati pembatasan sebutan (default `true`).
- `channels.slack.implicitMentions.threadParticipation` mengontrol apakah tindak lanjut dalam utas tempat bot telah membalas melewati pembatasan sebutan (default `true`). Atur ke `false` untuk mewajibkan sebutan eksplisit baru dalam tindak lanjut tersebut. `openclaw doctor --fix` memigrasikan kunci lama `channels.slack.thread.requireExplicitMention` ke flag kanonis positif ini.
- Penggantian tingkat akun berada di `channels.slack.accounts.<id>.implicitMentions`; default bersama berada di `channels.defaults.implicitMentions`.

Kontrol pengutasan balasan:

- `channels.slack.channels.<id>.replyToMode`: penggantian per saluran untuk pesan saluran/saluran privat Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (default `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback lama untuk obrolan langsung: `channels.slack.dm.replyToMode`

Tag balasan manual didukung:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Untuk balasan utas Slack eksplisit dari alat `message`, atur `replyBroadcast: true` dengan `action: "send"` dan `threadId` atau `replyTo` agar Slack juga menyiarkan balasan utas ke saluran induk. Ini dipetakan ke flag `reply_broadcast` `chat.postMessage` milik Slack dan hanya didukung untuk pengiriman teks atau Block Kit, bukan unggahan media.

Ketika pemanggilan alat `message` berjalan di dalam utas Slack dan menargetkan saluran yang sama, OpenClaw biasanya mewarisi utas Slack saat ini sesuai dengan `replyToMode` efektif pada tingkat akun, jenis obrolan, atau per saluran. Balasan otomatis serta pemanggilan `send` atau `upload-file` pada saluran yang sama menggunakan penggantian per saluran yang sama. Atur `topLevel: true` pada `action: "send"` atau `action: "upload-file"` untuk memaksa pesan saluran induk baru. `threadId: null` diterima sebagai penolakan tingkat teratas yang sama.

<Note>
`replyToMode="off"` menonaktifkan pengutasan balasan Slack keluar, termasuk tag `[[reply_to_*]]` eksplisit. Ini tidak meratakan sesi utas Slack masuk: pesan yang sudah diposting di dalam utas Slack tetap dirutekan ke sesi `:thread:<threadTs>`. Ini berbeda dengan Telegram, yang tetap menghormati tag eksplisit dalam mode `"off"`. Utas Slack menyembunyikan pesan dari saluran, sedangkan balasan Telegram tetap terlihat sebaris.
</Note>

## Reaksi pengakuan

`ackReaction` mengirim emoji pengakuan saat OpenClaw memproses pesan masuk. `ackReactionScope` menentukan _kapan_ emoji tersebut benar-benar dikirim.

Secara default, pengakuan tetap statis sementara status utas asisten bawaan Slack menampilkan kemajuan dengan pesan pemuatan yang berganti-ganti. Atur `messages.statusReactions.enabled: true` untuk memilih siklus reaksi antre/berpikir/alat/selesai/kesalahan.

### Emoji (`ackReaction`)

Urutan resolusi:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen (`agents.list[].identity.emoji`, atau `"eyes"` / 👀)

Catatan:

- Slack mengharapkan kode pendek (misalnya `"eyes"`).
- Gunakan `""` untuk menonaktifkan reaksi bagi akun Slack atau secara global.

### Cakupan (`messages.ackReactionScope`)

Penyedia Slack membaca cakupan dari `messages.ackReactionScope` (default `"group-mentions"`). Saat ini tidak ada penggantian tingkat akun Slack atau saluran Slack; nilainya bersifat global untuk Gateway.

Nilai:

- `"all"`: bereaksi dalam DM dan grup, termasuk peristiwa ruang ambien.
- `"direct"`: hanya bereaksi dalam DM.
- `"group-all"`: bereaksi pada setiap pesan grup kecuali peristiwa ruang ambien (tanpa DM).
- `"group-mentions"` (default): bereaksi dalam grup, tetapi hanya ketika bot disebut (atau dalam hal yang dapat disebut dalam grup yang memilih ikut serta). **DM dikecualikan.**
- `"off"` / `"none"`: jangan pernah bereaksi.

<Note>
Cakupan default (`"group-mentions"`) tidak memicu reaksi pengakuan dalam pesan langsung atau peristiwa ruang ambien. Untuk melihat `ackReaction` yang dikonfigurasi (misalnya `"eyes"`) pada DM Slack masuk dan peristiwa ruang senyap, atur `messages.ackReactionScope` ke `"all"`. `messages.ackReactionScope` dibaca saat penyedia Slack dimulai, sehingga Gateway harus dimulai ulang agar perubahan berlaku.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // bereaksi dalam DM dan grup
  },
}
```

## Streaming teks

`channels.slack.streaming` mengontrol perilaku pratinjau langsung:

- `off`: menonaktifkan streaming pratinjau langsung.
- `partial` (default): mengganti teks pratinjau dengan keluaran parsial terbaru.
- `block`: menambahkan pembaruan pratinjau per potongan.
- `progress`: menampilkan teks status kemajuan selama pembuatan, lalu mengirim teks final.
- `streaming.preview.toolProgress`: ketika pratinjau draf aktif, merutekan pembaruan alat/kemajuan ke pesan pratinjau yang diedit yang sama (default: `true`). Atur `false` untuk mempertahankan pesan alat/kemajuan yang terpisah.
- `streaming.preview.commandText` / `streaming.progress.commandText`: atur ke `status` untuk mempertahankan baris kemajuan alat yang ringkas sambil menyembunyikan teks perintah/eksekusi mentah (default: `raw`).

Sembunyikan teks perintah/eksekusi mentah sambil mempertahankan baris kemajuan ringkas:

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

`channels.slack.streaming.nativeTransport` mengontrol streaming teks bawaan Slack ketika `channels.slack.streaming.mode` adalah `partial` (default: `true`).

Kartu tugas kemajuan bawaan Slack bersifat opsional untuk mode kemajuan. Atur `channels.slack.streaming.progress.nativeTaskCards` ke `true` dengan `channels.slack.streaming.mode="progress"` untuk mengirim kartu rencana/tugas bawaan Slack saat pekerjaan berlangsung, lalu memperbarui kartu tugas yang sama saat selesai. Tanpa flag ini, mode kemajuan mempertahankan perilaku pratinjau draf portabel.

- Utas balasan harus tersedia agar streaming teks bawaan dan status utas asisten Slack dapat muncul. Pemilihan utas tetap mengikuti `replyToMode`.
- Saluran, obrolan grup, dan akar DM tingkat teratas tetap dapat menggunakan pratinjau draf normal ketika streaming bawaan tidak tersedia atau tidak ada utas balasan.
- DM Slack tingkat teratas secara default tetap berada di luar utas, sehingga tidak menampilkan pratinjau streaming/status bawaan bergaya utas milik Slack; sebagai gantinya, OpenClaw memposting dan mengedit pratinjau draf di DM.
- Media dan payload nonteks menggunakan fallback ke pengiriman normal.
- Hasil akhir media/kesalahan membatalkan edit pratinjau yang tertunda; hasil akhir teks/blok yang memenuhi syarat hanya dikirim sepenuhnya ketika dapat mengedit pratinjau secara langsung.
- Jika streaming gagal di tengah balasan, OpenClaw menggunakan fallback ke pengiriman normal untuk payload yang tersisa.

Gunakan pratinjau draf sebagai pengganti streaming teks bawaan Slack:

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

Ikut serta menggunakan kartu tugas progres native Slack:

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

- `channels.slack.streamMode` (`replace | status_final | append`) adalah alias lama untuk `channels.slack.streaming.mode`.
- `channels.slack.streaming` boolean adalah alias lama untuk `channels.slack.streaming.mode` dan `channels.slack.streaming.nativeTransport`.
- `channels.slack.chunkMode` dan `channels.slack.nativeStreaming` tingkat teratas adalah alias lama untuk `channels.slack.streaming.chunkMode` dan `channels.slack.streaming.nativeTransport`.
- Alias lama tidak dibaca saat runtime; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi streaming Slack yang dipersistenkan ke kunci kanonis.

## Reaksi cadangan saat mengetik

`typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat OpenClaw memproses balasan, lalu menghapusnya ketika proses selesai. Ini paling berguna di luar balasan utas, yang menggunakan indikator status default "sedang mengetik...".

Urutan resolusi:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Catatan:

- Slack mengharapkan kode pendek (misalnya `"hourglass_flowing_sand"`).
- Reaksi bersifat upaya terbaik dan pembersihan diupayakan secara otomatis setelah jalur balasan atau kegagalan selesai.

## Masukan suara

Untuk berbicara dengan OpenClaw di Slack saat ini, kirim klip audio Slack ke aplikasi OpenClaw. Mikrofon dikte Slackbot adalah fitur terpisah milik Slack, bukan API aplikasi.

- **[Dikte suara Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** berada di dalam percakapan Slackbot pribadi pengguna. Slack mengubah rekaman menjadi prompt Slackbot, tetapi tidak mengirimkan berkas audio, peristiwa dikte, prompt, atau penanda sumber masukan kepada aplikasi Slack pihak ketiga melalui Events API. Plugin Slack OpenClaw tidak dapat mengaktifkan atau menerimanya.
- **[Klip audio Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** disimpan sebagai berkas Slack yang dapat diposting di DM, kanal, atau utas OpenClaw. OpenClaw mengunduh klip yang dapat diakses dengan token bot, menormalkan metadata MIME klip Slack, dan mengirimkannya melalui [pipeline transkripsi audio](/id/nodes/audio) bersama. Manifes aplikasi yang direkomendasikan mencakup cakupan `files:read` yang diperlukan.

Klip audio dan dikte Slackbot memiliki semantik privasi yang berbeda: klip mengikuti kebijakan retensi berkas Slack dan OpenClaw mengunduhnya untuk transkripsi, sedangkan Slack menyatakan bahwa audio dikte tidak disimpan.

Di kanal dengan `requireMention: true`, klip audio tanpa keterangan dapat memenuhi gerbang dengan mengucapkan pola penyebutan yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, dengan fallback ke `messages.groupChat.mentionPatterns`). OpenClaw mengotorisasi pengirim sebelum mengunduh atau mentranskripsikan klip, lalu menerimanya hanya jika transkrip cocok. Transkrip spekulatif yang gagal atau tidak cocok dibuang bersama klip yang diunduh; transkrip tersebut tidak disimpan dalam riwayat kanal. Identitas `@bot` native Slack tidak dapat disimpulkan dari ucapan, jadi konfigurasikan pola nama yang diucapkan atau sertakan penyebutan tertulis. Jika penggemaan transkrip diaktifkan, gema hanya dikirim setelah penerimaan.

## Media, pemotongan, dan pengiriman

<AccordionGroup>
  <Accordion title="Lampiran masuk">
    Lampiran berkas Slack diunduh dari URL privat yang dihosting Slack (alur permintaan yang diautentikasi dengan token) dan ditulis ke penyimpanan media ketika pengambilan berhasil dan batas ukuran mengizinkan. Placeholder berkas menyertakan `fileId` Slack agar agen dapat mengambil berkas asli dengan `download-file`.

    Pengunduhan menggunakan batas waktu diam dan total yang dibatasi. Jika pengambilan berkas Slack macet atau gagal, OpenClaw tetap memproses pesan dan menggunakan fallback placeholder berkas.

    Batas ukuran masuk runtime ditetapkan secara default ke `20MB`, kecuali ditimpa oleh `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Teks dan berkas keluar">
    - potongan teks menggunakan `channels.slack.textChunkLimit` (default `8000`, dibatasi hingga batas panjang pesan Slack sendiri)
    - `channels.slack.streaming.chunkMode="newline"` mengaktifkan pemisahan dengan mengutamakan paragraf
    - pengiriman berkas menggunakan API unggahan Slack dan dapat menyertakan balasan utas (`thread_ts`)
    - keterangan berkas yang panjang menggunakan potongan teks aman untuk Slack pertama sebagai komentar unggahan dan mengirim potongan sisanya sebagai pesan tindak lanjut
    - batas media keluar mengikuti `channels.slack.mediaMaxMb` ketika dikonfigurasi; jika tidak, pengiriman kanal menggunakan default jenis MIME dari pipeline media

  </Accordion>

  <Accordion title="Target pengiriman">
    Target eksplisit yang diutamakan:

    - `user:<id>` untuk DM
    - `channel:<id>` untuk kanal

    DM Slack yang hanya berisi teks/blok dapat memposting langsung ke ID pengguna; unggahan berkas dan pengiriman berutas membuka DM melalui API percakapan Slack terlebih dahulu karena jalur tersebut memerlukan ID percakapan konkret.

  </Accordion>
</AccordionGroup>

## Perintah dan perilaku garis miring

Perintah garis miring muncul di Slack sebagai satu perintah yang dikonfigurasi atau beberapa perintah native. Konfigurasikan `channels.slack.slashCommand` untuk mengubah default perintah:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Perintah native memerlukan [pengaturan manifes tambahan](#additional-manifest-settings) di aplikasi Slack Anda dan sebagai gantinya diaktifkan dengan `channels.slack.commands.native: true` atau `commands.native: true` dalam konfigurasi global.

- Mode otomatis perintah native **nonaktif** untuk Slack, sehingga `commands.native: "auto"` tidak mengaktifkan perintah native Slack.

```txt
/help
```

Menu argumen native dirender sebagai salah satu bentuk berikut, berdasarkan urutan prioritas:

- 3-5 opsi yang cukup pendek: menu luapan ("...")
- lebih dari 100 opsi, dengan pemfilteran opsi asinkron tersedia: pilihan eksternal
- 1-2 opsi, atau opsi apa pun yang nilai terenkodenya terlalu panjang untuk pilihan: blok tombol
- selain itu (6-100 opsi, atau lebih dari 100 tanpa pemfilteran asinkron): menu pilihan statis, dipotong menjadi 100 opsi per menu

```txt
/think
```

Sesi garis miring menggunakan kunci terisolasi seperti `agent:<agentId>:slack:slash:<userId>` dan tetap merutekan eksekusi perintah ke sesi percakapan target menggunakan `CommandTargetSessionKey`.

## Bagan native

[Blok Block Kit `data_visualization`](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/) publik Slack
merender bagan garis, batang, area, dan lingkaran dalam pesan. OpenClaw memetakan blok
`presentation` `chart` portabel ke bentuk native tersebut; tidak diperlukan cakupan OAuth tambahan,
unggahan berkas, perender gambar, atau konfigurasi Slack selain akses pesan
`chat:write` normal.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Pendapatan triwulanan",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "Pendapatan", "values": [120, 145] }],
      "xLabel": "Triwulan"
    }
  ]
}
```

Batas Slack diberlakukan sebelum perenderan native:

- judul dan label sumbu opsional: 50 karakter
- lingkaran: 1-12 segmen positif
- garis/batang/area: 1-12 seri dengan nama unik dan 1-20 kategori bersama
- label segmen, kategori, dan seri: 20 karakter
- setiap seri harus berisi satu nilai berhingga untuk setiap kategori; nilai non-lingkaran
  boleh negatif

Setiap bagan native juga membawa representasi teks tingkat teratas untuk pembaca
layar, notifikasi, pencerminan sesi, dan klien yang tidak dapat merender
blok tersebut. Pengiriman presentasi standar ke kanal OpenClaw lain menerima data
bagan deterministik yang sama sebagai teks, kecuali kanal tersebut menyatakan dukungan bagan native. Jika
Slack menolak bagan dengan `invalid_blocks` selama peluncuran bertahap, OpenClaw
menghapus blok data native yang ditolak, mempertahankan kontrol sejawat, dan mengirim
representasi bagan lengkap sebagai teks yang terlihat.

Slack saat ini menerima hingga dua blok `data_visualization` per pesan. Ketika
presentasi berisi lebih dari dua bagan valid, OpenClaw mempertahankan urutannya
dan melanjutkan perenderan native dalam pesan tindak lanjut, dengan tidak lebih dari dua
bagan dalam setiap pesan.

[Peluncuran pengembang](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
Slack mendokumentasikan blok tersebut sebagai fitur Block Kit untuk aplikasi dan tidak memublikasikan
pembatasan paket berbayar. Ketentuan kelayakan Business+/Enterprise berlaku untuk
pembuatan bagan AI otomatis Slackbot, yang terpisah dari aplikasi yang mengirim
bagan Block Kit yang telah terstruktur. Bagan adalah blok khusus pesan, bukan konten App
Home, modal, atau Canvas.

## Tabel native

[Blok Block Kit `data_table`](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/) Slack saat ini
merender baris dan kolom terstruktur dalam pesan. OpenClaw memetakan blok
`presentation` `table` portabel eksplisit ke `data_table`; blok tersebut tidak menggunakan
[blok `table` lama](https://docs.slack.dev/reference/block-kit/blocks/table-block/) Slack.
Tidak diperlukan cakupan OAuth atau konfigurasi Slack tambahan selain akses pesan
`chat:write` normal.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Pipeline terbuka",
      "headers": ["Akun", "Tahap", "ARR"],
      "rows": [
        ["Acme", "Menang", 125000],
        ["Globex", "Review", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw memetakan sel tajuk dan string ke sel `raw_text` Slack. Sel numerik
dipetakan ke `raw_number`, dengan nilai numerik berhingga dipertahankan untuk pengurutan
dan pemfilteran native. `rowHeaderColumnIndex`, jika tersedia, menandai kolom
berbasis nol tersebut sebagai tajuk baris Slack.

Batas `data_table` yang dipublikasikan Slack diberlakukan sebelum perenderan native:

- 1-20 kolom
- 1-100 baris data, ditambah baris tajuk
- jumlah sel yang sama di setiap baris
- maksimal 10.000 karakter agregat di seluruh sel tabel dalam satu pesan

Beberapa blok tabel valid dapat dirender secara native selama pesan tetap
berada dalam batas karakter agregat. Tabel yang tidak dapat dirender dalam
batas native menjadi teks deterministik lengkap agar baris atau
sel tidak hilang. Jika teks tersebut melebihi satu pesan Slack, pengiriman dan respons garis miring menggunakan
potongan teks berurutan. Pengeditan tabel gagal dengan kesalahan ukuran eksplisit alih-alih
memotong baris dari pesan yang ada secara diam-diam.

Setiap tabel native yang dihasilkan dari presentasi portabel juga membawa representasi
teks tingkat teratas untuk pembaca layar, notifikasi, pencerminan sesi, dan
klien yang tidak dapat merender blok tersebut. Nilai mentah bagan dan tabel tetap literal
dalam fallback, sehingga data sel seperti `<@U123>` tidak menjadi penyebutan Slack.
Jika Slack menolak blok bagan atau tabel native dengan `invalid_blocks`, OpenClaw
menghapus setiap blok data native dalam satu langkah pemulihan terbatas, mempertahankan
blok sejawat yang valid seperti tombol dan pilihan, serta mengirim teks bagan
dan tabel lengkap yang terlihat dengan pemformatan Slack dinonaktifkan. Pengiriman perintah garis miring
melacak anggaran lima panggilan `response_url` Slack selama perintah. Sebelum setiap
kelompok balasan, sistem memilih rencana lengkap yang sesuai dengan sisa panggilan atau gagal
sebelum memposting kelompok tersebut.

Hanya blok tabel `presentation` eksplisit yang dipromosikan menjadi tabel native.
Tabel pipa Markdown tetap berupa teks yang ditulis; OpenClaw tidak menebak struktur
tabel atau jenis sel. Produsen native Slack tepercaya yang ada dapat terus
meneruskan blok mentah melalui `channelData.slack.blocks`; OpenClaw memperoleh teks
fallback dari sel `data_table` mentah yang valid, sedangkan blok khusus yang cacat dapat
menurun menjadi keterangannya atau fallback Block Kit umum. Keluaran agen, CLI,
dan plugin portabel harus menggunakan `presentation`.

## Balasan interaktif

Slack dapat merender kontrol balasan interaktif yang dibuat agen, tetapi fitur ini dinonaktifkan secara default.
Untuk output agen, CLI, dan plugin baru, utamakan tombol
`presentation` atau blok pilihan bersama. Keduanya menggunakan jalur interaksi Slack
yang sama sekaligus tetap dapat diturunkan fungsinya di saluran lain.

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

Saat diaktifkan, agen masih dapat menghasilkan direktif balasan khusus Slack yang sudah tidak digunakan lagi:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Direktif ini dikompilasi menjadi Slack Block Kit dan mengarahkan klik atau pilihan
kembali melalui jalur peristiwa interaksi Slack yang sudah ada. Pertahankan untuk prompt lama
dan jalur alternatif khusus Slack; gunakan presentasi bersama untuk kontrol portabel
baru.

API pengompilasi direktif juga sudah tidak digunakan lagi untuk kode produsen baru:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Gunakan payload `presentation` dan `buildSlackPresentationBlocks(...)` untuk kontrol baru
yang dirender di Slack.

Catatan:

- Ini adalah UI lama khusus Slack. Saluran lain tidak menerjemahkan direktif Slack Block
  Kit menjadi sistem tombolnya sendiri.
- Nilai callback interaktif adalah token opak yang dibuat OpenClaw, bukan nilai mentah yang dibuat agen.
- Jika blok interaktif yang dihasilkan akan melampaui batas Slack Block Kit, OpenClaw kembali menggunakan balasan teks asli alih-alih mengirim payload blok yang tidak valid.

### Pengiriman modal yang dimiliki plugin

Plugin Slack yang mendaftarkan penangan interaktif juga dapat menerima peristiwa siklus hidup modal
`view_submission` dan `view_closed` sebelum OpenClaw memadatkan
payload untuk peristiwa sistem yang terlihat oleh agen. Gunakan salah satu pola perutean
berikut saat membuka modal Slack:

- Atur `callback_id` menjadi `openclaw:<namespace>:<payload>`.
- Atau pertahankan `callback_id` yang sudah ada dan masukkan `pluginInteractiveData:
"<namespace>:<payload>"` ke dalam `private_metadata` modal.

Penangan menerima `ctx.interaction.kind` sebagai `view_submission` atau
`view_closed`, `inputs` yang dinormalisasi, dan objek mentah lengkap `stateValues` dari
Slack. Perutean hanya berdasarkan ID callback sudah cukup untuk memanggil penangan plugin; sertakan
bidang perutean pengguna/sesi `private_metadata` modal yang sudah ada jika
modal juga harus menghasilkan peristiwa sistem yang terlihat oleh agen. Agen menerima
peristiwa sistem `Slack interaction: ...` yang ringkas dan telah disunting. Jika penangan mengembalikan
`systemEvent.summary`, `systemEvent.reference`, atau `systemEvent.data`, bidang
tersebut disertakan dalam peristiwa ringkas itu agar agen dapat merujuk
penyimpanan milik plugin tanpa melihat payload formulir lengkap.

## Persetujuan native di Slack

Slack dapat bertindak sebagai klien persetujuan native dengan tombol dan interaksi yang interaktif, alih-alih kembali menggunakan UI Web atau terminal.

- Persetujuan eksekusi dan plugin dapat dirender sebagai prompt Block Kit native Slack.
- `channels.slack.execApprovals.*` tetap menjadi konfigurasi pengaktifan klien persetujuan eksekusi native dan perutean DM/saluran.
- DM persetujuan eksekusi menggunakan `channels.slack.execApprovals.approvers` atau `commands.ownerAllowFrom`.
- Persetujuan plugin menggunakan tombol native Slack saat Slack diaktifkan sebagai klien persetujuan native untuk sesi asal, atau saat `approvals.plugin` diarahkan ke sesi Slack asal atau target Slack.
- DM persetujuan plugin menggunakan pemberi persetujuan plugin Slack dari `channels.slack.allowFrom`, `allowFrom` akun bernama, atau rute default akun.
- Otorisasi pemberi persetujuan tetap diberlakukan: pemberi persetujuan khusus eksekusi tidak dapat menyetujui permintaan plugin kecuali mereka juga merupakan pemberi persetujuan plugin.

Ini menggunakan permukaan tombol persetujuan bersama yang sama dengan saluran lain. Saat `interactivity` diaktifkan dalam pengaturan aplikasi Slack Anda, prompt persetujuan dirender sebagai tombol Block Kit langsung dalam percakapan.
Saat tombol tersebut tersedia, tombol itu menjadi UX persetujuan utama; OpenClaw
hanya boleh menyertakan perintah `/approve` manual saat hasil alat menyatakan bahwa persetujuan
chat tidak tersedia atau persetujuan manual merupakan satu-satunya jalur.

Jalur konfigurasi:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opsional; kembali menggunakan `commands.ownerAllowFrom` jika memungkinkan)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `agentFilter`, `sessionFilter`

Slack secara otomatis mengaktifkan persetujuan eksekusi native saat `enabled` tidak ditetapkan atau `"auto"` dan setidaknya satu
pemberi persetujuan eksekusi dapat ditemukan. Slack juga dapat menangani persetujuan plugin native melalui jalur klien native
ini saat pemberi persetujuan plugin Slack dapat ditemukan dan permintaan cocok dengan filter klien native. Atur
`enabled: false` untuk menonaktifkan Slack sebagai klien persetujuan native secara eksplisit. Atur `enabled: true` untuk
memaksa persetujuan native aktif saat pemberi persetujuan dapat ditemukan. Menonaktifkan persetujuan eksekusi Slack tidak menonaktifkan
pengiriman persetujuan plugin native Slack yang diaktifkan melalui `approvals.plugin`; pengiriman persetujuan
plugin menggunakan pemberi persetujuan plugin Slack sebagai gantinya.

Perilaku default tanpa konfigurasi persetujuan eksekusi Slack eksplisit:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Konfigurasi native Slack eksplisit hanya diperlukan saat Anda ingin mengganti pemberi persetujuan, menambahkan filter, atau
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

Penerusan `approvals.exec` bersama bersifat terpisah. Gunakan hanya saat prompt persetujuan eksekusi juga harus
diarahkan ke chat lain atau target luar jalur yang eksplisit. Penerusan `approvals.plugin` bersama juga
terpisah; pengiriman native Slack menekan fallback tersebut hanya saat Slack dapat menangani permintaan persetujuan
plugin secara native.

`/approve` dalam chat yang sama juga berfungsi di saluran dan DM Slack yang sudah mendukung perintah. Lihat [Persetujuan eksekusi](/id/tools/exec-approvals) untuk model penerusan persetujuan lengkap.

## Peristiwa dan perilaku operasional

- Pengeditan/penghapusan pesan dipetakan menjadi peristiwa sistem.
- Siaran utas (balasan utas "Also send to channel") diproses sebagai pesan pengguna biasa.
- Peristiwa penambahan/penghapusan reaksi dipetakan menjadi peristiwa sistem.
- Peristiwa anggota bergabung/keluar, saluran dibuat/diubah namanya, serta pin ditambahkan/dihapus dipetakan menjadi peristiwa sistem.
- Polling kehadiran opsional dapat memetakan transisi `away` ke `active` milik peserta manusia yang diamati ke sesi Slack memenuhi syarat milik peserta tersebut yang terakhir aktif. Defaultnya nonaktif.
- `channel_id_changed` dapat memigrasikan kunci konfigurasi saluran saat `configWrites` diaktifkan.
- Metadata topik/tujuan saluran diperlakukan sebagai konteks tidak tepercaya dan dapat disuntikkan ke konteks perutean.
- Pemicu utas dan penyemaian konteks riwayat utas awal difilter berdasarkan daftar pengirim yang diizinkan dan telah dikonfigurasi jika berlaku.
- Tindakan blok, pintasan, dan interaksi modal menghasilkan peristiwa sistem `Slack interaction: ...` terstruktur dengan bidang payload yang kaya:
  - tindakan blok: nilai terpilih, label, nilai pemilih, dan metadata `workflow_*`
  - pintasan global: metadata callback dan pelaku, diarahkan ke sesi langsung pelaku
  - pintasan pesan: konteks callback, pelaku, saluran, utas, dan pesan terpilih
  - peristiwa modal `view_submission` dan `view_closed` dengan metadata saluran yang diarahkan dan input formulir

Tentukan pintasan global atau pesan dalam konfigurasi aplikasi Slack Anda dan gunakan ID callback apa pun yang tidak kosong. OpenClaw mengakui payload pintasan yang cocok, menerapkan kebijakan pengirim DM/saluran yang sama seperti interaksi Slack lainnya, dan mengantrekan peristiwa yang telah disanitasi untuk sesi agen yang diarahkan. ID pemicu dan URL respons disunting dari konteks agen.

### Peristiwa kehadiran

Slack tidak mengirim perubahan kehadiran melalui Events API atau Socket Mode. Sebagai gantinya, OpenClaw dapat melakukan polling [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) untuk peserta manusia yang pesannya lolos pemeriksaan akses dan perutean Slack normal.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (default): tanpa pewaktu kehadiran atau panggilan API Slack.
- `auto`: pantau DM, MPIM, dan utas Slack yang aktif dalam 24 jam terakhir dengan paling banyak 8 peserta manusia yang diamati. Sesi saluran tingkat atas tidak disertakan.
- `on`: pantau percakapan yang sama tanpa batas peserta dan sertakan sesi saluran tingkat atas. Gunakan penggantian per saluran untuk memaksa atau menekan satu saluran.

OpenClaw melakukan polling terhadap paling banyak 45 pengguna unik per menit per akun Slack, menyemai hasil pertama tanpa membangunkan agen, dan hanya membangunkan saat transisi `away` ke `active` teramati. Masa jeda tahan lama selama 8 jam berlaku per akun dan pengguna Slack, meskipun orang tersebut berpartisipasi dalam beberapa utas. Peristiwa hanya diarahkan ke percakapan memenuhi syarat milik orang tersebut yang terakhir aktif dan memberi tahu agen agar memeriksa memori/wiki serta konteks zona waktu yang diketahui sebelum memutuskan apakah akan mengirim satu sapaan singkat. Agen dapat tetap diam.

Token bot memerlukan `users:read`, yang sudah disertakan dalam manifes yang direkomendasikan. Peristiwa kehadiran tidak tersedia untuk penginstalan tingkat organisasi Enterprise Grid.

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Slack](/id/gateway/config-channels#slack).

<Accordion title="Bidang Slack bersinyal tinggi">

- mode/autentikasi: `identity`, `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `userToken`, `signingSecret`, `webhookPath`, `accounts.*`
- akses DM: `dm.enabled`, `dmPolicy`, `allowFrom` (lama: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- sakelar kompatibilitas: `dangerouslyAllowNameMatching` (darurat; tetap nonaktif kecuali diperlukan)
- akses saluran: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`, `implicitMentions.*`
- utas/riwayat: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pemicu bangun kehadiran: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; default `off`)
- pengiriman: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- pratinjau: `unfurlLinks` (default: `false`), `unfurlMedia` untuk kontrol pratinjau tautan/media `chat.postMessage`; atur `unfurlLinks: true` untuk kembali mengaktifkan pratinjau tautan
- operasi/fitur: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada balasan di saluran">
    Periksa secara berurutan:

    - `groupPolicy`
    - daftar yang diizinkan untuk kanal (`channels.slack.channels`) — **kunci harus berupa ID kanal** (`C12345678`), bukan nama (`#channel-name`). Kunci berbasis nama gagal tanpa pemberitahuan pada `groupPolicy: "allowlist"` karena perutean kanal secara default memprioritaskan ID. Untuk menemukan ID: klik kanan kanal di Slack → **Copy link** — nilai `C...` di akhir URL adalah ID kanal.
    - `requireMention`
    - daftar `users` yang diizinkan per kanal
    - `messages.groupChat.visibleReplies`: permintaan grup/kanal normal secara default menggunakan `"automatic"`. Jika Anda memilih untuk mengaktifkan `"message_tool"` dan log menampilkan teks asisten tanpa panggilan `message(action=send)`, model melewatkan jalur alat pesan yang terlihat. Teks akhir tetap privat dalam mode ini; periksa log verbose Gateway untuk metadata payload yang disembunyikan, atau atur ke `"automatic"` jika Anda ingin setiap balasan akhir normal dari asisten diposting melalui jalur lama.
    - `messages.groupChat.unmentionedInbound`: jika nilainya `"room_event"`, percakapan kanal yang diizinkan tanpa penyebutan menjadi konteks sekitar dan tetap senyap kecuali agen memanggil alat `message`. Lihat [Peristiwa ruang sekitar](/id/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - `channels.slack.dmPolicy` (atau `channels.slack.dm.policy` lama)
    - persetujuan pemasangan / entri daftar yang diizinkan (`dmPolicy: "open"` tetap memerlukan `channels.slack.allowFrom: ["*"]`)
    - DM grup menggunakan penanganan MPIM; aktifkan `channels.slack.dm.groupEnabled` dan, jika dikonfigurasi, sertakan MPIM dalam `channels.slack.dm.groupChannels`
    - peristiwa DM Slack Assistant: log verbose yang menyebutkan `drop message_changed`
      biasanya berarti Slack mengirim peristiwa utas Assistant yang telah diedit tanpa
      pengirim manusia yang dapat dipulihkan dalam metadata pesan

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode tidak terhubung">
    Validasi token bot dan aplikasi serta pengaktifan Socket Mode dalam pengaturan aplikasi Slack.
    App-Level Token memerlukan `connections:write`, dan token bot
    Bot User OAuth Token harus berasal dari aplikasi/ruang kerja Slack yang sama dengan token aplikasi.

    Jika `openclaw channels status --probe --json` menampilkan `botTokenStatus` atau
    `appTokenStatus: "configured_unavailable"`, akun Slack telah
    dikonfigurasi, tetapi runtime saat ini tidak dapat memperoleh nilai yang
    didukung SecretRef.

    Log seperti `slack socket mode failed to start; retry ...` merupakan kegagalan
    awal yang dapat dipulihkan. Cakupan yang tidak tersedia, token yang dicabut, dan autentikasi yang tidak valid akan langsung gagal.
    Sebaliknya, log `slack token mismatch ...` berarti token bot dan token aplikasi
    tampaknya berasal dari aplikasi Slack yang berbeda; perbaiki kredensial aplikasi Slack.

  </Accordion>

  <Accordion title="Mode HTTP tidak menerima peristiwa">
    Validasi:

    - rahasia penandatanganan
    - jalur Webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` yang unik untuk setiap akun HTTP
    - URL publik mengakhiri TLS dan meneruskan permintaan ke jalur Gateway
    - jalur `request_url` aplikasi Slack sama persis dengan `channels.slack.webhookPath` (default `/slack/events`)

    Jika `signingSecretStatus: "configured_unavailable"` muncul dalam snapshot akun,
    akun HTTP telah dikonfigurasi, tetapi runtime saat ini tidak dapat
    memperoleh rahasia penandatanganan yang didukung SecretRef.

    Log `slack: webhook path ... already registered` yang berulang berarti dua akun HTTP
    menggunakan `webhookPath` yang sama; berikan jalur yang berbeda untuk setiap akun.

  </Accordion>

  <Accordion title="Perintah native/slash tidak dijalankan">
    Pastikan apakah yang Anda maksud adalah:

    - mode perintah native (`channels.slack.commands.native: true`) dengan perintah slash yang sesuai terdaftar di Slack
    - atau mode satu perintah slash (`channels.slack.slashCommand.enabled: true`)

    Slack tidak membuat atau menghapus perintah slash secara otomatis. `commands.native: "auto"` tidak mengaktifkan perintah native Slack; gunakan `true` dan buat perintah yang sesuai di aplikasi Slack. Dalam mode HTTP, setiap perintah slash Slack harus menyertakan URL Gateway. Dalam Socket Mode, payload perintah diterima melalui websocket dan Slack mengabaikan `slash_commands[].url`.

    Periksa juga `commands.useAccessGroups`, otorisasi DM, daftar kanal yang diizinkan,
    dan daftar `users` yang diizinkan per kanal. Slack mengembalikan galat sementara untuk
    pengirim perintah slash yang diblokir, termasuk:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referensi media lampiran

Slack dapat melampirkan media yang diunduh ke giliran agen ketika pengunduhan berkas Slack berhasil dan batas ukuran mengizinkannya. Klip audio dapat ditranskripsikan, berkas gambar dapat diteruskan melalui jalur pemahaman media atau langsung ke model balasan yang mendukung visi, dan berkas lainnya tetap tersedia sebagai konteks berkas yang dapat diunduh.

### Jenis media yang didukung

| Jenis media                    | Sumber               | Perilaku saat ini                                                                | Catatan                                                                   |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Klip audio Slack               | URL berkas Slack     | Diunduh dan dirutekan melalui transkripsi audio bersama                           | Memerlukan `files:read` dan model atau CLI `tools.media.audio` yang berfungsi |
| Gambar JPEG / PNG / GIF / WebP | URL berkas Slack     | Diunduh dan dilampirkan ke giliran untuk penanganan yang mendukung visi           | Batas per berkas: `channels.slack.mediaMaxMb` (default 20 MB)                      |
| Berkas PDF                     | URL berkas Slack     | Diunduh dan disediakan sebagai konteks berkas untuk alat seperti `download-file` atau `pdf` | Masukan Slack tidak otomatis mengubah PDF menjadi masukan visi gambar |
| Berkas lainnya                 | URL berkas Slack     | Diunduh jika memungkinkan dan disediakan sebagai konteks berkas                   | Berkas biner tidak diperlakukan sebagai masukan gambar                    |
| Balasan utas                   | Berkas pembuka utas  | Berkas pesan akar dapat dimuat sebagai konteks ketika balasan tidak memiliki media langsung | Pembuka yang hanya berisi berkas menggunakan placeholder lampiran |
| Pesan dengan banyak berkas     | Beberapa berkas Slack | Setiap berkas dievaluasi secara independen                                       | Pemrosesan Slack dibatasi hingga delapan berkas per pesan                 |

### Pipeline masuk

Ketika pesan Slack dengan lampiran berkas diterima:

1. OpenClaw mengunduh berkas dari URL privat Slack menggunakan token bot.
2. Berkas ditulis ke penyimpanan media setelah berhasil.
3. Jalur media yang diunduh dan jenis kontennya ditambahkan ke konteks masuk.
4. Klip audio dirutekan ke pipeline transkripsi bersama; jalur model/alat yang mendukung gambar dapat menggunakan lampiran gambar dari konteks yang sama.
5. Berkas lainnya tetap tersedia sebagai metadata berkas atau referensi media bagi alat yang dapat menanganinya.

### Pewarisan lampiran akar utas

Ketika pesan diterima dalam sebuah utas (memiliki induk `thread_ts`):

- Jika balasan itu sendiri tidak memiliki media langsung dan pesan akar yang disertakan memiliki berkas, Slack dapat memuat berkas akar sebagai konteks pembuka utas.
- Berkas akar hanya dimuat saat memulai sesi utas baru atau yang telah direset. Balasan berikutnya yang hanya berisi teks menggunakan kembali konteks sesi yang sudah ada dan tidak melampirkan kembali berkas akar sebagai media baru.
- Lampiran langsung pada balasan lebih diprioritaskan daripada lampiran pesan akar.
- Pesan akar yang hanya memiliki berkas tanpa teks direpresentasikan dengan placeholder lampiran agar fallback tetap dapat menyertakan berkasnya.

### Penanganan banyak lampiran

Ketika satu pesan Slack berisi beberapa lampiran berkas:

- Setiap lampiran diproses secara independen melalui pipeline media.
- Referensi media yang diunduh digabungkan ke dalam konteks pesan.
- Urutan pemrosesan mengikuti urutan berkas Slack dalam payload peristiwa.
- Kegagalan mengunduh satu lampiran tidak memblokir lampiran lainnya.

### Batas ukuran, pengunduhan, dan model

- **Batas ukuran**: Default 20 MB per berkas. Dapat dikonfigurasi melalui `channels.slack.mediaMaxMb`.
- **Batas transkripsi audio**: `tools.media.audio.maxBytes` juga berlaku ketika berkas yang diunduh dikirim ke penyedia transkripsi atau CLI.
- **Kegagalan pengunduhan**: Berkas yang tidak dapat disajikan oleh Slack, URL kedaluwarsa, berkas yang tidak dapat diakses, berkas yang terlalu besar, dan respons HTML autentikasi/login Slack dilewati, bukan dilaporkan sebagai format yang tidak didukung.
- **Model visi**: Analisis gambar menggunakan model balasan aktif jika mendukung visi, atau model gambar yang dikonfigurasi pada `agents.defaults.imageModel`.

### Batas yang diketahui

| Skenario                                      | Perilaku saat ini                                                                 | Solusi sementara                                                              |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| URL berkas Slack kedaluwarsa                  | Berkas dilewati; tidak ada galat yang ditampilkan                                  | Unggah ulang berkas di Slack                                                  |
| Transkripsi audio tidak tersedia              | Klip tetap terlampir, tetapi tidak ada transkrip yang dihasilkan                   | Konfigurasikan `tools.media.audio` atau instal CLI transkripsi lokal yang didukung |
| Klip tanpa keterangan tidak lolos gerbang penyebutan | Dihapus setelah transkripsi spekulatif privat; transkrip dan unduhan dibuang | Konfigurasikan pola penyebutan nama lisan, tambahkan penyebutan bot yang diketik, atau gunakan DM |
| Model visi tidak dikonfigurasi                | Lampiran gambar disimpan sebagai referensi media, tetapi tidak dianalisis sebagai gambar | Konfigurasikan `agents.defaults.imageModel` atau gunakan model balasan yang mendukung visi |
| Gambar sangat besar (> 20 MB secara default)  | Dilewati sesuai batas ukuran                                                       | Tingkatkan `channels.slack.mediaMaxMb` jika Slack mengizinkan                          |
| Lampiran yang diteruskan/dibagikan            | Teks dan media gambar/berkas yang dihosting Slack ditangani sebisa mungkin         | Bagikan ulang secara langsung di utas OpenClaw                                |
| Lampiran PDF                                  | Disimpan sebagai konteks berkas/media, tidak otomatis dirutekan melalui visi gambar | Gunakan `download-file` untuk metadata berkas atau alat `pdf` untuk analisis PDF |

### Dokumentasi terkait

- [Pipeline pemahaman media](/id/nodes/media-understanding)
- [Catatan audio dan suara](/id/nodes/audio)
- [Alat PDF](/id/tools/pdf)

## Terkait

<CardGroup cols={2}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Slack dengan Gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku kanal dan DM grup.
  </Card>
  <Card title="Perutean kanal" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan penguatan keamanan.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Tata letak dan urutan prioritas konfigurasi.
  </Card>
  <Card title="Perintah garis miring" icon="terminal" href="/id/tools/slash-commands">
    Katalog dan perilaku perintah.
  </Card>
</CardGroup>
