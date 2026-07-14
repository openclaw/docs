---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你曾在 OpenClaw 2026.4.25 之前使用 api.registerEmbeddedExtensionFactory
    - 你正在將外掛更新為現代外掛架構
    - 你維護一個外部 OpenClaw 外掛
sidebarTitle: Migrate to SDK
summary: 從舊版向後相容層遷移至現代化外掛 SDK
title: 外掛 SDK 遷移
x-i18n:
    generated_at: "2026-07-14T13:53:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 7afd1c39e33f90c19e3e75824abb81074d0699ff0e49bb1d9d577d4e3a3e91bf
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已將廣泛的向後相容層替換為由小型、聚焦匯入所組成的現代外掛架構。如果你的外掛早於這項變更，本指南可協助它遷移至目前的合約。

## 變更內容

過去有兩個完全開放的匯入介面，讓外掛能從單一進入點存取幾乎所有內容：

- **`openclaw/plugin-sdk/compat`** - 重新匯出數十個輔助函式，以便在建置新架構期間，讓較舊的鉤子型外掛繼續運作。
- **`openclaw/plugin-sdk/infra-runtime`** - 一個廣泛的彙整模組，混合了系統事件、心跳偵測狀態、傳遞佇列、擷取／Proxy 輔助函式、檔案輔助函式、核准類型及不相關的工具。
- **`openclaw/plugin-sdk/config-runtime`** - 一個廣泛的設定彙整模組，在遷移期間仍包含已棄用的直接載入／寫入輔助函式。
- **`openclaw/extension-api`** - 一個橋接介面，讓外掛可直接存取主機端輔助函式，例如內嵌代理程式執行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 一個已移除、僅供內嵌執行器使用的鉤子，用於觀察 `tool_result` 等內嵌執行器事件。請改用代理程式工具結果中介軟體（請參閱[將內嵌工具結果擴充功能遷移至中介軟體](#how-to-migrate)）。

這些介面已**棄用**：它們目前仍可運作，但新外掛不得使用，現有外掛也應在下一個主要版本將其移除前完成遷移。`registerEmbeddedExtensionFactory` 已經移除；舊版註冊項目不再載入。

<Warning>
  向後相容層將在未來的主要版本中移除。屆時，仍從這些介面匯入的外掛將會失效。
</Warning>

OpenClaw 不會在引入替代方案的同一次變更中，移除或重新解讀已有文件記載的外掛行為。破壞合約的變更會先經過相容性配接器、診斷、文件和棄用期間。這適用於 SDK 匯入、資訊清單欄位、設定 API、鉤子及執行階段註冊行為。

### 原因

- **啟動緩慢** - 匯入一個輔助函式就會載入數十個不相關的模組。
- **循環相依性** - 廣泛的重新匯出很容易形成匯入循環。
- **API 介面不明確** - 無法分辨穩定匯出項目與內部匯出項目。

現在每個 `openclaw/plugin-sdk/<subpath>` 都是小型、自包含且具備明確文件合約的模組。

綁定通道的舊版供應商便利介面也已移除——以通道品牌命名的輔助捷徑是單一儲存庫中的私有便利功能，而非穩定的外掛合約。請改用範圍明確的通用 SDK 子路徑。在內建外掛工作區中，請將供應商擁有的輔助函式保留在該外掛自己的 `api.ts` 或 `runtime-api.ts` 中：

- Anthropic 將 Claude 專用的串流輔助函式保留在自己的 `api.ts`／`contract-api.ts` 介面中。
- OpenAI 將供應商建構器、預設模型輔助函式及即時供應商建構器保留在自己的 `api.ts` 中。
- OpenRouter 將供應商建構器及新手引導／設定輔助函式保留在自己的 `api.ts` 中。

## 相容性政策

外部外掛的相容性工作遵循以下順序：

1. 新增合約。
2. 透過相容性配接器繼續串接舊行為。
3. 發出診斷或警告，指明舊路徑及其替代方案。
4. 在測試中涵蓋兩種路徑。
5. 記錄棄用事項及遷移路徑。
6. 僅在公告的遷移期間結束後移除，通常會在主要版本中進行。

如果資訊清單欄位仍被接受，請繼續使用，直到文件和診斷另有說明。新程式碼應優先採用文件記載的替代方案；現有外掛不應在一般次要版本更新期間失效。

使用 `pnpm plugins:boundary-report` 稽核目前的遷移佇列：

| 旗標                                                    | 效果                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary`（或 `pnpm plugins:boundary-report:summary`） | 顯示精簡計數，而非完整詳細資料。                                         |
| `--json`                                                | 機器可讀報告。                                                       |
| `--owner <id>`                                          | 篩選至單一外掛或相容性擁有者。                                   |
| `--fail-on-cross-owner`                                 | 遇到跨擁有者的保留 SDK 匯入時，以非零狀態結束。                             |
| `--fail-on-eligible-compat`                             | 當已棄用相容性記錄的 `removeAfter` 日期已過時，以非零狀態結束。 |
| `--fail-on-unclassified-unused-reserved`                | 遇到未使用的保留 SDK 相容性墊片時，以非零狀態結束。                                    |

`pnpm plugins:boundary-report:ci` 會啟用全部三個失敗旗標。每筆相容性記錄都有明確的 `removeAfter` 日期（而不是模糊的「下一個主要版本」）——報告會依該日期將已棄用記錄分組、計算本機程式碼／文件參照、顯示跨擁有者的保留 SDK 匯入，並摘要私有記憶體主機 SDK 橋接介面。保留的 SDK 子路徑必須具有受追蹤的擁有者使用情況；未使用的保留匯出項目應從公用 SDK 中移除。

## 如何遷移

<Steps>
  <Step title="遷移執行階段設定載入／寫入輔助函式">
    內建外掛應停止直接呼叫 `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。請優先使用已傳入目前呼叫路徑的設定。需要目前處理程序快照的長期執行處理常式可以使用 `api.runtime.config.current()`。長期執行的代理程式工具應在 `execute` 內讀取 `ctx.getRuntimeConfig()`，如此一來，在設定寫入前建立的工具仍能看到重新整理後的設定。

    設定寫入會透過交易式輔助函式執行，並明確指定寫入後政策：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    當變更需要乾淨地重新啟動閘道時，請使用 `afterWrite: { mode: "restart", reason: "..." }`；只有在呼叫端負責後續處理，並刻意停用重新載入規劃器時，才使用 `afterWrite: { mode: "none", reason: "..." }`。變更結果包含具型別的 `followUp` 摘要，供測試和記錄使用；閘道仍負責套用或排程重新啟動。

    `loadConfig` 和 `writeConfigFile` 仍作為外部外掛的已棄用相容性輔助函式，並會使用 `runtime-config-load-write` 相容性代碼發出一次警告。內建外掛和儲存庫執行階段程式碼受 `pnpm check:deprecated-api-usage` 和 `pnpm check:no-runtime-action-load-config` 保護：新的正式環境外掛用法會直接失敗、直接設定寫入會失敗、閘道伺服器方法必須使用要求的執行階段快照、執行階段通道傳送／動作／用戶端輔助函式必須從其邊界接收設定，且長期執行的執行階段模組不允許任何環境式 `loadConfig()` 呼叫。

    新外掛程式碼應避免使用廣泛的 `openclaw/plugin-sdk/config-runtime` 彙整模組。請根據工作使用範圍明確的子路徑：

    | 需求 | 匯入 |
    | --- | --- |
    | `OpenClawConfig` 等設定類型 | `openclaw/plugin-sdk/config-contracts` |
    | 已載入設定的判定提示、外掛進入點設定查詢及設定合併 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 讀取目前的執行階段快照 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 設定寫入 | `openclaw/plugin-sdk/config-mutation` |
    | 工作階段儲存區輔助函式 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格設定 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群組政策執行階段輔助函式 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 機密輸入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型／工作階段覆寫 | `openclaw/plugin-sdk/model-session-runtime` |

    內建外掛及其測試受到掃描器防護，不得使用這個廣泛的彙整模組，因此匯入和模擬都會維持在所需行為的本機範圍內。該彙整模組仍為外部相容性而存在，但新程式碼不應依賴它。

  </Step>

  <Step title="將內嵌工具結果擴充功能遷移至中介軟體">
    內建外掛必須將僅供內嵌執行器使用的 `api.registerEmbeddedExtensionFactory(...)` 工具結果處理常式替換為不依賴執行階段的中介軟體：

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

    已安裝的外掛在明確啟用，且所有目標執行階段皆已在 `contracts.agentToolResultMiddleware` 中宣告時，也可以註冊工具結果中介軟體。未宣告的已安裝中介軟體註冊會遭到拒絕。

  </Step>

  <Step title="將原生核准處理常式遷移至能力事實">
    具備核准能力的通道外掛會透過 `approvalCapability.nativeRuntime` 及共用執行階段情境登錄，公開原生核准行為：

    - 將 `approvalCapability.handler.loadRuntime(...)` 替換為
      `approvalCapability.nativeRuntime`。
    - 將核准專用的驗證／傳遞從舊版 `plugin.auth`／`plugin.approvals` 串接方式移至 `approvalCapability`。
    - `ChannelPlugin.approvals` 已從公用通道外掛合約中移除；請將傳遞／原生／呈現欄位移至 `approvalCapability`。
    - `plugin.auth` 僅保留給通道登入／登出流程使用；核心不再從該處讀取核准驗證鉤子。
    - 透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊通道擁有的執行階段物件（用戶端、權杖、Bolt 應用程式）。
    - 不要從原生核准處理常式傳送由外掛擁有的重新路由通知；核心會根據實際傳遞結果負責處理「已路由至其他位置」通知。
    - 將 `channelRuntime` 傳入 `createChannelManager(...)` 時，請提供真正的 `createPluginRuntime().channel` 介面——不完整的虛設實作會遭到拒絕。

    目前的核准能力配置請參閱[通道外掛](/zh-TW/plugins/sdk-channel-plugins)。

  </Step>

  <Step title="稽核 Windows 包裝函式的備援行為">
    如果你的外掛使用 `openclaw/plugin-sdk/windows-spawn`，現在無法解析的 Windows `.cmd`／`.bat` 包裝函式預設會採取封閉式失敗，除非你明確傳入 `allowShellFallback: true`：

    ```typescript
    // 之前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 之後
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 僅針對刻意接受由殼層介導備援的受信任相容性呼叫端
      // 設定此項目。
      allowShellFallback: true,
    });
    ```

    如果你的呼叫端並未刻意依賴殼層備援，請勿設定 `allowShellFallback`，並改為處理擲回的錯誤。

  </Step>

  <Step title="尋找已棄用的匯入">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="替換為聚焦匯入">
    舊介面中的每個匯出項目都對應至特定的現代匯入路徑：

    ```typescript
    // 之前（已棄用的向後相容層）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 之後（現代聚焦匯入）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    對於主機端輔助函式，請使用注入的外掛執行階段，而不要直接匯入：

    ```typescript
    // 之前（已棄用的 extension-api 橋接）
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // 之後（注入的執行階段）
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    其他舊版橋接輔助函式也採用相同模式：

    | 舊匯入 | 現代等效項目 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 工作階段儲存區輔助函式 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="取代範圍寬泛的 infra-runtime 匯入">
    `openclaw/plugin-sdk/infra-runtime` 仍為外部相容性而存在，
    但新程式碼應匯入實際所需的聚焦介面：

    | 需求 | 匯入 |
    | --- | --- |
    | 系統事件佇列輔助函式 | `openclaw/plugin-sdk/system-event-runtime` |
    | 心跳偵測喚醒、事件與可見性輔助函式 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 清空待處理的傳遞佇列 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 頻道活動遙測 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 記憶體內與持久化後端支援的去重快取 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本機檔案／媒體路徑輔助函式 | `openclaw/plugin-sdk/file-access-runtime` |
    | 可感知分派器的擷取 | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy 與受防護的擷取輔助函式 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 分派器原則類型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 核准要求／解決類型 | `openclaw/plugin-sdk/approval-runtime` |
    | 核准回覆承載資料與命令輔助函式 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 錯誤格式化輔助函式 | `openclaw/plugin-sdk/error-runtime` |
    | 等待傳輸就緒 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全權杖輔助函式 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界非同步任務並行處理 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 可證明不變條件的必要值斷言 | `openclaw/plugin-sdk/expect-runtime` |
    | 數值強制轉型 | `openclaw/plugin-sdk/number-runtime` |
    | 處理程序本機非同步鎖定 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 檔案鎖定 | `openclaw/plugin-sdk/file-lock` |

    掃描器會防止內建外掛使用 `infra-runtime`，因此儲存庫程式碼
    無法退回範圍寬泛的 barrel。

  </Step>

  <Step title="遷移頻道路由輔助函式">
    新的頻道路由程式碼使用 `openclaw/plugin-sdk/channel-route`。較舊的
    路由鍵和可比較目標名稱會保留為相容性別名：

    | 舊輔助函式 | 現代輔助函式 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    現代路由輔助函式會在原生核准、回覆抑制、傳入訊息去重、
    排程傳遞和工作階段路由之間，一致地正規化 `{ channel, to, accountId, threadId }`。

    請勿新增使用 `ChannelMessagingAdapter.parseExplicitTarget`、由剖析器支援的
    已載入路由輔助函式（`parseExplicitTargetForLoadedChannel`、
    `resolveRouteTargetForLoadedChannel`），或來自 `plugin-sdk/channel-route` 的
    `resolveChannelRouteTargetWithParser(...)`，這些項目已棄用，僅為較舊的外掛保留。新的頻道
    外掛應使用 `messaging.targetResolver.resolveTarget(...)` 進行
    目標 ID 正規化和目錄未命中時的備援、
    在核心需要提早取得對等端種類時使用 `messaging.inferTargetChatType(...)`，
    並使用 `messaging.resolveOutboundSessionRoute(...)` 處理供應商原生的
    工作階段與討論串身分識別。

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
  | `plugin-sdk/core` | 頻道進入點定義／建構器的舊版整合式重新匯出 | `defineChannelPluginEntry`、`createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根設定結構描述匯出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 單一供應商進入點輔助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 專用頻道進入點定義與建構器 | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`createChannelConfigUiHints` |
  | `plugin-sdk/setup` | 共用設定精靈輔助工具 | 設定翻譯器、允許清單提示、設定狀態建構器 |
  | `plugin-sdk/setup-runtime` | 設定階段執行階段輔助工具 | `createSetupTranslator`、可安全匯入的設定修補轉接器、查詢備註輔助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委派設定代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已棄用的設定轉接器別名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 設定工具輔助工具 | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多帳號輔助工具 | 帳號清單／設定／動作閘門輔助工具 |
  | `plugin-sdk/account-id` | 帳號 ID 輔助工具 | `DEFAULT_ACCOUNT_ID`、帳號 ID 正規化 |
  | `plugin-sdk/account-resolution` | 帳號查詢輔助工具 | 帳號查詢與預設後援輔助工具 |
  | `plugin-sdk/account-helpers` | 精簡帳號輔助工具 | 帳號清單／帳號動作輔助工具 |
  | `plugin-sdk/channel-setup` | 設定精靈轉接器 | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，以及 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | 私訊配對基礎元件 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回覆前綴、輸入中狀態與來源傳遞接線 | `createChannelReplyPipeline`、`resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 設定轉接器工廠與私訊存取輔助工具 | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 設定結構描述建構器 | 僅限共用頻道設定結構描述基礎元件與泛用建構器 |
  | `plugin-sdk/bundled-channel-config-schema` | 內建設定結構描述 | 僅限 OpenClaw 維護的內建外掛；新外掛必須定義外掛本機結構描述 |
  | `plugin-sdk/channel-config-schema-legacy` | 已棄用的內建設定結構描述 | 僅為相容性別名；維護中的內建外掛請使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 指令設定輔助工具 | 指令名稱正規化、說明裁剪、重複／衝突驗證 |
  | `plugin-sdk/channel-policy` | 群組／私訊政策解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 已棄用的相容性外觀介面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | 輸入封套輔助工具 | 共用路由與封套建構器輔助工具 |
  | `plugin-sdk/channel-inbound` | 輸入接收輔助工具 | 上下文建構、格式化、根目錄、執行器、已準備的回覆分派及分派述詞 |
  | `plugin-sdk/messaging-targets` | 已棄用的目標剖析匯入路徑 | 泛用目標剖析輔助工具請使用 `plugin-sdk/channel-targets`，路由比較請使用 `plugin-sdk/channel-route`，供應商特定目標解析則使用外掛擁有的 `messaging.targetResolver`／`messaging.resolveOutboundSessionRoute` |
  | `plugin-sdk/outbound-media` | 輸出媒體輔助工具 | 共用輸出媒體載入 |
  | `plugin-sdk/outbound-send-deps` | 已棄用的相容性外觀介面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | 輸出訊息生命週期輔助工具 | 訊息轉接器、收據、持久傳送輔助工具、即時預覽／串流輔助工具、回覆選項、生命週期輔助工具、輸出身分與承載資料規劃 |
  | `plugin-sdk/channel-streaming` | 已棄用的相容性外觀介面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | 已棄用的相容性外觀介面 | 使用 `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | 討論串繫結輔助工具 | 討論串繫結生命週期與轉接器輔助工具 |
  | `plugin-sdk/agent-media-payload` | 舊版媒體承載資料輔助工具 | 適用於舊版欄位配置的代理程式媒體承載資料建構器 |
  | `plugin-sdk/channel-runtime` | 已棄用的相容性填補層 | 僅限舊版頻道執行階段工具 |
  | `plugin-sdk/channel-send-result` | 傳送結果型別 | 回覆結果型別 |
  | `plugin-sdk/runtime-store` | 持久外掛儲存空間 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 廣泛執行階段輔助工具 | 執行階段／記錄／備份／外掛安裝輔助工具 |
  | `plugin-sdk/runtime-env` | 精簡執行階段環境輔助工具 | 記錄器／執行階段環境、逾時、重試與退避輔助工具 |
  | `plugin-sdk/plugin-runtime` | 共用外掛執行階段輔助工具 | 外掛指令／掛鉤／HTTP／互動式輔助工具 |
  | `plugin-sdk/hook-runtime` | 掛鉤管線輔助工具 | 共用網路鉤子／內部掛鉤管線輔助工具 |
  | `plugin-sdk/lazy-runtime` | 延遲載入執行階段輔助工具 | `createLazyRuntimeModule`、`createLazyRuntimeMethod`、`createLazyRuntimeMethodBinder`、`createLazyRuntimeNamedExport`、`createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 程序輔助工具 | 共用執行輔助工具 |
  | `plugin-sdk/cli-runtime` | 命令列介面執行階段輔助工具 | 指令格式化、等待與版本輔助工具 |
  | `plugin-sdk/gateway-runtime` | 閘道輔助工具 | 閘道用戶端、事件迴圈就緒啟動輔助工具、公告的區域網路主機解析，以及頻道狀態修補輔助工具 |
  | `plugin-sdk/config-runtime` | 已棄用的設定相容性填補層 | 優先使用 `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot` 與 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 指令輔助工具 | 內建 Telegram 合約介面無法使用時，具穩定後援行為的 Telegram 指令驗證輔助工具 |
  | `plugin-sdk/approval-runtime` | 核准提示輔助工具 | 執行／外掛核准承載資料、核准能力／設定檔輔助工具、原生核准路由／執行階段輔助工具，以及結構化核准顯示路徑格式化 |
  | `plugin-sdk/approval-auth-runtime` | 核准授權輔助工具 | 核准者解析、同一聊天動作授權 |
  | `plugin-sdk/approval-client-runtime` | 核准用戶端輔助工具 | 原生執行核准設定檔／篩選器輔助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 核准傳遞輔助工具 | 原生核准能力／傳遞轉接器 |
  | `plugin-sdk/approval-gateway-runtime` | 核准閘道輔助工具 | 共用核准閘道解析器 |
  | `plugin-sdk/approval-reference-runtime` | 核准傳輸參照 | 適用於傳輸受限回呼的確定性持久定位器輔助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 核准轉接器輔助工具 | 適用於高頻頻道進入點的輕量原生核准轉接器載入輔助工具 |
  | `plugin-sdk/approval-handler-runtime` | 核准處理常式輔助工具 | 較廣泛的核准處理常式執行階段輔助工具；較精簡的轉接器／閘道接合面足夠時，應優先使用它們 |
  | `plugin-sdk/approval-native-runtime` | 核准目標輔助工具 | 原生核准目標／帳號繫結輔助工具 |
  | `plugin-sdk/approval-reply-runtime` | 核准回覆輔助工具 | 執行／外掛核准回覆承載資料輔助工具 |
  | `plugin-sdk/channel-runtime-context` | 頻道執行階段上下文輔助工具 | 泛用頻道執行階段上下文註冊／取得／監看輔助工具 |
  | `plugin-sdk/security-runtime` | 安全性輔助工具 | 共用信任、私訊閘門、根目錄範圍內的檔案／路徑、外部內容與機密收集輔助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 政策輔助工具 | 主機允許清單與私人網路政策輔助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 執行階段輔助工具 | 固定分派器、受防護的擷取、SSRF 政策輔助工具 |
  | `plugin-sdk/system-event-runtime` | 系統事件輔助工具 | `enqueueSystemEvent`（包括按鍵取代）、`peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | 心跳偵測輔助工具 | 心跳偵測喚醒、事件與可見性輔助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 傳遞佇列輔助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 頻道活動輔助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重複輔助工具 | 記憶體內與持久儲存支援的去重複快取 |
  | `plugin-sdk/file-access-runtime` | 檔案存取輔助工具 | 安全的本機檔案／媒體路徑輔助工具 |
  | `plugin-sdk/transport-ready-runtime` | 傳輸就緒輔助工具 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | 執行核准政策輔助工具 | `loadExecApprovals`、`resolveExecApprovalsFromFile`、`ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 有界快取輔助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 診斷閘門輔助工具 | `isDiagnosticFlagEnabled`、`isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 錯誤輔助工具 | `formatUncaughtError`、`isApprovalNotFoundError`、錯誤圖形輔助工具、`PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | 包裝的擷取／代理輔助工具 | `resolveFetch`、代理輔助工具、EnvHttpProxyAgent 選項輔助工具 |
  | `plugin-sdk/host-runtime` | 主機正規化輔助工具 | `normalizeHostname`、`normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重試輔助工具 | `RetryConfig`、`retryAsync`、政策執行器 |
  | `plugin-sdk/allow-from` | 允許清單格式化與輸入對應 | `formatAllowFromLowercase`、`mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 指令閘門與指令介面輔助工具 | `resolveControlCommandGate`、傳送者授權輔助工具、指令登錄輔助工具（包括動態引數選單格式化） |
  | `plugin-sdk/command-status` | 指令狀態／說明轉譯器 | `buildCommandsMessage`、`buildCommandsMessagePaginated`、`buildHelpMessage` |
  | `plugin-sdk/secret-input` | 機密輸入剖析 | 機密輸入輔助工具 |
  | `plugin-sdk/webhook-ingress` | 網路鉤子請求輔助工具 | 網路鉤子目標工具 |
  | `plugin-sdk/webhook-request-guards` | 網路鉤子本文防護輔助工具 | 請求本文讀取／限制輔助工具 |
  | `plugin-sdk/reply-runtime` | 共用回覆執行階段 | 輸入分派、心跳偵測、回覆規劃器、分塊 |
  | `plugin-sdk/reply-dispatch-runtime` | 精簡回覆分派輔助工具 | 完成處理、供應商分派與對話標籤輔助工具 |
  | `plugin-sdk/reply-history` | 回覆歷程輔助工具 | `createChannelHistoryWindow`；已棄用的對應輔助工具相容性匯出，例如 `buildPendingHistoryContextFromMap`、`recordPendingHistoryEntry` 與 `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回覆參照規劃 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回覆分塊輔助工具 | 文字／Markdown 分塊輔助工具 |
  | `plugin-sdk/session-store-runtime` | 工作階段儲存區輔助工具 | 具範圍的工作階段資料列輔助工具、儲存區路徑輔助工具與更新時間讀取 |
  | `plugin-sdk/state-paths` | 狀態路徑輔助工具 | 狀態與 OAuth 目錄輔助工具 |
  | `plugin-sdk/routing` | 路由／工作階段金鑰輔助工具 | `resolveAgentRoute`、`buildAgentSessionKey`、`resolveDefaultAgentBoundAccountId`、工作階段金鑰正規化輔助工具 |
  | `plugin-sdk/status-helpers` | 頻道狀態輔助工具 | 頻道／帳號狀態摘要建構器、執行階段狀態預設值、問題中繼資料輔助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目標解析器輔助工具 | 共用目標解析器輔助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字串正規化輔助工具 | 短代稱／字串正規化輔助工具 |
  | `plugin-sdk/request-url` | 請求 URL 輔助工具 | 從類請求輸入中擷取字串 URL |
  | `plugin-sdk/run-command` | 計時指令輔助工具 | 具正規化標準輸出／標準錯誤的計時指令執行器 |
  | `plugin-sdk/param-readers` | 參數讀取器 | 常用工具／命令列介面參數讀取器 |
  | `plugin-sdk/tool-payload` | 工具承載資料擷取 | 從工具結果物件中擷取正規化承載資料 |
  | `plugin-sdk/tool-send` | 工具傳送資訊擷取 | 從工具引數中擷取標準傳送目標欄位 |
  | `plugin-sdk/temp-path` | 暫存路徑輔助工具 | 共用暫存下載路徑輔助工具 |
  | `plugin-sdk/logging-core` | 記錄輔助工具 | 子系統記錄器與遮蔽輔助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格輔助工具 | Markdown 表格模式輔助工具 |
  | `plugin-sdk/reply-payload` | 訊息回覆型別 | 回覆承載資料型別 |
  | `plugin-sdk/provider-setup` | 精選本機／自行託管供應商設定輔助工具 | 自行託管供應商探索／設定輔助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 專用 OpenAI 相容自行託管供應商設定輔助工具 | 相同的自行託管供應商探索／設定輔助工具 |
  | `plugin-sdk/provider-auth-runtime` | 供應商執行階段驗證輔助工具 | 執行階段 API 金鑰解析輔助工具 |
  | `plugin-sdk/provider-auth-api-key` | 供應商 API 金鑰設定輔助工具 | API 金鑰初始設定／設定檔寫入輔助工具 |
  | `plugin-sdk/provider-auth-result` | 供應商驗證結果輔助工具 | 標準 OAuth 驗證結果建構器 |
  | `plugin-sdk/provider-selection-runtime` | 供應商選擇輔助工具 | 已設定或自動選擇供應商，以及原始供應商設定合併 |
  | `plugin-sdk/provider-env-vars` | 供應商環境變數輔助工具 | 供應商驗證環境變數查詢輔助工具 |
  | `plugin-sdk/provider-model-shared` | 共用供應商模型／重播輔助工具 | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共用重播原則建構器、供應商端點輔助工具，以及模型 ID 正規化輔助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共用供應商目錄輔助工具 | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 供應商初始設定修補程式 | 初始設定組態輔助工具 |
  | `plugin-sdk/provider-http` | 供應商 HTTP 輔助工具 | 通用供應商 HTTP／端點功能輔助工具，包括音訊轉錄多部分表單輔助工具 |
  | `plugin-sdk/provider-web-fetch` | 供應商網頁擷取輔助工具 | 網頁擷取供應商註冊／快取輔助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | 供應商網頁搜尋組態輔助工具 | 適用於不需要外掛啟用接線之供應商的精簡網頁搜尋組態／認證資訊輔助工具 |
  | `plugin-sdk/provider-web-search-contract` | 供應商網頁搜尋合約輔助工具 | 精簡的網頁搜尋組態／認證資訊合約輔助工具，例如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig`，以及具範圍限制的認證資訊設定器／取得器 |
  | `plugin-sdk/provider-web-search` | 供應商網頁搜尋輔助工具 | 網頁搜尋供應商註冊／快取／執行階段輔助工具 |
  | `plugin-sdk/provider-tools` | 供應商工具／結構描述相容性輔助工具 | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 DeepSeek／Gemini／OpenAI 結構描述清理與診斷 |
  | `plugin-sdk/provider-usage` | 供應商用量輔助工具 | `fetchClaudeUsage`、`fetchGeminiUsage`、`fetchGithubCopilotUsage`，以及其他供應商用量輔助工具 |
  | `plugin-sdk/provider-stream` | 供應商串流包裝器輔助工具 | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、串流包裝器型別，以及共用 Anthropic／Bedrock／DeepSeek V4／Google／Kilocode／Moonshot／OpenAI／OpenRouter／Z.A.I／MiniMax／Copilot 包裝器輔助工具 |
  | `plugin-sdk/provider-transport-runtime` | 供應商傳輸輔助工具 | 原生供應商傳輸輔助工具，例如受防護的擷取、工具結果文字擷取、傳輸訊息轉換，以及可寫入的傳輸事件串流 |
  | `plugin-sdk/keyed-async-queue` | 有序非同步佇列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共用媒體輔助工具 | 媒體擷取／轉換／儲存輔助工具、由 ffprobe 支援的影片尺寸探測，以及媒體承載資料建構器 |
  | `plugin-sdk/media-generation-runtime` | 共用媒體生成輔助工具 | 圖片／影片／音樂生成的共用容錯移轉輔助工具、候選項目選擇，以及缺少模型時的訊息 |
  | `plugin-sdk/media-understanding` | 媒體理解輔助工具 | 媒體理解供應商型別，以及面向供應商的圖片／音訊輔助工具匯出 |
  | `plugin-sdk/text-runtime` | 已棄用的廣泛文字相容性匯出 | 使用 `string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core` |
  | `plugin-sdk/text-chunking` | 文字分塊輔助工具 | 輸出文字與保留偏移量的範圍分塊輔助工具 |
  | `plugin-sdk/speech` | 語音輔助工具 | 語音供應商型別、面向供應商的指示詞、登錄與驗證輔助工具，以及 OpenAI 相容的 TTS 建構器 |
  | `plugin-sdk/speech-core` | 共用語音核心 | 語音供應商型別、登錄、指示詞、正規化 |
  | `plugin-sdk/realtime-transcription` | 即時轉錄輔助工具 | 供應商型別、登錄輔助工具，以及共用 WebSocket 工作階段輔助工具 |
  | `plugin-sdk/realtime-voice` | 即時語音輔助工具 | 供應商型別、登錄／解析輔助工具、橋接工作階段輔助工具、共用代理程式回話佇列、執行中工作語音控制、逐字稿／事件健康狀態、回音抑制、諮詢問題比對、強制諮詢協調、輪次情境追蹤、輸出活動追蹤，以及快速情境諮詢輔助工具 |
  | `plugin-sdk/image-generation` | 圖片生成輔助工具 | 圖片生成供應商型別、圖片資產／資料 URL 輔助工具，以及 OpenAI 相容的圖片供應商建構器 |
  | `plugin-sdk/image-generation-core` | 共用圖片生成核心 | 圖片生成型別、容錯移轉、驗證，以及登錄輔助工具 |
  | `plugin-sdk/music-generation` | 音樂生成輔助工具 | 音樂生成供應商／請求／結果型別 |
  | `plugin-sdk/music-generation-core` | 共用音樂生成核心 | 音樂生成型別、容錯移轉輔助工具、供應商查詢，以及模型參照剖析 |
  | `plugin-sdk/video-generation` | 影片生成輔助工具 | 影片生成供應商／請求／結果型別 |
  | `plugin-sdk/video-generation-core` | 共用影片生成核心 | 影片生成型別、容錯移轉輔助工具、供應商查詢，以及模型參照剖析 |
  | `plugin-sdk/interactive-runtime` | 互動式回覆輔助工具 | 互動式回覆承載資料正規化／歸約 |
  | `plugin-sdk/channel-config-primitives` | 頻道組態基礎元件 | 精簡的頻道組態結構描述基礎元件 |
  | `plugin-sdk/channel-config-writes` | 頻道組態寫入輔助工具 | 頻道組態寫入授權輔助工具 |
  | `plugin-sdk/channel-plugin-common` | 共用頻道前置內容 | 共用頻道外掛前置內容匯出 |
  | `plugin-sdk/channel-status` | 頻道狀態輔助工具 | 共用頻道狀態快照／摘要輔助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允許清單組態輔助工具 | 允許清單組態編輯／讀取輔助工具 |
  | `plugin-sdk/group-access` | 群組存取輔助工具 | 共用群組存取決策輔助工具 |
  | `plugin-sdk/direct-dm`、`plugin-sdk/direct-dm-access` | 已棄用的相容性外觀介面 | 使用 `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | 直接私訊防護輔助工具 | 精簡的加密前防護原則輔助工具 |
  | `plugin-sdk/extension-shared` | 共用擴充功能輔助工具 | 被動頻道／狀態與環境代理輔助工具基礎元件 |
  | `plugin-sdk/webhook-targets` | 網路鉤子目標輔助工具 | 網路鉤子目標登錄與路由安裝輔助工具 |
  | `plugin-sdk/webhook-path` | 已棄用的網路鉤子路徑別名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共用網頁媒體輔助工具 | 遠端／本機媒體載入輔助工具 |
  | `plugin-sdk/zod` | 已棄用的 Zod 相容性重新匯出 | 直接從 `zod` 匯入 `zod` |
  | `plugin-sdk/memory-core` | 內建記憶核心輔助工具 | 記憶管理員／組態／檔案／命令列介面輔助工具介面 |
  | `plugin-sdk/memory-core-engine-runtime` | 記憶引擎執行階段外觀介面 | 記憶索引／搜尋執行階段外觀介面 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 記憶嵌入登錄 | 輕量記憶嵌入供應商登錄輔助工具 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 記憶主機基礎引擎 | 記憶主機基礎引擎匯出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 記憶主機嵌入引擎 | 記憶嵌入合約、登錄存取、本機供應商，以及通用批次／遠端輔助工具；具體的遠端供應商位於其所屬外掛中 |
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
  | `plugin-sdk/memory-host-search` | 主動記憶搜尋外觀介面 | 延遲載入的主動記憶搜尋管理員執行階段外觀介面 |
  | `plugin-sdk/memory-host-status` | 已棄用的記憶主機狀態別名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | 測試公用程式 | 儲存庫本機的已棄用相容性彙總匯出；請使用聚焦的儲存庫本機測試子路徑，例如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

  此表是共通的遷移子集，而非完整的 SDK 介面。編譯器進入點清單位於 `scripts/lib/plugin-sdk-entrypoints.json`；
  套件匯出是從公開子集產生。

  除了明確記載的相容性外觀介面（例如保留給仍直接匯入已發布 `@openclaw/discord` 套件之外部外掛使用、已棄用的 `plugin-sdk/discord` 墊片）之外，保留的內建外掛輔助介面均已從公開 SDK
  匯出對應表中移除。特定擁有者的輔助工具位於所屬外掛套件內；共用主機行為則透過 `plugin-sdk/gateway-runtime`、
  `plugin-sdk/security-runtime` 與 `plugin-sdk/plugin-config-runtime` 等通用 SDK 合約進行。

  請使用符合工作需求且範圍最窄的匯入。如果找不到某項匯出，
  請查看 `src/plugin-sdk/` 的原始碼，或詢問維護者應由哪個通用
  合約負責。

  ## 目前的棄用項目

  外掛 SDK、提供者合約、執行階段介面與資訊清單中的較小範圍棄用項目。
  每個項目目前仍可運作，但會在未來的主要版本中移除。
  每個項目都會將舊 API 對應至其標準替代項目。

  <AccordionGroup>
  <Accordion title="command-auth 說明建構器 -> command-status">
    **舊版（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**：簽章相同、匯出相同，
    只是改從範圍較窄的子路徑匯入。`command-auth`
    會將它們重新匯出為相容性虛設介面。

    ```typescript
    // 之前
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 之後
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及閘門輔助工具 -> resolveInboundMentionDecision">
    **舊版**：來自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的 `resolveMentionGating(params)` 與
    `resolveMentionGatingWithBypass(params)`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })`——使用單一決策
    物件取代兩種分離的呼叫形式。

    Discord、iMessage、Matrix、MS Teams、QQ Bot、Signal、
    Telegram、WhatsApp 與 Zalo 均已採用。Slack 自有的 `app_mention` 事件模型不使用
    此輔助工具。

  </Accordion>

  <Accordion title="頻道執行階段墊片與頻道動作輔助工具">
    `openclaw/plugin-sdk/channel-runtime` 是供舊版
    頻道外掛使用的相容性墊片。請勿在新程式碼中匯入；請使用
    `openclaw/plugin-sdk/channel-runtime-context` 註冊執行階段
    物件。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 輔助工具會與原始 "actions" 頻道匯出一併
    棄用。請改為透過語意化的 `presentation` 介面公開功能——頻道外掛
    應宣告它們要呈現的內容（卡片、按鈕、選取項目），而不是它們接受哪些原始
    動作名稱。

  </Accordion>

  <Accordion title="網頁搜尋提供者 tool() 輔助工具 -> 外掛上的 createTool()">
    **舊版**：來自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` 工廠函式。

    **新版**：直接在提供者外掛上實作 `createTool(...)`。
    OpenClaw 不再需要使用 SDK 輔助工具註冊工具包裝函式。

  </Accordion>

  <Accordion title="純文字頻道封裝 -> BodyForAgent">
    **舊版**：使用 `api.runtime.channel.reply.formatInboundEnvelope(...)`（以及傳入訊息物件上的
    `channelEnvelope` 欄位），從傳入的頻道訊息建構扁平的
    純文字提示封裝。

    **新版**：`BodyForAgent` 加上結構化使用者情境區塊。頻道
    外掛會將路由中繼資料（討論串、主題、回覆對象、回應）附加為
    具型別欄位，而不是將其串接至提示字串中。
    `formatAgentEnvelope(...)` 輔助工具仍支援合成的
    助理端封裝，但傳入的純文字封裝正逐步淘汰。

    受影響範圍：`inbound_claim`、`message_received`，以及任何曾對
    舊封裝文字進行後處理的自訂頻道外掛。

  </Accordion>

  <Accordion title="deactivate 鉤點 -> gateway_stop">
    **舊版**：`api.on("deactivate", handler)`。

    **新版**：`api.on("gateway_stop", handler)`。關閉清理
    合約相同；只有鉤點名稱改變。

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

    `deactivate` 仍會以已棄用的相容性別名形式連接，直到
    2026-08-16 之後移除。

  </Accordion>

  <Accordion title="subagent_spawning 鉤點 -> 核心討論串繫結">
    **舊版**：`api.on("subagent_spawning", handler)`，會傳回
    `threadBindingReady` 或 `deliveryOrigin`。

    **新版**：讓核心透過頻道工作階段繫結配接器準備 `thread: true` 子代理程式繫結。
    僅將 `api.on("subagent_spawned", handler)` 用於啟動後觀察。

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

    `subagent_spawning`、`PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult` 與
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` 僅會在外部外掛遷移期間保留為
    已棄用的相容性介面，並於 2026-08-30 之後移除。

  </Accordion>

  <Accordion title="提供者探索型別 -> 提供者目錄型別">
    四個探索型別別名現在是目錄時代型別的薄包裝：

    | 舊別名                 | 新型別                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    此外還有舊版 `ProviderCapabilities` 靜態集合——提供者外掛
    應使用 `buildReplayPolicy`、
    `normalizeToolSchemas` 與 `wrapStreamFn` 等明確的提供者鉤點，而不是靜態物件。

  </Accordion>

  <Accordion title="思考原則鉤點 -> resolveThinkingProfile">
    **舊版**（`ProviderThinkingPolicy` 上三個獨立鉤點）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 與
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：單一 `resolveThinkingProfile(ctx)`，會傳回
    `ProviderThinkingProfile`，其中包含標準的 `id`、選用的 `label`，以及
    已排序的層級清單。OpenClaw 會依設定檔排名自動
    降級過時的已儲存值。

    情境包含 `provider`、`modelId`、選用的已合併 `reasoning`，
    以及選用的已合併模型 `compat` 資訊。提供者外掛只有在已設定的
    要求合約支援時，才能使用這些目錄資訊公開模型專屬的設定檔。

    請實作一個鉤點，而不是三個。舊版鉤點在棄用期間仍可運作，
    但不會與設定檔結果組合。

  </Accordion>

  <Accordion title="外部驗證提供者 -> contracts.externalAuthProviders">
    **舊版**：實作外部驗證鉤點，但未在外掛資訊清單中宣告提供者。

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

    **新版**：將相同的環境變數查詢鏡像至資訊清單上的 `setup.providers[].envVars`。
    這會將設定／狀態環境中繼資料整合至單一位置，
    並避免只為回應環境變數查詢而啟動外掛執行階段。

    在棄用期結束前，`providerAuthEnvVars` 仍會透過相容性配接器獲得支援。

  </Accordion>

  <Accordion title="記憶體外掛註冊 -> registerMemoryCapability">
    **舊版**：三個獨立呼叫——`api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新版**：記憶體狀態 API 上的一個呼叫——
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    欄位相同，只需一次註冊呼叫。累加式提示與語料庫輔助工具
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）
    不受影響。

  </Accordion>

  <Accordion title="記憶體嵌入提供者 API">
    **舊版**：`api.registerMemoryEmbeddingProvider(...)` 加上
    `contracts.memoryEmbeddingProviders`。

    **新版**：`api.registerEmbeddingProvider(...)` 加上
    `contracts.embeddingProviders`。

    通用嵌入提供者合約可在記憶體之外重複使用，
    也是新提供者受支援的路徑。在現有提供者遷移期間，
    記憶體專屬註冊 API 仍會以已棄用的相容性形式連接。
    外掛檢查會將非內建用法回報為相容性技術債。

  </Accordion>

  <Accordion title="原始頻道傳送結果 -> OutboundDeliveryResult">
    **舊版**：透過 `ChannelSendRawResult` 傳回 `{ ok, messageId, error }`，
    並使用 `createRawChannelSendResultAdapter(...)` 將其正規化。

    **新版**：傳回 `OutboundDeliveryResult` 欄位，並使用
    `createAttachedChannelResultAdapter(...)` 附加頻道。傳送失敗時應擲回例外，
    而不是傳回錯誤字串。原始結果型別會保留至下一個外掛 SDK 主要版本。

  </Accordion>

  <Accordion title="重新命名子代理程式工作階段訊息型別">
    `src/plugins/runtime/types.ts` 仍會匯出兩個舊版型別別名：

    | 舊版                           | 新版                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    執行階段方法 `readSession` 已棄用，請改用
    `getSessionMessages`。簽章相同；舊方法會轉呼叫新方法。

  </Accordion>

  <Accordion title="已移除的工作階段與逐字稿檔案 API">
    切換至 SQLite 工作階段／逐字稿後，會移除或棄用
    公開作用中 `sessions.json` 儲存區、JSONL 逐字稿路徑或工作階段檔案清單的外掛介面 API。
    執行階段外掛應使用工作階段身分與 SDK 執行階段
    輔助工具，而不是解析或修改作用中的檔案。

    | 遷移介面 | 替代項目 |
    | ----------------- | ----------- |
    | 已棄用的 `loadSessionStore(...)`、`updateSessionStore(...)` 與 `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`、`listSessionEntries(...)`，以及資料列層級的工作階段修改。 |
    | 已棄用的 `resolveSessionFilePath(...)` | 工作階段身分（`sessionKey`、`sessionId` 與 SDK 執行階段目標輔助工具），加上對目前工作階段執行操作的閘道方法。 |
    | 已移除的 `saveSessionStore(...)` | 由閘道擁有的工作階段執行階段 API；外掛程式碼應透過有文件說明的執行階段／情境輔助工具要求或修改工作階段狀態，而不是寫入作用中的儲存區檔案。 |
    | 已移除的 `resolveSessionTranscriptPathInDir(...)` 與 `resolveAndPersistSessionFile(...)` | 工作階段身分，以及對目前工作階段執行操作的閘道方法。 |
    | `readLatestAssistantTextFromSessionTranscript(...)` | 目前執行階段情境公開的身分型逐字稿讀取器；若外掛位於逐字稿擁有者路徑之外，則使用閘道歷程記錄／工作階段方法。 |
    | `SessionTranscriptUpdate.sessionFile` | 搭配 `agentId`、`sessionKey` 與 `sessionId` 的 `SessionTranscriptUpdate.target`。 |
    | `sessionFiles` 等記憶體同步輸入 | 主機提供的身分型逐字稿／工作階段來源；請勿為了即時工作階段爬梳作用中的 JSONL 檔案。 |
    | 作用中工作階段名為 `transcriptPath` 或 `sessionFile` 的執行階段選項 | 攜帶儲存區中立工作階段身分的 `sessionTarget`／執行階段目標物件。 |

    舊版 JSONL 逐字稿檔案作為匯入、封存、匯出與
    支援成品時仍然有效。它們不再是作用中工作階段的常態執行階段合約。

    隨 `v2026.7.1-beta.5` 發布的官方外掛匯入了上述四個
    已棄用的輔助函式。`openclaw/plugin-sdk/session-store-runtime` 會保留
    該完全相同的橋接至 2026-10-12；新外掛必須使用替代項目。
    `resolveStorePath(...)` 仍是受支援的 SDK 輔助函式，不屬於
    此次棄用範圍。

    `openclaw plugins inspect --all --runtime` 會回報其載入錯誤或診斷
    仍參照這些已移除檔案 API 的非內建外掛。
    `@openclaw/plugin-inspector` 諮詢掃描必須使用 `0.3.17` 或
    更新版本，讓外部套件掃描也能在發布前標示整體儲存區工作階段輔助函式、
    工作階段檔案路徑輔助函式、舊版逐字稿檔案目標，以及低階
    逐字稿輔助函式。

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **舊版**：`runtime.tasks.flow`（單數）會傳回即時的工作流程
    存取器。

    **新版**：`runtime.tasks.managedFlows` 保留受管理的 TaskFlow 變更
    執行階段，供會從流程建立、更新、取消或執行子任務的外掛使用。
    當外掛只需要以 DTO 為基礎的讀取時，請使用 `runtime.tasks.flows`。

    ```typescript
    // 之前
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // 之後
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    於 2026-07-26 後移除。

  </Accordion>

  <Accordion title="內嵌擴充套件工廠 -> 代理工具結果中介軟體">
    上方的[如何遷移](#how-to-migrate)已涵蓋此項。為求完整，仍列於此處：
    已移除且僅供內嵌執行器使用的
    `api.registerEmbeddedExtensionFactory(...)` 路徑，已由
    `api.registerAgentToolResultMiddleware(...)` 取代，並在
    `contracts.agentToolResultMiddleware` 中明確列出執行階段清單。
  </Accordion>

  <Accordion title="OpenClawSchemaType 別名 -> OpenClawConfig">
    從 `openclaw/plugin-sdk` 重新匯出的 `OpenClawSchemaType`，現在是
    `OpenClawConfig` 的單行別名。請優先使用標準名稱。

    ```typescript
    // 之前
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 之後
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
擴充套件層級的棄用項目（位於 `extensions/` 下的內建頻道／供應商外掛中）
會在各自的 `api.ts` 與 `runtime-api.ts`
匯出檔內追蹤。它們不影響第三方外掛合約，因此未列於
此處。如果你直接使用內建外掛的本機匯出檔，請在升級前閱讀
該匯出檔中的棄用註解。
</Note>

