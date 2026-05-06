---
read_when:
    - Anda sedang membangun Plugin saluran perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami antarmuka adaptor ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membuat Plugin saluran perpesanan untuk OpenClaw
title: Membangun Plugin saluran
x-i18n:
    generated_at: "2026-05-06T09:22:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Panduan ini menjelaskan cara membangun Plugin saluran yang menghubungkan OpenClaw ke
platform perpesanan. Pada akhirnya, Anda akan memiliki saluran yang berfungsi dengan keamanan DM,
pairing, utas balasan, dan perpesanan keluar.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket dasar
  dan penyiapan manifes.
</Info>

## Cara kerja Plugin saluran

Plugin saluran tidak memerlukan alat kirim/edit/reaksi sendiri. OpenClaw mempertahankan satu
alat `message` bersama di inti. Plugin Anda menangani:

- **Konfigurasi** - resolusi akun dan wizard penyiapan
- **Keamanan** - kebijakan DM dan daftar izin
- **Pairing** - alur persetujuan DM
- **Tata bahasa sesi** - cara id percakapan spesifik penyedia dipetakan ke chat dasar, id utas, dan fallback induk
- **Keluar** - mengirim teks, media, dan polling ke platform
- **Pengutasan** - cara balasan diutas
- **Pengetikan Heartbeat** - sinyal mengetik/sibuk opsional untuk target pengiriman Heartbeat

Inti menangani alat pesan bersama, penyambungan prompt, bentuk luar kunci sesi,
pencatatan umum `:thread:`, dan dispatch.

Plugin saluran baru juga harus mengekspos adaptor `message` dengan
`defineChannelMessageAdapter` dari `openclaw/plugin-sdk/channel-message`. Adaptor
mendeklarasikan kemampuan final-send yang tahan lama yang benar-benar didukung transport native
dan mengarahkan pengiriman teks/media ke fungsi transport yang sama seperti adaptor
`outbound` lama. Deklarasikan kemampuan hanya ketika tes kontrak
membuktikan efek samping native dan receipt yang dikembalikan.
Untuk kontrak API lengkap, contoh, matriks kemampuan, aturan receipt, finalisasi
pratinjau langsung, kebijakan ack penerimaan, tes, dan tabel migrasi, lihat
[API pesan saluran](/id/plugins/sdk-channel-message).
Jika adaptor `outbound` yang ada sudah memiliki metode pengiriman dan
metadata kemampuan yang tepat, gunakan `createChannelMessageAdapterFromOutbound(...)` untuk
menurunkan adaptor `message` alih-alih menulis bridge lain secara manual.
Pengiriman adaptor harus mengembalikan nilai `MessageReceipt`. Ketika kode kompatibilitas
masih membutuhkan id lama, turunkan id tersebut dengan `listMessageReceiptPlatformIds(...)`
atau `resolveMessageReceiptPrimaryId(...)` alih-alih mempertahankan field
`messageIds` paralel dalam kode siklus hidup baru.
Saluran yang mendukung pratinjau juga harus mendeklarasikan `message.live.capabilities` dengan
siklus hidup live persis yang mereka miliki, seperti `draftPreview`,
`previewFinalization`, `progressUpdates`, `nativeStreaming`, atau
`quietFinalization`. Saluran yang memfinalisasi pratinjau draf di tempat juga harus
mendeklarasikan `message.live.finalizer.capabilities`, seperti `finalEdit`,
`normalFallback`, `discardPending`, `previewReceipt`, dan
`retainOnAmbiguousFailure`, serta merutekan logika runtime melalui
`defineFinalizableLivePreviewAdapter(...)` plus
`deliverWithFinalizableLivePreviewAdapter(...)`. Pastikan kemampuan tersebut didukung
oleh tes `verifyChannelMessageLiveCapabilityAdapterProofs(...)` dan
`verifyChannelMessageLiveFinalizerProofs(...)` agar perilaku pratinjau native,
progres, edit, fallback/retensi, pembersihan, dan receipt tidak bergeser
diam-diam.
Receiver inbound yang menunda acknowledgement platform harus mendeklarasikan
`message.receive.defaultAckPolicy` dan `supportedAckPolicies` alih-alih menyembunyikan
waktu ack di state lokal monitor. Cakup setiap kebijakan yang dideklarasikan dengan
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

