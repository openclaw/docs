---
read_when:
    - Anda sedang membangun Plugin saluran perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami permukaan adaptor ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun Plugin saluran perpesanan untuk OpenClaw
title: Membangun Plugin kanal
x-i18n:
    generated_at: "2026-07-02T22:49:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Panduan ini menjelaskan cara membangun Plugin kanal yang menghubungkan OpenClaw ke
platform perpesanan. Pada akhirnya, Anda akan memiliki kanal yang berfungsi dengan keamanan DM,
penyandingan, penguliran balasan, dan perpesanan keluar.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket dasar
  dan penyiapan manifes.
</Info>

## Cara kerja Plugin kanal

Plugin kanal tidak memerlukan alat kirim/edit/reaksi miliknya sendiri. OpenClaw mempertahankan satu
alat `message` bersama di core. Plugin Anda memiliki:

- **Konfigurasi** - resolusi akun dan wizard penyiapan
- **Keamanan** - kebijakan DM dan daftar izinkan
- **Penyandingan** - alur persetujuan DM
- **Tata bahasa sesi** - cara id percakapan khusus penyedia dipetakan ke obrolan dasar, id utas, dan fallback induk
- **Keluar** - mengirim teks, media, dan polling ke platform
- **Penguliran** - cara balasan diutas
- **Pengetikan Heartbeat** - sinyal mengetik/sibuk opsional untuk target pengiriman Heartbeat

Core memiliki alat pesan bersama, pengawatan prompt, bentuk kunci sesi luar,
pembukuan `:thread:` generik, dan dispatch.

