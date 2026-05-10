---
read_when:
    - Anda sedang membangun Plugin saluran perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami antarmuka adapter ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membuat Plugin saluran perpesanan untuk OpenClaw
title: Membangun plugin saluran
x-i18n:
    generated_at: "2026-05-10T19:46:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Panduan ini menjelaskan cara membangun Plugin saluran yang menghubungkan OpenClaw ke
platform perpesanan. Pada akhirnya, Anda akan memiliki saluran yang berfungsi dengan keamanan DM,
pemasangan, pengurutan balasan, dan perpesanan keluar.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket dasar
  dan penyiapan manifes.
</Info>

## Cara kerja Plugin saluran

Plugin saluran tidak memerlukan tool kirim/edit/reaksi sendiri. OpenClaw menyimpan satu
tool `message` bersama di inti. Plugin Anda memiliki:

- **Konfigurasi** - resolusi akun dan panduan penyiapan
- **Keamanan** - kebijakan DM dan daftar izin
- **Pemasangan** - alur persetujuan DM
- **Tata bahasa sesi** - bagaimana id percakapan khusus penyedia dipetakan ke chat dasar, id thread, dan fallback induk
- **Keluar** - mengirim teks, media, dan polling ke platform
- **Threading** - bagaimana balasan dibuat berurutan
- **Pengetikan Heartbeat** - sinyal mengetik/sibuk opsional untuk target pengiriman Heartbeat

Inti memiliki tool pesan bersama, pengkabelan prompt, bentuk kunci sesi luar,
pembukuan `:thread:` generik, dan dispatch.

