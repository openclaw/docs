---
read_when:
    - Mengerjakan perilaku saluran WhatsApp/web atau perutean kotak masuk
summary: Dukungan saluran WhatsApp, kontrol akses, perilaku pengiriman, dan operasi
title: WhatsApp
x-i18n:
    generated_at: "2026-05-02T20:41:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb8afa93f0470e0454cf59e19193d8c2f204db63b428a4de579e93f01bf3ee62
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: siap produksi melalui WhatsApp Web (Baileys). Gateway memiliki sesi tertaut.

## Instal (sesuai kebutuhan)

- Onboarding (`openclaw onboard`) dan `openclaw channels add --channel whatsapp`
  meminta untuk menginstal Plugin WhatsApp saat pertama kali Anda memilihnya.
- `openclaw channels login --channel whatsapp` juga menawarkan alur instalasi ketika
  Plugin belum ada.
- Kanal dev + checkout git: default ke jalur Plugin lokal.
- Stabil/Beta: menggunakan paket npm `@openclaw/whatsapp` ketika paket terkini
  telah dipublikasikan.

Instalasi manual tetap tersedia:

```bash
openclaw plugins install @openclaw/whatsapp
```

Jika npm melaporkan paket milik OpenClaw sebagai usang atau tidak ada, gunakan
build OpenClaw terpaket saat ini atau checkout lokal hingga rangkaian paket npm
menyusul.

<CardGroup cols={3}>
  <Card title="Pemasangan" icon="link" href="/id/channels/pairing">
    Kebijakan DM default adalah pemasangan untuk pengirim yang tidak dikenal.
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

  <Step title="Setujui permintaan pemasangan pertama (jika menggunakan mode pemasangan)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Permintaan pemasangan kedaluwarsa setelah 1 jam. Permintaan tertunda dibatasi hingga 3 per kanal.

  </Step>
</Steps>

<Note>
OpenClaw merekomendasikan menjalankan WhatsApp pada nomor terpisah jika memungkinkan. (Metadata kanal dan alur penyiapan dioptimalkan untuk penyiapan tersebut, tetapi penyiapan dengan nomor pribadi juga didukung.)
</Note>

## Pola deployment

<AccordionGroup>
  <Accordion title="Nomor khusus (direkomendasikan)">
    Ini adalah mode operasional paling bersih:

    - identitas WhatsApp terpisah untuk OpenClaw
    - allowlist DM dan batas perutean yang lebih jelas
    - peluang kebingungan chat-dengan-diri-sendiri lebih rendah

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
    Onboarding mendukung mode nomor pribadi dan menulis baseline yang ramah chat-dengan-diri-sendiri:

    - `dmPolicy: "allowlist"`
    - `allowFrom` menyertakan nomor pribadi Anda
    - `selfChatMode: true`

    Saat runtime, perlindungan chat-dengan-diri-sendiri menggunakan nomor diri yang tertaut dan `allowFrom`.

  </Accordion>

  <Accordion title="Cakupan kanal hanya WhatsApp Web">
    Kanal platform perpesanan berbasis WhatsApp Web (`Baileys`) dalam arsitektur kanal OpenClaw saat ini.

    Tidak ada kanal perpesanan Twilio WhatsApp terpisah dalam registry kanal chat bawaan.

  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway memiliki socket WhatsApp dan loop penyambungan ulang.
