---
read_when:
    - Anda sedang membuat Plugin saluran perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami antarmuka adaptor ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membuat Plugin saluran perpesanan untuk OpenClaw
title: Membangun Plugin saluran
x-i18n:
    generated_at: "2026-04-30T10:03:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Panduan ini menjelaskan cara membuat plugin kanal yang menghubungkan OpenClaw ke
platform perpesanan. Pada akhirnya, Anda akan memiliki kanal yang berfungsi dengan keamanan DM,
pairing, threading balasan, dan pengiriman pesan keluar.

<Info>
  Jika Anda belum pernah membuat plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket dasar
  dan penyiapan manifest.
</Info>

## Cara kerja plugin kanal

Plugin kanal tidak memerlukan alat kirim/edit/reaksi miliknya sendiri. OpenClaw mempertahankan satu
alat `message` bersama di inti. Plugin Anda memiliki:

- **Konfigurasi** — resolusi akun dan wizard penyiapan
- **Keamanan** — kebijakan DM dan allowlist
- **Pairing** — alur persetujuan DM
- **Tata bahasa sesi** — bagaimana id percakapan khusus penyedia dipetakan ke chat dasar, id thread, dan fallback induk
- **Keluar** — mengirim teks, media, dan polling ke platform
- **Threading** — bagaimana balasan dibuat dalam thread
- **Pengetikan Heartbeat** — sinyal mengetik/sibuk opsional untuk target pengiriman Heartbeat

Inti memiliki alat pesan bersama, wiring prompt, bentuk kunci sesi luar,
pencatatan `:thread:` generik, dan dispatch.

Jika kanal Anda mendukung indikator mengetik di luar balasan masuk, ekspos
`heartbeat.sendTyping(...)` pada plugin kanal. Inti memanggilnya dengan
target pengiriman Heartbeat yang sudah diselesaikan sebelum model Heartbeat mulai berjalan dan
menggunakan siklus hidup keepalive/cleanup pengetikan bersama. Tambahkan `heartbeat.clearTyping(...)`
ketika platform memerlukan sinyal berhenti eksplisit.

Jika kanal Anda menambahkan param alat pesan yang membawa sumber media, ekspos nama
param tersebut melalui `describeMessageTool(...).mediaSourceParams`. Inti menggunakan
daftar eksplisit itu untuk normalisasi path sandbox dan kebijakan akses media keluar,
sehingga plugin tidak memerlukan kasus khusus inti bersama untuk param avatar,
lampiran, atau gambar sampul yang khusus penyedia.
Utamakan mengembalikan peta berbasis kunci aksi seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` agar aksi yang tidak terkait tidak
mewarisi argumen media aksi lain. Array datar tetap berfungsi untuk param yang
sengaja dibagikan di semua aksi yang diekspos.

Jika platform Anda menyimpan scope tambahan di dalam id percakapan, pertahankan parsing itu
di plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah hook
kanonis untuk memetakan `rawId` ke id percakapan dasar, id thread opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates` apa pun.
Saat Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya dari
induk tersempit ke percakapan terluas/dasar.

Gunakan `openclaw/plugin-sdk/channel-route` ketika kode plugin perlu menormalkan
field yang mirip rute, membandingkan thread turunan dengan rute induknya, atau membuat
kunci dedupe stabil dari `{ channel, to, accountId, threadId }`. Helper tersebut
menormalkan id thread numerik dengan cara yang sama seperti inti, sehingga plugin sebaiknya mengutamakannya
daripada perbandingan ad hoc `String(threadId)`.
Plugin dengan tata bahasa target khusus penyedia dapat menyuntikkan parsernya ke
`resolveChannelRouteTargetWithParser(...)` dan tetap mendapatkan bentuk target rute
serta semantik fallback thread yang sama seperti yang digunakan inti.