## Talk 與即時語音遷移

即時語音、電話語音、會議及瀏覽器 Talk 程式碼共用一個由
`openclaw/plugin-sdk/realtime-voice` 匯出的 Talk 工作階段控制器。
此控制器負責共用的 Talk 事件封套、作用中輪次狀態、擷取
狀態、輸出音訊狀態、近期事件歷程，以及拒絕過期輪次。
供應商外掛負責供應商特定的即時工作階段；介面外掛則負責
擷取、播放、電話語音及會議的特殊處理。

所有內建介面都使用共用控制器：瀏覽器轉送、
受管理房間交接、語音通話即時模式、語音通話串流 STT、Google
Meet 即時模式，以及原生按住說話。閘道會在 `hello-ok.features.events` 中
公告單一即時 Talk 事件頻道：`talk.event`。

除非是在實作低階轉接器或測試固定資料，否則新程式碼不應直接呼叫
`createTalkEventSequencer(...)`。請使用共用控制器，如此便無法在沒有輪次 ID 的情況下
發出輪次範圍事件、過期的 `turnEnd` /
`turnCancel` 呼叫無法清除較新的作用中輪次，且輸出音訊
生命週期事件能在電話語音、會議、瀏覽器轉送、
受管理房間交接及原生 Talk 用戶端之間保持一致。

