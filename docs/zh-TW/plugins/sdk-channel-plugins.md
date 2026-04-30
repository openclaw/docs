---
read_when:
    - 你正在建置新的訊息傳遞通道 Plugin
    - 你想要將 OpenClaw 連接到訊息平台
    - 你需要了解 ChannelPlugin 轉接器介面
sidebarTitle: Channel Plugins
summary: 逐步指南：為 OpenClaw 建立訊息通道 Plugin
title: 建置通道 Plugin
x-i18n:
    generated_at: "2026-04-30T03:25:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

本指南會逐步說明如何建立將 OpenClaw 連接到
訊息平台的 channel Plugin。完成後，你會擁有一個可運作的頻道，具備 DM 安全性、
配對、回覆討論串，以及站外訊息傳送功能。

<Info>
  如果你以前沒有建置過任何 OpenClaw Plugin，請先閱讀
  [入門指南](/zh-TW/plugins/building-plugins)，了解基本套件
  結構與 manifest 設定。
</Info>

## channel Plugin 的運作方式

channel Plugin 不需要自己的傳送/編輯/反應工具。OpenClaw 在核心中保留一個
共用的 `message` 工具。你的 Plugin 負責：

- **設定** — 帳號解析與設定精靈
- **安全性** — DM 政策與允許清單
- **配對** — DM 核准流程
- **工作階段文法** — 供應商特定對話 ID 如何對應到基礎聊天、討論串 ID 與父項後援
- **站外傳送** — 將文字、媒體與投票傳送到平台
- **討論串** — 回覆如何串接
- **Heartbeat 輸入狀態** — 對 Heartbeat 傳遞目標發送的選用輸入中/忙碌訊號

核心負責共用 message 工具、prompt 接線、外層工作階段 key 形狀、
通用 `:thread:` 簿記，以及分派。

如果你的頻道支援在入站回覆之外顯示輸入指示器，請在 channel Plugin 上公開
`heartbeat.sendTyping(...)`。核心會在 Heartbeat 模型執行開始前，以已解析的
Heartbeat 傳遞目標呼叫它，並使用共用的輸入狀態 keepalive/cleanup 生命週期。
當平台需要明確的停止訊號時，請加入 `heartbeat.clearTyping(...)`。

如果你的頻道加入了會攜帶媒體來源的 message-tool 參數，請透過
`describeMessageTool(...).mediaSourceParams` 公開那些參數名稱。核心會使用
該明確清單進行沙盒路徑正規化與站外媒體存取政策，因此 Plugin 不需要為供應商特定的
頭像、附件或封面圖片參數加入共用核心特例。
建議回傳以動作為 key 的對應，例如
`{ "set-profile": ["avatarUrl", "avatarPath"] }`，讓不相關的動作不會
繼承另一個動作的媒體參數。對於刻意由每個公開動作共用的參數，扁平陣列仍然可用。

如果你的平台在對話 ID 中儲存額外範圍，請在 Plugin 中使用
`messaging.resolveSessionConversation(...)` 保留該解析邏輯。這是將
`rawId` 對應到基礎對話 ID、選用討論串 ID、明確 `baseConversationId`，
以及任何 `parentConversationCandidates` 的標準 hook。
當你回傳 `parentConversationCandidates` 時，請從最窄的父項到最寬/基礎對話排序。

當 Plugin 程式碼需要正規化類路由欄位、比較子討論串與其父路由，或從
`{ channel, to, accountId, threadId }` 建立穩定的去重 key 時，請使用
`openclaw/plugin-sdk/channel-route`。此 helper 會以與核心相同的方式正規化數字討論串 ID，
因此 Plugin 應優先使用它，而不是臨時的 `String(threadId)` 比較。
具備供應商特定目標文法的 Plugin 可以將自己的解析器注入
`resolveChannelRouteTargetWithParser(...)`，並仍然取得與核心使用相同的路由目標形狀與討論串後援語意。

需要在 channel registry 啟動前執行相同解析的內建 Plugin，也可以公開頂層
`session-key-api.ts` 檔案，並提供相符的
`resolveSessionConversation(...)` 匯出。核心只會在執行階段 Plugin registry
尚不可用時，使用這個可安全啟動的介面。

當 Plugin 只需要在通用/原始 ID 之上提供父項後援時，
`messaging.resolveParentConversationCandidates(...)` 仍可作為舊版相容後援使用。
如果兩個 hook 都存在，核心會先使用
`resolveSessionConversation(...).parentConversationCandidates`，且只有在標準 hook
省略它們時，才會後援到 `resolveParentConversationCandidates(...)`。

