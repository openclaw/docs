---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 `OPENCLAW_EXTENSION_API_DEPRECATED` 警告
    - 你曾在 OpenClaw 2026.4.25 之前使用 api.registerEmbeddedExtensionFactory
    - 你正在將外掛更新為現代化的外掛架構
    - 你維護一個外部 OpenClaw 外掛
sidebarTitle: Migrate to SDK
summary: 從舊版向後相容層遷移至現代化外掛 SDK
title: 外掛 SDK 遷移
x-i18n:
    generated_at: "2026-07-12T14:42:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 805fa6b1492cec8bb0e4967a6b6606c91016a43ec5a3eb7d048e83aa7721704e
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已將廣泛的向下相容層替換為由小型、聚焦匯入項目組成的現代外掛
架構。如果你的外掛早於這項變更，本指南可協助它遷移至目前的合約。

## 變更內容

過去有兩個幾乎不受限制的匯入介面，讓外掛能從單一進入點存取幾乎所有內容：

- **`openclaw/plugin-sdk/compat`** - 重新匯出數十個輔助函式，以便在建置新架構期間
  維持舊式勾點型外掛的運作。
- **`openclaw/plugin-sdk/infra-runtime`** - 一個廣泛的彙總匯出，混合了系統
  事件、心跳偵測狀態、傳遞佇列、擷取／Proxy 輔助函式、檔案輔助函式、
  核准型別，以及不相關的工具。
- **`openclaw/plugin-sdk/config-runtime`** - 一個廣泛的設定彙總匯出，在遷移期間仍
  保留已棄用的直接載入／寫入輔助函式。
