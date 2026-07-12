---
read_when:
    - Menangani perilaku kanal WhatsApp/web atau perutean kotak masuk
summary: Dukungan kanal WhatsApp, kontrol akses, perilaku pengiriman, dan pengoperasian
title: WhatsApp
x-i18n:
    generated_at: "2026-07-12T13:58:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f416d2b7a75e9c4798ded34a1ec5d9d7f49ab99a56977f1383347936fe47af55
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: siap produksi melalui WhatsApp Web (Baileys). Gateway mengelola sesi yang ditautkan; tidak ada kanal WhatsApp Twilio terpisah.

## Instalasi

`openclaw onboard` dan `openclaw channels add --channel whatsapp` meminta Anda menginstal plugin saat pertama kali memilihnya; `openclaw channels login --channel whatsapp` menawarkan alur instalasi yang sama jika plugin belum tersedia. Checkout pengembangan menggunakan jalur plugin lokal; instalasi stabil/beta terlebih dahulu menginstal `@openclaw/whatsapp` dari ClawHub, dengan npm sebagai cadangan. Runtime WhatsApp dikirimkan di luar paket npm inti OpenClaw, sehingga dependensi runtime-nya tetap berada di plugin eksternal. Instalasi manual:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Gunakan paket npm tanpa prefiks (`@openclaw/whatsapp`) hanya sebagai cadangan registri; sematkan versi yang tepat hanya untuk instalasi yang dapat direproduksi.

<CardGroup cols={3}>
  <Card title="Penyandingan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default adalah penyandingan untuk pengirim yang tidak dikenal.
  </Card>
  <Card title="Pemecahan masalah kanal" icon="wrench" href="/id/channels/troubleshooting">
    Diagnostik lintas kanal dan panduan perbaikan.
  </Card>
  <Card title="Konfigurasi Gateway" icon="settings" href="/id/gateway/configuration">
    Pola dan contoh konfigurasi kanal lengkap.
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

    Login hanya menggunakan QR. Pada host jarak jauh atau tanpa antarmuka grafis, pastikan tersedia cara yang andal untuk mengirimkan QR aktif ke ponsel sebelum memulai login; QR yang dirender di terminal, tangkapan layar, atau lampiran obrolan dapat kedaluwarsa selama pengiriman.

    Untuk akun tertentu:

```bash
openclaw channels login --channel whatsapp --account work
```

    Untuk melampirkan direktori autentikasi yang sudah ada atau kustom sebelum login:

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

    Permintaan penyandingan kedaluwarsa setelah 1 jam; jumlah permintaan tertunda dibatasi hingga 3 per akun.

  </Step>
</Steps>

<Note>
Nomor WhatsApp terpisah direkomendasikan (penyiapan dan metadata dioptimalkan untuknya), tetapi penyiapan dengan nomor pribadi atau obrolan dengan diri sendiri didukung sepenuhnya.
</Note>

## Pola penerapan

<AccordionGroup>
  <Accordion title="Nomor khusus (direkomendasikan)">
    - identitas WhatsApp terpisah untuk OpenClaw
    - daftar izin DM dan batas perutean yang lebih jelas
    - kemungkinan kebingungan akibat obrolan dengan diri sendiri yang lebih rendah

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

  <Accordion title="Cadangan nomor pribadi">
    Orientasi awal mendukung mode nomor pribadi dan menulis konfigurasi dasar yang sesuai untuk obrolan dengan diri sendiri: `dmPolicy: "allowlist"`, `allowFrom` yang menyertakan nomor Anda sendiri, `selfChatMode: true`. Perlindungan runtime untuk obrolan dengan diri sendiri mengacu pada nomor diri yang ditautkan beserta `allowFrom`.
  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway mengelola soket WhatsApp dan perulangan penyambungan ulang.
