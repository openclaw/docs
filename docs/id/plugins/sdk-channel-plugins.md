---
read_when:
    - Anda sedang membangun plugin saluran perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami permukaan adaptor ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun plugin saluran perpesanan bagi OpenClaw
title: Membangun plugin kanal
x-i18n:
    generated_at: "2026-07-20T03:52:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f287892d3354362d1770e0a70f79f61b812ee6ad213ca5d82f9764e441eff130
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Panduan ini membuat Plugin channel yang menghubungkan OpenClaw ke platform
perpesanan: keamanan DM, pemasangan, penguntaian balasan, dan perpesanan keluar.

<Info>
  Baru mengenal Plugin OpenClaw? Baca [Memulai](/id/plugins/building-plugins)
  terlebih dahulu untuk struktur paket dan penyiapan manifes.
</Info>

## Hal yang dimiliki Plugin Anda

Plugin channel tidak mengimplementasikan alat kirim/edit/reaksi; inti menyediakan satu
alat `message` bersama. Plugin Anda memiliki:

- **Konfigurasi** - resolusi akun dan panduan penyiapan
- **Keamanan** - kebijakan DM dan daftar izin
- **Pemasangan** - alur persetujuan DM
- **Tata bahasa sesi** - cara id percakapan khusus penyedia dipetakan ke
  obrolan dasar, id utas, dan fallback induk
- **Keluar** - mengirim teks, media, dan jajak pendapat ke platform
- **Penguntaian** - cara balasan diuntaikan
- **Indikator pengetikan Heartbeat** - sinyal mengetik/sibuk opsional untuk target
  pengiriman Heartbeat

Inti memiliki alat pesan bersama, pengkabelan prompt, bentuk luar kunci sesi,
pencatatan `:thread:` generik, dan pengiriman.

## Adaptor pesan

Ekspos adaptor `message` dengan `defineChannelMessageAdapter` dari
`openclaw/plugin-sdk/channel-outbound`. Deklarasikan hanya kemampuan pengiriman akhir yang tahan lama
yang benar-benar didukung transport native Anda, dengan dukungan pengujian kontrak
yang membuktikan efek samping native dan tanda terima yang dikembalikan. Arahkan pengiriman teks/media
ke fungsi transport yang sama dengan yang digunakan adaptor `outbound` lama. Untuk
kontrak API lengkap, matriks kemampuan, aturan tanda terima, finalisasi pratinjau
langsung, kebijakan ack penerimaan, pengujian, dan tabel migrasi, lihat
[API keluar channel](/id/plugins/sdk-channel-outbound).

Jika adaptor `outbound` Anda yang sudah ada telah memiliki metode pengiriman dan
metadata kemampuan yang tepat, turunkan adaptor `message` dengan
`createChannelMessageAdapterFromOutbound(...)` alih-alih menulis
jembatan lain secara manual. Pengiriman adaptor mengembalikan nilai `MessageReceipt`. Untuk id lama, turunkan
dengan `listMessageReceiptPlatformIds(...)` atau
`resolveMessageReceiptPrimaryId(...)` alih-alih mempertahankan bidang `messageIds`
paralel.

Deklarasikan kemampuan langsung dan finalizer secara presisi - inti menggunakannya untuk menentukan
apa yang dapat dilakukan channel, dan ketidaksesuaian antara perilaku yang dideklarasikan dan aktual merupakan
kegagalan pengujian kontrak:

| Permukaan                             | Nilai                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Channel yang memfinalisasi pratinjau draf di tempat harus mengarahkan logika runtime
melalui `defineFinalizableLivePreviewAdapter(...)` beserta
`deliverWithFinalizableLivePreviewAdapter(...)`, dan memastikan kemampuan yang dideklarasikan
didukung oleh pengujian `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
dan `verifyChannelMessageLiveFinalizerProofs(...)` agar perilaku pratinjau native,
progres, edit, fallback/retensi, pembersihan, dan tanda terima tidak dapat menyimpang
secara diam-diam.

Penerima masuk yang menunda pengakuan platform harus mendeklarasikan
`message.receive.defaultAckPolicy` dan `supportedAckPolicies` alih-alih menyembunyikan
waktu ack dalam status lokal monitor. Cakup setiap kebijakan yang dideklarasikan dengan
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Pembantu balasan lama seperti `dispatchInboundReplyWithBase` dan
`recordInboundSessionAndDispatchReply` tetap tersedia untuk dispatcher
kompatibilitas. Jangan gunakan untuk kode channel baru; mulai dengan adaptor `message`,
tanda terima, serta pembantu siklus hidup penerimaan/pengiriman pada
`openclaw/plugin-sdk/channel-outbound` sebagai gantinya.

### Ingres masuk (eksperimental)

Channel yang memigrasikan otorisasi masuk dapat menggunakan subjalur eksperimental
`openclaw/plugin-sdk/channel-ingress-runtime` dari jalur penerimaan
runtime. Subjalur ini menerima fakta platform, daftar izin mentah, deskriptor rute, fakta
perintah, dan konfigurasi grup akses, lalu mengembalikan proyeksi pengirim/rute/perintah/aktivasi
beserta grafik ingres berurutan, sedangkan pencarian platform dan efek
samping tetap berada di Plugin. Pertahankan normalisasi identitas Plugin dalam
deskriptor yang diteruskan ke resolver; jangan menserialisasi nilai kecocokan mentah dari
status atau keputusan yang telah diresolusi. Lihat
[API ingres channel](/id/plugins/sdk-channel-ingress) untuk desain API,
batas kepemilikan, dan ekspektasi pengujian.

### Ingres tahan lama dan deduplikasi pemutaran ulang

Channel yang mengadopsi ingres tahan lama harus menggunakan `createChannelIngressMonitor`
dari `openclaw/plugin-sdk/channel-outbound`, kecuali memerlukan kontrak
penerimaan atau pompa yang berbeda secara material. Masukkan amplop transport mentah ke antrean pada
satu titik sempit penerimaan (tanpa normalisasi pada waktu penerimaan), batasi
ack transport berdasarkan penambahan tahan lama untuk transport Webhook, turunkan satu
jalur terserialisasi per percakapan, dan tandai peristiwa selesai saat diadopsi oleh
pengiriman. Kunci utama antrean adalah `(queue_name, event_id)` dan penyelesaian
menjadikan baris sebagai tombstone alih-alih menghapusnya, sehingga pengiriman ulang platform yang terlambat untuk
`event_id` yang sama ditolak secara tahan lama selama jendela retensi tombstone.
Lihat [API keluar channel](/id/plugins/sdk-channel-outbound#durable-ingress-monitors)
untuk API monitor dan kontrak penghentian.

Tombstone tersebut adalah aturan pelapisan untuk pelindung pemutaran ulang
(`openclaw/plugin-sdk/persistent-dedupe`): channel yang dikuras mempertahankan pelindung
pemutaran ulang terpisah hanya jika identitas atau retensi pelindung melebihi antrean
— kunci pesan logis yang berbeda dari id pengiriman transport (Telegram
mendeduplikasi `chat_id:message_id` karena penggabungan debounce dapat memunculkan kembali pesan
di bawah `update_id` baru), atau jendela yang lebih panjang daripada retensi tombstone
channel. Jika kunci pelindung Anda akan sama dengan `event_id` pengurasan, hapus
pelindung saat mengadopsi pengurasan dan ukur `completedTtlMs`/`completedMaxEntries`
agar mencakup jendela pelindung lama sebagai gantinya. Perlindungan non-deduplikasi seperti pagar
usia tidak terkait dengan aturan ini. ID pesan keluar yang stabil menggunakan registri
gema keluar bersama dari `openclaw/plugin-sdk/channel-outbound`, bukan cache TTL
lokal channel.

#### Kelas transport dan retensi

Klasifikasikan transport berdasarkan jaminan pemulihan pada batas penerimaannya:

- **Webhook atau pengiriman peristiwa yang dibatasi ack:** kirim pengakuan atau kembalikan keberhasilan hanya
  setelah penambahan tahan lama. Kegagalan penambahan harus membiarkan pengiriman tetap memenuhi syarat
  untuk dicoba ulang atau menggagalkan batas penerimaan. Kelas ini mencakup Slack, SMS, Zalo,
  Microsoft Teams, Google Chat, LINE, dan Synology Chat.
- **Polling atau pengiriman aliran yang ditunggu:** majukan kursor jarak jauh atau kirim
  ack transport hanya setelah penambahan. Jika tidak ada kursor eksplisit, pertahankan
  callback penerimaan agar terserialisasi dan ditunggu sehingga kegagalan penambahan tidak dapat membuat
  perulangan penerimaan berjalan mendahului. Polling Telegram, Signal, dan Tlon menggunakan kelas ini;
  pengiriman Webhook Telegram mengikuti aturan yang dibatasi ack di atas.
- **Soket tanpa pemutaran ulang:** IRC, Mattermost, Twitch, dan Zalo Personal tidak dapat meminta
  platform untuk mengirimkan ulang peristiwa yang telah diterima. Antrean tahan lama mereka melindungi
  jendela kerusakan proses dan mendukung pemulihan mulai ulang lokal; tombstone
  penyelesaian hampir tidak berpengaruh terhadap pemutaran ulang platform.

Gunakan 30 hari sebagai konvensi TTL tombstone armada, bukan sebagai nilai default SDK. Jendela
pengiriman ulang bervolume tinggi biasanya menggunakan batas penyelesaian 20,000 entri;
transport yang ditunggu dan tanpa pemutaran ulang dengan volume lebih rendah biasanya menggunakan 1,000-2,000.
Pengecualian saat ini mencakup batas 4,096 entri LINE, TTL penyelesaian 24 jam
SMS, dan retensi penyelesaian hanya berbasis batas milik Tlon. Batas baris gagal juga dapat lebih rendah
daripada batas penyelesaian. TTL dan batas sama-sama memangkas baris, sehingga retensi efektif berakhir
saat batas pertama tercapai. Lakukan penyimpangan hanya untuk horizon percobaan ulang platform yang terdokumentasi,
jendela pelindung pemutaran ulang yang telah dirilis dan dipertahankan, volume atau anggaran disk yang diperkirakan,
atau transport tanpa pemutaran ulang, dan cakup kontrak retensi dengan pengujian.

#### Efek samping setidaknya satu kali

Pengiriman pengurasan menjalankan efek samping perintah sebelum baris ingres mencapai
tombstone penyelesaiannya. Kerusakan proses di antara langkah-langkah tersebut memutar ulang baris dan
dapat menjalankan efek samping lagi. Jendela kerusakan setidaknya satu kali ini adalah
kontrak default. Untuk pekerjaan non-idempoten seperti penulisan konfigurasi, penghapusan
penyimpanan, atau pengakuan yang terlihat di luar jalur balasan, gunakan
`createIngressEffectOnce(...)` dari
`openclaw/plugin-sdk/ingress-effect-once`. Berikan setiap panggilan `eventId` ingres
yang stabil beserta nama efek. Buat satu pembantu per antrean/akun ingres dan
gunakan `namespacePrefix` yang stabil dan unik untuk cakupan tersebut karena ID peristiwa transport
mungkin bersifat lokal terhadap antrean. Pembantu melakukan commit terhadap klaim tahan lamanya hanya setelah
efek berhasil; efek yang dilempar melepaskan klaim agar percobaan ulang pengurasan dapat
menjalankannya lagi, sedangkan pemanggil serentak menunggu klaim aktif. Kesalahan status
tahan lama memanggil `onDiskError` jika disediakan dan menolak alih-alih melakukan
fallback ke memori proses.

Tetapkan `ttlMs` pembantu setidaknya sebesar retensi tombstone ingres channel
ditambah penundaan maksimum antara commit efek dan penyelesaian baris, termasuk
waktu henti terbatas dan percobaan ulang pengurasan. TTL catatan efek dimulai saat commit,
sedangkan retensi tombstone dimulai kemudian saat penyelesaian; jika masa hidup baris tertunda
tidak terbatas, tidak ada TTL terbatas yang mencakup waktu henti arbitrer. Setelah tombstone tidak dapat
lagi memutar ulang baris, catatan efek yang lebih lama menjadi beban mati. Ukur
`stateMaxEntries` untuk setiap kunci peristiwa/efek berbeda yang dapat ada dalam
jendela retensi tersebut, dengan memperhitungkan batas entri penyelesaian antrean dan
efek maksimum per peristiwa. Batas lebih rendah mengeluarkan catatan tertua sebelum TTL-nya
dan memungkinkan efek tersebut dijalankan lagi. Jendela setidaknya satu kali residual tetap ada
jika proses mati atau persistensi gagal setelah efek berhasil tetapi sebelum
klaim di-commit, atau jika catatan kedaluwarsa ketika baris ingresnya masih
tertunda.

#### Kontrak mulai ulang bercakupan akun

Perubahan konfigurasi channel memulai ulang seluruh channel secara default. Channel multiakun
dapat menetapkan `reload.accountScopedRestart: true` hanya jika resolusi
konfigurasi membaca bidang bersama untuk seluruh channel beserta akun yang dipilih, tidak pernah
akun saudara, dan Gateway dapat menghentikan dan memulai satu runtime `(channel, accountId)`
tanpa mengganti runtime saudara.

Jalur bercakupan hanya berlaku untuk perubahan di bawah
`channels.<channel>.accounts.<non-default-id>.*`. Perubahan pada bidang bersama
channel, `accounts.default`, akun yang dihapus atau tidak dapat diresolusi, serta perubahan campuran
yang dapat memengaruhi pewarisan dipromosikan menjadi mulai ulang seluruh channel. Plugin
yang tidak memilih ikut serta selalu menggunakan jalur seluruh channel.

Untuk channel yang menggunakan penguras ingres tahan lama, jalur penghentian monitor akun
harus terlebih dahulu menyelesaikan semua penerimaan transport yang telah diterima, lalu membuang dan menunggu
pengurasannya. Memulai akun membuka antrean yang sama berdasarkan kunci akun, dan
pengurasan awalnya memulihkan baris tahan lama yang belum dikirim. Jangan tambahkan lintasan pemutaran ulang kedua
yang khusus untuk pemuatan ulang; pemulihan antrean adalah jalur mulai ulang kanonis.

Perlakukan tanda ini sebagai klaim kemampuan, bukan preferensi performa. Pengujian
kontrak harus membuktikan bahwa menambahkan dan mengedit satu akun bernama membiarkan konfigurasi
akun saudara yang telah diresolusi tetap tidak berubah, menghentikan satu akun hanya menyelesaikan
monitor dan pengurasan akun tersebut, dan monitor baru memulihkan baris akun tersebut tepat
satu kali. Jika ada jaminan yang tidak dapat dibuktikan, jangan sertakan tanda tersebut.

### Indikator pengetikan

Jika channel Anda mendukung indikator pengetikan di luar balasan masuk, ekspos
`heartbeat.sendTyping(...)` pada Plugin channel. Inti memanggilnya dengan
target pengiriman Heartbeat yang telah diresolusi sebelum proses model Heartbeat dimulai dan
menggunakan siklus hidup keepalive/pembersihan pengetikan bersama. Tambahkan
`heartbeat.clearTyping(...)` ketika platform memerlukan sinyal penghentian eksplisit.

### Parameter sumber media

Jika channel Anda menambahkan parameter alat pesan yang membawa sumber media, ekspos
nama parameter tersebut melalui `plugin.actions.describeMessageTool(...).mediaSourceParams`.
Inti menggunakan daftar eksplisit tersebut untuk normalisasi jalur sandbox dan kebijakan
akses media keluar, sehingga Plugin tidak memerlukan kasus khusus inti bersama untuk
parameter avatar, lampiran, atau gambar sampul khusus penyedia.

Utamakan peta berbasis kunci tindakan seperti `{ "set-profile": ["avatarUrl", "avatarPath"] }`
agar tindakan yang tidak berkaitan tidak mewarisi argumen media tindakan lain. Larik datar
tetap dapat digunakan untuk parameter yang sengaja dibagikan ke setiap tindakan yang diekspos.

Channel yang harus mengekspos URL publik sementara untuk pengambilan media
di sisi platform dapat menggunakan `createHostedOutboundMediaStore(...)` dari
`openclaw/plugin-sdk/outbound-media` dengan penyimpanan status plugin. Pertahankan
penguraian rute platform dan penerapan token di plugin channel; pembantu bersama
hanya menangani pemuatan media, metadata kedaluwarsa, baris potongan, dan pembersihan.

### Pembentukan payload native

Jika channel Anda memerlukan pembentukan khusus penyedia untuk `message(action="send")`,
utamakan `actions.prepareSendPayload(...)`. Letakkan kartu native, blok, sematan, atau
data persisten lainnya di bawah `payload.channelData.<channel>` dan biarkan inti mengirimkannya
melalui adaptor outbound/pesan. Gunakan `actions.handleAction(...)` untuk pengiriman
hanya sebagai fallback kompatibilitas bagi payload yang tidak dapat diserialisasi dan
dicoba ulang.

### Tata bahasa percakapan sesi

Jika platform Anda menyimpan cakupan tambahan di dalam ID percakapan, pertahankan penguraiannya
di plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah
hook kanonis untuk memetakan `rawId` ke ID percakapan dasar, ID
utas opsional, `baseConversationId` eksplisit, dan setiap
`parentConversationCandidates`. Saat mengembalikan `parentConversationCandidates`,
urutkan dari induk dengan cakupan paling sempit hingga percakapan terluas/dasar.

`messaging.resolveParentConversationCandidates(...)` adalah fallback
kompatibilitas yang tidak digunakan lagi untuk plugin yang hanya memerlukan fallback induk di atas
ID generik/mentah. Jika kedua hook tersedia, inti menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
kembali ke `resolveParentConversationCandidates(...)` ketika hook kanonis
tidak menyertakannya.

Plugin bawaan yang memerlukan penguraian yang sama sebelum registri saluran dimulai
dapat mengekspos file `session-key-api.ts` tingkat atas dengan ekspor
`resolveSessionConversation(...)` yang sesuai (lihat Plugin Feishu dan Telegram).
Core menggunakan permukaan yang aman untuk bootstrap tersebut hanya ketika registri
Plugin runtime belum tersedia.

Gunakan `openclaw/plugin-sdk/channel-route` ketika kode Plugin perlu menormalisasi
bidang yang menyerupai rute, membandingkan utas turunan dengan rute induknya, atau membuat
kunci deduplikasi yang stabil dari `{ channel, to, accountId, threadId }`. Pembantu tersebut
menormalisasi ID utas numerik dengan cara yang sama seperti core, jadi utamakan ini daripada
perbandingan `String(threadId)` ad hoc. Plugin dengan tata bahasa target khusus penyedia
harus mengekspos `messaging.resolveOutboundSessionRoute(...)` agar core memperoleh
identitas sesi dan utas asli penyedia tanpa shim pengurai.

### Dukungan pengikatan percakapan dalam cakupan akun

Tetapkan `conversationBindings.supportsCurrentConversationBinding` ketika saluran
mendukung pengikatan generik untuk percakapan saat ini. `createChatChannelPlugin(...)`
menetapkan kemampuan statis ini ke `true` secara default.

Jika dukungan berbeda menurut akun yang dikonfigurasi, implementasikan juga
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Core mengevaluasi hook sinkron ini hanya setelah kemampuan statis
diaktifkan. Mengembalikan `false` membuat operasi kemampuan, pengikatan,
pencarian, pencantuman, pembaruan waktu akses, dan pelepasan ikatan generik untuk percakapan saat ini tidak tersedia bagi akun tersebut.
Tidak menyertakan hook akan menerapkan kemampuan statis ke setiap akun.

Tentukan jawaban dari konfigurasi akun atau status runtime yang sudah dimuat. Hook ini
hanya mengendalikan pengikatan generik untuk percakapan saat ini; hook ini tidak menggantikan
aturan pengikatan yang dikonfigurasi atau perutean sesi milik Plugin. Pengujian kontrak
harus mencakup setidaknya satu akun yang didukung dan satu yang tidak didukung melalui
kontrak `ChannelPlugin["conversationBindings"]` yang diekspor oleh
`openclaw/plugin-sdk/channel-core`.

## Persetujuan dan kemampuan saluran

Sebagian besar Plugin saluran tidak memerlukan kode khusus persetujuan. Core menangani
`/approve` dalam obrolan yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
`ChannelPlugin.approvals` telah dihapus; tempatkan fakta pengiriman/asli/render/autentikasi
persetujuan pada satu objek `approvalCapability`. `plugin.auth` hanya untuk login/logout
— core tidak lagi membaca hook autentikasi persetujuan dari objek tersebut.

Gunakan `approvalCapability.delivery` hanya untuk perutean persetujuan native atau
penekanan fallback, dan `approvalCapability.render` hanya ketika suatu channel benar-benar memerlukan
payload persetujuan khusus sebagai pengganti perender bersama.

### Autentikasi persetujuan

- `approvalCapability.authorizeActorAction` dan
  `approvalCapability.getActionAvailabilityState` merupakan
  seam autentikasi persetujuan kanonis.
- Gunakan `getActionAvailabilityState` untuk ketersediaan autentikasi persetujuan dalam chat yang sama.
  Pastikan pemberi persetujuan yang dikonfigurasi tetap tersedia untuk `/approve` meskipun pengiriman native
  dinonaktifkan; sebagai gantinya, gunakan status permukaan pemicu native untuk panduan
  pengiriman/penyiapan.
- Jika channel Anda mengekspos persetujuan eksekusi native, gunakan
  `approvalCapability.getExecInitiatingSurfaceState` untuk
  status permukaan pemicu/klien native ketika status tersebut berbeda dari autentikasi
  persetujuan dalam chat yang sama. Core menggunakan hook khusus eksekusi tersebut untuk membedakan `enabled` dengan
  `disabled`, menentukan apakah channel pemicu mendukung persetujuan eksekusi
  native, dan menyertakan channel tersebut dalam panduan fallback klien native.
  `createApproverRestrictedNativeApprovalCapability(...)` mengisi bagian ini untuk
  kasus umum.
- Jika suatu channel dapat menyimpulkan identitas DM stabil yang menyerupai pemilik dari konfigurasi yang ada,
  gunakan `createResolvedApproverActionAuthAdapter` dari
  `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` dalam chat yang sama
  tanpa menambahkan logika core khusus persetujuan.
- Jika autentikasi persetujuan khusus sengaja hanya mengizinkan fallback dalam chat yang sama, kembalikan
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` dari
  `openclaw/plugin-sdk/approval-auth-runtime`; jika tidak, core memperlakukan
  hasilnya sebagai otorisasi eksplisit pemberi persetujuan.