## 核准與頻道能力

多數 channel Plugin 不需要核准專用程式碼。

- 核心負責同一聊天中的 `/approve`、共用核准按鈕 payload，以及通用後援傳遞。
- 當頻道需要核准特定行為時，請優先在 channel Plugin 上使用一個 `approvalCapability` 物件。
- `ChannelPlugin.approvals` 已移除。請將核准傳遞/native/render/auth 事實放在 `approvalCapability` 上。
- `plugin.auth` 只用於登入/登出；核心不再從該物件讀取核准 auth hook。
- `approvalCapability.authorizeActorAction` 與 `approvalCapability.getActionAvailabilityState` 是標準核准 auth 介面。
- 使用 `approvalCapability.getActionAvailabilityState` 取得同一聊天核准 auth 可用性。
- 如果你的頻道公開 native exec 核准，當啟動介面/native-client 狀態與同一聊天核准 auth 不同時，請使用 `approvalCapability.getExecInitiatingSurfaceState`。核心會使用該 exec 專用 hook 來區分 `enabled` 與 `disabled`、判斷啟動頻道是否支援 native exec 核准，並在 native-client 後援指引中包含該頻道。`createApproverRestrictedNativeApprovalCapability(...)` 會為常見情境填入此項。
- 使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload` 處理頻道特定 payload 生命週期行為，例如隱藏重複的本機核准提示，或在傳遞前傳送輸入指示器。
- 只有在 native 核准路由或後援抑制時，才使用 `approvalCapability.delivery`。
- 使用 `approvalCapability.nativeRuntime` 放置頻道擁有的 native 核准事實。請透過 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 讓它在熱 channel entrypoint 上保持延遲載入；這能在需要時匯入你的 runtime 模組，同時仍讓核心組裝核准生命週期。
- 只有當頻道確實需要自訂核准 payload、而不是使用共用 renderer 時，才使用 `approvalCapability.render`。
- 當頻道希望停用路徑回覆說明啟用 native exec 核准所需的確切設定旋鈕時，請使用 `approvalCapability.describeExecApprovalSetup`。此 hook 會收到 `{ channel, channelLabel, accountId }`；具名帳號頻道應呈現帳號範圍路徑，例如 `channels.<channel>.accounts.<id>.execApprovals.*`，而不是頂層預設值。
- 如果頻道可以從既有設定推論穩定的類擁有者 DM 身分，請使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 來限制同一聊天中的 `/approve`，而不加入核准特定核心邏輯。
- 如果頻道需要 native 核准傳遞，請讓頻道程式碼專注在目標正規化與傳輸/呈現事實。請使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 與 `createApproverRestrictedNativeApprovalCapability`。將頻道特定事實放在 `approvalCapability.nativeRuntime` 後方，理想情況是透過 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，讓核心可以組裝 handler 並負責請求過濾、路由、去重、過期、Gateway 訂閱，以及已路由到其他位置的通知。`nativeRuntime` 被拆成幾個較小的介面：
- `createChannelNativeOriginTargetResolver` 預設會對 `{ to, accountId, threadId }` 目標使用共用 channel-route matcher。只有當頻道具備供應商特定等價規則時，才傳入 `targetsMatch`，例如 Slack 時間戳前綴比對。
- 當頻道需要在預設 route matcher 或自訂 `targetsMatch` callback 執行前，先將供應商 ID 標準化，同時保留原始目標用於傳遞時，請將 `normalizeTargetForMatch` 傳給 `createChannelNativeOriginTargetResolver`。只有當已解析傳遞目標本身應被標準化時，才使用 `normalizeTarget`。
- `availability` — 帳號是否已設定，以及請求是否應被處理
- `presentation` — 將共用核准 view model 對應到 pending/resolved/expired native payload 或最終動作
- `transport` — 準備目標並傳送/更新/刪除 native 核准訊息
- `interactions` — native 按鈕或反應的選用 bind/unbind/clear-action hook
- `observe` — 選用傳遞診斷 hook
- 如果頻道需要 runtime 擁有的物件，例如 client、token、Bolt app 或 webhook receiver，請透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊它們。通用 runtime-context registry 讓核心能從頻道啟動狀態啟動由能力驅動的 handler，而不需要加入核准特定 wrapper glue。
- 只有當能力驅動介面尚不足以表達需求時，才使用較低階的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- Native 核准頻道必須透過那些 helper 路由 `accountId` 與 `approvalKind`。`accountId` 會讓多帳號核准政策限定在正確的 bot 帳號範圍內，而 `approvalKind` 會讓 exec 與 Plugin 核准行為可供頻道使用，而不需在核心中硬編碼分支。
- 核心現在也負責核准重新路由通知。channel Plugin 不應從 `createChannelNativeApprovalRuntime` 傳送自己的「核准已送到 DM / 另一個頻道」後續訊息；請改為透過共用核准能力 helper 公開準確的 origin 與 approver-DM 路由，並讓核心彙整實際傳遞後，再將任何通知張貼回啟動聊天。
- 端到端保留已傳遞核准 ID 的種類。Native client 不應
  從頻道本機狀態猜測或重寫 exec 與 Plugin 核准路由。
- 不同核准種類可以刻意公開不同的 native 介面。
  目前的內建範例：
  - Slack 讓 native 核准路由同時可用於 exec 與 Plugin ID。
  - Matrix 讓 exec 與 Plugin 核准保留相同的 native DM/頻道路由與反應 UX，
    同時仍允許 auth 依核准種類而異。
- `createApproverRestrictedNativeApprovalAdapter` 仍作為相容性 wrapper 存在，但新程式碼應優先使用能力 builder，並在 Plugin 上公開 `approvalCapability`。

對於熱 channel entrypoint，如果你只需要該系列的一個部分，請優先使用較窄的 runtime 子路徑：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同樣地，當你不需要更廣的 umbrella 介面時，請優先使用
`openclaw/plugin-sdk/setup-runtime`、
`openclaw/plugin-sdk/setup-adapter-runtime`、
`openclaw/plugin-sdk/reply-runtime`、
`openclaw/plugin-sdk/reply-dispatch-runtime`、
`openclaw/plugin-sdk/reply-reference` 與
`openclaw/plugin-sdk/reply-chunking`。

特別針對設定：

- `openclaw/plugin-sdk/setup-runtime` 涵蓋 runtime 安全的設定 helper：
  匯入安全的設定 patch adapter（`createPatchedAccountSetupAdapter`、
  `createEnvPatchedAccountSetupAdapter`、
  `createSetupInputPresenceValidator`）、lookup-note 輸出、
  `promptResolvedAllowFrom`、`splitSetupEntries`，以及委派的
  setup-proxy builder
- `openclaw/plugin-sdk/setup-adapter-runtime` 是用於 `createEnvPatchedAccountSetupAdapter`
  的狹窄 env-aware adapter 介面
- `openclaw/plugin-sdk/channel-setup` 涵蓋 optional-install 設定
  builder 與一些設定安全 primitives：
  `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、