- Pengawas memantau dua sinyal secara independen: aktivitas transportasi mentah WhatsApp Web dan aktivitas pesan aplikasi. Sesi yang sepi tetapi masih terhubung tidak dimulai ulang hanya karena tidak ada pesan yang baru-baru ini tiba; penyambungan ulang dipaksakan hanya ketika frame transportasi berhenti tiba selama jangka waktu internal tetap (tidak dapat dikonfigurasi pengguna) atau pesan aplikasi tetap tidak ada melampaui 4x batas waktu pesan normal. Tepat setelah penyambungan ulang untuk sesi yang baru-baru ini aktif, jangka waktu pertama tersebut menggunakan batas waktu pesan normal yang lebih pendek, bukan jangka waktu 4x. OpenClaw dapat membalas otomatis pesan luring yang dikirimkan lebih awal oleh Baileys selama penyambungan ulang tersebut, dengan batas sesuai masa berlaku deduplikasi ID pesan masuk; proses awal pertama tetap menggunakan perlindungan singkat terhadap riwayat usang.
- Pengaturan waktu soket Baileys dinyatakan secara eksplisit dalam `web.whatsapp.*`: `keepAliveIntervalMs` (interval ping aplikasi), `connectTimeoutMs` (batas waktu handshake pembukaan), `defaultQueryTimeoutMs` (waktu tunggu kueri Baileys, serta batas waktu pengiriman/kehadiran keluar dan tanda terima baca masuk OpenClaw).
- Pengiriman keluar memerlukan listener WhatsApp aktif untuk akun tujuan; jika tidak, pengiriman langsung gagal.
- Pengiriman grup melampirkan metadata penyebutan native untuk token `@+<digits>` dan `@<digits>` (dalam teks dan keterangan media) ketika token cocok dengan metadata peserta saat ini, termasuk grup berbasis LID.
- Obrolan status dan siaran (`@status`, `@broadcast`) diabaikan.
- Obrolan langsung menggunakan aturan sesi DM (`session.dmScope`; nilai default `main` menggabungkan DM ke dalam sesi utama agen). Sesi grup diisolasi per JID (`agent:<agentId>:whatsapp:group:<jid>`).
- Kanal/Buletin WhatsApp dapat menjadi target keluar eksplisit melalui JID native `@newsletter`, menggunakan metadata sesi kanal (`agent:<agentId>:whatsapp:channel:<jid>`) alih-alih semantik DM.
- Transportasi WhatsApp Web mematuhi variabel lingkungan proksi standar pada host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, beserta varian huruf kecil). Utamakan konfigurasi proksi tingkat host daripada pengaturan per kanal.
- Saat `messages.removeAckAfterReply` diaktifkan, OpenClaw menghapus reaksi tanda terima setelah balasan yang terlihat berhasil dikirimkan.

## Hubungi pemohon saat ini dengan MeowCaller (eksperimental)