- Watchdog penyambungan ulang menggunakan aktivitas transport WhatsApp Web, bukan hanya volume pesan aplikasi masuk, sehingga sesi perangkat tertaut yang senyap tidak dimulai ulang hanya karena tidak ada yang mengirim pesan baru-baru ini. Batas senyap-aplikasi yang lebih panjang tetap memaksa penyambungan ulang jika frame transport terus datang tetapi tidak ada pesan aplikasi yang ditangani selama jendela watchdog; setelah penyambungan ulang sementara untuk sesi yang baru-baru ini aktif, pemeriksaan senyap-aplikasi tersebut menggunakan timeout pesan normal untuk jendela pemulihan pertama.
- Timing socket Baileys bersifat eksplisit di bawah `web.whatsapp.*`: `keepAliveIntervalMs` mengontrol ping aplikasi WhatsApp Web, `connectTimeoutMs` mengontrol timeout handshake pembukaan, dan `defaultQueryTimeoutMs` mengontrol timeout kueri Baileys.
- Pengiriman keluar memerlukan listener WhatsApp aktif untuk akun target.
- Chat status dan siaran diabaikan (`@status`, `@broadcast`).
- Watchdog penyambungan ulang mengikuti aktivitas transport WhatsApp Web, bukan hanya volume pesan aplikasi masuk: sesi perangkat tertaut yang senyap tetap berjalan selama frame transport berlanjut, tetapi macet transport memaksa penyambungan ulang jauh sebelum jalur pemutusan jarak jauh yang lebih belakangan.
- Chat langsung menggunakan aturan sesi DM (`session.dmScope`; default `main` menggabungkan DM ke sesi utama agen).
- Sesi grup diisolasi (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters dapat menjadi target keluar eksplisit dengan JID native `@newsletter`-nya. Pengiriman newsletter keluar menggunakan metadata sesi kanal (`agent:<agentId>:whatsapp:channel:<jid>`) alih-alih semantik sesi DM.
- Transport WhatsApp Web menghormati variabel lingkungan proxy standar pada host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varian huruf kecil). Utamakan konfigurasi proxy tingkat host daripada pengaturan proxy WhatsApp spesifik kanal.
- Ketika `messages.removeAckAfterReply` diaktifkan, OpenClaw menghapus reaksi ack WhatsApp setelah balasan yang terlihat terkirim.

## Hook Plugin dan privasi

Pesan masuk WhatsApp dapat berisi konten pesan pribadi, nomor telepon,
pengidentifikasi grup, nama pengirim, dan kolom korelasi sesi. Karena itu,
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

