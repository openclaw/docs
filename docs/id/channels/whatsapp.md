---
read_when:
    - Menangani perilaku kanal WhatsApp/web atau perutean kotak masuk
summary: Dukungan saluran WhatsApp, kontrol akses, perilaku pengiriman, dan operasi
title: WhatsApp
x-i18n:
    generated_at: "2026-07-19T04:50:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4b510a49741f823a05baea28453a2d4a12932a442172ff8323d0835d86da8897
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: siap produksi melalui WhatsApp Web (Baileys). Gateway mengelola sesi tertaut; tidak ada channel WhatsApp Twilio terpisah.

## Instalasi

`openclaw onboard` dan `openclaw channels add --channel whatsapp` meminta Anda menginstal plugin saat pertama kali memilihnya; `openclaw channels login --channel whatsapp` menawarkan alur instalasi yang sama jika plugin tidak tersedia. Checkout pengembangan menggunakan path plugin lokal; instalasi stabil/beta terlebih dahulu menginstal `@openclaw/whatsapp` dari ClawHub, lalu beralih ke npm jika gagal. Runtime WhatsApp dikirim di luar paket npm inti OpenClaw, sehingga dependensi runtime-nya tetap berada di plugin eksternal. Instalasi manual:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Gunakan paket npm tanpa cakupan (`@openclaw/whatsapp`) hanya sebagai fallback registri; sematkan versi yang tepat hanya untuk instalasi yang dapat direproduksi.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default adalah pemasangan untuk pengirim yang tidak dikenal.
  </Card>
  <Card title="Pemecahan masalah channel" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas channel dan panduan perbaikan.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi channel lengkap.
  </Card>
</CardGroup>

## Penyiapan cepat

<Steps>
  <Step title="Konfigurasikan kebijakan akses">

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

    Login hanya melalui QR. Pada host jarak jauh atau tanpa antarmuka grafis, siapkan cara yang andal untuk mengirimkan QR aktif ke ponsel sebelum memulai login; QR yang dirender di terminal, tangkapan layar, atau lampiran obrolan dapat kedaluwarsa saat dikirim.

    Untuk akun tertentu:

```bash
openclaw channels login --channel whatsapp --account work
```

    Untuk melampirkan direktori autentikasi yang sudah ada/kustom sebelum login:

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

  <Step title="Setujui permintaan pemasangan pertama (mode pemasangan)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Permintaan pemasangan kedaluwarsa setelah 1 jam; permintaan tertunda dibatasi hingga 3 per akun.

  </Step>
</Steps>

<Note>
Nomor WhatsApp terpisah direkomendasikan (penyiapan dan metadata dioptimalkan untuknya), tetapi penyiapan dengan nomor pribadi/obrolan mandiri didukung sepenuhnya.
</Note>

## Pola deployment

<AccordionGroup>
  <Accordion title="Nomor khusus (direkomendasikan)">
    - identitas WhatsApp terpisah untuk OpenClaw
    - daftar izin DM dan batas perutean yang lebih jelas
    - kemungkinan kebingungan obrolan mandiri yang lebih rendah

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
    Onboarding mendukung mode nomor pribadi dan menulis baseline yang sesuai untuk obrolan mandiri: `dmPolicy: "allowlist"`, `allowFrom` termasuk nomor Anda sendiri, `selfChatMode: true`. Perlindungan runtime untuk obrolan mandiri menggunakan nomor diri yang tertaut beserta `allowFrom`.
  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway mengelola soket WhatsApp dan loop penyambungan ulang.
