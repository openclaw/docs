---
read_when:
    - Anda sedang membangun Plugin kanal perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami permukaan adaptor ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun Plugin saluran pesan untuk OpenClaw
title: Membangun Plugin saluran
x-i18n:
    generated_at: "2026-06-27T17:58:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Panduan ini menjelaskan cara membangun Plugin channel yang menghubungkan OpenClaw ke
platform perpesanan. Pada akhirnya, Anda akan memiliki channel yang berfungsi dengan keamanan DM,
pairing, penguliran balasan, dan pengiriman pesan keluar.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket dasar
  dan penyiapan manifest.
</Info>

## Cara kerja Plugin channel

Plugin channel tidak memerlukan alat kirim/edit/reaksi miliknya sendiri. OpenClaw mempertahankan satu
alat `message` bersama di core. Plugin Anda memiliki:

- **Konfigurasi** - resolusi akun dan wizard penyiapan
- **Keamanan** - kebijakan DM dan daftar izin
- **Pairing** - alur persetujuan DM
- **Tata bahasa sesi** - bagaimana id percakapan khusus penyedia dipetakan ke chat dasar, id thread, dan fallback induk
- **Keluar** - mengirim teks, media, dan polling ke platform
- **Penguliran** - bagaimana balasan di-thread
- **Pengetikan Heartbeat** - sinyal mengetik/sibuk opsional untuk target pengiriman Heartbeat

Core memiliki alat pesan bersama, pengkabelan prompt, bentuk session-key luar,
pembukuan `:thread:` generik, dan dispatch.

Plugin channel baru juga harus mengekspos adapter `message` dengan
`defineChannelMessageAdapter` dari `openclaw/plugin-sdk/channel-outbound`. Adapter
mendeklarasikan kemampuan final-send tahan lama mana yang benar-benar didukung transport native
dan mengarahkan pengiriman teks/media ke fungsi transport yang sama dengan
adapter `outbound` lama. Deklarasikan kemampuan hanya ketika uji kontrak
membuktikan efek samping native dan receipt yang dikembalikan.
Untuk kontrak API lengkap, contoh, matriks kemampuan, aturan receipt, finalisasi
pratinjau live, kebijakan receive ack, pengujian, dan tabel migrasi, lihat
[API channel outbound](/id/plugins/sdk-channel-outbound).
Jika adapter `outbound` yang ada sudah memiliki metode kirim dan metadata
kemampuan yang tepat, gunakan `createChannelMessageAdapterFromOutbound(...)` untuk
menurunkan adapter `message` alih-alih menulis bridge lain secara manual.
Pengiriman adapter harus mengembalikan nilai `MessageReceipt`. Ketika kode kompatibilitas
masih membutuhkan id lama, turunkan dengan `listMessageReceiptPlatformIds(...)`
atau `resolveMessageReceiptPrimaryId(...)` alih-alih mempertahankan field
`messageIds` paralel dalam kode lifecycle baru.
Channel yang mendukung pratinjau juga harus mendeklarasikan `message.live.capabilities` dengan
lifecycle live persis yang mereka miliki, seperti `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming`, atau
`quietFinalization`. Channel yang memfinalisasi pratinjau draft di tempat juga harus
mendeklarasikan `message.live.finalizer.capabilities`, seperti `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt`, dan
`retainOnAmbiguousFailure`, serta merutekan logika runtime melalui
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)`. Pastikan kemampuan tersebut didukung
oleh pengujian `verifyChannelMessageLiveCapabilityAdapterProofs(...)` dan
`verifyChannelMessageLiveFinalizerProofs(...)` agar perilaku pratinjau native,
progres, edit, fallback/retensi, pembersihan, dan receipt tidak dapat menyimpang
secara diam-diam.
Receiver inbound yang menunda acknowledgement platform harus mendeklarasikan
`message.receive.defaultAckPolicy` dan `supportedAckPolicies` alih-alih menyembunyikan
timing ack dalam state lokal monitor. Cakup setiap kebijakan yang dideklarasikan dengan
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Helper balasan lama seperti `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase`, dan `recordInboundSessionAndDispatchReply`
tetap tersedia untuk dispatcher kompatibilitas. Jangan gunakan nama-nama tersebut untuk kode
channel baru; Plugin baru harus mulai dengan adapter `message`, receipt, dan
helper lifecycle receive/send di `openclaw/plugin-sdk/channel-outbound`.

Channel yang memigrasikan otorisasi inbound dapat menggunakan subpath eksperimental
`openclaw/plugin-sdk/channel-ingress-runtime` dari path receive runtime.
Subpath mempertahankan lookup platform dan efek samping di Plugin, sambil
berbagi resolusi state daftar izin, keputusan rute/pengirim/perintah/event/aktivasi,
diagnostik yang disunting, dan pemetaan turn-admission. Pertahankan normalisasi
identitas Plugin dalam descriptor yang Anda teruskan ke resolver; jangan
menserialisasi nilai match mentah dari state atau keputusan yang di-resolve. Lihat
[API channel ingress](/id/plugins/sdk-channel-ingress) untuk desain API,
batas kepemilikan, dan ekspektasi pengujian.

Jika channel Anda mendukung indikator mengetik di luar balasan inbound, ekspos
`heartbeat.sendTyping(...)` pada Plugin channel. Core memanggilnya dengan
target pengiriman Heartbeat yang telah di-resolve sebelum model Heartbeat berjalan dimulai dan
menggunakan lifecycle keepalive/pembersihan mengetik bersama. Tambahkan `heartbeat.clearTyping(...)`
ketika platform memerlukan sinyal berhenti eksplisit.

Jika channel Anda menambahkan parameter alat pesan yang membawa sumber media, ekspos
nama parameter tersebut melalui `describeMessageTool(...).mediaSourceParams`. Core menggunakan
daftar eksplisit tersebut untuk normalisasi path sandbox dan kebijakan akses media outbound,
sehingga Plugin tidak memerlukan kasus khusus shared-core untuk parameter avatar,
lampiran, atau cover-image khusus penyedia.
Utamakan mengembalikan map berbasis action seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` agar action yang tidak terkait tidak
mewarisi argumen media milik action lain. Array datar tetap berfungsi untuk parameter yang
memang sengaja dibagikan di setiap action yang diekspos.
Channel yang harus mengekspos URL publik sementara untuk fetch media sisi platform
dapat menggunakan `createHostedOutboundMediaStore(...)` dari
`openclaw/plugin-sdk/outbound-media` dengan store state Plugin. Pertahankan parsing
rute platform dan penegakan token di Plugin channel; helper bersama
hanya memiliki pemuatan media, metadata kedaluwarsa, baris chunk, dan pembersihan.

