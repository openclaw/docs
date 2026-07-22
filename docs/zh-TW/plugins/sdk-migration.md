---
read_when:
    - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
    - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
    - 你在 OpenClaw 2026.4.25 之前使用了 api.registerEmbeddedExtensionFactory
    - 你正在將外掛更新為現代化的外掛架構
    - 你維護一個外部 OpenClaw 外掛
sidebarTitle: Migrate to SDK
summary: 從舊版向後相容層遷移至現代外掛 SDK
title: 外掛 SDK 遷移
x-i18n:
    generated_at: "2026-07-22T10:45:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d7604638f2954714c887f963d0155ee13cbb6d4ff74cdf3664fa4dc4ab2c5a77
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw 已將廣泛的向後相容層，替換為由小型、聚焦匯入所建構的現代外掛
架構。如果你的外掛早於這項
變更，本指南可協助你遷移至目前的合約。

## 變更內容

過去有數個過度開放的匯入介面，讓外掛能從單一進入點存取幾乎所有內容：

- **`openclaw/plugin-sdk`** 和 **`openclaw/plugin-sdk/compat`** - 在建構聚焦的 SDK 期間，重新匯出了
  數十個輔助函式。這兩個根路徑現已
  移除；請改為匯入有文件記載的子路徑。
- **`openclaw/plugin-sdk/infra-runtime`** - 混合系統
  事件、心跳偵測狀態、傳遞佇列、擷取／Proxy 輔助函式、檔案輔助函式、
  核准類型和不相關工具的廣泛 barrel。
- **`openclaw/plugin-sdk/config-runtime`** - 僅為後續相容期間而保留的
  廣泛設定 barrel；直接的執行階段載入／寫入輔助函式
  已移除。
- **`openclaw/extension-api`** - 已移除的橋接介面，曾讓外掛可直接
  存取主機端輔助函式，例如嵌入式代理程式執行器。
