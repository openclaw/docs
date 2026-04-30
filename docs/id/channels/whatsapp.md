---
read_when:
    - Menangani perilaku saluran WhatsApp/web atau perutean kotak masuk
summary: Dukungan saluran WhatsApp, kontrol akses, perilaku pengiriman, dan operasi
title: WhatsApp
x-i18n:
    generated_at: "2026-04-30T09:36:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d0268e068de0001a11a6ed87fe70df8e685d1dcc87c8142ee5b3c77d7a727f3
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: siap produksi melalui WhatsApp Web (Baileys). Gateway mengelola sesi tertaut.

## Instal (sesuai kebutuhan)

- Onboarding (`openclaw onboard`) dan `openclaw channels add --channel whatsapp`
  meminta untuk menginstal plugin WhatsApp saat pertama kali Anda memilihnya.
- `openclaw channels login --channel whatsapp` juga menawarkan alur instalasi saat
  plugin belum ada.
- Kanal Dev + checkout git: default ke jalur plugin lokal.
- Stable/Beta: menggunakan paket npm `@openclaw/whatsapp` saat paket saat ini
  telah diterbitkan.

Instalasi manual tetap tersedia:

```bash
openclaw plugins install @openclaw/whatsapp
```

Jika npm melaporkan paket milik OpenClaw sebagai deprecated atau tidak ada, gunakan
build OpenClaw berpakaian saat ini atau checkout lokal hingga rangkaian paket npm
mengejar.

<CardGroup cols={3}>
  <Card title="Penyandingan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default adalah penyandingan untuk pengirim yang tidak dikenal.
  </Card>
  <Card title="Pemecahan masalah kanal" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas kanal dan playbook perbaikan.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi kanal lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Konfigurasi kebijakan akses WhatsApp">

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

  <Step title="Mulai gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Setujui permintaan penyandingan pertama (jika menggunakan mode pairing)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Permintaan penyandingan kedaluwarsa setelah 1 jam. Permintaan tertunda dibatasi hingga 3 per kanal.

  </Step>
</Steps>

<Note>
OpenClaw merekomendasikan menjalankan WhatsApp pada nomor terpisah jika memungkinkan. (Metadata kanal dan alur penyiapan dioptimalkan untuk pengaturan tersebut, tetapi pengaturan nomor pribadi juga didukung.)
</Note>

## Pola deployment