- Jika callback native milik channel menyelesaikan persetujuan secara langsung, gunakan
  `isImplicitSameChatApprovalAuthorization(...)` sebelum menyelesaikannya agar fallback
  implisit tetap melewati otorisasi aktor normal milik channel.

### Siklus hidup payload dan panduan penyiapan

- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau
  `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload
  khusus channel, seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator
  pengetikan sebelum pengiriman.
- Gunakan `approvalCapability.describeExecApprovalSetup` ketika channel menginginkan
  balasan jalur yang dinonaktifkan untuk menjelaskan pengaturan konfigurasi persis yang diperlukan guna mengaktifkan
  persetujuan eksekusi native. Hook menerima `{ channel, channelLabel, accountId }`;
  channel dengan akun bernama harus merender jalur dalam cakupan akun seperti
  `channels.<channel>.accounts.<id>.execApprovals.*`, bukan default
  tingkat teratas.
- Gunakan `approvalCapability.describePluginApprovalSetup` ketika panduan kegagalan
  persetujuan plugin aman ditampilkan untuk kegagalan persetujuan plugin akibat tidak adanya rute dan batas waktu.
  `createApproverRestrictedNativeApprovalCapability(...)` tidak
  menyimpulkan hal ini dari `describeExecApprovalSetup`; teruskan helper yang sama secara eksplisit
  hanya ketika persetujuan plugin dan eksekusi benar-benar menggunakan penyiapan native yang sama.

### Pengiriman persetujuan native

Jika suatu channel memerlukan pengiriman persetujuan native, pertahankan fokus kode channel pada
normalisasi target serta fakta transportasi/presentasi. Gunakan
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver`, dan
`createApproverRestrictedNativeApprovalCapability` dari
`openclaw/plugin-sdk/approval-runtime`. Tempatkan fakta khusus channel di balik
`approvalCapability.nativeRuntime`, idealnya melalui
`createChannelApprovalNativeRuntimeAdapter(...)` atau
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, sehingga core dapat merakit
handler dan menangani pemfilteran permintaan, perutean, deduplikasi, kedaluwarsa, langganan
Gateway, serta pemberitahuan bahwa permintaan dirutekan ke tempat lain.

