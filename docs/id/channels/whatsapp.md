---
read_when:
    - Mengerjakan perilaku saluran WhatsApp/web atau perutean kotak masuk
summary: Dukungan kanal WhatsApp, kontrol akses, perilaku pengiriman, dan operasi
title: WhatsApp
x-i18n:
    generated_at: "2026-05-03T09:15:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f12709fc8ecb45e1b060647daf9a4624485d52b7b6436c3d07f171e6807babf
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
- Stable/Beta: menggunakan paket npm `@openclaw/whatsapp` pada tag rilis resmi
  saat ini.

Instal manual tetap tersedia:

```bash
openclaw plugins install @openclaw/whatsapp
```

Gunakan paket bare untuk mengikuti tag rilis resmi saat ini. Sematkan versi persis
hanya ketika Anda membutuhkan instalasi yang dapat direproduksi.

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
OpenClaw menyarankan menjalankan WhatsApp pada nomor terpisah jika memungkinkan. (Metadata kanal dan alur penyiapan dioptimalkan untuk penyiapan tersebut, tetapi penyiapan nomor pribadi juga didukung.)
</Note>

## Pola deployment

<AccordionGroup>
  <Accordion title="Nomor khusus (disarankan)">
    Ini adalah mode operasional paling bersih:

    - identitas WhatsApp terpisah untuk OpenClaw
    - allowlist DM dan batas routing yang lebih jelas
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

    Saat runtime, perlindungan chat-dengan-diri-sendiri menggunakan nomor diri tertaut dan `allowFrom` sebagai kunci.

  </Accordion>

  <Accordion title="Cakupan kanal hanya WhatsApp Web">
    Kanal platform perpesanan berbasis WhatsApp Web (`Baileys`) dalam arsitektur kanal OpenClaw saat ini.

    Tidak ada kanal perpesanan Twilio WhatsApp terpisah dalam registry kanal chat bawaan.

  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway memiliki socket WhatsApp dan loop rekoneksi.
- Watchdog rekoneksi menggunakan aktivitas transport WhatsApp Web, bukan hanya volume pesan aplikasi masuk, sehingga sesi perangkat tertaut yang senyap tidak dimulai ulang semata-mata karena belum ada yang mengirim pesan baru-baru ini. Batas senyap aplikasi yang lebih panjang tetap memaksa rekoneksi jika frame transport terus tiba tetapi tidak ada pesan aplikasi yang ditangani selama jendela watchdog; setelah rekoneksi sementara untuk sesi yang baru-baru ini aktif, pemeriksaan senyap aplikasi tersebut menggunakan timeout pesan normal untuk jendela pemulihan pertama.
- Timing socket Baileys eksplisit di bawah `web.whatsapp.*`: `keepAliveIntervalMs` mengontrol ping aplikasi WhatsApp Web, `connectTimeoutMs` mengontrol timeout handshake pembukaan, dan `defaultQueryTimeoutMs` mengontrol timeout kueri Baileys.
- Pengiriman keluar memerlukan listener WhatsApp aktif untuk akun target.
- Pengiriman grup melampirkan metadata mention native untuk token `@+<digits>` dan `@<digits>` dalam teks dan caption media ketika token cocok dengan metadata peserta WhatsApp saat ini, termasuk grup berbasis LID.
- Chat status dan broadcast diabaikan (`@status`, `@broadcast`).
- Watchdog rekoneksi mengikuti aktivitas transport WhatsApp Web, bukan hanya volume pesan aplikasi masuk: sesi perangkat tertaut yang senyap tetap aktif selama frame transport berlanjut, tetapi stall transport memaksa rekoneksi jauh sebelum jalur pemutusan remote yang lebih lambat.
- Chat langsung menggunakan aturan sesi DM (`session.dmScope`; default `main` menggabungkan DM ke sesi utama agen).
- Sesi grup diisolasi (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletter dapat menjadi target keluar eksplisit dengan JID native `@newsletter`. Pengiriman newsletter keluar menggunakan metadata sesi kanal (`agent:<agentId>:whatsapp:channel:<jid>`) alih-alih semantik sesi DM.
- Transport WhatsApp Web menghormati variabel lingkungan proxy standar pada host gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / varian huruf kecil). Utamakan konfigurasi proxy tingkat host daripada pengaturan proxy WhatsApp khusus kanal.
- Ketika `messages.removeAckAfterReply` diaktifkan, OpenClaw menghapus reaksi ack WhatsApp setelah balasan yang terlihat terkirim.

## Hook Plugin dan privasi

