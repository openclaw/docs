---
read_when:
    - Sedang mengerjakan perilaku channel WhatsApp/web atau perutean inbox
summary: Dukungan channel WhatsApp, kontrol akses, perilaku pengiriman, dan operasi
title: WhatsApp
x-i18n:
    generated_at: "2026-04-05T13:45:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: c16a468b3f47fdf7e4fc3fd745b5c49c7ccebb7af0e8c87c632b78b04c583e49
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (Web channel)

Status: siap produksi melalui WhatsApp Web (Baileys). Gateway memiliki sesi tertaut.

## Instal (sesuai kebutuhan)

- Onboarding (`openclaw onboard`) dan `openclaw channels add --channel whatsapp`
  akan meminta Anda menginstal plugin WhatsApp saat pertama kali memilihnya.
- `openclaw channels login --channel whatsapp` juga menawarkan alur instalasi saat
  plugin belum tersedia.
- Dev channel + checkout git: default ke path plugin lokal.
- Stable/Beta: default ke paket npm `@openclaw/whatsapp`.

Instalasi manual tetap tersedia:

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Kebijakan DM default adalah pairing untuk pengirim yang tidak dikenal.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    Diagnostik lintas channel dan panduan perbaikan.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/gateway/configuration">
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

  </Step>

  <Step title="Mulai gateway">

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
  <Accordion title="Nomor khusus (direkomendasikan)">
    Ini adalah mode operasional yang paling bersih:

    - identitas WhatsApp terpisah untuk OpenClaw
    - allowlist DM dan batas perutean yang lebih jelas
    - kemungkinan kebingungan obrolan sendiri yang lebih rendah

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
    Onboarding mendukung mode nomor pribadi dan menulis baseline yang ramah obrolan sendiri:

    - `dmPolicy: "allowlist"`
    - `allowFrom` mencakup nomor pribadi Anda
    - `selfChatMode: true`

    Dalam runtime, perlindungan obrolan sendiri bergantung pada nomor diri tertaut dan `allowFrom`.

  </Accordion>

  <Accordion title="Cakupan channel khusus WhatsApp Web">
    Channel platform pesan berbasis WhatsApp Web (`Baileys`) dalam arsitektur channel OpenClaw saat ini.

    Tidak ada channel pesan Twilio WhatsApp terpisah dalam registry channel obrolan bawaan.

  </Accordion>
</AccordionGroup>

## Model runtime

- Gateway memiliki socket WhatsApp dan loop reconnect.
- Pengiriman keluar memerlukan listener WhatsApp aktif untuk akun target.
- Obrolan status dan siaran diabaikan (`@status`, `@broadcast`).
- Obrolan langsung menggunakan aturan sesi DM (`session.dmScope`; default `main` menggabungkan DM ke sesi utama agen).
- Sesi grup diisolasi (`agent:<agentId>:whatsapp:group:<jid>`).

## Kontrol akses dan aktivasi

