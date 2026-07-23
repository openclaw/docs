---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用了 api.registerEmbeddedExtensionFactory
    - 你正在將外掛更新為現代外掛架構
    - 你維護一個外部 OpenClaw 外掛
sidebarTitle: Migrate to SDK
summary: 從舊版向後相容層遷移至現代化外掛 SDK
title: 外掛 SDK 遷移
x-i18n:
    generated_at: "2026-07-22T20:05:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 81ea0665078587a699b362cde6510fdcaa1d3ac238ebda73866fd5b6eb3a8edb
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已將廣泛的向後相容層替換為現代化的外掛架構，
此架構由小型且專注的匯入項目構成。如果你的外掛早於這項
變更，本指南可協助它遷移至目前的合約。

## 變更內容

過去有數個過度開放的匯入介面，讓外掛能從單一進入點
存取幾乎所有項目：

- **`openclaw/plugin-sdk`** 和 **`openclaw/plugin-sdk/compat`** - 在建置專用 SDK
  期間，重新匯出了數十個輔助程式。這兩個根項目現已移除；
  請改為匯入有文件記載的子路徑。
- **`openclaw/plugin-sdk/infra-runtime`** - 混合系統事件、
  心跳偵測狀態、傳遞佇列、擷取／Proxy 輔助程式、檔案輔助程式、
  核准類型和無關公用程式的廣泛 barrel。
- **`openclaw/plugin-sdk/config-runtime`** - 僅為後續相容期間而保留的
  廣泛設定 barrel；直接執行階段載入／寫入輔助程式已移除。
