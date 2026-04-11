---
read_when:
    - Anda sedang membangun plugin channel perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami permukaan adaptor ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun plugin channel perpesanan untuk OpenClaw
title: Membangun Plugin Channel
x-i18n:
    generated_at: "2026-04-11T02:46:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a026e924f9ae8a3ddd46287674443bcfccb0247be504261522b078e1f440aef
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Membangun Plugin Channel

Panduan ini memandu Anda membangun plugin channel yang menghubungkan OpenClaw ke
platform perpesanan. Pada akhirnya Anda akan memiliki channel yang berfungsi dengan keamanan DM,
pairing, reply threading, dan pengiriman pesan keluar.

<Info>
  Jika Anda belum pernah membangun plugin OpenClaw sebelumnya, baca
  [Getting Started](/id/plugins/building-plugins) terlebih dahulu untuk struktur paket
  dasar dan penyiapan manifes.
</Info>

## Cara kerja plugin channel

Plugin channel tidak memerlukan tool send/edit/react sendiri. OpenClaw mempertahankan satu
tool `message` bersama di inti. Plugin Anda memiliki:

- **Config** — resolusi akun dan wizard penyiapan
- **Security** — kebijakan DM dan allowlist
- **Pairing** — alur persetujuan DM
- **Grammar sesi** — bagaimana id percakapan khusus provider dipetakan ke chat dasar, id thread, dan fallback parent
- **Outbound** — mengirim teks, media, dan polling ke platform
- **Threading** — bagaimana balasan di-thread

Inti memiliki tool message bersama, wiring prompt, bentuk session-key luar,
pencatatan `:thread:` generik, dan dispatch.

Jika platform Anda menyimpan cakupan tambahan di dalam id percakapan, simpan parsing itu
di plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah hook kanonis
untuk memetakan `rawId` ke id percakapan dasar, id thread opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates`
apa pun. Saat Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya
dari parent yang paling sempit ke percakapan dasar/paling luas.

Plugin bawaan yang memerlukan parsing yang sama sebelum registri channel boot
juga dapat mengekspos file `session-key-api.ts` tingkat atas dengan ekspor
`resolveSessionConversation(...)` yang sesuai. Inti menggunakan permukaan
aman-bootstrap itu hanya ketika registri plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai fallback
kompatibilitas lama ketika plugin hanya memerlukan fallback parent di atas
id generik/mentah. Jika kedua hook ada, inti menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
fallback ke `resolveParentConversationCandidates(...)` ketika hook kanonis
mengabaikannya.

## Persetujuan dan capability channel

Sebagian besar plugin channel tidak memerlukan kode khusus persetujuan.

- Inti memiliki `/approve` dalam chat yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Pilih satu objek `approvalCapability` pada plugin channel ketika channel memerlukan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` dihapus. Letakkan fakta pengiriman/native/render/auth persetujuan di `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; inti tidak lagi membaca hook auth persetujuan dari objek itu.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan dalam chat yang sama.
- Jika channel Anda mengekspos persetujuan exec native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk status native-client/permukaan pemicu saat berbeda dari auth persetujuan dalam chat yang sama. Inti menggunakan hook khusus exec itu untuk membedakan `enabled` vs `disabled`, memutuskan apakah channel pemicu mendukung persetujuan exec native, dan menyertakan channel tersebut dalam panduan fallback native-client. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload khusus channel seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator mengetik sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk perutean persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native milik channel. Pertahankan lazy pada entrypoint channel yang panas dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai permintaan sambil tetap memungkinkan inti merakit siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya ketika channel benar-benar memerlukan payload persetujuan kustom alih-alih renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` ketika channel ingin balasan jalur-nonaktif menjelaskan knob konfigurasi tepat yang diperlukan untuk mengaktifkan persetujuan exec native. Hook menerima `{ channel, channelLabel, accountId }`; channel bernama-akun harus merender path bercakupan akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default tingkat atas.
- Jika channel dapat menyimpulkan identitas DM mirip-pemilik yang stabil dari konfigurasi yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` dalam chat yang sama tanpa menambahkan logika khusus persetujuan di inti.
- Jika channel memerlukan pengiriman persetujuan native, pertahankan kode channel tetap fokus pada normalisasi target ditambah fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Letakkan fakta khusus channel di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, sehingga inti dapat merakit handler dan memiliki pemfilteran permintaan, perutean, dedupe, kedaluwarsa, langganan gateway, dan pemberitahuan dialihkan-ke-tempat-lain. `nativeRuntime` dibagi menjadi beberapa seam yang lebih kecil:
- `availability` — apakah akun telah dikonfigurasi dan apakah permintaan harus ditangani
- `presentation` — memetakan view model persetujuan bersama ke payload native tertunda/terselesaikan/kedaluwarsa atau tindakan akhir
- `transport` — menyiapkan target ditambah mengirim/memperbarui/menghapus pesan persetujuan native
- `interactions` — hook bind/unbind/clear-action opsional untuk tombol atau reaksi native
- `observe` — hook diagnostik pengiriman opsional
- Jika channel memerlukan objek milik runtime seperti klien, token, aplikasi Bolt, atau penerima webhook, daftarkan objek tersebut melalui `openclaw/plugin-sdk/channel-runtime-context`. Registri runtime-context generik memungkinkan inti melakukan bootstrap handler berbasis capability dari status startup channel tanpa menambahkan glue wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` tingkat lebih rendah hanya ketika seam berbasis capability belum cukup ekspresif.
- Channel persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap bercakupan ke akun bot yang tepat, dan `approvalKind` menjaga perilaku persetujuan exec vs plugin tetap tersedia bagi channel tanpa percabangan hardcode di inti.
- Inti sekarang juga memiliki pemberitahuan pengalihan persetujuan. Plugin channel tidak boleh mengirim pesan tindak lanjut sendiri seperti "persetujuan dikirim ke DM / channel lain" dari `createChannelNativeApprovalRuntime`; sebaliknya, tampilkan perutean DM approver + origin yang akurat melalui helper capability persetujuan bersama dan biarkan inti mengagregasi pengiriman aktual sebelum memposting pemberitahuan apa pun kembali ke chat pemicu.
- Pertahankan jenis id persetujuan yang terkirim dari awal sampai akhir. Klien native tidak boleh
  menebak atau menulis ulang perutean persetujuan exec vs plugin dari status lokal channel.
