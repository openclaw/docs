---
read_when:
    - Memfaktorkan ulang perilaku pengiriman atau penerimaan kanal
    - Mengubah pesan masuk channel, pengiriman balasan, antrean pesan keluar, streaming pratinjau, atau API pesan SDK plugin
    - Merancang plugin saluran baru yang memerlukan pengiriman persisten, tanda terima, pratinjau, pengeditan, atau percobaan ulang
summary: 'Status siklus hidup penerimaan/pengiriman pesan yang persisten: apa yang telah dirilis, apa yang berubah dari desain awal, dan apa yang masih belum terselesaikan'
title: Refaktor siklus hidup pesan
x-i18n:
    generated_at: "2026-07-12T14:10:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Halaman ini awalnya merupakan proposal desain yang berorientasi ke masa depan. Inti
desain tersebut sejak itu telah dirilis dalam `src/channels/message/*` dan subjalur publik
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Untuk API
saat ini, gunakan [API outbound kanal](/id/plugins/sdk-channel-outbound) dan
[API inbound kanal](/id/plugins/sdk-channel-inbound). Halaman ini melacak apa yang
telah dirilis, bagian implementasi yang menyimpang dari rancangan awal, dan hal yang
masih terbuka.
</Note>

## Mengapa pemfaktoran ulang ini dilakukan

