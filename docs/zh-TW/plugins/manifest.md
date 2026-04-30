---
read_when:
    - 你正在建置 OpenClaw Plugin
    - 你需要發布 Plugin 設定結構描述或偵錯 Plugin 驗證錯誤
summary: Plugin 資訊清單 + JSON 結構描述要求（嚴格設定驗證）
title: Plugin 資訊清單
x-i18n:
    generated_at: "2026-04-30T03:24:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

此頁僅適用於**原生 OpenClaw Plugin 資訊清單**。

相容的套件組合版面配置請參閱 [Plugin 套件組合](/zh-TW/plugins/bundles)。

相容的套件組合格式使用不同的資訊清單檔案：

- Codex 套件組合：`.codex-plugin/plugin.json`
- Claude 套件組合：`.claude-plugin/plugin.json`，或不含資訊清單的預設 Claude 元件
  版面配置
- Cursor 套件組合：`.cursor-plugin/plugin.json`

OpenClaw 也會自動偵測這些套件組合版面配置，但它們不會依照此處描述的
`openclaw.plugin.json` 結構描述進行驗證。

對於相容的套件組合，當版面配置符合 OpenClaw 執行階段預期時，OpenClaw 目前會讀取套件組合中繼資料，以及宣告的
skill 根目錄、Claude 命令根目錄、Claude 套件組合 `settings.json` 預設值、
Claude 套件組合 LSP 預設值，以及支援的 hook 套件組。

每個原生 OpenClaw Plugin **都必須**在
**Plugin 根目錄**中隨附 `openclaw.plugin.json` 檔案。OpenClaw 會使用此資訊清單，在
**不執行 Plugin 程式碼**的情況下驗證設定。缺少或無效的資訊清單會被視為
Plugin 錯誤，並阻止設定驗證。

