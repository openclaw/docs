---
read_when:
    - Mengerjakan perilaku channel WhatsApp/web atau perutean inbox
summary: Dukungan channel WhatsApp, kontrol akses, perilaku pengiriman, dan operasional
title: WhatsApp
x-i18n:
    generated_at: "2026-04-24T09:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51305dbf83109edb64d07bcafd5fe738ff97e3d2c779adfaef2e8406d1d93caf
    source_path: channels/whatsapp.md
    workflow: 15
---

Status: siap produksi melalui WhatsApp Web (Baileys). Gateway memiliki sesi tertaut.

## Instalasi (sesuai kebutuhan)

- Onboarding (`openclaw onboard`) dan `openclaw channels add --channel whatsapp`
  akan meminta instalasi Plugin WhatsApp saat pertama kali Anda memilihnya.
- `openclaw channels login --channel whatsapp` juga menawarkan alur instalasi saat
  Plugin belum ada.
- Channel dev + checkout git: default ke jalur Plugin lokal.
- Stable/Beta: default ke paket npm `@openclaw/whatsapp`.

Instalasi manual tetap tersedia:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/id/channels/pairing">
    Kebijakan DM default adalah pairing untuk pengirim yang tidak dikenal.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas channel dan panduan perbaikan.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh config channel lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Konfigurasikan kebijakan akses WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Tautkan WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Untuk akun tertentu:

