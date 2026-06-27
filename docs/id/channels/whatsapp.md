---
read_when:
    - Bekerja pada perilaku kanal WhatsApp/web atau perutean kotak masuk
summary: Dukungan saluran WhatsApp, kontrol akses, perilaku pengiriman, dan operasi
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:13:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: siap produksi melalui WhatsApp Web (Baileys). Gateway memiliki sesi tertaut.

## Instal (sesuai permintaan)

- Onboarding (`openclaw onboard`) dan `openclaw channels add --channel whatsapp`
  meminta untuk menginstal Plugin WhatsApp saat pertama kali Anda memilihnya.
- `openclaw channels login --channel whatsapp` juga menawarkan alur instal ketika
  Plugin belum tersedia.
- Kanal dev + checkout git: secara default menggunakan jalur Plugin lokal.
- Stable/Beta: menginstal Plugin resmi `@openclaw/whatsapp` dari ClawHub
  terlebih dahulu, dengan npm sebagai fallback.
- Runtime WhatsApp didistribusikan di luar paket npm inti OpenClaw agar
  dependensi runtime khusus WhatsApp tetap berada bersama Plugin eksternal.

Instal manual tetap tersedia:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Gunakan paket npm polos (`@openclaw/whatsapp`) hanya saat Anda membutuhkan
fallback registri. Sematkan versi persis hanya saat Anda membutuhkan instal yang dapat direproduksi.

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

    Login saat ini berbasis QR. Di lingkungan jarak jauh atau headless, pastikan Anda
    memiliki jalur andal untuk mengirimkan kode QR langsung ke ponsel yang akan memindainya
    sebelum memulai login.

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

  <Step title="Setujui permintaan penyandingan pertama (jika menggunakan mode penyandingan)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Permintaan penyandingan kedaluwarsa setelah 1 jam. Permintaan tertunda dibatasi 3 per kanal.

  </Step>
</Steps>

<Note>
OpenClaw merekomendasikan menjalankan WhatsApp pada nomor terpisah bila memungkinkan. (Metadata kanal dan alur penyiapan dioptimalkan untuk penyiapan tersebut, tetapi penyiapan nomor pribadi juga didukung.)
</Note>

<Warning>
Alur penyiapan WhatsApp saat ini hanya QR. QR yang dirender terminal, tangkapan layar,
PDF, atau lampiran chat dapat kedaluwarsa atau menjadi tidak terbaca saat diteruskan
dari mesin jarak jauh. Untuk host jarak jauh/headless, pilih jalur penyerahan gambar QR langsung
daripada tangkapan terminal manual.
</Warning>

## Pola deployment

<AccordionGroup>
  <Accordion title="Nomor khusus (direkomendasikan)">
    Ini adalah mode operasional paling bersih:

    - identitas WhatsApp terpisah untuk OpenClaw
    - allowlist DM dan batas routing yang lebih jelas
    - kemungkinan lebih rendah kebingungan chat dengan diri sendiri

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
    Onboarding mendukung mode nomor pribadi dan menulis baseline yang ramah chat dengan diri sendiri:

    - `dmPolicy: "allowlist"`
    - `allowFrom` menyertakan nomor pribadi Anda
    - `selfChatMode: true`

    Saat runtime, perlindungan chat dengan diri sendiri mengacu pada nomor diri yang tertaut dan `allowFrom`.

  </Accordion>

  <Accordion title="Cakupan kanal khusus WhatsApp Web">
    Kanal platform pesan berbasis WhatsApp Web (`Baileys`) dalam arsitektur kanal OpenClaw saat ini.

    Tidak ada kanal pesan Twilio WhatsApp terpisah dalam registri kanal-chat bawaan.

  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway memiliki socket WhatsApp dan loop sambung ulang.