Plugin dapat menyediakan `whatsapp_call` dalam giliran agen yang berasal dari WhatsApp. Fitur ini menggunakan [MeowCaller](https://github.com/purpshell/meowcaller) untuk melakukan panggilan suara WhatsApp kepada pemohon berwenang saat ini dan memutar pesan TTS OpenClaw setelah panggilan dijawab. Alat ini tidak memiliki parameter nomor tujuan, sehingga perintah tidak dapat mengalihkan panggilan. Dinonaktifkan secara default.

<Warning>
MeowCaller bersifat eksperimental, tidak memiliki rilis bertag, dan menggunakan sesi perangkat tertaut whatsmeow yang disandingkan secara terpisah—sesi ini tidak dapat menggunakan kembali kredensial Baileys milik plugin. Penyandingan menambahkan perangkat tertaut lain ke akun WhatsApp yang sama; pindai menggunakan identitas yang digunakan oleh OpenClaw. Mode nomor pribadi atau obrolan dengan diri sendiri tidak dapat menelepon dirinya sendiri; gunakan nomor khusus OpenClaw untuk menelepon nomor pribadi Anda.
</Warning>

<Steps>
  <Step title="Aktifkan panggilan eksperimental">

    Tambahkan `actions.calls: true` ke konfigurasi kanal WhatsApp dan mulai ulang Gateway:

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

    Jika tidak ada atau bernilai `false`, OpenClaw tidak menyediakan alat `whatsapp_call`.

  </Step>

  <Step title="Instal CLI MeowCaller yang telah ditinjau">

    Adaptor mengharapkan executable `meowcaller` tersedia di `PATH` host Gateway. Hingga [PR MeowCaller #7](https://github.com/purpshell/meowcaller/pull/7) digabungkan, build cabang yang telah ditinjau:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Pastikan `$HOME/.local/bin` tercantum dalam `PATH` layanan Gateway. Revisi ini memiliki perintah `pair` dan `notify` khusus pengiriman yang eksplisit; `notify` tidak membuka mikrofon, speaker, perangkat video, maupun perekaman diagnostik. Jangan menggantinya dengan perintah `play` dari CLI contoh upstream.

  </Step>

  <Step title="Sandingkan perangkat tertaut MeowCaller">

    Minta agen WhatsApp memeriksa penyiapan panggilan (tindakan status `whatsapp_call` melaporkan direktori status khusus akun dan perintah penyandingan). Untuk akun default:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Jalankan secara interaktif, pindai QR dari **WhatsApp > Linked devices**, lalu tunggu `MeowCaller linked device ready`. Jaga kerahasiaan `wa-voip.db`—file ini adalah sesi MeowCaller. Akun non-default mendapatkan jalur penyimpanan masing-masing dari tindakan status; di Windows, jalankan perintah PowerShell yang diberikan.

  </Step>

  <Step title="Konfigurasikan TTS dan lakukan panggilan dari WhatsApp">

    Konfigurasikan [penyedia TTS](/id/tools/tts) yang mendukung telefoni, mulai ulang Gateway, lalu kirim permintaan seperti `Telepon saya dan katakan bahwa build telah selesai.` Alat ini menentukan pengirim dari konteks masuk tepercaya, menyintesis file WAV privat sementara, menjalankan MeowCaller dalam jangka waktu panggilan terbatas, lalu menghapus file audio sesudahnya. OpenClaw meneruskan penyimpanan akun secara eksplisit, menunggu status keluar nol setelah panggilan dijawab/pemutaran selesai/panggilan ditutup, serta menganggap batas waktu habis atau status keluar bukan nol sebagai kegagalan pemanggilan alat.

  </Step>
</Steps>

Batasan: hanya panggilan audio keluar satu-ke-satu, tanpa nomor tujuan arbitrer, tanpa autentikasi bersama dengan koneksi obrolan, tanpa panggilan ke diri sendiri dari mode nomor pribadi atau obrolan dengan diri sendiri, audio hasil sintesis dibatasi hingga 60 detik, tidak ada tanda terima keterdengaran di sisi perangkat selain penyelesaian tahap jawaban/pemutaran/penutupan panggilan MeowCaller, dan OpenClaw menghentikan proses pendamping setelah jangka waktu terbatas 115–175 detik (mencakup fase koneksi, jawaban, pemutaran, dan penghentian MeowCaller).

## Perintah persetujuan

WhatsApp dapat merender perintah persetujuan eksekusi dan plugin sebagai reaksi `👍`/`👎`, yang dikendalikan oleh konfigurasi penerusan persetujuan tingkat atas:

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

`approvals.exec` dan `approvals.plugin` bersifat independen; mengaktifkan WhatsApp sebagai kanal hanya menautkan transportasi dan tidak mengirimkan apa pun kecuali kelompok persetujuan yang sesuai diaktifkan dan dirutekan ke sana. Mode sesi mengirimkan persetujuan emoji native hanya untuk persetujuan yang berasal dari WhatsApp. Mode target menggunakan pipeline penerusan bersama untuk target eksplisit dan tidak membuat fan-out DM pemberi persetujuan secara terpisah.

Reaksi persetujuan WhatsApp memerlukan pemberi persetujuan eksplisit dalam `allowFrom` (atau `"*"`). `defaultTo` menetapkan target pesan default biasa, bukan daftar pemberi persetujuan. Perintah manual `/approve` tetap melewati jalur otorisasi pengirim WhatsApp normal sebelum penyelesaian persetujuan.

## Hook Plugin dan privasi

Pesan WhatsApp masuk dapat memuat konten pribadi, nomor telepon, pengenal grup, nama pengirim, dan bidang korelasi sesi. WhatsApp tidak menyiarkan payload hook `message_received` masuk kepada plugin kecuali Anda mengaktifkannya:

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

Batasi pengaktifan ke satu akun di `channels.whatsapp.accounts.<id>.pluginHooks.messageReceived`. Aktifkan ini hanya untuk plugin yang Anda percayai untuk mengakses konten dan pengenal WhatsApp masuk.

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.whatsapp.dmPolicy`:

    | Nilai | Perilaku |
    | --- | --- |
    | `pairing` (default) | Pengirim yang tidak dikenal meminta penyandingan; pemilik menyetujui |
    | `allowlist` | Hanya pengirim dalam `allowFrom` yang diterima |
    | `open` | Mengharuskan `allowFrom` menyertakan `"*"` |
    | `disabled` | Blokir semua DM |

    `allowFrom` menerima nomor bergaya E.164 (dinormalisasi secara internal). Ini hanya merupakan daftar kontrol akses pengirim DM—tidak membatasi pengiriman keluar eksplisit ke JID grup atau JID kanal `@newsletter`.

    Penggantian untuk banyak akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `.allowFrom`) lebih diprioritaskan daripada default tingkat kanal untuk akun tersebut.

    Catatan runtime:

    - pemasangan disimpan di penyimpanan daftar izin saluran dan digabungkan dengan `allowFrom` yang dikonfigurasi
    - otomatisasi terjadwal dan fallback penerima heartbeat menggunakan target pengiriman eksplisit atau `allowFrom` yang dikonfigurasi; persetujuan pemasangan DM tidak secara implisit menjadi penerima cron/heartbeat
    - jika tidak ada daftar izin yang dikonfigurasi, nomor sendiri yang ditautkan diizinkan secara default
    - OpenClaw tidak pernah memasangkan secara otomatis DM `fromMe` keluar (pesan yang Anda kirim kepada diri sendiri dari perangkat yang ditautkan)

  </Tab>

  <Tab title="Kebijakan grup dan daftar izin">
    Akses grup memiliki dua lapisan:

    1. **Daftar izin keanggotaan grup** (`channels.whatsapp.groups`): jika `groups` dihilangkan, semua grup memenuhi syarat; jika ada, nilai tersebut bertindak sebagai daftar izin grup (`"*"` mengizinkan semuanya).
    2. **Kebijakan pengirim grup** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`): `open` melewati daftar izin pengirim, `allowlist` memerlukan kecocokan `groupAllowFrom` (atau `*`), dan `disabled` memblokir semua pesan masuk grup.

    Jika `groupAllowFrom` tidak ditetapkan, pemeriksaan pengirim menggunakan `allowFrom` sebagai fallback ketika memiliki entri. Daftar izin pengirim dievaluasi sebelum aktivasi melalui penyebutan/balasan.

    Jika blok `channels.whatsapp` sama sekali tidak ada, runtime menggunakan `groupPolicy: "allowlist"` sebagai fallback (dengan log peringatan), meskipun `channels.defaults.groupPolicy` ditetapkan ke nilai lain.

    <Note>
    Resolusi keanggotaan grup memiliki pengaman untuk satu akun: jika hanya satu akun WhatsApp yang dikonfigurasi dan `accounts.<id>.groups` miliknya adalah objek kosong eksplisit (`{}`), nilai tersebut dianggap "belum ditetapkan" dan menggunakan peta `channels.whatsapp.groups` tingkat akar sebagai fallback, alih-alih memblokir setiap grup secara diam-diam. Jika 2+ akun dikonfigurasi, peta akun kosong eksplisit tetap kosong dan tidak menggunakan fallback—ini memungkinkan satu akun menonaktifkan semua grup secara sengaja tanpa memengaruhi akun lainnya.
    </Note>

  </Tab>

  <Tab title="Penyebutan dan /activation">
    Balasan grup memerlukan penyebutan secara default. Deteksi penyebutan mencakup:

    - penyebutan WhatsApp eksplisit terhadap identitas bot
    - pola regex penyebutan yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transkrip catatan suara masuk untuk pesan grup yang diotorisasi
    - deteksi balasan implisit kepada bot (pengirim balasan cocok dengan identitas bot)

    Keamanan: kutipan/balasan hanya memenuhi gerbang penyebutan—hal tersebut **tidak** memberikan otorisasi pengirim. Dengan `groupPolicy: "allowlist"`, pengirim yang tidak ada dalam daftar izin tetap diblokir meskipun membalas pesan pengguna yang ada dalam daftar izin.

    Perintah aktivasi tingkat sesi: `/activation mention` atau `/activation always`. Perintah ini memperbarui status sesi (bukan konfigurasi global) dan dibatasi untuk pemilik.

  </Tab>
</Tabs>

## Binding ACP yang dikonfigurasi

WhatsApp mendukung binding ACP persisten melalui `bindings[]` tingkat atas:

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

Percakapan langsung dicocokkan dengan nomor E.164; grup dicocokkan dengan JID grup WhatsApp. Daftar izin grup, kebijakan pengirim, dan gerbang penyebutan/aktivasi dijalankan sebelum OpenClaw memastikan sesi ACP yang terikat tersedia. Binding yang cocok memiliki rute tersebut—grup siaran tidak menyebarkan giliran itu ke sesi WhatsApp biasa.

## Perilaku nomor pribadi dan percakapan dengan diri sendiri

Ketika nomor sendiri yang ditautkan juga terdapat dalam `allowFrom`, pengaman percakapan dengan diri sendiri diaktifkan: melewati tanda terima telah dibaca untuk giliran percakapan dengan diri sendiri, mengabaikan perilaku pemicu otomatis JID penyebutan yang akan memanggil diri Anda sendiri, dan secara default memberi awalan balasan `[{identity.name}]` (atau `[openclaw]`) ketika `messages.responsePrefix` tidak ditetapkan.

## Normalisasi pesan dan konteks

<AccordionGroup>
  <Accordion title="Envelope masuk dan konteks balasan">
    Pesan masuk dibungkus dalam envelope masuk bersama. Balasan yang dikutip menambahkan konteks dalam bentuk berikut:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Metadata balasan (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 pengirim) diisi jika tersedia. Jika target yang dikutip merupakan media yang dapat diunduh, OpenClaw menyimpannya melalui penyimpanan media masuk normal dan mengekspos `MediaPath`/`MediaType` agar agen dapat memeriksanya secara langsung, alih-alih hanya melihat `<media:image>`.

  </Accordion>

  <Accordion title="Placeholder media dan ekstraksi lokasi/kontak">
    Pesan yang hanya berisi media dinormalisasi menjadi placeholder: `<media:image>`, `<media:video>`, `<media:audio>`, `<media:document>`, `<media:sticker>`.

    Catatan suara grup yang diotorisasi ditranskripsikan sebelum gerbang penyebutan ketika isi pesan hanya berupa `<media:audio>`, sehingga mengucapkan penyebutan bot dalam catatan suara dapat memicu balasan. Jika transkrip tetap tidak menyebut bot, transkrip tersebut tetap berada dalam riwayat grup tertunda, bukan sebagai placeholder mentah.

    Isi lokasi dirender sebagai teks koordinat ringkas. Label/komentar lokasi dan detail kontak/vCard dirender sebagai metadata tidak tepercaya berpagar, bukan teks prompt sebaris.

  </Accordion>

  <Accordion title="Injeksi riwayat grup tertunda">
    Pesan grup yang belum diproses disangga dan diinjeksikan sebagai konteks saat bot akhirnya dipicu.

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

## Pengiriman, pemenggalan, dan media

<AccordionGroup>
  <Accordion title="Pemenggalan teks">
    - batas pemenggalan default: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`; `newline` mengutamakan batas paragraf (baris kosong), lalu menggunakan pemenggalan aman berdasarkan panjang sebagai fallback

  </Accordion>

  <Accordion title="Perilaku media keluar">
    - mendukung payload gambar, video, audio (catatan suara PTT), dan dokumen
    - audio dikirim sebagai payload `audio` Baileys dengan `ptt: true`, sehingga dirender sebagai catatan suara tekan-untuk-bicara; `audioAsVoice` dipertahankan pada payload balasan agar keluaran catatan suara TTS tetap menggunakan jalur ini terlepas dari format sumber penyedia
    - audio Ogg/Opus native dikirim sebagai `audio/ogg; codecs=opus`; format lain apa pun (termasuk keluaran MP3/WebM TTS Microsoft Edge) ditranskode dengan `ffmpeg` menjadi Ogg/Opus mono 48 kHz sebelum pengiriman PTT
    - `/tts latest` mengirim balasan asisten terbaru sebagai satu catatan suara dan mencegah pengiriman berulang untuk balasan yang sama; `/tts chat on|off|default` mengontrol TTS otomatis untuk percakapan saat ini
    - `gifPlayback: true` pada pengiriman video mengaktifkan pemutaran GIF animasi
    - `forceDocument`/`asDocument` merutekan gambar, GIF, dan video keluar melalui payload dokumen Baileys untuk menghindari kompresi media WhatsApp, dengan mempertahankan nama berkas dan tipe MIME yang telah diuraikan
    - keterangan diterapkan ke item media pertama dalam balasan multi-media, kecuali catatan suara PTT: audio dikirim terlebih dahulu tanpa keterangan, lalu keterangan dikirim sebagai pesan teks terpisah (klien WhatsApp tidak merender keterangan catatan suara secara konsisten)
    - sumber media dapat berupa HTTP(S), `file://`, atau jalur lokal

  </Accordion>

  <Accordion title="Batas ukuran media dan perilaku fallback">
    - batas penyimpanan masuk dan batas pengiriman keluar: `channels.whatsapp.mediaMaxMb` (default `50`)
    - penggantian per akun: `channels.whatsapp.accounts.<id>.mediaMaxMb`
    - gambar dioptimalkan secara otomatis (pengubahan ukuran/penyisiran kualitas) agar sesuai batas, kecuali `forceDocument`/`asDocument` meminta pengiriman sebagai dokumen
    - jika pengiriman media gagal, fallback item pertama mengirim peringatan teks alih-alih membuang respons secara diam-diam

  </Accordion>
</AccordionGroup>

## Pengutipan balasan

`channels.whatsapp.replyToMode` mengontrol pengutipan balasan native (balasan keluar secara jelas mengutip pesan masuk):

| Nilai             | Perilaku                                                       |
| ----------------- | -------------------------------------------------------------- |
| `"off"` (default) | Jangan pernah mengutip; kirim sebagai pesan biasa              |
| `"first"`         | Kutip hanya potongan balasan keluar pertama                    |
| `"all"`           | Kutip setiap potongan balasan keluar                           |
| `"batched"`       | Kutip balasan berkelompok dalam antrean; biarkan balasan langsung tidak dikutip |

Penggantian per akun: `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{ channels: { whatsapp: { replyToMode: "first" } } }
```

## Tingkat reaksi

`channels.whatsapp.reactionLevel` mengontrol seberapa luas agen menggunakan reaksi emoji:

| Tingkat               | Reaksi pengakuan | Reaksi yang dimulai agen |
| --------------------- | ---------------- | ------------------------ |
| `"off"`               | Tidak            | Tidak                    |
| `"ack"`               | Ya               | Tidak                    |
| `"minimal"` (default) | Ya               | Ya, panduan konservatif  |
| `"extensive"`         | Ya               | Ya, panduan dianjurkan   |

Penggantian per akun: `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{ channels: { whatsapp: { reactionLevel: "ack" } } }
```

## Reaksi pengakuan

`channels.whatsapp.ackReaction` mengirim reaksi langsung saat pesan masuk diterima, dengan gerbang `reactionLevel` (ditekan ketika `"off"`):

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

Catatan: dikirim segera setelah pesan masuk diterima (sebelum balasan); jika `ackReaction` tersedia tanpa `emoji`, WhatsApp menggunakan emoji identitas agen yang dirutekan dengan fallback ke "👀" (hilangkan `ackReaction` atau tetapkan `emoji: ""` agar tidak ada pengakuan); kegagalan dicatat dalam log tetapi tidak memblokir pengiriman balasan; mode grup `mentions` hanya bereaksi pada giliran yang dipicu penyebutan, sedangkan aktivasi grup `always` melewati pemeriksaan tersebut; WhatsApp hanya menggunakan `channels.whatsapp.ackReaction` (`messages.ackReaction` lama tidak berlaku di sini).

## Reaksi status siklus hidup

Tetapkan `messages.statusReactions.enabled: true` agar WhatsApp mengganti reaksi pengakuan selama suatu giliran, alih-alih membiarkan emoji tanda terima statis, dengan berputar melalui status seperti dalam antrean, berpikir, aktivitas alat, Compaction, selesai, dan kesalahan:

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

Catatan: `channels.whatsapp.ackReaction` tetap mengontrol kelayakan untuk pesan langsung dan grup; status dalam antrean menggunakan emoji efektif yang sama seperti reaksi pengakuan biasa; WhatsApp memiliki satu slot reaksi bot per pesan, sehingga pembaruan siklus hidup mengganti reaksi saat ini di tempat; `messages.removeAckAfterReply: true` menghapus reaksi status akhir setelah durasi penahanan selesai/kesalahan yang dikonfigurasi; kategori emoji alat mencakup `tool`, `coding`, `web`, `deploy`, `build`, dan `concierge`.

## Multi-akun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan nilai default">
    ID akun berasal dari `channels.whatsapp.accounts`. Pemilihan akun default adalah `default` jika tersedia; jika tidak, ID akun pertama yang dikonfigurasi (diurutkan secara alfabetis). ID akun dinormalisasi secara internal untuk pencarian.
  </Accordion>

  <Accordion title="Jalur kredensial dan kompatibilitas lama">
    - jalur autentikasi saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (cadangan: `creds.json.bak`)
    - autentikasi default lama di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default

  </Accordion>

  <Accordion title="Perilaku keluar">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status autentikasi WhatsApp untuk akun tersebut. Saat Gateway dapat dijangkau, proses keluar terlebih dahulu menghentikan listener aktif untuk akun tersebut, sehingga sesi yang tertaut berhenti menerima pesan sebelum mulai ulang berikutnya. `openclaw channels remove --channel whatsapp` juga menghentikan listener aktif sebelum menonaktifkan atau menghapus konfigurasi akun.

    Dalam direktori autentikasi lama, `oauth.json` dipertahankan sementara berkas autentikasi Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Alat, tindakan, dan penulisan konfigurasi

- Dukungan alat agen mencakup tindakan reaksi WhatsApp (`react`).
- Gerbang tindakan: `channels.whatsapp.actions.reactions`, `channels.whatsapp.actions.polls` (tindakan yang sudah ada secara default bernilai `true`), `channels.whatsapp.actions.calls` (default `false`, lihat MeowCaller di atas).
- Penulisan konfigurasi yang dimulai oleh kanal diaktifkan secara default; nonaktifkan melalui `channels.whatsapp.configWrites: false`.

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Belum tertaut (QR diperlukan)">
    Gejala: status kanal melaporkan bahwa kanal belum tertaut.

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  </Accordion>

  <Accordion title="Tertaut tetapi terputus / perulangan penyambungan ulang">
    Gejala: akun tertaut mengalami pemutusan atau upaya penyambungan ulang berulang kali.

    Akun yang sepi dapat tetap terhubung melewati batas waktu pesan normal; watchdog hanya memulai ulang saat aktivitas transportasi WhatsApp Web berhenti, soket ditutup, atau aktivitas tingkat aplikasi tetap senyap melampaui jendela keamanan yang lebih panjang (lihat Model runtime di atas).

    Jika log menampilkan `status=408 Request Time-out Connection was lost` secara berulang, sesuaikan waktu soket Baileys di bawah `web.whatsapp`. Mulailah dengan mempersingkat `keepAliveIntervalMs` agar berada di bawah batas waktu tidak aktif jaringan Anda dan meningkatkan `connectTimeoutMs` pada koneksi yang lambat atau sering kehilangan paket:

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

    Jika perulangan tetap berlangsung setelah konektivitas host dan pengaturan waktu diperbaiki, cadangkan direktori autentikasi akun dan tautkan ulang:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Jika `~/.openclaw/logs/whatsapp-health.log` menyatakan `Gateway inactive`, tetapi `openclaw gateway status` dan `openclaw channels status --probe` sama-sama menunjukkan kondisi sehat, jalankan `openclaw doctor`. Di Linux, doctor memperingatkan tentang entri crontab lama yang memanggil skrip `~/.openclaw/bin/ensure-whatsapp.sh` yang telah dihentikan; hapus entri tersebut dengan `crontab -e` — cron mungkin tidak memiliki lingkungan bus pengguna systemd dan menyebabkan skrip lama tersebut salah melaporkan kesehatan Gateway.

  </Accordion>

  <Accordion title="Login QR kehabisan waktu di balik proksi">
    Gejala: `openclaw channels login --channel whatsapp` gagal sebelum menampilkan QR yang dapat digunakan dengan `status=408 Request Time-out` atau pemutusan soket TLS.

    Login WhatsApp Web menggunakan lingkungan proksi standar host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varian huruf kecil, `NO_PROXY`). Pastikan proses Gateway mewarisi lingkungan proksi dan `NO_PROXY` tidak cocok dengan `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Tidak ada listener aktif saat mengirim">
    Pengiriman keluar langsung gagal saat tidak ada listener Gateway aktif untuk akun tujuan. Pastikan Gateway berjalan dan akun telah tertaut.
  </Accordion>

  <Accordion title="Balasan muncul dalam transkrip tetapi tidak di WhatsApp">
    Baris transkrip mencatat apa yang dihasilkan agen; pengiriman WhatsApp diperiksa secara terpisah. OpenClaw hanya menganggap balasan otomatis telah dikirim setelah Baileys mengembalikan ID pesan keluar untuk setidaknya satu pengiriman teks atau media yang terlihat.

    Reaksi tanda terima tidak bergantung pada tanda terima prabalasan — reaksi yang berhasil tidak membuktikan bahwa balasan teks/media berikutnya diterima. Periksa log Gateway untuk `auto-reply delivery failed` atau `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Pesan grup diabaikan secara tidak terduga">
    Periksa dengan urutan berikut: `groupPolicy`, `groupAllowFrom`/`allowFrom`, entri daftar yang diizinkan `groups`, gerbang penyebutan (`requireMention` + pola penyebutan), dan kunci duplikat di `openclaw.json` (entri JSON5 yang muncul belakangan menggantikan entri sebelumnya — pertahankan satu `groupPolicy` per cakupan).

    Jika `channels.whatsapp.groups` tersedia, WhatsApp masih dapat mengamati pesan dari grup lain, tetapi OpenClaw membuangnya sebelum perutean sesi. Tambahkan JID grup ke `channels.whatsapp.groups`, atau tambahkan `groups["*"]` untuk mengizinkan semua grup sambil tetap mempertahankan otorisasi pengirim melalui `groupPolicy`/`groupAllowFrom`.

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Runtime Gateway WhatsApp harus menggunakan Node. Bun ditandai tidak kompatibel untuk pengoperasian Gateway WhatsApp/Telegram yang stabil.
  </Accordion>