Helper balasan/turn lama seperti `createChannelTurnReplyPipeline`,
`dispatchInboundReplyWithBase`, dan `recordInboundSessionAndDispatchReply`
tetap tersedia untuk dispatcher kompatibilitas. Jangan gunakan nama tersebut untuk kode
saluran baru; Plugin baru harus memulai dengan adaptor `message`, receipt, dan
helper siklus hidup penerimaan/pengiriman di `openclaw/plugin-sdk/channel-message`.

Jika saluran Anda mendukung indikator mengetik di luar balasan inbound, ekspos
`heartbeat.sendTyping(...)` pada Plugin saluran. Inti memanggilnya dengan
target pengiriman Heartbeat yang telah diresolusi sebelum model Heartbeat dijalankan dan
menggunakan siklus hidup keepalive/pembersihan pengetikan bersama. Tambahkan `heartbeat.clearTyping(...)`
ketika platform membutuhkan sinyal berhenti eksplisit.

Jika saluran Anda menambahkan parameter alat pesan yang membawa sumber media, ekspos nama
parameter tersebut melalui `describeMessageTool(...).mediaSourceParams`. Inti menggunakan
daftar eksplisit tersebut untuk normalisasi jalur sandbox dan kebijakan akses media
keluar, sehingga Plugin tidak memerlukan kasus khusus inti bersama untuk parameter
avatar, lampiran, atau gambar sampul spesifik penyedia.
Lebih disarankan mengembalikan peta berbasis kunci aksi seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` agar aksi yang tidak terkait tidak
mewarisi argumen media milik aksi lain. Array datar tetap berfungsi untuk parameter yang
memang sengaja dibagikan di semua aksi yang diekspos.

Jika saluran Anda membutuhkan pembentukan spesifik penyedia untuk `message(action="send")`,
lebih disarankan menggunakan `actions.prepareSendPayload(...)`. Letakkan kartu native, blok, embed, atau
data tahan lama lainnya di bawah `payload.channelData.<channel>` dan biarkan inti melakukan
pengiriman sebenarnya melalui adaptor outbound/message. Gunakan
`actions.handleAction(...)` untuk pengiriman hanya sebagai fallback kompatibilitas untuk
payload yang tidak dapat diserialisasi dan dicoba ulang.

Jika platform Anda menyimpan cakupan ekstra di dalam id percakapan, pertahankan parsing tersebut
di Plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah hook
kanonis untuk memetakan `rawId` ke id percakapan dasar, id utas opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates` apa pun.
Ketika Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya dari
induk paling sempit ke percakapan paling luas/dasar.

Gunakan `openclaw/plugin-sdk/channel-route` ketika kode Plugin perlu menormalkan
field seperti rute, membandingkan utas anak dengan rute induknya, atau membangun
kunci dedupe stabil dari `{ channel, to, accountId, threadId }`. Helper tersebut
menormalkan id utas numerik dengan cara yang sama seperti inti, sehingga Plugin sebaiknya
menggunakannya alih-alih perbandingan ad hoc `String(threadId)`.
Plugin dengan tata bahasa target spesifik penyedia dapat menginjeksikan parser mereka ke
`resolveChannelRouteTargetWithParser(...)` dan tetap mendapatkan bentuk target rute yang sama
serta semantik fallback utas yang digunakan inti.