`nativeRuntime` dibagi menjadi beberapa seam yang lebih kecil:

- `availability` - apakah akun dikonfigurasi dan apakah suatu permintaan
  harus ditangani
- `presentation` - memetakan model tampilan persetujuan bersama menjadi
  payload native tertunda/terselesaikan/kedaluwarsa atau tindakan akhir
- `transport` - menyiapkan target serta mengirim/memperbarui/menghapus pesan
  persetujuan native
- `interactions` - hook opsional untuk mengikat/melepas ikatan/menghapus tindakan bagi tombol
  atau reaksi native, ditambah hook `cancelDelivered` opsional. Implementasikan
  `cancelDelivered` ketika `deliverPending` mendaftarkan status dalam proses atau persisten
  (seperti penyimpanan target reaksi) agar status tersebut dapat dilepaskan jika penghentian
  handler membatalkan pengiriman sebelum `bindPending` dijalankan, atau ketika
  `bindPending` tidak mengembalikan handle
- `observe` - hook diagnostik pengiriman opsional

Helper persetujuan lainnya:

- Gunakan `createNativeApprovalChannelRouteGates` dari
  `openclaw/plugin-sdk/approval-native-runtime` ketika suatu channel mendukung
  pengiriman native asal sesi dan target penerusan persetujuan eksplisit. Helper ini
  memusatkan pemilihan konfigurasi persetujuan, penanganan `mode`, filter agen/sesi,
  pengikatan akun, pencocokan target sesi, dan pencocokan daftar target,
  sementara pemanggil tetap menangani id channel, mode penerusan default, pencarian
  akun, pemeriksaan bahwa transportasi diaktifkan, normalisasi target, dan resolusi target
  sumber giliran. Jangan menggunakannya untuk membuat default kebijakan channel milik core;
  teruskan mode default terdokumentasi milik channel secara eksplisit.