- **`openclaw/extension-api`** - 已移除的橋接介面，曾讓外掛直接
  存取主機端輔助程式，例如內嵌代理程式執行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 已移除且僅供內嵌執行器使用的
  掛鉤，曾觀察 `tool_result` 等內嵌執行器事件。請改用代理程式
  工具結果中介軟體（請參閱[將內嵌工具結果擴充功能遷移至
  中介軟體](#how-to-migrate)）。

根 SDK、相容 barrel、擴充功能橋接介面和內嵌擴充功能工廠
均已移除。`infra-runtime` 和 `config-runtime` 僅因各自另行記錄的
後續期間而保留；新外掛應使用專用子路徑。

<Warning>
  匯入已移除根項目、相容介面或擴充功能介面的外掛將無法再
  載入。升級前請依照下方對應關係進行調整。
</Warning>

OpenClaw 不會在引入替代方案的同一項變更中，移除或重新解讀
已有文件記載的外掛行為。破壞合約的變更必須先經過相容性配接器、
診斷、文件和棄用期間。這適用於 SDK 匯入、資訊清單欄位、
設定 API、掛鉤和執行階段註冊行為。

### 原因

- **啟動緩慢** - 匯入一個輔助程式會載入數十個無關模組。
- **循環相依性** - 廣泛的重新匯出很容易形成匯入循環。
- **API 介面不明確** - 無法區分穩定匯出項目與內部匯出項目。

現在每個 `openclaw/plugin-sdk/<subpath>` 都是小型、自包含且
具有文件化合約的模組。

隨附頻道的舊版供應商便利介面也已移除 -
以頻道品牌命名的輔助程式捷徑是私有單一儲存庫的便利功能，
並非穩定的外掛合約。請改用範圍狹窄的通用 SDK 子路徑。在
隨附外掛工作區內，請將供應商擁有的輔助程式保留在該外掛自己的
`api.ts` 或 `runtime-api.ts` 中：

- Anthropic 將 Claude 專用串流輔助程式保留在自己的 `api.ts` /
  `contract-api.ts` 介面中。
- OpenAI 將供應商建構器、預設模型輔助程式和即時供應商
  建構器保留在自己的 `api.ts` 中。
- OpenRouter 將供應商建構器和上線／設定輔助程式保留在自己的
  `api.ts` 中。

## 相容性政策

外部外掛的相容性工作依下列順序進行：

1. 新增合約。
2. 透過相容性配接器維持舊行為的連接。
3. 發出診斷或警告，指明舊路徑及其替代項目。
4. 在測試中涵蓋兩條路徑。
5. 記錄棄用事項和遷移路徑。
6. 僅在已公告的遷移期間結束後移除，通常會在主要
   版本中進行。

如果某個資訊清單欄位仍可接受，請持續使用，直到文件和
診斷另有說明為止。新程式碼應優先採用有文件記載的替代項目；
現有外掛不應在一般次要版本中損壞。

### 頻道設定輸入欄位相容性

`ChannelSetupInput` 現在僅永久保留跨頻道設定封套的型別。
頻道專屬欄位則繼續在已棄用的相容層級中提供型別，讓現有外部外掛
在外掛作者將這些欄位移至外掛本機設定輸入型別期間仍可編譯。

OpenClaw 不發布主要版本。2026-07-22 進行的登錄檔全面檢查，
檢查了 426 個已發布的樹外頻道外掛，並移除了 21 個沒有讀取端的欄位。
保留的 22 個欄位各自都有已知的已發布讀取端。只要不再有已發布外掛
讀取某個欄位，就會立即刪除該欄位；隨著外掛作者遷移至外掛本機設定
輸入型別，保留集合也會縮小。

同一次全面檢查也移除了 23 個沒有已發布相依項目的舊版未宣告配接器
提升鍵。目前仍保留六個常用鍵和僅供設定使用的 `rooms` 鍵。
隨著已發布外掛宣告 `singleAccountKeysToMove`，該集合也會縮小。

共用型別沒有索引簽章。外掛擁有的鍵仍可存在於執行階段輸入物件中；
請在外掛本機交集型別中宣告它們，或透過所屬外掛的設定結構描述
縮小其型別範圍。

| `code`                                  | `owner`   | `replacement`                                                                                    | 移除條件                                                              |
| --------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `plugin-sdk-channel-setup-input-fields` | `channel` | 將 `ChannelSetupInput` 與宣告所屬頻道欄位的外掛本機型別取交集 | 當已發布外掛登錄檔全面檢查找不到讀取端時刪除該欄位                    |

舊版未宣告配接器提升層級遵循相同的讀取端驅動
政策。請宣告 `singleAccountKeysToMove`；如果外掛
不需要額外的提升鍵，也請包含空陣列，如此才能逐一淘汰共用備援中的
各個鍵。

#### 驗證讀取端

1. 使用每個 `nextCursor` 分頁瀏覽 `https://clawhub.ai/api/v1/packages?family=code-plugin&limit=100`，並保留 `categories` 包含 `channels` 的套件。
2. 從 `npm search --json --searchlimit=1000 "openclaw channel plugin"` 新增 npm 候選項目。透過 GitHub 程式碼搜尋 `openclaw/plugin-sdk/channel-setup`、`openclaw/plugin-sdk/setup` 和 `openclaw/plugin-sdk/core`，加入僅有原始碼的候選項目。
3. 解析每個候選項目的最新已發布版本。執行 `npm pack <package>@<version> --json --pack-destination <temp-dir>`、解壓縮，並檢查隨附的 `dist` JavaScript 和宣告，確認是否直接或透過解構讀取欄位。如果套件沒有 npm 版本，請下載 ClawHub 成品。
4. 記錄套件、版本、欄位或提升鍵，以及相符檔案。只有在沒有任何已發布外掛成品讀取某欄位或鍵時，才能刪除它。請讓保留欄位和鍵清單旁程式碼註解中的讀取端名稱與全面檢查結果保持同步。

這僅是原始碼／型別相容性記錄。它沒有執行階段配接器或
相容性登錄項目，因為執行階段設定輸入物件和設定
行為均未變更。

使用 `pnpm plugins:boundary-report` 稽核目前的遷移佇列：

| 旗標                                                    | 效果                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary`（或 `pnpm plugins:boundary-report:summary`） | 顯示精簡計數，而非完整詳細資料。                                               |
| `--json`                                                | 機器可讀報告。                                                                 |
| `--owner <id>`                                          | 篩選至單一外掛或相容性擁有者。                                                 |
| `--fail-on-cross-owner`                                 | 遇到跨擁有者的保留 SDK 匯入時，以非零狀態結束。                                |
| `--fail-on-eligible-compat`                             | 當已棄用相容性記錄的 `removeAfter` 日期已過時，以非零狀態結束。 |
| `--fail-on-unclassified-unused-reserved`                | 遇到未使用的保留 SDK shim 時，以非零狀態結束。                                 |

`pnpm plugins:boundary-report:ci` 會啟用全部三個失敗旗標。每筆
相容性記錄都有明確的 `removeAfter` 日期（而非含糊的“下一個
主要版本”）- 報告會依該日期將已棄用記錄分組、計算本機程式碼／文件
參照、顯示跨擁有者的保留 SDK 匯入，並摘要私有記憶體主機 SDK 橋接介面。
保留的 SDK 子路徑必須有受追蹤的擁有者使用情形；未使用的保留匯出項目
應從公開 SDK 中移除。

## 如何遷移

<Steps>
  <Step title="遷移執行階段設定載入／寫入輔助程式">
    隨附外掛應停止直接呼叫 `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。請優先使用已傳入作用中
    呼叫路徑的設定。需要目前程序快照的長期執行處理常式可以使用
    `api.runtime.config.current()`。長期執行的代理程式工具應在
    `execute` 內讀取 `ctx.getRuntimeConfig()`，如此在設定寫入前建立的
    工具仍能看到重新整理後的設定。

    設定寫入會透過交易式輔助程式進行，並採用明確的
    寫入後政策：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    當變更需要完整重新啟動閘道時，請使用
    `afterWrite: { mode: "restart", reason: "..." }`；只有在呼叫端負責後續處理，且有意停用
    重新載入規劃器時，才可使用 `afterWrite: { mode: "none", reason: "..." }`。
    變更結果包含具型別的 `followUp` 摘要，供測試和記錄使用；
    閘道仍負責套用或排程重新啟動。

    `loadConfig` 和 `writeConfigFile` 已從外掛
    執行階段移除。隨附外掛和儲存庫執行階段程式碼由
    `pnpm check:deprecated-api-usage` 和
    `pnpm check:no-runtime-action-load-config` 保護：新的正式環境外掛用法
    會直接失敗、直接設定寫入會失敗、閘道伺服器方法必須使用
    請求的執行階段快照、執行階段頻道傳送／動作／用戶端輔助程式
    必須從其邊界接收設定，而長期執行的執行階段模組
    不允許任何環境式 `loadConfig()` 呼叫。

    新外掛程式碼應避免使用廣泛的 `openclaw/plugin-sdk/config-runtime`
    barrel。請依工作需求使用範圍狹窄的子路徑：

    | 需求 | 匯入 |
    | --- | --- |
    | `OpenClawConfig` 等設定型別 | `openclaw/plugin-sdk/config-contracts` |
    | 外掛進入點設定查詢 | `api.pluginConfig` |
    | 設定合併 | 設定邊界的外掛本機邏輯 |
    | 目前執行階段快照讀取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 設定寫入 | `openclaw/plugin-sdk/config-mutation` |
    | 工作階段儲存區輔助程式 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格設定 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群組政策執行階段輔助程式 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 密鑰輸入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型／工作階段覆寫 | `openclaw/plugin-sdk/model-session-runtime` |

    隨附外掛及其測試會由掃描器防止使用廣泛的
    barrel，讓匯入和模擬維持在所需行為的本機範圍內。該
    barrel 仍為外部相容性而存在，但新程式碼不應
    依賴它。

  </Step>

  <Step title="將內嵌工具結果擴充功能遷移至中介軟體">
    隨附外掛必須將僅供內嵌執行器使用的
    `api.registerEmbeddedExtensionFactory(...)` 工具結果處理常式替換為
    不依賴執行階段的中介軟體：

    ```typescript
    // OpenClaw 執行階段工具和 Codex 執行階段動態工具（結果可能會被
    // 轉換）。Codex 原生工具結果也會轉送以供觀察，
    // 但其轉換後的輸出絕不會傳至模型：Codex
    // PostToolUse 掛鉤合約無法取代原生工具回應。
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

    已安裝的外掛也可以註冊工具結果中介軟體，但必須明確啟用，
    且所有目標執行環境都必須在
    `contracts.agentToolResultMiddleware` 中宣告。未宣告的已安裝中介軟體
    註冊會遭到拒絕。

  </Step>

  <Step title="將原生核准處理常式遷移至能力事實">
    支援核准的頻道外掛會透過
    `approvalCapability.nativeRuntime` 加上共用的執行環境情境
    登錄，公開原生核准行為：

    - 將 `approvalCapability.handler.loadRuntime(...)` 替換為
      `approvalCapability.nativeRuntime`。
    - 將核准專用的驗證／傳遞邏輯從舊版 `plugin.auth` /
      `plugin.approvals` 接線移至 `approvalCapability`。
    - `ChannelPlugin.approvals` 已從公開的
      頻道外掛合約中移除；請將傳遞／原生／轉譯欄位移至
      `approvalCapability`。
    - `plugin.auth` 僅保留供頻道登入／登出流程使用；核心不再
      從該處讀取核准驗證鉤子。
    - 透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊頻道擁有的執行環境物件
      （用戶端、權杖、Bolt 應用程式）。
    - 不要從原生核准處理常式傳送外掛擁有的重新路由通知；
      核心會依據實際傳遞結果負責已路由至其他位置的通知。
    - 將 `channelRuntime` 傳入 `createChannelManager(...)` 時，請提供
      真正的 `createPluginRuntime().channel` 介面——不接受
      不完整的虛設實作。

    如需目前的核准能力配置，請參閱[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)。

  </Step>

  <Step title="稽核 Windows 包裝程式的備援行為">
    如果你的外掛使用 `openclaw/plugin-sdk/windows-spawn`，無法解析的 Windows
    `.cmd`/`.bat` 包裝程式現在會採取封閉式失敗，除非你明確傳入
    `allowShellFallback: true`：

    ```typescript
    // 之前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 之後
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 僅針對有意接受由 shell 介導之備援的可信任相容性呼叫端
      // 設定此值。
      allowShellFallback: true,
    });
    ```

    如果你的呼叫端並非有意依賴 shell 備援，請勿設定
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
    舊介面的每個匯出項目都對應至特定的現代匯入路徑：

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

    對於主機端輔助程式，請使用注入的外掛執行環境，而不要
    直接匯入：

    ```typescript
    // 之前（已棄用的 extension-api 橋接）
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // 之後（注入的執行環境）
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    其他舊版橋接輔助程式也使用相同模式：

    | 舊匯入 | 現代等效項目 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 工作階段儲存區輔助程式 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="替換寬泛的 infra-runtime 匯入">
    `openclaw/plugin-sdk/infra-runtime` 仍因外部相容性而存在，
    但新程式碼應匯入其實際需要的聚焦介面：

    | 需求 | 匯入 |
    | --- | --- |
    | 系統事件佇列輔助程式 | `openclaw/plugin-sdk/system-event-runtime` |
    | 心跳偵測喚醒、事件與可見性輔助程式 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 清空待處理傳遞佇列 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 頻道活動遙測 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 記憶體內與持久化後端的重複資料刪除快取 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本機檔案／媒體路徑輔助程式 | `openclaw/plugin-sdk/file-access-runtime` |
    | 支援分派器的擷取 | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy 與受防護的擷取輔助程式 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 分派器政策類型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 核准請求／解決類型 | `openclaw/plugin-sdk/approval-runtime` |
    | 核准回覆承載資料與命令輔助程式 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 錯誤格式化輔助程式 | `openclaw/plugin-sdk/error-runtime` |
    | 等待傳輸就緒 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全權杖輔助程式 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界非同步工作並行處理 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 可證明不變條件的必要值斷言 | `openclaw/plugin-sdk/expect-runtime` |
    | 數值強制轉型 | `openclaw/plugin-sdk/number-runtime` |
    | 行程本機非同步鎖定 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 檔案鎖定 | `openclaw/plugin-sdk/file-lock` |

    掃描器會防止內建外掛使用 `infra-runtime`，因此儲存庫程式碼
    無法退回使用寬泛的彙總匯出。

  </Step>

  <Step title="遷移頻道路由輔助程式">
    新的頻道路由程式碼使用 `openclaw/plugin-sdk/channel-route`。較舊的
    路由鍵名稱仍保留為相容性別名：

    | 舊輔助程式 | 現代輔助程式 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    現代路由輔助程式會在原生核准、回覆抑制、輸入重複資料刪除、
    排程傳遞與工作階段路由中一致地正規化
    `{ channel, to, accountId, threadId }`。

    請勿新增使用來自
    `plugin-sdk/channel-route` 的 `ChannelMessagingAdapter.parseExplicitTarget` 或
    `resolveChannelRouteTargetWithParser(...)`——這些項目已棄用，僅為舊版
    外掛保留。新的頻道外掛應使用
    `messaging.targetResolver.resolveTarget(...)` 進行目標 ID 正規化
    與目錄查無項目時的備援；
    當核心需要提早取得對等端種類時，使用 `messaging.inferTargetChatType(...)`；
    對於供應商原生的工作階段與討論串識別資訊，則使用
    `messaging.resolveOutboundSessionRoute(...)`。

  </Step>

  <Step title="建置與測試">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## 匯入路徑參考