- Watchdog melacak dua sinyal secara terpisah: aktivitas transport WhatsApp Web mentah dan aktivitas pesan aplikasi. Sesi yang tidak aktif tetapi tetap terhubung tidak dimulai ulang hanya karena belum ada pesan baru-baru ini; penyambungan ulang hanya dipaksakan ketika frame transport berhenti tiba selama jendela internal tetap (tidak dapat dikonfigurasi pengguna) atau pesan aplikasi tetap tidak ada selama lebih dari 4x batas waktu pesan normal. Tepat setelah penyambungan ulang untuk sesi yang baru-baru ini aktif, jendela pertama tersebut menggunakan batas waktu pesan normal yang lebih pendek, bukan jendela 4x. OpenClaw dapat membalas otomatis pesan offline yang dikirim lebih awal oleh Baileys selama penyambungan ulang tersebut, dibatasi oleh masa aktif deduplikasi ID pesan masuk; startup awal mempertahankan penjaga riwayat usang yang singkat.
- Pengaturan waktu soket Baileys dinyatakan secara eksplisit di bawah `web.whatsapp.*`: `keepAliveIntervalMs` (interval ping aplikasi), `connectTimeoutMs` (batas waktu handshake pembukaan), `defaultQueryTimeoutMs` (waktu tunggu kueri Baileys, ditambah batas waktu pengiriman/presensi keluar dan tanda terima baca masuk OpenClaw).
- Pengiriman keluar memerlukan listener WhatsApp aktif untuk akun tujuan; jika tidak, pengiriman langsung gagal.
- Pengiriman grup melampirkan metadata penyebutan native untuk token `@+<digits>` dan `@<digits>` (dalam teks dan keterangan media) ketika token cocok dengan metadata peserta saat ini, termasuk grup yang didukung LID.
- Obrolan status dan siaran (`@status`, `@broadcast`) diabaikan.
- Obrolan langsung menggunakan aturan sesi DM (`session.dmScope`; `main` default menggabungkan DM ke dalam sesi utama agen). Sesi grup diisolasi per JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Channel/Buletin WhatsApp dapat menjadi target keluar eksplisit melalui JID native `@newsletter` miliknya, menggunakan metadata sesi channel (`agent:<agentId>:whatsapp:channel:<jid>`), bukan semantik DM.
- Transport WhatsApp Web mengikuti variabel lingkungan proksi standar pada host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, serta varian huruf kecil). Utamakan konfigurasi proksi tingkat host daripada pengaturan per channel.
- Saat `messages.removeAckAfterReply` diaktifkan, OpenClaw menghapus reaksi konfirmasi setelah balasan yang terlihat terkirim.

## Hubungi pemohon saat ini dengan MeowCaller (eksperimental)