公開 API 的形式如下：

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

由瀏覽器擁有的 WebRTC／供應商 WebSocket 工作階段使用 `talk.client.create`，
因為瀏覽器負責供應商協商與媒體傳輸，而
閘道負責認證資訊、指示與工具政策。`talk.session.*` 是
由閘道管理的共用介面，用於閘道轉送即時模式、閘道轉送
轉錄，以及受管理房間的原生 STT／TTS 工作階段。

將即時選擇器放在 `talk.provider` /
`talk.providers` 旁的舊版設定，應使用 `openclaw doctor --fix` 修復；執行階段 Talk
不會將語音／TTS 供應商設定重新解讀為即時供應商設定。

受支援的 `talk.session.create` 組合刻意保持精簡：

| 模式            | 傳輸       | 大腦           | 擁有者              | 備註                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | 閘道            | 透過閘道橋接的全雙工供應商音訊；工具呼叫會經由代理諮詢工具路由。           |
| `transcription` | `gateway-relay` | `none`          | 閘道            | 僅串流 STT；呼叫端傳送輸入音訊並接收逐字稿事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生／用戶端房間 | 按住說話與對講機式房間，其中用戶端負責擷取／播放，閘道則負責輪次狀態。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生／用戶端房間 | 僅限管理員的房間模式，供直接執行閘道工具動作的受信任第一方介面使用。                  |

