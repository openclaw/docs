---
read_when:
    - Anda sedang membangun plugin channel perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami permukaan adaptor ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun plugin channel perpesanan untuk OpenClaw
title: Membangun Plugin Channel
x-i18n:
    generated_at: "2026-04-21T19:20:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35cae55c13b69f2219bd2f9bd3ee2f7d8c4075bd87f0be11c35a0fddb070fe1e
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Membangun Plugin Channel

Panduan ini memandu Anda membangun plugin channel yang menghubungkan OpenClaw ke platform
perpesanan. Pada akhirnya Anda akan memiliki channel yang berfungsi dengan keamanan DM,
pairing, threading balasan, dan pengiriman pesan keluar.

<Info>
  Jika Anda belum pernah membangun plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket
  dasar dan penyiapan manifest.
</Info>

## Cara kerja plugin channel

Plugin channel tidak memerlukan tool send/edit/react mereka sendiri. OpenClaw menyimpan satu
tool `message` bersama di core. Plugin Anda memiliki:

- **Config** — resolusi akun dan wizard penyiapan
- **Security** — kebijakan DM dan allowlist
- **Pairing** — alur persetujuan DM
- **Tata bahasa sesi** — bagaimana id percakapan khusus penyedia dipetakan ke chat dasar, id thread, dan fallback induk
- **Outbound** — mengirim teks, media, dan polling ke platform
- **Threading** — bagaimana balasan di-thread

Core memiliki tool pesan bersama, pengkabelan prompt, bentuk kunci sesi luar,
pencatatan `:thread:` generik, dan dispatch.

Jika channel Anda menambahkan param message-tool yang membawa sumber media, tampilkan
nama param tersebut melalui `describeMessageTool(...).mediaSourceParams`. Core menggunakan
daftar eksplisit itu untuk normalisasi path sandbox dan kebijakan akses-media keluar,
jadi plugin tidak memerlukan kasus khusus shared-core untuk param avatar, lampiran,
atau gambar sampul yang khusus penyedia.
Sebaiknya kembalikan map yang diberi kunci tindakan seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` agar tindakan yang tidak terkait tidak
mewarisi argumen media dari tindakan lain. Array datar tetap berfungsi untuk param yang
memang sengaja dibagikan di setiap tindakan yang diekspos.

Jika platform Anda menyimpan cakupan tambahan di dalam id percakapan, simpan parsing
itu di plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah hook kanonis
untuk memetakan `rawId` ke id percakapan dasar, id thread opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates` apa pun.
Saat Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya dari
induk yang paling sempit ke percakapan induk/dasar yang paling luas.

Plugin bundel yang memerlukan parsing yang sama sebelum registry channel aktif
juga dapat mengekspos file `session-key-api.ts` tingkat atas dengan
ekspor `resolveSessionConversation(...)` yang sesuai. Core menggunakan surface yang aman saat bootstrap
itu hanya ketika registry plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai fallback kompatibilitas lama
ketika plugin hanya memerlukan fallback induk di atas id generik/raw.
Jika kedua hook ada, core menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
kembali ke `resolveParentConversationCandidates(...)` ketika hook kanonis
menghilangkannya.

## Persetujuan dan kapabilitas channel

Sebagian besar plugin channel tidak memerlukan kode khusus persetujuan.

