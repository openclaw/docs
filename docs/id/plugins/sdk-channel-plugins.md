---
read_when:
    - Anda sedang membangun Plugin channel pesan baru
    - Anda ingin menghubungkan OpenClaw ke platform pesan
    - Anda perlu memahami surface adapter `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Panduan langkah demi langkah untuk membangun Plugin channel pesan untuk OpenClaw
title: Membangun Plugin channel pesan
x-i18n:
    generated_at: "2026-04-25T13:51:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Panduan ini memandu Anda membangun Plugin channel yang menghubungkan OpenClaw ke
platform pesan. Pada akhirnya Anda akan memiliki channel yang berfungsi dengan keamanan DM,
pairing, reply threading, dan pesan keluar.

<Info>
  Jika Anda belum pernah membangun Plugin OpenClaw sebelumnya, baca
  [Getting Started](/id/plugins/building-plugins) terlebih dahulu untuk struktur
  paket dasar dan penyiapan manifest.
</Info>

## Cara kerja Plugin channel

Plugin channel tidak memerlukan tool send/edit/react sendiri. OpenClaw menyimpan satu
tool `message` bersama di core. Plugin Anda memiliki:

- **Config** — resolusi akun dan wizard penyiapan
- **Security** — kebijakan DM dan allowlist
- **Pairing** — alur persetujuan DM
- **Session grammar** — bagaimana id percakapan khusus provider dipetakan ke chat dasar, id thread, dan fallback induk
- **Outbound** — mengirim teks, media, dan polling ke platform
- **Threading** — bagaimana balasan di-thread
- **Heartbeat typing** — sinyal mengetik/sibuk opsional untuk target pengiriman Heartbeat

Core memiliki tool pesan bersama, wiring prompt, bentuk luar kunci sesi,
pembukuan generik `:thread:`, dan dispatch.

Jika channel Anda mendukung indikator mengetik di luar balasan masuk, ekspos
`heartbeat.sendTyping(...)` pada Plugin channel. Core memanggilnya dengan target
pengiriman Heartbeat yang telah di-resolve sebelum eksekusi model Heartbeat dimulai dan
menggunakan siklus hidup keepalive/pembersihan pengetikan bersama. Tambahkan `heartbeat.clearTyping(...)`
saat platform memerlukan sinyal berhenti eksplisit.

Jika channel Anda menambahkan parameter tool pesan yang membawa sumber media, ekspos
nama parameter tersebut melalui `describeMessageTool(...).mediaSourceParams`. Core menggunakan
daftar eksplisit itu untuk normalisasi path sandbox dan kebijakan akses media keluar,
sehingga Plugin tidak memerlukan kasus khusus shared-core untuk parameter avatar, attachment,
atau cover-image khusus provider.
Sebaiknya kembalikan map yang dikunci oleh action seperti
`{ "set-profile": ["avatarUrl", "avatarPath"] }` agar action yang tidak terkait tidak
mewarisi argumen media milik action lain. Array datar tetap berfungsi untuk parameter
yang memang sengaja dibagikan di setiap action yang diekspos.

Jika platform Anda menyimpan scope tambahan di dalam id percakapan, pertahankan parsing itu
di Plugin dengan `messaging.resolveSessionConversation(...)`. Ini adalah hook kanonis
untuk memetakan `rawId` ke id percakapan dasar, `threadId` opsional,
`baseConversationId` eksplisit, dan `parentConversationCandidates`, jika ada.
Saat Anda mengembalikan `parentConversationCandidates`, pertahankan urutannya dari induk
yang paling sempit ke percakapan dasar/terluas.

Plugin bawaan yang memerlukan parsing yang sama sebelum registri channel melakukan boot
juga dapat mengekspos file top-level `session-key-api.ts` dengan ekspor
`resolveSessionConversation(...)` yang cocok. Core menggunakan surface yang aman untuk bootstrap itu
hanya saat registri Plugin runtime belum tersedia.

`messaging.resolveParentConversationCandidates(...)` tetap tersedia sebagai fallback kompatibilitas lama saat sebuah Plugin hanya memerlukan fallback induk di atas id generik/mentah. Jika kedua hook ada, core menggunakan
`resolveSessionConversation(...).parentConversationCandidates` terlebih dahulu dan hanya
menggunakan fallback ke `resolveParentConversationCandidates(...)` saat hook kanonis
menghilangkannya.

## Persetujuan dan kemampuan channel

Sebagian besar Plugin channel tidak memerlukan kode khusus persetujuan.

- Core memiliki `/approve` untuk chat yang sama, payload tombol persetujuan bersama, dan pengiriman fallback generik.
- Sebaiknya gunakan satu objek `approvalCapability` pada Plugin channel saat channel memerlukan perilaku khusus persetujuan.
- `ChannelPlugin.approvals` dihapus. Letakkan fakta pengiriman/render/auth persetujuan native pada `approvalCapability`.
- `plugin.auth` hanya untuk login/logout; core tidak lagi membaca hook auth persetujuan dari objek itu.
- `approvalCapability.authorizeActorAction` dan `approvalCapability.getActionAvailabilityState` adalah seam auth persetujuan yang kanonis.
- Gunakan `approvalCapability.getActionAvailabilityState` untuk ketersediaan auth persetujuan di chat yang sama.
- Jika channel Anda mengekspos persetujuan exec native, gunakan `approvalCapability.getExecInitiatingSurfaceState` untuk state permukaan pemula/native-client saat berbeda dari auth persetujuan chat yang sama. Core menggunakan hook khusus exec itu untuk membedakan `enabled` vs `disabled`, memutuskan apakah channel pemula mendukung persetujuan exec native, dan menyertakan channel tersebut dalam panduan fallback native-client. `createApproverRestrictedNativeApprovalCapability(...)` mengisi ini untuk kasus umum.
- Gunakan `outbound.shouldSuppressLocalPayloadPrompt` atau `outbound.beforeDeliverPayload` untuk perilaku siklus hidup payload khusus channel seperti menyembunyikan prompt persetujuan lokal duplikat atau mengirim indikator mengetik sebelum pengiriman.
- Gunakan `approvalCapability.delivery` hanya untuk routing persetujuan native atau penekanan fallback.
- Gunakan `approvalCapability.nativeRuntime` untuk fakta persetujuan native milik channel. Pertahankan agar lazy pada entrypoint channel panas dengan `createLazyChannelApprovalNativeRuntimeAdapter(...)`, yang dapat mengimpor modul runtime Anda sesuai kebutuhan sambil tetap membiarkan core merakit siklus hidup persetujuan.
- Gunakan `approvalCapability.render` hanya saat channel benar-benar memerlukan payload persetujuan kustom alih-alih renderer bersama.
- Gunakan `approvalCapability.describeExecApprovalSetup` saat channel ingin balasan jalur-disabled menjelaskan knob config persis yang dibutuhkan untuk mengaktifkan persetujuan exec native. Hook menerima `{ channel, channelLabel, accountId }`; channel akun bernama harus merender path dengan cakupan akun seperti `channels.<channel>.accounts.<id>.execApprovals.*` alih-alih default top-level.
- Jika channel dapat menyimpulkan identitas DM mirip pemilik yang stabil dari config yang ada, gunakan `createResolvedApproverActionAuthAdapter` dari `openclaw/plugin-sdk/approval-runtime` untuk membatasi `/approve` pada chat yang sama tanpa menambahkan logika inti khusus persetujuan.
- Jika channel memerlukan pengiriman persetujuan native, pertahankan kode channel tetap fokus pada normalisasi target plus fakta transport/presentasi. Gunakan `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, dan `createApproverRestrictedNativeApprovalCapability` dari `openclaw/plugin-sdk/approval-runtime`. Letakkan fakta khusus channel di balik `approvalCapability.nativeRuntime`, idealnya melalui `createChannelApprovalNativeRuntimeAdapter(...)` atau `createLazyChannelApprovalNativeRuntimeAdapter(...)`, sehingga core dapat merakit handler dan memiliki filter permintaan, routing, dedupe, expiry, subscription gateway, dan pemberitahuan routed-elsewhere. `nativeRuntime` dibagi menjadi beberapa seam kecil:
- `availability` — apakah akun dikonfigurasi dan apakah suatu permintaan harus ditangani
- `presentation` — memetakan model tampilan persetujuan bersama ke payload native pending/resolved/expired atau action akhir
- `transport` — menyiapkan target plus mengirim/memperbarui/menghapus pesan persetujuan native
- `interactions` — hook bind/unbind/clear-action opsional untuk tombol atau reaksi native
- `observe` — hook diagnostik pengiriman opsional
- Jika channel memerlukan objek milik runtime seperti klien, token, aplikasi Bolt, atau penerima Webhook, daftarkan melalui `openclaw/plugin-sdk/channel-runtime-context`. Registri runtime-context generik memungkinkan core melakukan bootstrap handler yang digerakkan capability dari state startup channel tanpa menambahkan glue wrapper khusus persetujuan.
- Gunakan `createChannelApprovalHandler` atau `createChannelNativeApprovalRuntime` tingkat lebih rendah hanya saat seam yang digerakkan capability belum cukup ekspresif.
- Channel persetujuan native harus merutekan `accountId` dan `approvalKind` melalui helper tersebut. `accountId` menjaga kebijakan persetujuan multi-akun tetap dibatasi ke akun bot yang tepat, dan `approvalKind` menjaga perilaku persetujuan exec vs Plugin tetap tersedia bagi channel tanpa cabang hardcoded di core.
- Core sekarang juga memiliki pemberitahuan reroute persetujuan. Plugin channel tidak boleh mengirim pesan lanjutan sendiri seperti "approval went to DMs / another channel" dari `createChannelNativeApprovalRuntime`; sebagai gantinya, ekspos routing origin + approver-DM yang akurat melalui helper capability persetujuan bersama dan biarkan core mengagregasi pengiriman aktual sebelum memposting pemberitahuan kembali ke chat pemula.
- Pertahankan jenis id persetujuan yang telah dikirim dari ujung ke ujung. Klien native tidak boleh
  menebak atau menulis ulang routing persetujuan exec vs Plugin dari state lokal channel.
