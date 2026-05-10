---
read_when:
    - Merencanakan migrasi dari BlueBubbles ke Plugin iMessage yang dibundel
    - Menerjemahkan kunci konfigurasi BlueBubbles ke padanan iMessage
    - Memverifikasi imsg sebelum mengaktifkan plugin iMessage
summary: Migrasikan konfigurasi BlueBubbles lama ke Plugin iMessage bawaan tanpa kehilangan penyandingan, daftar izin, atau pengikatan grup.
title: Beralih dari BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Plugin `imessage` bawaan kini menjangkau permukaan API privat yang sama seperti BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, pengelolaan grup, lampiran) dengan menjalankan [`steipete/imsg`](https://github.com/steipete/imsg) melalui JSON-RPC. Jika Anda sudah menjalankan Mac dengan `imsg` terpasang, Anda dapat menghapus server BlueBubbles dan membiarkan Plugin berbicara langsung dengan Messages.app.

Dukungan BlueBubbles telah dihapus. OpenClaw mendukung iMessage hanya melalui `imsg`. Panduan ini untuk memigrasikan konfigurasi `channels.bluebubbles` lama ke `channels.imessage`; tidak ada jalur migrasi lain yang didukung.

## Kapan migrasi ini masuk akal

- Anda sudah menjalankan `imsg` pada Mac yang sama (atau yang dapat dijangkau melalui SSH) tempat Messages.app sudah masuk.
- Anda ingin satu komponen bergerak lebih sedikit — tanpa server BlueBubbles terpisah, tanpa endpoint REST untuk diautentikasi, tanpa pengaturan Webhook. Satu biner CLI, bukan server + aplikasi klien + helper.
- Anda memakai [build macOS / `imsg` yang didukung](/id/channels/imessage#requirements-and-permissions-macos) tempat pemeriksaan API privat melaporkan `available: true`.

## Apa yang dilakukan imsg

`imsg` adalah CLI macOS lokal untuk Messages. OpenClaw memulai `imsg rpc` sebagai proses anak dan berbicara JSON-RPC melalui stdin/stdout. Tidak ada server HTTP, URL Webhook, daemon latar belakang, launch agent, atau port yang perlu diekspos.

- Pembacaan berasal dari `~/Library/Messages/chat.db` menggunakan handle SQLite hanya-baca.
- Pesan masuk langsung berasal dari `imsg watch` / `watch.subscribe`, yang mengikuti event sistem file `chat.db` dengan fallback polling.
- Pengiriman menggunakan otomasi Messages.app untuk teks normal dan pengiriman file.
- Tindakan lanjutan menggunakan `imsg launch` untuk menyuntikkan helper `imsg` ke Messages.app. Itulah yang membuka tanda terima baca, indikator mengetik, pengiriman kaya, edit, urung kirim, balasan berutas, tapback, dan pengelolaan grup.
- Build Linux dapat memeriksa salinan `chat.db`, tetapi tidak dapat mengirim, memantau database Mac langsung, atau menjalankan Messages.app. Untuk iMessage OpenClaw, jalankan `imsg` pada Mac yang sudah masuk atau melalui wrapper SSH ke Mac tersebut.

## Sebelum Anda mulai

1. Pasang `imsg` pada Mac yang menjalankan Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Jika `imsg chats` gagal dengan `unable to open database file`, output kosong, atau `authorization denied`, berikan Full Disk Access ke terminal, editor, proses Node, layanan Gateway, atau proses induk SSH yang meluncurkan `imsg`, lalu buka ulang proses induk tersebut.

2. Verifikasi permukaan baca, pantau, kirim, dan RPC sebelum mengubah konfigurasi OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Ganti `42` dengan id chat nyata dari `imsg chats`. Pengiriman memerlukan izin Automation untuk Messages.app. Jika OpenClaw akan berjalan melalui SSH, jalankan perintah ini melalui wrapper SSH atau konteks pengguna yang sama yang akan digunakan OpenClaw.

3. Aktifkan bridge API privat ketika Anda memerlukan tindakan lanjutan:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` mengharuskan SIP dinonaktifkan. Kirim dasar, riwayat, dan pemantauan berfungsi tanpa `imsg launch`; tindakan lanjutan tidak.

4. Verifikasi bridge melalui OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Anda menginginkan `imessage.privateApi.available: true`. Jika melaporkan `false`, perbaiki itu terlebih dahulu — lihat [Deteksi kemampuan](/id/channels/imessage#private-api-actions).

5. Ambil snapshot konfigurasi Anda:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Penerjemahan konfigurasi

iMessage dan BlueBubbles berbagi banyak konfigurasi tingkat channel. Kunci yang berubah sebagian besar adalah transport (server REST vs CLI lokal). Kunci perilaku (`dmPolicy`, `groupPolicy`, `allowFrom`, dll.) mempertahankan makna yang sama.

| BlueBubbles                                                | iMessage terbundel                        | Catatan                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Semantik yang sama.                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.serverUrl`                           | _(dihapus)_                               | Tidak ada server REST — plugin menjalankan `imsg rpc` melalui stdio.                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.password`                            | _(dihapus)_                               | Tidak perlu autentikasi webhook.                                                                                                                                                                                                                                                                                                             |
| _(implisit)_                                               | `channels.imessage.cliPath`               | Jalur ke `imsg` (default `imsg`); gunakan skrip wrapper untuk SSH.                                                                                                                                                                                                                                                                           |
| _(implisit)_                                               | `channels.imessage.dbPath`                | Override opsional untuk `chat.db` Messages.app; terdeteksi otomatis jika dihilangkan.                                                                                                                                                                                                                                                        |
| _(implisit)_                                               | `channels.imessage.remoteHost`            | `host` atau `user@host` — hanya diperlukan ketika `cliPath` adalah wrapper SSH dan Anda menginginkan pengambilan lampiran melalui SCP.                                                                                                                                                                                                       |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Nilai yang sama (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Persetujuan pairing terbawa berdasarkan handle, bukan token.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Nilai yang sama (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Sama.                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Salin ini persis apa adanya, termasuk entri wildcard `groups: { "*": { ... } }` apa pun.** `requireMention`, `tools`, `toolsBySender` per grup ikut terbawa. Dengan `groupPolicy: "allowlist"`, blok `groups` yang kosong atau hilang akan diam-diam membuang setiap pesan grup — lihat "Jebakan registry grup" di bawah.                  |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Default `true`. Dengan plugin terbundel, ini hanya berjalan ketika probe API privat aktif.                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Bentuk yang sama, **sama-sama nonaktif secara default**. Jika lampiran sudah berjalan di BlueBubbles, Anda harus menyetelnya ulang secara eksplisit pada blok iMessage — ini tidak terbawa secara implisit, dan foto/media masuk akan diam-diam dibuang tanpa baris log `Inbound message` sampai Anda melakukannya.                           |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Root lokal; aturan wildcard yang sama.                                                                                                                                                                                                                                                                                                       |
| _(T/A)_                                                    | `channels.imessage.remoteAttachmentRoots` | Hanya digunakan ketika `remoteHost` disetel untuk pengambilan SCP.                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Default 16 MB di iMessage (default BlueBubbles adalah 8 MB). Setel secara eksplisit jika Anda ingin mempertahankan batas yang lebih rendah.                                                                                                                                                                                                  |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Default 4000 pada keduanya.                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Keikutsertaan opsional yang sama. Hanya DM — chat grup tetap menggunakan dispatch instan per pesan di kedua kanal. Memperlebar debounce masuk default menjadi 2500 ms ketika diaktifkan tanpa `messages.inbound.byChannel.imessage` eksplisit. Lihat [dokumentasi iMessage § Menggabungkan DM kirim-terpisah](/id/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(T/A)_                                   | iMessage sudah membaca nama tampilan pengirim dari `chat.db`.                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Toggle per aksi: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                            |

Konfigurasi multi-akun (`channels.bluebubbles.accounts.*`) diterjemahkan satu-ke-satu ke `channels.imessage.accounts.*`.

## Jebakan registry grup

Plugin iMessage terbundel menjalankan **dua** gerbang allowlist grup terpisah secara berurutan. Keduanya harus lolos agar pesan grup mencapai agen:

1. **Allowlist pengirim / target chat** (`channels.imessage.groupAllowFrom`) — diperiksa oleh `isAllowedIMessageSender`. Mencocokkan pesan masuk berdasarkan handle pengirim, `chat_guid`, `chat_identifier`, atau `chat_id`. Bentuknya sama seperti BlueBubbles.
2. **Registry grup** (`channels.imessage.groups`) — diperiksa oleh `resolveChannelGroupPolicy` dari `inbound-processing.ts:199`. Dengan `groupPolicy: "allowlist"`, gerbang ini memerlukan salah satu dari:
   - entri wildcard `groups: { "*": { ... } }` (menyetel `allowAll = true`), atau
   - entri per-`chat_id` eksplisit di bawah `groups`.

Jika gerbang 1 lolos tetapi gerbang 2 gagal, pesan akan dibuang. Plugin memancarkan dua sinyal tingkat `warn` sehingga ini tidak lagi diam pada tingkat log default:

- `warn` startup satu kali per akun ketika `groupPolicy: "allowlist"` disetel tetapi `channels.imessage.groups` kosong (tidak ada wildcard `"*"`, tidak ada entri per-`chat_id`) — dipicu sebelum pesan apa pun masuk.
- `warn` satu kali per-`chat_id` saat pertama kali grup tertentu dibuang pada runtime, menyebutkan chat_id dan kunci persis yang perlu ditambahkan ke `groups` untuk mengizinkannya.

DM tetap berfungsi karena mengambil jalur kode yang berbeda.

Ini adalah mode kegagalan migrasi BlueBubbles → iMessage-terbundel yang paling umum: operator menyalin `groupAllowFrom` dan `groupPolicy` tetapi melewatkan blok `groups`, karena `groups: { "*": { "requireMention": true } }` milik BlueBubbles tampak seperti pengaturan mention yang tidak terkait. Sebenarnya, itu penting untuk gerbang registry.

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

`requireMention: true` di bawah `*` tidak bermasalah saat tidak ada pola penyebutan yang dikonfigurasi: runtime menetapkan `canDetectMention = false` dan melewati pengguguran penyebutan di `inbound-processing.ts:512`. Dengan pola penyebutan yang dikonfigurasi (`agents.list[].groupChat.mentionPatterns`), ini berfungsi seperti yang diharapkan.

Jika log Gateway menampilkan `imessage: dropping group message from chat_id=<id>` atau baris startup `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, gerbang 2 yang menggugurkan — tambahkan blok `groups`.

## Langkah demi langkah

1. Tambahkan blok iMessage di samping blok BlueBubbles yang ada. Simpan blok lama hanya sebagai sumber salinan sampai jalur baru diverifikasi:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
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

2. **Probe dry-run** — jalankan Gateway dan pastikan iMessage melaporkan status sehat:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   Karena `imessage.enabled` masih `false`, belum ada traffic iMessage masuk yang dirutekan — tetapi `--probe` menguji bridge sehingga Anda dapat menemukan masalah izin/instalasi sebelum cutover.

3. **Cut over.** Hapus konfigurasi BlueBubbles dan aktifkan iMessage dalam satu edit konfigurasi:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Mulai ulang Gateway. Traffic iMessage masuk sekarang mengalir melalui Plugin bawaan.

4. **Verifikasi DM.** Kirim pesan langsung ke agen; pastikan balasannya masuk.

5. **Verifikasi grup secara terpisah.** DM dan grup menggunakan jalur kode yang berbeda — keberhasilan DM tidak membuktikan bahwa grup sudah dirutekan. Kirim pesan ke agen dalam obrolan grup yang sudah dipasangkan dan pastikan balasannya masuk. Jika grup menjadi senyap (tidak ada balasan agen, tidak ada error), periksa log Gateway untuk `imessage: dropping group message from chat_id=<id>` atau baris startup `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — keduanya muncul pada level log default. Jika salah satunya muncul, blok `groups` Anda hilang atau kosong — lihat "Jebakan registry grup" di atas.

6. **Verifikasi permukaan aksi** — dari DM yang sudah dipasangkan, minta agen untuk memberi reaksi, mengedit, membatalkan pengiriman, membalas, mengirim foto, dan (dalam grup) mengganti nama grup / menambah atau menghapus peserta. Setiap aksi seharusnya masuk secara native di Messages.app. Jika ada yang melempar "iMessage `<action>` requires the imsg private API bridge", jalankan `imsg launch` lagi dan segarkan `channels status --probe`.

7. **Hapus server dan konfigurasi BlueBubbles** setelah DM, grup, dan aksi iMessage terverifikasi. OpenClaw tidak akan menggunakan `channels.bluebubbles`.

## Sekilas paritas aksi

| Aksi                                                       | BlueBubbles legacy                  | iMessage bawaan                                                                                                         |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Kirim teks / fallback SMS                                  | ✅                                  | ✅                                                                                                                      |
| Kirim media (foto, video, file, suara)                     | ✅                                  | ✅                                                                                                                      |
| Balasan berutas (`reply_to_guid`)                          | ✅                                  | ✅ (menutup [#51892](https://github.com/openclaw/openclaw/issues/51892))                                                |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Edit / batalkan pengiriman (penerima macOS 13+)            | ✅                                  | ✅                                                                                                                      |
| Kirim dengan efek layar                                    | ✅                                  | ✅ (menutup sebagian [#9394](https://github.com/openclaw/openclaw/issues/9394))                                         |
| Teks kaya tebal / miring / garis bawah / coret             | ✅                                  | ✅ (pemformatan typed-run melalui attributedBody)                                                                       |
| Ganti nama grup / atur ikon grup                           | ✅                                  | ✅                                                                                                                      |
| Tambah / hapus peserta, tinggalkan grup                    | ✅                                  | ✅                                                                                                                      |
| Tanda dibaca dan indikator mengetik                        | ✅                                  | ✅ (dibatasi oleh probe API privat)                                                                                     |
| Penggabungan DM pengirim yang sama                         | ✅                                  | ✅ (khusus DM; ikut serta melalui `channels.imessage.coalesceSameSenderDms`)                                            |
| Catchup pesan masuk yang diterima saat Gateway mati        | ✅ (pemutaran ulang Webhook + pengambilan riwayat) | ✅ (ikut serta melalui `channels.imessage.catchup.enabled`; menutup [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

Catchup iMessage kini tersedia sebagai fitur ikut-serta pada Plugin bawaan. Saat startup Gateway, jika `channels.imessage.catchup.enabled` adalah `true`, Gateway menjalankan satu pass `chats.list` + `messages.history` per obrolan terhadap klien JSON-RPC yang sama yang digunakan oleh `imsg watch`, memutar ulang setiap baris masuk yang terlewat melalui jalur dispatch live (allowlist, kebijakan grup, debouncer, cache echo), dan menyimpan cursor per akun sehingga startup berikutnya melanjutkan dari posisi terakhir. Lihat [Mengejar ketertinggalan setelah downtime Gateway](/id/channels/imessage#catching-up-after-gateway-downtime) untuk penyetelan.

## Pairing, sesi, dan binding ACP

- **Persetujuan Pairing** berpindah berdasarkan handle. Anda tidak perlu menyetujui ulang pengirim yang sudah dikenal — `channels.imessage.allowFrom` mengenali string `+15555550123` / `user@example.com` yang sama dengan yang digunakan BlueBubbles.
- **Sesi** tetap dibatasi per agen + obrolan. DM digabungkan ke sesi utama agen di bawah `session.dmScope=main` default; sesi grup tetap terisolasi per `chat_id`. Kunci sesi berbeda (`agent:<id>:imessage:group:<chat_id>` vs padanan BlueBubbles) — riwayat percakapan lama di bawah kunci sesi BlueBubbles tidak terbawa ke sesi iMessage.
- **Binding ACP** yang mereferensikan `match.channel: "bluebubbles"` perlu diperbarui menjadi `"imessage"`. Bentuk `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, handle polos) identik.

## Tidak ada channel rollback

Tidak ada runtime BlueBubbles yang didukung untuk kembali. Jika verifikasi iMessage gagal, atur `channels.imessage.enabled: false`, mulai ulang Gateway, perbaiki pemblokir `imsg`, dan coba lagi cutover.

Cache balasan berada di `~/.openclaw/state/imessage/reply-cache.jsonl` (mode `0600`, direktori induk `0700`). Aman untuk dihapus jika Anda menginginkan awal yang bersih.

## Terkait

- [iMessage](/id/channels/imessage) — referensi lengkap channel iMessage, termasuk penyiapan `imsg launch` dan deteksi kapabilitas.
- `/channels/bluebubbles` — URL legacy yang dialihkan ke panduan migrasi ini.
- [Pairing](/id/channels/pairing) — autentikasi DM dan alur Pairing.
- [Perutean Channel](/id/channels/channel-routing) — cara Gateway memilih channel untuk balasan keluar.
