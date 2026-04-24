---
read_when:
    - Anda sedang membangun Plugin channel messaging baru
    - Anda ingin menghubungkan OpenClaw ke platform messaging
    - Anda perlu memahami surface adapter ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun Plugin channel messaging untuk OpenClaw
title: 'Membangun Plugin channel】【：】【“】【analysis to=commentary.functions.read 彩票主管  天天彩票怎么  彩神争霸 开号网址  大发彩票快三  ฝ่ายขายละคร:  重庆时时彩彩 code  重庆时时彩的  彩神争霸是  彩神争霸是  彩神争霸能 "path":"/home/runner/work/docs/docs/source/docs/.i18n/glossary.id.json"} will open file to see if Channel term translation maybe should be Channels or saluran.'
x-i18n:
    generated_at: "2026-04-24T09:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Panduan ini menjelaskan langkah demi langkah membangun Plugin channel yang menghubungkan OpenClaw ke sebuah
platform messaging. Pada akhirnya Anda akan memiliki channel yang berfungsi dengan keamanan DM,
pairing, threading balasan, dan messaging keluar.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket
  dasar dan penyiapan manifest.
</Info>

## Cara kerja Plugin channel

Plugin channel tidak memerlukan tool send/edit/react mereka sendiri. OpenClaw menyimpan satu
tool `message` bersama di core. Plugin Anda memiliki:

- **Config** — resolusi akun dan wizard penyiapan
- **Security** — kebijakan DM dan allowlist
- **Pairing** — alur persetujuan DM
- **Session grammar** — bagaimana id percakapan spesifik provider dipetakan ke chat dasar, thread id, dan fallback induk
- **Outbound** — mengirim teks, media, dan poll ke platform
- **Threading** — bagaimana balasan di-thread
- **Heartbeat typing** — sinyal typing/busy opsional untuk target pengiriman Heartbeat

Core memiliki tool message bersama, wiring prompt, bentuk luar session-key,
pembukuan generik `:thread:`, dan dispatch.

Jika channel Anda mendukung typing indicator di luar balasan masuk, tampilkan
`heartbeat.sendTyping(...)` pada Plugin channel. Core memanggilnya dengan
target pengiriman Heartbeat yang telah diselesaikan sebelum proses model Heartbeat dimulai dan
menggunakan siklus hidup keepalive/cleanup typing bersama. Tambahkan `heartbeat.clearTyping(...)`
saat platform memerlukan sinyal berhenti eksplisit.

Jika channel Anda menambahkan parameter message-tool yang membawa sumber media, tampilkan nama
parameter tersebut melalui `describeMessageTool(...).mediaSourceParams`. Core menggunakan daftar eksplisit
itu untuk normalisasi path sandbox dan kebijakan akses media keluar, sehingga Plugin tidak memerlukan special case shared-core untuk parameter avatar, lampiran, atau gambar sampul yang spesifik provider.
Lebih baik kembalikan peta yang diberi key tindakan seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` sehingga tindakan yang tidak terkait tidak
mewarisi argumen media tindakan lain. Array datar tetap berfungsi untuk parameter yang
memang sengaja dibagikan di setiap tindakan yang diekspos.

Jika platform Anda menyimpan cakupan tambahan di dalam conversation id, pertahankan parsing
itu di Plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah hook kanonis
untuk memetakan `rawId` ke base conversation id, thread id opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates` apa pun.
Saat Anda mengembalikan `parentConversationCandidates`, jaga agar urutannya dari induk
yang paling sempit ke percakapan induk/dasar yang paling luas.

Plugin bawaan yang memerlukan parsing yang sama sebelum registry channel melakukan boot
juga dapat mengekspose file tingkat atas `session-key-api.ts` dengan
ekspor `resolveSessionConversation(...)` yang sesuai. Core menggunakan surface yang aman untuk bootstrap
itu hanya saat registry Plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai fallback kompatibilitas lama saat sebuah Plugin hanya memerlukan fallback induk di atas generic/raw id. Jika kedua hook ada, core menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
fallback ke `resolveParentConversationCandidates(...)` saat hook kanonis
menghilangkannya.

## Persetujuan dan kapabilitas channel

Sebagian besar Plugin channel tidak memerlukan kode khusus persetujuan.