請參閱完整的 Plugin 系統指南：[Plugins](/zh-TW/tools/plugin)。
原生能力模型與目前的外部相容性指引請參閱：
[能力模型](/zh-TW/plugins/architecture#public-capability-model)。

## 這個檔案的用途

`openclaw.plugin.json` 是 OpenClaw 在**載入你的
Plugin 程式碼之前**讀取的中繼資料。以下所有內容都必須足夠輕量，能在不啟動
Plugin 執行階段的情況下檢查。

**用於：**

- Plugin 身分、設定驗證，以及設定 UI 提示
- 驗證、入門設定與設置中繼資料（別名、自動啟用、提供者環境變數、驗證選項）
- 控制平面介面的啟用提示
- 模型家族擁有權的簡寫
- 靜態能力擁有權快照（`contracts`）
- 共用 `openclaw qa` 主機可檢查的 QA 執行器中繼資料
- 合併到目錄和驗證介面中的頻道專用設定中繼資料

**請勿用於：**註冊執行階段行為、宣告程式碼進入點，
或 npm 安裝中繼資料。這些應放在你的 Plugin 程式碼和 `package.json` 中。

## 最小範例

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## 完整範例

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## 頂層欄位參考

| 欄位                                 | 必填     | 類型                             | 含義                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是       | `string`                         | 標準 Plugin id。這是在 `plugins.entries.<id>` 中使用的 id。                                                                                                                                                                       |
| `configSchema`                       | 是       | `object`                         | 此 Plugin 設定的內嵌 JSON Schema。                                                                                                                                                                                               |
| `enabledByDefault`                   | 否       | `true`                           | 將內建 Plugin 標記為預設啟用。省略它，或設定任何非 `true` 的值，會讓 Plugin 維持預設停用。                                                                                                                                        |
| `legacyPluginIds`                    | 否       | `string[]`                       | 會正規化為此標準 Plugin id 的舊版 id。                                                                                                                                                                                           |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                       | 當驗證、設定或模型參照提到這些提供者 id 時，應自動啟用此 Plugin 的提供者 id。                                                                                                                                                    |
| `kind`                               | 否       | `"memory"` \| `"context-engine"` | 宣告由 `plugins.slots.*` 使用的互斥 Plugin 種類。                                                                                                                                                                                 |
| `channels`                           | 否       | `string[]`                       | 此 Plugin 擁有的通道 id。用於探索與設定驗證。                                                                                                                                                                                    |
| `providers`                          | 否       | `string[]`                       | 此 Plugin 擁有的提供者 id。                                                                                                                                                                                                      |
| `providerDiscoveryEntry`             | 否       | `string`                         | 輕量的提供者探索模組路徑，相對於 Plugin 根目錄，用於 manifest 範圍內的提供者目錄中繼資料，可在不啟動完整 Plugin 執行階段的情況下載入。                                                                                         |
| `modelSupport`                       | 否       | `object`                         | manifest 擁有的模型系列中繼資料簡寫，用於在執行階段前自動載入 Plugin。                                                                                                                                                           |
| `modelCatalog`                       | 否       | `object`                         | 此 Plugin 擁有的提供者所用的宣告式模型目錄中繼資料。這是未來唯讀列表、導覽設定、模型選擇器、別名與抑制功能的控制平面合約，無需載入 Plugin 執行階段。                                                                            |
| `modelPricing`                       | 否       | `object`                         | 提供者擁有的外部定價查詢政策。使用它可讓本機/自架提供者排除遠端定價目錄，或將提供者參照對應到 OpenRouter/LiteLLM 目錄 id，而不在核心中硬編碼提供者 id。                                                                         |
| `modelIdNormalization`               | 否       | `object`                         | 提供者擁有的模型 id 別名/前綴清理，必須在提供者執行階段載入前執行。                                                                                                                                                              |
| `providerEndpoints`                  | 否       | `object[]`                       | manifest 擁有的端點 host/baseUrl 中繼資料，用於核心在提供者執行階段載入前必須分類的提供者路由。                                                                                                                                  |
| `providerRequest`                    | 否       | `object`                         | 泛用請求政策在提供者執行階段載入前使用的低成本提供者系列與請求相容性中繼資料。                                                                                                                                                  |
| `cliBackends`                        | 否       | `string[]`                       | 此 Plugin 擁有的 CLI 推論後端 id。用於從明確設定參照進行啟動時自動啟用。                                                                                                                                                         |
| `syntheticAuthRefs`                  | 否       | `string[]`                       | 在冷模型探索期間、執行階段載入前，應探測其 Plugin 擁有的合成驗證 hook 的提供者或 CLI 後端參照。                                                                                                                                  |
| `nonSecretAuthMarkers`               | 否       | `string[]`                       | 內建 Plugin 擁有的 placeholder API key 值，代表非祕密的本機、OAuth 或環境憑證狀態。                                                                                                                                              |
| `commandAliases`                     | 否       | `object[]`                       | 此 Plugin 擁有的命令名稱，應在執行階段載入前產生具備 Plugin 感知能力的設定與 CLI 診斷。                                                                                                                                          |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`       | 已棄用的相容性 env 中繼資料，用於提供者驗證/狀態查詢。新 Plugin 偏好使用 `setup.providers[].envVars`；OpenClaw 在棄用窗口期間仍會讀取此項。                                                                                      |
| `providerAuthAliases`                | 否       | `Record<string, string>`         | 應重用另一個提供者 id 進行驗證查詢的提供者 id，例如共用基礎提供者 API key 與驗證設定檔的程式碼提供者。                                                                                                                          |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`       | OpenClaw 可在不載入 Plugin 程式碼的情況下檢查的低成本通道 env 中繼資料。將此用於泛用啟動/設定輔助工具應能看見的 env 驅動通道設定或驗證介面。                                                                                    |
| `providerAuthChoices`                | 否       | `object[]`                       | 用於導覽設定選擇器、偏好提供者解析，以及簡易 CLI 旗標接線的低成本驗證選項中繼資料。                                                                                                                                              |
| `activation`                         | 否       | `object`                         | 用於啟動、提供者、命令、通道、路由與能力觸發載入的低成本啟用規劃器中繼資料。僅限中繼資料；實際行為仍由 Plugin 執行階段擁有。                                                                                                    |
| `setup`                              | 否       | `object`                         | 探索與設定介面可在不載入 Plugin 執行階段的情況下檢查的低成本設定/導覽描述元。                                                                                                                                                    |
| `qaRunners`                          | 否       | `object[]`                       | 共享 `openclaw qa` host 在 Plugin 執行階段載入前使用的低成本 QA runner 描述元。                                                                                                                                                   |
| `contracts`                          | 否       | `object`                         | 外部驗證 hook、語音、即時轉錄、即時語音、媒體理解、圖片生成、音樂生成、影片生成、網頁擷取、網頁搜尋與工具擁有權的靜態內建能力快照。                                                                                             |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`         | 在 `contracts.mediaUnderstandingProviders` 中宣告的提供者 id 所用的低成本媒體理解預設值。                                                                                                                                         |
| `channelConfigs`                     | 否       | `Record<string, object>`         | manifest 擁有的通道設定中繼資料，在執行階段載入前合併進探索與驗證介面。                                                                                                                                                         |
| `skills`                             | 否       | `string[]`                       | 要載入的 Skill 目錄，相對於 Plugin 根目錄。                                                                                                                                                                                       |
| `name`                               | 否       | `string`                         | 人類可讀的 Plugin 名稱。                                                                                                                                                                                                         |
| `description`                        | 否       | `string`                         | 顯示於 Plugin 介面中的簡短摘要。                                                                                                                                                                                                 |
| `version`                            | 否       | `string`                         | 資訊性 Plugin 版本。                                                                                                                                                                                                             |
| `uiHints`                            | 否       | `Record<string, object>`         | 設定欄位的 UI 標籤、placeholder 與敏感度提示。                                                                                                                                                                                    |

## providerAuthChoices 參考

每個 `providerAuthChoices` 項目都描述一個導覽設定或驗證選項。
OpenClaw 會在提供者執行階段載入前讀取此項。
提供者設定列表會使用這些 manifest 選項、由描述元衍生的設定
選項，以及安裝目錄中繼資料，而不載入提供者執行階段。

| 欄位                  | 必填     | 類型                                            | 含義                                                                                                     |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | 是       | `string`                                        | 此選擇所屬的提供者 ID。                                                                                  |
| `method`              | 是       | `string`                                        | 要分派到的驗證方法 ID。                                                                                  |
| `choiceId`            | 是       | `string`                                        | 入門設定和 CLI 流程使用的穩定驗證選擇 ID。                                                               |
| `choiceLabel`         | 否       | `string`                                        | 面向使用者的標籤。若省略，OpenClaw 會退回使用 `choiceId`。                                               |
| `choiceHint`          | 否       | `string`                                        | 選擇器的簡短輔助文字。                                                                                   |
| `assistantPriority`   | 否       | `number`                                        | 較低的值會在由助理驅動的互動式選擇器中較早排序。                                                         |
| `assistantVisibility` | 否       | `"visible"` \| `"manual-only"`                  | 從助理選擇器隱藏此選擇，同時仍允許手動 CLI 選取。                                                        |
| `deprecatedChoiceIds` | 否       | `string[]`                                      | 應將使用者重新導向到此替代選擇的舊版選擇 ID。                                                            |
| `groupId`             | 否       | `string`                                        | 用於將相關選擇分組的選用群組 ID。                                                                        |
| `groupLabel`          | 否       | `string`                                        | 該群組面向使用者的標籤。                                                                                 |
| `groupHint`           | 否       | `string`                                        | 群組的簡短輔助文字。                                                                                     |
| `optionKey`           | 否       | `string`                                        | 簡單單一旗標驗證流程的內部選項鍵。                                                                       |
| `cliFlag`             | 否       | `string`                                        | CLI 旗標名稱，例如 `--openrouter-api-key`。                                                              |
| `cliOption`           | 否       | `string`                                        | 完整 CLI 選項形式，例如 `--openrouter-api-key <key>`。                                                   |
| `cliDescription`      | 否       | `string`                                        | CLI 說明中使用的描述。                                                                                   |
| `onboardingScopes`    | 否       | `Array<"text-inference" \| "image-generation">` | 此選擇應出現在哪些入門設定介面中。若省略，預設為 `["text-inference"]`。                                  |

## commandAliases 參考

當 Plugin 擁有一個使用者可能會誤放進 `plugins.allow`，或嘗試作為根 CLI 命令執行的執行階段命令名稱時，請使用 `commandAliases`。OpenClaw 會使用這份中繼資料進行診斷，而不匯入 Plugin 執行階段程式碼。

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| 欄位         | 必填     | 類型              | 含義                                                                    |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | 是       | `string`          | 屬於此 Plugin 的命令名稱。                                              |
| `kind`       | 否       | `"runtime-slash"` | 將別名標記為聊天斜線命令，而不是根 CLI 命令。                           |
| `cliCommand` | 否       | `string`          | 若存在，建議用於 CLI 操作的相關根 CLI 命令。                            |

## activation 參考

當 Plugin 能以低成本宣告哪些控制平面事件應將其納入啟用/載入計畫時，請使用 `activation`。

此區塊是規劃器中繼資料，不是生命週期 API。它不會註冊執行階段行為、不會取代 `register(...)`，也不保證 Plugin 程式碼已經執行。啟用規劃器會使用這些欄位，在退回使用既有資訊清單擁有權中繼資料（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks）之前，縮小候選 Plugin 範圍。

優先使用已描述擁有權的最窄中繼資料。當 `providers`、`channels`、`commandAliases`、setup 描述子或 `contracts` 能表達該關係時，請使用那些欄位。對於無法由這些擁有權欄位表示的額外規劃器提示，才使用 `activation`。
針對 CLI 執行階段別名（例如 `claude-cli`、`codex-cli` 或 `google-gemini-cli`），請使用頂層 `cliBackends`；`activation.onAgentHarnesses` 僅適用於尚未有擁有權欄位的嵌入式代理工具鏈 ID。

此區塊僅為中繼資料。它不會註冊執行階段行為，也不會取代 `register(...)`、`setupEntry` 或其他執行階段/Plugin 進入點。目前的消費者會在更廣泛地載入 Plugin 之前，將其作為縮小範圍的提示，因此缺少啟用中繼資料通常只會影響效能；只要舊版資訊清單擁有權退回機制仍存在，就不應改變正確性。

隨著 OpenClaw 逐步擺脫隱含的啟動匯入，每個 Plugin 都應有意識地設定 `activation.onStartup`。只有當 Plugin 必須在 Gateway 啟動期間執行時，才將其設為 `true`。當 Plugin 在啟動時為惰性，且只應由更窄的觸發條件載入時，請將其設為 `false`。省略 `onStartup` 會保留已棄用的舊版隱含啟動附帶退回機制，適用於沒有靜態能力中繼資料的 Plugin；未來版本可能會停止在啟動時載入這些 Plugin，除非它們宣告 `activation.onStartup: true`。當 Plugin 仍依賴該退回機制時，Plugin 狀態和相容性報告會以 `legacy-implicit-startup-sidecar` 發出警告。

若要進行遷移測試，請設定 `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1`，以僅停用該已棄用的退回機制。此選擇加入模式不會阻擋明確的 `activation.onStartup: true` Plugin，或由頻道、設定、代理工具鏈、記憶體或其他更窄啟用觸發條件載入的 Plugin。

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| 欄位               | 必填     | 類型                                                 | 含義                                                                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否       | `boolean`                                            | 明確的 Gateway 啟動啟用。每個 Plugin 都應設定此項。`true` 會在啟動期間匯入 Plugin；`false` 會選擇退出已棄用的隱含附帶啟動退回機制，除非另一個相符觸發條件需要載入。 |
| `onProviders`      | 否       | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的提供者 ID。                                                                                                                                                                                      |
| `onAgentHarnesses` | 否       | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的嵌入式代理工具鏈執行階段 ID。CLI 後端別名請使用頂層 `cliBackends`。                                                                                                                              |
| `onCommands`       | 否       | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的命令 ID。                                                                                                                                                                                        |
| `onChannels`       | 否       | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的頻道 ID。                                                                                                                                                                                        |
| `onRoutes`         | 否       | `string[]`                                           | 應將此 Plugin 納入啟用/載入計畫的路由種類。                                                                                                                                                                                       |
| `onConfigPaths`    | 否       | `string[]`                                           | 當路徑存在且未被明確停用時，應將此 Plugin 納入啟動/載入計畫的根相對設定路徑。                                                                                                                                                     |
| `onCapabilities`   | 否       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面啟用規劃使用的廣泛能力提示。可行時優先使用更窄的欄位。                                                                                                                                                                   |

目前的即時消費者：

- Gateway 啟動規劃使用 `activation.onStartup` 進行明確啟動匯入，並選擇退出已棄用的隱含附帶啟動退回機制
- 由命令觸發的 CLI 規劃會退回使用舊版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 代理執行階段啟動規劃針對嵌入式工具鏈使用 `activation.onAgentHarnesses`，並針對 CLI 執行階段別名使用頂層 `cliBackends[]`
- 由頻道觸發的 setup/頻道規劃，會在缺少明確頻道啟用中繼資料時，退回使用舊版 `channels[]` 擁有權
- 啟動 Plugin 規劃會針對非頻道根設定介面使用 `activation.onConfigPaths`，例如內建瀏覽器 Plugin 的 `browser` 區塊
- 由提供者觸發的 setup/執行階段規劃，會在缺少明確提供者啟用中繼資料時，退回使用舊版 `providers[]` 和頂層 `cliBackends[]` 擁有權

規劃器診斷可以區分明確啟用提示與資訊清單擁有權退回。例如，`activation-command-hint` 表示 `activation.onCommands` 相符，而 `manifest-command-alias` 表示規劃器改用 `commandAliases` 擁有權。這些原因標籤用於主機診斷和測試；Plugin 作者應持續宣告最能描述擁有權的中繼資料。

## qaRunners 參考

當 Plugin 在共用的 `openclaw qa` 根之下貢獻一個或多個傳輸執行器時，請使用 `qaRunners`。保持這份中繼資料低成本且靜態；Plugin 執行階段仍透過輕量的 `runtime-api.ts` 介面擁有實際 CLI 註冊，該介面會匯出 `qaRunnerCliRegistrations`。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| 欄位          | 必填 | 類型     | 意義                                                               |
| ------------- | ---- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是   | `string` | 掛載在 `openclaw qa` 之下的子命令，例如 `matrix`。                 |
| `description` | 否   | `string` | 共用主機需要 stub 命令時使用的備用說明文字。                       |

## setup 參考

當設定與 onboarding 介面需要在 runtime 載入前取得低成本、由 Plugin 擁有的中繼資料時，請使用 `setup`。

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

頂層 `cliBackends` 仍然有效，並會繼續描述 CLI 推論後端。`setup.cliBackends` 是 setup 專用的描述子介面，用於應維持僅含中繼資料的 control-plane/setup 流程。

當存在時，`setup.providers` 與 `setup.cliBackends` 是 setup 探索偏好的描述子優先查找介面。如果描述子只縮小候選 Plugin 範圍，而 setup 仍需要更豐富的 setup-time runtime hook，請設定 `requiresRuntime: true`，並保留 `setup-api` 作為備用執行路徑。

OpenClaw 也會在一般提供者驗證與 env-var 查找中納入 `setup.providers[].envVars`。`providerAuthEnvVars` 在棄用視窗期間仍透過相容性轉接器支援，但仍使用它的非內建 Plugin 會收到 manifest 診斷。新的 Plugin 應將 setup/status env 中繼資料放在 `setup.providers[].envVars`。

當沒有 setup 項目可用，或 `setup.requiresRuntime: false` 宣告不需要 setup runtime 時，OpenClaw 也可以從 `setup.providers[].authMethods` 推導簡單的 setup 選項。明確的 `providerAuthChoices` 項目仍是自訂標籤、CLI 旗標、onboarding 範圍與助理中繼資料的偏好方式。

只有在這些描述子足以支援 setup 介面時，才設定 `requiresRuntime: false`。OpenClaw 會將明確的 `false` 視為僅描述子的合約，且不會執行 `setup-api` 或 `openclaw.setupEntry` 來進行 setup 查找。如果僅描述子的 Plugin 仍提供其中一個 setup runtime 項目，OpenClaw 會回報附加診斷並繼續忽略它。省略 `requiresRuntime` 會保留舊版備用行為，讓已加入描述子但未加入此旗標的現有 Plugin 不會中斷。

因為 setup 查找可以執行由 Plugin 擁有的 `setup-api` 程式碼，正規化後的 `setup.providers[].id` 與 `setup.cliBackends[]` 值在已探索的 Plugin 之間必須保持唯一。所有權不明確時會封閉失敗，而不是從探索順序中挑選勝者。

當 setup runtime 確實執行時，如果 `setup-api` 註冊了 manifest 描述子未宣告的提供者或 CLI 後端，或某個描述子沒有對應的 runtime 註冊，setup registry 診斷會回報描述子漂移。這些診斷是附加的，且不會拒絕舊版 Plugin。

### setup.providers 參考

| 欄位           | 必填 | 類型       | 意義                                                                                 |
| -------------- | ---- | ---------- | ------------------------------------------------------------------------------------ |
| `id`           | 是   | `string`   | setup 或 onboarding 期間公開的提供者 id。請讓正規化後的 id 在全域保持唯一。          |
| `authMethods`  | 否   | `string[]` | 此提供者在不載入完整 runtime 的情況下支援的 setup/auth 方法 id。                     |
| `envVars`      | 否   | `string[]` | 一般 setup/status 介面可在 Plugin runtime 載入前檢查的 env vars。                    |
| `authEvidence` | 否   | `object[]` | 可透過非秘密標記驗證之提供者的低成本本機驗證證據檢查。                              |

`authEvidence` 用於由提供者擁有、可在不載入 runtime 程式碼的情況下驗證的本機憑證標記。這些檢查必須維持低成本且本機化：不進行網路呼叫、不讀取 keychain 或 secret-manager、不執行 shell 命令，也不探測提供者 API。

支援的證據項目：

| 欄位               | 必填 | 類型       | 意義                                                                                                   |
| ------------------ | ---- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `type`             | 是   | `string`   | 目前為 `local-file-with-env`。                                                                         |
| `fileEnvVar`       | 否   | `string`   | 包含明確憑證檔案路徑的 env var。                                                                      |
| `fallbackPaths`    | 否   | `string[]` | 當 `fileEnvVar` 不存在或為空時檢查的本機憑證檔案路徑。支援 `${HOME}` 與 `${APPDATA}`。                 |
| `requiresAnyEnv`   | 否   | `string[]` | 列出的 env var 至少要有一個非空，證據才有效。                                                         |
| `requiresAllEnv`   | 否   | `string[]` | 列出的每個 env var 都必須非空，證據才有效。                                                           |
| `credentialMarker` | 是   | `string`   | 證據存在時傳回的非秘密標記。                                                                          |
| `source`           | 否   | `string`   | 用於 auth/status 輸出的面向使用者來源標籤。                                                           |

### setup 欄位

| 欄位               | 必填 | 類型       | 意義                                                                                     |
| ------------------ | ---- | ---------- | ---------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | setup 與 onboarding 期間公開的提供者 setup 描述子。                                      |
| `cliBackends`      | 否   | `string[]` | 用於描述子優先 setup 查找的 setup-time 後端 id。請讓正規化後的 id 在全域保持唯一。       |
| `configMigrations` | 否   | `string[]` | 此 Plugin 的 setup 介面擁有的設定遷移 id。                                               |
| `requiresRuntime`  | 否   | `boolean`  | setup 在描述子查找後是否仍需要執行 `setup-api`。                                         |

## uiHints 參考

`uiHints` 是從設定欄位名稱對應到小型呈現提示的 map。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

每個欄位提示可以包含：

| 欄位          | 類型       | 意義                         |
| ------------- | ---------- | ---------------------------- |
| `label`       | `string`   | 面向使用者的欄位標籤。       |
| `help`        | `string`   | 簡短的輔助文字。             |
| `tags`        | `string[]` | 選用 UI 標籤。               |
| `advanced`    | `boolean`  | 將欄位標記為進階。           |
| `sensitive`   | `boolean`  | 將欄位標記為秘密或敏感。     |
| `placeholder` | `string`   | 表單輸入的 placeholder 文字。 |

## contracts 參考

僅將 `contracts` 用於 OpenClaw 可在不匯入 Plugin runtime 的情況下讀取的靜態能力所有權中繼資料。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每個清單都是選用的：

| 欄位                             | 類型       | 意義                                                                  |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory id，目前為 `codex-app-server`。    |
| `agentToolResultMiddleware`      | `string[]` | 內建 Plugin 可為其註冊 tool-result middleware 的 runtime id。         |
| `externalAuthProviders`          | `string[]` | 此 Plugin 擁有其外部驗證 profile hook 的提供者 id。                   |
| `speechProviders`                | `string[]` | 此 Plugin 擁有的語音提供者 id。                                       |
| `realtimeTranscriptionProviders` | `string[]` | 此 Plugin 擁有的即時轉錄提供者 id。                                   |
| `realtimeVoiceProviders`         | `string[]` | 此 Plugin 擁有的即時語音提供者 id。                                   |
| `memoryEmbeddingProviders`       | `string[]` | 此 Plugin 擁有的記憶嵌入提供者 id。                                   |
| `mediaUnderstandingProviders`    | `string[]` | 此 Plugin 擁有的媒體理解提供者 id。                                   |
| `imageGenerationProviders`       | `string[]` | 此 Plugin 擁有的影像生成提供者 id。                                   |
| `videoGenerationProviders`       | `string[]` | 此 Plugin 擁有的影片生成提供者 id。                                   |
| `webFetchProviders`              | `string[]` | 此 Plugin 擁有的 Web 擷取提供者 id。                                  |
| `webSearchProviders`             | `string[]` | 此 Plugin 擁有的 Web 搜尋提供者 id。                                  |
| `migrationProviders`             | `string[]` | 此 Plugin 為 `openclaw migrate` 擁有的匯入提供者 id。                 |
| `tools`                          | `string[]` | 此 Plugin 為內建合約檢查擁有的代理工具名稱。                         |

`contracts.embeddedExtensionFactories` 保留給內建 Codex 僅限 app-server 的 extension factory。內建 tool-result 轉換應改為宣告 `contracts.agentToolResultMiddleware`，並以 `api.registerAgentToolResultMiddleware(...)` 註冊。外部 Plugin 無法註冊 tool-result middleware，因為該接縫可在模型看到高信任度工具輸出前重寫它。

實作 `resolveExternalAuthProfiles` 的提供者 Plugin 應宣告 `contracts.externalAuthProviders`。沒有此宣告的 Plugin 仍會透過已棄用的相容性備用路徑執行，但該備用路徑較慢，且會在遷移視窗後移除。

內建記憶嵌入提供者應為其公開的每個 adapter id 宣告 `contracts.memoryEmbeddingProviders`，包括 `local` 等內建 adapter。獨立 CLI 路徑會使用此 manifest 合約，在完整 Gateway runtime 註冊提供者之前，僅載入擁有者 Plugin。

## mediaUnderstandingProviderMetadata 參考

當媒體理解提供者具有預設模型、自動身分驗證後援優先順序，或通用核心輔助工具在執行階段載入前需要的原生文件支援時，請使用 `mediaUnderstandingProviderMetadata`。鍵也必須宣告於 `contracts.mediaUnderstandingProviders`。

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

每個提供者項目可以包含：

| 欄位                   | 類型                                | 含義                                                                         |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此提供者公開的媒體能力。                                                     |
| `defaultModels`        | `Record<string, string>`            | 當設定未指定模型時使用的能力到模型預設值。                                   |
| `autoPriority`         | `Record<string, number>`            | 數字越小，在依認證自動選擇提供者後援時排序越前。                             |
| `nativeDocumentInputs` | `"pdf"[]`                           | 提供者支援的原生文件輸入。                                                   |

## channelConfigs 參考

當頻道 Plugin 需要在執行階段載入前取得輕量設定中繼資料時，請使用 `channelConfigs`。唯讀頻道設置/狀態探索可以在沒有可用設置項目時，或當 `setup.requiresRuntime: false` 宣告不需要設置執行階段時，直接針對已設定的外部頻道使用此中繼資料。

`channelConfigs` 是 Plugin 清單中繼資料，不是新的頂層使用者設定區段。使用者仍然在 `channels.<channel-id>` 底下設定頻道執行個體。OpenClaw 會在 Plugin 執行階段程式碼執行前讀取清單中繼資料，以決定哪個 Plugin 擁有該已設定的頻道。

對於頻道 Plugin，`configSchema` 和 `channelConfigs` 描述不同路徑：

- `configSchema` 驗證 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 驗證 `channels.<channel-id>`

宣告 `channels[]` 的非隨附 Plugin 也應宣告相符的 `channelConfigs` 項目。沒有它們時，OpenClaw 仍可載入 Plugin，但冷路徑設定結構描述、設置與控制 UI 介面必須等到 Plugin 執行階段執行後，才能知道該頻道擁有的選項形狀。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以為在頻道執行階段載入前執行的命令設定檢查，宣告靜態 `auto` 預設值。隨附頻道也可以透過 `package.json#openclaw.channel.commands` 發布相同預設值，並與其其他套件擁有的頻道目錄中繼資料並列。

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

每個頻道項目可以包含：

| 欄位          | 類型                     | 含義                                                                                      |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON 結構描述。每個宣告的頻道設定項目皆需要。                         |
| `uiHints`     | `Record<string, object>` | 該頻道設定區段的選用 UI 標籤/預留位置/敏感提示。                                         |
| `label`       | `string`                 | 當執行階段中繼資料尚未就緒時，合併到選擇器與檢查介面的頻道標籤。                         |
| `description` | `string`                 | 用於檢查與目錄介面的簡短頻道描述。                                                       |
| `commands`    | `object`                 | 用於執行階段前設定檢查的靜態原生命令與原生 Skills 自動預設值。                           |
| `preferOver`  | `string[]`               | 此頻道在選取介面中應優先於的舊版或較低優先順序 Plugin ID。                               |

### 取代另一個頻道 Plugin

當你的 Plugin 是另一個 Plugin 也能提供之頻道 ID 的偏好擁有者時，請使用 `preferOver`。常見情況包括重新命名的 Plugin ID、取代隨附 Plugin 的獨立 Plugin，或為了設定相容性而保留相同頻道 ID 的維護分叉版本。

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

當設定了 `channels.chat` 時，OpenClaw 會同時考量頻道 ID 與偏好 Plugin ID。如果較低優先順序的 Plugin 只是因為它是隨附的或預設啟用而被選取，OpenClaw 會在有效的執行階段設定中停用它，讓單一 Plugin 擁有該頻道及其工具。明確的使用者選擇仍然優先：如果使用者明確啟用兩個 Plugin，OpenClaw 會保留該選擇，並回報重複的頻道/工具診斷，而不是悄悄變更請求的 Plugin 集合。

將 `preferOver` 限定於真正能提供相同頻道的 Plugin ID。它不是一般用途的優先順序欄位，也不會重新命名使用者設定鍵。

## modelSupport 參考

當 OpenClaw 應在 Plugin 執行階段載入前，從 `gpt-5.5` 或 `claude-sonnet-4.6` 這類簡寫模型 ID 推斷你的提供者 Plugin 時，請使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 會套用以下優先順序：

- 明確的 `provider/model` 參照會使用擁有方 `providers` 清單中繼資料
- `modelPatterns` 優先於 `modelPrefixes`
- 若一個非隨附 Plugin 和一個隨附 Plugin 都符合，非隨附 Plugin 優先
- 剩餘歧義會被忽略，直到使用者或設定指定提供者為止

欄位：

| 欄位            | 類型       | 含義                                                                            |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 以 `startsWith` 比對簡寫模型 ID 的前綴。                                        |
| `modelPatterns` | `string[]` | 移除設定檔尾碼後，針對簡寫模型 ID 比對的正規表示式來源。                       |

## modelCatalog 參考

當 OpenClaw 應在載入 Plugin 執行階段之前知道提供者模型中繼資料時，請使用 `modelCatalog`。這是由清單擁有的來源，用於固定目錄列、提供者別名、抑制規則與探索模式。執行階段重新整理仍屬於提供者執行階段程式碼，但清單會告訴核心何時需要執行階段。

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

頂層欄位：

| 欄位           | 類型                                                     | 含義                                                                                                        |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | 此 Plugin 擁有之提供者 ID 的目錄列。鍵也應出現在頂層 `providers` 中。                                      |
| `aliases`      | `Record<string, object>`                                 | 在目錄或抑制規劃中應解析為所擁有提供者的提供者別名。                                                       |
| `suppressions` | `object[]`                                               | 此 Plugin 因提供者特定原因而抑制的另一來源模型列。                                                         |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供者目錄是可以從清單中繼資料讀取、重新整理到快取，還是需要執行階段。                                     |

`aliases` 會參與模型目錄規劃的提供者擁有權查找。別名目標必須是同一個 Plugin 擁有的頂層提供者。當依提供者篩選的清單使用別名時，OpenClaw 可以讀取擁有方清單並套用別名 API/基底 URL 覆寫，而無需載入提供者執行階段。
別名不會展開未篩選的目錄列表；寬泛列表只會輸出擁有方的標準提供者列。

`suppressions` 會取代舊的提供者執行階段 `suppressBuiltInModel` 掛鉤。只有在提供者由該 Plugin 擁有，或被宣告為指向所擁有提供者的 `modelCatalog.aliases` 鍵時，才會採用抑制項目。在模型解析期間，不再呼叫執行階段抑制掛鉤。

提供者欄位：

| 欄位      | 類型                     | 含義                                                            |
| --------- | ------------------------ | ---------------------------------------------------------------- |
| `baseUrl` | `string`                 | 此提供者目錄中模型的選用預設基底 URL。                         |
| `api`     | `ModelApi`               | 此提供者目錄中模型的選用預設 API 配接器。                      |
| `headers` | `Record<string, string>` | 適用於此提供者目錄的選用靜態標頭。                             |
| `models`  | `object[]`               | 必要模型列。沒有 `id` 的列會被忽略。                            |

模型欄位：

| 欄位           | 型別                                                           | 含義                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | 提供者本地模型 ID，不含 `provider/` 前綴。                    |
| `name`          | `string`                                                       | 選用的顯示名稱。                                                      |
| `api`           | `ModelApi`                                                     | 選用的每模型 API 覆寫。                                            |
| `baseUrl`       | `string`                                                       | 選用的每模型基底 URL 覆寫。                                       |
| `headers`       | `Record<string, string>`                                       | 選用的每模型靜態標頭。                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模態。                                               |
| `reasoning`     | `boolean`                                                      | 模型是否公開推理行為。                               |
| `contextWindow` | `number`                                                       | 原生提供者上下文視窗。                                             |
| `contextTokens` | `number`                                                       | 當不同於 `contextWindow` 時，選用的有效執行階段上下文上限。 |
| `maxTokens`     | `number`                                                       | 已知時的最大輸出 token 數。                                           |
| `cost`          | `object`                                                       | 選用的每百萬 token 美元定價，包含選用的 `tieredPricing`。 |
| `compat`        | `object`                                                       | 選用的相容性旗標，對應 OpenClaw 模型設定相容性。  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表狀態。只有在該列完全不應出現時才抑制。          |
| `statusReason`  | `string`                                                       | 選用的原因，會與非可用狀態一起顯示。                            |
| `replaces`      | `string[]`                                                     | 此模型取代的舊提供者本地模型 ID。                       |
| `replacedBy`    | `string`                                                       | 已棄用列的替代提供者本地模型 ID。                    |
| `tags`          | `string[]`                                                     | 選擇器與篩選器使用的穩定標籤。                                    |

抑制欄位：

| 欄位                      | 型別       | 含義                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游列提供者 ID。必須由此 Plugin 擁有，或宣告為擁有的別名。 |
| `model`                    | `string`   | 要抑制的提供者本地模型 ID。                                                                      |
| `reason`                   | `string`   | 當直接要求被抑制的列時顯示的選用訊息。                                     |
| `when.baseUrlHosts`        | `string[]` | 抑制套用前所需的有效提供者基底 URL 主機選用清單。               |
| `when.providerConfigApiIn` | `string[]` | 抑制套用前所需的精確提供者設定 `api` 值選用清單。              |

不要將僅限執行階段的資料放入 `modelCatalog`。只有在資訊清單
列已足夠完整，使依提供者篩選的列表與選擇器介面能跳過
登錄/執行階段探索時，才使用 `static`。當資訊清單列可作為有用的
可列出種子或補充資料，但重新整理/快取稍後可以新增更多列時，
請使用 `refreshable`；refreshable 列本身不是權威來源。當 OpenClaw
必須載入提供者執行階段才能知道列表時，請使用 `runtime`。

## modelIdNormalization 參考

使用 `modelIdNormalization` 進行低成本、提供者擁有的模型 ID 清理，且必須
在提供者執行階段載入前發生。這會將短模型名稱、
提供者本地舊版 ID、代理前綴規則等別名保留在所屬 Plugin
資訊清單中，而不是放在核心模型選擇表內。

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

提供者欄位：

| 欄位                                | 型別                    | 含義                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不區分大小寫的精確模型 ID 別名。值會依原樣傳回。                  |
| `stripPrefixes`                      | `string[]`              | 在別名查詢前移除的前綴，適用於舊版提供者/模型重複情況。     |
| `prefixWhenBare`                     | `string`                | 當標準化後的模型 ID 尚未包含 `/` 時要加入的前綴。                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 別名查詢後的條件式裸 ID 前綴規則，以 `modelPrefix` 和 `prefix` 為鍵。 |

## providerEndpoints 參考

使用 `providerEndpoints` 定義通用請求政策在提供者執行階段載入前
必須知道的端點分類。核心仍擁有每個 `endpointClass` 的含義；
Plugin 資訊清單擁有主機與基底 URL 中繼資料。

端點欄位：

| 欄位                          | 型別       | 含義                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端點類別，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。        |
| `hosts`                        | `string[]` | 對應至端點類別的精確主機名稱。                                                |
| `hostSuffixes`                 | `string[]` | 對應至端點類別的主機後綴。以 `.` 開頭表示僅比對網域後綴。 |
| `baseUrls`                     | `string[]` | 對應至端點類別的精確標準化 HTTP(S) 基底 URL。                             |
| `googleVertexRegion`           | `string`   | 精確全域主機的靜態 Google Vertex 區域。                                            |
| `googleVertexRegionHostSuffix` | `string`   | 從相符主機移除的後綴，用來公開 Google Vertex 區域前綴。                 |

## providerRequest 參考

使用 `providerRequest` 提供通用請求政策所需的低成本請求相容性中繼資料，
且無需載入提供者執行階段。將特定行為的
酬載重寫保留在提供者執行階段 hook 或共用提供者系列 helper 中。

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

提供者欄位：

| 欄位                 | 型別         | 含義                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 通用請求相容性決策與診斷使用的提供者系列標籤。 |
| `compatibilityFamily` | `"moonshot"` | 共用請求 helper 的選用提供者系列相容性分組。              |
| `openAICompletions`   | `object`     | OpenAI 相容 completions 請求旗標，目前為 `supportsStreamingUsage`。       |

## modelPricing 參考

當提供者需要在執行階段載入前控制控制平面定價行為時，
使用 `modelPricing`。Gateway 定價快取會讀取此中繼資料，而不匯入
提供者執行階段程式碼。

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

提供者欄位：

| 欄位        | 型別              | 含義                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 對本機/自架提供者設為 `false`，使其絕不擷取 OpenRouter 或 LiteLLM 定價。 |
| `openRouter` | `false \| object` | OpenRouter 定價查詢對應。`false` 會停用此提供者的 OpenRouter 查詢。           |
| `liteLLM`    | `false \| object` | LiteLLM 定價查詢對應。`false` 會停用此提供者的 LiteLLM 查詢。                 |

來源欄位：

| 欄位                      | 型別               | 含義                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 當外部目錄提供者 ID 不同於 OpenClaw 提供者 ID 時使用，例如 `zai` 提供者的 `z-ai`。 |
| `passthroughProviderModel` | `boolean`          | 將包含斜線的模型 ID 視為巢狀提供者/模型參照，適用於 OpenRouter 等代理提供者。       |
| `modelIdTransforms`        | `"version-dots"[]` | 額外的外部目錄模型 ID 變體。`version-dots` 會嘗試如 `claude-opus-4.6` 的點號版本 ID。            |

### OpenClaw 提供者索引

OpenClaw 提供者索引是 OpenClaw 擁有的提供者預覽中繼資料，
適用於其 Plugin 可能尚未安裝的提供者。它不是 Plugin 資訊清單的一部分。
Plugin 資訊清單仍是已安裝 Plugin 的權威來源。提供者索引是
內部備援合約，未來的可安裝提供者與安裝前
模型選擇器介面會在提供者 Plugin 未安裝時使用它。

目錄權威順序：

1. 使用者設定。
2. 已安裝 Plugin 資訊清單 `modelCatalog`。
3. 來自明確重新整理的模型目錄快取。
4. OpenClaw 提供者索引預覽列。

Provider Index 不得包含秘密、啟用狀態、執行階段掛鉤，或
即時帳號特定模型資料。其預覽目錄使用與 Plugin 資訊清單相同的
`modelCatalog` 提供者列形狀，但應限於穩定的顯示中繼資料，除非像 `api`、
`baseUrl`、定價或相容性旗標等執行階段配接器欄位，是刻意與
已安裝的 Plugin 資訊清單保持一致。具備即時 `/models` 探索功能的提供者
應透過明確的模型目錄快取路徑寫入重新整理後的列，而不是讓一般清單列出或上線設定呼叫提供者 API。

Provider Index 項目也可以為其 Plugin 已移出核心或尚未安裝的提供者
攜帶可安裝 Plugin 中繼資料。此中繼資料鏡像通道目錄模式：套件名稱、npm 安裝規格、
預期完整性，以及低成本的驗證選擇標籤，已足以顯示
可安裝的設定選項。一旦安裝 Plugin，其資訊清單即優先適用，且
該提供者的 Provider Index 項目會被忽略。

舊版頂層能力鍵已棄用。使用 `openclaw doctor --fix` 將
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders` 移到 `contracts` 之下；一般
資訊清單載入不再將那些頂層欄位視為能力
擁有權。

## 資訊清單與 package.json

這兩個檔案負責不同工作：

| 檔案                   | 用途                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 探索、設定驗證、驗證選擇中繼資料，以及在 Plugin 程式碼執行前必須存在的 UI 提示                         |
| `package.json`         | npm 中繼資料、相依項安裝，以及用於進入點、安裝閘門、設定或目錄中繼資料的 `openclaw` 區塊 |

如果你不確定某項中繼資料屬於哪裡，請使用此規則：

- 如果 OpenClaw 必須在載入 Plugin 程式碼前知道它，請放在 `openclaw.plugin.json`
- 如果它與封裝、進入檔案或 npm 安裝行為有關，請放在 `package.json`

### 會影響探索的 package.json 欄位

某些執行階段前的 Plugin 中繼資料會刻意放在 `package.json` 的
`openclaw` 區塊下，而不是 `openclaw.plugin.json`。

重要範例：

| 欄位                                                             | 含義                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | 宣告原生 Plugin 進入點。必須留在 Plugin 套件目錄內。                                                                                                   |
| `openclaw.runtimeExtensions`                                      | 宣告已安裝套件的建置後 JavaScript 執行階段進入點。必須留在 Plugin 套件目錄內。                                                                 |
| `openclaw.setupEntry`                                             | 上線設定、延後通道啟動，以及唯讀通道狀態/SecretRef 探索期間使用的輕量設定專用進入點。必須留在 Plugin 套件目錄內。 |
| `openclaw.runtimeSetupEntry`                                      | 宣告已安裝套件的建置後 JavaScript 設定進入點。必須留在 Plugin 套件目錄內。                                                                |
| `openclaw.channel`                                                | 低成本通道目錄中繼資料，例如標籤、文件路徑、別名和選擇文案。                                                                                                 |
| `openclaw.channel.commands`                                       | 在通道執行階段載入前，由設定、稽核和命令清單介面使用的靜態原生命令與原生 skill 自動預設中繼資料。                                          |
| `openclaw.channel.configuredState`                                | 輕量的已設定狀態檢查器中繼資料，可在不載入完整通道執行階段的情況下回答「是否已存在僅 env 的設定？」                                         |
| `openclaw.channel.persistedAuthState`                             | 輕量的持久化驗證檢查器中繼資料，可在不載入完整通道執行階段的情況下回答「是否已有任何登入？」                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 內建與外部發布 Plugin 的安裝/更新提示。                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | 當有多個安裝來源可用時偏好的安裝路徑。                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | 支援的最低 OpenClaw 主機版本，使用像 `>=2026.3.22` 這樣的 semver 下限。                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | 預期的 npm dist 完整性字串，例如 `sha512-...`；安裝和更新流程會用它驗證擷取到的成品。                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | 當設定無效時，允許狹窄的內建 Plugin 重新安裝復原路徑。                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 讓設定專用通道介面在啟動期間、完整通道 Plugin 之前載入。                                                                                                 |

資訊清單中繼資料決定哪些提供者/通道/設定選項會在
執行階段載入前出現在上線設定中。`package.json#openclaw.install` 會告訴
上線設定在使用者選擇其中一個選項時，如何擷取或啟用該 Plugin。不要將安裝提示移入 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 會在安裝與資訊清單
登錄載入期間強制執行。無效值會被拒絕；較新但有效的值會在
較舊主機上略過該 Plugin。

精確的 npm 版本釘選已存在於 `npmSpec`，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目錄
項目應將精確規格搭配 `expectedIntegrity`，如此若擷取到的 npm 成品不再符合釘選版本，更新流程會封閉失敗。
為了相容性，互動式上線設定仍會提供受信任登錄的 npm 規格，包括裸
套件名稱和 dist-tags。目錄診斷可以
區分精確、浮動、完整性釘選、缺少完整性、套件名稱
不符，以及無效預設選擇來源。當
`expectedIntegrity` 存在但沒有可由它釘選的有效 npm 來源時，也會發出警告。
當 `expectedIntegrity` 存在時，
安裝/更新流程會強制執行它；當省略時，登錄解析會
在沒有完整性釘選的情況下被記錄。

當狀態、通道清單或 SecretRef 掃描需要在不載入完整
執行階段的情況下識別已設定帳號時，通道 Plugin 應提供 `openclaw.setupEntry`。
設定進入點應公開通道中繼資料，加上設定安全的設定、
狀態和秘密配接器；將網路用戶端、Gateway 監聽器和
傳輸執行階段保留在主要擴充進入點中。

執行階段進入點欄位不會覆寫來源
進入點欄位的套件邊界檢查。例如，`openclaw.runtimeExtensions` 無法讓
逸出邊界的 `openclaw.extensions` 路徑變成可載入。

`openclaw.install.allowInvalidConfigRecovery` 是刻意狹窄的。它不會
讓任意損壞設定變成可安裝。現今它只允許安裝
流程從特定過期內建 Plugin 升級失敗中復原，例如
缺少內建 Plugin 路徑，或同一個
內建 Plugin 的過期 `channels.<id>` 項目。無關的設定錯誤仍會阻擋安裝，並將操作人員
導向 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是供小型檢查器
模組使用的套件中繼資料：

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

當設定、doctor、狀態或唯讀存在性流程需要在完整通道 Plugin 載入前
進行低成本的是/否驗證探測時使用它。持久化驗證狀態並不是
已設定通道狀態：不要使用此中繼資料來自動啟用 Plugin、
修復執行階段相依項，或決定是否應載入通道執行階段。
目標匯出應是只讀取持久化狀態的小型函式；不要
透過完整通道執行階段 barrel 轉接它。

`openclaw.channel.configuredState` 對低成本僅 env
已設定檢查採用相同形狀：

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

當通道可以從 env 或其他小型
非執行階段輸入回答已設定狀態時使用它。如果檢查需要完整設定解析或真正的
通道執行階段，請將該邏輯保留在 Plugin `config.hasConfiguredState`
掛鉤中。

## 探索優先順序（重複的 Plugin id）

OpenClaw 會從數個根目錄探索 Plugin（內建、全域安裝、工作區、明確由設定選取的路徑）。如果兩個探索結果共用相同的 `id`，只會保留**最高優先順序**的資訊清單；較低優先順序的重複項會被捨棄，而不是並列載入。

優先順序，從高到低：

1. **設定選取** — 在 `plugins.entries.<id>` 中明確釘選的路徑
2. **內建** — 隨 OpenClaw 一起提供的 Plugin
3. **全域安裝** — 安裝到全域 OpenClaw Plugin 根目錄的 Plugin
4. **工作區** — 相對於目前工作區探索到的 Plugin

影響：

- 位於工作區中的內建 Plugin 分支或過期副本不會遮蔽內建建置。
- 若要實際以本機 Plugin 覆寫內建 Plugin，請透過 `plugins.entries.<id>` 釘選它，讓它憑優先順序勝出，而不是依賴工作區探索。
- 重複項捨棄會被記錄，讓 Doctor 和啟動診斷能指向被捨棄的副本。

## JSON Schema 要求

- **每個 Plugin 都必須隨附 JSON Schema**，即使它不接受任何設定。
- 空 schema 是可接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 會在設定讀取/寫入時驗證，而不是在執行階段。

## 驗證行為

- 未知的 `channels.*` 鍵是**錯誤**，除非該 channel id 已由
  Plugin manifest 宣告。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必須參照**可探索**的 Plugin id。未知 id 是**錯誤**。
- 如果 Plugin 已安裝，但 manifest 或 schema 損壞或缺失，
  驗證會失敗，Doctor 會回報 Plugin 錯誤。
- 如果 Plugin config 存在但 Plugin 已**停用**，config 會被保留，並且
  Doctor + 記錄中會顯示**警告**。

完整的 `plugins.*` schema 請參閱[設定參考](/zh-TW/gateway/configuration)。

## 備註

- manifest 是**原生 OpenClaw Plugin 的必要項目**，包含本機檔案系統載入。runtime 仍會另行載入 Plugin module；manifest 僅用於探索 + 驗證。
- 原生 manifest 會以 JSON5 解析，因此註解、尾隨逗號和未加引號的鍵都可接受，只要最終值仍然是物件即可。
- manifest loader 只會讀取已記載於文件的 manifest 欄位。請避免自訂頂層鍵。
- 當 Plugin 不需要時，`channels`、`providers`、`cliBackends` 和 `skills` 都可以省略。
- `providerDiscoveryEntry` 必須保持輕量，且不應匯入廣泛的 runtime code；請將它用於靜態 provider catalog metadata 或狹義的 discovery descriptor，而不是 request-time execution。
- Exclusive Plugin kind 透過 `plugins.slots.*` 選取：`kind: "memory"` 透過 `plugins.slots.memory`，`kind: "context-engine"` 透過 `plugins.slots.contextEngine`（預設為 `legacy`）。
- 請在此 manifest 中宣告 exclusive Plugin kind。runtime-entry `OpenClawPluginDefinition.kind` 已棄用，僅保留作為舊版 Plugin 的相容性 fallback。
- env-var metadata（`setup.providers[].envVars`、已棄用的 `providerAuthEnvVars` 和 `channelEnvVars`）僅具宣告性。Status、audit、Cron 傳遞驗證和其他唯讀介面，在將 env var 視為已設定之前，仍會套用 Plugin trust 和 effective activation policy。
- 需要 provider code 的 runtime wizard metadata，請參閱 [Provider runtime hooks](/zh-TW/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的 Plugin 依賴 native module，請記載建置步驟和任何 package-manager allowlist 需求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相關

<CardGroup cols={3}>
  <Card title="建置 Plugin" href="/zh-TW/plugins/building-plugins" icon="rocket">
    Plugin 入門。
  </Card>
  <Card title="Plugin 架構" href="/zh-TW/plugins/architecture" icon="diagram-project">
    內部架構與 capability model。
  </Card>
  <Card title="SDK 概覽" href="/zh-TW/plugins/sdk-overview" icon="book">
    Plugin SDK 參考與 subpath imports。
  </Card>
</CardGroup>