Tumpukan kanal berkembang dari beberapa perbaikan lokal: pembantu inbound terpisah untuk setiap
tingkat kematangan (`runtime.channel.inbound.run` untuk adaptor sederhana,
`runtime.channel.inbound.runPreparedReply` untuk adaptor kaya fitur), pembantu pengiriman balasan
lama (`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
streaming pratinjau khusus kanal, serta durabilitas pengiriman akhir yang ditambahkan
ke jalur payload balasan yang sudah ada. Bentuk tersebut menghasilkan terlalu banyak konsep publik dan
terlalu banyak tempat yang memungkinkan semantik pengiriman menyimpang.

Celah keandalan yang memaksa desain ulang:

```text
Pembaruan polling Telegram dikonfirmasi
  -> teks akhir asisten tersedia
  -> proses dimulai ulang sebelum sendMessage berhasil
  -> respons akhir hilang
```

Invarian sasaran: setelah inti memutuskan bahwa pesan outbound yang terlihat harus tersedia,
intensi pengiriman harus dibuat tahan lama sebelum pemanggilan platform dicoba, dan
tanda terima platform harus dicatat setelah berhasil. Hal ini memberikan pemulihan
setidaknya satu kali secara bawaan. Perilaku tepat satu kali hanya tersedia jika adaptor membuktikan
idempotensi native atau merekonsiliasi percobaan dengan status tidak diketahui setelah pengiriman terhadap
status platform sebelum pemutaran ulang.

## Apa yang telah dirilis

Domain internal berada di `src/channels/message/*`:

| Berkas                      | Tanggung jawab                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Kontrak tipe adaptor, konteks pengiriman, tanda terima, dan intensi tahan lama                                      |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — konteks pengiriman tahan lama                         |
| `receive.ts`                | `createMessageReceiveContext` — mesin status kebijakan konfirmasi inbound                                          |
| `live.ts`                   | Status pratinjau langsung dan logika finalisasi di tempat atau beralih ke cadangan                                  |
| `state.ts`                  | `classifyDurableSendRecoveryState` — klasifikasi pemulihan setelah interupsi                                        |
| `receipt.ts`                | Menormalkan hasil pengiriman platform menjadi `MessageReceipt`                                                      |
| `capabilities.ts`           | Menurunkan kapabilitas akhir tahan lama yang diperlukan dari suatu payload                                          |
| `contracts.ts`              | Verifikasi bukti kontrak untuk kapabilitas adaptor yang dideklarasikan                                              |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                       |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — membungkus fungsi lama `sendText`/`sendMedia`/`sendPayload`/`sendPoll`  |
| `ingress-queue.ts`          | `createChannelIngressQueue` — antrean peristiwa inbound tahan lama                                                  |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — jurnal terima/tunda/selesai/lepas untuk deduplikasi inbound                  |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` dan pembungkus dengan nama lama                                                       |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, pembantu prefiks balasan dan callback pengetikan                                      |

Permukaan publik: `openclaw/plugin-sdk/channel-outbound` (pembantu pengiriman/tanda terima/tahan lama/langsung/alur balasan)
dan `openclaw/plugin-sdk/channel-inbound` (konteks inbound, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Lihat halaman tersebut untuk contoh adaptor, nama tipe
saat ini, dan catatan migrasi — halaman tersebut merupakan sumber kebenaran untuk bentuk
API, bukan rancangan di bawah ini.

### Konteks pengiriman

`withDurableMessageSendContext` menyediakan langkah `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit`, dan `fail` bagi kode kanal di seputar satu pesan
outbound. `sendDurableMessageBatch` adalah pembungkus untuk kasus umum: render, kirim,
kemudian catat pada `sent`/`suppressed` atau gagal ketika terjadi kesalahan.

`sendDurableMessageBatch` mengembalikan salah satu hasil terdiskriminasi:

| Status           | Arti                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `sent`           | Setidaknya satu pesan platform yang terlihat telah dikirimkan                              |
| `suppressed`     | Tidak ada pesan platform yang harus dianggap hilang (dibatalkan hook, uji coba, dll.)      |
| `partial_failed` | Setidaknya satu pesan telah dikirim sebelum payload atau efek samping berikutnya gagal     |
| `failed`         | Tidak ada tanda terima platform yang dihasilkan                                            |

Durabilitas merupakan salah satu dari `required`, `best_effort`, atau `disabled`
(`MessageDurabilityPolicy` dalam `src/channels/message/types.ts`). `required`
gagal secara tertutup ketika intensi tahan lama tidak dapat ditulis; `best_effort` beralih
ke pengiriman langsung ketika persistensi tidak tersedia; `disabled` mempertahankan
perilaku pengiriman langsung sebelum pemfaktoran ulang. Pembantu kompatibilitas lama secara bawaan menggunakan
`disabled` dan tidak menyimpulkan `required` hanya karena suatu kanal memiliki adaptor
outbound generik.

Batas yang tetap berbahaya: setelah pemanggilan platform berhasil dan sebelum
tanda terima dicatat. Jika proses berhenti di sana, inti tidak dapat mengetahui apakah
pesan platform tersedia kecuali adaptor mendeklarasikan `reconcileUnknownSend`.
Hook tersebut mengklasifikasikan pengiriman yang terinterupsi sebagai `sent`, `not_sent`, atau
`unresolved`; hanya `not_sent` yang mengizinkan pemutaran ulang. Kanal tanpa rekonsiliasi
beralih ke status `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) dan hanya dapat memilih pemutaran ulang
setidaknya satu kali jika pesan terlihat yang duplikat merupakan kompromi yang dapat diterima dan
terdokumentasi untuk kanal tersebut.

### Konteks penerimaan

`createMessageReceiveContext` melacak status konfirmasi/penolakan per peristiwa inbound dengan
`ack()` yang idempoten dan `nack(error)` yang eksplisit. Kebijakan konfirmasi
(`ChannelMessageReceiveAckPolicy`) merupakan salah satu dari:

| Kebijakan              | Mengonfirmasi ketika                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `after_receive_record` | Inti telah mempersistenkan metadata inbound yang cukup untuk mendeduplikasi/merutekan pengiriman ulang |
| `after_agent_dispatch` | Proses agen telah dikirim                                                                        |
| `after_durable_send`   | Pengiriman outbound tahan lama untuk giliran ini telah dicatat                                   |
| `manual`               | Pemanggil mengontrol waktu konfirmasi secara eksplisit (bawaan untuk adaptor yang tidak mendeklarasikan kebijakan) |

Polling Telegram menggunakan ini untuk mempersistenkan penanda batas pembaruan yang selesai dengan aman
(`safeCompletedUpdateId` dalam `extensions/telegram/src/bot-update-tracker.ts`):
grammY tetap mengamati setiap pembaruan saat memasuki rantai middleware, tetapi
OpenClaw hanya memajukan penanda batas mulai ulang yang dipersistenkan melewati pembaruan yang
telah menyelesaikan pengiriman, sehingga pembaruan yang gagal atau masih tertunda diputar ulang setelah mulai ulang.
Offset upstream `getUpdates` Telegram tetap dikelola oleh grammY; sumber polling
yang sepenuhnya tahan lama dan mengontrol pengiriman ulang tingkat platform di luar
penanda batas ini belum dibuat (lihat Pertanyaan terbuka).

### Pratinjau langsung

`src/channels/message/live.ts` memodelkan pratinjau/edit/finalisasi sebagai satu siklus hidup:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled`, dan
`deliverFinalizableLivePreviewAdapter` (membuat edit akhir dari draf, menerapkannya,
dan beralih ke pengiriman normal ketika edit tidak memungkinkan atau gagal).
`LiveMessageState.phase` adalah `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` menentukan apakah pratinjau dapat menjadi pesan akhir
melalui edit alih-alih pengiriman baru.

### Tanda terima tahan lama

`MessageReceipt` (`src/channels/message/types.ts`) menormalkan satu atau beberapa
ID pesan platform dari satu pengiriman logis menjadi `platformMessageIds` beserta
`parts` per bagian (jenis, indeks, ID utas, ID balasan). ID utama dipertahankan
untuk pengelompokan dalam utas dan pengeditan berikutnya. Hal inilah yang membuat pengiriman multibagian (teks
beserta media, teks yang dipecah, penggunaan cadangan kartu) dapat diputar ulang dan dideduplikasi setelah
mulai ulang.

### Pengurangan SDK publik

Pemfaktoran ulang menyerap atau menghentikan: pembantu `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking`, dan `reply-payload` yang diekspos sebagai API
publik, `inbound-reply-dispatch`, `channel-reply-pipeline`, serta sebagian besar penggunaan publik
`outbound-runtime`. `src/plugin-sdk/channel-message.ts` kini merupakan barel ekspor ulang
`@deprecated` yang mengarah ke `channel-outbound` /
`channel-inbound`; alias runtime `channel.turn` telah dihapus dan halaman dokumentasi lama
`/plugins/sdk-channel-turn` mengalihkan ke
[API inbound kanal](/id/plugins/sdk-channel-inbound). Kode plugin baru harus
menargetkan `channel-outbound` dan `channel-inbound` secara langsung.

## Bagian implementasi yang menyimpang dari desain awal

Rancangan desain di bawah ini tidak pernah dirilis persis seperti yang dijelaskan. Catatan dipertahankan demi
akurasi historis; jangan perlakukan nama tipe ini sebagai API saat ini.

- **Tidak ada `MessageOrigin` / `shouldDropOpenClawEcho`.** Rencana awal mengharuskan
  adanya tag asal `source: "openclaw"` pada pesan kegagalan Gateway beserta
  predikat bersama yang menghapus gema buatan bot bertag di ruang bersama
  sebelum otorisasi `allowBots`. Tipe dan predikat tersebut tidak tersedia dalam
  basis kode. `allowBots` sendiri merupakan kunci konfigurasi nyata per kanal (Slack,
  Discord, Google Chat, dan lainnya), tetapi mekanisme pemberian tag asal yang
  dimaksudkan untuk melindunginya tidak pernah dibuat. Penekanan gema kegagalan Gateway di
  ruang yang mengaktifkan bot tetap menjadi celah terbuka, bukan jaminan yang telah dirilis.
- **Tidak ada namespace terpadu `core.messages.receive/send/live/state`.** Fungsi yang
  telah dirilis berada langsung dalam `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`), bukan
  di balik fasad `core.messages.*`.
- **Tidak ada tipe pesan generik `ChannelMessage` / `MessageTarget` / `MessageRelation`
  yang dinormalkan.** Inti masih meneruskan payload balasan konkret
  (`ReplyPayload`) dan konteks khusus kanal melalui adaptor pengiriman,
  bukan satu bentuk pesan netral-platform dengan relasi `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **Nama kebijakan konfirmasi berbeda dari rancangan.** Yang dirilis:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  Rancangan awal menggunakan `immediate | after-record | after-durable-send |
manual` dengan bidang alasan batas waktu Webhook; bentuk tersebut tidak dibuat.
- **Kunci kapabilitas `DurableFinalDeliveryRequirementMap` menggantikan objek
  `MessageCapabilities` dalam rancangan.** Kapabilitas berupa tanda boolean datar (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) yang diverifikasi melalui `verifyDurableFinalCapabilityProofs`, bukan
  struktur bertingkat bergaya `text.chunking` / `attachments.voice`.

## Risiko migrasi konkret (masih relevan)

Efek samping khusus kanal ini sudah ada sebelum refaktor dan harus tetap
berfungsi melalui jalur pengiriman baru. Efek tersebut bukan hipotetis: masing-masing
telah diimplementasikan dan sangat penting saat ini.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): pemantau mencatat pesan terkirim dalam cache gema
  setelah pengiriman berhasil. Pengiriman final yang tahan lama harus tetap mengisi
  cache tersebut, atau OpenClaw dapat menyerap kembali balasannya sendiri sebagai pesan masuk pengguna.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): menambahkan tanda tangan model
  opsional dan mencatat utas yang diikuti setelah balasan grup. Pengiriman
  yang tahan lama tidak boleh melewati efek tersebut.
- **Discord dan dispatcher lain yang telah disiapkan** sudah menangani pengiriman langsung dan
  perilaku pratinjau. Suatu kanal belum tahan lama secara menyeluruh hingga dispatcher
  yang telah disiapkan untuk kanal tersebut secara eksplisit merutekan hasil final melalui konteks pengiriman; jangan menganggap
  adaptor generik saja sudah mencakupnya.
- **Pengiriman fallback senyap Telegram** harus mengirimkan seluruh larik muatan
  yang diproyeksikan, bukan hanya muatan pertama, setelah pemotongan menjadi bagian-bagian/proyeksi
  fallback.
- **LINE, Zalo, Nostr**, dan jalur pembantu serupa dapat memiliki penanganan token
  balasan, proksi media, cache pesan terkirim, atau target khusus panggilan balik.
  Jalur tersebut tetap menggunakan pengiriman yang ditangani kanal hingga semantiknya direpresentasikan oleh
  adaptor pengiriman dan dicakup oleh pengujian.
- **Pembantu DM langsung** dapat memiliki panggilan balik balasan yang merupakan satu-satunya
  target transportasi yang benar. Pengiriman keluar generik tidak boleh menebak target dari
  kolom platform mentah dan melewatkan panggilan balik tersebut.

## Klasifikasi kegagalan

Adaptor mengklasifikasikan kegagalan transportasi ke dalam kategori tertutup bergaya
`DeliveryFailureKind` (sementara, batas laju, autentikasi, izin, tidak ditemukan, muatan
tidak valid, konflik, dibatalkan, tidak diketahui). Kebijakan inti:

- Coba ulang kegagalan sementara dan batas laju.
- Jangan mencoba ulang kegagalan muatan tidak valid kecuali tersedia fallback perenderan.
- Jangan mencoba ulang kegagalan autentikasi atau izin hingga konfigurasi berubah.
- Jika tidak ditemukan, izinkan finalisasi langsung beralih dari pengeditan ke pengiriman baru ketika
  kanal menyatakan bahwa tindakan tersebut aman.
- Jika terjadi konflik, gunakan status tanda terima/idempotensi untuk menentukan apakah pesan
  sudah ada.
- Setiap kesalahan setelah pemanggilan platform mungkin terjadi setelah operasi berhasil, tetapi sebelum komit
  tanda terima, menjadi `unknown_after_send` kecuali adaptor membuktikan bahwa operasi
  platform tidak terjadi.

## Pertanyaan terbuka

- Apakah Telegram pada akhirnya harus mengganti runner polling grammY (`1.43.0`)
  dengan sumber polling yang sepenuhnya tahan lama dan mengendalikan pengiriman ulang tingkat
  platform, bukan hanya penanda batas mulai ulang tersimpan milik OpenClaw
  (`safeCompletedUpdateId`).
- Apakah status pratinjau langsung harus berada dalam catatan yang sama dengan intensi pengiriman final
  atau dalam penyimpanan status langsung pendamping.
- Apakah penekanan gema akibat kegagalan Gateway di ruang bersama yang mengaktifkan bot memerlukan
  mekanisme penandaan asal yang awalnya direncanakan, kontrak per kanal yang
  lebih sederhana, atau berada di luar cakupan.
- Kanal mana yang memiliki dukungan asal/metadata native untuk penekanan gema
  lintas bot, dan kanal mana yang memerlukan registri pengiriman keluar tersimpan.

## Terkait

- [Pesan](/id/concepts/messages)
- [Streaming dan pemotongan menjadi bagian-bagian](/id/concepts/streaming)
- [Draf progres](/id/concepts/progress-drafts)
- [Kebijakan percobaan ulang](/id/concepts/retry)
- [API pengiriman keluar kanal](/id/plugins/sdk-channel-outbound)
- [API pesan masuk kanal](/id/plugins/sdk-channel-inbound)
