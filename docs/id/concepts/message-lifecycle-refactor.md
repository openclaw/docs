---
read_when:
    - Memfaktorkan ulang perilaku pengiriman atau penerimaan channel
    - Mengubah pesan masuk channel, pengiriman balasan, antrean keluar, streaming pratinjau, atau API pesan SDK plugin
    - Merancang plugin saluran baru yang memerlukan pengiriman persisten, tanda terima, pratinjau, pengeditan, atau percobaan ulang
summary: 'Status siklus hidup penerimaan/pengiriman pesan yang persisten: apa yang telah dirilis, apa yang berubah dari desain awal, dan apa yang masih belum terselesaikan'
title: Refaktor siklus hidup pesan
x-i18n:
    generated_at: "2026-07-20T03:49:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d21eda70b8be0de78677f4ff6d7547317112731d9e86a5bef58eac0268899818
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Halaman ini berasal dari proposal desain yang berorientasi ke masa depan. Inti
desain tersebut sejak itu telah dirilis dalam `src/channels/message/*` dan subjalur publik
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Untuk API
saat ini, gunakan [API keluar channel](/id/plugins/sdk-channel-outbound) dan
[API masuk channel](/id/plugins/sdk-channel-inbound). Halaman ini melacak apa yang
telah dirilis, bagian implementasi yang menyimpang dari sketsa awal, dan hal-hal yang
masih terbuka.
</Note>

## Mengapa refaktor ini dilakukan

