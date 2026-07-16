---
read_when:
    - Menyiapkan Slack atau men-debug mode soket, HTTP, atau relai Slack
summary: Penyiapan Slack dan perilaku runtime (Socket Mode, URL Permintaan HTTP, dan mode relai)
title: Slack
x-i18n:
    generated_at: "2026-07-16T17:48:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Dukungan Slack mencakup DM dan saluran melalui integrasi aplikasi Slack. Transport default adalah Socket Mode; HTTP Request URLs juga didukung. Mode relay ditujukan untuk penerapan terkelola ketika router tepercaya menangani ingress Slack.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    DM Slack secara default menggunakan mode pemasangan.
  </Card>
  <Card title="Perintah garis miring" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Pemecahan masalah saluran" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas saluran dan panduan perbaikan.
  </Card>
</CardGroup>

## Memilih transport

Socket Mode dan HTTP Request URLs memiliki kesetaraan fitur untuk perpesanan, perintah garis miring, App Home, dan interaktivitas. Pilih berdasarkan bentuk penerapan, bukan fitur.

| Pertimbangan                  | Socket Mode (default)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| URL Gateway publik           | Tidak diperlukan                                                                                                                                     | Diperlukan (DNS, TLS, reverse proxy, atau tunnel)                                                              |
| Jaringan keluar              | WSS keluar ke `wss-primary.slack.com` harus dapat dijangkau                                                                                               | Tanpa WS keluar; hanya HTTPS masuk                                                                             |
| Token yang diperlukan        | Token bot + App-Level Token dengan `connections:write`                                                                                                | Token bot + Signing Secret                                                                                     |
| Laptop pengembangan / di balik firewall | Berfungsi tanpa perubahan                                                                                                                  | Memerlukan tunnel publik (ngrok, Cloudflare Tunnel, Tailscale Funnel) atau Gateway staging                     |
| Penskalaan horizontal        | Satu sesi Socket Mode per aplikasi per host; beberapa Gateway memerlukan aplikasi Slack terpisah                                                     | Handler POST tanpa status; beberapa replika Gateway dapat berbagi satu aplikasi di belakang load balancer      |
| Multi-akun pada satu Gateway | Didukung; setiap akun membuka WS-nya sendiri                                                                                                         | Didukung; setiap akun memerlukan `webhookPath` unik (default `/slack/events`) agar pendaftaran tidak bertabrakan |
| Transport perintah garis miring | Dikirim melalui koneksi WS; `slash_commands[].url` diabaikan                                                                                          | Slack mengirim POST ke `slash_commands[].url`; bidang ini diperlukan agar perintah dapat didispatch                |
| Penandatanganan permintaan   | Tidak digunakan (autentikasi menggunakan App-Level Token)                                                                                            | Slack menandatangani setiap permintaan; OpenClaw memverifikasinya dengan `signingSecret`                    |
| Pemulihan saat koneksi terputus | Koneksi ulang otomatis Slack SDK diaktifkan; OpenClaw juga memulai ulang sesi Socket Mode yang gagal dengan backoff terbatas. Penyetelan transport batas waktu pong berlaku. | Tidak ada koneksi persisten yang dapat terputus; percobaan ulang dilakukan per permintaan oleh Slack           |

<Note>
  **Pilih Socket Mode** untuk host dengan satu Gateway, laptop pengembangan, dan jaringan lokal yang dapat menjangkau `*.slack.com` secara keluar tetapi tidak dapat menerima HTTPS masuk.

**Pilih HTTP Request URLs** saat menjalankan beberapa replika Gateway di belakang load balancer, ketika WSS keluar diblokir tetapi HTTPS masuk diizinkan, atau ketika webhook Slack sudah diakhiri pada reverse proxy.
</Note>