<Tabs>
  <Tab title="Kebijakan DM">
    `channels.whatsapp.dmPolicy` mengontrol akses obrolan langsung:

    - `pairing` (default)
    - `allowlist`
    - `open` (memerlukan `allowFrom` untuk menyertakan `"*"`)
    - `disabled`

    `allowFrom` menerima nomor bergaya E.164 (dinormalisasi secara internal).

    Override multi-akun: `channels.whatsapp.accounts.<id>.dmPolicy` (dan `allowFrom`) lebih diprioritaskan daripada default tingkat channel untuk akun tersebut.

    Detail perilaku runtime:

    - pairing disimpan di allow-store channel dan digabungkan dengan `allowFrom` yang dikonfigurasi
    - jika tidak ada allowlist yang dikonfigurasi, nomor diri tertaut diizinkan secara default
    - DM keluar `fromMe` tidak pernah dipair otomatis

  </Tab>

  <Tab title="Kebijakan grup + allowlist">
    Akses grup memiliki dua lapisan:

    1. **Allowlist keanggotaan grup** (`channels.whatsapp.groups`)
       - jika `groups` dihilangkan, semua grup memenuhi syarat
       - jika `groups` ada, itu bertindak sebagai allowlist grup (`"*"` diperbolehkan)

    2. **Kebijakan pengirim grup** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist pengirim dilewati
       - `allowlist`: pengirim harus cocok dengan `groupAllowFrom` (atau `*`)
       - `disabled`: blokir semua grup masuk

    Fallback allowlist pengirim:

    - jika `groupAllowFrom` tidak diatur, runtime fallback ke `allowFrom` jika tersedia
    - allowlist pengirim dievaluasi sebelum aktivasi mention/balasan

    Catatan: jika tidak ada blok `channels.whatsapp` sama sekali, fallback kebijakan grup runtime adalah `allowlist` (dengan log peringatan), bahkan jika `channels.defaults.groupPolicy` diatur.

  </Tab>

  <Tab title="Mention + /activation">
    Balasan grup memerlukan mention secara default.

    Deteksi mention mencakup:

    - mention WhatsApp eksplisit dari identitas bot
    - pola regex mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - deteksi reply-to-bot implisit (pengirim balasan cocok dengan identitas bot)

    Catatan keamanan:

    - kutip/balas hanya memenuhi pembatasan mention; itu **tidak** memberikan otorisasi pengirim
    - dengan `groupPolicy: "allowlist"`, pengirim yang tidak ada di allowlist tetap diblokir meskipun mereka membalas pesan pengguna yang ada di allowlist

    Perintah aktivasi tingkat sesi:

    - `/activation mention`
    - `/activation always`

    `activation` memperbarui status sesi (bukan config global). Ini dibatasi untuk owner.

  </Tab>
</Tabs>

## Perilaku nomor pribadi dan obrolan sendiri

Saat nomor diri tertaut juga ada di `allowFrom`, perlindungan obrolan sendiri WhatsApp aktif:

- lewati tanda baca untuk giliran obrolan sendiri
- abaikan perilaku pemicu otomatis mention-JID yang sebaliknya akan meming diri Anda sendiri
- jika `messages.responsePrefix` tidak diatur, balasan obrolan sendiri default ke `[{identity.name}]` atau `[openclaw]`

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

    Bidang metadata balasan juga diisi jika tersedia (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, sender JID/E.164).

  </Accordion>

  <Accordion title="Placeholder media dan ekstraksi lokasi/kontak">
    Pesan masuk yang hanya berisi media dinormalisasi dengan placeholder seperti:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Payload lokasi dan kontak dinormalisasi menjadi konteks tekstual sebelum perutean.

  </Accordion>

  <Accordion title="Injeksi riwayat grup tertunda">
    Untuk grup, pesan yang belum diproses dapat dibuffer dan disisipkan sebagai konteks saat bot akhirnya dipicu.

    - batas default: `50`
    - config: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` menonaktifkan

    Penanda injeksi:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Tanda baca">
    Tanda baca diaktifkan secara default untuk pesan WhatsApp masuk yang diterima.

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

    Giliran obrolan sendiri melewati tanda baca bahkan saat diaktifkan secara global.

  </Accordion>
</AccordionGroup>

## Pengiriman, pemotongan, dan media

<AccordionGroup>
  <Accordion title="Pemotongan teks">
    - batas potongan default: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - mode `newline` mengutamakan batas paragraf (baris kosong), lalu fallback ke pemotongan aman berdasarkan panjang
  </Accordion>

  <Accordion title="Perilaku media keluar">
    - mendukung payload gambar, video, audio (PTT voice-note), dan dokumen
    - `audio/ogg` ditulis ulang menjadi `audio/ogg; codecs=opus` untuk kompatibilitas voice-note
    - pemutaran GIF animasi didukung melalui `gifPlayback: true` pada pengiriman video
    - caption diterapkan pada item media pertama saat mengirim payload balasan multi-media
    - sumber media dapat berupa HTTP(S), `file://`, atau path lokal
  </Accordion>

  <Accordion title="Batas ukuran media dan perilaku fallback">
    - batas penyimpanan media masuk: `channels.whatsapp.mediaMaxMb` (default `50`)
    - batas pengiriman media keluar: `channels.whatsapp.mediaMaxMb` (default `50`)
    - override per akun menggunakan `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - gambar dioptimalkan otomatis (resize/quality sweep) agar sesuai dengan batas
    - saat pengiriman media gagal, fallback item pertama mengirim peringatan teks alih-alih diam-diam membuang respons
  </Accordion>
</AccordionGroup>

## Tingkat reaction

`channels.whatsapp.reactionLevel` mengontrol seberapa luas agen menggunakan reaction emoji di WhatsApp:

| Level         | Reaction ack | Reaction yang dimulai agen | Deskripsi                                         |
| ------------- | ------------ | -------------------------- | ------------------------------------------------- |
| `"off"`       | Tidak        | Tidak                      | Tidak ada reaction sama sekali                    |
| `"ack"`       | Ya           | Tidak                      | Hanya reaction ack (tanda terima pra-balasan)     |
| `"minimal"`   | Ya           | Ya (konservatif)           | Ack + reaction agen dengan panduan konservatif    |
| `"extensive"` | Ya           | Ya (didorong)              | Ack + reaction agen dengan panduan yang didorong  |

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

## Reaction acknowledgment

WhatsApp mendukung reaction ack segera saat penerimaan masuk melalui `channels.whatsapp.ackReaction`.
Reaction ack dibatasi oleh `reactionLevel` — reaction ini ditekan saat `reactionLevel` adalah `"off"`.

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
- kegagalan dicatat dalam log tetapi tidak memblokir pengiriman balasan normal
- mode grup `mentions` bereaksi pada giliran yang dipicu mention; aktivasi grup `always` bertindak sebagai bypass untuk pemeriksaan ini
- WhatsApp menggunakan `channels.whatsapp.ackReaction` (`messages.ackReaction` legacy tidak digunakan di sini)

## Multi-akun dan kredensial

<AccordionGroup>
  <Accordion title="Pemilihan akun dan default">
    - id akun berasal dari `channels.whatsapp.accounts`
    - pemilihan akun default: `default` jika ada, jika tidak id akun pertama yang dikonfigurasi (diurutkan)
    - id akun dinormalisasi secara internal untuk lookup
  </Accordion>

  <Accordion title="Path kredensial dan kompatibilitas legacy">
    - path autentikasi saat ini: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - file cadangan: `creds.json.bak`
    - autentikasi default legacy di `~/.openclaw/credentials/` masih dikenali/dimigrasikan untuk alur akun default
  </Accordion>

  <Accordion title="Perilaku logout">
    `openclaw channels logout --channel whatsapp [--account <id>]` menghapus status autentikasi WhatsApp untuk akun tersebut.

    Dalam direktori autentikasi legacy, `oauth.json` dipertahankan sementara file autentikasi Baileys dihapus.

  </Accordion>
</AccordionGroup>

## Alat, action, dan penulisan config

- Dukungan alat agen mencakup action reaction WhatsApp (`react`).
- Pembatasan action:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Penulisan config yang dimulai channel diaktifkan secara default (nonaktifkan melalui `channels.whatsapp.configWrites=false`).

## Pemecahan masalah

<AccordionGroup>
  <Accordion title="Belum tertaut (QR diperlukan)">
    Gejala: status channel melaporkan belum tertaut.

    Perbaikan:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Tertaut tetapi terputus / loop reconnect">
    Gejala: akun tertaut dengan disconnect berulang atau upaya reconnect.

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

  <Accordion title="Pesan grup tiba-tiba diabaikan">
    Periksa dalam urutan ini:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entri allowlist `groups`
    - pembatasan mention (`requireMention` + pola mention)
    - kunci duplikat di `openclaw.json` (JSON5): entri terakhir menggantikan entri sebelumnya, jadi gunakan satu `groupPolicy` per cakupan

  </Accordion>

  <Accordion title="Peringatan runtime Bun">
    Runtime gateway WhatsApp seharusnya menggunakan Node. Bun ditandai tidak kompatibel untuk operasi gateway WhatsApp/Telegram yang stabil.
  </Accordion>
</AccordionGroup>

## Penunjuk referensi konfigurasi

Referensi utama:

- [Referensi konfigurasi - WhatsApp](/gateway/configuration-reference#whatsapp)

Bidang WhatsApp dengan sinyal tinggi:

- akses: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- pengiriman: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-akun: `accounts.<id>.enabled`, `accounts.<id>.authDir`, override tingkat akun
- operasi: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- perilaku sesi: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`

## Terkait

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Security](/gateway/security)
- [Channel routing](/channels/channel-routing)
- [Multi-agent routing](/concepts/multi-agent)
- [Troubleshooting](/channels/troubleshooting)
