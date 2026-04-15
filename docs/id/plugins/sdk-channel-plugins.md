---
read_when:
    - Anda sedang membangun Plugin channel pesan baru
    - Anda ingin menghubungkan OpenClaw ke platform pesan
    - Anda perlu memahami permukaan adaptor ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun Plugin channel pesan untuk OpenClaw
title: Membangun Plugin Channel
x-i18n:
    generated_at: "2026-04-15T19:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80e47e61d1e47738361692522b79aff276544446c58a7b41afe5296635dfad4b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Membangun Plugin Channel

Panduan ini menjelaskan langkah demi langkah membangun plugin channel yang menghubungkan OpenClaw ke sebuah platform pesan. Pada akhirnya Anda akan memiliki channel yang berfungsi dengan keamanan DM, pairing, reply threading, dan pengiriman pesan keluar.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Memulai](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket
  dasar dan penyiapan manifest.
</Info>

## Cara kerja Plugin channel

Plugin channel tidak memerlukan tool send/edit/react sendiri. OpenClaw menyimpan satu tool `message` bersama di core. Plugin Anda memiliki:

- **Konfigurasi** — resolusi akun dan wizard penyiapan
- **Keamanan** — kebijakan DM dan allowlist
- **Pairing** — alur persetujuan DM
- **Tata bahasa sesi** — bagaimana id percakapan spesifik provider dipetakan ke chat dasar, id thread, dan fallback induk
- **Outbound** — mengirim teks, media, dan polling ke platform
- **Threading** — bagaimana balasan di-thread

Core memiliki tool message bersama, prompt wiring, bentuk luar session-key,
pencatatan `:thread:` generik, dan dispatch.

Jika channel Anda menambahkan parameter message-tool yang membawa sumber media, tampilkan nama parameter tersebut melalui `describeMessageTool(...).mediaSourceParams`. Core menggunakan daftar eksplisit tersebut untuk normalisasi path sandbox dan kebijakan akses media outbound, sehingga plugin tidak memerlukan kasus khusus shared-core untuk parameter avatar, lampiran, atau cover image yang spesifik provider.
Sebaiknya kembalikan map yang dikunci oleh action seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` agar action yang tidak terkait tidak
mewarisi argumen media milik action lain. Array datar tetap berfungsi untuk parameter yang memang sengaja dibagikan di setiap action yang diekspos.

Jika platform Anda menyimpan scope tambahan di dalam id percakapan, simpan parsing
tersebut di plugin dengan `messaging.resolveSessionConversation(...)`. Itulah hook kanonis untuk memetakan `rawId` ke id percakapan dasar, id thread opsional, `baseConversationId` eksplisit, dan `parentConversationCandidates` apa pun.
Saat Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya dari
induk yang paling sempit ke percakapan induk/dasar yang paling luas.

Plugin bawaan yang memerlukan parsing yang sama sebelum registry channel berjalan
juga dapat mengekspos file `session-key-api.ts` tingkat atas dengan export
`resolveSessionConversation(...)` yang sesuai. Core menggunakan permukaan yang aman untuk bootstrap itu hanya saat registry plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai fallback kompatibilitas lama ketika sebuah plugin hanya membutuhkan fallback induk di atas id generik/raw. Jika kedua hook ada, core menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
kembali ke `resolveParentConversationCandidates(...)` ketika hook kanonis
tidak menyediakannya.

## Persetujuan dan kapabilitas channel

Sebagian besar plugin channel tidak memerlukan kode khusus persetujuan.

- Core memiliki `/approve` same-chat, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Utamakan satu objek `approvalCapability` pada plugin channel ketika channel memerlukan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` telah dihapus. Tempatkan fakta delivery/native/render/auth persetujuan pada `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; core tidak lagi membaca hook auth persetujuan dari objek tersebut.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan same-chat.
- Jika channel Anda mengekspos persetujuan exec native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk status initiating-surface/native-client saat berbeda dari auth persetujuan same-chat. Core menggunakan hook khusus exec tersebut untuk membedakan `enabled` vs `disabled`, memutuskan apakah channel pemicu mendukung persetujuan exec native, dan menyertakan channel dalam panduan fallback native-client. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload yang spesifik channel seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator mengetik sebelum delivery.
- Gunakan `approvalCapability.delivery` hanya untuk routing persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native yang dimiliki channel. Buat tetap lazy pada entrypoint channel yang panas dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai kebutuhan sambil tetap memungkinkan core merakit siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya ketika channel benar-benar memerlukan payload persetujuan kustom alih-alih renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` ketika channel ingin balasan jalur nonaktif menjelaskan knob konfigurasi yang tepat yang diperlukan untuk mengaktifkan persetujuan exec native. Hook ini menerima `{ channel, channelLabel, accountId }`; channel dengan akun bernama sebaiknya merender path dengan scope akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default tingkat atas.
- Jika sebuah channel dapat menyimpulkan identitas DM mirip pemilik yang stabil dari konfigurasi yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` same-chat tanpa menambahkan logika core khusus persetujuan.
- Jika sebuah channel memerlukan delivery persetujuan native, pertahankan fokus kode channel pada normalisasi target ditambah fakta transport/presentation. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Tempatkan fakta spesifik channel di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, agar core dapat merakit handler dan memiliki penyaringan permintaan, routing, dedupe, expiry, subscription gateway, dan pemberitahuan routed-elsewhere. `nativeRuntime` dibagi menjadi beberapa seam yang lebih kecil:
- `availability` — apakah akun dikonfigurasi dan apakah suatu permintaan harus ditangani
- `presentation` — memetakan view model persetujuan bersama ke payload native pending/resolved/expired atau action final
- `transport` — menyiapkan target ditambah mengirim/memperbarui/menghapus pesan persetujuan native
- `interactions` — hook bind/unbind/clear-action opsional untuk tombol atau reaksi native
- `observe` — hook diagnostik delivery opsional
- Jika channel memerlukan objek milik runtime seperti client, token, aplikasi Bolt, atau penerima Webhook, daftarkan objek tersebut melalui `openclaw/plugin-sdk/channel-runtime-context`. Registry runtime-context generik memungkinkan core melakukan bootstrap handler berbasis capability dari state startup channel tanpa menambahkan glue wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` level lebih rendah hanya ketika seam berbasis capability belum cukup ekspresif.
- Channel persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap berada dalam scope akun bot yang tepat, dan `approvalKind` menjaga perilaku persetujuan exec vs plugin tetap tersedia bagi channel tanpa percabangan hardcoded di core.
- Core sekarang juga memiliki pemberitahuan reroute persetujuan. Plugin channel tidak boleh mengirim pesan tindak lanjut sendiri seperti "approval went to DMs / another channel" dari `createChannelNativeApprovalRuntime`; sebagai gantinya, tampilkan routing origin + approver-DM yang akurat melalui helper capability persetujuan bersama dan biarkan core mengagregasi delivery aktual sebelum memposting pemberitahuan apa pun kembali ke chat pemicu.
- Pertahankan jenis id persetujuan yang terkirim dari ujung ke ujung. Client native tidak boleh menebak atau menulis ulang routing persetujuan exec vs plugin dari state lokal channel.
- Berbagai jenis persetujuan dapat dengan sengaja mengekspos permukaan native yang berbeda.
  Contoh bawaan saat ini:
  - Slack mempertahankan routing persetujuan native yang tersedia untuk id exec dan plugin.
  - Matrix mempertahankan routing DM/channel native yang sama dan UX reaksi untuk persetujuan exec dan plugin, sambil tetap memungkinkan auth berbeda berdasarkan jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya mengutamakan builder capability dan mengekspos `approvalCapability` pada plugin.

Untuk entrypoint channel yang panas, utamakan subpath runtime yang lebih sempit saat Anda hanya memerlukan satu bagian dari keluarga itu:

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
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` saat Anda tidak memerlukan permukaan umbrella
yang lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  adaptor patch setup yang aman untuk import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder
  setup-proxy yang didelegasikan
- `openclaw/plugin-sdk/setup-adapter-runtime` adalah seam adaptor sempit yang sadar env
  untuk `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder setup optional-install
  ditambah beberapa primitif yang aman untuk setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika channel Anda mendukung setup atau auth berbasis env dan alur startup/config generik harus mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan nama itu di manifest plugin dengan `channelEnvVars`. Simpan `envVars` runtime channel atau konstanta lokal hanya untuk salinan yang ditujukan bagi operator.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya ketika Anda juga memerlukan
  helper setup/config bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika channel Anda hanya ingin mengiklankan "instal Plugin ini terlebih dahulu" pada
permukaan setup, utamakan `createOptionalChannelSetupSurface(...)`. Adaptor/wizard yang dihasilkan gagal tertutup pada penulisan config dan finalisasi, serta menggunakan kembali pesan install-required yang sama di seluruh validasi, finalize, dan salinan tautan dokumen.

Untuk path channel panas lainnya, utamakan helper yang sempit daripada permukaan lama yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk config multi-akun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk route/envelope inbound dan
  wiring record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk parsing/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media ditambah delegasi
  identitas/pengiriman outbound
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan pendaftaran adaptor
- `openclaw/plugin-sdk/agent-media-payload` hanya ketika tata letak field payload
  agent/media lama masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi custom-command Telegram, validasi duplikat/konflik, dan kontrak config command yang stabil untuk fallback

Channel auth-only biasanya dapat berhenti pada jalur default: core menangani persetujuan dan plugin hanya mengekspos kapabilitas outbound/auth. Channel persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom sebaiknya menggunakan helper native bersama alih-alih membangun siklus hidup persetujuan sendiri.

## Kebijakan mention inbound

Pertahankan penanganan mention inbound terbagi menjadi dua lapisan:

- pengumpulan bukti yang dimiliki plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-inbound` untuk lapisan bersama.

Cocok untuk logika lokal plugin:

- deteksi reply-to-bot
- deteksi quoted-bot
- pemeriksaan partisipasi thread
- pengecualian service/system-message
- cache native platform yang diperlukan untuk membuktikan partisipasi bot

Cocok untuk helper bersama:

- `requireMention`
- hasil mention eksplisit
- allowlist mention implisit
- command bypass
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

Helper `resolveMentionGating*` yang lebih lama tetap ada di
`openclaw/plugin-sdk/channel-inbound` hanya sebagai ekspor kompatibilitas. Kode
baru sebaiknya menggunakan `resolveInboundMentionDecision({ facts, policy })`.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifest">
    Buat file plugin standar. Field `channel` di `package.json` adalah
    yang menjadikan ini Plugin channel. Untuk permukaan metadata paket yang lengkap,
    lihat [Setup dan Config Plugin](/id/plugins/sdk-setup#openclaw-channel):

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
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Plugin channel Acme Chat",
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
    Interface `ChannelPlugin` memiliki banyak permukaan adaptor opsional. Mulailah dengan
    minimum — `id` dan `setup` — lalu tambahkan adaptor sesuai kebutuhan.

    Buat `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // client API platform Anda

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
          idLabel: "username Acme Chat",
          message: "Kirim kode ini untuk memverifikasi identitas Anda:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Kode pairing: ${code}`);
          },
        },
      },

      // Threading: cara balasan dikirim
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
      Alih-alih mengimplementasikan interface adaptor level rendah secara manual, Anda memberikan
      opsi deklaratif dan builder akan menyusunnya:

      | Opsi | Wiring yang dilakukan |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM yang discakup dari field config |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode reply-to (tetap, dicakup akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi kirim yang mengembalikan metadata hasil (ID pesan) |

      Anda juga dapat meneruskan objek adaptor mentah alih-alih opsi deklaratif
      jika membutuhkan kontrol penuh.
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
      description: "Plugin channel Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Manajemen Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Manajemen Acme Chat",
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
    sementara pemuatan penuh normal tetap mengambil descriptor yang sama untuk pendaftaran command
    yang sebenarnya. Pertahankan `registerFull(...)` untuk pekerjaan khusus runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC Gateway, gunakan prefiks
    khusus plugin. Namespace admin core (`config.*`,
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
    atau belum dikonfigurasi. Ini mencegah pemuatan kode runtime berat selama alur setup.
    Lihat [Setup dan Config](/id/plugins/sdk-setup#setup-entry) untuk detailnya.

    Channel workspace bawaan yang memisahkan ekspor aman-setup ke modul sidecar
    dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` ketika mereka juga memerlukan
    setter runtime saat setup yang eksplisit.

  </Step>

  <Step title="Tangani pesan inbound">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola yang umum adalah Webhook yang memverifikasi permintaan dan
    mengirimkannya melalui handler inbound channel Anda:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth yang dikelola plugin (verifikasi signature sendiri)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Handler inbound Anda mengirim pesan ke OpenClaw.
          // Wiring pastinya bergantung pada SDK platform Anda —
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
      Penanganan pesan inbound bersifat spesifik channel. Setiap Plugin channel memiliki
      pipeline inbound-nya sendiri. Lihat Plugin channel bawaan
      (misalnya paket Plugin Microsoft Teams atau Google Chat) untuk pola nyata.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Uji">
Tulis test yang diletakkan berdampingan di `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("me-resolve akun dari config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("memeriksa akun tanpa mematerialkan secret", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("melaporkan config yang hilang", () => {
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
├── openclaw.plugin.json      # Manifest dengan skema config
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Ekspor publik (opsional)
├── runtime-api.ts            # Ekspor runtime internal (opsional)
└── src/
    ├── channel.ts            # ChannelPlugin melalui createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # Client API platform
    └── runtime.ts            # Penyimpanan runtime (jika diperlukan)
```

## Topik lanjutan

<CardGroup cols={2}>
  <Card title="Opsi threading" icon="git-branch" href="/id/plugins/sdk-entrypoints#registration-mode">
    Mode balasan tetap, dicakup akun, atau kustom
  </Card>
  <Card title="Integrasi tool pesan" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
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
kompatibilitas. Itu bukan pola yang direkomendasikan untuk Plugin channel baru;
utamakan subpath channel/setup/reply/runtime generik dari permukaan SDK umum
kecuali Anda sedang memelihara keluarga bundled plugin tersebut secara langsung.
</Note>

## Langkah selanjutnya

- [Plugin Provider](/id/plugins/sdk-provider-plugins) — jika plugin Anda juga menyediakan model
- [Ikhtisar SDK](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [SDK Testing](/id/plugins/sdk-testing) — utilitas test dan test kontrak
- [Manifest Plugin](/id/plugins/manifest) — skema manifest lengkap