</AccordionGroup>

## Prompt sistem

WhatsApp mendukung prompt sistem bergaya Telegram untuk grup dan percakapan langsung melalui peta `groups` dan `direct`.

Resolusi untuk pesan grup: peta `groups` yang efektif ditentukan terlebih dahulu — jika akun mendefinisikan kunci `groups` sendiri dalam bentuk apa pun, kunci tersebut sepenuhnya menggantikan peta `groups` akar (tanpa penggabungan mendalam). Pencarian prompt kemudian dijalankan pada satu peta hasil tersebut:

1. **Prompt khusus grup** (`groups["<groupId>"].systemPrompt`): digunakan saat entri grup tersedia **dan** kunci `systemPrompt`-nya telah ditentukan. String kosong (`""`) menekan karakter pengganti dan tidak menerapkan prompt.
2. **Prompt karakter pengganti grup** (`groups["*"].systemPrompt`): digunakan saat entri grup tertentu tidak tersedia, atau tersedia tanpa kunci `systemPrompt`.

Resolusi untuk pesan langsung mengikuti pola yang sama terhadap peta `direct` dan `direct["*"]`.

<Note>
`dms` tetap menjadi wadah penggantian riwayat per pesan langsung yang ringan (`dms.<id>.historyLimit`). Penggantian prompt berada di bawah `direct`.
</Note>