Plugin bawaan yang memerlukan parsing yang sama sebelum registry kanal aktif
juga dapat mengekspos file `session-key-api.ts` tingkat atas dengan ekspor
`resolveSessionConversation(...)` yang cocok. Inti menggunakan permukaan yang aman untuk bootstrap itu
hanya ketika registry plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai
fallback kompatibilitas lama ketika plugin hanya memerlukan fallback induk di atas
id generik/mentah. Jika kedua hook ada, inti menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
fallback ke `resolveParentConversationCandidates(...)` ketika hook kanonis
menghilangkannya.

## Persetujuan dan kapabilitas kanal

Sebagian besar plugin kanal tidak memerlukan kode khusus persetujuan.

- Inti memiliki `/approve` dalam chat yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Utamakan satu objek `approvalCapability` pada plugin kanal ketika kanal memerlukan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` dihapus. Letakkan fakta pengiriman/native/render/auth persetujuan pada `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; inti tidak lagi membaca hook auth persetujuan dari objek itu.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan dalam chat yang sama.
- Jika kanal Anda mengekspos persetujuan eksekusi native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk status permukaan pemicu/klien native ketika berbeda dari auth persetujuan dalam chat yang sama. Inti menggunakan hook khusus eksekusi itu untuk membedakan `enabled` vs `disabled`, menentukan apakah kanal pemicu mendukung persetujuan eksekusi native, dan menyertakan kanal dalam panduan fallback klien native. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload khusus kanal seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator mengetik sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk routing persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native milik kanal. Pertahankan agar tetap lazy pada entrypoint kanal panas dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai permintaan sambil tetap memungkinkan inti menyusun siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya ketika kanal benar-benar memerlukan payload persetujuan khusus alih-alih renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` ketika kanal ingin balasan jalur nonaktif menjelaskan knob konfigurasi persis yang diperlukan untuk mengaktifkan persetujuan eksekusi native. Hook menerima `{ channel, channelLabel, accountId }`; kanal akun bernama sebaiknya merender path berscope akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default tingkat atas.
- Jika kanal dapat menyimpulkan identitas DM yang stabil seperti pemilik dari konfigurasi yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` dalam chat yang sama tanpa menambahkan logika inti khusus persetujuan.
- Jika kanal memerlukan pengiriman persetujuan native, pertahankan kode kanal tetap berfokus pada normalisasi target ditambah fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Letakkan fakta khusus kanal di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, sehingga inti dapat menyusun handler dan memiliki pemfilteran permintaan, routing, dedupe, kedaluwarsa, langganan Gateway, dan pemberitahuan dirutekan-ke-tempat-lain. `nativeRuntime` dipecah menjadi beberapa seam yang lebih kecil:
- `createChannelNativeOriginTargetResolver` menggunakan pencocok channel-route bersama secara default untuk target `{ to, accountId, threadId }`. Teruskan `targetsMatch` hanya ketika kanal memiliki aturan ekuivalensi khusus penyedia, seperti pencocokan prefiks timestamp Slack.
- Teruskan `normalizeTargetForMatch` ke `createChannelNativeOriginTargetResolver` ketika kanal perlu mengkanoniskan id penyedia sebelum pencocok rute default atau callback `targetsMatch` khusus berjalan, sambil mempertahankan target asli untuk pengiriman. Gunakan `normalizeTarget` hanya ketika target pengiriman yang diselesaikan itu sendiri harus dikanoniskan.
- `availability` — apakah akun sudah dikonfigurasi dan apakah permintaan harus ditangani
- `presentation` — memetakan model tampilan persetujuan bersama ke payload native tertunda/diselesaikan/kedaluwarsa atau aksi akhir
- `transport` — menyiapkan target serta mengirim/memperbarui/menghapus pesan persetujuan native
- `interactions` — hook bind/unbind/clear-action opsional untuk tombol atau reaksi native
- `observe` — hook diagnostik pengiriman opsional
- Jika kanal memerlukan objek milik runtime seperti klien, token, aplikasi Bolt, atau penerima webhook, daftarkan melalui `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context generik memungkinkan inti melakukan bootstrap handler berbasis kapabilitas dari status startup kanal tanpa menambahkan lem wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` tingkat lebih rendah hanya ketika seam berbasis kapabilitas belum cukup ekspresif.
- Kanal persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap terscope ke akun bot yang benar, dan `approvalKind` menjaga perilaku persetujuan eksekusi vs plugin tetap tersedia bagi kanal tanpa cabang hardcoded di inti.
- Inti kini juga memiliki pemberitahuan reroute persetujuan. Plugin kanal tidak boleh mengirim pesan lanjutan "persetujuan dikirim ke DM / kanal lain" miliknya sendiri dari `createChannelNativeApprovalRuntime`; sebagai gantinya, ekspos routing asal + DM pemberi persetujuan yang akurat melalui helper kapabilitas persetujuan bersama dan biarkan inti mengagregasi pengiriman aktual sebelum memposting pemberitahuan apa pun kembali ke chat pemicu.
- Pertahankan jenis id persetujuan yang dikirimkan dari ujung ke ujung. Klien native tidak boleh
  menebak atau menulis ulang routing persetujuan eksekusi vs plugin dari status lokal kanal.