Plugin bawaan yang membutuhkan parsing yang sama sebelum registry saluran melakukan boot
juga dapat mengekspos file tingkat atas `session-key-api.ts` dengan ekspor
`resolveSessionConversation(...)` yang sesuai. Inti menggunakan permukaan aman-bootstrap tersebut
hanya ketika registry Plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai
fallback kompatibilitas lama ketika Plugin hanya membutuhkan fallback induk di atas
id umum/raw. Jika kedua hook ada, inti menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
fallback ke `resolveParentConversationCandidates(...)` ketika hook kanonis
menghilangkannya.

## Persetujuan dan kemampuan saluran

Sebagian besar Plugin saluran tidak memerlukan kode khusus persetujuan.

- Inti memiliki `/approve` dalam chat yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Lebih baik gunakan satu objek `approvalCapability` pada Plugin kanal ketika kanal memerlukan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` dihapus. Letakkan fakta pengiriman/native/render/auth persetujuan pada `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; inti tidak lagi membaca hook auth persetujuan dari objek tersebut.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah titik sambungan auth persetujuan kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan dalam chat yang sama.
- Jika kanal Anda mengekspos persetujuan exec native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk status permukaan pemulai/klien native ketika berbeda dari auth persetujuan dalam chat yang sama. Inti menggunakan hook khusus exec itu untuk membedakan `enabled` vs `disabled`, menentukan apakah kanal pemulai mendukung persetujuan exec native, dan menyertakan kanal dalam panduan fallback klien native. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload khusus kanal seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator mengetik sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk routing persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native milik kanal. Pertahankan agar tetap lazy pada entrypoint kanal panas dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai kebutuhan sambil tetap memungkinkan inti menyusun siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya ketika kanal benar-benar memerlukan payload persetujuan kustom, bukan renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` ketika kanal ingin balasan jalur nonaktif menjelaskan knob konfigurasi persis yang diperlukan untuk mengaktifkan persetujuan exec native. Hook menerima `{ channel, channelLabel, accountId }`; kanal akun bernama harus merender path berlingkup akun seperti `channels.<channel>.accounts.<id>.execApprovals.*`, bukan default level teratas.
- Jika kanal dapat menyimpulkan identitas DM yang stabil dan mirip pemilik dari konfigurasi yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` dalam chat yang sama tanpa menambahkan logika inti khusus persetujuan.
- Jika kanal memerlukan pengiriman persetujuan native, jaga agar kode kanal berfokus pada normalisasi target plus fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Letakkan fakta khusus kanal di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, sehingga inti dapat menyusun handler dan memiliki pemfilteran permintaan, routing, dedupe, kedaluwarsa, langganan Gateway, dan pemberitahuan dirutekan-ke-tempat-lain. `nativeRuntime` dipecah menjadi beberapa titik sambungan yang lebih kecil:
- `createChannelNativeOriginTargetResolver` menggunakan pencocok rute kanal bersama secara default untuk target `{ to, accountId, threadId }`. Teruskan `targetsMatch` hanya ketika kanal memiliki aturan ekuivalensi khusus penyedia, seperti pencocokan prefiks timestamp Slack.
- Teruskan `normalizeTargetForMatch` ke `createChannelNativeOriginTargetResolver` ketika kanal perlu mengkanoniskan id penyedia sebelum pencocok rute default atau callback `targetsMatch` kustom berjalan, sambil mempertahankan target asli untuk pengiriman. Gunakan `normalizeTarget` hanya ketika target pengiriman yang terselesaikan itu sendiri harus dikanoniskan.
- `availability` - apakah akun dikonfigurasi dan apakah permintaan harus ditangani
- `presentation` - petakan model tampilan persetujuan bersama menjadi payload native tertunda/terselesaikan/kedaluwarsa atau tindakan final
- `transport` - siapkan target plus kirim/perbarui/hapus pesan persetujuan native
- `interactions` - hook opsional bind/unbind/clear-action untuk tombol atau reaksi native
- `observe` - hook diagnostik pengiriman opsional
- Jika kanal memerlukan objek milik runtime seperti klien, token, aplikasi Bolt, atau penerima webhook, daftarkan melalui `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context generik memungkinkan inti mem-bootstrap handler berbasis kapabilitas dari status startup kanal tanpa menambahkan perekat wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` level lebih rendah hanya ketika titik sambungan berbasis kapabilitas belum cukup ekspresif.
- Kanal persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap berlingkup ke akun bot yang benar, dan `approvalKind` menjaga perilaku persetujuan exec vs Plugin tetap tersedia bagi kanal tanpa cabang hardcoded di inti.
- Inti sekarang juga memiliki pemberitahuan reroute persetujuan. Plugin kanal tidak boleh mengirim pesan tindak lanjut mereka sendiri seperti "persetujuan dikirim ke DM / kanal lain" dari `createChannelNativeApprovalRuntime`; sebagai gantinya, ekspos routing asal + DM pemberi persetujuan yang akurat melalui helper kapabilitas persetujuan bersama dan biarkan inti mengagregasi pengiriman aktual sebelum memposting pemberitahuan apa pun kembali ke chat pemulai.
- Pertahankan jenis id persetujuan yang dikirimkan dari awal sampai akhir. Klien native tidak boleh
  menebak atau menulis ulang routing persetujuan exec vs Plugin dari status lokal kanal.
