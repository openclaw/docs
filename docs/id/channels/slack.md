---
read_when:
    - Menyiapkan Slack atau men-debug mode socket/HTTP Slack
summary: Penyiapan Slack dan perilaku runtime (Socket Mode + HTTP Request URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-06T09:14:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 897001c13d400cc8387a27000b82dd4c0512b2b88e2fe47785634aed8b7ab7af
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: siap produksi untuk DM + channel melalui integrasi aplikasi Slack. Mode default adalah Socket Mode; HTTP Request URLs juga didukung.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    DM Slack default ke mode pairing.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/id/tools/slash-commands">
    Perilaku perintah native dan katalog perintah.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas channel dan playbook perbaikan.
  </Card>
</CardGroup>

## Penyiapan cepat

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Buat aplikasi Slack dan token">
        Di pengaturan aplikasi Slack:

        - aktifkan **Socket Mode**
        - buat **App Token** (`xapp-...`) dengan `connections:write`
        - instal aplikasi dan salin **Bot Token** (`xoxb-...`)
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

      <Step title="Langganan event aplikasi">
        Langganan event bot untuk:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Aktifkan juga **Messages Tab** App Home untuk DM.
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
      <Step title="Konfigurasikan aplikasi Slack untuk HTTP">

        - setel mode ke HTTP (`channels.slack.mode="http"`)
        - salin **Signing Secret** Slack
        - setel URL Permintaan Event Subscriptions + Interactivity + Slash command ke path webhook yang sama (default `/slack/events`)

      </Step>

      <Step title="Konfigurasikan mode HTTP OpenClaw">

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

      <Step title="Gunakan path webhook unik untuk HTTP multi-akun">
        Mode HTTP per akun didukung.

        Berikan setiap akun `webhookPath` yang berbeda agar pendaftaran tidak bentrok.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Manifest dan daftar periksa scope

<Tabs>
  <Tab title="Socket Mode (default)">

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

  </Tab>

  <Tab title="HTTP Request URLs">

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

<AccordionGroup>
  <Accordion title="Scope authorship opsional (operasi tulis)">
    Tambahkan bot scope `chat:write.customize` jika Anda ingin pesan keluar menggunakan identitas agen aktif (username dan ikon kustom) alih-alih identitas aplikasi Slack default.

    Jika Anda menggunakan ikon emoji, Slack mengharapkan sintaks `:emoji_name:`.

  </Accordion>
  <Accordion title="Scope user-token opsional (operasi baca)">
    Jika Anda mengonfigurasi `channels.slack.userToken`, scope baca umum adalah:

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
- Token config menimpa fallback env.
- Fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` hanya berlaku untuk akun default.
- `userToken` (`xoxp-...`) hanya untuk config (tanpa fallback env) dan default ke perilaku hanya-baca (`userTokenReadOnly: true`).

Perilaku snapshot status:

- Inspeksi akun Slack melacak field `*Source` dan `*Status`
  per kredensial (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Status adalah `available`, `configured_unavailable`, atau `missing`.
- `configured_unavailable` berarti akun dikonfigurasi melalui SecretRef
  atau sumber secret non-inline lain, tetapi path perintah/runtime saat ini
  tidak dapat me-resolve nilai sebenarnya.
- Dalam mode HTTP, `signingSecretStatus` disertakan; dalam Socket Mode,
  pasangan yang diperlukan adalah `botTokenStatus` + `appTokenStatus`.

<Tip>
Untuk aksi/pembacaan direktori, user token dapat diprioritaskan jika dikonfigurasi. Untuk penulisan, bot token tetap diprioritaskan; penulisan dengan user token hanya diizinkan ketika `userTokenReadOnly: false` dan bot token tidak tersedia.
</Tip>

## Aksi dan gate

Aksi Slack dikendalikan oleh `channels.slack.actions.*`.

Grup aksi yang tersedia pada tooling Slack saat ini:

| Grup      | Default |
| ---------- | ------- |
| messages   | aktif |
| reactions  | aktif |
| pins       | aktif |
| memberInfo | aktif |
| emojiList  | aktif |

Aksi pesan Slack saat ini mencakup `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info`, dan `emoji-list`.

## Kontrol akses dan routing

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.slack.dmPolicy` mengontrol akses DM (legacy: `channels.slack.dm.policy`):

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `channels.slack.allowFrom` menyertakan `"*"`; legacy: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (default true)
    - `channels.slack.allowFrom` (disarankan)
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (default DM grup false)
    - `dm.groupChannels` (allowlist MPIM opsional)

    Prioritas multi-akun:

    - `channels.slack.accounts.default.allowFrom` hanya berlaku untuk akun `default`.
    - Akun bernama mewarisi `channels.slack.allowFrom` ketika `allowFrom` miliknya sendiri tidak disetel.
    - Akun bernama tidak mewarisi `channels.slack.accounts.default.allowFrom`.

    Pairing di DM menggunakan `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kebijakan channel">
    `channels.slack.groupPolicy` mengontrol penanganan channel:

    - `open`
    - `allowlist`
    - `disabled`

    Allowlist channel berada di bawah `channels.slack.channels` dan sebaiknya menggunakan ID channel yang stabil.

    Catatan runtime: jika `channels.slack` sama sekali tidak ada (penyiapan hanya env), runtime akan fallback ke `groupPolicy="allowlist"` dan mencatat peringatan (bahkan jika `channels.defaults.groupPolicy` disetel).

    Resolusi nama/ID:

    - entri allowlist channel dan entri allowlist DM di-resolve saat startup ketika akses token memungkinkan
    - entri nama channel yang tidak ter-resolve tetap disimpan sesuai konfigurasi tetapi diabaikan untuk routing secara default
    - otorisasi inbound dan routing channel secara default berbasis ID; pencocokan langsung username/slug memerlukan `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Mention dan pengguna channel">
    Pesan channel secara default digate oleh mention.

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
      (key legacy tanpa prefiks tetap dipetakan hanya ke `id:`)

  </Tab>
</Tabs>

## Threading, sesi, dan tag balasan

- DM dirutekan sebagai `direct`; channel sebagai `channel`; MPIM sebagai `group`.
- Dengan default `session.dmScope=main`, DM Slack digabungkan ke sesi utama agen.
- Sesi channel: `agent:<agentId>:slack:channel:<channelId>`.
- Balasan thread dapat membuat sufiks sesi thread (`:thread:<threadTs>`) jika berlaku.
- Default `channels.slack.thread.historyScope` adalah `thread`; default `thread.inheritParent` adalah `false`.
- `channels.slack.thread.initialHistoryLimit` mengontrol berapa banyak pesan thread yang sudah ada diambil saat sesi thread baru dimulai (default `20`; setel `0` untuk menonaktifkan).

Kontrol threading balasan:

- `channels.slack.replyToMode`: `off|first|all|batched` (default `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy untuk chat langsung: `channels.slack.dm.replyToMode`

Tag balasan manual didukung:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Catatan: `replyToMode="off"` menonaktifkan **semua** threading balasan di Slack, termasuk tag eksplisit `[[reply_to_*]]`. Ini berbeda dari Telegram, di mana tag eksplisit tetap dihormati dalam mode `"off"`. Perbedaan ini mencerminkan model threading platform: thread Slack menyembunyikan pesan dari channel, sedangkan balasan Telegram tetap terlihat dalam alur chat utama.

## Reaksi ack

`ackReaction` mengirim emoji pengakuan saat OpenClaw sedang memproses pesan masuk.

Urutan resolusi:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback emoji identitas agen (`agents.list[].identity.emoji`, jika tidak ada gunakan `"👀"`)

Catatan:

- Slack mengharapkan shortcode (misalnya `"eyes"`).
- Gunakan `""` untuk menonaktifkan reaksi untuk akun Slack atau secara global.

## Streaming teks

`channels.slack.streaming` mengontrol perilaku pratinjau langsung:

- `off`: nonaktifkan streaming pratinjau langsung.
- `partial` (default): ganti teks pratinjau dengan output parsial terbaru.
- `block`: tambahkan pembaruan pratinjau bertahap.
- `progress`: tampilkan teks status progres saat menghasilkan, lalu kirim teks final.

`channels.slack.nativeStreaming` mengontrol streaming teks native Slack saat `streaming` adalah `partial` (default: `true`).

- Thread balasan harus tersedia agar streaming teks native muncul. Pemilihan thread tetap mengikuti `replyToMode`. Tanpanya, pratinjau draf normal digunakan.
- Payload media dan non-teks fallback ke pengiriman normal.
- Jika streaming gagal di tengah balasan, OpenClaw fallback ke pengiriman normal untuk payload yang tersisa.

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

`typingReaction` menambahkan reaksi sementara ke pesan Slack masuk saat OpenClaw sedang memproses balasan, lalu menghapusnya saat proses selesai. Ini paling berguna di luar balasan thread, yang menggunakan indikator status default "is typing...".

Urutan resolusi:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Catatan:

- Slack mengharapkan shortcode (misalnya `"hourglass_flowing_sand"`).
- Reaksi ini bersifat best-effort dan pembersihannya dicoba secara otomatis setelah jalur balasan atau kegagalan selesai.

## Media, chunking, dan pengiriman

<AccordionGroup>
  <Accordion title="Lampiran masuk">
    Lampiran file Slack diunduh dari URL privat yang di-host Slack (alur permintaan terautentikasi token) dan ditulis ke media store saat pengambilan berhasil dan batas ukuran mengizinkan.

    Batas ukuran masuk runtime default adalah `20MB` kecuali ditimpa oleh `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Teks dan file keluar">
    - chunk teks menggunakan `channels.slack.textChunkLimit` (default 4000)
    - `channels.slack.chunkMode="newline"` mengaktifkan pemisahan berbasis paragraf terlebih dahulu
    - pengiriman file menggunakan API upload Slack dan dapat menyertakan balasan thread (`thread_ts`)
    - batas media keluar mengikuti `channels.slack.mediaMaxMb` saat dikonfigurasi; jika tidak, pengiriman channel menggunakan default berbasis jenis MIME dari media pipeline
  </Accordion>

  <Accordion title="Target pengiriman">
    Target eksplisit yang diprioritaskan:

    - `user:<id>` untuk DM
    - `channel:<id>` untuk channel

    DM Slack dibuka melalui API percakapan Slack saat mengirim ke target pengguna.

  </Accordion>
</AccordionGroup>

## Perintah dan perilaku slash

- Mode otomatis perintah native adalah **off** untuk Slack (`commands.native: "auto"` tidak mengaktifkan perintah native Slack).
- Aktifkan handler perintah Slack native dengan `channels.slack.commands.native: true` (atau global `commands.native: true`).
- Saat perintah native diaktifkan, daftarkan slash command yang sesuai di Slack (nama `/<command>`), dengan satu pengecualian:
  - daftarkan `/agentstatus` untuk perintah status (Slack mencadangkan `/status`)
- Jika perintah native tidak diaktifkan, Anda dapat menjalankan satu slash command yang dikonfigurasi melalui `channels.slack.slashCommand`.
- Menu arg native kini menyesuaikan strategi render-nya:
  - hingga 5 opsi: blok tombol
  - 6-100 opsi: menu pilih statis
  - lebih dari 100 opsi: external select dengan pemfilteran opsi async saat handler opsi interaktivitas tersedia
  - jika nilai opsi terenkode melebihi batas Slack, alur akan fallback ke tombol
- Untuk payload opsi yang panjang, menu arg slash command menggunakan dialog konfirmasi sebelum mengirim nilai yang dipilih.

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

Saat diaktifkan, agen dapat mengeluarkan direktif balasan khusus Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Direktif ini dikompilasi menjadi Slack Block Kit dan merutekan klik atau pilihan kembali melalui path event interaksi Slack yang ada.

Catatan:

- Ini adalah UI khusus Slack. Channel lain tidak menerjemahkan direktif Slack Block Kit ke dalam sistem tombol mereka sendiri.
- Nilai callback interaktif adalah token opak yang dibuat OpenClaw, bukan nilai mentah yang ditulis agen.
- Jika blok interaktif yang dihasilkan akan melebihi batas Slack Block Kit, OpenClaw fallback ke balasan teks asli alih-alih mengirim payload blok yang tidak valid.

## Persetujuan exec di Slack

Slack dapat bertindak sebagai klien persetujuan native dengan tombol interaktif dan interaksi, alih-alih fallback ke UI Web atau terminal.

- Persetujuan exec menggunakan `channels.slack.execApprovals.*` untuk routing DM/channel native.
- Persetujuan plugin tetap dapat di-resolve melalui permukaan tombol native Slack yang sama ketika permintaan sudah masuk ke Slack dan jenis approval id adalah `plugin:`.
- Otorisasi approver tetap diberlakukan: hanya pengguna yang diidentifikasi sebagai approver yang dapat menyetujui atau menolak permintaan melalui Slack.

Ini menggunakan permukaan tombol persetujuan bersama yang sama seperti channel lain. Saat `interactivity` diaktifkan di pengaturan aplikasi Slack Anda, prompt persetujuan dirender sebagai tombol Block Kit langsung di percakapan.
Saat tombol tersebut ada, itulah UX persetujuan utama; OpenClaw
hanya boleh menyertakan perintah manual `/approve` ketika hasil tool menyatakan persetujuan chat
tidak tersedia atau persetujuan manual adalah satu-satunya jalur.

Path config:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (opsional; fallback ke `commands.ownerAllowFrom` bila memungkinkan)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, default: `dm`)
- `agentFilter`, `sessionFilter`

Slack otomatis mengaktifkan persetujuan exec native saat `enabled` tidak disetel atau `"auto"` dan setidaknya satu
approver di-resolve. Setel `enabled: false` untuk menonaktifkan Slack sebagai klien persetujuan native secara eksplisit.
Setel `enabled: true` untuk memaksa persetujuan native aktif saat approver di-resolve.

Perilaku default tanpa config persetujuan exec Slack eksplisit:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Config native Slack eksplisit hanya diperlukan saat Anda ingin menimpa approver, menambahkan filter, atau
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

Forwarding bersama `approvals.exec` terpisah. Gunakan hanya ketika prompt persetujuan exec juga harus
dirutekan ke chat lain atau target out-of-band yang eksplisit. Forwarding bersama `approvals.plugin` juga
terpisah; tombol native Slack tetap dapat me-resolve persetujuan plugin ketika permintaan tersebut sudah masuk
ke Slack.

`/approve` di chat yang sama juga berfungsi di channel dan DM Slack yang sudah mendukung perintah. Lihat [Persetujuan exec](/id/tools/exec-approvals) untuk model forwarding persetujuan lengkap.

## Event dan perilaku operasional

- Edit/hapus pesan/thread broadcast dipetakan menjadi event sistem.
- Event tambah/hapus reaksi dipetakan menjadi event sistem.
- Event bergabung/keluar anggota, channel dibuat/diubah namanya, dan tambah/hapus pin dipetakan menjadi event sistem.
- `channel_id_changed` dapat memigrasikan key config channel saat `configWrites` diaktifkan.
- Metadata topic/purpose channel diperlakukan sebagai konteks tidak tepercaya dan dapat diinjeksi ke konteks routing.
- Thread starter dan penyemaian konteks riwayat thread awal difilter oleh allowlist pengirim yang dikonfigurasi bila berlaku.
- Block action dan interaksi modal memunculkan event sistem terstruktur `Slack interaction: ...` dengan field payload yang kaya:
  - block action: nilai yang dipilih, label, nilai picker, dan metadata `workflow_*`
  - event modal `view_submission` dan `view_closed` dengan metadata channel yang dirutekan dan input formulir

## Petunjuk referensi konfigurasi

Referensi utama:

- [Referensi konfigurasi - Slack](/id/gateway/configuration-reference#slack)

  Field Slack dengan sinyal tinggi:
  - mode/auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - akses DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - toggle kompatibilitas: `dangerouslyAllowNameMatching` (pemutus kaca darurat; biarkan nonaktif kecuali diperlukan)
  - akses channel: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/riwayat: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - operasi/fitur: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak ada balasan di channel">
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
    Validasi bot + app token dan pengaktifan Socket Mode di pengaturan aplikasi Slack.

    Jika `openclaw channels status --probe --json` menampilkan `botTokenStatus` atau
    `appTokenStatus: "configured_unavailable"`, akun Slack telah
    dikonfigurasi tetapi runtime saat ini tidak dapat me-resolve nilai
    yang didukung SecretRef.

  </Accordion>

  <Accordion title="Mode HTTP tidak menerima event">
    Validasi:

    - signing secret
    - path webhook
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - `webhookPath` unik per akun HTTP

    Jika `signingSecretStatus: "configured_unavailable"` muncul di snapshot
    akun, akun HTTP telah dikonfigurasi tetapi runtime saat ini tidak dapat
    me-resolve signing secret yang didukung SecretRef.

  </Accordion>

  <Accordion title="Perintah native/slash tidak berjalan">
    Verifikasi apakah yang Anda maksud adalah:

    - mode perintah native (`channels.slack.commands.native: true`) dengan slash command yang sesuai terdaftar di Slack
    - atau mode slash command tunggal (`channels.slack.slashCommand.enabled: true`)

    Periksa juga `commands.useAccessGroups` dan allowlist channel/pengguna.

  </Accordion>
</AccordionGroup>

## Terkait

- [Pairing](/id/channels/pairing)
- [Groups](/id/channels/groups)
- [Security](/id/gateway/security)
- [Channel routing](/id/channels/channel-routing)
- [Troubleshooting](/id/channels/troubleshooting)
- [Configuration](/id/gateway/configuration)
- [Slash commands](/id/tools/slash-commands)