- Jenis persetujuan yang berbeda dapat secara sengaja mengekspos permukaan native yang berbeda.
  Contoh bawaan saat ini:
  - Slack mempertahankan routing persetujuan native tersedia untuk id eksekusi dan plugin.
  - Matrix mempertahankan routing DM/kanal native dan UX reaksi yang sama untuk persetujuan eksekusi
    dan plugin, sambil tetap membiarkan auth berbeda menurut jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya mengutamakan pembuat kapabilitas dan mengekspos `approvalCapability` pada plugin.

Untuk entrypoint kanal panas, utamakan subpath runtime yang lebih sempit ketika Anda hanya
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

Demikian juga, utamakan `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` ketika Anda tidak memerlukan permukaan payung
yang lebih luas.

Khusus untuk penyiapan:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper penyiapan yang aman untuk runtime:
  adapter patch penyiapan yang aman impor (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan pembuat
  proksi penyiapan terdelegasi
- `openclaw/plugin-sdk/setup-adapter-runtime` adalah seam adapter sempit yang sadar env
  untuk `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup pembuat penyiapan instalasi opsional
  ditambah beberapa primitif yang aman untuk penyiapan:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika kanal Anda mendukung penyiapan atau auth berbasis env dan alur startup/konfigurasi
generik perlu mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan nama tersebut dalam
manifest plugin dengan `channelEnvVars`. Pertahankan `envVars` runtime kanal atau konstanta lokal
hanya untuk salinan yang ditujukan kepada operator.

Jika saluran Anda dapat muncul di `status`, `channels list`, `channels status`, atau
pemindaian SecretRef sebelum runtime Plugin dimulai, tambahkan `openclaw.setupEntry` di
`package.json`. Titik masuk tersebut harus aman untuk diimpor di jalur perintah hanya-baca
dan harus mengembalikan metadata saluran, adapter konfigurasi yang aman untuk penyiapan, adapter status,
serta metadata target rahasia saluran yang diperlukan untuk ringkasan tersebut. Jangan
memulai klien, listener, atau runtime transport dari entri penyiapan.

Jaga jalur impor entri saluran utama tetap sempit juga. Discovery dapat mengevaluasi
entri dan modul Plugin saluran untuk mendaftarkan kapabilitas tanpa mengaktifkan
saluran. File seperti `channel-plugin-api.ts` harus mengekspor objek Plugin
saluran tanpa mengimpor wizard penyiapan, klien transport, listener socket,
peluncur subproses, atau modul startup layanan. Letakkan bagian runtime
tersebut di modul yang dimuat dari `registerFull(...)`, setter runtime, atau adapter
kapabilitas lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya saat Anda juga memerlukan
  helper penyiapan/konfigurasi bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika saluran Anda hanya ingin mengiklankan "instal Plugin ini terlebih dahulu" di permukaan
penyiapan, utamakan `createOptionalChannelSetupSurface(...)`. Adapter/wizard yang dihasilkan
gagal tertutup pada penulisan konfigurasi dan finalisasi, serta menggunakan kembali
pesan perlu-instal yang sama di seluruh validasi, finalisasi, dan salinan tautan dokumentasi.

Untuk jalur saluran hot lainnya, utamakan helper sempit daripada permukaan legacy
yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk konfigurasi multi-akun dan
  fallback akun-default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk rute/amplop inbound dan
  wiring rekam-dan-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk parsing/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media beserta delegasi
  identitas/kirim outbound dan perencanaan payload
- `buildThreadAwareOutboundSessionRoute(...)` dari
  `openclaw/plugin-sdk/channel-core` saat rute outbound harus mempertahankan
  `replyToId`/`threadId` eksplisit atau memulihkan sesi `:thread:` saat ini
  setelah kunci sesi dasar masih cocok. Plugin penyedia dapat mengganti
  prioritas, perilaku sufiks, dan normalisasi id thread saat platform mereka
  memiliki semantik pengiriman thread native.
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk lifecycle thread-binding
  dan pendaftaran adapter
- `openclaw/plugin-sdk/agent-media-payload` hanya saat tata letak field payload
  agent/media legacy masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi custom-command
  Telegram, validasi duplikat/konflik, dan kontrak konfigurasi perintah yang
  stabil sebagai fallback

Saluran khusus auth biasanya dapat berhenti di jalur default: core menangani persetujuan dan Plugin hanya mengekspos kapabilitas outbound/auth. Saluran persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom harus menggunakan helper native bersama alih-alih membuat lifecycle persetujuan sendiri.

## Kebijakan mention inbound

Jaga penanganan mention inbound tetap terbagi dalam dua lapisan:

- pengumpulan bukti milik Plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan mention.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya saat Anda memerlukan barrel helper inbound
yang lebih luas.

Cocok untuk logika lokal Plugin:

- deteksi reply-to-bot
- deteksi quoted-bot
- pemeriksaan partisipasi thread
- pengecualian pesan layanan/sistem
- cache native platform yang diperlukan untuk membuktikan partisipasi bot

Cocok untuk helper bersama:

- `requireMention`
- hasil mention eksplisit
- allowlist mention implisit
- bypass perintah
- keputusan skip final

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
Plugin saluran bawaan yang sudah bergantung pada injeksi runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jika Anda hanya memerlukan `implicitMentionKindWhen` dan
`resolveInboundMentionDecision`, impor dari
`openclaw/plugin-sdk/channel-mention-gating` untuk menghindari pemuatan helper runtime
inbound yang tidak terkait.

Helper `resolveMentionGating*` yang lebih lama tetap berada di
`openclaw/plugin-sdk/channel-inbound` hanya sebagai ekspor kompatibilitas. Kode baru
sebaiknya menggunakan `resolveInboundMentionDecision({ facts, policy })`.

## Panduan

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifes">
    Buat file Plugin standar. Field `channel` di `package.json` adalah
    yang menjadikannya Plugin saluran. Untuk permukaan metadata paket lengkap,
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
    pengaturan milik Plugin yang bukan konfigurasi akun saluran. `channelConfigs`
    memvalidasi `channels.acme-chat` dan merupakan sumber cold-path yang digunakan oleh skema
    konfigurasi, penyiapan, dan permukaan UI sebelum runtime Plugin dimuat.

  </Step>

  <Step title="Bangun objek Plugin saluran">
    Antarmuka `ChannelPlugin` memiliki banyak permukaan adapter opsional. Mulai dengan
    minimum — `id` dan `setup` — lalu tambahkan adapter sesuai kebutuhan.

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

    Untuk saluran yang menerima kunci DM top-level kanonis dan kunci nested legacy, gunakan helper dari `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom`, dan `normalizeChannelDmPolicy` menjaga nilai lokal-akun tetap lebih dahulu daripada nilai root yang diwariskan. Pasangkan resolver yang sama dengan perbaikan doctor melalui `normalizeLegacyDmAliases` agar runtime dan migrasi membaca kontrak yang sama.

    <Accordion title="Apa yang createChatChannelPlugin lakukan untuk Anda">
      Alih-alih mengimplementasikan antarmuka adapter tingkat rendah secara manual, Anda meneruskan
      opsi deklaratif dan builder menyusunnya:

      | Opsi | Yang di-wiring |
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
      dan batas chunk diselesaikan sekali oleh pengiriman outbound bersama.
      Konteks kirim juga menyertakan `replyToIdSource` (`implicit` atau `explicit`)
      saat target balasan native berhasil diselesaikan, sehingga helper payload dapat mempertahankan
      tag balasan eksplisit tanpa menggunakan slot balasan implisit sekali pakai.
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

    Letakkan deskriptor CLI milik channel di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya di bantuan root tanpa mengaktifkan runtime channel penuh,
    sementara pemuatan penuh normal tetap mengambil deskriptor yang sama untuk pendaftaran
    perintah sungguhan. Pertahankan `registerFull(...)` untuk pekerjaan khusus runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC Gateway, gunakan
    prefiks khusus Plugin. Namespace admin inti (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    diselesaikan ke `operator.admin`.
    `defineChannelPluginEntry` menangani pemisahan mode pendaftaran secara otomatis. Lihat
    [Titik Masuk](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsi.

  </Step>

  <Step title="Tambahkan entri penyiapan">
    Buat `setup-entry.ts` untuk pemuatan ringan selama onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat ini sebagai pengganti entri penuh saat channel dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari pemuatan kode runtime berat selama alur penyiapan.
    Lihat [Penyiapan dan Konfigurasi](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Channel workspace bawaan yang memisahkan ekspor yang aman untuk penyiapan ke dalam modul
    sidecar dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` saat mereka juga memerlukan
    setter runtime eksplisit pada waktu penyiapan.

  </Step>

  <Step title="Tangani pesan inbound">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola umumnya adalah Webhook yang memverifikasi permintaan dan
    mengirimkannya melalui handler inbound channel Anda:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      Penanganan pesan inbound bersifat khusus channel. Setiap Plugin channel memiliki
      pipeline inbound-nya sendiri. Lihat Plugin channel bawaan
      (misalnya paket Plugin Microsoft Teams atau Google Chat) untuk pola nyata.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Uji">
Tulis pengujian berdampingan di `src/channel.test.ts`:

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
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagen melalui api.runtime
  </Card>
  <Card title="Kernel giliran channel" icon="bolt" href="/id/plugins/sdk-channel-turn">
    Siklus hidup giliran inbound bersama: serap, selesaikan, catat, kirim, finalisasi
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bawaan masih ada untuk pemeliharaan Plugin bawaan dan
kompatibilitas. Itu bukan pola yang direkomendasikan untuk Plugin channel baru;
utamakan subpath channel/setup/reply/runtime generik dari permukaan SDK umum
kecuali Anda memelihara keluarga Plugin bawaan tersebut secara langsung.
</Note>

## Langkah berikutnya

- [Plugin Provider](/id/plugins/sdk-provider-plugins) — jika Plugin Anda juga menyediakan model
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Pengujian SDK](/id/plugins/sdk-testing) — utilitas pengujian dan pengujian kontrak
- [Manifest Plugin](/id/plugins/manifest) — skema manifest lengkap

## Terkait

- [Penyiapan SDK Plugin](/id/plugins/sdk-setup)
- [Membangun Plugin](/id/plugins/building-plugins)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
