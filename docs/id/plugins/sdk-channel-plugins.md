---
read_when:
    - Anda sedang membangun plugin saluran perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami permukaan adaptor ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun plugin saluran perpesanan bagi OpenClaw
title: Membangun plugin saluran
x-i18n:
    generated_at: "2026-07-16T18:30:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Panduan ini membuat plugin saluran yang menghubungkan OpenClaw ke platform
perpesanan: keamanan DM, pemasangan, pengelompokan balasan dalam utas, dan perpesanan keluar.

<Info>
  Baru mengenal plugin OpenClaw? Baca [Memulai](/id/plugins/building-plugins)
  terlebih dahulu untuk mengetahui struktur paket dan penyiapan manifes.
</Info>

## Hal-hal yang dikelola plugin Anda

Plugin saluran tidak mengimplementasikan alat kirim/edit/reaksi; inti menyediakan satu
alat `message` bersama. Plugin Anda mengelola:

- **Konfigurasi** - resolusi akun dan wizard penyiapan
- **Keamanan** - kebijakan DM dan daftar yang diizinkan
- **Pemasangan** - alur persetujuan DM
- **Tata bahasa sesi** - cara id percakapan khusus penyedia dipetakan ke
  obrolan dasar, id utas, dan fallback induk
- **Keluar** - mengirim teks, media, dan jajak pendapat ke platform
- **Pengelompokan dalam utas** - cara balasan dikelompokkan dalam utas
- **Pengetikan Heartbeat** - sinyal pengetikan/sibuk opsional untuk target
  pengiriman Heartbeat

Inti mengelola alat pesan bersama, pengawatan prompt, bentuk kunci sesi luar,
pencatatan `:thread:` generik, dan pengiriman.

## Adaptor pesan

Ekspos adaptor `message` dengan `defineChannelMessageAdapter` dari
`openclaw/plugin-sdk/channel-outbound`. Deklarasikan hanya kapabilitas pengiriman akhir
yang persisten dan benar-benar didukung oleh transport native Anda, dengan didukung oleh pengujian
kontrak yang membuktikan efek samping native dan tanda terima yang dikembalikan. Arahkan pengiriman teks/media
ke fungsi transport yang sama dengan yang digunakan adaptor `outbound` lama. Untuk
kontrak API lengkap, matriks kapabilitas, aturan tanda terima, finalisasi pratinjau
langsung, kebijakan konfirmasi penerimaan, pengujian, dan tabel migrasi, lihat
[API keluar saluran](/id/plugins/sdk-channel-outbound).

Jika adaptor `outbound` yang ada sudah memiliki metode pengiriman dan
metadata kapabilitas yang tepat, turunkan adaptor `message` dengan
`createChannelMessageAdapterFromOutbound(...)` daripada menulis jembatan lain
secara manual. Pengiriman adaptor mengembalikan nilai `MessageReceipt`. Untuk id lama, turunkan
dengan `listMessageReceiptPlatformIds(...)` atau
`resolveMessageReceiptPrimaryId(...)` daripada mempertahankan kolom `messageIds`
paralel.

Deklarasikan kapabilitas langsung dan finalizer secara tepat - inti menggunakannya untuk menentukan
apa yang dapat dilakukan saluran, dan perbedaan antara perilaku yang dideklarasikan dan yang sebenarnya merupakan
kegagalan pengujian kontrak:

| Permukaan                             | Nilai                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`, `previewFinalization`, `progressUpdates`, `nativeStreaming`, `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`, `normalFallback`, `discardPending`, `previewReceipt`, `retainOnAmbiguousFailure`    |

Saluran yang menyelesaikan pratinjau draf secara langsung di tempatnya harus mengarahkan logika runtime
melalui `defineFinalizableLivePreviewAdapter(...)` beserta
`deliverWithFinalizableLivePreviewAdapter(...)`, dan memastikan kapabilitas yang dideklarasikan
didukung oleh pengujian `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
dan `verifyChannelMessageLiveFinalizerProofs(...)` agar perilaku pratinjau native,
kemajuan, pengeditan, fallback/retensi, pembersihan, dan tanda terima tidak dapat berubah
secara diam-diam.