<AccordionGroup>
  <Accordion title="Nomor khusus (direkomendasikan)">
    Ini adalah mode operasional paling bersih:

    - identitas WhatsApp terpisah untuk OpenClaw
    - allowlist DM dan batas routing yang lebih jelas
    - kemungkinan lebih rendah terjadinya kebingungan self-chat

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
    Onboarding mendukung mode nomor pribadi dan menulis baseline yang ramah self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` menyertakan nomor pribadi Anda
    - `selfChatMode: true`

    Saat runtime, perlindungan self-chat bergantung pada nomor diri tertaut dan `allowFrom`.

  </Accordion>

  <Accordion title="Cakupan kanal khusus WhatsApp Web">
    Kanal platform pesan berbasis WhatsApp Web (`Baileys`) dalam arsitektur kanal OpenClaw saat ini.

    Tidak ada kanal pesan Twilio WhatsApp terpisah dalam registry kanal chat bawaan.

  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway mengelola soket WhatsApp dan loop reconnect.
- Watchdog reconnect menggunakan aktivitas transport WhatsApp Web, bukan hanya volume pesan aplikasi masuk, sehingga sesi perangkat tertaut yang sepi tidak dimulai ulang semata-mata karena tidak ada yang mengirim pesan baru-baru ini. Batas keheningan aplikasi yang lebih panjang tetap memaksa reconnect jika frame transport terus tiba tetapi tidak ada pesan aplikasi yang ditangani selama jendela watchdog; setelah reconnect sementara untuk sesi yang baru aktif, pemeriksaan keheningan aplikasi tersebut menggunakan timeout pesan normal untuk jendela pemulihan pertama.
- Timing soket Baileys bersifat eksplisit di bawah `web.whatsapp.*`: `keepAliveIntervalMs` mengontrol ping aplikasi WhatsApp Web, `connectTimeoutMs` mengontrol timeout handshake pembukaan, dan `defaultQueryTimeoutMs` mengontrol timeout kueri Baileys.
- Pengiriman keluar memerlukan listener WhatsApp aktif untuk akun target.
- Chat status dan broadcast diabaikan (`@status`, `@broadcast`).
- Watchdog reconnect mengikuti aktivitas transport WhatsApp Web, bukan hanya volume pesan aplikasi masuk: sesi perangkat tertaut yang sepi tetap aktif selama frame transport terus berlanjut, tetapi stall transport memaksa reconnect jauh sebelum jalur pemutusan jarak jauh yang lebih belakangan.
- Chat langsung menggunakan aturan sesi DM (`session.dmScope`; default `main` menggabungkan DM ke sesi utama agen).
- Sesi grup diisolasi (`agent:<agentId>:whatsapp:group:<jid>`).
- Transport WhatsApp Web mematuhi variabel lingkungan proxy standar pada host gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varian huruf kecil). Lebih pilih konfigurasi proxy tingkat host daripada pengaturan proxy WhatsApp khusus kanal.
- Saat `messages.removeAckAfterReply` diaktifkan, OpenClaw menghapus reaksi ack WhatsApp setelah balasan yang terlihat terkirim.

## Hook Plugin dan privasi

Pesan masuk WhatsApp dapat berisi konten pesan pribadi, nomor telepon,
pengidentifikasi grup, nama pengirim, dan bidang korelasi sesi. Karena itu,
WhatsApp tidak menyiarkan payload hook `message_received` masuk ke plugin
kecuali Anda secara eksplisit memilih ikut serta:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Anda dapat membatasi opt-in ke satu akun:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Aktifkan ini hanya untuk plugin yang Anda percayai untuk menerima konten dan
pengidentifikasi pesan WhatsApp masuk.

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.whatsapp.dmPolicy` mengontrol akses chat langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    `allowFrom` menerima nomor bergaya E.164 (dinormalisasi secara internal).

    Override multi-akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `allowFrom`) diprioritaskan dibanding default tingkat kanal untuk akun tersebut.

    Detail perilaku runtime:

    - pairing dipertahankan di allow-store kanal dan digabung dengan `allowFrom` yang dikonfigurasi
    - jika tidak ada allowlist yang dikonfigurasi, nomor diri tertaut diizinkan secara default
    - OpenClaw tidak pernah melakukan auto-pair DM `fromMe` keluar (pesan yang Anda kirim ke diri sendiri dari perangkat tertaut)

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

    - jika `groupAllowFrom` tidak diatur, runtime fallback ke `allowFrom` jika tersedia
    - allowlist pengirim dievaluasi sebelum aktivasi mention/reply

    Catatan: jika tidak ada blok `channels.whatsapp` sama sekali, fallback kebijakan grup runtime adalah `allowlist` (dengan log peringatan), meskipun `channels.defaults.groupPolicy` diatur.

  </Tab>

  <Tab title="Mention + /activation">
    Balasan grup memerlukan mention secara default.

    Deteksi mention mencakup:

    - mention WhatsApp eksplisit atas identitas bot
    - pola regex mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transkrip voice-note masuk untuk pesan grup yang diotorisasi
    - deteksi reply-to-bot implisit (pengirim balasan cocok dengan identitas bot)

    Catatan keamanan:

    - quote/reply hanya memenuhi gating mention; itu **tidak** memberikan otorisasi pengirim
    - dengan `groupPolicy: "allowlist"`, pengirim yang tidak ada di allowlist tetap diblokir meskipun mereka membalas pesan pengguna yang ada di allowlist

    Perintah aktivasi tingkat sesi:

    - `/activation mention`
    - `/activation always`

    `activation` memperbarui status sesi (bukan konfigurasi global). Ini dibatasi oleh owner.

  </Tab>
</Tabs>

## Perilaku nomor pribadi dan self-chat

Saat nomor diri tertaut juga ada di `allowFrom`, perlindungan self-chat WhatsApp aktif:

- lewati read receipt untuk giliran self-chat
- abaikan perilaku auto-trigger mention-JID yang jika tidak akan melakukan ping ke diri Anda sendiri
- jika `messages.responsePrefix` tidak diatur, balasan self-chat default ke `[{identity.name}]` atau `[openclaw]`

## Normalisasi pesan dan konteks