- Watchdog sambung ulang menggunakan aktivitas transport WhatsApp Web, bukan hanya volume pesan aplikasi masuk, sehingga sesi perangkat tertaut yang sepi tidak dimulai ulang hanya karena belum ada yang mengirim pesan baru-baru ini. Batas kesenyapan aplikasi yang lebih panjang tetap memaksa sambung ulang jika frame transport terus datang tetapi tidak ada pesan aplikasi yang ditangani selama jendela watchdog; setelah sambung ulang sementara untuk sesi yang baru-baru ini aktif, pemeriksaan kesenyapan aplikasi tersebut menggunakan timeout pesan normal untuk jendela pemulihan pertama.
- Timing socket Baileys bersifat eksplisit di bawah `web.whatsapp.*`: `keepAliveIntervalMs` mengontrol ping aplikasi WhatsApp Web, `connectTimeoutMs` mengontrol timeout handshake pembukaan, dan `defaultQueryTimeoutMs` mengontrol waktu tunggu kueri Baileys serta batas operasi kirim/presence keluar lokal dan read-receipt masuk OpenClaw.
- Pengiriman keluar memerlukan listener WhatsApp aktif untuk akun target.
- Pengiriman grup melampirkan metadata mention native untuk token `@+<digits>` dan `@<digits>` dalam teks dan keterangan media saat token cocok dengan metadata peserta WhatsApp saat ini, termasuk grup berbasis LID.
- Chat status dan broadcast diabaikan (`@status`, `@broadcast`).
- Watchdog sambung ulang mengikuti aktivitas transport WhatsApp Web, bukan hanya volume pesan aplikasi masuk: sesi perangkat tertaut yang sepi tetap berjalan selama frame transport berlanjut, tetapi stall transport memaksa sambung ulang jauh sebelum jalur pemutusan jarak jauh yang lebih belakangan.
- Chat langsung menggunakan aturan sesi DM (`session.dmScope`; default `main` menggabungkan DM ke sesi utama agen).
- Sesi grup diisolasi (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters dapat menjadi target keluar eksplisit dengan JID native `@newsletter`. Pengiriman newsletter keluar menggunakan metadata sesi kanal (`agent:<agentId>:whatsapp:channel:<jid>`) alih-alih semantik sesi DM.
- Transport WhatsApp Web menghormati variabel lingkungan proxy standar di host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varian huruf kecil). Pilih konfigurasi proxy tingkat host daripada pengaturan proxy WhatsApp khusus kanal.
- Saat `messages.removeAckAfterReply` diaktifkan, OpenClaw menghapus reaksi ack WhatsApp setelah balasan terlihat dikirim.

## Prompt persetujuan