Penerima masuk yang menunda konfirmasi platform harus mendeklarasikan
`message.receive.defaultAckPolicy` dan `supportedAckPolicies` daripada menyembunyikan
waktu konfirmasi dalam status lokal pemantau. Cakup setiap kebijakan yang dideklarasikan dengan
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Pembantu balasan lama seperti `dispatchInboundReplyWithBase` dan
`recordInboundSessionAndDispatchReply` tetap tersedia untuk dispatcher
kompatibilitas. Jangan menggunakannya untuk kode saluran baru; mulailah dengan adaptor `message`,
tanda terima, dan pembantu siklus hidup penerimaan/pengiriman pada
`openclaw/plugin-sdk/channel-outbound`.

### Ingress masuk (eksperimental)

Saluran yang memigrasikan otorisasi masuk dapat menggunakan subjalur eksperimental
`openclaw/plugin-sdk/channel-ingress-runtime` dari jalur penerimaan runtime.
Subjalur ini menerima fakta platform, daftar izin mentah, deskriptor rute, fakta perintah,
dan konfigurasi grup akses, lalu mengembalikan proyeksi pengirim/rute/perintah/aktivasi
beserta graf ingress berurutan, sementara pencarian platform dan efek
samping tetap berada dalam plugin. Pertahankan normalisasi identitas plugin dalam
deskriptor yang Anda teruskan ke resolver; jangan menserialisasikan nilai kecocokan mentah dari
status atau keputusan yang telah diresolusi. Lihat
[API ingress saluran](/id/plugins/sdk-channel-ingress) untuk desain API,
batas kepemilikan, dan ekspektasi pengujian.

### Indikator pengetikan

Jika saluran Anda mendukung indikator pengetikan di luar balasan masuk, ekspos
`heartbeat.sendTyping(...)` pada plugin saluran. Inti memanggilnya dengan
target pengiriman Heartbeat yang telah diresolusi sebelum proses model Heartbeat dimulai dan
menggunakan siklus hidup bersama untuk menjaga pengetikan tetap aktif dan melakukan pembersihan. Tambahkan
`heartbeat.clearTyping(...)` ketika platform memerlukan sinyal berhenti eksplisit.

### Parameter sumber media

Jika saluran Anda menambahkan parameter alat pesan yang membawa sumber media, ekspos
nama parameter tersebut melalui `plugin.actions.describeMessageTool(...).mediaSourceParams`.
Inti menggunakan daftar eksplisit tersebut untuk normalisasi jalur sandbox dan kebijakan
akses media keluar, sehingga plugin tidak memerlukan kasus khusus inti bersama untuk
parameter avatar, lampiran, atau gambar sampul khusus penyedia.

Utamakan peta berbasis kunci tindakan seperti `{ "set-profile": ["avatarUrl", "avatarPath"] }`
agar tindakan yang tidak terkait tidak mewarisi argumen media tindakan lain. Array datar
tetap dapat digunakan untuk parameter yang sengaja dibagikan ke setiap tindakan yang diekspos.

Channel yang harus mengekspos URL publik sementara untuk pengambilan media
di sisi platform dapat menggunakan `createHostedOutboundMediaStore(...)` dari
`openclaw/plugin-sdk/outbound-media` dengan penyimpanan status plugin. Pertahankan penguraian
rute platform dan penerapan token di plugin channel; helper bersama hanya
menangani pemuatan media, metadata kedaluwarsa, baris chunk, dan pembersihan.

### Pembentukan payload native

Jika channel Anda memerlukan pembentukan khusus penyedia untuk `message(action="send")`,
utamakan `actions.prepareSendPayload(...)`. Letakkan kartu native, blok, sematan, atau
data persisten lainnya di bawah `payload.channelData.<channel>` dan biarkan inti mengirimkannya
melalui adaptor outbound/pesan. Gunakan `actions.handleAction(...)` untuk pengiriman
hanya sebagai fallback kompatibilitas bagi payload yang tidak dapat diserialisasi dan
dicoba ulang.

### Tata bahasa percakapan sesi

Jika platform Anda menyimpan cakupan tambahan di dalam id percakapan, pertahankan penguraiannya
di plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah
hook kanonis untuk memetakan `rawId` ke id percakapan dasar, id
utas opsional, `baseConversationId` eksplisit, dan
`parentConversationCandidates` apa pun. Saat Anda mengembalikan `parentConversationCandidates`,
urutkan dari induk yang paling sempit hingga percakapan terluas/dasar.

`messaging.resolveParentConversationCandidates(...)` adalah fallback
kompatibilitas yang tidak digunakan lagi untuk plugin yang hanya memerlukan fallback induk di atas
id generik/mentah. Jika kedua hook tersedia, inti menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
beralih ke `resolveParentConversationCandidates(...)` ketika hook kanonis
tidak menyertakannya.

