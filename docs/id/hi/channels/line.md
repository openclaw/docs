---
read_when:
    - Anda ingin menghubungkan OpenClaw ke LINE
    - Anda memerlukan penyiapan LINE Webhook + kredensial
    - Anda menginginkan opsi pesan khusus LINE
summary: Penyiapan, konfigurasi, dan penggunaan Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE terhubung ke OpenClaw melalui LINE Messaging API. Plugin berjalan sebagai penerima Webhook
di Gateway dan menggunakan channel access token + channel secret Anda untuk autentikasi.

Status: Plugin yang dapat diunduh. direct messages, group chats, media, locations, Flex
messages, template messages, dan quick replies didukung. Reactions dan threads
tidak didukung.

## Instal

Instal LINE sebelum mengonfigurasi channel:

```bash
openclaw plugins install @openclaw/line
```

Checkout lokal (saat menjalankan dari git repo):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Penyiapan

1. Buat LINE Developers account dan buka Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Buat (atau pilih) sebuah Provider dan tambahkan channel **Messaging API**.
3. Salin **Channel access token** dan **Channel secret** dari channel settings.
4. Di Messaging API settings, aktifkan **Use webhook**.
5. Atur Webhook URL ke endpoint Gateway Anda (HTTPS wajib):

```
https://gateway-host/line/webhook
```

Gateway menjawab Webhook verification (GET) dari LINE dan menerima signed
inbound events (POST) segera setelah validasi signature dan payload; agent
processing berlanjut secara asinkron.
Jika Anda memerlukan custom path, atur `channels.line.webhookPath` atau
`channels.line.accounts.<id>.webhookPath` dan perbarui URL sesuai itu.

Catatan keamanan:

- LINE signature verification bergantung pada body (HMAC pada raw body), sehingga OpenClaw menerapkan strict pre-auth body limits dan timeout sebelum verification.
- OpenClaw memproses Webhook events dari verified raw request bytes. Untuk keamanan signature-integrity, nilai `req.body` yang telah ditransformasi upstream middleware diabaikan.

## Konfigurasi

Config minimum:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Config Public DM:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Env vars (hanya default account):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

File token/secret:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` dan `secretFile` harus mengarah ke regular files. Symlinks ditolak.

Beberapa accounts:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Kontrol akses

Direct messages secara default menggunakan pairing. Senders yang tidak dikenal menerima pairing code dan
messages mereka diabaikan sampai disetujui.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists dan policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: LINE user IDs yang di-allowlist untuk DMs; `dmPolicy: "open"` memerlukan `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: LINE user IDs yang di-allowlist untuk groups
- Per-group overrides: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups dapat direferensikan dari `allowFrom`, `groupAllowFrom`, dan per-group `allowFrom` dengan `accessGroup:<name>`.
- Catatan runtime: jika `channels.line` sepenuhnya tidak ada, runtime melakukan fallback ke `groupPolicy="allowlist"` untuk group checks (meskipun `channels.defaults.groupPolicy` disetel).

LINE IDs case-sensitive. Valid IDs terlihat seperti ini:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## Perilaku message

- Text dibagi menjadi chunks pada 5000 characters.
- Markdown formatting dihapus; code blocks dan tables dikonversi menjadi Flex
  cards jika memungkinkan.
- Streaming responses di-buffer; LINE menerima chunks lengkap dengan loading
  animation saat agent bekerja.
- Media downloads dibatasi oleh `channels.line.mediaMaxMb` (default 10).
- Inbound media disimpan di bawah `~/.openclaw/media/inbound/` sebelum diteruskan ke agent,
  sesuai dengan shared media store yang digunakan oleh bundled channel
  plugins lainnya.

## Data channel (rich messages)

Gunakan `channelData.line` untuk mengirim quick replies, locations, Flex cards, atau template
messages.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin juga menyertakan command `/card` untuk preset Flex message:

```
/card info "Welcome" "Thanks for joining!"
```

## Dukungan ACP

LINE mendukung binding conversation ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` mengikat current LINE chat ke ACP session tanpa membuat child thread.
- Binding ACP yang dikonfigurasi dan active conversation-bound ACP sessions bekerja seperti conversation channels lainnya di LINE.

Lihat [agent ACP](/id/tools/acp-agents) untuk detail.

## Media outbound

LINE Plugin mendukung pengiriman images, videos, dan audio files melalui agent message tool. Media dikirim melalui delivery path khusus LINE dengan preview dan tracking handling yang sesuai:

- **Images**: dikirim sebagai LINE image messages dengan automatic preview generation.
- **Videos**: dikirim dengan explicit preview dan content-type handling.
- **Audio**: dikirim sebagai LINE audio messages.

Outbound media URLs harus berupa public HTTPS URLs. OpenClaw memvalidasi target hostname sebelum menyerahkan URL ke LINE dan menolak target loopback, link-local, dan private-network.

Generic media sends melakukan fallback ke existing image-only route jika path khusus LINE tidak tersedia.

## Pemecahan masalah

- **Webhook verification fails:** pastikan Webhook URL menggunakan HTTPS dan
  `channelSecret` cocok dengan LINE console.
- **No inbound events:** pastikan Webhook path cocok dengan `channels.line.webhookPath`
  dan Gateway dapat dijangkau dari LINE.
- **Media download errors:** jika media melebihi default limit, naikkan `channels.line.mediaMaxMb`.

## Terkait

- [Ikhtisar Channels](/id/channels) — semua channels yang didukung
- [Pairing](/id/channels/pairing) — DM authentication dan pairing flow
- [Groups](/id/channels/groups) — perilaku group chat dan mention gating
- [Channel Routing](/id/channels/channel-routing) — session routing untuk messages
- [Security](/id/gateway/security) — access model dan hardening