WhatsApp dapat merender prompt persetujuan exec dan Plugin dengan reaksi `👍` / `👎`. Pengiriman
dikendalikan oleh konfigurasi penerusan persetujuan tingkat atas:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` dan `approvals.plugin` bersifat independen. Mengaktifkan WhatsApp sebagai kanal hanya menautkan
transport; itu tidak mengirim prompt persetujuan kecuali keluarga persetujuan yang cocok diaktifkan
dan merutekan ke WhatsApp. Mode sesi mengirim persetujuan emoji native hanya untuk persetujuan yang
berasal dari WhatsApp. Mode target menggunakan pipeline penerusan bersama untuk target WhatsApp eksplisit
dan tidak membuat fanout DM pemberi persetujuan terpisah.

Reaksi persetujuan WhatsApp memerlukan pemberi persetujuan WhatsApp eksplisit dari `allowFrom` atau `"*"`.
`defaultTo` mengontrol target pesan default biasa; itu bukan pemberi persetujuan persetujuan. Perintah
`/approve` manual tetap melewati jalur otorisasi pengirim WhatsApp normal sebelum
resolusi persetujuan.

## Hook Plugin dan privasi

Pesan masuk WhatsApp dapat berisi konten pesan pribadi, nomor telepon,
pengidentifikasi grup, nama pengirim, dan kolom korelasi sesi. Karena alasan itu,
WhatsApp tidak menyiarkan payload hook `message_received` masuk ke Plugin
kecuali Anda secara eksplisit ikut serta:

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

Anda dapat membatasi keikutsertaan ke satu akun:

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

Aktifkan ini hanya untuk Plugin yang Anda percayai untuk menerima konten dan
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

    `allowFrom` adalah daftar kontrol akses pengirim DM. Ini tidak membatasi pengiriman keluar eksplisit ke JID grup WhatsApp atau JID kanal `@newsletter`.

    Override multi-akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `allowFrom`) lebih diutamakan daripada default tingkat kanal untuk akun tersebut.

    Detail perilaku runtime:

    - penyandingan dipersistenkan di allow-store kanal dan digabungkan dengan `allowFrom` yang dikonfigurasi
    - otomasi terjadwal dan fallback penerima Heartbeat menggunakan target pengiriman eksplisit atau `allowFrom` yang dikonfigurasi; persetujuan penyandingan DM bukan penerima Cron atau Heartbeat implisit
    - jika tidak ada allowlist yang dikonfigurasi, nomor diri yang tertaut diizinkan secara default
    - OpenClaw tidak pernah memasangkan otomatis DM `fromMe` keluar (pesan yang Anda kirim ke diri sendiri dari perangkat tertaut)

  </Tab>

  <Tab title="Kebijakan grup + allowlist">
    Akses grup memiliki dua lapisan:

    1. **Allowlist keanggotaan grup** (`channels.whatsapp.groups`)
       - jika `groups` dihilangkan, semua grup memenuhi syarat
       - jika `groups` ada, itu bertindak sebagai allowlist grup (`"*"` diizinkan)

    2. **Kebijakan pengirim grup** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist pengirim dilewati
       - `allowlist`: pengirim harus cocok dengan `groupAllowFrom` (atau `*`)
       - `disabled`: blokir semua masuk grup

    Fallback allowlist pengirim:

    - jika `groupAllowFrom` tidak disetel, runtime fallback ke `allowFrom` saat tersedia
    - allowlist pengirim dievaluasi sebelum aktivasi mention/balasan

    Catatan: jika tidak ada blok `channels.whatsapp` sama sekali, fallback kebijakan grup runtime adalah `allowlist` (dengan log peringatan), meskipun `channels.defaults.groupPolicy` disetel.

  </Tab>

  <Tab title="Mention + /activation">
    Balasan grup memerlukan mention secara default.

    Deteksi mention mencakup:

    - mention WhatsApp eksplisit atas identitas bot
    - pola regex mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transkrip catatan suara masuk untuk pesan grup yang berwenang
    - deteksi reply-to-bot implisit (pengirim balasan cocok dengan identitas bot)

    Catatan keamanan:

    - kutipan/balasan hanya memenuhi gating mention; itu **tidak** memberikan otorisasi pengirim
    - dengan `groupPolicy: "allowlist"`, pengirim yang tidak ada di allowlist tetap diblokir meskipun mereka membalas pesan pengguna yang ada di allowlist

    Perintah aktivasi tingkat sesi:

    - `/activation mention`
    - `/activation always`

    `activation` memperbarui state sesi (bukan konfigurasi global). Ini dibatasi pemilik.

  </Tab>
</Tabs>

## Binding ACP terkonfigurasi

WhatsApp mendukung binding ACP persisten dengan entri `bindings[]` tingkat atas:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- Chat langsung cocok dengan nomor E.164 seperti `+15555550123`.
- Grup cocok dengan JID grup WhatsApp seperti `120363424282127706@g.us`.
- Daftar izinkan grup, kebijakan pengirim, serta pembatasan mention atau aktivasi berjalan sebelum OpenClaw memastikan sesi ACP yang dikonfigurasi sudah ada.
- Binding ACP terkonfigurasi yang cocok memiliki rute tersebut. Grup siaran WhatsApp tidak menyebarkan giliran itu ke sesi WhatsApp biasa.

## Perilaku nomor pribadi dan chat diri sendiri

Ketika nomor diri yang ditautkan juga ada di `allowFrom`, pengamanan chat diri sendiri WhatsApp aktif:

- lewati tanda terima baca untuk giliran chat diri sendiri
- abaikan perilaku pemicu otomatis mention-JID yang jika tidak demikian akan melakukan ping ke diri Anda sendiri
- jika `messages.responsePrefix` belum diatur, balasan chat diri sendiri secara default menjadi `[{identity.name}]` atau `[openclaw]`

## Normalisasi pesan dan konteks

<AccordionGroup>
  <Accordion title="Envelope masuk + konteks balasan">
    Pesan WhatsApp masuk dibungkus dalam envelope masuk bersama.

    Jika ada balasan yang dikutip, konteks ditambahkan dalam bentuk ini:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Kolom metadata balasan juga diisi saat tersedia (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 pengirim).
    Ketika target balasan yang dikutip adalah media yang dapat diunduh, OpenClaw menyimpannya melalui
    penyimpanan media masuk normal dan mengeksposnya sebagai `MediaPath`/`MediaType` sehingga
    agen dapat memeriksa gambar yang dirujuk alih-alih hanya melihat
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholder media dan ekstraksi lokasi/kontak">
    Pesan masuk yang hanya berisi media dinormalisasi dengan placeholder seperti:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Catatan suara grup yang berwenang ditranskripsi sebelum pembatasan mention ketika
    isi hanya `<media:audio>`, sehingga menyebut mention bot di catatan suara dapat
    memicu balasan. Jika transkrip tetap tidak menyebut bot, transkrip
    disimpan dalam riwayat grup tertunda alih-alih placeholder mentah.

    Isi lokasi menggunakan teks koordinat ringkas. Label/komentar lokasi dan detail kontak/vCard dirender sebagai metadata tidak tepercaya berpagar, bukan teks prompt inline.

  </Accordion>

  <Accordion title="Injeksi riwayat grup tertunda">
    Untuk grup, pesan yang belum diproses dapat dibuffer dan diinjeksi sebagai konteks ketika bot akhirnya dipicu.

    - batas default: `50`
    - konfigurasi: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Penanda injeksi:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Tanda terima baca">
    Tanda terima baca diaktifkan secara default untuk pesan WhatsApp masuk yang diterima.

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

    Giliran chat diri sendiri melewati tanda terima baca meskipun diaktifkan secara global.

  </Accordion>
</AccordionGroup>

## Pengiriman, pemotongan, dan media

<AccordionGroup>
  <Accordion title="Pemotongan teks">
    - batas potongan default: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - mode `newline` mengutamakan batas paragraf (baris kosong), lalu fallback ke pemotongan yang aman secara panjang

  </Accordion>

  <Accordion title="Perilaku media keluar">
    - mendukung payload gambar, video, audio (catatan suara PTT), dan dokumen
    - media audio dikirim melalui payload `audio` Baileys dengan `ptt: true`, sehingga klien WhatsApp merendernya sebagai catatan suara push-to-talk
    - payload balasan mempertahankan `audioAsVoice`; keluaran catatan suara TTS untuk WhatsApp tetap berada di jalur PTT ini meskipun penyedia mengembalikan MP3 atau WebM
    - audio Ogg/Opus native dikirim sebagai `audio/ogg; codecs=opus` untuk kompatibilitas catatan suara
    - audio non-Ogg, termasuk keluaran MP3/WebM Microsoft Edge TTS, ditranskode dengan `ffmpeg` ke Ogg/Opus mono 48 kHz sebelum pengiriman PTT
    - `/tts latest` mengirim balasan asisten terbaru sebagai satu catatan suara dan menekan pengiriman berulang untuk balasan yang sama; `/tts chat on|off|default` mengontrol TTS otomatis untuk chat WhatsApp saat ini
    - pemutaran GIF animasi didukung melalui `gifPlayback: true` pada pengiriman video
    - `forceDocument` / `asDocument` mengirim gambar, GIF, dan video keluar melalui payload dokumen Baileys untuk menghindari kompresi media WhatsApp sambil mempertahankan nama file dan jenis MIME yang diselesaikan
    - caption diterapkan ke item media pertama saat mengirim payload balasan multi-media, kecuali catatan suara PTT mengirim audio terlebih dahulu dan teks terlihat secara terpisah karena klien WhatsApp tidak merender caption catatan suara secara konsisten
    - sumber media dapat berupa HTTP(S), `file://`, atau path lokal

  </Accordion>

  <Accordion title="Batas ukuran media dan perilaku fallback">
    - batas simpan media masuk: `channels.whatsapp.mediaMaxMb` (default `50`)
    - batas kirim media keluar: `channels.whatsapp.mediaMaxMb` (default `50`)
    - override per akun menggunakan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - gambar dioptimalkan otomatis (penyapuan ubah ukuran/kualitas) agar sesuai batas kecuali `forceDocument` / `asDocument` meminta pengiriman dokumen
    - saat pengiriman media gagal, fallback item pertama mengirim peringatan teks alih-alih membuang respons secara diam-diam

  </Accordion>