Aktifkan ini hanya untuk Plugin yang Anda percaya untuk menerima konten pesan
WhatsApp masuk dan pengidentifikasi.

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.whatsapp.dmPolicy` mengontrol akses chat langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `allowFrom` menerima nomor bergaya E.164 (dinormalisasi secara internal).

    `allowFrom` adalah daftar kontrol akses pengirim DM. Ini tidak membatasi pengiriman keluar eksplisit ke JID grup WhatsApp atau JID kanal `@newsletter`.

    Override multi-akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `allowFrom`) didahulukan atas default tingkat kanal untuk akun tersebut.

    Detail perilaku runtime:

    - pemasangan dipertahankan di allow-store kanal dan digabungkan dengan `allowFrom` yang dikonfigurasi
    - otomasi terjadwal dan fallback penerima Heartbeat menggunakan target pengiriman eksplisit atau `allowFrom` yang dikonfigurasi; persetujuan pemasangan DM bukan penerima Cron atau Heartbeat implisit
    - jika tidak ada allowlist yang dikonfigurasi, nomor diri yang tertaut diizinkan secara default
    - OpenClaw tidak pernah memasangkan otomatis DM keluar `fromMe` (pesan yang Anda kirim kepada diri sendiri dari perangkat tertaut)

  </Tab>

  <Tab title="Kebijakan grup + allowlist">
    Akses grup memiliki dua lapisan:

    1. **Allowlist keanggotaan grup** (`channels.whatsapp.groups`)
       - jika `groups` dihilangkan, semua grup memenuhi syarat
       - jika `groups` ada, ini bertindak sebagai allowlist grup (`"*"` diizinkan)

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

    - mention WhatsApp eksplisit dari identitas bot
    - pola regex mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transkrip voice-note masuk untuk pesan grup yang diotorisasi
    - deteksi reply-to-bot implisit (pengirim balasan cocok dengan identitas bot)

    Catatan keamanan:

    - kutipan/balasan hanya memenuhi gating mention; itu **tidak** memberikan otorisasi pengirim
    - dengan `groupPolicy: "allowlist"`, pengirim yang tidak ada di allowlist tetap diblokir meskipun mereka membalas pesan pengguna yang ada di allowlist

    Perintah aktivasi tingkat sesi:

    - `/activation mention`
    - `/activation always`

    `activation` memperbarui status sesi (bukan konfigurasi global). Ini digating oleh pemilik.

  </Tab>
</Tabs>

## Perilaku nomor pribadi dan chat-dengan-diri-sendiri

Ketika nomor diri yang tertaut juga ada di `allowFrom`, safeguard chat-dengan-diri-sendiri WhatsApp aktif:

- lewati tanda terima baca untuk giliran chat-dengan-diri-sendiri
- abaikan perilaku pemicu otomatis mention-JID yang jika tidak demikian akan melakukan ping ke diri Anda sendiri
- jika `messages.responsePrefix` tidak disetel, balasan chat-dengan-diri-sendiri default ke `[{identity.name}]` atau `[openclaw]`

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

    Voice note grup yang diotorisasi ditranskrip sebelum gating mention ketika
    body hanya `<media:audio>`, sehingga menyebut mention bot dalam voice note dapat
    memicu balasan. Jika transkrip masih tidak menyebut bot, transkrip
    disimpan dalam riwayat grup tertunda alih-alih placeholder mentah.

    Body lokasi menggunakan teks koordinat ringkas. Label/komentar lokasi dan detail kontak/vCard dirender sebagai metadata tidak tepercaya berpagar, bukan teks prompt inline.

  </Accordion>

  <Accordion title="Injeksi riwayat grup tertunda">
    Untuk grup, pesan yang belum diproses dapat dibuffer dan disuntikkan sebagai konteks ketika bot akhirnya dipicu.

    - batas default: `50`
    - konfigurasi: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Marker injeksi:

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

    Giliran obrolan dengan diri sendiri melewati tanda terima baca meskipun diaktifkan secara global.

  </Accordion>
</AccordionGroup>

## Pengiriman, pemotongan, dan media

<AccordionGroup>
  <Accordion title="Pemotongan teks">
    - batas potongan default: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - mode `newline` mengutamakan batas paragraf (baris kosong), lalu kembali ke pemotongan aman berdasarkan panjang

  </Accordion>

  <Accordion title="Perilaku media keluar">
    - mendukung payload gambar, video, audio (catatan suara PTT), dan dokumen
    - media audio dikirim melalui payload Baileys `audio` dengan `ptt: true`, sehingga klien WhatsApp merendernya sebagai catatan suara push-to-talk
    - payload balasan mempertahankan `audioAsVoice`; keluaran catatan suara TTS untuk WhatsApp tetap memakai jalur PTT ini meskipun penyedia mengembalikan MP3 atau WebM
    - audio Ogg/Opus native dikirim sebagai `audio/ogg; codecs=opus` untuk kompatibilitas catatan suara
    - audio non-Ogg, termasuk keluaran MP3/WebM Microsoft Edge TTS, ditranskode dengan `ffmpeg` menjadi Ogg/Opus mono 48 kHz sebelum pengiriman PTT
    - `/tts latest` mengirim balasan asisten terbaru sebagai satu catatan suara dan menekan pengiriman ulang untuk balasan yang sama; `/tts chat on|off|default` mengontrol TTS otomatis untuk obrolan WhatsApp saat ini
    - pemutaran GIF animasi didukung melalui `gifPlayback: true` pada pengiriman video
    - keterangan diterapkan ke item media pertama saat mengirim payload balasan multi-media, kecuali catatan suara PTT mengirim audio terlebih dahulu dan teks terlihat secara terpisah karena klien WhatsApp tidak merender keterangan catatan suara secara konsisten
    - sumber media dapat berupa HTTP(S), `file://`, atau jalur lokal

  </Accordion>

  <Accordion title="Batas ukuran media dan perilaku fallback">
    - batas simpan media masuk: `channels.whatsapp.mediaMaxMb` (default `50`)
    - batas kirim media keluar: `channels.whatsapp.mediaMaxMb` (default `50`)
    - override per akun menggunakan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - gambar dioptimalkan otomatis (sweep ubah ukuran/kualitas) agar sesuai batas
    - saat pengiriman media gagal, fallback item pertama mengirim peringatan teks alih-alih membuang respons secara diam-diam

  </Accordion>
</AccordionGroup>

## Kutipan balasan

WhatsApp mendukung kutipan balasan native, yaitu balasan keluar yang menampilkan kutipan pesan masuk. Kontrol dengan `channels.whatsapp.replyToMode`.

| Nilai       | Perilaku                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Jangan pernah mengutip; kirim sebagai pesan biasa                     |
| `"first"`   | Kutip hanya potongan balasan keluar pertama                           |
| `"all"`     | Kutip setiap potongan balasan keluar                                  |
| `"batched"` | Kutip balasan berkelompok yang diantrekan sambil membiarkan balasan langsung tanpa kutipan |

Default-nya adalah `"off"`. Override per akun menggunakan `channels.whatsapp.accounts.<id>.replyToMode`.

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

## Reaksi acknowledgment

WhatsApp mendukung reaksi ack langsung pada tanda terima masuk melalui `channels.whatsapp.ackReaction`.
Reaksi ack dibatasi oleh `reactionLevel` — reaksi ditekan saat `reactionLevel` adalah `"off"`.

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