- `createChannelNativeOriginTargetResolver` menggunakan pencocok rute channel
  bersama secara default untuk target `{ to, accountId, threadId }`. Teruskan
  `targetsMatch` hanya ketika suatu channel memiliki aturan ekuivalensi khusus penyedia,
  seperti pencocokan awalan stempel waktu Slack. Teruskan `normalizeTargetForMatch` ketika
  channel perlu mengkanoniskan id penyedia sebelum pencocok rute default
  atau callback `targetsMatch` khusus dijalankan, sambil mempertahankan
  target asli untuk pengiriman. Gunakan `normalizeTarget` hanya ketika target
  pengiriman yang telah diresolusi itu sendiri harus dikanoniskan.
- Jika channel memerlukan objek milik runtime seperti klien, token, aplikasi
  Bolt, atau penerima Webhook, daftarkan objek tersebut melalui
  `openclaw/plugin-sdk/channel-runtime-context`. Registri konteks runtime
  generik memungkinkan core melakukan bootstrap handler berbasis kapabilitas dari status
  startup channel tanpa menambahkan kode perekat pembungkus khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau
  `createChannelNativeApprovalRuntime` tingkat rendah hanya ketika seam berbasis kapabilitas
  belum cukup ekspresif.
- Channel persetujuan native harus merutekan `accountId` dan `approvalKind`
  melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multiakun
  tetap berada dalam cakupan akun bot yang tepat, dan `approvalKind` menjaga perilaku
  persetujuan eksekusi dibandingkan plugin tetap tersedia bagi channel tanpa cabang yang
  di-hardcode dalam core.