Pesan masuk WhatsApp dapat berisi konten pesan pribadi, nomor telepon,
pengidentifikasi grup, nama pengirim, dan bidang korelasi sesi. Karena itu,
WhatsApp tidak menyiarkan payload hook `message_received` masuk ke Plugin
kecuali Anda memilih ikut serta secara eksplisit:

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

Aktifkan ini hanya untuk Plugin yang Anda percayai untuk menerima konten dan
pengidentifikasi pesan masuk WhatsApp.

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.whatsapp.dmPolicy` mengontrol akses chat langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (mengharuskan `allowFrom` menyertakan `"*"`)
    - `disabled`

    `allowFrom` menerima nomor bergaya E.164 (dinormalisasi secara internal).

    `allowFrom` adalah daftar kontrol akses pengirim DM. Ini tidak membatasi pengiriman keluar eksplisit ke JID grup WhatsApp atau JID kanal `@newsletter`.

    Override multi-akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `allowFrom`) lebih diutamakan daripada default tingkat kanal untuk akun tersebut.

    Detail perilaku runtime:

    - pemasangan disimpan dalam allow-store kanal dan digabungkan dengan `allowFrom` yang dikonfigurasi
    - automasi terjadwal dan fallback penerima Heartbeat menggunakan target pengiriman eksplisit atau `allowFrom` yang dikonfigurasi; persetujuan pemasangan DM bukan penerima Cron atau Heartbeat implisit
    - jika tidak ada allowlist yang dikonfigurasi, nomor diri tertaut diizinkan secara default
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
       - `disabled`: blokir semua pesan masuk grup

    Fallback allowlist pengirim:

    - jika `groupAllowFrom` tidak disetel, runtime fallback ke `allowFrom` ketika tersedia
    - allowlist pengirim dievaluasi sebelum aktivasi mention/reply

    Catatan: jika blok `channels.whatsapp` tidak ada sama sekali, fallback kebijakan grup runtime adalah `allowlist` (dengan log peringatan), bahkan jika `channels.defaults.groupPolicy` disetel.

  </Tab>

  <Tab title="Mention + /activation">
    Balasan grup memerlukan mention secara default.

    Deteksi mention mencakup:

    - mention WhatsApp eksplisit terhadap identitas bot
    - pola regex mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - transkrip voice-note masuk untuk pesan grup terotorisasi
    - deteksi reply-to-bot implisit (pengirim balasan cocok dengan identitas bot)

    Catatan keamanan:

    - kutipan/balasan hanya memenuhi gating mention; itu **tidak** memberikan otorisasi pengirim
    - dengan `groupPolicy: "allowlist"`, pengirim yang tidak ada dalam allowlist tetap diblokir meskipun mereka membalas pesan pengguna yang ada dalam allowlist

    Perintah aktivasi tingkat sesi:

    - `/activation mention`
    - `/activation always`

    `activation` memperbarui status sesi (bukan konfigurasi global). Ini dibatasi untuk pemilik.

  </Tab>
</Tabs>

## Perilaku nomor pribadi dan chat-dengan-diri-sendiri

Ketika nomor diri tertaut juga ada di `allowFrom`, perlindungan chat-dengan-diri-sendiri WhatsApp aktif:

- lewati tanda terima dibaca untuk giliran chat-dengan-diri-sendiri
- abaikan perilaku auto-trigger mention-JID yang sebaliknya akan ping diri Anda sendiri
- jika `messages.responsePrefix` tidak disetel, balasan chat-dengan-diri-sendiri default ke `[{identity.name}]` atau `[openclaw]`

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

    Bidang metadata balasan juga diisi ketika tersedia (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 pengirim).
    Ketika target balasan yang dikutip adalah media yang dapat diunduh, OpenClaw menyimpannya melalui
    penyimpanan media masuk normal dan mengeksposnya sebagai `MediaPath`/`MediaType` sehingga
    agen dapat memeriksa gambar yang direferensikan alih-alih hanya melihat
    `<media:image>`.

  </Accordion>

  <Accordion title="Placeholder media dan ekstraksi lokasi/kontak">
    Pesan masuk yang hanya berisi media dinormalisasi dengan placeholder seperti:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Voice note grup terotorisasi ditranskrip sebelum gating mention ketika
    isi hanya `<media:audio>`, sehingga mengucapkan mention bot dalam voice note dapat
    memicu balasan. Jika transkrip masih tidak menyebut bot,
    transkrip disimpan dalam riwayat grup tertunda alih-alih placeholder mentah.

    Isi lokasi menggunakan teks koordinat ringkas. Label/komentar lokasi dan detail kontak/vCard dirender sebagai metadata tidak tepercaya berpagar, bukan teks prompt inline.

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

  <Accordion title="Tanda terima dibaca">
    Tanda terima dibaca diaktifkan secara default untuk pesan WhatsApp masuk yang diterima.

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
    - mode `newline` memprioritaskan batas paragraf (baris kosong), lalu fallback ke pemotongan yang aman berdasarkan panjang

  </Accordion>

  <Accordion title="Perilaku media keluar">
    - mendukung payload gambar, video, audio (catatan suara PTT), dan dokumen
    - media audio dikirim melalui payload `audio` Baileys dengan `ptt: true`, sehingga klien WhatsApp merendernya sebagai catatan suara push-to-talk
    - payload balasan mempertahankan `audioAsVoice`; output catatan suara TTS untuk WhatsApp tetap berada di jalur PTT ini meskipun penyedia mengembalikan MP3 atau WebM
    - audio Ogg/Opus native dikirim sebagai `audio/ogg; codecs=opus` untuk kompatibilitas catatan suara
    - audio non-Ogg, termasuk output Microsoft Edge TTS MP3/WebM, ditranskode dengan `ffmpeg` ke Ogg/Opus mono 48 kHz sebelum pengiriman PTT
    - `/tts latest` mengirim balasan asisten terbaru sebagai satu catatan suara dan menekan pengiriman ulang untuk balasan yang sama; `/tts chat on|off|default` mengontrol TTS otomatis untuk obrolan WhatsApp saat ini
    - pemutaran GIF animasi didukung melalui `gifPlayback: true` pada pengiriman video
    - teks keterangan diterapkan ke item media pertama saat mengirim payload balasan multi-media, kecuali catatan suara PTT mengirim audio terlebih dahulu dan teks terlihat secara terpisah karena klien WhatsApp tidak merender teks keterangan catatan suara secara konsisten
    - sumber media dapat berupa HTTP(S), `file://`, atau jalur lokal

  </Accordion>

  <Accordion title="Batas ukuran media dan perilaku fallback">
    - batas penyimpanan media masuk: `channels.whatsapp.mediaMaxMb` (default `50`)
    - batas pengiriman media keluar: `channels.whatsapp.mediaMaxMb` (default `50`)
    - override per akun menggunakan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - gambar dioptimalkan otomatis (ubah ukuran/penyisiran kualitas) agar sesuai batas
    - saat pengiriman media gagal, fallback item pertama mengirim peringatan teks alih-alih membuang respons secara diam-diam

  </Accordion>