</AccordionGroup>

## Pengutipan balasan

WhatsApp mendukung pengutipan balasan native, dengan balasan keluar yang terlihat mengutip pesan masuk. Kontrol ini dengan `channels.whatsapp.replyToMode`.

| Nilai       | Perilaku                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Jangan pernah mengutip; kirim sebagai pesan biasa                     |
| `"first"`   | Kutip hanya potongan balasan keluar pertama                           |
| `"all"`     | Kutip setiap potongan balasan keluar                                  |
| `"batched"` | Kutip balasan batch yang diantrikan sambil membiarkan balasan langsung tidak dikutip |

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

## Level reaksi

`channels.whatsapp.reactionLevel` mengontrol seberapa luas agen menggunakan reaksi emoji di WhatsApp:

| Level         | Reaksi ack | Reaksi yang dimulai agen | Deskripsi                                      |
| ------------- | ---------- | ------------------------ | ---------------------------------------------- |
| `"off"`       | Tidak      | Tidak                    | Tidak ada reaksi sama sekali                   |
| `"ack"`       | Ya         | Tidak                    | Hanya reaksi ack (tanda terima sebelum balasan) |
| `"minimal"`   | Ya         | Ya (konservatif)         | Ack + reaksi agen dengan panduan konservatif   |
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