- Core juga menangani pemberitahuan perutean ulang persetujuan. Plugin channel tidak boleh mengirim
  pesan tindak lanjutnya sendiri yang menyatakan "persetujuan dialihkan ke DM / channel lain" dari
  `createChannelNativeApprovalRuntime`; sebagai gantinya, ekspos perutean asal +
  DM pemberi persetujuan secara akurat melalui helper kapabilitas persetujuan bersama dan biarkan
  core mengagregasi pengiriman aktual sebelum memposting pemberitahuan apa pun kembali ke
  chat pemicu.
- Pertahankan jenis id persetujuan yang dikirimkan secara menyeluruh. Klien native tidak boleh
  menebak atau menulis ulang perutean persetujuan eksekusi dibandingkan plugin dari status
  lokal channel.
- Teruskan `approvalKind` eksplisit tersebut ke `resolveApprovalOverGateway`. Ini menggunakan
  layanan `approval.resolve` kanonis dan mengembalikan pemenang yang tercatat ketika
  permukaan lain menjawab lebih dahulu. Input eksplisit `resolveMethod` yang lebih lama
  tetap tersedia untuk kontrol berbasis perintah; tindakan native baru tidak boleh menggunakannya atau
  menyimpulkan jenis dari ID.
- Jenis persetujuan yang berbeda dapat secara sengaja mengekspos permukaan native
  yang berbeda. Contoh bawaan saat ini: Matrix mempertahankan perutean DM/channel native
  dan UX reaksi yang sama untuk persetujuan eksekusi dan plugin, sambil tetap memungkinkan
  autentikasi berbeda menurut jenis persetujuan; Slack mempertahankan perutean persetujuan native
  tersedia untuk id eksekusi maupun plugin.
- `createApproverRestrictedNativeApprovalAdapter` masih tersedia sebagai
  pembungkus kompatibilitas, tetapi kode baru sebaiknya mengutamakan builder kapabilitas
  dan mengekspos `approvalCapability` pada plugin.

### Subjalur runtime persetujuan yang lebih sempit

Untuk titik masuk channel yang sering digunakan, utamakan subjalur yang lebih sempit berikut daripada barrel
`approval-runtime` yang lebih luas ketika Anda hanya memerlukan satu bagian dari kelompok tersebut:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Demikian pula, utamakan `openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` daripada permukaan payung yang lebih luas ketika Anda
tidak memerlukan semuanya.

### Subjalur penyiapan

- `openclaw/plugin-sdk/setup-runtime` mencakup pembantu penyiapan yang aman untuk runtime:
  `createSetupTranslator`, adaptor patch penyiapan yang aman untuk impor
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), keluaran catatan pencarian,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan pembuat
  proksi penyiapan yang didelegasikan.
- `openclaw/plugin-sdk/channel-setup` mencakup pembuat penyiapan untuk instalasi opsional
  beserta beberapa primitif yang aman untuk penyiapan: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled`, dan `splitSetupEntries`.
- Gunakan sambungan `openclaw/plugin-sdk/setup` yang lebih luas hanya jika Anda juga memerlukan
  pembantu penyiapan/konfigurasi bersama yang lebih berat, seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Jika channel Anda hanya ingin menampilkan "instal plugin ini terlebih dahulu" pada
permukaan penyiapan, utamakan `createOptionalChannelSetupSurface(...)`. Adaptor/wizard
yang dihasilkan gagal secara tertutup pada penulisan dan finalisasi konfigurasi, serta menggunakan
kembali pesan wajib-instalasi yang sama dalam validasi, finalisasi, dan teks
tautan dokumentasi.

Jika channel Anda mendukung penyiapan atau autentikasi berbasis env, tampilkan melalui
skema konfigurasi channel dan deskriptor penyiapan. Pertahankan `envVars` runtime channel atau
konstanta lokal hanya untuk teks yang ditujukan kepada operator.

Jika channel Anda dapat muncul dalam `status`, `channels list`, `channels status`, atau
pemindaian SecretRef sebelum runtime plugin dimulai, tambahkan `openclaw.setupEntry` di
`package.json`. Titik masuk tersebut harus aman untuk diimpor dalam jalur perintah
hanya-baca dan harus mengembalikan metadata channel, adaptor konfigurasi yang aman
untuk penyiapan, adaptor status, dan metadata target secret channel yang diperlukan untuk
ringkasan tersebut. Jangan memulai klien, listener, atau runtime transport dari
entri penyiapan.

Pertahankan juga jalur impor entri channel utama tetap sempit. Penemuan dapat mengevaluasi
entri dan modul plugin channel untuk mendaftarkan kapabilitas tanpa
mengaktifkan channel. Berkas seperti `channel-plugin-api.ts` harus mengekspor
objek plugin channel tanpa mengimpor wizard penyiapan, klien
transport, listener soket, peluncur subproses, atau modul startup layanan.
Tempatkan komponen runtime tersebut dalam modul yang dimuat dari `registerFull(...)`, setter
runtime, atau adaptor kapabilitas malas.

### Subjalur channel sempit lainnya

Untuk jalur channel sibuk lainnya, utamakan pembantu yang sempit daripada permukaan
lama yang lebih luas:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk konfigurasi multiakun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/channel-inbound` untuk rute/envelope masuk serta
  pengkabelan pencatatan-dan-pengiriman