<AccordionGroup>
  <Accordion title="Envelope masuk + konteks balasan">
    Pesan WhatsApp masuk dibungkus dalam envelope masuk bersama.

    Jika balasan yang dikutip ada, konteks ditambahkan dalam bentuk ini:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Bidang metadata balasan juga diisi saat tersedia (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 pengirim).

  </Accordion>

  <Accordion title="Placeholder media dan ekstraksi lokasi/kontak">
    Pesan masuk yang hanya berisi media dinormalisasi dengan placeholder seperti:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Voice note grup yang diotorisasi ditranskripsikan sebelum gating mention saat
    body hanya `<media:audio>`, sehingga mengucapkan mention bot dalam voice note dapat
    memicu balasan. Jika transkrip masih tidak menyebut bot, transkrip
    disimpan dalam riwayat grup tertunda, bukan placeholder mentah.

    Body lokasi menggunakan teks koordinat ringkas. Label/komentar lokasi dan detail kontak/vCard dirender sebagai metadata tidak tepercaya berpagar, bukan teks prompt inline.

  </Accordion>

  <Accordion title="Injeksi riwayat grup tertunda">
    Untuk grup, pesan yang belum diproses dapat di-buffer dan diinjeksi sebagai konteks saat bot akhirnya dipicu.

    - batas default: `50`
    - konfigurasi: `channels.whatsapp.historyLimit`
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

    Giliran self-chat melewati read receipt meskipun diaktifkan secara global.

  </Accordion>
</AccordionGroup>

## Pengiriman, chunking, dan media

<AccordionGroup>
  <Accordion title="Chunking teks">
    - batas chunk default: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - mode `newline` lebih memilih batas paragraf (baris kosong), lalu fallback ke chunking yang aman panjang

  </Accordion>

  <Accordion title="Perilaku media keluar">
    - mendukung payload gambar, video, audio (catatan suara PTT), dan dokumen
    - media audio dikirim melalui payload Baileys `audio` dengan `ptt: true`, sehingga klien WhatsApp merendernya sebagai catatan suara push-to-talk
    - payload balasan mempertahankan `audioAsVoice`; keluaran catatan suara TTS untuk WhatsApp tetap berada di jalur PTT ini bahkan ketika penyedia mengembalikan MP3 atau WebM
    - audio Ogg/Opus native dikirim sebagai `audio/ogg; codecs=opus` untuk kompatibilitas catatan suara
    - audio non-Ogg, termasuk keluaran TTS MP3/WebM Microsoft Edge, ditranskode dengan `ffmpeg` ke Ogg/Opus mono 48 kHz sebelum pengiriman PTT
    - `/tts latest` mengirim balasan asisten terbaru sebagai satu catatan suara dan menekan pengiriman berulang untuk balasan yang sama; `/tts chat on|off|default` mengontrol TTS otomatis untuk chat WhatsApp saat ini
    - pemutaran GIF animasi didukung melalui `gifPlayback: true` pada pengiriman video
    - caption diterapkan ke item media pertama saat mengirim payload balasan multi-media, kecuali catatan suara PTT mengirim audio terlebih dahulu dan teks yang terlihat secara terpisah karena klien WhatsApp tidak merender caption catatan suara secara konsisten
    - sumber media dapat berupa HTTP(S), `file://`, atau path lokal

  </Accordion>

  <Accordion title="Batas ukuran media dan perilaku fallback">
    - batas penyimpanan media masuk: `channels.whatsapp.mediaMaxMb` (default `50`)
    - batas pengiriman media keluar: `channels.whatsapp.mediaMaxMb` (default `50`)
    - override per akun menggunakan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - gambar dioptimalkan secara otomatis (resize/sapuan kualitas) agar sesuai batas
    - saat pengiriman media gagal, fallback item pertama mengirim peringatan teks alih-alih menghapus respons secara diam-diam

  </Accordion>
</AccordionGroup>

## Pengutipan balasan

WhatsApp mendukung pengutipan balasan native, yaitu balasan keluar yang terlihat mengutip pesan masuk. Kontrol dengan `channels.whatsapp.replyToMode`.

| Nilai       | Perilaku                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Jangan pernah mengutip; kirim sebagai pesan biasa                     |
| `"first"`   | Kutip hanya potongan balasan keluar pertama                           |
| `"all"`     | Kutip setiap potongan balasan keluar                                  |
| `"batched"` | Kutip balasan antrean berbentuk batch sambil membiarkan balasan langsung tanpa kutipan |