- **`openclaw/extension-api`** - 一個橋接介面，讓外掛可直接存取
  主機端輔助函式，例如內嵌代理程式執行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 已移除、僅適用於內嵌執行器的
  勾點，原本用於觀察 `tool_result` 等內嵌執行器事件。請改用代理程式
  工具結果中介軟體（請參閱[將內嵌工具結果擴充功能遷移至中介軟體](#how-to-migrate)）。

這些介面已**棄用**：它們目前仍可運作，但新的外掛不得
使用，而且現有外掛應在下一個主要版本將其移除前完成遷移。
`registerEmbeddedExtensionFactory` 已經移除；舊式註冊將不再載入。

<Warning>
  向下相容層將在未來的主要版本中移除。
  屆時，仍從這些介面匯入的外掛將會失效。
</Warning>

OpenClaw 不會在引入替代方案的同一項變更中，移除或重新解釋已有文件記載的
外掛行為。破壞合約的變更會先經過相容性配接器、診斷、文件及棄用期間。
這適用於 SDK 匯入、資訊清單欄位、設定 API、勾點，以及執行階段
註冊行為。

### 原因

- **啟動緩慢** - 匯入一個輔助函式就會載入數十個不相關的模組。
- **循環相依性** - 廣泛的重新匯出很容易造成匯入循環。
- **API 介面不明確** - 無法分辨穩定匯出與內部匯出。

現在，每個 `openclaw/plugin-sdk/<subpath>` 都是小型、獨立且具有
文件化合約的模組。

內建頻道的舊式提供者便利介面也已移除——
以頻道品牌命名的輔助函式捷徑只是單一儲存庫中的私有便利機制，並非
穩定的外掛合約。請改用範圍狹窄的通用 SDK 子路徑。在
內建外掛工作區中，請將提供者擁有的輔助函式保留於該外掛自己的
`api.ts` 或 `runtime-api.ts`：

- Anthropic 將 Claude 專用的串流輔助函式保留在自己的 `api.ts` /
  `contract-api.ts` 介面中。
- OpenAI 將提供者建構器、預設模型輔助函式及即時提供者
  建構器保留在自己的 `api.ts` 中。
- OpenRouter 將提供者建構器及初始設定／設定輔助函式保留在自己的
  `api.ts` 中。

## 相容性政策

外部外掛的相容性工作遵循以下順序：

1. 新增新合約。
2. 透過相容性配接器維持舊行為的連接。
3. 發出診斷或警告，指出舊路徑及替代方案。
4. 在測試中涵蓋兩條路徑。
5. 記錄棄用與遷移路徑。
6. 僅在公告的遷移期間結束後移除，通常是在主要
   版本中。

如果某個資訊清單欄位仍被接受，請持續使用，直到文件與
診斷另有說明。新程式碼應優先採用文件記載的替代方案；
現有外掛不應在一般次要版本更新期間失效。

使用 `pnpm plugins:boundary-report` 稽核目前的遷移佇列：

| 旗標                                                    | 效果                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary`（或 `pnpm plugins:boundary-report:summary`） | 顯示精簡計數，而非完整詳細資料。                                         |
| `--json`                                                | 機器可讀的報告。                                                       |
| `--owner <id>`                                          | 篩選至單一外掛或相容性擁有者。                                   |
| `--fail-on-cross-owner`                                 | 遇到跨擁有者的保留 SDK 匯入時，以非零狀態結束。                             |
| `--fail-on-eligible-compat`                             | 已棄用相容性記錄的 `removeAfter` 日期過期時，以非零狀態結束。 |
| `--fail-on-unclassified-unused-reserved`                | 遇到未分類且未使用的保留 SDK 轉接層時，以非零狀態結束。                                    |

`pnpm plugins:boundary-report:ci` 會搭配全部三個失敗旗標執行。每筆
相容性記錄都有明確的 `removeAfter` 日期（而非模糊的「下一個
主要版本」）——報告會依該日期分組已棄用的記錄、計算
本機程式碼／文件參照、顯示跨擁有者的保留 SDK 匯入，並
摘要私有的記憶體主機 SDK 橋接介面。保留的 SDK 子路徑必須有
追蹤的擁有者使用紀錄；未使用的保留匯出應從公開
SDK 中移除。

## 遷移方式

<Steps>
  <Step title="遷移執行階段設定載入／寫入輔助函式">
    內建外掛應停止直接呼叫 `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。請優先使用已傳入
    目前呼叫路徑的設定。需要目前處理程序快照的長期執行處理常式
    可使用 `api.runtime.config.current()`。長期執行的代理程式工具應在
    `execute` 內讀取 `ctx.getRuntimeConfig()`，如此即使工具是在設定寫入前
    建立，仍可看到重新整理後的設定。

    設定寫入會透過交易式輔助函式進行，並明確指定
    寫入後政策：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    當變更需要乾淨地重新啟動閘道時，請使用
    `afterWrite: { mode: "restart", reason: "..." }`；僅當呼叫端負責後續處理，
    並刻意停用重新載入規劃器時，才使用
    `afterWrite: { mode: "none", reason: "..." }`。變更結果包含具型別的
    `followUp` 摘要，可供測試與記錄使用；閘道仍負責套用或
    排程重新啟動。

    `loadConfig` 和 `writeConfigFile` 仍作為外部外掛的已棄用相容性
    輔助函式保留，並使用 `runtime-config-load-write` 相容性代碼發出一次警告。
    內建外掛與儲存庫執行階段程式碼由
    `pnpm check:deprecated-api-usage` 和
    `pnpm check:no-runtime-action-load-config` 保護：新的正式環境外掛用法
    會直接失敗、直接設定寫入會失敗、閘道伺服器方法必須使用
    請求的執行階段快照、執行階段頻道傳送／動作／用戶端輔助函式
    必須從其邊界接收設定，而且長期執行的執行階段模組
    不允許任何環境式 `loadConfig()` 呼叫。

    新的外掛程式碼應避免使用廣泛的 `openclaw/plugin-sdk/config-runtime`
    彙總匯出。請針對工作使用範圍狹窄的子路徑：

    | 需求 | 匯入 |
    | --- | --- |
    | `OpenClawConfig` 等設定型別 | `openclaw/plugin-sdk/config-contracts` |
    | 已載入的設定判斷提示與外掛進入點設定查詢 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 目前執行階段快照讀取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 設定寫入 | `openclaw/plugin-sdk/config-mutation` |
    | 工作階段儲存輔助函式 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格設定 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群組政策執行階段輔助函式 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 機密輸入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型／工作階段覆寫 | `openclaw/plugin-sdk/model-session-runtime` |

    內建外掛及其測試受到掃描器保護，不得使用廣泛的
    彙總匯出，讓匯入與模擬維持在其所需行為的本機範圍內。
    該彙總匯出仍為外部相容性而存在，但新程式碼不應
    相依於它。

  </Step>

  <Step title="將內嵌工具結果擴充功能遷移至中介軟體">
    內建外掛必須將僅適用於內嵌執行器的
    `api.registerEmbeddedExtensionFactory(...)` 工具結果處理常式替換為
    與執行階段無關的中介軟體：

    ```typescript
    // OpenClaw 和 Codex 執行階段動態工具
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    同時更新外掛資訊清單：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    已安裝的外掛也可以註冊工具結果中介軟體，但必須明確
    啟用，且每個目標執行階段都必須在
    `contracts.agentToolResultMiddleware` 中宣告。未宣告的已安裝中介軟體
    註冊將遭拒絕。

  </Step>

  <Step title="將原生核准處理常式遷移至功能事實">
    支援核准的頻道外掛會透過
    `approvalCapability.nativeRuntime` 加上共用的執行階段情境
    登錄機制，公開原生核准行為：

    - 將 `approvalCapability.handler.loadRuntime(...)` 替換為
      `approvalCapability.nativeRuntime`。
    - 將核准專用的驗證／傳遞從舊式 `plugin.auth` /
      `plugin.approvals` 連接方式移至 `approvalCapability`。
    - `ChannelPlugin.approvals` 已從公開的
      頻道外掛合約中移除；請將傳遞／原生／呈現欄位移至
      `approvalCapability`。
    - `plugin.auth` 僅保留給頻道登入／登出流程；核心不再
      從中讀取核准驗證勾點。
    - 透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊頻道擁有的
      執行階段物件（用戶端、權杖、Bolt 應用程式）。
    - 請勿從原生核准處理常式傳送外掛擁有的重新路由通知；
      核心會根據實際傳遞結果負責已路由至其他位置的通知。
    - 將 `channelRuntime` 傳入 `createChannelManager(...)` 時，請提供
      真正的 `createPluginRuntime().channel` 介面——不接受
      不完整的虛設實作。

    如需目前的核准功能配置，請參閱[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)。

  </Step>

  <Step title="稽核 Windows 包裝程式的後援行為">
    如果你的外掛使用 `openclaw/plugin-sdk/windows-spawn`，無法解析的 Windows
    `.cmd`/`.bat` 包裝程式現在預設會安全失敗，除非你明確傳入
    `allowShellFallback: true`：

    ```typescript
    // 之前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 之後
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 僅針對刻意接受由 Shell 介入後援的受信任相容性呼叫端
      // 設定此選項。
      allowShellFallback: true,
    });
    ```

    如果你的呼叫端並非刻意依賴 Shell 後援，請勿設定
    `allowShellFallback`，而應改為處理擲回的錯誤。

  </Step>

  <Step title="尋找已棄用的匯入">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="替換為聚焦的匯入">
    舊介面的每個匯出都對應至特定的現代匯入路徑：

    ```typescript
    // 之前（已棄用的向後相容層）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 之後（現代化的聚焦匯入）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    對於主機端輔助函式，請使用注入的外掛執行階段，而不要
    直接匯入：

    ```typescript
    // 之前（已棄用的 extension-api 橋接）
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // 之後（注入的執行階段）
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    其他舊版橋接輔助函式也採用相同模式：

    | 舊匯入 | 現代化對應項目 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 工作階段儲存區輔助函式 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="取代廣泛的 infra-runtime 匯入">
    `openclaw/plugin-sdk/infra-runtime` 仍為外部
    相容性而保留，但新程式碼應匯入其實際
    需要的聚焦介面：

    | 需求 | 匯入 |
    | --- | --- |
    | 系統事件佇列輔助函式 | `openclaw/plugin-sdk/system-event-runtime` |
    | 心跳偵測喚醒、事件與可見性輔助函式 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 清空待處理的傳遞佇列 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 頻道活動遙測 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 記憶體內與持久化後端的去重快取 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本機檔案／媒體路徑輔助函式 | `openclaw/plugin-sdk/file-access-runtime` |
    | 可感知分派器的擷取 | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理伺服器與受防護的擷取輔助函式 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 分派器原則型別 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 核准請求／解析型別 | `openclaw/plugin-sdk/approval-runtime` |
    | 核准回覆承載資料與命令輔助函式 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 錯誤格式化輔助函式 | `openclaw/plugin-sdk/error-runtime` |
    | 等待傳輸就緒 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全權杖輔助函式 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界的非同步工作並行處理 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 用於可證明不變條件的必要值斷言 | `openclaw/plugin-sdk/expect-runtime` |
    | 數值強制轉換 | `openclaw/plugin-sdk/number-runtime` |
    | 行程本機非同步鎖定 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 檔案鎖定 | `openclaw/plugin-sdk/file-lock` |

    內建外掛受掃描器保護，不得使用 `infra-runtime`，因此儲存庫程式碼
    無法退回使用這個廣泛的彙整匯出。

  </Step>

  <Step title="遷移頻道路由輔助函式">
    新的頻道路由程式碼使用 `openclaw/plugin-sdk/channel-route`。較舊的
    路由鍵與可比較目標名稱仍保留為相容性別名：

    | 舊輔助函式 | 現代化輔助函式 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    現代化路由輔助函式會在原生核准、回覆抑制、傳入去重、
    排程傳遞與工作階段路由之間，一致地正規化 `{ channel, to, accountId, threadId }`。

    請勿新增使用 `ChannelMessagingAdapter.parseExplicitTarget`、以剖析器為後端的
    已載入路由輔助函式（`parseExplicitTargetForLoadedChannel`、
    `resolveRouteTargetForLoadedChannel`），或來自 `plugin-sdk/channel-route` 的
    `resolveChannelRouteTargetWithParser(...)`；這些項目已棄用，僅為舊版外掛保留。新的頻道
    外掛應使用 `messaging.targetResolver.resolveTarget(...)` 進行
    目標 ID 正規化與目錄未命中時的備援處理；
    當核心需要提早判定對等端類型時，使用 `messaging.inferTargetChatType(...)`；
    並使用 `messaging.resolveOutboundSessionRoute(...)` 處理供應商原生的
    工作階段與討論串識別資訊。

  </Step>

  <Step title="建置與測試">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## 匯入路徑參考

  <Accordion title="Common import path table">
  | 匯入路徑 | 用途 | 主要匯出項目 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 標準外掛進入點輔助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | 用於頻道進入點定義／建構器的舊版統合重新匯出 | `defineChannelPluginEntry`、`createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根設定結構描述匯出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 單一供應商進入點輔助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 聚焦的頻道進入點定義與建構器 | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
  | `plugin-sdk/setup` | 共用設定精靈輔助工具 | 設定翻譯器、允許清單提示、設定狀態建構器 |
  | `plugin-sdk/setup-runtime` | 設定階段的執行階段輔助工具 | `createSetupTranslator`、可安全匯入的設定修補配接器、查詢備註輔助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委派式設定代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已淘汰的設定配接器別名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 設定工具輔助工具 | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多帳號輔助工具 | 帳號清單／設定／動作閘門輔助工具 |
  | `plugin-sdk/account-id` | 帳號 ID 輔助工具 | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化 |
  | `plugin-sdk/account-resolution` | 帳號查詢輔助工具 | 帳號查詢與預設後備輔助工具 |
  | `plugin-sdk/account-helpers` | 精簡帳號輔助工具 | 帳號清單／帳號動作輔助工具 |
  | `plugin-sdk/channel-setup` | 設定精靈配接器 | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私訊配對基礎元件 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回覆前綴、輸入狀態及來源傳遞接線 | `createChannelReplyPipeline`、`resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定配接器工廠與私訊存取輔助工具 | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定結構描述建構器 | 僅包含共用頻道設定結構描述基礎元件與通用建構器 |
  | `plugin-sdk/bundled-channel-config-schema` | 內建設定結構描述 | 僅限 OpenClaw 維護的內建外掛；新外掛必須定義外掛本機結構描述 |
  | `plugin-sdk/channel-config-schema-legacy` | 已淘汰的內建設定結構描述 | 僅供相容性使用的別名；對於維護中的內建外掛，請使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 指令設定輔助工具 | 指令名稱正規化、描述修整、重複／衝突驗證 |
  | `plugin-sdk/channel-policy` | 群組／私訊政策解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 已淘汰的相容性門面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | 傳入封套輔助工具 | 共用路由與封套建構器輔助工具 |
  | `plugin-sdk/channel-inbound` | 傳入接收輔助工具 | 上下文建構、格式化、根目錄、執行器、已準備的回覆分派及分派述詞 |
  | `plugin-sdk/messaging-targets` | 已淘汰的目標剖析匯入路徑 | 通用目標剖析輔助工具請使用 `plugin-sdk/channel-targets`，路由比較請使用 `plugin-sdk/channel-route`，供應商特定的目標解析則使用外掛擁有的 `messaging.targetResolver`／`messaging.resolveOutboundSessionRoute` |
  | `plugin-sdk/outbound-media` | 傳出媒體輔助工具 | 共用傳出媒體載入 |
  | `plugin-sdk/outbound-send-deps` | 已淘汰的相容性門面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | 傳出訊息生命週期輔助工具 | 訊息配接器、收據、持久傳送輔助工具、即時預覽／串流輔助工具、回覆選項、生命週期輔助工具、傳出身分及承載資料規劃 |
  | `plugin-sdk/channel-streaming` | 已淘汰的相容性門面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | 已淘汰的相容性門面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | 對話串繫結輔助工具 | 對話串繫結生命週期與配接器輔助工具 |
  | `plugin-sdk/agent-media-payload` | 舊版媒體承載資料輔助工具 | 用於舊版欄位配置的代理程式媒體承載資料建構器 |
  | `plugin-sdk/channel-runtime` | 已淘汰的相容性墊片 | 僅限舊版頻道執行階段公用工具 |
  | `plugin-sdk/channel-send-result` | 傳送結果型別 | 回覆結果型別 |
  | `plugin-sdk/runtime-store` | 持久性外掛儲存空間 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 廣泛的執行階段輔助工具 | 執行階段／記錄／備份／外掛安裝輔助工具 |
  | `plugin-sdk/runtime-env` | 精簡執行階段環境輔助工具 | 記錄器／執行階段環境、逾時、重試及退避輔助工具 |
  | `plugin-sdk/plugin-runtime` | 共用外掛執行階段輔助工具 | 外掛指令／鉤子／HTTP／互動式輔助工具 |
  | `plugin-sdk/hook-runtime` | 鉤子管線輔助工具 | 共用網路鉤子／內部鉤子管線輔助工具 |
  | `plugin-sdk/lazy-runtime` | 延遲載入執行階段輔助工具 | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeMethodBinder`、`createLazyRuntimeNamedExport`、`createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 處理程序輔助工具 | 共用執行輔助工具 |
  | `plugin-sdk/cli-runtime` | 命令列介面執行階段輔助工具 | 指令格式化、等待、版本輔助工具 |
  | `plugin-sdk/gateway-runtime` | 閘道輔助工具 | 閘道用戶端、事件迴圈就緒啟動輔助工具、公告的區域網路主機解析及頻道狀態修補輔助工具 |
  | `plugin-sdk/config-runtime` | 已淘汰的設定相容性墊片 | 優先使用 `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 指令輔助工具 | 內建 Telegram 合約介面無法使用時，具穩定後備行為的 Telegram 指令驗證輔助工具 |
  | `plugin-sdk/approval-runtime` | 核准提示輔助工具 | 執行／外掛核准承載資料、核准能力／設定檔輔助工具、原生核准路由／執行階段輔助工具，以及結構化核准顯示路徑格式化 |
  | `plugin-sdk/approval-auth-runtime` | 核准授權輔助工具 | 核准者解析、同一聊天中的動作授權 |
  | `plugin-sdk/approval-client-runtime` | 核准用戶端輔助工具 | 原生執行核准設定檔／篩選器輔助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 核准傳遞輔助工具 | 原生核准能力／傳遞配接器 |
  | `plugin-sdk/approval-gateway-runtime` | 核准閘道輔助工具 | 共用核准閘道解析器 |
  | `plugin-sdk/approval-reference-runtime` | 核准傳輸參照 | 用於傳輸受限回呼的確定性持久定位器輔助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 核准配接器輔助工具 | 適用於熱門頻道進入點的輕量原生核准配接器載入輔助工具 |
  | `plugin-sdk/approval-handler-runtime` | 核准處理常式輔助工具 | 較廣泛的核准處理常式執行階段輔助工具；較精簡的配接器／閘道介面已足夠時，請優先使用它們 |
  | `plugin-sdk/approval-native-runtime` | 核准目標輔助工具 | 原生核准目標／帳號繫結輔助工具 |
  | `plugin-sdk/approval-reply-runtime` | 核准回覆輔助工具 | 執行／外掛核准回覆承載資料輔助工具 |
  | `plugin-sdk/channel-runtime-context` | 頻道執行階段上下文輔助工具 | 通用頻道執行階段上下文註冊／取得／監看輔助工具 |
  | `plugin-sdk/security-runtime` | 安全性輔助工具 | 共用信任、私訊閘門、根目錄範圍內檔案／路徑、外部內容及機密收集輔助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 政策輔助工具 | 主機允許清單與私人網路政策輔助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 執行階段輔助工具 | 固定分派器、受防護的擷取、SSRF 政策輔助工具 |
  | `plugin-sdk/system-event-runtime` | 系統事件輔助工具 | `enqueueSystemEvent`、`peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | 心跳偵測輔助工具 | 心跳偵測喚醒、事件及可見性輔助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 傳遞佇列輔助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 頻道活動輔助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重輔助工具 | 記憶體內與持久性後端支援的去重快取 |
  | `plugin-sdk/file-access-runtime` | 檔案存取輔助工具 | 安全的本機檔案／媒體路徑輔助工具 |
  | `plugin-sdk/transport-ready-runtime` | 傳輸就緒輔助工具 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | 執行核准政策輔助工具 | `loadExecApprovals`、`resolveExecApprovalsFromFile`、`ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 有界快取輔助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診斷閘門輔助工具 | `isDiagnosticFlagEnabled`、`isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 錯誤輔助工具 | `formatUncaughtError`、`isApprovalNotFoundError`、錯誤圖輔助工具、`PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | 包裝式擷取／代理輔助工具 | `resolveFetch`、代理輔助工具、EnvHttpProxyAgent 選項輔助工具 |
  | `plugin-sdk/host-runtime` | 主機正規化輔助工具 | `normalizeHostname`、`normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重試輔助工具 | `RetryConfig`、`retryAsync`、政策執行器 |
  | `plugin-sdk/allow-from` | 允許清單格式化與輸入對應 | `formatAllowFromLowercase`、`mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 指令閘門與指令介面輔助工具 | `resolveControlCommandGate`、傳送者授權輔助工具、包含動態引數選單格式化的指令登錄輔助工具 |
  | `plugin-sdk/command-status` | 指令狀態／說明轉譯器 | `buildCommandsMessage`、`buildCommandsMessagePaginated`、`buildHelpMessage` |
  | `plugin-sdk/secret-input` | 機密輸入剖析 | 機密輸入輔助工具 |
  | `plugin-sdk/webhook-ingress` | 網路鉤子請求輔助工具 | 網路鉤子目標公用工具 |
  | `plugin-sdk/webhook-request-guards` | 網路鉤子本文防護輔助工具 | 請求本文讀取／限制輔助工具 |
  | `plugin-sdk/reply-runtime` | 共用回覆執行階段 | 傳入分派、心跳偵測、回覆規劃器、分塊 |
  | `plugin-sdk/reply-dispatch-runtime` | 精簡回覆分派輔助工具 | 完成、供應商分派及交談標籤輔助工具 |
  | `plugin-sdk/reply-history` | 回覆歷程輔助工具 | `createChannelHistoryWindow`；已淘汰的對應輔助工具相容性匯出，例如 `buildPendingHistoryContextFromMap`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回覆參照規劃 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回覆分塊輔助工具 | 文字／Markdown 分塊輔助工具 |
  | `plugin-sdk/session-store-runtime` | 工作階段儲存區輔助工具 | 具範圍限制的工作階段資料列輔助工具、儲存區路徑輔助工具及更新時間讀取 |
  | `plugin-sdk/state-paths` | 狀態路徑輔助工具 | 狀態與 OAuth 目錄輔助工具 |
  | `plugin-sdk/routing` | 路由／工作階段金鑰輔助工具 | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、工作階段金鑰正規化輔助工具 |
  | `plugin-sdk/status-helpers` | 頻道狀態輔助工具 | 頻道／帳號狀態摘要建構器、執行階段狀態預設值、問題中繼資料輔助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目標解析器輔助工具 | 共用目標解析器輔助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字串正規化輔助工具 | Slug／字串正規化輔助工具 |
  | `plugin-sdk/request-url` | 請求 URL 輔助工具 | 從類請求輸入擷取字串 URL |
  | `plugin-sdk/run-command` | 計時命令輔助工具 | 具正規化 stdout/stderr 的計時命令執行器 |
  | `plugin-sdk/param-readers` | 參數讀取器 | 常用工具／命令列介面參數讀取器 |
  | `plugin-sdk/tool-payload` | 工具承載資料擷取 | 從工具結果物件擷取正規化承載資料 |
  | `plugin-sdk/tool-send` | 工具傳送資訊擷取 | 從工具引數擷取標準傳送目標欄位 |
  | `plugin-sdk/temp-path` | 暫存路徑輔助工具 | 共用暫存下載路徑輔助工具 |
  | `plugin-sdk/logging-core` | 記錄輔助工具 | 子系統記錄器與遮蔽輔助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格輔助工具 | Markdown 表格模式輔助工具 |
  | `plugin-sdk/reply-payload` | 訊息回覆型別 | 回覆承載資料型別 |
  | `plugin-sdk/provider-setup` | 精選本機／自行託管提供者設定輔助工具 | 自行託管提供者探索／設定輔助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 專注於 OpenAI 相容自行託管提供者的設定輔助工具 | 相同的自行託管提供者探索／設定輔助工具 |
  | `plugin-sdk/provider-auth-runtime` | 提供者執行階段驗證輔助工具 | 執行階段 API 金鑰解析輔助工具 |
  | `plugin-sdk/provider-auth-api-key` | 提供者 API 金鑰設定輔助工具 | API 金鑰新手引導／設定檔寫入輔助工具 |
  | `plugin-sdk/provider-auth-result` | 提供者驗證結果輔助工具 | 標準 OAuth 驗證結果建構器 |
  | `plugin-sdk/provider-selection-runtime` | 提供者選擇輔助工具 | 已設定或自動提供者選擇與原始提供者設定合併 |
  | `plugin-sdk/provider-env-vars` | 提供者環境變數輔助工具 | 提供者驗證環境變數查詢輔助工具 |
  | `plugin-sdk/provider-model-shared` | 共用提供者模型／重播輔助工具 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共用重播政策建構器、提供者端點輔助工具，以及模型 ID 正規化輔助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共用提供者目錄輔助工具 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 提供者新手引導修補程式 | 新手引導設定輔助工具 |
  | `plugin-sdk/provider-http` | 提供者 HTTP 輔助工具 | 通用提供者 HTTP／端點能力輔助工具，包括音訊轉錄多部分表單輔助工具 |
  | `plugin-sdk/provider-web-fetch` | 提供者網頁擷取輔助工具 | 網頁擷取提供者註冊／快取輔助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | 提供者網頁搜尋設定輔助工具 | 適用於不需要外掛啟用接線之提供者的精簡網頁搜尋設定／認證資訊輔助工具 |
  | `plugin-sdk/provider-web-search-contract` | 提供者網頁搜尋合約輔助工具 | 精簡的網頁搜尋設定／認證資訊合約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及具範圍限制的認證資訊設定器／取得器 |
  | `plugin-sdk/provider-web-search` | 提供者網頁搜尋輔助工具 | 網頁搜尋提供者註冊／快取／執行階段輔助工具 |
  | `plugin-sdk/provider-tools` | 提供者工具／結構描述相容性輔助工具 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek/Gemini/OpenAI 結構描述清理與診斷 |
  | `plugin-sdk/provider-usage` | 提供者用量輔助工具 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`，以及其他提供者用量輔助工具 |
  | `plugin-sdk/provider-stream` | 提供者串流包裝器輔助工具 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器型別，以及共用 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包裝器輔助工具 |
  | `plugin-sdk/provider-transport-runtime` | 提供者傳輸輔助工具 | 原生提供者傳輸輔助工具，例如受防護的擷取、工具結果文字擷取、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
  | `plugin-sdk/keyed-async-queue` | 有序非同步佇列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共用媒體輔助工具 | 媒體擷取／轉換／儲存輔助工具、由 ffprobe 支援的影片尺寸探測，以及媒體承載資料建構器 |
  | `plugin-sdk/media-generation-runtime` | 共用媒體生成輔助工具 | 用於影像／影片／音樂生成的共用容錯移轉輔助工具、候選項選擇，以及缺少模型時的訊息 |
  | `plugin-sdk/media-understanding` | 媒體理解輔助工具 | 媒體理解提供者型別，以及面向提供者的影像／音訊輔助工具匯出 |
  | `plugin-sdk/text-runtime` | 已棄用的廣泛文字相容性匯出 | 使用 `string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 與 `logging-core` |
  | `plugin-sdk/text-chunking` | 文字分塊輔助工具 | 傳出文字分塊輔助工具 |
  | `plugin-sdk/speech` | 語音輔助工具 | 語音提供者型別，以及面向提供者的指令、登錄、驗證輔助工具與 OpenAI 相容 TTS 建構器 |
  | `plugin-sdk/speech-core` | 共用語音核心 | 語音提供者型別、登錄、指令、正規化 |
  | `plugin-sdk/realtime-transcription` | 即時轉錄輔助工具 | 提供者型別、登錄輔助工具，以及共用 WebSocket 工作階段輔助工具 |
  | `plugin-sdk/realtime-voice` | 即時語音輔助工具 | 提供者型別、登錄／解析輔助工具、橋接工作階段輔助工具、共用代理程式回話佇列、執行中工作語音控制、逐字稿／事件健康狀態、回音抑制、諮詢問題比對、強制諮詢協調、輪次脈絡追蹤、輸出活動追蹤，以及快速脈絡諮詢輔助工具 |
  | `plugin-sdk/image-generation` | 影像生成輔助工具 | 影像生成提供者型別，以及影像資產／資料 URL 輔助工具與 OpenAI 相容影像提供者建構器 |
  | `plugin-sdk/image-generation-core` | 共用影像生成核心 | 影像生成型別、容錯移轉、驗證與登錄輔助工具 |
  | `plugin-sdk/music-generation` | 音樂生成輔助工具 | 音樂生成提供者／請求／結果型別 |
  | `plugin-sdk/music-generation-core` | 共用音樂生成核心 | 音樂生成型別、容錯移轉輔助工具、提供者查詢，以及模型參照解析 |
  | `plugin-sdk/video-generation` | 影片生成輔助工具 | 影片生成提供者／請求／結果型別 |
  | `plugin-sdk/video-generation-core` | 共用影片生成核心 | 影片生成型別、容錯移轉輔助工具、提供者查詢，以及模型參照解析 |
  | `plugin-sdk/interactive-runtime` | 互動式回覆輔助工具 | 互動式回覆承載資料正規化／簡化 |
  | `plugin-sdk/channel-config-primitives` | 頻道設定基礎元件 | 精簡的頻道設定結構描述基礎元件 |
  | `plugin-sdk/channel-config-writes` | 頻道設定寫入輔助工具 | 頻道設定寫入授權輔助工具 |
  | `plugin-sdk/channel-plugin-common` | 共用頻道前置模組 | 共用頻道外掛前置模組匯出 |
  | `plugin-sdk/channel-status` | 頻道狀態輔助工具 | 共用頻道狀態快照／摘要輔助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允許清單設定輔助工具 | 允許清單設定編輯／讀取輔助工具 |
  | `plugin-sdk/group-access` | 群組存取輔助工具 | 共用群組存取決策輔助工具 |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 已棄用的相容性外觀介面 | 使用 `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | 直接私訊防護輔助工具 | 精簡的加密前防護政策輔助工具 |
  | `plugin-sdk/extension-shared` | 共用擴充功能輔助工具 | 被動頻道／狀態與環境代理輔助工具基礎元件 |
  | `plugin-sdk/webhook-targets` | 網路鉤子目標輔助工具 | 網路鉤子目標登錄與路由安裝輔助工具 |
  | `plugin-sdk/webhook-path` | 已棄用的網路鉤子路徑別名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共用網頁媒體輔助工具 | 遠端／本機媒體載入輔助工具 |
  | `plugin-sdk/zod` | 已棄用的 Zod 相容性重新匯出 | 直接從 `zod` 匯入 `zod` |
  | `plugin-sdk/memory-core` | 內附的記憶核心輔助工具 | 記憶管理器／設定／檔案／命令列介面輔助工具介面 |
  | `plugin-sdk/memory-core-engine-runtime` | 記憶引擎執行階段外觀介面 | 記憶索引／搜尋執行階段外觀介面 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 記憶嵌入登錄 | 輕量型記憶嵌入提供者登錄輔助工具 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 記憶主機基礎引擎 | 記憶主機基礎引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶主機嵌入引擎 | 記憶嵌入合約、登錄存取、本機提供者，以及通用批次／遠端輔助工具；具體遠端提供者位於各自所屬的外掛中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 記憶主機 QMD 引擎 | 記憶主機 QMD 引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 記憶主機儲存引擎 | 記憶主機儲存引擎匯出 |
  | `plugin-sdk/memory-core-host-multimodal` | 記憶主機多模態輔助工具 | 記憶主機多模態輔助工具 |
  | `plugin-sdk/memory-core-host-query` | 記憶主機查詢輔助工具 | 記憶主機查詢輔助工具 |
  | `plugin-sdk/memory-core-host-secret` | 記憶主機祕密輔助工具 | 記憶主機祕密輔助工具 |
  | `plugin-sdk/memory-core-host-events` | 已棄用的記憶事件別名 | 使用 `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | 記憶主機狀態輔助工具 | 記憶主機狀態輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 記憶主機命令列介面執行階段 | 記憶主機命令列介面執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 記憶主機核心執行階段 | 記憶主機核心執行階段輔助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 記憶主機檔案／執行階段輔助工具 | 記憶主機檔案／執行階段輔助工具 |
  | `plugin-sdk/memory-host-core` | 記憶主機核心執行階段別名 | 記憶主機核心執行階段輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-events` | 記憶主機事件日誌別名 | 記憶主機事件日誌輔助工具的供應商中立別名 |
  | `plugin-sdk/memory-host-files` | 已棄用的記憶檔案／執行階段別名 | 使用 `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | 受管理的 Markdown 輔助工具 | 適用於記憶相關外掛的共用受管理 Markdown 輔助工具 |
  | `plugin-sdk/memory-host-search` | 主動記憶搜尋外觀介面 | 延遲載入的主動記憶搜尋管理器執行階段外觀介面 |
  | `plugin-sdk/memory-host-status` | 已棄用的記憶主機狀態別名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | 測試公用工具 | 儲存庫本機的已棄用相容性彙整匯出；請使用專用的儲存庫本機測試子路徑，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 與 `plugin-sdk/test-fixtures` |