- `openclaw/plugin-sdk/channel-targets` untuk pembantu penguraian target
- `openclaw/plugin-sdk/channel-outbound` untuk delegasi identitas/pengiriman keluar
  dan perencanaan payload bertipe
- `buildThreadAwareOutboundSessionRoute(...)` dari
  `openclaw/plugin-sdk/channel-core` saat rute keluar harus mempertahankan
  `replyToId`/`threadId` eksplisit atau memulihkan sesi `:thread:`
  saat ini setelah kunci sesi dasar masih cocok. Plugin penyedia dapat
  menimpa prioritas, perilaku sufiks, dan normalisasi id utas saat
  platformnya memiliki semantik pengiriman utas native.
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup pengikatan utas
  dan pendaftaran adaptor

Channel khusus autentikasi biasanya cukup menggunakan jalur default: inti menangani
persetujuan dan plugin hanya menampilkan kapabilitas keluar/autentikasi. Channel
persetujuan native seperti Matrix, Slack, Telegram, dan transport chat khusus
harus menggunakan pembantu native bersama, alih-alih membuat sendiri siklus hidup
persetujuannya.

## Kebijakan penyebutan masuk

Pisahkan penanganan penyebutan masuk menjadi dua lapisan:

- pengumpulan bukti milik plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan penyebutan.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya jika Anda memerlukan barrel pembantu
masuk yang lebih luas.

Cocok untuk logika lokal plugin:

- deteksi balasan kepada bot
- deteksi bot yang dikutip
- pemeriksaan partisipasi utas
- pengecualian pesan layanan/sistem
- cache native platform yang diperlukan untuk membuktikan partisipasi bot

Cocok untuk pembantu bersama:

- `requireMention`
- hasil penyebutan eksplisit
- daftar izin penyebutan implisit
- pengabaian untuk perintah
- keputusan akhir untuk melewati

Alur yang diutamakan:

1. Hitung fakta penyebutan lokal.
2. Teruskan fakta tersebut ke `resolveInboundMentionDecision({ facts, policy })`.
3. Gunakan `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, dan
   `decision.shouldSkip` dalam gerbang masuk Anda.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";
import { resolveChannelImplicitMentions } from "openclaw/plugin-sdk/channel-ingress-runtime";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const implicitMentions = resolveChannelImplicitMentions({
  cfg,
  channel: channelId,
  accountId,
});

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    implicitMentions,
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` mengembalikan boolean. `hasAnyMention`,
`isExplicitlyMentioned`, dan `canResolveExplicit` berasal dari metadata penyebutan
native milik channel (entitas pesan, penanda balasan-kepada-bot, dan sejenisnya);
berikan nilai `false`/`undefined` jika platform Anda tidak dapat mendeteksinya.