Default adalah `"off"`. Override per akun menggunakan `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Tingkat reaksi

`channels.whatsapp.reactionLevel` mengontrol seberapa luas agen menggunakan reaksi emoji di WhatsApp:

| Tingkat       | Reaksi ack | Reaksi yang dimulai agen | Deskripsi                                        |
| ------------- | ---------- | ------------------------ | ------------------------------------------------ |
| `"off"`       | Tidak      | Tidak                    | Tidak ada reaksi sama sekali                     |
| `"ack"`       | Ya         | Tidak                    | Hanya reaksi ack (tanda terima pra-balasan)      |
| `"minimal"`   | Ya         | Ya (konservatif)         | Ack + reaksi agen dengan panduan konservatif     |
| `"extensive"` | Ya         | Ya (dianjurkan)          | Ack + reaksi agen dengan panduan yang dianjurkan |

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

## Reaksi pengakuan

WhatsApp mendukung reaksi ack langsung saat penerimaan masuk melalui `channels.whatsapp.ackReaction`.
Reaksi ack dibatasi oleh `reactionLevel` — reaksi ini ditekan ketika `reactionLevel` adalah `"off"`.

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

- dikirim langsung setelah pesan masuk diterima (pra-balasan)
- kegagalan dicatat di log tetapi tidak memblokir pengiriman balasan normal
- mode grup `mentions` bereaksi pada giliran yang dipicu mention; aktivasi grup `always` bertindak sebagai bypass untuk pemeriksaan ini
- WhatsApp menggunakan `channels.whatsapp.ackReaction` (`messages.ackReaction` lama tidak digunakan di sini)

## Multi-akun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan default">
    - id akun berasal dari `channels.whatsapp.accounts`
    - pemilihan akun default: `default` jika ada, jika tidak id akun pertama yang dikonfigurasi (diurutkan)
    - id akun dinormalisasi secara internal untuk lookup

  </Accordion>

  <Accordion title="Path kredensial dan kompatibilitas lama">
    - path auth saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file cadangan: `creds.json.bak`
    - auth default lama di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default

  </Accordion>

  <Accordion title="Perilaku logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status auth WhatsApp untuk akun tersebut.

    Di direktori auth lama, `oauth.json` dipertahankan sementara file auth Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Alat, tindakan, dan penulisan config

- Dukungan alat agen mencakup tindakan reaksi WhatsApp (`react`).
- Gerbang tindakan:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Penulisan config yang dimulai channel diaktifkan secara default (nonaktifkan melalui `channels.whatsapp.configWrites=false`).

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Tidak tertaut (QR diperlukan)">
    Gejala: status channel melaporkan tidak tertaut.

    Perbaikan:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Tertaut tetapi terputus / loop koneksi ulang">
    Gejala: akun tertaut dengan pemutusan berulang atau percobaan koneksi ulang.

    Akun yang sepi dapat tetap terhubung melewati timeout pesan normal; watchdog
    memulai ulang ketika aktivitas transport WhatsApp Web berhenti, socket tertutup, atau
    aktivitas tingkat aplikasi tetap senyap melewati jendela keamanan yang lebih panjang.

    Jika log menampilkan `status=408 Request Time-out Connection was lost` berulang, sesuaikan
    timing socket Baileys di bawah `web.whatsapp`. Mulailah dengan memperpendek
    `keepAliveIntervalMs` di bawah timeout idle jaringan Anda dan meningkatkan
    `connectTimeoutMs` pada tautan yang lambat atau lossy:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Perbaikan:

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Jika diperlukan, tautkan ulang dengan `channels login`.

  </Accordion>

  <Accordion title="Login QR timeout di balik proxy">
    Gejala: `openclaw channels login --channel whatsapp` gagal sebelum menampilkan kode QR yang dapat digunakan dengan `status=408 Request Time-out` atau pemutusan socket TLS.

    Login WhatsApp Web menggunakan lingkungan proxy standar host gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varian huruf kecil, dan `NO_PROXY`). Verifikasi bahwa proses gateway mewarisi env proxy dan bahwa `NO_PROXY` tidak cocok dengan `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Tidak ada listener aktif saat mengirim">
    Pengiriman keluar gagal cepat ketika tidak ada listener gateway aktif untuk akun target.

    Pastikan gateway berjalan dan akun tertaut.

  </Accordion>

  <Accordion title="Balasan muncul di transkrip tetapi tidak di WhatsApp">
    Baris transkrip mencatat apa yang dihasilkan agen. Pengiriman WhatsApp diperiksa secara terpisah: OpenClaw hanya memperlakukan auto-reply sebagai terkirim setelah Baileys mengembalikan id pesan keluar untuk setidaknya satu pengiriman teks terlihat atau media.

    Reaksi ack adalah tanda terima pra-balasan yang independen. Reaksi yang berhasil tidak membuktikan bahwa balasan teks atau media berikutnya diterima oleh WhatsApp.

    Periksa log gateway untuk `auto-reply delivery failed` atau `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Pesan grup diabaikan secara tidak terduga">
    Periksa dalam urutan ini:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entri allowlist `groups`
    - gerbang mention (`requireMention` + pola mention)
    - kunci duplikat di `openclaw.json` (JSON5): entri yang lebih baru menimpa entri sebelumnya, jadi pertahankan satu `groupPolicy` per cakupan

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Runtime gateway WhatsApp harus menggunakan Node. Bun ditandai sebagai tidak kompatibel untuk operasi gateway WhatsApp/Telegram yang stabil.
  </Accordion>
</AccordionGroup>

## Prompt sistem

WhatsApp mendukung prompt sistem bergaya Telegram untuk grup dan chat langsung melalui map `groups` dan `direct`.

Hierarki resolusi untuk pesan grup:

Map `groups` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `groups` miliknya sendiri, itu sepenuhnya menggantikan map `groups` root (tanpa deep merge). Lookup prompt kemudian berjalan pada satu map yang dihasilkan:

1. **Prompt sistem khusus grup** (`groups["<groupId>"].systemPrompt`): digunakan ketika entri grup spesifik ada di map **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan.
2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan ketika entri grup spesifik sama sekali tidak ada dari map, atau ketika entri itu ada tetapi tidak mendefinisikan kunci `systemPrompt`.

Hierarki resolusi untuk pesan langsung:

Map `direct` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `direct` miliknya sendiri, itu sepenuhnya menggantikan map `direct` root (tanpa deep merge). Lookup prompt kemudian berjalan pada satu map yang dihasilkan:

1. **Prompt sistem khusus langsung** (`direct["<peerId>"].systemPrompt`): digunakan ketika entri peer spesifik ada di map **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan.
2. **Prompt sistem wildcard langsung** (`direct["*"].systemPrompt`): digunakan ketika entri peer spesifik sama sekali tidak ada dari map, atau ketika entri itu ada tetapi tidak mendefinisikan kunci `systemPrompt`.

<Note>
`dms` tetap menjadi bucket override riwayat per-DM yang ringan (`dms.<id>.historyLimit`). Override prompt berada di bawah `direct`.
</Note>

**Perbedaan dari perilaku multi-akun Telegram:** Di Telegram, `groups` root sengaja ditekan untuk semua akun dalam setup multi-akun — bahkan akun yang tidak mendefinisikan `groups` sendiri — untuk mencegah bot menerima pesan grup untuk grup yang bukan anggotanya. WhatsApp tidak menerapkan guard ini: `groups` root dan `direct` root selalu diwarisi oleh akun yang tidak mendefinisikan override tingkat akun, terlepas dari berapa banyak akun yang dikonfigurasi. Dalam setup WhatsApp multi-akun, jika Anda menginginkan prompt grup atau langsung per akun, definisikan map lengkap di bawah setiap akun secara eksplisit alih-alih mengandalkan default tingkat root.

Perilaku penting:

- `channels.whatsapp.groups` adalah peta konfigurasi per grup sekaligus allowlist grup tingkat chat. Pada cakupan root atau akun, `groups["*"]` berarti "semua grup diizinkan masuk" untuk cakupan tersebut.
- Hanya tambahkan grup wildcard `systemPrompt` ketika Anda memang ingin cakupan tersebut mengizinkan semua grup masuk. Jika Anda masih hanya ingin sekumpulan tetap ID grup yang memenuhi syarat, jangan gunakan `groups["*"]` untuk default prompt. Sebagai gantinya, ulangi prompt pada setiap entri grup yang diizinkan secara eksplisit.
- Penerimaan grup dan otorisasi pengirim adalah pemeriksaan terpisah. `groups["*"]` memperluas kumpulan grup yang dapat mencapai penanganan grup, tetapi itu sendiri tidak mengotorisasi setiap pengirim di grup tersebut. Akses pengirim tetap dikontrol secara terpisah oleh `channels.whatsapp.groupPolicy` dan `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` tidak memiliki efek samping yang sama untuk DM. `direct["*"]` hanya menyediakan konfigurasi direct-chat default setelah sebuah DM sudah diizinkan masuk oleh `dmPolicy` plus aturan `allowFrom` atau pairing-store.

Contoh:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Penunjuk referensi konfigurasi

Referensi utama:

- [Referensi konfigurasi - WhatsApp](/id/gateway/config-channels#whatsapp)

Field WhatsApp sinyal tinggi:

- akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-akun: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override tingkat akun
- operasi: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- perilaku sesi: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Terkait

- [Pairing](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Keamanan](/id/gateway/security)
- [Perutean channel](/id/channels/channel-routing)
- [Perutean multi-agent](/id/concepts/multi-agent)
- [Pemecahan masalah](/id/channels/troubleshooting)