Plugin dapat mengekspos `whatsapp_call` dalam giliran agen yang berasal dari WhatsApp. Plugin ini menggunakan [MeowCaller](https://github.com/purpshell/meowcaller) untuk melakukan panggilan suara WhatsApp kepada pemohon resmi saat ini dan memutar pesan TTS OpenClaw setelah panggilan dijawab. Alat ini tidak memiliki parameter nomor tujuan, sehingga prompt tidak dapat mengalihkan panggilan. Dinonaktifkan secara default.

<Warning>
MeowCaller bersifat eksperimental, tidak memiliki rilis bertag, dan menggunakan sesi perangkat tertaut whatsmeow yang dipasangkan secara terpisah—sesi tersebut tidak dapat menggunakan kembali kredensial Baileys milik plugin. Pemasangan menambahkan perangkat tertaut lain ke akun WhatsApp yang sama; pindai menggunakan identitas yang digunakan oleh OpenClaw. Mode nomor pribadi/obrolan mandiri tidak dapat menelepon dirinya sendiri; gunakan nomor khusus OpenClaw untuk menelepon nomor pribadi Anda.
</Warning>

<Steps>
  <Step title="Aktifkan panggilan eksperimental">

    Tambahkan `actions.calls: true` ke konfigurasi channel WhatsApp dan mulai ulang Gateway:

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

    Jika tidak ada atau bernilai `false`, OpenClaw tidak mengekspos alat `whatsapp_call`.

  </Step>

  <Step title="Instal CLI MeowCaller yang telah direview">

    Adaptor mengharapkan executable `meowcaller` tersedia di `PATH` milik host Gateway. Hingga [PR MeowCaller #7](https://github.com/purpshell/meowcaller/pull/7) digabungkan, build branch yang telah direview:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Pastikan `$HOME/.local/bin` tersedia di `PATH` milik layanan Gateway. Revisi ini memiliki perintah `pair` eksplisit dan `notify` khusus pengiriman; `notify` tidak membuka mikrofon, speaker, perangkat video, atau perekaman diagnostik. Jangan menggantinya dengan perintah `play` dari CLI contoh upstream.

  </Step>

  <Step title="Pasangkan perangkat tertaut MeowCaller">

    Minta agen WhatsApp memeriksa penyiapan panggilan (tindakan status `whatsapp_call` melaporkan direktori status khusus akun dan perintah pemasangan). Untuk akun default:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Jalankan secara interaktif, pindai QR dari **WhatsApp > Linked devices**, lalu tunggu `MeowCaller linked device ready`. Jaga kerahasiaan `wa-voip.db`—itu adalah sesi MeowCaller. Akun non-default mendapatkan path penyimpanannya sendiri dari tindakan status; pada Windows, jalankan perintah PowerShell-nya.

  </Step>

  <Step title="Konfigurasikan TTS dan lakukan panggilan dari WhatsApp">

    Konfigurasikan [penyedia TTS](/id/tools/tts) yang mendukung telefoni, mulai ulang Gateway, lalu kirim permintaan seperti `Call me and say the build finished.` Alat ini menentukan pengirim dari konteks masuk tepercaya, menyintesis file WAV privat sementara, menjalankan MeowCaller selama jendela panggilan terbatas, lalu menghapus file audio setelahnya. OpenClaw meneruskan penyimpanan akun secara eksplisit, menunggu status keluar nol setelah jawaban/pemutaran/penutupan panggilan, dan memperlakukan batas waktu atau status keluar bukan nol sebagai kegagalan pemanggilan alat.

  </Step>
</Steps>

Batasan: hanya panggilan audio keluar satu-lawan-satu, tanpa nomor tujuan arbitrer, tanpa autentikasi bersama dengan koneksi obrolan, tanpa panggilan ke diri sendiri dari mode nomor pribadi/obrolan mandiri, audio sintetis dibatasi hingga 60 detik, tanpa tanda terima keterdengaran di sisi handset selain penyelesaian jawaban/pemutaran/penutupan panggilan MeowCaller, dan OpenClaw menghentikan proses pendamping setelah jendela terbatas 115–175 detik (mencakup fase koneksi, jawaban, pemutaran, dan penghentian MeowCaller).

## Prompt persetujuan

WhatsApp dapat merender prompt persetujuan eksekusi dan plugin sebagai reaksi `👍`/`👎`, yang dikendalikan oleh konfigurasi penerusan persetujuan tingkat teratas:

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

`approvals.exec` dan `approvals.plugin` bersifat independen; mengaktifkan WhatsApp sebagai channel hanya menautkan transport dan tidak mengirimkan apa pun kecuali kelompok persetujuan yang sesuai diaktifkan dan dirutekan ke sana. Mode sesi mengirimkan persetujuan emoji native hanya untuk persetujuan yang berasal dari WhatsApp. Mode target menggunakan pipeline penerusan bersama untuk target eksplisit dan tidak membuat fan-out DM pemberi persetujuan terpisah.

Reaksi persetujuan WhatsApp memerlukan pemberi persetujuan eksplisit dalam `allowFrom` (atau `"*"`). `defaultTo` menetapkan target pesan default biasa, bukan daftar pemberi persetujuan. Perintah manual `/approve` tetap melewati jalur otorisasi pengirim WhatsApp normal sebelum penyelesaian persetujuan.

## Reaksi pertanyaan

Untuk prompt `ask_user` dengan satu pertanyaan non-rahasia berpilihan tunggal dan satu hingga empat opsi, WhatsApp menampilkan `1️⃣` hingga `4️⃣` di samping label opsi. Berikan reaksi pada prompt yang terkirim dengan nomor yang sesuai untuk menjawabnya. OpenClaw memetakan nomor tersebut ke opsi kanonis melalui Gateway; ketukan yang usang atau duplikat diabaikan. Prompt multi-pertanyaan, multi-pilihan, dan teks bebas tetap hanya dapat dijawab melalui teks. Aturan penerimaan DM/grup WhatsApp normal mengotorisasi pengirim reaksi.

## Hook plugin dan privasi

Pesan WhatsApp masuk dapat memuat konten pribadi, nomor telepon, pengidentifikasi grup, nama pengirim, dan kolom korelasi sesi. WhatsApp tidak menyiarkan payload hook `message_received` masuk ke plugin kecuali Anda mengaktifkannya:

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

Batasi pengaktifan tersebut pada satu akun di bawah `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Aktifkan hanya untuk plugin yang Anda percayai untuk menangani konten dan pengidentifikasi WhatsApp masuk.

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.whatsapp.dmPolicy`:

    | Nilai | Perilaku |
    | --- | --- |
    | `pairing` (default) | Pengirim yang tidak dikenal meminta penyandingan; pemilik menyetujui |
    | `allowlist` | Hanya pengirim `allowFrom` yang diizinkan |
    | `open` | Mengharuskan `allowFrom` menyertakan `"*"` |
    | `disabled` | Blokir semua DM |

    `allowFrom` menerima nomor bergaya E.164 (dinormalisasi secara internal). Ini hanya daftar kontrol akses pengirim DM — tidak membatasi pengiriman keluar eksplisit ke JID grup atau JID kanal `@newsletter`.

    Penggantian untuk beberapa akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `.allowFrom`) lebih diprioritaskan daripada default tingkat kanal untuk akun tersebut.

    Catatan runtime:

    - penyandingan tetap tersimpan dalam penyimpanan izin kanal dan digabungkan dengan `allowFrom` yang dikonfigurasi
    - otomatisasi terjadwal dan fallback penerima Heartbeat menggunakan target pengiriman eksplisit atau `allowFrom` yang dikonfigurasi; persetujuan penyandingan DM bukan penerima Cron/Heartbeat implisit
    - jika tidak ada daftar izin yang dikonfigurasi, nomor sendiri yang ditautkan diizinkan secara default
    - OpenClaw tidak pernah menyandingkan DM `fromMe` keluar secara otomatis (pesan yang Anda kirim kepada diri sendiri dari perangkat tertaut)

  </Tab>

  <Tab title="Kebijakan grup dan daftar izin">
    Akses grup memiliki dua lapisan:

    1. **Daftar izin keanggotaan grup** (`channels.whatsapp.groups`): jika `groups` tidak dicantumkan, semua grup memenuhi syarat; jika ada, nilai tersebut berfungsi sebagai daftar izin grup (`"*"` mengizinkan semuanya).
    2. **Kebijakan pengirim grup** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` melewati daftar izin pengirim, `allowlist` mengharuskan kecocokan `groupAllowFrom` (atau `*`), `disabled` memblokir semua pesan masuk grup.

    Jika `groupAllowFrom` tidak ditetapkan, pemeriksaan pengirim menggunakan `allowFrom` sebagai fallback jika memiliki entri. Daftar izin pengirim dievaluasi sebelum aktivasi sebutan/balasan.

    Jika blok `channels.whatsapp` sama sekali tidak ada, runtime menggunakan `groupPolicy: "allowlist"` sebagai fallback (dengan log peringatan), meskipun `channels.defaults.groupPolicy` ditetapkan ke nilai lain.

    <Note>
    Resolusi keanggotaan grup memiliki pengaman untuk satu akun: jika hanya satu akun WhatsApp yang dikonfigurasi dan `accounts.<id>.groups`-nya merupakan objek kosong eksplisit (`{}`), nilai tersebut dianggap "belum ditetapkan" dan menggunakan peta `channels.whatsapp.groups` akar sebagai fallback, alih-alih memblokir setiap grup secara diam-diam. Jika 2+ akun dikonfigurasi, peta akun kosong eksplisit tetap kosong dan tidak menggunakan fallback — ini memungkinkan satu akun menonaktifkan semua grup secara sengaja tanpa memengaruhi akun lainnya.
    </Note>

  </Tab>

  <Tab title="Sebutan dan /activation">
    Balasan grup memerlukan sebutan secara default. Deteksi sebutan mencakup:

    - sebutan WhatsApp eksplisit terhadap identitas bot
    - pola regex sebutan yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transkrip catatan suara masuk untuk pesan grup yang diotorisasi
    - deteksi balasan kepada bot secara implisit (pengirim balasan cocok dengan identitas bot)

    Keamanan: kutipan/balasan hanya memenuhi pembatasan sebutan — hal tersebut **tidak** memberikan otorisasi pengirim. Dengan `groupPolicy: "allowlist"`, pengirim yang tidak tercantum dalam daftar izin tetap diblokir meskipun membalas pesan pengguna yang tercantum dalam daftar izin.

    Perintah aktivasi tingkat sesi: `/activation mention` atau `/activation always`. Perintah ini memperbarui status sesi (bukan konfigurasi global) dan dibatasi untuk pemilik.

  </Tab>
</Tabs>

## Pengikatan ACP yang dikonfigurasi

WhatsApp mendukung pengikatan ACP persisten melalui `bindings[]` tingkat teratas:

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

Percakapan langsung dicocokkan dengan nomor E.164; grup dicocokkan dengan JID grup WhatsApp. Daftar izin grup, kebijakan pengirim, dan pembatasan sebutan/aktivasi dijalankan sebelum OpenClaw memastikan sesi ACP yang terikat tersedia. Pengikatan yang cocok memiliki rute tersebut — grup siaran tidak menyebarkan giliran itu ke sesi WhatsApp biasa.

## Perilaku nomor pribadi dan percakapan dengan diri sendiri

Ketika nomor sendiri yang ditautkan juga terdapat dalam `allowFrom`, pengaman percakapan dengan diri sendiri diaktifkan: lewati tanda terima telah dibaca untuk giliran percakapan dengan diri sendiri, abaikan perilaku pemicu otomatis JID sebutan yang akan menyebut diri sendiri, dan arahkan balasan secara default ke `[{identity.name}]` (atau `[openclaw]`) ketika `messages.responsePrefix` tidak ditetapkan.

## Normalisasi pesan dan konteks

<AccordionGroup>
  <Accordion title="Amplop pesan masuk dan konteks balasan">
    Pesan masuk dibungkus dalam amplop pesan masuk bersama. Balasan yang dikutip menambahkan konteks dalam bentuk berikut:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Metadata balasan (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 pengirim) diisi jika tersedia. Jika target yang dikutip berupa media yang dapat diunduh, OpenClaw menyimpannya melalui penyimpanan media masuk normal dan mengekspos `MediaPath`/`MediaType` agar agen dapat memeriksanya secara langsung, alih-alih hanya melihat `<media:image>`.

  </Accordion>

  <Accordion title="Placeholder media dan ekstraksi lokasi/kontak">
    Pesan yang hanya berisi media dinormalisasi menjadi placeholder: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Catatan suara grup yang diotorisasi ditranskripsikan sebelum pembatasan sebutan ketika isi pesan hanya `<media:audio>`, sehingga mengucapkan sebutan bot dalam catatan suara dapat memicu balasan. Jika transkrip masih tidak menyebut bot, transkrip tersebut tetap berada dalam riwayat grup tertunda, bukan placeholder mentah.

    Isi lokasi dirender sebagai teks koordinat ringkas. Label/komentar lokasi serta detail kontak/vCard dirender sebagai metadata tidak tepercaya berpagar, bukan teks prompt sebaris.

  </Accordion>

  <Accordion title="Injeksi riwayat grup tertunda">
    Pesan grup yang belum diproses disangga dan diinjeksi sebagai konteks ketika bot akhirnya dipicu.

    - batas default: `50`
    - konfigurasi: `channels.whatsapp.historyLimit`, fallback `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Penanda injeksi: `[Chat messages since your last reply - for context]` dan `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Tanda terima telah dibaca">
    Diaktifkan secara default untuk pesan masuk yang diterima. Nonaktifkan secara global:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Penggantian per akun: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Giliran percakapan dengan diri sendiri melewati tanda terima telah dibaca meskipun diaktifkan secara global.

  </Accordion>
</AccordionGroup>

## Pengiriman, pemotongan, dan media

<AccordionGroup>
  <Accordion title="Pemotongan teks">
    - batas potongan default: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` mengutamakan batas paragraf (baris kosong), lalu menggunakan pemotongan aman berdasarkan panjang sebagai fallback

  </Accordion>

  <Accordion title="Perilaku media keluar">
    - mendukung payload gambar, video, audio (catatan suara PTT), dan dokumen
    - audio dikirim sebagai payload Baileys `audio` dengan `ptt: true`, yang dirender sebagai catatan suara tekan-untuk-bicara; `audioAsVoice` dipertahankan pada payload balasan agar keluaran catatan suara TTS tetap menggunakan jalur ini terlepas dari format sumber penyedia
    - audio Ogg/Opus native dikirim sebagai `audio/ogg; codecs=opus`; format lainnya (termasuk keluaran MP3/WebM TTS Microsoft Edge) ditranskode dengan `ffmpeg` menjadi Ogg/Opus mono 48 kHz sebelum pengiriman PTT
    - `/tts latest` mengirim balasan asisten terbaru sebagai satu catatan suara dan mencegah pengiriman berulang untuk balasan yang sama; `/tts chat on|off|default` mengontrol TTS otomatis untuk percakapan saat ini
    - `gifPlayback: true` pada pengiriman video mengaktifkan pemutaran GIF animasi
    - `forceDocument`/`asDocument` merutekan gambar, GIF, dan video keluar melalui payload dokumen Baileys untuk menghindari kompresi media WhatsApp, dengan mempertahankan nama file dan jenis MIME yang telah diresolusi
    - keterangan diterapkan pada item media pertama dalam balasan multi-media, kecuali catatan suara PTT: audio dikirim terlebih dahulu tanpa keterangan, lalu keterangan dikirim sebagai pesan teks terpisah (klien WhatsApp tidak merender keterangan catatan suara secara konsisten)
    - sumber media dapat berupa HTTP(S), `file://`, atau jalur lokal

  </Accordion>

  <Accordion title="Batas ukuran media dan perilaku fallback">
    - batas penyimpanan masuk dan batas pengiriman keluar: `channels.whatsapp.mediaMaxMb` (default `50`)
    - penggantian per akun: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - gambar dioptimalkan secara otomatis (pengubahan ukuran/penyesuaian kualitas) agar sesuai dengan batas, kecuali `forceDocument`/`asDocument` meminta pengiriman sebagai dokumen
    - jika pengiriman media gagal, fallback item pertama mengirim peringatan teks alih-alih membuang respons secara diam-diam

  </Accordion>
</AccordionGroup>

## Pengutipan balasan

`channels.whatsapp.replyToMode` mengontrol pengutipan balasan native (balasan keluar mengutip pesan masuk secara terlihat):

| Nilai             | Perilaku                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (default) | Jangan pernah mengutip; kirim sebagai pesan biasa                           |
| `"first"`         | Kutip hanya potongan balasan keluar pertama                      |
| `"all"`           | Kutip setiap potongan balasan keluar                               |
| `"batched"`       | Kutip balasan batch yang diantrekan; biarkan balasan langsung tanpa kutipan |

Penggantian per akun: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Tingkat reaksi

`channels.whatsapp.reactionLevel` mengontrol seberapa luas agen menggunakan reaksi emoji:

| Tingkat                 | Reaksi konfirmasi | Reaksi yang dimulai agen  |
| --------------------- | ------------- | -------------------------- |
| `"off"`               | Tidak            | Tidak                         |
| `"ack"`               | Ya           | Tidak                         |
| `"minimal"` (default) | Ya           | Ya, panduan konservatif |
| `"extensive"`         | Ya           | Ya, panduan yang dianjurkan   |

Penggantian per akun: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reaksi konfirmasi

`channels.whatsapp.ackReaction` mengirim reaksi langsung saat pesan masuk diterima, dibatasi oleh `reactionLevel` (ditekan ketika `"off"`):

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

Catatan: dikirim segera setelah pesan masuk diterima (sebelum balasan); jika `ackReaction` ada tanpa `emoji`, WhatsApp menggunakan emoji identitas agen yang dirutekan, dengan fallback ke "👀" (hilangkan `ackReaction` atau tetapkan `emoji: ""` agar tidak ada konfirmasi); kegagalan dicatat dalam log tetapi tidak memblokir pengiriman balasan; mode grup `mentions` hanya bereaksi pada giliran yang dipicu sebutan, sedangkan aktivasi grup `always` melewati pemeriksaan tersebut; WhatsApp hanya menggunakan `channels.whatsapp.ackReaction` (`messages.ackReaction` lama tidak berlaku di sini).

## Reaksi status siklus hidup

Tetapkan `messages.statusReactions.enabled: true` agar WhatsApp mengganti reaksi konfirmasi selama satu giliran, alih-alih membiarkan emoji tanda terima statis, dengan beralih melalui status seperti diantrekan, berpikir, aktivitas alat, Compaction, selesai, dan kesalahan:

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

Catatan: `channels.whatsapp.ackReaction` tetap mengontrol kelayakan untuk pesan langsung dan grup; status dalam antrean menggunakan emoji efektif yang sama seperti reaksi tanda terima biasa; WhatsApp memiliki satu slot reaksi bot per pesan, sehingga pembaruan siklus hidup menggantikan reaksi saat ini secara langsung; `messages.removeAckAfterReply: true` menghapus reaksi status akhir setelah durasi penahanan selesai/kesalahan yang dikonfigurasi; kategori emoji alat mencakup `tool`, `coding`, `web`, `deploy`, `build`, dan `concierge`.

## Multi-akun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan nilai default">
    ID akun berasal dari `channels.whatsapp.accounts`. Akun default yang dipilih adalah `default` jika tersedia; jika tidak, ID akun pertama yang dikonfigurasi (diurutkan menurut abjad). ID akun dinormalisasi secara internal untuk pencarian.
  </Accordion>

  <Accordion title="Jalur kredensial dan kompatibilitas lama">
    - jalur autentikasi saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (cadangan: `creds.json.bak`)
    - autentikasi default lama di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default

  </Accordion>

  <Accordion title="Perilaku keluar">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status autentikasi WhatsApp untuk akun tersebut. Saat gateway dapat dijangkau, proses keluar terlebih dahulu menghentikan listener aktif untuk akun tersebut, sehingga sesi tertaut berhenti menerima pesan sebelum pemulaian ulang berikutnya. `openclaw channels remove --channel whatsapp` juga menghentikan listener aktif sebelum menonaktifkan atau menghapus konfigurasi akun.

    Dalam direktori autentikasi lama, `oauth.json` dipertahankan sementara berkas autentikasi Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Alat, tindakan, dan penulisan konfigurasi

- Dukungan alat agen mencakup tindakan reaksi WhatsApp (`react`).
- Gerbang tindakan: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (tindakan yang sudah ada secara default bernilai `true`), `channels.whatsapp.actions.calls` (default `false`, lihat MeowCaller di atas).
- Penulisan konfigurasi yang dimulai oleh saluran diaktifkan secara default; nonaktifkan melalui `channels.whatsapp.configWrites: false`.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Belum tertaut (memerlukan QR)">
    Gejala: status saluran melaporkan belum tertaut.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Tertaut tetapi terputus / perulangan penyambungan ulang">
    Gejala: akun tertaut berulang kali terputus atau mencoba menyambung ulang.

    Akun yang sepi dapat tetap terhubung melewati batas waktu pesan normal; watchdog hanya memulai ulang saat aktivitas transportasi WhatsApp Web berhenti, soket tertutup, atau aktivitas tingkat aplikasi tetap tidak ada melampaui jendela pengaman yang lebih panjang (lihat Model runtime di atas).

    Jika log berulang kali menampilkan `status=408 Request Time-out Connection was lost`, sesuaikan pengaturan waktu soket Baileys di bawah `web.whatsapp`. Mulailah dengan mempersingkat `keepAliveIntervalMs` hingga di bawah batas waktu menganggur jaringan Anda dan meningkatkan `connectTimeoutMs` pada koneksi yang lambat atau sering kehilangan data:

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

    Jika perulangan tetap terjadi setelah konektivitas host dan pengaturan waktu diperbaiki, cadangkan direktori autentikasi akun dan tautkan ulang:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Jika `~/.openclaw/logs/whatsapp-health.log` menyatakan `Gateway inactive`, tetapi `openclaw gateway status` dan `openclaw channels status --probe` keduanya menunjukkan kondisi sehat, jalankan `openclaw doctor`. Di Linux, doctor memperingatkan tentang entri crontab lama yang menjalankan skrip `~/.openclaw/bin/ensure-whatsapp.sh` yang telah dihentikan; hapus entri tersebut dengan `crontab -e` — cron mungkin tidak memiliki lingkungan bus pengguna systemd dan menyebabkan skrip lama tersebut salah melaporkan kesehatan gateway.

  </Accordion>

  <Accordion title="Login QR kehabisan waktu di belakang proksi">
    Gejala: `openclaw channels login --channel whatsapp` gagal sebelum menampilkan QR yang dapat digunakan dengan `status=408 Request Time-out` atau koneksi soket TLS terputus.

    Login WhatsApp Web menggunakan lingkungan proksi standar milik host gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varian huruf kecil, `NO_PROXY`). Pastikan proses gateway mewarisi lingkungan proksi dan `NO_PROXY` tidak cocok dengan `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Tidak ada listener aktif saat mengirim">
    Pengiriman keluar langsung gagal saat tidak ada listener gateway aktif untuk akun target. Pastikan gateway sedang berjalan dan akun telah ditautkan.
  </Accordion>

  <Accordion title="Balasan muncul dalam transkrip tetapi tidak di WhatsApp">
    Baris transkrip merekam apa yang dihasilkan agen; pengiriman WhatsApp diperiksa secara terpisah. OpenClaw hanya menganggap balasan otomatis telah dikirim setelah Baileys mengembalikan ID pesan keluar untuk setidaknya satu pengiriman teks atau media yang terlihat.

    Reaksi tanda terima merupakan tanda penerimaan prabalasan yang independen — keberhasilan reaksi tidak membuktikan bahwa balasan teks/media berikutnya diterima. Periksa log gateway untuk `auto-reply delivery failed` atau `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Pesan grup diabaikan secara tidak terduga">
    Periksa dengan urutan berikut: `groupPolicy`, `groupAllowFrom`/`allowFrom`, entri daftar izin `groups`, gerbang penyebutan (`requireMention` + pola penyebutan), dan kunci duplikat di `openclaw.json` (entri JSON5 yang lebih akhir menimpa entri sebelumnya — pertahankan hanya satu `groupPolicy` per cakupan).

    Jika `channels.whatsapp.groups` tersedia, WhatsApp masih dapat mengamati pesan dari grup lain, tetapi OpenClaw menghapusnya sebelum perutean sesi. Tambahkan JID grup ke `channels.whatsapp.groups`, atau tambahkan `groups["*"]` untuk menerima semua grup sambil tetap mempertahankan otorisasi pengirim di bawah `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Gateway OpenClaw memerlukan Node. Bun tidak menyediakan API `node:sqlite` yang digunakan oleh penyimpanan status kanonis, dan doctor memigrasikan layanan Bun lama ke Node.
  </Accordion>
</AccordionGroup>

## Prompt sistem

WhatsApp mendukung prompt sistem bergaya Telegram untuk grup dan percakapan langsung melalui peta `groups` dan `direct`.

Resolusi untuk pesan grup: peta `groups` yang efektif ditentukan terlebih dahulu — jika akun mendefinisikan kunci `groups` miliknya sendiri, kunci tersebut sepenuhnya menggantikan peta `groups` root (tanpa penggabungan mendalam). Pencarian prompt kemudian dijalankan pada satu peta hasil tersebut:

1. **Prompt khusus grup** (`groups["<groupId>"].systemPrompt`): digunakan saat entri grup tersedia **dan** kunci `systemPrompt`-nya didefinisikan. String kosong (`""`) menekan wildcard dan tidak menerapkan prompt apa pun.
2. **Prompt wildcard grup** (`groups["*"].systemPrompt`): digunakan saat entri grup tertentu tidak tersedia atau tersedia tanpa kunci `systemPrompt`.

Resolusi untuk pesan langsung mengikuti pola yang sama terhadap peta `direct` dan `direct["*"]`.

<Note>
`dms` tetap menjadi wadah penggantian riwayat ringan per-DM (`dms.<id>.historyLimit`). Penggantian prompt berada di bawah `direct`.
</Note>

<Note>
Perilaku akun-menggantikan-root untuk resolusi prompt ini merupakan penggantian dangkal biasa: setiap kunci `groups`/`direct` akun, termasuk objek kosong eksplisit, menggantikan peta root. Perilaku ini berbeda dari pemeriksaan daftar izin keanggotaan grup yang dijelaskan di atas, yang memiliki pengaman akun tunggal untuk `groups: {}` yang kosong secara tidak sengaja.
</Note>

**Perbedaan dari Telegram:** Telegram menekan `groups` root untuk setiap akun dalam penyiapan multi-akun (bahkan akun yang tidak memiliki `groups` sendiri) guna mencegah bot menerima pesan grup dari grup yang bukan tempatnya bergabung. WhatsApp tidak menerapkan pengaman tersebut — `groups`/`direct` root diwarisi oleh setiap akun tanpa penggantian sendiri, berapa pun jumlah akunnya. Dalam penyiapan WhatsApp multi-akun, definisikan peta lengkap secara eksplisit di bawah setiap akun jika Anda menginginkan prompt per akun.

Perilaku penting:

- `channels.whatsapp.groups` merupakan peta konfigurasi per grup sekaligus daftar izin grup tingkat percakapan. Pada cakupan root maupun akun, `groups["*"]` berarti "semua grup diterima" untuk cakupan tersebut.
- Hanya tambahkan wildcard `systemPrompt` jika Anda memang ingin cakupan tersebut menerima semua grup. Agar hanya kumpulan ID grup tertentu yang memenuhi syarat, ulangi prompt pada setiap entri yang secara eksplisit masuk daftar izin, alih-alih menggunakan `groups["*"]`.
- Penerimaan grup dan otorisasi pengirim merupakan pemeriksaan terpisah. `groups["*"]` memperluas grup yang mencapai penanganan grup; ini tidak mengotorisasi setiap pengirim dalam grup tersebut — hal itu tetap dikontrol oleh `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` tidak memiliki efek samping yang setara untuk DM: `direct["*"]` hanya menyediakan konfigurasi default setelah DM diterima oleh `dmPolicy` ditambah `allowFrom` atau aturan penyimpanan pemasangan.

Contoh:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Gunakan hanya jika semua grup harus diterima pada cakupan root.
        // Berlaku untuk semua akun yang tidak mendefinisikan peta groups sendiri.
        "*": { systemPrompt: "Prompt default untuk semua grup." },
      },
      direct: {
        // Berlaku untuk semua akun yang tidak mendefinisikan peta direct sendiri.
        "*": { systemPrompt: "Prompt default untuk semua percakapan langsung." },
      },
      accounts: {
        work: {
          groups: {
            // Akun ini mendefinisikan groups sendiri, sehingga groups root sepenuhnya
            // digantikan. Untuk mempertahankan wildcard, definisikan "*" secara eksplisit di sini juga.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Fokus pada manajemen proyek.",
            },
            // Gunakan hanya jika semua grup harus diterima dalam akun ini.
            "*": { systemPrompt: "Prompt default untuk grup kerja." },
          },
          direct: {
            // Akun ini mendefinisikan peta direct sendiri, sehingga entri direct root
            // sepenuhnya digantikan. Untuk mempertahankan wildcard, definisikan "*" secara eksplisit di sini juga.
            "+15551234567": { systemPrompt: "Prompt untuk percakapan langsung kerja tertentu." },
            "*": { systemPrompt: "Prompt default untuk percakapan langsung kerja." },
          },
        },
      },
    },
  },
}
```

## Penunjuk referensi konfigurasi

Referensi utama: [Referensi konfigurasi - WhatsApp](/id/gateway/config-channels#whatsapp)

| Area             | Bidang                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Akses            | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Pengiriman       | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Multi-akun       | `accounts.<id>.enabled`, `accounts.<id>.authDir`, dan penggantian per akun lainnya                              |
| Operasi          | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Perilaku sesi    | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompt           | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Terkait

- [Pemasangan](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Keamanan](/id/gateway/security)
- [Perutean channel](/id/channels/channel-routing)
- [Perutean multiagen](/id/concepts/multi-agent)
- [Pemecahan masalah](/id/channels/troubleshooting)