- dikirim segera setelah pesan masuk diterima (pra-balasan)
- kegagalan dicatat di log tetapi tidak memblokir pengiriman balasan normal
- mode grup `mentions` bereaksi pada giliran yang dipicu penyebutan; aktivasi grup `always` bertindak sebagai bypass untuk pemeriksaan ini
- WhatsApp menggunakan `channels.whatsapp.ackReaction` (`messages.ackReaction` lama tidak digunakan di sini)

## Multi-akun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan default">
    - id akun berasal dari `channels.whatsapp.accounts`
    - pemilihan akun default: `default` jika ada, jika tidak id akun terkonfigurasi pertama (diurutkan)
    - id akun dinormalisasi secara internal untuk pencarian

  </Accordion>

  <Accordion title="Jalur kredensial dan kompatibilitas lama">
    - jalur auth saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file cadangan: `creds.json.bak`
    - auth default lama di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default

  </Accordion>

  <Accordion title="Perilaku logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status auth WhatsApp untuk akun tersebut.

    Saat Gateway dapat dijangkau, logout terlebih dahulu menghentikan listener WhatsApp aktif untuk akun yang dipilih agar sesi tertaut tidak terus menerima pesan hingga restart berikutnya. `openclaw channels remove --channel whatsapp` juga menghentikan listener aktif sebelum menonaktifkan atau menghapus konfigurasi akun.

    Di direktori auth lama, `oauth.json` dipertahankan sementara file auth Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Alat, tindakan, dan penulisan konfigurasi

- Dukungan alat agen mencakup tindakan reaksi WhatsApp (`react`).
- Gerbang tindakan:
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

    Akun yang sepi dapat tetap tersambung melewati batas waktu pesan normal; watchdog
    memulai ulang saat aktivitas transport WhatsApp Web berhenti, soket ditutup, atau
    aktivitas tingkat aplikasi tetap senyap melampaui jendela keamanan yang lebih panjang.

    Jika log menampilkan `status=408 Request Time-out Connection was lost` berulang, sesuaikan
    pengaturan waktu soket Baileys di bawah `web.whatsapp`. Mulailah dengan memperpendek
    `keepAliveIntervalMs` di bawah batas waktu idle jaringan Anda dan meningkatkan
    `connectTimeoutMs` pada tautan yang lambat atau sering kehilangan paket:

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

    Jika `~/.openclaw/logs/whatsapp-health.log` menyatakan `Gateway inactive` tetapi
    `openclaw gateway status` dan `openclaw channels status --probe` menunjukkan
    Gateway dan WhatsApp sehat, jalankan `openclaw doctor`. Di Linux, doctor
    memperingatkan tentang entri crontab lama yang masih memanggil
    `~/.openclaw/bin/ensure-whatsapp.sh`; hapus entri usang tersebut dengan
    `crontab -e` karena cron dapat tidak memiliki lingkungan bus pengguna systemd dan
    membuat skrip lama itu salah melaporkan kesehatan Gateway.

    Jika diperlukan, tautkan ulang dengan `channels login`.

  </Accordion>

  <Accordion title="Login QR habis waktu di belakang proxy">
    Gejala: `openclaw channels login --channel whatsapp` gagal sebelum menampilkan kode QR yang dapat digunakan dengan `status=408 Request Time-out` atau pemutusan soket TLS.

    Login WhatsApp Web menggunakan lingkungan proxy standar host Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varian huruf kecil, dan `NO_PROXY`). Pastikan proses Gateway mewarisi env proxy dan `NO_PROXY` tidak cocok dengan `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Tidak ada listener aktif saat mengirim">
    Pengiriman keluar gagal cepat saat tidak ada listener Gateway aktif untuk akun target.

    Pastikan Gateway berjalan dan akun tertaut.

  </Accordion>

  <Accordion title="Balasan muncul di transkrip tetapi tidak di WhatsApp">
    Baris transkrip mencatat apa yang dihasilkan agen. Pengiriman WhatsApp diperiksa secara terpisah: OpenClaw hanya memperlakukan balasan otomatis sebagai terkirim setelah Baileys mengembalikan id pesan keluar untuk setidaknya satu pengiriman teks terlihat atau media.

    Reaksi ack adalah tanda terima pra-balasan yang independen. Reaksi yang berhasil tidak membuktikan bahwa balasan teks atau media berikutnya diterima oleh WhatsApp.

    Periksa log Gateway untuk `auto-reply delivery failed` atau `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Pesan grup diabaikan secara tak terduga">
    Periksa dalam urutan ini:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entri allowlist `groups`
    - gating penyebutan (`requireMention` + pola penyebutan)
    - kunci duplikat di `openclaw.json` (JSON5): entri yang lebih baru menimpa entri sebelumnya, jadi pertahankan satu `groupPolicy` per cakupan

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Runtime Gateway WhatsApp sebaiknya menggunakan Node. Bun ditandai tidak kompatibel untuk operasi Gateway WhatsApp/Telegram yang stabil.
  </Accordion>