Plugin bawaan yang memerlukan penguraian yang sama sebelum registri channel dimulai
dapat mengekspos file `session-key-api.ts` tingkat atas dengan ekspor
`resolveSessionConversation(...)` yang sesuai (lihat plugin Feishu dan Telegram).
Inti menggunakan permukaan yang aman untuk bootstrap tersebut hanya ketika registri plugin
runtime belum tersedia.

Gunakan `openclaw/plugin-sdk/channel-route` ketika kode plugin perlu menormalisasi
bidang menyerupai rute, membandingkan utas anak dengan rute induknya, atau membuat
kunci deduplikasi stabil dari `{ channel, to, accountId, threadId }`. Helper tersebut
menormalisasi id utas numerik dengan cara yang sama seperti inti, jadi utamakan ini daripada
perbandingan `String(threadId)` ad hoc. Plugin dengan tata bahasa target khusus penyedia
harus mengekspos `messaging.resolveOutboundSessionRoute(...)` agar inti memperoleh
identitas sesi dan utas native penyedia tanpa shim parser.

### Dukungan pengikatan percakapan dengan cakupan akun

Tetapkan `conversationBindings.supportsCurrentConversationBinding` ketika channel
mendukung pengikatan generik percakapan saat ini. `createChatChannelPlugin(...)`
menetapkan kapabilitas statis ini ke `true` secara default.

Jika dukungan berbeda menurut akun yang dikonfigurasi, implementasikan juga
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
Inti mengevaluasi hook sinkron ini hanya setelah kapabilitas statis
diaktifkan. Mengembalikan `false` membuat operasi kapabilitas generik
percakapan saat ini, pengikatan, pencarian, pencantuman, pembaruan, dan pelepasan pengikatan tidak tersedia
untuk akun tersebut. Menghilangkan hook akan menerapkan kapabilitas statis ke setiap akun.

Tentukan jawaban dari konfigurasi akun atau status runtime yang sudah dimuat. Hook ini
hanya mengatur pengikatan generik percakapan saat ini; hook ini tidak menggantikan
aturan pengikatan yang dikonfigurasi atau perutean sesi milik plugin. Pengujian kontrak
harus mencakup setidaknya satu akun yang didukung dan satu yang tidak didukung melalui
kontrak `ChannelPlugin["conversationBindings"]` yang diekspor oleh
`openclaw/plugin-sdk/channel-core`.

## Persetujuan dan kapabilitas channel

Sebagian besar plugin channel tidak memerlukan kode khusus persetujuan. Inti menangani
`/approve` dalam percakapan yang sama, payload tombol persetujuan bersama, dan pengiriman
fallback generik. `ChannelPlugin.approvals` telah dihapus; tempatkan fakta
pengiriman/native/render/autentikasi persetujuan pada satu objek `approvalCapability`.
`plugin.auth` hanya untuk login/logout - inti tidak lagi membaca hook autentikasi
persetujuan dari objek tersebut.

Gunakan `approvalCapability.delivery` hanya untuk perutean persetujuan native atau penekanan
fallback, dan `approvalCapability.render` hanya ketika suatu channel benar-benar memerlukan
payload persetujuan khusus alih-alih perender bersama.

### Autentikasi persetujuan

- `approvalCapability.authorizeActorAction` dan
  `approvalCapability.getActionAvailabilityState` adalah seam
  autentikasi persetujuan kanonis.
- Gunakan `getActionAvailabilityState` untuk ketersediaan autentikasi persetujuan dalam percakapan yang sama.
  Pertahankan pemberi persetujuan yang dikonfigurasi agar tersedia untuk `/approve` bahkan ketika pengiriman native
  dinonaktifkan; gunakan status permukaan awal native untuk panduan pengiriman/penyiapan
  sebagai gantinya.
- Jika channel Anda mengekspos persetujuan eksekusi native, gunakan
  `approvalCapability.getExecInitiatingSurfaceState` untuk status
  permukaan awal/klien native ketika status tersebut berbeda dari autentikasi
  persetujuan dalam percakapan yang sama. Inti menggunakan hook khusus eksekusi tersebut untuk membedakan `enabled` dan
  `disabled`, menentukan apakah channel awal mendukung persetujuan eksekusi
  native, dan menyertakan channel tersebut dalam panduan fallback klien native.
  `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk
  kasus umum.
- Jika channel dapat menyimpulkan identitas DM stabil yang menyerupai pemilik dari konfigurasi yang ada,
  gunakan `createResolvedApproverActionAuthAdapter` dari
  `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` dalam percakapan yang sama
  tanpa menambahkan logika inti khusus persetujuan.
- Jika autentikasi persetujuan khusus sengaja hanya mengizinkan fallback dalam percakapan yang sama, kembalikan
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` dari
  `openclaw/plugin-sdk/approval-auth-runtime`; jika tidak, inti memperlakukan
  hasil tersebut sebagai otorisasi eksplisit pemberi persetujuan.