Plugin saluran baru juga harus mengekspos adapter `message` dengan
`defineChannelMessageAdapter` dari `openclaw/plugin-sdk/channel-message`. Adapter
menyatakan kapabilitas pengiriman final persisten mana yang benar-benar didukung oleh transport native
dan mengarahkan pengiriman teks/media ke fungsi transport yang sama dengan
adapter `outbound` lama. Nyatakan kapabilitas hanya ketika contract test
membuktikan efek samping native dan receipt yang dikembalikan.
Untuk kontrak API lengkap, contoh, matriks kapabilitas, aturan receipt, finalisasi
pratinjau langsung, kebijakan ack penerimaan, pengujian, dan tabel migrasi, lihat
[API pesan saluran](/id/plugins/sdk-channel-message).
Jika adapter `outbound` yang ada sudah memiliki metode kirim dan
metadata kapabilitas yang tepat, gunakan `createChannelMessageAdapterFromOutbound(...)` untuk
menurunkan adapter `message` alih-alih menulis bridge lain secara manual.
Pengiriman adapter harus mengembalikan nilai `MessageReceipt`. Ketika kode kompatibilitas
masih membutuhkan id lama, turunkan id tersebut dengan `listMessageReceiptPlatformIds(...)`
atau `resolveMessageReceiptPrimaryId(...)` alih-alih mempertahankan field
`messageIds` paralel dalam kode siklus hidup baru.
Saluran yang mendukung pratinjau juga harus menyatakan `message.live.capabilities` dengan
siklus hidup live persis yang dimilikinya, seperti `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming`, atau
`quietFinalization`. Saluran yang memfinalkan pratinjau draf di tempat juga harus
menyatakan `message.live.finalizer.capabilities`, seperti `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt`, dan
`retainOnAmbiguousFailure`, serta merutekan logika runtime melalui
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)`. Pastikan kapabilitas tersebut didukung
oleh pengujian `verifyChannelMessageLiveCapabilityAdapterProofs(...)` dan
`verifyChannelMessageLiveFinalizerProofs(...)` agar perilaku pratinjau native,
progres, edit, fallback/retensi, pembersihan, dan receipt tidak bergeser
diam-diam.
Penerima inbound yang menunda acknowledgement platform harus menyatakan
`message.receive.defaultAckPolicy` dan `supportedAckPolicies` alih-alih menyembunyikan
waktu ack dalam state lokal monitor. Cakup setiap kebijakan yang dinyatakan dengan
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Helper balasan/giliran lama seperti `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase`, dan `recordInboundSessionAndDispatchReply`
tetap tersedia untuk dispatcher kompatibilitas. Jangan gunakan nama-nama itu untuk kode
saluran baru; Plugin baru harus dimulai dengan adapter `message`, receipt, dan
helper siklus hidup terima/kirim pada `openclaw/plugin-sdk/channel-message`.

Saluran yang memigrasikan otorisasi inbound dapat menggunakan subpath eksperimental
`openclaw/plugin-sdk/channel-ingress-runtime` dari path penerimaan runtime.
Subpath ini menjaga lookup platform dan efek samping tetap berada di Plugin, sambil
berbagi resolusi state daftar izin, keputusan rute/pengirim/perintah/event/aktivasi,
diagnostik yang diredaksi, dan pemetaan penerimaan giliran. Simpan normalisasi
identitas Plugin dalam descriptor yang Anda berikan ke resolver; jangan
menyerialkan nilai kecocokan mentah dari state atau keputusan yang diselesaikan. Lihat
[API ingress saluran](/id/plugins/sdk-channel-ingress) untuk desain API,
batas kepemilikan, dan ekspektasi pengujian.

Jika saluran Anda mendukung indikator mengetik di luar balasan inbound, ekspos
`heartbeat.sendTyping(...)` pada Plugin saluran. Inti memanggilnya dengan
target pengiriman Heartbeat yang sudah diselesaikan sebelum model Heartbeat mulai berjalan dan
menggunakan siklus hidup keepalive/pembersihan pengetikan bersama. Tambahkan `heartbeat.clearTyping(...)`
ketika platform memerlukan sinyal berhenti eksplisit.

Jika saluran Anda menambahkan parameter tool pesan yang membawa sumber media, ekspos
nama parameter tersebut melalui `describeMessageTool(...).mediaSourceParams`. Inti menggunakan
daftar eksplisit itu untuk normalisasi path sandbox dan kebijakan akses media keluar,
sehingga Plugin tidak memerlukan kasus khusus inti bersama untuk parameter avatar,
lampiran, atau gambar sampul khusus penyedia.
Lebih disarankan mengembalikan map berbasis kunci aksi seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` agar aksi yang tidak terkait tidak
mewarisi argumen media milik aksi lain. Array datar tetap berfungsi untuk parameter yang
secara sengaja dibagikan ke setiap aksi yang diekspos.

Jika saluran Anda memerlukan pembentukan khusus penyedia untuk `message(action="send")`,
lebih disarankan menggunakan `actions.prepareSendPayload(...)`. Letakkan kartu native, blok, embed, atau
data persisten lain di bawah `payload.channelData.<channel>` dan biarkan inti melakukan
pengiriman sebenarnya melalui adapter outbound/message. Gunakan
`actions.handleAction(...)` untuk pengiriman hanya sebagai fallback kompatibilitas bagi
payload yang tidak dapat diserialkan dan dicoba ulang.