</AccordionGroup>

## Prompt sistem

WhatsApp mendukung prompt sistem bergaya Telegram untuk grup dan obrolan langsung melalui map `groups` dan `direct`.

Hierarki resolusi untuk pesan grup:

Map `groups` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `groups` miliknya sendiri, itu sepenuhnya menggantikan map `groups` root (tanpa penggabungan mendalam). Pencarian prompt kemudian berjalan pada satu map hasilnya:

1. **Prompt sistem khusus grup** (`groups["<groupId>"].systemPrompt`): digunakan saat entri grup tertentu ada di map **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan.
2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan saat entri grup tertentu sepenuhnya tidak ada dari map, atau saat entri itu ada tetapi tidak mendefinisikan kunci `systemPrompt`.

Hierarki resolusi untuk pesan langsung:

Map `direct` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `direct` miliknya sendiri, itu sepenuhnya menggantikan map `direct` root (tanpa penggabungan mendalam). Pencarian prompt kemudian berjalan pada satu map hasilnya:

1. **Prompt sistem khusus langsung** (`direct["<peerId>"].systemPrompt`): digunakan saat entri peer tertentu ada di map **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan.
2. **Prompt sistem wildcard langsung** (`direct["*"].systemPrompt`): digunakan saat entri peer tertentu sepenuhnya tidak ada dari map, atau saat entri itu ada tetapi tidak mendefinisikan kunci `systemPrompt`.

<Note>
`dms` tetap menjadi bucket override riwayat ringan per-DM (`dms.<id>.historyLimit`). Override prompt berada di bawah `direct`.
</Note>

**Perbedaan dari perilaku multi-akun Telegram:** Di Telegram, `groups` tingkat root sengaja ditekan untuk semua akun dalam penyiapan multi-akun — bahkan akun yang tidak mendefinisikan `groups` miliknya sendiri — untuk mencegah bot menerima pesan grup dari grup yang bukan tempatnya bergabung. WhatsApp tidak menerapkan pelindung ini: `groups` root dan `direct` root selalu diwarisi oleh akun yang tidak mendefinisikan override tingkat akun, berapa pun jumlah akun yang dikonfigurasi. Dalam penyiapan WhatsApp multi-akun, jika Anda menginginkan prompt grup atau langsung per akun, definisikan seluruh map di bawah setiap akun secara eksplisit alih-alih mengandalkan default tingkat root.

Perilaku penting:

- `channels.whatsapp.groups` adalah map konfigurasi per grup sekaligus allowlist grup tingkat chat. Pada cakupan root atau akun, `groups["*"]` berarti "semua grup diterima" untuk cakupan tersebut.
- Hanya tambahkan `systemPrompt` grup wildcard saat Anda memang ingin cakupan tersebut menerima semua grup. Jika Anda masih ingin hanya sekumpulan tetap ID grup yang memenuhi syarat, jangan gunakan `groups["*"]` untuk default prompt. Sebaliknya, ulangi prompt pada setiap entri grup yang secara eksplisit masuk allowlist.
- Penerimaan grup dan otorisasi pengirim adalah pemeriksaan terpisah. `groups["*"]` memperluas kumpulan grup yang dapat mencapai penanganan grup, tetapi itu sendiri tidak mengotorisasi setiap pengirim dalam grup tersebut. Akses pengirim tetap dikendalikan secara terpisah oleh `channels.whatsapp.groupPolicy` dan `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` tidak memiliki efek samping yang sama untuk DM. `direct["*"]` hanya menyediakan konfigurasi direct-chat default setelah sebuah DM sudah diterima oleh `dmPolicy` ditambah `allowFrom` atau aturan pairing-store.

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

Field WhatsApp bersinyal tinggi:

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
