---
read_when:
    - Menyiapkan Slack atau men-debug mode socket/HTTP Slack
summary: Setup Slack dan perilaku runtime (Socket Mode + HTTP Events API)
title: Slack
x-i18n:
    generated_at: "2026-04-05T13:44:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: efb37e1f04e1ac8ac3786c36ffc20013dacdc654bfa61e7f6e8df89c4902d2ab
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: siap produksi untuk DM + channel melalui integrasi aplikasi Slack. Mode default adalah Socket Mode; mode HTTP Events API juga didukung.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    DM Slack secara default menggunakan mode pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    Diagnostik lintas channel dan playbook perbaikan.
  </Card>
</CardGroup>

## Setup cepat

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create Slack app and tokens">
        Di pengaturan aplikasi Slack:

        - aktifkan **Socket Mode**
        - buat **App Token** (`xapp-...`) dengan `connections:write`
        - instal aplikasi dan salin **Bot Token** (`xoxb-...`)
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

      <Step title="Subscribe app events">
        Subscribe event bot untuk:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Aktifkan juga App Home **Messages Tab** untuk DM.
      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Events API mode">
    <Steps>
      <Step title="Configure Slack app for HTTP">

        - setel mode ke HTTP (`channels.slack.mode="http"`)
        - salin Slack **Signing Secret**
        - setel Request URL untuk Event Subscriptions + Interactivity + Slash command ke path webhook yang sama (default `/slack/events`)

      </Step>

      <Step title="Configure OpenClaw HTTP mode">

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

      </Step>

      <Step title="Use unique webhook paths for multi-account HTTP">
        Mode HTTP per akun didukung.

        Berikan `webhookPath` yang berbeda untuk setiap akun agar pendaftaran tidak saling bertabrakan.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Checklist manifest dan scope

<AccordionGroup>
  <Accordion title="Slack app manifest example" defaultOpen>

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
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

  </Accordion>

  <Accordion title="Optional user-token scopes (read operations)">
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
- `botToken`, `appToken`, `signingSecret`, dan `userToken` menerima
  string plaintext atau objek SecretRef.
- Token config menimpa fallback env.
- Fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` hanya berlaku untuk akun default.
- `userToken` (`xoxp-...`) hanya config-only (tanpa fallback env) dan default ke perilaku read-only (`userTokenReadOnly: true`).
- Opsional: tambahkan `chat:write.customize` jika Anda ingin pesan keluar menggunakan identitas agen aktif (`username` dan ikon kustom). `icon_emoji` menggunakan sintaks `:emoji_name:`.

Perilaku snapshot status:

- Inspeksi akun Slack melacak field `*Source` dan `*Status`
  per kredensial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status bernilai `available`, `configured_unavailable`, atau `missing`.
- `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef
  atau sumber secret non-inline lain, tetapi jalur perintah/runtime saat ini
  tidak dapat menyelesaikan nilai sebenarnya.
- Dalam mode HTTP, `signingSecretStatus` disertakan; dalam Socket Mode,
  pasangan yang wajib adalah `botTokenStatus` + `appTokenStatus`.

<Tip>
Untuk tindakan/pembacaan direktori, user token dapat diprioritaskan jika dikonfigurasi. Untuk penulisan, bot token tetap diprioritaskan; penulisan dengan user token hanya diizinkan saat `userTokenReadOnly: false` dan bot token tidak tersedia.
</Tip>

## Tindakan dan gate

Tindakan Slack dikendalikan oleh `channels.slack.actions.*`.

Grup tindakan yang tersedia dalam tooling Slack saat ini:

| Grup       | Default |
| ---------- | ------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Tindakan pesan Slack saat ini mencakup `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, dan `emoji-list`.

## Kontrol akses dan routing

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` mengendalikan akses DM (legacy: `channels.slack.dm.policy`):

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.slack.allowFrom` mencakup `"*"`; legacy: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (default true)
    - `channels.slack.allowFrom` (disarankan)
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (group DM default false)
    - `dm.groupChannels` (allowlist MPIM opsional)

    Prioritas multi-akun:

    - `channels.slack.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Akun bernama mewarisi `channels.slack.allowFrom` saat `allowFrom` miliknya sendiri tidak disetel.
    - Akun bernama tidak mewarisi `channels.slack.accounts.default.allowFrom`.

    Pairing di DM menggunakan `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` mengendalikan penanganan channel:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist channel berada di bawah `channels.slack.channels` dan sebaiknya menggunakan ID channel yang stabil.

    Catatan runtime: jika `channels.slack` sama sekali tidak ada (setup hanya env), runtime akan fallback ke `groupPolicy="allowlist"` dan mencatat peringatan (bahkan jika `channels.defaults.groupPolicy` disetel).

    Resolusi nama/ID:

    - entri allowlist channel dan entri allowlist DM diselesaikan saat startup jika akses token memungkinkan
    - entri nama channel yang tidak dapat diselesaikan tetap disimpan seperti dikonfigurasi tetapi diabaikan untuk routing secara default
    - otorisasi masuk dan routing channel secara default berbasis ID; pencocokan langsung username/slug memerlukan `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mentions and channel users">
    Pesan channel secara default di-gate oleh mention.

    Sumber mention:

    - mention aplikasi eksplisit (`<@botId>`)
    - pola regex mention (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - perilaku thread reply-to-bot implisit

    Kontrol per channel (`channels.slack.channels.<id>`; nama hanya melalui resolusi startup atau `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - format key `toolsBySender`: `id:`, `e164:`, `username:`, `name:`, atau wildcard `"*"`
      (key legacy tanpa prefiks masih dipetakan hanya ke `id:`)

  </Tab>
</Tabs>

## Threading, sesi, dan tag balasan

- DM dirutekan sebagai `direct`; channel sebagai `channel`; MPIM sebagai `group`.
- Dengan default `session.dmScope=main`, DM Slack digabungkan ke sesi utama agen.
- Sesi channel: `agent:<agentId>:slack:channel:<channelId>`.
- Balasan thread dapat membuat sufiks sesi thread (`:thread:<threadTs>`) jika berlaku.
- Default `channels.slack.thread.historyScope` adalah `thread`; default `thread.inheritParent` adalah `false`.
- `channels.slack.thread.initialHistoryLimit` mengendalikan berapa banyak pesan thread yang sudah ada diambil saat sesi thread baru dimulai (default `20`; set `0` untuk menonaktifkan).

Kontrol reply threading:

- `channels.slack.replyToMode`: `off|first|all` (default `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy untuk obrolan langsung: `channels.slack.dm.replyToMode`

Tag balasan manual didukung:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Catatan: `replyToMode="off"` menonaktifkan **semua** reply threading di Slack, termasuk tag `[[reply_to_*]]` yang eksplisit. Ini berbeda dari Telegram, di mana tag eksplisit tetap dihormati dalam mode `"off"`. Perbedaan ini mencerminkan model threading platform: thread Slack menyembunyikan pesan dari channel, sedangkan balasan Telegram tetap terlihat di alur chat utama.

## Reaksi ack

`ackReaction` mengirim emoji tanda terima saat OpenClaw sedang memproses pesan masuk.

Urutan resolusi:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada gunakan "👀")

Catatan:

- Slack mengharapkan shortcode (misalnya `"eyes"`).
- Gunakan `""` untuk menonaktifkan reaksi untuk akun Slack atau secara global.

## Streaming teks

`channels.slack.streaming` mengendalikan perilaku pratinjau live:

- `off`: nonaktifkan streaming pratinjau live.
- `partial` (default): ganti teks pratinjau dengan output parsial terbaru.
- `block`: tambahkan pembaruan pratinjau bertahap.
- `progress`: tampilkan teks status progres saat menghasilkan, lalu kirim teks akhir.

`channels.slack.nativeStreaming` mengendalikan streaming teks native Slack saat `streaming` adalah `partial` (default: `true`).

- Thread balasan harus tersedia agar streaming teks native muncul. Pemilihan thread tetap mengikuti `replyToMode`. Tanpanya, pratinjau draf normal akan digunakan.
- Media dan payload non-teks akan fallback ke pengiriman normal.
- Jika streaming gagal di tengah balasan, OpenClaw akan fallback ke pengiriman normal untuk payload yang tersisa.

Gunakan pratinjau draf alih-alih streaming teks native Slack:

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

Key legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) dimigrasikan otomatis ke `channels.slack.streaming`.
- boolean `channels.slack.streaming` dimigrasikan otomatis ke `channels.slack.nativeStreaming`.

## Fallback reaksi mengetik

`typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat OpenClaw sedang memproses balasan, lalu menghapusnya saat eksekusi selesai. Ini paling berguna di luar balasan thread, yang menggunakan indikator status default "is typing...".

Urutan resolusi:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Catatan:

- Slack mengharapkan shortcode (misalnya `"hourglass_flowing_sand"`).
- Reaksi ini bersifat best-effort dan pembersihannya dicoba secara otomatis setelah jalur balasan atau kegagalan selesai.

## Media, chunking, dan pengiriman

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Lampiran file Slack diunduh dari URL privat yang di-host Slack (alur permintaan terautentikasi token) dan ditulis ke penyimpanan media saat pengambilan berhasil dan batas ukuran mengizinkan.

    Batas ukuran masuk runtime default adalah `20MB` kecuali ditimpa oleh `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Outbound text and files">
    - potongan teks menggunakan `channels.slack.textChunkLimit` (default 4000)
    - `channels.slack.chunkMode="newline"` mengaktifkan pemisahan dengan prioritas paragraf
    - pengiriman file menggunakan API upload Slack dan dapat menyertakan balasan thread (`thread_ts`)
    - batas media keluar mengikuti `channels.slack.mediaMaxMb` saat dikonfigurasi; jika tidak, pengiriman channel menggunakan default jenis MIME dari pipeline media
  </Accordion>

  <Accordion title="Delivery targets">
    Target eksplisit yang disarankan:

    - `user:<id>` untuk DM
    - `channel:<id>` untuk channel

    DM Slack dibuka melalui API percakapan Slack saat mengirim ke target pengguna.

  </Accordion>
</AccordionGroup>

## Perintah dan perilaku slash

- Auto-mode perintah native adalah **off** untuk Slack (`commands.native: "auto"` tidak mengaktifkan perintah native Slack).
- Aktifkan handler perintah Slack native dengan `channels.slack.commands.native: true` (atau global `commands.native: true`).
- Saat perintah native diaktifkan, daftarkan slash command yang sesuai di Slack (nama `/<command>`), dengan satu pengecualian:
  - daftarkan `/agentstatus` untuk perintah status (Slack mencadangkan `/status`)
- Jika perintah native tidak diaktifkan, Anda dapat menjalankan satu slash command yang dikonfigurasi melalui `channels.slack.slashCommand`.
- Menu argumen native kini menyesuaikan strategi rendering-nya:
  - hingga 5 opsi: blok tombol
  - 6-100 opsi: menu select statis
  - lebih dari 100 opsi: external select dengan penyaringan opsi async saat handler opsi interaktivitas tersedia
  - jika nilai opsi yang dikodekan melebihi batas Slack, alur akan fallback ke tombol
- Untuk payload opsi yang panjang, menu argumen Slash command menggunakan dialog konfirmasi sebelum mengirim nilai yang dipilih.

Pengaturan default slash command:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Sesi slash menggunakan key terisolasi:

- `agent:<agentId>:slack:slash:<userId>`

dan tetap merutekan eksekusi perintah terhadap sesi percakapan target (`CommandTargetSessionKey`).

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

Saat diaktifkan, agen dapat mengeluarkan directive balasan khusus Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Directive ini dikompilasi menjadi Slack Block Kit dan merutekan klik atau pilihan kembali melalui jalur event interaksi Slack yang ada.

Catatan:

- Ini adalah UI khusus Slack. Channel lain tidak menerjemahkan directive Slack Block Kit ke sistem tombol mereka sendiri.
- Nilai callback interaktif adalah token opak yang dibuat OpenClaw, bukan nilai mentah yang ditulis agen.
- Jika blok interaktif yang dihasilkan melebihi batas Slack Block Kit, OpenClaw akan fallback ke balasan teks asli alih-alih mengirim payload blocks yang tidak valid.

## Persetujuan exec di Slack

Slack dapat bertindak sebagai klien persetujuan native dengan tombol interaktif dan interaksi, alih-alih fallback ke UI Web atau terminal.

- Persetujuan exec menggunakan `channels.slack.execApprovals.*` untuk routing DM/channel native.
- Persetujuan plugin tetap dapat diselesaikan melalui surface tombol native Slack yang sama saat permintaan sudah sampai di Slack dan jenis approval id adalah `plugin:`.
- Otorisasi approver tetap diberlakukan: hanya pengguna yang diidentifikasi sebagai approver yang dapat menyetujui atau menolak permintaan melalui Slack.

Ini menggunakan surface tombol persetujuan bersama yang sama seperti channel lain. Saat `interactivity` diaktifkan di pengaturan aplikasi Slack Anda, prompt persetujuan dirender sebagai tombol Block Kit langsung di percakapan.
Saat tombol tersebut ada, itu menjadi UX persetujuan utama; OpenClaw
hanya boleh menyertakan perintah manual `/approve` saat hasil tool menyatakan persetujuan chat
tidak tersedia atau persetujuan manual adalah satu-satunya jalur.

Path config:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opsional; fallback ke `commands.ownerAllowFrom` jika memungkinkan)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `agentFilter`, `sessionFilter`

Slack otomatis mengaktifkan persetujuan exec native saat `enabled` tidak disetel atau `"auto"` dan setidaknya satu
approver berhasil diselesaikan. Set `enabled: false` untuk menonaktifkan Slack sebagai klien persetujuan native secara eksplisit.
Set `enabled: true` untuk memaksa persetujuan native aktif saat approver berhasil diselesaikan.

Perilaku default tanpa config persetujuan exec Slack eksplisit:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Config native Slack eksplisit hanya diperlukan saat Anda ingin menimpa approver, menambahkan filter, atau
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

Forwarding bersama `approvals.exec` bersifat terpisah. Gunakan hanya saat prompt persetujuan exec juga harus
dirutekan ke chat lain atau target out-of-band eksplisit. Forwarding bersama `approvals.plugin` juga
terpisah; tombol native Slack tetap dapat menyelesaikan persetujuan plugin saat permintaan tersebut sudah sampai
di Slack.

`/approve` pada chat yang sama juga berfungsi di channel dan DM Slack yang sudah mendukung perintah. Lihat [Exec approvals](/tools/exec-approvals) untuk model forwarding persetujuan lengkap.

## Event dan perilaku operasional

- Edit/hapus pesan/thread broadcast dipetakan ke peristiwa sistem.
- Event tambah/hapus reaksi dipetakan ke peristiwa sistem.
- Event anggota masuk/keluar, channel dibuat/diubah namanya, dan tambah/hapus pin dipetakan ke peristiwa sistem.
- `channel_id_changed` dapat memigrasikan key config channel saat `configWrites` diaktifkan.
- Metadata topik/tujuan channel diperlakukan sebagai konteks yang tidak tepercaya dan dapat disuntikkan ke konteks routing.
- Konteks awal thread starter dan riwayat thread awal difilter oleh allowlist pengirim yang dikonfigurasi jika berlaku.
- Tindakan blok dan interaksi modal menghasilkan peristiwa sistem terstruktur `Slack interaction: ...` dengan field payload kaya:
  - block actions: nilai terpilih, label, nilai picker, dan metadata `workflow_*`
  - event modal `view_submission` dan `view_closed` dengan metadata channel yang dirutekan dan input formulir

## Petunjuk referensi konfigurasi

Referensi utama:

- [Referensi konfigurasi - Slack](/gateway/configuration-reference#slack)

  Field Slack dengan sinyal tinggi:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - akses DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - toggle kompatibilitas: `dangerouslyAllowNameMatching` (break-glass; biarkan off kecuali diperlukan)
  - akses channel: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/history: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - ops/fitur: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="No replies in channels">
    Periksa, secara berurutan:

    - `groupPolicy`
    - allowlist channel (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` per channel

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
    `appTokenStatus: "configured_unavailable"`, akun Slack
    telah dikonfigurasi tetapi runtime saat ini tidak dapat menyelesaikan nilai
    yang didukung SecretRef.

  </Accordion>

  <Accordion title="HTTP mode not receiving events">
    Validasi:

    - signing secret
    - path webhook
    - Slack Request URL (Events + Interactivity + Slash Commands)
    - `webhookPath` unik per akun HTTP

    Jika `signingSecretStatus: "configured_unavailable"` muncul di snapshot akun,
    akun HTTP telah dikonfigurasi tetapi runtime saat ini tidak dapat
    menyelesaikan signing secret yang didukung SecretRef.

  </Accordion>

  <Accordion title="Native/slash commands not firing">
    Verifikasi apakah yang Anda maksud adalah:

    - mode perintah native (`channels.slack.commands.native: true`) dengan slash command yang sesuai terdaftar di Slack
    - atau mode single slash command (`channels.slack.slashCommand.enabled: true`)

    Periksa juga `commands.useAccessGroups` dan allowlist channel/pengguna.

  </Accordion>
</AccordionGroup>

## Terkait

- [Pairing](/channels/pairing)
- [Grup](/channels/groups)
- [Keamanan](/gateway/security)
- [Channel routing](/channels/channel-routing)
- [Pemecahan masalah](/channels/troubleshooting)
- [Konfigurasi](/gateway/configuration)
- [Slash commands](/tools/slash-commands)