</AccordionGroup>

## Kutipan balasan

WhatsApp mendukung kutipan balasan native, di mana balasan keluar mengutip pesan masuk secara terlihat. Kontrol dengan `channels.whatsapp.replyToMode`.

| Nilai       | Perilaku                                                              |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Jangan pernah mengutip; kirim sebagai pesan biasa                     |
| `"first"`   | Kutip hanya potongan balasan keluar pertama                           |
| `"all"`     | Kutip setiap potongan balasan keluar                                  |
| `"batched"` | Kutip balasan antrean batch sambil membiarkan balasan langsung tanpa kutipan |

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

| Tingkat       | Reaksi ack | Reaksi yang dimulai agen | Deskripsi                                      |
| ------------- | ---------- | ------------------------ | ---------------------------------------------- |
| `"off"`       | Tidak      | Tidak                    | Tidak ada reaksi sama sekali                   |
| `"ack"`       | Ya         | Tidak                    | Hanya reaksi ack (tanda terima pra-balasan)    |
| `"minimal"`   | Ya         | Ya (konservatif)         | Ack + reaksi agen dengan panduan konservatif   |
| `"extensive"` | Ya         | Ya (dianjurkan)          | Ack + reaksi agen dengan panduan dianjurkan    |

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
Reaksi ack dikontrol oleh `reactionLevel` — reaksi tersebut ditekan saat `reactionLevel` adalah `"off"`.

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
- kegagalan dicatat tetapi tidak memblokir pengiriman balasan normal
- mode grup `mentions` bereaksi pada giliran yang dipicu penyebutan; aktivasi grup `always` bertindak sebagai bypass untuk pemeriksaan ini
- WhatsApp menggunakan `channels.whatsapp.ackReaction` (`messages.ackReaction` legacy tidak digunakan di sini)