WhatsApp mendukung reaksi ack langsung pada tanda terima masuk melalui `channels.whatsapp.ackReaction`.
Reaksi ack dibatasi oleh `reactionLevel` — reaksi tersebut ditekan ketika `reactionLevel` adalah `"off"`.

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

- dikirim langsung setelah pesan masuk diterima (sebelum balasan)
- jika `ackReaction` ada tanpa `emoji`, WhatsApp menggunakan emoji identitas agen yang dirutekan, dengan fallback ke "👀"; hilangkan `ackReaction` atau atur `emoji: ""` agar tidak mengirim reaksi ack
- kegagalan dicatat di log tetapi tidak memblokir pengiriman balasan normal
- mode grup `mentions` bereaksi pada giliran yang dipicu mention; aktivasi grup `always` bertindak sebagai bypass untuk pemeriksaan ini
- WhatsApp menggunakan `channels.whatsapp.ackReaction` (`messages.ackReaction` legacy tidak digunakan di sini)

## Reaksi status siklus hidup

Atur `messages.statusReactions.enabled: true` agar WhatsApp mengganti reaksi ack selama suatu giliran alih-alih meninggalkan emoji tanda terima statis. Saat diaktifkan, OpenClaw menggunakan slot reaksi pesan masuk yang sama untuk status siklus hidup seperti diantrikan, berpikir, aktivitas alat, Compaction, selesai, dan error.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Catatan perilaku:

- `channels.whatsapp.ackReaction` tetap mengontrol apakah reaksi status memenuhi syarat untuk pesan langsung dan grup.
- Reaksi status antrean menggunakan emoji ack efektif yang sama seperti reaksi ack biasa.
- WhatsApp memiliki satu slot reaksi bot per pesan, sehingga pembaruan siklus hidup mengganti reaksi saat ini di tempat.
- `messages.removeAckAfterReply: true` menghapus reaksi status final setelah penahanan selesai/error yang dikonfigurasi.
- Kategori emoji alat mencakup `tool`, `coding`, `web`, `deploy`, `build`, dan `concierge`.

## Multi-akun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan default">
    - id akun berasal dari `channels.whatsapp.accounts`
    - pemilihan akun default: `default` jika ada, jika tidak id akun terkonfigurasi pertama (diurutkan)
    - id akun dinormalisasi secara internal untuk pencarian

  </Accordion>

  <Accordion title="Path kredensial dan kompatibilitas legacy">
    - path auth saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file cadangan: `creds.json.bak`
    - auth default legacy di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default

  </Accordion>

  <Accordion title="Perilaku logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status auth WhatsApp untuk akun tersebut.

    Ketika Gateway dapat dijangkau, logout terlebih dahulu menghentikan listener WhatsApp live untuk akun yang dipilih sehingga sesi tertaut tidak terus menerima pesan sampai restart berikutnya. `openclaw channels remove --channel whatsapp` juga menghentikan listener live sebelum menonaktifkan atau menghapus konfigurasi akun.

    Di direktori auth legacy, `oauth.json` dipertahankan sementara file auth Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Alat, aksi, dan penulisan konfigurasi

