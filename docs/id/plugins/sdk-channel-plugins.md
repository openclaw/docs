---
read_when:
    - Anda sedang membangun plugin channel perpesanan baru
    - Anda ingin menghubungkan OpenClaw ke platform perpesanan
    - Anda perlu memahami permukaan adapter ChannelPlugin
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun plugin channel perpesanan untuk OpenClaw
title: Membangun Plugin Channel
x-i18n:
    generated_at: "2026-04-05T14:02:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a6ad2c75549db8ce54f7e22ca9850d7ed68c5cd651c9bb41c9f73769f48aba
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Membangun Plugin Channel

Panduan ini membahas cara membangun plugin channel yang menghubungkan OpenClaw ke
platform perpesanan. Pada akhirnya Anda akan memiliki channel yang berfungsi dengan keamanan DM,
pairing, threading balasan, dan perpesanan keluar.

<Info>
  Jika Anda belum pernah membangun plugin OpenClaw sebelumnya, baca
  [Getting Started](/plugins/building-plugins) terlebih dahulu untuk struktur
  paket dasar dan penyiapan manifest.
</Info>

## Cara kerja plugin channel

Plugin channel tidak memerlukan tool send/edit/react mereka sendiri. OpenClaw mempertahankan satu
tool `message` bersama di core. Plugin Anda memiliki:

- **Konfigurasi** — resolusi akun dan wizard penyiapan
- **Keamanan** — kebijakan DM dan allowlist
- **Pairing** — alur persetujuan DM
- **Tata bahasa sesi** — bagaimana ID percakapan khusus provider dipetakan ke chat dasar, ID thread, dan fallback parent
- **Outbound** — mengirim teks, media, dan polling ke platform
- **Threading** — bagaimana balasan di-thread

Core memiliki tool message bersama, pengkabelan prompt, bentuk luar session-key,
pembukuan generik `:thread:`, dan dispatch.

Jika platform Anda menyimpan scope tambahan di dalam ID percakapan, pertahankan penguraian itu
di plugin dengan `messaging.resolveSessionConversation(...)`. Itu adalah hook kanonis
untuk memetakan `rawId` ke ID percakapan dasar, ID thread opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates`
apa pun. Saat Anda mengembalikan `parentConversationCandidates`, jaga urutannya dari
parent paling sempit ke percakapan paling luas/dasar.

Plugin bawaan yang memerlukan penguraian yang sama sebelum registry channel melakukan boot
juga dapat mengekspos file `session-key-api.ts` level atas dengan
ekspor `resolveSessionConversation(...)` yang cocok. Core menggunakan permukaan aman-bootstrap itu
hanya ketika registry plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai
fallback kompatibilitas lama saat plugin hanya membutuhkan fallback parent
di atas ID generik/mentah. Jika kedua hook ada, core menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
fallback ke `resolveParentConversationCandidates(...)` saat hook kanonis
menghilangkannya.

## Persetujuan dan kapabilitas channel

Sebagian besar plugin channel tidak memerlukan kode khusus persetujuan.

- Core memiliki `/approve` di chat yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Utamakan satu objek `approvalCapability` pada plugin channel saat channel memerlukan perilaku khusus persetujuan.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan yang kanonis.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload khusus channel seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator mengetik sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk routing persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.render` hanya saat channel benar-benar memerlukan payload persetujuan kustom alih-alih renderer bersama.
- Jika sebuah channel dapat menyimpulkan identitas DM mirip pemilik yang stabil dari konfigurasi yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` di chat yang sama tanpa menambahkan logika core khusus persetujuan.
- Jika sebuah channel memerlukan pengiriman persetujuan native, jaga kode channel tetap fokus pada normalisasi target dan hook transport. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability`, dan `createChannelNativeApprovalRuntime` dari `openclaw/plugin-sdk/approval-runtime` agar core memiliki pemfilteran permintaan, routing, dedupe, kedaluwarsa, dan subscription gateway.
- Channel persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap dibatasi ke akun bot yang tepat, dan `approvalKind` menjaga perilaku persetujuan exec vs plugin tetap tersedia bagi channel tanpa branch hardcoded di core.
- Pertahankan jenis ID persetujuan yang telah dikirim secara ujung-ke-ujung. Klien native tidak boleh
  menebak atau menulis ulang routing persetujuan exec vs plugin dari state lokal channel.
- Jenis persetujuan yang berbeda memang dapat mengekspos permukaan native yang berbeda secara sengaja.
  Contoh bawaan saat ini:
  - Slack menjaga routing persetujuan native tetap tersedia untuk ID exec dan plugin.
  - Matrix menjaga routing DM/channel native hanya untuk persetujuan exec dan membiarkan
    persetujuan plugin tetap pada jalur `/approve` bersama di chat yang sama.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya mengutamakan builder kapabilitas dan mengekspos `approvalCapability` pada plugin.

Untuk entrypoint channel yang sering dipanggil, utamakan subpath runtime yang lebih sempit saat Anda hanya
membutuhkan satu bagian dari keluarga itu:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Demikian pula, utamakan `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` saat Anda tidak memerlukan
permukaan payung yang lebih luas.

Khusus untuk penyiapan:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper penyiapan yang aman untuk runtime:
  adapter patch penyiapan yang aman untuk import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder
  setup-proxy terdelegasi
