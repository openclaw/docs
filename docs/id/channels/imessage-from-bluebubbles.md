---
read_when:
    - Merencanakan migrasi dari BlueBubbles ke plugin iMessage bawaan
    - Menerjemahkan kunci konfigurasi BlueBubbles ke padanan iMessage
    - Memverifikasi imsg sebelum mengaktifkan plugin iMessage
summary: 'Migrasikan konfigurasi lama BlueBubbles ke plugin iMessage bawaan: pemetaan kunci, pembatas daftar yang diizinkan untuk grup, dan verifikasi peralihan.'
title: Beralih dari BlueBubbles
x-i18n:
    generated_at: "2026-07-12T13:55:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9d1533c356d3901358c25f0b90e6850124f66d3c14f056d90d5723242076d22
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Dukungan BlueBubbles telah dihapus. OpenClaw mendukung iMessage hanya melalui plugin bawaan `imessage`, yang menjalankan [`steipete/imsg`](https://github.com/steipete/imsg) melalui JSON-RPC dan menjangkau permukaan API privat yang sama seperti yang dimiliki BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, jajak pendapat native, pengelolaan grup, lampiran). Satu biner CLI menggantikan server BlueBubbles + aplikasi klien + rangkaian webhook: tanpa endpoint REST, tanpa autentikasi webhook.

Panduan ini memigrasikan konfigurasi lama `channels.bluebubbles` ke `channels.imessage`. Tidak ada jalur migrasi lain yang didukung. Pada OpenClaw saat ini, blok `channels.bluebubbles` yang tersisa tidak aktif—tidak ada runtime yang membacanya.

<Note>
Untuk pengumuman singkat dan ringkasan bagi operator, lihat [Penghapusan BlueBubbles dan jalur imsg iMessage](/id/announcements/bluebubbles-imessage).
</Note>

## Daftar periksa migrasi

Jalur aman tersingkat jika Anda sudah memahami konfigurasi BlueBubbles lama Anda:

1. Verifikasi `imsg` secara langsung di Mac yang menjalankan Messages.app (`imsg chats`, `imsg history`, `imsg send`, `imsg rpc --help`).
2. Salin kunci perilaku dari `channels.bluebubbles` ke `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms`, dan `actions`.
3. Hapus kunci transport yang sudah tidak ada: `serverUrl`, `password`, URL webhook, dan penyiapan server BlueBubbles.
4. Jika Gateway tidak berjalan di Mac tempat Messages berada, atur `channels.imessage.cliPath` ke pembungkus SSH dan atur `remoteHost` untuk mengambil lampiran jarak jauh.
5. Aktifkan `channels.imessage`, mulai ulang Gateway, lalu jalankan `openclaw channels status --probe --channel imessage`.
6. Uji satu pesan langsung, satu grup yang diizinkan, lampiran jika diaktifkan, dan setiap tindakan API privat yang Anda harapkan digunakan oleh agen.
7. Hapus server BlueBubbles dan konfigurasi lama `channels.bluebubbles` setelah jalur iMessage terverifikasi.

## Fungsi imsg

`imsg` adalah CLI macOS lokal untuk Messages. OpenClaw memulai `imsg rpc` sebagai proses anak dan berkomunikasi menggunakan JSON-RPC melalui stdin/stdout. Tidak ada server HTTP, URL webhook, daemon latar belakang, agen peluncuran, atau port yang perlu diekspos.

- Pembacaan berasal dari `~/Library/Messages/chat.db` menggunakan handel SQLite hanya-baca.
- Pesan langsung yang masuk berasal dari `imsg watch` / `watch.subscribe`, yang mengikuti peristiwa sistem berkas `chat.db` dengan polling sebagai cadangan.
- Pengiriman menggunakan otomatisasi Messages.app untuk mengirim teks dan berkas biasa.
- Tindakan lanjutan menggunakan `imsg launch` untuk menyuntikkan pembantu `imsg` ke Messages.app. Inilah yang mengaktifkan tanda terima baca, indikator sedang mengetik, pengiriman kaya, pengeditan, pembatalan pengiriman, balasan berutas, tapback, jajak pendapat, dan pengelolaan grup.
- Versi Linux dapat memeriksa salinan `chat.db`, tetapi tidak dapat mengirim, memantau basis data Mac secara langsung, atau mengendalikan Messages.app. Untuk iMessage OpenClaw, jalankan `imsg` di Mac yang telah masuk atau melalui pembungkus SSH ke Mac tersebut.

## Sebelum memulai

1. Instal `imsg` di Mac yang menjalankan Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg chats --limit 3
   ```

   Untuk penyiapan lokal biasa, penyiapan OpenClaw dapat menawarkan instalasi atau pembaruan Homebrew untuk `imsg` yang dikonfirmasi pengguna di Mac Messages yang telah masuk. Penyiapan manual dan topologi pembungkus SSH tetap dikelola oleh operator: ulangi pembaruan Homebrew dalam konteks pengguna lokal atau jarak jauh yang sama dengan yang akan menjalankan `imsg`. Jika `imsg chats` gagal dengan `unable to open database file`, keluaran kosong, atau `authorization denied`, berikan Full Disk Access kepada terminal, editor, proses Node, layanan Gateway, atau proses induk SSH yang meluncurkan `imsg`, lalu buka kembali proses induk tersebut.

2. Verifikasi permukaan baca, pemantauan, pengiriman, dan RPC sebelum mengubah konfigurasi OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Ganti `42` dengan id obrolan sebenarnya dari `imsg chats`. Pengiriman memerlukan izin Automation untuk Messages.app. Jika OpenClaw akan berjalan melalui SSH, jalankan perintah ini melalui pembungkus SSH atau konteks pengguna yang sama dengan yang akan digunakan OpenClaw. Jika pembacaan berfungsi tetapi pengiriman gagal dengan AppleEvents `-1743`, periksa apakah Automation diterapkan pada `/usr/libexec/sshd-keygen-wrapper`; lihat [Pengiriman melalui pembungkus SSH gagal dengan AppleEvents -1743](/id/channels/imessage#requirements-and-permissions-macos).

3. Aktifkan jembatan API privat. Ini sangat dianjurkan untuk iMessage OpenClaw karena balasan, tapback, efek, jajak pendapat, balasan lampiran, dan tindakan grup bergantung padanya:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` mengharuskan SIP dinonaktifkan (dan pada macOS modern, validasi pustaka dilonggarkan—lihat [Mengaktifkan API privat imsg](/id/channels/imessage#enabling-the-imsg-private-api)). Pengiriman dasar, riwayat, dan pemantauan berfungsi tanpa `imsg launch`; seluruh permukaan tindakan iMessage OpenClaw tidak.

4. Setelah Anda mengaktifkan `channels.imessage` dan memulai Gateway, verifikasi jembatan melalui OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Akun iMessage seharusnya melaporkan `works`; dengan `--json`, payload pemeriksaan mencakup `privateApi.available: true`. Jika melaporkan `false`, perbaiki itu terlebih dahulu—lihat [Deteksi kemampuan](/id/channels/imessage#private-api-actions). Pemeriksaan memerlukan Gateway yang dapat dijangkau (jika tidak, CLI akan kembali menampilkan keluaran berbasis konfigurasi saja) dan hanya memeriksa akun terkonfigurasi yang diaktifkan.

5. Buat snapshot konfigurasi Anda:

   ```bash
   cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak
   ```

## Penerjemahan konfigurasi

iMessage dan BlueBubbles berbagi sebagian besar kunci perilaku tingkat kanal. Yang berubah adalah transport (server REST dibandingkan CLI lokal) dan format kunci registri grup.

| BlueBubbles                                                | iMessage bawaan                           | Catatan                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Semantik sama (nilai bawaan `true` setelah blok tersedia).                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.serverUrl`                           | _(dihapus)_                               | Tidak ada server REST — Plugin menjalankan `imsg rpc` melalui stdio.                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.password`                            | _(dihapus)_                               | Autentikasi webhook tidak diperlukan.                                                                                                                                                                                                                                                                                 |
| _(implisit)_                                               | `channels.imessage.cliPath`               | Jalur ke `imsg` (nilai bawaan `imsg`); gunakan skrip pembungkus untuk SSH.                                                                                                                                                                                                                                            |
| _(implisit)_                                               | `channels.imessage.dbPath`                | Penggantian `chat.db` Messages.app opsional; terdeteksi otomatis jika dihilangkan.                                                                                                                                                                                                                                    |
| _(implisit)_                                               | `channels.imessage.remoteHost`            | `host` atau `user@host` — hanya diperlukan ketika `cliPath` merupakan pembungkus SSH dan Anda ingin mengambil lampiran melalui SCP.                                                                                                                                                                                   |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Nilai sama (`pairing` / `allowlist` / `open` / `disabled`); nilai bawaan `pairing`.                                                                                                                                                                                                                                   |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Format alamat sama (`+15555550123`, `user@example.com`). Persetujuan penyimpanan pemasangan tidak ditransfer — lihat di bawah.                                                                                                                                                                                         |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Nilai sama (`allowlist` / `open` / `disabled`); nilai bawaan `allowlist`.                                                                                                                                                                                                                                             |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Sama. Jika tidak ditetapkan, iMessage kembali menggunakan `allowFrom`; `groupAllowFrom: []` yang secara eksplisit kosong memblokir semua grup di bawah `groupPolicy: "allowlist"`.                                                                                                                                      |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | Salin entri wildcard `"*"` persis seperti aslinya; ubah kunci entri per grup berdasarkan `chat_id` numerik iMessage — lihat "Jebakan registri grup". `requireMention`, `tools`, `toolsBySender`, `systemPrompt` tetap berlaku.                                                                                            |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Nilai bawaan `true`. Dengan Plugin bawaan, ini hanya dijalankan saat pemeriksaan API privat aktif.                                                                                                                                                                                                                    |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Bentuk sama, sama-sama dinonaktifkan secara bawaan. Jika lampiran diteruskan di BlueBubbles, tetapkan ini secara eksplisit — foto/media masuk dibuang secara diam-diam (tanpa baris log `Inbound message`) sampai Anda melakukannya.                                                                                      |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Direktori akar lokal; aturan wildcard sama.                                                                                                                                                                                                                                                                           |
| _(Tidak berlaku)_                                          | `channels.imessage.remoteAttachmentRoots` | Hanya digunakan ketika `remoteHost` ditetapkan untuk pengambilan melalui SCP.                                                                                                                                                                                                                                         |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Nilai bawaan 16 MB di iMessage (nilai bawaan BlueBubbles adalah 8 MB). Tetapkan secara eksplisit untuk mempertahankan batas yang lebih rendah.                                                                                                                                                                         |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Nilai bawaan 4000 pada keduanya.                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Keikutsertaan opsional yang sama. Khusus DM — grup tetap mengirimkan per pesan. Memperlebar debounce masuk bawaan menjadi 7000 md kecuali `messages.inbound.byChannel.imessage` atau `messages.inbound.debounceMs` global ditetapkan. Lihat [Penggabungan DM kirim-terpisah](/id/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(Tidak berlaku)_                         | `imsg` sudah menyediakan nama tampilan pengirim dari `chat.db`.                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Tombol aktif/nonaktif per tindakan yang sama (`reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`) ditambah `polls` baru. Semuanya diaktifkan secara bawaan; tindakan API privat tetap memerlukan bridge.     |

Konfigurasi multiakun (`channels.bluebubbles.accounts.*`) diterjemahkan satu-ke-satu menjadi `channels.imessage.accounts.*`.

## Jebakan registri grup

Plugin iMessage bawaan menjalankan dua gerbang grup secara berurutan. Pesan grup harus melewati keduanya agar dapat mencapai agen:

1. **Daftar yang diizinkan untuk pengirim / target obrolan** (`channels.imessage.groupAllowFrom`) — mencocokkan alamat pengirim atau target obrolan (entri `chat_id:`, `chat_guid:`, `chat_identifier:`). Jika `groupAllowFrom` tidak ditetapkan, gerbang ini kembali menggunakan `allowFrom`; `groupAllowFrom: []` yang eksplisit menonaktifkan mekanisme tersebut dan membuang setiap pesan grup di bawah `groupPolicy: "allowlist"`.
2. **Registri grup** (`channels.imessage.groups`) — menggunakan `chat_id` numerik iMessage sebagai kunci:
   - Tidak ada blok `groups` (atau blok kosong): grup melewati gerbang ini selama gerbang 1 memiliki daftar efektif pengirim yang diizinkan dan tidak kosong; pemfilteran pengirim mengatur akses dan tidak ada peringatan saat mulai yang menyatakan semua pesan akan dibuang.
   - `groups` berisi entri tetapi tanpa `"*"`: hanya kunci `chat_id` yang tercantum yang lolos. Mencantumkan grup apa pun mengubah registri menjadi daftar yang diizinkan, bahkan di bawah `groupPolicy: "open"`.
   - `groups: { "*": { ... } }`: setiap grup melewati gerbang ini.

Jebakan migrasinya: BlueBubbles menggunakan GUID obrolan / pengenal obrolan sebagai kunci entri `groups`, sedangkan registri iMessage menggunakan `chat_id` numerik sebagai kunci. Entri per grup yang disalin persis seperti aslinya akan membuat registri tidak kosong dengan kunci yang tidak pernah cocok, sehingga setiap pesan grup dibuang di gerbang 2. Salin wildcard `"*"` persis seperti aslinya; ubah kunci entri grup tertentu menggunakan nilai `chat_id` dari `imsg chats`.

Kedua jalur pembuangan terlihat pada tingkat log bawaan melalui baris `warn`:

- Satu kali per akun saat mulai, ketika `groupPolicy: "allowlist"` ditetapkan dan daftar efektif pengirim grup yang diizinkan kosong: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...`. Tetapkan `groupAllowFrom` (atau `allowFrom`) untuk mengizinkan pengirim; menambahkan `groups` saja tidak memenuhi gerbang pengirim.
- Satu kali per `chat_id` saat waktu proses, ketika registri membuang grup: `imessage: dropping group message from chat_id=<id> ... not in channels.imessage.groups allowlist`, dengan menyebutkan kunci persis yang harus ditambahkan.

DM tetap berfungsi dalam kedua keadaan — DM menggunakan jalur kode yang berbeda, sehingga keberhasilan DM tidak membuktikan bahwa perutean grup berfungsi.

Konfigurasi minimum dengan cakupan pengirim dan `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
    },
  },
}
```

Konfigurasi ini mengizinkan pengirim yang dikonfigurasi di grup mana pun. Tambahkan entri `groups` untuk membatasi obrolan yang diizinkan atau menetapkan opsi per obrolan seperti `requireMention`; salin entri `"*"` BlueBubbles persis seperti aslinya, tetapi ubah kunci entri tertentu menggunakan nilai `chat_id` numerik iMessage.

## Langkah demi langkah

1. Terjemahkan konfigurasi. Biarkan blok baru dinonaktifkan selama Anda mengedit; blok `channels.bluebubbles` lama diabaikan oleh OpenClaw saat ini dan dapat dibiarkan berdampingan sebagai referensi:

   ```json5
   {
     channels: {
       imessage: {
         enabled: false, // flip to true when ready to cut over
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // wildcard copies verbatim; re-key per-chat entries by chat_id
         // actions default to enabled; set individual toggles false to disable
       },
     },
   }
   ```

2. **Alihkan dan lakukan pemeriksaan.** Atur `channels.imessage.enabled: true`, mulai ulang Gateway, lalu pastikan kanal dilaporkan dalam kondisi sehat:

   ```bash
   openclaw gateway restart
   openclaw channels status --probe --channel imessage   # expect "works"; --json shows privateApi.available: true
   ```

   Pemeriksaan memerlukan Gateway yang dapat dijangkau dan hanya memeriksa akun yang telah dikonfigurasi serta diaktifkan. Gunakan perintah langsung `imsg` di [Sebelum memulai](#before-you-start) untuk memvalidasi Mac itu sendiri.

3. **Verifikasi DM.** Kirim pesan langsung kepada agen; pastikan balasannya diterima.

4. **Verifikasi grup secara terpisah.** DM dan grup menggunakan jalur kode yang berbeda — keberhasilan DM tidak membuktikan bahwa perutean grup berfungsi. Kirim pesan di obrolan grup yang diizinkan dan pastikan balasannya diterima. Jika grup tidak memberikan respons (tidak ada balasan agen maupun kesalahan), periksa log Gateway untuk dua baris `warn` dari "Jebakan registri grup" di atas. Peringatan saat awal proses berarti daftar pengirim yang diizinkan secara efektif kosong; peringatan per-`chat_id` berarti registri `groups` yang terisi tidak memuat obrolan tersebut.

5. **Verifikasi permukaan tindakan.** Dari DM yang telah dipasangkan, minta agen untuk memberikan reaksi, mengedit, membatalkan pengiriman, membalas, mengirim foto, serta (dalam grup) mengganti nama grup atau menambah/menghapus peserta. Setiap tindakan seharusnya diterapkan secara native di Messages.app. Jika ada tindakan yang menghasilkan `iMessage <action> requires the imsg private API bridge`, jalankan kembali `imsg launch`, lalu segarkan dengan `openclaw channels status --probe`.

6. **Hapus server BlueBubbles dan blok `channels.bluebubbles`** setelah DM, grup, serta tindakan iMessage selesai diverifikasi. OpenClaw tidak membaca `channels.bluebubbles`.

## Sekilas kesetaraan tindakan

| Tindakan                                            | BlueBubbles lama | iMessage bawaan                                                               |
| --------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------- |
| Mengirim teks / alternatif SMS                      | ✅               | ✅                                                                            |
| Mengirim media (foto, video, berkas, suara)         | ✅               | ✅                                                                            |
| Balasan berutas (`reply_to_guid`)                   | ✅               | ✅ (menyelesaikan [#51892](https://github.com/openclaw/openclaw/issues/51892)) |
| Tapback (`react`)                                   | ✅               | ✅                                                                            |
| Mengedit / membatalkan pengiriman (penerima macOS 13+) | ✅            | ✅                                                                            |
| Mengirim dengan efek layar                          | ✅               | ✅ (menyelesaikan sebagian [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Teks kaya tebal / miring / garis bawah / coret      | ✅               | ✅ (pemformatan rentang bertipe melalui attributedBody)                       |
| Jajak pendapat native Messages (membuat dan memilih) | ❌              | ✅ (`actions.polls`; penerima memerlukan iOS/macOS 26+ untuk perenderan native) |
| Mengganti nama grup / menetapkan ikon grup          | ✅               | ✅                                                                            |
| Menambah / menghapus peserta, meninggalkan grup     | ✅               | ✅                                                                            |
| Tanda terima telah dibaca dan indikator pengetikan  | ✅               | ✅ (bergantung pada pemeriksaan API privat)                                   |
| Penggabungan DM dari pengirim yang sama             | ✅               | ✅ (khusus DM; ikut serta melalui `channels.imessage.coalesceSameSenderDms`)   |
| Pemulihan pesan masuk setelah mulai ulang           | ✅               | ✅ (otomatis: pemutaran ulang `since_rowid` + deduplikasi GUID; jendela lebih luas pada instalasi lokal) |

iMessage memulihkan pesan yang terlewat ketika Gateway tidak aktif: saat dimulai, iMessage memutar ulang dari rowid terakhir yang dikirim melalui `imsg watch.subscribe` `since_rowid`, melakukan deduplikasi berdasarkan GUID, dan batas usia backlog lama mencegah "ledakan backlog" akibat pengosongan Push. Proses ini berjalan melalui koneksi RPC `imsg`, sehingga juga berfungsi untuk penyiapan `cliPath` SSH jarak jauh; penyiapan lokal mendapatkan jendela pemulihan yang lebih luas karena dapat membaca `chat.db`. Lihat [Pemulihan pesan masuk setelah bridge atau Gateway dimulai ulang](/id/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Pemasangan, sesi, dan pengikatan ACP

- **Daftar yang diizinkan dibawa berdasarkan handle.** `channels.imessage.allowFrom` mengenali string `+15555550123` / `user@example.com` yang sama dengan yang digunakan BlueBubbles — salin persis tanpa perubahan.
- **Persetujuan penyimpanan pemasangan tidak ditransfer.** Penyimpanan pemasangan berlaku per kanal dan tidak ada proses yang memigrasikan penyimpanan BlueBubbles lama. Pengirim yang hanya disetujui melalui pemasangan harus memasangkan kembali satu kali di iMessage, atau Anda dapat menambahkan handle mereka ke `allowFrom`.
- **Sesi** tetap dicakup per agen + obrolan. DM digabungkan ke sesi utama agen dengan pengaturan bawaan `session.dmScope=main`; sesi grup tetap terisolasi per `chat_id` (`agent:<agentId>:imessage:group:<chat_id>`). Riwayat percakapan lama dalam kunci sesi BlueBubbles tidak dibawa ke sesi iMessage.
- **Pengikatan ACP** yang merujuk ke `match.channel: "bluebubbles"` harus diubah menjadi `"imessage"`. Bentuk `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle tanpa awalan) tetap identik.

## Tidak ada kanal untuk kembali

Tidak ada runtime BlueBubbles yang didukung untuk digunakan kembali. Jika verifikasi iMessage gagal, atur `channels.imessage.enabled: false`, mulai ulang Gateway, perbaiki penghambat `imsg`, lalu ulangi pengalihan.

Cache balasan disimpan dalam status Plugin SQLite. `openclaw doctor --fix` mengimpor dan mengarsipkan berkas pendamping lama `imessage/reply-cache.jsonl` jika tersedia.

## Terkait

- [Penghapusan BlueBubbles dan jalur iMessage imsg](/id/announcements/bluebubbles-imessage) — pengumuman singkat dan ringkasan untuk operator.
- [iMessage](/id/channels/imessage) — referensi lengkap kanal iMessage, termasuk penyiapan `imsg launch` dan deteksi kemampuan.
- `/channels/bluebubbles` — URL lama yang dialihkan ke panduan migrasi ini.
- [Pemasangan](/id/channels/pairing) — autentikasi DM dan alur pemasangan.
- [Perutean Kanal](/id/channels/channel-routing) — cara Gateway memilih kanal untuk balasan keluar.