- Core memiliki `/approve` dalam chat yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Utamakan satu objek `approvalCapability` pada Plugin channel saat channel memerlukan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` dihapus. Letakkan fakta persetujuan delivery/native/render/auth di `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; core tidak lagi membaca hook auth persetujuan dari objek itu.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan yang kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan dalam chat yang sama.
- Jika channel Anda mengekspose persetujuan exec native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk status client native/surface pemicu saat berbeda dari auth persetujuan dalam chat yang sama. Core menggunakan hook khusus exec itu untuk membedakan `enabled` vs `disabled`, memutuskan apakah channel pemicu mendukung persetujuan exec native, dan menyertakan channel dalam panduan fallback native-client. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload yang spesifik channel seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim typing indicator sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk routing persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native milik channel. Jaga agar lazy pada hot channel entrypoint dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai permintaan sambil tetap memungkinkan core merakit siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya saat sebuah channel benar-benar memerlukan payload persetujuan kustom alih-alih renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` saat channel ingin balasan jalur nonaktif menjelaskan key config yang tepat yang dibutuhkan untuk mengaktifkan persetujuan exec native. Hook menerima `{ channel, channelLabel, accountId }`; channel akun bernama seharusnya merender path dengan cakupan akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default tingkat atas.
- Jika sebuah channel dapat menyimpulkan identitas DM yang stabil mirip owner dari config yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` dalam chat yang sama tanpa menambahkan logika core khusus persetujuan.
- Jika sebuah channel memerlukan pengiriman persetujuan native, jaga agar kode channel tetap fokus pada normalisasi target plus fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Letakkan fakta spesifik channel di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, sehingga core dapat merakit handler dan memiliki penyaringan permintaan, routing, dedupe, expiry, subscription Gateway, dan notifikasi routed-elsewhere. `nativeRuntime` dibagi menjadi beberapa seam yang lebih kecil:
- `availability` — apakah akun sudah dikonfigurasi dan apakah sebuah permintaan harus ditangani
- `presentation` — memetakan shared approval view model ke payload native pending/resolved/expired atau tindakan final
- `transport` — menyiapkan target plus mengirim/memperbarui/menghapus pesan persetujuan native
- `interactions` — hook bind/unbind/clear-action opsional untuk tombol atau reaksi native
- `observe` — hook diagnostik pengiriman opsional
- Jika channel memerlukan objek milik runtime seperti klien, token, aplikasi Bolt, atau penerima webhook, daftarkan melalui `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context generik memungkinkan core melakukan bootstrap handler yang didorong kapabilitas dari status startup channel tanpa menambahkan glue wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` tingkat rendah hanya saat seam berbasis kapabilitas belum cukup ekspresif.
- Channel persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap dicakup ke akun bot yang tepat, dan `approvalKind` menjaga perilaku persetujuan exec vs Plugin tetap tersedia untuk channel tanpa cabang hardcoded di core.
- Core kini juga memiliki notifikasi reroute persetujuan. Plugin channel seharusnya tidak mengirim pesan tindak lanjut mereka sendiri seperti "approval went to DMs / another channel" dari `createChannelNativeApprovalRuntime`; sebaliknya, ekspos routing origin + approver-DM yang akurat melalui helper kapabilitas persetujuan bersama dan biarkan core mengagregasi pengiriman aktual sebelum memposting notifikasi kembali ke chat pemicu.
- Pertahankan jenis id persetujuan yang dikirim dari ujung ke ujung. Klien native tidak boleh
  menebak atau menulis ulang routing persetujuan exec vs Plugin dari status lokal channel.
- Jenis persetujuan yang berbeda dapat dengan sengaja mengekspose surface native yang berbeda.
  Contoh bawaan saat ini:
  - Slack menjaga routing persetujuan native tetap tersedia untuk id exec maupun Plugin.
  - Matrix menjaga routing DM/channel native dan UX reaksi yang sama untuk persetujuan exec
    dan Plugin, sambil tetap membiarkan auth berbeda menurut jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru seharusnya lebih memilih capability builder dan mengekspose `approvalCapability` pada Plugin.