<Warning>
  Slack dapat mempertahankan beberapa koneksi Socket Mode untuk satu aplikasi dan dapat mengirimkan setiap payload ke koneksi mana pun. Oleh karena itu, Gateway OpenClaw terpisah yang berbagi aplikasi Slack memerlukan konfigurasi perutean dan otorisasi yang setara. Jika tidak, gunakan aplikasi Slack terpisah untuk setiap Gateway, satu ingress relay, atau HTTP Request URLs di belakang load balancer. Lihat [Menggunakan Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Mode relay

Mode relay memisahkan ingress Slack dari Gateway OpenClaw. Router tepercaya menangani satu-satunya koneksi Slack Socket Mode, memilih Gateway tujuan, lalu meneruskan peristiwa bertipe melalui websocket terautentikasi. Gateway tetap menggunakan token botnya sendiri untuk panggilan Slack Web API keluar.

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

URL relay harus menggunakan `wss://` kecuali jika menargetkan localhost. Perlakukan token bearer dan tabel rute router sebagai bagian dari batas otorisasi Slack: peristiwa yang dirutekan memasuki handler pesan Slack normal sebagai aktivasi yang diotorisasi. `slack_identity` yang disediakan router dalam frame websocket `hello` dapat mengatur nama pengguna dan ikon keluar default; identitas eksplisit yang diberikan pemanggil tetap diutamakan. Koneksi relay tersambung kembali dengan waktu backoff terbatas yang sama seperti Socket Mode dan menghapus identitas yang disediakan router setiap kali koneksi terputus.

### Instalasi tingkat organisasi Enterprise Grid

Satu akun Slack dapat menerima pesan dari setiap workspace yang tercakup dalam
instalasi tingkat organisasi Enterprise Grid. Pilih Socket Mode langsung atau HTTP
Request URLs; mode relay tidak didukung untuk akun perusahaan. Kedua
manifes dengan hak akses minimum di bawah ini hanya mengaktifkan jalur peristiwa V1 `message` dan `app_mention`,
balasan langsung, dan reaksi status yang dikelola listener.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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
tingkat organisasi, dan memilih workspace yang dicakup oleh instalasi tersebut.
Pastikan aplikasi tersedia di setiap workspace yang dituju sebelum memulai
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
koneksi Socket Mode. Ganti URL contoh dengan URL publik
`webhookPath` milik Gateway (default `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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
tingkat organisasi, dan memilih workspace yang dicakup oleh instalasi tersebut.
Setelah Slack memverifikasi Request URL, salin token bot instalasi organisasi dan
**Basic Information -> App Credentials -> Signing Secret** milik aplikasi. Konfigurasikan
akun perusahaan dengan jalur Request URL yang sama:

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
Token yang diinstal organisasi tanpa flag tersebut, atau token workspace dengan flag tersebut,
menyebabkan startup gagal. Slack tetap menjadi sumber kebenaran untuk workspace yang telah
memberikan izin instalasi; OpenClaw kemudian menerapkan kebijakan saluran, pengguna,
DM, dan mention yang dikonfigurasi pada setiap peristiwa yang dikirimkan. Enterprise V1 menolak semua
peristiwa `message` dan `app_mention` yang dibuat bot sebelum dispatch, terlepas dari
`allowBots`, karena instalasi organisasi tidak menyediakan identitas bot
berkualifikasi workspace yang stabil untuk pencegahan loop.

Dukungan perusahaan sengaja dibatasi pada peristiwa langsung Socket Mode atau HTTP
`message` dan `app_mention` beserta balasan langsungnya. Mode relay,
perintah garis miring, interaksi, App Home, listener peristiwa reaksi, pin, alat tindakan Slack,
persetujuan native Slack, binding, pengiriman dalam antrean atau terjadwal,
dan pengiriman proaktif tidak tersedia untuk akun perusahaan. Reaksi
penerimaan, pengetikan, dan status keluar didukung melalui klien Slack
yang dikelola listener dan memerlukan `reactions:write`; notifikasi reaksi
masuk dan alat tindakan reaksi tetap tidak tersedia.

Balasan langsung menggunakan kembali perilaku pengiriman Slack standar untuk potongan,
media, metadata, fallback identitas, unfurl, dan tanda terima, tetapi hanya selama
klien milik listener yang telah divalidasi tetap berada dalam giliran peristiwa aktif. Antrean
pengiriman dalam memori dan catatan partisipasi utas dipartisi berdasarkan workspace
peristiwa tersebut; klien itu sendiri tidak pernah diserialisasi atau dipersistenkan.

Kunci kebijakan kanal dan entri `dm.groupChannels` harus menggunakan ID kanal Slack stabil mentah atau
bentuk `channel:<id>`. OpenClaw menormalisasi kedua bentuk menjadi ID kanal mentah untuk
pencocokan runtime; prefiks `slack:`, `group:`, dan `mpim:` menyebabkan startup gagal.
Entri kebijakan pengguna harus menggunakan ID pengguna Slack yang stabil; nama, slug, nama tampilan,
dan alamat email menyebabkan startup gagal. ID harus menggunakan prefiks huruf besar kanonis
dan bagian utama Slack (misalnya, `C0123456789` atau `U0123456789`); bentuk huruf kecil dan
bentuk pendek yang menyerupainya menyebabkan startup gagal. Akun Enterprise tidak dapat mengaktifkan
`dangerouslyAllowNameMatching`. Akun Enterprise dapat menetapkan
`mentionPatterns.mode` global, tetapi `mentionPatterns.allowIn` dan
`mentionPatterns.denyIn` menyebabkan startup gagal karena ID kanal Slack tanpa kualifikasi tidak
dikualifikasi oleh workspace dan dapat digunakan kembali di berbagai workspace. Instalasi workspace
mempertahankan perilaku pola mention dengan cakupan yang sudah ada. Setiap workspace yang diterima
mendapatkan identitas perutean, sesi, transkrip, deduplikasi, riwayat, dan cache tersendiri
meskipun ID Slack saling tumpang tindih. Dalam aliran `message`, pesan pengguna biasa
dan peristiwa `file_share` yang dibuat pengguna didukung; subtipe pesan lainnya
ditolak sebelum otorisasi atau penanganan peristiwa sistem.

DM Enterprise harus dinonaktifkan (`dm.enabled=false` atau
`dmPolicy="disabled"`) atau dibuka secara eksplisit dengan `dmPolicy="open"` dan
`allowFrom` akun efektif yang berisi literal `"*"`. Daftar izin kosong
atau ID khusus pengguna tanpa `"*"` menyebabkan startup gagal. Pairing dan
daftar izin DM per pengguna ditolak karena ID pengguna Slack tidak
dikualifikasi oleh workspace dalam penyimpanan otorisasi tersebut. Kebijakan kanal dan pengirim
tetap berlaku untuk pesan kanal.

## Instalasi

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` mendaftarkan dan mengaktifkan plugin. Perintah ini tidak melakukan apa pun hingga Anda mengonfigurasi aplikasi Slack dan pengaturan kanal di bawah ini. Lihat [Plugin](/id/tools/plugin) untuk aturan umum instalasi plugin.

## Penyiapan cepat

Manifes di bagian ini membuat instalasi dengan cakupan workspace. Untuk
instalasi organisasi Enterprise Grid, gunakan
[manifes dan alur kerja tingkat organisasi](#enterprise-grid-org-wide-installs) khusus sebagai gantinya.

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Buat aplikasi Slack baru">
        Buka [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → pilih workspace Anda → tempel salah satu manifes di bawah ini → **Next** → **Create**.

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
      "assistant_description": "OpenClaw menghubungkan utas asisten Slack dengan agen OpenClaw.",
      "suggested_prompts": [
        { "title": "Apa yang dapat Anda lakukan?", "message": "Apa yang dapat Anda bantu?" },
        {
          "title": "Ringkas kanal ini",
          "message": "Ringkas aktivitas terkini di kanal ini."
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
      "assistant_description": "OpenClaw menghubungkan utas asisten Slack dengan agen OpenClaw.",
      "suggested_prompts": [
        { "title": "Apa yang dapat Anda lakukan?", "message": "Apa yang dapat Anda bantu?" },
        {
          "title": "Ringkas kanal ini",
          "message": "Ringkas aktivitas terkini di kanal ini."
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
          **Recommended** sesuai dengan rangkaian fitur lengkap plugin Slack: App Home, perintah slash, file, reaksi, pin, DM grup, serta pembacaan emoji/grup pengguna. Pilih **Minimal** jika kebijakan workspace membatasi scope — pilihan ini mencakup DM, riwayat kanal/grup, mention, dan perintah slash, tetapi tidak menyertakan file, reaksi, pin, DM grup (`mpim:*`), `emoji:read`, dan `usergroups:read`. Lihat [Daftar periksa manifes dan scope](#manifest-and-scope-checklist) untuk alasan setiap scope dan opsi tambahan seperti perintah slash tambahan.
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

  <Tab title="URL Permintaan HTTP">
    <Steps>
      <Step title="Buat aplikasi Slack baru">
        Buka [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → pilih workspace Anda → tempel salah satu manifes di bawah ini → ganti `https://gateway-host.example.com/slack/events` dengan URL Gateway publik Anda → **Next** → **Create**.

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
      "assistant_description": "OpenClaw menghubungkan utas asisten Slack dengan agen OpenClaw.",
      "suggested_prompts": [
        { "title": "Apa yang dapat Anda lakukan?", "message": "Apa yang dapat Anda bantu?" },
        {
          "title": "Ringkas kanal ini",
          "message": "Ringkas aktivitas terkini di kanal ini."
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
          **Direkomendasikan** cocok dengan rangkaian fitur lengkap Plugin Slack; **Minimal** meniadakan file, reaksi, sematan, DM grup (`mpim:*`), `emoji:read`, dan `usergroups:read` untuk ruang kerja yang dibatasi. Lihat [Daftar periksa manifes dan cakupan](#manifest-and-scope-checklist) untuk alasan setiap cakupan.
        </Note>

        <Info>
          Ketiga bidang URL (`slash_commands[].url`, `event_subscriptions.request_url`, dan `interactivity.request_url` / `message_menu_options_url`) semuanya mengarah ke endpoint OpenClaw yang sama. Skema manifes Slack mengharuskannya diberi nama secara terpisah, tetapi OpenClaw merutekan berdasarkan jenis payload sehingga satu `webhookPath` (default `/slack/events`) sudah cukup. Perintah garis miring tanpa `slash_commands[].url` tidak melakukan apa pun secara diam-diam dalam mode HTTP.
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
        Gunakan path Webhook unik untuk HTTP multiakun

        Berikan setiap akun `webhookPath` yang berbeda (default `/slack/events`) agar pendaftaran tidak bertabrakan.
        </Note>

      </Step>

      <Step title="Mulai Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Penyesuaian transportasi Socket Mode

OpenClaw menetapkan batas waktu pong klien SDK Slack ke 15 detik secara default untuk Socket Mode. Timpa pengaturan transportasi hanya saat Anda memerlukan penyesuaian khusus ruang kerja atau host:

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

Gunakan ini hanya untuk ruang kerja Socket Mode yang mencatat batas waktu pong websocket/ping server Slack atau berjalan pada host dengan kelaparan event loop yang diketahui. `clientPingTimeout` adalah waktu tunggu pong setelah SDK mengirim ping klien; `serverPingTimeout` adalah waktu tunggu untuk ping server Slack. Pesan dan peristiwa aplikasi tetap merupakan status aplikasi, bukan sinyal keaktifan transportasi.

Catatan:

- `socketMode` diabaikan dalam mode HTTP Request URL.
- Pengaturan dasar `channels.slack.socketMode` berlaku untuk semua akun Slack kecuali ditimpa. Penimpaan per akun menggunakan `channels.slack.accounts.<accountId>.socketMode`; karena ini merupakan penimpaan objek, sertakan setiap bidang penyesuaian soket yang Anda inginkan untuk akun tersebut.
- Hanya `clientPingTimeout` yang memiliki default OpenClaw (`15000`). `serverPingTimeout` dan `pingPongLoggingEnabled` diteruskan ke SDK Slack hanya saat dikonfigurasi.
- Backoff mulai ulang Socket Mode dimulai sekitar 2 detik dan dibatasi sekitar 30 detik. Kegagalan mulai, menunggu mulai, dan pemutusan yang dapat dipulihkan akan dicoba ulang hingga kanal berhenti. Kesalahan akun dan kredensial permanen seperti autentikasi tidak valid, token yang dicabut, atau cakupan yang tidak ada akan langsung gagal alih-alih mencoba ulang selamanya.

## Daftar periksa manifes dan cakupan

Manifes dasar aplikasi Slack sama untuk Socket Mode dan HTTP Request URL. Hanya blok `settings` (dan `url` perintah garis miring) yang berbeda.

Manifes dasar (default Socket Mode):

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

Tampilkan berbagai fitur yang memperluas default di atas.

Manifes default mengaktifkan tab **Home** pada Slack App Home dan berlangganan ke `app_home_opened`. Saat anggota ruang kerja membuka tab Home, OpenClaw menerbitkan tampilan Home default yang aman dengan `views.publish`; tidak ada payload percakapan atau konfigurasi privat yang disertakan. Saat mode perintah garis miring tunggal diaktifkan, petunjuk perintah menggunakan `channels.slack.slashCommand.name`; instalasi yang menggunakan perintah native atau tanpa perintah garis miring tidak menyertakan petunjuk tersebut. Tab **Messages** tetap diaktifkan untuk DM Slack. Manifes juga mengaktifkan utas asisten Slack dengan `features.assistant_view`, `assistant:write`, `assistant_thread_started`, dan `assistant_thread_context_changed`; utas asisten dirutekan ke sesi utas OpenClaw tersendiri dan menjaga konteks utas yang disediakan Slack tetap tersedia bagi agen.

<AccordionGroup>
  <Accordion title="Perintah garis miring native opsional">

    Beberapa [perintah garis miring native](#commands-and-slash-behavior) dapat digunakan sebagai pengganti satu perintah yang dikonfigurasi, dengan beberapa ketentuan:

    - Gunakan `/agentstatus` sebagai pengganti `/status` karena perintah `/status` dicadangkan.
    - Tidak lebih dari 25 perintah garis miring dapat didaftarkan sekaligus pada aplikasi Slack (batas platform Slack).

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
      "description": "Ringkas konteks sesi",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Hentikan proses saat ini"
    },
    {
      "command": "/session",
      "description": "Kelola masa berlaku pengikatan utas",
      "usage_hint": "idle <duration|off> atau max-age <duration|off>"
    },
    {
      "command": "/think",
      "description": "Atur tingkat pemikiran",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Aktifkan atau nonaktifkan keluaran terperinci",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Tampilkan atau atur mode cepat",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Aktifkan atau nonaktifkan visibilitas penalaran",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Aktifkan atau nonaktifkan mode dengan hak istimewa",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Tampilkan atau atur nilai bawaan exec",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Setujui atau tolak permintaan persetujuan yang tertunda",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Tampilkan atau atur model",
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
      "description": "Cantumkan tugas latar belakang yang aktif/terbaru untuk sesi saat ini"
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
      "command": "/side",
      "description": "Ajukan pertanyaan sampingan tanpa mengubah konteks sesi",
      "usage_hint": "<question>"
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
        Gunakan daftar `slash_commands` yang sama seperti Socket Mode di atas, dan tambahkan `"url": "https://gateway-host.example.com/slack/events"` ke setiap entri. Contoh:

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
    Tambahkan cakupan bot `chat:write.customize` jika Anda ingin pesan keluar menggunakan identitas agen aktif (nama pengguna dan ikon khusus), bukan identitas aplikasi Slack bawaan.

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
- Mode relai memerlukan `botToken` beserta `relay.url`, `relay.authToken`, dan `relay.gatewayId`; mode ini tidak menggunakan token aplikasi atau rahasia penandatanganan.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken`, dan `userToken` menerima string
  teks biasa atau objek SecretRef.
- Token konfigurasi menggantikan fallback env.
- Fallback env `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, dan `SLACK_USER_TOKEN` masing-masing hanya berlaku untuk akun bawaan.
- `userToken` secara bawaan menggunakan perilaku hanya-baca (`userTokenReadOnly: true`).

Perilaku snapshot status:

- Pemeriksaan akun Slack melacak bidang `*Source` dan `*Status`
  per kredensial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Statusnya adalah `available`, `configured_unavailable`, atau `missing`.
- `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef
  atau sumber rahasia non-inline lainnya, tetapi jalur perintah/runtime saat ini
  tidak dapat menguraikan nilai sebenarnya.
- Dalam mode HTTP, `signingSecretStatus` disertakan; dalam Socket Mode,
  pasangan yang diperlukan adalah `botTokenStatus` + `appTokenStatus`.

<Tip>
Untuk tindakan/pembacaan direktori, token pengguna dapat diprioritaskan jika dikonfigurasi. Untuk penulisan, token bot tetap diprioritaskan; penulisan dengan token pengguna hanya diizinkan ketika `userTokenReadOnly: false` dan token bot tidak tersedia.
</Tip>

## Tindakan dan gerbang

Tindakan Slack dikendalikan oleh `channels.slack.actions.*`.

Grup tindakan yang tersedia dalam peralatan Slack saat ini:

| Grup       | Bawaan    |
| ---------- | --------- |
| messages   | diaktifkan |
| reactions  | diaktifkan |
| pins       | diaktifkan |
| memberInfo | diaktifkan |
| emojiList  | diaktifkan |

Tindakan pesan Slack saat ini mencakup `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, dan `emoji-list`. `download-file` menerima ID file Slack yang ditampilkan dalam placeholder file masuk dan mengembalikan pratinjau gambar untuk gambar atau metadata file lokal untuk jenis file lainnya.

## Kontrol akses dan perutean

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.slack.dmPolicy` mengontrol akses DM. `channels.slack.allowFrom` adalah daftar yang diizinkan DM kanonis.

    - `pairing` (bawaan)
    - `allowlist`
    - `open` (mengharuskan `channels.slack.allowFrom` menyertakan `"*"`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (bawaan true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (warisan)
    - `dm.groupEnabled` (DM grup secara bawaan false)
    - `dm.groupChannels` (daftar yang diizinkan MPIM opsional)

    Urutan prioritas multiakun:

    - `channels.slack.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Akun bernama mewarisi `channels.slack.allowFrom` ketika `allowFrom` miliknya belum ditetapkan.
    - Akun bernama tidak mewarisi `channels.slack.accounts.default.allowFrom`.

    `channels.slack.dm.policy` dan `channels.slack.dm.allowFrom` warisan masih dibaca untuk kompatibilitas. `openclaw doctor --fix` memigrasikannya ke `dmPolicy` dan `allowFrom` jika dapat dilakukan tanpa mengubah akses.

    Penyandingan dalam DM menggunakan `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kebijakan kanal">
    `channels.slack.groupPolicy` mengontrol penanganan kanal:

    - `open`
    - `allowlist`
    - `disabled`

    Daftar kanal yang diizinkan berada di bawah `channels.slack.channels` dan **harus menggunakan ID kanal Slack yang stabil** (misalnya `C12345678`) sebagai kunci konfigurasi.

    Catatan runtime: jika `channels.slack` sama sekali tidak ada (penyiapan hanya-env), runtime menggunakan fallback `groupPolicy="allowlist"` dan mencatat peringatan (meskipun `channels.defaults.groupPolicy` ditetapkan).

    Resolusi nama/ID:

    - entri daftar kanal yang diizinkan dan entri daftar DM yang diizinkan diuraikan saat startup ketika akses token mengizinkannya
    - entri nama kanal yang tidak terurai dipertahankan sesuai konfigurasi, tetapi secara bawaan diabaikan untuk perutean
    - otorisasi masuk dan perutean kanal secara bawaan mengutamakan ID; pencocokan langsung nama pengguna/slug memerlukan `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Kunci berbasis nama (`#channel-name` atau `channel-name`) **tidak** cocok di bawah `groupPolicy: "allowlist"`. Pencarian kanal secara bawaan mengutamakan ID, sehingga kunci berbasis nama tidak akan pernah berhasil dirutekan dan semua pesan dalam kanal tersebut akan diblokir tanpa pemberitahuan. Hal ini berbeda dari `groupPolicy: "open"`, karena kunci kanal tidak diperlukan untuk perutean dan kunci berbasis nama tampak berfungsi.

    Selalu gunakan ID kanal Slack sebagai kunci. Untuk menemukannya: klik kanan kanal di Slack → **Copy link** — ID (`C...`) muncul di akhir URL.

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

    Salah (diblokir tanpa pemberitahuan di bawah `groupPolicy: "allowlist"`):

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

  <Tab title="Sebutan dan pengguna kanal">
    Pesan kanal secara bawaan dibatasi oleh sebutan.

    Sumber sebutan:

    - sebutan aplikasi eksplisit (`<@botId>`)
    - sebutan grup pengguna Slack (`<!subteam^S...>`) ketika pengguna bot merupakan anggota grup pengguna tersebut; memerlukan `usergroups:read`
    - pola regex sebutan (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku implisit utas balasan-ke-bot (dinonaktifkan ketika `thread.requireExplicitMention` adalah `true`)

    Kontrol per kanal (`channels.slack.channels.<id>`; nama hanya melalui resolusi startup atau `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; menggantikan mode balasan akun/jenis obrolan untuk kanal ini)
    - `users` (daftar yang diizinkan)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format kunci `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:`, atau wildcard `"*"`
      (kunci tanpa prefiks warisan tetap hanya dipetakan ke `id:`)

    `ignoreOtherMentions` (default `false`) menghapus pesan channel yang menyebut pengguna atau grup pengguna lain, tetapi tidak menyebut bot ini. DM dan DM grup (MPIM) tidak terpengaruh. Filter ini memerlukan ID pengguna bot yang berhasil diidentifikasi dari `auth.test`; jika identitas tersebut tidak tersedia (misalnya identitas yang hanya menggunakan token pengguna), gerbang akan terbuka saat gagal dan pesan diteruskan tanpa perubahan.

    `allowBots` bersifat konservatif untuk channel dan channel privat: pesan ruang yang dibuat bot hanya diterima jika bot pengirim tercantum secara eksplisit dalam daftar yang diizinkan `users` milik ruang tersebut, atau jika setidaknya satu ID pemilik Slack eksplisit dari `channels.slack.allowFrom` saat ini menjadi anggota ruang. Wildcard dan entri pemilik berupa nama tampilan tidak memenuhi persyaratan keberadaan pemilik. Keberadaan pemilik menggunakan `conversations.members` Slack; pastikan aplikasi memiliki cakupan baca yang sesuai untuk jenis ruang tersebut (`channels:read` untuk channel publik, `groups:read` untuk channel privat). Jika pencarian anggota gagal, OpenClaw menghapus pesan ruang yang dibuat bot tersebut.

    Pesan Slack yang dibuat bot dan diterima menggunakan [perlindungan perulangan bot](/id/channels/bot-loop-protection) bersama. Konfigurasikan `channels.defaults.botLoopProtection` untuk batas default, lalu timpa dengan `channels.slack.botLoopProtection` atau `channels.slack.channels.<id>.botLoopProtection` jika ruang kerja atau channel memerlukan batas yang berbeda.

  </Tab>
</Tabs>

## Thread, sesi, dan tag balasan

- DM dirutekan sebagai `direct`; channel sebagai `channel`; MPIM sebagai `group`.
- Pengikatan rute Slack menerima ID peer mentah serta bentuk target Slack seperti `channel:C12345678`, `user:U12345678`, dan `<@U12345678>`.
- Dengan `session.dmScope=main` default, DM Slack digabungkan ke sesi utama agen.
- Sesi channel: `agent:<agentId>:slack:channel:<channelId>`.
- Pesan tingkat teratas biasa di channel tetap berada pada sesi per channel, bahkan saat `replyToMode` bukan `off`.
- Balasan thread Slack menggunakan `thread_ts` Slack induk untuk sufiks sesi (`:thread:<threadTs>`), bahkan saat thread balasan keluar dinonaktifkan dengan `replyToMode="off"`.
- OpenClaw menanamkan akar channel tingkat teratas yang memenuhi syarat ke `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` saat akar tersebut diperkirakan memulai thread Slack yang terlihat, sehingga akar dan balasan thread berikutnya berbagi satu sesi OpenClaw. Ini berlaku untuk peristiwa `app_mention`, kecocokan eksplisit dengan bot atau pola penyebutan yang dikonfigurasi, serta channel `requireMention: false` dengan `replyToMode` non-`off`.
- Default `channels.slack.thread.historyScope` adalah `thread`; default `thread.inheritParent` adalah `false`.
- `channels.slack.thread.initialHistoryLimit` mengontrol jumlah pesan thread yang sudah ada dan diambil saat sesi thread baru dimulai (default `20`; atur ke `0` untuk menonaktifkan).
- `channels.slack.thread.requireExplicitMention` (default `false`): saat `true`, cegah penyebutan thread implisit agar bot hanya merespons penyebutan eksplisit `@bot` di dalam thread, bahkan jika bot sudah berpartisipasi dalam thread tersebut. Tanpa ini, balasan dalam thread yang diikuti bot melewati pembatasan `requireMention`.

Kontrol thread balasan:

- `channels.slack.channels.<id>.replyToMode`: penimpaan per channel untuk pesan channel/channel privat Slack
- `channels.slack.replyToMode`: `off|first|all|batched` (default `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback lama untuk percakapan langsung: `channels.slack.dm.replyToMode`

Tag balasan manual didukung:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Untuk balasan thread Slack eksplisit dari alat `message`, atur `replyBroadcast: true` dengan `action: "send"` dan `threadId` atau `replyTo` untuk meminta Slack menyiarkan balasan thread tersebut juga ke channel induk. Ini dipetakan ke flag `reply_broadcast` pada `chat.postMessage` Slack dan hanya didukung untuk pengiriman teks atau Block Kit, bukan unggahan media.

Saat panggilan alat `message` berjalan di dalam thread Slack dan menargetkan channel yang sama, OpenClaw biasanya mewarisi thread Slack saat ini sesuai `replyToMode` efektif pada akun, jenis percakapan, atau per channel. Balasan otomatis dan panggilan `send` atau `upload-file` pada channel yang sama menggunakan penimpaan per channel yang sama. Atur `topLevel: true` pada `action: "send"` atau `action: "upload-file"` untuk memaksa pesan channel induk baru. `threadId: null` diterima sebagai opsi keluar tingkat teratas yang sama.

<Note>
`replyToMode="off"` menonaktifkan thread balasan Slack keluar, termasuk tag `[[reply_to_*]]` eksplisit. Ini tidak meratakan sesi thread Slack masuk: pesan yang sudah diposting di dalam thread Slack tetap dirutekan ke sesi `:thread:<threadTs>`. Ini berbeda dari Telegram, tempat tag eksplisit tetap dipatuhi dalam mode `"off"`. Thread Slack menyembunyikan pesan dari channel, sedangkan balasan Telegram tetap terlihat sebaris.
</Note>

## Reaksi konfirmasi

`ackReaction` mengirim emoji konfirmasi saat OpenClaw memproses pesan masuk. `ackReactionScope` menentukan _kapan_ emoji tersebut benar-benar dikirim.

Secara default, konfirmasi tetap statis sementara status thread asisten native Slack menampilkan progres dengan pesan pemuatan bergilir. Atur `messages.statusReactions.enabled: true` untuk mengaktifkan siklus reaksi antre/berpikir/alat/selesai/kesalahan.

### Emoji (`ackReaction`)

Urutan resolusi:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada gunakan `"eyes"` / 👀)

Catatan:

- Slack mengharapkan kode pendek (misalnya `"eyes"`).
- Gunakan `""` untuk menonaktifkan reaksi bagi akun Slack atau secara global.

### Cakupan (`messages.ackReactionScope`)

Penyedia Slack membaca cakupan dari `messages.ackReactionScope` (default `"group-mentions"`). Saat ini tidak ada penimpaan tingkat akun Slack atau channel Slack; nilainya bersifat global untuk Gateway.

Nilai:

- `"all"`: berikan reaksi di DM dan grup, termasuk peristiwa ruang ambien.
- `"direct"`: berikan reaksi hanya di DM.
- `"group-all"`: berikan reaksi pada setiap pesan grup kecuali peristiwa ruang ambien (tanpa DM).
- `"group-mentions"` (default): berikan reaksi di grup, tetapi hanya saat bot disebut (atau dalam entitas grup yang dapat disebut dan telah mengaktifkannya). **DM tidak disertakan.**
- `"off"` / `"none"`: jangan pernah memberikan reaksi.

<Note>
Cakupan default (`"group-mentions"`) tidak memicu reaksi konfirmasi dalam pesan langsung atau peristiwa ruang ambien. Untuk melihat `ackReaction` yang dikonfigurasi (misalnya `"eyes"`) pada DM Slack masuk dan peristiwa ruang tanpa aktivitas, atur `messages.ackReactionScope` ke `"all"`. `messages.ackReactionScope` dibaca saat penyedia Slack dimulai, sehingga Gateway perlu dimulai ulang agar perubahan diterapkan.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // berikan reaksi di DM dan grup
  },
}
```

## Streaming teks

`channels.slack.streaming` mengontrol perilaku pratinjau langsung:

- `off`: nonaktifkan streaming pratinjau langsung.
- `partial` (default): ganti teks pratinjau dengan keluaran parsial terbaru.
- `block`: tambahkan pembaruan pratinjau yang dibagi menjadi potongan.
- `progress`: tampilkan teks status progres saat menghasilkan, lalu kirim teks akhir.
- `streaming.preview.toolProgress`: saat pratinjau draf aktif, rutekan pembaruan alat/progres ke pesan pratinjau yang diedit tersebut (default: `true`). Atur `false` untuk mempertahankan pesan alat/progres terpisah.
- `streaming.preview.commandText` / `streaming.progress.commandText`: atur ke `status` untuk mempertahankan baris progres alat yang ringkas sekaligus menyembunyikan teks perintah/eksekusi mentah (default: `raw`).

Sembunyikan teks perintah/eksekusi mentah sambil mempertahankan baris progres ringkas:

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

`channels.slack.streaming.nativeTransport` mengontrol streaming teks native Slack saat `channels.slack.streaming.mode` adalah `partial` (default: `true`).

Kartu tugas progres native Slack bersifat opsional untuk mode progres. Atur `channels.slack.streaming.progress.nativeTaskCards` ke `true` dengan `channels.slack.streaming.mode="progress"` untuk mengirim kartu rencana/tugas native Slack saat pekerjaan berjalan, lalu memperbarui kartu tugas yang sama setelah selesai. Tanpa flag ini, mode progres mempertahankan perilaku pratinjau draf portabel.

- Thread balasan harus tersedia agar streaming teks native dan status thread asisten Slack muncul. Pemilihan thread tetap mengikuti `replyToMode`.
- Akar channel, percakapan grup, dan DM tingkat teratas tetap dapat menggunakan pratinjau draf normal saat streaming native tidak tersedia atau tidak ada thread balasan.
- DM Slack tingkat teratas secara default tetap berada di luar thread, sehingga tidak menampilkan pratinjau streaming/status native bergaya thread Slack; sebagai gantinya, OpenClaw memposting dan mengedit pratinjau draf di DM.
- Media dan muatan nonteks menggunakan fallback ke pengiriman normal.
- Hasil akhir media/kesalahan membatalkan pengeditan pratinjau yang tertunda; hasil akhir teks/blok yang memenuhi syarat hanya diselesaikan jika dapat mengedit pratinjau secara langsung.
- Jika streaming gagal di tengah balasan, OpenClaw menggunakan fallback ke pengiriman normal untuk muatan yang tersisa.

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

Aktifkan kartu tugas progres native Slack:

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
- Alias lama tidak dibaca saat runtime; jalankan `openclaw doctor --fix` untuk menulis ulang konfigurasi streaming Slack yang tersimpan agar menggunakan kunci kanonis.

## Fallback reaksi mengetik

`typingReaction` menambahkan reaksi sementara pada pesan Slack masuk saat OpenClaw memproses balasan, lalu menghapusnya saat proses selesai. Ini paling berguna di luar balasan thread, yang menggunakan indikator status default "sedang mengetik...".

Urutan resolusi:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Catatan:

- Slack mengharapkan kode pendek (misalnya `"hourglass_flowing_sand"`).
- Reaksi bersifat upaya terbaik dan pembersihan dicoba secara otomatis setelah jalur balasan atau kegagalan selesai.

## Input suara

Untuk berbicara dengan OpenClaw di Slack saat ini, kirim klip audio Slack ke aplikasi OpenClaw. Mikrofon dikte Slackbot adalah fitur terpisah milik Slack, bukan API aplikasi.

- **[Dikte suara Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** berada di dalam percakapan Slackbot pribadi pengguna. Slack mengubah rekaman menjadi perintah Slackbot, tetapi tidak mengirimkan berkas audio, peristiwa dikte, perintah, atau penanda sumber input kepada aplikasi Slack pihak ketiga melalui Events API. Plugin Slack OpenClaw tidak dapat mengaktifkan atau menerimanya.
- **[Klip audio Slack](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** adalah berkas Slack tersimpan yang dapat diposting dalam DM, kanal, atau utas OpenClaw. OpenClaw mengunduh klip yang dapat diakses menggunakan token bot, menormalkan metadata MIME klip Slack, dan mengirimkannya melalui [alur transkripsi audio](/id/nodes/audio) bersama. Manifes aplikasi yang direkomendasikan mencakup cakupan `files:read` yang diperlukan.

Klip audio dan dikte Slackbot memiliki semantik privasi yang berbeda: klip mengikuti kebijakan retensi berkas Slack dan OpenClaw mengunduhnya untuk transkripsi, sedangkan menurut Slack, audio dikte tidak disimpan.

Dalam kanal dengan `requireMention: true`, klip audio tanpa keterangan dapat memenuhi gerbang dengan mengucapkan pola penyebutan yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, dengan fallback ke `messages.groupChat.mentionPatterns`). OpenClaw mengotorisasi pengirim sebelum mengunduh atau mentranskripsikan klip, lalu menerimanya hanya jika transkrip cocok. Transkrip spekulatif yang gagal atau tidak cocok akan dibuang bersama klip yang diunduh; transkrip tersebut tidak disimpan dalam riwayat kanal. Identitas `@bot` Slack native tidak dapat disimpulkan dari ucapan, jadi konfigurasikan pola nama yang diucapkan atau sertakan penyebutan tertulis. Jika penggemaan transkrip diaktifkan, gema hanya dikirim setelah penerimaan.

## Media, pemenggalan, dan pengiriman

<AccordionGroup>
  <Accordion title="Lampiran masuk">
    Lampiran berkas Slack diunduh dari URL privat yang dihosting Slack (alur permintaan yang diautentikasi dengan token) dan ditulis ke penyimpanan media saat pengambilan berhasil dan batas ukuran mengizinkannya. Placeholder berkas menyertakan `fileId` Slack agar agen dapat mengambil berkas asli dengan `download-file`.

    Pengunduhan menggunakan batas waktu idle dan total yang dibatasi. Jika pengambilan berkas Slack macet atau gagal, OpenClaw tetap memproses pesan dan menggunakan placeholder berkas sebagai fallback.

    Batas ukuran masuk runtime secara default adalah `20MB`, kecuali diganti oleh `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Teks dan berkas keluar">
    - potongan teks menggunakan `channels.slack.textChunkLimit` (default `8000`, dibatasi hingga batas panjang pesan Slack sendiri)
    - `channels.slack.streaming.chunkMode="newline"` mengaktifkan pemisahan yang memprioritaskan paragraf
    - pengiriman berkas menggunakan API unggah Slack dan dapat menyertakan balasan utas (`thread_ts`)
    - keterangan berkas yang panjang menggunakan potongan teks pertama yang aman untuk Slack sebagai komentar unggahan dan mengirimkan potongan sisanya sebagai pesan tindak lanjut
    - batas media keluar mengikuti `channels.slack.mediaMaxMb` saat dikonfigurasi; jika tidak, pengiriman kanal menggunakan default jenis MIME dari alur media

  </Accordion>

  <Accordion title="Target pengiriman">
    Target eksplisit yang disarankan:

    - `user:<id>` untuk DM
    - `channel:<id>` untuk kanal

    DM Slack yang hanya berisi teks/blok dapat diposting langsung ke ID pengguna; unggahan berkas dan pengiriman berutas terlebih dahulu membuka DM melalui API percakapan Slack karena jalur tersebut memerlukan ID percakapan konkret.

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

- Mode otomatis perintah native **nonaktif** untuk Slack sehingga `commands.native: "auto"` tidak mengaktifkan perintah native Slack.

```txt
/help
```

Menu argumen native dirender sebagai salah satu opsi berikut, berdasarkan urutan prioritas:

- 3-5 opsi yang cukup pendek: menu luapan ("...")
- lebih dari 100 opsi, dengan pemfilteran opsi asinkron tersedia: pilihan eksternal
- 1-2 opsi, atau opsi apa pun yang nilai terenkodenya terlalu panjang untuk pilihan: blok tombol
- selain itu (6-100 opsi, atau lebih dari 100 tanpa pemfilteran asinkron): menu pilihan statis, dipenggal menjadi 100 opsi per menu

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
- setiap seri harus berisi satu nilai terbatas untuk setiap kategori; nilai nonlingkaran
  boleh negatif

Setiap bagan native juga membawa representasi teks tingkat atas untuk pembaca
layar, notifikasi, pencerminan sesi, dan klien yang tidak dapat merender
blok. Pengiriman presentasi standar ke kanal OpenClaw lain menerima data bagan
deterministik yang sama sebagai teks, kecuali kanal tersebut menyatakan dukungan bagan native. Jika
Slack menolak bagan dengan `invalid_blocks` selama peluncuran bertahap, OpenClaw
menghapus blok data native yang ditolak, mempertahankan kontrol sejawat, dan mengirimkan
representasi bagan lengkap sebagai teks yang terlihat.

Saat ini Slack menerima hingga dua blok `data_visualization` per pesan. Jika
sebuah presentasi berisi lebih dari dua bagan yang valid, OpenClaw mempertahankan urutannya
dan melanjutkan perenderan native dalam pesan tindak lanjut, dengan tidak lebih dari dua
bagan dalam setiap pesan.

[Peluncuran pengembang](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/) Slack
mendokumentasikan blok tersebut sebagai fitur Block Kit yang ditujukan untuk aplikasi dan tidak memublikasikan
pembatasan paket berbayar. Pernyataan kelayakan Business+/Enterprise berlaku untuk
pembuatan bagan AI otomatis Slackbot, yang terpisah dari aplikasi yang mengirimkan
bagan Block Kit yang telah terstruktur. Bagan adalah blok khusus pesan, bukan konten App
Home, modal, atau Canvas.

## Tabel native

[Blok Block Kit `data_table`](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/) Slack saat ini
merender baris dan kolom terstruktur dalam pesan. OpenClaw memetakan blok
`presentation` `table` portabel eksplisit ke `data_table`; OpenClaw tidak menggunakan
[blok `table`](https://docs.slack.dev/reference/block-kit/blocks/table-block/) lama Slack.
Tidak diperlukan cakupan OAuth tambahan atau konfigurasi Slack selain akses pesan
`chat:write` normal.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Alur terbuka",
      "headers": ["Akun", "Tahap", "ARR"],
      "rows": [
        ["Acme", "Berhasil", 125000],
        ["Globex", "Peninjauan", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw memetakan sel header dan string ke sel `raw_text` Slack. Sel numerik
dipetakan ke `raw_number`, dengan nilai numerik terbatas dipertahankan untuk pengurutan
dan pemfilteran native. `rowHeaderColumnIndex`, jika ada, menandai kolom berbasis nol
tersebut sebagai header baris Slack.

Batas `data_table` yang dipublikasikan Slack diberlakukan sebelum perenderan native:

- 1-20 kolom
- 1-100 baris data, ditambah baris header
- jumlah sel yang sama di setiap baris
- maksimal 10.000 karakter agregat di seluruh sel tabel dalam satu pesan

Beberapa blok tabel yang valid dapat dirender secara native selama pesan tetap
berada dalam batas karakter agregat. Tabel yang tidak dapat dirender dalam
batas native menjadi teks deterministik lengkap, alih-alih kehilangan baris atau
sel. Jika teks tersebut melebihi satu pesan Slack, pengiriman dan respons garis miring menggunakan
potongan teks berurutan. Pengeditan tabel gagal dengan kesalahan ukuran eksplisit, alih-alih
memotong baris dari pesan yang ada secara diam-diam.

Setiap tabel native yang dihasilkan dari presentasi portabel juga membawa representasi
teks tingkat atas untuk pembaca layar, notifikasi, pencerminan sesi, dan
klien yang tidak dapat merender blok. Nilai mentah bagan dan tabel tetap literal
dalam fallback, sehingga data sel seperti `<@U123>` tidak menjadi penyebutan Slack.
Jika Slack menolak blok bagan atau tabel native dengan `invalid_blocks`, OpenClaw
menghapus setiap blok data native dalam satu langkah pemulihan terbatas, mempertahankan
blok sejawat yang valid seperti tombol dan pilihan, serta mengirimkan teks bagan
dan tabel lengkap yang terlihat dengan pemformatan Slack dinonaktifkan. Pengiriman perintah garis miring
melacak anggaran lima panggilan `response_url` Slack di seluruh perintah. Sebelum setiap
kelompok balasan, OpenClaw memilih rencana lengkap yang sesuai dengan sisa panggilan atau gagal
sebelum memposting kelompok tersebut.

Hanya blok tabel `presentation` eksplisit yang dipromosikan menjadi tabel native.
Tabel pipa Markdown tetap sebagai teks yang ditulis; OpenClaw tidak menebak struktur tabel
atau jenis sel. Produsen native Slack tepercaya yang sudah ada dapat terus
meneruskan blok mentah melalui `channelData.slack.blocks`; OpenClaw memperoleh teks
fallback dari sel `data_table` mentah yang valid, sementara blok khusus yang cacat dapat
terdegradasi menjadi keterangannya atau fallback Block Kit umum. Output agen, CLI,
dan plugin portabel harus menggunakan `presentation`.

## Balasan interaktif

Slack dapat merender kontrol balasan interaktif yang ditulis agen, tetapi fitur ini dinonaktifkan secara default.
Untuk output agen, CLI, dan plugin baru, utamakan tombol atau blok pilihan
`presentation` bersama. Kontrol tersebut menggunakan jalur interaksi Slack
yang sama sekaligus dapat terdegradasi di kanal lain.

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

Saat diaktifkan, agen masih dapat mengeluarkan direktif balasan khusus Slack yang tidak lagi dianjurkan:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Direktif ini dikompilasi menjadi Slack Block Kit dan merutekan klik atau pilihan
kembali melalui jalur peristiwa interaksi Slack yang sudah ada. Pertahankan direktif tersebut untuk perintah
lama dan mekanisme khusus Slack; gunakan presentasi bersama untuk kontrol
portabel baru.

API kompilator direktif juga tidak lagi dianjurkan untuk kode produsen baru:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Gunakan payload `presentation` dan `buildSlackPresentationBlocks(...)` untuk kontrol baru
yang dirender Slack.

Catatan:

- Ini adalah UI lama khusus Slack. Saluran lain tidak menerjemahkan direktif Slack Block
  Kit ke dalam sistem tombolnya sendiri.
- Nilai callback interaktif adalah token buram yang dibuat OpenClaw, bukan nilai mentah yang ditulis agen.
- Jika blok interaktif yang dibuat akan melampaui batas Slack Block Kit, OpenClaw kembali menggunakan balasan teks asli alih-alih mengirim payload blok yang tidak valid.

### Pengiriman modal milik Plugin

Plugin Slack yang mendaftarkan penangan interaktif juga dapat menerima peristiwa siklus hidup modal
`view_submission` dan `view_closed` sebelum OpenClaw memadatkan
payload untuk peristiwa sistem yang terlihat oleh agen. Gunakan salah satu pola perutean
berikut saat membuka modal Slack:

- Tetapkan `callback_id` ke `openclaw:<namespace>:<payload>`.
- Atau pertahankan `callback_id` yang sudah ada dan masukkan `pluginInteractiveData:
"<namespace>:<payload>"` ke dalam `private_metadata` modal.

Penangan menerima `ctx.interaction.kind` sebagai `view_submission` atau
`view_closed`, `inputs` yang dinormalisasi, dan objek mentah lengkap `stateValues` dari
Slack. Perutean yang hanya menggunakan ID callback sudah cukup untuk memanggil penangan Plugin; sertakan
bidang perutean pengguna/sesi `private_metadata` dari modal yang sudah ada jika
modal tersebut juga harus menghasilkan peristiwa sistem yang terlihat oleh agen. Agen menerima
peristiwa sistem `Slack interaction: ...` yang ringkas dan telah disunting. Jika penangan mengembalikan
`systemEvent.summary`, `systemEvent.reference`, atau `systemEvent.data`,
bidang tersebut disertakan dalam peristiwa ringkas itu agar agen dapat merujuk
penyimpanan milik Plugin tanpa melihat payload formulir lengkap.

## Persetujuan native di Slack

Slack dapat bertindak sebagai klien persetujuan native dengan tombol dan interaksi interaktif, alih-alih kembali menggunakan UI Web atau terminal.

- Persetujuan eksekusi dan Plugin dapat dirender sebagai prompt Block Kit native Slack.
- `channels.slack.execApprovals.*` tetap menjadi konfigurasi pengaktifan klien persetujuan eksekusi native serta perutean DM/saluran.
- DM persetujuan eksekusi menggunakan `channels.slack.execApprovals.approvers` atau `commands.ownerAllowFrom`.
- Persetujuan Plugin menggunakan tombol native Slack saat Slack diaktifkan sebagai klien persetujuan native untuk sesi asal, atau saat `approvals.plugin` merutekan ke sesi Slack asal atau target Slack.
- DM persetujuan Plugin menggunakan pemberi persetujuan Plugin Slack dari `channels.slack.allowFrom`, `allowFrom` akun bernama, atau rute default akun.
- Otorisasi pemberi persetujuan tetap diberlakukan: pemberi persetujuan khusus eksekusi tidak dapat menyetujui permintaan Plugin kecuali mereka juga merupakan pemberi persetujuan Plugin.

Ini menggunakan permukaan tombol persetujuan bersama yang sama seperti saluran lain. Saat `interactivity` diaktifkan dalam pengaturan aplikasi Slack Anda, prompt persetujuan dirender sebagai tombol Block Kit langsung dalam percakapan.
Saat tombol tersebut tersedia, tombol itu menjadi UX persetujuan utama; OpenClaw
hanya boleh menyertakan perintah manual `/approve` saat hasil alat menyatakan bahwa
persetujuan melalui obrolan tidak tersedia atau persetujuan manual merupakan satu-satunya jalur.

Jalur konfigurasi:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opsional; kembali menggunakan `commands.ownerAllowFrom` jika memungkinkan)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `agentFilter`, `sessionFilter`

Slack otomatis mengaktifkan persetujuan eksekusi native saat `enabled` tidak ditetapkan atau bernilai `"auto"` dan setidaknya satu
pemberi persetujuan eksekusi berhasil ditentukan. Slack juga dapat menangani persetujuan Plugin native melalui jalur
klien native ini saat pemberi persetujuan Plugin Slack berhasil ditentukan dan permintaan cocok dengan filter klien native. Tetapkan
`enabled: false` untuk secara eksplisit menonaktifkan Slack sebagai klien persetujuan native. Tetapkan `enabled: true` untuk
memaksa persetujuan native aktif saat pemberi persetujuan berhasil ditentukan. Menonaktifkan persetujuan eksekusi Slack tidak menonaktifkan
pengiriman persetujuan Plugin native Slack yang diaktifkan melalui `approvals.plugin`; pengiriman persetujuan Plugin
menggunakan pemberi persetujuan Plugin Slack sebagai gantinya.

Perilaku default tanpa konfigurasi persetujuan eksekusi Slack yang eksplisit:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Konfigurasi native Slack yang eksplisit hanya diperlukan saat Anda ingin mengganti pemberi persetujuan, menambahkan filter, atau
mengaktifkan pengiriman ke obrolan asal:

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
dirutekan ke obrolan lain atau target luar jalur yang eksplisit. Penerusan `approvals.plugin` bersama juga
bersifat terpisah; pengiriman native Slack hanya menekan fallback tersebut saat Slack dapat menangani permintaan
persetujuan Plugin secara native.

`/approve` dalam obrolan yang sama juga berfungsi di saluran dan DM Slack yang sudah mendukung perintah. Lihat [Persetujuan eksekusi](/id/tools/exec-approvals) untuk model penerusan persetujuan lengkap.

## Peristiwa dan perilaku operasional

- Pengeditan/penghapusan pesan dipetakan menjadi peristiwa sistem.
- Siaran utas (balasan utas "Also send to channel") diproses sebagai pesan pengguna biasa.
- Peristiwa penambahan/penghapusan reaksi dipetakan menjadi peristiwa sistem.
- Peristiwa anggota bergabung/keluar, saluran dibuat/diubah namanya, serta pin ditambahkan/dihapus dipetakan menjadi peristiwa sistem.
- Polling kehadiran opsional dapat memetakan transisi `away` ke `active` milik peserta manusia yang diamati ke sesi Slack peserta tersebut yang memenuhi syarat dan paling baru aktif. Secara default fitur ini nonaktif.
- `channel_id_changed` dapat memigrasikan kunci konfigurasi saluran saat `configWrites` diaktifkan.
- Metadata topik/tujuan saluran diperlakukan sebagai konteks yang tidak tepercaya dan dapat disuntikkan ke dalam konteks perutean.
- Pemulai utas dan penyemaian konteks riwayat awal utas difilter berdasarkan daftar izin pengirim yang dikonfigurasi jika berlaku.
- Tindakan blok, pintasan, dan interaksi modal memancarkan peristiwa sistem `Slack interaction: ...` terstruktur dengan bidang payload yang kaya:
  - tindakan blok: nilai yang dipilih, label, nilai pemilih, dan metadata `workflow_*`
  - pintasan global: metadata callback dan pelaku, dirutekan ke sesi langsung pelaku
  - pintasan pesan: konteks callback, pelaku, saluran, utas, dan pesan yang dipilih
  - peristiwa modal `view_submission` dan `view_closed` dengan metadata saluran yang dirutekan dan input formulir

Tentukan pintasan global atau pesan dalam konfigurasi aplikasi Slack Anda dan gunakan ID callback apa pun yang tidak kosong. OpenClaw mengakui payload pintasan yang cocok, menerapkan kebijakan pengirim DM/saluran yang sama seperti interaksi Slack lainnya, dan memasukkan peristiwa yang telah disanitasi ke antrean sesi agen yang dirutekan. ID pemicu dan URL respons disunting dari konteks agen.

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

- `off` (default): tanpa pengatur waktu kehadiran atau panggilan Slack API.
- `auto`: pantau DM, MPIM, dan utas Slack yang aktif dalam 24 jam terakhir dengan maksimal 8 peserta manusia yang diamati. Sesi saluran tingkat atas dikecualikan.
- `on`: pantau percakapan yang sama tanpa batas peserta dan sertakan sesi saluran tingkat atas. Gunakan penggantian per saluran untuk memaksa atau menekan satu saluran.

OpenClaw melakukan polling terhadap maksimal 45 pengguna unik per menit per akun Slack, menyemai hasil pertama tanpa membangunkan agen, dan hanya membangunkan saat mengamati transisi `away` ke `active`. Masa tunggu tetap selama 8 jam berlaku per akun dan pengguna Slack, meskipun orang tersebut berpartisipasi dalam beberapa utas. Peristiwa hanya dirutekan ke percakapan orang tersebut yang memenuhi syarat dan paling baru aktif serta meminta agen memeriksa memori/wiki dan konteks zona waktu yang diketahui sebelum memutuskan apakah akan mengirim satu sapaan singkat. Agen dapat tetap diam.

Token bot memerlukan `users:read`, yang sudah disertakan dalam manifes yang direkomendasikan. Peristiwa kehadiran tidak tersedia untuk penginstalan seluruh organisasi Enterprise Grid.

## Referensi konfigurasi

Referensi utama: [Referensi konfigurasi - Slack](/id/gateway/config-channels#slack).

<Accordion title="Bidang Slack berindikasi kuat">

- mode/autentikasi: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- akses DM: `dm.enabled`, `dmPolicy`, `allowFrom` (lama: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- sakelar kompatibilitas: `dangerouslyAllowNameMatching` (darurat; biarkan nonaktif kecuali diperlukan)
- akses saluran: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- utas/riwayat: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- pembangunan melalui kehadiran: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; default `off`)
- pengiriman: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- pratinjau: `unfurlLinks` (default: `false`), `unfurlMedia` untuk kontrol pratinjau tautan/media `chat.postMessage`; tetapkan `unfurlLinks: true` untuk mengaktifkan kembali pratinjau tautan
- operasi/fitur: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada balasan di saluran">
    Periksa secara berurutan:

    - `groupPolicy`
    - daftar izin saluran (`channels.slack.channels`) — **kunci harus berupa ID saluran** (`C12345678`), bukan nama (`#channel-name`). Kunci berbasis nama gagal tanpa pemberitahuan di bawah `groupPolicy: "allowlist"` karena perutean saluran secara default mengutamakan ID. Untuk menemukan ID: klik kanan saluran di Slack → **Copy link** — nilai `C...` di akhir URL adalah ID saluran.
    - `requireMention`
    - daftar izin `users` per saluran
    - `messages.groupChat.visibleReplies`: permintaan grup/saluran normal secara default menggunakan `"automatic"`. Jika Anda mengaktifkan `"message_tool"` dan log menampilkan teks asisten tanpa panggilan `message(action=send)`, model melewatkan jalur alat pesan yang terlihat. Teks akhir tetap privat dalam mode ini; periksa log verbose Gateway untuk metadata payload yang ditekan, atau tetapkan ke `"automatic"` jika Anda ingin setiap balasan akhir asisten normal dikirim melalui jalur lama.
    - `messages.groupChat.unmentionedInbound`: jika nilainya `"room_event"`, percakapan saluran yang diizinkan tetapi tidak menyebut agen menjadi konteks sekitar dan tetap diam kecuali agen memanggil alat `message`. Lihat [Peristiwa ruang sekitar](/id/channels/ambient-room-events).

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
    - persetujuan pemasangan / entri daftar izin (`dmPolicy: "open"` masih memerlukan `channels.slack.allowFrom: ["*"]`)
    - DM grup menggunakan penanganan MPIM; aktifkan `channels.slack.dm.groupEnabled` dan, jika dikonfigurasi, sertakan MPIM dalam `channels.slack.dm.groupChannels`
    - Peristiwa DM Slack Assistant: log verbose yang menyebut `drop message_changed`
      biasanya berarti Slack mengirim peristiwa utas Assistant yang diedit tanpa
      pengirim manusia yang dapat dipulihkan dalam metadata pesan

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Mode Socket tidak terhubung">
    Validasi token bot + aplikasi dan pengaktifan Socket Mode di pengaturan aplikasi Slack.
    App-Level Token memerlukan `connections:write`, dan token bot Bot User OAuth Token
    harus berasal dari aplikasi/ruang kerja Slack yang sama dengan token aplikasi.

    Jika `openclaw channels status --probe --json` menampilkan `botTokenStatus` atau
    `appTokenStatus: "configured_unavailable"`, akun Slack telah
    dikonfigurasi, tetapi runtime saat ini tidak dapat menyelesaikan nilai
    yang didukung SecretRef.

    Log seperti `slack socket mode failed to start; retry ...` adalah kegagalan
    awal yang dapat dipulihkan. Cakupan yang hilang, token yang dicabut, dan autentikasi yang tidak valid langsung
    menggagalkan proses. Log `slack token mismatch ...` berarti token bot dan token aplikasi
    tampaknya berasal dari aplikasi Slack yang berbeda; perbaiki kredensial aplikasi Slack.

  </Accordion>

  <Accordion title="Mode HTTP tidak menerima peristiwa">
    Validasi:

    - rahasia penandatanganan
    - jalur Webhook
    - URL Permintaan Slack (Peristiwa + Interaktivitas + Perintah Garis Miring)
    - `webhookPath` unik per akun HTTP
    - URL publik menghentikan TLS dan meneruskan permintaan ke jalur Gateway
    - jalur `request_url` aplikasi Slack sama persis dengan `channels.slack.webhookPath` (default `/slack/events`)

    Jika `signingSecretStatus: "configured_unavailable"` muncul dalam snapshot akun,
    akun HTTP telah dikonfigurasi, tetapi runtime saat ini tidak dapat
    menyelesaikan rahasia penandatanganan yang didukung SecretRef.

    Log `slack: webhook path ... already registered` yang berulang berarti dua akun HTTP
    menggunakan `webhookPath` yang sama; berikan jalur yang berbeda untuk setiap akun.

  </Accordion>

  <Accordion title="Perintah native/garis miring tidak dijalankan">
    Verifikasi apakah yang dimaksud adalah:

    - mode perintah native (`channels.slack.commands.native: true`) dengan perintah garis miring yang sesuai dan terdaftar di Slack
    - atau mode perintah garis miring tunggal (`channels.slack.slashCommand.enabled: true`)

    Slack tidak membuat atau menghapus perintah garis miring secara otomatis. `commands.native: "auto"` tidak mengaktifkan perintah native Slack; gunakan `true` dan buat perintah yang sesuai di aplikasi Slack. Dalam mode HTTP, setiap perintah garis miring Slack harus menyertakan URL Gateway. Dalam Socket Mode, payload perintah tiba melalui websocket dan Slack mengabaikan `slash_commands[].url`.

    Periksa juga `commands.useAccessGroups`, otorisasi DM, daftar izin kanal,
    dan daftar izin `users` per kanal. Slack mengembalikan galat sementara bagi
    pengirim perintah garis miring yang diblokir, termasuk:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referensi media lampiran

Slack dapat melampirkan media yang diunduh ke giliran agen ketika pengunduhan berkas Slack berhasil dan batas ukuran mengizinkan. Klip audio dapat ditranskripsikan, berkas gambar dapat diteruskan melalui jalur pemahaman media atau langsung ke model balasan yang mendukung penglihatan, dan berkas lain tetap tersedia sebagai konteks berkas yang dapat diunduh.

### Jenis media yang didukung

| Jenis media                    | Sumber               | Perilaku saat ini                                                                 | Catatan                                                                   |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Klip audio Slack               | URL berkas Slack     | Diunduh dan dirutekan melalui transkripsi audio bersama                           | Memerlukan `files:read` dan model atau CLI `tools.media.audio` yang berfungsi |
| Gambar JPEG / PNG / GIF / WebP | URL berkas Slack     | Diunduh dan dilampirkan ke giliran untuk penanganan yang mendukung penglihatan    | Batas per berkas: `channels.slack.mediaMaxMb` (default 20 MB)                       |
| Berkas PDF                     | URL berkas Slack     | Diunduh dan diekspos sebagai konteks berkas untuk alat seperti `download-file` atau `pdf` | Masukan Slack tidak mengonversi PDF menjadi masukan penglihatan gambar secara otomatis |
| Berkas lain                    | URL berkas Slack     | Diunduh jika memungkinkan dan diekspos sebagai konteks berkas                     | Berkas biner tidak diperlakukan sebagai masukan gambar                     |
| Balasan utas                   | Berkas pembuka utas  | Berkas pesan akar dapat dimuat sebagai konteks ketika balasan tidak memiliki media langsung | Pembuka yang hanya berisi berkas menggunakan placeholder lampiran          |
| Pesan multi-berkas             | Beberapa berkas Slack | Setiap berkas dievaluasi secara independen                                       | Pemrosesan Slack dibatasi hingga delapan berkas per pesan                  |

### Pipeline masuk

Ketika pesan Slack dengan lampiran berkas tiba:

1. OpenClaw mengunduh berkas dari URL privat Slack menggunakan token bot.
2. Berkas ditulis ke penyimpanan media setelah berhasil.
3. Jalur media yang diunduh dan jenis konten ditambahkan ke konteks masuk.
4. Klip audio dirutekan ke pipeline transkripsi bersama; jalur model/alat yang mendukung gambar dapat menggunakan lampiran gambar dari konteks yang sama.
5. Berkas lain tetap tersedia sebagai metadata berkas atau referensi media untuk alat yang dapat menanganinya.

### Pewarisan lampiran akar utas

Ketika pesan tiba dalam utas (memiliki induk `thread_ts`):

- Jika balasan itu sendiri tidak memiliki media langsung dan pesan akar yang disertakan memiliki berkas, Slack dapat memuat berkas akar sebagai konteks pembuka utas.
- Berkas akar hanya dimuat saat memulai sesi utas baru atau yang direset. Balasan berikutnya yang hanya berisi teks menggunakan kembali konteks sesi yang ada dan tidak melampirkan ulang berkas akar sebagai media baru.
- Lampiran balasan langsung diprioritaskan daripada lampiran pesan akar.
- Pesan akar yang hanya memiliki berkas dan tanpa teks direpresentasikan dengan placeholder lampiran sehingga fallback tetap dapat menyertakan berkasnya.

### Penanganan multi-lampiran

Ketika satu pesan Slack berisi beberapa lampiran berkas:

- Setiap lampiran diproses secara independen melalui pipeline media.
- Referensi media yang diunduh diagregasikan ke dalam konteks pesan.
- Urutan pemrosesan mengikuti urutan berkas Slack dalam payload peristiwa.
- Kegagalan mengunduh satu lampiran tidak memblokir lampiran lainnya.

### Batas ukuran, pengunduhan, dan model

- **Batas ukuran**: Default 20 MB per berkas. Dapat dikonfigurasi melalui `channels.slack.mediaMaxMb`.
- **Batas transkripsi audio**: `tools.media.audio.maxBytes` juga berlaku ketika berkas yang diunduh dikirim ke penyedia transkripsi atau CLI.
- **Kegagalan pengunduhan**: Berkas yang tidak dapat disediakan Slack, URL kedaluwarsa, berkas yang tidak dapat diakses, berkas yang melebihi ukuran, dan respons HTML autentikasi/login Slack dilewati alih-alih dilaporkan sebagai format yang tidak didukung.
- **Model penglihatan**: Analisis gambar menggunakan model balasan aktif ketika mendukung penglihatan, atau model gambar yang dikonfigurasi di `agents.defaults.imageModel`.

### Batasan yang diketahui

| Skenario                                      | Perilaku saat ini                                                                  | Solusi sementara                                                             |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| URL berkas Slack kedaluwarsa                  | Berkas dilewati; tidak ada galat yang ditampilkan                                  | Unggah ulang berkas di Slack                                                  |
| Transkripsi audio tidak tersedia              | Klip tetap terlampir, tetapi tidak ada transkrip yang dihasilkan                   | Konfigurasikan `tools.media.audio` atau instal CLI transkripsi lokal yang didukung |
| Klip tanpa teks keterangan tidak lolos gerbang penyebutan | Dihapus setelah transkripsi spekulatif privat; transkrip dan unduhan dibuang | Konfigurasikan pola penyebutan nama yang diucapkan, tambahkan penyebutan bot tertulis, atau gunakan DM |
| Model penglihatan tidak dikonfigurasi         | Lampiran gambar disimpan sebagai referensi media, tetapi tidak dianalisis sebagai gambar | Konfigurasikan `agents.defaults.imageModel` atau gunakan model balasan yang mendukung penglihatan |
| Gambar sangat besar (> 20 MB secara default)  | Dilewati sesuai batas ukuran                                                       | Tingkatkan `channels.slack.mediaMaxMb` jika Slack mengizinkan                          |
| Lampiran yang diteruskan/dibagikan            | Teks dan media gambar/berkas yang dihosting Slack ditangani berdasarkan upaya terbaik | Bagikan ulang secara langsung di utas OpenClaw                                |
| Lampiran PDF                                  | Disimpan sebagai konteks berkas/media, tidak otomatis dirutekan melalui penglihatan gambar | Gunakan `download-file` untuk metadata berkas atau alat `pdf` untuk analisis PDF |

### Dokumentasi terkait

- [Pipeline pemahaman media](/id/nodes/media-understanding)
- [Audio dan catatan suara](/id/nodes/audio)
- [Alat PDF](/id/tools/pdf)

## Terkait

<CardGroup cols={2}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Pasangkan pengguna Slack ke Gateway.
  </Card>
  <Card title="Grup" icon="users" href="/id/channels/groups">
    Perilaku kanal dan DM grup.
  </Card>
  <Card title="Perutean kanal" icon="route" href="/id/channels/channel-routing">
    Rutekan pesan masuk ke agen.
  </Card>
  <Card title="Keamanan" icon="shield" href="/id/gateway/security">
    Model ancaman dan penguatan.
  </Card>
  <Card title="Konfigurasi" icon="sliders" href="/id/gateway/configuration">
    Tata letak dan prioritas konfigurasi.
  </Card>
  <Card title="Perintah garis miring" icon="terminal" href="/id/tools/slash-commands">
    Katalog dan perilaku perintah.
  </Card>
</CardGroup>