Plugin kanal baru juga harus mengekspos adapter `message` dengan
`defineChannelMessageAdapter` dari `openclaw/plugin-sdk/channel-outbound`. Adapter
mendeklarasikan kemampuan pengiriman final tahan lama yang benar-benar didukung oleh transport native
dan mengarahkan pengiriman teks/media ke fungsi transport yang sama seperti
adapter `outbound` lama. Deklarasikan kemampuan hanya ketika uji kontrak
membuktikan efek samping native dan tanda terima yang dikembalikan.
Untuk kontrak API lengkap, contoh, matriks kemampuan, aturan tanda terima, finalisasi
pratinjau langsung, kebijakan ack penerimaan, pengujian, dan tabel migrasi, lihat
[API outbound kanal](/id/plugins/sdk-channel-outbound).
Jika adapter `outbound` yang ada sudah memiliki metode kirim dan
metadata kemampuan yang tepat, gunakan `createChannelMessageAdapterFromOutbound(...)` untuk
menurunkan adapter `message` alih-alih menulis bridge lain secara manual.
Pengiriman adapter harus mengembalikan nilai `MessageReceipt`. Ketika kode kompatibilitas
masih memerlukan id lama, turunkan id tersebut dengan `listMessageReceiptPlatformIds(...)`
atau `resolveMessageReceiptPrimaryId(...)` alih-alih mempertahankan field
`messageIds` paralel dalam kode siklus hidup baru.
Kanal yang mampu melakukan pratinjau juga harus mendeklarasikan `message.live.capabilities` dengan
siklus hidup langsung persis yang mereka miliki, seperti `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming`, atau
`quietFinalization`. Kanal yang memfinalisasi pratinjau draf di tempat juga harus
mendeklarasikan `message.live.finalizer.capabilities`, seperti `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt`, dan
`retainOnAmbiguousFailure`, serta merutekan logika runtime melalui
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)`. Jaga agar kemampuan tersebut didukung
oleh pengujian `verifyChannelMessageLiveCapabilityAdapterProofs(...)` dan
`verifyChannelMessageLiveFinalizerProofs(...)` sehingga perilaku pratinjau native,
progres, edit, fallback/retensi, pembersihan, dan tanda terima tidak dapat bergeser
diam-diam.
Penerima inbound yang menunda pengakuan platform harus mendeklarasikan
`message.receive.defaultAckPolicy` dan `supportedAckPolicies` alih-alih menyembunyikan
waktu ack dalam state lokal monitor. Cakup setiap kebijakan yang dideklarasikan dengan
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Helper balasan lama seperti `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase`, dan `recordInboundSessionAndDispatchReply`
tetap tersedia untuk dispatcher kompatibilitas. Jangan gunakan nama-nama tersebut untuk kode
kanal baru; Plugin baru harus mulai dengan adapter `message`, tanda terima, dan
helper siklus hidup terima/kirim di `openclaw/plugin-sdk/channel-outbound`.

Kanal yang memigrasikan otorisasi inbound dapat menggunakan subpath eksperimental
`openclaw/plugin-sdk/channel-ingress-runtime` dari path penerimaan runtime.
Subpath mempertahankan lookup platform dan efek samping di dalam Plugin, sambil
berbagi resolusi state daftar izinkan, keputusan rute/pengirim/perintah/peristiwa/aktivasi,
diagnostik yang direda, dan pemetaan penerimaan turn. Pertahankan normalisasi
identitas Plugin dalam descriptor yang Anda berikan ke resolver; jangan
menserialisasi nilai match mentah dari state atau keputusan yang di-resolve. Lihat
[API ingress kanal](/id/plugins/sdk-channel-ingress) untuk desain API,
batas kepemilikan, dan ekspektasi pengujian.

Jika kanal Anda mendukung indikator mengetik di luar balasan inbound, ekspos
`heartbeat.sendTyping(...)` pada Plugin kanal. Core memanggilnya dengan
target pengiriman Heartbeat yang di-resolve sebelum run model Heartbeat dimulai dan
menggunakan siklus hidup keepalive/pembersihan pengetikan bersama. Tambahkan `heartbeat.clearTyping(...)`
ketika platform memerlukan sinyal berhenti eksplisit.

Jika kanal Anda menambahkan parameter alat pesan yang membawa sumber media, ekspos nama
parameter tersebut melalui `describeMessageTool(...).mediaSourceParams`. Core menggunakan
daftar eksplisit tersebut untuk normalisasi path sandbox dan kebijakan akses media keluar,
sehingga Plugin tidak memerlukan kasus khusus shared-core untuk parameter avatar, lampiran,
atau gambar sampul khusus penyedia.
Lebih baik mengembalikan peta berbasis kunci aksi seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` sehingga aksi yang tidak terkait tidak
mewarisi argumen media aksi lain. Array datar tetap berfungsi untuk parameter yang
memang sengaja dibagikan di setiap aksi yang diekspos.
Kanal yang harus mengekspos URL publik sementara untuk pengambilan media sisi platform
dapat menggunakan `createHostedOutboundMediaStore(...)` dari
`openclaw/plugin-sdk/outbound-media` dengan penyimpanan state Plugin. Pertahankan
parsing rute platform dan penegakan token di dalam Plugin kanal; helper bersama
hanya memiliki pemuatan media, metadata kedaluwarsa, baris chunk, dan pembersihan.

Jika kanal Anda memerlukan pembentukan khusus penyedia untuk `message(action="send")`,
lebih baik gunakan `actions.prepareSendPayload(...)`. Letakkan kartu native, blok, embed, atau
data tahan lama lain di bawah `payload.channelData.<channel>` dan biarkan core melakukan
pengiriman aktual melalui adapter outbound/message. Gunakan
`actions.handleAction(...)` untuk kirim hanya sebagai fallback kompatibilitas untuk
payload yang tidak dapat diserialisasi dan dicoba ulang.