- Jika callback native milik channel menyelesaikan persetujuan secara langsung, gunakan
  `isImplicitSameChatApprovalAuthorization(...)` sebelum menyelesaikannya agar
  fallback implisit tetap melalui otorisasi aktor normal milik channel.

### Siklus hidup payload dan panduan penyiapan

- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau
  `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload
  khusus channel, seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator
  pengetikan sebelum pengiriman.
- Gunakan `approvalCapability.describeExecApprovalSetup` ketika channel ingin
  balasan pada jalur yang dinonaktifkan menjelaskan pengaturan konfigurasi tepat yang diperlukan untuk mengaktifkan
  persetujuan eksekusi native. Hook menerima `{ channel, channelLabel, accountId }`;
  channel dengan akun bernama harus merender jalur dengan cakupan akun seperti
  `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih nilai default
  tingkat atas.
- Gunakan `approvalCapability.describePluginApprovalSetup` ketika panduan kegagalan
  persetujuan plugin aman ditampilkan untuk kegagalan tanpa rute dan batas waktu
  persetujuan plugin. `createApproverRestrictedNativeApprovalCapability(...)` tidak
  menyimpulkan hal ini dari `describeExecApprovalSetup`; teruskan helper yang sama secara eksplisit
  hanya ketika persetujuan plugin dan eksekusi benar-benar menggunakan penyiapan native yang sama.

### Pengiriman persetujuan native

Jika channel memerlukan pengiriman persetujuan native, pertahankan kode channel agar berfokus pada
normalisasi target serta fakta transportasi/presentasi. Gunakan
`createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`,
`createChannelApproverDmTargetResolver`, dan
`createApproverRestrictedNativeApprovalCapability` dari
`openclaw/plugin-sdk/approval-runtime`. Tempatkan fakta khusus channel di balik
`approvalCapability.nativeRuntime`, idealnya melalui
`createChannelApprovalNativeRuntimeAdapter(...)` atau
`createLazyChannelApprovalNativeRuntimeAdapter(...)`, agar inti dapat menyusun
handler dan menangani pemfilteran permintaan, perutean, deduplikasi, kedaluwarsa, langganan
Gateway, serta pemberitahuan bahwa permintaan dirutekan ke tempat lain.

`nativeRuntime` dibagi menjadi beberapa seam yang lebih kecil:

- `availability` - apakah akun telah dikonfigurasi dan apakah suatu permintaan
  harus ditangani
- `presentation` - memetakan model tampilan persetujuan bersama menjadi
  payload native yang tertunda/diselesaikan/kedaluwarsa atau tindakan akhir
- `transport` - menyiapkan target serta mengirim/memperbarui/menghapus pesan
  persetujuan native
- `interactions` - hook opsional untuk mengikat/melepas ikatan/menghapus tindakan bagi tombol
  atau reaksi native, serta hook `cancelDelivered` opsional. Implementasikan
  `cancelDelivered` ketika `deliverPending` mendaftarkan status dalam proses atau persisten
  (seperti penyimpanan target reaksi) agar status tersebut dapat dilepas jika
  penghentian handler membatalkan pengiriman sebelum `bindPending` dijalankan, atau ketika
  `bindPending` tidak mengembalikan handle
- `observe` - hook diagnostik pengiriman opsional

Helper persetujuan lainnya:

- Gunakan `createNativeApprovalChannelRouteGates` dari
  `openclaw/plugin-sdk/approval-native-runtime` ketika suatu kanal mendukung pengiriman native asal sesi
  sekaligus target penerusan persetujuan eksplisit. Helper ini memusatkan
  pemilihan konfigurasi persetujuan, penanganan `mode`, filter agen/sesi,
  pengikatan akun, pencocokan target sesi, dan pencocokan daftar target,
  sementara pemanggil tetap menangani id kanal, mode penerusan default,
  pencarian akun, pemeriksaan apakah transport diaktifkan, normalisasi target,
  dan resolusi target sumber giliran. Jangan gunakan helper ini untuk membuat
  default kebijakan kanal yang dimiliki core; teruskan mode default yang
  didokumentasikan untuk kanal tersebut secara eksplisit.