公開套件的匯出對應表是可匯入 SDK 子路徑的唯一事實來源。
請使用 [SDK 概覽](/zh-TW/plugins/sdk-overview)所連結的主題式 SDK 指南，
並優先選用範圍最窄且已有文件記載的公開子路徑。位於
`scripts/lib/plugin-sdk-entrypoints.json` 的編譯器清單也包含用於建置
內建外掛的私有本機項目；這些項目出現在該處並不代表它們是公開套件匯出。

此表是常見的遷移子集，而非完整的 SDK 介面。編譯器進入點清單位於
`scripts/lib/plugin-sdk-entrypoints.json`；套件匯出則由公開子集產生。

保留給內建外掛的輔助接縫已從公開 SDK 匯出對應表中淘汰，
但明確記載的相容性外觀介面除外，例如保留給仍直接匯入已發布
`@openclaw/discord` 套件之外部外掛使用的已棄用
`plugin-sdk/discord` 墊片。擁有者專用的輔助程式位於其所屬的外掛套件內；
共用主機行為則透過 `plugin-sdk/gateway-runtime`、
`plugin-sdk/security-runtime` 與注入的外掛 API 等通用 SDK 合約傳遞。

請使用與工作相符且範圍最窄的匯入。如果找不到匯出項目，
請檢查 `src/plugin-sdk/` 的原始碼，或詢問維護者應由哪個通用
合約負責。

