---
read_when:
    - Merencanakan migrasi dari BlueBubbles ke Plugin iMessage bawaan
    - Menerjemahkan kunci konfigurasi BlueBubbles ke padanan iMessage
    - Memverifikasi imsg sebelum mengaktifkan plugin iMessage
summary: Migrasikan konfigurasi BlueBubbles lama ke plugin iMessage bawaan tanpa kehilangan penyandingan, daftar izin, atau pengikatan grup.
title: Beralih dari BlueBubbles
x-i18n:
    generated_at: "2026-06-27T17:10:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Plugin `imessage` bawaan kini menjangkau permukaan API privat yang sama seperti BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, manajemen grup, lampiran) dengan menjalankan [`steipete/imsg`](https://github.com/steipete/imsg) melalui JSON-RPC. Jika Anda sudah menjalankan Mac dengan `imsg` terinstal, Anda dapat menghentikan server BlueBubbles dan membiarkan Plugin berbicara langsung ke Messages.app.

Dukungan BlueBubbles telah dihapus. OpenClaw mendukung iMessage hanya melalui `imsg`. Panduan ini untuk memigrasikan konfigurasi `channels.bluebubbles` lama ke `channels.imessage`; tidak ada jalur migrasi lain yang didukung.

<Note>
Untuk pengumuman singkat dan ringkasan operator, lihat [Penghapusan BlueBubbles dan jalur imsg iMessage](/id/announcements/bluebubbles-imessage).
</Note>

## Daftar periksa migrasi

Gunakan daftar periksa ini ketika Anda sudah mengetahui konfigurasi BlueBubbles lama dan menginginkan jalur aman tersingkat:

1. Verifikasi `imsg` langsung di Mac yang menjalankan Messages.app (`imsg chats`, `imsg history`, `imsg send`, dan `imsg rpc --help`).
2. Salin kunci perilaku dari `channels.bluebubbles` ke `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms`, dan `actions`.
3. Hapus kunci transport yang tidak lagi ada: `serverUrl`, `password`, URL webhook, dan penyiapan server BlueBubbles.
4. Jika Gateway tidak berjalan di Mac Messages, atur `channels.imessage.cliPath` ke pembungkus SSH dan atur `remoteHost` untuk pengambilan lampiran jarak jauh.
5. Dengan Gateway dihentikan, aktifkan `channels.imessage`, lalu jalankan `openclaw channels status --probe --channel imessage`.
6. Uji satu DM, satu grup yang diizinkan, lampiran jika diaktifkan, dan setiap tindakan API privat yang Anda harapkan akan digunakan agen.
7. Hapus server BlueBubbles dan konfigurasi `channels.bluebubbles` lama setelah jalur iMessage diverifikasi.

## Kapan migrasi ini masuk akal