Jika platform Anda menyimpan scope tambahan di dalam id percakapan, pertahankan parsing itu
di Plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah hook
kanonis untuk memetakan `rawId` ke id percakapan dasar, id thread opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates` apa pun.
Ketika Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya dari
induk paling sempit ke percakapan paling luas/dasar.

Gunakan `openclaw/plugin-sdk/channel-route` ketika kode Plugin perlu menormalkan
field mirip rute, membandingkan thread anak dengan rute induknya, atau membangun
kunci deduplikasi stabil dari `{ channel, to, accountId, threadId }`. Helper ini
menormalkan id thread numerik dengan cara yang sama seperti inti, sehingga Plugin harus lebih memilih
itu daripada perbandingan ad hoc `String(threadId)`.
Plugin dengan tata bahasa target khusus penyedia dapat menyuntikkan parser mereka ke
`resolveChannelRouteTargetWithParser(...)` dan tetap mendapatkan bentuk target rute
serta semantik fallback thread yang sama seperti yang digunakan inti.

Plugin bawaan yang memerlukan parsing yang sama sebelum registry saluran melakukan boot
juga dapat mengekspos file tingkat atas `session-key-api.ts` dengan ekspor
`resolveSessionConversation(...)` yang cocok. Inti menggunakan permukaan yang aman untuk bootstrap itu
hanya ketika registry Plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai
fallback kompatibilitas lama ketika Plugin hanya memerlukan fallback induk di atas
id generik/mentah. Jika kedua hook ada, inti menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
fallback ke `resolveParentConversationCandidates(...)` ketika hook kanonis
menghilangkannya.

## Persetujuan dan kapabilitas saluran

Sebagian besar Plugin saluran tidak memerlukan kode khusus persetujuan.

- Inti memiliki `/approve` dalam chat yang sama, payload tombol persetujuan bersama, dan pengiriman cadangan generik.
- Lebih pilih satu objek `approvalCapability` pada Plugin kanal saat kanal membutuhkan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` dihapus. Letakkan fakta pengiriman/asli/render/auth persetujuan pada `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; inti tidak lagi membaca hook auth persetujuan dari objek itu.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan dalam chat yang sama.
- Jika kanal Anda mengekspos persetujuan eksekusi asli, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk status permukaan pemicu/klien asli saat berbeda dari auth persetujuan dalam chat yang sama. Inti menggunakan hook khusus eksekusi itu untuk membedakan `enabled` vs `disabled`, menentukan apakah kanal pemicu mendukung persetujuan eksekusi asli, dan menyertakan kanal dalam panduan cadangan klien asli. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload khusus kanal seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator mengetik sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk perutean persetujuan asli atau penekanan cadangan.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan asli yang dimiliki kanal. Jaga agar tetap malas pada entrypoint kanal panas dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai kebutuhan sambil tetap memungkinkan inti menyusun siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya saat kanal benar-benar membutuhkan payload persetujuan kustom alih-alih perender bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` saat kanal ingin balasan jalur nonaktif menjelaskan knob konfigurasi persis yang diperlukan untuk mengaktifkan persetujuan eksekusi asli. Hook menerima `{ channel, channelLabel, accountId }`; kanal akun bernama harus merender path berlingkup akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default tingkat atas.
- Jika kanal dapat menyimpulkan identitas DM yang stabil dan mirip pemilik dari konfigurasi yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` dalam chat yang sama tanpa menambahkan logika inti khusus persetujuan.
- Jika kanal membutuhkan pengiriman persetujuan asli, jaga kode kanal tetap berfokus pada normalisasi target serta fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Letakkan fakta khusus kanal di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, agar inti dapat menyusun handler dan memiliki penyaringan permintaan, perutean, deduplikasi, kedaluwarsa, langganan Gateway, dan pemberitahuan dirutekan-ke-tempat-lain. `nativeRuntime` dipecah menjadi beberapa seam yang lebih kecil:
- `createChannelNativeOriginTargetResolver` menggunakan pencocok rute kanal bersama secara default untuk target `{ to, accountId, threadId }`. Teruskan `targetsMatch` hanya saat kanal memiliki aturan ekuivalensi khusus penyedia, seperti pencocokan awalan timestamp Slack.
- Teruskan `normalizeTargetForMatch` ke `createChannelNativeOriginTargetResolver` saat kanal perlu mengkanoniskan id penyedia sebelum pencocok rute default atau callback `targetsMatch` kustom berjalan, sambil mempertahankan target asli untuk pengiriman. Gunakan `normalizeTarget` hanya saat target pengiriman yang terselesaikan itu sendiri harus dikanoniskan.
- `availability` - apakah akun dikonfigurasi dan apakah permintaan harus ditangani
- `presentation` - petakan model tampilan persetujuan bersama ke payload asli tertunda/terselesaikan/kedaluwarsa atau tindakan akhir
- `transport` - siapkan target serta kirim/perbarui/hapus pesan persetujuan asli
- `interactions` - hook bind/unbind/clear-action opsional untuk tombol atau reaksi asli
- `observe` - hook diagnostik pengiriman opsional
- Jika kanal membutuhkan objek milik runtime seperti klien, token, aplikasi Bolt, atau penerima webhook, daftarkan melalui `openclaw/plugin-sdk/channel-runtime-context`. Registry konteks runtime generik memungkinkan inti melakukan bootstrap handler berbasis kapabilitas dari status startup kanal tanpa menambahkan glue wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` tingkat lebih rendah hanya saat seam berbasis kapabilitas belum cukup ekspresif.
- Kanal persetujuan asli harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap berlingkup ke akun bot yang tepat, dan `approvalKind` menjaga perilaku persetujuan eksekusi vs Plugin tersedia bagi kanal tanpa cabang hardcode di inti.
- Inti sekarang juga memiliki pemberitahuan perutean ulang persetujuan. Plugin kanal tidak boleh mengirim pesan tindak lanjut mereka sendiri "persetujuan masuk ke DM / kanal lain" dari `createChannelNativeApprovalRuntime`; sebaliknya, ekspos perutean asal + DM pemberi persetujuan yang akurat melalui helper kapabilitas persetujuan bersama dan biarkan inti mengagregasi pengiriman aktual sebelum memposting pemberitahuan apa pun kembali ke chat pemicu.
- Pertahankan jenis id persetujuan yang dikirim dari ujung ke ujung. Klien asli tidak boleh
  menebak atau menulis ulang perutean persetujuan eksekusi vs Plugin dari status lokal kanal.