- `openclaw/plugin-sdk/setup-adapter-runtime` adalah
  seam adapter sempit yang sadar env untuk `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder penyiapan instalasi opsional
  plus beberapa primitif aman-penyiapan:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
  `splitSetupEntries`
- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya saat Anda juga membutuhkan
  helper penyiapan/konfigurasi bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika channel Anda hanya ingin mengiklankan "instal plugin ini dulu" pada permukaan penyiapan,
utamakan `createOptionalChannelSetupSurface(...)`. Adapter/wizard yang dihasilkan
gagal-tertutup pada penulisan konfigurasi dan finalisasi, dan menggunakan ulang pesan
instalasi-diperlukan yang sama di seluruh validasi, finalisasi, dan salinan
tautan dokumentasi.

Untuk jalur channel panas lainnya, utamakan helper sempit daripada permukaan lama yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk konfigurasi multi-akun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk pengkabelan route/envelope masuk
  serta perekaman-dan-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk penguraian/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media plus delegasi
  identitas/pengiriman keluar
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan pendaftaran adapter
- `openclaw/plugin-sdk/agent-media-payload` hanya saat tata letak field payload
  agent/media lama masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi perintah kustom Telegram,
  validasi duplikat/konflik, dan kontrak konfigurasi perintah
  fallback-stabil

Channel khusus auth biasanya dapat berhenti di jalur default: core menangani persetujuan dan plugin cukup mengekspos kapabilitas outbound/auth. Channel persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom sebaiknya menggunakan helper native bersama alih-alih membuat siklus hidup persetujuan mereka sendiri.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifest">
    Buat file plugin standar. Field `channel` di `package.json` adalah
    yang menjadikan ini plugin channel. Untuk permukaan metadata paket lengkap,
    lihat [Plugin Setup and Config](/plugins/sdk-setup#openclawchannel):

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
    Interface `ChannelPlugin` memiliki banyak permukaan adapter opsional. Mulailah dengan
    yang minimum — `id` dan `setup` — lalu tambahkan adapter sesuai kebutuhan Anda.

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

    <Accordion title="Yang dilakukan createChatChannelPlugin untuk Anda">
      Alih-alih mengimplementasikan interface adapter level rendah secara manual, Anda
      meneruskan opsi deklaratif dan builder menyusunnya:

      | Opsi | Yang dihubungkan |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM yang dibatasi dari field konfigurasi |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode reply-to (tetap, dibatasi akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi pengiriman yang mengembalikan metadata hasil (ID pesan) |

      Anda juga dapat meneruskan objek adapter mentah alih-alih opsi deklaratif
      jika Anda memerlukan kontrol penuh.
    </Accordion>

  </Step>

  <Step title="Hubungkan entrypoint">
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
    perintah yang sesungguhnya. Pertahankan `registerFull(...)` untuk pekerjaan khusus runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC gateway, gunakan
    prefiks khusus plugin. Namespace admin core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) tetap dicadangkan dan selalu
    di-resolve ke `operator.admin`.
    `defineChannelPluginEntry` menangani pemisahan mode registrasi secara otomatis. Lihat
    [Entry Points](/plugins/sdk-entrypoints#definechannelpluginentry) untuk semua
    opsinya.

  </Step>

  <Step title="Tambahkan entry penyiapan">
    Buat `setup-entry.ts` untuk pemuatan ringan selama onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw memuat ini alih-alih entry penuh saat channel dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari penarikan kode runtime berat selama alur penyiapan.
    Lihat [Setup and Config](/plugins/sdk-setup#setup-entry) untuk detail.

  </Step>

  <Step title="Tangani pesan masuk">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola yang umum adalah webhook yang memverifikasi permintaan dan
    mengirimkannya melalui handler masuk channel Anda:

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
      Penanganan pesan masuk bersifat khusus channel. Setiap plugin channel memiliki
      pipeline masuknya sendiri. Lihat plugin channel bawaan
      (misalnya paket plugin Microsoft Teams atau Google Chat) untuk pola nyata.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Uji">
Tulis pengujian yang diletakkan bersama di `src/channel.test.ts`:

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

    Untuk helper pengujian bersama, lihat [Testing](/plugins/sdk-testing).

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
  <Card title="Opsi threading" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    Mode reply tetap, dibatasi akun, atau kustom
  </Card>
  <Card title="Integrasi tool message" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool dan penemuan aksi
  </Card>
  <Card title="Resolusi target" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/plugins/sdk-runtime">
    TTS, STT, media, subagent via api.runtime
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bawaan masih ada untuk pemeliharaan plugin bawaan dan
kompatibilitas. Seam tersebut bukan pola yang direkomendasikan untuk plugin channel baru;
utamakan subpath channel/setup/reply/runtime generik dari permukaan SDK umum
kecuali Anda memang memelihara keluarga plugin bawaan itu secara langsung.
</Note>

## Langkah selanjutnya

- [Plugin Provider](/plugins/sdk-provider-plugins) — jika plugin Anda juga menyediakan model
- [Ikhtisar SDK](/plugins/sdk-overview) — referensi impor subpath lengkap
- [SDK Testing](/plugins/sdk-testing) — utilitas pengujian dan pengujian kontrak
- [Manifest Plugin](/plugins/manifest) — skema manifest lengkap