Tumpukan channel berkembang dari beberapa perbaikan lokal: helper masuk terpisah untuk setiap
tingkat kematangan (`runtime.channel.inbound.run` untuk adaptor sederhana,
`runtime.channel.inbound.runPreparedReply` untuk adaptor kaya fitur), helper pengiriman balasan
lama (`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
streaming pratinjau khusus channel, dan durabilitas pengiriman akhir yang ditambahkan
ke jalur payload balasan yang sudah ada. Bentuk tersebut menghasilkan terlalu banyak konsep publik dan
terlalu banyak tempat tempat semantik pengiriman dapat menyimpang.

Celah keandalan yang memaksa desain ulang:

```text
Pembaruan polling Telegram telah diakui
  -> teks akhir asisten tersedia
  -> proses dimulai ulang sebelum sendMessage berhasil
  -> respons akhir hilang
```

Invarian target: setelah core memutuskan bahwa pesan keluar yang terlihat harus ada,
intensi pengiriman harus dibuat tahan lama sebelum panggilan platform dicoba, dan
tanda terima platform harus dicatat setelah berhasil. Hal ini menyediakan pemulihan
setidaknya sekali secara default. Perilaku tepat sekali hanya tersedia jika adaptor membuktikan
idempotensi native atau merekonsiliasi upaya dengan hasil tidak diketahui setelah pengiriman terhadap
status platform sebelum pemutaran ulang.

## Yang telah dirilis

Domain internal berada di `src/channels/message/*`:

| File                        | Tanggung jawab                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Kontrak tipe adaptor, konteks pengiriman, tanda terima, dan intensi tahan lama                                     |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — konteks pengiriman tahan lama                        |
| `receive.ts`                | `createMessageReceiveContext` — mesin status kebijakan pengakuan masuk                                            |
| `live.ts`                   | Status pratinjau langsung dan logika finalisasi di tempat atau fallback                                           |
| `state.ts`                  | `classifyDurableSendRecoveryState` — klasifikasi pemulihan setelah interupsi                                       |
| `receipt.ts`                | Menormalisasi hasil pengiriman platform menjadi `MessageReceipt`                                                   |
| `capabilities.ts`           | Menurunkan kapabilitas final tahan lama yang diperlukan dari payload                                              |
| `contracts.ts`              | Verifikasi bukti kontrak untuk kapabilitas adaptor yang dideklarasikan                                             |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                      |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — membungkus fungsi lama `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue` — antrean peristiwa masuk tahan lama                                                |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — jurnal terima/tertunda/selesai/lepas untuk deduplikasi masuk                    |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` dan pembungkus dengan nama lama                                                     |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, helper prefiks balasan dan callback pengetikan                                     |

Permukaan publik: `openclaw/plugin-sdk/channel-outbound` (helper pengiriman/tanda terima/tahan lama/langsung/pipeline balasan)
dan `openclaw/plugin-sdk/channel-inbound` (konteks masuk, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Lihat halaman tersebut untuk contoh adaptor, nama tipe
saat ini, dan catatan migrasi — halaman tersebut merupakan sumber kebenaran untuk bentuk
API, bukan sketsa di bawah ini.

### Konteks pengiriman

`withDurableMessageSendContext` menyediakan langkah `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit`, dan `fail` kepada kode channel seputar satu pesan
keluar. `sendDurableMessageBatch` adalah pembungkus untuk kasus umum: render, kirim,
lalu catat saat `sent`/`suppressed` atau nyatakan gagal saat terjadi kesalahan.

`sendDurableMessageBatch` mengembalikan satu hasil terdiskriminasi:

| Status           | Arti                                                                             |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | Setidaknya satu pesan platform yang terlihat telah dikirimkan                     |
| `suppressed`     | Tidak ada pesan platform yang boleh dianggap hilang (dibatalkan hook, uji kering, dll.) |
| `partial_failed` | Setidaknya satu pesan terkirim sebelum payload atau efek samping berikutnya gagal |
| `failed`         | Tidak ada tanda terima platform yang dihasilkan                                   |

Durabilitas adalah salah satu dari `required`, `best_effort`, atau `disabled`
(`MessageDurabilityPolicy` dalam `src/channels/message/types.ts`). `required`
gagal secara tertutup ketika intensi tahan lama tidak dapat ditulis; `best_effort` melanjutkan
ke pengiriman langsung ketika persistensi tidak tersedia; `disabled` mempertahankan
perilaku pengiriman langsung sebelum refaktor. Helper kompatibilitas lama menggunakan
`disabled` secara default dan tidak menyimpulkan `required` hanya karena suatu channel memiliki adaptor
keluar generik.

Batas yang tetap berbahaya: setelah panggilan platform berhasil dan sebelum
tanda terima dicatat. Jika proses mati pada saat itu, core tidak dapat mengetahui apakah
pesan platform tersedia kecuali adaptor mendeklarasikan `reconcileUnknownSend`.
Hook tersebut mengklasifikasikan pengiriman yang terinterupsi sebagai `sent`, `not_sent`, atau
`unresolved`; hanya `not_sent` yang mengizinkan pemutaran ulang. Channel tanpa rekonsiliasi
kembali ke status `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) dan dapat memilih pemutaran ulang
setidaknya sekali hanya jika duplikasi pesan yang terlihat merupakan kompromi yang dapat diterima dan terdokumentasi
untuk channel tersebut.

### Konteks penerimaan

`createMessageReceiveContext` melacak status ack/nack per peristiwa masuk dengan
`ack()` yang idempoten dan `nack(error)` yang eksplisit. Kebijakan ack
(`ChannelMessageReceiveAckPolicy`) adalah salah satu dari:

| Kebijakan              | Melakukan ack ketika                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | Core telah mempersistensikan metadata masuk yang cukup untuk mendeduplikasi/merutekan pengiriman ulang |
| `after_agent_dispatch` | Proses agen telah dikirim                                                                     |
| `after_durable_send`   | Pengiriman keluar tahan lama untuk giliran ini telah dicatat                                  |
| `manual`               | Pemanggil mengontrol waktu ack secara eksplisit (default untuk adaptor yang tidak mendeklarasikan kebijakan) |

Polling Telegram menggunakan ini untuk mempersistensikan watermark pembaruan yang selesai dengan aman
(`safeCompletedUpdateId` dalam `extensions/telegram/src/bot-update-tracker.ts`):
grammY tetap mengamati setiap pembaruan saat memasuki rantai middleware, tetapi
OpenClaw hanya memajukan watermark mulai ulang yang dipersistensikan melewati pembaruan yang
selesai dikirim, sehingga pembaruan yang gagal atau masih tertunda diputar ulang setelah mulai ulang.
Offset `getUpdates` hulu Telegram tetap dimiliki oleh grammY; sumber polling
yang sepenuhnya tahan lama dan mengontrol pengiriman ulang tingkat platform di luar
watermark ini belum dibuat (lihat Pertanyaan terbuka).

### Pratinjau langsung

`src/channels/message/live.ts` memodelkan pratinjau/edit/finalisasi sebagai satu siklus hidup:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled`, dan
`deliverFinalizableLivePreviewAdapter` (membuat edit akhir dari draf, menerapkannya,
dan melakukan fallback ke pengiriman normal ketika edit tidak mungkin dilakukan atau gagal).
`LiveMessageState.phase` adalah `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` menentukan apakah pratinjau dapat menjadi pesan
akhir melalui edit alih-alih pengiriman baru.

### Tanda terima tahan lama

`MessageReceipt` (`src/channels/message/types.ts`) menormalisasi satu atau beberapa
id pesan platform dari satu pengiriman logis menjadi `platformMessageIds` beserta
`parts` per bagian (jenis, indeks, id utas, id balasan). Id utama dipertahankan
untuk pengutasan dan edit berikutnya. Inilah yang membuat pengiriman multi-bagian (teks
beserta media, teks yang dipecah, fallback kartu) dapat diputar ulang dan dideduplikasi setelah
mulai ulang.

### Pengurangan SDK publik

Refaktor tersebut menyerap atau menghentikan penggunaan: `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, helper `reply-payload` yang diekspos sebagai
API publik, `inbound-reply-dispatch`, `channel-reply-pipeline`, dan sebagian besar penggunaan publik
fasad keluar lama. `src/plugin-sdk/channel-message.ts` kini menjadi barrel ekspor ulang
`@deprecated` yang mengarah ke `channel-outbound` /
`channel-inbound`; alias runtime `channel.turn` telah dihapus dan halaman dokumentasi
`/plugins/sdk-channel-turn` lama dialihkan ke
[API masuk channel](/id/plugins/sdk-channel-inbound). Kode plugin baru harus
menargetkan `channel-outbound` dan `channel-inbound` secara langsung.

## Bagian implementasi yang menyimpang dari desain awal

Sketsa desain di bawah ini tidak pernah dirilis persis seperti yang dijelaskan. Catatan dipertahankan demi
akurasi historis; jangan perlakukan nama tipe ini sebagai API saat ini.

- **Tidak ada `MessageOrigin` / `shouldDropOpenClawEcho`.** Rencana awal mengusulkan
  tag asal `source: "openclaw"` pada pesan kegagalan Gateway beserta
  predikat bersama yang menghapus gema yang dibuat bot dan diberi tag di ruang bersama
  sebelum otorisasi `allowBots`. Tipe dan predikat tersebut tidak ada dalam
  basis kode. `allowBots` sendiri merupakan kunci konfigurasi per channel yang nyata (Slack,
  Discord, Google Chat, dan lainnya), tetapi mekanisme pemberian tag asal yang
  dimaksudkan untuk melindunginya tidak pernah dibuat. Penekanan gema kegagalan Gateway di
  ruang yang mendukung bot tetap menjadi celah terbuka, bukan jaminan yang telah dirilis.
- **Tidak ada namespace `core.messages.receive/send/live/state` terpadu.** Fungsi yang
  dirilis berada langsung di `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`), bukan
  di balik fasad `core.messages.*`.
- **Tidak ada tipe pesan ternormalisasi generik `ChannelMessage` / `MessageTarget` / `MessageRelation`.**
  Core masih meneruskan payload balasan konkret
  (`ReplyPayload`) dan konteks khusus channel melalui adaptor pengiriman,
  bukan satu bentuk pesan netral-platform dengan relasi `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **Nama kebijakan ack berbeda dari sketsa.** Yang dirilis:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  Sketsa awal menggunakan `immediate | after-record | after-durable-send |
manual` dengan bidang alasan batas waktu webhook; bentuk tersebut tidak dibuat.
- **Kunci kapabilitas `DurableFinalDeliveryRequirementMap` menggantikan objek
  `MessageCapabilities` yang digambarkan dalam sketsa.** Kapabilitas berupa flag boolean datar (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) yang diverifikasi melalui `verifyDurableFinalCapabilityProofs`, bukan
  struktur bertingkat bergaya `text.chunking` / `attachments.voice`.

## Risiko migrasi konkret (masih relevan)

Efek samping khusus channel ini sudah ada sebelum refaktor dan harus tetap
berfungsi melalui jalur pengiriman baru. Efek tersebut bukan hipotetis: masing-masing
telah diimplementasikan dan sangat penting saat ini.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): monitor mencatat pesan terkirim dalam cache
  gema setelah pengiriman berhasil. Pengiriman final yang tahan lama tetap harus mengisi
  cache tersebut, atau OpenClaw dapat menyerap kembali balasannya sendiri sebagai pesan pengguna masuk.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): menambahkan tanda tangan model opsional
  dan mencatat utas yang diikuti setelah balasan grup. Pengiriman
  tahan lama tidak boleh melewati efek tersebut.
- **Discord dan dispatcher lain yang telah disiapkan** sudah menangani pengiriman langsung dan
  perilaku pratinjau. Sebuah kanal belum tahan lama secara menyeluruh hingga dispatcher
  yang telah disiapkan secara eksplisit merutekan hasil final melalui konteks pengiriman; jangan menganggap
  adaptor generik saja sudah mencakupnya.
- **Pengiriman fallback senyap Telegram** harus mengirimkan seluruh larik payload
  yang diproyeksikan, bukan hanya payload pertama, setelah proyeksi
  pemotongan/fallback.
- **LINE, Zalo, Nostr**, dan jalur pembantu serupa dapat memiliki penanganan token
  balasan, proksi media, cache pesan terkirim, atau target khusus callback.
  Jalur tersebut tetap menggunakan pengiriman yang dikelola kanal hingga semantik itu direpresentasikan oleh
  adaptor pengiriman dan dicakup oleh pengujian.
- **Pembantu DM langsung** dapat memiliki callback balasan yang merupakan satu-satunya
  target transportasi yang benar. Pengiriman keluar generik tidak boleh menebak target dari kolom
  platform mentah dan melewati callback tersebut.

## Klasifikasi kegagalan

Adaptor mengklasifikasikan kegagalan transportasi ke dalam kategori tertutup bergaya
`DeliveryFailureKind` (sementara, batas laju, autentikasi, izin, tidak ditemukan, payload
tidak valid, konflik, dibatalkan, tidak diketahui). Kebijakan inti:

- Coba lagi kegagalan sementara dan batas laju.
- Jangan mencoba lagi kegagalan payload tidak valid kecuali tersedia fallback rendering.
- Jangan mencoba lagi kegagalan autentikasi atau izin hingga konfigurasi berubah.
- Jika tidak ditemukan, izinkan finalisasi langsung beralih dari pengeditan ke pengiriman baru saat
  kanal menyatakan bahwa tindakan tersebut aman.
- Jika terjadi konflik, gunakan status tanda terima/idempotensi untuk menentukan apakah pesan
  sudah ada.
- Setiap galat setelah panggilan platform mungkin telah berhasil tetapi sebelum commit tanda terima
  menjadi `unknown_after_send`, kecuali adaptor membuktikan bahwa operasi platform
  tidak terjadi.

## Pertanyaan terbuka

- Apakah Telegram pada akhirnya harus mengganti runner polling grammY (`1.43.0`)
  dengan sumber polling yang sepenuhnya tahan lama dan mengendalikan pengiriman ulang tingkat
  platform, bukan hanya watermark mulai ulang tersimpan milik OpenClaw
  (`safeCompletedUpdateId`).
- Apakah status pratinjau langsung harus berada dalam rekaman yang sama dengan intent pengiriman
  final atau dalam penyimpanan status langsung pendamping.
- Apakah penekanan gema akibat kegagalan Gateway di ruang bersama yang mengaktifkan bot memerlukan
  mekanisme penandaan asal yang awalnya direncanakan, kontrak per kanal
  yang lebih sederhana, atau berada di luar cakupan.
- Kanal mana yang memiliki dukungan asal/metadata native untuk penekanan gema
  lintas bot dan mana yang memerlukan registri pengiriman keluar yang tersimpan.

## Terkait

- [Pesan](/id/concepts/messages)
- [Streaming dan pemotongan](/id/concepts/streaming)
- [Draf progres](/id/concepts/progress-drafts)
- [Kebijakan percobaan ulang](/id/concepts/retry)
- [API pengiriman keluar kanal](/id/plugins/sdk-channel-outbound)
- [API pesan masuk kanal](/id/plugins/sdk-channel-inbound)