- `createChannelNativeOriginTargetResolver` secara default menggunakan pencocok
  rute kanal bersama untuk target `{ to, accountId, threadId }`. Teruskan
  `targetsMatch` hanya ketika suatu kanal memiliki aturan ekuivalensi khusus penyedia,
  seperti pencocokan prefiks stempel waktu Slack. Teruskan `normalizeTargetForMatch` ketika
  kanal perlu mengkanonisasi id penyedia sebelum pencocok rute default
  atau callback `targetsMatch` khusus dijalankan, sembari mempertahankan
  target asli untuk pengiriman. Gunakan `normalizeTarget` hanya ketika target
  pengiriman yang telah diresolusi itu sendiri harus dikanonisasi.
- Jika kanal memerlukan objek yang dimiliki runtime seperti klien, token, aplikasi
  Bolt, atau penerima webhook, daftarkan objek tersebut melalui
  `openclaw/plugin-sdk/channel-runtime-context`. Registri konteks runtime generik
  memungkinkan core melakukan bootstrap handler berbasis kapabilitas dari status
  awal kanal tanpa menambahkan kode penghubung pembungkus khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau
  `createChannelNativeApprovalRuntime` tingkat lebih rendah hanya ketika seam berbasis kapabilitas
  belum cukup ekspresif.
- Kanal persetujuan native harus merutekan `accountId` dan `approvalKind`
  melalui helper tersebut. `accountId` menjaga agar kebijakan persetujuan
  multiakun tetap terbatas pada akun bot yang tepat, dan `approvalKind` menjaga
  agar perilaku persetujuan exec dibanding Plugin tetap tersedia bagi kanal tanpa
  cabang yang di-hardcode dalam core.
- Core juga menangani pemberitahuan perutean ulang persetujuan. Plugin kanal tidak
  boleh mengirim pesan tindak lanjutnya sendiri tentang "persetujuan dialihkan ke DM / kanal lain"
  dari `createChannelNativeApprovalRuntime`; sebagai gantinya, tampilkan perutean asal +
  DM pemberi persetujuan yang akurat melalui helper kapabilitas persetujuan bersama dan biarkan
  core mengagregasi pengiriman aktual sebelum mengirim pemberitahuan apa pun kembali ke
  obrolan yang memulai.
- Pertahankan jenis id persetujuan yang dikirimkan secara menyeluruh. Klien native tidak
  boleh menebak atau menulis ulang perutean persetujuan exec dibanding Plugin dari status
  lokal kanal.
- Teruskan `approvalKind` eksplisit tersebut ke `resolveApprovalOverGateway`. Ini menggunakan
  layanan `approval.resolve` kanonis dan mengembalikan pemenang yang tercatat ketika
  permukaan lain menjawab terlebih dahulu. Input `resolveMethod` eksplisit yang lebih lama
  tetap tersedia untuk kontrol berbasis perintah; tindakan native baru tidak boleh
  menggunakannya atau menyimpulkan jenis dari ID.
- Jenis persetujuan yang berbeda dapat secara sengaja menampilkan permukaan native
  yang berbeda. Contoh bawaan saat ini: Matrix mempertahankan perutean DM/kanal
  native dan UX reaksi yang sama untuk persetujuan exec dan Plugin, sembari tetap
  memungkinkan autentikasi berbeda berdasarkan jenis persetujuan; Slack mempertahankan
  ketersediaan perutean persetujuan native untuk id exec dan Plugin.
- `createApproverRestrictedNativeApprovalAdapter` masih tersedia sebagai
  pembungkus kompatibilitas, tetapi kode baru sebaiknya mengutamakan builder kapabilitas
  dan menampilkan `approvalCapability` pada Plugin.

### Subjalur runtime persetujuan yang lebih sempit

Untuk titik masuk kanal yang sering digunakan, utamakan subjalur yang lebih sempit ini daripada barrel
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