## Multi-akun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan default">
    - id akun berasal dari `channels.whatsapp.accounts`
    - pemilihan akun default: `default` jika ada, jika tidak id akun terkonfigurasi pertama (diurutkan)
    - id akun dinormalisasi secara internal untuk pencarian

  </Accordion>

  <Accordion title="Jalur kredensial dan kompatibilitas legacy">
    - jalur autentikasi saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file cadangan: `creds.json.bak`
    - autentikasi default legacy di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default

  </Accordion>

  <Accordion title="Perilaku logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status autentikasi WhatsApp untuk akun tersebut.

    Saat Gateway dapat dijangkau, logout terlebih dahulu menghentikan listener WhatsApp langsung untuk akun yang dipilih agar sesi tertaut tidak terus menerima pesan sampai restart berikutnya. `openclaw channels remove --channel whatsapp` juga menghentikan listener langsung sebelum menonaktifkan atau menghapus konfigurasi akun.

    Di direktori autentikasi legacy, `oauth.json` dipertahankan sementara file autentikasi Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Alat, tindakan, dan penulisan konfigurasi

- Dukungan alat agen mencakup tindakan reaksi WhatsApp (`react`).
- Gerbang tindakan:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Penulisan konfigurasi yang diinisiasi saluran diaktifkan secara default (nonaktifkan melalui `channels.whatsapp.configWrites=false`).

## Pemecahan Masalah