<Note>
Perilaku akun-menggantikan-akar untuk resolusi prompt ini merupakan penggantian dangkal biasa: setiap kunci `groups`/`direct` akun, termasuk objek kosong eksplisit, menggantikan peta akar. Perilaku ini berbeda dari pemeriksaan daftar yang diizinkan untuk keanggotaan grup yang dijelaskan di atas, yang memiliki jaring pengaman akun tunggal untuk `groups: {}` yang kosong secara tidak sengaja.
</Note>

**Perbedaan dari Telegram:** Telegram menekan `groups` akar untuk setiap akun dalam penyiapan multiakun (bahkan akun yang tidak memiliki `groups` sendiri) guna mencegah bot menerima pesan grup dari grup yang bukan anggotanya. WhatsApp tidak menerapkan perlindungan tersebut — `groups`/`direct` akar diwarisi oleh setiap akun tanpa penggantian sendiri, berapa pun jumlah akunnya. Dalam penyiapan WhatsApp multiakun, tentukan peta lengkap secara eksplisit di bawah setiap akun jika Anda menginginkan prompt per akun.

Perilaku penting:

- `channels.whatsapp.groups` merupakan peta konfigurasi per grup sekaligus daftar grup yang diizinkan pada tingkat percakapan. Pada cakupan akar maupun akun, `groups["*"]` berarti "semua grup diizinkan" untuk cakupan tersebut.
- Hanya tambahkan `systemPrompt` karakter pengganti jika Anda memang ingin cakupan tersebut mengizinkan semua grup. Agar hanya sekumpulan ID grup tertentu yang memenuhi syarat, ulangi prompt pada setiap entri yang diizinkan secara eksplisit alih-alih menggunakan `groups["*"]`.
- Penerimaan grup dan otorisasi pengirim merupakan pemeriksaan terpisah. `groups["*"]` memperluas grup yang dapat mencapai penanganan grup; ini tidak mengotorisasi setiap pengirim dalam grup tersebut — hal itu tetap dikendalikan oleh `groupPolicy`/`groupAllowFrom`.
- `channels.whatsapp.direct` tidak memiliki efek samping serupa untuk pesan langsung: `direct["*"]` hanya menyediakan konfigurasi default setelah pesan langsung diizinkan oleh `dmPolicy` bersama `allowFrom` atau aturan penyimpanan pemasangan.