- Jenis persetujuan yang berbeda dapat dengan sengaja mengekspos permukaan native yang berbeda.
  Contoh bawaan saat ini:
  - Slack mempertahankan perutean persetujuan native tersedia untuk id exec dan plugin.
  - Matrix mempertahankan perutean DM/channel native dan UX reaksi yang sama untuk persetujuan exec
    dan plugin, sambil tetap membiarkan auth berbeda menurut jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya memilih pembangun capability dan mengekspos `approvalCapability` pada plugin.

Untuk entrypoint channel yang panas, pilih subpath runtime yang lebih sempit ketika Anda hanya
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
`openclaw/plugin-sdk/reply-chunking` ketika Anda tidak memerlukan permukaan payung
yang lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  adaptor patch setup yang aman diimpor (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder
  setup-proxy yang didelegasikan
- `openclaw/plugin-sdk/setup-adapter-runtime` adalah seam adaptor sadar-env
  yang sempit untuk `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder setup optional-install
  ditambah beberapa primitif aman-setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika channel Anda mendukung setup atau auth berbasis env dan alur startup/konfigurasi generik
harus mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan nama itu di manifes
plugin dengan `channelEnvVars`. Pertahankan `envVars` runtime channel atau konstanta lokal
hanya untuk salinan yang menghadap operator.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya ketika Anda juga memerlukan
  helper setup/config bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika channel Anda hanya ingin mengiklankan "instal plugin ini terlebih dahulu" di permukaan setup,
pilih `createOptionalChannelSetupSurface(...)`. Adaptor/wizard yang dihasilkan gagal tertutup
pada penulisan konfigurasi dan finalisasi, dan mereka menggunakan kembali pesan install-required yang sama di seluruh validasi, finalize, dan salinan tautan dokumen.

Untuk path channel panas lainnya, pilih helper sempit dibanding permukaan lama yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk konfigurasi multi-akun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk route/envelope inbound dan
  wiring record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk parsing/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media ditambah delegasi identitas/pengiriman outbound
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan pendaftaran adaptor
- `openclaw/plugin-sdk/agent-media-payload` hanya ketika tata letak field payload
  agen/media lama masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi custom-command Telegram,
  validasi duplikasi/konflik, dan kontrak konfigurasi command yang stabil terhadap fallback

Channel khusus-auth biasanya dapat berhenti di jalur default: inti menangani persetujuan dan plugin hanya mengekspos capability outbound/auth. Channel persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom harus menggunakan helper native bersama alih-alih menggulir sendiri siklus hidup persetujuan.

## Kebijakan mention inbound

Pertahankan penanganan mention inbound terbagi dalam dua lapisan:

- pengumpulan bukti yang dimiliki plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-inbound` untuk lapisan bersama.

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
- keputusan skip akhir

Alur yang disarankan:

1. Hitung fakta mention lokal.
2. Teruskan fakta tersebut ke `resolveInboundMentionDecision({ facts, policy })`.
3. Gunakan `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, dan `decision.shouldSkip` dalam gate inbound Anda.

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
plugin channel bawaan yang sudah bergantung pada injeksi runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Helper `resolveMentionGating*` yang lebih lama tetap ada di
`openclaw/plugin-sdk/channel-inbound` hanya sebagai ekspor kompatibilitas. Kode baru
harus menggunakan `resolveInboundMentionDecision({ facts, policy })`.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifes">
    Buat file plugin standar. Field `channel` di `package.json` adalah
    yang menjadikan ini plugin channel. Untuk permukaan metadata paket lengkap,
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

  <Step title="Bangun objek plugin channel">
    Interface `ChannelPlugin` memiliki banyak permukaan adaptor opsional. Mulailah dengan
    yang minimum — `id` dan `setup` — lalu tambahkan adaptor sesuai kebutuhan.

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
          idLabel: "Username Acme Chat",
          message: "Kirim kode ini untuk memverifikasi identitas Anda:",
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
      Alih-alih mengimplementasikan interface adaptor tingkat rendah secara manual, Anda meneruskan
      opsi deklaratif dan builder akan menyusunnya:

      | Opsi | Yang dihubungkan |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM bercakupan dari field konfigurasi |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode-reply-to (tetap, bercakupan akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi pengiriman yang mengembalikan metadata hasil (ID pesan) |

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

    Letakkan descriptor CLI milik channel di `registerCliMetadata(...)` agar OpenClaw
    dapat menampilkannya di bantuan root tanpa mengaktifkan runtime channel penuh,
    sementara pemuatan penuh normal tetap mengambil descriptor yang sama untuk pendaftaran
    perintah yang sebenarnya. Pertahankan `registerFull(...)` untuk pekerjaan khusus runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC gateway, gunakan prefiks
    khusus plugin. Namespace admin inti (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    diresolusikan ke `operator.admin`.
    `defineChannelPluginEntry` menangani pemisahan mode pendaftaran secara otomatis. Lihat
    [Entry Points](/id/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsi.

  </Step>

  <Step title="Tambahkan setup entry">
    Buat `setup-entry.ts` untuk pemuatan ringan selama onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat ini alih-alih entry penuh ketika channel dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari penarikan kode runtime yang berat selama alur setup.
    Lihat [Setup and Config](/id/plugins/sdk-setup#setup-entry) untuk detail.

  </Step>

  <Step title="Tangani pesan inbound">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola yang umum adalah webhook yang memverifikasi permintaan dan
    mendispatch-nya melalui handler inbound channel Anda:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth yang dikelola plugin (verifikasi signature sendiri)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Handler inbound Anda mendispatch pesan ke OpenClaw.
          // Wiring yang tepat bergantung pada SDK platform Anda —
          // lihat contoh nyata di paket plugin Microsoft Teams atau Google Chat bawaan.
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
      pipeline inbound-nya sendiri. Lihat plugin channel bawaan
      (misalnya paket plugin Microsoft Teams atau Google Chat) untuk pola nyata.
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
├── openclaw.plugin.json      # Manifes dengan skema konfigurasi
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Ekspor publik (opsional)
├── runtime-api.ts            # Ekspor runtime internal (opsional)
└── src/
    ├── channel.ts            # ChannelPlugin melalui createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # Klien API platform
    └── runtime.ts            # Penyimpanan runtime (jika diperlukan)
```

## Topik lanjutan

<CardGroup cols={2}>
  <Card title="Opsi threading" icon="git-branch" href="/id/plugins/sdk-entrypoints#registration-mode">
    Mode balas tetap, bercakupan akun, atau kustom
  </Card>
  <Card title="Integrasi tool message" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
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
Beberapa seam helper bawaan masih ada untuk pemeliharaan plugin bawaan dan
kompatibilitas. Itu bukan pola yang direkomendasikan untuk plugin channel baru;
pilih subpath channel/setup/reply/runtime generik dari permukaan SDK umum
kecuali Anda sedang memelihara keluarga plugin bawaan tersebut secara langsung.
</Note>

## Langkah selanjutnya

- [Provider Plugins](/id/plugins/sdk-provider-plugins) — jika plugin Anda juga menyediakan model
- [SDK Overview](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [SDK Testing](/id/plugins/sdk-testing) — utilitas test dan contract test
- [Plugin Manifest](/id/plugins/manifest) — skema manifes lengkap
