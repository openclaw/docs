---
read_when:
    - Mengerjakan perilaku saluran WhatsApp/web atau perutean kotak masuk
summary: Dukungan saluran WhatsApp, kontrol akses, perilaku pengiriman, dan operasionalisasi
title: WhatsApp
x-i18n:
    generated_at: "2026-07-20T03:44:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fd28b100e05cf63e0676947144ac188bdba69d852489f65ef312b4f453de1d08
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: siap produksi melalui WhatsApp Web (Baileys). Gateway mengelola sesi tertaut; tidak ada saluran Twilio WhatsApp terpisah.

## Instalasi

`openclaw onboard` dan `openclaw channels add --channel whatsapp` meminta pemasangan plugin saat pertama kali Anda memilihnya; `openclaw channels login --channel whatsapp` menawarkan alur pemasangan yang sama jika plugin tidak tersedia. Checkout pengembangan menggunakan jalur plugin lokal; instalasi stabil/beta terlebih dahulu memasang `@openclaw/whatsapp` dari ClawHub, dengan npm sebagai fallback. Runtime WhatsApp dikirimkan di luar paket npm inti OpenClaw, sehingga dependensi runtime-nya tetap berada di plugin eksternal. Instalasi manual:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Gunakan paket npm tanpa cakupan tambahan (`@openclaw/whatsapp`) hanya untuk fallback registri; sematkan versi persis hanya untuk instalasi yang dapat direproduksi.

<CardGroup cols={3}>
  <Card title="Penyandingan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default adalah penyandingan untuk pengirim yang tidak dikenal.
  </Card>
  <Card title="Pemecahan masalah saluran" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas saluran dan panduan perbaikan.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi saluran lengkap.
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

    Login hanya melalui QR. Pada host jarak jauh atau tanpa antarmuka grafis, siapkan cara yang andal untuk mengirimkan QR aktif ke ponsel sebelum memulai login; QR yang dirender di terminal, tangkapan layar, atau lampiran obrolan dapat kedaluwarsa selama pengiriman.

    Untuk akun tertentu:

```bash
openclaw channels login --channel whatsapp --account work
```

    Untuk melampirkan direktori autentikasi yang sudah ada atau khusus sebelum login:

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

  <Step title="Setujui permintaan penyandingan pertama (mode penyandingan)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Permintaan penyandingan kedaluwarsa setelah 1 jam; permintaan tertunda dibatasi hingga 3 per akun.

  </Step>
</Steps>

<Note>
Nomor WhatsApp terpisah direkomendasikan (penyiapan dan metadata dioptimalkan untuknya), tetapi penyiapan dengan nomor pribadi/obrolan mandiri didukung sepenuhnya.
</Note>

## Pola penerapan

<AccordionGroup>
  <Accordion title="Nomor khusus (direkomendasikan)">
    - identitas WhatsApp terpisah untuk OpenClaw
    - daftar izin DM dan batas perutean yang lebih jelas
    - kemungkinan kebingungan pada obrolan mandiri yang lebih rendah

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
    Orientasi awal mendukung mode nomor pribadi dan menulis konfigurasi dasar yang sesuai untuk obrolan mandiri: `dmPolicy: "allowlist"`, `allowFrom` termasuk nomor Anda sendiri, `selfChatMode: true`. Perlindungan obrolan mandiri runtime menggunakan nomor diri yang tertaut ditambah `allowFrom` sebagai kunci.
  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway mengelola soket WhatsApp dan perulangan koneksi ulang.