<AccordionGroup>
  <Accordion title="Tidak tertaut (QR diperlukan)">
    Gejala: status saluran melaporkan tidak tertaut.

    Perbaikan:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Tertaut tetapi terputus / loop sambung ulang">
    Gejala: akun tertaut dengan pemutusan berulang atau upaya sambung ulang.

    Akun yang senyap dapat tetap terhubung melewati batas waktu pesan normal; watchdog
    memulai ulang saat aktivitas transport WhatsApp Web berhenti, soket ditutup, atau
    aktivitas tingkat aplikasi tetap senyap melampaui jendela keamanan yang lebih panjang.

    Jika log menampilkan `status=408 Request Time-out Connection was lost` berulang, sesuaikan
    waktu soket Baileys di bawah `web.whatsapp`. Mulailah dengan mempersingkat
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
    openclaw doctor
    openclaw logs --follow
    ```

    Jika `~/.openclaw/logs/whatsapp-health.log` mengatakan `Gateway inactive` tetapi
    `openclaw gateway status` dan `openclaw channels status --probe` menunjukkan
    gateway dan WhatsApp sehat, jalankan `openclaw doctor`. Di Linux, doctor
    memperingatkan tentang entri crontab lama yang masih memanggil
    `~/.openclaw/bin/ensure-whatsapp.sh`; hapus entri usang tersebut dengan
    `crontab -e` karena cron dapat tidak memiliki lingkungan systemd user-bus dan
    membuat skrip lama itu salah melaporkan kesehatan gateway.

    Jika diperlukan, tautkan ulang dengan `channels login`.

  </Accordion>

  <Accordion title="Login QR habis waktu di balik proxy">
    Gejala: `openclaw channels login --channel whatsapp` gagal sebelum menampilkan kode QR yang dapat digunakan dengan `status=408 Request Time-out` atau pemutusan soket TLS.

    Login WhatsApp Web menggunakan lingkungan proxy standar host gateway (`HTTPS_PROXY`, `HTTP_PROXY`, varian huruf kecil, dan `NO_PROXY`). Pastikan proses gateway mewarisi env proxy dan bahwa `NO_PROXY` tidak cocok dengan `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Tidak ada listener aktif saat mengirim">
    Pengiriman keluar gagal cepat saat tidak ada listener gateway aktif untuk akun target.

    Pastikan gateway berjalan dan akun tertaut.

  </Accordion>

  <Accordion title="Balasan muncul di transkrip tetapi tidak di WhatsApp">
    Baris transkrip mencatat apa yang dihasilkan agen. Pengiriman WhatsApp diperiksa secara terpisah: OpenClaw hanya menganggap balasan otomatis terkirim setelah Baileys mengembalikan id pesan keluar untuk setidaknya satu pengiriman teks atau media yang terlihat.

    Reaksi ack adalah tanda terima prabalasan yang independen. Reaksi yang berhasil tidak membuktikan bahwa balasan teks atau media berikutnya diterima oleh WhatsApp.

    Periksa log gateway untuk `auto-reply delivery failed` atau `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Pesan grup diabaikan secara tidak terduga">
    Periksa dalam urutan ini:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entri allowlist `groups`
    - gating penyebutan (`requireMention` + pola penyebutan)
    - kunci duplikat di `openclaw.json` (JSON5): entri yang lebih baru menimpa entri sebelumnya, jadi pertahankan satu `groupPolicy` per cakupan

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Runtime gateway WhatsApp harus menggunakan Node. Bun ditandai tidak kompatibel untuk operasi gateway WhatsApp/Telegram yang stabil.
  </Accordion>
</AccordionGroup>

## Prompt Sistem

WhatsApp mendukung prompt sistem bergaya Telegram untuk grup dan chat langsung melalui peta `groups` dan `direct`.

Hierarki resolusi untuk pesan grup:

Peta `groups` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `groups` miliknya sendiri, itu sepenuhnya menggantikan peta `groups` root (tanpa deep merge). Pencarian prompt kemudian berjalan pada satu peta yang dihasilkan:

1. **Prompt sistem khusus grup** (`groups["<groupId>"].systemPrompt`): digunakan saat entri grup tertentu ada di peta **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan.
2. **Prompt sistem wildcard grup** (`groups["*"].systemPrompt`): digunakan saat entri grup tertentu sepenuhnya tidak ada dari peta, atau saat entri tersebut ada tetapi tidak mendefinisikan kunci `systemPrompt`.

Hierarki resolusi untuk pesan langsung:

Peta `direct` efektif ditentukan terlebih dahulu: jika akun mendefinisikan `direct` miliknya sendiri, itu sepenuhnya menggantikan peta `direct` root (tanpa deep merge). Pencarian prompt kemudian berjalan pada satu peta yang dihasilkan:

1. **Prompt sistem khusus langsung** (`direct["<peerId>"].systemPrompt`): digunakan saat entri peer tertentu ada di peta **dan** kunci `systemPrompt`-nya didefinisikan. Jika `systemPrompt` adalah string kosong (`""`), wildcard ditekan dan tidak ada prompt sistem yang diterapkan.
2. **Prompt sistem wildcard langsung** (`direct["*"].systemPrompt`): digunakan saat entri peer tertentu sepenuhnya tidak ada dari peta, atau saat entri tersebut ada tetapi tidak mendefinisikan kunci `systemPrompt`.

<Note>
`dms` tetap menjadi bucket override riwayat per-DM yang ringan (`dms.<id>.historyLimit`). Override prompt berada di bawah `direct`.
</Note>

**Perbedaan dari perilaku multi-akun Telegram:** Di Telegram, `groups` tingkat root sengaja disembunyikan untuk semua akun dalam konfigurasi multi-akun — bahkan akun yang tidak menentukan `groups` miliknya sendiri — untuk mencegah bot menerima pesan grup dari grup yang bukan tempatnya bergabung. WhatsApp tidak menerapkan pengaman ini: `groups` tingkat root dan `direct` tingkat root selalu diwarisi oleh akun yang tidak menentukan penimpaan tingkat akun, terlepas dari berapa banyak akun yang dikonfigurasi. Dalam konfigurasi WhatsApp multi-akun, jika Anda menginginkan prompt grup atau langsung per akun, tentukan peta lengkap di bawah setiap akun secara eksplisit alih-alih mengandalkan default tingkat root.

Perilaku penting:

- `channels.whatsapp.groups` adalah peta konfigurasi per grup sekaligus daftar izin grup tingkat obrolan. Pada cakupan root maupun akun, `groups["*"]` berarti "semua grup diizinkan masuk" untuk cakupan tersebut.
- Hanya tambahkan `systemPrompt` grup wildcard ketika Anda memang sudah ingin cakupan tersebut mengizinkan semua grup masuk. Jika Anda masih ingin hanya sekumpulan tetap ID grup yang memenuhi syarat, jangan gunakan `groups["*"]` sebagai default prompt. Sebagai gantinya, ulangi prompt pada setiap entri grup yang diizinkan secara eksplisit.
- Penerimaan grup dan otorisasi pengirim adalah pemeriksaan yang terpisah. `groups["*"]` memperluas kumpulan grup yang dapat mencapai penanganan grup, tetapi itu sendiri tidak mengotorisasi setiap pengirim dalam grup tersebut. Akses pengirim tetap dikendalikan secara terpisah oleh `channels.whatsapp.groupPolicy` dan `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` tidak memiliki efek samping yang sama untuk DM. `direct["*"]` hanya menyediakan konfigurasi obrolan langsung default setelah DM sudah diterima oleh `dmPolicy` ditambah aturan `allowFrom` atau penyimpanan pemasangan.

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

Bidang WhatsApp dengan sinyal tinggi:

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
- [Perutean saluran](/id/channels/channel-routing)
- [Perutean multi-agen](/id/concepts/multi-agent)
- [Pemecahan masalah](/id/channels/troubleshooting)