- Core memiliki `/approve` chat yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Pilih satu objek `approvalCapability` pada plugin channel saat channel memerlukan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` dihapus. Tempatkan fakta pengiriman/presentasi/render/auth persetujuan di `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; core tidak lagi membaca hook auth persetujuan dari objek itu.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth-persetujuan kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan chat yang sama.
- Jika channel Anda mengekspos persetujuan exec native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk status initiating-surface/native-client saat berbeda dari auth persetujuan chat yang sama. Core menggunakan hook khusus exec itu untuk membedakan `enabled` vs `disabled`, memutuskan apakah channel pemula mendukung persetujuan exec native, dan menyertakan channel itu dalam panduan fallback native-client. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload khusus channel seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator mengetik sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk perutean persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native yang dimiliki channel. Buat tetap lazy pada entrypoint channel yang hot dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda saat diminta sambil tetap memungkinkan core menyusun siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya ketika channel benar-benar memerlukan payload persetujuan kustom alih-alih renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` ketika channel ingin balasan jalur-disabled menjelaskan knob config yang tepat yang diperlukan untuk mengaktifkan persetujuan exec native. Hook menerima `{ channel, channelLabel, accountId }`; channel akun-bernama harus merender path bercakupan akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default tingkat atas.
- Jika channel dapat menyimpulkan identitas DM mirip-pemilik yang stabil dari config yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` chat yang sama tanpa menambahkan logika khusus persetujuan ke core.
- Jika channel memerlukan pengiriman persetujuan native, tetap fokuskan kode channel pada normalisasi target plus fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Letakkan fakta khusus channel di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, agar core dapat menyusun handler dan memiliki pemfilteran permintaan, perutean, dedupe, kedaluwarsa, subscription gateway, dan pemberitahuan dialihkan-ke-tempat-lain. `nativeRuntime` dibagi menjadi beberapa seam yang lebih kecil:
- `availability` — apakah akun dikonfigurasi dan apakah permintaan harus ditangani
- `presentation` — petakan model tampilan persetujuan bersama ke payload native pending/resolved/expired atau tindakan akhir
- `transport` — siapkan target plus kirim/perbarui/hapus pesan persetujuan native
- `interactions` — hook bind/unbind/clear-action opsional untuk tombol atau reaksi native
- `observe` — hook diagnostik pengiriman opsional
- Jika channel memerlukan objek milik runtime seperti client, token, aplikasi Bolt, atau penerima Webhook, daftarkan melalui `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context generik memungkinkan core melakukan bootstrap handler yang digerakkan oleh kapabilitas dari status startup channel tanpa menambahkan glue wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` tingkat lebih rendah hanya ketika seam yang digerakkan kapabilitas belum cukup ekspresif.
- Channel persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap dicakup ke akun bot yang tepat, dan `approvalKind` menjaga perilaku persetujuan exec vs plugin tetap tersedia bagi channel tanpa cabang yang di-hardcode di core.
- Core sekarang juga memiliki pemberitahuan reroute persetujuan. Plugin channel tidak boleh mengirim pesan tindak lanjut mereka sendiri "persetujuan dikirim ke DM / channel lain" dari `createChannelNativeApprovalRuntime`; sebagai gantinya, tampilkan perutean asal + DM approver yang akurat melalui helper kapabilitas persetujuan bersama dan biarkan core mengagregasi pengiriman aktual sebelum memposting pemberitahuan kembali ke chat pemula.
- Pertahankan jenis id persetujuan yang dikirim dari ujung ke ujung. Client native tidak boleh
  menebak atau menulis ulang perutean persetujuan exec vs plugin dari status lokal channel.
- Berbagai jenis persetujuan dapat dengan sengaja mengekspos surface native yang berbeda.
  Contoh bundel saat ini:
  - Slack menjaga perutean persetujuan native tetap tersedia untuk id exec dan plugin.
  - Matrix menjaga perutean DM/channel native dan UX reaksi yang sama untuk persetujuan exec
    dan plugin, sambil tetap memungkinkan auth berbeda menurut jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya memilih builder kapabilitas dan mengekspos `approvalCapability` pada plugin.

Untuk entrypoint channel yang hot, pilih subpath runtime yang lebih sempit saat Anda hanya
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