- Anda sudah menjalankan `imsg` di Mac yang sama (atau yang dapat dijangkau melalui SSH) tempat Messages.app sudah masuk.
- Anda menginginkan satu komponen bergerak lebih sedikit — tanpa server BlueBubbles terpisah, tanpa endpoint REST untuk diautentikasi, tanpa perpipaan webhook. Satu biner CLI, bukan server + aplikasi klien + helper.
- Anda menggunakan [build macOS / `imsg` yang didukung](/id/channels/imessage#requirements-and-permissions-macos) tempat probe API privat melaporkan `available: true`.

## Apa yang dilakukan imsg

`imsg` adalah CLI macOS lokal untuk Messages. OpenClaw memulai `imsg rpc` sebagai proses anak dan berbicara JSON-RPC melalui stdin/stdout. Tidak ada server HTTP, URL webhook, daemon latar belakang, launch agent, atau port yang perlu diekspos.

- Pembacaan berasal dari `~/Library/Messages/chat.db` menggunakan handle SQLite baca-saja.
- Pesan masuk langsung berasal dari `imsg watch` / `watch.subscribe`, yang mengikuti kejadian sistem berkas `chat.db` dengan fallback polling.
- Pengiriman menggunakan otomatisasi Messages.app untuk teks normal dan pengiriman file.
- Tindakan lanjutan menggunakan `imsg launch` untuk menyuntikkan helper `imsg` ke Messages.app. Inilah yang membuka tanda terima baca, indikator mengetik, pengiriman kaya, edit, batal kirim, balasan berutas, tapback, dan manajemen grup.
- Build Linux dapat memeriksa salinan `chat.db`, tetapi tidak dapat mengirim, mengawasi database Mac langsung, atau mengendalikan Messages.app. Untuk OpenClaw iMessage, jalankan `imsg` di Mac yang sudah masuk atau melalui pembungkus SSH ke Mac tersebut.

## Sebelum Anda mulai

1. Instal `imsg` di Mac yang menjalankan Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Jika `imsg chats` gagal dengan `unable to open database file`, output kosong, atau `authorization denied`, berikan Akses Disk Penuh ke terminal, editor, proses Node, layanan Gateway, atau proses induk SSH yang meluncurkan `imsg`, lalu buka ulang proses induk tersebut.

2. Verifikasi permukaan baca, awasi, kirim, dan RPC sebelum mengubah konfigurasi OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Ganti `42` dengan id obrolan nyata dari `imsg chats`. Pengiriman memerlukan izin Automation untuk Messages.app. Jika OpenClaw akan berjalan melalui SSH, jalankan perintah ini melalui pembungkus SSH atau konteks pengguna yang sama yang akan digunakan OpenClaw. Jika pembacaan/probe berfungsi tetapi pengiriman gagal dengan AppleEvents `-1743`, periksa apakah Automation mendarat di `/usr/libexec/sshd-keygen-wrapper`; lihat [Pengiriman pembungkus SSH gagal dengan AppleEvents -1743](/id/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. Aktifkan bridge API privat ketika Anda membutuhkan tindakan lanjutan:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` memerlukan SIP dinonaktifkan. Pengiriman dasar, riwayat, dan pengawasan berfungsi tanpa `imsg launch`; tindakan lanjutan tidak.

4. Setelah Anda menambahkan konfigurasi `channels.imessage` yang diaktifkan, verifikasi bridge melalui OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Yang Anda inginkan adalah `imessage.privateApi.available: true`. Jika melaporkan `false`, perbaiki itu terlebih dahulu — lihat [Deteksi kemampuan](/id/channels/imessage#private-api-actions). `channels status --probe` hanya mem-probe akun yang dikonfigurasi dan diaktifkan.

5. Snapshot konfigurasi Anda:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Terjemahan konfigurasi

iMessage dan BlueBubbles berbagi banyak konfigurasi tingkat channel. Kunci yang berubah sebagian besar adalah transport (server REST vs CLI lokal). Kunci perilaku (`dmPolicy`, `groupPolicy`, `allowFrom`, dll.) mempertahankan arti yang sama.

| BlueBubbles                                                | iMessage bawaan                           | Catatan                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Semantik yang sama.                                                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.serverUrl`                           | _(dihapus)_                               | Tidak ada server REST — plugin menjalankan `imsg rpc` melalui stdio.                                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(dihapus)_                               | Tidak memerlukan autentikasi webhook.                                                                                                                                                                                                                                                                                                                                                |
| _(implisit)_                                               | `channels.imessage.cliPath`               | Jalur ke `imsg` (default `imsg`); gunakan skrip wrapper untuk SSH.                                                                                                                                                                                                                                                                                                                   |
| _(implisit)_                                               | `channels.imessage.dbPath`                | Override Messages.app `chat.db` opsional; terdeteksi otomatis saat dihilangkan.                                                                                                                                                                                                                                                                                                      |
| _(implisit)_                                               | `channels.imessage.remoteHost`            | `host` atau `user@host` — hanya diperlukan saat `cliPath` adalah wrapper SSH dan Anda ingin mengambil lampiran melalui SCP.                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Nilai yang sama (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Persetujuan pairing dibawa berdasarkan handle, bukan berdasarkan token.                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Nilai yang sama (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Sama.                                                                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Salin ini persis, termasuk entri wildcard `groups: { "*": { ... } }` apa pun.** `requireMention`, `tools`, `toolsBySender` per grup akan terbawa. Dengan `groupPolicy: "allowlist"`, blok `groups` yang kosong atau hilang akan diam-diam membuang setiap pesan grup — lihat "Jebakan registri grup" di bawah.                                                                    |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Default `true`. Dengan plugin bawaan, ini hanya berjalan saat probe API privat aktif.                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Bentuk yang sama, **sama-sama nonaktif secara default**. Jika lampiran Anda sebelumnya mengalir di BlueBubbles, Anda harus mengatur ulang ini secara eksplisit pada blok iMessage — ini tidak terbawa secara implisit, dan foto/media masuk akan diam-diam dibuang tanpa baris log `Inbound message` sampai Anda melakukannya.                                                        |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Root lokal; aturan wildcard yang sama.                                                                                                                                                                                                                                                                                                                                               |
| _(N/A)_                                                    | `channels.imessage.remoteAttachmentRoots` | Hanya digunakan saat `remoteHost` diatur untuk pengambilan SCP.                                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Default 16 MB pada iMessage (default BlueBubbles adalah 8 MB). Atur secara eksplisit jika Anda ingin mempertahankan batas yang lebih rendah.                                                                                                                                                                                                                                        |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Default 4000 pada keduanya.                                                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Opt-in yang sama. Hanya DM — obrolan grup tetap memakai dispatch per pesan secara instan di kedua channel. Memperlebar debounce inbound default menjadi 7000 ms saat diaktifkan tanpa `messages.inbound.byChannel.imessage` eksplisit atau `messages.inbound.debounceMs` global. Lihat [dokumen iMessage § Menggabungkan DM split-send](/id/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(N/A)_                                   | iMessage sudah membaca nama tampilan pengirim dari `chat.db`.                                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Toggle per tindakan: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                                               |

Konfigurasi multi-akun (`channels.bluebubbles.accounts.*`) diterjemahkan satu-ke-satu menjadi `channels.imessage.accounts.*`.

## Jebakan registri grup

Plugin iMessage bawaan menjalankan **dua** gate allowlist grup terpisah secara berurutan. Keduanya harus lolos agar pesan grup mencapai agen:

1. **Allowlist pengirim / target obrolan** (`channels.imessage.groupAllowFrom`) — diperiksa oleh `isAllowedIMessageSender`. Mencocokkan pesan masuk berdasarkan handle pengirim, `chat_guid`, `chat_identifier`, atau `chat_id`. Bentuk yang sama seperti BlueBubbles.
2. **Registri grup** (`channels.imessage.groups`) — diperiksa oleh `resolveChannelGroupPolicy` dari `inbound-processing.ts:199`. Dengan `groupPolicy: "allowlist"`, gate ini memerlukan salah satu dari:
   - entri wildcard `groups: { "*": { ... } }` (menetapkan `allowAll = true`), atau
   - entri eksplisit per-`chat_id` di bawah `groups`.

Jika gate 1 lolos tetapi gate 2 gagal, pesan akan dibuang. Plugin memancarkan dua sinyal tingkat `warn` sehingga ini tidak lagi senyap pada level log default:

- `warn` startup satu kali per akun saat `groupPolicy: "allowlist"` diatur tetapi `channels.imessage.groups` kosong (tidak ada wildcard `"*"`, tidak ada entri per-`chat_id`) — dipicu sebelum pesan apa pun masuk.
- `warn` satu kali per-`chat_id` saat pertama kali grup tertentu dibuang saat runtime, menyebutkan chat_id dan key persis yang harus ditambahkan ke `groups` untuk mengizinkannya.

DM tetap berfungsi karena memakai jalur kode yang berbeda.

Ini adalah mode kegagalan migrasi BlueBubbles → iMessage bawaan yang paling umum: operator menyalin `groupAllowFrom` dan `groupPolicy` tetapi melewati blok `groups`, karena `groups: { "*": { "requireMention": true } }` milik BlueBubbles terlihat seperti pengaturan mention yang tidak terkait. Sebenarnya itu sangat penting untuk gerbang registry.

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

`requireMention: true` di bawah `*` tidak berbahaya saat tidak ada pola mention yang dikonfigurasi: runtime menetapkan `canDetectMention = false` dan memintas penjatuhan mention di `inbound-processing.ts:512`. Dengan pola mention yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`), ini berfungsi sesuai harapan.

Jika log gateway menampilkan `imessage: dropping group message from chat_id=<id>` atau baris startup `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, gerbang 2 sedang menjatuhkan pesan — tambahkan blok `groups`.

## Langkah demi langkah

1. Tambahkan blok iMessage berdampingan dengan blok BlueBubbles yang ada. Biarkan nonaktif selama Gateway masih merutekan traffic BlueBubbles:

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

2. **Uji sebelum traffic penting** — hentikan Gateway, aktifkan sementara blok iMessage, dan pastikan iMessage melaporkan kondisi sehat dari CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` hanya menguji akun yang dikonfigurasi dan diaktifkan. Jangan mulai ulang Gateway dengan BlueBubbles dan iMessage sama-sama aktif kecuali Anda memang ingin kedua pemantau channel berjalan. Jika Anda tidak langsung melakukan cutover, setel kembali `channels.imessage.enabled` ke `false` sebelum memulai ulang Gateway. Gunakan perintah langsung `imsg` di [Sebelum memulai](#before-you-start) untuk memvalidasi Mac sebelum mengaktifkan traffic OpenClaw.

3. **Lakukan cutover.** Setelah akun iMessage yang diaktifkan melaporkan kondisi sehat, hapus konfigurasi BlueBubbles dan biarkan iMessage aktif:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Mulai ulang gateway. Traffic iMessage masuk sekarang mengalir melalui Plugin bawaan.

4. **Verifikasi DM.** Kirim pesan langsung ke agen; pastikan balasannya masuk.

5. **Verifikasi grup secara terpisah.** DM dan grup memakai jalur kode yang berbeda — keberhasilan DM tidak membuktikan grup sudah dirutekan. Kirim pesan ke agen dalam chat grup yang sudah dipasangkan dan pastikan balasannya masuk. Jika grup menjadi senyap (tidak ada balasan agen, tidak ada error), periksa log gateway untuk `imessage: dropping group message from chat_id=<id>` atau baris startup `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — keduanya muncul pada level log default. Jika salah satu muncul, blok `groups` Anda hilang atau kosong — lihat "Jebakan registry grup" di atas.

6. **Verifikasi permukaan aksi** — dari DM yang sudah dipasangkan, minta agen untuk bereaksi, mengedit, membatalkan pengiriman, membalas, mengirim foto, dan (dalam grup) mengganti nama grup / menambah atau menghapus peserta. Setiap aksi harus masuk secara native di Messages.app. Jika ada yang melempar "iMessage `<action>` requires the imsg private API bridge", jalankan `imsg launch` lagi dan segarkan `channels status --probe`.

7. **Hapus server dan konfigurasi BlueBubbles** setelah DM, grup, dan aksi iMessage terverifikasi. OpenClaw tidak akan memakai `channels.bluebubbles`.

## Ringkasan paritas aksi

| Aksi                                                | BlueBubbles lama                    | iMessage bawaan                                                               |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Kirim teks / fallback SMS                           | ✅                                  | ✅                                                                            |
| Kirim media (foto, video, file, suara)              | ✅                                  | ✅                                                                            |
| Balasan berutas (`reply_to_guid`)                   | ✅                                  | ✅ (menutup [#51892](https://github.com/openclaw/openclaw/issues/51892))      |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| Edit / batal kirim (penerima macOS 13+)             | ✅                                  | ✅                                                                            |
| Kirim dengan efek layar                             | ✅                                  | ✅ (menutup sebagian [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Teks kaya bold / italic / underline / strikethrough | ✅                                  | ✅ (pemformatan typed-run melalui attributedBody)                             |
| Ganti nama grup / setel ikon grup                   | ✅                                  | ✅                                                                            |
| Tambah / hapus peserta, keluar dari grup            | ✅                                  | ✅                                                                            |
| Tanda dibaca dan indikator mengetik                 | ✅                                  | ✅ (dibatasi oleh probe private API)                                          |
| Penggabungan DM dari pengirim yang sama             | ✅                                  | ✅ (khusus DM; opt-in melalui `channels.imessage.coalesceSameSenderDms`)      |
| Pemulihan masuk setelah restart                     | ✅ (replay webhook + ambil riwayat) | ✅ (otomatis: replay yang terlewat melalui since_rowid + dedupe; jendela lebih lebar pada lokal) |

iMessage memulihkan pesan yang terlewat saat gateway mati: saat startup, ia memutar ulang dari rowid terakhir yang dikirim melalui `imsg watch.subscribe` `since_rowid` dan melakukan dedupe berdasarkan GUID, sementara pagar usia backlog basi menekan "bom backlog" Push-flush. Ini berjalan melalui koneksi RPC `imsg`, sehingga juga berfungsi untuk setup `cliPath` SSH jarak jauh; setup lokal mendapatkan jendela pemulihan yang lebih lebar karena dapat membaca `chat.db`. Lihat [Pemulihan masuk setelah bridge atau gateway restart](/id/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Pairing, sesi, dan binding ACP

- **Persetujuan pairing** terbawa berdasarkan handle. Anda tidak perlu menyetujui ulang pengirim yang sudah dikenal — `channels.imessage.allowFrom` mengenali string `+15555550123` / `user@example.com` yang sama dengan yang digunakan BlueBubbles.
- **Sesi** tetap dibatasi per agen + chat. DM digabungkan ke sesi utama agen di bawah default `session.dmScope=main`; sesi grup tetap terisolasi per `chat_id`. Kunci sesi berbeda (`agent:<id>:imessage:group:<chat_id>` vs padanan BlueBubbles) — riwayat percakapan lama di bawah kunci sesi BlueBubbles tidak terbawa ke sesi iMessage.
- **Binding ACP** yang merujuk ke `match.channel: "bluebubbles"` perlu diperbarui menjadi `"imessage"`. Bentuk `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle polos) identik.

## Tidak ada channel rollback

Tidak ada runtime BlueBubbles yang didukung untuk kembali. Jika verifikasi iMessage gagal, setel `channels.imessage.enabled: false`, mulai ulang Gateway, perbaiki pemblokir `imsg`, dan ulangi cutover.

Cache balasan berada di state Plugin SQLite. `openclaw doctor --fix` mengimpor dan mengarsipkan sidecar lama `imessage/reply-cache.jsonl` saat ada.

## Terkait

- [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) — pengumuman singkat dan ringkasan operator.
- [iMessage](/id/channels/imessage) — referensi lengkap channel iMessage, termasuk setup `imsg launch` dan deteksi kapabilitas.
- `/channels/bluebubbles` — URL lama yang mengalihkan ke panduan migrasi ini.
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur pairing.
- [Perutean Channel](/id/channels/channel-routing) — cara gateway memilih channel untuk balasan keluar.