- Dukungan alat agen mencakup aksi reaksi WhatsApp (`react`).
- Gerbang aksi:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Penulisan konfigurasi yang dimulai channel diaktifkan secara default (nonaktifkan melalui `channels.whatsapp.configWrites=false`).

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

  <Accordion title="Tertaut tetapi terputus / loop penyambungan ulang">
    Gejala: akun tertaut dengan pemutusan berulang atau upaya penyambungan ulang.

    Akun yang sepi dapat tetap terhubung melewati batas waktu pesan normal; watchdog
    memulai ulang ketika aktivitas transport WhatsApp Web berhenti, socket ditutup, atau
    aktivitas tingkat aplikasi tetap sunyi melewati jendela keamanan yang lebih panjang.

    Jika log menampilkan `status=408 Request Time-out Connection was lost` berulang, sesuaikan
    waktu socket Baileys di bawah `web.whatsapp`. Mulailah dengan mempersingkat
    `keepAliveIntervalMs` di bawah batas waktu idle jaringan Anda dan meningkatkan
    `connectTimeoutMs` pada koneksi yang lambat atau sering kehilangan paket:

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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Jika loop tetap terjadi setelah konektivitas host dan pengaturan waktu diperbaiki, cadangkan
    direktori autentikasi akun lalu tautkan ulang akun tersebut:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Jika `~/.openclaw/logs/whatsapp-health.log` mengatakan `Gateway inactive` tetapi
    `openclaw gateway status` dan `openclaw channels status --probe` menunjukkan
    Gateway dan WhatsApp sehat, jalankan `openclaw doctor`. Di Linux, doctor
    memperingatkan tentang entri crontab lama yang masih memanggil
    `~/.openclaw/bin/ensure-whatsapp.sh`; hapus entri usang tersebut dengan
    `crontab -e` karena cron bisa tidak memiliki lingkungan user-bus systemd dan
    membuat skrip lama itu salah melaporkan kesehatan Gateway.

    Jika diperlukan, tautkan ulang dengan `channels login`.

  </Accordion>

  <Accordion title="Login QR habis waktu di balik proxy">
    Gejala: `openclaw channels login --channel whatsapp` gagal sebelum menampilkan kode QR yang dapat digunakan dengan `status=408 Request Time-out` atau socket TLS terputus.

    Login WhatsApp Web menggunakan lingkungan proxy standar host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varian huruf kecil, dan `NO_PROXY`). Pastikan proses Gateway mewarisi env proxy dan bahwa `NO_PROXY` tidak cocok dengan `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Tidak ada listener aktif saat mengirim">
    Pengiriman keluar gagal cepat saat tidak ada listener Gateway aktif untuk akun target.

    Pastikan Gateway berjalan dan akun sudah ditautkan.

  </Accordion>

  <Accordion title="Balasan muncul di transkrip tetapi tidak di WhatsApp">
    Baris transkrip mencatat apa yang dihasilkan agen. Pengiriman WhatsApp diperiksa secara terpisah: OpenClaw hanya menganggap balasan otomatis telah terkirim setelah Baileys mengembalikan id pesan keluar untuk setidaknya satu pengiriman teks atau media yang terlihat.

    Reaksi ack adalah tanda terima pra-balasan yang independen. Reaksi yang berhasil tidak membuktikan bahwa balasan teks atau media berikutnya diterima oleh WhatsApp.

    Periksa log Gateway untuk `auto-reply delivery failed` atau `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Pesan grup tiba-tiba diabaikan">
    Periksa dengan urutan ini:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entri daftar izin `groups`
    - pembatasan mention (`requireMention` + pola mention)
    - kunci duplikat di `openclaw.json` (JSON5): entri berikutnya menimpa entri sebelumnya, jadi pertahankan satu `groupPolicy` per cakupan

    Jika `channels.whatsapp.groups` ada, WhatsApp masih dapat mengamati pesan dari grup lain, tetapi OpenClaw membuangnya sebelum perutean sesi. Tambahkan JID grup ke `channels.whatsapp.groups` atau tambahkan `groups["*"]` untuk mengizinkan semua grup sambil tetap mempertahankan otorisasi pengirim di bawah `groupPolicy` dan `groupAllowFrom`.

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Runtime Gateway WhatsApp harus menggunakan Node. Bun ditandai tidak kompatibel untuk operasi Gateway WhatsApp/Telegram yang stabil.
  </Accordion>