## 已移除的相容性介面

2026 年 7 月的清理移除了根 SDK 與 compat 彙總匯出、extension API
橋接、已到期的 SDK 子路徑別名、未使用的 SDK 子路徑，以及僅供內建使用之
SDK 模組的公開匯出。內建專用模組仍可由其儲存庫擁有者透過私有本機
建置對應使用；已發布的套件無法匯入這些模組。

### 行程全域 API 供應商發布

`registerApiProvider(...)` 與 `unregisterApiProviders(...)` 已從
`openclaw/plugin-sdk/llm` 移除。它們會將 API 傳輸發布至行程全域
狀態，導致由生命週期擁有的模型執行環境必須再將其複製到每個已準備的
登錄中。

供應商外掛應透過 `api.registerProvider(...)` 註冊文字推論供應商。
建構 `ApiRegistry` 的主機擁有程式碼與測試，應直接在該登錄上
註冊，讓供應商所有權與拆卸範圍保持限於已準備的執行環境。

### 私有測試彙總匯出

`openclaw/plugin-sdk/testing` 僅供儲存庫本機使用，且排除於已發布的套件
成品之外，因此已在其 2026-07-28 `removeAfter` 日期前移除。儲存庫
測試使用 `plugin-sdk/plugin-test-runtime`、
`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、
`plugin-sdk/test-env` 與 `plugin-sdk/test-fixtures` 等聚焦子路徑。

## 遷移參考

這些對應涵蓋 2026 年 7 月移除的介面與較晚時段仍有效的棄用項目。
對應內容是遷移指引，不代表舊介面仍然可用；請查閱相容性登錄與移除
時間表以確認目前狀態。

<AccordionGroup>
  <Accordion title="command-auth 說明建構器 -> command-status">
    **舊版（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**：簽章相同，但從
    範圍較窄的子路徑匯入。`command-auth` 相容性重新匯出
    已移除。

    ```typescript
    // 之前
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 之後
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及閘控輔助程式 -> resolveInboundMentionDecision">
    **舊版**：來自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的 `resolveMentionGating(params)` 與
    `resolveMentionGatingWithBypass(params)`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })`——使用單一決策
    物件，而非兩種分離的呼叫形式。

    Discord、iMessage、Matrix、Microsoft Teams、QQ Bot、Signal、
    Telegram、WhatsApp 與 Zalo 均已採用。Slack 自有的 `app_mention`
    事件模型不使用此輔助程式。

  </Accordion>

  <Accordion title="頻道執行環境墊片與頻道動作輔助程式">
    `openclaw/plugin-sdk/channel-runtime` 已移除。請使用
    `openclaw/plugin-sdk/channel-runtime-context` 註冊執行環境
    物件。

    `openclaw/plugin-sdk/channel-actions` 中的原生訊息結構描述輔助程式，
    已與原始的 “actions” 頻道匯出一併移除。請改為透過語意化的
    `presentation` 介面公開能力——頻道外掛應宣告它們轉譯的內容
    （卡片、按鈕、選取項目），而不是它們接受哪些原始動作名稱。

  </Accordion>

  <Accordion title="網路搜尋供應商 tool() 輔助程式 -> 外掛上的 createTool()">
    **舊版**：來自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()`
    工廠。

    **新版**：直接在供應商外掛上實作 `createTool(...)`。
    OpenClaw 不再需要 SDK 輔助程式來註冊工具包裝器。

  </Accordion>

  <Accordion title="純文字頻道信封 -> BodyForAgent">
    **舊版**：使用 `api.runtime.channel.reply.formatInboundEnvelope(...)`（以及輸入訊息物件上的
    `channelEnvelope` 欄位）從輸入頻道訊息建立平面
    純文字提示信封。

    **新版**：`BodyForAgent` 加上結構化的使用者情境區塊。頻道
    外掛會將路由中繼資料（討論串、主題、回覆目標、回應）附加為
    型別化欄位，而不是將其串接到提示字串中。
    `formatAgentEnvelope(...)` 輔助程式仍支援合成的
    助理導向信封，但輸入純文字信封正逐步淘汰。

    受影響的區域：`inbound_claim`、`message_received`，以及任何曾對舊封裝文字進行後處理的自訂
    頻道外掛。

  </Accordion>

  <Accordion title="deactivate 鉤子 -> gateway_stop">
    **舊版**：`api.on("deactivate", handler)`。

    **新版**：`api.on("gateway_stop", handler)`。關閉清理
    合約相同；僅鉤子名稱變更。

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

    `deactivate` 仍會作為已棄用的相容性別名連接，直到
    2026-08-16 之後移除。

  </Accordion>

  <Accordion title="subagent_spawning 鉤子 -> 核心執行緒繫結">
    **舊版**：`api.on("subagent_spawning", handler)` 傳回
    `threadBindingReady` 或 `deliveryOrigin`。

    **新版**：讓核心透過頻道工作階段繫結轉接器準備 `thread: true` 子代理程式繫結。僅將 `api.on("subagent_spawned", handler)`
    用於啟動後觀察。

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
    `PluginHookSubagentSpawningResult` 及
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` 僅在外部外掛遷移期間保留為
    已棄用的相容性介面，並於 2026-08-30 之後移除。

  </Accordion>

  <Accordion title="提供者探索型別 -> 提供者目錄型別">
    四個探索型別別名現在是目錄時代型別的薄層包裝：

    | 舊別名                    | 新型別                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    這些別名與舊版 `ProviderCapabilities` 靜態集合已
    移除。提供者外掛
    應使用明確的提供者鉤子，例如 `buildReplayPolicy`、
    `normalizeToolSchemas` 及 `wrapStreamFn`，而非靜態物件。

  </Accordion>

  <Accordion title="思考政策鉤子 -> resolveThinkingProfile">
    **舊版**（`ProviderThinkingPolicy` 上的三個獨立鉤子）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 及
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：單一 `resolveThinkingProfile(ctx)`，傳回
    `ProviderThinkingProfile`，其中包含標準 `id`、選用的 `label`，以及
    依排名排列的層級清單。OpenClaw 會依設定檔排名，自動
    降級過時的已儲存值。

    上下文包含 `provider`、`modelId`、選用的合併 `reasoning`，
    以及選用的合併模型 `compat` 資訊。提供者外掛可以使用這些
    目錄資訊，僅在已設定的要求合約支援時公開模型專屬設定檔。

    請實作一個鉤子而非三個。舊版鉤子已移除。

  </Accordion>

  <Accordion title="外部驗證提供者 -> contracts.externalAuthProviders">
    **舊版**：實作外部驗證鉤子，但未在外掛資訊清單中宣告提供者。

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

    **新版**：將相同的環境變數查詢同步至資訊清單上的 `setup.providers[].envVars`。
    這會將設定／狀態環境中繼資料整合至同一處，
    並避免僅為回應環境變數查詢而啟動外掛執行階段。

    不再接受 `providerAuthEnvVars`。

  </Accordion>

  <Accordion title="記憶外掛註冊 -> registerMemoryCapability">
    **舊版**：三個獨立呼叫——`api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新版**：記憶狀態 API 上的一個呼叫——
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    插槽相同，僅需一次註冊呼叫。附加的提示詞與語料庫輔助函式
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）不受影響。

  </Accordion>

  <Accordion title="記憶嵌入提供者 API">
    **舊版**：`api.registerMemoryEmbeddingProvider(...)` 加上
    `contracts.memoryEmbeddingProviders`。

    **新版**：`api.registerEmbeddingProvider(...)` 加上
    `contracts.embeddingProviders`。

    通用嵌入提供者合約可在記憶功能以外重複使用，並且是新提供者
    支援的途徑。記憶專屬註冊 API 仍會作為已棄用的相容性介面連接，
    以供現有提供者遷移。外掛檢查會將非內建用法回報為相容性
    技術債。

  </Accordion>

  <Accordion title="原始頻道傳送結果 -> OutboundDeliveryResult">
    **舊版**：透過 `ChannelSendRawResult` 傳回
    `{ ok, messageId, error }`，並使用
    `createRawChannelSendResultAdapter(...)` 將其正規化。

    **新版**：傳回 `OutboundDeliveryResult` 欄位，並使用
    `createAttachedChannelResultAdapter(...)` 附加頻道。傳送失敗時應擲回例外，
    而非傳回錯誤字串。原始結果型別會持續提供，直到
    下一個外掛 SDK 主要版本。

  </Accordion>

  <Accordion title="子代理程式工作階段訊息型別重新命名">
    仍從 `src/plugins/runtime/types.ts` 匯出的兩個舊版型別別名：

    | 舊版                          | 新版                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    執行階段方法 `readSession` 已棄用，請改用
    `getSessionMessages`。簽章相同；舊方法會轉呼叫新方法。

  </Accordion>

  <Accordion title="已移除的工作階段與逐字稿檔案 API">
    改用 SQLite 工作階段／逐字稿後，會移除或棄用向外掛公開作用中
    `sessions.json` 儲存區、JSONL 逐字稿路徑或工作階段檔案清單的 API。
    執行階段外掛應使用工作階段身分與 SDK 執行階段輔助函式，
    而非解析或變更作用中檔案。

    | 遷移介面 | 替代方案 |
    | ----------------- | ----------- |
    | 已棄用的 `loadSessionStore(...)`、`updateSessionStore(...)` 及 `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`、`listSessionEntries(...)`，以及資料列層級的工作階段變更。 |
    | 已棄用的 `resolveSessionFilePath(...)` | 工作階段身分（`sessionKey`、`sessionId` 及 SDK 執行階段目標輔助函式），加上操作目前工作階段的閘道方法。 |
    | 已移除的 `saveSessionStore(...)` | 由閘道擁有的工作階段執行階段 API；外掛程式碼應透過已記載的執行階段／上下文輔助函式要求或變更工作階段狀態，而非寫入作用中儲存區檔案。 |
    | 已移除的 `resolveSessionTranscriptPathInDir(...)` 及 `resolveAndPersistSessionFile(...)` | 工作階段身分，以及操作目前工作階段的閘道方法。 |
    | `readLatestAssistantTextFromSessionTranscript(...)` | 目前執行階段上下文公開、以身分為基礎的逐字稿讀取器；若外掛位於逐字稿擁有者路徑之外，則使用閘道歷程記錄／工作階段方法。 |
    | `SessionTranscriptUpdate.sessionFile` | 搭配 `agentId`、`sessionKey` 及 `sessionId` 的 `SessionTranscriptUpdate.target`。 |
    | `sessionFiles` 等記憶同步輸入 | 主機提供、以身分為基礎的逐字稿／工作階段來源；請勿為即時工作階段搜尋作用中的 JSONL 檔案。 |
    | 作用中工作階段中名為 `transcriptPath` 或 `sessionFile` 的執行階段選項 | 攜帶與儲存方式無關之工作階段身分的 `sessionTarget`／執行階段目標物件。 |

    舊版 JSONL 逐字稿檔案仍可作為匯入、封存、匯出及
    支援成品使用。它們不再是作用中工作階段的穩態執行階段合約。

    隨 `v2026.7.1-beta.5` 發布的官方外掛匯入了上述四個
    已棄用的輔助函式。`openclaw/plugin-sdk/session-store-runtime` 會維持
    該完全相同的橋接層至 2026-10-12；新外掛必須使用替代方案。
    `resolveStorePath(...)` 仍是受支援的 SDK 輔助函式，不屬於
    此次棄用範圍。

    `openclaw plugins inspect --all --runtime` 會回報載入錯誤或診斷資訊仍參照這些已移除檔案 API 的非內建外掛。
    `@openclaw/plugin-inspector` 諮詢掃描必須使用 `0.3.17` 或
    更新版本，讓外部套件掃描也能在發布前標示整體儲存區工作階段輔助函式、
    工作階段檔案路徑輔助函式、舊版逐字稿檔案目標，以及低階
    逐字稿輔助函式。

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **舊版**：`runtime.tasks.flow`（單數）傳回即時 TaskFlow
    存取器。

    **新版**：`runtime.tasks.managedFlows` 保留受管理的 TaskFlow 變更
    執行階段，供外掛從流程中建立、更新、取消或執行子工作。
    當外掛僅需要以 DTO 為基礎的讀取時，請使用 `runtime.tasks.flows`。

    ```typescript
    // 之前
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // 之後
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    舊版別名已於 2026 年 7 月移除。

  </Accordion>

  <Accordion title="內嵌擴充功能工廠 -> 代理程式工具結果中介軟體">
    前文的[如何遷移](#how-to-migrate)已涵蓋此項。此處一併列出以求完整：
    已移除且僅供內嵌執行器使用的
    `api.registerEmbeddedExtensionFactory(...)` 路徑，已由
    `api.registerAgentToolResultMiddleware(...)` 取代，並在
    `contracts.agentToolResultMiddleware` 中提供明確的執行階段清單。
  </Accordion>

  <Accordion title="OpenClawSchemaType 別名 -> OpenClawConfig">
    `OpenClawSchemaType` 根 SDK 別名已移除。請使用標準
    `OpenClawConfig` 名稱。

    ```typescript
    // 之前
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 之後
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
    ```

  </Accordion>
</AccordionGroup>

<Note>
擴充功能層級的棄用項目（位於
`extensions/` 下的內建頻道／提供者外掛內）會在其各自的 `api.ts` 與 `runtime-api.ts`
匯出介面中追蹤。它們不影響第三方外掛合約，因此未列於
此處。若直接使用內建外掛的本機匯出介面，請在升級前閱讀
該匯出介面中的棄用註解。
</Note>

## Talk 與即時語音遷移

即時語音、電話、會議及瀏覽器 Talk 程式碼共用一個由
`openclaw/plugin-sdk/realtime-voice` 匯出的 Talk
工作階段控制器。此控制器負責通用 Talk 事件封裝、作用中的輪次狀態、擷取
狀態、輸出音訊狀態、近期事件歷程記錄，以及過時輪次拒絕。
提供者外掛負責廠商專屬的即時工作階段。瀏覽器會議外掛
使用 `openclaw/plugin-sdk/meeting-runtime` 處理工作階段、瀏覽器、音訊、節點主機、
代理程式諮詢及語音通話機制，接著實作 `MeetingPlatformAdapter`
來處理 URL 規則、DOM 指令碼、手動動作對應、字幕、建立及撥入
計畫。平台 REST API、OAuth、成品、選擇器及傳輸名稱仍保留在
外掛中。瀏覽器權限計畫會收到所要求的會議 URL，讓每個
平台只能授予其明確支援的來源。工作階段執行階段也必須在確認離開瀏覽器後，
將平台專屬的即時健康狀態正規化；
歷史逐字稿欄位可保留，但離開後字幕與音訊就緒狀態
不得維持啟用。

所有內建介面皆在共用控制器上執行：瀏覽器中繼、
受管理房間移交、語音通話即時處理、語音通話串流 STT、Google
Meet 即時處理，以及原生按住說話。閘道會在 `hello-ok.features.events` 中公告一個即時 Talk 事件
頻道：`talk.event`。

新程式碼不應直接呼叫 `createTalkEventSequencer(...)`，除非正在
實作低階配接器或測試固定裝置。請使用共用控制器，以免
在沒有回合 ID 的情況下發出回合範圍事件、過時的 `turnEnd` /
`turnCancel` 呼叫清除較新的作用中回合，並確保輸出音訊
生命週期事件在電話、會議、瀏覽器中繼、
受管理房間移交與原生 Talk 用戶端之間保持一致。

公開 API 形式：

```typescript
// Gateway-owned Talk session API.
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