- `openclaw/plugin-sdk/setup-runtime` mencakup helper penyiapan yang aman untuk runtime:
  `createSetupTranslator`, adaptor patch penyiapan yang aman untuk impor
  (`createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), keluaran catatan pencarian,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder
  proksi penyiapan yang didelegasikan.
- `openclaw/plugin-sdk/channel-setup` mencakup builder penyiapan
  instalasi opsional serta beberapa primitif yang aman untuk penyiapan: `createOptionalChannelSetupSurface`,
  `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`,
  `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`,
  `setSetupChannelEnabled`, dan `splitSetupEntries`.
- Gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya ketika Anda juga memerlukan
  helper penyiapan/konfigurasi bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Jika kanal Anda hanya ingin menampilkan "instal Plugin ini terlebih dahulu" pada permukaan
penyiapan, utamakan `createOptionalChannelSetupSurface(...)`. Adaptor/wizard
yang dihasilkan menerapkan gagal-tertutup pada penulisan konfigurasi dan finalisasi, serta menggunakan
kembali pesan wajib-instal yang sama dalam validasi, finalisasi, dan teks tautan
dokumentasi.

Jika kanal Anda mendukung penyiapan atau autentikasi berbasis env dan alur
startup/konfigurasi generik harus mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan
nama tersebut dalam manifes Plugin dengan `channelEnvVars`. Pertahankan `envVars` runtime kanal atau
konstanta lokal hanya untuk teks yang ditujukan kepada operator.

Jika kanal Anda dapat muncul dalam `status`, `channels list`, `channels status`, atau
pemindaian SecretRef sebelum runtime Plugin dimulai, tambahkan `openclaw.setupEntry` dalam
`package.json`. Titik masuk tersebut harus aman untuk diimpor dalam jalur perintah
hanya-baca dan harus mengembalikan metadata kanal, adaptor konfigurasi yang aman
untuk penyiapan, adaptor status, serta metadata target rahasia kanal yang diperlukan
untuk ringkasan tersebut. Jangan memulai klien, listener, atau runtime transport
dari entri penyiapan.

Pertahankan pula jalur impor entri kanal utama agar tetap sempit. Penemuan dapat mengevaluasi
entri dan modul Plugin kanal untuk mendaftarkan kapabilitas tanpa
mengaktifkan kanal. Berkas seperti `channel-plugin-api.ts` harus mengekspor
objek Plugin kanal tanpa mengimpor wizard penyiapan, klien
transport, listener soket, peluncur subproses, atau modul startup layanan.
Tempatkan bagian runtime tersebut dalam modul yang dimuat dari `registerFull(...)`, setter
runtime, atau adaptor kapabilitas malas.

### Subjalur kanal sempit lainnya

Untuk jalur kanal lain yang sering digunakan, utamakan helper sempit daripada permukaan lama
yang lebih luas:

- `openclaw/plugin-sdk/account-core`, `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk konfigurasi multiakun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/channel-inbound` untuk rute/amplop masuk serta
  pengkabelan pencatatan-dan-pengiriman
- `openclaw/plugin-sdk/channel-targets` untuk helper penguraian target
- `openclaw/plugin-sdk/outbound-media` untuk pemuatan media dan
  `openclaw/plugin-sdk/channel-outbound` untuk delegasi identitas/pengiriman keluar
  serta perencanaan payload
- `buildThreadAwareOutboundSessionRoute(...)` dari
  `openclaw/plugin-sdk/channel-core` ketika rute keluar harus mempertahankan
  `replyToId`/`threadId` eksplisit atau memulihkan sesi `:thread:`
  saat ini setelah kunci sesi dasar masih cocok. Plugin penyedia dapat
  mengganti prioritas, perilaku sufiks, dan normalisasi id utas ketika
  platformnya memiliki semantik pengiriman utas native.
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup pengikatan utas
  dan pendaftaran adaptor
- `openclaw/plugin-sdk/agent-media-payload` hanya ketika tata letak kolom payload
  agen/media lama masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` (tidak digunakan lagi: tidak ada Plugin
  bawaan yang menggunakannya dalam produksi) untuk normalisasi perintah khusus Telegram,
  validasi duplikat/konflik, dan kontrak konfigurasi perintah yang stabil terhadap
  fallback; utamakan penanganan konfigurasi perintah lokal Plugin untuk kode Plugin baru

Kanal yang hanya menyediakan autentikasi biasanya cukup menggunakan jalur default: core menangani
persetujuan dan Plugin hanya menampilkan kapabilitas keluar/autentikasi. Kanal
persetujuan native seperti Matrix, Slack, Telegram, dan transport obrolan khusus
harus menggunakan helper native bersama alih-alih membuat sendiri siklus hidup
persetujuan.

## Kebijakan penyebutan masuk

Pisahkan penanganan penyebutan masuk dalam dua lapisan:

- pengumpulan bukti yang dimiliki Plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan penyebutan.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya ketika Anda memerlukan barrel
helper masuk yang lebih luas.

Cocok untuk logika lokal Plugin:

- deteksi balasan kepada bot
- deteksi bot yang dikutip
- pemeriksaan partisipasi utas
- pengecualian pesan layanan/sistem
- cache native platform yang diperlukan untuk membuktikan partisipasi bot

Cocok untuk helper bersama:

- `requireMention`
- hasil penyebutan eksplisit
- daftar izin penyebutan implisit
- pengabaian untuk perintah
- keputusan akhir untuk melewati

Alur yang disarankan:

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

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`matchesMentionWithExplicit(...)` mengembalikan boolean. `hasAnyMention`,
`isExplicitlyMentioned`, dan `canResolveExplicit` berasal dari metadata
penyebutan native milik kanal itu sendiri (entitas pesan, penanda balasan kepada bot, dan sejenisnya);
berikan nilai `false`/`undefined` ketika platform Anda tidak dapat mendeteksinya.

`api.runtime.channel.mentions` menampilkan helper penyebutan bersama yang sama untuk
Plugin kanal bawaan yang sudah bergantung pada injeksi runtime:
`buildMentionRegexes`, `matchesMentionPatterns`, `matchesMentionWithExplicit`,
`implicitMentionKindWhen`, `resolveInboundMentionDecision`.

Jika Anda hanya memerlukan `implicitMentionKindWhen` dan `resolveInboundMentionDecision`,
impor dari `openclaw/plugin-sdk/channel-mention-gating` agar tidak memuat
helper runtime masuk yang tidak terkait.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifes">
    Buat file Plugin standar. Bidang `channels` di
    `openclaw.plugin.json` (bukan bidang `kind`) adalah penanda bahwa manifes
    memiliki sebuah saluran. Untuk keseluruhan metadata paket, lihat
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
      "description": "Plugin saluran Acme Chat",
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
    pengaturan milik Plugin yang bukan merupakan konfigurasi akun saluran.
    `channelConfigs.acme-chat.schema` memvalidasi `channels.acme-chat` dan merupakan
    sumber jalur dingin yang digunakan oleh skema konfigurasi, penyiapan, dan permukaan UI sebelum
    runtime Plugin dimuat. Lihat [Manifes Plugin](/id/plugins/manifest) untuk referensi
    lengkap bidang tingkat atas.

  </Step>

  <Step title="Buat objek Plugin saluran">
    Antarmuka `ChannelPlugin` memiliki banyak permukaan adaptor opsional. Mulailah dengan
    kebutuhan minimum - `id`, `config`, dan `setup` - lalu tambahkan adaptor sesuai
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
        // Resolusi/pemeriksaan akun berada di `config`, bukan `setup`.
        // `setup` mencakup penulisan orientasi (applyAccountConfig, validateInput).
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

      // Pemasangan: alur persetujuan bagi kontak DM baru
      pairing: {
        text: {
          idLabel: "Nama pengguna Acme Chat",
          message: "Kirim kode ini untuk memverifikasi identitas Anda:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Kode pemasangan: ${code}`);
          },
        },
      },

      // Utas: cara balasan dikirimkan
      threading: { topLevelReplyToMode: "reply" },

      // Keluar: mengirim pesan ke platform
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

    Untuk saluran yang menerima kunci DM tingkat atas kanonis maupun kunci bertingkat lama, gunakan pembantu dari `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, dan `normalizeChannelDmPolicy` mempertahankan nilai lokal akun agar didahulukan daripada nilai akar yang diwarisi. Pasangkan resolver yang sama dengan perbaikan doctor melalui `normalizeLegacyDmAliases` agar runtime dan migrasi membaca kontrak yang sama.

    <Accordion title="Yang dilakukan createChatChannelPlugin untuk Anda">
      Alih-alih menerapkan antarmuka adaptor tingkat rendah secara manual, Anda memberikan
      opsi deklaratif dan pembuat akan menyusunnya:

      | Opsi | Yang dihubungkannya |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM terbatas dari bidang konfigurasi |
      | `pairing.text` | Alur pemasangan DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode balas-ke (tetap, terbatas pada akun, atau khusus) |
      | `outbound.attachedResults` | Fungsi pengiriman yang mengembalikan metadata hasil (ID pesan); memerlukan ID saudara `channel` agar inti dapat mencap hasil pengiriman yang dikembalikan |

      Anda juga dapat memberikan objek adaptor mentah sebagai pengganti opsi deklaratif
      jika memerlukan kendali penuh.

      Adaptor keluar mentah dapat mendefinisikan fungsi `chunker(text, limit, ctx)`.
      `ctx.formatting` opsional membawa keputusan pemformatan pada waktu pengiriman
      seperti `maxLinesPerMessage`; terapkan sebelum mengirim agar pengutasan balasan
      dan batas potongan diselesaikan satu kali oleh pengiriman keluar bersama.
      Konteks pengiriman juga menyertakan `replyToIdSource` (`implicit` atau `explicit`)
      ketika target balasan native telah diselesaikan, sehingga pembantu payload dapat mempertahankan
      tag balasan eksplisit tanpa menggunakan slot balasan sekali pakai yang implisit.
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
      description: "Plugin saluran Acme Chat",
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

    Tempatkan deskriptor CLI milik saluran di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya dalam bantuan akar tanpa mengaktifkan runtime saluran penuh,
    sedangkan pemuatan penuh normal tetap mengambil deskriptor yang sama untuk pendaftaran
    perintah sebenarnya. Gunakan `registerFull(...)` hanya untuk pekerjaan runtime.
    `defineChannelPluginEntry` menangani pemisahan mode pendaftaran secara otomatis.
    Jika `registerFull(...)` mendaftarkan metode RPC Gateway, gunakan
    prefiks khusus Plugin. Namespace admin inti (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    diresolusikan ke `operator.admin`. Lihat
    [Titik Masuk](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsi.

  </Step>

  <Step title="Tambahkan entri penyiapan">
    Buat `setup-entry.ts` untuk pemuatan ringan selama orientasi:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat entri ini sebagai pengganti entri penuh ketika saluran dinonaktifkan
    atau belum dikonfigurasi. Hal ini menghindari pemuatan kode runtime berat selama alur penyiapan.
    Lihat [Penyiapan dan Konfigurasi](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Saluran ruang kerja bawaan yang memisahkan ekspor aman-penyiapan ke dalam modul
    sidecar dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` ketika juga memerlukan
    penyetel runtime waktu penyiapan yang eksplisit.

  </Step>

  <Step title="Tangani pesan masuk">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola umumnya adalah Webhook yang memverifikasi permintaan dan
    meneruskannya melalui penangan masuk saluran Anda:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autentikasi yang dikelola Plugin (verifikasi tanda tangan sendiri)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Penangan masuk Anda meneruskan pesan ke OpenClaw.
          // Penghubungan persisnya bergantung pada SDK platform Anda -
          // lihat contoh nyata dalam paket Plugin bawaan Microsoft Teams atau Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Penanganan pesan masuk bersifat khusus untuk setiap saluran. Setiap Plugin saluran memiliki
      pipeline masuknya sendiri. Lihat Plugin saluran bawaan
      (misalnya paket Plugin Microsoft Teams atau Google Chat) untuk pola nyata.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Uji">