</AccordionGroup>

## Prompt sistem

WhatsApp mendukung prompt sistem bergaya Telegram untuk grup dan chat langsung melalui map `groups` dan `direct`.

Hierarki resolusi untuk pesan grup:

Map `groups` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `groups` miliknya sendiri, itu sepenuhnya menggantikan map `groups` root (tanpa deep merge). Pencarian prompt lalu berjalan pada satu map yang dihasilkan:

1. **Prompt sistem khusus grup** (`groups["<groupId>"].systemPrompt`): digunakan saat entri grup tertentu ada di map **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan.
2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan saat entri grup tertentu sama sekali tidak ada dari map, atau saat entri itu ada tetapi tidak mendefinisikan kunci `systemPrompt`.

Hierarki resolusi untuk pesan langsung:

Map `direct` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `direct` miliknya sendiri, itu sepenuhnya menggantikan map `direct` root (tanpa deep merge). Pencarian prompt lalu berjalan pada satu map yang dihasilkan:

1. **Prompt sistem khusus langsung** (`direct["<peerId>"].systemPrompt`): digunakan saat entri peer tertentu ada di map **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan.
2. **Prompt sistem wildcard langsung** (`direct["*"].systemPrompt`): digunakan saat entri peer tertentu sama sekali tidak ada dari map, atau saat entri itu ada tetapi tidak mendefinisikan kunci `systemPrompt`.

<Note>
`dms` tetap menjadi bucket override riwayat per-DM yang ringan (`dms.<id>.historyLimit`). Override prompt berada di bawah `direct`.
</Note>

**Perbedaan dari perilaku multi-akun Telegram:** Di Telegram, root `groups` sengaja ditekan untuk semua akun dalam penyiapan multi-akun — bahkan akun yang tidak mendefinisikan `groups` sendiri — untuk mencegah bot menerima pesan grup untuk grup yang bukan anggotanya. WhatsApp tidak menerapkan pengaman ini: root `groups` dan root `direct` selalu diwarisi oleh akun yang tidak mendefinisikan override tingkat akun, berapa pun jumlah akun yang dikonfigurasi. Dalam penyiapan WhatsApp multi-akun, jika Anda menginginkan prompt grup atau langsung per akun, definisikan map lengkap di bawah setiap akun secara eksplisit alih-alih mengandalkan default tingkat root.

Perilaku penting:

- `channels.whatsapp.groups` adalah map konfigurasi per grup sekaligus daftar izin grup tingkat chat. Pada cakupan root atau akun, `groups["*"]` berarti "semua grup diizinkan" untuk cakupan tersebut.
- Hanya tambahkan `systemPrompt` grup wildcard saat Anda memang ingin cakupan tersebut mengizinkan semua grup. Jika Anda tetap ingin hanya serangkaian ID grup tetap yang memenuhi syarat, jangan gunakan `groups["*"]` untuk default prompt. Sebagai gantinya, ulangi prompt pada setiap entri grup yang diizinkan secara eksplisit.
- Penerimaan grup dan otorisasi pengirim adalah pemeriksaan terpisah. `groups["*"]` memperluas kumpulan grup yang dapat mencapai penanganan grup, tetapi itu sendiri tidak mengotorisasi setiap pengirim di grup tersebut. Akses pengirim tetap dikontrol secara terpisah oleh `channels.whatsapp.groupPolicy` dan `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` tidak memiliki efek samping yang sama untuk DM. `direct["*"]` hanya menyediakan konfigurasi chat langsung default setelah DM sudah diterima oleh `dmPolicy` ditambah `allowFrom` atau aturan pairing-store.

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

## Petunjuk referensi konfigurasi

Referensi utama:

- [Referensi konfigurasi - WhatsApp](/id/gateway/config-channels#whatsapp)

Kolom WhatsApp bernilai tinggi:

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
- [Perutean multi-agen](/id/concepts/multi-agent)
- [Pemecahan masalah](/id/channels/troubleshooting)