// Client-owned provider session API.
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
因為瀏覽器負責供應商交涉與媒體傳輸，而
閘道負責認證資訊、指示與工具政策。`talk.session.*` 是
閘道管理的共同介面，用於閘道中繼即時處理、閘道中繼
轉錄，以及受管理房間的原生 STT／TTS 工作階段。

若舊版設定將即時選擇器置於 `talk.provider` /
`talk.providers` 旁，應使用 `openclaw doctor --fix` 修復；執行階段 Talk
不會將語音／TTS 供應商設定重新解讀為即時供應商設定。

支援的 `talk.session.create` 組合刻意維持精簡：

| 模式            | 傳輸       | 核心           | 擁有者              | 備註                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | 閘道            | 透過閘道橋接全雙工供應商音訊；工具呼叫經由代理程式諮詢工具路由。           |
| `transcription` | `gateway-relay` | `none`          | 閘道            | 僅串流 STT；呼叫端傳送輸入音訊並接收逐字稿事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生／用戶端房間 | 按鍵說話與對講機式房間，由用戶端負責擷取／播放，閘道負責回合狀態。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生／用戶端房間 | 僅限管理員的房間模式，用於直接執行閘道工具動作的受信任第一方介面。                  |

供從較舊的 `talk.realtime.*` /
`talk.transcription.*` / `talk.handoff.*` 系列遷移之讀者參考的方法對照表（均已移除）：

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