Tulis pengujian yang ditempatkan berdampingan di `src/channel.test.ts`:

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

    Untuk pembantu pengujian bersama, lihat [Pengujian](/id/plugins/sdk-testing).

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
  <Card title="Opsi penguntaian" icon="git-branch" href="/id/plugins/sdk-entrypoints#registration-mode">
    Mode balasan tetap, tercakup akun, atau khusus
  </Card>
  <Card title="Integrasi alat pesan" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool dan penemuan tindakan
  </Card>
  <Card title="Resolusi target" icon="crosshair" href="/id/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Pembantu runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagen melalui api.runtime
  </Card>
  <Card title="API masuk kanal" icon="bolt" href="/id/plugins/sdk-channel-inbound">
    Siklus hidup peristiwa masuk bersama: serap, selesaikan, catat, kirim, finalisasi
  </Card>
</CardGroup>

<Note>
Beberapa sambungan pembantu terpaket masih tersedia untuk pemeliharaan plugin terpaket dan
kompatibilitas. Sambungan tersebut bukan pola yang direkomendasikan untuk plugin kanal baru;
utamakan subjalur kanal/penyiapan/balasan/runtime generik dari permukaan SDK
umum, kecuali Anda memelihara keluarga plugin terpaket tersebut secara langsung.
</Note>

## Langkah berikutnya

- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - jika plugin Anda juga menyediakan model
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi impor subjalur lengkap
- [Pengujian SDK](/id/plugins/sdk-testing) - utilitas pengujian dan pengujian kontrak
- [Manifes Plugin](/id/plugins/manifest) - skema manifes lengkap

## Terkait

- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