Jika platform Anda menyimpan scope tambahan di dalam id percakapan, pertahankan parsing tersebut
di Plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah hook
kanonis untuk memetakan `rawId` ke id percakapan dasar, id utas opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates` apa pun.
Ketika Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya dari
induk yang paling sempit hingga percakapan paling luas/dasar.

Gunakan `openclaw/plugin-sdk/channel-route` ketika kode Plugin perlu menormalkan
field mirip rute, membandingkan utas anak dengan rute induknya, atau membangun
kunci dedupe stabil dari `{ channel, to, accountId, threadId }`. Helper tersebut
menormalkan id utas numerik dengan cara yang sama seperti core, sehingga Plugin sebaiknya
menggunakannya alih-alih perbandingan ad hoc `String(threadId)`.
Plugin dengan tata bahasa target khusus penyedia harus mengekspos
`messaging.resolveOutboundSessionRoute(...)` sehingga core mendapatkan identitas
sesi dan utas native penyedia tanpa menggunakan shim parser.

Plugin terbundel yang memerlukan parsing yang sama sebelum registry kanal berjalan
juga dapat mengekspos file tingkat atas `session-key-api.ts` dengan ekspor
`resolveSessionConversation(...)` yang cocok. Core menggunakan permukaan yang aman untuk bootstrap ini
hanya ketika registry Plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai
fallback kompatibilitas lama ketika Plugin hanya memerlukan fallback induk di atas
id generik/mentah. Jika kedua hook ada, core menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
fallback ke `resolveParentConversationCandidates(...)` ketika hook kanonis
menghilangkannya.

## Persetujuan dan kemampuan kanal

Sebagian besar Plugin kanal tidak memerlukan kode khusus persetujuan.

- Core memiliki `/approve` di chat yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Lebih baik gunakan satu objek `approvalCapability` pada Plugin channel saat channel membutuhkan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` dihapus. Letakkan fakta pengiriman/native/render/auth persetujuan pada `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; core tidak lagi membaca hook auth persetujuan dari objek tersebut.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan di chat yang sama. Biarkan approver yang sudah dikonfigurasi tetap tersedia untuk `/approve` bahkan saat pengiriman native dinonaktifkan; gunakan state initiating-surface native untuk panduan pengiriman/setup sebagai gantinya.
- Jika channel Anda mengekspos persetujuan exec native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk state initiating-surface/klien-native saat berbeda dari auth persetujuan di chat yang sama. Core menggunakan hook khusus exec tersebut untuk membedakan `enabled` vs `disabled`, menentukan apakah channel pemicu mendukung persetujuan exec native, dan menyertakan channel dalam panduan fallback klien-native. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload khusus channel seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator mengetik sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk perutean persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native yang dimiliki channel. Pertahankan agar lazy pada entrypoint channel panas dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai kebutuhan sambil tetap memungkinkan core merakit siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya saat channel benar-benar membutuhkan payload persetujuan kustom alih-alih renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` saat channel ingin balasan jalur nonaktif menjelaskan knob konfigurasi persis yang diperlukan untuk mengaktifkan persetujuan exec native. Hook menerima `{ channel, channelLabel, accountId }`; channel akun bernama harus merender path yang tercakup akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default tingkat atas.
- Gunakan `approvalCapability.describePluginApprovalSetup` saat panduan kegagalan persetujuan Plugin aman ditampilkan untuk kegagalan no-route dan timeout persetujuan Plugin. `createApproverRestrictedNativeApprovalCapability(...)` tidak menyimpulkan ini dari `describeExecApprovalSetup`; teruskan helper yang sama secara eksplisit hanya saat persetujuan Plugin dan exec benar-benar menggunakan setup native yang sama.
- Jika channel dapat menyimpulkan identitas DM yang stabil seperti pemilik dari konfigurasi yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` di chat yang sama tanpa menambahkan logika core khusus persetujuan.
- Jika auth persetujuan kustom sengaja hanya mengizinkan fallback chat yang sama, kembalikan `markImplicitSameChatApprovalAuthorization({ authorized: true })` dari `openclaw/plugin-sdk/approval-auth-runtime`; jika tidak, core memperlakukan hasilnya sebagai otorisasi approver eksplisit.
- Jika callback native milik channel menyelesaikan persetujuan secara langsung, gunakan `isImplicitSameChatApprovalAuthorization(...)` sebelum menyelesaikan agar fallback implisit tetap melalui otorisasi aktor normal channel.
- Jika channel membutuhkan pengiriman persetujuan native, jaga kode channel tetap berfokus pada normalisasi target plus fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Letakkan fakta khusus channel di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, agar core dapat merakit handler dan memiliki pemfilteran permintaan, perutean, dedupe, kedaluwarsa, langganan gateway, dan pemberitahuan dirutekan-ke-tempat-lain. `nativeRuntime` dibagi menjadi beberapa seam yang lebih kecil:
- Gunakan `createNativeApprovalChannelRouteGates` dari `openclaw/plugin-sdk/approval-native-runtime` saat channel mendukung pengiriman native asal sesi dan target penerusan persetujuan eksplisit. Helper ini memusatkan pemilihan konfigurasi persetujuan, penanganan `mode`, filter agen/sesi, pengikatan akun, pencocokan target sesi, dan pencocokan daftar target sementara pemanggil tetap memiliki id channel, mode penerusan default, lookup akun, pemeriksaan transport aktif, normalisasi target, dan resolusi target sumber turn. Jangan gunakan ini untuk membuat default kebijakan channel milik core; teruskan mode default terdokumentasi channel secara eksplisit.
- `createChannelNativeOriginTargetResolver` menggunakan pencocok rute channel bersama secara default untuk target `{ to, accountId, threadId }`. Teruskan `targetsMatch` hanya saat channel memiliki aturan ekuivalensi khusus provider, seperti pencocokan prefiks timestamp Slack.
- Teruskan `normalizeTargetForMatch` ke `createChannelNativeOriginTargetResolver` saat channel perlu mengkanoniskan id provider sebelum pencocok rute default atau callback `targetsMatch` kustom berjalan, sambil mempertahankan target asli untuk pengiriman. Gunakan `normalizeTarget` hanya saat target pengiriman yang terselesaikan itu sendiri harus dikanoniskan.
- `availability` - apakah akun sudah dikonfigurasi dan apakah permintaan harus ditangani
- `presentation` - memetakan model tampilan persetujuan bersama menjadi payload native pending/terselesaikan/kedaluwarsa atau aksi akhir
- `transport` - menyiapkan target plus mengirim/memperbarui/menghapus pesan persetujuan native
- `interactions` - hook bind/unbind/clear-action opsional untuk tombol atau reaksi native, plus hook `cancelDelivered` opsional. Implementasikan `cancelDelivered` saat `deliverPending` mendaftarkan state dalam proses atau persisten (seperti penyimpanan target reaksi) agar state tersebut dapat dilepas jika penghentian handler membatalkan pengiriman sebelum `bindPending` berjalan atau saat `bindPending` tidak mengembalikan handle
- `observe` - hook diagnostik pengiriman opsional
- Jika channel membutuhkan objek milik runtime seperti klien, token, aplikasi Bolt, atau penerima webhook, daftarkan melalui `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context generik memungkinkan core mem-bootstrap handler berbasis capability dari state startup channel tanpa menambahkan glue wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` tingkat lebih rendah hanya saat seam berbasis capability belum cukup ekspresif.
- Channel persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap tercakup pada akun bot yang tepat, dan `approvalKind` menjaga perilaku persetujuan exec vs Plugin tersedia untuk channel tanpa cabang hardcoded di core.
- Core kini juga memiliki pemberitahuan reroute persetujuan. Plugin channel tidak boleh mengirim pesan tindak lanjut "persetujuan dikirim ke DM / channel lain" sendiri dari `createChannelNativeApprovalRuntime`; sebagai gantinya, ekspos perutean asal + DM approver yang akurat melalui helper capability persetujuan bersama dan biarkan core mengagregasi pengiriman aktual sebelum memposting pemberitahuan apa pun kembali ke chat pemicu.
- Pertahankan jenis id persetujuan yang dikirimkan dari ujung ke ujung. Klien native tidak boleh
  menebak atau menulis ulang perutean persetujuan exec vs Plugin dari state lokal channel.
- Jenis persetujuan yang berbeda dapat sengaja mengekspos surface native yang berbeda.
  Contoh bundel saat ini:
  - Slack menjaga perutean persetujuan native tersedia untuk id exec dan Plugin.
  - Matrix menjaga perutean DM/channel native dan UX reaksi yang sama untuk persetujuan exec
    dan Plugin, sambil tetap membiarkan auth berbeda berdasarkan jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya menggunakan builder capability dan mengekspos `approvalCapability` pada Plugin.

Untuk entrypoint channel panas, lebih baik gunakan subpath runtime yang lebih sempit saat Anda hanya
membutuhkan satu bagian dari keluarga tersebut:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Demikian pula, lebih baik gunakan `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` saat Anda tidak membutuhkan surface payung
yang lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  `createSetupTranslator`, adapter patch setup yang aman diimpor (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder proxy setup
  yang didelegasikan
- `openclaw/plugin-sdk/setup-runtime` menyertakan seam adapter sadar env untuk
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder setup optional-install
  plus beberapa primitif aman-setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika channel Anda mendukung setup atau auth berbasis env dan alur startup/config
generik harus mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan
di manifes Plugin dengan `channelEnvVars`. Pertahankan `envVars` runtime channel atau konstanta lokal
hanya untuk salinan yang menghadap operator.

Jika channel Anda dapat muncul di `status`, `channels list`, `channels status`, atau
pemindaian SecretRef sebelum runtime Plugin dimulai, tambahkan `openclaw.setupEntry` di
`package.json`. Entrypoint tersebut harus aman diimpor dalam path perintah read-only
dan harus mengembalikan metadata channel, adapter konfigurasi aman-setup, adapter status,
dan metadata target secret channel yang diperlukan untuk ringkasan tersebut. Jangan
memulai klien, listener, atau runtime transport dari entry setup.

Jaga path impor entry channel utama tetap sempit juga. Discovery dapat mengevaluasi
entry dan modul Plugin channel untuk mendaftarkan capability tanpa mengaktifkan
channel. File seperti `channel-plugin-api.ts` harus mengekspor objek Plugin channel
tanpa mengimpor wizard setup, klien transport, listener socket,
peluncur subprocess, atau modul startup layanan. Letakkan bagian runtime tersebut
di modul yang dimuat dari `registerFull(...)`, setter runtime, atau adapter
capability lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya saat Anda juga membutuhkan
  helper setup/config bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika channel Anda hanya ingin mengiklankan "instal Plugin ini terlebih dahulu" di surface
setup, lebih baik gunakan `createOptionalChannelSetupSurface(...)`. Adapter/wizard
yang dihasilkan fail closed pada penulisan konfigurasi dan finalisasi, dan menggunakan ulang
pesan wajib-instal yang sama di seluruh validasi, finalisasi, dan salinan tautan-docs.

Untuk path channel panas lainnya, lebih baik gunakan helper sempit daripada surface legacy
yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk konfigurasi multi-akun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/channel-inbound` untuk rute/envelope masuk dan
  pengkabelan rekam-dan-dispatch