- **`api.registerEmbeddedExtensionFactory(...)`** - 已移除且僅供嵌入式執行器使用的
  掛鉤，曾觀察 `tool_result` 等嵌入式執行器事件。請改用代理程式
  工具結果中介軟體（請參閱[將嵌入式工具結果擴充功能
  遷移至中介軟體](#how-to-migrate)）。

根 SDK、相容 barrel、擴充功能橋接介面和嵌入式擴充功能工廠
均已移除。`infra-runtime` 和 `config-runtime` 僅為其
另行記錄的後續期間而保留；新外掛應使用聚焦的子路徑。

<Warning>
  匯入已移除根路徑、相容介面或擴充功能介面的外掛將無法再
  載入。升級前請依照下方的對應關係進行調整。
</Warning>

OpenClaw 不會在引入替代方案的同一項
變更中，移除或重新解讀有文件記載的外掛行為。破壞合約的變更會先經過
相容性配接器、診斷、文件和棄用期間。這項原則
適用於 SDK 匯入、資訊清單欄位、設定 API、掛鉤和執行階段
註冊行為。

### 原因

- **啟動緩慢** - 匯入一個輔助函式會載入數十個不相關的模組。
- **循環相依性** - 廣泛的重新匯出讓匯入循環很容易
  形成。
- **API 介面不明確** - 無法區分穩定匯出項目與內部匯出項目。

現在每個 `openclaw/plugin-sdk/<subpath>` 都是小型、獨立且具有
明確合約文件的模組。

隨附頻道的舊版提供者便利介面也已移除 -
以頻道品牌命名的輔助捷徑屬於私有的單一儲存庫便利功能，而非
穩定的外掛合約。請改用範圍狹窄的通用 SDK 子路徑。在
隨附外掛工作區中，請將提供者擁有的輔助函式保留於該外掛自己的
`api.ts` 或 `runtime-api.ts`：

- Anthropic 將 Claude 專用的串流輔助函式保留於自己的 `api.ts` /
  `contract-api.ts` 介面中。
- OpenAI 將提供者建構器、預設模型輔助函式和即時提供者
  建構器保留於自己的 `api.ts` 中。
- OpenRouter 將提供者建構器和上線／設定輔助函式保留於自己的
  `api.ts` 中。

## 相容性政策

外部外掛的相容性工作遵循以下順序：

1. 新增合約。
2. 透過相容性配接器維持舊行為的連接。
3. 發出診斷或警告，指出舊路徑及其替代方案。
4. 在測試中涵蓋兩種路徑。
5. 記錄棄用和遷移路徑。
6. 僅在公告的遷移期間結束後才移除，通常是在主要
   版本中。

如果資訊清單欄位仍受接受，請繼續使用，直到文件和
診斷另有說明。新程式碼應優先採用有文件記載的替代方案；
現有外掛不應在一般次要版本中發生中斷。

### 頻道設定輸入欄位相容性

`ChannelSetupInput` 現在只永久保留跨頻道設定封套的
型別。頻道專屬欄位仍在已棄用的相容
層中保有型別，讓現有外部外掛在外掛作者將這些
欄位移至外掛本機設定輸入類型期間仍可編譯。

OpenClaw 不發布主要版本。2026-07-22 的登錄檔掃描檢查了
426 個已發布的樹外頻道外掛，並移除了 21 個沒有讀取端的欄位。
保留的 22 個欄位各自都有已知的已發布讀取端。只要沒有已發布外掛
讀取某個欄位，就會立即刪除該欄位；隨著外掛作者遷移至外掛本機
設定輸入類型，保留集合也會縮小。

同一次掃描也移除了 23 個沒有已發布相依者的舊版未宣告配接器提升鍵。
目前保留六個常用鍵和僅供設定使用的 `rooms` 鍵。
隨著已發布外掛宣告 `singleAccountKeysToMove`，該集合也會縮小。

共用類型沒有索引簽章。外掛擁有的鍵仍可出現在
執行階段輸入物件上；請在外掛本機交集類型中宣告它們，或
透過所屬外掛的設定結構描述縮限其型別。

| `code`                                  | `owner`   | `replacement`                                                                                    | 移除條件                                                     |
| --------------------------------------- | --------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `plugin-sdk-channel-setup-input-fields` | `channel` | 將 `ChannelSetupInput` 與宣告所屬頻道欄位的外掛本機類型取交集 | 當已發布外掛登錄檔掃描找不到讀取端時刪除欄位 |

舊版未宣告配接器提升層遵循相同的讀取端驅動
政策。請宣告 `singleAccountKeysToMove`；當
外掛不需要額外提升鍵時，也應包含空陣列，以便逐一淘汰共用備援中的
鍵。

這僅是原始碼／型別相容性記錄。它沒有執行階段配接器或
相容性登錄項目，因為執行階段設定輸入物件和設定
行為均未變更。

使用 `pnpm plugins:boundary-report` 稽核目前的遷移佇列：

| 旗標                                                    | 效果                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary`（或 `pnpm plugins:boundary-report:summary`） | 顯示精簡計數，而非完整詳細資料。                                         |
| `--json`                                                | 機器可讀報告。                                                       |
| `--owner <id>`                                          | 篩選為單一外掛或相容性擁有者。                                   |
| `--fail-on-cross-owner`                                 | 遇到跨擁有者的保留 SDK 匯入時，以非零狀態結束。                             |
| `--fail-on-eligible-compat`                             | 當已棄用相容性記錄的 `removeAfter` 日期已過時，以非零狀態結束。 |
| `--fail-on-unclassified-unused-reserved`                | 遇到未使用的保留 SDK 相容層時，以非零狀態結束。                                    |

`pnpm plugins:boundary-report:ci` 會啟用全部三個失敗旗標。每筆
相容性記錄都有明確的 `removeAfter` 日期（而不是含糊的「下一個
主要版本」）- 報告會依該日期將已棄用記錄分組、計算
本機程式碼／文件參照、呈現跨擁有者的保留 SDK 匯入，並
摘要私有記憶體主機 SDK 橋接介面。保留的 SDK 子路徑必須有
受追蹤的擁有者使用情況；未使用的保留匯出項目應從公開
SDK 中移除。

## 如何遷移

<Steps>
  <Step title="遷移執行階段設定載入／寫入輔助函式">
    隨附外掛應停止直接呼叫 `api.runtime.config.loadConfig()` 和
    `api.runtime.config.writeConfigFile(...)`。請優先使用已
    傳入作用中呼叫路徑的設定。需要目前處理程序快照的
    長期執行處理常式可以使用 `api.runtime.config.current()`。長期執行的
    代理程式工具應在 `execute` 內讀取 `ctx.getRuntimeConfig()`，以便在設定寫入前
    建立的工具仍可看見重新整理後的設定。

    設定寫入會透過具有明確寫入後政策的交易式
    輔助函式執行：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    當變更需要乾淨地重新啟動閘道時，請使用 `afterWrite: { mode: "restart", reason: "..." }`；
    只有在呼叫端負責後續處理，並刻意抑制
    重新載入規劃器時，才使用 `afterWrite: { mode: "none", reason: "..." }`。
    變更結果包含具型別的 `followUp` 摘要，可供
    測試和記錄使用；閘道仍負責套用或
    排程重新啟動。

    `loadConfig` 和 `writeConfigFile` 已從外掛
    執行階段中移除。隨附外掛和儲存庫執行階段程式碼受
    `pnpm check:deprecated-api-usage` 和
    `pnpm check:no-runtime-action-load-config` 保護：新的正式環境外掛用法
    會直接失敗、直接設定寫入會失敗、閘道伺服器方法必須使用
    請求的執行階段快照、執行階段頻道傳送／動作／用戶端輔助函式
    必須從其邊界接收設定，而長期執行的執行階段模組
    不允許任何環境式 `loadConfig()` 呼叫。

    新外掛程式碼應避免使用廣泛的 `openclaw/plugin-sdk/config-runtime`
    barrel。請根據工作使用範圍狹窄的子路徑：

    | 需求 | 匯入 |
    | --- | --- |
    | `OpenClawConfig` 等設定類型 | `openclaw/plugin-sdk/config-contracts` |
    | 外掛進入點設定查詢 | `api.pluginConfig` |
    | 設定合併 | 設定邊界的外掛本機邏輯 |
    | 目前執行階段快照讀取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 設定寫入 | `openclaw/plugin-sdk/config-mutation` |
    | 工作階段儲存區輔助函式 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格設定 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群組政策執行階段輔助函式 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 密鑰輸入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型／工作階段覆寫 | `openclaw/plugin-sdk/model-session-runtime` |

    隨附外掛及其測試會由掃描器防止使用廣泛
    barrel，讓匯入和模擬維持在所需行為的本機範圍內。該
    barrel 仍為外部相容性而存在，但新程式碼不應
    依賴它。

  </Step>

  <Step title="將嵌入式工具結果擴充功能遷移至中介軟體">
    隨附外掛必須將僅供嵌入式執行器使用的
    `api.registerEmbeddedExtensionFactory(...)` 工具結果處理常式替換為
    不依賴執行階段的中介軟體：

    ```typescript
    // OpenClaw 執行階段工具和 Codex 執行階段動態工具（結果可能會
    // 經過轉換）。Codex 原生工具結果也會轉送以供觀察，
    // 但其轉換後的輸出永遠不會傳送至模型：Codex
    // PostToolUse 掛鉤合約無法替換原生工具回應。
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

    已安裝的外掛在明確啟用，且每個目標執行階段都已於
    `contracts.agentToolResultMiddleware` 中宣告時，也可以註冊工具結果中介軟體。
    未宣告的已安裝中介軟體
    註冊會被拒絕。

  </Step>

  <Step title="將原生核准處理常式遷移至能力事實">
    支援核准的頻道外掛透過
    `approvalCapability.nativeRuntime` 加上共用執行階段情境
    登錄檔公開原生核准行為：

    - 將 `approvalCapability.handler.loadRuntime(...)` 替換為
      `approvalCapability.nativeRuntime`。
    - 將核准專用的驗證／傳遞從舊版 `plugin.auth` /
      `plugin.approvals` 接線移至 `approvalCapability`。
    - `ChannelPlugin.approvals` 已從公開的
      頻道外掛合約中移除；請將傳遞／原生／轉譯欄位移至
      `approvalCapability`。
    - `plugin.auth` 僅保留供頻道登入／登出流程使用；核心不再
      從中讀取核准驗證掛鉤。
    - 透過 `openclaw/plugin-sdk/channel-runtime-context` 註冊頻道擁有的執行階段物件（用戶端、權杖、Bolt 應用程式）。
    - 請勿從原生核准處理常式傳送外掛擁有的重新路由通知；
      核心會根據實際傳遞結果負責已路由至其他位置的通知。
    - 將 `channelRuntime` 傳入 `createChannelManager(...)` 時，請提供
      真正的 `createPluginRuntime().channel` 介面——不接受部分虛設實作。

    如需目前的核准能力配置，請參閱[頻道外掛](/zh-TW/plugins/sdk-channel-plugins)。

  </Step>

  <Step title="稽核 Windows 包裝函式的備援行為">
    如果你的外掛使用 `openclaw/plugin-sdk/windows-spawn`，無法解析的 Windows
    `.cmd`/`.bat` 包裝函式現在會以關閉方式失敗，除非你明確傳入
    `allowShellFallback: true`：

    ```typescript
    // 之前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 之後
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 僅供刻意接受由 shell 中介備援的可信任相容性呼叫端
      // 設定此項目。
      allowShellFallback: true,
    });
    ```

    如果你的呼叫端並非刻意依賴 shell 備援，請勿設定
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
    // 之前（已棄用的向下相容層）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 之後（現代的聚焦匯入）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    對於主機端輔助函式，請使用注入的外掛執行階段，而非
    直接匯入：

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

  <Step title="替換廣泛的 infra-runtime 匯入">
    `openclaw/plugin-sdk/infra-runtime` 仍為外部相容性而保留，
    但新程式碼應匯入其實際需要的聚焦介面：

    | 需求 | 匯入 |
    | --- | --- |
    | 系統事件佇列輔助函式 | `openclaw/plugin-sdk/system-event-runtime` |
    | 心跳偵測喚醒、事件及可見性輔助函式 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 清空待處理傳遞佇列 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 頻道活動遙測 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 記憶體內及由持久儲存支援的去重快取 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本機檔案／媒體路徑輔助函式 | `openclaw/plugin-sdk/file-access-runtime` |
    | 支援分派器的擷取 | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy 與受防護的擷取輔助函式 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 分派器原則型別 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 核准要求／解決型別 | `openclaw/plugin-sdk/approval-runtime` |
    | 核准回覆承載資料與命令輔助函式 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 錯誤格式化輔助函式 | `openclaw/plugin-sdk/error-runtime` |
    | 等待傳輸就緒 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全權杖輔助函式 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界非同步工作並行處理 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 用於可證明不變條件的必要值斷言 | `openclaw/plugin-sdk/expect-runtime` |
    | 數值強制轉型 | `openclaw/plugin-sdk/number-runtime` |
    | 行程本機非同步鎖定 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 檔案鎖定 | `openclaw/plugin-sdk/file-lock` |

    掃描器會防止隨附外掛使用 `infra-runtime`，因此儲存庫程式碼
    無法退回使用廣泛的 barrel。

  </Step>

  <Step title="遷移頻道路由輔助函式">
    新的頻道路由程式碼使用 `openclaw/plugin-sdk/channel-route`。較舊的
    路由鍵名稱仍作為相容性別名保留：

    | 舊輔助函式 | 現代輔助函式 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |

    現代路由輔助函式會在原生核准、回覆抑制、輸入去重、
    排程傳遞及工作階段路由之間，一致地正規化 `{ channel, to, accountId, threadId }`。

    請勿新增使用來自
    `plugin-sdk/channel-route` 的 `ChannelMessagingAdapter.parseExplicitTarget` 或
    `resolveChannelRouteTargetWithParser(...)`——這些項目已棄用，僅為較舊的
    外掛保留。新的頻道外掛應使用
    `messaging.targetResolver.resolveTarget(...)` 進行目標 ID 正規化
    及目錄查找失敗時的備援、
    在核心需要提早判定對等端種類時使用 `messaging.inferTargetChatType(...)`，
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

公開套件匯出對應表是可匯入 SDK 子路徑的唯一事實來源。
請使用從 [SDK 概觀](/zh-TW/plugins/sdk-overview)連結的主題式 SDK 指南，
並優先選用最聚焦且有文件記載的公開子路徑。`scripts/lib/plugin-sdk-entrypoints.json`
中的編譯器清單也包含用於建置隨附外掛的私有本機項目；
這些項目出現在該處並不代表它們是公開套件匯出項目。

此表是常見的遷移子集，而非完整的 SDK 介面。編譯器進入點清單位於
`scripts/lib/plugin-sdk-entrypoints.json`；套件匯出項目由公開子集產生。

保留給隨附外掛的輔助介面已從公開 SDK 匯出對應表中淘汰，
但明確記載的相容性外觀除外，例如已棄用的 `plugin-sdk/discord`
相容層；該相容層是為仍直接匯入已發布 `@openclaw/discord` 套件的外部外掛而保留。
擁有者專屬的輔助函式位於其所屬的外掛套件內；共用的主機行為則透過
`plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 等通用 SDK 合約
及注入的外掛 API 傳遞。

請使用與工作相符的最聚焦匯入。如果找不到匯出項目，
請檢查 `src/plugin-sdk/` 的原始碼，或詢問維護者應由哪個通用
合約負責該項目。

## 已移除的相容性介面

2026 年 7 月的清理移除了根 SDK 與 compat barrel、extension API
橋接、已過期的 SDK 子路徑別名、未使用的 SDK 子路徑，以及
僅供隨附外掛使用之 SDK 模組的公開匯出項目。僅供隨附外掛使用的模組，
其儲存庫擁有者仍可透過私有本機建置對應使用；但無法從已發布的套件匯入。

### 行程全域 API 供應商發布

`registerApiProvider(...)` 與 `unregisterApiProviders(...)` 已從
`openclaw/plugin-sdk/llm` 移除。它們會將 API 傳輸發布至行程全域
狀態，導致由生命週期管理的模型執行階段之後必須將其複製到每個備妥的
登錄中。

供應商外掛應透過 `api.registerProvider(...)` 註冊文字推論供應商。
建構 `ApiRegistry` 的主機擁有程式碼與測試應直接在該登錄上註冊，
使供應商所有權與拆卸作業維持在備妥執行階段的範圍內。

### 私有測試 barrel

`openclaw/plugin-sdk/testing` 僅供儲存庫本機使用，且已排除於發布的套件
成品之外，因此已在其 2026-07-28 `removeAfter` 日期之前移除。儲存庫
測試會使用 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、
`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 及 `plugin-sdk/test-fixtures`
等聚焦子路徑。

## 遷移參考

這些對應涵蓋 2026 年 7 月已移除的介面，以及具有較晚期限且仍處於有效棄用期的介面。
對應是遷移指引，並不表示舊介面仍然可用；請查閱相容性登錄與移除
時間表，以確認目前狀態。

<AccordionGroup>
  <Accordion title="command-auth 說明建構函式 -> command-status">
    **舊版（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、
    `buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**：簽章相同，但改從
    更聚焦的子路徑匯入。`command-auth` 相容性重新匯出項目
    已移除。

    ```typescript
    // 之前
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 之後
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及閘控輔助函式 -> resolveInboundMentionDecision">
    **舊版**：來自
    `openclaw/plugin-sdk/channel-inbound` 或
    `openclaw/plugin-sdk/channel-mention-gating` 的 `resolveMentionGating(params)` 與
    `resolveMentionGatingWithBypass(params)`。

    **新版**：`resolveInboundMentionDecision({ facts, policy })`——使用單一決策
    物件，而非兩種分開的呼叫形式。

    已在 Discord、iMessage、Matrix、MS Teams、QQ Bot、Signal、
    Telegram、WhatsApp 及 Zalo 中採用。Slack 自有的 `app_mention` 事件模型
    不使用此輔助函式。

  </Accordion>

  <Accordion title="頻道執行階段相容層與頻道動作輔助函式">
    `openclaw/plugin-sdk/channel-runtime` 已移除。請使用
    `openclaw/plugin-sdk/channel-runtime-context` 註冊執行階段
    物件。

    `openclaw/plugin-sdk/channel-actions` 中的原生訊息結構描述輔助函式
    已與原始的 "actions" 頻道匯出項目一併移除。請改為透過語意化的
    `presentation` 介面公開能力——頻道外掛應宣告其轉譯的內容
    （卡片、按鈕、選取項目），而非其接受哪些原始動作名稱。

  </Accordion>

  <Accordion title="網頁搜尋供應商 tool() 輔助函式 -> 外掛上的 createTool()">
    **舊版**：來自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()`
    工廠函式。

    **新版**：直接在供應商外掛上實作 `createTool(...)`。
    OpenClaw 不再需要 SDK 輔助函式來註冊工具包裝函式。

  </Accordion>

  <Accordion title="純文字頻道信封 -> BodyForAgent">
    **舊版**：使用 `api.runtime.channel.reply.formatInboundEnvelope(...)`（以及輸入訊息物件上的
    `channelEnvelope` 欄位），從輸入頻道訊息建構扁平的
    純文字提示詞信封。

    **新版**：`BodyForAgent` 加上結構化使用者情境區塊。頻道
    外掛會將路由中繼資料（討論串、主題、回覆目標、回應）附加為
    具型別欄位，而非將其串接至提示詞字串。`formatAgentEnvelope(...)`
    輔助函式仍支援合成的
    助理導向信封，但輸入純文字信封即將淘汰。

    受影響的區域：`inbound_claim`、`message_received`，以及任何
    對舊信封文字進行後處理的自訂頻道外掛。

  </Accordion>

  <Accordion title="deactivate 掛鉤 -> gateway_stop">
    **舊版**：`api.on("deactivate", handler)`。

    **新版**：`api.on("gateway_stop", handler)`。關閉清理
    合約相同；僅變更掛鉤名稱。

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

    `deactivate` 仍作為已棄用的相容性別名連接，直到
    2026-08-16 後移除。

  </Accordion>

  <Accordion title="subagent_spawning 鉤子 -> 核心執行緒繫結">
    **舊版**：`api.on("subagent_spawning", handler)` 回傳
    `threadBindingReady` 或 `deliveryOrigin`。

    **新版**：讓核心透過頻道工作階段繫結配接器準備 `thread: true` 子代理繫結。僅將 `api.on("subagent_spawned", handler)`
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

    在外部外掛遷移期間，`subagent_spawning`、`PluginHookSubagentSpawningEvent`、
    `PluginHookSubagentSpawningResult` 和
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` 僅保留為已棄用的相容性介面，
    並將於 2026-08-30 後移除。

  </Accordion>

  <Accordion title="供應商探索型別 -> 供應商目錄型別">
    四個探索型別別名現在是目錄時代型別的薄包裝：

    | 舊別名                 | 新型別                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    這些別名與舊版 `ProviderCapabilities` 靜態容器已移除。供應商外掛
    應使用明確的供應商鉤子，例如 `buildReplayPolicy`、
    `normalizeToolSchemas` 和 `wrapStreamFn`，而非靜態物件。

  </Accordion>

  <Accordion title="思考政策鉤子 -> resolveThinkingProfile">
    **舊版**（`ProviderThinkingPolicy` 上的三個獨立鉤子）：
    `isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和
    `resolveDefaultThinkingLevel(ctx)`。

    **新版**：單一 `resolveThinkingProfile(ctx)`，其回傳包含標準 `id`、選用 `label` 與分級層級清單的
    `ProviderThinkingProfile`。OpenClaw 會依設定檔排名自動降級過時的已儲存值。

    上下文包含 `provider`、`modelId`、選用的合併後 `reasoning`，
    以及選用的合併後模型 `compat` 事實。僅當已設定的要求合約支援時，供應商外掛才能使用這些
    目錄事實公開模型專屬設定檔。

    實作一個鉤子，而非三個。舊版鉤子已移除。

  </Accordion>

  <Accordion title="外部驗證供應商 -> contracts.externalAuthProviders">
    **舊版**：實作外部驗證鉤子，但未在外掛資訊清單中宣告供應商。

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

  <Accordion title="供應商環境變數查詢 -> setup.providers[].envVars">
    **舊版**資訊清單欄位：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新版**：將相同的環境變數查詢映射至資訊清單上的 `setup.providers[].envVars`。
    這會將設定／狀態環境中繼資料整合至單一位置，
    並避免只為回答環境變數查詢而啟動外掛執行階段。

    不再接受 `providerAuthEnvVars`。

  </Accordion>

  <Accordion title="記憶體外掛註冊 -> registerMemoryCapability">
    **舊版**：三個獨立呼叫——`api.registerMemoryPromptSection(...)`、
    `api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新版**：記憶體狀態 API 上的一個呼叫——
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同插槽，單次註冊呼叫。附加的提示詞與語料庫輔助函式
    （`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`）不受影響。

  </Accordion>

  <Accordion title="記憶體嵌入供應商 API">
    **舊版**：`api.registerMemoryEmbeddingProvider(...)` 加上
    `contracts.memoryEmbeddingProviders`。

    **新版**：`api.registerEmbeddingProvider(...)` 加上
    `contracts.embeddingProviders`。

    通用嵌入供應商合約可在記憶體之外重複使用，
    也是新供應商所支援的路徑。記憶體專屬註冊 API
    在現有供應商遷移期間，仍作為已棄用的相容性機制連接。
    外掛檢查會將非內建外掛的使用情形回報為相容性債務。

  </Accordion>

  <Accordion title="原始頻道傳送結果 -> OutboundDeliveryResult">
    **舊版**：透過 `ChannelSendRawResult` 回傳
    `{ ok, messageId, error }`，並使用
    `createRawChannelSendResultAdapter(...)` 將其正規化。

    **新版**：回傳 `OutboundDeliveryResult` 欄位，並使用
    `createAttachedChannelResultAdapter(...)` 附加頻道。傳送失敗時應擲回例外，
    而非回傳錯誤字串。原始結果型別會持續可用，直到下一個
    外掛 SDK 主要版本。

  </Accordion>

  <Accordion title="子代理工作階段訊息型別重新命名">
    仍從 `src/plugins/runtime/types.ts` 匯出的兩個舊版型別別名：

    | 舊版                           | 新版                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    執行階段方法 `readSession` 已棄用，請改用
    `getSessionMessages`。簽章相同；舊方法會轉呼叫新方法。

  </Accordion>

  <Accordion title="已移除的工作階段與逐字稿檔案 API">
    切換至 SQLite 工作階段／逐字稿後，會移除或棄用向外掛公開使用中
    `sessions.json` 儲存區、JSONL 逐字稿路徑或工作階段檔案清單的 API。
    執行階段外掛應使用工作階段身分與 SDK 執行階段輔助函式，
    而非解析或變更使用中的檔案。

    | 遷移介面 | 替代方案 |
    | ----------------- | ----------- |
    | 已棄用的 `loadSessionStore(...)`、`updateSessionStore(...)` 和 `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`、`listSessionEntries(...)`，以及資料列層級的工作階段變更。 |
    | 已棄用的 `resolveSessionFilePath(...)` | 工作階段身分（`sessionKey`、`sessionId` 和 SDK 執行階段目標輔助函式），加上操作目前工作階段的閘道方法。 |
    | 已移除的 `saveSessionStore(...)` | 由閘道擁有的工作階段執行階段 API；外掛程式碼應透過已記錄的執行階段／上下文輔助函式要求或變更工作階段狀態，而非寫入使用中的儲存區檔案。 |
    | 已移除的 `resolveSessionTranscriptPathInDir(...)` 和 `resolveAndPersistSessionFile(...)` | 工作階段身分，以及操作目前工作階段的閘道方法。 |
    | `readLatestAssistantTextFromSessionTranscript(...)` | 目前執行階段上下文公開的身分識別型逐字稿讀取器；若外掛不在逐字稿擁有者路徑中，則使用閘道歷程記錄／工作階段方法。 |
    | `SessionTranscriptUpdate.sessionFile` | 搭配 `agentId`、`sessionKey` 和 `sessionId` 的 `SessionTranscriptUpdate.target`。 |
    | `sessionFiles` 等記憶體同步輸入 | 主機提供的身分識別型逐字稿／工作階段來源；請勿為即時工作階段搜遍使用中的 JSONL 檔案。 |
    | 使用中工作階段內名為 `transcriptPath` 或 `sessionFile` 的執行階段選項 | 攜帶儲存空間中立工作階段身分的 `sessionTarget`／執行階段目標物件。 |

    舊版 JSONL 逐字稿檔案仍可作為匯入、封存、匯出與支援成品。
    它們不再是使用中工作階段的穩態執行階段合約。

    隨 `v2026.7.1-beta.5` 發布的官方外掛匯入了上述四個已棄用的輔助函式。
    `openclaw/plugin-sdk/session-store-runtime` 會維持該完全相同的橋接至
    2026-10-12；新外掛必須使用替代方案。
    `resolveStorePath(...)` 仍是受支援的 SDK 輔助函式，不屬於此次棄用範圍。

    `openclaw plugins inspect --all --runtime` 會回報載入錯誤或診斷仍參照這些已移除檔案 API 的非內建外掛。
    `@openclaw/plugin-inspector` 諮詢掃描必須使用 `0.3.17` 或更新版本，
    讓外部套件掃描也能在發布前標記整體儲存區工作階段輔助函式、
    工作階段檔案路徑輔助函式、舊版逐字稿檔案目標，以及低階逐字稿輔助函式。

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **舊版**：`runtime.tasks.flow`（單數）回傳即時 TaskFlow 存取器。

    **新版**：`runtime.tasks.managedFlows` 為從流程建立、更新、取消或執行子工作
    的外掛保留受管理的 TaskFlow 變更執行階段。當外掛僅需以 DTO 為基礎的
    讀取功能時，請使用 `runtime.tasks.flows`。

    ```typescript
    // 之前
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // 之後
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    舊版別名已於 2026 年 7 月移除。

  </Accordion>

  <Accordion title="內嵌擴充功能工廠 -> 代理工具結果中介軟體">
    上方的[如何遷移](#how-to-migrate)已有說明。為求完整，此處再次列出：
    已移除且僅供內嵌執行器使用的
    `api.registerEmbeddedExtensionFactory(...)` 路徑，已由
    `api.registerAgentToolResultMiddleware(...)` 取代，並在
    `contracts.agentToolResultMiddleware` 中使用明確的執行階段清單。
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
`extensions/` 下的內建頻道／供應商外掛中）會在其各自的 `api.ts` 與 `runtime-api.ts`
公開模組中追蹤。它們不影響第三方外掛合約，因此未列於此處。
如果你直接使用內建外掛的本機公開模組，請先閱讀該公開模組中的
棄用註解，再進行升級。
</Note>

## Talk 與即時語音遷移

即時語音、電話、會議與瀏覽器 Talk 程式碼共用一個由 `openclaw/plugin-sdk/realtime-voice`
匯出的 Talk 工作階段控制器。該控制器擁有通用 Talk 事件封裝、
使用中輪次狀態、擷取狀態、輸出音訊狀態、最近事件歷程記錄，
以及過時輪次拒絕機制。供應商外掛擁有廠商專屬的即時工作階段。
瀏覽器會議外掛使用 `openclaw/plugin-sdk/meeting-runtime` 處理工作階段、瀏覽器、音訊、節點主機、
代理諮詢與語音通話機制，再實作 `MeetingPlatformAdapter`
以處理 URL 規則、DOM 指令碼、手動動作對應、字幕、建立與撥入
方案。平台 REST API、OAuth、成品、選取器與線路名稱仍保留在
外掛中。瀏覽器權限方案會接收所要求的會議 URL，讓各平台僅授予
其確切支援的來源。工作階段執行階段也必須在確認離開瀏覽器後，
將平台專屬的即時健康狀態正規化；歷史逐字稿欄位可以保留，
但離開後字幕與音訊就緒狀態不得維持啟用。

所有內建介面都在共用控制器上執行：瀏覽器轉送、
受管理會議室移交、語音通話即時處理、語音通話串流 STT、Google
Meet 即時處理，以及原生按住說話。閘道在 `hello-ok.features.events`
中公告一個即時 Talk 事件頻道：`talk.event`。

除非要實作低階配接器或測試固定資料，否則新程式碼不應直接呼叫
`createTalkEventSequencer(...)`。請使用共用控制器，確保沒有輪次 ID 時無法發出
輪次範圍事件、過時的 `turnEnd` /
`turnCancel` 呼叫無法清除較新的使用中輪次，並讓輸出音訊生命週期事件
在電話、會議、瀏覽器轉送、受管理會議室移交與原生 Talk 用戶端之間保持一致。

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

由瀏覽器擁有的 WebRTC／供應商 WebSocket 工作階段使用 `talk.client.create`，
因為瀏覽器負責供應商協商與媒體傳輸，而
閘道負責認證資訊、指示與工具政策。`talk.session.*` 是
閘道管理的共用介面，適用於閘道中繼即時處理、閘道中繼
轉錄，以及受管理房間的原生 STT／TTS 工作階段。

若舊版設定將即時選擇器放在 `talk.provider`／
`talk.providers` 旁，應使用 `openclaw doctor --fix` 修復；執行階段 Talk
不會將語音／TTS 供應商設定重新解讀為即時供應商設定。

支援的 `talk.session.create` 組合刻意保持精簡：

| 模式            | 傳輸方式       | 核心           | 擁有者              | 備註                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | 閘道            | 透過閘道橋接全雙工供應商音訊；工具呼叫透過 agent-consult 工具路由。           |
| `transcription` | `gateway-relay` | `none`          | 閘道            | 僅串流 STT；呼叫端傳送輸入音訊並接收轉錄事件。                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生／用戶端房間 | 按鍵通話與對講機式房間，由用戶端負責擷取／播放，閘道負責回合狀態。 |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生／用戶端房間 | 僅限管理員的房間模式，供受信任的第一方介面直接執行閘道工具動作。                  |

供從舊版 `talk.realtime.*`／
`talk.transcription.*`／`talk.handoff.*` 系列（均已移除）遷移的讀者參考的方法對照表：

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

| 方法                          | 適用範圍                                              | 契約                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`、`transcription/gateway-relay` | 將 base64 PCM 音訊區塊附加至由同一閘道連線擁有的供應商工作階段。                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 開始受管理房間的使用者回合。                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 通過過期回合驗證後結束作用中的回合。                                                                                                                                                                          |
| `talk.session.cancelTurn`       | 所有閘道擁有的工作階段                              | 取消某一回合中作用中的擷取／供應商／代理程式／TTS 工作。                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助理音訊輸出，但不一定結束使用者回合。                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 在其橋接器公開的任何非同步完成程序結束後，完成供應商工具呼叫；傳入 `options.willContinue` 以提供中間輸出，或在支援時傳入 `options.suppressResponse`，以避免再次產生助理回應。 |
| `talk.session.steer`            | 由代理程式支援的 Talk 工作階段                              | 將語音 `status`、`steer`、`cancel` 或 `followup` 控制傳送至從 Talk 工作階段解析出的作用中內嵌執行。                                                                                                 |
| `talk.session.close`            | 所有統一工作階段                                    | 停止中繼工作階段或撤銷受管理房間狀態，然後忘記統一工作階段 ID。                                                                                                                                     |

請勿為了實現此功能而在核心中加入供應商或平台特例。
核心負責 Talk 工作階段語意。供應商外掛負責廠商工作階段設定。
語音通話與 Google Meet 負責電話／會議配接器。瀏覽器與原生
應用程式負責裝置擷取／播放的使用者體驗。

## 移除時程

| 時間                                        | 發生事項                                                                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **現在**                                     | 可發出警告的已棄用介面會發出執行階段警告；儲存庫防護會拒絕核心與內建外掛匯入已棄用的 SDK。 |
| **每筆相容性記錄的 `removeAfter` 日期** | 該特定介面可予移除；日期一過，`pnpm plugins:boundary-report --fail-on-eligible-compat` 就會使 CI 失敗。    |
| **下一個主要版本**                      | 任何仍未遷移的介面都會被移除；仍在使用這些介面的外掛將會失敗。                                                          |

以下剩餘的公開 SDK 子路徑具有由登錄檔支援的移除期限。
7 月 30 日的項目已在維護者提早授權的清理後移除：
未使用的子路徑已刪除、先前的相容性別名已刪除，且
僅供內建使用的模組已降級為私有本機建置對應。

| `removeAfter` | 層級                               | SDK 子路徑                                                                                                                                                           |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-08-15`  | 較早的相容性棄用項目 | `agent-config-primitives`、`channel-logging`、`channel-secret-runtime`、`channel-streaming`、`group-access`、`inbound-reply-dispatch`、`matrix`、`text-runtime`、`zod` |
| `2026-09-01`  | 較早的相容性棄用項目 | `channel-lifecycle`、`channel-message`、`channel-reply-pipeline`、`config-runtime`、`infra-runtime`                                                                    |

所有核心外掛都已完成遷移。外部外掛應在
下一個主要版本前完成遷移。執行 `pnpm plugins:boundary-report`，即可查看你的外掛所用介面中
哪些相容性記錄最早即將到期。

## 暫時抑制警告

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

這只是暫時的應急途徑，不是永久解決方案。

## 相關內容

- [開始使用](/zh-TW/plugins/building-plugins) - 建置你的第一個外掛
- [SDK 概觀](/zh-TW/plugins/sdk-overview) - 完整的子路徑匯入參考
- [頻道外掛](/zh-TW/plugins/sdk-channel-plugins) - 建置頻道外掛
- [供應商外掛](/zh-TW/plugins/sdk-provider-plugins) - 建置供應商外掛
- [外掛內部原理](/zh-TW/plugins/architecture) - 深入探討架構
- [外掛資訊清單](/zh-TW/plugins/manifest) - 資訊清單結構描述參考