- Jenis persetujuan berbeda dapat secara sengaja mengekspos permukaan native berbeda.
  Contoh bundled saat ini:
  - Slack mempertahankan routing persetujuan native tersedia untuk id exec dan Plugin.
  - Matrix mempertahankan routing DM/kanal native dan UX reaksi yang sama untuk persetujuan exec
    dan Plugin, sambil tetap memungkinkan auth berbeda menurut jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya memilih builder kapabilitas dan mengekspos `approvalCapability` pada Plugin.

Untuk entrypoint kanal panas, pilih subpath runtime yang lebih sempit ketika Anda hanya
memerlukan satu bagian dari keluarga tersebut:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Demikian juga, pilih `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` ketika Anda tidak memerlukan permukaan payung yang lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  adapter patch setup yang aman diimpor (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder
  setup-proxy terdelegasi
- `openclaw/plugin-sdk/setup-adapter-runtime` adalah titik sambungan adapter sempit yang sadar env
  untuk `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder setup optional-install
  plus beberapa primitif yang aman untuk setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika kanal Anda mendukung setup atau auth berbasis env dan alur startup/config
generik harus mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan di
manifest Plugin dengan `channelEnvVars`. Simpan `envVars` runtime kanal atau konstanta lokal
hanya untuk salinan yang ditujukan bagi operator.

Jika kanal Anda dapat muncul dalam `status`, `channels list`, `channels status`, atau
pemindaian SecretRef sebelum runtime Plugin dimulai, tambahkan `openclaw.setupEntry` di
`package.json`. Entrypoint tersebut harus aman diimpor pada path perintah read-only
dan harus mengembalikan metadata kanal, adapter config yang aman untuk setup, adapter status,
dan metadata target secret kanal yang diperlukan untuk ringkasan tersebut. Jangan
memulai klien, listener, atau runtime transport dari entry setup.

Pertahankan path impor entri kanal utama tetap sempit juga. Discovery dapat mengevaluasi
entri dan modul Plugin kanal untuk mendaftarkan kapabilitas tanpa mengaktifkan
kanal. File seperti `channel-plugin-api.ts` harus mengekspor objek Plugin kanal
tanpa mengimpor wizard setup, klien transport, listener socket,
peluncur subprocess, atau modul startup layanan. Letakkan bagian runtime tersebut
dalam modul yang dimuat dari `registerFull(...)`, setter runtime, atau adapter
kapabilitas lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan titik sambungan `openclaw/plugin-sdk/setup` yang lebih luas hanya ketika Anda juga memerlukan
  helper setup/config bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika kanal Anda hanya ingin mengiklankan "instal Plugin ini terlebih dahulu" di permukaan
setup, pilih `createOptionalChannelSetupSurface(...)`. Adapter/wizard yang dihasilkan
gagal tertutup pada penulisan config dan finalisasi, serta menggunakan kembali
pesan install-required yang sama di seluruh validasi, finalisasi, dan salinan tautan docs.

Untuk path kanal panas lainnya, pilih helper sempit dibandingkan permukaan legacy yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk config multi-akun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk rute/envelope masuk dan
  wiring catat-dan-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk parsing/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media plus delegasi
  identitas/kirim outbound dan perencanaan payload
- `buildThreadAwareOutboundSessionRoute(...)` dari
  `openclaw/plugin-sdk/channel-core` ketika rute outbound harus mempertahankan
  `replyToId`/`threadId` eksplisit atau memulihkan sesi `:thread:` saat ini
  setelah kunci sesi dasar masih cocok. Plugin penyedia dapat menimpa
  presedensi, perilaku sufiks, dan normalisasi id thread ketika platform mereka
  memiliki semantik pengiriman thread native.
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan pendaftaran adapter
- `openclaw/plugin-sdk/agent-media-payload` hanya ketika tata letak field payload agent/media
  legacy masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi custom-command Telegram,
  validasi duplikat/konflik, dan kontrak config perintah yang stabil untuk fallback

Kanal auth-only biasanya dapat berhenti di path default: inti menangani persetujuan dan Plugin hanya mengekspos kapabilitas outbound/auth. Kanal persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom harus menggunakan helper native bersama, bukan membuat siklus hidup persetujuan sendiri.

## Kebijakan mention masuk

Pertahankan penanganan mention masuk terbagi dalam dua lapisan:

- pengumpulan bukti milik Plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan mention.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya ketika Anda memerlukan barrel helper inbound
yang lebih luas.

Cocok untuk logika lokal Plugin:

- deteksi reply-to-bot
- deteksi quoted-bot
- pemeriksaan partisipasi thread
- pengecualian pesan layanan/sistem
- cache native platform yang diperlukan untuk membuktikan partisipasi bot

Cocok untuk helper bersama:

- `requireMention`
- hasil penyebutan eksplisit
- allowlist penyebutan implisit
- bypass perintah
- keputusan lewati final

Alur yang disarankan:

1. Hitung fakta penyebutan lokal.
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

`api.runtime.channel.mentions` mengekspos helper penyebutan bersama yang sama untuk
Plugin kanal bawaan yang sudah bergantung pada injeksi runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jika Anda hanya membutuhkan `implicitMentionKindWhen` dan
`resolveInboundMentionDecision`, impor dari
`openclaw/plugin-sdk/channel-mention-gating` untuk menghindari pemuatan helper
runtime inbound yang tidak terkait.

Helper `resolveMentionGating*` yang lebih lama tetap ada di
`openclaw/plugin-sdk/channel-inbound` hanya sebagai ekspor kompatibilitas. Kode baru
sebaiknya menggunakan `resolveInboundMentionDecision({ facts, policy })`.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifes">
    Buat file Plugin standar. Bidang `channel` di `package.json` adalah
    yang membuat ini menjadi Plugin kanal. Untuk surface metadata paket lengkap,
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
    pengaturan milik Plugin yang bukan konfigurasi akun kanal. `channelConfigs`
    memvalidasi `channels.acme-chat` dan merupakan sumber cold-path yang digunakan oleh skema
    konfigurasi, penyiapan, dan surface UI sebelum runtime Plugin dimuat.

  </Step>

  <Step title="Bangun objek Plugin kanal">
    Antarmuka `ChannelPlugin` memiliki banyak surface adapter opsional. Mulailah dengan
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

    Untuk kanal yang menerima kunci DM tingkat atas kanonis dan kunci bersarang legacy, gunakan helper dari `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, dan `normalizeChannelDmPolicy` mempertahankan nilai lokal akun di depan nilai root yang diwariskan. Pasangkan resolver yang sama dengan perbaikan doctor melalui `normalizeLegacyDmAliases` agar runtime dan migrasi membaca kontrak yang sama.

    <Accordion title="Yang dilakukan createChatChannelPlugin untuk Anda">
      Alih-alih mengimplementasikan antarmuka adapter tingkat rendah secara manual, Anda meneruskan
      opsi deklaratif dan builder menyusunnya:

      | Opsi | Yang dihubungkannya |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM tercakup dari bidang konfigurasi |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode reply-to (tetap, tercakup akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi kirim yang mengembalikan metadata hasil (ID pesan) |

      Anda juga dapat meneruskan objek adapter mentah alih-alih opsi deklaratif
      jika membutuhkan kendali penuh.

      Adapter outbound mentah dapat mendefinisikan fungsi `chunker(text, limit, ctx)`.
      `ctx.formatting` opsional membawa keputusan pemformatan saat pengiriman
      seperti `maxLinesPerMessage`; terapkan sebelum mengirim agar threading balasan
      dan batas chunk diselesaikan sekali oleh pengiriman outbound bersama.
      Konteks kirim juga menyertakan `replyToIdSource` (`implicit` atau `explicit`)
      ketika target balasan native telah diselesaikan, sehingga helper payload dapat mempertahankan
      tag balasan eksplisit tanpa memakai slot balasan sekali pakai implisit.
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

    Letakkan deskriptor CLI milik kanal di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya di bantuan root tanpa mengaktifkan runtime kanal penuh,
    sementara pemuatan penuh normal tetap mengambil deskriptor yang sama untuk pendaftaran
    perintah nyata. Simpan `registerFull(...)` untuk pekerjaan khusus runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC Gateway, gunakan
    prefiks khusus Plugin. Namespace admin inti (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    diselesaikan ke `operator.admin`.
    `defineChannelPluginEntry` menangani pemisahan mode pendaftaran secara otomatis. Lihat
    [Entry Point](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsi.

  </Step>

  <Step title="Tambahkan entry penyiapan">
    Buat `setup-entry.ts` untuk pemuatan ringan selama onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat ini alih-alih entry penuh saat kanal dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari penarikan kode runtime berat selama alur penyiapan.
    Lihat [Penyiapan dan Konfigurasi](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Kanal workspace bawaan yang memisahkan ekspor aman-penyiapan ke modul sidecar
    dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` ketika juga membutuhkan
    setter runtime waktu-penyiapan eksplisit.

  </Step>

  <Step title="Tangani pesan inbound">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola umumnya adalah Webhook yang memverifikasi permintaan dan
    mendispatchnya melalui handler inbound kanal Anda:

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
      Penanganan pesan masuk bersifat spesifik per channel. Setiap Plugin channel memiliki
      pipeline masuknya sendiri. Lihat Plugin channel bawaan
      (misalnya paket Plugin Microsoft Teams atau Google Chat) untuk pola nyata.
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
    describeMessageTool dan penemuan aksi
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/id/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagen melalui api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/id/plugins/sdk-channel-turn">
    Siklus hidup giliran masuk bersama: ingest, resolve, record, dispatch, finalize
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bawaan masih ada untuk pemeliharaan Plugin bawaan dan
kompatibilitas. Itu bukan pola yang direkomendasikan untuk Plugin channel baru;
utamakan subpath channel/setup/reply/runtime generik dari permukaan SDK umum
kecuali Anda memelihara keluarga Plugin bawaan tersebut secara langsung.
</Note>

## Langkah berikutnya

- [Plugin Penyedia](/id/plugins/sdk-provider-plugins) - jika Plugin Anda juga menyediakan model
- [Ikhtisar SDK](/id/plugins/sdk-overview) - referensi impor subpath lengkap
- [Pengujian SDK](/id/plugins/sdk-testing) - utilitas pengujian dan pengujian kontrak
- [Manifes Plugin](/id/plugins/manifest) - skema manifes lengkap

## Terkait

- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