```bash
openclaw channels login --channel whatsapp --account work
```

    Untuk melampirkan direktori auth WhatsApp Web yang sudah ada/kustom sebelum login:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Mulai Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Setujui permintaan pairing pertama (jika menggunakan mode pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Permintaan pairing kedaluwarsa setelah 1 jam. Permintaan tertunda dibatasi hingga 3 per channel.

  </Step>
</Steps>

<Note>
OpenClaw merekomendasikan menjalankan WhatsApp pada nomor terpisah jika memungkinkan. (Metadata channel dan alur penyiapan dioptimalkan untuk penyiapan tersebut, tetapi penyiapan nomor pribadi juga didukung.)
</Note>

## Pola deployment

<AccordionGroup>
  <Accordion title="Nomor khusus (disarankan)">
    Ini adalah mode operasional yang paling bersih:

    - identitas WhatsApp terpisah untuk OpenClaw
    - allowlist DM dan batas perutean yang lebih jelas
    - kemungkinan lebih rendah terjadinya kebingungan chat dengan diri sendiri

    Pola kebijakan minimal:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fallback nomor pribadi">
    Onboarding mendukung mode nomor pribadi dan menulis baseline yang ramah chat-diri-sendiri:

    - `dmPolicy: "allowlist"`
    - `allowFrom` menyertakan nomor pribadi Anda
    - `selfChatMode: true`

    Saat runtime, perlindungan chat-diri-sendiri bergantung pada nomor diri yang tertaut dan `allowFrom`.

  </Accordion>

  <Accordion title="Cakupan channel hanya WhatsApp Web">
    Channel platform pesan berbasis WhatsApp Web (`Baileys`) dalam arsitektur channel OpenClaw saat ini.

    Tidak ada channel pesan WhatsApp Twilio terpisah di registry channel chat bawaan.

  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway memiliki soket WhatsApp dan loop reconnect.
- Pengiriman keluar memerlukan listener WhatsApp aktif untuk akun target.
- Chat status dan broadcast diabaikan (`@status`, `@broadcast`).
- Chat langsung menggunakan aturan sesi DM (`session.dmScope`; default `main` menggabungkan DM ke sesi utama agen).
- Sesi grup terisolasi (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web mengikuti variabel environment proxy standar di host gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varian huruf kecil). Pilih config proxy tingkat host dibanding pengaturan proxy WhatsApp khusus channel.

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.whatsapp.dmPolicy` mengontrol akses chat langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    `allowFrom` menerima nomor bergaya E.164 (dinormalisasi secara internal).

    Override multi-akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `allowFrom`) didahulukan dibanding default tingkat channel untuk akun tersebut.

    Detail perilaku runtime:

    - pairing disimpan di allow-store channel dan digabungkan dengan `allowFrom` yang dikonfigurasi
    - jika tidak ada allowlist yang dikonfigurasi, nomor diri yang tertaut diizinkan secara default
    - OpenClaw tidak pernah otomatis memasangkan DM keluar `fromMe` (pesan yang Anda kirim ke diri sendiri dari perangkat tertaut)

  </Tab>

  <Tab title="Kebijakan grup + allowlist">
    Akses grup memiliki dua lapisan:

    1. **Allowlist keanggotaan grup** (`channels.whatsapp.groups`)
       - jika `groups` dihilangkan, semua grup memenuhi syarat
       - jika `groups` ada, itu bertindak sebagai allowlist grup (`"*"` diizinkan)

    2. **Kebijakan pengirim grup** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist pengirim dilewati
       - `allowlist`: pengirim harus cocok dengan `groupAllowFrom` (atau `*`)
       - `disabled`: blokir semua pesan masuk grup

    Fallback allowlist pengirim:

    - jika `groupAllowFrom` tidak disetel, runtime fallback ke `allowFrom` jika tersedia
    - allowlist pengirim dievaluasi sebelum aktivasi mention/balasan

    Catatan: jika tidak ada blok `channels.whatsapp` sama sekali, fallback kebijakan grup runtime adalah `allowlist` (dengan log peringatan), meskipun `channels.defaults.groupPolicy` disetel.

  </Tab>

  <Tab title="Mention + /activation">
    Balasan grup memerlukan mention secara default.

    Deteksi mention mencakup:

    - mention WhatsApp eksplisit terhadap identitas bot
    - pola regex mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - deteksi implisit reply-ke-bot (pengirim balasan cocok dengan identitas bot)

    Catatan keamanan:

    - kutip/balas hanya memenuhi pembatasan mention; itu **tidak** memberikan otorisasi pengirim
    - dengan `groupPolicy: "allowlist"`, pengirim yang tidak ada di allowlist tetap diblokir meskipun mereka membalas pesan pengguna yang ada di allowlist

    Perintah aktivasi tingkat sesi:

    - `/activation mention`
    - `/activation always`

    `activation` memperbarui status sesi (bukan config global). Ini dibatasi untuk owner.

  </Tab>
</Tabs>

## Perilaku nomor pribadi dan chat-diri-sendiri

Ketika nomor diri yang tertaut juga ada di `allowFrom`, perlindungan chat-diri-sendiri WhatsApp aktif:

- lewati read receipt untuk giliran chat-diri-sendiri
- abaikan perilaku pemicu otomatis mention-JID yang jika tidak akan mem-ping diri Anda sendiri
- jika `messages.responsePrefix` tidak disetel, balasan chat-diri-sendiri default ke `[{identity.name}]` atau `[openclaw]`

## Normalisasi pesan dan konteks

<AccordionGroup>
  <Accordion title="Envelope masuk + konteks balasan">
    Pesan WhatsApp masuk dibungkus dalam envelope masuk bersama.

    Jika ada balasan kutipan, konteks ditambahkan dalam bentuk ini:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Field metadata balasan juga diisi saat tersedia (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Placeholder media dan ekstraksi lokasi/kontak">
    Pesan masuk hanya-media dinormalisasi dengan placeholder seperti:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Body lokasi menggunakan teks koordinat singkat. Label/komentar lokasi dan detail kontak/vCard dirender sebagai metadata tidak tepercaya berpagar, bukan teks prompt inline.

  </Accordion>

  <Accordion title="Injeksi riwayat grup tertunda">
    Untuk grup, pesan yang belum diproses dapat dibuffer dan disuntikkan sebagai konteks saat bot akhirnya dipicu.

    - batas default: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Penanda injeksi:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipt">
    Read receipt diaktifkan secara default untuk pesan WhatsApp masuk yang diterima.

    Nonaktifkan secara global:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Override per akun:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Giliran chat-diri-sendiri melewati read receipt meskipun diaktifkan secara global.

  </Accordion>
</AccordionGroup>

## Pengiriman, chunking, dan media

<AccordionGroup>
  <Accordion title="Chunking teks">
    - batas chunk default: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - mode `newline` lebih memilih batas paragraf (baris kosong), lalu fallback ke chunking aman berdasarkan panjang
  </Accordion>

  <Accordion title="Perilaku media keluar">
    - mendukung payload gambar, video, audio (PTT voice note), dan dokumen
    - `audio/ogg` ditulis ulang menjadi `audio/ogg; codecs=opus` untuk kompatibilitas voice note
    - pemutaran GIF animasi didukung melalui `gifPlayback: true` pada pengiriman video
    - caption diterapkan ke item media pertama saat mengirim payload balasan multi-media
    - sumber media dapat berupa HTTP(S), `file://`, atau jalur lokal
  </Accordion>

  <Accordion title="Batas ukuran media dan perilaku fallback">
    - batas penyimpanan media masuk: `channels.whatsapp.mediaMaxMb` (default `50`)
    - batas pengiriman media keluar: `channels.whatsapp.mediaMaxMb` (default `50`)
    - override per akun menggunakan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - gambar dioptimalkan otomatis (ubah ukuran/penyapuan kualitas) agar sesuai batas
    - saat pengiriman media gagal, fallback item pertama mengirim peringatan teks alih-alih diam-diam membuang respons
  </Accordion>
</AccordionGroup>

## Kutipan balasan

WhatsApp mendukung kutipan balasan native, di mana balasan keluar secara terlihat mengutip pesan masuk. Kendalikan dengan `channels.whatsapp.replyToMode`.

| Value    | Behavior                                                                           |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | Mengutip pesan masuk saat penyedia mendukungnya; lewati kutipan jika tidak         |
| `"on"`   | Selalu mengutip pesan masuk; fallback ke pengiriman biasa jika kutipan ditolak     |
| `"off"`  | Jangan pernah mengutip; kirim sebagai pesan biasa                                  |

Default adalah `"auto"`. Override per akun menggunakan `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Tingkat reaksi

`channels.whatsapp.reactionLevel` mengontrol seberapa luas agen menggunakan reaksi emoji di WhatsApp:

| Level         | Reaksi ack | Reaksi yang dimulai agen | Deskripsi                                        |
| ------------- | ---------- | ------------------------ | ------------------------------------------------ |
| `"off"`       | Tidak      | Tidak                    | Tidak ada reaksi sama sekali                     |
| `"ack"`       | Ya         | Tidak                    | Hanya reaksi ack (tanda terima sebelum balasan)  |
| `"minimal"`   | Ya         | Ya (konservatif)         | Ack + reaksi agen dengan panduan konservatif     |
| `"extensive"` | Ya         | Ya (didorong)            | Ack + reaksi agen dengan panduan yang didorong   |

Default: `"minimal"`.

Override per akun menggunakan `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Reaksi acknowledgment

WhatsApp mendukung reaksi ack langsung saat penerimaan pesan masuk melalui `channels.whatsapp.ackReaction`.
Reaksi ack dikendalikan oleh `reactionLevel` — reaksi ini ditekan ketika `reactionLevel` adalah `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Catatan perilaku:

- dikirim segera setelah pesan masuk diterima (sebelum balasan)
- kegagalan dicatat di log tetapi tidak memblokir pengiriman balasan normal
- mode grup `mentions` bereaksi pada giliran yang dipicu mention; aktivasi grup `always` bertindak sebagai bypass untuk pemeriksaan ini
- WhatsApp menggunakan `channels.whatsapp.ackReaction` (`messages.ackReaction` legacy tidak digunakan di sini)

## Multi-akun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan default">
    - id akun berasal dari `channels.whatsapp.accounts`
    - pemilihan akun default: `default` jika ada, jika tidak maka id akun pertama yang dikonfigurasi (diurutkan)
    - id akun dinormalisasi secara internal untuk lookup
  </Accordion>

  <Accordion title="Jalur kredensial dan kompatibilitas legacy">
    - jalur auth saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file cadangan: `creds.json.bak`
    - auth default legacy di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default
  </Accordion>

  <Accordion title="Perilaku logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status auth WhatsApp untuk akun tersebut.

    Di direktori auth legacy, `oauth.json` dipertahankan sementara file auth Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Alat, tindakan, dan penulisan config

- Dukungan alat agen mencakup tindakan reaksi WhatsApp (`react`).
- Gerbang tindakan:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Penulisan config yang dimulai dari channel diaktifkan secara default (nonaktifkan melalui `channels.whatsapp.configWrites=false`).

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Belum tertaut (memerlukan QR)">
    Gejala: status channel melaporkan belum tertaut.

    Perbaikan:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Tertaut tetapi terputus / loop reconnect">
    Gejala: akun tertaut dengan pemutusan berulang atau upaya reconnect.

    Perbaikan:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Jika perlu, tautkan ulang dengan `channels login`.

  </Accordion>

  <Accordion title="Tidak ada listener aktif saat mengirim">
    Pengiriman keluar gagal cepat saat tidak ada listener gateway aktif untuk akun target.

    Pastikan gateway berjalan dan akun tertaut.

  </Accordion>

  <Accordion title="Pesan grup diabaikan secara tidak terduga">
    Periksa dalam urutan ini:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entri allowlist `groups`
    - pembatasan mention (`requireMention` + pola mention)
    - kunci duplikat di `openclaw.json` (JSON5): entri belakangan menimpa entri sebelumnya, jadi pertahankan satu `groupPolicy` per scope

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Runtime gateway WhatsApp harus menggunakan Node. Bun ditandai tidak kompatibel untuk operasi gateway WhatsApp/Telegram yang stabil.
  </Accordion>
</AccordionGroup>

## Prompt sistem

WhatsApp mendukung prompt sistem bergaya Telegram untuk grup dan chat langsung melalui peta `groups` dan `direct`.

Hierarki resolusi untuk pesan grup:

Peta `groups` yang efektif ditentukan terlebih dahulu: jika akun mendefinisikan `groups` miliknya sendiri, itu sepenuhnya menggantikan peta `groups` root (tanpa deep merge). Lookup prompt kemudian berjalan pada peta tunggal yang dihasilkan:

1. **Prompt sistem khusus grup** (`groups["<groupId>"].systemPrompt`): digunakan jika entri grup tertentu mendefinisikan `systemPrompt`.
2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan ketika entri grup tertentu tidak ada atau tidak mendefinisikan `systemPrompt`.

Hierarki resolusi untuk pesan langsung:

Peta `direct` yang efektif ditentukan terlebih dahulu: jika akun mendefinisikan `direct` miliknya sendiri, itu sepenuhnya menggantikan peta `direct` root (tanpa deep merge). Lookup prompt kemudian berjalan pada peta tunggal yang dihasilkan:

1. **Prompt sistem khusus direct** (`direct["<peerId>"].systemPrompt`): digunakan jika entri peer tertentu mendefinisikan `systemPrompt`.
2. **Prompt sistem wildcard direct** (`direct["*"].systemPrompt`): digunakan ketika entri peer tertentu tidak ada atau tidak mendefinisikan `systemPrompt`.

Catatan: `dms` tetap menjadi bucket override riwayat per-DM ringan (`dms.<id>.historyLimit`); override prompt berada di bawah `direct`.

**Perbedaan dari perilaku multi-akun Telegram:** Di Telegram, `groups` root sengaja ditekan untuk semua akun dalam penyiapan multi-akun — bahkan akun yang tidak mendefinisikan `groups` miliknya sendiri — untuk mencegah bot menerima pesan grup untuk grup yang bukan anggotanya. WhatsApp tidak menerapkan pengaman ini: `groups` root dan `direct` root selalu diwarisi oleh akun yang tidak mendefinisikan override tingkat akun, terlepas dari berapa banyak akun yang dikonfigurasi. Dalam penyiapan WhatsApp multi-akun, jika Anda menginginkan prompt grup atau direct per akun, definisikan peta lengkap di bawah setiap akun secara eksplisit alih-alih bergantung pada default tingkat root.

Perilaku penting:

- `channels.whatsapp.groups` adalah peta config per-grup sekaligus allowlist grup tingkat chat. Baik pada scope root maupun akun, `groups["*"]` berarti "semua grup diterima" untuk scope tersebut.
- Tambahkan wildcard `systemPrompt` grup hanya ketika Anda memang ingin scope tersebut menerima semua grup. Jika Anda tetap ingin hanya sekumpulan tetap id grup yang memenuhi syarat, jangan gunakan `groups["*"]` untuk default prompt. Sebaliknya, ulangi prompt pada setiap entri grup yang secara eksplisit ada di allowlist.
- Penerimaan grup dan otorisasi pengirim adalah pemeriksaan terpisah. `groups["*"]` memperluas kumpulan grup yang dapat mencapai penanganan grup, tetapi tidak dengan sendirinya mengotorisasi setiap pengirim dalam grup tersebut. Akses pengirim tetap dikendalikan secara terpisah oleh `channels.whatsapp.groupPolicy` dan `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` tidak memiliki efek samping yang sama untuk DM. `direct["*"]` hanya menyediakan config chat langsung default setelah DM sudah diterima oleh `dmPolicy` plus aturan `allowFrom` atau pairing-store.

Contoh:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Gunakan hanya jika semua grup harus diterima pada scope root.
        // Berlaku untuk semua akun yang tidak mendefinisikan peta groups mereka sendiri.
        "*": { systemPrompt: "Default prompt untuk semua grup." },
      },
      direct: {
        // Berlaku untuk semua akun yang tidak mendefinisikan peta direct mereka sendiri.
        "*": { systemPrompt: "Default prompt untuk semua chat langsung." },
      },
      accounts: {
        work: {
          groups: {
            // Akun ini mendefinisikan groups miliknya sendiri, jadi groups root
            // sepenuhnya diganti. Untuk mempertahankan wildcard, definisikan "*" juga secara eksplisit di sini.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Fokus pada manajemen proyek.",
            },
            // Gunakan hanya jika semua grup harus diterima di akun ini.
            "*": { systemPrompt: "Default prompt untuk grup kerja." },
          },
          direct: {
            // Akun ini mendefinisikan peta direct miliknya sendiri, jadi entri direct root
            // sepenuhnya diganti. Untuk mempertahankan wildcard, definisikan "*" juga secara eksplisit di sini.
            "+15551234567": { systemPrompt: "Prompt untuk chat langsung kerja tertentu." },
            "*": { systemPrompt: "Default prompt untuk chat langsung kerja." },
          },
        },
      },
    },
  },
}
```

## Penunjuk referensi konfigurasi

Referensi utama:

- [Configuration reference - WhatsApp](/id/gateway/config-channels#whatsapp)

Field WhatsApp dengan sinyal tinggi:

- akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-akun: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override tingkat akun
- operasional: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- perilaku sesi: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Terkait

- [Pairing](/id/channels/pairing)
- [Groups](/id/channels/groups)
- [Security](/id/gateway/security)
- [Channel routing](/id/channels/channel-routing)
- [Multi-agent routing](/id/concepts/multi-agent)
- [Troubleshooting](/id/channels/troubleshooting)