- Watchdog melacak dua sinyal secara independen: aktivitas transportasi mentah WhatsApp Web dan aktivitas pesan aplikasi. Sesi yang senyap tetapi tetap terhubung tidak dimulai ulang hanya karena tidak ada pesan yang baru-baru ini tiba; koneksi ulang dipaksa hanya ketika frame transportasi berhenti tiba selama jangka waktu internal tetap (tidak dapat dikonfigurasi pengguna) atau pesan aplikasi tetap senyap melewati 4x waktu tunggu pesan normal. Tepat setelah koneksi ulang untuk sesi yang baru-baru ini aktif, jangka waktu pertama tersebut menggunakan waktu tunggu pesan normal yang lebih singkat, bukan jangka waktu 4x. OpenClaw dapat membalas otomatis pesan luring yang dikirim lebih awal oleh Baileys dalam koneksi ulang tersebut, dibatasi oleh masa berlaku deduplikasi ID pesan masuk; pengaktifan awal tetap menggunakan perlindungan singkat terhadap riwayat lama.
- Pengiriman keluar memerlukan listener WhatsApp aktif untuk akun tujuan; jika tidak, pengiriman segera gagal.
- Pengiriman grup melampirkan metadata sebutan native untuk token `@+<digits>` dan `@<digits>` (dalam teks dan keterangan media) ketika token cocok dengan metadata peserta saat ini, termasuk grup yang didukung LID.
- Obrolan status dan siaran (`@status`, `@broadcast`) diabaikan.
- Obrolan langsung menggunakan aturan sesi DM (`session.dmScope`; default `main` menggabungkan DM ke dalam sesi utama agen). Sesi grup diisolasi per JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Saluran/Buletin WhatsApp dapat menjadi tujuan keluar eksplisit melalui JID native `@newsletter`, menggunakan metadata sesi saluran (`agent:<agentId>:whatsapp:channel:<jid>`), bukan semantik DM.
- Transportasi WhatsApp Web mematuhi variabel lingkungan proksi standar pada host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, beserta varian huruf kecil). Utamakan konfigurasi proksi tingkat host daripada pengaturan per saluran.
- Dengan `messages.removeAckAfterReply` diaktifkan, OpenClaw menghapus reaksi tanda terima setelah balasan yang terlihat terkirim.

## Hubungi pemohon saat ini dengan MeowCaller (eksperimental)