</Accordion>

  此表是常見的遷移子集，而非完整的 SDK 介面。編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；套件匯出項目則從公開子集產生。

  除了明確記錄的相容性門面之外，為內建外掛保留的輔助接縫已從公開 SDK 匯出對應表中移除，例如已淘汰的 `plugin-sdk/discord` 相容層仍予以保留，供依然直接匯入已發布 `@openclaw/discord` 套件的外部外掛使用。擁有者專屬的輔助工具位於所屬的外掛套件內；共用的主機行為則透過通用 SDK 合約提供，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

  請使用符合工作需求的最精確匯入路徑。如果找不到匯出項目，請查看 `src/plugin-sdk/` 的原始碼，或詢問維護者應由哪個通用合約負責。

  ## 目前的淘汰項目

  以下是外掛 SDK、提供者合約、執行階段介面和資訊清單中範圍較小的淘汰項目。它們目前仍可運作，但會在未來的主要版本中移除。每個項目都會將舊 API 對應至其標準替代方案。

  <AccordionGroup>
  <Accordion title="command-auth 說明建構器 -> command-status">
    **舊版（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**：簽章相同、匯出項目相同，
    只是改從範圍更精確的子路徑匯入。`command-auth`
    會以相容性存根重新匯出它們。

    ```typescript
    // 之前
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 之後
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及管控輔助工具 -> resolveInboundMentionDecision">
    **舊版**：來自 `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的
    `resolveMentionGating(params)` 和
    `resolveMentionGatingWithBypass(params)`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })`——使用單一決策
    物件，而非兩種分開的呼叫形式。

    Discord、iMessage、Matrix、MS Teams、QQ Bot、Signal、
    Telegram、WhatsApp 和 Zalo 均已採用。Slack 自有的 `app_mention`
    事件模型不使用此輔助工具。

  </Accordion>

  <Accordion title="頻道執行階段相容層與頻道動作輔助工具">
    `openclaw/plugin-sdk/channel-runtime` 是供舊版頻道外掛使用的相容層。
    新程式碼請勿匯入它；註冊執行階段物件時，請使用
    `openclaw/plugin-sdk/channel-runtime-context`。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 輔助工具，
    連同原始的頻道「動作」匯出項目，均已淘汰。請改為透過語意化的
    `presentation` 介面公開功能——頻道外掛應宣告它們會呈現的內容
    （卡片、按鈕、選擇器），而不是它們接受哪些原始動作名稱。

  </Accordion>

  <Accordion title="網頁搜尋提供者的 tool() 輔助工具 -> 外掛上的 createTool()">
    **舊版**：來自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` 工廠。

    **新版**：直接在提供者外掛上實作 `createTool(...)`。
    OpenClaw 不再需要 SDK 輔助工具來註冊工具包裝器。

  </Accordion>

  <Accordion title="純文字頻道封套 -> BodyForAgent">
    **舊版**：使用 `api.runtime.channel.reply.formatInboundEnvelope(...)`
    （以及傳入訊息物件上的 `channelEnvelope` 欄位），從傳入的頻道訊息
    建立扁平的純文字提示封套。

    **新版**：使用 `BodyForAgent` 加上結構化的使用者情境區塊。頻道外掛會將
    路由中繼資料（討論串、主題、回覆對象、表情回應）附加為型別化欄位，
    而不是將它們串接成提示字串。合成面向助理的封套時，仍支援
    `formatAgentEnvelope(...)` 輔助工具，但傳入的純文字封套正逐步淘汰。

    受影響的區域：`inbound_claim`、`message_received`，以及任何曾對舊版
    封套文字進行後處理的自訂頻道外掛。

  </Accordion>

  <Accordion title="deactivate 掛鉤 -> gateway_stop">
    **舊版**：`api.on("deactivate", handler)`。

    **新版**：`api.on("gateway_stop", handler)`。關閉清理合約相同；
    只有掛鉤名稱改變。

    ```typescript
    // 之前
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // 之後
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` 仍會以已淘汰的相容性別名連接，直到 2026-08-16
    之後移除。

  </Accordion>

  <Accordion title="subagent_spawning 掛鉤 -> 核心討論串綁定">
    **舊版**：`api.on("subagent_spawning", handler)`，並傳回
    `threadBindingReady` 或 `deliveryOrigin`。

    **新版**：讓核心透過頻道工作階段綁定配接器，準備 `thread: true`
    子代理綁定。`api.on("subagent_spawned", handler)`
    僅用於啟動後觀察。

    ```typescript
    // 之前
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // 之後
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    在外部外掛遷移期間，`subagent_spawning`、
    `PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult` 和
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` 僅作為已淘汰的
    相容性介面保留，並會在 2026-08-30 之後移除。

  </Accordion>

  <Accordion title="提供者探索型別 -> 提供者目錄型別">
    四個探索型別別名現在是目錄時代型別的薄層包裝：

    | 舊別名                    | 新型別                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    此外，還有舊版的 `ProviderCapabilities` 靜態集合——提供者外掛應使用
    `buildReplayPolicy`、`normalizeToolSchemas` 和 `wrapStreamFn`
    等明確的提供者掛鉤，而非靜態物件。

  </Accordion>

  <Accordion title="思考策略掛鉤 -> resolveThinkingProfile">
    **舊版**（`ProviderThinkingPolicy` 上的三個獨立掛鉤）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：單一 `resolveThinkingProfile(ctx)`，傳回包含標準 `id`、
    選用 `label` 和排序後層級清單的 `ProviderThinkingProfile`。
    OpenClaw 會依設定檔排名，自動降級過時的已儲存值。

    情境包含 `provider`、`modelId`、選用的合併後 `reasoning`，
    以及選用的合併後模型 `compat` 資訊。提供者外掛可使用這些目錄資訊，
    僅在已設定的請求合約支援時公開模型專屬設定檔。

    請實作一個掛鉤，而非三個。舊版掛鉤在淘汰期間仍可運作，
    但不會與設定檔結果組合。

  </Accordion>

  <Accordion title="外部驗證提供者 -> contracts.externalAuthProviders">
    **舊版**：實作外部驗證掛鉤，但未在外掛資訊清單中宣告提供者。

    **新版**：在外掛資訊清單中宣告 `contracts.externalAuthProviders`
    **並且**實作 `resolveExternalAuthProfiles(...)`。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="提供者環境變數查詢 -> setup.providers[].envVars">
    **舊版**資訊清單欄位：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新版**：將相同的環境變數查詢同步至資訊清單中的
    `setup.providers[].envVars`。這會將設定／狀態的環境中繼資料整合於一處，
    並避免僅為了回應環境變數查詢而啟動外掛執行階段。

    在淘汰期結束之前，仍會透過相容性配接器支援
    `providerAuthEnvVars`。

  </Accordion>

  <Accordion title="記憶體外掛註冊 -> registerMemoryCapability">
    **舊版**：三個獨立呼叫——`api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新版**：在記憶體狀態 API 上進行單一呼叫——
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    欄位相同，僅使用單一註冊呼叫。附加式提示與語料庫輔助工具
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）
    不受影響。

  </Accordion>

  <Accordion title="記憶體嵌入提供者 API">
    **舊版**：`api.registerMemoryEmbeddingProvider(...)` 加上
    `contracts.memoryEmbeddingProviders`。

    **新版**：`api.registerEmbeddingProvider(...)` 加上
    `contracts.embeddingProviders`。

    通用嵌入提供者合約可在記憶體以外重複使用，且是新提供者支援的路徑。
    在現有提供者遷移期間，記憶體專屬註冊 API 仍會作為已淘汰的相容性介面
    保持連接。外掛檢查會將非內建外掛的使用情況報告為相容性技術債。

  </Accordion>

  <Accordion title="子代理工作階段訊息型別重新命名">
    仍從 `src/plugins/runtime/types.ts` 匯出的兩個舊版型別別名：

    | 舊版                          | 新版                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    執行階段方法 `readSession` 已淘汰，請改用
    `getSessionMessages`。簽章相同；舊方法會轉呼叫新方法。

  </Accordion>

  <Accordion title="已移除的工作階段與逐字稿檔案 API">
    切換至 SQLite 工作階段／逐字稿後，會移除或淘汰對外掛公開作用中
    `sessions.json` 儲存區、JSONL 逐字稿路徑或工作階段檔案清單的 API。
    執行階段外掛應使用工作階段身分與 SDK 執行階段輔助工具，
    而不是解析或修改作用中的檔案。

    | 遷移中的介面 | 替代方案 |
    | ----------------- | ----------- |
    | 已棄用的 `loadSessionStore(...)`、`updateSessionStore(...)` 和 `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`、`listSessionEntries(...)`，以及資料列層級的工作階段變更操作。 |
    | 已棄用的 `resolveSessionFilePath(...)` | 工作階段識別資訊（`sessionKey`、`sessionId` 和 SDK 執行階段目標輔助函式），以及操作目前工作階段的閘道方法。 |
    | 已移除的 `saveSessionStore(...)` | 由閘道擁有的工作階段執行階段 API；外掛程式碼應透過文件記載的執行階段／情境輔助函式要求或變更工作階段狀態，而不是寫入使用中的儲存檔案。 |
    | 已移除的 `resolveSessionTranscriptPathInDir(...)` 和 `resolveAndPersistSessionFile(...)` | 工作階段識別資訊，以及操作目前工作階段的閘道方法。 |
    | `readLatestAssistantTextFromSessionTranscript(...)` | 由目前執行階段情境公開、以識別資訊為基礎的逐字稿讀取器；若外掛不在逐字稿擁有者路徑中，則使用閘道的歷程記錄／工作階段方法。 |
    | `SessionTranscriptUpdate.sessionFile` | 含有 `agentId`、`sessionKey` 和 `sessionId` 的 `SessionTranscriptUpdate.target`。 |
    | `sessionFiles` 等記憶體同步輸入 | 由主機提供、以識別資訊為基礎的逐字稿／工作階段來源；請勿為即時工作階段遍歷使用中的 JSONL 檔案。 |
    | 使用中工作階段內名為 `transcriptPath` 或 `sessionFile` 的執行階段選項 | 帶有儲存中立工作階段識別資訊的 `sessionTarget`／執行階段目標物件。 |

    舊版 JSONL 逐字稿檔案仍可有效用作匯入、封存、匯出和
    支援成品。它們不再是使用中工作階段的穩態執行階段合約。

    隨 `v2026.7.1-beta.5` 發布的官方外掛匯入了上述四個
    已棄用的輔助函式。`openclaw/plugin-sdk/session-store-runtime` 會將
    該確切橋接保留至 2026-10-12；新外掛必須使用替代方案。
    `resolveStorePath(...)` 仍是受支援的 SDK 輔助函式，不屬於
    此次棄用範圍。

    `openclaw plugins inspect --all --runtime` 會報告載入錯誤或
    診斷資訊仍參照這些已移除檔案 API 的非隨附外掛。
    `@openclaw/plugin-inspector` 諮詢掃描必須使用 `0.3.17` 或
    更新版本，讓外部套件掃描也能在發布前標記整體儲存區工作階段輔助函式、
    工作階段檔案路徑輔助函式、舊版逐字稿檔案目標，以及低階
    逐字稿輔助函式。

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **舊版**：`runtime.tasks.flow`（單數）會傳回即時任務流程
    存取器。

    **新版**：`runtime.tasks.managedFlows` 保留受管理的 TaskFlow 變更
    執行階段，供從流程建立、更新、取消或執行子任務的外掛使用。
    若外掛只需要以 DTO 為基礎的讀取，請使用 `runtime.tasks.flows`。

    ```typescript
    // 之前
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // 之後
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    於 2026-07-26 後移除。

  </Accordion>

  <Accordion title="內嵌擴充功能工廠 -> 代理程式工具結果中介軟體">
    已在上方的[如何遷移](#how-to-migrate)中說明。為求完整，亦列於此處：
    已移除且僅供內嵌執行器使用的
    `api.registerEmbeddedExtensionFactory(...)` 路徑，已由
    `api.registerAgentToolResultMiddleware(...)` 取代，並在
    `contracts.agentToolResultMiddleware` 中明確列出執行階段。
  </Accordion>

  <Accordion title="OpenClawSchemaType 別名 -> OpenClawConfig">
    從 `openclaw/plugin-sdk` 重新匯出的 `OpenClawSchemaType` 現在是
    `OpenClawConfig` 的單行別名。建議使用標準名稱。

    ```typescript
    // 之前
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 之後
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
擴充功能層級的棄用項目（位於 `extensions/` 下的隨附頻道／供應商外掛內）
會在各自的 `api.ts` 和 `runtime-api.ts` 匯出入口中追蹤。
它們不影響第三方外掛合約，因此未列於此處。如果你直接使用
隨附外掛的本機匯出入口，請在升級前閱讀該匯出入口中的
棄用註解。
</Note>

## Talk 與即時語音遷移

即時語音、電話通訊、會議和瀏覽器 Talk 程式碼共用一個由
`openclaw/plugin-sdk/realtime-voice` 匯出的 Talk 工作階段控制器。
該控制器擁有通用 Talk 事件封套、使用中的輪次狀態、擷取
狀態、輸出音訊狀態、近期事件歷程記錄，以及過期輪次拒絕機制。
供應商外掛擁有特定廠商的即時工作階段；介面外掛擁有
擷取、播放、電話通訊和會議的特殊行為。

所有隨附介面都在共用控制器上執行：瀏覽器中繼、
受管理房間移交、語音通話即時處理、語音通話串流 STT、Google
Meet 即時處理，以及原生按鍵通話。閘道會在 `hello-ok.features.events`
中公布一個即時 Talk 事件頻道：`talk.event`。

除非要實作低階轉接器或測試固定資料，否則新程式碼不應直接呼叫
`createTalkEventSequencer(...)`。請使用共用控制器，以確保
範圍限定於輪次的事件無法在沒有輪次 ID 的情況下發出、過期的 `turnEnd` /
`turnCancel` 呼叫無法清除較新的使用中輪次，且輸出音訊
生命週期事件在電話通訊、會議、瀏覽器中繼、
受管理房間移交和原生 Talk 用戶端之間保持一致。

公開 API 結構：

```typescript
// 閘道擁有的 Talk 工作階段 API。
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// 用戶端擁有的供應商工作階段 API。
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

瀏覽器擁有的 WebRTC／供應商 WebSocket 工作階段使用 `talk.client.create`，
因為瀏覽器擁有供應商協商和媒體傳輸，而閘道擁有認證資訊、指示
和工具原則。`talk.session.*` 是閘道管理的共用介面，適用於閘道中繼
即時處理、閘道中繼轉錄，以及受管理房間的原生 STT/TTS 工作階段。

將即時選擇器放在 `talk.provider` /
`talk.providers` 旁的舊版設定，應使用 `openclaw doctor --fix` 修復；
執行階段 Talk 不會將語音／TTS 供應商設定重新解讀為即時供應商設定。

支援的 `talk.session.create` 組合刻意維持精簡：

| 模式            | 傳輸       | 大腦           | 擁有者              | 備註                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | 閘道            | 透過閘道橋接的全雙工供應商音訊；工具呼叫會經由代理程式諮詢工具路由。           |
| `transcription` | `gateway-relay` | `none`          | 閘道            | 僅串流 STT；呼叫端傳送輸入音訊並接收逐字稿事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生／用戶端房間 | 按鍵通話和對講機形式的房間，由用戶端擁有擷取／播放，而閘道擁有輪次狀態。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生／用戶端房間 | 僅限管理員的房間模式，供直接執行閘道工具動作且受信任的第一方介面使用。                  |

供從較舊的 `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` 系列（皆已移除）遷移的讀者參考的方法對照表：

| 舊版                              | 新版                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` 或 `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

統一的控制詞彙也刻意保持精簡：

| 方法                            | 適用範圍                                                | 契約                                                                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`、`transcription/gateway-relay` | 將 base64 PCM 音訊區塊附加至由同一個閘道連線擁有的提供者工作階段。                                                                                                                                                         |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 開始受管理房間的使用者回合。                                                                                                                                                                                              |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 驗證過期回合後，結束目前的回合。                                                                                                                                                                                          |
| `talk.session.cancelTurn`       | 所有由閘道擁有的工作階段                                | 取消某個回合中進行中的擷取、提供者、代理程式及 TTS 工作。                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助理音訊輸出，但不一定結束使用者回合。                                                                                                                                                                                |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 在其橋接器公開的任何非同步作業完成後，完成提供者工具呼叫；若為中間輸出，請傳入 `options.willContinue`，若支援，也可傳入 `options.suppressResponse` 以避免助理再次回應。 |
| `talk.session.steer`            | 由代理程式支援的 Talk 工作階段                          | 將語音 `status`、`steer`、`cancel` 或 `followup` 控制傳送至從 Talk 工作階段解析出的進行中內嵌執行。                                                                                                                        |
| `talk.session.close`            | 所有統一工作階段                                        | 停止轉送工作階段或撤銷受管理房間的狀態，然後遺忘統一工作階段 ID。                                                                                                                                                         |

請勿為了實現此功能而在核心中引入提供者或平台的特殊處理。
核心負責 Talk 工作階段語意。提供者外掛負責廠商工作階段設定。
語音通話和 Google Meet 負責電話／會議轉接器。瀏覽器和原生
應用程式負責裝置擷取／播放的使用者體驗。

## 移除時程

| 時間                                        | 會發生的情況                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **現在**                                    | 已棄用的介面會發出執行階段警告。                                                                                                       |
| **每筆相容性記錄的 `removeAfter` 日期**     | 該特定介面可予以移除；日期一過，`pnpm plugins:boundary-report --fail-on-eligible-compat` 就會使 CI 失敗。                               |
| **下一個主要版本**                          | 尚未遷移的所有介面都會被移除；仍在使用這些介面的外掛將會失敗。                                                                         |

所有核心外掛皆已完成遷移。外部外掛應在下一個主要版本前完成遷移。
執行 `pnpm plugins:boundary-report`，查看你的外掛所使用介面中哪些
相容性記錄最接近到期。

## 暫時抑制警告

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

這是暫時性的應急措施，並非永久解決方案。

## 相關內容

- [開始使用](/zh-TW/plugins/building-plugins) - 建置你的第一個外掛
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 完整的子路徑匯入參考
- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 建置頻道外掛
- [提供者外掛](/zh-TW/plugins/sdk-provider-plugins) - 建置提供者外掛
- [外掛內部機制](/zh-TW/plugins/architecture) - 深入剖析架構
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單結構描述參考