Jika channel Anda memerlukan pembentukan khusus penyedia untuk `message(action="send")`,
utamakan `actions.prepareSendPayload(...)`. Letakkan kartu native, blok, embed, atau
data tahan lama lainnya di bawah `payload.channelData.<channel>` dan biarkan core melakukan
pengiriman aktual melalui adapter outbound/message. Gunakan
`actions.handleAction(...)` untuk pengiriman hanya sebagai fallback kompatibilitas untuk
payload yang tidak dapat diserialisasi dan dicoba ulang.

Jika platform Anda menyimpan cakupan tambahan di dalam id percakapan, pertahankan parsing tersebut
di Plugin dengan `messaging.resolveSessionConversation(...)`. Itulah hook
kanonis untuk memetakan `rawId` ke id percakapan dasar, id thread opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates` apa pun.
Ketika Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya dari
induk tersempit hingga percakapan terluas/dasar.

Gunakan `openclaw/plugin-sdk/channel-route` ketika kode Plugin perlu menormalkan
field seperti rute, membandingkan thread anak dengan rute induknya, atau membangun
kunci dedupe stabil dari `{ channel, to, accountId, threadId }`. Helper
menormalkan id thread numerik dengan cara yang sama seperti core, sehingga Plugin sebaiknya
menggunakannya alih-alih perbandingan ad hoc `String(threadId)`.
Plugin dengan tata bahasa target khusus penyedia harus mengekspos
`messaging.resolveOutboundSessionRoute(...)` sehingga core mendapatkan identitas
sesi dan thread native penyedia tanpa menggunakan shim parser.

Plugin bundel yang memerlukan parsing yang sama sebelum registry channel boot
juga dapat mengekspos file tingkat atas `session-key-api.ts` dengan export
`resolveSessionConversation(...)` yang cocok. Core menggunakan surface bootstrap-safe tersebut
hanya ketika registry Plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai
fallback kompatibilitas lama ketika Plugin hanya memerlukan fallback induk di atas
id generik/mentah. Jika kedua hook ada, core menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
fallback ke `resolveParentConversationCandidates(...)` ketika hook kanonis
menghilangkannya.

## Persetujuan dan kemampuan channel

Sebagian besar Plugin channel tidak memerlukan kode khusus persetujuan.

- Core memiliki `/approve` di obrolan yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Lebih utamakan satu objek `approvalCapability` pada plugin channel ketika channel membutuhkan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` dihapus. Letakkan fakta pengiriman/native/render/auth persetujuan pada `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; core tidak lagi membaca hook auth persetujuan dari objek tersebut.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan di obrolan yang sama.
- Jika channel Anda mengekspos persetujuan eksekusi native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk status permukaan pemulai/klien native ketika berbeda dari auth persetujuan obrolan yang sama. Core menggunakan hook khusus eksekusi itu untuk membedakan `enabled` vs `disabled`, memutuskan apakah channel pemulai mendukung persetujuan eksekusi native, dan menyertakan channel dalam panduan fallback klien native. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload khusus channel seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator mengetik sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk perutean persetujuan native atau supresi fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native milik channel. Pertahankan agar tetap lazy pada entrypoint channel panas dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai kebutuhan sambil tetap memungkinkan core menyusun siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya ketika channel benar-benar membutuhkan payload persetujuan kustom alih-alih renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` ketika channel ingin balasan jalur nonaktif menjelaskan knob config persis yang diperlukan untuk mengaktifkan persetujuan eksekusi native. Hook menerima `{ channel, channelLabel, accountId }`; channel akun bernama harus merender path bercakupan akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default tingkat atas.
- Jika channel dapat menyimpulkan identitas DM mirip pemilik yang stabil dari config yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` di obrolan yang sama tanpa menambahkan logika core khusus persetujuan.
- Jika auth persetujuan kustom sengaja hanya mengizinkan fallback obrolan yang sama, kembalikan `markImplicitSameChatApprovalAuthorization({ authorized: true })` dari `openclaw/plugin-sdk/approval-auth-runtime`; jika tidak, core memperlakukan hasilnya sebagai otorisasi pemberi persetujuan eksplisit.
- Jika callback native milik channel menyelesaikan persetujuan secara langsung, gunakan `isImplicitSameChatApprovalAuthorization(...)` sebelum menyelesaikan agar fallback implisit tetap melewati otorisasi aktor normal milik channel.
- Jika channel membutuhkan pengiriman persetujuan native, jaga agar kode channel berfokus pada normalisasi target plus fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Letakkan fakta khusus channel di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, agar core dapat menyusun handler dan memiliki pemfilteran permintaan, perutean, dedupe, kedaluwarsa, langganan Gateway, dan pemberitahuan dialihkan-ke-tempat-lain. `nativeRuntime` dipecah menjadi beberapa seam yang lebih kecil:
- Gunakan `createNativeApprovalChannelRouteGates` dari `openclaw/plugin-sdk/approval-native-runtime` ketika channel mendukung pengiriman native asal sesi dan target penerusan persetujuan eksplisit. Helper ini memusatkan pemilihan config persetujuan, penanganan `mode`, filter agen/sesi, pengikatan akun, pencocokan target sesi, dan pencocokan daftar target, sementara pemanggil tetap memiliki id channel, mode penerusan default, pencarian akun, pemeriksaan transport aktif, normalisasi target, dan resolusi target sumber turn. Jangan gunakan ini untuk membuat default kebijakan channel milik core; teruskan mode default terdokumentasi milik channel secara eksplisit.
- `createChannelNativeOriginTargetResolver` menggunakan pencocok rute channel bersama secara default untuk target `{ to, accountId, threadId }`. Teruskan `targetsMatch` hanya ketika channel memiliki aturan ekuivalensi khusus penyedia, seperti pencocokan prefiks timestamp Slack.
- Teruskan `normalizeTargetForMatch` ke `createChannelNativeOriginTargetResolver` ketika channel perlu mengkanonisasi id penyedia sebelum pencocok rute default atau callback `targetsMatch` kustom berjalan, sambil mempertahankan target asli untuk pengiriman. Gunakan `normalizeTarget` hanya ketika target pengiriman yang terselesaikan itu sendiri harus dikanonisasi.
- `availability` - apakah akun dikonfigurasi dan apakah suatu permintaan harus ditangani
- `presentation` - memetakan model tampilan persetujuan bersama ke payload native tertunda/terselesaikan/kedaluwarsa atau tindakan final
- `transport` - menyiapkan target plus mengirim/memperbarui/menghapus pesan persetujuan native
- `interactions` - hook opsional bind/unbind/clear-action untuk tombol atau reaksi native, plus hook `cancelDelivered` opsional. Implementasikan `cancelDelivered` ketika `deliverPending` mendaftarkan state dalam proses atau persisten (seperti penyimpanan target reaksi) agar state tersebut dapat dilepas jika penghentian handler membatalkan pengiriman sebelum `bindPending` berjalan atau ketika `bindPending` tidak mengembalikan handle
- `observe` - hook diagnostik pengiriman opsional
- Jika channel membutuhkan objek milik runtime seperti klien, token, aplikasi Bolt, atau penerima webhook, daftarkan melalui `openclaw/plugin-sdk/channel-runtime-context`. Registry konteks runtime generik memungkinkan core mem-bootstrap handler berbasis capability dari state startup channel tanpa menambahkan glue wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` tingkat lebih rendah hanya ketika seam berbasis capability belum cukup ekspresif.
- Channel persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap bercakupan akun bot yang benar, dan `approvalKind` menjaga perilaku persetujuan eksekusi vs plugin tetap tersedia untuk channel tanpa cabang hardcode di core.
- Core kini juga memiliki pemberitahuan reroute persetujuan. Plugin channel tidak boleh mengirim pesan lanjutan "persetujuan masuk ke DM / channel lain" sendiri dari `createChannelNativeApprovalRuntime`; sebaliknya, ekspos perutean asal + DM pemberi persetujuan yang akurat melalui helper capability persetujuan bersama dan biarkan core mengagregasi pengiriman aktual sebelum memposting pemberitahuan apa pun kembali ke obrolan pemulai.
- Pertahankan jenis id persetujuan yang dikirim dari ujung ke ujung. Klien native tidak boleh
  menebak atau menulis ulang perutean persetujuan eksekusi vs plugin dari state lokal channel.