- `openclaw/plugin-sdk/channel-targets` untuk helper parsing target
- `openclaw/plugin-sdk/outbound-media` untuk pemuatan media dan
  `openclaw/plugin-sdk/channel-outbound` untuk identitas keluar/delegasi kirim
  dan perencanaan payload
- `buildThreadAwareOutboundSessionRoute(...)` dari
  `openclaw/plugin-sdk/channel-core` saat rute keluar harus mempertahankan
  `replyToId`/`threadId` eksplisit atau memulihkan sesi `:thread:` saat ini
  setelah kunci sesi dasar masih cocok. Plugin penyedia dapat menimpa
  presedensi, perilaku sufiks, dan normalisasi id thread saat platform mereka
  memiliki semantik pengiriman thread native.
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup pengikatan thread
  dan registrasi adapter
- `openclaw/plugin-sdk/agent-media-payload` hanya saat tata letak field payload
  agen/media legacy masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi perintah kustom
  Telegram, validasi duplikat/konflik, dan kontrak konfigurasi perintah yang
  stabil terhadap fallback

Saluran khusus auth biasanya dapat berhenti di jalur default: core menangani persetujuan dan Plugin hanya mengekspos kemampuan keluar/auth. Saluran persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom sebaiknya menggunakan helper native bersama alih-alih membuat sendiri siklus hidup persetujuannya.