- Jenis persetujuan yang berbeda dapat secara sengaja mengekspos permukaan asli yang berbeda.
  Contoh bawaan saat ini:
  - Slack menjaga perutean persetujuan asli tersedia untuk id eksekusi dan Plugin.
  - Matrix menjaga perutean DM/kanal asli dan UX reaksi yang sama untuk persetujuan eksekusi
    dan Plugin, sambil tetap memungkinkan auth berbeda menurut jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya memilih pembangun kapabilitas dan mengekspos `approvalCapability` pada Plugin.

Untuk entrypoint kanal panas, pilih subpath runtime yang lebih sempit saat Anda hanya
membutuhkan satu bagian dari keluarga itu:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Demikian pula, pilih `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` saat Anda tidak membutuhkan permukaan payung
yang lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  adapter patch setup yang aman diimpor (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), keluaran catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan pembangun
  setup-proxy terdelegasi
- `openclaw/plugin-sdk/setup-runtime` menyertakan seam adapter sadar-env untuk
  `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup pembangun setup instalasi opsional
  ditambah beberapa primitif aman-setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika kanal Anda mendukung setup atau auth berbasis env dan alur startup/konfigurasi
generik harus mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan di
manifest Plugin dengan `channelEnvVars`. Pertahankan `envVars` runtime kanal atau
konstanta lokal hanya untuk salinan yang ditujukan bagi operator.

Jika kanal Anda dapat muncul di `status`, `channels list`, `channels status`, atau
pemindaian SecretRef sebelum runtime Plugin dimulai, tambahkan `openclaw.setupEntry` di
`package.json`. Entrypoint itu harus aman untuk diimpor di path perintah baca-saja
dan harus mengembalikan metadata kanal, adapter konfigurasi aman-setup, adapter status,
dan metadata target rahasia kanal yang diperlukan untuk ringkasan tersebut. Jangan
memulai klien, listener, atau runtime transport dari entri setup.

Jaga path impor entri kanal utama tetap sempit juga. Discovery dapat mengevaluasi
entri dan modul Plugin kanal untuk mendaftarkan kapabilitas tanpa mengaktifkan
kanal. File seperti `channel-plugin-api.ts` harus mengekspor objek Plugin kanal
tanpa mengimpor wizard setup, klien transport, listener soket, peluncur subprocess,
atau modul startup layanan. Letakkan bagian runtime tersebut di modul yang dimuat
dari `registerFull(...)`, setter runtime, atau adapter kapabilitas malas.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya saat Anda juga membutuhkan
  helper setup/konfigurasi bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika kanal Anda hanya ingin mengiklankan "instal Plugin ini terlebih dahulu" di permukaan
setup, pilih `createOptionalChannelSetupSurface(...)`. Adapter/wizard yang dihasilkan
gagal tertutup pada penulisan konfigurasi dan finalisasi, serta menggunakan kembali
pesan wajib-instal yang sama di seluruh validasi, finalisasi, dan salinan tautan docs.

Untuk path kanal panas lainnya, pilih helper sempit alih-alih permukaan lama yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk konfigurasi multi-akun dan
  cadangan akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk rute/envelope inbound dan
  wiring catat-dan-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk parsing/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media plus delegasi
  identitas/kirim outbound dan perencanaan payload
- `buildThreadAwareOutboundSessionRoute(...)` dari
  `openclaw/plugin-sdk/channel-core` saat rute outbound harus mempertahankan
  `replyToId`/`threadId` eksplisit atau memulihkan sesi `:thread:` saat ini
  setelah kunci sesi dasar masih cocok. Plugin penyedia dapat menimpa
  presedensi, perilaku sufiks, dan normalisasi id thread saat platform mereka
  memiliki semantik pengiriman thread asli.
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan pendaftaran adapter
- `openclaw/plugin-sdk/agent-media-payload` hanya saat tata letak field payload
  agen/media lama masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi perintah kustom
  Telegram, validasi duplikat/konflik, dan kontrak konfigurasi perintah yang
  stabil untuk cadangan

Kanal khusus auth biasanya dapat berhenti di path default: inti menangani persetujuan dan Plugin hanya mengekspos kapabilitas outbound/auth. Kanal persetujuan asli seperti Matrix, Slack, Telegram, dan transport chat kustom harus menggunakan helper asli bersama alih-alih membuat siklus hidup persetujuan sendiri.

## Kebijakan mention inbound

Jaga penanganan mention inbound terbagi dalam dua lapisan:

- pengumpulan bukti milik Plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan mention.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya saat Anda membutuhkan barrel helper
inbound yang lebih luas.

Cocok untuk logika lokal Plugin:

- deteksi reply-to-bot
- deteksi quoted-bot
- pemeriksaan partisipasi thread
- pengecualian pesan layanan/sistem
- cache asli platform yang diperlukan untuk membuktikan partisipasi bot

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
Plugin kanal bawaan yang sudah bergantung pada injeksi runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jika Anda hanya memerlukan `implicitMentionKindWhen` dan
`resolveInboundMentionDecision`, impor dari
`openclaw/plugin-sdk/channel-mention-gating` untuk menghindari memuat helper
runtime inbound yang tidak terkait.

Helper `resolveMentionGating*` yang lebih lama tetap ada di
`openclaw/plugin-sdk/channel-inbound` hanya sebagai ekspor kompatibilitas. Kode
baru sebaiknya menggunakan `resolveInboundMentionDecision({ facts, policy })`.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    Buat file Plugin standar. Field `channel` di `package.json` adalah yang
    menjadikan ini Plugin kanal. Untuk permukaan metadata paket lengkap,
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

    `configSchema` memvalidasi `plugins.entries.acme-chat.config`. Gunakan untuk
    pengaturan milik Plugin yang bukan konfigurasi akun kanal. `channelConfigs`
    memvalidasi `channels.acme-chat` dan merupakan sumber cold-path yang digunakan oleh
    skema konfigurasi, penyiapan, dan permukaan UI sebelum runtime Plugin dimuat.

  </Step>

  <Step title="Build the channel plugin object">
    Antarmuka `ChannelPlugin` memiliki banyak permukaan adaptor opsional. Mulai dengan
    minimum - `id` dan `setup` - lalu tambahkan adaptor sesuai kebutuhan.

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

    Untuk kanal yang menerima kunci DM level teratas kanonis sekaligus kunci bertumpuk lama, gunakan helper dari `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, dan `normalizeChannelDmPolicy` menjaga nilai lokal akun tetap lebih diprioritaskan daripada nilai root yang diwariskan. Pasangkan resolver yang sama dengan perbaikan doctor melalui `normalizeLegacyDmAliases` agar runtime dan migrasi membaca kontrak yang sama.

    <Accordion title="What createChatChannelPlugin does for you">
      Alih-alih mengimplementasikan antarmuka adaptor level rendah secara manual, Anda meneruskan
      opsi deklaratif dan builder akan menyusunnya:

      | Opsi | Yang dihubungkan |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM ber-scope dari field konfigurasi |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode reply-to (tetap, ber-scope akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi kirim yang mengembalikan metadata hasil (ID pesan) |

      Anda juga dapat meneruskan objek adaptor mentah alih-alih opsi deklaratif
      jika memerlukan kontrol penuh.

      Adaptor outbound mentah dapat mendefinisikan fungsi `chunker(text, limit, ctx)`.
      `ctx.formatting` opsional membawa keputusan pemformatan pada waktu pengiriman
      seperti `maxLinesPerMessage`; terapkan sebelum mengirim agar threading balasan
      dan batas chunk diselesaikan satu kali oleh pengiriman outbound bersama.
      Konteks kirim juga menyertakan `replyToIdSource` (`implicit` atau `explicit`)
      saat target balasan native berhasil diselesaikan, sehingga helper payload dapat mempertahankan
      tag balasan eksplisit tanpa memakai slot balasan sekali pakai implisit.
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

    Letakkan deskriptor CLI milik kanal di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya di bantuan root tanpa mengaktifkan runtime kanal penuh,
    sementara pemuatan penuh normal tetap mengambil deskriptor yang sama untuk pendaftaran
    perintah sebenarnya. Pertahankan `registerFull(...)` untuk pekerjaan khusus runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC Gateway, gunakan
    prefix khusus Plugin. Namespace admin core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    diselesaikan ke `operator.admin`.
    `defineChannelPluginEntry` menangani pemisahan mode pendaftaran secara otomatis. Lihat
    [Titik Masuk](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsi.

  </Step>

  <Step title="Add a setup entry">
    Buat `setup-entry.ts` untuk pemuatan ringan selama onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat ini alih-alih entry penuh saat kanal dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari pemuatan kode runtime yang berat selama alur penyiapan.
    Lihat [Penyiapan dan Konfigurasi](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Kanal workspace bawaan yang memisahkan ekspor aman-setup ke dalam modul sidecar
    dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` saat juga memerlukan
    setter runtime waktu-setup yang eksplisit.

  </Step>

  <Step title="Handle inbound messages">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola umumnya adalah Webhook yang memverifikasi request dan
    mengirimkannya melalui handler inbound kanal Anda:

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
<Step title="Test">
Tulis pengujian yang ditempatkan bersama di `src/channel.test.ts`:

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
  <Card title="Threading options" icon="git-branch" href="/id/plugins/sdk-entrypoints#registration-mode">
    Mode balasan tetap, bercakupan akun, atau kustom
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool dan penemuan tindakan
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/id/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagen melalui api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/id/plugins/sdk-channel-turn">
    Siklus hidup giliran masuk bersama: serap, selesaikan, catat, kirim, finalisasi
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bawaan masih ada untuk pemeliharaan plugin bawaan dan
kompatibilitas. Itu bukan pola yang direkomendasikan untuk plugin saluran baru;
pilih subpath saluran/penyiapan/balasan/runtime generik dari permukaan SDK umum
kecuali Anda memelihara keluarga plugin bawaan tersebut secara langsung.
</Note>

## Langkah berikutnya

- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - jika plugin Anda juga menyediakan model
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi impor subpath lengkap
- [Pengujian SDK](/id/plugins/sdk-testing) - utilitas pengujian dan pengujian kontrak
- [Manifest Plugin](/id/plugins/manifest) - skema manifest lengkap

## Terkait

- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun plugin](/id/plugins/building-plugins)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