- Jenis persetujuan yang berbeda dapat secara sengaja mengekspos permukaan native yang berbeda.
  Contoh bundled saat ini:
  - Slack menjaga perutean persetujuan native tersedia untuk id eksekusi dan plugin.
  - Matrix menjaga perutean DM/channel native dan UX reaksi yang sama untuk persetujuan eksekusi
    dan plugin, sambil tetap memungkinkan auth berbeda menurut jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya mengutamakan builder capability dan mengekspos `approvalCapability` pada plugin.

Untuk entrypoint channel panas, utamakan subpath runtime yang lebih sempit ketika Anda hanya
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

Demikian pula, utamakan `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` ketika Anda tidak membutuhkan permukaan payung yang
lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  `createSetupTranslator`, adapter patch setup yang aman diimpor (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder
  setup-proxy terdelegasi
- `openclaw/plugin-sdk/setup-runtime` menyertakan seam adapter sadar env untuk
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder setup instalasi opsional
  plus beberapa primitif yang aman untuk setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika channel Anda mendukung setup atau auth berbasis env dan alur startup/config
generik harus mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan di
manifest plugin dengan `channelEnvVars`. Simpan `envVars` runtime channel atau konstanta
lokal hanya untuk salinan yang ditujukan kepada operator.

Jika channel Anda dapat muncul di `status`, `channels list`, `channels status`, atau
pemindaian SecretRef sebelum runtime plugin dimulai, tambahkan `openclaw.setupEntry` di
`package.json`. Entrypoint tersebut harus aman diimpor dalam path perintah read-only
dan harus mengembalikan metadata channel, adapter config aman-setup, adapter status,
dan metadata target secret channel yang diperlukan untuk ringkasan tersebut. Jangan
memulai klien, listener, atau runtime transport dari entry setup.

Jaga agar path impor entry channel utama juga tetap sempit. Discovery dapat mengevaluasi
entry dan modul plugin channel untuk mendaftarkan capability tanpa mengaktifkan
channel. File seperti `channel-plugin-api.ts` harus mengekspor objek plugin channel
tanpa mengimpor wizard setup, klien transport, listener socket, peluncur subprocess,
atau modul startup layanan. Letakkan bagian runtime tersebut dalam modul yang dimuat
dari `registerFull(...)`, setter runtime, atau adapter capability lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya ketika Anda juga membutuhkan
  helper setup/config bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika channel Anda hanya ingin mengiklankan "instal plugin ini terlebih dahulu" di permukaan
setup, utamakan `createOptionalChannelSetupSurface(...)`. Adapter/wizard yang dihasilkan
gagal tertutup pada penulisan config dan finalisasi, dan menggunakan kembali pesan
wajib-instal yang sama di seluruh validasi, finalisasi, dan salinan tautan docs.

Untuk path channel panas lainnya, utamakan helper sempit dibanding permukaan legacy
yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk konfigurasi multi-akun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/channel-inbound` untuk route/envelope inbound dan
  pengabelan rekam-dan-dispatch
- `openclaw/plugin-sdk/channel-targets` untuk helper parsing target
- `openclaw/plugin-sdk/outbound-media` untuk pemuatan media dan
  `openclaw/plugin-sdk/channel-outbound` untuk identitas outbound/delegat kirim
  dan perencanaan payload
- `buildThreadAwareOutboundSessionRoute(...)` dari
  `openclaw/plugin-sdk/channel-core` ketika route outbound harus mempertahankan
  `replyToId`/`threadId` eksplisit atau memulihkan sesi `:thread:` saat ini
  setelah kunci sesi dasar masih cocok. Plugin provider dapat menimpa
  presedensi, perilaku sufiks, dan normalisasi id thread ketika platform mereka
  memiliki semantik pengiriman thread native.
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan pendaftaran adapter
- `openclaw/plugin-sdk/agent-media-payload` hanya ketika tata letak field payload
  agen/media legacy masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi custom-command
  Telegram, validasi duplikat/konflik, dan kontrak konfigurasi perintah yang
  stabil terhadap fallback

Channel khusus auth biasanya dapat berhenti di path default: core menangani persetujuan dan plugin hanya mengekspos kapabilitas outbound/auth. Channel persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom harus menggunakan helper native bersama alih-alih membuat siklus hidup persetujuan sendiri.

## Kebijakan mention inbound

Pisahkan penanganan mention inbound dalam dua lapisan:

- pengumpulan bukti milik plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan mention.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya ketika Anda memerlukan barrel
helper inbound yang lebih luas.

Cocok untuk logika lokal plugin:

- deteksi balasan-ke-bot
- deteksi kutipan-bot
- pemeriksaan partisipasi-thread
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
3. Gunakan `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, dan `decision.shouldSkip` di gate inbound Anda.

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
Plugin channel bawaan yang sudah bergantung pada injeksi runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jika Anda hanya memerlukan `implicitMentionKindWhen` dan
`resolveInboundMentionDecision`, impor dari
`openclaw/plugin-sdk/channel-mention-gating` untuk menghindari pemuatan helper
runtime inbound yang tidak terkait.

Gunakan `resolveInboundMentionDecision({ facts, policy })` untuk gating mention.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Buat file plugin standar. Field `channel` di `package.json` adalah
    yang menjadikannya plugin channel. Untuk permukaan metadata paket lengkap,
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
    pengaturan milik plugin yang bukan konfigurasi akun channel. `channelConfigs`
    memvalidasi `channels.acme-chat` dan merupakan sumber cold-path yang digunakan oleh schema
    konfigurasi, penyiapan, dan permukaan UI sebelum runtime plugin dimuat.

  </Step>

  <Step title="Build the channel plugin object">
    Interface `ChannelPlugin` memiliki banyak permukaan adapter opsional. Mulailah dengan
    minimum - `id` dan `setup` - lalu tambahkan adapter saat Anda membutuhkannya.

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

    Untuk channel yang menerima kunci DM tingkat atas kanonis dan kunci nested legacy, gunakan helper dari `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, dan `normalizeChannelDmPolicy` menjaga nilai lokal akun tetap mendahului nilai root yang diwarisi. Pasangkan resolver yang sama dengan perbaikan doctor melalui `normalizeLegacyDmAliases` agar runtime dan migrasi membaca kontrak yang sama.

    <Accordion title="What createChatChannelPlugin does for you">
      Alih-alih mengimplementasikan interface adapter level rendah secara manual, Anda meneruskan
      opsi deklaratif dan builder menyusunnya:

      | Opsi | Yang dihubungkannya |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM terskop dari field konfigurasi |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode reply-to (tetap, terskop akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi kirim yang mengembalikan metadata hasil (ID pesan) |

      Anda juga dapat meneruskan objek adapter mentah alih-alih opsi deklaratif
      jika Anda memerlukan kontrol penuh.

      Adapter outbound mentah dapat mendefinisikan fungsi `chunker(text, limit, ctx)`.
      `ctx.formatting` opsional membawa keputusan pemformatan saat pengiriman
      seperti `maxLinesPerMessage`; terapkan sebelum mengirim agar threading balasan
      dan batas chunk diselesaikan satu kali oleh pengiriman outbound bersama.
      Konteks kirim juga menyertakan `replyToIdSource` (`implicit` atau `explicit`)
      ketika target balasan native telah diselesaikan, sehingga helper payload dapat mempertahankan
      tag balasan eksplisit tanpa mengonsumsi slot balasan sekali pakai implisit.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
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

    Letakkan deskriptor CLI milik channel di `registerCliMetadata(...)` sehingga OpenClaw
    dapat menampilkannya dalam bantuan root tanpa mengaktifkan runtime channel penuh,
    sementara pemuatan penuh normal tetap mengambil deskriptor yang sama untuk pendaftaran
    perintah nyata. Pertahankan `registerFull(...)` untuk pekerjaan khusus runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC Gateway, gunakan prefiks
    khusus Plugin. Namespace admin inti (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    di-resolve ke `operator.admin`.
    `defineChannelPluginEntry` menangani pemisahan mode pendaftaran secara otomatis. Lihat
    [Entry Points](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsi.

  </Step>

  <Step title="Tambahkan entri setup">
    Buat `setup-entry.ts` untuk pemuatan ringan selama onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat ini alih-alih entri penuh saat channel dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari pemuatan kode runtime berat selama alur setup.
    Lihat [Setup dan Config](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Channel workspace bawaan yang memisahkan ekspor aman-setup ke modul
    sidecar dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` saat juga memerlukan
    setter runtime eksplisit pada waktu setup.

  </Step>

  <Step title="Tangani pesan masuk">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola umumnya adalah Webhook yang memverifikasi permintaan dan
    mengirimkannya melalui handler masuk channel Anda:

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
      Penanganan pesan masuk bersifat khusus channel. Setiap Plugin channel memiliki
      pipeline masuknya sendiri. Lihat Plugin channel bawaan
      (misalnya paket Plugin Microsoft Teams atau Google Chat) untuk pola nyata.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Uji">
Tulis pengujian colocated di `src/channel.test.ts`:

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

    Untuk helper pengujian bersama, lihat [Testing](/id/plugins/sdk-testing).

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
    Mode balasan tetap, bercakupan akun, atau kustom
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
  <Card title="API masuk channel" icon="bolt" href="/id/plugins/sdk-channel-inbound">
    Siklus hidup event masuk bersama: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bawaan masih ada untuk pemeliharaan Plugin bawaan dan
kompatibilitas. Itu bukan pola yang direkomendasikan untuk Plugin channel baru;
utamakan subpath channel/setup/reply/runtime generik dari permukaan SDK umum
kecuali Anda memelihara keluarga Plugin bawaan tersebut secara langsung.
</Note>

## Langkah berikutnya

- [Provider Plugins](/id/plugins/sdk-provider-plugins) - jika Plugin Anda juga menyediakan model
- [SDK Overview](/id/plugins/sdk-overview) - referensi impor subpath lengkap
- [SDK Testing](/id/plugins/sdk-testing) - utilitas pengujian dan pengujian kontrak
- [Plugin Manifest](/id/plugins/manifest) - skema manifest lengkap

## Terkait

- [Setup Plugin SDK](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