`api.runtime.channel.mentions` menampilkan pembantu penyebutan bersama yang sama untuk
plugin channel bawaan yang telah bergantung pada injeksi runtime:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Jika Anda hanya memerlukan `implicitMentionKindWhen` dan `resolveInboundMentionDecision`,
impor dari `openclaw/plugin-sdk/channel-mention-gating` agar tidak memuat
pembantu runtime masuk yang tidak terkait.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifes">
    Buat berkas plugin standar. Kolom `channels` dalam
    `openclaw.plugin.json` (bukan kolom `kind`) adalah yang menandai manifes sebagai
    pemilik channel. Untuk permukaan metadata paket lengkap, lihat
    [Penyiapan dan Konfigurasi Plugin](/id/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Hubungkan OpenClaw ke Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Plugin channel Acme Chat",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Token bot",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` memvalidasi `plugins.entries.acme-chat.config`. Gunakan untuk
    pengaturan milik plugin yang bukan konfigurasi akun channel.
    `channelConfigs.acme-chat.schema` memvalidasi `channels.acme-chat` dan merupakan
    sumber jalur dingin yang digunakan oleh skema konfigurasi, penyiapan, dan permukaan UI sebelum
    runtime plugin dimuat. Lihat [Manifes plugin](/id/plugins/manifest) untuk referensi
    lengkap kolom tingkat atas.

  </Step>

  <Step title="Bangun objek plugin channel">
    Antarmuka `ChannelPlugin` memiliki banyak permukaan adaptor opsional. Mulailah dengan
    yang minimum — `id`, `config`, dan `setup` — lalu tambahkan adaptor sesuai
    kebutuhan.

    Buat `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // klien API platform Anda

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token wajib diisi");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // Resolusi/inspeksi akun berada di `config`, bukan `setup`.
        // `setup` mencakup penulisan orientasi awal (applyAccountConfig, validateInput).
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // Keamanan DM: siapa yang dapat mengirim pesan kepada bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pemasangan: alur persetujuan untuk kontak DM baru
      pairing: {
        text: {
          idLabel: "Nama pengguna Acme Chat",
          message: "Kirim kode ini untuk memverifikasi identitas Anda:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Kode pemasangan: ${code}`);
          },
        },
      },

      // Pengutasan: cara balasan dikirimkan
      threading: { topLevelReplyToMode: "reply" },

      // Keluar: kirim pesan ke platform
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Untuk channel yang menerima kunci DM tingkat atas kanonis dan kunci bertingkat lama, gunakan helper dari `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, dan `normalizeChannelDmPolicy` mempertahankan nilai lokal akun sebelum nilai root yang diwarisi. Pasangkan resolver yang sama dengan perbaikan doctor melalui `normalizeLegacyDmAliases` agar runtime dan migrasi membaca kontrak yang sama.

    <Accordion title="Yang dilakukan createChatChannelPlugin untuk Anda">
      Alih-alih mengimplementasikan antarmuka adaptor tingkat rendah secara manual, Anda meneruskan
      opsi deklaratif dan builder akan menyusunnya:

      | Opsi | Yang dihubungkannya |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM tercakup dari kolom konfigurasi |
      | `pairing.text` | Alur pemasangan DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode balasan (tetap, tercakup akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi pengiriman yang mengembalikan metadata hasil (ID pesan); memerlukan id `channel` pendamping agar core dapat mencap hasil pengiriman yang dikembalikan |

      Anda juga dapat meneruskan objek adaptor mentah sebagai pengganti opsi deklaratif
      jika memerlukan kendali penuh.

      Adaptor keluar mentah dapat mendefinisikan fungsi `chunker(text, limit, ctx)`.
      `ctx.formatting` opsional membawa keputusan pemformatan pada waktu pengiriman
      seperti `maxLinesPerMessage`; terapkan sebelum mengirim agar rangkaian balasan
      dan batas potongan diselesaikan satu kali oleh pengiriman keluar bersama.
      Konteks pengiriman juga menyertakan `replyToIdSource` (`implicit` atau `explicit`)
      ketika target balasan native telah diselesaikan, sehingga helper payload dapat mempertahankan
      tag balasan eksplisit tanpa menggunakan slot balasan sekali pakai implisit.
    </Accordion>

  </Step>

  <Step title="Hubungkan titik masuk">
    Buat `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin channel Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Pengelolaan Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Pengelolaan Acme Chat",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Tempatkan deskriptor CLI milik channel di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya dalam bantuan root tanpa mengaktifkan runtime channel lengkap,
    sementara pemuatan penuh normal tetap mengambil deskriptor yang sama untuk pendaftaran
    perintah sebenarnya. Pertahankan `registerFull(...)` untuk pekerjaan khusus runtime.
    `defineChannelPluginEntry` menangani pemisahan mode pendaftaran secara otomatis.
    Jika `registerFull(...)` mendaftarkan metode RPC Gateway, gunakan
    prefiks khusus plugin. Namespace admin core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    diselesaikan ke `operator.admin`. Lihat
    [Titik Masuk](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsi.

  </Step>

  <Step title="Tambahkan entri penyiapan">
    Buat `setup-entry.ts` untuk pemuatan ringan selama orientasi awal:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat ini sebagai pengganti entri penuh ketika channel dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari pemuatan kode runtime berat selama alur penyiapan.
    Lihat [Penyiapan dan Konfigurasi](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Channel workspace bawaan yang memisahkan ekspor aman-penyiapan ke dalam modul
    pendamping dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` ketika juga memerlukan
    setter runtime eksplisit pada waktu penyiapan.

  </Step>

  <Step title="Tangani pesan masuk">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola umumnya adalah Webhook yang memverifikasi permintaan dan
    meneruskannya melalui handler masuk channel Anda:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autentikasi yang dikelola plugin (verifikasi tanda tangan sendiri)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Handler masuk Anda meneruskan pesan ke OpenClaw.
          // Penghubungan persisnya bergantung pada SDK platform Anda -
          // lihat contoh nyata dalam paket plugin bawaan Microsoft Teams atau Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Penanganan pesan masuk bersifat khusus channel. Setiap plugin channel memiliki
      pipeline masuknya sendiri. Lihat plugin channel bawaan
      (misalnya paket plugin Microsoft Teams atau Google Chat) untuk pola nyata.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Uji">
Tulis pengujian yang ditempatkan bersama di `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("menyelesaikan akun dari konfigurasi", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("memeriksa akun tanpa mewujudkan rahasia", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("melaporkan konfigurasi yang tidak ada", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    Untuk helper pengujian bersama, lihat [Pengujian](/id/plugins/sdk-testing).

</Step>
</Steps>

## Struktur file

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # metadata openclaw.channel
├── openclaw.plugin.json      # Manifes dengan skema konfigurasi
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Ekspor publik (opsional)
├── runtime-api.ts            # Ekspor runtime internal (opsional)
└── src/
    ├── channel.ts            # ChannelPlugin melalui createChatChannelPlugin
    ├── channel.test.ts       # Pengujian
    ├── client.ts             # Klien API platform
    └── runtime.ts            # Penyimpanan runtime (jika diperlukan)
```

## Topik lanjutan

<CardGroup cols={2}>
  <Card title="Opsi rangkaian" icon="git-branch" href="/id/plugins/sdk-entrypoints#registration-mode">
    Mode balasan tetap, tercakup akun, atau kustom
  </Card>
  <Card title="Integrasi alat pesan" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool dan penemuan tindakan
  </Card>
  <Card title="Resolusi target" icon="crosshair" href="/id/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagen melalui api.runtime
  </Card>
  <Card title="API masuk channel" icon="bolt" href="/id/plugins/sdk-channel-inbound">
    Siklus hidup peristiwa masuk bersama: serap, selesaikan, catat, teruskan, finalisasi
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bawaan masih tersedia untuk pemeliharaan plugin bawaan dan
kompatibilitas. Seam tersebut bukan pola yang direkomendasikan untuk plugin channel baru;
utamakan subpath channel/penyiapan/balasan/runtime generik dari permukaan SDK umum,
kecuali Anda memelihara langsung keluarga plugin bawaan tersebut.
</Note>

## Langkah berikutnya

- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - jika plugin Anda juga menyediakan model
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi impor subpath lengkap
- [Pengujian SDK](/id/plugins/sdk-testing) - utilitas pengujian dan pengujian kontrak
- [Manifes Plugin](/id/plugins/manifest) - skema manifes lengkap

## Terkait

- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
