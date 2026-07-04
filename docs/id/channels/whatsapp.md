---
read_when:
    - Bekerja pada perilaku kanal WhatsApp/web atau perutean kotak masuk
summary: Dukungan kanal WhatsApp, kontrol akses, perilaku pengiriman, dan operasi
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T11:02:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: siap produksi melalui WhatsApp Web (Baileys). Gateway memiliki sesi tertaut.

## Instalasi (sesuai permintaan)

- Onboarding (`openclaw onboard`) dan `openclaw channels add --channel whatsapp`
  meminta Anda memasang Plugin WhatsApp saat pertama kali memilihnya.
- `openclaw channels login --channel whatsapp` juga menawarkan alur instalasi ketika
  Plugin belum tersedia.
- Channel dev + checkout git: default ke jalur Plugin lokal.
- Stable/Beta: memasang Plugin resmi `@openclaw/whatsapp` dari ClawHub
  terlebih dahulu, dengan npm sebagai fallback.
- Runtime WhatsApp didistribusikan di luar paket npm inti OpenClaw agar
  dependensi runtime khusus WhatsApp tetap berada bersama Plugin eksternal.

Instalasi manual tetap tersedia:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Gunakan paket npm polos (`@openclaw/whatsapp`) hanya ketika Anda memerlukan fallback
registry. Sematkan versi persis hanya ketika Anda memerlukan instalasi yang dapat direproduksi.

<CardGroup cols={3}>
  <Card title="Penyandingan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default adalah penyandingan untuk pengirim yang tidak dikenal.
  </Card>
  <Card title="Pemecahan masalah channel" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas channel dan playbook perbaikan.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi channel lengkap.
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
    memiliki jalur yang andal untuk mengirimkan kode QR langsung ke ponsel yang akan memindainya
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

  <Step title="Mulai gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Setujui permintaan penyandingan pertama (jika menggunakan mode penyandingan)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Permintaan penyandingan kedaluwarsa setelah 1 jam. Permintaan tertunda dibatasi hingga 3 per channel.

  </Step>
</Steps>

<Note>
OpenClaw merekomendasikan menjalankan WhatsApp pada nomor terpisah jika memungkinkan. (Metadata channel dan alur penyiapan dioptimalkan untuk penyiapan tersebut, tetapi penyiapan nomor pribadi juga didukung.)
</Note>

<Warning>
Alur penyiapan WhatsApp saat ini hanya QR. QR yang dirender terminal, tangkapan layar,
PDF, atau lampiran chat dapat kedaluwarsa atau menjadi tidak terbaca saat diteruskan
dari mesin jarak jauh. Untuk host jarak jauh/headless, lebih utamakan jalur serah terima gambar QR langsung
daripada tangkapan terminal manual.
</Warning>

## Panggil pemohon saat ini dengan MeowCaller (eksperimental)