Untuk hot channel entrypoint, lebih baik gunakan subpath runtime yang lebih sempit saat Anda hanya
memerlukan satu bagian dari keluarga itu:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Demikian juga, lebih baik gunakan `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` saat Anda tidak memerlukan umbrella
surface yang lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  adapter patch setup yang aman untuk impor (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder delegated
  setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` adalah seam adapter env-aware yang
  sempit untuk `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder setup optional-install plus beberapa primitif yang aman untuk setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika channel Anda mendukung setup atau auth berbasis env dan alur startup/config generik
harus mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan di
manifest Plugin dengan `channelEnvVars`. Pertahankan `envVars` runtime channel atau
konstanta lokal hanya untuk salinan yang menghadap operator.

Jika channel Anda dapat muncul di `status`, `channels list`, `channels status`, atau pemindaian SecretRef sebelum runtime Plugin dimulai, tambahkan `openclaw.setupEntry` di
`package.json`. Entry point itu harus aman untuk diimpor dalam jalur perintah read-only
dan harus mengembalikan metadata channel, adapter config yang aman untuk setup, status
adapter, dan metadata target secret channel yang diperlukan untuk ringkasan tersebut. Jangan
memulai klien, listener, atau transport runtime dari setup entry.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya saat Anda juga memerlukan
  helper setup/config bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika channel Anda hanya ingin mengiklankan "install this plugin first" di surface setup,
lebih baik gunakan `createOptionalChannelSetupSurface(...)`. Adapter/wizard yang dihasilkan gagal secara fail-closed pada penulisan config dan finalisasi, dan mereka menggunakan ulang pesan install-required yang sama di seluruh copy validasi, finalize, dan docs-link.

Untuk hot channel path lainnya, lebih baik gunakan helper yang sempit daripada surface lama yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk konfigurasi multi-akun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk wiring route/envelope
  masuk serta record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk parsing/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media plus delegate
  identitas/pengiriman keluar dan perencanaan payload
- `buildThreadAwareOutboundSessionRoute(...)` dari
  `openclaw/plugin-sdk/channel-core` saat route keluar seharusnya mempertahankan
  `replyToId`/`threadId` eksplisit atau memulihkan sesi `:thread:` saat ini
  setelah base session key masih cocok. Plugin provider dapat menimpa
  prioritas, perilaku sufiks, dan normalisasi thread id saat platform mereka
  memiliki semantik pengiriman thread native.
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan registrasi adapter
- `openclaw/plugin-sdk/agent-media-payload` hanya saat tata letak field
  payload agen/media lama masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi custom-command Telegram, validasi duplikat/konflik, dan kontrak konfigurasi perintah yang stabil sebagai fallback

Channel yang hanya auth biasanya dapat berhenti di jalur default: core menangani persetujuan dan Plugin hanya mengekspose kapabilitas outbound/auth. Channel persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom seharusnya menggunakan helper native bersama alih-alih membuat sendiri siklus hidup persetujuannya.

## Kebijakan mention masuk

Pertahankan penanganan mention masuk terpisah menjadi dua lapisan:

- pengumpulan bukti milik Plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan mention.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya saat Anda memerlukan barrel helper inbound
yang lebih luas.

Cocok untuk logika lokal Plugin:

- deteksi balasan ke bot
- deteksi kutipan bot
- pemeriksaan partisipasi thread
- pengecualian pesan service/system
- cache native platform yang dibutuhkan untuk membuktikan partisipasi bot

Cocok untuk helper bersama:

- `requireMention`
- hasil mention eksplisit
- allowlist mention implisit
- bypass perintah
- keputusan akhir untuk skip

Alur yang diutamakan:

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

`api.runtime.channel.mentions` mengekspose helper mention bersama yang sama untuk
Plugin channel bawaan yang sudah bergantung pada injeksi runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jika Anda hanya memerlukan `implicitMentionKindWhen` dan
`resolveInboundMentionDecision`, impor dari
`openclaw/plugin-sdk/channel-mention-gating` untuk menghindari memuat helper runtime
inbound lain yang tidak terkait.

Helper lama `resolveMentionGating*` tetap ada di
`openclaw/plugin-sdk/channel-inbound` hanya sebagai ekspor kompatibilitas. Kode baru
seharusnya menggunakan `resolveInboundMentionDecision({ facts, policy })`.

## Walkthrough

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifest">
    Buat file Plugin standar. Field `channel` di `package.json` adalah
    yang menjadikan ini Plugin channel. Untuk surface metadata paket lengkap,
    lihat [Plugin Setup and Config](/id/plugins/sdk-setup#openclaw-channel):

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
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Bangun objek Plugin channel">
    Interface `ChannelPlugin` memiliki banyak surface adapter opsional. Mulailah dengan
    minimum — `id` dan `setup` — lalu tambahkan adapter sesuai kebutuhan.

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

      // Keamanan DM: siapa yang dapat mengirim pesan ke bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: alur persetujuan untuk kontak DM baru
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: bagaimana balasan dikirim
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: kirim pesan ke platform
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

    <Accordion title="Apa yang dilakukan createChatChannelPlugin untuk Anda">
      Alih-alih mengimplementasikan interface adapter tingkat rendah secara manual, Anda memberikan
      opsi deklaratif dan builder akan menyusunnya:

      | Option | What it wires |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM dengan cakupan dari field config |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode reply-to (tetap, dengan cakupan akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi pengiriman yang mengembalikan metadata hasil (message ID) |

      Anda juga dapat memberikan objek adapter mentah alih-alih opsi deklaratif
      jika memerlukan kontrol penuh.
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

    Letakkan deskriptor CLI milik channel di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya di root help tanpa mengaktifkan runtime channel penuh,
    sementara pemuatan penuh normal tetap mengambil deskriptor yang sama untuk registrasi perintah nyata.
    Pertahankan `registerFull(...)` untuk pekerjaan yang hanya ada saat runtime.
    Jika `registerFull(...)` mendaftarkan metode Gateway RPC, gunakan
    prefiks khusus Plugin. Namespace admin core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    diselesaikan ke `operator.admin`.
    `defineChannelPluginEntry` menangani pemisahan mode registrasi secara otomatis. Lihat
    [Entry Points](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsinya.

  </Step>

  <Step title="Tambahkan setup entry">
    Buat `setup-entry.ts` untuk pemuatan ringan selama onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat ini alih-alih entry penuh saat channel dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari penarikan kode runtime berat selama alur setup.
    Lihat [Setup and Config](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Channel workspace bawaan yang memisahkan ekspor aman-setup ke modul sidecar
    dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` saat mereka juga memerlukan
    setter runtime eksplisit pada waktu setup.

  </Step>

  <Step title="Tangani pesan masuk">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola yang umum adalah webhook yang memverifikasi permintaan dan
    mengirimkannya melalui inbound handler milik channel Anda:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth dikelola Plugin (verifikasi signature sendiri)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Inbound handler Anda mengirimkan pesan ke OpenClaw.
          // Wiring persisnya bergantung pada SDK platform Anda —
          // lihat contoh nyata di paket Plugin Microsoft Teams atau Google Chat bawaan.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      Penanganan pesan masuk bersifat khusus per channel. Setiap Plugin channel memiliki
      pipeline masuknya sendiri. Lihat Plugin channel bawaan
      (misalnya paket Plugin Microsoft Teams atau Google Chat) untuk pola nyata.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Uji">
Tulis test yang diletakkan berdampingan di `src/channel.test.ts`:

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

    Untuk helper test bersama, lihat [Testing](/id/plugins/sdk-testing).

  </Step>
</Steps>

## Struktur file

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadata openclaw.channel
├── openclaw.plugin.json      # Manifest dengan schema config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Ekspor publik (opsional)
├── runtime-api.ts            # Ekspor runtime internal (opsional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # Klien API platform
    └── runtime.ts            # Penyimpanan runtime (jika diperlukan)
```

## Topik lanjutan

<CardGroup cols={2}>
  <Card title="Opsi threading" icon="git-branch" href="/id/plugins/sdk-entrypoints#registration-mode">
    Mode balas tetap, dengan cakupan akun, atau kustom
  </Card>
  <Card title="Integrasi message tool" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool dan penemuan tindakan
  </Card>
  <Card title="Resolusi target" icon="crosshair" href="/id/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagen melalui api.runtime
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bawaan masih ada untuk pemeliharaan Plugin bawaan dan
kompatibilitas. Seam ini bukan pola yang direkomendasikan untuk Plugin channel baru;
lebih baik gunakan subpath channel/setup/reply/runtime generik dari surface SDK
umum kecuali Anda memang memelihara keluarga Plugin bawaan itu secara langsung.
</Note>

## Langkah selanjutnya

- [Provider Plugins](/id/plugins/sdk-provider-plugins) — jika Plugin Anda juga menyediakan model
- [SDK Overview](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [SDK Testing](/id/plugins/sdk-testing) — utilitas test dan contract test
- [Plugin Manifest](/id/plugins/manifest) — schema manifest lengkap

## Terkait

- [Setup Plugin SDK](/id/plugins/sdk-setup)
- [Membangun Plugins](/id/plugins/building-plugins)
- [Plugin harness agen](/id/plugins/sdk-agent-harness)
