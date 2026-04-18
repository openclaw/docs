---
read_when:
    - Anda sedang membangun plugin saluran perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami permukaan adaptor ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun plugin saluran perpesanan untuk OpenClaw
title: Membangun Plugin Saluran
x-i18n:
    generated_at: "2026-04-18T09:05:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3dda53c969bc7356a450c2a5bf49fb82bf1283c23e301dec832d8724b11e724b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Membangun Plugin Saluran

Panduan ini membahas langkah demi langkah membangun plugin saluran yang menghubungkan OpenClaw ke platform perpesanan. Pada akhir panduan, Anda akan memiliki saluran yang berfungsi dengan keamanan DM, pairing, threading balasan, dan pesan keluar.

<Info>
  Jika Anda belum pernah membangun plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket
  dasar dan penyiapan manifest.
</Info>

## Cara kerja plugin saluran

Plugin saluran tidak memerlukan alat send/edit/react sendiri. OpenClaw mempertahankan satu alat `message` bersama di core. Plugin Anda memiliki tanggung jawab atas:

- **Config** — resolusi akun dan wizard penyiapan
- **Security** — kebijakan DM dan allowlist
- **Pairing** — alur persetujuan DM
- **Session grammar** — cara id percakapan khusus provider dipetakan ke chat dasar, id thread, dan fallback induk
- **Outbound** — mengirim teks, media, dan polling ke platform
- **Threading** — cara balasan di-thread

Core memiliki alat message bersama, wiring prompt, bentuk luar session-key, pencatatan `:thread:` generik, dan dispatch.

Jika saluran Anda menambahkan parameter message-tool yang membawa sumber media, tampilkan nama parameter tersebut melalui `describeMessageTool(...).mediaSourceParams`. Core menggunakan daftar eksplisit itu untuk normalisasi path sandbox dan kebijakan akses media keluar, sehingga plugin tidak memerlukan kasus khusus shared-core untuk parameter avatar, lampiran, atau gambar sampul yang khusus provider.
Lebih disukai untuk mengembalikan map yang dikunci berdasarkan action seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` sehingga action yang tidak terkait tidak mewarisi argumen media milik action lain. Array datar juga tetap berfungsi untuk parameter yang memang sengaja dibagikan di setiap action yang diekspos.

Jika platform Anda menyimpan cakupan tambahan di dalam id percakapan, pertahankan parsing itu di plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah hook kanonis untuk memetakan `rawId` ke id percakapan dasar, id thread opsional, `baseConversationId` eksplisit, dan `parentConversationCandidates` apa pun.
Saat Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya dari induk yang paling sempit ke percakapan dasar/yang paling luas.

Plugin bawaan yang memerlukan parsing yang sama sebelum registri saluran boot
juga dapat mengekspos file `session-key-api.ts` tingkat atas dengan ekspor
`resolveSessionConversation(...)` yang cocok. Core menggunakan surface yang
aman untuk bootstrap itu hanya ketika registri plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai fallback kompatibilitas lama ketika plugin hanya memerlukan fallback induk di atas id generik/raw. Jika kedua hook ada, core menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya kembali ke `resolveParentConversationCandidates(...)` ketika hook kanonis tidak menyediakannya.

## Persetujuan dan kapabilitas saluran

Sebagian besar plugin saluran tidak memerlukan kode khusus persetujuan.

- Core memiliki `/approve` dalam chat yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Gunakan satu objek `approvalCapability` pada plugin saluran saat saluran memerlukan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` telah dihapus. Letakkan fakta pengiriman/native/render/auth persetujuan pada `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; core tidak lagi membaca hook auth persetujuan dari objek tersebut.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan yang kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan dalam chat yang sama.
- Jika saluran Anda mengekspos persetujuan exec native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk status permukaan pemicu/native-client saat berbeda dari auth persetujuan dalam chat yang sama. Core menggunakan hook khusus exec itu untuk membedakan `enabled` vs `disabled`, memutuskan apakah saluran pemicu mendukung persetujuan exec native, dan menyertakan saluran itu dalam panduan fallback native-client. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload khusus saluran seperti menyembunyikan prompt persetujuan lokal yang duplikat atau mengirim indikator mengetik sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk routing persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native yang dimiliki saluran. Pertahankan tetap lazy pada entrypoint saluran hot dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai kebutuhan sambil tetap memungkinkan core menyusun siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya ketika sebuah saluran benar-benar memerlukan payload persetujuan kustom alih-alih renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` ketika saluran ingin balasan jalur disabled menjelaskan knob config persis yang dibutuhkan untuk mengaktifkan persetujuan exec native. Hook menerima `{ channel, channelLabel, accountId }`; saluran named-account harus merender path berskala akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default tingkat atas.
- Jika saluran dapat menyimpulkan identitas DM mirip pemilik yang stabil dari config yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` dalam chat yang sama tanpa menambahkan logika khusus persetujuan di core.
- Jika saluran memerlukan pengiriman persetujuan native, pastikan kode saluran tetap berfokus pada normalisasi target plus fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Letakkan fakta khusus saluran di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, sehingga core dapat menyusun handler dan memiliki penyaringan permintaan, routing, dedupe, expiry, subscription gateway, dan pemberitahuan routed-elsewhere. `nativeRuntime` dibagi menjadi beberapa seam yang lebih kecil:
- `availability` — apakah akun sudah dikonfigurasi dan apakah permintaan harus ditangani
- `presentation` — memetakan view model persetujuan bersama ke payload native pending/resolved/expired atau action final
- `transport` — menyiapkan target plus mengirim/memperbarui/menghapus pesan persetujuan native
- `interactions` — hook bind/unbind/clear-action opsional untuk tombol atau reaksi native
- `observe` — hook diagnostik pengiriman opsional
- Jika saluran memerlukan objek milik runtime seperti client, token, aplikasi Bolt, atau penerima Webhook, daftarkan objek tersebut melalui `openclaw/plugin-sdk/channel-runtime-context`. Registri runtime-context generik memungkinkan core melakukan bootstrap terhadap handler berbasis kapabilitas dari state startup saluran tanpa menambahkan glue wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` tingkat rendah hanya ketika seam berbasis kapabilitas belum cukup ekspresif.
- Saluran persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga agar kebijakan persetujuan multi-akun tetap dibatasi pada akun bot yang tepat, dan `approvalKind` menjaga agar perilaku persetujuan exec vs plugin tetap tersedia untuk saluran tanpa cabang hardcoded di core.
- Core kini juga memiliki pemberitahuan reroute persetujuan. Plugin saluran tidak boleh mengirim pesan tindak lanjut sendiri seperti "approval went to DMs / another channel" dari `createChannelNativeApprovalRuntime`; sebagai gantinya, tampilkan routing origin + approver-DM yang akurat melalui helper kapabilitas persetujuan bersama dan biarkan core mengagregasi pengiriman aktual sebelum memposting pemberitahuan kembali ke chat pemicu.
- Pertahankan jenis id persetujuan yang dikirim secara end-to-end. Client native tidak boleh menebak atau menulis ulang routing persetujuan exec vs plugin dari state lokal saluran.
- Jenis persetujuan yang berbeda memang dapat dengan sengaja mengekspos permukaan native yang berbeda.
  Contoh bawaan saat ini:
  - Slack mempertahankan routing persetujuan native tersedia untuk id exec maupun plugin.
  - Matrix mempertahankan routing DM/saluran native yang sama dan UX reaksi untuk persetujuan exec dan plugin, sambil tetap memungkinkan auth berbeda menurut jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya memilih builder kapabilitas dan mengekspos `approvalCapability` pada plugin.