Contoh:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Gunakan hanya jika semua grup harus diizinkan pada cakupan akar.
        // Berlaku untuk semua akun yang tidak menentukan peta groups sendiri.
        "*": { systemPrompt: "Prompt default untuk semua grup." },
      },
      direct: {
        // Berlaku untuk semua akun yang tidak menentukan peta direct sendiri.
        "*": { systemPrompt: "Prompt default untuk semua percakapan langsung." },
      },
      accounts: {
        work: {
          groups: {
            // Akun ini menentukan groups sendiri, sehingga groups akar sepenuhnya
            // diganti. Untuk mempertahankan karakter pengganti, tentukan "*" secara eksplisit di sini juga.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Fokus pada manajemen proyek.",
            },
            // Gunakan hanya jika semua grup harus diizinkan dalam akun ini.
            "*": { systemPrompt: "Prompt default untuk grup kerja." },
          },
          direct: {
            // Akun ini menentukan peta direct sendiri, sehingga entri direct akar
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

## Penunjuk referensi konfigurasi

Referensi utama: [Referensi konfigurasi - WhatsApp](/id/gateway/config-channels#whatsapp)

| Area             | Bidang                                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| Akses            | `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`                                             |
| Pengiriman       | `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`                |
| Multiakun        | `accounts.<id>.enabled`, `accounts.<id>.authDir`, dan penggantian per akun lainnya                             |
| Operasi          | `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`       |
| Perilaku sesi    | `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`                                   |
| Prompt           | `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt` |

## Terkait

- [Pemasangan](/id/channels/pairing)
- [Grup](/id/channels/groups)
- [Keamanan](/id/gateway/security)
- [Perutean kanal](/id/channels/channel-routing)
- [Perutean multiagen](/id/concepts/multi-agent)
- [Pemecahan masalah](/id/channels/troubleshooting)