Plugin dapat mengekspos `whatsapp_call` dalam giliran agen yang berasal dari WhatsApp. Plugin ini menggunakan [MeowCaller](https://github.com/purpshell/meowcaller) untuk melakukan panggilan suara WhatsApp kepada pemohon sah saat ini dan memutar pesan TTS OpenClaw setelah panggilan dijawab. Alat ini tidak memiliki parameter nomor tujuan, sehingga prompt tidak dapat mengalihkan panggilan. Dinonaktifkan secara default.

<Warning>
MeowCaller bersifat eksperimental, tidak memiliki rilis bertag, dan menggunakan sesi perangkat tertaut whatsmeow yang disandingkan secara terpisah—sesi ini tidak dapat menggunakan kembali kredensial Baileys milik plugin. Penyandingan menambahkan perangkat tertaut lain ke akun WhatsApp yang sama; pindai menggunakan identitas yang digunakan oleh OpenClaw. Mode nomor pribadi/obrolan mandiri tidak dapat menelepon dirinya sendiri; gunakan nomor khusus OpenClaw untuk menelepon nomor pribadi Anda.
</Warning>

<Steps>
  <Step title="Aktifkan panggilan eksperimental">

    Tambahkan `actions.calls: true` ke konfigurasi saluran WhatsApp dan mulai ulang Gateway:

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

    Adaptor mengharapkan executable `meowcaller` pada `PATH` milik host Gateway. Hingga [PR MeowCaller #7](https://github.com/purpshell/meowcaller/pull/7) digabungkan, build cabang yang telah direview:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Pastikan `$HOME/.local/bin` tersedia di `PATH` milik layanan Gateway. Revisi ini memiliki perintah `pair` yang eksplisit dan `notify` yang hanya mengirim; `notify` tidak membuka mikrofon, speaker, perangkat video, atau pengambilan diagnostik. Jangan menggantinya dengan perintah `play` milik CLI contoh upstream.

  </Step>

  <Step title="Sandingkan perangkat tertaut MeowCaller">

    Minta agen WhatsApp memeriksa penyiapan panggilan (tindakan status `whatsapp_call` melaporkan direktori status khusus akun dan perintah penyandingan). Untuk akun default:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Jalankan secara interaktif, pindai QR dari **WhatsApp > Linked devices**, dan tunggu `MeowCaller linked device ready`. Jaga kerahasiaan `wa-voip.db`—ini adalah sesi MeowCaller. Akun non-default mendapatkan jalur penyimpanannya sendiri dari tindakan status; pada Windows, jalankan perintah PowerShell-nya.

  </Step>

  <Step title="Konfigurasikan TTS dan lakukan panggilan dari WhatsApp">

    Konfigurasikan [penyedia TTS](/id/tools/tts) yang mendukung telefoni, mulai ulang Gateway, lalu kirim permintaan seperti `Call me and say the build finished.` Alat ini menentukan pengirim dari konteks masuk tepercaya, menyintesis file WAV privat sementara, menjalankan MeowCaller dalam jangka waktu panggilan terbatas, lalu menghapus file audio setelahnya. OpenClaw meneruskan penyimpanan akun secara eksplisit, menunggu status keluar nol setelah panggilan dijawab/pemutaran/ditutup, dan memperlakukan waktu tunggu habis atau status keluar bukan nol sebagai panggilan alat yang gagal.

  </Step>
</Steps>

Batasan: hanya panggilan audio keluar satu-ke-satu, tanpa nomor tujuan arbitrer, tanpa autentikasi bersama dengan koneksi obrolan, tanpa panggilan mandiri dari mode nomor pribadi/obrolan mandiri, audio hasil sintesis dibatasi hingga 60 detik, tanpa tanda terima keterdengaran di sisi handset selain penyelesaian jawab/pemutaran/tutup MeowCaller, dan OpenClaw menghentikan proses pendamping setelah jangka waktu terbatas 115-175 detik (mencakup fase koneksi, jawaban, pemutaran, dan penghentian MeowCaller).

## Prompt persetujuan

WhatsApp dapat merender prompt persetujuan eksekusi dan plugin sebagai reaksi `👍`/`👎`, yang dikendalikan oleh konfigurasi penerusan persetujuan tingkat atas:

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

`approvals.exec` dan `approvals.plugin` bersifat independen; mengaktifkan WhatsApp sebagai saluran hanya menautkan transportasi dan tidak mengirim apa pun kecuali kelompok persetujuan yang sesuai diaktifkan dan dirutekan ke sana. Mode sesi mengirimkan persetujuan emoji native hanya untuk persetujuan yang berasal dari WhatsApp. Mode target menggunakan pipeline penerusan bersama untuk target eksplisit dan tidak membuat penyebaran DM pemberi persetujuan secara terpisah.

Reaksi persetujuan WhatsApp memerlukan pemberi persetujuan eksplisit dalam `allowFrom` (atau `"*"`). `defaultTo` menetapkan target pesan default biasa, bukan daftar pemberi persetujuan. Perintah manual `/approve` tetap melewati jalur otorisasi pengirim WhatsApp normal sebelum penyelesaian persetujuan.

## Reaksi pertanyaan

Untuk prompt `ask_user` dengan satu pertanyaan non-rahasia, pilihan tunggal, dan satu hingga empat opsi, WhatsApp menampilkan `1️⃣` hingga `4️⃣` di samping label opsi. Berikan reaksi pada prompt yang dikirim dengan nomor yang sesuai untuk menjawabnya. OpenClaw memetakan nomor tersebut ke opsi kanonis melalui Gateway; ketukan kedaluwarsa atau duplikat diabaikan. Prompt multi-pertanyaan, multi-pilihan, dan teks bebas tetap hanya dapat dijawab melalui teks. Aturan penerimaan DM/grup WhatsApp normal mengotorisasi pengirim yang memberikan reaksi.

## Hook plugin dan privasi

Pesan WhatsApp masuk dapat memuat konten pribadi, nomor telepon, pengidentifikasi grup, nama pengirim, dan bidang korelasi sesi. WhatsApp tidak menyiarkan payload hook `message_received` masuk ke plugin kecuali Anda mengaktifkannya:

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

Batasi pengaktifan ke satu akun di bawah `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Aktifkan ini hanya untuk plugin yang Anda percayai untuk mengakses konten dan pengidentifikasi WhatsApp masuk.

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.whatsapp.dmPolicy`:

    | Nilai | Perilaku |
    | --- | --- |
    | `pairing` (default) | Pengirim yang tidak dikenal meminta penyandingan; pemilik menyetujui |
    | `allowlist` | Hanya pengirim `allowFrom` yang diterima |
    | `open` | Mengharuskan `allowFrom` menyertakan `"*"` |
    | `disabled` | Blokir semua DM |

    `allowFrom` menerima nomor bergaya E.164 (dinormalisasi secara internal). Ini hanya daftar kontrol akses pengirim DM — ini tidak membatasi pengiriman keluar eksplisit ke JID grup atau JID kanal `@newsletter`.

    Penggantian per akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `.allowFrom`) lebih diutamakan daripada nilai default tingkat kanal untuk akun tersebut.

    Catatan runtime:

    - pemasangan tetap tersimpan di penyimpanan izin kanal dan digabungkan dengan `allowFrom` yang dikonfigurasi
    - otomatisasi terjadwal dan fallback penerima heartbeat menggunakan target pengiriman eksplisit atau `allowFrom` yang dikonfigurasi; persetujuan pemasangan DM bukan penerima cron/heartbeat implisit
    - jika tidak ada daftar izin yang dikonfigurasi, nomor sendiri yang ditautkan diizinkan secara default
    - OpenClaw tidak pernah memasangkan secara otomatis DM `fromMe` keluar (pesan yang Anda kirim sendiri dari perangkat yang ditautkan)

  </Tab>

  <Tab title="Kebijakan grup dan daftar izin">
    Akses grup memiliki dua lapisan:

    1. **Daftar izin keanggotaan grup** (`channels.whatsapp.groups`): jika `groups` dihilangkan, semua grup memenuhi syarat; jika ada, ini bertindak sebagai daftar izin grup (`"*"` mengizinkan semuanya).
    2. **Kebijakan pengirim grup** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` melewati daftar izin pengirim, `allowlist` memerlukan kecocokan `groupAllowFrom` (atau `*`), `disabled` memblokir semua pesan masuk grup.

    Jika `groupAllowFrom` tidak ditetapkan, pemeriksaan pengirim menggunakan `allowFrom` sebagai fallback jika memiliki entri. Daftar izin pengirim dievaluasi sebelum aktivasi penyebutan/balasan.

    Jika sama sekali tidak ada blok `channels.whatsapp`, runtime menggunakan `groupPolicy: "allowlist"` sebagai fallback (dengan log peringatan), meskipun `channels.defaults.groupPolicy` ditetapkan ke nilai lain.

    <Note>
    Resolusi keanggotaan grup memiliki pengaman akun tunggal: jika hanya satu akun WhatsApp yang dikonfigurasi dan `accounts.<id>.groups`-nya adalah objek kosong eksplisit (`{}`), itu dianggap sebagai "tidak ditetapkan" dan menggunakan peta `channels.whatsapp.groups` root sebagai fallback, alih-alih memblokir setiap grup secara diam-diam. Jika 2+ akun dikonfigurasi, peta akun kosong eksplisit tetap kosong dan tidak menggunakan fallback — ini memungkinkan satu akun menonaktifkan semua grup secara sengaja tanpa memengaruhi akun lain.
    </Note>

  </Tab>

  <Tab title="Penyebutan dan /activation">
    Balasan grup secara default memerlukan penyebutan. Deteksi penyebutan mencakup:

    - penyebutan WhatsApp eksplisit terhadap identitas bot
    - pola regex penyebutan yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transkrip catatan suara masuk untuk pesan grup yang diotorisasi
    - deteksi balasan-ke-bot implisit (pengirim balasan cocok dengan identitas bot)

    Keamanan: kutipan/balasan hanya memenuhi pembatasan penyebutan — hal tersebut **tidak** memberikan otorisasi pengirim. Dengan `groupPolicy: "allowlist"`, pengirim yang tidak tercantum dalam daftar izin tetap diblokir meskipun membalas pesan pengguna yang tercantum dalam daftar izin.

    Perintah aktivasi tingkat sesi: `/activation mention` atau `/activation always`. Ini memperbarui status sesi (bukan konfigurasi global) dan dibatasi untuk pemilik.

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

Percakapan langsung dicocokkan dengan nomor E.164; grup dicocokkan dengan JID grup WhatsApp. Daftar izin grup, kebijakan pengirim, dan pembatasan penyebutan/aktivasi dijalankan sebelum OpenClaw memastikan sesi ACP yang terikat tersedia. Pengikatan yang cocok memiliki rute tersebut — grup siaran tidak menyebarkan giliran itu ke sesi WhatsApp biasa.

## Perilaku nomor pribadi dan percakapan dengan diri sendiri

Jika nomor sendiri yang ditautkan juga ada dalam `allowFrom`, pengaman percakapan dengan diri sendiri diaktifkan: melewati tanda pesan telah dibaca untuk giliran percakapan dengan diri sendiri, mengabaikan perilaku pemicu otomatis JID penyebutan yang akan melakukan ping kepada diri sendiri, dan mengarahkan balasan secara default ke `[{identity.name}]` (atau `[openclaw]`) ketika `messages.responsePrefix` tidak ditetapkan.

## Normalisasi pesan dan konteks

<AccordionGroup>
  <Accordion title="Envelope pesan masuk dan konteks balasan">
    Pesan masuk dibungkus dalam envelope pesan masuk bersama. Balasan yang dikutip menambahkan konteks dalam bentuk berikut:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Metadata balasan (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 pengirim) diisi jika tersedia. Jika target yang dikutip berupa media yang dapat diunduh, OpenClaw menyimpannya melalui penyimpanan media masuk normal dan mengekspos `MediaPath`/`MediaType` agar agen dapat memeriksanya secara langsung alih-alih hanya melihat `<media:image>`.

  </Accordion>

  <Accordion title="Placeholder media dan ekstraksi lokasi/kontak">
    Pesan yang hanya berisi media dinormalisasi menjadi placeholder: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Catatan suara grup yang diotorisasi ditranskripsikan sebelum pembatasan penyebutan jika isi pesan hanya `<media:audio>`, sehingga mengucapkan penyebutan bot dalam catatan suara dapat memicu balasan. Jika transkrip masih tidak menyebut bot, transkrip tersebut tetap berada dalam riwayat grup tertunda, bukan placeholder mentah.

    Isi lokasi dirender sebagai teks koordinat ringkas. Label/komentar lokasi dan detail kontak/vCard dirender sebagai metadata tidak tepercaya berpagar, bukan teks prompt inline.

  </Accordion>

  <Accordion title="Injeksi riwayat grup tertunda">
    Pesan grup yang belum diproses disangga dan diinjeksikan sebagai konteks ketika bot akhirnya dipicu.

    - batas default: `50`
    - konfigurasi: `channels.whatsapp.historyLimit`, fallback `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Penanda injeksi: `[Chat messages since your last reply - for context]` dan `[Current message - respond to this]`.

  </Accordion>

  <Accordion title="Tanda pesan telah dibaca">
    Diaktifkan secara default untuk pesan masuk yang diterima. Nonaktifkan secara global:

    ```json5
    { channels: { whatsapp: { sendReadReceipts: false } } }
    ```

    Penggantian per akun: `channels.whatsapp.accounts.<id>.sendReadReceipts`. Giliran percakapan dengan diri sendiri melewati tanda pesan telah dibaca meskipun diaktifkan secara global.

  </Accordion>
</AccordionGroup>

## Pengiriman, pemenggalan, dan media

<AccordionGroup>
  <Accordion title="Pemenggalan teks">
    - batas potongan default: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.streaming.chunkMode = "length" | "newline"`; `newline` mengutamakan batas paragraf (baris kosong), lalu menggunakan pemenggalan yang aman berdasarkan panjang sebagai fallback

  </Accordion>

  <Accordion title="Perilaku media keluar">
    - mendukung payload gambar, video, audio (catatan suara PTT), dan dokumen
    - audio dikirim sebagai payload Baileys `audio` dengan `ptt: true`, yang dirender sebagai catatan suara push-to-talk; `audioAsVoice` dipertahankan pada payload balasan agar keluaran catatan suara TTS tetap menggunakan jalur ini terlepas dari format sumber penyedia
    - audio Ogg/Opus native dikirim sebagai `audio/ogg; codecs=opus`; selain itu (termasuk keluaran MP3/WebM TTS Microsoft Edge) ditranskode dengan `ffmpeg` menjadi Ogg/Opus mono 48 kHz sebelum pengiriman PTT
    - `/tts latest` mengirim balasan asisten terbaru sebagai satu catatan suara dan mencegah pengiriman berulang untuk balasan yang sama; `/tts chat on|off|default` mengontrol TTS otomatis untuk percakapan saat ini
    - `gifPlayback: true` pada pengiriman video mengaktifkan pemutaran GIF animasi
    - `forceDocument`/`asDocument` merutekan gambar, GIF, dan video keluar melalui payload dokumen Baileys untuk menghindari kompresi media WhatsApp, dengan mempertahankan nama berkas dan jenis MIME yang telah diresolusi
    - keterangan diterapkan pada item media pertama dalam balasan multi-media, kecuali catatan suara PTT: audio dikirim terlebih dahulu tanpa keterangan, lalu keterangan dikirim sebagai pesan teks terpisah (klien WhatsApp tidak merender keterangan catatan suara secara konsisten)
    - sumber media dapat berupa HTTP(S), `file://`, atau jalur lokal

  </Accordion>

  <Accordion title="Batas ukuran media dan perilaku fallback">
    - batas penyimpanan masuk dan batas pengiriman keluar: `channels.whatsapp.mediaMaxMb` (default `50`)
    - penggantian per akun: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - gambar dioptimalkan secara otomatis (pengubahan ukuran/penyisiran kualitas) agar sesuai batas kecuali `forceDocument`/`asDocument` meminta pengiriman dokumen
    - jika pengiriman media gagal, fallback item pertama mengirim peringatan teks alih-alih menghilangkan respons secara diam-diam

  </Accordion>
</AccordionGroup>

## Pengutipan balasan

`channels.whatsapp.replyToMode` mengontrol pengutipan balasan native (balasan keluar secara terlihat mengutip pesan masuk):

| Nilai             | Perilaku                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (default) | Jangan pernah mengutip; kirim sebagai pesan biasa                           |
| `"first"`         | Kutip hanya potongan balasan keluar pertama                      |
| `"all"`           | Kutip setiap potongan balasan keluar                               |
| `"batched"`       | Kutip balasan batch dalam antrean; biarkan balasan langsung tanpa kutipan |

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

`channels.whatsapp.ackReaction` mengirim reaksi langsung saat pesan masuk diterima, yang dibatasi oleh `reactionLevel` (ditekan ketika `"off"`):

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

Catatan: dikirim segera setelah pesan masuk diterima (sebelum balasan); jika `ackReaction` ada tanpa `emoji`, WhatsApp menggunakan emoji identitas agen yang dirutekan dengan fallback ke "👀" (hilangkan `ackReaction` atau tetapkan `emoji: ""` agar tidak ada konfirmasi); kegagalan dicatat dalam log tetapi tidak memblokir pengiriman balasan; mode grup `mentions` bereaksi hanya pada giliran yang dipicu penyebutan, sedangkan aktivasi grup `always` melewati pemeriksaan tersebut; WhatsApp hanya menggunakan `channels.whatsapp.ackReaction` (`messages.ackReaction` lama tidak berlaku di sini).

## Reaksi status siklus proses

Tetapkan `messages.statusReactions.enabled: true` agar WhatsApp mengganti reaksi konfirmasi selama suatu giliran alih-alih membiarkan emoji penerimaan statis, dengan beralih melalui status seperti dalam antrean, berpikir, aktivitas alat, compaction, selesai, dan kesalahan:

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

Catatan: `channels.whatsapp.ackReaction` tetap mengontrol kelayakan untuk pesan langsung dan grup; status antrean menggunakan emoji efektif yang sama seperti reaksi konfirmasi biasa; WhatsApp memiliki satu slot reaksi bot per pesan, sehingga pembaruan siklus hidup menggantikan reaksi saat ini secara langsung; `messages.removeAckAfterReply: true` menghapus reaksi status akhir setelah durasi penyimpanan selesai/kesalahan yang dikonfigurasi; kategori emoji alat mencakup `tool`, `coding`, `web`, `deploy`, `build`, dan `concierge`.

## Multiakun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan nilai default">
    ID akun berasal dari `channels.whatsapp.accounts`. Pemilihan akun default adalah `default` jika tersedia; jika tidak, ID akun pertama yang dikonfigurasi (diurutkan secara alfabetis). ID akun dinormalisasi secara internal untuk pencarian.
  </Accordion>

  <Accordion title="Jalur kredensial dan kompatibilitas lama">
    - jalur autentikasi saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (cadangan: `creds.json.bak`)
    - autentikasi default lama di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default

  </Accordion>

  <Accordion title="Perilaku keluar">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status autentikasi WhatsApp untuk akun tersebut. Saat Gateway dapat dijangkau, proses keluar terlebih dahulu menghentikan listener aktif untuk akun tersebut, sehingga sesi tertaut berhenti menerima pesan sebelum pemulaian ulang berikutnya. `openclaw channels remove --channel whatsapp` juga menghentikan listener aktif sebelum menonaktifkan atau menghapus konfigurasi akun.

    Dalam direktori autentikasi lama, `oauth.json` dipertahankan sementara file autentikasi Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Alat, tindakan, dan penulisan konfigurasi

- Dukungan alat agen mencakup tindakan reaksi WhatsApp (`react`).
- Gerbang tindakan: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (tindakan yang sudah ada secara default menggunakan `true`), `channels.whatsapp.actions.calls` (default `false`, lihat MeowCaller di atas).
- Penulisan konfigurasi yang dimulai oleh saluran diaktifkan secara default; nonaktifkan melalui `channels.whatsapp.configWrites: false`.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Belum tertaut (kode QR diperlukan)">
    Gejala: status saluran melaporkan bahwa saluran belum tertaut.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Tertaut tetapi terputus / perulangan penyambungan ulang">
    Gejala: akun tertaut mengalami pemutusan atau upaya penyambungan ulang berulang kali.

    Akun yang tidak aktif dapat tetap terhubung melewati batas waktu pesan normal; pengawas hanya memulai ulang ketika aktivitas transportasi WhatsApp Web berhenti, soket tertutup, atau aktivitas tingkat aplikasi tetap tidak ada melampaui jendela keamanan yang lebih panjang (lihat Model runtime di atas).

    Perbaikan:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Jika perulangan berlanjut setelah konektivitas host dan pengaturan waktu diperbaiki, cadangkan direktori autentikasi akun lalu tautkan ulang:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Jika `~/.openclaw/logs/whatsapp-health.log` menyatakan `Gateway inactive`, tetapi `openclaw gateway status` dan `openclaw channels status --probe` sama-sama menunjukkan kondisi sehat, jalankan `openclaw doctor`. Di Linux, doctor memperingatkan tentang entri crontab lama yang memanggil skrip `~/.openclaw/bin/ensure-whatsapp.sh` yang telah dihentikan; hapus entri tersebut dengan `crontab -e` — cron mungkin tidak memiliki lingkungan bus pengguna systemd dan menyebabkan skrip lama tersebut salah melaporkan kesehatan Gateway.

  </Accordion>

  <Accordion title="Waktu login QR habis di belakang proksi">
    Gejala: `openclaw channels login --channel whatsapp` gagal sebelum menampilkan kode QR yang dapat digunakan dengan `status=408 Request Time-out` atau pemutusan soket TLS.

    Login WhatsApp Web menggunakan lingkungan proksi standar host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varian huruf kecil, `NO_PROXY`). Pastikan proses Gateway mewarisi lingkungan proksi dan `NO_PROXY` tidak cocok dengan `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Tidak ada listener aktif saat mengirim">
    Pengiriman keluar langsung gagal ketika tidak ada listener Gateway aktif untuk akun tujuan. Pastikan Gateway berjalan dan akun telah tertaut.
  </Accordion>

  <Accordion title="Balasan muncul dalam transkrip tetapi tidak di WhatsApp">
    Baris transkrip mencatat apa yang dihasilkan agen; pengiriman WhatsApp diperiksa secara terpisah. OpenClaw hanya menganggap balasan otomatis telah dikirim setelah Baileys mengembalikan ID pesan keluar untuk setidaknya satu pengiriman teks atau media yang terlihat.

    Reaksi konfirmasi merupakan tanda terima prabalasan yang independen — reaksi yang berhasil tidak membuktikan bahwa balasan teks/media berikutnya diterima. Periksa log Gateway untuk `auto-reply delivery failed` atau `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Pesan grup tiba-tiba diabaikan">
    Periksa dalam urutan berikut: `groupPolicy`, `groupAllowFrom`/`allowFrom`, entri daftar izin `groups`, pembatasan penyebutan (`requireMention` + pola penyebutan), dan kunci duplikat di `openclaw.json` (entri JSON5 yang lebih akhir menimpa entri sebelumnya — pertahankan hanya satu `groupPolicy` per cakupan).

    Jika `channels.whatsapp.groups` tersedia, WhatsApp masih dapat mengamati pesan dari grup lain, tetapi OpenClaw membuangnya sebelum perutean sesi. Tambahkan JID grup ke `channels.whatsapp.groups`, atau tambahkan `groups["*"]` untuk menerima semua grup sambil tetap mempertahankan otorisasi pengirim melalui `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Gateway OpenClaw memerlukan Node. Bun tidak menyediakan API `node:sqlite` yang digunakan oleh penyimpanan status kanonis, dan doctor memigrasikan layanan Bun lama ke Node.
  </Accordion>
</AccordionGroup>

## Prompt sistem

WhatsApp mendukung prompt sistem bergaya Telegram untuk grup dan percakapan langsung melalui peta `groups` dan `direct`.

Resolusi untuk pesan grup: peta `groups` yang efektif ditentukan terlebih dahulu — jika akun mendefinisikan kunci `groups` miliknya sendiri, peta tersebut sepenuhnya menggantikan peta `groups` tingkat akar (tanpa penggabungan mendalam). Pencarian prompt kemudian dijalankan pada satu peta hasil tersebut:

1. **Prompt khusus grup** (`groups["<groupId>"].systemPrompt`): digunakan ketika entri grup tersedia **dan** kunci `systemPrompt` ditentukan. String kosong (`""`) menekan karakter pengganti dan tidak menerapkan prompt apa pun.
2. **Prompt karakter pengganti grup** (`groups["*"].systemPrompt`): digunakan ketika entri grup tertentu tidak tersedia, atau tersedia tanpa kunci `systemPrompt`.

Resolusi untuk pesan langsung mengikuti pola yang sama terhadap peta `direct` dan `direct["*"]`.

<Note>
`dms` tetap menjadi wadah penggantian riwayat per pesan langsung yang ringan (`dms.<id>.historyLimit`). Penggantian prompt berada di bawah `direct`.
</Note>

<Note>
Perilaku akun-menggantikan-akar untuk resolusi prompt ini merupakan penggantian dangkal biasa: setiap kunci `groups`/`direct` pada akun, termasuk objek kosong eksplisit, menggantikan peta akar. Perilaku ini berbeda dari pemeriksaan daftar izin keanggotaan grup yang dijelaskan di atas, yang memiliki perlindungan akun tunggal untuk `groups: {}` yang kosong secara tidak sengaja.
</Note>

**Perbedaan dari Telegram:** Telegram menekan `groups` tingkat akar untuk setiap akun dalam konfigurasi multiakun (bahkan akun yang tidak memiliki `groups` sendiri) agar bot tidak menerima pesan grup dari grup yang bukan tempatnya bergabung. WhatsApp tidak menerapkan perlindungan tersebut — `groups`/`direct` tingkat akar diwarisi oleh setiap akun tanpa penggantian sendiri, terlepas dari jumlah akun. Dalam konfigurasi WhatsApp multiakun, tentukan peta lengkap secara eksplisit di bawah setiap akun jika Anda menginginkan prompt per akun.

Perilaku penting:

- `channels.whatsapp.groups` merupakan peta konfigurasi per grup sekaligus daftar izin grup tingkat percakapan. Pada cakupan akar maupun akun, `groups["*"]` berarti "semua grup diterima" untuk cakupan tersebut.
- Hanya tambahkan karakter pengganti `systemPrompt` jika Anda memang ingin cakupan tersebut menerima semua grup. Agar hanya sekumpulan ID grup tertentu yang memenuhi syarat, ulangi prompt pada setiap entri yang secara eksplisit masuk daftar izin, alih-alih menggunakan `groups["*"]`.
- Penerimaan grup dan otorisasi pengirim merupakan pemeriksaan terpisah. `groups["*"]` memperluas grup mana yang mencapai penanganan grup; tindakan ini tidak mengotorisasi setiap pengirim dalam grup tersebut — hal itu tetap dikontrol oleh `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` tidak memiliki efek samping yang setara untuk pesan langsung: `direct["*"]` hanya menyediakan konfigurasi default setelah pesan langsung diterima oleh `dmPolicy` beserta `allowFrom` atau aturan penyimpanan pemasangan.

Contoh:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Gunakan hanya jika semua grup harus diterima pada cakupan akar.
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
            // Akun ini mendefinisikan groups sendiri, sehingga groups tingkat akar
            // sepenuhnya diganti. Untuk mempertahankan karakter pengganti, tentukan "*" secara eksplisit di sini juga.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Fokus pada manajemen proyek.",
            },
            // Gunakan hanya jika semua grup harus diterima di akun ini.
            "*": { systemPrompt: "Prompt default untuk grup kerja." },
          },
          direct: {
            // Akun ini mendefinisikan peta direct sendiri, sehingga entri direct tingkat akar
            // sepenuhnya diganti. Untuk mempertahankan karakter pengganti, tentukan "*" secara eksplisit di sini juga.
            "+15551234567": { systemPrompt: "Prompt untuk percakapan langsung kerja tertentu." },
            "*": { systemPrompt: "Prompt default untuk percakapan langsung kerja." },
          },
        },
      },
    },
  },
}
```

## Petunjuk referensi konfigurasi

Referensi utama: [Referensi konfigurasi - WhatsApp](/id/gateway/config-channels#whatsapp)

| Area             | Bidang                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Akses            | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Pengiriman       | `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`      |
| Multiakun        | `accounts.<id>.enabled`, `accounts.<id>.authDir`, dan penggantian per akun lainnya                              |
| Operasi          | `configWrites`, `debounceMs`, `web.enabled`                                                                    |
| Perilaku sesi    | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompt           | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Terkait

- [Pemasangan](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Keamanan](/id/gateway/security)
- [Perutean saluran](/id/channels/channel-routing)
- [Perutean multiagen](/id/concepts/multi-agent)
- [Pemecahan masalah](/id/channels/troubleshooting)