Untuk entrypoint saluran hot, pilih subpath runtime yang lebih sempit saat Anda hanya memerlukan satu bagian dari keluarga itu:

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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` ketika Anda tidak memerlukan surface payung yang lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  adaptor patch setup yang aman untuk import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder
  setup-proxy terdelegasi
- `openclaw/plugin-sdk/setup-adapter-runtime` adalah seam adaptor sempit yang sadar env
  untuk `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder setup instalasi opsional
  plus beberapa primitif yang aman untuk setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika saluran Anda mendukung setup atau auth berbasis env dan alur startup/config generik harus mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan itu di manifest plugin dengan `channelEnvVars`. Pertahankan `envVars` runtime saluran atau konstanta lokal hanya untuk salinan yang ditujukan kepada operator.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya ketika Anda juga memerlukan
  helper setup/config bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika saluran Anda hanya ingin mengiklankan "instal plugin ini terlebih dahulu" di surface setup, gunakan `createOptionalChannelSetupSurface(...)`. Adaptor/wizard yang dihasilkan gagal tertutup pada penulisan config dan finalisasi, dan mereka menggunakan ulang pesan yang sama tentang instalasi yang diperlukan di seluruh validasi, finalize, dan salinan tautan dokumen.

Untuk path saluran hot lainnya, pilih helper sempit daripada surface lama yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk config multi-akun dan
  fallback default-account
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk wiring route/envelope masuk dan
  record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk parsing/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media plus delegasi
  identitas/pengiriman keluar
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan pendaftaran adaptor
- `openclaw/plugin-sdk/agent-media-payload` hanya ketika tata letak field payload agent/media lama
  masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi custom-command Telegram,
  validasi duplikat/konflik, dan kontrak config perintah yang stabil terhadap fallback

Saluran khusus auth biasanya dapat berhenti di jalur default: core menangani persetujuan dan plugin hanya mengekspos kapabilitas outbound/auth. Saluran persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom sebaiknya menggunakan helper native bersama alih-alih membuat siklus hidup persetujuan sendiri.

## Kebijakan mention masuk

Pertahankan penanganan mention masuk terbagi menjadi dua lapisan:

- pengumpulan bukti yang dimiliki plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan mention.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya saat Anda memerlukan barrel helper inbound yang lebih luas.

Cocok untuk logika lokal plugin:

- deteksi balasan-ke-bot
- deteksi kutipan-bot
- pemeriksaan partisipasi thread
- pengecualian pesan layanan/sistem
- cache native platform yang diperlukan untuk membuktikan partisipasi bot

Cocok untuk helper bersama:

- `requireMention`
- hasil mention eksplisit
- allowlist mention implisit
- bypass perintah
- keputusan akhir untuk melewati

Alur yang disarankan:

1. Hitung fakta mention lokal.
2. Teruskan fakta tersebut ke `resolveInboundMentionDecision({ facts, policy })`.
3. Gunakan `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, dan `decision.shouldSkip` di gerbang inbound Anda.

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

`api.runtime.channel.mentions` mengekspos helper mention bersama yang sama untuk plugin saluran bawaan yang sudah bergantung pada injeksi runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Jika Anda hanya memerlukan `implicitMentionKindWhen` dan
`resolveInboundMentionDecision`, impor dari
`openclaw/plugin-sdk/channel-mention-gating` untuk menghindari memuat helper runtime inbound lain yang tidak terkait.

Helper `resolveMentionGating*` yang lebih lama tetap ada di
`openclaw/plugin-sdk/channel-inbound` hanya sebagai ekspor kompatibilitas. Kode baru sebaiknya menggunakan `resolveInboundMentionDecision({ facts, policy })`.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifest">
    Buat file plugin standar. Field `channel` di `package.json` adalah
    yang membuat ini menjadi plugin saluran. Untuk surface metadata paket yang lengkap,
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

  <Step title="Bangun objek plugin saluran">
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
      Alih-alih menerapkan antarmuka adaptor tingkat rendah secara manual, Anda meneruskan
      opsi deklaratif dan builder akan menyusunnya:

      | Opsi | Yang dihubungkan |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM terlingkup dari field config |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode-balas-ke (tetap, berskala akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi kirim yang mengembalikan metadata hasil (id pesan) |

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

    Letakkan descriptor CLI milik saluran di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya di bantuan root tanpa mengaktifkan runtime saluran penuh,
    sementara pemuatan penuh normal tetap mengambil descriptor yang sama untuk pendaftaran perintah sungguhan. Pertahankan `registerFull(...)` untuk pekerjaan yang hanya ada di runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC Gateway, gunakan
    prefiks khusus plugin. Namespace admin core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    di-resolve ke `operator.admin`.
    `defineChannelPluginEntry` menangani pemisahan mode pendaftaran secara otomatis. Lihat
    [Entry Points](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsi.

  </Step>

  <Step title="Tambahkan entry setup">
    Buat `setup-entry.ts` untuk pemuatan ringan selama onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat ini alih-alih entry penuh ketika saluran dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari penarikan kode runtime yang berat selama alur setup.
    Lihat [Setup and Config](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Saluran workspace bawaan yang memisahkan ekspor aman-setup ke modul sidecar
    dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` ketika mereka juga memerlukan
    setter runtime eksplisit saat setup.

  </Step>

  <Step title="Tangani pesan masuk">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola yang umum adalah Webhook yang memverifikasi permintaan dan
    mendispatch-nya melalui handler inbound milik saluran Anda:

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
      Penanganan pesan masuk bersifat khusus saluran. Setiap plugin saluran memiliki
      pipeline inbound-nya sendiri. Lihat plugin saluran bawaan
      (misalnya paket plugin Microsoft Teams atau Google Chat) untuk pola nyata.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Uji">
Tulis pengujian yang diletakkan berdampingan di `src/channel.test.ts`:

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
├── package.json              # metadata openclaw.channel
├── openclaw.plugin.json      # Manifest dengan skema config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Ekspor publik (opsional)
├── runtime-api.ts            # Ekspor runtime internal (opsional)
└── src/
    ├── channel.ts            # ChannelPlugin melalui createChatChannelPlugin
    ├── channel.test.ts       # Pengujian
    ├── client.ts             # Client API platform
    └── runtime.ts            # Penyimpanan runtime (jika diperlukan)
```

## Topik lanjutan

<CardGroup cols={2}>
  <Card title="Opsi threading" icon="git-branch" href="/id/plugins/sdk-entrypoints#registration-mode">
    Mode balasan tetap, berskala akun, atau kustom
  </Card>
  <Card title="Integrasi alat message" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool dan penemuan action
  </Card>
  <Card title="Resolusi target" icon="crosshair" href="/id/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagent melalui api.runtime
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bawaan masih ada untuk pemeliharaan bundled-plugin dan
kompatibilitas. Itu bukan pola yang direkomendasikan untuk plugin saluran baru;
pilih subpath saluran/setup/balasan/runtime generik dari surface SDK bersama
kecuali Anda sedang memelihara keluarga bundled plugin tersebut secara langsung.
</Note>

## Langkah berikutnya

- [Plugin Provider](/id/plugins/sdk-provider-plugins) — jika plugin Anda juga menyediakan model
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [Pengujian SDK](/id/plugins/sdk-testing) — utilitas pengujian dan pengujian kontrak
- [Manifest Plugin](/id/plugins/manifest) — skema manifest lengkap