Plugin WhatsApp dapat mengekspos `whatsapp_call` dalam giliran agen yang berasal dari WhatsApp. Tool ini
menggunakan [MeowCaller](https://github.com/purpshell/meowcaller) untuk melakukan panggilan suara WhatsApp ke
pemohon resmi saat ini dan memutar pesan TTS OpenClaw setelah mereka menjawab. Tool ini
tidak menerima nomor tujuan, sehingga prompt tidak dapat mengalihkan panggilan ke pihak ketiga.
Kapabilitas eksperimental ini dinonaktifkan secara default.

<Warning>
MeowCaller bersifat eksperimental, tidak memiliki rilis bertag, dan menggunakan sesi perangkat tertaut whatsmeow
yang dipasangkan secara terpisah. Ia tidak dapat menggunakan ulang kredensial Baileys milik Plugin WhatsApp. Penyandingan menambahkan
perangkat tertaut lain ke akun WhatsApp yang sama. Pindai dengan identitas WhatsApp yang digunakan oleh
OpenClaw. Mode nomor pribadi/chat mandiri tidak dapat memanggil dirinya sendiri; gunakan nomor OpenClaw khusus
untuk memanggil nomor pribadi Anda.
</Warning>

<Steps>
  <Step title="Aktifkan panggilan eksperimental">

    Tambahkan `actions.calls: true` ke channel WhatsApp di `openclaw.json`:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Gabungkan ini ke konfigurasi WhatsApp yang sudah ada, lalu mulai ulang gateway. Ketika
    pengaturan tidak ada atau `false`, OpenClaw tidak mengekspos tool `whatsapp_call` kepada agen.

  </Step>

  <Step title="Instal CLI MeowCaller yang telah ditinjau">

    Adapter mengharapkan executable bernama `meowcaller` pada `PATH` host gateway.
    Hingga [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) digabungkan, build
    branch yang telah ditinjau pada commit `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Pastikan `$HOME/.local/bin` juga berada di `PATH` layanan gateway. Revisi ini menyediakan
    perintah `pair` eksplisit dan `notify` hanya-kirim. `notify` tidak membuka mikrofon, speaker,
    perangkat video, sink audio masuk, atau tangkapan diagnostik. Jangan mengganti dengan perintah
    `play` dari contoh CLI.

  </Step>

  <Step title="Sandingkan perangkat tertaut MeowCaller">

    Minta agen WhatsApp memeriksa penyiapan panggilan. Tindakan status `whatsapp_call` melaporkan
    direktori status khusus akun dan perintah penyandingan. Untuk akun default:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Jalankan perintah di terminal interaktif. Pindai QR-nya dari **WhatsApp > Linked devices**
    dan tunggu `MeowCaller linked device ready`. Perintah kemudian keluar. Jaga `wa-voip.db`
    tetap privat; itu adalah sesi perangkat tertaut MeowCaller. Tindakan status `whatsapp_call`
    mengembalikan perintah dan shell khusus akun ketika Anda menggunakan akun non-default. Di
    Windows, jalankan perintah PowerShell-nya; MeowCaller membuat direktori store.

  </Step>

  <Step title="Konfigurasikan TTS dan panggil dari WhatsApp">

    Konfigurasikan [penyedia TTS](/id/tools/tts) yang mendukung telepon, mulai ulang gateway, lalu kirim
    permintaan WhatsApp seperti `Call me and say the build finished.` Tool menyelesaikan pengirim
    dari konteks masuk tepercaya, mensintesis file WAV privat sementara, menjalankan MeowCaller selama
    jendela panggilan terbatas, dan menghapus file audio setelahnya. OpenClaw meneruskan store akun
    secara eksplisit, menunggu status keluar nol setelah dijawab, pemutaran, dan penutupan panggilan, serta menganggap
    timeout atau keluar bukan nol sebagai panggilan tool yang gagal.

  </Step>
</Steps>

Batas saat ini:

- hanya panggilan audio keluar satu-ke-satu
- tanpa nomor tujuan arbitrer
- tanpa auth bersama dengan koneksi chat
- tanpa panggilan ke diri sendiri dari mode nomor pribadi/chat mandiri
- audio tersintesis dibatasi hingga 60 detik
- tanpa tanda terima keterdengaran di sisi handset selain penyelesaian jawab/pemutaran/tutup dari MeowCaller
- OpenClaw menghentikan proses pendamping setelah jendela terbatas 115-175 detik, termasuk
  fase koneksi, jawab, pemutaran, dan penghentian MeowCaller

## Pola deployment

<AccordionGroup>
  <Accordion title="Nomor khusus (direkomendasikan)">
    Ini adalah mode operasional paling bersih:

    - identitas WhatsApp terpisah untuk OpenClaw
    - allowlist DM dan batas routing yang lebih jelas
    - peluang kebingungan chat mandiri lebih rendah

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
    Onboarding mendukung mode nomor pribadi dan menulis baseline yang ramah chat mandiri:

    - `dmPolicy: "allowlist"`
    - `allowFrom` menyertakan nomor pribadi Anda
    - `selfChatMode: true`

    Saat runtime, perlindungan chat mandiri dikunci berdasarkan nomor diri yang tertaut dan `allowFrom`.

  </Accordion>

  <Accordion title="Cakupan channel khusus WhatsApp Web">
    Channel platform perpesanan berbasis WhatsApp Web (`Baileys`) dalam arsitektur channel OpenClaw saat ini.

    Tidak ada channel perpesanan Twilio WhatsApp terpisah dalam registry channel chat bawaan.

  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway memiliki soket WhatsApp dan loop koneksi ulang.
- Watchdog koneksi ulang menggunakan aktivitas transport WhatsApp Web, bukan hanya volume pesan aplikasi masuk, sehingga sesi perangkat tertaut yang sepi tidak dimulai ulang hanya karena belum ada yang mengirim pesan baru-baru ini. Batas hening aplikasi yang lebih panjang tetap memaksa koneksi ulang jika frame transport terus masuk tetapi tidak ada pesan aplikasi yang ditangani selama jendela watchdog; setelah koneksi ulang sementara untuk sesi yang baru-baru ini aktif, pemeriksaan hening aplikasi tersebut menggunakan timeout pesan normal untuk jendela pemulihan pertama.
- Timing soket Baileys eksplisit di bawah `web.whatsapp.*`: `keepAliveIntervalMs` mengontrol ping aplikasi WhatsApp Web, `connectTimeoutMs` mengontrol timeout handshake pembukaan, dan `defaultQueryTimeoutMs` mengontrol tunggu kueri Baileys plus batas operasi kirim/presence keluar lokal dan tanda terima baca masuk OpenClaw.
- Pengiriman keluar memerlukan listener WhatsApp aktif untuk akun target.
- Pengiriman grup melampirkan metadata mention native untuk token `@+<digits>` dan `@<digits>` dalam teks dan caption media ketika token cocok dengan metadata peserta WhatsApp saat ini, termasuk grup berbasis LID.
- Chat status dan broadcast diabaikan (`@status`, `@broadcast`).
- Watchdog koneksi ulang mengikuti aktivitas transport WhatsApp Web, bukan hanya volume pesan aplikasi masuk: sesi perangkat tertaut yang sepi tetap aktif selama frame transport berlanjut, tetapi stall transport memaksa koneksi ulang jauh sebelum jalur pemutusan jarak jauh yang lebih akhir.
- Chat langsung menggunakan aturan sesi DM (`session.dmScope`; default `main` menggabungkan DM ke sesi utama agen).
- Sesi grup diisolasi (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters dapat menjadi target keluar eksplisit dengan JID `@newsletter` native. Pengiriman newsletter keluar menggunakan metadata sesi channel (`agent:<agentId>:whatsapp:channel:<jid>`) alih-alih semantik sesi DM.
- Transport WhatsApp Web menghormati variabel lingkungan proxy standar pada host gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varian huruf kecil). Lebih utamakan konfigurasi proxy tingkat host daripada pengaturan proxy WhatsApp khusus channel.
- Ketika `messages.removeAckAfterReply` diaktifkan, OpenClaw menghapus reaksi ack WhatsApp setelah balasan terlihat terkirim.

## Prompt persetujuan

WhatsApp dapat merender prompt persetujuan exec dan Plugin dengan reaksi `👍` / `👎`. Pengiriman
dikontrol oleh konfigurasi penerusan persetujuan tingkat atas:

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

`approvals.exec` dan `approvals.plugin` bersifat independen. Mengaktifkan WhatsApp sebagai channel hanya menautkan
transport; itu tidak mengirim prompt persetujuan kecuali keluarga persetujuan yang cocok diaktifkan
dan diarahkan ke WhatsApp. Mode sesi mengirim persetujuan emoji native hanya untuk persetujuan yang
berasal dari WhatsApp. Mode target menggunakan pipeline penerusan bersama untuk target WhatsApp
eksplisit dan tidak membuat fanout DM pemberi persetujuan terpisah.

Reaksi persetujuan WhatsApp memerlukan pemberi persetujuan WhatsApp eksplisit dari `allowFrom` atau `"*"`.
`defaultTo` mengontrol target pesan default biasa; itu bukan pemberi persetujuan persetujuan. Perintah manual
`/approve` tetap melewati jalur otorisasi pengirim WhatsApp normal sebelum
resolusi persetujuan.

## Hook Plugin dan privasi

Pesan masuk WhatsApp dapat berisi konten pesan pribadi, nomor telepon,
pengidentifikasi grup, nama pengirim, dan bidang korelasi sesi. Karena itu,
WhatsApp tidak menyiarkan payload hook `message_received` masuk ke plugin
kecuali Anda ikut serta secara eksplisit:

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

Aktifkan ini hanya untuk plugin yang Anda percayai untuk menerima konten dan
pengidentifikasi pesan WhatsApp masuk.

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` mengontrol akses chat langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (mengharuskan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `allowFrom` menerima nomor bergaya E.164 (dinormalisasi secara internal).

    `allowFrom` adalah daftar kontrol akses pengirim DM. Ini tidak membatasi pengiriman keluar eksplisit ke JID grup WhatsApp atau JID kanal `@newsletter`.

    Penimpaan multi-akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `allowFrom`) lebih diutamakan daripada default tingkat kanal untuk akun tersebut.

    Detail perilaku runtime:

    - penyandingan dipertahankan di allow-store kanal dan digabungkan dengan `allowFrom` yang dikonfigurasi
    - automasi terjadwal dan fallback penerima Heartbeat menggunakan target pengiriman eksplisit atau `allowFrom` yang dikonfigurasi; persetujuan penyandingan DM bukan penerima Cron atau Heartbeat implisit
    - jika tidak ada allowlist yang dikonfigurasi, nomor mandiri yang tertaut diizinkan secara default
    - OpenClaw tidak pernah menyandingkan otomatis DM `fromMe` keluar (pesan yang Anda kirim ke diri sendiri dari perangkat tertaut)

  </Tab>

  <Tab title="Group policy + allowlists">
    Akses grup memiliki dua lapisan:

    1. **Allowlist keanggotaan grup** (`channels.whatsapp.groups`)
       - jika `groups` dihilangkan, semua grup memenuhi syarat
       - jika `groups` ada, itu bertindak sebagai allowlist grup (`"*"` diizinkan)

    2. **Kebijakan pengirim grup** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist pengirim dilewati
       - `allowlist`: pengirim harus cocok dengan `groupAllowFrom` (atau `*`)
       - `disabled`: blokir semua masukan grup

    Fallback allowlist pengirim:

    - jika `groupAllowFrom` tidak ditetapkan, runtime kembali ke `allowFrom` jika tersedia
    - allowlist pengirim dievaluasi sebelum aktivasi mention/reply

    Catatan: jika tidak ada blok `channels.whatsapp` sama sekali, fallback kebijakan grup runtime adalah `allowlist` (dengan log peringatan), meskipun `channels.defaults.groupPolicy` ditetapkan.

  </Tab>

  <Tab title="Mentions + /activation">
    Balasan grup memerlukan mention secara default.

    Deteksi mention mencakup:

    - mention WhatsApp eksplisit atas identitas bot
    - pola regex mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transkrip catatan suara masuk untuk pesan grup yang diotorisasi
    - deteksi reply-to-bot implisit (pengirim balasan cocok dengan identitas bot)

    Catatan keamanan:

    - kutipan/balasan hanya memenuhi gerbang mention; itu **tidak** memberikan otorisasi pengirim
    - dengan `groupPolicy: "allowlist"`, pengirim yang tidak ada dalam allowlist tetap diblokir meskipun mereka membalas pesan pengguna yang ada dalam allowlist

    Perintah aktivasi tingkat sesi:

    - `/activation mention`
    - `/activation always`

    `activation` memperbarui status sesi (bukan konfigurasi global). Ini dibatasi oleh pemilik.

  </Tab>
</Tabs>

## Binding ACP yang dikonfigurasi

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
- Allowlist grup, kebijakan pengirim, dan gerbang mention atau aktivasi berjalan sebelum OpenClaw memastikan sesi ACP yang dikonfigurasi ada.
- Binding ACP terkonfigurasi yang cocok memiliki rute tersebut. Grup broadcast WhatsApp tidak menyebarkan giliran itu ke sesi WhatsApp biasa.

## Perilaku nomor pribadi dan chat mandiri

Saat nomor mandiri yang tertaut juga ada di `allowFrom`, pengaman chat mandiri WhatsApp aktif:

- lewati tanda terima baca untuk giliran chat mandiri
- abaikan perilaku pemicu otomatis mention-JID yang jika tidak akan melakukan ping ke diri sendiri
- jika `messages.responsePrefix` tidak ditetapkan, balasan chat mandiri default ke `[{identity.name}]` atau `[openclaw]`

## Normalisasi pesan dan konteks

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Pesan WhatsApp masuk dibungkus dalam amplop masuk bersama.

    Jika ada balasan yang dikutip, konteks ditambahkan dalam bentuk ini:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Bidang metadata balasan juga diisi saat tersedia (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 pengirim).
    Saat target balasan yang dikutip adalah media yang dapat diunduh, OpenClaw menyimpannya melalui
    penyimpanan media masuk normal dan mengeksposnya sebagai `MediaPath`/`MediaType` sehingga
    agen dapat memeriksa gambar yang dirujuk, bukan hanya melihat
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Pesan masuk yang hanya berisi media dinormalisasi dengan placeholder seperti:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Catatan suara grup yang diotorisasi ditranskripsikan sebelum gerbang mention ketika
    isi hanya `<media:audio>`, sehingga mengucapkan mention bot dalam catatan suara dapat
    memicu balasan. Jika transkrip tetap tidak menyebut bot,
    transkrip disimpan dalam riwayat grup tertunda, bukan placeholder mentah.

    Isi lokasi menggunakan teks koordinat ringkas. Label/komentar lokasi dan detail kontak/vCard dirender sebagai metadata tidak tepercaya berpagar, bukan teks prompt inline.

  </Accordion>

  <Accordion title="Pending group history injection">
    Untuk grup, pesan yang belum diproses dapat di-buffer dan disuntikkan sebagai konteks saat bot akhirnya dipicu.

    - batas default: `50`
    - konfigurasi: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Penanda injeksi:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
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

    Penimpaan per akun:

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

    Giliran chat mandiri melewati tanda terima baca meskipun diaktifkan secara global.

  </Accordion>
</AccordionGroup>

## Pengiriman, pemotongan, dan media

<AccordionGroup>
  <Accordion title="Text chunking">
    - batas potongan default: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - mode `newline` mengutamakan batas paragraf (baris kosong), lalu kembali ke pemotongan yang aman berdasarkan panjang

  </Accordion>

  <Accordion title="Outbound media behavior">
    - mendukung payload gambar, video, audio (catatan suara PTT), dan dokumen
    - media audio dikirim melalui payload `audio` Baileys dengan `ptt: true`, sehingga klien WhatsApp merendernya sebagai catatan suara push-to-talk
    - payload balasan mempertahankan `audioAsVoice`; keluaran catatan suara TTS untuk WhatsApp tetap di jalur PTT ini meskipun penyedia mengembalikan MP3 atau WebM
    - audio Ogg/Opus native dikirim sebagai `audio/ogg; codecs=opus` untuk kompatibilitas catatan suara
    - audio non-Ogg, termasuk keluaran MP3/WebM Microsoft Edge TTS, ditranskode dengan `ffmpeg` ke Ogg/Opus mono 48 kHz sebelum pengiriman PTT
    - `/tts latest` mengirim balasan asisten terbaru sebagai satu catatan suara dan menekan pengiriman ulang untuk balasan yang sama; `/tts chat on|off|default` mengontrol TTS otomatis untuk chat WhatsApp saat ini
    - pemutaran GIF animasi didukung melalui `gifPlayback: true` pada pengiriman video
    - `forceDocument` / `asDocument` mengirim gambar, GIF, dan video keluar melalui payload dokumen Baileys untuk menghindari kompresi media WhatsApp sambil mempertahankan nama file dan jenis MIME yang diselesaikan
    - caption diterapkan ke item media pertama saat mengirim payload balasan multi-media, kecuali catatan suara PTT mengirim audio terlebih dahulu dan teks terlihat secara terpisah karena klien WhatsApp tidak merender caption catatan suara secara konsisten
    - sumber media dapat berupa HTTP(S), `file://`, atau jalur lokal

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - batas penyimpanan media masuk: `channels.whatsapp.mediaMaxMb` (default `50`)
    - batas pengiriman media keluar: `channels.whatsapp.mediaMaxMb` (default `50`)
    - penimpaan per akun menggunakan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - gambar dioptimalkan otomatis (ubah ukuran/sapuan kualitas) agar sesuai batas kecuali `forceDocument` / `asDocument` meminta pengiriman dokumen
    - saat pengiriman media gagal, fallback item pertama mengirim peringatan teks, bukan menjatuhkan respons secara diam-diam

  </Accordion>
</AccordionGroup>

## Pengutipan balasan

WhatsApp mendukung pengutipan balasan native, saat balasan keluar mengutip pesan masuk secara terlihat. Kontrol dengan `channels.whatsapp.replyToMode`.

| Nilai       | Perilaku                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Jangan pernah mengutip; kirim sebagai pesan biasa                     |
| `"first"`   | Kutip hanya potongan balasan keluar pertama                           |
| `"all"`     | Kutip setiap potongan balasan keluar                                  |
| `"batched"` | Kutip balasan batch dalam antrean sambil membiarkan balasan langsung tanpa kutipan |

Default adalah `"off"`. Penimpaan per akun menggunakan `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Tingkat       | Reaksi ack    | Reaksi yang diprakarsai agen | Deskripsi                                        |
| ------------- | ------------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | Tidak         | Tidak                        | Tidak ada reaksi sama sekali                     |
| `"ack"`       | Ya            | Tidak                        | Hanya reaksi ack (tanda terima sebelum balasan)  |
| `"minimal"`   | Ya            | Ya (konservatif)             | Ack + reaksi agen dengan panduan konservatif     |
| `"extensive"` | Ya            | Ya (dianjurkan)              | Ack + reaksi agen dengan panduan yang dianjurkan |

Default: `"minimal"`.

Penimpaan per akun menggunakan `channels.whatsapp.accounts.<id>.reactionLevel`.

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

- dikirim segera setelah pesan masuk diterima (sebelum balasan)
- jika `ackReaction` ada tanpa `emoji`, WhatsApp menggunakan emoji identitas agen yang dirutekan, dengan fallback ke "👀"; hilangkan `ackReaction` atau atur `emoji: ""` agar tidak mengirim reaksi ack
- kegagalan dicatat dalam log tetapi tidak memblokir pengiriman balasan normal
- mode grup `mentions` bereaksi pada giliran yang dipicu oleh mention; aktivasi grup `always` bertindak sebagai bypass untuk pemeriksaan ini
- WhatsApp menggunakan `channels.whatsapp.ackReaction` (`messages.ackReaction` lama tidak digunakan di sini)

## Reaksi status siklus hidup

Atur `messages.statusReactions.enabled: true` agar WhatsApp mengganti reaksi ack selama satu giliran alih-alih membiarkan emoji tanda terima statis. Saat diaktifkan, OpenClaw menggunakan slot reaksi pesan masuk yang sama untuk status siklus hidup seperti antre, berpikir, aktivitas tool, compaction, selesai, dan galat.

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
- Reaksi status antre menggunakan emoji ack efektif yang sama seperti reaksi ack biasa.
- WhatsApp memiliki satu slot reaksi bot per pesan, sehingga pembaruan siklus hidup mengganti reaksi saat ini di tempat.
- `messages.removeAckAfterReply: true` menghapus reaksi status akhir setelah masa tahan selesai/galat yang dikonfigurasi.
- Kategori emoji tool mencakup `tool`, `coding`, `web`, `deploy`, `build`, dan `concierge`.

## Multi-akun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan default">
    - id akun berasal dari `channels.whatsapp.accounts`
    - pemilihan akun default: `default` jika ada, jika tidak id akun terkonfigurasi pertama (diurutkan)
    - id akun dinormalisasi secara internal untuk lookup

  </Accordion>

  <Accordion title="Jalur kredensial dan kompatibilitas lama">
    - jalur auth saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file cadangan: `creds.json.bak`
    - auth default lama di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default

  </Accordion>

  <Accordion title="Perilaku logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status auth WhatsApp untuk akun tersebut.

    Ketika Gateway dapat dijangkau, logout terlebih dahulu menghentikan listener WhatsApp live untuk akun yang dipilih sehingga sesi tertaut tidak terus menerima pesan sampai restart berikutnya. `openclaw channels remove --channel whatsapp` juga menghentikan listener live sebelum menonaktifkan atau menghapus konfigurasi akun.

    Dalam direktori auth lama, `oauth.json` dipertahankan sementara file auth Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Tool, tindakan, dan penulisan konfigurasi

- Dukungan tool agen mencakup tindakan reaksi WhatsApp (`react`).
- Gate tindakan:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Penulisan konfigurasi yang dimulai oleh channel diaktifkan secara default (nonaktifkan melalui `channels.whatsapp.configWrites=false`).

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
    Gejala: akun tertaut dengan pemutusan berulang atau upaya koneksi ulang.

    Akun yang sepi dapat tetap terhubung melewati batas waktu pesan normal; watchdog
    memulai ulang ketika aktivitas transport WhatsApp Web berhenti, soket ditutup, atau
    aktivitas tingkat aplikasi tetap sunyi melewati jendela keamanan yang lebih panjang.

    Jika log menampilkan `status=408 Request Time-out Connection was lost` berulang, sesuaikan
    timing soket Baileys di bawah `web.whatsapp`. Mulailah dengan memperpendek
    `keepAliveIntervalMs` di bawah batas waktu idle jaringan Anda dan meningkatkan
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
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Jika loop berlanjut setelah konektivitas host dan timing diperbaiki, cadangkan
    direktori auth akun dan tautkan ulang akun tersebut:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Jika `~/.openclaw/logs/whatsapp-health.log` mengatakan `Gateway inactive` tetapi
    `openclaw gateway status` dan `openclaw channels status --probe` menunjukkan
    gateway dan WhatsApp sehat, jalankan `openclaw doctor`. Di Linux, doctor
    memperingatkan tentang entri crontab lama yang masih memanggil
    `~/.openclaw/bin/ensure-whatsapp.sh`; hapus entri usang tersebut dengan
    `crontab -e` karena cron bisa tidak memiliki lingkungan systemd user-bus dan
    membuat skrip lama itu salah melaporkan kesehatan gateway.

    Jika diperlukan, tautkan ulang dengan `channels login`.

  </Accordion>

  <Accordion title="Login QR timeout di belakang proxy">
    Gejala: `openclaw channels login --channel whatsapp` gagal sebelum menampilkan kode QR yang dapat digunakan dengan `status=408 Request Time-out` atau pemutusan soket TLS.

    Login WhatsApp Web menggunakan lingkungan proxy standar host gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varian huruf kecil, dan `NO_PROXY`). Verifikasi bahwa proses gateway mewarisi env proxy dan `NO_PROXY` tidak cocok dengan `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Tidak ada listener aktif saat mengirim">
    Pengiriman outbound gagal cepat ketika tidak ada listener gateway aktif untuk akun target.

    Pastikan gateway berjalan dan akun tertaut.

  </Accordion>

  <Accordion title="Balasan muncul di transkrip tetapi tidak di WhatsApp">
    Baris transkrip mencatat apa yang dihasilkan agen. Pengiriman WhatsApp diperiksa terpisah: OpenClaw hanya memperlakukan balasan otomatis sebagai terkirim setelah Baileys mengembalikan id pesan outbound untuk setidaknya satu pengiriman teks atau media yang terlihat.

    Reaksi ack adalah tanda terima sebelum balasan yang independen. Reaksi yang berhasil tidak membuktikan bahwa balasan teks atau media berikutnya diterima oleh WhatsApp.

    Periksa log gateway untuk `auto-reply delivery failed` atau `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Pesan grup tidak terduga diabaikan">
    Periksa dalam urutan ini:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entri allowlist `groups`
    - gate mention (`requireMention` + pola mention)
    - kunci duplikat di `openclaw.json` (JSON5): entri berikutnya menimpa entri sebelumnya, jadi pertahankan satu `groupPolicy` per scope

    Jika `channels.whatsapp.groups` ada, WhatsApp masih dapat mengamati pesan dari grup lain, tetapi OpenClaw menjatuhkannya sebelum perutean sesi. Tambahkan JID grup ke `channels.whatsapp.groups` atau tambahkan `groups["*"]` untuk menerima semua grup sambil tetap mempertahankan otorisasi pengirim di bawah `groupPolicy` dan `groupAllowFrom`.

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Runtime gateway WhatsApp harus menggunakan Node. Bun ditandai tidak kompatibel untuk operasi gateway WhatsApp/Telegram yang stabil.
  </Accordion>
</AccordionGroup>

## Prompt sistem

WhatsApp mendukung prompt sistem bergaya Telegram untuk grup dan chat langsung melalui peta `groups` dan `direct`.

Hierarki resolusi untuk pesan grup:

Peta `groups` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `groups` miliknya sendiri, itu sepenuhnya menggantikan peta `groups` root (tanpa deep merge). Lookup prompt kemudian berjalan pada satu peta yang dihasilkan:

1. **Prompt sistem khusus grup** (`groups["<groupId>"].systemPrompt`): digunakan ketika entri grup spesifik ada di peta **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan.
2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan ketika entri grup spesifik sepenuhnya tidak ada dari peta, atau ketika entri itu ada tetapi tidak mendefinisikan kunci `systemPrompt`.

Hierarki resolusi untuk pesan langsung:

Peta `direct` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `direct` miliknya sendiri, itu sepenuhnya menggantikan peta `direct` root (tanpa deep merge). Lookup prompt kemudian berjalan pada satu peta yang dihasilkan:

1. **Prompt sistem khusus langsung** (`direct["<peerId>"].systemPrompt`): digunakan ketika entri peer spesifik ada di peta **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan.
2. **Prompt sistem wildcard langsung** (`direct["*"].systemPrompt`): digunakan ketika entri peer spesifik sepenuhnya tidak ada dari peta, atau ketika entri itu ada tetapi tidak mendefinisikan kunci `systemPrompt`.

<Note>
`dms` tetap menjadi bucket override riwayat per-DM yang ringan (`dms.<id>.historyLimit`). Override prompt berada di bawah `direct`.
</Note>

**Perbedaan dari perilaku multi-akun Telegram:** Di Telegram, `groups` root sengaja ditekan untuk semua akun dalam setup multi-akun — bahkan akun yang tidak mendefinisikan `groups` miliknya sendiri — untuk mencegah bot menerima pesan grup untuk grup yang bukan tempat bot tersebut berada. WhatsApp tidak menerapkan guard ini: `groups` root dan `direct` root selalu diwarisi oleh akun yang tidak mendefinisikan override tingkat akun, terlepas dari berapa banyak akun yang dikonfigurasi. Dalam setup WhatsApp multi-akun, jika Anda menginginkan prompt grup atau langsung per akun, definisikan peta lengkap di bawah setiap akun secara eksplisit alih-alih mengandalkan default tingkat root.

Perilaku penting:

- `channels.whatsapp.groups` adalah peta konfigurasi per grup sekaligus allowlist grup tingkat chat. Pada scope root atau akun, `groups["*"]` berarti "semua grup diterima" untuk scope tersebut.
- Hanya tambahkan wildcard grup `systemPrompt` ketika Anda sudah ingin scope tersebut menerima semua grup. Jika Anda masih ingin hanya kumpulan tetap ID grup yang memenuhi syarat, jangan gunakan `groups["*"]` untuk default prompt. Sebagai gantinya, ulangi prompt pada setiap entri grup yang secara eksplisit ada di allowlist.
- Penerimaan grup dan otorisasi pengirim adalah pemeriksaan terpisah. `groups["*"]` memperluas kumpulan grup yang dapat mencapai penanganan grup, tetapi itu sendiri tidak mengotorisasi setiap pengirim di grup tersebut. Akses pengirim tetap dikontrol secara terpisah oleh `channels.whatsapp.groupPolicy` dan `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` tidak memiliki efek samping yang sama untuk DM. `direct["*"]` hanya menyediakan konfigurasi chat langsung default setelah DM sudah diterima oleh `dmPolicy` ditambah `allowFrom` atau aturan pairing-store.

Contoh:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Gunakan hanya jika semua grup harus diizinkan pada cakupan root.
        // Berlaku untuk semua akun yang tidak mendefinisikan peta grupnya sendiri.
        "*": { systemPrompt: "Prompt default untuk semua grup." },
      },
      direct: {
        // Berlaku untuk semua akun yang tidak mendefinisikan peta direct-nya sendiri.
        "*": { systemPrompt: "Prompt default untuk semua chat langsung." },
      },
      accounts: {
        work: {
          groups: {
            // Akun ini mendefinisikan grupnya sendiri, sehingga grup root
            // diganti sepenuhnya. Untuk mempertahankan wildcard, definisikan "*" secara eksplisit di sini juga.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Fokus pada manajemen proyek.",
            },
            // Gunakan hanya jika semua grup harus diizinkan di akun ini.
            "*": { systemPrompt: "Prompt default untuk grup kerja." },
          },
          direct: {
            // Akun ini mendefinisikan peta direct-nya sendiri, sehingga entri direct root
            // diganti sepenuhnya. Untuk mempertahankan wildcard, definisikan "*" secara eksplisit di sini juga.
            "+15551234567": { systemPrompt: "Prompt untuk chat langsung kerja tertentu." },
            "*": { systemPrompt: "Prompt default untuk chat langsung kerja." },
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

Field WhatsApp bernilai tinggi:

- akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-akun: `accounts.<id>.enabled`, `accounts.<id>.authDir`, penimpaan tingkat akun
- operasi: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- perilaku sesi: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompt: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Terkait

- [Pemasangan](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Keamanan](/id/gateway/security)
- [Perutean channel](/id/channels/channel-routing)
- [Perutean multi-agent](/id/concepts/multi-agent)
- [Pemecahan masalah](/id/channels/troubleshooting)
