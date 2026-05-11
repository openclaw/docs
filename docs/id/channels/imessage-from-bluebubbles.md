---
read_when:
    - Merencanakan migrasi dari BlueBubbles ke Plugin iMessage bawaan
    - Menerjemahkan kunci konfigurasi BlueBubbles ke padanan iMessage
    - Memverifikasi imsg sebelum mengaktifkan Plugin iMessage
summary: Migrasikan konfigurasi BlueBubbles lama ke Plugin iMessage bawaan tanpa kehilangan penyandingan, daftar izin, atau pengikatan grup.
title: Beralih dari BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Plugin `imessage` bawaan kini menjangkau permukaan API privat yang sama seperti BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, manajemen grup, lampiran) dengan menjalankan [`steipete/imsg`](https://github.com/steipete/imsg) melalui JSON-RPC. Jika Anda sudah menjalankan Mac dengan `imsg` terinstal, Anda dapat melepas server BlueBubbles dan membiarkan Plugin berbicara langsung dengan Messages.app.

Dukungan BlueBubbles telah dihapus. OpenClaw mendukung iMessage hanya melalui `imsg`. Panduan ini untuk memigrasikan konfigurasi `channels.bluebubbles` lama ke `channels.imessage`; tidak ada jalur migrasi lain yang didukung.

<Note>
Untuk pengumuman singkat dan ringkasan operator, lihat [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage).
</Note>

## Daftar periksa migrasi

Gunakan daftar periksa ini ketika Anda sudah mengetahui konfigurasi BlueBubbles lama Anda dan menginginkan jalur aman paling singkat:

1. Verifikasi `imsg` langsung di Mac yang menjalankan Messages.app (`imsg chats`, `imsg history`, `imsg send`, dan `imsg rpc --help`).
2. Salin kunci perilaku dari `channels.bluebubbles` ke `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms`, dan `actions`.
3. Hapus kunci transport yang sudah tidak ada: `serverUrl`, `password`, URL Webhook, dan penyiapan server BlueBubbles.
4. Jika Gateway tidak berjalan di Mac Messages, tetapkan `channels.imessage.cliPath` ke wrapper SSH dan tetapkan `remoteHost` untuk pengambilan lampiran jarak jauh.
5. Dengan Gateway dihentikan, aktifkan `channels.imessage`, lalu jalankan `openclaw channels status --probe --channel imessage`.
6. Uji satu DM, satu grup yang diizinkan, lampiran jika diaktifkan, dan setiap tindakan API privat yang Anda harapkan akan digunakan agen.
7. Hapus server BlueBubbles dan konfigurasi `channels.bluebubbles` lama setelah jalur iMessage terverifikasi.

## Kapan migrasi ini masuk akal

- Anda sudah menjalankan `imsg` di Mac yang sama (atau yang dapat dijangkau melalui SSH) tempat Messages.app sudah masuk.
- Anda menginginkan satu komponen bergerak lebih sedikit — tanpa server BlueBubbles terpisah, tanpa endpoint REST untuk diautentikasi, tanpa perangkaian Webhook. Satu biner CLI, bukan server + aplikasi klien + helper.
- Anda berada pada [build macOS / `imsg` yang didukung](/id/channels/imessage#requirements-and-permissions-macos) dengan probe API privat melaporkan `available: true`.

## Apa yang dilakukan imsg

`imsg` adalah CLI macOS lokal untuk Messages. OpenClaw memulai `imsg rpc` sebagai proses anak dan berbicara JSON-RPC melalui stdin/stdout. Tidak ada server HTTP, URL Webhook, daemon latar belakang, launch agent, atau port yang perlu diekspos.

- Pembacaan berasal dari `~/Library/Messages/chat.db` menggunakan handle SQLite hanya-baca.
- Pesan masuk langsung berasal dari `imsg watch` / `watch.subscribe`, yang mengikuti event sistem file `chat.db` dengan fallback polling.
- Pengiriman menggunakan otomasi Messages.app untuk pengiriman teks dan file normal.
- Tindakan lanjutan menggunakan `imsg launch` untuk menyuntikkan helper `imsg` ke Messages.app. Itulah yang membuka tanda terima dibaca, indikator mengetik, pengiriman kaya, edit, unsend, balasan berutas, tapback, dan manajemen grup.
- Build Linux dapat memeriksa `chat.db` yang disalin, tetapi tidak dapat mengirim, memantau basis data Mac langsung, atau menjalankan Messages.app. Untuk OpenClaw iMessage, jalankan `imsg` di Mac yang sudah masuk atau melalui wrapper SSH ke Mac tersebut.

## Sebelum Anda mulai

1. Instal `imsg` di Mac yang menjalankan Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Jika `imsg chats` gagal dengan `unable to open database file`, output kosong, atau `authorization denied`, berikan Full Disk Access ke terminal, editor, proses Node, layanan Gateway, atau proses induk SSH yang meluncurkan `imsg`, lalu buka kembali proses induk tersebut.

2. Verifikasi permukaan baca, pantau, kirim, dan RPC sebelum mengubah konfigurasi OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Ganti `42` dengan id obrolan nyata dari `imsg chats`. Pengiriman memerlukan izin Automation untuk Messages.app. Jika OpenClaw akan berjalan melalui SSH, jalankan perintah ini melalui wrapper SSH atau konteks pengguna yang sama yang akan digunakan OpenClaw.

3. Aktifkan jembatan API privat ketika Anda membutuhkan tindakan lanjutan:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` memerlukan SIP dinonaktifkan. Kirim dasar, riwayat, dan pantau berfungsi tanpa `imsg launch`; tindakan lanjutan tidak.

4. Setelah Anda menambahkan konfigurasi `channels.imessage` yang diaktifkan, verifikasi jembatan melalui OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Anda menginginkan `imessage.privateApi.available: true`. Jika melaporkan `false`, perbaiki itu terlebih dahulu — lihat [Deteksi kapabilitas](/id/channels/imessage#private-api-actions). `channels status --probe` hanya mem-probe akun yang dikonfigurasi dan diaktifkan.

5. Snapshot konfigurasi Anda:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Terjemahan konfigurasi

iMessage dan BlueBubbles berbagi banyak konfigurasi tingkat kanal. Kunci yang berubah sebagian besar adalah transport (server REST vs CLI lokal). Kunci perilaku (`dmPolicy`, `groupPolicy`, `allowFrom`, dll.) mempertahankan makna yang sama.

| BlueBubbles                                                | iMessage bawaan                           | Catatan                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Semantik yang sama.                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.serverUrl`                           | _(dihapus)_                               | Tidak ada server REST — plugin menjalankan `imsg rpc` melalui stdio.                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.password`                            | _(dihapus)_                               | Tidak perlu autentikasi webhook.                                                                                                                                                                                                                                                                                                             |
| _(implisit)_                                               | `channels.imessage.cliPath`               | Jalur ke `imsg` (default `imsg`); gunakan skrip pembungkus untuk SSH.                                                                                                                                                                                                                                                                        |
| _(implisit)_                                               | `channels.imessage.dbPath`                | Override Messages.app `chat.db` opsional; dideteksi otomatis saat dihilangkan.                                                                                                                                                                                                                                                               |
| _(implisit)_                                               | `channels.imessage.remoteHost`            | `host` atau `user@host` — hanya diperlukan saat `cliPath` adalah pembungkus SSH dan Anda menginginkan pengambilan lampiran melalui SCP.                                                                                                                                                                                                       |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Nilai yang sama (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Persetujuan pairing terbawa berdasarkan handle, bukan token.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Nilai yang sama (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Sama.                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Salin ini apa adanya, termasuk entri wildcard `groups: { "*": { ... } }` apa pun.** `requireMention`, `tools`, `toolsBySender` per grup ikut terbawa. Dengan `groupPolicy: "allowlist"`, blok `groups` yang kosong atau hilang akan diam-diam menjatuhkan setiap pesan grup — lihat "Jebakan registry grup" di bawah.                    |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Default `true`. Dengan plugin bawaan, ini hanya dipicu saat probe API privat aktif.                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Bentuk yang sama, **sama-sama nonaktif secara default**. Jika lampiran sudah mengalir di BlueBubbles, Anda harus mengatur ulang ini secara eksplisit pada blok iMessage — ini tidak terbawa secara implisit, dan foto/media masuk akan dijatuhkan diam-diam tanpa baris log `Inbound message` sampai Anda melakukannya.                     |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Root lokal; aturan wildcard yang sama.                                                                                                                                                                                                                                                                                                       |
| _(N/A)_                                                    | `channels.imessage.remoteAttachmentRoots` | Hanya digunakan saat `remoteHost` diatur untuk pengambilan SCP.                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Default 16 MB pada iMessage (default BlueBubbles adalah 8 MB). Atur secara eksplisit jika Anda ingin mempertahankan batas yang lebih rendah.                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Default 4000 pada keduanya.                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Opt-in yang sama. Khusus DM — chat grup tetap mempertahankan pengiriman instan per pesan di kedua channel. Memperlebar debounce masuk default menjadi 2500 md saat diaktifkan tanpa `messages.inbound.byChannel.imessage` eksplisit. Lihat [dokumentasi iMessage § Menggabungkan DM split-send](/id/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/A)_                                   | iMessage sudah membaca nama tampilan pengirim dari `chat.db`.                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Toggle per tindakan: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                         |

Konfigurasi multi-akun (`channels.bluebubbles.accounts.*`) diterjemahkan satu-ke-satu menjadi `channels.imessage.accounts.*`.

## Jebakan registry grup

Plugin iMessage bawaan menjalankan **dua** gerbang allowlist grup terpisah secara berurutan. Keduanya harus lolos agar pesan grup mencapai agent:

1. **Allowlist pengirim / target chat** (`channels.imessage.groupAllowFrom`) — diperiksa oleh `isAllowedIMessageSender`. Mencocokkan pesan masuk berdasarkan handle pengirim, `chat_guid`, `chat_identifier`, atau `chat_id`. Bentuk yang sama dengan BlueBubbles.
2. **Registry grup** (`channels.imessage.groups`) — diperiksa oleh `resolveChannelGroupPolicy` dari `inbound-processing.ts:199`. Dengan `groupPolicy: "allowlist"`, gerbang ini memerlukan salah satu dari:
   - entri wildcard `groups: { "*": { ... } }` (mengatur `allowAll = true`), atau
   - entri per-`chat_id` eksplisit di bawah `groups`.

Jika gerbang 1 lolos tetapi gerbang 2 gagal, pesan dijatuhkan. Plugin memancarkan dua sinyal tingkat `warn` sehingga ini tidak lagi diam pada tingkat log default:

- `warn` startup satu kali per akun saat `groupPolicy: "allowlist"` diatur tetapi `channels.imessage.groups` kosong (tanpa wildcard `"*"`, tanpa entri per-`chat_id`) — dipicu sebelum pesan apa pun masuk.
- `warn` satu kali per-`chat_id` saat pertama kali grup tertentu dijatuhkan saat runtime, menyebutkan chat_id dan key persis yang perlu ditambahkan ke `groups` untuk mengizinkannya.

DM terus berfungsi karena mengambil jalur kode yang berbeda.

Ini adalah mode kegagalan migrasi BlueBubbles → iMessage bawaan yang paling umum: operator menyalin `groupAllowFrom` dan `groupPolicy` tetapi melewatkan blok `groups`, karena `groups: { "*": { "requireMention": true } }` milik BlueBubbles terlihat seperti pengaturan mention yang tidak terkait. Sebenarnya itu penting untuk gerbang registry.

Konfigurasi minimum agar pesan grup tetap mengalir setelah `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` di bawah `*` tidak berbahaya saat tidak ada pola mention yang dikonfigurasi: runtime menetapkan `canDetectMention = false` dan memotong lebih awal pembuangan mention di `inbound-processing.ts:512`. Dengan pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`), ini bekerja sesuai harapan.

Jika log gateway menampilkan `imessage: dropping group message from chat_id=<id>` atau baris startup `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, gate 2 sedang membuang pesan — tambahkan blok `groups`.

## Langkah demi langkah

1. Tambahkan blok iMessage di samping blok BlueBubbles yang ada. Biarkan tetap dinonaktifkan selama Gateway masih merutekan trafik BlueBubbles:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Lakukan probe sebelum trafik menjadi penting** — hentikan Gateway, aktifkan blok iMessage sementara, dan pastikan iMessage dilaporkan sehat dari CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` hanya mem-probe akun yang dikonfigurasi dan diaktifkan. Jangan mulai ulang Gateway dengan BlueBubbles dan iMessage sama-sama aktif kecuali Anda memang ingin kedua pemantau channel berjalan. Jika Anda tidak langsung melakukan cutover, setel kembali `channels.imessage.enabled` ke `false` sebelum memulai ulang Gateway. Gunakan perintah langsung `imsg` di [Sebelum memulai](#before-you-start) untuk memvalidasi Mac sebelum mengaktifkan trafik OpenClaw.

3. **Lakukan cutover.** Setelah akun iMessage yang diaktifkan dilaporkan sehat, hapus konfigurasi BlueBubbles dan biarkan iMessage aktif:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Mulai ulang gateway. Trafik masuk iMessage sekarang mengalir melalui Plugin bawaan.

4. **Verifikasi DM.** Kirim pesan langsung ke agen; pastikan balasan masuk.

5. **Verifikasi grup secara terpisah.** DM dan grup mengambil jalur kode yang berbeda — keberhasilan DM tidak membuktikan bahwa grup sudah dirutekan. Kirim pesan ke agen dalam obrolan grup yang sudah dipasangkan dan pastikan balasan masuk. Jika grup menjadi senyap (tidak ada balasan agen, tidak ada error), periksa log gateway untuk `imessage: dropping group message from chat_id=<id>` atau baris startup `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — keduanya muncul pada level log default. Jika salah satunya muncul, blok `groups` Anda hilang atau kosong — lihat "Group registry footgun" di atas.

6. **Verifikasi permukaan aksi** — dari DM yang sudah dipasangkan, minta agen untuk bereaksi, mengedit, membatalkan pengiriman, membalas, mengirim foto, dan (di grup) mengganti nama grup / menambah atau menghapus peserta. Setiap aksi harus masuk secara native di Messages.app. Jika ada yang memunculkan "iMessage `<action>` requires the imsg private API bridge", jalankan `imsg launch` lagi dan segarkan `channels status --probe`.

7. **Hapus server dan konfigurasi BlueBubbles** setelah DM, grup, dan aksi iMessage terverifikasi. OpenClaw tidak akan menggunakan `channels.bluebubbles`.

## Sekilas kesetaraan aksi

| Aksi                                                       | BlueBubbles lama                    | iMessage bawaan                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Kirim teks / fallback SMS                                  | ✅                                  | ✅                                                                                                                      |
| Kirim media (foto, video, file, suara)                     | ✅                                  | ✅                                                                                                                      |
| Balasan berutas (`reply_to_guid`)                          | ✅                                  | ✅ (menutup [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Edit / batalkan pengiriman (penerima macOS 13+)            | ✅                                  | ✅                                                                                                                      |
| Kirim dengan efek layar                                    | ✅                                  | ✅ (menutup sebagian [#9394](https://github.com/openclaw/openclaw/issues/9394))                                         |
| Teks kaya tebal / miring / garis bawah / coret             | ✅                                  | ✅ (pemformatan typed-run melalui attributedBody)                                                                       |
| Ganti nama grup / atur ikon grup                           | ✅                                  | ✅                                                                                                                      |
| Tambah / hapus peserta, keluar dari grup                   | ✅                                  | ✅                                                                                                                      |
| Tanda dibaca dan indikator sedang mengetik                 | ✅                                  | ✅ (dikawal oleh probe API privat)                                                                                      |
| Penggabungan DM pengirim sama                              | ✅                                  | ✅ (khusus DM; opt-in melalui `channels.imessage.coalesceSameSenderDms`)                                                |
| Catchup pesan masuk yang diterima saat gateway mati        | ✅ (replay webhook + pengambilan riwayat) | ✅ (opt-in melalui `channels.imessage.catchup.enabled`; menutup [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

Catchup iMessage sekarang tersedia sebagai fitur opt-in pada Plugin bawaan. Saat startup gateway, jika `channels.imessage.catchup.enabled` bernilai `true`, gateway menjalankan satu lintasan `chats.list` + `messages.history` per obrolan terhadap klien JSON-RPC yang sama dengan yang digunakan oleh `imsg watch`, me-replay setiap baris masuk yang terlewat melalui jalur dispatch langsung (allowlist, kebijakan grup, debouncer, echo cache), dan menyimpan kursor per akun agar startup berikutnya melanjutkan dari posisi terakhir. Lihat [Mengejar ketertinggalan setelah downtime gateway](/id/channels/imessage#catching-up-after-gateway-downtime) untuk penyesuaian.

## Pairing, sesi, dan binding ACP

- **Persetujuan pairing** terbawa berdasarkan handle. Anda tidak perlu menyetujui ulang pengirim yang sudah dikenal — `channels.imessage.allowFrom` mengenali string `+15555550123` / `user@example.com` yang sama dengan yang digunakan BlueBubbles.
- **Sesi** tetap dicakup per agen + obrolan. DM digabungkan ke sesi utama agen di bawah default `session.dmScope=main`; sesi grup tetap terisolasi per `chat_id`. Kunci sesi berbeda (`agent:<id>:imessage:group:<chat_id>` vs ekuivalen BlueBubbles) — riwayat percakapan lama di bawah kunci sesi BlueBubbles tidak terbawa ke sesi iMessage.
- **Binding ACP** yang merujuk ke `match.channel: "bluebubbles"` perlu diperbarui menjadi `"imessage"`. Bentuk `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle polos) identik.

## Tidak ada channel rollback

Tidak ada runtime BlueBubbles yang didukung untuk dialihkan kembali. Jika verifikasi iMessage gagal, setel `channels.imessage.enabled: false`, mulai ulang Gateway, perbaiki penghambat `imsg`, dan coba ulang cutover.

Cache balasan berada di `~/.openclaw/state/imessage/reply-cache.jsonl` (mode `0600`, direktori induk `0700`). Aman untuk dihapus jika Anda ingin memulai dari keadaan bersih.

## Terkait

- [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) — pengumuman singkat dan ringkasan operator.
- [iMessage](/id/channels/imessage) — referensi lengkap channel iMessage, termasuk penyiapan `imsg launch` dan deteksi kapabilitas.
- `/channels/bluebubbles` — URL lama yang dialihkan ke panduan migrasi ini.
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing.
- [Perutean Channel](/id/channels/channel-routing) — cara gateway memilih channel untuk balasan keluar.