- Jenis persetujuan yang berbeda dapat secara sengaja mengekspos surface native yang berbeda.
  Contoh bawaan saat ini:
  - Slack mempertahankan routing persetujuan native tersedia untuk id exec dan Plugin.
  - Matrix mempertahankan routing DM/channel native yang sama dan UX reaksi untuk persetujuan exec
    dan Plugin, sambil tetap membiarkan auth berbeda menurut jenis persetujuan.
- `createApproverRestrictedNativeApprovalAdapter` masih ada sebagai wrapper kompatibilitas, tetapi kode baru sebaiknya menggunakan builder capability dan mengekspos `approvalCapability` pada Plugin.

Untuk entrypoint channel panas, sebaiknya gunakan subpath runtime yang lebih sempit saat Anda hanya
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

Demikian juga, sebaiknya gunakan `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`, dan
`openclaw/plugin-sdk/reply-chunking` saat Anda tidak memerlukan surface umbrella
yang lebih luas.

Khusus untuk setup:

- `openclaw/plugin-sdk/setup-runtime` mencakup helper setup yang aman untuk runtime:
  adapter patch setup yang aman untuk impor (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output catatan lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries`, dan builder
  setup-proxy terdelegasi
- `openclaw/plugin-sdk/setup-adapter-runtime` adalah seam adapter sempit yang sadar env
  untuk `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` mencakup builder setup opsional-install
  ditambah beberapa primitive yang aman untuk setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Jika channel Anda mendukung setup atau auth berbasis env dan alur startup/config generik
harus mengetahui nama env tersebut sebelum runtime dimuat, deklarasikan di manifest
Plugin dengan `channelEnvVars`. Pertahankan `envVars` runtime channel atau
konstanta lokal hanya untuk salinan yang ditujukan kepada operator.

Jika channel Anda dapat muncul di `status`, `channels list`, `channels status`, atau pemindaian SecretRef sebelum runtime Plugin dimulai, tambahkan `openclaw.setupEntry` di
`package.json`. Entrypoint itu harus aman untuk diimpor dalam jalur perintah read-only dan harus mengembalikan metadata channel, adapter config yang aman untuk setup, adapter status, dan metadata target secret channel yang diperlukan untuk ringkasan tersebut. Jangan memulai klien, listener, atau runtime transport dari entri setup.

Pertahankan jalur impor entri channel utama juga sempit. Discovery dapat mengevaluasi entri dan modul Plugin channel untuk mendaftarkan capability tanpa mengaktifkan channel. File seperti `channel-plugin-api.ts` harus mengekspor objek Plugin channel tanpa mengimpor wizard setup, klien transport, listener socket, launcher subprocess, atau modul startup layanan. Letakkan bagian runtime itu dalam modul yang dimuat dari `registerFull(...)`, setter runtime, atau adapter capability lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, dan
`splitSetupEntries`

- gunakan seam `openclaw/plugin-sdk/setup` yang lebih luas hanya saat Anda juga memerlukan
  helper setup/config bersama yang lebih berat seperti
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Jika channel Anda hanya ingin mengiklankan "instal plugin ini dulu" di
surface setup, sebaiknya gunakan `createOptionalChannelSetupSurface(...)`. Wizard/adapter yang dihasilkan gagal secara fail-closed pada penulisan config dan finalisasi, dan menggunakan kembali pesan wajib-instal yang sama pada validasi, finalisasi, dan salinan tautan dokumen.

Untuk jalur channel panas lainnya, sebaiknya gunakan helper sempit daripada surface lama yang lebih luas:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, dan
  `openclaw/plugin-sdk/account-helpers` untuk konfigurasi multi-akun dan
  fallback akun default
- `openclaw/plugin-sdk/inbound-envelope` dan
  `openclaw/plugin-sdk/inbound-reply-dispatch` untuk wiring rute/envelope masuk dan
  record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` untuk parsing/pencocokan target
- `openclaw/plugin-sdk/outbound-media` dan
  `openclaw/plugin-sdk/outbound-runtime` untuk pemuatan media plus delegasi identitas/pengiriman outbound dan perencanaan payload
- `buildThreadAwareOutboundSessionRoute(...)` dari
  `openclaw/plugin-sdk/channel-core` saat rute outbound harus mempertahankan
  `replyToId`/`threadId` eksplisit atau memulihkan sesi `:thread:` saat ini
  setelah kunci sesi dasar masih cocok. Plugin provider dapat menimpa
  prioritas, perilaku sufiks, dan normalisasi id thread saat platform mereka
  memiliki semantik pengiriman thread native.
- `openclaw/plugin-sdk/thread-bindings-runtime` untuk siklus hidup thread-binding
  dan pendaftaran adapter
- `openclaw/plugin-sdk/agent-media-payload` hanya saat layout field payload agen/media lama masih diperlukan
- `openclaw/plugin-sdk/telegram-command-config` untuk normalisasi custom-command Telegram, validasi duplikat/konflik, dan kontrak config perintah yang stabil untuk fallback

Channel khusus-auth biasanya dapat berhenti pada jalur default: core menangani persetujuan dan plugin hanya mengekspos capability outbound/auth. Channel persetujuan native seperti Matrix, Slack, Telegram, dan transport chat kustom harus menggunakan helper native bersama alih-alih membangun siklus hidup persetujuan sendiri.

## Kebijakan mention masuk

Pertahankan penanganan mention masuk terbagi menjadi dua lapisan:

- pengumpulan bukti milik plugin
- evaluasi kebijakan bersama

Gunakan `openclaw/plugin-sdk/channel-mention-gating` untuk keputusan kebijakan mention.
Gunakan `openclaw/plugin-sdk/channel-inbound` hanya saat Anda memerlukan barrel helper inbound yang lebih luas.

Cocok untuk logika lokal plugin:

- deteksi reply-ke-bot
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
2. Teruskan fakta itu ke `resolveInboundMentionDecision({ facts, policy })`.
3. Gunakan `decision.effectiveWasMentioned`, `decision.shouldBypassMention`, dan `decision.shouldSkip` pada gate inbound Anda.

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
runtime inbound lain yang tidak terkait.

Helper `resolveMentionGating*` yang lebih lama tetap ada di
`openclaw/plugin-sdk/channel-inbound` hanya sebagai ekspor kompatibilitas. Kode baru
sebaiknya menggunakan `resolveInboundMentionDecision({ facts, policy })`.

## Panduan langkah demi langkah

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Paket dan manifest">
    Buat file Plugin standar. Field `channel` di `package.json` adalah
    yang menjadikannya Plugin channel. Untuk surface metadata paket lengkap,
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
    pengaturan milik Plugin yang bukan merupakan konfigurasi akun channel. `channelConfigs`
    memvalidasi `channels.acme-chat` dan merupakan sumber jalur dingin yang digunakan oleh config
    schema, setup, dan surface UI sebelum runtime Plugin dimuat.

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
      Daripada mengimplementasikan interface adapter tingkat rendah secara manual, Anda meneruskan
      opsi deklaratif dan builder akan menyusunnya:

      | Opsi | Apa yang dihubungkan |
      | --- | --- |
      | `security.dm` | Resolver keamanan DM dengan cakupan dari field config |
      | `pairing.text` | Alur pairing DM berbasis teks dengan pertukaran kode |
      | `threading` | Resolver mode balas-ke (tetap, dengan cakupan akun, atau kustom) |
      | `outbound.attachedResults` | Fungsi kirim yang mengembalikan metadata hasil (id pesan) |

      Anda juga dapat meneruskan objek adapter mentah alih-alih opsi deklaratif
      jika memerlukan kontrol penuh.

      Adapter outbound mentah dapat mendefinisikan fungsi `chunker(text, limit, ctx)`.
      `ctx.formatting` opsional membawa keputusan pemformatan waktu pengiriman
      seperti `maxLinesPerMessage`; terapkan ini sebelum mengirim agar reply threading
      dan batas chunk di-resolve sekali oleh pengiriman outbound bersama.
      Konteks pengiriman juga menyertakan `replyToIdSource` (`implicit` atau `explicit`)
      saat target balasan native berhasil di-resolve, sehingga helper payload dapat mempertahankan
      tag balasan eksplisit tanpa menghabiskan slot balasan implisit sekali pakai.
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
    perintah yang sebenarnya. Pertahankan `registerFull(...)` untuk pekerjaan yang hanya saat runtime.
    Jika `registerFull(...)` mendaftarkan metode RPC gateway, gunakan prefix
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

    OpenClaw memuat ini alih-alih entri penuh saat channel dinonaktifkan
    atau belum dikonfigurasi. Ini menghindari penarikan kode runtime yang berat selama alur setup.
    Lihat [Setup and Config](/id/plugins/sdk-setup#setup-entry) untuk detail.

    Channel workspace bawaan yang memisahkan ekspor aman-setup ke modul sidecar
    dapat menggunakan `defineBundledChannelSetupEntry(...)` dari
    `openclaw/plugin-sdk/channel-entry-contract` saat juga memerlukan
    setter runtime waktu-setup yang eksplisit.

  </Step>

  <Step title="Tangani pesan masuk">
    Plugin Anda perlu menerima pesan dari platform dan meneruskannya ke
    OpenClaw. Pola yang umum adalah Webhook yang memverifikasi permintaan dan
    me-dispatch-nya melalui handler inbound channel Anda:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth yang dikelola plugin (verifikasi signature sendiri)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Handler inbound Anda me-dispatch pesan ke OpenClaw.
          // Wiring pastinya bergantung pada SDK platform Anda —
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
      Penanganan pesan masuk bersifat khusus channel. Setiap Plugin channel memiliki
      pipeline inbound-nya sendiri. Lihat Plugin channel bawaan
      (misalnya paket plugin Microsoft Teams atau Google Chat) untuk pola nyata.
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

      it("memeriksa akun tanpa mematerialisasi secret", () => {
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
├── openclaw.plugin.json      # Manifest dengan config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Ekspor publik (opsional)
├── runtime-api.ts            # Ekspor runtime internal (opsional)
└── src/
    ├── channel.ts            # ChannelPlugin melalui createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # Klien API platform
    └── runtime.ts            # Store runtime (jika diperlukan)
```

## Topik lanjutan

<CardGroup cols={2}>
  <Card title="Opsi threading" icon="git-branch" href="/id/plugins/sdk-entrypoints#registration-mode">
    Mode balas tetap, dengan cakupan akun, atau kustom
  </Card>
  <Card title="Integrasi tool pesan" icon="puzzle" href="/id/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool dan penemuan action
  </Card>
  <Card title="Resolusi target" icon="crosshair" href="/id/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/id/plugins/sdk-runtime">
    TTS, STT, media, subagen via api.runtime
  </Card>
</CardGroup>

<Note>
Beberapa seam helper bawaan masih ada untuk pemeliharaan Plugin bawaan dan
kompatibilitas. Itu bukan pola yang direkomendasikan untuk Plugin channel baru;
sebaiknya gunakan subpath channel/setup/reply/runtime generik dari surface SDK
umum kecuali Anda memang sedang memelihara keluarga Plugin bawaan tersebut secara langsung.
</Note>

## Langkah selanjutnya

- [Provider Plugins](/id/plugins/sdk-provider-plugins) — jika Plugin Anda juga menyediakan model
- [SDK Overview](/id/plugins/sdk-overview) — referensi impor subpath lengkap
- [SDK Testing](/id/plugins/sdk-testing) — utilitas test dan contract test
- [Plugin Manifest](/id/plugins/manifest) — schema manifest lengkap

## Terkait

- [Plugin SDK setup](/id/plugins/sdk-setup)
- [Building plugins](/id/plugins/building-plugins)
- [Agent harness plugins](/id/plugins/sdk-agent-harness)