如果你的頻道支援由 env 驅動的設定或 auth，且通用啟動/設定流程應在 runtime 載入前知道那些 env 名稱，
請在 Plugin manifest 中以 `channelEnvVars` 宣告它們。頻道 runtime 的 `envVars` 或本機
常數僅保留給面向 operator 的文案使用。

如果你的 channel 可能在 Plugin runtime 啟動前出現在 `status`、`channels list`、`channels status` 或 SecretRef 掃描中，請在 `package.json` 加入 `openclaw.setupEntry`。該進入點應可安全地在唯讀命令路徑中匯入，並應回傳這些摘要所需的 channel 中繼資料、setup-safe 設定配接器、狀態配接器，以及 channel secret target 中繼資料。不要從 setup entry 啟動 client、listener 或 transport runtime。

同樣地，也要讓主要 channel entry 的匯入路徑保持狹窄。Discovery 可以評估 entry 和 channel plugin 模組以註冊 capabilities，而不啟用 channel。像 `channel-plugin-api.ts` 這類檔案應匯出 channel plugin 物件，而不匯入 setup wizard、transport client、socket listener、subprocess launcher 或 service startup 模組。請把這些 runtime 組件放在從 `registerFull(...)`、runtime setter 或 lazy capability adapter 載入的模組中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、
`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和
`splitSetupEntries`

- 只有在你也需要較重的共用 setup/config helper，例如
  `moveSingleAccountChannelSectionToDefaultAccount(...)` 時，才使用較廣的
  `openclaw/plugin-sdk/setup` seam

如果你的 channel 只想在 setup surface 中顯示「請先安裝此 Plugin」，請優先使用 `createOptionalChannelSetupSurface(...)`。產生的 adapter/wizard 會在設定寫入和 finalize 時 fail closed，並在 validation、finalize 和 docs-link 文案中重用相同的 install-required 訊息。

對於其他 hot channel path，請優先使用較窄的 helper，而非較廣的 legacy surface：

- `openclaw/plugin-sdk/account-core`、
  `openclaw/plugin-sdk/account-id`、
  `openclaw/plugin-sdk/account-resolution` 和
  `openclaw/plugin-sdk/account-helpers`，用於 multi-account config 和
  default-account fallback
- `openclaw/plugin-sdk/inbound-envelope` 和
  `openclaw/plugin-sdk/inbound-reply-dispatch`，用於 inbound route/envelope 和
  record-and-dispatch wiring
- `openclaw/plugin-sdk/messaging-targets`，用於 target parsing/matching
- `openclaw/plugin-sdk/outbound-media` 和
  `openclaw/plugin-sdk/outbound-runtime`，用於 media loading，以及 outbound
  identity/send delegate 和 payload planning
- 當 outbound route 應保留明確的 `replyToId`/`threadId`，或在 base session key 仍然相符後復原目前的 `:thread:` session 時，使用
  `openclaw/plugin-sdk/channel-core` 中的 `buildThreadAwareOutboundSessionRoute(...)`。Provider plugins 可以在其平台具有原生 thread delivery 語意時，覆寫 precedence、suffix behavior 和 thread id normalization。
- `openclaw/plugin-sdk/thread-bindings-runtime`，用於 thread-binding lifecycle
  和 adapter registration
- 只有在仍需要 legacy agent/media payload 欄位配置時，才使用
  `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config`，用於 Telegram custom-command
  normalization、duplicate/conflict validation，以及 fallback-stable command
  config contract

Auth-only channel 通常可以停在預設路徑：core 會處理 approvals，而 Plugin 只需公開 outbound/auth capabilities。Matrix、Slack、Telegram 和自訂 chat transport 等 native approval channel，應使用共用的 native helper，而不是自行實作 approval lifecycle。

## Inbound 提及政策

將 inbound 提及處理分成兩層：

- Plugin 擁有的 evidence gathering
- 共用的 policy evaluation

使用 `openclaw/plugin-sdk/channel-mention-gating` 進行 mention-policy decision。
只有在你需要較廣的 inbound helper barrel 時，才使用 `openclaw/plugin-sdk/channel-inbound`。

適合放在 Plugin local logic：

- reply-to-bot 偵測
- quoted-bot 偵測
- thread-participation 檢查
- service/system-message 排除
- 需要證明 bot participation 的 platform-native cache

適合使用 shared helper：

- `requireMention`
- explicit mention result
- implicit mention allowlist
- command bypass
- final skip decision

建議流程：

1. 計算 local mention facts。
2. 將這些 facts 傳入 `resolveInboundMentionDecision({ facts, policy })`。
3. 在你的 inbound gate 中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和 `decision.shouldSkip`。

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

`api.runtime.channel.mentions` 為已依賴 runtime injection 的 bundled channel plugins 公開相同的 shared mention helper：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果你只需要 `implicitMentionKindWhen` 和
`resolveInboundMentionDecision`，請從
`openclaw/plugin-sdk/channel-mention-gating` 匯入，以避免載入無關的 inbound
runtime helper。

較舊的 `resolveMentionGating*` helper 仍保留在
`openclaw/plugin-sdk/channel-inbound`，僅作為 compatibility export。新程式碼
應使用 `resolveInboundMentionDecision({ facts, policy })`。

## 逐步說明

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package 和 manifest">
    建立標準 Plugin 檔案。`package.json` 中的 `channel` 欄位會讓它成為 channel Plugin。如需完整的 package-metadata surface，請參閱 [Plugin Setup 和 Config](/zh-TW/plugins/sdk-setup#openclaw-channel)：

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

    `configSchema` 會驗證 `plugins.entries.acme-chat.config`。請將它用於 Plugin 擁有、且不屬於 channel account config 的設定。`channelConfigs`
    會驗證 `channels.acme-chat`，並且是在 Plugin runtime 載入前，config
    schema、setup 和 UI surface 使用的 cold-path source。

  </Step>

  <Step title="建置 channel Plugin 物件">
    `ChannelPlugin` 介面有許多選用的 adapter surface。從最小集合開始，也就是 `id` 和 `setup`，再依需要加入 adapter。

    建立 `src/channel.ts`：

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

    對於同時接受 canonical top-level DM key 和 legacy nested key 的 channel，請使用 `plugin-sdk/channel-config-helpers` 中的 helper：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 會讓 account-local value 優先於 inherited root value。請將同一個 resolver 搭配 `normalizeLegacyDmAliases` 用於 doctor repair，讓 runtime 和 migration 讀取相同的 contract。

    <Accordion title="createChatChannelPlugin 會為你做什麼">
      你不需要手動實作 low-level adapter interface，而是傳入宣告式選項，由 builder 將它們組合起來：

      | 選項 | 連接內容 |
      | --- | --- |
      | `security.dm` | 來自 config 欄位的 scoped DM security resolver |
      | `pairing.text` | 具備 code exchange 的 text-based DM pairing flow |
      | `threading` | Reply-to-mode resolver（固定、account-scoped 或自訂） |
      | `outbound.attachedResults` | 回傳 result metadata（message ID）的 send function |

      如果你需要完整控制，也可以傳入 raw adapter object，而不是宣告式選項。

      原始輸出介面卡可定義 `chunker(text, limit, ctx)` 函式。
      選用的 `ctx.formatting` 會攜帶傳送時的格式決策，
      例如 `maxLinesPerMessage`；請在傳送前套用，讓回覆串接
      與分段邊界由共用的輸出傳送流程一次解析完成。
      傳送情境也會在已解析原生回覆目標時包含 `replyToIdSource`（`implicit` 或 `explicit`），
      因此酬載輔助函式可以保留明確的回覆標籤，
      而不會消耗隱含的一次性回覆槽。
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
    建立 `index.ts`：

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

    將頻道擁有的 CLI 描述元放在 `registerCliMetadata(...)` 中，讓 OpenClaw
    可以在根說明中顯示它們，而不必啟用完整頻道執行階段；
    一般完整載入仍會取得相同描述元，用於實際命令註冊。
    將 `registerFull(...)` 保留給僅限執行階段的工作。
    如果 `registerFull(...)` 註冊 Gateway RPC 方法，請使用
    Plugin 專屬前綴。核心管理命名空間（`config.*`、
    `exec.approvals.*`、`wizard.*`、`update.*`）會保持保留，且一律
    解析為 `operator.admin`。
    `defineChannelPluginEntry` 會自動處理註冊模式分割。請參閱
    [進入點](/zh-TW/plugins/sdk-entrypoints#definechannelpluginentry) 了解所有
    選項。

  </Step>

  <Step title="Add a setup entry">
    建立 `setup-entry.ts`，供上線設定期間輕量載入：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    當頻道停用或尚未設定時，OpenClaw 會載入此項目，而非完整進入點。
    這可避免在設定流程中拉入沉重的執行階段程式碼。
    詳情請參閱[設定與組態](/zh-TW/plugins/sdk-setup#setup-entry)。

    將設定安全匯出拆分到 sidecar 模組的隨附工作區頻道，
    若也需要明確的設定期間執行階段 setter，
    可以使用 `openclaw/plugin-sdk/channel-entry-contract` 中的
    `defineBundledChannelSetupEntry(...)`。

  </Step>

  <Step title="Handle inbound messages">
    你的 Plugin 需要從平台接收訊息，並將它們轉送給
    OpenClaw。典型模式是使用 Webhook 驗證要求，並透過你的頻道輸入處理器
    分派：

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
      輸入訊息處理是頻道專屬的。每個頻道 Plugin 都擁有自己的
      輸入管線。請查看隨附的頻道 Plugin
      （例如 Microsoft Teams 或 Google Chat Plugin 套件）以了解實際模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
在 `src/channel.test.ts` 中撰寫共置測試：

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

    如需共用測試輔助工具，請參閱[測試](/zh-TW/plugins/sdk-testing)。

</Step>
</Steps>

## 檔案結構

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

## 進階主題

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/zh-TW/plugins/sdk-entrypoints#registration-mode">
    固定、帳戶範圍或自訂回覆模式
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/zh-TW/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 與動作探索
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/zh-TW/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/zh-TW/plugins/sdk-runtime">
    TTS、STT、媒體、透過 api.runtime 使用的子代理
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/zh-TW/plugins/sdk-channel-turn">
    共用輸入回合生命週期：擷取、解析、記錄、分派、完成
  </Card>
</CardGroup>

<Note>
部分隨附輔助接縫仍存在，用於隨附 Plugin 維護與
相容性。它們不是新頻道 Plugin 的建議模式；
除非你正在直接維護該隨附 Plugin 系列，否則請優先使用共同 SDK
介面中的通用頻道、設定、回覆、執行階段子路徑。
</Note>

## 後續步驟

- [Provider Plugin](/zh-TW/plugins/sdk-provider-plugins) — 如果你的 Plugin 也提供模型
- [SDK 概覽](/zh-TW/plugins/sdk-overview) — 完整子路徑匯入參考
- [SDK 測試](/zh-TW/plugins/sdk-testing) — 測試工具與合約測試
- [Plugin Manifest](/zh-TW/plugins/manifest) — 完整 manifest schema

## 相關

- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [Agent harness Plugin](/zh-TW/plugins/sdk-agent-harness)