Demikian juga, pilih `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` saat Anda tidak memerlukan surface payung
yang lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  adaptor patch setup yang aman untuk impor (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder
  setup-proxy yang didelegasikan
- `openclaw/plugin-sdk/setup-adapter-runtime` adalah
  seam adaptor sadar-env yang sempit untuk `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder setup instalasi-opsional
  ditambah beberapa primitif yang aman untuk setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika channel Anda mendukung setup atau auth berbasis env dan alur startup/config generik
perlu mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan di
manifest plugin dengan `channelEnvVars`. Simpan `envVars` runtime channel atau konstanta lokal
untuk salinan yang ditujukan kepada operator saja.

Jika channel Anda dapat muncul di `status`, `channels list`, `channels status`, atau pemindaian SecretRef sebelum runtime plugin dimulai, tambahkan `openclaw.setupEntry` di `package.json`. Entrypoint itu harus aman untuk diimpor dalam path perintah read-only dan harus mengembalikan metadata channel, adaptor config yang aman untuk setup, adaptor status, dan metadata target secret channel yang diperlukan untuk ringkasan tersebut. Jangan memulai client, listener, atau runtime transport dari entri setup.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya ketika Anda juga memerlukan
  helper setup/config bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika channel Anda hanya ingin mengiklankan "instal plugin ini terlebih dahulu" di
surface setup, pilih `createOptionalChannelSetupSurface(...)`. Adapter/wizard yang dihasilkan gagal tertutup pada penulisan config dan finalisasi, dan menggunakan kembali pesan install-required yang sama di validasi, finalize, dan salinan tautan docs.

Untuk path channel hot lainnya, pilih helper yang sempit daripada surface lama yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk config multi-akun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk route/envelope inbound dan
  pengkabelan record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk parsing/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media plus
  delegasi identitas/pengiriman outbound dan perencanaan payload
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan pendaftaran adaptor
- `openclaw/plugin-sdk/agent-media-payload` hanya ketika tata letak field payload
  agent/media lama masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi
  custom-command Telegram, validasi duplikat/konflik, dan kontrak config
  command yang stabil untuk fallback

Channel yang hanya auth biasanya dapat berhenti di path default: core menangani persetujuan dan plugin hanya mengekspos kapabilitas outbound/auth. Channel persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom sebaiknya menggunakan helper native bersama alih-alih membuat siklus hidup persetujuan sendiri.

## Kebijakan mention inbound

Pertahankan penanganan mention inbound terbagi dalam dua lapisan:

- pengumpulan bukti yang dimiliki plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan mention.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya ketika Anda memerlukan helper inbound
yang lebih luas.

Cocok untuk logika lokal plugin:

- deteksi balasan-ke-bot
- deteksi kutipan-bot
- pemeriksaan partisipasi thread
- pengecualian service/system-message
- cache native platform yang diperlukan untuk membuktikan partisipasi bot

Cocok untuk helper bersama:

- `requireMention`
- hasil mention eksplisit
- allowlist mention implisit
- bypass command
- keputusan akhir untuk skip

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
plugin channel bundel yang sudah bergantung pada injeksi runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jika Anda hanya memerlukan `implicitMentionKindWhen` dan
`resolveInboundMentionDecision`, impor dari
`openclaw/plugin-sdk/channel-mention-gating` untuk menghindari memuat helper runtime
inbound yang tidak terkait.

Helper `resolveMentionGating*` yang lebih lama tetap ada di
`openclaw/plugin-sdk/channel-inbound` sebagai ekspor kompatibilitas saja. Kode baru
sebaiknya menggunakan `resolveInboundMentionDecision({ facts, policy })`.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifest">
    Buat file plugin standar. Field `channel` di `package.json` adalah
    yang menjadikan ini plugin channel. Untuk surface metadata paket lengkap,
    lihat [Penyiapan dan Config Plugin](/id/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Bangun objek plugin channel">
    Antarmuka `ChannelPlugin` memiliki banyak surface adaptor opsional. Mulailah dengan
    yang minimum — `id` dan `setup` — lalu tambahkan adaptor sesuai kebutuhan.

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

    <Accordion title="Apa yang dilakukan createChatChannelPlugin untuk Anda">
      Alih-alih mengimplementasikan antarmuka adaptor tingkat rendah secara manual, Anda meneruskan
      opsi deklaratif dan builder akan menyusunnya:

      | Option | Yang dihubungkan |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM bercakupan dari field config |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode reply-to (tetap, bercakupan akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi kirim yang mengembalikan metadata hasil (ID pesan) |

      Anda juga dapat meneruskan objek adaptor mentah alih-alih opsi deklaratif
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

    Letakkan descriptor CLI yang dimiliki channel di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya di bantuan root tanpa mengaktifkan runtime channel penuh,
    sementara pemuatan penuh normal tetap mengambil descriptor yang sama untuk pendaftaran
    command yang sebenarnya. Pertahankan `registerFull(...)` untuk pekerjaan yang hanya runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC Gateway, gunakan
    prefix khusus plugin. Namespace admin core (`config.*`,
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

    OpenClaw memuat ini alih-alih entri penuh ketika channel dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari penarikan kode runtime yang berat selama alur setup.
    Lihat [Setup and Config](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Channel workspace bundel yang memisahkan ekspor aman-setup ke modul sidecar
    dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` ketika juga memerlukan
    setter runtime waktu-setup yang eksplisit.

  </Step>

  <Step title="Tangani pesan inbound">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola yang umum adalah Webhook yang memverifikasi permintaan dan
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
      Penanganan pesan inbound bersifat khusus channel. Setiap plugin channel memiliki
      pipeline inbound-nya sendiri. Lihat plugin channel bundel
      (misalnya paket plugin Microsoft Teams atau Google Chat) untuk pola nyata.
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
  <Card title="Integrasi tool pesan" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool dan penemuan tindakan
  </Card>
  <Card title="Resolusi target" icon="crosshair" href="/id/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagent melalui api.runtime
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bundel masih ada untuk pemeliharaan plugin bundel dan
kompatibilitas. Itu bukan pola yang direkomendasikan untuk plugin channel baru;
pilih subpath channel/setup/reply/runtime generik dari surface SDK umum
kecuali Anda memang memelihara keluarga plugin bundel tersebut secara langsung.
</Note>

## Langkah berikutnya

- [Plugin Provider](/id/plugins/sdk-provider-plugins) — jika plugin Anda juga menyediakan model
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Pengujian SDK](/id/plugins/sdk-testing) — utilitas pengujian dan uji kontrak
- [Manifest Plugin](/id/plugins/manifest) — skema manifest lengkap