統一控制詞彙也刻意維持精簡：

| 方法                          | 適用範圍                                              | 契約                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`、`transcription/gateway-relay` | 將 base64 PCM 音訊區塊附加至由同一閘道連線擁有的供應商工作階段。                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 開始受管理房間的使用者回合。                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 驗證過時回合後結束作用中回合。                                                                                                                                                                          |
| `talk.session.cancelTurn`       | 所有由閘道擁有的工作階段                              | 取消某個回合中作用中的擷取／供應商／代理程式／TTS 工作。                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助理音訊輸出，但不一定結束使用者回合。                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 在其橋接器公開的任何非同步完成作業結束後，完成供應商工具呼叫；若為中間輸出，請傳入 `options.willContinue`，或在支援時傳入 `options.suppressResponse`，以避免再次產生助理回應。 |
| `talk.session.steer`            | 由代理程式支援的 Talk 工作階段                              | 將口述的 `status`、`steer`、`cancel` 或 `followup` 控制傳送至從 Talk 工作階段解析出的作用中嵌入式執行。                                                                                                 |
| `talk.session.close`            | 所有統一工作階段                                    | 停止中繼工作階段或撤銷受管理房間狀態，然後清除統一工作階段 ID。                                                                                                                                     |

請勿在核心中引入供應商或平台特例來實現此功能。
核心負責 Talk 工作階段語意。供應商外掛負責廠商工作階段設定。
語音通話與 Google Meet 負責電話／會議配接器。瀏覽器與原生
應用程式負責裝置擷取／播放使用者體驗。

## 移除時程

| 時間                                        | 發生事項                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **現在**                                     | 可發出警告的已棄用介面會產生執行階段警告；儲存庫防護規則會拒絕核心與隨附外掛匯入已棄用的 SDK。 |
| **每筆相容性記錄的 `removeAfter` 日期** | 該特定介面可予以移除；日期一過，`pnpm plugins:boundary-report --fail-on-eligible-compat` 就會使 CI 失敗。    |
| **下一個主要版本**                      | 任何仍未遷移的介面都會移除；仍在使用這些介面的外掛將會失敗。                                                          |

以下其餘公開 SDK 子路徑均有由登錄檔支援的移除期限。
7 月 30 日的資料列已在早期、經維護者授權的清理後移除：
未使用的子路徑已刪除、較早的相容性別名已刪除，且
僅供隨附元件使用的模組已降級為私有本機建置對應。

| `removeAfter` | 層級                               | SDK 子路徑                                                                                                                                                           |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-15`  | 較早的相容性棄用項目 | `agent-config-primitives`、`channel-logging`、`channel-secret-runtime`、`channel-streaming`、`group-access`、`inbound-reply-dispatch`、`matrix`、`text-runtime`、`zod` |
| `2026-09-01`  | 較早的相容性棄用項目 | `channel-lifecycle`、`channel-message`、`channel-reply-pipeline`、`config-runtime`、`infra-runtime`                                                                    |

所有核心外掛都已完成遷移。外部外掛應在
下一個主要版本之前完成遷移。執行 `pnpm plugins:boundary-report`，即可查看
外掛所使用介面中哪些相容性記錄最早即將到期。

## 暫時抑制警告

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

這是暫時的應急措施，不是永久解決方案。

## 相關內容

- [開始使用](/zh-TW/plugins/building-plugins) - 建置你的第一個外掛
- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 完整的子路徑匯入參考
- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 建置頻道外掛
- [供應商外掛](/zh-TW/plugins/sdk-provider-plugins) - 建置供應商外掛
- [外掛內部架構](/zh-TW/plugins/architecture) - 深入解析架構
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單結構描述參考