## Kebijakan mention masuk

Pisahkan penanganan mention masuk dalam dua lapisan:

- pengumpulan bukti milik Plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan mention.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya saat Anda memerlukan barrel helper masuk
yang lebih luas.

Cocok untuk logika lokal Plugin:

- deteksi balasan-ke-bot
- deteksi bot-yang-dikutip
- pemeriksaan partisipasi thread
- pengecualian pesan layanan/sistem
- cache native platform yang diperlukan untuk membuktikan partisipasi bot

Cocok untuk helper bersama:

- `requireMention`
- hasil mention eksplisit
- allowlist mention implisit
- bypass perintah
- keputusan skip akhir

Alur yang disarankan:

1. Hitung fakta mention lokal.
2. Teruskan fakta tersebut ke `resolveInboundMentionDecision({ facts, policy })`.
3. Gunakan `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, dan `decision.shouldSkip` di gate masuk Anda.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

`api.runtime.channel.mentions` mengekspos helper mention bersama yang sama untuk
Plugin saluran bawaan yang sudah bergantung pada injeksi runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jika Anda hanya memerlukan `implicitMentionKindWhen` dan
`resolveInboundMentionDecision`, impor dari
`openclaw/plugin-sdk/channel-mention-gating` untuk menghindari pemuatan helper
runtime masuk yang tidak terkait.

Gunakan `resolveInboundMentionDecision({ facts, policy })` untuk gating mention.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifest">
    Buat file Plugin standar. Field `channel` di `package.json` adalah yang
    menjadikan ini Plugin saluran. Untuk permukaan metadata paket lengkap,
    lihat [Penyiapan dan Konfigurasi Plugin](/id/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
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
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` memvalidasi `plugins.entries.acme-chat.config`. Gunakan ini untuk
    pengaturan milik Plugin yang bukan konfigurasi akun saluran. `channelConfigs`
    memvalidasi `channels.acme-chat` dan merupakan sumber cold-path yang digunakan oleh skema
    konfigurasi, penyiapan, dan permukaan UI sebelum runtime Plugin dimuat.

  </Step>

  <Step title="Bangun objek Plugin saluran">
    Antarmuka `ChannelPlugin` memiliki banyak permukaan adapter opsional. Mulailah dengan
    minimum - `id` dan `setup` - lalu tambahkan adapter sesuai kebutuhan.

    Buat `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
      if (!token) throw new Error("acme-chat: token is required");
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
        setup: {
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
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
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

    Untuk saluran yang menerima kunci DM level teratas kanonis dan kunci bertingkat legacy, gunakan helper dari `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, dan `normalizeChannelDmPolicy` menjaga nilai lokal akun tetap lebih dulu daripada nilai root yang diwariskan. Pasangkan resolver yang sama dengan perbaikan doctor melalui `normalizeLegacyDmAliases` agar runtime dan migrasi membaca kontrak yang sama.

    <Accordion title="Apa yang dilakukan createChatChannelPlugin untuk Anda">
      Alih-alih mengimplementasikan antarmuka adapter level rendah secara manual, Anda meneruskan
      opsi deklaratif dan builder menyusunnya:

      | Opsi | Yang dikabelkan |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM berskala dari field konfigurasi |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode reply-to (tetap, berskala akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi kirim yang mengembalikan metadata hasil (ID pesan) |

      Anda juga dapat meneruskan objek adapter mentah alih-alih opsi deklaratif
      jika memerlukan kontrol penuh.

      Adapter keluar mentah dapat mendefinisikan fungsi `chunker(text, limit, ctx)`.
      `ctx.formatting` opsional membawa keputusan pemformatan saat pengiriman
      seperti `maxLinesPerMessage`; terapkan sebelum mengirim agar threading balasan
      dan batas chunk diselesaikan sekali oleh pengiriman keluar bersama.
      Konteks kirim juga menyertakan `replyToIdSource` (`implicit` atau `explicit`)
      saat target balasan native telah diselesaikan, sehingga helper payload dapat mempertahankan
      tag balasan eksplisit tanpa mengonsumsi slot balasan sekali pakai implisit.
    </Accordion>

  </Step>

  <Step title="Hubungkan entry point">
    Buat `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    Letakkan deskriptor CLI milik saluran di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya di bantuan root tanpa mengaktifkan runtime saluran penuh,
    sementara pemuatan penuh normal tetap mengambil deskriptor yang sama untuk pendaftaran
    perintah sebenarnya. Pertahankan `registerFull(...)` untuk pekerjaan khusus runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC Gateway, gunakan prefiks
    khusus plugin. Namespace admin inti (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    di-resolve ke `operator.admin`.
    `defineChannelPluginEntry` menangani pemisahan mode pendaftaran secara otomatis. Lihat
    [Titik Masuk](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsi.

  </Step>

  <Step title="Tambahkan entri setup">
    Buat `setup-entry.ts` untuk pemuatan ringan selama onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat ini alih-alih entri penuh saat saluran dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari penarikan kode runtime yang berat selama alur setup.
    Lihat [Setup dan Konfigurasi](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Saluran workspace bawaan yang memisahkan ekspor yang aman untuk setup ke dalam modul
    sidecar dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` saat mereka juga memerlukan
    setter runtime eksplisit pada waktu setup.

  </Step>

  <Step title="Tangani pesan masuk">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola umumnya adalah Webhook yang memverifikasi permintaan dan
    mengirimkannya melalui handler masuk saluran Anda:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Penanganan pesan masuk bersifat khusus saluran. Setiap plugin saluran memiliki
      pipeline masuknya sendiri. Lihat plugin saluran bawaan
      (misalnya paket plugin Microsoft Teams atau Google Chat) untuk pola nyata.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Uji">
Tulis pengujian yang dikolokasikan di `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Untuk helper pengujian bersama, lihat [Pengujian](/id/plugins/sdk-testing).

</Step>
</Steps>

## Struktur file

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Topik lanjutan

<CardGroup cols={2}>
  <Card title="Opsi threading" icon="git-branch" href="/id/plugins/sdk-entrypoints#registration-mode">
    Mode balasan tetap, berbasis akun, atau kustom
  </Card>
  <Card title="Integrasi alat pesan" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool dan penemuan tindakan
  </Card>
  <Card title="Resolusi target" icon="crosshair" href="/id/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagent melalui api.runtime
  </Card>
  <Card title="API masuk saluran" icon="bolt" href="/id/plugins/sdk-channel-inbound">
    Siklus hidup event masuk bersama: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bawaan masih ada untuk pemeliharaan dan
kompatibilitas plugin bawaan. Itu bukan pola yang direkomendasikan untuk plugin saluran baru;
utamakan subpath saluran/setup/balasan/runtime generik dari permukaan SDK umum
kecuali Anda memelihara langsung keluarga plugin bawaan tersebut.
</Note>

## Langkah berikutnya

- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - jika plugin Anda juga menyediakan model
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi impor subpath lengkap
- [Pengujian SDK](/id/plugins/sdk-testing) - utilitas pengujian dan pengujian kontrak
- [Manifest Plugin](/id/plugins/manifest) - skema manifest lengkap

## Terkait

- [Setup SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