供從舊版 `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` 系列（均已移除）遷移的讀者參考的方法對照表：

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

統一控制詞彙也刻意保持精簡：

| 方法                          | 適用對象                                              | 合約                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`、`transcription/gateway-relay` | 將 base64 PCM 音訊區塊附加至由同一閘道連線擁有的供應商工作階段。                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 開始受管理房間的使用者輪次。                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 通過過期輪次驗證後結束作用中輪次。                                                                                                                                                                          |
| `talk.session.cancelTurn`       | 所有由閘道擁有的工作階段                              | 取消某輪次作用中的擷取／供應商／代理／TTS 工作。                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助理音訊輸出，但不一定結束使用者輪次。                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 在其橋接所公開的任何非同步完成作業結束後，完成供應商工具呼叫；傳入 `options.willContinue` 以提供中間輸出，或在支援時傳入 `options.suppressResponse`，以避免助理再次回應。 |
| `talk.session.steer`            | 由代理支援的 Talk 工作階段                              | 將語音 `status`、`steer`、`cancel` 或 `followup` 控制傳送至從 Talk 工作階段解析出的作用中內嵌執行。                                                                                                 |
| `talk.session.close`            | 所有統一工作階段                                    | 停止轉送工作階段或撤銷受管理房間狀態，然後清除統一工作階段 ID。                                                                                                                                     |

請勿為了讓此機制運作而在核心中加入供應商或平台特例。
核心負責 Talk 工作階段語意。供應商外掛負責供應商工作階段設定。
語音通話與 Google Meet 負責電話語音／會議轉接器。瀏覽器與原生
應用程式負責裝置擷取／播放使用者體驗。

## 移除時程

| 時間                                        | 發生的情況                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **現在**                                     | 已棄用的介面會發出執行階段警告。                                                                                             |
| **每筆相容性記錄的 `removeAfter` 日期** | 該特定介面符合移除資格；日期一過，`pnpm plugins:boundary-report --fail-on-eligible-compat` 就會導致 CI 失敗。 |
| **下一個主要版本**                      | 任何仍未遷移的介面都會被移除；仍在使用這些介面的外掛將會失敗。                                                       |

所有核心外掛都已完成遷移。外部外掛應在下一個主要版本之前完成遷移。執行 `pnpm plugins:boundary-report`，即可查看你的外掛所使用介面中，哪些相容性記錄最接近到期。

## 暫時停用警告

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

這是暫時性的權宜措施，並非永久解決方案。

## 相關內容

- [開始使用](/zh-TW/plugins/building-plugins) - 建立你的第一個外掛
- [SDK 概覽](/zh-TW/plugins/sdk-overview) - 完整的子路徑匯入參考
- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 建立頻道外掛
- [提供者外掛](/zh-TW/plugins/sdk-provider-plugins) - 建立提供者外掛
- [外掛內部機制](/zh-TW/plugins/architecture) - 深入探討架構
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單結構描述參考
